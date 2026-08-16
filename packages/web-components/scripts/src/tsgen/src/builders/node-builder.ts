import { BaseBuilder } from './base-builder';
import type { BuilderConfig, TSConfig, PackageType, ModuleFormat } from '../types/config.types';
import {existsSync, readFileSync} from 'node:fs';
export class NodeBuilder extends BaseBuilder {
    readonly name = 'node';
    readonly supportedPackageTypes: PackageType[] = ['backend', 'node', 'library', 'shared'];

    generateConfig(): BuilderConfig {
        const packageJson = this.readPackageJsonSync();
        const moduleFormat = this.detectModuleFormat(packageJson);
        const isCLI = this.isCLIPackage(packageJson);
        const hasTesting = this.hasTestingFramework(packageJson);

        const mainConfig: TSConfig = {
            compilerOptions: {
                ...this.getBaseCompilerOptions(),
                // Специфичные для Node.js настройки
                types: ['node'],
                module: this.getModuleFormatForConfig(moduleFormat),
                moduleResolution: moduleFormat === 'esm' ? 'bundler' : 'node',
                target: 'ES2022',
                lib: ['ES2022'],
                // Node.js специфичные настройки
                esModuleInterop: moduleFormat === 'cjs',
                allowSyntheticDefaultImports: moduleFormat === 'cjs',
                // Оптимизации для Node.js
                skipLibCheck: true,
                // Настройки вывода
                outDir: './dist',
                rootDir: './src',
                // Source maps для дебаггинга
                sourceMap: true,
                declaration: true,
                declarationMap: true,
                // Дополнительные строгие проверки для Node.js
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                // Пути
                baseUrl: '.',
                paths: this.generatePaths()
            },
            include: this.getIncludePatterns(),
            exclude: this.getExcludePatterns(hasTesting),
            references: this.packageInfo.isComposite ? this.generateReferences() : []
        };

        const additionalConfigs: Record<string, TSConfig> = {};

        if (hasTesting) {
            additionalConfigs['tsconfig.test.json'] = this.generateTestConfig(moduleFormat);
        }

        if (isCLI) {
            additionalConfigs['tsconfig.cli.json'] = this.generateCLIConfig(moduleFormat);
        }

        return {
            mainConfig,
            additionalConfigs,
            packageJsonUpdates: this.generatePackageJsonUpdates(moduleFormat, isCLI)
        };
    }

    private readPackageJsonSync(): any {
        try {
            const packageJsonPath = `${this.packageInfo.path}/package.json`;
            if (existsSync(packageJsonPath)) {
                return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            }
        } catch {
            // Игнорируем ошибки чтения
        }
        return {};
    }

    private detectModuleFormat(packageJson: any): ModuleFormat {
        if (packageJson.type === 'module') {
            return 'esm';
        }
        if (packageJson.type === 'commonjs') {
            return 'cjs';
        }

        if (packageJson.exports) {
            if (packageJson.exports.import || packageJson.exports.default?.import) {
                return 'esm';
            }
            if (packageJson.exports.require || packageJson.exports.default?.require) {
                return 'cjs';
            }
        }

        if (packageJson.module && !packageJson.main) {
            return 'esm';
        }

        return 'esm';
    }

    private getModuleFormatForConfig(format: ModuleFormat): string {
        return format === 'esm' ? 'ESNext' : 'CommonJS';
    }

    private isCLIPackage(packageJson: any): boolean {
        return !!packageJson.bin ||
            packageJson.name?.includes('cli') ||
            packageJson.keywords?.includes('cli') ||
            packageJson.description?.toLowerCase().includes('command line');
    }

    private hasTestingFramework(packageJson: any): boolean {
        const devDeps = packageJson.devDependencies || {};
        return Object.keys(devDeps).some(dep =>
            dep.includes('jest') ||
            dep.includes('mocha') ||
            dep.includes('vitest') ||
            dep.includes('ava') ||
            dep.includes('tape')
        );
    }

    private generateTestConfig(moduleFormat: ModuleFormat): TSConfig {
        return {
            extends: './tsconfig.json',
            compilerOptions: {
                target: 'ES2022',
                module: this.getModuleFormatForConfig(moduleFormat),
                moduleResolution: moduleFormat === 'esm' ? 'bundler' : 'node',
                types: ['node', 'jest'],
                noUnusedLocals: false,
                noUnusedParameters: false,
                noImplicitReturns: false,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                strict: true,
                skipLibCheck: true,
                sourceMap: true,
                // Добавим обязательные поля
                noImplicitAny: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noFallthroughCasesInSwitch: true,
                useUnknownInCatchVariables: true
            },
            include: [
                'src/**/*.test.*',
                'src/**/*.spec.*',
                'test/**/*',
                'tests/**/*',
                '__tests__/**/*'
            ],
            exclude: [
                'node_modules',
                'dist'
            ]
        };
    }

    private generateCLIConfig(moduleFormat: ModuleFormat): TSConfig {
        return {
            extends: './tsconfig.json',
            compilerOptions: {
                target: 'ES2022',
                module: this.getModuleFormatForConfig(moduleFormat),
                moduleResolution: moduleFormat === 'esm' ? 'bundler' : 'node',
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                sourceMap: true,
                noUnusedParameters: false,
                allowJs: true,
                strict: true,
                skipLibCheck: true,
                types: ['node'],
                // Добавим обязательные поля
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noFallthroughCasesInSwitch: true,
                useUnknownInCatchVariables: true
            },
            include: [
                'src/cli/**/*',
                'src/bin/**/*',
                'src/**/*.cli.*'
            ]
        };
    }

    // Уберем override и сделаем совместимым с базовым классом
    protected override getIncludePatterns(): string[] {
        const patterns = ['src/**/*'];

        this.packageInfo.dependencies.forEach((dep: string) => {
            patterns.push(`../${dep}/src/**/*`);
        });

        patterns.push('*.js', '*.ts', 'bin/**/*');

        return patterns;
    }

    // Сделаем параметр опциональным для совместимости
    protected override getExcludePatterns(hasTesting?: boolean): string[] {
        const patterns = [
            'node_modules',
            'dist',
            'build',
            'coverage',
            '**/*.min.js'
        ];

        if (!hasTesting) {
            patterns.push('**/*.test.*', '**/*.spec.*');
        }

        return patterns;
    }

    private generatePackageJsonUpdates(moduleFormat: ModuleFormat, isCLI: boolean): any {
        const updates: any = {
            type: moduleFormat === 'esm' ? 'module' : 'commonjs',
            scripts: {
                'type-check': 'tsc --noEmit',
                'build': 'tsc',
                'build:watch': 'tsc --watch',
                'clean': 'rm -rf dist'
            }
        };

        if (this.hasTestingFramework(this.readPackageJsonSync())) {
            updates.scripts['test:type-check'] = 'tsc --project tsconfig.test.json --noEmit';
        }

        if (isCLI) {
            updates.scripts['build:cli'] = 'tsc --project tsconfig.cli.json';
        }

        if (moduleFormat === 'esm') {
            updates.exports = {
                '.': {
                    'import': './dist/index.js',
                    'types': './dist/index.d.ts'
                },
                './package.json': './package.json'
            };
        }

        return updates;
    }

    protected override generatePaths(): Record<string, string[]> {
        const paths = super.generatePaths();

        paths['@/*'] = ['./src/*'];
        paths['@utils/*'] = ['./src/utils/*'];
        paths['@types/*'] = ['./src/types/*'];

        if (this.isCLIPackage(this.readPackageJsonSync())) {
            paths['@cli/*'] = ['./src/cli/*'];
            paths['@commands/*'] = ['./src/commands/*'];
        }

        return paths;
    }

    protected override getBaseCompilerOptions() {
        const baseOptions = super.getBaseCompilerOptions();

        return {
            ...baseOptions,
            lib: ['ES2022'],
            target: 'ES2022',
            noUnusedLocals: true,
            noUnusedParameters: true,
            noImplicitReturns: true,
            sourceMap: true,
            declaration: true,
            declarationMap: true
        };
    }

    protected override getModuleFormat(): ModuleFormat {
        const packageJson = this.readPackageJsonSync();
        return this.detectModuleFormat(packageJson);
    }
}