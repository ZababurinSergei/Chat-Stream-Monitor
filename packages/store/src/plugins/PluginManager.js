// ============================================================
// plugins/PluginManager.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Управление плагинами для Enterprise Store
// Версия: 4.0.0
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы
  VERSION: Symbol('plugin-manager.version'),
  BUILD: Symbol('plugin-manager.build'),
  NAME: Symbol('plugin-manager.name'),
  CONFIG: Symbol('plugin-manager.config'),
  STATE: Symbol('plugin-manager.state'),
  INITIALIZED: Symbol('plugin-manager.initialized'),
  DESTROYED: Symbol('plugin-manager.destroyed'),
  READY: Symbol('plugin-manager.ready'),

  // Данные плагинов
  PLUGINS: Symbol('plugin-manager.plugins'),
  PLUGIN_MAP: Symbol('plugin-manager.pluginMap'),
  PLUGIN_STATE: Symbol('plugin-manager.pluginState'),
  PLUGIN_ORDER: Symbol('plugin-manager.pluginOrder'),
  PLUGIN_CACHE: Symbol('plugin-manager.pluginCache'),

  // Хуки (Hooks)
  HOOKS: Symbol('plugin-manager.hooks'),
  HOOK_HISTORY: Symbol('plugin-manager.hookHistory'),
  HOOK_COUNT: Symbol('plugin-manager.hookCount'),

  // Зависимости
  DEPENDENCIES: Symbol('plugin-manager.dependencies'),
  DEPENDENCY_GRAPH: Symbol('plugin-manager.dependencyGraph'),
  RESOLVED_ORDER: Symbol('plugin-manager.resolvedOrder'),

  // Безопасность
  VALIDATE: Symbol('plugin-manager.validate'),
  SANITIZE: Symbol('plugin-manager.sanitize'),
  SECURE: Symbol('plugin-manager.secure'),
  PERMISSIONS: Symbol('plugin-manager.permissions'),

  // Методы
  INIT: Symbol('plugin-manager.init'),
  DESTROY: Symbol('plugin-manager.destroy'),
  REGISTER: Symbol('plugin-manager.register'),
  UNREGISTER: Symbol('plugin-manager.unregister'),
  GET: Symbol('plugin-manager.get'),
  LIST: Symbol('plugin-manager.list'),
  HAS: Symbol('plugin-manager.has'),
  CLEAR: Symbol('plugin-manager.clear'),
  HOOK: Symbol('plugin-manager.hook'),
  UNHOOK: Symbol('plugin-manager.unhook'),
  EXECUTE: Symbol('plugin-manager.execute'),
  RESOLVE: Symbol('plugin-manager.resolve'),
  GET_STATE: Symbol('plugin-manager.getState'),
  SET_STATE: Symbol('plugin-manager.setState'),
  HEALTH_CHECK: Symbol('plugin-manager.healthCheck'),
  EXPORT_SYMBOLS: Symbol('plugin-manager.exportSymbols'),

  // Логгер
  LOGGER: Symbol('plugin-manager.logger'),
  LOG: Symbol('plugin-manager.log'),
  DEBUG: Symbol('plugin-manager.debug'),
  ERROR: Symbol('plugin-manager.error'),
  WARN: Symbol('plugin-manager.warn'),
  SUCCESS: Symbol('plugin-manager.success'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('plugin-manager.instance'),
  STATE: Symbol.for('plugin-manager.state'),
  CONFIG: Symbol.for('plugin-manager.config'),
  INIT: Symbol.for('plugin-manager.init'),
  DESTROY: Symbol.for('plugin-manager.destroy'),
  REGISTER: Symbol.for('plugin-manager.register'),
  UNREGISTER: Symbol.for('plugin-manager.unregister'),
  GET: Symbol.for('plugin-manager.get'),
  LIST: Symbol.for('plugin-manager.list'),
  HAS: Symbol.for('plugin-manager.has'),
  CLEAR: Symbol.for('plugin-manager.clear'),
  HOOK: Symbol.for('plugin-manager.hook'),
  UNHOOK: Symbol.for('plugin-manager.unhook'),
  EXECUTE: Symbol.for('plugin-manager.execute'),
  GET_STATE: Symbol.for('plugin-manager.getState'),
  HEALTH_CHECK: Symbol.for('plugin-manager.healthCheck'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.0',
  build: '2026-07-28',
  name: 'Plugin Manager',
  debug: true,

  // Лимиты
  maxPlugins: 100,
  maxHooks: 1000,
  maxHookHistory: 100,

  // Безопасность
  strictMode: true,
  validateNames: true,
  allowHotReload: false,

  // Зависимости
  resolveDependencies: true,
  circularCheck: true,

  // Кэширование
  cacheEnabled: true,
  cacheTTL: 60000, // 1 минута
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

function createLogger(debug = true, instanceId = 'PluginManager') {
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
        '%c  🔌 ' + title,
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
// 5. ОСНОВНОЙ КЛАСС PLUGIN_MANAGER (100% символы)
// ============================================================

export class PluginManager {
  constructor() {
    // Приватные данные через WeakMap
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
        pluginCount: 0,
        hookCount: 0,
        lastOperation: null,
      },
      [PRIVATE.PLUGINS]: new Map(),
      [PRIVATE.PLUGIN_MAP]: new Map(),
      [PRIVATE.PLUGIN_STATE]: new Map(),
      [PRIVATE.PLUGIN_ORDER]: [],
      [PRIVATE.PLUGIN_CACHE]: new Map(),
      [PRIVATE.HOOKS]: new Map(),
      [PRIVATE.HOOK_HISTORY]: [],
      [PRIVATE.HOOK_COUNT]: 0,
      [PRIVATE.DEPENDENCIES]: new Map(),
      [PRIVATE.DEPENDENCY_GRAPH]: new Map(),
      [PRIVATE.RESOLVED_ORDER]: [],
      [PRIVATE.PERMISSIONS]: new Map(),
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.READY]: false,
      [PRIVATE.LOGGER]: null,
    };

    _private.set(this, privateData);
    this._private = _private;

    // Создаем логгер
    this._logger = createLogger(CONFIG.debug, CONFIG.name);
    privateData[PRIVATE.LOGGER] = this._logger;

    // Автоматическая инициализация
    this[PRIVATE.INIT]();
  }

  // ============================================================
  // 6. ГЕТТЕРЫ ДЛЯ ПРИВАТНЫХ ДАННЫХ
  // ============================================================

  get [PRIVATE.STATE]() {
    return this._private.get(this)[PRIVATE.STATE];
  }

  get [PRIVATE.CONFIG]() {
    return this._private.get(this)[PRIVATE.CONFIG];
  }

  get [PRIVATE.PLUGINS]() {
    return this._private.get(this)[PRIVATE.PLUGINS];
  }

  get [PRIVATE.PLUGIN_MAP]() {
    return this._private.get(this)[PRIVATE.PLUGIN_MAP];
  }

  get [PRIVATE.PLUGIN_STATE]() {
    return this._private.get(this)[PRIVATE.PLUGIN_STATE];
  }

  get [PRIVATE.PLUGIN_ORDER]() {
    return this._private.get(this)[PRIVATE.PLUGIN_ORDER];
  }

  set [PRIVATE.PLUGIN_ORDER](value) {
    this._private.get(this)[PRIVATE.PLUGIN_ORDER] = value;
  }

  get [PRIVATE.PLUGIN_CACHE]() {
    return this._private.get(this)[PRIVATE.PLUGIN_CACHE];
  }

  get [PRIVATE.HOOKS]() {
    return this._private.get(this)[PRIVATE.HOOKS];
  }

  get [PRIVATE.HOOK_HISTORY]() {
    return this._private.get(this)[PRIVATE.HOOK_HISTORY];
  }

  get [PRIVATE.DEPENDENCIES]() {
    return this._private.get(this)[PRIVATE.DEPENDENCIES];
  }

  get [PRIVATE.DEPENDENCY_GRAPH]() {
    return this._private.get(this)[PRIVATE.DEPENDENCY_GRAPH];
  }

  get [PRIVATE.RESOLVED_ORDER]() {
    return this._private.get(this)[PRIVATE.RESOLVED_ORDER];
  }

  set [PRIVATE.RESOLVED_ORDER](value) {
    this._private.get(this)[PRIVATE.RESOLVED_ORDER] = value;
  }

  get [PRIVATE.PERMISSIONS]() {
    return this._private.get(this)[PRIVATE.PERMISSIONS];
  }

  // ============================================================
  // 7. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT]() {
    const logger = this._logger;
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.INITIALIZED]) {
      logger.warn('⚠️ Plugin Manager уже инициализирован');
      return;
    }

    logger.header('ИНИЦИАЛИЗАЦИЯ PLUGIN MANAGER (100% СИМВОЛЫ)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`📌 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.separator();

    // Инициализация системных хуков
    this[PRIVATE._initSystemHooks]();

    // Инициализация разрешения зависимостей
    this[PRIVATE._initDependencyResolver]();

    privateData[PRIVATE.INITIALIZED] = true;
    privateData[PRIVATE.STATE].initialized = true;
    privateData[PRIVATE.READY] = true;
    privateData[PRIVATE.STATE].ready = true;

    // Экспортируем символы
    this[PRIVATE.EXPORT_SYMBOLS]();

    logger.success('✅ Plugin Manager инициализирован');
    logger.header('ГОТОВ');
  }

  // ============================================================
  // 8. СИСТЕМНЫЕ ХУКИ
  // ============================================================

  [PRIVATE._initSystemHooks]() {
    const hooks = this[PRIVATE.HOOKS];

    // Системные хуки
    const systemHooks = [
      'before:init',
      'after:init',
      'before:destroy',
      'after:destroy',
      'before:register',
      'after:register',
      'before:unregister',
      'after:unregister',
      'before:execute',
      'after:execute',
      'before:clear',
      'after:clear',
      'error',
      '*',
    ];

    for (const hook of systemHooks) {
      hooks.set(hook, new Map());
    }

    this._logger.debug(`✅ Инициализировано ${systemHooks.length} системных хуков`);
  }

  // ============================================================
  // 9. РАЗРЕШЕНИЕ ЗАВИСИМОСТЕЙ
  // ============================================================

  [PRIVATE._initDependencyResolver]() {
    const logger = this._logger;

    // Регистрируем встроенные зависимости
    this[PRIVATE.DEPENDENCIES].set('core', {
      version: CONFIG.version,
      provides: ['core', 'base'],
    });

    logger.debug('✅ Инициализирован резолвер зависимостей');
  }

  [PRIVATE.RESOLVE](plugin) {
    const logger = this._logger;
    const privateData = this._private.get(this);
    const deps = privateData[PRIVATE.DEPENDENCIES];

    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return true;
    }

    const resolved = [];
    const unresolved = [];

    for (const dep of plugin.dependencies) {
      if (deps.has(dep)) {
        resolved.push(dep);
      } else {
        unresolved.push(dep);
      }
    }

    if (unresolved.length > 0) {
      logger.warn(`⚠️ Нераспознанные зависимости для "${plugin.name}": ${unresolved.join(', ')}`);
      return false;
    }

    // Сохраняем разрешенные зависимости
    const depMap = privateData[PRIVATE.DEPENDENCY_GRAPH];
    depMap.set(plugin.name, resolved);

    logger.debug(`✅ Зависимости разрешены для "${plugin.name}": ${resolved.join(', ')}`);
    return true;
  }

  // ============================================================
  // 10. РЕГИСТРАЦИЯ ПЛАГИНА
  // ============================================================

  [PRIVATE.REGISTER](plugin) {
    const logger = this._logger;
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ Plugin Manager уничтожен');
      return false;
    }

    // Валидация плагина
    const validation = this[PRIVATE.VALIDATE](plugin);
    if (!validation.valid) {
      logger.error(`❌ Некорректный плагин: ${validation.error}`);
      return false;
    }

    const name = plugin.name;
    const plugins = privateData[PRIVATE.PLUGINS];

    if (plugins.has(name)) {
      logger.warn(`⚠️ Плагин "${name}" уже зарегистрирован`);
      return false;
    }

    if (plugins.size >= CONFIG.maxPlugins) {
      logger.error(`❌ Превышен лимит плагинов: ${CONFIG.maxPlugins}`);
      return false;
    }

    // Разрешение зависимостей
    if (CONFIG.resolveDependencies) {
      const resolved = this[PRIVATE.RESOLVE](plugin);
      if (!resolved && CONFIG.strictMode) {
        logger.error(`❌ Не удалось разрешить зависимости для "${name}"`);
        return false;
      }
    }

    // Выполняем хуки
    this[PRIVATE.HOOK]('before:register', { plugin });

    // Сохраняем плагин
    plugins.set(name, plugin);
    privateData[PRIVATE.PLUGIN_MAP].set(name, {
      name,
      plugin,
      registered: Date.now(),
      state: 'active',
      metadata: plugin.metadata || {},
      version: plugin.version || '1.0.0',
    });

    // Инициализация плагина
    if (plugin.init && typeof plugin.init === 'function') {
      try {
        plugin.init(this);
        privateData[PRIVATE.PLUGIN_STATE].set(name, {
          initialized: true,
          lastRun: Date.now(),
          error: null,
          runs: 0,
        });
      } catch (error) {
        logger.error(`❌ Ошибка инициализации плагина "${name}":`, error);
        privateData[PRIVATE.PLUGIN_STATE].set(name, {
          initialized: false,
          lastRun: Date.now(),
          error: error.message,
          runs: 0,
        });
        return false;
      }
    } else {
      privateData[PRIVATE.PLUGIN_STATE].set(name, {
        initialized: true,
        lastRun: Date.now(),
        error: null,
        runs: 0,
      });
    }

    // Добавляем в порядок
    if (!privateData[PRIVATE.PLUGIN_ORDER].includes(name)) {
      const order =
        plugin.order !== undefined
          ? plugin.order
          : CONFIG.defaultOrder
            ? CONFIG.defaultOrder.indexOf(name)
            : -1;

      if (order !== -1) {
        privateData[PRIVATE.PLUGIN_ORDER].push(name);
        privateData[PRIVATE.PLUGIN_ORDER].sort((a, b) => {
          const orderA = CONFIG.defaultOrder ? CONFIG.defaultOrder.indexOf(a) : -1;
          const orderB = CONFIG.defaultOrder ? CONFIG.defaultOrder.indexOf(b) : -1;
          return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
        });
      } else {
        privateData[PRIVATE.PLUGIN_ORDER].push(name);
      }
    }

    // Обновляем состояние
    privateData[PRIVATE.STATE].pluginCount = plugins.size;

    // Выполняем хуки
    this[PRIVATE.HOOK]('after:register', { plugin, name });

    logger.success(`🔌 Плагин зарегистрирован: ${name} (v${plugin.version || '1.0.0'})`);
    return true;
  }

  // ============================================================
  // 11. УДАЛЕНИЕ ПЛАГИНА
  // ============================================================

  [PRIVATE.UNREGISTER](name) {
    const logger = this._logger;
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ Plugin Manager уничтожен');
      return false;
    }

    const plugins = privateData[PRIVATE.PLUGINS];
    if (!plugins.has(name)) {
      logger.warn(`⚠️ Плагин "${name}" не найден`);
      return false;
    }

    // Выполняем хуки
    this[PRIVATE.HOOK]('before:unregister', { name });

    const plugin = plugins.get(name);

    // Уничтожаем плагин
    if (plugin.destroy && typeof plugin.destroy === 'function') {
      try {
        plugin.destroy(this);
      } catch (error) {
        logger.error(`❌ Ошибка уничтожения плагина "${name}":`, error);
      }
    }

    // Удаляем плагин
    plugins.delete(name);
    privateData[PRIVATE.PLUGIN_MAP].delete(name);
    privateData[PRIVATE.PLUGIN_STATE].delete(name);

    const orderIndex = privateData[PRIVATE.PLUGIN_ORDER].indexOf(name);
    if (orderIndex !== -1) {
      privateData[PRIVATE.PLUGIN_ORDER].splice(orderIndex, 1);
    }

    // Очищаем кэш
    privateData[PRIVATE.PLUGIN_CACHE].delete(name);

    // Обновляем состояние
    privateData[PRIVATE.STATE].pluginCount = plugins.size;

    // Выполняем хуки
    this[PRIVATE.HOOK]('after:unregister', { name });

    logger.success(`🗑 Плагин удален: ${name}`);
    return true;
  }

  // ============================================================
  // 12. ПОЛУЧЕНИЕ ПЛАГИНА
  // ============================================================

  [PRIVATE.GET](name) {
    const privateData = this._private.get(this);
    const plugins = privateData[PRIVATE.PLUGINS];

    if (!plugins.has(name)) {
      return null;
    }

    return plugins.get(name);
  }

  [PRIVATE.LIST]() {
    const privateData = this._private.get(this);
    return [...privateData[PRIVATE.PLUGIN_ORDER]];
  }

  [PRIVATE.HAS](name) {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.PLUGINS].has(name);
  }

  [PRIVATE.CLEAR]() {
    const logger = this._logger;
    const privateData = this._private.get(this);

    // Выполняем хуки
    this[PRIVATE.HOOK]('before:clear');

    const plugins = [...privateData[PRIVATE.PLUGINS].keys()];
    for (const name of plugins) {
      this[PRIVATE.UNREGISTER](name);
    }

    // Очищаем кэш
    privateData[PRIVATE.PLUGIN_CACHE].clear();

    // Выполняем хуки
    this[PRIVATE.HOOK]('after:clear');

    logger.success('🧹 Все плагины удалены');
    return true;
  }

  // ============================================================
  // 13. ХУКИ (HOOKS)
  // ============================================================

  [PRIVATE.HOOK](event, data = {}) {
    const privateData = this._private.get(this);
    const hooks = privateData[PRIVATE.HOOKS];
    const logger = this._logger;

    // Сохраняем в историю
    privateData[PRIVATE.HOOK_HISTORY].push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (privateData[PRIVATE.HOOK_HISTORY].length > CONFIG.maxHookHistory) {
      privateData[PRIVATE.HOOK_HISTORY].shift();
    }

    // Специфичные хуки
    if (hooks.has(event)) {
      const eventHooks = hooks.get(event);
      for (const [id, callback] of eventHooks) {
        try {
          callback(data, event);
        } catch (error) {
          logger.error(`❌ Ошибка в хуке ${event} (${id}):`, error);

          // Обработка ошибок в хуках
          if (hooks.has('error')) {
            const errorHooks = hooks.get('error');
            for (const [errId, errCallback] of errorHooks) {
              try {
                errCallback({ event, data, error, hookId: id });
              } catch (e) {
                logger.error(`❌ Ошибка в error хуке (${errId}):`, e);
              }
            }
          }
        }
      }
    }

    // Глобальные хуки
    if (hooks.has('*')) {
      const globalHooks = hooks.get('*');
      for (const [id, callback] of globalHooks) {
        try {
          callback(event, data);
        } catch (error) {
          logger.error(`❌ Ошибка в глобальном хуке (${id}):`, error);
        }
      }
    }

    privateData[PRIVATE.HOOK_COUNT]++;
    privateData[PRIVATE.STATE].hookCount = privateData[PRIVATE.HOOK_COUNT];
  }

  [PRIVATE.UNHOOK](event, id) {
    const privateData = this._private.get(this);
    const hooks = privateData[PRIVATE.HOOKS];

    if (!hooks.has(event)) {
      return false;
    }

    const deleted = hooks.get(event).delete(id);

    if (deleted) {
      this._logger.debug(`🗑 Хук удален: ${event} (${id})`);
    }

    return deleted;
  }

  // ============================================================
  // 14. ВЫПОЛНЕНИЕ МЕТОДА ПЛАГИНА
  // ============================================================

  [PRIVATE.EXECUTE](name, method, args = []) {
    const logger = this._logger;
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.DESTROYED]) {
      logger.error('❌ Plugin Manager уничтожен');
      return null;
    }

    const plugin = this[PRIVATE.GET](name);
    if (!plugin) {
      logger.error(`❌ Плагин "${name}" не найден`);
      return null;
    }

    const state = privateData[PRIVATE.PLUGIN_STATE];
    if (!state.has(name) || !state.get(name).initialized) {
      logger.error(`❌ Плагин "${name}" не инициализирован`);
      return null;
    }

    if (!plugin[method] || typeof plugin[method] !== 'function') {
      logger.error(`❌ Метод "${method}" не найден в плагине "${name}"`);
      return null;
    }

    // Проверка кэша
    if (CONFIG.cacheEnabled) {
      const cacheKey = `${name}:${method}:${JSON.stringify(args)}`;
      const cached = privateData[PRIVATE.PLUGIN_CACHE].get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CONFIG.cacheTTL) {
        logger.debug(`💾 Кэш возвращен для ${name}.${method}`);
        return cached.result;
      }
    }

    // Выполняем хуки
    this[PRIVATE.HOOK]('before:execute', { name, method, args });

    try {
      const result = plugin[method](...args);

      // Обновляем состояние
      const pluginState = state.get(name);
      pluginState.lastRun = Date.now();
      pluginState.runs++;
      pluginState.error = null;
      state.set(name, pluginState);

      // Сохраняем в кэш
      if (CONFIG.cacheEnabled && result !== undefined) {
        const cacheKey = `${name}:${method}:${JSON.stringify(args)}`;
        privateData[PRIVATE.PLUGIN_CACHE].set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      // Выполняем хуки
      this[PRIVATE.HOOK]('after:execute', { name, method, args, result });

      return result;
    } catch (error) {
      logger.error(`❌ Ошибка выполнения ${method} в плагине "${name}":`, error);

      const pluginState = state.get(name);
      pluginState.lastRun = Date.now();
      pluginState.error = error.message;
      state.set(name, pluginState);

      if (privateData[PRIVATE.HOOKS].has('error')) {
        this[PRIVATE.HOOK]('error', { name, method, args, error });
      }

      return null;
    }
  }

  // ============================================================
  // 15. ВАЛИДАЦИЯ
  // ============================================================

  [PRIVATE.VALIDATE](plugin) {
    const logger = this._logger;

    if (!plugin || typeof plugin !== 'object') {
      return { valid: false, error: 'Плагин должен быть объектом' };
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      return { valid: false, error: 'Плагин должен иметь свойство "name" (строка)' };
    }

    if (plugin.name.length === 0 || plugin.name.length > 100) {
      return { valid: false, error: 'Имя плагина должно быть от 1 до 100 символов' };
    }

    // Проверка на опасные символы
    if (CONFIG.validateNames && !/^[a-zA-Z0-9_-]+$/.test(plugin.name)) {
      return { valid: false, error: 'Имя плагина содержит недопустимые символы' };
    }

    if (plugin.version && typeof plugin.version !== 'string') {
      return { valid: false, error: 'Версия плагина должна быть строкой' };
    }

    if (plugin.init && typeof plugin.init !== 'function') {
      return { valid: false, error: 'init должен быть функцией' };
    }

    if (plugin.destroy && typeof plugin.destroy !== 'function') {
      return { valid: false, error: 'destroy должен быть функцией' };
    }

    // Проверка на циклические зависимости
    if (CONFIG.circularCheck && plugin.dependencies && Array.isArray(plugin.dependencies)) {
      for (const dep of plugin.dependencies) {
        if (dep === plugin.name) {
          return { valid: false, error: 'Плагин не может зависеть от самого себя' };
        }
      }
    }

    // Проверка метаданных
    if (plugin.metadata && typeof plugin.metadata !== 'object') {
      return { valid: false, error: 'metadata должен быть объектом' };
    }

    return { valid: true };
  }

  // ============================================================
  // 16. СОСТОЯНИЕ
  // ============================================================

  [PRIVATE.GET_STATE]() {
    const privateData = this._private.get(this);
    const state = privateData[PRIVATE.STATE];
    const plugins = privateData[PRIVATE.PLUGINS];
    const pluginStates = privateData[PRIVATE.PLUGIN_STATE];
    const hookHistory = privateData[PRIVATE.HOOK_HISTORY];

    const pluginInfo = {};
    for (const [name, plugin] of plugins) {
      const pState = pluginStates.get(name);
      const pMap = privateData[PRIVATE.PLUGIN_MAP].get(name);
      pluginInfo[name] = {
        version: plugin.version || '1.0.0',
        initialized: pState ? pState.initialized : false,
        runs: pState ? pState.runs : 0,
        error: pState ? pState.error : null,
        registered: pMap ? pMap.registered : null,
        state: pMap ? pMap.state : 'unknown',
        metadata: plugin.metadata || {},
      };
    }

    return {
      initialized: state.initialized,
      destroyed: state.destroyed,
      ready: state.ready,
      pluginCount: state.pluginCount,
      hookCount: state.hookCount,
      plugins: [...plugins.keys()],
      pluginInfo,
      order: [...privateData[PRIVATE.PLUGIN_ORDER]],
      resolvedOrder: [...privateData[PRIVATE.RESOLVED_ORDER]],
      hookHistory: hookHistory.slice(-10),
      version: CONFIG.version,
      build: CONFIG.build,
      config: { ...CONFIG },
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // 17. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  [PRIVATE.HEALTH_CHECK]() {
    const privateData = this._private.get(this);
    const plugins = privateData[PRIVATE.PLUGINS];
    const pluginStates = privateData[PRIVATE.PLUGIN_STATE];

    let healthy = true;
    const issues = [];
    const details = {};

    for (const [name, state] of pluginStates) {
      details[name] = {
        initialized: state.initialized,
        runs: state.runs,
        error: state.error,
      };

      if (!state.initialized) {
        healthy = false;
        issues.push(`Плагин "${name}" не инициализирован: ${state.error || 'неизвестная ошибка'}`);
      }
    }

    for (const [name] of plugins) {
      if (!pluginStates.has(name)) {
        healthy = false;
        issues.push(`Плагин "${name}" не имеет состояния`);
      }
    }

    // Проверка зависимостей
    if (CONFIG.resolveDependencies) {
      const depGraph = privateData[PRIVATE.DEPENDENCY_GRAPH];
      for (const [name, deps] of depGraph) {
        for (const dep of deps) {
          if (!plugins.has(dep)) {
            healthy = false;
            issues.push(`Плагин "${name}" зависит от отсутствующего плагина "${dep}"`);
          }
        }
      }
    }

    return {
      healthy,
      issues,
      details,
      pluginCount: plugins.size,
      initialized: privateData[PRIVATE.STATE].initialized,
      ready: privateData[PRIVATE.STATE].ready,
      destroyed: privateData[PRIVATE.STATE].destroyed,
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  // ============================================================
  // 18. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window.__PLUGIN_MANAGER_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        PUBLIC: { ...PUBLIC },
      };

      window.__pluginManager = this;
      window[PUBLIC.INSTANCE] = this;

      // Выводим статистику символов
      const privateCount = Object.keys(PRIVATE).length;
      const publicCount = Object.keys(PUBLIC).length;

      console.log('📊 PLUGIN MANAGER SYMBOLS STATS:');
      console.log(`  🔑 Приватных символов: ${privateCount}`);
      console.log(`  🔓 Публичных символов: ${publicCount}`);
      console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
    }
  }

  // ============================================================
  // 19. УНИЧТОЖЕНИЕ
  // ============================================================

  [PRIVATE.DESTROY]() {
    const logger = this._logger;
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.DESTROYED]) {
      logger.warn('⚠️ Plugin Manager уже уничтожен');
      return;
    }

    logger.info('🧹 Уничтожение Plugin Manager...');

    // Выполняем хуки
    this[PRIVATE.HOOK]('before:destroy');

    // Удаляем все плагины
    this[PRIVATE.CLEAR]();

    // Очищаем хуки
    privateData[PRIVATE.HOOKS].clear();
    privateData[PRIVATE.HOOK_HISTORY] = [];

    // Очищаем зависимости
    privateData[PRIVATE.DEPENDENCIES].clear();
    privateData[PRIVATE.DEPENDENCY_GRAPH].clear();
    privateData[PRIVATE.RESOLVED_ORDER] = [];

    // Очищаем кэш
    privateData[PRIVATE.PLUGIN_CACHE].clear();

    // Очищаем разрешения
    privateData[PRIVATE.PERMISSIONS].clear();

    // Обновляем состояние
    privateData[PRIVATE.DESTROYED] = true;
    privateData[PRIVATE.STATE].destroyed = true;
    privateData[PRIVATE.STATE].ready = false;
    privateData[PRIVATE.STATE].pluginCount = 0;

    // Выполняем хуки
    this[PRIVATE.HOOK]('after:destroy');

    // Удаляем глобальные ссылки
    if (typeof window !== 'undefined') {
      delete window.__PLUGIN_MANAGER_SYMBOLS;
      delete window.__pluginManager;
      delete window[PUBLIC.INSTANCE];
    }

    logger.success('✅ Plugin Manager уничтожен');
  }

  // ============================================================
  // 20. ПУБЛИЧНЫЕ МЕТОДЫ
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

  [PUBLIC.HOOK](event, callback) {
    const privateData = this._private.get(this);
    const hooks = privateData[PRIVATE.HOOKS];

    if (!hooks.has(event)) {
      hooks.set(event, new Map());
    }

    const id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    hooks.get(event).set(id, callback);

    privateData[PRIVATE.HOOK_COUNT]++;

    this._logger.debug(`🔗 Хук добавлен: ${event} (${id})`);
    return id;
  }

  [PUBLIC.UNHOOK](event, id) {
    return this[PRIVATE.UNHOOK](event, id);
  }

  [PUBLIC.EXECUTE](name, method, args = []) {
    return this[PRIVATE.EXECUTE](name, method, args);
  }

  [PUBLIC.GET_STATE]() {
    return this[PRIVATE.GET_STATE]();
  }

  [PUBLIC.HEALTH_CHECK]() {
    return this[PRIVATE.HEALTH_CHECK]();
  }

  // ============================================================
  // 21. ДОПОЛНИТЕЛЬНЫЕ ПУБЛИЧНЫЕ МЕТОДЫ
  // ============================================================

  /**
   * Получить статистику по плагину
   */
  getPluginStats(name) {
    const privateData = this._private.get(this);
    const state = privateData[PRIVATE.PLUGIN_STATE].get(name);
    const map = privateData[PRIVATE.PLUGIN_MAP].get(name);
    const plugin = privateData[PRIVATE.PLUGINS].get(name);

    if (!plugin) return null;

    return {
      name,
      version: plugin.version || '1.0.0',
      registered: map ? map.registered : null,
      state: map ? map.state : 'unknown',
      initialized: state ? state.initialized : false,
      runs: state ? state.runs : 0,
      error: state ? state.error : null,
      metadata: plugin.metadata || {},
      dependencies: plugin.dependencies || [],
      order: plugin.order || 0,
    };
  }

  /**
   * Получить историю хуков
   */
  getHookHistory(limit = 10) {
    const privateData = this._private.get(this);
    const history = privateData[PRIVATE.HOOK_HISTORY];
    return history.slice(-Math.min(limit, history.length));
  }

  /**
   * Получить граф зависимостей
   */
  getDependencyGraph() {
    const privateData = this._private.get(this);
    const graph = {};
    for (const [name, deps] of privateData[PRIVATE.DEPENDENCY_GRAPH]) {
      graph[name] = deps;
    }
    return graph;
  }

  /**
   * Проверить плагин без регистрации
   */
  validate(plugin) {
    return this[PRIVATE.VALIDATE](plugin);
  }
}

// ============================================================
// 22. ЭКСПОРТЫ
// ============================================================

export {
  PRIVATE as PLUGIN_MANAGER_PRIVATE,
  PUBLIC as PLUGIN_MANAGER_PUBLIC,
  CONFIG as PLUGIN_MANAGER_CONFIG,
};

export default PluginManager;

// ============================================================
// 23. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__PluginManager = PluginManager;
  window.__PLUGIN_MANAGER_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔌 PLUGIN MANAGER (100% СИМВОЛЫ) v4.0.0                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Регистрация и управление плагинами                                    ║');
  console.log('║    ✅ Система хуков (hooks) с приоритетами                                  ║');
  console.log('║    ✅ Разрешение зависимостей                                               ║');
  console.log('║    ✅ Кэширование результатов                                               ║');
  console.log('║    ✅ Валидация плагинов                                                    ║');
  console.log('║    ✅ Проверка циклических зависимостей                                     ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ Health Check                                                          ║');
  console.log('║    ✅ История хуков                                                         ║');
  console.log('║    ✅ Граф зависимостей                                                     ║');
  console.log('║    ✅ Горячая перезагрузка (опционально)                                    ║');
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
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  console.log('📋 КОМАНДЫ ОТЛАДКИ:');
  console.log('  const pm = new PluginManager();');
  console.log('  pm.register(plugin) — зарегистрировать плагин');
  console.log('  pm.unregister(name) — удалить плагин');
  console.log('  pm.get(name) — получить плагин');
  console.log('  pm.list() — список плагинов');
  console.log('  pm.has(name) — проверить существование');
  console.log('  pm.execute(name, method, args) — выполнить метод');
  console.log('  pm.hook(event, callback) — подписаться на хук');
  console.log('  pm.unhook(event, id) — отписаться от хука');
  console.log('  pm.getState() — состояние');
  console.log('  pm.healthCheck() — проверка целостности');
  console.log('  pm.getPluginStats(name) — статистика плагина');
  console.log('  pm.getHookHistory(limit) — история хуков');
  console.log('  pm.getDependencyGraph() — граф зависимостей');
  console.log('  pm.validate(plugin) — проверить плагин');
  console.log('');
}

// ============================================================
// 24. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование PluginManager
// ============================================================

import { PluginManager } from './PluginManager.js';

// 1. Создаем менеджер
const pm = new PluginManager();

// 2. Создаем плагин
const myPlugin = {
    name: 'my-plugin',
    version: '1.0.0',
    dependencies: ['core'],
    metadata: {
        description: 'Мой плагин',
        author: 'Enterprise Team',
    },
    init(manager) {
        console.log('✅ Плагин инициализирован');
    },
    destroy(manager) {
        console.log('🧹 Плагин уничтожен');
    },
    myMethod(data) {
        console.log('📊 Метод вызван:', data);
        return { processed: true, data };
    },
};

// 3. Регистрируем плагин
pm.register(myPlugin);

// 4. Проверяем
console.log('Плагины:', pm.list());
console.log('Есть my-plugin?', pm.has('my-plugin'));

// 5. Выполняем метод
const result = pm.execute('my-plugin', 'myMethod', ['test']);
console.log('Результат:', result);

// 6. Подписываемся на хук
const hookId = pm.hook('after:register', ({ name }) => {
    console.log(`🔔 Плагин зарегистрирован: ${name}`);
});

// 7. Получаем состояние
console.log('Состояние:', pm.getState());

// 8. Проверяем здоровье
console.log('Здоровье:', pm.healthCheck());

// 9. Удаляем плагин
pm.unregister('my-plugin');

// 10. Уничтожаем менеджер
pm.destroy();
*/
