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

// Семантические модули
import { CFGAnalyzer, ControlFlowGraph } from '../semantic/CFGAnalyzer.js';
import { CallGraphAnalyzer, CallGraph } from '../semantic/CallGraphAnalyzer.js';
import { TypeAnalyzer, TypeAnalysisResult, TypeError } from '../semantic/TypeAnalyzer.js';
import { DataFlowAnalyzer, DataFlowGraph } from '../semantic/DataFlowAnalyzer.js';
import { Z3Verifier, FunctionContract, VerificationResult, range } from '../formal/Z3Verifier.js';

export interface RefactorOptions {
  modulesDir?: string;
  targetClusterSize?: number;
  maxClusterSize?: number;
  minCohesionScore?: number;
  dryRun?: boolean;
  createBackup?: boolean;
  updateTemplate?: boolean;
  verbose?: boolean;

  // Семантический анализ (ВСЕ ВКЛЮЧЕНЫ ПО УМОЛЧАНИЮ)
  semanticAnalysis?: boolean;
  formalVerification?: boolean;
  dataFlowAnalysis?: boolean;
  callGraphAnalysis?: boolean;
  jsxAnalysis?: boolean;
  vueAnalysis?: boolean;
  criticalFunctions?: string[];
  maxCallDepth?: number;

  // Валидация и исправление (ВСЕ ВКЛЮЧЕНЫ ПО УМОЛЧАНИЮ)
  eslintCheck?: boolean;
  eslintFix?: boolean;
  typeCheck?: boolean;
  codeValidation?: boolean;
  autoFix?: boolean;
  maxIterations?: number;

  // Импорты (ВСЕ ВКЛЮЧЕНЫ ПО УМОЛЧАНИЮ)
  fixUnusedImports?: boolean;
  fixUnusedVariables?: boolean;
  addMissingTypes?: boolean;
  optimizeImports?: boolean;

  // Кластеризация
  minClusterSize?: number;
  extractIsolatedFunctions?: boolean;
  groupByCallGraph?: boolean;
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

  semanticResults?: {
    cfg?: ControlFlowGraph;
    callGraph?: CallGraph;
    typeAnalysis?: TypeAnalysisResult;
    dataFlow?: DataFlowGraph;
    typeErrors?: TypeError[];
    unusedFunctions?: string[];
    cyclicDependencies?: string[][];
    unreachableCode?: Array<{ file: string; line: number }>;
    jsx?: any;
    vue?: any;
  };

  verificationResults?: VerificationResult[];
  validationResults?: ValidationResult;
  eslintResults?: ESLintFixResult[];
  tsFixResults?: { fixedCount: number; remainingErrors: number };
  codeFixResults?: FixResult[];

  metrics?: {
    cyclomaticComplexity: number;
    totalFunctions: number;
    unusedFunctionsCount: number;
    typeErrorsCount: number;
    verifiedFunctionsCount: number;
    dataFlowIssuesCount: number;
    eslintFixesCount: number;
    tsFixesCount: number;
    codeFixesCount: number;
  };
}

export interface ESLintFixResult {
  success: boolean;
  file: string;
  fixes: number;
  errors: string[];
}

export class AutoRefactor {
  private project: Project;
  private extractor: ModuleExtractor;
  private importManager: ImportManager;
  private options: RefactorOptions;

  private cfgAnalyzer: CFGAnalyzer;
  private callGraphAnalyzer: CallGraphAnalyzer;
  private dataFlowAnalyzer: DataFlowAnalyzer;
  private z3Verifier: Z3Verifier;

  private tsValidator: TypeScriptValidator;
  private eslintFixer: ESLintASTFixer;
  private codeValidator: CodeValidator;
  private codeFixer: CodeFixer;
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

      semanticAnalysis: true,
      formalVerification: true,
      dataFlowAnalysis: true,
      callGraphAnalysis: true,
      jsxAnalysis: true,
      vueAnalysis: true,
      maxCallDepth: 10,

      eslintCheck: true,
      eslintFix: true,
      typeCheck: true,
      codeValidation: true,
      autoFix: true,
      maxIterations: 5,

      fixUnusedImports: true,
      fixUnusedVariables: true,
      addMissingTypes: true,
      optimizeImports: true,

      minClusterSize: 2,
      extractIsolatedFunctions: true,
      groupByCallGraph: true,

      ...options,
    };

    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.ESNext,
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
      },
      useInMemoryFileSystem: false,
    });

    this.cfgAnalyzer = new CFGAnalyzer();
    this.callGraphAnalyzer = new CallGraphAnalyzer();
    this.dataFlowAnalyzer = new DataFlowAnalyzer();
    this.z3Verifier = new Z3Verifier();

    this.extractor = new ModuleExtractor(this.project, this.options);
    this.importManager = new ImportManager(this.project);
    this.tsValidator = new TypeScriptValidator();
    this.eslintFixer = new ESLintASTFixer();
    this.codeValidator = new CodeValidator();
    this.codeFixer = new CodeFixer();
    this.templateUpdater = new TemplateUpdater(this.options);
  }

  async refactor(filePath: string): Promise<RefactorResult> {
    const absolutePath = path.resolve(filePath);

    this.logHeader('АВТОМАТИЧЕСКИЙ РЕФАКТОРИНГ С ПОЛНЫМ PIPELINE');
    this.log(`📄 Целевой файл: ${absolutePath}`);
    this.log(`📁 Выходная директория: ${this.options.modulesDir}`);
    this.log(
      `🎯 Параметры: размер кластера=${this.options.targetClusterSize}, связность=${this.options.minCohesionScore}%`
    );

    this.logSemanticStatus();

    if (this.options.dryRun) {
      this.log('⚠️ РЕЖИМ DRY RUN: изменения не будут применены к файлам\n');
    }

    if (!fs.existsSync(absolutePath)) {
      return { success: false, modules: [], error: `Файл не найден: ${absolutePath}` };
    }

    let backupPath: string | undefined;
    if (this.options.createBackup && !this.options.dryRun) {
      backupPath = await this.createBackup(absolutePath);
    }

    let semanticResults: RefactorResult['semanticResults'] = {};
    let verificationResults: VerificationResult[] = [];
    let validationResults: ValidationResult | undefined;
    let eslintResults: ESLintFixResult[] = [];
    let tsFixResults: { fixedCount: number; remainingErrors: number } = {
      fixedCount: 0,
      remainingErrors: 0,
    };
    let codeFixResults: FixResult[] = [];
    let metrics: RefactorResult['metrics'] = {
      cyclomaticComplexity: 0,
      totalFunctions: 0,
      unusedFunctionsCount: 0,
      typeErrorsCount: 0,
      verifiedFunctionsCount: 0,
      dataFlowIssuesCount: 0,
      eslintFixesCount: 0,
      tsFixesCount: 0,
      codeFixesCount: 0,
    };

    try {
      const sourceFile = this.project.addSourceFileAtPath(absolutePath);

      if (this.options.semanticAnalysis) {
        this.logSection('СЕМАНТИЧЕСКИЙ АНАЛИЗ');
        semanticResults = await this.runSemanticAnalysis(sourceFile, absolutePath);

        if (semanticResults) {
          if (
            this.options.jsxAnalysis &&
            (absolutePath.endsWith('.tsx') || absolutePath.endsWith('.jsx'))
          ) {
            this.log('  ⚛️ Анализ JSX/TSX...');
            const { JSXAnalyzer } = await import('../semantic/JSXAnalyzer.js');
            const jsxAnalyzer = new JSXAnalyzer(absolutePath);
            const jsxResult = jsxAnalyzer.analyze(sourceFile);
            semanticResults.jsx = jsxResult;

            if (jsxResult.elements.length > 0) {
              this.log(`     ⚛️ Найдено JSX элементов: ${jsxResult.elements.length}`);
              this.log(`     🧩 Компонентов: ${jsxResult.componentProps.size}`);
            }
          }

          if (this.options.vueAnalysis && absolutePath.endsWith('.vue')) {
            this.log('  🎯 Анализ Vue компонента...');
            const { analyzeVueComponent } = await import('../modes/vue-analyzer.js');
            const vueAnalysis = analyzeVueComponent(absolutePath);
            semanticResults.vue = vueAnalysis;

            if (vueAnalysis) {
              this.log(`     📥 Props: ${vueAnalysis.props.names.length}`);
              this.log(`     📤 Events: ${vueAnalysis.emits.names.length}`);
              this.log(`     🎭 Slots: ${vueAnalysis.slots.length}`);
              this.log(`     🧩 Composables: ${vueAnalysis.composables.length}`);
            }
          }
        }
      }

      if (this.options.formalVerification) {
        this.logSection('ФОРМАЛЬНАЯ ВЕРИФИКАЦИЯ (Z3)');
        verificationResults = await this.runFormalVerification(sourceFile);
      }

      if (this.options.codeValidation) {
        this.logSection('CODE VALIDATION');
        validationResults = await this.runCodeValidation([absolutePath]);
      }

      if (this.options.eslintCheck) {
        this.logSection('ESLint АНАЛИЗ И ИСПРАВЛЕНИЕ');
        eslintResults = await this.runESLintFix([absolutePath]);
      }

      if (this.options.typeCheck) {
        this.logSection('TYPESCRIPT ВАЛИДАЦИЯ И ИСПРАВЛЕНИЕ');
        tsFixResults = await this.runTypeScriptFix([absolutePath]);
      }

      if (this.options.autoFix && validationResults) {
        this.logSection('АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ КОДА');
        codeFixResults = await this.runCodeFix(validationResults);
      }

      this.logSection('АНАЛИЗ СТРУКТУРЫ ФАЙЛА');
      const analysis = await this.analyzeFile(sourceFile);
      if (!analysis) {
        return this.createErrorResult('Не удалось проанализировать файл', backupPath, {
          semanticResults,
          verificationResults,
          validationResults,
          eslintResults,
          tsFixResults,
          codeFixResults,
          metrics,
        });
      }

      this.logSection('КЛАСТЕРИЗАЦИЯ ФУНКЦИЙ');
      const clusters = this.identifyClusters(analysis);

      const filteredClusters = clusters.filter(
        c => c.functions.length >= (this.options.minClusterSize || 2)
      );

      let finalClusters = filteredClusters;
      if (this.options.extractIsolatedFunctions) {
        const isolated = this.findIsolatedFunctions(analysis, filteredClusters);
        finalClusters = [...filteredClusters, ...isolated];
      }

      if (finalClusters.length === 0) {
        this.log('ℹ️ Не найдено кандидатов для выделения в модули');
        return this.createSuccessResult([], backupPath, {
          semanticResults,
          verificationResults,
          validationResults,
          eslintResults,
          tsFixResults,
          codeFixResults,
          metrics,
        });
      }

      this.logClusters(finalClusters);

      if (this.options.dryRun) {
        this.log('⚠️ DRY RUN: Изменения не будут применены');
        return this.createSuccessResult([], backupPath, {
          semanticResults,
          verificationResults,
          validationResults,
          eslintResults,
          tsFixResults,
          codeFixResults,
          metrics,
        });
      }

      this.logSection('ИЗВЛЕЧЕНИЕ МОДУЛЕЙ');
      const modules = await this.extractor.extractModules(absolutePath, finalClusters);

      this.logSection('ОБНОВЛЕНИЕ ИМПОРТОВ');
      await this.updateImports(sourceFile, modules);

      if (this.options.optimizeImports) {
        this.logSection('ОПТИМИЗАЦИЯ ИМПОРТОВ');
        await this.optimizeImportOrder(sourceFile);
      }

      if (this.options.updateTemplate && absolutePath.endsWith('.vue')) {
        this.logSection('ОБНОВЛЕНИЕ VUE ШАБЛОНА');
        await this.templateUpdater.update(absolutePath, modules);
      }

      this.logSection('ФИНАЛЬНАЯ ВАЛИДАЦИЯ');
      await this.project.save();

      const finalValidation = await this.runCodeValidation([absolutePath]);
      const finalESLint = await this.runESLintFix([absolutePath]);
      const finalTS = await this.runTypeScriptFix([absolutePath]);

      metrics = this.collectMetrics({
        semanticResults,
        verificationResults,
        validationResults: finalValidation,
        eslintResults: finalESLint,
        tsFixResults: finalTS,
        codeFixResults,
        clusters: finalClusters,
      });

      this.logMetrics(metrics);
      this.logSuccess(modules, backupPath);

      return this.createSuccessResult(modules, backupPath, {
        semanticResults,
        verificationResults,
        validationResults: finalValidation,
        eslintResults: finalESLint,
        tsFixResults: finalTS,
        codeFixResults,
        metrics,
      });
    } catch (error) {
      this.logError(error);

      if (backupPath && !this.options.dryRun) {
        await this.restoreBackup(absolutePath, backupPath);
      }

      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        backupPath,
        {
          semanticResults,
          verificationResults,
          validationResults,
          eslintResults,
          tsFixResults,
          codeFixResults,
          metrics,
        }
      );
    }
  }

  private async runSemanticAnalysis(
    sourceFile: SourceFile,
    filePath: string
  ): Promise<RefactorResult['semanticResults']> {
    const results: RefactorResult['semanticResults'] = {};

    this.log('  🔀 Анализ Control Flow Graph...');
    const cfg = this.cfgAnalyzer.build(sourceFile);
    results.cfg = cfg;
    const unreachable = cfg.findUnreachableBlocks();
    if (unreachable.length > 0) {
      this.log(`     ⚠️ Найдено ${unreachable.length} недостижимых блоков`);
      results.unreachableCode = unreachable.map(block => ({
        file: sourceFile.getFilePath(),
        line: block.instructions[0]?.getStartLineNumber() || 1,
      }));
    }

    this.log('  🕸️ Анализ Call Graph...');
    const callGraph = await this.callGraphAnalyzer.analyze(
      filePath,
      this.options.maxCallDepth || 10
    );
    results.callGraph = callGraph;
    const unused = callGraph.findUnusedFunctions();
    if (unused.length > 0) {
      this.log(`     ⚠️ Найдено ${unused.length} неиспользуемых функций`);
      results.unusedFunctions = unused.map(f => f.name);
    }
    const cycles = callGraph.findCyclicDependencies();
    if (cycles.length > 0) {
      this.log(`     🔄 Найдено ${cycles.length} циклических зависимостей`);
      results.cyclicDependencies = cycles.map(cycleEdges =>
        cycleEdges.map(edge => `${edge.from}->${edge.to}`)
      );
    }

    this.log('  📝 Анализ типов...');
    const typeAnalyzer = new TypeAnalyzer(filePath);
    const typeAnalysis = typeAnalyzer.analyze();
    results.typeAnalysis = typeAnalysis;
    const typeErrors = typeAnalysis.findTypeErrors();
    if (typeErrors.length > 0) {
      this.log(`     ❌ Найдено ${typeErrors.length} ошибок типов`);
      results.typeErrors = typeErrors;
    }

    this.log('  🌊 Анализ Data Flow...');
    const dataFlow = this.dataFlowAnalyzer.analyze(sourceFile);
    results.dataFlow = dataFlow;
    const unusedVars = dataFlow.findUnusedVariables();
    if (unusedVars.length > 0) {
      this.log(`     ⚠️ Найдено ${unusedVars.length} неиспользуемых переменных`);
    }
    const reassignedConsts = dataFlow.findReassignedConstants();
    if (reassignedConsts.length > 0) {
      this.log(`     🔒 Найдено ${reassignedConsts.length} переопределенных констант`);
    }

    this.log(`\n  📊 СТАТИСТИКА АНАЛИЗА:`);
    this.log(`     • Функций: ${callGraph?.nodes.size || 0}`);
    this.log(`     • Вызовов: ${callGraph?.edges.length || 0}`);
    this.log(`     • Циклов: ${callGraph?.cycles.length || 0}`);
    this.log(`     • Ошибок типов: ${typeErrors.length || 0}`);
    this.log(`     • Неиспользуемых переменных: ${unusedVars.length || 0}`);

    return results;
  }

  private async runFormalVerification(sourceFile: SourceFile): Promise<VerificationResult[]> {
    const verificationResults: VerificationResult[] = [];

    await this.z3Verifier.initialize();

    const functions = sourceFile.getFunctions();
    const criticalSet = new Set(this.options.criticalFunctions || []);

    for (const func of functions) {
      const funcName = func.getName();
      if (!funcName) continue;

      if (criticalSet.size === 0 || criticalSet.has(funcName)) {
        const contract = this.extractFunctionContract(func);
        if (contract) {
          const result = await this.z3Verifier.verifyFunction(contract);
          verificationResults.push({ ...result, functionName: funcName });
          if (result.isValid) {
            this.log(`     ✅ ${funcName} - ВЕРИФИЦИРОВАНА`);
          } else {
            this.log(`     ❌ ${funcName} - НЕ ПРОШЛА верификацию`);
          }
        }
      }
    }

    return verificationResults;
  }

  private async runCodeValidation(filePaths: string[]): Promise<ValidationResult> {
    this.log('  🔍 Запуск валидации кода...');
    const result = await this.codeValidator.validateFiles(filePaths);
    this.log(`     ❌ Ошибок: ${result.summary.errors}`);
    this.log(`     ⚠️ Предупреждений: ${result.summary.warnings}`);
    this.log(`     🔧 Автоисправимых: ${result.summary.autoFixable}`);
    return result;
  }

  private async runESLintFix(filePaths: string[]): Promise<ESLintFixResult[]> {
    this.log('  📝 Запуск ESLint анализа...');
    const results = await this.eslintFixer.fixFiles(filePaths, this.options.createBackup);
    const totalFixes = results.reduce((sum, r) => sum + r.fixes, 0);
    const fixedFiles = results.filter(r => r.success && r.fixes > 0).length;
    this.log(`     ✅ Исправлено файлов: ${fixedFiles}`);
    this.log(`     🔧 Всего исправлений: ${totalFixes}`);
    return results;
  }

  private async runTypeScriptFix(
    filePaths: string[]
  ): Promise<{ fixedCount: number; remainingErrors: number }> {
    this.log('  🔷 Запуск TypeScript валидации...');
    const result = await this.tsValidator.validateAndFix(filePaths, this.options.maxIterations);
    this.log(`     ✅ Исправлено: ${result.fixedCount}`);
    this.log(`     ❌ Осталось ошибок: ${result.remainingErrors}`);
    return { fixedCount: result.fixedCount, remainingErrors: result.remainingErrors };
  }

  private async runCodeFix(validationResult: ValidationResult): Promise<FixResult[]> {
    this.log('  🔧 Запуск автоматического исправления...');
    const results = await this.codeFixer.autoFix(
      validationResult.issues,
      this.options.createBackup
    );
    const totalFixes = results.reduce((sum, r) => sum + r.fixes, 0);
    const successFiles = results.filter(r => r.success).length;
    this.log(`     ✅ Исправлено файлов: ${successFiles}`);
    this.log(`     🔧 Всего исправлений: ${totalFixes}`);
    return results;
  }

  private async analyzeFile(sourceFile: SourceFile): Promise<any> {
    const functions: string[] = [];
    const callGraph: Record<string, string[]> = {};

    const functionDeclarations = sourceFile.getFunctions();
    for (const func of functionDeclarations) {
      const name = func.getName();
      if (!name) continue;
      functions.push(name);
      callGraph[name] = [];
      func.forEachDescendant(node => {
        if (Node.isCallExpression(node)) {
          const expression = node.getExpression();
          if (Node.isIdentifier(expression)) {
            const calledName = expression.getText();
            if (calledName !== name) {
              const currentCalls = callGraph[name];
              if (currentCalls && !currentCalls.includes(calledName)) {
                currentCalls.push(calledName);
              }
            }
          }
        }
      });
    }

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
          callGraph[name] = [];
          initializer.forEachDescendant(node => {
            if (Node.isCallExpression(node)) {
              const expression = node.getExpression();
              if (Node.isIdentifier(expression)) {
                const calledName = expression.getText();
                if (calledName !== name) {
                  const currentCalls = callGraph[name];
                  if (currentCalls && !currentCalls.includes(calledName)) {
                    currentCalls.push(calledName);
                  }
                }
              }
            }
          });
        }
      }
    }

    if (this.options.verbose) {
      this.log(`\n📊 Анализ AST: найдено ${functions.length} функций`);
      for (const [fn, deps] of Object.entries(callGraph)) {
        if (deps.length > 0) {
          this.log(`   ${fn} → ${deps.join(', ')}`);
        }
      }
    }

    return { functions, callGraph, sourceFile };
  }

  private identifyClusters(analysis: any): any[] {
    const { functions, callGraph } = analysis;
    const clusters: any[] = [];
    const visited = new Set<string>();

    const importance = new Map<string, number>();
    for (const [caller, callees] of Object.entries(callGraph)) {
      if (Array.isArray(callees)) {
        for (const callee of callees) {
          importance.set(callee, (importance.get(callee) || 0) + 1);
        }
      }
      importance.set(caller, (importance.get(caller) || 0) + 0.5);
    }

    const entryPoints = this.findEntryPoints(callGraph, functions);

    for (const entryPoint of entryPoints) {
      if (visited.has(entryPoint)) continue;

      const cluster: any = {
        name: this.generateClusterName(entryPoint),
        functions: [entryPoint],
        cohesionScore: 0,
        isEntryPoint: true,
        type: 'unknown',
        recommendation: '',
      };

      const queue = [entryPoint];
      visited.add(entryPoint);

      while (queue.length > 0 && cluster.functions.length < (this.options.maxClusterSize || 10)) {
        const current = queue.shift()!;
        const deps = callGraph[current] || [];
        const callers = this.findCallers(callGraph, current);

        for (const dep of deps) {
          if (!visited.has(dep) && functions.includes(dep)) {
            visited.add(dep);
            cluster.functions.push(dep);
            if (cluster.functions.length < (this.options.maxClusterSize || 10)) {
              queue.push(dep);
            }
          }
        }

        for (const caller of callers) {
          if (!visited.has(caller) && functions.includes(caller)) {
            visited.add(caller);
            cluster.functions.unshift(caller);
            if (cluster.functions.length < (this.options.maxClusterSize || 10)) {
              queue.unshift(caller);
            }
          }
        }
      }

      if (cluster.functions.length > 0) {
        cluster.cohesionScore = this.calculateCohesion(cluster.functions, callGraph);
        cluster.type = this.determineClusterType(cluster, callGraph);
        cluster.recommendation = this.getClusterRecommendation(cluster);
        clusters.push(cluster);
      }
    }

    for (const func of functions) {
      if (!visited.has(func)) {
        const deps = callGraph[func] || [];
        const callers = this.findCallers(callGraph, func);

        if (deps.length === 0 && callers.length === 0) {
          clusters.push({
            name: this.generateClusterName(func),
            functions: [func],
            cohesionScore: 100,
            type: 'isolated',
            recommendation: '⚡ Изолированная функция - можно оставить или вынести в utils',
            isEntryPoint: false,
          });
        } else if (deps.length > 0 || callers.length > 0) {
          clusters.push({
            name: this.generateClusterName(func),
            functions: [func],
            cohesionScore: 0,
            type: 'orphan',
            recommendation: '❓ Функция имеет связи, но не вошла в кластер',
            isEntryPoint: false,
            dependencies: deps,
            callers: callers,
          });
        }
        visited.add(func);
      }
    }

    clusters.sort((a, b) => {
      if (a.cohesionScore !== b.cohesionScore) return b.cohesionScore - a.cohesionScore;
      if (a.functions.length !== b.functions.length) return b.functions.length - a.functions.length;
      return a.name.localeCompare(b.name);
    });

    if (this.options.verbose) {
      this.log(`\n📊 Детальный анализ кластеров:`);
      for (const cluster of clusters) {
        this.log(`\n   📦 ${cluster.name}:`);
        this.log(`      Функции: ${cluster.functions.join(', ')}`);
        this.log(`      Связность: ${cluster.cohesionScore}%`);
        this.log(`      Тип: ${cluster.type}`);
        this.log(`      Рекомендация: ${cluster.recommendation}`);
      }
    }

    return clusters;
  }

  private findEntryPoints(callGraph: Record<string, string[]>, functions: string[]): string[] {
    const calledFunctions = new Set<string>();
    for (const callees of Object.values(callGraph)) {
      if (Array.isArray(callees)) {
        for (const callee of callees) {
          calledFunctions.add(callee);
        }
      }
    }
    const entryPoints = functions.filter(f => !calledFunctions.has(f));
    if (entryPoints.length === 0) {
      const callCount = new Map<string, number>();
      for (const [caller, callees] of Object.entries(callGraph)) {
        if (Array.isArray(callees)) {
          callCount.set(caller, (callCount.get(caller) || 0) + callees.length);
        }
      }
      const sorted = Array.from(callCount.entries()).sort((a, b) => b[1] - a[1]);
      return sorted.slice(0, 3).map(([func]) => func);
    }
    return entryPoints;
  }

  private findCallers(callGraph: Record<string, string[]>, target: string): string[] {
    const callers: string[] = [];
    for (const [caller, callees] of Object.entries(callGraph)) {
      if (Array.isArray(callees) && callees.includes(target)) {
        callers.push(caller);
      }
    }
    return callers;
  }

  private calculateCohesion(functions: string[], callGraph: Record<string, string[]>): number {
    if (functions.length <= 1) return 100;
    let internalEdges = 0;
    for (const fn of functions) {
      const deps = callGraph[fn] || [];
      if (Array.isArray(deps)) {
        internalEdges += deps.filter(dep => functions.includes(dep)).length;
      }
    }
    const totalPossibleEdges = functions.length * (functions.length - 1);
    return totalPossibleEdges > 0 ? Math.round((internalEdges / totalPossibleEdges) * 100) : 0;
  }

  private determineClusterType(cluster: any, callGraph: Record<string, string[]>): string {
    const hasExternalDeps = cluster.functions.some((fn: string) => {
      const deps = callGraph[fn] || [];
      if (Array.isArray(deps)) {
        return deps.some((dep: string) => !cluster.functions.includes(dep));
      }
      return false;
    });
    const isCalledExternally = cluster.functions.some((fn: string) => {
      for (const [caller, callees] of Object.entries(callGraph)) {
        if (Array.isArray(callees) && !cluster.functions.includes(caller) && callees.includes(fn)) {
          return true;
        }
      }
      return false;
    });
    if (cluster.isEntryPoint && hasExternalDeps) return 'core';
    if (isCalledExternally && !hasExternalDeps) return 'library';
    if (!hasExternalDeps && !isCalledExternally) return 'internal';
    return 'utility';
  }

  private getClusterRecommendation(cluster: any): string {
    if (cluster.type === 'core')
      return '🔷 Основной модуль - рекомендуется выделить в отдельный файл';
    if (cluster.type === 'library')
      return '📚 Библиотечный модуль - можно вынести для переиспользования';
    if (cluster.type === 'internal') return '🔒 Внутренний модуль - хороший кандидат для выделения';
    if (cluster.type === 'isolated')
      return '⚡ Изолированная функция - можно оставить или вынести в utils';
    return '❓ Требует анализа - проверьте зависимости';
  }

  private findIsolatedFunctions(analysis: any, existingClusters: any[]): any[] {
    const allFunctionsInClusters = new Set<string>();
    for (const cluster of existingClusters) {
      for (const fn of cluster.functions) {
        allFunctionsInClusters.add(fn);
      }
    }
    const isolated: any[] = [];
    for (const func of analysis.functions) {
      if (!allFunctionsInClusters.has(func)) {
        const deps = analysis.callGraph[func] || [];
        if (deps.length === 0) {
          isolated.push({
            name: this.generateClusterName(func),
            functions: [func],
            cohesionScore: 100,
            type: 'isolated',
            recommendation: '⚡ Изолированная функция',
          });
        }
      }
    }
    return isolated;
  }

  private async updateImports(sourceFile: SourceFile, modules: ExtractedModule[]): Promise<void> {
    if (modules.length === 0) return;
    await this.importManager.updateImports(sourceFile.getFilePath(), modules);
  }

  private async optimizeImportOrder(sourceFile: SourceFile): Promise<void> {
    await this.importManager.optimizeImportOrder(sourceFile.getFilePath());
  }

  private extractFunctionContract(func: any): FunctionContract | null {
    const name = func.getName();
    if (!name) return null;

    const params = func.getParameters().map((p: any) => ({
      name: p.getName(),
      type: this.getParamType(p),
    }));

    const returnType = this.getReturnType(func);
    const preconditions: any[] = [];
    const postconditions: any[] = [];

    for (const param of params) {
      if (param.type === 'int') {
        preconditions.push(range(param.name, -1000, 1000));
      }
    }

    return { name, params, returnType, preconditions, postconditions, invariants: [] };
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

  private generateClusterName(funcName: string): string {
    let name = funcName.replace(
      /^(get|set|is|has|use|fetch|handle|on|validate|process|calculate)/,
      ''
    );
    name = name.charAt(0).toLowerCase() + name.slice(1);
    return name + 'Module';
  }

  private async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.promises.copyFile(filePath, backupPath);
    this.log(`💾 Бэкап создан: ${path.basename(backupPath)}`);
    return backupPath;
  }

  private async restoreBackup(filePath: string, backupPath: string): Promise<void> {
    if (fs.existsSync(backupPath)) {
      await fs.promises.copyFile(backupPath, filePath);
      this.log(`🔄 Восстановлен бэкап: ${path.basename(backupPath)}`);
    }
  }

  private collectMetrics(data: any): RefactorResult['metrics'] {
    const cyclomaticComplexity = data.semanticResults?.cfg
      ? this.calculateCyclomaticComplexity(data.semanticResults.cfg)
      : 0;

    return {
      cyclomaticComplexity,
      totalFunctions: data.semanticResults?.callGraph?.nodes.size || 0,
      unusedFunctionsCount: data.semanticResults?.unusedFunctions?.length || 0,
      typeErrorsCount: data.semanticResults?.typeErrors?.length || 0,
      verifiedFunctionsCount:
        data.verificationResults?.filter((r: VerificationResult) => r.isValid).length || 0,
      dataFlowIssuesCount: data.semanticResults?.dataFlow?.findUnusedVariables().length || 0,
      eslintFixesCount:
        data.eslintResults?.reduce((sum: number, r: ESLintFixResult) => sum + r.fixes, 0) || 0,
      tsFixesCount: data.tsFixResults?.fixedCount || 0,
      codeFixesCount:
        data.codeFixResults?.reduce((sum: number, r: FixResult) => sum + r.fixes, 0) || 0,
    };
  }

  private calculateCyclomaticComplexity(cfg: ControlFlowGraph): number {
    const nodes = cfg.blocks.length;
    let edges = 0;
    for (const block of cfg.blocks) {
      edges += block.successors.length;
    }
    return Math.max(1, edges - nodes + 2);
  }

  private logHeader(title: string): void {
    console.log('\n' + '='.repeat(60));
    console.log(`🔧 ${title}`);
    console.log('='.repeat(60));
  }

  private logSection(title: string): void {
    console.log(`\n📌 ${title}`);
    console.log('-'.repeat(40));
  }

  private log(message: string): void {
    console.log(message);
  }

  private logSemanticStatus(): void {
    if (this.options.semanticAnalysis) {
      this.log(`🧠 Семантический анализ: ВКЛЮЧЕН`);
      if (this.options.formalVerification) this.log(`🔬 Формальная верификация: ВКЛЮЧЕНА (Z3)`);
      if (this.options.dataFlowAnalysis) this.log(`🌊 Data Flow анализ: ВКЛЮЧЕН`);
      if (this.options.callGraphAnalysis) this.log(`🕸️ Call Graph анализ: ВКЛЮЧЕН`);
      if (this.options.jsxAnalysis) this.log(`⚛️ JSX/TSX анализ: ВКЛЮЧЕН`);
      if (this.options.vueAnalysis) this.log(`🎯 Vue анализ: ВКЛЮЧЕН`);
    }
    if (this.options.eslintCheck)
      this.log(`📝 ESLint: ВКЛЮЧЕН${this.options.eslintFix ? ' (с автоисправлением)' : ''}`);
    if (this.options.typeCheck) this.log(`🔷 TypeScript проверка: ВКЛЮЧЕНА`);
    if (this.options.autoFix) this.log(`🔧 Автоисправление: ВКЛЮЧЕНО`);
    if (this.options.optimizeImports) this.log(`📦 Оптимизация импортов: ВКЛЮЧЕНА`);
    if (this.options.extractIsolatedFunctions)
      this.log(`⚡ Выделение изолированных функций: ВКЛЮЧЕНО`);
  }

  private logClusters(clusters: any[]): void {
    this.log(`\n📊 Найдено кластеров: ${clusters.length}`);
    clusters.forEach((cluster, i) => {
      this.log(
        `   ${i + 1}. ${cluster.name}: [${cluster.functions.join(', ')}] (связность: ${cluster.cohesionScore}%, тип: ${cluster.type})`
      );
    });
  }

  private logMetrics(metrics: RefactorResult['metrics']): void {
    this.log('\n📊 ИТОГОВЫЕ МЕТРИКИ:');
    this.log(`   • Цикломатическая сложность: ${metrics?.cyclomaticComplexity}`);
    this.log(`   • Всего функций: ${metrics?.totalFunctions}`);
    this.log(`   • Неиспользуемых функций: ${metrics?.unusedFunctionsCount}`);
    this.log(`   • Ошибок типов: ${metrics?.typeErrorsCount}`);
    this.log(`   • Верифицировано функций: ${metrics?.verifiedFunctionsCount}`);
    this.log(`   • Проблем Data Flow: ${metrics?.dataFlowIssuesCount}`);
    this.log(`   • ESLint исправлений: ${metrics?.eslintFixesCount}`);
    this.log(`   • TypeScript исправлений: ${metrics?.tsFixesCount}`);
    this.log(`   • Code исправлений: ${metrics?.codeFixesCount}`);
  }

  private logSuccess(modules: ExtractedModule[], backupPath?: string): void {
    this.log('\n✨ РЕФАКТОРИНГ УСПЕШНО ЗАВЕРШЁН!');
    this.log(`📦 Создано модулей: ${modules.length}`);
    if (modules.length > 0) {
      this.log('\n📁 СОЗДАННЫЕ МОДУЛИ:');
      for (const module of modules) {
        const relativePath = path.relative(process.cwd(), module.path);
        this.log(`   ✅ ${relativePath} (${module.exports.length} экспортов)`);
      }
    }
    if (backupPath) this.log(`\n💾 Бэкап: ${path.relative(process.cwd(), backupPath)}`);
    this.log('\n💡 Совет: Запустите линтер и тесты после рефакторинга');
  }

  private logError(error: unknown): void {
    this.log('\n❌ КРИТИЧЕСКАЯ ОШИБКА:');
    this.log(error instanceof Error ? error.message : String(error));
    if (this.options.verbose && error instanceof Error && error.stack) {
      this.log('\nСтек вызовов:');
      this.log(error.stack);
    }
  }

  private createSuccessResult(
    modules: ExtractedModule[],
    backupPath: string | undefined,
    extra: any
  ): RefactorResult {
    return { success: true, modules, backupPath, ...extra };
  }

  private createErrorResult(
    error: string,
    backupPath: string | undefined,
    extra: any
  ): RefactorResult {
    return { success: false, modules: [], backupPath, error, ...extra };
  }

  async initialize(): Promise<void> {
    this.log('🚀 Инициализация AutoRefactor с полным pipeline...');
    if (this.options.formalVerification) await this.z3Verifier.initialize();
    this.log('✅ Все компоненты инициализированы');
  }

  async dispose(): Promise<void> {
    if (this.z3Verifier) await this.z3Verifier.dispose();
  }
}

export { TypeScriptValidator } from './TypeScriptValidator.js';
export { ESLintASTFixer } from './ESLintASTFixer.js';
export { CodeValidator } from './CodeValidator.js';
export type { ValidationResult } from './CodeValidator.js';
export { CodeFixer } from './CodeFixer.js';
export type { FixResult } from './CodeFixer.js';
export { ImportManager } from './ImportManager.js';
export { TemplateUpdater } from './TemplateUpdater.js';
export { ModuleExtractor } from './ModuleExtractor.js';
