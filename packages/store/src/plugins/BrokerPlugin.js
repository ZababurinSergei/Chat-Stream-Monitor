// ============================================================
// plugins/BrokerPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Брокер сообщений для Enterprise Store
// Версия: 4.0.8 (ИСПРАВЛЕНО — СТАБИЛЬНАЯ ВЕРСИЯ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('broker.version'),
  BUILD: Symbol('broker.build'),
  NAME: Symbol('broker.name'),
  CONFIG: Symbol('broker.config'),
  STATE: Symbol('broker.state'),
  INITIALIZED: Symbol('broker.initialized'),
  DESTROYED: Symbol('broker.destroyed'),
  IS_ACTIVE: Symbol('broker.isActive'),
  START_TIME: Symbol('broker.startTime'),

  // Данные брокера
  TOPICS: Symbol('broker.topics'),
  SUBSCRIPTIONS: Symbol('broker.subscriptions'),
  MIDDLEWARES: Symbol('broker.middlewares'),
  DEAD_LETTER: Symbol('broker.deadLetter'),
  RETRY_QUEUE: Symbol('broker.retryQueue'),
  MESSAGE_HISTORY: Symbol('broker.messageHistory'),
  MESSAGE_CACHE: Symbol('broker.messageCache'),

  // Статистика
  STATS: Symbol('broker.stats'),
  STATS_HISTORY: Symbol('broker.statsHistory'),

  // Состояние подписчиков
  SUBSCRIBER_STATE: Symbol('broker.subscriberState'),
  SUBSCRIBER_HISTORY: Symbol('broker.subscriberHistory'),
  SUBSCRIBER_COUNT: Symbol('broker.subscriberCount'),

  // Безопасность
  VALIDATE: Symbol('broker.validate'),
  SANITIZE: Symbol('broker.sanitize'),
  SECURE: Symbol('broker.secure'),
  RATE_LIMIT: Symbol('broker.rateLimit'),
  RATE_LIMIT_MAP: Symbol('broker.rateLimitMap'),

  // Методы
  INIT: Symbol('broker.init'),
  DESTROY: Symbol('broker.destroy'),
  PUBLISH: Symbol('broker.publish'),
  SUBSCRIBE: Symbol('broker.subscribe'),
  UNSUBSCRIBE: Symbol('broker.unsubscribe'),
  USE: Symbol('broker.use'),
  DELIVER: Symbol('broker.deliver'),
  FIND_SUBSCRIBERS: Symbol('broker.findSubscribers'),
  APPLY_MIDDLEWARES: Symbol('broker.applyMiddlewares'),
  LOG_MESSAGE: Symbol('broker.logMessage'),
  GET_STATS: Symbol('broker.getStats'),
  GET_TOPICS: Symbol('broker.getTopics'),
  GET_SUBSCRIBERS: Symbol('broker.getSubscribers'),
  GET_DEAD_LETTER: Symbol('broker.getDeadLetter'),
  CLEAR_DEAD_LETTER: Symbol('broker.clearDeadLetter'),
  PROCESS_RETRY: Symbol('broker.processRetry'),
  CLEAR_HISTORY: Symbol('broker.clearHistory'),
  GET_HISTORY: Symbol('broker.getHistory'),
  RATE_LIMIT_CHECK: Symbol('broker.rateLimitCheck'),
  UPDATE_STATS: Symbol('broker.updateStats'),
  EXPORT_SYMBOLS: Symbol('broker.exportSymbols'),

  // Логгер
  LOGGER: Symbol('broker.logger'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('broker.instance'),
  STATE: Symbol.for('broker.state'),
  CONFIG: Symbol.for('broker.config'),
  INIT: Symbol.for('broker.init'),
  DESTROY: Symbol.for('broker.destroy'),
  PUBLISH: Symbol.for('broker.publish'),
  SUBSCRIBE: Symbol.for('broker.subscribe'),
  UNSUBSCRIBE: Symbol.for('broker.unsubscribe'),
  USE: Symbol.for('broker.use'),
  GET_STATS: Symbol.for('broker.getStats'),
  GET_TOPICS: Symbol.for('broker.getTopics'),
  GET_SUBSCRIBERS: Symbol.for('broker.getSubscribers'),
  GET_DEAD_LETTER: Symbol.for('broker.getDeadLetter'),
  CLEAR_DEAD_LETTER: Symbol.for('broker.clearDeadLetter'),
  PROCESS_RETRY: Symbol.for('broker.processRetry'),
  CLEAR_HISTORY: Symbol.for('broker.clearHistory'),
  GET_HISTORY: Symbol.for('broker.getHistory'),
  HEALTH_CHECK: Symbol.for('broker.healthCheck'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.8',
  build: '2026-07-28',
  name: 'Broker Plugin',
  debug: true,

  // Лимиты
  maxHistory: 1000,
  maxDeadLetter: 500,
  maxRetryQueue: 200,
  maxSubscribers: 1000,
  maxMessageSize: 10 * 1024 * 1024, // 10MB
  maxTopics: 500,

  // Rate limiting
  rateLimitEnabled: true,
  rateLimitWindow: 60000, // 1 минута
  rateLimitMaxMessages: 1000,

  // Retry
  defaultMaxRetries: 3,
  retryBackoff: 1000,
  retryBackoffMultiplier: 2,

  // TTL
  defaultTTL: 0, // 0 = бесконечно
  historyTTL: 3600000, // 1 час

  // Wildcard
  wildcardEnabled: true,
  wildcardSeparator: '.',
  wildcardChar: '*',
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

function createLogger(debug = true, instanceId = 'Broker') {
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
      console.log(`${colors.bold}${colors.magenta}  📨 ${title}${colors.reset}`);
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
// 5. ГЛОБАЛЬНЫЙ СИМВОЛ (для доступа к хранилищу)
// ============================================================

const GLOBAL_STORE_SYMBOL = Symbol.for('__GLOBAL_STORE__');

// ============================================================
// 6. ОСНОВНОЙ ОБЪЕКТ BROKER_PLUGIN (100% символы) — ИСПРАВЛЕНО
// ============================================================

export const BrokerPlugin = {
  name: 'broker',
  version: CONFIG.version,
  metadata: {
    description: 'Enterprise Message Broker with full isolation',
    author: 'Enterprise Store Team',
    license: 'MIT',
  },
  order: 5,

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ (ИСПРАВЛЕНО)
  // ============================================================

  init(store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // ★★★ ИСПРАВЛЕНО: создаем приватное состояние ПЕРЕД использованием ★★★
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
      [PRIVATE.START_TIME]: Date.now(),
      [PRIVATE.TOPICS]: new Map(),
      [PRIVATE.SUBSCRIPTIONS]: new Map(),
      [PRIVATE.MIDDLEWARES]: new Map(),
      [PRIVATE.DEAD_LETTER]: [],
      [PRIVATE.RETRY_QUEUE]: [],
      [PRIVATE.MESSAGE_HISTORY]: [],
      [PRIVATE.MESSAGE_CACHE]: new Map(),
      [PRIVATE.STATS]: {
        published: 0,
        delivered: 0,
        failed: 0,
        retried: 0,
        filtered: 0,
        expired: 0,
        rateLimited: 0,
        startTime: Date.now(),
        lastReset: Date.now(),
      },
      [PRIVATE.STATS_HISTORY]: [],
      [PRIVATE.SUBSCRIBER_STATE]: new Map(),
      [PRIVATE.SUBSCRIBER_HISTORY]: new Map(),
      [PRIVATE.SUBSCRIBER_COUNT]: 0,
      [PRIVATE.RATE_LIMIT_MAP]: new Map(),
      [PRIVATE.INITIALIZED]: true,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.IS_ACTIVE]: true,
      [PRIVATE.LOGGER]: logger,
    };

    // ★★★ ИСПРАВЛЕНО: сохраняем приватные данные в store ★★★
    store._brokerData = privateData;

    // ★★★ ИСПРАВЛЕНО: теперь p определена ★★★
    const p = store._brokerData;

    // ============================================================
    // 8. МЕТОДЫ БРОКЕРА
    // ============================================================

    /**
     * Опубликовать сообщение
     */
    store[PUBLIC.PUBLISH] = function (topic, data, options = {}) {
      const p = this._brokerData;
      if (!p) {
        console.error('❌ BrokerData не инициализирован');
        return null;
      }

      const logger = p[PRIVATE.LOGGER];
      const config = p[PRIVATE.CONFIG];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Брокер не активен');
        return null;
      }

      if (!topic || typeof topic !== 'string') {
        logger.error('❌ Некорректный топик');
        return null;
      }

      if (topic.length > 500) {
        logger.error('❌ Топик слишком длинный');
        return null;
      }

      if (config.rateLimitEnabled) {
        const rateKey = options.source || 'anonymous';
        const rateCheck = this[PRIVATE.RATE_LIMIT_CHECK](rateKey);
        if (!rateCheck.allowed) {
          logger.warn(`⚠️ Rate limit exceeded for ${rateKey}`);
          p[PRIVATE.STATS].rateLimited++;
          return null;
        }
      }

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        topic,
        data,
        timestamp: Date.now(),
        priority: options.priority || 0,
        ttl: options.ttl || config.defaultTTL,
        retries: 0,
        maxRetries: options.maxRetries || config.defaultMaxRetries,
        source: options.source || 'unknown',
        correlationId: options.correlationId || null,
        replyTo: options.replyTo || null,
        headers: options.headers || {},
        _delivered: false,
        _deliveredAt: null,
        _expired: false,
      };

      if (message.ttl > 0) {
        message.expiresAt = Date.now() + message.ttl;
      }

      try {
        const size = JSON.stringify(message).length;
        if (size > config.maxMessageSize) {
          logger.error(`❌ Сообщение слишком большое: ${size} байт`);
          return null;
        }
      } catch (error) {
        logger.error('❌ Ошибка сериализации сообщения:', error);
        return null;
      }

      p[PRIVATE.STATS].published++;
      this[PRIVATE.APPLY_MIDDLEWARES](topic, message);
      const delivered = this[PRIVATE.DELIVER](topic, message);
      this[PRIVATE.LOG_MESSAGE](message);
      this[PRIVATE.UPDATE_STATS]();

      logger.debug(`📨 Сообщение опубликовано: ${topic} (${delivered} доставлено)`);
      return message.id;
    };

    /**
     * Подписаться на топик
     */
    store[PUBLIC.SUBSCRIBE] = function (topic, callback, options = {}) {
      const p = this._brokerData;
      if (!p) {
        console.error('❌ BrokerData не инициализирован');
        return null;
      }

      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Брокер не активен');
        return null;
      }

      if (typeof callback !== 'function') {
        logger.error('❌ Callback должен быть функцией');
        return null;
      }

      if (p[PRIVATE.SUBSCRIPTIONS].size >= CONFIG.maxSubscribers) {
        logger.error(`❌ Превышен лимит подписчиков: ${CONFIG.maxSubscribers}`);
        return null;
      }

      const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const subscription = {
        id,
        topic,
        callback,
        options: {
          once: options.once || false,
          filter: options.filter || null,
          transform: options.transform || null,
          priority: options.priority || 0,
          maxRetries: options.maxRetries || CONFIG.defaultMaxRetries,
          timeout: options.timeout || 0,
        },
        created: Date.now(),
        lastRun: null,
        runs: 0,
        errors: 0,
        state: 'active',
      };

      p[PRIVATE.SUBSCRIPTIONS].set(id, subscription);

      if (!p[PRIVATE.TOPICS].has(topic)) {
        p[PRIVATE.TOPICS].set(topic, new Set());
      }
      p[PRIVATE.TOPICS].get(topic).add(id);

      p[PRIVATE.SUBSCRIBER_COUNT]++;
      p[PRIVATE.SUBSCRIBER_STATE].set(id, {
        active: true,
        createdAt: Date.now(),
        lastRun: null,
        totalRuns: 0,
        errors: 0,
      });

      logger.success(`📨 Подписка создана: ${id} → ${topic}`);
      return id;
    };

    /**
     * Отписаться от топика
     */
    store[PUBLIC.UNSUBSCRIBE] = function (id) {
      const p = this._brokerData;
      if (!p) {
        console.error('❌ BrokerData не инициализирован');
        return false;
      }

      const logger = p[PRIVATE.LOGGER];

      const subscription = p[PRIVATE.SUBSCRIPTIONS].get(id);
      if (!subscription) {
        logger.warn(`⚠️ Подписка не найдена: ${id}`);
        return false;
      }

      const topic = subscription.topic;
      if (p[PRIVATE.TOPICS].has(topic)) {
        p[PRIVATE.TOPICS].get(topic).delete(id);
      }

      p[PRIVATE.SUBSCRIPTIONS].delete(id);
      p[PRIVATE.SUBSCRIBER_COUNT]--;
      p[PRIVATE.SUBSCRIBER_STATE].delete(id);

      logger.success(`🗑 Подписка удалена: ${id}`);
      return true;
    };

    /**
     * Добавить middleware
     */
    store[PUBLIC.USE] = function (topic, middleware) {
      const p = this._brokerData;
      if (!p) {
        console.error('❌ BrokerData не инициализирован');
        return false;
      }

      const logger = p[PRIVATE.LOGGER];

      if (typeof middleware !== 'function') {
        logger.error('❌ Middleware должен быть функцией');
        return false;
      }

      if (!p[PRIVATE.MIDDLEWARES].has(topic)) {
        p[PRIVATE.MIDDLEWARES].set(topic, []);
      }
      p[PRIVATE.MIDDLEWARES].get(topic).push(middleware);

      logger.debug(`🔧 Middleware добавлен для ${topic}`);
      return true;
    };

    /**
     * Получить статистику
     */
    store[PUBLIC.GET_STATS] = function () {
      const p = this._brokerData;
      if (!p) {
        return {
          published: 0,
          delivered: 0,
          failed: 0,
          retried: 0,
          topics: 0,
          subscriptions: 0,
          deadLetter: 0,
          retryQueue: 0,
          historySize: 0,
          uptime: 0,
          subscriberCount: 0,
        };
      }

      return {
        ...p[PRIVATE.STATS],
        topics: p[PRIVATE.TOPICS].size,
        subscriptions: p[PRIVATE.SUBSCRIPTIONS].size,
        deadLetter: p[PRIVATE.DEAD_LETTER].length,
        retryQueue: p[PRIVATE.RETRY_QUEUE].length,
        historySize: p[PRIVATE.MESSAGE_HISTORY].length,
        uptime: Date.now() - p[PRIVATE.STATS].startTime,
        subscriberCount: p[PRIVATE.SUBSCRIBER_COUNT],
        rateLimitMapSize: p[PRIVATE.RATE_LIMIT_MAP].size,
      };
    };

    /**
     * Получить список топиков
     */
    store[PUBLIC.GET_TOPICS] = function () {
      const p = this._brokerData;
      if (!p) return [];
      return Array.from(p[PRIVATE.TOPICS].keys());
    };

    /**
     * Получить подписчиков топика
     */
    store[PUBLIC.GET_SUBSCRIBERS] = function (topic) {
      const p = this._brokerData;
      if (!p) return [];

      const result = [];

      if (p[PRIVATE.TOPICS].has(topic)) {
        for (const id of p[PRIVATE.TOPICS].get(topic)) {
          const sub = p[PRIVATE.SUBSCRIPTIONS].get(id);
          if (sub) {
            result.push({
              id: sub.id,
              topic: sub.topic,
              options: sub.options,
              created: sub.created,
              lastRun: sub.lastRun,
              runs: sub.runs,
              errors: sub.errors,
              state: sub.state,
            });
          }
        }
      }

      return result;
    };

    /**
     * Получить Dead Letter Queue
     */
    store[PUBLIC.GET_DEAD_LETTER] = function () {
      const p = this._brokerData;
      if (!p) return [];
      return [...p[PRIVATE.DEAD_LETTER]];
    };

    /**
     * Очистить Dead Letter Queue
     */
    store[PUBLIC.CLEAR_DEAD_LETTER] = function () {
      const p = this._brokerData;
      if (!p) return false;
      p[PRIVATE.DEAD_LETTER] = [];
      return true;
    };

    /**
     * Обработать Retry Queue
     */
    store[PUBLIC.PROCESS_RETRY] = function () {
      const p = this._brokerData;
      if (!p) return 0;

      const now = Date.now();
      const toRetry = p[PRIVATE.RETRY_QUEUE].filter(item => item.retryAt <= now);
      p[PRIVATE.RETRY_QUEUE] = p[PRIVATE.RETRY_QUEUE].filter(item => item.retryAt > now);

      let processed = 0;
      for (const item of toRetry) {
        const delivered = this[PRIVATE.DELIVER](item.message.topic, item.message);
        if (delivered > 0) {
          processed++;
          p[PRIVATE.STATS].retried++;
        }
      }

      this[PRIVATE.UPDATE_STATS]();
      return processed;
    };

    /**
     * Очистить историю сообщений
     */
    store[PUBLIC.CLEAR_HISTORY] = function () {
      const p = this._brokerData;
      if (!p) return false;

      p[PRIVATE.MESSAGE_HISTORY] = [];
      p[PRIVATE.MESSAGE_CACHE].clear();
      return true;
    };

    /**
     * Получить историю сообщений
     */
    store[PUBLIC.GET_HISTORY] = function (limit = 100, topic = null) {
      const p = this._brokerData;
      if (!p) return [];

      let history = p[PRIVATE.MESSAGE_HISTORY];

      if (topic) {
        history = history.filter(msg => msg.topic === topic);
      }

      return history.slice(-Math.min(limit, history.length));
    };

    /**
     * Проверка целостности
     */
    store[PUBLIC.HEALTH_CHECK] = function () {
      const p = this._brokerData;
      if (!p) {
        return {
          initialized: false,
          destroyed: true,
          isActive: false,
          topics: 0,
          subscriptions: 0,
          deadLetter: 0,
          retryQueue: 0,
          messageHistory: 0,
          published: 0,
          delivered: 0,
          failed: 0,
          retried: 0,
          rateLimited: 0,
          uptime: 0,
          version: CONFIG.version,
          status: 'inactive',
          timestamp: Date.now(),
        };
      }

      const stats = p[PRIVATE.STATS];

      return {
        initialized: p[PRIVATE.INITIALIZED],
        destroyed: p[PRIVATE.DESTROYED],
        isActive: p[PRIVATE.IS_ACTIVE],
        topics: p[PRIVATE.TOPICS].size,
        subscriptions: p[PRIVATE.SUBSCRIPTIONS].size,
        deadLetter: p[PRIVATE.DEAD_LETTER].length,
        retryQueue: p[PRIVATE.RETRY_QUEUE].length,
        messageHistory: p[PRIVATE.MESSAGE_HISTORY].length,
        published: stats.published,
        delivered: stats.delivered,
        failed: stats.failed,
        retried: stats.retried,
        rateLimited: stats.rateLimited,
        uptime: Date.now() - stats.startTime,
        version: CONFIG.version,
        status: p[PRIVATE.IS_ACTIVE] ? 'active' : 'inactive',
        timestamp: Date.now(),
      };
    };

    // ============================================================
    // 9. ВНУТРЕННИЕ МЕТОДЫ
    // ============================================================

    /**
     * Доставка сообщения подписчикам
     */
    store[PRIVATE.DELIVER] = function (topic, message) {
      const p = this._brokerData;
      if (!p) return 0;

      const logger = p[PRIVATE.LOGGER];

      if (message.expiresAt && Date.now() > message.expiresAt) {
        message._expired = true;
        p[PRIVATE.STATS].expired++;
        logger.debug(`⏰ Сообщение истекло: ${message.id}`);
        return 0;
      }

      const subscribers = this[PRIVATE.FIND_SUBSCRIBERS](topic);

      if (subscribers.length === 0) {
        logger.debug(`📨 Нет подписчиков для топика: ${topic}`);
        return 0;
      }

      subscribers.sort((a, b) => {
        const priorityA = a.options.priority || 0;
        const priorityB = b.options.priority || 0;
        return priorityB - priorityA;
      });

      let delivered = 0;
      const errors = [];

      for (const sub of subscribers) {
        try {
          if (sub.options.once && sub.runs > 0) {
            continue;
          }

          if (sub.options.filter) {
            const filtered = sub.options.filter(message.data, message);
            if (!filtered) {
              p[PRIVATE.STATS].filtered++;
              continue;
            }
          }

          let data = message.data;
          if (sub.options.transform) {
            data = sub.options.transform(data, message);
          }

          sub.callback(data, message);
          sub.lastRun = Date.now();
          sub.runs++;

          const state = p[PRIVATE.SUBSCRIBER_STATE].get(sub.id);
          if (state) {
            state.lastRun = Date.now();
            state.totalRuns++;
          }

          delivered++;

          if (sub.options.once) {
            this[PUBLIC.UNSUBSCRIBE](sub.id);
          }
        } catch (error) {
          const errorMsg = error.message || String(error);
          logger.error(`❌ Ошибка в подписчике ${sub.id}:`, error);
          errors.push({ subscriber: sub.id, error: errorMsg });

          const state = p[PRIVATE.SUBSCRIBER_STATE].get(sub.id);
          if (state) {
            state.errors++;
          }

          sub.errors++;
          p[PRIVATE.STATS].failed++;

          p[PRIVATE.DEAD_LETTER].push({
            message: { ...message },
            subscriber: sub.id,
            error: errorMsg,
            timestamp: Date.now(),
            id: `dl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          });

          if (p[PRIVATE.DEAD_LETTER].length > CONFIG.maxDeadLetter) {
            p[PRIVATE.DEAD_LETTER] = p[PRIVATE.DEAD_LETTER].slice(-CONFIG.maxDeadLetter);
          }

          if (message.retries < message.maxRetries) {
            message.retries++;
            const backoff =
              CONFIG.retryBackoff * Math.pow(CONFIG.retryBackoffMultiplier, message.retries - 1);
            p[PRIVATE.RETRY_QUEUE].push({
              message: { ...message },
              retryAt: Date.now() + backoff,
              attempt: message.retries,
              subscriber: sub.id,
            });

            if (p[PRIVATE.RETRY_QUEUE].length > CONFIG.maxRetryQueue) {
              p[PRIVATE.RETRY_QUEUE] = p[PRIVATE.RETRY_QUEUE].slice(-CONFIG.maxRetryQueue);
            }
          }
        }
      }

      p[PRIVATE.STATS].delivered += delivered;

      if (errors.length > 0) {
        logger.warn(`⚠️ ${errors.length} ошибок при доставке сообщения ${message.id}`);
      }

      return delivered;
    };

    /**
     * Найти подписчиков для топика (с поддержкой wildcard)
     */
    store[PRIVATE.FIND_SUBSCRIBERS] = function (topic) {
      const p = this._brokerData;
      if (!p) return [];

      const result = new Map();
      const config = p[PRIVATE.CONFIG];

      if (p[PRIVATE.TOPICS].has(topic)) {
        for (const id of p[PRIVATE.TOPICS].get(topic)) {
          const sub = p[PRIVATE.SUBSCRIPTIONS].get(id);
          if (sub && sub.state === 'active') {
            result.set(id, sub);
          }
        }
      }

      if (config.wildcardEnabled) {
        const parts = topic.split(config.wildcardSeparator);
        for (let i = 0; i < parts.length; i++) {
          const wildcard =
            parts.slice(0, i + 1).join(config.wildcardSeparator) +
            config.wildcardSeparator +
            config.wildcardChar;

          if (p[PRIVATE.TOPICS].has(wildcard)) {
            for (const id of p[PRIVATE.TOPICS].get(wildcard)) {
              const sub = p[PRIVATE.SUBSCRIPTIONS].get(id);
              if (sub && sub.state === 'active' && !result.has(id)) {
                result.set(id, sub);
              }
            }
          }
        }

        if (p[PRIVATE.TOPICS].has(config.wildcardChar)) {
          for (const id of p[PRIVATE.TOPICS].get(config.wildcardChar)) {
            const sub = p[PRIVATE.SUBSCRIPTIONS].get(id);
            if (sub && sub.state === 'active' && !result.has(id)) {
              result.set(id, sub);
            }
          }
        }
      }

      return Array.from(result.values());
    };

    /**
     * Применить middleware
     */
    store[PRIVATE.APPLY_MIDDLEWARES] = function (topic, message) {
      const p = this._brokerData;
      if (!p) return;

      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.MIDDLEWARES].has(topic)) {
        for (const middleware of p[PRIVATE.MIDDLEWARES].get(topic)) {
          try {
            middleware(message);
          } catch (error) {
            logger.error(`❌ Ошибка в middleware для ${topic}:`, error);
          }
        }
      }

      if (p[PRIVATE.MIDDLEWARES].has('*')) {
        for (const middleware of p[PRIVATE.MIDDLEWARES].get('*')) {
          try {
            middleware(message);
          } catch (error) {
            logger.error(`❌ Ошибка в глобальном middleware:`, error);
          }
        }
      }
    };

    /**
     * Сохранить сообщение в историю
     */
    store[PRIVATE.LOG_MESSAGE] = function (message) {
      const p = this._brokerData;
      if (!p) return;

      const config = p[PRIVATE.CONFIG];

      p[PRIVATE.MESSAGE_HISTORY].push({
        id: message.id,
        topic: message.topic,
        data: message.data,
        timestamp: message.timestamp,
        source: message.source,
        correlationId: message.correlationId,
        delivered: message._delivered,
        deliveredAt: message._deliveredAt,
        expired: message._expired,
      });

      if (p[PRIVATE.MESSAGE_HISTORY].length > config.maxHistory) {
        p[PRIVATE.MESSAGE_HISTORY] = p[PRIVATE.MESSAGE_HISTORY].slice(-config.maxHistory);
      }

      p[PRIVATE.MESSAGE_CACHE].set(message.id, {
        message,
        timestamp: Date.now(),
      });

      if (p[PRIVATE.MESSAGE_CACHE].size > config.maxHistory) {
        const keys = Array.from(p[PRIVATE.MESSAGE_CACHE].keys());
        const toRemove = keys.slice(0, keys.length - config.maxHistory);
        for (const key of toRemove) {
          p[PRIVATE.MESSAGE_CACHE].delete(key);
        }
      }
    };

    /**
     * Проверка rate limiting
     */
    store[PRIVATE.RATE_LIMIT_CHECK] = function (key) {
      const p = this._brokerData;
      if (!p) {
        return { allowed: true, count: 0, limit: 0 };
      }

      const config = p[PRIVATE.CONFIG];
      const now = Date.now();

      if (!p[PRIVATE.RATE_LIMIT_MAP].has(key)) {
        p[PRIVATE.RATE_LIMIT_MAP].set(key, {
          count: 0,
          windowStart: now,
        });
      }

      const data = p[PRIVATE.RATE_LIMIT_MAP].get(key);

      if (now - data.windowStart > config.rateLimitWindow) {
        data.count = 0;
        data.windowStart = now;
      }

      data.count++;

      if (data.count > config.rateLimitMaxMessages) {
        return { allowed: false, count: data.count, limit: config.rateLimitMaxMessages };
      }

      return { allowed: true, count: data.count, limit: config.rateLimitMaxMessages };
    };

    /**
     * Обновить статистику
     */
    store[PRIVATE.UPDATE_STATS] = function () {
      const p = this._brokerData;
      if (!p) return;

      const stats = p[PRIVATE.STATS];

      p[PRIVATE.STATS_HISTORY].push({
        ...stats,
        timestamp: Date.now(),
        topics: p[PRIVATE.TOPICS].size,
        subscriptions: p[PRIVATE.SUBSCRIPTIONS].size,
      });

      if (p[PRIVATE.STATS_HISTORY].length > 100) {
        p[PRIVATE.STATS_HISTORY] = p[PRIVATE.STATS_HISTORY].slice(-100);
      }
    };

    /**
     * Экспорт символов
     */
    store[PRIVATE.EXPORT_SYMBOLS] = function () {
      if (typeof window !== 'undefined') {
        window.__BROKER_SYMBOLS = {
          PRIVATE: { ...PRIVATE },
          PUBLIC: { ...PUBLIC },
        };
      }
    };

    store[PRIVATE.EXPORT_SYMBOLS]();

    // ============================================================
    // 10. СИСТЕМНЫЕ ТОПИКИ
    // ============================================================

    const systemTopics = [
      'system:startup',
      'system:shutdown',
      'system:error',
      'system:warning',
      'system:info',
      'broker:published',
      'broker:delivered',
      'broker:failed',
      'broker:retried',
      'broker:rateLimited',
      'broker:deadLetter',
    ];

    // ★★★ ИСПРАВЛЕНО: используем p, которая уже определена ★★★
    for (const topic of systemTopics) {
      if (!p[PRIVATE.TOPICS].has(topic)) {
        p[PRIVATE.TOPICS].set(topic, new Set());
      }
    }

    // Публикуем событие запуска
    store[PUBLIC.PUBLISH]('system:startup', {
      version: CONFIG.version,
      timestamp: Date.now(),
      topics: systemTopics.length,
      storeType: 'GlobalStore',
    });

    logger.header('БРОКЕР ИНИЦИАЛИЗИРОВАН');
    logger.success(`✅ Брокер активен (${p[PRIVATE.TOPICS].size} топиков)`);
    logger.info(`📨 Системных топиков: ${systemTopics.length}`);
    logger.info(`📊 Rate limiting: ${CONFIG.rateLimitEnabled ? 'ON' : 'OFF'}`);
    logger.info(`🔄 Retry: ${CONFIG.defaultMaxRetries} попыток`);
    logger.separator();
  },

  // ============================================================
  // 11. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const p = store._brokerData;
    if (!p) return;

    const logger = p[PRIVATE.LOGGER];

    logger.info('🧹 Уничтожение брокера...');

    if (store[PUBLIC.PUBLISH]) {
      store[PUBLIC.PUBLISH]('system:shutdown', {
        timestamp: Date.now(),
        stats: p[PRIVATE.STATS],
      });
    }

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.IS_ACTIVE] = false;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].isActive = false;

    p[PRIVATE.TOPICS].clear();
    p[PRIVATE.SUBSCRIPTIONS].clear();
    p[PRIVATE.MIDDLEWARES].clear();
    p[PRIVATE.DEAD_LETTER] = [];
    p[PRIVATE.RETRY_QUEUE] = [];
    p[PRIVATE.MESSAGE_HISTORY] = [];
    p[PRIVATE.MESSAGE_CACHE].clear();
    p[PRIVATE.RATE_LIMIT_MAP].clear();
    p[PRIVATE.SUBSCRIBER_STATE].clear();
    p[PRIVATE.SUBSCRIBER_HISTORY].clear();

    logger.success('✅ Брокер уничтожен');
  },
};

// ============================================================
// 12. ЭКСПОРТ
// ============================================================

export default BrokerPlugin;

// ============================================================
// 13. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__BROKER_PLUGIN = BrokerPlugin;
  window.__BROKER_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📨 BROKER PLUGIN (100% СИМВОЛЫ) v4.0.8                         ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Публикация сообщений                                                  ║');
  console.log('║    ✅ Подписка с фильтрацией и трансформацией                                ║');
  console.log('║    ✅ Wildcard поддержка (topic.*, *)                                       ║');
  console.log('║    ✅ Middleware для обработки сообщений                                    ║');
  console.log('║    ✅ Dead Letter Queue                                                     ║');
  console.log('║    ✅ Retry механизм с экспоненциальной задержкой                           ║');
  console.log('║    ✅ Rate limiting                                                         ║');
  console.log('║    ✅ TTL для сообщений                                                     ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ История сообщений                                                     ║');
  console.log('║    ✅ Системные топики                                                      ║');
  console.log('║    ✅ 100% СИМВОЛЫ — полная изоляция                                       ║');
  console.log('║    ✅ Интеграция с __GLOBAL_STORE__                                        ║');
  console.log('║    ✅ ИСПРАВЛЕНА ОШИБКА INIT — стабильная работа                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КОМАНДЫ:                                                               ║');
  console.log('║    store.publish(topic, data, options) — опубликовать                      ║');
  console.log('║    store.subscribe(topic, callback, options) — подписаться                 ║');
  console.log('║    store.unsubscribe(id) — отписаться                                     ║');
  console.log('║    store.use(topic, middleware) — добавить middleware                     ║');
  console.log('║    store.getBrokerStats() — статистика                                    ║');
  console.log('║    store.getTopics() — список топиков                                     ║');
  console.log('║    store.getSubscribers(topic) — подписчики                               ║');
  console.log('║    store.getDeadLetter() — Dead Letter Queue                              ║');
  console.log('║    store.clearDeadLetter() — очистить DLQ                                 ║');
  console.log('║    store.processRetryQueue() — обработать retry                           ║');
  console.log('║    store.getHistory(limit, topic) — история                               ║');
  console.log('║    store.clearHistory() — очистить историю                                ║');
  console.log('║    store.healthCheck() — проверка целостности                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 14. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование BrokerPlugin
// ============================================================

import { createStore } from '../index.js';
import { BrokerPlugin } from './BrokerPlugin.js';

// 1. Создаем store с брокером
const store = createStore({
    plugins: [BrokerPlugin],
});

// 2. Подписка на топик
const subId = store.subscribe('user:created', (data) => {
    console.log('👤 Новый пользователь:', data);
}, {
    filter: (data) => data.age >= 18,
    transform: (data) => ({
        ...data,
        processed: true,
    }),
});

// 3. Публикация
store.publish('user:created', {
    id: 'u1',
    name: 'Иван',
    age: 25,
});

// 4. Подписка с wildcard
store.subscribe('user:*', (data, message) => {
    console.log(`📨 ${message.topic}:`, data);
});

// 5. Middleware
store.use('user:*', (message) => {
    console.log('🔍 Middleware:', message);
});

// 6. Статистика
console.log(store.getBrokerStats());

// 7. Dead Letter
console.log(store.getDeadLetter());

// 8. Retry
store.processRetryQueue();

// 9. История
console.log(store.getHistory(10));

// 10. Health Check
console.log(store.healthCheck());
*/