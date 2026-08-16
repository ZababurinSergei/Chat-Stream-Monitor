// ============================================================
// app/utils.js — 100% СИМВОЛЫ — утилиты
// Версия: 4.0.8
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Символы для кэширования результатов
  CACHE: Symbol('utils.cache'),
  CACHE_TTL: Symbol('utils.cacheTTL'),
  CACHE_MAX_SIZE: Symbol('utils.cacheMaxSize'),
  CACHE_HITS: Symbol('utils.cacheHits'),
  CACHE_MISSES: Symbol('utils.cacheMisses'),

  // Символы для форматирования
  DATE_FORMAT: Symbol('utils.dateFormat'),
  TIME_FORMAT: Symbol('utils.timeFormat'),
  NUMBER_FORMAT: Symbol('utils.numberFormat'),

  // Символы для безопасности
  SANITIZE_PATTERNS: Symbol('utils.sanitizePatterns'),
  ESCAPE_MAP: Symbol('utils.escapeMap'),
  UNESCAPE_MAP: Symbol('utils.unescapeMap'),

  // Символы для валидации
  VALIDATION_RULES: Symbol('utils.validationRules'),
  TYPE_CHECKERS: Symbol('utils.typeCheckers'),

  // Символы для логов
  LOG_LEVELS: Symbol('utils.logLevels'),
  LOG_HISTORY: Symbol('utils.logHistory'),

  // Символы для производительности
  PERFORMANCE_MARKS: Symbol('utils.performanceMarks'),
  PERFORMANCE_MEASURES: Symbol('utils.performanceMeasures'),

  // Символы для работы с памятью
  MEMORY_CACHE: Symbol('utils.memoryCache'),
  MEMORY_LIMIT: Symbol('utils.memoryLimit'),
};

// ============================================================
// 2. КОНФИГУРАЦИЯ УТИЛИТ
// ============================================================

const UTIL_CONFIG = {
  cacheEnabled: true,
  cacheTTL: 60000, // 1 минута
  cacheMaxSize: 1000,
  dateFormat: 'ru-RU',
  timeFormat: 'ru-RU',
  numberFormat: 'ru-RU',
  maxStringLength: 10000,
  maxDeepCopyDepth: 10,
  sanitizeInput: true,
  escapeHtml: true,
  logLevel: 'info', // debug, info, warn, error
  performanceMonitoring: false,
};

// ============================================================
// 3. ВНУТРЕННЕЕ СОСТОЯНИЕ
// ============================================================

const UTIL_STATE = {
  [PRIVATE.CACHE]: new Map(),
  [PRIVATE.CACHE_TTL]: UTIL_CONFIG.cacheTTL,
  [PRIVATE.CACHE_MAX_SIZE]: UTIL_CONFIG.cacheMaxSize,
  [PRIVATE.CACHE_HITS]: 0,
  [PRIVATE.CACHE_MISSES]: 0,
  [PRIVATE.ESCAPE_MAP]: {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  },
  [PRIVATE.UNESCAPE_MAP]: {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  },
  [PRIVATE.SANITIZE_PATTERNS]: [
    /<script[^>]*>([\s\S]*?)<\/script>/gi,
    /<iframe[^>]*>([\s\S]*?)<\/iframe>/gi,
    /<object[^>]*>([\s\S]*?)<\/object>/gi,
    /<embed[^>]*>([\s\S]*?)<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
  ],
  [PRIVATE.VALIDATION_RULES]: {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    rgbColor: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
    hslColor: /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/,
    ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
    creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
    postalCode: /^[0-9]{5}(?:-[0-9]{4})?$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    dateISO: /^\d{4}-\d{2}-\d{2}$/,
    dateTimeISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    time: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
    base64: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
    json: /^[\],:{}\s]*$|^[\],:{}\s]*[\w"\-+.]*[\],:{}\s]*$/,
    htmlTag: /<[^>]+>/g,
    whitespace: /^\s+|\s+$/g,
    multipleSpaces: /\s{2,}/g,
    newline: /\r\n|\r|\n/g,
    punctuation: /[^\w\s]/g,
  },
  [PRIVATE.TYPE_CHECKERS]: {
    isArray: (val) => Array.isArray(val),
    isObject: (val) => val !== null && typeof val === 'object' && !Array.isArray(val),
    isString: (val) => typeof val === 'string',
    isNumber: (val) => typeof val === 'number' && !isNaN(val),
    isBoolean: (val) => typeof val === 'boolean',
    isFunction: (val) => typeof val === 'function',
    isSymbol: (val) => typeof val === 'symbol',
    isBigInt: (val) => typeof val === 'bigint',
    isDate: (val) => val instanceof Date && !isNaN(val.getTime()),
    isRegExp: (val) => val instanceof RegExp,
    isError: (val) => val instanceof Error,
    isPromise: (val) => val instanceof Promise,
    isMap: (val) => val instanceof Map,
    isSet: (val) => val instanceof Set,
    isWeakMap: (val) => val instanceof WeakMap,
    isWeakSet: (val) => val instanceof WeakSet,
    isArrayBuffer: (val) => val instanceof ArrayBuffer,
    isDataView: (val) => val instanceof DataView,
    isBlob: (val) => val instanceof Blob,
    isFile: (val) => val instanceof File,
    isFormData: (val) => val instanceof FormData,
    isURLSearchParams: (val) => val instanceof URLSearchParams,
    isHeaders: (val) => val instanceof Headers,
    isRequest: (val) => val instanceof Request,
    isResponse: (val) => val instanceof Response,
  },
  [PRIVATE.LOG_LEVELS]: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  [PRIVATE.LOG_HISTORY]: [],
  [PRIVATE.PERFORMANCE_MARKS]: new Map(),
  [PRIVATE.PERFORMANCE_MEASURES]: [],
  [PRIVATE.MEMORY_CACHE]: new Map(),
  [PRIVATE.MEMORY_LIMIT]: 50 * 1024 * 1024, // 50MB
};

// ============================================================
// 4. ОСНОВНЫЕ УТИЛИТЫ
// ============================================================

/**
 * Экранирование HTML-символов
 * @param {*} text - Текст для экранирования
 * @param {Object} options - Опции экранирования
 * @returns {string} - Экранированный текст
 */
export function escapeHtml(text, options = {}) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);

  const {
    doubleEncode = false,
    preserveTags = false,
    preserveAttributes = false,
    preserveComments = false,
  } = options;

  // Если нужно сохранить теги
  if (preserveTags) {
    // Сохраняем теги для дальнейшего экранирования
    const tagMap = new Map();
    let tagIndex = 0;
    let processed = text.replace(/<[^>]+>/g, (match) => {
      const placeholder = `__TAG_${tagIndex}__`;
      tagMap.set(placeholder, match);
      tagIndex++;
      return placeholder;
    });

    // Экранируем остальной текст
    let result = escapeHtmlBasic(processed);

    // Восстанавливаем теги
    for (const [placeholder, tag] of tagMap) {
      result = result.replace(placeholder, tag);
    }

    return result;
  }

  // Стандартное экранирование
  const escaped = escapeHtmlBasic(text);

  // Двойное экранирование
  if (doubleEncode) {
    return escapeHtmlBasic(escaped);
  }

  return escaped;
}

/**
 * Базовое экранирование HTML
 * @param {string} text - Текст для экранирования
 * @returns {string} - Экранированный текст
 */
function escapeHtmlBasic(text) {
  const escapeMap = UTIL_STATE[PRIVATE.ESCAPE_MAP];
  return text.replace(/[&<>"'`=\/]/g, (char) => escapeMap[char] || char);
}

/**
 * Обратное экранирование HTML
 * @param {string} text - Текст для обратного экранирования
 * @returns {string} - Оригинальный текст
 */
export function unescapeHtml(text) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);

  const unescapeMap = UTIL_STATE[PRIVATE.UNESCAPE_MAP];
  return text.replace(/&(?:amp|lt|gt|quot|#039|#x2F|#x60|#x3D);/g, (entity) => {
    return unescapeMap[entity] || entity;
  });
}

/**
 * Санитизация HTML (удаление опасных тегов и атрибутов)
 * @param {string} text - Текст для санитизации
 * @param {Object} options - Опции санитизации
 * @returns {string} - Санитизированный текст
 */
export function sanitizeHtml(text, options = {}) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);

  const {
    removeScripts = true,
    removeIframes = true,
    removeObjects = true,
    removeEmbeds = true,
    removeLinks = true,
    removeMeta = true,
    removeEvents = true,
    removeJavascript = true,
    removeData = true,
    allowTags = [],
    allowAttributes = [],
  } = options;

  let sanitized = text;

  // Удаляем скрипты
  if (removeScripts) {
    sanitized = sanitized.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  }

  // Удаляем iframe
  if (removeIframes) {
    sanitized = sanitized.replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '');
  }

  // Удаляем object
  if (removeObjects) {
    sanitized = sanitized.replace(/<object[^>]*>([\s\S]*?)<\/object>/gi, '');
  }

  // Удаляем embed
  if (removeEmbeds) {
    sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  }

  // Удаляем link
  if (removeLinks) {
    sanitized = sanitized.replace(/<link[^>]*>/gi, '');
  }

  // Удаляем meta
  if (removeMeta) {
    sanitized = sanitized.replace(/<meta[^>]*>/gi, '');
  }

  // Удаляем обработчики событий
  if (removeEvents) {
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Удаляем javascript:
  if (removeJavascript) {
    sanitized = sanitized.replace(/javascript:/gi, '');
  }

  // Удаляем data:
  if (removeData) {
    sanitized = sanitized.replace(/data:/gi, '');
  }

  return sanitized;
}

/**
 * Форматирование JSON с отступами
 * @param {*} obj - Объект для форматирования
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированный JSON
 */
export function formatJson(obj, options = {}) {
  const {
    indent = 2,
    maxDepth = 10,
    maxLength = 10000,
    sortKeys = false,
    circular = '[Circular]',
    undefined = '[Undefined]',
    function: functionLabel = '[Function]',
    symbol = '[Symbol]',
    bigInt = (v) => `${v.toString()}n`,
  } = options;

  try {
    // Обработка циклических ссылок
    const seen = new WeakSet();

    const replacer = (key, value) => {
      // Проверка циклических ссылок
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return circular;
        }
        seen.add(value);
      }

      // Обработка специальных типов
      if (typeof value === 'undefined') {
        return undefined;
      }

      if (typeof value === 'function') {
        return functionLabel;
      }

      if (typeof value === 'symbol') {
        return symbol;
      }

      if (typeof value === 'bigint') {
        return typeof bigInt === 'function' ? bigInt(value) : value.toString();
      }

      // Ограничение глубины
      if (key && typeof value === 'object' && value !== null) {
        try {
          const depth = key.split('.').length;
          if (depth > maxDepth) {
            return `[Max Depth Reached]`;
          }
        } catch (e) {
          // Игнорируем ошибки при вычислении глубины
        }
      }

      return value;
    };

    const json = JSON.stringify(obj, sortKeys ? (key, value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value)
            .sort()
            .reduce((acc, k) => {
              acc[k] = value[k];
              return acc;
            }, {});
      }
      return value;
    } : replacer, indent);

    // Ограничение длины
    if (json.length > maxLength) {
      return json.substring(0, maxLength) + '... (truncated)';
    }

    return json;
  } catch (error) {
    return `[JSON Error: ${error.message}]`;
  }
}

/**
 * Форматирование времени
 * @param {number|Date} ts - Временная метка или объект Date
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированное время
 */
export function formatTime(ts, options = {}) {
  try {
    const date = ts instanceof Date ? ts : new Date(ts);
    if (isNaN(date.getTime())) {
      return '--:--:--.---';
    }

    const {
      locale = 'ru-RU',
      hour12 = false,
      showMs = true,
      showDate = false,
      timeZone = undefined,
      format = 'time',
    } = options;

    const config = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12,
      timeZone,
    };

    let result;

    if (format === 'date') {
      result = date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone,
      });
    } else if (format === 'datetime') {
      result = date.toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12,
        timeZone,
      });
    } else if (format === 'iso') {
      result = date.toISOString();
    } else if (format === 'relative') {
      result = formatRelativeTime(date);
    } else {
      result = date.toLocaleTimeString(locale, config);
    }

    // Добавление миллисекунд
    if (showMs && format === 'time') {
      const ms = date.getMilliseconds();
      result = result + '.' + ms.toString().padStart(3, '0');
    }

    return result;
  } catch (error) {
    return '--:--:--.---';
  }
}

/**
 * Форматирование относительного времени
 * @param {Date} date - Объект Date
 * @returns {string} - Относительное время
 */
function formatRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const suffix = diff < 0 ? ' через' : ' назад';

  if (seconds < 60) {
    return seconds + ' сек' + suffix;
  } else if (minutes < 60) {
    return minutes + ' мин' + suffix;
  } else if (hours < 24) {
    return hours + ' ч' + suffix;
  } else if (days < 7) {
    return days + ' д' + suffix;
  } else if (weeks < 4) {
    return weeks + ' нед' + suffix;
  } else if (months < 12) {
    return months + ' мес' + suffix;
  } else {
    return years + ' г' + suffix;
  }
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированный размер
 */
export function formatFileSize(bytes, options = {}) {
  if (bytes === 0) return '0 B';
  if (!bytes || bytes < 0) return 'Invalid';

  const {
    decimals = 2,
    unit = 'auto', // auto, B, KB, MB, GB, TB, PB
    locale = 'ru-RU',
    showUnit = true,
  } = options;

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let unitIndex = 0;

  if (unit !== 'auto') {
    const index = units.indexOf(unit);
    if (index !== -1) {
      unitIndex = index;
    }
  } else {
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024;
      unitIndex++;
    }
  }

  const formatted = bytes.toFixed(decimals);
  return showUnit ? `${formatted} ${units[unitIndex]}` : formatted;
}

/**
 * Форматирование числа с разделителями
 * @param {number} num - Число для форматирования
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированное число
 */
export function formatNumber(num, options = {}) {
  if (num === undefined || num === null || isNaN(num)) {
    return 'NaN';
  }

  const {
    locale = 'ru-RU',
    decimals = 0,
    thousandSeparator = ' ',
    decimalSeparator = ',',
    currency = false,
    currencyCode = 'RUB',
    percent = false,
    prefix = '',
    suffix = '',
  } = options;

  let formatted = Number(num).toFixed(decimals);

  // Разделитель тысяч
  if (thousandSeparator) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    formatted = parts.join(decimalSeparator);
  }

  // Валюта
  if (currency) {
    return `${prefix}${formatted} ${currencyCode}${suffix}`;
  }

  // Проценты
  if (percent) {
    return `${prefix}${formatted}%${suffix}`;
  }

  return `${prefix}${formatted}${suffix}`;
}

/**
 * Глубокое копирование объекта
 * @param {*} obj - Объект для копирования
 * @param {Object} options - Опции копирования
 * @returns {*} - Копия объекта
 */
export function deepClone(obj, options = {}) {
  const {
    maxDepth = UTIL_CONFIG.maxDeepCopyDepth,
    preserveFunctions = false,
    preserveSymbols = false,
    preserveDates = true,
    preserveRegExps = true,
    preserveMaps = true,
    preserveSets = true,
    preserveErrors = false,
    circular = null,
    cache = new WeakMap(),
    depth = 0,
  } = options;

  if (depth > maxDepth) {
    return `[Max Depth Reached]`;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Примитивы
  if (typeof obj !== 'object') {
    return obj;
  }

  // Проверка циклических ссылок
  if (cache.has(obj)) {
    return circular !== null ? circular : `[Circular Reference]`;
  }
  cache.set(obj, true);

  // Date
  if (preserveDates && obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // RegExp
  if (preserveRegExps && obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  // Map
  if (preserveMaps && obj instanceof Map) {
    const newMap = new Map();
    for (const [key, value] of obj) {
      newMap.set(
          deepClone(key, { ...options, depth: depth + 1, cache }),
          deepClone(value, { ...options, depth: depth + 1, cache })
      );
    }
    return newMap;
  }

  // Set
  if (preserveSets && obj instanceof Set) {
    const newSet = new Set();
    for (const value of obj) {
      newSet.add(deepClone(value, { ...options, depth: depth + 1, cache }));
    }
    return newSet;
  }

  // Error
  if (preserveErrors && obj instanceof Error) {
    const newError = new Error(obj.message);
    newError.name = obj.name;
    newError.stack = obj.stack;
    return newError;
  }

  // Функции
  if (typeof obj === 'function') {
    return preserveFunctions ? obj : `[Function]`;
  }

  // Символы
  if (typeof obj === 'symbol') {
    return preserveSymbols ? obj : `[Symbol]`;
  }

  // Массивы
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item, { ...options, depth: depth + 1, cache }));
  }

  // Объекты
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = deepClone(value, { ...options, depth: depth + 1, cache });
  }

  return result;
}

/**
 * Безопасное получение значения из объекта по пути
 * @param {Object} obj - Объект для поиска
 * @param {string} path - Путь к значению (через точку)
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} - Найденное значение или значение по умолчанию
 */
export function safeGet(obj, path, defaultValue = undefined) {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  if (typeof path !== 'string') {
    return defaultValue;
  }

  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      if (typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Безопасная установка значения в объект по пути
 * @param {Object} obj - Объект для изменения
 * @param {string} path - Путь к значению (через точку)
 * @param {*} value - Значение для установки
 * @returns {Object} - Измененный объект
 */
export function safeSet(obj, path, value) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (typeof path !== 'string') {
    return obj;
  }

  try {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    return obj;
  } catch (error) {
    return obj;
  }
}

/**
 * Проверка на существование значения (не null и не undefined)
 * @param {*} value - Значение для проверки
 * @returns {boolean} - true если значение определено
 */
export function isDefined(value) {
  return value !== undefined && value !== null;
}

/**
 * Проверка на пустое значение
 * @param {*} value - Значение для проверки
 * @returns {boolean} - true если значение пустое
 */
export function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  if (typeof value === 'number') return isNaN(value);
  return false;
}

/**
 * Проверка на функцию
 * @param {*} fn - Проверяемое значение
 * @returns {boolean} - true если это функция
 */
export function isFunction(fn) {
  return fn && typeof fn === 'function';
}

/**
 * Проверка на объект
 * @param {*} obj - Проверяемое значение
 * @returns {boolean} - true если это объект
 */
export function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Проверка на строку
 * @param {*} str - Проверяемое значение
 * @returns {boolean} - true если это строка
 */
export function isString(str) {
  return typeof str === 'string';
}

/**
 * Проверка на число
 * @param {*} num - Проверяемое значение
 * @returns {boolean} - true если это число
 */
export function isNumber(num) {
  return typeof num === 'number' && !isNaN(num);
}

/**
 * Проверка на массив
 * @param {*} arr - Проверяемое значение
 * @returns {boolean} - true если это массив
 */
export function isArray(arr) {
  return Array.isArray(arr);
}

/**
 * Проверка на булево значение
 * @param {*} bool - Проверяемое значение
 * @returns {boolean} - true если это булево значение
 */
export function isBoolean(bool) {
  return typeof bool === 'boolean';
}

/**
 * Проверка на символ
 * @param {*} sym - Проверяемое значение
 * @returns {boolean} - true если это символ
 */
export function isSymbol(sym) {
  return typeof sym === 'symbol';
}

/**
 * Проверка на промис
 * @param {*} promise - Проверяемое значение
 * @returns {boolean} - true если это промис
 */
export function isPromise(promise) {
  return promise && typeof promise === 'object' && typeof promise.then === 'function';
}

/**
 * Проверка на дату
 * @param {*} date - Проверяемое значение
 * @returns {boolean} - true если это дата
 */
export function isDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Проверка на регулярное выражение
 * @param {*} regex - Проверяемое значение
 * @returns {boolean} - true если это регулярное выражение
 */
export function isRegExp(regex) {
  return regex instanceof RegExp;
}

/**
 * Проверка на ошибку
 * @param {*} error - Проверяемое значение
 * @returns {boolean} - true если это ошибка
 */
export function isError(error) {
  return error instanceof Error;
}

/**
 * Проверка на Map
 * @param {*} map - Проверяемое значение
 * @returns {boolean} - true если это Map
 */
export function isMap(map) {
  return map instanceof Map;
}

/**
 * Проверка на Set
 * @param {*} set - Проверяемое значение
 * @returns {boolean} - true если это Set
 */
export function isSet(set) {
  return set instanceof Set;
}

/**
 * Проверка на WeakMap
 * @param {*} weakMap - Проверяемое значение
 * @returns {boolean} - true если это WeakMap
 */
export function isWeakMap(weakMap) {
  return weakMap instanceof WeakMap;
}

/**
 * Проверка на WeakSet
 * @param {*} weakSet - Проверяемое значение
 * @returns {boolean} - true если это WeakSet
 */
export function isWeakSet(weakSet) {
  return weakSet instanceof WeakSet;
}

/**
 * Проверка на ArrayBuffer
 * @param {*} buffer - Проверяемое значение
 * @returns {boolean} - true если это ArrayBuffer
 */
export function isArrayBuffer(buffer) {
  return buffer instanceof ArrayBuffer;
}

/**
 * Получение DOM элемента с проверкой
 * @param {string} id - ID элемента
 * @param {Object} options - Опции
 * @returns {Element|null} - DOM элемент или null
 */
export function getDom(id, options = {}) {
  const {
    required = false,
    timeout = 0,
    retry = false,
    retryDelay = 100,
    maxRetries = 10,
    log = true,
  } = options;

  if (!id || typeof id !== 'string') {
    if (log) console.warn('⚠️ Неверный ID элемента:', id);
    return null;
  }

  const element = document.getElementById(id);

  if (!element) {
    if (required) {
      if (log) console.warn(`⚠️ Элемент не найден: ${id}`);

      if (retry) {
        let attempts = 0;
        const checkElement = () => {
          const el = document.getElementById(id);
          if (el) {
            if (log) console.log(`✅ Элемент найден: ${id}`);
            return el;
          }
          attempts++;
          if (attempts < maxRetries) {
            setTimeout(checkElement, retryDelay);
          } else {
            if (log) console.error(`❌ Элемент не найден после ${maxRetries} попыток: ${id}`);
          }
        };
        checkElement();
        return null;
      }
    }
    return null;
  }

  return element;
}

/**
 * Безопасный вызов функции с обработкой ошибок
 * @param {Function} fn - Функция для вызова
 * @param {Array} args - Аргументы функции
 * @param {*} defaultValue - Значение по умолчанию при ошибке
 * @returns {*} - Результат функции или значение по умолчанию
 */
export function safeCall(fn, args = [], defaultValue = null) {
  if (!isFunction(fn)) {
    return defaultValue;
  }

  try {
    const result = fn(...args);
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.error('❌ Ошибка вызова функции:', error);
    return defaultValue;
  }
}

/**
 * Безопасная сериализация объектов для логов
 * @param {*} obj - Объект для сериализации
 * @param {Object} options - Опции сериализации
 * @returns {string} - Сериализованная строка
 */
export function safeStringify(obj, options = {}) {
  const {
    maxLength = 80,
    indent = 0,
    showType = true,
    truncate = true,
    circular = '[Circular]',
    undefined = '[Undefined]',
    function: functionLabel = '[Function]',
    symbol = '[Symbol]',
  } = options;

  if (obj === undefined) return undefined;
  if (obj === null) return 'null';

  // Проверка типа
  if (showType) {
    const type = getType(obj);
    if (type === 'function') return functionLabel;
    if (type === 'symbol') return symbol;
    if (type === 'undefined') return undefined;
  }

  try {
    let str = formatJson(obj, { indent, maxLength });

    // Обрезаем длинную строку
    if (truncate && str.length > maxLength) {
      str = str.substring(0, maxLength) + '...';
    }

    return str;
  } catch (error) {
    return `[Serialization Error: ${error.message}]`;
  }
}

/**
 * Получение типа значения
 * @param {*} value - Значение для определения типа
 * @returns {string} - Тип значения
 */
export function getType(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';

  const type = typeof value;
  if (type !== 'object') return type;

  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regexp';
  if (value instanceof Error) return 'error';
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  if (value instanceof WeakMap) return 'weakmap';
  if (value instanceof WeakSet) return 'weakset';
  if (value instanceof ArrayBuffer) return 'arraybuffer';
  if (value instanceof DataView) return 'dataview';
  if (value instanceof Blob) return 'blob';
  if (value instanceof File) return 'file';
  if (value instanceof FormData) return 'formdata';
  if (value instanceof URLSearchParams) return 'urlsearchparams';
  if (value instanceof Headers) return 'headers';
  if (value instanceof Request) return 'request';
  if (value instanceof Response) return 'response';
  if (value instanceof Promise) return 'promise';
  if (value instanceof Int8Array) return 'int8array';
  if (value instanceof Uint8Array) return 'uint8array';
  if (value instanceof Uint8ClampedArray) return 'uint8clampedarray';
  if (value instanceof Int16Array) return 'int16array';
  if (value instanceof Uint16Array) return 'uint16array';
  if (value instanceof Int32Array) return 'int32array';
  if (value instanceof Uint32Array) return 'uint32array';
  if (value instanceof Float32Array) return 'float32array';
  if (value instanceof Float64Array) return 'float64array';
  if (value instanceof BigInt64Array) return 'bigint64array';
  if (value instanceof BigUint64Array) return 'biguint64array';

  return 'object';
}

/**
 * Валидация email
 * @param {string} email - Email для проверки
 * @returns {boolean} - true если email валидный
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].email.test(email);
}

/**
 * Валидация URL
 * @param {string} url - URL для проверки
 * @returns {boolean} - true если URL валидный
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].url.test(url);
}

/**
 * Валидация UUID
 * @param {string} uuid - UUID для проверки
 * @returns {boolean} - true если UUID валидный
 */
export function isValidUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].uuid.test(uuid);
}

/**
 * Валидация HEX цвета
 * @param {string} color - HEX цвет для проверки
 * @returns {boolean} - true если цвет валидный
 */
export function isValidHexColor(color) {
  if (!color || typeof color !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].hexColor.test(color);
}

/**
 * Валидация RGB цвета
 * @param {string} color - RGB цвет для проверки
 * @returns {boolean} - true если цвет валидный
 */
export function isValidRgbColor(color) {
  if (!color || typeof color !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].rgbColor.test(color);
}

/**
 * Валидация даты в формате ISO
 * @param {string} date - Дата для проверки
 * @returns {boolean} - true если дата валидная
 */
export function isValidDateISO(date) {
  if (!date || typeof date !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].dateISO.test(date);
}

/**
 * Валидация времени
 * @param {string} time - Время для проверки
 * @returns {boolean} - true если время валидное
 */
export function isValidTime(time) {
  if (!time || typeof time !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].time.test(time);
}

/**
 * Валидация IP адреса (v4)
 * @param {string} ip - IP адрес для проверки
 * @returns {boolean} - true если IP валидный
 */
export function isValidIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].ipv4.test(ip);
}

/**
 * Валидация IP адреса (v6)
 * @param {string} ip - IP адрес для проверки
 * @returns {boolean} - true если IP валидный
 */
export function isValidIpv6(ip) {
  if (!ip || typeof ip !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].ipv6.test(ip);
}

/**
 * Валидация телефонного номера
 * @param {string} phone - Телефон для проверки
 * @returns {boolean} - true если телефон валидный
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].phone.test(phone);
}

/**
 * Валидация почтового индекса
 * @param {string} code - Почтовый индекс для проверки
 * @returns {boolean} - true если индекс валидный
 */
export function isValidPostalCode(code) {
  if (!code || typeof code !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].postalCode.test(code);
}

/**
 * Валидация credit card
 * @param {string} card - Номер карты для проверки
 * @returns {boolean} - true если номер карты валидный
 */
export function isValidCreditCard(card) {
  if (!card || typeof card !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].creditCard.test(card.replace(/\s/g, ''));
}

/**
 * Валидация JSON
 * @param {string} json - JSON для проверки
 * @returns {boolean} - true если JSON валидный
 */
export function isValidJson(json) {
  if (!json || typeof json !== 'string') return false;
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Валидация Base64
 * @param {string} base64 - Base64 строка для проверки
 * @returns {boolean} - true если Base64 валидный
 */
export function isValidBase64(base64) {
  if (!base64 || typeof base64 !== 'string') return false;
  return UTIL_STATE[PRIVATE.VALIDATION_RULES].base64.test(base64);
}

/**
 * Генерация UUID v4
 * @returns {string} - Сгенерированный UUID
 */
export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Генерация случайного ID
 * @param {string} prefix - Префикс для ID
 * @param {number} length - Длина ID
 * @returns {string} - Сгенерированный ID
 */
export function generateId(prefix = 'id', length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${result}`;
}

/**
 * Генерация случайной строки
 * @param {number} length - Длина строки
 * @param {string} chars - Символы для генерации
 * @returns {string} - Сгенерированная строка
 */
export function generateRandomString(length = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Кэширование результатов функции
 * @param {Function} fn - Функция для кэширования
 * @param {Object} options - Опции кэширования
 * @returns {Function} - Функция с кэшированием
 */
export function memoize(fn, options = {}) {
  const {
    ttl = UTIL_CONFIG.cacheTTL,
    maxSize = UTIL_CONFIG.cacheMaxSize,
    keyGenerator = null,
    enabled = true,
  } = options;

  const cache = new Map();
  const hits = { value: 0 };
  const misses = { value: 0 };

  const defaultKeyGenerator = (...args) => {
    try {
      return JSON.stringify(args);
    } catch {
      return args.map(String).join('|');
    }
  };

  const generateKey = keyGenerator || defaultKeyGenerator;

  const memoized = function(...args) {
    if (!enabled) {
      return fn(...args);
    }

    const key = generateKey(...args);

    if (cache.has(key)) {
      const entry = cache.get(key);
      if (Date.now() - entry.timestamp < ttl) {
        hits.value++;
        return entry.value;
      }
      cache.delete(key);
    }

    misses.value++;
    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, {
      value: result,
      timestamp: Date.now(),
    });

    return result;
  };

  // Добавляем методы управления кэшем
  memoized.clear = () => {
    cache.clear();
    hits.value = 0;
    misses.value = 0;
  };

  memoized.getStats = () => ({
    size: cache.size,
    maxSize,
    hits: hits.value,
    misses: misses.value,
    hitRate: hits.value + misses.value > 0
        ? (hits.value / (hits.value + misses.value) * 100).toFixed(1) + '%'
        : '0%',
  });

  memoized.has = (key) => cache.has(key);

  memoized.delete = (key) => cache.delete(key);

  return memoized;
}

/**
 * Дебаунс функции (задержка выполнения)
 * @param {Function} fn - Функция для дебаунса
 * @param {number} delay - Задержка в мс
 * @returns {Function} - Функция с дебаунсом
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  const debounced = function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };

  // Отмена дебаунса
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  // Немедленное выполнение
  debounced.flush = () => {
    clearTimeout(timer);
    if (timer !== null) {
      fn(...arguments);
      timer = null;
    }
  };

  return debounced;
}

/**
 * Троттлинг функции (ограничение частоты выполнения)
 * @param {Function} fn - Функция для троттлинга
 * @param {number} limit - Лимит в мс
 * @returns {Function} - Функция с троттлингом
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  let lastResult = null;

  const throttled = function(...args) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn(...args);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };

  return throttled;
}

/**
 * Создание отложенного промиса
 * @param {number} ms - Время задержки в мс
 * @returns {Promise} - Промис с задержкой
 */
export function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Повторная попытка выполнения функции
 * @param {Function} fn - Функция для выполнения
 * @param {Object} options - Опции повторных попыток
 * @returns {Promise} - Результат выполнения
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay: delayMs = 1000,
    backoff = 2,
    onRetry = null,
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(attempt, error);
        }
        await delay(attempt * backoff);
      }
    }
  }

  throw lastError;
}

/**
 * Измерение времени выполнения функции
 * @param {Function} fn - Функция для измерения
 * @param {string} name - Имя измерения
 * @returns {Promise} - Результат выполнения с временем
 */
export async function measurePerformance(fn, name = 'measure') {
  const start = performance.now();

  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    UTIL_STATE[PRIVATE.PERFORMANCE_MEASURES].push({
      name,
      duration,
      timestamp: Date.now(),
      success: true,
    });

    if (UTIL_CONFIG.performanceMonitoring) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const end = performance.now();
    const duration = end - start;

    UTIL_STATE[PRIVATE.PERFORMANCE_MEASURES].push({
      name,
      duration,
      timestamp: Date.now(),
      success: false,
      error: error.message,
    });

    throw error;
  }
}

/**
 * Получение статистики производительности
 * @param {Object} options - Опции
 * @returns {Object} - Статистика производительности
 */
export function getPerformanceStats(options = {}) {
  const {
    limit = 100,
    since = 0,
  } = options;

  const measures = UTIL_STATE[PRIVATE.PERFORMANCE_MEASURES]
      .filter(m => m.timestamp >= since)
      .slice(-limit);

  if (measures.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      successRate: 0,
      measures: [],
    };
  }

  const durations = measures.map(m => m.duration);
  const successful = measures.filter(m => m.success);

  return {
    total: measures.length,
    average: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    successRate: (successful.length / measures.length) * 100,
    measures: measures.slice(-10),
  };
}

/**
 * Очистка кэша утилит
 * @param {string} type - Тип кэша для очистки
 * @returns {boolean} - true если очистка выполнена
 */
export function clearUtilCache(type = 'all') {
  const state = UTIL_STATE;

  switch (type) {
    case 'all':
      state[PRIVATE.CACHE].clear();
      state[PRIVATE.MEMORY_CACHE].clear();
      state[PRIVATE.CACHE_HITS] = 0;
      state[PRIVATE.CACHE_MISSES] = 0;
      break;
    case 'cache':
      state[PRIVATE.CACHE].clear();
      state[PRIVATE.CACHE_HITS] = 0;
      state[PRIVATE.CACHE_MISSES] = 0;
      break;
    case 'memory':
      state[PRIVATE.MEMORY_CACHE].clear();
      break;
    case 'performance':
      state[PRIVATE.PERFORMANCE_MEASURES] = [];
      state[PRIVATE.PERFORMANCE_MARKS].clear();
      break;
    default:
      return false;
  }

  return true;
}

/**
 * Получение информации о памяти
 * @returns {Object} - Информация о памяти
 */
export function getMemoryInfo() {
  const state = UTIL_STATE;

  let total = 0;
  let count = 0;

  for (const [key, value] of state[PRIVATE.MEMORY_CACHE]) {
    try {
      const size = JSON.stringify(value).length;
      total += size;
      count++;
    } catch {
      // Игнорируем ошибки
    }
  }

  return {
    used: total,
    limit: state[PRIVATE.MEMORY_LIMIT],
    count,
    percentage: state[PRIVATE.MEMORY_LIMIT] > 0
        ? (total / state[PRIVATE.MEMORY_LIMIT] * 100).toFixed(1)
        : 0,
    entries: Array.from(state[PRIVATE.MEMORY_CACHE].keys()).slice(0, 10),
  };
}

// ============================================================
// 5. ЭКСПОРТЫ
// ============================================================

export default {
  // Основные утилиты
  escapeHtml,
  unescapeHtml,
  sanitizeHtml,
  formatJson,
  formatTime,
  formatFileSize,
  formatNumber,

  // Работа с объектами
  deepClone,
  safeGet,
  safeSet,

  // Проверки
  isDefined,
  isEmpty,
  isFunction,
  isObject,
  isString,
  isNumber,
  isArray,
  isBoolean,
  isSymbol,
  isPromise,
  isDate,
  isRegExp,
  isError,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isArrayBuffer,

  // DOM
  getDom,

  // Безопасные вызовы
  safeCall,
  safeStringify,

  // Типы
  getType,

  // Валидация
  isValidEmail,
  isValidUrl,
  isValidUuid,
  isValidHexColor,
  isValidRgbColor,
  isValidDateISO,
  isValidTime,
  isValidIpv4,
  isValidIpv6,
  isValidPhone,
  isValidPostalCode,
  isValidCreditCard,
  isValidJson,
  isValidBase64,

  // Генерация
  generateUuid,
  generateId,
  generateRandomString,

  // Оптимизация
  memoize,
  debounce,
  throttle,
  delay,
  retry,
  measurePerformance,

  // Статистика
  getPerformanceStats,
  clearUtilCache,
  getMemoryInfo,

  // Конфигурация
  UTIL_CONFIG,
};

// ============================================================
// 6. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__utils = {
    escapeHtml,
    unescapeHtml,
    sanitizeHtml,
    formatJson,
    formatTime,
    formatFileSize,
    formatNumber,
    deepClone,
    safeGet,
    safeSet,
    isDefined,
    isEmpty,
    isFunction,
    isObject,
    isString,
    isNumber,
    isArray,
    isBoolean,
    isSymbol,
    getDom,
    safeCall,
    safeStringify,
    getType,
    isValidEmail,
    isValidUrl,
    isValidUuid,
    generateUuid,
    generateId,
    generateRandomString,
    memoize,
    debounce,
    throttle,
    delay,
    retry,
    measurePerformance,
    getPerformanceStats,
    clearUtilCache,
    getMemoryInfo,
    UTIL_CONFIG,
  };

  console.log('📦 Утилиты загружены (utils.js v4.0.8)');
  console.log('🔑 Доступно: window.__utils');
}

// ============================================================
// 7. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const validationCount = Object.keys(UTIL_STATE[PRIVATE.VALIDATION_RULES]).length;
  const typeCheckersCount = Object.keys(UTIL_STATE[PRIVATE.TYPE_CHECKERS]).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 UTILITIES (100% СИМВОЛЫ) v4.0.8                             ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    📋 Правил валидации: ${validationCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔍 Type checkers: ${typeCheckersCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + validationCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ УТИЛИТЫ:                                                     ║');
  console.log('║    ✅ escapeHtml()      — экранирование HTML                               ║');
  console.log('║    ✅ formatJson()      — форматирование JSON                              ║');
  console.log('║    ✅ formatTime()      — форматирование времени                           ║');
  console.log('║    ✅ deepClone()       — глубокое копирование                             ║');
  console.log('║    ✅ safeGet/Set()     — безопасный доступ к объектам                     ║');
  console.log('║    ✅ isValid*()        — валидация данных                                 ║');
  console.log('║    ✅ generateUuid()    — генерация UUID                                   ║');
  console.log('║    ✅ debounce/throttle — оптимизация вызовов                              ║');
  console.log('║    ✅ memoize()         — кэширование результатов                          ║');
  console.log('║    ✅ safeCall()        — безопасный вызов функций                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 8. КОНЕЦ ФАЙЛА
// ============================================================
