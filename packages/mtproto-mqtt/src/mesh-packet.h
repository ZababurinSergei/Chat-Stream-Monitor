/*
    Mesh Packet - Заголовочный файл
    Поддержка классических и гибридных пакетов (ECDH + ML-KEM)
*/

#pragma once

#include <stdint.h>
#include <stddef.h>
#include <time.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

// ============================================================================
// Константы протокола
// ============================================================================

#define MESH_MAGIC              0x4D455348  // "MESH"
#define MESH_PACKET_VERSION     1
#define MESH_HYBRID_VERSION     2
#define MESH_DEFAULT_MAX_HOPS   5
#define MESH_PAYLOAD_MAX        65536

// ============================================================================
// Константы для гибридной криптографии
// ============================================================================

#ifndef OQS_KEM_ml_kem_768_length_public_key
#define MESH_PQ_PUBLIC_KEY_LEN      1184   // ML-KEM-768
#define MESH_PQ_CIPHERTEXT_LEN      1088   // ML-KEM-768
#define MESH_PQ_SHARED_SECRET_LEN   32
#else
#define MESH_PQ_PUBLIC_KEY_LEN      OQS_KEM_ml_kem_768_length_public_key
#define MESH_PQ_CIPHERTEXT_LEN      OQS_KEM_ml_kem_768_length_ciphertext
#define MESH_PQ_SHARED_SECRET_LEN   OQS_KEM_ml_kem_768_length_shared_secret
#endif

#ifndef OQS_SIG_ml_dsa_65_length_public_key
#define MESH_SIG_PUBLIC_KEY_LEN     1952   // ML-DSA-65
#define MESH_SIG_SIGNATURE_LEN      3309   // ML-DSA-65
#else
#define MESH_SIG_PUBLIC_KEY_LEN     OQS_SIG_ml_dsa_65_length_public_key
#define MESH_SIG_SIGNATURE_LEN      OQS_SIG_ml_dsa_65_length_signature
#endif

// Максимальные длины
#define MESH_PQ_CIPHERTEXT_MAX_LEN  2048
#define MESH_SIGNATURE_MAX_LEN      4096

// ============================================================================
// Размеры пакетов
// ============================================================================

/** Максимальный размер полезной нагрузки (64KB) */
#define MESH_PAYLOAD_MAX                65536

/** Максимальный размер пакета (128KB) */
#define MESH_MAX_PACKET_SIZE            (128 * 1024)

/** Базовый размер гибридного пакета (без payload) */
#define MESH_HYBRID_PACKET_BASE_SIZE    (sizeof(mesh_hybrid_packet_t))

/** Максимальный размер гибридного пакета */
#define MESH_HYBRID_PACKET_MAX_SIZE     (MESH_HYBRID_PACKET_BASE_SIZE + MESH_PAYLOAD_MAX)

/** Размер буфера по умолчанию для тестов - УВЕЛИЧЕН для предотвращения stack smashing */
#define MESH_TEST_BUFFER_SIZE           (MESH_HYBRID_PACKET_MAX_SIZE + 16384)

// ============================================================================
// Типы сообщений
// ============================================================================

typedef enum {
    MESH_MSG_TYPE_PING = 0x01,
    MESH_MSG_TYPE_PONG = 0x02,
    MESH_MSG_TYPE_STATS = 0x03,
    MESH_MSG_TYPE_MTPROTO = 0x04,
    MESH_MSG_TYPE_POSITION = 0x05,
    MESH_MSG_TYPE_TELEMETRY = 0x06,
    MESH_MSG_TYPE_DEVICE_INFO = 0x07,
    MESH_MSG_TYPE_AUTH = 0x08,
    MESH_MSG_TYPE_ALERT = 0x09,
    MESH_MSG_TYPE_LOG = 0x0A,
    MESH_MSG_TYPE_MAX = 0x0A
} mesh_message_type_t;

// ============================================================================
// Типы криптографии
// ============================================================================

#define MESH_CRYPTO_TYPE_NONE       0
#define MESH_CRYPTO_TYPE_CLASSIC    1
#define MESH_CRYPTO_TYPE_HYBRID     2

#define MESH_CRYPTO_FLAG_NONE       0x00
#define MESH_CRYPTO_FLAG_ENCRYPTED  0x01
#define MESH_CRYPTO_FLAG_SIGNED     0x02
#define MESH_CRYPTO_FLAG_PQ_ENABLED 0x04

// ============================================================================
// Флаги
// ============================================================================

#define MESH_FLAG_NONE          0x00000000
#define MESH_FLAG_BROADCAST     0x00000001
#define MESH_FLAG_FORWARDED     0x00000002
#define MESH_FLAG_ACK           0x00000004
#define MESH_FLAG_ENCRYPTED     0x00000008
#define MESH_FLAG_COMPRESSED    0x00000010
#define MESH_FLAG_CACHED        0x00000020
#define MESH_FLAG_RETRY         0x00000040
#define MESH_FLAG_PRIORITY      0x00000080
#define MESH_FLAG_CONFIRMED     0x00000100
#define MESH_FLAG_URGENT        0x00000200
#define MESH_FLAG_FRAGMENT      0x00000400
#define MESH_FLAG_LAST_FRAGMENT 0x00000800

// ============================================================================
// Основная структура классического пакета
// ============================================================================

#pragma pack(push, 1)

typedef struct {
    uint32_t magic;              // 0x4D455348
    uint32_t version;            // MESH_PACKET_VERSION
    uint64_t packet_id;          // Уникальный ID
    uint32_t timestamp;          // Время отправки
    uint32_t type;               // mesh_message_type_t
    uint32_t flags;              // MESH_FLAG_*

    // Отправитель
    char sender_id[64];
    char sender_name[128];

    // Получатель
    char receiver_id[64];
    char receiver_name[128];

    // Маршрутизация
    uint32_t hop_count;
    uint32_t max_hops;

    // Криптография
    uint32_t crypto_type;
    uint32_t crypto_flags;
    unsigned char signature[64];
    unsigned char public_key[32];

    // Данные
    uint32_t payload_len;
    unsigned char payload[0];
} __attribute__((packed)) mesh_packet_t;

// ============================================================================
// Гибридный пакет
// ============================================================================

typedef struct mesh_hybrid_packet_s {
    uint32_t magic;              // 0x4D455348
    uint32_t version;            // 2 (гибридная версия)
    uint64_t packet_id;          // Уникальный ID
    uint32_t timestamp;          // Время отправки
    uint32_t type;               // mesh_message_type_t
    uint32_t flags;              // MESH_FLAG_*

    // Отправитель
    char sender_id[64];
    char sender_name[128];

    // Получатель
    char receiver_id[64];
    char receiver_name[128];

    // Маршрутизация
    uint32_t hop_count;
    uint32_t max_hops;

    // Криптография
    uint32_t crypto_type;
    uint32_t crypto_flags;
    uint32_t pq_algorithm;

    // Классическая часть (ECDH)
    unsigned char ephemeral_public[32];
    unsigned char iv[16];

    // Квантовая часть (ML-KEM)
    uint16_t pq_ciphertext_len;
    uint8_t pq_ciphertext[MESH_PQ_CIPHERTEXT_LEN];

    // Подпись (ML-DSA)
    uint16_t signature_len;
    uint8_t signature[MESH_SIG_SIGNATURE_LEN];

    // Данные
    uint32_t payload_len;
    unsigned char payload[0];
} __attribute__((packed)) mesh_hybrid_packet_t;

// ============================================================================
// Структура для позиции (GPS)
// ============================================================================

typedef struct {
    int64_t latitude;            // Микро-градусы * 1e7
    int64_t longitude;           // Микро-градусы * 1e7
    int32_t altitude;            // Метры
    int32_t accuracy;            // Метры
    uint32_t timestamp;          // Время измерения
    uint32_t flags;              // Дополнительные флаги
    float speed;                 // Скорость в м/с
    float heading;               // Направление в градусах
} mesh_position_t;

#define MESH_POS_FLAG_GPS        0x00000001
#define MESH_POS_FLAG_FIXED      0x00000002
#define MESH_POS_FLAG_MOVING     0x00000004

// ============================================================================
// Статистика пакетов
// ============================================================================

typedef struct {
    uint64_t total;              // Всего пакетов
    uint64_t valid;              // Валидных
    uint64_t invalid;            // Невалидных
    uint64_t expired;            // Просроченных
    uint64_t broadcast;          // Широковещательных
    uint64_t forwarded;          // Переадресованных
    uint64_t by_type[MESH_MSG_TYPE_MAX + 1]; // По типам
    uint64_t bytes_total;        // Всего байт
    uint64_t bytes_payload;      // Всего байт полезной нагрузки
} mesh_packet_stats_t;

// ============================================================================
// Функции для классических пакетов
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

// ----------------------------------------------------------------------------
// Создание и удаление
// ----------------------------------------------------------------------------

/**
 * Создать новый классический пакет
 */
mesh_packet_t* mesh_packet_create(uint32_t type, const char *receiver_id,
                                  const void *data, uint32_t data_len);

/**
 * Создать пакет с позицией (GPS)
 */
mesh_packet_t* mesh_packet_create_position(const char *receiver_id,
                                           double latitude, double longitude,
                                           int32_t altitude, int32_t accuracy);

/**
 * Создать пакет с текстовым сообщением
 */
mesh_packet_t* mesh_packet_create_text(const char *receiver_id, const char *text);

/**
 * Освободить память пакета
 */
void mesh_packet_free(mesh_packet_t *packet);

/**
 * Создать копию пакета
 */
mesh_packet_t* mesh_packet_clone(const mesh_packet_t *packet);

// ----------------------------------------------------------------------------
// Установка полей
// ----------------------------------------------------------------------------

/**
 * Установить отправителя
 */
void mesh_packet_set_sender(mesh_packet_t *packet, const char *id, const char *name);

/**
 * Установить получателя
 */
void mesh_packet_set_receiver(mesh_packet_t *packet, const char *id, const char *name);

/**
 * Установить флаги
 */
void mesh_packet_set_flags(mesh_packet_t *packet, uint32_t flags);

/**
 * Добавить флаги (OR)
 */
void mesh_packet_add_flags(mesh_packet_t *packet, uint32_t flags);

/**
 * Очистить флаги (AND NOT)
 */
void mesh_packet_clear_flags(mesh_packet_t *packet, uint32_t flags);

/**
 * Проверить наличие флага
 */
int mesh_packet_has_flag(const mesh_packet_t *packet, uint32_t flag);

/**
 * Установить максимальное количество хопов
 */
void mesh_packet_set_max_hops(mesh_packet_t *packet, uint32_t max_hops);

// ----------------------------------------------------------------------------
// Маршрутизация
// ----------------------------------------------------------------------------

/**
 * Увеличить количество хопов (для пересылки)
 */
mesh_packet_t* mesh_packet_increment_hop(mesh_packet_t *packet);

/**
 * Проверить возможность пересылки
 */
int mesh_packet_can_forward(const mesh_packet_t *packet);

/**
 * Проверить, является ли пакет широковещательным
 */
int mesh_packet_is_broadcast(const mesh_packet_t *packet);

/**
 * Проверить, адресован ли пакет получателю
 */
int mesh_packet_is_for_receiver(const mesh_packet_t *packet, const char *receiver_id);

// ----------------------------------------------------------------------------
// Валидация
// ----------------------------------------------------------------------------

/**
 * Проверить валидность пакета
 */
int mesh_packet_validate(const mesh_packet_t *packet);

/**
 * Вычислить контрольную сумму
 */
uint32_t mesh_packet_compute_checksum(const mesh_packet_t *packet);

/**
 * Проверить контрольную сумму
 */
int mesh_packet_verify_checksum(const mesh_packet_t *packet);

// ----------------------------------------------------------------------------
// Получение данных
// ----------------------------------------------------------------------------

/**
 * Получить указатель на полезную нагрузку
 */
const void* mesh_packet_get_payload(const mesh_packet_t *packet);

/**
 * Получить длину полезной нагрузки
 */
uint32_t mesh_packet_get_payload_len(const mesh_packet_t *packet);

/**
 * Получить общий размер пакета
 */
size_t mesh_packet_get_total_size(const mesh_packet_t *packet);

/**
 * Получить ID пакета
 */
uint64_t mesh_packet_get_id(const mesh_packet_t *packet);

/**
 * Получить тип пакета
 */
uint32_t mesh_packet_get_type(const mesh_packet_t *packet);

/**
 * Получить ID отправителя
 */
const char* mesh_packet_get_sender_id(const mesh_packet_t *packet);

/**
 * Получить ID получателя
 */
const char* mesh_packet_get_receiver_id(const mesh_packet_t *packet);

// ----------------------------------------------------------------------------
// Работа с позицией
// ----------------------------------------------------------------------------

/**
 * Извлечь позицию из пакета
 */
int mesh_packet_get_position(const mesh_packet_t *packet, mesh_position_t *pos);

/**
 * Проверить, является ли пакет позицией
 */
int mesh_packet_is_position(const mesh_packet_t *packet);

/**
 * Получить широту
 */
double mesh_packet_get_latitude(const mesh_packet_t *packet);

/**
 * Получить долготу
 */
double mesh_packet_get_longitude(const mesh_packet_t *packet);

/**
 * Получить высоту
 */
int32_t mesh_packet_get_altitude(const mesh_packet_t *packet);

/**
 * Получить точность
 */
int32_t mesh_packet_get_accuracy(const mesh_packet_t *packet);

// ----------------------------------------------------------------------------
// Отладка
// ----------------------------------------------------------------------------

/**
 * Распечатать информацию о пакете
 */
void mesh_packet_print(const mesh_packet_t *packet);

/**
 * Распечатать Hex-дамп пакета
 */
void mesh_packet_hex_dump(const mesh_packet_t *packet);

// ============================================================================
// Функции для гибридных пакетов
// ============================================================================

// ----------------------------------------------------------------------------
// Создание
// ----------------------------------------------------------------------------

/**
 * Создать гибридный пакет
 */
mesh_hybrid_packet_t* mesh_hybrid_packet_create(uint32_t type,
                                                 const char *receiver_id,
                                                 const void *data,
                                                 uint32_t data_len);

/**
 * Создать гибридный пакет из буфера
 */
mesh_hybrid_packet_t* mesh_hybrid_packet_from_buffer(const unsigned char *buffer,
                                                      size_t buffer_len);

// ----------------------------------------------------------------------------
// Размеры
// ----------------------------------------------------------------------------

/**
 * Получить размер гибридного пакета
 */
size_t mesh_hybrid_packet_get_size(const mesh_hybrid_packet_t *packet);

/**
 * Вычислить размер гибридного пакета по длине данных
 */
size_t mesh_hybrid_packet_calc_size(size_t data_len);

// ----------------------------------------------------------------------------
// Проверка
// ----------------------------------------------------------------------------

/**
 * Проверить, является ли пакет гибридным
 */
int mesh_hybrid_packet_is_hybrid(const mesh_hybrid_packet_t *packet);

/**
 * Проверить валидность гибридного пакета
 */
int mesh_hybrid_packet_validate(const mesh_hybrid_packet_t *packet);

/**
 * Вычислить контрольную сумму гибридного пакета
 */
uint32_t mesh_hybrid_packet_compute_checksum(const mesh_hybrid_packet_t *packet);

/**
 * Проверить контрольную сумму гибридного пакета
 */
int mesh_hybrid_packet_verify_checksum(const mesh_hybrid_packet_t *packet);

// ----------------------------------------------------------------------------
// Установка полей
// ----------------------------------------------------------------------------

/**
 * Установить PQ-шифротекст в гибридный пакет
 */
int mesh_hybrid_packet_set_pq_ciphertext(mesh_hybrid_packet_t *packet,
                                          const unsigned char *pq_ciphertext,
                                          uint16_t ciphertext_len);

/**
 * Установить подпись в гибридный пакет
 */
int mesh_hybrid_packet_set_signature(mesh_hybrid_packet_t *packet,
                                      const unsigned char *signature,
                                      uint16_t sig_len);

/**
 * Установить временный публичный ключ и IV
 */
int mesh_hybrid_packet_set_ephemeral(mesh_hybrid_packet_t *packet,
                                      const unsigned char *ephemeral,
                                      const unsigned char *iv);

// ----------------------------------------------------------------------------
// Получение полей
// ----------------------------------------------------------------------------

/**
 * Получить PQ-шифротекст из пакета
 */
const unsigned char* mesh_hybrid_packet_get_pq_ciphertext(const mesh_hybrid_packet_t *packet,
                                                           uint16_t *ciphertext_len);

/**
 * Получить подпись из пакета
 */
const unsigned char* mesh_hybrid_packet_get_signature(const mesh_hybrid_packet_t *packet,
                                                       uint16_t *sig_len);

/**
 * Получить временный публичный ключ
 */
const unsigned char* mesh_hybrid_packet_get_ephemeral(const mesh_hybrid_packet_t *packet);

/**
 * Получить IV
 */
const unsigned char* mesh_hybrid_packet_get_iv(const mesh_hybrid_packet_t *packet);

// ----------------------------------------------------------------------------
// Безопасные функции для работы с пакетами
// ----------------------------------------------------------------------------

/**
 * Создать пустой гибридный пакет с выделением памяти
 */
mesh_hybrid_packet_t* mesh_hybrid_packet_alloc(uint32_t type,
                                                const char *receiver_id,
                                                uint32_t data_len);

/**
 * Освободить гибридный пакет
 */
void mesh_hybrid_packet_free(mesh_hybrid_packet_t *packet);

/**
 * Создать копию пакета
 */
mesh_hybrid_packet_t* mesh_hybrid_packet_dup(const mesh_hybrid_packet_t *src);

// ----------------------------------------------------------------------------
// Отладка гибридных пакетов
// ----------------------------------------------------------------------------

/**
 * Распечатать информацию о гибридном пакете
 */
void mesh_hybrid_packet_print(const mesh_hybrid_packet_t *packet);

/**
 * Распечатать Hex-дамп гибридного пакета
 */
void mesh_hybrid_packet_hex_dump(const mesh_hybrid_packet_t *packet);

// ============================================================================
// Общие функции
// ============================================================================

/**
 * Распечатать статистику пакетов
 */
void mesh_packet_print_stats(const mesh_packet_stats_t *stats);

/**
 * Сбросить статистику
 */
void mesh_packet_stats_reset(mesh_packet_stats_t *stats);

/**
 * Обновить статистику
 */
void mesh_packet_update_stats(mesh_packet_stats_t *stats, const mesh_packet_t *packet);

/**
 * Получить строковое представление типа пакета
 */
const char* mesh_packet_type_to_string(uint32_t type);

#ifdef __cplusplus
}
#endif