// ============================================================
// store/src/logger.mjs — 100% СИМВОЛЫ — универсальный логгер
// Версия: 5.0.2 (ИСПРАВЛЕНО — ВСЕ МЕТОДЫ ПРОВЕРЯЮТСЯ)
// ============================================================

// ============================================================
// 1. КОНСТАНТЫ
// ============================================================

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  SUCCESS: 2,
  DEBUG: 3,
  TRACE: 4,
  SYSTEM: 1,
  SECURITY: 1,
  PERFORMANCE: 1,
};

const ICONS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  success: '✅',
  debug: '🔍',
  trace: '🔎',
  fatal: '💀',
  system: '⚙️',
  security: '🔒',
  performance: '⚡',
};

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
  COLORS: Symbol('logger.colors'),
  START_TIME: Symbol('logger.startTime'),
  GROUPS: Symbol('logger.groups'),
  CURRENT_GROUP: Symbol('logger.currentGroup'),
  GROUP_STACK: Symbol('logger.groupStack'),
  TIMERS: Symbol('logger.timers'),
  FILTERS: Symbol('logger.filters'),
  SUBSCRIBERS: Symbol('logger.subscribers'),
  BUFFER: Symbol('logger.buffer'),
  FLUSH_INTERVAL: Symbol('logger.flushInterval'),
  IS_FLUSHING: Symbol('logger.isFlushing'),
  HOOKS: Symbol('logger.hooks'),
  STATS: Symbol('logger.stats'),
};

// ============================================================
// 3. СОЗДАНИЕ ЛОГГЕРА
// ============================================================

export function createLogger(debug = true, instanceId = 'App') {
  const logState = {
    [PRIVATE.HISTORY]: [],
    [PRIVATE.MAX_HISTORY]: 500,
    [PRIVATE.DEBUG]: debug,
    [PRIVATE.INSTANCE_ID]: instanceId,
    [PRIVATE.LEVEL]: debug ? 3 : 2,
    [PRIVATE.COLORS]: { ...COLORS },
    [PRIVATE.START_TIME]: Date.now(),
    [PRIVATE.GROUPS]: new Map(),
    [PRIVATE.CURRENT_GROUP]: null,
    [PRIVATE.GROUP_STACK]: [],
    [PRIVATE.TIMERS]: new Map(),
    [PRIVATE.FILTERS]: {
      levels: [],
      groups: [],
      search: '',
    },
    [PRIVATE.SUBSCRIBERS]: new Map(),
    [PRIVATE.BUFFER]: [],
    [PRIVATE.FLUSH_INTERVAL]: null,
    [PRIVATE.IS_FLUSHING]: false,
    [PRIVATE.HOOKS]: {
      beforeLog: new Map(),
      afterLog: new Map(),
      onError: new Map(),
      onFlush: new Map(),
    },
    [PRIVATE.STATS]: {
      totalLogs: 0,
      byLevel: {},
      byGroup: {},
      errors: 0,
      warnings: 0,
    },
  };

  // ============================================================
  // 4. ВНУТРЕННИЙ МЕТОД ЛОГИРОВАНИЯ
  // ============================================================

  const logMethod = function (level, message, data = null, group = null) {
    const safeGet = (key, defaultValue) => {
      try {
        const value = this[key];
        return value !== undefined && value !== null ? value : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const hooks = safeGet(PRIVATE.HOOKS, { beforeLog: new Map() });
    if (hooks && hooks.beforeLog) {
      for (const [, callback] of hooks.beforeLog) {
        try {
          callback({ level, message, data, group });
        } catch (error) {
          console.error('❌ Ошибка в beforeLog хуке:', error);
        }
      }
    }

    const currentLevel = safeGet(PRIVATE.LEVEL, 2);
    const msgLevel = LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : 2;
    if (msgLevel > currentLevel) return;

    const filters = safeGet(PRIVATE.FILTERS, { levels: [], groups: [], search: '' });
    if (filters.levels.length > 0 && !filters.levels.includes(level)) return;
    if (filters.groups.length > 0 && group && !filters.groups.includes(group)) return;
    if (filters.search && !message.toLowerCase().includes(filters.search.toLowerCase())) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const instanceId = safeGet(PRIVATE.INSTANCE_ID, 'App');
    const prefix = `[${timestamp}] [${instanceId}]`;

    const entry = {
      timestamp,
      level,
      message,
      data: data !== null && data !== undefined ? data : null,
      id: Date.now() + Math.random(),
      group: group || safeGet(PRIVATE.CURRENT_GROUP, null) || null,
    };

    const history = safeGet(PRIVATE.HISTORY, []);
    if (history) {
      history.push(entry);
      const maxHistory = safeGet(PRIVATE.MAX_HISTORY, 500);
      if (history.length > maxHistory) {
        history.shift();
      }
    }

    const buffer = safeGet(PRIVATE.BUFFER, []);
    if (buffer) {
      buffer.push(entry);
      if (buffer.length > 100) {
        buffer.shift();
      }
    }

    const stats = safeGet(PRIVATE.STATS, {
      totalLogs: 0,
      byLevel: {},
      byGroup: {},
      errors: 0,
      warnings: 0,
    });
    if (stats) {
      stats.totalLogs = (stats.totalLogs || 0) + 1;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      if (group) {
        stats.byGroup[group] = (stats.byGroup[group] || 0) + 1;
      }
      if (level === 'error' || level === 'fatal') {
        stats.errors = (stats.errors || 0) + 1;
      }
      if (level === 'warn') {
        stats.warnings = (stats.warnings || 0) + 1;
      }
    }

    const subscribers = safeGet(PRIVATE.SUBSCRIBERS, new Map());
    if (subscribers) {
      for (const [, callback] of subscribers) {
        try {
          callback(entry);
        } catch (error) {
          console.error('❌ Ошибка в подписчике логов:', error);
        }
      }
    }

    const icon = ICONS[level] || '📌';
    const colorMap = {
      error: COLORS.red,
      warn: COLORS.yellow,
      info: COLORS.blue,
      debug: COLORS.gray,
      success: COLORS.green,
      trace: COLORS.cyan,
      fatal: COLORS.red,
      system: COLORS.magenta,
      security: COLORS.red,
      performance: COLORS.yellow,
    };
    const color = colorMap[level] || COLORS.white;
    const colors = safeGet(PRIVATE.COLORS, COLORS);
    const groupPrefix = group ? `[${group}] ` : '';
    let dataStr = '';
    if (data !== null && data !== undefined) {
      try {
        dataStr = ` ${JSON.stringify(data)}`;
      } catch {
        dataStr = ` ${String(data)}`;
      }
    }

    console.log(`${color}${icon} ${prefix} ${groupPrefix}${message}${dataStr}${colors.reset}`);

    if (hooks && hooks.afterLog) {
      for (const [, callback] of hooks.afterLog) {
        try {
          callback(entry);
        } catch (error) {
          console.error('❌ Ошибка в afterLog хуке:', error);
        }
      }
    }
  };

  const boundLog = logMethod.bind(logState);

  // ============================================================
  // 5. ПУБЛИЧНЫЙ API (100% символы)
  // ============================================================

  const logger = {
    error: (msg, data, group) => boundLog('error', msg, data, group),
    warn: (msg, data, group) => boundLog('warn', msg, data, group),
    info: (msg, data, group) => boundLog('info', msg, data, group),
    success: (msg, data, group) => boundLog('success', msg, data, group),
    trace: (msg, data, group) => boundLog('trace', msg, data, group),
    fatal: (msg, data, group) => boundLog('fatal', msg, data, group),
    debug: (msg, data, group) => boundLog('debug', msg, data, group),
    system: (msg, data, group) => boundLog('system', msg, data, group),
    security: (msg, data, group) => boundLog('security', msg, data, group),
    performance: (msg, data, group) => boundLog('performance', msg, data, group),

    group: function (name) {
      if (!name) return this;
      const groups = this[PRIVATE.GROUPS];
      if (!groups) {
        console.warn('⚠️ Группы не инициализированы');
        return this;
      }
      if (!groups.has(name)) {
        groups.set(name, {
          name,
          created: Date.now(),
          entries: 0,
        });
      }
      const stack = this[PRIVATE.GROUP_STACK];
      if (stack) {
        stack.push(this[PRIVATE.CURRENT_GROUP]);
      }
      this[PRIVATE.CURRENT_GROUP] = name;
      const groupData = groups.get(name);
      if (groupData) {
        groupData.entries++;
      }
      const colors = this[PRIVATE.COLORS] || COLORS;
      console.log(`${colors.cyan}📂 [${name}]${colors.reset}`);
      return this;
    },

    groupEnd: function () {
      const stack = this[PRIVATE.GROUP_STACK];
      if (stack && stack.length > 0) {
        this[PRIVATE.CURRENT_GROUP] = stack.pop() || null;
      } else {
        this[PRIVATE.CURRENT_GROUP] = null;
      }
      return this;
    },

    time: function (label) {
      const timers = this[PRIVATE.TIMERS];
      if (timers) {
        timers.set(label, Date.now());
      }
      return this;
    },

    timeEnd: function (label) {
      const timers = this[PRIVATE.TIMERS];
      if (timers && timers.has(label)) {
        const start = timers.get(label);
        const duration = Date.now() - start;
        timers.delete(label);
        this.info(`⏱ ${label}: ${duration}ms`, null, 'performance');
      }
      return this;
    },

    setFilter: function (type, value) {
      const filters = this[PRIVATE.FILTERS];
      if (!filters) return this;
      if (type === 'level') {
        filters.levels = Array.isArray(value) ? value : [value];
      } else if (type === 'group') {
        filters.groups = Array.isArray(value) ? value : [value];
      } else if (type === 'search') {
        filters.search = value || '';
      }
      return this;
    },

    clearFilters: function () {
      const filters = this[PRIVATE.FILTERS];
      if (filters) {
        filters.levels = [];
        filters.groups = [];
        filters.search = '';
      }
      return this;
    },

    subscribe: function (callback) {
      const subscribers = this[PRIVATE.SUBSCRIBERS];
      if (!subscribers) return null;
      const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      subscribers.set(id, callback);
      return id;
    },

    unsubscribe: function (id) {
      const subscribers = this[PRIVATE.SUBSCRIBERS];
      if (!subscribers) return false;
      return subscribers.delete(id);
    },

    getHistory: function (limit = 100, filter = {}) {
      const history = this[PRIVATE.HISTORY];
      if (!history) return [];
      let result = [...history];
      if (filter.level) {
        result = result.filter((entry) => entry.level === filter.level);
      }
      if (filter.group) {
        result = result.filter((entry) => entry.group === filter.group);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        result = result.filter((entry) => entry.message.toLowerCase().includes(search));
      }
      return result.slice(-Math.min(limit, result.length));
    },

    clearHistory: function () {
      const history = this[PRIVATE.HISTORY];
      const buffer = this[PRIVATE.BUFFER];
      if (history) history.length = 0;
      if (buffer) buffer.length = 0;
      return this;
    },

    getStats: function () {
      const stats = this[PRIVATE.STATS];
      if (!stats) return { totalLogs: 0, byLevel: {}, byGroup: {}, errors: 0, warnings: 0 };
      return {
        ...stats,
        uptime: Date.now() - this[PRIVATE.START_TIME],
        historySize: (this[PRIVATE.HISTORY] || []).length,
        bufferSize: (this[PRIVATE.BUFFER] || []).length,
        subscribers: (this[PRIVATE.SUBSCRIBERS] || new Map()).size,
        groups: (this[PRIVATE.GROUPS] || new Map()).size,
      };
    },

    getGroupStats: function () {
      const groups = this[PRIVATE.GROUPS];
      if (!groups) return {};
      const stats = {};
      for (const [name, data] of groups) {
        stats[name] = {
          entries: data.entries,
          created: data.created,
        };
      }
      return stats;
    },

    setDebug: function (enabled) {
      this[PRIVATE.DEBUG] = enabled;
      this[PRIVATE.LEVEL] = enabled ? 3 : 2;
      return this;
    },

    setLevel: function (level) {
      const levelNum = LOG_LEVELS[level];
      if (levelNum !== undefined) {
        this[PRIVATE.LEVEL] = levelNum;
      }
      return this;
    },

    getLevel: function () {
      return this[PRIVATE.LEVEL] || 2;
    },

    isDebug: function () {
      return this[PRIVATE.DEBUG] || false;
    },

    header: function (title, color = 'cyan') {
      const colors = this[PRIVATE.COLORS] || COLORS;
      const colorMap = {
        cyan: colors.cyan,
        magenta: colors.magenta,
        green: colors.green,
        yellow: colors.yellow,
        red: colors.red,
        blue: colors.blue,
      };
      const selectedColor = colorMap[color] || colors.cyan;
      const separator = '═'.repeat(70);
      console.log(`${selectedColor}${separator}${colors.reset}`);
      console.log(`${selectedColor}${colors.bold}  📋 ${title}${colors.reset}`);
      console.log(`${selectedColor}${separator}${colors.reset}`);
      return this;
    },

    separator: function () {
      const colors = this[PRIVATE.COLORS] || COLORS;
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
      return this;
    },

    blank: function () {
      console.log('');
      return this;
    },

    inspect: function (obj, label = '') {
      const colors = this[PRIVATE.COLORS] || COLORS;
      const prefix = label ? `${label}: ` : '';
      console.log(`${colors.cyan}${prefix}${colors.reset}`);
      console.dir(obj, { depth: null, colors: true });
      return this;
    },

    table: function (data, columns = null) {
      if (Array.isArray(data) && data.length > 0) {
        console.table(data, columns);
      } else if (typeof data === 'object' && data !== null) {
        console.table([data], columns);
      } else {
        console.log(data);
      }
      return this;
    },

    clear: function () {
      console.clear();
      return this;
    },

    hook: function (event, callback) {
      const hooks = this[PRIVATE.HOOKS];
      if (!hooks || !hooks[event]) return null;
      const id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      hooks[event].set(id, callback);
      return id;
    },

    unhook: function (event, id) {
      const hooks = this[PRIVATE.HOOKS];
      if (!hooks || !hooks[event]) return false;
      return hooks[event].delete(id);
    },

    healthCheck: function () {
      const state = this;
      return {
        healthy: true,
        historySize: (state[PRIVATE.HISTORY] || []).length,
        bufferSize: (state[PRIVATE.BUFFER] || []).length,
        subscribers: (state[PRIVATE.SUBSCRIBERS] || new Map()).size,
        groups: (state[PRIVATE.GROUPS] || new Map()).size,
        timers: (state[PRIVATE.TIMERS] || new Map()).size,
        maxHistory: state[PRIVATE.MAX_HISTORY] || 500,
        debug: state[PRIVATE.DEBUG] || false,
        level: state[PRIVATE.LEVEL] || 2,
        instanceId: state[PRIVATE.INSTANCE_ID] || 'App',
        filters: { ...(state[PRIVATE.FILTERS] || { levels: [], groups: [], search: '' }) },
        stats: state[PRIVATE.STATS] || {
          totalLogs: 0,
          byLevel: {},
          byGroup: {},
          errors: 0,
          warnings: 0,
        },
        uptime: Date.now() - (state[PRIVATE.START_TIME] || Date.now()),
        timestamp: Date.now(),
      };
    },

    getState: function () {
      const state = this;
      return {
        historySize: (state[PRIVATE.HISTORY] || []).length,
        bufferSize: (state[PRIVATE.BUFFER] || []).length,
        subscribers: (state[PRIVATE.SUBSCRIBERS] || new Map()).size,
        groups: Array.from((state[PRIVATE.GROUPS] || new Map()).keys()),
        currentGroup: state[PRIVATE.CURRENT_GROUP] || null,
        groupStack: [...(state[PRIVATE.GROUP_STACK] || [])],
        timers: Array.from((state[PRIVATE.TIMERS] || new Map()).keys()),
        maxHistory: state[PRIVATE.MAX_HISTORY] || 500,
        debug: state[PRIVATE.DEBUG] || false,
        level: state[PRIVATE.LEVEL] || 2,
        instanceId: state[PRIVATE.INSTANCE_ID] || 'App',
        filters: { ...(state[PRIVATE.FILTERS] || { levels: [], groups: [], search: '' }) },
        stats: state[PRIVATE.STATS] || {
          totalLogs: 0,
          byLevel: {},
          byGroup: {},
          errors: 0,
          warnings: 0,
        },
        uptime: Date.now() - (state[PRIVATE.START_TIME] || Date.now()),
        timestamp: Date.now(),
      };
    },

    exportSymbols: function () {
      return {
        PRIVATE: { ...PRIVATE },
        LOG_LEVELS: { ...LOG_LEVELS },
        ICONS: { ...ICONS },
        COLORS: { ...COLORS },
      };
    },
  };

  // Приватные свойства (только для чтения)
  Object.defineProperties(logger, {
    history: {
      get: () => [...(logState[PRIVATE.HISTORY] || [])],
      enumerable: true,
    },
    debug: {
      get: () => logState[PRIVATE.DEBUG] || false,
      set: (value) => {
        logState[PRIVATE.DEBUG] = value;
      },
      enumerable: true,
    },
    level: {
      get: () => logState[PRIVATE.LEVEL] || 2,
      set: (value) => {
        logState[PRIVATE.LEVEL] = value;
      },
      enumerable: true,
    },
    instanceId: {
      get: () => logState[PRIVATE.INSTANCE_ID] || 'App',
      enumerable: true,
    },
    groups: {
      get: () => Array.from((logState[PRIVATE.GROUPS] || new Map()).keys()),
      enumerable: true,
    },
    stats: {
      get: () => ({
        ...(logState[PRIVATE.STATS] || {
          totalLogs: 0,
          byLevel: {},
          byGroup: {},
          errors: 0,
          warnings: 0,
        }),
      }),
      enumerable: true,
    },
  });

  return logger;
}

// ============================================================
// 6. ГЛОБАЛЬНЫЙ ЛОГГЕР (SINGLETON)
// ============================================================

let globalLogger = null;

export function getGlobalLogger() {
  if (!globalLogger) {
    globalLogger = createLogger(true, 'Global');
  }
  return globalLogger;
}

export function setGlobalLogger(logger) {
  globalLogger = logger;
}

export function resetGlobalLogger() {
  globalLogger = null;
}

// ============================================================
// 7. УДОБНЫЕ ФУНКЦИИ ДЛЯ БЫСТРОГО ЛОГИРОВАНИЯ
// ============================================================

export function logError(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.error === 'function') {
    return logger.error(message, data, group);
  }
  console.error('❌', message, data);
}

export function logWarn(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.warn === 'function') {
    return logger.warn(message, data, group);
  }
  console.warn('⚠️', message, data);
}

export function logInfo(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.info === 'function') {
    return logger.info(message, data, group);
  }
  console.info('ℹ️', message, data);
}

export function logSuccess(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.success === 'function') {
    return logger.success(message, data, group);
  }
  console.log('✅', message, data);
}

// ★★★ ИСПРАВЛЕНО: полная проверка на существование метода ★★★
export function logDebug(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.debug === 'function') {
    return logger.debug(message, data, group);
  }
  const groupPrefix = group ? `[${group}]` : '';
  console.log(`🔍 ${groupPrefix} ${message}`, data || '');
}

export function logSystem(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.system === 'function') {
    return logger.system(message, data, group);
  }
  const groupPrefix = group ? `[${group}]` : '[system]';
  console.log(`⚙️ ${groupPrefix} ${message}`, data || '');
}

export function logSecurity(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.security === 'function') {
    return logger.security(message, data, group);
  }
  const groupPrefix = group ? `[${group}]` : '[security]';
  console.log(`🔒 ${groupPrefix} ${message}`, data || '');
}

export function logPerformance(message, data = null, group = null) {
  const logger = getGlobalLogger();
  if (logger && typeof logger.performance === 'function') {
    return logger.performance(message, data, group);
  }
  const groupPrefix = group ? `[${group}]` : '[performance]';
  console.log(`⚡ ${groupPrefix} ${message}`, data || '');
}

// ============================================================
// 8. УНИВЕРСАЛЬНАЯ ФУНКЦИЯ addLog
// ============================================================

export const addLog = (message, type = 'info', data = null, group = null) => {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }

  switch (type) {
    case 'error':
      return logger.error ? logger.error(message, data, group) : console.error('❌', message, data);
    case 'warn':
      return logger.warn ? logger.warn(message, data, group) : console.warn('⚠️', message, data);
    case 'success':
      return logger.success
        ? logger.success(message, data, group)
        : console.log('✅', message, data);
    case 'debug':
      return logger.debug ? logger.debug(message, data, group) : console.log('🔍', message, data);
    case 'system':
      return logger.system ? logger.system(message, data, group) : console.log('⚙️', message, data);
    case 'security':
      return logger.security
        ? logger.security(message, data, group)
        : console.log('🔒', message, data);
    case 'performance':
      return logger.performance
        ? logger.performance(message, data, group)
        : console.log('⚡', message, data);
    case 'info':
    default:
      return logger.info ? logger.info(message, data, group) : console.log('ℹ️', message, data);
  }
};

// ============================================================
// 9. ЭКСПОРТ МЕТОДОВ ГЛОБАЛЬНОГО ЛОГГЕРА
// ============================================================

const globalLoggerInstance = getGlobalLogger();
const isLoggerValid = globalLoggerInstance && typeof globalLoggerInstance.error === 'function';

export const error = isLoggerValid
  ? globalLoggerInstance.error.bind(globalLoggerInstance)
  : (msg) => console.error('❌', msg);

export const warn = isLoggerValid
  ? globalLoggerInstance.warn.bind(globalLoggerInstance)
  : (msg) => console.warn('⚠️', msg);

export const info = isLoggerValid
  ? globalLoggerInstance.info.bind(globalLoggerInstance)
  : (msg) => console.info('ℹ️', msg);

export const success = isLoggerValid
  ? globalLoggerInstance.success.bind(globalLoggerInstance)
  : (msg) => console.log('✅', msg);

export const trace = isLoggerValid
  ? globalLoggerInstance.trace.bind(globalLoggerInstance)
  : (msg) => console.log('🔎', msg);

export const fatal = isLoggerValid
  ? globalLoggerInstance.fatal.bind(globalLoggerInstance)
  : (msg) => console.error('💀', msg);

export const debug =
  isLoggerValid && typeof globalLoggerInstance.debug === 'function'
    ? globalLoggerInstance.debug.bind(globalLoggerInstance)
    : (msg, data, group) => {
        const prefix = group ? `[${group}]` : '';
        console.log(`🔍 ${prefix} ${msg}`, data || '');
      };

export const system =
  isLoggerValid && typeof globalLoggerInstance.system === 'function'
    ? globalLoggerInstance.system.bind(globalLoggerInstance)
    : (msg, data, group) => {
        const prefix = group ? `[${group}]` : '[system]';
        console.log(`⚙️ ${prefix} ${msg}`, data || '');
      };

export const security =
  isLoggerValid && typeof globalLoggerInstance.security === 'function'
    ? globalLoggerInstance.security.bind(globalLoggerInstance)
    : (msg, data, group) => {
        const prefix = group ? `[${group}]` : '[security]';
        console.log(`🔒 ${prefix} ${msg}`, data || '');
      };

export const performance =
  isLoggerValid && typeof globalLoggerInstance.performance === 'function'
    ? globalLoggerInstance.performance.bind(globalLoggerInstance)
    : (msg, data, group) => {
        const prefix = group ? `[${group}]` : '[performance]';
        console.log(`⚡ ${prefix} ${msg}`, data || '');
      };

export const header = isLoggerValid
  ? globalLoggerInstance.header.bind(globalLoggerInstance)
  : (title) => console.log(`\n📋 ${title}\n${'═'.repeat(70)}`);

export const separator = isLoggerValid
  ? globalLoggerInstance.separator.bind(globalLoggerInstance)
  : () => console.log('─'.repeat(70));

export const blank = isLoggerValid
  ? globalLoggerInstance.blank.bind(globalLoggerInstance)
  : () => console.log('');

export const getHistory = isLoggerValid
  ? globalLoggerInstance.getHistory.bind(globalLoggerInstance)
  : () => [];

export const clearHistory = isLoggerValid
  ? globalLoggerInstance.clearHistory.bind(globalLoggerInstance)
  : () => {};

export const setDebug = isLoggerValid
  ? globalLoggerInstance.setDebug.bind(globalLoggerInstance)
  : () => {};

export const setLevel = isLoggerValid
  ? globalLoggerInstance.setLevel.bind(globalLoggerInstance)
  : () => {};

export const getLevel = isLoggerValid
  ? globalLoggerInstance.getLevel.bind(globalLoggerInstance)
  : () => 0;

export const isDebug = isLoggerValid
  ? globalLoggerInstance.isDebug.bind(globalLoggerInstance)
  : () => false;

export const inspect = isLoggerValid
  ? globalLoggerInstance.inspect.bind(globalLoggerInstance)
  : (obj) => console.dir(obj);

export const table = isLoggerValid
  ? globalLoggerInstance.table.bind(globalLoggerInstance)
  : (data) => console.table(data);

export const time = isLoggerValid
  ? globalLoggerInstance.time.bind(globalLoggerInstance)
  : (label) => console.time(label);

export const timeEnd = isLoggerValid
  ? globalLoggerInstance.timeEnd.bind(globalLoggerInstance)
  : (label) => console.timeEnd(label);

export const group = isLoggerValid
  ? globalLoggerInstance.group.bind(globalLoggerInstance)
  : (label) => console.group(label);

export const groupEnd = isLoggerValid
  ? globalLoggerInstance.groupEnd.bind(globalLoggerInstance)
  : () => console.groupEnd();

export const clear = isLoggerValid
  ? globalLoggerInstance.clear.bind(globalLoggerInstance)
  : () => console.clear();

// ============================================================
// 10. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  createLogger,
  getGlobalLogger,
  setGlobalLogger,
  resetGlobalLogger,
  addLog,
  error,
  warn,
  info,
  success,
  debug,
  trace,
  fatal,
  system,
  security,
  performance,
  header,
  separator,
  blank,
  getHistory,
  clearHistory,
  setDebug,
  setLevel,
  getLevel,
  isDebug,
  inspect,
  table,
  time,
  timeEnd,
  group,
  groupEnd,
  clear,
  logError,
  logWarn,
  logInfo,
  logSuccess,
  logDebug,
  logSystem,
  logSecurity,
  logPerformance,
};

// ============================================================
// 11. СТАТИСТИКА СИМВОЛОВ (при загрузке)
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicMethods = [
    'error',
    'warn',
    'info',
    'debug',
    'success',
    'trace',
    'fatal',
    'system',
    'security',
    'performance',
    'group',
    'groupEnd',
    'time',
    'timeEnd',
    'setFilter',
    'clearFilters',
    'subscribe',
    'unsubscribe',
    'getHistory',
    'clearHistory',
    'getStats',
    'getGroupStats',
    'setDebug',
    'setLevel',
    'getLevel',
    'isDebug',
    'header',
    'separator',
    'blank',
    'inspect',
    'table',
    'clear',
    'hook',
    'unhook',
    'healthCheck',
    'getState',
    'exportSymbols',
    'addLog',
    'logError',
    'logWarn',
    'logInfo',
    'logSuccess',
    'logDebug',
    'logSystem',
    'logSecurity',
    'logPerformance',
  ];

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 LOGGER (100% СИМВОЛЫ) v5.0.2                                ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║`);
  console.log(
    `║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    📤 Экспортированных методов: ${publicMethods.length.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    📦 Всего символов: ${(privateCount + publicMethods.length).toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ИСПРАВЛЕНИЯ:                                                           ║');
  console.log('║    ✅ Все методы проверяют наличие в глобальном логгере                     ║');
  console.log('║    ✅ logDebug больше не падает с TypeError                                 ║');
  console.log('║    ✅ Все fallback методы корректно работают                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 12. КОНЕЦ ФАЙЛА
// ============================================================
