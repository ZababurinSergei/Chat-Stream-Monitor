// src/types/index.ts

// ==================== ОСНОВНЫЕ ТИПЫ ====================

/** ID модуля (m1, m2, ...) */
export type ModuleId = string;

/** ID файла (f1, f2, ...) */
export type FileId = string;

/** ID функции (fn1, fn2, ...) */
export type FunctionId = string;

/** ID константы (c1, c2, ...) */
export type ConstantId = string;

/** ID self-функции (sf1, sf2, ...) */
export type SelfFunctionId = string;

/** Тип вызова */
export type CallType = 'd' | 'a' | 'm' | 'c' | 'di';

/** Тип импорта */
export type ImportType = 'n' | 'df' | 'ns' | 'ri' | 'to' | 'se';

/** Тип экспорта */
export type ExportType = 'ne' | 'de' | 're' | 'te';

/** Тип наследования */
export type InheritanceType = 'ex' | 'im' | 'ab';

/** Тип зависимости */
export type TypeDependencyType = 'p' | 'r' | 'an' | 'g' | 'tr';

/** Тип константы */
export type ConstantType = 'val' | 'enum' | 'config';

/** Тип динамического импорта */
export type DynamicImportType = 'literal' | 'template' | 'concat';

/** Тип конфига */
export type ConfigType = 'env' | 'file' | 'variable';

/** Тип Vue шаблона */
export type VueTemplateType = 'component' | 'directive';

/** Флаги функции (битовые) */
export type FunctionFlags = string;

// ==================== СУЩНОСТИ ====================

/** Функция */
export interface FunctionEntity {
  id: FunctionId;
  name: string;
  moduleId: ModuleId;
  fileId: FileId;
  line: number;
  flags: FunctionFlags;
  module: string;
  file: string;
  filePath: string;
  sfId?: SelfFunctionId;
  fileIdRef?: FileId;
  lineRef?: number;
  complexity?: number;
}

/** Файл */
export interface FileEntity {
  id: FileId;
  path: string;
  name: string;
  extension: string;
  directory: string;
  isTypeScript?: boolean;
  isJavaScript?: boolean;
  isVue?: boolean;
  isJsx?: boolean;
  language?: string;
  size?: number;
}

/** Модуль */
export interface ModuleEntity {
  id: ModuleId;
  name: string;
  functions: FunctionId[];
  files: FileId[];
  calls: CallEdge[];
  imports: ImportEdge[];
  functionCount?: number;
  fileCount?: number;
}

/** Константа */
export interface ConstantEntity {
  id: ConstantId;
  name: string;
  value: unknown;
  moduleId: ModuleId;
  fileId: FileId;
  line: number;
  flags: FunctionFlags;
  module: string;
  file: string;
  type?: string;
}

// ==================== ГРАФЫ ====================

/** Ребро вызова: [from, to, line, type] */
export type CallEdge = [FunctionId, FunctionId, number, CallType];

/** Ребро импорта: [from, to, name, type, file] */
export type ImportEdge = [FunctionId, FunctionId, string, ImportType, FileId];

/** Ребро экспорта: [from, to, name, type, line] */
export type ExportEdge = [FunctionId, FunctionId, string, ExportType, number];

/** Ребро наследования: [from, to, type, line] */
export type InheritanceEdge = [FunctionId, FunctionId, InheritanceType, number];

/** Ребро типа: [from, to, type, file, line] */
export type TypeDependencyEdge = [FunctionId, FunctionId, TypeDependencyType, FileId, number];

/** Ребро re-экспорта: [from, to, name, line] */
export type ReExportEdge = [FunctionId, FunctionId, string, number];

/** Ребро использования констант: [fnId, constId, file, line] */
export type ConstantUseEdge = [FunctionId, ConstantId, FileId, number];

/** Ребро зависимости констант: [constId, depConstId, file, line] */
export type ConstantDependencyEdge = [ConstantId, ConstantId, FileId, number];

// ==================== ДИНАМИЧЕСКИЕ ИМПОРТЫ ====================

/** Динамический импорт: [file, line, path, type] */
export type DynamicImport = [FileId, number, string, DynamicImportType];

/** Конфиг референс: [file, line, key, type] */
export type ConfigRef = [FileId, number, string, ConfigType];

/** Внешняя библиотека: [file, name, version, type, count] */
export type ExternalLibrary = [FileId, string, string, number, number];

/** Vue шаблон: [file, line, name, type] */
export type VueTemplate = [FileId, number, string, VueTemplateType];

/** Асинхронная цепочка: [fnId, isAsync, line, count] */
export type AsyncChain = [FunctionId, number, number, number];

/** Замыкание: [fnId, line, variables, count] */
export type Closure = [FunctionId, number, string[], number];

/** Рефлексия: [fnId, target, line, type] */
export type Reflection = [FunctionId, string, number, string];

/** Тип зависимости: [from, to, type, file, line] */
export type TypeDependency = [FunctionId, FunctionId, TypeDependencyType, FileId, number];

// ==================== МЕТАДАННЫЕ ГРАФОВ (экспортируются из классов) ====================

/** Граф вызовов - экспорт типа из класса CallGraph */
export type { CallGraph } from '../graph/CallGraph.js';

/** Граф импортов - экспорт типа из класса ImportGraph */
export type { ImportGraph } from '../graph/ImportGraph.js';

/** Метаданные ребра вызова */
export interface CallEdgeWithMeta {
  to: FunctionId;
  line: number;
  type: CallType;
}

/** Метаданные вызывающего ребра */
export interface CallerEdgeWithMeta {
  from: FunctionId;
  line: number;
  type: CallType;
}

/** Метаданные ребра импорта */
export interface ImportEdgeWithMeta {
  to: FunctionId;
  name: string;
  type: ImportType;
  file: FileId;
}

/** Метаданные ребра импортера */
export interface ImporterEdgeWithMeta {
  from: FunctionId;
  name: string;
  type: ImportType;
  file: FileId;
}

// ==================== СТАТИСТИКА ====================

/** Статистика отчета */
export interface ReportStats {
  tf: number;
  tc: number;
  tm: number;
  tfils: number;
  te: number;
  tun: number;
  async: number;
  cy: boolean;
  avgCalls: number;
  maxCalls: number;
  tcn: number;
  tce: number;
  tuc: number;
  tcd: number;
  tr: number;
  ttd: number;
  tre: number;
  ti: number;
  tsf: number;
  funcsWithCalls: number;
  calledFuncs: number;
  modulesWithFunctions: number;
  filesWithFunctions: number;
  exportedWithCalls: number;
  defaultExports: number;
  typeExports: number;
  typeImports: number;
  di: number;
  cfg: number;
  ext: number;
  vt: number;
  asyncChains: number;
  closures: number;
  reflections: number;
  typeDeps: number;
}

// ==================== SELF FUNCTIONS ====================

/** Self функция: [sfId, fnId, fileId, line] */
export type SelfFunction = [SelfFunctionId, FunctionId, FileId, number];

// ==================== ВЕСЬ ОТЧЕТ ====================

/** Полный отчет AST анализатора */
export interface ASTReport {
  v: string;
  ts: string;
  r: string;
  mi: Record<ModuleId, string>;
  fl: Record<FileId, string>;
  fns: [FunctionId, string, ModuleId, FileId, number, FunctionFlags][];
  sf: SelfFunction[];
  cn: [ConstantId, string, unknown, ModuleId, FileId, number, FunctionFlags][];
  gr: {
    c: CallEdge[];
    i: ImportEdge[];
    e: ExportEdge[];
    h: InheritanceEdge[];
    td: TypeDependencyEdge[];
    re: ReExportEdge[];
    uc: ConstantUseEdge[];
    cd: ConstantDependencyEdge[];
    ce: [ConstantId, ExportType, FileId, number][];
    di: DynamicImport[];
    cfg: ConfigRef[];
    ext: ExternalLibrary[];
    vt: VueTemplate[];
    async: AsyncChain[];
    closures: Closure[];
    reflection: Reflection[];
    types: TypeDependency[];
  };
  st: ReportStats;
  flg: Record<string, string>;
  legend: {
    callTypes: Record<string, string>;
    importTypes: Record<string, string>;
    exportTypes: Record<string, string>;
    inheritanceTypes: Record<string, string>;
    typeDependencyTypes: Record<string, string>;
    constantTypes: Record<string, string>;
    dynamicImportTypes: Record<string, string>;
    configTypes: Record<string, string>;
    vueTemplateTypes: Record<string, string>;
  };
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ ====================

/** Результат поиска */
export interface SearchResult<T> {
  id: string;
  item: T;
  score?: number;
}

/** Результат анализа путей */
export interface PathResult {
  path: FunctionId[];
  nodes: FunctionEntity[];
  names: string[];
  length: number;
}

/** Статистика путей */
export interface PathStatistics {
  reachable: boolean;
  totalPaths: number;
  shortest: number | null;
  longest: number | null;
  averageLength: number;
  shortestPath?: FunctionId[];
  longestPath?: FunctionId[];
}

/** Результат анализа мёртвого кода */
export interface DeadCodeResult {
  total: number;
  percentage: string;
  functions: FunctionEntity[];
}

/** Результат анализа изолированных функций */
export interface IsolationResult {
  total: number;
  percentage: string;
  functions: FunctionEntity[];
}

/** Результат анализа пересечений */
export interface IntersectionResult {
  common: FunctionEntity[];
  count: number;
}

/** Детальная статистика */
export interface DetailedStats {
  summary: ReportStats;
  functions: {
    total: number;
    byModule: Record<string, number>;
    byFile: Record<string, number>;
  };
  calls: {
    total: number;
    byType: Record<string, number>;
    crossModule: number;
  };
  imports: {
    total: number;
    byType: Record<string, number>;
  };
  modules: {
    total: number;
    withFunctions: number;
  };
  files: {
    total: number;
    withFunctions: number;
  };
}

/** Кросс-модульный вызов */
export interface CrossModuleCall {
  from: FunctionId;
  fromModule: string;
  to: FunctionId;
  toModule: string;
  line: number;
  type: CallType;
}

/** Полная аналитика */
export interface Analytics {
  stats: DetailedStats;
  deadCode: DeadCodeResult;
  isolated: IsolationResult;
  mostCalled: { id: FunctionId; calls: number; function: FunctionEntity | null }[];
  mostCalling: { id: FunctionId; calls: number; function: FunctionEntity | null }[];
  externalLibraries: {
    name: string;
    version: string;
    type: number;
    count: number;
    files: FileId[];
  }[];
  dynamicImports: DynamicImport[];
  closures: Closure[];
  asyncFunctions: AsyncChain[];
  modules: ModuleEntity[];
  files: FileEntity[];
  constants: ConstantEntity[];
}

// ==================== ТИПЫ ДЛЯ МЕНЕДЖЕРОВ ====================

/** Интерфейс менеджера сущностей */
export interface EntityManager<T, ID> {
  get(id: ID): T | null;
  getAll(): T[];
  has(id: ID): boolean;
  size(): number;
  clear(): void;
}

/** Интерфейс менеджера функций */
export interface IFunctionManager extends EntityManager<FunctionEntity, FunctionId> {
  getByModule(moduleId: ModuleId): FunctionEntity[];
  getByFile(fileId: FileId): FunctionEntity[];
  getByName(name: string): FunctionEntity[];
  getCalls(functionId: FunctionId): CallEdgeWithMeta[];
  getCallers(functionId: FunctionId): CallerEdgeWithMeta[];
}

/** Интерфейс менеджера модулей */
export interface IModuleManager extends EntityManager<ModuleEntity, ModuleId> {
  getModuleOfFunction(functionId: FunctionId): ModuleEntity | null;
  getFunctions(moduleId: ModuleId): FunctionEntity[];
  getFiles(moduleId: ModuleId): FileEntity[];
}

/** Интерфейс менеджера файлов */
export interface IFileManager extends EntityManager<FileEntity, FileId> {
  getByPath(path: string): FileEntity | null;
  getFunctions(fileId: FileId): FunctionEntity[];
  getModule(fileId: FileId): ModuleEntity | null;
}

/** Интерфейс менеджера констант */
export interface IConstantManager extends EntityManager<ConstantEntity, ConstantId> {
  findByName(name: string): ConstantEntity[];
  getByModule(moduleId: ModuleId): ConstantEntity[];
  getByFile(fileId: FileId): ConstantEntity[];
}

// ==================== ТИПЫ ДЛЯ ПОИСКА ====================

/** Интерфейс поиска по имени */
export interface INameSearch {
  buildIndex(): void;
  findByName(name: string): FunctionEntity[];
  search(query: string): FunctionEntity[];
  fuzzySearch(query: string): (FunctionEntity & { score: number })[];
}

/** Интерфейс поиска по пути */
export interface IPathSearch {
  searchByPath(query: string): FileEntity[];
  searchByName(query: string): FileEntity[];
  getFunctionsByPath(pathQuery: string): FunctionEntity[];
}

// ==================== ТИПЫ ДЛЯ АНАЛИЗА ====================

/** Интерфейс анализатора мёртвого кода */
export interface IDeadCodeAnalyzer {
  analyze(): DeadCodeResult;
}

/** Интерфейс анализатора изолированных функций */
export interface IIsolationAnalyzer {
  analyze(): IsolationResult;
}

/** Интерфейс анализатора пересечений */
export interface IIntersectionAnalyzer {
  findIntersection<T extends { id: FunctionId } | FunctionId>(set1: T[], set2: T[]): T[];
  findCommonDependencies(fnId1: FunctionId, fnId2: FunctionId): FunctionEntity[];
  findCommonCallers(fnId1: FunctionId, fnId2: FunctionId): FunctionEntity[];
}

// ==================== ТИПЫ ДЛЯ ЭКСПОРТА ====================

/** Интерфейс экспортера в JSON */
export interface IJSONExporter {
  export(): string;
  exportPretty(): string;
  exportMinified(): string;
}

/** Интерфейс экспортера в DOT */
export interface IDOTExporter {
  exportPaths(paths: FunctionId[][]): string;
  exportGraph(): string;
}

// ==================== ТИПЫ ДЛЯ КЕША ====================

/** Интерфейс кеша */
export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
  entries(): IterableIterator<[K, V]>;
}

/** Конфигурация кеша */
export interface CacheConfig {
  maxSize?: number;
  ttl?: number;
}

// ==================== ТИПЫ ДЛЯ ФИЛЬТРОВ ====================

/** Фильтры для поиска */
export interface SearchFilters {
  moduleIds?: ModuleId[];
  fileIds?: FileId[];
  minLine?: number;
  maxLine?: number;
  onlyExported?: boolean;
  onlyAsync?: boolean;
  minComplexity?: number;
  maxDepth?: number;
}

/** Фильтры для анализа путей */
export interface PathFilters {
  maxDepth: number;
  maxPaths: number;
  includeCycles: boolean;
  onlyShortest: boolean;
}

// ==================== ТИПЫ ДЛЯ КОНФИГУРАЦИИ ====================

/** Конфигурация анализатора */
export interface AnalyzerConfig {
  maxDepth: number;
  maxPaths: number;
  enableCache: boolean;
  cacheSize: number;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  filters: SearchFilters;
}
