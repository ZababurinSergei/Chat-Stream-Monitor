/*
    Mesh Registry - Реестр пользователей
    Хранит пользователей и их ключи
*/

#pragma once

#include "mesh-user.h"
#include <pthread.h>

// ============================================================================
// Константы
// ============================================================================

#define MESH_REGISTRY_DEFAULT_MAX  1024
#define MESH_REGISTRY_MAX          65536

// ============================================================================
// Структуры
// ============================================================================

/**
 * Запись в реестре пользователей
 */
typedef struct mesh_registry_entry {
    char user_id[64];              /**< ID пользователя (@alice) */
    mesh_user_t *user;             /**< Указатель на пользователя */
    time_t registered_at;          /**< Время регистрации */
    time_t last_active;            /**< Время последней активности */
    int is_online;                 /**< Статус онлайн */
    int is_valid;                  /**< Флаг валидности записи */
} mesh_registry_entry_t;

/**
 * Реестр пользователей
 */
typedef struct mesh_user_registry {
    mesh_registry_entry_t *entries; /**< Массив записей */
    int count;                      /**< Текущее количество пользователей */
    int capacity;                   /**< Текущая емкость массива */
    int max_users;                  /**< Максимальное количество пользователей */
    pthread_rwlock_t lock;          /**< Блокировка для потокобезопасности */
    int initialized;                /**< Флаг инициализации */
} mesh_user_registry_t;

// ============================================================================
// Функции
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Инициализировать реестр с максимальным количеством пользователей
 * @param max_users Максимальное количество пользователей (0 = значение по умолчанию)
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_registry_init(int max_users);

/**
 * Очистить реестр и освободить все ресурсы
 */
void mesh_registry_cleanup(void);

/**
 * Добавить пользователя в реестр
 * @param user Указатель на пользователя (память будет управляться реестром)
 * @return 0 при успехе, -1 при ошибке, -2 если уже существует, -3 если реестр полон
 */
int mesh_registry_add_user(mesh_user_t *user);

/**
 * Получить пользователя из реестра (только чтение)
 * @param user_id ID пользователя
 * @return Указатель на пользователя или NULL
 */
mesh_user_t* mesh_registry_get_user(const char *user_id);

/**
 * Получить пользователя из реестра с блокировкой на запись
 * @param user_id ID пользователя
 * @return Указатель на пользователя или NULL
 */
mesh_user_t* mesh_registry_get_user_locked(const char *user_id);

/**
 * Удалить пользователя из реестра
 * @param user_id ID пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_registry_remove_user(const char *user_id);

/**
 * Обновить время активности пользователя
 * @param user_id ID пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_registry_update_activity(const char *user_id);

/**
 * Установить статус онлайн
 * @param user_id ID пользователя
 * @param is_online 1 - онлайн, 0 - офлайн
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_registry_set_online(const char *user_id, int is_online);

/**
 * Получить количество пользователей в реестре
 * @return Количество пользователей
 */
int mesh_registry_count(void);

/**
 * Проверить, существует ли пользователь
 * @param user_id ID пользователя
 * @return 1 если существует, 0 если нет
 */
int mesh_registry_exists(const char *user_id);

/**
 * Получить список всех пользователей
 * @param user_ids Буфер для ID (массив строк)
 * @param max_count Максимальное количество
 * @return Количество полученных ID
 */
int mesh_registry_get_all_users(char user_ids[][64], int max_count);

/**
 * Очистить неактивных пользователей
 * @param max_age_seconds Максимальный возраст в секундах
 * @return Количество удаленных пользователей
 */
int mesh_registry_cleanup_inactive(int max_age_seconds);

/**
 * Гарантировать инициализацию реестра
 * Если реестр уже инициализирован - возвращает 0
 * Если нет - инициализирует с настройками по умолчанию
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_registry_ensure_initialized(void);

#ifdef __cplusplus
}
#endif