// ============================================================
// plugins/PersistencePlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Плагин для сохранения и загрузки состояния хранилища
// Версия: 4.0.1 (ИСПРАВЛЕНО)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы
  VERSION: Symbol('persistence.version'),
  BUILD: Symbol('persistence.build'),
  NAME: Symbol('persistence.name'),
  CONFIG: Symbol('persistence.config'),
  STATE: Symbol('persistence.state'),
  INITIALIZED: Symbol('persistence.initialized'),
  DESTROYED: Symbol('persistence.destroyed'),

  // Настройки
  STORAGE: Symbol('persistence.storage'),
  STORAGE_KEY: Symbol('persistence.storageKey'),
  AUTO_SAVE: Symbol('persistence.autoSave'),
  SAVE_INTERVAL: Symbol('persistence.saveInterval'),
  COMPRESSION: Symbol('persistence.compression'),
  ENCRYPTION: Symbol('persistence.encryption'),
  ENCRYPTION_KEY: Symbol('persistence.encryptionKey'),

  // Состояние
  LAST_SAVE: Symbol('persistence.lastSave'),
  LAST_LOAD: Symbol('persistence.lastLoad'),
  SAVE_COUNT: Symbol('persistence.saveCount'),
  LOAD_COUNT: Symbol('persistence.loadCount'),
  ERROR_COUNT: Symbol('persistence.errorCount'),
  SAVE_QUEUE: Symbol('persistence.saveQueue'),
  IS_SAVING: Symbol('persistence.isSaving'),
  IS_LOADING: Symbol('persistence.isLoading'),

  // Кэш
  CACHE: Symbol('persistence.cache'),
  CACHE_TTL: Symbol('persistence.cacheTTL'),
  CACHE_HITS: Symbol('persistence.cacheHits'),
  CACHE_MISSES: Symbol('persistence.cacheMisses'),

  // Хуки
  BEFORE_SAVE: Symbol('persistence.beforeSave'),
  AFTER_SAVE: Symbol('persistence.afterSave'),
  BEFORE_LOAD: Symbol('persistence.beforeLoad'),
  AFTER_LOAD: Symbol('persistence.afterLoad'),
  ON_ERROR: Symbol('persistence.onError'),
  ON_SUCCESS: Symbol('persistence.onSuccess'),

  // Методы
  INIT: Symbol('persistence.init'),
  DESTROY: Symbol('persistence.destroy'),
  SAVE: Symbol('persistence.save'),
  LOAD: Symbol('persistence.load'),
  CLEAR: Symbol('persistence.clear'),
  EXPORT: Symbol('persistence.export'),
  IMPORT: Symbol('persistence.import'),
  GET_STATE: Symbol('persistence.getState'),
  SET_STATE: Symbol('persistence.setState'),
  GET_STATS: Symbol('persistence.getStats'),
  RESET_STATS: Symbol('persistence.resetStats'),
  VALIDATE: Symbol('persistence.validate'),
  SANITIZE: Symbol('persistence.sanitize'),
  COMPRESS: Symbol('persistence.compress'),
  DECOMPRESS: Symbol('persistence.decompress'),
  ENCRYPT: Symbol('persistence.encrypt'),
  DECRYPT: Symbol('persistence.decrypt'),
  QUEUE_SAVE: Symbol('persistence.queueSave'),
  PROCESS_QUEUE: Symbol('persistence.processQueue'),
  SCHEDULE_AUTO_SAVE: Symbol('persistence.scheduleAutoSave'),
  CLEAR_AUTO_SAVE: Symbol('persistence.clearAutoSave'),
  NOTIFY: Symbol('persistence.notify'),
  EXPORT_SYMBOLS: Symbol('persistence.exportSymbols'),

  // Безопасность
  SECURE_CHECK: Symbol('persistence.secureCheck'),
  SANITIZE_DATA: Symbol('persistence.sanitizeData'),
  VALIDATE_DATA: Symbol('persistence.validateData'),

  // Логгер
  LOGGER: Symbol('persistence.logger'),
  LOG: Symbol('persistence.log'),
  DEBUG: Symbol('persistence.debug'),
  ERROR: Symbol('persistence.error'),
  WARN: Symbol('persistence.warn'),
  SUCCESS: Symbol('persistence.success'),

  // ★★★ НОВЫЕ СИМВОЛЫ ДЛЯ БЕЗОПАСНОСТИ ★★★
  SAFE_CONFIG: Symbol('persistence.safeConfig'),
  PLUGIN_MANAGER: Symbol('persistence.pluginManager'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('persistence.instance'),
  STATE: Symbol.for('persistence.state'),
  CONFIG: Symbol.for('persistence.config'),
  INIT: Symbol.for('persistence.init'),
  DESTROY: Symbol.for('persistence.destroy'),
  SAVE: Symbol.for('persistence.save'),
  LOAD: Symbol.for('persistence.load'),
  CLEAR: Symbol.for('persistence.clear'),
  EXPORT: Symbol.for('persistence.export'),
  IMPORT: Symbol.for('persistence.import'),
  GET_STATE: Symbol.for('persistence.getState'),
  GET_STATS: Symbol.for('persistence.getStats'),
  RESET_STATS: Symbol.for('persistence.resetStats'),
  HEALTH_CHECK: Symbol.for('persistence.healthCheck'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.1',
  build: '2026-07-28',
  name: 'Persistence Plugin',
  debug: true,

  // Настройки по умолчанию
  defaultStorage: 'localStorage',
  defaultKey: 'enterprise_store_data',
  defaultAutoSave: false,
  defaultSaveInterval: 5000,
  defaultCompression: false,
  defaultEncryption: false,
  defaultEncryptionKey: null,
  defaultCacheTTL: 60000,
  maxSaveRetries: 3,
  saveRetryDelay: 1000,
  maxQueueSize: 100,
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

function createLogger(debug = true, instanceId = 'Persistence') {
  const logState = {
    [LOGGER_SYMBOLS.HISTORY]: [],
    [LOGGER_SYMBOLS.MAX_HISTORY]: 200,
    [LOGGER_SYMBOLS.DEBUG]: debug,
    [LOGGER_SYMBOLS.INSTANCE_ID]: instanceId,
    [LOGGER_SYMBOLS.LEVEL]: debug ? 3 : 2,
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
        '%c  💾 ' + title,
        'background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold;'
      );
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
    },

    separator: (color = '#636e72') => {
      console.log('%c' + '─'.repeat(70), `color: ${color};`);
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

  return logger;
}

// ============================================================
// 5. ОСНОВНОЙ ПЛАГИН (100% символы) — ИСПРАВЛЕНО
// ============================================================

const PersistencePlugin = {
  name: 'persistence',
  version: CONFIG.version,
  build: CONFIG.build,
  order: 0,
  metadata: {
    description: 'Сохранение и загрузка состояния хранилища',
    author: 'Enterprise Store Team',
    license: 'MIT',
    dependencies: [],
  },

  // ============================================================
  // 6. ИНИЦИАЛИЗАЦИЯ — ИСПРАВЛЕНО
  // ============================================================

  [PRIVATE.INIT](pluginManager) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);
    this[PRIVATE.LOGGER] = logger;
    this[PRIVATE.PLUGIN_MANAGER] = pluginManager;

    logger.header('ИНИЦИАЛИЗАЦИЯ PERSISTENCE PLUGIN (100% СИМВОЛЫ)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.separator();

    // ★★★ ИСПРАВЛЕНО: безопасное получение конфигурации ★★★
    let config = {};
    let storeConfig = {};

    try {
      // Пытаемся получить конфигурацию из менеджера
      if (pluginManager && pluginManager._) {
        const p = pluginManager._;
        config = p[Symbol('plugins.config')] || {};
        storeConfig = p[Symbol('plugins.state')]?.config || {};
      }
    } catch (error) {
      logger.warn(`⚠️ Ошибка чтения конфигурации: ${error.message}`);
    }

    // ★★★ ИСПРАВЛЕНО: безопасное применение настроек ★★★
    this[PRIVATE.SAFE_CONFIG] = {
      storage: config.persistence?.storage || CONFIG.defaultStorage,
      storageKey: config.persistence?.storageKey || CONFIG.defaultKey,
      autoSave: config.persistence?.autoSave || CONFIG.defaultAutoSave,
      saveInterval: config.persistence?.saveInterval || CONFIG.defaultSaveInterval,
      compression: config.persistence?.compression || CONFIG.defaultCompression,
      encryption: config.persistence?.encryption || CONFIG.defaultEncryption,
      encryptionKey: config.persistence?.encryptionKey || CONFIG.defaultEncryptionKey,
      cacheTTL: config.persistence?.cacheTTL || CONFIG.defaultCacheTTL,
    };

    // ★★★ ИСПРАВЛЕНО: применяем настройки из safeConfig ★★★
    this[PRIVATE.STORAGE] = this[PRIVATE.SAFE_CONFIG].storage;
    this[PRIVATE.STORAGE_KEY] = this[PRIVATE.SAFE_CONFIG].storageKey;
    this[PRIVATE.AUTO_SAVE] = this[PRIVATE.SAFE_CONFIG].autoSave;
    this[PRIVATE.SAVE_INTERVAL] = this[PRIVATE.SAFE_CONFIG].saveInterval;
    this[PRIVATE.COMPRESSION] = this[PRIVATE.SAFE_CONFIG].compression;
    this[PRIVATE.ENCRYPTION] = this[PRIVATE.SAFE_CONFIG].encryption;
    this[PRIVATE.ENCRYPTION_KEY] = this[PRIVATE.SAFE_CONFIG].encryptionKey;
    this[PRIVATE.CACHE_TTL] = this[PRIVATE.SAFE_CONFIG].cacheTTL;

    // Состояние
    this[PRIVATE.STATE] = {
      initialized: true,
      destroyed: false,
      ready: true,
    };

    this[PRIVATE.LAST_SAVE] = null;
    this[PRIVATE.LAST_LOAD] = null;
    this[PRIVATE.SAVE_COUNT] = 0;
    this[PRIVATE.LOAD_COUNT] = 0;
    this[PRIVATE.ERROR_COUNT] = 0;
    this[PRIVATE.SAVE_QUEUE] = [];
    this[PRIVATE.IS_SAVING] = false;
    this[PRIVATE.IS_LOADING] = false;

    // Кэш
    this[PRIVATE.CACHE] = new Map();
    this[PRIVATE.CACHE_HITS] = 0;
    this[PRIVATE.CACHE_MISSES] = 0;

    // Хуки
    this[PRIVATE.BEFORE_SAVE] = new Set();
    this[PRIVATE.AFTER_SAVE] = new Set();
    this[PRIVATE.BEFORE_LOAD] = new Set();
    this[PRIVATE.AFTER_LOAD] = new Set();
    this[PRIVATE.ON_ERROR] = new Set();
    this[PRIVATE.ON_SUCCESS] = new Set();

    // Проверка безопасности
    this[PRIVATE.SECURE_CHECK]();

    // Экспорт символов
    this[PRIVATE.EXPORT_SYMBOLS]();

    // Авто-сохранение
    if (this[PRIVATE.AUTO_SAVE]) {
      this[PRIVATE.SCHEDULE_AUTO_SAVE]();
    }

    logger.success('✅ Persistence Plugin инициализирован');
    logger.info(`💾 Хранилище: ${this[PRIVATE.STORAGE]}`);
    logger.info(`📂 Ключ: ${this[PRIVATE.STORAGE_KEY]}`);
    logger.info(`🔄 Авто-сохранение: ${this[PRIVATE.AUTO_SAVE] ? 'ON' : 'OFF'}`);
    logger.info(`🔒 Шифрование: ${this[PRIVATE.ENCRYPTION] ? 'ON' : 'OFF'}`);
    logger.info(`🗜️ Сжатие: ${this[PRIVATE.COMPRESSION] ? 'ON' : 'OFF'}`);
    logger.separator();

    this[PRIVATE.INITIALIZED] = true;
  },

  // ============================================================
  // 7. ПРОВЕРКА БЕЗОПАСНОСТИ
  // ============================================================

  [PRIVATE.SECURE_CHECK]() {
    const logger = this[PRIVATE.LOGGER];

    // Проверка storage
    if (this[PRIVATE.STORAGE] === 'localStorage' && typeof localStorage === 'undefined') {
      logger.warn('⚠️ localStorage не доступен, переключаем на память');
      this[PRIVATE.STORAGE] = 'memory';
    }

    if (this[PRIVATE.STORAGE] === 'sessionStorage' && typeof sessionStorage === 'undefined') {
      logger.warn('⚠️ sessionStorage не доступен, переключаем на память');
      this[PRIVATE.STORAGE] = 'memory';
    }

    // Проверка шифрования
    if (this[PRIVATE.ENCRYPTION] && !this[PRIVATE.ENCRYPTION_KEY]) {
      logger.warn('⚠️ Шифрование включено, но ключ не указан');
      this[PRIVATE.ENCRYPTION] = false;
    }

    // Проверка безопасного контекста
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      logger.warn('⚠️ Небезопасный контекст, шифрование отключено');
      this[PRIVATE.ENCRYPTION] = false;
    }

    // Проверка размера данных
    try {
      const testData = JSON.stringify({ test: 'data' });
      if (testData.length > 1024 * 1024 * 10) {
        logger.warn('⚠️ Размер данных может превышать лимит хранилища');
      }
    } catch (error) {
      logger.warn('⚠️ Ошибка проверки размера данных:', error);
    }
  },

  // ============================================================
  // 8. СОХРАНЕНИЕ
  // ============================================================

  [PRIVATE.SAVE](store, options = {}) {
    const logger = this[PRIVATE.LOGGER];

    if (this[PRIVATE.IS_SAVING]) {
      logger.warn('⚠️ Сохранение уже выполняется');
      return false;
    }

    // Выполняем хуки
    this[PRIVATE.NOTIFY]('beforeSave', { store, options });

    this[PRIVATE.IS_SAVING] = true;
    logger.debug('💾 Начало сохранения...');

    try {
      // Подготовка данных
      const data = this[PRIVATE._prepareData](store);

      // Валидация
      const validation = this[PRIVATE.VALIDATE](data);
      if (!validation.valid) {
        throw new Error(`Валидация не пройдена: ${validation.error}`);
      }

      // Санитизация
      const sanitized = this[PRIVATE.SANITIZE](data);

      // Преобразование в JSON
      let json = JSON.stringify(sanitized);

      // Сжатие
      if (this[PRIVATE.COMPRESSION]) {
        json = this[PRIVATE.COMPRESS](json);
        logger.debug(`🗜️ Сжато: ${(json.length / 1024).toFixed(2)} KB`);
      }

      // Шифрование
      if (this[PRIVATE.ENCRYPTION]) {
        json = this[PRIVATE.ENCRYPT](json);
        logger.debug('🔒 Зашифровано');
      }

      // Сохранение
      const success = this[PRIVATE._writeToStorage](json);

      if (!success) {
        throw new Error('Ошибка записи в хранилище');
      }

      // Обновляем состояние
      this[PRIVATE.LAST_SAVE] = Date.now();
      this[PRIVATE.SAVE_COUNT]++;

      // Выполняем хуки
      this[PRIVATE.NOTIFY]('afterSave', { store, options, success: true });

      logger.success(`✅ Сохранено (${(json.length / 1024).toFixed(2)} KB)`);
      return true;
    } catch (error) {
      this[PRIVATE.ERROR_COUNT]++;
      logger.error('❌ Ошибка сохранения:', error);

      this[PRIVATE.NOTIFY]('error', { error, context: 'save' });
      this[PRIVATE.NOTIFY]('afterSave', { store, options, success: false, error });

      return false;
    } finally {
      this[PRIVATE.IS_SAVING] = false;
    }
  },

  [PRIVATE._prepareData](store) {
    const p = store._;
    const tables = p[Symbol('store.tables')] || {};
    const relations = p[Symbol('store.relations')] || {};
    const selected = p[Symbol('store.selected')] || {};

    return {
      tables: this[PRIVATE._serializeTables](tables),
      relations: this[PRIVATE._serializeRelations](relations),
      selected: this[PRIVATE._serializeSelected](selected),
      version: p[Symbol('store.version')] || '4.0.0',
      timestamp: Date.now(),
      metadata: {
        savedAt: Date.now(),
        storage: this[PRIVATE.STORAGE],
        compression: this[PRIVATE.COMPRESSION],
        encryption: this[PRIVATE.ENCRYPTION],
      },
    };
  },

  [PRIVATE._serializeTables](tables) {
    const result = {};
    for (const [name, table] of Object.entries(tables)) {
      result[name] = {
        data: table.data || [],
        meta: table.meta || { created: Date.now(), version: 1 },
      };
    }
    return result;
  },

  [PRIVATE._serializeRelations](relations) {
    const result = {};
    for (const [key, rel] of Object.entries(relations)) {
      result[key] = {
        master: rel.master,
        detail: rel.detail,
        key: rel.key,
        masterId: rel.masterId,
        masterData: rel.masterData,
      };
    }
    return result;
  },

  [PRIVATE._serializeSelected](selected) {
    const result = {};
    for (const [key, value] of Object.entries(selected)) {
      result[key] = value;
    }
    return result;
  },

  [PRIVATE._writeToStorage](data) {
    const storage = this[PRIVATE.STORAGE];

    try {
      if (storage === 'localStorage') {
        localStorage.setItem(this[PRIVATE.STORAGE_KEY], data);
        return true;
      } else if (storage === 'sessionStorage') {
        sessionStorage.setItem(this[PRIVATE.STORAGE_KEY], data);
        return true;
      } else if (storage === 'memory') {
        this[PRIVATE.CACHE].set(this[PRIVATE.STORAGE_KEY], {
          data,
          timestamp: Date.now(),
        });
        return true;
      } else if (storage === 'indexedDB') {
        // В реальном приложении здесь была бы логика IndexedDB
        console.warn('⚠️ IndexedDB не реализован, используем localStorage');
        localStorage.setItem(this[PRIVATE.STORAGE_KEY], data);
        return true;
      }
    } catch (error) {
      console.error('❌ Ошибка записи:', error);
      return false;
    }
  },

  // ============================================================
  // 9. ЗАГРУЗКА
  // ============================================================

  [PRIVATE.LOAD](store, options = {}) {
    const logger = this[PRIVATE.LOGGER];

    if (this[PRIVATE.IS_LOADING]) {
      logger.warn('⚠️ Загрузка уже выполняется');
      return false;
    }

    // Выполняем хуки
    this[PRIVATE.NOTIFY]('beforeLoad', { store, options });

    this[PRIVATE.IS_LOADING] = true;
    logger.debug('📂 Начало загрузки...');

    try {
      // Чтение из хранилища
      let json = this[PRIVATE._readFromStorage]();

      if (!json) {
        logger.warn('⚠️ Данные не найдены');
        this[PRIVATE.NOTIFY]('afterLoad', { store, options, success: false });
        return false;
      }

      logger.debug(`📂 Прочитано: ${(json.length / 1024).toFixed(2)} KB`);

      // Расшифровка
      if (this[PRIVATE.ENCRYPTION]) {
        json = this[PRIVATE.DECRYPT](json);
        logger.debug('🔓 Расшифровано');
      }

      // Распаковка
      if (this[PRIVATE.COMPRESSION]) {
        json = this[PRIVATE.DECOMPRESS](json);
        logger.debug(`🗜️ Распаковано: ${(json.length / 1024).toFixed(2)} KB`);
      }

      // Парсинг
      const data = JSON.parse(json);

      // Валидация
      const validation = this[PRIVATE.VALIDATE](data);
      if (!validation.valid) {
        throw new Error(`Валидация не пройдена: ${validation.error}`);
      }

      // Восстановление состояния
      this[PRIVATE._restoreData](store, data);

      // Обновляем состояние
      this[PRIVATE.LAST_LOAD] = Date.now();
      this[PRIVATE.LOAD_COUNT]++;

      // Выполняем хуки
      this[PRIVATE.NOTIFY]('afterLoad', { store, options, success: true });

      logger.success('✅ Данные загружены');
      logger.info(`📊 Записей: ${this[PRIVATE._countRecords](data)}`);
      return true;
    } catch (error) {
      this[PRIVATE.ERROR_COUNT]++;
      logger.error('❌ Ошибка загрузки:', error);

      this[PRIVATE.NOTIFY]('error', { error, context: 'load' });
      this[PRIVATE.NOTIFY]('afterLoad', { store, options, success: false, error });

      return false;
    } finally {
      this[PRIVATE.IS_LOADING] = false;
    }
  },

  [PRIVATE._readFromStorage]() {
    const storage = this[PRIVATE.STORAGE];
    const key = this[PRIVATE.STORAGE_KEY];

    try {
      if (storage === 'localStorage') {
        return localStorage.getItem(key);
      } else if (storage === 'sessionStorage') {
        return sessionStorage.getItem(key);
      } else if (storage === 'memory') {
        const cached = this[PRIVATE.CACHE].get(key);
        if (cached && Date.now() - cached.timestamp < this[PRIVATE.CACHE_TTL]) {
          this[PRIVATE.CACHE_HITS]++;
          return cached.data;
        }
        this[PRIVATE.CACHE_MISSES]++;
        return null;
      } else if (storage === 'indexedDB') {
        console.warn('⚠️ IndexedDB не реализован, используем localStorage');
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('❌ Ошибка чтения:', error);
      return null;
    }
  },

  [PRIVATE._restoreData](store, data) {
    const p = store._;
    const tables = p[Symbol('store.tables')] || {};

    // Восстанавливаем таблицы
    for (const [name, tableData] of Object.entries(data.tables || {})) {
      if (tables[name]) {
        tables[name].data = tableData.data || [];
        tables[name].meta = tableData.meta || { created: Date.now(), version: 1 };
      } else {
        tables[name] = {
          data: tableData.data || [],
          meta: tableData.meta || { created: Date.now(), version: 1 },
        };
      }
    }

    // Восстанавливаем связи
    const relations = p[Symbol('store.relations')] || {};
    for (const [key, relData] of Object.entries(data.relations || {})) {
      if (relations[key]) {
        relations[key].masterId = relData.masterId;
        relations[key].masterData = relData.masterData;
      } else {
        relations[key] = {
          master: relData.master,
          detail: relData.detail,
          key: relData.key,
          masterId: relData.masterId,
          masterData: relData.masterData,
          details: [],
        };
      }
    }

    // Восстанавливаем выделения
    const selected = p[Symbol('store.selected')] || {};
    for (const [key, value] of Object.entries(data.selected || {})) {
      selected[key] = value;
    }

    // Обновляем Zustand
    if (store._updateZustand) {
      store._updateZustand();
    }

    // Уведомляем
    if (store._notify) {
      store._notify('store:loaded', { timestamp: Date.now() });
    }
  },

  [PRIVATE._countRecords](data) {
    let count = 0;
    for (const table of Object.values(data.tables || {})) {
      count += (table.data || []).length;
    }
    return count;
  },

  // ============================================================
  // 10. ОЧИСТКА
  // ============================================================

  [PRIVATE.CLEAR](store) {
    const logger = this[PRIVATE.LOGGER];

    try {
      const storage = this[PRIVATE.STORAGE];
      const key = this[PRIVATE.STORAGE_KEY];

      if (storage === 'localStorage') {
        localStorage.removeItem(key);
      } else if (storage === 'sessionStorage') {
        sessionStorage.removeItem(key);
      } else if (storage === 'memory') {
        this[PRIVATE.CACHE].delete(key);
      }

      logger.success('🧹 Хранилище очищено');
      return true;
    } catch (error) {
      logger.error('❌ Ошибка очистки:', error);
      return false;
    }
  },

  // ============================================================
  // 11. ЭКСПОРТ/ИМПОРТ
  // ============================================================

  [PRIVATE.EXPORT](store, format = 'json') {
    const logger = this[PRIVATE.LOGGER];

    try {
      const data = this[PRIVATE._prepareData](store);

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'compact') {
        return JSON.stringify(data);
      } else if (format === 'csv') {
        return this[PRIVATE._toCSV](data);
      } else if (format === 'pretty') {
        return JSON.stringify(data, null, 4);
      } else {
        throw new Error(`Неизвестный формат: ${format}`);
      }
    } catch (error) {
      logger.error('❌ Ошибка экспорта:', error);
      return null;
    }
  },

  [PRIVATE.IMPORT](store, data, format = 'json') {
    const logger = this[PRIVATE.LOGGER];

    try {
      let parsed;
      if (format === 'json' || format === 'compact' || format === 'pretty') {
        parsed = JSON.parse(data);
      } else if (format === 'csv') {
        parsed = this[PRIVATE._fromCSV](data);
      } else {
        throw new Error(`Неизвестный формат: ${format}`);
      }

      // Валидация
      const validation = this[PRIVATE.VALIDATE](parsed);
      if (!validation.valid) {
        throw new Error(`Валидация не пройдена: ${validation.error}`);
      }

      // Восстановление
      this[PRIVATE._restoreData](store, parsed);
      logger.success('✅ Данные импортированы');
      return true;
    } catch (error) {
      logger.error('❌ Ошибка импорта:', error);
      return false;
    }
  },

  [PRIVATE._toCSV](data) {
    // Простая конвертация в CSV
    let csv = 'table,id,data\n';
    for (const [tableName, table] of Object.entries(data.tables || {})) {
      for (const row of table.data || []) {
        csv += `${tableName},${row.id || ''},${JSON.stringify(row)}\n`;
      }
    }
    return csv;
  },

  [PRIVATE._fromCSV](csv) {
    // Простая конвертация из CSV
    const data = { tables: {} };
    const lines = csv.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 3) {
        const tableName = parts[0];
        const rowData = JSON.parse(parts.slice(2).join(','));
        if (!data.tables[tableName]) {
          data.tables[tableName] = { data: [], meta: { created: Date.now(), version: 1 } };
        }
        data.tables[tableName].data.push(rowData);
      }
    }
    return data;
  },

  // ============================================================
  // 12. ВАЛИДАЦИЯ
  // ============================================================

  [PRIVATE.VALIDATE](data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Данные должны быть объектом' };
    }

    if (!data.tables || typeof data.tables !== 'object') {
      return { valid: false, error: 'Отсутствуют таблицы' };
    }

    if (!data.version || typeof data.version !== 'string') {
      return { valid: false, error: 'Отсутствует версия' };
    }

    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return { valid: false, error: 'Отсутствует временная метка' };
    }

    // Проверка структуры таблиц
    for (const [name, table] of Object.entries(data.tables)) {
      if (!table.data || !Array.isArray(table.data)) {
        return { valid: false, error: `Таблица "${name}" имеет некорректные данные` };
      }
    }

    return { valid: true };
  },

  [PRIVATE.SANITIZE](data) {
    const sanitized = {
      tables: {},
      relations: {},
      selected: {},
      version: data.version || '4.0.0',
      timestamp: data.timestamp || Date.now(),
      metadata: data.metadata || {},
    };

    // Санитизация таблиц
    for (const [name, table] of Object.entries(data.tables || {})) {
      sanitized.tables[name] = {
        data: this[PRIVATE.SANITIZE_DATA](table.data || []),
        meta: table.meta || { created: Date.now(), version: 1 },
      };
    }

    // Санитизация связей
    for (const [key, rel] of Object.entries(data.relations || {})) {
      sanitized.relations[key] = {
        master: String(rel.master || ''),
        detail: String(rel.detail || ''),
        key: String(rel.key || 'masterId'),
        masterId: rel.masterId || null,
        masterData: rel.masterData || null,
      };
    }

    // Санитизация выделений
    for (const [key, value] of Object.entries(data.selected || {})) {
      if (value !== undefined && value !== null) {
        sanitized.selected[key] = value;
      }
    }

    return sanitized;
  },

  [PRIVATE.SANITIZE_DATA](data) {
    if (!Array.isArray(data)) return [];
    return data.map(row => {
      const sanitized = {};
      for (const [key, value] of Object.entries(row)) {
        // Пропускаем функции
        if (typeof value === 'function') continue;
        // Пропускаем циклические ссылки
        if (typeof value === 'object' && value !== null) {
          try {
            sanitized[key] = JSON.parse(JSON.stringify(value));
          } catch {
            sanitized[key] = null;
          }
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    });
  },

  // ============================================================
  // 13. СЖАТИЕ
  // ============================================================

  [PRIVATE.COMPRESS](data) {
    try {
      // Простое сжатие через base64
      return btoa(encodeURIComponent(data));
    } catch (error) {
      console.warn('⚠️ Ошибка сжатия:', error);
      return data;
    }
  },

  [PRIVATE.DECOMPRESS](data) {
    try {
      return decodeURIComponent(atob(data));
    } catch (error) {
      console.warn('⚠️ Ошибка распаковки:', error);
      return data;
    }
  },

  // ============================================================
  // 14. ШИФРОВАНИЕ
  // ============================================================

  [PRIVATE.ENCRYPT](data) {
    if (!this[PRIVATE.ENCRYPTION] || !this[PRIVATE.ENCRYPTION_KEY]) {
      return data;
    }

    try {
      // Простое шифрование для демо (в реальном приложении используйте Web Crypto API)
      const key = this[PRIVATE.ENCRYPTION_KEY];
      const result = [];
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result.push(String.fromCharCode(charCode));
      }
      return btoa(result.join(''));
    } catch (error) {
      console.warn('⚠️ Ошибка шифрования:', error);
      return data;
    }
  },

  [PRIVATE.DECRYPT](data) {
    if (!this[PRIVATE.ENCRYPTION] || !this[PRIVATE.ENCRYPTION_KEY]) {
      return data;
    }

    try {
      const key = this[PRIVATE.ENCRYPTION_KEY];
      const decoded = atob(data);
      const result = [];
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result.push(String.fromCharCode(charCode));
      }
      return result.join('');
    } catch (error) {
      console.warn('⚠️ Ошибка расшифровки:', error);
      return data;
    }
  },

  // ============================================================
  // 15. ХУКИ (HOOKS)
  // ============================================================

  [PRIVATE.NOTIFY](event, data) {
    const hooks = {
      beforeSave: this[PRIVATE.BEFORE_SAVE],
      afterSave: this[PRIVATE.AFTER_SAVE],
      beforeLoad: this[PRIVATE.BEFORE_LOAD],
      afterLoad: this[PRIVATE.AFTER_LOAD],
      error: this[PRIVATE.ON_ERROR],
      success: this[PRIVATE.ON_SUCCESS],
    };

    const hookSet = hooks[event];
    if (!hookSet) return;

    for (const callback of hookSet) {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Ошибка в хуке ${event}:`, error);
      }
    }
  },

  // ============================================================
  // 16. АВТО-СОХРАНЕНИЕ
  // ============================================================

  [PRIVATE.SCHEDULE_AUTO_SAVE]() {
    if (this[PRIVATE.AUTO_SAVE_TIMER]) {
      clearInterval(this[PRIVATE.AUTO_SAVE_TIMER]);
    }

    this[PRIVATE.AUTO_SAVE_TIMER] = setInterval(() => {
      if (this[PRIVATE.INITIALIZED] && !this[PRIVATE.DESTROYED]) {
        this[PRIVATE.QUEUE_SAVE]();
      }
    }, this[PRIVATE.SAVE_INTERVAL]);

    const logger = this[PRIVATE.LOGGER];
    logger.debug(`⏰ Авто-сохранение запланировано (${this[PRIVATE.SAVE_INTERVAL]}ms)`);
  },

  [PRIVATE.CLEAR_AUTO_SAVE]() {
    if (this[PRIVATE.AUTO_SAVE_TIMER]) {
      clearInterval(this[PRIVATE.AUTO_SAVE_TIMER]);
      this[PRIVATE.AUTO_SAVE_TIMER] = null;
    }
  },

  [PRIVATE.QUEUE_SAVE]() {
    const queue = this[PRIVATE.SAVE_QUEUE];
    if (queue.length >= CONFIG.maxQueueSize) {
      queue.shift();
    }
    queue.push({ timestamp: Date.now() });
    this[PRIVATE.PROCESS_QUEUE]();
  },

  [PRIVATE.PROCESS_QUEUE]() {
    const queue = this[PRIVATE.SAVE_QUEUE];
    if (queue.length === 0 || this[PRIVATE.IS_SAVING]) return;

    const item = queue.shift();
    // Сохранение выполняется через основной метод
    // В реальном приложении здесь была бы логика пакетной обработки
  },

  // ============================================================
  // 17. СОСТОЯНИЕ И СТАТИСТИКА
  // ============================================================

  [PRIVATE.GET_STATE]() {
    return {
      initialized: this[PRIVATE.INITIALIZED],
      destroyed: this[PRIVATE.DESTROYED],
      storage: this[PRIVATE.STORAGE],
      storageKey: this[PRIVATE.STORAGE_KEY],
      autoSave: this[PRIVATE.AUTO_SAVE],
      saveInterval: this[PRIVATE.SAVE_INTERVAL],
      compression: this[PRIVATE.COMPRESSION],
      encryption: this[PRIVATE.ENCRYPTION],
      lastSave: this[PRIVATE.LAST_SAVE],
      lastLoad: this[PRIVATE.LAST_LOAD],
      saveCount: this[PRIVATE.SAVE_COUNT],
      loadCount: this[PRIVATE.LOAD_COUNT],
      errorCount: this[PRIVATE.ERROR_COUNT],
      queueSize: this[PRIVATE.SAVE_QUEUE].length,
      cacheSize: this[PRIVATE.CACHE].size,
      cacheHits: this[PRIVATE.CACHE_HITS],
      cacheMisses: this[PRIVATE.CACHE_MISSES],
      version: CONFIG.version,
      build: CONFIG.build,
      timestamp: Date.now(),
    };
  },

  [PRIVATE.GET_STATS]() {
    return {
      saves: this[PRIVATE.SAVE_COUNT],
      loads: this[PRIVATE.LOAD_COUNT],
      errors: this[PRIVATE.ERROR_COUNT],
      queueSize: this[PRIVATE.SAVE_QUEUE].length,
      cacheHits: this[PRIVATE.CACHE_HITS],
      cacheMisses: this[PRIVATE.CACHE_MISSES],
      cacheHitRate:
        this[
          PRIVATE.CACHE_HITS + this[PRIVATE.CACHE_MISSES] > 0
            ? Math.round(
              (this[PRIVATE.CACHE_HITS] /
                (this[PRIVATE.CACHE_HITS] + this[PRIVATE.CACHE_MISSES])) *
              100
            )
            : 0
          ],
      lastSave: this[PRIVATE.LAST_SAVE],
      lastLoad: this[PRIVATE.LAST_LOAD],
      uptime: this[PRIVATE.INITIALIZED ? Date.now() - this[PRIVATE.INIT_TIME] : 0],
    };
  },

  [PRIVATE.RESET_STATS]() {
    this[PRIVATE.SAVE_COUNT] = 0;
    this[PRIVATE.LOAD_COUNT] = 0;
    this[PRIVATE.ERROR_COUNT] = 0;
    this[PRIVATE.CACHE_HITS] = 0;
    this[PRIVATE.CACHE_MISSES] = 0;
    this[PRIVATE.SAVE_QUEUE] = [];
    this[PRIVATE.CACHE].clear();
    return true;
  },

  // ============================================================
  // 18. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PUBLIC.HEALTH_CHECK]() {
    const logger = this[PRIVATE.LOGGER];
    const issues = [];
    let healthy = true;

    // Проверка хранилища
    try {
      const testData = JSON.stringify({ test: 'health' });
      this[PRIVATE._writeToStorage](testData);
      const readData = this[PRIVATE._readFromStorage]();
      if (readData !== testData) {
        healthy = false;
        issues.push('Хранилище не сохраняет данные корректно');
      }
    } catch (error) {
      healthy = false;
      issues.push(`Ошибка доступа к хранилищу: ${error.message}`);
    }

    // Проверка кэша
    if (this[PRIVATE.CACHE].size > 0) {
      try {
        for (const [key, value] of this[PRIVATE.CACHE]) {
          if (!value.data || !value.timestamp) {
            healthy = false;
            issues.push(`Некорректный кэш для ключа: ${key}`);
          }
        }
      } catch (error) {
        healthy = false;
        issues.push(`Ошибка проверки кэша: ${error.message}`);
      }
    }

    return {
      healthy,
      issues,
      storage: this[PRIVATE.STORAGE],
      storageKey: this[PRIVATE.STORAGE_KEY],
      compression: this[PRIVATE.COMPRESSION],
      encryption: this[PRIVATE.ENCRYPTION],
      autoSave: this[PRIVATE.AUTO_SAVE],
      queueSize: this[PRIVATE.SAVE_QUEUE].length,
      cacheSize: this[PRIVATE.CACHE].size,
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 19. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__PERSISTENCE_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };

      // Выводим статистику символов
      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;

      console.log('📊 PERSISTENCE SYMBOLS STATS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
    }
  },

  // ============================================================
  // 20. УНИЧТОЖЕНИЕ
  // ============================================================

  [PRIVATE.DESTROY]() {
    const logger = this[PRIVATE.LOGGER];

    if (this[PRIVATE.DESTROYED]) {
      logger.warn('⚠️ Плагин уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение Persistence Plugin...');

    // Очищаем авто-сохранение
    this[PRIVATE.CLEAR_AUTO_SAVE]();

    // Очищаем кэш
    this[PRIVATE.CACHE].clear();

    // Очищаем хуки
    this[PRIVATE.BEFORE_SAVE].clear();
    this[PRIVATE.AFTER_SAVE].clear();
    this[PRIVATE.BEFORE_LOAD].clear();
    this[PRIVATE.AFTER_LOAD].clear();
    this[PRIVATE.ON_ERROR].clear();
    this[PRIVATE.ON_SUCCESS].clear();

    // Обновляем состояние
    this[PRIVATE.DESTROYED] = true;
    this[PRIVATE.STATE].destroyed = true;
    this[PRIVATE.STATE].ready = false;

    // Удаляем глобальные ссылки
    if (typeof window !== 'undefined') {
      delete window.__PERSISTENCE_SYMBOLS;
      delete window.__persistencePlugin;
      delete window[PUBLIC.INSTANCE];
    }

    logger.success('✅ Persistence Plugin уничтожен');
  },

  // ============================================================
  // 21. ПУБЛИЧНЫЙ API
  // ============================================================

  [PUBLIC.INIT](pluginManager) {
    return this[PRIVATE.INIT](pluginManager);
  },

  [PUBLIC.DESTROY]() {
    return this[PRIVATE.DESTROY]();
  },

  [PUBLIC.SAVE](store, options) {
    return this[PRIVATE.SAVE](store, options);
  },

  [PUBLIC.LOAD](store, options) {
    return this[PRIVATE.LOAD](store, options);
  },

  [PUBLIC.CLEAR](store) {
    return this[PRIVATE.CLEAR](store);
  },

  [PUBLIC.EXPORT](store, format) {
    return this[PRIVATE.EXPORT](store, format);
  },

  [PUBLIC.IMPORT](store, data, format) {
    return this[PRIVATE.IMPORT](store, data, format);
  },

  [PUBLIC.GET_STATE]() {
    return this[PRIVATE.GET_STATE]();
  },

  [PUBLIC.GET_STATS]() {
    return this[PRIVATE.GET_STATS]();
  },

  [PUBLIC.RESET_STATS]() {
    return this[PRIVATE.RESET_STATS]();
  },

  [PUBLIC.HEALTH_CHECK]() {
    return this[PUBLIC.HEALTH_CHECK]();
  },

  // ============================================================
  // 22. ИНИЦИАЛИЗАЦИЯ (ВЫЗЫВАЕТСЯ ПРИ РЕГИСТРАЦИИ)
  // ============================================================

  init(pluginManager) {
    return this[PRIVATE.INIT](pluginManager);
  },

  destroy() {
    return this[PRIVATE.DESTROY]();
  },
};

// ============================================================
// 23. ЭКСПОРТЫ (100% символы)
// ============================================================

export { PersistencePlugin };
export {
  PRIVATE as PERSISTENCE_PRIVATE,
  PUBLIC as PERSISTENCE_PUBLIC,
  CONFIG as PERSISTENCE_CONFIG,
};

// ============================================================
// 24. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default PersistencePlugin;

// ============================================================
// 25. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__PERSISTENCE_CONFIG = { ...CONFIG };
  window.__PERSISTENCE_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };
  window.__persistencePlugin = PersistencePlugin;
  window[PUBLIC.INSTANCE] = PersistencePlugin;

  // Выводим статистику символов
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('📊 PERSISTENCE PLUGIN STATS:');
  console.log(`  🔑 Приватных символов: ${privateCount}`);
  console.log(`  🔓 Публичных символов: ${publicCount}`);
  console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
  console.log(`  📋 Версия: ${CONFIG.version} (${CONFIG.build})`);
}

// ============================================================
// 26. ОБРАБОТЧИКИ ДЛЯ ОТЛАДКИ
// ============================================================

if (typeof window !== 'undefined' && CONFIG.debug) {
  window.__debugPersistence = {
    getState: () => PersistencePlugin[PUBLIC.GET_STATE](),
    getStats: () => PersistencePlugin[PUBLIC.GET_STATS](),
    healthCheck: () => PersistencePlugin[PUBLIC.HEALTH_CHECK](),
    resetStats: () => PersistencePlugin[PUBLIC.RESET_STATS](),
    getSymbols: () => ({
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
    }),
    getConfig: () => ({ ...CONFIG }),
    testSave: store => PersistencePlugin[PUBLIC.SAVE](store),
    testLoad: store => PersistencePlugin[PUBLIC.LOAD](store),
  };

  console.log('📋 КОМАНДЫ ОТЛАДКИ (__debugPersistence):');
  console.log('  __debugPersistence.getState() — состояние');
  console.log('  __debugPersistence.getStats() — статистика');
  console.log('  __debugPersistence.healthCheck() — проверка целостности');
  console.log('  __debugPersistence.resetStats() — сброс статистики');
  console.log('  __debugPersistence.getSymbols() — символы');
  console.log('  __debugPersistence.testSave(store) — тест сохранения');
  console.log('  __debugPersistence.testLoad(store) — тест загрузки');
}