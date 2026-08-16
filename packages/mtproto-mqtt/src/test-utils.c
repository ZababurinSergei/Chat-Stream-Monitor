/*
    Test Utilities - Реализация
    Вспомогательные функции для тестирования
*/

#include "test-utils.h"
#include "mesh-packet.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdarg.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <errno.h>
#include <pthread.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// ============================================================================
// Глобальный уровень логирования
// ============================================================================

log_level_t g_log_level = LOG_LEVEL_INFO;

// ============================================================================
// Функции логирования
// ============================================================================

void test_log(log_level_t level, const char *file, int line,
              const char *format, ...) {
    if (level < g_log_level) return;

    const char *level_str;
    const char *color;

    switch (level) {
        case LOG_LEVEL_DEBUG:
            level_str = "DEBUG";
            color = COLOR_CYAN;
            break;
        case LOG_LEVEL_INFO:
            level_str = "INFO";
            color = COLOR_GREEN;
            break;
        case LOG_LEVEL_WARN:
            level_str = "WARN";
            color = COLOR_YELLOW;
            break;
        case LOG_LEVEL_ERROR:
            level_str = "ERROR";
            color = COLOR_RED;
            break;
        default:
            level_str = "UNKNOWN";
            color = COLOR_WHITE;
            break;
    }

    const char *filename = strrchr(file, '/');
    if (filename) {
        filename++;
    } else {
        filename = file;
    }

    fprintf(stderr, "%s[%s]%s %s:%d: ",
            color, level_str, COLOR_RESET, filename, line);

    va_list args;
    va_start(args, format);
    vfprintf(stderr, format, args);
    va_end(args);

    fprintf(stderr, "\n");
    fflush(stderr);
}

// ============================================================================
// Генерация случайных данных
// ============================================================================

void test_generate_random_data(unsigned char *buffer, size_t size) {
    if (!buffer || size == 0) return;

    static int seeded = 0;
    if (!seeded) {
        srand((unsigned int)(time(NULL) ^ getpid()));
        seeded = 1;
    }

    for (size_t i = 0; i < size; i++) {
        buffer[i] = (unsigned char)(rand() & 0xFF);
    }
}

void test_generate_random_string(char *buffer, size_t size) {
    if (!buffer || size == 0) return;

    static const char charset[] = "abcdefghijklmnopqrstuvwxyz"
                                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                                  "0123456789_-";

    size_t len = size - 1;
    if (len == 0) {
        buffer[0] = '\0';
        return;
    }

    test_generate_random_data((unsigned char*)buffer, len);

    for (size_t i = 0; i < len; i++) {
        buffer[i] = charset[buffer[i] % (sizeof(charset) - 1)];
    }
    buffer[len] = '\0';
}

void test_generate_mesh_id(char *buffer, size_t size) {
    if (!buffer || size < 3) return;

    char random_str[64];
    test_generate_random_string(random_str, sizeof(random_str));
    snprintf(buffer, size, "@%s", random_str);
}

uint32_t test_generate_random_ip(void) {
    unsigned char ip[4];
    test_generate_random_data(ip, 4);

    ip[0] = (ip[0] % 223) + 1;
    if (ip[0] == 127) ip[0] = 10;
    if (ip[0] == 0) ip[0] = 192;

    return (uint32_t)ip[0] << 24 | (uint32_t)ip[1] << 16 |
           (uint32_t)ip[2] << 8 | (uint32_t)ip[3];
}

uint16_t test_generate_random_port(void) {
    unsigned char port[2];
    test_generate_random_data(port, 2);

    uint16_t p = (uint16_t)port[0] << 8 | (uint16_t)port[1];
    return (p % 60000) + 1024;
}

// ============================================================================
// Время
// ============================================================================

double test_get_time_ms(void) {
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0) {
        return 0.0;
    }
    return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1000000.0;
}

uint64_t test_get_time_us(void) {
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0) {
        return 0;
    }
    return (uint64_t)ts.tv_sec * 1000000 + (uint64_t)ts.tv_nsec / 1000;
}

void test_sleep_ms(int ms) {
    if (ms <= 0) return;
    usleep(ms * 1000);
}

void test_sleep_us(int us) {
    if (us <= 0) return;
    usleep(us);
}

// ============================================================================
// Работа с файлами
// ============================================================================

int test_write_to_file(const char *filename, const void *data, size_t size) {
    if (!filename || !data) return -1;

    int fd = open(filename, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        LOG_ERROR("Failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    ssize_t written = write(fd, data, size);
    close(fd);

    if (written != (ssize_t)size) {
        LOG_ERROR("Failed to write %zu bytes to %s: %s",
                  size, filename, strerror(errno));
        return -1;
    }

    return 0;
}

int test_read_from_file(const char *filename, void *data, size_t *size) {
    if (!filename || !data || !size) return -1;

    int fd = open(filename, O_RDONLY);
    if (fd < 0) {
        LOG_ERROR("Failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    ssize_t read_bytes = read(fd, data, *size);
    close(fd);

    if (read_bytes < 0) {
        LOG_ERROR("Failed to read from %s: %s", filename, strerror(errno));
        return -1;
    }

    *size = (size_t)read_bytes;
    return 0;
}

int test_file_exists(const char *filename) {
    if (!filename) return 0;
    struct stat st;
    return stat(filename, &st) == 0;
}

size_t test_file_size(const char *filename) {
    if (!filename) return 0;
    struct stat st;
    if (stat(filename, &st) != 0) return 0;
    return (size_t)st.st_size;
}

char* create_temp_file(const char *prefix) {
    static char filename[256];
    char template_path[256];

    const char *tmpdir = getenv("TMPDIR");
    if (!tmpdir) tmpdir = "/tmp";

    snprintf(template_path, sizeof(template_path), "%s/%sXXXXXX",
             tmpdir, prefix ? prefix : "test");

    int fd = mkstemp(template_path);
    if (fd < 0) {
        LOG_ERROR("Failed to create temp file: %s", strerror(errno));
        return NULL;
    }
    close(fd);

    snprintf(filename, sizeof(filename), "%s", template_path);
    return filename;
}

char* create_temp_dir(const char *prefix) {
    static char dirname[256];
    char template_path[256];

    const char *tmpdir = getenv("TMPDIR");
    if (!tmpdir) tmpdir = "/tmp";

    snprintf(template_path, sizeof(template_path), "%s/%sXXXXXX",
             tmpdir, prefix ? prefix : "test");

    if (!mkdtemp(template_path)) {
        LOG_ERROR("Failed to create temp dir: %s", strerror(errno));
        return NULL;
    }

    snprintf(dirname, sizeof(dirname), "%s", template_path);
    return dirname;
}

void test_delete_temp_file(const char *filename) {
    if (!filename) return;
    if (unlink(filename) != 0) {
        LOG_WARN("Failed to delete temp file %s: %s",
                 filename, strerror(errno));
    }
}

void test_delete_temp_dir(const char *dirname) {
    if (!dirname) return;
    if (rmdir(dirname) != 0) {
        LOG_WARN("Failed to delete temp dir %s: %s",
                 dirname, strerror(errno));
    }
}

// ============================================================================
// Сетевые утилиты
// ============================================================================

int test_is_valid_ipv4(const char *ip) {
    if (!ip) return 0;
    struct in_addr addr;
    return inet_pton(AF_INET, ip, &addr) == 1;
}

int test_is_valid_ipv6(const char *ip) {
    if (!ip) return 0;
    struct in6_addr addr;
    return inet_pton(AF_INET6, ip, &addr) == 1;
}

int test_is_valid_port(int port) {
    return port > 0 && port <= 65535;
}

int test_is_valid_mesh_id(const char *id) {
    if (!id) return 0;
    size_t len = strlen(id);
    if (len < 2 || len > 63) return 0;
    if (id[0] != '@') return 0;

    for (size_t i = 1; i < len; i++) {
        char c = id[i];
        if (!((c >= 'a' && c <= 'z') ||
              (c >= 'A' && c <= 'Z') ||
              (c >= '0' && c <= '9') ||
              c == '_' || c == '-')) {
            return 0;
        }
    }
    return 1;
}

const char* test_ip_to_string(uint32_t ip, char *buffer, size_t size) {
    if (!buffer || size < 16) return "invalid";
    snprintf(buffer, size, "%d.%d.%d.%d",
             (ip >> 24) & 0xFF,
             (ip >> 16) & 0xFF,
             (ip >> 8) & 0xFF,
             ip & 0xFF);
    return buffer;
}

uint32_t test_string_to_ip(const char *str) {
    if (!str) return 0;
    struct in_addr addr;
    if (inet_pton(AF_INET, str, &addr) != 1) {
        return 0;
    }
    return ntohl(addr.s_addr);
}

// ============================================================================
// Отладочная печать
// ============================================================================

void test_hex_dump(const char *label, const unsigned char *data, size_t len) {
    if (!label || !data) return;

    printf("\n%s (%zu bytes):\n", label, len);
    for (size_t i = 0; i < len; i += 16) {
        printf("  %04zx: ", i);
        for (size_t j = 0; j < 16 && i + j < len; j++) {
            printf("%02x ", data[i + j]);
            if (j == 7) printf(" ");
        }
        if (len - i < 16) {
            for (size_t j = len - i; j < 16; j++) {
                printf("   ");
                if (j == 7) printf(" ");
            }
        }
        printf(" | ");
        for (size_t j = 0; j < 16 && i + j < len; j++) {
            unsigned char c = data[i + j];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        printf("\n");
    }
}

void test_hex_dump_limited(const char *label, const unsigned char *data,
                          size_t len, size_t max_len) {
    if (!label || !data) return;

    size_t show_len = len;
    if (show_len > max_len) show_len = max_len;

    test_hex_dump(label, data, show_len);

    if (len > max_len) {
        printf("  ... (%zu more bytes)\n", len - max_len);
    }
}

void test_wireshark_dump(const unsigned char *data, size_t len) {
    if (!data) return;

    printf("Wireshark format (hex):\n");
    for (size_t i = 0; i < len; i++) {
        printf("%02x", data[i]);
        if ((i + 1) % 2 == 0) printf(" ");
        if ((i + 1) % 16 == 0) printf("\n");
    }
    if (len % 16 != 0) printf("\n");
}

// ============================================================================
// TCP Сервер
// ============================================================================

int test_tcp_server_start(test_tcp_server_t *server, int port) {
    if (!server) return -1;

    memset(server, 0, sizeof(test_tcp_server_t));

    server->socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server->socket_fd < 0) {
        LOG_ERROR("Failed to create socket: %s", strerror(errno));
        return -1;
    }

    int opt = 1;
    if (setsockopt(server->socket_fd, SOL_SOCKET, SO_REUSEADDR,
                   &opt, sizeof(opt)) < 0) {
        LOG_ERROR("Failed to set SO_REUSEADDR: %s", strerror(errno));
        close(server->socket_fd);
        return -1;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(port);

    if (bind(server->socket_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        LOG_ERROR("Failed to bind to port %d: %s", port, strerror(errno));
        close(server->socket_fd);
        return -1;
    }

    if (listen(server->socket_fd, 5) < 0) {
        LOG_ERROR("Failed to listen: %s", strerror(errno));
        close(server->socket_fd);
        return -1;
    }

    struct sockaddr_in bound_addr;
    socklen_t addr_len = sizeof(bound_addr);
    if (getsockname(server->socket_fd, (struct sockaddr*)&bound_addr,
                    &addr_len) == 0) {
        server->port = ntohs(bound_addr.sin_port);
    }

    server->running = 1;
    server->client_fd = -1;

    LOG_DEBUG("TCP server started on port %d", server->port);
    return 0;
}

void test_tcp_server_stop(test_tcp_server_t *server) {
    if (!server) return;

    server->running = 0;

    if (server->client_fd >= 0) {
        close(server->client_fd);
        server->client_fd = -1;
    }

    if (server->socket_fd >= 0) {
        close(server->socket_fd);
        server->socket_fd = -1;
    }

    LOG_DEBUG("TCP server stopped");
}

int test_tcp_server_accept(test_tcp_server_t *server, int timeout_ms) {
    if (!server || !server->running) return -1;

    struct timeval tv;
    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;

    fd_set readfds;
    FD_ZERO(&readfds);
    FD_SET(server->socket_fd, &readfds);

    int ret = select(server->socket_fd + 1, &readfds, NULL, NULL, &tv);
    if (ret < 0) {
        LOG_ERROR("select failed: %s", strerror(errno));
        return -1;
    }
    if (ret == 0) {
        LOG_DEBUG("Accept timeout (%d ms)", timeout_ms);
        return -2;
    }

    struct sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);
    server->client_fd = accept(server->socket_fd, (struct sockaddr*)&addr,
                               &addr_len);

    if (server->client_fd < 0) {
        LOG_ERROR("Accept failed: %s", strerror(errno));
        return -1;
    }

    LOG_DEBUG("Accepted connection");
    return 0;
}

int test_tcp_server_send(test_tcp_server_t *server,
                         const void *data, size_t len) {
    if (!server || server->client_fd < 0) return -1;

    ssize_t sent = write(server->client_fd, data, len);
    if (sent != (ssize_t)len) {
        LOG_ERROR("Failed to send %zu bytes: %s", len, strerror(errno));
        return -1;
    }

    return 0;
}

int test_tcp_server_receive(test_tcp_server_t *server,
                            void *buffer, size_t *len, int timeout_ms) {
    if (!server || server->client_fd < 0 || !buffer || !len) return -1;

    fd_set readfds;
    struct timeval tv;

    FD_ZERO(&readfds);
    FD_SET(server->client_fd, &readfds);

    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;

    int ret = select(server->client_fd + 1, &readfds, NULL, NULL, &tv);
    if (ret < 0) {
        LOG_ERROR("select failed: %s", strerror(errno));
        return -1;
    }
    if (ret == 0) {
        return -2;
    }

    ssize_t read_bytes = read(server->client_fd, buffer, *len);
    if (read_bytes < 0) {
        LOG_ERROR("Failed to read: %s", strerror(errno));
        return -1;
    }

    *len = (size_t)read_bytes;
    return 0;
}

// ============================================================================
// TCP Клиент
// ============================================================================

int test_tcp_client_connect(test_tcp_client_t *client,
                            const char *host, int port) {
    if (!client) return -1;

    memset(client, 0, sizeof(test_tcp_client_t));

    client->socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (client->socket_fd < 0) {
        LOG_ERROR("Failed to create socket: %s", strerror(errno));
        return -1;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);

    if (inet_pton(AF_INET, host, &addr.sin_addr) <= 0) {
        LOG_ERROR("Invalid host: %s", host);
        close(client->socket_fd);
        return -1;
    }

    if (connect(client->socket_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        LOG_ERROR("Failed to connect to %s:%d: %s",
                  host, port, strerror(errno));
        close(client->socket_fd);
        return -1;
    }

    snprintf(client->host, sizeof(client->host), "%s", host);
    client->port = port;
    client->connected = 1;

    LOG_DEBUG("Connected to %s:%d", host, port);
    return 0;
}

void test_tcp_client_disconnect(test_tcp_client_t *client) {
    if (!client) return;

    if (client->socket_fd >= 0) {
        close(client->socket_fd);
        client->socket_fd = -1;
    }

    client->connected = 0;
    LOG_DEBUG("Disconnected");
}

int test_tcp_client_send(test_tcp_client_t *client,
                         const void *data, size_t len) {
    if (!client || !client->connected) return -1;

    ssize_t sent = write(client->socket_fd, data, len);
    if (sent != (ssize_t)len) {
        LOG_ERROR("Failed to send %zu bytes: %s", len, strerror(errno));
        return -1;
    }

    return 0;
}

int test_tcp_client_receive(test_tcp_client_t *client,
                            void *buffer, size_t *len, int timeout_ms) {
    if (!client || !client->connected || !buffer || !len) return -1;

    fd_set readfds;
    struct timeval tv;

    FD_ZERO(&readfds);
    FD_SET(client->socket_fd, &readfds);

    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;

    int ret = select(client->socket_fd + 1, &readfds, NULL, NULL, &tv);
    if (ret < 0) {
        LOG_ERROR("select failed: %s", strerror(errno));
        return -1;
    }
    if (ret == 0) {
        return -2;
    }

    ssize_t read_bytes = read(client->socket_fd, buffer, *len);
    if (read_bytes < 0) {
        LOG_ERROR("Failed to read: %s", strerror(errno));
        return -1;
    }

    *len = (size_t)read_bytes;
    return 0;
}

// ============================================================================
// Бенчмаркинг
// ============================================================================

void test_benchmark_start(test_benchmark_t *bench) {
    if (!bench) return;
    memset(bench, 0, sizeof(test_benchmark_t));
    bench->start_time = test_get_time_us();
}

void test_benchmark_stop(test_benchmark_t *bench) {
    if (!bench) return;
    bench->end_time = test_get_time_us();
}

double test_benchmark_get_ops_per_sec(test_benchmark_t *bench) {
    if (!bench) return 0.0;
    uint64_t diff = bench->end_time - bench->start_time;
    if (diff == 0) return 0.0;
    return (double)bench->operations * 1000000.0 / (double)diff;
}

double test_benchmark_get_bytes_per_sec(test_benchmark_t *bench) {
    if (!bench) return 0.0;
    uint64_t diff = bench->end_time - bench->start_time;
    if (diff == 0) return 0.0;
    return (double)bench->bytes_processed * 1000000.0 / (double)diff;
}

void test_benchmark_print(test_benchmark_t *bench, const char *name) {
    if (!bench || !name) return;

    uint64_t diff = bench->end_time - bench->start_time;
    double ops_per_sec = test_benchmark_get_ops_per_sec(bench);
    double bytes_per_sec = test_benchmark_get_bytes_per_sec(bench);
    double ms = (double)diff / 1000.0;

    printf("\n📊 Benchmark: %s\n", name);
    printf("────────────────────────────────────────────────────────\n");
    printf("  Operations:  %llu\n", (unsigned long long)bench->operations);
    printf("  Bytes:       %llu\n", (unsigned long long)bench->bytes_processed);
    printf("  Time:        %.2f ms\n", ms);
    printf("  Ops/sec:     %.2f\n", ops_per_sec);
    printf("  Bytes/sec:   %.2f\n", bytes_per_sec);
    printf("────────────────────────────────────────────────────────\n");
}

// ============================================================================
// Парсинг аргументов
// ============================================================================

void test_parse_args(int argc, char *argv[], test_args_t *args) {
    if (!args) return;

    memset(args, 0, sizeof(test_args_t));
    args->iterations = 1;
    args->timeout_ms = 5000;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
            args->verbose = 1;
            g_log_level = LOG_LEVEL_DEBUG;
        }
        else if (strcmp(argv[i], "--all") == 0) {
            args->run_all = 1;
        }
        else if (strcmp(argv[i], "-f") == 0 && i + 1 < argc) {
            args->test_filter = argv[++i];
        }
        else if (strcmp(argv[i], "-c") == 0 && i + 1 < argc) {
            args->config_file = argv[++i];
        }
        else if (strcmp(argv[i], "-i") == 0 && i + 1 < argc) {
            args->iterations = atoi(argv[++i]);
        }
        else if (strcmp(argv[i], "-t") == 0 && i + 1 < argc) {
            args->timeout_ms = atoi(argv[++i]);
        }
        else if (strcmp(argv[i], "-b") == 0 && i + 1 < argc) {
            snprintf(args->broker, sizeof(args->broker), "%s", argv[++i]);
        }
        else if (strcmp(argv[i], "-u") == 0 && i + 1 < argc) {
            snprintf(args->username, sizeof(args->username), "%s", argv[++i]);
        }
        else if (strcmp(argv[i], "-p") == 0 && i + 1 < argc) {
            snprintf(args->password, sizeof(args->password), "%s", argv[++i]);
        }
        else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            test_print_usage(argv[0]);
            exit(0);
        }
    }
}

void test_print_usage(const char *progname) {
    printf("Usage: %s [options]\n", progname ? progname : "test");
    printf("\nOptions:\n");
    printf("  -v, --verbose    Enable verbose output\n");
    printf("  --all            Run all tests\n");
    printf("  -f <pattern>     Filter tests by pattern\n");
    printf("  -c <file>        Configuration file\n");
    printf("  -i <n>           Iterations\n");
    printf("  -t <ms>          Timeout in milliseconds\n");
    printf("  -b <broker>      MQTT broker address\n");
    printf("  -u <username>    MQTT username\n");
    printf("  -p <password>    MQTT password\n");
    printf("  -h, --help       Show this help\n");
}

// ============================================================================
// Валидация пакетов
// ============================================================================

int test_validate_mesh_packet(const unsigned char *data, size_t len) {
    if (!data || len < 4) return -1;

    uint32_t magic = *(uint32_t*)data;
    if (magic != 0x4D455348) {
        LOG_DEBUG("Invalid magic: 0x%08X", magic);
        return -2;
    }

    if (len < sizeof(mesh_packet_t)) {
        LOG_DEBUG("Packet too small: %zu < %zu",
                  len, sizeof(mesh_packet_t));
        return -3;
    }

    const mesh_packet_t *packet = (const mesh_packet_t*)data;
    if (packet->version != MESH_PACKET_VERSION) {
        LOG_DEBUG("Unsupported version: %u", packet->version);
        return -4;
    }

    if (packet->type > MESH_MSG_TYPE_MAX) {
        LOG_DEBUG("Invalid type: %u", packet->type);
        return -5;
    }

    if (packet->payload_len > MESH_PAYLOAD_MAX) {
        LOG_DEBUG("Payload too large: %u", packet->payload_len);
        return -6;
    }

    if (packet->hop_count > packet->max_hops) {
        LOG_DEBUG("Hops exceeded: %u > %u",
                  packet->hop_count, packet->max_hops);
        return -7;
    }

    return 0;
}

int test_validate_mtproto_packet(const unsigned char *data, size_t len) {
    if (!data || len < 4) return -1;

    if (len < 20) {
        LOG_DEBUG("MTProto packet too small: %zu", len);
        return -2;
    }

    uint64_t auth_key_id = *(uint64_t*)data;
    if (auth_key_id == 0) {
        if (len >= 24) {
            uint32_t func = *(uint32_t*)(data + 20);
            if (func == 0x60469778 || func == 0xbe7e8ef1) {
                return 0;
            }
        }
        LOG_DEBUG("Unknown unencrypted MTProto packet");
        return -3;
    }

    int has_nonzero = 0;
    for (int i = 8; i < 24; i++) {
        if (data[i] != 0) {
            has_nonzero = 1;
            break;
        }
    }
    if (!has_nonzero) {
        LOG_DEBUG("Empty msg_key");
        return -4;
    }

    return 0;
}

// ============================================================================
// Тестовые данные
// ============================================================================

void create_test_packet(uint32_t type, const char *receiver,
                        const void *data, uint32_t data_len,
                        unsigned char *output, size_t *output_len) {
    if (!output || !output_len) return;

    mesh_packet_t *packet = mesh_packet_create(type, receiver, data, data_len);
    if (!packet) {
        *output_len = 0;
        return;
    }

    *output_len = sizeof(mesh_packet_t) + packet->payload_len;
    memcpy(output, packet, *output_len);

    mesh_packet_free(packet);
}

void create_mtproto_packet(unsigned char *output, size_t *output_len) {
    if (!output || !output_len) return;

    uint32_t packet[] = {
        0x00000000,
        0x60469778,
        0x12345678,
        0x9ABCDEF0,
        0x00000000,
        0x00000000
    };

    *output_len = sizeof(packet);
    memcpy(output, packet, sizeof(packet));
}

void create_onemesh_packet(const char *city, const char *device_id,
                           unsigned char *output, size_t *output_len) {
    if (!output || !output_len || !city || !device_id) return;

    char message[128];
    snprintf(message, sizeof(message),
             "Test message from %s device %s at %ld",
             city, device_id, time(NULL));

    create_test_packet(MESH_MSG_TYPE_MTPROTO, device_id,
                      message, strlen(message) + 1,
                      output, output_len);
}
