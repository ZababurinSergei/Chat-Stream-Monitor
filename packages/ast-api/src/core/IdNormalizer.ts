// src/core/IdNormalizer.ts

/**
 * Нормализатор ID для AST отчета
 *
 * @module core/IdNormalizer
 * @description Преобразует различные форматы ID в единый строковый формат "fnN"
 *
 * @example
 * ```typescript
 * import { IdNormalizer } from './IdNormalizer.js';
 *
 * const normalizer = new IdNormalizer(functionMap);
 * normalizer.buildMaps(data);
 *
 * const fnId = normalizer.normalize(64);    // -> "fn64"
 * const fnId2 = normalizer.normalize("sf1"); // -> "fn1"
 * const fnId3 = normalizer.normalize("fn1"); // -> "fn1"
 * ```
 */

import type { FunctionId, FunctionEntity, SelfFunctionId, ASTReport } from '../types/index.js';

/**
 * Опции для нормализатора
 */
export interface IdNormalizerOptions {
  /**
   * Логировать предупреждения о невалидных ID
   * @default true
   */
  logWarnings?: boolean;

  /**
   * Строгий режим - выбрасывать ошибку при невалидном ID
   * @default false
   */
  strictMode?: boolean;

  /**
   * Максимальное количество предупреждений
   * @default 100
   */
  maxWarnings?: number;
}

/**
 * Результат нормализации
 */
export interface NormalizationResult {
  /**
   * Нормализованный ID
   */
  id: FunctionId;

  /**
   * Было ли преобразование
   */
  transformed: boolean;

  /**
   * Исходный ID (до преобразования)
   */
  original: string | number;

  /**
   * Тип преобразования
   */
  transformationType: 'none' | 'numeric' | 'sf' | 'string' | 'unknown';
}

/**
 * Статистика нормализации
 */
export interface NormalizationStats {
  totalNormalizations: number;
  transformations: {
    numeric: number;
    sf: number;
    string: number;
    unknown: number;
  };
  invalidIds: number;
  warnings: number;
}

export class IdNormalizer {
  /**
   * Карта: числовой ID -> строковый ID функции
   * @example 1 -> "fn1", 64 -> "fn64"
   */
  private idMap = new Map<number, FunctionId>();

  /**
   * Карта: sf ID -> ID функции
   * @example "sf1" -> "fn1"
   */
  private sfMap = new Map<SelfFunctionId, FunctionId>();

  /**
   * Обратная карта: ID функции -> числовой ID
   * @example "fn1" -> 1
   */
  private reverseIdMap = new Map<FunctionId, number>();

  /**
   * Карта: ID функции -> sf ID
   * @example "fn1" -> "sf1"
   */
  private reverseSfMap = new Map<FunctionId, SelfFunctionId>();

  /**
   * Кеш нормализации
   */
  private normalizationCache = new Map<string | number, FunctionId>();

  /**
   * Статистика
   */
  private stats: NormalizationStats = {
    totalNormalizations: 0,
    transformations: {
      numeric: 0,
      sf: 0,
      string: 0,
      unknown: 0,
    },
    invalidIds: 0,
    warnings: 0,
  };

  /**
   * Предупреждения
   */
  private warnings: string[] = [];

  /**
   * Карта функций
   */
  private functionMap: Map<FunctionId, FunctionEntity>;

  /**
   * Опции
   */
  private options: Required<IdNormalizerOptions>;

  constructor(functionMap: Map<FunctionId, FunctionEntity>, options: IdNormalizerOptions = {}) {
    this.functionMap = functionMap;
    this.options = {
      logWarnings: options.logWarnings ?? true,
      strictMode: options.strictMode ?? false,
      maxWarnings: options.maxWarnings ?? 100,
    };
  }

  /**
   * Построить карты соответствия ID
   */
  buildMaps(data: ASTReport): this {
    this.idMap.clear();
    this.sfMap.clear();
    this.reverseIdMap.clear();
    this.reverseSfMap.clear();
    this.normalizationCache.clear();
    this.warnings = [];
    this.stats = {
      totalNormalizations: 0,
      transformations: {
        numeric: 0,
        sf: 0,
        string: 0,
        unknown: 0,
      },
      invalidIds: 0,
      warnings: 0,
    };

    // 1. Из fns: индекс (1-based) -> fnId
    if (data.fns && data.fns.length > 0) {
      data.fns.forEach((entry, index) => {
        const fnId = entry[0];
        const numericId = index + 1;
        this.idMap.set(numericId, fnId);
        this.reverseIdMap.set(fnId, numericId);
      });
    }

    // 2. Из sf: sfId -> fnId
    if (data.sf && data.sf.length > 0) {
      data.sf.forEach(entry => {
        const sfId = entry[0];
        const fnId = entry[1];
        this.sfMap.set(sfId, fnId);
        this.reverseSfMap.set(fnId, sfId);

        // Также добавляем числовой ID из sf
        const numericMatch = sfId.match(/\d+/);
        if (numericMatch) {
          const numericId = parseInt(numericMatch[0], 10);
          if (!this.idMap.has(numericId)) {
            this.idMap.set(numericId, fnId);
            this.reverseIdMap.set(fnId, numericId);
          }
        }
      });
    }

    // 3. Из графа вызовов - собираем все ID, которые могут быть числами
    if (data.gr?.c) {
      this.collectIdsFromGraph(data.gr.c);
    }

    // 4. Из графа импортов
    if (data.gr?.i) {
      this.collectIdsFromGraph(data.gr.i);
    }

    // 5. Из графа экспортов
    if (data.gr?.e) {
      this.collectIdsFromGraph(data.gr.e);
    }

    // 6. Из динамических импортов
    if (data.gr?.di) {
      for (const di of data.gr.di) {
        const fileId = di[0];
        if (typeof fileId === 'number' && !this.idMap.has(fileId)) {
          this.tryFindIdByIndex(fileId);
        }
      }
    }

    // 7. Из конфиг референсов
    if (data.gr?.cfg) {
      for (const cfg of data.gr.cfg) {
        const fileId = cfg[0];
        if (typeof fileId === 'number' && !this.idMap.has(fileId)) {
          this.tryFindIdByIndex(fileId);
        }
      }
    }

    return this;
  }

  /**
   * Собрать ID из графа
   */
  private collectIdsFromGraph<T extends (string | number)[]>(edges: T[]): void {
    for (const edge of edges) {
      if (edge.length > 0 && edge[0] !== undefined) {
        this.ensureId(edge[0]);
      }
      if (edge.length > 1 && edge[1] !== undefined) {
        this.ensureId(edge[1]);
      }
    }
  }

  /**
   * Гарантировать наличие ID в карте
   */
  private ensureId(id: string | number): void {
    if (typeof id === 'number') {
      if (!this.idMap.has(id)) {
        this.tryFindIdByIndex(id);
      }
    } else if (
      typeof id === 'string' &&
      id.startsWith('sf') &&
      !this.sfMap.has(id as SelfFunctionId)
    ) {
      // Попытка найти sf ID
      const numericMatch = id.match(/\d+/);
      if (numericMatch) {
        const numericId = parseInt(numericMatch[0], 10);
        this.tryFindIdByIndex(numericId);
      }
    }
  }

  /**
   * Попытаться найти ID по индексу в fns
   */
  private tryFindIdByIndex(index: number): void {
    const data = (this.functionMap as any).__data;
    if (data?.fns?.[index - 1]?.[0]) {
      const fnId = data.fns[index - 1][0] as FunctionId;
      this.idMap.set(index, fnId);
      this.reverseIdMap.set(fnId, index);
    }
  }

  /**
   * Нормализовать ID
   * @param id - ID в любом формате (число, строка, sf-формат)
   * @returns Нормализованный ID в формате "fnN"
   * @throws {AstAnalyzerError} В строгом режиме при невалидном ID
   */
  normalize(id: string | number): FunctionId {
    this.stats.totalNormalizations++;

    // Проверяем кеш
    if (this.normalizationCache.has(id)) {
      return this.normalizationCache.get(id)!;
    }

    let result: FunctionId;

    // 1. Если уже строка вида "fnN"
    if (typeof id === 'string' && id.startsWith('fn')) {
      result = id as FunctionId;
    }
    // 2. Если sf ID
    else if (
      typeof id === 'string' &&
      id.startsWith('sf') &&
      this.sfMap.has(id as SelfFunctionId)
    ) {
      result = this.sfMap.get(id as SelfFunctionId)!;
      this.stats.transformations.sf++;
    }
    // 3. Если число
    else if (typeof id === 'number' && this.idMap.has(id)) {
      result = this.idMap.get(id)!;
      this.stats.transformations.numeric++;
    }
    // 4. Если строка с числом
    else if (typeof id === 'string' && /^\d+$/.test(id)) {
      const numericId = parseInt(id, 10);
      if (this.idMap.has(numericId)) {
        result = this.idMap.get(numericId)!;
        this.stats.transformations.numeric++;
      } else {
        // Пробуем найти по индексу
        this.tryFindIdByIndex(numericId);
        if (this.idMap.has(numericId)) {
          result = this.idMap.get(numericId)!;
          this.stats.transformations.numeric++;
        } else {
          result = id as FunctionId;
          this.stats.transformations.unknown++;
          this.addWarning(`Не удалось нормализовать ID: "${id}"`);
        }
      }
    }
    // 5. Если строка с sf
    else if (typeof id === 'string' && id.startsWith('sf')) {
      // Пробуем найти sf ID
      const numericMatch = id.match(/\d+/);
      if (numericMatch) {
        const numericId = parseInt(numericMatch[0], 10);
        if (this.idMap.has(numericId)) {
          result = this.idMap.get(numericId)!;
          this.stats.transformations.sf++;
        } else {
          this.tryFindIdByIndex(numericId);
          if (this.idMap.has(numericId)) {
            result = this.idMap.get(numericId)!;
            this.stats.transformations.sf++;
          } else {
            result = id as FunctionId;
            this.stats.transformations.unknown++;
            this.addWarning(`Не удалось нормализовать sf ID: "${id}"`);
          }
        }
      } else {
        result = id as FunctionId;
        this.stats.transformations.unknown++;
        this.addWarning(`Не удалось нормализовать sf ID: "${id}"`);
      }
    }
    // 6. Все остальное
    else {
      result = String(id) as FunctionId;
      this.stats.transformations.unknown++;
      this.addWarning(`Неизвестный формат ID: "${id}"`);
    }

    // Проверяем существование в functionMap
    if (!this.functionMap.has(result)) {
      this.stats.invalidIds++;
      if (this.options.strictMode) {
        throw new Error(`ID "${result}" не найден в functionMap`);
      }
      this.addWarning(`ID "${result}" не найден в functionMap`);
    }

    // Кешируем результат
    this.normalizationCache.set(id, result);
    if (typeof id !== 'string' || id !== result) {
      this.normalizationCache.set(result, result);
    }

    return result;
  }

  /**
   * Нормализовать ID с получением детальной информации
   */
  normalizeWithDetails(id: string | number): NormalizationResult {
    const original = id;
    const normalized = this.normalize(id);
    const transformed = original !== normalized;

    let transformationType: NormalizationResult['transformationType'] = 'none';
    if (transformed) {
      if (typeof original === 'number' || /^\d+$/.test(String(original))) {
        transformationType = 'numeric';
      } else if (typeof original === 'string' && original.startsWith('sf')) {
        transformationType = 'sf';
      } else if (typeof original === 'string') {
        transformationType = 'string';
      } else {
        transformationType = 'unknown';
      }
    }

    return {
      id: normalized,
      transformed,
      original,
      transformationType,
    };
  }

  /**
   * Нормализовать массив ID
   */
  normalizeAll(ids: (string | number)[]): FunctionId[] {
    return ids.map(id => this.normalize(id));
  }

  /**
   * Получить числовой ID по функции
   */
  getNumericId(fnId: FunctionId): number | undefined {
    return this.reverseIdMap.get(fnId);
  }

  /**
   * Получить sf ID по функции
   */
  getSfId(fnId: FunctionId): SelfFunctionId | undefined {
    return this.reverseSfMap.get(fnId);
  }

  /**
   * Проверить, существует ли ID
   */
  isValid(id: string | number): boolean {
    try {
      const normalized = this.normalize(id);
      return this.functionMap.has(normalized);
    } catch {
      return false;
    }
  }

  /**
   * Проверить, является ли ID функцией
   */
  isFunctionId(id: string): id is FunctionId {
    return /^fn\d+$/.test(id);
  }

  /**
   * Проверить, является ли ID self-функцией
   */
  isSelfFunctionId(id: string): id is SelfFunctionId {
    return /^sf\d+$/.test(id);
  }

  /**
   * Получить все ID, которые соответствуют числовому ID
   */
  findIdsByNumeric(numericId: number): FunctionId[] {
    const result: FunctionId[] = [];
    if (this.idMap.has(numericId)) {
      result.push(this.idMap.get(numericId)!);
    }
    return result;
  }

  /**
   * Получить все ID, которые соответствуют sf ID
   */
  findIdsBySf(sfId: SelfFunctionId): FunctionId[] {
    const result: FunctionId[] = [];
    if (this.sfMap.has(sfId)) {
      result.push(this.sfMap.get(sfId)!);
    }
    return result;
  }

  /**
   * Добавить предупреждение
   */
  private addWarning(message: string): void {
    if (this.warnings.length >= this.options.maxWarnings) {
      return;
    }
    this.warnings.push(message);
    this.stats.warnings++;
    if (this.options.logWarnings) {
      console.warn(`⚠️ [IdNormalizer] ${message}`);
    }
  }

  /**
   * Получить статистику
   */
  getStats(): NormalizationStats {
    return { ...this.stats };
  }

  /**
   * Получить предупреждения
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Получить карту ID
   */
  getIdMap(): Map<number, FunctionId> {
    return new Map(this.idMap);
  }

  /**
   * Получить обратную карту ID
   */
  getReverseIdMap(): Map<FunctionId, number> {
    return new Map(this.reverseIdMap);
  }

  /**
   * Получить sf карту
   */
  getSfMap(): Map<SelfFunctionId, FunctionId> {
    return new Map(this.sfMap);
  }

  /**
   * Получить обратную sf карту
   */
  getReverseSfMap(): Map<FunctionId, SelfFunctionId> {
    return new Map(this.reverseSfMap);
  }

  /**
   * Очистить кеш
   */
  clearCache(): this {
    this.normalizationCache.clear();
    return this;
  }

  /**
   * Сбросить состояние
   */
  reset(): this {
    this.idMap.clear();
    this.sfMap.clear();
    this.reverseIdMap.clear();
    this.reverseSfMap.clear();
    this.normalizationCache.clear();
    this.warnings = [];
    this.stats = {
      totalNormalizations: 0,
      transformations: {
        numeric: 0,
        sf: 0,
        string: 0,
        unknown: 0,
      },
      invalidIds: 0,
      warnings: 0,
    };
    return this;
  }

  /**
   * Экспортировать состояние в JSON
   */
  exportState(): string {
    return JSON.stringify(
      {
        idMap: Array.from(this.idMap.entries()),
        sfMap: Array.from(this.sfMap.entries()),
        reverseIdMap: Array.from(this.reverseIdMap.entries()),
        reverseSfMap: Array.from(this.reverseSfMap.entries()),
        stats: this.stats,
        warnings: this.warnings,
      },
      null,
      2
    );
  }

  /**
   * Импортировать состояние из JSON
   */
  importState(json: string): this {
    const state = JSON.parse(json);
    this.idMap = new Map(state.idMap);
    this.sfMap = new Map(state.sfMap);
    this.reverseIdMap = new Map(state.reverseIdMap);
    this.reverseSfMap = new Map(state.reverseSfMap);
    this.stats = state.stats;
    this.warnings = state.warnings;
    return this;
  }

  /**
   * Создать клон нормализатора
   */
  clone(): IdNormalizer {
    const clone = new IdNormalizer(this.functionMap, this.options);
    clone.idMap = new Map(this.idMap);
    clone.sfMap = new Map(this.sfMap);
    clone.reverseIdMap = new Map(this.reverseIdMap);
    clone.reverseSfMap = new Map(this.reverseSfMap);
    clone.normalizationCache = new Map(this.normalizationCache);
    clone.stats = { ...this.stats };
    clone.warnings = [...this.warnings];
    return clone;
  }

  /**
   * Получить количество уникальных ID
   */
  getUniqueCount(): number {
    return this.idMap.size;
  }

  /**
   * Получить количество sf ID
   */
  getSfCount(): number {
    return this.sfMap.size;
  }

  /**
   * Получить размер кеша
   */
  getCacheSize(): number {
    return this.normalizationCache.size;
  }

  /**
   * Проверить, есть ли ID в кеше
   */
  isCached(id: string | number): boolean {
    return this.normalizationCache.has(id);
  }

  /**
   * Получить все числовые ID
   */
  getAllNumericIds(): number[] {
    return Array.from(this.idMap.keys());
  }

  /**
   * Получить все ID функций
   */
  getAllFunctionIds(): FunctionId[] {
    return Array.from(this.reverseIdMap.keys());
  }

  /**
   * Получить все sf ID
   */
  getAllSfIds(): SelfFunctionId[] {
    return Array.from(this.reverseSfMap.keys());
  }

  /**
   * Найти ID функции по частичному совпадению
   */
  findIdByPartialMatch(pattern: string | RegExp): FunctionId[] {
    const results: FunctionId[] = [];
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');

    for (const [fnId] of this.reverseIdMap) {
      if (regex.test(fnId)) {
        results.push(fnId);
      }
    }

    return results;
  }

  /**
   * Найти числовой ID по частичному совпадению
   */
  findNumericIdByPartialMatch(pattern: string | RegExp): number[] {
    const results: number[] = [];
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');

    for (const [fnId, numericId] of this.reverseIdMap) {
      if (regex.test(fnId) || regex.test(String(numericId))) {
        results.push(numericId);
      }
    }

    return results;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать нормализатор с настройками по умолчанию
 */
export function createDefaultNormalizer(
  functionMap: Map<FunctionId, FunctionEntity>
): IdNormalizer {
  return new IdNormalizer(functionMap, {
    logWarnings: true,
    strictMode: false,
    maxWarnings: 100,
  });
}

/**
 * Создать строгий нормализатор (выбрасывает ошибки)
 */
export function createStrictNormalizer(functionMap: Map<FunctionId, FunctionEntity>): IdNormalizer {
  return new IdNormalizer(functionMap, {
    logWarnings: true,
    strictMode: true,
    maxWarnings: 100,
  });
}

/**
 * Создать тихий нормализатор (без логов)
 */
export function createSilentNormalizer(functionMap: Map<FunctionId, FunctionEntity>): IdNormalizer {
  return new IdNormalizer(functionMap, {
    logWarnings: false,
    strictMode: false,
    maxWarnings: 100,
  });
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default IdNormalizer;

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для нормализатора
 */
export interface TestNormalizerData {
  idMap: Map<number, FunctionId>;
  sfMap: Map<SelfFunctionId, FunctionId>;
  reverseIdMap: Map<FunctionId, number>;
  reverseSfMap: Map<FunctionId, SelfFunctionId>;
}

/**
 * Создать тестовые данные для нормализатора
 */
export function createTestNormalizerData(): TestNormalizerData {
  const idMap = new Map<number, FunctionId>();
  const sfMap = new Map<SelfFunctionId, FunctionId>();
  const reverseIdMap = new Map<FunctionId, number>();
  const reverseSfMap = new Map<FunctionId, SelfFunctionId>();

  // Создаем тестовые данные
  for (let i = 1; i <= 10; i++) {
    const fnId = `fn${i}` as FunctionId;
    idMap.set(i, fnId);
    reverseIdMap.set(fnId, i);

    if (i <= 5) {
      const sfId = `sf${i}` as SelfFunctionId;
      sfMap.set(sfId, fnId);
      reverseSfMap.set(fnId, sfId);
    }
  }

  return { idMap, sfMap, reverseIdMap, reverseSfMap };
}
