// src/search/PathSearch.ts

/**
 * Поиск по путям файлов
 *
 * @module search/PathSearch
 * @description Поиск файлов и функций по путям файловой системы
 *
 * @example
 * ```typescript
 * import { PathSearch } from './PathSearch.js';
 *
 * const pathSearch = new PathSearch(fileMap);
 *
 * // Поиск файлов по пути
 * const files = pathSearch.searchByPath('src/core');
 *
 * // Поиск файлов по имени
 * const filesByName = pathSearch.searchByName('parser.ts');
 *
 * // Поиск функций по пути
 * const functions = pathSearch.getFunctionsByPath('src/semantic');
 * ```
 */

import type { FileId, FileEntity, FunctionEntity } from '../types/index.js';

// ==================== ТИПЫ ====================

/**
 * Опции для поиска по пути
 */
export interface PathSearchOptions {
  /**
   * Регистрочувствительный поиск
   * @default false
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
  maxResults?: number;

  /**
   * Сортировать результаты
   * @default true
   */
  sortResults?: boolean;

  /**
   * Поле для сортировки
   * @default 'path'
   */
  sortBy?: keyof FileEntity | 'score';

  /**
   * Направление сортировки
   * @default 'asc'
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Результат поиска с релевантностью
 */
export interface PathSearchResult extends FileEntity {
  /**
   * Оценка релевантности (0-100)
   */
  score: number;

  /**
   * Найденные совпадения
   */
  matches: {
    field: string;
    value: string;
    positions?: number[];
  }[];
}

/**
 * Статистика поиска
 */
export interface PathSearchStats {
  totalSearches: number;
  totalResults: number;
  averageResults: number;
  cacheHits: number;
  cacheMisses: number;
  searchTypes: {
    byPath: number;
    byName: number;
    byDirectory: number;
    byExtension: number;
  };
}

/**
 * Фильтр для поиска
 */
export interface PathFilter {
  /**
   * Включить файлы с этими расширениями
   */
  extensions?: string[];

  /**
   * Исключить файлы с этими расширениями
   */
  excludeExtensions?: string[];

  /**
   * Включить файлы из этих директорий
   */
  directories?: string[];

  /**
   * Исключить файлы из этих директорий
   */
  excludeDirectories?: string[];

  /**
   * Минимальный размер файла (байт)
   */
  minSize?: number;

  /**
   * Максимальный размер файла (байт)
   */
  maxSize?: number;
}

/**
 * Группировка результатов
 */
export interface PathGroup {
  key: string;
  files: FileEntity[];
  count: number;
}

/**
 * Статистика по файловой системе
 */
export interface FileSystemStats {
  totalFiles: number;
  totalDirectories: number;
  extensions: Record<string, number>;
  directories: Record<string, number>;
  largestFiles: FileEntity[];
  smallestFiles: FileEntity[];
  averageSize: number;
  totalSize: number;
}

export class PathSearch {
  private fileMap: Map<FileId, FileEntity>;
  private options: Required<PathSearchOptions>;

  /**
   * Индексы для быстрого поиска
   */
  private pathIndex = new Map<string, FileId[]>();
  private nameIndex = new Map<string, FileId[]>();
  private directoryIndex = new Map<string, FileId[]>();
  private extensionIndex = new Map<string, FileId[]>();

  /**
   * Кеш результатов
   */
  private cache = new Map<string, FileEntity[]>();

  /**
   * Статистика
   */
  private stats: PathSearchStats = {
    totalSearches: 0,
    totalResults: 0,
    averageResults: 0,
    cacheHits: 0,
    cacheMisses: 0,
    searchTypes: {
      byPath: 0,
      byName: 0,
      byDirectory: 0,
      byExtension: 0,
    },
  };

  /**
   * Функция для получения функций по файлу (внедряется извне)
   */
  private getFunctionsByFile?: (fileId: FileId) => FunctionEntity[];

  constructor(fileMap: Map<FileId, FileEntity>, options: PathSearchOptions = {}) {
    this.fileMap = fileMap;
    this.options = {
      caseSensitive: options.caseSensitive ?? false,
      useRegex: options.useRegex ?? false,
      maxResults: options.maxResults ?? 100,
      sortResults: options.sortResults ?? true,
      sortBy: options.sortBy ?? 'path',
      sortDirection: options.sortDirection ?? 'asc',
    };

    this.buildIndexes();
  }

  /**
   * Установить функцию для получения функций по файлу
   */
  setFunctionsGetter(getter: (fileId: FileId) => FunctionEntity[]): void {
    this.getFunctionsByFile = getter;
  }

  // ==================== ПОСТРОЕНИЕ ИНДЕКСОВ ====================

  /**
   * Построить все индексы
   */
  private buildIndexes(): void {
    this.pathIndex.clear();
    this.nameIndex.clear();
    this.directoryIndex.clear();
    this.extensionIndex.clear();

    for (const [, file] of this.fileMap) {
      // Индекс по пути
      this.addToPathIndex(file.path, file.id);

      // Индекс по имени
      this.addToNameIndex(file.name, file.id);

      // Индекс по директории
      this.addToDirectoryIndex(file.directory, file.id);

      // Индекс по расширению
      this.addToExtensionIndex(file.extension, file.id);
    }
  }

  /**
   * Добавить в индекс по пути
   */
  private addToPathIndex(path: string, fileId: FileId): void {
    const parts = path.split('/');
    for (let i = 0; i < parts.length; i++) {
      const partial = parts.slice(i).join('/');
      if (!this.pathIndex.has(partial)) {
        this.pathIndex.set(partial, []);
      }
      this.pathIndex.get(partial)!.push(fileId);
    }
  }

  /**
   * Добавить в индекс по имени
   */
  private addToNameIndex(name: string, fileId: FileId): void {
    const key = this.options.caseSensitive ? name : name.toLowerCase();
    if (!this.nameIndex.has(key)) {
      this.nameIndex.set(key, []);
    }
    this.nameIndex.get(key)!.push(fileId);
  }

  /**
   * Добавить в индекс по директории
   */
  private addToDirectoryIndex(directory: string, fileId: FileId): void {
    const key = this.options.caseSensitive ? directory : directory.toLowerCase();
    if (!this.directoryIndex.has(key)) {
      this.directoryIndex.set(key, []);
    }
    this.directoryIndex.get(key)!.push(fileId);
  }

  /**
   * Добавить в индекс по расширению
   */
  private addToExtensionIndex(extension: string, fileId: FileId): void {
    const key = this.options.caseSensitive ? extension : extension.toLowerCase();
    if (!this.extensionIndex.has(key)) {
      this.extensionIndex.set(key, []);
    }
    this.extensionIndex.get(key)!.push(fileId);
  }

  // ==================== ПОИСК ====================

  /**
   * Поиск файлов по пути (частичное совпадение)
   */
  searchByPath(query: string, options: Partial<PathSearchOptions> = {}): PathSearchResult[] {
    this.stats.totalSearches++;
    this.stats.searchTypes.byPath++;

    const mergedOptions = { ...this.options, ...options };
    const cacheKey = `path_${query}_${JSON.stringify(mergedOptions)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached as PathSearchResult[];
    }
    this.stats.cacheMisses++;

    const searchQuery = mergedOptions.caseSensitive ? query : query.toLowerCase();
    const results: PathSearchResult[] = [];
    const seen = new Set<FileId>();

    // Поиск в индексе
    for (const [indexKey, fileIds] of this.pathIndex) {
      const match = this.matchesQuery(indexKey, searchQuery, mergedOptions);
      if (match) {
        for (const fileId of fileIds) {
          if (!seen.has(fileId)) {
            seen.add(fileId);
            const file = this.fileMap.get(fileId)!;
            const score = this.calculatePathScore(file.path, query, mergedOptions);
            results.push({
              ...file,
              score,
              matches: this.findMatches(file.path, query, 'path', mergedOptions),
            });
          }
        }
      }
    }

    // Фильтрация
    const filtered = this.applyFilter(results);

    // Сортировка
    const sorted = mergedOptions.sortResults ? this.sortResults(filtered, mergedOptions) : filtered;

    // Ограничение
    const limited = sorted.slice(0, mergedOptions.maxResults);

    this.stats.totalResults += limited.length;
    this.stats.averageResults = this.stats.totalResults / this.stats.totalSearches;

    this.cache.set(cacheKey, limited);
    return limited;
  }

  /**
   * Поиск файлов по имени (без пути)
   */
  searchByName(query: string, options: Partial<PathSearchOptions> = {}): PathSearchResult[] {
    this.stats.totalSearches++;
    this.stats.searchTypes.byName++;

    const mergedOptions = { ...this.options, ...options };
    const cacheKey = `name_${query}_${JSON.stringify(mergedOptions)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached as PathSearchResult[];
    }
    this.stats.cacheMisses++;

    const searchQuery = mergedOptions.caseSensitive ? query : query.toLowerCase();
    const results: PathSearchResult[] = [];

    // Точное совпадение в индексе
    if (this.nameIndex.has(searchQuery)) {
      const fileIds = this.nameIndex.get(searchQuery)!;
      for (const fileId of fileIds) {
        const file = this.fileMap.get(fileId)!;
        results.push({
          ...file,
          score: 100,
          matches: [
            {
              field: 'name',
              value: file.name,
              positions: [0],
            },
          ],
        });
      }
    }

    // Частичное совпадение
    for (const [name, fileIds] of this.nameIndex) {
      const match = this.matchesQuery(name, searchQuery, mergedOptions);
      if (match && !this.nameIndex.has(searchQuery)) {
        for (const fileId of fileIds) {
          const file = this.fileMap.get(fileId)!;
          const score = this.calculateNameScore(file.name, query, mergedOptions);
          results.push({
            ...file,
            score,
            matches: this.findMatches(file.name, query, 'name', mergedOptions),
          });
        }
      }
    }

    // Удаляем дубликаты
    const unique = this.deduplicateResults(results);

    // Фильтрация
    const filtered = this.applyFilter(unique);

    // Сортировка
    const sorted = mergedOptions.sortResults ? this.sortResults(filtered, mergedOptions) : filtered;

    // Ограничение
    const limited = sorted.slice(0, mergedOptions.maxResults);

    this.stats.totalResults += limited.length;
    this.stats.averageResults = this.stats.totalResults / this.stats.totalSearches;

    this.cache.set(cacheKey, limited);
    return limited;
  }

  /**
   * Поиск файлов по директории
   */
  searchByDirectory(query: string, options: Partial<PathSearchOptions> = {}): PathSearchResult[] {
    this.stats.totalSearches++;
    this.stats.searchTypes.byDirectory++;

    const mergedOptions = { ...this.options, ...options };
    const cacheKey = `dir_${query}_${JSON.stringify(mergedOptions)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached as PathSearchResult[];
    }
    this.stats.cacheMisses++;

    const searchQuery = mergedOptions.caseSensitive ? query : query.toLowerCase();
    const results: PathSearchResult[] = [];

    // Точное совпадение
    if (this.directoryIndex.has(searchQuery)) {
      const fileIds = this.directoryIndex.get(searchQuery)!;
      for (const fileId of fileIds) {
        const file = this.fileMap.get(fileId)!;
        results.push({
          ...file,
          score: 100,
          matches: [
            {
              field: 'directory',
              value: file.directory,
              positions: [0],
            },
          ],
        });
      }
    }

    // Частичное совпадение
    for (const [dir, fileIds] of this.directoryIndex) {
      const match = this.matchesQuery(dir, searchQuery, mergedOptions);
      if (match && !this.directoryIndex.has(searchQuery)) {
        for (const fileId of fileIds) {
          const file = this.fileMap.get(fileId)!;
          const score = this.calculateDirectoryScore(file.directory, query, mergedOptions);
          results.push({
            ...file,
            score,
            matches: this.findMatches(file.directory, query, 'directory', mergedOptions),
          });
        }
      }
    }

    const unique = this.deduplicateResults(results);
    const filtered = this.applyFilter(unique);
    const sorted = mergedOptions.sortResults ? this.sortResults(filtered, mergedOptions) : filtered;
    const limited = sorted.slice(0, mergedOptions.maxResults);

    this.stats.totalResults += limited.length;
    this.stats.averageResults = this.stats.totalResults / this.stats.totalSearches;

    this.cache.set(cacheKey, limited);
    return limited;
  }

  /**
   * Поиск файлов по расширению
   */
  searchByExtension(extension: string, options: Partial<PathSearchOptions> = {}): FileEntity[] {
    this.stats.totalSearches++;
    this.stats.searchTypes.byExtension++;

    const mergedOptions = { ...this.options, ...options };
    const cacheKey = `ext_${extension}_${JSON.stringify(mergedOptions)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }
    this.stats.cacheMisses++;

    const searchExt = mergedOptions.caseSensitive ? extension : extension.toLowerCase();
    const results: FileEntity[] = [];

    if (this.extensionIndex.has(searchExt)) {
      const fileIds = this.extensionIndex.get(searchExt)!;
      for (const fileId of fileIds) {
        results.push(this.fileMap.get(fileId)!);
      }
    }

    this.stats.totalResults += results.length;
    this.stats.averageResults = this.stats.totalResults / this.stats.totalSearches;

    this.cache.set(cacheKey, results);
    return results;
  }

  // ==================== ПОИСК ФУНКЦИЙ ====================

  /**
   * Получить функции по пути файла
   */
  getFunctionsByPath(
    pathQuery: string,
    options: Partial<PathSearchOptions> = {}
  ): FunctionEntity[] {
    const files = this.searchByPath(pathQuery, options);
    const functions: FunctionEntity[] = [];

    for (const file of files) {
      if (this.getFunctionsByFile) {
        const fns = this.getFunctionsByFile(file.id);
        functions.push(...fns);
      }
    }

    return functions;
  }

  /**
   * Получить функции по имени файла
   */
  getFunctionsByName(
    nameQuery: string,
    options: Partial<PathSearchOptions> = {}
  ): FunctionEntity[] {
    const files = this.searchByName(nameQuery, options);
    const functions: FunctionEntity[] = [];

    for (const file of files) {
      if (this.getFunctionsByFile) {
        const fns = this.getFunctionsByFile(file.id);
        functions.push(...fns);
      }
    }

    return functions;
  }

  /**
   * Получить функции по директории
   */
  getFunctionsByDirectory(
    dirQuery: string,
    options: Partial<PathSearchOptions> = {}
  ): FunctionEntity[] {
    const files = this.searchByDirectory(dirQuery, options);
    const functions: FunctionEntity[] = [];

    for (const file of files) {
      if (this.getFunctionsByFile) {
        const fns = this.getFunctionsByFile(file.id);
        functions.push(...fns);
      }
    }

    return functions;
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Проверить совпадение с запросом
   */
  private matchesQuery(text: string, query: string, options: Required<PathSearchOptions>): boolean {
    if (options.useRegex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? '' : 'i');
        return regex.test(text);
      } catch {
        return false;
      }
    }

    const searchText = options.caseSensitive ? text : text.toLowerCase();
    return searchText.includes(query);
  }

  /**
   * Найти совпадения в тексте
   */
  private findMatches(
    text: string,
    query: string,
    field: string,
    options: Required<PathSearchOptions>
  ): { field: string; value: string; positions?: number[] }[] {
    const matches: { field: string; value: string; positions?: number[] }[] = [];

    if (options.useRegex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? '' : 'i');
        const match = regex.exec(text);
        if (match) {
          matches.push({
            field,
            value: match[0],
            positions: [match.index],
          });
        }
      } catch {
        // Игнорируем ошибки regex
      }
    } else {
      const searchText = options.caseSensitive ? text : text.toLowerCase();
      const searchQuery = options.caseSensitive ? query : query.toLowerCase();
      const index = searchText.indexOf(searchQuery);
      if (index !== -1) {
        matches.push({
          field,
          value: text.substring(index, index + query.length),
          positions: [index],
        });
      }
    }

    return matches;
  }

  /**
   * Вычислить оценку релевантности для пути
   */
  private calculatePathScore(
    path: string,
    query: string,
    options: Required<PathSearchOptions>
  ): number {
    const searchPath = options.caseSensitive ? path : path.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    // Точное совпадение
    if (searchPath === searchQuery) return 100;

    // Начинается с запроса
    if (searchPath.startsWith(searchQuery)) return 90;

    // Содержит запрос
    if (searchPath.includes(searchQuery)) {
      // Чем ближе к началу, тем выше балл
      const index = searchPath.indexOf(searchQuery);
      const proximity = 1 - index / searchPath.length;
      return Math.round(60 + 30 * proximity);
    }

    // Частичное совпадение по компонентам пути
    const pathParts = path.split('/');
    let maxScore = 0;
    for (const part of pathParts) {
      const partLower = options.caseSensitive ? part : part.toLowerCase();
      if (partLower === searchQuery) {
        maxScore = Math.max(maxScore, 80);
      } else if (partLower.includes(searchQuery)) {
        maxScore = Math.max(maxScore, 50);
      }
    }

    return maxScore;
  }

  /**
   * Вычислить оценку релевантности для имени
   */
  private calculateNameScore(
    name: string,
    query: string,
    options: Required<PathSearchOptions>
  ): number {
    const searchName = options.caseSensitive ? name : name.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    // Точное совпадение
    if (searchName === searchQuery) return 100;

    // Начинается с запроса
    if (searchName.startsWith(searchQuery)) return 90;

    // Содержит запрос
    if (searchName.includes(searchQuery)) {
      const index = searchName.indexOf(searchQuery);
      const proximity = 1 - index / searchName.length;
      return Math.round(60 + 30 * proximity);
    }

    // Расширение совпадает
    const ext = name.split('.').pop() || '';
    if (ext === query) return 70;
    if (ext.includes(query)) return 40;

    return 0;
  }

  /**
   * Вычислить оценку релевантности для директории
   */
  private calculateDirectoryScore(
    directory: string,
    query: string,
    options: Required<PathSearchOptions>
  ): number {
    const searchDir = options.caseSensitive ? directory : directory.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    // Точное совпадение
    if (searchDir === searchQuery) return 100;

    // Начинается с запроса
    if (searchDir.startsWith(searchQuery)) return 85;

    // Содержит запрос
    if (searchDir.includes(searchQuery)) {
      const index = searchDir.indexOf(searchQuery);
      const proximity = 1 - index / searchDir.length;
      return Math.round(50 + 35 * proximity);
    }

    // Частичное совпадение по компонентам
    const dirParts = directory.split('/');
    let maxScore = 0;
    for (const part of dirParts) {
      const partLower = options.caseSensitive ? part : part.toLowerCase();
      if (partLower === searchQuery) {
        maxScore = Math.max(maxScore, 75);
      } else if (partLower.includes(searchQuery)) {
        maxScore = Math.max(maxScore, 45);
      }
    }

    return maxScore;
  }

  /**
   * Применить фильтр к результатам
   */
  private applyFilter<T extends FileEntity>(results: T[]): T[] {
    return results;
  }

  /**
   * Удалить дубликаты результатов
   */
  private deduplicateResults<T extends { id: FileId }>(results: T[]): T[] {
    const seen = new Set<FileId>();
    return results.filter(result => {
      if (seen.has(result.id)) return false;
      seen.add(result.id);
      return true;
    });
  }

  /**
   * Сортировать результаты
   */
  private sortResults<T extends FileEntity | PathSearchResult>(
    results: T[],
    options: Required<PathSearchOptions>
  ): T[] {
    const sortBy = options.sortBy as string;
    const direction = options.sortDirection === 'asc' ? 1 : -1;

    return [...results].sort((a, b) => {
      // Если есть поле score, используем его для сортировки
      if (sortBy === 'score' && 'score' in a && 'score' in b) {
        return direction * (a.score - b.score);
      }

      // Сортировка по полю FileEntity
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction * aVal.localeCompare(bVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction * (aVal - bVal);
      }

      return 0;
    });
  }

  // ==================== ФИЛЬТРАЦИЯ ====================

  /**
   * Применить фильтр к поиску
   */
  applyFilterToSearch<T extends FileEntity>(results: T[], filter: PathFilter): T[] {
    return results.filter(file => {
      // Фильтр по расширению
      if (filter.extensions && filter.extensions.length > 0) {
        const ext = file.extension.toLowerCase();
        if (!filter.extensions.some(e => ext === e.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по исключенным расширениям
      if (filter.excludeExtensions && filter.excludeExtensions.length > 0) {
        const ext = file.extension.toLowerCase();
        if (filter.excludeExtensions.some(e => ext === e.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по директории
      if (filter.directories && filter.directories.length > 0) {
        const dir = file.directory.toLowerCase();
        if (!filter.directories.some(d => dir === d.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по исключенным директориям
      if (filter.excludeDirectories && filter.excludeDirectories.length > 0) {
        const dir = file.directory.toLowerCase();
        if (filter.excludeDirectories.some(d => dir === d.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  // ==================== ГРУППИРОВКА ====================

  /**
   * Группировка результатов по полю
   */
  groupResults<T extends FileEntity>(
    results: T[],
    groupBy: 'directory' | 'extension'
  ): PathGroup[] {
    const groups = new Map<string, T[]>();

    for (const result of results) {
      const key = groupBy === 'directory' ? result.directory : result.extension;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    }

    const grouped: PathGroup[] = [];
    for (const [key, files] of groups) {
      grouped.push({
        key,
        files,
        count: files.length,
      });
    }

    grouped.sort((a, b) => b.count - a.count);
    return grouped;
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику файловой системы
   */
  getFileSystemStats(): FileSystemStats {
    const files = Array.from(this.fileMap.values());
    const directories = new Set<string>();
    const extensions: Record<string, number> = {};
    const dirCounts: Record<string, number> = {};

    let totalSize = 0;

    for (const file of files) {
      // Директории
      directories.add(file.directory);
      dirCounts[file.directory] = (dirCounts[file.directory] || 0) + 1;

      // Расширения
      const ext = file.extension || 'unknown';
      extensions[ext] = (extensions[ext] || 0) + 1;

      // Размер (примерный)
      totalSize += file.size || 0;
    }

    const sortedBySize = [...files].sort((a, b) => (b.size || 0) - (a.size || 0));

    return {
      totalFiles: files.length,
      totalDirectories: directories.size,
      extensions,
      directories: dirCounts,
      largestFiles: sortedBySize.slice(0, 10),
      smallestFiles: sortedBySize.reverse().slice(0, 10),
      averageSize: files.length > 0 ? totalSize / files.length : 0,
      totalSize,
    };
  }

  /**
   * Получить статистику поиска
   */
  getStats(): PathSearchStats {
    return { ...this.stats };
  }

  /**
   * Сбросить статистику
   */
  resetStats(): void {
    this.stats = {
      totalSearches: 0,
      totalResults: 0,
      averageResults: 0,
      cacheHits: 0,
      cacheMisses: 0,
      searchTypes: {
        byPath: 0,
        byName: 0,
        byDirectory: 0,
        byExtension: 0,
      },
    };
  }

  // ==================== УПРАВЛЕНИЕ КЕШЕМ ====================

  /**
   * Очистить кеш
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получить размер кеша
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Получить все закешированные ключи
   */
  getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // ==================== ОПЦИИ ====================

  /**
   * Установить опции
   */
  setOptions(options: Partial<PathSearchOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    return this;
  }

  /**
   * Получить опции
   */
  getOptions(): PathSearchOptions {
    return { ...this.options };
  }

  /**
   * Перестроить индексы
   */
  rebuildIndexes(): this {
    this.buildIndexes();
    this.clearCache();
    return this;
  }

  // ==================== ЭКСПОРТ ====================

  /**
   * Экспортировать состояние
   */
  exportState(): string {
    return JSON.stringify(
      {
        options: this.options,
        stats: this.stats,
        pathIndex: Array.from(this.pathIndex.entries()),
        nameIndex: Array.from(this.nameIndex.entries()),
        directoryIndex: Array.from(this.directoryIndex.entries()),
        extensionIndex: Array.from(this.extensionIndex.entries()),
      },
      null,
      2
    );
  }

  /**
   * Импортировать состояние
   */
  importState(json: string): this {
    const state = JSON.parse(json);
    this.options = state.options;
    this.stats = state.stats;
    this.pathIndex = new Map(state.pathIndex);
    this.nameIndex = new Map(state.nameIndex);
    this.directoryIndex = new Map(state.directoryIndex);
    this.extensionIndex = new Map(state.extensionIndex);
    this.clearCache();
    return this;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать PathSearch с настройками по умолчанию
 */
export function createDefaultPathSearch(fileMap: Map<FileId, FileEntity>): PathSearch {
  return new PathSearch(fileMap, {
    caseSensitive: false,
    useRegex: false,
    maxResults: 100,
    sortResults: true,
    sortBy: 'path',
    sortDirection: 'asc',
  });
}

/**
 * Создать PathSearch для точного поиска
 */
export function createExactPathSearch(fileMap: Map<FileId, FileEntity>): PathSearch {
  return new PathSearch(fileMap, {
    caseSensitive: true,
    useRegex: false,
    maxResults: 50,
    sortResults: true,
    sortBy: 'path',
    sortDirection: 'asc',
  });
}

/**
 * Создать PathSearch для fuzzy-поиска
 */
export function createFuzzyPathSearch(fileMap: Map<FileId, FileEntity>): PathSearch {
  return new PathSearch(fileMap, {
    caseSensitive: false,
    useRegex: true,
    maxResults: 200,
    sortResults: true,
    sortBy: 'score',
    sortDirection: 'desc',
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для PathSearch
 */
export interface TestPathSearchData {
  query: string;
  expectedFiles: FileId[];
  expectedCount: number;
}

/**
 * Создать тестовые данные
 */
export function createTestPathSearchData(
  query: string,
  expectedFiles: FileId[]
): TestPathSearchData {
  return {
    query,
    expectedFiles,
    expectedCount: expectedFiles.length,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default PathSearch;
