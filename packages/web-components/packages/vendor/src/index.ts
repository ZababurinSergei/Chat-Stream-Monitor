// scripts/src/index.ts

/**
 * @newkind/vendor-scripts - Vendor Bundle Generator
 * Main entry point for the vendor bundle generation module
 */

// Исправленные импорты
import { VendorBundler } from './core/vendor-bundler';
import { DependencyAnalyzer } from './utils/dependency-analyzer';
import { VendorIndexGenerator } from './core/vendor-index-generator';
import { ESBuildBuilder } from './builders/esbuild-builder';
import { FileUtils } from './utils/file-utils';
import { VendorCLI } from './cli';

// Импорты типов
import type {
    VendorDependency,
    BundleConfig,
    ImportMap,
    VendorAnalysisResult,
    BuildResult,
    FileAnalysisResult,
    VendorConfig,
    PackageJson,
    VendorIndexInfo,
    DependencyUsage,
    BundleAnalysis,
    ImportPattern,
    ResolvedImport,
    VendorGenerationOptions,
    VendorCLIOptions,
    Platform,
    ModuleFormat,
    ImportType,
    PathType,
    VendorGenerationEvent,
    ProgressCallback,
    ConfigValidationResult,
    PerformanceMetrics
} from './core/types';

// Экспорты классов и утилит
export { VendorBundler, DependencyAnalyzer, VendorIndexGenerator, ESBuildBuilder, FileUtils, VendorCLI };

// Экспорты типов
export type {
    VendorDependency,
    BundleConfig,
    ImportMap,
    VendorAnalysisResult,
    BuildResult,
    FileAnalysisResult,
    VendorConfig,
    PackageJson,
    VendorIndexInfo,
    DependencyUsage,
    BundleAnalysis,
    ImportPattern,
    ResolvedImport,
    VendorGenerationOptions,
    VendorCLIOptions,
    Platform,
    ModuleFormat,
    ImportType,
    PathType,
    VendorGenerationEvent,
    ProgressCallback,
    ConfigValidationResult,
    PerformanceMetrics
};

// Version info
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Vendor Bundle Generator with Platform Support';

/**
 * Main initialization function
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance
 */
export function createVendorBundler(projectRoot: string): VendorBundler {
    return new VendorBundler(projectRoot);
}

/**
 * Create VendorBundler instance for Node.js platform
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance for Node.js
 */
export function createNodeVendorBundler(projectRoot: string): VendorBundler {
    return new VendorBundler(projectRoot, 'node');
}

/**
 * Create VendorBundler instance for browser platform
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance for browser
 */
export function createBrowserVendorBundler(projectRoot: string): VendorBundler {
    return new VendorBundler(projectRoot, 'browser');
}

/**
 * Quick vendor bundle generation
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @param platform - Target platform (node or browser)
 * @returns Build result
 */
export async function generateVendorBundle(
    projectRoot: string,
    outputPath: string = './dist/vendor.bundle.mjs',
    platform: Platform = 'browser'
): Promise<BuildResult> {
    const bundler = new VendorBundler(projectRoot, platform);
    return await bundler.generateVendorBundle(outputPath);
}

/**
 * Quick vendor bundle generation for Node.js
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @returns Build result
 */
export async function generateNodeVendorBundle(
    projectRoot: string,
    outputPath: string = './dist/node/vendor.mjs'
): Promise<BuildResult> {
    return generateVendorBundle(projectRoot, outputPath, 'node');
}

/**
 * Quick vendor bundle generation for browser
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @returns Build result
 */
export async function generateBrowserVendorBundle(
    projectRoot: string,
    outputPath: string = './dist/browser/vendor.bundle.mjs'
): Promise<BuildResult> {
    return generateVendorBundle(projectRoot, outputPath, 'browser');
}

/**
 * Analyze dependencies without building
 * @param projectRoot - Project source root
 * @returns Analysis result with dependencies and import map
 */
export async function analyzeDependencies(projectRoot: string): Promise<VendorAnalysisResult> {
    const analyzer = new DependencyAnalyzer(projectRoot);
    return await analyzer.analyzeDependencies();
}

/**
 * Generate only import map
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @param platform - Target platform (node or browser)
 * @returns Generated import map
 */
export async function generateImportMap(
    projectRoot: string,
    outputDir: string = './dist',
    platform: Platform = 'browser'
): Promise<ImportMap> {
    const bundler = new VendorBundler(projectRoot, platform);
    return await bundler.generateImportMapOnly(outputDir);
}

/**
 * Generate import map for Node.js
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @returns Generated import map
 */
export async function generateNodeImportMap(
    projectRoot: string,
    outputDir: string = './dist/node'
): Promise<ImportMap> {
    return generateImportMap(projectRoot, outputDir, 'node');
}

/**
 * Generate import map for browser
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @returns Generated import map
 */
export async function generateBrowserImportMap(
    projectRoot: string,
    outputDir: string = './dist/browser'
): Promise<ImportMap> {
    return generateImportMap(projectRoot, outputDir, 'browser');
}

export default {
    VendorBundler,
    DependencyAnalyzer,
    VendorIndexGenerator,
    ESBuildBuilder,
    FileUtils,
    VendorCLI,
    createVendorBundler,
    createNodeVendorBundler,
    createBrowserVendorBundler,
    generateVendorBundle,
    generateNodeVendorBundle,
    generateBrowserVendorBundle,
    analyzeDependencies,
    generateImportMap,
    generateNodeImportMap,
    generateBrowserImportMap,
    VERSION,
    DESCRIPTION
};