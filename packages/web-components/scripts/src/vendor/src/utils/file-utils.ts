import { unlinkSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
export class FileUtils {
    static exists(path: string): boolean {
        return existsSync(path);
    }

    static ensureDir(path: string): void {
        if (!this.exists(path)) {
            mkdirSync(path, { recursive: true });
        }
    }

    static readFile(path: string): string {
        return readFileSync(path, 'utf8');
    }

    static writeFile(path: string, content: string): void {
        this.ensureDir(dirname(path));
        writeFileSync(path, content, 'utf8');
    }

    static readJson<T>(path: string): T | null {
        try {
            const content = this.readFile(path);
            return JSON.parse(content) as T;
        } catch (error) {
            console.warn(`❌ Failed to read JSON file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    static writeJson(path: string, data: unknown): void {
        this.writeFile(path, JSON.stringify(data, null, 2));
    }

    static getAllFiles(dir: string, extensions: string[] = []): string[] {
        const files: string[] = [];

        const scanDirectory = (currentDir: string): void => {
            if (!this.exists(currentDir)) {
                console.warn(`⚠️ Directory does not exist: ${currentDir}`);
                return;
            }

            try {
                const items = readdirSync(currentDir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = join(currentDir, item.name);

                    if (item.isDirectory()) {
                        // Skip node_modules, hidden directories, and common build directories
                        if (!item.name.startsWith('.') &&
                            item.name !== 'node_modules' &&
                            item.name !== 'dist' &&
                            item.name !== 'build' &&
                            item.name !== 'coverage') {
                            scanDirectory(fullPath);
                        }
                    } else if (item.isFile()) {
                        if (extensions.length === 0 || extensions.some(ext => item.name.endsWith(ext))) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`❌ Cannot read directory: ${currentDir}`, error instanceof Error ? error.message : 'Unknown error');
            }
        };

        scanDirectory(dir);
        return files;
    }

    static isDirectory(path: string): boolean {
        try {
            return statSync(path).isDirectory();
        } catch (error) {
            console.warn(`❌ Cannot check if path is directory: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    static getFileSize(path: string): number {
        try {
            return statSync(path).size;
        } catch (error) {
            console.warn(`❌ Cannot get file size: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return -1;
        }
    }

    static copyFile(source: string, destination: string): boolean {
        try {
            if (!this.exists(source)) {
                console.warn(`❌ Source file does not exist: ${source}`);
                return false;
            }

            this.ensureDir(dirname(destination));
            const content = readFileSync(source);
            writeFileSync(destination, content);
            console.log(`✅ Copied: ${source} → ${destination}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to copy file ${source} to ${destination}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    static deleteFile(path: string): boolean {
        try {
            if (!this.exists(path)) {
                return true;
            }

            unlinkSync(path);
            console.log(`🗑️ Deleted: ${path}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    static getRelativePath(from: string, to: string): string {
        return relative(from, to);
    }

    static resolvePath(...paths: string[]): string {
        return resolve(...paths);
    }

    static joinPaths(...paths: string[]): string {
        return join(...paths);
    }

    static getFileExtension(path: string): string {
        const ext = path.slice(path.lastIndexOf('.'));
        return ext || '';
    }

    static getFileNameWithoutExtension(path: string): string {
        const baseName = path.split('/').pop() || path.split('\\\\').pop() || path;
        return baseName.replace(/\.[^/.]+$/, '');
    }

    static getDirectoryContents(dir: string): { files: string[]; directories: string[] } {
        const files: string[] = [];
        const directories: string[] = [];

        if (!this.exists(dir)) {
            return { files, directories };
        }

        try {
            const items = readdirSync(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = join(dir, item.name);

                if (item.isDirectory()) {
                    directories.push(fullPath);
                } else if (item.isFile()) {
                    files.push(fullPath);
                }
            }

            return { files, directories };
        } catch (error) {
            console.error(`❌ Failed to read directory contents: ${dir}`, error instanceof Error ? error.message : 'Unknown error');
            return { files, directories };
        }
    }

    static createFileIfNotExists(path: string, defaultContent: string = ''): boolean {
        if (this.exists(path)) {
            return false;
        }

        try {
            this.writeFile(path, defaultContent);
            console.log(`📄 Created: ${path}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to create file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    static isTypeScriptFile(path: string): boolean {
        const ext = this.getFileExtension(path).toLowerCase();
        return ext === '.ts' || ext === '.tsx';
    }

    static isJavaScriptFile(path: string): boolean {
        const ext = this.getFileExtension(path).toLowerCase();
        return ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs';
    }

    static isSourceFile(path: string): boolean {
        this.getFileExtension(path).toLowerCase(); // Исправлено: удалена неиспользуемая переменная 'ext'
        return this.isTypeScriptFile(path) || this.isJavaScriptFile(path);
    }

    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static getFileStats(path: string): { size: number; created: Date; modified: Date } | null {
        try {
            const stats = statSync(path);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            console.warn(`❌ Cannot get file stats: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    static findFilesByPattern(dir: string, pattern: RegExp): string[] {
        const allFiles = this.getAllFiles(dir);
        return allFiles.filter(file => pattern.test(file));
    }

    static ensureFileStructure(files: Array<{ path: string; content: string }>): void {
        for (const file of files) {
            this.createFileIfNotExists(file.path, file.content);
        }
    }

    static backupFile(path: string, backupSuffix: string = '.backup'): boolean {
        if (!this.exists(path)) {
            return false;
        }

        try {
            const backupPath = path + backupSuffix;
            return this.copyFile(path, backupPath);
        } catch (error) {
            console.error(`❌ Failed to backup file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    static restoreBackup(path: string, backupSuffix: string = '.backup'): boolean {
        const backupPath = path + backupSuffix;

        if (!this.exists(backupPath)) {
            console.warn(`⚠️ Backup file does not exist: ${backupPath}`);
            return false;
        }

        try {
            return this.copyFile(backupPath, path);
        } catch (error) {
            console.error(`❌ Failed to restore backup for ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    // ДОБАВЛЕННЫЕ МЕТОДЫ ДЛЯ ИСПРАВЛЕНИЯ ОШИБОК

    static statSync(path: string) {
        return statSync(path);
    }

    static readDir(path: string) {
        return readdirSync(path, { withFileTypes: true });
    }

    static dirname(path: string) {
        return dirname(path);
    }
}