# 🚀 Chat Stream Monitor Monorepo

[![License](https://img.shields.io/badge/license-CSL--1.0-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange)](https://pnpm.io/)
[![Turbo](https://img.shields.io/badge/Turbo-2.9.18-00B4D8)](https://turbo.build/)

Монорепозиторий для инструментов анализа кода, AST-анализатора и сканера файловой системы.

## 📋 Оглавление

- [Структура](#-структура)
- [Предварительные требования](#-предварительные-требования)
- [Быстрый старт](#-быстрый-старт)
- [Разработка](#-разработка)
- [Доступные команды](#-доступные-команды)
- [Пакеты](#-пакеты)
- [CI/CD](#-cicd)
- [Лицензия](#-лицензия)

## 📁 Структура

```
Directory/monorepo/
├── Directory/                      # Основные проекты
│   ├── ast-analyzer/              # 🌟 AST Analyzer (главный инструмент)
│   │   ├── src/                   # Исходный код
│   │   ├── dist/                  # Сборка (gitignored)
│   │   ├── package.json           # Конфигурация пакета
│   │   └── README.md              # Документация
│   ├── 10/                        # Пользовательская документация (gitignored)
│   ├── 11/                        # Пользовательские функции (gitignored)
│   └── 12/                        # Пользовательские файлы (gitignored)
├── packages/                      # Публикуемые npm-пакеты
│   └── shared-types/              # Общие TypeScript типы
├── apps/                          # Приложения (демо, примеры использования)
│   └── (будущие приложения)
├── tooling/                       # Внутренние инструменты
│   ├── eslint-config/             # Общий ESLint конфиг
│   └── prettier-config/           # Общий Prettier конфиг
├── scripts/                       # Скрипты автоматизации
│   └── setup-workspace.sh         # Настройка workspace
├── logs/                          # Логи сканирования (gitignored)
├── fs/                            # Результаты сканирования FS (gitignored)
├── .husky/                        # Git hooks
├── pnpm-workspace.yaml            # Конфигурация pnpm workspace
├── turbo.json                     # Конфигурация Turborepo
├── tsconfig.base.json             # Базовая TypeScript конфигурация
├── package.json                   # Корневой package.json
└── README.md                      # Этот файл
```

## 📦 Предварительные требования

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git** >= 2.30.0

### Установка pnpm (если не установлен)

```bash
# npm
npm install -g pnpm

# или через curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# или через homebrew (macOS)
brew install pnpm
```

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/ZababurinSergei/Chat-Stream-Monitor.git
cd Chat-Stream-Monitor/Directory/monorepo
```

### 2. Настройка workspace

```bash
# Автоматическая настройка (рекомендуется)
./scripts/setup-workspace.sh

# Или вручную
pnpm install
pnpm build
```

### 3. Проверка работоспособности

```bash
# Запустить все тесты
pnpm test

# Проверить типы
pnpm type-check

# Запустить линтер
pnpm lint
```

## 🔧 Разработка

### Режим разработки

```bash
# Запустить все пакеты в режиме разработки
pnpm dev

# Запустить конкретный пакет
pnpm turbo dev --filter=@newkind/ast-analyzer
```

### Сборка

```bash
# Собрать все пакеты
pnpm build

# Собрать конкретный пакет
pnpm turbo build --filter=@newkind/ast-analyzer

# Сборка в watch режиме
pnpm turbo build:watch
```

### Тестирование

```bash
# Запустить все тесты
pnpm test

# Запустить тесты с покрытием
pnpm test:coverage

# Запустить тесты конкретного пакета
pnpm turbo test --filter=@newkind/ast-analyzer
```

### Линтинг и форматирование

```bash
# Проверить линтинг
pnpm lint

# Автоматически исправить проблемы
pnpm lint:fix

# Проверить форматирование
pnpm format:check

# Отформатировать код
pnpm format
```

### TypeScript проверка

```bash
# Проверить типы во всех пакетах
pnpm type-check

# Проверить типы в конкретном пакете
pnpm turbo type-check --filter=@newkind/ast-analyzer
```

### Очистка

```bash
# Очистить все билды и зависимости
pnpm clean
```

## 📝 Доступные команды

| Команда                 | Описание                      |
| ----------------------- | ----------------------------- |
| `pnpm dev`              | Запуск в режиме разработки    |
| `pnpm build`            | Сборка всех пакетов           |
| `pnpm test`             | Запуск всех тестов            |
| `pnpm test:coverage`    | Запуск тестов с покрытием     |
| `pnpm lint`             | Проверка линтинга             |
| `pnpm lint:fix`         | Исправление проблем линтинга  |
| `pnpm type-check`       | Проверка TypeScript типов     |
| `pnpm format`           | Форматирование кода           |
| `pnpm format:check`     | Проверка форматирования       |
| `pnpm clean`            | Очистка билдов и зависимостей |
| `pnpm changeset`        | Создание changeset для релиза |
| `pnpm version-packages` | Обновление версий пакетов     |
| `pnpm release`          | Публикация пакетов            |

## 📦 Пакеты

### Production пакеты

| Пакет                   | Версия | Описание                                            |
| ----------------------- | ------ | --------------------------------------------------- |
| `@newkind/ast-analyzer` | 3.0.0  | AST анализ, рефакторинг и семантическая верификация |
| `@newkind/shared-types` | 0.0.1  | Общие TypeScript типы                               |

### Internal tooling

| Пакет                   | Описание                    |
| ----------------------- | --------------------------- |
| `@repo/eslint-config`   | Общая ESLint конфигурация   |
| `@repo/prettier-config` | Общая Prettier конфигурация |

### Использование пакетов

```typescript
// Импорт из ast-analyzer
import { AutoRefactor, analyzeVueComponent } from "@newkind/ast-analyzer";

// Импорт общих типов
import type { FileNode, Config } from "@newkind/shared-types";
```

## 🔄 CI/CD

### GitHub Actions

Проект настроен на автоматическую проверку при каждом push и pull request:

- ✅ Линтинг кода
- ✅ Проверка типов TypeScript
- ✅ Запуск тестов
- ✅ Сборка всех пакетов
- ✅ Проверка лицензий

### Pre-commit хуки (Husky)

Автоматически запускаются перед каждым коммитом:

```bash
# Форматирование staged файлов
pnpm lint-staged

# Проверка типов
pnpm type-check
```

### Changesets для управления версиями

```bash
# Создать changeset
pnpm changeset

# Обновить версии пакетов
pnpm version-packages

# Опубликовать релиз
pnpm release
```

## 🎯 Использование AST Analyzer

### CLI команды

```bash
# Анализ зависимостей проекта
pnpm ast-analyzer project ./src/index.ts 3

# Анализ внутреннего графа файла
pnpm ast-analyzer file ./src/component.ts

# Автоматический рефакторинг с выделением модулей
pnpm ast-refactor refactor ./src/huge-file.js -t 3 -c 60

# Анализ Vue компонента
pnpm ast-analyzer vue-analyze ./src/App.vue

# Поиск мертвого кода
pnpm ast-analyzer dead-code ./src/legacy.js

# Анализ зоны влияния изменений
pnpm ast-analyzer impact ./src/db.ts findUser
```

### Программное использование

```typescript
import { AutoRefactor, SemanticPipeline } from "@newkind/ast-analyzer";

// Автоматический рефакторинг
const refactor = new AutoRefactor({
  modulesDir: "modules",
  targetClusterSize: 3,
  minCohesionScore: 60,
  dryRun: false,
});

const result = await refactor.refactor("./src/my-file.ts");

// Семантический анализ
const pipeline = new SemanticPipeline();
const analysis = await pipeline.run(["./src/app.ts"], {
  formalVerification: true,
  maxDepth: 5,
});
```

## 📄 Сканирование файловой системы

### Генерация конфигурации

```bash
pnpm config
```

### Запуск сканирования

```bash
pnpm start
# или
pnpm scan
```

Результаты сохраняются в `fs/fs.json`, отчет в `logs/scan_report.log`.

## 🔒 Лицензия

Этот проект использует **CSL-1.0 (Custom Source License)**:

- ✅ Некоммерческое использование разрешено
- ✅ Изменения только через Pull Request
- ❌ Коммерческое использование ТОЛЬКО с письменного разрешения автора

Полный текст лицензии: [LICENSE](./LICENSE)

### Проверка лицензий

```bash
# Добавить лицензионные заголовки
pnpm license:add

# Проверить неавторизованные изменения
pnpm license:check

# Полная верификация
pnpm license:verify
```

## 🤝 Контрибьютинг

1. Форкните репозиторий
2. Создайте ветку для изменений (`git checkout -b feature/amazing-feature`)
3. Внесите изменения (только через Pull Request!)
4. Запустите проверки (`pnpm lint && pnpm test && pnpm type-check`)
5. Создайте Pull Request в ветку `main`

## 📞 Контакты

- **Автор:** Забабурин Сергей
- **Email:** zababurins@vk.com
- **GitHub:** [ZababurinSergei](https://github.com/ZababurinSergei)

## 🙏 Благодарности

- [Turborepo](https://turbo.build/) - высокопроизводительная система сборки
- [pnpm](https://pnpm.io/) - быстрый и эффективный менеджер пакетов
- [Changesets](https://github.com/changesets/changesets) - управление версиями
- [Vitest](https://vitest.dev/) - современный фреймворк для тестирования

---

<div align="center">
  <sub>Built with ❤️ by Zababurin Sergei</sub>
</div>
```

Этот README.md содержит:

- Полную структуру монорепозитория
- Инструкции по установке и настройке
- Все доступные команды
- Информацию о пакетах
- Примеры использования AST Analyzer
- CI/CD информацию
- Лицензионные требования
- Инструкции для контрибьюторов

□ /Directory/monorepo/tooling/eslint-config/package.json
□ /Directory/monorepo/tooling/prettier-config/index.js
□ /Directory/monorepo/tooling/prettier-config/package.json
