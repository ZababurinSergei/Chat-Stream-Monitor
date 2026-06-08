#!/usr/bin/env node
// run-scan.js

import { scanDependencies, scanMultipleFiles, scanDirectory } from './scan-dependencies.js';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

/**
 * Интерактивный запуск сканирования зависимостей
 */
async function interactiveRun() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n🔍 MADGE - СКАНЕР ЗАВИСИМОСТЕЙ');
    console.log('================================\n');

    // Режим сканирования
    console.log('Режимы сканирования:');
    console.log('  1. Один файл');
    console.log('  2. Несколько файлов');
    console.log('  3. Вся директория');

    const mode = await question('\nВыберите режим (1-3): ');

    // Общие настройки
    const targetDir = await question('Директория для сканирования: ') || './Directory/11/deepseek';
    const depth = await question('Глубина (all/1/2/3...): ') || 'all';
    const includeNpm = (await question('Включать node_modules? (y/n): ')).toLowerCase() === 'y';
    const generateSvg = (await question('Создать SVG визуализацию? (y/n): ')).toLowerCase() === 'y';
    const outputJsonDir = await question('Каталог для JSON (Enter - ./fs): ') || './fs';
    const configPath = await question('Путь к config.json (Enter - ./Directory/10/config.json): ') || './Directory/10/config.json';
    const addToConfig = (await question('Добавить в config.json? (y/n): ')).toLowerCase() === 'y';

    const baseConfig = {
        targetDir,
        depth,
        includeNpm,
        generateSvg,
        outputJsonDir,
        configPath,
        addToConfig
    };

    switch (mode) {
        case '1':
            const entryFile = await question('Входной файл: ') || './Directory/11/deepseek/chatMonitor.js';
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

// Парсинг аргументов командной строки
function parseArgs() {
    const args = process.argv.slice(2);

    if (args.includes('--interactive') || args.includes('-i')) {
        interactiveRun();
        return null;
    }

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Использование: node run-scan.js [опции]

Опции:
  --interactive, -i    Интерактивный режим
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
  node run-scan.js --dir ./Directory/11/deepseek --entry chatMonitor.js --depth 2 --svg
  node run-scan.js --interactive
        `);
        return null;
    }

    const config = {
        targetDir: args[args.indexOf('--dir') + 1] || './Directory/11/deepseek',
        entryFile: args[args.indexOf('--entry') + 1] || './Directory/11/deepseek/chatMonitor.js',
        depth: args[args.indexOf('--depth') + 1] || 'all',
        includeNpm: args.includes('--include-npm'),
        generateSvg: args.includes('--svg'),
        outputJsonDir: args[args.indexOf('--output') + 1] || './fs',
        configPath: args[args.indexOf('--config') + 1] || './Directory/10/config.json',
        addToConfig: args.includes('--add-to-config')
    };

    return config;
}

// Запуск
const config = parseArgs();
if (config) {
    scanDependencies(config).catch(console.error);
}