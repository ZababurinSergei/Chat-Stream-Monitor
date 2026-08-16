/**
 * Core types for Vendor Bundle Generator
 * Maximum TypeScript strictness enabled
 */

export interface VendorDependency {
    readonly packageName: string;
    readonly version: string;
    readonly importPath: string;
    readonly isExternal: boolean;
    readonly usedIn?: string[];
}

export interface BundleConfig {
    readonly entryPoint: string;
    readonly outfile: string;
    readonly platform: 'browser' | 'node';
    readonly format: 'esm' | 'cjs';
    readonly minify: boolean;
    readonly sourcemap: boolean;
    readonly external?: readonly string[];
    readonly target?: string;
    readonly treeShaking?: boolean;
}

export interface ImportMap {
    readonly imports: Record<string, string>;
    readonly scopes?: Record<string, Record<string, string>>;
}

export interface VendorAnalysisResult {
    readonly dependencies: ReadonlyMap<string, VendorDependency>;
    readonly entryPoints: readonly string[];
    readonly importMap: ImportMap;
    readonly projectRoot: string;
    readonly analyzedFiles: number;
}

export interface BuildResult {
    readonly success: boolean;
    readonly outputPath?: string;
    readonly error?: string;
    readonly warnings?: readonly string[];
    readonly stats?: BuildStats;
}

export interface BuildStats {
    readonly size: number;
    readonly duration: number;
    readonly dependencies: number;
    readonly outputFiles: readonly string[];
    readonly inputFiles: readonly string[];
    readonly formattedSize?: string;
    readonly formattedDuration?: string;
    readonly entryPointSize?: number;
}

export interface FileAnalysisResult {
    readonly filePath: string;
    readonly imports: readonly string[];
    readonly exports: readonly string[];
    readonly hasSideEffects: boolean;
}

export interface VendorConfig {
    readonly projectRoot: string;
    readonly outputPath: string;
    readonly platform: 'browser' | 'node';
    readonly format: 'esm' | 'cjs';
    readonly minify: boolean;
    readonly sourcemap: boolean;
    readonly analyzeSourceFiles: boolean;
    readonly includeDevDependencies: boolean;
    readonly externalPackages?: readonly string[];
    readonly target?: string;
}

export interface PackageJson {
    readonly name?: string;
    readonly version?: string;
    readonly type?: 'module' | 'commonjs';
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly exports?: Record<string, string | Record<string, string>>;
    readonly main?: string;
    readonly module?: string;
    readonly types?: string;
}

export interface VendorIndexInfo {
    readonly generatedAt: string;
    readonly dependencies: readonly string[];
    readonly totalDependencies: number;
    readonly projectName?: string;
    readonly vendorVersion: string;
}

export interface DependencyUsage {
    readonly packageName: string;
    readonly files: readonly string[];
    readonly importCount: number;
    readonly isDirectImport: boolean;
}

export interface BundleAnalysis {
    readonly entryPoint: string;
    readonly outputPath: string;
    readonly size: number;
    readonly modules: number;
    readonly dependencies: readonly string[];
    readonly treeShaken: boolean;
    readonly format: string;
    readonly platform: string;
}

export interface ImportPattern {
    readonly pattern: RegExp;
    readonly type: 'static' | 'dynamic' | 'export' | 'require';
    readonly description: string;
}

export interface ResolvedImport {
    readonly original: string;
    readonly resolved: string;
    readonly type: 'package' | 'relative' | 'absolute' | 'internal';
    readonly packageName?: string;
    readonly subpath?: string;
}

export interface VendorGenerationOptions {
    readonly forceRegeneration?: boolean;
    readonly cleanOutput?: boolean;
    readonly verbose?: boolean;
    readonly skipAnalysis?: boolean;
    readonly skipBundle?: boolean;
    readonly skipImportMap?: boolean;
    readonly customImports?: Record<string, string>;
}

export interface VendorCLIOptions {
    readonly config?: string;
    readonly output?: string;
    readonly platform?: 'browser' | 'node';
    readonly format?: 'esm' | 'cjs';
    readonly minify?: boolean;
    readonly sourcemap?: boolean;
    readonly analyze?: boolean;
    readonly verbose?: boolean;
    readonly force?: boolean;
    readonly clean?: boolean;
}

// Union types for better type safety
export type Platform = 'browser' | 'node';
export type ModuleFormat = 'esm' | 'cjs';
export type ImportType = 'static' | 'dynamic' | 'export' | 'require';
export type PathType = 'package' | 'relative' | 'absolute' | 'internal';

// Utility types for immutable data structures
export type ReadonlyRecord<K extends string | number | symbol, V> = Readonly<Record<K, V>>;
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Result types for better error handling
export type Result<T, E = Error> =
    | { readonly success: true; readonly data: T }
    | { readonly success: false; readonly error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Event types for progress reporting
export interface VendorGenerationEvent {
    readonly type: 'analysis_started' | 'analysis_completed' |
        'index_generation_started' | 'index_generation_completed' |
        'bundle_started' | 'bundle_completed' |
        'importmap_generated' | 'html_updated' |
        'error' | 'warning';
    readonly message: string;
    readonly timestamp: Date;
    readonly data?: unknown;
}

export interface ProgressCallback {
    (event: VendorGenerationEvent): void;
}

// Configuration validation results
export interface ConfigValidationResult {
    readonly isValid: boolean;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
}

// Performance metrics
export interface PerformanceMetrics {
    readonly analysisTime: number;
    readonly indexGenerationTime: number;
    readonly bundleTime: number;
    readonly totalTime: number;
    readonly memoryUsage: {
        readonly heapUsed: number;
        readonly heapTotal: number;
        readonly external: number;
    };
}

// Export all types as a namespace for easy importing
/*
export namespace VendorTypes {
    export type Dependency = VendorDependency;
    export type BundleConfig = BundleConfig;
    export type ImportMap = ImportMap;
    export type AnalysisResult = VendorAnalysisResult;
    export type BuildResult = BuildResult;
    export type FileAnalysis = FileAnalysisResult;
    export type VendorConfig = VendorConfig;
    export type PackageJson = PackageJson;
    export type VendorIndexInfo = VendorIndexInfo;
    export type DependencyUsage = DependencyUsage;
    export type BundleAnalysis = BundleAnalysis;
    export type ImportPattern = ImportPattern;
    export type ResolvedImport = ResolvedImport;
    export type GenerationOptions = VendorGenerationOptions;
    export type CLIOptions = VendorCLIOptions;

    // Явные определения для избежания циклических ссылок
    export type Platform = 'browser' | 'node';
    export type ModuleFormat = 'esm' | 'cjs';
    export type ImportType = 'static' | 'dynamic' | 'export' | 'require';
    export type PathType = 'package' | 'relative' | 'absolute' | 'internal';

    export type Result<T, E = Error> =
        | { readonly success: true; readonly data: T }
        | { readonly success: false; readonly error: E };

    export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
    export type ProgressCallback = (event: VendorGenerationEvent) => void;
    export type ConfigValidation = ConfigValidationResult;
    export type Metrics = PerformanceMetrics;
}
*/