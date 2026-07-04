/*
    Mesh MQTT Module - Реализация
    Поддерживает Paho MQTT Client
    Настройки для OneMesh (mqtt.onemesh.ru:1883)
    Поддерживает формат Meshtastic Protobuf
*/

#include "mesh-mqtt.h"
#include "mesh-packet.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <time.h>
#include <stdarg.h>
#include <signal.h>
#include <errno.h>
#include <ctype.h>

#ifdef USE_PAHO_MQTT
#include <MQTTClient.h>
#endif

// ============================================================================
// Глобальные переменные
// ============================================================================

static mesh_mqtt_config_t g_config = {0};
static mesh_mqtt_stats_t g_stats = {0};
static mesh_mqtt_callbacks_t g_callbacks = {0};
static int g_initialized = 0;
static int g_running = 0;
static pthread_t g_receive_thread;
static int g_receive_thread_running = 0;
static int g_should_exit = 0;
static mesh_connection_status_t g_status = MESH_STATUS_DISCONNECTED;

#ifdef USE_PAHO_MQTT
static MQTTClient g_client = NULL;
#endif

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Логирование сообщений
 */
static void log_message(const char *level, const char *format, ...) {
    va_list args;
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);

    fprintf(stderr, "[%02d:%02d:%02d] [%s] ",
            tm_info->tm_hour, tm_info->tm_min, tm_info->tm_sec, level);

    va_start(args, format);
    vfprintf(stderr, format, args);
    va_end(args);
    fprintf(stderr, "\n");
    fflush(stderr);
}

/**
 * Формирование полного адреса брокера
 */
static void build_broker_url(char *buffer, size_t size,
                             const char *host, int port, int use_tls) {
    if (use_tls) {
        snprintf(buffer, size, "ssl://%s:%d", host, port);
    } else {
        snprintf(buffer, size, "tcp://%s:%d", host, port);
    }
}

/**
 * Проверка, является ли данные Mesh-пакетом
 */
static int is_mesh_packet(const void *data, int len) {
    if (!data || len < 4) return 0;
    uint32_t magic = *(uint32_t*)data;
    return magic == 0x4D455348;
}

/**
 * Получить тип сообщения из топика
 */
static const char* get_topic_type(const char *topic) {
    if (!topic) return "unknown";

    const char *types[] = {"device", "stat", "telemetry", "position", "broadcast"};
    for (int i = 0; i < 5; i++) {
        if (strstr(topic, types[i])) {
            return types[i];
        }
    }
    return "other";
}

// ============================================================================
// Колбэки MQTT (Paho)
// ============================================================================

#ifdef USE_PAHO_MQTT

/**
 * Колбэк получения сообщения - поддерживает Mesh и Meshtastic Protobuf
 */
static int mqtt_message_callback(void *context, char *topicName,
                                  int topicLen, MQTTClient_message *message) {
    (void)topicLen;
    (void)context;

    if (!message || !message->payload) {
        log_message("WARN", "Invalid message received (NULL payload)");
        if (message) MQTTClient_freeMessage(&message);
        if (topicName) MQTTClient_free(topicName);
        return 1;
    }

    // Проверяем, что это наш Mesh-пакет (magic = 0x4D455348)
    int is_mesh = is_mesh_packet(message->payload, message->payloadlen);

    if (is_mesh) {
        // === Это наш Mesh-пакет ===
        if (message->payloadlen < (int)sizeof(mesh_packet_t)) {
            log_message("WARN", "Mesh packet too small: %d bytes (expected at least %zu)",
                        message->payloadlen, sizeof(mesh_packet_t));
            g_stats.packets_dropped++;
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        }

        mesh_packet_t *packet = (mesh_packet_t*)malloc(message->payloadlen);
        if (!packet) {
            log_message("ERROR", "Failed to allocate packet (out of memory)");
            g_stats.errors++;
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        }

        memcpy(packet, message->payload, message->payloadlen);

        g_stats.packets_received++;
        g_stats.bytes_received += message->payloadlen;
        g_stats.last_activity = time(NULL);

        if (g_config.verbose) {
            log_message("DEBUG", "Received Mesh packet from %s, size: %d bytes, type: %u, id: %llu",
                        topicName ? topicName : "unknown",
                        message->payloadlen, packet->type,
                        (unsigned long long)packet->packet_id);
        }

        // Вызываем пользовательский колбэк
        if (g_callbacks.on_message) {
            g_callbacks.on_message(packet);
        }

        if (g_callbacks.on_packet_received) {
            g_callbacks.on_packet_received(packet);
        }

        free(packet);
    } else {
        // === Это сообщение от Meshtastic (Protobuf) ===
        g_stats.packets_received++;
        g_stats.bytes_received += message->payloadlen;
        g_stats.last_activity = time(NULL);

        const char *type = get_topic_type(topicName);

        if (g_config.verbose) {
            log_message("INFO", "Received Meshtastic [%s] from %s, size: %d bytes (Protobuf)",
                        type, topicName ? topicName : "unknown", message->payloadlen);

            // Выводим превью данных для отладки
            if (g_config.log_packets && message->payloadlen > 0) {
                char hex[128] = {0};
                int show_bytes = message->payloadlen > 32 ? 32 : message->payloadlen;
                for (int i = 0; i < show_bytes; i++) {
                    char tmp[4];
                    snprintf(tmp, sizeof(tmp), "%02x ", ((unsigned char*)message->payload)[i]);
                    strcat(hex, tmp);
                    if ((i + 1) % 16 == 0) strcat(hex, "\n                 ");
                }
                if (message->payloadlen > 32) strcat(hex, "...");
                log_message("DEBUG", "Data preview: %s", hex);

                // Попытка интерпретировать как текст
                char text[65] = {0};
                int text_len = 0;
                for (int i = 0; i < message->payloadlen && text_len < 64; i++) {
                    unsigned char c = ((unsigned char*)message->payload)[i];
                    if (c >= 32 && c < 127) {
                        text[text_len++] = c;
                    } else {
                        text[text_len++] = '.';
                    }
                }
                if (text_len > 0) {
                    log_message("DEBUG", "Text preview: %s", text);
                }
            }
        }

        // Вызываем колбэк для Protobuf сообщений
        if (g_callbacks.on_protobuf_message) {
            g_callbacks.on_protobuf_message(topicName, message->payload,
                                            message->payloadlen, 0);
        }
    }

    MQTTClient_freeMessage(&message);
    MQTTClient_free(topicName);

    return 1;
}

/**
 * Колбэк потери соединения
 */
static void mqtt_connection_lost(void *context, char *cause) {
    (void)context;

    g_stats.is_connected = 0;
    g_stats.reconnect_count++;
    g_status = MESH_STATUS_DISCONNECTED;

    log_message("WARN", "Connection lost: %s", cause ? cause : "unknown");

    if (g_callbacks.on_disconnect) {
        g_callbacks.on_disconnect(-1, cause ? cause : "Connection lost");
    }
}

/**
 * Колбэк завершения доставки
 */
static void mqtt_delivery_complete(void *context, MQTTClient_deliveryToken dt) {
    (void)context;
    (void)dt;
}

#endif

// ============================================================================
// Поток для приема сообщений
// ============================================================================

#ifdef USE_PAHO_MQTT

/**
 * Поток для приема сообщений
 */
static void* receive_thread_func(void *arg) {
    (void)arg;

    log_message("INFO", "Receive thread started");
    g_receive_thread_running = 1;

    while (g_running && !g_should_exit) {
        // Проверяем состояние соединения
        if (!g_stats.is_connected && g_running) {
            log_message("WARN", "Not connected, attempting reconnect...");
            int rc = mesh_mqtt_connect();
            if (rc == 0) {
                log_message("INFO", "Reconnected successfully");
                mesh_mqtt_subscribe_all();
            } else {
                log_message("ERROR", "Reconnect failed: %d", rc);
                sleep(ONEMESH_RECONNECT_DELAY);
            }
        }

        // Спим и проверяем состояние
        for (int i = 0; i < 10 && g_running && !g_should_exit; i++) {
            sleep(1);
        }
    }

    g_receive_thread_running = 0;
    log_message("INFO", "Receive thread stopped");
    return NULL;
}

#endif

// ============================================================================
// Основные функции MQTT
// ============================================================================

int mesh_mqtt_init(const mesh_mqtt_config_t *config) {
    if (g_initialized) {
        log_message("WARN", "Already initialized");
        return 0;
    }

    if (!config) {
        log_message("ERROR", "NULL config");
        return -1;
    }

    // Копируем конфигурацию
    memcpy(&g_config, config, sizeof(mesh_mqtt_config_t));

    // Если broker не задан, но host и port заданы - формируем
    if (g_config.broker[0] == '\0' && g_config.host[0] != '\0') {
        build_broker_url(g_config.broker, sizeof(g_config.broker),
                        g_config.host, g_config.port, g_config.use_tls);
    }

    // Если host не задан, но broker задан - извлекаем host
    if (g_config.host[0] == '\0' && g_config.broker[0] != '\0') {
        char *start = strstr(g_config.broker, "://");
        if (start) {
            strncpy(g_config.host, start + 3, sizeof(g_config.host) - 1);
            // Убираем порт если есть
            char *colon = strchr(g_config.host, ':');
            if (colon) *colon = '\0';
        } else {
            strncpy(g_config.host, g_config.broker, sizeof(g_config.host) - 1);
        }
    }

    // Генерируем client_id если не задан
    if (g_config.client_id[0] == '\0') {
        snprintf(g_config.client_id, sizeof(g_config.client_id),
                 "mesh-%d-%ld", getpid(), (long)time(NULL));
    }

    // Валидация конфигурации
    if (!mesh_mqtt_config_valid(&g_config)) {
        log_message("ERROR", "Invalid configuration");
        return -1;
    }

#ifdef USE_PAHO_MQTT
    // Создаем клиент Paho
    int rc = MQTTClient_create(&g_client, g_config.broker,
                               g_config.client_id,
                               MQTTCLIENT_PERSISTENCE_NONE, NULL);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to create MQTT client: %s",
                    MQTTClient_strerror(rc));
        return -2;
    }

    // Устанавливаем колбэки
    rc = MQTTClient_setCallbacks(g_client, &g_stats, mqtt_connection_lost,
                                mqtt_message_callback, mqtt_delivery_complete);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to set callbacks: %s",
                    MQTTClient_strerror(rc));
        MQTTClient_destroy(&g_client);
        return -3;
    }

    log_message("INFO", "MQTT client created: %s", g_config.client_id);
#else
    log_message("ERROR", "No MQTT library support compiled (USE_PAHO_MQTT not defined)");
    return -4;
#endif

    g_initialized = 1;
    g_status = MESH_STATUS_DISCONNECTED;
    g_stats.start_time = time(NULL);

    log_message("INFO", "MQTT initialized: %s", g_config.broker);
    return 0;
}

int mesh_mqtt_init_default(void) {
    mesh_mqtt_config_t config = {0};

    // Настройки как в MQTT Explorer
    snprintf(config.broker, sizeof(config.broker), "%s", ONEMESH_BROKER_DEFAULT);
    snprintf(config.host, sizeof(config.host), "%s", ONEMESH_HOST_DEFAULT);
    config.port = ONEMESH_PORT_DEFAULT;
    snprintf(config.username, sizeof(config.username), "%s", ONEMESH_USERNAME_DEFAULT);
    snprintf(config.password, sizeof(config.password), "%s", ONEMESH_PASSWORD_DEFAULT);
    snprintf(config.topic_root, sizeof(config.topic_root), "%s", ONEMESH_TOPIC_ROOT_DEFAULT);
    snprintf(config.city_code, sizeof(config.city_code), "%s", ONEMESH_CITY_CODE_DEFAULT);

    config.use_tls = 0;
    config.keepalive = ONEMESH_KEEPALIVE_INTERVAL;
    config.qos = ONEMESH_DEFAULT_QOS;
    config.retain = 0;
    config.clean_session = 1;
    config.connect_timeout = ONEMESH_CONNECT_TIMEOUT;
    config.max_reconnect = ONEMESH_MAX_RECONNECT;
    config.reconnect_delay = ONEMESH_RECONNECT_DELAY;
    config.verbose = 0;
    config.log_messages = 0;
    config.log_packets = 0;
    config.parse_protobuf = 1;

    return mesh_mqtt_init(&config);
}

int mesh_mqtt_connect(void) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    if (g_stats.is_connected) {
        log_message("WARN", "Already connected");
        return 0;
    }

#ifdef USE_PAHO_MQTT
    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;
    MQTTClient_SSLOptions ssl_opts = MQTTClient_SSLOptions_initializer;

    // Настройки подключения
    conn_opts.username = g_config.username;
    conn_opts.password = g_config.password;
    conn_opts.keepAliveInterval = g_config.keepalive;
    conn_opts.cleansession = g_config.clean_session;
    conn_opts.MQTTVersion = MQTTVERSION_3_1_1;
    conn_opts.connectTimeout = g_config.connect_timeout;

    // SSL/TLS настройки
    if (g_config.use_tls) {
        ssl_opts.enableServerCertAuth = 1;
        conn_opts.ssl = &ssl_opts;
    }

    log_message("INFO", "Connecting to %s as %s...",
                g_config.broker, g_config.username);

    g_status = MESH_STATUS_CONNECTING;
    int rc = MQTTClient_connect(g_client, &conn_opts);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to connect: %s",
                    MQTTClient_strerror(rc));
        g_status = MESH_STATUS_ERROR;
        g_stats.last_error_code = rc;
        snprintf(g_stats.last_error_msg, sizeof(g_stats.last_error_msg),
                "%s", MQTTClient_strerror(rc));
        if (g_callbacks.on_connect) {
            g_callbacks.on_connect(0, MQTTClient_strerror(rc));
        }
        return -2;
    }

    g_stats.is_connected = 1;
    g_stats.connected_at = time(NULL);
    g_stats.reconnect_count = 0;
    g_status = MESH_STATUS_CONNECTED;

    log_message("INFO", "Connected to %s (client: %s)",
                g_config.broker, g_config.client_id);

    if (g_callbacks.on_connect) {
        g_callbacks.on_connect(1, "Connected successfully");
    }

    // Запускаем поток приема если еще не запущен
    if (!g_running) {
        g_running = 1;
        g_should_exit = 0;
        if (pthread_create(&g_receive_thread, NULL, receive_thread_func, NULL) != 0) {
            log_message("ERROR", "Failed to create receive thread: %s", strerror(errno));
            g_running = 0;
            g_status = MESH_STATUS_ERROR;
            return -3;
        }
        log_message("INFO", "Receive thread started");
    }

    return 0;
#else
    log_message("ERROR", "No MQTT library support compiled");
    return -1;
#endif
}

int mesh_mqtt_disconnect(void) {
    if (!g_initialized) {
        return 0;
    }

    log_message("INFO", "Disconnecting...");

    // Останавливаем поток приема
    g_running = 0;
    g_should_exit = 1;

    if (g_receive_thread) {
        pthread_join(g_receive_thread, NULL);
        g_receive_thread = 0;
    }

#ifdef USE_PAHO_MQTT
    if (g_stats.is_connected && g_client) {
        int rc = MQTTClient_disconnect(g_client, 5000);
        if (rc != MQTTCLIENT_SUCCESS) {
            log_message("WARN", "Disconnect failed: %s",
                        MQTTClient_strerror(rc));
        }
    }
#endif

    g_stats.is_connected = 0;
    g_receive_thread_running = 0;
    g_status = MESH_STATUS_DISCONNECTED;

    log_message("INFO", "Disconnected from broker");

    if (g_callbacks.on_disconnect) {
        g_callbacks.on_disconnect(0, "Disconnected");
    }

    return 0;
}

int mesh_mqtt_is_connected(void) {
    return g_stats.is_connected;
}

mesh_connection_status_t mesh_mqtt_get_status(void) {
    return g_status;
}

int mesh_mqtt_send(const mesh_packet_t *packet) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    if (!g_stats.is_connected) {
        log_message("ERROR", "Not connected");
        return -2;
    }

    if (!packet) {
        log_message("ERROR", "NULL packet");
        return -3;
    }

    // Формируем топик
    char topic[256];
    if (packet->receiver_id[0] != '\0' &&
        strcmp(packet->receiver_id, "broadcast") != 0) {
        snprintf(topic, sizeof(topic), "%s/device/%s/inbox",
                 g_config.topic_root, packet->receiver_id);
    } else {
        snprintf(topic, sizeof(topic), "%s/broadcast",
                 g_config.topic_root);
    }

    size_t packet_size = sizeof(mesh_packet_t) + packet->payload_len;
    void *data = (void*)packet;

#ifdef USE_PAHO_MQTT
    MQTTClient_message pubmsg = MQTTClient_message_initializer;
    pubmsg.payload = data;
    pubmsg.payloadlen = packet_size;
    pubmsg.qos = g_config.qos;
    pubmsg.retained = g_config.retain;

    MQTTClient_deliveryToken token;
    int rc = MQTTClient_publishMessage(g_client, topic, &pubmsg, &token);

    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to publish to %s: %s",
                    topic, MQTTClient_strerror(rc));
        g_stats.errors++;
        return -4;
    }

    // Ждем подтверждения
    rc = MQTTClient_waitForCompletion(g_client, token, 5000);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("WARN", "Publish completed but wait failed: %s",
                    MQTTClient_strerror(rc));
    }
#endif

    g_stats.packets_sent++;
    g_stats.bytes_sent += packet_size;
    g_stats.last_activity = time(NULL);

    if (g_config.verbose) {
        log_message("DEBUG", "Sent packet %llu to %s (%zu bytes)",
                    (unsigned long long)packet->packet_id,
                    topic, packet_size);
    }

    if (g_callbacks.on_packet_sent) {
        g_callbacks.on_packet_sent(packet);
    }

    return 0;
}

int mesh_mqtt_send_to(const char *receiver_id, uint32_t type,
                      const void *data, uint32_t data_len) {
    mesh_packet_t *packet = mesh_packet_create(type, receiver_id, data, data_len);
    if (!packet) return -1;

    int result = mesh_mqtt_send(packet);
    mesh_packet_free(packet);
    return result;
}

int mesh_mqtt_broadcast(uint32_t type, const void *data, uint32_t data_len) {
    return mesh_mqtt_send_to("broadcast", type, data, data_len);
}

int mesh_mqtt_receive(mesh_packet_t **packet, int timeout_ms) {
    (void)packet;
    (void)timeout_ms;
    log_message("WARN", "mesh_mqtt_receive not implemented (use callbacks)");
    return -1;
}

int mesh_mqtt_subscribe(const char *topic) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    if (!g_stats.is_connected) {
        log_message("ERROR", "Not connected");
        return -2;
    }

    char full_topic[256];
    // Если топик уже содержит корневой путь, используем как есть
    if (strstr(topic, g_config.topic_root) == topic) {
        snprintf(full_topic, sizeof(full_topic), "%s", topic);
    } else if (topic[0] == '/') {
        snprintf(full_topic, sizeof(full_topic), "%s%s", g_config.topic_root, topic);
    } else {
        snprintf(full_topic, sizeof(full_topic), "%s/%s", g_config.topic_root, topic);
    }

#ifdef USE_PAHO_MQTT
    int rc = MQTTClient_subscribe(g_client, full_topic, g_config.qos);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to subscribe to %s: %s",
                    full_topic, MQTTClient_strerror(rc));
        return -3;
    }
#endif

    log_message("INFO", "Subscribed to: %s", full_topic);
    return 0;
}

int mesh_mqtt_subscribe_all(void) {
    const char *topics[] = {
        "device/#",
        "stat/#",
        "telemetry/#",
        "position/#",
        "broadcast/#",
        "#"
    };

    int success_count = 0;
    for (size_t i = 0; i < sizeof(topics)/sizeof(topics[0]); i++) {
        if (mesh_mqtt_subscribe(topics[i]) == 0) {
            success_count++;
        }
    }

    log_message("INFO", "Subscribed to %d/%zu topics", success_count,
                sizeof(topics)/sizeof(topics[0]));
    return success_count;
}

int mesh_mqtt_subscribe_city(const char *city_code) {
    if (!city_code) return -1;

    char topic[256];
    snprintf(topic, sizeof(topic), "msh/RU/%s/#", city_code);
    return mesh_mqtt_subscribe(topic);
}

int mesh_mqtt_unsubscribe(const char *topic) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    if (!g_stats.is_connected) {
        log_message("ERROR", "Not connected");
        return -2;
    }

    char full_topic[256];
    if (strstr(topic, g_config.topic_root) == topic) {
        snprintf(full_topic, sizeof(full_topic), "%s", topic);
    } else {
        snprintf(full_topic, sizeof(full_topic), "%s/%s", g_config.topic_root, topic);
    }

#ifdef USE_PAHO_MQTT
    int rc = MQTTClient_unsubscribe(g_client, full_topic);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to unsubscribe from %s: %s",
                    full_topic, MQTTClient_strerror(rc));
        return -3;
    }
#endif

    log_message("INFO", "Unsubscribed from: %s", full_topic);
    return 0;
}

void mesh_mqtt_set_callbacks(const mesh_mqtt_callbacks_t *callbacks) {
    if (callbacks) {
        memcpy(&g_callbacks, callbacks, sizeof(mesh_mqtt_callbacks_t));
        if (g_config.verbose) {
            log_message("DEBUG", "Callbacks set");
        }
    }
}

void mesh_mqtt_set_city_code(const char *city_code) {
    if (city_code) {
        snprintf(g_config.city_code, sizeof(g_config.city_code), "%s", city_code);
        snprintf(g_config.topic_root, sizeof(g_config.topic_root),
                 "msh/RU/%s", city_code);
        log_message("INFO", "City code set to: %s", city_code);
    }
}

const mesh_mqtt_stats_t* mesh_mqtt_get_stats(void) {
    return &g_stats;
}

void mesh_mqtt_reset_stats(void) {
    memset(&g_stats, 0, sizeof(mesh_mqtt_stats_t));
    g_stats.start_time = time(NULL);
    log_message("INFO", "Statistics reset");
}

int mesh_mqtt_reconnect(void) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    log_message("INFO", "Manual reconnect requested");
    mesh_mqtt_disconnect();
    return mesh_mqtt_connect();
}

int mesh_mqtt_ping(void) {
    if (!g_initialized || !g_stats.is_connected) {
        log_message("ERROR", "Not connected");
        return -1;
    }

#ifdef USE_PAHO_MQTT
    // Проверяем соединение
    if (MQTTClient_isConnected(g_client)) {
        g_stats.last_activity = time(NULL);
        log_message("DEBUG", "Ping (connection check) successful");
        return 0;
    } else {
        log_message("WARN", "Connection check failed");
        return -2;
    }
#else
    log_message("ERROR", "Not implemented");
    return -1;
#endif
}

// ============================================================================
// Отладка и диагностика
// ============================================================================

void mesh_mqtt_print_stats(void) {
    char time_str[64];

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║                    MQTT STATISTICS                       ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Status:         %s                                       ║\n",
           mesh_mqtt_get_status_string());
    printf("║ Initialized:    %s                                       ║\n",
           g_initialized ? "✅ Yes" : "❌ No");
    printf("║ Connected:      %s                                       ║\n",
           g_stats.is_connected ? "✅ Yes" : "❌ No");

    if (g_stats.connected_at) {
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S",
                 localtime(&g_stats.connected_at));
        printf("║ Connected at:   %s                         ║\n", time_str);
    }

    if (g_stats.start_time) {
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S",
                 localtime(&g_stats.start_time));
        printf("║ Started at:     %s                         ║\n", time_str);
    }

    printf("║ Packets sent:   %-40llu ║\n",
           (unsigned long long)g_stats.packets_sent);
    printf("║ Packets recv:   %-40llu ║\n",
           (unsigned long long)g_stats.packets_received);
    printf("║ Packets drop:   %-40llu ║\n",
           (unsigned long long)g_stats.packets_dropped);
    printf("║ Bytes sent:     %-40llu ║\n",
           (unsigned long long)g_stats.bytes_sent);
    printf("║ Bytes recv:     %-40llu ║\n",
           (unsigned long long)g_stats.bytes_received);
    printf("║ Errors:         %-40llu ║\n",
           (unsigned long long)g_stats.errors);
    printf("║ Reconnects:     %-40d ║\n", g_stats.reconnect_count);

    if (g_stats.last_activity) {
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S",
                 localtime(&g_stats.last_activity));
        printf("║ Last activity:  %s                         ║\n", time_str);
    }

    if (g_stats.last_error_code) {
        printf("║ Last error:     [%d] %s                  ║\n",
               g_stats.last_error_code, g_stats.last_error_msg);
    }

    printf("║ Broker:         %s                   ║\n", g_config.broker);
    printf("║ Client ID:      %s                   ║\n", g_config.client_id);
    printf("║ City:           %s                                       ║\n", g_config.city_code);
    printf("║ Topic root:     %s                   ║\n", g_config.topic_root);
    printf("║ Protobuf:       %s                                       ║\n",
           g_config.parse_protobuf ? "Enabled" : "Disabled");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_mqtt_print_config(void) {
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║                    MQTT CONFIGURATION                    ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Broker:         %s                   ║\n", g_config.broker);
    printf("║ Host:           %s                                       ║\n", g_config.host);
    printf("║ Port:           %d                                        ║\n", g_config.port);
    printf("║ Username:       %s                                       ║\n", g_config.username);
    printf("║ Password:       %s                                       ║\n",
           g_config.password[0] ? "********" : "(empty)");
    printf("║ Client ID:      %s                   ║\n", g_config.client_id);
    printf("║ City code:      %s                                       ║\n", g_config.city_code);
    printf("║ Topic root:     %s                   ║\n", g_config.topic_root);
    printf("║ TLS:            %s                                       ║\n",
           g_config.use_tls ? "Enabled" : "Disabled");
    printf("║ Keepalive:      %d                                        ║\n", g_config.keepalive);
    printf("║ QoS:            %d                                        ║\n", g_config.qos);
    printf("║ Retain:         %s                                       ║\n",
           g_config.retain ? "Enabled" : "Disabled");
    printf("║ Clean session:  %s                                       ║\n",
           g_config.clean_session ? "Enabled" : "Disabled");
    printf("║ Connect timeout:%d                                        ║\n", g_config.connect_timeout);
    printf("║ Max reconnect:  %d                                        ║\n", g_config.max_reconnect);
    printf("║ Reconnect delay:%d                                        ║\n", g_config.reconnect_delay);
    printf("║ Verbose:        %s                                       ║\n",
           g_config.verbose ? "Yes" : "No");
    printf("║ Log messages:   %s                                       ║\n",
           g_config.log_messages ? "Yes" : "No");
    printf("║ Log packets:    %s                                       ║\n",
           g_config.log_packets ? "Yes" : "No");
    printf("║ Parse Protobuf: %s                                       ║\n",
           g_config.parse_protobuf ? "Yes" : "No");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_mqtt_print_connection_info(void) {
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║                    CONNECTION INFO                       ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Status:         %s                                       ║\n",
           mesh_mqtt_get_status_string());
    printf("║ Connected:      %s                                       ║\n",
           g_stats.is_connected ? "✅ Yes" : "❌ No");
    printf("║ Broker:         %s                   ║\n", g_config.broker);
    printf("║ Client ID:      %s                   ║\n", g_config.client_id);
    printf("║ Username:       %s                                       ║\n", g_config.username);
    printf("║ City:           %s                                       ║\n", g_config.city_code);

    if (g_stats.connected_at) {
        char time_str[64];
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S",
                 localtime(&g_stats.connected_at));
        printf("║ Connected at:   %s                         ║\n", time_str);
    }

    printf("║ Uptime:         %ld seconds                              ║\n",
           g_stats.connected_at ? (long)(time(NULL) - g_stats.connected_at) : 0);
    printf("║ Packets:        %llu sent, %llu received                  ║\n",
           (unsigned long long)g_stats.packets_sent,
           (unsigned long long)g_stats.packets_received);
    printf("║ Errors:         %llu                                      ║\n",
           (unsigned long long)g_stats.errors);
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_mqtt_set_verbose(int enable) {
    g_config.verbose = enable ? 1 : 0;
    log_message("INFO", "Verbose mode %s", enable ? "enabled" : "disabled");
}

void mesh_mqtt_set_log_packets(int enable) {
    g_config.log_packets = enable ? 1 : 0;
    log_message("INFO", "Packet logging %s", enable ? "enabled" : "disabled");
}

// ============================================================================
// Отправка сырых данных (новая функция)
// ============================================================================

int mesh_mqtt_send_data(const char *topic, const void *data, size_t len) {
    if (!g_initialized) {
        log_message("ERROR", "Not initialized");
        return -1;
    }

    if (!g_stats.is_connected) {
        log_message("ERROR", "Not connected");
        return -2;
    }

    if (!topic || !data || len == 0) {
        log_message("ERROR", "Invalid parameters");
        return -3;
    }

#ifdef USE_PAHO_MQTT
    MQTTClient_message pubmsg = MQTTClient_message_initializer;
    pubmsg.payload = (void*)data;
    pubmsg.payloadlen = len;
    pubmsg.qos = g_config.qos;
    pubmsg.retained = g_config.retain;

    MQTTClient_deliveryToken token;
    int rc = MQTTClient_publishMessage(g_client, topic, &pubmsg, &token);

    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to publish to %s: %s",
                    topic, MQTTClient_strerror(rc));
        g_stats.errors++;
        return -4;
    }

    MQTTClient_waitForCompletion(g_client, token, 5000);
#endif

    g_stats.packets_sent++;
    g_stats.bytes_sent += len;
    g_stats.last_activity = time(NULL);

    if (g_config.verbose) {
        log_message("DEBUG", "Sent %zu bytes to %s", len, topic);
    }

    return 0;
}

// ============================================================================
// Освобождение ресурсов
// ============================================================================

void mesh_mqtt_cleanup(void) {
    log_message("INFO", "Cleaning up...");

    // Останавливаем поток приема
    g_running = 0;
    g_should_exit = 1;

    if (g_receive_thread) {
        pthread_join(g_receive_thread, NULL);
        g_receive_thread = 0;
    }

    // Отключаемся от брокера
    mesh_mqtt_disconnect();

#ifdef USE_PAHO_MQTT
    if (g_client) {
        MQTTClient_destroy(&g_client);
        g_client = NULL;
    }
#endif

    // Сбрасываем состояние
    g_initialized = 0;
    g_receive_thread_running = 0;
    g_status = MESH_STATUS_DISCONNECTED;
    memset(&g_stats, 0, sizeof(g_stats));
    memset(&g_config, 0, sizeof(g_config));
    memset(&g_callbacks, 0, sizeof(g_callbacks));

    log_message("INFO", "Cleanup complete");
}

// ============================================================================
// Обработка сигналов
// ============================================================================

void mesh_mqtt_handle_signal(int sig) {
    if (sig == SIGINT || sig == SIGTERM) {
        log_message("INFO", "Signal %d received, shutting down...", sig);
        g_should_exit = 1;
        g_running = 0;
        mesh_mqtt_cleanup();
        exit(0);
    }
}

// ============================================================================
// Утилиты
// ============================================================================

int mesh_mqtt_config_valid(const mesh_mqtt_config_t *config) {
    if (!config) return 0;

    if (config->broker[0] == '\0') {
        log_message("ERROR", "Broker address is empty");
        return 0;
    }

    if (config->username[0] == '\0') {
        log_message("ERROR", "Username is empty");
        return 0;
    }

    if (config->password[0] == '\0') {
        log_message("ERROR", "Password is empty");
        return 0;
    }

    if (config->topic_root[0] == '\0') {
        log_message("ERROR", "Topic root is empty");
        return 0;
    }

    if (config->port <= 0 || config->port > 65535) {
        log_message("ERROR", "Invalid port: %d", config->port);
        return 0;
    }

    if (config->qos < 0 || config->qos > 2) {
        log_message("ERROR", "Invalid QoS: %d (must be 0, 1, or 2)", config->qos);
        return 0;
    }

    if (config->keepalive < 1) {
        log_message("ERROR", "Invalid keepalive: %d (must be >= 1)", config->keepalive);
        return 0;
    }

    return 1;
}

const char* mesh_mqtt_get_status_string(void) {
    switch (g_status) {
        case MESH_STATUS_DISCONNECTED: return "Disconnected";
        case MESH_STATUS_CONNECTING: return "Connecting...";
        case MESH_STATUS_CONNECTED: return "Connected ✅";
        case MESH_STATUS_RECONNECTING: return "Reconnecting...";
        case MESH_STATUS_ERROR: return "Error ❌";
        default: return "Unknown";
    }
}

const char* mesh_mqtt_get_version(void) {
    return "1.0.0";
}

int mesh_mqtt_build_topic(const char *root, const char *subtopic,
                          char *buffer, size_t buffer_size) {
    if (!root || !buffer) return -1;

    if (subtopic && subtopic[0] != '\0') {
        snprintf(buffer, buffer_size, "%s/%s", root, subtopic);
    } else {
        snprintf(buffer, buffer_size, "%s", root);
    }
    return 0;
}

int mesh_mqtt_parse_topic(const char *topic, char *root,
                          char *subtopic, size_t buffer_size) {
    if (!topic || !root) return -1;

    // Ищем разделитель
    const char *slash = strchr(topic, '/');
    if (slash) {
        size_t root_len = slash - topic;
        if (root_len < buffer_size) {
            strncpy(root, topic, root_len);
            root[root_len] = '\0';
        } else {
            return -2;
        }

        if (subtopic && buffer_size > root_len + 1) {
            strncpy(subtopic, slash + 1, buffer_size - root_len - 1);
            subtopic[buffer_size - root_len - 1] = '\0';
        }
    } else {
        strncpy(root, topic, buffer_size - 1);
        root[buffer_size - 1] = '\0';
        if (subtopic) subtopic[0] = '\0';
    }

    return 0;
}