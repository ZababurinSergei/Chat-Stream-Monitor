/*
    Mesh MQTT Module - Заголовочный файл
    Для интеграции с MTProto Proxy
    Поддерживает Paho MQTT Client
    Настройки для OneMesh (mqtt.onemesh.ru:1883)
    С поддержкой Meshtastic Protobuf сообщений
*/

#pragma once

#include <stdint.h>
#include <stddef.h>
#include <time.h>
#include <stdbool.h>
#include "mesh-packet.h"
#include "mesh-user.h"

// ============================================================================
// Настройки OneMesh (как в MQTT Explorer)
// ============================================================================

/** Хост MQTT брокера OneMesh (как в MQTT Explorer) */
#define ONEMESH_HOST_DEFAULT       "mqtt.onemesh.ru"

/** Порт MQTT брокера OneMesh (1883 - без TLS, 8883 - с TLS) */
#define ONEMESH_PORT_DEFAULT       1883

/** Имя пользователя для подключения к OneMesh (onemeshd для downlink) */
#define ONEMESH_USERNAME_DEFAULT   "onemeshd"

/** Пароль для подключения к OneMesh */
#define ONEMESH_PASSWORD_DEFAULT   "onecat"

/** Корневой топик для OneMesh (по умолчанию) */
#define ONEMESH_TOPIC_ROOT_DEFAULT "msh/RU/XXX"

/** Код города по умолчанию (Санкт-Петербург) */
#define ONEMESH_CITY_CODE_DEFAULT  "SPB"

/** Полный адрес брокера по умолчанию */
#define ONEMESH_BROKER_DEFAULT     "mqtt://mqtt.onemesh.ru:1883"

/** Таймаут подключения в секундах */
#define ONEMESH_CONNECT_TIMEOUT    30

/** Keep-alive интервал в секундах */
#define ONEMESH_KEEPALIVE_INTERVAL 60

/** QoS по умолчанию */
#define ONEMESH_DEFAULT_QOS        1

/** Максимальное количество попыток переподключения */
#define ONEMESH_MAX_RECONNECT      5

/** Задержка между попытками переподключения (сек) */
#define ONEMESH_RECONNECT_DELAY    5

/** Минимальный размер Mesh-пакета для валидации */
#define ONEMESH_MIN_PACKET_SIZE    sizeof(mesh_packet_t)

// ============================================================================
// Топики MQTT для ключей
// ============================================================================

#define MESH_TOPIC_PUBLIC_KEY      "mesh/users/%s/public"
#define MESH_TOPIC_PQ_PUBLIC_KEY   "mesh/users/%s/pq-public"
#define MESH_TOPIC_INBOX           "mesh/users/%s/inbox"
#define MESH_TOPIC_KEY_REQUEST     "mesh/users/%s/request-key"
#define MESH_TOPIC_KEY_RESPONSE    "mesh/users/%s/public-response"
#define MESH_TOPIC_BROADCAST       "mesh/broadcast"

// ============================================================================
// Типы сообщений (дополнительные к mesh-packet.h)
// ============================================================================

/**
 * Типы форматов сообщений
 */
typedef enum {
    MESH_FORMAT_UNKNOWN = 0,     /**< Неизвестный формат */
    MESH_FORMAT_MESH = 1,        /**< Собственный Mesh-формат (0x4D455348) */
    MESH_FORMAT_PROTOBUF = 2,    /**< Protobuf (Meshtastic) */
    MESH_FORMAT_JSON = 3,        /**< JSON формат */
    MESH_FORMAT_BINARY = 4       /**< Бинарный формат */
} mesh_message_format_t;

/**
 * Типы команд для управления MQTT модулем
 */
typedef enum {
    MESH_CMD_NONE = 0,
    MESH_CMD_CONNECT,
    MESH_CMD_DISCONNECT,
    MESH_CMD_SUBSCRIBE,
    MESH_CMD_UNSUBSCRIBE,
    MESH_CMD_PUBLISH,
    MESH_CMD_PING,
    MESH_CMD_STATS,
    MESH_CMD_RECONNECT,
    MESH_CMD_SHUTDOWN
} mesh_mqtt_command_t;

/**
 * Статусы подключения
 */
typedef enum {
    MESH_STATUS_DISCONNECTED = 0,
    MESH_STATUS_CONNECTING,
    MESH_STATUS_CONNECTED,
    MESH_STATUS_RECONNECTING,
    MESH_STATUS_ERROR
} mesh_connection_status_t;

// ============================================================================
// Пакеты для обмена ключами
// ============================================================================

/**
 * Пакет публичного ключа
 */
typedef struct {
    uint32_t magic;              // 0x4D455350 "MESP"
    uint32_t version;
    uint32_t timestamp;
    char user_id[64];
    unsigned char public_key[32];
    uint16_t pq_public_key_len;
    uint8_t pq_public_key[1184];
    uint16_t signature_len;
    uint8_t signature[3309];
} mesh_public_key_packet_t;

/**
 * Запрос публичного ключа
 */
typedef struct {
    uint32_t magic;              // 0x4D455352 "MESR"
    uint32_t version;
    uint32_t timestamp;
    char user_id[64];
    char requester_id[64];
    unsigned char nonce[32];
    uint16_t signature_len;
    uint8_t signature[3309];
} mesh_public_key_request_t;

/**
 * Ответ с публичным ключом
 */
typedef struct {
    uint32_t magic;              // 0x4D455341 "MESA"
    uint32_t version;
    uint32_t timestamp;
    char user_id[64];
    unsigned char public_key[32];
    uint16_t pq_public_key_len;
    uint8_t pq_public_key[1184];
    unsigned char request_nonce[32];
    uint16_t signature_len;
    uint8_t signature[3309];
} mesh_public_key_response_t;

// ============================================================================
// Структуры данных
// ============================================================================

/**
 * Настройки MQTT подключения
 * Полностью соответствует настройкам MQTT Explorer для OneMesh
 */
typedef struct {
    char broker[256];            /**< Полный адрес брокера (mqtt://host:port) */
    char host[128];              /**< Хост брокера (mqtt.onemesh.ru) */
    int port;                    /**< Порт брокера (1883 или 8883) */
    char username[64];           /**< Имя пользователя (onemeshd) */
    char password[64];           /**< Пароль (onecat) */
    char topic_root[128];        /**< Корневой топик (msh/RU/SPB) */
    char city_code[16];          /**< Код города (SPB, MOS, KRD) */
    char client_id[64];          /**< Уникальный ID клиента */

    int use_tls;                 /**< Использовать TLS/SSL (8883) */
    int keepalive;               /**< Keep-alive интервал (сек) */
    int qos;                     /**< QoS для публикаций (0, 1, 2) */
    int retain;                  /**< Retain флаг для публикаций */
    int clean_session;           /**< Clean session флаг */
    int connect_timeout;         /**< Таймаут подключения (сек) */

    int max_reconnect;           /**< Максимум попыток переподключения */
    int reconnect_delay;         /**< Задержка между попытками (сек) */

    bool verbose;                /**< Подробный вывод */
    bool log_messages;           /**< Логировать сообщения */
    bool log_packets;            /**< Логировать пакеты */
    bool parse_protobuf;         /**< Парсить Protobuf сообщения Meshtastic */
    bool parse_json;             /**< Парсить JSON сообщения */
} mesh_mqtt_config_t;

/**
 * Статистика MQTT модуля
 */
typedef struct {
    uint64_t packets_sent;       /**< Отправлено пакетов */
    uint64_t packets_received;   /**< Получено пакетов */
    uint64_t packets_dropped;    /**< Потеряно пакетов */
    uint64_t bytes_sent;         /**< Отправлено байт */
    uint64_t bytes_received;     /**< Получено байт */
    uint64_t errors;             /**< Ошибок */
    uint64_t reconnects;         /**< Переподключений */

    uint64_t mesh_packets;       /**< Mesh-пакетов получено */
    uint64_t protobuf_packets;   /**< Protobuf пакетов получено */
    uint64_t json_packets;       /**< JSON пакетов получено */
    uint64_t unknown_packets;    /**< Неизвестных пакетов */

    time_t connected_at;         /**< Время подключения */
    time_t last_activity;        /**< Время последней активности */
    time_t last_error;           /**< Время последней ошибки */
    time_t start_time;           /**< Время запуска */

    int is_connected;            /**< Флаг подключения */
    int reconnect_count;         /**< Текущее количество переподключений */
    int last_error_code;         /**< Код последней ошибки */
    char last_error_msg[256];    /**< Сообщение последней ошибки */

    char broker[256];            /**< Текущий адрес брокера */
    char client_id[64];          /**< ID клиента */
    mesh_connection_status_t status; /**< Текущий статус */
} mesh_mqtt_stats_t;

/**
 * Структура для колбэков событий
 */
typedef struct {
    /**
     * Вызывается при получении сообщения в Mesh-формате
     * @param packet Указатель на полученный пакет
     */
    void (*on_message)(const mesh_packet_t *packet);

    /**
     * Вызывается при получении Protobuf сообщения (Meshtastic)
     * @param topic Топик сообщения
     * @param data Указатель на данные
     * @param len Длина данных
     * @param is_compressed 1 если данные сжаты, 0 если нет
     */
    void (*on_protobuf_message)(const char *topic, const void *data,
                                int len, int is_compressed);

    /**
     * Вызывается при получении JSON сообщения
     * @param topic Топик сообщения
     * @param json Строка JSON
     */
    void (*on_json_message)(const char *topic, const char *json);

    /**
     * Вызывается при успешном подключении
     * @param success 1 если успешно, 0 если ошибка
     * @param message Текст сообщения
     */
    void (*on_connect)(int success, const char *message);

    /**
     * Вызывается при отключении
     * @param reason Код причины
     * @param message Текст сообщения
     */
    void (*on_disconnect)(int reason, const char *message);

    /**
     * Вызывается при ошибке
     * @param error_code Код ошибки
     * @param message Текст сообщения
     */
    void (*on_error)(int error_code, const char *message);

    /**
     * Вызывается после отправки пакета
     * @param packet Отправленный пакет
     */
    void (*on_packet_sent)(const mesh_packet_t *packet);

    /**
     * Вызывается после получения пакета
     * @param packet Полученный пакет
     */
    void (*on_packet_received)(const mesh_packet_t *packet);

    /**
     * Вызывается при переподключении
     * @param attempt Номер попытки
     * @param message Текст сообщения
     */
    void (*on_reconnect)(int attempt, const char *message);

    /**
     * Вызывается при изменении статуса подключения
     * @param connected 1 если подключен, 0 если нет
     */
    void (*on_status_change)(int connected);
} mesh_mqtt_callbacks_t;

// ============================================================================
// Основные функции
// ============================================================================

/**
 * Инициализировать MQTT модуль с настройками
 * @param config Указатель на конфигурацию
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_init(const mesh_mqtt_config_t *config);

/**
 * Инициализировать с настройками по умолчанию (OneMesh)
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_init_default(void);

/**
 * Подключиться к MQTT брокеру
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_connect(void);

/**
 * Отключиться от MQTT брокера
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_disconnect(void);

/**
 * Проверить состояние подключения
 * @return 1 если подключен, 0 если нет
 */
int mesh_mqtt_is_connected(void);

/**
 * Получить текущий статус подключения
 * @return Статус подключения
 */
mesh_connection_status_t mesh_mqtt_get_status(void);

// ============================================================================
// Отправка и получение
// ============================================================================

/**
 * Отправить пакет в MQTT
 * @param packet Указатель на пакет
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_send(const mesh_packet_t *packet);

/**
 * Отправить данные конкретному получателю
 * @param receiver_id ID получателя
 * @param type Тип сообщения
 * @param data Указатель на данные
 * @param data_len Длина данных
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_send_to(const char *receiver_id, uint32_t type,
                      const void *data, uint32_t data_len);

/**
 * Отправить широковещательное сообщение
 * @param type Тип сообщения
 * @param data Указатель на данные
 * @param data_len Длина данных
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_broadcast(uint32_t type, const void *data, uint32_t data_len);

/**
 * Получить пакет из очереди (блокирующий)
 * @param packet Указатель на указатель пакета (будет выделен)
 * @param timeout_ms Таймаут в миллисекундах (-1 для бесконечного ожидания)
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_receive(mesh_packet_t **packet, int timeout_ms);

/**
 * Отправить сырые данные в топик
 * @param topic Топик для отправки
 * @param data Указатель на данные
 * @param len Длина данных
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_send_data(const char *topic, const void *data, size_t len);

// ============================================================================
// Публикация и запрос ключей
// ============================================================================

/**
 * Опубликовать публичный ключ пользователя
 * @param user_id ID пользователя
 * @param public_key Классический публичный ключ (32 байта)
 * @param pq_public_key PQ публичный ключ
 * @param pq_len Длина PQ публичного ключа
 * @param signature Подпись пакета
 * @param sig_len Длина подписи
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_mqtt_publish_public_key(const char *user_id,
                                 const unsigned char *public_key,
                                 const uint8_t *pq_public_key,
                                 uint16_t pq_len,
                                 const unsigned char *signature,
                                 size_t sig_len);

/**
 * Запросить публичный ключ пользователя
 * @param user_id ID запрашиваемого пользователя
 * @param requester_id ID запрашивающего
 * @param nonce Nonce для верификации
 * @param signature Подпись запроса
 * @param sig_len Длина подписи
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_mqtt_request_public_key(const char *user_id,
                                 const char *requester_id,
                                 const unsigned char *nonce,
                                 const unsigned char *signature,
                                 size_t sig_len);

// ============================================================================
// Подписка на топики
// ============================================================================

/**
 * Подписаться на топик
 * @param topic Топик для подписки (относительный или полный)
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_subscribe(const char *topic);

/**
 * Подписаться на все системные топики OneMesh
 * @return Количество успешных подписок
 */
int mesh_mqtt_subscribe_all(void);

/**
 * Подписаться на топик города
 * @param city_code Код города (SPB, MOS, KRD)
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_subscribe_city(const char *city_code);

/**
 * Отписаться от топика
 * @param topic Топик для отписки
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_unsubscribe(const char *topic);

// ============================================================================
// Управление модулем
// ============================================================================

/**
 * Установить колбэки
 * @param callbacks Указатель на структуру с колбэками
 */
void mesh_mqtt_set_callbacks(const mesh_mqtt_callbacks_t *callbacks);

/**
 * Установить код города
 * @param city_code Код города (e.g., SPB, MOS)
 */
void mesh_mqtt_set_city_code(const char *city_code);

/**
 * Получить статистику
 * @return Указатель на структуру статистики
 */
const mesh_mqtt_stats_t* mesh_mqtt_get_stats(void);

/**
 * Сбросить статистику
 */
void mesh_mqtt_reset_stats(void);

/**
 * Переподключиться к брокеру
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_reconnect(void);

/**
 * Отправить Ping
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_ping(void);

// ============================================================================
// Отладка и диагностика
// ============================================================================

/**
 * Вывести статистику в консоль
 */
void mesh_mqtt_print_stats(void);

/**
 * Вывести конфигурацию в консоль
 */
void mesh_mqtt_print_config(void);

/**
 * Вывести информацию о соединении
 */
void mesh_mqtt_print_connection_info(void);

/**
 * Включить/отключить подробный вывод
 * @param enable 1 для включения, 0 для отключения
 */
void mesh_mqtt_set_verbose(int enable);

/**
 * Включить/отключить логирование пакетов
 * @param enable 1 для включения, 0 для отключения
 */
void mesh_mqtt_set_log_packets(int enable);

/**
 * Определить формат сообщения по данным
 * @param data Указатель на данные
 * @param len Длина данных
 * @return Тип формата сообщения
 */
mesh_message_format_t mesh_mqtt_detect_format(const void *data, int len);

// ============================================================================
// Освобождение ресурсов
// ============================================================================

/**
 * Освободить все ресурсы и очистить модуль
 */
void mesh_mqtt_cleanup(void);

// ============================================================================
// Обработка сигналов
// ============================================================================

/**
 * Обработчик сигналов для graceful shutdown
 * @param sig Номер сигнала
 */
void mesh_mqtt_handle_signal(int sig);

// ============================================================================
// Утилиты
// ============================================================================

/**
 * Проверить валидность конфигурации
 * @param config Указатель на конфигурацию
 * @return 1 если валидна, 0 если нет
 */
int mesh_mqtt_config_valid(const mesh_mqtt_config_t *config);

/**
 * Получить строковое представление статуса
 * @return Строка со статусом
 */
const char* mesh_mqtt_get_status_string(void);

/**
 * Получить версию модуля
 * @return Строка с версией
 */
const char* mesh_mqtt_get_version(void);

/**
 * Создать полный топик из корневого и подтопика
 * @param root Корневой топик
 * @param subtopic Подтопик
 * @param buffer Буфер для результата
 * @param buffer_size Размер буфера
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_build_topic(const char *root, const char *subtopic,
                          char *buffer, size_t buffer_size);

/**
 * Разобрать топик на составляющие
 * @param topic Полный топик
 * @param root Буфер для корневого топика
 * @param subtopic Буфер для подтопика
 * @param buffer_size Размер буфера
 * @return 0 при успехе, отрицательное значение при ошибке
 */
int mesh_mqtt_parse_topic(const char *topic, char *root,
                          char *subtopic, size_t buffer_size);