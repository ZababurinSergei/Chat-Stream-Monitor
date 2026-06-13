// src/refactor/ModuleExtractor.ts
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import type { ExtractedModule } from './index.js';

export interface Cluster {
  name: string;
  functions: string[];
  cohesionScore: number;
}

export class ModuleExtractor {
  private project: Project;
  private options: any;

  constructor(project: Project, options: any) {
    this.project = project;
    this.options = options;
  }

  async extractModules(sourcePath: string, clusters: Cluster[]): Promise<ExtractedModule[]> {
    const sourceFile = this.project.addSourceFileAtPath(sourcePath);
    const modulesDir = path.join(path.dirname(sourcePath), this.options.modulesDir || 'modules');

    await fs.promises.mkdir(modulesDir, { recursive: true });

    const modules: ExtractedModule[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (!cluster) continue;

      const moduleName = this.generateModuleName(cluster, i);
      const modulePath = path.join(modulesDir, `${moduleName}.js`);

      // Создаём новый SourceFile в памяти через AST
      const moduleFile = this.project.createSourceFile(modulePath, '', { overwrite: true });

      // Собираем все необходимые импорты через AST
      const importsMap = new Map<
        string,
        { named: Set<string>; default?: string; namespace?: string }
      >();

      for (const funcName of cluster.functions) {
        const node = this.findNode(sourceFile, funcName);
        if (!node) continue;

        // Находим все импорты, используемые в этом узле, через AST
        const usedImports = this.findUsedImports(sourceFile, node);

        for (const [importPath, importInfo] of usedImports) {
          if (!importsMap.has(importPath)) {
            importsMap.set(importPath, {
              named: new Set(),
              default: undefined,
              namespace: undefined,
            });
          }
          const info = importsMap.get(importPath)!;

          if (importInfo.named) {
            importInfo.named.forEach(n => info.named.add(n));
          }
          if (importInfo.default && !info.default) {
            info.default = importInfo.default;
          }
          if (importInfo.namespace && !info.namespace) {
            info.namespace = importInfo.namespace;
          }
        }
      }

      // Добавляем импорты в модуль через AST
      for (const [importPath, info] of importsMap) {
        if (info.namespace) {
          moduleFile.addImportDeclaration({
            namespaceImport: info.namespace,
            moduleSpecifier: importPath,
          });
        } else if (info.default) {
          const namedImports = info.named.size > 0 ? Array.from(info.named) : undefined;
          moduleFile.addImportDeclaration({
            defaultImport: info.default,
            namedImports,
            moduleSpecifier: importPath,
          });
        } else if (info.named.size > 0) {
          moduleFile.addImportDeclaration({
            namedImports: Array.from(info.named),
            moduleSpecifier: importPath,
          });
        }
      }

      const exportedNames: string[] = [];

      // Копируем функции/классы/константы в модуль через AST
      for (const funcName of cluster.functions) {
        const node = this.findNode(sourceFile, funcName);
        if (node) {
          // Получаем текст узла через AST
          const text = node.getText();

          // Добавляем export через AST если его нет
          let exportedText = text;
          if (!text.trim().startsWith('export')) {
            exportedText = `export ${text}`;
          }

          // Добавляем в новый файл через AST
          moduleFile.addStatements(exportedText);
          exportedNames.push(funcName);

          // Удаляем из исходного файла через AST
          this.safeRemoveNode(sourceFile, node);
        }
      }

      // Сохраняем модуль через AST
      await moduleFile.save();

      // Добавляем файл в проект через AST
      this.project.addSourceFileAtPath(modulePath);

      modules.push({
        name: moduleName,
        path: modulePath,
        exports: exportedNames,
        dependencies: Array.from(importsMap.keys()),
        originalNodes: [],
      });

      console.log(`  📦 Создан модуль: ${moduleName}.js (${exportedNames.length} экспортов)`);
    }

    // Сохраняем изменения в исходном файле через AST
    await sourceFile.save();

    return modules;
  }

  /**
   * Безопасно удаляет узел из исходного файла
   */
  private safeRemoveNode(sourceFile: SourceFile, node: Node): void {
    try {
      // Метод 1: Пробуем стандартное удаление
      if (typeof (node as any).remove === 'function') {
        (node as any).remove();
        console.log(`  🗑️ Удалён узел: ${node.getKindName()}`);
        return;
      }

      // Метод 2: Удаление через родительский синтаксис-лист
      const parent = node.getParent();
      if (parent) {
        const syntaxList = parent.getChildrenOfKind(SyntaxKind.SyntaxList)[0];
        if (syntaxList && typeof (syntaxList as any).removeChild === 'function') {
          (syntaxList as any).removeChild(node);
          console.log(`  🗑️ Удалён узел через SyntaxList: ${node.getKindName()}`);
          return;
        }
      }

      // Метод 3: Если это переменная в VariableStatement, удаляем всё выражение
      if (Node.isVariableDeclaration(node)) {
        const varStatement = node.getParent();
        if (varStatement && Node.isVariableStatement(varStatement)) {
          const declarations = varStatement.getDeclarations();
          if (declarations.length === 1) {
            const statementWithRemove = varStatement as any;
            if (typeof statementWithRemove.remove === 'function') {
              statementWithRemove.remove();
              console.log(`  🗑️ Удалено VariableStatement: ${node.getKindName()}`);
              return;
            }
          } else if (typeof (node as any).remove === 'function') {
            (node as any).remove();
            console.log(`  🗑️ Удалена переменная из списка: ${node.getKindName()}`);
            return;
          }
        }
      }

      // Метод 4: Если это функция или класс - пробуем удалить через родителя
      if (Node.isFunctionDeclaration(node) || Node.isClassDeclaration(node)) {
        const parent = node.getParent();
        if (parent) {
          const statementList = parent.getChildrenOfKind(SyntaxKind.SyntaxList)[0];
          if (statementList && typeof (statementList as any).removeChild === 'function') {
            (statementList as any).removeChild(node);
            console.log(`  🗑️ Удалена функция/класс: ${node.getKindName()}`);
            return;
          }
        }
      }

      // Метод 5: Fallback - удаление через замену текста
      const text = sourceFile.getText();
      const start = node.getStart();
      const end = node.getEnd();

      // Проверяем, что диапазон корректен
      if (start >= 0 && end > start && end <= text.length) {
        const newText = text.slice(0, start) + text.slice(end);
        sourceFile.replaceWithText(newText);
        console.log(`  🗑️ Удалён узел через замену текста: ${node.getKindName()}`);
        return;
      }

      console.warn(`  ⚠️ Не удалось удалить узел: ${node.getKindName()} - нет подходящего метода`);
    } catch (error) {
      console.warn(`  ⚠️ Ошибка при удалении узла ${node.getKindName()}: ${error}`);
    }
  }

  /**
   * Находит узел (функцию, класс, переменную) в файле через AST по имени
   */
  private findNode(sourceFile: SourceFile, name: string): Node | undefined {
    // Ищем функцию через AST
    const func = sourceFile.getFunction(name);
    if (func) return func;

    // Ищем класс через AST
    const cls = sourceFile.getClass(name);
    if (cls) return cls;

    // Ищем переменную через AST
    const variable = sourceFile.getVariableDeclaration(name);
    if (variable) return variable;

    // Ищем интерфейс через AST
    const intf = sourceFile.getInterface(name);
    if (intf) return intf;

    // Ищем type alias через AST
    const typeAlias = sourceFile.getTypeAlias(name);
    if (typeAlias) return typeAlias;

    // Ищем enum через AST
    const enumDecl = sourceFile.getEnum(name);
    if (enumDecl) return enumDecl;

    return undefined;
  }

  /**
   * Находит все импорты, используемые в узле, через AST
   */
  private findUsedImports(
    sourceFile: SourceFile,
    node: Node
  ): Map<string, { named?: Set<string>; default?: string; namespace?: string }> {
    const usedImports = new Map();

    // Получаем все идентификаторы из узла через AST
    const identifiers = this.findAllIdentifiersInNode(node);

    // Получаем все импорты из файла через AST
    const imports = sourceFile.getImportDeclarations();

    for (const imp of imports) {
      const moduleSpec = imp.getModuleSpecifierValue();
      const defaultImport = imp.getDefaultImport()?.getText();
      const namespaceImport = imp.getNamespaceImport()?.getText();
      const namedImports = imp.getNamedImports();

      const usedNamed = new Set<string>();

      // Проверяем default import через AST
      if (defaultImport && identifiers.has(defaultImport)) {
        const info = usedImports.get(moduleSpec) || {};
        info.default = defaultImport;
        usedImports.set(moduleSpec, info);
      }

      // Проверяем namespace import через AST
      if (namespaceImport) {
        // Ищем использование namespace.xxx
        const namespacePattern = new RegExp(`${namespaceImport}\\.\\w+`, 'g');
        const nodeText = node.getText();
        if (namespacePattern.test(nodeText)) {
          const info = usedImports.get(moduleSpec) || {};
          info.namespace = namespaceImport;
          usedImports.set(moduleSpec, info);
        }
      }

      // Проверяем named imports через AST
      for (const named of namedImports) {
        const name = named.getName();
        if (identifiers.has(name)) {
          usedNamed.add(name);
        }
      }

      if (usedNamed.size > 0) {
        const info = usedImports.get(moduleSpec) || {};
        info.named = usedNamed;
        usedImports.set(moduleSpec, info);
      }
    }

    return usedImports;
  }

  /**
   * Находит все идентификаторы в узле через обход AST
   */
  private findAllIdentifiersInNode(node: Node): Set<string> {
    const identifiers = new Set<string>();

    node.forEachDescendant(child => {
      if (Node.isIdentifier(child)) {
        identifiers.add(child.getText());
      }
    });

    return identifiers;
  }

  /**
   * Генерирует имя модуля из имени функции
   */
  private generateModuleName(cluster: Cluster, index: number): string {
    const firstName = cluster.functions.find(f => !f.startsWith('_') && f.length > 2);

    if (firstName) {
      // Преобразуем camelCase в kebab-case
      let name = firstName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();

      // Удаляем распространённые префиксы
      const prefixes = ['get-', 'set-', 'is-', 'has-', 'use-', 'fetch-', 'handle-', 'on-'];
      for (const prefix of prefixes) {
        if (name.startsWith(prefix)) {
          name = name.slice(prefix.length);
          break;
        }
      }

      if (name.length >= 3 && name !== '') {
        return name;
      }
    }

    return `module-${index + 1}`;
  }

  /**
   * Анализирует созданный модуль через AST
   */
  async analyzeModule(modulePath: string): Promise<{
    exports: string[];
    imports: string[];
    dependencies: string[];
    size: number;
  }> {
    const sourceFile = this.project.addSourceFileAtPath(modulePath);

    const exports: string[] = [];
    // Получаем все экспорты через AST
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [, declarations] of exportedDeclarations) {
      for (const decl of declarations) {
        let name: string | undefined;

        if (Node.isFunctionDeclaration(decl)) {
          name = decl.getName();
        } else if (Node.isClassDeclaration(decl)) {
          name = decl.getName();
        } else if (Node.isVariableDeclaration(decl)) {
          name = decl.getName();
        } else if (Node.isInterfaceDeclaration(decl)) {
          name = decl.getName();
        } else if (Node.isTypeAliasDeclaration(decl)) {
          name = decl.getName();
        } else if (Node.isEnumDeclaration(decl)) {
          name = decl.getName();
        }

        if (name) {
          exports.push(name);
        }
      }
    }

    // Получаем все импорты через AST
    const imports = sourceFile.getImportDeclarations().map(imp => imp.getModuleSpecifierValue());

    // Получаем все зависимости через AST
    const dependencies = sourceFile.getReferencedSourceFiles().map(sf => sf.getFilePath());

    // Получаем размер через AST
    const size = sourceFile.getText().length;

    return { exports, imports, dependencies, size };
  }

  /**
   * Получает все экспорты из файла через AST
   */
  getAllExports(sourceFile: SourceFile): string[] {
    const exports: string[] = [];
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [, declarations] of exportedDeclarations) {
      for (const decl of declarations) {
        if (Node.isFunctionDeclaration(decl)) {
          const name = decl.getName();
          if (name) exports.push(name);
        } else if (Node.isClassDeclaration(decl)) {
          const name = decl.getName();
          if (name) exports.push(name);
        } else if (Node.isVariableDeclaration(decl)) {
          const name = decl.getName();
          if (name) exports.push(name);
        }
      }
    }

    return exports;
  }

  /**
   * Получает все импорты из файла через AST
   */
  getAllImports(
    sourceFile: SourceFile
  ): Array<{ source: string; names: string[]; isDefault: boolean; isNamespace: boolean }> {
    const imports: Array<{
      source: string;
      names: string[];
      isDefault: boolean;
      isNamespace: boolean;
    }> = [];
    const importDeclarations = sourceFile.getImportDeclarations();

    for (const imp of importDeclarations) {
      const moduleSpec = imp.getModuleSpecifierValue();
      const defaultImport = imp.getDefaultImport();
      const namespaceImport = imp.getNamespaceImport();
      const namedImports = imp.getNamedImports();

      const names: string[] = [];

      if (defaultImport) {
        names.push(defaultImport.getText());
        imports.push({ source: moduleSpec, names, isDefault: true, isNamespace: false });
      }

      if (namespaceImport) {
        names.push(namespaceImport.getText());
        imports.push({ source: moduleSpec, names, isDefault: false, isNamespace: true });
      }

      for (const named of namedImports) {
        names.push(named.getName());
      }

      if (names.length > 0 && !defaultImport && !namespaceImport) {
        imports.push({ source: moduleSpec, names, isDefault: false, isNamespace: false });
      }
    }

    return imports;
  }
}
