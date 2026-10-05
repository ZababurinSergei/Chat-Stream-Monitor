// /src/entities/ConstantManager.ts

/**
 * Менеджер констант
 *
 * @module entities/ConstantManager
 * @description Управление константами из AST-отчета:
 * - Поиск констант по ID, имени, модулю
 * - Фильтрация и группировка констант
 * - Статистика по константам
 * - Экспорт констант в различные форматы
 *
 * @example
 * ```typescript
 * import { ConstantManager } from './ConstantManager.js';
 *
 * const manager = new ConstantManager(constantMap);
 *
 * // Поиск константы
 * const constant = manager.get('c1');
 * const constants = manager.findByName('VERSION');
 *
 * // Группировка
 * const byModule = manager.groupByModule();
 * const byType = manager.groupByType();
 *
 * // Статистика
 * const stats = manager.getStats();
 * ```
 */

import type {
  ConstantId,
  ConstantEntity,
  ModuleId,
  FileId,
  FunctionId,
  ConstantType,
  ASTReport,
} from '../types/index.js';

// ==================== ТИПЫ ====================

/**
 * Опции для поиска констант
 */
export interface ConstantSearchOptions {
  /**
   * Поиск по точному совпадению имени
   * @default false
   */
  exactMatch?: boolean;

  /**
   * Учитывать регистр
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Тип константы
   */
  type?: ConstantType;

  /**
   * ID модуля
   */
  moduleId?: ModuleId;

  /**
   * ID файла
   */
  fileId?: FileId;

  /**
   * Минимальное значение (для числовых констант)
   */
  minValue?: number;

  /**
   * Максимальное значение (для числовых констант)
   */
  maxValue?: number;

  /**
   * Паттерн для значения
   */
  valuePattern?: RegExp;

  /**
   * Максимальное количество результатов
   * @default 100
   */
  limit?: number;

  /**
   * Сортировка
   */
  sortBy?: 'name' | 'value' | 'line' | 'module';

  /**
   * Направление сортировки
   * @default 'asc'
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Результат поиска констант
 */
export interface ConstantSearchResult {
  /**
   * Найденные константы
   */
  items: ConstantEntity[];

  /**
   * Общее количество (без учета limit)
   */
  total: number;

  /**
   * Время выполнения (мс)
   */
  executionTime: number;
}

/**
 * Статистика по константам
 */
export interface ConstantStats {
  /**
   * Общее количество констант
   */
  total: number;

  /**
   * Количество по модулям
   */
  byModule: Record<ModuleId, number>;

  /**
   * Количество по файлам
   */
  byFile: Record<FileId, number>;

  /**
   * Количество по типам
   */
  byType: Record<ConstantType, number>;

  /**
   * Количество по флагам
   */
  byFlags: Record<string, number>;

  /**
   * Среднее значение (для числовых)
   */
  averageValue?: number;

  /**
   * Минимальное значение (для числовых)
   */
  minValue?: number;

  /**
   * Максимальное значение (для числовых)
   */
  maxValue?: number;

  /**
   * Количество уникальных имен
   */
  uniqueNames: number;

  /**
   * Самые популярные имена
   */
  topNames: { name: string; count: number }[];
}

/**
 * Группа констант
 */
export interface ConstantGroup {
  /**
   * Ключ группы
   */
  key: string;

  /**
   * Константы в группе
   */
  items: ConstantEntity[];

  /**
   * Количество констант в группе
   */
  count: number;
}

/**
 * Константа с дополнительной информацией
 */
export interface ConstantWithUsage extends ConstantEntity {
  /**
   * Где используется константа
   */
  usedBy: {
    functionId: FunctionId;
    functionName: string;
    fileId: FileId;
    line: number;
  }[];

  /**
   * Количество использований
   */
  usageCount: number;

  /**
   * Является ли константа экспортированной
   */
  isExported: boolean;

  /**
   * Является ли константа импортированной
   */
  isImported: boolean;
}

/**
 * Константа для экспорта
 */
export interface ConstantExportData {
  /**
   * Версия формата
   */
  version: string;

  /**
   * Время экспорта
   */
  timestamp: string;

  /**
   * Метаданные
   */
  metadata: {
    total: number;
    modules: number;
    files: number;
    types: Record<string, number>;
  };

  /**
   * Константы
   */
  constants: ConstantEntity[];
}

export class ConstantManager {
  private constantMap: Map<ConstantId, ConstantEntity>;
  private nameIndex = new Map<string, ConstantId[]>();
  private moduleIndex = new Map<ModuleId, ConstantId[]>();
  private fileIndex = new Map<FileId, ConstantId[]>();
  private typeIndex = new Map<ConstantType, ConstantId[]>();
  private valueIndex = new Map<string, ConstantId[]>();

  /**
   * Кеш для быстрого поиска
   */
  private cache = new Map<string, unknown>();

  /**
   * Статистика вызовов
   */
  private callStats = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(constantMap: Map<ConstantId, ConstantEntity>) {
    this.constantMap = constantMap;
    this.buildIndexes();
  }

  // ==================== ПОСТРОЕНИЕ ИНДЕКСОВ ====================

  /**
   * Построить индексы для быстрого поиска
   */
  private buildIndexes(): void {
    this.nameIndex.clear();
    this.moduleIndex.clear();
    this.fileIndex.clear();
    this.typeIndex.clear();
    this.valueIndex.clear();

    for (const [id, constant] of this.constantMap) {
      // Индекс по имени
      const nameKey = constant.name.toLowerCase();
      if (!this.nameIndex.has(nameKey)) {
        this.nameIndex.set(nameKey, []);
      }
      this.nameIndex.get(nameKey)!.push(id);

      // Индекс по модулю
      if (!this.moduleIndex.has(constant.moduleId)) {
        this.moduleIndex.set(constant.moduleId, []);
      }
      this.moduleIndex.get(constant.moduleId)!.push(id);

      // Индекс по файлу
      if (!this.fileIndex.has(constant.fileId)) {
        this.fileIndex.set(constant.fileId, []);
      }
      this.fileIndex.get(constant.fileId)!.push(id);

      // Индекс по типу (из флагов)
      const type = this.extractTypeFromFlags(constant.flags);
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, []);
      }
      this.typeIndex.get(type)!.push(id);

      // Индекс по значению
      const valueKey = this.normalizeValue(constant.value);
      if (valueKey !== null) {
        if (!this.valueIndex.has(valueKey)) {
          this.valueIndex.set(valueKey, []);
        }
        this.valueIndex.get(valueKey)!.push(id);
      }
    }
  }

  /**
   * Извлечь тип из флагов
   */
  private extractTypeFromFlags(flags: string): ConstantType {
    if (flags.includes('enum')) return 'enum';
    if (flags.includes('config')) return 'config';
    return 'val';
  }

  /**
   * Нормализовать значение для индексации
   */
  private normalizeValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(v => String(v)).join('|');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return null;
      }
    }
    return null;
  }

  // ==================== ПОЛУЧЕНИЕ КОНСТАНТ ====================

  /**
   * Получить константу по ID
   */
  get(id: ConstantId | string): ConstantEntity | null {
    this.callStats.totalCalls++;

    if (this.cache.has(`get_${id}`)) {
      this.callStats.cacheHits++;
      return this.cache.get(`get_${id}`) as ConstantEntity | null;
    }
    this.callStats.cacheMisses++;

    const result = this.constantMap.get(id as ConstantId) || null;
    this.cache.set(`get_${id}`, result);
    return result;
  }

  /**
   * Получить все константы
   */
  getAll(): ConstantEntity[] {
    this.callStats.totalCalls++;

    if (this.cache.has('getAll')) {
      this.callStats.cacheHits++;
      return this.cache.get('getAll') as ConstantEntity[];
    }
    this.callStats.cacheMisses++;

    const result = Array.from(this.constantMap.values());
    this.cache.set('getAll', result);
    return result;
  }

  /**
   * Получить константы по модулю
   */
  getByModule(moduleId: ModuleId): ConstantEntity[] {
    this.callStats.totalCalls++;

    const cacheKey = `getByModule_${moduleId}`;
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as ConstantEntity[];
    }
    this.callStats.cacheMisses++;

    const ids = this.moduleIndex.get(moduleId) || [];
    const result = ids
      .map(id => this.constantMap.get(id))
      .filter((c): c is ConstantEntity => c !== undefined);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Получить константы по файлу
   */
  getByFile(fileId: FileId): ConstantEntity[] {
    this.callStats.totalCalls++;

    const cacheKey = `getByFile_${fileId}`;
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as ConstantEntity[];
    }
    this.callStats.cacheMisses++;

    const ids = this.fileIndex.get(fileId) || [];
    const result = ids
      .map(id => this.constantMap.get(id))
      .filter((c): c is ConstantEntity => c !== undefined);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Получить константы по типу
   */
  getByType(type: ConstantType): ConstantEntity[] {
    this.callStats.totalCalls++;

    const cacheKey = `getByType_${type}`;
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as ConstantEntity[];
    }
    this.callStats.cacheMisses++;

    const ids = this.typeIndex.get(type) || [];
    const result = ids
      .map(id => this.constantMap.get(id))
      .filter((c): c is ConstantEntity => c !== undefined);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ==================== ПОИСК КОНСТАНТ ====================

  /**
   * Найти константу по имени
   */
  findByName(name: string, options: ConstantSearchOptions = {}): ConstantSearchResult {
    const startTime = Date.now();
    this.callStats.totalCalls++;

    const {
      exactMatch = false,
      caseSensitive = false,
      type,
      moduleId,
      fileId,
      minValue,
      maxValue,
      valuePattern,
      limit = 100,
      sortBy = 'name',
      sortDirection = 'asc',
    } = options;

    let results: ConstantEntity[] = [];

    // Поиск по индексу
    const nameKey = caseSensitive ? name : name.toLowerCase();
    const ids = this.nameIndex.get(nameKey) || [];
    results = ids
      .map(id => this.constantMap.get(id))
      .filter((c): c is ConstantEntity => c !== undefined);

    // Если точное совпадение не требуется, ищем частичное совпадение
    if (!exactMatch && results.length === 0) {
      const searchName = caseSensitive ? name : name.toLowerCase();
      for (const [key, ids] of this.nameIndex) {
        const matchKey = caseSensitive ? key : key.toLowerCase();
        if (matchKey.includes(searchName)) {
          const constants = ids
            .map(id => this.constantMap.get(id))
            .filter((c): c is ConstantEntity => c !== undefined);
          results.push(...constants);
        }
      }
      // Убираем дубликаты
      const seen = new Set<ConstantId>();
      results = results.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    }

    // Фильтрация по типу
    if (type) {
      results = results.filter(c => this.extractTypeFromFlags(c.flags) === type);
    }

    // Фильтрация по модулю
    if (moduleId) {
      results = results.filter(c => c.moduleId === moduleId);
    }

    // Фильтрация по файлу
    if (fileId) {
      results = results.filter(c => c.fileId === fileId);
    }

    // Фильтрация по значению (числовые)
    if (minValue !== undefined || maxValue !== undefined) {
      results = results.filter(c => {
        if (typeof c.value !== 'number') return false;
        if (minValue !== undefined && c.value < minValue) return false;
        if (maxValue !== undefined && c.value > maxValue) return false;
        return true;
      });
    }

    // Фильтрация по паттерну значения
    if (valuePattern) {
      results = results.filter(c => {
        const str = String(c.value);
        return valuePattern.test(str);
      });
    }

    // Сортировка
    results = this.sortResults(results, sortBy, sortDirection);

    // Ограничение
    const total = results.length;
    const items = results.slice(0, limit);

    return {
      items,
      total,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Найти константы по значению
   */
  findByValue(value: unknown): ConstantEntity[] {
    this.callStats.totalCalls++;

    const valueKey = this.normalizeValue(value);
    if (valueKey === null) return [];

    const cacheKey = `findByValue_${valueKey}`;
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as ConstantEntity[];
    }
    this.callStats.cacheMisses++;

    const ids = this.valueIndex.get(valueKey) || [];
    const result = ids
      .map(id => this.constantMap.get(id))
      .filter((c): c is ConstantEntity => c !== undefined);

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Поиск констант с паттерном в имени
   */
  searchByName(
    pattern: string | RegExp,
    options: ConstantSearchOptions = {}
  ): ConstantSearchResult {
    const startTime = Date.now();
    this.callStats.totalCalls++;

    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    const results: ConstantEntity[] = [];

    for (const constant of this.constantMap.values()) {
      if (regex.test(constant.name)) {
        results.push(constant);
      }
    }

    const { type, moduleId, fileId, limit = 100, sortBy = 'name', sortDirection = 'asc' } = options;

    // Фильтрация
    let filtered = results;
    if (type) {
      filtered = filtered.filter(c => this.extractTypeFromFlags(c.flags) === type);
    }
    if (moduleId) {
      filtered = filtered.filter(c => c.moduleId === moduleId);
    }
    if (fileId) {
      filtered = filtered.filter(c => c.fileId === fileId);
    }

    // Сортировка
    filtered = this.sortResults(filtered, sortBy, sortDirection);

    return {
      items: filtered.slice(0, limit),
      total: filtered.length,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Поиск констант с паттерном в значении
   */
  searchByValue(pattern: string | RegExp): ConstantEntity[] {
    this.callStats.totalCalls++;

    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    const results: ConstantEntity[] = [];

    for (const constant of this.constantMap.values()) {
      const str = String(constant.value);
      if (regex.test(str)) {
        results.push(constant);
      }
    }

    return results;
  }

  // ==================== ГРУППИРОВКА ====================

  /**
   * Сгруппировать константы по модулю
   */
  groupByModule(): ConstantGroup[] {
    this.callStats.totalCalls++;

    if (this.cache.has('groupByModule')) {
      this.callStats.cacheHits++;
      return this.cache.get('groupByModule') as ConstantGroup[];
    }
    this.callStats.cacheMisses++;

    const groups = new Map<ModuleId, ConstantEntity[]>();

    for (const constant of this.constantMap.values()) {
      if (!groups.has(constant.moduleId)) {
        groups.set(constant.moduleId, []);
      }
      groups.get(constant.moduleId)!.push(constant);
    }

    const result: ConstantGroup[] = [];
    for (const [key, items] of groups) {
      result.push({
        key,
        items,
        count: items.length,
      });
    }

    result.sort((a, b) => b.count - a.count);
    this.cache.set('groupByModule', result);
    return result;
  }

  /**
   * Сгруппировать константы по типу
   */
  groupByType(): ConstantGroup[] {
    this.callStats.totalCalls++;

    if (this.cache.has('groupByType')) {
      this.callStats.cacheHits++;
      return this.cache.get('groupByType') as ConstantGroup[];
    }
    this.callStats.cacheMisses++;

    const groups = new Map<ConstantType, ConstantEntity[]>();

    for (const constant of this.constantMap.values()) {
      const type = this.extractTypeFromFlags(constant.flags);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(constant);
    }

    const result: ConstantGroup[] = [];
    for (const [key, items] of groups) {
      result.push({
        key,
        items,
        count: items.length,
      });
    }

    result.sort((a, b) => b.count - a.count);
    this.cache.set('groupByType', result);
    return result;
  }

  /**
   * Сгруппировать константы по файлу
   */
  groupByFile(): ConstantGroup[] {
    this.callStats.totalCalls++;

    if (this.cache.has('groupByFile')) {
      this.callStats.cacheHits++;
      return this.cache.get('groupByFile') as ConstantGroup[];
    }
    this.callStats.cacheMisses++;

    const groups = new Map<FileId, ConstantEntity[]>();

    for (const constant of this.constantMap.values()) {
      if (!groups.has(constant.fileId)) {
        groups.set(constant.fileId, []);
      }
      groups.get(constant.fileId)!.push(constant);
    }

    const result: ConstantGroup[] = [];
    for (const [key, items] of groups) {
      result.push({
        key,
        items,
        count: items.length,
      });
    }

    result.sort((a, b) => b.count - a.count);
    this.cache.set('groupByFile', result);
    return result;
  }

  /**
   * Сгруппировать константы по пользовательскому ключу
   */
  groupBy(key: keyof ConstantEntity): ConstantGroup[] {
    this.callStats.totalCalls++;

    const cacheKey = `groupBy_${String(key)}`;
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as ConstantGroup[];
    }
    this.callStats.cacheMisses++;

    const groups = new Map<string, ConstantEntity[]>();

    for (const constant of this.constantMap.values()) {
      const groupKey = String(constant[key] ?? 'unknown');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(constant);
    }

    const result: ConstantGroup[] = [];
    for (const [key, items] of groups) {
      result.push({
        key,
        items,
        count: items.length,
      });
    }

    result.sort((a, b) => b.count - a.count);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику по константам
   */
  getStats(): ConstantStats {
    this.callStats.totalCalls++;

    if (this.cache.has('getStats')) {
      this.callStats.cacheHits++;
      return this.cache.get('getStats') as ConstantStats;
    }
    this.callStats.cacheMisses++;

    const byModule: Record<ModuleId, number> = {};
    const byFile: Record<FileId, number> = {};
    const byType: Record<ConstantType, number> = {
      val: 0,
      enum: 0,
      config: 0,
    };
    const byFlags: Record<string, number> = {};
    const names = new Set<string>();
    const nameCount: Record<string, number> = {};
    const numericValues: number[] = [];

    for (const constant of this.constantMap.values()) {
      // По модулю
      byModule[constant.moduleId] = (byModule[constant.moduleId] || 0) + 1;

      // По файлу
      byFile[constant.fileId] = (byFile[constant.fileId] || 0) + 1;

      // По типу
      const type = this.extractTypeFromFlags(constant.flags);
      byType[type] = (byType[type] || 0) + 1;

      // По флагам
      const flags = constant.flags || 'none';
      byFlags[flags] = (byFlags[flags] || 0) + 1;

      // Имена
      names.add(constant.name);
      nameCount[constant.name] = (nameCount[constant.name] || 0) + 1;

      // Числовые значения
      if (typeof constant.value === 'number') {
        numericValues.push(constant.value);
      }
    }

    // Топ имена
    const topNames = Object.entries(nameCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    let averageValue: number | undefined;
    let minValue: number | undefined;
    let maxValue: number | undefined;

    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      averageValue = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      minValue = sorted[0];
      maxValue = sorted[sorted.length - 1];
    }

    const result: ConstantStats = {
      total: this.constantMap.size,
      byModule,
      byFile,
      byType,
      byFlags,
      uniqueNames: names.size,
      topNames,
      averageValue,
      minValue,
      maxValue,
    };

    this.cache.set('getStats', result);
    return result;
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Сортировка результатов
   */
  private sortResults(
    items: ConstantEntity[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): ConstantEntity[] {
    return [...items].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'value':
          aVal = typeof a.value === 'number' ? a.value : String(a.value);
          bVal = typeof b.value === 'number' ? b.value : String(b.value);
          break;
        case 'line':
          aVal = a.line;
          bVal = b.line;
          break;
        case 'module':
          aVal = a.module;
          bVal = b.module;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  /**
   * Проверить, существует ли константа
   */
  has(id: ConstantId): boolean {
    return this.constantMap.has(id);
  }

  /**
   * Получить количество констант
   */
  size(): number {
    return this.constantMap.size;
  }

  /**
   * Получить все ID констант
   */
  getAllIds(): ConstantId[] {
    return Array.from(this.constantMap.keys());
  }

  /**
   * Получить все имена констант
   */
  getAllNames(): string[] {
    const names = new Set<string>();
    for (const constant of this.constantMap.values()) {
      names.add(constant.name);
    }
    return Array.from(names);
  }

  /**
   * Получить уникальные типы
   */
  getTypes(): ConstantType[] {
    return Array.from(this.typeIndex.keys());
  }

  /**
   * Получить уникальные модули
   */
  getModules(): ModuleId[] {
    return Array.from(this.moduleIndex.keys());
  }

  /**
   * Получить уникальные файлы
   */
  getFiles(): FileId[] {
    return Array.from(this.fileIndex.keys());
  }

  // ==================== РАСШИРЕННЫЙ АНАЛИЗ ====================

  /**
   * Найти дубликаты констант
   */
  findDuplicates(): { name: string; constants: ConstantEntity[] }[] {
    this.callStats.totalCalls++;

    const cacheKey = 'findDuplicates';
    if (this.cache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.cache.get(cacheKey) as { name: string; constants: ConstantEntity[] }[];
    }
    this.callStats.cacheMisses++;

    const byName = new Map<string, ConstantEntity[]>();
    for (const constant of this.constantMap.values()) {
      if (!byName.has(constant.name)) {
        byName.set(constant.name, []);
      }
      byName.get(constant.name)!.push(constant);
    }

    const result = Array.from(byName.entries())
      .filter(([_, items]) => items.length > 1)
      .map(([name, constants]) => ({ name, constants }))
      .sort((a, b) => b.constants.length - a.constants.length);

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Найти конфликты имен
   */
  findNameConflicts(): { name: string; constants: ConstantEntity[]; modules: ModuleId[] }[] {
    this.callStats.totalCalls++;

    const byName = new Map<string, ConstantEntity[]>();
    for (const constant of this.constantMap.values()) {
      if (!byName.has(constant.name)) {
        byName.set(constant.name, []);
      }
      byName.get(constant.name)!.push(constant);
    }

    const result = Array.from(byName.entries())
      .filter(([_, items]) => {
        const modules = new Set(items.map(c => c.moduleId));
        return modules.size > 1;
      })
      .map(([name, constants]) => {
        const modules = Array.from(new Set(constants.map(c => c.moduleId)));
        return { name, constants, modules };
      })
      .sort((a, b) => b.constants.length - a.constants.length);

    return result;
  }

  /**
   * Найти неиспользуемые константы
   */
  findUnused(usageMap?: Map<ConstantId, FunctionId[]>): ConstantEntity[] {
    this.callStats.totalCalls++;

    if (!usageMap) {
      return [];
    }

    const result: ConstantEntity[] = [];
    for (const [id, constant] of this.constantMap) {
      const usedBy = usageMap.get(id) || [];
      if (usedBy.length === 0) {
        result.push(constant);
      }
    }

    return result;
  }

  // ==================== ЭКСПОРТ ====================

  /**
   * Экспортировать константы в JSON
   */
  exportJSON(options: { pretty?: boolean } = {}): string {
    const data: ConstantExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      metadata: {
        total: this.constantMap.size,
        modules: this.moduleIndex.size,
        files: this.fileIndex.size,
        types: Object.fromEntries(
          Array.from(this.typeIndex.entries()).map(([type, ids]) => [type, ids.length])
        ),
      },
      constants: this.getAll(),
    };

    return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Экспортировать константы по модулю
   */
  exportByModule(moduleId: ModuleId): string {
    const constants = this.getByModule(moduleId);
    return JSON.stringify(constants, null, 2);
  }

  /**
   * Экспортировать константы по типу
   */
  exportByType(type: ConstantType): string {
    const constants = this.getByType(type);
    return JSON.stringify(constants, null, 2);
  }

  /**
   * Экспортировать в CSV
   */
  exportCSV(): string {
    const headers = [
      'id',
      'name',
      'value',
      'moduleId',
      'fileId',
      'line',
      'flags',
      'module',
      'file',
    ];
    const rows = this.getAll().map(c => [
      c.id,
      c.name,
      JSON.stringify(c.value),
      c.moduleId,
      c.fileId,
      String(c.line),
      c.flags,
      c.module,
      c.file,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
   * Получить статистику вызовов
   */
  getCallStats(): typeof this.callStats {
    return { ...this.callStats };
  }

  /**
   * Сбросить статистику
   */
  resetStats(): void {
    this.callStats = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Перестроить индексы
   */
  rebuildIndexes(): void {
    this.buildIndexes();
    this.clearCache();
  }

  /**
   * Обновить карту констант
   */
  updateMap(newMap: Map<ConstantId, ConstantEntity>): void {
    this.constantMap = newMap;
    this.rebuildIndexes();
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать менеджер констант с настройками по умолчанию
 */
export function createDefaultConstantManager(
  constantMap: Map<ConstantId, ConstantEntity>
): ConstantManager {
  return new ConstantManager(constantMap);
}

/**
 * Создать менеджер констант из данных отчета
 */
export function createConstantManagerFromReport(data: ASTReport): ConstantManager {
  const constantMap = new Map<ConstantId, ConstantEntity>();

  if (data.cn) {
    for (const [id, name, value, moduleId, fileId, line, flags] of data.cn) {
      constantMap.set(id, {
        id,
        name,
        value,
        moduleId,
        fileId,
        line,
        flags,
        module: data.mi?.[moduleId] || moduleId,
        file: data.fl?.[fileId] || fileId,
      });
    }
  }

  return new ConstantManager(constantMap);
}

/**
 * Фильтровать константы по предикату
 */
export function filterConstants(
  constants: ConstantEntity[],
  predicate: (constant: ConstantEntity) => boolean
): ConstantEntity[] {
  return constants.filter(predicate);
}

/**
 * Сортировать константы
 */
export function sortConstants(
  constants: ConstantEntity[],
  key: keyof ConstantEntity,
  direction: 'asc' | 'desc' = 'asc'
): ConstantEntity[] {
  return [...constants].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

/**
 * Получить значения констант определенного типа
 */
export function getConstantsByValueType<T>(
  constants: ConstantEntity[],
  type: 'string' | 'number' | 'boolean' | 'object'
): T[] {
  return constants.filter(c => typeof c.value === type).map(c => c.value as T);
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для ConstantManager
 */
export interface TestConstantData {
  constants: ConstantEntity[];
  expectedByName: Record<string, ConstantEntity[]>;
  expectedByModule: Record<ModuleId, ConstantEntity[]>;
  expectedByType: Record<ConstantType, ConstantEntity[]>;
}

/**
 * Создать тестовые данные
 */
export function createTestConstantData(): TestConstantData {
  const constants: ConstantEntity[] = [
    {
      id: 'c1' as ConstantId,
      name: 'VERSION',
      value: '1.0.0',
      moduleId: 'm1' as ModuleId,
      fileId: 'f1' as FileId,
      line: 10,
      flags: 'e',
      module: 'src',
      file: 'src/index.ts',
    },
    {
      id: 'c2' as ConstantId,
      name: 'MAX_RETRIES',
      value: 5,
      moduleId: 'm1' as ModuleId,
      fileId: 'f1' as FileId,
      line: 20,
      flags: 'e',
      module: 'src',
      file: 'src/index.ts',
    },
    {
      id: 'c3' as ConstantId,
      name: 'API_URL',
      value: 'https://api.example.com',
      moduleId: 'm2' as ModuleId,
      fileId: 'f2' as FileId,
      line: 30,
      flags: 'e',
      module: 'core',
      file: 'src/core/api.ts',
    },
  ];

  // Убеждаемся, что массив содержит все необходимые элементы
  const expectedByName: Record<string, ConstantEntity[]> = {};
  if (constants.length > 0) {
    expectedByName['version'] = [constants[0]!];
  }
  if (constants.length > 1) {
    expectedByName['max_retries'] = [constants[1]!];
  }
  if (constants.length > 2) {
    expectedByName['api_url'] = [constants[2]!];
  }

  const expectedByModule = {
    m1: constants.slice(0, 2),
    m2: constants.slice(2, 3),
  } as Record<ModuleId, ConstantEntity[]>;

  const expectedByType: Record<ConstantType, ConstantEntity[]> = {
    val: constants,
    enum: [],
    config: [],
  };

  return { constants, expectedByName, expectedByModule, expectedByType };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default ConstantManager;
