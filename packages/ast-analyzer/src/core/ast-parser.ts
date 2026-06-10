// core/ast-parser.ts
import fs from 'fs';
import path from 'path';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { loadTsConfig, resolveAliasPath, TsConfig } from './tsconfig-resolver.js';

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const SUPPORTED_EXTENSIONS = ['.ts', '.mjs', '.js', '.tsx', '.jsx', '.vue'];
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
const VUE_SCRIPT_PATTERN = /<script[^>]*>([\s\S]*?)<\/script>/i;

// Кэш для tsconfig
let tsConfigCache: TsConfig | null = null;
let tsConfigBaseDir: string | null = null;

function getTsConfigForFile(filePath: string): TsConfig | null {
  const dir = path.dirname(filePath);
  if (tsConfigCache && tsConfigBaseDir === dir) {
    return tsConfigCache;
  }

  tsConfigBaseDir = dir;
  tsConfigCache = loadTsConfig(dir);
  return tsConfigCache;
}

// ==========================================
// ПАРСИНГ ФАЙЛОВ
// ==========================================
export function parseFile(filePath: string): any {
  try {
    let code = fs.readFileSync(filePath, 'utf-8');

    if (filePath.endsWith('.vue')) {
      const scriptMatch = code.match(VUE_SCRIPT_PATTERN);
      if (!scriptMatch) {
        console.warn(`⚠️ В Vue файле ${filePath} не найден script блок`);
        return null;
      }
      if (scriptMatch[1]) {
        code = scriptMatch[1];
      } else {
        console.warn(`⚠️ В Vue файле ${filePath} не удалось извлечь script блок`);
        return null;
      }
    }

    return parser.parse(code, {
      ecmaVersion: 2026,
      sourceType: 'module',
      loc: true,
      range: true,
      comment: true,
      tokens: true,
    });
  } catch (e) {
    console.error(
      `❌ Ошибка парсинга файла ${filePath}:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

export function isExternalModule(importTarget: string): boolean {
  return (
    !importTarget.startsWith('.') && !importTarget.startsWith('/') && !path.isAbsolute(importTarget)
  );
}

export function resolveFilePath(baseDir: string, targetPath: string): string | null {
  // 1. Сначала проверяем алиасы из tsconfig
  const tsConfig = getTsConfigForFile(baseDir);
  const aliasedPath = resolveAliasPath(targetPath, baseDir, tsConfig);

  if (aliasedPath && fs.existsSync(aliasedPath)) {
    // console.log(`   🔗 Алиас: ${targetPath} → ${aliasedPath}`); // можно раскомментировать для отладки
    return aliasedPath;
  }

  // 2. Обычный резолвинг
  const fullPath = path.resolve(baseDir, targetPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath;

  // 3. Проверяем с расширениями
  for (const ext of SUPPORTED_EXTENSIONS) {
    const withExt = fullPath + ext;
    if (fs.existsSync(withExt)) return withExt;

    // Проверяем index файлы
    const indexPath = path.join(fullPath, `index${ext}`);
    if (fs.existsSync(indexPath)) return indexPath;

    if (ext === '.vue') {
      const vuePath = fullPath.replace(/\.(js|ts)$/, '.vue');
      if (fs.existsSync(vuePath)) return vuePath;
    }
  }

  return null;
}

export function getAllProjectFiles(
  dir: string,
  filesList: string[] = [],
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): string[] {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const name = path.join(dir, file);
      if (excludePatterns.some(p => name.includes(p))) continue;
      if (fs.statSync(name).isDirectory()) {
        getAllProjectFiles(name, filesList, excludePatterns);
      } else if (SUPPORTED_EXTENSIONS.includes(path.extname(name))) {
        filesList.push(name);
      }
    }
  } catch (error) {
    console.warn(
      `⚠️ Ошибка чтения ${dir}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
  return filesList;
}

// Реэкспорт walk для удобства использования в других модулях
export { walk };
