// ============================================================
// server.mjs — 100% СИМВОЛЫ — базовая основа сервера
// Версия: 6.0.0 (РЕФАКТОРИНГ — ВЫНЕСЕНЫ РОУТЫ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Импорт логгера
import {
  getGlobalLogger,
  logInfo,
  logError,
  logSuccess,
  logDebug,
  logWarn,
  logSystem,
} from './src/logger.mjs';

// Импорт роутов
import { router } from './routes/index.mjs';

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы сервера
  VERSION: Symbol('server.version'),
  BUILD: Symbol('server.build'),
  NAME: Symbol('server.name'),
  PORT: Symbol('server.port'),
  HOST: Symbol('server.host'),
  START_TIME: Symbol('server.startTime'),

  // Состояние
  IS_RUNNING: Symbol('server.isRunning'),
  IS_INITIALIZED: Symbol('server.isInitialized'),
  IS_DESTROYED: Symbol('server.isDestroyed'),

  // Статистика
  REQUESTS: Symbol('server.requests'),
  ERRORS: Symbol('server.errors'),
  STATS: Symbol('server.stats'),

  // MIME типы
  MIME_TYPES: Symbol('server.mimeTypes'),

  // Методы
  INIT: Symbol('server.init'),
  DESTROY: Symbol('server.destroy'),
  HANDLE_REQUEST: Symbol('server.handleRequest'),
  HANDLE_OPTIONS: Symbol('server.handleOptions'),
  GET_STATIC_FILE: Symbol('server.getStaticFile'),
  GET_MIME_TYPE: Symbol('server.getMimeType'),
  UPDATE_STATS: Symbol('server.updateStats'),
  HEALTH_CHECK: Symbol('server.healthCheck'),
  EXPORT_SYMBOLS: Symbol('server.exportSymbols'),
  SERVE_INDEX: Symbol('server.serveIndex'),
  FIND_INDEX_FILE: Symbol('server.findIndexFile'),
};

// ============================================================
// 3. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('server.instance'),
  STATE: Symbol.for('server.state'),
  CONFIG: Symbol.for('server.config'),
  INIT: Symbol.for('server.init'),
  DESTROY: Symbol.for('server.destroy'),
  GET_STATE: Symbol.for('server.getState'),
  HEALTH_CHECK: Symbol.for('server.healthCheck'),
  GET_STATS: Symbol.for('server.getStats'),
  RESET_STATS: Symbol.for('server.resetStats'),
};

// ============================================================
// 4. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '6.0.0',
  build: '2026-07-29',
  name: 'Infoenergo Server',
  port: 5231,
  host: '0.0.0.0',
  maxBodySize: 10 * 1024 * 1024, // 10MB
  timeout: 30000, // 30 seconds
};

// ============================================================
// 5. MIME-ТИПЫ
// ============================================================

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
};

// ============================================================
// 6. ПОЛУЧЕНИЕ КОРНЕВОЙ ДИРЕКТОРИИ
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Корневые директории для поиска файлов
const ROOT_DIRS = [
  process.cwd(),
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'src', 'infoenergo-ui'),
  path.join(process.cwd(), 'src', 'infoenergo-ui', 'dist'),
  path.join(__dirname, 'src'),
  path.join(__dirname, 'src', 'infoenergo-ui'),
  path.join(__dirname, 'src', 'infoenergo-ui', 'dist'),
];

// ============================================================
// 7. ПОИСК INDEX.HTML
// ============================================================

const INDEX_PATHS = [
  '/src/infoenergo-ui.html',
  '/infoenergo-ui.html',
  '/src/index.html',
  '/index.html',
  '/src/app.mjs',
  '/app.mjs',
];

/**
 * Поиск index.html в корневых директориях
 */
function findIndexFile() {
  for (const indexPath of INDEX_PATHS) {
    const relativePath = indexPath.startsWith('/') ? indexPath.slice(1) : indexPath;
    for (const rootDir of ROOT_DIRS) {
      const fullPath = path.join(rootDir, relativePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          return fullPath;
        }
      }
    }
  }
  return null;
}

/**
 * Поиск любого файла
 */
function findFile(filePath) {
  const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  for (const rootDir of ROOT_DIRS) {
    const fullPath = path.join(rootDir, relativePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        return fullPath;
      }
    }
  }

  return null;
}

// ============================================================
// 8. ОСНОВНОЙ КЛАСС СЕРВЕРА
// ============================================================

class InfoenergoServer {
  constructor(config = {}) {
    const _private = new WeakMap();

    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.PORT]: config.port || CONFIG.port,
      [PRIVATE.HOST]: config.host || CONFIG.host,
      [PRIVATE.START_TIME]: null,

      [PRIVATE.IS_RUNNING]: false,
      [PRIVATE.IS_INITIALIZED]: false,
      [PRIVATE.IS_DESTROYED]: false,

      [PRIVATE.REQUESTS]: 0,
      [PRIVATE.ERRORS]: 0,
      [PRIVATE.STATS]: {
        totalRequests: 0,
        totalErrors: 0,
        byMethod: { GET: 0, POST: 0, OPTIONS: 0 },
        byPath: {},
        byStatus: {},
        startTime: null,
        lastRequest: null,
        averageResponseTime: 0,
      },

      [PRIVATE.MIME_TYPES]: { ...MIME_TYPES },
    };

    _private.set(this, privateData);
    this._private = _private;

    this[PRIVATE.INIT]();
  }

  // ============================================================
  // 9. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  _getPrivate(key) {
    return this._private.get(this)[key];
  }

  _setPrivate(key, value) {
    this._private.get(this)[key] = value;
    return value;
  }

  _getMimeTypes() {
    return this._getPrivate(PRIVATE.MIME_TYPES);
  }

  _getStats() {
    return this._getPrivate(PRIVATE.STATS);
  }

  _updateStats(method, path, status, duration) {
    const stats = this._getStats();
    stats.totalRequests++;
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    stats.byPath[path] = (stats.byPath[path] || 0) + 1;
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    stats.lastRequest = Date.now();

    const total = stats.totalRequests;
    const avg = stats.averageResponseTime || 0;
    stats.averageResponseTime = avg + (duration - avg) / total;

    this._setPrivate(PRIVATE.STATS, stats);
  }

  // ============================================================
  // 10. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT]() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.IS_INITIALIZED]) {
      logWarn('⚠️ Сервер уже инициализирован', null, 'system');
      return;
    }

    logSystem('ИНИЦИАЛИЗАЦИЯ СЕРВЕРА (100% СИМВОЛЫ)', null, 'system');
    logInfo(`📦 Версия: ${CONFIG.version}`, null, 'system');
    logInfo(`📅 Сборка: ${CONFIG.build}`, null, 'system');

    privateData[PRIVATE.START_TIME] = Date.now();
    privateData[PRIVATE.IS_INITIALIZED] = true;
    privateData[PRIVATE.STATS].startTime = Date.now();

    this[PRIVATE.EXPORT_SYMBOLS]();

    logSuccess('✅ Сервер инициализирован', null, 'system');
  }

  // ============================================================
  // 11. ЗАПУСК СЕРВЕРА
  // ============================================================

  start() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.IS_RUNNING]) {
      logWarn('⚠️ Сервер уже запущен', null, 'system');
      return;
    }

    if (privateData[PRIVATE.IS_DESTROYED]) {
      logError('❌ Сервер уничтожен, перезапуск невозможен', null, 'system');
      return;
    }

    const port = privateData[PRIVATE.PORT];
    const host = privateData[PRIVATE.HOST];

    const server = http.createServer((req, res) => {
      this[PRIVATE.HANDLE_REQUEST](req, res);
    });

    this._server = server;

    server.listen(port, host, () => {
      privateData[PRIVATE.IS_RUNNING] = true;

      logSuccess(`✅ Сервер запущен на http://${host}:${port}`, null, 'system');
      logInfo(`📁 Корневая директория: ${path.resolve('.')}`, null, 'system');

      // Проверяем наличие index.html
      const indexFile = findIndexFile();
      if (indexFile) {
        logInfo(`📄 Index файл: ${indexFile}`, null, 'system');
      } else {
        logWarn('⚠️ Index файл не найден', null, 'system');
      }

      logSystem(
        '📋 ГРУППЫ ЛОГОВ:',
        {
          system: 'Системные события',
          api: 'API-запросы',
          settings: 'Настройки пользователей',
          static: 'Статические файлы',
          performance: 'Производительность',
          security: 'Безопасность',
        },
        'system'
      );
    });

    server.on('error', (error) => {
      logError(`❌ Ошибка сервера: ${error.message}`, error, 'system');
      privateData[PRIVATE.ERRORS]++;
    });

    server.on('close', () => {
      logSystem('🛑 Сервер остановлен', null, 'system');
      privateData[PRIVATE.IS_RUNNING] = false;
    });

    process.on('SIGINT', () => {
      logSystem('🛑 Получен сигнал SIGINT', null, 'system');
      this.stop();
    });

    process.on('SIGTERM', () => {
      logSystem('🛑 Получен сигнал SIGTERM', null, 'system');
      this.stop();
    });

    return this;
  }

  // ============================================================
  // 12. ОСТАНОВКА СЕРВЕРА
  // ============================================================

  stop() {
    const privateData = this._private.get(this);

    if (!privateData[PRIVATE.IS_RUNNING]) {
      logWarn('⚠️ Сервер уже остановлен', null, 'system');
      return;
    }

    logSystem('🛑 Остановка сервера...', null, 'system');

    if (this._server) {
      this._server.close(() => {
        logSuccess('✅ Сервер остановлен', null, 'system');
        privateData[PRIVATE.IS_RUNNING] = false;
      });
    }
  }

  // ============================================================
  // 13. ОБРАБОТКА ЗАПРОСОВ
  // ============================================================

  [PRIVATE.HANDLE_REQUEST](req, res) {
    const startTime = Date.now();
    const privateData = this._private.get(this);

    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';

    logDebug(
      `📨 ${method} ${pathname}`,
      {
        method,
        path: pathname,
        query: Object.fromEntries(url.searchParams),
      },
      'api'
    );

    privateData[PRIVATE.REQUESTS]++;

    try {
      // OPTIONS
      if (method === 'OPTIONS') {
        this[PRIVATE.HANDLE_OPTIONS](res);
        this._updateStats('OPTIONS', pathname, 204, Date.now() - startTime);
        return;
      }

      // ★★★ СТАТИЧЕСКИЕ ФАЙЛЫ (включая index.html) ★★★
      if (method === 'GET') {
        // Если путь '/' — отдаем index.html
        if (pathname === '/' || pathname === '') {
          this[PRIVATE.SERVE_INDEX](res);
          this._updateStats('GET', pathname, res.statusCode || 200, Date.now() - startTime);
          return;
        }

        // Пробуем найти файл
        const foundPath = findFile(pathname);
        if (foundPath) {
          this[PRIVATE.GET_STATIC_FILE](foundPath, res);
          this._updateStats('GET', pathname, res.statusCode || 200, Date.now() - startTime);
          return;
        }
      }

      // ★★★ API РОУТЫ (вынесены в отдельный модуль) ★★★
      const routeResult = router.handle(req, res, pathname, method);
      if (routeResult) {
        this._updateStats(method, pathname, res.statusCode || 200, Date.now() - startTime);
        return;
      }

      // 404 Not Found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      this._updateStats(method, pathname, 404, Date.now() - startTime);
    } catch (error) {
      logError(`❌ Ошибка обработки запроса ${method} ${pathname}: ${error.message}`, error, 'api');
      privateData[PRIVATE.ERRORS]++;

      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: error.message || 'Internal Server Error',
          })
        );
      }
      this._updateStats(method, pathname, 500, Date.now() - startTime);
    }
  }

  // ============================================================
  // 14. ОБРАБОТКА OPTIONS
  // ============================================================

  [PRIVATE.HANDLE_OPTIONS](res) {
    res.writeHead(204);
    res.end();
  }

  // ============================================================
  // 15. ОТДАЧА INDEX.HTML ★★★ ОСНОВНАЯ ФУНКЦИЯ ★★★
  // ============================================================

  [PRIVATE.SERVE_INDEX](res) {
    const indexFile = findIndexFile();

    if (indexFile) {
      this[PRIVATE.GET_STATIC_FILE](indexFile, res);
    } else {
      logError('❌ Index файл не найден', null, 'static');
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Infoenergo Server</title>
        <style>
          body { font-family: system-ui; background: #0b0e14; color: #c8d0e0; padding: 40px; text-align: center; }
          h1 { color: #e0e4ee; }
          .error { color: #ef4444; }
          .info { color: #4a5a7a; }
        </style>
        </head>
        <body>
          <h1>🚀 Infoenergo Server v${CONFIG.version}</h1>
          <p class="error">❌ Index файл не найден</p>
          <p class="info">Проверьте наличие index.html в src/</p>
          <p class="info">📁 Корневые директории: ${ROOT_DIRS.join(', ')}</p>
        </body>
        </html>
      `);
    }
  }

  // ============================================================
  // 16. СТАТИЧЕСКИЕ ФАЙЛЫ
  // ============================================================

  [PRIVATE.GET_STATIC_FILE](fullPath, res) {
    try {
      const content = fs.readFileSync(fullPath);
      const mimeType = this[PRIVATE.GET_MIME_TYPE](fullPath);

      logDebug(
        `📁 Статический файл: ${path.basename(fullPath)}`,
        {
          size: content.length,
          mimeType,
          path: fullPath,
        },
        'static'
      );

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch (error) {
      logError(`❌ Ошибка чтения файла ${fullPath}: ${error.message}`, { error }, 'static');
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }

  // ============================================================
  // 17. MIME-ТИПЫ
  // ============================================================

  [PRIVATE.GET_MIME_TYPE](filePath) {
    const mimeTypes = this._getMimeTypes();
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // ============================================================
  // 18. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PRIVATE.HEALTH_CHECK]() {
    const privateData = this._private.get(this);

    const issues = [];
    let healthy = true;

    if (privateData[PRIVATE.IS_DESTROYED]) {
      healthy = false;
      issues.push('Сервер уничтожен');
    }

    if (!privateData[PRIVATE.IS_INITIALIZED]) {
      healthy = false;
      issues.push('Сервер не инициализирован');
    }

    return {
      healthy,
      issues,
      initialized: privateData[PRIVATE.IS_INITIALIZED],
      running: privateData[PRIVATE.IS_RUNNING],
      destroyed: privateData[PRIVATE.IS_DESTROYED],
      uptime: privateData[PRIVATE.START_TIME ? Date.now() - privateData[PRIVATE.START_TIME] : 0],
      requests: privateData[PRIVATE.REQUESTS],
      errors: privateData[PRIVATE.ERRORS],
      stats: { ...privateData[PRIVATE.STATS] },
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // 19. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    const privateCount = Object.keys(PRIVATE).length;
    const publicCount = Object.keys(PUBLIC).length;

    console.log(
      '╔═══════════════════════════════════════════════════════════════════════════════╗'
    );
    console.log('║              🚀 INFOENERGO SERVER (100% СИМВОЛЫ) v6.0.0                     ║');
    console.log(
      '╠═══════════════════════════════════════════════════════════════════════════════╣'
    );
    console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
    console.log(
      `║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`
    );
    console.log(
      `║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`
    );
    console.log(
      `║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`
    );
    console.log(
      '╠═══════════════════════════════════════════════════════════════════════════════╣'
    );
    console.log('║  📋 ЭНДПОИНТЫ (вынесены в routes/):                                        ║');
    console.log('║    POST /projects — CRUD проектов                                          ║');
    console.log('║    POST /tasks — CRUD задач                                                ║');
    console.log('║    POST /users — CRUD пользователей                                        ║');
    console.log('║    POST /api/table/virtual/data/get — виртуальный скролл                   ║');
    console.log('║    POST /user-settings/get — получение настроек                            ║');
    console.log('║    POST /user-settings/set — сохранение настроек                           ║');
    console.log('║    GET /* — статические файлы (включая index.html)                         ║');
    console.log(
      '╠═══════════════════════════════════════════════════════════════════════════════╣'
    );
    console.log('║  📋 КОМАНДЫ:                                                               ║');
    console.log('║    server.start() — запустить сервер                                       ║');
    console.log('║    server.stop() — остановить сервер                                       ║');
    console.log('║    server.healthCheck() — проверка целостности                             ║');
    console.log('║    server.getState() — состояние сервера                                   ║');
    console.log('║    server.getStats() — статистика сервера                                  ║');
    console.log('║    server.resetStats() — сброс статистики                                  ║');
    console.log(
      '╚═══════════════════════════════════════════════════════════════════════════════╝'
    );
  }

  // ============================================================
  // 20. ПУБЛИЧНЫЙ API
  // ============================================================

  [PUBLIC.INIT]() {
    return this[PRIVATE.INIT]();
  }

  [PUBLIC.DESTROY]() {
    return this.stop();
  }

  [PUBLIC.GET_STATE]() {
    const privateData = this._private.get(this);
    return {
      initialized: privateData[PRIVATE.IS_INITIALIZED],
      running: privateData[PRIVATE.IS_RUNNING],
      destroyed: privateData[PRIVATE.IS_DESTROYED],
      port: privateData[PRIVATE.PORT],
      host: privateData[PRIVATE.HOST],
      startTime: privateData[PRIVATE.START_TIME],
      requests: privateData[PRIVATE.REQUESTS],
      errors: privateData[PRIVATE.ERRORS],
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  [PUBLIC.HEALTH_CHECK]() {
    return this[PRIVATE.HEALTH_CHECK]();
  }

  [PUBLIC.GET_STATS]() {
    const privateData = this._private.get(this);
    return { ...privateData[PRIVATE.STATS] };
  }

  [PUBLIC.RESET_STATS]() {
    const privateData = this._private.get(this);
    privateData[PRIVATE.STATS] = {
      totalRequests: 0,
      totalErrors: 0,
      byMethod: { GET: 0, POST: 0, OPTIONS: 0 },
      byPath: {},
      byStatus: {},
      startTime: Date.now(),
      lastRequest: null,
      averageResponseTime: 0,
    };
    return true;
  }

  // ============================================================
  // 21. СТАТИСТИКА СИМВОЛОВ
  // ============================================================

  static getSymbolStats() {
    const privateCount = Object.keys(PRIVATE).length;
    const publicCount = Object.keys(PUBLIC).length;

    return {
      private: privateCount,
      public: publicCount,
      total: privateCount + publicCount,
    };
  }
}

// ============================================================
// 22. СОЗДАНИЕ ЭКЗЕМПЛЯРА (SINGLETON)
// ============================================================

let serverInstance = null;

export function getServer() {
  if (!serverInstance) {
    serverInstance = new InfoenergoServer();
  }
  return serverInstance;
}

export const server = getServer();

// ============================================================
// 23. ЗАПУСК (если файл запущен напрямую)
// ============================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = getServer();
  server.start();
}

// ============================================================
// 24. ЭКСПОРТЫ
// ============================================================

export {
  InfoenergoServer,
  server as default,
  PRIVATE,
  PUBLIC,
  CONFIG,
  findFile,
  findIndexFile,
  ROOT_DIRS,
};

// ============================================================
// 25. КОНЕЦ ФАЙЛА
// ============================================================
