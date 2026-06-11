// core/ast-parser.ts
import fs from 'fs';
import path from 'path';
import parser from '@typescript-eslint/parser';
import { walk } from 'estree-walker';
import { loadTsConfig, resolveAliasPath, getTsConfigDir } from './tsconfig-resolver.js';
import type { TsConfig } from './tsconfig-resolver.js';

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
const VUE_SCRIPT_PATTERNS = {
  basic: /<script[^>]*>([\s\S]*?)<\/script>/i,
  setup: /<script\s+setup[^>]*>([\s\S]*?)<\/script>/i,
  ts: /<script\s+lang="ts"[^>]*>([\s\S]*?)<\/script>/i,
  tsSetup: /<script\s+setup\s+lang="ts"[^>]*>([\s\S]*?)<\/script>/i,
};

// Кэш для tsconfig
let tsConfigCache: TsConfig | null = null;
let tsConfigBaseDirCache: string | null = null;

function getTsConfigForFile(filePath: string): TsConfig | null {
  const dir = path.dirname(filePath);
  if (tsConfigCache && tsConfigBaseDirCache === dir) {
    return tsConfigCache;
  }

  tsConfigBaseDirCache = dir;
  tsConfigCache = loadTsConfig(dir);
  return tsConfigCache;
}

// ==========================================
// VUE SFC ИНТЕРФЕЙСЫ
// ==========================================

export interface VueSFCData {
  script: string | null;
  scriptSetup: string | null;
  template: string | null;
  styles: string[];
  customBlocks: Record<string, string[]>;
  scriptType: 'basic' | 'setup' | 'ts' | 'tsSetup' | null;
}

// ==========================================
// ПАРСИНГ ФАЙЛОВ
// ==========================================

/**
 * Парсит Vue SFC файл и извлекает все блоки
 */
export function parseVueSFC(filePath: string): VueSFCData | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const result: VueSFCData = {
      script: null,
      scriptSetup: null,
      template: null,
      styles: [],
      customBlocks: {},
      scriptType: null,
    };

    // Приоритет: tsSetup > setup > ts > basic
    for (const [type, pattern] of Object.entries(VUE_SCRIPT_PATTERNS)) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const scriptContent = match[1];

        if (type === 'tsSetup') {
          result.scriptSetup = scriptContent;
          result.scriptType = 'tsSetup';
        } else if (type === 'setup') {
          result.scriptSetup = scriptContent;
          if (result.scriptType !== 'tsSetup') result.scriptType = 'setup';
        } else if (type === 'ts') {
          result.script = scriptContent;
          if (result.scriptType !== 'tsSetup') result.scriptType = 'ts';
        } else if (type === 'basic' && !result.script && !result.scriptSetup) {
          result.script = scriptContent;
          result.scriptType = 'basic';
        }
      }
    }

    // Извлекаем template
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    if (templateMatch && templateMatch[1]) {
      result.template = templateMatch[1];
    }

    // Извлекаем все style блоки
    const styleMatches = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    result.styles = styleMatches
      .map(m => m[1])
      .filter((content): content is string => content !== undefined && content !== null);

    // Извлекаем пользовательские блоки (docs, i18n, etc.)
    const customBlockPattern = /<(\w+)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = customBlockPattern.exec(content)) !== null) {
      const [_, blockName, blockContent] = match;
      if (blockName && !['script', 'template', 'style'].includes(blockName)) {
        if (!result.customBlocks[blockName]) {
          result.customBlocks[blockName] = [];
        }
        if (blockContent) {
          result.customBlocks[blockName].push(blockContent);
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`❌ Ошибка парсинга Vue файла ${filePath}:`, error);
    return null;
  }
}

/**
 * Парсит файл в AST с поддержкой Vue SFC
 * @param filePath Путь к файлу
 * @param _options Опции парсинга (зарезервировано)
 * @returns AST дерево или null
 */
export function parseFile(filePath: string, _options?: { extractTemplate?: boolean }): any {
  try {
    let code = fs.readFileSync(filePath, 'utf-8');
    let isVue = false;
    let isTypeScript = false;

    if (filePath.endsWith('.vue')) {
      isVue = true;
      const sfc = parseVueSFC(filePath);

      if (!sfc) {
        console.warn(`⚠️ Не удалось разобрать Vue файл ${filePath}`);
        return null;
      }

      // Определяем тип скрипта
      const scriptType = sfc.scriptType || 'unknown';
      isTypeScript = scriptType === 'ts' || scriptType === 'tsSetup';

      // Используем scriptSetup или script
      const scriptContent = sfc.scriptSetup || sfc.script;

      if (!scriptContent) {
        console.warn(`⚠️ В Vue файле ${filePath} не найден script блок`);
        return null;
      }

      code = scriptContent;
      console.log(`📄 Vue файл: ${path.basename(filePath)} (${scriptType}, TS: ${isTypeScript})`);

      if (sfc.styles.length > 0) {
        console.log(`   🎨 Styles: ${sfc.styles.length} блоков`);
      }
    } else {
      // Определяем TypeScript по расширению
      isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    }

    // Настройки парсера
    const parserOptions: any = {
      ecmaVersion: 2026,
      sourceType: 'module',
      loc: true,
      range: true,
      comment: true,
      tokens: true,
    };

    // Добавляем поддержку TypeScript
    if (isTypeScript) {
      parserOptions.ecmaFeatures = {
        jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
      };
    }

    const ast = parser.parse(code, parserOptions);

    // Логируем количество импортов для отладки
    if (isVue) {
      let importCount = 0;
      if (ast && ast.body) {
        importCount = ast.body.filter((node: any) => node.type === 'ImportDeclaration').length;
      }
      console.log(`   📥 Найдено импортов: ${importCount}`);
    }

    return ast;
  } catch (e) {
    console.error(
      `❌ Ошибка парсинга файла ${filePath}:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

export function isExternalModule(importTarget: string): boolean {
  // Алиасы (начинаются с @, #, ~ и т.д.) считаем внутренними
  if (
    importTarget.startsWith('@') ||
    importTarget.startsWith('#') ||
    importTarget.startsWith('~')
  ) {
    return false;
  }

  return (
    !importTarget.startsWith('.') && !importTarget.startsWith('/') && !path.isAbsolute(importTarget)
  );
}

export function resolveFilePath(baseDir: string, targetPath: string): string | null {
  // 1. Сначала проверяем алиасы из tsconfig
  const tsConfig = getTsConfigForFile(baseDir);
  const tsConfigDir = getTsConfigDir();

  // Для алиасов используем директорию tsconfig как корень
  const aliasedPath = resolveAliasPath(targetPath, tsConfigDir || baseDir, tsConfig);

  if (aliasedPath && fs.existsSync(aliasedPath)) {
    console.log(`   🔗 Алиас: ${targetPath} → ${path.relative(process.cwd(), aliasedPath)}`);
    return aliasedPath;
  }

  // 2. Обычный резолвинг
  const fullPath = path.resolve(baseDir, targetPath);

  // 2.1 Проверяем как файл
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // 2.2 Проверяем как директорию с index файлом
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const indexPath = path.join(fullPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        console.log(`   📁 Директория → index${ext}: ${targetPath}`);
        return indexPath;
      }
    }
  }

  // 3. Проверяем с расширениями
  for (const ext of SUPPORTED_EXTENSIONS) {
    const withExt = fullPath + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }

    // Проверяем index файлы
    const indexPath = path.join(fullPath, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      console.log(`   📁 Index файл: ${targetPath} → index${ext}`);
      return indexPath;
    }
  }

  // 4. Проверяем относительно директории tsconfig
  if (tsConfigDir && tsConfigDir !== baseDir) {
    const fromRootPath = path.resolve(tsConfigDir, targetPath);

    if (fs.existsSync(fromRootPath) && fs.statSync(fromRootPath).isFile()) {
      return fromRootPath;
    }

    if (fs.existsSync(fromRootPath) && fs.statSync(fromRootPath).isDirectory()) {
      for (const ext of SUPPORTED_EXTENSIONS) {
        const indexPath = path.join(fromRootPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    for (const ext of SUPPORTED_EXTENSIONS) {
      const withExt = fromRootPath + ext;
      if (fs.existsSync(withExt)) {
        return withExt;
      }
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

// Экспорт конфигураций для использования в других модулях
export { DEFAULT_EXCLUDE_PATTERNS, SUPPORTED_EXTENSIONS };
