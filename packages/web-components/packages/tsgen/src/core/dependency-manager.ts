import { FileUtils } from '../utils/file-utils';
import { PackageUtils } from '../utils/package-utils';
import { Logger } from '../utils/logger';
import { join } from 'path';
import type { TSConfig } from '../types/config.types';

export class DependencyManager {
    /**
     * Генерирует корневую конфигурацию TypeScript для монорепозитория
     */
    static generateRootConfig(monorepoRoot: string): void {
        const packages = PackageUtils.getExistingPackages(monorepoRoot);

        const rootConfig: TSConfig = {
            compilerOptions: {
                /* Базовые настройки */
                target: 'ES2022',
                lib: ['ES2022'],
                module: 'ESNext',
                moduleResolution: 'bundler',
                allowImportingTsExtensions: false,
                resolveJsonModule: true,
                allowJs: false,
                checkJs: false,

                /* Максимально строгие проверки */
                strict: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noFallthroughCasesInSwitch: true,
                noUncheckedSideEffectImports: true,
                useUnknownInCatchVariables: true,

                /* Дополнительные строгие проверки */
                noPropertyAccessFromIndexSignature: true,
                forceConsistentCasingInFileNames: true,

                /* Модули */
                isolatedModules: true,
                allowSyntheticDefaultImports: false,
                esModuleInterop: false,
                verbatimModuleSyntax: true,

                /* Output */
                declaration: false,
                declarationMap: false,
                sourceMap: false,
                removeComments: false,
                outDir: './dist',
                rootDir: './src',

                /* Project References */
                composite: true,
                incremental: true,

                /* Пути для монорепозитория */
                baseUrl: '.',
                paths: this.generateRootPaths(monorepoRoot, packages),

                /* Оптимизации */
                skipLibCheck: true,
                preserveWatchOutput: true
            },
            files: [],
            references: packages.map(pkg => ({ path: `./packages/${pkg}` })),
            include: [],
            exclude: [
                'node_modules',
                'dist',
                'build',
                'coverage',
                '**/*.test.*',
                '**/*.spec.*',
                'packages/*/dist/**/*',
                'packages/*/node_modules/**/*'
            ]
        };

        FileUtils.writeJson(join(monorepoRoot, 'tsconfig.json'), rootConfig);
        Logger.success(`Корневой tsconfig.json сгенерирован для ${packages.length} пакетов`);

        if (packages.length > 0) {
            Logger.info(`Пакеты в references: ${packages.join(', ')}`);
        }
    }

    /**
     * Генерирует paths для корневой конфигурации
     */
    private static generateRootPaths(monorepoRoot: string, packages: string[]): Record<string, string[]> {
        const paths: Record<string, string[]> = {};

        packages.forEach(pkg => {
            const packagePath = join(monorepoRoot, 'packages', pkg);
            const packageJson = FileUtils.readJson<{ name?: string }>(join(packagePath, 'package.json'));

            // Используем имя из package.json или создаем scoped имя
            const packageName = packageJson?.name || `@${pkg}`;

            // Добавляем основные пути
            paths[packageName] = [`./packages/${pkg}/src`];
            paths[`${packageName}/*`] = [`./packages/${pkg}/src/*`];

            // Добавляем альтернативные пути для удобства
            paths[`@${pkg}`] = [`./packages/${pkg}/src`];
            paths[`@${pkg}/*`] = [`./packages/${pkg}/src/*`];
        });

        // Добавляем общие алиасы
        paths['@/*'] = ['./src/*'];
        paths['@builders/*'] = ['./src/builders/*'];
        paths['@core/*'] = ['./src/core/*'];
        paths['@types/*'] = ['./src/types/*'];
        paths['@utils/*'] = ['./src/utils/*'];

        Logger.debug(`Сгенерировано paths для ${Object.keys(paths).length} алиасов`);
        return paths;
    }

    /**
     * Проверяет целостность зависимостей между пакетами
     */
    static validateDependencies(monorepoRoot: string): { valid: boolean; issues: string[] } {
        const packages = PackageUtils.getExistingPackages(monorepoRoot);
        const issues: string[] = [];

        packages.forEach(pkg => {
            const packagePath = join(monorepoRoot, 'packages', pkg);
            const packageJson = FileUtils.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
                join(packagePath, 'package.json')
            );

            const allDeps = {
                ...packageJson?.dependencies,
                ...packageJson?.devDependencies
            };

            // Проверяем зависимости на существование в монорепозитории
            Object.keys(allDeps).forEach(dep => {
                if (dep.startsWith('@') && !dep.includes('/')) {
                    // Scoped package без имени - потенциальная ошибка
                    issues.push(`Пакет ${pkg}: неверный формат зависимости "${dep}"`);
                } else if (dep.startsWith('@')) {
                    // Scoped package - проверяем существование
                    const depName = dep.split('/')[1];
                    if (depName && !packages.includes(depName)) {
                        issues.push(`Пакет ${pkg}: зависимость "${dep}" не найдена в монорепозитории`);
                    }
                }
            });

            // Проверяем tsconfig.json на корректность references
            const tsconfigPath = join(packagePath, 'tsconfig.json');
            if (FileUtils.exists(tsconfigPath)) {
                const tsconfig = FileUtils.readJson<{ references?: Array<{ path: string }> }>(tsconfigPath);

                tsconfig?.references?.forEach(ref => {
                    const refPath = ref.path.replace(/^\.\.\//, '');
                    if (!packages.includes(refPath)) {
                        issues.push(`Пакет ${pkg}: reference на несуществующий пакет "${ref.path}"`);
                    }
                });
            }
        });

        const valid = issues.length === 0;

        if (valid) {
            Logger.success('Все зависимости валидны');
        } else {
            Logger.warn(`Найдено проблем с зависимостями: ${issues.length}`);
            issues.forEach(issue => Logger.warn(`  • ${issue}`));
        }

        return { valid, issues };
    }

    /**
     * Обновляет зависимости в package.json пакетов на основе реальных связей
     */
    static updatePackageDependencies(monorepoRoot: string): void {
        const packages = PackageUtils.getExistingPackages(monorepoRoot);
        let updatedCount = 0;

        packages.forEach(pkg => {
            const packagePath = join(monorepoRoot, 'packages', pkg);
            const packageJsonPath = join(packagePath, 'package.json');
            const packageJson = FileUtils.readJson<{ dependencies?: Record<string, string> }>(packageJsonPath);

            if (!packageJson) return;

            const existingDeps = packageJson.dependencies || {};
            const updatedDeps: Record<string, string> = { ...existingDeps };

            // Добавляем недостающие зависимости из монорепозитория
            packages.forEach(depPkg => {
                if (depPkg === pkg) return;

                const scopedName = `@${depPkg}`;

                // Проверяем, используется ли этот пакет в исходном коде
                if (this.isPackageUsed(packagePath, depPkg) && !existingDeps[scopedName]) {
                    updatedDeps[scopedName] = 'workspace:*';
                    Logger.debug(`Добавлена зависимость: ${pkg} -> ${scopedName}`);
                }
            });

            // Удаляем зависимости на несуществующие пакеты
            Object.keys(updatedDeps).forEach(dep => {
                if (dep.startsWith('@')) {
                    const depName = dep.split('/')[1];
                    if (depName && !packages.includes(depName) && depName !== pkg) {
                        delete updatedDeps[dep];
                        Logger.debug(`Удалена зависимость: ${pkg} -> ${dep} (пакет не существует)`);
                    }
                }
            });

            // Если зависимости изменились, обновляем package.json
            if (JSON.stringify(existingDeps) !== JSON.stringify(updatedDeps)) {
                const updatedPackageJson = {
                    ...packageJson,
                    dependencies: updatedDeps
                };
                FileUtils.writeJson(packageJsonPath, updatedPackageJson);
                updatedCount++;
                Logger.info(`Обновлены зависимости для пакета: ${pkg}`);
            }
        });

        if (updatedCount > 0) {
            Logger.success(`Обновлены зависимости для ${updatedCount} пакетов`);
        } else {
            Logger.info('Зависимости уже актуальны');
        }
    }

    /**
     * Проверяет, используется ли пакет в исходном коде
     */
    private static isPackageUsed(packagePath: string, depPkg: string): boolean {
        const srcPath = join(packagePath, 'src');

        if (!FileUtils.exists(srcPath)) {
            return false;
        }

        // Ищем импорты этого пакета в TypeScript/JavaScript файлах
        const tsFiles = FileUtils.findFiles(srcPath, /\.(ts|tsx|js|jsx)$/);

        for (const file of tsFiles) {
            const content = FileUtils.readFile(file);
            const importPatterns = [
                new RegExp(`from\\s+['"]@${depPkg}['"]`),
                new RegExp(`import\\s+['"]@${depPkg}['"]`),
                new RegExp(`require\\s*\\(\\s*['"]@${depPkg}['"]\\)`)
            ];

            if (importPatterns.some(pattern => pattern.test(content))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Генерирует отчет о зависимостях между пакетами
     */
    static generateDependencyReport(monorepoRoot: string): void {
        const packages = PackageUtils.getExistingPackages(monorepoRoot);
        const report: Record<string, { dependencies: string[]; dependents: string[] }> = {};

        // Инициализируем отчет
        packages.forEach(pkg => {
            report[pkg] = { dependencies: [], dependents: [] };
        });

        // Заполняем зависимости
        packages.forEach(pkg => {
            const packagePath = join(monorepoRoot, 'packages', pkg);
            const packageJson = FileUtils.readJson<{ dependencies?: Record<string, string> }>(
                join(packagePath, 'package.json')
            );

            Object.keys(packageJson?.dependencies || {}).forEach(dep => {
                if (dep.startsWith('@')) {
                    const depName = dep.split('/')[1];
                    if (depName && packages.includes(depName)) {
                        const pkgReport = report[pkg];
                        const depReport = report[depName];
                        if (pkgReport && depReport) {
                            pkgReport.dependencies.push(depName);
                            depReport.dependents.push(pkg);
                        }
                    }
                }
            });
        });

        // Выводим отчет
        Logger.info('Отчет о зависимостях между пакетами:');
        packages.forEach(pkg => {
            const pkgReport = report[pkg];
            if (pkgReport) {
                const { dependencies, dependents } = pkgReport;

                if (dependencies.length > 0 || dependents.length > 0) {
                    Logger.info(`  📦 ${pkg}:`);
                    if (dependencies.length > 0) {
                        Logger.info(`    → Зависит от: ${dependencies.join(', ')}`);
                    }
                    if (dependents.length > 0) {
                        Logger.info(`    ← Зависят от: ${dependents.join(', ')}`);
                    }
                }
            }
        });

        // Статистика
        const packagesWithDeps = packages.filter(pkg => {
            const pkgReport = report[pkg];
            return pkgReport && pkgReport.dependencies.length > 0;
        });
        const packagesAsDeps = packages.filter(pkg => {
            const pkgReport = report[pkg];
            return pkgReport && pkgReport.dependents.length > 0;
        });

        Logger.info(`Статистика: ${packagesWithDeps.length} пакетов имеют зависимости, ${packagesAsDeps.length} пакетов используются как зависимости`);
    }
}