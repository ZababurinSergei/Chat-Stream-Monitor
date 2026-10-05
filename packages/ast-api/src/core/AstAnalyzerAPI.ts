// src/core/AstAnalyzerAPI.ts

/**
 * AST Analyzer API - Главный класс
 *
 * @module AstAnalyzerAPI
 * @description Синглтон-класс для навигации и анализа AST-отчетов
 *
 * @example
 * ```typescript
 * import AstAnalyzerAPI from 'ast-analyzer-api';
 *
 * const api = AstAnalyzerAPI;
 * api.load(reportData);
 *
 * // Навигация
 * const fn = api.getFunction('fn64');
 * const calls = api.getCalls('fn64');
 *
 * // Поиск путей (двусторонний BFS с пересечением)
 * const paths = api.findAllPaths('fn64', 'fn169');
 *
 * // Поиск по имени
 * const results = api.searchFunctions('pipeline');
 *
 * // Проверка достижимости
 * const reachable = api.isReachable('fn64', 'fn169');
 * ```
 */

import type {
  ASTReport,
  FunctionId,
  FunctionEntity,
  FileId,
  FileEntity,
  ModuleId,
  ModuleEntity,
  ConstantId,
  ConstantEntity,
  CallEdgeWithMeta,
  CallerEdgeWithMeta,
  CrossModuleCall,
  ImportEdgeWithMeta,
  ImporterEdgeWithMeta,
  DeadCodeResult,
  IsolationResult,
  DetailedStats,
  Analytics,
  PathResult,
  PathStatistics,
  DynamicImport,
  Closure,
  AsyncChain,
  ReportStats,
  CallEdge,
  ImportEdge,
} from '../types/index.js';

import { DataLoader } from './DataLoader.js';
import type { IdNormalizer } from './IdNormalizer.js';
import { CallGraph } from '../graph/CallGraph.js';
import { ImportGraph } from '../graph/ImportGraph.js';
import { PathFinder } from '../graph/PathFinder.js';
import { NameSearch } from '../search/NameSearch.js';
import { PathSearch } from '../search/PathSearch.js';
import { DeadCodeAnalyzer } from '../analysis/DeadCodeAnalyzer.js';
import { IsolationAnalyzer } from '../analysis/IsolationAnalyzer.js';
import { Statistics } from '../analysis/Statistics.js';
import { IntersectionAnalyzer } from '../analysis/IntersectionAnalyzer.js';
import { FunctionManager } from '../entities/FunctionManager.js';
import { ModuleManager } from '../entities/ModuleManager.js';
import { FileManager } from '../entities/FileManager.js';
import { ConstantManager } from '../entities/ConstantManager.js';
import { DOTExporter } from '../export/DOTExporter.js';

/**
 * Опции загрузки
 */
export interface LoadOptions {
  /** Автоматически строить индексы */
  buildIndexes?: boolean;
  /** Очищать кеш перед загрузкой */
  clearCache?: boolean;
  /** Валидировать данные перед загрузкой */
  validate?: boolean;
}

/**
 * Опции поиска
 */
export interface SearchOptions {
  /** Максимальное количество результатов */
  limit?: number;
  /** Минимальный score для fuzzy поиска */
  minScore?: number;
  /** Учитывать регистр */
  caseSensitive?: boolean;
}

/**
 * Опции анализа путей
 */
export interface PathOptions {
  /** Максимальная глубина поиска */
  maxDepth?: number;
  /** Алгоритм поиска */
  algorithm?: 'bfs' | 'dfs' | 'bidirectional';
  /** Максимальное количество путей */
  maxPaths?: number;
}

/**
 * Опции экспорта
 */
export interface ExportOptions {
  /** Формат вывода */
  format?: 'json' | 'analytics' | 'dot';
  /** Pretty print */
  pretty?: boolean;
  /** Включить статистику */
  includeStats?: boolean;
  /** Включить метаданные */
  includeMetadata?: boolean;
}

/**
 * Статистика кеша
 */
export interface CacheStats {
  size: number;
  keys: string[];
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

/**
 * Главный класс API
 */
export class AstAnalyzerAPI {
  // ==================== СТАТИЧЕСКИЕ СВОЙСТВА ====================

  private static instance: AstAnalyzerAPI | null = null;
  private static isLoading = false;
  private static isInitialized = false;

  // ==================== ПРИВАТНЫЕ СВОЙСТВА ====================

  // Core
  private dataLoader: DataLoader | null = null;
  private idNormalizer: IdNormalizer | null = null;

  // Graphs
  private callGraph: CallGraph | null = null;
  private importGraph: ImportGraph | null = null;

  // Search
  private nameSearch: NameSearch | null = null;
  private pathSearch: PathSearch | null = null;

  // Analysis
  private deadCodeAnalyzer: DeadCodeAnalyzer | null = null;
  private isolationAnalyzer: IsolationAnalyzer | null = null;
  private statistics: Statistics | null = null;
  private intersectionAnalyzer: IntersectionAnalyzer | null = null;

  // Entities
  private functionManager: FunctionManager | null = null;
  private moduleManager: ModuleManager | null = null;
  private fileManager: FileManager | null = null;
  private constantManager: ConstantManager | null = null;

  // Export
  private dotExporter: DOTExporter | null = null;

  // Utils
  private pathFinder: PathFinder | null = null;

  // Cache
  private cache = new Map<string, unknown>();
  private cacheHits = 0;
  private cacheMisses = 0;

  // ==================== КОНСТРУКТОР ====================

  private constructor() {
    // Приватный конструктор для синглтона
  }

  // ==================== СТАТИЧЕСКИЕ МЕТОДЫ ====================

  /**
   * Получить экземпляр синглтона
   */
  static getInstance(): AstAnalyzerAPI {
    if (!AstAnalyzerAPI.instance) {
      AstAnalyzerAPI.instance = new AstAnalyzerAPI();
    }
    return AstAnalyzerAPI.instance;
  }

  /**
   * Сбросить синглтон
   */
  static resetInstance(): void {
    if (AstAnalyzerAPI.instance) {
      AstAnalyzerAPI.instance.reset();
      AstAnalyzerAPI.instance = null;
      AstAnalyzerAPI.isInitialized = false;
    }
  }

  /**
   * Проверить, инициализирован ли API
   */
  static isReady(): boolean {
    return AstAnalyzerAPI.isInitialized && AstAnalyzerAPI.instance !== null;
  }

  // ==================== ЗАГРУЗКА ====================

  /**
   * Загрузить данные отчета
   */
  load(data: ASTReport, options: LoadOptions = {}): this {
    const { buildIndexes = true, clearCache = true, validate = true } = options;

    if (AstAnalyzerAPI.isLoading) {
      console.warn('⏳ Загрузка уже выполняется...');
      return this;
    }

    if (validate) {
      const validation = this.validateData(data);
      if (!validation.valid) {
        throw new Error(`Некорректные данные: ${validation.errors.join(', ')}`);
      }
    }

    AstAnalyzerAPI.isLoading = true;

    try {
      if (clearCache) {
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
      }

      // Инициализация DataLoader
      this.dataLoader = new DataLoader();
      this.dataLoader.load(data);

      // Получение данных
      const functionMap = this.dataLoader.getFunctionMap();
      const fileMap = this.dataLoader.getFileMap();
      const moduleMap = this.dataLoader.getModuleMap();
      const constantMap = this.dataLoader.getConstantMap();
      this.idNormalizer = this.dataLoader.getIdNormalizer();

      // Entity менеджеры
      this.functionManager = new FunctionManager(functionMap, null, this.idNormalizer);
      this.moduleManager = new ModuleManager(moduleMap);
      this.fileManager = new FileManager(fileMap, functionMap);
      this.constantManager = new ConstantManager(constantMap);

      // Графы
      this.callGraph = new CallGraph(this.idNormalizer, functionMap);
      this.callGraph.build(data.gr?.c || []);

      this.importGraph = new ImportGraph(this.idNormalizer, functionMap);
      this.importGraph.build(data.gr?.i || []);

      // Поиск
      this.nameSearch = new NameSearch(functionMap, constantMap);
      if (buildIndexes) {
        this.nameSearch.buildIndex();
      }

      this.pathSearch = new PathSearch(fileMap);

      // Анализ
      this.deadCodeAnalyzer = new DeadCodeAnalyzer(functionMap, this.callGraph, this.idNormalizer);
      this.isolationAnalyzer = new IsolationAnalyzer(functionMap, this.callGraph, this.idNormalizer);
      this.statistics = new Statistics(data, functionMap, this.callGraph, this.importGraph);
      this.intersectionAnalyzer = new IntersectionAnalyzer(functionMap, this.callGraph, this.idNormalizer);

      // Экспорт
      this.dotExporter = new DOTExporter(functionMap);

      // PathFinder
      this.pathFinder = new PathFinder(this.callGraph, functionMap);

      AstAnalyzerAPI.isInitialized = true;

      console.log('✅ API успешно загружен');
      console.log(`   📊 Функций: ${functionMap.size}`);
      console.log(`   📁 Файлов: ${fileMap.size}`);
      console.log(`   📦 Модулей: ${moduleMap.size}`);
      console.log(`   🔗 Вызовов: ${data.gr?.c?.length || 0}`);
    } finally {
      AstAnalyzerAPI.isLoading = false;
    }

    return this;
  }

  /**
   * Валидация данных
   */
  private validateData(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Данные должны быть объектом');
      return { valid: false, errors };
    }

    const report = data as Partial<ASTReport>;

    if (!report.v) {
      errors.push('Отсутствует версия (v)');
    }

    if (!report.fns || !Array.isArray(report.fns)) {
      errors.push('Отсутствуют функции (fns)');
    }

    if (!report.fl || typeof report.fl !== 'object') {
      errors.push('Отсутствуют файлы (fl)');
    }

    if (!report.mi || typeof report.mi !== 'object') {
      errors.push('Отсутствуют модули (mi)');
    }

    if (report.fns && report.fns.length === 0) {
      errors.push('Нет функций в отчете');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Проверить, загружены ли данные
   */
  isLoaded(): boolean {
    return this.dataLoader !== null && this.dataLoader.getData() !== null;
  }

  /**
   * Получить сырые данные
   */
  getRawData(): ASTReport | null {
    return this.dataLoader?.getData() || null;
  }

  /**
   * Получить версию отчета
   */
  getVersion(): string | null {
    return this.getRawData()?.v || null;
  }

  /**
   * Получить timestamp отчета
   */
  getTimestamp(): string | null {
    return this.getRawData()?.ts || null;
  }

  // ==================== FUNCTION MANAGER ====================

  /**
   * Получить функцию по ID
   */
  getFunction(id: FunctionId | string | number): FunctionEntity | null {
    this.cacheMisses++;
    const cached = this.cache.get(`fn_${id}`);
    if (cached) {
      this.cacheHits++;
      return cached as FunctionEntity;
    }

    const result = this.functionManager?.get(id) || null;
    if (result) {
      this.cache.set(`fn_${id}`, result);
    }
    return result;
  }

  /**
   * Проверить существование функции
   */
  hasFunction(id: FunctionId | string | number): boolean {
    return this.functionManager?.has(id) || false;
  }

  /**
   * Получить все функции
   */
  getAllFunctions(): FunctionEntity[] {
    return this.functionManager?.getAll() || [];
  }

  /**
   * Получить функции по модулю
   */
  getFunctionsByModule(moduleId: ModuleId): FunctionEntity[] {
    return this.functionManager?.getByModule(moduleId) || [];
  }

  /**
   * Получить функции по файлу
   */
  getFunctionsByFile(fileId: FileId): FunctionEntity[] {
    return this.functionManager?.getByFile(fileId) || [];
  }

  /**
   * Получить функции по имени
   */
  getFunctionsByName(name: string): FunctionEntity[] {
    return this.functionManager?.getByName(name) || [];
  }

  /**
   * Получить функции по паттерну имени
   */
  getFunctionsByNamePattern(pattern: RegExp): FunctionEntity[] {
    return this.functionManager?.getByNamePattern(pattern) || [];
  }

  /**
   * Получить количество функций
   */
  getFunctionCount(): number {
    return this.functionManager?.size() || 0;
  }

  // ==================== MODULE MANAGER ====================

  /**
   * Получить модуль по ID
   */
  getModule(id: ModuleId): ModuleEntity | null {
    return this.moduleManager?.get(id) || null;
  }

  /**
   * Получить все модули
   */
  getAllModules(): ModuleEntity[] {
    return this.moduleManager?.getAll() || [];
  }

  /**
   * Получить модуль функции
   */
  getModuleOfFunction(functionId: FunctionId | string | number): ModuleEntity | null {
    return this.moduleManager?.getModuleOfFunction(functionId) || null;
  }

  /**
   * Получить модули по имени
   */
  getModulesByName(name: string): ModuleEntity[] {
    return this.moduleManager?.getByName(name) || [];
  }

  /**
   * Получить количество модулей
   */
  getModuleCount(): number {
    return this.moduleManager?.size() || 0;
  }

  // ==================== FILE MANAGER ====================

  /**
   * Получить файл по ID
   */
  getFile(id: FileId): FileEntity | null {
    return this.fileManager?.get(id) || null;
  }

  /**
   * Получить все файлы
   */
  getAllFiles(): FileEntity[] {
    return this.fileManager?.getAll() || [];
  }

  /**
   * Получить файлы по пути
   */
  getFilesByPath(path: string): FileEntity[] {
    const file = this.fileManager?.getByPath(path);
    return file ? [file] : [];
  }

  /**
   * Получить файлы по расширению
   */
  getFilesByExtension(extension: string): FileEntity[] {
    return this.fileManager?.getByExtension(extension) || [];
  }

  /**
   * Получить количество файлов
   */
  getFileCount(): number {
    return this.fileManager?.size() || 0;
  }

  // ==================== CONSTANT MANAGER ====================

  /**
   * Получить константу по ID
   */
  getConstant(id: ConstantId): ConstantEntity | null {
    return this.constantManager?.get(id) || null;
  }

  /**
   * Получить все константы
   */
  getAllConstants(): ConstantEntity[] {
    return this.constantManager?.getAll() || [];
  }

  /**
   * Найти константу по имени
   */
  findConstantByName(name: string): ConstantEntity[] {
    const result = this.constantManager?.findByName(name);
    return result?.items || [];
  }

  /**
   * Получить константы по модулю
   */
  getConstantsByModule(moduleId: ModuleId): ConstantEntity[] {
    return this.constantManager?.getByModule(moduleId) || [];
  }

  /**
   * Получить количество констант
   */
  getConstantCount(): number {
    return this.constantManager?.size() || 0;
  }

  // ==================== NAME SEARCH ====================

  /**
   * Найти функцию по точному имени
   */
  findFunctionByName(name: string): FunctionEntity[] {
    const result = this.nameSearch?.findByName(name);
    return (result as FunctionEntity[]) || [];
  }

  /**
   * Поиск функций по части имени
   */
  searchFunctions(query: string, options: SearchOptions = {}): FunctionEntity[] {
    const { limit = 100 } = options;
    const results = this.nameSearch?.search(query) || [];
    return results.slice(0, limit) as FunctionEntity[];
  }

  /**
   * Fuzzy-поиск функций
   */
  fuzzySearchFunctions(
    query: string,
    options: SearchOptions = {}
  ): (FunctionEntity & { score: number })[] {
    const { limit = 100, minScore = 0 } = options;
    const results = this.nameSearch?.fuzzySearch(query) || [];
    const filtered = results.filter(r => (r as any).score >= minScore);
    return filtered.slice(0, limit) as (FunctionEntity & { score: number })[];
  }

  /**
   * Поиск функций по имени с автодополнением
   */
  autocompleteFunctions(query: string, limit: number = 10): string[] {
    const results = this.fuzzySearchFunctions(query, { limit });
    return results.map(r => r.name);
  }

  // ==================== PATH SEARCH ====================

  /**
   * Поиск файлов по пути
   */
  searchFilesByPath(query: string): FileEntity[] {
    return this.pathSearch?.searchByPath(query) || [];
  }

  /**
   * Поиск файлов по имени
   */
  searchFilesByName(query: string): FileEntity[] {
    return this.pathSearch?.searchByName(query) || [];
  }

  /**
   * Получить функции по пути файла
   */
  getFunctionsByPath(pathQuery: string): FunctionEntity[] {
    return this.pathSearch?.getFunctionsByPath(pathQuery) || [];
  }

  // ==================== CALL GRAPH ====================

  /**
   * Получить вызовы функции (куда вызывает)
   */
  getCalls(functionId: FunctionId | string | number): CallEdgeWithMeta[] {
    return this.callGraph?.getCalls(functionId) || [];
  }

  /**
   * Получить вызывающие функции (кто вызывает)
   */
  getCallers(functionId: FunctionId | string | number): CallerEdgeWithMeta[] {
    return this.callGraph?.getCallers(functionId) || [];
  }

  /**
   * Проверить, вызывает ли функция другую
   */
  calls(functionId: FunctionId | string | number, targetId: FunctionId | string | number): boolean {
    return this.callGraph?.calls(functionId, targetId) || false;
  }

  /**
   * Получить все кросс-модульные вызовы
   */
  getCrossModuleCalls(): CrossModuleCall[] {
    return this.callGraph?.getCrossModuleCalls() || [];
  }

  /**
   * Получить статистику графа вызовов
   */
  getCallGraphStats(): { totalEdges: number; uniqueCallers: number; uniqueCallees: number } {
    return this.callGraph?.getStats() || { totalEdges: 0, uniqueCallers: 0, uniqueCallees: 0 };
  }

  /**
   * Получить все ребра графа вызовов
   */
  getAllCallEdges(): CallEdge[] {
    return this.callGraph?.getEdges() || [];
  }

  // ==================== IMPORT GRAPH ====================

  /**
   * Получить импорты функции
   */
  getImports(functionId: FunctionId | string | number): ImportEdgeWithMeta[] {
    return this.importGraph?.getImports(functionId) || [];
  }

  /**
   * Получить импортеры функции
   */
  getImporters(functionId: FunctionId | string | number): ImporterEdgeWithMeta[] {
    return this.importGraph?.getImporters(functionId) || [];
  }

  /**
   * Получить все ребра графа импортов
   */
  getAllImportEdges(): ImportEdge[] {
    return this.importGraph?.getEdges() || [];
  }

  // ==================== PATH FINDER ====================

  /**
   * Найти все пути между функциями (двусторонний BFS)
   */
  findAllPaths(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    options: PathOptions = {}
  ): FunctionId[][] {
    const { maxDepth = 20, maxPaths = 1000 } = options;
    const paths = this.pathFinder?.findAllPaths(fromId, toId, maxDepth) || [];
    return paths.slice(0, maxPaths);
  }

  /**
   * Найти все пути (DFS)
   */
  findAllPathsDFS(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    options: PathOptions = {}
  ): FunctionId[][] {
    const { maxDepth = 20, maxPaths = 1000 } = options;
    const paths = this.pathFinder?.findAllPathsDFS(fromId, toId, maxDepth) || [];
    return paths.slice(0, maxPaths);
  }

  /**
   * Найти кратчайший путь (BFS)
   */
  findShortestPath(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number
  ): FunctionId[] | null {
    return this.pathFinder?.findShortestPath(fromId, toId) || null;
  }

  /**
   * Проверить достижимость
   */
  isReachable(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = 20
  ): boolean {
    return this.pathFinder?.isReachable(fromId, toId, maxDepth) || false;
  }

  /**
   * Получить пути с именами функций
   */
  getPathsWithNames(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    options: PathOptions = {}
  ): PathResult[] {
    const { maxDepth = 20, maxPaths = 1000 } = options;
    const results = this.pathFinder?.getPathsWithNames(fromId, toId, maxDepth) || [];
    return results.slice(0, maxPaths);
  }

  /**
   * Получить статистику путей
   */
  getPathStatistics(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = 20
  ): PathStatistics {
    return (
      this.pathFinder?.getPathStatistics(fromId, toId, maxDepth) || {
        reachable: false,
        totalPaths: 0,
        shortest: null,
        longest: null,
        averageLength: 0,
      }
    );
  }

  /**
   * Получить достижимые функции
   */
  getReachableFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = 10
  ): FunctionEntity[] {
    if (!this.callGraph || !this.functionManager) return [];

    const normalizedId = this.idNormalizer!.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];
    const adjacency = this.callGraph.adjacency;

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
      .map(id => this.functionManager!.get(id))
      .filter((fn): fn is FunctionEntity => fn !== null);
  }

  /**
   * Получить функции, достигающие целевую
   */
  getReachingFunctions(
    functionId: FunctionId | string | number,
    maxDepth: number = 10
  ): FunctionEntity[] {
    if (!this.callGraph || !this.functionManager) return [];

    const normalizedId = this.idNormalizer!.normalize(functionId);
    const result = new Set<FunctionId>();
    const queue: [FunctionId, number][] = [[normalizedId, 0]];
    const reverseAdjacency = this.callGraph.reverseAdjacency;

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
      .map(id => this.functionManager!.get(id))
      .filter((fn): fn is FunctionEntity => fn !== null);
  }

  // ==================== ANALYSIS ====================

  /**
   * Анализ мёртвого кода
   */
  getDeadCode(): DeadCodeResult {
    return (
      this.deadCodeAnalyzer?.analyze() || {
        total: 0,
        percentage: '0',
        functions: [],
      }
    );
  }

  /**
   * Анализ изолированных функций
   */
  getIsolatedFunctions(): IsolationResult {
    return (
      this.isolationAnalyzer?.analyze() || {
        total: 0,
        percentage: '0',
        functions: [],
      }
    );
  }

  /**
   * Получить статистику
   */
  getStats(): ReportStats {
    return this.dataLoader?.getData()?.st || ({} as ReportStats);
  }

  /**
   * Получить детальную статистику
   */
  getDetailedStats(): DetailedStats {
    return (
      this.statistics?.getDetailedStats() || {
        summary: {} as ReportStats,
        functions: { total: 0, byModule: {}, byFile: {} },
        calls: { total: 0, byType: {}, crossModule: 0 },
        imports: { total: 0, byType: {} },
        modules: { total: 0, withFunctions: 0 },
        files: { total: 0, withFunctions: 0 },
      }
    );
  }

  /**
   * Получить самые вызываемые функции
   */
  getMostCalled(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    if (!this.callGraph || !this.functionManager) return [];

    const count = new Map<FunctionId, number>();
    const edges = this.callGraph.getEdges();

    for (const [, to] of edges) {
      const toId = this.idNormalizer!.normalize(to);
      if (this.functionManager.has(toId)) {
        count.set(toId, (count.get(toId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({ id, calls, function: this.functionManager!.get(id) }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить функции, которые больше всего вызывают
   */
  getMostCalling(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    if (!this.callGraph || !this.functionManager) return [];

    const count = new Map<FunctionId, number>();
    const edges = this.callGraph.getEdges();

    for (const [from] of edges) {
      const fromId = this.idNormalizer!.normalize(from);
      if (this.functionManager.has(fromId)) {
        count.set(fromId, (count.get(fromId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({ id, calls, function: this.functionManager!.get(id) }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить топ функций по сложности
   */
  getMostComplex(limit: number = 10): FunctionEntity[] {
    const functions = this.getAllFunctions();
    return functions
      .sort((a, b) => (b.flags?.length || 0) - (a.flags?.length || 0))
      .slice(0, limit);
  }

  /**
   * Получить функции с наибольшим количеством замыканий
   */
  getFunctionsWithMostClosures(
    limit: number = 10
  ): { function: FunctionEntity; closures: number }[] {
    const closures = this.getClosures();
    const map = new Map<FunctionId, number>();

    for (const [fnId, , , count] of closures) {
      const id = this.idNormalizer!.normalize(fnId);
      map.set(id, (map.get(id) || 0) + (count || 1));
    }

    return Array.from(map.entries())
      .map(([id, count]) => ({
        function: this.getFunction(id),
        closures: count,
      }))
      .filter(item => item.function !== null)
      .map(item => item as { function: FunctionEntity; closures: number })
      .sort((a, b) => b.closures - a.closures)
      .slice(0, limit);
  }

  // ==================== INTERSECTION ====================

  /**
   * Найти пересечение двух множеств
   */
  findIntersection<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): T[] {
    return this.intersectionAnalyzer?.findIntersection(set1, set2) || [];
  }

  /**
   * Найти общие зависимости двух функций
   */
  findCommonDependencies(
    fnId1: FunctionId | string | number,
    fnId2: FunctionId | string | number
  ): FunctionEntity[] {
    return this.intersectionAnalyzer?.findCommonDependencies(fnId1, fnId2) || [];
  }

  /**
   * Найти общих вызывающих для двух функций
   */
  findCommonCallers(
    fnId1: FunctionId | string | number,
    fnId2: FunctionId | string | number
  ): FunctionEntity[] {
    return this.intersectionAnalyzer?.findCommonCallers(fnId1, fnId2) || [];
  }

  // ==================== EXPORT ====================

  /**
   * Экспортировать данные в JSON
   */
  exportJSON(options: ExportOptions = {}): string {
    const { pretty = true } = options;
    const data = this.getRawData();
    if (!data) return '{}';
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Экспортировать аналитику
   */
  exportAnalytics(): Analytics {
    return {
      stats: this.getDetailedStats(),
      deadCode: this.getDeadCode(),
      isolated: this.getIsolatedFunctions(),
      mostCalled: this.getMostCalled(10),
      mostCalling: this.getMostCalling(10),
      externalLibraries: this.getExternalLibraries(),
      dynamicImports: this.getDynamicImports(),
      closures: this.getClosures(),
      asyncFunctions: this.getAsyncFunctions(),
      modules: this.getAllModules(),
      files: this.getAllFiles(),
      constants: this.getAllConstants(),
    };
  }

  /**
   * Экспортировать пути в DOT
   */
  getPathsAsDOT(
    fromId: FunctionId | string | number,
    toId: FunctionId | string | number,
    maxDepth: number = 20
  ): string {
    const paths = this.pathFinder?.findAllPaths(fromId, toId, maxDepth) || [];
    return this.dotExporter?.exportPaths(paths) || '';
  }

  /**
   * Экспортировать граф вызовов в DOT
   */
  exportCallGraphAsDOT(): string {
    if (!this.callGraph) return '';
    return this.dotExporter?.exportCallGraph(this.callGraph) || '';
  }

  /**
   * Экспортировать граф импортов в DOT
   */
  exportImportGraphAsDOT(): string {
    if (!this.importGraph) return '';
    return this.dotExporter?.exportImportGraph(this.importGraph) || '';
  }

  // ==================== EXTERNAL DATA ====================

  /**
   * Получить внешние библиотеки
   */
  getExternalLibraries(): {
    name: string;
    version: string;
    type: number;
    count: number;
    files: FileId[];
  }[] {
    const data = this.getRawData();
    if (!data?.gr?.ext) return [];

    const libs: Record<
      string,
      { name: string; version: string; type: number; count: number; files: FileId[] }
    > = {};
    for (const [file, name, version, type, count] of data.gr.ext) {
      if (!libs[name]) {
        libs[name] = { name, version, type, count: 0, files: [] };
      }
      libs[name].count += count || 1;
      if (!libs[name].files.includes(file as FileId)) {
        libs[name].files.push(file as FileId);
      }
    }

    return Object.values(libs).sort((a, b) => b.count - a.count);
  }

  /**
   * Получить динамические импорты
   */
  getDynamicImports(): DynamicImport[] {
    const data = this.getRawData();
    return data?.gr?.di || [];
  }

  /**
   * Получить замыкания
   */
  getClosures(): Closure[] {
    const data = this.getRawData();
    return data?.gr?.closures || [];
  }

  /**
   * Получить асинхронные функции
   */
  getAsyncFunctions(): AsyncChain[] {
    const data = this.getRawData();
    return data?.gr?.async || [];
  }

  /**
   * Получить конфиг референсы
   */
  getConfigRefs(): { file: FileId; line: number; key: string; type: string }[] {
    const data = this.getRawData();
    if (!data?.gr?.cfg) return [];
    return data.gr.cfg.map(([file, line, key, type]) => ({
      file: file as FileId,
      line,
      key,
      type,
    }));
  }

  /**
   * Получить Vue шаблоны
   */
  getVueTemplates(): { file: FileId; line: number; name: string; type: string }[] {
    const data = this.getRawData();
    if (!data?.gr?.vt) return [];
    return data.gr.vt.map(([file, line, name, type]) => ({
      file: file as FileId,
      line,
      name,
      type,
    }));
  }

  // ==================== CACHE ====================

  /**
   * Получить статистику кеша
   */
  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate:
        this.cacheHits + this.cacheMisses > 0
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0,
      totalHits: this.cacheHits,
      totalMisses: this.cacheMisses,
    };
  }

  /**
   * Очистить кеш
   */
  clearCache(): this {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.pathFinder?.clearCache();
    return this;
  }

  /**
   * Инвалидировать кеш по ключу
   */
  invalidateCache(key: string): this {
    this.cache.delete(key);
    return this;
  }

  // ==================== UTILITY ====================

  /**
   * Получить контекст API для отладки
   */
  getDebugInfo(): {
    isLoaded: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    cacheSize: number;
    functionCount: number;
    moduleCount: number;
    fileCount: number;
    constantCount: number;
    callCount: number;
    importCount: number;
  } {
    const data = this.getRawData();
    return {
      isLoaded: this.isLoaded(),
      isLoading: AstAnalyzerAPI.isLoading,
      isInitialized: AstAnalyzerAPI.isInitialized,
      cacheSize: this.cache.size,
      functionCount: this.getFunctionCount(),
      moduleCount: this.getModuleCount(),
      fileCount: this.getFileCount(),
      constantCount: this.getConstantCount(),
      callCount: data?.gr?.c?.length || 0,
      importCount: data?.gr?.i?.length || 0,
    };
  }

  /**
   * Получить краткий отчет
   */
  getSummary(): {
    version: string;
    timestamp: string;
    stats: ReportStats;
    deadCode: DeadCodeResult;
    isolated: IsolationResult;
  } {
    return {
      version: this.getVersion() || 'unknown',
      timestamp: this.getTimestamp() || new Date().toISOString(),
      stats: this.getStats(),
      deadCode: this.getDeadCode(),
      isolated: this.getIsolatedFunctions(),
    };
  }

  /**
   * Получить полный отчет по функции
   */
  getFunctionReport(functionId: FunctionId | string | number): {
    function: FunctionEntity | null;
    calls: CallEdgeWithMeta[];
    callers: CallerEdgeWithMeta[];
    imports: ImportEdgeWithMeta[];
    importers: ImporterEdgeWithMeta[];
    reachable: FunctionEntity[];
    reaching: FunctionEntity[];
    stats: {
      totalCalls: number;
      totalCallers: number;
      totalImports: number;
      totalImporters: number;
      reachableCount: number;
      reachingCount: number;
    };
  } {
    const fn = this.getFunction(functionId);
    const calls = this.getCalls(functionId);
    const callers = this.getCallers(functionId);
    const imports = this.getImports(functionId);
    const importers = this.getImporters(functionId);
    const reachable = this.getReachableFunctions(functionId);
    const reaching = this.getReachingFunctions(functionId);

    return {
      function: fn,
      calls,
      callers,
      imports,
      importers,
      reachable,
      reaching,
      stats: {
        totalCalls: calls.length,
        totalCallers: callers.length,
        totalImports: imports.length,
        totalImporters: importers.length,
        reachableCount: reachable.length,
        reachingCount: reaching.length,
      },
    };
  }

  // ==================== RESET ====================

  /**
   * Сбросить состояние API
   */
  reset(): this {
    this.dataLoader = null;
    this.idNormalizer = null;
    this.callGraph = null;
    this.importGraph = null;
    this.nameSearch = null;
    this.pathSearch = null;
    this.deadCodeAnalyzer = null;
    this.isolationAnalyzer = null;
    this.statistics = null;
    this.intersectionAnalyzer = null;
    this.functionManager = null;
    this.moduleManager = null;
    this.fileManager = null;
    this.constantManager = null;
    this.dotExporter = null;
    this.pathFinder = null;
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    AstAnalyzerAPI.isLoading = false;
    AstAnalyzerAPI.isInitialized = false;
    return this;
  }

  /**
   * Перезагрузить данные
   */
  reload(data?: ASTReport): this {
    const currentData = data || this.getRawData();
    if (!currentData) {
      throw new Error('Нет данных для перезагрузки');
    }
    this.reset();
    return this.load(currentData);
  }
}

// ==================== ЭКСПОРТ СИНГЛТОНА ====================

/**
 * Экспорт синглтона
 */
const instance = AstAnalyzerAPI.getInstance();

export default instance;
