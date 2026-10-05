// src/analysis/IsolationAnalyzer.ts

/**
 * Анализатор изолированных функций
 *
 * @module analysis/IsolationAnalyzer
 * @description Выявляет функции, которые никто не вызывает и которые никого не вызывают
 *
 * @example
 * ```typescript
 * import { IsolationAnalyzer } from './IsolationAnalyzer.js';
 *
 * const analyzer = new IsolationAnalyzer(functionMap, callGraph, idNormalizer);
 * const result = analyzer.analyze();
 *
 * console.log(`Найдено ${result.total} изолированных функций`);
 * console.log(`Процент: ${result.percentage}%`);
 * ```
 */

import type { FunctionId, FunctionEntity, IsolationResult } from '../types/index.js';
import type { CallGraph } from '../graph/CallGraph.js';
import type { IdNormalizer } from '../core/IdNormalizer.js';

/**
 * Опции для анализатора изолированных функций
 */
export interface IsolationAnalyzerOptions {
  /**
   * Включать функции с вызовами только констант
   * @default false
   */
  includeConstantOnly?: boolean;

  /**
   * Минимальное количество вызовов для считания функции "не изолированной"
   * @default 1
   */
  minCallsToConsider?: number;

  /**
   * Игнорировать рекурсивные вызовы
   * @default true
   */
  ignoreRecursive?: boolean;
}

export class IsolationAnalyzer {
  private functionMap: Map<FunctionId, FunctionEntity>;
  private callGraph: CallGraph | null;
  private idNormalizer: IdNormalizer | null;
  private options: Required<IsolationAnalyzerOptions>;

  constructor(
    functionMap: Map<FunctionId, FunctionEntity>,
    callGraph: CallGraph | null = null,
    idNormalizer: IdNormalizer | null = null,
    options: IsolationAnalyzerOptions = {}
  ) {
    this.functionMap = functionMap;
    this.callGraph = callGraph;
    this.idNormalizer = idNormalizer;
    this.options = {
      includeConstantOnly: options.includeConstantOnly ?? false,
      minCallsToConsider: options.minCallsToConsider ?? 1,
      ignoreRecursive: options.ignoreRecursive ?? true,
    };
  }

  /**
   * Анализировать изолированные функции
   */
  analyze(): IsolationResult {
    const allFunctions = Array.from(this.functionMap.values());
    const hasCallers = new Set<FunctionId>();
    const hasCalls = new Set<FunctionId>();
    const recursiveCalls = new Set<FunctionId>();

    if (this.callGraph) {
      const edges = this.callGraph.getEdges();

      for (const [from, to] of edges) {
        const fromId = this.idNormalizer?.normalize(from) || (from as FunctionId);
        const toId = this.idNormalizer?.normalize(to) || (to as FunctionId);

        // Отмечаем рекурсивные вызовы
        if (this.options.ignoreRecursive && fromId === toId) {
          recursiveCalls.add(fromId);
          continue;
        }

        hasCallers.add(toId);
        hasCalls.add(fromId);
      }
    }

    // Фильтруем изолированные функции
    let isolated = allFunctions.filter(fn => {
      const hasAnyCallers = hasCallers.has(fn.id);
      const hasAnyCalls = hasCalls.has(fn.id);
      const isRecursive = recursiveCalls.has(fn.id);

      // Если функция только рекурсивная и больше никого не вызывает
      if (isRecursive && !hasAnyCalls) {
        return this.options.includeConstantOnly;
      }

      // Основное условие изоляции
      const isIsolated = !hasAnyCallers && !hasAnyCalls;

      // Проверяем минимальное количество вызовов
      if (!isIsolated && this.options.minCallsToConsider > 1) {
        const callCount = this.getCallCount(fn.id);
        const callerCount = this.getCallerCount(fn.id);
        if (
          callCount < this.options.minCallsToConsider &&
          callerCount < this.options.minCallsToConsider
        ) {
          return true;
        }
      }

      return isIsolated;
    });

    // Дополнительная фильтрация: исключаем функции-конструкторы и точки входа
    isolated = isolated.filter(fn => {
      // Исключаем конструкторы классов
      if (fn.name.startsWith('constructor') || fn.name === 'constructor') {
        return false;
      }

      // Исключаем точки входа
      const entryPatterns = ['main', 'run', 'start', 'init', 'bootstrap', 'app'];
      if (entryPatterns.some(pattern => fn.name.toLowerCase().includes(pattern))) {
        return false;
      }

      return true;
    });

    // Сортируем по имени для консистентности
    isolated.sort((a, b) => a.name.localeCompare(b.name));

    return {
      total: isolated.length,
      percentage:
        allFunctions.length > 0 ? ((isolated.length / allFunctions.length) * 100).toFixed(1) : '0',
      functions: isolated,
    };
  }

  /**
   * Получить количество вызовов функции
   */
  private getCallCount(functionId: FunctionId): number {
    if (!this.callGraph) return 0;
    const normalizedId = this.idNormalizer?.normalize(functionId) || functionId;
    const calls = this.callGraph.getCalls(normalizedId);
    return calls.length;
  }

  /**
   * Получить количество вызывающих функций
   */
  private getCallerCount(functionId: FunctionId): number {
    if (!this.callGraph) return 0;
    const normalizedId = this.idNormalizer?.normalize(functionId) || functionId;
    const callers = this.callGraph.getCallers(normalizedId);
    return callers.length;
  }

  /**
   * Получить изолированные функции с деталями
   */
  analyzeWithDetails(): IsolationResult & {
    details: {
      function: FunctionEntity;
      callCount: number;
      callerCount: number;
      isRecursive: boolean;
      reason: string;
    }[];
  } {
    const baseResult = this.analyze();
    const details = baseResult.functions.map(fn => {
      const callCount = this.getCallCount(fn.id);
      const callerCount = this.getCallerCount(fn.id);
      const isRecursive = this.isRecursive(fn.id);

      let reason = 'Функция не имеет вызовов и не вызывается';
      if (callCount === 0 && callerCount > 0) {
        reason = 'Функция не вызывает другие функции, но может быть вызвана';
      } else if (callCount > 0 && callerCount === 0) {
        reason = 'Функция вызывает другие функции, но сама не вызывается';
      } else if (isRecursive) {
        reason = 'Функция только рекурсивная';
      }

      return {
        function: fn,
        callCount,
        callerCount,
        isRecursive,
        reason,
      };
    });

    return {
      ...baseResult,
      details,
    };
  }

  /**
   * Проверить, является ли функция рекурсивной
   */
  private isRecursive(functionId: FunctionId): boolean {
    if (!this.callGraph) return false;

    const normalizedId = this.idNormalizer?.normalize(functionId) || functionId;
    const adjacency = this.callGraph.adjacency;
    const neighbors = adjacency.get(normalizedId) || new Set();

    return neighbors.has(normalizedId);
  }

  /**
   * Получить изолированные функции по модулю
   */
  getIsolatedByModule(): Map<string, FunctionEntity[]> {
    const result = this.analyze();
    const isolated = new Map<string, FunctionEntity[]>();

    for (const fn of result.functions) {
      const moduleKey = fn.module || 'unknown';
      if (!isolated.has(moduleKey)) {
        isolated.set(moduleKey, []);
      }
      isolated.get(moduleKey)!.push(fn);
    }

    return isolated;
  }

  /**
   * Получить изолированные функции по файлу
   */
  getIsolatedByFile(): Map<string, FunctionEntity[]> {
    const result = this.analyze();
    const isolated = new Map<string, FunctionEntity[]>();

    for (const fn of result.functions) {
      const fileKey = fn.file || 'unknown';
      if (!isolated.has(fileKey)) {
        isolated.set(fileKey, []);
      }
      isolated.get(fileKey)!.push(fn);
    }

    return isolated;
  }

  /**
   * Экспортировать результаты в JSON
   */
  exportJSON(): string {
    const result = this.analyzeWithDetails();
    return JSON.stringify(result, null, 2);
  }

  /**
   * Получить статистику по изолированным функциям
   */
  getStats(): {
    total: number;
    percentage: string;
    byModule: Record<string, number>;
    byFile: Record<string, number>;
    averageCalls: number;
    maxCalls: number;
    minCalls: number;
  } {
    const result = this.analyze();
    const byModule: Record<string, number> = {};
    const byFile: Record<string, number> = {};
    const callCounts: number[] = [];

    for (const fn of result.functions) {
      const moduleKey = fn.module || 'unknown';
      const fileKey = fn.file || 'unknown';

      byModule[moduleKey] = (byModule[moduleKey] || 0) + 1;
      byFile[fileKey] = (byFile[fileKey] || 0) + 1;

      const callCount = this.getCallCount(fn.id);
      callCounts.push(callCount);
    }

    const totalCalls = callCounts.reduce((a, b) => a + b, 0);
    const averageCalls = callCounts.length > 0 ? totalCalls / callCounts.length : 0;
    const maxCalls = callCounts.length > 0 ? Math.max(...callCounts) : 0;
    const minCalls = callCounts.length > 0 ? Math.min(...callCounts) : 0;

    return {
      total: result.total,
      percentage: result.percentage,
      byModule,
      byFile,
      averageCalls,
      maxCalls,
      minCalls,
    };
  }

  /**
   * Обновить опции
   */
  setOptions(options: Partial<IsolationAnalyzerOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    return this;
  }

  /**
   * Получить текущие опции
   */
  getOptions(): IsolationAnalyzerOptions {
    return { ...this.options };
  }

  /**
   * Сбросить состояние анализатора
   */
  reset(): this {
    // Ничего не делаем, т.к. анализатор не хранит состояние между вызовами
    return this;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать анализатор с настройками по умолчанию
 */
export function createDefaultIsolationAnalyzer(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph: CallGraph | null = null,
  idNormalizer: IdNormalizer | null = null
): IsolationAnalyzer {
  return new IsolationAnalyzer(functionMap, callGraph, idNormalizer, {
    includeConstantOnly: false,
    minCallsToConsider: 1,
    ignoreRecursive: true,
  });
}

/**
 * Создать анализатор для строгого режима
 */
export function createStrictIsolationAnalyzer(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph: CallGraph | null = null,
  idNormalizer: IdNormalizer | null = null
): IsolationAnalyzer {
  return new IsolationAnalyzer(functionMap, callGraph, idNormalizer, {
    includeConstantOnly: false,
    minCallsToConsider: 0,
    ignoreRecursive: false,
  });
}

/**
 * Создать анализатор для мягкого режима (включает функции с константами)
 */
export function createSoftIsolationAnalyzer(
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph: CallGraph | null = null,
  idNormalizer: IdNormalizer | null = null
): IsolationAnalyzer {
  return new IsolationAnalyzer(functionMap, callGraph, idNormalizer, {
    includeConstantOnly: true,
    minCallsToConsider: 2,
    ignoreRecursive: true,
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для IsolationAnalyzer
 */
export interface TestIsolationData {
  functions: FunctionEntity[];
  calls: [FunctionId, FunctionId][];
  expectedIsolated: FunctionId[];
}

/**
 * Создать тестовые данные
 */
export function createTestIsolationData(
  functions: FunctionEntity[],
  calls: [FunctionId, FunctionId][],
  expectedIsolated: FunctionId[]
): TestIsolationData {
  return {
    functions,
    calls,
    expectedIsolated,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default IsolationAnalyzer;
