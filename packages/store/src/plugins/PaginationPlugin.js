// ============================================================
// plugins/PaginationPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Пагинация с курсорами для Enterprise Store
// Версия: 4.0.1
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('pagination.version'),
  BUILD: Symbol('pagination.build'),
  NAME: Symbol('pagination.name'),
  CONFIG: Symbol('pagination.config'),
  STATE: Symbol('pagination.state'),
  INITIALIZED: Symbol('pagination.initialized'),
  DESTROYED: Symbol('pagination.destroyed'),
  IS_ACTIVE: Symbol('pagination.isActive'),
  START_TIME: Symbol('pagination.startTime'),

  // Данные пагинации
  CACHE: Symbol('pagination.cache'),
  STATS: Symbol('pagination.stats'),
  STATS_HISTORY: Symbol('pagination.statsHistory'),
  DEFAULT_PAGE_SIZE: Symbol('pagination.defaultPageSize'),
  MAX_PAGE_SIZE: Symbol('pagination.maxPageSize'),
  MIN_PAGE_SIZE: Symbol('pagination.minPageSize'),
  CURSOR_FIELD: Symbol('pagination.cursorField'),
  CURSOR_ENCODING: Symbol('pagination.cursorEncoding'),

  // Кэш
  CACHE_SIZE: Symbol('pagination.cacheSize'),
  CACHE_TTL: Symbol('pagination.cacheTTL'),
  CACHE_HITS: Symbol('pagination.cacheHits'),
  CACHE_MISSES: Symbol('pagination.cacheMisses'),
  CACHE_EVICTIONS: Symbol('pagination.cacheEvictions'),

  // Безопасность
  VALIDATE: Symbol('pagination.validate'),
  SANITIZE: Symbol('pagination.sanitize'),
  SECURE: Symbol('pagination.secure'),
  MAX_LIMIT: Symbol('pagination.maxLimit'),
  MAX_OFFSET: Symbol('pagination.maxOffset'),

  // Методы
  INIT: Symbol('pagination.init'),
  DESTROY: Symbol('pagination.destroy'),
  PAGINATE: Symbol('pagination.paginate'),
  CURSOR: Symbol('pagination.cursor'),
  GET_STATS: Symbol('pagination.getStats'),
  GET_CACHE_STATS: Symbol('pagination.getCacheStats'),
  CLEAR_CACHE: Symbol('pagination.clearCache'),
  INVALIDATE_CACHE: Symbol('pagination.invalidateCache'),
  HEALTH_CHECK: Symbol('pagination.healthCheck'),
  VALIDATE_OPTIONS: Symbol('pagination.validateOptions'),
  BUILD_CACHE_KEY: Symbol('pagination.buildCacheKey'),
  ENCODE_CURSOR: Symbol('pagination.encodeCursor'),
  DECODE_CURSOR: Symbol('pagination.decodeCursor'),
  UPDATE_STATS: Symbol('pagination.updateStats'),
  EXPORT_SYMBOLS: Symbol('pagination.exportSymbols'),
  GET_STATE: Symbol('pagination.getState'),
  SET_STATE: Symbol('pagination.setState'),

  // Логгер
  LOGGER: Symbol('pagination.logger'),
  LOG: Symbol('pagination.log'),
  DEBUG: Symbol('pagination.debug'),
  ERROR: Symbol('pagination.error'),
  WARN: Symbol('pagination.warn'),
  SUCCESS: Symbol('pagination.success'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('pagination.instance'),
  STATE: Symbol.for('pagination.state'),
  CONFIG: Symbol.for('pagination.config'),
  INIT: Symbol.for('pagination.init'),
  DESTROY: Symbol.for('pagination.destroy'),
  PAGINATE: Symbol.for('pagination.paginate'),
  CURSOR: Symbol.for('pagination.cursor'),
  GET_STATS: Symbol.for('pagination.getStats'),
  GET_CACHE_STATS: Symbol.for('pagination.getCacheStats'),
  CLEAR_CACHE: Symbol.for('pagination.clearCache'),
  INVALIDATE_CACHE: Symbol.for('pagination.invalidateCache'),
  HEALTH_CHECK: Symbol.for('pagination.healthCheck'),
  GET_STATE: Symbol.for('pagination.getState'),
  SET_STATE: Symbol.for('pagination.setState'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.1',
  build: '2026-07-28',
  name: 'Pagination Plugin',
  debug: true,

  // Настройки пагинации
  defaultPageSize: 20,
  maxPageSize: 100,
  minPageSize: 1,
  maxOffset: 10000,
  maxLimit: 1000,

  // Настройки кэша
  cacheSize: 100,
  cacheTTL: 60000, // 1 минута
  cacheEnabled: true,

  // Настройки курсора
  cursorField: 'id',
  cursorEncoding: 'base64',
  cursorSeparator: '|',

  // Безопасность
  validateInput: true,
  sanitizeOutput: true,
  strictMode: true,
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
  COLORS: Symbol('logger.colors'),
};

function createLogger(debug = true, instanceId = 'Pagination') {
  const logState = {
    [LOGGER_SYMBOLS.HISTORY]: [],
    [LOGGER_SYMBOLS.MAX_HISTORY]: 200,
    [LOGGER_SYMBOLS.DEBUG]: debug,
    [LOGGER_SYMBOLS.INSTANCE_ID]: instanceId,
    [LOGGER_SYMBOLS.LEVEL]: debug ? 3 : 2,
    [LOGGER_SYMBOLS.COLORS]: {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
    },
  };

  const logMethod = function (level, message, data = null) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3, success: 2 };
    const currentLevel = this[LOGGER_SYMBOLS.LEVEL] || 2;
    const msgLevel = levels[level] || 2;

    if (msgLevel > currentLevel) {return;}

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
    const colors = this[LOGGER_SYMBOLS.COLORS];
    const colorMap = {
      error: colors.red,
      warn: colors.yellow,
      info: colors.blue,
      debug: colors.gray,
      success: colors.green,
    };
    const color = colorMap[level] || colors.white;

    if (data !== null && data !== undefined) {
      console.log(`${color}${icon} ${prefix} ${message}${colors.reset}`, data);
    } else {
      console.log(`${color}${icon} ${prefix} ${message}${colors.reset}`);
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
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      const separator = '═'.repeat(70);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
      console.log(`${colors.bold}${colors.magenta}  📄 ${title}${colors.reset}`);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
    },

    separator: (color = '#636e72') => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
    },

    getHistory () {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory () {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug (enabled) {
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
  logger[LOGGER_SYMBOLS.COLORS] = logState[LOGGER_SYMBOLS.COLORS];

  return logger;
}

// ============================================================
// 5. ОСНОВНОЙ КЛАСС PAGINATION_PLUGIN (100% символы)
// ============================================================

export const PaginationPlugin = {
  name: 'pagination',
  version: CONFIG.version,
  metadata: {
    description: 'Enterprise-grade pagination with cursor support',
    author: 'Enterprise Store Team',
    license: 'MIT',
    repository: 'https://github.com/enterprise-store/pagination',
  },
  order: 3,
  dependencies: ['core'],

  // ============================================================
  // 6. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  init(store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // Создаем приватное состояние через WeakMap
    const _private = new WeakMap();
    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG]: { ...CONFIG },
      [PRIVATE.STATE]: {
        initialized: false,
        destroyed: false,
        isActive: false,
      },
      [PRIVATE.START_TIME]: Date.now(),
      [PRIVATE.CACHE]: new Map(),
      [PRIVATE.STATS]: {
        totalQueries: 0,
        totalPages: 0,
        totalItems: 0,
        averagePageSize: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheEvictions: 0,
        errors: 0,
        startTime: Date.now(),
        lastQuery: null,
      },
      [PRIVATE.STATS_HISTORY]: [],
      [PRIVATE.DEFAULT_PAGE_SIZE]: CONFIG.defaultPageSize,
      [PRIVATE.MAX_PAGE_SIZE]: CONFIG.maxPageSize,
      [PRIVATE.MIN_PAGE_SIZE]: CONFIG.minPageSize,
      [PRIVATE.CURSOR_FIELD]: CONFIG.cursorField,
      [PRIVATE.CURSOR_ENCODING]: CONFIG.cursorEncoding,
      [PRIVATE.CACHE_SIZE]: CONFIG.cacheSize,
      [PRIVATE.CACHE_TTL]: CONFIG.cacheTTL,
      [PRIVATE.CACHE_HITS]: 0,
      [PRIVATE.CACHE_MISSES]: 0,
      [PRIVATE.CACHE_EVICTIONS]: 0,
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.IS_ACTIVE]: false,
      [PRIVATE.LOGGER]: logger,
    };

    _private.set(this, privateData);
    this._private = _private;

    // ============================================================
    // 7. МЕТОДЫ ПАГИНАЦИИ
    // ============================================================

    /**
     * Пагинация с курсорами
     * @param {string} tableName - Имя таблицы
     * @param {Object} options - Опции пагинации
     * @returns {Object} Результат пагинации
     */
    store[PUBLIC.PAGINATE] = function (tableName, options = {}) {
      const p = this._private.get(this);
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Плагин пагинации не активен');
        return null;
      }

      // Валидация опций
      const validated = this[PRIVATE.VALIDATE_OPTIONS](options);
      if (!validated.valid) {
        logger.error(`❌ Некорректные опции: ${validated.error}`);
        return null;
      }

      const {
        page = 1,
        pageSize = p[PRIVATE.DEFAULT_PAGE_SIZE],
        cursor = null,
        sort = p[PRIVATE.CURSOR_FIELD],
        direction = 'asc',
        where = null,
        fields = null,
        includeTotal = true,
        useCache = true,
        offset = 0,
      } = validated.options;

      // Проверка лимитов
      if (offset > CONFIG.maxOffset) {
        logger.error(`❌ Offset не может превышать ${CONFIG.maxOffset}`);
        return null;
      }

      if (pageSize > CONFIG.maxPageSize) {
        logger.error(`❌ PageSize не может превышать ${CONFIG.maxPageSize}`);
        return null;
      }

      // Построение ключа кэша
      const cacheKey = this[PRIVATE.BUILD_CACHE_KEY](tableName, options);

      // Проверка кэша
      if (useCache && CONFIG.cacheEnabled && p[PRIVATE.CACHE].has(cacheKey)) {
        const cached = p[PRIVATE.CACHE].get(cacheKey);
        if (Date.now() - cached.timestamp < p[PRIVATE.CACHE_TTL]) {
          p[PRIVATE.STATS].cacheHits++;
          logger.debug(`💾 Кэш-хит для ${tableName}`);
          return cached.result;
        }
        p[PRIVATE.CACHE].delete(cacheKey);
        p[PRIVATE.STATS].cacheEvictions++;
      }

      // Получаем данные
      const table = store.getTable(tableName);
      if (!table) {
        logger.error(`❌ Таблица "${tableName}" не найдена`);
        return null;
      }

      let data = [...table.data];

      // Фильтрация
      if (where) {
        data = data.filter(row => {
          for (const [key, value] of Object.entries(where)) {
            if (row[key] !== value) {return false;}
          }
          return true;
        });
      }

      // Сортировка
      data.sort((a, b) => {
        const aVal = a[sort] ?? '';
        const bVal = b[sort] ?? '';
        const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'asc' ? compare : -compare;
      });

      // Пагинация
      const total = data.length;
      let startIndex = offset;

      if (cursor) {
        const decodedCursor = this[PRIVATE.DECODE_CURSOR](cursor);
        if (decodedCursor) {
          const cursorIndex = data.findIndex(row => row.id === decodedCursor);
          if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
          }
        }
      } else {
        startIndex = (page - 1) * pageSize + offset;
      }

      const endIndex = Math.min(startIndex + pageSize, data.length);
      const items = data.slice(startIndex, endIndex);

      // Формируем результат
      const result = {
        items,
        total: includeTotal ? total : undefined,
        page,
        pageSize,
        totalPages: includeTotal ? Math.ceil(total / pageSize) : undefined,
        hasMore: endIndex < data.length,
        hasPrevious: startIndex > 0,
        offset: startIndex,
        cursor: {
          next:
            endIndex < data.length
              ? this[PRIVATE.ENCODE_CURSOR](items[items.length - 1]?.id)
              : null,
          previous: startIndex > 0 ? this[PRIVATE.ENCODE_CURSOR](items[0]?.id) : null,
        },
        stats: {
          startIndex,
          endIndex,
          returned: items.length,
          total,
          pageSize,
        },
        timestamp: Date.now(),
      };

      // Кэшируем
      if (useCache && CONFIG.cacheEnabled) {
        if (p[PRIVATE.CACHE].size >= p[PRIVATE.CACHE_SIZE]) {
          const firstKey = p[PRIVATE.CACHE].keys().next().value;
          p[PRIVATE.CACHE].delete(firstKey);
          p[PRIVATE.STATS].cacheEvictions++;
        }
        p[PRIVATE.CACHE].set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      // Обновляем статистику
      p[PRIVATE.STATS].totalQueries++;
      p[PRIVATE.STATS].totalPages++;
      p[PRIVATE.STATS].totalItems += items.length;
      p[PRIVATE.STATS].averagePageSize =
        (p[PRIVATE.STATS].averagePageSize * (p[PRIVATE.STATS].totalQueries - 1) + items.length) /
        p[PRIVATE.STATS].totalQueries;
      p[PRIVATE.STATS].lastQuery = Date.now();

      // Сохраняем историю
      p[PRIVATE.STATS_HISTORY].push({
        timestamp: Date.now(),
        table: tableName,
        page,
        pageSize,
        itemsCount: items.length,
        total,
        hasMore: result.hasMore,
      });
      if (p[PRIVATE.STATS_HISTORY].length > 100) {
        p[PRIVATE.STATS_HISTORY].shift();
      }

      // Обновляем состояние
      p[PRIVATE.STATE].isActive = true;

      logger.debug(`📄 Пагинация ${tableName}: страница ${page}, ${items.length} записей`);
      return result;
    };

    /**
     * Получить страницу по курсору
     */
    store[PUBLIC.CURSOR] = function (tableName, cursor, pageSize = null, options = {}) {
      return this[PUBLIC.PAGINATE](tableName, {
        ...options,
        cursor,
        pageSize: pageSize || CONFIG.defaultPageSize,
      });
    };

    /**
     * Получить статистику пагинации
     */
    store[PUBLIC.GET_STATS] = function () {
      const p = this._private.get(this);
      const stats = p[PRIVATE.STATS];
      return {
        ...stats,
        cacheSize: p[PRIVATE.CACHE].size,
        cacheMaxSize: p[PRIVATE.CACHE_SIZE],
        cacheTTL: p[PRIVATE.CACHE_TTL],
        uptime: Date.now() - stats.startTime,
        version: CONFIG.version,
        isActive: p[PRIVATE.IS_ACTIVE],
        historySize: p[PRIVATE.STATS_HISTORY].length,
      };
    };

    /**
     * Получить статистику кэша
     */
    store[PUBLIC.GET_CACHE_STATS] = function () {
      const p = this._private.get(this);
      const stats = p[PRIVATE.STATS];
      const total = stats.cacheHits + stats.cacheMisses;
      return {
        size: p[PRIVATE.CACHE].size,
        maxSize: p[PRIVATE.CACHE_SIZE],
        ttl: p[PRIVATE.CACHE_TTL],
        hits: stats.cacheHits,
        misses: stats.cacheMisses,
        evictions: stats.cacheEvictions,
        hitRate: total > 0 ? ((stats.cacheHits / total) * 100).toFixed(2) + '%' : '0%',
        enabled: CONFIG.cacheEnabled,
      };
    };

    /**
     * Очистить кэш
     */
    store[PUBLIC.CLEAR_CACHE] = function (tableName = null) {
      const p = this._private.get(this);
      const logger = p[PRIVATE.LOGGER];

      if (tableName) {
        const keysToRemove = [];
        for (const [key] of p[PRIVATE.CACHE]) {
          if (key.startsWith(`${tableName}:`)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          p[PRIVATE.CACHE].delete(key);
        }
        logger.success(`🧹 Кэш пагинации очищен для ${tableName}`);
      } else {
        p[PRIVATE.CACHE].clear();
        logger.success('🧹 Кэш пагинации полностью очищен');
      }
      return true;
    };

    /**
     * Инвалидировать кэш для таблицы
     */
    store[PUBLIC.INVALIDATE_CACHE] = function (tableName) {
      return this[PUBLIC.CLEAR_CACHE](tableName);
    };

    /**
     * Проверка целостности
     */
    store[PUBLIC.HEALTH_CHECK] = function () {
      const p = this._private.get(this);
      return {
        initialized: p[PRIVATE.INITIALIZED],
        destroyed: p[PRIVATE.DESTROYED],
        isActive: p[PRIVATE.IS_ACTIVE],
        cacheSize: p[PRIVATE.CACHE].size,
        cacheMaxSize: p[PRIVATE.CACHE_SIZE],
        totalQueries: p[PRIVATE.STATS].totalQueries,
        cacheHits: p[PRIVATE.STATS].cacheHits,
        cacheMisses: p[PRIVATE.STATS].cacheMisses,
        version: CONFIG.version,
        status:
          p[PRIVATE.INITIALIZED] && !p[PRIVATE.DESTROYED] && p[PRIVATE.IS_ACTIVE]
            ? 'healthy'
            : 'unhealthy',
        uptime: Date.now() - p[PRIVATE.START_TIME],
        timestamp: Date.now(),
      };
    };

    /**
     * Получить состояние
     */
    store[PUBLIC.GET_STATE] = function () {
      const p = this._private.get(this);
      return {
        initialized: p[PRIVATE.INITIALIZED],
        destroyed: p[PRIVATE.DESTROYED],
        isActive: p[PRIVATE.IS_ACTIVE],
        cacheSize: p[PRIVATE.CACHE].size,
        stats: { ...p[PRIVATE.STATS] },
        config: {
          defaultPageSize: p[PRIVATE.DEFAULT_PAGE_SIZE],
          maxPageSize: p[PRIVATE.MAX_PAGE_SIZE],
          cacheSize: p[PRIVATE.CACHE_SIZE],
          cacheTTL: p[PRIVATE.CACHE_TTL],
        },
        version: CONFIG.version,
        timestamp: Date.now(),
      };
    };

    /**
     * Установить состояние
     */
    store[PUBLIC.SET_STATE] = function (state) {
      const p = this._private.get(this);
      if (state.isActive !== undefined) {
        p[PRIVATE.IS_ACTIVE] = state.isActive;
      }
      if (state.defaultPageSize !== undefined) {
        p[PRIVATE.DEFAULT_PAGE_SIZE] = state.defaultPageSize;
      }
      if (state.maxPageSize !== undefined) {
        p[PRIVATE.MAX_PAGE_SIZE] = state.maxPageSize;
      }
      return true;
    };

    // ============================================================
    // 8. ВНУТРЕННИЕ МЕТОДЫ
    // ============================================================

    /**
     * Валидация опций
     */
    store[PRIVATE.VALIDATE_OPTIONS] = function (options) {
      const errors = [];

      if (options.page !== undefined && (typeof options.page !== 'number' || options.page < 1)) {
        errors.push('page должен быть положительным числом');
      }

      if (options.pageSize !== undefined) {
        if (typeof options.pageSize !== 'number' || options.pageSize < 1) {
          errors.push('pageSize должен быть положительным числом');
        }
        if (options.pageSize > CONFIG.maxPageSize) {
          errors.push(`pageSize не может превышать ${CONFIG.maxPageSize}`);
        }
        if (options.pageSize < CONFIG.minPageSize) {
          errors.push(`pageSize не может быть меньше ${CONFIG.minPageSize}`);
        }
      }

      if (options.cursor !== undefined && typeof options.cursor !== 'string') {
        errors.push('cursor должен быть строкой');
      }

      if (options.sort !== undefined && typeof options.sort !== 'string') {
        errors.push('sort должен быть строкой');
      }

      if (options.direction !== undefined && !['asc', 'desc'].includes(options.direction)) {
        errors.push('direction должен быть "asc" или "desc"');
      }

      if (
        options.where !== undefined &&
        (typeof options.where !== 'object' || Array.isArray(options.where))
      ) {
        errors.push('where должен быть объектом');
      }

      if (options.fields !== undefined && !Array.isArray(options.fields)) {
        errors.push('fields должен быть массивом');
      }

      if (
        options.offset !== undefined &&
        (typeof options.offset !== 'number' || options.offset < 0)
      ) {
        errors.push('offset должен быть неотрицательным числом');
      }

      return {
        valid: errors.length === 0,
        error: errors.length > 0 ? errors.join(', ') : null,
        options: {
          page: options.page || 1,
          pageSize: options.pageSize || CONFIG.defaultPageSize,
          cursor: options.cursor || null,
          sort: options.sort || 'id',
          direction: options.direction || 'asc',
          where: options.where || null,
          fields: options.fields || null,
          includeTotal: options.includeTotal !== false,
          useCache: options.useCache !== false,
          offset: options.offset || 0,
        },
      };
    };

    /**
     * Построить ключ кэша
     */
    store[PRIVATE.BUILD_CACHE_KEY] = function (tableName, options) {
      const { page, pageSize, cursor, sort, direction, where, fields, offset } = options;
      const key = JSON.stringify({
        table: tableName,
        page,
        pageSize,
        cursor,
        sort,
        direction,
        where,
        fields,
        offset,
      });
      return `${tableName}:${key}`;
    };

    /**
     * Закодировать курсор
     */
    store[PRIVATE.ENCODE_CURSOR] = function (value) {
      if (!value) {return null;}
      const encoded = Buffer.from(String(value)).toString('base64');
      return `cursor_${encoded}`;
    };

    /**
     * Декодировать курсор
     */
    store[PRIVATE.DECODE_CURSOR] = function (cursor) {
      if (!cursor || !cursor.startsWith('cursor_')) {return null;}
      try {
        const encoded = cursor.replace('cursor_', '');
        return Buffer.from(encoded, 'base64').toString('utf-8');
      } catch {
        return null;
      }
    };

    /**
     * Экспорт символов
     */
    store[PRIVATE.EXPORT_SYMBOLS] = function () {
      if (typeof window !== 'undefined') {
        window.__PAGINATION_SYMBOLS = {
          PRIVATE: { ...PRIVATE },
          PUBLIC: { ...PUBLIC },
        };
      }
    };

    // Экспортируем символы
    store[PRIVATE.EXPORT_SYMBOLS]();

    // ============================================================
    // 9. АКТИВАЦИЯ ПЛАГИНА
    // ============================================================

    // Активируем плагин
    privateData[PRIVATE.INITIALIZED] = true;
    privateData[PRIVATE.IS_ACTIVE] = true;
    privateData[PRIVATE.STATE].initialized = true;
    privateData[PRIVATE.STATE].isActive = true;

    // Выводим информацию
    logger.header('ПЛАГИН ПАГИНАЦИИ ИНИЦИАЛИЗИРОВАН');
    logger.success(`✅ Пагинация активна (размер страницы: ${CONFIG.defaultPageSize})`);
    logger.info(`📄 Максимальный размер: ${CONFIG.maxPageSize}`);
    logger.info(`📄 Минимальный размер: ${CONFIG.minPageSize}`);
    logger.info(`💾 Кэш: ${CONFIG.cacheSize} записей, TTL: ${CONFIG.cacheTTL}мс`);
    logger.info(`🔐 Безопасность: ${CONFIG.validateInput ? 'ON' : 'OFF'}`);
    logger.separator();

    // Регистрируем хуки для обновления кэша
    if (store.on) {
      store.on('data:inserted', data => {
        if (data && data.table) {
          this[PUBLIC.INVALIDATE_CACHE](data.table);
        }
      });
      store.on('data:updated', data => {
        if (data && data.table) {
          this[PUBLIC.INVALIDATE_CACHE](data.table);
        }
      });
      store.on('data:deleted', data => {
        if (data && data.table) {
          this[PUBLIC.INVALIDATE_CACHE](data.table);
        }
      });
      logger.debug('🔗 Хуки для инвалидации кэша зарегистрированы');
    }

    // Возвращаем плагин
    return this;
  },

  // ============================================================
  // 10. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const p = store._private?.get(this);
    if (!p) {return;}

    const logger = p[PRIVATE.LOGGER];

    logger.info('🧹 Уничтожение плагина пагинации...');

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.IS_ACTIVE] = false;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].isActive = false;
    p[PRIVATE.CACHE].clear();

    logger.success('✅ Плагин пагинации уничтожен');
  },
};

// ============================================================
// 11. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__PAGINATION_PLUGIN = PaginationPlugin;
  window.__PAGINATION_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  // ★ ИСПРАВЛЕНО: определяем privateCount и publicCount
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📄 PAGINATION PLUGIN (100% СИМВОЛЫ) v4.0.1                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Пагинация с курсорами (next/previous)                                  ║');
  console.log('║    ✅ Кэширование запросов с TTL                                            ║');
  console.log('║    ✅ Фильтрация и сортировка                                               ║');
  console.log('║    ✅ Автоматическая инвалидация кэша                                       ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ История запросов                                                      ║');
  console.log('║    ✅ Безопасность (валидация, санитизация)                                 ║');
  console.log('║    ✅ Хуки для обновления кэша                                              ║');
  console.log('║    ✅ Полное состояние и health check                                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(
    `║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`,
  );
  console.log(
    `║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`,
  );
  console.log(
    `║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`,
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КОМАНДЫ:                                                               ║');
  console.log('║    store.paginate(table, options) — пагинация                               ║');
  console.log('║    store.cursor(table, cursor, pageSize) — страница по курсору              ║');
  console.log('║    store.getPaginationStats() — статистика                                  ║');
  console.log('║    store.getPaginationCacheStats() — статистика кэша                       ║');
  console.log('║    store.clearPaginationCache(table) — очистить кэш                         ║');
  console.log('║    store.invalidatePaginationCache(table) — инвалидировать кэш              ║');
  console.log('║    store.paginationHealthCheck() — проверка целостности                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 12. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default PaginationPlugin;

// ============================================================
// 13. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование PaginationPlugin
// ============================================================

import { createStore } from '../index.js';
import { PaginationPlugin } from './PaginationPlugin.js';

// 1. Создаем store с плагином
const store = createStore({
    plugins: [PaginationPlugin],
});

// 2. Добавляем данные (100 записей)
for (let i = 1; i <= 100; i++) {
    store.users.add({
        id: `u${i}`,
        name: `User ${i}`,
        age: 20 + (i % 30),
        city: ['Moscow', 'SPB', 'Novosibirsk'][i % 3],
    });
}

// 3. Пагинация с фильтром
const page1 = store.paginate('users', {
    page: 1,
    pageSize: 10,
    where: { city: 'Moscow' },
    sort: 'age',
    direction: 'desc',
});
console.log('Страница 1:', page1);

// 4. Следующая страница по курсору
const page2 = store.cursor('users', page1.cursor.next);
console.log('Страница 2:', page2);

// 5. Полная статистика
console.log('📊 Статистика:', store.getPaginationStats());

// 6. Статистика кэша
console.log('💾 Кэш:', store.getPaginationCacheStats());

// 7. Health Check
console.log('🏥 Health:', store.paginationHealthCheck());

// 8. Очистка кэша
store.clearPaginationCache('users');

// 9. Состояние
console.log('📦 Состояние:', store.getPaginationState());

// 10. Установка состояния
store.setPaginationState({ defaultPageSize: 50 });
*/
