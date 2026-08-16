export declare class FileUtils {
    static readFile(path: string): string;
    static writeFile(path: string, content: string): void;
    static exists(path: string): boolean;
    static fileExists(path: string): boolean;
    static readJson<T>(path: string): T | null;
    static readJsonFile<T>(path: string): T | null;
    static writeJson(path: string, data: unknown): void;
    static getDirectories(path: string): string[];
    static findFiles(dir: string, pattern: RegExp): string[];
    static createDirectory(path: string): void;
    static getFileStats(path: string): import("fs").Stats | null;
    static isDirectory(path: string): boolean;
    static isFile(path: string): boolean;
    static copyFile(source: string, destination: string): void;
    static getAllFiles(dir: string, extensions?: string[]): string[];
    static findUpwards(filename: string, startDir: string): string | null;
    static getRelativePath(from: string, to: string): string;
    static normalizePath(path: string): string;
    static removeFile(path: string): boolean;
    static removeDirectory(path: string): boolean;
}
//# sourceMappingURL=file-utils.d.ts.map