/*
    Test Utilities - Заголовочный файл
    Вспомогательные функции для тестирования
    Версия с исправлениями памяти и защиты
*/

#pragma once

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdint.h>
#include <stdarg.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <errno.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>

// ============================================================================
// Цвета для вывода в консоль (ANSI)
// ============================================================================

#define COLOR_RESET   "\033[0m"
#define COLOR_RED     "\033[31m"
#define COLOR_GREEN   "\033[32m"
#define COLOR_YELLOW  "\033[33m"
#define COLOR_BLUE    "\033[34m"
#define COLOR_MAGENTA "\033[35m"
#define COLOR_CYAN    "\033[36m"
#define COLOR_WHITE   "\033[37m"
#define COLOR_BOLD    "\033[1m"

// ============================================================================
// Макросы для тестирования
// ============================================================================

/**
 * Начало теста
 */
#define TEST_START(name) \
    do { \
        printf(COLOR_BOLD COLOR_CYAN "\n=== Test: %s ===\n" COLOR_RESET, name); \
        time_t now = time(NULL); \
        printf("Started at: %s", ctime(&now)); \
        printf("\n"); \
    } while(0)

/**
 * Тест пройден
 */
#define TEST_PASS(format, ...) \
    printf(COLOR_GREEN "✅ PASS: " COLOR_RESET format "\n", ##__VA_ARGS__)

/**
 * Тест провален
 */
#define TEST_FAIL(format, ...) \
    do { \
        printf(COLOR_RED "❌ FAIL: " COLOR_RESET format "\n", ##__VA_ARGS__); \
        return -1; \
    } while(0)

/**
 * Проверка условия
 */
#define TEST_ASSERT(condition, format, ...) \
    do { \
        if (!(condition)) { \
            TEST_FAIL("Assertion failed: %s - " format, #condition, ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверка равенства
 */
#define TEST_ASSERT_EQ(expected, actual, format, ...) \
    do { \
        if ((expected) != (actual)) { \
            TEST_FAIL("Expected %lld, got %lld - " format, \
                     (long long)(expected), (long long)(actual), ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверка равенства строк
 */
#define TEST_ASSERT_STR_EQ(expected, actual, format, ...) \
    do { \
        if (strcmp((expected), (actual)) != 0) { \
            TEST_FAIL("Expected '%s', got '%s' - " format, \
                     (expected), (actual), ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверка равенства памяти
 */
#define TEST_ASSERT_MEM_EQ(expected, actual, size, format, ...) \
    do { \
        if (memcmp((expected), (actual), (size)) != 0) { \
            TEST_FAIL("Memory mismatch - " format, ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверка что значение > 0
 */
#define TEST_ASSERT_POSITIVE(value, format, ...) \
    TEST_ASSERT((value) > 0, format, ##__VA_ARGS__)

/**
 * Проверка что значение не NULL
 */
#define TEST_ASSERT_NOT_NULL(ptr, format, ...) \
    TEST_ASSERT((ptr) != NULL, format, ##__VA_ARGS__)

/**
 * Проверка что значение NULL
 */
#define TEST_ASSERT_NULL(ptr, format, ...) \
    TEST_ASSERT((ptr) == NULL, format, ##__VA_ARGS__)

/**
 * Конец теста
 */
#define TEST_END() \
    do { \
        printf(COLOR_GREEN "\n✅ Test completed successfully\n" COLOR_RESET); \
        time_t now = time(NULL); \
        printf("Finished at: %s", ctime(&now)); \
        return 0; \
    } while(0)

/**
 * Пропуск теста
 */
#define TEST_SKIP(format, ...) \
    do { \
        printf(COLOR_YELLOW "⏭️ SKIP: " COLOR_RESET format "\n", ##__VA_ARGS__); \
        return 0; \
    } while(0)

/**
 * Ожидание условия с таймаутом
 */
#define TEST_WAIT_FOR(condition, timeout_ms) \
    do { \
        int _wait_count = 0; \
        while (!(condition) && _wait_count < (timeout_ms) / 10) { \
            usleep(10000); \
            _wait_count++; \
        } \
        TEST_ASSERT(condition, "Timeout waiting for condition"); \
    } while(0)

// ============================================================================
// Уровни логирования
// ============================================================================

typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_ERROR = 3,
    LOG_LEVEL_NONE = 4
} log_level_t;

extern log_level_t g_log_level;

// ============================================================================
// Функции логирования
// ============================================================================

/**
 * Логирование сообщения
 */
void test_log(log_level_t level, const char *file, int line,
              const char *format, ...) __attribute__((format(printf, 4, 5)));

#define LOG_DEBUG(format, ...) \
    test_log(LOG_LEVEL_DEBUG, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_INFO(format, ...) \
    test_log(LOG_LEVEL_INFO, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_WARN(format, ...) \
    test_log(LOG_LEVEL_WARN, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_ERROR(format, ...) \
    test_log(LOG_LEVEL_ERROR, __FILE__, __LINE__, format, ##__VA_ARGS__)

// ============================================================================
// Генерация случайных данных
// ============================================================================

/**
 * Сгенерировать случайные данные
 */
void test_generate_random_data(unsigned char *buffer, size_t size);

/**
 * Сгенерировать случайную строку
 */
void test_generate_random_string(char *buffer, size_t size);

/**
 * Сгенерировать случайный Mesh ID
 */
void test_generate_mesh_id(char *buffer, size_t size);

/**
 * Сгенерировать случайный IP адрес
 */
uint32_t test_generate_random_ip(void);

/**
 * Сгенерировать случайный порт
 */
uint16_t test_generate_random_port(void);

// ============================================================================
// Время
// ============================================================================

/**
 * Получить текущее время в миллисекундах
 */
double test_get_time_ms(void);

/**
 * Получить текущее время в микросекундах
 */
uint64_t test_get_time_us(void);

/**
 * Спать указанное количество миллисекунд
 */
void test_sleep_ms(int ms);

/**
 * Спать указанное количество микросекунд
 */
void test_sleep_us(int us);

// ============================================================================
// Работа с файлами
// ============================================================================

/**
 * Записать данные в файл
 * @return 0 при успехе, отрицательное при ошибке
 */
int test_write_to_file(const char *filename, const void *data, size_t size);

/**
 * Прочитать данные из файла
 * @return 0 при успехе, отрицательное при ошибке
 */
int test_read_from_file(const char *filename, void *data, size_t *size);

/**
 * Создать временный файл
 * @return Имя файла или NULL при ошибке
 */
char* create_temp_file(const char *prefix);

/**
 * Создать временную директорию
 * @return Имя директории или NULL при ошибке
 */
char* create_temp_dir(const char *prefix);

/**
 * Удалить временный файл
 */
void test_delete_temp_file(const char *filename);

/**
 * Удалить временную директорию
 */
void test_delete_temp_dir(const char *dirname);

/**
 * Проверить существование файла
 */
int test_file_exists(const char *filename);

/**
 * Получить размер файла
 */
size_t test_file_size(const char *filename);

// ============================================================================
// Сетевые утилиты
// ============================================================================

/**
 * Проверить валидность IPv4 адреса
 */
int test_is_valid_ipv4(const char *ip);

/**
 * Проверить валидность IPv6 адреса
 */
int test_is_valid_ipv6(const char *ip);

/**
 * Проверить валидность порта
 */
int test_is_valid_port(int port);

/**
 * Проверить валидность Mesh ID
 */
int test_is_valid_mesh_id(const char *id);

/**
 * Получить IP адрес в виде строки
 */
const char* test_ip_to_string(uint32_t ip, char *buffer, size_t size);

/**
 * Получить IP адрес из строки
 */
uint32_t test_string_to_ip(const char *str);

// ============================================================================
// Работа с сокетами
// ============================================================================

/**
 * Структура TCP сервера для тестирования
 */
typedef struct test_tcp_server {
    int socket_fd;
    int port;
    int running;
    pthread_t thread;
    int client_fd;
} test_tcp_server_t;

/**
 * Запустить TCP сервер
 */
int test_tcp_server_start(test_tcp_server_t *server, int port);

/**
 * Остановить TCP сервер
 */
void test_tcp_server_stop(test_tcp_server_t *server);

/**
 * Принять соединение на TCP сервере
 */
int test_tcp_server_accept(test_tcp_server_t *server, int timeout_ms);

/**
 * Отправить данные через TCP сервер
 */
int test_tcp_server_send(test_tcp_server_t *server, const void *data, size_t len);

/**
 * Получить данные через TCP сервер
 */
int test_tcp_server_receive(test_tcp_server_t *server, void *buffer, size_t *len, int timeout_ms);

/**
 * Структура TCP клиента для тестирования
 */
typedef struct test_tcp_client {
    int socket_fd;
    char host[256];
    int port;
    int connected;
} test_tcp_client_t;

/**
 * Подключить TCP клиент
 */
int test_tcp_client_connect(test_tcp_client_t *client, const char *host, int port);

/**
 * Отключить TCP клиент
 */
void test_tcp_client_disconnect(test_tcp_client_t *client);

/**
 * Отправить данные через TCP клиент
 */
int test_tcp_client_send(test_tcp_client_t *client, const void *data, size_t len);

/**
 * Получить данные через TCP клиент
 */
int test_tcp_client_receive(test_tcp_client_t *client, void *buffer, size_t *len, int timeout_ms);

// ============================================================================
// Отладочная печать
// ============================================================================

/**
 * Вывести Hex-дамп данных
 */
void test_hex_dump(const char *label, const unsigned char *data, size_t len);

/**
 * Вывести Hex-дамп с ограничением
 */
void test_hex_dump_limited(const char *label, const unsigned char *data,
                          size_t len, size_t max_len);

/**
 * Вывести дамп пакета в формате Wireshark
 */
void test_wireshark_dump(const unsigned char *data, size_t len);

// ============================================================================
// Моки для тестирования
// ============================================================================

/**
 * Структура для мок-сообщений
 */
typedef struct test_mock_message {
    char topic[256];
    void *payload;
    size_t payload_len;
    int qos;
    int retained;
    time_t timestamp;
} test_mock_message_t;

/**
 * Очередь мок-сообщений
 */
typedef struct test_mock_queue {
    test_mock_message_t *messages;
    size_t count;
    size_t capacity;
    size_t head;
    size_t tail;
} test_mock_queue_t;

/**
 * Инициализация мок-очереди
 */
void test_mock_queue_init(test_mock_queue_t *queue);

/**
 * Очистка мок-очереди
 */
void test_mock_queue_destroy(test_mock_queue_t *queue);

/**
 * Добавить сообщение в очередь
 */
int test_mock_queue_push(test_mock_queue_t *queue, const char *topic,
                        const void *payload, size_t payload_len,
                        int qos, int retained);

/**
 * Получить сообщение из очереди
 */
int test_mock_queue_pop(test_mock_queue_t *queue, test_mock_message_t *msg);

/**
 * Очистить очередь
 */
void test_mock_queue_clear(test_mock_queue_t *queue);

/**
 * Проверить, пуста ли очередь
 */
int test_mock_queue_empty(test_mock_queue_t *queue);

/**
 * Получить количество сообщений
 */
size_t test_mock_queue_count(test_mock_queue_t *queue);

// ============================================================================
// Производительность
// ============================================================================

/**
 * Структура для бенчмарка
 */
typedef struct test_benchmark {
    uint64_t start_time;
    uint64_t end_time;
    uint64_t operations;
    uint64_t bytes_processed;
} test_benchmark_t;

/**
 * Начать бенчмарк
 */
void test_benchmark_start(test_benchmark_t *bench);

/**
 * Остановить бенчмарк
 */
void test_benchmark_stop(test_benchmark_t *bench);

/**
 * Получить операции в секунду
 */
double test_benchmark_get_ops_per_sec(test_benchmark_t *bench);

/**
 * Получить байты в секунду
 */
double test_benchmark_get_bytes_per_sec(test_benchmark_t *bench);

/**
 * Вывести результаты бенчмарка
 */
void test_benchmark_print(test_benchmark_t *bench, const char *name);

// ============================================================================
// Парсинг аргументов
// ============================================================================

/**
 * Аргументы командной строки для тестов
 */
typedef struct test_args {
    int verbose;
    int run_all;
    char *test_filter;
    char *config_file;
    int iterations;
    int timeout_ms;
    int city_code;
    char broker[256];
    char username[64];
    char password[64];
} test_args_t;

/**
 * Парсинг аргументов командной строки
 */
void test_parse_args(int argc, char *argv[], test_args_t *args);

/**
 * Вывод справки
 */
void test_print_usage(const char *progname);

// ============================================================================
// OneMesh утилиты
// ============================================================================

/**
 * Структура для парсинга топика OneMesh
 */
typedef struct onemesh_topic {
    char network[16];      // msh
    char region[8];        // RU
    char city[8];          // SPB, MOS, etc.
    char type[32];         // device, stat, position, etc.
    char subtype[64];      // inbox, status, etc.
    char device_id[64];    // ID устройства
} onemesh_topic_t;

/**
 * Парсинг топика OneMesh
 */
int onemesh_parse_topic(const char *topic, onemesh_topic_t *result);

/**
 * Вывод информации о топике
 */
void onemesh_print_topic(const onemesh_topic_t *topic);

/**
 * Создание топика OneMesh
 */
int onemesh_build_topic(char *buffer, size_t buffer_size,
                       const char *city, const char *type,
                       const char *device_id, const char *subtype);

/**
 * Получить список кодов городов
 */
const char** onemesh_get_cities(void);

/**
 * Получить количество городов
 */
int onemesh_get_city_count(void);

// ============================================================================
// Валидация пакетов
// ============================================================================

/**
 * Проверить валидность Mesh пакета
 */
int test_validate_mesh_packet(const unsigned char *data, size_t len);

/**
 * Проверить валидность MTProto пакета
 */
int test_validate_mtproto_packet(const unsigned char *data, size_t len);

// ============================================================================
// Тестовые данные
// ============================================================================

/**
 * Создать тестовый Mesh пакет
 */
void create_test_packet(uint32_t type, const char *receiver,
                            const void *data, uint32_t data_len,
                            unsigned char *output, size_t *output_len);

/**
 * Создать тестовый MTProto пакет
 */
void create_mtproto_packet(unsigned char *output, size_t *output_len);

/**
 * Создать тестовый OneMesh пакет
 */
void create_onemesh_packet(const char *city, const char *device_id,
                               unsigned char *output, size_t *output_len);