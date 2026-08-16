// ============================================================
// plugins/QuotaPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Система квот и лимитов для Enterprise Store
// Версия: 4.0.12 (СТАБИЛЬНАЯ — ИСПРАВЛЕНА)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('quota.version'),
  BUILD: Symbol('quota.build'),
  NAME: Symbol('quota.name'),
  CONFIG: Symbol('quota.config'),
  STATE: Symbol('quota.state'),
  INITIALIZED: Symbol('quota.initialized'),
  DESTROYED: Symbol('quota.destroyed'),
  IS_ACTIVE: Symbol('quota.isActive'),

  // Данные квот
  QUOTAS: Symbol('quota.quotas'),
  QUOTA_HISTORY: Symbol('quota.history'),
  QUOTA_SNAPSHOTS: Symbol('quota.snapshots'),
  QUOTA_ALERTS: Symbol('quota.alerts'),
  QUOTA_VIOLATIONS: Symbol('quota.violations'),
  QUOTA_CACHE: Symbol('quota.cache'),

  // Лимиты по типам
  TABLE_LIMITS: Symbol('quota.tableLimits'),
  RECORD_LIMITS: Symbol('quota.recordLimits'),
  FIELD_LIMITS: Symbol('quota.fieldLimits'),
  SIZE_LIMITS: Symbol('quota.sizeLimits'),
  RATE_LIMITS: Symbol('quota.rateLimits'),

  // Состояние
  CURRENT_USAGE: Symbol('quota.currentUsage'),
  PEAK_USAGE: Symbol('quota.peakUsage'),
  LAST_CHECK: Symbol('quota.lastCheck'),
  CHECK_INTERVAL: Symbol('quota.checkInterval'),
  CHECK_TIMER: Symbol('quota.checkTimer'),

  // Методы
  INIT: Symbol('quota.init'),
  DESTROY: Symbol('quota.destroy'),
  SET_QUOTA: Symbol('quota.setQuota'),
  GET_QUOTA: Symbol('quota.getQuota'),
  CHECK_QUOTA: Symbol('quota.checkQuota'),
  GET_USAGE: Symbol('quota.getUsage'),
  GET_PEAK: Symbol('quota.getPeak'),
  GET_HISTORY: Symbol('quota.getHistory'),
  GET_ALERTS: Symbol('quota.getAlerts'),
  CLEAR_ALERTS: Symbol('quota.clearAlerts'),
  GET_VIOLATIONS: Symbol('quota.getViolations'),
  CLEAR_VIOLATIONS: Symbol('quota.clearViolations'),
  RESET_PEAK: Symbol('quota.resetPeak'),
  UPDATE_USAGE: Symbol('quota.updateUsage'),
  CHECK_TABLE: Symbol('quota.checkTable'),
  CHECK_RECORD: Symbol('quota.checkRecord'),
  CHECK_FIELD: Symbol('quota.checkField'),
  CHECK_SIZE: Symbol('quota.checkSize'),
  CHECK_RATE: Symbol('quota.checkRate'),
  ALERT: Symbol('quota.alert'),
  SNAPSHOT: Symbol('quota.snapshot'),
  RESTORE: Symbol('quota.restore'),
  EXPORT: Symbol('quota.export'),
  IMPORT: Symbol('quota.import'),
  RESET: Symbol('quota.reset'),
  EXPORT_SYMBOLS: Symbol('quota.exportSymbols'),

  // Логгер
  LOGGER: Symbol('quota.logger'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('quota.instance'),
  STATE: Symbol.for('quota.state'),
  CONFIG: Symbol.for('quota.config'),
  INIT: Symbol.for('quota.init'),
  DESTROY: Symbol.for('quota.destroy'),
  SET_QUOTA: Symbol.for('quota.setQuota'),
  GET_QUOTA: Symbol.for('quota.getQuota'),
  CHECK_QUOTA: Symbol.for('quota.checkQuota'),
  GET_USAGE: Symbol.for('quota.getUsage'),
  GET_PEAK: Symbol.for('quota.getPeak'),
  GET_HISTORY: Symbol.for('quota.getHistory'),
  GET_ALERTS: Symbol.for('quota.getAlerts'),
  CLEAR_ALERTS: Symbol.for('quota.clearAlerts'),
  GET_VIOLATIONS: Symbol.for('quota.getViolations'),
  CLEAR_VIOLATIONS: Symbol.for('quota.clearViolations'),
  RESET_PEAK: Symbol.for('quota.resetPeak'),
  HEALTH_CHECK: Symbol.for('quota.healthCheck'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.12',
  build: '2026-07-28',
  name: 'Quota Plugin',
  debug: true,

  // Квоты по умолчанию
  defaultQuotas: {
    maxTables: 100,
    maxRecords: 100000,
    maxRecordsPerTable: 10000,
    maxFields: 100,
    maxFieldSize: 1024 * 1024, // 1MB
    maxRecordSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 1024 * 1024 * 1024, // 1GB
    maxOperationsPerSecond: 1000,
    maxConcurrentOperations: 50,
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    maxConnections: 100,
    maxTransactionsPerSecond: 100,
    maxUndoSteps: 50,
  },

  // Предупреждения
  warningThreshold: 0.8, // 80%
  criticalThreshold: 0.95, // 95%

  // Интервал проверки (мс)
  checkInterval: 60000, // 1 минута

  // Хранение истории
  maxHistory: 1000,
  maxAlerts: 500,
  maxViolations: 500,
  maxSnapshots: 100,

  // Автоматические действия
  autoAlert: true,
  autoLog: true,
  autoSnapshot: true,
  autoCleanup: true,

  // Безопасность
  strictMode: true,
  validateInputs: true,
  encryptSensitive: false,
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

function createLogger(debug = true, instanceId = 'Quota') {
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

    header: title => {
      console.log('%c' + '═'.repeat(70), 'color: #636e72;');
      console.log(
        '%c  📊 ' + title,
        'background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold;',
      );
      console.log('%c' + '═'.repeat(70), 'color: #636e72;');
    },

    separator: () => {
      console.log('%c' + '─'.repeat(70), 'color: #636e72;');
    },

    getHistory() {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory() {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug(enabled) {
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
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (БЕЗОПАСНЫЙ ДОСТУП К STORE)
// ============================================================

/**
 * Безопасное получение таблиц из store
 */
function getStoreTables(store) {
  try {
    // 1. Через getState
    if (store && typeof store.getState === 'function') {
      const state = store.getState();
      if (state && state.tables) {
        return state.tables;
      }
    }

    // 2. Через приватный доступ
    if (store && store._private) {
      const p = store._private.get(store);
      if (p) {
        const tables = p[Symbol('store.tables')];
        if (tables) {return tables;}
        const state = p[Symbol('store.state')];
        if (state && state.tables) {return state.tables;}
      }
    }

    // 3. Через _getTables
    if (store && typeof store._getTables === 'function') {
      return store._getTables();
    }

    // 4. Через _store
    if (store && store._store) {
      if (store._store._getTables) {
        return store._store._getTables();
      }
      if (store._store.tables) {
        return store._store.tables;
      }
    }

    // 5. Через свойство tables
    if (store && store.tables) {
      return store.tables;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Ошибка получения таблиц:', error);
    return null;
  }
}

/**
 * Безопасное получение состояния store
 */
function getStoreState(store) {
  try {
    if (store && typeof store.getState === 'function') {
      return store.getState();
    }
    if (store && store._private) {
      const p = store._private.get(store);
      if (p) {
        const state = p[Symbol('store.state')];
        if (state) {return state;}
      }
    }
    if (store && store._store && store._store.getState) {
      return store._store.getState();
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Ошибка получения состояния:', error);
    return null;
  }
}

// ============================================================
// 6. ОСНОВНОЙ ОБЪЕКТ QUOTA_PLUGIN (100% символы)
// ============================================================

export const QuotaPlugin = {
  name: 'quota',
  version: CONFIG.version,
  metadata: {
    description: 'Enterprise Quota & Limits Management',
    author: 'Enterprise Store Team',
    license: 'MIT',
  },
  order: 7,

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ (ИСПРАВЛЕНО)
  // ============================================================

  init(store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // ★★★ СОЗДАЕМ ПРИВАТНОЕ СОСТОЯНИЕ ★★★
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
      [PRIVATE.QUOTAS]: { ...CONFIG.defaultQuotas },
      [PRIVATE.QUOTA_HISTORY]: [],
      [PRIVATE.QUOTA_SNAPSHOTS]: [],
      [PRIVATE.QUOTA_ALERTS]: [],
      [PRIVATE.QUOTA_VIOLATIONS]: [],
      [PRIVATE.QUOTA_CACHE]: new Map(),
      [PRIVATE.TABLE_LIMITS]: new Map(),
      [PRIVATE.RECORD_LIMITS]: new Map(),
      [PRIVATE.FIELD_LIMITS]: new Map(),
      [PRIVATE.SIZE_LIMITS]: new Map(),
      [PRIVATE.RATE_LIMITS]: new Map(),
      [PRIVATE.CURRENT_USAGE]: {
        tables: 0,
        records: 0,
        fields: 0,
        totalSize: 0,
        operations: 0,
        connections: 0,
        memory: 0,
        transactions: 0,
        undoSteps: 0,
      },
      [PRIVATE.PEAK_USAGE]: {
        tables: 0,
        records: 0,
        fields: 0,
        totalSize: 0,
        operations: 0,
        connections: 0,
        memory: 0,
        transactions: 0,
        undoSteps: 0,
      },
      [PRIVATE.LAST_CHECK]: null,
      [PRIVATE.CHECK_INTERVAL]: CONFIG.checkInterval,
      [PRIVATE.CHECK_TIMER]: null,
      [PRIVATE.INITIALIZED]: true,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.IS_ACTIVE]: true,
      [PRIVATE.LOGGER]: logger,
    };

    // ★★★ СОХРАНЯЕМ В STORE ★★★
    store._quotaData = privateData;

    // ★★★ СОХРАНЯЕМ ССЫЛКУ В ПЛАГИНЕ ★★★
    this._quotaData = privateData;
    this._logger = logger;
    this._store = store;

    // ★★★ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ★★★
    const getData = () => privateData;

    // ============================================================
    // 8. ПУБЛИЧНЫЕ МЕТОДЫ
    // ============================================================

    /**
     * Установить квоту
     */
    store[PUBLIC.SET_QUOTA] = function (key, value) {
      const p = this._quotaData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Система квот не активна');
        return false;
      }

      if (!key || typeof key !== 'string') {
        logger.error('❌ Некорректный ключ квоты');
        return false;
      }

      if (value === undefined || value === null) {
        logger.error('❌ Некорректное значение квоты');
        return false;
      }

      if (typeof value !== 'number' || value < 0) {
        logger.error('❌ Значение квоты должно быть положительным числом');
        return false;
      }

      const oldValue = p[PRIVATE.QUOTAS][key];
      p[PRIVATE.QUOTAS][key] = value;

      p[PRIVATE.QUOTA_HISTORY].push({
        action: 'set',
        key,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
        source: 'api',
      });

      if (p[PRIVATE.QUOTA_HISTORY].length > CONFIG.maxHistory) {
        p[PRIVATE.QUOTA_HISTORY] = p[PRIVATE.QUOTA_HISTORY].slice(-CONFIG.maxHistory);
      }

      p[PRIVATE.QUOTA_CACHE].set(key, {
        value,
        timestamp: Date.now(),
      });

      logger.success(`📊 Квота установлена: ${key} = ${value} (было: ${oldValue})`);
      return true;
    };

    /**
     * Получить квоту
     */
    store[PUBLIC.GET_QUOTA] = function (key) {
      const p = this._quotaData;
      if (key) {
        return p[PRIVATE.QUOTAS][key] !== undefined ? p[PRIVATE.QUOTAS][key] : null;
      }
      return { ...p[PRIVATE.QUOTAS] };
    };

    /**
     * Проверить квоту
     */
    store[PUBLIC.CHECK_QUOTA] = function (key, value) {
      const p = this._quotaData;
      const logger = p[PRIVATE.LOGGER];

      if (p[PRIVATE.DESTROYED] || !p[PRIVATE.IS_ACTIVE]) {
        logger.error('❌ Система квот не активна');
        return { allowed: false, error: 'Система квот не активна' };
      }

      const quota = p[PRIVATE.QUOTAS][key];
      if (quota === undefined) {
        return { allowed: true, quota: null, usage: value };
      }

      const usage = value !== undefined ? value : p[PRIVATE.CURRENT_USAGE][key] || 0;
      const allowed = usage <= quota;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      // ★★★ ИСПРАВЛЕНО: используем замыкание для ALERT ★★★
      const createAlert = alertData => {
        const data = getData();
        const entry = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ...alertData,
          timestamp: Date.now(),
          resolved: false,
        };
        data[PRIVATE.QUOTA_ALERTS].push(entry);
        if (data[PRIVATE.QUOTA_ALERTS].length > CONFIG.maxAlerts) {
          data[PRIVATE.QUOTA_ALERTS] = data[PRIVATE.QUOTA_ALERTS].slice(-CONFIG.maxAlerts);
        }
        const log = data[PRIVATE.LOGGER];
        log.warn(`⚠️ ${alertData.type.toUpperCase()}: ${alertData.message}`);
        return entry;
      };

      if (allowed) {
        if (percentage >= CONFIG.criticalThreshold) {
          createAlert({
            type: 'critical',
            key,
            usage,
            quota,
            percentage,
            message: `Квота ${key} достигла ${percentage.toFixed(1)}% (${usage}/${quota})`,
          });
        } else if (percentage >= CONFIG.warningThreshold) {
          createAlert({
            type: 'warning',
            key,
            usage,
            quota,
            percentage,
            message: `Квота ${key} достигла ${percentage.toFixed(1)}% (${usage}/${quota})`,
          });
        }
      } else {
        createAlert({
          type: 'violation',
          key,
          usage,
          quota,
          percentage,
          message: `Квота ${key} превышена: ${usage} > ${quota}`,
        });
      }

      return {
        allowed,
        quota,
        usage,
        percentage,
        remaining: quota - usage,
        exceeded: !allowed,
      };
    };

    /**
     * Получить использование
     */
    store[PUBLIC.GET_USAGE] = function (key) {
      const p = this._quotaData;
      if (key) {
        return p[PRIVATE.CURRENT_USAGE][key] !== undefined ? p[PRIVATE.CURRENT_USAGE][key] : null;
      }
      return { ...p[PRIVATE.CURRENT_USAGE] };
    };

    /**
     * Получить пиковое использование
     */
    store[PUBLIC.GET_PEAK] = function (key) {
      const p = this._quotaData;
      if (key) {
        return p[PRIVATE.PEAK_USAGE][key] !== undefined ? p[PRIVATE.PEAK_USAGE][key] : null;
      }
      return { ...p[PRIVATE.PEAK_USAGE] };
    };

    /**
     * Получить историю квот
     */
    store[PUBLIC.GET_HISTORY] = function (limit = 100) {
      const p = this._quotaData;
      return p[PRIVATE.QUOTA_HISTORY].slice(-Math.min(limit, p[PRIVATE.QUOTA_HISTORY].length));
    };

    /**
     * Получить алерты
     */
    store[PUBLIC.GET_ALERTS] = function (limit = 100) {
      const p = this._quotaData;
      return p[PRIVATE.QUOTA_ALERTS].slice(-Math.min(limit, p[PRIVATE.QUOTA_ALERTS].length));
    };

    /**
     * Очистить алерты
     */
    store[PUBLIC.CLEAR_ALERTS] = function () {
      const p = this._quotaData;
      p[PRIVATE.QUOTA_ALERTS] = [];
      return true;
    };

    /**
     * Получить нарушения
     */
    store[PUBLIC.GET_VIOLATIONS] = function (limit = 100) {
      const p = this._quotaData;
      return p[PRIVATE.QUOTA_VIOLATIONS].slice(
        -Math.min(limit, p[PRIVATE.QUOTA_VIOLATIONS].length),
      );
    };

    /**
     * Очистить нарушения
     */
    store[PUBLIC.CLEAR_VIOLATIONS] = function () {
      const p = this._quotaData;
      p[PRIVATE.QUOTA_VIOLATIONS] = [];
      return true;
    };

    /**
     * Сбросить пиковые значения
     */
    store[PUBLIC.RESET_PEAK] = function () {
      const p = this._quotaData;
      p[PRIVATE.PEAK_USAGE] = { ...p[PRIVATE.CURRENT_USAGE] };
      return true;
    };

    /**
     * Проверка целостности
     */
    store[PUBLIC.HEALTH_CHECK] = function () {
      const p = this._quotaData;
      const quotas = p[PRIVATE.QUOTAS];
      const usage = p[PRIVATE.CURRENT_USAGE];

      const checks = {};
      let healthy = true;
      const issues = [];

      for (const [key, quota] of Object.entries(quotas)) {
        const used = usage[key] || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        checks[key] = { quota, used, percentage, healthy: used <= quota };

        if (used > quota) {
          healthy = false;
          issues.push(`Квота ${key} превышена: ${used} > ${quota}`);
        }
      }

      return {
        healthy,
        issues,
        checks,
        usage: { ...usage },
        peak: { ...p[PRIVATE.PEAK_USAGE] },
        alerts: p[PRIVATE.QUOTA_ALERTS].length,
        violations: p[PRIVATE.QUOTA_VIOLATIONS].length,
        history: p[PRIVATE.QUOTA_HISTORY].length,
        timestamp: Date.now(),
      };
    };

    // ============================================================
    // 9. ВНУТРЕННИЕ МЕТОДЫ (ИСПРАВЛЕНЫ)
    // ============================================================

    /**
     * Обновить использование
     */
    store[PRIVATE.UPDATE_USAGE] = function () {
      const p = this._quotaData;
      const logger = p[PRIVATE.LOGGER];

      try {
        const tablesMap = getStoreTables(this) || new Map();
        let tableCount = 0;
        let recordCount = 0;
        let fieldCount = 0;
        let totalSize = 0;

        let tables = {};
        if (tablesMap instanceof Map) {
          tables = Object.fromEntries(tablesMap);
        } else if (typeof tablesMap === 'object') {
          tables = tablesMap;
        }

        for (const [name, table] of Object.entries(tables)) {
          if (table && table.data) {
            tableCount++;
            recordCount += table.data.length || 0;
            if (table.data && table.data.length > 0) {
              const firstRow = table.data[0];
              if (firstRow && typeof firstRow === 'object') {
                fieldCount += Object.keys(firstRow).length;
              }
            }
            try {
              const size = JSON.stringify(table.data || []).length;
              totalSize += size;
            } catch (e) {}
          }
        }

        let undoSize = 0;
        let redoSize = 0;
        let transactions = 0;

        try {
          const state = getStoreState(this);
          if (state) {
            undoSize = state.undoSize || 0;
            redoSize = state.redoSize || 0;
            transactions = state.transactions || 0;
          }
        } catch (e) {}

        p[PRIVATE.CURRENT_USAGE] = {
          tables: tableCount,
          records: recordCount,
          fields: fieldCount,
          totalSize,
          operations: p[PRIVATE.CURRENT_USAGE].operations || 0,
          connections: p[PRIVATE.CURRENT_USAGE].connections || 0,
          memory: typeof performance !== 'undefined' && performance.memory
            ? performance.memory.usedJSHeapSize || 0
            : 0,
          transactions,
          undoSteps: undoSize + redoSize,
        };

        for (const [key, value] of Object.entries(p[PRIVATE.CURRENT_USAGE])) {
          if (value > (p[PRIVATE.PEAK_USAGE][key] || 0)) {
            p[PRIVATE.PEAK_USAGE][key] = value;
          }
        }

        // ★★★ ИСПРАВЛЕНО: проверка всех квот через замыкание ★★★
        const checkAllQuotas = () => {
          const quotas = p[PRIVATE.QUOTAS];
          const usage = p[PRIVATE.CURRENT_USAGE];
          let hasViolations = false;

          for (const [key, quota] of Object.entries(quotas)) {
            const used = usage[key] || 0;
            if (used > quota) {
              hasViolations = true;
              const violationEntry = {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                key,
                quota,
                usage: used,
                timestamp: Date.now(),
                message: `Превышена квота ${key}: ${used} > ${quota}`,
                resolved: false,
              };
              p[PRIVATE.QUOTA_VIOLATIONS].push(violationEntry);
              if (p[PRIVATE.QUOTA_VIOLATIONS].length > CONFIG.maxViolations) {
                p[PRIVATE.QUOTA_VIOLATIONS] = p[PRIVATE.QUOTA_VIOLATIONS].slice(-CONFIG.maxViolations);
              }
              logger.error(`❌ VIOLATION: ${violationEntry.message}`);
            }
          }

          if (hasViolations && CONFIG.autoAlert) {
            const alertEntry = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              type: 'violation',
              message: 'Обнаружены нарушения квот',
              data: { usage, quotas },
              timestamp: Date.now(),
              resolved: false,
            };
            p[PRIVATE.QUOTA_ALERTS].push(alertEntry);
            if (p[PRIVATE.QUOTA_ALERTS].length > CONFIG.maxAlerts) {
              p[PRIVATE.QUOTA_ALERTS] = p[PRIVATE.QUOTA_ALERTS].slice(-CONFIG.maxAlerts);
            }
            logger.warn(`⚠️ ${alertEntry.type.toUpperCase()}: ${alertEntry.message}`);
          }

          return !hasViolations;
        };

        checkAllQuotas();

        if (CONFIG.autoLog) {
          p[PRIVATE.QUOTA_HISTORY].push({
            action: 'update',
            usage: { ...p[PRIVATE.CURRENT_USAGE] },
            timestamp: Date.now(),
          });

          if (p[PRIVATE.QUOTA_HISTORY].length > CONFIG.maxHistory) {
            p[PRIVATE.QUOTA_HISTORY] = p[PRIVATE.QUOTA_HISTORY].slice(-CONFIG.maxHistory);
          }
        }

        if (CONFIG.autoSnapshot) {
          const snapshot = {
            id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            quotas: { ...p[PRIVATE.QUOTAS] },
            usage: { ...p[PRIVATE.CURRENT_USAGE] },
            peak: { ...p[PRIVATE.PEAK_USAGE] },
            timestamp: Date.now(),
          };
          p[PRIVATE.QUOTA_SNAPSHOTS].push(snapshot);
          if (p[PRIVATE.QUOTA_SNAPSHOTS].length > CONFIG.maxSnapshots) {
            p[PRIVATE.QUOTA_SNAPSHOTS] = p[PRIVATE.QUOTA_SNAPSHOTS].slice(-CONFIG.maxSnapshots);
          }
        }

        p[PRIVATE.LAST_CHECK] = Date.now();

        return p[PRIVATE.CURRENT_USAGE];
      } catch (error) {
        logger.error('❌ Ошибка обновления использования:', error);
        return p[PRIVATE.CURRENT_USAGE];
      }
    };

    /**
     * Проверить квоту таблицы
     */
    store[PRIVATE.CHECK_TABLE] = function (tableName) {
      const p = this._quotaData;

      const quotaCheck = this[PUBLIC.CHECK_QUOTA]('maxTables');
      if (!quotaCheck.allowed) {
        return {
          allowed: false,
          error: `Превышен лимит таблиц: ${quotaCheck.usage} > ${quotaCheck.quota}`,
        };
      }

      if (p[PRIVATE.TABLE_LIMITS].has(tableName)) {
        const limits = p[PRIVATE.TABLE_LIMITS].get(tableName);
        const table = this.getTable ? this.getTable(tableName) : null;
        if (table && limits.maxRecords && table.data.length > limits.maxRecords) {
          return {
            allowed: false,
            error: `Превышен лимит записей для таблицы ${tableName}: ${table.data.length} > ${limits.maxRecords}`,
          };
        }
      }

      return { allowed: true };
    };

    /**
     * Проверить квоту записи
     */
    store[PRIVATE.CHECK_RECORD] = function (tableName, record) {
      const p = this._quotaData;
      const config = p[PRIVATE.CONFIG];

      try {
        const size = JSON.stringify(record).length;
        if (size > config.defaultQuotas.maxRecordSize) {
          return {
            allowed: false,
            error: `Размер записи превышает лимит: ${size} > ${config.defaultQuotas.maxRecordSize}`,
          };
        }
      } catch (error) {
        return {
          allowed: false,
          error: `Ошибка сериализации записи: ${error.message}`,
        };
      }

      const fieldCount = Object.keys(record).length;
      if (fieldCount > config.defaultQuotas.maxFields) {
        return {
          allowed: false,
          error: `Количество полей превышает лимит: ${fieldCount} > ${config.defaultQuotas.maxFields}`,
        };
      }

      for (const [key, value] of Object.entries(record)) {
        const fieldSize = String(value).length;
        if (fieldSize > config.defaultQuotas.maxFieldSize) {
          return {
            allowed: false,
            error: `Размер поля ${key} превышает лимит: ${fieldSize} > ${config.defaultQuotas.maxFieldSize}`,
          };
        }
      }

      return { allowed: true };
    };

    /**
     * Проверить квоту поля
     */
    store[PRIVATE.CHECK_FIELD] = function (tableName, fieldName, value) {
      const p = this._quotaData;
      const config = p[PRIVATE.CONFIG];

      const size = String(value).length;
      if (size > config.defaultQuotas.maxFieldSize) {
        return {
          allowed: false,
          error: `Размер поля ${fieldName} превышает лимит: ${size} > ${config.defaultQuotas.maxFieldSize}`,
        };
      }

      return { allowed: true };
    };

    /**
     * Проверить квоту размера
     */
    store[PRIVATE.CHECK_SIZE] = function (data) {
      const p = this._quotaData;
      const config = p[PRIVATE.CONFIG];

      try {
        const size = JSON.stringify(data).length;
        const currentSize = p[PRIVATE.CURRENT_USAGE].totalSize || 0;
        const maxSize = config.defaultQuotas.maxTotalSize;

        if (currentSize + size > maxSize) {
          return {
            allowed: false,
            error: `Превышен общий лимит размера: ${currentSize + size} > ${maxSize}`,
          };
        }

        return { allowed: true };
      } catch (error) {
        return {
          allowed: false,
          error: `Ошибка проверки размера: ${error.message}`,
        };
      }
    };

    /**
     * Проверить квоту скорости
     */
    store[PRIVATE.CHECK_RATE] = function () {
      const p = this._quotaData;
      const config = p[PRIVATE.CONFIG];
      const now = Date.now();

      if (!p[PRIVATE.RATE_LIMITS].has('operations')) {
        p[PRIVATE.RATE_LIMITS].set('operations', {
          count: 0,
          windowStart: now,
        });
      }

      const data = p[PRIVATE.RATE_LIMITS].get('operations');

      if (now - data.windowStart > 1000) {
        data.count = 0;
        data.windowStart = now;
      }

      data.count++;

      const maxOps = config.defaultQuotas.maxOperationsPerSecond;
      if (data.count > maxOps) {
        return {
          allowed: false,
          error: `Превышен лимит операций в секунду: ${data.count} > ${maxOps}`,
        };
      }

      return { allowed: true };
    };

    /**
     * Экспорт квот
     */
    store[PRIVATE.EXPORT] = function () {
      const p = this._quotaData;
      return {
        quotas: { ...p[PRIVATE.QUOTAS] },
        usage: { ...p[PRIVATE.CURRENT_USAGE] },
        peak: { ...p[PRIVATE.PEAK_USAGE] },
        history: p[PRIVATE.QUOTA_HISTORY].slice(-100),
        alerts: p[PRIVATE.QUOTA_ALERTS].slice(-50),
        violations: p[PRIVATE.QUOTA_VIOLATIONS].slice(-50),
        snapshots: p[PRIVATE.QUOTA_SNAPSHOTS].slice(-10),
        timestamp: Date.now(),
        version: CONFIG.version,
      };
    };

    /**
     * Импорт квот
     */
    store[PRIVATE.IMPORT] = function (data) {
      const p = this._quotaData;
      const logger = p[PRIVATE.LOGGER];

      if (!data || typeof data !== 'object') {
        logger.error('❌ Некорректные данные для импорта');
        return false;
      }

      if (data.quotas) {
        p[PRIVATE.QUOTAS] = { ...data.quotas };
      }

      if (data.usage) {
        p[PRIVATE.CURRENT_USAGE] = { ...data.usage };
      }

      if (data.peak) {
        p[PRIVATE.PEAK_USAGE] = { ...data.peak };
      }

      logger.success('✅ Квоты импортированы');
      return true;
    };

    /**
     * Сброс квот к значениям по умолчанию
     */
    store[PRIVATE.RESET] = function () {
      const p = this._quotaData;
      const logger = p[PRIVATE.LOGGER];

      p[PRIVATE.QUOTAS] = { ...CONFIG.defaultQuotas };
      p[PRIVATE.CURRENT_USAGE] = {
        tables: 0,
        records: 0,
        fields: 0,
        totalSize: 0,
        operations: 0,
        connections: 0,
        memory: 0,
        transactions: 0,
        undoSteps: 0,
      };
      p[PRIVATE.PEAK_USAGE] = { ...p[PRIVATE.CURRENT_USAGE] };
      p[PRIVATE.QUOTA_ALERTS] = [];
      p[PRIVATE.QUOTA_VIOLATIONS] = [];

      logger.success('🔄 Квоты сброшены к значениям по умолчанию');
      return true;
    };

    // ============================================================
    // 10. АВТОМАТИЧЕСКАЯ ПРОВЕРКА КВОТ
    // ============================================================

    privateData[PRIVATE.CHECK_TIMER] = setInterval(() => {
      if (!privateData[PRIVATE.IS_ACTIVE] || privateData[PRIVATE.DESTROYED]) {
        return;
      }

      try {
        store[PRIVATE.UPDATE_USAGE]();
      } catch (error) {
        const logger = privateData[PRIVATE.LOGGER];
        logger.error('❌ Ошибка авто-обновления квот:', error);
      }
    }, privateData[PRIVATE.CHECK_INTERVAL]);

    // ============================================================
    // 11. ПЕРВОНАЧАЛЬНОЕ ОБНОВЛЕНИЕ
    // ============================================================

    try {
      store[PRIVATE.UPDATE_USAGE]();
    } catch (error) {
      logger.error('❌ Ошибка первоначального обновления:', error);
    }

    // ============================================================
    // 12. ЭКСПОРТ СИМВОЛОВ
    // ============================================================

    if (typeof window !== 'undefined') {
      window.__QUOTA_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };
    }

    // ============================================================
    // 13. ВЫВОД ИНФОРМАЦИИ
    // ============================================================

    logger.header('СИСТЕМА КВОТ ИНИЦИАЛИЗИРОВАНА');
    logger.success(`✅ Квоты активны (${Object.keys(CONFIG.defaultQuotas).length} квот)`);
    logger.info(`📊 Текущее использование:`);
    logger.info(`  📋 Таблиц: ${privateData[PRIVATE.CURRENT_USAGE].tables}`);
    logger.info(`  📝 Записей: ${privateData[PRIVATE.CURRENT_USAGE].records}`);
    logger.info(`  📦 Размер: ${(privateData[PRIVATE.CURRENT_USAGE].totalSize / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`  🔄 Операций: ${privateData[PRIVATE.CURRENT_USAGE].operations}`);
    logger.info(`  💾 Память: ${(privateData[PRIVATE.CURRENT_USAGE].memory / 1024 / 1024).toFixed(2)} MB`);
    logger.separator();
    logger.info(`⏱ Интервал проверки: ${CONFIG.checkInterval / 1000} сек`);
    logger.info(`📊 Порог предупреждения: ${CONFIG.warningThreshold * 100}%`);
    logger.info(`🚨 Порог критический: ${CONFIG.criticalThreshold * 100}%`);
    logger.separator();

    return this;
  },

  // ============================================================
  // 14. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const p = store._quotaData;
    if (!p) {return;}

    const logger = p[PRIVATE.LOGGER];

    logger.info('🧹 Уничтожение системы квот...');

    if (p[PRIVATE.CHECK_TIMER]) {
      clearInterval(p[PRIVATE.CHECK_TIMER]);
      p[PRIVATE.CHECK_TIMER] = null;
    }

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.IS_ACTIVE] = false;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].isActive = false;

    p[PRIVATE.QUOTA_HISTORY] = [];
    p[PRIVATE.QUOTA_SNAPSHOTS] = [];
    p[PRIVATE.QUOTA_ALERTS] = [];
    p[PRIVATE.QUOTA_VIOLATIONS] = [];
    p[PRIVATE.QUOTA_CACHE].clear();
    p[PRIVATE.TABLE_LIMITS].clear();
    p[PRIVATE.RECORD_LIMITS].clear();
    p[PRIVATE.FIELD_LIMITS].clear();
    p[PRIVATE.SIZE_LIMITS].clear();
    p[PRIVATE.RATE_LIMITS].clear();

    logger.success('✅ Система квот уничтожена');
  },
};

// ============================================================
// 15. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('📊 QUOTA PLUGIN SYMBOLS STATS:');
  console.log(`  🔑 Приватных символов: ${privateCount}`);
  console.log(`  🔓 Публичных символов: ${publicCount}`);
  console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
  console.log(`  📋 Версия: ${CONFIG.version} (${CONFIG.build})`);
}

// ============================================================
// 16. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default QuotaPlugin;
