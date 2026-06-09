// graph-analyzer.js - улучшенная версия с расширенной диагностикой циклов

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

// Проверка на внешний модуль
function isExternalModule(importTarget) {
    return !importTarget.startsWith('.') && !importTarget.startsWith('/') && !path.isAbsolute(importTarget);
}

// Поиск реального файла на диске
function resolveFilePath(baseDir, targetPath) {
    const fullPath = path.resolve(baseDir, targetPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
    }
    for (const ext of ['.ts', '.mjs', '.js', '.tsx', '.jsx', '.vue']) {
        if (fs.existsSync(fullPath + ext)) {
            return fullPath + ext;
        }
    }
    return null;
}

// ==========================================
// РЕЖИМ 1: Граф проекта от корня
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
    const rootKey = path.relative(process.cwd(), rootAbsPath) || rootAbsPath;
    return { rootKey, graph, entryFile: rootAbsPath };
}

// ==========================================
// РЕЖИМ 2: Граф внутренностей файла
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

    return { rootKey: path.basename(filePath), graph: fileGraph, entryFile: filePath };
}

// ==========================================
// РАСШИРЕННЫЙ ПОИСК ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ
// ==========================================
function findCycles(graph) {
    const visited = new Map(); // 'unvisited', 'visiting', 'visited'
    const cycles = []; // Список найденных циклов
    const cycleEdges = new Set();
    const recursionStack = new Set();

    // Инициализация
    Object.keys(graph).forEach(node => {
        visited.set(node, 'unvisited');
    });

    function dfs(node, path = []) {
        if (visited.get(node) === 'visiting') {
            // Найден цикл!
            const cycleStartIndex = path.indexOf(node);
            if (cycleStartIndex !== -1) {
                const cycle = path.slice(cycleStartIndex);
                cycles.push(cycle);

                // Отмечаем рёбра в цикле
                for (let i = 0; i < cycle.length; i++) {
                    const from = cycle[i];
                    const to = cycle[(i + 1) % cycle.length];
                    cycleEdges.add(`${from}->${to}`);
                }
            }
            return;
        }

        if (visited.get(node) === 'visited') return;

        visited.set(node, 'visiting');
        path.push(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
            dfs(neighbor, [...path]);
        }

        path.pop();
        visited.set(node, 'visited');
    }

    // Запускаем DFS от всех узлов
    Object.keys(graph).forEach(node => {
        if (visited.get(node) === 'unvisited') {
            dfs(node, []);
        }
    });

    return {
        cycles,
        cycleEdges,
        cycleCount: cycles.length,
        affectedNodes: new Set(cycles.flat()),
        hasCycles: cycles.length > 0
    };
}

// ==========================================
// ГЕНЕРАЦИЯ DOT С ПОДСВЕТКОЙ ЦИКЛОВ
// ==========================================
function convertToDOT(graphData, cycleInfo) {
    const { rootKey, graph } = graphData;
    const { cycleEdges, affectedNodes } = cycleInfo;

    let dot = `digraph "Dependency Graph" {\n`;
    dot += `  rankdir=LR;\n`;
    dot += `  splines=true;\n`;
    dot += `  nodesep=0.5;\n`;
    dot += `  ranksep=0.7;\n`;

    // Базовые стили
    dot += `  node [shape=box, style="filled,rounded", color="#4f46e5", fontname="Segoe UI, Arial", fillcolor="#f3f4f6", fontcolor="#1f2937", penwidth=1];\n`;
    dot += `  edge [color="#9ca3af", arrowhead=vee, penwidth=1];\n`;

    // Стиль для корневого узла
    const rootShort = path.basename(rootKey);
    dot += `  "${rootKey}" [fillcolor="#4f46e5", fontcolor="#ffffff", color="#4f46e5", style="filled,rounded", penwidth=2, label="⭐ ${rootShort}\\n(входной файл)"];\n`;

    // Стиль для узлов, участвующих в циклах
    for (const node of affectedNodes) {
        if (node !== rootKey) {
            dot += `  "${node}" [fillcolor="#fef2f2", color="#ef4444", fontcolor="#991b1b", penwidth=1.5, style="filled,rounded"];\n`;
        }
    }

    // Отрисовка рёбер
    Object.keys(graph).forEach(node => {
        graph[node].forEach(dep => {
            const edgeKey = `${node}->${dep}`;
            if (cycleEdges.has(edgeKey)) {
                dot += `  "${node}" -> "${dep}" [color="#ef4444", penwidth=2.5, style="dashed,setlinewidth(2)", label="  цикл", fontcolor="#ef4444", fontsize="9", fontname="Segoe UI"];\n`;
            } else if (affectedNodes.has(node) || affectedNodes.has(dep)) {
                dot += `  "${node}" -> "${dep}" [color="#f59e0b", penwidth=1.5, style="solid"];\n`;
            } else {
                dot += `  "${node}" -> "${dep}";\n`;
            }
        });
    });

    dot += `}\n`;
    return dot;
}

// ==========================================
// ГЕНЕРАЦИЯ HTML ОТЧЁТА
// ==========================================
function generateHTMLReport(svgContent, dotContent, jsonContent, title, cycleInfo) {
    const { hasCycles, cycleCount, cycles, affectedNodes } = cycleInfo;

    const cycleHtml = hasCycles
        ? `
        <div class="banner error">
            ⚠️ Обнаружено ${cycleCount} циклических зависимостей!
            <button class="toggle-details" onclick="toggleDetails()">📋 Показать детали</button>
        </div>
        <div id="cycle-details" class="cycle-details" style="display: none;">
            <h3>🔍 Детали циклических зависимостей:</h3>
            ${cycles.map((cycle, idx) => `
                <div class="cycle-item">
                    <div class="cycle-title">Цикл ${idx + 1}:</div>
                    <div class="cycle-path">${cycle.map(f => path.basename(f)).join(' → ')} → ${path.basename(cycle[0])}</div>
                    <div class="cycle-files">${cycle.map(f => `📄 ${f}`).join('<br>')}</div>
                </div>
            `).join('')}
            <div class="recommendation">
                💡 <strong>Рекомендации по устранению:</strong><br>
                • Выделите общую функциональность в отдельный модуль<br>
                • Используйте внедрение зависимостей (Dependency Injection)<br>
                • Примените паттерн "Посредник" (Mediator) для разрыва цикла<br>
                • Рассмотрите возможность объединения циклических модулей
            </div>
        </div>
        `
        : `<div class="banner success">✨ Отлично: Циклических зависимостей не обнаружено. Архитектура чистая!</div>`;

    const statsHtml = `
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label">📦 Всего модулей:</span>
                <span class="stat-value">${Object.keys(jsonContent.graph || {}).length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">🔗 Всего связей:</span>
                <span class="stat-value">${Object.values(jsonContent.graph || {}).reduce((sum, deps) => sum + deps.length, 0)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">🔄 Модулей в циклах:</span>
                <span class="stat-value ${hasCycles ? 'warning' : 'success'}">${affectedNodes.size}</span>
            </div>
        </div>
    `;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Анализ зависимостей - ${path.basename(title)}</title>
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .main-card { max-width: 1600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 24px 32px; }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header .subtitle { color: #94a3b8; font-size: 14px; }
        .stats { display: flex; gap: 24px; padding: 20px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
        .stat-value.warning { color: #ef4444; }
        .stat-value.success { color: #10b981; }
        .banner { margin: 20px 32px; padding: 16px 20px; border-radius: 12px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .banner.error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
        .banner.success { background: #f0fdf4; color: #166534; border-left: 4px solid #22c55e; }
        .toggle-details { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .toggle-details:hover { background: #dc2626; transform: scale(1.02); }
        .cycle-details { margin: 0 32px 20px 32px; background: #fef2f2; border-radius: 12px; padding: 20px; border: 1px solid #fecaca; }
        .cycle-details h3 { color: #991b1b; margin-bottom: 16px; font-size: 16px; }
        .cycle-item { background: white; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; border: 1px solid #fee2e2; }
        .cycle-title { font-weight: bold; color: #ef4444; margin-bottom: 8px; }
        .cycle-path { font-family: monospace; font-size: 13px; color: #475569; margin-bottom: 8px; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; }
        .cycle-files { font-size: 11px; color: #64748b; font-family: monospace; }
        .recommendation { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-top: 16px; color: #92400e; font-size: 14px; line-height: 1.5; }
        .graph-container { padding: 20px 32px; background: white; min-height: 500px; }
        #graph-wrapper { background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto; padding: 20px; }
        svg { width: 100%; height: auto; min-height: 500px; }
        .code-section { margin: 20px 32px 32px 32px; }
        .code-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
        .tab-btn { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .tab-btn.active { background: #4f46e5; color: white; }
        .code-content { display: none; background: #1e1e24; border-radius: 12px; padding: 16px; overflow: auto; max-height: 300px; }
        .code-content.active { display: block; }
        .code-content pre { color: #a5d6a7; font-family: 'Fira Code', monospace; font-size: 12px; margin: 0; white-space: pre-wrap; word-wrap: break-word; }
        .hint { font-size: 12px; color: #64748b; text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; margin-top: 16px; }
        @media (max-width: 768px) {
            .stats { flex-wrap: wrap; }
            .banner { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="header">
            <h1>📊 Анализ зависимостей</h1>
            <div class="subtitle">${title}</div>
        </div>
        ${statsHtml}
        ${cycleHtml}
        <div class="graph-container">
            <div id="graph-wrapper">${svgContent}</div>
            <div class="hint">
                💡 <strong>Управление графом:</strong> Используйте колесо мыши для масштабирования, 
                зажмите левую кнопку для перемещения
            </div>
        </div>
        <div class="code-section">
            <div class="code-tabs">
                <button class="tab-btn active" onclick="showTab('dot')">📝 DOT (Graphviz)</button>
                <button class="tab-btn" onclick="showTab('json')">📋 JSON (структура)</button>
            </div>
            <div id="dot-content" class="code-content active">
                <pre>${escapeHtml(dotContent)}</pre>
            </div>
            <div id="json-content" class="code-content">
                <pre>${escapeHtml(jsonContent)}</pre>
            </div>
        </div>
    </div>
    <script>
        let panZoomInstance = null;
        
        window.onload = function() {
            const svgElement = document.querySelector('#graph-wrapper svg');
            if (svgElement && typeof svgPanZoom !== 'undefined') {
                panZoomInstance = svgPanZoom(svgElement, {
                    zoomEnabled: true,
                    controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.1,
                    maxZoom: 10,
                    zoomScaleSensitivity: 0.2
                });
            }
        };
        
        function toggleDetails() {
            const details = document.getElementById('cycle-details');
            const btn = document.querySelector('.toggle-details');
            if (details.style.display === 'none') {
                details.style.display = 'block';
                btn.textContent = '🙈 Скрыть детали';
            } else {
                details.style.display = 'none';
                btn.textContent = '📋 Показать детали';
            }
        }
        
        function showTab(tab) {
            const dotContent = document.getElementById('dot-content');
            const jsonContent = document.getElementById('json-content');
            const btns = document.querySelectorAll('.tab-btn');
            
            if (tab === 'dot') {
                dotContent.classList.add('active');
                jsonContent.classList.remove('active');
                btns[0].classList.add('active');
                btns[1].classList.remove('active');
            } else {
                dotContent.classList.remove('active');
                jsonContent.classList.add('active');
                btns[0].classList.remove('active');
                btns[1].classList.add('active');
            }
        }
    </script>
</body>
</html>`;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// CLI ИНТЕРФЕЙС
// ==========================================
const [,, mode, targetPath, maxDepthArg] = process.argv;

if (!mode || !targetPath) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🔍 Graph Analyzer - CLI                     ║
╠══════════════════════════════════════════════════════════════╣
║  Использование:                                              ║
║    Режим 1 (Проект): node graph-analyzer.js project <путь> [depth]║
║    Режим 2 (Файл):   node graph-analyzer.js file <путь>      ║
║                                                              ║
║  Примеры:                                                    ║
║    node graph-analyzer.js project ./src/index.js 3          ║
║    node graph-analyzer.js file ./src/utils.js               ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
}

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 ЗАПУСК АНАЛИЗАТОРА ЗАВИСИМОСТЕЙ');
    console.log('═'.repeat(60) + '\n');

    let resultData = null;

    if (mode === 'project') {
        const maxDepth = maxDepthArg ? parseInt(maxDepthArg, 10) : Infinity;
        console.log(`📁 Режим: Анализ проекта`);
        console.log(`📄 Входной файл: ${targetPath}`);
        console.log(`📏 Макс. глубина: ${maxDepth === Infinity ? 'без ограничений' : maxDepth}`);
        console.log('');
        resultData = buildProjectGraph(targetPath, maxDepth);
    } else if (mode === 'file') {
        console.log(`📄 Режим: Анализ внутренней структуры файла`);
        console.log(`📄 Файл: ${targetPath}`);
        console.log('');
        resultData = buildFileInternalGraph(targetPath);
    } else {
        console.error('❌ Неверный режим работы. Выберите "project" или "file".');
        process.exit(1);
    }

    if (!resultData || Object.keys(resultData.graph).length === 0) {
        console.log("⚠️ Зависимости не найдены или файлы пусты.");
        process.exit(0);
    }

    // Поиск циклических зависимостей
    console.log('🔄 Поиск циклических зависимостей...');
    const cycleInfo = findCycles(resultData.graph);

    if (cycleInfo.hasCycles) {
        console.log(`\n🚨 ОБНАРУЖЕНЫ ЦИКЛИЧЕСКИЕ ЗАВИСИМОСТИ (${cycleInfo.cycleCount}):\n`);
        cycleInfo.cycles.forEach((cycle, idx) => {
            console.log(`   ${idx + 1}. ${cycle.map(f => path.basename(f)).join(' → ')} → ${path.basename(cycle[0])}`);
            console.log(`      Файлы: ${cycle.map(f => `\n         📄 ${f}`).join('')}\n`);
        });
        console.log(`⚠️ Затронуто модулей: ${cycleInfo.affectedNodes.size}\n`);
    } else {
        console.log('\n✅ Циклических зависимостей не обнаружено\n');
    }

    // Добавляем информацию о циклах в результат
    resultData.cycleInfo = {
        hasCycles: cycleInfo.hasCycles,
        cycleCount: cycleInfo.cycleCount,
        cycles: cycleInfo.cycles,
        affectedNodes: Array.from(cycleInfo.affectedNodes)
    };

    // Сохраняем JSON
    const jsonContent = JSON.stringify(resultData, null, 2);
    fs.writeFileSync('output.json', jsonContent);
    console.log('💾 Сохранён: output.json');

    // Генерируем DOT
    const dotContent = convertToDOT(resultData, cycleInfo);
    fs.writeFileSync('output.dot', dotContent);
    console.log('💾 Сохранён: output.dot');

    // Генерируем SVG через WebAssembly Graphviz
    console.log('⚙️ Компиляция SVG графа...');
    const graphviz = await Graphviz.load();
    const svgContent = graphviz.dot(dotContent);
    fs.writeFileSync('output.svg', svgContent);
    console.log('💾 Сохранён: output.svg');

    // Создаём HTML отчёт
    const htmlContent = generateHTMLReport(svgContent, dotContent, jsonContent, targetPath, cycleInfo);
    fs.writeFileSync('report.html', htmlContent);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ АНАЛИЗ ЗАВЕРШЁН');
    console.log('═'.repeat(60));
    console.log(`\n📄 Отчёт: ${path.resolve('report.html')}`);
    console.log(`📊 Граф: ${path.resolve('output.svg')}`);
    console.log(`📁 JSON: ${path.resolve('output.json')}`);

    if (cycleInfo.hasCycles) {
        console.log(`\n⚠️ Обнаружены циклические зависимости! Откройте report.html для деталей.\n`);
        process.exit(1);
    } else {
        console.log(`\n✨ Архитектура чистая! Циклических зависимостей нет.\n`);
        process.exit(0);
    }
}

main().catch(console.error);