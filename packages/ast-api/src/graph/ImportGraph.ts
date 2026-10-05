// src/graph/ImportGraph.ts

/**
 * Граф импортов для AST отчета
 *
 * @module graph/ImportGraph
 * @description Управляет графом импортов между функциями и модулями
 *
 * @example
 * ```typescript
 * import { ImportGraph } from './ImportGraph.js';
 *
 * const graph = new ImportGraph(idNormalizer, functionMap);
 * graph.build(data.gr?.i || []);
 *
 * // Получить импорты функции
 * const imports = graph.getImports('fn64');
 *
 * // Получить импортеры функции
 * const importers = graph.getImporters('fn64');
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  ImportEdge,
  ImportType,
  FileId,
  ModuleId,
} from '../types/index.js';

import type { IdNormalizer } from '../core/IdNormalizer.js';

/**
 * Ребро импорта с метаданными
 */
export interface ImportEdgeWithMeta {
  /** Целевая функция (что импортируют) */
  to: FunctionId;
  /** Имя импорта */
  name: string;
  /** Тип импорта */
  type: ImportType;
  /** Файл, из которого импортируют */
  file: FileId;
}

/**
 * Ребро импортера с метаданными
 */
export interface ImporterEdgeWithMeta {
  /** Функция-импортер (кто импортирует) */
  from: FunctionId;
  /** Имя импорта */
  name: string;
  /** Тип импорта */
  type: ImportType;
  /** Файл, в котором находится импорт */
  file: FileId;
}

/**
 * Статистика импортов
 */
export interface ImportStats {
  /** Общее количество импортов */
  totalImports: number;
  /** Уникальные импортеры */
  uniqueImporters: number;
  /** Уникальные импортируемые */
  uniqueImportees: number;
  /** Распределение по типам */
  byType: Record<ImportType, number>;
  /** Распределение по модулям-импортерам */
  byImporterModule: Record<ModuleId, number>;
  /** Распределение по модулям-импортируемым */
  byImporteeModule: Record<ModuleId, number>;
  /** Топ импортеров */
  topImporters: { id: FunctionId; name: string; imports: number }[];
  /** Топ импортируемых */
  topImportees: { id: FunctionId; name: string; imported: number }[];
}

/**
 * Опции для графа импортов
 */
export interface ImportGraphOptions {
  /** Логировать предупреждения */
  logWarnings?: boolean;
  /** Строгий режим */
  strictMode?: boolean;
  /** Включить статистику */
  enableStats?: boolean;
}

/**
 * Результат поиска по графу
 */
export interface ImportSearchResult {
  /** Найденные импорты */
  imports: ImportEdgeWithMeta[];
  /** Найденные импортеры */
  importers: ImporterEdgeWithMeta[];
  /** Всего найдено */
  total: number;
}

export class ImportGraph {
  // ==================== ПУБЛИЧНЫЕ ПОЛЯ ====================

  /** Все ребра импортов */
  public edges: ImportEdge[] = [];

  /** Кто импортирует -> список импортов */
  public byImporter = new Map<FunctionId, ImportEdgeWithMeta[]>();

  /** Кого импортируют -> список импортеров */
  public byImportee = new Map<FunctionId, ImporterEdgeWithMeta[]>();

  /** Граф импортов (прямой) */
  public adjacency = new Map<FunctionId, Set<FunctionId>>();

  /** Обратный граф импортов */
  public reverseAdjacency = new Map<FunctionId, Set<FunctionId>>();

  // ==================== ПРИВАТНЫЕ ПОЛЯ ====================

  /** Кеш для быстрого доступа */
  private cache = new Map<string, unknown>();

  /** Импорт-карта для быстрого поиска: (импортер, импортируемый) -> ребра */
  private importMap = new Map<string, ImportEdgeWithMeta[]>();

  /** Статистика */
  private stats: ImportStats | null = null;

  /** Нормализатор ID */
  private idNormalizer: IdNormalizer;

  /** Карта функций */
  private functionMap: Map<FunctionId, FunctionEntity>;

  /** Опции */
  private options: Required<ImportGraphOptions>;

  constructor(
    idNormalizer: IdNormalizer,
    functionMap: Map<FunctionId, FunctionEntity>,
    options: ImportGraphOptions = {}
  ) {
    this.idNormalizer = idNormalizer;
    this.functionMap = functionMap;
    this.options = {
      logWarnings: options.logWarnings ?? true,
      strictMode: options.strictMode ?? false,
      enableStats: options.enableStats ?? true,
    };
  }

  /**
   * Построить граф импортов
   */
  build(edges: ImportEdge[]): this {
    this.edges = edges;
    this.byImporter.clear();
    this.byImportee.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.cache.clear();
    this.importMap.clear();
    this.stats = null;

    let validEdges = 0;
    let invalidEdges = 0;

    for (const [from, to, name, type, file] of edges) {
      const fromId = this.idNormalizer.normalize(from);
      const toId = this.idNormalizer.normalize(to);

      // Проверяем существование функций
      if (!this.functionMap.has(fromId) || !this.functionMap.has(toId)) {
        invalidEdges++;
        if (this.options.logWarnings) {
          console.warn(
            `⚠️ [ImportGraph] Пропущен импорт: ${fromId} -> ${toId} (функции не найдены)`
          );
        }
        continue;
      }

      validEdges++;

      // byImporter
      if (!this.byImporter.has(fromId)) {
        this.byImporter.set(fromId, []);
      }
      const importMeta: ImportEdgeWithMeta = { to: toId, name, type, file };
      this.byImporter.get(fromId)!.push(importMeta);

      // byImportee
      if (!this.byImportee.has(toId)) {
        this.byImportee.set(toId, []);
      }
      const importerMeta: ImporterEdgeWithMeta = { from: fromId, name, type, file };
      this.byImportee.get(toId)!.push(importerMeta);

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

      // importMap для быстрого поиска
      const key = this.getImportKey(fromId, toId);
      if (!this.importMap.has(key)) {
        this.importMap.set(key, []);
      }
      this.importMap.get(key)!.push(importMeta);
    }

    if (invalidEdges > 0 && this.options.logWarnings) {
      console.warn(`⚠️ [ImportGraph] ${invalidEdges} импортов пропущено, ${validEdges} обработано`);
    }

    // Строим статистику
    if (this.options.enableStats) {
      this.buildStats();
    }

    return this;
  }

  /**
   * Получить ключ для импорт-карты
   */
  private getImportKey(fromId: FunctionId, toId: FunctionId): string {
    return `${fromId}|${toId}`;
  }

  /**
   * Построить статистику
   */
  private buildStats(): void {
    const byType: Record<ImportType, number> = {
      n: 0,
      df: 0,
      ns: 0,
      ri: 0,
      to: 0,
      se: 0,
    };

    const byImporterModule: Record<ModuleId, number> = {};
    const byImporteeModule: Record<ModuleId, number> = {};

    const importerCount = new Map<FunctionId, number>();
    const importeeCount = new Map<FunctionId, number>();

    for (const [from, imports] of this.byImporter) {
      const fromFn = this.functionMap.get(from);
      if (!fromFn) continue;

      const moduleId = fromFn.moduleId;
      byImporterModule[moduleId] = (byImporterModule[moduleId] || 0) + imports.length;

      importerCount.set(from, (importerCount.get(from) || 0) + imports.length);

      for (const imp of imports) {
        byType[imp.type] = (byType[imp.type] || 0) + 1;

        const toFn = this.functionMap.get(imp.to);
        if (toFn) {
          byImporteeModule[toFn.moduleId] = (byImporteeModule[toFn.moduleId] || 0) + 1;
        }
      }
    }

    for (const [to, importers] of this.byImportee) {
      importeeCount.set(to, (importeeCount.get(to) || 0) + importers.length);
    }

    // Топ импортеров
    const topImporters = Array.from(importerCount.entries())
      .map(([id, imports]) => ({
        id,
        name: this.functionMap.get(id)?.name || id,
        imports,
      }))
      .sort((a, b) => b.imports - a.imports)
      .slice(0, 10);

    // Топ импортируемых
    const topImportees = Array.from(importeeCount.entries())
      .map(([id, imported]) => ({
        id,
        name: this.functionMap.get(id)?.name || id,
        imported,
      }))
      .sort((a, b) => b.imported - a.imported)
      .slice(0, 10);

    this.stats = {
      totalImports: this.edges.length,
      uniqueImporters: this.byImporter.size,
      uniqueImportees: this.byImportee.size,
      byType,
      byImporterModule,
      byImporteeModule,
      topImporters,
      topImportees,
    };
  }

  /**
   * Получить импорты функции (что импортирует)
   */
  getImports(functionId: FunctionId | string | number): ImportEdgeWithMeta[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byImporter.get(normalizedId) || [];
  }

  /**
   * Получить импортеры функции (кто импортирует)
   */
  getImporters(functionId: FunctionId | string | number): ImporterEdgeWithMeta[] {
    const normalizedId = this.idNormalizer.normalize(functionId);
    return this.byImportee.get(normalizedId) || [];
  }

  /**
   * Проверить, импортирует ли функция другую
   */
  imports(
    functionId: FunctionId | string | number,
    targetId: FunctionId | string | number
  ): boolean {
    const fromId = this.idNormalizer.normalize(functionId);
    const toId = this.idNormalizer.normalize(targetId);

    const adjacency = this.adjacency.get(fromId);
    return adjacency ? adjacency.has(toId) : false;
  }

  /**
   * Найти импорты по имени
   */
  findImportsByName(name: string): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];
    const lowerName = name.toLowerCase();

    for (const [, imports] of this.byImporter) {
      for (const imp of imports) {
        if (imp.name.toLowerCase().includes(lowerName)) {
          results.push({
            ...imp,
          });
        }
      }
    }

    return results;
  }

  /**
   * Найти импортеров по имени
   */
  findImportersByName(name: string): ImporterEdgeWithMeta[] {
    const results: ImporterEdgeWithMeta[] = [];
    const lowerName = name.toLowerCase();

    for (const [, importers] of this.byImportee) {
      for (const imp of importers) {
        if (imp.name.toLowerCase().includes(lowerName)) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Найти импорты по типу
   */
  findImportsByType(type: ImportType): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];

    for (const [, imports] of this.byImporter) {
      for (const imp of imports) {
        if (imp.type === type) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Найти импортеров по типу
   */
  findImportersByType(type: ImportType): ImporterEdgeWithMeta[] {
    const results: ImporterEdgeWithMeta[] = [];

    for (const [, importers] of this.byImportee) {
      for (const imp of importers) {
        if (imp.type === type) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Найти импорты по файлу
   */
  findImportsByFile(fileId: FileId): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];

    for (const [, imports] of this.byImporter) {
      for (const imp of imports) {
        if (imp.file === fileId) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Найти импортеров по файлу
   */
  findImportersByFile(fileId: FileId): ImporterEdgeWithMeta[] {
    const results: ImporterEdgeWithMeta[] = [];

    for (const [, importers] of this.byImportee) {
      for (const imp of importers) {
        if (imp.file === fileId) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Получить кросс-модульные импорты
   */
  getCrossModuleImports(): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];

    for (const [fromId, imports] of this.byImporter) {
      const fromFn = this.functionMap.get(fromId);
      if (!fromFn) continue;

      for (const imp of imports) {
        const toFn = this.functionMap.get(imp.to);
        if (!toFn) continue;

        if (fromFn.moduleId !== toFn.moduleId) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Получить импорты по модулю-импортеру
   */
  getImportsByModule(moduleId: ModuleId): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];

    for (const [fromId, imports] of this.byImporter) {
      const fromFn = this.functionMap.get(fromId);
      if (!fromFn || fromFn.moduleId !== moduleId) continue;

      results.push(...imports);
    }

    return results;
  }

  /**
   * Получить импортеров по модулю-импортируемому
   */
  getImportersByModule(moduleId: ModuleId): ImporterEdgeWithMeta[] {
    const results: ImporterEdgeWithMeta[] = [];

    for (const [toId, importers] of this.byImportee) {
      const toFn = this.functionMap.get(toId);
      if (!toFn || toFn.moduleId !== moduleId) continue;

      results.push(...importers);
    }

    return results;
  }

  /**
   * Получить все импорты из модуля
   */
  getExportsToModule(moduleId: ModuleId): ImportEdgeWithMeta[] {
    const results: ImportEdgeWithMeta[] = [];

    for (const [fromId, imports] of this.byImporter) {
      const fromFn = this.functionMap.get(fromId);
      if (!fromFn || fromFn.moduleId === moduleId) continue;

      for (const imp of imports) {
        const toFn = this.functionMap.get(imp.to);
        if (toFn && toFn.moduleId === moduleId) {
          results.push(imp);
        }
      }
    }

    return results;
  }

  /**
   * Получить статистику
   */
  getStats(): ImportStats | null {
    return this.stats;
  }

  /**
   * Получить все ребра (публичный метод)
   */
  getEdges(): ImportEdge[] {
    return this.edges;
  }

  /**
   * Получить карту импортеров (публичный метод)
   */
  getByImporter(): Map<FunctionId, ImportEdgeWithMeta[]> {
    return this.byImporter;
  }

  /**
   * Получить карту импортируемых (публичный метод)
   */
  getByImportee(): Map<FunctionId, ImporterEdgeWithMeta[]> {
    return this.byImportee;
  }

  /**
   * Получить граф смежности (публичный метод)
   */
  getAdjacency(): Map<FunctionId, Set<FunctionId>> {
    return this.adjacency;
  }

  /**
   * Получить обратный граф смежности (публичный метод)
   */
  getReverseAdjacency(): Map<FunctionId, Set<FunctionId>> {
    return this.reverseAdjacency;
  }

  /**
   * Получить цепочку импортов
   */
  getImportChain(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number
  ): FunctionId[] | null {
    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    // BFS для поиска пути
    const queue: FunctionId[][] = [[from]];
    const visited = new Set<FunctionId>([from]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      // Проверяем, что current существует
      if (!current) continue;

      if (current === to) {
        return path;
      }

      const neighbors = this.adjacency.get(current) || new Set();
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }

    return null;
  }

  /**
   * Найти все цепочки импортов
   */
  findAllImportChains(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = 10
  ): FunctionId[][] {
    const from = this.idNormalizer.normalize(fromId);
    const to = this.idNormalizer.normalize(toId);

    const results: FunctionId[][] = [];
    const visited = new Set<FunctionId>();

    this.findImportChainsDFS(from, to, [from], visited, results, maxDepth);

    return results;
  }

  private findImportChainsDFS(
    current: FunctionId,
    target: FunctionId,
    path: FunctionId[],
    visited: Set<FunctionId>,
    results: FunctionId[][],
    maxDepth: number
  ): void {
    // Проверяем, что current существует
    if (!current) return;

    if (path.length > maxDepth) return;
    if (current === target) {
      results.push([...path]);
      return;
    }

    const neighbors = this.adjacency.get(current) || new Set();
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        path.push(next);
        this.findImportChainsDFS(next, target, path, visited, results, maxDepth);
        path.pop();
        visited.delete(next);
      }
    }
  }

  /**
   * Получить функции, зависящие от заданной (прямые зависимости)
   */
  getDependents(functionId: FunctionId | string | number): FunctionId[] {
    const id = this.idNormalizer.normalize(functionId);
    const result: FunctionId[] = [];

    for (const [fromId, imports] of this.byImporter) {
      for (const imp of imports) {
        if (imp.to === id) {
          result.push(fromId);
          break;
        }
      }
    }

    return result;
  }

  /**
   * Получить функции, от которых зависит заданная (обратные зависимости)
   */
  getDependencies(functionId: FunctionId | string | number): FunctionId[] {
    const id = this.idNormalizer.normalize(functionId);
    const imports = this.byImporter.get(id) || [];
    return imports.map(imp => imp.to);
  }

  /**
   * Проверить наличие циклических импортов
   */
  hasCyclicImports(): boolean {
    const visited = new Set<FunctionId>();
    const recursionStack = new Set<FunctionId>();

    for (const [node] of this.adjacency) {
      if (!visited.has(node)) {
        if (this.hasCycleDFS(node, visited, recursionStack)) {
          return true;
        }
      }
    }

    return false;
  }

  private hasCycleDFS(
    node: FunctionId,
    visited: Set<FunctionId>,
    recursionStack: Set<FunctionId>
  ): boolean {
    // Проверяем, что node существует
    if (!node) return false;

    visited.add(node);
    recursionStack.add(node);

    const neighbors = this.adjacency.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (this.hasCycleDFS(neighbor, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  /**
   * Найти циклические импорты
   */
  findCyclicImports(): FunctionId[][] {
    const cycles: FunctionId[][] = [];
    const visited = new Set<FunctionId>();
    const recursionStack = new Set<FunctionId>();
    const path: FunctionId[] = [];

    for (const [node] of this.adjacency) {
      if (!visited.has(node)) {
        this.findCyclesDFS(node, visited, recursionStack, path, cycles);
      }
    }

    return cycles;
  }

  private findCyclesDFS(
    node: FunctionId,
    visited: Set<FunctionId>,
    recursionStack: Set<FunctionId>,
    path: FunctionId[],
    cycles: FunctionId[][]
  ): void {
    // Проверяем, что node существует
    if (!node) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = this.adjacency.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.findCyclesDFS(neighbor, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(neighbor)) {
        // Найден цикл
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycles.push(cycle);
        }
      }
    }

    recursionStack.delete(node);
    path.pop();
  }

  /**
   * Очистить кеш
   */
  clearCache(): this {
    this.cache.clear();
    return this;
  }

  /**
   * Сбросить состояние
   */
  reset(): this {
    this.edges = [];
    this.byImporter.clear();
    this.byImportee.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.cache.clear();
    this.importMap.clear();
    this.stats = null;
    return this;
  }

  /**
   * Экспортировать граф в DOT формат
   */
  exportToDOT(): string {
    if (this.edges.length === 0) return '';

    let dot = 'digraph ImportGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    const nodes = new Set<FunctionId>();
    const dotEdges = new Set<string>();

    for (const [from, to] of this.edges) {
      const fromId = this.idNormalizer.normalize(from);
      const toId = this.idNormalizer.normalize(to);

      nodes.add(fromId);
      nodes.add(toId);

      const fromFn = this.functionMap.get(fromId);
      const toFn = this.functionMap.get(toId);

      dotEdges.add(`  "${fromId}" -> "${toId}" [label="${fromFn?.name}->${toFn?.name}"];`);
    }

    for (const node of nodes) {
      const fn = this.functionMap.get(node);
      const label = fn ? `${fn.name} (${node})` : node;
      dot += `  "${node}" [label="${label}"];\n`;
    }

    dot += '\n';
    for (const edge of dotEdges) {
      dot += `${edge}\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Экспортировать граф в JSON
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        edges: this.edges,
        stats: this.stats,
        importers: Array.from(this.byImporter.entries()).map(([id, imports]) => ({
          id,
          imports,
        })),
        importees: Array.from(this.byImportee.entries()).map(([id, importers]) => ({
          id,
          importers,
        })),
      },
      null,
      2
    );
  }

  /**
   * Получить размер графа
   */
  getSize(): { edges: number; importers: number; importees: number } {
    return {
      edges: this.edges.length,
      importers: this.byImporter.size,
      importees: this.byImportee.size,
    };
  }

  /**
   * Проверить, есть ли импорты у функции
   */
  hasImports(functionId: FunctionId | string | number): boolean {
    const id = this.idNormalizer.normalize(functionId);
    return this.byImporter.has(id) && this.byImporter.get(id)!.length > 0;
  }

  /**
   * Проверить, импортируют ли функцию
   */
  isImported(functionId: FunctionId | string | number): boolean {
    const id = this.idNormalizer.normalize(functionId);
    return this.byImportee.has(id) && this.byImportee.get(id)!.length > 0;
  }

  /**
   * Получить все импорты, сгруппированные по типу
   */
  getImportsGroupedByType(): Map<ImportType, ImportEdgeWithMeta[]> {
    const result = new Map<ImportType, ImportEdgeWithMeta[]>();

    for (const [, imports] of this.byImporter) {
      for (const imp of imports) {
        if (!result.has(imp.type)) {
          result.set(imp.type, []);
        }
        result.get(imp.type)!.push(imp);
      }
    }

    return result;
  }

  /**
   * Получить импортеров, сгруппированных по типу
   */
  getImportersGroupedByType(): Map<ImportType, ImporterEdgeWithMeta[]> {
    const result = new Map<ImportType, ImporterEdgeWithMeta[]>();

    for (const [, importers] of this.byImportee) {
      for (const imp of importers) {
        if (!result.has(imp.type)) {
          result.set(imp.type, []);
        }
        result.get(imp.type)!.push(imp);
      }
    }

    return result;
  }

  /**
   * Клонировать граф
   */
  clone(): ImportGraph {
    const clone = new ImportGraph(this.idNormalizer, this.functionMap, this.options);
    clone.edges = [...this.edges];
    clone.byImporter = new Map(this.byImporter);
    clone.byImportee = new Map(this.byImportee);
    clone.adjacency = new Map(this.adjacency);
    clone.reverseAdjacency = new Map(this.reverseAdjacency);
    clone.importMap = new Map(this.importMap);
    if (this.stats) {
      clone.stats = { ...this.stats };
    }
    return clone;
  }

  /**
   * Фильтровать граф по модулям
   */
  filterByModule(moduleId: ModuleId): this {
    const filteredEdges: ImportEdge[] = [];

    for (const edge of this.edges) {
      const [from, to] = edge;
      const fromId = this.idNormalizer.normalize(from);
      const toId = this.idNormalizer.normalize(to);

      const fromFn = this.functionMap.get(fromId);
      const toFn = this.functionMap.get(toId);

      if (fromFn?.moduleId === moduleId || toFn?.moduleId === moduleId) {
        filteredEdges.push(edge);
      }
    }

    this.build(filteredEdges);
    return this;
  }

  /**
   * Фильтровать граф по типу импорта
   */
  filterByType(type: ImportType): this {
    const filteredEdges: ImportEdge[] = [];

    for (const edge of this.edges) {
      if (edge[3] === type) {
        filteredEdges.push(edge);
      }
    }

    this.build(filteredEdges);
    return this;
  }

  /**
   * Фильтровать граф по файлу
   */
  filterByFile(fileId: FileId): this {
    const filteredEdges: ImportEdge[] = [];

    for (const edge of this.edges) {
      if (edge[4] === fileId) {
        filteredEdges.push(edge);
      }
    }

    this.build(filteredEdges);
    return this;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать граф импортов с настройками по умолчанию
 */
export function createDefaultImportGraph(
  idNormalizer: IdNormalizer,
  functionMap: Map<FunctionId, FunctionEntity>
): ImportGraph {
  return new ImportGraph(idNormalizer, functionMap, {
    logWarnings: true,
    strictMode: false,
    enableStats: true,
  });
}

/**
 * Создать строгий граф импортов
 */
export function createStrictImportGraph(
  idNormalizer: IdNormalizer,
  functionMap: Map<FunctionId, FunctionEntity>
): ImportGraph {
  return new ImportGraph(idNormalizer, functionMap, {
    logWarnings: true,
    strictMode: true,
    enableStats: true,
  });
}

/**
 * Объединить два графа импортов
 */
export function mergeImportGraphs(graph1: ImportGraph, graph2: ImportGraph): ImportGraph {
  const mergedEdges: ImportEdge[] = [...graph1.getEdges(), ...graph2.getEdges()];

  const idNormalizer = graph1['idNormalizer'];
  const functionMap = graph1['functionMap'];

  const result = new ImportGraph(idNormalizer, functionMap);
  result.build(mergedEdges);

  return result;
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default ImportGraph;

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для графа импортов
 */
export interface TestImportGraphData {
  edges: ImportEdge[];
  expectedImporters: Map<FunctionId, ImportEdgeWithMeta[]>;
  expectedImportees: Map<FunctionId, ImporterEdgeWithMeta[]>;
}

/**
 * Создать тестовые данные для графа импортов
 */
export function createTestImportGraphData(): TestImportGraphData {
  const edges: ImportEdge[] = [
    ['fn1', 'fn2', 'testFunction', 'n', 'f1'],
    ['fn1', 'fn3', 'anotherTest', 'df', 'f1'],
    ['fn2', 'fn4', 'someFunction', 'ns', 'f2'],
    ['fn3', 'fn4', 'someFunction', 'ri', 'f2'],
    ['fn5', 'fn1', 'testFunction', 'to', 'f3'],
  ];

  const expectedImporters = new Map<FunctionId, ImportEdgeWithMeta[]>([
    [
      'fn1',
      [
        { to: 'fn2', name: 'testFunction', type: 'n', file: 'f1' },
        { to: 'fn3', name: 'anotherTest', type: 'df', file: 'f1' },
      ],
    ],
    ['fn2', [{ to: 'fn4', name: 'someFunction', type: 'ns', file: 'f2' }]],
    ['fn3', [{ to: 'fn4', name: 'someFunction', type: 'ri', file: 'f2' }]],
    ['fn5', [{ to: 'fn1', name: 'testFunction', type: 'to', file: 'f3' }]],
  ]);

  const expectedImportees = new Map<FunctionId, ImporterEdgeWithMeta[]>([
    ['fn2', [{ from: 'fn1', name: 'testFunction', type: 'n', file: 'f1' }]],
    ['fn3', [{ from: 'fn1', name: 'anotherTest', type: 'df', file: 'f1' }]],
    [
      'fn4',
      [
        { from: 'fn2', name: 'someFunction', type: 'ns', file: 'f2' },
        { from: 'fn3', name: 'someFunction', type: 'ri', file: 'f2' },
      ],
    ],
    ['fn1', [{ from: 'fn5', name: 'testFunction', type: 'to', file: 'f3' }]],
  ]);

  return { edges, expectedImporters, expectedImportees };
}
