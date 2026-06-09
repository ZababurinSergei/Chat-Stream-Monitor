import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// НАСТРОЙКА ФИЛЬТРАЦИИ
const IGNORE_NODE_MODULES = true;

// Безопасный парсинг в AST
function parseFile(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf-8');
        return parser.parse(code, {
            ecmaVersion: 2026,
            sourceType: 'module',
            loc: true,
            range: true
        });
    } catch (e) {
        console.error(`❌ Ошибка парсинга файла ${filePath}:`, e.message);
        return null;
    }
}

// Вспомогательная функция для проверки, является ли импорт внешним пакетом
function isExternalModule(importTarget) {
    // Встроенные модули Node.js (fs, path, и т.д.) или сторонние пакеты из node_modules
    return !importTarget.startsWith('.') && !importTarget.startsWith('/') && !path.isAbsolute(importTarget);
}

// ==========================================
// РЕЖИМ 1: Граф проекта с лимитом maxDepth
// ==========================================
function buildProjectGraph(entryPoint, maxDepth = Infinity) {
    const graph = {};
    const visited = new Set();

    function scan(filePath, currentDepth) {
        if (currentDepth > maxDepth) return;

        const absolutePath = path.resolve(filePath);
        if (visited.has(absolutePath)) return;
        visited.add(absolutePath);

        const relativeKey = path.relative(process.cwd(), absolutePath);
        graph[relativeKey] = [];

        const ast = parseFile(absolutePath);
        if (!ast) return;

        walk(ast, {
            enter(node) {
                // Статические импорты и ре-экспорты
                if ((node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') && node.source) {
                    const target = node.source.value;
                    if (!(IGNORE_NODE_MODULES && isExternalModule(target))) {
                        graph[relativeKey].push(target);
                    }
                }
                // Динамические импорты import(...)
                if (node.type === 'ImportExpression' && node.source && node.source.type === 'Literal') {
                    const target = node.source.value;
                    if (!(IGNORE_NODE_MODULES && isExternalModule(target))) {
                        graph[relativeKey].push(target);
                    }
                }
            }
        });

        const currentDeps = [...graph[relativeKey]];
        currentDeps.forEach(dep => {
            // Сканируем дальше только локальные файлы
            if (!isExternalModule(dep)) {
                const fullDepPath = path.resolve(path.dirname(absolutePath), dep);
                let resolvedPath = fullDepPath;
                if (!fs.existsSync(resolvedPath)) {
                    for (const ext of ['.ts', '.mjs', '.js']) {
                        if (fs.existsSync(fullDepPath + ext)) { resolvedPath = fullDepPath + ext; break; }
                    }
                }
                if (fs.existsSync(resolvedPath)) {
                    scan(resolvedPath, currentDepth + 1);
                }
            }
        });
    }

    scan(entryPoint, 1);
    return graph;
}

// ==========================================
// РЕЖИМ 2: Граф внутренностей одного файла
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

    return fileGraph;
}

// ==========================================
// ГЕНЕРАЦИЯ ФОРМАТА DOT И ОТЧЕТОВ
// ==========================================
function convertToDOT(graph, title) {
    let dot = `digraph "${title}" {\n`;
    dot += `  rankdir=LR;\n`;
    dot += `  node [shape=box, style="filled,rounded", color="#4f46e5", fontname="Arial", fillcolor="#f3f4f6", fontcolor="#1f2937"];\n`;
    dot += `  edge [color="#9ca3af", arrowhead=vee];\n`;

    Object.keys(graph).forEach(node => {
        dot += `  "${node}";\n`;
        graph[node].forEach(dep => {
            dot += `  "${node}" -> "${dep}";\n`;
        });
    });

    dot += `}\n`;
    return dot;
}

function generateHTMLReport(svgContent, dotContent, jsonContent, title) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>AST Dependency Graph - ${title}</title>
    <script src="https://jsdelivr.net"></script>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
        h1 { margin-bottom: 5px; color: #1e293b; font-size: 24px; }
        .container { display: flex; flex-direction: column; height: calc(100vh - 100px); gap: 15px; }
        #graph-wrapper { flex: 2; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; position: relative; }
        svg { width: 100%; height: 100%; }
        .code-container { display: flex; flex: 1; gap: 15px; overflow: hidden; }
        .code-wrapper { flex: 1; background: #1e1e24; color: #a5d6a7; border-radius: 8px; padding: 15px; overflow: auto; font-family: monospace; font-size: 13px; white-space: pre; border: 1px solid #334155; }
        .code-wrapper b { color: #f43f5e; display: block; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #334155; padding-bottom: 4px;}
        .hint { color: #64748b; font-size: 14px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Интерактивный граф зависимостей: ${title}</h1>
    <div class="hint">💡 Используйте скролл мыши для масштабирования (Zoom) и зажмите левую кнопку для перемещения графа.</div>
    <div class="container">
        <div id="graph-wrapper">
            ${svgContent}
        </div>
        <div class="code-container">
            <div class="code-wrapper"><b>Исходный DOT код (Graphviz):</b>${dotContent}</div>
            <div class="code-wrapper"><b>Структура дерева JSON:</b>${jsonContent}</div>
        </div>
    </div>
    <script>
        window.onload = function() {
            const svgElement = document.querySelector('#graph-wrapper svg');
            if (svgElement) {
                svgElement.setAttribute('id', 'dependency-svg');
                svgPanZoom('#dependency-svg', { zoomEnabled: true, controlIconsEnabled: true, fit: true, center: true });
            }
        };
    </script>
</body>
</html>`;
}

// ==========================================
// CLI ИНТЕРФЕЙС
// ==========================================
const [,, mode, targetPath, maxDepthArg] = process.argv;

if (!mode || !targetPath) {
    console.log(`
Использование:
  Режим 1 (Проект): node graph-analyzer.js project <путь_к_файлу> [maxDepth]
  Режим 2 (Файл):   node graph-analyzer.js file <путь_к_файлу>
    `);
    process.exit(1);
}

async function main() {
    let graph = null;
    let title = targetPath;

    if (mode === 'project') {
        const maxDepth = maxDepthArg ? parseInt(maxDepthArg, 10) : Infinity;
        console.log(`⏳ Анализ проекта (node_modules исключены). Макс. глубина: ${maxDepth}...`);
        graph = buildProjectGraph(targetPath, maxDepth);
    } else if (mode === 'file') {
        console.log(`⏳ Анализ структуры файла...`);
        graph = buildFileInternalGraph(targetPath);
    } else {
        console.error('❌ Неверный режим работы. Выберите "project" или "file".');
        process.exit(1);
    }

    if (!graph || Object.keys(graph).length === 0) {
        console.log("⚠️ Зависимости не найдены или файлы пусты.");
        return;
    }

    // 1. Сохраняем JSON дерево
    const jsonContent = JSON.stringify(graph, null, 2);
    fs.writeFileSync('output.json', jsonContent);
    console.log('✅ Файл сохранен: output.json');

    // 2. Создаем DOT
    const dotContent = convertToDOT(graph, title);
    fs.writeFileSync('output.dot', dotContent);
    console.log('✅ Файл сохранен: output.dot');

    // 3. Генерируем SVG через WebAssembly Graphviz
    console.log('⚙️ Компиляция SVG...');
    const graphviz = await Graphviz.load();
    const svgContent = graphviz.dot(dotContent);
    fs.writeFileSync('output.svg', svgContent);


    console.log('✅ График сохранен: output.svg');
    const htmlContent = generateHTMLReport(svgContent, dotContent, jsonContent, title);
    fs.writeFileSync('report.html', htmlContent);console.log('🎉 Интерактивный отчет готов: report.html');
}

main();