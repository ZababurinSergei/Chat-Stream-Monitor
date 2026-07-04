/*
    Mesh User - Заголовочный файл
    Гибридная криптография с квантовой защитой
    Поддерживает ECDH + ML-KEM (Quantum-Safe)
*/

#pragma once

#include "mesh-crypto.h"
#include <stdint.h>
#include <stddef.h>
#include <time.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

// ============================================================================
// Константы
// ============================================================================

/** Максимальная длина ID пользователя */
#define MESH_MAX_USER_ID         64

/** Максимальная длина отображаемого имени */
#define MESH_MAX_USER_NAME       128

/** Максимальная длина секретной фразы */
#define MESH_MAX_USER_SECRET     256

/** Максимальная длина топика */
#define MESH_MAX_TOPIC           256

/** Максимальный размер кэша публичных ключей */
#define MESH_CACHE_MAX_SIZE      64

// ============================================================================
// Структуры
// ============================================================================

/**
 * Пользователь Mesh-сети с гибридной криптографией
 *
 * Содержит всю информацию о пользователе:
 * - Идентификатор (@username)
 * - Отображаемое имя
 * - Секретную фразу (для генерации ключей)
 * - Гибридные ключи (классические + квантово-безопасные)
 * - Топики для обмена сообщениями
 * - Статус и метаданные
 */
typedef struct {
    // ============================================================
    // Идентификация
    // ============================================================
    char user_id[MESH_MAX_USER_ID];           /**< Уникальный ID (@alice) */
    char display_name[MESH_MAX_USER_NAME];    /**< Отображаемое имя */
    char secret_phrase[MESH_MAX_USER_SECRET]; /**< Секретная фраза (только у владельца) */

    // ============================================================
    // Криптографические ключи
    // ============================================================
    mesh_hybrid_keypair_t keypair;            /**< Гибридные ключи (ECDH + ML-KEM) */

    // ============================================================
    // Топики для MQTT
    // ============================================================
    char inbox_topic[MESH_MAX_TOPIC];         /**< Топик для входящих сообщений */
    char public_topic[MESH_MAX_TOPIC];        /**< Топик для публичного ключа */
    char pq_public_topic[MESH_MAX_TOPIC];     /**< Топик для PQ-публичного ключа */

    // ============================================================
    // Метаданные
    // ============================================================
    time_t created_at;                        /**< Время создания */
    time_t last_active;                       /**< Время последней активности */
    int is_online;                            /**< Статус онлайн */
    int is_trusted;                           /**< Доверенный пользователь */
    int is_pq_enabled;                        /**< Поддерживает PQ-криптографию */
} mesh_user_t;

/**
 * Кэш публичных гибридных ключей
 *
 * Используется для локального хранения публичных ключей
 * других пользователей, чтобы не запрашивать их каждый раз
 */
typedef struct {
    char user_id[MESH_MAX_USER_ID];           /**< ID пользователя */
    mesh_hybrid_keypair_t keypair;            /**< Публичный гибридный ключ */
    time_t cached_at;                         /**< Время кэширования */
    int is_valid;                             /**< Флаг валидности */
} mesh_hybrid_cache_t;

// ============================================================================
// Функции управления пользователями
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Создать нового пользователя с гибридной криптографией
 *
 * @param user          Указатель на структуру пользователя
 * @param user_id       Уникальный ID (например, "@alice")
 * @param display_name  Отображаемое имя (может быть NULL)
 * @param secret_phrase Секретная фраза (только для владельца!)
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_create_hybrid(mesh_user_t *user,
                            const char *user_id,
                            const char *display_name,
                            const char *secret_phrase);

/**
 * Загрузить пользователя из файла
 *
 * @param user     Указатель на структуру пользователя
 * @param filename Имя файла для загрузки
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_load_hybrid(mesh_user_t *user, const char *filename);

/**
 * Сохранить пользователя в файл
 *
 * @param user     Указатель на структуру пользователя
 * @param filename Имя файла для сохранения
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_save_hybrid(const mesh_user_t *user, const char *filename);

/**
 * Освободить ресурсы пользователя
 *
 * @param user Указатель на структуру пользователя
 */
void mesh_user_free_hybrid(mesh_user_t *user);

// ============================================================================
// Функции кэша публичных ключей
// ============================================================================

/**
 * Добавить публичный ключ в кэш
 *
 * @param user_id ID пользователя
 * @param keypair Гибридный ключ для кэширования
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_cache_add_hybrid(const char *user_id,
                               const mesh_hybrid_keypair_t *keypair);

/**
 * Получить публичный ключ из кэша
 *
 * @param user_id ID пользователя
 * @param keypair Указатель для сохранения ключа
 * @return 0 если найден, -1 если нет
 */
int mesh_user_cache_get_hybrid(const char *user_id,
                               mesh_hybrid_keypair_t *keypair);

/**
 * Очистить кэш публичных ключей
 */
void mesh_user_cache_clear_hybrid(void);

// ============================================================================
// Функции для работы с топиками
// ============================================================================

/**
 * Получить топик для отправки сообщения пользователю
 *
 * @param user_id    ID получателя
 * @param topic      Буфер для топика
 * @param topic_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_get_inbox_topic(const char *user_id, char *topic, size_t topic_size);

/**
 * Получить топик для публичного ключа пользователя
 *
 * @param user_id    ID пользователя
 * @param topic      Буфер для топика
 * @param topic_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_get_public_topic(const char *user_id, char *topic, size_t topic_size);

/**
 * Получить топик для PQ-публичного ключа пользователя
 *
 * @param user_id    ID пользователя
 * @param topic      Буфер для топика
 * @param topic_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_get_pq_public_topic(const char *user_id, char *topic, size_t topic_size);

// ============================================================================
// Функции отправки и получения сообщений
// ============================================================================

/**
 * Отправить зашифрованное гибридное сообщение пользователю
 *
 * Использует гибридную криптографию:
 * - Классическая часть: ECDH (Curve25519)
 * - Квантовая часть: ML-KEM-768
 *
 * @param sender       Отправитель
 * @param receiver_id  ID получателя
 * @param message      Открытый текст сообщения
 * @param message_len  Длина сообщения
 * @param packet       Выходной буфер для пакета
 * @param packet_len   Выходная длина пакета
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_send_hybrid(mesh_user_t *sender,
                          const char *receiver_id,
                          const unsigned char *message,
                          size_t message_len,
                          unsigned char *packet,
                          size_t *packet_len);

/**
 * Получить и расшифровать гибридное сообщение
 *
 * @param user           Получатель
 * @param packet         Зашифрованный пакет
 * @param packet_len     Длина пакета
 * @param decrypted      Выходной буфер для расшифрованного сообщения
 * @param decrypted_len  Выходная длина сообщения
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_receive_hybrid(mesh_user_t *user,
                             const unsigned char *packet,
                             size_t packet_len,
                             unsigned char *decrypted,
                             size_t *decrypted_len);

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Получить гибридный ключ пользователя по ID
 *
 * @param user_id ID пользователя
 * @param keypair Выходной буфер для ключа
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_user_get_hybrid_keypair(const char *user_id,
                                 mesh_hybrid_keypair_t *keypair);

// ============================================================================
// Функции отладки
// ============================================================================

/**
 * Вывести информацию о пользователе
 *
 * @param user Структура пользователя
 */
void mesh_user_print_hybrid(const mesh_user_t *user);

/**
 * Проверить валидность пользователя
 *
 * @param user Структура пользователя
 * @return true если валиден, false если нет
 */
bool mesh_user_valid_hybrid(const mesh_user_t *user);

#ifdef __cplusplus
}
#endif