import { DependencyAnalyzer } from '../utils/dependency-analyzer';
import { VendorIndexGenerator } from './vendor-index-generator';
import { ESBuildBuilder } from '../builders/esbuild-builder';
import { FileUtils } from '../utils/file-utils';
import type { BundleConfig, BuildResult, ImportMap, VendorAnalysisResult, BuildStats, Platform } from './types';

/**
 * Main vendor bundler class that orchestrates the entire vendor bundle generation process
 */
export class VendorBundler {
    private dependencyAnalyzer: DependencyAnalyzer;
    private indexGenerator: VendorIndexGenerator;
    private builder: ESBuildBuilder;

    /**
     * Creates a new VendorBundler instance
     * @param projectRoot - Root directory of the project to analyze
     * @param platform - Target platform (node or browser)
     */
    constructor(
        private projectRoot: string,
        private platform: Platform = 'browser'
    ) {
        this.dependencyAnalyzer = new DependencyAnalyzer(projectRoot);
        this.indexGenerator = new VendorIndexGenerator(projectRoot);
        this.builder = new ESBuildBuilder();
    }

    /**
     * Generates a complete vendor bundle including analysis, index generation, and bundling
     */
    async generateVendorBundle(outputPath: string): Promise<BuildResult> {
        console.log(`🚀 Starting ${this.platform} vendor bundle generation...`);
        console.log(`📁 Project root: ${this.projectRoot}`);
        console.log(`📦 Output path: ${outputPath}`);
        console.log(`🎯 Platform: ${this.platform}`);

        const startTime = Date.now();

        try {
            // Step 1: Analyze dependencies
            console.log('🔍 Analyzing dependencies...');
            const analysis = await this.dependencyAnalyzer.analyzeDependencies(this.platform);

            if (analysis.dependencies.size === 0) {
                console.log('⚠️ No external dependencies found, creating fallback bundle');
                return this.createFallbackBundle(outputPath, startTime);
            }

            console.log(`📊 Found ${analysis.dependencies.size} external dependencies:`);
            analysis.dependencies.forEach((dep, pkgName) => {
                console.log(`   - ${pkgName}@${dep.version}`);
            });

            // Step 2: Generate vendor index file
            console.log('📝 Generating vendor index...');
            const indexContent = await this.indexGenerator.generateVendorIndex(
                new Map(Array.from(analysis.dependencies)),
                this.platform
            );

            // Используем ту же директорию, что и для output bundle
            const outputDir = FileUtils.dirname(outputPath);
            const indexPath = await this.indexGenerator.saveVendorIndexToDir(indexContent, outputDir, this.platform);
            console.log(`✅ Vendor index created: ${indexPath}`);

            // Step 3: Build vendor bundle using esbuild
            console.log(`🔨 Building ${this.platform} vendor bundle with esbuild...`);

            // Автоматическое определение external dependencies
            const external = await this.autoDetectExternalDependencies(analysis);

            const buildConfig: BundleConfig = {
                entryPoint: indexPath,
                outfile: outputPath,
                platform: this.platform,
                format: 'esm',
                minify: this.platform === 'browser',
                sourcemap: true,
                external: external,
                target: this.platform === 'browser' ? 'es2020' : 'node18',
                treeShaking: true
            };

            const buildResult = await this.builder.build(buildConfig);

            if (buildResult.success) {
                const duration = Date.now() - startTime;
                console.log(`✅ ${this.platform} vendor bundle successfully created: ${outputPath}`);

                if (buildResult.stats) {
                    console.log(`📊 Build statistics:`);
                    console.log(`   Size: ${(buildResult.stats.size / 1024 / 1024).toFixed(2)} MB`);
                    console.log(`   Duration: ${buildResult.stats.duration}ms`);
                    console.log(`   Dependencies processed: ${buildResult.stats.dependencies}`);
                }

                console.log(`⏱️ Total generation time: ${duration}ms`);
            } else {
                console.error(`❌ ${this.platform} vendor bundle build failed:`, buildResult.error);
                return this.createFallbackBundle(outputPath, startTime);
            }

            return buildResult;

        } catch (error) {
            console.error(`💥 ${this.platform} vendor bundle generation failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during vendor bundle generation'
            };
        }
    }

    /**
     * Автоматическое определение external dependencies на основе package.json
     */
    private async autoDetectExternalDependencies(analysis: VendorAnalysisResult): Promise<string[]> {
        const external: string[] = [];
        const alwaysExternal = [
            // Node.js built-ins
            'fs', 'path', 'url', 'child_process', 'os', 'crypto', 'http', 'https',
            'net', 'dns', 'util', 'stream', 'buffer', 'events', 'module', 'assert',
            'querystring', 'zlib', 'tls', 'cluster', 'vm', 'perf_hooks', 'readline',
            'repl', 'timers', 'string_decoder', 'worker_threads',
            // TypeScript types
            '@types/node', '@types/*'
        ];

        // Add always external dependencies
        external.push(...alwaysExternal);

        if (this.platform === 'browser') {
            // For browser, exclude Node.js specific packages
            for (const [pkgName] of analysis.dependencies) {
                if (await this.isNodeOnlyPackage(pkgName)) {
                    console.log(`🚫 Excluding Node.js only package from browser: ${pkgName}`);
                    external.push(pkgName);
                }
            }
        } else {
            // For Node.js, exclude build tools and dev dependencies
            const nodeExclusions = [
                'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
                'jest', 'mocha', 'chai', 'ava', 'tape',
                'nodemon', 'pm2', 'forever',
                'sass', 'less', 'stylus', 'postcss',
                'fs-extra', 'chokidar'
            ];

            for (const pkgName of nodeExclusions) {
                if (analysis.dependencies.has(pkgName)) {
                    console.log(`🚫 Excluding build tool from Node.js bundle: ${pkgName}`);
                    external.push(pkgName);
                }
            }
        }

        return external;
    }

    /**
     * Проверяет, является ли пакет Node.js only на основе package.json
     */
    private async isNodeOnlyPackage(pkgName: string): Promise<boolean> {
        try {
            // Проверяем package.json пакета в node_modules
            const packagePath = `${this.projectRoot}/node_modules/${pkgName}/package.json`;

            if (!FileUtils.exists(packagePath)) {
                // Если package.json не найден, используем эвристики
                return this.heuristicNodeOnlyCheck(pkgName);
            }

            const pkgJson = FileUtils.readJson<{
                browser?: string | Record<string, string>;
                main?: string;
                module?: string;
                type?: string;
                dependencies?: Record<string, string>;
                peerDependencies?: Record<string, string>;
            }>(packagePath);

            if (!pkgJson) return false;

            // Если есть browser поле - пакет браузерный
            if (pkgJson.browser) {
                return false;
            }

            // Проверяем зависимости на Node.js специфичные пакеты
            const nodeSpecificDeps = this.getNodeSpecificDependencies();
            const allDeps = {
                ...pkgJson.dependencies,
                ...pkgJson.peerDependencies
            };

            for (const dep of Object.keys(allDeps || {})) {
                if (nodeSpecificDeps.some(pattern => pattern.test(dep))) {
                    return true;
                }
            }

            // Эвристики для известных Node.js only пакетов
            return this.heuristicNodeOnlyCheck(pkgName);

        } catch (error) {
            // Если не удалось прочитать package.json, используем эвристики
            return this.heuristicNodeOnlyCheck(pkgName);
        }
    }

    /**
     * Эвристическая проверка на Node.js only пакеты
     */
    private heuristicNodeOnlyCheck(pkgName: string): boolean {
        const nodeOnlyPatterns = [
            // Build tools
            /^esbuild/,
            /^webpack/,
            /^rollup/,
            /^vite/,
            /^parcel/,
            /^ts-node/,
            /^tsx/,

            // TypeScript related
            /^typescript/,
            /^ts-/,
            /^@types\//,

            // Testing frameworks
            /^jest/,
            /^mocha/,
            /^chai/,
            /^ava/,
            /^tape/,

            // Node.js specific utilities
            /^nodemon/,
            /^pm2/,
            /^forever/,

            // CSS processors (often Node.js only)
            /^sass/,
            /^less/,
            /^stylus/,
            /^postcss/,

            // File system utilities
            /^fs-extra/,
            /^chokidar/,

            // CLI tools
            /^-cli$/,
            /^cli-/,
            /-cli$/,

            // Known Node.js only packages
            /^express/,
            /^koa/,
            /^fastify/,
            /^socket.io/,
        ];

        return nodeOnlyPatterns.some(pattern => pattern.test(pkgName));
    }

    /**
     * Список Node.js специфичных зависимостей
     */
    private getNodeSpecificDependencies(): RegExp[] {
        return [
            /^fs/,
            /^path/,
            /^os/,
            /^child_process/,
            /^crypto/,
            /^http/,
            /^https/,
            /^net/,
            /^dns/,
            /^url/,
            /^util/,
            /^stream/,
            /^buffer/,
            /^events/,
            /^module/,
            /^assert/,
            /^querystring/,
            /^zlib/,
            /^tls/,
            /^cluster/,
            /^vm/,
            /^perf_hooks/,
            /^readline/,
            /^repl/,
            /^timers/,
            /^string_decoder/,
            /^worker_threads/,
        ];
    }

    /**
     * Creates a fallback vendor bundle when no dependencies are found or build fails
     * @param outputPath - Path where the fallback bundle should be saved
     * @param startTime - Start time for duration calculation
     * @returns Build result for fallback bundle
     */
    private async createFallbackBundle(outputPath: string, startTime: number): Promise<BuildResult> {
        try {
            const fallbackContent = `// Fallback Vendor Bundle - Auto-generated
// Generated: ${new Date().toISOString()}
// No external dependencies found or build failed

// Mock implementations for common browser dependencies
export const libp2pLogger = {
  info: (...args: unknown[]) => console.log('[libp2p]', ...args),
  warn: (...args: unknown[]) => console.warn('[libp2p]', ...args),
  error: (...args: unknown[]) => console.error('[libp2p]', ...args),
  debug: (...args: unknown[]) => console.debug('[libp2p]', ...args),
  trace: (...args: unknown[]) => console.trace('[libp2p]', ...args)
};

export const logger = libp2pLogger;

// Common utilities mock
export const utils = {
  format: (msg: string) => \`[\${new Date().toISOString()}] \${msg}\`,
  createLogger: (name: string) => ({
    info: (...args: unknown[]) => console.log(\`[\${name}]\`, ...args)
  })
};

// Vendor metadata
export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  isFallback: true
};

console.warn('⚠️ Using fallback vendor bundle - no external dependencies were found or build failed');
console.log('✅ Fallback vendor bundle loaded');
`;

            FileUtils.ensureDir(FileUtils.dirname(outputPath));
            FileUtils.writeFile(outputPath, fallbackContent);

            const duration = Date.now() - startTime;
            const stats: BuildStats = {
                size: Buffer.from(fallbackContent).length,
                duration,
                dependencies: 0,
                outputFiles: [outputPath],
                inputFiles: []
            };

            console.log(`✅ Fallback vendor bundle created: ${outputPath}`);
            console.log(`📊 Fallback bundle size: ${(stats.size / 1024).toFixed(2)} KB`);

            return {
                success: true,
                outputPath,
                stats
            };

        } catch (error) {
            console.error('💥 Failed to create fallback bundle:', error);
            return {
                success: false,
                error: 'Failed to create fallback vendor bundle'
            };
        }
    }

    /**
     * Updates HTML file with import map for vendor bundle
     * @param htmlPath - Path to HTML file
     * @param importMap - Import map to inject
     * @returns Success status
     */
    async updateHtmlImportMap(htmlPath: string, importMap: ImportMap): Promise<boolean> {
        console.log(`📄 Updating HTML import map: ${htmlPath}`);

        if (!FileUtils.exists(htmlPath)) {
            console.warn(`⚠️ HTML file not found: ${htmlPath}`);
            return false;
        }

        try {
            let htmlContent = FileUtils.readFile(htmlPath);
            const importMapTag = `    <script type="importmap">\n${JSON.stringify(importMap, null, 4)}    </script>`;

            // Remove existing importmap if present
            htmlContent = htmlContent.replace(/<script type="importmap">[^<]*<\/script>/g, '');

            // Check if importmap already exists (shouldn't after removal, but just in case)
            if (htmlContent.includes('type="importmap"')) {
                console.log('ℹ️ Import map already exists in HTML, skipping update');
                return true;
            }

            // Try to insert before closing head tag
            const headCloseIndex = htmlContent.indexOf('</head>');

            if (headCloseIndex !== -1) {
                // Insert before closing head tag
                htmlContent = htmlContent.slice(0, headCloseIndex) +
                    '\n' + importMapTag + '\n' +
                    htmlContent.slice(headCloseIndex);
                console.log('✅ Import map added to <head> section');
            } else {
                // Create head section if it doesn't exist
                console.warn('⚠️ No <head> section found, creating one...');

                const bodyOpenIndex = htmlContent.indexOf('<body>');
                if (bodyOpenIndex !== -1) {
                    htmlContent = htmlContent.slice(0, bodyOpenIndex) +
                        '<head>\n' + importMapTag + '\n</head>\n' +
                        htmlContent.slice(bodyOpenIndex);
                    console.log('✅ Created <head> section with import map');
                } else {
                    // Prepend to beginning of file as last resort
                    htmlContent = '<head>\n' + importMapTag + '\n</head>\n' + htmlContent;
                    console.log('✅ Added import map at beginning of file');
                }
            }

            FileUtils.writeFile(htmlPath, htmlContent);
            console.log(`✅ HTML file successfully updated: ${htmlPath}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to update HTML import map:`, error);
            return false;
        }
    }

    /**
     * Generates only the import map without building the bundle
     * @param outputDir - Directory where importmap.json should be saved
     * @returns Generated import map
     */
    async generateImportMapOnly(outputDir: string): Promise<ImportMap> {
        console.log(`🗺️ Generating ${this.platform} import map in: ${outputDir}`);

        try {
            FileUtils.ensureDir(outputDir);
            const analysis = await this.dependencyAnalyzer.analyzeDependencies(this.platform);

            // Platform-specific import map generation
            const importMap = this.platform === 'node'
                ? this.generateNodeImportMap(analysis)
                : this.generateBrowserImportMap(analysis);

            const importMapPath = `${outputDir}/importmap.json`;

            FileUtils.writeJson(importMapPath, importMap);

            console.log(`✅ ${this.platform} import map created: ${importMapPath}`);
            console.log(`📊 Import map includes ${Object.keys(importMap.imports).length} dependencies`);

            Object.keys(importMap.imports).forEach(key => {
                if (!key.includes('/*')) {
                    console.log(`   - ${key}`);
                }
            });

            return importMap;

        } catch (error) {
            console.error(`❌ Failed to generate ${this.platform} import map:`, error);
            throw new Error(`Import map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate browser-specific import map
     */
    private generateBrowserImportMap(analysis: VendorAnalysisResult): ImportMap {
        const imports: Record<string, string> = {};

        for (const [pkgName] of analysis.dependencies) {
            imports[pkgName] = './vendor.bundle.mjs';
            imports[`${pkgName}/*`] = './vendor.bundle.mjs';
        }

        return {
            imports,
            scopes: {
                "./": { ...imports }
            }
        };
    }

    /**
     * Generate Node.js-specific import map
     */
    private generateNodeImportMap(analysis: VendorAnalysisResult): ImportMap {
        const imports: Record<string, string> = {};

        for (const [pkgName] of analysis.dependencies) {
            // For Node.js, point to actual node_modules or bundled version
            imports[pkgName] = `./vendor.mjs`;
            imports[`${pkgName}/*`] = `./vendor.mjs`;
        }

        return {
            imports,
            scopes: {
                "./": { ...imports }
            }
        };
    }

    /**
     * Performs complete vendor bundle generation including HTML updates
     * @param bundleOutputPath - Path for vendor bundle
     * @param htmlPath - Path to HTML file to update
     * @returns Complete build result
     */
    async generateCompleteVendorSetup(bundleOutputPath: string, htmlPath?: string): Promise<BuildResult> {
        console.log('🚀 Starting complete vendor setup...');

        // Generate vendor bundle
        const buildResult = await this.generateVendorBundle(bundleOutputPath);

        if (!buildResult.success) {
            return buildResult;
        }

        // Generate and update import map if HTML path provided
        if (htmlPath && FileUtils.exists(htmlPath)) {
            try {
                const outputDir = FileUtils.dirname(bundleOutputPath);
                const importMap = await this.generateImportMapOnly(outputDir);
                await this.updateHtmlImportMap(htmlPath, importMap);
                console.log('✅ Complete vendor setup finished successfully');
            } catch (error) {
                console.warn('⚠️ Vendor bundle created but HTML update failed:', error);
                // Don't fail the whole process if HTML update fails
            }
        } else if (htmlPath) {
            console.warn('⚠️ HTML file not found, skipping import map update');
        }

        return buildResult;
    }

    /**
     * Analyzes dependencies without generating any files
     * @returns Analysis result with dependencies and import map
     */
    async analyzeDependencies(): Promise<VendorAnalysisResult> {
        console.log('🔍 Analyzing project dependencies...');
        return await this.dependencyAnalyzer.analyzeDependencies(this.platform);
    }

    /**
     * Gets the project root path
     * @returns Current project root
     */
    getProjectRoot(): string {
        return this.projectRoot;
    }

    /**
     * Gets the current platform
     */
    getPlatform(): Platform {
        return this.platform;
    }

    /**
     * Sets the platform
     */
    setPlatform(platform: Platform): void {
        this.platform = platform;
    }
}