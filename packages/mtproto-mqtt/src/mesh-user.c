/*
    Mesh User - Реализация
    Гибридная криптография с квантовой защитой
    С подробным логированием для отладки
*/

#include "mesh-user.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>

// ============================================================================
// Отладочное логирование
// ============================================================================

#define USER_DEBUG 1

#define USER_LOG(fmt, ...) \
    do { if (USER_DEBUG) { \
        fprintf(stderr, "[USER] " fmt "\n", ##__VA_ARGS__); \
        fflush(stderr); \
    } } while(0)

#define USER_HEX(label, data, len) \
    do { if (USER_DEBUG) { \
        fprintf(stderr, "[USER] %s: ", label); \
        for (int i = 0; i < (len) && i < 32; i++) { \
            fprintf(stderr, "%02x", ((unsigned char*)(data))[i]); \
        } \
        if ((len) > 32) fprintf(stderr, "..."); \
        fprintf(stderr, " (%d bytes)\n", (len)); \
        fflush(stderr); \
    } } while(0)

// ============================================================================
// Кэш публичных ключей
// ============================================================================

#define MESH_CACHE_SIZE 64

static mesh_hybrid_cache_t g_cache[MESH_CACHE_SIZE];
static int g_cache_count = 0;

// ============================================================================
// Кэш публичных ключей
// ============================================================================

int mesh_user_cache_add_hybrid(const char *user_id,
                               const mesh_hybrid_keypair_t *keypair) {
    if (!user_id || !keypair) {
        USER_LOG("cache_add: invalid parameters");
        return -1;
    }

    USER_LOG("cache_add: user_id=%s", user_id);
    USER_LOG("cache_add: keypair at %p", (const void*)keypair);

    // Проверяем существующую запись
    for (int i = 0; i < g_cache_count; i++) {
        if (strcmp(g_cache[i].user_id, user_id) == 0) {
            USER_LOG("cache_add: updating existing entry for %s", user_id);
            // Безопасно копируем
            memcpy(&g_cache[i].keypair, keypair, sizeof(mesh_hybrid_keypair_t));
            g_cache[i].cached_at = time(NULL);
            g_cache[i].is_valid = 1;
            USER_LOG("cache_add: updated, classic_initialized=%d",
                     g_cache[i].keypair.classic_initialized);
            return 0;
        }
    }

    if (g_cache_count >= MESH_CACHE_SIZE) {
        USER_LOG("cache_add: cache full!");
        return -1;
    }

    USER_LOG("cache_add: adding new entry for %s (index %d)", user_id, g_cache_count);

    // Копируем строку безопасно
    snprintf(g_cache[g_cache_count].user_id,
             sizeof(g_cache[g_cache_count].user_id), "%s", user_id);

    // Копируем ключ
    memcpy(&g_cache[g_cache_count].keypair, keypair, sizeof(mesh_hybrid_keypair_t));
    g_cache[g_cache_count].cached_at = time(NULL);
    g_cache[g_cache_count].is_valid = 1;
    g_cache_count++;

    USER_LOG("cache_add: added new entry for %s (total: %d)", user_id, g_cache_count);
    USER_LOG("cache_add: classic_initialized=%d",
             g_cache[g_cache_count-1].keypair.classic_initialized);
    return 0;
}

int mesh_user_cache_get_hybrid(const char *user_id, mesh_hybrid_keypair_t *keypair) {
    if (!user_id || !keypair) {
        USER_LOG("cache_get: invalid parameters");
        return -1;
    }

    USER_LOG("cache_get: user_id=%s", user_id);

    for (int i = 0; i < g_cache_count; i++) {
        if (strcmp(g_cache[i].user_id, user_id) == 0 && g_cache[i].is_valid) {
            memcpy(keypair, &g_cache[i].keypair, sizeof(mesh_hybrid_keypair_t));
            USER_LOG("cache_get: found %s in cache", user_id);
            USER_LOG("  classic_initialized=%d", keypair->classic_initialized);
            USER_LOG("  pq_initialized=%d", keypair->pq_initialized);
            return 0;
        }
    }

    USER_LOG("cache_get: %s not found in cache", user_id);
    return -1;
}

void mesh_user_cache_clear_hybrid(void) {
    USER_LOG("cache_clear: clearing cache");
    memset(g_cache, 0, sizeof(g_cache));
    g_cache_count = 0;
}

// ============================================================================
// Управление пользователями
// ============================================================================

int mesh_user_create_hybrid(mesh_user_t *user,
                            const char *user_id,
                            const char *display_name,
                            const char *secret_phrase) {
    if (!user || !user_id || !secret_phrase) {
        USER_LOG("create: invalid parameters");
        return -1;
    }

    USER_LOG("create: user_id=%s, display_name=%s", user_id, display_name ? display_name : "NULL");

    mesh_hybrid_init();

    // Очищаем структуру
    memset(user, 0, sizeof(mesh_user_t));

    // Копируем ID и имя
    snprintf(user->user_id, sizeof(user->user_id), "%s", user_id);
    snprintf(user->display_name, sizeof(user->display_name), "%s",
             display_name ? display_name : user_id);
    snprintf(user->secret_phrase, sizeof(user->secret_phrase), "%s", secret_phrase);

    USER_LOG("create: generating keypair for %s", user_id);

    // Генерируем гибридные ключи
    if (mesh_hybrid_generate_keypair(&user->keypair, user_id, secret_phrase) < 0) {
        USER_LOG("create: failed to generate keypair");
        return -1;
    }

    // Убеждаемся, что классический флаг установлен
    if (user->keypair.classic_initialized != 1) {
        USER_LOG("create: WARNING: classic_initialized is %d, forcing to 1",
                 user->keypair.classic_initialized);
        user->keypair.classic_initialized = 1;
    }

    // Формируем топики
    snprintf(user->inbox_topic, sizeof(user->inbox_topic),
             "mesh/users/%s/inbox", user_id);
    snprintf(user->public_topic, sizeof(user->public_topic),
             "mesh/users/%s/public", user_id);
    snprintf(user->pq_public_topic, sizeof(user->pq_public_topic),
             "mesh/users/%s/pq-public", user_id);

    // Инициализируем состояние
    user->created_at = time(NULL);
    user->last_active = time(NULL);
    user->is_online = 0;
    user->is_trusted = 1;
    user->is_pq_enabled = user->keypair.pq_initialized ? 1 : 0;

    USER_LOG("create: successfully created user %s (PQ: %s, classic: %s)",
             user_id,
             user->is_pq_enabled ? "YES" : "NO",
             user->keypair.classic_initialized ? "YES" : "NO");
    return 0;
}

int mesh_user_load_hybrid(mesh_user_t *user, const char *filename) {
    if (!user || !filename) return -1;

    USER_LOG("load: loading from %s", filename);

    FILE *f = fopen(filename, "rb");
    if (!f) {
        USER_LOG("load: failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    size_t read = fread(user, sizeof(mesh_user_t), 1, f);
    fclose(f);

    if (read != 1) {
        USER_LOG("load: failed to read user data");
        memset(user, 0, sizeof(mesh_user_t));
        return -1;
    }

    USER_LOG("load: successfully loaded user %s", user->user_id);
    return 0;
}

int mesh_user_save_hybrid(const mesh_user_t *user, const char *filename) {
    if (!user || !filename) return -1;

    USER_LOG("save: saving to %s", filename);

    FILE *f = fopen(filename, "wb");
    if (!f) {
        USER_LOG("save: failed to open %s: %s", filename, strerror(errno));
        return -1;
    }

    size_t written = fwrite(user, sizeof(mesh_user_t), 1, f);
    fclose(f);

    if (written != 1) {
        USER_LOG("save: failed to write user data");
        return -1;
    }

    USER_LOG("save: successfully saved user %s", user->user_id);
    return 0;
}

void mesh_user_free_hybrid(mesh_user_t *user) {
    if (!user) return;

    USER_LOG("free: freeing user %s", user->user_id);

    // Очищаем чувствительные данные
    memset(user->secret_phrase, 0, sizeof(user->secret_phrase));
    mesh_hybrid_free_keypair(&user->keypair);

    // Сбрасываем состояние
    memset(user, 0, sizeof(mesh_user_t));
}

// ============================================================================
// Работа с ID и ключами
// ============================================================================

int mesh_user_get_hybrid_keypair(const char *user_id, mesh_hybrid_keypair_t *keypair) {
    USER_LOG("get_keypair: START");
    USER_LOG("  user_id=%s", user_id ? user_id : "NULL");
    USER_LOG("  keypair=%p", (void*)keypair);

    if (!user_id || !keypair) {
        USER_LOG("get_keypair: invalid parameters");
        return -1;
    }

    // Проверяем кэш
    USER_LOG("get_keypair: checking cache...");
    if (mesh_user_cache_get_hybrid(user_id, keypair) == 0) {
        USER_LOG("get_keypair: found in cache");
        USER_LOG("  classic_initialized=%d", keypair->classic_initialized);
        USER_LOG("  pq_initialized=%d", keypair->pq_initialized);
        USER_LOG("get_keypair: RETURN from cache");
        return 0;
    }

    USER_LOG("get_keypair: not in cache, generating new keys");

    // ============================================================
    // ВСЕ НА HEAP!
    // ============================================================
    // Временный ключ на HEAP
    mesh_hybrid_keypair_t *temp = calloc(1, sizeof(mesh_hybrid_keypair_t));
    if (!temp) {
        USER_LOG("get_keypair: failed to allocate temp keypair");
        return -1;
    }
    USER_LOG("get_keypair: temp allocated at %p", (void*)temp);

    // Генерируем классические ключи из ID
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)user_id, strlen(user_id), hash);
    memcpy(temp->classic_public_key, hash, 32);
    temp->classic_public_key[0] &= 0xF8;
    temp->classic_public_key[31] &= 0x7F;
    temp->classic_public_key[31] |= 0x40;
    temp->classic_initialized = 1;

    USER_HEX("  classic_public", temp->classic_public_key, 32);

    // Получаем состояние криптографии
    mesh_crypto_state_t *state = mesh_get_crypto_state();

    // Генерируем PQ ключи
    USER_LOG("get_keypair: generating PQ keys...");
    if (state && state->kem) {
        if (OQS_KEM_keypair(state->kem,
                           temp->pq_public_key,
                           temp->pq_secret_key) == OQS_SUCCESS) {
            temp->pq_initialized = 1;
            USER_LOG("get_keypair: PQ keys generated successfully");
            USER_HEX("  pq_public", temp->pq_public_key, 16);
        } else {
            USER_LOG("get_keypair: PQ key generation FAILED");
            temp->pq_initialized = 0;
        }
    } else {
        USER_LOG("get_keypair: PQ not available");
        temp->pq_initialized = 0;
    }

    // Генерируем ключи подписи
    USER_LOG("get_keypair: generating SIG keys...");
    if (state && state->sig) {
        if (OQS_SIG_keypair(state->sig,
                           temp->sig_public_key,
                           temp->sig_secret_key) == OQS_SUCCESS) {
            temp->sig_initialized = 1;
            USER_LOG("get_keypair: SIG keys generated successfully");
        } else {
            USER_LOG("get_keypair: SIG key generation FAILED");
            temp->sig_initialized = 0;
        }
    } else {
        USER_LOG("get_keypair: SIG not available");
        temp->sig_initialized = 0;
    }

    // Копируем результат в выходной буфер
    USER_LOG("get_keypair: copying result to output buffer");
    memcpy(keypair, temp, sizeof(mesh_hybrid_keypair_t));

    // Добавляем в кэш
    USER_LOG("get_keypair: adding to cache...");
    mesh_user_cache_add_hybrid(user_id, temp);

    // Очищаем временный ключ
    USER_LOG("get_keypair: freeing temp at %p", (void*)temp);
    free(temp);

    USER_LOG("get_keypair: done (classic: %s, PQ: %s, SIG: %s)",
             keypair->classic_initialized ? "YES" : "NO",
             keypair->pq_initialized ? "YES" : "NO",
             keypair->sig_initialized ? "YES" : "NO");
    USER_LOG("get_keypair: RETURN");
    return 0;
}

int mesh_user_get_inbox_topic(const char *user_id, char *topic, size_t topic_size) {
    if (!user_id || !topic || topic_size < 16) return -1;
    snprintf(topic, topic_size, "mesh/users/%s/inbox", user_id);
    return 0;
}

int mesh_user_get_public_topic(const char *user_id, char *topic, size_t topic_size) {
    if (!user_id || !topic || topic_size < 16) return -1;
    snprintf(topic, topic_size, "mesh/users/%s/public", user_id);
    return 0;
}

int mesh_user_get_pq_public_topic(const char *user_id, char *topic, size_t topic_size) {
    if (!user_id || !topic || topic_size < 16) return -1;
    snprintf(topic, topic_size, "mesh/users/%s/pq-public", user_id);
    return 0;
}

// ============================================================================
// Валидация пользователя
// ============================================================================

bool mesh_user_valid_hybrid(const mesh_user_t *user) {
    if (!user) {
        USER_LOG("valid: user is NULL");
        return false;
    }
    if (user->user_id[0] == '\0') {
        USER_LOG("valid: user_id is empty");
        return false;
    }
    if (user->user_id[0] != '@') {
        USER_LOG("valid: user_id doesn't start with @: %s", user->user_id);
        return false;
    }
    if (strlen(user->user_id) < 2) {
        USER_LOG("valid: user_id too short: %s", user->user_id);
        return false;
    }
    if (user->secret_phrase[0] == '\0') {
        USER_LOG("valid: secret_phrase is empty");
        return false;
    }

    // Проверяем, что публичный ключ не нулевой
    int is_classic_valid = 0;
    for (int i = 0; i < 32; i++) {
        if (user->keypair.classic_public_key[i] != 0) {
            is_classic_valid = 1;
            break;
        }
    }

    if (!is_classic_valid) {
        USER_LOG("valid: classic_public_key is all zeros");
        return false;
    }

    USER_LOG("valid: user is valid (classic: %s, pq: %s)",
             is_classic_valid ? "YES" : "NO",
             user->keypair.pq_initialized ? "YES" : "NO");
    return true;
}

// ============================================================================
// Отправка и получение сообщений
// ============================================================================

int mesh_user_send_hybrid(mesh_user_t *sender,
                          const char *receiver_id,
                          const unsigned char *message,
                          size_t message_len,
                          unsigned char *packet,
                          size_t *packet_len) {
    USER_LOG("========================================");
    USER_LOG("send_hybrid: START");
    USER_LOG("  sender_id=%s", sender ? sender->user_id : "NULL");
    USER_LOG("  receiver_id=%s", receiver_id ? receiver_id : "NULL");
    USER_LOG("  message_len=%zu", message_len);
    USER_LOG("  packet buffer size=%zu", packet ? *packet_len : 0);
    USER_LOG("  sizeof(mesh_hybrid_keypair_t)=%zu", sizeof(mesh_hybrid_keypair_t));
    USER_LOG("  sizeof(mesh_hybrid_session_t)=%zu", sizeof(mesh_hybrid_session_t));
    USER_LOG("  sizeof(mesh_hybrid_packet_t)=%zu", sizeof(mesh_hybrid_packet_t));

    if (!sender || !receiver_id || !message || !packet || !packet_len) {
        USER_LOG("send_hybrid: invalid parameters");
        return -1;
    }

    if (*packet_len < 4096) {
        USER_LOG("send_hybrid: packet buffer too small! %zu < 4096", *packet_len);
        return -1;
    }

    USER_LOG("send_hybrid: checking if sender is valid...");
    USER_LOG("  sender->user_id=%s", sender->user_id);
    USER_LOG("  sender->keypair.classic_initialized=%d", sender->keypair.classic_initialized);
    USER_LOG("  sender->keypair.pq_initialized=%d", sender->keypair.pq_initialized);

    if (!mesh_user_valid_hybrid(sender)) {
        USER_LOG("send_hybrid: sender is not valid!");
        USER_LOG("  classic_initialized=%d", sender->keypair.classic_initialized);
        USER_LOG("  pq_initialized=%d", sender->keypair.pq_initialized);
        USER_HEX("  classic_public", sender->keypair.classic_public_key, 32);
        return -1;
    }
    USER_LOG("send_hybrid: sender is valid");

    // ============================================================
    // ВЫДЕЛЯЕМ НА HEAP
    // ============================================================
    USER_LOG("send_hybrid: allocating receiver_pk on heap (%zu bytes)...", sizeof(mesh_hybrid_keypair_t));
    mesh_hybrid_keypair_t *receiver_pk = calloc(1, sizeof(mesh_hybrid_keypair_t));
    if (!receiver_pk) {
        USER_LOG("send_hybrid: failed to allocate receiver_pk");
        return -1;
    }
    USER_LOG("send_hybrid: receiver_pk allocated at %p", (void*)receiver_pk);

    USER_LOG("send_hybrid: getting receiver keypair for %s", receiver_id);

    int get_result = mesh_user_get_hybrid_keypair(receiver_id, receiver_pk);
    USER_LOG("send_hybrid: mesh_user_get_hybrid_keypair result=%d", get_result);
    USER_LOG("send_hybrid: receiver_pk->classic_initialized=%d", receiver_pk->classic_initialized);
    USER_LOG("send_hybrid: receiver_pk->pq_initialized=%d", receiver_pk->pq_initialized);

    if (get_result < 0) {
        USER_LOG("send_hybrid: failed to get receiver keypair");
        free(receiver_pk);
        return -1;
    }
    USER_LOG("send_hybrid: receiver keypair obtained (PQ: %s)",
             receiver_pk->pq_initialized ? "YES" : "NO");

    USER_HEX("  receiver classic_pk", receiver_pk->classic_public_key, 32);

    // ============================================================
    // СЕССИЯ НА HEAP
    // ============================================================
    USER_LOG("send_hybrid: allocating session on heap (%zu bytes)...", sizeof(mesh_hybrid_session_t));
    mesh_hybrid_session_t *session = calloc(1, sizeof(mesh_hybrid_session_t));
    if (!session) {
        USER_LOG("send_hybrid: failed to allocate session");
        free(receiver_pk);
        return -1;
    }
    USER_LOG("send_hybrid: session allocated at %p", (void*)session);

    USER_LOG("send_hybrid: creating hybrid session...");
    int create_result = mesh_hybrid_create_session(receiver_pk, session);
    USER_LOG("send_hybrid: mesh_hybrid_create_session result=%d", create_result);
    USER_LOG("send_hybrid: session->initialized=%d", session->initialized);

    if (create_result < 0) {
        USER_LOG("send_hybrid: failed to create hybrid session");
        free(receiver_pk);
        free(session);
        return -1;
    }
    USER_LOG("send_hybrid: session created successfully");

    // Проверяем размер буфера
    size_t header_size = sizeof(mesh_hybrid_packet_t);
    size_t total_size = header_size + message_len + 64;
    USER_LOG("send_hybrid: message_len=%zu, header_size=%zu, total_size=%zu, buffer_size=%zu",
             message_len, header_size, total_size, *packet_len);

    if (*packet_len < total_size) {
        USER_LOG("send_hybrid: BUFFER TOO SMALL! Need %zu, have %zu",
                 total_size, *packet_len);
        *packet_len = total_size;
        free(receiver_pk);
        free(session);
        return -2;
    }

    // Обнуляем пакет
    USER_LOG("send_hybrid: zeroing packet buffer...");
    memset(packet, 0, *packet_len);
    USER_LOG("send_hybrid: packet zeroed");

    // Шифруем
    USER_LOG("send_hybrid: calling mesh_hybrid_encrypt...");
    USER_LOG("  session=%p", (void*)session);
    USER_LOG("  message=%p, message_len=%zu", (const void*)message, message_len);
    USER_LOG("  packet=%p, packet_len=%zu", (void*)packet, *packet_len);

    int encrypt_result = mesh_hybrid_encrypt(session, message, message_len, packet, packet_len);
    USER_LOG("send_hybrid: mesh_hybrid_encrypt result=%d", encrypt_result);

    if (encrypt_result < 0) {
        USER_LOG("send_hybrid: mesh_hybrid_encrypt FAILED with code %d", encrypt_result);
        free(receiver_pk);
        free(session);
        return -1;
    }
    USER_LOG("send_hybrid: encryption successful, packet_len=%zu", *packet_len);
    USER_LOG("send_hybrid: packet[0..15] hex: %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x",
             packet[0], packet[1], packet[2], packet[3], packet[4], packet[5], packet[6], packet[7],
             packet[8], packet[9], packet[10], packet[11], packet[12], packet[13], packet[14], packet[15]);

    // Подписываем (опционально)
    if (*packet_len >= sizeof(mesh_hybrid_packet_t)) {
        USER_LOG("send_hybrid: signing packet...");
        mesh_hybrid_packet_t *pkt = (mesh_hybrid_packet_t*)packet;
        size_t sig_len = sizeof(pkt->signature);
        USER_LOG("  sig_len=%zu", sig_len);

        int sign_result = mesh_hybrid_sign(&sender->keypair,
                                           packet, *packet_len - sig_len,
                                           pkt->signature, &sig_len);
        USER_LOG("  mesh_hybrid_sign result=%d", sign_result);

        if (sign_result == 0) {
            pkt->signature_len = (uint16_t)sig_len;
            USER_LOG("send_hybrid: packet signed, sig_len=%zu", sig_len);
        } else {
            USER_LOG("send_hybrid: signing failed (ignored)");
        }
    }

    // ============================================================
    // ОЧИСТКА ПАМЯТИ
    // ============================================================
    USER_LOG("send_hybrid: freeing receiver_pk at %p", (void*)receiver_pk);
    free(receiver_pk);
    USER_LOG("send_hybrid: freeing session at %p", (void*)session);
    free(session);

    USER_LOG("send_hybrid: SUCCESS");
    USER_LOG("========================================");
    return 0;
}

int mesh_user_receive_hybrid(mesh_user_t *user,
                             const unsigned char *packet,
                             size_t packet_len,
                             unsigned char *decrypted,
                             size_t *decrypted_len) {
    USER_LOG("========================================");
    USER_LOG("receive_hybrid: START");
    USER_LOG("  user_id=%s", user ? user->user_id : "NULL");
    USER_LOG("  packet_len=%zu", packet_len);
    USER_LOG("  decrypted buffer size=%zu", decrypted ? *decrypted_len : 0);

    if (!user || !packet || !decrypted || !decrypted_len) {
        USER_LOG("receive_hybrid: invalid parameters");
        return -1;
    }

    USER_LOG("receive_hybrid: checking if user is valid...");
    if (!mesh_user_valid_hybrid(user)) {
        USER_LOG("receive_hybrid: user is not valid!");
        return -1;
    }
    USER_LOG("receive_hybrid: user is valid");

    // Проверяем минимальный размер пакета
    if (packet_len < sizeof(mesh_hybrid_packet_t)) {
        USER_LOG("receive_hybrid: packet too small! Need %zu, have %zu",
                 sizeof(mesh_hybrid_packet_t), packet_len);
        return -1;
    }

    const mesh_hybrid_packet_t *pkt = (const mesh_hybrid_packet_t*)packet;
    USER_LOG("receive_hybrid: packet magic=0x%08X, version=%d, crypto_type=%d",
             pkt->magic, pkt->version, pkt->crypto_type);
    USER_LOG("receive_hybrid: pq_ciphertext_len=%d, payload_len=%d",
             pkt->pq_ciphertext_len, pkt->payload_len);

    // Расшифровываем
    USER_LOG("receive_hybrid: calling mesh_hybrid_decrypt_message...");
    int result = mesh_hybrid_decrypt_message(&user->keypair, packet, packet_len,
                                             decrypted, decrypted_len);

    if (result < 0) {
        USER_LOG("receive_hybrid: decryption FAILED with code %d", result);
        return -1;
    }

    USER_LOG("receive_hybrid: decryption successful, decrypted_len=%zu", *decrypted_len);
    if (*decrypted_len > 0) {
        USER_LOG("receive_hybrid: decrypted text: '%s'", decrypted);
    }

    USER_LOG("receive_hybrid: SUCCESS");
    USER_LOG("========================================");
    return 0;
}

// ============================================================================
// Отладка
// ============================================================================

void mesh_user_print_hybrid(const mesh_user_t *user) {
    if (!user) {
        printf("NULL user\n");
        return;
    }

    char time_str[64];

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║           HYBRID USER INFORMATION                        ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ ID:            %s                                       ║\n", user->user_id);
    printf("║ Name:          %s                                       ║\n", user->display_name);
    printf("║ PQ Enabled:    %s                                       ║\n", user->is_pq_enabled ? "✅ Yes" : "❌ No");
    printf("║ Classic Init:  %s                                       ║\n", user->keypair.classic_initialized ? "✅ Yes" : "❌ No");
    printf("║ Online:        %s                                       ║\n", user->is_online ? "Yes" : "No");
    printf("║ Trusted:       %s                                       ║\n", user->is_trusted ? "Yes" : "No");

    if (user->created_at) {
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&user->created_at));
        printf("║ Created:       %s                         ║\n", time_str);
    }

    if (user->last_active) {
        strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&user->last_active));
        printf("║ Last active:   %s                         ║\n", time_str);
    }

    printf("║ Inbox topic:   %s                   ║\n", user->inbox_topic);
    printf("║ Public topic:  %s                   ║\n", user->public_topic);
    printf("║ PQ Public:     %s                   ║\n", user->pq_public_topic);
    printf("║ Classic PK:    ");
    for (int i = 0; i < 8; i++) {
        printf("%02x", user->keypair.classic_public_key[i]);
    }
    printf("...\n");

    printf("║ PQ PK:         ");
    if (user->is_pq_enabled) {
        for (int i = 0; i < 8; i++) {
            printf("%02x", user->keypair.pq_public_key[i]);
        }
        printf("...\n");
    } else {
        printf("(not available)\n");
    }
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}