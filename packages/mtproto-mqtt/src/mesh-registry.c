/*
    Mesh Registry - Реализация реестра пользователей
*/

#include "mesh-registry.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <errno.h>

// ============================================================================
// Глобальный реестр
// ============================================================================

static mesh_user_registry_t g_registry = {
    .entries = NULL,
    .count = 0,
    .capacity = 0,
    .max_users = MESH_REGISTRY_DEFAULT_MAX,
    .initialized = 0
};

// ============================================================================
// Отладочное логирование
// ============================================================================

#define REGISTRY_LOG(fmt, ...) \
    do { \
        fprintf(stderr, "[REGISTRY] " fmt "\n", ##__VA_ARGS__); \
        fflush(stderr); \
    } while(0)

// ============================================================================
// Инициализация и очистка
// ============================================================================

int mesh_registry_init(int max_users) {
    if (g_registry.initialized) {
        REGISTRY_LOG("Already initialized");
        return 0;
    }

    REGISTRY_LOG("Initializing registry (max_users: %d)...", max_users);

    pthread_rwlock_init(&g_registry.lock, NULL);

    if (max_users <= 0) {
        max_users = MESH_REGISTRY_DEFAULT_MAX;
    }
    if (max_users > MESH_REGISTRY_MAX) {
        max_users = MESH_REGISTRY_MAX;
    }

    g_registry.max_users = max_users;
    g_registry.capacity = max_users < 64 ? max_users : 64;
    g_registry.entries = calloc(g_registry.capacity, sizeof(mesh_registry_entry_t));
    if (!g_registry.entries) {
        REGISTRY_LOG("ERROR: Failed to allocate registry entries");
        pthread_rwlock_destroy(&g_registry.lock);
        return -1;
    }
    g_registry.count = 0;
    g_registry.initialized = 1;

    REGISTRY_LOG("Registry initialized (capacity: %d, max: %d)",
                 g_registry.capacity, g_registry.max_users);
    return 0;
}

int mesh_registry_ensure_initialized(void) {
    if (g_registry.initialized) {
        return 0;
    }
    return mesh_registry_init(MESH_REGISTRY_DEFAULT_MAX);
}

void mesh_registry_cleanup(void) {
    if (!g_registry.initialized) {
        return;
    }

    REGISTRY_LOG("Cleaning up registry...");

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (g_registry.entries[i].user) {
            mesh_user_free_hybrid(g_registry.entries[i].user);
            free(g_registry.entries[i].user);
            g_registry.entries[i].user = NULL;
        }
    }

    free(g_registry.entries);
    g_registry.entries = NULL;
    g_registry.count = 0;
    g_registry.capacity = 0;
    g_registry.max_users = 0;

    pthread_rwlock_unlock(&g_registry.lock);
    pthread_rwlock_destroy(&g_registry.lock);

    g_registry.initialized = 0;

    REGISTRY_LOG("Registry cleaned up");
}

// ============================================================================
// Вспомогательные функции
// ============================================================================

static int registry_expand(void) {
    int new_capacity = g_registry.capacity * 2;
    if (new_capacity > g_registry.max_users) {
        new_capacity = g_registry.max_users;
    }
    if (new_capacity <= g_registry.capacity) {
        REGISTRY_LOG("ERROR: Cannot expand registry beyond max_users (%d)",
                     g_registry.max_users);
        return -1;
    }

    mesh_registry_entry_t *new_entries = realloc(g_registry.entries,
                                                  new_capacity * sizeof(mesh_registry_entry_t));
    if (!new_entries) {
        REGISTRY_LOG("ERROR: Failed to expand registry to %d", new_capacity);
        return -1;
    }

    g_registry.entries = new_entries;
    g_registry.capacity = new_capacity;
    REGISTRY_LOG("Registry expanded to %d", g_registry.capacity);
    return 0;
}

// ============================================================================
// Управление пользователями
// ============================================================================

int mesh_registry_add_user(mesh_user_t *user) {
    if (!user || !user->user_id[0]) {
        REGISTRY_LOG("ERROR: Invalid user");
        return -1;
    }

    if (!g_registry.initialized) {
        REGISTRY_LOG("ERROR: Registry not initialized");
        return -1;
    }

    pthread_rwlock_wrlock(&g_registry.lock);

    // Проверяем, не существует ли уже
    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user->user_id) == 0) {
            REGISTRY_LOG("User %s already exists", user->user_id);
            pthread_rwlock_unlock(&g_registry.lock);
            return -2;
        }
    }

    // Проверяем лимит
    if (g_registry.count >= g_registry.max_users) {
        REGISTRY_LOG("ERROR: Registry is full (max: %d)", g_registry.max_users);
        pthread_rwlock_unlock(&g_registry.lock);
        return -3;
    }

    // Расширяем если нужно
    if (g_registry.count >= g_registry.capacity) {
        if (registry_expand() < 0) {
            pthread_rwlock_unlock(&g_registry.lock);
            return -4;
        }
    }

    // Добавляем пользователя
    mesh_registry_entry_t *entry = &g_registry.entries[g_registry.count++];
    snprintf(entry->user_id, sizeof(entry->user_id), "%s", user->user_id);
    entry->user = user;
    entry->registered_at = time(NULL);
    entry->last_active = time(NULL);
    entry->is_online = user->is_online;
    entry->is_valid = 1;

    pthread_rwlock_unlock(&g_registry.lock);

    REGISTRY_LOG("User %s added to registry (total: %d/%d)",
                 user->user_id, g_registry.count, g_registry.max_users);
    return 0;
}

mesh_user_t* mesh_registry_get_user(const char *user_id) {
    if (!user_id || !g_registry.initialized) {
        return NULL;
    }

    pthread_rwlock_rdlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0 &&
            g_registry.entries[i].is_valid) {
            mesh_user_t *user = g_registry.entries[i].user;
            pthread_rwlock_unlock(&g_registry.lock);
            return user;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return NULL;
}

mesh_user_t* mesh_registry_get_user_locked(const char *user_id) {
    if (!user_id || !g_registry.initialized) {
        return NULL;
    }

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0 &&
            g_registry.entries[i].is_valid) {
            return g_registry.entries[i].user;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return NULL;
}

int mesh_registry_remove_user(const char *user_id) {
    if (!user_id || !g_registry.initialized) {
        return -1;
    }

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0) {
            if (g_registry.entries[i].user) {
                mesh_user_free_hybrid(g_registry.entries[i].user);
                free(g_registry.entries[i].user);
            }

            // Сдвигаем остальные записи
            for (int j = i; j < g_registry.count - 1; j++) {
                g_registry.entries[j] = g_registry.entries[j + 1];
            }
            g_registry.count--;

            pthread_rwlock_unlock(&g_registry.lock);
            REGISTRY_LOG("User %s removed from registry", user_id);
            return 0;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    REGISTRY_LOG("User %s not found", user_id);
    return -1;
}

int mesh_registry_update_activity(const char *user_id) {
    if (!user_id || !g_registry.initialized) {
        return -1;
    }

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0 &&
            g_registry.entries[i].is_valid) {
            g_registry.entries[i].last_active = time(NULL);
            pthread_rwlock_unlock(&g_registry.lock);
            return 0;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return -1;
}

int mesh_registry_set_online(const char *user_id, int is_online) {
    if (!user_id || !g_registry.initialized) {
        return -1;
    }

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0 &&
            g_registry.entries[i].is_valid) {
            g_registry.entries[i].is_online = is_online ? 1 : 0;
            if (g_registry.entries[i].user) {
                g_registry.entries[i].user->is_online = is_online ? 1 : 0;
            }
            pthread_rwlock_unlock(&g_registry.lock);
            return 0;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return -1;
}

int mesh_registry_count(void) {
    if (!g_registry.initialized) {
        return 0;
    }

    pthread_rwlock_rdlock(&g_registry.lock);
    int count = g_registry.count;
    pthread_rwlock_unlock(&g_registry.lock);
    return count;
}

int mesh_registry_exists(const char *user_id) {
    if (!user_id || !g_registry.initialized) {
        return 0;
    }

    pthread_rwlock_rdlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (strcmp(g_registry.entries[i].user_id, user_id) == 0 &&
            g_registry.entries[i].is_valid) {
            pthread_rwlock_unlock(&g_registry.lock);
            return 1;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return 0;
}

int mesh_registry_get_all_users(char user_ids[][64], int max_count) {
    if (!user_ids || max_count <= 0 || !g_registry.initialized) {
        return 0;
    }

    pthread_rwlock_rdlock(&g_registry.lock);

    int count = 0;
    for (int i = 0; i < g_registry.count && count < max_count; i++) {
        if (g_registry.entries[i].is_valid) {
            snprintf(user_ids[count], 64, "%s", g_registry.entries[i].user_id);
            count++;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);
    return count;
}

int mesh_registry_cleanup_inactive(int max_age_seconds) {
    if (!g_registry.initialized || max_age_seconds <= 0) {
        return 0;
    }

    time_t now = time(NULL);
    int removed = 0;

    pthread_rwlock_wrlock(&g_registry.lock);

    for (int i = 0; i < g_registry.count; i++) {
        if (g_registry.entries[i].is_valid &&
            now - g_registry.entries[i].last_active > max_age_seconds) {

            REGISTRY_LOG("Removing inactive user: %s (last active: %ld seconds ago)",
                        g_registry.entries[i].user_id,
                        now - g_registry.entries[i].last_active);

            if (g_registry.entries[i].user) {
                mesh_user_free_hybrid(g_registry.entries[i].user);
                free(g_registry.entries[i].user);
            }

            // Сдвигаем
            for (int j = i; j < g_registry.count - 1; j++) {
                g_registry.entries[j] = g_registry.entries[j + 1];
            }
            g_registry.count--;
            i--;
            removed++;
        }
    }

    pthread_rwlock_unlock(&g_registry.lock);

    if (removed > 0) {
        REGISTRY_LOG("Removed %d inactive users", removed);
    }

    return removed;
}