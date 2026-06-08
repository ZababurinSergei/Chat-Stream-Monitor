// scan-dependencies.js (исправленная версия)
import madge from 'madge';
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
async function checkGraphviz() {
    try {
        await execAsync('dot -V');
        return true;
    } catch {
        return false;
    }
}

/**
 * Основная функция сканирования зависимостей
 */
export async function scanDependencies(config) {
    const {
        targetDir,
        entryFile,
        depth = 'all',
        includeNpm = false,
        generateSvg = false,
        outputJsonDir = './fs',
        configPath = './Directory/10/config.json',
        addToConfig = false
    } = config;

    // РАСЧЕТ ПУТЕЙ
    const currentDir = process.cwd();
    const resolvedTargetDir = path.resolve(currentDir, targetDir);
    const resolvedEntryFile = path.resolve(resolvedTargetDir, entryFile);
    const resolvedOutputDir = path.resolve(currentDir, outputJsonDir);
    const resolvedConfigPath = path.resolve(currentDir, configPath);

    console.log('\n🔍 ЗАПУСК СКАНЕРА ЗАВИСИМОСТЕЙ (madge)');
    console.log('========================================\n');
    console.log(`📁 Текущая директория: ${currentDir}`);
    console.log(`📁 Директория: ${resolvedTargetDir}`);
    console.log(`📄 Входной файл: ${resolvedEntryFile}`);
    console.log(`📏 Глубина: ${depth === 'all' ? 'все' : `${depth} уровень(я/ей)`}`);
    console.log(`📦 Включить npm: ${includeNpm ? 'да' : 'нет'}`);
    console.log(`🎨 SVG визуализация: ${generateSvg ? 'да' : 'нет'}`);

    // Проверка Graphviz если нужен SVG
    let hasGraphviz = false;
    if (generateSvg) {
        hasGraphviz = await checkGraphviz();
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

    // Настройки madge
    const madgeConfig = {
        baseDir: resolvedTargetDir,
        includeNpm: includeNpm,
        fileExtensions: ['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'vue', 'json']
    };

    // Получаем дерево зависимостей
    console.log('\n📊 Построение дерева зависимостей...');
    const result = await madge(resolvedEntryFile, madgeConfig);
    let fullTree = result.obj();

    // Ограничиваем глубину
    if (depth !== 'all') {
        const maxDepth = parseInt(depth, 10);
        if (!isNaN(maxDepth)) {
            console.log(`✂️ Ограничение глубины до ${maxDepth}...`);
            fullTree = limitTreeDepth(fullTree, resolvedEntryFile, resolvedTargetDir, maxDepth);
        }
    }

    // Статистика
    const modules = Object.keys(fullTree);
    console.log(`\n📦 Найдено модулей: ${modules.length}`);
    const stats = collectStats(fullTree);
    const circular = result.circular();

    // Формируем результат
    const resultData = {
        scanInfo: {
            timestamp: new Date().toISOString(),
            currentDir: currentDir,
            targetDir: resolvedTargetDir,
            entryFile: resolvedEntryFile,
            entryFileName: path.basename(entryFile),
            depth: depth === 'all' ? 'all' : parseInt(depth, 10),
            includeNpm: includeNpm,
            totalModules: modules.length
        },
        stats: stats,
        tree: fullTree,
        circular: circular,
        circularCount: circular.length
    };

    // Сохраняем JSON
    await ensureDirectory(resolvedOutputDir);
    const timestamp = Date.now();
    const baseName = path.basename(entryFile, path.extname(entryFile));
    const outputFileName = `dependencies_${baseName}_${timestamp}.json`;
    const outputPath = path.join(resolvedOutputDir, outputFileName);
    await fs.writeFile(outputPath, JSON.stringify(resultData, null, 2), 'utf-8');
    console.log(`\n💾 JSON сохранен: ${outputPath}`);

    // Генерируем SVG если нужно и Graphviz установлен
    let svgPath = null;
    if (generateSvg && hasGraphviz) {
        const svgDir = path.join(resolvedOutputDir, 'svg');
        await ensureDirectory(svgDir);
        svgPath = path.join(svgDir, `dependencies_${baseName}_${timestamp}.svg`);

        try {
            console.log('\n🎨 Генерация SVG...');

            // Получаем DOT формат
            const dotOutput = await result.dot();

            // Сохраняем DOT файл для отладки
            const dotPath = path.join(svgDir, `dependencies_${baseName}_${timestamp}.dot`);
            await fs.writeFile(dotPath, dotOutput);
            console.log(`   DOT файл сохранен: ${dotPath}`);

            // Конвертируем DOT в SVG через Graphviz
            await execAsync(`dot -Tsvg "${dotPath}" -o "${svgPath}"`);

            // Проверяем, создался ли файл
            await fs.access(svgPath);
            const svgStats = await fs.stat(svgPath);
            console.log(`✅ SVG создан: ${svgPath} (${(svgStats.size / 1024).toFixed(2)} KB)`);

            resultData.svgPath = svgPath;

        } catch (error) {
            console.error(`❌ Ошибка создания SVG: ${error.message}`);
            console.warn('   Попробуйте сгенерировать вручную:');
            console.warn(`   cat > graph.dot << 'EOF'`);
            console.warn(`   ${dotOutput.substring(0, 200)}...`);
            console.warn(`   EOF`);
            console.warn(`   dot -Tsvg graph.dot -o output.svg`);
        }
    } else if (generateSvg && !hasGraphviz) {
        console.log('\n⚠️ SVG не создан: Graphviz не установлен');
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
            timestamp: new Date().toISOString()
        });
    }

    // Выводим отчет
    printReport(resultData, svgPath);

    return resultData;
}

/**
 * Ограничение глубины дерева
 */
function limitTreeDepth(tree, entryFile, baseDir, maxDepth) {
    const limited = {};
    const visited = new Set();
    const entryRelative = path.relative(baseDir, entryFile);

    let entryKey = Object.keys(tree).find(key =>
        key === entryRelative ||
        key === path.basename(entryFile) ||
        key.endsWith(path.basename(entryFile))
    );

    if (!entryKey && Object.keys(tree).length > 0) {
        entryKey = Object.keys(tree)[0];
    }

    if (!entryKey) return tree;

    function traverse(node, currentDepth) {
        if (currentDepth > maxDepth) return;
        if (visited.has(node)) return;

        visited.add(node);

        if (!limited[node]) {
            limited[node] = [];
        }

        const dependencies = tree[node] || [];

        for (const dep of dependencies) {
            if (!limited[node].includes(dep)) {
                limited[node].push(dep);
            }
            if (currentDepth < maxDepth) {
                traverse(dep, currentDepth + 1);
            }
        }
    }

    traverse(entryKey, 1);
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
            scannedAt: depsInfo.timestamp
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
    console.log(`📄 JSON: ${data.scanInfo.entryFileName}_*.json`);
    if (svgPath) {
        console.log(`🎨 SVG: ${path.basename(svgPath)}`);
    }
    console.log(separator);
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
            console.log(`
Использование: node scan-dependencies.js [опции]

Опции:
  --dir <path>         Директория для сканирования
  --entry <file>       Входной файл
  --depth <n|all>      Глубина сканирования
  --include-npm        Включить node_modules
  --svg                Создать SVG визуализацию
  --output <dir>       Каталог для JSON вывода
  --config <file>      Путь к config.json
  --add-to-config      Добавить в config.json
  --help, -h           Показать справку

Примеры:
  node scan-dependencies.js --dir ./Directory/13/madge --entry lib/api.js --depth all --svg
  node scan-dependencies.js --dir ./Directory/13/madge --entry lib/api.js --depth 2 --svg
            `);
            return;
        }

        const config = {
            targetDir: getArg('--dir') || './Directory/13/madge',
            entryFile: getArg('--entry') || 'lib/api.js',
            depth: getArg('--depth') || 'all',
            includeNpm: hasArg('--include-npm'),
            generateSvg: hasArg('--svg'),
            outputJsonDir: getArg('--output') || './fs',
            configPath: getArg('--config') || './Directory/10/config.json',
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
    scanDependencies
};