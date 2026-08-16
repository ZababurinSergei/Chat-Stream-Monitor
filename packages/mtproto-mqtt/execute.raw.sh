cd /home/sergei/Desktop/system/packages/mtproto-mqtt

# Создаем исправленную версию mesh_mqtt.c
cat > src/mesh-mqtt.c << 'EOF'
/*
    Mesh MQTT Module - Реализация
    Шлюз для передачи MTProto-трафика через MQTT/Mesh-сети
    Поддерживает Paho MQTT Client
    Настройки для OneMesh (mqtt.onemesh.ru:1883)
*/

#include "mesh-mqtt.h"
#include "mesh-packet.h"
#include "mesh-registry.h"
#include "mesh-crypto.h"
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

static int is_mesh_packet(const void *data, int len) {
    if (!data || len < 4) return 0;
    const unsigned char *bytes = (const unsigned char*)data;
    uint32_t magic = *(uint32_t*)bytes;
    return magic == 0x4D455348;
}

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
// Обработчики пакетов с ключами
// ============================================================================

static void handle_public_key_packet(const char *topic, const void *data, int len) {
    (void)topic;
    if (!data || len < (int)sizeof(mesh_public_key_packet_t)) return;

    mesh_public_key_packet_t *packet = (mesh_public_key_packet_t*)data;
    if (packet->magic != 0x4D455350) {
        log_message("WARN", "Invalid magic for public key packet: 0x%08X", packet->magic);
        return;
    }
    if (packet->version != 1) {
        log_message("WARN", "Unsupported public key packet version: %d", packet->version);
        return;
    }
    log_message("INFO", "Received public key for %s", packet->user_id);
}

static void handle_public_key_request(const char *topic, const void *data, int len) {
    (void)topic;
    if (!data || len < (int)sizeof(mesh_public_key_request_t)) return;

    mesh_public_key_request_t *request = (mesh_public_key_request_t*)data;
    if (request->magic != 0x4D455352) {
        log_message("WARN", "Invalid magic for key request: 0x%08X", request->magic);
        return;
    }
    if (request->version != 1) {
        log_message("WARN", "Unsupported key request version: %d", request->version);
        return;
    }

    mesh_user_t *user = mesh_registry_get_user(request->user_id);
    if (!user) {
        log_message("WARN", "User %s not found for key request", request->user_id);
        return;
    }

    mesh_public_key_response_t response;
    memset(&response, 0, sizeof(response));
    response.magic = 0x4D455341;
    response.version = 1;
    response.timestamp = time(NULL);
    snprintf(response.user_id, sizeof(response.user_id), "%s", request->user_id);
    memcpy(response.public_key, user->keypair.classic_public_key, 32);

    char response_topic[256];
    snprintf(response_topic, sizeof(response_topic), MESH_TOPIC_KEY_RESPONSE, request->requester_id);
    mesh_mqtt_send_data(response_topic, &response, sizeof(response));
    log_message("INFO", "Sent public key response for %s", request->user_id);
}

static void handle_public_key_response(const char *topic, const void *data, int len) {
    (void)topic;
    if (!data || len < (int)sizeof(mesh_public_key_response_t)) return;

    mesh_public_key_response_t *response = (mesh_public_key_response_t*)data;
    if (response->magic != 0x4D455341) {
        log_message("WARN", "Invalid magic for key response: 0x%08X", response->magic);
        return;
    }
    if (response->version != 1) {
        log_message("WARN", "Unsupported key response version: %d", response->version);
        return;
    }
    log_message("INFO", "Received public key response for %s", response->user_id);
}

// ============================================================================
// Функции публикации и запроса ключей
// ============================================================================

int mesh_mqtt_publish_public_key(const char *user_id,
                                 const unsigned char *public_key,
                                 const uint8_t *pq_public_key,
                                 uint16_t pq_len,
                                 const unsigned char *signature,
                                 size_t sig_len) {
    (void)pq_public_key;
    (void)pq_len;
    (void)signature;
    (void)sig_len;

    if (!user_id || !public_key) {
        log_message("ERROR", "Invalid parameters for publish_public_key");
        return -1;
    }

    if (!g_initialized || !g_stats.is_connected) {
        log_message("ERROR", "Not connected or initialized");
        return -1;
    }

    mesh_public_key_packet_t packet;
    memset(&packet, 0, sizeof(packet));
    packet.magic = 0x4D455350;
    packet.version = 1;
    packet.timestamp = time(NULL);
    snprintf(packet.user_id, sizeof(packet.user_id), "%s", user_id);
    memcpy(packet.public_key, public_key, 32);

    char topic[256];
    snprintf(topic, sizeof(topic), MESH_TOPIC_PUBLIC_KEY, user_id);

    int result = mesh_mqtt_send_data(topic, &packet, sizeof(packet));
    if (result == 0) {
        log_message("INFO", "Published public key for %s", user_id);
    }
    return result;
}

int mesh_mqtt_request_public_key(const char *user_id,
                                 const char *requester_id,
                                 const unsigned char *nonce,
                                 const unsigned char *signature,
                                 size_t sig_len) {
    (void)signature;
    (void)sig_len;

    if (!user_id || !requester_id || !nonce) {
        log_message("ERROR", "Invalid parameters for request_public_key");
        return -1;
    }

    if (!g_initialized || !g_stats.is_connected) {
        log_message("ERROR", "Not connected or initialized");
        return -1;
    }

    mesh_public_key_request_t request;
    memset(&request, 0, sizeof(request));
    request.magic = 0x4D455352;
    request.version = 1;
    request.timestamp = time(NULL);
    snprintf(request.user_id, sizeof(request.user_id), "%s", user_id);
    snprintf(request.requester_id, sizeof(request.requester_id), "%s", requester_id);
    memcpy(request.nonce, nonce, 32);

    char topic[256];
    snprintf(topic, sizeof(topic), MESH_TOPIC_KEY_REQUEST, user_id);

    int result = mesh_mqtt_send_data(topic, &request, sizeof(request));
    if (result == 0) {
        log_message("INFO", "Requested public key for %s", user_id);
    }
    return result;
}

// ============================================================================
// Колбэки MQTT (Paho)
// ============================================================================

#ifdef USE_PAHO_MQTT

static int mqtt_message_callback(void *context, char *topicName,
                                  int topicLen, MQTTClient_message *message) {
    (void)context;
    (void)topicLen;

    if (!message || !message->payload) {
        log_message("WARN", "Invalid message received (NULL payload)");
        if (message) MQTTClient_freeMessage(&message);
        if (topicName) MQTTClient_free(topicName);
        return 1;
    }

    if (message->payloadlen >= 4) {
        const unsigned char *bytes = (const unsigned char*)message->payload;
        uint32_t magic = *(uint32_t*)bytes;
        if (magic == 0x4D455350) {
            handle_public_key_packet(topicName, message->payload, message->payloadlen);
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        } else if (magic == 0x4D455352) {
            handle_public_key_request(topicName, message->payload, message->payloadlen);
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        } else if (magic == 0x4D455341) {
            handle_public_key_response(topicName, message->payload, message->payloadlen);
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        }
    }

    int is_mesh = is_mesh_packet(message->payload, message->payloadlen);

    if (is_mesh) {
        if (message->payloadlen < (int)sizeof(mesh_packet_t)) {
            log_message("WARN", "Mesh packet too small: %d bytes", message->payloadlen);
            g_stats.packets_dropped++;
            MQTTClient_freeMessage(&message);
            MQTTClient_free(topicName);
            return 1;
        }

        mesh_packet_t *packet = (mesh_packet_t*)malloc(message->payloadlen);
        if (!packet) {
            log_message("ERROR", "Failed to allocate packet");
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
            log_message("DEBUG", "Received Mesh packet from %s, size: %d bytes",
                        topicName ? topicName : "unknown", message->payloadlen);
        }

        if (g_callbacks.on_message) {
            g_callbacks.on_message(packet);
        }

        free(packet);
    } else {
        g_stats.packets_received++;
        g_stats.bytes_received += message->payloadlen;
        g_stats.last_activity = time(NULL);

        const char *type = get_topic_type(topicName);
        if (g_config.verbose) {
            log_message("INFO", "Received Meshtastic [%s] from %s, size: %d bytes",
                        type, topicName ? topicName : "unknown", message->payloadlen);
        }
    }

    MQTTClient_freeMessage(&message);
    MQTTClient_free(topicName);
    return 1;
}

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

static void mqtt_delivery_complete(void *context, MQTTClient_deliveryToken dt) {
    (void)context;
    (void)dt;
}

#endif

// ============================================================================
// Поток для приема сообщений
// ============================================================================

#ifdef USE_PAHO_MQTT

static void* receive_thread_func(void *arg) {
    (void)arg;
    log_message("INFO", "Receive thread started");
    g_receive_thread_running = 1;

    while (g_running && !g_should_exit) {
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

    memcpy(&g_config, config, sizeof(mesh_mqtt_config_t));

    if (g_config.client_id[0] == '\0') {
        snprintf(g_config.client_id, sizeof(g_config.client_id),
                 "mesh-gateway-%d-%ld", getpid(), (long)time(NULL));
        log_message("INFO", "Generated client ID: %s", g_config.client_id);
    }

    // Конвертация mqtt:// в tcp:// для Paho
    if (strncmp(g_config.broker, "mqtt://", 7) == 0) {
        char new_broker[256];
        snprintf(new_broker, sizeof(new_broker), "tcp://%s", g_config.broker + 7);
        strcpy(g_config.broker, new_broker);
        log_message("INFO", "Converted mqtt:// to tcp://: %s", g_config.broker);
    }

    if (g_config.broker[0] == '\0' && g_config.host[0] != '\0') {
        snprintf(g_config.broker, sizeof(g_config.broker),
                 "tcp://%s:%d", g_config.host, g_config.port);
        log_message("INFO", "Built broker URL: %s", g_config.broker);
    }

    if (!mesh_mqtt_config_valid(&g_config)) {
        log_message("ERROR", "Invalid configuration");
        return -1;
    }

#ifdef USE_PAHO_MQTT
    int rc = MQTTClient_create(&g_client, g_config.broker,
                               g_config.client_id,
                               MQTTCLIENT_PERSISTENCE_NONE, NULL);

    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to create MQTT client: %s",
                    MQTTClient_strerror(rc));
        return -2;
    }

    if (!g_client) {
        log_message("ERROR", "MQTT client is NULL after creation");
        return -3;
    }

    rc = MQTTClient_setCallbacks(g_client, &g_stats,
                                 mqtt_connection_lost,
                                 mqtt_message_callback,
                                 mqtt_delivery_complete);
    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to set callbacks: %s",
                    MQTTClient_strerror(rc));
        MQTTClient_destroy(&g_client);
        g_client = NULL;
        return -4;
    }

    log_message("INFO", "MQTT client created: %s (broker: %s)",
                g_config.client_id, g_config.broker);
#else
    log_message("ERROR", "No MQTT library support compiled");
    return -5;
#endif

    g_initialized = 1;
    g_status = MESH_STATUS_DISCONNECTED;
    g_stats.start_time = time(NULL);
    return 0;
}

int mesh_mqtt_init_default(void) {
    mesh_mqtt_config_t config = {0};

    snprintf(config.broker, sizeof(config.broker), "mqtt://mqtt.onemesh.ru:1883");
    snprintf(config.host, sizeof(config.host), "mqtt.onemesh.ru");
    config.port = 1883;
    snprintf(config.username, sizeof(config.username), "onemeshd");
    snprintf(config.password, sizeof(config.password), "onecat");
    snprintf(config.topic_root, sizeof(config.topic_root), "msh/RU/SPB");
    snprintf(config.city_code, sizeof(config.city_code), "SPB");

    config.use_tls = 0;
    config.keepalive = 60;
    config.qos = 1;
    config.retain = 0;
    config.clean_session = 1;
    config.connect_timeout = 30;
    config.max_reconnect = 5;
    config.reconnect_delay = 5;
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
    if (!g_client) {
        log_message("ERROR", "MQTT client is NULL");
        return -1;
    }

    // 🔥 ПРОСТАЯ ИНИЦИАЛИЗАЦИЯ ДЛЯ ВЕРСИИ 8
    MQTTClient_connectOptions conn_opts;
    memset(&conn_opts, 0, sizeof(conn_opts));

    // Устанавливаем struct_id и struct_version
    conn_opts.struct_id = "MQTC";
    conn_opts.struct_version = 8;

    // Основные параметры
    conn_opts.keepAliveInterval = g_config.keepalive;
    conn_opts.cleansession = g_config.clean_session ? 1 : 0;
    conn_opts.username = g_config.username;
    conn_opts.password = g_config.password;
    conn_opts.connectTimeout = g_config.connect_timeout;
    conn_opts.retryInterval = g_config.reconnect_delay;

    log_message("DEBUG", "=== MQTT CONNECT PARAMETERS ===");
    log_message("DEBUG", "broker:      %s", g_config.broker);
    log_message("DEBUG", "host:        %s", g_config.host);
    log_message("DEBUG", "port:        %d", g_config.port);
    log_message("DEBUG", "username:    %s", g_config.username);
    log_message("DEBUG", "password:    %s", g_config.password[0] ? "***" : "(empty)");
    log_message("DEBUG", "client_id:   %s", g_config.client_id);
    log_message("DEBUG", "topic_root:  %s", g_config.topic_root);
    log_message("DEBUG", "city_code:   %s", g_config.city_code);
    log_message("DEBUG", "use_tls:     %d", g_config.use_tls);
    log_message("DEBUG", "keepalive:   %d", g_config.keepalive);
    log_message("DEBUG", "qos:         %d", g_config.qos);
    log_message("DEBUG", "clean_session: %d", g_config.clean_session);
    log_message("DEBUG", "connect_timeout: %d", g_config.connect_timeout);
    log_message("DEBUG", "max_reconnect: %d", g_config.max_reconnect);
    log_message("DEBUG", "reconnect_delay: %d", g_config.reconnect_delay);
    log_message("DEBUG", "verbose:     %d", g_config.verbose);
    log_message("DEBUG", "g_client:    %p", (void*)g_client);
    log_message("DEBUG", "conn_opts.struct_id: %.4s", conn_opts.struct_id);
    log_message("DEBUG", "conn_opts.struct_version: %d", conn_opts.struct_version);
    log_message("DEBUG", "sizeof(conn_opts): %zu", sizeof(conn_opts));
    log_message("DEBUG", "conn_opts.keepAliveInterval: %d", conn_opts.keepAliveInterval);
    log_message("DEBUG", "conn_opts.cleansession: %d", conn_opts.cleansession);
    log_message("DEBUG", "conn_opts.username: %s", conn_opts.username ? conn_opts.username : "(null)");
    log_message("DEBUG", "conn_opts.password: %s", conn_opts.password ? "***" : "(null)");
    log_message("DEBUG", "conn_opts.connectTimeout: %d", conn_opts.connectTimeout);
    log_message("DEBUG", "conn_opts.retryInterval: %d", conn_opts.retryInterval);

    log_message("INFO", "Connecting to %s as %s...",
                g_config.broker, g_config.username);

    if (g_config.broker[0] == '\0') {
        log_message("ERROR", "Broker address is empty");
        g_status = MESH_STATUS_ERROR;
        return -1;
    }

    if (!g_client) {
        log_message("ERROR", "g_client is NULL!");
        return -1;
    }

    log_message("DEBUG", "Calling MQTTClient_connect with g_client=%p", (void*)g_client);

    int rc = MQTTClient_connect(g_client, &conn_opts);

    if (rc != MQTTCLIENT_SUCCESS) {
        log_message("ERROR", "Failed to connect: %s (code: %d)",
                    MQTTClient_strerror(rc), rc);
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

    log_message("INFO", "✅ Connected to %s", g_config.broker);

    if (g_callbacks.on_connect) {
        g_callbacks.on_connect(1, "Connected successfully");
    }

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
    if (!g_initialized) return 0;

    log_message("INFO", "Disconnecting...");
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
    memset(&g_stats, 0, sizeof(g_stats));
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
    if (MQTTClient_isConnected(g_client)) {
        g_stats.last_activity = time(NULL);
        log_message("DEBUG", "Ping successful");
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
// Отправка сырых данных
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

mesh_message_format_t mesh_mqtt_detect_format(const void *data, int len) {
    if (!data || len < 4) return MESH_FORMAT_UNKNOWN;
    const unsigned char *bytes = (const unsigned char*)data;
    uint32_t magic = *(uint32_t*)bytes;
    if (magic == 0x4D455348) return MESH_FORMAT_MESH;
    if (magic == 0x0A || magic == 0x0D) return MESH_FORMAT_PROTOBUF;
    if (bytes[0] == '{' || bytes[0] == '[') return MESH_FORMAT_JSON;
    if (len >= 2 && bytes[0] == 0x1F && bytes[1] == 0x8B) return MESH_FORMAT_BINARY;
    return MESH_FORMAT_UNKNOWN;
}

// ============================================================================
// Освобождение ресурсов
// ============================================================================

void mesh_mqtt_cleanup(void) {
    log_message("INFO", "Cleaning up...");

    g_running = 0;
    g_should_exit = 1;

    if (g_receive_thread) {
        pthread_join(g_receive_thread, NULL);
        g_receive_thread = 0;
    }

    mesh_mqtt_disconnect();

#ifdef USE_PAHO_MQTT
    if (g_client) {
        MQTTClient_destroy(&g_client);
        g_client = NULL;
    }
#endif

    g_initialized = 0;
    g_receive_thread_running = 0;
    g_status = MESH_STATUS_DISCONNECTED;
    memset(&g_stats, 0, sizeof(g_stats));
    memset(&g_config, 0, sizeof(g_config));
    memset(&g_callbacks, 0, sizeof(g_callbacks));

    log_message("INFO", "Cleanup complete");
}

// ============================================================================
// Утилиты
// ============================================================================

int mesh_mqtt_config_valid(const mesh_mqtt_config_t *config) {
    if (!config) {
        log_message("ERROR", "Config is NULL");
        return 0;
    }

    if (config->broker[0] == '\0') {
        log_message("ERROR", "Broker address is empty");
        return 0;
    }

    if (config->username[0] == '\0') {
        log_message("ERROR", "Username is empty");
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

    log_message("DEBUG", "Config is valid");
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

// ============================================================================
// Функции для работы с топиками OneMesh
// ============================================================================

int onemesh_parse_topic(const char *topic, onemesh_topic_info_t *info) {
    if (!topic || !info) return -1;

    memset(info, 0, sizeof(onemesh_topic_info_t));

    char copy[512];
    snprintf(copy, sizeof(copy), "%s", topic);

    char *parts[10];
    int num_parts = 0;
    char *saveptr;
    char *token = strtok_r(copy, "/", &saveptr);

    while (token && num_parts < 10) {
        parts[num_parts++] = token;
        token = strtok_r(NULL, "/", &saveptr);
    }

    if (num_parts < 3) return -1;

    snprintf(info->network, sizeof(info->network), "%s", parts[0]);
    snprintf(info->region, sizeof(info->region), "%s", parts[1]);
    snprintf(info->city, sizeof(info->city), "%s", parts[2]);

    if (num_parts > 3) {
        snprintf(info->type, sizeof(info->type), "%s", parts[3]);
    }

    if (num_parts > 4) {
        if (strcmp(info->type, "subgroup") == 0) {
            snprintf(info->group_id, sizeof(info->group_id), "%s", parts[4]);
            if (num_parts > 5) {
                snprintf(info->subgroup_id, sizeof(info->subgroup_id), "%s", parts[5]);
            }
        } else if (strcmp(info->type, "device") == 0 || strcmp(info->type, "user") == 0) {
            snprintf(info->device_id, sizeof(info->device_id), "%s", parts[4]);
        } else if (strcmp(info->type, "group") == 0) {
            snprintf(info->group_id, sizeof(info->group_id), "%s", parts[4]);
        }
    }

    if (num_parts > 5) {
        snprintf(info->action, sizeof(info->action), "%s", parts[num_parts - 1]);
    }

    snprintf(info->full_topic, sizeof(info->full_topic), "%s", topic);

    if (strcmp(info->type, "group") == 0) info->level = ONEMESH_LEVEL_GROUP;
    else if (strcmp(info->type, "subgroup") == 0) info->level = ONEMESH_LEVEL_SUBGROUP;
    else if (strcmp(info->type, "device") == 0) info->level = ONEMESH_LEVEL_DEVICE;
    else if (strcmp(info->type, "user") == 0) info->level = ONEMESH_LEVEL_USER;
    else info->level = ONEMESH_LEVEL_CITY;

    return 0;
}

int onemesh_build_device_topic(const char *city, const char *device_id,
                               const char *action, char *buffer, size_t buffer_size) {
    if (!city || !device_id || !buffer) return -1;
    if (action && action[0] != '\0') {
        snprintf(buffer, buffer_size, "msh/RU/%s/device/%s/%s", city, device_id, action);
    } else {
        snprintf(buffer, buffer_size, "msh/RU/%s/device/%s", city, device_id);
    }
    return 0;
}

int onemesh_build_group_topic(const char *city, const char *group_id,
                              const char *action, char *buffer, size_t buffer_size) {
    if (!city || !group_id || !buffer) return -1;
    if (action && action[0] != '\0') {
        snprintf(buffer, buffer_size, "msh/RU/%s/group/%s/%s", city, group_id, action);
    } else {
        snprintf(buffer, buffer_size, "msh/RU/%s/group/%s", city, group_id);
    }
    return 0;
}

int onemesh_build_subgroup_topic(const char *city, const char *group_id,
                                 const char *subgroup_id, const char *action,
                                 char *buffer, size_t buffer_size) {
    if (!city || !group_id || !subgroup_id || !buffer) return -1;
    if (action && action[0] != '\0') {
        snprintf(buffer, buffer_size, "msh/RU/%s/subgroup/%s/%s/%s",
                 city, group_id, subgroup_id, action);
    } else {
        snprintf(buffer, buffer_size, "msh/RU/%s/subgroup/%s/%s",
                 city, group_id, subgroup_id);
    }
    return 0;
}

int onemesh_build_user_topic(const char *city, const char *user_id,
                             const char *action, char *buffer, size_t buffer_size) {
    if (!city || !user_id || !buffer) return -1;
    if (action && action[0] != '\0') {
        snprintf(buffer, buffer_size, "msh/RU/%s/user/%s/%s", city, user_id, action);
    } else {
        snprintf(buffer, buffer_size, "msh/RU/%s/user/%s", city, user_id);
    }
    return 0;
}

onemesh_level_t onemesh_get_topic_level(const char *topic) {
    onemesh_topic_info_t info;
    if (onemesh_parse_topic(topic, &info) != 0) {
        return ONEMESH_LEVEL_CITY;
    }
    return info.level;
}

int onemesh_is_group_topic(const char *topic) {
    onemesh_topic_info_t info;
    if (onemesh_parse_topic(topic, &info) != 0) return 0;
    return strcmp(info.type, "group") == 0;
}

int onemesh_is_subgroup_topic(const char *topic) {
    onemesh_topic_info_t info;
    if (onemesh_parse_topic(topic, &info) != 0) return 0;
    return strcmp(info.type, "subgroup") == 0;
}

int onemesh_get_parent_topic(const char *topic, char *buffer, size_t buffer_size) {
    onemesh_topic_info_t info;
    if (onemesh_parse_topic(topic, &info) != 0) return -1;

    if (info.level == ONEMESH_LEVEL_SUBGROUP) {
        snprintf(buffer, buffer_size, "msh/RU/%s/group/%s", info.city, info.group_id);
        return 0;
    }
    return -1;
}

// ============================================================================
// Обработка сигналов
// ============================================================================

void mesh_mqtt_handle_signal(int sig) {
    log_message("INFO", "Signal %d received, shutting down...", sig);
    g_running = 0;
    g_should_exit = 1;
}
EOF
