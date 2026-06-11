// index.ts
// Точка входа для программы и внешнего API

// ==========================================
// ЭКСПОРТ ЯДРА (CORE)
// ==========================================

// Парсинг и работа с AST
export {
  parseFile,
  isExternalModule,
  resolveFilePath,
  getAllProjectFiles,
  walk,
} from './core/ast-parser.js';

// Минификация кода
export { minifyCodeString, minifyForAI } from './core/minifier.js';

// Утилиты для работы с графами
export { findCyclicEdges, convertToDOT, dfs } from './core/graph-utils.js';

// Работа с tsconfig (алиасы)
export { setTsConfigPath, loadTsConfig, resolveAliasPath } from './core/tsconfig-resolver.js';

// ==========================================
// ЭКСПОРТ РЕЖИМОВ (MODES)
// ==========================================

// Режим 1: Проектный граф
export { buildProjectGraph } from './modes/project-graph.js';

// Режим 2: Внутренний граф файла
export { buildFileInternalGraph } from './modes/file-graph.js';

// Режим 3: Минификация одного файла
export { minifyFile } from './modes/minify-file.js';

// Режим 4: Рекурсивная минификация папки
export { minifyFolder, generateDirectoryTree, collectFiles } from './modes/minify-folder.js';

// Режим 5: Prompt Pack для ИИ
export { buildAiPromptPack } from './modes/prompt-pack.js';

// Режим 6: Разбиение файла на модули
export {
  buildSplitModulePrompt,
  analyzeModuleStructure,
  identifyClusters,
} from './modes/split-module.js';

// Режим 7: Анализ зоны влияния
export { runImpactAnalysis } from './modes/impact.js';

// Режим 8: Поиск мертвого кода
export { findDeadCode } from './modes/dead-code.js';

// ==========================================
// ЭКСПОРТ VUE АНАЛИЗАТОРА (NEW!)
// ==========================================

// Vue SFC парсер и анализатор
export {
  parseVueFile,
  analyzeVueComponent,
  generateVueComponentReport,
  enhanceWithVueAnalysis,
  type VueComponentAnalysis,
  type AnalysisOptions,
} from './modes/vue-analyzer.js';

// ==========================================
// ЭКСПОРТ РЕПОРТЕРОВ
// ==========================================

// Генерация HTML отчётов
export { generateHTMLReport, escapeHtml } from './reporters/html-reporter.js';

// ==========================================
// ЭКСПОРТ ТИПОВ
// ==========================================

export type {
  // Статистика
  AnalysisStats,

  // Информация о сущностях
  ImportInfo,
  ExportInfo,
  FunctionInfo,
  ClassInfo,
  ConstantInfo,
  InterfaceInfo,
  TypeInfo,
  MethodInfo,

  // Структуры анализа
  AnalysisResult,
  CallGraph,
  GraphData,

  // Кластеры
  Cluster,
  ClusterOptions,

  // Опции для режимов
  SplitModuleOptions,
  MinifyFolderOptions,
  PromptPackOptions,
  ImpactOptions,
  DeadCodeOptions,
  ProjectGraphOptions,
  FileGraphOptions,

  // Конфигурация
  Config,

  // Результаты
  SplitModuleResult,
  MinifyFolderResult,
  ImpactReport,
  DeadCodeReport,
} from './types.js';

// ==========================================
// ЭКСПОРТ КОНФИГУРАЦИИ
// ==========================================

export {
  IGNORE_NODE_MODULES,
  SUPPORTED_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  VUE_SCRIPT_PATTERN,
} from './config.js';

// ==========================================
// ЭКСПОРТ УТИЛИТ
// ==========================================

export { showHelp, renderNode } from './utils.js';

// ==========================================
// CLI RUNNER
// ==========================================

export { runCLI } from './cli.js';

// ==========================================
// ВЕРСИЯ
// ==========================================

export const VERSION = '2.2.0';
export const NAME = 'ast-analyzer';
