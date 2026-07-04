/*
    Mesh Crypto - Реализация
    Гибридная криптография: ECDH + ML-KEM
    С подробным логированием для отладки
    Все чувствительные буферы выделяются на HEAP
*/

#include "mesh-crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// ============================================================================
// Отладочное логирование
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
        for (int i = 0; i < (len) && i < 32; i++) { \
            fprintf(stderr, "%02x", ((unsigned char*)(data))[i]); \
        } \
        if ((len) > 32) fprintf(stderr, "..."); \
        fprintf(stderr, " (%zu bytes)\n", (size_t)(len)); \
        fflush(stderr); \
    } } while(0)

// ============================================================================
// Глобальное состояние
// ============================================================================

static mesh_crypto_state_t g_crypto_state = {
    .kem = NULL,
    .sig = NULL,
    .initialized = 0,
    .version = "",
    .debug_enabled = 1
};

// ============================================================================
// Доступ к состоянию
// ============================================================================

mesh_crypto_state_t* mesh_get_crypto_state(void) {
    return &g_crypto_state;
}

int mesh_is_hybrid_initialized(void) {
    return g_crypto_state.initialized;
}

void mesh_crypto_set_debug(int enable) {
    g_crypto_state.debug_enabled = enable ? 1 : 0;
}

// ============================================================================
// Инициализация и очистка
// ============================================================================

int mesh_hybrid_init(void) {
    CRYPTO_LOG("=== mesh_hybrid_init ===");

    if (g_crypto_state.initialized) {
        CRYPTO_LOG("  Already initialized");
        return 0;
    }

    CRYPTO_LOG("  Initializing OpenSSL...");
    OpenSSL_add_all_algorithms();
    RAND_poll();

    // Инициализация KEM (ML-KEM-768)
    CRYPTO_LOG("  Checking ML-KEM-768...");
    if (OQS_KEM_alg_is_enabled(OQS_KEM_alg_ml_kem_768)) {
        CRYPTO_LOG("  ML-KEM-768 is enabled, creating KEM...");
        g_crypto_state.kem = OQS_KEM_new(OQS_KEM_alg_ml_kem_768);
        if (g_crypto_state.kem) {
            fprintf(stderr, "✅ ML-KEM-768 initialized\n");
            fprintf(stderr, "   PK: %zu, SK: %zu, CT: %zu, SS: %zu\n",
                    g_crypto_state.kem->length_public_key,
                    g_crypto_state.kem->length_secret_key,
                    g_crypto_state.kem->length_ciphertext,
                    g_crypto_state.kem->length_shared_secret);
            CRYPTO_LOG("  ML-KEM-768 created successfully");
        } else {
            CRYPTO_LOG("  ERROR: Failed to create ML-KEM-768");
        }
    } else {
        CRYPTO_LOG("  ML-KEM-768 is NOT enabled");
    }

    // Инициализация SIG (ML-DSA-65)
    CRYPTO_LOG("  Checking ML-DSA-65...");
    if (OQS_SIG_alg_is_enabled(OQS_SIG_alg_ml_dsa_65)) {
        CRYPTO_LOG("  ML-DSA-65 is enabled, creating SIG...");
        g_crypto_state.sig = OQS_SIG_new(OQS_SIG_alg_ml_dsa_65);
        if (g_crypto_state.sig) {
            fprintf(stderr, "✅ ML-DSA-65 initialized\n");
            fprintf(stderr, "   PK: %zu, SK: %zu, SIG: %zu\n",
                    g_crypto_state.sig->length_public_key,
                    g_crypto_state.sig->length_secret_key,
                    g_crypto_state.sig->length_signature);
            CRYPTO_LOG("  ML-DSA-65 created successfully");
        } else {
            CRYPTO_LOG("  ERROR: Failed to create ML-DSA-65");
        }
    } else {
        CRYPTO_LOG("  ML-DSA-65 is NOT enabled");
    }

    // Формируем строку версии
    if (g_crypto_state.kem && g_crypto_state.sig) {
        snprintf(g_crypto_state.version, sizeof(g_crypto_state.version),
                 "Hybrid: ECDH + %s (KEM) + %s (SIG)",
                 g_crypto_state.kem->method_name,
                 g_crypto_state.sig->method_name);
        CRYPTO_LOG("  Version: %s", g_crypto_state.version);
    } else if (g_crypto_state.kem) {
        snprintf(g_crypto_state.version, sizeof(g_crypto_state.version),
                 "KEM only: %s", g_crypto_state.kem->method_name);
        CRYPTO_LOG("  Version: %s", g_crypto_state.version);
    } else {
        snprintf(g_crypto_state.version, sizeof(g_crypto_state.version),
                 "Classic: ECDH only");
        CRYPTO_LOG("  Version: %s", g_crypto_state.version);
    }

    g_crypto_state.initialized = 1;
    CRYPTO_LOG("=== mesh_hybrid_init complete ===");
    return 0;
}

bool mesh_hybrid_is_pq_supported(void) {
    return g_crypto_state.kem != NULL && g_crypto_state.sig != NULL;
}

const char* mesh_hybrid_version(void) {
    return g_crypto_state.version;
}

void mesh_hybrid_cleanup(void) {
    CRYPTO_LOG("=== mesh_hybrid_cleanup ===");

    if (g_crypto_state.kem) {
        CRYPTO_LOG("  Freeing KEM...");
        OQS_KEM_free(g_crypto_state.kem);
        g_crypto_state.kem = NULL;
    }
    if (g_crypto_state.sig) {
        CRYPTO_LOG("  Freeing SIG...");
        OQS_SIG_free(g_crypto_state.sig);
        g_crypto_state.sig = NULL;
    }
    EVP_cleanup();
    g_crypto_state.initialized = 0;

    CRYPTO_LOG("=== mesh_hybrid_cleanup complete ===");
}

// ============================================================================
// Вспомогательные функции
// ============================================================================

int mesh_crypto_random(unsigned char *key, size_t len) {
    if (!key || len == 0) return -1;
    if (RAND_bytes(key, (int)len) != 1) {
        CRYPTO_LOG("  ERROR: RAND_bytes failed");
        return -1;
    }
    return 0;
}

int mesh_crypto_public_from_id(const char *user_id, unsigned char *public_key) {
    if (!user_id || !public_key) return -1;

    CRYPTO_LOG("public_from_id: user_id=%s", user_id);

    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)user_id, strlen(user_id), hash);

    memcpy(public_key, hash, 32);
    public_key[0] &= 0xF8;
    public_key[31] &= 0x7F;
    public_key[31] |= 0x40;

    CRYPTO_HEX("  public_key", public_key, 32);
    return 0;
}

int ecdh_shared_secret(const unsigned char *private_key,
                       const unsigned char *public_key,
                       unsigned char *shared_secret,
                       int *secret_len) {
    CRYPTO_LOG("ecdh_shared_secret: private_key=%p, public_key=%p", private_key, public_key);
    CRYPTO_HEX("  private_key", private_key, 32);
    CRYPTO_HEX("  public_key", public_key, 32);

    // Создаем ключи с правильным типом EVP_PKEY_X25519
    EVP_PKEY *priv = EVP_PKEY_new_raw_private_key(EVP_PKEY_X25519, NULL, private_key, 32);
    if (!priv) {
        CRYPTO_LOG("  ERROR: Failed to create EVP_PKEY from private_key");
        return -1;
    }

    EVP_PKEY *pub = EVP_PKEY_new_raw_public_key(EVP_PKEY_X25519, NULL, public_key, 32);
    if (!pub) {
        CRYPTO_LOG("  ERROR: Failed to create EVP_PKEY from public_key");
        EVP_PKEY_free(priv);
        return -1;
    }

    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(priv, NULL);
    if (!ctx) {
        CRYPTO_LOG("  ERROR: Failed to create EVP_PKEY_CTX");
        EVP_PKEY_free(priv);
        EVP_PKEY_free(pub);
        return -1;
    }

    if (EVP_PKEY_derive_init(ctx) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_PKEY_derive_init failed");
        EVP_PKEY_CTX_free(ctx);
        EVP_PKEY_free(priv);
        EVP_PKEY_free(pub);
        return -1;
    }

    if (EVP_PKEY_derive_set_peer(ctx, pub) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_PKEY_derive_set_peer failed");
        EVP_PKEY_CTX_free(ctx);
        EVP_PKEY_free(priv);
        EVP_PKEY_free(pub);
        return -1;
    }

    size_t len = 32;
    if (EVP_PKEY_derive(ctx, shared_secret, &len) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_PKEY_derive failed");
        EVP_PKEY_CTX_free(ctx);
        EVP_PKEY_free(priv);
        EVP_PKEY_free(pub);
        return -1;
    }

    *secret_len = (int)len;
    CRYPTO_LOG("  shared_secret_len=%d", *secret_len);
    CRYPTO_HEX("  shared_secret", shared_secret, *secret_len);

    EVP_PKEY_CTX_free(ctx);
    EVP_PKEY_free(priv);
    EVP_PKEY_free(pub);

    return 0;
}

static int hkdf_derive(const unsigned char *secret, int secret_len,
                       unsigned char *key, int key_len,
                       unsigned char *iv, int iv_len) {
    if (!secret || secret_len <= 0 || !key || key_len <= 0) {
        CRYPTO_LOG("hkdf_derive: invalid parameters");
        return -1;
    }

    CRYPTO_LOG("hkdf_derive: secret_len=%d, key_len=%d, iv_len=%d", secret_len, key_len, iv_len);
    CRYPTO_HEX("  secret", secret, secret_len);

    unsigned char prk[32];
    unsigned char zero_salt[32] = {0};

    // HKDF-Extract
    HMAC(EVP_sha256(), zero_salt, 32, secret, secret_len, prk, NULL);
    CRYPTO_HEX("  prk", prk, 32);

    unsigned char t[32];
    unsigned char counter = 1;

    // HKDF-Expand для ключа
    HMAC(EVP_sha256(), prk, 32, (unsigned char*)&counter, 1, t, NULL);
    memcpy(key, t, key_len > 32 ? 32 : key_len);
    CRYPTO_HEX("  derived key", key, key_len > 32 ? 32 : key_len);

    // HKDF-Expand для IV
    if (iv && iv_len > 0) {
        unsigned char iv_input[33];
        memcpy(iv_input, t, 32);
        iv_input[32] = 2;
        unsigned char iv_hash[32];
        HMAC(EVP_sha256(), prk, 32, iv_input, 33, iv_hash, NULL);
        memcpy(iv, iv_hash, iv_len > 32 ? 32 : iv_len);
        CRYPTO_HEX("  derived iv", iv, iv_len > 32 ? 32 : iv_len);
    }

    return 0;
}

// ============================================================================
// Генерация ключей
// ============================================================================

int mesh_hybrid_generate_keypair(mesh_hybrid_keypair_t *keypair,
                                 const char *user_id,
                                 const char *secret_phrase) {
    if (!keypair || !user_id || !secret_phrase) {
        CRYPTO_LOG("generate_keypair: invalid parameters");
        return -1;
    }

    CRYPTO_LOG("=== mesh_hybrid_generate_keypair ===");
    CRYPTO_LOG("  user_id=%s", user_id);

    mesh_hybrid_init();
    memset(keypair, 0, sizeof(mesh_hybrid_keypair_t));

    unsigned char hash[SHA256_DIGEST_LENGTH];
    unsigned char combined[1024];

    // Классические ключи из ID
    CRYPTO_LOG("  Generating classic keys from ID...");
    SHA256((unsigned char*)user_id, strlen(user_id), hash);
    memcpy(keypair->classic_public_key, hash, 32);
    keypair->classic_public_key[0] &= 0xF8;
    keypair->classic_public_key[31] &= 0x7F;
    keypair->classic_public_key[31] |= 0x40;

    snprintf((char*)combined, sizeof(combined), "%s:%s:%s",
             user_id, "MeshID_SALT", secret_phrase);
    SHA256(combined, strlen((char*)combined), hash);
    memcpy(keypair->classic_private_key, hash, 32);
    keypair->classic_private_key[0] &= 0xF8;
    keypair->classic_private_key[31] &= 0x7F;
    keypair->classic_private_key[31] |= 0x40;

    // ЯВНО УСТАНАВЛИВАЕМ ФЛАГ В 1
    keypair->classic_initialized = 1;
    CRYPTO_LOG("  classic_initialized set to %d", keypair->classic_initialized);

    // PQ ключи
    if (g_crypto_state.kem) {
        CRYPTO_LOG("  Generating PQ keys...");
        if (OQS_KEM_keypair(g_crypto_state.kem,
                            keypair->pq_public_key,
                            keypair->pq_secret_key) == OQS_SUCCESS) {
            keypair->pq_initialized = 1;
            CRYPTO_LOG("  PQ keys generated");
            CRYPTO_HEX("  pq_public_key", keypair->pq_public_key, 16);
        } else {
            CRYPTO_LOG("  ERROR: PQ keypair generation failed");
            keypair->pq_initialized = 0;
        }
    } else {
        CRYPTO_LOG("  PQ not available");
        keypair->pq_initialized = 0;
    }

    // Ключи подписи
    if (g_crypto_state.sig) {
        CRYPTO_LOG("  Generating SIG keys...");
        if (OQS_SIG_keypair(g_crypto_state.sig,
                            keypair->sig_public_key,
                            keypair->sig_secret_key) == OQS_SUCCESS) {
            keypair->sig_initialized = 1;
            CRYPTO_LOG("  SIG keys generated");
        } else {
            CRYPTO_LOG("  ERROR: SIG keypair generation failed");
            keypair->sig_initialized = 0;
        }
    } else {
        CRYPTO_LOG("  SIG not available");
        keypair->sig_initialized = 0;
    }

    CRYPTO_LOG("=== mesh_hybrid_generate_keypair complete ===");
    CRYPTO_LOG("  classic_initialized=%d", keypair->classic_initialized);
    CRYPTO_LOG("  pq_initialized=%d", keypair->pq_initialized);
    CRYPTO_LOG("  sig_initialized=%d", keypair->sig_initialized);

    return 0;
}

void mesh_hybrid_free_keypair(mesh_hybrid_keypair_t *keypair) {
    if (keypair) {
        memset(keypair, 0, sizeof(mesh_hybrid_keypair_t));
    }
}

// ============================================================================
// Сессии
// ============================================================================

int mesh_hybrid_create_session(const mesh_hybrid_keypair_t *receiver_pk,
                               mesh_hybrid_session_t *session) {
    CRYPTO_LOG("=== mesh_hybrid_create_session ===");
    CRYPTO_LOG("  receiver_pk=%p", (const void*)receiver_pk);
    CRYPTO_LOG("  session=%p", (void*)session);

    if (!receiver_pk || !session) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    memset(session, 0, sizeof(mesh_hybrid_session_t));

    if (!receiver_pk->classic_initialized) {
        CRYPTO_LOG("  ERROR: receiver has no classic key");
        return -1;
    }

    // ВСЕ НА HEAP
    unsigned char *ephemeral_private = malloc(32);
    if (!ephemeral_private) {
        CRYPTO_LOG("  ERROR: malloc failed for ephemeral_private");
        return -1;
    }

    CRYPTO_LOG("  Generating ephemeral keys...");
    if (mesh_crypto_random(ephemeral_private, 32) < 0) {
        CRYPTO_LOG("  ERROR: failed to generate ephemeral private key");
        free(ephemeral_private);
        return -1;
    }
    ephemeral_private[0] &= 0xF8;
    ephemeral_private[31] &= 0x7F;
    ephemeral_private[31] |= 0x40;

    EVP_PKEY *priv = EVP_PKEY_new_raw_private_key(EVP_PKEY_X25519, NULL, ephemeral_private, 32);
    if (!priv) {
        CRYPTO_LOG("  ERROR: failed to create EVP_PKEY from ephemeral_private");
        free(ephemeral_private);
        return -1;
    }

    size_t len = 32;
    if (EVP_PKEY_get_raw_public_key(priv, session->ephemeral_public, &len) <= 0) {
        CRYPTO_LOG("  ERROR: failed to get raw public key");
        EVP_PKEY_free(priv);
        free(ephemeral_private);
        return -1;
    }
    EVP_PKEY_free(priv);

    CRYPTO_HEX("  ephemeral_public", session->ephemeral_public, 32);

    CRYPTO_LOG("  Computing classic shared secret...");
    if (ecdh_shared_secret(ephemeral_private, receiver_pk->classic_public_key,
                           session->classic_shared_secret,
                           &session->classic_secret_len) < 0) {
        CRYPTO_LOG("  ERROR: ecdh_shared_secret failed");
        free(ephemeral_private);
        return -1;
    }

    free(ephemeral_private);

    // PQ часть
    if (receiver_pk->pq_initialized && g_crypto_state.kem) {
        CRYPTO_LOG("  Encapsulating with PQ...");
        if (OQS_KEM_encaps(g_crypto_state.kem,
                           session->pq_ciphertext,
                           session->pq_shared_secret,
                           receiver_pk->pq_public_key) == OQS_SUCCESS) {
            session->pq_secret_len = MESH_PQ_SHARED_SECRET_LEN;
            session->pq_ciphertext_len = MESH_PQ_CIPHERTEXT_LEN;
            CRYPTO_LOG("  PQ encaps success");
            CRYPTO_HEX("  pq_ciphertext", session->pq_ciphertext, 16);
            CRYPTO_HEX("  pq_shared_secret", session->pq_shared_secret, 16);
        } else {
            CRYPTO_LOG("  PQ encaps FAILED");
        }
    } else {
        CRYPTO_LOG("  PQ not available or not initialized");
    }

    // Комбинируем секреты
    int offset = 0;
    memcpy(session->hybrid_secret + offset,
           session->classic_shared_secret,
           session->classic_secret_len);
    offset += session->classic_secret_len;
    memcpy(session->hybrid_secret + offset,
           session->pq_shared_secret,
           session->pq_secret_len);
    offset += session->pq_secret_len;
    session->hybrid_secret_len = offset;

    CRYPTO_LOG("  hybrid_secret_len=%d", session->hybrid_secret_len);
    CRYPTO_HEX("  hybrid_secret", session->hybrid_secret, session->hybrid_secret_len);

    // Получаем ключ AES
    CRYPTO_LOG("  Deriving AES key from hybrid secret...");
    if (hkdf_derive(session->hybrid_secret, session->hybrid_secret_len,
                    session->aes_key, 32,
                    session->aes_iv, 16) < 0) {
        CRYPTO_LOG("  ERROR: hkdf_derive failed");
        return -1;
    }

    CRYPTO_LOG("  AES key and IV generated");
    CRYPTO_HEX("  aes_key", session->aes_key, 32);
    CRYPTO_HEX("  aes_iv", session->aes_iv, 16);

    session->initialized = 1;
    CRYPTO_LOG("=== session created successfully ===");
    return 0;
}

int mesh_hybrid_restore_session(const unsigned char *packet,
                                size_t packet_len,
                                const mesh_hybrid_keypair_t *receiver_sk,
                                mesh_hybrid_session_t *session) {
    if (!packet || !receiver_sk || !session) {
        CRYPTO_LOG("restore_session: invalid parameters");
        return -1;
    }
    if (packet_len < sizeof(mesh_hybrid_packet_t)) {
        CRYPTO_LOG("restore_session: packet too small");
        return -1;
    }

    CRYPTO_LOG("=== mesh_hybrid_restore_session ===");
    memset(session, 0, sizeof(mesh_hybrid_session_t));

    const mesh_hybrid_packet_t *pkt = (const mesh_hybrid_packet_t*)packet;

    CRYPTO_HEX("  ephemeral_public from packet", pkt->ephemeral_public, 32);
    CRYPTO_HEX("  iv from packet", pkt->iv, 16);
    CRYPTO_LOG("  pq_ciphertext_len from packet=%d", pkt->pq_ciphertext_len);

    if (!receiver_sk->classic_initialized) {
        CRYPTO_LOG("  ERROR: receiver has no classic key");
        return -1;
    }

    // Классическая часть
    CRYPTO_LOG("  Computing classic shared secret...");
    if (ecdh_shared_secret(receiver_sk->classic_private_key,
                           pkt->ephemeral_public,
                           session->classic_shared_secret,
                           &session->classic_secret_len) < 0) {
        CRYPTO_LOG("  ERROR: ecdh_shared_secret failed");
        return -1;
    }

    // PQ часть
    if (receiver_sk->pq_initialized && g_crypto_state.kem && pkt->pq_ciphertext_len > 0) {
        CRYPTO_LOG("  Decapsulating with PQ...");
        if (OQS_KEM_decaps(g_crypto_state.kem,
                           session->pq_shared_secret,
                           pkt->pq_ciphertext,
                           receiver_sk->pq_secret_key) == OQS_SUCCESS) {
            session->pq_secret_len = MESH_PQ_SHARED_SECRET_LEN;
            session->pq_ciphertext_len = pkt->pq_ciphertext_len;
            CRYPTO_LOG("  PQ decaps success");
            CRYPTO_HEX("  pq_shared_secret", session->pq_shared_secret, 16);
        } else {
            CRYPTO_LOG("  PQ decaps FAILED");
        }
    }

    // Комбинируем секреты
    int offset = 0;
    memcpy(session->hybrid_secret + offset,
           session->classic_shared_secret,
           session->classic_secret_len);
    offset += session->classic_secret_len;
    memcpy(session->hybrid_secret + offset,
           session->pq_shared_secret,
           session->pq_secret_len);
    offset += session->pq_secret_len;
    session->hybrid_secret_len = offset;

    CRYPTO_LOG("  hybrid_secret_len=%d", session->hybrid_secret_len);
    CRYPTO_HEX("  hybrid_secret", session->hybrid_secret, session->hybrid_secret_len);

    // Получаем ключ AES из гибридного секрета (используем IV из пакета)
    memcpy(session->aes_iv, pkt->iv, 16);
    CRYPTO_LOG("  Deriving AES key from hybrid secret...");
    if (hkdf_derive(session->hybrid_secret, session->hybrid_secret_len,
                    session->aes_key, 32,
                    NULL, 0) < 0) {
        CRYPTO_LOG("  ERROR: hkdf_derive failed");
        return -1;
    }

    CRYPTO_LOG("  AES key generated");
    CRYPTO_HEX("  aes_key", session->aes_key, 32);
    CRYPTO_HEX("  aes_iv (from packet)", session->aes_iv, 16);

    session->initialized = 1;
    CRYPTO_LOG("=== session restored successfully ===");
    return 0;
}

// ============================================================================
// Шифрование
// ============================================================================

int mesh_hybrid_encrypt(mesh_hybrid_session_t *session,
                        const unsigned char *plaintext,
                        size_t plaintext_len,
                        unsigned char *packet,
                        size_t *packet_len) {
    CRYPTO_LOG("=== mesh_hybrid_encrypt ===");
    CRYPTO_LOG("  session=%p, session->initialized=%d", (void*)session, session ? session->initialized : 0);
    CRYPTO_LOG("  plaintext=%p, plaintext_len=%zu", (const void*)plaintext, plaintext_len);
    CRYPTO_LOG("  packet=%p, packet_len=%zu", (void*)packet, packet ? *packet_len : 0);
    CRYPTO_LOG("  sizeof(mesh_hybrid_packet_t)=%zu", sizeof(mesh_hybrid_packet_t));

    if (!session || !session->initialized || !plaintext || !packet || !packet_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    size_t total_size = sizeof(mesh_hybrid_packet_t) + plaintext_len;
    CRYPTO_LOG("  total_size needed=%zu", total_size);

    if (*packet_len < total_size) {
        CRYPTO_LOG("  ERROR: buffer too small! Need %zu, have %zu", total_size, *packet_len);
        *packet_len = total_size;
        return -2;
    }

    if (*packet_len > 1024 * 1024) {
        CRYPTO_LOG("  ERROR: buffer too large! %zu bytes", *packet_len);
        return -3;
    }

    if (*packet_len < sizeof(mesh_hybrid_packet_t)) {
        CRYPTO_LOG("  ERROR: buffer smaller than packet header! %zu < %zu",
                   *packet_len, sizeof(mesh_hybrid_packet_t));
        return -4;
    }

    CRYPTO_LOG("  packet struct size=%zu", sizeof(mesh_hybrid_packet_t));

    mesh_hybrid_packet_t *pkt = (mesh_hybrid_packet_t*)packet;
    CRYPTO_LOG("  pkt at %p", (void*)pkt);

    // Заполняем заголовок
    pkt->magic = 0x4D455348;
    pkt->version = 2;
    pkt->packet_id = (uint64_t)time(NULL) << 32 | (uint64_t)rand();
    pkt->timestamp = (uint32_t)time(NULL);
    pkt->type = 1;
    pkt->flags = 0;
    pkt->crypto_type = 2;
    pkt->crypto_flags = 0x05;
    pkt->pq_algorithm = 1;
    pkt->hop_count = 0;
    pkt->max_hops = 5;
    CRYPTO_LOG("  packet header filled");

    // Копируем строки безопасно
    strncpy(pkt->sender_id, "alice", sizeof(pkt->sender_id) - 1);
    pkt->sender_id[sizeof(pkt->sender_id) - 1] = '\0';
    strncpy(pkt->sender_name, "Alice", sizeof(pkt->sender_name) - 1);
    pkt->sender_name[sizeof(pkt->sender_name) - 1] = '\0';
    strncpy(pkt->receiver_id, "bob", sizeof(pkt->receiver_id) - 1);
    pkt->receiver_id[sizeof(pkt->receiver_id) - 1] = '\0';
    strncpy(pkt->receiver_name, "Bob", sizeof(pkt->receiver_name) - 1);
    pkt->receiver_name[sizeof(pkt->receiver_name) - 1] = '\0';
    CRYPTO_LOG("  strings copied");

    // Копируем ключи
    CRYPTO_LOG("  copying ephemeral_public (32 bytes)");
    memcpy(pkt->ephemeral_public, session->ephemeral_public, 32);
    CRYPTO_LOG("  copying iv (16 bytes)");
    memcpy(pkt->iv, session->aes_iv, 16);
    CRYPTO_LOG("  keys copied");

    // Копируем PQ шифротекст
    pkt->pq_ciphertext_len = session->pq_ciphertext_len;
    if (session->pq_ciphertext_len > 0) {
        if (session->pq_ciphertext_len <= MESH_PQ_CIPHERTEXT_LEN) {
            CRYPTO_LOG("  copying pq_ciphertext (%d bytes)", session->pq_ciphertext_len);
            memcpy(pkt->pq_ciphertext, session->pq_ciphertext, session->pq_ciphertext_len);
            CRYPTO_LOG("  pq_ciphertext_len=%d", pkt->pq_ciphertext_len);
        } else {
            CRYPTO_LOG("  ERROR: pq_ciphertext_len too large: %d", session->pq_ciphertext_len);
            return -5;
        }
    }

    // Шифруем AES-256-CTR
    CRYPTO_LOG("  creating EVP_CIPHER_CTX...");
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) {
        CRYPTO_LOG("  ERROR: EVP_CIPHER_CTX_new failed");
        return -1;
    }
    CRYPTO_LOG("  EVP_CIPHER_CTX created at %p", (void*)ctx);

    CRYPTO_LOG("  AES encrypt with key and iv:");
    CRYPTO_HEX("    aes_key", session->aes_key, 32);
    CRYPTO_HEX("    aes_iv", session->aes_iv, 16);

    if (EVP_EncryptInit_ex(ctx, EVP_aes_256_ctr(), NULL,
                           session->aes_key, session->aes_iv) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_EncryptInit_ex failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }
    CRYPTO_LOG("  EVP_EncryptInit_ex OK");

    int out_len;
    size_t max_payload = *packet_len - sizeof(mesh_hybrid_packet_t);
    CRYPTO_LOG("  max_payload=%zu, plaintext_len=%zu", max_payload, plaintext_len);

    if (plaintext_len > max_payload) {
        CRYPTO_LOG("  ERROR: plaintext too large for buffer");
        EVP_CIPHER_CTX_free(ctx);
        return -6;
    }

    CRYPTO_LOG("  calling EVP_EncryptUpdate...");
    if (EVP_EncryptUpdate(ctx, pkt->payload, &out_len, plaintext, (int)plaintext_len) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_EncryptUpdate failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }
    CRYPTO_LOG("  EVP_EncryptUpdate: out_len=%d", out_len);

    int final_len;
    CRYPTO_LOG("  calling EVP_EncryptFinal_ex...");
    if (EVP_EncryptFinal_ex(ctx, pkt->payload + out_len, &final_len) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_EncryptFinal_ex failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }
    CRYPTO_LOG("  EVP_EncryptFinal_ex: final_len=%d", final_len);

    EVP_CIPHER_CTX_free(ctx);
    CRYPTO_LOG("  EVP_CIPHER_CTX freed");

    pkt->payload_len = out_len + final_len;
    *packet_len = total_size;

    CRYPTO_LOG("  encrypted payload_len=%d", pkt->payload_len);
    CRYPTO_HEX("  encrypted payload", pkt->payload, pkt->payload_len > 32 ? 32 : pkt->payload_len);
    CRYPTO_LOG("  packet total size=%zu", *packet_len);
    CRYPTO_LOG("=== encrypt complete ===");

    return 0;
}

int mesh_hybrid_decrypt(mesh_hybrid_session_t *session,
                        const unsigned char *packet,
                        size_t packet_len,
                        unsigned char *plaintext,
                        size_t *plaintext_len) {
    CRYPTO_LOG("=== mesh_hybrid_decrypt ===");
    CRYPTO_LOG("  packet_len=%zu", packet_len);
    CRYPTO_LOG("  plaintext buffer size=%zu", *plaintext_len);

    if (!session || !session->initialized || !packet || !plaintext || !plaintext_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    const mesh_hybrid_packet_t *pkt = (const mesh_hybrid_packet_t*)packet;
    size_t data_len = packet_len - sizeof(mesh_hybrid_packet_t);
    CRYPTO_LOG("  data_len=%zu", data_len);
    CRYPTO_HEX("  encrypted payload", pkt->payload, data_len > 32 ? 32 : data_len);

    if (*plaintext_len < data_len) {
        CRYPTO_LOG("  ERROR: plaintext buffer too small! Need %zu, have %zu", data_len, *plaintext_len);
        *plaintext_len = data_len;
        return -2;
    }

    CRYPTO_LOG("  AES decrypt with key and iv:");
    CRYPTO_HEX("    aes_key", session->aes_key, 32);
    CRYPTO_HEX("    aes_iv", session->aes_iv, 16);

    // Расшифровываем AES-256-CTR
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) {
        CRYPTO_LOG("  ERROR: EVP_CIPHER_CTX_new failed");
        return -1;
    }

    if (EVP_DecryptInit_ex(ctx, EVP_aes_256_ctr(), NULL,
                           session->aes_key, session->aes_iv) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_DecryptInit_ex failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }

    int out_len;
    if (EVP_DecryptUpdate(ctx, plaintext, &out_len, pkt->payload, (int)data_len) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_DecryptUpdate failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }
    CRYPTO_LOG("  EVP_DecryptUpdate: out_len=%d", out_len);

    int final_len;
    if (EVP_DecryptFinal_ex(ctx, plaintext + out_len, &final_len) <= 0) {
        CRYPTO_LOG("  ERROR: EVP_DecryptFinal_ex failed");
        EVP_CIPHER_CTX_free(ctx);
        return -1;
    }
    CRYPTO_LOG("  EVP_DecryptFinal_ex: final_len=%d", final_len);

    EVP_CIPHER_CTX_free(ctx);
    *plaintext_len = out_len + final_len;
    CRYPTO_LOG("  decrypted plaintext_len=%zu", *plaintext_len);
    CRYPTO_HEX("  decrypted plaintext", plaintext, *plaintext_len > 32 ? 32 : *plaintext_len);

    // Добавляем null-терминатор для безопасности
    if (*plaintext_len > 0) {
        plaintext[*plaintext_len] = '\0';
    }

    CRYPTO_LOG("=== decrypt complete ===");

    return 0;
}

// ============================================================================
// Упрощенные функции
// ============================================================================

int mesh_hybrid_encrypt_message(const char *receiver_id,
                                const mesh_hybrid_keypair_t *receiver_pk,
                                const unsigned char *plaintext,
                                size_t plaintext_len,
                                unsigned char *packet,
                                size_t *packet_len) {
    CRYPTO_LOG("=== mesh_hybrid_encrypt_message ===");
    CRYPTO_LOG("  receiver_id=%s", receiver_id ? receiver_id : "NULL");
    CRYPTO_LOG("  plaintext_len=%zu", plaintext_len);
    CRYPTO_LOG("  packet buffer size=%zu", packet ? *packet_len : 0);

    if (!receiver_id || !receiver_pk || !plaintext || !packet || !packet_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    mesh_hybrid_session_t session;
    memset(&session, 0, sizeof(session));

    CRYPTO_LOG("  Creating session...");
    if (mesh_hybrid_create_session(receiver_pk, &session) < 0) {
        CRYPTO_LOG("  ERROR: mesh_hybrid_create_session failed");
        return -1;
    }
    CRYPTO_LOG("  Session created");

    CRYPTO_LOG("  Encrypting...");
    int result = mesh_hybrid_encrypt(&session, plaintext, plaintext_len, packet, packet_len);

    CRYPTO_LOG("  Encrypt result: %d", result);
    CRYPTO_LOG("=== mesh_hybrid_encrypt_message complete ===");

    return result;
}

int mesh_hybrid_decrypt_message(const mesh_hybrid_keypair_t *keypair,
                                const unsigned char *packet,
                                size_t packet_len,
                                unsigned char *plaintext,
                                size_t *plaintext_len) {
    CRYPTO_LOG("=== mesh_hybrid_decrypt_message ===");
    CRYPTO_LOG("  packet_len=%zu", packet_len);
    CRYPTO_LOG("  plaintext buffer size=%zu", plaintext ? *plaintext_len : 0);

    if (!keypair || !packet || !plaintext || !plaintext_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    mesh_hybrid_session_t session;
    memset(&session, 0, sizeof(session));

    CRYPTO_LOG("  Restoring session...");
    if (mesh_hybrid_restore_session(packet, packet_len, keypair, &session) < 0) {
        CRYPTO_LOG("  ERROR: mesh_hybrid_restore_session failed");
        return -1;
    }
    CRYPTO_LOG("  Session restored");

    CRYPTO_LOG("  Decrypting...");
    int result = mesh_hybrid_decrypt(&session, packet, packet_len, plaintext, plaintext_len);

    CRYPTO_LOG("  Decrypt result: %d", result);
    CRYPTO_LOG("=== mesh_hybrid_decrypt_message complete ===");

    return result;
}

// ============================================================================
// Подписи
// ============================================================================

int mesh_hybrid_sign(const mesh_hybrid_keypair_t *keypair,
                     const unsigned char *data,
                     size_t data_len,
                     unsigned char *signature,
                     size_t *signature_len) {
    CRYPTO_LOG("=== mesh_hybrid_sign ===");
    CRYPTO_LOG("  data_len=%zu", data_len);

    if (!keypair || !keypair->sig_initialized || !data || !signature || !signature_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }
    if (!g_crypto_state.sig) {
        CRYPTO_LOG("  ERROR: SIG not initialized");
        return -1;
    }

    if (OQS_SIG_sign(g_crypto_state.sig, signature, signature_len,
                     data, data_len,
                     keypair->sig_secret_key) != OQS_SUCCESS) {
        CRYPTO_LOG("  ERROR: OQS_SIG_sign failed");
        return -1;
    }

    CRYPTO_LOG("  signature_len=%zu", *signature_len);
    CRYPTO_LOG("=== mesh_hybrid_sign complete ===");
    return 0;
}

int mesh_hybrid_verify(const mesh_hybrid_keypair_t *keypair,
                       const unsigned char *data,
                       size_t data_len,
                       const unsigned char *signature,
                       size_t signature_len) {
    CRYPTO_LOG("=== mesh_hybrid_verify ===");
    CRYPTO_LOG("  data_len=%zu, signature_len=%zu", data_len, signature_len);

    if (!keypair || !keypair->sig_initialized || !data || !signature) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }
    if (!g_crypto_state.sig) {
        CRYPTO_LOG("  ERROR: SIG not initialized");
        return -1;
    }

    if (OQS_SIG_verify(g_crypto_state.sig, data, data_len,
                       signature, signature_len,
                       keypair->sig_public_key) == OQS_SUCCESS) {
        CRYPTO_LOG("  Verification: SUCCESS");
        CRYPTO_LOG("=== mesh_hybrid_verify complete ===");
        return 1;
    }

    CRYPTO_LOG("  Verification: FAILED");
    CRYPTO_LOG("=== mesh_hybrid_verify complete ===");
    return 0;
}

// ============================================================================
// Вспомогательные
// ============================================================================

size_t mesh_hybrid_packet_size(size_t plaintext_len) {
    size_t total = sizeof(mesh_hybrid_packet_t) + plaintext_len;
    CRYPTO_LOG("packet_size: plaintext_len=%zu -> total=%zu", plaintext_len, total);
    return total;
}

// ============================================================================
// Безопасные функции шифрования с автоматическим выделением памяти
// ============================================================================

int mesh_hybrid_encrypt_auto(mesh_hybrid_session_t *session,
                             const unsigned char *plaintext,
                             size_t plaintext_len,
                             mesh_hybrid_packet_t **packet,
                             size_t *packet_len) {
    CRYPTO_LOG("=== mesh_hybrid_encrypt_auto ===");
    CRYPTO_LOG("  plaintext_len=%zu", plaintext_len);

    if (!session || !session->initialized || !plaintext || !packet || !packet_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    // Вычисляем размер пакета
    size_t total_size = sizeof(mesh_hybrid_packet_t) + plaintext_len;
    CRYPTO_LOG("  total_size=%zu", total_size);

    // Выделяем память
    *packet = calloc(1, total_size + 64);
    if (!*packet) {
        CRYPTO_LOG("  ERROR: malloc failed");
        return -1;
    }
    CRYPTO_LOG("  Allocated %zu bytes at %p", total_size + 64, *packet);

    // Копируем сессионные данные
    memcpy((*packet)->ephemeral_public, session->ephemeral_public, 32);
    memcpy((*packet)->iv, session->aes_iv, 16);

    // Копируем PQ ciphertext
    if (session->pq_ciphertext_len > 0) {
        memcpy((*packet)->pq_ciphertext, session->pq_ciphertext,
               session->pq_ciphertext_len);
        (*packet)->pq_ciphertext_len = session->pq_ciphertext_len;
    }

    // Шифруем
    size_t encrypt_len = total_size + 64;
    int result = mesh_hybrid_encrypt(session, plaintext, plaintext_len,
                                     (unsigned char*)*packet, &encrypt_len);

    if (result < 0) {
        CRYPTO_LOG("  ERROR: mesh_hybrid_encrypt failed with code %d", result);
        free(*packet);
        *packet = NULL;
        return result;
    }

    *packet_len = encrypt_len;
    CRYPTO_LOG("  packet_len=%zu", *packet_len);
    CRYPTO_LOG("=== mesh_hybrid_encrypt_auto complete ===");
    return 0;
}

int mesh_hybrid_decrypt_auto(mesh_hybrid_session_t *session,
                             const unsigned char *packet,
                             size_t packet_len,
                             unsigned char **plaintext,
                             size_t *plaintext_len) {
    CRYPTO_LOG("=== mesh_hybrid_decrypt_auto ===");
    CRYPTO_LOG("  packet_len=%zu", packet_len);

    if (!session || !session->initialized || !packet || !plaintext || !plaintext_len) {
        CRYPTO_LOG("  ERROR: invalid parameters");
        return -1;
    }

    size_t data_len = packet_len - sizeof(mesh_hybrid_packet_t);
    CRYPTO_LOG("  data_len=%zu", data_len);

    // Выделяем память для расшифрованных данных
    *plaintext = calloc(1, data_len + 64);
    if (!*plaintext) {
        CRYPTO_LOG("  ERROR: malloc failed");
        return -1;
    }
    CRYPTO_LOG("  Allocated %zu bytes at %p", data_len + 64, *plaintext);

    size_t decrypt_len = data_len + 64;
    int result = mesh_hybrid_decrypt(session, packet, packet_len,
                                     *plaintext, &decrypt_len);

    if (result < 0) {
        CRYPTO_LOG("  ERROR: mesh_hybrid_decrypt failed with code %d", result);
        free(*plaintext);
        *plaintext = NULL;
        return result;
    }

    *plaintext_len = decrypt_len;
    CRYPTO_LOG("  plaintext_len=%zu", *plaintext_len);
    CRYPTO_LOG("=== mesh_hybrid_decrypt_auto complete ===");
    return 0;
}

void mesh_hybrid_session_clear(mesh_hybrid_session_t *session) {
    if (session) {
        CRYPTO_LOG("mesh_hybrid_session_clear: clearing session");
        memset(session, 0, sizeof(mesh_hybrid_session_t));
    }
}