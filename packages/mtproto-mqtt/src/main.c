/*
    MTProto MQTT Gateway - Главный файл
    Шлюз для передачи MTProto-трафика через MQTT/Mesh-сети
    С поддержкой гибридной криптографии (ECDH + ML-KEM + ML-DSA)
    С автоматическим управлением памятью (heap allocation)
    Полная поддержка иерархии топиков msh/RU/
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>
#include <getopt.h>
#include <time.h>
#include <sys/resource.h>
#include <errno.h>

#include "mesh-mqtt.h"
#include "mesh-packet.h"
#include "mesh-crypto.h"
#include "mesh-user.h"
#include "mesh-registry.h"

static int g_running = 1;
static char g_city_code[16] = "SPB";

// ============================================================================
// Увеличение размера стека
// ============================================================================

static void increase_stack_size(void) {
    struct rlimit rl;
    if (getrlimit(RLIMIT_STACK, &rl) == 0) {
        printf("📊 Current stack limit: %lu MB\n",
               (unsigned long)(rl.rlim_cur / (1024 * 1024)));

        // Увеличиваем до 32 МБ
        rl.rlim_cur = 32 * 1024 * 1024;
        if (setrlimit(RLIMIT_STACK, &rl) == 0) {
            printf("✅ Stack limit increased to 32 MB\n");
        } else {
            printf("⚠️ Failed to increase stack limit: %s\n", strerror(errno));
        }
    }
}

// ============================================================================
// Обработчики сигналов
// ============================================================================

void signal_handler(int sig) {
    if (sig == SIGINT || sig == SIGTERM) {
        printf("\n⚠️ Shutting down...\n");
        g_running = 0;
    }
}

// ============================================================================
// Колбэки
// ============================================================================

void on_message_received(const mesh_packet_t *packet) {
    printf("\n📥 Received packet\n");
    mesh_packet_print(packet);
}

void on_connect(int success, const char *message) {
    if (success) {
        printf("✅ Connected to broker: %s\n", message);
        mesh_mqtt_subscribe_all();
    } else {
        printf("❌ Failed to connect: %s\n", message);
    }
}

void on_disconnect(int reason, const char *message) {
    printf("⚠️ Disconnected from broker (reason: %d, message: %s)\n", reason, message);
}

void on_error(int error_code, const char *message) {
    printf("❌ Error: [%d] %s\n", error_code, message);
}

// ============================================================================
// Тест подключения к MQTT
// ============================================================================

int test_mqtt_connection(const mesh_mqtt_config_t *config) {
    printf("\n🔌 Testing MQTT connection...\n");
    printf("  Broker:     %s\n", config->broker);
    printf("  Host:       %s\n", config->host);
    printf("  Port:       %d\n", config->port);
    printf("  Username:   %s\n", config->username);
    printf("  Password:   %s\n", config->password[0] ? "********" : "(empty)");
    printf("  TLS:        %s\n", config->use_tls ? "Enabled" : "Disabled");
    printf("  Client ID:  %s\n", config->client_id[0] ? config->client_id : "(auto)");
    printf("  Topic root: %s\n", config->topic_root);
    printf("  City code:  %s\n", config->city_code);
    printf("  Subscribe:  %s/#\n", config->topic_root);
    printf("\n");

    // Проверка конфигурации перед инициализацией
    if (!mesh_mqtt_config_valid(config)) {
        printf("❌ Invalid configuration!\n");
        return -1;
    }

    // Инициализация
    printf("⏳ Initializing MQTT client...\n");
    if (mesh_mqtt_init(config) < 0) {
        printf("❌ Failed to initialize MQTT\n");
        return -1;
    }
    printf("✅ MQTT client initialized\n");

    // Подключение с таймаутом
    printf("⏳ Connecting to broker...\n");
    int rc = mesh_mqtt_connect();

    if (rc < 0) {
        printf("❌ Connection failed with code: %d\n", rc);
        const mesh_mqtt_stats_t *stats = mesh_mqtt_get_stats();
        if (stats->last_error_code) {
            printf("   Error: [%d] %s\n", stats->last_error_code, stats->last_error_msg);
        }
        mesh_mqtt_cleanup();
        return -1;
    }

    printf("✅ Connection successful!\n");

    // Проверка подключения
    if (mesh_mqtt_is_connected()) {
        printf("✅ Client is connected\n");

        const mesh_mqtt_stats_t *stats = mesh_mqtt_get_stats();
        printf("   Client ID: %s\n", config->client_id);
        printf("   Connected at: %s", ctime(&stats->connected_at));

        // Подписка на топики
        printf("\n📡 Subscribing to topics...\n");
        printf("   Topic root: %s\n", config->topic_root);
        printf("   Subscribe:  %s/#\n", config->topic_root);

        // Подписываемся на все топики города
        int subs = mesh_mqtt_subscribe_all();
        printf("   Subscribed to %d topics\n", subs);

        // Дополнительная подписка на специфические топики
        char city_all[256];
        snprintf(city_all, sizeof(city_all), "msh/RU/%s/#", config->city_code);
        printf("   Also subscribing to: %s\n", city_all);
        mesh_mqtt_subscribe(city_all);

        // Отправка тестового сообщения
        printf("\n📤 Sending test message...\n");
        char msg[128];
        snprintf(msg, sizeof(msg), "Hello from MTProto-MQTT Gateway! Time: %ld",
                 (long)time(NULL));
        int send_rc = mesh_mqtt_send_to("broadcast", MESH_MSG_TYPE_PING,
                                        msg, strlen(msg) + 1);
        if (send_rc == 0) {
            printf("   ✅ Message sent: %s\n", msg);
        } else {
            printf("   ❌ Failed to send message (code: %d)\n", send_rc);
        }

        printf("\n📊 Connection test complete!\n");
        mesh_mqtt_print_stats();

        // Ожидаем 2 секунды для получения ответов
        printf("\n⏳ Waiting 2 seconds for responses...\n");
        sleep(2);

        mesh_mqtt_cleanup();
        return 0;
    } else {
        printf("❌ Client is not connected\n");
        mesh_mqtt_cleanup();
        return -1;
    }
}

// ============================================================================
// Основная функция
// ============================================================================

void print_help(const char *progname) {
    printf("Usage: %s [options]\n", progname);
    printf("\nOneMesh Connection:\n");
    printf("  Default: mqtt://mqtt.onemesh.ru:1883 (user: onemeshd, pass: onecat)\n");
    printf("\nOptions:\n");
    printf("  -b, --broker <url>     MQTT broker URL (mqtt://host:port)\n");
    printf("  -H, --host <host>      MQTT host (default: mqtt.onemesh.ru)\n");
    printf("  -p, --port <port>      MQTT port (default: 1883)\n");
    printf("  -u, --user <user>      MQTT username (default: onemeshd)\n");
    printf("  -P, --pass <pass>      MQTT password (default: onecat)\n");
    printf("  -c, --city <code>      City code (default: SPB)\n");
    printf("  -t, --topic <root>     Topic root (default: msh/RU/XXX)\n");
    printf("  -s, --send <msg>       Send test message\n");
    printf("  -r, --receiver <id>    Receiver ID for test message\n");
    printf("  -v, --verbose          Enable verbose output\n");
    printf("  --test-connect         Test MQTT connection only\n");
    printf("  --help                 Show this help\n");
    printf("\nCity Codes:\n");
    printf("  SPB  - Saint Petersburg\n");
    printf("  MOS  - Moscow\n");
    printf("  KRD  - Krasnodar\n");
    printf("  EKB  - Yekaterinburg\n");
    printf("  NSK  - Novosibirsk\n");
    printf("  KZN  - Kazan\n");
    printf("  VVO  - Vladivostok\n");
    printf("  SOCH - Sochi\n");
    printf("  CRM  - Crimea\n");
    printf("\nTopic Hierarchy (msh/RU/):\n");
    printf("  device/<DEVICE_ID>/   - Device topics\n");
    printf("  group/<GROUP_ID>/     - Group topics\n");
    printf("  subgroup/<GROUP>/<SUB> - Subgroup topics\n");
    printf("  user/<USER_ID>/       - User topics\n");
    printf("  broadcast/            - Broadcast messages\n");
    printf("  telemetry/            - Telemetry data\n");
    printf("  position/             - GPS positions\n");
    printf("  stat/                 - Statistics\n");
    printf("  alert/                - Alerts\n");
    printf("  log/                  - Logs\n");
    printf("  config/               - Configuration\n");
    printf("\nMemory Management:\n");
    printf("  All buffers allocated on HEAP (not stack)\n");
    printf("  Automatic cleanup with free()\n");
    printf("  Max packet size: %zu bytes\n", (size_t)MESH_HYBRID_PACKET_MAX_SIZE);
}

int main(int argc, char *argv[]) {
    // ============================================================
    // Увеличиваем размер стека
    // ============================================================
    increase_stack_size();

    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    // Проверяем специальные режимы
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--test-connect") == 0) {
            mesh_mqtt_config_t test_config = {0};
            // Правильный формат для MQTT протокола
            snprintf(test_config.broker, sizeof(test_config.broker),
                     "mqtt://mqtt.onemesh.ru:1883");
            snprintf(test_config.host, sizeof(test_config.host), "mqtt.onemesh.ru");
            test_config.port = 1883;
            snprintf(test_config.username, sizeof(test_config.username), "onemeshd");
            snprintf(test_config.password, sizeof(test_config.password), "onecat");
            snprintf(test_config.topic_root, sizeof(test_config.topic_root), "msh/RU/SPB");
            snprintf(test_config.city_code, sizeof(test_config.city_code), "SPB");
            snprintf(test_config.client_id, sizeof(test_config.client_id),
                     "gateway-test-%d", getpid());
            test_config.use_tls = 0;
            test_config.keepalive = 60;
            test_config.qos = 1;
            test_config.retain = 0;
            test_config.clean_session = 1;
            test_config.connect_timeout = 10;
            test_config.verbose = 1;
            test_config.log_messages = 1;
            test_config.log_packets = 0;
            test_config.parse_protobuf = 1;

            return test_mqtt_connection(&test_config);
        }
    }

    static struct option long_options[] = {
        {"broker", required_argument, 0, 'b'},
        {"host", required_argument, 0, 'H'},
        {"port", required_argument, 0, 'p'},
        {"user", required_argument, 0, 'u'},
        {"pass", required_argument, 0, 'P'},
        {"city", required_argument, 0, 'c'},
        {"topic", required_argument, 0, 't'},
        {"send", required_argument, 0, 's'},
        {"receiver", required_argument, 0, 'r'},
        {"verbose", no_argument, 0, 'v'},
        {"test-connect", no_argument, 0, 1000},
        {"help", no_argument, 0, 'h'},
        {0, 0, 0, 0}
    };

    mesh_mqtt_config_t config = {0};

    // ============================================================
    // ПРАВИЛЬНЫЙ ФОРМАТ ДЛЯ MQTT: mqtt://host:port
    // ============================================================
    snprintf(config.broker, sizeof(config.broker), "mqtt://mqtt.onemesh.ru:1883");
    snprintf(config.host, sizeof(config.host), "mqtt.onemesh.ru");
    config.port = 1883;
    snprintf(config.username, sizeof(config.username), "onemeshd");
    snprintf(config.password, sizeof(config.password), "onecat");
    snprintf(config.topic_root, sizeof(config.topic_root), "msh/RU/SPB");
    snprintf(config.city_code, sizeof(config.city_code), "SPB");
    snprintf(config.client_id, sizeof(config.client_id),
             "gateway-%d-%ld", getpid(), (long)time(NULL));

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

    char *send_message = NULL;
    char *receiver_id = NULL;
    int verbose = 0;
    int opt;

    while ((opt = getopt_long(argc, argv, "b:H:p:u:P:c:t:s:r:vh",
                              long_options, NULL)) != -1) {
        switch (opt) {
            case 'b': {
                // Поддержка mqtt:// и tcp:// протоколов
                char *proto_start = strstr(optarg, "://");
                if (proto_start) {
                    // Уже есть протокол - используем как есть
                    snprintf(config.broker, sizeof(config.broker), "%s", optarg);
                } else {
                    // Нет протокола - добавляем mqtt://
                    snprintf(config.broker, sizeof(config.broker), "mqtt://%s", optarg);
                }

                // Извлекаем host и port из broker URL
                char *start = strstr(config.broker, "://");
                if (start) {
                    char *host_start = start + 3;
                    char *colon = strchr(host_start, ':');
                    if (colon) {
                        int len = colon - host_start;
                        if (len < (int)sizeof(config.host)) {
                            strncpy(config.host, host_start, len);
                            config.host[len] = '\0';
                        }
                        config.port = atoi(colon + 1);
                    } else {
                        strncpy(config.host, host_start, sizeof(config.host) - 1);
                    }
                }
                break;
            }
            case 'H':
                snprintf(config.host, sizeof(config.host), "%s", optarg);
                // Обновляем broker с новым хостом
                snprintf(config.broker, sizeof(config.broker), "mqtt://%s:%d",
                         config.host, config.port);
                break;
            case 'p':
                config.port = atoi(optarg);
                snprintf(config.broker, sizeof(config.broker), "mqtt://%s:%d",
                         config.host, config.port);
                break;
            case 'u':
                snprintf(config.username, sizeof(config.username), "%s", optarg);
                break;
            case 'P':
                snprintf(config.password, sizeof(config.password), "%s", optarg);
                break;
            case 'c':
                snprintf(g_city_code, sizeof(g_city_code), "%s", optarg);
                snprintf(config.topic_root, sizeof(config.topic_root), "msh/RU/%s", optarg);
                snprintf(config.city_code, sizeof(config.city_code), "%s", optarg);
                break;
            case 't':
                snprintf(config.topic_root, sizeof(config.topic_root), "%s", optarg);
                break;
            case 's':
                send_message = optarg;
                break;
            case 'r':
                receiver_id = optarg;
                break;
            case 'v':
                verbose = 1;
                config.verbose = 1;
                break;
            case 'h':
            default:
                print_help(argv[0]);
                return (opt == 'h') ? 0 : 1;
        }
    }

    printf("\n╔═══════════════════════════════════════════════════════════════╗\n");
    printf("║     MTProto MQTT Gateway v2.0 (Hybrid Crypto)               ║\n");
    printf("║     MTProto ↔ MQTT Mesh Gateway                             ║\n");
    printf("║     ECDH + ML-KEM + ML-DSA (Quantum-Safe)                   ║\n");
    printf("║     Memory: HEAP allocation + auto-cleanup                  ║\n");
    printf("║     Topics: msh/RU/ (full hierarchy)                        ║\n");
    printf("╚═══════════════════════════════════════════════════════════════╝\n");
    printf("\nConfiguration:\n");
    printf("  Broker:      %s\n", config.broker);
    printf("  Host:        %s\n", config.host);
    printf("  Port:        %d\n", config.port);
    printf("  Username:    %s\n", config.username);
    printf("  Password:    %s\n", config.password[0] ? "********" : "(empty)");
    printf("  Client ID:   %s\n", config.client_id);
    printf("  City:        %s\n", g_city_code);
    printf("  Topic root:  %s\n", config.topic_root);
    printf("  PQ Support:  %s\n", mesh_hybrid_is_pq_supported() ? "✅ Yes" : "❌ No");
    printf("  Memory:      HEAP (max %zu bytes)\n", (size_t)MESH_TEST_BUFFER_SIZE);
    printf("  Verbose:     %s\n", verbose ? "Yes" : "No");
    printf("\n");

    // ============================================================
    // Инициализируем реестр
    // ============================================================
    if (mesh_registry_init(1024) < 0) {
        fprintf(stderr, "❌ Failed to initialize user registry\n");
        return 1;
    }

    // Настройка колбэков
    mesh_mqtt_callbacks_t callbacks = {
        .on_message = on_message_received,
        .on_connect = on_connect,
        .on_disconnect = on_disconnect,
        .on_error = on_error
    };
    mesh_mqtt_set_callbacks(&callbacks);

    // Инициализация MQTT
    printf("📡 Initializing MQTT...\n");
    if (mesh_mqtt_init(&config) < 0) {
        fprintf(stderr, "❌ Failed to initialize MQTT\n");
        mesh_registry_cleanup();
        return 1;
    }

    // Подключение
    printf("📡 Connecting to MQTT broker...\n");
    if (mesh_mqtt_connect() < 0) {
        fprintf(stderr, "❌ Failed to connect\n");
        mesh_mqtt_cleanup();
        mesh_registry_cleanup();
        return 1;
    }

    // Отправка тестового сообщения
    if (send_message) {
        const char *target = receiver_id ? receiver_id : "broadcast";
        printf("📤 Sending test message to %s: '%s'\n", target, send_message);

        // Используем правильный топик для отправки
        char topic[256];
        if (strcmp(target, "broadcast") == 0) {
            snprintf(topic, sizeof(topic), "%s/broadcast", config.topic_root);
        } else if (strchr(target, '/') != NULL) {
            snprintf(topic, sizeof(topic), "%s", target);
        } else {
            snprintf(topic, sizeof(topic), "%s/device/%s/inbox", config.topic_root, target);
        }

        mesh_mqtt_send_to(target, MESH_MSG_TYPE_PING,
                          send_message, strlen(send_message) + 1);
    }

    printf("\n📡 Listening for messages on: %s/#\n", config.topic_root);
    printf("   (Press Ctrl+C to exit)\n\n");

    time_t last_stats = 0;
    while (g_running) {
        sleep(1);

        time_t now = time(NULL);
        if (now - last_stats > 60) {
            mesh_mqtt_print_stats();
            last_stats = now;
        }
    }

    // ============================================================
    // Очистка ресурсов
    // ============================================================
    mesh_mqtt_cleanup();
    mesh_registry_cleanup();
    mesh_hybrid_cleanup();
    printf("✅ Done.\n");

    return 0;
}
