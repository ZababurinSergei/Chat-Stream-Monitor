// modes/project-graph.ts
import path from 'path';
import fs from 'fs';
import { parseFile, resolveFilePath, isExternalModule } from '../core/ast-parser.js';
import { IGNORE_NODE_MODULES } from '../config.js';
import { walk } from 'estree-walker';

/**
 * Рекурсивно резолвит реэкспорты (export {...} from '...')
 * @param filePath - путь к файлу, который может быть реэкспортом
 * @param importTarget - целевой импорт (то, что после 'from')
 * @returns разрешенный путь к файлу или null
 */
function resolveExports(filePath: string, importTarget: string): string | null {
  const dir = path.dirname(filePath);
  const resolved = resolveFilePath(dir, importTarget);

  if (!resolved) return null;

  try {
    // Проверяем, не является ли файл реэкспортом (index.ts или подобный)
    const content = fs.readFileSync(resolved, 'utf-8');

    // Ищем реэкспорты вида: export { something } from './module'
    const reexportPattern = /export\s+{\s*[\w\s,]*\s*}\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = reexportPattern.exec(content)) !== null) {
      if (match[1]) {
        // Рекурсивно резолвим вложенный реэкспорт
        const nestedResolved = resolveExports(resolved, match[1]);
        if (nestedResolved) return nestedResolved;
      }
    }

    // Ищем реэкспорт по умолчанию: export { default } from './module'
    const defaultReexportPattern = /export\s+{\s*default\s*}\s+from\s+['"]([^'"]+)['"]/;
    const defaultMatch = content.match(defaultReexportPattern);
    if (defaultMatch && defaultMatch[1]) {
      const nestedResolved = resolveExports(resolved, defaultMatch[1]);
      if (nestedResolved) return nestedResolved;
    }

    // Ищем export * from './module'
    const starReexportPattern = /export\s+\*\s+from\s+['"]([^'"]+)['"]/;
    const starMatch = content.match(starReexportPattern);
    if (starMatch && starMatch[1]) {
      const nestedResolved = resolveExports(resolved, starMatch[1]);
      if (nestedResolved) return nestedResolved;
    }
  } catch (error) {
    // Файл не читается - пропускаем
  }

  return resolved;
}

/**
 * Строит граф зависимостей проекта от точки входа
 * @param entryPoint Точка входа (файл или директория)
 * @param maxDepth Максимальная глубина анализа (по умолчанию Infinity)
 * @returns Объект с корневым ключом и графом зависимостей
 */
export function buildProjectGraph(
  entryPoint: string,
  maxDepth: number = Infinity
): { rootKey: string; graph: Record<string, string[]> } {
  const graph: Record<string, string[]> = {};
  const visited = new Set<string>();
  const rootAbsPath = path.resolve(entryPoint);

  function scan(filePath: string, currentDepth: number): void {
    if (currentDepth > maxDepth) return;

    const absolutePath = path.resolve(filePath);
    if (visited.has(absolutePath)) return;
    visited.add(absolutePath);

    const relativeKey = path.relative(process.cwd(), absolutePath) || absolutePath;
    graph[relativeKey] = [];

    const ast = parseFile(absolutePath);
    if (!ast) return;

    const currentDir = path.dirname(absolutePath);
    const rawImports: string[] = [];

    // Обходим AST для сбора импортов
    walk(ast, {
      enter(node: any) {
        // Статический импорт
        if (
          (node.type === 'ImportDeclaration' ||
            node.type === 'ExportNamedDeclaration' ||
            node.type === 'ExportAllDeclaration') &&
          node.source
        ) {
          rawImports.push(node.source.value);
        }
        // Динамический импорт
        if (node.type === 'ImportExpression' && node.source && node.source.type === 'Literal') {
          rawImports.push(node.source.value);
        }
      },
    });

    // Обрабатываем каждый импорт
    rawImports.forEach(target => {
      // Пропускаем внешние модули, если нужно
      if (IGNORE_NODE_MODULES && isExternalModule(target)) return;

      if (!isExternalModule(target)) {
        // Сначала пытаемся резолвить через реэкспорты
        let resolvedAbs = resolveExports(absolutePath, target);

        // Если не нашли через реэкспорты, пробуем обычный резолвинг
        if (!resolvedAbs) {
          resolvedAbs = resolveFilePath(currentDir, target);
        }

        if (resolvedAbs) {
          const depRelativeKey = path.relative(process.cwd(), resolvedAbs);
          const currentGraph = graph[relativeKey];
          if (currentGraph && !currentGraph.includes(depRelativeKey)) {
            currentGraph.push(depRelativeKey);
          }
          scan(resolvedAbs, currentDepth + 1);
        } else {
          const currentGraph = graph[relativeKey];
          if (currentGraph && !currentGraph.includes(target)) {
            // Если не удалось разрешить путь, добавляем как есть
            currentGraph.push(target);
          }
        }
      }
    });
  }

  scan(rootAbsPath, 1);
  return { rootKey: path.relative(process.cwd(), rootAbsPath) || rootAbsPath, graph };
}
