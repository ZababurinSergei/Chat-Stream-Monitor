// src/refactor/index.ts
import { Node } from 'ts-morph';
import { Project, ScriptTarget, ModuleKind, SourceFile } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { ModuleExtractor } from './ModuleExtractor.js';
import { TypeScriptValidator } from './TypeScriptValidator.js';
import { ESLintASTFixer } from './ESLintASTFixer.js';
import { CodeValidator, ValidationResult } from './CodeValidator.js';
import { CodeFixer, FixResult } from './CodeFixer.js';
import { ImportManager } from './ImportManager.js';
import { TemplateUpdater } from './TemplateUpdater.js';

// Импорт семантических модулей
import { CFGAnalyzer, ControlFlowGraph } from '../semantic/CFGAnalyzer.js';
import { CallGraphAnalyzer, CallGraph } from '../semantic/CallGraphAnalyzer.js';
import { TypeAnalyzer, TypeAnalysisResult, TypeError } from '../semantic/TypeAnalyzer.js';
import { DataFlowAnalyzer, DataFlowGraph } from '../semantic/DataFlowAnalyzer.js';
import { Z3Verifier, FunctionContract, VerificationResult, range } from '../formal/Z3Verifier.js';
import { SemanticPipeline, PipelineResult } from '../ci-cd/SemanticPipeline.js';

export interface RefactorOptions {
  modulesDir?: string;
  targetClusterSize?: number;
  maxClusterSize?: number;
  minCohesionScore?: number;
  dryRun?: boolean;
  createBackup?: boolean;
  updateTemplate?: boolean;
  verbose?: boolean;

  // Новые опции для семантического анализа
  semanticAnalysis?: boolean;
  formalVerification?: boolean;
  dataFlowAnalysis?: boolean;
  callGraphAnalysis?: boolean;
  criticalFunctions?: string[];
  maxCallDepth?: number;
}

export interface ExtractedModule {
  name: string;
  path: string;
  exports: string[];
  dependencies: string[];
  originalNodes: any[];
}

export interface RefactorResult {
  success: boolean;
  modules: ExtractedModule[];
  backupPath?: string;
  error?: string;

  // Результаты семантического анализа
  semanticResults?: {
    cfg?: ControlFlowGraph;
    callGraph?: CallGraph;
    typeAnalysis?: TypeAnalysisResult;
    dataFlow?: DataFlowGraph;
    typeErrors?: TypeError[];
    unusedFunctions?: string[];
    cyclicDependencies?: string[][];
    unreachableCode?: Array<{ file: string; line: number }>;
  };

  // Результаты формальной верификации
  verificationResults?: VerificationResult[];

  // Метрики
  metrics?: {
    cyclomaticComplexity: number;
    totalFunctions: number;
    unusedFunctionsCount: number;
    typeErrorsCount: number;
    verifiedFunctionsCount: number;
    dataFlowIssuesCount: number;
  };
}

export class AutoRefactor {
  private project: Project;
  private extractor: ModuleExtractor;
  private options: RefactorOptions;

  // Семантические анализаторы
  private cfgAnalyzer: CFGAnalyzer;
  private callGraphAnalyzer: CallGraphAnalyzer;
  private dataFlowAnalyzer: DataFlowAnalyzer;
  private z3Verifier: Z3Verifier;
  private semanticPipeline: SemanticPipeline;

  // Существующие валидаторы (помечены как public для доступа в тестах)
  public tsValidator: TypeScriptValidator;
  public eslintFixer: ESLintASTFixer;
  private codeValidator: CodeValidator;
  private codeFixer: CodeFixer;
  public importManager: ImportManager;
  private templateUpdater: TemplateUpdater;

  constructor(options: RefactorOptions = {}) {
    this.options = {
      modulesDir: 'modules',
      targetClusterSize: 3,
      maxClusterSize: 10,
      minCohesionScore: 60,
      dryRun: false,
      createBackup: true,
      updateTemplate: true,
      verbose: false,

      // Значения по умолчанию для семантического анализа
      semanticAnalysis: true,
      formalVerification: false,
      dataFlowAnalysis: true,
      callGraphAnalysis: true,
      maxCallDepth: 5,
      ...options,
    };

    // Создаём проект ts-morph для работы с AST
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.ESNext,
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: false,
        skipLibCheck: true,
      },
      useInMemoryFileSystem: false,
    });

    // Инициализация семантических анализаторов
    this.cfgAnalyzer = new CFGAnalyzer();
    this.callGraphAnalyzer = new CallGraphAnalyzer();
    this.dataFlowAnalyzer = new DataFlowAnalyzer();
    this.z3Verifier = new Z3Verifier();
    this.semanticPipeline = new SemanticPipeline();

    // Инициализация существующих компонентов
    this.extractor = new ModuleExtractor(this.project, this.options);
    this.tsValidator = new TypeScriptValidator();
    this.eslintFixer = new ESLintASTFixer();
    this.codeValidator = new CodeValidator();
    this.codeFixer = new CodeFixer();
    this.importManager = new ImportManager(this.project);
    this.templateUpdater = new TemplateUpdater(this.options);
  }

  /**
   * Основной метод рефакторинга с семантическим анализом
   */
  async refactor(filePath: string): Promise<RefactorResult> {
    const absolutePath = path.resolve(filePath);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 АВТОМАТИЧЕСКИЙ РЕФАКТОРИНГ С СЕМАНТИЧЕСКИМ АНАЛИЗОМ`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📄 Целевой файл: ${absolutePath}`);
    console.log(`📁 Выходная директория: ${this.options.modulesDir}`);
    console.log(
      `🎯 Параметры: размер кластера=${this.options.targetClusterSize}, связность=${this.options.minCohesionScore}%`
    );

    if (this.options.semanticAnalysis) {
      console.log(`🧠 Семантический анализ: ВКЛЮЧЕН`);
      if (this.options.formalVerification) {
        console.log(`🔬 Формальная верификация: ВКЛЮЧЕНА (Z3)`);
      }
      if (this.options.dataFlowAnalysis) {
        console.log(`🌊 Data Flow анализ: ВКЛЮЧЕН`);
      }
      if (this.options.callGraphAnalysis) {
        console.log(`🕸️ Call Graph анализ: ВКЛЮЧЕН`);
      }
    }

    if (this.options.dryRun) {
      console.log('\n⚠️ РЕЖИМ DRY RUN: изменения не будут применены к файлам\n');
    }

    if (!fs.existsSync(absolutePath)) {
      return { success: false, modules: [], error: `Файл не найден: ${absolutePath}` };
    }

    let backupPath: string | undefined;
    if (this.options.createBackup && !this.options.dryRun) {
      backupPath = await this.createBackup(absolutePath);
    }

    // Результаты семантического анализа
    let semanticResults: RefactorResult['semanticResults'];
    let verificationResults: VerificationResult[] = [];
    let metrics: RefactorResult['metrics'];

    try {
      // Загружаем файл в проект AST
      const sourceFile = this.project.addSourceFileAtPath(absolutePath);

      // ============================================
      // СЕМАНТИЧЕСКИЙ АНАЛИЗ
      // ============================================

      if (this.options.semanticAnalysis) {
        console.log('\n🧠 ЗАПУСК СЕМАНТИЧЕСКОГО АНАЛИЗА');
        console.log('-'.repeat(40));

        semanticResults = {};

        // 1. Control Flow Graph анализ
        if (this.options.callGraphAnalysis) {
          console.log('  🔀 Анализ Control Flow Graph...');
          const cfg = this.cfgAnalyzer.build(sourceFile);
          semanticResults.cfg = cfg;

          const unreachable = cfg.findUnreachableBlocks();
          if (unreachable.length > 0) {
            console.log(`     ⚠️ Найдено ${unreachable.length} недостижимых блоков`);
          }

          const cyclomaticComplexity = this.calculateCyclomaticComplexity(cfg);
          console.log(`     📊 Цикломатическая сложность: ${cyclomaticComplexity}`);
        }

        // 2. Call Graph анализ
        if (this.options.callGraphAnalysis) {
          console.log('  🕸️ Анализ Call Graph...');
          const callGraph = await this.callGraphAnalyzer.analyze(
            absolutePath,
            this.options.maxCallDepth || 5
          );
          semanticResults.callGraph = callGraph;

          const unused = callGraph.findUnusedFunctions();
          if (unused.length > 0) {
            console.log(`     ⚠️ Найдено ${unused.length} неиспользуемых функций`);
          }

          const cycles = callGraph.findCyclicDependencies();
          if (cycles.length > 0) {
            console.log(`     🔄 Найдено ${cycles.length} циклических зависимостей`);
            // Преобразуем CallEdge[][] в string[][]
            const stringCycles: string[][] = cycles.map(cycleEdges =>
              cycleEdges.map(edge => `${edge.from}->${edge.to}`)
            );
            semanticResults.cyclicDependencies = stringCycles;
          }
        }

        // 3. Type анализ
        console.log('  📝 Анализ типов...');
        const typeAnalyzer = new TypeAnalyzer(absolutePath);
        const typeAnalysis = typeAnalyzer.analyze();
        semanticResults.typeAnalysis = typeAnalysis;

        const typeErrors = typeAnalysis.findTypeErrors();
        if (typeErrors.length > 0) {
          console.log(`     ❌ Найдено ${typeErrors.length} ошибок типов`);
          semanticResults.typeErrors = typeErrors;
        }

        // 4. Data Flow анализ
        if (this.options.dataFlowAnalysis) {
          console.log('  🌊 Анализ Data Flow...');
          const dataFlow = this.dataFlowAnalyzer.analyze(sourceFile);
          semanticResults.dataFlow = dataFlow;

          const unusedVars = dataFlow.findUnusedVariables();
          if (unusedVars.length > 0) {
            console.log(`     ⚠️ Найдено ${unusedVars.length} неиспользуемых переменных`);
          }

          const reassignedConsts = dataFlow.findReassignedConstants();
          if (reassignedConsts.length > 0) {
            console.log(`     🔒 Найдено ${reassignedConsts.length} переопределенных констант`);
          }
        }

        // 5. Формальная верификация (опционально)
        if (this.options.formalVerification) {
          console.log('  🔬 Формальная верификация через Z3...');
          await this.z3Verifier.initialize();

          const functions = sourceFile.getFunctions();
          const criticalSet = new Set(this.options.criticalFunctions || []);

          for (const func of functions) {
            const funcName = func.getName();
            if (!funcName) continue;

            // Верифицируем все функции или только критические
            if (criticalSet.size === 0 || criticalSet.has(funcName)) {
              const contract = this.extractFunctionContract(func);
              if (contract) {
                const result = await this.z3Verifier.verifyFunction(contract);
                verificationResults.push(result);

                if (result.isValid) {
                  console.log(`     ✅ ${funcName} - верифицирована`);
                } else {
                  console.log(`     ❌ ${funcName} - НЕ ПРОШЛА верификацию`);
                  if (result.counterexample) {
                    console.log(`        Контрпример: ${JSON.stringify(result.counterexample)}`);
                  }
                }
              }
            }
          }
        }

        // Собираем метрики
        metrics = {
          cyclomaticComplexity: semanticResults.cfg
            ? this.calculateCyclomaticComplexity(semanticResults.cfg)
            : 0,
          totalFunctions: semanticResults.callGraph?.nodes.size || 0,
          unusedFunctionsCount: semanticResults.callGraph?.findUnusedFunctions().length || 0,
          typeErrorsCount: typeErrors.length,
          verifiedFunctionsCount: verificationResults.filter(r => r.isValid).length,
          dataFlowIssuesCount: semanticResults.dataFlow?.findUnusedVariables().length || 0,
        };

        console.log('\n📊 СЕМАНТИЧЕСКИЕ МЕТРИКИ:');
        console.log(`   • Цикломатическая сложность: ${metrics.cyclomaticComplexity}`);
        console.log(`   • Всего функций: ${metrics.totalFunctions}`);
        console.log(`   • Неиспользуемых: ${metrics.unusedFunctionsCount}`);
        console.log(`   • Ошибок типов: ${metrics.typeErrorsCount}`);
        console.log(`   • Верифицировано: ${metrics.verifiedFunctionsCount}`);
      }

      // ============================================
      // СУЩЕСТВУЮЩИЙ АНАЛИЗ ДЛЯ РЕФАКТОРИНГА
      // ============================================

      // Анализируем файл через AST
      const analysis = await this.analyzeFile(sourceFile);
      if (!analysis) {
        return {
          success: false,
          modules: [],
          error: 'Не удалось проанализировать файл',
          backupPath,
          semanticResults,
          verificationResults,
          metrics,
        };
      }

      // Выявляем кластеры функций
      const clusters = this.identifyClusters(analysis);

      if (clusters.length === 0) {
        console.log('\nℹ️ Не найдено кандидатов для выделения в модули');
        return {
          success: true,
          modules: [],
          backupPath,
          semanticResults,
          verificationResults,
          metrics,
        };
      }

      console.log(`\n📊 Найдено кластеров: ${clusters.length}`);
      clusters.forEach((cluster, i) => {
        console.log(
          `   ${i + 1}. ${cluster.name}: [${cluster.functions.join(', ')}] (связность: ${cluster.cohesionScore}%)`
        );
      });

      if (this.options.dryRun) {
        console.log('\n⚠️ DRY RUN: Изменения не будут применены');
        return {
          success: true,
          modules: [],
          backupPath,
          semanticResults,
          verificationResults,
          metrics,
        };
      }

      // Извлекаем модули через AST
      const modules = await this.extractor.extractModules(absolutePath, clusters);

      // Обновляем импорты в исходном файле через AST
      await this.updateImports(sourceFile, modules);

      // Обновляем шаблоны для Vue файлов
      if (this.options.updateTemplate && absolutePath.endsWith('.vue')) {
        await this.templateUpdater.update(absolutePath, modules);
      }

      // Сохраняем все изменения
      await this.project.save();

      console.log(`\n✨ РЕФАКТОРИНГ УСПЕШНО ЗАВЕРШЁН!`);
      console.log(`📦 Создано модулей: ${modules.length}`);

      if (modules.length > 0) {
        console.log(`\n📁 СОЗДАННЫЕ МОДУЛИ:`);
        for (const module of modules) {
          const relativePath = path.relative(process.cwd(), module.path);
          console.log(`   ✅ ${relativePath} (${module.exports.length} экспортов)`);
        }
      }

      return {
        success: true,
        modules,
        backupPath,
        semanticResults,
        verificationResults,
        metrics,
      };
    } catch (error) {
      console.error(`\n❌ Ошибка рефакторинга:`, error);

      if (backupPath && !this.options.dryRun) {
        await this.restoreBackup(absolutePath, backupPath);
      }

      return {
        success: false,
        modules: [],
        backupPath,
        error: error instanceof Error ? error.message : String(error),
        semanticResults,
        verificationResults,
        metrics,
      };
    }
  }

  /**
   * Запуск полного семантического пайплайна
   */
  async runSemanticPipeline(filePaths: string[]): Promise<PipelineResult> {
    console.log('\n🚀 ЗАПУСК СЕМАНТИЧЕСКОГО ПАЙПЛАЙНА');
    console.log('='.repeat(60));

    const result = await this.semanticPipeline.run(filePaths, {
      formalVerification: this.options.formalVerification,
      maxDepth: this.options.maxCallDepth,
      criticalFunctions: this.options.criticalFunctions,
    });

    return result;
  }

  /**
   * Валидация кода с семантическим анализом
   */
  async validateWithSemantics(filePath: string): Promise<ValidationResult> {
    console.log(`\n🔍 ВАЛИДАЦИЯ КОДА С СЕМАНТИЧЕСКИМ АНАЛИЗОМ: ${path.basename(filePath)}`);
    console.log('='.repeat(60));

    const sourceFile = this.project.addSourceFileAtPath(filePath);
    if (!sourceFile) {
      throw new Error(`Не удалось загрузить файл: ${filePath}`);
    }

    // Запускаем семантический анализ
    if (this.options.semanticAnalysis) {
      // CFG анализ
      const cfg = this.cfgAnalyzer.build(sourceFile);
      const unreachable = cfg.findUnreachableBlocks();

      // Call Graph анализ
      const callGraph = await this.callGraphAnalyzer.analyze(
        filePath,
        this.options.maxCallDepth || 5
      );
      const unused = callGraph.findUnusedFunctions();

      // Type анализ
      const typeAnalyzer = new TypeAnalyzer(filePath);
      const typeAnalysis = typeAnalyzer.analyze();
      const typeErrors = typeAnalysis.findTypeErrors();

      // Data Flow анализ
      const dataFlow = this.dataFlowAnalyzer.analyze(sourceFile);
      const unusedVars = dataFlow.findUnusedVariables();

      console.log(`\n📊 РЕЗУЛЬТАТЫ СЕМАНТИЧЕСКОЙ ВАЛИДАЦИИ:`);
      console.log(`   • Недостижимые блоки: ${unreachable.length}`);
      console.log(`   • Неиспользуемые функции: ${unused.length}`);
      console.log(`   • Ошибки типов: ${typeErrors.length}`);
      console.log(`   • Неиспользуемые переменные: ${unusedVars.length}`);
    }

    // Запускаем стандартную валидацию
    const validationResult = await this.codeValidator.validateFiles([filePath]);

    return validationResult;
  }

  /**
   * Автоматическое исправление проблем с семантическим анализом
   */
  async autoFixWithSemantics(filePath: string): Promise<FixResult[]> {
    console.log(`\n🔧 АВТОИСПРАВЛЕНИЕ С СЕМАНТИЧЕСКИМ АНАЛИЗОМ: ${path.basename(filePath)}`);
    console.log('='.repeat(60));

    // Сначала находим проблемы через семантический анализ
    const validationResult = await this.validateWithSemantics(filePath);

    // Исправляем через AST
    const fixResults = await this.codeFixer.autoFix(
      validationResult.issues,
      this.options.createBackup
    );

    return fixResults;
  }

  /**
   * Извлечение контракта функции для формальной верификации
   */
  private extractFunctionContract(func: any): FunctionContract | null {
    const name = func.getName();
    if (!name) return null;

    const params = func.getParameters().map((p: any) => ({
      name: p.getName(),
      type: this.getParamType(p),
    }));

    const returnType = this.getReturnType(func);

    // Извлекаем JSDoc комментарии для предусловий/постусловий
    const jsDoc = func.getJsDocs()[0];
    let preconditions: any[] = [];
    let postconditions: any[] = [];

    if (jsDoc) {
      const tags = jsDoc.getTags();

      for (const tag of tags) {
        const tagName = tag.getTagName();
        const comment = tag.getCommentText();

        if (tagName === 'param' && comment) {
          // Добавляем предусловие на основе параметра
          const paramMatch = comment.match(/(\w+)\s+(.+)/);
          if (paramMatch) {
            preconditions.push(this.parseJSDocCondition(paramMatch[2]));
          }
        }

        if (tagName === 'returns' && comment) {
          // Добавляем постусловие
          postconditions.push(this.parseJSDocCondition(comment));
        }
      }
    }

    // Добавляем типовые предусловия
    for (const param of params) {
      if (param.type === 'int') {
        preconditions.push(range(param.name, -1000, 1000));
      }
    }

    return {
      name,
      params,
      returnType,
      preconditions,
      postconditions,
      invariants: [],
    };
  }

  private getParamType(param: any): 'int' | 'bool' | 'string' {
    const type = param.getType();
    if (type.isNumber()) return 'int';
    if (type.isBoolean()) return 'bool';
    if (type.isString()) return 'string';
    return 'int';
  }

  private getReturnType(func: any): 'int' | 'bool' | 'string' | 'void' {
    const returnType = func.getReturnType();
    if (returnType.isNumber()) return 'int';
    if (returnType.isBoolean()) return 'bool';
    if (returnType.isString()) return 'string';
    return 'void';
  }

  private parseJSDocCondition(comment: string): any {
    // Парсим JSDoc комментарии в формат VerificationConstraint
    if (comment.includes('> 0')) {
      return { type: 'range', variable: 'result', min: 1, max: Infinity };
    }
    if (comment.includes('>= 0')) {
      return { type: 'range', variable: 'result', min: 0, max: Infinity };
    }
    return { type: 'equality', left: true, right: true };
  }

  private calculateCyclomaticComplexity(cfg: ControlFlowGraph): number {
    // V(G) = E - N + 2P
    const nodes = cfg.blocks.length;
    let edges = 0;
    for (const block of cfg.blocks) {
      edges += block.successors.length;
    }
    return edges - nodes + 2;
  }

  /**
   * Анализирует файл через AST: собирает все функции и их вызовы
   */
  private async analyzeFile(sourceFile: SourceFile): Promise<any> {
    const functions: string[] = [];
    const callGraph: Record<string, string[]> = {};

    // Получаем все функции через AST
    const functionDeclarations = sourceFile.getFunctions();

    for (const func of functionDeclarations) {
      const name = func.getName();
      if (!name) continue;

      functions.push(name);
      if (!callGraph[name]) {
        callGraph[name] = [];
      }

      // Анализируем вызовы внутри функции через обход AST
      func.forEachDescendant(node => {
        if (Node.isCallExpression(node)) {
          const expression = node.getExpression();
          if (Node.isIdentifier(expression)) {
            const calledName = expression.getText();
            if (calledName !== name && callGraph[name] && !callGraph[name].includes(calledName)) {
              callGraph[name].push(calledName);
            }
          }
        }
      });
    }

    // Получаем стрелочные функции и функции-выражения
    const variableDeclarations = sourceFile.getVariableDeclarations();
    for (const variable of variableDeclarations) {
      const name = variable.getName();
      const initializer = variable.getInitializer();

      if (
        initializer &&
        (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))
      ) {
        if (!functions.includes(name)) {
          functions.push(name);
          if (!callGraph[name]) {
            callGraph[name] = [];
          }

          // Анализируем вызовы внутри стрелочной функции
          initializer.forEachDescendant(node => {
            if (Node.isCallExpression(node)) {
              const expression = node.getExpression();
              if (Node.isIdentifier(expression)) {
                const calledName = expression.getText();
                if (
                  calledName !== name &&
                  callGraph[name] &&
                  !callGraph[name].includes(calledName)
                ) {
                  callGraph[name].push(calledName);
                }
              }
            }
          });
        }
      }
    }

    if (this.options.verbose) {
      console.log(`\n📊 Анализ AST: найдено ${functions.length} функций`);
      for (const [fn, deps] of Object.entries(callGraph)) {
        if (deps.length > 0) {
          console.log(`   ${fn} → ${deps.join(', ')}`);
        }
      }
    }

    return { functions, callGraph, sourceFile };
  }

  /**
   * Выявляет кластеры функций на основе графа вызовов
   */
  private identifyClusters(analysis: any): any[] {
    const { functions, callGraph } = analysis;
    const clusters: any[] = [];
    const visited = new Set<string>();

    for (const func of functions) {
      if (visited.has(func)) continue;

      const cluster = {
        name: this.generateClusterName(func),
        functions: [func],
        cohesionScore: 0,
      };

      const queue = [func];
      visited.add(func);

      // BFS для сбора связанных функций
      while (queue.length > 0 && cluster.functions.length < (this.options.maxClusterSize || 10)) {
        const current = queue.shift()!;
        const deps = callGraph[current] || [];

        for (const dep of deps) {
          if (!visited.has(dep) && functions.includes(dep)) {
            visited.add(dep);
            cluster.functions.push(dep);
            queue.push(dep);
          }
        }
      }

      if (cluster.functions.length > 0) {
        // Вычисляем связность кластера
        let internalEdges = 0;
        for (const fn of cluster.functions) {
          const deps = callGraph[fn] || [];
          internalEdges += deps.filter((dep: string) => cluster.functions.includes(dep)).length;
        }
        const maxEdges = cluster.functions.length * (cluster.functions.length - 1);
        cluster.cohesionScore = maxEdges > 0 ? Math.round((internalEdges / maxEdges) * 100) : 0;

        // Фильтруем по минимальной связности
        if (cluster.cohesionScore >= (this.options.minCohesionScore || 60)) {
          clusters.push(cluster);
        }
      }
    }

    // Сортируем по связности и размеру
    clusters.sort((a, b) => {
      if (a.cohesionScore !== b.cohesionScore) {
        return b.cohesionScore - a.cohesionScore;
      }
      return b.functions.length - a.functions.length;
    });

    return clusters;
  }

  /**
   * Генерирует имя кластера на основе имени функции
   */
  private generateClusterName(funcName: string): string {
    // Убираем распространённые префиксы
    let name = funcName.replace(
      /^(get|set|is|has|use|fetch|handle|on|validate|process|calculate)/,
      ''
    );
    // Приводим к camelCase с маленькой буквы
    name = name.charAt(0).toLowerCase() + name.slice(1);
    // Добавляем суффикс Module
    return name + 'Module';
  }

  /**
   * Обновляет импорты в исходном файле через AST
   */
  private async updateImports(sourceFile: SourceFile, modules: ExtractedModule[]): Promise<void> {
    if (modules.length === 0) return;

    const sourceDir = path.dirname(sourceFile.getFilePath());

    for (const module of modules) {
      const relativePath = path.relative(sourceDir, module.path);
      let importPath = relativePath.replace(/\.js$/, '').replace(/\\/g, '/');

      // Добавляем ./ для относительных путей
      if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
        importPath = './' + importPath;
      }

      // Проверяем, существует ли уже такой импорт
      const existingImport = sourceFile.getImportDeclaration(importPath);

      if (!existingImport) {
        // Добавляем новый импорт через AST
        sourceFile.addImportDeclaration({
          namedImports: module.exports,
          moduleSpecifier: importPath,
        });
        console.log(`  ➕ Добавлен импорт: { ${module.exports.join(', ')} } from '${importPath}'`);
      } else {
        // Обновляем существующий импорт
        const existingNames = existingImport.getNamedImports().map(n => n.getName());
        const newNames = [...new Set([...existingNames, ...module.exports])];

        if (newNames.length > existingNames.length) {
          existingImport.remove();
          sourceFile.addImportDeclaration({
            namedImports: newNames,
            moduleSpecifier: importPath,
          });
          console.log(`  🔄 Обновлён импорт: { ${newNames.join(', ')} } from '${importPath}'`);
        }
      }
    }

    // Оптимизируем порядок импортов
    await this.optimizeImportOrder(sourceFile);
  }

  /**
   * Оптимизирует порядок импортов: внешние → алиасы → внутренние
   */
  private async optimizeImportOrder(sourceFile: SourceFile): Promise<void> {
    const imports = sourceFile.getImportDeclarations();
    if (imports.length <= 1) return;

    const external: typeof imports = [];
    const aliases: typeof imports = [];
    const internal: typeof imports = [];

    for (const imp of imports) {
      const specifier = imp.getModuleSpecifierValue();
      if (specifier.startsWith('@') || specifier.startsWith('#')) {
        aliases.push(imp);
      } else if (specifier.startsWith('.')) {
        internal.push(imp);
      } else {
        external.push(imp);
      }
    }

    // Сортируем внутри групп по алфавиту
    const sortBySpecifier = (a: (typeof imports)[0], b: (typeof imports)[0]) => {
      return a.getModuleSpecifierValue().localeCompare(b.getModuleSpecifierValue());
    };

    external.sort(sortBySpecifier);
    aliases.sort(sortBySpecifier);
    internal.sort(sortBySpecifier);

    const allImports = [...external, ...aliases, ...internal];

    // Проверяем, нужно ли менять порядок
    let needsReorder = false;
    for (let i = 0; i < imports.length; i++) {
      if (imports[i] !== allImports[i]) {
        needsReorder = true;
        break;
      }
    }

    if (needsReorder) {
      // Сохраняем данные импортов
      const importData = allImports.map(imp => ({
        defaultImport: imp.getDefaultImport()?.getText(),
        namespaceImport: imp.getNamespaceImport()?.getText(),
        namedImports: imp.getNamedImports().map(n => n.getName()),
        moduleSpecifier: imp.getModuleSpecifierValue(),
      }));

      // Удаляем все импорты
      for (const imp of imports) {
        imp.remove();
      }

      // Добавляем в правильном порядке
      for (const data of importData) {
        if (data.defaultImport) {
          sourceFile.addImportDeclaration({
            defaultImport: data.defaultImport,
            namedImports: data.namedImports.length > 0 ? data.namedImports : undefined,
            moduleSpecifier: data.moduleSpecifier,
          });
        } else if (data.namespaceImport) {
          sourceFile.addImportDeclaration({
            namespaceImport: data.namespaceImport,
            moduleSpecifier: data.moduleSpecifier,
          });
        } else if (data.namedImports.length > 0) {
          sourceFile.addImportDeclaration({
            namedImports: data.namedImports,
            moduleSpecifier: data.moduleSpecifier,
          });
        }
      }

      console.log(`  📋 Оптимизирован порядок импортов`);
    }
  }

  /**
   * Создаёт резервную копию файла
   */
  private async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.promises.copyFile(filePath, backupPath);
    console.log(`💾 Бэкап создан: ${path.basename(backupPath)}`);
    return backupPath;
  }

  /**
   * Восстанавливает файл из резервной копии
   */
  private async restoreBackup(filePath: string, backupPath: string): Promise<void> {
    if (fs.existsSync(backupPath)) {
      await fs.promises.copyFile(backupPath, filePath);
      console.log(`🔄 Восстановлен бэкап: ${path.basename(backupPath)}`);
    }
  }

  /**
   * Инициализация всех компонентов
   */
  async initialize(): Promise<void> {
    console.log('🚀 Инициализация AutoRefactor с семантическими компонентами...');

    if (this.options.formalVerification) {
      await this.z3Verifier.initialize();
    }

    console.log('✅ Все компоненты инициализированы');
  }

  /**
   * Очистка ресурсов
   */
  async dispose(): Promise<void> {
    if (this.z3Verifier) {
      await this.z3Verifier.dispose();
    }
  }
}

// Экспорт дополнительных типов и утилит
export { TypeScriptValidator } from './TypeScriptValidator.js';
export { ESLintASTFixer } from './ESLintASTFixer.js';
export { CodeValidator } from './CodeValidator.js';
export type { ValidationResult } from './CodeValidator.js';

export { CodeFixer } from './CodeFixer.js';
export type { FixResult } from './CodeFixer.js';

export { ImportManager } from './ImportManager.js';
export { TemplateUpdater } from './TemplateUpdater.js';
export { ModuleExtractor } from './ModuleExtractor.js';

// Экспорт семантических компонентов
export { CFGAnalyzer } from '../semantic/CFGAnalyzer.js';
export type { ControlFlowGraph, BasicBlock } from '../semantic/CFGAnalyzer.js';

export { CallGraphAnalyzer } from '../semantic/CallGraphAnalyzer.js';
export type { CallGraph, CallGraphNode } from '../semantic/CallGraphAnalyzer.js';

export { TypeAnalyzer } from '../semantic/TypeAnalyzer.js';
export type { TypeAnalysisResult, TypeError, TypeInfo } from '../semantic/TypeAnalyzer.js';

export { DataFlowAnalyzer } from '../semantic/DataFlowAnalyzer.js';
export type { DataFlowGraph, DataFlowNode, DataFlowEdge } from '../semantic/DataFlowAnalyzer.js';

export { Z3Verifier, range } from '../formal/Z3Verifier.js';
export type { FunctionContract, VerificationResult } from '../formal/Z3Verifier.js';

export { SemanticPipeline } from '../ci-cd/SemanticPipeline.js';
export type { PipelineResult } from '../ci-cd/SemanticPipeline.js';
