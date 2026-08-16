// ============================================================
// app/logger.js — 100% СИМВОЛЫ — система логирования
// Версия: 4.0.8 (МОДУЛЬНАЯ — СТАБИЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { LOGGER_SYMBOLS } from './config.js';

// ============================================================
// 2. СОЗДАНИЕ ЛОГГЕРА (100% СИМВОЛЫ)
// ============================================================

/**
 * Создает экземпляр логгера с полной изоляцией через символы
 * @param {boolean} debug - Включить отладку
 * @param {string} instanceId - Идентификатор экземпляра
 * @returns {Object} Логгер с методами для логирования
 */
export function createLogger(debug = true, instanceId = 'App') {
  // Приватное состояние логгера (100% символы)
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
      white: '\x1b[37m',
    },
  };

  // ============================================================
  // 3. ОСНОВНОЙ МЕТОД ЛОГИРОВАНИЯ
  // ============================================================

  /**
   * Внутренний метод логирования
   */
  const logMethod = function (level, message, data = null) {
    // Уровни логирования
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      success: 2,
      trace: 4,
      fatal: 0,
    };

    const currentLevel = this[LOGGER_SYMBOLS.LEVEL] || 2;
    const msgLevel = levels[level] || 2;

    // Проверка уровня
    if (msgLevel > currentLevel) return;

    // Форматирование времени
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${this[LOGGER_SYMBOLS.INSTANCE_ID]}]`;

    // Сохранение в историю
    this[LOGGER_SYMBOLS.HISTORY].push({
      timestamp,
      level,
      message,
      data: data !== null && data !== undefined ? data : null,
      id: Date.now() + Math.random(),
    });

    // Ограничение истории
    if (this[LOGGER_SYMBOLS.HISTORY].length > this[LOGGER_SYMBOLS.MAX_HISTORY]) {
      this[LOGGER_SYMBOLS.HISTORY].shift();
    }

    // Иконки для уровней
    const icons = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
      success: '✅',
      trace: '🔎',
      fatal: '💀',
    };
    const icon = icons[level] || '📌';

    // Цвета для уровней
    const colors = this[LOGGER_SYMBOLS.COLORS];
    const colorMap = {
      error: colors.red,
      warn: colors.yellow,
      info: colors.blue,
      debug: colors.gray,
      success: colors.green,
      trace: colors.cyan,
      fatal: colors.red,
    };
    const color = colorMap[level] || colors.white;

    // Вывод в консоль
    if (data !== null && data !== undefined) {
      console.log(`${color}${icon} ${prefix} ${message}${colors.reset}`, data);
    } else {
      console.log(`${color}${icon} ${prefix} ${message}${colors.reset}`);
    }
  };

  const boundLog = logMethod.bind(logState);

  // ============================================================
  // 4. ПУБЛИЧНЫЕ МЕТОДЫ ЛОГГЕРА
  // ============================================================

  const methods = {
    /**
     * Логирование ошибки
     */
    error: (msg, d) => boundLog('error', msg, d),

    /**
     * Логирование предупреждения
     */
    warn: (msg, d) => boundLog('warn', msg, d),

    /**
     * Логирование информации
     */
    info: (msg, d) => boundLog('info', msg, d),

    /**
     * Логирование отладки
     */
    debug: (msg, d) => boundLog('debug', msg, d),

    /**
     * Логирование успеха
     */
    success: (msg, d) => boundLog('success', msg, d),

    /**
     * Логирование трассировки
     */
    trace: (msg, d) => boundLog('trace', msg, d),

    /**
     * Логирование фатальной ошибки
     */
    fatal: (msg, d) => boundLog('fatal', msg, d),

    /**
     * Вывод заголовка с разделителем
     */
    header: (title, color = '#636e72') => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      const separator = '═'.repeat(70);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
      console.log(`${colors.bold}${colors.magenta}  🏢 ${title}${colors.reset}`);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
    },

    /**
     * Вывод разделителя
     */
    separator: (color = '#636e72') => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
    },

    /**
     * Вывод пустой строки
     */
    blank: () => {
      console.log('');
    },

    /**
     * Получение истории логов
     */
    getHistory() {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    /**
     * Очистка истории
     */
    clearHistory() {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    /**
     * Включение/выключение отладки
     */
    setDebug(enabled) {
      this[LOGGER_SYMBOLS.DEBUG] = enabled;
      this[LOGGER_SYMBOLS.LEVEL] = enabled ? 3 : 2;
      return this;
    },

    /**
     * Установка уровня логирования
     * @param {number} level - 0=fatal, 1=error, 2=warn, 3=info, 4=debug, 5=trace
     */
    setLevel(level) {
      if (level >= 0 && level <= 5) {
        this[LOGGER_SYMBOLS.LEVEL] = level;
      }
      return this;
    },

    /**
     * Получение текущего уровня логирования
     */
    getLevel() {
      return this[LOGGER_SYMBOLS.LEVEL];
    },

    /**
     * Проверка, включена ли отладка
     */
    isDebug() {
      return this[LOGGER_SYMBOLS.DEBUG];
    },

    /**
     * Форматирование и вывод объекта
     */
    inspect(obj, label = '') {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      const prefix = label ? `${label}: ` : '';
      console.log(`${colors.cyan}${prefix}${colors.reset}`);
      console.dir(obj, { depth: null, colors: true });
      return this;
    },

    /**
     * Вывод таблицы данных
     */
    table(data, columns = null) {
      if (Array.isArray(data) && data.length > 0) {
        console.table(data, columns);
      } else if (typeof data === 'object' && data !== null) {
        console.table([data], columns);
      } else {
        console.log(data);
      }
      return this;
    },

    /**
     * Замер времени выполнения
     */
    time(label) {
      console.time(label);
      return this;
    },

    /**
     * Окончание замера времени
     */
    timeEnd(label) {
      console.timeEnd(label);
      return this;
    },

    /**
     * Группировка логов
     */
    group(label, collapsed = false) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
      return this;
    },

    /**
     * Закрытие группы
     */
    groupEnd() {
      console.groupEnd();
      return this;
    },

    /**
     * Очистка консоли
     */
    clear() {
      console.clear();
      return this;
    },
  };

  // ============================================================
  // 5. СОЗДАНИЕ ОБЪЕКТА ЛОГГЕРА
  // ============================================================

  const logger = {};
  for (const [key, fn] of Object.entries(methods)) {
    logger[key] = fn.bind(logState);
  }

  // Экспорт приватных свойств (только для чтения)
  Object.defineProperties(logger, {
    history: {
      get: () => [...logState[LOGGER_SYMBOLS.HISTORY]],
      enumerable: true,
    },
    maxHistory: {
      get: () => logState[LOGGER_SYMBOLS.MAX_HISTORY],
      set: value => {
        logState[LOGGER_SYMBOLS.MAX_HISTORY] = value;
      },
      enumerable: true,
    },
    debug: {
      get: () => logState[LOGGER_SYMBOLS.DEBUG],
      set: value => {
        logState[LOGGER_SYMBOLS.DEBUG] = value;
      },
      enumerable: true,
    },
    instanceId: {
      get: () => logState[LOGGER_SYMBOLS.INSTANCE_ID],
      enumerable: true,
    },
    level: {
      get: () => logState[LOGGER_SYMBOLS.LEVEL],
      set: value => {
        logState[LOGGER_SYMBOLS.LEVEL] = value;
      },
      enumerable: true,
    },
    colors: {
      get: () => ({ ...logState[LOGGER_SYMBOLS.COLORS] }),
      enumerable: true,
    },
  });

  // Заморозка для защиты от изменений
  Object.freeze(logger.history);
  Object.freeze(logger.colors);

  return logger;
}

// ============================================================
// 6. СОЗДАНИЕ ГЛОБАЛЬНОГО ЛОГГЕРА (SINGLETON)
// ============================================================

let globalLogger = null;

/**
 * Получение глобального логгера (синглтон)
 */
export function getGlobalLogger() {
  if (!globalLogger) {
    globalLogger = createLogger(true, 'GlobalApp');
  }
  return globalLogger;
}

/**
 * Установка глобального логгера
 */
export function setGlobalLogger(logger) {
  globalLogger = logger;
}

/**
 * Сброс глобального логгера
 */
export function resetGlobalLogger() {
  globalLogger = null;
}

// ============================================================
// 7. УДОБНЫЕ ФУНКЦИИ ДЛЯ БЫСТРОГО ЛОГИРОВАНИЯ
// ============================================================

/**
 * Быстрое логирование ошибки
 */
export function logError(message, data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }
  return logger.error(message, data);
}

/**
 * Быстрое логирование предупреждения
 */
export function logWarn(message, data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }
  return logger.warn(message, data);
}

/**
 * Быстрое логирование информации
 */
export function logInfo(message, data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }
  return logger.info(message, data);
}

/**
 * Быстрое логирование успеха
 */
export function logSuccess(message, data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }
  return logger.success(message, data);
}

/**
 * Быстрое логирование отладки
 */
export function logDebug(message, data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }
  return logger.debug(message, data);
}

// ============================================================
// 7.5. АЛИАС ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ★★★ ИСПРАВЛЕНО ★★★
// ============================================================

/**
 * Универсальная функция для добавления логов (алиас)
 * @param {string} message - Сообщение для логирования
 * @param {string} type - Тип сообщения (info, error, warn, success, debug)
 * @param {*} data - Дополнительные данные
 */
export function addLog(message, type = 'info', data = null) {
  const logger = getGlobalLogger();
  if (!logger) {
    console.warn('⚠️ Логгер не инициализирован:', message);
    return;
  }

  // ★★★ ИСПРАВЛЕНО: полная обработка всех типов ★★★
  switch (type) {
    case 'error':
      return logger.error(message, data);
    case 'warn':
      return logger.warn(message, data);
    case 'success':
      return logger.success(message, data);
    case 'debug':
      // Проверяем наличие метода debug
      if (typeof logger.debug === 'function') {
        return logger.debug(message, data);
      }
      // fallback на info если debug не доступен
      return logger.info(message, data);
    case 'info':
    default:
      return logger.info(message, data);
  }
}

// ============================================================
// 8. ФОРМАТТЕРЫ ДЛЯ ЛОГОВ
// ============================================================

/**
 * Форматирование объекта для лога
 */
export function formatLogData(data, maxDepth = 3) {
  try {
    if (typeof data === 'undefined') return 'undefined';
    if (data === null) return 'null';
    if (typeof data === 'function') return `[Function: ${data.name || 'anonymous'}]`;
    if (typeof data === 'symbol') return data.toString();
    if (typeof data === 'bigint') return `${data.toString()}n`;
    if (typeof data !== 'object') return String(data);

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    if (maxDepth <= 0) return '[Object]';

    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = formatLogData(value, maxDepth - 1);
      } else if (typeof value === 'function') {
        result[key] = `[Function: ${value.name || 'anonymous'}]`;
      } else {
        result[key] = value;
      }
    }
    return result;
  } catch (error) {
    return `[Error formatting: ${error.message}]`;
  }
}

/**
 * Безопасная сериализация для логов
 */
export function safeStringify(data, maxLength = 200) {
  try {
    const str = JSON.stringify(data);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  } catch {
    return String(data);
  }
}

// ============================================================
// 9. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  createLogger,
  getGlobalLogger,
  setGlobalLogger,
  resetGlobalLogger,
  logError,
  logWarn,
  logInfo,
  logSuccess,
  logDebug,
  addLog,
  formatLogData,
  safeStringify,
};

// ============================================================
// 10. ЭКСПОРТ МЕТОДОВ ГЛОБАЛЬНОГО ЛОГГЕРА
// ============================================================

// Получаем глобальный логгер
const globalLoggerInstance = getGlobalLogger();

// Проверяем, что логгер инициализирован и имеет нужные методы
const isLoggerValid = globalLoggerInstance && typeof globalLoggerInstance.error === 'function';

// Экспортируем методы глобального логгера
export const error = isLoggerValid
  ? globalLoggerInstance.error.bind(globalLoggerInstance)
  : () => {};
export const warn = isLoggerValid ? globalLoggerInstance.warn.bind(globalLoggerInstance) : () => {};
export const info = isLoggerValid ? globalLoggerInstance.info.bind(globalLoggerInstance) : () => {};
export const debug =
  isLoggerValid && typeof globalLoggerInstance.debug === 'function'
    ? globalLoggerInstance.debug.bind(globalLoggerInstance)
    : () => {};
export const success = isLoggerValid
  ? globalLoggerInstance.success.bind(globalLoggerInstance)
  : () => {};
export const trace = isLoggerValid
  ? globalLoggerInstance.trace.bind(globalLoggerInstance)
  : () => {};
export const fatal = isLoggerValid
  ? globalLoggerInstance.fatal.bind(globalLoggerInstance)
  : () => {};
export const header = isLoggerValid
  ? globalLoggerInstance.header.bind(globalLoggerInstance)
  : () => {};
export const separator = isLoggerValid
  ? globalLoggerInstance.separator.bind(globalLoggerInstance)
  : () => {};
export const blank = isLoggerValid
  ? globalLoggerInstance.blank.bind(globalLoggerInstance)
  : () => {};
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
  : () => {};
export const table = isLoggerValid
  ? globalLoggerInstance.table.bind(globalLoggerInstance)
  : () => {};
export const time = isLoggerValid ? globalLoggerInstance.time.bind(globalLoggerInstance) : () => {};
export const timeEnd = isLoggerValid
  ? globalLoggerInstance.timeEnd.bind(globalLoggerInstance)
  : () => {};
export const group = isLoggerValid
  ? globalLoggerInstance.group.bind(globalLoggerInstance)
  : () => {};
export const groupEnd = isLoggerValid
  ? globalLoggerInstance.groupEnd.bind(globalLoggerInstance)
  : () => {};
export const clear = isLoggerValid
  ? globalLoggerInstance.clear.bind(globalLoggerInstance)
  : () => {};

// ============================================================
// 11. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateSymbols = Object.keys(LOGGER_SYMBOLS).length;
  const exportedFns = [
    'error',
    'warn',
    'info',
    'debug',
    'success',
    'trace',
    'fatal',
    'header',
    'separator',
    'blank',
    'getHistory',
    'clearHistory',
    'setDebug',
    'setLevel',
    'getLevel',
    'isDebug',
    'inspect',
    'table',
    'time',
    'timeEnd',
    'group',
    'groupEnd',
    'clear',
    'addLog',
    'createLogger',
    'getGlobalLogger',
    'setGlobalLogger',
    'resetGlobalLogger',
    'logError',
    'logWarn',
    'logInfo',
    'logSuccess',
    'logDebug',
    'formatLogData',
    'safeStringify',
  ].length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 LOGGER (100% СИМВОЛЫ) v4.0.8                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(
    `║    🔑 Приватных символов: ${privateSymbols.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    📤 Экспортированных функций: ${exportedFns.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    📦 Всего символов: ${(privateSymbols + exportedFns).toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ МЕТОДЫ:                                                      ║');
  console.log('║    ✅ createLogger()    — создание логгера                                 ║');
  console.log('║    ✅ getGlobalLogger() — получение глобального логгера                    ║');
  console.log('║    ✅ setGlobalLogger() — установка глобального логгера                    ║');
  console.log('║    ✅ resetGlobalLogger()— сброс глобального логгера                       ║');
  console.log('║    ✅ addLog(msg, type) — универсальное логирование ★★★                    ║');
  console.log('║    ✅ error(msg, data)  — логирование ошибки                               ║');
  console.log('║    ✅ warn(msg, data)   — логирование предупреждения                       ║');
  console.log('║    ✅ info(msg, data)   — логирование информации                           ║');
  console.log('║    ✅ debug(msg, data)  — логирование отладки                              ║');
  console.log('║    ✅ success(msg,data) — логирование успеха                               ║');
  console.log('║    ✅ trace(msg, data)  — логирование трассировки                          ║');
  console.log('║    ✅ fatal(msg, data)  — логирование фатальной ошибки                     ║');
  console.log('║    ✅ header(title)     — вывод заголовка                                  ║');
  console.log('║    ✅ separator()       — вывод разделителя                                ║');
  console.log('║    ✅ blank()           — вывод пустой строки                              ║');
  console.log('║    ✅ getHistory()      — история логов                                    ║');
  console.log('║    ✅ clearHistory()    — очистка истории                                  ║');
  console.log('║    ✅ setDebug()        — включение/выключение отладки                     ║');
  console.log('║    ✅ setLevel()        — установка уровня логирования                     ║');
  console.log('║    ✅ getLevel()        — получение уровня логирования                     ║');
  console.log('║    ✅ isDebug()         — проверка отладки                                 ║');
  console.log('║    ✅ inspect(obj)      — инспектирование объекта                          ║');
  console.log('║    ✅ table(data)       — вывод таблицы                                    ║');
  console.log('║    ✅ time(label)       — замер времени                                    ║');
  console.log('║    ✅ timeEnd(label)    — окончание замера времени                         ║');
  console.log('║    ✅ group(label)      — группировка логов                                ║');
  console.log('║    ✅ groupEnd()        — закрытие группы                                  ║');
  console.log('║    ✅ clear()           — очистка консоли                                  ║');
  console.log('║    ✅ formatLogData()   — форматирование объекта для лога                  ║');
  console.log('║    ✅ safeStringify()   — безопасная сериализация                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 12. КОНЕЦ ФАЙЛА
// ============================================================
