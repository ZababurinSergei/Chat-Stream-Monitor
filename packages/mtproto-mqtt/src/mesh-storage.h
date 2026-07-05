/*
    Mesh Storage - Хранение ключей на диске
*/

#pragma once

#include "mesh-user.h"
#include <stddef.h>

// ============================================================================
// Константы
// ============================================================================

#define MESH_STORAGE_DIR         ".mesh"
#define MESH_KEY_FILE_EXT        ".keys"
#define MESH_KEY_FILE_PERM       0600
#define MESH_BACKUP_DIR          ".mesh/backup"
#define MESH_BACKUP_EXT          ".backup"

// ============================================================================
// Функции
// ============================================================================

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Сохранить пользователя в файл
 * @param user Указатель на пользователя
 * @param filename Имя файла
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_save_user(const mesh_user_t *user, const char *filename);

/**
 * Загрузить пользователя из файла
 * @param user Указатель на пользователя
 * @param filename Имя файла
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_load_user(mesh_user_t *user, const char *filename);

/**
 * Сохранить пользователя в стандартную директорию
 * @param user Указатель на пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_save_user_default(mesh_user_t *user);

/**
 * Загрузить пользователя из стандартной директории
 * @param user_id ID пользователя
 * @param user Указатель на пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_load_user_default(const char *user_id, mesh_user_t *user);

/**
 * Удалить файл с ключами пользователя
 * @param user_id ID пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_delete_user(const char *user_id);

/**
 * Проверить существование файла с ключами
 * @param user_id ID пользователя
 * @return 1 если существует, 0 если нет
 */
int mesh_storage_user_exists(const char *user_id);

/**
 * Получить путь к файлу ключей
 * @param user_id ID пользователя
 * @param buffer Буфер для пути
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_get_key_path(const char *user_id, char *buffer, size_t buffer_size);

/**
 * Создать резервную копию ключей пользователя
 * @param user_id ID пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_backup_user(const char *user_id);

/**
 * Восстановить ключи пользователя из резервной копии
 * @param user_id ID пользователя
 * @param user Указатель на пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_restore_user(const char *user_id, mesh_user_t *user);

/**
 * Получить путь к файлу резервной копии
 * @param user_id ID пользователя
 * @param buffer Буфер для пути
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_get_backup_path(const char *user_id, char *buffer, size_t buffer_size);

/**
 * Проверить существование резервной копии
 * @param user_id ID пользователя
 * @return 1 если существует, 0 если нет
 */
int mesh_storage_backup_exists(const char *user_id);

/**
 * Удалить резервную копию
 * @param user_id ID пользователя
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_delete_backup(const char *user_id);

/**
 * Получить размер файла ключей
 * @param user_id ID пользователя
 * @return Размер файла в байтах, -1 при ошибке
 */
long mesh_storage_get_key_size(const char *user_id);

/**
 * Создать директорию для хранения ключей
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_create_dir(void);

/**
 * Получить путь к стандартной директории хранения
 * @param buffer Буфер для пути
 * @param buffer_size Размер буфера
 * @return 0 при успехе, -1 при ошибке
 */
int mesh_storage_get_dir_path(char *buffer, size_t buffer_size);

/**
 * Получить список всех пользователей из хранилища
 * @param user_ids Буфер для ID пользователей
 * @param max_count Максимальное количество
 * @return Количество найденных пользователей, -1 при ошибке
 */
int mesh_storage_list_users(char user_ids[][64], int max_count);

#ifdef __cplusplus
}
#endif