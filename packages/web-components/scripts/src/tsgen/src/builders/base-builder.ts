import type { TSConfig, BuilderConfig, PackageType, BuilderType, ModuleFormat } from '../types/config.types';
import type { PackageInfo } from '../types/package.types';


export abstract class BaseBuilder {
    abstract readonly name: BuilderType;
    abstract readonly supportedPackageTypes: PackageType[];

    constructor(protected packageInfo: PackageInfo) {}

    abstract generateConfig(): BuilderConfig;

    protected getBaseCompilerOptions(): TSConfig['compilerOptions'] {
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

        const isLibrary = [
            'library',
            'shared'
        ].includes(this.packageInfo.type);

        // Базовые настройки для всех пакетов
        const baseOptions: TSConfig['compilerOptions'] = {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            allowJs: false,
            checkJs: false,
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
            useUnknownInCatchVariables: true,
            isolatedModules: true,
            allowSyntheticDefaultImports: false,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: false,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            outDir: './dist',
            rootDir: './src',
            composite: this.packageInfo.isComposite,
            incremental: true,
            baseUrl: '.',
            paths: this.generatePaths()
        };

        // Специфичные настройки для разных типов пакетов
        if (isBrowser) {
            baseOptions.lib = ['ES2022', 'DOM', 'DOM.Iterable'];
            baseOptions.types = ['vite/client', 'node'];
        } else if (isNode) {
            baseOptions.lib = ['ES2022'];
            baseOptions.types = ['node'];
        } else if (isLibrary) {
            baseOptions.lib = ['ES2022'];
            baseOptions.declaration = true;
            baseOptions.declarationMap = true;
        }

        // Дополнительные настройки для composite пакетов
        if (this.packageInfo.isComposite) {
            baseOptions.declaration = true;
            baseOptions.declarationMap = true;
        }

        return baseOptions;
    }

    // Сделаем методы protected вместо private
    protected generatePaths(): Record<string, string[]> {
        const paths: Record<string, string[]> = {
            '@/*': ['./src/*'],
            '~/*': ['./src/*']
        };

        // Добавляем пути к зависимостям в монорепозитории
        this.packageInfo.dependencies.forEach((dep: string) => {
            const scopedName = `@${dep}`;
            paths[scopedName] = [`../${dep}/src`];
            paths[`${scopedName}/*`] = [`../${dep}/src/*`];

            // Альтернативные алиасы для удобства
            paths[`${dep}/*`] = [`../${dep}/src/*`];
        });

        return paths;
    }

    protected getIncludePatterns(): string[] {
        const patterns = ['src/**/*'];

        // Добавляем зависимости из монорепозитория в include для composite проектов
        if (this.packageInfo.isComposite && this.packageInfo.dependencies.length > 0) {
            this.packageInfo.dependencies.forEach((dep: string) => {
                patterns.push(`../${dep}/src/**/*`);
            });
        }

        return patterns;
    }

    protected getExcludePatterns(): string[] {
        const patterns = [
            'node_modules',
            'dist',
            'build',
            'coverage',
            '**/*.test.*',
            '**/*.spec.*',
            '**/__tests__/**',
            '**/__mocks__/**',
            '**/*.min.js'
        ];

        // Для composite проектов исключаем node_modules зависимостей
        if (this.packageInfo.isComposite) {
            this.packageInfo.dependencies.forEach((dep: string) => {
                patterns.push(`../${dep}/node_modules`);
                patterns.push(`../${dep}/dist`);
                patterns.push(`../${dep}/build`);
            });
        }

        return patterns;
    }

    protected generateReferences(): Array<{ path: string }> {
        return this.packageInfo.dependencies.map((dep: string) => ({
            path: `../${dep}`
        }));
    }

    protected shouldUseComposite(): boolean {
        // Используем composite если:
        // 1. Пакет явно помечен как composite
        // 2. Пакет имеет зависимости в монорепозитории
        // 3. Пакет является библиотекой
        return this.packageInfo.isComposite ||
            this.packageInfo.dependencies.length > 0 ||
            this.packageInfo.type === 'library' ||
            this.packageInfo.type === 'shared';
    }

    protected getModuleFormat(): ModuleFormat {
        // Определяем формат модуля на основе типа пакета и сборщика
        const isFrontend = this.packageInfo.type === 'frontend';
        const isBackend = this.packageInfo.type === 'backend';

        if (isFrontend || this.name === 'vite' || this.name === 'esbuild') {
            return 'esm';
        }

        if (isBackend || this.name === 'node') {
            return 'esm'; // Современные Node.js проекты используют ESM
        }

        return 'esm'; // По умолчанию ESM
    }

    protected getPackageJsonUpdates(): Record<string, unknown> {
        const moduleFormat = this.getModuleFormat();
        const isLibrary = this.packageInfo.type === 'library' || this.packageInfo.type === 'shared';

        const updates: Record<string, unknown> = {
            scripts: {
                'type-check': 'tsc --noEmit',
                'build:types': 'tsc --emitDeclarationOnly',
                clean: 'rm -rf dist'
            }
        };

        // Настройки для библиотек
        if (isLibrary) {
            updates['type'] = moduleFormat;
            updates['main'] = './dist/index.js';
            updates['types'] = './dist/index.d.ts';
            updates['exports'] = {
                '.': {
                    types: './dist/index.d.ts',
                    import: './dist/index.js',
                    require: './dist/index.cjs'
                }
            };
        }

        // Настройки для ESM пакетов
        if (moduleFormat === 'esm') {
            updates['type'] = 'module';
        }

        return updates;
    }

    isSupported(): boolean {
        return this.supportedPackageTypes.includes(this.packageInfo.type);
    }

    getPackageInfo(): PackageInfo {
        return this.packageInfo;
    }
}