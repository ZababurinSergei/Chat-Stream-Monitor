// Общие типы для всех пакетов
export interface FileNode {
  type: "file" | "directory";
  path: string;
  name: string;
  size?: number;
  extension?: string;
  content?: string;
  children?: Record<string, FileNode>;
  metadata?: Record<string, any>;
}

export interface ScanStats {
  totalFiles: number;
  totalDirectories: number;
  scannedFiles: number;
  skippedFiles: number;
  errors: number;
  totalSize: number;
  startTime: Date;
  endTime: Date;
}

export interface Config {
  directories: DirectoryConfig[];
  excludePatterns: ExcludePatterns;
  scanOptions: ScanOptions;
  report?: ReportConfig;
  supportedExtensions?: string[];
  specialFiles?: string[];
}

export interface DirectoryConfig {
  id: string;
  name: string;
  description: string;
  description_en?: string;
  required?: boolean;
  excluded?: boolean;
}

export interface ExcludePatterns {
  directories: string[];
  files: string[];
}

export interface ScanOptions {
  recursive: boolean;
  followSymlinks: boolean;
  maxDepth: number;
  excludeExcludedDirs: boolean;
  respectExcludePatterns: boolean;
}

export interface ReportConfig {
  enabled: boolean;
  path: string;
  append: boolean;
  includeTimestamp: boolean;
  includeSystemInfo: boolean;
  language: "russian" | "english";
}

export interface AnalysisResult {
  filePath: string;
  fileName: string;
  stats: {
    totalLines: number;
    totalExports: number;
    totalFunctions: number;
    totalClasses: number;
    totalConstants: number;
    totalImports: number;
  };
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  callGraph: Record<string, string[]>;
  fullCode: string;
}

export interface ImportInfo {
  source: string;
  specifiers: Array<{ local: string; imported: string }>;
}

export interface ExportInfo {
  name: string;
  type: "function" | "class" | "constant";
  isDefault?: boolean;
}

export interface FunctionInfo {
  name: string;
  exported: boolean;
  params: string[];
  async: boolean;
  startLine: number;
  endLine: number;
}

export interface ClassInfo {
  name: string;
  exported: boolean;
  methods: Array<{ name: string; kind: string }>;
}
