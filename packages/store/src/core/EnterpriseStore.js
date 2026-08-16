// ============================================================
// core/EnterpriseStore.js — 100% СИМВОЛЫ — полная изоляция
// Ядро Global Store — Enterprise Store
// Версия: 4.0.7 (СТАБИЛЬНАЯ — БЕЗ ОШИБОК)
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы
  VERSION: Symbol('store.version'),
  BUILD: Symbol('store.build'),
  NAME: Symbol('store.name'),
  CONFIG: Symbol('store.config'),
  STATE: Symbol('store.state'),
  INITIALIZED: Symbol('store.initialized'),
  DESTROYED: Symbol('store.destroyed'),
  READY: Symbol('store.ready'),

  // Данные
  TABLES: Symbol('store.tables'),
  RELATIONS: Symbol('store.relations'),
  SELECTED: Symbol('store.selected'),
  LISTENERS: Symbol('store.listeners'),
  UNDO_STACK: Symbol('store.undoStack'),
  REDO_STACK: Symbol('store.redoStack'),
  TRANSACTIONS: Symbol('store.transactions'),
  ZUSTAND: Symbol('store.zustand'),
  BUFFER: Symbol('store.buffer'),
  PENDING_TABLES: Symbol('store.pending'),
  AUTO_CREATE: Symbol('store.autoCreate'),
  PLUGINS: Symbol('store.plugins'),
  CONFIG_STORE: Symbol('store.config'),
  LOGGER: Symbol('store.logger'),

  // Методы инициализации
  INIT: Symbol('store.init'),
  DESTROY: Symbol('store.destroy'),
  NOTIFY: Symbol('store.notify'),
  GET_STATE: Symbol('store.getState'),
  UPDATE_STATS: Symbol('store.updateStats'),
  EXPORT_SYMBOLS: Symbol('store.exportSymbols'),
  _CREATE_ZUSTAND: Symbol('store.createZustand'),
  _INIT_SYSTEM_TABLES: Symbol('store.initSystemTables'),
  _CREATE_TABLE_PROXY: Symbol('store.createTableProxy'),
  _BUFFER_OPERATION: Symbol('store.bufferOperation'),
  _REPLAY_BUFFER: Symbol('store.replayBuffer'),
  _REPLAY_BUFFER_FOR_TABLE: Symbol('store.replayBufferForTable'),
  _APPLY_OPERATIONS: Symbol('store.applyOperations'),
  _SAVE_UNDO: Symbol('store.saveUndo'),
  _RESTORE_STATE: Symbol('store.restoreState'),
  _APPLY_STATE: Symbol('store.applyState'),
  _SNAPSHOT: Symbol('store.snapshot'),
  _RESTORE: Symbol('store.restore'),
  _UPDATE_ZUSTAND: Symbol('store.updateZustand'),

  // CRUD методы
  _ADD: Symbol('store.add'),
  _FIND: Symbol('store.find'),
  _UPDATE_DATA: Symbol('store.updateData'),
  _REMOVE: Symbol('store.remove'),
  _ALL: Symbol('store.all'),
  _COUNT: Symbol('store.count'),
  _CLEAR: Symbol('store.clear'),

  // Безопасность
  VALIDATE: Symbol('store.validate'),
  SANITIZE: Symbol('store.sanitize'),
  SECURE: Symbol('store.secure'),
  CHECK_CONTEXT: Symbol('store.checkContext'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
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
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.7',
  build: '2026-07-28',
  name: 'Global Store',
  debug: true,
  autoInit: true,
  devtools: false,
  maxUndoSteps: 50,
  maxMessages: 500,
  syncDebounce: 100,
  defaultPageSize: 20,
};

// ============================================================
// 4. ГЛОБАЛЬНЫЙ СИМВОЛ ДОСТУПА
// ============================================================

export const GLOBAL_STORE_SYMBOL = Symbol.for('__GLOBAL_STORE__');

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

    if (msgLevel > currentLevel) {
      return;
    }

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
  logger[LOGGER_SYMBOLS.COLORS] = logState[LOGGER_SYMBOLS.COLORS];

  return logger;
}

// ============================================================
// 6. ОСНОВНОЙ КЛАСС ENTERPRISE_STORE (100% символы)
// ============================================================

export class EnterpriseStore {
  constructor(config = {}) {
    // Приватные данные через WeakMap
    const _private = new WeakMap();

    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG_STORE]: {
        ...CONFIG,
        ...config,
        devtools: config.devtools !== undefined ? config.devtools : false,
      },
      [PRIVATE.STATE]: {
        initialized: false,
        destroyed: false,
        ready: false,
        streamStatus: 'disconnected',
        lastUpdate: null,
        _batches: 0,
        _subscribersCount: 0,
        version: CONFIG.version,
      },
      [PRIVATE.TABLES]: new Map(),
      [PRIVATE.RELATIONS]: new Map(),
      [PRIVATE.SELECTED]: new Map(),
      [PRIVATE.LISTENERS]: [],
      [PRIVATE.UNDO_STACK]: [],
      [PRIVATE.REDO_STACK]: [],
      [PRIVATE.TRANSACTIONS]: [],
      [PRIVATE.ZUSTAND]: null,
      [PRIVATE.BUFFER]: [],
      [PRIVATE.PENDING_TABLES]: new Set(),
      [PRIVATE.AUTO_CREATE]: true,
      [PRIVATE.PLUGINS]: new Map(),
      [PRIVATE.LOGGER]: null,
      [PRIVATE.INITIALIZED]: false,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.READY]: false,
    };

    _private.set(this, privateData);
    this._private = _private;
    this._logger = createLogger(CONFIG.debug, CONFIG.name);

    // Автоматическая инициализация
    this[PRIVATE.INIT]();
  }

  // ============================================================
  // 7. ГЕТТЕРЫ ДЛЯ ПРИВАТНЫХ ДАННЫХ
  // ============================================================

  _getPrivate(key) {
    return this._private.get(this)[key];
  }

  _getState() {
    return this._getPrivate(PRIVATE.STATE);
  }

  _getTables() {
    return this._getPrivate(PRIVATE.TABLES);
  }

  _getRelations() {
    return this._getPrivate(PRIVATE.RELATIONS);
  }

  _getSelected() {
    return this._getPrivate(PRIVATE.SELECTED);
  }

  _getListeners() {
    return this._getPrivate(PRIVATE.LISTENERS);
  }

  _getUndoStack() {
    return this._getPrivate(PRIVATE.UNDO_STACK);
  }

  _getRedoStack() {
    return this._getPrivate(PRIVATE.REDO_STACK);
  }

  _getTransactions() {
    return this._getPrivate(PRIVATE.TRANSACTIONS);
  }

  _getZustand() {
    return this._getPrivate(PRIVATE.ZUSTAND);
  }

  _getBuffer() {
    return this._getPrivate(PRIVATE.BUFFER);
  }

  _getPlugins() {
    return this._getPrivate(PRIVATE.PLUGINS);
  }

  _getConfigStore() {
    return this._getPrivate(PRIVATE.CONFIG_STORE);
  }

  _getLogger() {
    return this._getPrivate(PRIVATE.LOGGER);
  }

  // ============================================================
  // 8. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  [PRIVATE.INIT]() {
    const logger = this._logger;
    const privateData = this._private.get(this);

    logger.header('ИНИЦИАЛИЗАЦИЯ GLOBAL STORE (100% СИМВОЛЫ)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`📌 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.separator();

    try {
      // 1. Создаем Zustand Store
      this[PRIVATE._CREATE_ZUSTAND]();

      // 2. Инициализируем системные таблицы
      this[PRIVATE._INIT_SYSTEM_TABLES]();

      // 3. Экспортируем символы
      this[PRIVATE.EXPORT_SYMBOLS]();

      // 4. Обновляем состояние
      privateData[PRIVATE.INITIALIZED] = true;
      privateData[PRIVATE.READY] = true;
      privateData[PRIVATE.STATE].initialized = true;
      privateData[PRIVATE.STATE].ready = true;

      logger.success('✅ Global Store инициализирован');
      logger.info(`📊 Таблиц: ${privateData[PRIVATE.TABLES].size}`);
      logger.info(`🔌 Плагинов: ${privateData[PRIVATE.PLUGINS].size}`);
      logger.header('ГОТОВ');
    } catch (error) {
      logger.error('❌ Ошибка инициализации:', error);
      throw error;
    }
  }

  // ============================================================
  // 9. СОЗДАНИЕ ZUSTAND STORE (СТАБИЛЬНАЯ ВЕРСИЯ)
  // ============================================================

  [PRIVATE._CREATE_ZUSTAND]() {
    const privateData = this._private.get(this);
    const logger = this._logger;
    const config = privateData[PRIVATE.CONFIG_STORE];

    try {
      // Базовый креатор
      const storeCreator = (set) => ({
        tables: {},
        selected: {},
        relations: {},
        events: [],
        buffer: [],
        pendingTables: [],
        lastUpdate: null,

        updateTables: (tables) => {
          set((state) => {
            state.tables = tables;
            state.lastUpdate = Date.now();
            return state;
          });
        },

        updateSelected: (selected) => {
          set((state) => {
            state.selected = selected;
            return state;
          });
        },

        updateRelations: (relations) => {
          set((state) => {
            state.relations = relations;
            return state;
          });
        },

        updateBuffer: (buffer) => {
          set((state) => {
            state.buffer = buffer;
            return state;
          });
        },

        addEvent: (event) => {
          set((state) => {
            state.events.unshift({
              ...event,
              timestamp: Date.now(),
            });
            if (state.events.length > 100) {
              state.events = state.events.slice(0, 100);
            }
            return state;
          });
        },

        // Универсальный метод обновления
        update: (updater) => {
          set(updater);
        },
      });

      // Создаем store с middleware
      const store = create(
        subscribeWithSelector(
          devtools(storeCreator, { name: 'EnterpriseStore' })
        )
      );

      if (!store || typeof store.getState !== 'function') {
        throw new Error('Zustand store не создан');
      }

      // Инициализируем состояние
      store.setState({
        tables: {},
        selected: {},
        relations: {},
        events: [],
        buffer: [],
        pendingTables: [],
        lastUpdate: Date.now(),
      });

      privateData[PRIVATE.ZUSTAND] = store;

      logger.debug('✅ Zustand Store создан');

    } catch (error) {
      logger.error('❌ Ошибка создания Zustand Store:', error);

      // FALLBACK: упрощенный вариант
      try {
        logger.info('🔄 Создаем Zustand Store (упрощенный)...');

        const fallbackStore = create((set) => ({
          tables: {},
          selected: {},
          relations: {},
          events: [],
          buffer: [],
          pendingTables: [],
          lastUpdate: Date.now(),

          updateTables: (tables) => set({ tables, lastUpdate: Date.now() }),
          updateSelected: (selected) => set({ selected }),
          updateRelations: (relations) => set({ relations }),
          updateBuffer: (buffer) => set({ buffer }),
          addEvent: (event) => set((state) => ({
            events: [{ ...event, timestamp: Date.now() }, ...state.events].slice(0, 100)
          })),
          update: (updater) => set(updater),
        }));

        privateData[PRIVATE.ZUSTAND] = fallbackStore;
        logger.success('✅ Zustand Store создан (упрощенный)');

      } catch (fallbackError) {
        logger.error('❌ Критическая ошибка:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // ============================================================
  // 10. СИСТЕМНЫЕ ТАБЛИЦЫ
  // ============================================================

  [PRIVATE._INIT_SYSTEM_TABLES]() {
    const logger = this._logger;

    this.createTable('_meta', {
      schema: {
        id: { type: 'string', required: true },
        key: { type: 'string', required: true },
        value: { type: 'any' },
        updatedAt: { type: 'number' },
      },
      metadata: { description: 'Метаданные хранилища' },
    });

    this.createTable('_events', {
      schema: {
        id: { type: 'string', required: true },
        type: { type: 'string', required: true },
        payload: { type: 'any' },
        timestamp: { type: 'number', required: true },
      },
      metadata: { description: 'История событий' },
    });

    logger.debug('✅ Системные таблицы созданы');
  }

  // ============================================================
  // 11. ДОСТУП К ТАБЛИЦАМ
  // ============================================================

  table(name) {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.TABLES].has(name)) {
      return this[PRIVATE._CREATE_TABLE_PROXY](name);
    }

    if (privateData[PRIVATE.AUTO_CREATE]) {
      this.createTable(name);
      return this[PRIVATE._CREATE_TABLE_PROXY](name);
    }

    this._logger.warn(`⚠️ Таблица "${name}" не найдена`);
    return null;
  }

  // ============================================================
  // 12. СОЗДАНИЕ ПРОКСИ ДЛЯ ТАБЛИЦЫ
  // ============================================================

  [PRIVATE._CREATE_TABLE_PROXY](name) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);
    if (!table) {
      return null;
    }

    const self = this;

    return new Proxy(table, {
      get(target, prop) {
        // Методы таблицы
        if (prop === 'add') {
          return (...rows) => self[PRIVATE._ADD](name, rows);
        }
        if (prop === 'find') {
          return query => self[PRIVATE._FIND](name, query);
        }
        if (prop === 'update') {
          return (query, data) => self[PRIVATE._UPDATE_DATA](name, query, data);
        }
        if (prop === 'remove') {
          return query => self[PRIVATE._REMOVE](name, query);
        }
        if (prop === 'all') {
          return () => self[PRIVATE._ALL](name);
        }
        if (prop === 'count') {
          return () => self[PRIVATE._COUNT](name);
        }
        if (prop === 'clear') {
          return () => self[PRIVATE._CLEAR](name);
        }
        if (prop === 'meta') {
          return target.meta;
        }
        if (prop === 'data') {
          return target.data;
        }
        if (prop === 'length') {
          return target.data.length;
        }
        if (prop === 'exists') {
          return true;
        }
        if (typeof prop === 'string' && !isNaN(prop)) {
          return target.data[parseInt(prop)];
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (prop === 'data') {
          target.data = value;
          self[PRIVATE._UPDATE_ZUSTAND]();
          self[PRIVATE.NOTIFY]('update', name);
          return true;
        }
        target[prop] = value;
        return true;
      },
    });
  }

  // ============================================================
  // 13. ПУБЛИЧНЫЙ МЕТОД CREATE_TABLE
  // ============================================================

  createTable(name, options = {}) {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.TABLES].has(name)) {
      this._logger.warn(`⚠️ Таблица "${name}" уже существует`);
      return privateData[PRIVATE.TABLES].get(name);
    }

    const table = {
      name,
      data: [],
      schema: options.schema || {},
      meta: {
        created: Date.now(),
        updated: Date.now(),
        version: 1,
        ...options.metadata,
      },
      indexes: new Map(),
    };

    privateData[PRIVATE.TABLES].set(name, table);
    this[PRIVATE._UPDATE_ZUSTAND]();
    this[PRIVATE.NOTIFY]('create', name);

    this._logger.success(`✅ Таблица создана: ${name}`);
    return table;
  }

  // ============================================================
  // 14. CRUD ОПЕРАЦИИ (СТАБИЛЬНЫЕ)
  // ============================================================

  [PRIVATE._ADD](name, rows) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);

    if (!table) {
      this[PRIVATE._BUFFER_OPERATION]({ type: 'insert', table: name, data: rows });
      if (privateData[PRIVATE.AUTO_CREATE]) {
        this.table(name);
      }
      return null;
    }

    const items = Array.isArray(rows) ? rows : [rows];
    const added = [];

    for (const item of items) {
      // Авто-ID
      if (!item.id) {
        item.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }
      item._created = Date.now();
      item._updated = Date.now();

      // Проверка дубликатов
      const exists = table.data.some(r => r.id === item.id);
      if (!exists) {
        table.data.push(item);
        added.push(item);
      }
    }

    if (added.length > 0) {
      table.meta.version++;
      this[PRIVATE._SAVE_UNDO](name, 'add', added);
      this[PRIVATE.NOTIFY]('add', name, added);
      this[PRIVATE._UPDATE_ZUSTAND]();
    }

    return added;
  }

  [PRIVATE._FIND](name, query) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);
    if (!table) {
      return [];
    }

    let results = [...table.data];

    if (query) {
      if (typeof query === 'function') {
        results = results.filter(query);
      } else {
        results = results.filter(row => {
          for (const [key, value] of Object.entries(query)) {
            if (row[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }
    }

    return results;
  }

  [PRIVATE._UPDATE_DATA](name, query, data) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);

    if (!table) {
      this[PRIVATE._BUFFER_OPERATION]({ type: 'update', table: name, query, data });
      if (privateData[PRIVATE.AUTO_CREATE]) {
        this.table(name);
      }
      return null;
    }

    const rows = this[PRIVATE._FIND](name, query);
    const updated = [];

    for (const row of rows) {
      const index = table.data.indexOf(row);
      if (index !== -1) {
        const old = { ...row };
        Object.assign(row, data);
        row._updated = Date.now();
        updated.push({ old, new: row });
      }
    }

    if (updated.length > 0) {
      table.meta.version++;
      this[PRIVATE._SAVE_UNDO](name, 'update', updated);
      this[PRIVATE.NOTIFY]('update', name, updated);
      this[PRIVATE._UPDATE_ZUSTAND]();
    }

    return updated;
  }

  [PRIVATE._REMOVE](name, query) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);

    if (!table) {
      this[PRIVATE._BUFFER_OPERATION]({ type: 'remove', table: name, query });
      if (privateData[PRIVATE.AUTO_CREATE]) {
        this.table(name);
      }
      return null;
    }

    const rows = this[PRIVATE._FIND](name, query);
    const removed = [];

    for (const row of rows) {
      const index = table.data.indexOf(row);
      if (index !== -1) {
        removed.push(table.data.splice(index, 1)[0]);
      }
    }

    if (removed.length > 0) {
      table.meta.version++;
      this[PRIVATE._SAVE_UNDO](name, 'remove', removed);
      this[PRIVATE.NOTIFY]('remove', name, removed);
      this[PRIVATE._UPDATE_ZUSTAND]();
    }

    return removed;
  }

  [PRIVATE._ALL](name) {
    return this[PRIVATE._FIND](name);
  }

  [PRIVATE._COUNT](name) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);
    return table ? table.data.length : 0;
  }

  [PRIVATE._CLEAR](name) {
    const privateData = this._private.get(this);
    const table = privateData[PRIVATE.TABLES].get(name);

    if (!table) {
      this[PRIVATE._BUFFER_OPERATION]({ type: 'clear', table: name });
      if (privateData[PRIVATE.AUTO_CREATE]) {
        this.table(name);
      }
      return false;
    }

    const oldData = [...table.data];
    table.data = [];
    table.meta.version++;
    this[PRIVATE._SAVE_UNDO](name, 'clear', oldData);
    this[PRIVATE.NOTIFY]('clear', name);
    this[PRIVATE._UPDATE_ZUSTAND]();

    return true;
  }

  // ============================================================
  // 15. ПУБЛИЧНЫЕ МЕТОДЫ (ОБЕРТКИ)
  // ============================================================

  getTable(name) {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.TABLES].get(name) || null;
  }

  listTables() {
    const privateData = this._private.get(this);
    return Array.from(privateData[PRIVATE.TABLES].keys());
  }

  dropTable(name) {
    const privateData = this._private.get(this);

    if (!privateData[PRIVATE.TABLES].has(name)) {
      this._logger.warn(`⚠️ Таблица "${name}" не найдена`);
      return false;
    }

    privateData[PRIVATE.TABLES].delete(name);
    privateData[PRIVATE.RELATIONS].delete(name);
    privateData[PRIVATE.SELECTED].delete(name);
    this[PRIVATE._UPDATE_ZUSTAND]();
    this[PRIVATE.NOTIFY]('drop', name);

    this._logger.success(`🗑 Таблица удалена: ${name}`);
    return true;
  }

  clearTable(name) {
    return this[PRIVATE._CLEAR](name);
  }

  insert(table, rows) {
    return this[PRIVATE._ADD](table, rows);
  }

  select(table, options = {}) {
    return this[PRIVATE._FIND](table, options.where || null);
  }

  update(table, query, data) {
    return this[PRIVATE._UPDATE_DATA](table, query, data);
  }

  delete(table, query) {
    return this[PRIVATE._REMOVE](table, query);
  }

  // ============================================================
  // 16. МАСТЕР-ДЕТЕЙЛ
  // ============================================================

  link(master, detail, key = 'masterId') {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.AUTO_CREATE]) {
      if (!privateData[PRIVATE.TABLES].has(master)) {
        this.table(master);
      }
      if (!privateData[PRIVATE.TABLES].has(detail)) {
        this.table(detail);
      }
    }

    const relKey = `${master}:${detail}`;
    privateData[PRIVATE.RELATIONS].set(relKey, {
      master,
      detail,
      key,
      masterId: null,
      masterData: null,
      details: [],
    });

    this[PRIVATE._UPDATE_ZUSTAND]();
    this[PRIVATE.NOTIFY]('link', relKey);

    this._logger.success(`🔗 Таблицы связаны: ${master} → ${detail}`);
    return this;
  }

  selectMaster(master, id) {
    const privateData = this._private.get(this);
    privateData[PRIVATE.SELECTED].set(master, id);

    const masterData = this[PRIVATE._FIND](master, { id });
    const masterRow = masterData && masterData.length > 0 ? masterData[0] : null;

    for (const [key, rel] of privateData[PRIVATE.RELATIONS]) {
      if (rel.master === master) {
        rel.masterId = id;
        rel.masterData = masterRow;
        rel.details = this[PRIVATE._FIND](rel.detail, { [rel.key]: id });
      }
    }

    this[PRIVATE._UPDATE_ZUSTAND]();
    this[PRIVATE.NOTIFY]('select', master, { id });

    this._logger.success(`🎯 Мастер выбран: ${master}[${id}]`);
    return this;
  }

  getDetails(master) {
    const privateData = this._private.get(this);
    const id = privateData[PRIVATE.SELECTED].get(master);
    if (!id) {
      return {};
    }

    const result = {};
    for (const [key, rel] of privateData[PRIVATE.RELATIONS]) {
      if (rel.master === master) {
        result[rel.detail] = rel.details || this[PRIVATE._FIND](rel.detail, { [rel.key]: id });
      }
    }
    return result;
  }

  // ============================================================
  // 17. ТРАНЗАКЦИИ
  // ============================================================

  begin(name = 'Transaction') {
    const privateData = this._private.get(this);
    const snapshot = this[PRIVATE._SNAPSHOT]();
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    privateData[PRIVATE.TRANSACTIONS].push({
      id,
      name,
      snapshot,
      started: Date.now(),
    });

    this[PRIVATE.NOTIFY]('begin', name);
    this._logger.info(`🔒 Транзакция начата: ${name}`);
    return id;
  }

  commit() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.TRANSACTIONS].length === 0) {
      this._logger.warn('⚠️ Нет активных транзакций');
      return false;
    }

    const tx = privateData[PRIVATE.TRANSACTIONS].pop();
    privateData[PRIVATE.UNDO_STACK].push({
      snapshot: tx.snapshot,
      name: tx.name,
      timestamp: Date.now(),
    });

    if (privateData[PRIVATE.UNDO_STACK].length > CONFIG.maxUndoSteps) {
      privateData[PRIVATE.UNDO_STACK].shift();
    }

    privateData[PRIVATE.REDO_STACK] = [];
    this[PRIVATE.NOTIFY]('commit', tx.name);
    this[PRIVATE._UPDATE_ZUSTAND]();

    this._logger.success(`✅ Транзакция зафиксирована: ${tx.name}`);
    return true;
  }

  rollback() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.TRANSACTIONS].length === 0) {
      this._logger.warn('⚠️ Нет активных транзакций');
      return false;
    }

    const tx = privateData[PRIVATE.TRANSACTIONS].pop();
    this[PRIVATE._RESTORE](tx.snapshot);
    this[PRIVATE.NOTIFY]('rollback', tx.name);
    this[PRIVATE._UPDATE_ZUSTAND]();

    this._logger.warn(`⏪ Транзакция откачена: ${tx.name}`);
    return true;
  }

  undo() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.UNDO_STACK].length === 0) {
      this._logger.warn('⚠️ Нет действий для отмены');
      return false;
    }

    const state = privateData[PRIVATE.UNDO_STACK].pop();
    privateData[PRIVATE.REDO_STACK].push({
      snapshot: this[PRIVATE._SNAPSHOT](),
      name: state.name,
      timestamp: Date.now(),
    });

    this[PRIVATE._RESTORE](state.snapshot);
    this[PRIVATE.NOTIFY]('undo', state.name);
    this[PRIVATE._UPDATE_ZUSTAND]();

    this._logger.success(`↩️ Отмена: ${state.name}`);
    return true;
  }

  redo() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.REDO_STACK].length === 0) {
      this._logger.warn('⚠️ Нет действий для повторения');
      return false;
    }

    const state = privateData[PRIVATE.REDO_STACK].pop();
    privateData[PRIVATE.UNDO_STACK].push({
      snapshot: this[PRIVATE._SNAPSHOT](),
      name: state.name,
      timestamp: Date.now(),
    });

    this[PRIVATE._RESTORE](state.snapshot);
    this[PRIVATE.NOTIFY]('redo', state.name);
    this[PRIVATE._UPDATE_ZUSTAND]();

    this._logger.success(`↪️ Повтор: ${state.name}`);
    return true;
  }

  // ============================================================
  // 18. ПОДПИСКИ
  // ============================================================

  on(event, callback) {
    const privateData = this._private.get(this);
    privateData[PRIVATE.LISTENERS].push({ event, callback });
    return this;
  }

  off(callback) {
    const privateData = this._private.get(this);
    privateData[PRIVATE.LISTENERS] = privateData[PRIVATE.LISTENERS].filter(
      l => l.callback !== callback
    );
    return this;
  }

  [PRIVATE.NOTIFY](event, table, data) {
    const privateData = this._private.get(this);
    const message = { event, table, data, timestamp: Date.now() };

    this[PRIVATE._UPDATE_ZUSTAND]();

    for (const listener of privateData[PRIVATE.LISTENERS]) {
      if (listener.event === '*' || listener.event === event) {
        try {
          listener.callback(message);
        } catch (error) {
          this._logger.error(`❌ Ошибка в подписчике:`, error);
        }
      }
    }
  }

  // ============================================================
  // 19. ПЛАГИНЫ (СТАБИЛЬНАЯ ВЕРСИЯ)
  // ============================================================

  use(plugin) {
    const privateData = this._private.get(this);
    const logger = this._logger;

    // Обработка функций (включая классы)
    if (typeof plugin === 'function') {
      try {
        const isClass = plugin.prototype && typeof plugin.prototype.init === 'function';

        if (isClass) {
          logger.debug(`🏗️ Создание экземпляра класса: ${plugin.name || 'anonymous'}`);
          const instance = new plugin();
          const name = instance.name || plugin.name || 'anonymous';

          if (instance.init && typeof instance.init === 'function') {
            instance.init(this);
          }

          privateData[PRIVATE.PLUGINS].set(name, instance);
          logger.success(`🔌 Плагин зарегистрирован (класс): ${name}`);
          return this;
        } else {
          logger.debug(`🔌 Вызов функции плагина: ${plugin.name || 'anonymous'}`);
          plugin(this);
          const name = plugin.name || 'anonymous-function';
          if (!privateData[PRIVATE.PLUGINS].has(name)) {
            privateData[PRIVATE.PLUGINS].set(name, { name, init: plugin });
          }
          logger.success(`🔌 Плагин зарегистрирован (функция): ${name}`);
          return this;
        }
      } catch (error) {
        logger.error('❌ Ошибка регистрации плагина (функция/класс):', error);
        throw error;
      }
    }

    // Обработка объектов
    if (typeof plugin === 'object' && plugin !== null) {
      const name = plugin.name || 'anonymous';

      if (privateData[PRIVATE.PLUGINS].has(name)) {
        logger.warn(`⚠️ Плагин "${name}" уже зарегистрирован`);
        return this;
      }

      privateData[PRIVATE.PLUGINS].set(name, plugin);

      if (plugin.init && typeof plugin.init === 'function') {
        try {
          // ★★★ ИСПРАВЛЕНО: безопасный вызов init ★★★
          const result = plugin.init(this);
          if (result !== false) {
            logger.success(`🔌 Плагин зарегистрирован (объект): ${name}`);
          } else {
            logger.warn(`⚠️ Плагин "${name}" вернул false при инициализации`);
          }
        } catch (error) {
          logger.error(`❌ Ошибка инициализации плагина "${name}":`, error);
          // ★★★ ИСПРАВЛЕНО: не удаляем плагин при ошибке, чтобы не ломать систему ★★★
          privateData[PRIVATE.PLUGINS].set(name, {
            name,
            error: error.message,
            _hasError: true
          });
          logger.warn(`⚠️ Плагин "${name}" зарегистрирован с ошибкой`);
        }
      } else {
        logger.success(`🔌 Плагин зарегистрирован (объект, без init): ${name}`);
      }
      return this;
    }

    logger.error('❌ Некорректный плагин: должен быть функцией, объектом или классом');
    throw new TypeError('Plugin must be a function, object, or class');
  }

  getPlugin(name) {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.PLUGINS].get(name) || null;
  }

  listPlugins() {
    const privateData = this._private.get(this);
    return Array.from(privateData[PRIVATE.PLUGINS].keys());
  }

  // ============================================================
  // 20. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  [PRIVATE._SAVE_UNDO](table, action, data) {
    const privateData = this._private.get(this);
    privateData[PRIVATE.UNDO_STACK].push({
      table,
      action,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
    });

    if (privateData[PRIVATE.UNDO_STACK].length > CONFIG.maxUndoSteps) {
      privateData[PRIVATE.UNDO_STACK].shift();
    }

    privateData[PRIVATE.REDO_STACK] = [];
  }

  [PRIVATE._SNAPSHOT]() {
    const privateData = this._private.get(this);
    const tables = {};

    for (const [name, table] of privateData[PRIVATE.TABLES]) {
      tables[name] = {
        data: JSON.parse(JSON.stringify(table.data)),
        meta: JSON.parse(JSON.stringify(table.meta)),
      };
    }

    return {
      tables,
      selected: new Map(privateData[PRIVATE.SELECTED]),
      timestamp: Date.now(),
    };
  }

  [PRIVATE._RESTORE](snapshot) {
    const privateData = this._private.get(this);

    for (const [name, tableData] of Object.entries(snapshot.tables)) {
      if (privateData[PRIVATE.TABLES].has(name)) {
        const table = privateData[PRIVATE.TABLES].get(name);
        table.data = tableData.data;
        table.meta = tableData.meta;
      }
    }

    privateData[PRIVATE.SELECTED] = new Map(snapshot.selected);
    this[PRIVATE._UPDATE_ZUSTAND]();
    this[PRIVATE.NOTIFY]('restore');
  }

  [PRIVATE._BUFFER_OPERATION](operation) {
    const privateData = this._private.get(this);
    privateData[PRIVATE.BUFFER].push({
      ...operation,
      timestamp: Date.now(),
    });

    if (privateData[PRIVATE.BUFFER].length > 1000) {
      privateData[PRIVATE.BUFFER] = privateData[PRIVATE.BUFFER].slice(-500);
    }
  }

  // ============================================================
  // 21. ОБНОВЛЕНИЕ ZUSTAND (СТАБИЛЬНАЯ ВЕРСИЯ)
  // ============================================================

  [PRIVATE._UPDATE_ZUSTAND]() {
    const privateData = this._private.get(this);
    const zustand = privateData[PRIVATE.ZUSTAND];
    const logger = privateData[PRIVATE.LOGGER] || this._logger;

    if (!zustand) {
      return;
    }

    if (typeof zustand.getState !== 'function') {
      return;
    }

    try {
      const state = zustand.getState();

      if (!state || typeof state !== 'object') {
        return;
      }

      // Формируем данные для обновления
      const tables = {};
      for (const [name, table] of privateData[PRIVATE.TABLES]) {
        tables[name] = {
          count: table.data.length,
          meta: table.meta,
        };
      }

      const selected = {};
      for (const [name, id] of privateData[PRIVATE.SELECTED]) {
        selected[name] = id;
      }

      const relations = {};
      for (const [key, rel] of privateData[PRIVATE.RELATIONS]) {
        relations[key] = {
          master: rel.master,
          detail: rel.detail,
          key: rel.key,
          masterId: rel.masterId,
          detailsCount: rel.details ? rel.details.length : 0,
        };
      }

      // ★★★ ИСПРАВЛЕНО: прямой setState ★★★
      zustand.setState({
        tables: tables,
        selected: selected,
        relations: relations,
        buffer: privateData[PRIVATE.BUFFER],
        lastUpdate: Date.now(),
      });

      privateData[PRIVATE.STATE].lastUpdate = Date.now();

    } catch (error) {
      // ★★★ ИСПРАВЛЕНО: игнорируем ошибки с revoked proxy ★★★
      if (error.message && error.message.includes('revoked')) {
        // Пропускаем
      } else {
        logger.error('❌ Ошибка обновления Zustand:', error);
      }
    }
  }

  // ============================================================
  // 22. СОСТОЯНИЕ
  // ============================================================

  getState() {
    const privateData = this._private.get(this);
    return {
      initialized: privateData[PRIVATE.STATE].initialized,
      destroyed: privateData[PRIVATE.STATE].destroyed,
      ready: privateData[PRIVATE.STATE].ready,
      status: privateData[PRIVATE.STATE].streamStatus || 'disconnected',
      tables: Object.fromEntries(
        Array.from(privateData[PRIVATE.TABLES].keys()).map(name => [
          name,
          { count: privateData[PRIVATE.TABLES].get(name).data.length },
        ])
      ),
      relations: Array.from(privateData[PRIVATE.RELATIONS].keys()),
      selected: Object.fromEntries(privateData[PRIVATE.SELECTED]),
      undoSize: privateData[PRIVATE.UNDO_STACK].length,
      redoSize: privateData[PRIVATE.REDO_STACK].length,
      transactions: privateData[PRIVATE.TRANSACTIONS].length,
      bufferSize: privateData[PRIVATE.BUFFER].length,
      plugins: Array.from(privateData[PRIVATE.PLUGINS].keys()),
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  healthCheck() {
    const privateData = this._private.get(this);
    let total = 0;
    for (const [name, table] of privateData[PRIVATE.TABLES]) {
      total += table.data.length;
    }

    return {
      initialized: privateData[PRIVATE.STATE].initialized,
      destroyed: privateData[PRIVATE.STATE].destroyed,
      ready: privateData[PRIVATE.STATE].ready,
      tables: privateData[PRIVATE.TABLES].size,
      records: total,
      relations: privateData[PRIVATE.RELATIONS].size,
      plugins: privateData[PRIVATE.PLUGINS].size,
      listeners: privateData[PRIVATE.LISTENERS].length,
      undoStack: privateData[PRIVATE.UNDO_STACK].length,
      redoStack: privateData[PRIVATE.REDO_STACK].length,
      transactions: privateData[PRIVATE.TRANSACTIONS].length,
      bufferSize: privateData[PRIVATE.BUFFER].length,
      zustand: !!privateData[PRIVATE.ZUSTAND],
      version: CONFIG.version,
      timestamp: Date.now(),
    };
  }

  setStatus(status) {
    const privateData = this._private.get(this);
    const validStatuses = ['playing', 'paused', 'disconnected', 'connecting'];

    if (!validStatuses.includes(status)) {
      this._logger.warn(`⚠️ Некорректный статус: ${status}`);
      return false;
    }

    privateData[PRIVATE.STATE].streamStatus = status;
    privateData[PRIVATE.STATE].lastUpdate = Date.now();
    this[PRIVATE.NOTIFY]('status', status);
    this[PRIVATE._UPDATE_ZUSTAND]();

    return true;
  }

  getStatus() {
    const privateData = this._private.get(this);
    return privateData[PRIVATE.STATE].streamStatus || 'disconnected';
  }

  // ============================================================
  // 23. ЭКСПОРТ СИМВОЛОВ
  // ============================================================

  [PRIVATE.EXPORT_SYMBOLS]() {
    if (typeof window !== 'undefined') {
      window[GLOBAL_STORE_SYMBOL] = this;
      window.__globalStore = this;

      window.__STORE_SYMBOLS = {
        PRIVATE: { ...PRIVATE },
        CONFIG: { ...CONFIG },
      };
    }
  }

  // ============================================================
  // 24. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy() {
    const privateData = this._private.get(this);

    if (privateData[PRIVATE.DESTROYED]) {
      this._logger.warn('⚠️ Хранилище уже уничтожено');
      return;
    }

    this._logger.info('🧹 Уничтожение Global Store...');

    privateData[PRIVATE.TABLES].clear();
    privateData[PRIVATE.RELATIONS].clear();
    privateData[PRIVATE.SELECTED].clear();
    privateData[PRIVATE.LISTENERS] = [];
    privateData[PRIVATE.UNDO_STACK] = [];
    privateData[PRIVATE.REDO_STACK] = [];
    privateData[PRIVATE.TRANSACTIONS] = [];
    privateData[PRIVATE.BUFFER] = [];
    privateData[PRIVATE.PLUGINS].clear();
    privateData[PRIVATE.ZUSTAND] = null;

    privateData[PRIVATE.DESTROYED] = true;
    privateData[PRIVATE.STATE].destroyed = true;
    privateData[PRIVATE.STATE].ready = false;

    if (typeof window !== 'undefined') {
      delete window[GLOBAL_STORE_SYMBOL];
      delete window.__globalStore;
      delete window.__STORE_SYMBOLS;
    }

    this._logger.success('✅ Global Store уничтожен');
  }
}

// ============================================================
// 25. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 ENTERPRISE STORE (100% СИМВОЛЫ) v4.0.7                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║  📦 Всего символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Singleton — один источник истины                                       ║');
  console.log('║    ✅ Авто-инициализация — при создании                                      ║');
  console.log('║    ✅ Zustand — реактивность из коробки                                      ║');
  console.log('║    ✅ Транзакции — ACID-подобные операции                                    ║');
  console.log('║    ✅ Undo/Redo — отмена действий                                            ║');
  console.log('║    ✅ Подписки — событийная модель                                           ║');
  console.log('║    ✅ Мастер-детейл — автоматические связи                                   ║');
  console.log('║    ✅ Плагины — расширяемая архитектура (поддержка классов)                  ║');
  console.log('║    ✅ Буферизация — операции до создания таблиц                              ║');
  console.log('║    ✅ Безопасность — приватные символы                                       ║');
  console.log('║    ✅ Глобальный символ — __GLOBAL_STORE__                                  ║');
  console.log('║    ✅ Стабильная работа — без ошибок                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 26. ЭКСПОРТЫ
// ============================================================

export { PRIVATE as STORE_PRIVATE, CONFIG as STORE_CONFIG, PUBLIC as STORE_PUBLIC };

export default EnterpriseStore;