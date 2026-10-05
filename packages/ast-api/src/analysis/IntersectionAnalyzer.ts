// src/analysis/IntersectionAnalyzer.ts

/**
 * Анализатор пересечений
 *
 * @module analysis/IntersectionAnalyzer
 * @description Находит пересечения между множествами функций
 *
 * @example
 * ```typescript
 * import { IntersectionAnalyzer } from './IntersectionAnalyzer.js';
 *
 * const analyzer = new IntersectionAnalyzer(functionMap, callGraph, idNormalizer);
 *
 * // Найти общие зависимости двух функций
 * const common = analyzer.findCommonDependencies('fn1', 'fn2');
 *
 * // Найти общих вызывающих
 * const callers = analyzer.findCommonCallers('fn1', 'fn2');
 *
 * // Найти пересечение произвольных множеств
 * const intersection = analyzer.findIntersection(set1, set2);
 * ```
 */

import type { FunctionId, FunctionEntity } from '../types/index.js';
import type { CallGraph } from '../graph/CallGraph.js';
import type { IdNormalizer } from '../core/IdNormalizer.js';

/**
 * Опции для анализатора пересечений
 */
export interface IntersectionAnalyzerOptions {
  /**
   * Максимальная глубина поиска
   * @default 10
   */
  maxDepth?: number;
}

export class IntersectionAnalyzer {
  private options: Required<IntersectionAnalyzerOptions>;

  constructor(
    private functionMap: Map<FunctionId, FunctionEntity>,
    private callGraph: CallGraph | null,
    private idNormalizer: IdNormalizer | null,
    options: IntersectionAnalyzerOptions = {}
  ) {
    this.options = {
      maxDepth: options.maxDepth ?? 10,
    };
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

  /**
   * Найти пересечение двух множеств
   *
   * @param set1 - Первое множество (массив ID функций или сущностей)
   * @param set2 - Второе множество (массив ID функций или сущностей)
   * @returns Массив элементов, присутствующих в обоих множествах
   *
   * @example
   * ```typescript
   * const intersection = analyzer.findIntersection(
   *   ['fn1', 'fn2', 'fn3'],
   *   ['fn2', 'fn3', 'fn4']
   * );
   * // Результат: ['fn2', 'fn3']
   * ```
   */
  findIntersection<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): T[] {
    if (set1.length === 0 || set2.length === 0) return [];

    const set2Ids = new Set(
      set2.map(item =>
        typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId)
      )
    );

    return set1.filter(item => {
      const id = typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId);
      return set2Ids.has(id);
    });
  }

  /**
   * Найти общие зависимости двух функций
   * (функции, достижимые из обеих)
   *
   * @param fnId1 - ID первой функции
   * @param fnId2 - ID второй функции
   * @returns Массив общих зависимостей
   *
   * @example
   * ```typescript
   * const common = analyzer.findCommonDependencies('fn64', 'fn169');
   * console.log(common.map(fn => fn.name));
   * ```
   */
  findCommonDependencies(
    fnId1: FunctionId | string | number,
    fnId2: FunctionId | string | number
  ): FunctionEntity[] {
    const deps1 = this.getReachableFunctions(fnId1);
    const deps2 = this.getReachableFunctions(fnId2);
    return this.findIntersection(deps1, deps2);
  }

  /**
   * Найти общих вызывающих для двух функций
   * (функции, которые могут достичь обе)
   *
   * @param fnId1 - ID первой функции
   * @param fnId2 - ID второй функции
   * @returns Массив общих вызывающих
   *
   * @example
   * ```typescript
   * const callers = analyzer.findCommonCallers('fn64', 'fn169');
   * console.log(callers.map(fn => fn.name));
   * ```
   */
  findCommonCallers(
    fnId1: FunctionId | string | number,
    fnId2: FunctionId | string | number
  ): FunctionEntity[] {
    const callers1 = this.getReachingFunctions(fnId1);
    const callers2 = this.getReachingFunctions(fnId2);
    return this.findIntersection(callers1, callers2);
  }

  /**
   * Найти общие функции между двумя множествами сущностей
   *
   * @param entities1 - Массив сущностей функций
   * @param entities2 - Массив сущностей функций
   * @returns Массив общих сущностей
   */
  findCommonEntities(entities1: FunctionEntity[], entities2: FunctionEntity[]): FunctionEntity[] {
    const ids2 = new Set(entities2.map(e => e.id));
    return entities1.filter(e => ids2.has(e.id));
  }

  // ==================== МЕТОДЫ ДЛЯ МНОЖЕСТВ ====================

  /**
   * Найти разность двух множеств (элементы из set1, отсутствующие в set2)
   *
   * @param set1 - Первое множество
   * @param set2 - Второе множество
   * @returns Элементы из set1, отсутствующие в set2
   */
  findDifference<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): T[] {
    if (set1.length === 0) return [];
    if (set2.length === 0) return [...set1];

    const set2Ids = new Set(
      set2.map(item =>
        typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId)
      )
    );

    return set1.filter(item => {
      const id = typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId);
      return !set2Ids.has(id);
    });
  }

  /**
   * Найти симметрическую разность двух множеств
   * (элементы, присутствующие только в одном из множеств)
   *
   * @param set1 - Первое множество
   * @param set2 - Второе множество
   * @returns Элементы, присутствующие только в одном множестве
   */
  findSymmetricDifference<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): T[] {
    const diff1 = this.findDifference(set1, set2);
    const diff2 = this.findDifference(set2, set1);
    return [...diff1, ...diff2];
  }

  /**
   * Проверить, пересекаются ли два множества
   *
   * @param set1 - Первое множество
   * @param set2 - Второе множество
   * @returns true, если множества имеют общие элементы
   */
  hasIntersection<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): boolean {
    if (set1.length === 0 || set2.length === 0) return false;

    const set2Ids = new Set(
      set2.map(item =>
        typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId)
      )
    );

    return set1.some(item => {
      const id = typeof item === 'object' ? (item as { id: FunctionId }).id : (item as FunctionId);
      return set2Ids.has(id);
    });
  }

  /**
   * Получить размер пересечения двух множеств
   *
   * @param set1 - Первое множество
   * @param set2 - Второе множество
   * @returns Количество общих элементов
   */
  intersectionSize<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): number {
    return this.findIntersection(set1, set2).length;
  }

  // ==================== РАСШИРЕННЫЙ АНАЛИЗ ====================

  /**
   * Найти функции, которые являются общими зависимостями для всех
   * переданных функций
   *
   * @param functionIds - Массив ID функций
   * @returns Общие зависимости для всех функций
   */
  findCommonDependenciesForAll(functionIds: (FunctionId | string | number)[]): FunctionEntity[] {
    if (functionIds.length === 0) return [];

    const firstId = functionIds[0];
    if (firstId === undefined) return [];

    if (functionIds.length === 1) {
      return this.getReachableFunctions(firstId);
    }

    let common = this.getReachableFunctions(firstId);

    for (let i = 1; i < functionIds.length; i++) {
      const id = functionIds[i];
      if (id === undefined) continue;
      const deps = this.getReachableFunctions(id);
      common = this.findCommonEntities(common, deps);
      if (common.length === 0) break;
    }

    return common;
  }

  /**
   * Найти функции, которые являются общими вызывающими для всех
   * переданных функций
   *
   * @param functionIds - Массив ID функций
   * @returns Общие вызывающие для всех функций
   */
  findCommonCallersForAll(functionIds: (FunctionId | string | number)[]): FunctionEntity[] {
    if (functionIds.length === 0) return [];

    const firstId = functionIds[0];
    if (firstId === undefined) return [];

    if (functionIds.length === 1) {
      return this.getReachingFunctions(firstId);
    }

    let common = this.getReachingFunctions(firstId);

    for (let i = 1; i < functionIds.length; i++) {
      const id = functionIds[i];
      if (id === undefined) continue;
      const callers = this.getReachingFunctions(id);
      common = this.findCommonEntities(common, callers);
      if (common.length === 0) break;
    }

    return common;
  }

  /**
   * Найти функции, достижимые из любой из переданных функций
   * (объединение достижимых множеств)
   *
   * @param functionIds - Массив ID функций
   * @returns Объединение достижимых функций
   */
  findUnionOfDependencies(functionIds: (FunctionId | string | number)[]): FunctionEntity[] {
    const result = new Map<FunctionId, FunctionEntity>();

    for (const id of functionIds) {
      if (id === undefined) continue;
      const deps = this.getReachableFunctions(id);
      for (const dep of deps) {
        if (!result.has(dep.id)) {
          result.set(dep.id, dep);
        }
      }
    }

    return Array.from(result.values());
  }

  /**
   * Найти функции, которые достигают любую из переданных функций
   * (объединение вызывающих множеств)
   *
   * @param functionIds - Массив ID функций
   * @returns Объединение вызывающих функций
   */
  findUnionOfCallers(functionIds: (FunctionId | string | number)[]): FunctionEntity[] {
    const result = new Map<FunctionId, FunctionEntity>();

    for (const id of functionIds) {
      if (id === undefined) continue;
      const callers = this.getReachingFunctions(id);
      for (const caller of callers) {
        if (!result.has(caller.id)) {
          result.set(caller.id, caller);
        }
      }
    }

    return Array.from(result.values());
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Получить достижимые функции
   */
  private getReachableFunctions(functionId: FunctionId | string | number): FunctionEntity[] {
    if (!this.callGraph) return [];

    const normalizedId = this.normalizeId(functionId);
    if (!this.functionMap.has(normalizedId)) return [];

    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];
    const adjacency = this.callGraph.adjacency;
    const maxDepth = this.options.maxDepth;

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = adjacency.get(current) || new Set();
      for (const next of neighbors) {
        if (!result.has(next) && next !== normalizedId) {
          result.add(next);
          queue.push([next, depth + 1]);
        }
      }
    }

    return Array.from(result)
      .map(id => this.functionMap.get(id))
      .filter((fn): fn is FunctionEntity => fn !== undefined);
  }

  /**
   * Получить функции, достигающие целевую
   */
  private getReachingFunctions(functionId: FunctionId | string | number): FunctionEntity[] {
    if (!this.callGraph) return [];

    const normalizedId = this.normalizeId(functionId);
    if (!this.functionMap.has(normalizedId)) return [];

    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];
    const reverseAdjacency = this.callGraph.reverseAdjacency;
    const maxDepth = this.options.maxDepth;

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = reverseAdjacency.get(current) || new Set();
      for (const prev of neighbors) {
        if (!result.has(prev) && prev !== normalizedId) {
          result.add(prev);
          queue.push([prev, depth + 1]);
        }
      }
    }

    return Array.from(result)
      .map(id => this.functionMap.get(id))
      .filter((fn): fn is FunctionEntity => fn !== undefined);
  }

  /**
   * Нормализовать ID функции
   */
  private normalizeId(id: FunctionId | string | number): FunctionId {
    if (this.idNormalizer) {
      return this.idNormalizer.normalize(id);
    }
    if (typeof id === 'string' && id.startsWith('fn')) {
      return id as FunctionId;
    }
    return `fn${id}` as FunctionId;
  }

  // ==================== УТИЛИТЫ ====================

  /**
   * Получить статистику пересечений между двумя функциями
   *
   * @param fnId1 - ID первой функции
   * @param fnId2 - ID второй функции
   * @returns Статистика пересечений
   */
  getIntersectionStats(
    fnId1: FunctionId | string | number,
    fnId2: FunctionId | string | number
  ): {
    commonDependencies: number;
    commonCallers: number;
    deps1: number;
    deps2: number;
    callers1: number;
    callers2: number;
    overlapRatio: number;
  } {
    const deps1 = this.getReachableFunctions(fnId1);
    const deps2 = this.getReachableFunctions(fnId2);
    const callers1 = this.getReachingFunctions(fnId1);
    const callers2 = this.getReachingFunctions(fnId2);

    const commonDeps = this.findCommonEntities(deps1, deps2);
    const commonCallers = this.findCommonEntities(callers1, callers2);

    const totalUnique = new Set([...deps1, ...deps2]).size;
    const overlapRatio = totalUnique > 0 ? commonDeps.length / totalUnique : 0;

    return {
      commonDependencies: commonDeps.length,
      commonCallers: commonCallers.length,
      deps1: deps1.length,
      deps2: deps2.length,
      callers1: callers1.length,
      callers2: callers2.length,
      overlapRatio,
    };
  }

  /**
   * Найти функции, которые имеют наибольшее пересечение с заданной
   *
   * @param functionId - ID функции для сравнения
   * @param limit - Максимальное количество результатов
   * @returns Массив функций с количеством общих зависимостей
   */
  findMostOverlapping(
    functionId: FunctionId | string | number,
    limit: number = 10
  ): { function: FunctionEntity; overlap: number }[] {
    const target = this.normalizeId(functionId);
    const targetDeps = new Set(this.getReachableFunctions(target).map(fn => fn.id));

    const results: { function: FunctionEntity; overlap: number }[] = [];

    for (const [id, fn] of this.functionMap) {
      if (id === target) continue;

      const deps = this.getReachableFunctions(id);
      let overlap = 0;
      for (const dep of deps) {
        if (targetDeps.has(dep.id)) {
          overlap++;
        }
      }

      if (overlap > 0) {
        results.push({ function: fn, overlap });
      }
    }

    return results.sort((a, b) => b.overlap - a.overlap).slice(0, limit);
  }

  /**
   * Обновить опции
   */
  setOptions(options: Partial<IntersectionAnalyzerOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    return this;
  }

  /**
   * Получить опции
   */
  getOptions(): IntersectionAnalyzerOptions {
    return { ...this.options };
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать анализатор пересечений с настройками по умолчанию
 */
export function createDefaultIntersectionAnalyzer(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph: CallGraph | null,
  idNormalizer: IdNormalizer | null
): IntersectionAnalyzer {
  return new IntersectionAnalyzer(functionMap, callGraph, idNormalizer, {
    maxDepth: 10,
  });
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default IntersectionAnalyzer;
