import { FileUtils } from './file-utils';
import type { VendorDependency, VendorAnalysisResult, ImportMap, Platform } from '../core/types';

export class DependencyAnalyzer {
    constructor(private projectRoot: string) {}

    async analyzeDependencies(platform: Platform = 'browser'): Promise<VendorAnalysisResult> {
        const dependencies = new Map<string, VendorDependency>();
        const entryPoints: string[] = [];

        console.log('📦 Analyzing package.json dependencies...');
        await this.analyzePackageJson(dependencies, platform);

        console.log('🔍 Scanning source files for imports...');
        await this.analyzeSourceImports(dependencies, platform);

        // Логируем найденные зависимости с версиями
        if (dependencies.size > 0) {
            console.log(`📊 Found ${dependencies.size} external dependencies:`);
            dependencies.forEach((dep, pkgName) => {
                const versionInfo = dep.version !== 'unknown' ? `@${dep.version}` : '(version unknown)';
                console.log(`   📦 ${pkgName}${versionInfo}`);
            });
        } else {
            console.log('ℹ️ No external dependencies found');
        }

        // Generate import map
        const importMap = this.generateImportMap(dependencies, platform);

        return {
            dependencies,
            entryPoints,
            importMap,
            projectRoot: this.projectRoot,
            analyzedFiles: this.countAnalyzedFiles()
        };
    }

    private async analyzePackageJson(dependencies: Map<string, VendorDependency>, platform: Platform): Promise<void> {
        const packageJsonPath = `${this.projectRoot}/package.json`;

        if (!FileUtils.exists(packageJsonPath)) {
            return;
        }

        const packageJson = FileUtils.readJson<{
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
            name?: string;
            version?: string;
        }>(packageJsonPath);

        if (!packageJson) return;

        // Собираем все зависимости
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies
        };

        for (const [pkgName, version] of Object.entries(allDeps)) {
            if (this.isExternalDependency(pkgName, platform)) {
                // Очищаем версию от символов ^, ~ и т.д.
                const cleanVersion = this.cleanVersion(version || 'unknown');

                dependencies.set(pkgName, {
                    packageName: pkgName,
                    version: cleanVersion,
                    importPath: pkgName,
                    isExternal: true
                });
            }
        }
    }

    private cleanVersion(version: string): string {
        // Убираем символы ^, ~, >, < и пробелы
        return version.replace(/[^0-9.]/g, '');
    }

    private async analyzeSourceImports(dependencies: Map<string, VendorDependency>, platform: Platform): Promise<void> {
        const sourceFiles = FileUtils.getAllFiles(this.projectRoot, ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs']);

        console.log(`🔍 Analyzing ${sourceFiles.length} source files for imports...`);

        // Сначала получим версии из package.json
        const packageVersions = await this.getPackageVersionsFromNodeModules();

        for (const file of sourceFiles) {
            const imports = this.extractImportsFromFile(file);
            for (const pkgName of imports) {
                if (this.isExternalDependency(pkgName, platform) && !dependencies.has(pkgName)) {
                    // Пытаемся найти версию в node_modules или используем fallback
                    const version = packageVersions.get(pkgName) || this.getFallbackVersion(pkgName);

                    dependencies.set(pkgName, {
                        packageName: pkgName,
                        version: version,
                        importPath: pkgName,
                        isExternal: true
                    });
                }
            }
        }
    }

    private async getPackageVersionsFromNodeModules(): Promise<Map<string, string>> {
        const versions = new Map<string, string>();
        const nodeModulesPath = `${this.projectRoot}/node_modules`;

        if (!FileUtils.exists(nodeModulesPath)) {
            return versions;
        }

        try {
            const items = FileUtils.readDir(nodeModulesPath);

            for (const item of items) {
                if (item.isDirectory() && !item.name.startsWith('.')) {
                    const pkgName = item.name;
                    const packageJsonPath = `${nodeModulesPath}/${pkgName}/package.json`;

                    if (FileUtils.exists(packageJsonPath)) {
                        const pkgJson = FileUtils.readJson<{ version?: string }>(packageJsonPath);
                        if (pkgJson?.version) {
                            versions.set(pkgName, this.cleanVersion(pkgJson.version));
                        }
                    }
                }
            }

            // Обработка scoped packages (@org/package)
            const scopedDirs = items.filter(item => item.isDirectory() && item.name.startsWith('@'));
            for (const scopedDir of scopedDirs) {
                const scopedPath = `${nodeModulesPath}/${scopedDir.name}`;
                const scopedItems = FileUtils.readDir(scopedPath);

                for (const scopedItem of scopedItems) {
                    if (scopedItem.isDirectory()) {
                        const pkgName = `${scopedDir.name}/${scopedItem.name}`;
                        const packageJsonPath = `${scopedPath}/${scopedItem.name}/package.json`;

                        if (FileUtils.exists(packageJsonPath)) {
                            const pkgJson = FileUtils.readJson<{ version?: string }>(packageJsonPath);
                            if (pkgJson?.version) {
                                versions.set(pkgName, this.cleanVersion(pkgJson.version));
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Cannot read node_modules for versions:', error);
        }

        return versions;
    }

    private getFallbackVersion(pkgName: string): string {
        // Fallback версии для популярных пакетов
        const fallbackVersions: Record<string, string> = {
            'react': '18.0.0',
            'react-dom': '18.0.0',
            'vue': '3.0.0',
            '@libp2p/logger': '1.0.0',
            'lodash': '4.17.0',
            'axios': '1.0.0',
            'express': '4.18.0',
            'typescript': '5.0.0',
            // Добавьте другие популярные пакеты по необходимости
        };

        return fallbackVersions[pkgName] || '1.0.0';
    }

    private extractImportsFromFile(filePath: string): Set<string> {
        const imports = new Set<string>();

        try {
            const content = FileUtils.readFile(filePath);

            // Match various import patterns with improved regex
            const importPatterns = [
                // import { x } from 'package'
                /from\s+['"]([^'"]+)['"]/g,
                // import 'package'
                /import\s+['"]([^'"]+)['"]\s*;/g,
                // import('package')
                /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
                // export ... from 'package'
                /export\s+.*from\s+['"]([^'"]+)['"]/g,
                // dynamic import with template literals (basic support)
                /import\s*\(\s*`([^`]+)`\s*\)/g
            ];

            for (const pattern of importPatterns) {
                let match: RegExpExecArray | null;
                while ((match = pattern.exec(content)) !== null) {
                    const importPath = match[1];
                    if (importPath) {
                        const packageName = this.extractPackageName(importPath);
                        if (packageName && this.isValidPackageName(packageName)) {
                            imports.add(packageName);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Cannot analyze imports in ${filePath}:`, error instanceof Error ? error.message : error);
        }

        return imports;
    }

    private extractPackageName(importPath: string): string | null {
        // Skip relative imports, absolute paths, and data URLs
        if (importPath.startsWith('.') ||
            importPath.startsWith('/') ||
            importPath.startsWith('http:') ||
            importPath.startsWith('https:') ||
            importPath.startsWith('data:') ||
            importPath.startsWith('#')) {
            return null;
        }

        // Handle scoped packages (@org/package)
        if (importPath.startsWith('@')) {
            const match = importPath.match(/^(@[^/]+\/[^/@]+)/);
            return match ? (match[1] ?? null) : null;
        }

        // Handle regular packages and subpath imports
        const match = importPath.match(/^([^/@]+)/);
        return match ? (match[1] ?? null) : null;
    }

    private isValidPackageName(packageName: string): boolean {
        // Basic validation for package names
        if (packageName.length === 0 || packageName.length > 214) return false;

        // Should not contain spaces or special characters except @, /, ., -, _
        if (!/^[@a-zA-Z0-9][\w@./-]*$/.test(packageName)) return false;

        // Should not start or end with dot, underscore, or hyphen
        if (/^[._-]|[._-]$/.test(packageName)) return false;

        // Should not contain consecutive dots, hyphens, or underscores
        if (/[._-]{2,}/.test(packageName)) return false;

        return true;
    }

    private isExternalDependency(packageName: string, platform: Platform): boolean {
        // Internal packages and special cases to exclude
        const internalPatterns = [
            /^@newkind\//,           // Internal scoped packages
            /^\./,                   // Relative imports
            /^\//,                   // Absolute paths
            /^virtual:/,             // Virtual modules
            /^bun:/,                 // Bun built-ins
            /^deno:/,                // Deno built-ins
            /^http:/,                // URLs
            /^https:/,               // URLs
            /^data:/,                // Data URLs
            /^#/,                    // Package imports
            /^std:/                  // Standard library
        ];

        // Always exclude TypeScript types and Node.js built-ins
        const alwaysExcluded = [
            /^@types\//,             // TypeScript types (always exclude)
            /^node:/,                // Node.js built-ins with node: prefix
            /^fs$/, /^path$/, /^url$/, /^child_process$/, /^os$/,
            /^crypto$/, /^http$/, /^https$/, /^net$/, /^dns$/,
            /^util$/, /^stream$/, /^buffer$/, /^events$/, /^module$/,
            /^assert$/, /^querystring$/, /^zlib$/, /^tls$/, /^cluster$/,
            /^vm$/, /^perf_hooks$/, /^readline$/, /^repl$/, /^timers$/,
            /^string_decoder$/, /^worker_threads$/
        ];

        // Platform-specific exclusions
        const platformExclusions = platform === 'browser' ? [
            /^esbuild$/,             // esbuild is Node.js only
            /^typescript$/,          // TypeScript is typically build-time
            /^package$/,             // Invalid package name
            /^webpack$/, /^rollup$/, /^vite$/, // Build tools
        ] : [
            // For Node.js, we can exclude build tools and dev dependencies
            /^esbuild$/, /^typescript$/, /^webpack$/, /^rollup$/, /^vite$/,
            /^jest$/, /^mocha$/, /^chai$/, /^ava$/, /^tape$/,
            /^nodemon$/, /^pm2$/, /^forever$/,
            /^sass$/, /^less$/, /^stylus$/, /^postcss$/,
            /^fs-extra$/, /^chokidar$/
        ];

        const allExclusions = [...internalPatterns, ...alwaysExcluded, ...platformExclusions];
        return !allExclusions.some(pattern => pattern.test(packageName));
    }

    private generateImportMap(dependencies: Map<string, VendorDependency>, platform: Platform): ImportMap {
        const imports: Record<string, string> = {};

        // Add each dependency to import map
        for (const [pkgName] of dependencies) {
            const bundlePath = platform === 'node' ? './vendor.mjs' : './vendor.bundle.mjs';
            imports[pkgName] = bundlePath;
            // Also add subpath imports
            imports[`${pkgName}/*`] = bundlePath;
        }

        // Add fallback for common dependencies if none found
        if (Object.keys(imports).length === 0) {
            console.log('ℹ️ No external dependencies found, adding common fallbacks');
            const fallbackDeps = platform === 'browser'
                ? ['react', 'react-dom']
                : ['@libp2p/logger'];

            for (const dep of fallbackDeps) {
                const bundlePath = platform === 'node' ? './vendor.mjs' : './vendor.bundle.mjs';
                imports[dep] = bundlePath;
                imports[`${dep}/*`] = bundlePath;
            }
        }

        console.log(`🗺️ Generated ${platform} import map with ${Object.keys(imports).length} entries`);

        return {
            imports,
            scopes: {
                "./": {
                    ...imports
                }
            }
        };
    }

    private countAnalyzedFiles(): number {
        try {
            const sourceFiles = FileUtils.getAllFiles(this.projectRoot, ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs']);
            return sourceFiles.length;
        } catch {
            return 0;
        }
    }

    async getDependencyStats(platform: Platform = 'browser'): Promise<{
        totalDependencies: number;
        externalDependencies: number;
        packages: string[];
    }> {
        const analysis = await this.analyzeDependencies(platform);

        return {
            totalDependencies: analysis.dependencies.size,
            externalDependencies: Array.from(analysis.dependencies.values()).filter(dep => dep.isExternal).length,
            packages: Array.from(analysis.dependencies.keys()).sort()
        };
    }
}