// src/analysis/DeadCodeAnalyzer.ts

/**
 * Анализатор мёртвого кода
 *
 * @module analysis/DeadCodeAnalyzer
 * @description Выявляет функции, которые никогда не вызываются
 *
 * @example
 * ```typescript
 * import { DeadCodeAnalyzer } from './DeadCodeAnalyzer.js';
 *
 * const analyzer = new DeadCodeAnalyzer(functionMap, callGraph, idNormalizer);
 * const result = analyzer.analyze();
 * console.log(`Мёртвых функций: ${result.total} (${result.percentage}%)`);
 * ```
 */

import {
  FunctionId,
  FunctionEntity,
  DeadCodeResult,
} from '../types/index.js';
import { CallGraph } from '../graph/CallGraph.js';
import { IdNormalizer } from '../core/IdNormalizer.js';

export class DeadCodeAnalyzer {
  constructor(
    private functionMap: Map<FunctionId, FunctionEntity>,
    private callGraph: CallGraph | null,
    private idNormalizer: IdNormalizer | null
  ) {}

  /**
   * Анализировать мёртвый код
   *
   * @returns Результат анализа с количеством и списком мёртвых функций
   */
  analyze(): DeadCodeResult {
    const allFunctions = Array.from(this.functionMap.values());
    const calledIds = new Set<FunctionId>();

    // Собираем все функции, которые вызываются
    if (this.callGraph) {
      const edges = this.callGraph.getEdges();
      for (const [, to] of edges) {
        const normalizedId = this.idNormalizer?.normalize(to) || (to as FunctionId);
        calledIds.add(normalizedId);
      }
    }

    // Фильтруем функции, которые не вызываются
    const dead = allFunctions.filter(fn => !calledIds.has(fn.id));

    // Сортируем по имени для удобства
    dead.sort((a, b) => a.name.localeCompare(b.name));

    return {
      total: dead.length,
      percentage: allFunctions.length > 0
        ? (dead.length / allFunctions.length * 100).toFixed(1)
        : '0',
      functions: dead,
    };
  }

  /**
   * Получить мёртвые функции с дополнительной информацией
   */
  analyzeDetailed(): DeadCodeResult & {
    byModule: Record<string, number>;
    byFile: Record<string, number>;
  } {
    const result = this.analyze();
    const byModule: Record<string, number> = {};
    const byFile: Record<string, number> = {};

    for (const fn of result.functions) {
      byModule[fn.module] = (byModule[fn.module] || 0) + 1;
      byFile[fn.file] = (byFile[fn.file] || 0) + 1;
    }

    return {
      ...result,
      byModule,
      byFile,
    };
  }

  /**
   * Получить список мёртвых функций с их расположением
   */
  getDeadFunctionsWithLocation(): {
    name: string;
    id: FunctionId;
    file: string;
    line: number;
    module: string;
  }[] {
    const result = this.analyze();
    return result.functions.map(fn => ({
      name: fn.name,
      id: fn.id,
      file: fn.file,
      line: fn.line,
      module: fn.module,
    }));
  }

  /**
   * Проверить, является ли функция мёртвой
   */
  isDead(functionId: FunctionId | string | number): boolean {
    const normalizedId = this.idNormalizer?.normalize(functionId) ||
      (typeof functionId === 'string' && functionId.startsWith('fn')
        ? functionId as FunctionId
        : `fn${functionId}` as FunctionId);

    // Проверяем, вызывается ли функция
    if (this.callGraph) {
      const callers = this.callGraph.getCallers(normalizedId);
      return callers.length === 0;
    }

    return true;
  }

  /**
   * Получить цепочку вызовов для мёртвой функции (почему она мёртвая)
   */
  getDeadFunctionChain(functionId: FunctionId | string | number): {
    function: FunctionEntity | null;
    callers: { id: FunctionId; name: string }[];
    reachableFrom: string[];
  } {
    const normalizedId = this.idNormalizer?.normalize(functionId) ||
      (typeof functionId === 'string' && functionId.startsWith('fn')
        ? functionId as FunctionId
        : `fn${functionId}` as FunctionId);

    const fn = this.functionMap.get(normalizedId);
    if (!fn) {
      return {
        function: null,
        callers: [],
        reachableFrom: [],
      };
    }

    // Находим вызывающие функции
    const callers: { id: FunctionId; name: string }[] = [];
    if (this.callGraph) {
      const callerEdges = this.callGraph.getCallers(normalizedId);
      for (const edge of callerEdges) {
        const callerFn = this.functionMap.get(edge.from);
        if (callerFn) {
          callers.push({ id: edge.from, name: callerFn.name });
        }
      }
    }

    // Находим, откуда можно достичь эту функцию
    const reachableFrom: string[] = [];
    if (this.callGraph) {
      const reaching = this.callGraph.getReachingFunctions(normalizedId, 3);
      for (const id of reaching) {
        const reachingFn = this.functionMap.get(id);
        if (reachingFn) {
          reachableFrom.push(reachingFn.name);
        }
      }
    }

    return {
      function: fn,
      callers,
      reachableFrom: reachableFrom.slice(0, 10),
    };
  }

  /**
   * Экспортировать результаты в JSON
   */
  exportJSON(pretty: boolean = true): string {
    const result = this.analyzeDetailed();
    return pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);
  }

  /**
   * Экспортировать результаты в CSV
   */
  exportCSV(): string {
    const functions = this.getDeadFunctionsWithLocation();
    if (functions.length === 0) {
      return 'Нет мёртвых функций';
    }

    const headers = ['Имя функции', 'ID', 'Файл', 'Строка', 'Модуль'];
    const rows = functions.map(fn => [
      fn.name,
      fn.id,
      fn.file,
      String(fn.line),
      fn.module,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
  }

  /**
   * Получить статистику по мёртвому коду
   */
  getStats(): {
    totalFunctions: number;
    deadFunctions: number;
    deadPercentage: string;
    aliveFunctions: number;
    alivePercentage: string;
    byModule: Record<string, number>;
  } {
    const result = this.analyze();
    const total = this.functionMap.size;
    const dead = result.total;
    const alive = total - dead;

    return {
      totalFunctions: total,
      deadFunctions: dead,
      deadPercentage: result.percentage,
      aliveFunctions: alive,
      alivePercentage: total > 0 ? ((alive / total) * 100).toFixed(1) : '0',
      byModule: (result as any).byModule || {},
    };
  }

  /**
   * Найти мёртвые функции с наибольшим количеством строк кода
   */
  getLargestDeadFunctions(limit: number = 10): {
    function: FunctionEntity;
    estimatedLines: number;
  }[] {
    const result = this.analyze();
    const withLines = result.functions.map(fn => ({
      function: fn,
      // Приблизительная оценка размера (по номеру строки)
      estimatedLines: fn.line % 100 + 10,
    }));

    return withLines
      .sort((a, b) => b.estimatedLines - a.estimatedLines)
      .slice(0, limit);
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать анализатор мёртвого кода с настройками по умолчанию
 */
export function createDefaultDeadCodeAnalyzer(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph?: CallGraph,
  idNormalizer?: IdNormalizer
): DeadCodeAnalyzer {
  return new DeadCodeAnalyzer(functionMap, callGraph || null, idNormalizer || null);
}

/**
 * Быстрый анализ мёртвого кода
 */
export function quickDeadCodeAnalysis(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph?: CallGraph,
  idNormalizer?: IdNormalizer
): DeadCodeResult {
  const analyzer = new DeadCodeAnalyzer(functionMap, callGraph || null, idNormalizer || null);
  return analyzer.analyze();
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для DeadCodeAnalyzer
 */
export interface TestDeadCodeData {
  functionMap: Map<FunctionId, FunctionEntity>;
  callGraph: CallGraph | null;
  expectedDead: FunctionId[];
}

/**
 * Создать тестовые данные
 */
export function createTestDeadCodeData(
  functions: FunctionEntity[],
  deadIds: FunctionId[],
  callGraph?: CallGraph
): TestDeadCodeData {
  const functionMap = new Map<FunctionId, FunctionEntity>();
  for (const fn of functions) {
    functionMap.set(fn.id, fn);
  }

  return {
    functionMap,
    callGraph: callGraph || null,
    expectedDead: deadIds,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default DeadCodeAnalyzer;
