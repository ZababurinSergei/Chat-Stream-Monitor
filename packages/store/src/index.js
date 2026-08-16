// ============================================================
// index.js — 100% СИМВОЛЫ — точка входа Global Store
// Версия: 5.0.1 (ДОБАВЛЕНЫ ЭКСПОРТЫ getGlobalStoreInstance, registerGlobalStore)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { EnterpriseStore, GLOBAL_STORE_SYMBOL } from './core/EnterpriseStore.js';
import {
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
} from './plugins/index.js';

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  VERSION: Symbol('store.version'),
  BUILD: Symbol('store.build'),
  NAME: Symbol('store.name'),
  CONFIG: Symbol('store.config'),
  INSTANCE: Symbol('store.instance'),
  INITIALIZED: Symbol('store.initialized'),
  DESTROYED: Symbol('store.destroyed'),
  READY: Symbol('store.ready'),
  CREATED: Symbol('store.created'),
  START_TIME: Symbol('store.startTime'),
  LAST_UPDATE: Symbol('store.lastUpdate'),
  STATE: Symbol('store.state'),
  STATUS: Symbol('store.status'),
  ERROR: Symbol('store.error'),
  INIT: Symbol('store.init'),
  DESTROY: Symbol('store.destroy'),
  GET_STATE: Symbol('store.getState'),
  SET_STATE: Symbol('store.setState'),
  UPDATE_STATUS: Symbol('store.updateStatus'),
  HEALTH_CHECK: Symbol('store.healthCheck'),
  EXPORT_SYMBOLS: Symbol('store.exportSymbols'),
  VALIDATE: Symbol('store.validate'),
  SANITIZE: Symbol('store.sanitize'),
  SECURE: Symbol('store.secure'),
  CHECK_CONTEXT: Symbol('store.checkContext'),
  IS_FUNCTION: Symbol('store.isFunction'),
  IS_OBJECT: Symbol('store.isObject'),
  LOGGER: Symbol('store.logger'),
  LOG: Symbol('store.log'),
  DEBUG: Symbol('store.debug'),
  ERROR_LOG: Symbol('store.errorLog'),
  WARN: Symbol('store.warn'),
  SUCCESS: Symbol('store.success'),
  PLUGINS: Symbol('store.plugins'),
  PLUGIN_ORDER: Symbol('store.pluginOrder'),
  PLUGIN_STATE: Symbol('store.pluginState'),
  PLUGIN_ERRORS: Symbol('store.pluginErrors'),
  CONFIG_STORE: Symbol('store.configStore'),
  CONFIG_DEFAULTS: Symbol('store.configDefaults'),
  CONFIG_VALIDATION: Symbol('store.configValidation'),
  CREATE_STORE: Symbol('store.createStore'),
  GET_STORE: Symbol('store.getStore'),
  REGISTER_PLUGINS: Symbol('store.registerPlugins'),
  HANDLE_PLUGIN_ERROR: Symbol('store.handlePluginError'),
};

// ============================================================
// 3. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('store.instance'),
  STATE: Symbol.for('store.state'),
  CONFIG: Symbol.for('store.config'),
  VERSION: Symbol.for('store.version'),
  INIT: Symbol.for('store.init'),
  DESTROY: Symbol.for('store.destroy'),
  GET_STATE: Symbol.for('store.getState'),
  HEALTH_CHECK: Symbol.for('store.healthCheck'),
  GET_STORE: Symbol.for('store.getStore'),
  CREATE_STORE: Symbol.for('store.createStore'),
  GET_PLUGIN: Symbol.for('store.getPlugin'),
  LIST_PLUGINS: Symbol.for('store.listPlugins'),
  REGISTER_PLUGIN: Symbol.for('store.registerPlugin'),
  UNREGISTER_PLUGIN: Symbol.for('store.unregisterPlugin'),
  GET_GLOBAL_STORE: Symbol.for('store.getGlobalStore'),
};

// ============================================================
// 4. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '5.0.1',
  build: '2026-07-30',
  name: 'Global Store',
  debug: true,
  strictMode: true,
  autoInit: true,
  maxTables: 50,
  maxRecords: 10000,
  maxPlugins: 100,
  devtools: false,
  defaultPlugins: DEFAULT_PLUGINS,
  securityPlugins: SECURITY_PLUGINS,
  performancePlugins: PERFORMANCE_PLUGINS,
  corePlugins: CORE_PLUGINS,
  globalStoreSymbol: '__GLOBAL_STORE__',
  immerEnabled: true,
};

// ============================================================
// 5. ЛОГГЕР (100% символы)
// ============================================================

const LOGGER_SYMBOLS = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
  COLORS: Symbol('logger.colors'),
};

function createLogger(debug = true, instanceId = 'Store') {
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
      console.log(`${colors.bold}${colors.magenta}  📦 ${title}${colors.reset}`);
      console.log(`${colors.cyan}${separator}${colors.reset}`);
    },

    separator: (color = '#636e72') => {
      const colors = logState[LOGGER_SYMBOLS.COLORS];
      console.log(`${colors.gray}${'─'.repeat(70)}${colors.reset}`);
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
  logger[LOGGER_SYMBOLS.COLORS] = logState[LOGGER_SYMBOLS.COLORS];

  return logger;
}

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function isFunction(fn) {
  return fn && typeof fn === 'function';
}

function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function safeCall(fn, ...args) {
  if (isFunction(fn)) {
    try {
      return fn(...args);
    } catch (error) {
      console.error('❌ Ошибка вызова функции:', error);
      return null;
    }
  }
  return null;
}

// ============================================================
// 7. ФАБРИКА СОЗДАНИЯ STORE
// ============================================================

export function createStore(config = {}) {
  const logger = createLogger(CONFIG.debug, CONFIG.name);

  logger.header('СОЗДАНИЕ GLOBAL STORE');
  logger.info(`📦 Версия: ${CONFIG.version}`);
  logger.info(`📅 Сборка: ${CONFIG.build}`);
  logger.separator();

  try {
    const mergedConfig = {
      ...CONFIG,
      ...config,
      devtools: config.devtools !== undefined ? config.devtools : false,
    };

    const store = new EnterpriseStore(mergedConfig);
    logger.success('✅ Store создан');

    // ★★★ РЕГИСТРАЦИЯ ПЛАГИНОВ ★★★
    const plugins = config.plugins || DEFAULT_PLUGINS;
    logger.info(`🔌 Регистрация ${plugins.length} плагинов...`);

    let registered = 0;
    let errors = 0;

    for (const plugin of plugins) {
      try {
        const pluginName = plugin.name || 'unknown';
        store.use(plugin);
        registered++;
        logger.debug(`  ✅ ${pluginName}`);
      } catch (error) {
        errors++;
        const pluginName = plugin.name || 'unknown';
        logger.warn(`  ⚠️ Ошибка регистрации ${pluginName}: ${error.message}`);
      }
    }

    logger.success(
      `✅ Зарегистрировано ${registered} плагинов${errors > 0 ? `, ошибок: ${errors}` : ''}`
    );

    // ★★★ РЕГИСТРИРУЕМ В ГЛОБАЛЬНОМ ОБЪЕКТЕ ★★★
    registerGlobalStore(store);

    logger.header('ГОТОВ');
    return store;
  } catch (error) {
    logger.error('❌ Ошибка создания store:', error);
    throw error;
  }
}

// ============================================================
// 8. ★★★ РЕГИСТРАЦИЯ ГЛОБАЛЬНОГО ХРАНИЛИЩА ★★★
// ============================================================

function registerGlobalStore(store) {
  if (typeof window !== 'undefined') {
    // Регистрируем через Symbol
    window[GLOBAL_STORE_SYMBOL] = store;

    // Регистрируем через прямое свойство
    window.__GLOBAL_STORE__ = store;
    window.__globalStore = store;
    window.__db = store;

    // Регистрируем через публичный символ
    window[PUBLIC.INSTANCE] = store;
    window[PUBLIC.GET_GLOBAL_STORE] = () => store;

    // Добавляем метод для получения хранилища
    window.getGlobalStore = () => store;

    console.log('✅ __GLOBAL_STORE__ зарегистрирован в window');
    console.log('✅ window.__GLOBAL_STORE__ доступен');
    console.log('✅ window[Symbol.for("__GLOBAL_STORE__")] доступен');

    // Проверяем, что хранилище действительно зарегистрировано
    const testStore = window.__GLOBAL_STORE__;
    if (testStore) {
      console.log(`✅ Хранилище успешно зарегистрировано, тип: ${typeof testStore}`);
      console.log(
        `✅ Методы: ${Object.getOwnPropertyNames(testStore)
          .filter((m) => typeof testStore[m] === 'function')
          .join(', ')}`
      );
    } else {
      console.error('❌ Не удалось зарегистрировать хранилище');
    }
  }
}

// ============================================================
// 9. СОЗДАНИЕ ЭКЗЕМПЛЯРА (SINGLETON)
// ============================================================

let instance = null;
let instanceLock = false;

export function getStore(config = {}) {
  if (instanceLock) {
    console.warn('⚠️ Создание экземпляра заблокировано');
    return null;
  }

  if (!instance) {
    instanceLock = true;

    try {
      // Проверяем, есть ли уже глобальный экземпляр
      if (typeof window !== 'undefined') {
        // Проверяем через символ
        if (window[GLOBAL_STORE_SYMBOL]) {
          instance = window[GLOBAL_STORE_SYMBOL];
          console.log('♻️ Глобальный экземпляр найден через Symbol');
        }
        // Проверяем через прямое свойство
        else if (window.__GLOBAL_STORE__) {
          instance = window.__GLOBAL_STORE__;
          console.log('♻️ Глобальный экземпляр найден через __GLOBAL_STORE__');
        }
        // Проверяем через __globalStore
        else if (window.__globalStore) {
          instance = window.__globalStore;
          console.log('♻️ Глобальный экземпляр найден через __globalStore');
        }
      }

      // Если экземпляр не найден, создаем новый
      if (!instance) {
        instance = createStore(config);
        console.log('✅ Новый экземпляр создан');
      }
    } catch (error) {
      console.error('❌ Ошибка создания экземпляра:', error);
      throw error;
    } finally {
      instanceLock = false;
    }
  }

  return instance;
}

// ============================================================
// 10. ★★★ ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ХРАНИЛИЩА ★★★
// ============================================================

export function getGlobalStoreInstance() {
  // Проверяем уже созданный экземпляр
  if (instance) {
    return instance;
  }

  // Проверяем глобальный объект
  if (typeof window !== 'undefined') {
    // Проверяем все возможные места
    if (window.__GLOBAL_STORE__) {
      instance = window.__GLOBAL_STORE__;
      return instance;
    }
    if (window[GLOBAL_STORE_SYMBOL]) {
      instance = window[GLOBAL_STORE_SYMBOL];
      return instance;
    }
    if (window.__globalStore) {
      instance = window.__globalStore;
      return instance;
    }
    if (window.__db) {
      instance = window.__db;
      return instance;
    }

    // Если хранилище не найдено, создаем его
    console.warn('⚠️ Хранилище не найдено, создаем новое...');
    const newStore = createStore();
    registerGlobalStore(newStore);
    instance = newStore;
    return newStore;
  }

  return null;
}

// ============================================================
// 11. ★★★ АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ★★★
// ============================================================

// Создаем экземпляр при загрузке модуля
const store = getStore();

// ★★★ ПРОКСИ ДЛЯ ДОСТУПА К ХРАНИЛИЩУ ★★★
export const db = new Proxy(store, {
  get(target, prop) {
    // Проверяем методы StoreManager
    if (prop in target) {
      const value = target[prop];
      if (isFunction(value)) {
        return value.bind(target);
      }
      return value;
    }

    // Проверяем методы хранилища
    if (target._store && prop in target._store) {
      const value = target._store[prop];
      if (isFunction(value)) {
        return value.bind(target._store);
      }
      return value;
    }

    // Доступ к таблицам
    if (target._store && isFunction(target._store.table)) {
      return target._store.table(prop);
    }

    return undefined;
  },

  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
});

// ============================================================
// 12. ★★★ УБЕЖДАЕМСЯ, ЧТО ХРАНИЛИЩЕ ЗАРЕГИСТРИРОВАНО ★★★
// ============================================================

if (typeof window !== 'undefined' && store) {
  registerGlobalStore(store);
}

// ============================================================
// 13. ЭКСПОРТ ВСЕХ КОМПОНЕНТОВ
// ============================================================

// Экспорт классов
export { EnterpriseStore, PluginManager };

// Экспорт плагинов
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

// Экспорт пакетов плагинов
export { DEFAULT_PLUGINS, SECURITY_PLUGINS, PERFORMANCE_PLUGINS, CORE_PLUGINS };

// Экспорт менеджера плагинов
export { pluginManager, getPluginManager };

// Экспорт символов
export {
  GLOBAL_STORE_SYMBOL,
  PRIVATE as STORE_PRIVATE,
  PUBLIC as STORE_PUBLIC,
  CONFIG as STORE_CONFIG,
};


// ============================================================
// 14. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default db;

// ============================================================
// 15. ★★★ ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ (ПРИ ЗАГРУЗКЕ МОДУЛЯ) ★★★
// ============================================================

if (typeof window !== 'undefined') {
  // Убеждаемся, что хранилище зарегистрировано
  if (!window.__GLOBAL_STORE__ && store) {
    registerGlobalStore(store);
  }

  // Добавляем отладочные команды
  window.__debugStore = {
    getState: () => {
      try {
        return store.getState ? store.getState() : null;
      } catch (error) {
        return { error: error.message };
      }
    },
    getSymbols: () => ({
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
    }),
    getConfig: () => ({ ...CONFIG }),
    healthCheck: () => {
      try {
        return store.healthCheck ? store.healthCheck() : null;
      } catch (error) {
        return { error: error.message };
      }
    },
    listPlugins: () => {
      try {
        return store.listPlugins ? store.listPlugins() : [];
      } catch (error) {
        return [];
      }
    },
    listTables: () => {
      try {
        return store.listTables ? store.listTables() : [];
      } catch (error) {
        return [];
      }
    },
    getGlobalStore: () => {
      return getGlobalStoreInstance();
    },
    test: (command) => {
      try {
        const result = eval(command);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  };

  // Статистика символов
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🏢 GLOBAL STORE (100% СИМВОЛЫ) v5.0.1                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  🔑 Символ: __GLOBAL_STORE__                                               ║');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.__GLOBAL_STORE__ — доступ к хранилищу                             ║');
  console.log('║    window.__db — прокси для доступа к таблицам                              ║');
  console.log('║    window[Symbol.for("__GLOBAL_STORE__")] — доступ через символ             ║');
  console.log('║    window.getGlobalStore() — получить хранилище                             ║');
  console.log('║    getGlobalStoreInstance() — получить хранилище (импорт)                   ║');
  console.log('║  📋 КОМАНДЫ:                                                               ║');
  console.log('║    __db.users.add({ name: "Test" }) — добавить                              ║');
  console.log('║    __db.users.find({ id: "u1" }) — найти                                    ║');
  console.log('║    __db.undo() — отмена                                                    ║');
  console.log('║    __db.redo() — повтор                                                    ║');
  console.log('║    __db.publish("topic", data) — опубликовать                              ║');
  console.log('║    __db.subscribe("topic", callback) — подписаться                         ║');
  console.log('║    __db.save() — сохранить                                                 ║');
  console.log('║    __db.load() — загрузить                                                 ║');
  console.log('║    __db.healthCheck() — проверка целостности                               ║');
  console.log('║    __db.listTables() — список таблиц                                       ║');
  console.log('║    __db.listPlugins() — список плагинов                                    ║');
  console.log('║    __db.getPlugin(name) — получить плагин                                  ║');
  console.log('║    __db.registerPlugin(plugin) — зарегистрировать плагин                   ║');
  console.log('║    __db.unregisterPlugin(name) — удалить плагин                            ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(
    `║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ОТЛАДКА:                                                               ║');
  console.log('║    window.__debugStore.getState() — состояние                              ║');
  console.log('║    window.__debugStore.getSymbols() — символы                              ║');
  console.log('║    window.__debugStore.getConfig() — конфигурация                          ║');
  console.log('║    window.__debugStore.healthCheck() — проверка целостности                ║');
  console.log('║    window.__debugStore.listPlugins() — список плагинов                     ║');
  console.log('║    window.__debugStore.listTables() — список таблиц                        ║');
  console.log('║    window.__debugStore.getGlobalStore() — получить хранилище               ║');
  console.log('║    window.__debugStore.test(code) — выполнить код                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 16. КОНЕЦ ФАЙЛА
// ============================================================
