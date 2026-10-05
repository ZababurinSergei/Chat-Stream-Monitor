// src/export/JSONExporter.ts

/**
 * JSON Экспортер для AST отчета
 *
 * @module export/JSONExporter
 * @description Экспортирует данные анализа в различные JSON форматы
 *
 * @example
 * ```typescript
 * import { JSONExporter } from './JSONExporter.js';
 *
 * const exporter = new JSONExporter(data);
 *
 * // Экспорт в различных форматах
 * const full = exporter.exportFull();
 * const compact = exporter.exportCompact();
 * const analytics = exporter.exportAnalytics();
 * ```
 */

import type {
  ASTReport,
  FunctionEntity,
  ModuleEntity,
  FileEntity,
  ConstantEntity,
  ReportStats,
  DetailedStats,
  Analytics,
  DeadCodeResult,
  IsolationResult,
  CrossModuleCall,
  DynamicImport,
  Closure,
  AsyncChain,
  FunctionId,
  ModuleId,
  FileId,
  CallType,
} from '../types/index.js';

/**
 * Опции для JSON экспортера
 */
export interface JSONExporterOptions {
  /**
   * Форматирование JSON (отступы)
   * @default 2
   */
  indentSize?: number;

  /**
   * Сортировка ключей
   * @default true
   */
  sortKeys?: boolean;

  /**
   * Включить статистику
   * @default true
   */
  includeStats?: boolean;

  /**
   * Включить метаданные
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Включить временную метку
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Минифицировать вывод
   * @default false
   */
  minify?: boolean;

  /**
   * Максимальная глубина для путей
   * @default 20
   */
  maxPathDepth?: number;

  /**
   * Максимальное количество результатов
   * @default 1000
   */
  maxResults?: number;
}

/**
 * Конфигурация экспорта
 */
export interface ExportConfig {
  /**
   * Формат экспорта
   */
  format: 'full' | 'compact' | 'analytics' | 'summary' | 'functions' | 'modules' | 'graph';

  /**
   * Фильтры для экспорта
   */
  filters?: {
    moduleIds?: ModuleId[];
    fileIds?: FileId[];
    functionIds?: FunctionId[];
    exportOnly?: boolean;
    hasCalls?: boolean;
    minComplexity?: number;
  };

  /**
   * Включаемые разделы
   */
  sections?: {
    functions?: boolean;
    modules?: boolean;
    files?: boolean;
    constants?: boolean;
    calls?: boolean;
    imports?: boolean;
    paths?: boolean;
    stats?: boolean;
    metadata?: boolean;
  };
}

/**
 * Метаданные экспорта
 */
export interface ExportMetadata {
  version: string;
  timestamp: string;
  exporter: string;
  options: JSONExporterOptions;
  totalFunctions: number;
  totalModules: number;
  totalFiles: number;
  totalConstants: number;
  totalCalls: number;
  totalImports: number;
}

/**
 * Результат экспорта
 */
export interface ExportResult {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: ExportMetadata;
  stats?: {
    functions: number;
    modules: number;
    files: number;
    constants: number;
    calls: number;
    imports: number;
  };
}

export class JSONExporter {
  private data: ASTReport;
  private options: Required<JSONExporterOptions>;
  private metadata: ExportMetadata | null = null;

  constructor(data: ASTReport, options: JSONExporterOptions = {}) {
    this.data = data;
    this.options = {
      indentSize: options.indentSize ?? 2,
      sortKeys: options.sortKeys ?? true,
      includeStats: options.includeStats ?? true,
      includeMetadata: options.includeMetadata ?? true,
      includeTimestamp: options.includeTimestamp ?? true,
      minify: options.minify ?? false,
      maxPathDepth: options.maxPathDepth ?? 20,
      maxResults: options.maxResults ?? 1000,
    };
  }

  /**
   * Основной метод экспорта
   */
  export(config: ExportConfig): ExportResult {
    try {
      let data: unknown;

      switch (config.format) {
        case 'full':
          data = this.exportFull();
          break;
        case 'compact':
          data = this.exportCompact();
          break;
        case 'analytics':
          data = this.exportAnalytics();
          break;
        case 'summary':
          data = this.exportSummary();
          break;
        case 'functions':
          data = this.exportFunctions(config.filters);
          break;
        case 'modules':
          data = this.exportModules(config.filters);
          break;
        case 'graph':
          data = this.exportGraph(config.filters);
          break;
        default:
          throw new Error(`Unknown format: ${config.format}`);
      }

      const json = this.stringify(data);
      const metadata = this.buildMetadata();

      return {
        success: true,
        data: json,
        metadata,
        stats: this.buildStats(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Экспорт полных данных
   */
  exportFull(): ASTReport {
    return this.data;
  }

  /**
   * Экспорт компактного отчета
   */
  exportCompact(): Partial<ASTReport> {
    const result: Partial<ASTReport> = {
      v: this.data.v,
      ts: this.data.ts,
      r: this.data.r,
      mi: this.data.mi,
      fl: this.data.fl,
    };

    // Ограничиваем количество функций
    if (this.data.fns) {
      result.fns = this.data.fns.slice(0, this.options.maxResults);
    }

    // Ограничиваем количество констант
    if (this.data.cn) {
      result.cn = this.data.cn.slice(0, this.options.maxResults);
    }

    // Компактный граф
    if (this.data.gr) {
      result.gr = {
        c: (this.data.gr.c || []).slice(0, this.options.maxResults),
        i: (this.data.gr.i || []).slice(0, this.options.maxResults),
        e: (this.data.gr.e || []).slice(0, this.options.maxResults),
        h: (this.data.gr.h || []).slice(0, this.options.maxResults),
        td: (this.data.gr.td || []).slice(0, this.options.maxResults),
        re: (this.data.gr.re || []).slice(0, this.options.maxResults),
        uc: (this.data.gr.uc || []).slice(0, this.options.maxResults),
        cd: (this.data.gr.cd || []).slice(0, this.options.maxResults),
        ce: (this.data.gr.ce || []).slice(0, this.options.maxResults),
        di: (this.data.gr.di || []).slice(0, this.options.maxResults),
        cfg: (this.data.gr.cfg || []).slice(0, this.options.maxResults),
        ext: (this.data.gr.ext || []).slice(0, this.options.maxResults),
        vt: (this.data.gr.vt || []).slice(0, this.options.maxResults),
        async: (this.data.gr.async || []).slice(0, this.options.maxResults),
        closures: (this.data.gr.closures || []).slice(0, this.options.maxResults),
        reflection: (this.data.gr.reflection || []).slice(0, this.options.maxResults),
        types: (this.data.gr.types || []).slice(0, this.options.maxResults),
      };
    }

    // Статистика
    if (this.options.includeStats) {
      result.st = this.data.st;
    }

    return result;
  }

  /**
   * Экспорт аналитики
   */
  exportAnalytics(): Analytics {
    const stats = this.getDetailedStats();
    const deadCode = this.getDeadCode();
    const isolated = this.getIsolatedFunctions();

    return {
      stats,
      deadCode,
      isolated,
      mostCalled: this.getMostCalled(10),
      mostCalling: this.getMostCalling(10),
      externalLibraries: this.getExternalLibraries(),
      dynamicImports: this.getDynamicImports(),
      closures: this.getClosures(),
      asyncFunctions: this.getAsyncFunctions(),
      modules: this.getModules(),
      files: this.getFiles(),
      constants: this.getConstants(),
    };
  }

  /**
   * Экспорт суммарного отчета
   */
  exportSummary(): {
    metadata: ExportMetadata;
    stats: ReportStats;
    summary: {
      totalFunctions: number;
      totalModules: number;
      totalFiles: number;
      totalConstants: number;
      totalCalls: number;
      totalImports: number;
      deadCodePercentage: string;
      isolatedPercentage: string;
      modulesWithFunctions: number;
      filesWithFunctions: number;
    };
    topFunctions: {
      mostCalled: { id: FunctionId; name: string; calls: number }[];
      mostCalling: { id: FunctionId; name: string; calls: number }[];
    };
    warnings: string[];
  } {
    const stats = this.data.st || ({} as ReportStats);
    const deadCode = this.getDeadCode();
    const isolated = this.getIsolatedFunctions();
    const mostCalled = this.getMostCalled(5);
    const mostCalling = this.getMostCalling(5);

    const warnings: string[] = [];

    if (deadCode.total > stats.tf * 0.5) {
      warnings.push(`Много мёртвого кода: ${deadCode.percentage}%`);
    }

    if (isolated.total > stats.tf * 0.3) {
      warnings.push(`Много изолированных функций: ${isolated.percentage}%`);
    }

    return {
      metadata: this.buildMetadata(),
      stats,
      summary: {
        totalFunctions: stats.tf || 0,
        totalModules: stats.tm || 0,
        totalFiles: stats.tfils || 0,
        totalConstants: stats.tcn || 0,
        totalCalls: stats.tc || 0,
        totalImports: stats.ti || 0,
        deadCodePercentage: deadCode.percentage,
        isolatedPercentage: isolated.percentage,
        modulesWithFunctions: stats.modulesWithFunctions || 0,
        filesWithFunctions: stats.filesWithFunctions || 0,
      },
      topFunctions: {
        mostCalled: mostCalled.map(item => ({
          id: item.id,
          name: item.function?.name || item.id,
          calls: item.calls,
        })),
        mostCalling: mostCalling.map(item => ({
          id: item.id,
          name: item.function?.name || item.id,
          calls: item.calls,
        })),
      },
      warnings,
    };
  }

  /**
   * Экспорт только функций
   */
  exportFunctions(filters?: ExportConfig['filters']): {
    functions: FunctionEntity[];
    total: number;
    filtered: number;
    filters: ExportConfig['filters'];
  } {
    const functions = this.extractFunctions(filters);
    return {
      functions: functions.slice(0, this.options.maxResults),
      total: this.data.fns?.length || 0,
      filtered: functions.length,
      filters: filters || {},
    };
  }

  /**
   * Экспорт только модулей
   */
  exportModules(filters?: ExportConfig['filters']): {
    modules: ModuleEntity[];
    total: number;
    filtered: number;
    filters: ExportConfig['filters'];
  } {
    const modules = this.extractModules(filters);
    return {
      modules: modules.slice(0, this.options.maxResults),
      total: Object.keys(this.data.mi || {}).length,
      filtered: modules.length,
      filters: filters || {},
    };
  }

  /**
   * Экспорт графа
   */
  exportGraph(filters?: ExportConfig['filters']): {
    nodes: { id: string; type: string; name: string }[];
    edges: { source: string; target: string; type: string; line?: number }[];
    stats: {
      nodes: number;
      edges: number;
      types: Record<string, number>;
    };
  } {
    const nodes: { id: string; type: string; name: string }[] = [];
    const edges: { source: string; target: string; type: string; line?: number }[] = [];
    const edgeTypes: Record<string, number> = {};

    // Добавляем функции как узлы
    if (this.data.fns) {
      for (const [id, name] of this.data.fns) {
        if (filters?.functionIds && !filters.functionIds.includes(id)) {
          continue;
        }
        nodes.push({
          id,
          type: 'function',
          name,
        });
      }
    }

    // Добавляем вызовы как ребра
    if (this.data.gr?.c) {
      for (const [from, to, line, type] of this.data.gr.c) {
        if (filters?.functionIds) {
          if (!filters.functionIds.includes(from) || !filters.functionIds.includes(to)) {
            continue;
          }
        }
        edges.push({
          source: from,
          target: to,
          type,
          line,
        });
        edgeTypes[type] = (edgeTypes[type] || 0) + 1;
      }
    }

    return {
      nodes: nodes.slice(0, this.options.maxResults),
      edges: edges.slice(0, this.options.maxResults),
      stats: {
        nodes: nodes.length,
        edges: edges.length,
        types: edgeTypes,
      },
    };
  }

  /**
   * Экспорт в строку JSON
   */
  stringify(data: unknown): string {
    if (this.options.minify) {
      return JSON.stringify(data);
    }
    return JSON.stringify(data, this.getReplacer(), this.options.indentSize);
  }

  /**
   * Получить replacer для JSON.stringify - ИСПРАВЛЕНО
   */
  private getReplacer(): ((key: string, value: unknown) => unknown) | undefined {
    if (!this.options.sortKeys) {
      return undefined;
    }

    return (_key: string, value: unknown): unknown => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(value).sort();
        for (const k of keys) {
          sorted[k] = (value as Record<string, unknown>)[k];
        }
        return sorted;
      }
      return value;
    };
  }

  /**
   * Построить метаданные
   */
  private buildMetadata(): ExportMetadata {
    if (this.metadata) {
      return this.metadata;
    }

    this.metadata = {
      version: this.data.v || 'unknown',
      timestamp: this.options.includeTimestamp ? new Date().toISOString() : this.data.ts || '',
      exporter: 'JSONExporter',
      options: { ...this.options },
      totalFunctions: this.data.fns?.length || 0,
      totalModules: Object.keys(this.data.mi || {}).length,
      totalFiles: Object.keys(this.data.fl || {}).length,
      totalConstants: this.data.cn?.length || 0,
      totalCalls: this.data.gr?.c?.length || 0,
      totalImports: this.data.gr?.i?.length || 0,
    };

    return this.metadata;
  }

  /**
   * Построить статистику
   */
  private buildStats() {
    return {
      functions: this.data.fns?.length || 0,
      modules: Object.keys(this.data.mi || {}).length,
      files: Object.keys(this.data.fl || {}).length,
      constants: this.data.cn?.length || 0,
      calls: this.data.gr?.c?.length || 0,
      imports: this.data.gr?.i?.length || 0,
    };
  }

  /**
   * Получить детальную статистику - ИСПРАВЛЕНО
   */
  private getDetailedStats(): DetailedStats {
    const st = this.data.st || ({} as ReportStats);
    const functions = this.getFunctions();
    const calls = this.data.gr?.c || [];
    const imports = this.data.gr?.i || [];
    const modules = this.getModules();
    const files = this.getFiles();

    // Группировка функций по модулям и файлам
    const byModule: Record<string, number> = {};
    const byFile: Record<string, number> = {};
    for (const fn of functions) {
      byModule[fn.module] = (byModule[fn.module] || 0) + 1;
      byFile[fn.file] = (byFile[fn.file] || 0) + 1;
    }

    // Группировка вызовов по типам
    const byCallType: Record<string, number> = {};
    for (const call of calls) {
      const type = call[3]; // CallEdge[3] - тип
      byCallType[type] = (byCallType[type] || 0) + 1;
    }

    // Группировка импортов по типам
    const byImportType: Record<string, number> = {};
    for (const imp of imports) {
      const type = imp[3]; // ImportEdge[3] - тип
      byImportType[type] = (byImportType[type] || 0) + 1;
    }

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
        crossModule: this.getCrossModuleCalls().length,
      },
      imports: {
        total: imports.length,
        byType: byImportType,
      },
      modules: {
        total: modules.length,
        withFunctions: modules.filter(m => m.functions.length > 0).length,
      },
      files: {
        total: files.length,
        withFunctions: files.filter(f => this.getFunctionsByFile(f.id).length > 0).length,
      },
    };
  }

  /**
   * Получить мёртвый код
   */
  private getDeadCode(): DeadCodeResult {
    const allFunctions = this.getFunctions();
    const calledIds = new Set<FunctionId>();

    if (this.data.gr?.c) {
      for (const [, to] of this.data.gr.c) {
        calledIds.add(to as FunctionId);
      }
    }

    const dead = allFunctions.filter(fn => !calledIds.has(fn.id));

    return {
      total: dead.length,
      percentage:
        allFunctions.length > 0 ? ((dead.length / allFunctions.length) * 100).toFixed(1) : '0',
      functions: dead,
    };
  }

  /**
   * Получить изолированные функции
   */
  private getIsolatedFunctions(): IsolationResult {
    const allFunctions = this.getFunctions();
    const hasCallers = new Set<FunctionId>();
    const hasCalls = new Set<FunctionId>();

    if (this.data.gr?.c) {
      for (const [from, to] of this.data.gr.c) {
        hasCallers.add(to as FunctionId);
        hasCalls.add(from as FunctionId);
      }
    }

    const isolated = allFunctions.filter(fn => !hasCalls.has(fn.id) && !hasCallers.has(fn.id));

    return {
      total: isolated.length,
      percentage:
        allFunctions.length > 0 ? ((isolated.length / allFunctions.length) * 100).toFixed(1) : '0',
      functions: isolated,
    };
  }

  /**
   * Получить самые вызываемые функции
   */
  private getMostCalled(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    const count = new Map<FunctionId, number>();

    if (this.data.gr?.c) {
      for (const [, to] of this.data.gr.c) {
        const toId = to as FunctionId;
        count.set(toId, (count.get(toId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({
        id,
        calls,
        function: this.getFunction(id),
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить функции, которые больше всего вызывают
   */
  private getMostCalling(
    limit: number = 10
  ): { id: FunctionId; calls: number; function: FunctionEntity | null }[] {
    const count = new Map<FunctionId, number>();

    if (this.data.gr?.c) {
      for (const [from] of this.data.gr.c) {
        const fromId = from as FunctionId;
        count.set(fromId, (count.get(fromId) || 0) + 1);
      }
    }

    return Array.from(count.entries())
      .map(([id, calls]) => ({
        id,
        calls,
        function: this.getFunction(id),
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Получить внешние библиотеки
   */
  private getExternalLibraries(): {
    name: string;
    version: string;
    type: number;
    count: number;
    files: FileId[];
  }[] {
    const data = this.data;
    if (!data.gr?.ext) return [];

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
  private getDynamicImports(): DynamicImport[] {
    return this.data.gr?.di || [];
  }

  /**
   * Получить замыкания
   */
  private getClosures(): Closure[] {
    return this.data.gr?.closures || [];
  }

  /**
   * Получить асинхронные функции
   */
  private getAsyncFunctions(): AsyncChain[] {
    return this.data.gr?.async || [];
  }

  /**
   * Получить все функции
   */
  private getFunctions(): FunctionEntity[] {
    if (!this.data.fns) return [];

    return this.data.fns.map(([id, name, moduleId, fileId, line, flags]) => ({
      id,
      name,
      moduleId,
      fileId,
      line,
      flags,
      module: this.data.mi?.[moduleId] || moduleId,
      file: this.data.fl?.[fileId] || fileId,
      filePath: this.data.fl?.[fileId] || fileId,
    }));
  }

  /**
   * Получить функцию по ID
   */
  private getFunction(id: FunctionId): FunctionEntity | null {
    const fns = this.getFunctions();
    return fns.find(fn => fn.id === id) || null;
  }

  /**
   * Получить функции по файлу
   */
  private getFunctionsByFile(fileId: FileId): FunctionEntity[] {
    const fns = this.getFunctions();
    return fns.filter(fn => fn.fileId === fileId);
  }

  /**
   * Получить все модули
   */
  private getModules(): ModuleEntity[] {
    if (!this.data.mi) return [];

    const modules: ModuleEntity[] = [];
    for (const [id, name] of Object.entries(this.data.mi)) {
      const functions = this.getFunctions().filter(fn => fn.moduleId === id);
      modules.push({
        id: id as ModuleId,
        name,
        functions: functions.map(fn => fn.id),
        files: functions.map(fn => fn.fileId).filter((v, i, a) => a.indexOf(v) === i),
        calls: [],
        imports: [],
        functionCount: functions.length,
        fileCount: new Set(functions.map(fn => fn.fileId)).size,
      });
    }
    return modules;
  }

  /**
   * Получить все файлы
   */
  private getFiles(): FileEntity[] {
    if (!this.data.fl) return [];

    return Object.entries(this.data.fl).map(([id, path]) => ({
      id: id as FileId,
      path,
      name: path.split('/').pop() || path,
      extension: path.split('.').pop() || '',
      directory: path.split('/').slice(0, -1).join('/'),
    }));
  }

  /**
   * Получить все константы
   */
  private getConstants(): ConstantEntity[] {
    if (!this.data.cn) return [];

    return this.data.cn.map(([id, name, value, moduleId, fileId, line, flags]) => ({
      id,
      name,
      value,
      moduleId,
      fileId,
      line,
      flags,
      module: this.data.mi?.[moduleId] || moduleId,
      file: this.data.fl?.[fileId] || fileId,
    }));
  }

  /**
   * Получить кросс-модульные вызовы
   */
  private getCrossModuleCalls(): CrossModuleCall[] {
    const result: CrossModuleCall[] = [];
    const calls = this.data.gr?.c || [];

    for (const [from, to, line, type] of calls) {
      const fromFn = this.getFunction(from as FunctionId);
      const toFn = this.getFunction(to as FunctionId);
      if (!fromFn || !toFn) continue;
      if (fromFn.moduleId !== toFn.moduleId) {
        result.push({
          from: from as FunctionId,
          fromModule: fromFn.module,
          to: to as FunctionId,
          toModule: toFn.module,
          line,
          type: type as CallType,
        });
      }
    }
    return result;
  }

  /**
   * Извлечь функции с фильтрами
   */
  private extractFunctions(filters?: ExportConfig['filters']): FunctionEntity[] {
    let functions = this.getFunctions();

    if (filters) {
      if (filters.moduleIds) {
        functions = functions.filter(fn => filters.moduleIds!.includes(fn.moduleId));
      }
      if (filters.fileIds) {
        functions = functions.filter(fn => filters.fileIds!.includes(fn.fileId));
      }
      if (filters.functionIds) {
        functions = functions.filter(fn => filters.functionIds!.includes(fn.id));
      }
      if (filters.exportOnly) {
        functions = functions.filter(fn => fn.flags.includes('e'));
      }
      if (filters.hasCalls !== undefined) {
        const callers = new Set<FunctionId>();
        if (this.data.gr?.c) {
          for (const [from] of this.data.gr.c) {
            callers.add(from as FunctionId);
          }
        }
        functions = functions.filter(fn => filters.hasCalls! === callers.has(fn.id));
      }
    }

    return functions;
  }

  /**
   * Извлечь модули с фильтрами
   */
  private extractModules(filters?: ExportConfig['filters']): ModuleEntity[] {
    let modules = this.getModules();

    if (filters) {
      if (filters.moduleIds) {
        modules = modules.filter(mod => filters.moduleIds!.includes(mod.id));
      }
      if (filters.hasCalls !== undefined) {
        const modulesWithCalls = new Set<ModuleId>();
        const calls = this.data.gr?.c || [];
        for (const [from] of calls) {
          const fn = this.getFunction(from as FunctionId);
          if (fn) {
            modulesWithCalls.add(fn.moduleId);
          }
        }
        modules = modules.filter(mod => filters.hasCalls! === modulesWithCalls.has(mod.id));
      }
    }

    return modules;
  }

  /**
   * Группировка по ключу - УДАЛЕНО (используется прямой подсчет)
   */
  // private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
  //   const groups: Record<string, number> = {};
  //   for (const item of items) {
  //     const val = item && typeof item === 'object' ? String((item as any)[key] || 'unknown') : 'unknown';
  //     groups[val] = (groups[val] || 0) + 1;
  //   }
  //   return groups;
  // }

  /**
   * Обновить опции
   */
  updateOptions(options: Partial<JSONExporterOptions>): this {
    this.options = {
      ...this.options,
      ...options,
    };
    this.metadata = null; // Сброс метаданных
    return this;
  }

  /**
   * Получить опции
   */
  getOptions(): JSONExporterOptions {
    return { ...this.options };
  }

  /**
   * Получить метаданные
   */
  getMetadata(): ExportMetadata | null {
    return this.metadata ? { ...this.metadata } : null;
  }

  /**
   * Валидация данных перед экспортом
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.data) {
      errors.push('Нет данных для экспорта');
      return { valid: false, errors, warnings };
    }

    if (!this.data.v) {
      warnings.push('Отсутствует версия');
    }

    if (!this.data.fns || this.data.fns.length === 0) {
      warnings.push('Нет функций в данных');
    }

    if (!this.data.fl || Object.keys(this.data.fl).length === 0) {
      warnings.push('Нет файлов в данных');
    }

    if (!this.data.mi || Object.keys(this.data.mi).length === 0) {
      warnings.push('Нет модулей в данных');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Экспорт в файл (синхронный)
   */
  exportToFileSync(filePath: string, config: ExportConfig): ExportResult {
    const result = this.export(config);
    if (!result.success || !result.data) {
      return result;
    }

    try {
      const fs = require('fs');
      fs.writeFileSync(filePath, result.data, 'utf-8');
      return {
        ...result,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Экспорт в файл (асинхронный)
   */
  async exportToFile(filePath: string, config: ExportConfig): Promise<ExportResult> {
    const result = this.export(config);
    if (!result.success || !result.data) {
      return result;
    }

    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, result.data, 'utf-8');
      return {
        ...result,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать JSON экспортер с настройками по умолчанию
 */
export function createDefaultExporter(data: ASTReport): JSONExporter {
  return new JSONExporter(data, {
    indentSize: 2,
    sortKeys: true,
    includeStats: true,
    includeMetadata: true,
    includeTimestamp: true,
    minify: false,
    maxPathDepth: 20,
    maxResults: 1000,
  });
}

/**
 * Создать минифицированный JSON экспортер
 */
export function createMinifiedExporter(data: ASTReport): JSONExporter {
  return new JSONExporter(data, {
    indentSize: 0,
    sortKeys: false,
    includeStats: true,
    includeMetadata: false,
    includeTimestamp: false,
    minify: true,
    maxPathDepth: 10,
    maxResults: 500,
  });
}

/**
 * Создать экспортер для аналитики
 */
export function createAnalyticsExporter(data: ASTReport): JSONExporter {
  return new JSONExporter(data, {
    indentSize: 2,
    sortKeys: true,
    includeStats: true,
    includeMetadata: true,
    includeTimestamp: true,
    minify: false,
    maxPathDepth: 20,
    maxResults: 1000,
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для экспортера
 */
export interface TestExporterData {
  report: ASTReport;
  options: JSONExporterOptions;
}

/**
 * Создать тестовые данные
 */
export function createTestExporterData(): TestExporterData {
  const report: ASTReport = {
    v: '5.1.0-test',
    ts: new Date().toISOString(),
    r: 'test',
    mi: {
      m1: 'test-module',
    },
    fl: {
      f1: 'test-file.ts',
    },
    fns: [['fn1', 'testFunction', 'm1', 'f1', 10, 'e']],
    sf: [['sf1', 'fn1', 'f1', 10]],
    cn: [['c1', 'TEST_CONST', 'test', 'm1', 'f1', 11, 'e']],
    gr: {
      c: [],
      i: [],
      e: [],
      h: [],
      td: [],
      re: [],
      uc: [],
      cd: [],
      ce: [],
      di: [],
      cfg: [],
      ext: [],
      vt: [],
      async: [],
      closures: [],
      reflection: [],
      types: [],
    },
    st: {
      tf: 1,
      tc: 0,
      tm: 1,
      tfils: 1,
      te: 0,
      tun: 0,
      async: 0,
      cy: false,
      avgCalls: 0,
      maxCalls: 0,
      tcn: 1,
      tce: 0,
      tuc: 0,
      tcd: 0,
      tr: 0,
      ttd: 0,
      tre: 0,
      ti: 0,
      tsf: 1,
      funcsWithCalls: 0,
      calledFuncs: 0,
      modulesWithFunctions: 1,
      filesWithFunctions: 1,
      exportedWithCalls: 0,
      defaultExports: 0,
      typeExports: 0,
      typeImports: 0,
      di: 0,
      cfg: 0,
      ext: 0,
      vt: 0,
      asyncChains: 0,
      closures: 0,
      reflections: 0,
      typeDeps: 0,
    },
    flg: {},
    legend: {
      callTypes: {},
      importTypes: {},
      exportTypes: {},
      inheritanceTypes: {},
      typeDependencyTypes: {},
      constantTypes: {},
      dynamicImportTypes: {},
      configTypes: {},
      vueTemplateTypes: {},
    },
  };

  return {
    report,
    options: {
      indentSize: 2,
      sortKeys: true,
      includeStats: true,
      includeMetadata: true,
      includeTimestamp: true,
      minify: false,
      maxPathDepth: 20,
      maxResults: 1000,
    },
  };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default JSONExporter;
