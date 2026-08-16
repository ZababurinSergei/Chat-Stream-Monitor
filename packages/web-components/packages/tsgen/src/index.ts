#!/usr/bin/env node

import { PackageDetector } from './core/package-detector';
import { ConfigGenerator } from './core/config-generator';
import { DependencyManager } from './core/dependency-manager';
import { PackageUtils } from './utils/package-utils';
import { Logger } from './utils/logger';
import { join } from 'path';
import {existsSync, readFileSync} from 'node:fs';

class TSGenCLI {
    async run(): Promise<void> {
        const args = process.argv.slice(2);
        const command = args[0] || 'generate';
        const monorepoRoot = process.cwd();

        try {
            switch (command) {
                case 'generate':
                    await this.generateConfigs(monorepoRoot);
                    break;
                case 'root':
                    this.generateRootConfig(monorepoRoot);
                    break;
                case 'check':
                    this.checkPackages(monorepoRoot);
                    break;
                case 'help':
                    this.showHelp();
                    break;
                case 'version':
                    this.showVersion();
                    break;
                default:
                    Logger.error(`Неизвестная команда: ${command}`);
                    this.showHelp();
                    process.exit(1);
            }
        } catch (error) {
            Logger.error(`Ошибка выполнения: ${error}`);
            process.exit(1);
        }
    }

    private async generateConfigs(monorepoRoot: string): Promise<void> {
        Logger.info('🔍 Сканирование пакетов в монорепозитории...');

        const packages = PackageUtils.getExistingPackages(monorepoRoot);

        if (packages.length === 0) {
            Logger.warn('📦 Не найдено пакетов для генерации конфигураций');
            Logger.info('💡 Создайте пакеты в директории packages/ или используйте другую структуру');
            return;
        }

        Logger.info(`📊 Найдено пакетов: ${packages.length} (${packages.join(', ')})`);

        const generator = new ConfigGenerator();
        let successCount = 0;

        // Сначала собираем информацию о всех пакетах
        const packageInfos = packages.map(pkg =>
            PackageDetector.detectPackageInfo(monorepoRoot, pkg)
        );

        // Логируем информацию о пакетах
        Logger.info('📋 Информация о пакетах:');
        packageInfos.forEach(info => {
            const depsInfo = info.dependencies.length > 0
                ? ` → зависит от: ${info.dependencies.join(', ')}`
                : '';
            Logger.info(`   📁 ${info.name} (${info.type}) - ${info.builder}${info.isComposite ? ' 🔗 composite' : ''}${depsInfo}`);
        });

        // Генерируем конфигурации для каждого пакета
        for (const packageInfo of packageInfos) {
            Logger.info(`🔧 Генерация конфигурации для ${packageInfo.name}...`);

            if (generator.generateForPackage(packageInfo)) {
                successCount++;
                Logger.success(`✅ ${packageInfo.name} - конфигурация сгенерирована`);
            } else {
                Logger.warn(`⚠️ ${packageInfo.name} - пропущен`);
            }
        }

        // Генерируем корневую конфигурацию
        Logger.info('🌳 Генерация корневой конфигурации...');
        DependencyManager.generateRootConfig(monorepoRoot);

        // Финальная статистика
        Logger.success(`🎉 Генерация завершена!`);
        Logger.info(`📈 Статистика:
   ✅ Успешно: ${successCount}/${packages.length}
   📦 Пакетов: ${packages.length}
   🔗 Composite: ${packageInfos.filter(p => p.isComposite).length}
   🌐 Frontend: ${packageInfos.filter(p => p.type === 'frontend').length}
   🖥️ Backend: ${packageInfos.filter(p => p.type === 'backend').length}
   📚 Shared: ${packageInfos.filter(p => p.type === 'shared').length}`);

        // Рекомендации
        if (successCount < packages.length) {
            Logger.warn('💡 Некоторые пакеты были пропущены. Проверьте логи выше.');
        }

        Logger.info('🚀 Запустите проверку типов: npm run type-check');
    }

    private generateRootConfig(monorepoRoot: string): void {
        Logger.info('🌳 Генерация корневой конфигурации...');
        DependencyManager.generateRootConfig(monorepoRoot);
        Logger.success('✅ Корневой tsconfig.json создан');
    }

    private checkPackages(monorepoRoot: string): void {
        Logger.info('🔍 Проверка пакетов в монорепозитории...');

        const packages = PackageUtils.getExistingPackages(monorepoRoot);

        if (packages.length === 0) {
            Logger.warn('📦 Пакеты не найдены');
            return;
        }

        Logger.info(`📊 Найдено пакетов: ${packages.length}`);

        packages.forEach(pkg => {
            const packageInfo = PackageDetector.detectPackageInfo(monorepoRoot, pkg);

            const status = packageInfo.hasSource ? '✅' : '⚠️';
            const sourceInfo = packageInfo.hasSource ? 'имеет исходники' : 'нет исходников';
            const compositeInfo = packageInfo.isComposite ? '🔗 composite' : '📝 standalone';

            Logger.info(`   ${status} ${pkg}:`);
            Logger.info(`      📁 Тип: ${packageInfo.type}`);
            Logger.info(`      🔧 Сборщик: ${packageInfo.builder}`);
            Logger.info(`      📚 Исходники: ${sourceInfo}`);
            Logger.info(`      🔗 Режим: ${compositeInfo}`);

            if (packageInfo.dependencies.length > 0) {
                Logger.info(`      📦 Зависимости: ${packageInfo.dependencies.join(', ')}`);
            }

            // Проверяем существование tsconfig.json
            const tsconfigPath = join(monorepoRoot, 'packages', pkg, 'tsconfig.json');
            const hasTsConfig = PackageUtils.fileExists(tsconfigPath);
            const configStatus = hasTsConfig ? '✅ существует' : '❌ отсутствует';
            Logger.info(`      ⚙️ tsconfig.json: ${configStatus}`);
        });

        // Сводная статистика
        const packageInfos = packages.map(pkg => PackageDetector.detectPackageInfo(monorepoRoot, pkg));

        const typesCount = packageInfos.reduce((acc, pkg) => {
            acc[pkg.type] = (acc[pkg.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const buildersCount = packageInfos.reduce((acc, pkg) => {
            acc[pkg.builder] = (acc[pkg.builder] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Logger.info('📈 Сводная статистика:');
        Logger.info(`   📦 Всего пакетов: ${packages.length}`);
        Logger.info(`   🔗 Composite пакетов: ${packageInfos.filter(p => p.isComposite).length}`);

        Logger.info(`   🎯 Типы пакетов:`);
        Object.entries(typesCount).forEach(([type, count]) => {
            Logger.info(`      ${type}: ${count}`);
        });

        Logger.info(`   🔧 Сборщики:`);
        Object.entries(buildersCount).forEach(([builder, count]) => {
            Logger.info(`      ${builder}: ${count}`);
        });
    }

    private showHelp(): void {
        console.log(`\n🚀 TSGen - Умный генератор TypeScript конфигураций для монорепозиториев\n\nИСПОЛЬЗОВАНИЕ:\n  tsgen <command>\n\nКОМАНДЫ:\n  generate    📦 Генерация конфигураций для всех существующих пакетов\n  root        🌳 Только корневая конфигурация монорепозитория  \n  check       🔍 Проверка пакетов и вывод детальной информации\n  version     📋 Показать версию\n  help        ❓ Эта справка\n\nОСОБЕННОСТИ:\n  • 🎯 Автоопределение типа пакета (frontend/backend/shared/library)\n  • 🔧 Поддержка Vite, Webpack, Esbuild, Node.js\n  • 📦 Работа ТОЛЬКО с существующими пакетами\n  • 🔗 Автоматическое определение composite режима\n  • 🚫 Без ссылок на несуществующие пакеты\n  • 📁 Генерация дополнительных конфигов (tsconfig.node.json для Vite)\n\nПОДДЕРЖИВАЕМЫЕ СБОРЩИКИ:\n  • ⚡ Vite      - фронтенд приложения и библиотеки\n  • 📦 Webpack   - фронтенд приложения и библиотеки  \n  • 🚀 Esbuild   - универсальный сборщик\n  • 🖥️ Node      - бэкенд приложения и Node.js библиотеки\n\nПРИМЕРЫ:\n  tsgen generate    # Полная генерация для всех пакетов\n  tsgen check       # Проверить структуру пакетов\n  tsgen root        # Обновить только корневую конфигурацию\n\nДЕТЕКЦИЯ ПАКЕТОВ:\n  • Ищет пакеты в директории packages/\n  • Только пакеты с package.json и исходным кодом\n  • Автоматически определяет зависимости между пакетами\n  • Генерирует paths только для реальных зависимостей\n\nСОВМЕСТИМОСТЬ:\n  • TypeScript 5.3+\n  • Node.js 18+\n  • Монорепозитории с workspaces\n    `);
    }

    private showVersion(): void {
        const packageJsonPath = join(process.cwd(), 'package.json');
        const packageJson = PackageUtils.readJson<{ version?: string }>(packageJsonPath);

        console.log(`\n🔄 TSGen - TypeScript Configuration Generator\n📦 Версия: ${packageJson?.version || '2.0.0'}\n🚀 Node.js: ${process.version}\n💻 Платформа: ${process.platform} ${process.arch}\n📁 Рабочая директория: ${process.cwd()}\n    `);
    }
}

// Добавляем утилитарные методы в PackageUtils для полной реализации
const originalPackageUtils = PackageUtils as any;
if (!originalPackageUtils.fileExists) {
    originalPackageUtils.fileExists = (path: string) => {
        return existsSync(path);
    };
}

if (!originalPackageUtils.readJson) {
    originalPackageUtils.readJson = <T>(path: string): T | null => {
        try {
            if (existsSync(path)) {
                return JSON.parse(readFileSync(path, 'utf-8'));
            }
            return null;
        } catch {
            return null;
        }
    };
}

// Запуск приложения
const cli = new TSGenCLI();
cli.run().catch((error: Error) => {
    Logger.error(`💥 Фатальная ошибка: ${error.message}`);
    if (process.env['DEBUG']) {
        console.error(error.stack);
    }
    process.exit(1);
});