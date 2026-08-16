// ============================================================
// routes/index.mjs — 100% СИМВОЛЫ — маршруты API
// Версия: 1.0.1 (ИСПРАВЛЕН СИНТАКСИС)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { logInfo, logError, logSuccess, logDebug } from '../src/logger.mjs';

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Данные
  TABLES: Symbol('router.tables'),
  USER_SETTINGS: Symbol('router.userSettings'),

  // Методы
  HANDLE_DATA: Symbol('router.handleData'),
  GET_TABLE_DATA: Symbol('router.getTableData'),
  SET_TABLE_DATA: Symbol('router.setTableData'),
  HANDLE_VIRTUAL_SCROLL: Symbol('router.handleVirtualScroll'),
  HANDLE_USER_SETTINGS_GET: Symbol('router.handleUserSettingsGet'),
  HANDLE_USER_SETTINGS_SET: Symbol('router.handleUserSettingsSet'),
  PARSE_BODY: Symbol('router.parseBody'),
};

// ============================================================
// 3. ДАННЫЕ (моки из mockData.js)
// ============================================================

import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from '../mockData.js';

// ============================================================
// 4. СОСТОЯНИЕ РОУТЕРА
// ============================================================

const ROUTER_STATE = {
  [PRIVATE.TABLES]: {
    projects: { data: [...MOCK_PROJECTS] },
    tasks: { data: [...MOCK_TASKS] },
    users: { data: [...MOCK_USERS] },
  },
  [PRIVATE.USER_SETTINGS]: new Map(),
};

// ============================================================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function getTables() {
  return ROUTER_STATE[PRIVATE.TABLES];
}

function getUserSettings() {
  return ROUTER_STATE[PRIVATE.USER_SETTINGS];
}

// ============================================================
// 6. ПАРСИНГ ТЕЛА ЗАПРОСА
// ============================================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// ============================================================
// 7. ОБРАБОТЧИКИ РОУТОВ
// ============================================================

function getTableData(tableName, payload, res) {
  const tables = getTables();
  const table = tables[tableName];

  if (!table) {
    logError(`❌ Таблица не найдена: ${tableName}`, null, 'api');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Table not found' }));
    return;
  }

  const { filter = {}, skip = 0, take = null } = payload;
  let data = [...table.data];

  for (const [key, value] of Object.entries(filter)) {
    data = data.filter((item) => item[key] === value);
  }

  const totalCount = data.length;

  if (take !== null && take !== undefined) {
    data = data.slice(skip, skip + take);
  } else if (skip > 0) {
    data = data.slice(skip);
  }

  logDebug(
    `📊 Данные ${tableName}: ${data.length}/${totalCount} записей`,
    {
      filter,
      skip,
      take,
    },
    'api'
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data, totalCount }));
}

function setTableData(tableName, payload, res) {
  const tables = getTables();
  const table = tables[tableName];

  if (!table) {
    logError(`❌ Таблица не найдена: ${tableName}`, null, 'api');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Table not found' }));
    return;
  }

  const changes = { inserted: 0, updated: 0, deleted: 0 };

  if (payload.insertDataArgs && Array.isArray(payload.insertDataArgs)) {
    for (const row of payload.insertDataArgs) {
      if (!row.id) {
        row.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }
      const exists = table.data.some((item) => item.id === row.id);
      if (!exists) {
        table.data.push({ ...row });
        changes.inserted++;
      }
    }
  }

  if (payload.updateDataArgs && Array.isArray(payload.updateDataArgs)) {
    for (const row of payload.updateDataArgs) {
      const index = table.data.findIndex((item) => item.id === row.id);
      if (index !== -1) {
        table.data[index] = { ...table.data[index], ...row };
        changes.updated++;
      }
    }
  }

  if (payload.deleteDataArgs && Array.isArray(payload.deleteDataArgs)) {
    for (const row of payload.deleteDataArgs) {
      const index = table.data.findIndex((item) => item.id === row.id);
      if (index !== -1) {
        table.data.splice(index, 1);
        changes.deleted++;
      }
    }
  }

  logSuccess(`✅ Изменения в ${tableName}`, changes, 'api');

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, changes }));
}

function handleVirtualScroll(payload, res) {
  const tables = getTables();
  const table = tables.tasks;

  const { skip = 0, take = 20 } = payload;
  let data = [...table.data];
  const totalCount = data.length;
  data = data.slice(skip, skip + take);

  logDebug(
    `📊 Виртуальный скролл: ${data.length}/${totalCount} записей`,
    {
      skip,
      take,
    },
    'api'
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data, totalCount }));
}

function handleUserSettingsGet(payload, res) {
  const settings = getUserSettings();

  const { viewId } = payload;
  if (!viewId) {
    logError('❌ viewId обязателен', null, 'settings');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'viewId required' }));
    return;
  }

  const userSettings = settings.get(viewId) || null;

  logDebug(
    `📂 Настройки для ${viewId}: ${userSettings ? 'найдены' : 'не найдены'}`,
    {
      viewId,
      hasSettings: !!userSettings,
    },
    'settings'
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, result: true, settings: userSettings }));
}

function handleUserSettingsSet(payload, res) {
  const settings = getUserSettings();

  const { viewId, settings: userSettings } = payload;
  if (!viewId) {
    logError('❌ viewId обязателен', null, 'settings');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'viewId required' }));
    return;
  }

  settings.set(viewId, userSettings || {});

  logSuccess(
    `✅ Настройки сохранены для ${viewId}`,
    {
      viewId,
      settingsKeys: Object.keys(userSettings || {}),
    },
    'settings'
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, result: true }));
}

function handleData(tableName, payload, res) {
  const tables = getTables();

  logDebug(
    `📊 Обработка данных ${tableName}`,
    {
      hasInsert: !!payload.insertDataArgs,
      hasUpdate: !!payload.updateDataArgs,
      hasDelete: !!payload.deleteDataArgs,
      hasFilter: !!payload.filter,
    },
    'api'
  );

  if (payload.insertDataArgs || payload.updateDataArgs || payload.deleteDataArgs) {
    setTableData(tableName, payload, res);
    return;
  }

  getTableData(tableName, payload, res);
}

// ============================================================
// 8. РОУТЕР (ПУБЛИЧНЫЙ API)
// ============================================================

export const router = {
  /**
   * Обработка запроса
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {string} pathname
   * @param {string} method
   * @returns {boolean} — true если роут обработан
   */
  async handle(req, res, pathname, method) {
    // Только POST запросы для API
    if (method !== 'POST') {
      return false;
    }

    // Парсим тело
    let payload = {};
    try {
      payload = await parseBody(req);
    } catch (error) {
      logError(`❌ Ошибка парсинга тела: ${error.message}`, error, 'api');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      return true;
    }

    // Обработка эндпоинтов
    switch (pathname) {
      case '/projects':
      case '/tasks':
      case '/users': {
        const tableName = pathname.slice(1);
        handleData(tableName, payload, res);
        return true;
      }

      case '/api/table/virtual/data/get': {
        handleVirtualScroll(payload, res);
        return true;
      }

      case '/user-settings/get': {
        handleUserSettingsGet(payload, res);
        return true;
      }

      case '/user-settings/set': {
        handleUserSettingsSet(payload, res);
        return true;
      }

      default:
        return false;
    }
  },

  /**
   * Получить состояние роутера (для отладки)
   */
  getState() {
    const tables = getTables();
    const settings = getUserSettings();

    return {
      tables: {
        projects: tables.projects.data.length,
        tasks: tables.tasks.data.length,
        users: tables.users.data.length,
      },
      settings: settings.size,
      timestamp: Date.now(),
    };
  },

  /**
   * Сбросить данные к мокам
   */
  resetData() {
    const tables = getTables();
    tables.projects.data = [...MOCK_PROJECTS];
    tables.tasks.data = [...MOCK_TASKS];
    tables.users.data = [...MOCK_USERS];
    return true;
  },

  /**
   * Очистить настройки пользователей
   */
  clearSettings() {
    const settings = getUserSettings();
    settings.clear();
    return true;
  },
};

// ============================================================
// 9. ЭКСПОРТЫ
// ============================================================

export { PRIVATE as ROUTER_PRIVATE };
export default router;

// ============================================================
// 10. КОНЕЦ ФАЙЛА
// ============================================================
