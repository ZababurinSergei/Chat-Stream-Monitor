import type { BaseBuilder } from '../builders/base-builder';
import type { PackageInfo, BuilderType } from '../types/config.types';
export declare class ConfigGenerator {
    private builders;
    constructor();
    private registerBuilders;
    generateForPackage(packageInfo: PackageInfo): boolean;
    private generateWithBuilder;
    private determineFallbackBuilder;
    private writeConfig;
    private updatePackageJson;
    private deepMerge;
    /**
     * Генерирует конфигурации для всех пакетов в монорепозитории
     */
    generateForAllPackages(packages: PackageInfo[]): {
        success: number;
        total: number;
    };
    /**
     * Проверяет существующие конфигурации и возвращает список устаревших
     */
    checkOutdatedConfigs(packages: PackageInfo[]): Array<{
        package: string;
        reason: string;
    }>;
    /**
     * Сравнивает две конфигурации (упрощенная проверка)
     */
    private configsAreEqual;
    /**
     * Возвращает поддерживаемые сборщики
     */
    getSupportedBuilders(): BuilderType[];
    /**
     * Получает строитель для пакета
     */
    getBuilderForPackage(packageInfo: PackageInfo): BaseBuilder;
}
//# sourceMappingURL=config-generator.d.ts.map