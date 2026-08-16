// ============================================================
// plugins/AuditPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Плагин аудита для Enterprise Store с Immer
// Версия: 4.0.6
// ============================================================

import { produce } from 'immer';

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы
  VERSION: Symbol('audit.plugin.version'),
  BUILD: Symbol('audit.plugin.build'),
  NAME: Symbol('audit.plugin.name'),
  CONFIG: Symbol('audit.plugin.config'),
  STATE: Symbol('audit.plugin.state'),
  INITIALIZED: Symbol('audit.plugin.initialized'),
  DESTROYED: Symbol('audit.plugin.destroyed'),
  ENABLED: Symbol('audit.plugin.enabled'),

  // Данные аудита
  EVENTS: Symbol('audit.plugin.events'),
  MAX_EVENTS: Symbol('audit.plugin.maxEvents'),
  EXCLUDE: Symbol('audit.plugin.exclude'),
  FILTERS: Symbol('audit.plugin.filters'),

  // Сессия и пользователь
  SESSION_ID: Symbol('audit.plugin.sessionId'),
  USER_ID: Symbol('audit.plugin.userId'),
  CONTEXT: Symbol('audit.plugin.context'),

  // Хранилище
  STORE: Symbol('audit.plugin.store'),
  TABLE_NAME: Symbol('audit.plugin.tableName'),

  // Методы
  INIT: Symbol('audit.plugin.init'),
  DESTROY: Symbol('audit.plugin.destroy'),
  AUDIT: Symbol('audit.plugin.audit'),
  GET_AUDIT: Symbol('audit.plugin.getAudit'),
  CLEAR_AUDIT: Symbol('audit.plugin.clearAudit'),
  EXPORT_AUDIT: Symbol('audit.plugin.exportAudit'),
  IMPORT_AUDIT: Symbol('audit.plugin.importAudit'),
  SET_FILTER: Symbol('audit.plugin.setFilter'),
  CLEAR_FILTERS: Symbol('audit.plugin.clearFilters'),
  GET_STATS: Symbol('audit.plugin.getStats'),

  // Внутренние методы
  _INTERCEPT: Symbol('audit.plugin.intercept'),
  _LOG: Symbol('audit.plugin.log'),
  _GET_SESSION: Symbol('audit.plugin.getSession'),
  _GET_USER: Symbol('audit.plugin.getUser'),
  _GET_CONTEXT: Symbol('audit.plugin.getContext'),
  _SAVE: Symbol('audit.plugin.save'),
  _LOAD: Symbol('audit.plugin.load'),
  _CLEANUP: Symbol('audit.plugin.cleanup'),
  _FORMAT: Symbol('audit.plugin.format'),
  _VALIDATE: Symbol('audit.plugin.validate'),
  _SANITIZE: Symbol('audit.plugin.sanitize'),

  // Безопасность
  SECURE: Symbol('audit.plugin.secure'),
  ENCRYPT: Symbol('audit.plugin.encrypt'),
  DECRYPT: Symbol('audit.plugin.decrypt'),

  // Логгер
  LOGGER: Symbol('audit.plugin.logger'),
  LOG: Symbol('audit.plugin.log'),
  DEBUG: Symbol('audit.plugin.debug'),
  ERROR: Symbol('audit.plugin.error'),
  WARN: Symbol('audit.plugin.warn'),
  SUCCESS: Symbol('audit.plugin.success'),

  // Хуки
  HOOKS: Symbol('audit.plugin.hooks'),
  BEFORE_AUDIT: Symbol('audit.plugin.beforeAudit'),
  AFTER_AUDIT: Symbol('audit.plugin.afterAudit'),
  BEFORE_CLEAR: Symbol('audit.plugin.beforeClear'),
  AFTER_CLEAR: Symbol('audit.plugin.afterClear'),

  // Экспорт
  EXPORT_SYMBOLS: Symbol('audit.plugin.exportSymbols'),

  // IMMER
  IMMER_ENABLED: Symbol('audit.plugin.immerEnabled'),
  PRODUCE: Symbol('audit.plugin.produce'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('audit.plugin.instance'),
  STATE: Symbol.for('audit.plugin.state'),
  CONFIG: Symbol.for('audit.plugin.config'),
  INIT: Symbol.for('audit.plugin.init'),
  DESTROY: Symbol.for('audit.plugin.destroy'),
  AUDIT: Symbol.for('audit.plugin.audit'),
  GET_AUDIT: Symbol.for('audit.plugin.getAudit'),
  CLEAR_AUDIT: Symbol.for('audit.plugin.clearAudit'),
  EXPORT_AUDIT: Symbol.for('audit.plugin.exportAudit'),
  IMPORT_AUDIT: Symbol.for('audit.plugin.importAudit'),
  GET_STATS: Symbol.for('audit.plugin.getStats'),
  SET_FILTER: Symbol.for('audit.plugin.setFilter'),
  CLEAR_FILTERS: Symbol.for('audit.plugin.clearFilters'),
  HEALTH_CHECK: Symbol.for('audit.plugin.healthCheck'),
  WITH_IMMER: Symbol.for('audit.plugin.withImmer'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.6',
  build: '2026-07-28',
  name: 'Audit Plugin',
  debug: true,
  defaultMaxEvents: 10000,
  defaultTableName: '_audit',
  defaultExclude: ['healthCheck', 'getStats'],
  autoSave: true,
  saveInterval: 30000,
  encryption: false,
  encryptionKey: null,
  compression: false,
  retentionDays: 30,
  immerEnabled: true,
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

function createLogger(debug = true, instanceId = 'AuditPlugin') {
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
        '%c  📋 ' + title,
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
// 5. ОСНОВНОЙ КЛАСС AUDIT_PLUGIN (100% символы + IMMER)
// ============================================================

export const AuditPlugin = {
  // Имя плагина (публичное свойство)
  name: 'audit',

  // Метаданные
  metadata: {
    description: 'Полный аудит всех действий в хранилище с Immer',
    version: CONFIG.version,
    author: 'Enterprise Store Team',
    dependencies: ['persistence'],
  },

  // ============================================================
  // 5.1. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT](store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);
    const config = store._?.[Symbol('store.config')] || {};

    // Инициализируем внутреннее состояние
    this._auditLog = [];
    this._auditMaxSize = config.maxAuditEvents || CONFIG.defaultMaxEvents;
    this._auditStats = {
      total: 0,
      byAction: {},
      byUser: {},
      bySession: {},
      lastEntry: null,
      lastClear: null,
      startTime: Date.now(),
    };
    this._auditFilters = {};
    this._auditExclude = config.auditExclude || CONFIG.defaultExclude;
    this._auditTableName = config.auditTable || CONFIG.defaultTableName;
    this._isEnabled = config.audit !== false;
    this._immerEnabled = CONFIG.immerEnabled;
    this._produce = produce;

    // Приватное состояние
    const state = {
      [PRIVATE.ENABLED]: this._isEnabled,
      [PRIVATE.EVENTS]: this._auditLog,
      [PRIVATE.MAX_EVENTS]: this._auditMaxSize,
      [PRIVATE.EXCLUDE]: this._auditExclude,
      [PRIVATE.FILTERS]: this._auditFilters,
      [PRIVATE.TABLE_NAME]: this._auditTableName,
      [PRIVATE.STORE]: store,
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.SESSION_ID]: null,
      [PRIVATE.USER_ID]: null,
      [PRIVATE.CONTEXT]: {},
      [PRIVATE.IMMER_ENABLED]: this._immerEnabled,
      [PRIVATE.PRODUCE]: this._produce,
      [PRIVATE.HOOKS]: {
        [PRIVATE.BEFORE_AUDIT]: new Map(),
        [PRIVATE.AFTER_AUDIT]: new Map(),
        [PRIVATE.BEFORE_CLEAR]: new Map(),
        [PRIVATE.AFTER_CLEAR]: new Map(),
      },
    };

    // Сохраняем состояние в плагине
    this._state = state;
    this._logger = logger;

    if (!state[PRIVATE.ENABLED]) {
      logger.warn('⚠️ Audit Plugin отключен');
      return;
    }

    logger.header('ИНИЦИАЛИЗАЦИЯ AUDIT PLUGIN (100% СИМВОЛЫ + IMMER)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`📌 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.info(`🔄 Immer: ${this._immerEnabled ? '✅' : '❌'}`);
    logger.separator();

    // Инициализируем сессию
    state[PRIVATE.SESSION_ID] = this[PRIVATE._GET_SESSION]();
    state[PRIVATE.USER_ID] = this[PRIVATE._GET_USER]();
    state[PRIVATE.CONTEXT] = this[PRIVATE._GET_CONTEXT]();

    // Создаем таблицу аудита
    this[PRIVATE._initTable](store);

    // Перехватываем операции
    this[PRIVATE._INTERCEPT](store);

    // Настраиваем авто-сохранение
    if (CONFIG.autoSave) {
      setInterval(() => {
        this[PRIVATE._SAVE]();
      }, CONFIG.saveInterval);
    }

    state[PRIVATE.INITIALIZED] = true;

    // Экспортируем символы
    this[PRIVATE.EXPORT_SYMBOLS]();

    logger.success('✅ Audit Plugin инициализирован с Immer');
    logger.info(`📋 Максимум событий: ${state[PRIVATE.MAX_EVENTS]}`);
    logger.info(`📋 Исключения: ${state[PRIVATE.EXCLUDE].join(', ')}`);
    logger.info(`🆔 Сессия: ${state[PRIVATE.SESSION_ID]}`);
    logger.header('ГОТОВ');

    // Логируем первый старт
    this[PRIVATE.AUDIT]('system:startup', {
      version: CONFIG.version,
      sessionId: state[PRIVATE.SESSION_ID],
      userId: state[PRIVATE.USER_ID],
      timestamp: Date.now(),
    });
  },

  // ============================================================
  // 5.2. ИНИЦИАЛИЗАЦИЯ ТАБЛИЦЫ
  // ============================================================

  [PRIVATE._initTable](store) {
    const state = this._state;
    const tableName = state[PRIVATE.TABLE_NAME];

    // Проверяем, существует ли таблица
    if (store.getTable(tableName)) {
      return;
    }

    // Создаем таблицу аудита
    store.createTable(tableName, {
      schema: {
        id: { type: 'string', required: true },
        action: { type: 'string', required: true },
        data: { type: 'object' },
        timestamp: { type: 'number', required: true },
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        ip: { type: 'string' },
        userAgent: { type: 'string' },
        context: { type: 'object' },
        metadata: { type: 'object' },
      },
      indexes: ['action', 'timestamp', 'sessionId', 'userId'],
      metadata: {
        description: 'Аудит-лог всех действий',
        version: CONFIG.version,
      },
    });

    this._logger.success(`📋 Таблица аудита создана: ${tableName}`);
  },

  // ============================================================
  // 5.3. ПЕРЕХВАТ ОПЕРАЦИЙ
  // ============================================================

  [PRIVATE._INTERCEPT](store) {
    const state = this._state;
    const logger = this._logger;

    // Сохраняем оригинальные методы
    const originalAdd = store._add.bind(store);
    const originalUpdate = store._update.bind(store);
    const originalRemove = store._remove.bind(store);
    const originalClear = store._clear.bind(store);
    const originalDrop = store.dropTable?.bind(store);

    // Перехватываем INSERT
    store._add = (name, rows) => {
      const result = originalAdd(name, rows);
      if (state[PRIVATE.ENABLED] && !state[PRIVATE.EXCLUDE].includes('insert')) {
        this[PRIVATE.AUDIT]('data:insert', {
          table: name,
          rows: Array.isArray(rows) ? rows : [rows],
          count: Array.isArray(rows) ? rows.length : 1,
          result: result,
        });
      }
      return result;
    };

    // Перехватываем UPDATE
    store._update = (name, query, data) => {
      const result = originalUpdate(name, query, data);
      if (state[PRIVATE.ENABLED] && !state[PRIVATE.EXCLUDE].includes('update')) {
        this[PRIVATE.AUDIT]('data:update', {
          table: name,
          query: query,
          data: data,
          updated: result?.length || 0,
        });
      }
      return result;
    };

    // Перехватываем DELETE
    store._remove = (name, query) => {
      const result = originalRemove(name, query);
      if (state[PRIVATE.ENABLED] && !state[PRIVATE.EXCLUDE].includes('delete')) {
        this[PRIVATE.AUDIT]('data:delete', {
          table: name,
          query: query,
          deleted: result?.length || 0,
        });
      }
      return result;
    };

    // Перехватываем CLEAR
    store._clear = name => {
      const result = originalClear(name);
      if (state[PRIVATE.ENABLED] && !state[PRIVATE.EXCLUDE].includes('clear')) {
        this[PRIVATE.AUDIT]('table:clear', {
          table: name,
          success: result,
        });
      }
      return result;
    };

    // Перехватываем DROP
    if (originalDrop) {
      store.dropTable = name => {
        const result = originalDrop(name);
        if (state[PRIVATE.ENABLED] && !state[PRIVATE.EXCLUDE].includes('drop')) {
          this[PRIVATE.AUDIT]('table:drop', {
            table: name,
            success: result,
          });
        }
        return result;
      };
    }

    // Перехватываем транзакции
    const originalBegin = store.begin?.bind(store);
    const originalCommit = store.commit?.bind(store);
    const originalRollback = store.rollback?.bind(store);

    if (originalBegin) {
      store.begin = name => {
        const result = originalBegin(name);
        if (state[PRIVATE.ENABLED]) {
          this[PRIVATE.AUDIT]('transaction:begin', {
            name: name || 'Transaction',
            id: result,
          });
        }
        return result;
      };
    }

    if (originalCommit) {
      store.commit = () => {
        const result = originalCommit();
        if (state[PRIVATE.ENABLED] && result) {
          this[PRIVATE.AUDIT]('transaction:commit', {
            success: true,
            timestamp: Date.now(),
          });
        }
        return result;
      };
    }

    if (originalRollback) {
      store.rollback = () => {
        const result = originalRollback();
        if (state[PRIVATE.ENABLED] && result) {
          this[PRIVATE.AUDIT]('transaction:rollback', {
            success: true,
            timestamp: Date.now(),
          });
        }
        return result;
      };
    }

    // Перехватываем мастер-детейл
    const originalLink = store.link?.bind(store);
    const originalSelect = store.select?.bind(store);
    const originalUnlink = store.unlinkTables?.bind(store);

    if (originalLink) {
      store.link = (master, detail, key) => {
        const result = originalLink(master, detail, key);
        if (state[PRIVATE.ENABLED]) {
          this[PRIVATE.AUDIT]('relation:link', {
            master,
            detail,
            key: key || 'masterId',
            success: !!result,
          });
        }
        return result;
      };
    }

    if (originalSelect) {
      store.select = (master, id) => {
        const result = originalSelect(master, id);
        if (state[PRIVATE.ENABLED]) {
          this[PRIVATE.AUDIT]('master:select', {
            master,
            id,
            details: Object.keys(result || {}),
          });
        }
        return result;
      };
    }

    if (originalUnlink) {
      store.unlinkTables = (master, detail) => {
        const result = originalUnlink(master, detail);
        if (state[PRIVATE.ENABLED] && result) {
          this[PRIVATE.AUDIT]('relation:unlink', {
            master,
            detail,
            success: true,
          });
        }
        return result;
      };
    }

    logger.debug('🔍 Перехват операций настроен');
  },

  // ============================================================
  // 5.4. ОСНОВНОЙ МЕТОД АУДИТА (С IMMER)
  // ============================================================

  [PRIVATE.AUDIT](action, data = {}) {
    const state = this._state;
    const logger = this._logger;
    const immerEnabled = state[PRIVATE.IMMER_ENABLED];
    const produceFn = state[PRIVATE.PRODUCE] || produce;

    // Проверяем, включен ли плагин
    if (!state[PRIVATE.ENABLED]) {
      return null;
    }

    // Выполняем хуки BEFORE_AUDIT
    if (state[PRIVATE.HOOKS][PRIVATE.BEFORE_AUDIT]) {
      for (const [, callback] of state[PRIVATE.HOOKS][PRIVATE.BEFORE_AUDIT]) {
        try {
          callback({ action, data });
        } catch (error) {
          logger.error('❌ Ошибка в BEFORE_AUDIT хуке:', error);
        }
      }
    }

    // Валидация
    const validation = this[PRIVATE._VALIDATE](action, data);
    if (!validation.valid) {
      logger.warn(`⚠️ Некорректный аудит: ${validation.error}`);
      return null;
    }

    // Санитизация
    const sanitized = this[PRIVATE._SANITIZE](action, data);

    // Создаем запись
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: sanitized.action,
      data: sanitized.data,
      timestamp: Date.now(),
      sessionId: state[PRIVATE.SESSION_ID] || this[PRIVATE._GET_SESSION](),
      userId: state[PRIVATE.USER_ID] || this[PRIVATE._GET_USER](),
      ip: this[PRIVATE._GET_IP](),
      userAgent: this[PRIVATE._GET_USER_AGENT](),
      context: this[PRIVATE._GET_CONTEXT](),
      metadata: {
        version: CONFIG.version,
        build: CONFIG.build,
        host: this[PRIVATE._GET_HOST](),
      },
    };

    // Шифрование
    const finalEntry = this[PRIVATE._ENCRYPT] ? this[PRIVATE._ENCRYPT](entry) : entry;

    // Сохраняем с использованием Immer
    if (immerEnabled) {
      // Используем Immer для иммутабельного обновления
      this._auditLog = produceFn(this._auditLog, (draft) => {
        draft.unshift(finalEntry);
        if (draft.length > state[PRIVATE.MAX_EVENTS]) {
          draft.length = state[PRIVATE.MAX_EVENTS];
        }
      });
    } else {
      // Без Immer
      this._auditLog.unshift(finalEntry);
      if (this._auditLog.length > state[PRIVATE.MAX_EVENTS]) {
        this._auditLog = this._auditLog.slice(0, state[PRIVATE.MAX_EVENTS]);
      }
    }

    // Обновляем статистику
    this._auditStats.total++;
    this._auditStats.byAction[entry.action] = (this._auditStats.byAction[entry.action] || 0) + 1;
    this._auditStats.byUser[entry.userId] = (this._auditStats.byUser[entry.userId] || 0) + 1;
    this._auditStats.bySession[entry.sessionId] = (this._auditStats.bySession[entry.sessionId] || 0) + 1;
    this._auditStats.lastEntry = entry;

    // Сохраняем в таблицу
    this[PRIVATE._SAVE_TO_TABLE](finalEntry);

    // Авто-сохранение
    if (CONFIG.autoSave && this._auditLog.length % 100 === 0) {
      this[PRIVATE._SAVE]();
    }

    // Выполняем хуки AFTER_AUDIT
    if (state[PRIVATE.HOOKS][PRIVATE.AFTER_AUDIT]) {
      for (const [, callback] of state[PRIVATE.HOOKS][PRIVATE.AFTER_AUDIT]) {
        try {
          callback({ entry, action, data });
        } catch (error) {
          logger.error('❌ Ошибка в AFTER_AUDIT хуке:', error);
        }
      }
    }

    // Логируем в консоль (если debug)
    if (CONFIG.debug) {
      logger.debug(`📋 Аудит: ${action}`, {
        id: entry.id,
        userId: entry.userId,
        data: sanitized.data,
      });
    }

    return entry;
  },

  // ============================================================
  // 5.5. ПОЛУЧЕНИЕ АУДИТА
  // ============================================================

  [PRIVATE.GET_AUDIT](filter = {}, limit = 50) {
    if (!this._auditLog) {
      return [];
    }

    let events = [...this._auditLog];

    // Применяем фильтры
    for (const [key, value] of Object.entries(filter)) {
      events = events.filter(e => {
        if (key === 'from') {
          return e.timestamp >= value;
        }
        if (key === 'to') {
          return e.timestamp <= value;
        }
        if (key === 'search') {
          const search = String(value).toLowerCase();
          return JSON.stringify(e).toLowerCase().includes(search);
        }
        return e[key] === value;
      });
    }

    // Сортировка по времени (новые сверху)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Расшифровка
    events = events.map(e => (this[PRIVATE._DECRYPT] ? this[PRIVATE._DECRYPT](e) : e));

    return events.slice(0, Math.min(limit, events.length));
  },

  // ============================================================
  // 5.6. ОЧИСТКА АУДИТА (С IMMER)
  // ============================================================

  [PRIVATE.CLEAR_AUDIT](filter = {}) {
    const state = this._state;
    const logger = this._logger;
    const immerEnabled = state[PRIVATE.IMMER_ENABLED];
    const produceFn = state[PRIVATE.PRODUCE] || produce;

    if (!state[PRIVATE.ENABLED]) {
      return false;
    }

    // Выполняем хуки BEFORE_CLEAR
    if (state[PRIVATE.HOOKS][PRIVATE.BEFORE_CLEAR]) {
      for (const [, callback] of state[PRIVATE.HOOKS][PRIVATE.BEFORE_CLEAR]) {
        try {
          callback({ filter });
        } catch (error) {
          logger.error('❌ Ошибка в BEFORE_CLEAR хуке:', error);
        }
      }
    }

    let removed = 0;

    if (Object.keys(filter).length === 0) {
      // Очищаем всё
      removed = this._auditLog.length;

      if (immerEnabled) {
        this._auditLog = produceFn(this._auditLog, () => []);
      } else {
        this._auditLog = [];
      }

      // Очищаем таблицу
      const store = state[PRIVATE.STORE];
      if (store && store.getTable(state[PRIVATE.TABLE_NAME])) {
        store.clearTable(state[PRIVATE.TABLE_NAME]);
      }
    } else {
      // Фильтрованная очистка
      const originalLength = this._auditLog.length;

      if (immerEnabled) {
        this._auditLog = produceFn(this._auditLog, (draft) => {
          for (let i = draft.length - 1; i >= 0; i--) {
            const e = draft[i];
            let match = true;
            for (const [key, value] of Object.entries(filter)) {
              if (e[key] !== value) {
                match = false;
                break;
              }
            }
            if (match) {
              draft.splice(i, 1);
              removed++;
            }
          }
        });
      } else {
        this._auditLog = this._auditLog.filter(e => {
          for (const [key, value] of Object.entries(filter)) {
            if (e[key] === value) {
              removed++;
              return false;
            }
          }
          return true;
        });
      }
    }

    // Обновляем статистику
    this._auditStats.lastClear = Date.now();
    this._auditStats.total = this._auditLog.length;

    // Выполняем хуки AFTER_CLEAR
    if (state[PRIVATE.HOOKS][PRIVATE.AFTER_CLEAR]) {
      for (const [, callback] of state[PRIVATE.HOOKS][PRIVATE.AFTER_CLEAR]) {
        try {
          callback({ filter, removed });
        } catch (error) {
          logger.error('❌ Ошибка в AFTER_CLEAR хуке:', error);
        }
      }
    }

    logger.success(`🧹 Очищено ${removed} записей аудита`);
    return removed;
  },

  // ============================================================
  // 5.7. ЭКСПОРТ АУДИТА
  // ============================================================

  [PRIVATE.EXPORT_AUDIT](format = 'json', filter = {}) {
    const events = this[PRIVATE.GET_AUDIT](filter, Infinity);

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    if (format === 'csv') {
      if (events.length === 0) return '';

      const headers = ['id', 'action', 'timestamp', 'userId', 'sessionId'];
      const rows = events.map(e => headers.map(h => JSON.stringify(e[h] || '')).join(','));
      return [headers.join(','), ...rows].join('\n');
    }

    if (format === 'html') {
      let html = '<table><thead><tr>';
      const headers = ['ID', 'Action', 'Timestamp', 'User', 'Data'];
      for (const h of headers) {
        html += `<th>${h}</th>`;
      }
      html += '</tr></thead><tbody>';
      for (const e of events) {
        html += `<tr>
                    <td>${e.id}</td>
                    <td>${e.action}</td>
                    <td>${new Date(e.timestamp).toISOString()}</td>
                    <td>${e.userId || 'anonymous'}</td>
                    <td>${JSON.stringify(e.data).substring(0, 50)}</td>
                </tr>`;
      }
      html += '</tbody></table>';
      return html;
    }

    return null;
  },

  // ============================================================
  // 5.8. ИМПОРТ АУДИТА
  // ============================================================

  [PRIVATE.IMPORT_AUDIT](data, format = 'json') {
    const state = this._state;
    const logger = this._logger;
    const immerEnabled = state[PRIVATE.IMMER_ENABLED];
    const produceFn = state[PRIVATE.PRODUCE] || produce;

    let events = [];

    if (format === 'json') {
      try {
        events = JSON.parse(data);
        if (!Array.isArray(events)) {
          events = [events];
        }
      } catch (error) {
        logger.error('❌ Ошибка парсинга JSON:', error);
        return false;
      }
    } else {
      logger.error(`❌ Формат ${format} не поддерживается для импорта`);
      return false;
    }

    let imported = 0;
    const validEvents = events.filter(event => event.action && event.timestamp);

    if (immerEnabled) {
      this._auditLog = produceFn(this._auditLog, (draft) => {
        for (const event of validEvents) {
          draft.push(event);
          imported++;
        }
        if (draft.length > state[PRIVATE.MAX_EVENTS]) {
          draft.length = state[PRIVATE.MAX_EVENTS];
        }
      });
    } else {
      for (const event of validEvents) {
        this._auditLog.push(event);
        imported++;
      }
      if (this._auditLog.length > state[PRIVATE.MAX_EVENTS]) {
        this._auditLog = this._auditLog.slice(-state[PRIVATE.MAX_EVENTS]);
      }
    }

    // Обновляем статистику
    this._auditStats.total = this._auditLog.length;

    logger.success(`📥 Импортировано ${imported} записей аудита`);
    return imported;
  },

  // ============================================================
  // 5.9. ФИЛЬТРЫ
  // ============================================================

  [PRIVATE.SET_FILTER](name, filter) {
    const state = this._state;
    state[PRIVATE.FILTERS][name] = filter;
    return true;
  },

  [PRIVATE.CLEAR_FILTERS]() {
    const state = this._state;
    state[PRIVATE.FILTERS] = {};
    return true;
  },

  // ============================================================
  // 5.10. СТАТИСТИКА
  // ============================================================

  [PRIVATE.GET_STATS]() {
    if (!this._auditLog) {
      return { enabled: false };
    }

    const events = this._auditLog;
    const actions = {};
    const users = new Set();
    const sessions = new Set();

    for (const e of events) {
      actions[e.action] = (actions[e.action] || 0) + 1;
      if (e.userId) users.add(e.userId);
      if (e.sessionId) sessions.add(e.sessionId);
    }

    return {
      enabled: true,
      totalEvents: events.length,
      maxEvents: this._auditMaxSize,
      actions,
      uniqueUsers: users.size,
      uniqueSessions: sessions.size,
      oldestEvent: events.length > 0 ? events[events.length - 1]?.timestamp : null,
      newestEvent: events.length > 0 ? events[0]?.timestamp : null,
      filters: this._auditFilters,
      exclude: this._auditExclude,
      version: CONFIG.version,
      immerEnabled: this._immerEnabled,
      stats: { ...this._auditStats },
    };
  },

  // ============================================================
  // 5.11. ХУКИ
  // ============================================================

  [PRIVATE.HOOK](event, callback) {
    const state = this._state;
    const hookMap = state[PRIVATE.HOOKS][event];

    if (!hookMap) {
      this._logger.warn(`⚠️ Неизвестный хук: ${event}`);
      return null;
    }

    const id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    hookMap.set(id, callback);

    return id;
  },

  [PRIVATE.UNHOOK](event, id) {
    const state = this._state;
    const hookMap = state[PRIVATE.HOOKS][event];

    if (!hookMap) {
      return false;
    }

    return hookMap.delete(id);
  },

  // ============================================================
  // 5.12. ВНУТРЕННИЕ МЕТОДЫ
  // ============================================================

  [PRIVATE._SAVE_TO_TABLE](entry) {
    const state = this._state;
    const store = state[PRIVATE.STORE];
    const tableName = state[PRIVATE.TABLE_NAME];

    if (store && store.getTable(tableName)) {
      try {
        store.insert(tableName, entry);
      } catch (error) {
        this._logger.error('❌ Ошибка сохранения в таблицу:', error);
      }
    }
  },

  [PRIVATE._SAVE]() {
    const state = this._state;
    const store = state[PRIVATE.STORE];

    if (store && store.save && typeof store.save === 'function') {
      try {
        store.save();
        this._logger.debug('💾 Аудит сохранен');
      } catch (error) {
        this._logger.error('❌ Ошибка сохранения аудита:', error);
      }
    }
  },

  [PRIVATE._GET_SESSION]() {
    try {
      let sessionId = sessionStorage?.getItem('_audit_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        sessionStorage?.setItem('_audit_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
  },

  [PRIVATE._GET_USER]() {
    try {
      return localStorage?.getItem('_audit_user_id') || 'anonymous';
    } catch {
      return 'anonymous';
    }
  },

  [PRIVATE._GET_IP]() {
    try {
      return '127.0.0.1';
    } catch {
      return 'unknown';
    }
  },

  [PRIVATE._GET_USER_AGENT]() {
    try {
      return navigator?.userAgent || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  [PRIVATE._GET_HOST]() {
    try {
      return window?.location?.host || 'localhost';
    } catch {
      return 'localhost';
    }
  },

  [PRIVATE._GET_CONTEXT]() {
    const state = this._state;
    return {
      ...state[PRIVATE.CONTEXT],
      timestamp: Date.now(),
      url: this[PRIVATE._GET_URL](),
      referrer: this[PRIVATE._GET_REFERRER](),
    };
  },

  [PRIVATE._GET_URL]() {
    try {
      return window?.location?.href || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  [PRIVATE._GET_REFERRER]() {
    try {
      return document?.referrer || 'direct';
    } catch {
      return 'direct';
    }
  },

  [PRIVATE._VALIDATE](action, data) {
    if (!action || typeof action !== 'string') {
      return { valid: false, error: 'Action должен быть строкой' };
    }

    if (action.length === 0 || action.length > 500) {
      return { valid: false, error: 'Action должен быть от 1 до 500 символов' };
    }

    if (data && typeof data !== 'object') {
      return { valid: false, error: 'Data должен быть объектом' };
    }

    return { valid: true };
  },

  [PRIVATE._SANITIZE](action, data) {
    // Очищаем action
    const sanitizedAction = String(action)
      .replace(/[^a-zA-Z0-9:_-]/g, '')
      .substring(0, 500);

    // Очищаем data
    let sanitizedData = null;
    if (data && typeof data === 'object') {
      try {
        sanitizedData = JSON.parse(JSON.stringify(data));
        // Удаляем потенциально опасные данные
        if (sanitizedData.password) delete sanitizedData.password;
        if (sanitizedData.token) delete sanitizedData.token;
        if (sanitizedData.secret) delete sanitizedData.secret;
        if (sanitizedData.key) delete sanitizedData.key;
      } catch {
        sanitizedData = { error: 'Invalid data' };
      }
    }

    return {
      action: sanitizedAction,
      data: sanitizedData,
    };
  },

  // ============================================================
  // 5.13. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PUBLIC.HEALTH_CHECK]() {
    if (!this._auditLog) {
      return {
        healthy: true,
        enabled: false,
        message: 'Audit Plugin отключен',
      };
    }

    const issues = [];
    const events = this._auditLog;

    // Проверка на утечку памяти
    if (events.length > this._auditMaxSize * 1.5) {
      issues.push('Превышен лимит событий');
    }

    // Проверка на дубликаты
    const ids = new Set();
    let duplicates = 0;
    for (const e of events) {
      if (ids.has(e.id)) duplicates++;
      ids.add(e.id);
    }
    if (duplicates > 0) {
      issues.push(`Обнаружено ${duplicates} дубликатов`);
    }

    // Проверка таблицы
    const state = this._state;
    const store = state[PRIVATE.STORE];
    const tableName = state[PRIVATE.TABLE_NAME];
    const tableExists = store && store.getTable(tableName);

    return {
      healthy: issues.length === 0,
      enabled: true,
      issues,
      totalEvents: events.length,
      maxEvents: this._auditMaxSize,
      tableExists: !!tableExists,
      tableName: tableName,
      immerEnabled: this._immerEnabled,
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 5.14. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__AUDIT_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };

      // Статистика символов
      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;

      console.log('📊 AUDIT PLUGIN SYMBOLS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
    }
  },

  // ============================================================
  // 5.15. УНИЧТОЖЕНИЕ
  // ============================================================

  [PRIVATE.DESTROY]() {
    const logger = this._logger;

    if (this._isDestroyed) {
      logger.warn('⚠️ Audit Plugin уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение Audit Plugin...');

    // Сохраняем перед уничтожением
    this[PRIVATE._SAVE]();

    // Очищаем хуки
    const state = this._state;
    for (const key of Object.keys(state[PRIVATE.HOOKS])) {
      state[PRIVATE.HOOKS][key].clear();
    }

    // Очищаем данные
    this._auditLog = [];
    this._auditStats = {
      total: 0,
      byAction: {},
      byUser: {},
      bySession: {},
      lastEntry: null,
      lastClear: null,
      startTime: Date.now(),
    };
    this._auditFilters = {};
    this._isDestroyed = true;

    if (state) {
      state[PRIVATE.DESTROYED] = true;
      state[PRIVATE.INITIALIZED] = false;
    }

    // Удаляем глобальные ссылки
    if (typeof window !== 'undefined') {
      delete window.__AUDIT_SYMBOLS;
    }

    logger.success('✅ Audit Plugin уничтожен');
  },

  // ============================================================
  // 5.16. ПУБЛИЧНЫЕ МЕТОДЫ (обертки)
  // ============================================================

  // Инициализация
  [PUBLIC.INIT](store) {
    return this[PRIVATE.INIT](store);
  },

  // Уничтожение
  [PUBLIC.DESTROY]() {
    return this[PRIVATE.DESTROY]();
  },

  // Аудит
  [PUBLIC.AUDIT](action, data) {
    return this[PRIVATE.AUDIT](action, data);
  },

  // Получить аудит
  [PUBLIC.GET_AUDIT](filter, limit) {
    return this[PRIVATE.GET_AUDIT](filter, limit);
  },

  // Очистить аудит
  [PUBLIC.CLEAR_AUDIT](filter) {
    return this[PRIVATE.CLEAR_AUDIT](filter);
  },

  // Экспорт аудита
  [PUBLIC.EXPORT_AUDIT](format, filter) {
    return this[PRIVATE.EXPORT_AUDIT](format, filter);
  },

  // Импорт аудита
  [PUBLIC.IMPORT_AUDIT](data, format) {
    return this[PRIVATE.IMPORT_AUDIT](data, format);
  },

  // Получить статистику
  [PUBLIC.GET_STATS]() {
    return this[PRIVATE.GET_STATS]();
  },

  // Установить фильтр
  [PUBLIC.SET_FILTER](name, filter) {
    return this[PRIVATE.SET_FILTER](name, filter);
  },

  // Очистить фильтры
  [PUBLIC.CLEAR_FILTERS]() {
    return this[PRIVATE.CLEAR_FILTERS]();
  },

  // Проверка целостности
  [PUBLIC.HEALTH_CHECK]() {
    return this[PUBLIC.HEALTH_CHECK]();
  },

  // Получить состояние
  [PUBLIC.GET_STATE]() {
    return {
      enabled: this._isEnabled,
      initialized: this._state?.[PRIVATE.INITIALIZED] || false,
      destroyed: this._isDestroyed || false,
      eventsCount: this._auditLog?.length || 0,
      maxEvents: this._auditMaxSize,
      filters: this._auditFilters || {},
      exclude: this._auditExclude || [],
      sessionId: this._state?.[PRIVATE.SESSION_ID] || null,
      userId: this._state?.[PRIVATE.USER_ID] || null,
      immerEnabled: this._immerEnabled,
      version: CONFIG.version,
    };
  },

  // Метод для работы с Immer напрямую
  [PUBLIC.WITH_IMMER](fn) {
    if (!this._immerEnabled || !this._produce) {
      return fn();
    }
    return this._produce(fn);
  },
};

// ============================================================
// 6. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default AuditPlugin;

// ============================================================
// 7. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('📊 Audit Plugin Symbols:');
  console.log(`  🔑 Private: ${privateCount}`);
  console.log(`  🔓 Public: ${publicCount}`);
  console.log(`  📦 Total: ${privateCount + publicCount}`);
  console.log(`  📋 Version: ${CONFIG.version}`);
}

// ============================================================
// 8. ОБРАБОТЧИКИ ДЛЯ ОТЛАДКИ
// ============================================================

if (typeof window !== 'undefined' && CONFIG.debug) {
  window.__debugAudit = {
    getState: () => AuditPlugin[PUBLIC.GET_STATE](),
    getStats: () => AuditPlugin[PUBLIC.GET_STATS](),
    getAudit: (filter, limit) => AuditPlugin[PUBLIC.GET_AUDIT](filter, limit),
    clearAudit: filter => AuditPlugin[PUBLIC.CLEAR_AUDIT](filter),
    exportAudit: (format, filter) => AuditPlugin[PUBLIC.EXPORT_AUDIT](format, filter),
    healthCheck: () => AuditPlugin[PUBLIC.HEALTH_CHECK](),
    getSymbols: () => ({
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
    }),
    getConfig: () => ({ ...CONFIG }),
  };

  console.log('📋 КОМАНДЫ ОТЛАДКИ (__debugAudit):');
  console.log('  __debugAudit.getState() — состояние');
  console.log('  __debugAudit.getStats() — статистика');
  console.log('  __debugAudit.getAudit(filter, limit) — получить аудит');
  console.log('  __debugAudit.clearAudit(filter) — очистить аудит');
  console.log('  __debugAudit.exportAudit(format, filter) — экспорт');
  console.log('  __debugAudit.healthCheck() — проверка целостности');
  console.log('  __debugAudit.getSymbols() — все символы');
  console.log('  __debugAudit.getConfig() — конфигурация');
}