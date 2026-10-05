// src/analysis/Statistics.ts

/**
 * Статистика по данным AST-отчета
 *
 * @module analysis/Statistics
 * @description Собирает детальную статистику по функциям, вызовам, модулям и файлам
 *
 * @example
 * ```typescript
 * import { Statistics } from './Statistics.js';
 *
 * const stats = new Statistics(data, functionMap, callGraph, importGraph);
 * const detailed = stats.getDetailedStats();
 * console.log(detailed.functions.total);
 * console.log(detailed.calls.byType);
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  ModuleId,
  FileId,
  CallEdge,
  ImportEdge,
  ReportStats,
  DetailedStats,
  ASTReport,
} from '../types/index.js';
import type { CallGraph } from '../graph/CallGraph.js';
import type { ImportGraph } from '../graph/ImportGraph.js';

/**
 * Опции для статистики
 */
export interface StatisticsOptions {
  /**
   * Включить детальную статистику по модулям
   * @default true
   */
  includeModuleStats?: boolean;

  /**
   * Включить детальную статистику по файлам
   * @default true
   */
  includeFileStats?: boolean;

  /**
   * Включить статистику по типам вызовов
   * @default true
   */
  includeCallTypeStats?: boolean;

  /**
   * Включить статистику по типам импортов
   * @default true
   */
  includeImportTypeStats?: boolean;
}

/**
 * Статистика по функциям
 */
export interface FunctionStats {
  total: number;
  exported: number;
  async: number;
  withCalls: number;
  called: number;
  isolated: number;
  withClosures: number;
  averageCalls: number;
  maxCalls: number;
  totalCalls: number;
}

/**
 * Статистика по вызовам
 */
export interface CallStats {
  total: number;
  byType: Record<string, number>;
  crossModule: number;
  internal: number;
  external: number;
}

/**
 * Статистика по модулям
 */
export interface ModuleStatsSummary {
  total: number;
  withFunctions: number;
  averageFunctions: number;
  maxFunctions: number;
  minFunctions: number;
}

/**
 * Статистика по файлам
 */
export interface FileStatsSummary {
  total: number;
  withFunctions: number;
  averageFunctions: number;
  maxFunctions: number;
  minFunctions: number;
}

/**
 * Полная статистика
 */
export interface FullStatistics {
  summary: ReportStats;
  functions: FunctionStats;
  calls: CallStats;
  imports: {
    total: number;
    byType: Record<string, number>;
  };
  modules: ModuleStatsSummary;
  files: FileStatsSummary;
  byModule: Record<ModuleId, number>;
  byFile: Record<FileId, number>;
  byFlag: Record<string, number>;
  topCalled: {
    id: FunctionId;
    name: string;
    calls: number;
  }[];
  topCalling: {
    id: FunctionId;
    name: string;
    calls: number;
  }[];
}

export class Statistics {
  private data: ASTReport;
  private functionMap: Map<FunctionId, FunctionEntity>;
  private callGraph: CallGraph | null;
  private importGraph: ImportGraph | null;

  constructor(
    data: ASTReport,
    functionMap: Map<FunctionId, FunctionEntity>,
    callGraph: CallGraph | null = null,
    importGraph: ImportGraph | null = null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: StatisticsOptions = {}
  ) {
    this.data = data;
    this.functionMap = functionMap;
    this.callGraph = callGraph;
    this.importGraph = importGraph;
  }

  /**
   * Получить детальную статистику
   */
  getDetailedStats(): DetailedStats {
    const st = this.data.st || ({} as ReportStats);
    const functions = Array.from(this.functionMap.values());
    const calls = this.callGraph?.getEdges() || [];
    const imports = this.importGraph?.getEdges() || [];

    const byModule: Record<string, number> = {};
    const byFile: Record<string, number> = {};

    for (const fn of functions) {
      byModule[fn.module] = (byModule[fn.module] || 0) + 1;
      byFile[fn.file] = (byFile[fn.file] || 0) + 1;
    }

    const byCallType: Record<string, number> = {};
    for (const [, , , type] of calls) {
      byCallType[type] = (byCallType[type] || 0) + 1;
    }

    const byImportType: Record<string, number> = {};
    for (const [, , , type] of imports) {
      byImportType[type] = (byImportType[type] || 0) + 1;
    }

    const modules = Array.from(new Set(functions.map(fn => fn.moduleId)));
    const files = Array.from(new Set(functions.map(fn => fn.fileId)));

    return {
      summary: st,
      functions: {
        total: functions.length,
        byModule,
        byFile,
      },
      calls: {
        total: calls.length,
        byType: byCallType,
        crossModule: this.callGraph?.getCrossModuleCalls().length || 0,
      },
      imports: {
        total: imports.length,
        byType: byImportType,
      },
      modules: {
        total: modules.length,
        withFunctions: modules.length,
      },
      files: {
        total: files.length,
        withFunctions: files.length,
      },
    };
  }

  /**
   * Получить полную статистику
   */
  getFullStats(): FullStatistics {
    const functions = Array.from(this.functionMap.values());
    const calls = this.callGraph?.getEdges() || [];
    const imports = this.importGraph?.getEdges() || [];

    // Статистика по функциям
    const functionStats = this.calculateFunctionStats(functions, calls);

    // Статистика по вызовам
    const callStats = this.calculateCallStats(calls);

    // Статистика по модулям
    const moduleStats = this.calculateModuleStats(functions);

    // Статистика по файлам
    const fileStats = this.calculateFileStats(functions);

    // Группировка по модулям и файлам
    const byModule: Record<ModuleId, number> = {};
    const byFile: Record<FileId, number> = {};
    const byFlag: Record<string, number> = {};

    for (const fn of functions) {
      byModule[fn.moduleId] = (byModule[fn.moduleId] || 0) + 1;
      byFile[fn.fileId] = (byFile[fn.fileId] || 0) + 1;
      if (fn.flags) {
        for (const flag of fn.flags) {
          byFlag[flag] = (byFlag[flag] || 0) + 1;
        }
      }
    }

    // Топ вызываемых и вызывающих
    const topCalled = this.getTopCalled(functions, calls, 10);
    const topCalling = this.getTopCalling(functions, calls, 10);

    return {
      summary: this.data.st || ({} as ReportStats),
      functions: functionStats,
      calls: callStats,
      imports: {
        total: imports.length,
        byType: this.getImportTypeStats(imports),
      },
      modules: moduleStats,
      files: fileStats,
      byModule,
      byFile,
      byFlag,
      topCalled,
      topCalling,
    };
  }

  /**
   * Рассчитать статистику по функциям
   */
  private calculateFunctionStats(functions: FunctionEntity[], calls: CallEdge[]): FunctionStats {
    const calledIds = new Set<FunctionId>();
    const callerIds = new Set<FunctionId>();
    const callCount = new Map<FunctionId, number>();

    for (const [from, to] of calls) {
      const fromId = from as FunctionId;
      const toId = to as FunctionId;
      calledIds.add(toId);
      callerIds.add(fromId);
      callCount.set(toId, (callCount.get(toId) || 0) + 1);
    }

    let totalCalls = 0;
    let maxCalls = 0;
    let exported = 0;
    let asyncCount = 0;
    let withClosures = 0;

    for (const fn of functions) {
      if (fn.flags && fn.flags.includes('e')) exported++;
      if (fn.flags && fn.flags.includes('a')) asyncCount++;
      if (fn.flags && fn.flags.includes('c')) withClosures++;

      const count = callCount.get(fn.id) || 0;
      totalCalls += count;
      if (count > maxCalls) maxCalls = count;
    }

    const withCalls = new Set(callerIds).size;
    const called = new Set(calledIds).size;
    const isolated = functions.filter(fn => !callerIds.has(fn.id) && !calledIds.has(fn.id)).length;

    return {
      total: functions.length,
      exported,
      async: asyncCount,
      withCalls,
      called,
      isolated,
      withClosures,
      averageCalls: functions.length > 0 ? totalCalls / functions.length : 0,
      maxCalls,
      totalCalls,
    };
  }

  /**
   * Рассчитать статистику по вызовам
   */
  private calculateCallStats(calls: CallEdge[]): CallStats {
    const byType: Record<string, number> = {};
    let crossModule = 0;
    let internal = 0;
    let external = 0;

    for (const [from, to, , type] of calls) {
      byType[type] = (byType[type] || 0) + 1;

      const fromFn = this.functionMap.get(from as FunctionId);
      const toFn = this.functionMap.get(to as FunctionId);

      if (fromFn && toFn) {
        if (fromFn.moduleId === toFn.moduleId) {
          internal++;
        } else {
          external++;
          crossModule++;
        }
      }
    }

    return {
      total: calls.length,
      byType,
      crossModule,
      internal,
      external,
    };
  }

  /**
   * Рассчитать статистику по модулям
   */
  private calculateModuleStats(functions: FunctionEntity[]): ModuleStatsSummary {
    const moduleMap = new Map<ModuleId, number>();

    for (const fn of functions) {
      moduleMap.set(fn.moduleId, (moduleMap.get(fn.moduleId) || 0) + 1);
    }

    const counts = Array.from(moduleMap.values());
    const total = moduleMap.size;

    return {
      total,
      withFunctions: counts.filter(c => c > 0).length,
      averageFunctions: total > 0 ? counts.reduce((a, b) => a + b, 0) / total : 0,
      maxFunctions: counts.length > 0 ? Math.max(...counts) : 0,
      minFunctions: counts.length > 0 ? Math.min(...counts) : 0,
    };
  }

  /**
   * Рассчитать статистику по файлам
   */
  private calculateFileStats(functions: FunctionEntity[]): FileStatsSummary {
    const fileMap = new Map<FileId, number>();

    for (const fn of functions) {
      fileMap.set(fn.fileId, (fileMap.get(fn.fileId) || 0) + 1);
    }

    const counts = Array.from(fileMap.values());
    const total = fileMap.size;

    return {
      total,
      withFunctions: counts.filter(c => c > 0).length,
      averageFunctions: total > 0 ? counts.reduce((a, b) => a + b, 0) / total : 0,
      maxFunctions: counts.length > 0 ? Math.max(...counts) : 0,
      minFunctions: counts.length > 0 ? Math.min(...counts) : 0,
    };
  }

  /**
   * Получить статистику по типам импортов
   */
  private getImportTypeStats(imports: ImportEdge[]): Record<string, number> {
    const byType: Record<string, number> = {};
    for (const [, , , type] of imports) {
      byType[type] = (byType[type] || 0) + 1;
    }
    return byType;
  }

  /**
   * Получить топ вызываемых функций
   */
  private getTopCalled(
    functions: FunctionEntity[],
    calls: CallEdge[],
    limit: number
  ): { id: FunctionId; name: string; calls: number }[] {
    const count = new Map<FunctionId, number>();

    for (const [, to] of calls) {
      const toId = to as FunctionId;
      count.set(toId, (count.get(toId) || 0) + 1);
    }

    const nameMap = new Map<FunctionId, string>();
    for (const fn of functions) {
      nameMap.set(fn.id, fn.name);
    }

    return Array.from(count.entries())
      .map(([id, callsCount]) => ({
        id,
        name: nameMap.get(id) || id,
        calls: callsCount,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить топ вызывающих функций
   */
  private getTopCalling(
    functions: FunctionEntity[],
    calls: CallEdge[],
    limit: number
  ): { id: FunctionId; name: string; calls: number }[] {
    const count = new Map<FunctionId, number>();

    for (const [from] of calls) {
      const fromId = from as FunctionId;
      count.set(fromId, (count.get(fromId) || 0) + 1);
    }

    const nameMap = new Map<FunctionId, string>();
    for (const fn of functions) {
      nameMap.set(fn.id, fn.name);
    }

    return Array.from(count.entries())
      .map(([id, callsCount]) => ({
        id,
        name: nameMap.get(id) || id,
        calls: callsCount,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить статистику по модулям (детальная)
   */
  getModuleStats(): Record<ModuleId, { count: number; functions: FunctionEntity[] }> {
    const result: Record<ModuleId, { count: number; functions: FunctionEntity[] }> = {};

    for (const fn of this.functionMap.values()) {
      if (!result[fn.moduleId]) {
        result[fn.moduleId] = { count: 0, functions: [] };
      }
      // Используем ! для указания, что значение точно существует
      // или сохраняем в переменную
      const entry = result[fn.moduleId]!;
      entry.count++;
      entry.functions.push(fn);
    }

    return result;
  }

  /**
   * Получить статистику по файлам (детальная)
   */
  getFileStats(): Record<FileId, { count: number; functions: FunctionEntity[] }> {
    const result: Record<FileId, { count: number; functions: FunctionEntity[] }> = {};

    for (const fn of this.functionMap.values()) {
      if (!result[fn.fileId]) {
        result[fn.fileId] = { count: 0, functions: [] };
      }
      // Используем ! для указания, что значение точно существует
      // или сохраняем в переменную
      const entry = result[fn.fileId]!;
      entry.count++;
      entry.functions.push(fn);
    }

    return result;
  }

  /**
   * Получить статистику по типам вызовов (детальная)
   */
  getCallTypeStats(): Record<string, { count: number; edges: CallEdge[] }> {
    const result: Record<string, { count: number; edges: CallEdge[] }> = {};
    const edges = this.callGraph?.getEdges() || [];

    for (const edge of edges) {
      const type = edge[3];
      if (!result[type]) {
        result[type] = { count: 0, edges: [] };
      }
      result[type].count++;
      result[type].edges.push(edge);
    }

    return result;
  }

  /**
   * Получить статистику по флагам функций
   */
  getFlagStats(): Record<string, number> {
    const result: Record<string, number> = {};

    for (const fn of this.functionMap.values()) {
      if (fn.flags) {
        for (const flag of fn.flags) {
          result[flag] = (result[flag] || 0) + 1;
        }
      }
    }

    return result;
  }

  /**
   * Получить краткую сводку
   */
  getSummary(): {
    totalFunctions: number;
    totalModules: number;
    totalFiles: number;
    totalCalls: number;
    totalImports: number;
    deadCode: number;
    isolated: number;
    asyncFunctions: number;
    closures: number;
  } {
    const functions = Array.from(this.functionMap.values());
    const calls = this.callGraph?.getEdges() || [];
    const imports = this.importGraph?.getEdges() || [];

    const modules = new Set(functions.map(fn => fn.moduleId));
    const files = new Set(functions.map(fn => fn.fileId));

    const calledIds = new Set<FunctionId>();
    const callerIds = new Set<FunctionId>();

    for (const [from, to] of calls) {
      calledIds.add(to as FunctionId);
      callerIds.add(from as FunctionId);
    }

    const deadCode = functions.filter(fn => !calledIds.has(fn.id)).length;
    const isolated = functions.filter(fn => !callerIds.has(fn.id) && !calledIds.has(fn.id)).length;
    const asyncFunctions = functions.filter(fn => fn.flags && fn.flags.includes('a')).length;
    const closures = functions.filter(fn => fn.flags && fn.flags.includes('c')).length;

    return {
      totalFunctions: functions.length,
      totalModules: modules.size,
      totalFiles: files.size,
      totalCalls: calls.length,
      totalImports: imports.length,
      deadCode,
      isolated,
      asyncFunctions,
      closures,
    };
  }

  /**
   * Экспортировать статистику в JSON
   */
  exportJSON(pretty: boolean = true): string {
    const data = {
      summary: this.getSummary(),
      full: this.getFullStats(),
      detailed: this.getDetailedStats(),
      modules: this.getModuleStats(),
      files: this.getFileStats(),
      callTypes: this.getCallTypeStats(),
      flags: this.getFlagStats(),
    };

    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Экспортировать статистику в CSV
   */
  exportCSV(): string {
    const lines: string[] = [];

    // Заголовки
    lines.push('Metric,Value');

    // Данные
    const summary = this.getSummary();
    lines.push(`Total Functions,${summary.totalFunctions}`);
    lines.push(`Total Modules,${summary.totalModules}`);
    lines.push(`Total Files,${summary.totalFiles}`);
    lines.push(`Total Calls,${summary.totalCalls}`);
    lines.push(`Total Imports,${summary.totalImports}`);
    lines.push(`Dead Code,${summary.deadCode}`);
    lines.push(`Isolated Functions,${summary.isolated}`);
    lines.push(`Async Functions,${summary.asyncFunctions}`);
    lines.push(`Closures,${summary.closures}`);

    return lines.join('\n');
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать экземпляр Statistics с настройками по умолчанию
 */
export function createDefaultStatistics(
  data: ASTReport,
  functionMap: Map<FunctionId, FunctionEntity>
): Statistics {
  return new Statistics(data, functionMap, null, null);
}

/**
 * Создать экземпляр Statistics с графами
 */
export function createFullStatistics(
  data: ASTReport,
  functionMap: Map<FunctionId, FunctionEntity>,
  callGraph: CallGraph,
  importGraph: ImportGraph
): Statistics {
  return new Statistics(data, functionMap, callGraph, importGraph);
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default Statistics;
