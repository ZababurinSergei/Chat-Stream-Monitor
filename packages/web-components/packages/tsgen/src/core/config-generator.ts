import type { BaseBuilder } from '../builders/base-builder';
import { ViteBuilder } from '../builders/vite-builder';
import { NodeBuilder } from '../builders/node-builder';
import { EsbuildBuilder } from '../builders/esbuild-builder';
import { WebpackBuilder } from '../builders/webpack-builder';
import type { PackageInfo, BuilderType } from '../types/config.types';
import { FileUtils } from '../utils/file-utils';
import { Logger } from '../utils/logger';
import { join } from 'path';

export class ConfigGenerator {
    private builders: Map<BuilderType, typeof BaseBuilder> = new Map();

    constructor() {
        this.registerBuilders();
    }

    private registerBuilders(): void {
        this.builders.set('vite', ViteBuilder as any);
        this.builders.set('node', NodeBuilder as any);
        this.builders.set('esbuild', EsbuildBuilder as any);
        this.builders.set('webpack', WebpackBuilder as any);
        // NodeBuilder будет использоваться как fallback
    }

    generateForPackage(packageInfo: PackageInfo): boolean {
        try {
            Logger.info(`Генерация конфигурации для ${packageInfo.name} (${packageInfo.builder})`);

            // Fallback логика для unknown сборщиков
            let effectiveBuilder = packageInfo.builder;
            if (effectiveBuilder === 'unknown') {
                effectiveBuilder = this.determineFallbackBuilder(packageInfo);
                Logger.info(`🔄 Используем fallback сборщик: ${effectiveBuilder} для пакета ${packageInfo.name}`);
            }

            const BuilderClass = this.builders.get(effectiveBuilder) || NodeBuilder;
            const builder = new (BuilderClass as any)(packageInfo);

            if (!builder.isSupported()) {
                Logger.warn(`Билдер ${effectiveBuilder} не поддерживает тип пакета ${packageInfo.type}`);

                // Пробуем esbuild как универсальный fallback
                if (effectiveBuilder !== 'esbuild') {
                    Logger.info(`🔄 Пробуем esbuild как универсальный fallback...`);
                    const EsbuildBuilderClass = this.builders.get('esbuild');
                    if (EsbuildBuilderClass) {
                        const esbuildBuilder = new (EsbuildBuilderClass as any)(packageInfo);
                        if (esbuildBuilder.isSupported()) {
                            return this.generateWithBuilder(esbuildBuilder, packageInfo);
                        }
                    }
                }

                return false;
            }

            return this.generateWithBuilder(builder, packageInfo);

        } catch (error) {
            Logger.error(`Ошибка генерации для ${packageInfo.name}: ${error}`);
            return false;
        }
    }

    private generateWithBuilder(builder: any, packageInfo: PackageInfo): boolean {
        const config = builder.generateConfig();

        // Генерируем основной tsconfig.json
        this.writeConfig(join(packageInfo.path, 'tsconfig.json'), config.mainConfig);

        // Генерируем дополнительные конфигурации
        for (const [filename, additionalConfig] of Object.entries(config.additionalConfigs)) {
            this.writeConfig(join(packageInfo.path, filename), additionalConfig);
        }

        // Обновляем package.json если нужно
        this.updatePackageJson(packageInfo.path, config.packageJsonUpdates);

        Logger.success(`Конфигурация для ${packageInfo.name} сгенерирована с помощью ${builder.name}`);
        return true;
    }

    private determineFallbackBuilder(packageInfo: PackageInfo): BuilderType {
        const packageType = packageInfo.type;

        // Логика выбора fallback сборщика на основе типа пакета
        switch (packageType) {
            case 'frontend':
            case 'browser':
            case 'react':
            case 'vue':
            case 'svelte':
            case 'angular':
                // Для фронтенда используем esbuild как быстрый и современный вариант
                return 'esbuild';

            case 'backend':
            case 'node':
            case 'api':
            case 'microservice':
                // Для бэкенда используем node builder
                return 'node';

            case 'library':
            case 'shared':
                // Для библиотек используем esbuild для универсальности
                return 'esbuild';

            case 'cli':
                // Для CLI используем node builder
                return 'node';

            default:
                // По умолчанию используем esbuild
                return 'esbuild';
        }
    }

    private writeConfig(path: string, config: any): void {
        FileUtils.writeJson(path, config);
        Logger.debug(`Записан конфиг: ${path}`);
    }

    private updatePackageJson(packagePath: string, updates: any): void {
        const packageJsonPath = join(packagePath, 'package.json');
        const packageJson = FileUtils.readJson(packageJsonPath) || {};

        // Мерджим обновления
        const updated = this.deepMerge(packageJson, updates);
        FileUtils.writeJson(packageJsonPath, updated);

        Logger.debug(`Обновлен package.json: ${packageJsonPath}`);
    }

    private deepMerge(target: any, source: any): any {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Генерирует конфигурации для всех пакетов в монорепозитории
     */
    generateForAllPackages(packages: PackageInfo[]): { success: number; total: number } {
        let successCount = 0;

        packages.forEach(packageInfo => {
            if (this.generateForPackage(packageInfo)) {
                successCount++;
            }
        });

        return {
            success: successCount,
            total: packages.length
        };
    }

    /**
     * Проверяет существующие конфигурации и возвращает список устаревших
     */
    checkOutdatedConfigs(packages: PackageInfo[]): Array<{ package: string; reason: string }> {
        const outdated: Array<{ package: string; reason: string }> = [];

        packages.forEach(packageInfo => {
            const BuilderClass = this.builders.get(packageInfo.builder) || NodeBuilder;
            const builder = new (BuilderClass as any)(packageInfo);

            if (!builder.isSupported()) {
                outdated.push({
                    package: packageInfo.name,
                    reason: `Билдер ${packageInfo.builder} не поддерживает тип пакета ${packageInfo.type}`
                });
                return;
            }

            const expectedConfig = builder.generateConfig();
            const currentConfigPath = join(packageInfo.path, 'tsconfig.json');
            const currentConfig = FileUtils.readJson(currentConfigPath);

            if (!currentConfig) {
                outdated.push({
                    package: packageInfo.name,
                    reason: 'Отсутствует tsconfig.json'
                });
                return;
            }

            // Проверяем основные настройки
            if (!this.configsAreEqual(currentConfig, expectedConfig.mainConfig)) {
                outdated.push({
                    package: packageInfo.name,
                    reason: 'Устаревшие compilerOptions'
                });
            }

            // Проверяем дополнительные конфиги
            for (const [filename, expectedAdditionalConfig] of Object.entries(expectedConfig.additionalConfigs)) {
                const additionalConfigPath = join(packageInfo.path, filename);
                const currentAdditionalConfig = FileUtils.readJson(additionalConfigPath);

                if (!currentAdditionalConfig) {
                    outdated.push({
                        package: packageInfo.name,
                        reason: `Отсутствует ${filename}`
                    });
                } else if (!this.configsAreEqual(currentAdditionalConfig, expectedAdditionalConfig)) {
                    outdated.push({
                        package: packageInfo.name,
                        reason: `Устаревшая конфигурация в ${filename}`
                    });
                }
            }
        });

        return outdated;
    }

    /**
     * Сравнивает две конфигурации (упрощенная проверка)
     */
    private configsAreEqual(config1: any, config2: any): boolean {
        const keys1 = Object.keys(config1 || {});
        const keys2 = Object.keys(config2 || {});

        if (keys1.length !== keys2.length) {
            return false;
        }

        // Проверяем только ключевые настройки
        const criticalKeys = ['target', 'module', 'strict', 'composite', 'outDir', 'rootDir'];

        for (const key of criticalKeys) {
            if (config1[key] !== config2[key]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Возвращает поддерживаемые сборщики
     */
    getSupportedBuilders(): BuilderType[] {
        return Array.from(this.builders.keys());
    }

    /**
     * Получает строитель для пакета
     */
    getBuilderForPackage(packageInfo: PackageInfo): BaseBuilder {
        const BuilderClass = this.builders.get(packageInfo.builder) || NodeBuilder;
        return new (BuilderClass as any)(packageInfo);
    }
}