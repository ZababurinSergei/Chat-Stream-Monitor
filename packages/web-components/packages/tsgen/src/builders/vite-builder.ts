import type { BuilderConfig, TSConfig, PackageType } from '../types/config.types';
import { BaseBuilder } from './base-builder';

export class ViteBuilder extends BaseBuilder {
    readonly name = 'vite';
    readonly supportedPackageTypes: PackageType[] = ['frontend', 'library'];

    generateConfig(): BuilderConfig {
        const mainConfig: TSConfig = {
            compilerOptions: {
                ...this.getBaseCompilerOptions(),
                // Специфичные для Vite настройки
                jsx: 'preserve' as const,
                types: ['vite/client'],
                // Vite требует эти настройки для JSX и горячей перезагрузки
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                // Оптимизации для разработки с Vite
                preserveWatchOutput: true,
                noEmit: true
            },
            include: [
                ...this.getIncludePatterns(),
                'vite.config.ts',
                'src/**/*.d.ts',
                '**/*.ts',
                '**/*.tsx',
                '**/*.jsx'
            ],
            exclude: [
                ...this.getExcludePatterns(),
                'dist/**/*',
                '**/dist/**/*'
            ],
            references: this.packageInfo.isComposite ? this.generateReferences() : []
        };

        // Дополнительная конфигурация для Node.js частей Vite (vite.config.ts)
        const nodeConfig: TSConfig = {
            compilerOptions: {
                composite: true,
                skipLibCheck: true,
                module: 'ESNext',
                target: 'ES2022',
                moduleResolution: 'bundler',
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
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
                outDir: './dist',
                rootDir: '.',
                types: ['node'],
                // Для vite.config.ts не нужны декларации
                declaration: false,
                declarationMap: false,
                // Source maps для конфига
                sourceMap: true,
                // Разрешаем JSON для конфигураций
                resolveJsonModule: true
            },
            include: [
                'vite.config.ts',
                'vite.config.*.ts',
                'plugins/**/*.ts',
                'config/**/*.ts'
            ],
            exclude: [
                'src/**/*',
                'node_modules',
                'dist'
            ]
        };

        // Конфигурация для тестов (если используется Vitest)
        const vitestConfig: TSConfig = {
            compilerOptions: {
                composite: true,
                skipLibCheck: true,
                module: 'ESNext',
                target: 'ES2022',
                moduleResolution: 'bundler',
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                strict: true,
                jsx: 'preserve' as const,
                types: ['vite/client', 'vitest'],
                outDir: './dist',
                rootDir: '.',
                declaration: false,
                sourceMap: true,
                resolveJsonModule: true,
                // Добавим обязательные поля
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noFallthroughCasesInSwitch: true,
                useUnknownInCatchVariables: true
            },
            include: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/**/*.test.tsx',
                'src/**/*.spec.tsx',
                'test/**/*.ts',
                'test/**/*.tsx',
                '**/*.d.ts',
                'vitest.config.ts'
            ],
            exclude: [
                'node_modules',
                'dist'
            ]
        };

        const additionalConfigs: Record<string, TSConfig> = {
            'tsconfig.node.json': nodeConfig
        };

        // Добавляем конфиг для Vitest только если он обнаружен
        if (this.hasVitest()) {
            additionalConfigs['tsconfig.vitest.json'] = vitestConfig;
        }

        return {
            mainConfig,
            additionalConfigs,
            packageJsonUpdates: {
                scripts: {
                    'type-check': 'tsc --noEmit',
                    'type-check:node': 'tsc --project tsconfig.node.json --noEmit',
                    'type-check:vitest': this.hasVitest() ? 'tsc --project tsconfig.vitest.json --noEmit' : '',
                    'build:types': 'tsc --emitDeclarationOnly',
                    'dev': 'vite',
                    'build': 'vite build',
                    'preview': 'vite preview'
                },
                // Рекомендуемые зависимости для Vite проектов
                devDependencies: {
                    ...this.getRecommendedDevDependencies()
                }
            }
        };
    }

    private hasVitest(): boolean {
        const packageJsonPath = `${this.packageInfo.path}/package.json`;
        const packageJson = this.readPackageJson(packageJsonPath);

        const allDeps = {
            ...packageJson?.dependencies,
            ...packageJson?.devDependencies
        };

        return Object.keys(allDeps).some(dep =>
            dep.includes('vitest') || dep.includes('@vitest')
        );
    }

    private getRecommendedDevDependencies(): Record<string, string> {
        const isReact = this.packageInfo.type === 'frontend' && this.hasReact();
        const isVue = this.packageInfo.type === 'frontend' && this.hasVue();

        const baseDeps = {
            'vite': '^5.0.0',
            'typescript': '^5.3.0'
        };

        if (isReact) {
            return {
                ...baseDeps,
                '@vitejs/plugin-react': '^4.0.0',
                '@types/react': '^18.0.0',
                '@types/react-dom': '^18.0.0'
            };
        }

        if (isVue) {
            return {
                ...baseDeps,
                '@vitejs/plugin-vue': '^4.0.0',
                'vue-tsc': '^1.0.0'
            };
        }

        return baseDeps;
    }

    private hasReact(): boolean {
        const packageJsonPath = `${this.packageInfo.path}/package.json`;
        const packageJson = this.readPackageJson(packageJsonPath);

        const allDeps = {
            ...packageJson?.dependencies,
            ...packageJson?.devDependencies
        };

        return Object.keys(allDeps).some(dep =>
            dep.includes('react') && !dep.includes('react-native')
        );
    }

    private hasVue(): boolean {
        const packageJsonPath = `${this.packageInfo.path}/package.json`;
        const packageJson = this.readPackageJson(packageJsonPath);

        const allDeps = {
            ...packageJson?.dependencies,
            ...packageJson?.devDependencies
        };

        return Object.keys(allDeps).some(dep => dep.includes('vue'));
    }

    private readPackageJson(path: string): any {
        try {
            const fs = require('fs');
            if (fs.existsSync(path)) {
                return JSON.parse(fs.readFileSync(path, 'utf-8'));
            }
        } catch {
            // Игнорируем ошибки чтения
        }
        return null;
    }

    protected override getBaseCompilerOptions() {
        const baseOptions = super.getBaseCompilerOptions();

        // Vite-specific overrides
        return {
            ...baseOptions,
            // Vite работает лучше с этими настройками
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            // Для лучшей поддержки HMR
            isolatedModules: true,
            // Vite сам занимается сборкой, нам нужны только типы
            noEmit: true,
            // JSX поддержка
            jsx: this.getJsxPreset() as any
        };
    }

    private getJsxPreset(): string {
        if (this.hasReact()) {
            return 'react-jsx';
        }
        if (this.hasVue()) {
            return 'preserve';
        }
        return 'preserve';
    }

    protected override getIncludePatterns(): string[] {
        const patterns = super.getIncludePatterns();

        // Добавляем специфичные для Vite пути
        patterns.push('env.d.ts');
        patterns.push('src/**/*.vue');

        return patterns;
    }
}