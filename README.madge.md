```markdown
# File System Scanner & Dependency Analyzer

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-CSL--1.0-blue)](LICENSE)
[![Madge](https://img.shields.io/badge/madge-8.0.0-orange)](https://github.com/pahen/madge)

Инструмент для сканирования файловой системы и анализа зависимостей JavaScript/TypeScript проектов с поддержкой madge.

## 📋 Оглавление

- [Возможности](#-возможности)
- [Установка](#-установка)
- [Структура проекта](#-структура-проекта)
- [Конфигурация](#-конфигурация)
  - [Основные настройки](#основные-настройки)
  - [Настройки madge](#настройки-madge)
  - [Пресеты (Presets)](#пресеты-presets)
- [Использование](#-использование)
  - [Сканирование файловой системы](#сканирование-файловой-системы)
  - [Анализ зависимостей (madge)](#анализ-зависимостей-madge)
  - [Пресеты](#пресеты)
  - [Интерактивный режим](#интерактивный-режим)
- [CLI Аргументы](#-cli-аргументы)
- [Шаблоны имен файлов](#-шаблоны-имен-файлов)
- [Примеры](#-примеры)
- [Лицензия](#-лицензия)

## 🚀 Возможности

### Основной сканер файловой системы
- Рекурсивное сканирование директорий
- Фильтрация файлов по расширениям
- Исключение файлов/директорий по паттернам
- Многоязычная поддержка (русский/английский)
- Генерация JSON отчета
- Сохранение логов сканирования

### Анализатор зависимостей (madge)
- Анализ зависимостей JavaScript/TypeScript
- Поиск циклических зависимостей
- Генерация SVG графов зависимостей
- Поддержка Webpack, TypeScript, RequireJS
- Фильтрация по глубине
- Включение/исключение npm пакетов
- Шаблоны имен выходных файлов

## 📦 Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/file-system-scanner.git
cd file-system-scanner

# Установка зависимостей
npm install

# Установка Graphviz (для SVG генерации)
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows
# Скачайте с https://graphviz.org/download/
```

## 📁 Структура проекта

```
Directory/10/
├── config.json              # Конфигурационный файл
├── main.mjs                 # Основной скрипт сканирования ФС
├── run-scan.js              # CLI для анализа зависимостей
├── scan-dependencies.js     # Ядро анализа зависимостей
├── FileSystemScanner.js     # Сканер файловой системы
├── generate-config.mjs      # Генератор конфигурации
├── check-license.mjs        # Проверка лицензий
└── package.json             # NPM конфигурация

Directory/11/                # Пользовательские функции
Directory/12/                # Пользовательские файлы
Directory/13/                # Дополнительные модули

fs/                          # Выходные JSON файлы
├── fs.json                  # Результат сканирования ФС
└── dependencies_*.json      # Результаты анализа зависимостей

fs/svg/                      # SVG графы зависимостей
logs/                        # Логи сканирования
```

## ⚙️ Конфигурация

### Основные настройки

```json
{
  "directories": [
    {
      "id": "10",
      "name": "Directory/10",
      "description": "Пользовательская документация",
      "description_en": "User documentation",
      "required": false,
      "excluded": false
    }
  ],
  "excludePatterns": {
    "directories": ["node_modules", ".git", "dist", "build"],
    "files": ["README.md", "*.log", "*.tmp"]
  },
  "scanOptions": {
    "recursive": true,
    "maxDepth": 100,
    "excludeExcludedDirs": true
  },
  "supportedExtensions": [".js", ".ts", ".jsx", ".tsx", ".vue", ".json"],
  "output": {
    "fileName": "./fs/fs.json",
    "prettyPrint": true,
    "includeMetadata": true
  },
  "report": {
    "enabled": true,
    "path": "./logs/scan_report.log",
    "language": "russian"
  }
}
```

### Настройки madge

```json
{
  "madge": {
    "description": "Конфигурация для сканера зависимостей madge",
    "defaults": {
      "targetDir": "./Directory/11/deepseek",
      "entryFile": "chatMonitor.js",
      "depth": "all",
      "outputJsonDir": "./fs",
      "svgOutputDir": "./fs/svg",
      "outputFileName": "dependencies_{{name}}_{{timestamp}}{{suffix}}.json",
      "svgFileName": "graph_{{name}}_{{timestamp}}.svg"
    },
    "presets": { ... },
    "cli": {
      "defaultPreset": "deps-only",
      "mergeStrategy": "override"
    }
  }
}
```

### Пресеты (Presets)

| Пресет | Описание | Аргументы |
|--------|----------|-----------|
| `deps-only` | Только анализ зависимостей | `--svg false --depth all` |
| `svg-only` | Только SVG граф | `--svg true --depth 2` |
| `quick` | Быстрое сканирование | `--depth 1 --include-npm false --svg false` |
| `deep` | Глубокое сканирование | `--depth all --include-npm true --svg true` |
| `with-npm` | С npm зависимостями | `--include-npm true --depth 3` |
| `circular-only` | Только циклы | `--circular-only true --svg false` |
| `visualize` | Полная визуализация | `--svg true --depth 3` |
| `minimal` | Минимальное сканирование | `--depth 1 --svg false --include-npm false` |
| `full` | Всё включено | `--depth all --include-npm true --svg true` |

## 🛠 Использование

### Сканирование файловой системы

```bash
# Запуск основного сканера
npm start
# или
npm run scan

# Генерация конфигурации по умолчанию
npm run config
```

### Анализ зависимостей (madge)

```bash
# Базовый запуск
npm run scan:deps

# Интерактивный режим
npm run scan:deps:interactive

# Быстрое сканирование
npm run scan:deps:quick

# Глубокое сканирование с визуализацией
npm run scan:deps:deep

# Только SVG граф
npm run scan:deps:svg

# Только анализ зависимостей
npm run scan:deps:deps-only

# Поиск циклических зависимостей
npm run scan:deps:circular

# Полная визуализация
npm run scan:deps:visualize

# С npm зависимостями
npm run scan:deps:with-npm

# Полное сканирование
npm run scan:deps:full

# Минимальное сканирование
npm run scan:deps:minimal

# Сканирование конкретных проектов
npm run scan:deps:deepseek   # DeepSeek расширение
npm run scan:deps:qwen       # Qwen расширение
npm run scan:deps:madge      # Библиотека madge
```

### Пресеты

```bash
# Использование preset из конфига
node run-scan.js --preset deps-only
node run-scan.js --preset deep
node run-scan.js --preset circular-only

# Preset с переопределением
node run-scan.js --preset quick --depth 2 --svg

# Показать все доступные presets
npm run list-presets
```

### Интерактивный режим

```bash
npm run scan:deps:interactive
```

Интерактивный режим позволяет:
- Выбрать preset
- Настроить параметры сканирования
- Выбрать режим (один файл / несколько файлов / вся директория)
- Указать входной файл и директорию

## 📖 CLI Аргументы

### Основные аргументы

| Аргумент | Описание | Пример |
|----------|----------|--------|
| `--interactive, -i` | Интерактивный режим | `-i` |
| `--preset <name>` | Использовать preset | `--preset deep` |
| `--dir <path>` | Директория для сканирования | `--dir ./src` |
| `--entry <file>` | Входной файл | `--entry index.js` |
| `--depth <n\|all>` | Глубина сканирования | `--depth 3` |
| `--include-npm` | Включить npm зависимости | `--include-npm` |
| `--svg` | Создать SVG визуализацию | `--svg` |
| `--circular-only` | Только циклические зависимости | `--circular-only` |
| `--output <dir>` | Каталог для JSON | `--output ./reports` |
| `--output-name <name>` | Шаблон имени JSON | `--output-name "deps_{{name}}.json"` |
| `--svg-name <name>` | Шаблон имени SVG | `--svg-name "graph_{{name}}.svg"` |
| `--config <file>` | Путь к config.json | `--config ./my-config.json` |
| `--add-to-config` | Добавить в config.json | `--add-to-config` |
| `--list-presets` | Показать доступные presets | `--list-presets` |
| `--help, -h` | Показать справку | `--help` |

## 📝 Шаблоны имен файлов

### Доступные переменные

| Переменная | Описание | Пример |
|------------|----------|--------|
| `{{name}}` | Имя файла без расширения | `background` |
| `{{timestamp}}` | Unix timestamp | `1702051234567` |
| `{{date}}` | Дата (YYYY-MM-DD) | `2024-12-08` |
| `{{time}}` | Время (HH-mm-ss) | `14-30-45` |
| `{{datetime}}` | Дата и время | `2024-12-08_14-30-45` |
| `{{suffix}}` | Суффикс (для circular-only) | `_circular` |
| `{{entry}}` | Полное имя файла | `background.js` |
| `{{dir}}` | Имя директории | `deepseek` |
| `{{depth}}` | Глубина (full/число) | `2` |
| `{{npm}}` | Статус npm | `with-npm` или `no-npm` |

### Примеры шаблонов

```bash
# Простой шаблон
--output-name "deps.json"

# С timestamp
--output-name "deps_{{timestamp}}.json"

# С датой и временем
--output-name "deps_{{date}}_{{time}}.json"

# С информацией о проекте
--output-name "madge_{{dir}}_{{name}}_{{depth}}_{{npm}}.json"

# Для циклических зависимостей
--output-name "circular_{{name}}_{{datetime}}.json"

# SVG шаблоны
--svg-name "graph_{{name}}_{{timestamp}}.svg"
--svg-name "visual_{{dir}}_{{name}}.svg"
```

## 💡 Примеры

### Пример 1: Быстрый анализ небольшого проекта

```bash
node run-scan.js --preset quick --dir ./src --entry main.js
```

### Пример 2: Полный анализ с визуализацией

```bash
node run-scan.js --preset full --dir ./src --entry index.js
```

### Пример 3: Поиск циклических зависимостей

```bash
node run-scan.js --preset circular-only --dir ./src --entry app.js
```

### Пример 4: Кастомный шаблон имени файла

```bash
node run-scan.js --dir ./src --entry index.js \
  --output-name "report_{{name}}_{{date}}_{{time}}.json" \
  --svg-name "graph_{{name}}_{{timestamp}}.svg"
```

### Пример 5: Сканирование с сохранением в конфиг

```bash
node run-scan.js --dir ./my-project --entry main.js --depth 3 --svg --add-to-config
```

### Пример 6: Использование кастомного конфига

```bash
node run-scan.js --config ./custom-config.json --preset deep
```

## 📄 Лицензия

CSL-1.0 (Custom Source License)

- Использование разрешено ТОЛЬКО в некоммерческих целях
- Коммерческое использование ТОЛЬКО с письменного разрешения автора
- Изменение файлов запрещено - только через Pull Request

Полный текст лицензии: см. файл [LICENSE](LICENSE)

---

## 🔧 Устранение неполадок

### Graphviz не установлен

```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Проверка установки
dot -V
```

### Ошибка "Cannot find module"

```bash
npm install
```

### Ошибка доступа к файлам

```bash
chmod +x run-scan.js
```

---

**Автор:** Забабурин Сергей  
**Email:** zababurins@vk.com  
**GitHub:** [ваш-username/file-system-scanner](https://github.com/ваш-username/file-system-scanner)
```