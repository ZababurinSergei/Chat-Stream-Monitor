// src/entities/ModuleManager.ts

/**
 * Менеджер модулей
 *
 * @module entities/ModuleManager
 * @description Управляет модулями, их функциями, файлами и связями
 *
 * @example
 * ```typescript
 * import { ModuleManager } from './ModuleManager.js';
 *
 * const manager = new ModuleManager(moduleMap);
 *
 * // Получить все модули
 * const modules = manager.getAll();
 *
 * // Получить модуль по ID
 * const module = manager.get('m1');
 *
 * // Получить модуль функции
 * const mod = manager.getModuleOfFunction('fn64');
 * ```
 */

import type {
  ModuleId,
  FunctionId,
  FileId,
  ModuleEntity,
  FunctionEntity,
  CallEdgeWithMeta,
  ImportEdgeWithMeta,
} from '../types/index.js';

// ==================== ТИПЫ ====================

/**
 * Опции для модуля
 */
export interface ModuleOptions {
  /**
   * Включить детальную статистику
   * @default true
   */
  includeDetailedStats?: boolean;

  /**
   * Включить анализ зависимостей
   * @default true
   */
  includeDependencyAnalysis?: boolean;

  /**
   * Включить анализ связности
   * @default true
   */
  includeCohesionAnalysis?: boolean;
}

/**
 * Статистика модуля
 */
export interface ModuleStats {
  /**
   * ID модуля
   */
  moduleId: ModuleId;

  /**
   * Имя модуля
   */
  name: string;

  /**
   * Количество функций
   */
  functionCount: number;

  /**
   * Количество файлов
   */
  fileCount: number;

  /**
   * Количество вызовов внутри модуля
   */
  internalCalls: number;

  /**
   * Количество вызовов из других модулей
   */
  externalCallsIn: number;

  /**
   * Количество вызовов в другие модули
   */
  externalCallsOut: number;

  /**
   * Количество импортов
   */
  imports: number;

  /**
   * Количество экспортов
   */
  exports: number;

  /**
   * Процент внутренних вызовов
   */
  internalCallRatio: number;

  /**
   * Связность модуля (0-1)
   */
  cohesion: number;

  /**
   * Зависимости модуля
   */
  dependencies: ModuleId[];

  /**
   * Зависимые модули
   */
  dependents: ModuleId[];

  /**
   * Циклические зависимости
   */
  cycles: ModuleId[][];
}

/**
 * Анализ модуля
 */
export interface ModuleAnalysis {
  /**
   * Модуль
   */
  module: ModuleEntity;

  /**
   * Статистика
   */
  stats: ModuleStats;

  /**
   * Функции с наибольшим количеством вызовов
   */
  topCalledFunctions: {
    id: FunctionId;
    name: string;
    calls: number;
  }[];

  /**
   * Функции, которые больше всего вызывают
   */
  topCallingFunctions: {
    id: FunctionId;
    name: string;
    calls: number;
  }[];

  /**
   * Самые большие файлы
   */
  largestFiles: {
    id: FileId;
    path: string;
    functions: number;
  }[];

  /**
   * Рекомендации по улучшению
   */
  recommendations: string[];
}

/**
 * Сравнение модулей
 */
export interface ModuleComparison {
  /**
   * ID первого модуля
   */
  moduleId1: ModuleId;

  /**
   * ID второго модуля
   */
  moduleId2: ModuleId;

  /**
   * Общие функции
   */
  commonFunctions: FunctionId[];

  /**
   * Общие файлы
   */
  commonFiles: FileId[];

  /**
   * Разница в количестве функций
   */
  functionDiff: number;

  /**
   * Разница в количестве файлов
   */
  fileDiff: number;

  /**
   * Сходство модулей (0-1)
   */
  similarity: number;
}

/**
 * Граф модулей
 */
export interface ModuleGraph {
  /**
   * Узлы (модули)
   */
  nodes: ModuleId[];

  /**
   * Ребра (зависимости)
   */
  edges: {
    from: ModuleId;
    to: ModuleId;
    count: number;
  }[];

  /**
   * Связные компоненты
   */
  components: ModuleId[][];
}

export class ModuleManager {
  private moduleMap: Map<ModuleId, ModuleEntity>;
  private functionToModule = new Map<FunctionId, ModuleId>();
  private fileToModule = new Map<FileId, ModuleId>();
  private filePathMap = new Map<FileId, string>();
  private cache = new Map<string, unknown>();
  private options: Required<ModuleOptions>;

  constructor(moduleMap: Map<ModuleId, ModuleEntity>, options: ModuleOptions = {}) {
    this.moduleMap = moduleMap;
    this.options = {
      includeDetailedStats: options.includeDetailedStats ?? true,
      includeDependencyAnalysis: options.includeDependencyAnalysis ?? true,
      includeCohesionAnalysis: options.includeCohesionAnalysis ?? true,
    };
    this.buildIndexes();
  }

  // ==================== ИНДЕКСЫ ====================

  /**
   * Построить индексы для быстрого поиска
   */
  private buildIndexes(): void {
    this.functionToModule.clear();
    this.fileToModule.clear();
    this.filePathMap.clear();

    for (const [moduleId, module] of this.moduleMap) {
      for (const fnId of module.functions) {
        this.functionToModule.set(fnId, moduleId);
      }
      for (const fileId of module.files) {
        this.fileToModule.set(fileId, moduleId);
        // Сохраняем путь файла из модуля (если есть)
        // В реальном проекте путь должен браться из FileManager
        // Здесь используем заглушку
        if (!this.filePathMap.has(fileId)) {
          this.filePathMap.set(fileId, `src/${module.name}/${fileId}.ts`);
        }
      }
    }
  }

  /**
   * Обновить карту путей файлов (должен вызываться из FileManager)
   */
  updateFilePathMap(filePathMap: Map<FileId, string>): void {
    this.filePathMap = new Map(filePathMap);
  }

  // ==================== БАЗОВЫЕ ОПЕРАЦИИ ====================

  /**
   * Получить модуль по ID
   */
  get(id: ModuleId): ModuleEntity | null {
    return this.moduleMap.get(id) || null;
  }

  /**
   * Получить все модули
   */
  getAll(): ModuleEntity[] {
    return Array.from(this.moduleMap.values());
  }

  /**
   * Получить модули по имени (частичное совпадение)
   */
  getByName(name: string): ModuleEntity[] {
    const results: ModuleEntity[] = [];
    const query = name.toLowerCase();

    for (const module of this.moduleMap.values()) {
      if (module.name.toLowerCase().includes(query)) {
        results.push(module);
      }
    }

    return results;
  }

  /**
   * Получить модуль по точному имени
   */
  getByExactName(name: string): ModuleEntity | null {
    for (const module of this.moduleMap.values()) {
      if (module.name === name) {
        return module;
      }
    }
    return null;
  }

  /**
   * Получить модуль по ID функции
   */
  getModuleOfFunction(functionId: FunctionId | string | number): ModuleEntity | null {
    const normalized = this.normalizeFunctionId(functionId);
    const moduleId = this.functionToModule.get(normalized);
    return moduleId ? this.get(moduleId) : null;
  }

  /**
   * Получить модуль по ID файла
   */
  getModuleOfFile(fileId: FileId): ModuleEntity | null {
    const moduleId = this.fileToModule.get(fileId);
    return moduleId ? this.get(moduleId) : null;
  }

  /**
   * Получить функции модуля
   */
  getFunctions(moduleId: ModuleId): FunctionId[] {
    const module = this.get(moduleId);
    return module ? [...module.functions] : [];
  }

  /**
   * Получить файлы модуля
   */
  getFiles(moduleId: ModuleId): FileId[] {
    const module = this.get(moduleId);
    return module ? [...module.files] : [];
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику модуля
   */
  getModuleStats(
    moduleId: ModuleId,
    callsMap?: Map<FunctionId, CallEdgeWithMeta[]>,
    importsMap?: Map<FunctionId, ImportEdgeWithMeta[]>
  ): ModuleStats {
    const module = this.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const functionIds = module.functions;
    const fileIds = module.files;

    // Считаем внутренние и внешние вызовы
    let internalCalls = 0;
    let externalCallsIn = 0;
    let externalCallsOut = 0;
    const dependencies = new Set<ModuleId>();
    const dependents = new Set<ModuleId>();

    if (callsMap && this.options.includeDependencyAnalysis) {
      for (const fnId of functionIds) {
        const calls = callsMap.get(fnId) || [];
        for (const call of calls) {
          const targetModule = this.getModuleOfFunction(call.to);
          if (targetModule) {
            if (targetModule.id === moduleId) {
              internalCalls++;
            } else {
              externalCallsOut++;
              dependencies.add(targetModule.id);
            }
          }
        }
      }

      // Считаем внешние вызовы в модуль
      for (const [callerId, calls] of callsMap) {
        const callerModule = this.getModuleOfFunction(callerId);
        if (!callerModule || callerModule.id === moduleId) continue;

        for (const call of calls) {
          if (functionIds.includes(call.to)) {
            externalCallsIn++;
            dependents.add(callerModule.id);
          }
        }
      }
    }

    // Считаем импорты и экспорты
    let imports = 0;
    const exports = 0;
    if (importsMap && this.options.includeDependencyAnalysis) {
      for (const fnId of functionIds) {
        const imps = importsMap.get(fnId) || [];
        imports += imps.length;
      }
    }

    // Связность модуля (cohesion)
    let cohesion = 0;
    if (this.options.includeCohesionAnalysis) {
      const totalCalls = internalCalls + externalCallsOut;
      cohesion = totalCalls > 0 ? internalCalls / totalCalls : 1;
    }

    // Обнаружение циклов
    const cycles = this.findCyclesForModule(moduleId, dependencies);

    const internalCallRatio =
      internalCalls + externalCallsOut > 0 ? internalCalls / (internalCalls + externalCallsOut) : 1;

    return {
      moduleId,
      name: module.name,
      functionCount: functionIds.length,
      fileCount: fileIds.length,
      internalCalls,
      externalCallsIn,
      externalCallsOut,
      imports,
      exports,
      internalCallRatio,
      cohesion,
      dependencies: Array.from(dependencies),
      dependents: Array.from(dependents),
      cycles,
    };
  }

  /**
   * Найти циклы для модуля
   */
  private findCyclesForModule(moduleId: ModuleId, dependencies: Set<ModuleId>): ModuleId[][] {
    const cycles: ModuleId[][] = [];
    const visited = new Set<ModuleId>();
    const stack: ModuleId[] = [];

    const dfs = (current: ModuleId, path: ModuleId[]) => {
      if (stack.includes(current)) {
        const cycleStart = stack.indexOf(current);
        const cycle = stack.slice(cycleStart);
        cycles.push([...cycle, current]);
        return;
      }

      if (visited.has(current)) return;

      visited.add(current);
      stack.push(current);
      path.push(current);

      // Проверяем зависимости
      for (const dep of dependencies) {
        const depModule = this.get(dep);
        if (depModule) {
          // Проверяем, есть ли обратная зависимость
          const depFunctions = depModule.functions;
          for (const fnId of depFunctions) {
            const fnModule = this.getModuleOfFunction(fnId);
            if (fnModule && fnModule.id === moduleId) {
              dfs(dep, path);
            }
          }
        }
      }

      stack.pop();
      path.pop();
    };

    dfs(moduleId, []);
    return cycles;
  }

  /**
   * Получить статистику всех модулей
   */
  getAllModuleStats(
    callsMap?: Map<FunctionId, CallEdgeWithMeta[]>,
    importsMap?: Map<FunctionId, ImportEdgeWithMeta[]>
  ): Record<ModuleId, ModuleStats> {
    const result: Record<ModuleId, ModuleStats> = {};
    for (const moduleId of this.moduleMap.keys()) {
      result[moduleId] = this.getModuleStats(moduleId, callsMap, importsMap);
    }
    return result;
  }

  // ==================== АНАЛИЗ ====================

  /**
   * Полный анализ модуля
   */
  analyzeModule(
    moduleId: ModuleId,
    functionMap: Map<FunctionId, FunctionEntity>,
    callsMap?: Map<FunctionId, CallEdgeWithMeta[]>,
    importsMap?: Map<FunctionId, ImportEdgeWithMeta[]>
  ): ModuleAnalysis | null {
    const module = this.get(moduleId);
    if (!module) return null;

    const stats = this.getModuleStats(moduleId, callsMap, importsMap);
    const functionIds = module.functions;

    // Топ вызываемых функций
    const callCount = new Map<FunctionId, number>();
    if (callsMap) {
      for (const fnId of functionIds) {
        const calls = callsMap.get(fnId) || [];
        for (const call of calls) {
          callCount.set(call.to, (callCount.get(call.to) || 0) + 1);
        }
      }
    }

    const topCalledFunctions = Array.from(callCount.entries())
      .map(([id, calls]) => ({
        id,
        name: functionMap.get(id)?.name || id,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    // Топ вызывающих функций
    const callOutCount = new Map<FunctionId, number>();
    if (callsMap) {
      for (const fnId of functionIds) {
        const calls = callsMap.get(fnId) || [];
        callOutCount.set(fnId, calls.length);
      }
    }

    const topCallingFunctions = Array.from(callOutCount.entries())
      .map(([id, calls]) => ({
        id,
        name: functionMap.get(id)?.name || id,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    // Самые большие файлы
    const fileFunctionCount = new Map<FileId, number>();
    for (const fnId of functionIds) {
      const fn = functionMap.get(fnId);
      if (fn) {
        fileFunctionCount.set(fn.fileId, (fileFunctionCount.get(fn.fileId) || 0) + 1);
      }
    }

    const largestFiles = Array.from(fileFunctionCount.entries())
      .map(([id, count]) => ({
        id,
        path: this.getFilePath(id) || id,
        functions: count,
      }))
      .sort((a, b) => b.functions - a.functions)
      .slice(0, 10);

    // Рекомендации
    const recommendations: string[] = [];

    if (stats.internalCallRatio < 0.5) {
      recommendations.push(
        `Низкая связность модуля (${(stats.internalCallRatio * 100).toFixed(1)}%). ` +
          'Рассмотрите возможность рефакторинга для уменьшения внешних зависимостей.'
      );
    }

    if (stats.functionCount > 50) {
      recommendations.push(
        `Модуль содержит ${stats.functionCount} функций. ` +
          'Рассмотрите возможность разделения на подмодули.'
      );
    }

    if (stats.dependencies.length > 10) {
      recommendations.push(
        `Модуль зависит от ${stats.dependencies.length} других модулей. ` +
          'Рассмотрите возможность уменьшения количества зависимостей.'
      );
    }

    if (stats.cycles.length > 0) {
      recommendations.push(
        `Обнаружены циклические зависимости: ${stats.cycles.length} циклов. ` +
          'Разбейте циклические зависимости для улучшения архитектуры.'
      );
    }

    if (stats.cohesion < 0.3) {
      recommendations.push(
        `Очень низкая связность (${(stats.cohesion * 100).toFixed(1)}%). ` +
          'Функции модуля слабо связаны между собой.'
      );
    }

    return {
      module,
      stats,
      topCalledFunctions,
      topCallingFunctions,
      largestFiles,
      recommendations,
    };
  }

  /**
   * Получить путь файла по ID
   */
  private getFilePath(fileId: FileId): string | null {
    // Сначала проверяем в кеше
    if (this.filePathMap.has(fileId)) {
      return this.filePathMap.get(fileId) || null;
    }

    // Если нет в кеше, ищем в модулях
    for (const module of this.moduleMap.values()) {
      if (module.files.includes(fileId)) {
        // Формируем путь на основе имени модуля
        const path = `src/${module.name}/${fileId}.ts`;
        this.filePathMap.set(fileId, path);
        return path;
      }
    }

    // Если файл не найден, возвращаем null
    return null;
  }

  /**
   * Получить все пути файлов
   */
  getAllFilePaths(): Map<FileId, string> {
    return new Map(this.filePathMap);
  }

  // ==================== СРАВНЕНИЕ ====================

  /**
   * Сравнить два модуля
   */
  compareModules(moduleId1: ModuleId, moduleId2: ModuleId): ModuleComparison | null {
    const module1 = this.get(moduleId1);
    const module2 = this.get(moduleId2);
    if (!module1 || !module2) return null;

    const commonFunctions = module1.functions.filter(id => module2.functions.includes(id));

    const commonFiles = module1.files.filter(id => module2.files.includes(id));

    const functionDiff = Math.abs(module1.functions.length - module2.functions.length);
    const fileDiff = Math.abs(module1.files.length - module2.files.length);

    // Сходство на основе Jaccard
    const unionSize = new Set([...module1.functions, ...module2.functions]).size;
    const similarity = unionSize > 0 ? commonFunctions.length / unionSize : 0;

    return {
      moduleId1,
      moduleId2,
      commonFunctions,
      commonFiles,
      functionDiff,
      fileDiff,
      similarity,
    };
  }

  /**
   * Найти наиболее похожие модули
   */
  findSimilarModules(
    moduleId: ModuleId,
    limit: number = 5
  ): {
    moduleId: ModuleId;
    name: string;
    similarity: number;
  }[] {
    const results: {
      moduleId: ModuleId;
      name: string;
      similarity: number;
    }[] = [];
    const target = this.get(moduleId);
    if (!target) return results;

    for (const [id, module] of this.moduleMap) {
      if (id === moduleId) continue;

      const comparison = this.compareModules(moduleId, id);
      if (comparison) {
        results.push({
          moduleId: id,
          name: module.name,
          similarity: comparison.similarity,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  // ==================== ГРАФ МОДУЛЕЙ ====================

  /**
   * Построить граф модулей
   */
  buildModuleGraph(callsMap?: Map<FunctionId, CallEdgeWithMeta[]>): ModuleGraph {
    const nodes = Array.from(this.moduleMap.keys());
    const edges: { from: ModuleId; to: ModuleId; count: number }[] = [];
    const edgeMap = new Map<string, number>();

    if (callsMap && this.options.includeDependencyAnalysis) {
      for (const [fromFn, calls] of callsMap) {
        const fromModule = this.getModuleOfFunction(fromFn);
        if (!fromModule) continue;

        for (const call of calls) {
          const toModule = this.getModuleOfFunction(call.to);
          if (!toModule || toModule.id === fromModule.id) continue;

          const key = `${fromModule.id}|${toModule.id}`;
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        }
      }

      for (const [key, count] of edgeMap) {
        const [from, to] = key.split('|') as [ModuleId, ModuleId];
        edges.push({ from, to, count });
      }
    }

    // Находим связные компоненты
    const components = this.findConnectedComponents(nodes, edges);

    return {
      nodes,
      edges,
      components,
    };
  }

  /**
   * Найти связные компоненты
   */
  private findConnectedComponents(
    nodes: ModuleId[],
    edges: { from: ModuleId; to: ModuleId; count: number }[]
  ): ModuleId[][] {
    const adjacency = new Map<ModuleId, Set<ModuleId>>();

    for (const node of nodes) {
      adjacency.set(node, new Set());
    }

    for (const edge of edges) {
      adjacency.get(edge.from)?.add(edge.to);
      adjacency.get(edge.to)?.add(edge.from);
    }

    const visited = new Set<ModuleId>();
    const components: ModuleId[][] = [];

    for (const node of nodes) {
      if (visited.has(node)) continue;

      const component: ModuleId[] = [];
      const queue = [node];
      visited.add(node);

      while (queue.length > 0) {
        const current = queue.shift()!;
        component.push(current);

        for (const neighbor of adjacency.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      if (component.length > 0) {
        components.push(component);
      }
    }

    return components;
  }

  // ==================== ПОИСК ====================

  /**
   * Найти модули по префиксу
   */
  searchByPrefix(prefix: string): ModuleEntity[] {
    const results: ModuleEntity[] = [];
    const lowerPrefix = prefix.toLowerCase();

    for (const module of this.moduleMap.values()) {
      if (
        module.id.toLowerCase().startsWith(lowerPrefix) ||
        module.name.toLowerCase().startsWith(lowerPrefix)
      ) {
        results.push(module);
      }
    }

    return results;
  }

  /**
   * Найти модули с наибольшим количеством функций
   */
  getLargestModules(limit: number = 10): ModuleEntity[] {
    return Array.from(this.moduleMap.values())
      .sort((a, b) => b.functions.length - a.functions.length)
      .slice(0, limit);
  }

  /**
   * Найти модули с наименьшим количеством функций
   */
  getSmallestModules(limit: number = 10): ModuleEntity[] {
    return Array.from(this.moduleMap.values())
      .sort((a, b) => a.functions.length - b.functions.length)
      .slice(0, limit);
  }

  // ==================== СТАТИСТИКА ВСЕХ МОДУЛЕЙ ====================

  /**
   * Получить общую статистику модулей
   */
  getTotalStats(): {
    totalModules: number;
    totalFunctions: number;
    totalFiles: number;
    avgFunctionsPerModule: number;
    avgFilesPerModule: number;
    maxFunctions: number;
    minFunctions: number;
    modulesWithFunctions: number;
    emptyModules: number;
  } {
    const modules = Array.from(this.moduleMap.values());
    const functionCounts = modules.map(m => m.functions.length);

    return {
      totalModules: modules.length,
      totalFunctions: functionCounts.reduce((a, b) => a + b, 0),
      totalFiles: modules.reduce((a, b) => a + b.files.length, 0),
      avgFunctionsPerModule:
        modules.length > 0 ? functionCounts.reduce((a, b) => a + b, 0) / modules.length : 0,
      avgFilesPerModule:
        modules.length > 0 ? modules.reduce((a, b) => a + b.files.length, 0) / modules.length : 0,
      maxFunctions: functionCounts.length > 0 ? Math.max(...functionCounts) : 0,
      minFunctions: functionCounts.length > 0 ? Math.min(...functionCounts) : 0,
      modulesWithFunctions: modules.filter(m => m.functions.length > 0).length,
      emptyModules: modules.filter(m => m.functions.length === 0).length,
    };
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Нормализовать ID функции
   */
  private normalizeFunctionId(id: FunctionId | string | number): FunctionId {
    if (typeof id === 'string' && id.startsWith('fn')) {
      return id as FunctionId;
    }
    if (typeof id === 'number') {
      return `fn${id}` as FunctionId;
    }
    return String(id) as FunctionId;
  }

  /**
   * Проверить, существует ли модуль
   */
  has(id: ModuleId): boolean {
    return this.moduleMap.has(id);
  }

  /**
   * Получить количество модулей
   */
  size(): number {
    return this.moduleMap.size;
  }

  /**
   * Получить все ID модулей
   */
  getIds(): ModuleId[] {
    return Array.from(this.moduleMap.keys());
  }

  /**
   * Получить все имена модулей
   */
  getNames(): string[] {
    return Array.from(this.moduleMap.values()).map(m => m.name);
  }

  // ==================== КЕШ ====================

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

  // ==================== ЭКСПОРТ ====================

  /**
   * Экспортировать в JSON
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        modules: Array.from(this.moduleMap.entries()),
        functionToModule: Array.from(this.functionToModule.entries()),
        fileToModule: Array.from(this.fileToModule.entries()),
        filePathMap: Array.from(this.filePathMap.entries()),
      },
      null,
      2
    );
  }

  /**
   * Импортировать из JSON
   */
  importFromJSON(json: string): this {
    const data = JSON.parse(json);
    this.moduleMap = new Map(data.modules);
    this.functionToModule = new Map(data.functionToModule);
    this.fileToModule = new Map(data.fileToModule);
    if (data.filePathMap) {
      this.filePathMap = new Map(data.filePathMap);
    }
    return this;
  }

  // ==================== КЛОНИРОВАНИЕ ====================

  /**
   * Создать клон менеджера
   */
  clone(): ModuleManager {
    const clone = new ModuleManager(new Map(this.moduleMap), this.options);
    clone.functionToModule = new Map(this.functionToModule);
    clone.fileToModule = new Map(this.fileToModule);
    clone.filePathMap = new Map(this.filePathMap);
    clone.cache = new Map(this.cache);
    return clone;
  }

  // ==================== ФИЛЬТРАЦИЯ ====================

  /**
   * Фильтровать модули по предикату
   */
  filter(predicate: (module: ModuleEntity) => boolean): ModuleEntity[] {
    return Array.from(this.moduleMap.values()).filter(predicate);
  }

  /**
   * Найти модули, содержащие функцию
   */
  findModulesWithFunction(functionId: FunctionId | string | number): ModuleEntity[] {
    const normalized = this.normalizeFunctionId(functionId);
    const results: ModuleEntity[] = [];

    for (const module of this.moduleMap.values()) {
      if (module.functions.includes(normalized)) {
        results.push(module);
      }
    }

    return results;
  }

  /**
   * Найти модули, содержащие файл
   */
  findModulesWithFile(fileId: FileId): ModuleEntity[] {
    const results: ModuleEntity[] = [];

    for (const module of this.moduleMap.values()) {
      if (module.files.includes(fileId)) {
        results.push(module);
      }
    }

    return results;
  }

  // ==================== ОБНОВЛЕНИЕ ====================

  /**
   * Добавить функцию в модуль
   */
  addFunctionToModule(moduleId: ModuleId, functionId: FunctionId): boolean {
    const module = this.get(moduleId);
    if (!module) return false;

    if (!module.functions.includes(functionId)) {
      module.functions.push(functionId);
      this.functionToModule.set(functionId, moduleId);
      return true;
    }
    return false;
  }

  /**
   * Удалить функцию из модуля
   */
  removeFunctionFromModule(moduleId: ModuleId, functionId: FunctionId): boolean {
    const module = this.get(moduleId);
    if (!module) return false;

    const index = module.functions.indexOf(functionId);
    if (index !== -1) {
      module.functions.splice(index, 1);
      this.functionToModule.delete(functionId);
      return true;
    }
    return false;
  }

  /**
   * Добавить файл в модуль
   */
  addFileToModule(moduleId: ModuleId, fileId: FileId): boolean {
    const module = this.get(moduleId);
    if (!module) return false;

    if (!module.files.includes(fileId)) {
      module.files.push(fileId);
      this.fileToModule.set(fileId, moduleId);
      // Добавляем путь в кеш
      if (!this.filePathMap.has(fileId)) {
        this.filePathMap.set(fileId, `src/${module.name}/${fileId}.ts`);
      }
      return true;
    }
    return false;
  }

  /**
   * Удалить файл из модуля
   */
  removeFileFromModule(moduleId: ModuleId, fileId: FileId): boolean {
    const module = this.get(moduleId);
    if (!module) return false;

    const index = module.files.indexOf(fileId);
    if (index !== -1) {
      module.files.splice(index, 1);
      this.fileToModule.delete(fileId);
      this.filePathMap.delete(fileId);
      return true;
    }
    return false;
  }

  // ==================== ТЕСТИРОВАНИЕ ====================

  /**
   * Создать тестовый модуль
   */
  static createTestModule(
    id: ModuleId,
    name: string,
    functions: FunctionId[] = [],
    files: FileId[] = []
  ): ModuleEntity {
    return {
      id,
      name,
      functions: [...functions],
      files: [...files],
      calls: [],
      imports: [],
    };
  }

  /**
   * Создать тестовый менеджер
   */
  static createTestManager(): ModuleManager {
    const moduleMap = new Map<ModuleId, ModuleEntity>();

    const m1 = ModuleManager.createTestModule('m1', 'core', ['fn1', 'fn2', 'fn3'], ['f1', 'f2']);
    const m2 = ModuleManager.createTestModule('m2', 'utils', ['fn4', 'fn5'], ['f3', 'f4']);
    const m3 = ModuleManager.createTestModule('m3', 'api', ['fn6', 'fn7', 'fn8', 'fn9'], ['f5']);

    moduleMap.set('m1', m1);
    moduleMap.set('m2', m2);
    moduleMap.set('m3', m3);

    return new ModuleManager(moduleMap);
  }
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default ModuleManager;
