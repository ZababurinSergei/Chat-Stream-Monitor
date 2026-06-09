# 🔪 РАЗБИЕНИЕ ФАЙЛА НА МОДУЛИ

**Сгенерировано:** 6/9/2026, 7:48:34 PM
**Целевой файл:** `./graph-analyzer.js`
**Размер файла:** 76.11 KB
**Количество строк:** 1779
**Параметры анализа:**
- Целевой размер кластера: 3
- Максимальный размер кластера: 10
- Глубина анализа: 5
- Паттерны исключения: `node_modules, .git, dist, build, coverage, .nyc_output, __pycache__, .cache, .next, out, .nuxt, .output, .vercel, tmp, temp`

---

## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ

Ты — эксперт по рефакторингу кода. Твоя задача — **разбить монолитный файл на логически связанные модули**.

### Критерии выделения модуля:

1. **Связность (Cohesion)** — функции/классы, которые часто вызывают друг друга
2. **Ответственность (Responsibility)** — общая тема/домен (например, валидация, API, UI)
3. **Переиспользование (Reusability)** — сущности, которые могут быть полезны отдельно
4. **Тестируемость (Testability)** — можно тестировать независимо
5. **Размер модуля** — рекомендуется 50-200 строк на модуль

### Анти-паттерны, которых следует избегать:

- ❌ Циклические зависимости между модулями
- ❌ Один модуль знает слишком много о других
- ❌ "Мусорный" модуль (Utils) со всем подряд
- ❌ Слишком мелкие модули (1-2 функции)
- ❌ Слишком крупные модули (>300 строк)

---

## 📊 СТАТИСТИКА ФАЙЛА

| Показатель | Значение |
|------------|----------|
| Всего строк | 1779 |
| Экспортируемых сущностей | 0 |
| Функций | 27 |
| Классов | 0 |
| Констант | 0 |
| Интерфейсов/Типов | 0 |
| Импортов | 6 |

---

## 📥 ИМПОРТЫ

```typescript
import { default as fs } from 'fs';
import { default as path } from 'path';
import { fileURLToPath } from 'url';
import { default as parser } from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
```

---

## 🔍 ВЫЯВЛЕННЫЕ КЛАСТЕРЫ (КАНДИДАТЫ В МОДУЛИ)

На основе анализа вызовов функций (call graph) выявлены следующие кластеры:

### 1. Кластер: `buildFileInternalGraphCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 2 сущностей
- **Связность:** 50.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `buildFileInternalGraph`, `parseFile`
- **Зависимости:** `parseFile`, `walk`

### 2. Кластер: `analyzeModuleStructureCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 2 сущностей
- **Связность:** 50.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `analyzeModuleStructure`, `parseFile`
- **Зависимости:** `parseFile`, `walk`

### 3. Кластер: `generateHTMLReportCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 2 сущностей
- **Связность:** 50.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `generateHTMLReport`, `escapeHtml`
- **Зависимости:** `escapeHtml`

### 4. Кластер: `parseArgsCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 2 сущностей
- **Связность:** 50.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `parseArgs`, `showHelp`
- **Зависимости:** `showHelp`, `parseInt`

### 5. Кластер: `scanCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 4 сущностей
- **Связность:** 33.3%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `scan`, `parseFile`, `isExternalModule`, `resolveFilePath`
- **Зависимости:** `parseFile`, `walk`, `isExternalModule`, `resolveFilePath`, `scan`

### 6. Кластер: `runImpactAnalysisCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 4 сущностей
- **Связность:** 33.3%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `runImpactAnalysis`, `getAllProjectFiles`, `parseFile`, `resolveFilePath`
- **Зависимости:** `getAllProjectFiles`, `parseFile`, `walk`, `resolveFilePath`, `getAllProjectFiles`

### 7. Кластер: `findDeadCodeCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 4 сущностей
- **Связность:** 33.3%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `findDeadCode`, `parseFile`, `getAllProjectFiles`, `resolveFilePath`
- **Зависимости:** `parseFile`, `walk`, `getAllProjectFiles`, `resolveFilePath`, `getAllProjectFiles`

### 8. Кластер: `minifyForAICluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 3 сущностей
- **Связность:** 33.3%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `minifyForAI`, `parseFile`, `minifyCodeString`
- **Зависимости:** `parseFile`, `minifyCodeString`, `walk`

### 9. Кластер: `buildAiPromptPackCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 3 сущностей
- **Связность:** 33.3%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `buildAiPromptPack`, `buildProjectGraph`, `minifyForAI`
- **Зависимости:** `buildProjectGraph`, `minifyForAI`, `parseFile`, `minifyCodeString`

### 10. Кластер: `buildSplitModulePromptCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 6 сущностей
- **Связность:** 16.7%
- **Рекомендация:** ✅ Оптимальный размер для модуля.
- **Функции:** `buildSplitModulePrompt`, `analyzeModuleStructure`, `buildFileInternalGraph`, `findCyclicEdges`, `identifyClusters`, `minifyForAI`
- **Зависимости:** `analyzeModuleStructure`, `buildFileInternalGraph`, `findCyclicEdges`, `identifyClusters`, `minifyForAI`, `parseFile`, `walk`, `parseFile`, `walk`, `parseFile`, `minifyCodeString`

### 11. Кластер: `mainCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 14 сущностей
- **Связность:** 10.4%
- **Рекомендация:** ⚠️ Слишком большой кластер. Рекомендуется разбить дальше.
- **Функции:** `main`, `parseArgs`, `buildSplitModulePrompt`, `minifyFolder`, `findDeadCode`, `runImpactAnalysis`, `buildAiPromptPack`, `minifyForAI`, `showHelp`, `buildFileInternalGraph`, `buildProjectGraph`, `findCyclicEdges`, `convertToDOT`, `generateHTMLReport`
- **Зависимости:** `parseArgs`, `buildSplitModulePrompt`, `minifyFolder`, `findDeadCode`, `runImpactAnalysis`, `parseInt`, `buildAiPromptPack`, `minifyForAI`, `showHelp`, `buildFileInternalGraph`, `buildProjectGraph`, `findCyclicEdges`, `convertToDOT`, `generateHTMLReport`, `showHelp`, `parseInt`, `analyzeModuleStructure`, `buildFileInternalGraph`, `findCyclicEdges`, `identifyClusters`, `minifyForAI`, `parseFile`, `walk`, `getAllProjectFiles`, `resolveFilePath`, `getAllProjectFiles`, `parseFile`, `walk`, `resolveFilePath`, `buildProjectGraph`, `minifyForAI`, `parseFile`, `minifyCodeString`, `parseFile`, `walk`, `escapeHtml`

### 12. Кластер: `parseFileCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `parseFile`

### 13. Кластер: `resolveFilePathCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `resolveFilePath`

### 14. Кластер: `getAllProjectFilesCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `getAllProjectFiles`
- **Зависимости:** `getAllProjectFiles`

### 15. Кластер: `buildProjectGraphCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `buildProjectGraph`

### 16. Кластер: `findCyclicEdgesCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `findCyclicEdges`

### 17. Кластер: `showHelpCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `showHelp`

### 18. Кластер: `isExternalModuleCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `isExternalModule`

### 19. Кластер: `identifyClustersCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `identifyClusters`

### 20. Кластер: `renderNodeCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `renderNode`
- **Зависимости:** `renderNode`

### 21. Кластер: `minifyFolderCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `minifyFolder`

### 22. Кластер: `collectFilesCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `collectFiles`
- **Зависимости:** `collectFiles`

### 23. Кластер: `dfsCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `dfs`
- **Зависимости:** `dfs`

### 24. Кластер: `convertToDOTCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `convertToDOT`

### 25. Кластер: `generateDirectoryTreeCluster`
- **Тип:** 🔶 Вспомогательный (внутренний)
- **Размер:** 1 сущностей
- **Связность:** 0.0%
- **Рекомендация:** ⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.
- **Функции:** `generateDirectoryTree`

---

## 🎯 ПРЕДЛАГАЕМАЯ СТРУКТУРА МОДУЛЕЙ

На основе анализа предлагается следующая структура:

```
./
├── index.ts                 # Точка входа (реэкспорт)
├── types.ts                 # Общие интерфейсы и типы
├── buildfileinternalgraph.ts          # buildFileInternalGraph, parseFile
├── analyzemodulestructure.ts          # analyzeModuleStructure, parseFile
├── generatehtmlreport.ts          # generateHTMLReport, escapeHtml
├── parseargs.ts          # parseArgs, showHelp
├── scan.ts          # scan, parseFile, isExternalModule...
└── utils.ts                 # Общие утилиты
```

---

## 📄 ПОЛНЫЙ КОД ФАЙЛА

### `graph-analyzer.js`
```javascript
// graph-analyzer.js - Полная версия со всеми режимами и исправленными переменными

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const IGNORE_NODE_MODULES = true;
const SUPPORTED_EXTENSIONS = ['.ts', '.mjs', '.js', '.tsx', '.jsx', '.vue'];
const DEFAULT_EXCLUDE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', 'coverage',
    '.nyc_output', '__pycache__', '.cache', '.next', 'out',
    '.nuxt', '.output', '.vercel', 'tmp', 'temp'
];
const VUE_SCRIPT_PATTERN = /<script[^>]*>([\s\S]*?)<\/script>/i;

// ==========================================
// ПАРСИНГ ФАЙЛОВ
// ==========================================
function parseFile(filePath) {
    try {
        let code = fs.readFileSync(filePath, 'utf-8');

        if (filePath.endsWith('.vue')) {
            const scriptMatch = code.match(VUE_SCRIPT_PATTERN);
            if (!scriptMatch) {
                console.warn(`⚠️ В Vue файле ${filePath} не найден script блок`);
                return null;
            }
            code = scriptMatch[1];
        }

        return parser.parse(code, {
            ecmaVersion: 2026,
            sourceType: 'module',
            loc: true,
            range: true,
            comment: true,
            tokens: true
        });
    } catch (e) {
        console.error(`❌ Ошибка парсинга файла ${filePath}:`, e.message);
        return null;
    }
}

function isExternalModule(importTarget) {
    return !importTarget.startsWith('.') && !importTarget.startsWith('/') && !path.isAbsolute(importTarget);
}

function resolveFilePath(baseDir, targetPath) {
    const fullPath = path.resolve(baseDir, targetPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath;

    for (const ext of SUPPORTED_EXTENSIONS) {
        const withExt = fullPath + ext;
        if (fs.existsSync(withExt)) return withExt;

        if (ext === '.vue') {
            const vuePath = fullPath.replace(/\.(js|ts)$/, '.vue');
            if (fs.existsSync(vuePath)) return vuePath;
        }
    }
    return null;
}

function getAllProjectFiles(dir, filesList = [], excludePatterns = DEFAULT_EXCLUDE_PATTERNS) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const name = path.join(dir, file);
            if (excludePatterns.some(p => name.includes(p))) continue;
            if (fs.statSync(name).isDirectory()) {
                getAllProjectFiles(name, filesList, excludePatterns);
            } else if (SUPPORTED_EXTENSIONS.includes(path.extname(name))) {
                filesList.push(name);
            }
        }
    } catch (error) {
        console.warn(`⚠️ Ошибка чтения ${dir}: ${error.message}`);
    }
    return filesList;
}

// ==========================================
// MINIFY (Сжатие кода для ИИ)
// ==========================================
function minifyCodeString(code, ast) {
    if (!ast) return code;
    const cuts = [];

    walk(ast, {
        enter(node) {
            if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'MethodDefinition') && node.body) {
                if (node.body.range && node.body.range[0] < node.body.range[1]) {
                    cuts.push({
                        start: node.body.range[0] + 1,
                        end: node.body.range[1] - 1,
                        replaceWith: ' /* реализация скрыта */ '
                    });
                }
            }
            if (node.type === 'ArrowFunctionExpression' && node.body && node.body.type === 'BlockStatement') {
                if (node.body.range) {
                    cuts.push({
                        start: node.body.range[0] + 1,
                        end: node.body.range[1] - 1,
                        replaceWith: ' /* реализация скрыта */ '
                    });
                }
            }
            if (node.type === 'VariableDeclarator' && node.init &&
                !['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init.type)) {
                if (node.init.range) {
                    cuts.push({
                        start: node.init.range[0],
                        end: node.init.range[1],
                        replaceWith: '/* значение скрыто */'
                    });
                }
            }
        }
    });

    cuts.sort((a, b) => b.start - a.start);
    let minifiedCode = code;
    for (const cut of cuts) {
        minifiedCode = minifiedCode.slice(0, cut.start) + cut.replaceWith + minifiedCode.slice(cut.end);
    }
    return minifiedCode.replace(/^\s*[\r\n]/gm, '\n').replace(/\n{3,}/g, '\n\n');
}

function minifyForAI(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parseFile(filePath);
    return minifyCodeString(code, ast);
}

// ==========================================
// АНАЛИЗ ВНУТРЕННИХ СВЯЗЕЙ ДЛЯ РАЗБИЕНИЯ
// ==========================================
function analyzeModuleStructure(filePath, options = {}) {
    const {
        maxDepth = 5,
        excludePatterns = DEFAULT_EXCLUDE_PATTERNS
    } = options;

    // Проверка на исключение
    for (const pattern of excludePatterns) {
        if (filePath.includes(pattern)) {
            console.log(`⏭️ Пропуск файла по паттерну: ${pattern}`);
            return null;
        }
    }

    const ast = parseFile(filePath);
    if (!ast) return null;

    const code = fs.readFileSync(filePath, 'utf-8');
    const lines = code.split('\n');

    const exports = [];
    const imports = [];
    const functions = [];
    const classes = [];
    const constants = [];
    const interfaces = [];
    const types = [];
    const callGraph = {};
    let currentFunction = null;
    let currentDepth = 0;

    walk(ast, {
        enter(node) {
            // Сбор импортов
            if (node.type === 'ImportDeclaration' && node.source) {
                const specifiers = node.specifiers.map(spec => ({
                    local: spec.local.name,
                    imported: spec.type === 'ImportSpecifier' ? spec.imported.name :
                        spec.type === 'ImportDefaultSpecifier' ? 'default' : '*',
                    type: spec.type
                }));
                imports.push({
                    source: node.source.value,
                    specifiers,
                    loc: node.loc
                });
            }

            // Сбор экспортов
            if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                const decl = node.declaration;
                if (decl.type === 'FunctionDeclaration' && decl.id) {
                    exports.push({
                        name: decl.id.name,
                        type: 'function',
                        loc: decl.loc,
                        params: decl.params.map(p => p.name || 'unknown'),
                        async: decl.async || false,
                        startLine: decl.loc.start.line,
                        endLine: decl.loc.end.line
                    });
                } else if (decl.type === 'ClassDeclaration' && decl.id) {
                    exports.push({
                        name: decl.id.name,
                        type: 'class',
                        loc: decl.loc,
                        startLine: decl.loc.start.line,
                        endLine: decl.loc.end.line
                    });
                } else if (decl.type === 'VariableDeclaration') {
                    decl.declarations.forEach(declarator => {
                        if (declarator.id && declarator.id.name) {
                            exports.push({
                                name: declarator.id.name,
                                type: 'constant',
                                loc: declarator.loc,
                                startLine: declarator.loc.start.line,
                                endLine: declarator.loc.end.line
                            });
                        }
                    });
                }
            }

            if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
                const name = node.declaration.id?.name || 'default';
                exports.push({
                    name: `default${name !== 'default' ? ` as ${name}` : ''}`,
                    type: node.declaration.type === 'FunctionDeclaration' ? 'function' :
                        node.declaration.type === 'ClassDeclaration' ? 'class' : 'value',
                    isDefault: true,
                    loc: node.loc
                });
            }

            // Сбор функций
            if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.id) {
                functions.push({
                    name: node.id.name,
                    type: 'function',
                    exported: exports.some(e => e.name === node.id.name),
                    loc: node.loc,
                    params: node.params.map(p => p.name || 'unknown'),
                    async: node.async || false,
                    startLine: node.loc.start.line,
                    endLine: node.loc.end.line
                });
                currentFunction = node.id.name;
                currentDepth = 0;
                callGraph[currentFunction] = [];
            }

            // Сбор классов
            if (node.type === 'ClassDeclaration' && node.id) {
                classes.push({
                    name: node.id.name,
                    exported: exports.some(e => e.name === node.id.name),
                    loc: node.loc,
                    methods: [],
                    startLine: node.loc.start.line,
                    endLine: node.loc.end.line
                });
            }

            // Сбор методов классов
            if (node.type === 'MethodDefinition' && node.key && node.parent?.parent?.id) {
                const className = node.parent.parent.id.name;
                const methodName = node.key.name;
                const classObj = classes.find(c => c.name === className);
                if (classObj) {
                    classObj.methods.push({
                        name: methodName,
                        kind: node.kind,
                        static: node.static || false,
                        loc: node.loc
                    });
                }
            }

            // Сбор констант
            if (node.type === 'VariableDeclaration' &&
                node.parent?.type === 'Program' &&
                !node.declarations.some(d => exports.some(e => e.name === d.id?.name))) {
                node.declarations.forEach(decl => {
                    if (decl.id && decl.id.name) {
                        constants.push({
                            name: decl.id.name,
                            type: 'constant',
                            loc: decl.loc,
                            startLine: decl.loc.start.line,
                            endLine: decl.loc.end.line
                        });
                    }
                });
            }

            // Сбор интерфейсов
            if (node.type === 'TSInterfaceDeclaration' && node.id) {
                interfaces.push({
                    name: node.id.name,
                    exported: exports.some(e => e.name === node.id.name),
                    loc: node.loc,
                    members: node.body?.body?.length || 0,
                    startLine: node.loc.start.line,
                    endLine: node.loc.end.line
                });
            }

            // Сбор типов
            if (node.type === 'TSTypeAliasDeclaration' && node.id) {
                types.push({
                    name: node.id.name,
                    exported: exports.some(e => e.name === node.id.name),
                    loc: node.loc
                });
            }

            // Анализ вызовов с ограничением глубины
            if (currentFunction && node.type === 'CallExpression' &&
                node.callee.type === 'Identifier' && currentDepth < maxDepth) {
                const calledFunction = node.callee.name;
                if (callGraph[currentFunction] && !callGraph[currentFunction].includes(calledFunction)) {
                    callGraph[currentFunction].push(calledFunction);
                }
            }
        },
        leave(node) {
            if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.id) {
                currentFunction = null;
                currentDepth = 0;
            }
        }
    });

    // Статистика
    const stats = {
        totalLines: lines.length,
        totalExports: exports.length,
        totalFunctions: functions.length,
        totalClasses: classes.length,
        totalConstants: constants.length,
        totalInterfaces: interfaces.length,
        totalTypes: types.length,
        totalImports: imports.length
    };

    return {
        filePath,
        fileName: path.basename(filePath),
        stats,
        imports,
        exports,
        functions,
        classes,
        constants,
        interfaces,
        types,
        callGraph,
        fullCode: code,
        lines
    };
}

// ==========================================
// ИДЕНТИФИКАЦИЯ КЛАСТЕРОВ
// ==========================================
function identifyClusters(functions, callGraph, exports, options = {}) {
    const {
        targetClusterSize = 3,
        maxClusterSize = 10
    } = options;

    const clusters = [];
    const processed = new Set();

    // Подсчет частоты вызовов
    const callFrequency = {};
    for (const [caller, callees] of Object.entries(callGraph)) {
        for (const callee of callees) {
            callFrequency[callee] = (callFrequency[callee] || 0) + 1;
        }
    }

    // Сортировка по важности
    const sortedFunctions = [...functions].sort((a, b) => {
        const aScore = (a.exported ? 100 : 0) + (callFrequency[a.name] || 0);
        const bScore = (b.exported ? 100 : 0) + (callFrequency[b.name] || 0);
        return bScore - aScore;
    });

    for (const func of sortedFunctions) {
        if (processed.has(func.name)) continue;

        const cluster = {
            name: `${func.name}Cluster`,
            functions: [func.name],
            isExported: func.exported,
            dependencies: [...(callGraph[func.name] || [])],
            importers: [],
            cohesionScore: 0
        };

        // BFS для сбора связанных функций
        const queue = [func.name];
        while (queue.length > 0 && cluster.functions.length < maxClusterSize) {
            const current = queue.shift();
            if (processed.has(current)) continue;
            processed.add(current);

            const calls = callGraph[current] || [];
            for (const call of calls) {
                if (!cluster.functions.includes(call) &&
                    functions.some(f => f.name === call)) {
                    cluster.functions.push(call);
                    if (cluster.functions.length < maxClusterSize) {
                        queue.push(call);
                    }
                    cluster.dependencies.push(...(callGraph[call] || []));
                }
            }
        }

        if (cluster.functions.length > 0) {
            // Вычисление связности
            const internalCalls = cluster.functions.reduce((count, fn) => {
                const calls = callGraph[fn] || [];
                return count + calls.filter(c => cluster.functions.includes(c)).length;
            }, 0);
            const totalPossible = cluster.functions.length * (cluster.functions.length - 1);
            cluster.cohesionScore = totalPossible > 0 ? (internalCalls / totalPossible) * 100 : 0;

            // Определение типа
            const hasExport = cluster.functions.some(f =>
                exports.some(e => e.name === f)
            );
            cluster.type = hasExport ? 'core' : 'helper';
            cluster.size = cluster.functions.length;

            // Рекомендация по размеру
            if (cluster.size < targetClusterSize) {
                cluster.recommendation = '⚠️ Слишком маленький кластер. Рассмотрите объединение с другим.';
            } else if (cluster.size > maxClusterSize) {
                cluster.recommendation = '⚠️ Слишком большой кластер. Рекомендуется разбить дальше.';
            } else {
                cluster.recommendation = '✅ Оптимальный размер для модуля.';
            }

            clusters.push(cluster);
        }
    }

    // Сортировка по связности
    clusters.sort((a, b) => {
        if (a.cohesionScore !== b.cohesionScore) return b.cohesionScore - a.cohesionScore;
        return b.size - a.size;
    });

    return clusters;
}

// ==========================================
// РЕЖИМ 1: ПРОЕКТНЫЙ ГРАФ
// ==========================================
function buildProjectGraph(entryPoint, maxDepth = Infinity) {
    const graph = {};
    const visited = new Set();
    const rootAbsPath = path.resolve(entryPoint);

    function scan(filePath, currentDepth) {
        if (currentDepth > maxDepth) return;
        const absolutePath = path.resolve(filePath);
        if (visited.has(absolutePath)) return;
        visited.add(absolutePath);

        const relativeKey = path.relative(process.cwd(), absolutePath) || absolutePath;
        graph[relativeKey] = [];

        const ast = parseFile(absolutePath);
        if (!ast) return;

        const currentDir = path.dirname(absolutePath);
        const rawImports = [];

        walk(ast, {
            enter(node) {
                if ((node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') && node.source) {
                    rawImports.push(node.source.value);
                }
                if (node.type === 'ImportExpression' && node.source && node.source.type === 'Literal') {
                    rawImports.push(node.source.value);
                }
            }
        });

        rawImports.forEach(target => {
            if (IGNORE_NODE_MODULES && isExternalModule(target)) return;
            if (!isExternalModule(target)) {
                const resolvedAbs = resolveFilePath(currentDir, target);
                if (resolvedAbs) {
                    const depRelativeKey = path.relative(process.cwd(), resolvedAbs);
                    if (!graph[relativeKey].includes(depRelativeKey)) {
                        graph[relativeKey].push(depRelativeKey);
                    }
                    scan(resolvedAbs, currentDepth + 1);
                } else if (!graph[relativeKey].includes(target)) {
                    graph[relativeKey].push(target);
                }
            }
        });
    }

    scan(rootAbsPath, 1);
    return { rootKey: path.relative(process.cwd(), rootAbsPath) || rootAbsPath, graph };
}

// ==========================================
// РЕЖИМ 2: ВНУТРЕННИЙ ГРАФ ФАЙЛА
// ==========================================
function buildFileInternalGraph(filePath, options = {}) {
    const { maxDepth = 5 } = options;
    const ast = parseFile(filePath);
    if (!ast) return null;

    const declarations = {};
    const relations = [];

    ast.body.forEach(node => {
        let targetNode = node;
        if ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') && node.declaration) {
            targetNode = node.declaration;
        }

        if (targetNode.type === 'FunctionDeclaration' && targetNode.id) {
            declarations[targetNode.id.name] = { type: 'function', node: targetNode };
        } else if (targetNode.type === 'VariableDeclaration') {
            targetNode.declarations.forEach(decl => {
                if (decl.id && decl.id.name) {
                    declarations[decl.id.name] = { type: 'variable', node: decl };
                }
            });
        } else if (targetNode.type === 'ClassDeclaration' && targetNode.id) {
            declarations[targetNode.id.name] = { type: 'class', node: targetNode };
        }
    });

    Object.keys(declarations).forEach(currentEntity => {
        const entityNode = declarations[currentEntity].node;
        walk(entityNode, {
            enter(node) {
                if (node.type === 'Identifier') {
                    const name = node.name;
                    if (name !== currentEntity && declarations[name]) {
                        relations.push({ from: currentEntity, to: name });
                    }
                }
            }
        });
    });

    const fileGraph = {};
    Object.keys(declarations).forEach(key => { fileGraph[key] = []; });
    relations.forEach(rel => {
        if (fileGraph[rel.from] && !fileGraph[rel.from].includes(rel.to)) {
            fileGraph[rel.from].push(rel.to);
        }
    });

    return { rootKey: path.basename(filePath), graph: fileGraph };
}

// ==========================================
// РЕЖИМ 3: MINIFY (один файл)
// ==========================================

// ==========================================
// РЕЖИМ 4: PROMPT PACK
// ==========================================
function buildAiPromptPack(entryPointFile, maxDepth = 2) {
    const { rootKey, graph } = buildProjectGraph(entryPointFile, maxDepth);
    const allRelatedFiles = new Set([rootKey]);

    Object.keys(graph).forEach(key => {
        allRelatedFiles.add(key);
        graph[key].forEach(dep => allRelatedFiles.add(dep));
    });

    let markdown = `# 🧠 КОНТЕКСТ ДЛЯ ИИ АССИСТЕНТА\n\n`;
    markdown += `## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ:\n`;
    markdown += `Ты — ведущий инженер-разработчик. Ниже предоставлен полный контекст задачи.\n`;
    markdown += `- **Целевой файл** (который нужно изменить/проанализировать) дан ПОЛНОСТЬЮ\n`;
    markdown += `- **Зависимости** проекта даны в СЖАТОМ виде (только сигнатуры, без реализации)\n`;
    markdown += `- Используй сигнатуры зависимостей для генерации корректного кода\n\n`;

    markdown += `---\n\n`;
    markdown += `## 🎯 ЦЕЛЕВОЙ ФАЙЛ\n\n`;
    markdown += `### \`${rootKey}\`\n`;
    const ext = path.extname(entryPointFile).slice(1);
    const lang = ext === 'ts' || ext === 'tsx' || ext === 'vue' ? 'typescript' : 'javascript';
    markdown += `\`\`\`${lang}\n${fs.readFileSync(path.resolve(entryPointFile), 'utf-8')}\n\`\`\`\n\n`;

    markdown += `---\n\n`;
    markdown += `## 🔗 ЗАВИСИМОСТИ ПРОЕКТА (сжатые)\n\n`;

    let count = 0;
    for (const f of allRelatedFiles) {
        if (f === rootKey) continue;
        const abs = path.resolve(f);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
            count++;
            const depExt = path.extname(abs).slice(1);
            const depLang = depExt === 'ts' || depExt === 'tsx' || depExt === 'vue' ? 'typescript' : 'javascript';
            markdown += `### ${count}. \`${f}\`\n`;
            markdown += `\`\`\`${depLang}\n${minifyForAI(abs)}\n\`\`\`\n\n`;
        }
    }

    if (count === 0) {
        markdown += `*⚠️ У этого файла нет локальных зависимостей в рамках указанной глубины.*\n\n`;
    }

    return markdown;
}

// ==========================================
// РЕЖИМ 5: SPLIT-MODULE
// ==========================================
function buildSplitModulePrompt(targetFile, options = {}) {
    const {
        outputFile = 'ai-split-module-prompt.md',
        includeFullCode = true,
        includeMinified = true,
        includeGraph = true,
        includeStats = true,
        includeSuggestions = true,
        targetClusterSize = 3,
        maxClusterSize = 10,
        maxDepth = 5,
        excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
        prefix = ''
    } = options;

    console.log(`\n🔪 Анализ файла для разбиения на модули: ${targetFile}`);
    console.log(`📏 Целевой размер кластера: ${targetClusterSize}`);
    console.log(`📏 Максимальный размер кластера: ${maxClusterSize}`);
    console.log(`🔍 Глубина анализа: ${maxDepth}`);
    console.log(`🚫 Паттерны исключения: ${excludePatterns.join(', ')}`);
    if (prefix) console.log(`📛 Префикс файлов: ${prefix}`);

    // Анализ структуры
    const analysis = analyzeModuleStructure(targetFile, { maxDepth, excludePatterns });
    if (!analysis) {
        console.error('❌ Не удалось проанализировать файл');
        return null;
    }

    // Построение внутреннего графа
    const internalGraph = buildFileInternalGraph(targetFile, { maxDepth });

    // Поиск циклических зависимостей
    const cyclicEdges = internalGraph ? findCyclicEdges(internalGraph.graph) : new Set();

    // Идентификация кластеров
    const clusters = identifyClusters(
        analysis.functions,
        analysis.callGraph,
        analysis.exports,
        { targetClusterSize, maxClusterSize }
    );

    // Сжатая версия
    const minified = minifyForAI(targetFile);

    // Имена выходных файлов с префиксом
    const outputFiles = {
        prompt: prefix ? `${prefix}-${outputFile}` : outputFile,
        context: prefix ? `${prefix}-ai-context.txt` : 'ai-context.txt',
        graph: prefix ? `${prefix}-internal-graph.json` : 'internal-graph.json',
        analysis: prefix ? `${prefix}-module-analysis.json` : 'module-analysis.json'
    };

    console.log(`\n📊 Статистика файла:`);
    console.log(`   ├─ Функций: ${analysis.stats.totalFunctions}`);
    console.log(`   ├─ Классов: ${analysis.stats.totalClasses}`);
    console.log(`   ├─ Констант: ${analysis.stats.totalConstants}`);
    console.log(`   ├─ Экспортов: ${analysis.stats.totalExports}`);
    console.log(`   ├─ Импортов: ${analysis.stats.totalImports}`);
    console.log(`   └─ Интерфейсов/Типов: ${analysis.stats.totalInterfaces + analysis.stats.totalTypes}`);

    console.log(`\n🔗 Выявлено кластеров: ${clusters.length}`);
    clusters.forEach((cluster, i) => {
        console.log(`   ${i + 1}. ${cluster.name}: [${cluster.functions.join(', ')}] (${cluster.type}, связность: ${cluster.cohesionScore.toFixed(1)}%)`);
        if (cluster.recommendation) {
            console.log(`      ${cluster.recommendation}`);
        }
    });

    // Генерация Markdown промпта
    let markdown = `# 🔪 РАЗБИЕНИЕ ФАЙЛА НА МОДУЛИ\n\n`;
    markdown += `**Сгенерировано:** ${new Date().toLocaleString()}\n`;
    markdown += `**Целевой файл:** \`${targetFile}\`\n`;
    markdown += `**Размер файла:** ${(fs.statSync(targetFile).size / 1024).toFixed(2)} KB\n`;
    markdown += `**Количество строк:** ${analysis.stats.totalLines}\n`;
    markdown += `**Параметры анализа:**\n`;
    markdown += `- Целевой размер кластера: ${targetClusterSize}\n`;
    markdown += `- Максимальный размер кластера: ${maxClusterSize}\n`;
    markdown += `- Глубина анализа: ${maxDepth}\n`;
    if (prefix) markdown += `- Префикс файлов: ${prefix}\n`;
    markdown += `- Паттерны исключения: \`${excludePatterns.join(', ')}\`\n\n`;

    markdown += `---\n\n`;

    markdown += `## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ\n\n`;
    markdown += `Ты — эксперт по рефакторингу кода. Твоя задача — **разбить монолитный файл на логически связанные модули**.\n\n`;
    markdown += `### Критерии выделения модуля:\n\n`;
    markdown += `1. **Связность (Cohesion)** — функции/классы, которые часто вызывают друг друга\n`;
    markdown += `2. **Ответственность (Responsibility)** — общая тема/домен (например, валидация, API, UI)\n`;
    markdown += `3. **Переиспользование (Reusability)** — сущности, которые могут быть полезны отдельно\n`;
    markdown += `4. **Тестируемость (Testability)** — можно тестировать независимо\n`;
    markdown += `5. **Размер модуля** — рекомендуется 50-200 строк на модуль\n\n`;

    markdown += `### Анти-паттерны, которых следует избегать:\n\n`;
    markdown += `- ❌ Циклические зависимости между модулями\n`;
    markdown += `- ❌ Один модуль знает слишком много о других\n`;
    markdown += `- ❌ "Мусорный" модуль (Utils) со всем подряд\n`;
    markdown += `- ❌ Слишком мелкие модули (1-2 функции)\n`;
    markdown += `- ❌ Слишком крупные модули (>300 строк)\n\n`;

    markdown += `---\n\n`;

    // Статистика
    if (includeStats) {
        markdown += `## 📊 СТАТИСТИКА ФАЙЛА\n\n`;
        markdown += `| Показатель | Значение |\n`;
        markdown += `|------------|----------|\n`;
        markdown += `| Всего строк | ${analysis.stats.totalLines} |\n`;
        markdown += `| Экспортируемых сущностей | ${analysis.stats.totalExports} |\n`;
        markdown += `| Функций | ${analysis.stats.totalFunctions} |\n`;
        markdown += `| Классов | ${analysis.stats.totalClasses} |\n`;
        markdown += `| Констант | ${analysis.stats.totalConstants} |\n`;
        markdown += `| Интерфейсов/Типов | ${analysis.stats.totalInterfaces + analysis.stats.totalTypes} |\n`;
        markdown += `| Импортов | ${analysis.stats.totalImports} |\n\n`;
        markdown += `---\n\n`;
    }

    // Экспорты
    if (analysis.exports.length > 0) {
        markdown += `## 📤 ЭКСПОРТИРУЕМЫЕ СУЩНОСТИ\n\n`;
        markdown += `| Имя | Тип | Строки |\n`;
        markdown += `|-----|-----|--------|\n`;
        for (const exp of analysis.exports) {
            const lines = exp.endLine && exp.startLine ? `${exp.startLine}-${exp.endLine}` : '?';
            markdown += `| \`${exp.name}\` | ${exp.type} | ${lines} |\n`;
        }
        markdown += `\n---\n\n`;
    }

    // Импорты
    if (analysis.imports.length > 0) {
        markdown += `## 📥 ИМПОРТЫ\n\n`;
        markdown += `\`\`\`typescript\n`;
        for (const imp of analysis.imports) {
            const spec = imp.specifiers.map(s => s.imported === s.local ? s.imported : `${s.imported} as ${s.local}`).join(', ');
            markdown += `import { ${spec} } from '${imp.source}';\n`;
        }
        markdown += `\`\`\`\n\n---\n\n`;
    }

    // Кластеры
    if (includeSuggestions && clusters.length > 0) {
        markdown += `## 🔍 ВЫЯВЛЕННЫЕ КЛАСТЕРЫ (КАНДИДАТЫ В МОДУЛИ)\n\n`;
        markdown += `На основе анализа вызовов функций (call graph) выявлены следующие кластеры:\n\n`;

        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            markdown += `### ${i + 1}. Кластер: \`${cluster.name}\`\n`;
            markdown += `- **Тип:** ${cluster.type === 'core' ? '🔷 Основной (экспортируемый)' : '🔶 Вспомогательный (внутренний)'}\n`;
            markdown += `- **Размер:** ${cluster.size} сущностей\n`;
            markdown += `- **Связность:** ${cluster.cohesionScore.toFixed(1)}%\n`;
            markdown += `- **Рекомендация:** ${cluster.recommendation}\n`;
            markdown += `- **Функции:** ${cluster.functions.map(f => `\`${f}\``).join(', ')}\n`;
            if (cluster.dependencies.length > 0) {
                markdown += `- **Зависимости:** ${cluster.dependencies.map(d => `\`${d}\``).join(', ')}\n`;
            }
            markdown += `\n`;
        }
        markdown += `---\n\n`;
    }

    // Циклические зависимости
    if (cyclicEdges.size > 0) {
        markdown += `## ⚠️ ЦИКЛИЧЕСКИЕ ЗАВИСИМОСТИ\n\n`;
        markdown += `Обнаружены циклические зависимости, которые необходимо устранить при разбиении:\n\n`;
        for (const edge of cyclicEdges) {
            markdown += `- 🔴 \`${edge}\`\n`;
        }
        markdown += `\n---\n\n`;
    }

    // Предлагаемая структура
    if (includeSuggestions) {
        markdown += `## 🎯 ПРЕДЛАГАЕМАЯ СТРУКТУРА МОДУЛЕЙ\n\n`;
        markdown += `На основе анализа предлагается следующая структура:\n\n`;
        markdown += `\`\`\`\n${path.dirname(targetFile)}/\n`;
        markdown += `├── index.ts                 # Точка входа (реэкспорт)\n`;
        markdown += `├── types.ts                 # Общие интерфейсы и типы\n`;

        for (let i = 0; i < Math.min(clusters.length, 5); i++) {
            const cluster = clusters[i];
            const moduleName = cluster.name.replace(/Cluster$/, '').toLowerCase();
            markdown += `├── ${moduleName}.ts          # ${cluster.functions.slice(0, 3).join(', ')}${cluster.functions.length > 3 ? '...' : ''}\n`;
        }

        markdown += `└── utils.ts                 # Общие утилиты\n`;
        markdown += `\`\`\`\n\n---\n\n`;
    }

    // Полный код
    if (includeFullCode) {
        const ext = path.extname(targetFile).slice(1);
        const lang = ext === 'ts' || ext === 'tsx' || ext === 'vue' ? 'typescript' : 'javascript';
        markdown += `## 📄 ПОЛНЫЙ КОД ФАЙЛА\n\n`;
        markdown += `### \`${path.basename(targetFile)}\`\n`;
        markdown += `\`\`\`${lang}\n${analysis.fullCode}\n\`\`\`\n\n---\n\n`;
    }

    // Сжатая версия
    if (includeMinified && minified) {
        markdown += `## ✂️ СЖАТАЯ ВЕРСИЯ (только сигнатуры)\n\n`;
        markdown += `\`\`\`typescript\n${minified}\n\`\`\`\n\n---\n\n`;
    }

    // Граф вызовов
    if (includeGraph && Object.keys(analysis.callGraph).length > 0) {
        markdown += `## 🕸️ ГРАФ ВЫЗОВОВ (Call Graph)\n\n`;
        markdown += `\`\`\`\n`;
        for (const [caller, callees] of Object.entries(analysis.callGraph)) {
            if (callees.length > 0) {
                markdown += `${caller} → ${callees.join(', ')}\n`;
            }
        }
        markdown += `\`\`\`\n\n---\n\n`;
    }

    // Ожидаемый ответ
    markdown += `## 📤 ОЖИДАЕМЫЙ ФОРМАТ ОТВЕТА\n\n`;
    markdown += `### 1. Анализ текущей структуры (2-3 предложения)\n\n`;
    markdown += `### 2. Предлагаемая структура модулей\n\n`;
    markdown += `\`\`\`\n${path.dirname(targetFile)}/\n`;
    markdown += `├── modules/\n`;
    markdown += `│   ├── module-a.ts\n`;
    markdown += `│   ├── module-b.ts\n`;
    markdown += `│   └── module-c.ts\n`;
    markdown += `├── types.ts\n`;
    markdown += `└── index.ts\n`;
    markdown += `\`\`\`\n\n`;
    markdown += `### 3. Код каждого нового модуля\n\n`;
    markdown += `Для каждого модуля укажи:\n`;
    markdown += `- Полный код файла\n`;
    markdown += `- Какие функции/классы переносятся\n`;
    markdown += `- Новые импорты/экспорты\n\n`;
    markdown += `### 4. Обновленный корневой файл (index.ts)\n\n`;
    markdown += `### 5. План миграции (пошагово)\n\n`;

    // Сохранение файлов
    fs.writeFileSync(outputFiles.prompt, markdown, 'utf-8');
    if (includeMinified && minified) {
        fs.writeFileSync(outputFiles.context, minified, 'utf-8');
    }
    if (includeGraph && internalGraph) {
        fs.writeFileSync(outputFiles.graph, JSON.stringify(internalGraph, null, 2), 'utf-8');
    }
    fs.writeFileSync(outputFiles.analysis, JSON.stringify({
        stats: analysis.stats,
        exports: analysis.exports,
        imports: analysis.imports,
        functions: analysis.functions.map(f => ({
            name: f.name,
            exported: f.exported,
            params: f.params,
            callCount: analysis.callGraph[f.name]?.length || 0
        })),
        classes: analysis.classes.map(c => ({
            name: c.name,
            exported: c.exported,
            methods: c.methods.length
        })),
        clusters: clusters.map(c => ({
            name: c.name,
            size: c.size,
            type: c.type,
            cohesionScore: c.cohesionScore,
            recommendation: c.recommendation,
            functions: c.functions
        }))
    }, null, 2), 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ПРОМПТ ДЛЯ РАЗБИЕНИЯ СОЗДАН!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📄 Выходные файлы${prefix ? ` (префикс: ${prefix})` : ''}:`);
    console.log(`   ├─ ${outputFiles.prompt}`);
    if (includeMinified && minified) console.log(`   ├─ ${outputFiles.context}`);
    if (includeGraph && internalGraph) console.log(`   ├─ ${outputFiles.graph}`);
    console.log(`   └─ ${outputFiles.analysis}`);
    console.log(`\n📊 Размер промпта: ${(markdown.length / 1024).toFixed(2)} KB`);

    return { markdown, analysis, outputFiles };
}

// ==========================================
// РЕЖИМ 6: MINIFY FOLDER
// ==========================================
function generateDirectoryTree(baseDir, relativePaths, excludePatterns) {
    const tree = {};

    for (const relPath of relativePaths) {
        const parts = relPath.split(path.sep);
        let current = tree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = null;
            } else {
                if (!current[part]) current[part] = {};
                current = current[part];
            }
        }
    }

    function renderNode(node, indent = '', prefix = '') {
        let result = '';
        const entries = Object.entries(node);

        for (let i = 0; i < entries.length; i++) {
            const [name, children] = entries[i];
            const isLast = i === entries.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            const newIndent = indent + (isLast ? '    ' : '│   ');

            if (children === null) {
                result += `${indent}${marker}📄 ${name}\n`;
            } else {
                result += `${indent}${marker}📁 ${name}/\n`;
                result += renderNode(children, newIndent, '');
            }
        }

        return result;
    }

    let output = `\`\`\`\n${path.basename(baseDir)}/\n`;
    output += renderNode(tree, '  ');
    output += `\`\`\`\n`;

    return output;
}

function minifyFolder(inputDir, options = {}) {
    const {
        outputFile = 'ai-project-context.md',
        extensions = ['.js', '.ts', '.tsx', '.jsx', '.vue', '.mjs', '.cjs'],
        excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
        maxDepth = 10,
        showStructure = true,
        addTableOfContents = true,
        sortByType = true
    } = options;

    const resolvedDir = path.resolve(inputDir);

    if (!fs.existsSync(resolvedDir)) {
        console.error(`❌ Каталог не существует: ${resolvedDir}`);
        return null;
    }

    console.log(`\n📁 Сканирование: ${resolvedDir}`);
    console.log(`📄 Расширения: ${extensions.join(', ')}`);
    console.log(`🚫 Исключения: ${excludePatterns.join(', ')}\n`);

    const files = [];

    function collectFiles(dir, currentDepth = 0) {
        if (currentDepth > maxDepth) return;

        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                const shouldExclude = excludePatterns.some(pattern =>
                    fullPath.includes(pattern) || item === pattern
                );

                if (shouldExclude) continue;

                if (stat.isDirectory()) {
                    collectFiles(fullPath, currentDepth + 1);
                } else if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    if (extensions.includes(ext)) {
                        files.push({
                            path: fullPath,
                            relativePath: path.relative(resolvedDir, fullPath),
                            ext: ext,
                            size: stat.size
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Ошибка чтения ${dir}: ${error.message}`);
        }
    }

    collectFiles(resolvedDir);

    if (files.length === 0) {
        console.log(`⚠️ Файлы с расширениями ${extensions.join(', ')} не найдены`);
        return null;
    }

    console.log(`📊 Найдено файлов: ${files.length}\n`);

    if (sortByType) {
        files.sort((a, b) => {
            if (a.ext !== b.ext) return a.ext.localeCompare(b.ext);
            return a.relativePath.localeCompare(b.relativePath);
        });
    }

    let markdown = `# 🤖 AI Context - Полный проект\n\n`;
    markdown += `**Сгенерировано:** ${new Date().toLocaleString()}\n`;
    markdown += `**Исходная директория:** \`${resolvedDir}\`\n`;
    markdown += `**Всего файлов:** ${files.length}\n`;
    markdown += `**Общий размер:** ${(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB\n`;
    markdown += `**Режим:** Сжатый (только сигнатуры, без реализации)\n\n`;

    markdown += `---\n\n`;
    markdown += `## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ\n\n`;
    markdown += `Ты — AI ассистент, который анализирует код проекта. Ниже представлен **полный проект** в сжатом виде:\n\n`;
    markdown += `- ✅ **Сохранены:** импорты, экспорты, сигнатуры функций, JSDoc, TypeScript типы\n`;
    markdown += `- ❌ **Удалены:** реализации функций, внутренние вычисления, локальные переменные\n`;
    markdown += `- 🎯 **Цель:** Понимание архитектуры при минимальном расходе токенов\n\n`;
    markdown += `### Как использовать этот контекст:\n\n`;
    markdown += `1. Проанализируй структуру проекта\n`;
    markdown += `2. Ответь на вопросы пользователя о взаимосвязях модулей\n`;
    markdown += `3. Предложи рефакторинг, основываясь на предоставленных сигнатурах\n\n`;
    markdown += `---\n\n`;

    if (addTableOfContents) {
        markdown += `## 📑 Оглавление\n\n`;
        const byExt = {};
        for (const file of files) {
            if (!byExt[file.ext]) byExt[file.ext] = [];
            byExt[file.ext].push(file);
        }
        for (const [ext, extFiles] of Object.entries(byExt)) {
            markdown += `### ${ext} файлы (${extFiles.length})\n`;
            for (const file of extFiles) {
                const anchor = file.relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                markdown += `- [\`${file.relativePath}\`](#${anchor})\n`;
            }
            markdown += `\n`;
        }
        markdown += `---\n\n`;
    }

    if (showStructure) {
        markdown += `## 📁 Структура проекта\n\n`;
        markdown += generateDirectoryTree(resolvedDir, files.map(f => f.relativePath), excludePatterns);
        markdown += `\n---\n\n`;
    }

    markdown += `## 📄 Содержимое файлов\n\n`;

    let processedCount = 0;
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;

    for (const file of files) {
        processedCount++;
        const progress = Math.round((processedCount / files.length) * 100);
        process.stdout.write(`\r   🏭 Минификация: ${processedCount}/${files.length} (${progress}%)`);

        const minified = minifyForAI(file.path);
        if (!minified) continue;

        totalOriginalSize += file.size;
        totalMinifiedSize += minified.length;

        const lang = file.ext === '.vue' ? 'vue' :
            ['.ts', '.tsx'].includes(file.ext) ? 'typescript' : 'javascript';

        markdown += `### \`${file.relativePath}\`\n`;
        markdown += `\`\`\`${lang}\n${minified}\n\`\`\`\n\n`;
        markdown += `---\n\n`;
    }

    console.log(`\n`);

    const savedKB = (totalOriginalSize - totalMinifiedSize) / 1024;
    const savedPercent = totalOriginalSize > 0 ? ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(1) : 0;

    markdown += `## 📊 Статистика сжатия\n\n`;
    markdown += `| Показатель | Значение |\n`;
    markdown += `|------------|----------|\n`;
    markdown += `| Исходный размер | ${(totalOriginalSize / 1024).toFixed(2)} KB |\n`;
    markdown += `| Сжатый размер | ${(totalMinifiedSize / 1024).toFixed(2)} KB |\n`;
    markdown += `| Экономия | ${savedKB.toFixed(2)} KB (${savedPercent}%) |\n`;
    markdown += `| Количество файлов | ${files.length} |\n\n`;

    fs.writeFileSync(outputFile, markdown, 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ГОТОВО!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📄 Выходной файл: ${path.resolve(outputFile)}`);
    console.log(`📊 Размер: ${(totalMinifiedSize / 1024).toFixed(2)} KB (сжатие ${savedPercent}%)`);
    console.log(`📁 Файлов обработано: ${files.length}`);
    console.log(`\n💡 Отправьте этот файл в ИИ для анализа всего проекта!`);

    return markdown;
}

// ==========================================
// РЕЖИМ 7: IMPACT ANALYSIS
// ==========================================
function runImpactAnalysis(targetFile, entityName) {
    const targetAbsPath = path.resolve(targetFile);
    const targetRelKey = path.relative(process.cwd(), targetAbsPath);

    console.log(`🔍 Поиск использований "${entityName}" из "${targetRelKey}"...`);

    const allFiles = getAllProjectFiles(process.cwd(), [], DEFAULT_EXCLUDE_PATTERNS);
    const impacts = [];

    for (const file of allFiles) {
        if (path.resolve(file) === targetAbsPath) continue;

        const ast = parseFile(file);
        if (!ast) continue;

        const fileRelKey = path.relative(process.cwd(), file);
        const currentDir = path.dirname(file);
        let isImported = false;
        let localImportName = entityName;

        walk(ast, {
            enter(node) {
                if (node.type === 'ImportDeclaration' && node.source) {
                    const resolvedAbs = resolveFilePath(currentDir, node.source.value);
                    if (resolvedAbs === targetAbsPath) {
                        node.specifiers.forEach(spec => {
                            if (spec.type === 'ImportSpecifier' && spec.imported.name === entityName) {
                                isImported = true;
                                localImportName = spec.local.name;
                            } else if (spec.type === 'ImportDefaultSpecifier' && entityName === 'default') {
                                isImported = true;
                                localImportName = spec.local.name;
                            } else if (spec.type === 'ImportNamespaceSpecifier') {
                                isImported = true;
                                localImportName = spec.local.name;
                            }
                        });
                    }
                }
            }
        });

        if (!isImported) continue;

        const affectedFunctions = new Set();
        let currentFunctionName = "Top-level (глобальный код)";

        walk(ast, {
            enter(node) {
                if ((node.type === 'FunctionDeclaration' || node.type === 'MethodDefinition') && node.id) {
                    currentFunctionName = `function ${node.id.name}()`;
                } else if (node.type === 'VariableDeclarator' && node.id && node.id.name &&
                    node.init && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init.type)) {
                    currentFunctionName = `arrow function ${node.id.name}()`;
                }

                if (node.type === 'Identifier' && node.name === localImportName) {
                    if (node.parent && !['ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier'].includes(node.parent.type)) {
                        affectedFunctions.add(currentFunctionName);
                    }
                }
            },
            leave(node) {
                if (['FunctionDeclaration', 'ArrowFunctionExpression', 'FunctionExpression', 'MethodDefinition'].includes(node.type)) {
                    currentFunctionName = "Top-level (глобальный код)";
                }
            }
        });

        if (affectedFunctions.size > 0) {
            impacts.push({ file: fileRelKey, usages: Array.from(affectedFunctions) });
        }
    }

    let report = `# ⚠️ ОТЧЕТ ПО ЗОНЕ ВЛИЯНИЯ ИЗМЕНЕНИЙ\n\n`;
    report += `**Цель:** Изменение/удаление сущности \`${entityName}\` в файле \`${targetRelKey}\`\n\n`;

    if (impacts.length === 0) {
        report += `✅ **Безопасно!** Не найдено внешних файлов, использующих \`${entityName}\`.\n`;
    } else {
        report += `🚨 **ОБНАРУЖЕНО ${impacts.length} ЗАВИСИМЫХ ФАЙЛОВ!**\n\n`;
        impacts.forEach((imp, i) => {
            report += `### ${i + 1}. \`${imp.file}\`\n`;
            report += `Используется в:\n`;
            imp.usages.forEach(u => report += `  - [ ] Внутри \`${u}\`\n`);
            report += `\n`;
        });
    }

    return report;
}

// ==========================================
// РЕЖИМ 8: DEAD CODE DETECTOR
// ==========================================
function findDeadCode(targetFile) {
    const targetAbsPath = path.resolve(targetFile);
    const targetRelKey = path.relative(process.cwd(), targetAbsPath);
    const ast = parseFile(targetAbsPath);
    if (!ast) return null;

    const declaredLocals = {};
    const declaredExports = {};
    const usedIdentifiers = new Set();

    ast.body.forEach(node => {
        let isExport = false;
        let targetNode = node;

        if (node.type === 'ExportNamedDeclaration') {
            isExport = true;
            targetNode = node.declaration;
        } else if (node.type === 'ExportDefaultDeclaration') {
            isExport = true;
            targetNode = node.declaration;
            if (targetNode && targetNode.id) declaredExports['default'] = targetNode;
        }

        if (!targetNode) return;
        const collection = isExport ? declaredExports : declaredLocals;

        if (targetNode.type === 'FunctionDeclaration' && targetNode.id) {
            collection[targetNode.id.name] = targetNode;
        } else if (targetNode.type === 'VariableDeclaration') {
            targetNode.declarations.forEach(decl => {
                if (decl.id && decl.id.name) {
                    collection[decl.id.name] = decl;
                }
            });
        } else if (targetNode.type === 'ClassDeclaration' && targetNode.id) {
            collection[targetNode.id.name] = targetNode;
        }
    });

    walk(ast, {
        enter(node) {
            if (node.type === 'Identifier') {
                const parentType = node.parent?.type || '';
                const isDeclaration = parentType === 'FunctionDeclaration' && node.parent?.id === node ||
                    parentType === 'ClassDeclaration' && node.parent?.id === node ||
                    parentType === 'VariableDeclarator' && node.parent?.id === node ||
                    parentType === 'ImportSpecifier' ||
                    parentType === 'ImportDefaultSpecifier';

                if (!isDeclaration) {
                    usedIdentifiers.add(node.name);
                }
            }
        }
    });

    const deadLocals = Object.keys(declaredLocals).filter(name => !usedIdentifiers.has(name));

    const deadExports = [];
    const allProjectFiles = getAllProjectFiles(process.cwd(), [], DEFAULT_EXCLUDE_PATTERNS);

    for (const [exportName] of Object.entries(declaredExports)) {
        if (exportName === 'default') continue;

        let hasExternalUsage = false;
        for (const file of allProjectFiles) {
            if (path.resolve(file) === targetAbsPath) continue;

            const projectAst = parseFile(file);
            if (!projectAst) continue;

            const currentDir = path.dirname(file);

            walk(projectAst, {
                enter(node) {
                    if (node.type === 'ImportDeclaration' && node.source) {
                        const resolvedAbs = resolveFilePath(currentDir, node.source.value);
                        if (resolvedAbs === targetAbsPath) {
                            node.specifiers.forEach(spec => {
                                if (spec.type === 'ImportSpecifier' && spec.imported.name === exportName) {
                                    hasExternalUsage = true;
                                }
                            });
                        }
                    }
                }
            });

            if (hasExternalUsage) break;
        }

        if (!hasExternalUsage) deadExports.push(exportName);
    }

    let report = `# 🗑️ ОТЧЕТ ПО НЕИСПОЛЬЗУЕМОМУ КОДУ\n\n`;
    report += `**Анализируемый файл:** \`${targetRelKey}\`\n\n`;

    if (deadLocals.length === 0 && deadExports.length === 0) {
        report += `✨ **Отлично!** Мертвый код не обнаружен.\n`;
    } else {
        if (deadLocals.length > 0) {
            report += `## 🚫 Внутренний мертвый код\n`;
            report += `*Локальные сущности, объявленные, но не используемые в файле:*\n\n`;
            deadLocals.forEach(name => report += `  - [ ] \`${name}\`\n`);
            report += `\n`;
        }

        if (deadExports.length > 0) {
            report += `## 📦 Бесполезные экспорты\n`;
            report += `*Экспортируются, но не импортируются нигде в проекте:*\n\n`;
            deadExports.forEach(name => report += `  - [ ] \`export ${name}\`\n`);
            report += `\n`;
        }
    }

    return report;
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ГРАФОВ
// ==========================================
function findCyclicEdges(graph) {
    const visited = {};
    const cyclicEdges = new Set();

    Object.keys(graph).forEach(node => { visited[node] = 0; });

    function dfs(node) {
        visited[node] = 1;
        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
            if (visited[neighbor] === 1) {
                cyclicEdges.add(`${node}->${neighbor}`);
            } else if (visited[neighbor] === 0) {
                dfs(neighbor);
            }
        }
        visited[node] = 2;
    }

    Object.keys(graph).forEach(node => {
        if (visited[node] === 0) dfs(node);
    });

    return cyclicEdges;
}

function convertToDOT(graphData, cyclicEdges) {
    const { rootKey, graph } = graphData;
    let dot = `digraph "Dependency Graph" {\n`;
    dot += `  rankdir=LR;\n`;
    dot += `  splines=true;\n`;
    dot += `  node [shape=box, style="filled,rounded", color="#4f46e5", fontname="Arial", fillcolor="#f3f4f6", fontcolor="#1f2937", penwidth=1];\n`;
    dot += `  edge [color="#9ca3af", arrowhead=vee, penwidth=1];\n`;
    dot += `  "${rootKey}" [fillcolor="#4f46e5", fontcolor="#ffffff", penwidth=2, label="⭐ ${rootKey}"];\n`;

    Object.keys(graph).forEach(node => {
        graph[node].forEach(dep => {
            const edgeKey = `${node}->${dep}`;
            if (cyclicEdges.has(edgeKey)) {
                dot += `  "${node}" -> "${dep}" [color="#ef4444", penwidth=2.5, style="dashed", label="цикл"];\n`;
            } else {
                dot += `  "${node}" -> "${dep}";\n`;
            }
        });
    });

    dot += `}\n`;
    return dot;
}

function generateHTMLReport(svgContent, dotContent, jsonContent, title, hasCycles) {
    const banner = hasCycles
        ? `<div class="banner error">⚠️ Обнаружены циклические зависимости!</div>`
        : `<div class="banner success">✅ Циклических зависимостей нет</div>`;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Граф зависимостей - ${path.basename(title)}</title>
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        h1 { color: #1e293b; font-size: 24px; margin-bottom: 10px; }
        .banner { padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; font-weight: 500; }
        .banner.error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
        .banner.success { background: #f0fdf4; color: #166534; border-left: 4px solid #22c55e; }
        .graph-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; }
        svg { width: 100%; height: auto; min-height: 500px; }
        .code-section { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
        .code-card { flex: 1; background: #1e1e24; border-radius: 12px; padding: 15px; overflow: auto; max-height: 300px; }
        .code-card h3 { color: #f43f5e; margin-bottom: 10px; font-size: 14px; }
        .code-card pre { color: #a5d6a7; font-family: monospace; font-size: 11px; margin: 0; white-space: pre-wrap; }
        .hint { font-size: 12px; color: #64748b; text-align: center; margin-top: 15px; }
    </style>
</head>
<body>
    <h1>📊 Анализ зависимостей: ${path.basename(title)}</h1>
    ${banner}
    <div class="graph-container">
        <div id="graph-wrapper">${svgContent}</div>
        <div class="hint">💡 Колесо мыши — масштаб, зажать левую кнопку — перемещение</div>
    </div>
    <div class="code-section">
        <div class="code-card"><h3>📝 DOT (Graphviz)</h3><pre>${escapeHtml(dotContent)}</pre></div>
        <div class="code-card"><h3>📋 JSON (структура)</h3><pre>${escapeHtml(jsonContent)}</pre></div>
    </div>
    <script>
        window.onload = function() {
            const svg = document.querySelector('#graph-wrapper svg');
            if (svg) svgPanZoom(svg, { zoomEnabled: true, controlIconsEnabled: true, fit: true, center: true });
        };
    </script>
</body>
</html>`;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==========================================
// ПАРСИНГ АРГУМЕНТОВ КОМАНДНОЙ СТРОКИ
// ==========================================
function parseArgs() {
    const args = process.argv.slice(2);
    const mode = args[0];

    if (!mode || mode === '--help' || mode === '-h') {
        showHelp();
        return null;
    }

    // Режим split-module
    if (mode === 'split-module' || mode === 'split') {
        const targetPath = args[1];
        if (!targetPath) {
            console.error('❌ Укажите путь к файлу');
            return null;
        }

        const options = {
            outputFile: 'ai-split-module-prompt.md',
            includeFullCode: true,
            includeMinified: true,
            includeGraph: true,
            includeStats: true,
            includeSuggestions: true,
            targetClusterSize: 3,
            maxClusterSize: 10,
            maxDepth: 5,
            excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS],
            prefix: ''
        };

        for (let i = 2; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];

            if (arg === '--output' || arg === '-o') {
                options.outputFile = nextArg;
                i++;
            } else if (arg === '--target-cluster-size' || arg === '-t') {
                options.targetClusterSize = parseInt(nextArg, 10);
                i++;
            } else if (arg === '--max-cluster-size' || arg === '-m') {
                options.maxClusterSize = parseInt(nextArg, 10);
                i++;
            } else if (arg === '--max-depth' || arg === '-d') {
                options.maxDepth = parseInt(nextArg, 10);
                i++;
            } else if (arg === '--exclude' || arg === '-x') {
                options.excludePatterns = nextArg.split(',').map(e => e.trim());
                i++;
            } else if (arg === '--prefix' || arg === '-p') {
                options.prefix = nextArg;
                i++;
            } else if (arg === '--no-full-code') {
                options.includeFullCode = false;
            } else if (arg === '--no-minified') {
                options.includeMinified = false;
            } else if (arg === '--no-graph') {
                options.includeGraph = false;
            } else if (arg === '--no-stats') {
                options.includeStats = false;
            } else if (arg === '--no-suggestions') {
                options.includeSuggestions = false;
            }
        }

        return { mode: 'split-module', targetPath, options };
    }

    // Режим minify-folder
    if (mode === 'minify-folder') {
        const targetPath = args[1];
        if (!targetPath) {
            console.error('❌ Укажите путь к каталогу');
            return null;
        }

        const options = {
            outputFile: 'ai-project-context.md',
            showStructure: true,
            addTableOfContents: true,
            sortByType: true,
            maxDepth: 10,
            extensions: ['.js', '.ts', '.tsx', '.jsx', '.vue', '.mjs', '.cjs'],
            excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS]
        };

        for (let i = 2; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];

            if (arg === '--output' || arg === '-o') {
                options.outputFile = nextArg;
                i++;
            } else if (arg === '--depth' || arg === '-d') {
                options.maxDepth = parseInt(nextArg, 10);
                i++;
            } else if (arg === '--extensions' || arg === '-e') {
                options.extensions = nextArg.split(',').map(e => e.trim().toLowerCase());
                i++;
            } else if (arg === '--exclude' || arg === '-x') {
                options.excludePatterns = nextArg.split(',').map(e => e.trim());
                i++;
            } else if (arg === '--no-structure') {
                options.showStructure = false;
            } else if (arg === '--no-toc') {
                options.addTableOfContents = false;
            }
        }

        return { mode: 'minify-folder', targetPath, options };
    }

    // Остальные режимы
    const targetPath = args[1];
    const extraArg = args[2];
    const depthArg = args[3];

    return { mode, targetPath, extraArg, depthArg };
}

function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              🔍 AST ANALYZER - AI TOOLKIT v2.2                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📁 project      <файл> [depth]   - Граф зависимостей проекта    ║
║  📄 file         <файл>           - Внутренний граф файла         ║
║  ✂️  minify       <файл>           - Сжатие одного файла для ИИ   ║
║  📁 minify-folder <каталог> [опции] - Рекурсивное сжатие проекта  ║
║  🎒 prompt-pack  <файл> [depth]   - Сборка контекста для ИИ       ║
║  🔪 split-module <файл> [опции]   - Разбиение файла на модули     ║
║  💥 impact       <файл> <entity>  - Анализ зоны влияния           ║
║  🗑️  dead-code    <файл>           - Поиск мертвого кода          ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  split-module опции:                                             ║
║    --output, -o            <file>   Выходной файл промпта         ║
║    --target-cluster-size, -t <n>    Желаемый размер кластера (3)  ║
║    --max-cluster-size, -m  <n>      Максимальный размер (10)      ║
║    --max-depth, -d         <n>      Глубина анализа (5)           ║
║    --exclude, -x           <list>   Паттерны исключения           ║
║    --prefix, -p            <str>    Префикс для выходных файлов   ║
║    --no-full-code                    Не включать полный код        ║
║    --no-minified                     Не включать сжатую версию     ║
║    --no-graph                        Не включать граф вызовов      ║
║    --no-stats                        Не включать статистику        ║
║    --no-suggestions                  Не включать предложения       ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  minify-folder опции:                                            ║
║    --output, -o     <file>   Выходной файл (по умолч: ai-project-context.md)
║    --depth, -d      <n>      Глубина рекурсии (по умолч: 10)
║    --extensions, -e <list>   Расширения через запятую
║    --exclude, -x    <list>   Паттерны для исключения
║    --no-structure             Не показывать структуру каталога
║    --no-toc                   Не показывать оглавление
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Примеры:                                                        ║
║    # Разбиение файла на модули                                   ║
║    node graph-analyzer.js split-module ./src/monolith.js         ║
║    node graph-analyzer.js split-module ./src/app.ts -t 4 -m 8    ║
║    node graph-analyzer.js split-module ./src/comp.jsx -p auth    ║
║                                                                  ║
║    # Рекурсивное сжатие проекта                                  ║
║    node graph-analyzer.js minify-folder ./src -d 2               ║
║    node graph-analyzer.js minify-folder ./src -e .js,.ts         ║
║                                                                  ║
║    # Другие режимы                                               ║
║    node graph-analyzer.js project ./src/index.js 3               ║
║    node graph-analyzer.js impact ./src/db.ts findUser            ║
║    node graph-analyzer.js dead-code ./src/legacy.js              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    `);
}

// ==========================================
// MAIN
// ==========================================
async function main() {
    const parsed = parseArgs();
    if (!parsed) return;

    const { mode, targetPath, extraArg, depthArg, options } = parsed;

    // РЕЖИМ 5: split-module
    if (mode === 'split-module' || mode === 'split') {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔪 РАЗБИЕНИЕ ФАЙЛА НА МОДУЛИ`);
        console.log(`${'='.repeat(60)}`);

        const result = buildSplitModulePrompt(targetPath, options);
        if (result) {
            console.log(`\n📋 Инструкция:`);
            console.log(`   1. Откройте ${result.outputFiles.prompt}`);
            console.log(`   2. Скопируйте содержимое`);
            console.log(`   3. Отправьте в ChatGPT/Claude/Gemini`);
            console.log(`   4. Получите готовую структуру модулей`);
        }
        return;
    }

    // РЕЖИМ 4: minify-folder
    if (mode === 'minify-folder') {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📁 РЕКУРСИВНАЯ МИНИФИКАЦИЯ ПРОЕКТА`);
        console.log(`${'='.repeat(60)}`);

        minifyFolder(targetPath, options);
        return;
    }

    // РЕЖИМ 3: dead-code
    if (mode === 'dead-code') {
        console.log(`🔎 Анализ мертвого кода: ${targetPath}`);
        const report = findDeadCode(targetPath);
        if (report) {
            fs.writeFileSync('ai-dead-code-report.md', report);
            console.log(report);
            console.log(`\n✅ Отчет сохранен: ai-dead-code-report.md`);
        }
        return;
    }

    // РЕЖИМ 2: impact
    if (mode === 'impact') {
        if (!extraArg) {
            console.error('❌ Укажите имя сущности: node graph-analyzer.js impact <файл> <entity>');
            process.exit(1);
        }
        console.log(`💥 Анализ влияния: ${extraArg} в ${targetPath}`);
        const report = runImpactAnalysis(targetPath, extraArg);
        fs.writeFileSync('ai-impact-report.md', report);
        console.log(report);
        console.log(`\n✅ Отчет сохранен: ai-impact-report.md`);
        return;
    }

    // РЕЖИМ 1: prompt-pack
    if (mode === 'prompt-pack') {
        const depth = extraArg ? parseInt(extraArg, 10) : 2;
        console.log(`🎒 Сборка промпт-пака для ${targetPath} (глубина ${depth})`);
        const pack = buildAiPromptPack(targetPath, depth);
        fs.writeFileSync('ai-prompt-bundle.md', pack);
        console.log(`\n✅ Пакет сохранен: ai-prompt-bundle.md`);
        console.log(`📊 Размер: ${(pack.length / 1024).toFixed(2)} KB`);
        return;
    }

    // РЕЖИМ 0: minify
    if (mode === 'minify') {
        console.log(`✂️ Минификация: ${targetPath}`);
        const minified = minifyForAI(targetPath);
        if (minified) {
            fs.writeFileSync('ai-context.txt', minified);
            console.log(`\n✅ Минифицированный код сохранен: ai-context.txt`);
            const originalSize = fs.statSync(targetPath).size;
            console.log(`📊 Исходный размер: ${(originalSize / 1024).toFixed(2)} KB`);
            console.log(`📊 Сжатый размер: ${(minified.length / 1024).toFixed(2)} KB`);
            const ratio = (minified.length / originalSize * 100).toFixed(1);
            console.log(`📊 Экономия: ${(100 - ratio).toFixed(1)}% токенов`);
        }
        return;
    }

    // РЕЖИМЫ ГРАФОВ (project/file)
    let resultData = null;
    if (mode === 'project') {
        const maxDepth = extraArg ? parseInt(extraArg, 10) : Infinity;
        console.log(`📁 Построение графа проекта от ${targetPath} (глубина ${maxDepth === Infinity ? '∞' : maxDepth})`);
        resultData = buildProjectGraph(targetPath, maxDepth);
    } else if (mode === 'file') {
        console.log(`📄 Построение внутреннего графа файла ${targetPath}`);
        resultData = buildFileInternalGraph(targetPath);
    } else {
        console.error(`❌ Неизвестный режим: ${mode}`);
        showHelp();
        process.exit(1);
    }

    if (!resultData || Object.keys(resultData.graph).length === 0) {
        console.log("⚠️ Зависимости не найдены");
        process.exit(0);
    }

    const cyclicEdges = findCyclicEdges(resultData.graph);
    const hasCycles = cyclicEdges.size > 0;
    resultData.hasCycles = hasCycles;
    resultData.cyclicEdges = Array.from(cyclicEdges);

    fs.writeFileSync('output.json', JSON.stringify(resultData, null, 2));
    console.log(`   ✅ output.json (${Object.keys(resultData.graph).length} узлов)`);

    const dotContent = convertToDOT(resultData, cyclicEdges);
    fs.writeFileSync('output.dot', dotContent);
    console.log(`   ✅ output.dot`);

    console.log(`⚙️ Генерация SVG...`);
    const graphviz = await Graphviz.load();
    const svgContent = graphviz.dot(dotContent);
    fs.writeFileSync('output.svg', svgContent);
    console.log(`   ✅ output.svg`);

    const htmlContent = generateHTMLReport(svgContent, dotContent, JSON.stringify(resultData, null, 2), targetPath, hasCycles);
    fs.writeFileSync('report.html', htmlContent);
    console.log(`   ✅ report.html`);

    console.log(`\n🎉 Готово! Откройте report.html в браузере`);
    if (hasCycles) {
        console.log(`⚠️ Обнаружено ${cyclicEdges.size} циклических зависимостей`);
    }
}

main().catch(console.error);
```

---

## ✂️ СЖАТАЯ ВЕРСИЯ (только сигнатуры)

```typescript
// graph-analyzer.js - Полная версия со всеми режимами и исправленными переменными

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================
const __filename = /* значение скрыто */;
const __dirname = /* значение скрыто */;

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const IGNORE_NODE_MODULES = /* значение скрыто */;
const SUPPORTED_EXTENSIONS = /* значение скрыто */;
const DEFAULT_EXCLUDE_PATTERNS = /* значение скрыто */;
const VUE_SCRIPT_PATTERN = /* значение скрыто */;

// ==========================================
// ПАРСИНГ ФАЙЛОВ
// ==========================================
function parseFile(filePath) { /* реализация скрыта */ Module(importTarget) { /* реализация скрыта */ }

function resolveFilePath(baseDir, targetPath) { /* реализация скрыта */ ectFiles(dir, filesList = [], excludePatterns = DEFAULT_EXCLUDE_PATTERNS) { /* реализация скрыта */ t;
}

// ==========================================
// MINIFY (Сжатие кода для ИИ)
// ==========================================
function minifyCodeString(code, ast) { /* реализация скрыта */ 
```

---

## 🕸️ ГРАФ ВЫЗОВОВ (Call Graph)

```
getAllProjectFiles → getAllProjectFiles
minifyCodeString → walk
minifyForAI → parseFile, minifyCodeString
analyzeModuleStructure → parseFile, walk
scan → parseFile, walk, isExternalModule, resolveFilePath, scan
buildFileInternalGraph → parseFile, walk
buildAiPromptPack → buildProjectGraph, minifyForAI
buildSplitModulePrompt → analyzeModuleStructure, buildFileInternalGraph, findCyclicEdges, identifyClusters, minifyForAI
renderNode → renderNode
collectFiles → collectFiles
runImpactAnalysis → getAllProjectFiles, parseFile, walk, resolveFilePath
findDeadCode → parseFile, walk, getAllProjectFiles, resolveFilePath
dfs → dfs
generateHTMLReport → escapeHtml
parseArgs → showHelp, parseInt
main → parseArgs, buildSplitModulePrompt, minifyFolder, findDeadCode, runImpactAnalysis, parseInt, buildAiPromptPack, minifyForAI, showHelp, buildFileInternalGraph, buildProjectGraph, findCyclicEdges, convertToDOT, generateHTMLReport
```

---

## 📤 ОЖИДАЕМЫЙ ФОРМАТ ОТВЕТА

### 1. Анализ текущей структуры (2-3 предложения)

### 2. Предлагаемая структура модулей

```
./
├── modules/
│   ├── module-a.ts
│   ├── module-b.ts
│   └── module-c.ts
├── types.ts
└── index.ts
```

### 3. Код каждого нового модуля

Для каждого модуля укажи:
- Полный код файла
- Какие функции/классы переносятся
- Новые импорты/экспорты

### 4. Обновленный корневой файл (index.ts)

### 5. План миграции (пошагово)

