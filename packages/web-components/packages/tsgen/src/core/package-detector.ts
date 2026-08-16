import { PackageUtils } from '../utils/package-utils';
import { FileUtils } from '../utils/file-utils';
import type { PackageInfo } from '../types/config.types';
import { join } from 'path';

export class PackageDetector {
    static detectPackageInfo(monorepoRoot: string, packageName: string): PackageInfo {
        const packagePath = join(monorepoRoot, 'packages', packageName);
        const builderDetection = PackageUtils.detectBuilder(packagePath);
        const packageType = PackageUtils.detectPackageType(packageName, packagePath);

        // Получаем существующие зависимости в монорепозитории
        const existingDependencies = this.getExistingDependencies(monorepoRoot, packageName);

        // Проверяем, должен ли пакет быть composite (имеет зависимости или является зависимостью)
        const isComposite = existingDependencies.length > 0 ||
            this.isDependencyOfOtherPackages(monorepoRoot, packageName);

        return {
            name: packageName,
            path: packagePath,
            type: packageType as any, // Приведение типа для совместимости
            builder: builderDetection.builder as any, // Приведение типа для совместимости
            hasSource: FileUtils.exists(join(packagePath, 'src')) ||
                FileUtils.findFiles(packagePath, /\.(ts|tsx)$/).length > 0,
            dependencies: existingDependencies,
            isComposite
        };
    }

    private static getExistingDependencies(monorepoRoot: string, packageName: string): string[] {
        const packagesDir = join(monorepoRoot, 'packages');
        const allPackages = PackageUtils.getExistingPackages(monorepoRoot);

        // Проверяем зависимости из package.json текущего пакета
        const packageJsonPath = join(packagesDir, packageName, 'package.json');
        const packageJson = FileUtils.readJson<{
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
        }>(packageJsonPath);

        if (!packageJson) {
            return [];
        }

        // Собираем все зависимости
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies
        };

        // Фильтруем только существующие пакеты в монорепозитории
        const dependencies = Object.keys(allDeps)
            .filter(dep => {
                // Поддерживаем форматы: @scope/name, name, ./path, ../path
                if (dep.startsWith('./') || dep.startsWith('../')) {
                    return false; // Игнорируем локальные пути
                }

                // Извлекаем имя пакета из scope (@scope/name -> name)
                const packageNameFromDep = dep.startsWith('@') ?
                    dep.split('/')[1] : dep;

                return allPackages.includes(packageNameFromDep!);
            })
            .map(dep => {
                // Нормализуем имя пакета (убираем scope для внутреннего использования)
                return dep.startsWith('@') ? dep.split('/')[1]! : dep;
            });

        return dependencies.filter((dep): dep is string => dep !== undefined);
    }

    private static isDependencyOfOtherPackages(monorepoRoot: string, packageName: string): boolean {
        const packagesDir = join(monorepoRoot, 'packages');
        const allPackages = PackageUtils.getExistingPackages(monorepoRoot);

        const scopedName = `@${packageName}`;

        return allPackages.some(otherPackage => {
            if (otherPackage === packageName) return false;

            const otherPackageJson = FileUtils.readJson<{
                dependencies?: Record<string, string>;
                devDependencies?: Record<string, string>;
                peerDependencies?: Record<string, string>;
            }>(join(packagesDir, otherPackage, 'package.json'));

            if (!otherPackageJson) return false;

            // Проверяем все типы зависимостей
            const allOtherDeps = {
                ...otherPackageJson.dependencies,
                ...otherPackageJson.devDependencies,
                ...otherPackageJson.peerDependencies
            };

            // Ищем зависимость от текущего пакета в разных форматах
            return Object.keys(allOtherDeps).some(dep => {
                if (dep === scopedName) return true;
                if (dep === packageName) return true;

                // Проверяем scope формат (@scope/name)
                if (dep.startsWith('@')) {
                    const depPackageName = dep.split('/')[1];
                    return depPackageName === packageName;
                }

                return false;
            });
        });
    }

    static detectAllPackages(monorepoRoot: string): PackageInfo[] {
        const packages = PackageUtils.getExistingPackages(monorepoRoot);
        return packages.map(pkg => this.detectPackageInfo(monorepoRoot, pkg));
    }

    static validatePackageStructure(packageInfo: PackageInfo): { isValid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Проверяем наличие package.json
        if (!FileUtils.exists(join(packageInfo.path, 'package.json'))) {
            issues.push('Отсутствует package.json');
        }

        // Проверяем наличие исходного кода
        if (!packageInfo.hasSource) {
            issues.push('Не найдены TypeScript файлы (расширения .ts/.tsx)');
        }

        // Проверяем корректность зависимостей
        packageInfo.dependencies.forEach(dep => {
            const depPath = join(packageInfo.path, '..', dep);
            if (!FileUtils.exists(depPath)) {
                issues.push(`Зависимость '${dep}' не существует в монорепозитории`);
            }
        });

        // Проверяем конфигурацию сборщика
        if (packageInfo.builder === 'unknown') {
            issues.push('Не удалось определить сборщик проекта');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}