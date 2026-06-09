# 🤖 AST Analyzer - AI Toolkit

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-CSL--1.0-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.0+-42b883)](https://vuejs.org/)

**Инструмент статического анализа кода для оптимизации взаимодействия с ИИ**

[Установка](#-установка) • [Режимы работы](#-режимы-работы) • [Примеры](#-примеры-использования) • [Промпты для ИИ](#-промпты-для-ии)

</div>

---

## 📋 Оглавление

- [Описание](#-описание)
- [Установка](#-установка)
- [Быстрый старт](#-быстрый-старт)
- [Режимы работы](#-режимы-работы)
  - [1. project - Граф зависимостей проекта](#1-project---граф-зависимостей-проекта)
  - [2. file - Внутренний граф файла](#2-file---внутренний-граф-файла)
  - [3. minify - Сжатие одного файла](#3-minify---сжатие-одного-файла)
  - [4. minify-folder - Рекурсивное сжатие проекта](#4-minify-folder---рекурсивное-сжатие-проекта)
  - [5. prompt-pack - Сборка контекста для ИИ](#5-prompt-pack---сборка-контекста-для-ии)
  - [6. impact - Анализ зоны влияния](#6-impact---анализ-зоны-влияния)
  - [7. dead-code - Поиск мертвого кода](#7-dead-code---поиск-мертвого-кода)
- [Примеры использования](#-примеры-использования)
- [Промпты для ИИ](#-промпты-для-ии)
- [Структура выходных файлов](#-структура-выходных-файлов)
- [Советы и рекомендации](#-советы-и-рекомендации)
- [Лицензия](#-лицензия)

---

## 🎯 Описание

**AST Analyzer** — это мощный инструмент статического анализа кода, специально разработанный для оптимизации взаимодействия с большими языковыми моделями (ChatGPT, Claude, Gemini и др.).

### Ключевые возможности

| Возможность | Описание | Экономия |
|-------------|----------|----------|
| 🔍 **AST-парсинг** | Глубокий анализ структуры кода | - |
| ✂️ **Сжатие кода** | Удаление реализации, сохранение сигнатур | до **90%** токенов |
| 📁 **minify-folder** | Рекурсивное сжатие всего проекта | до **85%** размера |
| 🎒 **Smart-контекст** | Автоматический сбор связанных файлов | до **70%** контекста |
| 💥 **Impact Analysis** | Оценка последствий изменений | время анализа |
| 🗑️ **Dead Code** | Поиск неиспользуемого кода | чистота кода |
| 📊 **Визуализация** | Интерактивные графы зависимостей | понимание архитектуры |

### Поддерживаемые форматы

- ✅ **JavaScript** (.js, .mjs, .cjs)
- ✅ **TypeScript** (.ts, .tsx)
- ✅ **Vue.js** (.vue) - извлекает script блоки
- ✅ **JSX** (.jsx)

---

## 📦 Установка

### Предварительные требования

```bash
# Node.js версии 18 или выше
node --version

# Graphviz (для визуализации графов)
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows
# Скачайте с https://graphviz.org/download/
```

### Установка пакетов

```bash
# Клонирование репозитория
git clone https://github.com/your-username/ast-analyzer.git
cd ast-analyzer

# Установка зависимостей
npm install

# Проверка работы
node graph-analyzer.js --help
```

### Зависимости

```json
{
  "@typescript-eslint/parser": "^8.61.0",
  "estree-walker": "^3.0.0",
  "@hpcc-js/wasm-graphviz": "^1.0.0"
}
```

---

## 🚀 Быстрый старт

```bash
# 1. Сжать весь проект для отправки ИИ (НОВЫЙ РЕЖИМ!)
node graph-analyzer.js minify-folder ./src

# 2. Сжать один файл
node graph-analyzer.js minify ./src/component.js

# 3. Собрать контекст для задачи
node graph-analyzer.js prompt-pack ./src/main.js 2

# 4. Проверить влияние изменений
node graph-analyzer.js impact ./src/utils.js calculateTotal

# 5. Найти мертвый код
node graph-analyzer.js dead-code ./src/legacy.js

# 6. Визуализировать архитектуру
node graph-analyzer.js project ./src/index.js 3
# Открыть report.html в браузере
```

---

## 📖 Режимы работы

### 1. project - Граф зависимостей проекта

**Назначение:** Построение интерактивной карты зависимостей всего проекта от корневого файла.

**Выходные файлы:**
- `report.html` - Интерактивный граф с возможностью zoom/pan
- `output.svg` - Векторный граф зависимостей
- `output.json` - Структура графа в JSON
- `output.dot` - Исходный код на языке DOT

**Команда:**
```bash
node graph-analyzer.js project <путь_к_файлу> [глубина]
```

**Примеры:**
```bash
# Полный граф (все зависимости)
node graph-analyzer.js project ./src/index.js

# Ограничение глубиной 2 уровня
node graph-analyzer.js project ./src/index.js 2
```

---

### 2. file - Внутренний граф файла

**Назначение:** Анализ внутренних связей внутри одного файла.

**Команда:**
```bash
node graph-analyzer.js file <путь_к_файлу>
```

**Пример:**
```bash
node graph-analyzer.js file ./src/services/api.js
```

---

### 3. minify - Сжатие одного файла

**Назначение:** Максимальное сжатие одного файла для отправки в ИИ.

**Что удаляется:**
- ❌ Тела функций (остаются сигнатуры)
- ❌ Логика вычислений
- ❌ Циклы и условия
- ❌ Внутренние переменные

**Что сохраняется:**
- ✅ Импорты/экспорты
- ✅ Сигнатуры функций
- ✅ JSDoc комментарии
- ✅ TypeScript интерфейсы

**Команда:**
```bash
node graph-analyzer.js minify <путь_к_файлу>
```

**Выход:** `ai-context.txt`

**Пример:**
```bash
node graph-analyzer.js minify ./src/components/UserProfile.tsx
```

---

### 4. minify-folder - Рекурсивное сжатие проекта ⭐ НОВЫЙ

**Назначение:** Рекурсивная минификация всех файлов в каталоге с сохранением структуры. Идеально для отправки всего проекта в ИИ.

**Особенности:**
- 📁 Сохраняет структуру каталогов
- 📊 Добавляет статистику сжатия
- 📑 Генерирует оглавление
- 🚫 Исключает node_modules, .git, dist и др.
- 🎯 Поддерживает фильтрацию по расширениям

**Команда:**
```bash
node graph-analyzer.js minify-folder <путь_к_каталогу> [опции]
```

**Опции:**

| Опция | Сокращение | Описание | По умолчанию |
|-------|------------|----------|--------------|
| `--output` | `-o` | Выходной файл | `ai-project-context.md` |
| `--depth` | `-d` | Глубина рекурсии | `10` |
| `--extensions` | `-e` | Расширения через запятую | `.js,.ts,.tsx,.jsx,.vue,.mjs,.cjs` |
| `--exclude` | `-x` | Паттерны для исключения | `node_modules,.git,dist,build,...` |
| `--no-structure` | - | Не показывать структуру каталога | `false` |
| `--no-toc` | - | Не показывать оглавление | `false` |

**Примеры:**
```bash
# Базовое использование
node graph-analyzer.js minify-folder ./src

# С кастомным выходным файлом
node graph-analyzer.js minify-folder ./src -o docs/project-context.md

# Ограничение глубины
node graph-analyzer.js minify-folder ./src -d 2

# Только JS и TS файлы
node graph-analyzer.js minify-folder ./src -e .js,.ts

# Исключить тесты
node graph-analyzer.js minify-folder ./src -x test,__tests__,mock

# Комбинированный пример
node graph-analyzer.js minify-folder . \
  -o ./ai/project.md \
  -d 3 \
  -e .js,.ts,.vue \
  -x node_modules,dist,.git
```

**Выходной файл:** `ai-project-context.md` (или указанный)

**Структура выходного файла:**
```markdown
# 🤖 AI Context - Полный проект

**Сгенерировано:** 2026-06-09 15:30:45
**Исходная директория:** `/project/src`
**Всего файлов:** 47
**Режим:** Сжатый (только сигнатуры)

## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ
[Системный промпт]

## 📑 Оглавление
[Ссылки на все файлы]

## 📁 Структура проекта
[Дерево каталогов]

## 📄 Содержимое файлов
[Сжатые файлы с сохранением иерархии]

## 📊 Статистика сжатия
| Показатель | Значение |
|------------|----------|
| Исходный размер | 156.78 KB |
| Сжатый размер | 23.45 KB |
| Экономия | 133.33 KB (85.0%) |
```

---

### 5. prompt-pack - Сборка контекста для ИИ

**Назначение:** Автоматическая сборка оптимального контекста для передачи ИИ при работе над конкретным файлом.

**Команда:**
```bash
node graph-analyzer.js prompt-pack <путь_к_файлу> [глубина]
```

**Выход:** `ai-prompt-bundle.md`

**Пример:**
```bash
node graph-analyzer.js prompt-pack ./src/checkout/OrderService.ts 2
```

---

### 6. impact - Анализ зоны влияния

**Назначение:** Оценка того, какие файлы и функции будут затронуты при изменении сущности.

**Команда:**
```bash
node graph-analyzer.js impact <путь_к_файлу> <имя_сущности>
```

**Выход:** `ai-impact-report.md`

**Пример:**
```bash
node graph-analyzer.js impact ./src/database/queries.ts findUserById
```

---

### 7. dead-code - Поиск мертвого кода

**Назначение:** Выявление неиспользуемого кода для безопасного удаления.

**Команда:**
```bash
node graph-analyzer.js dead-code <путь_к_файлу>
```

**Выход:** `ai-dead-code-report.md`

**Пример:**
```bash
node graph-analyzer.js dead-code ./src/legacy/utils.ts
```

---

## 💡 Примеры использования

### Сценарий 1: Подготовка всего проекта для ИИ (НОВЫЙ РЕЖИМ!)

```bash
# Минифицируем весь проект
node graph-analyzer.js minify-folder ./src -o ai-full-context.md

# Отправляем ai-full-context.md в ИИ
# ИИ получает полную картину архитектуры за 15% от исходного размера!
```

### Сценарий 2: Быстрый вопрос о конкретном файле

```bash
# Сжать один файл
node graph-analyzer.js minify ./src/complex/Component.jsx

# Отправить ai-context.txt в ИИ с вопросом
```

### Сценарий 3: Подготовка задачи для ИИ

```bash
# Собрать контекст для файла, который нужно изменить
node graph-analyzer.js prompt-pack ./src/features/payment.js 2

# Загрузить ai-prompt-bundle.md в ChatGPT/Claude
```

### Сценарий 4: Безопасный рефакторинг

```bash
# Перед удалением функции проверить влияние
node graph-analyzer.js impact ./src/old/api.js deprecatedMethod

# Если отчет пуст - можно удалять
```

### Сценарий 5: Очистка легаси кода

```bash
# Найти мертвый код
node graph-analyzer.js dead-code ./src/legacy/module.js

# Почистить по отчету
```

### Сценарий 6: Анализ архитектуры

```bash
# Построить граф зависимостей
node graph-analyzer.js project ./src/main.js 2

# Открыть report.html в браузере
# Изучить визуализацию связей
```

---

## 🤖 Промпты для ИИ

### Для режима minify-folder (НОВЫЙ!)

```markdown
## 📋 Инструкция для ИИ

Я загружаю сжатый контекст всего проекта в файле `ai-project-context.md`.

**Данные содержат:**
- Полная структура каталогов проекта
- Все экспортируемые функции с сигнатурами
- TypeScript интерфейсы и типы
- JSDoc комментарии
- Импорты между модулями

**Реализация функций скрыта для экономии токенов, но сигнатуры сохранены.**

**Задача:** [Опишите вашу задачу, например:]
- "Проанализируй архитектуру проекта и найди проблемные места"
- "Предложи рефакторинг модуля авторизации"
- "Найди все зависимости между модулями payment и user"
- "Опиши, как устроен модуль checkout"

Я ожидаю подробный ответ с конкретными рекомендациями.
```

### Для анализа графа

```markdown
## 📋 Инструкция для ИИ

Я загружаю граф зависимостей моего проекта в формате JSON.

**Задача:** Проанализируй архитектуру и предложи:
1. Основные модули и их ответственность
2. Потенциальные проблемы (циклические зависимости)
3. Рекомендации по улучшению структуры

**Данные:** [Вставьте содержимое output.json]
```

### Для рефакторинга

```markdown
## 📋 Инструкция для ИИ

Я загружаю контекст для рефакторинга файла `[target-file]`.

**Целевой файл:** дан полностью
**Зависимости:** даны в сжатом виде

**Задача:** [Опишите вашу задачу]

**Ограничения:**
- Не изменяйте сигнатуры экспортируемых функций
- Сохраняйте обратную совместимость
```

---

## 📁 Структура выходных файлов

```
project/
├── graph-analyzer.js              # Главный скрипт
│
├── Визуализация (project/file):
├── report.html                    # Интерактивный граф
├── output.svg                     # Векторный граф
├── output.json                    # JSON структура
├── output.dot                     # DOT код
│
├── Сжатие (minify):
├── ai-context.txt                 # Сжатый один файл
│
├── Рекурсивное сжатие (minify-folder):
├── ai-project-context.md          # Весь проект в сжатом виде ⭐
│
├── Контекст (prompt-pack):
├── ai-prompt-bundle.md            # Контекст для ИИ
│
├── Анализ (impact):
├── ai-impact-report.md            # Отчет о влиянии
│
└── Очистка (dead-code):
└── ai-dead-code-report.md         # Отчет о мертвом коде
```

---

## 📊 Сравнение режимов сжатия

| Режим | Файлов | Сжатие | Размер выхода | Когда использовать |
|-------|--------|--------|---------------|---------------------|
| `minify` | 1 | 70-90% | 1-50 KB | Быстрый вопрос о файле |
| `prompt-pack` | Файл + зависимости | 60-80% | 10-200 KB | Изменение конкретного файла |
| `minify-folder` | **Весь проект** | **80-90%** | 50KB-5MB | **Полный анализ архитектуры** ⭐ |

---

## 💡 Советы и рекомендации

### 1. Экономия токенов с minify-folder

```bash
# Вместо отправки 50MB папки
du -sh ./src  # 50MB

# Получаем 5MB сжатого контекста
node graph-analyzer.js minify-folder ./src -o context.md
ls -lh context.md  # 5MB (экономия 90%!)
```

### 2. Выбор глубины для рекурсивного сжатия

```bash
# Глубина 2 - основные модули (быстро)
node graph-analyzer.js minify-folder ./src -d 2

# Глубина 5 - большинство файлов (баланс)
node graph-analyzer.js minify-folder ./src -d 5

# Глубина 10+ - всё включая глубокие вложения
node graph-analyzer.js minify-folder ./src -d 10
```

### 3. Фильтрация для больших проектов

```bash
# Только исходники, без тестов
node graph-analyzer.js minify-folder ./src \
  -e .js,.ts \
  -x test,__tests__,spec,mock

# Только Vue компоненты
node graph-analyzer.js minify-folder ./src \
  -e .vue \
  -x node_modules
```

### 4. Интеграция в CI/CD

```yaml
# .github/workflows/ai-context.yml
name: Generate AI Context
on: [push]
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: node graph-analyzer.js minify-folder ./src -o ai-context.md
      - uses: actions/upload-artifact@v3
        with:
          name: ai-context
          path: ai-context.md
```

### 5. Лучшие практики

- ✅ **Для архитектурных вопросов** используйте `minify-folder`
- ✅ **Для точечных правок** используйте `prompt-pack`
- ✅ **Для быстрых вопросов** используйте `minify`
- ✅ **Перед удалением кода** всегда запускайте `impact`
- ✅ **Периодически** запускайте `dead-code` для чистоты
- ❌ Не отправляйте полные проекты без сжатия
- ❌ Не удаляйте экспорты без `impact` анализа

---

## 📄 Лицензия

**CSL-1.0 (Custom Source License)**

- ✅ Использование разрешено в **некоммерческих целях**
- 🔒 Коммерческое использование **ТОЛЬКО** с письменного разрешения автора
- 🔄 Изменение файлов запрещено - только через Pull Request

Полный текст лицензии: см. файл [LICENSE](LICENSE)

---

## 👤 Контакты

**Автор:** Забабурин Сергей  
**Email:** zababurins@vk.com  
**GitHub:** [ZababurinSergei/ast-analyzer](https://github.com/ZababurinSergei/ast-analyzer)

---

<div align="center">

**⭐ Если этот инструмент помог вам в работе с ИИ, поставьте звезду на GitHub!**

[← Наверх](#-ast-analyzer---ai-toolkit)

</div>
```