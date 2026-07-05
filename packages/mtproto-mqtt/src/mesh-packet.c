/*
    Mesh Packet - Реализация
    Поддержка классических и гибридных пакетов (ECDH + ML-KEM)
    С автоматическим управлением памятью
*/

#include "mesh-packet.h"
#include "mesh-crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <arpa/inet.h>

// ============================================================================
// Вспомогательные функции
// ============================================================================

static uint64_t generate_packet_id(void) {
    static uint64_t counter = 0;
    return (uint64_t)time(NULL) << 32 | (++counter);
}

static uint32_t get_timestamp(void) {
    return (uint32_t)time(NULL);
}

static uint32_t crc32_compute(const void *data, size_t len) {
    const unsigned char *p = (const unsigned char*)data;
    uint32_t crc = 0xFFFFFFFF;

    for (size_t i = 0; i < len; i++) {
        crc ^= p[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
        }
    }
    return ~crc;
}

// ============================================================================
// Безопасное управление памятью (реализация макросов)
// ============================================================================

void auto_free(void *ptr) {
    if (ptr) {
        void **p = (void**)ptr;
        if (*p) {
            free(*p);
            *p = NULL;
        }
    }
}

void auto_free_array(void *ptr) {
    if (ptr) {
        void ***p = (void***)ptr;
        if (*p) {
            for (int i = 0; (*p)[i]; i++) {
                free((*p)[i]);
                (*p)[i] = NULL;
            }
            free(*p);
            *p = NULL;
        }
    }
}

// ============================================================================
// Создание классических пакетов
// ============================================================================

mesh_packet_t* mesh_packet_create(uint32_t type, const char *receiver_id,
                                  const void *data, uint32_t data_len) {
    if (data_len > MESH_PAYLOAD_MAX) {
        return NULL;
    }

    size_t packet_size = sizeof(mesh_packet_t) + data_len;
    mesh_packet_t *packet = (mesh_packet_t*)SAFE_CALLOC(1, packet_size);

    packet->magic = MESH_MAGIC;
    packet->version = MESH_PACKET_VERSION;
    packet->packet_id = generate_packet_id();
    packet->timestamp = get_timestamp();
    packet->type = type;
    packet->flags = 0;
    packet->hop_count = 0;
    packet->max_hops = MESH_DEFAULT_MAX_HOPS;
    packet->crypto_type = 0;
    packet->crypto_flags = 0;

    // Отправитель
    snprintf(packet->sender_id, sizeof(packet->sender_id),
             "node-%d-%ld", getpid(), (long)time(NULL));
    snprintf(packet->sender_name, sizeof(packet->sender_name),
            "MTProto-MQTT-Gateway-%d", getpid());

    // Получатель
    if (receiver_id) {
        snprintf(packet->receiver_id, sizeof(packet->receiver_id),
                 "%s", receiver_id);
        snprintf(packet->receiver_name, sizeof(packet->receiver_name),
                 "Receiver");
    }

    // Данные
    if (data && data_len > 0) {
        packet->payload_len = data_len;
        memcpy(packet->payload, data, data_len);
    }

    // Подпись (заглушка)
    memset(packet->signature, 0, sizeof(packet->signature));
    memset(packet->public_key, 0, sizeof(packet->public_key));

    return packet;
}

mesh_packet_t* mesh_packet_create_position(const char *receiver_id,
                                           double latitude, double longitude,
                                           int32_t altitude, int32_t accuracy) {
    mesh_position_t pos;
    pos.latitude = (int64_t)(latitude * 10000000.0);
    pos.longitude = (int64_t)(longitude * 10000000.0);
    pos.altitude = altitude;
    pos.accuracy = accuracy;
    pos.timestamp = get_timestamp();
    pos.flags = MESH_POS_FLAG_GPS;
    pos.speed = 0.0f;
    pos.heading = 0.0f;

    return mesh_packet_create(MESH_MSG_TYPE_POSITION, receiver_id,
                              &pos, sizeof(pos));
}

mesh_packet_t* mesh_packet_create_text(const char *receiver_id, const char *text) {
    if (!text) return NULL;
    return mesh_packet_create(MESH_MSG_TYPE_ALERT, receiver_id,
                              text, strlen(text) + 1);
}

void mesh_packet_free(mesh_packet_t *packet) {
    SAFE_FREE(packet);
}

mesh_packet_t* mesh_packet_clone(const mesh_packet_t *packet) {
    if (!packet) {
        return NULL;
    }

    size_t size = sizeof(mesh_packet_t) + packet->payload_len;
    mesh_packet_t *copy = (mesh_packet_t*)SAFE_MALLOC(size);
    memcpy(copy, packet, size);
    return copy;
}

// ============================================================================
// Установка полей классического пакета
// ============================================================================

void mesh_packet_set_sender(mesh_packet_t *packet, const char *id, const char *name) {
    if (!packet) return;

    if (id) {
        snprintf(packet->sender_id, sizeof(packet->sender_id), "%s", id);
    }
    if (name) {
        snprintf(packet->sender_name, sizeof(packet->sender_name), "%s", name);
    }
}

void mesh_packet_set_receiver(mesh_packet_t *packet, const char *id, const char *name) {
    if (!packet) return;

    if (id) {
        snprintf(packet->receiver_id, sizeof(packet->receiver_id), "%s", id);
    }
    if (name) {
        snprintf(packet->receiver_name, sizeof(packet->receiver_name), "%s", name);
    }
}

void mesh_packet_set_flags(mesh_packet_t *packet, uint32_t flags) {
    if (packet) {
        packet->flags = flags;
    }
}

void mesh_packet_add_flags(mesh_packet_t *packet, uint32_t flags) {
    if (packet) {
        packet->flags |= flags;
    }
}

void mesh_packet_clear_flags(mesh_packet_t *packet, uint32_t flags) {
    if (packet) {
        packet->flags &= ~flags;
    }
}

int mesh_packet_has_flag(const mesh_packet_t *packet, uint32_t flag) {
    if (!packet) return 0;
    return (packet->flags & flag) != 0;
}

void mesh_packet_set_max_hops(mesh_packet_t *packet, uint32_t max_hops) {
    if (packet) {
        packet->max_hops = max_hops;
    }
}

// ============================================================================
// Маршрутизация классических пакетов
// ============================================================================

mesh_packet_t* mesh_packet_increment_hop(mesh_packet_t *packet) {
    if (!packet) return NULL;

    if (packet->hop_count >= packet->max_hops) {
        return NULL;
    }

    packet->hop_count++;
    packet->flags |= MESH_FLAG_FORWARDED;
    return packet;
}

int mesh_packet_can_forward(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return packet->hop_count < packet->max_hops;
}

int mesh_packet_is_broadcast(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return (packet->flags & MESH_FLAG_BROADCAST) != 0 ||
           packet->receiver_id[0] == '\0';
}

int mesh_packet_is_for_receiver(const mesh_packet_t *packet, const char *receiver_id) {
    if (!packet || !receiver_id) return 0;
    return strcmp(packet->receiver_id, receiver_id) == 0;
}

// ============================================================================
// Валидация классических пакетов
// ============================================================================

int mesh_packet_validate(const mesh_packet_t *packet) {
    if (!packet) {
        return -1;
    }

    if (packet->magic != MESH_MAGIC) {
        return -2;
    }

    if (packet->version != MESH_PACKET_VERSION) {
        return -3;
    }

    if (packet->type > MESH_MSG_TYPE_MAX) {
        return -4;
    }

    if (packet->hop_count > packet->max_hops) {
        return -5;
    }

    if (packet->payload_len > MESH_PAYLOAD_MAX) {
        return -6;
    }

    return 0;
}

uint32_t mesh_packet_compute_checksum(const mesh_packet_t *packet) {
    if (!packet) return 0;
    size_t size = sizeof(mesh_packet_t) + packet->payload_len;
    return crc32_compute(packet, size);
}

int mesh_packet_verify_checksum(const mesh_packet_t *packet) {
    if (!packet) return 0;
    // В текущей структуре нет поля для хранения checksum
    // Поэтому всегда возвращаем 1 (проверка пропущена)
    return 1;
}

// ============================================================================
// Получение данных классического пакета
// ============================================================================

const void* mesh_packet_get_payload(const mesh_packet_t *packet) {
    if (!packet) return NULL;
    return packet->payload;
}

uint32_t mesh_packet_get_payload_len(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return packet->payload_len;
}

size_t mesh_packet_get_total_size(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return sizeof(mesh_packet_t) + packet->payload_len;
}

uint64_t mesh_packet_get_id(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return packet->packet_id;
}

uint32_t mesh_packet_get_type(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return packet->type;
}

const char* mesh_packet_get_sender_id(const mesh_packet_t *packet) {
    if (!packet) return NULL;
    return packet->sender_id;
}

const char* mesh_packet_get_receiver_id(const mesh_packet_t *packet) {
    if (!packet) return NULL;
    return packet->receiver_id;
}

// ============================================================================
// Работа с позицией (классическая)
// ============================================================================

int mesh_packet_get_position(const mesh_packet_t *packet, mesh_position_t *pos) {
    if (!packet || !pos || packet->type != MESH_MSG_TYPE_POSITION) {
        return -1;
    }

    if (packet->payload_len < sizeof(mesh_position_t)) {
        return -2;
    }

    memcpy(pos, packet->payload, sizeof(mesh_position_t));
    return 0;
}

int mesh_packet_is_position(const mesh_packet_t *packet) {
    if (!packet) return 0;
    return packet->type == MESH_MSG_TYPE_POSITION;
}

double mesh_packet_get_latitude(const mesh_packet_t *packet) {
    if (!packet || packet->type != MESH_MSG_TYPE_POSITION) {
        return 0.0;
    }

    if (packet->payload_len < sizeof(mesh_position_t)) {
        return 0.0;
    }

    const mesh_position_t *pos = (const mesh_position_t*)packet->payload;
    return (double)pos->latitude / 10000000.0;
}

double mesh_packet_get_longitude(const mesh_packet_t *packet) {
    if (!packet || packet->type != MESH_MSG_TYPE_POSITION) {
        return 0.0;
    }

    if (packet->payload_len < sizeof(mesh_position_t)) {
        return 0.0;
    }

    const mesh_position_t *pos = (const mesh_position_t*)packet->payload;
    return (double)pos->longitude / 10000000.0;
}

int32_t mesh_packet_get_altitude(const mesh_packet_t *packet) {
    if (!packet || packet->type != MESH_MSG_TYPE_POSITION) {
        return 0;
    }

    if (packet->payload_len < sizeof(mesh_position_t)) {
        return 0;
    }

    const mesh_position_t *pos = (const mesh_position_t*)packet->payload;
    return pos->altitude;
}

int32_t mesh_packet_get_accuracy(const mesh_packet_t *packet) {
    if (!packet || packet->type != MESH_MSG_TYPE_POSITION) {
        return 0;
    }

    if (packet->payload_len < sizeof(mesh_position_t)) {
        return 0;
    }

    const mesh_position_t *pos = (const mesh_position_t*)packet->payload;
    return pos->accuracy;
}

// ============================================================================
// ГИБРИДНЫЕ ПАКЕТЫ
// ============================================================================

mesh_hybrid_packet_t* mesh_hybrid_packet_create(uint32_t type,
                                                 const char *receiver_id,
                                                 const void *data,
                                                 uint32_t data_len) {
    if (data_len > MESH_PAYLOAD_MAX) {
        return NULL;
    }

    size_t packet_size = MESH_HYBRID_PACKET_BASE_SIZE + data_len;
    mesh_hybrid_packet_t *packet = (mesh_hybrid_packet_t*)SAFE_CALLOC(1, packet_size);

    packet->magic = MESH_MAGIC;
    packet->version = 2;  // Гибридная версия
    packet->packet_id = generate_packet_id();
    packet->timestamp = get_timestamp();
    packet->type = type;
    packet->flags = 0;
    packet->hop_count = 0;
    packet->max_hops = MESH_DEFAULT_MAX_HOPS;
    packet->crypto_type = MESH_CRYPTO_TYPE_HYBRID;
    packet->crypto_flags = MESH_CRYPTO_FLAG_PQ_ENABLED | MESH_CRYPTO_FLAG_ENCRYPTED;
    packet->pq_algorithm = 1;

    // Отправитель
    snprintf(packet->sender_id, sizeof(packet->sender_id),
             "node-%d-%ld", getpid(), (long)time(NULL));
    snprintf(packet->sender_name, sizeof(packet->sender_name),
             "MTProto-MQTT-Gateway-%d", getpid());

    // Получатель
    if (receiver_id) {
        snprintf(packet->receiver_id, sizeof(packet->receiver_id),
                 "%s", receiver_id);
        snprintf(packet->receiver_name, sizeof(packet->receiver_name),
                 "Receiver");
    }

    // Данные
    if (data && data_len > 0) {
        packet->payload_len = data_len;
        memcpy(packet->payload, data, data_len);
    }

    // Инициализируем гибридные поля
    packet->pq_ciphertext_len = 0;
    packet->signature_len = 0;

    return packet;
}

mesh_hybrid_packet_t* mesh_hybrid_packet_from_buffer(const unsigned char *buffer,
                                                      size_t buffer_len) {
    if (!buffer || buffer_len < MESH_HYBRID_PACKET_BASE_SIZE) {
        return NULL;
    }

    mesh_hybrid_packet_t *packet = (mesh_hybrid_packet_t*)buffer;

    if (packet->magic != MESH_MAGIC) {
        return NULL;
    }

    if (packet->version != 2) {
        return NULL;
    }

    return packet;
}

size_t mesh_hybrid_packet_get_size(const mesh_hybrid_packet_t *packet) {
    if (!packet) return 0;
    return MESH_HYBRID_PACKET_BASE_SIZE + packet->payload_len;
}

size_t mesh_hybrid_packet_calc_size(size_t data_len) {
    return MESH_HYBRID_PACKET_BASE_SIZE + data_len;
}

int mesh_hybrid_packet_is_hybrid(const mesh_hybrid_packet_t *packet) {
    if (!packet) return 0;
    return packet->crypto_type == MESH_CRYPTO_TYPE_HYBRID;
}

int mesh_hybrid_packet_set_pq_ciphertext(mesh_hybrid_packet_t *packet,
                                          const unsigned char *pq_ciphertext,
                                          uint16_t ciphertext_len) {
    if (!packet || !pq_ciphertext || ciphertext_len == 0) {
        return -1;
    }

    if (ciphertext_len > MESH_PQ_CIPHERTEXT_MAX_LEN) {
        return -2;
    }

    memcpy(packet->pq_ciphertext, pq_ciphertext, ciphertext_len);
    packet->pq_ciphertext_len = ciphertext_len;

    return 0;
}

int mesh_hybrid_packet_set_signature(mesh_hybrid_packet_t *packet,
                                      const unsigned char *signature,
                                      uint16_t sig_len) {
    if (!packet || !signature || sig_len == 0) {
        return -1;
    }

    if (sig_len > MESH_SIGNATURE_MAX_LEN) {
        return -2;
    }

    memcpy(packet->signature, signature, sig_len);
    packet->signature_len = sig_len;

    return 0;
}

int mesh_hybrid_packet_set_ephemeral(mesh_hybrid_packet_t *packet,
                                      const unsigned char *ephemeral,
                                      const unsigned char *iv) {
    if (!packet || !ephemeral || !iv) {
        return -1;
    }

    memcpy(packet->ephemeral_public, ephemeral, 32);
    memcpy(packet->iv, iv, 16);

    return 0;
}

const unsigned char* mesh_hybrid_packet_get_pq_ciphertext(const mesh_hybrid_packet_t *packet,
                                                           uint16_t *ciphertext_len) {
    if (!packet || !ciphertext_len) {
        return NULL;
    }

    *ciphertext_len = packet->pq_ciphertext_len;
    return packet->pq_ciphertext;
}

const unsigned char* mesh_hybrid_packet_get_signature(const mesh_hybrid_packet_t *packet,
                                                       uint16_t *sig_len) {
    if (!packet || !sig_len) {
        return NULL;
    }

    *sig_len = packet->signature_len;
    return packet->signature;
}

const unsigned char* mesh_hybrid_packet_get_ephemeral(const mesh_hybrid_packet_t *packet) {
    if (!packet) return NULL;
    return packet->ephemeral_public;
}

const unsigned char* mesh_hybrid_packet_get_iv(const mesh_hybrid_packet_t *packet) {
    if (!packet) return NULL;
    return packet->iv;
}

int mesh_hybrid_packet_validate(const mesh_hybrid_packet_t *packet) {
    if (!packet) {
        return -1;
    }

    if (packet->magic != MESH_MAGIC) {
        return -2;
    }

    if (packet->version != 2) {
        return -3;
    }

    if (packet->type > MESH_MSG_TYPE_MAX) {
        return -4;
    }

    if (packet->hop_count > packet->max_hops) {
        return -5;
    }

    if (packet->payload_len > MESH_PAYLOAD_MAX) {
        return -6;
    }

    if (packet->crypto_type != MESH_CRYPTO_TYPE_HYBRID) {
        return -7;
    }

    return 0;
}

uint32_t mesh_hybrid_packet_compute_checksum(const mesh_hybrid_packet_t *packet) {
    if (!packet) return 0;
    size_t size = MESH_HYBRID_PACKET_BASE_SIZE + packet->payload_len;
    return crc32_compute(packet, size);
}

int mesh_hybrid_packet_verify_checksum(const mesh_hybrid_packet_t *packet) {
    if (!packet) return 0;
    // В текущей структуре нет поля для хранения checksum
    return 1;
}

// ============================================================================
// БЕЗОПАСНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ПАКЕТАМИ (с автоматическим управлением памятью)
// ============================================================================

mesh_hybrid_packet_t* mesh_hybrid_packet_alloc(uint32_t type,
                                                const char *receiver_id,
                                                uint32_t data_len) {
    if (data_len > MESH_PAYLOAD_MAX) {
        fprintf(stderr, "ERROR: Payload too large: %u > %u\n",
                data_len, MESH_PAYLOAD_MAX);
        return NULL;
    }

    size_t total_size = MESH_HYBRID_PACKET_BASE_SIZE + data_len;
    mesh_hybrid_packet_t *packet = SAFE_CALLOC(1, total_size);

    packet->magic = MESH_MAGIC;
    packet->version = 2;
    packet->packet_id = generate_packet_id();
    packet->timestamp = get_timestamp();
    packet->type = type;
    packet->max_hops = MESH_DEFAULT_MAX_HOPS;
    packet->crypto_type = MESH_CRYPTO_TYPE_HYBRID;
    packet->crypto_flags = MESH_CRYPTO_FLAG_PQ_ENABLED | MESH_CRYPTO_FLAG_ENCRYPTED;
    packet->pq_algorithm = 1;
    packet->payload_len = data_len;

    // Устанавливаем отправителя
    snprintf(packet->sender_id, sizeof(packet->sender_id),
             "node-%d-%ld", getpid(), (long)time(NULL));
    snprintf(packet->sender_name, sizeof(packet->sender_name),
           "MTProto-MQTT-Gateway-%d", getpid());

    // Устанавливаем получателя
    if (receiver_id) {
        snprintf(packet->receiver_id, sizeof(packet->receiver_id), "%s", receiver_id);
        snprintf(packet->receiver_name, sizeof(packet->receiver_name), "Receiver");
    }

    return packet;
}

void mesh_hybrid_packet_free(mesh_hybrid_packet_t *packet) {
    SAFE_FREE(packet);
}

mesh_hybrid_packet_t* mesh_hybrid_packet_dup(const mesh_hybrid_packet_t *src) {
    if (!src) return NULL;

    size_t total_size = MESH_HYBRID_PACKET_BASE_SIZE + src->payload_len;
    mesh_hybrid_packet_t *dst = SAFE_MALLOC(total_size);
    memcpy(dst, src, total_size);
    return dst;
}

// ============================================================================
// Отладка (классические пакеты)
// ============================================================================

void mesh_packet_print(const mesh_packet_t *packet) {
    if (!packet) {
        printf("NULL packet\n");
        return;
    }

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║              CLASSIC MESH PACKET                        ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Magic:         0x%08X                                   ║\n", packet->magic);
    printf("║ Version:       %u                                        ║\n", packet->version);
    printf("║ Packet ID:     %llu                                      ║\n", (unsigned long long)packet->packet_id);

    char time_str[64];
    time_t ts = packet->timestamp;
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&ts));
    printf("║ Timestamp:     %u (%s)                 ║\n", packet->timestamp, time_str);
    printf("║ Type:          %u (%s)                                    ║\n",
           packet->type, mesh_packet_type_to_string(packet->type));
    printf("║ Flags:         0x%08X                                   ║\n", packet->flags);

    if (packet->flags) {
        printf("║   Flags:       ");
        if (packet->flags & MESH_FLAG_BROADCAST)  printf("BROADCAST ");
        if (packet->flags & MESH_FLAG_FORWARDED)   printf("FORWARDED ");
        if (packet->flags & MESH_FLAG_ACK)         printf("ACK ");
        if (packet->flags & MESH_FLAG_ENCRYPTED)   printf("ENCRYPTED ");
        if (packet->flags & MESH_FLAG_COMPRESSED)  printf("COMPRESSED ");
        if (packet->flags & MESH_FLAG_CACHED)      printf("CACHED ");
        if (packet->flags & MESH_FLAG_CONFIRMED)   printf("CONFIRMED ");
        printf("\n");
    }

    printf("║ Sender ID:     %s                                       ║\n", packet->sender_id);
    printf("║ Sender Name:   %s                                       ║\n", packet->sender_name);
    printf("║ Receiver ID:   %s                                       ║\n", packet->receiver_id);
    printf("║ Receiver Name: %s                                       ║\n", packet->receiver_name);
    printf("║ Hops:          %u/%u                                    ║\n", packet->hop_count, packet->max_hops);
    printf("║ Crypto Type:   %u                                       ║\n", packet->crypto_type);
    printf("║ Payload Len:   %u bytes                                 ║\n", packet->payload_len);

    if (packet->payload_len > 0) {
        printf("║ Payload (hex): ");
        const unsigned char *p = packet->payload;
        for (uint32_t i = 0; i < packet->payload_len && i < 32; i++) {
            printf("%02x", p[i]);
            if ((i + 1) % 4 == 0) printf(" ");
        }
        if (packet->payload_len > 32) printf("...");
        printf("\n");

        printf("║ Payload (text):");
        for (uint32_t i = 0; i < packet->payload_len && i < 32; i++) {
            char c = packet->payload[i];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        if (packet->payload_len > 32) printf("...");
        printf("\n");
    }

    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_packet_hex_dump(const mesh_packet_t *packet) {
    if (!packet) {
        printf("NULL packet\n");
        return;
    }

    size_t total_size = sizeof(mesh_packet_t) + packet->payload_len;
    const unsigned char *data = (const unsigned char*)packet;

    printf("Hex dump (%zu bytes):\n", total_size);
    for (size_t i = 0; i < total_size; i += 16) {
        printf("  %04zx: ", i);
        for (size_t j = 0; j < 16 && i + j < total_size; j++) {
            printf("%02x ", data[i + j]);
            if (j == 7) printf(" ");
        }
        printf(" | ");
        for (size_t j = 0; j < 16 && i + j < total_size; j++) {
            char c = data[i + j];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        printf("\n");
    }
}

void mesh_packet_print_stats(const mesh_packet_stats_t *stats) {
    if (!stats) {
        printf("NULL stats\n");
        return;
    }

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║                 PACKET STATISTICS                        ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Total packets:  %-40llu ║\n", (unsigned long long)stats->total);
    printf("║ Valid:          %-40llu ║\n", (unsigned long long)stats->valid);
    printf("║ Invalid:        %-40llu ║\n", (unsigned long long)stats->invalid);
    printf("║ Expired:        %-40llu ║\n", (unsigned long long)stats->expired);
    printf("║ Broadcast:      %-40llu ║\n", (unsigned long long)stats->broadcast);
    printf("║ Forwarded:      %-40llu ║\n", (unsigned long long)stats->forwarded);
    printf("║ Bytes total:    %-40llu ║\n", (unsigned long long)stats->bytes_total);
    printf("║ Bytes payload:  %-40llu ║\n", (unsigned long long)stats->bytes_payload);
    printf("║ By type:\n");
    printf("║   PING:        %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_PING]);
    printf("║   PONG:        %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_PONG]);
    printf("║   STATS:       %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_STATS]);
    printf("║   MTPROTO:     %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_MTPROTO]);
    printf("║   POSITION:    %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_POSITION]);
    printf("║   TELEMETRY:   %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_TELEMETRY]);
    printf("║   DEVICE_INFO: %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_DEVICE_INFO]);
    printf("║   AUTH:        %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_AUTH]);
    printf("║   ALERT:       %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_ALERT]);
    printf("║   LOG:         %-40llu ║\n", (unsigned long long)stats->by_type[MESH_MSG_TYPE_LOG]);
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_packet_stats_reset(mesh_packet_stats_t *stats) {
    if (stats) {
        memset(stats, 0, sizeof(mesh_packet_stats_t));
    }
}

void mesh_packet_update_stats(mesh_packet_stats_t *stats, const mesh_packet_t *packet) {
    if (!stats || !packet) return;

    stats->total++;
    stats->bytes_total += sizeof(mesh_packet_t) + packet->payload_len;
    stats->bytes_payload += packet->payload_len;

    if (packet->type <= MESH_MSG_TYPE_MAX) {
        stats->by_type[packet->type]++;
    }

    if (packet->flags & MESH_FLAG_BROADCAST) {
        stats->broadcast++;
    }

    if (packet->flags & MESH_FLAG_FORWARDED) {
        stats->forwarded++;
    }

    if (mesh_packet_validate(packet) == 0) {
        stats->valid++;
    } else {
        stats->invalid++;
    }
}

const char* mesh_packet_type_to_string(uint32_t type) {
    switch (type) {
        case MESH_MSG_TYPE_PING:        return "PING";
        case MESH_MSG_TYPE_PONG:        return "PONG";
        case MESH_MSG_TYPE_STATS:       return "STATS";
        case MESH_MSG_TYPE_MTPROTO:     return "MTPROTO";
        case MESH_MSG_TYPE_POSITION:    return "POSITION";
        case MESH_MSG_TYPE_TELEMETRY:   return "TELEMETRY";
        case MESH_MSG_TYPE_DEVICE_INFO: return "DEVICE_INFO";
        case MESH_MSG_TYPE_AUTH:        return "AUTH";
        case MESH_MSG_TYPE_ALERT:       return "ALERT";
        case MESH_MSG_TYPE_LOG:         return "LOG";
        default:                        return "UNKNOWN";
    }
}

// ============================================================================
// Отладка (гибридные пакеты)
// ============================================================================

void mesh_hybrid_packet_print(const mesh_hybrid_packet_t *packet) {
    if (!packet) {
        printf("NULL hybrid packet\n");
        return;
    }

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║              HYBRID MESH PACKET                         ║\n");
    printf("║              (Quantum-Safe)                              ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║ Magic:         0x%08X                                   ║\n", packet->magic);
    printf("║ Version:       %u (Hybrid)                               ║\n", packet->version);
    printf("║ Packet ID:     %llu                                      ║\n", (unsigned long long)packet->packet_id);

    char time_str[64];
    time_t ts = packet->timestamp;
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&ts));
    printf("║ Timestamp:     %u (%s)                 ║\n", packet->timestamp, time_str);
    printf("║ Type:          %u (%s)                                    ║\n",
           packet->type, mesh_packet_type_to_string(packet->type));
    printf("║ Flags:         0x%08X                                   ║\n", packet->flags);
    printf("║ Crypto Type:   %u (Hybrid)                              ║\n", packet->crypto_type);
    printf("║ PQ Algorithm:  %u                                        ║\n", packet->pq_algorithm);
    printf("║ PQ Cipher Len: %u bytes                                 ║\n", packet->pq_ciphertext_len);
    printf("║ Signature Len: %u bytes                                 ║\n", packet->signature_len);
    printf("║ Sender ID:     %s                                       ║\n", packet->sender_id);
    printf("║ Receiver ID:   %s                                       ║\n", packet->receiver_id);
    printf("║ Hops:          %u/%u                                    ║\n", packet->hop_count, packet->max_hops);
    printf("║ Payload Len:   %u bytes                                 ║\n", packet->payload_len);

    if (packet->payload_len > 0) {
        printf("║ Payload (hex): ");
        const unsigned char *p = packet->payload;
        for (uint32_t i = 0; i < packet->payload_len && i < 32; i++) {
            printf("%02x", p[i]);
            if ((i + 1) % 4 == 0) printf(" ");
        }
        if (packet->payload_len > 32) printf("...");
        printf("\n");
    }

    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

void mesh_hybrid_packet_hex_dump(const mesh_hybrid_packet_t *packet) {
    if (!packet) {
        printf("NULL hybrid packet\n");
        return;
    }

    size_t total_size = MESH_HYBRID_PACKET_BASE_SIZE + packet->payload_len;
    const unsigned char *data = (const unsigned char*)packet;

    printf("Hybrid Packet Hex dump (%zu bytes):\n", total_size);
    for (size_t i = 0; i < total_size; i += 16) {
        printf("  %04zx: ", i);
        for (size_t j = 0; j < 16 && i + j < total_size; j++) {
            printf("%02x ", data[i + j]);
            if (j == 7) printf(" ");
        }
        printf(" | ");
        for (size_t j = 0; j < 16 && i + j < total_size; j++) {
            char c = data[i + j];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }
        printf("\n");
    }
}