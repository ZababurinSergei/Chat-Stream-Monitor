/*
    Mesh Storage - Реализация хранения ключей
*/

#include "mesh-storage.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>
#include <time.h>
#include <sys/types.h>
#include <dirent.h>

// ============================================================================
// Отладочное логирование
// ============================================================================

#define STORAGE_LOG(fmt, ...) \
    do { \
        fprintf(stderr, "[STORAGE] " fmt "\n", ##__VA_ARGS__); \
        fflush(stderr); \
    } while(0)

// ============================================================================
// Вспомогательные функции
// ============================================================================

static int ensure_storage_dir(void) {
    const char *home = getenv("HOME");
    if (!home) {
        STORAGE_LOG("ERROR: HOME environment variable not set");
        return -1;
    }

    char path[1024];
    snprintf(path, sizeof(path), "%s/%s", home, MESH_STORAGE_DIR);

    struct stat st;
    if (stat(path, &st) == 0) {
        if (S_ISDIR(st.st_mode)) {
            return 0;
        } else {
            STORAGE_LOG("ERROR: %s exists but is not a directory", path);
            return -1;
        }
    }

    if (mkdir(path, 0700) != 0) {
        STORAGE_LOG("ERROR: Failed to create directory %s: %s", path, strerror(errno));
        return -1;
    }

    STORAGE_LOG("Created storage directory: %s", path);
    return 0;
}

static int ensure_backup_dir(void) {
    const char *home = getenv("HOME");
    if (!home) {
        STORAGE_LOG("ERROR: HOME environment variable not set");
        return -1;
    }

    char path[1024];
    snprintf(path, sizeof(path), "%s/%s", home, MESH_BACKUP_DIR);

    struct stat st;
    if (stat(path, &st) == 0) {
        if (S_ISDIR(st.st_mode)) {
            return 0;
        } else {
            STORAGE_LOG("ERROR: %s exists but is not a directory", path);
            return -1;
        }
    }

    if (mkdir(path, 0700) != 0) {
        STORAGE_LOG("ERROR: Failed to create backup directory %s: %s", path, strerror(errno));
        return -1;
    }

    STORAGE_LOG("Created backup directory: %s", path);
    return 0;
}

static const char* get_user_filename(const char *user_id) {
    static char filename[256];
    if (user_id[0] == '@') {
        snprintf(filename, sizeof(filename), "%s", user_id + 1);
    } else {
        snprintf(filename, sizeof(filename), "%s", user_id);
    }
    return filename;
}

// ============================================================================
// Основные функции
// ============================================================================

int mesh_storage_get_key_path(const char *user_id, char *buffer, size_t buffer_size) {
    if (!user_id || !buffer || buffer_size == 0) {
        STORAGE_LOG("ERROR: get_key_path - invalid parameters");
        return -1;
    }

    if (ensure_storage_dir() < 0) {
        return -1;
    }

    const char *home = getenv("HOME");
    if (!home) {
        STORAGE_LOG("ERROR: HOME environment variable not set");
        return -1;
    }

    const char *filename = get_user_filename(user_id);
    snprintf(buffer, buffer_size, "%s/%s/%s%s",
             home, MESH_STORAGE_DIR, filename, MESH_KEY_FILE_EXT);

    STORAGE_LOG("get_key_path: %s", buffer);
    return 0;
}

int mesh_storage_get_backup_path(const char *user_id, char *buffer, size_t buffer_size) {
    if (!user_id || !buffer || buffer_size == 0) {
        STORAGE_LOG("ERROR: get_backup_path - invalid parameters");
        return -1;
    }

    if (ensure_backup_dir() < 0) {
        return -1;
    }

    const char *home = getenv("HOME");
    if (!home) {
        STORAGE_LOG("ERROR: HOME environment variable not set");
        return -1;
    }

    const char *filename = get_user_filename(user_id);
    snprintf(buffer, buffer_size, "%s/%s/%s%s",
             home, MESH_BACKUP_DIR, filename, MESH_BACKUP_EXT);

    STORAGE_LOG("get_backup_path: %s", buffer);
    return 0;
}

int mesh_storage_save_user(const mesh_user_t *user, const char *filename) {
    if (!user || !filename) {
        STORAGE_LOG("ERROR: save_user - invalid parameters");
        return -1;
    }

    STORAGE_LOG("Saving user %s to %s", user->user_id, filename);

    FILE *f = fopen(filename, "wb");
    if (!f) {
        STORAGE_LOG("ERROR: Failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    // Устанавливаем права доступа (только владелец)
    chmod(filename, MESH_KEY_FILE_PERM);

    size_t written = fwrite(user, sizeof(mesh_user_t), 1, f);
    fclose(f);

    if (written != 1) {
        STORAGE_LOG("ERROR: Failed to write user data to %s", filename);
        return -1;
    }

    STORAGE_LOG("User %s saved successfully (%zu bytes)", user->user_id, sizeof(mesh_user_t));
    return 0;
}

int mesh_storage_load_user(mesh_user_t *user, const char *filename) {
    if (!user || !filename) {
        STORAGE_LOG("ERROR: load_user - invalid parameters");
        return -1;
    }

    STORAGE_LOG("Loading user from %s", filename);

    FILE *f = fopen(filename, "rb");
    if (!f) {
        STORAGE_LOG("ERROR: Failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    size_t read = fread(user, sizeof(mesh_user_t), 1, f);
    fclose(f);

    if (read != 1) {
        STORAGE_LOG("ERROR: Failed to read user data from %s", filename);
        memset(user, 0, sizeof(mesh_user_t));
        return -1;
    }

    STORAGE_LOG("User %s loaded successfully (%zu bytes)", user->user_id, sizeof(mesh_user_t));
    return 0;
}

int mesh_storage_save_user_default(mesh_user_t *user) {
    if (!user) {
        STORAGE_LOG("ERROR: save_user_default - invalid user");
        return -1;
    }

    STORAGE_LOG("Saving user %s to default location", user->user_id);

    char path[1024];
    if (mesh_storage_get_key_path(user->user_id, path, sizeof(path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get key path for %s", user->user_id);
        return -1;
    }

    // Сохраняем текущего пользователя
    if (mesh_storage_save_user(user, path) < 0) {
        STORAGE_LOG("ERROR: Failed to save user %s", user->user_id);
        return -1;
    }

    // Создаем резервную копию
    mesh_storage_backup_user(user->user_id);

    STORAGE_LOG("User %s saved to default location", user->user_id);
    return 0;
}

int mesh_storage_load_user_default(const char *user_id, mesh_user_t *user) {
    if (!user_id || !user) {
        STORAGE_LOG("ERROR: load_user_default - invalid parameters");
        return -1;
    }

    STORAGE_LOG("Loading user %s from default location", user_id);

    char path[1024];
    if (mesh_storage_get_key_path(user_id, path, sizeof(path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get key path for %s", user_id);
        return -1;
    }

    // Пытаемся загрузить
    if (mesh_storage_load_user(user, path) == 0) {
        STORAGE_LOG("User %s loaded from default location", user_id);
        return 0;
    }

    // Если не удалось, пробуем восстановить из бэкапа
    STORAGE_LOG("Failed to load user %s from default, trying backup...", user_id);
    return mesh_storage_restore_user(user_id, user);
}

int mesh_storage_delete_user(const char *user_id) {
    if (!user_id) {
        STORAGE_LOG("ERROR: delete_user - invalid user_id");
        return -1;
    }

    STORAGE_LOG("Deleting user %s", user_id);

    char path[1024];
    if (mesh_storage_get_key_path(user_id, path, sizeof(path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get key path for %s", user_id);
        return -1;
    }

    // Проверяем существование файла
    struct stat st;
    if (stat(path, &st) != 0) {
        STORAGE_LOG("User %s file does not exist", user_id);
        return 0;
    }

    // Перезаписываем файл перед удалением (защита от восстановления)
    FILE *f = fopen(path, "wb");
    if (f) {
        unsigned char zeros[4096] = {0};
        for (int i = 0; i < 10; i++) {
            fwrite(zeros, 1, sizeof(zeros), f);
        }
        fclose(f);
    }

    if (unlink(path) != 0) {
        STORAGE_LOG("ERROR: Failed to delete %s: %s", path, strerror(errno));
        return -1;
    }

    // Удаляем бэкап
    char backup_path[1024];
    if (mesh_storage_get_backup_path(user_id, backup_path, sizeof(backup_path)) == 0) {
        if (stat(backup_path, &st) == 0) {
            unlink(backup_path);
        }
    }

    STORAGE_LOG("User %s deleted", user_id);
    return 0;
}

int mesh_storage_user_exists(const char *user_id) {
    if (!user_id) {
        return 0;
    }

    char path[1024];
    if (mesh_storage_get_key_path(user_id, path, sizeof(path)) < 0) {
        return 0;
    }

    struct stat st;
    return stat(path, &st) == 0;
}

int mesh_storage_backup_user(const char *user_id) {
    if (!user_id) {
        STORAGE_LOG("ERROR: backup_user - invalid user_id");
        return -1;
    }

    STORAGE_LOG("Creating backup for user %s", user_id);

    if (ensure_backup_dir() < 0) {
        return -1;
    }

    char src_path[1024];
    char dst_path[1024];

    if (mesh_storage_get_key_path(user_id, src_path, sizeof(src_path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get source path for %s", user_id);
        return -1;
    }

    if (mesh_storage_get_backup_path(user_id, dst_path, sizeof(dst_path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get backup path for %s", user_id);
        return -1;
    }

    // Проверяем, существует ли исходный файл
    struct stat st;
    if (stat(src_path, &st) != 0) {
        STORAGE_LOG("No file to backup for user %s", user_id);
        return 0;
    }

    // Копируем файл
    FILE *src = fopen(src_path, "rb");
    if (!src) {
        STORAGE_LOG("ERROR: Failed to open source %s: %s", src_path, strerror(errno));
        return -1;
    }

    FILE *dst = fopen(dst_path, "wb");
    if (!dst) {
        STORAGE_LOG("ERROR: Failed to open destination %s: %s", dst_path, strerror(errno));
        fclose(src);
        return -1;
    }

    // Устанавливаем права
    chmod(dst_path, MESH_KEY_FILE_PERM);

    // Копируем данные
    unsigned char buffer[4096];
    size_t bytes;
    while ((bytes = fread(buffer, 1, sizeof(buffer), src)) > 0) {
        if (fwrite(buffer, 1, bytes, dst) != bytes) {
            STORAGE_LOG("ERROR: Failed to write backup data");
            fclose(src);
            fclose(dst);
            return -1;
        }
    }

    fclose(src);
    fclose(dst);

    STORAGE_LOG("Backup created for user %s at %s (size: %ld bytes)",
                user_id, dst_path, (long)st.st_size);
    return 0;
}

int mesh_storage_restore_user(const char *user_id, mesh_user_t *user) {
    if (!user_id || !user) {
        STORAGE_LOG("ERROR: restore_user - invalid parameters");
        return -1;
    }

    STORAGE_LOG("Restoring user %s from backup", user_id);

    char backup_path[1024];
    if (mesh_storage_get_backup_path(user_id, backup_path, sizeof(backup_path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get backup path for %s", user_id);
        return -1;
    }

    // Проверяем существование бэкапа
    struct stat st;
    if (stat(backup_path, &st) != 0) {
        STORAGE_LOG("No backup found for user %s", user_id);
        return -1;
    }

    // Загружаем из бэкапа
    if (mesh_storage_load_user(user, backup_path) < 0) {
        STORAGE_LOG("ERROR: Failed to restore user %s from backup", user_id);
        return -1;
    }

    // Восстанавливаем основной файл
    char main_path[1024];
    if (mesh_storage_get_key_path(user_id, main_path, sizeof(main_path)) < 0) {
        STORAGE_LOG("ERROR: Failed to get main path for %s", user_id);
        return -1;
    }

    if (mesh_storage_save_user(user, main_path) < 0) {
        STORAGE_LOG("ERROR: Failed to restore main file for user %s", user_id);
        return -1;
    }

    STORAGE_LOG("User %s restored from backup successfully", user_id);
    return 0;
}

// ============================================================================
// Дополнительные утилиты
// ============================================================================

int mesh_storage_list_users(char user_ids[][64], int max_count) {
    if (!user_ids || max_count <= 0) {
        return -1;
    }

    if (ensure_storage_dir() < 0) {
        return -1;
    }

    const char *home = getenv("HOME");
    if (!home) {
        return -1;
    }

    char path[1024];
    snprintf(path, sizeof(path), "%s/%s", home, MESH_STORAGE_DIR);

    DIR *dir = opendir(path);
    if (!dir) {
        STORAGE_LOG("ERROR: Failed to open directory %s: %s", path, strerror(errno));
        return -1;
    }

    struct dirent *entry;
    int count = 0;

    while ((entry = readdir(dir)) != NULL && count < max_count) {
        // Проверяем, что это файл
        if (entry->d_type != DT_REG) {
            continue;
        }

        // Проверяем расширение
        char *ext = strstr(entry->d_name, MESH_KEY_FILE_EXT);
        if (ext && ext == entry->d_name + strlen(entry->d_name) - strlen(MESH_KEY_FILE_EXT)) {
            // Извлекаем имя пользователя
            size_t len = ext - entry->d_name;
            if (len > 0 && len < 63) {
                snprintf(user_ids[count], 64, "@%.*s", (int)len, entry->d_name);
                count++;
            }
        }
    }

    closedir(dir);
    return count;
}

/**
 * Получить размер файла ключей пользователя
 */
size_t mesh_storage_get_user_size(const char *user_id) {
    if (!user_id) {
        return 0;
    }

    char path[1024];
    if (mesh_storage_get_key_path(user_id, path, sizeof(path)) < 0) {
        return 0;
    }

    struct stat st;
    if (stat(path, &st) != 0) {
        return 0;
    }

    return (size_t)st.st_size;
}

/**
 * Проверить целостность файла ключей
 */
int mesh_storage_verify_user(const char *user_id) {
    if (!user_id) {
        return 0;
    }

    char path[1024];
    if (mesh_storage_get_key_path(user_id, path, sizeof(path)) < 0) {
        return 0;
    }

    struct stat st;
    if (stat(path, &st) != 0) {
        return 0;
    }

    // Проверяем, что файл имеет разумный размер
    if (st.st_size != sizeof(mesh_user_t)) {
        STORAGE_LOG("WARNING: User %s file size mismatch: %ld vs %zu",
                    user_id, (long)st.st_size, sizeof(mesh_user_t));
        return 0;
    }

    return 1;
}