// core/tsconfig-resolver.ts
import fs from 'fs';
import path from 'path';

export interface TsConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>;
    baseUrl?: string;
  };
}

export interface AliasMapping {
  [alias: string]: string[];
}

// Глобальная переменная для явного пути к tsconfig
let explicitTsConfigPath: string | null = null;

export function setTsConfigPath(configPath: string) {
  explicitTsConfigPath = configPath;
}

export function loadTsConfig(startDir: string = process.cwd()): TsConfig | null {
  // Если указан явный путь, используем его
  if (explicitTsConfigPath) {
    const resolvedPath = path.resolve(process.cwd(), explicitTsConfigPath);
    if (fs.existsSync(resolvedPath)) {
      try {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        console.log(`📄 Загружен tsconfig: ${resolvedPath}`);
        return JSON.parse(content) as TsConfig;
      } catch (error) {
        console.warn(`⚠️ Ошибка парсинга ${resolvedPath}:`, error);
      }
    } else {
      console.warn(`⚠️ Файл tsconfig не найден: ${resolvedPath}`);
    }
  }

  // Иначе ищем автоматически
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const content = fs.readFileSync(tsConfigPath, 'utf-8');
        return JSON.parse(content) as TsConfig;
      } catch (error) {
        console.warn(`⚠️ Ошибка парсинга ${tsConfigPath}:`, error);
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

export function resolveAliasPath(
  importPath: string,
  baseDir: string,
  tsConfig: TsConfig | null
): string | null {
  if (!tsConfig?.compilerOptions?.paths) {
    return null;
  }

  const { paths, baseUrl = '.' } = tsConfig.compilerOptions;

  for (const [alias, targets] of Object.entries(paths)) {
    // Преобразуем паттерн алиаса в регулярное выражение
    const pattern = alias.replace(/\*/g, '(.*)');
    const regex = new RegExp(`^${pattern}$`);
    const match = importPath.match(regex);

    if (match && targets && targets.length > 0) {
      // Берем первый целевой путь
      let targetPath = targets[0];
      if (!targetPath) continue;

      // Заменяем * на захваченные группы
      for (let i = 1; i < match.length; i++) {
        const replacement = match[i];
        if (replacement !== undefined) {
          targetPath = targetPath.replace('*', replacement);
        }
      }

      // Резолвим относительно baseUrl
      const baseUrlPath = path.resolve(baseDir, baseUrl);
      const resolvedPath = path.resolve(baseUrlPath, targetPath);

      return resolvedPath;
    }
  }

  return null;
}
