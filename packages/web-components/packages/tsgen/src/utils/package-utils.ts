// /10/src/utils/package-utils.ts
import { FileUtils } from './file-utils';
import type { PackageJson, BuilderDetection, PackageType } from '../types/package.types';
import { join, basename } from 'path';

export class PackageUtils {
    static detectBuilder(packagePath: string): BuilderDetection {
        const packageJson = FileUtils.readJson<PackageJson>(join(packagePath, 'package.json'));
        const configFiles = FileUtils.findFiles(packagePath, /^(vite|webpack|esbuild|rollup|tsconfig)\.config\./);

        // Проверяем конфигурационные файлы с приоритетом
        for (const file of configFiles) {
            const filename = basename(file);
            if (filename.startsWith('vite.config.')) {
                return {
                    builder: 'vite',
                    configFiles: [filename],
                    packageDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [],
                    hasTypeScript: true
                } as BuilderDetection;
            }
            if (filename.startsWith('webpack.config.')) {
                return {
                    builder: 'webpack',
                    configFiles: [filename],
                    packageDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [],
                    hasTypeScript: true
                } as BuilderDetection;
            }
            if (filename.startsWith('esbuild.config.')) {
                return {
                    builder: 'esbuild',
                    configFiles: [filename],
                    packageDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [],
                    hasTypeScript: true
                } as BuilderDetection;
            }
        }

        // Проверяем зависимости в package.json
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
        const depNames = Object.keys(deps);

        // Приоритетная проверка зависимостей
        if (depNames.some(dep => dep.includes('vite') && !dep.includes('plugin'))) {
            return {
                builder: 'vite',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }
        if (depNames.some(dep => dep.includes('webpack') && !dep.includes('loader') && !dep.includes('plugin'))) {
            return {
                builder: 'webpack',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }
        if (depNames.some(dep => dep.includes('esbuild'))) {
            return {
                builder: 'esbuild',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }

        // Проверяем скрипты в package.json
        const scripts = packageJson?.scripts || {};
        const scriptContent = Object.values(scripts).join(' ');

        if (scriptContent.includes('vite')) {
            return {
                builder: 'vite',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }
        if (scriptContent.includes('webpack')) {
            return {
                builder: 'webpack',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }
        if (scriptContent.includes('esbuild')) {
            return {
                builder: 'esbuild',
                configFiles: [],
                packageDependencies: depNames,
                hasTypeScript: true
            } as BuilderDetection;
        }

        return {
            builder: 'unknown',
            configFiles: [],
            packageDependencies: depNames,
            hasTypeScript: true
        } as BuilderDetection;
    }

    static detectPackageType(packageName: string, packagePath: string): PackageType {
        const name = packageName.toLowerCase();
        const packageJson = FileUtils.readJson<PackageJson>(join(packagePath, 'package.json'));

        // Определяем по имени пакета с приоритетом
        if (name.includes('frontend') || name.includes('client') || name.includes('web') || name.includes('browser')) {
            return 'frontend';
        }
        if (name.includes('backend') || name.includes('server') || name.includes('api') || name.includes('node')) {
            return 'backend';
        }
        if (name.includes('shared') || name.includes('common') || name.includes('utils') || name.includes('lib')) {
            return 'shared';
        }
        if (name.includes('library') || name.includes('package') || name.includes('module')) {
            return 'library';
        }

        // Определяем по содержимому package.json
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
        const depNames = Object.keys(deps);

        if (depNames.some(dep =>
            dep.includes('react') ||
            dep.includes('vue') ||
            dep.includes('svelte') ||
            dep.includes('angular') ||
            dep.includes('solid')
        )) {
            return 'frontend';
        }

        if (depNames.some(dep =>
            dep.includes('express') ||
            dep.includes('fastify') ||
            dep.includes('koa') ||
            dep.includes('nestjs') ||
            dep.includes('socket.io')
        )) {
            return 'backend';
        }

        // По умолчанию для пакетов в папке packages/ считаем frontend
        // если нет явных указаний на backend
        return 'frontend';
    }

    static getExistingPackages(monorepoRoot: string): string[] {
        const packagesDir = join(monorepoRoot, 'packages');
        if (!FileUtils.exists(packagesDir)) {
            return [];
        }

        return FileUtils.getDirectories(packagesDir)
            .filter(pkg => {
                const pkgPath = join(packagesDir, pkg);
                const hasPackageJson = FileUtils.exists(join(pkgPath, 'package.json'));
                const hasSource = FileUtils.exists(join(pkgPath, 'src')) ||
                    FileUtils.findFiles(pkgPath, /\.[jt]sx?$/).length > 0;
                return hasPackageJson && hasSource;
            });
    }

    static fileExists(path: string): boolean {
        return FileUtils.exists(path);
    }

    static readJson<T>(path: string): T | null {
        return FileUtils.readJson<T>(path);
    }
}