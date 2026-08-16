# MTProto MQTT Gateway - Интерфейс и Команды

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Сборка проекта](#сборка-проекта)
3. [Зависимости](#зависимости)
4. [Установка liboqs (пост-квантовая криптография)](#установка-liboqs-пост-квантовая-криптография)
5. [Тестирование подключения](#тестирование-подключения)
6. [Запуск шлюза](#запуск-шлюза)
7. [Доступные команды](#доступные-команды)
8. [Опции командной строки](#опции-командной-строки)
9. [Тестирование криптографии](#тестирование-криптографии)
10. [Отладка](#отладка)
11. [Очистка](#очистка)

---

## 🚀 Быстрый старт

### Шаг 1: Перейти в директорию проекта

```bash
cd packages/mtproto-mqtt
```

### Шаг 2: Установить liboqs (опционально, для PQ криптографии)

```bash
./install-liboqs.sh
```

### Шаг 3: Сделать скрипт сборки исполняемым

```bash
chmod +x rebuild.sh
```

### Шаг 4: Собрать проект

```bash
./rebuild.sh
```

### Шаг 5: Проверить подключение к MQTT

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Шаг 6: Запустить шлюз

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

---

## 📦 Сборка проекта

### Автоматическая сборка (рекомендуется)

#### Полная сборка с тестом

```bash
./rebuild.sh
```

#### Сборка с отладкой

```bash
./rebuild.sh -d
```

#### Полная пересборка (очистка + сборка)

```bash
./rebuild.sh -f
```

#### Сборка без теста подключения

```bash
./rebuild.sh --no-test
```

#### Сборка и запуск в GDB

```bash
./rebuild.sh -g
```

#### Сборка и запуск с Valgrind

```bash
./rebuild.sh -v
```

### Ручная сборка

#### Создание директорий

```bash
mkdir -p build bin
```

#### Компиляция всех исходников

```bash
gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE -std=c99 \
    -DUSE_PAHO_MQTT \
    -Isrc -Iinclude -I/usr/local/include \
    -c src/*.c -o build/
```

#### Линковка

```bash
gcc -o bin/mtproto-mqtt-gateway build/*.o \
    -lpthread -lm -lpaho-mqtt3c -lssl -lcrypto \
    -L/usr/local/lib
```

---

## 📚 Зависимости

### Обязательные

#### Установка GCC

```bash
sudo apt install build-essential
```

#### Установка Make

```bash
sudo apt install make
```

#### Установка Paho MQTT C

```bash
sudo apt install libpaho-mqtt-dev
```

#### Установка OpenSSL

```bash
sudo apt install libssl-dev
```

### Опциональные (для пост-квантовой криптографии)

#### Установка liboqs через скрипт

```bash
./install-liboqs.sh
```

#### Установка liboqs вручную

```bash
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=/usr/local ..
make -j$(nproc)
sudo make install
sudo ldconfig
```

### Проверка зависимостей

#### Автоматическая проверка

```bash
./rebuild.sh
```

#### Проверка Paho MQTT

```bash
ldconfig -p | grep libpaho
```

#### Проверка OpenSSL

```bash
ldconfig -p | grep libssl
```

#### Проверка liboqs

```bash
ldconfig -p | grep liboqs
pkg-config --cflags liboqs
```

#### Проверка через pkg-config

```bash
pkg-config --libs paho-mqtt3c
pkg-config --cflags liboqs
```

---

## 🔐 Установка liboqs (пост-квантовая криптография)

### Что такое liboqs?

**liboqs** - это библиотека с открытым исходным кодом для квантово-безопасных криптографических алгоритмов. Она предоставляет:

- Реализации KEM (Key Encapsulation Mechanisms) и цифровых подписей
- Поддержка алгоритмов ML-KEM, ML-DSA, Falcon, SPHINCS+ и других
- Единый API для всех алгоритмов
- Тесты и бенчмарки

### Установка через скрипт (рекомендуется)

#### Запуск скрипта установки

```bash
./install-liboqs.sh
```

#### Установка с автоматическим подтверждением

```bash
echo "y" | ./install-liboqs.sh
```

### Ручная установка

#### 1. Установка зависимостей

```bash
sudo apt update
sudo apt install -y build-essential cmake git ninja-build libssl-dev \
    python3 python3-pytest python3-pytest-xdist unzip xsltproc \
    doxygen graphviz python3-yaml valgrind
```

#### 2. Клонирование репозитория

```bash
git clone -b main https://github.com/open-quantum-safe/liboqs.git
cd liboqs
```

#### 3. Сборка

```bash
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_SHARED_LIBS=ON ..
make -j$(nproc)
```

#### 4. Установка

```bash
sudo make install
sudo ldconfig
```

#### 5. Проверка

```bash
pkg-config --exists liboqs && echo "✅ liboqs installed" || echo "❌ liboqs not found"
```

### Проверка установки liboqs

#### Проверка через pkg-config

```bash
pkg-config --exists liboqs && echo "✅ Found" || echo "❌ Not found"
pkg-config --modversion liboqs
pkg-config --cflags liboqs
pkg-config --libs liboqs
```

#### Проверка через ldconfig

```bash
ldconfig -p | grep liboqs
```

#### Проверка заголовочных файлов

```bash
ls -la /usr/local/include/oqs/oqs.h
ls -la /usr/include/oqs/oqs.h
```

#### Проверка библиотек

```bash
ls -la /usr/local/lib/liboqs.*
ls -la /usr/lib/liboqs.*
```

### Тест компиляции с liboqs

```bash
cat > test.c << 'EOF'
#include <oqs/oqs.h>
#include <stdio.h>

int main() {
    printf("liboqs version: %s\n", OQS_VERSION_TEXT);
    printf("Supported KEM algorithms:\n");
    for (size_t i = 0; i < OQS_KEM_algs_length; i++) {
        printf("  %s\n", OQS_KEM_alg_identifier(i));
    }
    return 0;
}
EOF

gcc -o test test.c -loqs && ./test
rm -f test test.c
```

### Поддерживаемые алгоритмы liboqs

#### KEM (Key Encapsulation Mechanisms)

| Алгоритм | Статус | Описание |
|----------|--------|----------|
| **ML-KEM** | ✅ Стандартизирован | Основной квантово-безопасный KEM |
| **Kyber** | ✅ Стандартизирован | Основа ML-KEM |
| **FrodoKEM** | 🔄 На рассмотрении | На основе LWE |
| **Classic McEliece** | 🔄 На рассмотрении | Классический код |
| **NTRU** | 🔄 На рассмотрении | На основе решеток |
| **BIKE** | 🔄 На рассмотрении | На основе кодов |

#### Подписи (Signature schemes)

| Алгоритм | Статус | Описание |
|----------|--------|----------|
| **ML-DSA** | ✅ Стандартизирован | Основная квантово-безопасная подпись |
| **Falcon** | 🔄 На рассмотрении | Быстрая подпись на решетках |
| **SLH-DSA (SPHINCS+)** | 🔄 На рассмотрении | Безопасная подпись на хешах |
| **LMS** | ✅ Стандартизирован | Подпись с состоянием |
| **XMSS** | ✅ Стандартизирован | Подпись с состоянием |

### Устранение проблем при установке liboqs

#### Ошибка: CMake не найден

```bash
sudo apt install cmake
```

#### Ошибка: Недостаточно прав

```bash
# Используйте sudo для установки
sudo make install
```

#### Ошибка: Не найден OpenSSL

```bash
sudo apt install libssl-dev
```

#### Ошибка: Не найден pkg-config

```bash
sudo apt install pkg-config
```

#### Ошибка: Не найден ninja

```bash
sudo apt install ninja-build
# Или используйте make:
cmake .. && make -j$(nproc)
```

---

## 🔌 Тестирование подключения

### Базовый тест подключения

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Тест с подробным выводом

```bash
./bin/mtproto-mqtt-gateway --test-connect -v
```

### Тест с указанием брокера

```bash
./bin/mtproto-mqtt-gateway --test-connect -b tcp://mqtt.onemesh.ru:1883
```

### Ожидаемый вывод теста

```bash
# ✅ Connection successful!
# ✅ Client is connected
# 📡 Subscribed to topics...
# 📤 Sending test message...
```

### Настройки подключения по умолчанию

```yaml
Broker:   tcp://mqtt.onemesh.ru:1883
User:     onemeshd
Password: onecat
City:     SPB
Topic:    msh/RU/SPB
```

---

## 🚀 Запуск шлюза

### Базовый запуск

#### Запуск с городом по умолчанию (SPB)

```bash
./bin/mtproto-mqtt-gateway
```

#### Запуск с указанием города

```bash
./bin/mtproto-mqtt-gateway -c MOS
```

#### Запуск с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

### Запуск для разных городов

#### Санкт-Петербург

```bash
./bin/mtproto-mqtt-gateway -c SPB
```

#### Москва

```bash
./bin/mtproto-mqtt-gateway -c MOS
```

#### Краснодар

```bash
./bin/mtproto-mqtt-gateway -c KRD
```

#### Екатеринбург

```bash
./bin/mtproto-mqtt-gateway -c EKB
```

#### Новосибирск

```bash
./bin/mtproto-mqtt-gateway -c NSK
```

#### Казань

```bash
./bin/mtproto-mqtt-gateway -c KZN
```

#### Владивосток

```bash
./bin/mtproto-mqtt-gateway -c VVO
```

#### Сочи

```bash
./bin/mtproto-mqtt-gateway -c SOCH
```

#### Крым

```bash
./bin/mtproto-mqtt-gateway -c CRM
```

### Отправка тестового сообщения

#### Отправить сообщение в broadcast

```bash
./bin/mtproto-mqtt-gateway -s "Hello Mesh!"
```

#### Отправить сообщение конкретному получателю

```bash
./bin/mtproto-mqtt-gateway -s "Hello Bob!" -r @bob
```

#### Отправить с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -s "Test" -v
```

---

## 📖 Доступные команды

### Основные команды

#### Тест подключения к MQTT брокеру

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

#### Проверка поддержки пост-квантовой криптографии

```bash
./bin/mtproto-mqtt-gateway --check-pq
```

#### Тест базовой криптографии

```bash
./bin/mtproto-mqtt-gateway --test-crypto
```

#### Тест гибридной криптографии (ECDH + ML-KEM)

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

#### Тест нескольких сообщений

```bash
./bin/mtproto-mqtt-gateway --test-multi
```

#### Стресс-тест (100 сообщений)

```bash
./bin/mtproto-mqtt-gateway --test-stress
```

#### Показать справку

```bash
./bin/mtproto-mqtt-gateway --help
```

### Примеры использования

#### Проверка PQ алгоритмов

```bash
./bin/mtproto-mqtt-gateway --check-pq
```

#### Тест гибридной криптографии

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

#### Стресс-тест

```bash
./bin/mtproto-mqtt-gateway --test-stress
```

---

## ⚙️ Опции командной строки

### Параметры подключения

#### Адрес MQTT брокера

```bash
./bin/mtproto-mqtt-gateway -b tcp://mqtt.onemesh.ru:1883
```

#### Хост брокера

```bash
./bin/mtproto-mqtt-gateway -H mqtt.onemesh.ru
```

#### Порт брокера

```bash
./bin/mtproto-mqtt-gateway -p 1883
```

#### Имя пользователя

```bash
./bin/mtproto-mqtt-gateway -u onemeshd
```

#### Пароль

```bash
./bin/mtproto-mqtt-gateway -P onecat
```

### Параметры топиков

#### Код города

```bash
./bin/mtproto-mqtt-gateway -c SPB
```

#### Корневой топик

```bash
./bin/mtproto-mqtt-gateway -t msh/RU/SPB
```

### Параметры сообщений

#### Отправить тестовое сообщение

```bash
./bin/mtproto-mqtt-gateway -s "Hello World!"
```

#### ID получателя для тестового сообщения

```bash
./bin/mtproto-mqtt-gateway -s "Hello" -r @bob
```

### Общие параметры

#### Подробный вывод

```bash
./bin/mtproto-mqtt-gateway -v
```

#### Показать справку

```bash
./bin/mtproto-mqtt-gateway -h
```

### Примеры с опциями

#### Подключение к другому брокеру

```bash
./bin/mtproto-mqtt-gateway -b tcp://localhost:1883 -u test -P test123
```

#### Отправка сообщения в Москву

```bash
./bin/mtproto-mqtt-gateway -c MOS -s "Hello Moscow!" -v
```

#### Подключение с TLS

```bash
./bin/mtproto-mqtt-gateway -b ssl://mqtt.onemesh.ru:8883 -u onemeshd -P onecat
```

---

## 🔐 Тестирование криптографии

### Базовая криптография

```bash
./bin/mtproto-mqtt-gateway --test-crypto
```

#### Ожидаемый вывод:

```bash
# 🔐 Testing basic crypto...
#   Random key1: a1b2c3d4...
#   Random key2: e5f6g7h8...
# ✅ Basic crypto test passed!
```

### Гибридная криптография (ECDH + ML-KEM)

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

#### Ожидаемый вывод:

```bash
# 🔐 Testing hybrid crypto (ECDH + ML-KEM)...
#   Max packet size: 131072 bytes
#   Buffer size: 147456 bytes
# ✅ Registry initialized
# ✅ PQ algorithms supported
#   Version: Hybrid: ECDH + ML-KEM-768 + ML-DSA-65
# ✅ Memory allocated on HEAP for users
#   alice at 0x7f8..., size 9440
#   bob at 0x7f9..., size 9440
# 👤 Alice: ... (keys info)
# 👤 Bob: ... (keys info)
# 📤 Alice encrypting message for Bob...
#   Message: 'Hello Bob! This is Alice with hybrid crypto!'
# ✅ Encrypted packet size: 1234 bytes
# 📥 Bob decrypting message...
# ✅ Decrypted: 'Hello Bob! This is Alice with hybrid crypto!'
# ✅ Hybrid crypto test passed!
#   Memory: All buffers were allocated on HEAP and cleaned up
```

### Множественные сообщения

```bash
./bin/mtproto-mqtt-gateway --test-multi
```

#### Ожидаемый вывод:

```bash
# 📨 Testing multiple messages with heap allocation...
# 📤 Message 1: 'Hello Bob!'
#   Packet size: 1094 bytes
#   Decrypted: 'Hello Bob!'
#   ✅ Match!
# ...
# 📊 Results: 4/4 messages succeeded
# ✅ All messages tested successfully!
```

### Стресс-тест

```bash
./bin/mtproto-mqtt-gateway --test-stress
```

#### Ожидаемый вывод:

```bash
# 🔥 Stress test: 100 messages with heap allocation...
#   Progress: 10/100 messages processed
#   Progress: 20/100 messages processed
# ...
# 📊 Stress test results:
#   Total messages: 100
#   Successful: 100
#   Success rate: 100.0%
#   Time: 2.34 seconds
#   Throughput: 42.7 msg/sec
# ✅ All messages processed successfully!
```

---

## 🐛 Отладка

### Запуск с GDB

#### Через скрипт rebuild.sh

```bash
./rebuild.sh -g
```

#### Или напрямую

```bash
gdb ./bin/mtproto-mqtt-gateway
(gdb) run -c SPB -v
(gdb) bt  # если crash
```

### Запуск с Valgrind

#### Через скрипт rebuild.sh

```bash
./rebuild.sh -v
```

#### Или напрямую

```bash
valgrind --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         --log-file=logs/valgrind.log \
         ./bin/mtproto-mqtt-gateway -c SPB
```

#### Просмотр результата

```bash
cat logs/valgrind.log
```

### Логирование

#### Включение подробного логирования

```bash
./bin/mtproto-mqtt-gateway -v -c SPB 2>&1 | tee logs/debug.log
```

#### Логирование пакетов

```bash
./bin/mtproto-mqtt-gateway -v -c SPB --log-packets
```

### Проверка сборки

#### Информация о сборке

```bash
./rebuild.sh -i
```

#### Проверка зависимостей

```bash
ldd ./bin/mtproto-mqtt-gateway
```

#### Проверка символов

```bash
nm ./bin/mtproto-mqtt-gateway | grep -E "mesh_|hybrid_|pq_"
```

---

## 🧹 Очистка

### Очистка через rebuild.sh

#### Очистка build файлов

```bash
./rebuild.sh -c
```

#### Полная очистка

```bash
./rebuild.sh -f
```

### Очистка через Make

#### Очистка build файлов

```bash
make clean
```

#### Глубокая очистка

```bash
make distclean
```

#### Полное удаление всего

```bash
make nuke
```

### Ручная очистка

#### Удаление директорий

```bash
rm -rf build/* bin/* logs/* config/*
```

#### Удаление логов

```bash
rm -f build.log build-debug.log
```

---

## 📊 Makefile цели

### Основные цели

#### Сборка проекта

```bash
make all
```

#### Очистка build файлов

```bash
make clean
```

#### Глубокая очистка

```bash
make distclean
```

#### Полное удаление всего

```bash
make nuke
```

#### Сборка с отладкой

```bash
make debug
```

#### Сборка статического бинарника

```bash
make static
```

#### Установка в /usr/local/bin

```bash
make install
```

#### Удаление из /usr/local/bin

```bash
make uninstall
```

### Запуск для городов

#### Санкт-Петербург

```bash
make run-spb
```

#### Москва

```bash
make run-moscow
```

#### Краснодар

```bash
make run-krd
```

#### Екатеринбург

```bash
make run-ekb
```

#### Новосибирск

```bash
make run-nsk
```

#### Казань

```bash
make run-kzn
```

#### Владивосток

```bash
make run-vlad
```

#### Сочи

```bash
make run-sochi
```

#### Крым

```bash
make run-crimea
```

### Тестирование

#### Тест базовой криптографии

```bash
make test-crypto
```

#### Тест гибридной криптографии

```bash
make test-hybrid
```

#### Тест множественных сообщений

```bash
make test-multi
```

#### Стресс-тест

```bash
make test-stress
```

#### Проверка PQ алгоритмов

```bash
make check-pq
```

#### Все тесты

```bash
make test-all
```

---

## 📝 Примеры полного цикла

### Полная пересборка с тестом

```bash
./rebuild.sh -f
```

### Запуск с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

### Отправка сообщения (в другом терминале)

```bash
./bin/mtproto-mqtt-gateway -s "Hello Mesh World!" -v
```

### Проверка состояния

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Тест криптографии

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

---

## 🔍 Диагностика проблем

### Проблема: Не собирается

#### Проверка зависимостей

```bash
sudo apt-get install -y build-essential libpaho-mqtt-dev libssl-dev
```

#### Проверка liboqs

```bash
pkg-config --exists liboqs || echo "Install liboqs"
./install-liboqs.sh
```

#### Полная пересборка

```bash
./rebuild.sh -f
```

### Проблема: Не подключается к MQTT

#### Проверка сети

```bash
ping mqtt.onemesh.ru
nc -zv mqtt.onemesh.ru 1883
```

#### Проверка с подробным выводом

```bash
./bin/mtproto-mqtt-gateway --test-connect -v
```

#### Использование другого брокера

```bash
./bin/mtproto-mqtt-gateway -b tcp://localhost:1883 -u test -P test
```

### Проблема: Ошибка памяти

#### Запуск с Valgrind

```bash
make valgrind
```

#### Проверка стека

```bash
ulimit -s 32768  # Увеличение стека до 32MB
```

#### Сборка с отладкой

```bash
make debug
```

---

## 📚 Дополнительная информация

### Документация

```bash
cat README.md
```

### Структура пакетов

```bash
cat src/mesh-packet.h
```

### Криптография

```bash
cat src/mesh-crypto.h
```

### MQTT интерфейс

```bash
cat src/mesh-mqtt.h
```

### Установка liboqs

```bash
cat install-liboqs.sh
```

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи в `logs/`
2. Запустите с флагом `-v` для подробного вывода
3. Используйте `--test-connect` для проверки подключения
4. Запустите `make valgrind` для проверки утечек памяти
5. Убедитесь, что liboqs установлен: `pkg-config --exists liboqs`
6. Проверьте установку: `./install-liboqs.sh`
```
