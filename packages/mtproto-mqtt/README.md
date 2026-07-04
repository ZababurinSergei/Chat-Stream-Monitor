```markdown
# MTProto MQTT Test Module

Модуль для тестирования интеграции MQTT (OneMesh) с MTProto Proxy.

## 📋 Описание

Этот модуль предоставляет отдельную сборку для тестирования MQTT-функциональности, которая будет интегрирована в MTProto Proxy. Он позволяет:

- Подключаться к MQTT-брокеру OneMesh (`mqtt.onemesh.ru`)
- Отправлять и получать Mesh-пакеты
- Тестировать шифрование и дешифрование
- Валидировать форматы пакетов
- Измерять производительность

## 🏗️ Архитектура

```
mtproto-mqtt-test/
├── src/
│   ├── main.c                 # Точка входа
│   ├── mesh-mqtt.h            # Заголовочный файл MQTT модуля
│   ├── mesh-mqtt.c            # Реализация MQTT модуля
│   ├── mesh-packet.h          # Форматы пакетов
│   ├── mesh-packet.c          # Работа с пакетами
│   ├── test-utils.h           # Утилиты для тестирования
│   └── test-utils.c           # Реализация утилит
├── tests/
│   ├── test_basic.c           # Базовые тесты
│   ├── test_encryption.c      # Тесты шифрования
│   └── test_integration.c     # Интеграционные тесты
├── build/                     # Объектные файлы
├── bin/                       # Исполняемые файлы
├── Makefile
└── README.md
```

## 📦 Зависимости

### Обязательные

```bash
# Ubuntu/Debian
sudo apt-get install build-essential
sudo apt-get install libpaho-mqtt-dev
sudo apt-get install libssl-dev
sudo apt-get install libmosquitto-dev  # Альтернатива

# CentOS/RHEL
sudo yum install gcc make
sudo yum install paho-c paho-c-devel
sudo yum install openssl-devel
sudo yum install mosquitto-devel  # Альтернатива

# Arch Linux
sudo pacman -S gcc make
sudo pacman -S paho-c
sudo pacman -S openssl
```

### Опциональные

```bash
# Для отладки
sudo apt-get install valgrind
sudo apt-get install gdb

# Для анализа производительности
sudo apt-get install perf
sudo apt-get install sysstat
```

## 🔧 Установка и сборка

### 1. Клонирование

```bash
git clone https://github.com/your-repo/mtproto-mqtt-test.git
cd mtproto-mqtt-test
```

### 2. Сборка

```bash
# Основная сборка
make

# Сборка с отладочной информацией
make CFLAGS="-g -O0"

# Сборка с поддержкой Mosquitto вместо Paho
make USE_PAHO=0

# Чистая сборка
make clean && make
```

### 3. Тестирование

```bash
# Запуск всех тестов
make test

# Запуск отдельных тестов
./tests/test_basic
./tests/test_encryption
./tests/test_integration

# Запуск с аргументами
./tests/test_basic -v
./tests/test_integration -c SPB -s "Hello"
```

## 🚀 Использование

### Базовое использование

```bash
# Запуск с настройками по умолчанию (SPB)
./bin/mtproto-mqtt-test

# Запуск для конкретного города
./bin/mtproto-mqtt-test -c SPB   # Санкт-Петербург
./bin/mtproto-mqtt-test -c MOS   # Москва
./bin/mtproto-mqtt-test -c KRD   # Краснодар
./bin/mtproto-mqtt-test -c EKB   # Екатеринбург

# Вербозный режим
./bin/mtproto-mqtt-test -v

# Отправка тестового сообщения
./bin/mtproto-mqtt-test -s "Hello Mesh!" -r node-123

# Подключение к другому брокеру
./bin/mtproto-mqtt-test -b "ssl://custom-broker:8883" -u user -p pass

# Помощь
./bin/mtproto-mqtt-test -h
```

### Расширенное использование

```bash
# Запуск с пользовательским топиком
./bin/mtproto-mqtt-test -t "msh/RU/SPB/test"

# Отправка пакета с данными
./bin/mtproto-mqtt-test -s "Test data" -r "receiver-node"

# Запуск с таймаутом
./bin/mtproto-mqtt-test --timeout 30

# Многократное выполнение
./bin/mtproto-mqtt-test --iterations 100

# Использование конфигурационного файла
./bin/mtproto-mqtt-test --config config.json
```

## ⚙️ Конфигурация

### Переменные окружения

```bash
# Настройка брокера
export MQTT_BROKER="ssl://mqtt.onemesh.ru:8883"
export MQTT_USERNAME="onemesh"
export MQTT_PASSWORD="onecat"

# Настройка города
export MESH_CITY_CODE="SPB"

# Уровень логирования
export MESH_LOG_LEVEL=debug  # debug, info, warn, error

# Запуск с переменными окружения
./bin/mtproto-mqtt-test
```

### Конфигурационный файл (JSON)

```json
{
    "broker": "ssl://mqtt.onemesh.ru:8883",
    "username": "onemesh",
    "password": "onecat",
    "city": "SPB",
    "topic_root": "msh/RU/SPB",
    "use_tls": true,
    "keepalive": 60,
    "qos": 1,
    "retain": false,
    "verbose": true
}
```

```bash
# Использование конфига
./bin/mtproto-mqtt-test --config config.json
```

## 🧪 Тестирование

### Структура тестов

| Тест | Описание |
|------|----------|
| `test_basic` | Базовые тесты: создание пакетов, парсинг, валидация |
| `test_encryption` | Тесты шифрования и дешифрования |
| `test_integration` | Интеграционные тесты с реальным брокером |

### Запуск всех тестов

```bash
make test
```

### Результаты тестов

```
=== Running Basic Tests ===

🧪 Testing packet creation...
✅ Packet creation test passed

🧪 Testing packet printing...

=== Mesh Packet ===
Magic: 0x4D455348
Version: 1
Packet ID: 1234567890
...

✅ Packet printing test passed

🧪 Testing config initialization...
✅ Config initialization test passed

✅ All basic tests passed!
```

## 📊 Статистика

### Просмотр статистики

```bash
# Во время работы нажмите Ctrl+C для вывода статистики
./bin/mtproto-mqtt-test -c SPB

# Или используйте отдельную команду
./bin/mtproto-mqtt-test --stats
```

### Пример вывода

```
=== MQTT Stats ===
Initialized: Yes
Connected: Yes
Connected since: Tue Jan  1 12:00:00 2024
Packets sent: 123
Packets received: 456
Packets dropped: 0
Bytes sent: 12345
Bytes received: 67890
Errors: 0
Reconnects: 0
Last activity: Tue Jan  1 12:05:00 2024
===================
```

## 🔍 Отладка

### Логирование

```bash
# Включить подробное логирование
./bin/mtproto-mqtt-test -v

# Установить уровень логирования
export MESH_LOG_LEVEL=debug
./bin/mtproto-mqtt-test
```

### GDB

```bash
# Запуск под GDB
gdb ./bin/mtproto-mqtt-test
(gdb) run -c SPB -v

# Получение backtrace
(gdb) bt full

# Точки останова
(gdb) break mesh_mqtt_connect
(gdb) break mesh_mqtt_send
(gdb) continue
```

### Valgrind

```bash
# Проверка утечек памяти
valgrind --leak-check=full ./bin/mtproto-mqtt-test -c SPB

# Проверка с подробным выводом
valgrind --leak-check=full --show-leak-kinds=all ./bin/mtproto-mqtt-test -c SPB
```

## 📝 Примеры кода

### Базовое подключение

```c
#include "mesh-mqtt.h"

int main() {
    // Инициализация с настройками по умолчанию
    mesh_mqtt_init_default();
    
    // Подключение
    mesh_mqtt_connect();
    
    // Подписка на все топики
    mesh_mqtt_subscribe_all();
    
    // Отправка сообщения
    mesh_mqtt_send_to("receiver-node", MESH_MSG_TYPE_PING, 
                     "Hello Mesh!", 11);
    
    // Ожидание
    sleep(10);
    
    // Очистка
    mesh_mqtt_cleanup();
    return 0;
}
```

### С кастомными колбэками

```c
#include "mesh-mqtt.h"

void on_message(const mesh_packet_t *packet) {
    printf("Received packet: %llu\n", packet->packet_id);
    mesh_packet_print(packet);
}

int main() {
    mesh_mqtt_callbacks_t callbacks = {
        .on_message = on_message,
        .on_connect = NULL,
        .on_disconnect = NULL,
        .on_error = NULL
    };
    
    mesh_mqtt_config_t config = {0};
    snprintf(config.broker, sizeof(config.broker), "ssl://mqtt.onemesh.ru:8883");
    snprintf(config.username, sizeof(config.username), "onemesh");
    snprintf(config.password, sizeof(config.password), "onecat");
    snprintf(config.topic_root, sizeof(config.topic_root), "msh/RU/SPB");
    config.use_tls = 1;
    
    mesh_mqtt_init(&config);
    mesh_mqtt_set_callbacks(&callbacks);
    mesh_mqtt_connect();
    mesh_mqtt_subscribe_all();
    
    while (1) {
        sleep(1);
    }
    
    mesh_mqtt_cleanup();
    return 0;
}
```

## 🔄 Интеграция с MTProto

### Шаг 1: Добавление файлов

```bash
# Копирование MQTT модуля в MTProto проект
cp src/mesh-mqtt.* /path/to/mtproto/common/
cp src/mesh-packet.* /path/to/mtproto/common/
```

### Шаг 2: Модификация Makefile

```makefile
# В Makefile MTProto добавьте:
MQTT_SRC = common/mesh-mqtt.c common/mesh-packet.c
MQTT_OBJ = $(addprefix $(OBJ)/, $(MQTT_SRC:.c=.o))

PROXY_OBJS += $(MQTT_OBJ)
LDFLAGS += -lpaho-mqtt3c -lssl -lcrypto
```

### Шаг 3: Интеграция в код

```c
// В mtproto/mtproto-proxy.c

#include "common/mesh-mqtt.h"

static void init_mesh_mqtt(void) {
    mesh_mqtt_config_t config = {0};
    // Загружаем настройки из конфига
    
    mesh_mqtt_callbacks_t callbacks = {
        .on_message = mesh_on_message_received,
        .on_connect = mesh_on_connect,
        .on_disconnect = mesh_on_disconnect,
        .on_error = mesh_on_error
    };
    
    mesh_mqtt_init(&config);
    mesh_mqtt_set_callbacks(&callbacks);
    mesh_mqtt_connect();
    mesh_mqtt_subscribe_all();
}

static int send_via_mqtt(struct raw_message *msg, const char *dest_node) {
    // Создаем Mesh-пакет с MTProto данными
    return mesh_mqtt_send_to(dest_node, MESH_MSG_TYPE_MTPROTO,
                            msg->data, msg->len);
}

// В main() добавьте:
init_mesh_mqtt();
```

## 🐛 Известные проблемы

### TLS/SSL ошибки

```bash
# Если возникают ошибки TLS:
# 1. Проверьте системные сертификаты
ls -la /etc/ssl/certs/

# 2. Обновите сертификаты
sudo update-ca-certificates

# 3. Используйте отключение проверки (только для тестов!)
# (не рекомендуется для продакшена)
```

### Подключение к OneMesh

```bash
# Проверка доступности брокера
ping mqtt.onemesh.ru
telnet mqtt.onemesh.ru 8883

# Проверка DNS
dig mqtt.onemesh.ru

# Проверка через openssl
openssl s_client -connect mqtt.onemesh.ru:8883 -tls1_2
```

## 📚 Документация

### Внутренняя документация

```bash
# Генерация документации Doxygen
doxygen Doxyfile
```

### Полезные ссылки

- [OneMesh MQTT](https://onemesh.ru/)
- [Paho MQTT C Client](https://www.eclipse.org/paho/index.php?page=clients/c/index.php)
- [Mosquitto MQTT Client](https://mosquitto.org/)
- [MTProto Protocol](https://core.telegram.org/mtproto)

## 🤝 Вклад в проект

### Отчет об ошибках

1. Создайте issue в GitHub
2. Опишите проблему
3. Приложите логи (с `-v`)
4. Укажите версию и окружение

### Запросы на улучшение

1. Форкните репозиторий
2. Создайте ветку с функцией
3. Внесите изменения
4. Создайте Pull Request

### Стиль кода

```bash
# Используйте clang-format
clang-format -i src/*.c src/*.h

# Проверка стиля
cppcheck src/
```

## 📄 Лицензия

MIT License

Copyright (c) 2024 MTProto MQTT Test Module

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 👥 Авторы

- MTProto MQTT Test Module Team
- OneMesh Community

## 🙏 Благодарности

- Eclipse Foundation за Paho MQTT
- OneMesh за предоставление MQTT-сервера
- Meshtastic сообщество
- Команда Telegram за MTProto

---

**Последнее обновление:** January 2024

**Версия:** 1.0.0

**Статус:** ✅ Стабильный
```

Полный файл `README.md` содержит всю необходимую информацию для использования, тестирования и интеграции MQTT-модуля с MTProto Proxy. 🚀



# 1. Установка зависимостей
sudo apt-get update
sudo apt-get install -y build-essential cmake
sudo apt-get install -y libssl-dev

# 2. Скачивание и сборка Paho MQTT C
cd /tmp
git clone https://github.com/eclipse/paho.mqtt.c.git
cd paho.mqtt.c

# 3. Сборка и установка
make
sudo make install

# 4. Обновление библиотек
sudo ldconfig

# 5. Проверка установки
ls -la /usr/local/lib/libpaho*
ls -la /usr/local/include/MQTTClient.h


Для добавления квантовой защиты в ваш проект на C идеально подходит библиотека **liboqs** (Open Quantum Safe). Она предоставляет реализации квантово-безопасных алгоритмов, стандартизированных NIST .

## 🔐 Что такое liboqs?

`liboqs` — это библиотека на C, которая содержит реализации:
- **KEM** (Key Encapsulation Mechanisms) — для безопасного обмена ключами
- **Цифровых подписей** — для аутентификации

Она является частью проекта Open Quantum Safe (OQS) при поддержке Linux Foundation . Библиотека включает алгоритмы, которые уже стали или становятся стандартами, например, **ML-KEM** и **ML-DSA** (ранее известные как Kyber и Dilithium) .

## 📦 Поддержка алгоритмов в liboqs

**KEM (для обмена ключами):**
- `ML-KEM-512`, `ML-KEM-768`, `ML-KEM-1024` (рекомендованы NIST) 
- `Kyber512`, `Kyber768`, `Kyber1024` 
- `FrodoKEM`, `Classic McEliece`, `BIKE`, `HQC` 

**Цифровые подписи:**
- `ML-DSA-44`, `ML-DSA-65`, `ML-DSA-87` (рекомендованы NIST) 
- `Falcon-512`, `Falcon-1024` 
- `SPHINCS+` 

> **Важно:** `liboqs` уже содержит стабильные реализации ML-KEM и ML-DSA. Для большинства приложений рекомендуется использовать именно их .

## 🛠️ Интеграция в ваш проект

### 1. Установка liboqs

```bash
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=/usr/local ..
make
sudo make install
```

### 2. Подключение в Makefile

```makefile
CFLAGS += -I/usr/local/include
LDFLAGS += -loqs -lssl -lcrypto
```

### 3. Использование в коде

Пример обмена ключами с использованием **ML-KEM-768** :

```c
#include <oqs/oqs.h>
#include <stdio.h>
#include <string.h>

int main() {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_ml_kem_768);
    if (!kem) {
        printf("ML-KEM-768 не доступен\n");
        return 1;
    }

    // Буферы для ключей и общих секретов
    uint8_t public_key[OQS_KEM_ml_kem_768_length_public_key];
    uint8_t secret_key[OQS_KEM_ml_kem_768_length_secret_key];
    uint8_t ciphertext[OQS_KEM_ml_kem_768_length_ciphertext];
    uint8_t shared_secret_a[OQS_KEM_ml_kem_768_length_shared_secret];
    uint8_t shared_secret_b[OQS_KEM_ml_kem_768_length_shared_secret];

    // 1. Генерация пары ключей
    OQS_KEM_keypair(kem, public_key, secret_key);

    // 2. Сторона А: инкапсуляция (шифрование общего секрета)
    OQS_KEM_encaps(kem, ciphertext, shared_secret_a, public_key);

    // 3. Сторона Б: декапсуляция (восстановление общего секрета)
    OQS_KEM_decaps(kem, shared_secret_b, ciphertext, secret_key);

    // Общие секреты идентичны! 
    // shared_secret_a == shared_secret_b

    OQS_KEM_free(kem);
    return 0;
}
```

## 🛡️ Практические рекомендации

### 1. Гибридный подход (Рекомендуется)

Комбинируйте классическую криптографию (например, ECDH) с квантово-безопасной .

```c
// Гибридный обмен ключами: ECDH + ML-KEM
unsigned char ecdh_secret[32];
unsigned char pq_secret[OQS_KEM_ml_kem_768_length_shared_secret];

// 1. Классический ECDH (как у вас сейчас)
ecdh(ephemeral_private, receiver_public, ecdh_secret);

// 2. Квантово-безопасный ML-KEM
OQS_KEM_encaps(kem, ciphertext, pq_secret, receiver_pq_public);

// 3. Комбинируем секреты
unsigned char combined_secret[64];
memcpy(combined_secret, ecdh_secret, 32);
memcpy(combined_secret + 32, pq_secret, 32);

// 4. Используем HKDF для получения итогового ключа
mesh_crypto_hkdf(combined_secret, 64, ..., final_key, ...);
```

### 2. Для подписей (аутентификация)

```c
#include <oqs/oqs.h>

void sign_and_verify() {
    OQS_SIG *sig = OQS_SIG_new(OQS_SIG_alg_ml_dsa_65);
    
    uint8_t public_key[OQS_SIG_ml_dsa_65_length_public_key];
    uint8_t secret_key[OQS_SIG_ml_dsa_65_length_secret_key];
    uint8_t message[] = "Secure Mesh Message";
    uint8_t signature[OQS_SIG_ml_dsa_65_length_signature];
    size_t sig_len;

    // Генерация ключей
    OQS_SIG_keypair(sig, public_key, secret_key);
    
    // Подпись
    OQS_SIG_sign(sig, signature, &sig_len, message, sizeof(message), secret_key);
    
    // Верификация
    if (OQS_SIG_verify(sig, message, sizeof(message), signature, sig_len, public_key) == OQS_SUCCESS) {
        printf("Подпись валидна!\n");
    }
}
```

### 3. Для вашей Mesh-сети

Вместо того чтобы вычислять публичный ключ из ID, теперь каждый пользователь может иметь **квантово-безопасный публичный ключ**:

```c
mesh_user_t user;
mesh_user_init(&user, "@alice", "secret");

// Генерируем квантово-безопасные ключи
OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_ml_kem_768);
uint8_t pq_public_key[...]; // Публикуется в топике
uint8_t pq_secret_key[...]; // Хранится у пользователя

// При отправке: используем PQ KEM для обмена ключом
// Вместо ECDH используем ML-KEM
```

## ⚠️ Важные предупреждения

1. **Безопасность не доказана** — квантово-безопасные алгоритмы новы и могут быть взломаны в будущем .

2. **Используйте гибридный подход** — комбинируйте с классической криптографией для защиты .

3. **Следите за обновлениями** — алгоритмы могут меняться .

4. **Производительность** — некоторые алгоритмы могут быть медленнее .

## 💎 Итог

Для добавления квантовой защиты в ваш проект:

1. **Установите liboqs** — основная библиотека
2. **Замените ECDH на ML-KEM** или используйте гибридный подход
3. **Добавьте ML-DSA для подписей** вместо Ed25519
4. **Следуйте рекомендациям NIST**

**Помните:** квантово-безопасная криптография — это защита на будущее. Внедряйте её сейчас, чтобы ваша Mesh-сеть была безопасна против квантовых компьютеров завтра! 🚀


# 1. Установка liboqs
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=/usr/local ..
make
sudo make install

# 2. Сборка проекта
make clean
make

# 3. Проверка поддержки PQ
./bin/mtproto-mqtt-test --check-pq

# 4. Тест гибридной криптографии
./bin/mtproto-mqtt-test --test-hybrid

# 5. Запуск
./bin/mtproto-mqtt-test -c SPB -v