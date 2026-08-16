import { BaseBuilder } from './base-builder';
import type { BuilderConfig, TSConfig, PackageType } from '../types/config.types';

export class EsbuildBuilder extends BaseBuilder {
    readonly name = 'esbuild';
    readonly supportedPackageTypes: PackageType[] = [
        'frontend',
        'backend',
        'library',
        'shared',
        'node',
        'browser',
        'react',
        'vue',
        'svelte',
        'angular',
        'cli',
        'api',
        'microservice'
    ];

    generateConfig(): BuilderConfig {
        const isBrowser = [
            'frontend',
            'browser',
            'react',
            'vue',
            'svelte',
            'angular'
        ].includes(this.packageInfo.type);

        const isNode = [
            'backend',
            'node',
            'api',
            'microservice',
            'cli'
        ].includes(this.packageInfo.type);

        // Получаем базовые опции и явно задаем lib
        const baseCompilerOptions = {
            ...this.getBaseCompilerOptions(),
            lib: isBrowser ? ['ES2022', 'DOM', 'DOM.Iterable'] : ['ES2022']
        };

        const compilerOptions: TSConfig['compilerOptions'] = {
            ...baseCompilerOptions,
            // Esbuild специфичные настройки
            module: 'ESNext',
            moduleResolution: 'bundler',
            target: 'ES2022',
            // Esbuild хорошо работает с strict режимом
            strict: true,
            // Для лучшей совместимости с Esbuild
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            // Esbuild требует isolatedModules для инкрементальной сборки
            isolatedModules: true,
            // Настройки для разных типов пакетов
            types: isNode ? ['node'] : undefined,
            // Оптимизации для Esbuild
            preserveWatchOutput: true,
            // Esbuild не требует declarationMap для быстрой сборки
            declarationMap: false,
            // Source maps для отладки
            sourceMap: true,
            // JSX поддержка для React пакетов - явно указываем или undefined
            jsx: this.packageInfo.type === 'react' ? 'preserve' : undefined
        };

        const mainConfig: TSConfig = {
            compilerOptions,
            include: this.getIncludePatterns(),
            exclude: [...this.getExcludePatterns(), '**/*.config.*'],
            references: this.packageInfo.isComposite ? this.generateReferences() : []
        };

        // Дополнительная конфигурация для Esbuild конфиг файлов
        const esbuildConfig: TSConfig = {
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'node',
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                strict: true,
                skipLibCheck: true,
                types: ['node'],
                outDir: './dist',
                rootDir: '.',
                // Добавляем обязательные поля
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noFallthroughCasesInSwitch: true,
                useUnknownInCatchVariables: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                allowJs: false,
                checkJs: false,
                composite: false,
                incremental: false,
                // Явно указываем lib для конфига
                lib: ['ES2022']
            },
            include: ['esbuild.config.*'],
            exclude: ['src/**/*', 'node_modules', 'dist']
        };

        const packageJsonUpdates = {
            type: 'module' as const,
            scripts: {
                'build': this.generateBuildScript(isBrowser, this.packageInfo.type),
                'build:watch': this.generateWatchScript(isBrowser, this.packageInfo.type),
                'type-check': 'tsc --noEmit',
                'dev': 'npm run build:watch'
            },
            // Добавляем зависимости Esbuild если их нет
            devDependencies: {
                'esbuild': '^0.19.0'
            }
        };

        return {
            mainConfig,
            additionalConfigs: {
                'tsconfig.esbuild.json': esbuildConfig
            },
            packageJsonUpdates
        };
    }

    private generateBuildScript(isBrowser: boolean, packageType: PackageType): string {
        const platform = isBrowser ? 'browser' : 'node';

        if (packageType === 'library') {
            return 'esbuild src/index.ts --bundle --outdir=dist --format=esm --external:*/';
        }

        return `esbuild src/index.ts --bundle --outdir=dist --platform=${platform}`;
    }

    private generateWatchScript(isBrowser: boolean, packageType: PackageType): string {
        const platform = isBrowser ? 'browser' : 'node';

        if (packageType === 'library') {
            return 'esbuild src/index.ts --bundle --outdir=dist --format=esm --external:*/ --watch';
        }

        return `esbuild src/index.ts --bundle --outdir=dist --platform=${platform} --watch`;
    }

    protected override getIncludePatterns(): string[] {
        const patterns = ['src/**/*', '**/*.d.ts'];

        // Добавляем зависимости из монорепозитория
        this.packageInfo.dependencies.forEach((dep: string) => {
            patterns.push(`../${dep}/src/**/*`);
        });

        // Добавляем специфичные для типов пакетов пути
        if (this.packageInfo.type === 'react') {
            patterns.push('**/*.tsx', '**/*.jsx');
        }

        if (this.packageInfo.type === 'vue') {
            patterns.push('**/*.vue');
        }

        return patterns;
    }

    protected override getExcludePatterns(): string[] {
        return [
            'node_modules',
            'dist',
            'build',
            'coverage',
            '**/*.test.*',
            '**/*.spec.*',
            '**/__tests__/**',
            '**/__mocks__/**'
        ];
    }

    protected override getBaseCompilerOptions() {
        const baseOptions = super.getBaseCompilerOptions();

        // Esbuild-specific optimizations
        return {
            ...baseOptions,
            // Esbuild works best with these settings
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            // Better source map support
            sourceMap: true,
            // For faster builds with esbuild
            declarationMap: false
        };
    }
}