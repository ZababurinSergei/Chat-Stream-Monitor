// /src/entities/FileManager.ts

/**
 * Менеджер файлов
 *
 * @module entities/FileManager
 * @description Управление файлами в AST отчете.
 * Предоставляет методы для поиска, фильтрации и группировки файлов.
 *
 * @example
 * ```typescript
 * import { FileManager } from './FileManager.js';
 *
 * const fileManager = new FileManager(fileMap);
 *
 * // Получить все файлы
 * const files = fileManager.getAll();
 *
 * // Поиск по пути
 * const tsFiles = fileManager.searchByExtension('.ts');
 *
 * // Группировка по директориям
 * const byDir = fileManager.groupByDirectory();
 * ```
 */

import type { FileId, FileEntity, FunctionId, FunctionEntity, ModuleId } from '../types/index.js';

// ==================== ТИПЫ ====================

/**
 * Опции для поиска файлов
 */
export interface FileSearchOptions {
  /**
   * Поиск по имени файла
   */
  name?: string;

  /**
   * Поиск по расширению
   */
  extension?: string | string[];

  /**
   * Поиск по пути (частичное совпадение)
   */
  path?: string;

  /**
   * Поиск по директории
   */
  directory?: string;

  /**
   * Регистронезависимый поиск
   * @default true
   */
  caseSensitive?: boolean;

  /**
   * Использовать регулярные выражения
   * @default false
   */
  useRegex?: boolean;

  /**
   * Максимальное количество результатов
   * @default 100
   */
  limit?: number;
}

/**
 * Результат поиска с метаданными
 */
export interface FileSearchResult extends FileEntity {
  /**
   * Количество функций в файле
   */
  functionCount: number;

  /**
   * ID функций в файле
   */
  functionIds: FunctionId[];

  /**
   * Размер файла (байты)
   */
  size?: number;

  /**
   * Строк кода в файле
   */
  linesOfCode?: number;
}

/**
 * Статистика по файлам
 */
export interface FileStats {
  /**
   * Общее количество файлов
   */
  total: number;

  /**
   * Количество файлов с функциями
   */
  withFunctions: number;

  /**
   * Количество файлов по расширениям
   */
  byExtension: Record<string, number>;

  /**
   * Количество файлов по директориям
   */
  byDirectory: Record<string, number>;

  /**
   * Среднее количество функций на файл
   */
  averageFunctions: number;

  /**
   * Максимальное количество функций в файле
   */
  maxFunctions: number;

  /**
   * Минимальное количество функций в файле
   */
  minFunctions: number;
}

/**
 * Группа файлов
 */
export interface FileGroup {
  /**
   * Ключ группы
   */
  key: string;

  /**
   * Файлы в группе
   */
  files: FileEntity[];

  /**
   * Количество файлов
   */
  count: number;

  /**
   * Общее количество функций в группе
   */
  totalFunctions: number;
}

/**
 * Дерево директорий
 */
export interface DirectoryTree {
  /**
   * Имя директории
   */
  name: string;

  /**
   * Полный путь
   */
  path: string;

  /**
   * Файлы в директории
   */
  files: FileEntity[];

  /**
   * Поддиректории
   */
  children: DirectoryTree[];

  /**
   * Количество файлов (включая поддиректории)
   */
  totalFiles: number;

  /**
   * Количество функций (включая поддиректории)
   */
  totalFunctions: number;
}

export class FileManager {
  private fileMap: Map<FileId, FileEntity>;
  private functionMap: Map<FunctionId, FunctionEntity> | null = null;

  /**
   * Индекс для быстрого поиска по расширениям
   */
  private extensionIndex = new Map<string, FileId[]>();

  /**
   * Индекс для быстрого поиска по директориям
   */
  private directoryIndex = new Map<string, FileId[]>();

  /**
   * Индекс для быстрого поиска по имени
   */
  private nameIndex = new Map<string, FileId[]>();

  /**
   * Кеш результатов поиска
   */
  private searchCache = new Map<string, FileEntity[]>();

  constructor(fileMap: Map<FileId, FileEntity>, functionMap?: Map<FunctionId, FunctionEntity>) {
    this.fileMap = fileMap;
    if (functionMap) {
      this.functionMap = functionMap;
    }
    this.buildIndexes();
  }

  // ==================== ИНДЕКСАЦИЯ ====================

  /**
   * Построить индексы для быстрого поиска
   */
  private buildIndexes(): void {
    this.extensionIndex.clear();
    this.directoryIndex.clear();
    this.nameIndex.clear();

    for (const [, file] of this.fileMap) {
      // Индекс по расширению
      const ext = file.extension || 'unknown';
      if (!this.extensionIndex.has(ext)) {
        this.extensionIndex.set(ext, []);
      }
      this.extensionIndex.get(ext)!.push(file.id);

      // Индекс по директории
      const dir = file.directory || '';
      if (!this.directoryIndex.has(dir)) {
        this.directoryIndex.set(dir, []);
      }
      this.directoryIndex.get(dir)!.push(file.id);

      // Индекс по имени
      const name = file.name.toLowerCase();
      if (!this.nameIndex.has(name)) {
        this.nameIndex.set(name, []);
      }
      this.nameIndex.get(name)!.push(file.id);
    }
  }

  /**
   * Обновить индексы
   */
  rebuildIndexes(): void {
    this.searchCache.clear();
    this.buildIndexes();
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

  /**
   * Получить файл по ID
   */
  get(id: FileId): FileEntity | null {
    return this.fileMap.get(id) || null;
  }

  /**
   * Получить все файлы
   */
  getAll(): FileEntity[] {
    return Array.from(this.fileMap.values());
  }

  /**
   * Проверить существование файла
   */
  has(id: FileId): boolean {
    return this.fileMap.has(id);
  }

  /**
   * Получить количество файлов
   */
  size(): number {
    return this.fileMap.size;
  }

  /**
   * Получить файлы по модулю
   */
  getByModule(moduleId: ModuleId): FileEntity[] {
    const result: FileEntity[] = [];
    // Находим все файлы, которые принадлежат модулю
    // (это требует связи с ModuleManager, но здесь используем прямой доступ)
    for (const [, file] of this.fileMap) {
      // Проверяем, принадлежит ли файл модулю по пути
      if (file.path.includes(moduleId) || file.directory.includes(moduleId)) {
        result.push(file);
      }
    }
    return result;
  }

  /**
   * Получить файлы по директории
   */
  getByDirectory(directory: string): FileEntity[] {
    const ids = this.directoryIndex.get(directory) || [];
    return ids.map(id => this.fileMap.get(id)!).filter(Boolean);
  }

  /**
   * Получить файлы по расширению
   */
  getByExtension(extension: string): FileEntity[] {
    const ext = extension.startsWith('.') ? extension.slice(1) : extension;
    const ids = this.extensionIndex.get(ext) || [];
    return ids.map(id => this.fileMap.get(id)!).filter(Boolean);
  }

  /**
   * Получить файлы по имени
   */
  getByName(name: string): FileEntity[] {
    const key = name.toLowerCase();
    const ids = this.nameIndex.get(key) || [];
    return ids.map(id => this.fileMap.get(id)!).filter(Boolean);
  }

  // ==================== ПОИСК ====================

  /**
   * Поиск файлов с фильтрами
   */
  search(options: FileSearchOptions): FileSearchResult[] {
    // Проверка кеша
    const cacheKey = JSON.stringify(options);
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey)!;
      return cached.map(file => this.enrichFileResult(file));
    }

    let results = this.getAll();
    const limit = options.limit || 100;
    const caseSensitive = options.caseSensitive ?? true;

    // Фильтр по имени
    if (options.name) {
      const pattern = options.useRegex
        ? new RegExp(options.name, caseSensitive ? 'g' : 'gi')
        : options.name;
      results = results.filter(file => {
        const name = caseSensitive ? file.name : file.name.toLowerCase();
        if (typeof pattern === 'string') {
          return caseSensitive ? name === pattern : name.toLowerCase() === pattern.toLowerCase();
        }
        return pattern.test(name);
      });
    }

    // Фильтр по расширению
    if (options.extension) {
      const extensions = Array.isArray(options.extension) ? options.extension : [options.extension];
      results = results.filter(file => {
        const ext = file.extension || 'unknown';
        return extensions.some(e => {
          const ext2 = e.startsWith('.') ? e.slice(1) : e;
          return ext === ext2;
        });
      });
    }

    // Фильтр по пути
    if (options.path) {
      const pattern = options.useRegex
        ? new RegExp(options.path, caseSensitive ? 'g' : 'gi')
        : options.path;
      results = results.filter(file => {
        const path = caseSensitive ? file.path : file.path.toLowerCase();
        if (typeof pattern === 'string') {
          return path.includes(pattern.toLowerCase());
        }
        return pattern.test(path);
      });
    }

    // Фильтр по директории
    if (options.directory) {
      const pattern = options.useRegex
        ? new RegExp(options.directory, caseSensitive ? 'g' : 'gi')
        : options.directory;
      results = results.filter(file => {
        const dir = caseSensitive ? file.directory : file.directory.toLowerCase();
        if (typeof pattern === 'string') {
          return dir.includes(pattern.toLowerCase());
        }
        return pattern.test(dir);
      });
    }

    // Ограничение результатов
    results = results.slice(0, limit);

    // Кеширование
    this.searchCache.set(cacheKey, results);

    return results.map(file => this.enrichFileResult(file));
  }

  /**
   * Обогатить результат поиска
   */
  private enrichFileResult(file: FileEntity): FileSearchResult {
    const functionIds = this.getFunctionIdsInFile(file.id);
    const functionCount = functionIds.length;

    return {
      ...file,
      functionCount,
      functionIds,
    };
  }

  /**
   * Получить ID функций в файле
   */
  getFunctionIdsInFile(fileId: FileId): FunctionId[] {
    if (!this.functionMap) return [];

    const result: FunctionId[] = [];
    for (const [id, fn] of this.functionMap) {
      if (fn.fileId === fileId) {
        result.push(id);
      }
    }
    return result;
  }

  /**
   * Получить функции в файле
   */
  getFunctionsInFile(fileId: FileId): FunctionEntity[] {
    if (!this.functionMap) return [];

    const ids = this.getFunctionIdsInFile(fileId);
    return ids
      .map(id => this.functionMap!.get(id))
      .filter((fn): fn is FunctionEntity => fn !== undefined);
  }

  // ==================== ПОИСК ПО ПАТТЕРНАМ ====================

  /**
   * Поиск файлов по расширению
   */
  searchByExtension(extension: string): FileEntity[] {
    return this.getByExtension(extension);
  }

  /**
   * Поиск файлов по имени (частичное совпадение)
   */
  searchByName(query: string, caseSensitive: boolean = false): FileEntity[] {
    const q = caseSensitive ? query : query.toLowerCase();
    const results: FileEntity[] = [];

    for (const [, file] of this.fileMap) {
      const name = caseSensitive ? file.name : file.name.toLowerCase();
      if (name.includes(q)) {
        results.push(file);
      }
    }

    return results;
  }

  /**
   * Поиск файлов по пути (частичное совпадение)
   */
  searchByPath(query: string, caseSensitive: boolean = false): FileEntity[] {
    const q = caseSensitive ? query : query.toLowerCase();
    const results: FileEntity[] = [];

    for (const [, file] of this.fileMap) {
      const path = caseSensitive ? file.path : file.path.toLowerCase();
      if (path.includes(q)) {
        results.push(file);
      }
    }

    return results;
  }

  /**
   * Поиск файлов по регулярному выражению
   */
  searchByRegex(pattern: RegExp): FileEntity[] {
    const results: FileEntity[] = [];

    for (const [, file] of this.fileMap) {
      if (pattern.test(file.path) || pattern.test(file.name)) {
        results.push(file);
      }
    }

    return results;
  }

  // ==================== ГРУППИРОВКА ====================

  /**
   * Группировка файлов по директориям
   */
  groupByDirectory(): FileGroup[] {
    const groups = new Map<string, FileEntity[]>();

    for (const file of this.fileMap.values()) {
      const dir = file.directory || 'root';
      if (!groups.has(dir)) {
        groups.set(dir, []);
      }
      groups.get(dir)!.push(file);
    }

    return Array.from(groups.entries())
      .map(([key, files]) => ({
        key,
        files,
        count: files.length,
        totalFunctions: this.countFunctionsInFiles(files),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Группировка файлов по расширениям
   */
  groupByExtension(): FileGroup[] {
    const groups = new Map<string, FileEntity[]>();

    for (const file of this.fileMap.values()) {
      const ext = file.extension || 'unknown';
      if (!groups.has(ext)) {
        groups.set(ext, []);
      }
      groups.get(ext)!.push(file);
    }

    return Array.from(groups.entries())
      .map(([key, files]) => ({
        key,
        files,
        count: files.length,
        totalFunctions: this.countFunctionsInFiles(files),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Группировка файлов по модулям
   */
  groupByModule(moduleMap: Map<ModuleId, { id: ModuleId; name: string }>): FileGroup[] {
    const groups = new Map<string, FileEntity[]>();

    for (const file of this.fileMap.values()) {
      let foundModule = false;
      for (const [modId, mod] of moduleMap) {
        if (file.path.includes(mod.name) || file.directory.includes(mod.name)) {
          if (!groups.has(modId)) {
            groups.set(modId, []);
          }
          groups.get(modId)!.push(file);
          foundModule = true;
          break;
        }
      }
      if (!foundModule) {
        if (!groups.has('other')) {
          groups.set('other', []);
        }
        groups.get('other')!.push(file);
      }
    }

    return Array.from(groups.entries())
      .map(([key, files]) => ({
        key,
        files,
        count: files.length,
        totalFunctions: this.countFunctionsInFiles(files),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ==================== ДЕРЕВО ДИРЕКТОРИЙ ====================

  /**
   * Построить дерево директорий
   */
  buildDirectoryTree(root: string = ''): DirectoryTree {
    const tree: DirectoryTree = {
      name: root || 'root',
      path: root || '/',
      files: [],
      children: [],
      totalFiles: 0,
      totalFunctions: 0,
    };

    const children = new Map<string, DirectoryTree>();

    for (const file of this.fileMap.values()) {
      const relativePath = root ? file.path.replace(root, '').replace(/^\//, '') : file.path;
      const parts = relativePath.split('/');

      if (parts.length === 1) {
        // Файл в корне
        tree.files.push(file);
      } else {
        // Файл в поддиректории
        const dirName = parts[0];
        if (!dirName) continue; // Пропускаем, если имя директории не определено

        const subPath = root ? `${root}/${dirName}` : dirName;

        if (!children.has(dirName)) {
          children.set(dirName, this.buildDirectoryTree(subPath));
        }
        const child = children.get(dirName)!;
        // Добавляем файл в поддерево (убираем первый сегмент пути)
        const remainingPath = parts.slice(1).join('/');
        const fileCopy = { ...file, path: remainingPath };
        child.files.push(fileCopy);
        // Добавляем файл в поддерево с правильным путем
        // (рекурсивно обновляем totalFiles и totalFunctions)
        this.updateTreeStats(child);
      }
    }

    tree.children = Array.from(children.values());
    tree.totalFiles = tree.files.length + tree.children.reduce((sum, c) => sum + c.totalFiles, 0);
    tree.totalFunctions =
      this.countFunctionsInFiles(tree.files) +
      tree.children.reduce((sum, c) => sum + c.totalFunctions, 0);

    return tree;
  }

  /**
   * Обновить статистику дерева
   */
  private updateTreeStats(tree: DirectoryTree): void {
    tree.totalFiles = tree.files.length + tree.children.reduce((sum, c) => sum + c.totalFiles, 0);
    tree.totalFunctions =
      this.countFunctionsInFiles(tree.files) +
      tree.children.reduce((sum, c) => sum + c.totalFunctions, 0);
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику по файлам
   */
  getStats(): FileStats {
    const files = this.getAll();
    const byExtension: Record<string, number> = {};
    const byDirectory: Record<string, number> = {};
    const functionCounts: number[] = [];

    for (const file of files) {
      const ext = file.extension || 'unknown';
      byExtension[ext] = (byExtension[ext] || 0) + 1;

      const dir = file.directory || 'root';
      byDirectory[dir] = (byDirectory[dir] || 0) + 1;

      const fnCount = this.getFunctionIdsInFile(file.id).length;
      functionCounts.push(fnCount);
    }

    const withFunctions = files.filter(f => this.getFunctionIdsInFile(f.id).length > 0).length;
    const total = files.length;
    const sum = functionCounts.reduce((a, b) => a + b, 0);
    const max = functionCounts.length > 0 ? Math.max(...functionCounts) : 0;
    const min = functionCounts.length > 0 ? Math.min(...functionCounts) : 0;

    return {
      total,
      withFunctions,
      byExtension,
      byDirectory,
      averageFunctions: total > 0 ? sum / total : 0,
      maxFunctions: max,
      minFunctions: min,
    };
  }

  /**
   * Подсчитать количество функций в файлах
   */
  private countFunctionsInFiles(files: FileEntity[]): number {
    let count = 0;
    for (const file of files) {
      count += this.getFunctionIdsInFile(file.id).length;
    }
    return count;
  }

  // ==================== ФИЛЬТРАЦИЯ ====================

  /**
   * Фильтр файлов по наличию функций
   */
  filterWithFunctions(): FileEntity[] {
    return this.getAll().filter(file => this.getFunctionIdsInFile(file.id).length > 0);
  }

  /**
   * Фильтр файлов без функций
   */
  filterWithoutFunctions(): FileEntity[] {
    return this.getAll().filter(file => this.getFunctionIdsInFile(file.id).length === 0);
  }

  /**
   * Фильтр файлов по расширению
   */
  filterByExtension(extensions: string | string[]): FileEntity[] {
    const exts = Array.isArray(extensions) ? extensions : [extensions];
    return this.getAll().filter(file => {
      const fileExt = file.extension || 'unknown';
      return exts.some(e => {
        const e2 = e.startsWith('.') ? e.slice(1) : e;
        return fileExt === e2;
      });
    });
  }

  /**
   * Фильтр файлов по директории
   */
  filterByDirectory(directories: string | string[]): FileEntity[] {
    const dirs = Array.isArray(directories) ? directories : [directories];
    return this.getAll().filter(file => {
      return dirs.some(dir => file.directory.includes(dir) || file.path.includes(dir));
    });
  }

  // ==================== КОНВЕРТАЦИЯ ====================

  /**
   * Получить пути всех файлов
   */
  getPaths(): string[] {
    return this.getAll().map(f => f.path);
  }

  /**
   * Получить имена всех файлов
   */
  getNames(): string[] {
    return this.getAll().map(f => f.name);
  }

  /**
   * Получить расширения всех файлов
   */
  getExtensions(): string[] {
    const set = new Set<string>();
    for (const file of this.fileMap.values()) {
      set.add(file.extension || 'unknown');
    }
    return Array.from(set);
  }

  /**
   * Получить директории всех файлов
   */
  getDirectories(): string[] {
    const set = new Set<string>();
    for (const file of this.fileMap.values()) {
      set.add(file.directory || 'root');
    }
    return Array.from(set);
  }

  // ==================== МЕТАДАННЫЕ ====================

  /**
   * Получить файл по пути
   */
  getByPath(path: string): FileEntity | null {
    for (const [, file] of this.fileMap) {
      if (file.path === path) {
        return file;
      }
    }
    return null;
  }

  /**
   * Получить файл по имени (первый найденный)
   */
  getByNameFirst(name: string): FileEntity | null {
    const files = this.getByName(name);
    return files.length > 0 ? (files[0] ?? null) : null;
  }

  /**
   * Проверить, является ли файл TypeScript файлом
   */
  isTypeScriptFile(file: FileEntity): boolean {
    const ext = file.extension || '';
    return ['.ts', '.tsx', '.mts', '.cts'].includes(ext) || ext === 'ts' || ext === 'tsx';
  }

  /**
   * Проверить, является ли файл JavaScript файлом
   */
  isJavaScriptFile(file: FileEntity): boolean {
    const ext = file.extension || '';
    return ['.js', '.jsx', '.mjs', '.cjs'].includes(ext) || ext === 'js' || ext === 'jsx';
  }

  /**
   * Проверить, является ли файл Vue файлом
   */
  isVueFile(file: FileEntity): boolean {
    const ext = file.extension || '';
    return ext === 'vue' || ext === '.vue';
  }

  // ==================== ОЧИСТКА И СБРОС ====================

  /**
   * Очистить кеш
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Сбросить состояние
   */
  reset(): void {
    this.searchCache.clear();
    this.extensionIndex.clear();
    this.directoryIndex.clear();
    this.nameIndex.clear();
  }

  /**
   * Обновить карту функций
   */
  setFunctionMap(functionMap: Map<FunctionId, FunctionEntity>): void {
    this.functionMap = functionMap;
    this.clearCache();
  }

  // ==================== КЛОНИРОВАНИЕ ====================

  /**
   * Создать клон менеджера
   */
  clone(): FileManager {
    const clone = new FileManager(
      new Map(this.fileMap),
      this.functionMap ? new Map(this.functionMap) : undefined
    );
    return clone;
  }

  // ==================== ЭКСПОРТ ====================

  /**
   * Экспортировать состояние в JSON
   */
  exportState(): string {
    return JSON.stringify(
      {
        files: Array.from(this.fileMap.entries()),
        indexes: {
          extensionIndex: Array.from(this.extensionIndex.entries()),
          directoryIndex: Array.from(this.directoryIndex.entries()),
          nameIndex: Array.from(this.nameIndex.entries()),
        },
      },
      null,
      2
    );
  }

  /**
   * Импортировать состояние из JSON
   */
  importState(json: string): void {
    const state = JSON.parse(json);
    this.fileMap = new Map(state.files);
    this.extensionIndex = new Map(state.indexes.extensionIndex);
    this.directoryIndex = new Map(state.indexes.directoryIndex);
    this.nameIndex = new Map(state.indexes.nameIndex);
    this.clearCache();
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Получить файлы с наибольшим количеством функций
   */
  getTopFilesByFunctionCount(limit: number = 10): FileSearchResult[] {
    const files = this.getAll();
    const results = files.map(file => this.enrichFileResult(file));
    return results.sort((a, b) => b.functionCount - a.functionCount).slice(0, limit);
  }

  /**
   * Получить файлы по сложности (количество функций)
   */
  getFilesByComplexity(minFunctions: number = 1, maxFunctions?: number): FileSearchResult[] {
    const files = this.getAll();
    const results = files.map(file => this.enrichFileResult(file));

    return results.filter(result => {
      if (result.functionCount < minFunctions) return false;
      if (maxFunctions !== undefined && result.functionCount > maxFunctions) return false;
      return true;
    });
  }

  /**
   * Получить уникальные расширения с количеством файлов
   */
  getExtensionStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const file of this.fileMap.values()) {
      const ext = file.extension || 'unknown';
      stats[ext] = (stats[ext] || 0) + 1;
    }
    return stats;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать FileManager с настройками по умолчанию
 */
export function createDefaultFileManager(
  fileMap: Map<FileId, FileEntity>,
  functionMap?: Map<FunctionId, FunctionEntity>
): FileManager {
  return new FileManager(fileMap, functionMap);
}

/**
 * Создать FileManager с предварительно загруженными данными
 */
export function createFileManagerFromData(
  files: FileEntity[],
  functions?: FunctionEntity[]
): FileManager {
  const fileMap = new Map<FileId, FileEntity>();
  for (const file of files) {
    fileMap.set(file.id, file);
  }

  let functionMap: Map<FunctionId, FunctionEntity> | undefined;
  if (functions) {
    functionMap = new Map<FunctionId, FunctionEntity>();
    for (const fn of functions) {
      functionMap.set(fn.id, fn);
    }
  }

  return new FileManager(fileMap, functionMap);
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default FileManager;

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для FileManager
 */
export interface TestFileData {
  fileMap: Map<FileId, FileEntity>;
  functionMap: Map<FunctionId, FunctionEntity>;
  expectedFiles: FileEntity[];
}

/**
 * Создать тестовые данные для FileManager
 */
export function createTestFileData(): TestFileData {
  const fileMap = new Map<FileId, FileEntity>();
  const functionMap = new Map<FunctionId, FunctionEntity>();

  // Создаем тестовые файлы
  const testFiles: FileEntity[] = [
    {
      id: 'f1',
      path: 'src/index.ts',
      name: 'index.ts',
      extension: 'ts',
      directory: 'src',
    },
    {
      id: 'f2',
      path: 'src/core/parser.ts',
      name: 'parser.ts',
      extension: 'ts',
      directory: 'src/core',
    },
    {
      id: 'f3',
      path: 'src/utils/helpers.js',
      name: 'helpers.js',
      extension: 'js',
      directory: 'src/utils',
    },
  ];

  for (const file of testFiles) {
    fileMap.set(file.id, file);
  }

  // Создаем тестовые функции
  const testFunctions: FunctionEntity[] = [
    {
      id: 'fn1',
      name: 'main',
      moduleId: 'm1',
      fileId: 'f1',
      line: 10,
      flags: 'e',
      module: 'src',
      file: 'src/index.ts',
      filePath: 'src/index.ts',
    },
    {
      id: 'fn2',
      name: 'parse',
      moduleId: 'm2',
      fileId: 'f2',
      line: 25,
      flags: 'e',
      module: 'core',
      file: 'src/core/parser.ts',
      filePath: 'src/core/parser.ts',
    },
    {
      id: 'fn3',
      name: 'helper',
      moduleId: 'm3',
      fileId: 'f3',
      line: 5,
      flags: 'e',
      module: 'utils',
      file: 'src/utils/helpers.js',
      filePath: 'src/utils/helpers.js',
    },
  ];

  for (const fn of testFunctions) {
    functionMap.set(fn.id, fn);
  }

  return {
    fileMap,
    functionMap,
    expectedFiles: testFiles,
  };
}
