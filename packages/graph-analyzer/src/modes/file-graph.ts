// modes/file-graph.ts
import path from 'path';
import { parseFile, walk } from '../core/ast-parser.js';

/**
 * Строит внутренний граф зависимостей внутри одного файла
 * @param filePath Путь к файлу
 * @param _options Опции (maxDepth - максимальная глубина анализа) - опционально, пока не используется
 * @returns Объект с графом зависимостей или null при ошибке
 */
export function buildFileInternalGraph(
  filePath: string,
  _options: { maxDepth?: number } = {}
): { rootKey: string; graph: Record<string, string[]> } | null {
  // maxDepth параметр зарезервирован для будущего использования
  // const { maxDepth = 5 } = _options;

  const ast = parseFile(filePath);
  if (!ast) return null;

  const declarations: Record<string, { type: string; node: any }> = {};
  const relations: Array<{ from: string; to: string }> = [];

  // Сбор всех объявлений в файле
  ast.body.forEach((node: any) => {
    let targetNode = node;

    // Обработка экспортов
    if (
      (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') &&
      node.declaration
    ) {
      targetNode = node.declaration;
    }

    // Функции
    if (targetNode.type === 'FunctionDeclaration' && targetNode.id) {
      declarations[targetNode.id.name] = { type: 'function', node: targetNode };
    }
    // Переменные
    else if (targetNode.type === 'VariableDeclaration') {
      targetNode.declarations.forEach((decl: any) => {
        if (decl.id && decl.id.name) {
          declarations[decl.id.name] = { type: 'variable', node: decl };
        }
      });
    }
    // Классы
    else if (targetNode.type === 'ClassDeclaration' && targetNode.id) {
      declarations[targetNode.id.name] = { type: 'class', node: targetNode };
    }
  });

  // Поиск связей между объявлениями
  Object.keys(declarations).forEach((currentEntity: string) => {
    const declaration = declarations[currentEntity];
    if (!declaration) return;

    const entityNode = declaration.node;

    walk(entityNode, {
      enter(node: any) {
        // Если встретили идентификатор (вызов переменной/функции)
        if (node.type === 'Identifier') {
          const name = node.name;
          // Проверяем, ссылается ли он на другое объявление в этом же файле
          if (name !== currentEntity && declarations[name]) {
            relations.push({ from: currentEntity, to: name });
          }
        }
      },
    });
  });

  // Формирование графа
  const fileGraph: Record<string, string[]> = {};
  Object.keys(declarations).forEach((key: string) => {
    fileGraph[key] = [];
  });

  relations.forEach((rel: { from: string; to: string }) => {
    const fromGraph = fileGraph[rel.from];
    if (fromGraph && !fromGraph.includes(rel.to)) {
      fromGraph.push(rel.to);
    }
  });

  return {
    rootKey: path.basename(filePath),
    graph: fileGraph,
  };
}
