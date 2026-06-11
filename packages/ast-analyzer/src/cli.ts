#!/usr/bin/env node

/**
 * CLI entry point for graph-analyzer
 * Handles command-line argument parsing and routing to appropriate modes
 */

import fs from 'fs';
import path from 'path';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

// Core modules
import { minifyForAI } from './core/minifier.js';
import { findCyclicEdges, convertToDOT } from './core/graph-utils.js';
import { setTsConfigPath, loadTsConfig } from './core/tsconfig-resolver.js';

// Mode modules
import { buildProjectGraph } from './modes/project-graph.js';
import { buildFileInternalGraph } from './modes/file-graph.js';
import { buildAiPromptPack } from './modes/prompt-pack.js';
import { buildSplitModulePrompt } from './modes/split-module.js';
import { runImpactAnalysis } from './modes/impact.js';
import { findDeadCode } from './modes/dead-code.js';
import { minifyFolder } from './modes/minify-folder.js';

// Vue analysis
import { analyzeVueComponent, generateVueComponentReport } from './modes/vue-analyzer.js';

// Reporters
import { generateHTMLReport } from './reporters/html-reporter.js';

// Types
import type { SplitModuleOptions, MinifyFolderOptions } from './types.js';

// Utils
import { showHelp, DEFAULT_EXCLUDE_PATTERNS } from './utils.js';

// ==========================================
// CLI ARGUMENT PARSING
// ==========================================

interface ParsedArgs {
  mode: string;
  targetPath: string;
  extraArg?: string;
  depthArg?: string;
  outputDir?: string;
  tsconfigPath?: string;
  options?: SplitModuleOptions | MinifyFolderOptions | any;
}

interface GraphResult {
  rootKey: string;
  graph: Record<string, string[]>;
  hasCycles?: boolean;
  cyclicEdges?: string[];
}

function parseArgs(): ParsedArgs | null {
  const args = process.argv.slice(2);
  const mode = args[0];

  let outputDir: string | undefined;
  let tsconfigPath: string | undefined;
  const cleanArgs: string[] = [];

  // Извлекаем -o/--output и --tsconfig из аргументов
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      if (arg && args[i + 1]) {
        outputDir = args[i + 1];
        i++; // пропускаем значение
      }
    } else if (arg === '--tsconfig') {
      if (args[i + 1]) {
        tsconfigPath = args[i + 1];
        i++;
      }
    } else if (arg) {
      cleanArgs.push(arg);
    }
  }

  // Временно заменяем argv для существующего парсинга
  const originalArgv = [...process.argv];
  const newArgv = [originalArgv[0] || 'node', originalArgv[1] || 'cli.js', ...cleanArgs];
  process.argv = newArgv;

  if (!mode || mode === '--help' || mode === '-h') {
    showHelp();
    process.argv = originalArgv;
    return null;
  }

  // Mode: vue-analyze (НОВЫЙ РЕЖИМ!)
  if (mode === 'vue-analyze' || mode === 'vue') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к Vue файлу');
      process.argv = originalArgv;
      return null;
    }

    if (!targetPath.endsWith('.vue')) {
      console.error('❌ Файл должен иметь расширение .vue');
      process.argv = originalArgv;
      return null;
    }

    const options = {
      includeTemplateAST: true,
      includeScriptAST: true,
      extractComposableCalls: true,
    };

    for (let i = 2; i < cleanArgs.length; i++) {
      const arg = cleanArgs[i];
      switch (arg) {
        case '--no-template-ast':
          options.includeTemplateAST = false;
          break;
        case '--no-script-ast':
          options.includeScriptAST = false;
          break;
        case '--no-composables':
          options.extractComposableCalls = false;
          break;
      }
    }

    process.argv = originalArgv;
    return { mode: 'vue-analyze', targetPath, options: options as any, outputDir, tsconfigPath };
  }

  // Mode: split-module
  if (mode === 'split-module' || mode === 'split') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }

    const options: SplitModuleOptions = {
      outputFile: 'ai-split-module-prompt.md',
      includeFullCode: true,
      includeMinified: true,
      includeGraph: true,
      includeStats: true,
      includeSuggestions: true,
      targetClusterSize: 3,
      maxClusterSize: 10,
      maxDepth: 5,
      excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS],
      prefix: '',
    };

    for (let i = 2; i < cleanArgs.length; i++) {
      const arg = cleanArgs[i];
      const nextArg = cleanArgs[i + 1];

      switch (arg) {
        case '--output':
        case '-o':
          if (nextArg !== undefined) {
            options.outputFile = nextArg;
            i++;
          }
          break;
        case '--target-cluster-size':
        case '-t':
          if (nextArg !== undefined) {
            options.targetClusterSize = parseInt(nextArg, 10);
            i++;
          }
          break;
        case '--max-cluster-size':
        case '-m':
          if (nextArg !== undefined) {
            options.maxClusterSize = parseInt(nextArg, 10);
            i++;
          }
          break;
        case '--max-depth':
        case '-d':
          if (nextArg !== undefined) {
            options.maxDepth = parseInt(nextArg, 10);
            i++;
          }
          break;
        case '--exclude':
        case '-x':
          if (nextArg !== undefined) {
            options.excludePatterns = nextArg.split(',').map(e => e.trim());
            i++;
          }
          break;
        case '--prefix':
        case '-p':
          if (nextArg !== undefined) {
            options.prefix = nextArg;
            i++;
          }
          break;
        case '--no-full-code':
          options.includeFullCode = false;
          break;
        case '--no-minified':
          options.includeMinified = false;
          break;
        case '--no-graph':
          options.includeGraph = false;
          break;
        case '--no-stats':
          options.includeStats = false;
          break;
        case '--no-suggestions':
          options.includeSuggestions = false;
          break;
      }
    }

    process.argv = originalArgv;
    return { mode: 'split-module', targetPath, options, outputDir, tsconfigPath };
  }

  // Mode: minify-folder
  if (mode === 'minify-folder') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к каталогу');
      process.argv = originalArgv;
      return null;
    }

    const options: MinifyFolderOptions = {
      outputFile: 'ai-project-context.md',
      showStructure: true,
      addTableOfContents: true,
      sortByType: true,
      maxDepth: 10,
      extensions: ['.js', '.ts', '.tsx', '.jsx', '.vue', '.mjs', '.cjs'],
      excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS],
    };

    for (let i = 2; i < cleanArgs.length; i++) {
      const arg = cleanArgs[i];
      const nextArg = cleanArgs[i + 1];

      switch (arg) {
        case '--output':
        case '-o':
          if (nextArg !== undefined) {
            options.outputFile = nextArg;
            i++;
          }
          break;
        case '--depth':
        case '-d':
          if (nextArg !== undefined) {
            options.maxDepth = parseInt(nextArg, 10);
            i++;
          }
          break;
        case '--extensions':
        case '-e':
          if (nextArg !== undefined) {
            options.extensions = nextArg.split(',').map(e => e.trim().toLowerCase());
            i++;
          }
          break;
        case '--exclude':
        case '-x':
          if (nextArg !== undefined) {
            options.excludePatterns = nextArg.split(',').map(e => e.trim());
            i++;
          }
          break;
        case '--no-structure':
          options.showStructure = false;
          break;
        case '--no-toc':
          options.addTableOfContents = false;
          break;
      }
    }

    process.argv = originalArgv;
    return { mode: 'minify-folder', targetPath, options, outputDir, tsconfigPath };
  }

  // Mode: dead-code
  if (mode === 'dead-code') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return { mode: 'dead-code', targetPath, extraArg: '', depthArg: '', outputDir, tsconfigPath };
  }

  // Mode: impact
  if (mode === 'impact') {
    const targetPath = cleanArgs[1];
    const entityName = cleanArgs[2];
    if (!targetPath || !entityName) {
      console.error('❌ Укажите файл и сущность: impact <файл> <entity>');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return {
      mode: 'impact',
      targetPath,
      extraArg: entityName,
      depthArg: '',
      outputDir,
      tsconfigPath,
    };
  }

  // Mode: prompt-pack
  if (mode === 'prompt-pack') {
    const targetPath = cleanArgs[1];
    const depth = cleanArgs[2];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return {
      mode: 'prompt-pack',
      targetPath,
      extraArg: depth,
      depthArg: '',
      outputDir,
      tsconfigPath,
    };
  }

  // Mode: minify (single file)
  if (mode === 'minify') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return { mode: 'minify', targetPath, extraArg: '', depthArg: '', outputDir, tsconfigPath };
  }

  // Mode: project (graph)
  if (mode === 'project') {
    const targetPath = cleanArgs[1];
    const maxDepth = cleanArgs[2];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return {
      mode: 'project',
      targetPath,
      extraArg: maxDepth,
      depthArg: '',
      outputDir,
      tsconfigPath,
    };
  }

  // Mode: file (internal graph)
  if (mode === 'file') {
    const targetPath = cleanArgs[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      process.argv = originalArgv;
      return null;
    }
    process.argv = originalArgv;
    return { mode: 'file', targetPath, extraArg: '', depthArg: '', outputDir, tsconfigPath };
  }

  console.error(`❌ Неизвестный режим: ${mode}`);
  showHelp();
  process.argv = originalArgv;
  return null;
}

// ==========================================
// MAIN CLI ENTRY POINT
// ==========================================

export async function runCLI(): Promise<void> {
  const parsed = parseArgs();
  if (!parsed) return;

  let { mode, targetPath, extraArg, options, outputDir, tsconfigPath } = parsed;

  // Сохраняем исходную директорию СРАЗУ
  const originalCwd = process.cwd();

  // 1. СНАЧАЛА обрабатываем tsconfig (до смены директории)
  if (tsconfigPath) {
    const resolvedTsconfig = path.isAbsolute(tsconfigPath)
      ? tsconfigPath
      : path.resolve(originalCwd, tsconfigPath);

    if (fs.existsSync(resolvedTsconfig)) {
      setTsConfigPath(resolvedTsconfig);
      console.log(`📄 TsConfig: ${resolvedTsconfig}`);

      // Дополнительно загружаем и показываем алиасы
      const tsConfig = loadTsConfig(path.dirname(resolvedTsconfig));
      if (tsConfig?.compilerOptions?.paths) {
        console.log(`🔗 Найдены алиасы в tsconfig:`);
        Object.entries(tsConfig.compilerOptions.paths).forEach(([alias, targets]) => {
          console.log(`   ${alias} → ${targets[0]}`);
        });
      }
    } else {
      console.warn(`⚠️ TsConfig не найден: ${resolvedTsconfig}`);
      console.warn(`   Искали: ${resolvedTsconfig}`);
    }
  }

  // 2. ПОТОМ обрабатываем outputDir и меняем директорию
  let outputDirChanged = false;
  let originalTargetPath = targetPath;

  if (outputDir) {
    // Создаем директорию если её нет (относительно originalCwd)
    const absoluteOutputDir = path.resolve(originalCwd, outputDir);
    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
      console.log(`📁 Создана выходная директория: ${absoluteOutputDir}`);
    }

    // Преобразуем targetPath в абсолютный путь относительно исходной директории
    if (!path.isAbsolute(targetPath)) {
      targetPath = path.resolve(originalCwd, targetPath);
      console.log(`📄 Преобразован относительный путь в абсолютный:`);
      console.log(`   Было: ${originalTargetPath}`);
      console.log(`   Стало: ${targetPath}`);
    }

    // Проверяем существование файла
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Файл не найден: ${targetPath}`);
      process.exit(1);
    }

    // Меняем рабочую директорию
    process.chdir(absoluteOutputDir);
    outputDirChanged = true;
    console.log(`📂 Выходная директория: ${process.cwd()}\n`);
  }

  try {
    // НОВЫЙ РЕЖИМ: vue-analyze
    if (mode === 'vue-analyze' || mode === 'vue') {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 АНАЛИЗ VUE КОМПОНЕНТА`);
      console.log(`${'='.repeat(60)}\n`);

      const analysis = analyzeVueComponent(targetPath, options as any);
      if (!analysis) {
        console.error('❌ Не удалось проанализировать Vue компонент');
        process.exit(1);
      }

      // Сохраняем JSON отчет
      const jsonOutput = {
        ...analysis,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync('vue-analysis.json', JSON.stringify(jsonOutput, null, 2));
      console.log(`✅ JSON анализ сохранен: vue-analysis.json`);

      // Сохраняем Markdown отчет
      const markdownReport = generateVueComponentReport(analysis);
      fs.writeFileSync('vue-analysis.md', markdownReport);
      console.log(`✅ Markdown отчет сохранен: vue-analysis.md`);

      // Выводим краткую информацию
      console.log(`\n📊 КРАТКАЯ ИНФОРМАЦИЯ:`);
      console.log(`   🏷️  Компонент: ${analysis.componentName}`);
      console.log(`   📥 Props: ${analysis.props.names.length}`);
      console.log(`   📤 Events: ${analysis.emits.names.length}`);
      console.log(`   🎭 Slots: ${analysis.slots.length}`);
      console.log(`   🧩 Composables: ${analysis.composables.length}`);
      console.log(`   📝 Скрипт: ${analysis.stats.scriptLines} строк`);
      console.log(`   🎨 Шаблон: ${analysis.stats.templateLines} строк`);
      console.log(`   🎭 Стили: ${analysis.stats.styleCount} блоков`);
      console.log(`   💻 TypeScript: ${analysis.script.isTS ? '✅' : '❌'}`);
      console.log(`   📦 Setup: ${analysis.script.isSetup ? '✅' : '❌'}`);

      console.log(`\n✨ Анализ Vue компонента завершен!`);
      return;
    }

    // Mode: split-module
    if (mode === 'split-module' || mode === 'split') {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔪 РАЗБИЕНИЕ ФАЙЛА НА МОДУЛИ`);
      console.log(`${'='.repeat(60)}`);

      const result = buildSplitModulePrompt(targetPath, options as SplitModuleOptions);
      if (result) {
        console.log(`\n📋 Инструкция:`);
        console.log(`   1. Откройте ${result.outputFiles.prompt}`);
        console.log(`   2. Скопируйте содержимое`);
        console.log(`   3. Отправьте в ChatGPT/Claude/Gemini`);
        console.log(`   4. Получите готовую структуру модулей`);
      }
      return;
    }

    // Mode: minify-folder
    if (mode === 'minify-folder') {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 РЕКУРСИВНАЯ МИНИФИКАЦИЯ ПРОЕКТА`);
      console.log(`${'='.repeat(60)}`);

      minifyFolder(targetPath, options as MinifyFolderOptions);
      return;
    }

    // Mode: dead-code
    if (mode === 'dead-code') {
      console.log(`🔎 Анализ мертвого кода: ${targetPath}`);
      const report = findDeadCode(targetPath);
      if (report) {
        fs.writeFileSync('ai-dead-code-report.md', report);
        console.log(report);
        console.log(`\n✅ Отчет сохранен: ai-dead-code-report.md`);
      }
      return;
    }

    // Mode: impact
    if (mode === 'impact') {
      if (!extraArg) {
        console.error('❌ Укажите имя сущности: node graph-analyzer.js impact <файл> <entity>');
        process.exit(1);
      }
      console.log(`💥 Анализ влияния: ${extraArg} в ${targetPath}`);
      const report = runImpactAnalysis(targetPath, extraArg);
      fs.writeFileSync('ai-impact-report.md', report);
      console.log(report);
      console.log(`\n✅ Отчет сохранен: ai-impact-report.md`);
      return;
    }

    // Mode: prompt-pack
    if (mode === 'prompt-pack') {
      const depth = extraArg ? parseInt(extraArg, 10) : 2;
      console.log(`🎒 Сборка промпт-пака для ${targetPath} (глубина ${depth})`);
      const pack = buildAiPromptPack(targetPath, depth);
      fs.writeFileSync('ai-prompt-bundle.md', pack);
      console.log(`\n✅ Пакет сохранен: ai-prompt-bundle.md`);
      console.log(`📊 Размер: ${(pack.length / 1024).toFixed(2)} KB`);
      return;
    }

    // Mode: minify (single file)
    if (mode === 'minify') {
      console.log(`✂️ Минификация: ${targetPath}`);
      const minified = minifyForAI(targetPath);
      if (minified) {
        fs.writeFileSync('ai-context.txt', minified);
        console.log(`\n✅ Минифицированный код сохранен: ai-context.txt`);
        const originalSize = fs.statSync(targetPath).size;
        console.log(`📊 Исходный размер: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`📊 Сжатый размер: ${(minified.length / 1024).toFixed(2)} KB`);
        const ratio = ((minified.length / originalSize) * 100).toFixed(1);
        console.log(`📊 Экономия: ${(100 - parseFloat(ratio)).toFixed(1)}% токенов`);
      }
      return;
    }

    // Mode: project (graph)
    if (mode === 'project') {
      const maxDepth = extraArg ? parseInt(extraArg, 10) : Infinity;
      console.log(
        `📁 Построение графа проекта от ${targetPath} (глубина ${maxDepth === Infinity ? '∞' : maxDepth})`
      );

      const resultData = buildProjectGraph(targetPath, maxDepth) as GraphResult;
      if (!resultData || Object.keys(resultData.graph).length === 0) {
        console.log('⚠️ Зависимости не найдены');
        return;
      }

      const cyclicEdges = findCyclicEdges(resultData.graph);
      const hasCycles = cyclicEdges.size > 0;
      resultData.hasCycles = hasCycles;
      resultData.cyclicEdges = Array.from(cyclicEdges);

      fs.writeFileSync('output.json', JSON.stringify(resultData, null, 2));
      console.log(`   ✅ output.json (${Object.keys(resultData.graph).length} узлов)`);

      const dotContent = convertToDOT(resultData, cyclicEdges);
      fs.writeFileSync('output.dot', dotContent);
      console.log(`   ✅ output.dot`);

      console.log(`⚙️ Генерация SVG...`);
      const graphviz = await Graphviz.load();
      const svgContent = graphviz.dot(dotContent);
      fs.writeFileSync('output.svg', svgContent);
      console.log(`   ✅ output.svg`);

      const htmlContent = generateHTMLReport(
        svgContent,
        dotContent,
        JSON.stringify(resultData, null, 2),
        targetPath,
        hasCycles
      );
      fs.writeFileSync('report.html', htmlContent);
      console.log(`   ✅ report.html`);

      console.log(`\n🎉 Готово! Откройте report.html в браузере`);
      if (hasCycles) {
        console.log(`⚠️ Обнаружено ${cyclicEdges.size} циклических зависимостей`);
      }
      return;
    }

    // Mode: file (internal graph)
    if (mode === 'file') {
      console.log(`📄 Построение внутреннего графа файла ${targetPath}`);

      const resultData = buildFileInternalGraph(targetPath) as GraphResult;
      if (!resultData || Object.keys(resultData.graph).length === 0) {
        console.log('⚠️ Зависимости не найдены');
        return;
      }

      const cyclicEdges = findCyclicEdges(resultData.graph);
      const hasCycles = cyclicEdges.size > 0;
      resultData.hasCycles = hasCycles;
      resultData.cyclicEdges = Array.from(cyclicEdges);

      fs.writeFileSync('output.json', JSON.stringify(resultData, null, 2));
      console.log(`   ✅ output.json (${Object.keys(resultData.graph).length} узлов)`);

      const dotContent = convertToDOT(resultData, cyclicEdges);
      fs.writeFileSync('output.dot', dotContent);
      console.log(`   ✅ output.dot`);

      console.log(`⚙️ Генерация SVG...`);
      const graphviz = await Graphviz.load();
      const svgContent = graphviz.dot(dotContent);
      fs.writeFileSync('output.svg', svgContent);
      console.log(`   ✅ output.svg`);

      const htmlContent = generateHTMLReport(
        svgContent,
        dotContent,
        JSON.stringify(resultData, null, 2),
        targetPath,
        hasCycles
      );
      fs.writeFileSync('report.html', htmlContent);
      console.log(`   ✅ report.html`);

      console.log(`\n🎉 Готово! Откройте report.html в браузере`);
      if (hasCycles) {
        console.log(`⚠️ Обнаружено ${cyclicEdges.size} циклических зависимостей`);
      }
      return;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    // Возвращаемся в исходную директорию
    if (outputDirChanged) {
      process.chdir(originalCwd);
      console.log(`\n📂 Возврат в исходную директорию: ${originalCwd}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch(console.error);
}