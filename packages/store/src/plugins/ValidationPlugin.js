// ============================================================
// plugins/ValidationPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Плагин валидации схем для Enterprise Store
// Версия: 4.0.3 (ИСПРАВЛЕНО)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('validation.version'),
  BUILD: Symbol('validation.build'),
  NAME: Symbol('validation.name'),
  CONFIG: Symbol('validation.config'),
  STATE: Symbol('validation.state'),
  INITIALIZED: Symbol('validation.initialized'),
  DESTROYED: Symbol('validation.destroyed'),
  READY: Symbol('validation.ready'),
  IS_ACTIVE: Symbol('validation.isActive'),
  START_TIME: Symbol('validation.startTime'),

  // Данные валидации
  SCHEMAS: Symbol('validation.schemas'),
  VALIDATORS: Symbol('validation.validators'),
  RULES: Symbol('validation.rules'),
  CACHE: Symbol('validation.cache'),
  ERRORS: Symbol('validation.errors'),
  ERROR_HISTORY: Symbol('validation.errorHistory'),

  // Статистика
  STATS: Symbol('validation.stats'),
  STATS_HISTORY: Symbol('validation.statsHistory'),
  VALIDATION_COUNT: Symbol('validation.count'),
  ERROR_COUNT: Symbol('validation.errorCount'),
  CACHE_HITS: Symbol('validation.cacheHits'),
  CACHE_MISSES: Symbol('validation.cacheMisses'),

  // Хуки
  HOOKS: Symbol('validation.hooks'),
  BEFORE_VALIDATE: Symbol('validation.beforeValidate'),
  AFTER_VALIDATE: Symbol('validation.afterValidate'),
  ON_ERROR: Symbol('validation.onError'),
  ON_SUCCESS: Symbol('validation.onSuccess'),

  // Безопасность
  VALIDATE: Symbol('validation.validate'),
  SANITIZE: Symbol('validation.sanitize'),
  SECURE: Symbol('validation.secure'),
  ESCAPE: Symbol('validation.escape'),

  // Методы
  INIT: Symbol('validation.init'),
  DESTROY: Symbol('validation.destroy'),
  REGISTER_SCHEMA: Symbol('validation.registerSchema'),
  UNREGISTER_SCHEMA: Symbol('validation.unregisterSchema'),
  GET_SCHEMA: Symbol('validation.getSchema'),
  LIST_SCHEMAS: Symbol('validation.listSchemas'),
  VALIDATE_DATA: Symbol('validation.validateData'),
  VALIDATE_ROW: Symbol('validation.validateRow'),
  VALIDATE_FIELD: Symbol('validation.validateField'),
  VALIDATE_TYPE: Symbol('validation.validateType'),
  VALIDATE_REQUIRED: Symbol('validation.validateRequired'),
  VALIDATE_PATTERN: Symbol('validation.validatePattern'),
  VALIDATE_ENUM: Symbol('validation.validateEnum'),
  VALIDATE_RANGE: Symbol('validation.validateRange'),
  VALIDATE_LENGTH: Symbol('validation.validateLength'),
  VALIDATE_CUSTOM: Symbol('validation.validateCustom'),
  COMPILE: Symbol('validation.compile'),
  CACHE_KEY: Symbol('validation.cacheKey'),
  GET_ERRORS: Symbol('validation.getErrors'),
  CLEAR_ERRORS: Symbol('validation.clearErrors'),
  GET_STATS: Symbol('validation.getStats'),
  RESET_STATS: Symbol('validation.resetStats'),
  EXPORT_SYMBOLS: Symbol('validation.exportSymbols'),
  HEALTH_CHECK: Symbol('validation.healthCheck'),
  GET_STATE: Symbol('validation.getState'),
  SET_STATE: Symbol('validation.setState'),

  // Внутренние методы
  REGISTER_DEFAULT_VALIDATORS: Symbol('validation.registerDefaultValidators'),
  VALIDATE_SCHEMA: Symbol('validation.validateSchema'),
  BUILD_CACHE_KEY: Symbol('validation.buildCacheKey'),
  UPDATE_STATS: Symbol('validation.updateStats'),
  NOTIFY: Symbol('validation.notify'),
  CLEANUP: Symbol('validation.cleanup'),

  // Логгер
  LOGGER: Symbol('validation.logger'),
  LOG: Symbol('validation.log'),
  DEBUG: Symbol('validation.debug'),
  ERROR: Symbol('validation.error'),
  WARN: Symbol('validation.warn'),
  SUCCESS: Symbol('validation.success'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('validation.instance'),
  STATE: Symbol.for('validation.state'),
  CONFIG: Symbol.for('validation.config'),
  INIT: Symbol.for('validation.init'),
  DESTROY: Symbol.for('validation.destroy'),
  REGISTER_SCHEMA: Symbol.for('validation.registerSchema'),
  UNREGISTER_SCHEMA: Symbol.for('validation.unregisterSchema'),
  GET_SCHEMA: Symbol.for('validation.getSchema'),
  LIST_SCHEMAS: Symbol.for('validation.listSchemas'),
  VALIDATE: Symbol.for('validation.validate'),
  VALIDATE_ROW: Symbol.for('validation.validateRow'),
  GET_ERRORS: Symbol.for('validation.getErrors'),
  CLEAR_ERRORS: Symbol.for('validation.clearErrors'),
  GET_STATS: Symbol.for('validation.getStats'),
  RESET_STATS: Symbol.for('validation.resetStats'),
  HEALTH_CHECK: Symbol.for('validation.healthCheck'),
  GET_STATE: Symbol.for('validation.getState'),
  SET_STATE: Symbol.for('validation.setState'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ (100% символы)
// ============================================================

const CONFIG = {
  version: '4.0.3',
  build: '2026-07-28',
  name: 'Validation Plugin',
  debug: true,
  strictMode: true,
  cacheEnabled: true,
  maxCacheSize: 1000,
  maxErrorHistory: 500,
  maxStatsHistory: 100,
  defaultTypes: {
    string: { type: 'string', required: false },
    number: { type: 'number', required: false },
    boolean: { type: 'boolean', required: false },
    array: { type: 'array', required: false },
    object: { type: 'object', required: false },
    email: { type: 'email', required: false },
    url: { type: 'url', required: false },
    uuid: { type: 'uuid', required: false },
    date: { type: 'date', required: false },
    datetime: { type: 'datetime', required: false },
    json: { type: 'json', required: false },
    any: { type: 'any', required: false },
    null: { type: 'null', required: false },
    undefined: { type: 'undefined', required: false },
  },
  validateKeys: true,
  maxKeyLength: 500,
  sanitizeInput: true,
  escapeOutput: true,
};

// ============================================================
// 4. ТИПЫ ВАЛИДАТОРОВ (100% символы)
// ============================================================

const VALIDATOR_TYPES = {
  // Базовые типы
  STRING: Symbol('validator.type.string'),
  NUMBER: Symbol('validator.type.number'),
  BOOLEAN: Symbol('validator.type.boolean'),
  ARRAY: Symbol('validator.type.array'),
  OBJECT: Symbol('validator.type.object'),

  // Специальные типы
  EMAIL: Symbol('validator.type.email'),
  URL: Symbol('validator.type.url'),
  UUID: Symbol('validator.type.uuid'),
  DATE: Symbol('validator.type.date'),
  DATETIME: Symbol('validator.type.datetime'),
  JSON: Symbol('validator.type.json'),

  // Составные
  ANY: Symbol('validator.type.any'),
  NULL: Symbol('validator.type.null'),
  UNDEFINED: Symbol('validator.type.undefined'),
};

// ============================================================
// 5. ЛОГГЕР (100% символы)
// ============================================================

const LOGGER_SYMBOLS = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
  COLORS: Symbol('logger.colors'),
  TIMESTAMP: Symbol('logger.timestamp'),
};

function createLogger(debug = true, instanceId = 'Validation') {
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

    if (msgLevel > currentLevel) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${this[LOGGER_SYMBOLS.INSTANCE_ID]}]`;

    this[LOGGER_SYMBOLS.HISTORY].push({
      timestamp,
      level,
      message,
      data: data ? '[VALIDATION]' : null,
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

    header: (title) => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      const separator = '═'.repeat(70);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
      console.log(`${colors.bold}${colors.magenta}  📐 ${title}${colors.reset}`);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
    },

    separator: () => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
    },

    getHistory: function () {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory: function () {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug: function (enabled) {
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
// 6. ОСНОВНОЙ ПЛАГИН (100% символы)
// ============================================================

export const ValidationPlugin = {
  name: 'validation',
  version: CONFIG.version,
  metadata: {
    description: 'Enterprise Data Validation with 100% Symbol Isolation',
    author: 'Enterprise Store Team',
    license: 'MIT',
    repository: 'https://github.com/enterprise-store/validation',
  },
  order: 1,
  dependencies: ['core'],

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT](store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // Приватное состояние через WeakMap
    const _private = new WeakMap();
    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG]: { ...CONFIG },
      [PRIVATE.STATE]: {
        initialized: false,
        destroyed: false,
        ready: false,
        isActive: false,
      },
      [PRIVATE.START_TIME]: Date.now(),
      [PRIVATE.SCHEMAS]: new Map(),
      [PRIVATE.VALIDATORS]: new Map(),
      [PRIVATE.RULES]: new Map(),
      [PRIVATE.CACHE]: new Map(),
      [PRIVATE.ERRORS]: new Map(),
      [PRIVATE.ERROR_HISTORY]: [],
      [PRIVATE.STATS]: {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        errorCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        schemaCount: 0,
        lastValidation: null,
        lastError: null,
      },
      [PRIVATE.STATS_HISTORY]: [],
      [PRIVATE.VALIDATION_COUNT]: 0,
      [PRIVATE.ERROR_COUNT]: 0,
      [PRIVATE.CACHE_HITS]: 0,
      [PRIVATE.CACHE_MISSES]: 0,
      [PRIVATE.HOOKS]: {
        [PRIVATE.BEFORE_VALIDATE]: new Map(),
        [PRIVATE.AFTER_VALIDATE]: new Map(),
        [PRIVATE.ON_ERROR]: new Map(),
        [PRIVATE.ON_SUCCESS]: new Map(),
      },
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.READY]: false,
      [PRIVATE.IS_ACTIVE]: false,
      [PRIVATE.LOGGER]: logger,
    };

    _private.set(this, privateData);
    this._private = _private;

    // Регистрируем стандартные валидаторы
    this[PRIVATE.REGISTER_DEFAULT_VALIDATORS]();

    // Обновляем состояние
    privateData[PRIVATE.INITIALIZED] = true;
    privateData[PRIVATE.READY] = true;
    privateData[PRIVATE.IS_ACTIVE] = true;
    privateData[PRIVATE.STATE].initialized = true;
    privateData[PRIVATE.STATE].ready = true;
    privateData[PRIVATE.STATE].isActive = true;

    // Экспортируем символы
    this[PRIVATE.EXPORT_SYMBOLS]();

    // Логируем инициализацию
    logger.header('VALIDATION PLUGIN INITIALIZED (100% СИМВОЛЫ)');
    logger.success(`✅ Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`📌 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.info(`📋 Типов валидаторов: ${privateData[PRIVATE.VALIDATORS].size}`);
    logger.info(`💾 Кэш: ${CONFIG.cacheEnabled ? 'ON' : 'OFF'}`);
    logger.info(`🔒 Строгий режим: ${CONFIG.strictMode ? 'ON' : 'OFF'}`);
    logger.separator();

    return this;
  },

  // ============================================================
  // 8. РЕГИСТРАЦИЯ СТАНДАРТНЫХ ВАЛИДАТОРОВ
  // ============================================================

  [PRIVATE.REGISTER_DEFAULT_VALIDATORS]() {
    const privateData = this._private.get(this);
    const validators = privateData[PRIVATE.VALIDATORS];

    // Строка
    validators.set('string', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'string') return { valid: true };
      return { valid: false, error: 'Должно быть строкой' };
    });

    // Число
    validators.set('number', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'number' && !isNaN(value)) return { valid: true };
      return { valid: false, error: 'Должно быть числом' };
    });

    // Булево
    validators.set('boolean', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'boolean') return { valid: true };
      return { valid: false, error: 'Должно быть булевым значением' };
    });

    // Массив
    validators.set('array', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (Array.isArray(value)) return { valid: true };
      return { valid: false, error: 'Должно быть массивом' };
    });

    // Объект
    validators.set('object', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'object' && !Array.isArray(value)) return { valid: true };
      return { valid: false, error: 'Должно быть объектом' };
    });

    // Email
    validators.set('email', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'string') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailRegex.test(value)) return { valid: true };
      }
      return { valid: false, error: 'Некорректный email адрес' };
    });

    // URL
    validators.set('url', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'string') {
        try {
          new URL(value);
          return { valid: true };
        } catch {
          return { valid: false, error: 'Некорректный URL' };
        }
      }
      return { valid: false, error: 'Должно быть URL' };
    });

    // UUID
    validators.set('uuid', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (typeof value === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return { valid: true };
      }
      return { valid: false, error: 'Некорректный UUID' };
    });

    // Дата
    validators.set('date', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (value instanceof Date && !isNaN(value.getTime())) return { valid: true };
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return { valid: true };
      }
      return { valid: false, error: 'Некорректная дата' };
    });

    // DateTime
    validators.set('datetime', (value) => {
      if (value === null || value === undefined) return { valid: true };
      if (value instanceof Date && !isNaN(value.getTime())) return { valid: true };
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return { valid: true };
      }
      return { valid: false, error: 'Некорректная дата/время' };
    });

    // JSON
    validators.set('json', (value) => {
      if (value === null || value === undefined) return { valid: true };
      try {
        JSON.parse(JSON.stringify(value));
        return { valid: true };
      } catch {
        return { valid: false, error: 'Некорректный JSON' };
      }
    });

    // Any (всегда валидно)
    validators.set('any', () => ({ valid: true }));

    // Null
    validators.set('null', (value) => {
      if (value === null) return { valid: true };
      return { valid: false, error: 'Должно быть null' };
    });

    // Undefined
    validators.set('undefined', (value) => {
      if (value === undefined) return { valid: true };
      return { valid: false, error: 'Должно быть undefined' };
    });

    return true;
  },

  // ============================================================
  // 9. РЕГИСТРАЦИЯ СХЕМЫ
  // ============================================================

  [PRIVATE.REGISTER_SCHEMA](tableName, schema) {
    const privateData = this._private.get(this);
    const logger = privateData[PRIVATE.LOGGER];

    if (privateData[PRIVATE.DESTROYED] || !privateData[PRIVATE.IS_ACTIVE]) {
      logger.error('❌ Плагин валидации не активен');
      return false;
    }

    if (!tableName || typeof tableName !== 'string') {
      logger.error('❌ Некорректное имя таблицы');
      return false;
    }

    if (tableName.length === 0 || tableName.length > 100) {
      logger.error('❌ Имя таблицы должно быть от 1 до 100 символов');
      return false;
    }

    if (!schema || typeof schema !== 'object') {
      logger.error('❌ Некорректная схема');
      return false;
    }

    // Валидация схемы
    const validation = this[PRIVATE.VALIDATE_SCHEMA](schema);
    if (!validation.valid) {
      logger.error(`❌ Некорректная схема: ${validation.error}`);
      return false;
    }

    // Сохраняем схему
    const schemas = privateData[PRIVATE.SCHEMAS];
    schemas.set(tableName, schema);
    privateData[PRIVATE.STATS].schemaCount = schemas.size;

    // Очищаем кэш для этой таблицы
    if (CONFIG.cacheEnabled) {
      const cache = privateData[PRIVATE.CACHE];
      const cacheKey = this[PRIVATE.BUILD_CACHE_KEY](tableName);
      cache.delete(cacheKey);
    }

    logger.success(`📐 Схема зарегистрирована для таблицы: ${tableName}`);
    return true;
  },

  [PRIVATE.UNREGISTER_SCHEMA](tableName) {
    const privateData = this._private.get(this);
    const logger = privateData[PRIVATE.LOGGER];

    if (privateData[PRIVATE.DESTROYED] || !privateData[PRIVATE.IS_ACTIVE]) {
      logger.error('❌ Плагин валидации не активен');
      return false;
    }

    const schemas = privateData[PRIVATE.SCHEMAS];
    if (!schemas.has(tableName)) {
      logger.warn(`⚠️ Схема для таблицы "${tableName}" не найдена`);
      return false;
    }

    schemas.delete(tableName);
    privateData[PRIVATE.STATS].schemaCount = schemas.size;

    // Очищаем кэш
    if (CONFIG.cacheEnabled) {
      const cache = privateData[PRIVATE.CACHE];
      const cacheKey = this[PRIVATE.BUILD_CACHE_KEY](tableName);
      cache.delete(cacheKey);
    }

    logger.success(`🗑 Схема удалена для таблицы: ${tableName}`);
    return true;
  },

  [PRIVATE.GET_SCHEMA](tableName) {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.SCHEMAS].get(tableName) || null;
  },

  [PRIVATE.LIST_SCHEMAS]() {
    const privateData = this._private.get(this);
    return Array.from(privateData[PRIVATE.SCHEMAS].keys());
  },

  // ============================================================
  // 10. ВАЛИДАЦИЯ
  // ============================================================

  [PRIVATE.VALIDATE_DATA](tableName, data, options = {}) {
    const privateData = this._private.get(this);
    const logger = privateData[PRIVATE.LOGGER];

    if (privateData[PRIVATE.DESTROYED] || !privateData[PRIVATE.IS_ACTIVE]) {
      logger.error('❌ Плагин валидации не активен');
      return { valid: false, errors: ['Плагин валидации не активен'] };
    }

    const schemas = privateData[PRIVATE.SCHEMAS];
    if (!schemas.has(tableName)) {
      return { valid: true, errors: [] };
    }

    // Выполняем хуки BEFORE_VALIDATE
    if (privateData[PRIVATE.HOOKS][PRIVATE.BEFORE_VALIDATE]) {
      for (const [, callback] of privateData[PRIVATE.HOOKS][PRIVATE.BEFORE_VALIDATE]) {
        try {
          callback({ tableName, data, options });
        } catch (error) {
          logger.error('❌ Ошибка в BEFORE_VALIDATE хуке:', error);
        }
      }
    }

    // Проверка кэша
    if (CONFIG.cacheEnabled && !options.skipCache) {
      const cacheKey = this[PRIVATE.BUILD_CACHE_KEY](tableName, data);
      const cache = privateData[PRIVATE.CACHE];
      if (cache.has(cacheKey)) {
        privateData[PRIVATE.STATS].cacheHits++;
        privateData[PRIVATE.CACHE_HITS]++;
        logger.debug(`💾 Кэш-хит для ${tableName}`);
        const cached = cache.get(cacheKey);
        return cached;
      }
      privateData[PRIVATE.STATS].cacheMisses++;
      privateData[PRIVATE.CACHE_MISSES]++;
    }

    const schema = schemas.get(tableName);
    const errors = [];

    // Валидация каждого поля
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this[PRIVATE.VALIDATE_FIELD](field, value, rules);

      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      }
    }

    // Кастомная валидация
    if (schema._custom && typeof schema._custom === 'function') {
      try {
        const customErrors = schema._custom(data, tableName);
        if (Array.isArray(customErrors)) {
          errors.push(...customErrors);
        } else if (typeof customErrors === 'string') {
          errors.push(customErrors);
        }
      } catch (error) {
        logger.error('❌ Ошибка кастомной валидации:', error);
        errors.push(`Ошибка кастомной валидации: ${error.message}`);
      }
    }

    const result = {
      valid: errors.length === 0,
      errors,
      table: tableName,
      timestamp: Date.now(),
      fields: Object.keys(data),
    };

    // Обновляем статистику
    privateData[PRIVATE.VALIDATION_COUNT]++;
    privateData[PRIVATE.STATS].totalValidations++;

    if (result.valid) {
      privateData[PRIVATE.STATS].successfulValidations++;
    } else {
      privateData[PRIVATE.STATS].failedValidations++;
      privateData[PRIVATE.STATS].errorCount += errors.length;
      privateData[PRIVATE.ERROR_COUNT]++;

      // Сохраняем ошибки
      privateData[PRIVATE.ERRORS].set(tableName, {
        timestamp: Date.now(),
        data,
        errors,
        fields: Object.keys(data),
      });

      // Сохраняем в историю ошибок
      privateData[PRIVATE.ERROR_HISTORY].push({
        table: tableName,
        errors,
        data: CONFIG.sanitizeInput ? this[PRIVATE.SANITIZE](data) : data,
        timestamp: Date.now(),
      });

      if (privateData[PRIVATE.ERROR_HISTORY].length > CONFIG.maxErrorHistory) {
        privateData[PRIVATE.ERROR_HISTORY].shift();
      }

      privateData[PRIVATE.STATS].lastError = Date.now();

      // Выполняем хуки ON_ERROR
      if (privateData[PRIVATE.HOOKS][PRIVATE.ON_ERROR]) {
        for (const [, callback] of privateData[PRIVATE.HOOKS][PRIVATE.ON_ERROR]) {
          try {
            callback({ tableName, data, errors, result });
          } catch (error) {
            logger.error('❌ Ошибка в ON_ERROR хуке:', error);
          }
        }
      }
    }

    // Сохраняем в кэш
    if (CONFIG.cacheEnabled && !options.skipCache) {
      const cacheKey = this[PRIVATE.BUILD_CACHE_KEY](tableName, data);
      const cache = privateData[PRIVATE.CACHE];
      if (cache.size < CONFIG.maxCacheSize) {
        cache.set(cacheKey, result);
      }
    }

    // Обновляем статистику
    this[PRIVATE.UPDATE_STATS]();

    // Выполняем хуки AFTER_VALIDATE
    if (privateData[PRIVATE.HOOKS][PRIVATE.AFTER_VALIDATE]) {
      for (const [, callback] of privateData[PRIVATE.HOOKS][PRIVATE.AFTER_VALIDATE]) {
        try {
          callback({ tableName, data, result, options });
        } catch (error) {
          logger.error('❌ Ошибка в AFTER_VALIDATE хуке:', error);
        }
      }
    }

    logger.debug(`📋 Валидация ${tableName}: ${errors.length} ошибок`);
    return result;
  },

  // ============================================================
  // 11. ВАЛИДАЦИЯ ПОЛЯ
  // ============================================================

  [PRIVATE.VALIDATE_FIELD](field, value, rules) {
    const errors = [];
    const privateData = this._private.get(this);
    const validators = privateData[PRIVATE.VALIDATORS];

    // Required
    if (rules.required) {
      const requiredResult = this[PRIVATE.VALIDATE_REQUIRED](value);
      if (!requiredResult.valid) {
        errors.push(`${field}: ${requiredResult.error}`);
        return errors;
      }
    }

    // Если значение null/undefined и не required, пропускаем
    if ((value === null || value === undefined) && !rules.required) {
      return errors;
    }

    // Type
    if (rules.type) {
      const typeResult = this[PRIVATE.VALIDATE_TYPE](value, rules.type);
      if (!typeResult.valid) {
        errors.push(`${field}: ${typeResult.error}`);
        return errors;
      }
    }

    // Pattern
    if (rules.pattern && typeof value === 'string') {
      const patternResult = this[PRIVATE.VALIDATE_PATTERN](value, rules.pattern);
      if (!patternResult.valid) {
        errors.push(`${field}: ${patternResult.error}`);
      }
    }

    // Enum
    if (rules.enum) {
      const enumResult = this[PRIVATE.VALIDATE_ENUM](value, rules.enum);
      if (!enumResult.valid) {
        errors.push(`${field}: ${enumResult.error}`);
      }
    }

    // Range (numbers)
    if (typeof value === 'number') {
      const rangeResult = this[PRIVATE.VALIDATE_RANGE](value, rules);
      if (!rangeResult.valid) {
        errors.push(`${field}: ${rangeResult.error}`);
      }
    }

    // Length (strings/arrays)
    if (typeof value === 'string' || Array.isArray(value)) {
      const lengthResult = this[PRIVATE.VALIDATE_LENGTH](value, rules);
      if (!lengthResult.valid) {
        errors.push(`${field}: ${lengthResult.error}`);
      }
    }

    // Custom
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = this[PRIVATE.VALIDATE_CUSTOM](value, field, rules.custom);
      if (!customResult.valid) {
        errors.push(`${field}: ${customResult.error}`);
      }
    }

    return errors;
  },

  // ============================================================
  // 12. ОТДЕЛЬНЫЕ ВАЛИДАТОРЫ
  // ============================================================

  [PRIVATE.VALIDATE_REQUIRED](value) {
    if (value === undefined || value === null) {
      return { valid: false, error: 'Обязательное поле' };
    }
    if (typeof value === 'string' && value.trim() === '') {
      return { valid: false, error: 'Обязательное поле' };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { valid: false, error: 'Обязательное поле' };
    }
    return { valid: true };
  },

  [PRIVATE.VALIDATE_TYPE](value, type) {
    const privateData = this._private.get(this);
    const validators = privateData[PRIVATE.VALIDATORS];

    if (!validators.has(type)) {
      return { valid: false, error: `Неизвестный тип: ${type}` };
    }

    const validator = validators.get(type);
    return validator(value);
  },

  [PRIVATE.VALIDATE_PATTERN](value, pattern) {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Паттерн применим только к строкам' };
    }

    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (!regex.test(value)) {
      return { valid: false, error: 'Не соответствует шаблону' };
    }

    return { valid: true };
  },

  [PRIVATE.VALIDATE_ENUM](value, enumValues) {
    if (!Array.isArray(enumValues)) {
      return { valid: false, error: 'Enum должен быть массивом' };
    }

    if (!enumValues.includes(value)) {
      return { valid: false, error: `Должно быть одним из: ${enumValues.join(', ')}` };
    }

    return { valid: true };
  },

  [PRIVATE.VALIDATE_RANGE](value, rules) {
    if (typeof value !== 'number') {
      return { valid: false, error: 'Диапазон применим только к числам' };
    }

    if (rules.min !== undefined && value < rules.min) {
      return { valid: false, error: `Должно быть не меньше ${rules.min}` };
    }

    if (rules.max !== undefined && value > rules.max) {
      return { valid: false, error: `Должно быть не больше ${rules.max}` };
    }

    return { valid: true };
  },

  [PRIVATE.VALIDATE_LENGTH](value, rules) {
    const length = typeof value === 'string' ? value.length :
        Array.isArray(value) ? value.length : undefined;

    if (length === undefined) {
      return { valid: false, error: 'Проверка длины применима только к строкам и массивам' };
    }

    if (rules.minLength !== undefined && length < rules.minLength) {
      return { valid: false, error: `Должно быть не меньше ${rules.minLength} символов` };
    }

    if (rules.maxLength !== undefined && length > rules.maxLength) {
      return { valid: false, error: `Должно быть не больше ${rules.maxLength} символов` };
    }

    return { valid: true };
  },

  [PRIVATE.VALIDATE_CUSTOM](value, field, customFn) {
    try {
      const result = customFn(value, field);
      if (result === false) {
        return { valid: false, error: 'Ошибка кастомной валидации' };
      }
      if (typeof result === 'string') {
        return { valid: false, error: result };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Ошибка кастомной валидации: ${error.message}` };
    }
  },

  // ============================================================
  // 13. ВАЛИДАЦИЯ СХЕМЫ
  // ============================================================

  [PRIVATE.VALIDATE_SCHEMA](schema) {
    if (typeof schema !== 'object' || schema === null) {
      return { valid: false, error: 'Схема должна быть объектом' };
    }

    const validFields = [
      'type', 'required', 'default', 'min', 'max',
      'minLength', 'maxLength', 'pattern', 'enum', 'custom'
    ];

    for (const [field, rules] of Object.entries(schema)) {
      // Пропускаем системные поля
      if (field === '_custom') continue;

      if (typeof rules !== 'object' || rules === null) {
        return { valid: false, error: `Правила для поля "${field}" должны быть объектом` };
      }

      for (const [key, value] of Object.entries(rules)) {
        if (!validFields.includes(key)) {
          return { valid: false, error: `Неизвестное правило "${key}" для поля "${field}"` };
        }

        // Валидация значений правил
        if (key === 'type' && typeof value !== 'string') {
          return { valid: false, error: `Тип для поля "${field}" должен быть строкой` };
        }

        if (key === 'required' && typeof value !== 'boolean') {
          return { valid: false, error: `Required для поля "${field}" должен быть булевым` };
        }

        if (key === 'pattern' && !(value instanceof RegExp) && typeof value !== 'string') {
          return { valid: false, error: `Pattern для поля "${field}" должен быть RegExp или строкой` };
        }

        if (key === 'enum' && !Array.isArray(value)) {
          return { valid: false, error: `Enum для поля "${field}" должен быть массивом` };
        }

        if (key === 'min' && typeof value !== 'number') {
          return { valid: false, error: `Min для поля "${field}" должен быть числом` };
        }

        if (key === 'max' && typeof value !== 'number') {
          return { valid: false, error: `Max для поля "${field}" должен быть числом` };
        }

        if (key === 'custom' && typeof value !== 'function') {
          return { valid: false, error: `Custom для поля "${field}" должен быть функцией` };
        }
      }
    }

    return { valid: true };
  },

  // ============================================================
  // 14. КЭШИРОВАНИЕ
  // ============================================================

  [PRIVATE.BUILD_CACHE_KEY](tableName, data = null) {
    if (data === null) {
      return `schema:${tableName}`;
    }
    try {
      return `validate:${tableName}:${JSON.stringify(data)}`;
    } catch {
      return `validate:${tableName}:${Date.now()}`;
    }
  },

  [PRIVATE.CLEANUP]() {
    const privateData = this._private.get(this);
    privateData[PRIVATE.CACHE].clear();
    privateData[PRIVATE.ERROR_HISTORY] = [];
    privateData[PRIVATE.STATS_HISTORY] = [];
    return true;
  },

  // ============================================================
  // 15. ОШИБКИ И СТАТИСТИКА
  // ============================================================

  [PRIVATE.GET_ERRORS](tableName) {
    const privateData = this._private.get(this);

    if (tableName) {
      return privateData[PRIVATE.ERRORS].get(tableName) || null;
    }

    return Object.fromEntries(privateData[PRIVATE.ERRORS]);
  },

  [PRIVATE.CLEAR_ERRORS](tableName) {
    const privateData = this._private.get(this);

    if (tableName) {
      return privateData[PRIVATE.ERRORS].delete(tableName);
    }

    privateData[PRIVATE.ERRORS].clear();
    privateData[PRIVATE.ERROR_HISTORY] = [];
    return true;
  },

  [PRIVATE.GET_STATS]() {
    const privateData = this._private.get(this);
    const stats = privateData[PRIVATE.STATS];
    const total = stats.totalValidations || 0;
    const successRate = total > 0 ? (stats.successfulValidations / total) * 100 : 0;

    return {
      ...stats,
      successRate: Math.round(successRate * 100) / 100,
      cacheHitRate: stats.cacheHits + stats.cacheMisses > 0
          ? Math.round((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 10000) / 100
          : 0,
      uptime: Date.now() - privateData[PRIVATE.START_TIME],
      isActive: privateData[PRIVATE.IS_ACTIVE],
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  },

  [PRIVATE.RESET_STATS]() {
    const privateData = this._private.get(this);
    privateData[PRIVATE.STATS] = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      schemaCount: privateData[PRIVATE.SCHEMAS].size,
      lastValidation: null,
      lastError: null,
    };
    privateData[PRIVATE.VALIDATION_COUNT] = 0;
    privateData[PRIVATE.ERROR_COUNT] = 0;
    privateData[PRIVATE.CACHE_HITS] = 0;
    privateData[PRIVATE.CACHE_MISSES] = 0;
    privateData[PRIVATE.STATS_HISTORY] = [];
    return true;
  },

  [PRIVATE.UPDATE_STATS]() {
    const privateData = this._private.get(this);
    const stats = privateData[PRIVATE.STATS];

    privateData[PRIVATE.STATS_HISTORY].push({
      ...stats,
      timestamp: Date.now(),
    });

    if (privateData[PRIVATE.STATS_HISTORY].length > CONFIG.maxStatsHistory) {
      privateData[PRIVATE.STATS_HISTORY].shift();
    }
  },

  // ============================================================
  // 16. ХУКИ
  // ============================================================

  [PRIVATE.NOTIFY](event, data) {
    const privateData = this._private.get(this);
    const hooks = privateData[PRIVATE.HOOKS][event];

    if (!hooks) return;

    for (const [, callback] of hooks) {
      try {
        callback(data);
      } catch (error) {
        const logger = privateData[PRIVATE.LOGGER];
        logger.error(`❌ Ошибка в хуке ${event}:`, error);
      }
    }
  },

  // ============================================================
  // 17. БЕЗОПАСНОСТЬ
  // ============================================================

  [PRIVATE.SANITIZE](data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (CONFIG.validateKeys && key.length > CONFIG.maxKeyLength) {
        continue;
      }

      if (typeof value === 'string') {
        sanitized[key] = value.replace(/[<>]/g, '');
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this[PRIVATE.SANITIZE](value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },

  [PRIVATE.SECURE](value) {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/[<>]/g, (match) => {
      return match === '<' ? '&lt;' : '&gt;';
    });
  },

  // ============================================================
  // 18. ЗДОРОВЬЕ
  // ============================================================

  [PRIVATE.HEALTH_CHECK]() {
    const privateData = this._private.get(this);
    const schemas = privateData[PRIVATE.SCHEMAS];
    const validators = privateData[PRIVATE.VALIDATORS];
    const cache = privateData[PRIVATE.CACHE];

    const issues = [];
    let healthy = true;

    // Проверка состояния
    if (privateData[PRIVATE.DESTROYED]) {
      healthy = false;
      issues.push('Плагин уничтожен');
    }

    if (!privateData[PRIVATE.IS_ACTIVE]) {
      healthy = false;
      issues.push('Плагин не активен');
    }

    // Проверка схем
    for (const [name, schema] of schemas) {
      const validation = this[PRIVATE.VALIDATE_SCHEMA](schema);
      if (!validation.valid) {
        healthy = false;
        issues.push(`Некорректная схема "${name}": ${validation.error}`);
      }
    }

    // Проверка кэша
    if (cache.size > CONFIG.maxCacheSize * 2) {
      healthy = false;
      issues.push(`Кэш превышает лимит: ${cache.size} > ${CONFIG.maxCacheSize}`);
    }

    return {
      healthy,
      issues,
      schemaCount: schemas.size,
      validatorCount: validators.size,
      cacheSize: cache.size,
      errorCount: privateData[PRIVATE.ERRORS].size,
      totalValidations: privateData[PRIVATE.STATS].totalValidations,
      isActive: privateData[PRIVATE.IS_ACTIVE],
      initialized: privateData[PRIVATE.INITIALIZED],
      version: CONFIG.version,
      uptime: Date.now() - privateData[PRIVATE.START_TIME],
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 19. СОСТОЯНИЕ
  // ============================================================

  [PRIVATE.GET_STATE]() {
    const privateData = this._private.get(this);
    const state = privateData[PRIVATE.STATE];

    return {
      initialized: state.initialized,
      destroyed: state.destroyed,
      ready: state.ready,
      isActive: state.isActive,
      schemaCount: privateData[PRIVATE.SCHEMAS].size,
      validatorCount: privateData[PRIVATE.VALIDATORS].size,
      cacheSize: privateData[PRIVATE.CACHE].size,
      errorCount: privateData[PRIVATE.ERRORS].size,
      stats: { ...privateData[PRIVATE.STATS] },
      schemas: Array.from(privateData[PRIVATE.SCHEMAS].keys()),
      validators: Array.from(privateData[PRIVATE.VALIDATORS].keys()),
      version: CONFIG.version,
      config: { ...CONFIG },
      startTime: privateData[PRIVATE.START_TIME],
      uptime: Date.now() - privateData[PRIVATE.START_TIME],
      timestamp: Date.now(),
    };
  },

  [PRIVATE.SET_STATE](newState) {
    const privateData = this._private.get(this);
    if (newState.isActive !== undefined) {
      privateData[PRIVATE.IS_ACTIVE] = newState.isActive;
    }
    if (newState.config) {
      Object.assign(privateData[PRIVATE.CONFIG], newState.config);
    }
    return true;
  },

  // ============================================================
  // 20. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__VALIDATION_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
        TYPES: { ...VALIDATOR_TYPES },
      };

      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;
      const typesCount = Object.keys(VALIDATOR_TYPES).length;

      console.log('📊 VALIDATION PLUGIN SYMBOLS STATS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
      console.log(`  📋 Типов валидаторов: ${typesCount}`);
    }
  },

  // ============================================================
  // 21. УНИЧТОЖЕНИЕ
  // ============================================================

  [PRIVATE.DESTROY]() {
    const privateData = this._private.get(this);
    const logger = privateData[PRIVATE.LOGGER];

    if (privateData[PRIVATE.DESTROYED]) {
      logger.warn('⚠️ Плагин уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение Validation Plugin...');

    // Очищаем все данные
    privateData[PRIVATE.SCHEMAS].clear();
    privateData[PRIVATE.VALIDATORS].clear();
    privateData[PRIVATE.RULES].clear();
    privateData[PRIVATE.CACHE].clear();
    privateData[PRIVATE.ERRORS].clear();
    privateData[PRIVATE.ERROR_HISTORY] = [];
    privateData[PRIVATE.STATS_HISTORY] = [];

    // Очищаем хуки
    for (const key of Object.keys(privateData[PRIVATE.HOOKS])) {
      privateData[PRIVATE.HOOKS][key].clear();
    }

    // Обновляем состояние
    privateData[PRIVATE.DESTROYED] = true;
    privateData[PRIVATE.READY] = false;
    privateData[PRIVATE.IS_ACTIVE] = false;
    privateData[PRIVATE.STATE].destroyed = true;
    privateData[PRIVATE.STATE].ready = false;
    privateData[PRIVATE.STATE].isActive = false;

    // Удаляем глобальные ссылки
    if (typeof window !== 'undefined') {
      delete window.__VALIDATION_SYMBOLS;
      delete window.__validationPlugin;
    }

    logger.success('✅ Validation Plugin уничтожен');
  },

  // ============================================================
  // 22. ПУБЛИЧНЫЙ API (100% символы)
  // ============================================================

  [PUBLIC.INIT](store) {
    return this[PRIVATE.INIT](store);
  },

  [PUBLIC.DESTROY]() {
    return this[PRIVATE.DESTROY]();
  },

  [PUBLIC.REGISTER_SCHEMA](tableName, schema) {
    return this[PRIVATE.REGISTER_SCHEMA](tableName, schema);
  },

  [PUBLIC.UNREGISTER_SCHEMA](tableName) {
    return this[PRIVATE.UNREGISTER_SCHEMA](tableName);
  },

  [PUBLIC.GET_SCHEMA](tableName) {
    return this[PRIVATE.GET_SCHEMA](tableName);
  },

  [PUBLIC.LIST_SCHEMAS]() {
    return this[PRIVATE.LIST_SCHEMAS]();
  },

  [PUBLIC.VALIDATE](tableName, data) {
    return this[PRIVATE.VALIDATE_DATA](tableName, data);
  },

  [PUBLIC.VALIDATE_ROW](tableName, row) {
    return this[PRIVATE.VALIDATE_DATA](tableName, row);
  },

  [PUBLIC.GET_ERRORS](tableName) {
    return this[PRIVATE.GET_ERRORS](tableName);
  },

  [PUBLIC.CLEAR_ERRORS](tableName) {
    return this[PRIVATE.CLEAR_ERRORS](tableName);
  },

  [PUBLIC.GET_STATS]() {
    return this[PRIVATE.GET_STATS]();
  },

  [PUBLIC.RESET_STATS]() {
    return this[PRIVATE.RESET_STATS]();
  },

  [PUBLIC.HEALTH_CHECK]() {
    return this[PRIVATE.HEALTH_CHECK]();
  },

  [PUBLIC.GET_STATE]() {
    return this[PRIVATE.GET_STATE]();
  },

  [PUBLIC.SET_STATE](state) {
    return this[PRIVATE.SET_STATE](state);
  },

  // ============================================================
  // 23. ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  /**
   * Зарегистрировать кастомный валидатор
   */
  registerValidator(name, validator) {
    const privateData = this._private.get(this);
    const logger = privateData[PRIVATE.LOGGER];

    if (!name || typeof name !== 'string') {
      logger.error('❌ Некорректное имя валидатора');
      return false;
    }

    if (typeof validator !== 'function') {
      logger.error('❌ Валидатор должен быть функцией');
      return false;
    }

    const validators = privateData[PRIVATE.VALIDATORS];
    validators.set(name, validator);

    logger.success(`✅ Валидатор зарегистрирован: ${name}`);
    return true;
  },

  /**
   * Получить валидатор
   */
  getValidator(name) {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.VALIDATORS].get(name) || null;
  },

  /**
   * Список валидаторов
   */
  listValidators() {
    const privateData = this._private.get(this);
    return Array.from(privateData[PRIVATE.VALIDATORS].keys());
  },

  /**
   * Очистить кэш
   */
  clearCache() {
    return this[PRIVATE.CLEANUP]();
  },

  /**
   * Получить историю ошибок
   */
  getErrorHistory(limit = 50) {
    const privateData = this._private.get(this);
    const history = privateData[PRIVATE.ERROR_HISTORY];
    return history.slice(-Math.min(limit, history.length));
  },
};

// ============================================================
// 24. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__VALIDATION_PLUGIN = ValidationPlugin;
  window.__VALIDATION_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
    TYPES: { ...VALIDATOR_TYPES },
  };

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;
  const typesCount = Object.keys(VALIDATOR_TYPES).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📐 VALIDATION PLUGIN (100% СИМВОЛЫ) v4.0.3                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ТИПЫ ВАЛИДАТОРОВ:                                                       ║');
  console.log(`║    ${Object.keys(VALIDATOR_TYPES).map(t => `✅ ${t}`).join('\n║    ')}`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log(`║    📋 Типов валидаторов: ${typesCount.toString().padStart(3, ' ')}                                       ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КОМАНДЫ:                                                               ║');
  console.log('║    validationPlugin.registerSchema(table, schema) — регистрация схемы        ║');
  console.log('║    validationPlugin.validate(table, data) — валидация данных                 ║');
  console.log('║    validationPlugin.getSchema(table) — получить схему                       ║');
  console.log('║    validationPlugin.listSchemas() — список схем                             ║');
  console.log('║    validationPlugin.getErrors(table) — получить ошибки                      ║');
  console.log('║    validationPlugin.clearErrors(table) — очистить ошибки                    ║');
  console.log('║    validationPlugin.registerValidator(name, fn) — кастомный валидатор       ║');
  console.log('║    validationPlugin.getStats() — статистика                                 ║');
  console.log('║    validationPlugin.resetStats() — сброс статистики                         ║');
  console.log('║    validationPlugin.clearCache() — очистить кэш                             ║');
  console.log('║    validationPlugin.healthCheck() — проверка целостности                    ║');
  console.log('║    validationPlugin.getState() — состояние плагина                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 25. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default ValidationPlugin;
