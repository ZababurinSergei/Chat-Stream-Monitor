/*
    Mesh MQTT Module - Заголовочный файл
    Шлюз для передачи MTProto-трафика через MQTT/Mesh-сети
    Интеграция с MTProto Proxy в качестве бэкенда
    Поддерживает Paho MQTT Client
    Настройки для OneMesh (mqtt.onemesh.ru:1883)
    С поддержкой Meshtastic Protobuf сообщений
    Полная иерархия топиков msh/RU/
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

/** Хост MQTT брокера OneMesh */
#define ONEMESH_HOST_DEFAULT       "mqtt.onemesh.ru"

/** Порт MQTT брокера OneMesh (1883 - без TLS, 8883 - с TLS) */
#define ONEMESH_PORT_DEFAULT       1883

/** Имя пользователя для подключения к OneMesh */
#define ONEMESH_USERNAME_DEFAULT   "onemeshd"

/** Пароль для подключения к OneMesh */
#define ONEMESH_PASSWORD_DEFAULT   "onecat"

/** Корневой топик для OneMesh */
#define ONEMESH_TOPIC_ROOT         "msh"

/** Регион (Россия) */
#define ONEMESH_REGION             "RU"

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
// Иерархия топиков msh/RU/
// ============================================================================

/*
 * Структура топиков:
 * msh/RU/
 *   ├── <CITY>/                    # Город (SPB, MOS, KRD, ...)
 *   │   ├── device/                # Устройства
 *   │   │   ├── <DEVICE_ID>/       # Конкретное устройство
 *   │   │   │   ├── inbox          # Входящие сообщения
 *   │   │   │   ├── outbox         # Исходящие сообщения
 *   │   │   │   ├── status         # Статус устройства
 *   │   │   │   ├── config         # Конфигурация
 *   │   │   │   └── telemetry      # Телеметрия устройства
 *   │   ├── group/                 # Группы
 *   │   │   ├── <GROUP_ID>/        # Конкретная группа
 *   │   │   │   ├── chat           # Чат группы
 *   │   │   │   ├── members        # Участники группы
 *   │   │   │   ├── admin          # Администрирование
 *   │   │   │   └── invites        # Приглашения
 *   │   ├── subgroup/              # Подгруппы (вложенные группы)
 *   │   │   ├── <GROUP_ID>/        # Группа
 *   │   │   │   └── <SUBGROUP_ID>/ # Подгруппа
 *   │   │   │       ├── chat       # Чат подгруппы
 *   │   │   │       ├── members    # Участники подгруппы
 *   │   │   │       └── admin      # Администрирование подгруппы
 *   │   ├── user/                  # Пользователи
 *   │   │   ├── <USER_ID>/         # Конкретный пользователь
 *   │   │   │   ├── inbox          # Входящие сообщения
 *   │   │   │   ├── outbox         # Исходящие сообщения
 *   │   │   │   ├── status         # Статус пользователя
 *   │   │   │   ├── profile        # Профиль пользователя
 *   │   │   │   └── keys           # Ключи пользователя
 *   │   ├── broadcast/             # Широковещательные сообщения
 *   │   │   ├── public             # Публичные сообщения
 *   │   │   ├── emergency          # Экстренные сообщения
 *   │   │   └── system             # Системные сообщения
 *   │   ├── telemetry/             # Телеметрия
 *   │   │   ├── <DEVICE_ID>/       # Телеметрия устройства
 *   │   │   ├── group/<GROUP_ID>/  # Телеметрия группы
 *   │   │   └── city               # Телеметрия города
 *   │   ├── position/              # Позиция (GPS)
 *   │   │   ├── <DEVICE_ID>/       # Позиция устройства
 *   │   │   ├── group/<GROUP_ID>/  # Позиция группы
 *   │   │   └── city               # Позиция города
 *   │   ├── stat/                  # Статистика
 *   │   │   ├── <DEVICE_ID>/       # Статистика устройства
 *   │   │   ├── group/<GROUP_ID>/  # Статистика группы
 *   │   │   └── city               # Статистика города
 *   │   ├── alert/                 # Оповещения
 *   │   │   ├── <DEVICE_ID>/       # Оповещения устройства
 *   │   │   ├── group/<GROUP_ID>/  # Оповещения группы
 *   │   │   └── city               # Оповещения города
 *   │   ├── log/                   # Логи
 *   │   │   ├── <DEVICE_ID>/       # Логи устройства
 *   │   │   ├── group/<GROUP_ID>/  # Логи группы
 *   │   │   └── city               # Логи города
 *   │   ├── config/                # Конфигурация
 *   │   │   ├── <DEVICE_ID>/       # Конфигурация устройства
 *   │   │   ├── group/<GROUP_ID>/  # Конфигурация группы
 *   │   │   └── city               # Конфигурация города
 *   │   └── +/                     # Wildcard для всех
 *   └── +/                         # Wildcard для всех городов
 */

// ============================================================================
// Базовые макросы для построения топиков
// ============================================================================

/** Базовый путь: msh/RU */
#define ONEMESH_BASE_PATH           "msh/RU"

/** Путь для города: msh/RU/%s */
#define ONEMESH_CITY_PATH           "msh/RU/%s"

/** Путь для всех городов: msh/RU/+ */
#define ONEMESH_ALL_CITIES          "msh/RU/+"

/** Путь для всех топиков: msh/RU/# */
#define ONEMESH_ALL_TOPICS          "msh/RU/#"

// ============================================================================
// Макросы для топиков устройств (Device)
// ============================================================================

/** Топик устройства: msh/RU/%s/device/%s */
#define ONEMESH_TOPIC_DEVICE(city, device_id) \
    "msh/RU/" city "/device/" device_id

/** Входящие сообщения устройства: msh/RU/%s/device/%s/inbox */
#define ONEMESH_TOPIC_DEVICE_INBOX(city, device_id) \
    "msh/RU/" city "/device/" device_id "/inbox"

/** Исходящие сообщения устройства: msh/RU/%s/device/%s/outbox */
#define ONEMESH_TOPIC_DEVICE_OUTBOX(city, device_id) \
    "msh/RU/" city "/device/" device_id "/outbox"

/** Статус устройства: msh/RU/%s/device/%s/status */
#define ONEMESH_TOPIC_DEVICE_STATUS(city, device_id) \
    "msh/RU/" city "/device/" device_id "/status"

/** Конфигурация устройства: msh/RU/%s/device/%s/config */
#define ONEMESH_TOPIC_DEVICE_CONFIG(city, device_id) \
    "msh/RU/" city "/device/" device_id "/config"

/** Телеметрия устройства: msh/RU/%s/device/%s/telemetry */
#define ONEMESH_TOPIC_DEVICE_TELEMETRY(city, device_id) \
    "msh/RU/" city "/device/" device_id "/telemetry"

/** Все топики устройства: msh/RU/%s/device/%s/# */
#define ONEMESH_TOPIC_DEVICE_ALL(city, device_id) \
    "msh/RU/" city "/device/" device_id "/#"

/** Все устройства города: msh/RU/%s/device/# */
#define ONEMESH_TOPIC_DEVICES_ALL(city) \
    "msh/RU/" city "/device/#"

// ============================================================================
// Макросы для топиков групп (Group)
// ============================================================================

/** Топик группы: msh/RU/%s/group/%s */
#define ONEMESH_TOPIC_GROUP(city, group_id) \
    "msh/RU/" city "/group/" group_id

/** Чат группы: msh/RU/%s/group/%s/chat */
#define ONEMESH_TOPIC_GROUP_CHAT(city, group_id) \
    "msh/RU/" city "/group/" group_id "/chat"

/** Участники группы: msh/RU/%s/group/%s/members */
#define ONEMESH_TOPIC_GROUP_MEMBERS(city, group_id) \
    "msh/RU/" city "/group/" group_id "/members"

/** Администрирование группы: msh/RU/%s/group/%s/admin */
#define ONEMESH_TOPIC_GROUP_ADMIN(city, group_id) \
    "msh/RU/" city "/group/" group_id "/admin"

/** Приглашения в группу: msh/RU/%s/group/%s/invites */
#define ONEMESH_TOPIC_GROUP_INVITES(city, group_id) \
    "msh/RU/" city "/group/" group_id "/invites"

/** Статус группы: msh/RU/%s/group/%s/status */
#define ONEMESH_TOPIC_GROUP_STATUS(city, group_id) \
    "msh/RU/" city "/group/" group_id "/status"

/** Конфигурация группы: msh/RU/%s/group/%s/config */
#define ONEMESH_TOPIC_GROUP_CONFIG(city, group_id) \
    "msh/RU/" city "/group/" group_id "/config"

/** Все топики группы: msh/RU/%s/group/%s/# */
#define ONEMESH_TOPIC_GROUP_ALL(city, group_id) \
    "msh/RU/" city "/group/" group_id "/#"

/** Все группы города: msh/RU/%s/group/# */
#define ONEMESH_TOPIC_GROUPS_ALL(city) \
    "msh/RU/" city "/group/#"

// ============================================================================
// Макросы для топиков подгрупп (Subgroup - вложенные группы)
// ============================================================================

/** Топик подгруппы: msh/RU/%s/subgroup/%s/%s */
#define ONEMESH_TOPIC_SUBGROUP(city, group_id, subgroup_id) \
    "msh/RU/" city "/subgroup/" group_id "/" subgroup_id

/** Чат подгруппы: msh/RU/%s/subgroup/%s/%s/chat */
#define ONEMESH_TOPIC_SUBGROUP_CHAT(city, group_id, subgroup_id) \
    "msh/RU/" city "/subgroup/" group_id "/" subgroup_id "/chat"

/** Участники подгруппы: msh/RU/%s/subgroup/%s/%s/members */
#define ONEMESH_TOPIC_SUBGROUP_MEMBERS(city, group_id, subgroup_id) \
    "msh/RU/" city "/subgroup/" group_id "/" subgroup_id "/members"

/** Администрирование подгруппы: msh/RU/%s/subgroup/%s/%s/admin */
#define ONEMESH_TOPIC_SUBGROUP_ADMIN(city, group_id, subgroup_id) \
    "msh/RU/" city "/subgroup/" group_id "/" subgroup_id "/admin"

/** Все топики подгруппы: msh/RU/%s/subgroup/%s/%s/# */
#define ONEMESH_TOPIC_SUBGROUP_ALL(city, group_id, subgroup_id) \
    "msh/RU/" city "/subgroup/" group_id "/" subgroup_id "/#"

/** Все подгруппы группы: msh/RU/%s/subgroup/%s/# */
#define ONEMESH_TOPIC_SUBGROUPS_ALL(city, group_id) \
    "msh/RU/" city "/subgroup/" group_id "/#"

/** Все подгруппы города: msh/RU/%s/subgroup/# */
#define ONEMESH_TOPIC_SUBGROUPS_CITY(city) \
    "msh/RU/" city "/subgroup/#"

// ============================================================================
// Макросы для топиков пользователей (User)
// ============================================================================

/** Топик пользователя: msh/RU/%s/user/%s */
#define ONEMESH_TOPIC_USER(city, user_id) \
    "msh/RU/" city "/user/" user_id

/** Входящие сообщения пользователя: msh/RU/%s/user/%s/inbox */
#define ONEMESH_TOPIC_USER_INBOX(city, user_id) \
    "msh/RU/" city "/user/" user_id "/inbox"

/** Исходящие сообщения пользователя: msh/RU/%s/user/%s/outbox */
#define ONEMESH_TOPIC_USER_OUTBOX(city, user_id) \
    "msh/RU/" city "/user/" user_id "/outbox"

/** Статус пользователя: msh/RU/%s/user/%s/status */
#define ONEMESH_TOPIC_USER_STATUS(city, user_id) \
    "msh/RU/" city "/user/" user_id "/status"

/** Профиль пользователя: msh/RU/%s/user/%s/profile */
#define ONEMESH_TOPIC_USER_PROFILE(city, user_id) \
    "msh/RU/" city "/user/" user_id "/profile"

/** Ключи пользователя: msh/RU/%s/user/%s/keys */
#define ONEMESH_TOPIC_USER_KEYS(city, user_id) \
    "msh/RU/" city "/user/" user_id "/keys"

/** Все топики пользователя: msh/RU/%s/user/%s/# */
#define ONEMESH_TOPIC_USER_ALL(city, user_id) \
    "msh/RU/" city "/user/" user_id "/#"

/** Все пользователи города: msh/RU/%s/user/# */
#define ONEMESH_TOPIC_USERS_ALL(city) \
    "msh/RU/" city "/user/#"

// ============================================================================
// Макросы для топиков широковещательных сообщений (Broadcast)
// ============================================================================

/** Публичные сообщения: msh/RU/%s/broadcast/public */
#define ONEMESH_TOPIC_BROADCAST_PUBLIC(city) \
    "msh/RU/" city "/broadcast/public"

/** Экстренные сообщения: msh/RU/%s/broadcast/emergency */
#define ONEMESH_TOPIC_BROADCAST_EMERGENCY(city) \
    "msh/RU/" city "/broadcast/emergency"

/** Системные сообщения: msh/RU/%s/broadcast/system */
#define ONEMESH_TOPIC_BROADCAST_SYSTEM(city) \
    "msh/RU/" city "/broadcast/system"

/** Все широковещательные: msh/RU/%s/broadcast/# */
#define ONEMESH_TOPIC_BROADCAST_ALL(city) \
    "msh/RU/" city "/broadcast/#"

// ============================================================================
// Макросы для топиков телеметрии (Telemetry)
// ============================================================================

/** Телеметрия устройства: msh/RU/%s/telemetry/device/%s */
#define ONEMESH_TOPIC_TELEMETRY_DEVICE(city, device_id) \
    "msh/RU/" city "/telemetry/device/" device_id

/** Телеметрия группы: msh/RU/%s/telemetry/group/%s */
#define ONEMESH_TOPIC_TELEMETRY_GROUP(city, group_id) \
    "msh/RU/" city "/telemetry/group/" group_id

/** Телеметрия города: msh/RU/%s/telemetry/city */
#define ONEMESH_TOPIC_TELEMETRY_CITY(city) \
    "msh/RU/" city "/telemetry/city"

/** Все телеметрии: msh/RU/%s/telemetry/# */
#define ONEMESH_TOPIC_TELEMETRY_ALL(city) \
    "msh/RU/" city "/telemetry/#"

// ============================================================================
// Макросы для топиков позиции (Position/GPS)
// ============================================================================

/** Позиция устройства: msh/RU/%s/position/device/%s */
#define ONEMESH_TOPIC_POSITION_DEVICE(city, device_id) \
    "msh/RU/" city "/position/device/" device_id

/** Позиция группы: msh/RU/%s/position/group/%s */
#define ONEMESH_TOPIC_POSITION_GROUP(city, group_id) \
    "msh/RU/" city "/position/group/" group_id

/** Позиция города: msh/RU/%s/position/city */
#define ONEMESH_TOPIC_POSITION_CITY(city) \
    "msh/RU/" city "/position/city"

/** Все позиции: msh/RU/%s/position/# */
#define ONEMESH_TOPIC_POSITION_ALL(city) \
    "msh/RU/" city "/position/#"

// ============================================================================
// Макросы для топиков статистики (Statistics)
// ============================================================================

/** Статистика устройства: msh/RU/%s/stat/device/%s */
#define ONEMESH_TOPIC_STAT_DEVICE(city, device_id) \
    "msh/RU/" city "/stat/device/" device_id

/** Статистика группы: msh/RU/%s/stat/group/%s */
#define ONEMESH_TOPIC_STAT_GROUP(city, group_id) \
    "msh/RU/" city "/stat/group/" group_id

/** Статистика города: msh/RU/%s/stat/city */
#define ONEMESH_TOPIC_STAT_CITY(city) \
    "msh/RU/" city "/stat/city"

/** Вся статистика: msh/RU/%s/stat/# */
#define ONEMESH_TOPIC_STAT_ALL(city) \
    "msh/RU/" city "/stat/#"

// ============================================================================
// Макросы для топиков оповещений (Alerts)
// ============================================================================

/** Оповещения устройства: msh/RU/%s/alert/device/%s */
#define ONEMESH_TOPIC_ALERT_DEVICE(city, device_id) \
    "msh/RU/" city "/alert/device/" device_id

/** Оповещения группы: msh/RU/%s/alert/group/%s */
#define ONEMESH_TOPIC_ALERT_GROUP(city, group_id) \
    "msh/RU/" city "/alert/group/" group_id

/** Оповещения города: msh/RU/%s/alert/city */
#define ONEMESH_TOPIC_ALERT_CITY(city) \
    "msh/RU/" city "/alert/city"

/** Все оповещения: msh/RU/%s/alert/# */
#define ONEMESH_TOPIC_ALERT_ALL(city) \
    "msh/RU/" city "/alert/#"

// ============================================================================
// Макросы для топиков логов (Logs)
// ============================================================================

/** Логи устройства: msh/RU/%s/log/device/%s */
#define ONEMESH_TOPIC_LOG_DEVICE(city, device_id) \
    "msh/RU/" city "/log/device/" device_id

/** Логи группы: msh/RU/%s/log/group/%s */
#define ONEMESH_TOPIC_LOG_GROUP(city, group_id) \
    "msh/RU/" city "/log/group/" group_id

/** Логи города: msh/RU/%s/log/city */
#define ONEMESH_TOPIC_LOG_CITY(city) \
    "msh/RU/" city "/log/city"

/** Все логи: msh/RU/%s/log/# */
#define ONEMESH_TOPIC_LOG_ALL(city) \
    "msh/RU/" city "/log/#"

// ============================================================================
// Макросы для топиков конфигурации (Config)
// ============================================================================

/** Конфигурация устройства: msh/RU/%s/config/device/%s */
#define ONEMESH_TOPIC_CONFIG_DEVICE(city, device_id) \
    "msh/RU/" city "/config/device/" device_id

/** Конфигурация группы: msh/RU/%s/config/group/%s */
#define ONEMESH_TOPIC_CONFIG_GROUP(city, group_id) \
    "msh/RU/" city "/config/group/" group_id

/** Конфигурация города: msh/RU/%s/config/city */
#define ONEMESH_TOPIC_CONFIG_CITY(city) \
    "msh/RU/" city "/config/city"

/** Вся конфигурация: msh/RU/%s/config/# */
#define ONEMESH_TOPIC_CONFIG_ALL(city) \
    "msh/RU/" city "/config/#"

// ============================================================================
// Wildcard топики для массовой подписки
// ============================================================================

/** Все топики города: msh/RU/%s/# */
#define ONEMESH_TOPIC_CITY_ALL(city) \
    "msh/RU/" city "/#"

/** Все топики всех городов: msh/RU/# */
#define ONEMESH_TOPIC_ALL          "msh/RU/#"

/** Все топики устройств всех городов: msh/RU/+/device/# */
#define ONEMESH_TOPIC_ALL_DEVICES  "msh/RU/+/device/#"

/** Все топики групп всех городов: msh/RU/+/group/# */
#define ONEMESH_TOPIC_ALL_GROUPS   "msh/RU/+/group/#"

/** Все топики подгрупп всех городов: msh/RU/+/subgroup/# */
#define ONEMESH_TOPIC_ALL_SUBGROUPS "msh/RU/+/subgroup/#"

/** Все топики пользователей всех городов: msh/RU/+/user/# */
#define ONEMESH_TOPIC_ALL_USERS    "msh/RU/+/user/#"

// ============================================================================
// Топики MQTT для ключей
// ============================================================================

#define MESH_TOPIC_PUBLIC_KEY      "mesh/users/%s/public"
#define MESH_TOPIC_PQ_PUBLIC_KEY   "mesh/users/%s/pq-public"
#define MESH_TOPIC_INBOX           "mesh/users/%s/inbox"
#define MESH_TOPIC_KEY_REQUEST     "mesh/users/%s/request-key"
#define MESH_TOPIC_KEY_RESPONSE    "mesh/users/%s/public-response"
#define MESH_TOPIC_BROADCAST       "mesh/broadcast"
#define MESH_TOPIC_SYSTEM          "mesh/system"
#define MESH_TOPIC_STATS           "mesh/stats"

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
 * Типы групп
 */
typedef enum {
    ONEMESH_GROUP_TYPE_SYSTEM = 0,    /**< Системная группа */
    ONEMESH_GROUP_TYPE_CITY = 1,      /**< Городская группа */
    ONEMESH_GROUP_TYPE_DISTRICT = 2,  /**< Районная группа */
    ONEMESH_GROUP_TYPE_PRIVATE = 3,   /**< Приватная группа */
    ONEMESH_GROUP_TYPE_TEMPORARY = 4, /**< Временная группа */
    ONEMESH_GROUP_TYPE_BROADCAST = 5  /**< Широковещательная группа */
} onemesh_group_type_t;

/**
 * Уровни групп (для иерархии)
 */
typedef enum {
    ONEMESH_LEVEL_CITY = 0,      /**< Уровень города */
    ONEMESH_LEVEL_DISTRICT = 1,  /**< Уровень района */
    ONEMESH_LEVEL_GROUP = 2,     /**< Уровень группы */
    ONEMESH_LEVEL_SUBGROUP = 3,  /**< Уровень подгруппы */
    ONEMESH_LEVEL_DEVICE = 4,    /**< Уровень устройства */
    ONEMESH_LEVEL_USER = 5       /**< Уровень пользователя */
} onemesh_level_t;

// ============================================================================
// Статусы подключения
// ============================================================================

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
 * Структура для хранения иерархии топика
 */
typedef struct {
    char network[16];            /**< msh */
    char region[8];              /**< RU */
    char city[16];               /**< SPB, MOS, KRD, ... */
    char type[32];               /**< device, group, subgroup, user, ... */
    char group_id[64];           /**< ID группы (если есть) */
    char subgroup_id[64];        /**< ID подгруппы (если есть) */
    char device_id[64];          /**< ID устройства (если есть) */
    char user_id[64];            /**< ID пользователя (если есть) */
    char action[32];             /**< inbox, outbox, status, chat, ... */
    char full_topic[512];        /**< Полный топик */
    onemesh_level_t level;       /**< Уровень в иерархии */
} onemesh_topic_info_t;

/**
 * Настройки MQTT подключения
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
} mesh_mqtt_callbacks_t;

// ============================================================================
// Функции MQTT
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

// ----------------------------------------------------------------------------
// Инициализация и управление
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Отправка и получение
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Публикация и запрос ключей
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Подписка на топики
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Колбэки
// ----------------------------------------------------------------------------

/**
 * Установить колбэки
 * @param callbacks Указатель на структуру с колбэками
 */
void mesh_mqtt_set_callbacks(const mesh_mqtt_callbacks_t *callbacks);

// ----------------------------------------------------------------------------
// Управление
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Отладка и диагностика
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Освобождение ресурсов
// ----------------------------------------------------------------------------

/**
 * Освободить все ресурсы и очистить модуль
 */
void mesh_mqtt_cleanup(void);

// ----------------------------------------------------------------------------
// Утилиты
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Функции для работы с топиками OneMesh
// ----------------------------------------------------------------------------

/**
 * Разобрать топик на составляющие
 * @param topic Полный топик
 * @param info Выходная структура с информацией
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_parse_topic(const char *topic, onemesh_topic_info_t *info);

/**
 * Построить топик для устройства
 * @param city Код города
 * @param device_id ID устройства
 * @param action Действие (inbox, outbox, status, ...)
 * @param buffer Выходной буфер
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_build_device_topic(const char *city, const char *device_id,
                               const char *action, char *buffer, size_t buffer_size);

/**
 * Построить топик для группы
 * @param city Код города
 * @param group_id ID группы
 * @param action Действие (chat, members, admin, ...)
 * @param buffer Выходной буфер
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_build_group_topic(const char *city, const char *group_id,
                              const char *action, char *buffer, size_t buffer_size);

/**
 * Построить топик для подгруппы
 * @param city Код города
 * @param group_id ID родительской группы
 * @param subgroup_id ID подгруппы
 * @param action Действие (chat, members, admin, ...)
 * @param buffer Выходной буфер
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_build_subgroup_topic(const char *city, const char *group_id,
                                 const char *subgroup_id, const char *action,
                                 char *buffer, size_t buffer_size);

/**
 * Построить топик для пользователя
 * @param city Код города
 * @param user_id ID пользователя
 * @param action Действие (inbox, outbox, status, ...)
 * @param buffer Выходной буфер
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_build_user_topic(const char *city, const char *user_id,
                             const char *action, char *buffer, size_t buffer_size);

/**
 * Получить уровень топика в иерархии
 * @param topic Полный топик
 * @return Уровень (ONEMESH_LEVEL_*)
 */
onemesh_level_t onemesh_get_topic_level(const char *topic);

/**
 * Проверить, является ли топик топиком группы
 * @param topic Полный топик
 * @return 1 если да, 0 если нет
 */
int onemesh_is_group_topic(const char *topic);

/**
 * Проверить, является ли топик топиком подгруппы
 * @param topic Полный топик
 * @return 1 если да, 0 если нет
 */
int onemesh_is_subgroup_topic(const char *topic);

/**
 * Получить родительский топик для подгруппы
 * @param topic Топик подгруппы
 * @param buffer Выходной буфер для родительского топика
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int onemesh_get_parent_topic(const char *topic, char *buffer, size_t buffer_size);

// ----------------------------------------------------------------------------
// Обработка сигналов
// ----------------------------------------------------------------------------

/**
 * Обработчик сигналов для graceful shutdown
 * @param sig Номер сигнала
 */
void mesh_mqtt_handle_signal(int sig);

#ifdef __cplusplus
}
#endif
