```markdown
# MTProto MQTT Gateway - Интерфейс и Команды

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [HTTP API Команды](#http-api-команды)
3. [Сборка проекта](#сборка-проекта)
4. [Зависимости](#зависимости)
5. [Установка liboqs](#установка-liboqs)
6. [Тестирование](#тестирование)
7. [Запуск шлюза](#запуск-шлюза)
8. [Отладка](#отладка)
9. [Очистка](#очистка)

---

## 🚀 Быстрый старт

### Команда 1: Переход в директорию проекта

```bash
cd packages/mtproto-mqtt
```

### Команда 2: Установка liboqs (опционально)

```bash
./install-liboqs.sh
```

### Команда 3: Сборка проекта

```bash
./rebuild.sh
```

### Команда 4: Проверка подключения к MQTT

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Команда 5: Запуск шлюза

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

---

## 🌐 HTTP API Команды

### Команда 6: Авторизация

**Описание:** Получение JWT токена для доступа к API

**HTTP Запрос:**
```http
POST http://localhost:3100/common
Content-Type: application/json

{
  "api": "auth./auth/user/login",
  "args": {
    "login": "developer",
    "password": "123456"
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "login": "developer",
    "role": "admin"
  }
}
```

**Переменные:**
| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `{{token}}` | JWT токен | Устанавливается из ответа |

---

### Команда 7: Получение активных сессий

**Описание:** Получение списка активных сессий пользователей

**HTTP Запрос:**
```http
POST http://localhost:3100/api
Content-Type: application/json

{
  "api": "auth./active-user/get",
  "args": {
    "params": {},
    "token": "{{token}}",
    "appId": 10
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "login": "developer",
      "session_id": "abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-02T12:00:00Z"
    }
  ]
}
```

**Параметры:**
| Параметр | Тип | Описание | Обязательный |
|----------|-----|----------|--------------|
| `token` | string | JWT токен | ✅ Да |
| `appId` | integer | ID приложения | ✅ Да |
| `params` | object | Дополнительные параметры | ❌ Нет |

---

### Команда 8: Получение времени последнего входа

**Описание:** Получение времени последнего успешного входа для пользователя

**HTTP Запрос:**
```http
POST http://localhost:3100/api
Content-Type: application/json

{
  "api": "auth./login-attempt/last-success/get",
  "args": {
    "login": "developer",
    "token": "{{token}}",
    "appId": 10
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "login": "developer",
    "last_success_time": "2024-01-01T12:30:00Z",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Параметры:**
| Параметр | Тип | Описание | Обязательный |
|----------|-----|----------|--------------|
| `login` | string | Имя пользователя | ✅ Да |
| `token` | string | JWT токен | ✅ Да |
| `appId` | integer | ID приложения | ✅ Да |

---

### Команда 9: Получение информации о всех пользователях

**Описание:** Получение информации о последнем успешном входе для всех активных пользователей

**HTTP Запрос:**
```http
POST http://localhost:3100/api
Content-Type: application/json

{
  "api": "auth./active-users-with-last-login/get",
  "args": {
    "token": "{{token}}",
    "appId": 10
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "login": "developer",
      "last_login": {
        "time": "2024-01-01T12:30:00Z",
        "ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0..."
      }
    }
  ]
}
```

**Параметры:**
| Параметр | Тип | Описание | Обязательный |
|----------|-----|----------|--------------|
| `token` | string | JWT токен | ✅ Да |
| `appId` | integer | ID приложения | ✅ Да |

---

## 📦 Сборка проекта

### Команда 10: Полная сборка с тестом

```bash
./rebuild.sh
```

### Команда 11: Сборка с отладкой

```bash
./rebuild.sh -d
```

### Команда 12: Полная пересборка

```bash
./rebuild.sh -f
```

### Команда 13: Сборка без теста

```bash
./rebuild.sh --no-test
```

### Команда 14: Сборка с GDB

```bash
./rebuild.sh -g
```

### Команда 15: Сборка с Valgrind

```bash
./rebuild.sh -v
```

---

## 📚 Зависимости

### Команда 16: Установка GCC

```bash
sudo apt install build-essential
```

### Команда 17: Установка Make

```bash
sudo apt install make
```

### Команда 18: Установка Paho MQTT

```bash
sudo apt install libpaho-mqtt-dev
```

### Команда 19: Установка OpenSSL

```bash
sudo apt install libssl-dev
```

### Команда 20: Проверка зависимостей

```bash
ldconfig -p | grep libpaho
ldconfig -p | grep libssl
pkg-config --exists liboqs
```

---

## 🔐 Установка liboqs

### Команда 21: Запуск скрипта установки

```bash
./install-liboqs.sh
```

### Команда 22: Установка с авто-подтверждением

```bash
echo "y" | ./install-liboqs.sh
```

### Команда 23: Ручная установка liboqs

```bash
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=/usr/local -DBUILD_SHARED_LIBS=ON ..
make -j$(nproc)
sudo make install
sudo ldconfig
```

### Команда 24: Проверка liboqs

```bash
pkg-config --exists liboqs && echo "✅ liboqs installed" || echo "❌ liboqs not found"
pkg-config --modversion liboqs
pkg-config --cflags liboqs
pkg-config --libs liboqs
```

### Команда 25: Тест компиляции с liboqs

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

---

## 🔌 Тестирование

### Команда 26: Базовый тест подключения

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Команда 27: Тест с подробным выводом

```bash
./bin/mtproto-mqtt-gateway --test-connect -v
```

### Команда 28: Тест с указанием брокера

```bash
./bin/mtproto-mqtt-gateway --test-connect -b tcp://mqtt.onemesh.ru:1883
```

### Команда 29: Базовая криптография

```bash
./bin/mtproto-mqtt-gateway --test-crypto
```

### Команда 30: Гибридная криптография

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

### Команда 31: Множественные сообщения

```bash
./bin/mtproto-mqtt-gateway --test-multi
```

### Команда 32: Стресс-тест

```bash
./bin/mtproto-mqtt-gateway --test-stress
```

### Команда 33: Проверка PQ алгоритмов

```bash
./bin/mtproto-mqtt-gateway --check-pq
```

---

## 🚀 Запуск шлюза

### Команда 34: Запуск с городом по умолчанию

```bash
./bin/mtproto-mqtt-gateway
```

### Команда 35: Запуск с указанием города

```bash
./bin/mtproto-mqtt-gateway -c MOS
```

### Команда 36: Запуск с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

### Команда 37: Запуск для Санкт-Петербурга

```bash
./bin/mtproto-mqtt-gateway -c SPB
```

### Команда 38: Запуск для Москвы

```bash
./bin/mtproto-mqtt-gateway -c MOS
```

### Команда 39: Запуск для Краснодара

```bash
./bin/mtproto-mqtt-gateway -c KRD
```

### Команда 40: Запуск для Екатеринбурга

```bash
./bin/mtproto-mqtt-gateway -c EKB
```

### Команда 41: Запуск для Новосибирска

```bash
./bin/mtproto-mqtt-gateway -c NSK
```

### Команда 42: Запуск для Казани

```bash
./bin/mtproto-mqtt-gateway -c KZN
```

### Команда 43: Запуск для Владивостока

```bash
./bin/mtproto-mqtt-gateway -c VVO
```

### Команда 44: Запуск для Сочи

```bash
./bin/mtproto-mqtt-gateway -c SOCH
```

### Команда 45: Запуск для Крыма

```bash
./bin/mtproto-mqtt-gateway -c CRM
```

### Команда 46: Отправка тестового сообщения

```bash
./bin/mtproto-mqtt-gateway -s "Hello Mesh!"
```

### Команда 47: Отправка сообщения с получателем

```bash
./bin/mtproto-mqtt-gateway -s "Hello Bob!" -r @bob
```

### Команда 48: Отправка с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -s "Test" -v
```

---

## ⚙️ Опции командной строки

### Команда 49: Адрес MQTT брокера

```bash
./bin/mtproto-mqtt-gateway -b tcp://mqtt.onemesh.ru:1883
```

### Команда 50: Хост брокера

```bash
./bin/mtproto-mqtt-gateway -H mqtt.onemesh.ru
```

### Команда 51: Порт брокера

```bash
./bin/mtproto-mqtt-gateway -p 1883
```

### Команда 52: Имя пользователя

```bash
./bin/mtproto-mqtt-gateway -u onemeshd
```

### Команда 53: Пароль

```bash
./bin/mtproto-mqtt-gateway -P onecat
```

### Команда 54: Код города

```bash
./bin/mtproto-mqtt-gateway -c SPB
```

### Команда 55: Корневой топик

```bash
./bin/mtproto-mqtt-gateway -t msh/RU/SPB
```

### Команда 56: Отправить сообщение

```bash
./bin/mtproto-mqtt-gateway -s "Hello World!"
```

### Команда 57: Получатель сообщения

```bash
./bin/mtproto-mqtt-gateway -s "Hello" -r @bob
```

### Команда 58: Подробный вывод

```bash
./bin/mtproto-mqtt-gateway -v
```

### Команда 59: Показать справку

```bash
./bin/mtproto-mqtt-gateway -h
```

---

## 🐛 Отладка

### Команда 60: Запуск с GDB

```bash
./rebuild.sh -g
```

### Команда 61: Запуск с Valgrind

```bash
./rebuild.sh -v
```

### Команда 62: Детальное логирование

```bash
./bin/mtproto-mqtt-gateway -v -c SPB 2>&1 | tee logs/debug.log
```

### Команда 63: Логирование пакетов

```bash
./bin/mtproto-mqtt-gateway -v -c SPB --log-packets
```

### Команда 64: Информация о сборке

```bash
./rebuild.sh -i
```

### Команда 65: Проверка зависимостей

```bash
ldd ./bin/mtproto-mqtt-gateway
```

### Команда 66: Проверка символов

```bash
nm ./bin/mtproto-mqtt-gateway | grep -E "mesh_|hybrid_|pq_"
```

---

## 🧹 Очистка

### Команда 67: Очистка build файлов

```bash
./rebuild.sh -c
```

### Команда 68: Полная очистка

```bash
./rebuild.sh -f
```

### Команда 69: Очистка через Make

```bash
make clean
```

### Команда 70: Глубокая очистка

```bash
make distclean
```

### Команда 71: Полное удаление

```bash
make nuke
```

### Команда 72: Ручная очистка

```bash
rm -rf build/* bin/* logs/* config/*
rm -f build.log build-debug.log
```

---

## 📊 Makefile цели

### Команда 73: Сборка проекта

```bash
make all
```

### Команда 74: Очистка build файлов

```bash
make clean
```

### Команда 75: Глубокая очистка

```bash
make distclean
```

### Команда 76: Полное удаление

```bash
make nuke
```

### Команда 77: Сборка с отладкой

```bash
make debug
```

### Команда 78: Сборка статического бинарника

```bash
make static
```

### Команда 79: Установка в /usr/local/bin

```bash
make install
```

### Команда 80: Удаление из /usr/local/bin

```bash
make uninstall
```

### Команда 81: Запуск для Санкт-Петербурга

```bash
make run-spb
```

### Команда 82: Запуск для Москвы

```bash
make run-moscow
```

### Команда 83: Запуск для Краснодара

```bash
make run-krd
```

### Команда 84: Все тесты

```bash
make test-all
```

---

## 📝 Примеры полного цикла

### Команда 85: Полная пересборка с тестом

```bash
./rebuild.sh -f
```

### Команда 86: Запуск с подробным выводом

```bash
./bin/mtproto-mqtt-gateway -c SPB -v
```

### Команда 87: Отправка сообщения

```bash
./bin/mtproto-mqtt-gateway -s "Hello Mesh World!" -v
```

### Команда 88: Проверка состояния

```bash
./bin/mtproto-mqtt-gateway --test-connect
```

### Команда 89: Тест криптографии

```bash
./bin/mtproto-mqtt-gateway --test-hybrid
```

---

## 🔍 Диагностика проблем

### Команда 90: Проверка зависимостей

```bash
sudo apt-get install -y build-essential libpaho-mqtt-dev libssl-dev
```

### Команда 91: Проверка liboqs

```bash
pkg-config --exists liboqs || echo "Install liboqs"
./install-liboqs.sh
```

### Команда 92: Полная пересборка

```bash
./rebuild.sh -f
```

### Команда 93: Проверка сети

```bash
ping mqtt.onemesh.ru
nc -zv mqtt.onemesh.ru 1883
```

### Команда 94: Проверка с подробным выводом

```bash
./bin/mtproto-mqtt-gateway --test-connect -v
```

### Команда 95: Запуск с Valgrind

```bash
make valgrind
```

### Команда 96: Проверка стека

```bash
ulimit -s 32768
```

### Команда 97: Сборка с отладкой

```bash
make debug
```

---

## 📚 Дополнительная информация

### Команда 98: Просмотр документации

```bash
cat README.md
```

### Команда 99: Просмотр структуры пакетов

```bash
cat src/mesh-packet.h
```

### Команда 100: Просмотр криптографии

```bash
cat src/mesh-crypto.h
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
```
