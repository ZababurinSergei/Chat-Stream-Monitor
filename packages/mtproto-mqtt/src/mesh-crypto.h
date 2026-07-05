/*
    Mesh Crypto - Заголовочный файл
    Гибридная криптография: ECDH + ML-KEM (квантово-безопасная)
    С автоматическим управлением памятью
*/

#pragma once

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <openssl/evp.h>
#include <openssl/ec.h>
#include <openssl/ecdh.h>
#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <openssl/err.h>

// Подключаем liboqs для пост-квантовой криптографии
#include <oqs/oqs.h>

// Подключаем определения пакетов
#include "mesh-packet.h"

// ============================================================================
// Константы - каждая определяется отдельно
// ============================================================================

/** Длина классического ключа (ECDH) */
#define MESH_CLASSIC_KEY_LEN        32

/** Длина вектора инициализации (IV) */
#define MESH_IV_LEN                 16

/** Длина общего секрета */
#define MESH_SECRET_LEN             32

/** Длина публичного ключа ML-KEM (1184 байта) */
#ifndef MESH_PQ_PUBLIC_KEY_LEN
#define MESH_PQ_PUBLIC_KEY_LEN      1184
#endif

/** Длина секретного ключа ML-KEM (2400 байт) */
#ifndef MESH_PQ_SECRET_KEY_LEN
#define MESH_PQ_SECRET_KEY_LEN      2400
#endif

/** Длина шифротекста ML-KEM (1088 байт) */
#ifndef MESH_PQ_CIPHERTEXT_LEN
#define MESH_PQ_CIPHERTEXT_LEN      1088
#endif

/** Длина общего секрета ML-KEM (32 байта) */
#ifndef MESH_PQ_SHARED_SECRET_LEN
#define MESH_PQ_SHARED_SECRET_LEN   32
#endif

/** Длина публичного ключа ML-DSA (1952 байта) */
#ifndef MESH_SIG_PUBLIC_KEY_LEN
#define MESH_SIG_PUBLIC_KEY_LEN     1952
#endif

/** Длина секретного ключа ML-DSA (4032 байта) */
#ifndef MESH_SIG_SECRET_KEY_LEN
#define MESH_SIG_SECRET_KEY_LEN     4032
#endif

/** Длина подписи ML-DSA (3309 байт) */
#ifndef MESH_SIG_SIGNATURE_LEN
#define MESH_SIG_SIGNATURE_LEN      3309
#endif

/** Длина гибридного секрета (классический + квантовый) */
#define MESH_HYBRID_SECRET_LEN      (MESH_SECRET_LEN + MESH_PQ_SHARED_SECRET_LEN)

/** Алгоритм ML-KEM по умолчанию */
#define MESH_PQ_KEM_ALG             OQS_KEM_alg_ml_kem_768

/** Алгоритм ML-DSA по умолчанию */
#define MESH_PQ_SIG_ALG             OQS_SIG_alg_ml_dsa_65

/** Размер структуры mesh_hybrid_keypair_t для проверки */
#define MESH_HYBRID_KEYPAIR_SIZE    (32+32+1184+2400+1952+4032+4+4+4)

// ============================================================================
// Управление памятью
// ============================================================================

/**
 * Автоматическое освобождение памяти при выходе из области видимости
 * Использование:
 *   CRYPTO_AUTO_FREE unsigned char* buffer = malloc(size);
 */
#define CRYPTO_AUTO_FREE __attribute__((cleanup(crypto_auto_free)))

/**
 * Функция для автоматического освобождения памяти
 */
static inline void crypto_auto_free(void *ptr) {
    if (ptr) {
        void **p = (void**)ptr;
        if (*p) {
            free(*p);
            *p = NULL;
        }
    }
}

/**
 * Безопасное выделение памяти с проверкой
 */
#define SAFE_MALLOC(size) ({ \
    void *__ptr = malloc(size); \
    if (!__ptr) { \
        fprintf(stderr, "FATAL: Failed to allocate %zu bytes at %s:%d\n", \
                (size_t)(size), __FILE__, __LINE__); \
        exit(1); \
    } \
    __ptr; \
})

/**
 * Безопасное выделение памяти с обнулением
 */
#define SAFE_CALLOC(count, size) ({ \
    void *__ptr = calloc(count, size); \
    if (!__ptr) { \
        fprintf(stderr, "FATAL: Failed to allocate %zu x %zu bytes at %s:%d\n", \
                (size_t)(count), (size_t)(size), __FILE__, __LINE__); \
        exit(1); \
    } \
    __ptr; \
})

/**
 * Освобождение памяти с обнулением указателя
 */
#define SAFE_FREE(ptr) do { \
    if (ptr) { \
        free(ptr); \
        ptr = NULL; \
    } \
} while(0)

// ============================================================================
// Отладочные макросы
// ============================================================================

#define CRYPTO_DEBUG 1

#define CRYPTO_LOG(fmt, ...) \
    do { if (CRYPTO_DEBUG) { \
        fprintf(stderr, "[CRYPTO] " fmt "\n", ##__VA_ARGS__); \
        fflush(stderr); \
    } } while(0)

#define CRYPTO_HEX(label, data, len) \
    do { if (CRYPTO_DEBUG) { \
        fprintf(stderr, "[CRYPTO] %s: ", label); \
        size_t _len = (size_t)(len); \
        size_t _show = _len > 32 ? 32 : _len; \
        for (size_t i = 0; i < _show; i++) { \
            fprintf(stderr, "%02x", ((unsigned char*)(data))[i]); \
        } \
        if (_len > 32) fprintf(stderr, "..."); \
        fprintf(stderr, " (%zu bytes)\n", _len); \
        fflush(stderr); \
    } } while(0)

// ============================================================================
// Структуры
// ============================================================================

/**
 * Пара ключей для гибридной криптографии
 * ВАЖНО: Все поля должны быть выровнены правильно!
 * Размер структуры должен быть одинаковым во всем коде
 *
 * Размер: 32+32+1184+2400+1952+4032+4+4+4 = 9644 байта
 */
typedef struct {
    // Классические ключи (ECDH) - 32 байта каждый
    unsigned char classic_public_key[32];
    unsigned char classic_private_key[32];

    // Квантово-безопасные ключи (ML-KEM)
    uint8_t pq_public_key[MESH_PQ_PUBLIC_KEY_LEN];
    uint8_t pq_secret_key[MESH_PQ_SECRET_KEY_LEN];

    // Ключи для подписи (ML-DSA)
    uint8_t sig_public_key[MESH_SIG_PUBLIC_KEY_LEN];
    uint8_t sig_secret_key[MESH_SIG_SECRET_KEY_LEN];

    // Флаги инициализации - ИСПОЛЬЗУЕМ int для совместимости
    int classic_initialized;
    int pq_initialized;
    int sig_initialized;
} mesh_hybrid_keypair_t;

/**
 * Гибридная сессия для шифрования
 * Содержит оба секрета: классический и квантовый
 */
typedef struct {
    // Классический секрет (ECDH)
    unsigned char classic_shared_secret[MESH_SECRET_LEN];
    int classic_secret_len;

    // Квантовый секрет (ML-KEM)
    uint8_t pq_shared_secret[MESH_PQ_SHARED_SECRET_LEN];
    int pq_secret_len;

    // Гибридный секрет (комбинированный)
    unsigned char hybrid_secret[MESH_HYBRID_SECRET_LEN];
    int hybrid_secret_len;

    // Итоговые ключи для шифрования
    unsigned char aes_key[32];
    unsigned char aes_iv[16];

    // Временные ключи отправителя
    unsigned char ephemeral_public[32];
    uint8_t pq_ciphertext[MESH_PQ_CIPHERTEXT_LEN];
    int pq_ciphertext_len;

    /** Флаг инициализации сессии */
    bool initialized;
} mesh_hybrid_session_t;

/**
 * Структура для хранения состояния гибридной криптографии
 */
typedef struct {
    OQS_KEM *kem;              /**< Указатель на KEM (ML-KEM) */
    OQS_SIG *sig;              /**< Указатель на SIG (ML-DSA) */
    int initialized;           /**< Флаг инициализации */
    char version[64];          /**< Строка версии */
    int debug_enabled;         /**< Флаг отладки */
} mesh_crypto_state_t;

// ============================================================================
// Функции гибридной криптографии
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

// ----------------------------------------------------------------------------
// Инициализация и очистка
// ----------------------------------------------------------------------------

/**
 * Инициализировать гибридную криптографию
 * Вызывается один раз при старте приложения
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_init(void);

/**
 * Очистить ресурсы гибридной криптографии
 */
void mesh_hybrid_cleanup(void);

/**
 * Проверить поддержку квантово-безопасных алгоритмов
 * @return true если поддерживается, false если нет
 */
bool mesh_hybrid_is_pq_supported(void);

/**
 * Получить версию гибридной криптографии
 * @return Строка с версией
 */
const char* mesh_hybrid_version(void);

/**
 * Получить указатель на глобальное состояние криптографии
 * @return Указатель на структуру состояния
 */
mesh_crypto_state_t* mesh_get_crypto_state(void);

/**
 * Проверить, инициализирована ли гибридная криптография
 * @return 1 если инициализирована, 0 если нет
 */
int mesh_is_hybrid_initialized(void);

/**
 * Включить/отключить режим отладки
 * @param enable 1 для включения, 0 для отключения
 */
void mesh_crypto_set_debug(int enable);

// ----------------------------------------------------------------------------
// Генерация ключей
// ----------------------------------------------------------------------------

/**
 * Сгенерировать гибридную пару ключей для пользователя
 * @param keypair Выходная структура с ключами
 * @param user_id ID пользователя (для детерминированной генерации классической части)
 * @param secret_phrase Секретная фраза пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_generate_keypair(mesh_hybrid_keypair_t *keypair,
                                 const char *user_id,
                                 const char *secret_phrase);

/**
 * Освободить ресурсы гибридных ключей
 * @param keypair Структура с ключами
 */
void mesh_hybrid_free_keypair(mesh_hybrid_keypair_t *keypair);

// ----------------------------------------------------------------------------
// Создание и восстановление сессий
// ----------------------------------------------------------------------------

/**
 * Создать гибридную сессию для отправки
 * @param receiver_pk Публичный гибридный ключ получателя
 * @param session Выходная структура сессии
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_create_session(const mesh_hybrid_keypair_t *receiver_pk,
                               mesh_hybrid_session_t *session);

/**
 * Восстановить гибридную сессию для получения
 * @param packet Пакет с гибридным сообщением
 * @param packet_len Длина пакета
 * @param receiver_sk Приватный гибридный ключ получателя
 * @param session Выходная структура сессии
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_restore_session(const unsigned char *packet,
                                size_t packet_len,
                                const mesh_hybrid_keypair_t *receiver_sk,
                                mesh_hybrid_session_t *session);

// ----------------------------------------------------------------------------
// Шифрование и дешифрование
// ----------------------------------------------------------------------------

/**
 * Зашифровать сообщение с использованием гибридной сессии
 * @param session Гибридная сессия
 * @param plaintext Открытый текст
 * @param plaintext_len Длина открытого текста
 * @param packet Выходной буфер для пакета
 * @param packet_len Выходная длина пакета
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_encrypt(mesh_hybrid_session_t *session,
                        const unsigned char *plaintext,
                        size_t plaintext_len,
                        unsigned char *packet,
                        size_t *packet_len);

/**
 * Расшифровать сообщение с использованием гибридной сессии
 * @param session Гибридная сессия
 * @param packet Пакет с зашифрованными данными
 * @param packet_len Длина пакета
 * @param plaintext Выходной буфер для открытого текста
 * @param plaintext_len Выходная длина открытого текста
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_decrypt(mesh_hybrid_session_t *session,
                        const unsigned char *packet,
                        size_t packet_len,
                        unsigned char *plaintext,
                        size_t *plaintext_len);

// ----------------------------------------------------------------------------
// Упрощенные функции для пользователей
// ----------------------------------------------------------------------------

/**
 * Зашифровать сообщение для получателя (гибридный режим)
 * @param receiver_id ID получателя
 * @param receiver_pk Публичный гибридный ключ получателя
 * @param plaintext Открытый текст
 * @param plaintext_len Длина открытого текста
 * @param packet Выходной буфер для пакета
 * @param packet_len Выходная длина пакета
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_encrypt_message(const char *receiver_id,
                                const mesh_hybrid_keypair_t *receiver_pk,
                                const unsigned char *plaintext,
                                size_t plaintext_len,
                                unsigned char *packet,
                                size_t *packet_len);

/**
 * Расшифровать сообщение (гибридный режим)
 * @param keypair Приватный гибридный ключ получателя
 * @param packet Пакет с зашифрованными данными
 * @param packet_len Длина пакета
 * @param plaintext Выходной буфер для открытого текста
 * @param plaintext_len Выходная длина открытого текста
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_decrypt_message(const mesh_hybrid_keypair_t *keypair,
                                const unsigned char *packet,
                                size_t packet_len,
                                unsigned char *plaintext,
                                size_t *plaintext_len);

// ----------------------------------------------------------------------------
// Подписи и верификация (гибридные)
// ----------------------------------------------------------------------------

/**
 * Подписать данные гибридной подписью (ML-DSA)
 * @param keypair Ключи с подписью
 * @param data Данные для подписи
 * @param data_len Длина данных
 * @param signature Выходная подпись
 * @param signature_len Выходная длина подписи
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_sign(const mesh_hybrid_keypair_t *keypair,
                     const unsigned char *data,
                     size_t data_len,
                     unsigned char *signature,
                     size_t *signature_len);

/**
 * Проверить гибридную подпись
 * @param keypair Ключи с публичной подписью
 * @param data Данные для проверки
 * @param data_len Длина данных
 * @param signature Подпись для проверки
 * @param signature_len Длина подписи
 * @return 1 если подпись верна, 0 если нет, -1 при ошибке
 */
int mesh_hybrid_verify(const mesh_hybrid_keypair_t *keypair,
                       const unsigned char *data,
                       size_t data_len,
                       const unsigned char *signature,
                       size_t signature_len);

// ----------------------------------------------------------------------------
// Вспомогательные функции
// ----------------------------------------------------------------------------

/**
 * Получить размер гибридного пакета
 * @param plaintext_len Длина открытого текста
 * @return Размер пакета
 */
size_t mesh_hybrid_packet_size(size_t plaintext_len);

/**
 * Сгенерировать случайные байты
 * @param key Выходной буфер
 * @param len Длина в байтах
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_crypto_random(unsigned char *key, size_t len);

/**
 * Сгенерировать публичный ключ из ID пользователя
 * @param user_id Строка идентификатора (например, "@alice")
 * @param public_key Выходной буфер для публичного ключа (32 байта)
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_crypto_public_from_id(const char *user_id, unsigned char *public_key);

/**
 * Вычислить общий секрет ECDH
 * @param private_key Приватный ключ (32 байта)
 * @param public_key Публичный ключ (32 байта)
 * @param shared_secret Выходной буфер для общего секрета
 * @param secret_len Выходная длина секрета
 * @return 0 при успехе, -1 при ошибке
 */
int ecdh_shared_secret(const unsigned char *private_key,
                       const unsigned char *public_key,
                       unsigned char *shared_secret,
                       int *secret_len);

// ----------------------------------------------------------------------------
// Безопасные функции с автоматическим выделением памяти
// ----------------------------------------------------------------------------

/**
 * Зашифровать с автоматическим выделением памяти
 * @param session Гибридная сессия
 * @param plaintext Открытый текст
 * @param plaintext_len Длина открытого текста
 * @param packet Выходной указатель на пакет (будет выделен)
 * @param packet_len Выходная длина пакета
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_encrypt_auto(mesh_hybrid_session_t *session,
                             const unsigned char *plaintext,
                             size_t plaintext_len,
                             mesh_hybrid_packet_t **packet,
                             size_t *packet_len);

/**
 * Расшифровать с автоматическим выделением памяти
 * @param session Гибридная сессия
 * @param packet Пакет с зашифрованными данными
 * @param packet_len Длина пакета
 * @param plaintext Выходной указатель на открытый текст (будет выделен)
 * @param plaintext_len Выходная длина открытого текста
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_hybrid_decrypt_auto(mesh_hybrid_session_t *session,
                             const unsigned char *packet,
                             size_t packet_len,
                             unsigned char **plaintext,
                             size_t *plaintext_len);

/**
 * Очистить сессию (обнулить чувствительные данные)
 * @param session Сессия для очистки
 */
void mesh_hybrid_session_clear(mesh_hybrid_session_t *session);

#ifdef __cplusplus
}
#endif