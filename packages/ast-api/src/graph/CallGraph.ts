// src/graph/CallGraph.ts

/**
 * Граф вызовов для AST отчета
 *
 * @module graph/CallGraph
 * @description Построение и анализ графа вызовов между функциями
 *
 * @example
 * ```typescript
 * import { CallGraph } from './CallGraph.js';
 * import { IdNormalizer } from '../core/IdNormalizer.js';
 *
 * const callGraph = new CallGraph(idNormalizer, functionMap);
 * callGraph.build(data.gr.c);
 *
 * // Получить вызовы функции
 * const calls = callGraph.getCalls('fn64');
 *
 * // Получить вызывающие
 * const callers = callGraph.getCallers('fn64');
 *
 * // Проверить вызов
 * const isCalled = callGraph.calls('fn64', 'fn169');
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  CallEdge,
  CallType,
  ModuleId,
  ModuleEntity,
} from '../types/index.js';
import type { IdNormalizer } from '../core/IdNormalizer.js';

// ==================== ТИПЫ ====================

/**
 * Ребро вызова с метаданными (от вызывающего)
 */
export interface CallEdgeWithMeta {
  /** Целевая функция */
  to: FunctionId;
  /** Строка вызова */
  line: number;
  /** Тип вызова */
  type: CallType;
}

/**
 * Ребро вызова с метаданными (от вызываемого)
 */
export interface CallerEdgeWithMeta {
  /** Исходная функция (кто вызывает) */
  from: FunctionId;
  /** Строка вызова */
  line: number;
  /** Тип вызова */
  type: CallType;
}

/**
 * Кросс-модульный вызов
 */
export interface CrossModuleCall {
  /** Исходная функция */
  from: FunctionId;
  /** Имя модуля-источника */
  fromModule: string;
  /** ID модуля-источника */
  fromModuleId: ModuleId;
  /** Целевая функция */
  to: FunctionId;
  /** Имя модуля-цели */
  toModule: string;
  /** ID модуля-цели */
  toModuleId: ModuleId;
  /** Строка вызова */
  line: number;
  /** Тип вызова */
  type: CallType;
}

/**
 * Статистика графа вызовов
 */
export interface CallGraphStats {
  /** Общее количество ребер */
  totalEdges: number;
  /** Уникальные вызывающие функции */
  uniqueCallers: number;
  /** Уникальные вызываемые функции */
  uniqueCallees: number;
  /** Количество кросс-модульных вызовов */
  crossModuleCalls: number;
  /** Распределение по типам вызовов */
  byType: Record<CallType, number>;
  /** Функции с наибольшим количеством вызовов */
  topCalled: { id: FunctionId; name: string; calls: number }[];
  /** Функции, которые больше всего вызывают */
  topCalling: { id: FunctionId; name: string; calls: number }[];
}

/**
 * Путь в графе
 */
export interface GraphPath {
  /** Последовательность ID функций */
  nodes: FunctionId[];
  /** Длина пути */
  length: number;
  /** Имена функций */
  names: string[];
  /** Вес пути (количество ребер) */
  weight: number;
}

/**
 * Результат поиска в графе
 */
export interface GraphSearchResult {
  /** Найден ли путь */
  found: boolean;
  /** Путь (если найден) */
  path?: GraphPath;
  /** Глубина поиска */
  depth: number;
  /** Количество просмотренных узлов */
  visited: number;
}

/**
 * Опции для построения графа
 */
export interface CallGraphOptions {
  /** Логировать предупреждения */
  logWarnings?: boolean;
  /** Игнорировать невалидные ребра */
  skipInvalidEdges?: boolean;
  /** Максимальная глубина для поиска */
  maxDepth?: number;
}

// ==================== ОСНОВНОЙ КЛАСС ====================

export class CallGraph {
  // ==================== ПУБЛИЧНЫЕ ПОЛЯ ====================

  /** Все ребра графа */
  public edges: CallEdge[] = [];

  /** Карта: вызывающий -> список вызовов */
  public byCaller = new Map<FunctionId, CallEdgeWithMeta[]>();

  /** Карта: вызываемый -> список вызывающих */
  public byCallee = new Map<FunctionId, CallerEdgeWithMeta[]>();

  /** Матрица смежности (прямая) */
  public adjacency = new Map<FunctionId, Set<FunctionId>>();

  /** Матрица смежности (обратная) */
  public reverseAdjacency = new Map<FunctionId, Set<FunctionId>>();

  // ==================== ПРИВАТНЫЕ ПОЛЯ ====================

  /** Кеш для поиска путей */
  private pathCache = new Map<string, GraphPath[]>();

  /** Кеш для достижимости */
  private reachabilityCache = new Map<string, boolean>();

  /** ID нормализатор */
  public idNormalizer: IdNormalizer;

  /** Карта функций */
  private functionMap: Map<FunctionId, FunctionEntity>;

  /** Карта модулей */
  private moduleMap?: Map<ModuleId, ModuleEntity>;

  /** Опции */
  private options: Required<CallGraphOptions>;

  /** Статистика построения */
  private buildStats = {
    totalEdges: 0,
    validEdges: 0,
    invalidEdges: 0,
    warnings: 0,
  };

  // ==================== КОНСТРУКТОР ====================

  constructor(
    idNormalizer: IdNormalizer,
    functionMap: Map<FunctionId, FunctionEntity>,
    moduleMap?: Map<ModuleId, ModuleEntity>,
    options: CallGraphOptions = {}
  ) {
    this.idNormalizer = idNormalizer;
    this.functionMap = functionMap;
    this.moduleMap = moduleMap;
    this.options = {
      logWarnings: options.logWarnings ?? true,
      skipInvalidEdges: options.skipInvalidEdges ?? true,
      maxDepth: options.maxDepth ?? 20,
    };
  }

  // ==================== ПОСТРОЕНИЕ ГРАФА ====================

  /**
   * Построить граф вызовов
   */
  build(edges: CallEdge[]): this {
    this.edges = edges;
    this.byCaller.clear();
    this.byCallee.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.pathCache.clear();
    this.reachabilityCache.clear();

    this.buildStats = {
      totalEdges: edges.length,
      validEdges: 0,
      invalidEdges: 0,
      warnings: 0,
    };

    for (const [from, to, line, type] of edges) {
      const fromId = this.idNormalizer.normalize(from);
      const toId = this.idNormalizer.normalize(to);

      const fromValid = this.functionMap.has(fromId);
      const toValid = this.functionMap.has(toId);

      if (!fromValid || !toValid) {
        this.buildStats.invalidEdges++;
        if (this.options.logWarnings) {
          console.warn(`⚠️ [CallGraph] Пропущено ребро: ${from} -> ${to} (невалидные ID)`);
        }
        if (!this.options.skipInvalidEdges) {
          throw new Error(
            `Невалидное ребро: ${from} (${fromValid ? 'valid' : 'invalid'}) -> ${to} (${toValid ? 'valid' : 'invalid'})`
          );
        }
        continue;
      }

      this.buildStats.validEdges++;
      this.addEdge(fromId, toId, line, type);
    }

    if (this.buildStats.invalidEdges > 0 && this.options.logWarnings) {
      console.warn(
        `⚠️ [CallGraph] ${this.buildStats.invalidEdges} ребер пропущено, ${this.buildStats.validEdges} обработано`
      );
    }

    return this;
  }

  /**
   * Добавить ребро в граф
   */
  private addEdge(fromId: FunctionId, toId: FunctionId, line: number, type: CallType): void {
    // byCaller
    if (!this.byCaller.has(fromId)) {
      this.byCaller.set(fromId, []);
    }
    this.byCaller.get(fromId)!.push({ to: toId, line, type });

    // byCallee
    if (!this.byCallee.has(toId)) {
      this.byCallee.set(toId, []);
    }
    this.byCallee.get(toId)!.push({ from: fromId, line, type });

    // adjacency
    if (!this.adjacency.has(fromId)) {
      this.adjacency.set(fromId, new Set());
    }
    this.adjacency.get(fromId)!.add(toId);

    // reverseAdjacency
    if (!this.reverseAdjacency.has(toId)) {
      this.reverseAdjacency.set(toId, new Set());
    }
    this.reverseAdjacency.get(toId)!.add(fromId);
  }

  /**
   * Добавить ребро в граф (публичный метод)
   */
  addEdgePublic(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    line: number,
    type: CallType
  ): this {
    const normalizedFrom = this.idNormalizer.normalize(fromId);
    const normalizedTo = this.idNormalizer.normalize(toId);

    if (!this.functionMap.has(normalizedFrom) || !this.functionMap.has(normalizedTo)) {
      throw new Error(`Невалидные ID: ${normalizedFrom} -> ${normalizedTo}`);
    }

    this.addEdge(normalizedFrom, normalizedTo, line, type);
    return this;
  }

  // ==================== ГЕТТЕРЫ ====================

  /**
   * Получить все ребра графа
   */
  getEdges(): CallEdge[] {
    return this.edges;
  }

  /**
   * Получить карту вызывающих
   */
  getByCaller(): Map<FunctionId, CallEdgeWithMeta[]> {
    return this.byCaller;
  }

  /**
   * Получить карту вызываемых
   */
  getByCallee(): Map<FunctionId, CallerEdgeWithMeta[]> {
    return this.byCallee;
  }

  /**
   * Получить вызовы функции (куда вызывает)
   */
  getCalls(functionId: FunctionId | string | number): CallEdgeWithMeta[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCaller.get(normalizedId) || [];
  }

  /**
   * Получить вызывающие функции (кто вызывает)
   */
  getCallers(functionId: FunctionId | string | number): CallerEdgeWithMeta[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCallee.get(normalizedId) || [];
  }

  /**
   * Проверить, вызывает ли функция другую
   */
  calls(functionId: FunctionId | string | number, targetId: FunctionId | string | number): boolean {
    const normalizedId = this.idNormalizer.normalize(functionId);
    const adjacency = this.adjacency.get(normalizedId);
    return adjacency ? adjacency.has(this.idNormalizer.normalize(targetId)) : false;
  }

  /**
   * Проверить, вызывается ли функция
   */
  isCalled(functionId: FunctionId | string | number): boolean {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCallee.has(normalizedId) && this.byCallee.get(normalizedId)!.length > 0;
  }

  /**
   * Проверить, вызывает ли функция кого-либо
   */
  hasCalls(functionId: FunctionId | string | number): boolean {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCaller.has(normalizedId) && this.byCaller.get(normalizedId)!.length > 0;
  }

  /**
   * Получить количество вызовов функции
   */
  getCallCount(functionId: FunctionId | string | number): number {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCaller.get(normalizedId)?.length || 0;
  }

  /**
   * Получить количество вызывающих
   */
  getCallerCount(functionId: FunctionId | string | number): number {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byCallee.get(normalizedId)?.length || 0;
  }

  // ==================== КРОСС-МОДУЛЬНЫЙ АНАЛИЗ ====================

  /**
   * Получить кросс-модульные вызовы
   */
  getCrossModuleCalls(): CrossModuleCall[] {
    const result: CrossModuleCall[] = [];

    for (const [fromId, targets] of this.byCaller) {
      const fromFn = this.functionMap.get(fromId);
      if (!fromFn) continue;

      for (const { to, line, type } of targets) {
        const toFn = this.functionMap.get(to);
        if (!toFn) continue;

        if (fromFn.moduleId !== toFn.moduleId) {
          const fromModule = this.moduleMap?.get(fromFn.moduleId);
          const toModule = this.moduleMap?.get(toFn.moduleId);

          result.push({
            from: fromId,
            fromModule: fromModule?.name || fromFn.module,
            fromModuleId: fromFn.moduleId,
            to: to,
            toModule: toModule?.name || toFn.module,
            toModuleId: toFn.moduleId,
            line,
            type,
          });
        }
      }
    }

    // Сортируем по модулям
    result.sort((a, b) => {
      if (a.fromModule !== b.fromModule) {
        return a.fromModule.localeCompare(b.fromModule);
      }
      return a.toModule.localeCompare(b.toModule);
    });

    return result;
  }

  /**
   * Получить кросс-модульные вызовы по модулю
   */
  getCrossModuleCallsByModule(moduleId: ModuleId): CrossModuleCall[] {
    return this.getCrossModuleCalls().filter(
      call => call.fromModuleId === moduleId || call.toModuleId === moduleId
    );
  }

  /**
   * Получить модули с наибольшим количеством кросс-модульных вызовов
   */
  getTopCrossModuleModules(
    limit: number = 10
  ): { moduleId: ModuleId; name: string; calls: number }[] {
    const count = new Map<ModuleId, number>();

    for (const call of this.getCrossModuleCalls()) {
      count.set(call.fromModuleId, (count.get(call.fromModuleId) || 0) + 1);
      count.set(call.toModuleId, (count.get(call.toModuleId) || 0) + 1);
    }

    return Array.from(count.entries())
      .map(([moduleId, calls]) => ({
        moduleId,
        name: this.moduleMap?.get(moduleId)?.name || moduleId,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику графа
   */
  getStats(): CallGraphStats {
    const byType: Record<CallType, number> = {
      d: 0,
      a: 0,
      m: 0,
      c: 0,
      di: 0,
    };

    for (const [, , , type] of this.edges) {
      byType[type] = (byType[type] || 0) + 1;
    }

    // Топ вызываемых
    const calledCount = new Map<FunctionId, number>();
    for (const [, to] of this.edges) {
      const toId = this.idNormalizer.normalize(to);
      if (this.functionMap.has(toId)) {
        calledCount.set(toId, (calledCount.get(toId) || 0) + 1);
      }
    }

    const topCalled = Array.from(calledCount.entries())
      .map(([id, calls]) => ({
        id,
        name: this.functionMap.get(id)?.name || id,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    // Топ вызывающих
    const callingCount = new Map<FunctionId, number>();
    for (const [from] of this.edges) {
      const fromId = this.idNormalizer.normalize(from);
      if (this.functionMap.has(fromId)) {
        callingCount.set(fromId, (callingCount.get(fromId) || 0) + 1);
      }
    }

    const topCalling = Array.from(callingCount.entries())
      .map(([id, calls]) => ({
        id,
        name: this.functionMap.get(id)?.name || id,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      totalEdges: this.edges.length,
      uniqueCallers: this.byCaller.size,
      uniqueCallees: this.byCallee.size,
      crossModuleCalls: this.getCrossModuleCalls().length,
      byType,
      topCalled,
      topCalling,
    };
  }

  /**
   * Получить статистику построения
   */
  getBuildStats(): {
    totalEdges: number;
    validEdges: number;
    invalidEdges: number;
    warnings: number;
  } {
    return { ...this.buildStats };
  }

  // ==================== АНАЛИЗ ГРАФА ====================

  /**
   * Найти все достижимые функции
   */
  getReachableFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = 10
  ): FunctionId[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = this.adjacency.get(current) || new Set();
      for (const next of neighbors) {
        if (!result.has(next) && next !== normalizedId) {
          result.add(next);
          queue.push([next, depth + 1]);
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Найти все функции, которые могут достичь заданную
   */
  getReachingFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = 10
  ): FunctionId[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = this.reverseAdjacency.get(current) || new Set();
      for (const prev of neighbors) {
        if (!result.has(prev) && prev !== normalizedId) {
          result.add(prev);
          queue.push([prev, depth + 1]);
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Найти все функции в подграфе
   */
  getSubgraph(functionId: FunctionId | string | number, maxDepth: number = 10): Set<FunctionId> {
    const normalizedId = this.idNormalizer.normalize(functionId);
    const result = new Set<FunctionId>([normalizedId]);
    const queue: [FunctionId, number][] = [[normalizedId, 0]];

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = this.adjacency.get(current) || new Set();
      for (const next of neighbors) {
        if (!result.has(next)) {
          result.add(next);
          queue.push([next, depth + 1]);
        }
      }

      const reverseNeighbors = this.reverseAdjacency.get(current) || new Set();
      for (const prev of reverseNeighbors) {
        if (!result.has(prev)) {
          result.add(prev);
          queue.push([prev, depth + 1]);
        }
      }
    }

    return result;
  }

  // ==================== КЕШИРОВАНИЕ ====================

  /**
   * Очистить кеш путей
   */
  clearPathCache(): this {
    this.pathCache.clear();
    this.reachabilityCache.clear();
    return this;
  }

  /**
   * Получить размер кеша
   */
  getCacheSize(): { paths: number; reachability: number } {
    return {
      paths: this.pathCache.size,
      reachability: this.reachabilityCache.size,
    };
  }

  // ==================== ЭКСПОРТ ====================

  /**
   * Экспортировать граф в JSON
   */
  exportJSON(): string {
    return JSON.stringify(
      {
        edges: this.edges,
        byCaller: Array.from(this.byCaller.entries()),
        byCallee: Array.from(this.byCallee.entries()),
        adjacency: Array.from(this.adjacency.entries()).map(([k, v]) => [k, Array.from(v)]),
        reverseAdjacency: Array.from(this.reverseAdjacency.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
      },
      null,
      2
    );
  }

  /**
   * Экспортировать граф в DOT
   */
  exportDOT(options: { showLabels?: boolean; rankdir?: 'TB' | 'LR' | 'BT' | 'RL' } = {}): string {
    const { showLabels = true, rankdir = 'LR' } = options;
    const nodes = new Set<FunctionId>();

    for (const [from, to] of this.edges) {
      nodes.add(this.idNormalizer.normalize(from));
      nodes.add(this.idNormalizer.normalize(to));
    }

    let dot = `digraph CallGraph {\n`;
    dot += `  rankdir=${rankdir};\n`;
    dot += `  node [shape=box];\n\n`;

    for (const node of nodes) {
      const fn = this.functionMap.get(node);
      const label = showLabels && fn ? fn.name : node;
      dot += `  "${node}" [label="${label}"];\n`;
    }

    dot += '\n';
    for (const [from, to, line, type] of this.edges) {
      const fromId = this.idNormalizer.normalize(from);
      const toId = this.idNormalizer.normalize(to);
      const label = `[${type}] l${line}`;
      const color = this.getEdgeColor(type);
      dot += `  "${fromId}" -> "${toId}" [label="${label}", color="${color}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Получить цвет ребра по типу вызова
   */
  private getEdgeColor(type: CallType): string {
    switch (type) {
      case 'd':
        return 'black';
      case 'a':
        return 'blue';
      case 'm':
        return 'green';
      case 'c':
        return 'orange';
      case 'di':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Экспортировать граф в CSV
   */
  exportCSV(): string {
    let csv = 'from,to,line,type\n';
    for (const [from, to, line, type] of this.edges) {
      csv += `${from},${to},${line},${type}\n`;
    }
    return csv;
  }

  // ==================== СБРОС ====================

  /**
   * Сбросить состояние
   */
  reset(): this {
    this.edges = [];
    this.byCaller.clear();
    this.byCallee.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.pathCache.clear();
    this.reachabilityCache.clear();
    return this;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать пустой граф вызовов
 */
export function createEmptyCallGraph(
  idNormalizer: IdNormalizer,
  functionMap: Map<FunctionId, FunctionEntity>
): CallGraph {
  return new CallGraph(idNormalizer, functionMap);
}

/**
 * Объединить несколько графов
 */
export function mergeCallGraphs(graphs: CallGraph[]): CallGraph {
  if (graphs.length === 0) {
    throw new Error('Нет графов для объединения');
  }

  const base = graphs[0];
  if (!base) {
    throw new Error('Первый граф не определен');
  }

  const result = new CallGraph(base['idNormalizer'], base['functionMap']);

  const allEdges: CallEdge[] = [];
  for (const graph of graphs) {
    allEdges.push(...graph.getEdges());
  }

  result.build(allEdges);
  return result;
}

/**
 * Фильтровать граф по модулям
 */
export function filterCallGraphByModules(graph: CallGraph, moduleIds: ModuleId[]): CallGraph {
  const functionMap = graph['functionMap'];
  const filteredEdges: CallEdge[] = [];

  for (const [from, to, line, type] of graph.getEdges()) {
    const fromId = graph['idNormalizer'].normalize(from);
    const toId = graph['idNormalizer'].normalize(to);
    const fromFn = functionMap.get(fromId);
    const toFn = functionMap.get(toId);

    if (
      fromFn &&
      toFn &&
      moduleIds.includes(fromFn.moduleId) &&
      moduleIds.includes(toFn.moduleId)
    ) {
      filteredEdges.push([from, to, line, type]);
    }
  }

  const result = new CallGraph(graph['idNormalizer'], functionMap);
  result.build(filteredEdges);
  return result;
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для графа вызовов
 */
export interface TestCallGraphData {
  edges: CallEdge[];
  functions: Map<FunctionId, FunctionEntity>;
}

/**
 * Создать тестовый граф
 */
export function createTestCallGraph(
  idNormalizer: IdNormalizer,
  functionMap: Map<FunctionId, FunctionEntity>
): CallGraph {
  const graph = new CallGraph(idNormalizer, functionMap);

  // Добавляем тестовые ребра
  const testEdges: CallEdge[] = [
    ['fn1' as FunctionId, 'fn2' as FunctionId, 10, 'd'],
    ['fn1' as FunctionId, 'fn3' as FunctionId, 20, 'a'],
    ['fn2' as FunctionId, 'fn4' as FunctionId, 30, 'd'],
    ['fn3' as FunctionId, 'fn4' as FunctionId, 40, 'm'],
    ['fn5' as FunctionId, 'fn1' as FunctionId, 50, 'c'],
  ];

  graph.build(testEdges);
  return graph;
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default CallGraph;
