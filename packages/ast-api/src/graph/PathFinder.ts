// src/graph/PathFinder.ts

/**
 * Поиск путей в графе вызовов
 *
 * @module graph/PathFinder
 * @description Реализует алгоритмы поиска путей между функциями:
 * - BFS (поиск в ширину)
 * - DFS (поиск в глубину)
 * - Двусторонний BFS (оптимизированный)
 *
 * @example
 * ```typescript
 * import { PathFinder } from './PathFinder.js';
 *
 * const pathFinder = new PathFinder(callGraph, functionMap);
 *
 * // Найти все пути
 * const paths = pathFinder.findAllPaths('fn64', 'fn169');
 *
 * // Найти кратчайший путь
 * const shortest = pathFinder.findShortestPath('fn64', 'fn169');
 *
 * // Получить статистику
 * const stats = pathFinder.getPathStatistics('fn64', 'fn169');
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  PathResult,
  PathStatistics,
  CallType,
} from '../types/index.js';
import type { CallGraph } from './CallGraph.js';
import type { IdNormalizer } from '../core/IdNormalizer.js';

// ==================== ТИПЫ ====================

/**
 * Опции для поиска путей
 */
export interface PathFinderOptions {
  /**
   * Максимальная глубина поиска
   * @default 20
   */
  maxDepth?: number;

  /**
   * Максимальное количество путей
   * @default 1000
   */
  maxPaths?: number;

  /**
   * Алгоритм поиска
   * @default 'bidirectional'
   */
  algorithm?: 'bfs' | 'dfs' | 'bidirectional';

  /**
   * Учитывать типы вызовов
   * @default false
   */
  filterByCallType?: boolean;

  /**
   * Разрешенные типы вызовов
   * @default []
   */
  allowedCallTypes?: CallType[];

  /**
   * Игнорировать циклы
   * @default true
   */
  ignoreCycles?: boolean;

  /**
   * Лимит времени выполнения (мс)
   * @default 5000
   */
  timeout?: number;
}

/**
 * Результат поиска с метаданными
 */
export interface PathResultWithMeta extends PathResult {
  /**
   * ID начальной функции
   */
  fromId: FunctionId;

  /**
   * ID целевой функции
   */
  toId: FunctionId;

  /**
   * Алгоритм, использованный для поиска
   */
  algorithm: string;

  /**
   * Время выполнения (мс)
   */
  executionTime: number;

  /**
   * Количество просмотренных узлов
   */
  visitedNodes: number;

  /**
   * Количество просмотренных ребер
   */
  visitedEdges: number;

  /**
   * Типы вызовов на пути
   */
  callTypes: CallType[];
}

/**
 * Узел в дереве поиска
 */
interface SearchNode {
  id: FunctionId;
  path: FunctionId[];
  depth: number;
  callTypes: CallType[];
}

export class PathFinder {
  private callGraph: CallGraph;
  private functionMap: Map<FunctionId, FunctionEntity>;
  private idNormalizer: IdNormalizer;

  // Раздельные кеши для разных типов данных
  private pathCache = new Map<string, FunctionId[][]>(); // для findAllPaths
  private shortestPathCache = new Map<string, FunctionId[] | null>(); // для findShortestPath
  private reachabilityCache = new Map<string, boolean>(); // для isReachable

  private options: Required<PathFinderOptions>;

  /**
   * Статистика вызовов
   */
  private callStats = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    bfsCalls: 0,
    dfsCalls: 0,
    bidirectionalCalls: 0,
  };

  constructor(
    callGraph: CallGraph,
    functionMap: Map<FunctionId, FunctionEntity>,
    options: PathFinderOptions = {}
  ) {
    this.callGraph = callGraph;
    this.functionMap = functionMap;
    this.idNormalizer = callGraph.idNormalizer;
    this.options = {
      maxDepth: options.maxDepth ?? 20,
      maxPaths: options.maxPaths ?? 1000,
      algorithm: options.algorithm ?? 'bidirectional',
      filterByCallType: options.filterByCallType ?? false,
      allowedCallTypes: options.allowedCallTypes ?? [],
      ignoreCycles: options.ignoreCycles ?? true,
      timeout: options.timeout ?? 5000,
    };
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

  /**
   * Найти все пути (двусторонний BFS)
   */
  findAllPaths(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): FunctionId[][] {
    this.callStats.totalCalls++;
    this.callStats.bidirectionalCalls++;

    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    if (from === to) return [[from]];
    if (!this.functionMap.has(from) || !this.functionMap.has(to)) {
      return [];
    }

    const cacheKey = `allPaths_${from}_${to}_${maxDepth}`;
    if (this.pathCache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.pathCache.get(cacheKey)!;
    }
    this.callStats.cacheMisses++;

    // Проверка таймаута
    const timeout = this.options.timeout;
    const startTime = Date.now();
    let timedOut = false;

    const fromPaths = this.bfsFromStart(from, to, maxDepth, timeout, startTime);
    if (fromPaths.timedOut) {
      console.warn(`⏱️ Поиск путей прерван по таймауту (${timeout}ms)`);
      timedOut = true;
    }

    const toPaths = this.bfsFromEnd(from, to, maxDepth, timeout, startTime);
    if (toPaths.timedOut) {
      console.warn(`⏱️ Поиск путей прерван по таймауту (${timeout}ms)`);
      timedOut = true;
    }

    if (timedOut) {
      return [];
    }

    const paths = this.intersectPaths(fromPaths.paths, toPaths.paths);

    // Ограничиваем количество путей
    const limitedPaths = paths.slice(0, this.options.maxPaths);

    this.pathCache.set(cacheKey, limitedPaths);
    return limitedPaths;
  }

  /**
   * Найти кратчайший путь (BFS)
   */
  findShortestPath(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number
  ): FunctionId[] | null {
    this.callStats.totalCalls++;
    this.callStats.bfsCalls++;

    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    if (from === to) return [from];
    if (!this.functionMap.has(from) || !this.functionMap.has(to)) {
      return null;
    }

    const cacheKey = `shortest_${from}_${to}`;
    if (this.shortestPathCache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.shortestPathCache.get(cacheKey)!;
    }
    this.callStats.cacheMisses++;

    const queue: SearchNode[] = [
      {
        id: from,
        path: [from],
        depth: 0,
        callTypes: [],
      },
    ];
    const visited = new Set<FunctionId>([from]);
    const adjacency = this.callGraph.adjacency;

    const timeout = this.options.timeout;
    const start = Date.now();

    while (queue.length > 0) {
      // Проверка таймаута
      if (Date.now() - start > timeout) {
        console.warn(`⏱️ Поиск кратчайшего пути прерван по таймауту (${timeout}ms)`);
        this.shortestPathCache.set(cacheKey, null);
        return null;
      }

      const node = queue.shift()!;
      const current = node.id;

      const neighbors = adjacency.get(current) || new Set();
      for (const next of neighbors) {
        // Проверка фильтра по типу вызова
        if (this.options.filterByCallType) {
          const callType = this.getCallType(current, next);
          if (callType && !this.options.allowedCallTypes.includes(callType)) {
            continue;
          }
        }

        if (next === to) {
          const path = [...node.path, next];
          this.shortestPathCache.set(cacheKey, path);
          return path;
        }

        if (!visited.has(next)) {
          visited.add(next);
          queue.push({
            id: next,
            path: [...node.path, next],
            depth: node.depth + 1,
            callTypes: [...node.callTypes],
          });
        }
      }
    }

    this.shortestPathCache.set(cacheKey, null);
    return null;
  }

  /**
   * Найти все пути (DFS)
   */
  findAllPathsDFS(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): FunctionId[][] {
    this.callStats.totalCalls++;
    this.callStats.dfsCalls++;

    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    if (from === to) return [[from]];
    if (!this.functionMap.has(from) || !this.functionMap.has(to)) {
      return [];
    }

    const cacheKey = `dfs_${from}_${to}_${maxDepth}`;
    if (this.pathCache.has(cacheKey)) {
      this.callStats.cacheHits++;
      return this.pathCache.get(cacheKey)!;
    }
    this.callStats.cacheMisses++;

    const paths: FunctionId[][] = [];
    const visited = new Set<FunctionId>();
    const adjacency = this.callGraph.adjacency;
    const timeout = this.options.timeout;
    const start = Date.now();

    this.dfsRecursive(from, to, [from], visited, paths, maxDepth, adjacency, timeout, start);

    paths.sort((a, b) => a.length - b.length);

    // Ограничиваем количество путей
    const limitedPaths = paths.slice(0, this.options.maxPaths);

    this.pathCache.set(cacheKey, limitedPaths);
    return limitedPaths;
  }

  // ==================== ПРИВАТНЫЕ МЕТОДЫ BFS ====================

  private bfsFromStart(
    startId: FunctionId,
    targetId: FunctionId,
    maxDepth: number,
    timeout: number,
    startTime: number
  ): { paths: FunctionId[][]; timedOut: boolean; visitedNodes: number; visitedEdges: number } {
    const results: FunctionId[][] = [];
    const queue: SearchNode[] = [
      {
        id: startId,
        path: [startId],
        depth: 0,
        callTypes: [],
      },
    ];
    const visited = new Set<FunctionId>([startId]);
    const depthMap = new Map<FunctionId, number>([[startId, 0]]);
    const adjacency = this.callGraph.adjacency;
    let visitedEdges = 0;

    while (queue.length > 0) {
      // Проверка таймаута
      if (Date.now() - startTime > timeout) {
        return { paths: results, timedOut: true, visitedNodes: visited.size, visitedEdges };
      }

      const node = queue.shift()!;
      const current = node.id;
      const currentDepth = depthMap.get(current) || 0;

      if (current === targetId) {
        results.push(node.path);
        continue;
      }

      if (currentDepth >= maxDepth) continue;

      const neighbors = adjacency.get(current) || new Set();
      for (const next of neighbors) {
        visitedEdges++;

        // Проверка фильтра по типу вызова
        if (this.options.filterByCallType) {
          const callType = this.getCallType(current, next);
          if (callType && !this.options.allowedCallTypes.includes(callType)) {
            continue;
          }
        }

        if (!visited.has(next) || next === targetId) {
          const newPath = [...node.path, next];
          const newDepth = currentDepth + 1;

          if (!visited.has(next) || next === targetId) {
            visited.add(next);
            depthMap.set(next, newDepth);
            queue.push({
              id: next,
              path: newPath,
              depth: newDepth,
              callTypes: [...node.callTypes],
            });
          }
        }
      }
    }

    return { paths: results, timedOut: false, visitedNodes: visited.size, visitedEdges };
  }

  private bfsFromEnd(
    startId: FunctionId,
    targetId: FunctionId,
    maxDepth: number,
    timeout: number,
    startTime: number
  ): { paths: FunctionId[][]; timedOut: boolean; visitedNodes: number; visitedEdges: number } {
    const results: FunctionId[][] = [];
    const queue: SearchNode[] = [
      {
        id: targetId,
        path: [targetId],
        depth: 0,
        callTypes: [],
      },
    ];
    const visited = new Set<FunctionId>([targetId]);
    const depthMap = new Map<FunctionId, number>([[targetId, 0]]);
    const reverseAdjacency = this.callGraph.reverseAdjacency;
    let visitedEdges = 0;

    while (queue.length > 0) {
      // Проверка таймаута
      if (Date.now() - startTime > timeout) {
        return { paths: results, timedOut: true, visitedNodes: visited.size, visitedEdges };
      }

      const node = queue.shift()!;
      const current = node.id;
      const currentDepth = depthMap.get(current) || 0;

      if (current === startId) {
        results.push(node.path.reverse());
        continue;
      }

      if (currentDepth >= maxDepth) continue;

      const neighbors = reverseAdjacency.get(current) || new Set();
      for (const prev of neighbors) {
        visitedEdges++;

        // Проверка фильтра по типу вызова
        if (this.options.filterByCallType) {
          const callType = this.getCallType(prev, current);
          if (callType && !this.options.allowedCallTypes.includes(callType)) {
            continue;
          }
        }

        if (!visited.has(prev) || prev === startId) {
          const newPath = [...node.path, prev];
          const newDepth = currentDepth + 1;

          if (!visited.has(prev) || prev === startId) {
            visited.add(prev);
            depthMap.set(prev, newDepth);
            queue.push({
              id: prev,
              path: newPath,
              depth: newDepth,
              callTypes: [...node.callTypes],
            });
          }
        }
      }
    }

    return { paths: results, timedOut: false, visitedNodes: visited.size, visitedEdges };
  }

  // ==================== ПРИВАТНЫЕ МЕТОДЫ DFS ====================

  private dfsRecursive(
    current: FunctionId,
    target: FunctionId,
    path: FunctionId[],
    visited: Set<FunctionId>,
    paths: FunctionId[][],
    maxDepth: number,
    adjacency: Map<FunctionId, Set<FunctionId>>,
    timeout: number,
    startTime: number
  ): void {
    // Проверка таймаута
    if (Date.now() - startTime > timeout) {
      return;
    }

    if (path.length > maxDepth) return;
    if (paths.length >= this.options.maxPaths) return;

    if (current === target) {
      paths.push([...path]);
      return;
    }

    const neighbors = adjacency.get(current) || new Set();
    for (const next of neighbors) {
      // Проверка фильтра по типу вызова
      if (this.options.filterByCallType) {
        const callType = this.getCallType(current, next);
        if (callType && !this.options.allowedCallTypes.includes(callType)) {
          continue;
        }
      }

      if (!visited.has(next) || (this.options.ignoreCycles && next === target)) {
        visited.add(next);
        path.push(next);
        this.dfsRecursive(
          next,
          target,
          path,
          visited,
          paths,
          maxDepth,
          adjacency,
          timeout,
          startTime
        );
        path.pop();
        if (!this.options.ignoreCycles || next !== target) {
          visited.delete(next);
        }
      }
    }
  }

  // ==================== ПЕРЕСЕЧЕНИЕ ПУТЕЙ ====================

  private intersectPaths(fromPaths: FunctionId[][], toPaths: FunctionId[][]): FunctionId[][] {
    if (fromPaths.length === 0 || toPaths.length === 0) return [];

    const fromPathSets = fromPaths.map(path => new Set(path));
    const toPathSets = toPaths.map(path => new Set(path));
    const results: FunctionId[][] = [];

    for (let i = 0; i < fromPaths.length; i++) {
      for (let j = 0; j < toPaths.length; j++) {
        const fromPath = fromPaths[i];
        const toPath = toPaths[j];

        // Проверяем существование путей
        if (!fromPath || !toPath) continue;

        const fromSet = fromPathSets[i];
        const toSet = toPathSets[j];

        // Проверяем существование множеств
        if (!fromSet || !toSet) continue;

        const intersection = new Set<FunctionId>();
        for (const node of fromSet) {
          if (toSet.has(node)) {
            intersection.add(node);
          }
        }

        if (intersection.size > 0) {
          const firstIntersection = fromPath.find(node => intersection.has(node));
          if (firstIntersection !== undefined) {
            const idxFrom = fromPath.indexOf(firstIntersection);
            const idxTo = toPath.indexOf(firstIntersection);

            const fullPath = [...fromPath.slice(0, idxFrom + 1), ...toPath.slice(idxTo + 1)];

            const uniquePath: FunctionId[] = [];
            const seen = new Set<FunctionId>();
            for (const node of fullPath) {
              if (!seen.has(node)) {
                seen.add(node);
                uniquePath.push(node);
              }
            }

            results.push(uniquePath);
          }
        }
      }
    }

    // Убираем дубликаты путей
    const uniqueResults: FunctionId[][] = [];
    const seenPaths = new Set<string>();
    for (const path of results) {
      const key = path.join('|');
      if (!seenPaths.has(key)) {
        seenPaths.add(key);
        uniqueResults.push(path);
      }
    }

    uniqueResults.sort((a, b) => a.length - b.length);
    return uniqueResults;
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Получить тип вызова между функциями
   */
  private getCallType(from: FunctionId, to: FunctionId): CallType | null {
    const calls = this.callGraph.getCalls(from);
    const call = calls.find(c => c.to === to);
    return call?.type || null;
  }

  /**
   * Получить пути с именами функций
   */
  getPathsWithNames(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): PathResult[] {
    const paths = this.findAllPaths(fromId, toId, maxDepth);
    return paths.map(path => ({
      path: path,
      nodes: path
        .map(id => this.functionMap.get(id))
        .filter((fn): fn is FunctionEntity => fn !== undefined),
      names: path.map(id => this.functionMap.get(id)?.name || id),
      length: path.length,
    }));
  }

  /**
   * Получить пути с метаданными
   */
  getPathsWithMeta(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): PathResultWithMeta[] {
    const startTime = Date.now();
    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    const paths = this.findAllPaths(fromId, toId, maxDepth);
    const algorithm = this.options.algorithm;

    const result: PathResultWithMeta[] = paths.map(path => {
      const callTypes: CallType[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        if (current && next) {
          const type = this.getCallType(current, next);
          if (type) callTypes.push(type);
        }
      }

      return {
        path: path,
        nodes: path
          .map(id => this.functionMap.get(id))
          .filter((fn): fn is FunctionEntity => fn !== undefined),
        names: path.map(id => this.functionMap.get(id)?.name || id),
        length: path.length,
        fromId: from,
        toId: to,
        algorithm,
        executionTime: Date.now() - startTime,
        visitedNodes: this.estimateVisitedNodes(path, maxDepth),
        visitedEdges: this.estimateVisitedEdges(path),
        callTypes,
      };
    });

    return result;
  }

  /**
   * Оценить количество просмотренных узлов
   */
  private estimateVisitedNodes(path: FunctionId[], maxDepth: number): number {
    // Приблизительная оценка на основе длины пути и глубины
    const pathLength = path.length;
    const branchFactor = 3; // среднее количество ребер на узел
    return Math.min(Math.pow(branchFactor, Math.min(pathLength, maxDepth)), 1000);
  }

  /**
   * Оценить количество просмотренных ребер
   */
  private estimateVisitedEdges(path: FunctionId[]): number {
    // Приблизительная оценка на основе длины пути
    const nodes = this.estimateVisitedNodes(path, this.options.maxDepth);
    const branchFactor = 3;
    return nodes * branchFactor;
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику путей
   */
  getPathStatistics(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): PathStatistics {
    const paths = this.findAllPaths(fromId, toId, maxDepth);

    if (paths.length === 0) {
      return {
        reachable: false,
        totalPaths: 0,
        shortest: null,
        longest: null,
        averageLength: 0,
      };
    }

    const lengths = paths.map(p => p.length);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    return {
      reachable: true,
      totalPaths: paths.length,
      shortest,
      longest,
      averageLength: average,
      shortestPath: paths.find(p => p.length === shortest),
      longestPath: paths.find(p => p.length === longest),
    };
  }

  /**
   * Проверить достижимость
   */
  isReachable(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): boolean {
    const cacheKey = `reachable_${fromId}_${toId}_${maxDepth}`;
    if (this.reachabilityCache.has(cacheKey)) {
      return this.reachabilityCache.get(cacheKey)!;
    }

    const paths = this.findShortestPath(fromId, toId);
    const result = paths !== null && paths.length <= maxDepth + 1;

    this.reachabilityCache.set(cacheKey, result);
    return result;
  }

  /**
   * Получить все достижимые функции
   */
  getReachableFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): FunctionEntity[] {
    const from = this.idNormalizer.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[from, 0]];
    const adjacency = this.callGraph.adjacency;

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = adjacency.get(current) || new Set();
      for (const next of neighbors) {
        if (!result.has(next) && next !== from) {
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
   * Получить все функции, которые достигают целевую
   */
  getReachingFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): FunctionEntity[] {
    const to = this.idNormalizer.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[to, 0]];
    const reverseAdjacency = this.callGraph.reverseAdjacency;

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = reverseAdjacency.get(current) || new Set();
      for (const prev of neighbors) {
        if (!result.has(prev) && prev !== to) {
          result.add(prev);
          queue.push([prev, depth + 1]);
        }
      }
    }

    return Array.from(result)
      .map(id => this.functionMap.get(id))
      .filter((fn): fn is FunctionEntity => fn !== undefined);
  }

  // ==================== АНАЛИЗ ПУТЕЙ ====================

  /**
   * Найти все пути с фильтрацией по типу вызова
   */
  findPathsByCallType(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    callType: CallType,
    maxDepth: number = this.options.maxDepth
  ): FunctionId[][] {
    const oldFilter = this.options.filterByCallType;
    const oldTypes = this.options.allowedCallTypes;

    this.options.filterByCallType = true;
    this.options.allowedCallTypes = [callType];

    const paths = this.findAllPaths(fromId, toId, maxDepth);

    this.options.filterByCallType = oldFilter;
    this.options.allowedCallTypes = oldTypes;

    return paths;
  }

  /**
   * Найти путь с максимальным количеством вызовов определенного типа
   */
  findPathWithMaxCallType(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    callType: CallType,
    maxDepth: number = this.options.maxDepth
  ): FunctionId[] | null {
    const paths = this.findAllPaths(fromId, toId, maxDepth);
    if (paths.length === 0) return null;

    let maxCount = -1;
    let bestPath: FunctionId[] | null = null;

    for (const path of paths) {
      let count = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        if (current && next) {
          const type = this.getCallType(current, next);
          if (type === callType) count++;
        }
      }
      if (count > maxCount) {
        maxCount = count;
        bestPath = path;
      }
    }

    return bestPath;
  }

  /**
   * Найти общие пути между двумя парами функций
   */
  findCommonPaths(
    from1: FunctionId | string | number,
    to1: FunctionId | string | number,
    from2: FunctionId | string | number,
    to2: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): FunctionId[][] {
    const paths1 = this.findAllPaths(from1, to1, maxDepth);
    const paths2 = this.findAllPaths(from2, to2, maxDepth);

    const set2 = new Set(paths2.map(p => p.join('|')));
    const common: FunctionId[][] = [];

    for (const path of paths1) {
      const key = path.join('|');
      if (set2.has(key)) {
        common.push(path);
      }
    }

    return common;
  }

  // ==================== УПРАВЛЕНИЕ КЕШЕМ ====================

  /**
   * Очистить кеш
   */
  clearCache(): void {
    this.pathCache.clear();
    this.shortestPathCache.clear();
    this.reachabilityCache.clear();
  }

  /**
   * Получить размер кеша
   */
  getCacheSize(): number {
    return this.pathCache.size + this.shortestPathCache.size + this.reachabilityCache.size;
  }

  /**
   * Получить размер кеша по типам
   */
  getCacheStats(): {
    paths: number;
    shortestPaths: number;
    reachability: number;
    total: number;
  } {
    return {
      paths: this.pathCache.size,
      shortestPaths: this.shortestPathCache.size,
      reachability: this.reachabilityCache.size,
      total: this.pathCache.size + this.shortestPathCache.size + this.reachabilityCache.size,
    };
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
      bfsCalls: 0,
      dfsCalls: 0,
      bidirectionalCalls: 0,
    };
  }

  // ==================== ОПЦИИ ====================

  /**
   * Установить опции
   */
  setOptions(options: Partial<PathFinderOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    return this;
  }

  /**
   * Получить опции
   */
  getOptions(): PathFinderOptions {
    return { ...this.options };
  }

  // ==================== ВАЛИДАЦИЯ ====================

  /**
   * Проверить, существует ли путь
   */
  hasPath(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): boolean {
    const paths = this.findAllPaths(fromId, toId, maxDepth);
    return paths.length > 0;
  }

  /**
   * Получить количество путей
   */
  countPaths(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = this.options.maxDepth
  ): number {
    const paths = this.findAllPaths(fromId, toId, maxDepth);
    return paths.length;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать PathFinder с настройками по умолчанию
 */
export function createDefaultPathFinder(
  callGraph: CallGraph,
  functionMap: Map<FunctionId, FunctionEntity>
): PathFinder {
  return new PathFinder(callGraph, functionMap, {
    maxDepth: 20,
    maxPaths: 1000,
    algorithm: 'bidirectional',
    filterByCallType: false,
    allowedCallTypes: [],
    ignoreCycles: true,
    timeout: 5000,
  });
}

/**
 * Создать PathFinder для быстрого поиска
 */
export function createFastPathFinder(
  callGraph: CallGraph,
  functionMap: Map<FunctionId, FunctionEntity>
): PathFinder {
  return new PathFinder(callGraph, functionMap, {
    maxDepth: 10,
    maxPaths: 100,
    algorithm: 'bidirectional',
    filterByCallType: false,
    allowedCallTypes: [],
    ignoreCycles: true,
    timeout: 1000,
  });
}

/**
 * Создать PathFinder для полного анализа
 */
export function createFullPathFinder(
  callGraph: CallGraph,
  functionMap: Map<FunctionId, FunctionEntity>
): PathFinder {
  return new PathFinder(callGraph, functionMap, {
    maxDepth: 50,
    maxPaths: 10000,
    algorithm: 'dfs',
    filterByCallType: false,
    allowedCallTypes: [],
    ignoreCycles: false,
    timeout: 30000,
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для PathFinder
 */
export interface TestPathData {
  fromId: FunctionId;
  toId: FunctionId;
  expectedPaths: FunctionId[][];
  expectedShortest: FunctionId[];
}

/**
 * Создать тестовые данные
 */
export function createTestPathData(
  from: FunctionId,
  to: FunctionId,
  paths: FunctionId[][]
): TestPathData {
  const shortest = paths.reduce((a, b) => (a.length <= b.length ? a : b));
  return {
    fromId: from,
    toId: to,
    expectedPaths: paths,
    expectedShortest: shortest,
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default PathFinder;
