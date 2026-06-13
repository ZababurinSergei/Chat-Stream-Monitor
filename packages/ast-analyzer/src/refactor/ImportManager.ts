// Directory/ast-analyzer/src/refactor/ImportManager.ts
import { Project, SourceFile } from 'ts-morph';
import path from 'path';
import type { ExtractedModule } from './index.js';

export class ImportManager {
  constructor(private project: Project) {}

  async updateImports(sourcePath: string, modules: ExtractedModule[]): Promise<void> {
    const sourceFile = this.project.addSourceFileAtPath(sourcePath);

    if (!sourceFile) {
      console.warn(`⚠️ Не удалось загрузить файл: ${sourcePath}`);
      return;
    }

    console.log(`\n📦 Обновление импортов в ${path.basename(sourcePath)}`);

    // Сначала собираем все экспорты, которые были перенесены
    const allExportedNames = new Set<string>();
    const moduleMap = new Map<string, ExtractedModule>();

    for (const module of modules) {
      for (const exp of module.exports) {
        allExportedNames.add(exp);
        moduleMap.set(exp, module);
      }
    }

    // Определяем, какие экспорты реально используются в файле
    const usedExportsByModule = new Map<ExtractedModule, Set<string>>();

    for (const exp of allExportedNames) {
      if (this.isExportUsed(sourceFile, exp)) {
        const module = moduleMap.get(exp);
        if (module) {
          if (!usedExportsByModule.has(module)) {
            usedExportsByModule.set(module, new Set());
          }
          usedExportsByModule.get(module)!.add(exp);
        }
      }
    }

    // Добавляем или обновляем импорты для каждого модуля
    for (const [module, usedExports] of usedExportsByModule) {
      if (usedExports.size === 0) continue;

      const relativePath = this.getRelativePath(sourcePath, module.path);
      const existingImport = sourceFile.getImportDeclaration(relativePath);

      const usedExportsArray = Array.from(usedExports);

      if (!existingImport) {
        sourceFile.addImportDeclaration({
          namedImports: usedExportsArray,
          moduleSpecifier: relativePath,
        });
        console.log(
          `  ➕ Добавлен импорт: { ${usedExportsArray.join(', ')} } from '${relativePath}'`
        );
      } else {
        // Обновляем существующий импорт
        const existingSpecifiers = existingImport.getNamedImports().map(s => s.getName());
        const newSpecifiers = [...new Set([...existingSpecifiers, ...usedExportsArray])];

        if (newSpecifiers.length !== existingSpecifiers.length) {
          existingImport.remove();
          sourceFile.addImportDeclaration({
            namedImports: newSpecifiers,
            moduleSpecifier: relativePath,
          });
          console.log(
            `  🔄 Обновлён импорт: { ${newSpecifiers.join(', ')} } from '${relativePath}'`
          );
        }
      }
    }

    // Удаляем только те импорты, которые точно не используются
    this.removeUnusedImportsSafe(sourceFile, allExportedNames);

    await sourceFile.save();
  }

  async addMissingImports(sourcePath: string, modules: ExtractedModule[]): Promise<void> {
    const sourceFile = this.project.addSourceFileAtPath(sourcePath);
    if (!sourceFile) return;

    const moduleExports = new Map<string, string[]>();
    for (const module of modules) {
      const relativePath = this.getRelativePath(sourcePath, module.path);
      moduleExports.set(relativePath, module.exports);
    }

    const text = sourceFile.getText();
    const usedExports = new Map<string, string[]>();

    for (const [modulePath, exports] of moduleExports) {
      const used: string[] = [];
      for (const exp of exports) {
        const regex = new RegExp(`\\b${this.escapeRegex(exp)}\\b`, 'g');
        if (regex.test(text)) {
          used.push(exp);
        }
      }
      if (used.length > 0) {
        usedExports.set(modulePath, used);
      }
    }

    for (const [modulePath, exports] of usedExports) {
      const existingImport = sourceFile.getImportDeclaration(modulePath);
      if (!existingImport) {
        sourceFile.addImportDeclaration({
          namedImports: exports,
          moduleSpecifier: modulePath,
        });
        console.log(`  ➕ Добавлен импорт: { ${exports.join(', ')} } from '${modulePath}'`);
      } else {
        const existingSpecifiers = existingImport.getNamedImports().map(s => s.getName());
        const newSpecifiers = [...new Set([...existingSpecifiers, ...exports])];
        if (newSpecifiers.length > existingSpecifiers.length) {
          existingImport.remove();
          sourceFile.addImportDeclaration({
            namedImports: newSpecifiers,
            moduleSpecifier: modulePath,
          });
          console.log(`  🔄 Обновлён импорт: { ${newSpecifiers.join(', ')} } from '${modulePath}'`);
        }
      }
    }

    await sourceFile.save();
  }

  private removeUnusedImportsSafe(sourceFile: SourceFile, exportedNames: Set<string>): void {
    const imports = sourceFile.getImportDeclarations();
    const usedIdentifiers = this.collectUsedIdentifiersSafe(sourceFile, exportedNames);

    let removedCount = 0;

    for (const imp of imports) {
      const specifiers = imp.getNamedImports();
      const moduleSpec = imp.getModuleSpecifier().getLiteralValue();

      if (moduleSpec.includes('/modules/') || moduleSpec.startsWith('./modules/')) {
        continue;
      }

      const unused = specifiers.filter(s => !usedIdentifiers.has(s.getName()));

      if (unused.length === specifiers.length && specifiers.length > 0) {
        console.log(`  🗑️ Удалён неиспользуемый импорт: ${moduleSpec}`);
        imp.remove();
        removedCount++;
      } else if (unused.length > 0 && unused.length < specifiers.length) {
        const keep = specifiers.filter(s => usedIdentifiers.has(s.getName()));
        imp.remove();
        sourceFile.addImportDeclaration({
          namedImports: keep.map(s => s.getName()),
          moduleSpecifier: moduleSpec,
        });
        console.log(
          `  🧹 Удалены неиспользуемые импорты: ${unused.map(s => s.getName()).join(', ')} из ${moduleSpec}`
        );
      }
    }

    if (removedCount > 0) {
      console.log(`  📊 Удалено неиспользуемых импортов: ${removedCount}`);
    }
  }

  private collectUsedIdentifiersSafe(
    sourceFile: SourceFile,
    exportedNames: Set<string>
  ): Set<string> {
    const used = new Set<string>();
    const content = sourceFile.getText();

    for (const name of exportedNames) {
      used.add(name);
    }

    const sourceFileNode = sourceFile.compilerNode;
    if (sourceFileNode) {
      const walk = (node: any) => {
        if (!node) return;
        if (node.kind === 79) {
          const name = node.getText();
          if (name && !this.isReservedWord(name)) {
            used.add(name);
          }
        }
        node.forEachChild(walk);
      };
      walk(sourceFileNode);
    } else {
      const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      let match;
      while ((match = identifierPattern.exec(content)) !== null) {
        const identifier = match[1];
        if (identifier && !this.isReservedWord(identifier)) {
          used.add(identifier);
        }
      }
    }

    return used;
  }

  private isExportUsed(sourceFile: SourceFile, exportName: string): boolean {
    const content = sourceFile.getText();

    const patterns = [
      new RegExp(`\\b${this.escapeRegex(exportName)}\\s*\\(`, 'g'),
      new RegExp(`\\b${this.escapeRegex(exportName)}\\b`, 'g'),
      new RegExp(`['"\`]${this.escapeRegex(exportName)}['"\`]`, 'g'),
      new RegExp(`return\\s+${this.escapeRegex(exportName)}\\b`, 'g'),
      new RegExp(`export\\s+{[^}]*${this.escapeRegex(exportName)}[^}]*}`, 'g'),
    ];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  private getRelativePath(from: string, to: string): string {
    let relative = path.relative(path.dirname(from), to);
    relative = relative.replace(/\.(ts|js|tsx|jsx|vue)$/, '');
    if (!relative.startsWith('.') && !relative.startsWith('@')) {
      relative = './' + relative;
    }
    return relative.replace(/\\/g, '/');
  }

  private collectUsedIdentifiersLegacy(sourceFile: SourceFile): Set<string> {
    const used = new Set<string>();
    const content = sourceFile.getText();

    const sourceFileNode = sourceFile.compilerNode;
    if (sourceFileNode) {
      const walk = (node: any) => {
        if (!node) return;
        if (node.kind === 79) {
          const name = node.getText();
          if (name && !this.isReservedWord(name)) {
            used.add(name);
          }
        }
        node.forEachChild(walk);
      };
      walk(sourceFileNode);
    } else {
      const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      let match;
      while ((match = identifierPattern.exec(content)) !== null) {
        const identifier = match[1];
        if (identifier && !this.isReservedWord(identifier)) {
          used.add(identifier);
        }
      }
    }

    return used;
  }

  private isReservedWord(word: string): boolean {
    const reservedWords = new Set([
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'break',
      'continue',
      'return',
      'throw',
      'try',
      'catch',
      'finally',
      'debugger',
      'const',
      'let',
      'var',
      'function',
      'class',
      'extends',
      'implements',
      'interface',
      'type',
      'enum',
      'namespace',
      'module',
      'declare',
      'export',
      'import',
      'default',
      'new',
      'delete',
      'typeof',
      'instanceof',
      'void',
      'this',
      'super',
      'null',
      'undefined',
      'true',
      'false',
      'async',
      'await',
      'yield',
      'static',
      'public',
      'private',
      'protected',
      'readonly',
      'abstract',
      'override',
    ]);
    return reservedWords.has(word);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  hasUnsavedChanges(sourceFile: SourceFile): boolean {
    return sourceFile.isSaved() === false;
  }

  getImportStats(sourceFile: SourceFile): {
    total: number;
    external: number;
    internal: number;
    unused: number;
  } {
    const imports = sourceFile.getImportDeclarations();
    const usedIdentifiers = this.collectUsedIdentifiersLegacy(sourceFile);

    let external = 0;
    let internal = 0;
    let unused = 0;

    for (const imp of imports) {
      const specifiers = imp.getNamedImports();
      const moduleSpec = imp.getModuleSpecifier().getLiteralValue();
      const isExternal = !moduleSpec.startsWith('.') && !moduleSpec.startsWith('@/');

      if (isExternal) {
        external++;
      } else {
        internal++;
      }

      for (const spec of specifiers) {
        if (!usedIdentifiers.has(spec.getName())) {
          unused++;
        }
      }
    }

    return { total: imports.length, external, internal, unused };
  }

  async optimizeImportOrder(sourcePath: string): Promise<void> {
    const sourceFile = this.project.addSourceFileAtPath(sourcePath);
    if (!sourceFile) return;

    const imports = sourceFile.getImportDeclarations();
    if (imports.length === 0) return;

    const external: typeof imports = [];
    const internal: typeof imports = [];
    const aliases: typeof imports = [];

    for (const imp of imports) {
      const moduleSpec = imp.getModuleSpecifier().getLiteralValue();
      if (moduleSpec.startsWith('@/') || moduleSpec.startsWith('~')) {
        aliases.push(imp);
      } else if (moduleSpec.startsWith('.')) {
        internal.push(imp);
      } else {
        external.push(imp);
      }
    }

    const sortBySpecifier = (a: (typeof imports)[0], b: (typeof imports)[0]) => {
      return a
        .getModuleSpecifier()
        .getLiteralValue()
        .localeCompare(b.getModuleSpecifier().getLiteralValue());
    };

    external.sort(sortBySpecifier);
    aliases.sort(sortBySpecifier);
    internal.sort(sortBySpecifier);

    const allImportsData = [...external, ...aliases, ...internal].map(imp => {
      const specifiers = imp.getNamedImports().map(s => s.getName());
      const defaultImport = imp.getDefaultImport()?.getText();
      const namespaceImport = imp.getNamespaceImport()?.getText();
      const moduleSpec = imp.getModuleSpecifier().getLiteralValue();
      return { defaultImport, namespaceImport, specifiers, moduleSpec };
    });

    for (const imp of imports) {
      imp.remove();
    }

    for (const { defaultImport, namespaceImport, specifiers, moduleSpec } of allImportsData) {
      if (defaultImport) {
        sourceFile.addImportDeclaration({
          defaultImport,
          namedImports: specifiers,
          moduleSpecifier: moduleSpec,
        });
      } else if (namespaceImport) {
        sourceFile.addImportDeclaration({ namespaceImport, moduleSpecifier: moduleSpec });
      } else {
        sourceFile.addImportDeclaration({ namedImports: specifiers, moduleSpecifier: moduleSpec });
      }
    }

    await sourceFile.save();
    console.log(`  📋 Оптимизирован порядок импортов в ${path.basename(sourcePath)}`);
  }
}
