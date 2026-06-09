#!/usr/bin/env node
// run-scan.js

import { scanDependencies, scanMultipleFiles, scanDirectory } from './scan-dependencies.js';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к config.json по умолчанию
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Загружает конфигурацию из config.json
 */
async function loadConfig(configPath) {
    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        console.log(`✅ Конфигурация загружена из ${configPath}`);
        return config;
    } catch (error) {
        console.warn(`⚠️ Не удалось загрузить конфигурацию из ${configPath}: ${error.message}`);
        console.log('📝 Используются настройки по умолчанию');
        return null;
    }
}

/**
 * Получает настройки madge из конфига
 */
function getMadgeConfig(config) {
    if (config && config.madge) {
        return config.madge;
    }
    // Настройки по умолчанию
    return {
        defaults: {
            targetDir: './Directory/11/deepseek',
            entryFile: 'chatMonitor.js',
            maxDepth: 'all',
            outputJsonDir: './fs',
            svgOutputDir: './fs/svg',
            outputFileName: 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json',
            svgFileName: 'graph_{{name}}_{{timestamp}}.svg'
        },
        presets: {},
        cli: {
            defaultPreset: null,
            mergeStrategy: 'override'
        }
    };
}

/**
 * Применяет аргументы из preset к базовым аргументам
 */
function applyPresetArgs(baseArgs, presetArgs, mergeStrategy = 'override') {
    const result = { ...baseArgs };

    for (const [key, value] of Object.entries(presetArgs)) {
        if (mergeStrategy === 'override') {
            result[key] = value;
        } else if (mergeStrategy === 'merge') {
            if (Array.isArray(result[key]) && Array.isArray(value)) {
                result[key] = [...new Set([...result[key], ...value])];
            } else if (typeof result[key] === 'object' && typeof value === 'object' && result[key] !== null && value !== null) {
                result[key] = { ...result[key], ...value };
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

/**
 * Определяет финальное имя файла на основе приоритетов:
 * 1. Явно указанный аргумент командной строки (--output-name)
 * 2. Значение из preset (если preset определён)
 * 3. Значение из defaults в config.json
 * 4. Значение по умолчанию
 */
function resolveFileName(cliValue, presetValue, defaultValue, defaultFallback) {
    // Приоритет 1: явный аргумент CLI
    if (cliValue !== undefined && cliValue !== null) {
        return cliValue;
    }
    // Приоритет 2: значение из preset
    if (presetValue !== undefined && presetValue !== null) {
        return presetValue;
    }
    // Приоритет 3: значение из defaults в config.json
    if (defaultValue !== undefined && defaultValue !== null) {
        return defaultValue;
    }
    // Приоритет 4: значение по умолчанию
    return defaultFallback;
}

/**
 * Парсит аргументы командной строки с учетом preset из конфига
 */
async function parseArgsWithConfig(configPath, rawArgs) {
    const fullConfig = await loadConfig(configPath);
    const madgeConfig = getMadgeConfig(fullConfig);
    const defaults = madgeConfig.defaults;

    // Базовые значения из конфига
    let baseArgs = {
        targetDir: defaults.targetDir,
        entryFile: defaults.entryFile,
        maxDepth: defaults.maxDepth || 'all',
        includeNpm: false,
        generateSvg: false,
        outputJsonDir: defaults.outputJsonDir || './fs',
        addToConfig: false,
        svgOutputDir: defaults.svgOutputDir || './fs/svg',
        circularOnly: false,
        preset: null,
        outputFileName: null,
        svgFileName: null
    };

    // Проверяем наличие preset в аргументах
    let presetName = null;
    let remainingArgs = [...rawArgs];
    let cliOutputName = null;
    let cliSvgName = null;

    for (let i = 0; i < remainingArgs.length; i++) {
        if (remainingArgs[i] === '--preset' && remainingArgs[i + 1]) {
            presetName = remainingArgs[i + 1];
            remainingArgs.splice(i, 2);
            i--;
        }
        if (remainingArgs[i] === '--output-name' && remainingArgs[i + 1]) {
            cliOutputName = remainingArgs[i + 1];
        }
        if (remainingArgs[i] === '--svg-name' && remainingArgs[i + 1]) {
            cliSvgName = remainingArgs[i + 1];
        }
    }

    // Значения из preset (если есть)
    let presetOutputName = null;
    let presetSvgName = null;

    // Если preset указан и существует в конфиге - применяем его
    if (presetName && madgeConfig.presets?.[presetName]) {
        const preset = madgeConfig.presets[presetName];
        const mergeStrategy = madgeConfig.cli?.mergeStrategy || 'override';

        console.log(`\n📌 Используется preset: ${presetName}`);
        if (preset.description) {
            console.log(`   ${preset.description}`);
        }
        console.log('');

        // Преобразуем preset.args в формат аргументов с правильным маппингом
        const presetArgs = {};
        for (const [key, value] of Object.entries(preset.args)) {
            const argKey = key.replace(/^--/, '');

            // Таблица маппинга аргументов CLI → поля finalArgs
            const mapping = {
                'svg': { field: 'generateSvg', type: 'boolean' },
                'include-npm': { field: 'includeNpm', type: 'boolean' },
                'circular-only': { field: 'circularOnly', type: 'boolean' },
                'max-depth': { field: 'maxDepth', type: 'string' },
                'dir': { field: 'targetDir', type: 'string' },
                'entry': { field: 'entryFile', type: 'string' },
                'output': { field: 'outputJsonDir', type: 'string' },
                'svg-dir': { field: 'svgOutputDir', type: 'string' },
                'output-name': { field: '_outputName', type: 'special' },
                'svg-name': { field: '_svgName', type: 'special' }
            };

            if (mapping[argKey]) {
                const map = mapping[argKey];

                if (map.type === 'boolean') {
                    // Преобразуем true/'true'/1 в true, остальное в false
                    presetArgs[map.field] = value === true || value === 'true' || value === 1;
                } else if (map.type === 'string') {
                    presetArgs[map.field] = String(value);
                } else if (map.type === 'special') {
                    if (map.field === '_outputName') {
                        presetOutputName = String(value);
                    } else if (map.field === '_svgName') {
                        presetSvgName = String(value);
                    }
                }
            } else {
                // Неизвестные аргументы сохраняем как есть (для будущей совместимости)
                presetArgs[argKey] = value;
            }
        }

        // Применяем presetArgs с приоритетом над baseArgs
        for (const [key, value] of Object.entries(presetArgs)) {
            baseArgs[key] = value;
        }

        baseArgs.preset = presetName;

        // Отладка
        console.log(`   ✅ maxDepth = ${baseArgs.maxDepth}`);
        console.log(`   ✅ generateSvg = ${baseArgs.generateSvg}`);

    } else if (presetName) {
        console.warn(`⚠️ Preset "${presetName}" не найден в конфигурации`);
        console.log('   Доступные preset: deps-only, svg-only, quick, deep, with-npm, circular-only, visualize, minimal, full, shallow');
    }

    // Определяем финальные имена файлов по приоритетам
    const finalOutputFileName = resolveFileName(
        cliOutputName,
        presetOutputName,
        defaults.outputFileName,
        'dependencies_{{name}}_{{timestamp}}{{suffix}}.json'
    );

    const finalSvgFileName = resolveFileName(
        cliSvgName,
        presetSvgName,
        defaults.svgFileName,
        'graph_{{name}}_{{timestamp}}.svg'
    );

    // Парсим остальные аргументы командной строки
    const getArg = (name, defaultValue) => {
        const index = remainingArgs.indexOf(name);
        return index !== -1 ? remainingArgs[index + 1] : defaultValue;
    };
    const hasArg = (name) => remainingArgs.includes(name);

    // Применяем аргументы из командной строки (переопределяют всё)
    const finalArgs = { ...baseArgs };

    // CLI аргументы с правильным маппингом
    const cliMapping = {
        '--dir': 'targetDir',
        '--entry': 'entryFile',
        '--max-depth': 'maxDepth',
        '--output': 'outputJsonDir',
        '--svg-dir': 'svgOutputDir'
    };

    for (const [cliFlag, fieldName] of Object.entries(cliMapping)) {
        if (hasArg(cliFlag)) {
            finalArgs[fieldName] = getArg(cliFlag, finalArgs[fieldName]);
        }
    }

    // Флаги без значений
    if (hasArg('--svg')) finalArgs.generateSvg = true;
    if (hasArg('--include-npm')) finalArgs.includeNpm = true;
    if (hasArg('--add-to-config')) finalArgs.addToConfig = true;
    if (hasArg('--circular-only')) finalArgs.circularOnly = true;

    // Устанавливаем финальные имена файлов
    finalArgs.outputFileName = finalOutputFileName;
    finalArgs.svgFileName = finalSvgFileName;
    finalArgs.configPath = configPath;

    // Для отладки - можно раскомментировать
    // console.log('DEBUG: finalArgs =', finalArgs);

    return { finalArgs, madgeConfig, fullConfig };
}

/**
 * Выводит список доступных preset'ов
 */
function listPresets(madgeConfig) {
    const presets = madgeConfig.presets || {};
    const defaultPreset = madgeConfig.cli?.defaultPreset;
    const defaults = madgeConfig.defaults;

    console.log('\n📋 Доступные preset\'ы madge:');
    console.log('═══════════════════════════════════');

    for (const [name, preset] of Object.entries(presets)) {
        const defaultMark = defaultPreset === name ? ' ⭐ (по умолчанию)' : '';
        console.log(`\n  🔹 ${name}${defaultMark}`);
        if (preset.description) {
            console.log(`     📝 ${preset.description}`);
        }
        console.log('     ⚙️  Аргументы:');
        for (const [arg, value] of Object.entries(preset.args)) {
            const valueStr = typeof value === 'boolean' ? (value ? '✅ вкл' : '❌ выкл') : value;
            console.log(`        ${arg}: ${valueStr}`);
        }
    }

    console.log('\n📌 Значения по умолчанию из config.json:');
    console.log(`   --dir: ${defaults.targetDir}`);
    console.log(`   --entry: ${defaults.entryFile}`);
    console.log(`   --max-depth: ${defaults.maxDepth}`);
    console.log(`   --output-name: ${defaults.outputFileName || 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json'}`);
    console.log(`   --svg-name: ${defaults.svgFileName || 'graph_{{name}}_{{timestamp}}.svg'}`);
    console.log(`   --svg-dir: ${defaults.svgOutputDir || './fs/svg'}`);

    console.log('\n📌 Использование:');
    console.log('   node run-scan.js --preset deps-only');
    console.log('   node run-scan.js --preset svg-only --max-depth 3');
    console.log('   node run-scan.js --preset deep --dir ./my-project');
    console.log('   node run-scan.js --preset circular-only');
    console.log('   node run-scan.js --preset quick --svg');
    console.log('   node run-scan.js --preset shallow --svg-dir ./output');
    console.log('');
}

/**
 * Интерактивный запуск
 */
async function interactiveRun(configPath) {
    const fullConfig = await loadConfig(configPath);
    const madgeConfig = getMadgeConfig(fullConfig);
    const defaults = madgeConfig.defaults;
    const presets = madgeConfig.presets || {};

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n🔍 MADGE - СКАНЕР ЗАВИСИМОСТЕЙ');
    console.log('================================\n');
    console.log(`📁 Конфигурация: ${configPath}`);

    // Показываем доступные preset'ы
    if (Object.keys(presets).length > 0) {
        console.log('\n📋 Доступные preset\'ы:');
        const presetList = Object.entries(presets).map(([name, p]) =>
            `   ${name}: ${p.description || 'без описания'}`
        ).join('\n');
        console.log(presetList);

        const usePreset = (await question('\nИспользовать preset? (y/n): ')).toLowerCase() === 'y';
        if (usePreset) {
            const presetName = await question(`Выберите preset (${Object.keys(presets).join('/')}): `);
            if (presets[presetName]) {
                const preset = presets[presetName];
                console.log(`\n✅ Применен preset: ${presetName} - ${preset.description}`);

                for (const [arg, value] of Object.entries(preset.args)) {
                    if (arg === '--dir') defaults.targetDir = value;
                    if (arg === '--entry') defaults.entryFile = value;
                    if (arg === '--max-depth') defaults.maxDepth = value;
                    if (arg === '--include-npm') madgeConfig.includeNpm = value;
                    if (arg === '--svg') madgeConfig.generateSvg = value;
                    if (arg === '--output-name') defaults.outputFileName = value;
                    if (arg === '--svg-name') defaults.svgFileName = value;
                    if (arg === '--svg-dir') defaults.svgOutputDir = value;
                }
            }
        }
    }

    console.log(`\n📁 Директория по умолчанию: ${defaults.targetDir}`);
    console.log(`📄 Входной файл по умолчанию: ${defaults.entryFile}`);
    console.log(`📏 Максимальная глубина по умолчанию: ${defaults.maxDepth}`);
    console.log(`📝 Имя JSON по умолчанию: ${defaults.outputFileName || 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json'}`);
    console.log(`🎨 Имя SVG по умолчанию: ${defaults.svgFileName || 'graph_{{name}}_{{timestamp}}.svg'}`);
    console.log(`📁 SVG директория по умолчанию: ${defaults.svgOutputDir || './fs/svg'}\n`);

    console.log('Режимы сканирования:');
    console.log('  1. Один файл');
    console.log('  2. Несколько файлов');
    console.log('  3. Вся директория');

    const mode = await question('\nВыберите режим (1-3): ');

    const targetDir = await question(`Директория (Enter - ${defaults.targetDir}): `) || defaults.targetDir;
    const maxDepth = await question(`Максимальная глубина (all/1/2/3...) (Enter - ${defaults.maxDepth}): `) || defaults.maxDepth;
    const includeNpm = (await question('Включать node_modules? (y/n): ')).toLowerCase() === 'y';
    const generateSvg = (await question('Создать SVG? (y/n): ')).toLowerCase() === 'y';
    const outputJsonDir = await question(`Каталог для JSON (Enter - ${defaults.outputJsonDir}): `) || defaults.outputJsonDir;
    const outputFileName = await question(`Имя JSON файла (Enter - ${defaults.outputFileName || 'dependencies_{{name}}_{{timestamp}}{{suffix}}.json'}): `) || defaults.outputFileName;
    const svgFileName = await question(`Имя SVG файла (Enter - ${defaults.svgFileName || 'graph_{{name}}_{{timestamp}}.svg'}): `) || defaults.svgFileName;
    const svgOutputDir = await question(`SVG директория (Enter - ${defaults.svgOutputDir || './fs/svg'}): `) || defaults.svgOutputDir;
    const addToConfig = (await question('Добавить в config.json? (y/n): ')).toLowerCase() === 'y';

    const baseConfig = {
        targetDir,
        maxDepth,
        includeNpm,
        generateSvg,
        outputJsonDir,
        outputFileName,
        svgFileName,
        svgOutputDir,
        configPath,
        addToConfig
    };

    switch (mode) {
        case '1':
            const entryFile = await question(`Входной файл (Enter - ${defaults.entryFile}): `) || defaults.entryFile;
            await scanDependencies({ ...baseConfig, entryFile });
            break;
        case '2':
            const filesInput = await question('Файлы через запятую: ');
            const files = filesInput.split(',').map(f => f.trim());
            await scanMultipleFiles(baseConfig, files);
            break;
        case '3':
            await scanDirectory(baseConfig);
            break;
        default:
            console.log('Неверный режим');
    }

    rl.close();
}

/**
 * Парсинг аргументов командной строки
 */
async function parseArgs() {
    const args = process.argv.slice(2);

    let configPath = DEFAULT_CONFIG_PATH;
    const configIndex = args.indexOf('--config');
    if (configIndex !== -1 && args[configIndex + 1]) {
        configPath = path.resolve(process.cwd(), args[configIndex + 1]);
    }

    if (args.includes('--help') || args.includes('-h')) {
        const fullConfig = await loadConfig(configPath);
        const madgeConfig = getMadgeConfig(fullConfig);

        console.log(`\nИспользование: node run-scan.js [опции]\n\nОпции madge:\n  --interactive, -i    Интерактивный режим\n  --preset <name>      Использовать preset из config.json\n  --dir <path>         Директория для сканирования\n  --entry <file>       Входной файл\n  --max-depth <n|all>  Максимальная глубина сканирования зависимостей\n  --include-npm        Включить node_modules\n  --svg                Создать SVG визуализацию\n  --svg-dir <dir>      Директория для SVG файлов\n  --circular-only      Только циклические зависимости\n  --output <dir>       Каталог для JSON вывода\n  --output-name <name> Имя JSON файла (фиксированное или шаблон)\n  --svg-name <name>    Имя SVG файла (фиксированное или шаблон)\n  --config <file>      Путь к config.json\n  --add-to-config      Добавить в config.json\n  --list-presets       Показать доступные preset'ы\n  --help, -h           Показать справку\n\nПриоритет определения имени файла:\n  1. Явный аргумент командной строки (--output-name/--svg-name)\n  2. Значение из preset в config.json\n  3. Значение defaults из config.json\n  4. Значение по умолчанию\n\nПримеры:\n  # Preset'ы (абстрактные технические сценарии)\n  node run-scan.js --preset deps-only      # Только анализ зависимостей\n  node run-scan.js --preset svg-only       # Только SVG граф\n  node run-scan.js --preset quick          # Быстрое сканирование (глубина 2)\n  node run-scan.js --preset deep           # Глубокое сканирование\n  node run-scan.js --preset with-npm       # С npm зависимостями\n  node run-scan.js --preset circular-only  # Только циклы\n  node run-scan.js --preset visualize      # Полная визуализация\n  node run-scan.js --preset shallow        # Поверхностное сканирование\n  \n  # Preset с переопределением имени файла\n  node run-scan.js --preset quick --output-name \"my_deps.json\"\n  \n  # С явным указанием глубины\n  node run-scan.js --dir ./src --entry index.js --max-depth 2 --svg\n  \n  # Интерактивный режим\n  node run-scan.js --interactive
        `);

        if (Object.keys(madgeConfig.presets || {}).length > 0) {
            listPresets(madgeConfig);
        }

        return null;
    }

    if (args.includes('--list-presets')) {
        const fullConfig = await loadConfig(configPath);
        const madgeConfig = getMadgeConfig(fullConfig);
        listPresets(madgeConfig);
        return null;
    }

    if (args.includes('--interactive') || args.includes('-i')) {
        await interactiveRun(configPath);
        return null;
    }

    const { finalArgs, fullConfig } = await parseArgsWithConfig(configPath, args);

    const scanConfig = {
        ...finalArgs,
        excludePatterns: fullConfig?.excludePatterns || { directories: [], files: [] },
        supportedExtensions: fullConfig?.supportedExtensions || ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.json'],
        scanOptions: fullConfig?.scanOptions || {}
    };

    return scanConfig;
}

// Запуск
const config = await parseArgs();
if (config) {
    try {
        await scanDependencies(config);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}