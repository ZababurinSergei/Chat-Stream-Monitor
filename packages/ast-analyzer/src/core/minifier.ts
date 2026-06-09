// core/minifier.ts
import fs from 'fs';
import { walk } from '../core/ast-parser.js';
import { parseFile } from '../core/ast-parser.js';

/**
 * Сжимает код, заменяя тела функций и значения переменных на плейсхолдеры
 * @param code Исходный код
 * @param ast AST дерево (опционально, если не передан - будет пропущен)
 * @returns Сжатая версия кода (только сигнатуры)
 */
export function minifyCodeString(code: string, ast: any): string {
  if (!ast) return code;

  const cuts: Array<{ start: number; end: number; replaceWith: string }> = [];

  walk(ast, {
    enter(node: any) {
      // Замена тел функций
      if (
        (node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression' ||
          node.type === 'MethodDefinition') &&
        node.body
      ) {
        if (node.body.range && node.body.range[0] < node.body.range[1]) {
          cuts.push({
            start: node.body.range[0] + 1,
            end: node.body.range[1] - 1,
            replaceWith: ' /* реализация скрыта */ ',
          });
        }
      }

      // Замена тел стрелочных функций с блоком
      if (
        node.type === 'ArrowFunctionExpression' &&
        node.body &&
        node.body.type === 'BlockStatement'
      ) {
        if (node.body.range) {
          cuts.push({
            start: node.body.range[0] + 1,
            end: node.body.range[1] - 1,
            replaceWith: ' /* реализация скрыта */ ',
          });
        }
      }

      // Замена значений переменных (кроме функций)
      if (
        node.type === 'VariableDeclarator' &&
        node.init &&
        !['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init.type)
      ) {
        if (node.init.range) {
          cuts.push({
            start: node.init.range[0],
            end: node.init.range[1],
            replaceWith: '/* значение скрыто */',
          });
        }
      }
    },
  });

  // Применяем замены от конца к началу, чтобы не сбивать индексы
  cuts.sort((a, b) => b.start - a.start);
  let minifiedCode = code;
  for (const cut of cuts) {
    minifiedCode = minifiedCode.slice(0, cut.start) + cut.replaceWith + minifiedCode.slice(cut.end);
  }

  // Очистка лишних пустых строк
  return minifiedCode.replace(/^\s*[\r\n]/gm, '\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Сжимает файл для отправки в ИИ (сохраняет только сигнатуры)
 * @param filePath Путь к файлу
 * @returns Сжатая версия кода файла
 */
export function minifyForAI(filePath: string): string {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parseFile(filePath);
  return minifyCodeString(code, ast);
}
