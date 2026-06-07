import { createFileSystemJSON, saveFileSystemJSON, loadConfig, getDirectoriesToScan, saveScanReport, collectScanStats } from './FileSystemScanner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Проверяет наличие директорий перед сканированием
 */
function checkDirectories() {
    const config = loadConfig('./config.json');
    const directories = getDirectoriesToScan();
    const missingDirs = [];
    const warnings = [];

    console.log('\n🔍 ПРОВЕРКА ДИРЕКТОРИЙ:');

    for (const dir of directories) {
        const dirPath = path.join(__dirname, dir.name);
        const exists = fs.existsSync(dirPath);

        if (!exists) {
            missingDirs.push(dir);
            if (!dir.required) {
                warnings.push(`${dir.name} - ${dir.description}`);
            }
        }

        const status = exists ? '✅' : '❌';
        const requiredMark = dir.required ? ' (обязательная)' : '';
        console.log(`   ${status} ${dir.name}${requiredMark}: ${dir.description}`);
    }

    if (warnings.length > 0) {
        console.warn(`\n⚠️  ПРЕДУПРЕЖДЕНИЕ: Отсутствуют следующие необязательные директории:`);
        warnings.forEach(warning => console.warn(`   - ${warning}`));
        console.warn(`\n   💡 Сканирование продолжено с частичными данными.`);
        console.warn(`   Чтобы устранить предупреждения, создайте указанные директории.\n`);
    } else if (missingDirs.length > 0) {
        console.log(`\nℹ️  Отсутствуют обязательные директории, но сканирование продолжено.\n`);
    } else {
        console.log(`\n✅ Все директории найдены!\n`);
    }

    return missingDirs;
}

/**
 * Основная функция
 */
async function main() {
    console.log('🚀 ЗАПУСК СКАНЕРА ФАЙЛОВОЙ СИСТЕМЫ');
    console.log('====================================\n');

    try {
        // Проверяем наличие конфигурации
        const configPath = './config.json';
        if (!fs.existsSync(path.join(__dirname, configPath))) {
            console.warn(`⚠️  Конфигурационный файл ${configPath} не найден.`);
            console.log('🔄 Будет использована стандартная конфигурация.\n');
        } else {
            console.log(`✅ Конфигурационный файл найден: ${configPath}\n`);
        }

        // Проверяем директории
        checkDirectories();

        // Запускаем сканирование
        console.log('📂 НАЧАЛО СКАНИРОВАНИЯ...\n');
        const fsJSON = createFileSystemJSON(configPath);

        // Сохраняем результат
        const outputFileName = loadConfig(configPath)?.output?.fileName || './fs.json';
        saveFileSystemJSON(outputFileName, fsJSON, true);

        // Сохраняем отчет
        const stats = collectScanStats(fsJSON);
        saveScanReport(stats, './scan_report.log');

        console.log('\n✨ СКАНИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО! ✨');

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);

        // Сохраняем отчет об ошибке если включено
        const config = loadConfig('./config.json');
        if (config?.report?.enabled) {
            const errorReport = `ОШИБКА СКАНИРОВАНИЯ\n${new Date().toLocaleString('ru-RU')}\n${error.message}\n${error.stack}\n`;
            const reportPath = config.report.path || 'scan_report.log';
            fs.writeFileSync(reportPath, errorReport, { flag: 'a', encoding: 'utf8' });
        }

        process.exit(1);
    }
}

// Запускаем основную функцию
main();