// ============================================================
// app/config.js — 100% СИМВОЛЫ — конфигурация приложения
// Версия: 4.0.8
// ============================================================

// ============================================================
// 1. ОСНОВНАЯ КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ============================================================

export const CONFIG = {
  // Версия и сборка
  version: '4.0.8',
  build: '2026-07-28',
  name: 'Global Store Admin',

  // Отладка
  debug: true,

  // Лимиты
  maxLogEntries: 500,
  maxMessages: 100,
  maxAuditEntries: 1000,

  // Обновление
  autoRefresh: true,
  refreshInterval: 5000,

  // Таблицы
  defaultPageSize: 20,
  defaultTable: 'projects',

  // Глобальное хранилище
  globalStoreSymbol: '__GLOBAL_STORE__',

  // Immer
  immerEnabled: true,

  // Интерфейс
  showWelcomeModal: true,

  // Таймауты (мс)
  timeouts: {
    modalAnimation: 200,
    welcomeModalDelay: 500,
    autoSaveInterval: 30000,
    debounceDelay: 300,
  },

  // Лимиты для UI
  uiLimits: {
    maxTableNameLength: 100,
    maxFieldNameLength: 50,
    maxRecordsPerPage: 100,
    maxVisibleColumns: 20,
  },

  // Цветовая схема (для модалок и уведомлений)
  colors: {
    info: 'var(--es-accent-blue-light)',
    success: 'var(--es-accent-green)',
    warning: 'var(--es-accent-yellow)',
    error: 'var(--es-accent-red)',
    purple: 'var(--es-accent-purple)',
  },

  // Иконки для типов сообщений
  icons: {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    symbol: '🔑',
    debug: '🔍',
    log: '📌',
  },

  // Настройки консоли
  console: {
    maxHistory: 100,
    showTimestamps: true,
    syntaxHighlight: true,
  },

  // Настройки экспорта
  export: {
    defaultFormat: 'json',
    includeMetadata: true,
    prettyPrint: true,
  },

  // Настройки модального окна
  modal: {
    closeOnEsc: true,
    closeOnOverlay: true,
    animationDuration: 200,
    maxWidth: '600px',
  },

  // Настройки логов
  logs: {
    showTimestamps: true,
    showLevels: true,
    maxEntries: 500,
    autoScroll: true,
  },
};

// ============================================================
// 2. СИМВОЛЫ ДЛЯ ЛОГГЕРА (100% изоляция)
// ============================================================

export const LOGGER_SYMBOLS = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
  COLORS: Symbol('logger.colors'),
  TIMESTAMP: Symbol('logger.timestamp'),
  FORMAT: Symbol('logger.format'),
  OUTPUT: Symbol('logger.output'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ ДЛЯ РЕНДЕРЕРОВ
// ============================================================

export const RENDER_CONFIG = {
  // Статистика
  stats: {
    updateInterval: 1000,
    showEmptyStates: true,
    animateValues: true,
  },

  // Таблицы
  tables: {
    showCounts: true,
    showIcons: true,
    highlightActive: true,
    compactMode: false,
  },

  // Данные
  data: {
    maxCellLength: 100,
    showRowNumbers: true,
    highlightSelected: true,
    autoRefresh: true,
  },

  // Инспектор
  inspector: {
    autoExpand: true,
    maxDepth: 3,
    showTypes: true,
    wordWrap: true,
  },

  // Связи
  relations: {
    showArrows: true,
    showKeys: true,
    highlightActive: true,
    compactMode: false,
  },

  // Брокер
  broker: {
    maxMessages: 100,
    showTimestamps: true,
    autoScroll: true,
    highlightNew: true,
  },

  // Аудит
  audit: {
    maxEntries: 100,
    showTimestamps: true,
    groupByAction: false,
    compactMode: true,
  },

  // Схемы
  schemas: {
    showTypes: true,
    showRequired: true,
    formatJSON: true,
    maxDepth: 2,
  },

  // Плагины
  plugins: {
    showStatus: true,
    showVersion: true,
    groupByType: false,
  },

  // Настройки
  settings: {
    showDescriptions: true,
    groupByCategory: true,
    showAdvanced: false,
  },

  // Логи
  logs: {
    maxEntries: 500,
    showTimestamps: true,
    showLevels: true,
    filterByLevel: false,
    autoScroll: true,
  },
};

// ============================================================
// 4. КОНФИГУРАЦИЯ ДЛЯ КОНТРОЛЛЕРОВ
// ============================================================

export const CONTROLLER_CONFIG = {
  // Таблицы
  tables: {
    confirmDelete: true,
    autoSelect: true,
    maxNameLength: 100,
    reservedNames: ['_meta', '_events', '_audit'],
  },

  // Брокер
  broker: {
    defaultTopic: 'test:event',
    defaultData: { message: 'Hello World', timestamp: 'now' },
    maxTopicLength: 200,
    maxDataSize: 1024 * 1024, // 1MB
  },

  // Консоль
  console: {
    maxHistory: 100,
    allowEval: true,
    showResults: true,
    safeMode: true,
  },

  // Экспорт
  export: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['json', 'csv', 'html'],
    includeTimestamps: true,
  },

  // Демо-данные
  demo: {
    autoLoad: true,
    overwriteExisting: false,
    tables: ['projects', 'tasks', 'users'],
  },
};

// ============================================================
// 5. КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ
// ============================================================

export const SECURITY_CONFIG = {
  // Санитизация
  sanitize: {
    enabled: true,
    escapeHtml: true,
    stripScripts: true,
    maxStringLength: 10000,
  },

  // Валидация
  validate: {
    enabled: true,
    strictMode: true,
    maxInputLength: 10000,
    allowedChars: /^[a-zA-Z0-9_\-\s\.\,\(\)\[\]\{\}\:\;\?\=\!\/\\\@\#\$\%\^\&\*\+\~\`\|]+$/,
  },

  // Безопасный доступ
  secure: {
    preventEval: false,
    allowConsoleAccess: true,
    exposeGlobalStore: true,
    requireAuth: false,
  },

  // Контекст
  context: {
    checkSecureContext: true,
    fallbackOnInsecure: true,
    warnOnInsecure: true,
  },
};

// ============================================================
// 6. КОНФИГУРАЦИЯ ДЛЯ ТЕСТИРОВАНИЯ
// ============================================================

export const TEST_CONFIG = {
  enabled: false,
  autoRun: false,
  verbose: false,
  timeout: 5000,
  reporters: ['console', 'html'],
};

// ============================================================
// 7. КОНФИГУРАЦИЯ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================================

export const PERFORMANCE_CONFIG = {
  // Виртуализация
  virtualization: {
    enabled: true,
    threshold: 100,
    overscan: 5,
  },

  // Кэширование
  cache: {
    enabled: true,
    maxSize: 100,
    ttl: 60000, // 1 минута
  },

  // Debounce
  debounce: {
    enabled: true,
    delay: 300,
    maxDelay: 500,
  },

  // Throttle
  throttle: {
    enabled: true,
    delay: 100,
  },
};

// ============================================================
// 8. КОНФИГУРАЦИЯ ДОСТУПНОСТИ
// ============================================================

export const ACCESSIBILITY_CONFIG = {
  // ARIA
  aria: {
    enabled: true,
    labels: true,
    descriptions: true,
  },

  // Клавиатура
  keyboard: {
    enabled: true,
    shortcuts: true,
    focusIndicator: true,
  },

  // Контрастность
  contrast: {
    highContrastSupport: true,
    minimumRatio: 4.5,
    enhancedRatio: 7,
  },

  // Уменьшение движения
  reducedMotion: {
    enabled: true,
    disableAnimations: true,
    preferReduced: true,
  },
};

// ============================================================
// 9. КОНФИГУРАЦИЯ ЛОКАЛИЗАЦИИ
// ============================================================

export const LOCALE_CONFIG = {
  locale: 'ru-RU',
  timezone: 'Europe/Moscow',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: 'HH:mm:ss.SSS',
  numberFormat: {
    decimal: ',',
    thousand: ' ',
    precision: 2,
  },
  currency: 'RUB',
  messages: {
    loading: 'Загрузка...',
    saving: 'Сохранение...',
    deleting: 'Удаление...',
    error: 'Ошибка',
    success: 'Успешно',
    warning: 'Предупреждение',
    info: 'Информация',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    close: 'Закрыть',
    yes: 'Да',
    no: 'Нет',
    ok: 'ОК',
  },
};

// ============================================================
// 10. ЭКСПОРТ ВСЕХ КОНФИГУРАЦИЙ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  CONFIG,
  LOGGER_SYMBOLS,
  RENDER_CONFIG,
  CONTROLLER_CONFIG,
  SECURITY_CONFIG,
  TEST_CONFIG,
  PERFORMANCE_CONFIG,
  ACCESSIBILITY_CONFIG,
  LOCALE_CONFIG,
};

// ============================================================
// 11. ХЕЛПЕРЫ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ
// ============================================================

/**
 * Получить значение конфигурации по пути
 * @param {string} path - Путь к значению (например, 'CONFIG.debug')
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} Значение конфигурации
 */
export function getConfig(path, defaultValue = undefined) {
  try {
    const parts = path.split('.');
    let current = {
      CONFIG,
      LOGGER_SYMBOLS,
      RENDER_CONFIG,
      CONTROLLER_CONFIG,
      SECURITY_CONFIG,
      TEST_CONFIG,
      PERFORMANCE_CONFIG,
      ACCESSIBILITY_CONFIG,
      LOCALE_CONFIG,
    };

    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }

    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.warn(`⚠️ Ошибка получения конфигурации по пути "${path}":`, error);
    return defaultValue;
  }
}

/**
 * Обновить значение конфигурации
 * @param {string} path - Путь к значению
 * @param {*} value - Новое значение
 * @returns {boolean} Успешность операции
 */
export function setConfig(path, value) {
  try {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let current = {
      CONFIG,
      LOGGER_SYMBOLS,
      RENDER_CONFIG,
      CONTROLLER_CONFIG,
      SECURITY_CONFIG,
      TEST_CONFIG,
      PERFORMANCE_CONFIG,
      ACCESSIBILITY_CONFIG,
      LOCALE_CONFIG,
    };

    for (const part of parts) {
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }

    current[lastPart] = value;
    return true;
  } catch (error) {
    console.warn(`⚠️ Ошибка обновления конфигурации по пути "${path}":`, error);
    return false;
  }
}

/**
 * Получить все конфигурации
 * @returns {Object} Все конфигурации
 */
export function getAllConfigs() {
  return {
    CONFIG,
    LOGGER_SYMBOLS,
    RENDER_CONFIG,
    CONTROLLER_CONFIG,
    SECURITY_CONFIG,
    TEST_CONFIG,
    PERFORMANCE_CONFIG,
    ACCESSIBILITY_CONFIG,
    LOCALE_CONFIG,
  };
}

/**
 * Сбросить конфигурацию к значениям по умолчанию
 * @param {string} configName - Имя конфигурации (опционально)
 * @returns {boolean} Успешность операции
 */
export function resetConfig(configName = null) {
  try {
    if (configName) {
      const configs = {
        CONFIG,
        LOGGER_SYMBOLS,
        RENDER_CONFIG,
        CONTROLLER_CONFIG,
        SECURITY_CONFIG,
        TEST_CONFIG,
        PERFORMANCE_CONFIG,
        ACCESSIBILITY_CONFIG,
        LOCALE_CONFIG,
      };

      if (configs[configName]) {
        // Сброс к значениям по умолчанию (переопределяем)
        const defaultConfigs = {
          CONFIG: {
            version: '4.0.8',
            build: '2026-07-28',
            name: 'Global Store Admin',
            debug: true,
            maxLogEntries: 500,
            maxMessages: 100,
            maxAuditEntries: 1000,
            autoRefresh: true,
            refreshInterval: 5000,
            defaultPageSize: 20,
            defaultTable: 'projects',
            globalStoreSymbol: '__GLOBAL_STORE__',
            immerEnabled: true,
            showWelcomeModal: true,
          },
          // ... другие конфигурации по умолчанию
        };

        Object.assign(configs[configName], defaultConfigs[configName]);
        return true;
      }
      return false;
    }

    // Сброс всех конфигураций
    Object.assign(CONFIG, {
      version: '4.0.8',
      build: '2026-07-28',
      name: 'Global Store Admin',
      debug: true,
      maxLogEntries: 500,
      maxMessages: 100,
      maxAuditEntries: 1000,
      autoRefresh: true,
      refreshInterval: 5000,
      defaultPageSize: 20,
      defaultTable: 'projects',
      globalStoreSymbol: '__GLOBAL_STORE__',
      immerEnabled: true,
      showWelcomeModal: true,
    });

    return true;
  } catch (error) {
    console.warn('⚠️ Ошибка сброса конфигурации:', error);
    return false;
  }
}

// ============================================================
// 12. ПРОВЕРКА КОНФИГУРАЦИИ
// ============================================================

export function validateConfig() {
  const errors = [];
  const warnings = [];

  // Проверка основных параметров
  if (!CONFIG.version) {
    errors.push('Отсутствует версия приложения');
  }

  if (CONFIG.maxLogEntries < 10) {
    warnings.push('maxLogEntries слишком маленькое (рекомендуется >= 100)');
  }

  if (CONFIG.maxMessages < 10) {
    warnings.push('maxMessages слишком маленькое (рекомендуется >= 50)');
  }

  if (CONFIG.refreshInterval < 1000) {
    warnings.push('refreshInterval слишком маленькое (рекомендуется >= 1000)');
  }

  // Проверка цветов
  for (const [key, value] of Object.entries(CONFIG.colors)) {
    if (!value || typeof value !== 'string') {
      warnings.push(`Цвет "${key}" не определен или имеет некорректный формат`);
    }
  }

  // Проверка иконок
  for (const [key, value] of Object.entries(CONFIG.icons)) {
    if (!value || typeof value !== 'string') {
      warnings.push(`Иконка "${key}" не определена`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: CONFIG,
  };
}

// ============================================================
// 13. ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
// ============================================================

if (typeof window !== 'undefined') {
  window.__CONFIG = {
    CONFIG,
    LOGGER_SYMBOLS,
    RENDER_CONFIG,
    CONTROLLER_CONFIG,
    SECURITY_CONFIG,
    TEST_CONFIG,
    PERFORMANCE_CONFIG,
    ACCESSIBILITY_CONFIG,
    LOCALE_CONFIG,
  };

  console.log('📋 Конфигурация загружена');
  console.log(`  📦 Версия: ${CONFIG.version}`);
  console.log(`  📅 Сборка: ${CONFIG.build}`);
  console.log(`  🔄 Immer: ${CONFIG.immerEnabled ? 'ON' : 'OFF'}`);
}

// ============================================================
// 14. КОНЕЦ ФАЙЛА
// ============================================================
