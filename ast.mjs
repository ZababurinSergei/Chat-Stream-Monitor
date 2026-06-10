// test.mjs
import {
  buildProjectGraph, // Граф зависимостей проекта
  buildFileInternalGraph, // Внутренний граф файла
  minifyForAI, // Сжатие кода
  findCyclicEdges, // Поиск циклических зависимостей
  convertToDOT, // Конвертация в DOT формат
  runImpactAnalysis, // Анализ влияния
  findDeadCode, // Поиск мертвого кода
  buildAiPromptPack, // Сборка контекста для ИИ
  buildSplitModulePrompt, // Разбиение на модули
} from "./packages/ast-analyzer/dist/index.js";

import fs from "fs";
import path from "path";

// ==========================================
// ПРИМЕР 1: Получение JSON графа зависимостей
// ==========================================
async function getProjectGraphJSON() {
  console.log("\n📊 Пример 1: Граф зависимостей проекта\n");

  // Строим граф
  const targetFile = "./Directory/11/backend/server.js";
  const maxDepth = 3;

  const graphData = buildProjectGraph(targetFile, maxDepth);

  // graphData содержит:
  // - rootKey: корневой файл
  // - graph: объект зависимостей { "file1.js": ["dep1.js", "dep2.js"], ... }

  console.log(`Корневой файл: ${graphData.rootKey}`);
  console.log(`Количество модулей: ${Object.keys(graphData.graph).length}`);

  // Находим циклические зависимости
  const cycles = findCyclicEdges(graphData.graph);
  console.log(`Циклических зависимостей: ${cycles.size}`);

  // Сохраняем JSON
  const outputJSON = {
    rootKey: graphData.rootKey,
    graph: graphData.graph,
    stats: {
      totalModules: Object.keys(graphData.graph).length,
      totalDependencies: Object.values(graphData.graph).reduce(
        (sum, deps) => sum + deps.length,
        0,
      ),
      cyclicDependencies: cycles.size,
      cycles: Array.from(cycles),
    },
    timestamp: new Date().toISOString(),
  };

    // fs.writeFileSync("graph-output.json", JSON.stringify(outputJSON, null, 2));
    console.log("✅ JSON сохранен: graph-output.json\n", JSON.stringify(outputJSON, null, 2)
  );

  return outputJSON;
}

// ==========================================
// ПРИМЕР 2: Внутренний граф файла
// ==========================================
function getFileInternalGraphJSON() {
  console.log("\n📊 Пример 2: Внутренний граф файла\n");

  const filePath = "./Directory/11/backend/server.js";
  const internalGraph = buildFileInternalGraph(filePath);

  if (internalGraph) {
    console.log(`Файл: ${internalGraph.rootKey}`);
    console.log(
      `Количество внутренних сущностей: ${Object.keys(internalGraph.graph).length}`,
    );

    // Показываем связи
    for (const [entity, deps] of Object.entries(internalGraph.graph)) {
      if (deps.length > 0) {
        console.log(`  ${entity} → ${deps.join(", ")}`);
      }
    }

    const outputJSON = {
      file: internalGraph.rootKey,
      graph: internalGraph.graph,
      stats: {
        totalEntities: Object.keys(internalGraph.graph).length,
        totalEdges: Object.values(internalGraph.graph).reduce(
          (sum, deps) => sum + deps.length,
          0,
        ),
      },
    };

    // fs.writeFileSync(
    //   "internal-graph.json",
    //   JSON.stringify(outputJSON, null, 2),
    // );
    console.log(
      "\n✅ JSON сохранен: internal-graph.json\n",
      JSON.stringify(outputJSON, null, 2),
    );

    return outputJSON;
  }

  return null;
}

// ==========================================
// ПРИМЕР 3: Полный анализ с метаданными
// ==========================================
async function getCompleteAnalysisJSON() {
  console.log("\n📊 Пример 3: Полный анализ\n");

  const targetFile = "./Directory/11/backend/server.js";
  const maxDepth = 2;

  // 1. Строим граф
  const graph = buildProjectGraph(targetFile, maxDepth);

  // 2. Находим циклы
  const cycles = findCyclicEdges(graph.graph);

  // 3. Анализируем каждый файл
  const fileAnalyses = {};

  for (const filePath of Object.keys(graph.graph)) {
    const absPath = path.resolve(filePath);
    if (fs.existsSync(absPath)) {
      const internalGraph = buildFileInternalGraph(absPath);
      if (internalGraph && Object.keys(internalGraph.graph).length > 0) {
        fileAnalyses[filePath] = {
          entities: Object.keys(internalGraph.graph).length,
          internalDependencies: internalGraph.graph,
        };
      }
    }
  }

  // 4. Формируем полный JSON
  const completeJSON = {
    scanInfo: {
      targetFile: targetFile,
      maxDepth: maxDepth,
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
    },
    dependencyGraph: {
      rootKey: graph.rootKey,
      totalModules: Object.keys(graph.graph).length,
      totalDependencies: Object.values(graph.graph).reduce(
        (sum, deps) => sum + deps.length,
        0,
      ),
      graph: graph.graph,
      cyclicDependencies: {
        count: cycles.size,
        edges: Array.from(cycles),
      },
    },
    fileAnalyses: fileAnalyses,
    statistics: {
      modulesWithDeps: Object.values(graph.graph).filter(
        (deps) => deps.length > 0,
      ).length,
      modulesWithoutDeps: Object.values(graph.graph).filter(
        (deps) => deps.length === 0,
      ).length,
      averageDepsPerModule: (
        Object.values(graph.graph).reduce((sum, deps) => sum + deps.length, 0) /
        Object.keys(graph.graph).length
      ).toFixed(2),
    },
  };

  fs.writeFileSync(
    "complete-analysis.json",
    JSON.stringify(completeJSON, null, 2),
  );
  console.log("✅ Полный анализ сохранен: complete-analysis.json");
  console.log(`   - Модулей: ${completeJSON.dependencyGraph.totalModules}`);
  console.log(`   - Связей: ${completeJSON.dependencyGraph.totalDependencies}`);
  console.log(
    `   - Циклов: ${completeJSON.dependencyGraph.cyclicDependencies.count}\n`,
  );

  return completeJSON;
}

// ==========================================
// ПРИМЕР 4: Получение сжатого кода в JSON
// ==========================================
function getMinifiedCodeJSON() {
  console.log("\n📊 Пример 4: Сжатый код в JSON\n");

  const targetFile = "./Directory/11/backend/server.js";
  const minified = minifyForAI(targetFile);
  const originalSize = fs.statSync(targetFile).size;

  const outputJSON = {
    file: targetFile,
    originalSize: originalSize,
    minifiedSize: minified.length,
    compressionRatio:
      ((1 - minified.length / originalSize) * 100).toFixed(1) + "%",
    minifiedCode: minified,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("minified-output.json", JSON.stringify(outputJSON, null, 2));
  console.log("✅ Сжатый код сохранен: minified-output.json");
  console.log(`   - Сжатие: ${outputJSON.compressionRatio}\n`);

  return outputJSON;
}

// ==========================================
// ПРИМЕР 5: DOT формат для визуализации
// ==========================================
function getDOTFormatJSON() {
  console.log("\n📊 Пример 5: DOT формат\n");

  const targetFile = "./Directory/11/backend/server.js";
  const graphData = buildProjectGraph(targetFile, 2);
  const cycles = findCyclicEdges(graphData.graph);

  const dotContent = convertToDOT(graphData, cycles);

  const outputJSON = {
    dot: dotContent,
    metadata: {
      targetFile: targetFile,
      totalNodes: Object.keys(graphData.graph).length,
      hasCycles: cycles.size > 0,
      cyclesCount: cycles.size,
    },
  };

  fs.writeFileSync("dot-output.json", JSON.stringify(outputJSON, null, 2));
  console.log("✅ DOT формат сохранен: dot-output.json\n");

  return outputJSON;
}

// ==========================================
// ПРИМЕР 6: Пакетный анализ нескольких файлов
// ==========================================
async function batchAnalysisJSON() {
  console.log("\n📊 Пример 6: Пакетный анализ\n");

  const filesToAnalyze = [
    "./Directory/11/backend/server.js",
    "./Directory/10/FileSystemScanner.js",
    "./Directory/10/graph-analyzer.js",
  ];

  const results = [];

  for (const file of filesToAnalyze) {
    if (fs.existsSync(file)) {
      console.log(`Анализ: ${path.basename(file)}...`);

      try {
        const graph = buildProjectGraph(file, 2);
        const cycles = findCyclicEdges(graph.graph);

        results.push({
          file: file,
          fileName: path.basename(file),
          modules: Object.keys(graph.graph).length,
          dependencies: Object.values(graph.graph).reduce(
            (sum, deps) => sum + deps.length,
            0,
          ),
          cycles: cycles.size,
          hasCycles: cycles.size > 0,
        });
      } catch (error) {
        console.error(`  Ошибка анализа ${file}:`, error.message);
      }
    }
  }

  const summaryJSON = {
    scanDate: new Date().toISOString(),
    totalFilesAnalyzed: results.length,
    results: results,
    summary: {
      totalModules: results.reduce((sum, r) => sum + r.modules, 0),
      totalDependencies: results.reduce((sum, r) => sum + r.dependencies, 0),
      totalCycles: results.reduce((sum, r) => sum + r.cycles, 0),
      filesWithCycles: results.filter((r) => r.hasCycles).length,
    },
  };

  fs.writeFileSync("batch-analysis.json", JSON.stringify(summaryJSON, null, 2));
  console.log("\n✅ Пакетный анализ сохранен: batch-analysis.json");

  // Вывод таблицы
  console.log("\n📊 Результаты:");
  console.log("=".repeat(60));
  results.forEach((r) => {
    console.log(
      `${r.fileName.padEnd(30)} | Модулей: ${r.modules} | Связей: ${r.dependencies} | Циклов: ${r.cycles}`,
    );
  });
  console.log("=".repeat(60));

  return summaryJSON;
}

// ==========================================
// ЗАПУСК ВСЕХ ПРИМЕРОВ
// ==========================================
async function main() {
  console.log("🚀 AST Analyzer - Получение JSON данных\n");
  console.log("=".repeat(60));

  try {
    // Запускаем все примеры
    await getProjectGraphJSON();
    getFileInternalGraphJSON();
    // await getCompleteAnalysisJSON();
    // getMinifiedCodeJSON();
    // getDOTFormatJSON();
    // await batchAnalysisJSON();

    // console.log("\n" + "=".repeat(60));
    // console.log("✅ Все JSON файлы успешно созданы!");
    // console.log("\nСозданные файлы:");
    // console.log("  • graph-output.json         - граф зависимостей");
    // console.log("  • internal-graph.json       - внутренний граф файла");
    // console.log("  • complete-analysis.json    - полный анализ");
    // console.log("  • minified-output.json      - сжатый код");
    // console.log("  • dot-output.json           - DOT формат");
    // console.log("  • batch-analysis.json       - пакетный анализ");
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

// Запуск
main();
