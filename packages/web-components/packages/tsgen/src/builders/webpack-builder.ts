import type { BuilderConfig, TSConfig, PackageType } from '../types/config.types';
import { BaseBuilder } from './base-builder';

export class WebpackBuilder extends BaseBuilder {
    readonly name = 'webpack';
    readonly supportedPackageTypes: PackageType[] = ['frontend', 'library', 'shared'];

    generateConfig(): BuilderConfig {
        const isFrontend = this.packageInfo.type === 'frontend';
        const isLibrary = this.packageInfo.type === 'library';

        // Создаем базовые опции без jsx
        const baseCompilerOptions = this.getBaseCompilerOptions();

        // Добавляем jsx только если это фронтенд
        const compilerOptions: TSConfig['compilerOptions'] = {
            ...baseCompilerOptions,
            // Webpack-specific optimizations
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            // Frontend-specific settings - добавляем jsx только если нужно
            ...(isFrontend && { jsx: 'preserve' as const }),
            lib: isFrontend ? ['ES2022', 'DOM', 'DOM.Iterable'] : ['ES2022'],
            // Library-specific settings
            declaration: isLibrary,
            declarationMap: isLibrary,
            // Module settings optimized for Webpack
            module: 'ESNext',
            moduleResolution: 'bundler',
            // Source maps for better debugging
            sourceMap: true,
            inlineSources: true,
            // Paths for monorepo dependencies
            paths: this.generatePaths()
        };

        const mainConfig: TSConfig = {
            compilerOptions,
            include: [
                ...this.getIncludePatterns(),
                'webpack.config.ts',
                'webpack.config.*.ts',
                'config/**/*.ts'
            ],
            exclude: [
                ...this.getExcludePatterns(),
                'webpack.config.*.js', // Exclude JS config files
                'dist/**/*',
                'build/**/*'
            ],
            references: this.packageInfo.isComposite ? this.generateReferences() : []
        };

        // Additional configuration for development
        const devConfig: TSConfig = {
            extends: './tsconfig.json',
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'bundler',
                strict: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noImplicitOverride: true,
                noUncheckedIndexedAccess: true,
                exactOptionalPropertyTypes: true,
                noUnusedLocals: false,
                noUnusedParameters: false,
                noFallthroughCasesInSwitch: true,
                useUnknownInCatchVariables: true,
                isolatedModules: true,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                noUncheckedSideEffectImports: true,
                noPropertyAccessFromIndexSignature: true,
                forceConsistentCasingInFileNames: true,
                skipLibCheck: true,
                declaration: false,
                declarationMap: false,
                sourceMap: true,
                removeComments: false,
                outDir: './dist',
                rootDir: './src',
                composite: true,
                incremental: true,
                baseUrl: '.',
                paths: this.generatePaths(),
                noEmit: false,
                preserveWatchOutput: true,
                inlineSources: true,
                tsBuildInfoFile: './node_modules/.cache/tsconfig.dev.tsbuildinfo'
            },
            include: [
                'src/**/*',
                'test/**/*',
                '**/*.test.ts',
                '**/*.spec.ts'
            ]
        };

        const additionalConfigs: Record<string, TSConfig> = {
            'tsconfig.dev.json': devConfig
        };

        // Add build-specific config for production
        if (isLibrary) {
            additionalConfigs['tsconfig.build.json'] = {
                extends: './tsconfig.json',
                compilerOptions: {
                    target: 'ES2022',
                    module: 'ESNext',
                    moduleResolution: 'bundler',
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
                    allowSyntheticDefaultImports: true,
                    esModuleInterop: true,
                    noUncheckedSideEffectImports: true,
                    noPropertyAccessFromIndexSignature: true,
                    forceConsistentCasingInFileNames: true,
                    skipLibCheck: true,
                    declaration: true,
                    declarationMap: true,
                    sourceMap: true,
                    removeComments: false,
                    outDir: './dist',
                    rootDir: './src',
                    composite: true,
                    incremental: false,
                    baseUrl: '.',
                    paths: this.generatePaths(),
                    noEmit: false,
                    preserveWatchOutput: true,
                    inlineSources: true
                },
                exclude: [
                    '**/*.test.*',
                    '**/*.spec.*',
                    'test/**/*',
                    '**/__tests__/**'
                ]
            };
        }

        const packageJsonUpdates: Record<string, any> = {
            scripts: {
                'type-check': 'tsc --noEmit',
                'type-check:dev': 'tsc --project tsconfig.dev.json --noEmit',
                'build:types': isLibrary ? 'tsc --project tsconfig.build.json --emitDeclarationOnly' : 'echo "No type building needed"'
            }
        };

        // Add specific dependencies based on package type
        if (isFrontend) {
            packageJsonUpdates['devDependencies'] = {
                '@types/webpack-env': '^1.18.0',
                ...packageJsonUpdates['devDependencies']
            };
        }

        if (isLibrary) {
            packageJsonUpdates['types'] = './dist/index.d.ts';
            packageJsonUpdates['main'] = './dist/index.js';
            packageJsonUpdates['module'] = './dist/index.esm.js';
        }

        return {
            mainConfig,
            additionalConfigs,
            packageJsonUpdates
        };
    }

    protected override getBaseCompilerOptions() {
        const baseOptions = super.getBaseCompilerOptions();

        // Webpack-specific adjustments
        return {
            ...baseOptions,
            // Webpack handles module resolution differently
            moduleResolution: 'bundler',
            // Allow synthetic defaults for better compatibility
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            // Better source map support
            sourceMap: true,
            inlineSources: true,
            // Paths resolution
            preserveSymlinks: false
        };
    }

    protected override getIncludePatterns(): string[] {
        const patterns = super.getIncludePatterns();

        // Webpack-specific include patterns
        patterns.push(
            'webpack.config.*',
            'config/**/*.ts',
            'config/**/*.tsx',
            '**/*.webpack.ts',
            '**/*.webpack.tsx'
        );

        // Add environment-specific files
        if (this.packageInfo.type === 'frontend') {
            patterns.push(
                '**/*.env*.ts',
                '**/environments/**/*.ts'
            );
        }

        return patterns;
    }

    protected override getExcludePatterns(): string[] {
        const patterns = super.getExcludePatterns();

        // Webpack-specific exclusions
        patterns.push(
            '**/webpack.config.*.js',
            '**/dist/**/*',
            '**/build/**/*',
            '**/.webpack/**/*',
            '**/node_modules/.cache/**/*'
        );

        return patterns;
    }
}