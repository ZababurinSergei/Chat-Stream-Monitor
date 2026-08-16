# MTProto MQTT Gateway

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with C](https://img.shields.io/badge/Made%20with-C-blue.svg)](https://en.wikipedia.org/wiki/C_(programming_language))
[![Metaflow](https://img.shields.io/badge/Metaflow-v2.19.35-blueviolet)](https://metaflow.org)

## 📋 Оглавление

- [Описание](#описание)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Установка](#установка)
- [Сборка](#сборка)
- [Конфигурация](#конфигурация)
- [Использование](#использование)
- [Metaflow Workflow](#metaflow-workflow)
- [Команды](#команды)
- [Тестирование](#тестирование)
- [Отладка](#отладка)
- [Документация](#документация)
- [Лицензия](#лицензия)

---

## 🚀 Описание

**MTProto MQTT Gateway** - это высокопроизводительный шлюз для передачи сообщений через MQTT с поддержкой пост-квантовой криптографии (ML-KEM, ML-DSA). Шлюз обеспечивает безопасную и эффективную передачу данных между устройствами в сети Mesh.

### Ключевые возможности

- 🔐 **Пост-квантовая криптография** - защита от квантовых атак (ML-KEM, ML-DSA)
- 🔄 **Гибридная криптография** - ECDH + ML-KEM для максимальной безопасности
- 📡 **MQTT протокол** - стандартный протокол для IoT и Mesh сетей
- 🌍 **Многогородовой роуминг** - поддержка городов (SPB, MOS, KRD, EKB, NSK, KZN, VVO, SOCH, CRM)
- 📨 **Надежная доставка** - гарантированная доставка сообщений
- 🚀 **Высокая производительность** - оптимизированный C код
- 📊 **Metaflow интеграция** - автоматизация и оркестрация
- 🌐 **Веб-интерфейс** - удобный UI для управления

---

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                     MTProto MQTT Gateway                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   MQTT Layer  │  │  Crypto Layer │  │   Mesh Protocol      │ │
│  │  (Paho MQTT)  │  │  (OpenSSL +   │  │   (MTProto)          │ │
│  │               │  │   liboqs)     │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Parsing    │  │   Logging    │  │   Metaflow           │ │
│  │  (JSON/YAML) │  │  (syslog)    │  │   Integration        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Node.js Metaflow UI                         │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  • INTERFACE.md Parser   • request.http Validator         ││
│  │  • Workflow Engine       • Web Interface                  ││
│  │  • Report Generator      • State Management               ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Требования

### Системные требования

| Компонент | Минимальная версия |
|-----------|-------------------|
| **Linux** | Ubuntu 20.04+ / Debian 11+ |
| **GCC** | 9.0+ |
| **CMake** | 3.10+ |
| **OpenSSL** | 1.1.1+ |
| **Paho MQTT** | 1.3.8+ |
| **Node.js** | 18.0+ |
| **Python** | 3.8+ (для Metaflow) |

### Зависимости

#### Обязательные

```bash
# Базовые инструменты
sudo apt install -y build-essential cmake git

# MQTT
sudo apt install -y libpaho-mqtt-dev

# Криптография
sudo apt install -y libssl-dev

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python (для Metaflow)
sudo apt install -y python3 python3-pip
```

#### Опциональные (пост-квантовая криптография)

```bash
# liboqs - для квантово-безопасной криптографии
./install-liboqs.sh
```

---

## 🔧 Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/onemesh/mtproto-mqtt.git
cd mtproto-mqtt
```

### 2. Установка зависимостей

```bash
# Установка системных зависимостей
sudo apt update
sudo apt install -y build-essential cmake git \
    libpaho-mqtt-dev libssl-dev

# Установка liboqs (опционально)
./install-liboqs.sh

# Установка Node.js зависимостей
npm install
```

### 3. Сборка проекта

```bash
# Полная сборка
./rebuild.sh

# Сборка с отладкой
./rebuild.sh -d

# Полная пересборка
./rebuild.sh -f
```

### 4. Проверка установки

```bash
# Проверка подключения к MQTT
./bin/mtproto-mqtt-gateway --test-connect

# Проверка криптографии
./bin/mtproto-mqtt-gateway --test-hybrid

# Запуск Metaflow workflow
npm run validate
```

---

## ⚙️ Конфигурация

### Переменные окружения (.env)

```bash
# API
API_HOST=localhost
API_PORT=3100
HTTP_TIMEOUT=30000

# MQTT
MQTT_BROKER=tcp://mqtt.onemesh.ru:1883
MQTT_USER=onemeshd
MQTT_PASSWORD=onecat
MQTT_CITY=SPB

# Криптография
USE_PQ_CRYPTO=true
USE_HYBRID_CRYPTO=true
PQ_KEM_ALGORITHM=ML-KEM-768
PQ_SIGNATURE_ALGORITHM=ML-DSA-65

# Логирование
LOG_LEVEL=info
DEBUG_MODE=false

# Metaflow
REQUEST_FILE=request.http
RESULTS_DIR=results
PARALLEL_EXECUTION=false
```

### Файл конфигурации (config.yaml)

```yaml
mqtt:
  broker: tcp://mqtt.onemesh.ru:1883
  user: onemeshd
  password: onecat
  city: SPB
  topic_root: msh/RU

crypto:
  use_pq: true
  use_hybrid: true
  kem_algorithm: ML-KEM-768
  signature_algorithm: ML-DSA-65

logging:
  level: info
  file: logs/gateway.log
  max_size: 10485760

performance:
  max_packet_size: 131072
  buffer_size: 147456
  mqtt_timeout: 60
  keep_alive: 30
```

---

## 💻 Использование

### Базовые команды

```bash
# Запуск с городом по умолчанию
./bin/mtproto-mqtt-gateway

# Запуск с указанием города
./bin/mtproto-mqtt-gateway -c MOS

# Подробный вывод
./bin/mtproto-mqtt-gateway -c SPB -v

# Отправка тестового сообщения
./bin/mtproto-mqtt-gateway -s "Hello Mesh!"

# Отправка с получателем
./bin/mtproto-mqtt-gateway -s "Hello Bob!" -r @bob
```

### Metaflow Workflow

```bash
# Запуск Metaflow workflow
npm start

# Показать структуру workflow
npm run show

# Валидация INTERFACE.md и request.http
npm run validate

# Запуск в фоновом режиме
npm run start &
```

### Веб-интерфейс

```bash
# Запуск UI сервера
npm start

# Открыть в браузере
xdg-open http://localhost:3000
# или
firefox http://localhost:3000
```

---

## 🔄 Metaflow Workflow

### Структура workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Metaflow Workflow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Шаг 1: 📖 Парсинг INTERFACE.md                            │
│    └── Извлечение команд, секций, зависимостей            │
│                                                             │
│  Шаг 2: 📄 Парсинг request.http                            │
│    └── Извлечение HTTP запросов, замена переменных        │
│                                                             │
│  Шаг 3: 🔍 Валидация                                       │
│    └── Сопоставление команд с HTTP запросами              │
│                                                             │
│  Шаг 4: 📊 Генерация отчета                                │
│    └── Сохранение в .metaflow/                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Команды Metaflow

| Команда | Описание |
|---------|----------|
| `npm start` | Запуск UI сервера и workflow |
| `npm run workflow` | Запуск workflow из CLI |
| `npm run show` | Показать структуру workflow |
| `npm run validate` | Валидация интерфейсов |
| `npm run dev` | Запуск в режиме разработки |

### Файлы .metaflow

```
.metaflow/
├── state.json          # Текущее состояние workflow
├── report.json         # Детальный отчет
├── summary.txt         # Текстовая сводка
└── history/            # История выполнения
    ├── 2024-01-01-12-00-00.json
    └── ...
```

---

## 📖 Команды

### Основные команды

| Команда | Описание |
|---------|----------|
| `--test-connect` | Тест подключения к MQTT |
| `--check-pq` | Проверка пост-квантовой криптографии |
| `--test-crypto` | Тест базовой криптографии |
| `--test-hybrid` | Тест гибридной криптографии |
| `--test-multi` | Тест множественных сообщений |
| `--test-stress` | Стресс-тест (100 сообщений) |
| `--help` | Показать справку |

### Опции командной строки

| Опция | Описание |
|-------|----------|
| `-b, --broker` | Адрес MQTT брокера |
| `-H, --host` | Хост брокера |
| `-p, --port` | Порт брокера |
| `-u, --user` | Имя пользователя |
| `-P, --password` | Пароль |
| `-c, --city` | Код города (SPB, MOS, KRD...) |
| `-t, --topic` | Корневой топик |
| `-s, --send` | Отправить тестовое сообщение |
| `-r, --recipient` | ID получателя |
| `-v, --verbose` | Подробный вывод |
| `-h, --help` | Показать справку |

### Города

| Код | Город |
|-----|-------|
| `SPB` | Санкт-Петербург |
| `MOS` | Москва |
| `KRD` | Краснодар |
| `EKB` | Екатеринбург |
| `NSK` | Новосибирск |
| `KZN` | Казань |
| `VVO` | Владивосток |
| `SOCH` | Сочи |
| `CRM` | Крым |

---

## 🧪 Тестирование

### Тест подключения

```bash
./bin/mtproto-mqtt-gateway --test-connect -v
```

### Тест криптографии

```bash
# Базовая криптография
./bin/mtproto-mqtt-gateway --test-crypto

# Гибридная криптография
./bin/mtproto-mqtt-gateway --test-hybrid

# Множественные сообщения
./bin/mtproto-mqtt-gateway --test-multi

# Стресс-тест
./bin/mtproto-mqtt-gateway --test-stress
```

### Стресс-тест результаты

```bash
🔥 Stress test: 100 messages with heap allocation...
  Progress: 100/100 messages processed

📊 Stress test results:
  Total messages: 100
  Successful: 100
  Success rate: 100.0%
  Time: 2.34 seconds
  Throughput: 42.7 msg/sec
✅ All messages processed successfully!
```

---

## 🐛 Отладка

### GDB

```bash
# Сборка с отладкой
./rebuild.sh -g

# Запуск в GDB
gdb ./bin/mtproto-mqtt-gateway
(gdb) run -c SPB -v
(gdb) bt  # если crash
```

### Valgrind

```bash
# Сборка с Valgrind
./rebuild.sh -v

# Анализ памяти
valgrind --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         ./bin/mtproto-mqtt-gateway -c SPB
```

### Логирование

```bash
# Детальное логирование
./bin/mtproto-mqtt-gateway -v -c SPB 2>&1 | tee logs/debug.log

# Логирование пакетов
./bin/mtproto-mqtt-gateway -v -c SPB --log-packets
```

---

## 📚 Документация

### API документация

- [INTERFACE.md](INTERFACE.md) - Полное описание интерфейса
- [API Reference](docs/API.md) - Документация API
- [Protocol](docs/PROTOCOL.md) - Описание протокола

### Дополнительная документация

- [Установка liboqs](docs/INSTALL_LIBOQS.md)
- [Руководство пользователя](docs/USER_GUIDE.md)
- [FAQ](docs/FAQ.md)

---

## 🤝 Контрибьюция

Мы приветствуем вклад в проект! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о процессе разработки.

### Процесс разработки

1. **Fork** репозитория
2. **Создание ветки** для вашей фичи (`git checkout -b feature/amazing-feature`)
3. **Коммит изменений** (`git commit -m 'Add amazing feature'`)
4. **Push в ветку** (`git push origin feature/amazing-feature`)
5. **Создание Pull Request**

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT - подробности в файле [LICENSE](LICENSE).

---

## 📞 Поддержка

- 📧 Email: support@onemesh.ru
- 💬 Telegram: [@onemesh_support](https://t.me/onemesh_support)
- 📖 Документация: [https://docs.onemesh.ru](https://docs.onemesh.ru)
- 🐛 Баги: [https://github.com/onemesh/mtproto-mqtt/issues](https://github.com/onemesh/mtproto-mqtt/issues)

---

## 🙏 Благодарности

- [liboqs](https://github.com/open-quantum-safe/liboqs) - пост-квантовая криптография
- [Paho MQTT](https://github.com/eclipse/paho.mqtt.c) - MQTT клиент
- [OpenSSL](https://www.openssl.org/) - криптографические функции
- [Metaflow](https://metaflow.org) - оркестрация workflow

---

## ⭐ Stars

Если вам нравится проект, поставьте звезду на GitHub!

[![GitHub stars](https://img.shields.io/github/stars/ZababurinSergei/mtproto-mqtt-gateway.svg?style=social)](https://github.com/ZababurinSergei/mtproto-mqtt-gateway)

---

**Автор:** Забабурин Сергей  
**GitHub:** [ZababurinSergei](https://github.com/ZababurinSergei)  
**Репозиторий:** [mtproto-mqtt-gateway](https://github.com/ZababurinSergei/mtproto-mqtt-gateway)

---

**Сделано с ❤️ для Mesh сети**
