/*
    Test Utilities - Заголовочный файл
    Вспомогательные функции для тестирования
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
 * Начать тест с указанным именем
 */
#define TEST_START(name) \
    do { \
        printf(COLOR_BOLD COLOR_CYAN "\n=== Test: %s ===\n" COLOR_RESET, name); \
        time_t now = time(NULL); \
        printf("Started at: %s", ctime(&now)); \
        printf("\n"); \
    } while(0)

/**
 * Завершить тест успешно
 */
#define TEST_END() \
    do { \
        printf(COLOR_GREEN "\n✅ Test completed successfully\n" COLOR_RESET); \
        time_t now = time(NULL); \
        printf("Finished at: %s", ctime(&now)); \
        return 0; \
    } while(0)

/**
 * Отметить пройденный шаг
 */
#define TEST_PASS(format, ...) \
    printf(COLOR_GREEN "✅ PASS: " COLOR_RESET format "\n", ##__VA_ARGS__)

/**
 * Отметить проваленный шаг
 */
#define TEST_FAIL(format, ...) \
    do { \
        printf(COLOR_RED "❌ FAIL: " COLOR_RESET format "\n", ##__VA_ARGS__); \
        return -1; \
    } while(0)

/**
 * Проверить условие
 */
#define TEST_ASSERT(condition, format, ...) \
    do { \
        if (!(condition)) { \
            TEST_FAIL("Assertion failed: %s - " format, #condition, ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверить равенство значений
 */
#define TEST_ASSERT_EQ(expected, actual, format, ...) \
    do { \
        if ((expected) != (actual)) { \
            TEST_FAIL("Expected %lld, got %lld - " format, \
                     (long long)(expected), (long long)(actual), ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверить равенство строк
 */
#define TEST_ASSERT_STR_EQ(expected, actual, format, ...) \
    do { \
        if (strcmp((expected), (actual)) != 0) { \
            TEST_FAIL("Expected '%s', got '%s' - " format, \
                     (expected), (actual), ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверить равенство памяти
 */
#define TEST_ASSERT_MEM_EQ(expected, actual, size, format, ...) \
    do { \
        if (memcmp((expected), (actual), (size)) != 0) { \
            TEST_FAIL("Memory mismatch - " format, ##__VA_ARGS__); \
        } \
    } while(0)

/**
 * Проверить, что значение не NULL
 */
#define TEST_ASSERT_NOT_NULL(ptr, format, ...) \
    TEST_ASSERT((ptr) != NULL, "Pointer is NULL - " format, ##__VA_ARGS__)

/**
 * Проверить, что значение NULL
 */
#define TEST_ASSERT_NULL(ptr, format, ...) \
    TEST_ASSERT((ptr) == NULL, "Pointer is not NULL - " format, ##__VA_ARGS__)

/**
 * Проверить, что значение > 0
 */
#define TEST_ASSERT_POSITIVE(val, format, ...) \
    TEST_ASSERT((val) > 0, "Value is not positive (%lld) - " format, \
                (long long)(val), ##__VA_ARGS__)

/**
 * Проверить, что значение в диапазоне
 */
#define TEST_ASSERT_RANGE(val, min, max, format, ...) \
    TEST_ASSERT((val) >= (min) && (val) <= (max), \
                "Value %lld out of range [%lld, %lld] - " format, \
                (long long)(val), (long long)(min), (long long)(max), ##__VA_ARGS__)

/**
 * Пропустить тест
 */
#define TEST_SKIP(format, ...) \
    do { \
        printf(COLOR_YELLOW "⏭️ SKIP: " COLOR_RESET format "\n", ##__VA_ARGS__); \
        return 0; \
    } while(0)

// ============================================================================
// Логирование
// ============================================================================

/**
 * Уровни логирования
 */
typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_ERROR = 3,
    LOG_LEVEL_NONE = 4
} log_level_t;

/**
 * Глобальный уровень логирования
 */
extern log_level_t g_log_level;

/**
 * Функция логирования
 */
void test_log(log_level_t level, const char *file, int line,
              const char *format, ...) __attribute__((format(printf, 4, 5)));

/**
 * Макросы для логирования
 */
#define LOG_DEBUG(format, ...) \
    test_log(LOG_LEVEL_DEBUG, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_INFO(format, ...) \
    test_log(LOG_LEVEL_INFO, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_WARN(format, ...) \
    test_log(LOG_LEVEL_WARN, __FILE__, __LINE__, format, ##__VA_ARGS__)

#define LOG_ERROR(format, ...) \
    test_log(LOG_LEVEL_ERROR, __FILE__, __LINE__, format, ##__VA_ARGS__)

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Сгенерировать случайные данные
 * @param buffer Буфер для заполнения
 * @param size Размер буфера
 */
void test_generate_random_data(unsigned char *buffer, size_t size);

/**
 * Сгенерировать случайную строку
 * @param buffer Буфер для заполнения
 * @param size Размер буфера
 */
void test_generate_random_string(char *buffer, size_t size);

/**
 * Получить текущее время в миллисекундах
 * @return Время в мс
 */
double test_get_time_ms(void);

/**
 * Приостановить выполнение на указанное количество мс
 * @param ms Количество миллисекунд
 */
void test_sleep_ms(int ms);

// ============================================================================
// Работа с файлами
// ============================================================================

/**
 * Записать данные в файл
 * @param filename Имя файла
 * @param data Данные для записи
 * @param size Размер данных
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int test_write_to_file(const char *filename, const void *data, size_t size);

/**
 * Прочитать данные из файла
 * @param filename Имя файла
 * @param data Буфер для данных
 * @param size Указатель на размер буфера (на выходе - прочитанный размер)
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int test_read_from_file(const char *filename, void *data, size_t *size);

/**
 * Создать временный файл
 * @param prefix Префикс имени файла
 * @return Имя созданного файла (статический буфер)
 */
char* create_temp_file(const char *prefix);

/**
 * Создать временную директорию
 * @param prefix Префикс имени директории
 * @return Имя созданной директории (статический буфер)
 */
char* create_temp_dir(const char *prefix);

/**
 * Удалить временный файл
 * @param filename Имя файла
 */
void test_delete_temp_file(const char *filename);

/**
 * Удалить временную директорию
 * @param dirname Имя директории
 */
void test_delete_temp_dir(const char *dirname);

// ============================================================================
// Сетевые утилиты
// ============================================================================

/**
 * Проверить, является ли строка корректным IPv4 адресом
 * @param ip Строка с IP адресом
 * @return 1 если корректный, 0 если нет
 */
int test_is_valid_ipv4(const char *ip);

/**
 * Проверить, является ли строка корректным IPv6 адресом
 * @param ip Строка с IP адресом
 * @return 1 если корректный, 0 если нет
 */
int test_is_valid_ipv6(const char *ip);

/**
 * Проверить, является ли порт корректным
 * @param port Номер порта
 * @return 1 если корректный, 0 если нет
 */
int test_is_valid_port(int port);

/**
 * Проверить, является ли строка корректным Mesh ID
 * @param id Строка с ID
 * @return 1 если корректный, 0 если нет
 */
int test_is_valid_mesh_id(const char *id);

// ============================================================================
// Отладочная печать
// ============================================================================

/**
 * Вывести Hex-дамп данных
 * @param label Метка для вывода
 * @param data Данные
 * @param len Длина данных
 */
void test_hex_dump(const char *label, const unsigned char *data, size_t len);

/**
 * Вывести Hex-дамп данных с ограничением
 * @param label Метка для вывода
 * @param data Данные
 * @param len Длина данных
 * @param max_len Максимальная длина для вывода
 */
void test_hex_dump_limited(const char *label, const unsigned char *data,
                          size_t len, size_t max_len);

// ============================================================================
// Тестовые моки для MQTT
// ============================================================================

/**
 * Структура мок-сообщения
 */
typedef struct test_mock_message {
    char topic[256];             // Топик
    void *payload;               // Данные
    size_t payload_len;          // Длина данных
    int qos;                     // QoS
    int retained;                // Retained флаг
    time_t timestamp;            // Время создания
} test_mock_message_t;

/**
 * Структура очереди мок-сообщений
 */
typedef struct test_mock_queue {
    test_mock_message_t *messages;  // Массив сообщений
    size_t count;                   // Количество сообщений
    size_t capacity;                // Вместимость
} test_mock_queue_t;

/**
 * Инициализировать очередь мок-сообщений
 * @param queue Указатель на очередь
 */
void test_mock_queue_init(test_mock_queue_t *queue);

/**
 * Освободить ресурсы очереди
 * @param queue Указатель на очередь
 */
void test_mock_queue_destroy(test_mock_queue_t *queue);

/**
 * Добавить сообщение в очередь
 * @param queue Указатель на очередь
 * @param topic Топик
 * @param payload Данные
 * @param payload_len Длина данных
 * @param qos QoS
 * @param retained Retained флаг
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int test_mock_queue_push(test_mock_queue_t *queue, const char *topic,
                        const void *payload, size_t payload_len,
                        int qos, int retained);

/**
 * Извлечь сообщение из очереди
 * @param queue Указатель на очередь
 * @param msg Указатель на структуру для заполнения
 * @return 0 при успехе, -1 если очередь пуста
 */
int test_mock_queue_pop(test_mock_queue_t *queue, test_mock_message_t *msg);

/**
 * Проверить, пуста ли очередь
 * @param queue Указатель на очередь
 * @return 1 если пуста, 0 если нет
 */
int test_mock_queue_empty(test_mock_queue_t *queue);

/**
 * Получить количество сообщений в очереди
 * @param queue Указатель на очередь
 * @return Количество сообщений
 */
size_t test_mock_queue_count(test_mock_queue_t *queue);

/**
 * Очистить очередь
 * @param queue Указатель на очередь
 */
void test_mock_queue_clear(test_mock_queue_t *queue);

// ============================================================================
// Валидация пакетов
// ============================================================================

/**
 * Проверить заголовок пакета
 * @param data Данные пакета
 * @param len Длина данных
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int test_validate_packet_header(const unsigned char *data, size_t len);

// ============================================================================
// Стресс-тестирование
// ============================================================================

/**
 * Конфигурация стресс-теста
 */
typedef struct {
    int iterations;              // Количество итераций
    int threads;                 // Количество потоков
    int test_duration;           // Длительность в секундах
    int (*test_func)(void *arg); // Функция теста
    void *test_arg;              // Аргумент для функции
    volatile int running;        // Флаг работы
    volatile int errors;         // Количество ошибок
    pthread_t *threads_array;    // Массив потоков
} test_stress_config_t;

/**
 * Запустить стресс-тест
 * @param config Конфигурация теста
 * @return Количество ошибок или отрицательное значение при ошибке
 */
int test_stress_run(test_stress_config_t *config);

// ============================================================================
// Бенчмаркинг
// ============================================================================

/**
 * Структура для бенчмаркинга
 */
typedef struct {
    uint64_t start_time;         // Время начала (мс)
    uint64_t end_time;           // Время окончания (мс)
    uint64_t operations;         // Количество операций
    uint64_t bytes_processed;    // Обработано байт
} test_benchmark_t;

/**
 * Начать бенчмарк
 * @param bench Указатель на структуру
 */
void test_benchmark_start(test_benchmark_t *bench);

/**
 * Остановить бенчмарк
 * @param bench Указатель на структуру
 */
void test_benchmark_stop(test_benchmark_t *bench);

/**
 * Получить операции в секунду
 * @param bench Указатель на структуру
 * @return Операций в секунду
 */
double test_benchmark_get_ops_per_sec(test_benchmark_t *bench);

/**
 * Получить байт в секунду
 * @param bench Указатель на структуру
 * @return Байт в секунду
 */
double test_benchmark_get_bytes_per_sec(test_benchmark_t *bench);

/**
 * Вывести результаты бенчмарка
 * @param bench Указатель на структуру
 * @param name Название теста
 */
void test_benchmark_print(test_benchmark_t *bench, const char *name);

// ============================================================================
// Дополнительные утилиты
// ============================================================================

/**
 * Создать тестового Mesh-клиента (для интеграционных тестов)
 * @param node_id ID узла
 * @param host Хост
 * @param port Порт
 * @return Дескриптор сокета или -1 при ошибке
 */
int create_mesh_client(const char *node_id, const char *host, int port);

/**
 * Ожидать появления Mesh-узла в сети
 * @param node_id ID узла
 * @param timeout_ms Таймаут в мс
 * @return 1 если найден, 0 если нет
 */
int test_wait_for_mesh_node(const char *node_id, int timeout_ms);

/**
 * Проверить, что пакет является валидным Mesh-пакетом
 * @param data Данные пакета
 * @param len Длина данных
 * @return 1 если валидный, 0 если нет
 */
int test_is_valid_mesh_packet(const unsigned char *data, size_t len);

/**
 * Сравнить два Mesh-пакета
 * @param pkt1 Первый пакет
 * @param pkt2 Второй пакет
 * @param len Длина для сравнения
 * @return 0 если равны, иначе различие
 */
int compare_mesh_packets(const unsigned char *pkt1,
                              const unsigned char *pkt2, size_t len);

/**
 * Создать тестовое сообщение для отправки
 * @param type Тип сообщения
 * @param receiver_id ID получателя
 * @param data Данные
 * @param data_len Длина данных
 * @return Указатель на созданный пакет или NULL
 */
void* create_test_message(uint32_t type, const char *receiver_id,
                               const void *data, uint32_t data_len);

/**
 * Освободить тестовое сообщение
 * @param msg Указатель на сообщение
 */
void test_free_test_message(void *msg);