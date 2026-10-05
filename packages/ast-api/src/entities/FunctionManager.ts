// src/entities/FunctionManager.ts

/**
 * Менеджер функций
 *
 * @module entities/FunctionManager
 * @description Управление функциями: поиск, фильтрация, сортировка, группировка
 *
 * @example
 * ```typescript
 * import { FunctionManager } from './FunctionManager.js';
 *
 * const manager = new FunctionManager(functionMap, callGraph);
 *
 * // Получить все функции
 * const all = manager.getAll();
 *
 * // Найти по имени
 * const fn = manager.findByName('runSemanticPipeline');
 *
 * // Фильтрация
 * const exported = manager.filter({ exported: true });
 *
 * // Сортировка
 * const sorted = manager.sortBy('name', 'asc');
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  ModuleId,
  FileId,
  CallEdgeWithMeta,
  CallerEdgeWithMeta,
} from '../types/index.js';
import type { CallGraph } from '../graph/CallGraph.js';
import type { IdNormalizer } from '../core/IdNormalizer.js';

// ==================== ТИПЫ ====================

/**
 * Опции фильтрации функций
 */
export interface FunctionFilterOptions {
  /**
   * ID модулей
   */
  moduleIds?: ModuleId[];

  /**
   * ID файлов
   */
  fileIds?: FileId[];

  /**
   * Имена функций (точное совпадение)
   */
  names?: string[];

  /**
   * Паттерн имени (RegExp)
   */
  namePattern?: RegExp;

  /**
   * Минимальная строка
   */
  minLine?: number;

  /**
   * Максимальная строка
   */
  maxLine?: number;

  /**
   * Флаги (битовые)
   */
  flags?: string[];

  /**
   * Только экспортированные
   */
  exported?: boolean;

  /**
   * Только асинхронные
   */
  async?: boolean;

  /**
   * Имеют вызовы
   */
  hasCalls?: boolean;

  /**
   * Вызываются
   */
  isCalled?: boolean;

  /**
   * Изолированные (нет вызовов и не вызываются)
   */
  isolated?: boolean;

  /**
   * Только с замыканиями
   */
  hasClosures?: boolean;

  /**
   * Минимальная сложность
   */
  minComplexity?: number;

  /**
   * Максимальная сложность
   */
  maxComplexity?: number;

  /**
   * Паттерн файла
   */
  filePattern?: RegExp;

  /**
   * Паттерн модуля
   */
  modulePattern?: RegExp;
}

/**
 * Опции сортировки
 */
export interface SortOptions {
  /**
   * Поле для сортировки
   */
  field: keyof FunctionEntity | 'calls' | 'callers' | 'imports' | 'complexity';

  /**
   * Направление
   */
  direction: 'asc' | 'desc';
}

/**
 * Опции группировки
 */
export interface GroupOptions {
  /**
   * Поле для группировки
   */
  by: 'module' | 'file' | 'moduleId' | 'fileId' | 'flags' | 'exported';
}

/**
 * Результат группировки
 */
export interface GroupResult<T> {
  key: string;
  items: T[];
  count: number;
}

/**
 * Статистика функций
 */
export interface FunctionStatistics {
  total: number;
  exported: number;
  async: number;
  withCalls: number;
  called: number;
  isolated: number;
  withClosures: number;
  averageCalls: number;
  maxCalls: number;
  totalCalls: number;
  byModule: Record<ModuleId, number>;
  byFile: Record<FileId, number>;
  byFlags: Record<string, number>;
}

/**
 * Результат поиска с релевантностью
 */
export interface SearchResult {
  function: FunctionEntity;
  score: number;
  matchedFields: string[];
}

/**
 * Функция с дополнительной информацией
 */
export interface FunctionWithMeta extends FunctionEntity {
  calls: CallEdgeWithMeta[];
  callers: CallerEdgeWithMeta[];
  callCount: number;
  callerCount: number;
  isExported: boolean;
  isAsync: boolean;
  isIsolated: boolean;
  complexity?: number;
}

export class FunctionManager {
  private functionMap: Map<FunctionId, FunctionEntity>;
  private callGraph: CallGraph | null;
  private idNormalizer: IdNormalizer | null;
  private cache = new Map<string, unknown>();

  /**
   * Индекс по имени
   */
  private nameIndex = new Map<string, FunctionId[]>();

  /**
   * Индекс по модулю
   */
  private moduleIndex = new Map<ModuleId, FunctionId[]>();

  /**
   * Индекс по файлу
   */
  private fileIndex = new Map<FileId, FunctionId[]>();

  /**
   * Индекс по флагам
   */
  private flagIndex = new Map<string, FunctionId[]>();

  constructor(
    functionMap: Map<FunctionId, FunctionEntity>,
    callGraph: CallGraph | null = null,
    idNormalizer: IdNormalizer | null = null
  ) {
    this.functionMap = functionMap;
    this.callGraph = callGraph;
    this.idNormalizer = idNormalizer;
    this.buildIndexes();
  }

  // ==================== ИНДЕКСАЦИЯ ====================

  /**
   * Построить индексы для быстрого поиска
   */
  buildIndexes(): this {
    this.nameIndex.clear();
    this.moduleIndex.clear();
    this.fileIndex.clear();
    this.flagIndex.clear();

    for (const [id, fn] of this.functionMap) {
      // Индекс по имени
      const nameKey = fn.name.toLowerCase();
      if (!this.nameIndex.has(nameKey)) {
        this.nameIndex.set(nameKey, []);
      }
      this.nameIndex.get(nameKey)!.push(id);

      // Индекс по модулю
      if (!this.moduleIndex.has(fn.moduleId)) {
        this.moduleIndex.set(fn.moduleId, []);
      }
      this.moduleIndex.get(fn.moduleId)!.push(id);

      // Индекс по файлу
      if (!this.fileIndex.has(fn.fileId)) {
        this.fileIndex.set(fn.fileId, []);
      }
      this.fileIndex.get(fn.fileId)!.push(id);

      // Индекс по флагам
      if (fn.flags) {
        for (const flag of fn.flags) {
          if (!this.flagIndex.has(flag)) {
            this.flagIndex.set(flag, []);
          }
          this.flagIndex.get(flag)!.push(id);
        }
      }
    }

    return this;
  }

  // ==================== ПОЛУЧЕНИЕ ====================

  /**
   * Получить функцию по ID
   */
  get(id: FunctionId | string | number): FunctionEntity | null {
    const normalizedId = this.normalizeId(id);
    return this.functionMap.get(normalizedId) || null;
  }

  /**
   * Проверить существование функции
   */
  has(id: FunctionId | string | number): boolean {
    const normalizedId = this.normalizeId(id);
    return this.functionMap.has(normalizedId);
  }

  /**
   * Получить все функции
   */
  getAll(): FunctionEntity[] {
    return Array.from(this.functionMap.values());
  }

  /**
   * Получить все ID функций
   */
  getAllIds(): FunctionId[] {
    return Array.from(this.functionMap.keys());
  }

  /**
   * Получить количество функций
   */
  size(): number {
    return this.functionMap.size;
  }

  // ==================== ПОИСК ====================

  /**
   * Найти функции по точному имени
   */
  findByName(name: string): FunctionEntity[] {
    const ids = this.nameIndex.get(name.toLowerCase()) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Поиск по части имени
   */
  searchByName(query: string): FunctionEntity[] {
    const q = query.toLowerCase();
    const results: FunctionEntity[] = [];

    for (const [, fn] of this.functionMap) {
      if (fn.name.toLowerCase().includes(q)) {
        results.push(fn);
      }
    }

    return results;
  }

  /**
   * Fuzzy-поиск по имени
   */
  fuzzySearch(query: string, threshold: number = 0): SearchResult[] {
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const [, fn] of this.functionMap) {
      const name = fn.name.toLowerCase();
      let score = 0;
      const matchedFields: string[] = [];

      // Точное совпадение
      if (name === q) {
        score = 100;
        matchedFields.push('name');
      }
      // Начинается с запроса
      else if (name.startsWith(q)) {
        score = 80;
        matchedFields.push('name');
      }
      // Содержит запрос
      else if (name.includes(q)) {
        score = 60;
        matchedFields.push('name');
      }
      // Содержит все буквы по порядку
      else {
        let idx = 0;
        for (const ch of q) {
          const pos = name.indexOf(ch, idx);
          if (pos === -1) {
            score = 0;
            break;
          }
          idx = pos + 1;
          score += 10;
        }
        if (score > 0) matchedFields.push('name');
      }

      // Поиск по модулю
      if (fn.module && fn.module.toLowerCase().includes(q)) {
        score += 20;
        matchedFields.push('module');
      }

      // Поиск по файлу
      if (fn.file && fn.file.toLowerCase().includes(q)) {
        score += 10;
        matchedFields.push('file');
      }

      if (score > threshold) {
        results.push({ function: fn, score, matchedFields });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Найти функции по модулю
   */
  findByModule(moduleId: ModuleId): FunctionEntity[] {
    const ids = this.moduleIndex.get(moduleId) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Найти функции по файлу
   */
  findByFile(fileId: FileId): FunctionEntity[] {
    const ids = this.fileIndex.get(fileId) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Найти функции по флагу
   */
  findByFlag(flag: string): FunctionEntity[] {
    const ids = this.flagIndex.get(flag) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Найти функции по нескольким флагам
   */
  findByFlags(flags: string[], matchAll: boolean = false): FunctionEntity[] {
    const results: FunctionEntity[] = [];

    for (const [, fn] of this.functionMap) {
      const fnFlags = fn.flags || '';
      const hasFlags = matchAll
        ? flags.every(f => fnFlags.includes(f))
        : flags.some(f => fnFlags.includes(f));

      if (hasFlags) {
        results.push(fn);
      }
    }

    return results;
  }

  // ==================== ФИЛЬТРАЦИЯ ====================

  /**
   * Фильтровать функции
   */
  filter(options: FunctionFilterOptions): FunctionEntity[] {
    const cacheKey = `filter_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as FunctionEntity[];
    }

    let results = this.getAll();

    // Фильтр по модулям
    if (options.moduleIds && options.moduleIds.length > 0) {
      const moduleSet = new Set(options.moduleIds);
      results = results.filter(fn => moduleSet.has(fn.moduleId));
    }

    // Фильтр по файлам
    if (options.fileIds && options.fileIds.length > 0) {
      const fileSet = new Set(options.fileIds);
      results = results.filter(fn => fileSet.has(fn.fileId));
    }

    // Фильтр по именам
    if (options.names && options.names.length > 0) {
      const nameSet = new Set(options.names);
      results = results.filter(fn => nameSet.has(fn.name));
    }

    // Фильтр по паттерну имени
    if (options.namePattern) {
      const pattern = options.namePattern;
      results = results.filter(fn => pattern.test(fn.name));
    }

    // Фильтр по строкам
    if (options.minLine !== undefined) {
      results = results.filter(fn => fn.line >= options.minLine!);
    }
    if (options.maxLine !== undefined) {
      results = results.filter(fn => fn.line <= options.maxLine!);
    }

    // Фильтр по флагам
    if (options.flags && options.flags.length > 0) {
      results = results.filter(fn => {
        const fnFlags = fn.flags || '';
        return options.flags!.every(f => fnFlags.includes(f));
      });
    }

    // Фильтр по экспорту
    if (options.exported !== undefined) {
      results = results.filter(fn => this.isExported(fn) === options.exported);
    }

    // Фильтр по асинхронности
    if (options.async !== undefined) {
      results = results.filter(fn => this.isAsync(fn) === options.async);
    }

    // Фильтр по наличию вызовов
    if (options.hasCalls !== undefined) {
      results = results.filter(fn => this.hasCalls(fn.id) === options.hasCalls);
    }

    // Фильтр по вызываемости
    if (options.isCalled !== undefined) {
      results = results.filter(fn => this.isCalled(fn.id) === options.isCalled);
    }

    // Фильтр по изолированности
    if (options.isolated !== undefined) {
      results = results.filter(fn => this.isIsolated(fn.id) === options.isolated);
    }

    // Фильтр по замыканиям
    if (options.hasClosures !== undefined) {
      results = results.filter(fn => this.hasClosures(fn.id) === options.hasClosures);
    }

    // Фильтр по паттерну файла
    if (options.filePattern) {
      const pattern = options.filePattern;
      results = results.filter(fn => pattern.test(fn.file));
    }

    // Фильтр по паттерну модуля
    if (options.modulePattern) {
      const pattern = options.modulePattern;
      results = results.filter(fn => pattern.test(fn.module));
    }

    this.cache.set(cacheKey, results);
    return results;
  }

  // ==================== СОРТИРОВКА ====================

  /**
   * Сортировать функции
   */
  sortBy(functions: FunctionEntity[], options: SortOptions): FunctionEntity[] {
    const sorted = [...functions];
    const { field, direction } = options;
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      switch (field) {
        case 'calls':
          valA = this.getCallCount(a.id);
          valB = this.getCallCount(b.id);
          break;
        case 'callers':
          valA = this.getCallerCount(a.id);
          valB = this.getCallerCount(b.id);
          break;
        case 'imports':
          valA = this.getImportCount(a.id);
          valB = this.getImportCount(b.id);
          break;
        case 'complexity':
          valA = this.getComplexity(a.id);
          valB = this.getComplexity(b.id);
          break;
        default:
          valA = a[field as keyof FunctionEntity];
          valB = b[field as keyof FunctionEntity];
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * multiplier;
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }
      return 0;
    });

    return sorted;
  }

  // ==================== ГРУППИРОВКА ====================

  /**
   * Группировать функции
   */
  groupBy(functions: FunctionEntity[], options: GroupOptions): GroupResult<FunctionEntity>[] {
    const groups = new Map<string, FunctionEntity[]>();

    for (const fn of functions) {
      let key: string;
      switch (options.by) {
        case 'module':
          key = fn.module || 'unknown';
          break;
        case 'file':
          key = fn.file || 'unknown';
          break;
        case 'moduleId':
          key = fn.moduleId;
          break;
        case 'fileId':
          key = fn.fileId;
          break;
        case 'flags':
          key = fn.flags || 'none';
          break;
        case 'exported':
          key = this.isExported(fn) ? 'exported' : 'internal';
          break;
        default:
          key = 'unknown';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(fn);
    }

    const result: GroupResult<FunctionEntity>[] = [];
    for (const [key, items] of groups) {
      result.push({ key, items, count: items.length });
    }

    result.sort((a, b) => b.count - a.count);
    return result;
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику
   */
  getStatistics(functions?: FunctionEntity[]): FunctionStatistics {
    const list = functions || this.getAll();
    const stats: FunctionStatistics = {
      total: list.length,
      exported: 0,
      async: 0,
      withCalls: 0,
      called: 0,
      isolated: 0,
      withClosures: 0,
      averageCalls: 0,
      maxCalls: 0,
      totalCalls: 0,
      byModule: {},
      byFile: {},
      byFlags: {},
    };

    let totalCalls = 0;
    let maxCalls = 0;

    for (const fn of list) {
      const isExported = this.isExported(fn);
      const isAsync = this.isAsync(fn);
      const callCount = this.getCallCount(fn.id);
      const isCalled = this.isCalled(fn.id);
      const hasCalls = this.hasCalls(fn.id);
      const isIsolated = this.isIsolated(fn.id);
      const hasClosures = this.hasClosures(fn.id);

      if (isExported) stats.exported++;
      if (isAsync) stats.async++;
      if (hasCalls) stats.withCalls++;
      if (isCalled) stats.called++;
      if (isIsolated) stats.isolated++;
      if (hasClosures) stats.withClosures++;

      totalCalls += callCount;
      if (callCount > maxCalls) maxCalls = callCount;

      // По модулям
      stats.byModule[fn.moduleId] = (stats.byModule[fn.moduleId] || 0) + 1;

      // По файлам
      stats.byFile[fn.fileId] = (stats.byFile[fn.fileId] || 0) + 1;

      // По флагам
      if (fn.flags) {
        for (const flag of fn.flags) {
          stats.byFlags[flag] = (stats.byFlags[flag] || 0) + 1;
        }
      }
    }

    stats.totalCalls = totalCalls;
    stats.averageCalls = list.length > 0 ? totalCalls / list.length : 0;
    stats.maxCalls = maxCalls;

    return stats;
  }

  // ==================== МЕТАДАННЫЕ ====================

  /**
   * Получить функцию с метаданными
   */
  getWithMeta(id: FunctionId | string | number): FunctionWithMeta | null {
    const normalizedId = this.normalizeId(id);
    const fn = this.functionMap.get(normalizedId);
    if (!fn) return null;

    const calls = this.getCalls(normalizedId);
    const callers = this.getCallers(normalizedId);

    return {
      ...fn,
      calls,
      callers,
      callCount: calls.length,
      callerCount: callers.length,
      isExported: this.isExported(fn),
      isAsync: this.isAsync(fn),
      isIsolated: this.isIsolated(normalizedId),
      complexity: this.getComplexity(normalizedId),
    };
  }

  /**
   * Получить все функции с метаданными
   */
  getAllWithMeta(): FunctionWithMeta[] {
    const result: FunctionWithMeta[] = [];
    for (const id of this.functionMap.keys()) {
      const item = this.getWithMeta(id);
      if (item) result.push(item);
    }
    return result;
  }

  // ==================== ПРОВЕРКИ ====================

  /**
   * Проверить, экспортирована ли функция
   */
  isExported(fn: FunctionEntity | FunctionId | string | number): boolean {
    const entity = typeof fn === 'object' && 'id' in fn ? fn : this.get(fn);
    if (!entity) return false;

    const flags = entity.flags || '';
    return flags.includes('e');
  }

  /**
   * Проверить, асинхронна ли функция
   */
  isAsync(fn: FunctionEntity | FunctionId | string | number): boolean {
    const entity = typeof fn === 'object' && 'id' in fn ? fn : this.get(fn);
    if (!entity) return false;

    const flags = entity.flags || '';
    return flags.includes('a');
  }

  /**
   * Проверить, есть ли у функции вызовы
   */
  hasCalls(id: FunctionId | string | number): boolean {
    if (!this.callGraph) return false;
    const normalizedId = this.normalizeId(id);
    const calls = this.callGraph.getCalls(normalizedId);
    return calls.length > 0;
  }

  /**
   * Проверить, вызывается ли функция
   */
  isCalled(id: FunctionId | string | number): boolean {
    if (!this.callGraph) return false;
    const normalizedId = this.normalizeId(id);
    const callers = this.callGraph.getCallers(normalizedId);
    return callers.length > 0;
  }

  /**
   * Проверить, изолирована ли функция
   */
  isIsolated(id: FunctionId | string | number): boolean {
    return !this.hasCalls(id) && !this.isCalled(id);
  }

  /**
   * Проверить, есть ли у функции замыкания
   */
  hasClosures(id: FunctionId | string | number): boolean {
    // Проверка через флаги или другие метаданные
    const fn = this.get(id);
    if (!fn) return false;

    const flags = fn.flags || '';
    return flags.includes('c');
  }

  // ==================== ПОЛУЧЕНИЕ ДАННЫХ ====================

  /**
   * Получить количество вызовов функции
   */
  getCallCount(id: FunctionId | string | number): number {
    if (!this.callGraph) return 0;
    const normalizedId = this.normalizeId(id);
    const calls = this.callGraph.getCalls(normalizedId);
    return calls.length;
  }

  /**
   * Получить количество вызывающих функций
   */
  getCallerCount(id: FunctionId | string | number): number {
    if (!this.callGraph) return 0;
    const normalizedId = this.normalizeId(id);
    const callers = this.callGraph.getCallers(normalizedId);
    return callers.length;
  }

  /**
   * Получить количество импортов функции
   */
  getImportCount(_id: FunctionId | string | number): number {
    // Реализация зависит от наличия ImportGraph
    return 0;
  }

  /**
   * Получить сложность функции
   */
  getComplexity(id: FunctionId | string | number): number {
    // Реализация зависит от наличия данных о сложности
    const fn = this.get(id);
    if (!fn) return 0;
    return (fn as any).complexity || 0;
  }

  /**
   * Получить вызовы функции
   */
  getCalls(id: FunctionId | string | number): CallEdgeWithMeta[] {
    if (!this.callGraph) return [];
    const normalizedId = this.normalizeId(id);
    return this.callGraph.getCalls(normalizedId);
  }

  /**
   * Получить вызывающие функции
   */
  getCallers(id: FunctionId | string | number): CallerEdgeWithMeta[] {
    if (!this.callGraph) return [];
    const normalizedId = this.normalizeId(id);
    return this.callGraph.getCallers(normalizedId);
  }

  // ==================== МЕТОДЫ ДЛЯ API ====================

  /**
   * Получить функции по модулю (для API)
   */
  getByModule(moduleId: ModuleId): FunctionEntity[] {
    const ids = this.moduleIndex.get(moduleId) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Получить функции по файлу (для API)
   */
  getByFile(fileId: FileId): FunctionEntity[] {
    const ids = this.fileIndex.get(fileId) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Получить функции по имени (для API)
   */
  getByName(name: string): FunctionEntity[] {
    const ids = this.nameIndex.get(name.toLowerCase()) || [];
    return ids.map(id => this.functionMap.get(id)!).filter(Boolean);
  }

  /**
   * Получить функции по паттерну имени (для API)
   */
  getByNamePattern(pattern: RegExp): FunctionEntity[] {
    const results: FunctionEntity[] = [];
    for (const [, fn] of this.functionMap) {
      if (pattern.test(fn.name)) {
        results.push(fn);
      }
    }
    return results;
  }

  // ==================== ТОП-СПИСКИ ====================

  /**
   * Получить самые вызываемые функции
   */
  getMostCalled(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    if (!this.callGraph) return [];

    const count = new Map<FunctionId, number>();
    const edges = this.callGraph.getEdges();

    for (const [, to] of edges) {
      const toId = this.normalizeId(to);
      if (this.functionMap.has(toId)) {
        count.set(toId, (count.get(toId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({ id, calls, function: this.functionMap.get(id) || null }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить функции, которые больше всего вызывают
   */
  getMostCalling(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    if (!this.callGraph) return [];

    const count = new Map<FunctionId, number>();
    const edges = this.callGraph.getEdges();

    for (const [from] of edges) {
      const fromId = this.normalizeId(from);
      if (this.functionMap.has(fromId)) {
        count.set(fromId, (count.get(fromId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({ id, calls, function: this.functionMap.get(id) || null }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить функции с наибольшей сложностью
   */
  getMostComplex(limit: number = 10): FunctionEntity[] {
    const withComplexity: (FunctionEntity & { complexity: number })[] = [];

    for (const fn of this.functionMap.values()) {
      const complexity = this.getComplexity(fn.id);
      if (complexity > 0) {
        withComplexity.push({ ...fn, complexity });
      }
    }

    return withComplexity.sort((a, b) => b.complexity - a.complexity).slice(0, limit);
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Нормализовать ID
   */
  private normalizeId(id: FunctionId | string | number): FunctionId {
    if (this.idNormalizer) {
      return this.idNormalizer.normalize(id);
    }
    return typeof id === 'string' && id.startsWith('fn') ? id : (String(id) as FunctionId);
  }

  /**
   * Получить исходную карту функций
   */
  getMap(): Map<FunctionId, FunctionEntity> {
    return this.functionMap;
  }

  /**
   * Очистить кеш
   */
  clearCache(): this {
    this.cache.clear();
    return this;
  }

  /**
   * Обновить индексы
   */
  refreshIndexes(): this {
    return this.buildIndexes();
  }

  // ==================== ЭКСПОРТ/ИМПОРТ ====================

  /**
   * Экспортировать состояние
   */
  exportState(): string {
    return JSON.stringify(
      {
        functions: Array.from(this.functionMap.entries()),
        nameIndex: Array.from(this.nameIndex.entries()),
        moduleIndex: Array.from(this.moduleIndex.entries()),
        fileIndex: Array.from(this.fileIndex.entries()),
        flagIndex: Array.from(this.flagIndex.entries()),
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
    this.functionMap = new Map(state.functions);
    this.nameIndex = new Map(state.nameIndex);
    this.moduleIndex = new Map(state.moduleIndex);
    this.fileIndex = new Map(state.fileIndex);
    this.flagIndex = new Map(state.flagIndex);
    return this;
  }

  /**
   * Создать клон
   */
  clone(): FunctionManager {
    const clone = new FunctionManager(new Map(this.functionMap), this.callGraph, this.idNormalizer);
    clone.nameIndex = new Map(this.nameIndex);
    clone.moduleIndex = new Map(this.moduleIndex);
    clone.fileIndex = new Map(this.fileIndex);
    clone.flagIndex = new Map(this.flagIndex);
    return clone;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать менеджер с настройками по умолчанию
 */
export function createDefaultFunctionManager(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph?: CallGraph,
  idNormalizer?: IdNormalizer
): FunctionManager {
  return new FunctionManager(functionMap, callGraph || null, idNormalizer || null);
}

/**
 * Создать менеджер только для чтения (без графа)
 */
export function createReadOnlyFunctionManager(
  functionMap: Map<FunctionId, FunctionEntity>
): FunctionManager {
  return new FunctionManager(functionMap, null, null);
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для FunctionManager
 */
export interface TestFunctionData {
  functionMap: Map<FunctionId, FunctionEntity>;
  expectedNames: string[];
  expectedCount: number;
}

/**
 * Создать тестовые данные
 */
export function createTestFunctionData(functions: FunctionEntity[]): TestFunctionData {
  const map = new Map<FunctionId, FunctionEntity>();
  const names: string[] = [];

  for (const fn of functions) {
    map.set(fn.id, fn);
    names.push(fn.name);
  }

  return {
    functionMap: map,
    expectedNames: names,
    expectedCount: functions.length,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default FunctionManager;
