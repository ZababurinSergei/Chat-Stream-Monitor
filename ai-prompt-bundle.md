# 🧠 КОНТЕКСТ ДЛЯ ИИ АССИСТЕНТА

## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ:
Ты — ведущий инженер-разработчик. Ниже предоставлен полный контекст задачи.
- **Целевой файл** (который нужно изменить/проанализировать) дан ПОЛНОСТЬЮ
- **Зависимости** проекта даны в СЖАТОМ виде (только сигнатуры, без реализации)
- Используй сигнатуры зависимостей для генерации корректного кода

---

## 🎯 ЦЕЛЕВОЙ ФАЙЛ

### `graph-analyzer_work.js`
```javascript
// graph-analyzer.js - финальная версия с поддержкой Vue и улучшенной обработкой путей

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const IGNORE_NODE_MODULES = true;
const SUPPORTED_EXTENSIONS = ['.ts', '.mjs', '.js', '.tsx', '.jsx', '.vue'];
const VUE_SCRIPT_PATTERN = /<script[^>]*>([\s\S]*?)<\/script>/i;

// ==========================================
// ПАРСИНГ ФАЙЛОВ (с поддержкой Vue)
// ==========================================
function parseFile(filePath) {
    try {
        let code = fs.readFileSync(filePath, 'utf-8');

        // Извлекаем script из Vue SFC
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

        // Для Vue файлов особый случай
        if (ext === '.vue') {
            const vuePath = fullPath.replace(/\.(js|ts)$/, '.vue');
            if (fs.existsSync(vuePath)) return vuePath;
        }
    }
    return null;
}

function getAllProjectFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (name.includes('node_modules') || name.includes('.git') || name.includes('dist')) continue;
        if (fs.statSync(name).isDirectory()) {
            getAllProjectFiles(name, filesList);
        } else if (SUPPORTED_EXTENSIONS.includes(path.extname(name))) {
            filesList.push(name);
        }
    }
    return filesList;
}

// ==========================================
// MINIFY (сжатие для ИИ)
// ==========================================
function minifyCodeString(code, ast) {
    if (!ast) return code;
    const cuts = [];

    walk(ast, {
        enter(node) {
            // Удаляем тела функций
            if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'MethodDefinition') && node.body) {
                if (node.body.range && node.body.range[0] < node.body.range[1]) {
                    cuts.push({
                        start: node.body.range[0] + 1,
                        end: node.body.range[1] - 1,
                        replaceWith: ' /* реализация скрыта */ '
                    });
                }
            }
            // Удаляем тела стрелочных функций
            if (node.type === 'ArrowFunctionExpression' && node.body && node.body.type === 'BlockStatement') {
                if (node.body.range) {
                    cuts.push({
                        start: node.body.range[0] + 1,
                        end: node.body.range[1] - 1,
                        replaceWith: ' /* реализация скрыта */ '
                    });
                }
            }
            // Скрываем значения констант
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
function buildFileInternalGraph(filePath) {
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
// РЕЖИМ 3: MINIFY (выше)
// ==========================================

// ==========================================
// РЕЖИМ 4: AI PROMPT PACK
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
// РЕЖИМ 5: IMPACT ANALYSIS
// ==========================================
function runImpactAnalysis(targetFile, entityName) {
    const targetAbsPath = path.resolve(targetFile);
    const targetRelKey = path.relative(process.cwd(), targetAbsPath);

    console.log(`🔍 Поиск использований "${entityName}" из "${targetRelKey}"...`);
    const allFiles = getAllProjectFiles(process.cwd());
    const impacts = [];

    for (const file of allFiles) {
        if (path.resolve(file) === targetAbsPath) continue;

        const ast = parseFile(file);
        if (!ast) continue;

        const fileRelKey = path.relative(process.cwd(), file);
        const currentDir = path.dirname(file);
        let isImported = false;
        let localImportName = entityName;

        // Проверяем импорт нужной сущности
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

        // Ищем места использования
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

    // Формируем отчет
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
// РЕЖИМ 6: DEAD CODE DETECTOR
// ==========================================
function findDeadCode(targetFile) {
    const targetAbsPath = path.resolve(targetFile);
    const targetRelKey = path.relative(process.cwd(), targetAbsPath);
    const ast = parseFile(targetAbsPath);
    if (!ast) return null;

    const declaredLocals = {};
    const declaredExports = {};
    const usedIdentifiers = new Set();

    // Сбор объявлений
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
        }
    });

    // Сбор использований внутри файла
    walk(ast, {
        enter(node) {
            if (node.type === 'Identifier') {
                const parentType = node.parent?.type || '';
                const isDeclaration = parentType === 'FunctionDeclaration' && node.parent?.id === node ||
                    parentType === 'VariableDeclarator' && node.parent?.id === node ||
                    parentType === 'ImportSpecifier' ||
                    parentType === 'ImportDefaultSpecifier';

                if (!isDeclaration) {
                    usedIdentifiers.add(node.name);
                }
            }
        }
    });

    // Поиск неиспользуемых локальных сущностей
    const deadLocals = Object.keys(declaredLocals).filter(name => !usedIdentifiers.has(name));

    // Поиск неиспользуемых экспортов
    const deadExports = [];
    const allProjectFiles = getAllProjectFiles(process.cwd());

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

    // Формируем отчет
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
    dot += `  rankdir=LR;\n  splines=true;\n`;
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
// CLI
// ==========================================
const [,, mode, targetPath, extraArg] = process.argv;

if (!mode || !targetPath) {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              🔍 AST ANALYZER - AI TOOLKIT v2.0                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📁 1. project    <файл> [depth]   - Граф зависимостей проекта   ║
║  📄 2. file       <файл>           - Внутренний граф файла        ║
║  ✂️  3. minify     <файл>           - Сжатие кода для ИИ (экономия)║
║  🎒 4. prompt-pack <файл> [depth]   - Сборка контекста для ИИ     ║
║  💥 5. impact     <файл> <entity>   - Анализ зоны влияния         ║
║  🗑️  6. dead-code  <файл>           - Поиск мертвого кода         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

💡 Примеры:
  node graph-analyzer.js project ./src/index.js 3
  node graph-analyzer.js minify ./src/utils.js
  node graph-analyzer.js prompt-pack ./src/app.js 2
  node graph-analyzer.js impact ./src/db.ts query
  node graph-analyzer.js dead-code ./src/old-stuff.js
    `);
    process.exit(1);
}

async function main() {
    // РЕЖИМ 6: DEAD CODE
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

    // РЕЖИМ 5: IMPACT
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

    // РЕЖИМ 4: PROMPT PACK
    if (mode === 'prompt-pack') {
        const depth = extraArg ? parseInt(extraArg, 10) : 2;
        console.log(`🎒 Сборка промпт-пака для ${targetPath} (глубина ${depth})`);
        const pack = buildAiPromptPack(targetPath, depth);
        fs.writeFileSync('ai-prompt-bundle.md', pack);
        console.log(`\n✅ Пакет сохранен: ai-prompt-bundle.md`);
        console.log(`📊 Размер: ${(pack.length / 1024).toFixed(2)} KB`);
        return;
    }

    // РЕЖИМ 3: MINIFY
    if (mode === 'minify') {
        console.log(`✂️ Минификация: ${targetPath}`);
        const minified = minifyForAI(targetPath);
        if (minified) {
            fs.writeFileSync('ai-context.txt', minified);
            console.log(`\n✅ Минифицированный код сохранен: ai-context.txt`);
            console.log(`📊 Исходный размер: ${(fs.statSync(targetPath).size / 1024).toFixed(2)} KB`);
            console.log(`📊 Сжатый размер: ${(minified.length / 1024).toFixed(2)} KB`);
            const ratio = (minified.length / fs.statSync(targetPath).size * 100).toFixed(1);
            console.log(`📊 Экономия: ${100 - ratio}% токенов`);
        }
        return;
    }

    // РЕЖИМЫ 1-2: ГРАФЫ
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

## 🔗 ЗАВИСИМОСТИ ПРОЕКТА (сжатые)

*⚠️ У этого файла нет локальных зависимостей в рамках указанной глубины.*

