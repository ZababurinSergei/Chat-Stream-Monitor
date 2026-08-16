export interface PackageJson {
    name: string;
    version: string;
    type?: 'module' | 'commonjs';
    main?: string;
    module?: string;
    types?: string;
    exports?: Record<string, any>;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    workspaces?: string[];
}

export interface BuilderDetection {
    builder: BuilderType;
    configFiles: string[];
    packageDependencies: string[];
    hasTypeScript?: boolean;
    hasReact?: boolean;
    hasVue?: boolean;
    hasNode?: boolean;
}

export interface PackageAnalysis {
    name: string;
    path: string;
    packageJson: PackageJson | null;
    builder: BuilderType;
    packageType: PackageType;
    dependencies: string[];
    devDependencies: string[];
    hasSource: boolean;
    hasTests: boolean;
    isComposite: boolean;
    moduleFormat: ModuleFormat;
    supportsJSX: boolean;
}

export type BuilderType =
    | 'vite'
    | 'webpack'
    | 'esbuild'
    | 'rollup'
    | 'rspack'
    | 'parcel'
    | 'tsc'
    | 'node'
    | 'bun'
    | 'deno'
    | 'unknown';

export type PackageType =
    | 'frontend'
    | 'backend'
    | 'shared'
    | 'library'
    | 'node'
    | 'browser'
    | 'react'
    | 'vue'
    | 'svelte'
    | 'angular'
    | 'cli'
    | 'api'
    | 'microservice';

export type ModuleFormat = 'esm' | 'cjs' | 'umd' | 'system';

export interface FrameworkDetection {
    name: string;
    version?: string;
    configFiles: string[];
    dependencies: string[];
}

export interface BuildToolConfig {
    name: BuilderType;
    version?: string;
    configFiles: string[];
    typicalDependencies: string[];
    supportedFrameworks: string[];
    defaultModuleFormat: ModuleFormat;
    supportsTypeScript: boolean;
    supportsJSX: boolean;
    requiresNodeConfig: boolean;
    additionalConfigs: string[];
}

export interface MonorepoPackage {
    name: string;
    path: string;
    relativePath: string;
    packageJson: PackageJson;
    analysis: PackageAnalysis;
    dependencies: MonorepoPackage[];
    dependents: MonorepoPackage[];
    buildOrder: number;
}

export interface MonorepoAnalysis {
    rootPath: string;
    packages: MonorepoPackage[];
    packageMap: Map<string, MonorepoPackage>;
    hasTypeScriptRoot: boolean;
    hasWorkspaces: boolean;
    buildGraph: Map<string, string[]>;
    circularDependencies: string[][];
}

export interface PackageRelationship {
    source: string;
    target: string;
    type: 'dependency' | 'devDependency' | 'peerDependency';
    version: string;
}

export interface TypeScriptConfig {
    compilerOptions: Record<string, any>;
    include: string[];
    exclude: string[];
    references: Array<{ path: string }>;
    extends?: string;
    files?: string[];
}

export interface BuilderSpecificConfig {
    mainConfig: TypeScriptConfig;
    additionalConfigs: Map<string, TypeScriptConfig>;
    packageJsonUpdates: Partial<PackageJson>;
    scripts: Record<string, string>;
    recommendations: string[];
}

export interface GenerationResult {
    packageName: string;
    success: boolean;
    generatedFiles: string[];
    updatedFiles: string[];
    warnings: string[];
    errors: string[];
    builder: BuilderType;
    packageType: PackageType;
}

export interface GenerationSummary {
    totalPackages: number;
    successfulGenerations: number;
    failedGenerations: number;
    generatedFiles: string[];
    executionTime: number;
    results: GenerationResult[];
}

export interface PackageFilterOptions {
    includeTypes: PackageType[];
    excludeTypes: PackageType[];
    includeBuilders: BuilderType[];
    excludeBuilders: BuilderType[];
    onlyWithSource: boolean;
    onlyWithTests: boolean;
    onlyComposite: boolean;
}

export interface CacheData {
    timestamp: number;
    packageAnalysis: Map<string, PackageAnalysis>;
    monorepoAnalysis: MonorepoAnalysis | null;
    generationResults: GenerationResult[];
}

export interface Plugin {
    name: string;
    version: string;
    supportedBuilders: BuilderType[];
    supportedPackageTypes: PackageType[];

    beforeGeneration?(packageInfo: PackageAnalysis): void;
    afterGeneration?(result: GenerationResult): void;
    modifyConfig?(config: BuilderSpecificConfig, packageInfo: PackageAnalysis): BuilderSpecificConfig;
    shouldProcessPackage?(packageInfo: PackageAnalysis): boolean;
}

export interface PluginRegistry {
    plugins: Plugin[];
    register(plugin: Plugin): void;
    unregister(pluginName: string): void;
    getPluginsForBuilder(builder: BuilderType): Plugin[];
    getPluginsForPackageType(packageType: PackageType): Plugin[];
}

// Добавленные интерфейсы для исправления ошибок
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