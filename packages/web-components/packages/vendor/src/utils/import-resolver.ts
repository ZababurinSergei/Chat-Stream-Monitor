/**
 * Import Resolver - Utility for resolving and fixing import paths
 * Handles module resolution for different file types and extensions
 */

import { FileUtils } from './file-utils';
import { dirname, join, extname, basename, resolve } from 'path';

export interface ImportInfo {
    original: string;
    path: string;
    fullMatch: string;
    type: 'from' | 'direct' | 'dynamic';
    line: number;
    column: number;
}

export interface ResolvedImport {
    originalPath: string;
    resolvedPath: string;
    isDirectory: boolean;
    fileExists: boolean;
    suggestedFix: string;
}

export class ImportResolver {
    constructor(private baseDir: string) {}

    /**
     * Extract all imports from file content
     */
    extractImports(content: string, _filePath: string): ImportInfo[] {
        const imports: ImportInfo[] = [];
        const lines = content.split('\n');

        // Patterns for different import types
        const patterns = [
            {
                regex: /from\s+['"]([^'"]+(?:\.[^'"]+)?)['"]/g,
                type: 'from' as const
            },
            {
                regex: /import\s+['"]([^'"]+(?:\.[^'"]+)?)['"]\s*;/g,
                type: 'direct' as const
            },
            {
                regex: /import\s*\(\s*['"]([^'"]+(?:\.[^'"]+)?)['"]\s*\)/g,
                type: 'dynamic' as const
            },
            {
                regex: /export\s+.*from\s+['"]([^'"]+(?:\.[^'"]+)?)['"]/g,
                type: 'from' as const
            }
        ];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // Skip if line is undefined or empty
            if (!line) continue;

            for (const pattern of patterns) {
                const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                let match: RegExpExecArray | null;
                while ((match = regex.exec(line)) !== null) {
                    const importPath = match[1];
                    if (!importPath) continue;

                    // Skip relative imports, absolute paths, and data URLs
                    if ((importPath.startsWith('.') || importPath.startsWith('/')) &&
                        !importPath.match(/\.(js|mjs|cjs|ts|tsx|json)$/)) {

                        imports.push({
                            original: importPath,
                            path: importPath,
                            fullMatch: match[0],
                            type: pattern.type,
                            line: lineIndex + 1,
                            column: match.index
                        });
                    }
                }
            }
        }

        return imports;
    }

    /**
     * Resolve import path to actual file
     */
    resolveImportPath(importPath: string, importingFile: string): ResolvedImport {
        const importingDir = dirname(importingFile);
        const fullImportPath = resolve(importingDir, importPath);

        let resolvedPath: string | null = null;
        let isDirectory = false;
        let fileExists = false;

        // Check if path exists as directory
        try {
            if (FileUtils.exists(fullImportPath)) {
                const stat = FileUtils.statSync(fullImportPath);
                isDirectory = stat.isDirectory();
                fileExists = true;
            }
        } catch (error) {
            console.warn(`⚠️ Cannot check path: ${fullImportPath}`, error);
        }

        if (isDirectory) {
            // For directories, check index files with different extensions
            const possibleFiles = [
                'index.js', 'index.mjs', 'index.cjs', 'index.ts', 'index.tsx'
            ];

            for (const file of possibleFiles) {
                const indexPath = join(fullImportPath, file);
                if (FileUtils.exists(indexPath)) {
                    // Determine correct extension for import
                    const ext = file === 'index.ts' || file === 'index.tsx' ? '.js' :
                        file === 'index.mjs' ? '.mjs' :
                            file === 'index.cjs' ? '.cjs' : '.js';
                    resolvedPath = importPath + '/index' + ext;
                    break;
                }
            }

            // If no index files found but directory exists
            if (!resolvedPath && fileExists) {
                resolvedPath = importPath + '/index.js'; // default
                console.warn(`⚠️ No index file found in directory: ${importPath}, using default`);
            }
        } else {
            // For files, check different extensions
            const possibleExtensions = ['.js', '.mjs', '.cjs', '.ts', '.tsx'];

            for (const ext of possibleExtensions) {
                const filePathWithExt = fullImportPath + ext;
                if (FileUtils.exists(filePathWithExt)) {
                    // Determine correct extension for import
                    const importExt = ext === '.ts' || ext === '.tsx' ? '.js' :
                        ext === '.mjs' ? '.mjs' :
                            ext === '.cjs' ? '.cjs' : '.js';
                    resolvedPath = importPath + importExt;
                    break;
                }
            }

            // Check file without additional extension (already has proper extension)
            if (!resolvedPath && FileUtils.exists(fullImportPath)) {
                // File already has extension - leave as is
                resolvedPath = importPath;
            }

            // If nothing found but file exists as TypeScript file
            if (!resolvedPath && FileUtils.exists(fullImportPath + '.ts')) {
                resolvedPath = importPath + '.js';
            }
        }

        return {
            originalPath: importPath,
            resolvedPath: resolvedPath || importPath,
            isDirectory,
            fileExists,
            suggestedFix: resolvedPath || importPath
        };
    }

    /**
     * Fix imports in file content
     */
    fixImportsInContent(content: string, filePath: string): { content: string; fixes: number } {
        const imports = this.extractImports(content, filePath);
        let fixedContent = content;
        let fixes = 0;

        for (const importInfo of imports) {
            const resolved = this.resolveImportPath(importInfo.path, filePath);

            if (resolved.resolvedPath && resolved.resolvedPath !== importInfo.path) {
                let newImport: string;
                switch (importInfo.type) {
                    case 'from':
                        newImport = `from '${resolved.resolvedPath}'`;
                        break;
                    case 'direct':
                        newImport = `import '${resolved.resolvedPath}';`;
                        break;
                    case 'dynamic':
                        newImport = `import('${resolved.resolvedPath}')`;
                        break;
                    default:
                        newImport = `from '${resolved.resolvedPath}'`;
                }

                fixedContent = fixedContent.replace(importInfo.fullMatch, newImport);
                fixes++;

                console.log(`🔧 Fixed import: '${importInfo.path}' -> '${resolved.resolvedPath}' in ${basename(filePath)}`);
            } else if (!resolved.fileExists) {
                console.warn(`⚠️ Could not resolve import: '${importInfo.path}' in ${filePath}`);
                console.warn(`   Full path: ${resolve(dirname(filePath), importInfo.path)}`);
                console.warn(`   Directory exists: ${FileUtils.exists(resolve(dirname(filePath), importInfo.path))}`);
            }
        }

        return { content: fixedContent, fixes };
    }

    /**
     * Process directory recursively to fix imports
     */
    processDirectory(dirPath: string): { totalFiles: number; totalFixes: number } {
        if (!FileUtils.exists(dirPath)) {
            return { totalFiles: 0, totalFixes: 0 };
        }

        let totalFiles = 0;
        let totalFixes = 0;

        const processItems = (currentDir: string) => {
            try {
                const items = FileUtils.readDir(currentDir);

                for (const item of items) {
                    const fullPath = join(currentDir, item.name);

                    if (item.isDirectory()) {
                        processItems(fullPath);
                    } else if (item.isFile() && item.name.endsWith('.js') && !item.name.endsWith('.d.ts')) {
                        const content = FileUtils.readFile(fullPath);
                        const result = this.fixImportsInContent(content, fullPath);
                        if (result.fixes > 0) {
                            FileUtils.writeFile(fullPath, result.content);
                            totalFixes += result.fixes;
                        }
                        totalFiles++;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot process directory ${currentDir}:`, error);
            }
        };

        processItems(dirPath);
        return { totalFiles, totalFixes };
    }

    /**
     * Analyze import structure for issues
     */
    analyzeImportStructure(dirPath: string): Array<{
        file: string;
        import: string;
        issue: string;
        resolved: boolean;
    }> {
        const importIssues: Array<{
            file: string;
            import: string;
            issue: string;
            resolved: boolean;
        }> = [];

        const checkFileImports = (filePath: string) => {
            if (!filePath.endsWith('.js')) return;

            const content = FileUtils.readFile(filePath);
            const imports = this.extractImports(content, filePath);

            for (const importInfo of imports) {
                const resolved = this.resolveImportPath(importInfo.path, filePath);

                if (!resolved.fileExists) {
                    importIssues.push({
                        file: filePath.replace(dirPath + '/', ''),
                        import: importInfo.path,
                        issue: 'File not found',
                        resolved: false
                    });
                } else if (resolved.isDirectory && !importInfo.path.endsWith('/index.js')) {
                    importIssues.push({
                        file: filePath.replace(dirPath + '/', ''),
                        import: importInfo.path,
                        issue: 'Directory import should point to index.js',
                        resolved: false
                    });
                }
            }
        };

        const traverseDirectory = (dir: string) => {
            if (!FileUtils.exists(dir)) return;

            try {
                const items = FileUtils.readDir(dir);

                for (const item of items) {
                    const fullPath = join(dir, item.name);

                    if (item.isDirectory() && item.name !== 'node_modules') {
                        traverseDirectory(fullPath);
                    } else if (item.isFile() && item.name.endsWith('.js')) {
                        checkFileImports(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot traverse directory ${dir}:`, error);
            }
        };

        traverseDirectory(dirPath);
        return importIssues;
    }

    /**
     * Convert kebab-case to camelCase for export names
     */
    kebabToCamel(str: string): string {
        return str.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    }

    /**
     * Create index files for directories with proper exports
     */
    createIndexFiles(dirPath: string): { created: number; updated: number } {
        if (!FileUtils.exists(dirPath)) {
            return { created: 0, updated: 0 };
        }

        let created = 0;
        let updated = 0;

        const processDirectory = (currentDir: string) => {
            try {
                const items = FileUtils.readDir(currentDir);

                // Find all JS/TS files for export
                const exportableFiles = items.filter(item => {
                    if (item.name === 'index.js' || item.name.endsWith('.d.ts') || item.name.endsWith('.map')) {
                        return false;
                    }

                    const fullPath = join(currentDir, item.name);
                    const stat = FileUtils.statSync(fullPath);

                    const ext = extname(item.name);
                    return ['.js', '.mjs', '.cjs', '.ts', '.tsx'].includes(ext) ||
                        (stat.isDirectory() && item.name !== 'node_modules' && !item.name.startsWith('.'));
                });

                // Create index.js if there are exportable files and no index.js exists
                if (exportableFiles.length > 0 && !items.some(item => item.name === 'index.js')) {
                    const exportStatements: string[] = [];

                    for (const file of exportableFiles) {
                        const fullPath = join(currentDir, file.name);
                        const stat = FileUtils.statSync(fullPath);

                        if (stat.isDirectory()) {
                            // For directories, check existence of index.js
                            const indexPath = join(fullPath, 'index.js');
                            if (FileUtils.exists(indexPath)) {
                                const dirName = this.kebabToCamel(file.name);
                                exportStatements.push(`export * from './${file.name}/index.js';`);
                                exportStatements.push(`export { default as ${dirName} } from './${file.name}/index.js';`);
                            } else {
                                console.warn(`⚠️ No index.js in directory: ${file.name}`);
                            }
                        } else {
                            // For files, remove extension and convert to camelCase
                            const baseName = basename(file.name, extname(file.name));
                            const camelCaseName = this.kebabToCamel(baseName);

                            // Check if file has default export
                            const fileContent = FileUtils.readFile(fullPath);
                            const hasDefaultExport = fileContent.includes('export default') ||
                                fileContent.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+\w+/);

                            if (hasDefaultExport) {
                                exportStatements.push(`export { default as ${camelCaseName} } from './${baseName}.js';`);
                            }

                            // Always add named exports
                            exportStatements.push(`export * from './${baseName}.js';`);
                        }
                    }

                    if (exportStatements.length > 0) {
                        const indexContent = `// Auto-generated index file\n${exportStatements.join('\n')}\n`;
                        FileUtils.writeFile(join(currentDir, 'index.js'), indexContent);
                        created++;
                        console.log(`📄 Created index.js in ${currentDir.replace(this.baseDir + '/', '')} with ${exportStatements.length} exports`);
                    }
                }

                // Recursively process subdirectories
                for (const item of items) {
                    const fullPath = join(currentDir, item.name);
                    const stat = FileUtils.statSync(fullPath);
                    if (stat.isDirectory() &&
                        item.name !== 'node_modules' &&
                        !item.name.startsWith('.')) {
                        processDirectory(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot process directory ${currentDir}:`, error);
            }
        };

        processDirectory(dirPath);
        return { created, updated };
    }

    /**
     * Get import statistics for a directory
     */
    getImportStatistics(dirPath: string): {
        totalFiles: number;
        totalImports: number;
        unresolvedImports: number;
        directoryImports: number;
        fixedImports: number;
    } {
        const stats = {
            totalFiles: 0,
            totalImports: 0,
            unresolvedImports: 0,
            directoryImports: 0,
            fixedImports: 0
        };

        const analyzeFile = (filePath: string) => {
            if (!filePath.endsWith('.js')) return;

            const content = FileUtils.readFile(filePath);
            const imports = this.extractImports(content, filePath);

            stats.totalFiles++;
            stats.totalImports += imports.length;

            for (const importInfo of imports) {
                const resolved = this.resolveImportPath(importInfo.path, filePath);

                if (!resolved.fileExists) {
                    stats.unresolvedImports++;
                } else if (resolved.isDirectory) {
                    stats.directoryImports++;
                }
            }
        };

        const traverseDirectory = (dir: string) => {
            if (!FileUtils.exists(dir)) return;

            try {
                const items = FileUtils.readDir(dir);

                for (const item of items) {
                    const fullPath = join(dir, item.name);

                    if (item.isDirectory() && item.name !== 'node_modules') {
                        traverseDirectory(fullPath);
                    } else if (item.isFile() && item.name.endsWith('.js')) {
                        analyzeFile(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot analyze directory ${dir}:`, error);
            }
        };

        traverseDirectory(dirPath);
        return stats;
    }
}