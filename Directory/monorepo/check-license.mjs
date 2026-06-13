/*
 * Copyright (c) 2026 Автор. Все права защищены.
 * Лицензия: CSL-1.0 (Custom Source License)
 *
 * Данный файл является частью Программного обеспечения и защищён авторским правом.
 * Использование разрешено ТОЛЬКО в некоммерческих целях.
 * Коммерческое использование ТОЛЬКО с письменного разрешения автора.
 * Изменение файлов запрещено - только через Pull Request.
 *
 * Полный текст лицензии: см. файл LICENSE
 */

/**
 * Скрипт для проверки соблюдения лицензии
 * Добавляет заголовок лицензии во все файлы проекта
 * Проверяет соответствие файлов лицензионным требованиям
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const CONFIG = {
    licenseHeader: `/*
 * Copyright (c) 2026 Автор. Все права защищены.
 * Лицензия: CSL-1.0 (Custom Source License)
 * 
 * Данный файл является частью Программного обеспечения и защищён авторским правом.
 * Использование разрешено ТОЛЬКО в некоммерческих целях.
 * Коммерческое использование ТОЛЬКО с письменного разрешения автора.
 * Изменение файлов запрещено - только через Pull Request.
 * 
 * Полный текст лицензии: см. файл LICENSE
 */

`,
    extensionsToProcess: ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx'],
    excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.nyc_output'],
    excludeFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']
};

/**
 * Проверяет, нужно ли обрабатывать файл
 * @param {string} filePath - путь к файлу
 * @returns {boolean} true если нужно обработать
 */
function shouldProcessFile(filePath) {
    const fileName = path.basename(filePath);

    // Проверяем исключённые файлы
    if (CONFIG.excludeFiles.includes(fileName)) {
        return false;
    }

    // Проверяем расширение
    const ext = path.extname(filePath);
    return CONFIG.extensionsToProcess.includes(ext);
}

/**
 * Проверяет, нужно ли обрабатывать директорию
 * @param {string} dirPath - путь к директории
 * @returns {boolean} true если нужно обработать
 */
function shouldProcessDirectory(dirPath) {
    const dirName = path.basename(dirPath);
    return !CONFIG.excludeDirs.includes(dirName);
}

/**
 * Проверяет, есть ли лицензионный заголовок в файле
 * @param {string} content - содержимое файла
 * @returns {boolean} true если заголовок есть
 */
function hasLicenseHeader(content) {
    return content.includes('Copyright (c)') &&
        content.includes('Лицензия: CSL') &&
        content.includes('некоммерческих целях');
}

/**
 * Добавляет лицензионный заголовок в файл
 * @param {string} filePath - путь к файлу
 * @returns {boolean} true если заголовок был добавлен
 */
function addLicenseHeader(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Проверяем, есть ли уже заголовок
        if (hasLicenseHeader(content)) {
            return false;
        }

        // Проверяем shebang (#!/usr/bin/env node)
        let newContent = content;
        let hasShebang = false;

        if (content.startsWith('#!')) {
            const lines = content.split('\n');
            const shebang = lines[0];
            const rest = lines.slice(1).join('\n');
            hasShebang = true;
            newContent = shebang + '\n' + CONFIG.licenseHeader + rest;
        } else {
            newContent = CONFIG.licenseHeader + content;
        }

        fs.writeFileSync(filePath, newContent, 'utf-8');
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Рекурсивно обходит директорию и обрабатывает файлы
 * @param {string} directory - путь к директории
 * @param {Object} stats - статистика обработки
 * @returns {Object} обновлённая статистика
 */
function processDirectory(directory, stats = { processed: 0, added: 0, skipped: 0, errors: 0 }) {
    try {
        const items = fs.readdirSync(directory);

        for (const item of items) {
            const fullPath = path.join(directory, item);

            try {
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (shouldProcessDirectory(fullPath)) {
                        processDirectory(fullPath, stats);
                    } else {
                        console.log(`⏭️  Пропуск директории: ${fullPath}`);
                        stats.skipped++;
                    }
                } else if (stat.isFile() && shouldProcessFile(fullPath)) {
                    stats.processed++;

                    if (addLicenseHeader(fullPath)) {
                        stats.added++;
                        console.log(`✅ Добавлена лицензия: ${fullPath}`);
                    } else {
                        console.log(`⏭️  Уже есть лицензия: ${fullPath}`);
                        stats.skipped++;
                    }
                }
            } catch (error) {
                console.error(`❌ Ошибка доступа к ${fullPath}: ${error.message}`);
                stats.errors++;
            }
        }
    } catch (error) {
        console.error(`❌ Ошибка чтения директории ${directory}: ${error.message}`);
        stats.errors++;
    }

    return stats;
}

/**
 * Проверяет, не был ли изменён файл без PR
 * @param {string} filePath - путь к файлу
 * @returns {Object} результат проверки
 */
function checkForUnauthorizedChanges(filePath) {
    try {
        // Проверяем, есть ли файл в git
        const gitStatus = execSync(`git status --porcelain "${filePath}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        if (gitStatus && gitStatus.trim()) {
            const statusCode = gitStatus.trim().substring(0, 2);
            // M - modified, A - added, D - deleted, R - renamed
            if (statusCode.includes('M') || statusCode.includes('A')) {
                return {
                    isChanged: true,
                    status: statusCode,
                    message: 'Файл был изменён локально. Изменения должны вноситься только через Pull Request!'
                };
            }
        }

        return { isChanged: false, message: 'OK' };
    } catch (error) {
        // Не в git репозитории или другая ошибка
        return { isChanged: false, message: 'Не удалось проверить git статус' };
    }
}

/**
 * Проверяет все файлы на предмет неавторизованных изменений
 * @param {string} directory - путь к директории
 * @returns {Array} список изменённых файлов
 */
function scanForUnauthorizedChanges(directory) {
    const changedFiles = [];

    function scan(dir) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (shouldProcessDirectory(fullPath)) {
                    scan(fullPath);
                }
            } else if (stat.isFile() && shouldProcessFile(fullPath)) {
                const result = checkForUnauthorizedChanges(fullPath);
                if (result.isChanged) {
                    changedFiles.push({
                        path: fullPath,
                        status: result.status,
                        message: result.message
                    });
                }
            }
        }
    }

    scan(directory);
    return changedFiles;
}

/**
 * Генерирует отчёт о соблюдении лицензии
 * @param {Object} stats - статистика обработки
 * @param {Array} changedFiles - список изменённых файлов
 */
function generateReport(stats, changedFiles) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ОТЧЁТ О ПРОВЕРКЕ ЛИЦЕНЗИИ');
    console.log('='.repeat(60));

    console.log('\n📁 Статистика обработки файлов:');
    console.log(`   ✅ Обработано файлов: ${stats.processed}`);
    console.log(`   📝 Добавлено лицензий: ${stats.added}`);
    console.log(`   ⏭️  Пропущено (уже есть): ${stats.skipped}`);
    console.log(`   ❌ Ошибок: ${stats.errors}`);

    if (changedFiles.length > 0) {
        console.log('\n⚠️  НАРУШЕНИЯ ЛИЦЕНЗИИ:');
        console.log(`   Обнаружено изменённых файлов: ${changedFiles.length}`);
        console.log('\n   Список файлов, изменённых напрямую (должны быть через PR):');
        changedFiles.forEach(file => {
            console.log(`   📄 ${file.path}`);
            console.log(`      Статус: ${file.status}`);
            console.log(`      ⚠️  ${file.message}`);
        });

        console.log('\n   🔧 Рекомендация:');
        console.log('   1. Отмените изменения или создайте Pull Request');
        console.log('   2. Все изменения должны проходить код-ревью');
        console.log('   3. Нарушение лицензии может привести к её отзыву');
    } else {
        console.log('\n✅ НАРУШЕНИЙ НЕ ОБНАРУЖЕНО');
        console.log('   Все изменения соответствуют лицензионным требованиям');
    }

    // Проверка наличия файла LICENSE
    const licensePath = path.join(__dirname, 'LICENSE');
    if (fs.existsSync(licensePath)) {
        console.log('\n📜 Файл LICENSE присутствует');
    } else {
        console.log('\n❌ ОТСУТСТВУЕТ ФАЙЛ LICENSE');
        console.log('   Добавьте файл LICENSE в корень проекта');
    }

    // Проверка наличия COMMERCIAL_LICENSE.md
    const commercialLicensePath = path.join(__dirname, 'COMMERCIAL_LICENSE.md');
    if (fs.existsSync(commercialLicensePath)) {
        console.log('📄 Файл COMMERCIAL_LICENSE.md присутствует');
    } else {
        console.log('⚠️  Файл COMMERCIAL_LICENSE.md отсутствует (рекомендуется)');
    }

    console.log('\n' + '='.repeat(60));
}

/**
 * Основная функция
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🔍 File System Scanner - Проверка лицензии');
    console.log('===========================================\n');

    switch (command) {
        case 'check':
            console.log('🔎 Проверка изменений файлов...\n');
            const changedFiles = scanForUnauthorizedChanges(path.join(__dirname, '.'));
            generateReport({ processed: 0, added: 0, skipped: 0, errors: 0 }, changedFiles);
            break;

        case 'add':
            console.log('📝 Добавление лицензионных заголовков...\n');
            const stats = processDirectory(path.join(__dirname, '.'));
            generateReport(stats, []);
            break;

        case 'verify':
            console.log('🔎 Полная верификация...\n');
            const addStats = processDirectory(path.join(__dirname, '.'));
            const verifyChangedFiles = scanForUnauthorizedChanges(path.join(__dirname, '.'));
            generateReport(addStats, verifyChangedFiles);
            break;

        case 'help':
        default:
            console.log('Доступные команды:');
            console.log('');
            console.log('  npm run license:add     - Добавить лицензионные заголовки во все файлы');
            console.log('  npm run license:check   - Проверить наличие неавторизованных изменений');
            console.log('  npm run license:verify  - Полная проверка (заголовки + изменения)');
            console.log('  npm run license:help    - Показать эту справку');
            console.log('');
            console.log('Примеры:');
            console.log('  node check-license.mjs add');
            console.log('  node check-license.mjs check');
            console.log('  node check-license.mjs verify');
            break;
    }
}

// Запуск основной функции
main().catch(console.error);

// Экспорт функций для использования в других модулях
export {
    addLicenseHeader,
    hasLicenseHeader,
    checkForUnauthorizedChanges,
    scanForUnauthorizedChanges,
    processDirectory,
    generateReport
};