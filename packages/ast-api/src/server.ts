// src/server.ts
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const execAsync = promisify(exec);

// Определяем пути
// При запуске из dist: __dirname = /project/packages/ast-api/dist
// public находится на уровне с dist: /project/packages/ast-api/public
const publicPath = path.join(__dirname, '../public');
const projectRoot = path.join(__dirname, '..');

console.log(`📁 Public directory: ${publicPath}`);
console.log(`📁 Project root: ${projectRoot}`);

// Middleware
app.use(cors());

// Настройка статических файлов с правильными MIME типами
app.use(
  express.static(publicPath, {
    setHeaders: (res, filePath) => {
      // Устанавливаем правильный MIME тип для JavaScript модулей
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      // Для JSON файлов
      else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // Для HTML
      else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      // Для CSS
      else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
      // Для SVG
      else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
      // Для остальных текстовых файлов
      else if (filePath.match(/\.(txt|md|ts|tsx|jsx)$/)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }

      // Добавляем заголовки для кеширования
      if (filePath.match(/\.(js|mjs|css|png|jpg|jpeg|gif|svg|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

app.use(express.json({ limit: '50mb' }));

// ============================================================
// УПРАВЛЕНИЕ ПРЕСЕТАМИ (package.json)
// ============================================================

const PACKAGE_PATH = path.join(projectRoot, 'package.json');

function readPackageJson(): any {
  try {
    const content = fs.readFileSync(PACKAGE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writePackageJson(data: any): void {
  fs.writeFileSync(PACKAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Получить текущий package.json
app.get('/api/package', (_req: Request, res: Response) => {
  const pkg = readPackageJson();
  if (!pkg) {
    res.status(404).json({ error: 'package.json not found' });
    return;
  }
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    scripts: pkg.scripts || {},
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    keywords: pkg.keywords || [],
    author: pkg.author,
    license: pkg.license,
  });
});

// Обновить скрипты
app.post('/api/package/scripts', (req: Request, res: Response) => {
  const pkg = readPackageJson();
  if (!pkg) {
    res.status(404).json({ error: 'package.json not found' });
    return;
  }

  pkg.scripts = { ...pkg.scripts, ...req.body };
  writePackageJson(pkg);

  res.json({
    success: true,
    message: 'Scripts updated',
    scripts: pkg.scripts,
  });
});

// Обновить зависимости
app.post('/api/package/dependencies', (req: Request, res: Response) => {
  const pkg = readPackageJson();
  if (!pkg) {
    res.status(404).json({ error: 'package.json not found' });
    return;
  }

  pkg.dependencies = { ...pkg.dependencies, ...req.body };
  writePackageJson(pkg);

  res.json({
    success: true,
    message: 'Dependencies updated',
    dependencies: pkg.dependencies,
  });
});

// Установить пакет
app.post('/api/package/install', async (req: Request, res: Response) => {
  const { packages, dev = false } = req.body;

  if (!packages || !Array.isArray(packages) || packages.length === 0) {
    res.status(400).json({ error: 'packages array required' });
    return;
  }

  try {
    const installCmd = `npm install ${packages.join(' ')} ${dev ? '--save-dev' : '--save'}`;
    const { stdout, stderr } = await execAsync(installCmd, {
      cwd: projectRoot,
    });

    const pkg = readPackageJson();

    res.json({
      success: true,
      message: `Installed: ${packages.join(', ')}`,
      output: stdout || stderr,
      package: pkg,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
    });
  }
});

// Удалить пакет
app.post('/api/package/uninstall', async (req: Request, res: Response) => {
  const { packages } = req.body;

  if (!packages || !Array.isArray(packages) || packages.length === 0) {
    res.status(400).json({ error: 'packages array required' });
    return;
  }

  try {
    const uninstallCmd = `npm uninstall ${packages.join(' ')}`;
    const { stdout, stderr } = await execAsync(uninstallCmd, {
      cwd: projectRoot,
    });

    const pkg = readPackageJson();

    res.json({
      success: true,
      message: `Uninstalled: ${packages.join(', ')}`,
      output: stdout || stderr,
      package: pkg,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
    });
  }
});

// Запустить скрипт
app.post('/api/package/run', async (req: Request, res: Response) => {
  const { script } = req.body;

  if (!script) {
    res.status(400).json({ error: 'script name required' });
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(`npm run ${script}`, {
      cwd: projectRoot,
    });

    res.json({
      success: true,
      message: `Executed: ${script}`,
      output: stdout || stderr,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
    });
  }
});

// ============================================================
// API ДЛЯ АНАЛИЗА
// ============================================================

import AstAnalyzerAPI from './core/AstAnalyzerAPI.js';

const api = AstAnalyzerAPI;
let isDataLoaded = false;

function loadData(): boolean {
  try {
    const possiblePaths = [
      path.join(projectRoot, 'index.json'),
      path.join(projectRoot, '..', 'index.json'),
      path.join(projectRoot, '..', '..', 'index.json'),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        api.load(data);
        isDataLoaded = true;
        console.log(`✅ Данные загружены из: ${filePath}`);
        return true;
      }
    }

    console.warn('⚠️ index.json не найден');
    return false;
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    return false;
  }
}

// Проверка состояния
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    loaded: isDataLoaded,
    version: api.getVersion(),
    timestamp: api.getTimestamp(),
    stats: api.isLoaded() ? api.getStats() : null,
  });
});

// Получить все функции
app.get('/api/functions', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const functions = api.getAllFunctions();
  res.json({
    total: functions.length,
    functions,
  });
});

// Получить функцию по ID
app.get('/api/functions/:id', (req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }

  const idParam: string | string[] | undefined = req.params.id;
  if (!idParam) {
    res.status(400).json({ error: 'Function ID is required' });
    return;
  }

  let id: string;
  if (Array.isArray(idParam)) {
    id = idParam[0] || '';
  } else {
    id = idParam;
  }

  if (!id) {
    res.status(400).json({ error: 'Function ID is required' });
    return;
  }

  const fn = api.getFunction(id);
  if (!fn) {
    res.status(404).json({ error: `Функция с ID "${id}" не найдена` });
    return;
  }
  res.json(fn);
});

// Поиск функций
app.get('/api/search/functions', (req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }
  const results = api.searchFunctions(query);
  const fuzzy = api.fuzzySearchFunctions(query);
  res.json({
    query,
    exactMatches: results,
    fuzzyMatches: fuzzy.slice(0, 10),
    total: results.length + fuzzy.length,
  });
});

// Поиск путей
app.get('/api/paths', (req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const from = req.query.from as string;
  const to = req.query.to as string;
  const maxDepthParam = req.query.maxDepth as string;
  const maxDepth = maxDepthParam ? parseInt(maxDepthParam, 10) : 20;

  if (!from || !to) {
    res.status(400).json({ error: 'Parameters "from" and "to" are required' });
    return;
  }

  const paths = api.findAllPaths(from, to, { maxDepth });
  const pathsWithNames = api.getPathsWithNames(from, to, { maxDepth });
  const stats = api.getPathStatistics(from, to, maxDepth);

  res.json({
    from,
    to,
    maxDepth,
    paths: pathsWithNames,
    stats,
    total: paths.length,
  });
});

// Проверка достижимости
app.get('/api/reachable', (req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const from = req.query.from as string;
  const to = req.query.to as string;
  const maxDepthParam = req.query.maxDepth as string;
  const maxDepth = maxDepthParam ? parseInt(maxDepthParam, 10) : 20;

  if (!from || !to) {
    res.status(400).json({ error: 'Parameters "from" and "to" are required' });
    return;
  }

  const reachable = api.isReachable(from, to, maxDepth);
  const shortestPath = reachable ? api.findShortestPath(from, to) : null;

  res.json({
    from,
    to,
    reachable,
    shortestPath,
    shortestPathNames: shortestPath
      ? shortestPath.map((id: string) => api.getFunction(id)?.name || id)
      : null,
    maxDepth,
  });
});

// Анализ зависимостей
app.get('/api/dependencies/:id', (req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }

  const idParam: string | string[] | undefined = req.params.id;
  if (!idParam) {
    res.status(400).json({ error: 'Function ID is required' });
    return;
  }

  let id: string;
  if (Array.isArray(idParam)) {
    id = idParam[0] || '';
  } else {
    id = idParam;
  }

  if (!id) {
    res.status(400).json({ error: 'Function ID is required' });
    return;
  }

  const depthParam: string | undefined = req.query.depth as string;
  const depth: number = depthParam ? parseInt(depthParam, 10) : 3;

  const fn = api.getFunction(id);
  if (!fn) {
    res.status(404).json({ error: `Функция с ID "${id}" не найдена` });
    return;
  }

  const calls = api.getCalls(id);
  const callers = api.getCallers(id);
  const reachable = api.getReachableFunctions(id, depth);
  const reaching = api.getReachingFunctions(id, depth);

  res.json({
    function: fn,
    calls,
    callers,
    reachable: reachable.map((fn: any) => fn.name),
    reaching: reaching.map((fn: any) => fn.name),
    stats: {
      totalCalls: calls.length,
      totalCallers: callers.length,
      reachableCount: reachable.length,
      reachingCount: reaching.length,
    },
  });
});

// Получить статистику
app.get('/api/stats', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const stats = api.getStats();
  const detailed = api.getDetailedStats();
  const deadCode = api.getDeadCode();
  const isolated = api.getIsolatedFunctions();
  const mostCalled = api.getMostCalled(10);
  const mostCalling = api.getMostCalling(10);

  res.json({
    summary: stats,
    detailed,
    deadCode,
    isolated,
    mostCalled,
    mostCalling,
  });
});

// Получить модули
app.get('/api/modules', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const modules = api.getAllModules();
  res.json({
    total: modules.length,
    modules,
  });
});

// Получить файлы
app.get('/api/files', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const files = api.getAllFiles();
  res.json({
    total: files.length,
    files,
  });
});

// Получить константы
app.get('/api/constants', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const constants = api.getAllConstants();
  res.json({
    total: constants.length,
    constants,
  });
});

// Внешние библиотеки
app.get('/api/libraries', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const libraries = api.getExternalLibraries();
  res.json({
    total: libraries.length,
    libraries,
  });
});

// Загрузить новый отчет
app.post('/api/load', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data) {
      res.status(400).json({ error: 'Data is required' });
      return;
    }
    api.reset();
    api.load(data);
    isDataLoaded = true;
    res.json({
      success: true,
      message: 'Данные успешно загружены',
      stats: api.getStats(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Получить все данные для экспорта
app.get('/api/export/all', (_req: Request, res: Response) => {
  if (!api.isLoaded()) {
    res.status(503).json({ error: 'Данные не загружены' });
    return;
  }
  const analytics = api.exportAnalytics();
  res.json(analytics);
});

// Сбросить API
app.post('/api/reset', (_req: Request, res: Response) => {
  api.reset();
  isDataLoaded = false;
  res.json({
    success: true,
    message: 'API сброшен',
  });
});

// Загружаем данные при старте
loadData();

// ============================================================
// SPA - отдаем index.html для всех остальных маршрутов
// ============================================================
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'index.html not found' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📁 Public directory: ${publicPath}`);
  console.log(`📊 Состояние: ${isDataLoaded ? 'Данные загружены' : 'Данные не загружены'}`);
  console.log(`\n📚 API endpoints:\n`);
  console.log(`  📦 Package Management:`);
  console.log(`  GET  /api/package              - Получить package.json`);
  console.log(`  POST /api/package/scripts      - Обновить скрипты`);
  console.log(`  POST /api/package/dependencies - Обновить зависимости`);
  console.log(`  POST /api/package/install      - Установить пакеты`);
  console.log(`  POST /api/package/uninstall    - Удалить пакеты`);
  console.log(`  POST /api/package/run          - Запустить скрипт`);
  console.log(`\n  🔍 Analysis API:`);
  console.log(`  GET  /api/status               - Статус сервера`);
  console.log(`  GET  /api/functions            - Все функции`);
  console.log(`  GET  /api/functions/:id        - Функция по ID`);
  console.log(`  GET  /api/search/functions?q=  - Поиск функций`);
  console.log(`  GET  /api/paths?from=&to=      - Поиск путей`);
  console.log(`  GET  /api/reachable?from=&to=  - Проверка достижимости`);
  console.log(`  GET  /api/dependencies/:id     - Анализ зависимостей`);
  console.log(`  GET  /api/stats                - Статистика`);
  console.log(`  GET  /api/modules              - Все модули`);
  console.log(`  GET  /api/files                - Все файлы`);
  console.log(`  GET  /api/constants            - Все константы`);
  console.log(`  GET  /api/libraries            - Внешние библиотеки`);
  console.log(`  POST /api/load                 - Загрузить данные`);
  console.log(`  GET  /api/export/all           - Экспорт всех данных`);
  console.log(`  POST /api/reset                - Сброс API`);
  console.log(`\n🌐 Откройте http://localhost:${PORT}\n`);
});
