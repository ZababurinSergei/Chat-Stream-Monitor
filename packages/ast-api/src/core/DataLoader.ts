// src/core/DataLoader.ts

/**
 * DataLoader - Загрузка и построение индексов данных AST-отчета
 *
 * @module core/DataLoader
 * @description Отвечает за загрузку данных, построение карт функций, файлов, модулей и констант
 *
 * @example
 * ```typescript
 * import { DataLoader } from './DataLoader.js';
 *
 * const loader = new DataLoader();
 * loader.load(reportData);
 *
 * const functions = loader.getFunctionMap();
 * const modules = loader.getModuleMap();
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
  SelfFunctionId,
} from '../types/index.js';

import { IdNormalizer } from './IdNormalizer.js';

// ==================== КОНСТАНТЫ ====================

/** Расширения файлов, поддерживаемые анализатором */
const SUPPORTED_EXTENSIONS = ['.ts', '.mjs', '.js', '.tsx', '.jsx', '.vue'];

/** Паттерны для исключения при сканировании */
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.nyc_output',
  '__pycache__',
  '.cache',
  '.next',
  'out',
  '.nuxt',
  '.output',
  '.vercel',
  'tmp',
  'temp',
];

// ==================== КЛАСС ====================

/**
 * Класс для загрузки и управления данными AST-отчета
 */
export class DataLoader {
  // ==================== ПРИВАТНЫЕ ПОЛЯ ====================

  /** Исходные данные отчета */
  private data: ASTReport | null = null;

  /** Карта функций: FunctionId -> FunctionEntity */
  private functionMap = new Map<FunctionId, FunctionEntity>();

  /** Карта файлов: FileId -> FileEntity */
  private fileMap = new Map<FileId, FileEntity>();

  /** Карта модулей: ModuleId -> ModuleEntity */
  private moduleMap = new Map<ModuleId, ModuleEntity>();

  /** Карта констант: ConstantId -> ConstantEntity */
  private constantMap = new Map<ConstantId, ConstantEntity>();

  /** Карта self-функций: SelfFunctionId -> FunctionId */
  private selfFunctionMap = new Map<SelfFunctionId, FunctionId>();

  /** Нормализатор ID */
  private idNormalizer: IdNormalizer;

  /** Статистика загрузки */
  private loadStats = {
    totalFunctions: 0,
    totalFiles: 0,
    totalModules: 0,
    totalConstants: 0,
    validFunctions: 0,
    invalidFunctions: 0,
    startTime: 0,
    endTime: 0,
  };

  // ==================== КОНСТРУКТОР ====================

  constructor() {
    this.idNormalizer = new IdNormalizer(this.functionMap);
  }

  // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

  /**
   * Загрузить данные отчета
   *
   * @param data - Данные AST-отчета
   * @returns this - Для цепочки вызовов
   *
   * @throws {AstAnalyzerError} При ошибке загрузки
   *
   * @example
   * ```typescript
   * const loader = new DataLoader();
   * loader.load(reportData);
   * ```
   */
  load(data: ASTReport): this {
    this.loadStats.startTime = Date.now();

    try {
      this.data = data;

      // Очистка старых данных
      this.clear();

      // Построение карт
      this.buildMaps(data);

      // Построение карт ID
      this.idNormalizer.buildMaps(data);

      // Построение дополнительных индексов
      this.buildAdditionalIndexes();

      // Валидация данных
      this.validateData();

      // Обновление статистики
      this.updateStats();

      this.loadStats.endTime = Date.now();

      console.log(
        `✅ Данные загружены: ${this.loadStats.totalFunctions} функций, ${this.loadStats.totalFiles} файлов, ${this.loadStats.totalModules} модулей`
      );
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      throw error;
    }

    return this;
  }

  /**
   * Очистить все данные
   */
  clear(): void {
    this.functionMap.clear();
    this.fileMap.clear();
    this.moduleMap.clear();
    this.constantMap.clear();
    this.selfFunctionMap.clear();
    this.loadStats = {
      totalFunctions: 0,
      totalFiles: 0,
      totalModules: 0,
      totalConstants: 0,
      validFunctions: 0,
      invalidFunctions: 0,
      startTime: 0,
      endTime: 0,
    };
  }

  /**
   * Получить данные отчета
   */
  getData(): ASTReport | null {
    return this.data;
  }

  /**
   * Получить карту функций
   */
  getFunctionMap(): Map<FunctionId, FunctionEntity> {
    return this.functionMap;
  }

  /**
   * Получить карту файлов
   */
  getFileMap(): Map<FileId, FileEntity> {
    return this.fileMap;
  }

  /**
   * Получить карту модулей
   */
  getModuleMap(): Map<ModuleId, ModuleEntity> {
    return this.moduleMap;
  }

  /**
   * Получить карту констант
   */
  getConstantMap(): Map<ConstantId, ConstantEntity> {
    return this.constantMap;
  }

  /**
   * Получить карту self-функций
   */
  getSelfFunctionMap(): Map<SelfFunctionId, FunctionId> {
    return this.selfFunctionMap;
  }

  /**
   * Получить нормализатор ID
   */
  getIdNormalizer(): IdNormalizer {
    return this.idNormalizer;
  }

  /**
   * Получить статистику загрузки
   */
  getLoadStats() {
    return {
      ...this.loadStats,
      duration: this.loadStats.endTime - this.loadStats.startTime,
    };
  }

  /**
   * Получить функцию по ID
   */
  getFunction(id: FunctionId | string | number): FunctionEntity | null {
    const normalizedId = this.idNormalizer.normalize(id);
    return this.functionMap.get(normalizedId) || null;
  }

  /**
   * Получить файл по ID
   */
  getFile(id: FileId): FileEntity | null {
    return this.fileMap.get(id) || null;
  }

  /**
   * Получить модуль по ID
   */
  getModule(id: ModuleId): ModuleEntity | null {
    return this.moduleMap.get(id) || null;
  }

  /**
   * Получить константу по ID
   */
  getConstant(id: ConstantId): ConstantEntity | null {
    return this.constantMap.get(id) || null;
  }

  /**
   * Проверить, загружены ли данные
   */
  isLoaded(): boolean {
    return this.data !== null && this.functionMap.size > 0;
  }

  // ==================== ПРИВАТНЫЕ МЕТОДЫ ====================

  /**
   * Построить карты данных
   */
  private buildMaps(data: ASTReport): void {
    // 1. Построение карты функций
    this.buildFunctionMap(data);

    // 2. Построение карты файлов
    this.buildFileMap(data);

    // 3. Построение карты модулей
    this.buildModuleMap(data);

    // 4. Построение карты констант
    this.buildConstantMap(data);

    // 5. Построение карты self-функций
    this.buildSelfFunctionMap(data);

    // 6. Связывание функций с модулями и файлами
    this.linkEntities();
  }

  /**
   * Построить карту функций
   */
  private buildFunctionMap(data: ASTReport): void {
    if (!data.fns) {
      console.warn('⚠️ Нет данных о функциях (fns)');
      return;
    }

    for (const [id, name, moduleId, fileId, line, flags] of data.fns) {
      try {
        const filePath = data.fl?.[fileId] || fileId;

        const entity: FunctionEntity = {
          id,
          name,
          moduleId,
          fileId,
          line,
          flags,
          module: data.mi?.[moduleId] || moduleId,
          file: filePath,
          filePath: filePath,
        };

        this.functionMap.set(id, entity);
        this.loadStats.totalFunctions++;
      } catch (error) {
        console.warn(`⚠️ Ошибка добавления функции ${id}:`, error);
        this.loadStats.invalidFunctions++;
      }
    }

    // Добавляем дополнительную информацию из sf
    if (data.sf) {
      for (const [sfId, fnId, fileIdRef, lineRef] of data.sf) {
        const fn = this.functionMap.get(fnId);
        if (fn) {
          fn.sfId = sfId;
          fn.fileIdRef = fileIdRef;
          fn.lineRef = lineRef;
        }
      }
    }
  }

  /**
   * Построить карту файлов
   */
  private buildFileMap(data: ASTReport): void {
    if (!data.fl) {
      console.warn('⚠️ Нет данных о файлах (fl)');
      return;
    }

    for (const [id, path] of Object.entries(data.fl)) {
      try {
        const fileName = path.split('/').pop() || path;
        const extension = path.split('.').pop() || '';
        const directory = path.split('/').slice(0, -1).join('/');

        const entity: FileEntity = {
          id: id as FileId,
          path,
          name: fileName,
          extension,
          directory,
          isTypeScript: this.isTypeScriptFile(path),
          isJavaScript: this.isJavaScriptFile(path),
          isVue: this.isVueFile(path),
          isJsx: this.isJsxFile(path),
          language: this.detectLanguage(path),
          size: 0,
        };

        this.fileMap.set(id as FileId, entity);
        this.loadStats.totalFiles++;
      } catch (error) {
        console.warn(`⚠️ Ошибка добавления файла ${id}:`, error);
      }
    }
  }

  /**
   * Построить карту модулей
   */
  private buildModuleMap(data: ASTReport): void {
    if (!data.mi) {
      console.warn('⚠️ Нет данных о модулях (mi)');
      return;
    }

    for (const [id, name] of Object.entries(data.mi)) {
      try {
        const entity: ModuleEntity = {
          id: id as ModuleId,
          name,
          functions: [],
          files: [],
          calls: [],
          imports: [],
          functionCount: 0,
          fileCount: 0,
        };

        this.moduleMap.set(id as ModuleId, entity);
        this.loadStats.totalModules++;
      } catch (error) {
        console.warn(`⚠️ Ошибка добавления модуля ${id}:`, error);
      }
    }
  }

  /**
   * Построить карту констант
   */
  private buildConstantMap(data: ASTReport): void {
    if (!data.cn) {
      console.warn('⚠️ Нет данных о константах (cn)');
      return;
    }

    for (const [id, name, value, moduleId, fileId, line, flags] of data.cn) {
      try {
        const entity: ConstantEntity = {
          id,
          name,
          value,
          moduleId,
          fileId,
          line,
          flags,
          module: data.mi?.[moduleId] || moduleId,
          file: data.fl?.[fileId] || fileId,
          type: this.detectConstantType(value),
        };

        this.constantMap.set(id, entity);
        this.loadStats.totalConstants++;
      } catch (error) {
        console.warn(`⚠️ Ошибка добавления константы ${id}:`, error);
      }
    }
  }

  /**
   * Построить карту self-функций
   */
  private buildSelfFunctionMap(data: ASTReport): void {
    if (!data.sf) {
      return;
    }

    for (const [sfId, fnId] of data.sf) {
      this.selfFunctionMap.set(sfId, fnId);
    }
  }

  /**
   * Связать сущности между собой
   */
  private linkEntities(): void {
    // Связываем функции с модулями
    for (const [id, fn] of this.functionMap) {
      const mod = this.moduleMap.get(fn.moduleId);
      if (mod && !mod.functions.includes(id)) {
        mod.functions.push(id);
        mod.functionCount = mod.functions.length;
      }
    }

    // Связываем файлы с модулями через функции
    for (const [fileId] of this.fileMap) {
      let moduleId: ModuleId | undefined;

      // Ищем модуль по функциям
      for (const [, fn] of this.functionMap) {
        if (fn.fileId === fileId) {
          moduleId = fn.moduleId;
          break;
        }
      }

      if (moduleId) {
        const mod = this.moduleMap.get(moduleId);
        if (mod && !mod.files.includes(fileId)) {
          mod.files.push(fileId);
          mod.fileCount = mod.files.length;
        }
      }
    }

    // Обновляем статистику
    for (const mod of this.moduleMap.values()) {
      mod.functionCount = mod.functions.length;
      mod.fileCount = mod.files.length;
    }
  }

  /**
   * Построить дополнительные индексы
   */
  private buildAdditionalIndexes(): void {
    // Дополнительные индексы для быстрого поиска
    // Будут использоваться в других модулях
  }

  /**
   * Валидация данных
   */
  private validateData(): void {
    const warnings: string[] = [];

    if (this.functionMap.size === 0) {
      warnings.push('Нет функций в отчете');
    }

    if (this.fileMap.size === 0) {
      warnings.push('Нет файлов в отчете');
    }

    if (this.moduleMap.size === 0) {
      warnings.push('Нет модулей в отчете');
    }

    for (const [id, fn] of this.functionMap) {
      if (!this.moduleMap.has(fn.moduleId)) {
        warnings.push(`Функция ${id} ссылается на несуществующий модуль ${fn.moduleId}`);
      }
      if (!this.fileMap.has(fn.fileId)) {
        warnings.push(`Функция ${id} ссылается на несуществующий файл ${fn.fileId}`);
      }
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Предупреждения валидации:', warnings);
    }
  }

  /**
   * Обновить статистику загрузки
   */
  private updateStats(): void {
    this.loadStats.validFunctions = this.functionMap.size;
    this.loadStats.totalFiles = this.fileMap.size;
    this.loadStats.totalModules = this.moduleMap.size;
    this.loadStats.totalConstants = this.constantMap.size;
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Определить тип константы
   */
  private detectConstantType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'unknown';
  }

  /**
   * Проверить, является ли файл TypeScript
   */
  private isTypeScriptFile(path: string): boolean {
    return /\.(ts|tsx)$/.test(path);
  }

  /**
   * Проверить, является ли файл JavaScript
   */
  private isJavaScriptFile(path: string): boolean {
    return /\.(js|mjs|cjs|jsx)$/.test(path);
  }

  /**
   * Проверить, является ли файл Vue
   */
  private isVueFile(path: string): boolean {
    return /\.vue$/.test(path);
  }

  /**
   * Проверить, является ли файл JSX
   */
  private isJsxFile(path: string): boolean {
    return /\.(jsx|tsx)$/.test(path);
  }

  /**
   * Определить язык файла
   */
  private detectLanguage(path: string): string {
    if (this.isTypeScriptFile(path)) return 'typescript';
    if (this.isJavaScriptFile(path)) return 'javascript';
    if (this.isVueFile(path)) return 'vue';
    return 'unknown';
  }

  // ==================== СТАТИЧЕСКИЕ МЕТОДЫ ====================

  /**
   * Создать DataLoader из файла
   */
  static async fromFile(filePath: string): Promise<DataLoader> {
    const fs = await import('fs');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const loader = new DataLoader();
    loader.load(data);
    return loader;
  }

  /**
   * Создать DataLoader из JSON строки
   */
  static fromJSON(json: string): DataLoader {
    const data = JSON.parse(json);
    const loader = new DataLoader();
    loader.load(data);
    return loader;
  }

  /**
   * Создать DataLoader из буфера
   */
  static fromBuffer(buffer: Buffer): DataLoader {
    const data = JSON.parse(buffer.toString('utf-8'));
    const loader = new DataLoader();
    loader.load(data);
    return loader;
  }
}

// ==================== ЭКСПОРТ ТИПОВ ====================

export interface LoadStats {
  totalFunctions: number;
  totalFiles: number;
  totalModules: number;
  totalConstants: number;
  validFunctions: number;
  invalidFunctions: number;
  startTime: number;
  endTime: number;
  duration?: number;
}

export interface DataLoaderOptions {
  validate?: boolean;
  buildIndexes?: boolean;
  verbose?: boolean;
}

// ==================== КОНСТАНТЫ ДЛЯ ЭКСПОРТА ====================

export const CONSTANTS = {
  SUPPORTED_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Проверить, поддерживается ли расширение файла
 */
export function isSupportedExtension(path: string): boolean {
  return SUPPORTED_EXTENSIONS.some(ext => path.endsWith(ext));
}

/**
 * Проверить, должен ли файл быть исключен
 */
export function isExcluded(
  path: string,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): boolean {
  return excludePatterns.some(pattern => path.includes(pattern));
}

/**
 * Нормализовать путь файла
 */
export function normalizeFilePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Получить родительскую директорию
 */
export function getParentDirectory(path: string): string {
  const parts = normalizeFilePath(path).split('/');
  return parts.slice(0, -1).join('/') || '/';
}

/**
 * Проверить, является ли путь абсолютным
 */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:/.test(path);
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default DataLoader;
