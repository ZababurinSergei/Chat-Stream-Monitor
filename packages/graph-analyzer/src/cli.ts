#!/usr/bin/env node

/**
 * CLI entry point for graph-analyzer
 * Handles command-line argument parsing and routing to appropriate modes
 */

import fs from 'fs';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

// Core modules
import { minifyForAI } from './core/minifier.js';
import { findCyclicEdges, convertToDOT } from './core/graph-utils.js';

// Mode modules
import { buildProjectGraph } from './modes/project-graph.js';
import { buildFileInternalGraph } from './modes/file-graph.js';
import { buildAiPromptPack } from './modes/prompt-pack.js';
import { buildSplitModulePrompt } from './modes/split-module.js';
import { runImpactAnalysis } from './modes/impact.js';
import { findDeadCode } from './modes/dead-code.js';
import { minifyFolder } from './modes/minify-folder.js';

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
  options?: SplitModuleOptions | MinifyFolderOptions;
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

  if (!mode || mode === '--help' || mode === '-h') {
    showHelp();
    return null;
  }

  // Mode: split-module
  if (mode === 'split-module' || mode === 'split') {
    const targetPath = args[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
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

    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

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

    return { mode: 'split-module', targetPath, options };
  }

  // Mode: minify-folder
  if (mode === 'minify-folder') {
    const targetPath = args[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к каталогу');
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

    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

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

    return { mode: 'minify-folder', targetPath, options };
  }

  // Mode: dead-code
  if (mode === 'dead-code') {
    const targetPath = args[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      return null;
    }
    return { mode: 'dead-code', targetPath, extraArg: '', depthArg: '' };
  }

  // Mode: impact
  if (mode === 'impact') {
    const targetPath = args[1];
    const entityName = args[2];
    if (!targetPath || !entityName) {
      console.error('❌ Укажите файл и сущность: impact <файл> <entity>');
      return null;
    }
    return { mode: 'impact', targetPath, extraArg: entityName, depthArg: '' };
  }

  // Mode: prompt-pack
  if (mode === 'prompt-pack') {
    const targetPath = args[1];
    const depth = args[2];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      return null;
    }
    return { mode: 'prompt-pack', targetPath, extraArg: depth, depthArg: '' };
  }

  // Mode: minify (single file)
  if (mode === 'minify') {
    const targetPath = args[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      return null;
    }
    return { mode: 'minify', targetPath, extraArg: '', depthArg: '' };
  }

  // Mode: project (graph)
  if (mode === 'project') {
    const targetPath = args[1];
    const maxDepth = args[2];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      return null;
    }
    return { mode: 'project', targetPath, extraArg: maxDepth, depthArg: '' };
  }

  // Mode: file (internal graph)
  if (mode === 'file') {
    const targetPath = args[1];
    if (!targetPath) {
      console.error('❌ Укажите путь к файлу');
      return null;
    }
    return { mode: 'file', targetPath, extraArg: '', depthArg: '' };
  }

  console.error(`❌ Неизвестный режим: ${mode}`);
  showHelp();
  return null;
}

// ==========================================
// MAIN CLI ENTRY POINT
// ==========================================

export async function runCLI(): Promise<void> {
  const parsed = parseArgs();
  if (!parsed) return;

  const { mode, targetPath, extraArg, options } = parsed;

  try {
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
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch(console.error);
}
