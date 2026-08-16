export declare class DependencyManager {
    /**
     * Генерирует корневую конфигурацию TypeScript для монорепозитория
     */
    static generateRootConfig(monorepoRoot: string): void;
    /**
     * Генерирует paths для корневой конфигурации
     */
    private static generateRootPaths;
    /**
     * Проверяет целостность зависимостей между пакетами
     */
    static validateDependencies(monorepoRoot: string): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Обновляет зависимости в package.json пакетов на основе реальных связей
     */
    static updatePackageDependencies(monorepoRoot: string): void;
    /**
     * Проверяет, используется ли пакет в исходном коде
     */
    private static isPackageUsed;
    /**
     * Генерирует отчет о зависимостях между пакетами
     */
    static generateDependencyReport(monorepoRoot: string): void;
}
//# sourceMappingURL=dependency-manager.d.ts.map