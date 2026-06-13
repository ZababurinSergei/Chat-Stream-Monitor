#!/usr/bin/env node

/**
 * CLI для автоматического рефакторинга файлов с выделением модулей
 *
 * Использование:
 *   npx ast-refactor refactor <file> [options]
 *   npx ast-refactor help
 */

import { Command } from 'commander';
import { AutoRefactor } from './refactor/index.js';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('ast-refactor')
  .description('🔧 Автоматический рефакторинг файлов с выделением связных модулей')
  .version('1.0.0');

program
  .command('refactor <file>')
  .description('Рефакторинг файла с автоматическим выделением модулей')
  .option('-o, --out-dir <dir>', 'Директория для сохранения модулей', 'modules')
  .option('-t, --target-size <number>', 'Целевой размер кластера (количество функций)', '3')
  .option('-m, --max-size <number>', 'Максимальный размер кластера', '10')
  .option('-c, --min-cohesion <number>', 'Минимальная связность кластера (%)', '60')
  .option('--no-vue', 'Не обновлять template для Vue файлов (только script)')
  .option('-d, --dry-run', 'Пробный запуск без фактических изменений', false)
  .option('--no-backup', 'Не создавать резервную копию файла', false)
  .option('-v, --verbose', 'Подробный вывод процесса', false)
  .action(async (file, options) => {
    const startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('🔧 АВТОМАТИЧЕСКИЙ РЕФАКТОРИНГ ФАЙЛОВ');
    console.log('='.repeat(60));
    console.log(`\n📄 Целевой файл: ${file}`);
    console.log(`📁 Выходная директория: ${options.outDir}`);
    console.log(
      `🎯 Параметры: размер кластера=${options.targetSize}, связность=${options.minCohesion}%`
    );

    if (options.dryRun) {
      console.log('\n⚠️  РЕЖИМ DRY RUN: изменения не будут применены к файлам\n');
    }

    // Проверяем существование файла
    const absolutePath = path.resolve(file);
    if (!fs.existsSync(absolutePath)) {
      console.error(`\n❌ Ошибка: Файл не найден: ${absolutePath}`);
      process.exit(1);
    }

    // Проверяем расширение
    const isVue = absolutePath.endsWith('.vue');
    if (isVue) {
      console.log(`📦 Обнаружен Vue компонент, будет обновлён template`);
    }

    try {
      // Создаём экземпляр рефакторинга
      const refactor = new AutoRefactor({
        modulesDir: options.outDir,
        targetClusterSize: parseInt(options.targetSize),
        maxClusterSize: parseInt(options.maxSize),
        minCohesionScore: parseInt(options.minCohesion),
        updateTemplate: options.vue !== false && isVue,
        dryRun: options.dryRun,
        createBackup: options.backup !== false,
        verbose: options.verbose,
      });

      // Запускаем рефакторинг
      const result = await refactor.refactor(absolutePath);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (result.success) {
        console.log('\n' + '='.repeat(60));
        console.log('✨ РЕФАКТОРИНГ УСПЕШНО ЗАВЕРШЁН!');
        console.log('='.repeat(60));

        if (result.modules.length > 0) {
          console.log('\n📊 СТАТИСТИКА:');
          console.log(`   ⏱️  Время выполнения: ${duration} сек`);
          console.log(`   📦 Создано модулей: ${result.modules.length}`);
          console.log(
            `   🔗 Экспортов перенесено: ${result.modules.reduce((sum, m) => sum + m.exports.length, 0)}`
          );

          console.log('\n📁 СОЗДАННЫЕ МОДУЛИ:');
          for (const module of result.modules) {
            const relativePath = path.relative(process.cwd(), module.path);
            console.log(`   ✅ ${relativePath} (${module.exports.length} экспортов)`);
          }
        } else {
          console.log('\nℹ️  Не найдено кандидатов для выделения в модули');
        }

        if (result.backupPath) {
          console.log(`\n💾 Резервная копия: ${path.relative(process.cwd(), result.backupPath)}`);
        }

        console.log('\n💡 Совет: Запустите линтер и тесты после рефакторинга');
      } else {
        console.error('\n' + '='.repeat(60));
        console.error('❌ РЕФАКТОРИНГ НЕ УДАЛСЯ');
        console.error('='.repeat(60));
        console.error(`\nОшибка: ${result.error}`);

        if (result.backupPath && fs.existsSync(result.backupPath)) {
          console.log(
            `\n💾 Резервная копия сохранена: ${path.relative(process.cwd(), result.backupPath)}`
          );
          console.log(
            `   Восстановите файл командой: cp ${path.relative(process.cwd(), result.backupPath)} ${file}`
          );
        }

        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:');
      console.error(error instanceof Error ? error.message : String(error));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error('\nСтек вызовов:');
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('analyze <file>')
  .description('Только анализ файла без изменений (показывает кластеры)')
  .option('-t, --target-size <number>', 'Целевой размер кластера', '3')
  .option('-m, --max-size <number>', 'Максимальный размер кластера', '10')
  .option('-c, --min-cohesion <number>', 'Минимальная связность (%)', '60')
  .action(async (file, options) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 АНАЛИЗ ФАЙЛА (без изменений)');
    console.log('='.repeat(60));
    console.log(`\n📄 Файл: ${file}`);

    const absolutePath = path.resolve(file);
    if (!fs.existsSync(absolutePath)) {
      console.error(`\n❌ Файл не найден: ${absolutePath}`);
      process.exit(1);
    }

    try {
      const refactor = new AutoRefactor({
        targetClusterSize: parseInt(options.targetSize),
        maxClusterSize: parseInt(options.maxSize),
        minCohesionScore: parseInt(options.minCohesion),
        dryRun: true,
      });

      const result = await refactor.refactor(absolutePath);

      if (result.modules.length > 0) {
        console.log('\n📊 НАЙДЕННЫЕ КЛАСТЕРЫ:');
        for (let i = 0; i < result.modules.length; i++) {
          const module = result.modules[i];
          if (!module) continue;

          console.log(`\n   ${i + 1}. Модуль "${module.name}":`);
          console.log(`      📦 Экспорты: ${module.exports.join(', ')}`);
          if (module.dependencies.length > 0) {
            console.log(`      🔗 Зависимости: ${module.dependencies.join(', ')}`);
          }
        }

        console.log(`\n✨ Найдено ${result.modules.length} кандидатов в модули`);
        console.log('\n💡 Запустите рефакторинг командой:');
        console.log(`   ast-refactor refactor ${file}`);
      } else {
        console.log('\nℹ️  Не найдено кандидатов для выделения в модули');
        console.log('\n💡 Попробуйте уменьшить параметры:');
        console.log(
          `   --target-size ${parseInt(options.targetSize) - 1} --min-cohesion ${parseInt(options.minCohesion) - 10}`
        );
      }
    } catch (error) {
      console.error('\n❌ Ошибка анализа:', error);
      process.exit(1);
    }
  });

program
  .command('restore <backup-file>')
  .description('Восстановить файл из резервной копии')
  .option('-o, --output <file>', 'Целевой файл для восстановления (по умолчанию исходный)')
  .action(async (backupFile, options) => {
    console.log('\n🔄 ВОССТАНОВЛЕНИЕ ФАЙЛА');
    console.log('='.repeat(60));

    const backupPath = path.resolve(backupFile);
    if (!fs.existsSync(backupPath)) {
      console.error(`\n❌ Резервная копия не найдена: ${backupPath}`);
      process.exit(1);
    }

    // Определяем целевой файл
    let targetPath = options.output;
    if (!targetPath) {
      // Удаляем суффикс .backup.{timestamp}
      targetPath = backupPath.replace(/\.backup\.\d+$/, '');
    }

    const absoluteTarget = path.resolve(targetPath);

    console.log(`\n📁 Резервная копия: ${backupPath}`);
    console.log(`📄 Целевой файл: ${absoluteTarget}`);

    // Подтверждение
    console.log('\n⚠️  ВНИМАНИЕ: Это перезапишет целевой файл!');
    console.log('   Нажмите Enter для продолжения или Ctrl+C для отмены...');

    const waitForEnter = (): Promise<void> => {
      return new Promise(resolve => {
        process.stdin.once('data', () => resolve());
        setTimeout(() => resolve(), 3000);
      });
    };

    await waitForEnter();

    try {
      const content = await fs.promises.readFile(backupPath, 'utf-8');
      await fs.promises.writeFile(absoluteTarget, content, 'utf-8');
      console.log(`\n✅ Файл восстановлен: ${absoluteTarget}`);
    } catch (error) {
      console.error(`\n❌ Ошибка восстановления:`, error);
      process.exit(1);
    }
  });

program
  .command('help')
  .description('Показать подробную справку')
  .action(() => {
    console.log(`\n╔═══════════════════════════════════════════════════════════════════════════════╗
║                    AST REFACTOR - автоматическое выделение модулей            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ОПИСАНИЕ:                                                                    ║
║    Автоматически анализирует файл, находит связные группы функций и           ║
║    выделяет их в отдельные модули. Поддерживает JavaScript, TypeScript        ║
║    и Vue файлы (с обновлением template).                                      ║
║                                                                               ║
║  КОМАНДЫ:                                                                     ║
║                                                                               ║
║    refactor <file>     - Выполнить рефакторинг файла                          ║
║    analyze <file>      - Только анализ без изменений                          ║
║    restore <backup>    - Восстановить файл из резервной копии                 ║
║    help                - Показать эту справку                                 ║
║                                                                               ║
║  ОПЦИИ (для refactor):                                                        ║
║                                                                               ║
║    -o, --out-dir <dir>    Директория для модулей (по умолчанию: modules)      ║
║    -t, --target-size <n>  Целевой размер кластера (по умолчанию: 3)           ║
║    -m, --max-size <n>     Максимальный размер кластера (по умолчанию: 10)     ║
║    -c, --min-cohesion <n> Минимальная связность % (по умолчанию: 60)          ║
║    --no-vue               Не обновлять template Vue файлов                    ║
║    -d, --dry-run          Пробный запуск без изменений                        ║
║    --no-backup            Не создавать резервную копию                        ║
║    -v, --verbose          Подробный вывод                                     ║
║                                                                               ║
║  ПРИМЕРЫ:                                                                     ║
║                                                                               ║
║    # Анализ файла перед рефакторингом                                         ║
║    ast-refactor analyze ./src/huge-component.js                               ║
║                                                                               ║
║    # Рефакторинг JS файла                                                     ║
║    ast-refactor refactor ./src/utils.js -o ./modules                          ║
║                                                                               ║
║    # Рефакторинг Vue компонента (обновит и template)                          ║
║    ast-refactor refactor ./src/App.vue -t 4                                   ║
║                                                                               ║
║    # Пробный запуск без изменений                                             ║
║    ast-refactor refactor ./src/file.js --dry-run                              ║
║                                                                               ║
║    # Восстановление из бэкапа                                                 ║
║    ast-refactor restore ./src/file.js.backup.1703123456789                    ║
║                                                                               ║
║  АЛГОРИТМ РАБОТЫ:                                                             ║
║                                                                               ║
║    1. Построение графа зависимостей внутри файла                              ║
║    2. Выделение сильно связанных компонентов (кластеров)                      ║
║    3. Фильтрация кластеров по связности и размеру                             ║
║    4. Создание новых файлов модулей                                           ║
║    5. Обновление импортов в исходном файле                                    ║
║    6. (Vue) Обновление template ссылок                                        ║
║                                                                               ║
║  БЕЗОПАСНОСТЬ:                                                                ║
║    - Все изменения сначала применяются в памяти                               ║
║    - Создаётся резервная копия исходного файла                                ║
║    - Режим dry-run для проверки перед реальным запуском                       ║
║    - Возможность восстановления из бэкапа                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
  });

// Если нет аргументов, показываем справку
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
