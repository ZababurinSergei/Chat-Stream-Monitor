```markdown
# TSGen Core

Умный генератор TypeScript конфигураций для монорепозиториев с поддержкой различных сборщиков.

## 🚀 Возможности

- **🎯 Автоопределение** типа пакета (frontend/backend/shared/library)
- **🔧 Поддержка** Vite, Webpack, Esbuild, Node.js
- **📦 Работа** ТОЛЬКО с существующими пакетами
- **🔗 Автоматическое** определение composite режима
- **🚫 Без ссылок** на несуществующие пакеты
- **📁 Генерация** дополнительных конфигов

## 📦 Установка

```bash
npm install -g @newkind/tsgen-core
# или
npx @newkind/tsgen-core
```

## 🏗️ Структура монорепозитория

```
monorepo/
├── packages/
│   ├── frontend-app/     # React/Vue приложение
│   ├── backend-api/      # Node.js API
│   ├── shared-utils/     # Общие утилиты
│   └── ui-library/       # UI библиотека
├── package.json
└── tsconfig.json         # Корневая конфигурация
```

## 🛠️ Использование

### Базовая генерация

```bash
# Генерация конфигураций для всех пакетов
tsgen generate

# Только корневая конфигурация
tsgen root

# Проверка структуры пакетов
tsgen check

# Справка
tsgen help
```

### Примеры пакетов

#### Frontend приложение (Vite + React)

**package.json:**
```json
{
  "name": "frontend-app",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@shared/utils": "workspace:*"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

**Сгенерированный tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/utils": ["../shared-utils/src"]
    }
  },
  "include": ["src/**/*", "vite.config.ts"],
  "references": [
    { "path": "../shared-utils" }
  ]
}
```

#### Backend API (Node.js)

**package.json:**
```json
{
  "name": "backend-api",
  "type": "module",
  "scripts": {
    "dev": "node --loader ts-node/esm src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.0",
    "@shared/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0"
  }
}
```

**Сгенерированный tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "node",
    "types": ["node"],
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/utils": ["../shared-utils/src"]
    }
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared-utils" }
  ]
}
```

#### Shared библиотека

**package.json:**
```json
{
  "name": "@shared/utils",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**Сгенерированный tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

## 🔧 Поддерживаемые сборщики

### ⚡ Vite
- **Типы пакетов**: `frontend`, `library`
- **Конфиги**: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.vitest.json`
- **Особенности**: JSX поддержка, горячая перезагрузка

### 📦 Webpack
- **Типы пакетов**: `frontend`, `library`, `shared`
- **Конфиги**: `tsconfig.json`, `tsconfig.dev.json`, `tsconfig.build.json`
- **Особенности**: Разделение dev/prod конфигов

### 🚀 Esbuild
- **Типы пакетов**: `frontend`, `backend`, `library`, `shared`, `node`
- **Конфиги**: `tsconfig.json`, `tsconfig.esbuild.json`
- **Особенности**: Быстрая сборка, универсальность

### 🖥️ Node
- **Типы пакетов**: `backend`, `node`, `library`, `shared`
- **Конфиги**: `tsconfig.json`, `tsconfig.test.json`, `tsconfig.cli.json`
- **Особенности**: Поддержка ESM/CJS, CLI утилиты

## 🎯 Детекция пакетов

### Определение типа пакета
- **По имени**: `frontend-app`, `backend-api`, `shared-utils`
- **По зависимостям**: React/Vue → frontend, Express → backend
- **По структуре**: наличие `src/`, TypeScript файлов

### Определение сборщика
- **Конфиг файлы**: `vite.config.ts`, `webpack.config.js`
- **Зависимости**: `vite`, `webpack`, `esbuild` в package.json
- **Скрипты**: `dev`, `build` команды

## 🔗 Composite проекты

Пакеты автоматически помечаются как composite если:
- Имеют зависимости в монорепозитории
- Являются библиотеками (`library`, `shared`)
- Явно указано `isComposite: true`

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true
  },
  "references": [
    { "path": "../shared-utils" },
    { "path": "../ui-library" }
  ]
}
```

## 📊 Команды

### `tsgen generate`
Полная генерация конфигураций для всех пакетов:
```bash
📦 Найдено пакетов: 4 (frontend, backend, shared, ui)
🔧 Генерация конфигурации для frontend...
✅ frontend - конфигурация сгенерирована
🌳 Генерация корневой конфигурации...
🎉 Генерация завершена!
```

### `tsgen check`
Проверка структуры пакетов:
```bash
📊 Найдено пакетов: 4
✅ frontend-app: frontend, vite, имеет исходники
✅ backend-api: backend, node, имеет исходники  
✅ shared-utils: shared, node, composite
✅ ui-library: library, vite, composite
```

### `tsgen root`
Только корневая конфигурация:
```json
{
  "compilerOptions": {
    "composite": true,
    "paths": {
      "@frontend-app/*": ["./packages/frontend-app/src/*"],
      "@backend-api/*": ["./packages/backend-api/src/*"]
    }
  },
  "references": [
    { "path": "./packages/frontend-app" },
    { "path": "./packages/backend-api" }
  ]
}
```

## ⚙️ Конфигурация

### Настройки по умолчанию
- **Target**: ES2022
- **Module**: ESNext
- **Strict**: true
- **Composite**: автоматически
- **Paths**: алиасы для монорепозитория

### Кастомизация
Добавьте `tsgen` секцию в package.json:

```json
{
  "tsgen": {
    "type": "frontend",
    "builder": "vite",
    "composite": true,
    "paths": {
      "@components/*": ["./src/components/*"]
    }
  }
}
```

## 🐛 Отладка

```bash
# Включить debug логи
DEBUG=1 tsgen generate

# Проверить конкретный пакет
cd packages/frontend-app && tsgen check

# Показать версию
tsgen version
```

## 📈 Миграция

### С существующего проекта
1. Убедитесь в структуре `packages/`
2. Запустите `tsgen check` для проверки
3. Запустите `tsgen generate` для генерации
4. Проверьте `tsconfig.json` файлы

### С нуля
```bash
mkdir my-monorepo && cd my-monorepo
mkdir -p packages/{frontend,backend,shared}
npm init -y
npx @newkind/tsgen-core generate
```

## 🤝 Совместимость

- **TypeScript**: 5.3+
- **Node.js**: 18+
- **Менеджеры пакетов**: npm, yarn, pnpm
- **Монорепозитории**: workspaces, pnpm workspaces

## 🆘 Помощь

```bash
tsgen help          # Полная справка
tsgen version       # Версия
tsgen check         # Диагностика
```

## 📄 Лицензия

MIT
```

Этот README покрывает все основные аспекты использования TSGen Core с практическими примерами для разных типов пакетов и сборщиков.