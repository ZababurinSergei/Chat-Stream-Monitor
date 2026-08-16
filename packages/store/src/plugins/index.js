// ============================================================
// plugins/index.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Экспорт всех плагинов для Global Store с Immer
// Версия: 4.0.6
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  VERSION: Symbol('plugins.version'),
  BUILD: Symbol('plugins.build'),
  NAME: Symbol('plugins.name'),
  CONFIG: Symbol('plugins.config'),
  STATE: Symbol('plugins.state'),
  INITIALIZED: Symbol('plugins.initialized'),
  DESTROYED: Symbol('plugins.destroyed'),
  PLUGINS: Symbol('plugins.list'),
  PLUGIN_MAP: Symbol('plugins.map'),
  PLUGIN_STATE: Symbol('plugins.state'),
  PLUGIN_ORDER: Symbol('plugins.order'),
  PLUGIN_HOOKS: Symbol('plugins.hooks'),
  INIT: Symbol('plugins.init'),
  DESTROY: Symbol('plugins.destroy'),
  REGISTER: Symbol('plugins.register'),
  UNREGISTER: Symbol('plugins.unregister'),
  GET: Symbol('plugins.get'),
  LIST: Symbol('plugins.list'),
  HAS: Symbol('plugins.has'),
  CLEAR: Symbol('plugins.clear'),
  GET_STATE: Symbol('plugins.getState'),
  EXPORT_SYMBOLS: Symbol('plugins.exportSymbols'),
  LOGGER: Symbol('plugins.logger'),
  LOG: Symbol('plugins.log'),
  DEBUG: Symbol('plugins.debug'),
  ERROR: Symbol('plugins.error'),
  WARN: Symbol('plugins.warn'),
  SUCCESS: Symbol('plugins.success'),
  IMMER_ENABLED: Symbol('plugins.immerEnabled'),
  WITH_IMMER: Symbol('plugins.withImmer'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('plugins.instance'),
  STATE: Symbol.for('plugins.state'),
  CONFIG: Symbol.for('plugins.config'),
  INIT: Symbol.for('plugins.init'),
  DESTROY: Symbol.for('plugins.destroy'),
  REGISTER: Symbol.for('plugins.register'),
  UNREGISTER: Symbol.for('plugins.unregister'),
  GET: Symbol.for('plugins.get'),
  LIST: Symbol.for('plugins.list'),
  HAS: Symbol.for('plugins.has'),
  CLEAR: Symbol.for('plugins.clear'),
  GET_STATE: Symbol.for('plugins.getState'),
  HEALTH_CHECK: Symbol.for('plugins.healthCheck'),
  WITH_IMMER: Symbol.for('plugins.withImmer'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.6',
  build: '2026-07-28',
  name: 'Global Store Plugins',
  debug: true,
  maxPlugins: 100,
  strictMode: true,
  allowHotReload: false,
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
  COLORS: Symbol('logger.colors'),
};

function createLogger(debug = true, instanceId = 'Plugins') {
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

  const logMethod = function(level, message, data = null) {
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
      console.log(
        `${colors.bold}${colors.magenta}  🔌 ${title}${colors.reset}`
      );
      console.log(`${colors.cyan}${separator}${colors.reset}`);
    },

    separator: (color = '#636e72') => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
    },

    getHistory: function() {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory: function() {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug: function(enabled) {
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
// 5. ИМПОРТЫ ПЛАГИНОВ (100% символы)
// ============================================================

import { PersistencePlugin } from './PersistencePlugin.js';
import { ValidationPlugin } from './ValidationPlugin.js';
import { IndexPlugin } from './IndexPlugin.js';
import { PaginationPlugin } from './PaginationPlugin.js';
import { AuditPlugin } from './AuditPlugin.js';
import { BrokerPlugin } from './BrokerPlugin.js';
import { QuotaPlugin } from './QuotaPlugin.js';
import { CachePlugin } from './CachePlugin.js';
import { EncryptionPlugin } from './EncryptionPlugin.js';

// ============================================================
// 6. ЭКСПОРТ ПЛАГИНОВ (100% символы)
// ============================================================

export {
  PersistencePlugin,
  ValidationPlugin,
  IndexPlugin,
  PaginationPlugin,
  AuditPlugin,
  BrokerPlugin,
  QuotaPlugin,
  CachePlugin,
  EncryptionPlugin,
};

// ============================================================
// 7. ПАКЕТЫ ПЛАГИНОВ (100% символы)
// ============================================================

export const DEFAULT_PLUGINS = [
  PersistencePlugin,
  ValidationPlugin,
  IndexPlugin,
  PaginationPlugin,
  AuditPlugin,
  BrokerPlugin,
  QuotaPlugin,
  CachePlugin,
  EncryptionPlugin,
];

export const SECURITY_PLUGINS = [
  EncryptionPlugin,
  AuditPlugin,
  QuotaPlugin,
  ValidationPlugin,
];

export const PERFORMANCE_PLUGINS = [
  IndexPlugin,
  PaginationPlugin,
  CachePlugin,
];

export const CORE_PLUGINS = [
  PersistencePlugin,
  BrokerPlugin,
];

// ============================================================
// 8. МЕНЕДЖЕР ПЛАГИНОВ (100% символы) С IMMER
// ============================================================

export class PluginManager {
  constructor() {
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
      },
      [PRIVATE.PLUGINS]: new Map(),
      [PRIVATE.PLUGIN_ORDER]: [],
      [PRIVATE.PLUGIN_STATE]: new Map(),
      [PRIVATE.PLUGIN_HOOKS]: new Map(),
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.LOGGER]: null,
      [PRIVATE.IMMER_ENABLED]: CONFIG.immerEnabled,
    };

    _private.set(this, privateData);
    this._private = _private;
    this._logger = createLogger(CONFIG.debug, CONFIG.name);

    this[PRIVATE.INIT]();
  }

  // ============================================================
  // 9. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT]() {
    const p = this._private.get(this);
    const logger = this._logger;

    if (p[PRIVATE.INITIALIZED]) {
      logger.warn('⚠️ Plugin Manager уже инициализирован');
      return;
    }

    logger.header('ИНИЦИАЛИЗАЦИЯ PLUGIN MANAGER (100% СИМВОЛЫ + IMMER)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`🔄 Immer: ${CONFIG.immerEnabled ? '✅' : '❌'}`);
    logger.separator();

    p[PRIVATE.INITIALIZED] = true;
    p[PRIVATE.STATE].initialized = true;
    p[PRIVATE.STATE].ready = true;

    this[PRIVATE.EXPORT_SYMBOLS]();

    logger.success('✅ Plugin Manager инициализирован с Immer');
    logger.header('ГОТОВ');
  }

  // ============================================================
  // 10. РЕГИСТРАЦИЯ ПЛАГИНА
  // ============================================================

  [PRIVATE.REGISTER](plugin) {
    const p = this._private.get(this);
    const logger = this._logger;

    if (p[PRIVATE.DESTROYED]) {
      logger.error('❌ Plugin Manager уничтожен');
      return false;
    }

    if (!plugin || !plugin.name) {
      logger.error('❌ Некорректный плагин');
      return false;
    }

    if (p[PRIVATE.PLUGINS].has(plugin.name)) {
      logger.warn(`⚠️ Плагин "${plugin.name}" уже зарегистрирован`);
      return false;
    }

    p[PRIVATE.PLUGINS].set(plugin.name, plugin);
    p[PRIVATE.PLUGIN_ORDER].push(plugin.name);
    p[PRIVATE.PLUGIN_STATE].set(plugin.name, {
      registered: Date.now(),
      active: true,
      error: null,
      immerEnabled: CONFIG.immerEnabled,
    });

    logger.success(`🔌 Плагин зарегистрирован: ${plugin.name}`);
    return true;
  }

  // ============================================================
  // 11. ПОЛУЧЕНИЕ ПЛАГИНА
  // ============================================================

  [PRIVATE.GET](name) {
    const p = this._private.get(this);
    return p[PRIVATE.PLUGINS].get(name) || null;
  }

  [PRIVATE.LIST]() {
    const p = this._private.get(this);
    return [...p[PRIVATE.PLUGIN_ORDER]];
  }

  [PRIVATE.HAS](name) {
    const p = this._private.get(this);
    return p[PRIVATE.PLUGINS].has(name);
  }

  // ============================================================
  // 12. УДАЛЕНИЕ ПЛАГИНА
  // ============================================================

  [PRIVATE.UNREGISTER](name) {
    const p = this._private.get(this);
    const logger = this._logger;

    if (!p[PRIVATE.PLUGINS].has(name)) {
      logger.warn(`⚠️ Плагин "${name}" не найден`);
      return false;
    }

    p[PRIVATE.PLUGINS].delete(name);
    const index = p[PRIVATE.PLUGIN_ORDER].indexOf(name);
    if (index !== -1) {
      p[PRIVATE.PLUGIN_ORDER].splice(index, 1);
    }
    p[PRIVATE.PLUGIN_STATE].delete(name);

    logger.success(`🗑 Плагин удален: ${name}`);
    return true;
  }

  // ============================================================
  // 13. ОЧИСТКА
  // ============================================================

  [PRIVATE.CLEAR]() {
    const p = this._private.get(this);
    const logger = this._logger;

    p[PRIVATE.PLUGINS].clear();
    p[PRIVATE.PLUGIN_ORDER] = [];
    p[PRIVATE.PLUGIN_STATE].clear();

    logger.success('🧹 Все плагины удалены');
    return true;
  }

  // ============================================================
  // 14. СОСТОЯНИЕ
  // ============================================================

  [PRIVATE.GET_STATE]() {
    const p = this._private.get(this);
    return {
      initialized: p[PRIVATE.STATE].initialized,
      destroyed: p[PRIVATE.STATE].destroyed,
      ready: p[PRIVATE.STATE].ready,
      plugins: [...p[PRIVATE.PLUGINS].keys()],
      order: [...p[PRIVATE.PLUGIN_ORDER]],
      count: p[PRIVATE.PLUGINS].size,
      version: CONFIG.version,
      immerEnabled: CONFIG.immerEnabled,
    };
  }

  // ============================================================
  // 15. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PRIVATE.HEALTH_CHECK]() {
    const p = this._private.get(this);
    const issues = [];
    let healthy = true;

    // Проверка состояния
    if (p[PRIVATE.DESTROYED]) {
      healthy = false;
      issues.push('Plugin Manager уничтожен');
    }

    if (!p[PRIVATE.INITIALIZED]) {
      healthy = false;
      issues.push('Plugin Manager не инициализирован');
    }

    // Проверка плагинов
    for (const [name, plugin] of p[PRIVATE.PLUGINS]) {
      if (!plugin.name) {
        healthy = false;
        issues.push(`Плагин "${name}" не имеет имени`);
      }
      if (plugin.version && typeof plugin.version !== 'string') {
        healthy = false;
        issues.push(`Плагин "${name}" имеет некорректную версию`);
      }
    }

    return {
      healthy,
      issues,
      pluginCount: p[PRIVATE.PLUGINS].size,
      initialized: p[PRIVATE.STATE].initialized,
      ready: p[PRIVATE.STATE].ready,
      destroyed: p[PRIVATE.STATE].destroyed,
      immerEnabled: CONFIG.immerEnabled,
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // 16. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__PLUGIN_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };

      window.__pluginManager = this;
      window[PUBLIC.INSTANCE] = this;
      window[PUBLIC.WITH_IMMER] = CONFIG.immerEnabled;

      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;

      console.log('📊 PLUGIN SYMBOLS STATS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
      console.log(`  🔄 Immer: ${CONFIG.immerEnabled ? 'ON' : 'OFF'}`);
    }
  }

  // ============================================================
  // 17. УНИЧТОЖЕНИЕ
  // ============================================================

  [PRIVATE.DESTROY]() {
    const p = this._private.get(this);
    const logger = this._logger;

    if (p[PRIVATE.DESTROYED]) {
      logger.warn('⚠️ Plugin Manager уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение Plugin Manager...');

    this[PRIVATE.CLEAR]();
    p[PRIVATE.PLUGIN_HOOKS].clear();

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].ready = false;

    if (typeof window !== 'undefined') {
      delete window.__PLUGIN_SYMBOLS;
      delete window.__pluginManager;
      delete window[PUBLIC.INSTANCE];
    }

    logger.success('✅ Plugin Manager уничтожен');
  }

  // ============================================================
  // 18. ПУБЛИЧНЫЕ МЕТОДЫ (обертки)
  // ============================================================

  [PUBLIC.INIT]() {
    return this[PRIVATE.INIT]();
  }

  [PUBLIC.DESTROY]() {
    return this[PRIVATE.DESTROY]();
  }

  [PUBLIC.REGISTER](plugin) {
    return this[PRIVATE.REGISTER](plugin);
  }

  [PUBLIC.UNREGISTER](name) {
    return this[PRIVATE.UNREGISTER](name);
  }

  [PUBLIC.GET](name) {
    return this[PRIVATE.GET](name);
  }

  [PUBLIC.LIST]() {
    return this[PRIVATE.LIST]();
  }

  [PUBLIC.HAS](name) {
    return this[PRIVATE.HAS](name);
  }

  [PUBLIC.CLEAR]() {
    return this[PRIVATE.CLEAR]();
  }

  [PUBLIC.GET_STATE]() {
    return this[PRIVATE.GET_STATE]();
  }

  [PUBLIC.HEALTH_CHECK]() {
    return this[PRIVATE.HEALTH_CHECK]();
  }

  [PUBLIC.WITH_IMMER]() {
    return CONFIG.immerEnabled;
  }
}

// ============================================================
// 19. СОЗДАНИЕ МЕНЕДЖЕРА (SINGLETON)
// ============================================================

const PLUGIN_MANAGER_SYMBOL = Symbol.for('__PLUGIN_MANAGER__');

let pluginManagerInstance = null;

export function getPluginManager() {
  if (!pluginManagerInstance) {
    if (typeof window !== 'undefined' && window[PLUGIN_MANAGER_SYMBOL]) {
      pluginManagerInstance = window[PLUGIN_MANAGER_SYMBOL];
    } else {
      pluginManagerInstance = new PluginManager();
      if (typeof window !== 'undefined') {
        window[PLUGIN_MANAGER_SYMBOL] = pluginManagerInstance;
      }
    }
  }
  return pluginManagerInstance;
}

export const pluginManager = getPluginManager();

// ============================================================
// 20. ЭКСПОРТЫ (100% символы)
// ============================================================

export {
  PRIVATE as PLUGIN_PRIVATE,
  PUBLIC as PLUGIN_PUBLIC,
  CONFIG as PLUGIN_CONFIG,
};

// ============================================================
// 21. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  PersistencePlugin,
  ValidationPlugin,
  IndexPlugin,
  PaginationPlugin,
  AuditPlugin,
  BrokerPlugin,
  QuotaPlugin,
  CachePlugin,
  EncryptionPlugin,
  DEFAULT_PLUGINS,
  SECURITY_PLUGINS,
  PERFORMANCE_PLUGINS,
  CORE_PLUGINS,
  PluginManager,
  pluginManager,
  getPluginManager,
  PRIVATE,
  PUBLIC,
  CONFIG,
};

// ============================================================
// 22. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__PLUGIN_CONFIG = { ...CONFIG };
  window.__PLUGIN_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };
  window.__pluginManager = pluginManager;
  window[PUBLIC.INSTANCE] = pluginManager;
  window[PUBLIC.WITH_IMMER] = CONFIG.immerEnabled;

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔌 PLUGIN MANAGER (100% СИМВОЛЫ + IMMER) v4.0.6               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ ПЛАГИНЫ:                                                      ║');
  console.log(`║    ${DEFAULT_PLUGINS.map(p => `✅ ${p.name}`).join('\n║    ')}`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ПАКЕТЫ ПЛАГИНОВ:                                                        ║');
  console.log('║    DEFAULT_PLUGINS — все плагины                                            ║');
  console.log('║    SECURITY_PLUGINS — безопасность                                          ║');
  console.log('║    PERFORMANCE_PLUGINS — производительность                                 ║');
  console.log('║    CORE_PLUGINS — ядро                                                     ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КОМАНДЫ:                                                               ║');
  console.log('║    pluginManager.register(plugin) — зарегистрировать плагин                 ║');
  console.log('║    pluginManager.unregister(name) — удалить плагин                         ║');
  console.log('║    pluginManager.list() — список плагинов                                   ║');
  console.log('║    pluginManager.get(name) — получить плагин                                ║');
  console.log('║    pluginManager.getState() — состояние                                     ║');
  console.log('║    pluginManager.healthCheck() — проверка целостности                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log(`║    🔄 Immer: ${CONFIG.immerEnabled ? 'ON' : 'OFF'}                                                      ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  console.log('📋 КОМАНДЫ ОТЛАДКИ:');
  console.log('  window.__pluginManager — менеджер плагинов');
  console.log('  window.__PLUGIN_SYMBOLS — все символы');
  console.log('  window.__PLUGIN_CONFIG — конфигурация');
  console.log('  window.__pluginManager.withImmer() — статус Immer');
  console.log('');
}

// ============================================================
// 23. СТАТИСТИКА СИМВОЛОВ
// ============================================================

const PRIVATE_COUNT = Object.keys(PRIVATE).length;
const PUBLIC_COUNT = Object.keys(PUBLIC).length;

console.log('📊 PLUGINS STATS:');
console.log(`  🔑 Приватных символов: ${PRIVATE_COUNT}`);
console.log(`  🔓 Публичных символов: ${PUBLIC_COUNT}`);
console.log(`  📦 Всего символов: ${PRIVATE_COUNT + PUBLIC_COUNT}`);
console.log(`  🔄 Immer: ${CONFIG.immerEnabled ? 'ON' : 'OFF'}`);
console.log(`  📋 Версия: ${CONFIG.version} (${CONFIG.build})`);

// ============================================================
// 24. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование плагинов с Immer
// ============================================================

import {
    DEFAULT_PLUGINS,
    PersistencePlugin,
    ValidationPlugin,
    BrokerPlugin,
    pluginManager
} from './plugins/index.js';

// 1. Регистрация всех плагинов
for (const plugin of DEFAULT_PLUGINS) {
    pluginManager.register(plugin);
}

// 2. Получение плагина
const persistence = pluginManager.get('persistence');
console.log('Persistence:', persistence);

// 3. Список плагинов
console.log('Плагины:', pluginManager.list());

// 4. Состояние
console.log('Состояние:', pluginManager.getState());

// 5. Health check
console.log('Health:', pluginManager.healthCheck());

// 6. Проверка Immer
console.log('Immer включен:', pluginManager.withImmer());
*/