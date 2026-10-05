// src/analysis/index.ts

/**
 * Модуль анализа AST-отчетов
 *
 * @module analysis
 * @description Содержит анализаторы для выявления мертвого кода,
 * изолированных функций, сбора статистики и поиска пересечений
 *
 * @example
 * ```typescript
 * import {
 *   DeadCodeAnalyzer,
 *   IsolationAnalyzer,
 *   Statistics,
 *   IntersectionAnalyzer
 * } from './analysis/index.js';
 * ```
 */

export { DeadCodeAnalyzer } from './DeadCodeAnalyzer.js';
export { IsolationAnalyzer } from './IsolationAnalyzer.js';
export { Statistics } from './Statistics.js';
export { IntersectionAnalyzer } from './IntersectionAnalyzer.js';

// ==================== ТИПЫ ДЛЯ АНАЛИЗАТОРОВ ====================

/**
 * Результат анализа мертвого кода
 */
export interface DeadCodeResult {
  /** Количество мертвых функций */
  total: number;
  /** Процент мертвых функций */
  percentage: string;
  /** Список мертвых функций */
  functions: FunctionEntity[];
}

/**
 * Результат анализа изолированных функций
 */
export interface IsolationResult {
  /** Количество изолированных функций */
  total: number;
  /** Процент изолированных функций */
  percentage: string;
  /** Список изолированных функций */
  functions: FunctionEntity[];
}

/**
 * Детальная статистика
 */
export interface DetailedStats {
  /** Сводная статистика из отчета */
  summary: ReportStats;
  /** Статистика по функциям */
  functions: {
    total: number;
    byModule: Record<string, number>;
    byFile: Record<string, number>;
  };
  /** Статистика по вызовам */
  calls: {
    total: number;
    byType: Record<string, number>;
    crossModule: number;
  };
  /** Статистика по импортам */
  imports: {
    total: number;
    byType: Record<string, number>;
  };
  /** Статистика по модулям */
  modules: {
    total: number;
    withFunctions: number;
  };
  /** Статистика по файлам */
  files: {
    total: number;
    withFunctions: number;
  };
}

/**
 * Полная аналитика
 */
export interface Analytics {
  /** Детальная статистика */
  stats: DetailedStats;
  /** Мертвый код */
  deadCode: DeadCodeResult;
  /** Изолированные функции */
  isolated: IsolationResult;
  /** Самые вызываемые функции */
  mostCalled: { id: FunctionId; calls: number; function: FunctionEntity | null }[];
  /** Функции, которые больше всего вызывают */
  mostCalling: { id: FunctionId; calls: number; function: FunctionEntity | null }[];
  /** Внешние библиотеки */
  externalLibraries: {
    name: string;
    version: string;
    type: number;
    count: number;
    files: FileId[];
  }[];
  /** Динамические импорты */
  dynamicImports: DynamicImport[];
  /** Замыкания */
  closures: Closure[];
  /** Асинхронные функции */
  asyncFunctions: AsyncChain[];
  /** Модули */
  modules: ModuleEntity[];
  /** Файлы */
  files: FileEntity[];
  /** Константы */
  constants: ConstantEntity[];
}

// ==================== ИМПОРТ ТИПОВ ====================

import type {
  FunctionEntity,
  FunctionId,
  FileId,
  ModuleEntity,
  FileEntity,
  ConstantEntity,
  ReportStats,
  DynamicImport,
  Closure,
  AsyncChain,
} from '../types/index.js';
