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
            depth: 'all',
            outputJsonDir: './fs',
            svgOutputDir: './fs/svg'
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
        depth: defaults.depth,
        includeNpm: false,
        generateSvg: false,
        outputJsonDir: defaults.outputJsonDir || './fs',
        addToConfig: false,
        svgOutputDir: defaults.svgOutputDir || './fs/svg',
        circularOnly: false,
        preset: null
    };

    // Проверяем наличие preset в аргументах
    let presetName = null;
    let remainingArgs = [...rawArgs];

    for (let i = 0; i < remainingArgs.length; i++) {
        if (remainingArgs[i] === '--preset' && remainingArgs[i + 1]) {
            presetName = remainingArgs[i + 1];
            remainingArgs.splice(i, 2);
            i--;
        }
    }

    // Если preset указан и существует в конфиге - применяем его
    if (presetName && madgeConfig.presets?.[presetName]) {
        const preset = madgeConfig.presets[presetName];
        const mergeStrategy = madgeConfig.cli?.mergeStrategy || 'override';

        console.log(`\n📌 Используется preset: ${presetName}`);
        if (preset.description) {
            console.log(`   ${preset.description}`);
        }
        console.log('');

        // Преобразуем preset.args в формат аргументов
        const presetArgs = {};
        for (const [key, value] of Object.entries(preset.args)) {
            const argKey = key.replace(/^--/, '');
            if (key === '--svg' || key === '--include-npm' || key === '--circular-only') {
                presetArgs[argKey] = value === true;
            } else {
                presetArgs[argKey] = value;
            }
        }

        baseArgs = applyPresetArgs(baseArgs, presetArgs, mergeStrategy);
        baseArgs.preset = presetName;
    } else if (presetName) {
        console.warn(`⚠️ Preset "${presetName}" не найден в конфигурации`);
        console.log('   Доступные preset: deps-only, svg-only, quick, deep, with-npm, circular-only, visualize, minimal, full');
    }

    // Парсим остальные аргументы командной строки
    const getArg = (name, defaultValue) => {
        const index = remainingArgs.indexOf(name);
        return index !== -1 ? remainingArgs[index + 1] : defaultValue;
    };
    const hasArg = (name) => remainingArgs.includes(name);

    // Применяем аргументы из командной строки
    const finalArgs = { ...baseArgs };

    if (hasArg('--dir')) finalArgs.targetDir = getArg('--dir', finalArgs.targetDir);
    if (hasArg('--entry')) finalArgs.entryFile = getArg('--entry', finalArgs.entryFile);
    if (hasArg('--depth')) finalArgs.depth = getArg('--depth', finalArgs.depth);
    if (hasArg('--output')) finalArgs.outputJsonDir = getArg('--output', finalArgs.outputJsonDir);
    if (hasArg('--svg')) finalArgs.generateSvg = true;
    if (hasArg('--include-npm')) finalArgs.includeNpm = true;
    if (hasArg('--add-to-config')) finalArgs.addToConfig = true;
    if (hasArg('--circular-only')) finalArgs.circularOnly = true;

    finalArgs.configPath = configPath;

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

    console.log('\n📌 Значения по умолчанию:');
    console.log(`   --dir: ${defaults.targetDir}`);
    console.log(`   --entry: ${defaults.entryFile}`);
    console.log(`   --depth: ${defaults.depth}`);

    console.log('\n📌 Использование:');
    console.log('   node run-scan.js --preset deps-only');
    console.log('   node run-scan.js --preset svg-only --depth 3');
    console.log('   node run-scan.js --preset deep --dir ./my-project');
    console.log('   node run-scan.js --preset circular-only');
    console.log('   node run-scan.js --preset quick --svg');
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
                    if (arg === '--depth') defaults.depth = value;
                    if (arg === '--include-npm') madgeConfig.includeNpm = value;
                    if (arg === '--svg') madgeConfig.generateSvg = value;
                }
            }
        }
    }

    console.log(`\n📁 Директория по умолчанию: ${defaults.targetDir}`);
    console.log(`📄 Входной файл по умолчанию: ${defaults.entryFile}`);
    console.log(`📏 Глубина по умолчанию: ${defaults.depth}\n`);

    console.log('Режимы сканирования:');
    console.log('  1. Один файл');
    console.log('  2. Несколько файлов');
    console.log('  3. Вся директория');

    const mode = await question('\nВыберите режим (1-3): ');

    const targetDir = await question(`Директория (Enter - ${defaults.targetDir}): `) || defaults.targetDir;
    const depth = await question(`Глубина (all/1/2/3...) (Enter - ${defaults.depth}): `) || defaults.depth;
    const includeNpm = (await question('Включать node_modules? (y/n): ')).toLowerCase() === 'y';
    const generateSvg = (await question('Создать SVG? (y/n): ')).toLowerCase() === 'y';
    const outputJsonDir = await question(`Каталог для JSON (Enter - ${defaults.outputJsonDir}): `) || defaults.outputJsonDir;
    const addToConfig = (await question('Добавить в config.json? (y/n): ')).toLowerCase() === 'y';

    const baseConfig = {
        targetDir,
        depth,
        includeNpm,
        generateSvg,
        outputJsonDir,
        configPath,
        addToConfig,
        svgOutputDir: defaults.svgOutputDir || './fs/svg'
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

        console.log(`\nИспользование: node run-scan.js [опции]

Опции madge:
  --interactive, -i    Интерактивный режим
  --preset <name>      Использовать preset из config.json
  --dir <path>         Директория для сканирования
  --entry <file>       Входной файл
  --depth <n|all>      Глубина сканирования
  --include-npm        Включить node_modules
  --svg                Создать SVG визуализацию
  --circular-only      Только циклические зависимости
  --output <dir>       Каталог для JSON вывода
  --config <file>      Путь к config.json
  --add-to-config      Добавить в config.json
  --list-presets       Показать доступные preset'ы
  --help, -h           Показать справку

Примеры:
  # Preset'ы (абстрактные технические сценарии)
  node run-scan.js --preset deps-only      # Только анализ зависимостей
  node run-scan.js --preset svg-only       # Только SVG граф
  node run-scan.js --preset quick          # Быстрое сканирование
  node run-scan.js --preset deep           # Глубокое сканирование
  node run-scan.js --preset with-npm       # С npm зависимостями
  node run-scan.js --preset circular-only  # Только циклы
  node run-scan.js --preset visualize      # Полная визуализация
  
  # Preset с переопределением
  node run-scan.js --preset quick --depth 2 --svg
  
  # Без preset
  node run-scan.js --dir ./src --entry index.js --depth 2 --svg
  
  # Интерактивный режим
  node run-scan.js --interactive
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