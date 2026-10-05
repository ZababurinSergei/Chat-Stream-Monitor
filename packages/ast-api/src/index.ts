// src/index.ts - исправленная версия с автоматической загрузкой index.json

/**
 * AST Analyzer API - Точка входа
 *
 * @module ast-analyzer-api
 * @description Главный модуль для анализа AST-отчетов
 *
 * @example
 * ```typescript
 * import AstAnalyzerAPI from 'ast-analyzer-api';
 *
 * // API автоматически загружает ./index.json
 * const api = AstAnalyzerAPI;
 *
 * // Поиск функций
 * const functions = api.getAllFunctions();
 * const deadCode = api.getDeadCode();
 *
 * // Анализ путей
 * const paths = api.findAllPaths('fn64', 'fn169');
 * ```
 */

// ==================== ГЛАВНЫЙ КЛАСС ====================
export { AstAnalyzerAPI } from './core/AstAnalyzerAPI.js';

// ==================== ТИПЫ ====================
export * from './types/index.js';

// ==================== MANAGERS ====================
export { FunctionManager } from './entities/FunctionManager.js';
export { ModuleManager } from './entities/ModuleManager.js';
export { FileManager } from './entities/FileManager.js';
export { ConstantManager } from './entities/ConstantManager.js';

// ==================== GRAPHS ====================
export { CallGraph } from './graph/CallGraph.js';
export type { CallEdgeWithMeta, CallerEdgeWithMeta, CrossModuleCall } from './graph/CallGraph.js';

export { ImportGraph } from './graph/ImportGraph.js';
export type { ImportEdgeWithMeta, ImporterEdgeWithMeta } from './graph/ImportGraph.js';

export { PathFinder } from './graph/PathFinder.js';

// ==================== SEARCH ====================
export { NameSearch } from './search/NameSearch.js';
export { PathSearch } from './search/PathSearch.js';

// ==================== ANALYSIS ====================
export { DeadCodeAnalyzer } from './analysis/DeadCodeAnalyzer.js';
export { IsolationAnalyzer } from './analysis/IsolationAnalyzer.js';
export { Statistics } from './analysis/Statistics.js';
export { IntersectionAnalyzer } from './analysis/IntersectionAnalyzer.js';

// ==================== EXPORTERS ====================
export { JSONExporter } from './export/JSONExporter.js';
export { DOTExporter } from './export/DOTExporter.js';

// ==================== CORE ====================
export { DataLoader } from './core/DataLoader.js';
export { IdNormalizer } from './core/IdNormalizer.js';

// ==================== ВЕРСИЯ ====================
export const VERSION = '5.1.0-optimized';
export const NAME = 'ast-analyzer-api';
export const REPORTERS_VERSION = '5.0.0';

// ==================== КОНСТАНТЫ ====================
export const DEFAULT_CONFIG = {
  maxDepth: 20,
  maxSearchResults: 100,
  fuzzyThreshold: 0,
  enableCache: true,
  cacheTTL: 300000,
  maxCacheSize: 1000,
} as const;

export const CALL_TYPES = {
  DIRECT: 'd',
  ASYNC: 'a',
  METHOD: 'm',
  CALLBACK: 'c',
  DYNAMIC_IMPORT: 'di',
} as const;

export const IMPORT_TYPES = {
  NAMED: 'n',
  DEFAULT: 'df',
  NAMESPACE: 'ns',
  RE_EXPORT: 'ri',
  TYPE_ONLY: 'to',
  SIDE_EFFECT: 'se',
} as const;

export const EXPORT_TYPES = {
  NAMED: 'ne',
  DEFAULT: 'de',
  RE_EXPORT: 're',
  TYPE: 'te',
} as const;

export const SUPPORTED_VERSIONS = ['5.1.0-optimized', '5.0.0', '4.0.0'] as const;

export const ERROR_CODES = {
  DATA_NOT_LOADED: 'DATA_NOT_LOADED',
  INVALID_ID: 'INVALID_ID',
  INVALID_DATA: 'INVALID_DATA',
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  EXPORT_FAILED: 'EXPORT_FAILED',
} as const;

// ==================== КОНФИГУРАЦИЯ ПО УМОЛЧАНИЮ ====================
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxResults: 100,
  fuzzyThreshold: 0,
  caseSensitive: false,
};

export const DEFAULT_PATH_CONFIG: PathConfig = {
  maxDepth: 20,
  algorithm: 'bidirectional',
  maxPaths: 1000,
};

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'analytics',
  prettyPrint: true,
  includeStats: true,
  includeMetadata: true,
};

// ==================== ХЕЛПЕРЫ ====================
export function isValidFunctionId(id: string | number, api: any): boolean {
  try {
    const fn = api.getFunction(id);
    return fn !== null;
  } catch {
    return false;
  }
}

export function getFunctionName(id: string | number, api: any): string {
  const fn = api.getFunction(id);
  return fn?.name || String(id);
}

export function isPathExists(
  fromId: string | number,
  toId: string | number,
  api: any,
  maxDepth: number = 20
): boolean {
  return api.isReachable(fromId, toId, maxDepth);
}

export function formatStats(stats: any): string {
  const lines = [
    `📊 Статистика:`,
    `  • Всего функций:     ${stats.tf || 0}`,
    `  • Всего файлов:      ${stats.tfils || 0}`,
    `  • Всего модулей:     ${stats.tm || 0}`,
    `  • Всего вызовов:     ${stats.tc || 0}`,
    `  • Всего импортов:    ${stats.ti || 0}`,
    `  • Мёртвых функций:   ${stats.tun || 0} (${(((stats.tun || 0) / (stats.tf || 1)) * 100).toFixed(1)}%)`,
    `  • Асинхронных:       ${stats.async || 0}`,
    `  • Замыканий:         ${stats.closures || 0}`,
    `  • Динамических имп.: ${stats.di || 0}`,
    `  • Внешних библиотек: ${stats.ext || 0}`,
    `  • Констант:          ${stats.tcn || 0}`,
  ];
  return lines.join('\n');
}

// ==================== АВТОМАТИЧЕСКАЯ ЗАГРУЗКА index.json ====================

import instance from './core/AstAnalyzerAPI.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Определяем путь к текущему файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Загрузить данные из index.json
 */
function loadIndexJson(): any | null {
  try {
    // Ищем index.json в нескольких местах:
    // 1. В текущей директории
    // 2. В директории проекта (на уровень выше)
    // 3. В корневой директории проекта
    const possiblePaths = [
      path.join(process.cwd(), 'index.json'),
      path.join(process.cwd(), '..', 'index.json'),
      path.join(__dirname, '..', 'index.json'),
      path.join(__dirname, '..', '..', 'index.json'),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`📂 Загружен index.json: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    }

    // Если файл не найден, пробуем найти через require.resolve
    try {
      const resolvedPath = require.resolve('./index.json');
      if (fs.existsSync(resolvedPath)) {
        console.log(`📂 Загружен index.json: ${resolvedPath}`);
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // Игнорируем ошибку require.resolve
    }

    console.warn('⚠️ index.json не найден. Используйте api.load() для загрузки данных.');
    return null;
  } catch (error) {
    console.error('❌ Ошибка загрузки index.json:', error);
    return null;
  }
}

/**
 * Асинхронная загрузка index.json
 */
export async function loadIndexJsonAsync(): Promise<any | null> {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'index.json'),
      path.join(process.cwd(), '..', 'index.json'),
      path.join(__dirname, '..', 'index.json'),
      path.join(__dirname, '..', '..', 'index.json'),
    ];

    for (const filePath of possiblePaths) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        console.log(`📂 Загружен index.json: ${filePath}`);
        return JSON.parse(content);
      } catch {
        // Продолжаем поиск
      }
    }

    console.warn('⚠️ index.json не найден. Используйте api.load() для загрузки данных.');
    return null;
  } catch (error) {
    console.error('❌ Ошибка загрузки index.json:', error);
    return null;
  }
}

// ==================== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ====================

// Флаг, чтобы не загружать данные повторно
let isDataLoaded = false;

// Автоматически загружаем данные при импорте
try {
  const data = loadIndexJson();
  if (data && !isDataLoaded) {
    instance.load(data);
    isDataLoaded = true;
    console.log('✅ AST API инициализирован с данными из index.json');
  }
} catch (error) {
  console.warn('⚠️ Не удалось автоматически загрузить index.json:', error);
}

// Экспортируем экземпляр API (уже с загруженными данными)
export default instance;
export { instance as api };

/**
 * Перезагрузить данные из index.json
 */
export function reloadFromIndexJson(): boolean {
  try {
    const data = loadIndexJson();
    if (data) {
      instance.reset();
      instance.load(data);
      isDataLoaded = true;
      console.log('✅ Данные перезагружены из index.json');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Ошибка перезагрузки index.json:', error);
    return false;
  }
}

/**
 * Проверить, загружены ли данные
 */
export function isDataLoaded_(): boolean {
  return isDataLoaded && instance.isLoaded();
}

// ==================== ТИПЫ ДЛЯ КОНФИГУРАЦИИ ====================
export interface SearchConfig {
  maxResults?: number;
  fuzzyThreshold?: number;
  caseSensitive?: boolean;
}

export interface PathConfig {
  maxDepth?: number;
  algorithm?: 'bfs' | 'dfs' | 'bidirectional';
  maxPaths?: number;
}

export interface ExportConfig {
  format: 'json' | 'dot' | 'analytics';
  prettyPrint?: boolean;
  includeStats?: boolean;
  includeMetadata?: boolean;
}

// ==================== ТИПЫ ДЛЯ ФИЛЬТРАЦИИ ====================
export interface FunctionFilter {
  moduleIds?: string[];
  fileIds?: string[];
  names?: string[];
  namePattern?: RegExp;
  minLine?: number;
  maxLine?: number;
  flags?: string[];
  exported?: boolean;
  async?: boolean;
  hasCalls?: boolean;
  isCalled?: boolean;
}

export interface PathFilter {
  maxDepth?: number;
  minPathLength?: number;
  maxPathLength?: number;
  includeCycles?: boolean;
  uniqueOnly?: boolean;
}

// ==================== ТИПЫ ДЛЯ ОТЧЕТОВ ====================
export interface SummaryReport {
  timestamp: string;
  version: string;
  stats: any;
  topFunctions: {
    mostCalled: { id: string; name: string; calls: number }[];
    mostCalling: { id: string; name: string; calls: number }[];
  };
  deadCode: {
    total: number;
    percentage: string;
    examples: string[];
  };
  isolated: {
    total: number;
    percentage: string;
    examples: string[];
  };
}

export interface FunctionReport {
  function: any;
  calls: any[];
  callers: any[];
  imports: any[];
  importers: any[];
  reachable: any[];
  reaching: any[];
  stats: {
    totalCalls: number;
    totalCallers: number;
    totalImports: number;
    totalImporters: number;
    reachableCount: number;
    reachingCount: number;
  };
}

// ==================== ТИПЫ ДЛЯ МИГРАЦИИ ====================
export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  changes: string[];
  warnings: string[];
}

export interface MigrationResult {
  success: boolean;
  info: MigrationInfo;
  data: any;
  errors?: string[];
}

// ==================== ТИПЫ ДЛЯ ОШИБОК ====================
export class AstAnalyzerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AstAnalyzerError';
  }
}

export type ErrorCode = keyof typeof ERROR_CODES;

// ==================== ТИПЫ ДЛЯ СОБЫТИЙ ====================
export type APIEvent =
  | { type: 'load'; data: any }
  | { type: 'reset' }
  | { type: 'analyze'; results: unknown }
  | { type: 'export'; format: string; data: unknown }
  | { type: 'error'; error: Error };

export type APIEventListener = (event: APIEvent) => void;

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================
export interface TestContext {
  api: any;
  data: any;
  cleanup: () => void;
}

export interface MockData {
  functions: any[];
  modules: any[];
  files: any[];
  constants: any[];
  calls: any[];
  imports: any[];
}

// ==================== ТИПЫ ДЛЯ СОРТИРОВКИ И ГРУППИРОВКИ ====================
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface GroupOptions {
  by: 'module' | 'file' | 'name' | 'flags';
  sort?: SortOptions;
}

// ==================== ТИПЫ ДЛЯ АДАПТЕРОВ ====================
export interface Adapter<T> {
  fromExternal(data: T): any;
  toExternal(data: any): T;
}

export class JSONAdapter implements Adapter<string> {
  fromExternal(data: string): any {
    return JSON.parse(data);
  }
  toExternal(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}

export class BufferAdapter implements Adapter<Buffer> {
  fromExternal(data: Buffer): any {
    return JSON.parse(data.toString('utf-8'));
  }
  toExternal(data: any): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  }
}

// ==================== ТИПЫ ДЛЯ ПЛАГИНОВ ====================
export interface Plugin {
  name: string;
  version: string;
  initialize(api: any): void;
  destroy?(): void;
}

export interface PluginResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== ТИПЫ ДЛЯ ДАМПА ====================
export interface DataDump {
  version: string;
  timestamp: string;
  metadata: {
    totalFunctions: number;
    totalModules: number;
    totalFiles: number;
    totalConstants: number;
  };
  data: any;
}

// ==================== ТИПЫ ДЛЯ ВАЛИДАЦИИ ====================
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ТИПЫ ДЛЯ КЕШИРОВАНИЯ ====================
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

export function isCacheExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

// ==================== ФАБРИКИ ====================
export function createFunctionId(index: number): string {
  return `fn${index}`;
}

export function createFileId(index: number): string {
  return `f${index}`;
}

export function createModuleId(index: number): string {
  return `m${index}`;
}

export function createConstantId(index: number): string {
  return `c${index}`;
}

// ==================== TYPE GUARDS ====================
export function isFunctionEntity(obj: unknown): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'moduleId' in obj &&
    'fileId' in obj &&
    'line' in obj
  );
}

export function isModuleEntity(obj: unknown): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'functions' in obj &&
    'files' in obj
  );
}

export function isFileEntity(obj: unknown): boolean {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'path' in obj && 'name' in obj;
}

// ==================== ТЕСТОВЫЕ КОНСТАНТЫ ====================
export const TEST_CONSTANTS = {
  TEST_MODULE_ID: 'm1',
  TEST_FILE_ID: 'f1',
  TEST_FUNCTION_ID: 'fn1',
  TEST_CONSTANT_ID: 'c1',
  TEST_SELF_FUNCTION_ID: 'sf1',
} as const;

// ==================== КОНЕЦ ФАЙЛА ====================
