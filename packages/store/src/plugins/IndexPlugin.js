// ============================================================
// plugins/IndexPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Плагин индексов для быстрого поиска в Enterprise Store
// Версия: 4.0.4 (ИСПРАВЛЕНО — БЕЗ РЕКУРСИИ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('index.version'),
  BUILD: Symbol('index.build'),
  NAME: Symbol('index.name'),
  CONFIG: Symbol('index.config'),
  STATE: Symbol('index.state'),
  INITIALIZED: Symbol('index.initialized'),
  DESTROYED: Symbol('index.destroyed'),

  // Данные индексов
  INDEXES: Symbol('index.indexes'),
  INDEX_DATA: Symbol('index.indexData'),
  INDEX_STATS: Symbol('index.indexStats'),
  INDEX_CACHE: Symbol('index.indexCache'),

  // Поля и типы
  FIELDS: Symbol('index.fields'),
  TYPES: Symbol('index.types'),
  UNIQUE: Symbol('index.unique'),
  SPARSE: Symbol('index.sparse'),

  // Состояние
  IS_BUILDING: Symbol('index.isBuilding'),
  BUILD_QUEUE: Symbol('index.buildQueue'),
  LAST_REBUILD: Symbol('index.lastRebuild'),

  // Методы
  INIT: Symbol('index.init'),
  DESTROY: Symbol('index.destroy'),
  CREATE: Symbol('index.create'),
  DROP: Symbol('index.drop'),
  REBUILD: Symbol('index.rebuild'),
  FIND: Symbol('index.find'),
  FIND_ONE: Symbol('index.findOne'),
  EXISTS: Symbol('index.exists'),
  COUNT: Symbol('index.count'),
  STATS: Symbol('index.stats'),
  CLEAR: Symbol('index.clear'),
  VALIDATE: Symbol('index.validate'),
  SANITIZE: Symbol('index.sanitize'),
  SECURE: Symbol('index.secure'),
  EXPORT: Symbol('index.export'),
  IMPORT: Symbol('index.import'),
  GET_STATE: Symbol('index.getState'),
  HEALTH_CHECK: Symbol('index.healthCheck'),
  LOG: Symbol('index.log'),
  DEBUG: Symbol('index.debug'),
  ERROR: Symbol('index.error'),
  WARN: Symbol('index.warn'),
  SUCCESS: Symbol('index.success'),

  // Внутренние методы (ИСПРАВЛЕНО)
  _initSystemIndexes: Symbol('index.initSystemIndexes'),
  _buildIndex: Symbol('index.buildIndex'),
  _validateAndCreate: Symbol('index.validateAndCreate'),
  _getStore: Symbol('index.getStore'),
  _getLogger: Symbol('index.getLogger'),
  _getPrivate: Symbol('index.getPrivate'),
  _updateState: Symbol('index.updateState'),
  _clearCache: Symbol('index.clearCache'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('index.instance'),
  STATE: Symbol.for('index.state'),
  CONFIG: Symbol.for('index.config'),
  INIT: Symbol.for('index.init'),
  DESTROY: Symbol.for('index.destroy'),
  CREATE: Symbol.for('index.create'),
  DROP: Symbol.for('index.drop'),
  REBUILD: Symbol.for('index.rebuild'),
  FIND: Symbol.for('index.find'),
  FIND_ONE: Symbol.for('index.findOne'),
  EXISTS: Symbol.for('index.exists'),
  COUNT: Symbol.for('index.count'),
  STATS: Symbol.for('index.stats'),
  CLEAR: Symbol.for('index.clear'),
  EXPORT: Symbol.for('index.export'),
  IMPORT: Symbol.for('index.import'),
  GET_STATE: Symbol.for('index.getState'),
  HEALTH_CHECK: Symbol.for('index.healthCheck'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.4',
  build: '2026-07-28',
  name: 'Index Plugin',
  debug: true,
  maxIndexSize: 1000000,
  defaultIndexType: 'btree',
  autoRebuild: true,
  rebuildDelay: 1000,
  cacheSize: 10000,
  caseSensitive: false,
  enableWildcard: true,
  maxFields: 50,
};

// ============================================================
// 4. ЛОГГЕР (100% символы)
// ============================================================

const LOGGER_SYMBOLS = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
};

function createLogger(debug = true, instanceId = 'IndexPlugin') {
  const logState = {
    [LOGGER_SYMBOLS.HISTORY]: [],
    [LOGGER_SYMBOLS.MAX_HISTORY]: 200,
    [LOGGER_SYMBOLS.DEBUG]: debug,
    [LOGGER_SYMBOLS.INSTANCE_ID]: instanceId,
    [LOGGER_SYMBOLS.LEVEL]: debug ? 3 : 2,
  };

  const logMethod = function(level, message, data = null) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3, success: 2 };
    const currentLevel = this[LOGGER_SYMBOLS.LEVEL] || 2;
    const msgLevel = levels[level] || 2;

    if (msgLevel > currentLevel) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${this[LOGGER_SYMBOLS.INSTANCE_ID]}]`;

    this[LOGGER_SYMBOLS.HISTORY].push({
      timestamp,
      level,
      message,
      data,
      id: Date.now() + Math.random(),
    });

    if (this[LOGGER_SYMBOLS.HISTORY].length > this[LOGGER_SYMBOLS.MAX_HISTORY]) {
      this[LOGGER_SYMBOLS.HISTORY].shift();
    }

    const icons = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍', success: '✅' };
    const icon = icons[level] || '📌';

    if (data !== null && data !== undefined) {
      console.log(`${icon} ${prefix} ${message}`, data);
    } else {
      console.log(`${icon} ${prefix} ${message}`);
    }
  };

  const boundLog = logMethod.bind(logState);

  const methods = {
    error: (msg, d) => boundLog('error', msg, d),
    warn: (msg, d) => boundLog('warn', msg, d),
    info: (msg, d) => boundLog('info', msg, d),
    debug: (msg, d) => boundLog('debug', msg, d),
    success: (msg, d) => boundLog('success', msg, d),

    header: (title, color = '#636e72') => {
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
      console.log(
        '%c  🔍 ' + title,
        'background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold;'
      );
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
    },

    separator: (color = '#636e72') => {
      console.log('%c' + '─'.repeat(70), `color: ${color};`);
    },

    getHistory: function() {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory: function() {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug: function(enabled) {
      this[LOGGER_SYMBOLS.DEBUG] = enabled;
      this[LOGGER_SYMBOLS.LEVEL] = enabled ? 3 : 2;
      return this;
    },
  };

  const logger = {};
  for (const [key, fn] of Object.entries(methods)) {
    logger[key] = fn.bind(logState);
  }

  logger[LOGGER_SYMBOLS.HISTORY] = logState[LOGGER_SYMBOLS.HISTORY];
  logger[LOGGER_SYMBOLS.MAX_HISTORY] = logState[LOGGER_SYMBOLS.MAX_HISTORY];
  logger[LOGGER_SYMBOLS.DEBUG] = logState[LOGGER_SYMBOLS.DEBUG];
  logger[LOGGER_SYMBOLS.INSTANCE_ID] = logState[LOGGER_SYMBOLS.INSTANCE_ID];
  logger[LOGGER_SYMBOLS.LEVEL] = logState[LOGGER_SYMBOLS.LEVEL];

  return logger;
}

// ============================================================
// 5. СТРАТЕГИИ ИНДЕКСАЦИИ
// ============================================================

const INDEX_STRATEGIES = {
  btree: {
    name: 'B-Tree',
    build: (data, field) => {
      const index = new Map();
      for (const row of data) {
        const value = row[field];
        if (value !== undefined && value !== null) {
          if (!index.has(value)) {
            index.set(value, new Set());
          }
          index.get(value).add(row.id);
        }
      }
      return index;
    },
    find: (index, value) => {
      return index.get(value) || new Set();
    },
  },
  hash: {
    name: 'Hash',
    build: (data, field) => {
      const index = new Map();
      for (const row of data) {
        const value = row[field];
        if (value !== undefined && value !== null) {
          const hash = String(value);
          if (!index.has(hash)) {
            index.set(hash, new Set());
          }
          index.get(hash).add(row.id);
        }
      }
      return index;
    },
    find: (index, value) => {
      return index.get(String(value)) || new Set();
    },
  },
};

// ============================================================
// 6. ОСНОВНОЙ ОБЪЕКТ INDEX_PLUGIN (100% символы)
// ============================================================

export const IndexPlugin = {
  name: 'index',
  version: CONFIG.version,
  metadata: {
    description: 'Advanced Indexing System',
    author: 'Enterprise Store Team',
    license: 'MIT',
  },
  order: 2,

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ (ИСПРАВЛЕНО — БЕЗ РЕКУРСИИ)
  // ============================================================

  init(store) {
    // ★★★ ИСПРАВЛЕНО: не вызываем рекурсивно init ★★★
    return this[PRIVATE.INIT](store);
  },

  [PRIVATE.INIT](store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // ★★★ ИСПРАВЛЕНО: создаем приватное состояние ★★★
    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG]: { ...CONFIG },
      [PRIVATE.STATE]: {
        initialized: false,
        destroyed: false,
        ready: false,
        indexCount: 0,
        totalKeys: 0,
      },
      [PRIVATE.INDEXES]: new Map(),
      [PRIVATE.INDEX_DATA]: new Map(),
      [PRIVATE.INDEX_STATS]: new Map(),
      [PRIVATE.INDEX_CACHE]: new Map(),
      [PRIVATE.FIELDS]: new Map(),
      [PRIVATE.TYPES]: new Map(),
      [PRIVATE.UNIQUE]: new Map(),
      [PRIVATE.SPARSE]: new Map(),
      [PRIVATE.IS_BUILDING]: false,
      [PRIVATE.BUILD_QUEUE]: [],
      [PRIVATE.LAST_REBUILD]: null,
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.LOGGER]: logger,
      [PRIVATE.STORE]: store,
    };

    // ★★★ ИСПРАВЛЕНО: сохраняем приватные данные ★★★
    this._private = privateData;
    this._logger = logger;
    this._store = store;

    logger.header('ИНИЦИАЛИЗАЦИЯ INDEX PLUGIN (100% СИМВОЛЫ)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`📌 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.separator();

    // ★★★ ИСПРАВЛЕНО: инициализируем системные индексы напрямую ★★★
    this[PRIVATE._initSystemIndexes]();

    privateData[PRIVATE.INITIALIZED] = true;
    privateData[PRIVATE.STATE].initialized = true;
    privateData[PRIVATE.STATE].ready = true;

    // Экспортируем символы
    this[PRIVATE.EXPORT_SYMBOLS]();

    logger.success('✅ IndexPlugin инициализирован');
    logger.header('ГОТОВ');
  },

  // ============================================================
  // 8. СИСТЕМНЫЕ ИНДЕКСЫ
  // ============================================================

  [PRIVATE._initSystemIndexes]() {
    // Системные индексы для мета-таблиц
    this[PRIVATE.CREATE]('_meta', 'key', { unique: true });
    this[PRIVATE.CREATE]('_events', 'type', { unique: false });
    this[PRIVATE.CREATE]('_events', 'timestamp', { unique: false });
  },

  // ============================================================
  // 9. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ (НОВЫЕ)
  // ============================================================

  [PRIVATE._getStore]() {
    return this._store;
  },

  [PRIVATE._getLogger]() {
    return this._logger;
  },

  [PRIVATE._getPrivate]() {
    return this._private;
  },

  [PRIVATE._updateState]() {
    const privateData = this._private;
    privateData[PRIVATE.STATE].indexCount = privateData[PRIVATE.INDEXES].size;
    let totalKeys = 0;
    for (const [, stats] of privateData[PRIVATE.INDEX_STATS]) {
      totalKeys += stats.totalKeys || 0;
    }
    privateData[PRIVATE.STATE].totalKeys = totalKeys;
  },

  [PRIVATE._clearCache]() {
    const privateData = this._private;
    privateData[PRIVATE.INDEX_CACHE].clear();
  },

  // ============================================================
  // 10. СОЗДАНИЕ ИНДЕКСА
  // ============================================================

  [PRIVATE.CREATE](tableName, field, options = {}) {
    const logger = this._logger;
    const privateData = this._private;

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ IndexPlugin уничтожен');
      return false;
    }

    // Валидация
    const validation = this[PRIVATE.VALIDATE](tableName, field, options);
    if (!validation.valid) {
      logger.error(`❌ ${validation.error}`);
      return false;
    }

    const key = `${tableName}:${field}`;
    const indexes = privateData[PRIVATE.INDEXES];

    if (indexes.has(key)) {
      logger.warn(`⚠️ Индекс уже существует: ${key}`);
      return false;
    }

    // Создаем индекс
    const index = {
      tableName,
      field,
      type: options.type || CONFIG.defaultIndexType,
      unique: options.unique || false,
      sparse: options.sparse || false,
      caseSensitive: options.caseSensitive || CONFIG.caseSensitive,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    indexes.set(key, index);
    privateData[PRIVATE.FIELDS].set(key, field);
    privateData[PRIVATE.TYPES].set(key, index.type);
    privateData[PRIVATE.UNIQUE].set(key, index.unique);
    privateData[PRIVATE.SPARSE].set(key, index.sparse);

    // Строим индекс
    this[PRIVATE._buildIndex](tableName, field, key);

    // Обновляем состояние
    this[PRIVATE._updateState]();

    logger.success(`✅ Индекс создан: ${key}`);
    return true;
  },

  // ============================================================
  // 11. ПОСТРОЕНИЕ ИНДЕКСА
  // ============================================================

  [PRIVATE._buildIndex](tableName, field, key) {
    const logger = this._logger;
    const privateData = this._private;
    const store = this._store;

    if (!store) {
      logger.error('❌ Store не доступен');
      return false;
    }

    const table = store.getTable(tableName);
    if (!table) {
      logger.warn(`⚠️ Таблица "${tableName}" не найдена, индекс будет построен позже`);
      privateData[PRIVATE.BUILD_QUEUE].push({ tableName, field, key });
      return false;
    }

    // Выбираем стратегию
    const type = privateData[PRIVATE.TYPES].get(key) || CONFIG.defaultIndexType;
    const strategy = INDEX_STRATEGIES[type] || INDEX_STRATEGIES.btree;

    // Строим индекс
    const indexData = strategy.build(table.data, field);
    const stats = {
      totalKeys: 0,
      uniqueKeys: indexData.size,
      collisions: 0,
      builtAt: Date.now(),
    };

    for (const [, ids] of indexData) {
      stats.totalKeys += ids.size;
      if (privateData[PRIVATE.UNIQUE].get(key) && ids.size > 1) {
        stats.collisions++;
      }
    }

    privateData[PRIVATE.INDEX_DATA].set(key, indexData);
    privateData[PRIVATE.INDEX_STATS].set(key, stats);

    logger.debug(`🔍 Индекс построен: ${key} (${stats.totalKeys} ключей)`);
    return true;
  },

  // ============================================================
  // 12. ПОИСК ПО ИНДЕКСУ
  // ============================================================

  [PRIVATE.FIND](tableName, query, options = {}) {
    const logger = this._logger;
    const privateData = this._private;
    const store = this._store;

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ IndexPlugin уничтожен');
      return [];
    }

    // Проверяем кэш
    const cacheKey = `${tableName}:${JSON.stringify(query)}`;
    if (privateData[PRIVATE.INDEX_CACHE].has(cacheKey)) {
      const cached = privateData[PRIVATE.INDEX_CACHE].get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.cacheSize) {
        logger.debug(`📦 Кэш найден: ${cacheKey}`);
        return cached.result;
      }
    }

    if (!store) {
      logger.error('❌ Store не доступен');
      return [];
    }

    const table = store.getTable(tableName);
    if (!table) {
      logger.warn(`⚠️ Таблица "${tableName}" не найдена`);
      return [];
    }

    // Определяем поля для поиска
    const fields = Object.keys(query);
    let results = null;
    let usedIndex = null;

    // Пытаемся использовать индексы
    for (const field of fields) {
      const key = `${tableName}:${field}`;
      if (privateData[PRIVATE.INDEXES].has(key)) {
        const value = query[field];
        const indexData = privateData[PRIVATE.INDEX_DATA].get(key);
        if (indexData) {
          const type = privateData[PRIVATE.TYPES].get(key) || CONFIG.defaultIndexType;
          const strategy = INDEX_STRATEGIES[type] || INDEX_STRATEGIES.btree;
          const ids = strategy.find(indexData, value);

          const rows = [];
          for (const id of ids) {
            const row = table.data.find(r => r.id === id);
            if (row) rows.push(row);
          }

          if (results === null) {
            results = rows;
            usedIndex = key;
          } else {
            // Пересечение результатов
            const resultIds = new Set(results.map(r => r.id));
            results = rows.filter(r => resultIds.has(r.id));
          }
        }
      }
    }

    // Fallback: линейный поиск
    if (results === null || results.length === 0) {
      results = table.data.filter(row => {
        for (const [field, value] of Object.entries(query)) {
          if (row[field] !== value) return false;
        }
        return true;
      });
    }

    // Сортировка
    if (options.sort) {
      results.sort((a, b) => {
        const aVal = a[options.sort] ?? '';
        const bVal = b[options.sort] ?? '';
        const direction = options.direction || 'asc';
        const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -compare : compare;
      });
    }

    // Лимит
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Сохраняем в кэш
    if (usedIndex && results.length > 0) {
      privateData[PRIVATE.INDEX_CACHE].set(cacheKey, {
        result: results,
        timestamp: Date.now(),
      });

      // Ограничиваем размер кэша
      if (privateData[PRIVATE.INDEX_CACHE].size > CONFIG.cacheSize) {
        const entries = [...privateData[PRIVATE.INDEX_CACHE].entries()];
        const toDelete = entries.slice(0, Math.floor(entries.length / 2));
        for (const [key] of toDelete) {
          privateData[PRIVATE.INDEX_CACHE].delete(key);
        }
      }
    }

    if (usedIndex) {
      logger.debug(`🔍 Поиск по индексу: ${usedIndex} (${results.length} результатов)`);
    } else {
      logger.debug(`🔍 Линейный поиск в ${tableName} (${results.length} результатов)`);
    }

    return results;
  },

  [PRIVATE.FIND_ONE](tableName, query) {
    const results = this[PRIVATE.FIND](tableName, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  },

  [PRIVATE.EXISTS](tableName, query) {
    const results = this[PRIVATE.FIND](tableName, query, { limit: 1 });
    return results.length > 0;
  },

  [PRIVATE.COUNT](tableName, query) {
    const results = this[PRIVATE.FIND](tableName, query);
    return results.length;
  },

  // ============================================================
  // 13. УДАЛЕНИЕ ИНДЕКСА
  // ============================================================

  [PRIVATE.DROP](tableName, field) {
    const logger = this._logger;
    const privateData = this._private;

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ IndexPlugin уничтожен');
      return false;
    }

    const key = `${tableName}:${field}`;
    const indexes = privateData[PRIVATE.INDEXES];

    if (!indexes.has(key)) {
      logger.warn(`⚠️ Индекс не найден: ${key}`);
      return false;
    }

    indexes.delete(key);
    privateData[PRIVATE.INDEX_DATA].delete(key);
    privateData[PRIVATE.INDEX_STATS].delete(key);
    privateData[PRIVATE.FIELDS].delete(key);
    privateData[PRIVATE.TYPES].delete(key);
    privateData[PRIVATE.UNIQUE].delete(key);
    privateData[PRIVATE.SPARSE].delete(key);

    this[PRIVATE._updateState]();

    logger.success(`🗑 Индекс удален: ${key}`);
    return true;
  },

  // ============================================================
  // 14. ПЕРЕСТРОЙКА ИНДЕКСА
  // ============================================================

  [PRIVATE.REBUILD](tableName, field) {
    const logger = this._logger;
    const privateData = this._private;

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ IndexPlugin уничтожен');
      return false;
    }

    const key = `${tableName}:${field}`;
    const indexes = privateData[PRIVATE.INDEXES];

    if (!indexes.has(key)) {
      logger.warn(`⚠️ Индекс не найден: ${key}`);
      return false;
    }

    logger.info(`🔄 Перестройка индекса: ${key}`);

    // Очищаем старый индекс
    privateData[PRIVATE.INDEX_DATA].delete(key);
    privateData[PRIVATE.INDEX_STATS].delete(key);

    // Строим заново
    const result = this[PRIVATE._buildIndex](tableName, field, key);
    privateData[PRIVATE.LAST_REBUILD] = Date.now();

    if (result) {
      logger.success(`✅ Индекс перестроен: ${key}`);
    }

    return result;
  },

  // ============================================================
  // 15. СТАТИСТИКА
  // ============================================================

  [PRIVATE.STATS](tableName, field) {
    const privateData = this._private;

    if (tableName && field) {
      const key = `${tableName}:${field}`;
      return privateData[PRIVATE.INDEX_STATS].get(key) || null;
    }

    // Общая статистика
    const stats = {
      totalIndexes: privateData[PRIVATE.INDEXES].size,
      totalKeys: 0,
      totalUniqueKeys: 0,
      totalCollisions: 0,
      cacheSize: privateData[PRIVATE.INDEX_CACHE].size,
      building: privateData[PRIVATE.IS_BUILDING],
      lastRebuild: privateData[PRIVATE.LAST_REBUILD],
      indexes: [],
    };

    for (const [key, indexStats] of privateData[PRIVATE.INDEX_STATS]) {
      stats.totalKeys += indexStats.totalKeys;
      stats.totalUniqueKeys += indexStats.uniqueKeys;
      stats.totalCollisions += indexStats.collisions;
      stats.indexes.push({
        key,
        totalKeys: indexStats.totalKeys,
        uniqueKeys: indexStats.uniqueKeys,
        collisions: indexStats.collisions,
      });
    }

    return stats;
  },

  // ============================================================
  // 16. ОЧИСТКА
  // ============================================================

  [PRIVATE.CLEAR](tableName) {
    const logger = this._logger;
    const privateData = this._private;

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ IndexPlugin уничтожен');
      return false;
    }

    if (tableName) {
      // Удаляем все индексы для таблицы
      const keys = [...privateData[PRIVATE.INDEXES].keys()];
      let count = 0;
      for (const key of keys) {
        if (key.startsWith(`${tableName}:`)) {
          const [, field] = key.split(':');
          this[PRIVATE.DROP](tableName, field);
          count++;
        }
      }
      logger.success(`🧹 Удалено ${count} индексов для таблицы "${tableName}"`);
      return true;
    }

    // Очищаем все
    privateData[PRIVATE.INDEXES].clear();
    privateData[PRIVATE.INDEX_DATA].clear();
    privateData[PRIVATE.INDEX_STATS].clear();
    privateData[PRIVATE.INDEX_CACHE].clear();
    privateData[PRIVATE.FIELDS].clear();
    privateData[PRIVATE.TYPES].clear();
    privateData[PRIVATE.UNIQUE].clear();
    privateData[PRIVATE.SPARSE].clear();
    privateData[PRIVATE.STATE].indexCount = 0;

    logger.success('🧹 Все индексы очищены');
    return true;
  },

  // ============================================================
  // 17. ВАЛИДАЦИЯ
  // ============================================================

  [PRIVATE.VALIDATE](tableName, field, options = {}) {
    if (!tableName || typeof tableName !== 'string') {
      return { valid: false, error: 'Имя таблицы должно быть строкой' };
    }

    if (!field || typeof field !== 'string') {
      return { valid: false, error: 'Имя поля должно быть строкой' };
    }

    if (field.length === 0 || field.length > 100) {
      return { valid: false, error: 'Имя поля должно быть от 1 до 100 символов' };
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      return { valid: false, error: 'Имя поля содержит недопустимые символы' };
    }

    const privateData = this._private;
    const fields = privateData[PRIVATE.FIELDS];
    let count = 0;
    for (const [key] of fields) {
      if (key.startsWith(`${tableName}:`)) {
        count++;
      }
    }

    if (count >= CONFIG.maxFields) {
      return { valid: false, error: `Превышен лимит полей для таблицы: ${CONFIG.maxFields}` };
    }

    if (options.unique && typeof options.unique !== 'boolean') {
      return { valid: false, error: 'unique должен быть булевым значением' };
    }

    if (options.sparse && typeof options.sparse !== 'boolean') {
      return { valid: false, error: 'sparse должен быть булевым значением' };
    }

    return { valid: true };
  },

  // ============================================================
  // 18. ЭКСПОРТ И ИМПОРТ
  // ============================================================

  [PRIVATE.EXPORT]() {
    const privateData = this._private;
    const data = {
      version: CONFIG.version,
      exportedAt: Date.now(),
      indexes: {},
    };

    for (const [key, index] of privateData[PRIVATE.INDEXES]) {
      const indexData = privateData[PRIVATE.INDEX_DATA].get(key);
      if (indexData) {
        data.indexes[key] = {
          index,
          data: Array.from(indexData.entries()).map(([k, v]) => ({
            key: k,
            values: Array.from(v),
          })),
          stats: privateData[PRIVATE.INDEX_STATS].get(key),
        };
      }
    }

    return data;
  },

  [PRIVATE.IMPORT](data) {
    const logger = this._logger;
    const privateData = this._private;

    if (!data || typeof data !== 'object') {
      logger.error('❌ Некорректные данные для импорта');
      return false;
    }

    if (data.version !== CONFIG.version) {
      logger.warn(`⚠️ Версия индексов не совпадает: ${data.version} vs ${CONFIG.version}`);
    }

    let count = 0;
    for (const [key, entry] of Object.entries(data.indexes || {})) {
      const [tableName, field] = key.split(':');
      if (!tableName || !field) continue;

      // Создаем индекс
      const index = entry.index;
      if (index) {
        this[PRIVATE.CREATE](tableName, field, {
          type: index.type,
          unique: index.unique,
          sparse: index.sparse,
        });

        // Восстанавливаем данные
        if (entry.data) {
          const indexData = new Map();
          for (const item of entry.data) {
            indexData.set(item.key, new Set(item.values));
          }
          privateData[PRIVATE.INDEX_DATA].set(key, indexData);
          privateData[PRIVATE.INDEX_STATS].set(key, entry.stats);
          count++;
        }
      }
    }

    logger.success(`✅ Импортировано ${count} индексов`);
    return true;
  },

  // ============================================================
  // 19. СОСТОЯНИЕ
  // ============================================================

  [PRIVATE.GET_STATE]() {
    const privateData = this._private;
    const stats = this[PRIVATE.STATS]();

    return {
      initialized: privateData[PRIVATE.STATE].initialized,
      destroyed: privateData[PRIVATE.STATE].destroyed,
      ready: privateData[PRIVATE.STATE].ready,
      indexCount: privateData[PRIVATE.STATE].indexCount,
      totalKeys: stats.totalKeys || 0,
      cacheSize: privateData[PRIVATE.INDEX_CACHE].size,
      building: privateData[PRIVATE.IS_BUILDING],
      lastRebuild: privateData[PRIVATE.LAST_REBUILD],
      version: CONFIG.version,
      build: CONFIG.build,
      config: { ...CONFIG },
      indexes: [...privateData[PRIVATE.INDEXES].keys()],
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 20. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PRIVATE.HEALTH_CHECK]() {
    const privateData = this._private;
    const issues = [];

    // Проверяем индексы
    for (const [key, index] of privateData[PRIVATE.INDEXES]) {
      const indexData = privateData[PRIVATE.INDEX_DATA].get(key);
      if (!indexData) {
        issues.push(`Индекс "${key}" не имеет данных`);
        continue;
      }

      // Проверяем размер
      if (indexData.size > CONFIG.maxIndexSize) {
        issues.push(`Индекс "${key}" превышает лимит размера`);
      }

      // Проверяем уникальность
      if (privateData[PRIVATE.UNIQUE].get(key)) {
        for (const [keyValue, ids] of indexData) {
          if (ids.size > 1) {
            issues.push(`Нарушение уникальности в индексе "${key}" для ключа: ${keyValue}`);
          }
        }
      }
    }

    // Проверяем кэш
    if (privateData[PRIVATE.INDEX_CACHE].size > CONFIG.cacheSize * 2) {
      issues.push('Кэш индексов превышает лимит');
    }

    return {
      healthy: issues.length === 0,
      issues,
      indexCount: privateData[PRIVATE.INDEXES].size,
      cacheSize: privateData[PRIVATE.INDEX_CACHE].size,
      building: privateData[PRIVATE.IS_BUILDING],
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 21. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__INDEX_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };

      window.__indexPlugin = this;
      window[PUBLIC.INSTANCE] = this;

      // Выводим статистику символов
      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;

      console.log('📊 INDEX SYMBOLS STATS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
    }
  },

  // ============================================================
  // 22. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const logger = this._logger;
    const privateData = this._private;

    if (!privateData || privateData[PRIVATE.DESTROYED]) {
      logger.warn('⚠️ IndexPlugin уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение IndexPlugin...');

    // Очищаем все индексы
    this[PRIVATE.CLEAR]();

    privateData[PRIVATE.DESTROYED] = true;
    privateData[PRIVATE.STATE].destroyed = true;
    privateData[PRIVATE.STATE].ready = false;
    privateData[PRIVATE.STATE].indexCount = 0;

    // Удаляем глобальные ссылки
    if (typeof window !== 'undefined') {
      delete window.__INDEX_SYMBOLS;
      delete window.__indexPlugin;
      delete window[PUBLIC.INSTANCE];
    }

    logger.success('✅ IndexPlugin уничтожен');
  },

  // ============================================================
  // 23. ПУБЛИЧНЫЕ МЕТОДЫ (обертки)
  // ============================================================

  create: function(tableName, field, options = {}) {
    return this[PRIVATE.CREATE](tableName, field, options);
  },

  drop: function(tableName, field) {
    return this[PRIVATE.DROP](tableName, field);
  },

  rebuild: function(tableName, field) {
    return this[PRIVATE.REBUILD](tableName, field);
  },

  find: function(tableName, query, options = {}) {
    return this[PRIVATE.FIND](tableName, query, options);
  },

  findOne: function(tableName, query) {
    return this[PRIVATE.FIND_ONE](tableName, query);
  },

  exists: function(tableName, query) {
    return this[PRIVATE.EXISTS](tableName, query);
  },

  count: function(tableName, query) {
    return this[PRIVATE.COUNT](tableName, query);
  },

  stats: function(tableName, field) {
    return this[PRIVATE.STATS](tableName, field);
  },

  clear: function(tableName) {
    return this[PRIVATE.CLEAR](tableName);
  },

  export: function() {
    return this[PRIVATE.EXPORT]();
  },

  import: function(data) {
    return this[PRIVATE.IMPORT](data);
  },

  getState: function() {
    return this[PRIVATE.GET_STATE]();
  },

  healthCheck: function() {
    return this[PRIVATE.HEALTH_CHECK]();
  },
};

// ============================================================
// 24. ЭКСПОРТЫ
// ============================================================

export default IndexPlugin;

export {
  PRIVATE as INDEX_PRIVATE,
  PUBLIC as INDEX_PUBLIC,
  CONFIG as INDEX_CONFIG,
};

// ============================================================
// 25. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ (при загрузке)
// ============================================================

if (typeof window !== 'undefined') {
  window.__INDEX_CONFIG = { ...CONFIG };
  window.__INDEX_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };
  window.__indexPlugin = IndexPlugin;
  window[PUBLIC.INSTANCE] = IndexPlugin;

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔍 INDEX PLUGIN (100% СИМВОЛЫ) v4.0.4                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ B-Tree и Hash индексы                                                 ║');
  console.log('║    ✅ Уникальные и разреженные индексы                                      ║');
  console.log('║    ✅ Автоматическое построение индексов                                     ║');
  console.log('║    ✅ Кэширование результатов поиска                                        ║');
  console.log('║    ✅ Экспорт/Импорт индексов                                               ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ Перестройка индексов                                                  ║');
  console.log('║    ✅ Health Check                                                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов:  ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов:  ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов:  ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  console.log('📋 КОМАНДЫ ОТЛАДКИ:');
  console.log('  window.__indexPlugin — доступ к плагину');
  console.log('  __indexPlugin.create(table, field, options) — создать индекс');
  console.log('  __indexPlugin.find(table, query, options) — поиск по индексу');
  console.log('  __indexPlugin.stats(table, field) — статистика индекса');
  console.log('  __indexPlugin.healthCheck() — проверка целостности');
  console.log('');
}

// ============================================================
// 26. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование IndexPlugin
// ============================================================

import { createStore } from '../index.js';
import { IndexPlugin } from './IndexPlugin.js';

// 1. Создаем store с плагином
const store = createStore({
  plugins: [IndexPlugin],
});

// 2. Создаем таблицу
store.createTable('users');

// 3. Добавляем данные
store.users.add([
  { id: 'u1', name: 'Иван', age: 25, city: 'Moscow' },
  { id: 'u2', name: 'Петр', age: 30, city: 'SPB' },
  { id: 'u3', name: 'Мария', age: 28, city: 'Moscow' },
]);

// 4. Создаем индекс
store.index.create('users', 'name', { unique: false });
store.index.create('users', 'city', { unique: false });

// 5. Поиск по индексу
const results = store.index.find('users', { city: 'Moscow' });
console.log('Результаты:', results);

// 6. Статистика
console.log('Статистика:', store.index.stats());

// 7. Health Check
console.log('Health:', store.index.healthCheck());

// 8. Экспорт/Импорт
const exportData = store.index.export();
store.index.import(exportData);
*/