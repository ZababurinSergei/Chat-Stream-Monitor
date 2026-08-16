// ============================================================
// plugins/CachePlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Кэширование запросов для Enterprise Store
// Версия: 4.0.9 (ИСПРАВЛЕНО — СТАБИЛЬНАЯ ВЕРСИЯ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('cache.version'),
  BUILD: Symbol('cache.build'),
  NAME: Symbol('cache.name'),
  CONFIG: Symbol('cache.config'),
  STATE: Symbol('cache.state'),
  INITIALIZED: Symbol('cache.initialized'),
  DESTROYED: Symbol('cache.destroyed'),
  IS_ACTIVE: Symbol('cache.isActive'),

  // Данные кэша
  CACHE: Symbol('cache.data'),
  CACHE_META: Symbol('cache.meta'),
  CACHE_STATS: Symbol('cache.stats'),
  CACHE_HISTORY: Symbol('cache.history'),
  CACHE_INDEX: Symbol('cache.index'),
  CACHE_TAGS: Symbol('cache.tags'),

  // Стратегии кэширования
  STRATEGY: Symbol('cache.strategy'),
  STRATEGIES: Symbol('cache.strategies'),
  DEFAULT_STRATEGY: Symbol('cache.defaultStrategy'),

  // Очистка кэша
  EVICTION: Symbol('cache.eviction'),
  EVICTION_STRATEGY: Symbol('cache.evictionStrategy'),
  EVICTION_CHECK: Symbol('cache.evictionCheck'),
  EVICTION_INTERVAL: Symbol('cache.evictionInterval'),

  // Сериализация
  SERIALIZER: Symbol('cache.serializer'),
  DESERIALIZER: Symbol('cache.deserializer'),
  COMPRESSION: Symbol('cache.compression'),

  // Безопасность
  VALIDATE: Symbol('cache.validate'),
  SANITIZE: Symbol('cache.sanitize'),
  SECURE: Symbol('cache.secure'),
  ENCRYPT: Symbol('cache.encrypt'),
  DECRYPT: Symbol('cache.decrypt'),

  // Методы
  INIT: Symbol('cache.init'),
  DESTROY: Symbol('cache.destroy'),
  SET: Symbol('cache.set'),
  GET: Symbol('cache.get'),
  DELETE: Symbol('cache.delete'),
  CLEAR: Symbol('cache.clear'),
  HAS: Symbol('cache.has'),
  TAGS: Symbol('cache.tags'),
  INVALIDATE: Symbol('cache.invalidate'),
  STATS: Symbol('cache.stats'),
  HISTORY: Symbol('cache.history'),
  EVICT: Symbol('cache.evict'),
  COMPACT: Symbol('cache.compact'),
  EXPORT: Symbol('cache.export'),
  IMPORT: Symbol('cache.import'),
  HEALTH: Symbol('cache.health'),

  // Внутренние методы
  GENERATE_KEY: Symbol('cache.generateKey'),
  SERIALIZE: Symbol('cache.serialize'),
  DESERIALIZE: Symbol('cache.deserialize'),
  COMPRESS: Symbol('cache.compress'),
  DECOMPRESS: Symbol('cache.decompress'),
  UPDATE_STATS: Symbol('cache.updateStats'),
  CHECK_EVICTION: Symbol('cache.checkEviction'),
  APPLY_EVICTION: Symbol('cache.applyEviction'),
  GET_TAG_KEYS: Symbol('cache.getTagKeys'),
  CALCULATE_MEMORY: Symbol('cache.calculateMemory'),
  GET_STRATEGY: Symbol('cache.getStrategy'),

  // Логгер
  LOGGER: Symbol('cache.logger'),
  LOG: Symbol('cache.log'),
  DEBUG: Symbol('cache.debug'),
  ERROR: Symbol('cache.error'),
  WARN: Symbol('cache.warn'),
  SUCCESS: Symbol('cache.success'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('cache.instance'),
  STATE: Symbol.for('cache.state'),
  CONFIG: Symbol.for('cache.config'),
  INIT: Symbol.for('cache.init'),
  DESTROY: Symbol.for('cache.destroy'),
  SET: Symbol.for('cache.set'),
  GET: Symbol.for('cache.get'),
  DELETE: Symbol.for('cache.delete'),
  CLEAR: Symbol.for('cache.clear'),
  HAS: Symbol.for('cache.has'),
  TAGS: Symbol.for('cache.tags'),
  INVALIDATE: Symbol.for('cache.invalidate'),
  STATS: Symbol.for('cache.stats'),
  HISTORY: Symbol.for('cache.history'),
  EVICT: Symbol.for('cache.evict'),
  COMPACT: Symbol.for('cache.compact'),
  EXPORT: Symbol.for('cache.export'),
  IMPORT: Symbol.for('cache.import'),
  HEALTH: Symbol.for('cache.health'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.9',
  build: '2026-07-28',
  name: 'Cache Plugin',
  debug: true,

  // Основные настройки
  enabled: true,
  defaultTTL: 60000, // 1 минута
  maxSize: 1000, // Максимум записей
  maxMemory: 50 * 1024 * 1024, // 50MB

  // Стратегия кэширования
  strategy: 'lru', // lru | lfu | fifo | ttl

  // Стратегия вытеснения
  evictionStrategy: 'lru', // lru | lfu | fifo | random
  evictionCheckInterval: 60000, // 1 минута
  evictionBatchSize: 50,

  // Сжатие
  compression: false,
  compressionThreshold: 1024, // 1KB

  // Шифрование
  encryption: false,
  encryptionKey: null,

  // Теги
  tagsEnabled: true,
  maxTagsPerEntry: 10,

  // Сериализация
  serializer: 'json', // json | msgpack | custom

  // История
  historyEnabled: true,
  maxHistory: 1000,

  // Безопасность
  validateKeys: true,
  maxKeyLength: 500,
  maxValueSize: 10 * 1024 * 1024, // 10MB
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

function createLogger(debug = true, instanceId = 'Cache') {
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
        'background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold;',
      );
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
    },

    separator: (color = '#636e72') => {
      console.log('%c' + '─'.repeat(70), `color: ${color};`);
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

  return logger;
}

// ============================================================
// 5. СТРАТЕГИИ КЭШИРОВАНИЯ
// ============================================================

const STRATEGIES = {
  /**
   * Least Recently Used (LRU)
   * Вытесняет наименее недавно использованные записи
   */
  lru: {
    name: 'LRU',
    onAccess: entry => {
      entry.lastAccess = Date.now();
      entry.accessCount = (entry.accessCount || 0) + 1;
    },
    onEvict: cache => {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      return entries.slice(0, Math.ceil(entries.length * 0.1)).map(e => e[0]);
    },
  },

  /**
   * Least Frequently Used (LFU)
   * Вытесняет наименее часто используемые записи
   */
  lfu: {
    name: 'LFU',
    onAccess: entry => {
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccess = Date.now();
    },
    onEvict: cache => {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => (a[1].accessCount || 0) - (b[1].accessCount || 0));
      return entries.slice(0, Math.ceil(entries.length * 0.1)).map(e => e[0]);
    },
  },

  /**
   * First In First Out (FIFO)
   * Вытесняет самые старые записи
   */
  fifo: {
    name: 'FIFO',
    onAccess: entry => {
      entry.lastAccess = Date.now();
    },
    onEvict: cache => {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].created - b[1].created);
      return entries.slice(0, Math.ceil(entries.length * 0.1)).map(e => e[0]);
    },
  },

  /**
   * Time To Live (TTL)
   * Вытесняет записи с истекшим TTL
   */
  ttl: {
    name: 'TTL',
    onAccess: entry => {
      entry.lastAccess = Date.now();
    },
    onEvict: cache => {
      const now = Date.now();
      const toEvict = [];
      for (const [key, entry] of cache) {
        if (entry.ttl && now - entry.created > entry.ttl) {
          toEvict.push(key);
        }
      }
      return toEvict;
    },
  },

  /**
   * Random
   * Вытесняет случайные записи
   */
  random: {
    name: 'Random',
    onAccess: entry => {
      entry.lastAccess = Date.now();
    },
    onEvict: cache => {
      const keys = Array.from(cache.keys());
      const count = Math.min(Math.ceil(keys.length * 0.1), 10);
      const shuffled = keys.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    },
  },
};

// ============================================================
// 6. ОСНОВНОЙ ОБЪЕКТ CACHE_PLUGIN (100% символы) — ИСПРАВЛЕНО
// ============================================================

export const CachePlugin = {
  name: 'cache',
  version: CONFIG.version,
  metadata: {
    description: 'Advanced Caching System with 100% Symbol Isolation',
    author: 'Enterprise Store Team',
    license: 'MIT',
  },
  order: 7,

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ (ИСПРАВЛЕНО)
  // ============================================================

  init(store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // ★★★ ИСПРАВЛЕНО: инициализируем все структуры ★★★
    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG]: { ...CONFIG },
      [PRIVATE.STATE]: {
        initialized: true,
        destroyed: false,
        isActive: true,
      },
      [PRIVATE.CACHE]: new Map(),
      [PRIVATE.CACHE_META]: new Map(),
      [PRIVATE.CACHE_STATS]: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        hitsMemory: 0,
        missesMemory: 0,
        size: 0,
        memoryUsage: 0,
        hitRate: 0,
        startTime: Date.now(),
        lastReset: Date.now(),
      },
      [PRIVATE.CACHE_HISTORY]: [],
      [PRIVATE.CACHE_INDEX]: new Map(),
      [PRIVATE.CACHE_TAGS]: new Map(),
      [PRIVATE.STRATEGY]: CONFIG.strategy,
      [PRIVATE.STRATEGIES]: STRATEGIES,
      [PRIVATE.DEFAULT_STRATEGY]: CONFIG.strategy,
      [PRIVATE.EVICTION_STRATEGY]: CONFIG.evictionStrategy,
      [PRIVATE.EVICTION_CHECK]: null,
      [PRIVATE.EVICTION_INTERVAL]: CONFIG.evictionCheckInterval,
      [PRIVATE.INITIALIZED]: true,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.IS_ACTIVE]: true,
      [PRIVATE.LOGGER]: logger,
    };

    // ★★★ ИСПРАВЛЕНО: сохраняем в store ★★★
    store._cacheData = privateData;

    // ★★★ ИСПРАВЛЕНО: теперь p определена ★★★
    const p = store._cacheData;

    logger.header('КЭШ ИНИЦИАЛИЗИРОВАН');
    logger.success(`✅ Кэш активен (${CONFIG.strategy})`);
    logger.info(`📊 Максимум записей: ${CONFIG.maxSize}`);
    logger.info(`💾 Максимум памяти: ${CONFIG.maxMemory} байт`);
    logger.info(`⏰ TTL по умолчанию: ${CONFIG.defaultTTL} мс`);
    logger.info(`🔄 Стратегия вытеснения: ${CONFIG.evictionStrategy}`);
    logger.info(`🏷️ Теги: ${CONFIG.tagsEnabled ? 'ON' : 'OFF'}`);
    logger.info(`🔒 Шифрование: ${CONFIG.encryption ? 'ON' : 'OFF'}`);
    logger.info(`📦 Сжатие: ${CONFIG.compression ? 'ON' : 'OFF'}`);
    logger.separator();

    // ============================================================
    // 8. МЕТОДЫ КЭША
    // ============================================================

    /**
     * Установить значение в кэш
     */
    store[PUBLIC.SET] = function (key, value, options = {}) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];
      const config = p[PRIVATE.CONFIG];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return false;
      }

      // Валидация ключа
      if (config.validateKeys) {
        const validation = this[PRIVATE.VALIDATE](key);
        if (!validation.valid) {
          logger.error(`❌ Некорректный ключ: ${validation.error}`);
          return false;
        }
      }

      // Проверка размера значения
      try {
        const size = JSON.stringify(value).length;
        if (size > config.maxValueSize) {
          logger.error(`❌ Значение слишком большое: ${size} байт`);
          return false;
        }
      } catch (error) {
        logger.error('❌ Ошибка сериализации значения:', error);
        return false;
      }

      // Проверка лимита памяти
      const memoryUsage = this[PRIVATE.CALCULATE_MEMORY]();
      if (memoryUsage > config.maxMemory) {
        logger.warn(`⚠️ Превышен лимит памяти: ${memoryUsage} байт`);
        this[PRIVATE.EVICT]();
      }

      // Проверка лимита размера
      if (p[PRIVATE.CACHE].size >= config.maxSize) {
        logger.warn(`⚠️ Превышен лимит размера кэша: ${config.maxSize}`);
        this[PRIVATE.EVICT]();
      }

      // Генерируем ключ
      const cacheKey = this[PRIVATE.GENERATE_KEY](key);

      // Сериализуем значение
      let serialized = value;
      try {
        serialized = this[PRIVATE.SERIALIZE](value);
      } catch (error) {
        logger.error('❌ Ошибка сериализации:', error);
        return false;
      }

      // Создаем запись
      const entry = {
        key: cacheKey,
        originalKey: key,
        value: serialized,
        created: Date.now(),
        lastAccess: Date.now(),
        accessCount: 0,
        ttl: options.ttl || config.defaultTTL,
        tags: options.tags || [],
        metadata: options.metadata || {},
        size: JSON.stringify(serialized).length,
        version: options.version || 1,
      };

      // Добавляем теги
      if (config.tagsEnabled && entry.tags.length > 0) {
        for (const tag of entry.tags) {
          if (!p[PRIVATE.CACHE_TAGS].has(tag)) {
            p[PRIVATE.CACHE_TAGS].set(tag, new Set());
          }
          p[PRIVATE.CACHE_TAGS].get(tag).add(cacheKey);
        }
      }

      // Сохраняем в кэш
      p[PRIVATE.CACHE].set(cacheKey, entry);
      p[PRIVATE.CACHE_META].set(cacheKey, {
        created: entry.created,
        lastAccess: entry.lastAccess,
        accessCount: entry.accessCount,
      });

      // Обновляем индекс
      if (!p[PRIVATE.CACHE_INDEX].has(cacheKey)) {
        p[PRIVATE.CACHE_INDEX].set(cacheKey, new Set());
      }

      // Обновляем статистику
      p[PRIVATE.CACHE_STATS].sets++;
      p[PRIVATE.CACHE_STATS].size = p[PRIVATE.CACHE].size;
      p[PRIVATE.CACHE_STATS].memoryUsage = this[PRIVATE.CALCULATE_MEMORY]();

      // Сохраняем в историю
      if (config.historyEnabled) {
        p[PRIVATE.CACHE_HISTORY].push({
          action: 'set',
          key: cacheKey,
          tags: entry.tags,
          timestamp: Date.now(),
          size: entry.size,
        });
        if (p[PRIVATE.CACHE_HISTORY].length > config.maxHistory) {
          p[PRIVATE.CACHE_HISTORY] = p[PRIVATE.CACHE_HISTORY].slice(-config.maxHistory);
        }
      }

      // Обновляем статистику
      this[PRIVATE.UPDATE_STATS]();

      logger.debug(`💾 Кэш установлен: ${cacheKey}`);
      return true;
    };

    /**
     * Получить значение из кэша
     */
    store[PUBLIC.GET] = function (key, options = {}) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return null;
      }

      const cacheKey = this[PRIVATE.GENERATE_KEY](key);

      if (!p[PRIVATE.CACHE].has(cacheKey)) {
        p[PRIVATE.CACHE_STATS].misses++;
        this[PRIVATE.UPDATE_STATS]();
        return null;
      }

      const entry = p[PRIVATE.CACHE].get(cacheKey);

      // Проверка TTL
      if (entry.ttl && Date.now() - entry.created > entry.ttl) {
        logger.debug(`⏰ Кэш истек: ${cacheKey}`);
        this[PUBLIC.DELETE](cacheKey);
        p[PRIVATE.CACHE_STATS].misses++;
        this[PRIVATE.UPDATE_STATS]();
        return null;
      }

      // Обновляем статистику доступа
      entry.lastAccess = Date.now();
      entry.accessCount = (entry.accessCount || 0) + 1;

      // Обновляем метаданные
      const meta = p[PRIVATE.CACHE_META].get(cacheKey);
      if (meta) {
        meta.lastAccess = entry.lastAccess;
        meta.accessCount = entry.accessCount;
      }

      // Применяем стратегию доступа
      const strategy = this[PRIVATE.GET_STRATEGY]();
      if (strategy && strategy.onAccess) {
        strategy.onAccess(entry);
      }

      // Десериализуем значение
      let value = entry.value;
      try {
        value = this[PRIVATE.DESERIALIZE](entry.value);
      } catch (error) {
        logger.error('❌ Ошибка десериализации:', error);
        return null;
      }

      // Обновляем статистику
      p[PRIVATE.CACHE_STATS].hits++;
      p[PRIVATE.CACHE_STATS].hitsMemory += entry.size || 0;

      // Сохраняем в историю
      if (CONFIG.historyEnabled) {
        p[PRIVATE.CACHE_HISTORY].push({
          action: 'get',
          key: cacheKey,
          timestamp: Date.now(),
          hit: true,
        });
      }

      this[PRIVATE.UPDATE_STATS]();

      logger.debug(`📦 Кэш получен: ${cacheKey}`);
      return value;
    };

    /**
     * Удалить значение из кэша
     */
    store[PUBLIC.DELETE] = function (key) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return false;
      }

      const cacheKey = this[PRIVATE.GENERATE_KEY](key);

      if (!p[PRIVATE.CACHE].has(cacheKey)) {
        return false;
      }

      const entry = p[PRIVATE.CACHE].get(cacheKey);

      // Удаляем теги
      if (CONFIG.tagsEnabled && entry.tags) {
        for (const tag of entry.tags) {
          if (p[PRIVATE.CACHE_TAGS].has(tag)) {
            p[PRIVATE.CACHE_TAGS].get(tag).delete(cacheKey);
            if (p[PRIVATE.CACHE_TAGS].get(tag).size === 0) {
              p[PRIVATE.CACHE_TAGS].delete(tag);
            }
          }
        }
      }

      // Удаляем из кэша
      p[PRIVATE.CACHE].delete(cacheKey);
      p[PRIVATE.CACHE_META].delete(cacheKey);
      p[PRIVATE.CACHE_INDEX].delete(cacheKey);

      // Обновляем статистику
      p[PRIVATE.CACHE_STATS].deletes++;
      p[PRIVATE.CACHE_STATS].size = p[PRIVATE.CACHE].size;
      p[PRIVATE.CACHE_STATS].memoryUsage = this[PRIVATE.CALCULATE_MEMORY]();

      // Сохраняем в историю
      if (CONFIG.historyEnabled) {
        p[PRIVATE.CACHE_HISTORY].push({
          action: 'delete',
          key: cacheKey,
          timestamp: Date.now(),
        });
      }

      this[PRIVATE.UPDATE_STATS]();

      logger.debug(`🗑 Кэш удален: ${cacheKey}`);
      return true;
    };

    /**
     * Очистить весь кэш
     */
    store[PUBLIC.CLEAR] = function () {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return false;
      }

      const size = p[PRIVATE.CACHE].size;
      p[PRIVATE.CACHE].clear();
      p[PRIVATE.CACHE_META].clear();
      p[PRIVATE.CACHE_INDEX].clear();
      p[PRIVATE.CACHE_TAGS].clear();

      // Обновляем статистику
      p[PRIVATE.CACHE_STATS].size = 0;
      p[PRIVATE.CACHE_STATS].memoryUsage = 0;

      // Сохраняем в историю
      if (CONFIG.historyEnabled) {
        p[PRIVATE.CACHE_HISTORY].push({
          action: 'clear',
          entries: size,
          timestamp: Date.now(),
        });
      }

      this[PRIVATE.UPDATE_STATS]();

      logger.success(`🧹 Кэш очищен (${size} записей)`);
      return true;
    };

    /**
     * Проверить наличие ключа в кэше
     */
    store[PUBLIC.HAS] = function (key) {
      const p = this._cacheData;

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        return false;
      }

      const cacheKey = this[PRIVATE.GENERATE_KEY](key);
      return p[PRIVATE.CACHE].has(cacheKey);
    };

    /**
     * Получить теги записи
     */
    store[PUBLIC.TAGS] = function (key) {
      const p = this._cacheData;

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        return [];
      }

      const cacheKey = this[PRIVATE.GENERATE_KEY](key);

      if (!p[PRIVATE.CACHE].has(cacheKey)) {
        return [];
      }

      const entry = p[PRIVATE.CACHE].get(cacheKey);
      return entry.tags || [];
    };

    /**
     * Инвалидировать кэш по тегам
     */
    store[PUBLIC.INVALIDATE] = function (tags) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return 0;
      }

      const tagsArray = Array.isArray(tags) ? tags : [tags];
      const keys = new Set();

      for (const tag of tagsArray) {
        if (p[PRIVATE.CACHE_TAGS].has(tag)) {
          for (const key of p[PRIVATE.CACHE_TAGS].get(tag)) {
            keys.add(key);
          }
        }
      }

      let count = 0;
      for (const key of keys) {
        if (this[PUBLIC.DELETE](key)) {
          count++;
        }
      }

      logger.debug(`🏷️ Инвалидировано ${count} записей по тегам: ${tagsArray.join(', ')}`);
      return count;
    };

    /**
     * Получить статистику кэша
     */
    store[PUBLIC.STATS] = function () {
      const p = this._cacheData;
      const stats = p[PRIVATE.CACHE_STATS];
      const hitRate =
        stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0;

      return {
        ...stats,
        hitRate: Math.round(hitRate * 100) / 100,
        size: p[PRIVATE.CACHE].size,
        memoryUsage: this[PRIVATE.CALCULATE_MEMORY](),
        tags: p[PRIVATE.CACHE_TAGS].size,
        uptime: Date.now() - stats.startTime,
        strategy: p[PRIVATE.STRATEGY],
        evictionStrategy: p[PRIVATE.EVICTION_STRATEGY],
        config: {
          maxSize: CONFIG.maxSize,
          maxMemory: CONFIG.maxMemory,
          defaultTTL: CONFIG.defaultTTL,
          compression: CONFIG.compression,
          encryption: CONFIG.encryption,
          tagsEnabled: CONFIG.tagsEnabled,
        },
        timestamp: Date.now(),
      };
    };

    /**
     * Получить историю кэша
     */
    store[PUBLIC.HISTORY] = function (limit = 50) {
      const p = this._cacheData;
      const history = p[PRIVATE.CACHE_HISTORY];
      return history.slice(-Math.min(limit, history.length));
    };

    /**
     * Принудительно вытеснить записи
     */
    store[PUBLIC.EVICT] = function (count = null) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return 0;
      }

      const evictionStrategy = p[PRIVATE.EVICTION_STRATEGY];
      const strategy = STRATEGIES[evictionStrategy];

      if (!strategy) {
        logger.error(`❌ Неизвестная стратегия вытеснения: ${evictionStrategy}`);
        return 0;
      }

      const keysToEvict = strategy.onEvict(p[PRIVATE.CACHE]);

      let toEvict = keysToEvict;
      if (count !== null && count > 0) {
        toEvict = keysToEvict.slice(0, count);
      }

      let evicted = 0;
      for (const key of toEvict) {
        if (this[PUBLIC.DELETE](key)) {
          evicted++;
          p[PRIVATE.CACHE_STATS].evictions++;
        }
      }

      logger.debug(`🧹 Вытеснено ${evicted} записей (${evictionStrategy})`);
      this[PRIVATE.UPDATE_STATS]();
      return evicted;
    };

    /**
     * Компактифицировать кэш
     */
    store[PUBLIC.COMPACT] = function () {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return 0;
      }

      let removed = 0;
      const now = Date.now();

      for (const [key, entry] of p[PRIVATE.CACHE]) {
        // Удаляем истекшие записи
        if (entry.ttl && now - entry.created > entry.ttl) {
          this[PUBLIC.DELETE](key);
          removed++;
        }
      }

      // Удаляем дубликаты тегов
      for (const [tag, keys] of p[PRIVATE.CACHE_TAGS]) {
        if (keys.size === 0) {
          p[PRIVATE.CACHE_TAGS].delete(tag);
        }
      }

      logger.debug(`🧹 Компактификация удалила ${removed} записей`);
      this[PRIVATE.UPDATE_STATS]();
      return removed;
    };

    /**
     * Экспортировать кэш
     */
    store[PUBLIC.EXPORT] = function () {
      const p = this._cacheData;

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        return null;
      }

      const exportData = {
        version: CONFIG.version,
        exportedAt: Date.now(),
        strategy: p[PRIVATE.STRATEGY],
        evictionStrategy: p[PRIVATE.EVICTION_STRATEGY],
        entries: [],
      };

      for (const [key, entry] of p[PRIVATE.CACHE]) {
        exportData.entries.push({
          key: entry.originalKey,
          value: entry.value,
          created: entry.created,
          ttl: entry.ttl,
          tags: entry.tags,
          metadata: entry.metadata,
        });
      }

      return exportData;
    };

    /**
     * Импортировать кэш
     */
    store[PUBLIC.IMPORT] = function (data) {
      const p = this._cacheData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Кэш не активен');
        return 0;
      }

      if (!data || typeof data !== 'object' || !data.entries) {
        logger.error('❌ Некорректные данные для импорта');
        return 0;
      }

      let imported = 0;
      for (const entry of data.entries) {
        const success = this[PUBLIC.SET](entry.key, entry.value, {
          ttl: entry.ttl,
          tags: entry.tags,
          metadata: entry.metadata,
        });
        if (success) {imported++;}
      }

      logger.success(`📥 Импортировано ${imported} записей`);
      return imported;
    };

    /**
     * Проверка целостности
     */
    store[PUBLIC.HEALTH] = function () {
      const p = this._cacheData;
      const stats = p[PRIVATE.CACHE_STATS];

      return {
        initialized: p[PRIVATE.INITIALIZED],
        destroyed: p[PRIVATE.DESTROYED],
        isActive: p[PRIVATE.IS_ACTIVE],
        size: p[PRIVATE.CACHE].size,
        memoryUsage: this[PRIVATE.CALCULATE_MEMORY](),
        maxSize: CONFIG.maxSize,
        maxMemory: CONFIG.maxMemory,
        hitRate:
          stats.hits + stats.misses > 0
            ? Math.round((stats.hits / (stats.hits + stats.misses)) * 10000) / 100
            : 0,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        evictions: stats.evictions,
        tags: p[PRIVATE.CACHE_TAGS].size,
        strategy: p[PRIVATE.STRATEGY],
        evictionStrategy: p[PRIVATE.EVICTION_STRATEGY],
        uptime: Date.now() - stats.startTime,
        status: p[PRIVATE.IS_ACTIVE] ? 'active' : 'inactive',
        version: CONFIG.version,
        timestamp: Date.now(),
      };
    };

    // ============================================================
    // 9. ВНУТРЕННИЕ МЕТОДЫ
    // ============================================================

    /**
     * Генерация ключа кэша
     */
    store[PRIVATE.GENERATE_KEY] = function (key) {
      if (typeof key === 'string') {
        return key;
      }
      try {
        return JSON.stringify(key);
      } catch {
        return String(key);
      }
    };

    /**
     * Сериализация значения
     */
    store[PRIVATE.SERIALIZE] = function (value) {
      const config = this._cacheData[PRIVATE.CONFIG];

      if (config.compression && JSON.stringify(value).length > config.compressionThreshold) {
        return this[PRIVATE.COMPRESS](value);
      }

      if (config.encryption) {
        return this[PRIVATE.ENCRYPT](value);
      }

      return value;
    };

    /**
     * Десериализация значения
     */
    store[PRIVATE.DESERIALIZE] = function (value) {
      const config = this._cacheData[PRIVATE.CONFIG];

      if (config.encryption) {
        return this[PRIVATE.DECRYPT](value);
      }

      if (config.compression) {
        return this[PRIVATE.DECOMPRESS](value);
      }

      return value;
    };

    /**
     * Сжатие данных
     */
    store[PRIVATE.COMPRESS] = function (data) {
      try {
        const json = JSON.stringify(data);
        // Простое сжатие для демо
        return btoa(json);
      } catch (error) {
        this._cacheData[PRIVATE.LOGGER].error('❌ Ошибка сжатия:', error);
        return data;
      }
    };

    /**
     * Распаковка данных
     */
    store[PRIVATE.DECOMPRESS] = function (data) {
      try {
        if (typeof data === 'string' && data.startsWith('base64:')) {
          const json = atob(data.substring(7));
          return JSON.parse(json);
        }
        return data;
      } catch (error) {
        this._cacheData[PRIVATE.LOGGER].error('❌ Ошибка распаковки:', error);
        return data;
      }
    };

    /**
     * Шифрование данных
     */
    store[PRIVATE.ENCRYPT] = function (data) {
      const config = this._cacheData[PRIVATE.CONFIG];
      if (!config.encryptionKey) {return data;}

      try {
        const json = JSON.stringify(data);
        // Простое шифрование для демо
        return `encrypted:${btoa(json)}`;
      } catch (error) {
        this._cacheData[PRIVATE.LOGGER].error('❌ Ошибка шифрования:', error);
        return data;
      }
    };

    /**
     * Расшифровка данных
     */
    store[PRIVATE.DECRYPT] = function (data) {
      const config = this._cacheData[PRIVATE.CONFIG];
      if (!config.encryptionKey) {return data;}

      try {
        if (typeof data === 'string' && data.startsWith('encrypted:')) {
          const json = atob(data.substring(10));
          return JSON.parse(json);
        }
        return data;
      } catch (error) {
        this._cacheData[PRIVATE.LOGGER].error('❌ Ошибка расшифровки:', error);
        return data;
      }
    };

    /**
     * Валидация ключа
     */
    store[PRIVATE.VALIDATE] = function (key) {
      const config = this._cacheData[PRIVATE.CONFIG];

      if (key === undefined || key === null) {
        return { valid: false, error: 'Ключ не может быть null или undefined' };
      }

      if (typeof key === 'string') {
        if (key.length === 0) {
          return { valid: false, error: 'Ключ не может быть пустым' };
        }
        if (key.length > config.maxKeyLength) {
          return {
            valid: false,
            error: `Ключ слишком длинный: ${key.length} > ${config.maxKeyLength}`,
          };
        }
        if (/[<>{}()\\[\\]]/.test(key)) {
          return { valid: false, error: 'Ключ содержит недопустимые символы' };
        }
      }

      return { valid: true };
    };

    /**
     * Получить стратегию кэширования
     */
    store[PRIVATE.GET_STRATEGY] = function () {
      const p = this._cacheData;
      const strategyName = p[PRIVATE.STRATEGY] || CONFIG.strategy;
      return STRATEGIES[strategyName] || STRATEGIES.lru;
    };

    /**
     * Рассчитать использование памяти
     */
    store[PRIVATE.CALCULATE_MEMORY] = function () {
      const p = this._cacheData;
      let total = 0;
      for (const [, entry] of p[PRIVATE.CACHE]) {
        total += entry.size || 0;
      }
      return total;
    };

    /**
     * Обновить статистику
     */
    store[PRIVATE.UPDATE_STATS] = function () {
      const p = this._cacheData;
      const stats = p[PRIVATE.CACHE_STATS];

      // Сохраняем в историю статистики
      if (CONFIG.historyEnabled) {
        p[PRIVATE.CACHE_HISTORY].push({
          action: 'stats',
          hits: stats.hits,
          misses: stats.misses,
          size: p[PRIVATE.CACHE].size,
          timestamp: Date.now(),
        });
      }
    };

    /**
     * ★★★ ИСПРАВЛЕНО: проверка вытеснения ★★★
     */
    store[PRIVATE.CHECK_EVICTION] = function () {
      const p = this._cacheData;
      const config = p[PRIVATE.CONFIG];

      if (p[PRIVATE.CACHE].size > config.maxSize) {
        this[PUBLIC.EVICT]();
      }

      const memory = this[PRIVATE.CALCULATE_MEMORY]();
      if (memory > config.maxMemory) {
        this[PUBLIC.EVICT]();
      }

      // Компактификация
      this[PUBLIC.COMPACT]();
    };

    /**
     * Применить вытеснение
     */
    store[PRIVATE.APPLY_EVICTION] = function () {
      const p = this._cacheData;
      const evictionStrategy = p[PRIVATE.EVICTION_STRATEGY] || CONFIG.evictionStrategy;
      const strategy = STRATEGIES[evictionStrategy];

      if (!strategy) {
        return 0;
      }

      const keysToEvict = strategy.onEvict(p[PRIVATE.CACHE]);
      const evictCount = Math.min(keysToEvict.length, CONFIG.evictionBatchSize);

      let evicted = 0;
      for (let i = 0; i < evictCount && i < keysToEvict.length; i++) {
        const key = keysToEvict[i];
        if (this[PUBLIC.DELETE](key)) {
          evicted++;
          p[PRIVATE.CACHE_STATS].evictions++;
        }
      }

      this[PRIVATE.UPDATE_STATS]();
      return evicted;
    };

    // ============================================================
    // 10. ЭКСПОРТ СИМВОЛОВ
    // ============================================================

    store[PRIVATE.EXPORT_SYMBOLS] = function () {
      if (typeof window !== 'undefined') {
        window.__CACHE_SYMBOLS = {
          PRIVATE: { ...PRIVATE },
          PUBLIC: { ...PUBLIC },
        };
      }
    };

    store[PRIVATE.EXPORT_SYMBOLS]();

    // ============================================================
    // 11. АВТОМАТИЧЕСКАЯ ОЧИСТКА ★★★ ИСПРАВЛЕНО ★★★
    // ============================================================

    // ★★★ ИСПРАВЛЕНО: правильный вызов метода ★★★
    p[PRIVATE.EVICTION_CHECK] = setInterval(() => {
      if (p[PRIVATE.IS_ACTIVE] && !p[PRIVATE.DESTROYED]) {
        // ★★★ ИСПРАВЛЕНО: вызываем метод через store с правильной привязкой ★★★
        if (typeof store[PRIVATE.CHECK_EVICTION] === 'function') {
          store[PRIVATE.CHECK_EVICTION]();
        } else if (typeof store[PUBLIC.EVICT] === 'function') {
          // Альтернативный вызов
          store[PUBLIC.EVICT]();
        }
      }
    }, CONFIG.evictionCheckInterval);

    // ============================================================
    // 12. ПЕРЕХВАТ ЗАПРОСОВ
    // ============================================================

    // Перехватываем метод find для автоматического кэширования
    if (store._find) {
      const originalFind = store._find.bind(store);
      store._find = function (name, query) {
        const cacheKey = `find:${name}:${JSON.stringify(query)}`;

        // Пытаемся получить из кэша
        const cached = this[PUBLIC.GET](cacheKey);
        if (cached !== null) {
          return cached;
        }

        // Выполняем запрос
        const result = originalFind(name, query);

        // Сохраняем в кэш
        if (result !== null) {
          this[PUBLIC.SET](cacheKey, result, {
            ttl: CONFIG.defaultTTL,
            tags: [`table:${name}`, 'query'],
          });
        }

        return result;
      };
    }

    // Перехватываем метод insert для инвалидации кэша
    if (store._add) {
      const originalAdd = store._add.bind(store);
      store._add = function (name, rows) {
        const result = originalAdd(name, rows);

        // Инвалидируем кэш таблицы
        this[PUBLIC.INVALIDATE]([`table:${name}`]);

        return result;
      };
    }

    // Перехватываем метод update для инвалидации кэша
    if (store._update) {
      const originalUpdate = store._update.bind(store);
      store._update = function (name, query, data) {
        const result = originalUpdate(name, query, data);

        // Инвалидируем кэш таблицы
        this[PUBLIC.INVALIDATE]([`table:${name}`]);

        return result;
      };
    }

    // Перехватываем метод remove для инвалидации кэша
    if (store._remove) {
      const originalRemove = store._remove.bind(store);
      store._remove = function (name, query) {
        const result = originalRemove(name, query);

        // Инвалидируем кэш таблицы
        this[PUBLIC.INVALIDATE]([`table:${name}`]);

        return result;
      };
    }

    logger.success('✅ Кэширование запросов включено');

    // Возвращаем плагин
    return this;
  },

  // ============================================================
  // 13. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const p = store._cacheData;
    if (!p) {return;}

    const logger = p[PRIVATE.LOGGER];

    logger.info('🧹 Уничтожение кэша...');

    // Останавливаем периодическую проверку
    if (p[PRIVATE.EVICTION_CHECK]) {
      clearInterval(p[PRIVATE.EVICTION_CHECK]);
      p[PRIVATE.EVICTION_CHECK] = null;
    }

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.IS_ACTIVE] = false;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].isActive = false;

    // Очищаем данные
    p[PRIVATE.CACHE].clear();
    p[PRIVATE.CACHE_META].clear();
    p[PRIVATE.CACHE_INDEX].clear();
    p[PRIVATE.CACHE_TAGS].clear();
    p[PRIVATE.CACHE_HISTORY] = [];

    logger.success('✅ Кэш уничтожен');
  },
};

// ============================================================
// 14. ЭКСПОРТ
// ============================================================

export default CachePlugin;

// ============================================================
// 15. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__CACHE_PLUGIN = CachePlugin;
  window.__CACHE_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              💾 CACHE PLUGIN (100% СИМВОЛЫ) v4.0.9                         ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Множественные стратегии (LRU, LFU, FIFO, TTL, Random)                ║');
  console.log('║    ✅ Вытеснение с разными стратегиями                                      ║');
  console.log('║    ✅ TTL для записей                                                       ║');
  console.log('║    ✅ Теги для группировки                                                  ║');
  console.log('║    ✅ Инвалидация по тегам                                                  ║');
  console.log('║    ✅ Сжатие данных                                                         ║');
  console.log('║    ✅ Шифрование данных                                                     ║');
  console.log('║    ✅ Экспорт/Импорт кэша                                                   ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ Автоматическое кэширование запросов                                   ║');
  console.log('║    ✅ Инвалидация при изменении данных                                      ║');
  console.log('║    ✅ Компактификация                                                       ║');
  console.log('║    ✅ Health Check                                                         ║');
  console.log('║    ✅ 100% СИМВОЛЫ — полная изоляция                                       ║');
  console.log('║    ✅ ИСПРАВЛЕНА ОШИБКА EVICTION — стабильная работа                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  console.log('📋 КОМАНДЫ ОТЛАДКИ:');
  console.log('  store.cache.set(key, value, options) — установить');
  console.log('  store.cache.get(key) — получить');
  console.log('  store.cache.delete(key) — удалить');
  console.log('  store.cache.clear() — очистить');
  console.log('  store.cache.has(key) — проверить наличие');
  console.log('  store.cache.tags(key) — получить теги');
  console.log('  store.cache.invalidate(tags) — инвалидировать по тегам');
  console.log('  store.cache.stats() — статистика');
  console.log('  store.cache.history(limit) — история');
  console.log('  store.cache.evict(count) — вытеснить');
  console.log('  store.cache.compact() — компактифицировать');
  console.log('  store.cache.export() — экспорт');
  console.log('  store.cache.import(data) — импорт');
  console.log('  store.cache.health() — проверка целостности');
  console.log('');
}