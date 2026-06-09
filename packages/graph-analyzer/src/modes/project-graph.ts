// modes/project-graph.ts
import path from 'path';
import { parseFile, resolveFilePath, isExternalModule } from '../core/ast-parser.js';
import { IGNORE_NODE_MODULES } from '../config.js';

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
    const { walk } = require('estree-walker');
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
        const resolvedAbs = resolveFilePath(currentDir, target);
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
