// /tsgen-refactored/src/utils/file-utils.ts
import { unlinkSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class FileUtils {
    static readFile(path: string): string {
        return readFileSync(path, 'utf-8');
    }

    static writeFile(path: string, content: string): void {
        const dir = dirname(path);
        if (!existsSync(dir)) {
            // Рекурсивно создаем директории с помощью import
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(path, content, 'utf-8');
    }

    static exists(path: string): boolean {
        return existsSync(path);
    }

    static fileExists(path: string): boolean {
        return this.exists(path);
    }

    static readJson<T>(path: string): T | null {
        try {
            return JSON.parse(this.readFile(path));
        } catch {
            return null;
        }
    }

    static readJsonFile<T>(path: string): T | null {
        return this.readJson<T>(path);
    }

    static writeJson(path: string, data: unknown): void {
        this.writeFile(path, JSON.stringify(data, null, 2));
    }

    static getDirectories(path: string): string[] {
        if (!this.exists(path)) return [];

        return readdirSync(path, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }

    static findFiles(dir: string, pattern: RegExp): string[] {
        const files: string[] = [];

        function scanDirectory(currentDir: string) {
            if (!existsSync(currentDir)) return;

            const items = readdirSync(currentDir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = join(currentDir, item.name);

                if (item.isDirectory()) {
                    if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                        scanDirectory(fullPath);
                    }
                } else if (pattern.test(item.name)) {
                    files.push(fullPath);
                }
            }
        }

        scanDirectory(dir);
        return files;
    }

    static createDirectory(path: string): void {
        if (!this.exists(path)) {
            mkdirSync(path, { recursive: true });
        }
    }

    static getFileStats(path: string) {
        try {
            return statSync(path);
        } catch {
            return null;
        }
    }

    static isDirectory(path: string): boolean {
        const stats = this.getFileStats(path);
        return stats ? stats.isDirectory() : false;
    }

    static isFile(path: string): boolean {
        const stats = this.getFileStats(path);
        return stats ? stats.isFile() : false;
    }

    static copyFile(source: string, destination: string): void {
        const content = this.readFile(source);
        this.writeFile(destination, content);
    }

    static getAllFiles(dir: string, extensions?: string[]): string[] {
        const files: string[] = [];

        function scanDirectory(currentDir: string) {
            if (!existsSync(currentDir)) return;

            const items = readdirSync(currentDir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = join(currentDir, item.name);

                if (item.isDirectory()) {
                    if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                        scanDirectory(fullPath);
                    }
                } else {
                    if (!extensions || extensions.some(ext => item.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
        }

        scanDirectory(dir);
        return files;
    }

    static findUpwards(filename: string, startDir: string): string | null {
        let currentDir = startDir;

        while (currentDir !== dirname(currentDir)) {
            const filePath = join(currentDir, filename);
            if (existsSync(filePath)) {
                return filePath;
            }
            currentDir = dirname(currentDir);
        }

        return null;
    }

    static getRelativePath(from: string, to: string): string {
        return join(dirname(from), to);
    }

    static normalizePath(path: string): string {
        return path.replace(/\\\\/g, '/');
    }

    static removeFile(path: string): boolean {
        try {
            unlinkSync(path);
            return true;
        } catch {
            return false;
        }
    }

    static removeDirectory(path: string): boolean {
        try {
            rmSync(path, { recursive: true, force: true });
            return true;
        } catch {
            return false;
        }
    }
}