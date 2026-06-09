// scan-dependencies.js (полная версия с поддержкой фиксированных имен файлов)
import madge from './packages/madge/lib/api.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Проверка наличия Graphviz
 */
async function checkGraphviz(config) {
    const graphVizPath = config.graphVizPath || null;
    const cmd = graphVizPath ? path.join(graphVizPath, 'dot') : 'dot';

    try {
        await execAsync(`${cmd} -V`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Форматирует дату
 */
function formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace(/YYYY/, year)
        .replace(/MM/, month)
        .replace(/DD/, day)
        .replace(/HH/, hours)
        .replace(/mm/, minutes)
        .replace(/ss/, seconds);
}

/**
 * Проверяет, является ли имя файла шаблоном
 */
function isTemplateFileName(fileName) {
    return fileName.includes('{{');
}

/**
 * Генерирует имя файла по шаблону или возвращает фиксированное имя
 */
function generateFileName(template, variables) {
    // Если не шаблон - возвращаем как есть
    if (!isTemplateFileName(template)) {
        return template;
    }

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
}

/**
 * Ограничение глубины дерева (улучшенная версия)
 * @param {Object} tree - дерево зависимостей
 * @param {string} entryFile - путь к входному файлу
 * @param {string} baseDir - базовая директория
 * @param {number} maxDepth - максимальная глубина
 * @returns {Object} ограниченное дерево
 */
function limitTreeDepth(tree, entryFile, baseDir, maxDepth) {
    if (maxDepth === 'all' || maxDepth === Infinity || maxDepth === null) {
        return tree;
    }

    const depthLimit = typeof maxDepth === 'number' ? maxDepth : parseInt(maxDepth, 10);
    if (isNaN(depthLimit) || depthLimit <= 0) {
        return tree;
    }

    const limited = {};
    const visited = new Map(); // Храним глубину для каждого узла

    // Находим ключ входного файла
    let entryKey = null;
    const entryBaseName = path.basename(entryFile);
    const entryRelative = path.relative(baseDir, entryFile);

    for (const key of Object.keys(tree)) {
        if (key === entryRelative ||
            key === entryBaseName ||
            key.endsWith(entryBaseName) ||
            path.basename(key) === entryBaseName) {
            entryKey = key;
            break;
        }
    }

    // Если не нашли, берем первый ключ
    if (!entryKey && Object.keys(tree).length > 0) {
        entryKey = Object.keys(tree)[0];
    }

    if (!entryKey) {
        return tree;
    }

    function traverse(node, currentDepth) {
        // Проверка глубины
        if (currentDepth > depthLimit) {
            return;
        }

        // Проверка на циклические зависимости с учетом глубины
        const existingDepth = visited.get(node);
        if (existingDepth !== undefined) {
            // Если уже посещали на меньшей или равной глубине, не обрабатываем заново
            if (existingDepth <= currentDepth) {
                return;
            }
        }

        visited.set(node, currentDepth);

        if (!limited[node]) {
            limited[node] = [];
        }

        const dependencies = tree[node] || [];

        for (const dep of dependencies) {
            // Добавляем зависимость
            if (!limited[node].includes(dep)) {
                limited[node].push(dep);
            }

            // Рекурсивно обрабатываем зависимость, если позволяет глубина
            if (currentDepth < depthLimit) {
                const depDepth = visited.get(dep);
                if (depDepth === undefined || depDepth > currentDepth + 1) {
                    traverse(dep, currentDepth + 1);
                }
            }
        }
    }

    traverse(entryKey, 1);

    // Логируем результат ограничения
    const originalCount = Object.keys(tree).length;
    const limitedCount = Object.keys(limited).length;
    if (originalCount > limitedCount) {
        console.log(`   📊 Ограничение глубины: ${originalCount} → ${limitedCount} модулей (ограничено ${depthLimit} ур.)`);
    }

    return limited;
}

/**
 * Сбор статистики
 */
function collectStats(tree) {
    const modules = Object.keys(tree);
    let totalDeps = 0;
    let maxDeps = 0;
    let minDeps = Infinity;
    let modulesWithNoDeps = [];
    let modulesWithManyDeps = [];

    for (const [module, deps] of Object.entries(tree)) {
        const depsCount = deps.length;
        totalDeps += depsCount;
        if (depsCount > maxDeps) maxDeps = depsCount;
        if (depsCount < minDeps) minDeps = depsCount;
        if (depsCount === 0) modulesWithNoDeps.push(module);
        if (depsCount > 10) modulesWithManyDeps.push({ module, depsCount });
    }

    const extensions = {};
    for (const module of modules) {
        const ext = path.extname(module) || '(no extension)';
        extensions[ext] = (extensions[ext] || 0) + 1;
    }

    return {
        totalModules: modules.length,
        totalDependencies: totalDeps,
        averageDepsPerModule: (totalDeps / modules.length).toFixed(2),
        maxDepsPerModule: maxDeps,
        minDepsPerModule: minDeps === Infinity ? 0 : minDeps,
        modulesWithNoDeps: modulesWithNoDeps.length,
        modulesWithNoDepsList: modulesWithNoDeps.slice(0, 10),
        modulesWithManyDeps: modulesWithManyDeps.slice(0, 10),
        extensions: extensions
    };
}

/**
 * Добавление в config.json
 */
async function addToConfigFile(configPath, depsInfo) {
    try {
        let config;
        try {
            const configContent = await fs.readFile(configPath, 'utf-8');
            config = JSON.parse(configContent);
        } catch {
            config = { directories: [] };
        }

        const targetDirName = path.basename(depsInfo.targetDir);
        let directoryConfig = null;
        let directoryIndex = -1;

        if (config.directories) {
            for (let i = 0; i < config.directories.length; i++) {
                const d = config.directories[i];
                if (d.name === depsInfo.relativeTargetDir ||
                    d.name?.includes(targetDirName) ||
                    d.id === targetDirName) {
                    directoryConfig = d;
                    directoryIndex = i;
                    break;
                }
            }
        } else {
            config.directories = [];
        }

        const scanEntry = {
            entryFile: depsInfo.relativeEntryFile,
            dependenciesFile: path.relative(path.dirname(configPath), depsInfo.dependenciesFile),
            modulesCount: depsInfo.modulesCount,
            circularCount: depsInfo.circularCount,
            scannedAt: depsInfo.timestamp,
            svgPath: depsInfo.svgPath ? path.relative(path.dirname(configPath), depsInfo.svgPath) : null
        };

        if (directoryConfig) {
            if (!directoryConfig.dependencyScans) directoryConfig.dependencyScans = [];
            const existingIndex = directoryConfig.dependencyScans.findIndex(
                s => s.entryFile === depsInfo.relativeEntryFile
            );
            if (existingIndex >= 0) {
                directoryConfig.dependencyScans[existingIndex] = scanEntry;
            } else {
                directoryConfig.dependencyScans.push(scanEntry);
            }
            if (!directoryConfig.scannedFiles) directoryConfig.scannedFiles = [];
            const entryFileName = path.basename(depsInfo.relativeEntryFile);
            if (!directoryConfig.scannedFiles.includes(entryFileName)) {
                directoryConfig.scannedFiles.push(entryFileName);
            }
            config.directories[directoryIndex] = directoryConfig;
        } else {
            config.directories.push({
                id: targetDirName,
                name: depsInfo.relativeTargetDir,
                description: `Сканирование зависимостей для ${targetDirName}`,
                scannedFiles: [path.basename(depsInfo.relativeEntryFile)],
                dependencyScans: [scanEntry]
            });
        }

        config.lastDependencyScan = {
            timestamp: depsInfo.timestamp,
            targetDir: depsInfo.relativeTargetDir,
            totalModulesScanned: depsInfo.modulesCount,
            totalCircularFound: depsInfo.circularCount
        };

        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`\n📝 Конфигурация обновлена: ${configPath}`);

    } catch (error) {
        console.warn(`\n⚠️ Не удалось обновить config.json: ${error.message}`);
    }
}

/**
 * Создание директории
 */
async function ensureDirectory(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Создана директория: ${dir}`);
    }
}

/**
 * Вывод отчета
 */
function printReport(data, svgPath) {
    const separator = '═'.repeat(70);

    console.log(`\n${separator}`);
    console.log('📊 ОТЧЕТ ПО ЗАВИСИМОСТЯМ');
    console.log(separator);

    console.log('\n📈 СТАТИСТИКА:');
    console.log(`   ├─ Всего модулей: ${data.stats.totalModules}`);
    console.log(`   ├─ Всего связей: ${data.stats.totalDependencies}`);
    console.log(`   ├─ Среднее связей на модуль: ${data.stats.averageDepsPerModule}`);
    console.log(`   ├─ Максимум связей: ${data.stats.maxDepsPerModule}`);
    console.log(`   └─ Модулей без связей: ${data.stats.modulesWithNoDeps}`);

    if (data.circularCount > 0) {
        console.log(`\n⚠️ ЦИКЛИЧЕСКИЕ ЗАВИСИМОСТИ (${data.circularCount}):`);
        data.circular.slice(0, 10).forEach((cycle, idx) => {
            console.log(`   ${idx + 1}. ${cycle.join(' → ')}`);
        });
    } else {
        console.log('\n✅ Циклических зависимостей не найдено');
    }

    console.log(`\n${separator}`);
    console.log(`📄 JSON: ${path.basename(data.outputPath)}`);
    if (svgPath) {
        console.log(`🎨 SVG: ${path.basename(svgPath)}`);
    }
    console.log(separator);
}

/**
 * Основная функция сканирования зависимостей
 */
export async function scanDependencies(config) {
    const {
        targetDir,
        entryFile,
        maxDepth = 'all',
        includeNpm = false,
        generateSvg = false,
        outputJsonDir = './fs',
        configPath = './config.json',
        addToConfig = false,
        svgOutputDir = './fs/svg',
        circularOnly = false,
        outputFileName = 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json',
        svgFileName = 'graph_{{name}}_{{timestamp}}.svg',
        excludePatterns = { directories: [], files: [] },
        supportedExtensions = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.json'],
        scanOptions = {}
    } = config;

    // РАСЧЕТ ПУТЕЙ
    const currentDir = process.cwd();
    const resolvedTargetDir = path.resolve(currentDir, targetDir);
    const resolvedEntryFile = path.resolve(resolvedTargetDir, entryFile);
    const resolvedOutputDir = path.resolve(currentDir, outputJsonDir);
    const resolvedSvgDir = path.resolve(currentDir, svgOutputDir);
    const resolvedConfigPath = path.resolve(currentDir, configPath);

    console.log('\n🔍 ЗАПУСК СКАНЕРА ЗАВИСИМОСТЕЙ (madge)');
    console.log('========================================\n');
    console.log(`📁 Текущая директория: ${currentDir}`);
    console.log(`📁 Директория: ${resolvedTargetDir}`);
    console.log(`📄 Входной файл: ${resolvedEntryFile}`);
    console.log(`📏 Максимальная глубина: ${maxDepth === 'all' ? 'все' : `${maxDepth} уровень(я/ей)`}`);
    console.log(`📦 Включить npm: ${includeNpm ? 'да' : 'нет'}`);
    console.log(`🎨 SVG визуализация: ${generateSvg ? 'да' : 'нет'}`);
    console.log(`🔄 Только циклические: ${circularOnly ? 'да' : 'нет'}`);
    console.log(`📝 Тип имени JSON: ${isTemplateFileName(outputFileName) ? 'шаблон' : 'фиксированное'}`);
    console.log(`📝 Имя JSON файла: ${outputFileName}`);
    console.log(`🎨 Тип имени SVG: ${isTemplateFileName(svgFileName) ? 'шаблон' : 'фиксированное'}`);
    console.log(`🎨 Имя SVG файла: ${svgFileName}`);
    console.log(`🚫 Исключаемые директории: ${excludePatterns.directories.join(', ') || 'нет'}`);
    console.log(`🚫 Исключаемые файлы: ${excludePatterns.files.join(', ') || 'нет'}`);

    // Проверка Graphviz если нужен SVG
    let hasGraphviz = false;
    if (generateSvg) {
        hasGraphviz = await checkGraphviz(config);
        if (!hasGraphviz) {
            console.warn('\n⚠️ Graphviz не установлен!');
            console.warn('   Установите Graphviz:');
            console.warn('   sudo apt-get install graphviz');
            console.warn('   Или: brew install graphviz');
            console.warn('\n   SVG визуализация будет пропущена.\n');
        } else {
            console.log('✅ Graphviz найден');
        }
    }

    // Проверяем существование входного файла
    try {
        await fs.access(resolvedEntryFile);
        console.log(`✅ Файл найден`);
    } catch (error) {
        throw new Error(`Входной файл не найден: ${resolvedEntryFile}`);
    }

    // Формируем excludeRegExp из конфига
    const excludeRegExp = [];
    if (excludePatterns.directories && excludePatterns.directories.length > 0) {
        excludePatterns.directories.forEach(dir => {
            excludeRegExp.push(`${dir}/`);
            excludeRegExp.push(`/${dir}/`);
            excludeRegExp.push(`${dir}$`);
        });
    }
    if (excludePatterns.files && excludePatterns.files.length > 0) {
        excludePatterns.files.forEach(file => {
            if (file.includes('*')) {
                const pattern = file.replace(/\./g, '\\.').replace(/\*/g, '.*');
                excludeRegExp.push(pattern);
            } else {
                excludeRegExp.push(file);
            }
        });
    }

    // Нормализуем maxDepth для передачи в madge
    let normalizedMaxDepth;
    if (maxDepth === 'all' || maxDepth === Infinity || maxDepth === null) {
        normalizedMaxDepth = Infinity;
    } else {
        const depth = parseInt(maxDepth, 10);
        normalizedMaxDepth = isNaN(depth) ? Infinity : depth;
    }

    // Настройки madge с поддержкой ES modules и maxDepth
    const madgeConfig = {
        baseDir: resolvedTargetDir,
        includeNpm: includeNpm,
        fileExtensions: supportedExtensions.map(ext => ext.replace('.', '')),
        excludeRegExp: excludeRegExp.length > 0 ? excludeRegExp : undefined,
        maxDepth: normalizedMaxDepth,
        // Поддержка ES modules (import/export)
        detectiveOptions: {
            es6: {
                mixedImports: true,      // Поддержка import/export
                skipLazyImports: false   // Не пропускать lazy imports
            },
            cjs: {
                mixedImports: true       // Поддержка require
            }
        }
    };

    console.log(`\n📏 MaxDepth для madge: ${normalizedMaxDepth === Infinity ? 'без ограничений' : normalizedMaxDepth}`);

    // Получаем дерево зависимостей
    console.log('\n📊 Построение дерева зависимостей...');
    const result = await madge(resolvedEntryFile, madgeConfig);
    let fullTree = result.obj();

    console.log(`\n🔍 Найдено модулей в дереве: ${Object.keys(fullTree).length}`);

    // Если нужны только циклические зависимости - фильтруем дерево
    if (circularOnly) {
        console.log('🔄 Фильтрация: оставляем только циклические зависимости...');
        const circularModules = new Set();
        const circular = result.circular();
        circular.forEach(cycle => {
            cycle.forEach(module => circularModules.add(module));
        });

        const filteredTree = {};
        for (const [module, deps] of Object.entries(fullTree)) {
            if (circularModules.has(module)) {
                filteredTree[module] = deps.filter(dep => circularModules.has(dep));
            }
        }
        fullTree = filteredTree;

        if (Object.keys(fullTree).length === 0) {
            console.log('✅ Циклических зависимостей не найдено');
        } else {
            console.log(`⚠️ Найдено ${circular.length} циклических зависимостей, участвует ${Object.keys(fullTree).length} модулей`);
        }
    }

    // Статистика
    const modules = Object.keys(fullTree);
    console.log(`\n📦 Итоговое количество модулей: ${modules.length}`);
    const stats = collectStats(fullTree);
    const circular = result.circular();

    // Генерация имен файлов по шаблону или фиксированных имен
    const now = new Date();
    const timestamp = Date.now();
    const baseName = path.basename(entryFile, path.extname(entryFile));
    const suffix = circularOnly ? '_circular' : '';

    // Переменные для шаблонов
    const templateVariables = {
        name: baseName,
        timestamp: timestamp,
        date: formatDate(now, 'YYYY-MM-DD'),
        time: formatDate(now, 'HH-mm-ss'),
        datetime: formatDate(now, 'YYYY-MM-DD_HH-mm-ss'),
        suffix: suffix,
        entry: path.basename(entryFile),
        dir: path.basename(resolvedTargetDir),
        depth: maxDepth === 'all' ? 'full' : String(maxDepth),
        npm: includeNpm ? 'with-npm' : 'no-npm'
    };

    // Генерируем имена файлов (если шаблон - подставляем, если нет - оставляем)
    const jsonFileName = generateFileName(outputFileName, templateVariables);
    const outputPath = path.join(resolvedOutputDir, jsonFileName);

    let svgPath = null;
    let svgFileNameActual = null;
    if (generateSvg && !circularOnly) {
        svgFileNameActual = generateFileName(svgFileName, templateVariables);
        svgPath = path.join(resolvedSvgDir, svgFileNameActual);
    }

    // Формируем результат
    const resultData = {
        scanInfo: {
            timestamp: now.toISOString(),
            currentDir: currentDir,
            targetDir: resolvedTargetDir,
            entryFile: resolvedEntryFile,
            entryFileName: path.basename(entryFile),
            maxDepth: maxDepth === 'all' ? 'all' : parseInt(maxDepth, 10),
            includeNpm: includeNpm,
            circularOnly: circularOnly,
            totalModules: modules.length,
            configUsed: configPath,
            outputFileName: jsonFileName,
            outputPath: outputPath,
            isTemplateFileName: isTemplateFileName(outputFileName)
        },
        stats: stats,
        tree: fullTree,
        circular: circular,
        circularCount: circular.length,
        outputPath: outputPath
    };

    // Сохраняем JSON
    await ensureDirectory(resolvedOutputDir);
    await fs.writeFile(outputPath, JSON.stringify(resultData, null, 2), 'utf-8');

    const fileSize = (JSON.stringify(resultData, null, 2).length / 1024).toFixed(2);
    console.log(`\n💾 JSON сохранен: ${outputPath}`);
    console.log(`   Размер: ${fileSize} KB`);
    console.log(`   Тип имени: ${isTemplateFileName(outputFileName) ? 'шаблонный' : 'фиксированный'}`);

    // Генерируем SVG если нужно
    if (generateSvg && hasGraphviz && !circularOnly) {
        await ensureDirectory(resolvedSvgDir);

        try {
            console.log('\n🎨 Генерация SVG...');

            const dotOutput = await result.dot();
            const dotPath = path.join(resolvedSvgDir, jsonFileName.replace('.json', '.dot'));
            await fs.writeFile(dotPath, dotOutput);
            console.log(`   DOT файл сохранен: ${dotPath}`);

            await execAsync(`dot -Tsvg "${dotPath}" -o "${svgPath}"`);

            await fs.access(svgPath);
            const svgStats = await fs.stat(svgPath);
            console.log(`✅ SVG создан: ${svgPath} (${(svgStats.size / 1024).toFixed(2)} KB)`);
            console.log(`   Тип имени: ${isTemplateFileName(svgFileName) ? 'шаблонный' : 'фиксированный'}`);

            resultData.svgPath = svgPath;

        } catch (error) {
            console.error(`❌ Ошибка создания SVG: ${error.message}`);
        }
    } else if (generateSvg && !hasGraphviz) {
        console.log('\n⚠️ SVG не создан: Graphviz не установлен');
    } else if (generateSvg && circularOnly) {
        console.log('\n⚠️ SVG не создан: режим circular-only не поддерживает визуализацию');
    }

    // Добавляем в config.json
    if (addToConfig) {
        await addToConfigFile(resolvedConfigPath, {
            targetDir: resolvedTargetDir,
            relativeTargetDir: targetDir,
            entryFile: resolvedEntryFile,
            relativeEntryFile: entryFile,
            dependenciesFile: outputPath,
            modulesCount: modules.length,
            circularCount: circular.length,
            timestamp: now.toISOString(),
            svgPath: svgPath
        });
    }

    // Выводим отчет
    printReport(resultData, svgPath);

    return resultData;
}

/**
 * Сканирование нескольких файлов
 */
export async function scanMultipleFiles(baseConfig, files) {
    console.log('\n📚 СКАНИРОВАНИЕ НЕСКОЛЬКИХ ФАЙЛОВ');
    console.log('====================================\n');

    const results = [];
    for (const file of files) {
        console.log(`\n--- Сканирование: ${file} ---`);
        try {
            const result = await scanDependencies({
                ...baseConfig,
                entryFile: file
            });
            results.push(result);
        } catch (error) {
            console.error(`❌ Ошибка при сканировании ${file}: ${error.message}`);
        }
    }

    console.log(`\n✅ Отсканировано файлов: ${results.length}/${files.length}`);
    return results;
}

/**
 * Сканирование всей директории
 */
export async function scanDirectory(baseConfig) {
    console.log('\n📁 СКАНИРОВАНИЕ ВСЕЙ ДИРЕКТОРИИ');
    console.log('================================\n');

    const { targetDir, supportedExtensions = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'] } = baseConfig;
    const resolvedTargetDir = path.resolve(process.cwd(), targetDir);

    const entryPoints = [];
    const extensions = supportedExtensions.map(ext => ext.replace('.', ''));

    async function findEntryPoints(dir, depth = 0) {
        if (depth > 3) return;

        try {
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dir, item.name);

                if (item.isDirectory()) {
                    if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                        await findEntryPoints(fullPath, depth + 1);
                    }
                } else if (item.isFile()) {
                    const ext = path.extname(item.name).replace('.', '');
                    if (extensions.includes(ext)) {
                        const isEntryCandidate =
                            item.name.includes('main') ||
                            item.name.includes('index') ||
                            item.name.includes('app') ||
                            item.name.includes('cli') ||
                            depth === 0;

                        if (isEntryCandidate) {
                            entryPoints.push(path.relative(resolvedTargetDir, fullPath));
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Не удалось прочитать ${dir}: ${error.message}`);
        }
    }

    await findEntryPoints(resolvedTargetDir);

    if (entryPoints.length === 0) {
        console.log('❌ Не найдено файлов-кандидатов для сканирования');
        return [];
    }

    console.log(`📋 Найдено ${entryPoints.length} файлов-кандидатов:\n`);
    entryPoints.forEach((ep, idx) => {
        console.log(`   ${idx + 1}. ${ep}`);
    });

    const results = [];
    for (const entryPoint of entryPoints.slice(0, 10)) {
        console.log(`\n--- Сканирование: ${entryPoint} ---`);
        try {
            const result = await scanDependencies({
                ...baseConfig,
                entryFile: entryPoint
            });
            results.push(result);
        } catch (error) {
            console.error(`❌ Ошибка при сканировании ${entryPoint}: ${error.message}`);
        }
    }

    console.log(`\n✅ Отсканировано entry points: ${results.length}/${Math.min(entryPoints.length, 10)}`);
    return results;
}

// CLI поддержка
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    async function runCli() {
        const getArg = (name) => {
            const index = args.indexOf(name);
            return index !== -1 ? args[index + 1] : null;
        };
        const hasArg = (name) => args.includes(name);

        if (hasArg('--help') || hasArg('-h')) {
            console.log(`\nИспользование: node scan-dependencies.js [опции]\n\nОпции:\n  --dir <path>         Директория для сканирования\n  --entry <file>       Входной файл\n  --max-depth <n|all>  Максимальная глубина сканирования\n  --include-npm        Включить node_modules\n  --svg                Создать SVG визуализацию\n  --circular-only      Только циклические зависимости\n  --output <dir>       Каталог для JSON вывода\n  --output-name <name> Имя JSON файла (фиксированное или шаблон)\n  --svg-name <name>    Имя SVG файла (фиксированное или шаблон)\n  --config <file>      Путь к config.json\n  --add-to-config      Добавить в config.json\n  --help, -h           Показать справку\n\nШаблоны имени файла (если имя содержит {{...}}):\n  {{name}}       - имя входного файла без расширения\n  {{timestamp}}  - временная метка (Unix timestamp)\n  {{date}}       - дата (YYYY-MM-DD)\n  {{time}}       - время (HH-mm-ss)\n  {{datetime}}   - дата и время (YYYY-MM-DD_HH-mm-ss)\n  {{suffix}}     - суффикс (_circular для режима circular-only)\n  {{entry}}      - полное имя входного файла\n  {{dir}}        - имя директории\n  {{depth}}      - глубина (full или число)\n  {{npm}}        - with-npm или no-npm\n\nПримеры:\n  # Фиксированные имена\n  node scan-dependencies.js --dir ./src --entry index.js --output-name "deps.json"\n  node scan-dependencies.js --dir ./src --entry index.js --svg-name "graph.svg"\n  \n  # Шаблонные имена\n  node scan-dependencies.js --dir ./src --entry index.js --output-name "deps_{{name}}_{{timestamp}}.json"\n  node scan-dependencies.js --dir ./src --entry index.js --output-name "report_{{date}}_{{time}}.json"\n  \n  # С разными типами имен для JSON и SVG\n  node scan-dependencies.js --dir ./src --entry index.js --output-name "deps.json" --svg-name "graph_{{timestamp}}.svg"\n            `);
            return;
        }

        const config = {
            targetDir: getArg('--dir') || './src',
            entryFile: getArg('--entry') || 'index.js',
            maxDepth: getArg('--max-depth') || 'all',
            includeNpm: hasArg('--include-npm'),
            generateSvg: hasArg('--svg'),
            circularOnly: hasArg('--circular-only'),
            outputJsonDir: getArg('--output') || './fs',
            outputFileName: getArg('--output-name') || 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json',
            svgFileName: getArg('--svg-name') || 'graph_{{name}}_{{timestamp}}.svg',
            configPath: getArg('--config') || './config.json',
            addToConfig: hasArg('--add-to-config')
        };

        try {
            await scanDependencies(config);
        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            process.exit(1);
        }
    }

    runCli();
}

export default {
    scanDependencies,
    scanMultipleFiles,
    scanDirectory
};