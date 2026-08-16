export type PackageType = 'frontend' | 'backend' | 'shared' | 'library' | 'node' | 'browser' | 'react' | 'vue' | 'svelte' | 'angular' | 'cli' | 'api' | 'microservice';
export type BuilderType = 'vite' | 'webpack' | 'esbuild' | 'rollup' | 'rspack' | 'parcel' | 'tsc' | 'node' | 'bun' | 'deno' | 'unknown';
export type ModuleFormat = 'esm' | 'cjs';

export interface PackageInfo {
    name: string;
    path: string;
    type: PackageType;
    builder: BuilderType;
    hasSource: boolean;
    dependencies: string[];
    isComposite: boolean;
    moduleFormat?: ModuleFormat;
}

export interface TSConfig {
    compilerOptions: CompilerOptions;
    include?: string[];
    exclude?: string[];
    references?: Array<{ path: string }>;
    files?: string[];
    extends?: string;
}

export interface CompilerOptions {
    /* Базовые настройки */
    target: string;
    lib?: string[] | undefined;
    module: string;
    moduleResolution: string;
    allowImportingTsExtensions?: boolean | undefined;
    resolveJsonModule?: boolean | undefined;
    allowJs?: boolean | undefined;
    checkJs?: boolean | undefined;

    /* Максимально строгие проверки */
    strict: boolean;
    noImplicitAny?: boolean | undefined;
    noImplicitReturns?: boolean | undefined;
    noImplicitThis?: boolean | undefined;
    noImplicitOverride?: boolean | undefined;
    noUncheckedIndexedAccess?: boolean | undefined;
    exactOptionalPropertyTypes?: boolean | undefined;
    noUnusedLocals?: boolean | undefined;
    noUnusedParameters?: boolean | undefined;
    noFallthroughCasesInSwitch?: boolean | undefined;
    noUncheckedSideEffectImports?: boolean | undefined;
    useUnknownInCatchVariables?: boolean | undefined;

    /* Дополнительные строгие проверки */
    noPropertyAccessFromIndexSignature?: boolean | undefined;
    forceConsistentCasingInFileNames?: boolean | undefined;

    /* Модули и импорты */
    isolatedModules?: boolean | undefined;
    allowSyntheticDefaultImports?: boolean | undefined;
    esModuleInterop?: boolean | undefined;
    verbatimModuleSyntax?: boolean | undefined;

    /* Output и сборка */
    skipLibCheck?: boolean | undefined;
    declaration?: boolean | undefined;
    declarationMap?: boolean | undefined;
    sourceMap?: boolean | undefined;
    removeComments?: boolean | undefined;
    outDir?: string | undefined;
    rootDir?: string | undefined;
    composite?: boolean | undefined;
    incremental?: boolean | undefined;
    noEmit?: boolean | undefined;

    /* Пути и алиасы */
    baseUrl?: string | undefined;
    paths?: Record<string, string[]> | undefined;

    /* JSX (для фронтенда) */
    jsx?: 'preserve' | 'react-jsx' | 'react-jsxdev' | 'react' | undefined;

    /* Типы */
    types?: string[] | undefined;

    /* Дополнительные свойства для сборщиков */
    preserveWatchOutput?: boolean | undefined;
    inlineSources?: boolean | undefined;
    inlineSourceMap?: boolean | undefined;
    tsBuildInfoFile?: string | undefined;
}

export interface BuilderConfig {
    mainConfig: TSConfig;
    additionalConfigs: Record<string, TSConfig>;
    packageJsonUpdates: PackageJsonUpdates;
}

export interface PackageJsonUpdates {
    type?: 'module' | 'commonjs';
    main?: string;
    module?: string;
    types?: string;
    exports?: Record<string, any>;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

export interface BuilderContext {
    packageInfo: PackageInfo;
    monorepoRoot: string;
    allPackages: string[];
}

export interface ConfigGenerationResult {
    success: boolean;
    packageName: string;
    generatedFiles: string[];
    warnings: string[];
    errors: string[];
}

export interface MonorepoAnalysis {
    packages: PackageInfo[];
    hasFrontend: boolean;
    hasBackend: boolean;
    hasShared: boolean;
    compositePackages: string[];
    builderStats: Record<BuilderType, number>;
}

export interface PathMapping {
    alias: string;
    paths: string[];
    isExternal: boolean;
}

export interface CompositeProject {
    name: string;
    path: string;
    references: string[];
    isRoot: boolean;
    config: TSConfig;
}