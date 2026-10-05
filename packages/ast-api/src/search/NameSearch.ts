// src/search/NameSearch.ts

/**
 * Поиск по имени функций и констант
 *
 * @module search/NameSearch
 * @description Реализует различные алгоритмы поиска по имени:
 * - Точное совпадение
 * - Поиск по подстроке
 * - Fuzzy-поиск (нечеткий)
 * - Поиск с учетом регистра/без
 *
 * @example
 * ```typescript
 * import { NameSearch } from './NameSearch.js';
 *
 * const nameSearch = new NameSearch(functionMap, constantMap);
 * nameSearch.buildIndex();
 *
 * // Точный поиск
 * const exact = nameSearch.findByName('runSemanticPipeline');
 *
 * // Частичный поиск
 * const partial = nameSearch.search('pipeline');
 *
 * // Fuzzy-поиск
 * const fuzzy = nameSearch.fuzzySearch('semantic');
 * ```
 */

import type { FunctionId, FunctionEntity, ConstantId, ConstantEntity } from '../types/index.js';

// ==================== ТИПЫ ====================

/**
 * Результат поиска
 */
export interface NameSearchResult<T> {
  /**
   * ID сущности
   */
  id: string;

  /**
   * Сущность
   */
  item: T;

  /**
   * Оценка релевантности (для fuzzy-поиска)
   */
  score?: number;

  /**
   * Причина совпадения
   */
  matchReason?: 'exact' | 'startsWith' | 'contains' | 'fuzzy';

  /**
   * Совпавшая часть
   */
  matchedPart?: string;
}

/**
 * Опции для поиска
 */
export interface NameSearchOptions {
  /**
   * Максимальное количество результатов
   * @default 100
   */
  maxResults?: number;

  /**
   * Минимальный порог для fuzzy-поиска
   * @default 0
   */
  fuzzyThreshold?: number;

  /**
   * Учитывать регистр
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Искать только в функциях
   * @default false
   */
  functionsOnly?: boolean;

  /**
   * Искать только в константах
   * @default false
   */
  constantsOnly?: boolean;

  /**
   * Использовать кеш
   * @default true
   */
  useCache?: boolean;
}

/**
 * Кеш-запись
 */
interface CacheEntry<T> {
  key: string;
  results: T[];
  timestamp: number;
}

/**
 * Статистика поиска
 */
export interface SearchStats {
  totalSearches: number;
  exactMatches: number;
  partialMatches: number;
  fuzzyMatches: number;
  cacheHits: number;
  cacheMisses: number;
  averageResults: number;
}

/**
 * Тип сущности
 */
export type SearchEntityType = 'function' | 'constant';

export class NameSearch {
  private functionMap: Map<FunctionId, FunctionEntity>;
  private constantMap: Map<ConstantId, ConstantEntity>;
  private nameIndex = new Map<string, string[]>();
  private lowerNameIndex = new Map<string, string[]>();
  private prefixIndex = new Map<string, string[]>();
  private cache = new Map<string, CacheEntry<FunctionEntity | ConstantEntity>>();
  private options: Required<NameSearchOptions>;
  private stats: SearchStats = {
    totalSearches: 0,
    exactMatches: 0,
    partialMatches: 0,
    fuzzyMatches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResults: 0,
  };
  private isIndexBuilt = false;

  constructor(
    functionMap: Map<FunctionId, FunctionEntity>,
    constantMap: Map<ConstantId, ConstantEntity>,
    options: NameSearchOptions = {}
  ) {
    this.functionMap = functionMap;
    this.constantMap = constantMap;
    this.options = {
      maxResults: options.maxResults ?? 100,
      fuzzyThreshold: options.fuzzyThreshold ?? 0,
      caseSensitive: options.caseSensitive ?? false,
      functionsOnly: options.functionsOnly ?? false,
      constantsOnly: options.constantsOnly ?? false,
      useCache: options.useCache ?? true,
    };
  }

  // ==================== ПОСТРОЕНИЕ ИНДЕКСА ====================

  /**
   * Построить индекс по имени
   */
  buildIndex(): this {
    this.nameIndex.clear();
    this.lowerNameIndex.clear();
    this.prefixIndex.clear();
    this.cache.clear();

    // Индексация функций
    if (!this.options.constantsOnly) {
      for (const [id, fn] of this.functionMap) {
        const name = fn.name;
        const lowerName = name.toLowerCase();

        // Точный индекс
        if (!this.nameIndex.has(name)) {
          this.nameIndex.set(name, []);
        }
        this.nameIndex.get(name)!.push(id);

        // Индекс в нижнем регистре
        if (!this.lowerNameIndex.has(lowerName)) {
          this.lowerNameIndex.set(lowerName, []);
        }
        this.lowerNameIndex.get(lowerName)!.push(id);

        // Префиксный индекс
        for (let i = 1; i <= Math.min(name.length, 10); i++) {
          const prefix = lowerName.substring(0, i);
          if (!this.prefixIndex.has(prefix)) {
            this.prefixIndex.set(prefix, []);
          }
          this.prefixIndex.get(prefix)!.push(id);
        }
      }
    }

    // Индексация констант
    if (!this.options.functionsOnly) {
      for (const [id, c] of this.constantMap) {
        const name = c.name;
        const lowerName = name.toLowerCase();

        if (!this.nameIndex.has(name)) {
          this.nameIndex.set(name, []);
        }
        this.nameIndex.get(name)!.push(id);

        if (!this.lowerNameIndex.has(lowerName)) {
          this.lowerNameIndex.set(lowerName, []);
        }
        this.lowerNameIndex.get(lowerName)!.push(id);

        for (let i = 1; i <= Math.min(name.length, 10); i++) {
          const prefix = lowerName.substring(0, i);
          if (!this.prefixIndex.has(prefix)) {
            this.prefixIndex.set(prefix, []);
          }
          this.prefixIndex.get(prefix)!.push(id);
        }
      }
    }

    this.isIndexBuilt = true;
    return this;
  }

  /**
   * Проверить, построен ли индекс
   */
  isBuilt(): boolean {
    return this.isIndexBuilt;
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ ПОИСКА ====================

  /**
   * Найти по точному имени
   */
  findByName(name: string): (FunctionEntity | ConstantEntity)[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    this.stats.totalSearches++;
    const cacheKey = `exact_${name}_${this.options.caseSensitive}`;

    // Проверка кеша
    if (this.options.useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < 60000) {
        // 1 минута
        this.stats.cacheHits++;
        return entry.results;
      }
    }
    this.stats.cacheMisses++;

    const searchName = this.options.caseSensitive ? name : name.toLowerCase();
    const index = this.options.caseSensitive ? this.nameIndex : this.lowerNameIndex;

    const ids = index.get(searchName) || [];
    const results = this.getEntitiesByIds(ids);

    this.stats.exactMatches += results.length > 0 ? 1 : 0;
    this.updateAverageResults(results.length);

    // Сохраняем в кеш
    if (this.options.useCache) {
      this.cache.set(cacheKey, {
        key: cacheKey,
        results,
        timestamp: Date.now(),
      });
    }

    return results;
  }

  /**
   * Поиск по подстроке
   */
  search(query: string): (FunctionEntity | ConstantEntity)[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    this.stats.totalSearches++;
    const cacheKey = `search_${query}_${this.options.caseSensitive}`;

    // Проверка кеша
    if (this.options.useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < 60000) {
        this.stats.cacheHits++;
        return entry.results;
      }
    }
    this.stats.cacheMisses++;

    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase();
    const results: (FunctionEntity | ConstantEntity)[] = [];
    const seen = new Set<string>();

    // Поиск в функциях
    if (!this.options.constantsOnly) {
      for (const [id, fn] of this.functionMap) {
        const name = this.options.caseSensitive ? fn.name : fn.name.toLowerCase();
        if (name.includes(searchQuery) && !seen.has(id)) {
          seen.add(id);
          results.push(fn);
        }
      }
    }

    // Поиск в константах
    if (!this.options.functionsOnly) {
      for (const [id, c] of this.constantMap) {
        const name = this.options.caseSensitive ? c.name : c.name.toLowerCase();
        if (name.includes(searchQuery) && !seen.has(id)) {
          seen.add(id);
          results.push(c);
        }
      }
    }

    // Сортировка по длине имени (более короткие идут первыми)
    results.sort((a, b) => {
      const nameA = this.options.caseSensitive ? a.name : a.name.toLowerCase();
      const nameB = this.options.caseSensitive ? b.name : b.name.toLowerCase();
      return nameA.length - nameB.length;
    });

    const limited = results.slice(0, this.options.maxResults);

    this.stats.partialMatches += limited.length > 0 ? 1 : 0;
    this.updateAverageResults(limited.length);

    // Сохраняем в кеш
    if (this.options.useCache) {
      this.cache.set(cacheKey, {
        key: cacheKey,
        results: limited,
        timestamp: Date.now(),
      });
    }

    return limited;
  }

  /**
   * Fuzzy-поиск
   */
  fuzzySearch(
    query: string
  ): (
    FunctionEntity | (ConstantEntity & { score: number; matchReason: string; matchedPart: string })
  )[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    this.stats.totalSearches++;
    const cacheKey = `fuzzy_${query}_${this.options.caseSensitive}_${this.options.fuzzyThreshold}`;

    // Проверка кеша
    if (this.options.useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < 60000) {
        this.stats.cacheHits++;
        return entry.results as any;
      }
    }
    this.stats.cacheMisses++;

    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase();
    const results: (
      | FunctionEntity
      | (ConstantEntity & { score: number; matchReason: string; matchedPart: string })
    )[] = [];
    const seen = new Set<string>();

    // Поиск в функциях
    if (!this.options.constantsOnly) {
      for (const [id, fn] of this.functionMap) {
        if (seen.has(id)) continue;
        const name = this.options.caseSensitive ? fn.name : fn.name.toLowerCase();
        const score = this.calculateFuzzyScore(name, searchQuery);

        if (score > this.options.fuzzyThreshold) {
          seen.add(id);
          const matchReason = this.getMatchReason(name, searchQuery);
          const matchedPart = this.getMatchedPart(name, searchQuery);
          results.push({
            ...fn,
            score,
            matchReason,
            matchedPart,
          } as any);
        }
      }
    }

    // Поиск в константах
    if (!this.options.functionsOnly) {
      for (const [id, c] of this.constantMap) {
        if (seen.has(id)) continue;
        const name = this.options.caseSensitive ? c.name : c.name.toLowerCase();
        const score = this.calculateFuzzyScore(name, searchQuery);

        if (score > this.options.fuzzyThreshold) {
          seen.add(id);
          const matchReason = this.getMatchReason(name, searchQuery);
          const matchedPart = this.getMatchedPart(name, searchQuery);
          results.push({
            ...c,
            score,
            matchReason,
            matchedPart,
          });
        }
      }
    }

    // Сортировка по score (от большего к меньшему)
    results.sort((a, b) => {
      const scoreA = (a as any).score || 0;
      const scoreB = (b as any).score || 0;
      return scoreB - scoreA;
    });

    const limited = results.slice(0, this.options.maxResults);

    this.stats.fuzzyMatches += limited.length > 0 ? 1 : 0;
    this.updateAverageResults(limited.length);

    // Сохраняем в кеш
    if (this.options.useCache) {
      this.cache.set(cacheKey, {
        key: cacheKey,
        results: limited as any,
        timestamp: Date.now(),
      });
    }

    return limited;
  }

  // ==================== СПЕЦИАЛИЗИРОВАННЫЙ ПОИСК ====================

  /**
   * Поиск по префиксу
   */
  searchByPrefix(prefix: string): (FunctionEntity | ConstantEntity)[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    const searchPrefix = this.options.caseSensitive ? prefix : prefix.toLowerCase();
    const ids = this.prefixIndex.get(searchPrefix) || [];
    return this.getEntitiesByIds(ids);
  }

  /**
   * Поиск с автодополнением
   */
  autocomplete(query: string): string[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase();
    const suggestions: string[] = [];
    const seen = new Set<string>();

    // Поиск по префиксам
    for (const [key, ids] of this.prefixIndex) {
      if (key.startsWith(searchQuery) || key === searchQuery) {
        for (const id of ids) {
          const entity =
            this.functionMap.get(id as FunctionId) || this.constantMap.get(id as ConstantId);
          if (entity && !seen.has(entity.name)) {
            seen.add(entity.name);
            suggestions.push(entity.name);
          }
        }
      }
    }

    suggestions.sort();
    return suggestions.slice(0, 10);
  }

  /**
   * Поиск по регулярному выражению
   */
  searchByRegex(pattern: RegExp | string): (FunctionEntity | ConstantEntity)[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    const results: (FunctionEntity | ConstantEntity)[] = [];
    const seen = new Set<string>();

    // Поиск в функциях
    if (!this.options.constantsOnly) {
      for (const [id, fn] of this.functionMap) {
        if (seen.has(id)) continue;
        if (regex.test(fn.name)) {
          seen.add(id);
          results.push(fn);
        }
      }
    }

    // Поиск в константах
    if (!this.options.functionsOnly) {
      for (const [id, c] of this.constantMap) {
        if (seen.has(id)) continue;
        if (regex.test(c.name)) {
          seen.add(id);
          results.push(c);
        }
      }
    }

    return results.slice(0, this.options.maxResults);
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Рассчитать fuzzy-оценку
   */
  private calculateFuzzyScore(name: string, query: string): number {
    if (name === query) return 100;
    if (name.startsWith(query)) return 80;
    if (name.includes(query)) return 60;

    let score = 0;
    let idx = 0;
    for (const ch of query) {
      const pos = name.indexOf(ch, idx);
      if (pos === -1) {
        return score > 0 ? score / 2 : 0;
      }
      idx = pos + 1;
      score += 10;
    }

    // Бонус за порядок символов
    score += 10;

    // Штраф за длину
    const lengthPenalty = Math.max(0, (query.length - name.length) * 2);
    score = Math.max(0, score - lengthPenalty);

    return Math.min(100, score);
  }

  /**
   * Получить причину совпадения
   */
  private getMatchReason(
    name: string,
    query: string
  ): 'exact' | 'startsWith' | 'contains' | 'fuzzy' {
    if (name === query) return 'exact';
    if (name.startsWith(query)) return 'startsWith';
    if (name.includes(query)) return 'contains';
    return 'fuzzy';
  }

  /**
   * Получить совпавшую часть
   */
  private getMatchedPart(name: string, query: string): string {
    if (name === query) return name;
    if (name.startsWith(query)) return query;
    if (name.includes(query)) {
      const idx = name.indexOf(query);
      return name.substring(idx, idx + query.length);
    }

    // Для fuzzy поиска - возвращаем первую найденную букву
    for (const ch of query) {
      const idx = name.indexOf(ch);
      if (idx !== -1) {
        return name.substring(idx, idx + 1);
      }
    }
    return '';
  }

  /**
   * Получить сущности по ID
   */
  private getEntitiesByIds(ids: string[]): (FunctionEntity | ConstantEntity)[] {
    const results: (FunctionEntity | ConstantEntity)[] = [];
    const seen = new Set<string>();

    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);

      const fn = this.functionMap.get(id as FunctionId);
      if (fn) {
        results.push(fn);
        continue;
      }

      const c = this.constantMap.get(id as ConstantId);
      if (c) {
        results.push(c);
      }
    }

    return results.slice(0, this.options.maxResults);
  }

  /**
   * Обновить среднее количество результатов
   */
  private updateAverageResults(count: number): void {
    const totalSearches = this.stats.totalSearches;
    const currentAvg = this.stats.averageResults;
    this.stats.averageResults = (currentAvg * (totalSearches - 1) + count) / totalSearches;
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику поиска
   */
  getStats(): SearchStats {
    return { ...this.stats };
  }

  /**
   * Сбросить статистику
   */
  resetStats(): void {
    this.stats = {
      totalSearches: 0,
      exactMatches: 0,
      partialMatches: 0,
      fuzzyMatches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResults: 0,
    };
  }

  /**
   * Получить размер индекса
   */
  getIndexSize(): number {
    return this.nameIndex.size;
  }

  /**
   * Получить размер кеша
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  // ==================== УПРАВЛЕНИЕ КЕШЕМ ====================

  /**
   * Очистить кеш
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Очистить индекс
   */
  clearIndex(): void {
    this.nameIndex.clear();
    this.lowerNameIndex.clear();
    this.prefixIndex.clear();
    this.isIndexBuilt = false;
  }

  /**
   * Полностью сбросить состояние
   */
  reset(): void {
    this.clearIndex();
    this.clearCache();
    this.resetStats();
  }

  // ==================== ОПЦИИ ====================

  /**
   * Установить опции
   */
  setOptions(options: Partial<NameSearchOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    // Перестраиваем индекс при изменении чувствительности к регистру
    if (options.caseSensitive !== undefined) {
      this.buildIndex();
    }
    return this;
  }

  /**
   * Получить опции
   */
  getOptions(): NameSearchOptions {
    return { ...this.options };
  }

  /**
   * Проверить, включен ли кеш
   */
  isCacheEnabled(): boolean {
    return this.options.useCache;
  }

  /**
   * Включить/выключить кеш
   */
  setCacheEnabled(enabled: boolean): this {
    this.options.useCache = enabled;
    if (!enabled) {
      this.clearCache();
    }
    return this;
  }

  // ==================== ЭКСПОРТ/ИМПОРТ ====================

  /**
   * Экспортировать индекс в JSON
   */
  exportIndex(): string {
    const data = {
      nameIndex: Array.from(this.nameIndex.entries()),
      lowerNameIndex: Array.from(this.lowerNameIndex.entries()),
      prefixIndex: Array.from(this.prefixIndex.entries()),
      options: this.options,
      stats: this.stats,
      isIndexBuilt: this.isIndexBuilt,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Импортировать индекс из JSON
   */
  importIndex(json: string): this {
    const data = JSON.parse(json);
    this.nameIndex = new Map(data.nameIndex);
    this.lowerNameIndex = new Map(data.lowerNameIndex);
    this.prefixIndex = new Map(data.prefixIndex);
    this.options = data.options;
    this.stats = data.stats;
    this.isIndexBuilt = data.isIndexBuilt;
    return this;
  }

  /**
   * Получить все имена в индексе
   */
  getAllNames(): string[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }
    return Array.from(this.nameIndex.keys());
  }

  /**
   * Получить все имена в нижнем регистре
   */
  getAllLowerNames(): string[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }
    return Array.from(this.lowerNameIndex.keys());
  }

  /**
   * Получить все префиксы
   */
  getAllPrefixes(): string[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }
    return Array.from(this.prefixIndex.keys());
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать NameSearch с настройками по умолчанию
 */
export function createDefaultNameSearch(
  functionMap: Map<FunctionId, FunctionEntity>,
  constantMap: Map<ConstantId, ConstantEntity>
): NameSearch {
  return new NameSearch(functionMap, constantMap, {
    maxResults: 100,
    fuzzyThreshold: 0,
    caseSensitive: false,
    functionsOnly: false,
    constantsOnly: false,
    useCache: true,
  });
}

/**
 * Создать NameSearch для поиска только функций
 */
export function createFunctionsOnlyNameSearch(
  functionMap: Map<FunctionId, FunctionEntity>
): NameSearch {
  return new NameSearch(functionMap, new Map(), {
    maxResults: 100,
    fuzzyThreshold: 0,
    caseSensitive: false,
    functionsOnly: true,
    constantsOnly: false,
    useCache: true,
  });
}

/**
 * Создать NameSearch для поиска только констант
 */
export function createConstantsOnlyNameSearch(
  constantMap: Map<ConstantId, ConstantEntity>
): NameSearch {
  return new NameSearch(new Map(), constantMap, {
    maxResults: 100,
    fuzzyThreshold: 0,
    caseSensitive: false,
    functionsOnly: false,
    constantsOnly: true,
    useCache: true,
  });
}

/**
 * Создать NameSearch для чувствительного к регистру поиска
 */
export function createCaseSensitiveNameSearch(
  functionMap: Map<FunctionId, FunctionEntity>,
  constantMap: Map<ConstantId, ConstantEntity>
): NameSearch {
  return new NameSearch(functionMap, constantMap, {
    maxResults: 100,
    fuzzyThreshold: 0,
    caseSensitive: true,
    functionsOnly: false,
    constantsOnly: false,
    useCache: true,
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для NameSearch
 */
export interface TestNameSearchData {
  functionNames: string[];
  constantNames: string[];
  query: string;
  expectedExact: string[];
  expectedPartial: string[];
  expectedFuzzy: string[];
}

/**
 * Создать тестовые данные
 */
export function createTestNameSearchData(
  functionNames: string[],
  constantNames: string[],
  query: string,
  expectedExact: string[] = [],
  expectedPartial: string[] = [],
  expectedFuzzy: string[] = []
): TestNameSearchData {
  return {
    functionNames,
    constantNames,
    query,
    expectedExact,
    expectedPartial,
    expectedFuzzy,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default NameSearch;
