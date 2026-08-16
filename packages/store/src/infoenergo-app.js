// ============================================================
// infoenergo-app.js — 100% СИМВОЛЫ — ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ
// Версия: 5.3.20 (ИСПРАВЛЕНА ДУБЛИРУЮЩАЯ ЗАГРУЗКА ДАННЫХ)
// ============================================================

// ============================================================
// 1. ★★★ ГЛОБАЛЬНЫЙ ФЛАГ ОТКЛЮЧЕНИЯ СТАРОГО РЕНДЕРИНГА ★★★
// ============================================================

const DISABLE_LEGACY_RENDER = true;

// ============================================================
// 2. ★★★ ГЛОБАЛЬНЫЕ ФЛАГИ ДЛЯ ПРЕДОТВРАЩЕНИЯ ДУБЛИРОВАНИЯ ★★★
// ============================================================

let APP_INITIALIZED = false;
let DATA_LOADING = false;
let SUBSCRIPTIONS_INITIALIZED = false;

// ============================================================
// 3. ★★★ ИМПОРТ ГЛОБАЛЬНОГО ХРАНИЛИЩА ★★★
// ============================================================

import {
  db,
  getStore,
  getGlobalStoreInstance,
  GLOBAL_STORE_SYMBOL,
  createStore,
  DEFAULT_PLUGINS,
  EnterpriseStore,
  PluginManager,
  // Плагины
  PersistencePlugin,
  ValidationPlugin,
  IndexPlugin,
  PaginationPlugin,
  AuditPlugin,
  BrokerPlugin,
  QuotaPlugin,
  CachePlugin,
  EncryptionPlugin,
  // Экспорт символов
  STORE_PRIVATE,
  STORE_PUBLIC,
  STORE_CONFIG,
} from './index.js';

// ============================================================
// 4. ★★★ ИМПОРТ SYNC MANAGER ★★★
// ============================================================

import { SyncManager } from './sync-manager.js';

// ============================================================
// 5. ИМПОРТЫ VUE И КОМПОНЕНТОВ
// ============================================================

import {
  createApp,
  ref,
  defineComponent,
  onMounted,
  onUnmounted,
  nextTick,
  computed,
  watch,
} from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NButton,
  NTag,
  NFlex,
  NInput,
  NSelect,
  NPopconfirm,
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NDivider,
  NSpin,
  NAlert,
} from 'naive-ui';

import { AiDataTable, initGlobalSettings, AiAppProviders } from '@infoenergo/infoenergo-ui';

// ============================================================
// 6. ИМПОРТ ЛОГГЕРА
// ============================================================

import {
  getGlobalLogger,
  logInfo,
  logError,
  logSuccess,
  logWarn,
  logSystem,
  logDebug,
} from './logger.mjs';

// ============================================================
// 7. ИМПОРТ СИМВОЛОВ (100% изоляция)
// ============================================================

import { PRIVATE, PUBLIC } from './app/symbols.js';

// ============================================================
// 8. ★★★ ИМПОРТ РЕНДЕРЕРОВ (ОТКЛЮЧЕН) ★★★
// ============================================================

// ★★★ РЕНДЕРЕРЫ ОТКЛЮЧЕНЫ — ИСПОЛЬЗУЕТСЯ VUE ★★★

// ============================================================
// 9. ★★★ УНИВЕРСАЛЬНАЯ ФУНКЦИЯ РЕНДЕРИНГА (ОТКЛЮЧЕНА) ★★★
// ============================================================

function renderUI(message = 'Обновление UI', delay = 100) {
  if (DISABLE_LEGACY_RENDER) {
    logDebug(`⏳ UI обновление: ${message} (ОТКЛЮЧЕНО — используется Vue)`, null, 'app');
    return true;
  }
  return true;
}

function renderUIImmediate(message = 'Немедленное обновление UI') {
  if (DISABLE_LEGACY_RENDER) {
    logDebug(`🔄 ${message} (ОТКЛЮЧЕНО — используется Vue)`, null, 'app');
    return true;
  }
  return true;
}

// ============================================================
// 10. ★★★ ИМПОРТ ГЕНЕРАТОРА ID ★★★
// ============================================================

import {
  generateId,
  generateEventId,
  generateOperationId,
  generateTableId,
  generateRequestId,
  generateComponentId,
  generateActionId,
  generateViewId,
  getIdHistory,
  getGeneratorState,
  clearIdHistory,
  getLastIdByPrefix,
  getIdsByPrefix,
  getIdInfo,
  getPrefixStats,
  getContextStats,
  getFullStats,
  resetStats,
  resetGenerator,
  exportSymbols as exportIdSymbols,
  setIdDebug,
  setIdSilent,
  isIdDebug,
  isIdSilent,
} from './id-generator.mjs';

// ★★★ ОТКЛЮЧАЕМ ЛОГИ ID ГЕНЕРАТОРА ★★★
setIdSilent(true);
setIdDebug(false);

// ★★★ ДЛЯ УДОБСТВА ★★★
const ID = {
  generate: generateId,
  event: generateEventId,
  op: generateOperationId,
  table: generateTableId,
  req: generateRequestId,
  component: generateComponentId,
  action: generateActionId,
  view: generateViewId,
  history: getIdHistory,
  state: getGeneratorState,
  fullStats: getFullStats,
  clear: clearIdHistory,
  last: getLastIdByPrefix,
  ids: getIdsByPrefix,
  info: getIdInfo,
  prefixStats: getPrefixStats,
  contextStats: getContextStats,
  resetStats: resetStats,
  reset: resetGenerator,
  setDebug: setIdDebug,
  setSilent: setIdSilent,
  isDebug: isIdDebug,
  isSilent: isIdSilent,
};

// ============================================================
// 11. ★★★ ГЛОБАЛЬНОЕ ОТКЛЮЧЕНИЕ АВТОСОХРАНЕНИЯ ★★★
// ============================================================

const DISABLE_AUTO_SAVE = true;

// ============================================================
// 12. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE_APP = {
  // Основные символы
  VERSION: Symbol('app.version'),
  BUILD: Symbol('app.build'),
  NAME: Symbol('app.name'),
  CONFIG: Symbol('app.config'),
  STATE: Symbol('app.state'),
  INITIALIZED: Symbol('app.initialized'),
  DESTROYED: Symbol('app.destroyed'),
  START_TIME: Symbol('app.startTime'),
  LAST_UPDATE: Symbol('app.lastUpdate'),

  // Данные
  PROJECTS: Symbol('app.projects'),
  TASKS: Symbol('app.tasks'),
  USERS: Symbol('app.users'),
  SELECTED_PROJECT: Symbol('app.selectedProject'),
  SELECTED_TASK: Symbol('app.selectedTask'),
  SELECTED_USER: Symbol('app.selectedUser'),
  LOADING: Symbol('app.loading'),
  ERROR: Symbol('app.error'),
  FILTERS: Symbol('app.filters'),
  FILTERS_CHANGED: Symbol('app.filtersChanged'),
  FILTER_SUBSCRIBERS: Symbol('app.filterSubscribers'),
  SUBSCRIPTIONS: Symbol('app.subscriptions'),

  // API
  API_BASE: Symbol('app.apiBase'),
  API_ENDPOINTS: Symbol('app.apiEndpoints'),

  // Логгер и ID
  LOGGER: Symbol('app.logger'),
  ID_GENERATOR: Symbol('app.idGenerator'),

  // Глобальное хранилище
  REFRESH_TABLE: Symbol('app.refreshTable'),
  GLOBAL_STORE: Symbol('app.globalStore'),
  GLOBAL_STORE_READY: Symbol('app.globalStoreReady'),
  STORE_SUBSCRIPTIONS: Symbol('app.storeSubscriptions'),
  STORE_INSTANCE: Symbol('app.storeInstance'),
  DATA_SYNCED: Symbol('app.dataSynced'),
  SYNC_TIMESTAMP: Symbol('app.syncTimestamp'),

  // Sync Manager
  SYNC_MANAGER: Symbol('app.syncManager'),
  SYNC_MANAGER_READY: Symbol('app.syncManagerReady'),

  // Master-Detail
  MASTER_DETAIL_DATA: Symbol('app.masterDetailData'),
  DATA_LOAD_IN_PROGRESS: Symbol('app.dataLoadInProgress'),

  // ★★★ РЕНДЕРИНГ (ОТКЛЮЧЕН) ★★★
  RENDER_QUEUE: Symbol('app.renderQueue'),
  RENDER_TIMER: Symbol('app.renderTimer'),
  IS_RENDERING: Symbol('app.isRendering'),
  RENDER_READY: Symbol('app.renderReady'),

  // Таблицы
  TABLE_INSTANCES: Symbol('app.tableInstances'),
  TABLE_SUBSCRIPTIONS: Symbol('app.tableSubscriptions'),
  TABLE_LOADING_STATE: Symbol('app.tableLoadingState'),
  TABLE_DATA_CHECK: Symbol('app.tableDataCheck'),
};

// ============================================================
// 13. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC_APP = {
  INSTANCE: Symbol.for('app.instance'),
  STATE: Symbol.for('app.state'),
  CONFIG: Symbol.for('app.config'),
  INIT: Symbol.for('app.init'),
  DESTROY: Symbol.for('app.destroy'),
  GET_STATE: Symbol.for('app.getState'),
  GET_PROJECTS: Symbol.for('app.getProjects'),
  GET_TASKS: Symbol.for('app.getTasks'),
  GET_USERS: Symbol.for('app.getUsers'),
  SELECT_PROJECT: Symbol.for('app.selectProject'),
  SELECT_TASK: Symbol.for('app.selectTask'),
  SELECT_USER: Symbol.for('app.selectUser'),
  REFRESH_DATA: Symbol.for('app.refreshData'),
  SET_FILTERS: Symbol.for('app.setFilters'),
  CLEAR_FILTERS: Symbol.for('app.clearFilters'),
  GET_FILTERS: Symbol.for('app.getFilters'),
  ID_GENERATOR: Symbol.for('app.idGenerator'),
  REFRESH_TABLE: Symbol.for('app.refreshTable'),
  GET_GLOBAL_STORE: Symbol.for('app.getGlobalStore'),
  SYNC_DATA: Symbol.for('app.syncData'),
  SYNC_MANAGER: Symbol.for('app.syncManager'),
  GET_SYNC_STATE: Symbol.for('app.getSyncState'),
  RENDER_UI: Symbol.for('app.renderUI'),
  GET_TABLE_INSTANCES: Symbol.for('app.getTableInstances'),
};

// ============================================================
// 14. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '5.3.20',
  build: '2026-07-31',
  name: 'Infoenergo App',
  debug: true,
  apiBase: 'http://localhost:5231',
  endpoints: {
    projects: 'projects',
    tasks: 'tasks',
    users: 'users',
    virtualScroll: '/api/table/virtual/data/get',
    userSettingsGet: '/user-settings/get',
    userSettingsSet: '/user-settings/set',
  },
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  syncManager: {
    autoSync: true,
    interval: 30000,
  },
  render: {
    debounceDelay: 100,
    forceRender: true,
  },
};

// ============================================================
// 15. ИНИЦИАЛИЗАЦИЯ ЛОГГЕРА
// ============================================================

const logger = getGlobalLogger();

// ============================================================
// 16. ★★★ ФУНКЦИЯ ПОИСКА RENDERALL (ОТКЛЮЧЕНА) ★★★
// ============================================================

function findRenderFunction() {
  // ★★★ ВСЕГДА ВОЗВРАЩАЕМ NULL — ИСПОЛЬЗУЕТСЯ VUE ★★★
  return null;
}

// ============================================================
// 17. ★★★ ПОЛУЧЕНИЕ ГЛОБАЛЬНОГО ХРАНИЛИЩА ★★★
// ============================================================

function getGlobalStore() {
  const opId = ID.op('get_global_store');

  try {
    const store = getGlobalStoreInstance();
    if (store) {
      logInfo(
        `✅ getGlobalStoreInstance() вернул хранилище`,
        { opId, type: typeof store },
        'system'
      );
      return store;
    }
  } catch (error) {
    logWarn(`⚠️ getGlobalStoreInstance() ошибка: ${error.message}`, { opId, error }, 'system');
  }

  if (typeof window !== 'undefined' && window.__GLOBAL_STORE__) {
    logInfo(`✅ window.__GLOBAL_STORE__ найден`, { opId }, 'system');
    return window.__GLOBAL_STORE__;
  }

  if (typeof window !== 'undefined' && window[GLOBAL_STORE_SYMBOL]) {
    logInfo(`✅ window[GLOBAL_STORE_SYMBOL] найден`, { opId }, 'system');
    return window[GLOBAL_STORE_SYMBOL];
  }

  if (db) {
    logInfo(`✅ импортированный db найден`, { opId }, 'system');
    return db;
  }

  logWarn(`⚠️ Глобальное хранилище не найдено, создаем новое...`, { opId }, 'system');

  try {
    const newStore = createStore({
      plugins: DEFAULT_PLUGINS,
      debug: true,
      immerEnabled: true,
      autoInit: true,
    });

    if (newStore && typeof window !== 'undefined') {
      window.__GLOBAL_STORE__ = newStore;
      window[GLOBAL_STORE_SYMBOL] = newStore;
      window.__globalStore = newStore;
      window.__db = newStore;

      logSuccess(`✅ Новое глобальное хранилище создано и зарегистрировано`, { opId }, 'system');

      const methods = Object.getOwnPropertyNames(newStore).filter(
        (m) => typeof newStore[m] === 'function'
      );
      logInfo(`📋 Методы хранилища: ${methods.join(', ')}`, { opId }, 'system');
    }

    return newStore;
  } catch (error) {
    logError(`❌ Не удалось создать хранилище: ${error.message}`, { opId, error }, 'system');
    return null;
  }
}

// ★★★ ПОЛУЧАЕМ ХРАНИЛИЩЕ ★★★
const globalStore = getGlobalStore();

if (globalStore) {
  console.log('✅ __GLOBAL_STORE__ успешно получен');
  console.log(`📊 Тип: ${typeof globalStore}`);
  console.log(
    `📋 Методы: ${Object.getOwnPropertyNames(globalStore)
      .filter((m) => typeof globalStore[m] === 'function')
      .join(', ')}`
  );
} else {
  console.error('❌ Не удалось получить __GLOBAL_STORE__');
}

// ============================================================
// 18. ★★★ РЕГИСТРАЦИЯ В ГЛОБАЛЬНОМ ОБЪЕКТЕ ★★★
// ============================================================

if (typeof window !== 'undefined' && globalStore) {
  window.__GLOBAL_STORE__ = globalStore;
  window[GLOBAL_STORE_SYMBOL] = globalStore;
  window.__globalStore = globalStore;
  window.__db = globalStore;
  window.getGlobalStore = getGlobalStore;
  window.__getGlobalStore = getGlobalStore;

  console.log('✅ __GLOBAL_STORE__ зарегистрирован в window');
  console.log('📋 window.getGlobalStore() — получить хранилище');
}

// ============================================================
// 19. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (100% символы)
// ============================================================

const APP_STATE = {
  // Основные символы
  [PRIVATE_APP.VERSION]: CONFIG.version,
  [PRIVATE_APP.BUILD]: CONFIG.build,
  [PRIVATE_APP.NAME]: CONFIG.name,
  [PRIVATE_APP.CONFIG]: { ...CONFIG },
  [PRIVATE_APP.INITIALIZED]: false,
  [PRIVATE_APP.DESTROYED]: false,
  [PRIVATE_APP.START_TIME]: Date.now(),
  [PRIVATE_APP.LAST_UPDATE]: null,

  // Данные
  [PRIVATE_APP.PROJECTS]: [],
  [PRIVATE_APP.TASKS]: [],
  [PRIVATE_APP.USERS]: [],
  [PRIVATE_APP.SELECTED_PROJECT]: null,
  [PRIVATE_APP.SELECTED_TASK]: null,
  [PRIVATE_APP.SELECTED_USER]: null,
  [PRIVATE_APP.LOADING]: false,
  [PRIVATE_APP.ERROR]: null,

  // Фильтры
  [PRIVATE_APP.FILTERS]: {
    projects: {},
    tasks: {},
    users: {},
  },
  [PRIVATE_APP.FILTER_SUBSCRIBERS]: new Map(),
  [PRIVATE_APP.SUBSCRIPTIONS]: [],

  // API
  [PRIVATE_APP.API_BASE]: CONFIG.apiBase,
  [PRIVATE_APP.API_ENDPOINTS]: { ...CONFIG.endpoints },

  // Логгер и ID
  [PRIVATE_APP.LOGGER]: logger,
  [PRIVATE_APP.ID_GENERATOR]: ID,

  // Глобальное хранилище
  [PRIVATE_APP.GLOBAL_STORE]: globalStore,
  [PRIVATE_APP.GLOBAL_STORE_READY]: !!globalStore,
  [PRIVATE_APP.STORE_SUBSCRIPTIONS]: [],
  [PRIVATE_APP.STORE_INSTANCE]: globalStore,
  [PRIVATE_APP.DATA_SYNCED]: false,
  [PRIVATE_APP.SYNC_TIMESTAMP]: null,

  // Sync Manager
  [PRIVATE_APP.SYNC_MANAGER]: null,
  [PRIVATE_APP.SYNC_MANAGER_READY]: false,

  // Master-Detail
  [PRIVATE_APP.MASTER_DETAIL_DATA]: {
    projects: null,
    tasks: null,
    users: null,
  },
  [PRIVATE_APP.DATA_LOAD_IN_PROGRESS]: false,

  // ★★★ РЕНДЕРИНГ (ОТКЛЮЧЕН) ★★★
  [PRIVATE_APP.RENDER_QUEUE]: [],
  [PRIVATE_APP.RENDER_TIMER]: null,
  [PRIVATE_APP.IS_RENDERING]: false,
  [PRIVATE_APP.RENDER_READY]: false,

  // Таблицы
  [PRIVATE_APP.TABLE_INSTANCES]: {},
  [PRIVATE_APP.TABLE_SUBSCRIPTIONS]: {},
  [PRIVATE_APP.TABLE_LOADING_STATE]: {},
  [PRIVATE_APP.TABLE_DATA_CHECK]: {},
};

// ============================================================
// 20. ГЕТТЕРЫ И СЕТТЕРЫ
// ============================================================

function getAppState() {
  return APP_STATE;
}

function getPrivate(key) {
  return APP_STATE[key];
}

function setPrivate(key, value) {
  APP_STATE[key] = value;
  return value;
}

function getProjects() {
  return APP_STATE[PRIVATE_APP.PROJECTS];
}

function getTasks() {
  return APP_STATE[PRIVATE_APP.TASKS];
}

function getUsers() {
  return APP_STATE[PRIVATE_APP.USERS];
}

function getSelectedProject() {
  return APP_STATE[PRIVATE_APP.SELECTED_PROJECT];
}

function getSelectedTask() {
  return APP_STATE[PRIVATE_APP.SELECTED_TASK];
}

function getSelectedUser() {
  return APP_STATE[PRIVATE_APP.SELECTED_USER];
}

function getFilters(tableName) {
  return APP_STATE[PRIVATE_APP.FILTERS][tableName] || {};
}

function isLoading() {
  return APP_STATE[PRIVATE_APP.LOADING];
}

function getError() {
  return APP_STATE[PRIVATE_APP.ERROR];
}

function isGlobalStoreReady() {
  return APP_STATE[PRIVATE_APP.GLOBAL_STORE_READY];
}

function isDataSynced() {
  return APP_STATE[PRIVATE_APP.DATA_SYNCED];
}

function isSyncManagerReady() {
  return APP_STATE[PRIVATE_APP.SYNC_MANAGER_READY];
}

function getSyncManager() {
  return APP_STATE[PRIVATE_APP.SYNC_MANAGER];
}

function getMasterDetailData() {
  return APP_STATE[PRIVATE_APP.MASTER_DETAIL_DATA];
}

function getTableInstances() {
  return APP_STATE[PRIVATE_APP.TABLE_INSTANCES];
}

function getTableInstance(tableName) {
  return APP_STATE[PRIVATE_APP.TABLE_INSTANCES]?.[tableName] || null;
}

function getTableLoadingState(tableName) {
  return APP_STATE[PRIVATE_APP.TABLE_LOADING_STATE]?.[tableName] || false;
}

function setTableInstance(tableName, instance) {
  if (!APP_STATE[PRIVATE_APP.TABLE_INSTANCES]) {
    APP_STATE[PRIVATE_APP.TABLE_INSTANCES] = {};
  }
  APP_STATE[PRIVATE_APP.TABLE_INSTANCES][tableName] = instance;
  return instance;
}

function setTableLoadingState(tableName, loading) {
  if (!APP_STATE[PRIVATE_APP.TABLE_LOADING_STATE]) {
    APP_STATE[PRIVATE_APP.TABLE_LOADING_STATE] = {};
  }
  APP_STATE[PRIVATE_APP.TABLE_LOADING_STATE][tableName] = loading;
  return loading;
}

// ============================================================
// 21. ★★★ КЭШ НАСТРОЕК ★★★
// ============================================================

const SETTINGS_CACHE = {
  lastSaved: null,
  lastViewId: null,
  debounceTimer: null,
  isSaving: false,
  pendingChanges: null,
};

// ============================================================
// 22. ★★★ ФУНКЦИЯ СРАВНЕНИЯ НАСТРОЕК ★★★
// ============================================================

function hasSettingsChanged(oldSettings, newSettings) {
  if (!oldSettings) return true;
  if (!newSettings) return false;

  try {
    const oldStr = JSON.stringify(oldSettings);
    const newStr = JSON.stringify(newSettings);
    return oldStr !== newStr;
  } catch (error) {
    console.warn('⚠️ Ошибка сравнения настроек:', error);
    return true;
  }
}

// ============================================================
// 23. ★★★ ПРЯМЫЕ МЕТОДЫ ДЛЯ НАСТРОЕК ★★★
// ============================================================

async function getUserSettingsDirect(viewId) {
  const opId = ID.op('get_user_settings_direct');
  const state = getAppState();
  const baseUrl = state[PRIVATE_APP.API_BASE];

  logInfo(`📂 Загрузка настроек для ${viewId}`, { opId, viewId }, 'settings');

  try {
    const response = await fetch(`${baseUrl}/user-settings/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      logSuccess(`✅ Настройки загружены для ${viewId}`, { opId, viewId }, 'settings');
      return result;
    } else {
      logError(`❌ Ошибка загрузки настроек: ${result.error}`, { opId }, 'settings');
      return null;
    }
  } catch (error) {
    logError(`❌ Ошибка запроса настроек: ${error.message}`, { opId, error }, 'settings');
    return null;
  }
}

async function setUserSettingsDirect(viewId, settings) {
  if (DISABLE_AUTO_SAVE) {
    logInfo(`⏭️ Сохранение настроек заблокировано (глобальный флаг)`, { viewId }, 'settings');
    return { success: true, result: true, skipped: true };
  }

  const opId = ID.op('set_user_settings_direct');
  const state = getAppState();
  const baseUrl = state[PRIVATE_APP.API_BASE];

  logInfo(
    `💾 Сохранение настроек для ${viewId}`,
    {
      opId,
      viewId,
      settingsKeys: Object.keys(settings || {}),
    },
    'settings'
  );

  try {
    const response = await fetch(`${baseUrl}/user-settings/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewId, settings }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      logSuccess(`✅ Настройки сохранены для ${viewId}`, { opId, viewId }, 'settings');
      return result;
    } else {
      logError(`❌ Ошибка сохранения настроек: ${result.error}`, { opId }, 'settings');
      return null;
    }
  } catch (error) {
    logError(`❌ Ошибка запроса сохранения: ${error.message}`, { opId, error }, 'settings');
    return null;
  }
}

// ============================================================
// 24. ★★★ МЕНЕДЖЕР ДАННЫХ (ИСПРАВЛЕН) ★★★
// ============================================================

const DataManager = {
  [PRIVATE_APP.LOAD_ALL_DATA]: async function () {
    const opId = ID.op('load_all_data');
    const state = getAppState();

    // ★★★ ЗАЩИТА ОТ ПОВТОРНОЙ ЗАГРУЗКИ ★★★
    if (DATA_LOADING) {
      logInfo(`⏳ Загрузка данных уже выполняется`, { opId }, 'app');
      return false;
    }

    if (state[PRIVATE_APP.DATA_LOAD_IN_PROGRESS]) {
      logInfo(`⏳ Загрузка данных уже выполняется (флаг)`, { opId }, 'app');
      return false;
    }

    if (state[PRIVATE_APP.DATA_SYNCED] && state[PRIVATE_APP.PROJECTS].length > 0) {
      logInfo(
        `✅ Данные уже загружены (${state[PRIVATE_APP.PROJECTS].length} проектов)`,
        { opId },
        'app'
      );
      return true;
    }

    DATA_LOADING = true;
    setPrivate(PRIVATE_APP.DATA_LOAD_IN_PROGRESS, true);
    setPrivate(PRIVATE_APP.LOADING, true);
    setPrivate(PRIVATE_APP.ERROR, null);

    logInfo(`📦 Загрузка всех данных...`, { opId }, 'app');

    try {
      const store = getGlobalStore();
      if (!store) {
        throw new Error('__GLOBAL_STORE__ не доступен');
      }

      logInfo(`✅ Хранилище получено, загружаем данные...`, { opId }, 'app');

      let projects = [];
      let tasks = [];
      let users = [];

      // ★★★ ПРОВЕРЯЕМ, ЕСТЬ ЛИ УЖЕ ДАННЫЕ В ХРАНИЛИЩЕ ★★★
      const existingProjects = store.getTable?.('projects');
      const existingTasks = store.getTable?.('tasks');
      const existingUsers = store.getTable?.('users');

      if (
        existingProjects?.data?.length > 0 &&
        existingTasks?.data?.length > 0 &&
        existingUsers?.data?.length > 0
      ) {
        logInfo(
          `✅ Данные уже есть в хранилище: ${existingProjects.data.length} проектов, ${existingTasks.data.length} задач, ${existingUsers.data.length} пользователей`,
          { opId },
          'app'
        );

        state[PRIVATE_APP.PROJECTS] = existingProjects.data;
        state[PRIVATE_APP.TASKS] = existingTasks.data;
        state[PRIVATE_APP.USERS] = existingUsers.data;
        state[PRIVATE_APP.LAST_UPDATE] = Date.now();
        state[PRIVATE_APP.DATA_SYNCED] = true;
        state[PRIVATE_APP.SYNC_TIMESTAMP] = Date.now();

        return true;
      }

      try {
        logInfo(`📊 Загрузка проектов через API`, { opId }, 'app');
        const projectsResponse = await tableApi.data('projects');
        if (projectsResponse?.success && projectsResponse?.data) {
          projects = projectsResponse.data;
          logInfo(`📥 Получено ${projects.length} проектов с бэкенда`, { opId }, 'app');
        }

        logInfo(`📊 Загрузка задач через API`, { opId }, 'app');
        const tasksResponse = await tableApi.data('tasks');
        if (tasksResponse?.success && tasksResponse?.data) {
          tasks = tasksResponse.data;
          logInfo(`📥 Получено ${tasks.length} задач с бэкенда`, { opId }, 'app');
        }

        logInfo(`📊 Загрузка пользователей через API`, { opId }, 'app');
        const usersResponse = await tableApi.data('users');
        if (usersResponse?.success && usersResponse?.data) {
          users = usersResponse.data;
          logInfo(`📥 Получено ${users.length} пользователей с бэкенда`, { opId }, 'app');
        }
      } catch (e) {
        logWarn(`⚠️ Ошибка получения данных с бэкенда: ${e.message}`, { opId, error: e }, 'app');
        projects = [];
        tasks = [];
        users = [];
      }

      const hasData = projects.length > 0 || tasks.length > 0 || users.length > 0;

      if (hasData) {
        logInfo(`📦 Синхронизация данных с __GLOBAL_STORE__...`, { opId }, 'app');

        if (!store.getTable?.('projects')) {
          store.createTable?.('projects');
          logInfo(`📊 Таблица projects создана`, { opId }, 'app');
        }
        if (!store.getTable?.('tasks')) {
          store.createTable?.('tasks');
          logInfo(`📊 Таблица tasks создана`, { opId }, 'app');
        }
        if (!store.getTable?.('users')) {
          store.createTable?.('users');
          logInfo(`📊 Таблица users создана`, { opId }, 'app');
        }

        if (store.clearTable) {
          store.clearTable('projects');
          store.clearTable('tasks');
          store.clearTable('users');
          logInfo(`🧹 Старые данные очищены`, { opId }, 'app');
        }

        if (projects.length > 0 && store.insert) {
          store.insert('projects', projects);
          logInfo(`📥 Записано ${projects.length} проектов в __GLOBAL_STORE__`, { opId }, 'app');
        }

        if (tasks.length > 0 && store.insert) {
          store.insert('tasks', tasks);
          logInfo(`📥 Записано ${tasks.length} задач в __GLOBAL_STORE__`, { opId }, 'app');
        }

        if (users.length > 0 && store.insert) {
          store.insert('users', users);
          logInfo(`📥 Записано ${users.length} пользователей в __GLOBAL_STORE__`, { opId }, 'app');
        }

        try {
          if (store.link) {
            store.link('projects', 'tasks', 'projectId');
            logInfo(`🔗 Связь projects → tasks создана (ключ: projectId)`, { opId }, 'app');

            store.link('tasks', 'users', 'assigneeId');
            logInfo(`🔗 Связь tasks → users создана (ключ: assigneeId)`, { opId }, 'app');
          }
        } catch (error) {
          logWarn(`⚠️ Ошибка создания связей: ${error.message}`, { opId, error }, 'app');
        }

        if (typeof store.publish === 'function') {
          store.publish('data:loaded', {
            projects: projects.length,
            tasks: tasks.length,
            users: users.length,
            timestamp: Date.now(),
          });
          logInfo(`📨 Событие data:loaded опубликовано`, { opId }, 'app');

          store.publish('data:updated', {
            table: 'projects',
            action: 'sync',
            count: projects.length,
            timestamp: Date.now(),
          });
          store.publish('data:updated', {
            table: 'tasks',
            action: 'sync',
            count: tasks.length,
            timestamp: Date.now(),
          });
          store.publish('data:updated', {
            table: 'users',
            action: 'sync',
            count: users.length,
            timestamp: Date.now(),
          });
          logInfo(`📨 События data:updated опубликованы`, { opId }, 'app');
        }

        state[PRIVATE_APP.PROJECTS] = projects;
        state[PRIVATE_APP.TASKS] = tasks;
        state[PRIVATE_APP.USERS] = users;
        state[PRIVATE_APP.LAST_UPDATE] = Date.now();
        state[PRIVATE_APP.DATA_SYNCED] = true;
        state[PRIVATE_APP.SYNC_TIMESTAMP] = Date.now();

        logSuccess(
          `✅ Данные синхронизированы: ${projects.length} проектов, ${tasks.length} задач, ${users.length} пользователей`,
          {
            opId,
            projects: projects.length,
            tasks: tasks.length,
            users: users.length,
          },
          'app'
        );

        return true;
      } else {
        logWarn(`⚠️ Нет данных для синхронизации`, { opId }, 'app');
        state[PRIVATE_APP.DATA_SYNCED] = false;
        return false;
      }
    } catch (error) {
      setPrivate(PRIVATE_APP.ERROR, error.message);
      logError(
        `❌ Ошибка загрузки данных: ${error.message}`,
        { opId, error: error.message, stack: error.stack },
        'app'
      );
      return false;
    } finally {
      setPrivate(PRIVATE_APP.LOADING, false);
      setPrivate(PRIVATE_APP.DATA_LOAD_IN_PROGRESS, false);
      DATA_LOADING = false;
    }
  },

  [PRIVATE_APP.REFRESH_TABLE]: async function (tableName, options = {}) {
    const { silent = false, viewId = null } = options;
    const opId = ID.op(`refresh_table_${tableName}`);

    if (!silent) {
      logInfo(`🔄 Обновление таблицы: ${tableName}`, { opId, tableName }, 'app');
    }

    const state = getAppState();
    const stateKey = {
      projects: PRIVATE_APP.PROJECTS,
      tasks: PRIVATE_APP.TASKS,
      users: PRIVATE_APP.USERS,
    }[tableName];

    if (!stateKey) {
      logError(`❌ Неизвестная таблица: ${tableName}`, { opId, tableName }, 'app');
      return false;
    }

    setPrivate(PRIVATE_APP.LOADING, true);

    try {
      const store = getGlobalStore();
      if (!store) {
        throw new Error('__GLOBAL_STORE__ не доступен');
      }

      let data = [];

      try {
        logInfo(`📊 Загрузка ${tableName} через API`, { opId, tableName }, 'app');
        const response = await tableApi.data(tableName);
        if (response?.success && response?.data) {
          data = response.data;
          logInfo(`📥 Получено ${data.length} записей ${tableName} с бэкенда`, { opId }, 'app');
        }
      } catch (e) {
        logWarn(`⚠️ Ошибка получения данных ${tableName}: ${e.message}`, { opId, error: e }, 'app');
        data = [];
      }

      if (data.length > 0) {
        if (!store.getTable?.(tableName)) {
          store.createTable?.(tableName);
          logInfo(`📊 Таблица ${tableName} создана`, { opId }, 'app');
        }

        if (store.clearTable) {
          store.clearTable(tableName);
        }

        if (store.insert) {
          store.insert(tableName, data);
          logInfo(
            `📥 Записано ${data.length} записей ${tableName} в __GLOBAL_STORE__`,
            { opId },
            'app'
          );
        }

        if (typeof store.publish === 'function') {
          store.publish('data:updated', {
            table: tableName,
            action: 'refresh',
            count: data.length,
            viewId: viewId,
            timestamp: Date.now(),
          });
          if (!silent) {
            logInfo(`📨 Событие data:updated для ${tableName} опубликовано`, { opId }, 'app');
          }
        }

        state[stateKey] = data;
        state[PRIVATE_APP.LAST_UPDATE] = Date.now();

        if (!silent) {
          logSuccess(
            `✅ Данные ${tableName} обновлены: ${data.length} записей`,
            {
              opId,
              tableName,
              count: data.length,
            },
            'app'
          );
        }

        return true;
      } else {
        if (store.clearTable) {
          store.clearTable(tableName);
        }
        state[stateKey] = [];
        logWarn(`⚠️ Нет данных для ${tableName}`, { opId, tableName }, 'app');
        return false;
      }
    } catch (error) {
      if (!silent) {
        logError(
          `❌ Ошибка обновления ${tableName}: ${error.message}`,
          { opId, tableName, error: error.message },
          'app'
        );
      }
      return false;
    } finally {
      setPrivate(PRIVATE_APP.LOADING, false);
    }
  },

  // ★★★ ВЫБОР ПРОЕКТА — ИСПРАВЛЕН (УБРАН ДУБЛИРУЮЩИЙ FILTERSManager.SET) ★★★
  selectProject(project) {
    const state = getAppState();
    const opId = ID.op('select_project');

    logInfo(
      `🎯 Выбор проекта: ${project?.name || 'none'}`,
      { opId, projectId: project?.id, projectName: project?.name },
      'app'
    );

    state[PRIVATE_APP.SELECTED_PROJECT] = project;

    if (project) {
      const store = getGlobalStore();
      if (store && typeof store.selectMaster === 'function') {
        try {
          store.selectMaster('projects', project.id);
          logInfo(`🎯 Мастер выбран: projects[${project.id}]`, { opId }, 'app');

          if (typeof store.getDetails === 'function') {
            const details = store.getDetails('projects');
            logDebug(
              `📊 Детали получены через getDetails`,
              {
                master: 'projects',
                details: Object.keys(details || {}),
              },
              'app'
            );

            // ★★★ ОБНОВЛЯЕМ ЗАДАЧИ ★★★
            if (details && details.tasks) {
              state[PRIVATE_APP.TASKS] = details.tasks;
              state[PRIVATE_APP.LAST_UPDATE] = Date.now();

              // ★★★ ПУБЛИКУЕМ СОБЫТИЕ ДЛЯ ТАБЛИЦЫ ЗАДАЧ ★★★
              if (store && typeof store.publish === 'function') {
                store.publish(`data:updated:tasks`, {
                  table: 'tasks',
                  count: details.tasks.length,
                  action: 'master-detail',
                  projectId: project.id,
                  timestamp: Date.now(),
                });
                logInfo(
                  `📨 Опубликовано data:updated:tasks (${details.tasks.length})`,
                  { opId, count: details.tasks.length },
                  'events'
                );
              }

              logInfo(
                `📊 Обновлено ${details.tasks.length} задач через Master-Detail`,
                {
                  opId,
                  count: details.tasks.length,
                },
                'app'
              );

              state[PRIVATE_APP.MASTER_DETAIL_DATA].projects = {
                id: project.id,
                name: project.name,
                tasks: details.tasks,
              };
            }

            // ★★★ ОБНОВЛЯЕМ ПОЛЬЗОВАТЕЛЕЙ (если есть) ★★★
            if (details && details.users) {
              state[PRIVATE_APP.USERS] = details.users;
              state[PRIVATE_APP.LAST_UPDATE] = Date.now();

              if (store && typeof store.publish === 'function') {
                store.publish(`data:updated:users`, {
                  table: 'users',
                  count: details.users.length,
                  action: 'master-detail',
                  projectId: project.id,
                  timestamp: Date.now(),
                });
                logInfo(
                  `📨 Опубликовано data:updated:users (${details.users.length})`,
                  { opId, count: details.users.length },
                  'events'
                );
              }

              logInfo(
                `📊 Обновлено ${details.users.length} пользователей через Master-Detail`,
                {
                  opId,
                  count: details.users.length,
                },
                'app'
              );

              state[PRIVATE_APP.MASTER_DETAIL_DATA].projects = {
                ...state[PRIVATE_APP.MASTER_DETAIL_DATA].projects,
                users: details.users,
              };
            }
          } else {
            logDebug('⚠️ getDetails не доступен, используем SyncManager', { opId }, 'app');
            if (isSyncManagerReady()) {
              const syncManager = getSyncManager();
              if (syncManager && typeof syncManager.syncAll === 'function') {
                syncManager.syncAll();
              }
            }
          }

          // ★★★ ★★★ ★★★ ТОЛЬКО ОДИН РАЗ ★★★ ★★★ ★★★
          FiltersManager.set('tasks', { projectId: project.id });
          logInfo(
            `🔍 Фильтр задач установлен: projectId=${project.id}`,
            { opId, filter: { projectId: project.id } },
            'app'
          );
        } catch (error) {
          logWarn(`⚠️ Ошибка выбора мастера: ${error.message}`, { opId, error }, 'app');
          FiltersManager.set('tasks', { projectId: project.id });
          DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
        }
      } else {
        logWarn(`⚠️ Master-Detail не доступен, используем фильтрацию`, { opId }, 'app');
        FiltersManager.set('tasks', { projectId: project.id });
        DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
      }
    } else {
      FiltersManager.clear('tasks');
      logInfo(`🧹 Фильтр задач очищен`, { opId }, 'app');
      DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
    }

    return this;
  },

  // ★★★ ВЫБОР ЗАДАЧИ ★★★
  selectTask(task) {
    const state = getAppState();
    const opId = ID.op('select_task');

    logInfo(
      `🎯 Выбор задачи: ${task?.title || 'none'}`,
      { opId, taskId: task?.id, taskTitle: task?.title },
      'app'
    );

    state[PRIVATE_APP.SELECTED_TASK] = task;

    if (task && task.assigneeId) {
      const store = getGlobalStore();
      if (store && typeof store.selectMaster === 'function') {
        try {
          store.selectMaster('tasks', task.id);
          logInfo(`🎯 Мастер выбран: tasks[${task.id}]`, { opId }, 'app');

          if (typeof store.getDetails === 'function') {
            const details = store.getDetails('tasks');
            logDebug(
              `📊 Детали получены через getDetails`,
              {
                master: 'tasks',
                details: Object.keys(details || {}),
              },
              'app'
            );

            if (details && details.users) {
              state[PRIVATE_APP.USERS] = details.users;
              state[PRIVATE_APP.LAST_UPDATE] = Date.now();

              if (store && typeof store.publish === 'function') {
                store.publish(`data:updated:users`, {
                  table: 'users',
                  count: details.users.length,
                  action: 'master-detail',
                  taskId: task.id,
                  timestamp: Date.now(),
                });
                logInfo(
                  `📨 Опубликовано data:updated:users (${details.users.length})`,
                  { opId, count: details.users.length },
                  'events'
                );
              }

              logInfo(
                `📊 Обновлено ${details.users.length} пользователей через Master-Detail`,
                {
                  opId,
                  count: details.users.length,
                },
                'app'
              );

              state[PRIVATE_APP.MASTER_DETAIL_DATA].tasks = {
                id: task.id,
                title: task.title,
                users: details.users,
              };
            }
          }

          FiltersManager.set('users', { id: task.assigneeId });
          logInfo(
            `🔍 Фильтр пользователей установлен: id=${task.assigneeId}`,
            { opId, filter: { id: task.assigneeId } },
            'app'
          );
        } catch (error) {
          logWarn(`⚠️ Ошибка выбора мастера для задачи: ${error.message}`, { opId, error }, 'app');
          FiltersManager.set('users', { id: task.assigneeId });
          DataManager[PRIVATE_APP.REFRESH_TABLE]('users');
        }
      } else {
        FiltersManager.set('users', { id: task.assigneeId });
        DataManager[PRIVATE_APP.REFRESH_TABLE]('users');
      }
    } else {
      FiltersManager.clear('users');
      logInfo(`🧹 Фильтр пользователей очищен`, { opId }, 'app');
      DataManager[PRIVATE_APP.REFRESH_TABLE]('users');
    }

    return this;
  },

  // ★★★ ВЫБОР ПОЛЬЗОВАТЕЛЯ ★★★
  selectUser(user) {
    const state = getAppState();
    const opId = ID.op('select_user');

    logInfo(
      `🎯 Выбор пользователя: ${user?.name || 'none'}`,
      { opId, userId: user?.id, userName: user?.name },
      'app'
    );

    state[PRIVATE_APP.SELECTED_USER] = user;

    if (user) {
      const store = getGlobalStore();
      if (store && typeof store.selectMaster === 'function') {
        try {
          store.selectMaster('users', user.id);
          logInfo(`🎯 Мастер выбран: users[${user.id}]`, { opId }, 'app');

          if (typeof store.getDetails === 'function') {
            const details = store.getDetails('users');
            logDebug(
              `📊 Детали получены через getDetails`,
              {
                master: 'users',
                details: Object.keys(details || {}),
              },
              'app'
            );

            if (details && details.tasks) {
              state[PRIVATE_APP.TASKS] = details.tasks;
              state[PRIVATE_APP.LAST_UPDATE] = Date.now();

              if (store && typeof store.publish === 'function') {
                store.publish(`data:updated:tasks`, {
                  table: 'tasks',
                  count: details.tasks.length,
                  action: 'master-detail',
                  userId: user.id,
                  timestamp: Date.now(),
                });
                logInfo(
                  `📨 Опубликовано data:updated:tasks (${details.tasks.length})`,
                  { opId, count: details.tasks.length },
                  'events'
                );
              }

              logInfo(
                `📊 Обновлено ${details.tasks.length} задач через Master-Detail`,
                {
                  opId,
                  count: details.tasks.length,
                },
                'app'
              );

              state[PRIVATE_APP.MASTER_DETAIL_DATA].users = {
                id: user.id,
                name: user.name,
                tasks: details.tasks,
              };
            }
          }

          FiltersManager.set('tasks', { assigneeId: user.id });
          logInfo(
            `🔍 Фильтр задач установлен: assigneeId=${user.id}`,
            { opId, filter: { assigneeId: user.id } },
            'app'
          );
        } catch (error) {
          logWarn(
            `⚠️ Ошибка выбора мастера для пользователя: ${error.message}`,
            { opId, error },
            'app'
          );
          FiltersManager.set('tasks', { assigneeId: user.id });
          DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
        }
      } else {
        FiltersManager.set('tasks', { assigneeId: user.id });
        DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
      }
    } else {
      FiltersManager.clear('tasks');
      logInfo(`🧹 Фильтр задач очищен`, { opId }, 'app');
      DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks');
    }

    return this;
  },

  getDataFromStore(tableName) {
    const store = getGlobalStore();
    if (!store) return [];
    const table = store.getTable?.(tableName);
    return table?.data || [];
  },

  syncAllData: async function () {
    const opId = ID.op('sync_all_data');
    logInfo(`🔄 Принудительная синхронизация всех данных`, { opId }, 'app');

    if (isSyncManagerReady()) {
      const syncManager = getSyncManager();
      if (syncManager && typeof syncManager.syncAll === 'function') {
        const result = await syncManager.syncAll();
        if (result) {
          logSuccess(`✅ Синхронизация через SyncManager завершена`, { opId }, 'app');
          return true;
        }
      }
    }

    const result = await DataManager[PRIVATE_APP.LOAD_ALL_DATA]();
    return result;
  },
};

// ============================================================
// 25. ★★★ ПОДПИСКА НА ИЗМЕНЕНИЯ В __GLOBAL_STORE__ (С ЗАЩИТОЙ ОТ ДУБЛИРОВАНИЯ) ★★★
// ============================================================

function setupGlobalStoreSubscriptions() {
  // ★★★ ЗАЩИТА ОТ ПОВТОРНОЙ НАСТРОЙКИ ★★★
  if (SUBSCRIPTIONS_INITIALIZED) {
    logWarn('⚠️ Подписки уже настроены, пропускаем', null, 'app');
    return () => {};
  }

  const store = getGlobalStore();
  const state = getAppState();
  const subscriptions = state[PRIVATE_APP.STORE_SUBSCRIPTIONS] || [];

  if (!store) {
    logWarn('⚠️ __GLOBAL_STORE__ не найден, подписки не настроены', null, 'app');
    return () => {};
  }

  if (typeof store.on !== 'function') {
    logWarn('⚠️ store.on не доступен, подписки не настроены', null, 'app');
    return () => {};
  }

  logInfo('📡 Настройка подписок на __GLOBAL_STORE__', null, 'app');

  const unsubscribeFunctions = [];

  // ★★★ ★★★ ★★★ ОДИН ОБРАБОТЧИК ДЛЯ DATA:UPDATED ★★★ ★★★ ★★★
  const onDataUpdated = (data) => {
    logInfo(
      `📨 [__GLOBAL_STORE__] Событие data:updated`,
      {
        table: data?.table,
        event: data?.event,
        timestamp: Date.now(),
      },
      'events'
    );

    if (data?.table) {
      logInfo(`🔄 Обновление таблицы ${data.table} после изменения`, null, 'app');
      DataManager[PRIVATE_APP.REFRESH_TABLE](data.table, { silent: true });
    }
  };

  try {
    const unsub = store.on('data:updated', onDataUpdated);
    if (unsub) unsubscribeFunctions.push(unsub);
    logInfo(`✅ Подписка на data:updated создана`, null, 'events');
  } catch (error) {
    logError(`❌ Ошибка подписки на data:updated: ${error.message}`, { error }, 'events');
  }

  // ★★★ ★★★ ★★★ ОДИН ОБРАБОТЧИК ДЛЯ MASTER:SELECTED ★★★ ★★★ ★★★
  const onMasterSelected = (data) => {
    logInfo(
      `📨 [__GLOBAL_STORE__] Событие master:selected`,
      {
        master: data?.master,
        id: data?.id,
        timestamp: Date.now(),
      },
      'events'
    );

    if (data?.master === 'projects') {
      logInfo(`🔄 Обновление задач после выбора мастера`, null, 'app');
      DataManager[PRIVATE_APP.REFRESH_TABLE]('tasks', { silent: true });
    }
  };

  try {
    const unsub = store.on('master:selected', onMasterSelected);
    if (unsub) unsubscribeFunctions.push(unsub);
    logInfo(`✅ Подписка на master:selected создана`, null, 'events');
  } catch (error) {
    logError(`❌ Ошибка подписки на master:selected: ${error.message}`, { error }, 'events');
  }

  // ★★★ ★★★ ★★★ ПОДПИСКИ НА СПЕЦИФИЧНЫЕ ТАБЛИЦЫ ★★★ ★★★ ★★★
  const tables = ['projects', 'tasks', 'users'];
  for (const table of tables) {
    try {
      const unsub = store.on(`data:updated:${table}`, (data) => {
        logDebug(
          `📨 [__GLOBAL_STORE__] data:updated:${table}`,
          {
            count: data?.count || 0,
            timestamp: Date.now(),
          },
          'events'
        );

        if (isSyncManagerReady()) {
          const syncManager = getSyncManager();
          if (syncManager && typeof syncManager.syncTable === 'function') {
            syncManager.syncTable(table);
          }
        }
      });
      if (unsub) unsubscribeFunctions.push(unsub);
      logDebug(`✅ Подписка на data:updated:${table} создана`, null, 'events');
    } catch (error) {
      logError(
        `❌ Ошибка подписки на data:updated:${table}: ${error.message}`,
        { error },
        'events'
      );
    }
  }

  state[PRIVATE_APP.STORE_SUBSCRIPTIONS] = unsubscribeFunctions;
  state[PRIVATE_APP.GLOBAL_STORE_READY] = true;
  SUBSCRIPTIONS_INITIALIZED = true;

  logSuccess(
    `✅ Настроено ${unsubscribeFunctions.length} подписок на __GLOBAL_STORE__`,
    null,
    'app'
  );

  return () => {
    logInfo('🧹 Отписка от __GLOBAL_STORE__', null, 'app');
    for (const unsub of unsubscribeFunctions) {
      try {
        if (typeof unsub === 'function') {
          unsub();
        }
      } catch (error) {
        logError(`❌ Ошибка отписки: ${error.message}`, { error }, 'events');
      }
    }
    state[PRIVATE_APP.STORE_SUBSCRIPTIONS] = [];
    state[PRIVATE_APP.GLOBAL_STORE_READY] = false;
    SUBSCRIPTIONS_INITIALIZED = false;
  };
}

// ============================================================
// 26. МЕНЕДЖЕР ФИЛЬТРОВ
// ============================================================

const FiltersManager = {
  get(tableName) {
    const state = getAppState();
    return state[PRIVATE_APP.FILTERS][tableName] || {};
  },

  set(tableName, filters) {
    const opId = ID.op(`set_filters_${tableName}`);
    const state = getAppState();
    const oldFilters = { ...state[PRIVATE_APP.FILTERS][tableName] };
    state[PRIVATE_APP.FILTERS][tableName] = { ...filters };

    const event = {
      type: PRIVATE_APP.FILTERS_CHANGED,
      table: tableName,
      filters: state[PRIVATE_APP.FILTERS][tableName],
      oldFilters,
      timestamp: Date.now(),
      opId,
    };

    for (const [, callback] of state[PRIVATE_APP.FILTER_SUBSCRIBERS]) {
      try {
        callback(event);
      } catch (error) {
        logError(
          `❌ Ошибка в подписчике фильтров: ${error.message}`,
          { opId, error: error.message, tableName },
          'app'
        );
      }
    }

    logInfo(
      `🔍 Фильтры обновлены для ${tableName}`,
      { opId, tableName, filters: state[PRIVATE_APP.FILTERS][tableName] },
      'app'
    );
    return this;
  },

  clear(tableName) {
    const opId = ID.op(`clear_filters_${tableName}`);
    const state = getAppState();
    state[PRIVATE_APP.FILTERS][tableName] = {};

    const event = {
      type: PRIVATE_APP.FILTERS_CHANGED,
      table: tableName,
      filters: {},
      timestamp: Date.now(),
      opId,
    };

    for (const [, callback] of state[PRIVATE_APP.FILTER_SUBSCRIBERS]) {
      try {
        callback(event);
      } catch (error) {
        logError(
          `❌ Ошибка в подписчике фильтров: ${error.message}`,
          { opId, error: error.message, tableName },
          'app'
        );
      }
    }

    logInfo(`🧹 Фильтры очищены для ${tableName}`, { opId, tableName }, 'app');
    return this;
  },

  getAll() {
    const state = getAppState();
    return { ...state[PRIVATE_APP.FILTERS] };
  },

  subscribe(callback) {
    const state = getAppState();
    const id = `filter_sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    state[PRIVATE_APP.FILTER_SUBSCRIBERS].set(id, callback);
    return id;
  },

  unsubscribe(id) {
    const state = getAppState();
    return state[PRIVATE_APP.FILTER_SUBSCRIBERS].delete(id);
  },
};

// ============================================================
// 27. ★★★ tableApi ★★★
// ============================================================

const tableApi = {
  data: async (endpoint, payload) => {
    const reqId = ID.req(endpoint);
    const state = getAppState();
    const baseUrl = state[PRIVATE_APP.API_BASE];

    try {
      const url = `${baseUrl}/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logError(`❌ Ошибка API: ${endpoint}`, { reqId, endpoint, error: error.message }, 'api');
      throw error;
    }
  },

  set: async (endpoint, payload) => {
    const reqId = ID.req(`set_${endpoint}`);
    const state = getAppState();
    const baseUrl = state[PRIVATE_APP.API_BASE];

    try {
      const url = `${baseUrl}/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logError(
        `❌ Ошибка сохранения: ${endpoint}`,
        { reqId, endpoint, error: error.message },
        'api'
      );
      throw error;
    }
  },

  userSettingsApi: {
    get: 'user-settings/get',
    set: 'user-settings/set',
  },

  userChanges: async (endpoint, payload, options = {}) => {
    const { skipIfNoChanges = true, debounce = 500 } = options;

    if (endpoint === 'user-settings/set') {
      logInfo(
        `⏭️ userChanges: сохранение настроек заблокировано (глобальный флаг)`,
        { endpoint },
        'settings'
      );
      return { success: true, result: true, skipped: true };
    }

    const reqId = ID.req(`userChanges_${endpoint}`);
    const state = getAppState();
    const baseUrl = state[PRIVATE_APP.API_BASE];

    logInfo(`📂 userChanges: загрузка настроек`, { endpoint, viewId: payload?.viewId }, 'settings');

    try {
      const url = `${baseUrl}/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        logSuccess(
          `✅ Настройки загружены через userChanges`,
          { endpoint, viewId: payload?.viewId },
          'settings'
        );
      }

      return result;
    } catch (error) {
      logError(
        `❌ Ошибка userChanges: ${endpoint}`,
        { reqId, endpoint, error: error.message },
        'settings'
      );
      throw error;
    }
  },

  export: ({ component, fileName }) => {
    const opId = ID.op('export_data');

    try {
      const data = component.getDataSource().items();
      const columns = component.getVisibleColumns();

      let csv = columns.map((c) => c.caption || c.dataField).join(',') + '\n';
      for (const row of data) {
        csv +=
          columns
            .map((c) => {
              const value = row[c.dataField];
              return typeof value === 'string' && value.includes(',')
                ? `\"${value}\"`
                : (value ?? '');
            })
            .join(',') + '\n';
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showNotification('✅ Экспорт завершен', `Экспортировано ${data.length} записей`, 'success');
      logSuccess(`📤 Экспорт завершен: ${fileName}`, { opId, fileName, rows: data.length }, 'app');
    } catch (error) {
      logError(`❌ Ошибка экспорта: ${error.message}`, { opId, error }, 'app');
      showNotification('❌ Ошибка', `Не удалось экспортировать данные: ${error.message}`, 'error');
    }
  },
};

// ============================================================
// 28. ГЛОБАЛЬНЫЕ НАСТРОЙКИ
// ============================================================

try {
  initGlobalSettings({ tableApi });
  logInfo('✅ Глобальные настройки инициализированы', null, 'app');
} catch (error) {
  logError(
    `❌ Ошибка инициализации глобальных настроек: ${error.message}`,
    { error: error.message, stack: error.stack },
    'app'
  );
}

// ============================================================
// 29. КОНФИГУРАЦИЯ КОЛОНОК
// ============================================================

const PROJECTS_COLUMNS = [
  { key: 'name', caption: 'Название', dataField: 'name', dataType: 'string', minWidth: 200 },
  {
    key: 'description',
    caption: 'Описание',
    dataField: 'description',
    dataType: 'string',
    minWidth: 250,
  },
  { key: 'status', caption: 'Статус', dataField: 'status', dataType: 'string', minWidth: 120 },
  {
    key: 'priority',
    caption: 'Приоритет',
    dataField: 'priority',
    dataType: 'number',
    minWidth: 90,
  },
  { key: 'ownerId', caption: 'Владелец', dataField: 'ownerId', dataType: 'string', minWidth: 120 },
  {
    key: 'team_size',
    caption: 'Команда',
    dataField: 'team_size',
    dataType: 'number',
    minWidth: 90,
  },
  { key: 'budget', caption: 'Бюджет', dataField: 'budget', dataType: 'number', minWidth: 120 },
  {
    key: 'progress',
    caption: 'Прогресс',
    dataField: 'progress',
    dataType: 'number',
    minWidth: 100,
  },
  {
    key: 'department',
    caption: 'Отдел',
    dataField: 'department',
    dataType: 'string',
    minWidth: 140,
  },
  { key: 'tags', caption: 'Теги', dataField: 'tags', dataType: 'string', minWidth: 150 },
];

const TASKS_COLUMNS = [
  { key: 'title', caption: 'Задача', dataField: 'title', dataType: 'string', minWidth: 200 },
  {
    key: 'description',
    caption: 'Описание',
    dataField: 'description',
    dataType: 'string',
    minWidth: 250,
  },
  { key: 'status', caption: 'Статус', dataField: 'status', dataType: 'string', minWidth: 130 },
  {
    key: 'priority',
    caption: 'Приоритет',
    dataField: 'priority',
    dataType: 'number',
    minWidth: 90,
  },
  {
    key: 'assigneeId',
    caption: 'Исполнитель',
    dataField: 'assigneeId',
    dataType: 'string',
    minWidth: 120,
  },
  {
    key: 'estimated_hours',
    caption: 'Оценка (ч)',
    dataField: 'estimated_hours',
    dataType: 'number',
    minWidth: 100,
  },
  {
    key: 'actual_hours',
    caption: 'Затрачено (ч)',
    dataField: 'actual_hours',
    dataType: 'number',
    minWidth: 100,
  },
  {
    key: 'projectId',
    caption: 'Проект',
    dataField: 'projectId',
    dataType: 'string',
    minWidth: 120,
  },
  { key: 'type', caption: 'Тип', dataField: 'type', dataType: 'string', minWidth: 120 },
  {
    key: 'createdAt',
    caption: 'Дата создания',
    dataField: 'createdAt',
    dataType: 'date',
    minWidth: 120,
  },
  { key: 'dueDate', caption: 'Дедлайн', dataField: 'dueDate', dataType: 'date', minWidth: 120 },
];

const USERS_COLUMNS = [
  { key: 'name', caption: 'Имя', dataField: 'name', dataType: 'string', minWidth: 180 },
  { key: 'email', caption: 'Email', dataField: 'email', dataType: 'string', minWidth: 220 },
  { key: 'role', caption: 'Роль', dataField: 'role', dataType: 'string', minWidth: 140 },
  { key: 'status', caption: 'Статус', dataField: 'status', dataType: 'string', minWidth: 100 },
  {
    key: 'experience',
    caption: 'Опыт (лет)',
    dataField: 'experience',
    dataType: 'number',
    minWidth: 90,
  },
  {
    key: 'department',
    caption: 'Отдел',
    dataField: 'department',
    dataType: 'string',
    minWidth: 140,
  },
  { key: 'skills', caption: 'Навыки', dataField: 'skills', dataType: 'string', minWidth: 200 },
  { key: 'projects', caption: 'Проекты', dataField: 'projects', dataType: 'string', minWidth: 200 },
];

// ============================================================
// 30. ★★★ КОМПОНЕНТ ТАБЛИЦЫ С DEBOUNCE ★★★
// ============================================================

// ★★★ DEBOUNCE ФУНКЦИЯ ★★★
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function createTableComponent(name, apiEndpoint, columns, options = {}) {
  const {
    title = name,
    isEditable = true,
    showFooter = true,
    selectionMode = 'single',
    pageSize = null,
    cellHeight = 50,
    toolbarItems = [],
    viewId = null,
    autoSave = false,
  } = options;

  const finalViewId = viewId || ID.view(`view_${name}`, { context: `view:${name}`, silent: true });
  const finalAutoSave = false;

  const safeColumns = Array.isArray(columns)
    ? columns.map((col) => ({
      ...col,
      key:
        col.key ||
        col.dataField ||
        col.caption ||
        `col_${Math.random().toString(36).substr(2, 6)}`,
    }))
    : [];

  return defineComponent({
    name: `${name}Table`,
    components: { AiDataTable },
    setup() {
      const tableRef = ref(null);
      const selectedId = ref(null);
      let isRefreshing = false;
      let refreshTimeout = null;
      let storeUnsubscribe = null;

      const componentId = ID.component(`table_${name}`);

      const existingData = computed(() => {
        const store = getGlobalStore();
        if (!store) return [];
        const table = store.getTable?.(name);
        return table?.data || [];
      });

      const hasExistingData = computed(() => {
        return existingData.value && existingData.value.length > 0;
      });

      logInfo(
        `📋 Создание таблицы: ${name}`,
        {
          componentId,
          name,
          viewId: finalViewId,
          columnsCount: safeColumns.length,
          autoSave: finalAutoSave,
          hasExistingData: hasExistingData.value,
          existingCount: existingData.value.length,
        },
        'app'
      );

      const apiWithSettings = {
        get: name,
        set: tableApi.set,
        userSettingsApi: tableApi.userSettingsApi,
        getUserSettings: getUserSettingsDirect,
        setUserSettings: setUserSettingsDirect,
        autoSave: finalAutoSave,
      };

      const refreshCurrentTable = (silent = false) => {
        if (isRefreshing) return;

        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }

        refreshTimeout = setTimeout(() => {
          refreshTimeout = null;
          isRefreshing = true;

          const refreshId = ID.action(`refresh_${name}`);

          if (!silent) {
            logInfo(
              `🔄 Обновление таблицы: ${name}`,
              { refreshId, tableName: name, componentId, viewId: finalViewId },
              'app'
            );
          }

          try {
            if (tableRef.value?.refreshData) {
              tableRef.value.refreshData();
            }

            if (isSyncManagerReady()) {
              const syncManager = getSyncManager();
              if (syncManager && typeof syncManager.syncTable === 'function') {
                syncManager.syncTable(name);
              }
            } else {
              DataManager[PRIVATE_APP.REFRESH_TABLE](name, { silent, viewId: finalViewId });
            }
          } catch (error) {
            if (!silent) {
              logError(
                `❌ Ошибка обновления таблицы ${name}: ${error.message}`,
                {
                  refreshId,
                  tableName: name,
                  error: error.message,
                },
                'app'
              );
            }
          } finally {
            isRefreshing = false;
          }
        }, 300);
      };

      const updateSelectedFromGlobal = () => {
        const state = getAppState();
        if (name === 'projects') {
          selectedId.value = state[PRIVATE_APP.SELECTED_PROJECT]?.id || null;
        } else if (name === 'tasks') {
          selectedId.value = state[PRIVATE_APP.SELECTED_TASK]?.id || null;
        } else if (name === 'users') {
          selectedId.value = state[PRIVATE_APP.SELECTED_USER]?.id || null;
        }
      };

      const loadTableData = async () => {
        const store = getGlobalStore();
        if (!store) {
          logWarn(`⚠️ Хранилище не доступно для таблицы ${name}`, { componentId }, 'app');
          return false;
        }

        const table = store.getTable?.(name);
        if (table && table.data && table.data.length > 0) {
          logInfo(
            `📊 Таблица ${name} уже содержит ${table.data.length} записей, пропускаем загрузку`,
            { componentId, count: table.data.length },
            'app'
          );
          return true;
        }

        logInfo(`📥 Загрузка данных для таблицы ${name}`, { componentId }, 'app');

        try {
          if (isSyncManagerReady()) {
            const syncManager = getSyncManager();
            if (syncManager && typeof syncManager.syncTable === 'function') {
              await syncManager.syncTable(name);
            }
          } else {
            await DataManager[PRIVATE_APP.REFRESH_TABLE](name, { viewId: finalViewId });
          }
          return true;
        } catch (error) {
          logError(
            `❌ Ошибка загрузки данных для ${name}: ${error.message}`,
            { componentId, error },
            'app'
          );
          return false;
        }
      };

      const setupReactiveUpdates = () => {
        // ★★★ ЗАЩИТА ОТ ПОВТОРНОЙ ПОДПИСКИ ★★★
        if (storeUnsubscribe) {
          logDebug(`⚠️ Таблица ${name} уже подписана`, { componentId }, 'app');
          return;
        }

        const store = getGlobalStore();
        if (!store || typeof store.on !== 'function') {
          logWarn(`⚠️ store.on не доступен для таблицы ${name}`, { componentId }, 'app');
          return;
        }

        try {
          storeUnsubscribe = store.on(`data:updated:${name}`, (data) => {
            logInfo(
              `📨 [__GLOBAL_STORE__] data:updated:${name}`,
              {
                componentId,
                name,
                count: data?.count || 0,
                timestamp: Date.now(),
              },
              'events'
            );

            const table = store.getTable?.(name);
            if (table && table.data && table.data.length > 0) {
              logInfo(
                `📊 Таблица ${name} обновлена: ${table.data.length} записей`,
                { componentId },
                'app'
              );
              refreshCurrentTable(true);
            }
          });

          if (name === 'tasks' || name === 'users') {
            const masterTable = name === 'tasks' ? 'projects' : 'tasks';
            const masterUnsub = store.on(`master:selected:${masterTable}`, () => {
              logInfo(
                `📨 master:selected:${masterTable} → обновляем ${name}`,
                { componentId, name, masterTable },
                'events'
              );
              refreshCurrentTable(true);
            });
            if (!storeUnsubscribe) {
              storeUnsubscribe = masterUnsub;
            } else if (typeof storeUnsubscribe === 'function') {
              const existingUnsub = storeUnsubscribe;
              storeUnsubscribe = () => {
                existingUnsub();
                masterUnsub();
              };
            }
          }

          logInfo(`✅ Таблица ${name} подписалась на обновления`, { componentId }, 'app');
        } catch (error) {
          logError(
            `❌ Ошибка подписки для ${name}: ${error.message}`,
            { error, componentId },
            'app'
          );
        }
      };

      onMounted(async () => {
        updateSelectedFromGlobal();

        const store = getGlobalStore();
        const table = store?.getTable?.(name);
        const hasData = table && table.data && table.data.length > 0;

        if (hasData) {
          logInfo(
            `📊 Таблица ${name} уже имеет ${table.data.length} записей при монтировании`,
            { componentId, count: table.data.length },
            'app'
          );
        }

        setupReactiveUpdates();

        if (!hasData) {
          await loadTableData();
        }

        const checkInterval = setInterval(() => {
          const currentStore = getGlobalStore();
          const currentTable = currentStore?.getTable?.(name);
          if (currentTable && currentTable.data && currentTable.data.length > 0) {
            refreshCurrentTable(true);
            clearInterval(checkInterval);
          }
        }, 1000);

        if (!window.__tableIntervals) window.__tableIntervals = {};
        window.__tableIntervals[name] = checkInterval;

        setTimeout(() => {
          if (window.__tableIntervals[name]) {
            clearInterval(window.__tableIntervals[name]);
            delete window.__tableIntervals[name];
          }
        }, 10000);

        nextTick(() => {
          refreshCurrentTable(true);
        });
      });

      onUnmounted(() => {
        if (storeUnsubscribe && typeof storeUnsubscribe === 'function') {
          try {
            storeUnsubscribe();
            logInfo(`🧹 Таблица ${name} отписалась от __GLOBAL_STORE__`, { componentId }, 'app');
          } catch (error) {
            logError(`❌ Ошибка отписки ${name}: ${error.message}`, { error }, 'app');
          }
        }

        if (window.__tableIntervals && window.__tableIntervals[name]) {
          clearInterval(window.__tableIntervals[name]);
          delete window.__tableIntervals[name];
        }

        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
      });

      // ★★★ ★★★ ★★★ ОБРАБОТЧИК КЛИКА С DEBOUNCE ★★★ ★★★ ★★★
      const handleRowClick = debounce((row) => {
        if (!row) return;

        const clickId = ID.action(`click_${name}`);
        logInfo(
          `🖱️ Клик по строке в ${name}`,
          { clickId, tableName: name, viewId: finalViewId, rowId: row.id },
          'app'
        );

        if (name === 'projects') {
          DataManager.selectProject(row);
        } else if (name === 'tasks') {
          DataManager.selectTask(row);
        } else if (name === 'users') {
          DataManager.selectUser(row);
        }
      }, 150);

      const getFilters = () => {
        return FiltersManager.get(name);
      };

      const tableInstance = {
        tableRef,
        viewId: finalViewId,
        name,
        refreshCurrentTable,
        loadTableData,
        getFilters,
        hasExistingData,
        existingData,
        selectedId,
        componentId,
      };

      setTableInstance(name, tableInstance);

      return {
        tableRef,
        viewId: finalViewId,
        api: apiWithSettings,
        columns: safeColumns,
        handleRowClick,
        selectedId,
        title,
        isEditable,
        showFooter,
        selectionMode,
        pageSize,
        cellHeight,
        toolbarItems,
        componentId,
        refreshCurrentTable,
        autoSave: finalAutoSave,
        getFilters,
        hasExistingData,
        existingData,
        loadTableData,
      };
    },
    template: `
      <div class="table-card">
        <div class="card-header">${title}</div>
        <div style="height: 400px; padding: 8px;">
          <AiDataTable
            ref="tableRef"
            :title="title"
            :view-id="viewId"
            :is-editable="isEditable"
            key-expr="id"
            :api="api"
            :columns="columns"
            :selection-mode="selectionMode"
            :show-footer="showFooter"
            :page-size="pageSize"
            :cell-height="cellHeight"
            :toolbar-items="toolbarItems"
            @row-click="handleRowClick"
          />
        </div>
      </div>
    `,
  });
}

// ============================================================
// 31. КОМПОНЕНТ СТАТИСТИКИ
// ============================================================

const StatsComponent = defineComponent({
  name: 'StatsComponent',
  setup() {
    const state = getAppState();
    const stats = ref({
      projects: 0,
      tasks: 0,
      users: 0,
      projectStatuses: {},
      taskStatuses: {},
      userRoles: {},
      totalBudget: 0,
      totalHours: 0,
      avgProgress: 0,
      filteredTasks: 0,
      filteredUsers: 0,
      loading: false,
    });

    const calculateStats = () => {
      const projects = state[PRIVATE_APP.PROJECTS] || [];
      const tasks = state[PRIVATE_APP.TASKS] || [];
      const users = state[PRIVATE_APP.USERS] || [];

      const taskFilters = FiltersManager.get('tasks');
      const userFilters = FiltersManager.get('users');

      const filteredTasks =
        taskFilters && Object.keys(taskFilters).length > 0
          ? tasks.filter((task) => {
            for (const [key, value] of Object.entries(taskFilters)) {
              if (task[key] !== value) return false;
            }
            return true;
          })
          : tasks;

      const filteredUsers =
        userFilters && Object.keys(userFilters).length > 0
          ? users.filter((user) => {
            for (const [key, value] of Object.entries(userFilters)) {
              if (user[key] !== value) return false;
            }
            return true;
          })
          : users;

      const projectStatuses = {};
      for (const p of projects) projectStatuses[p.status] = (projectStatuses[p.status] || 0) + 1;

      const taskStatuses = {};
      for (const t of filteredTasks) taskStatuses[t.status] = (taskStatuses[t.status] || 0) + 1;

      const userRoles = {};
      for (const u of filteredUsers) userRoles[u.role] = (userRoles[u.role] || 0) + 1;

      stats.value = {
        projects: projects.length,
        tasks: tasks.length,
        users: users.length,
        filteredTasks: filteredTasks.length,
        filteredUsers: filteredUsers.length,
        projectStatuses,
        taskStatuses,
        userRoles,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalHours: tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0),
        avgProgress:
          projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
            : 0,
        loading: state[PRIVATE_APP.LOADING],
      };
    };

    const updateStats = () => {
      calculateStats();
    };

    onMounted(() => {
      calculateStats();
      const interval = setInterval(() => {
        calculateStats();
      }, 5000);
      return () => clearInterval(interval);
    });

    return { stats };
  },
  template: `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
      <div style="background: #1a2230; border-radius: 12px; padding: 16px; border: 1px solid #1e2633;">
        <div style="font-size: 12px; color: #8b96b0;">📊 Проекты</div>
        <div style="font-size: 28px; font-weight: 700; color: #60a5fa;">{{ stats.projects }}</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">🟢 {{ stats.projectStatuses.active || 0 }} активных</div>
      </div>
      <div style="background: #1a2230; border-radius: 12px; padding: 16px; border: 1px solid #1e2633;">
        <div style="font-size: 12px; color: #8b96b0;">📋 Задачи</div>
        <div style="font-size: 28px; font-weight: 700; color: #a78bfa;">{{ stats.tasks }}</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">🔍 {{ stats.filteredTasks }} отфильтровано</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 2px;">✅ {{ stats.taskStatuses.done || 0 }} выполнено</div>
      </div>
      <div style="background: #1a2230; border-radius: 12px; padding: 16px; border: 1px solid #1e2633;">
        <div style="font-size: 12px; color: #8b96b0;">👤 Пользователи</div>
        <div style="font-size: 28px; font-weight: 700; color: #34d399;">{{ stats.users }}</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">🔍 {{ stats.filteredUsers }} отфильтровано</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 2px;">💻 {{ stats.userRoles.developer || 0 }} разработчиков</div>
      </div>
      <div style="background: #1a2230; border-radius: 12px; padding: 16px; border: 1px solid #1e2633;">
        <div style="font-size: 12px; color: #8b96b0;">💰 Бюджет</div>
        <div style="font-size: 28px; font-weight: 700; color: #fbbf24;">{{ (stats.totalBudget / 1000000).toFixed(1) }}M</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">📈 {{ stats.avgProgress }}% прогресс</div>
      </div>
      <div style="background: #1a2230; border-radius: 12px; padding: 16px; border: 1px solid #1e2633;">
        <div style="font-size: 12px; color: #8b96b0;">⏱ Затрачено часов</div>
        <div style="font-size: 28px; font-weight: 700; color: #f472b6;">{{ stats.totalHours }}</div>
        <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">📊 {{ stats.tasks > 0 ? Math.round(stats.totalHours / stats.tasks) : 0 }} ч/задача</div>
      </div>
    </div>
  `,
});

// ============================================================
// 32. УВЕДОМЛЕНИЯ
// ============================================================

let notificationTimeout = null;

function showNotification(title, message, type = 'info') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const colors = { info: '#60a5fa', success: '#34d399', warning: '#fbbf24', error: '#ef4444' };
  const html = `
    <div style="background: #1a2230; border-left: 4px solid ${colors[type] || colors.info}; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: slideIn 0.3s ease; max-width: 400px;">
      <div style="font-weight: 600; color: #e0e4ee; font-size: 14px;">${title}</div>
      <div style="color: #8b96b0; font-size: 12px; margin-top: 4px;">${message}</div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);

  if (notificationTimeout) clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    const notifications = container.querySelectorAll('div');
    if (notifications.length > 0) notifications[0].remove();
    notificationTimeout = null;
  }, 3000);
}

const styleEl = document.createElement('style');
styleEl.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(styleEl);

// ============================================================
// 33. ★★★ СОЗДАНИЕ КОМПОНЕНТОВ ТАБЛИЦ ★★★
// ============================================================

const ProjectsTable = createTableComponent('projects', 'projects', PROJECTS_COLUMNS, {
  title: '📁 Проекты',
  isEditable: true,
  selectionMode: 'single',
  autoSave: false,
});

const TasksTable = createTableComponent('tasks', 'tasks', TASKS_COLUMNS, {
  title: '📋 Задачи',
  isEditable: true,
  selectionMode: 'single',
  autoSave: false,
});

const UsersTable = createTableComponent('users', 'users', USERS_COLUMNS, {
  title: '👤 Пользователи',
  isEditable: true,
  selectionMode: 'single',
  autoSave: false,
});

// ============================================================
// 34. ★★★ ГЛАВНЫЙ КОМПОНЕНТ (ИСПРАВЛЕН — УБРАНА ДУБЛИРУЮЩАЯ ЗАГРУЗКА) ★★★
// ============================================================

const App = defineComponent({
  name: 'App',
  components: {
    NConfigProvider,
    NMessageProvider,
    AiAppProviders,
    StatsComponent,
    NSpin,
    NAlert,
    ProjectsTable,
    TasksTable,
    UsersTable,
  },
  setup() {
    const state = getAppState();
    const isLoading = ref(state[PRIVATE_APP.LOADING]);
    const error = ref(state[PRIVATE_APP.ERROR]);

    const privateSymbols = PRIVATE_APP;
    const subscriptions = [];

    const refreshAll = async () => {
      const opId = ID.op('refresh_all');
      isLoading.value = true;
      error.value = null;

      logInfo(`🔄 Принудительное обновление всех данных`, { opId }, 'app');

      try {
        let success = false;
        if (isSyncManagerReady()) {
          const syncManager = getSyncManager();
          if (syncManager && typeof syncManager.syncAll === 'function') {
            success = await syncManager.syncAll();
          }
        }

        if (!success) {
          success = await DataManager[PRIVATE_APP.LOAD_ALL_DATA]();
        }

        if (success) {
          showNotification('🔄 Обновлено', 'Данные успешно обновлены', 'success');
          logSuccess(`✅ Данные успешно обновлены`, { opId }, 'app');
        } else {
          showNotification('❌ Ошибка', 'Не удалось обновить данные', 'error');
          logError(`❌ Ошибка обновления данных`, { opId }, 'app');
        }
      } catch (error) {
        const errorMsg = error.message || 'Неизвестная ошибка';
        error.value = errorMsg;
        showNotification('❌ Ошибка', errorMsg, 'error');
        logError(
          `❌ Критическая ошибка обновления: ${errorMsg}`,
          { opId, error: errorMsg, stack: error.stack },
          'app'
        );
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(async () => {
      const opId = ID.op('app_mount');
      logInfo(`🚀 Монтирование компонента App`, { opId }, 'app');

      // ★★★ ★★★ ★★★ ПРОВЕРЯЕМ, ЕСТЬ ЛИ УЖЕ ДАННЫЕ ★★★ ★★★ ★★★
      const store = getGlobalStore();
      const projectsTable = store?.getTable?.('projects');
      const tasksTable = store?.getTable?.('tasks');
      const usersTable = store?.getTable?.('users');

      const hasProjects = projectsTable?.data?.length > 0;
      const hasTasks = tasksTable?.data?.length > 0;
      const hasUsers = usersTable?.data?.length > 0;

      if (hasProjects && hasTasks && hasUsers) {
        logInfo(
          `✅ Данные уже загружены: ${projectsTable.data.length} проектов, ${tasksTable.data.length} задач, ${usersTable.data.length} пользователей`,
          { opId },
          'app'
        );

        // ★★★ ОБНОВЛЯЕМ СОСТОЯНИЕ ИЗ ХРАНИЛИЩА ★★★
        state[PRIVATE_APP.PROJECTS] = projectsTable.data;
        state[PRIVATE_APP.TASKS] = tasksTable.data;
        state[PRIVATE_APP.USERS] = usersTable.data;
        state[PRIVATE_APP.LAST_UPDATE] = Date.now();
        state[PRIVATE_APP.DATA_SYNCED] = true;
        state[PRIVATE_APP.SYNC_TIMESTAMP] = Date.now();

        logSuccess(
          `✅ Состояние обновлено из хранилища: ${projectsTable.data.length} проектов, ${tasksTable.data.length} задач, ${usersTable.data.length} пользователей`,
          { opId },
          'app'
        );

        // ★★★ ПОДПИСКИ НАСТРАИВАЮТСЯ ТОЛЬКО В mountApp() ★★★
        // Здесь они НЕ настраиваются, чтобы избежать дублирования

        isLoading.value = false;
        state[PRIVATE_APP.INITIALIZED] = true;

        logSystem(
          `✅ Приложение инициализировано (данные уже загружены)`,
          {
            opId,
            version: CONFIG.version,
            apiBase: CONFIG.apiBase,
            globalStoreReady: state[PRIVATE_APP.GLOBAL_STORE_READY],
            syncManagerReady: state[PRIVATE_APP.SYNC_MANAGER_READY],
          },
          'system'
        );

        return; // ★★★ ★★★ ★★★ ВЫХОДИМ — НЕ ЗАГРУЖАЕМ ДАННЫЕ ПОВТОРНО ★★★ ★★★ ★★★
      }

      // ★★★ ЕСЛИ ДАННЫХ НЕТ — ЗАГРУЖАЕМ ★★★
      if (DATA_LOADING) {
        logInfo('⏳ Загрузка данных уже выполняется', null, 'app');
        return;
      }

      isLoading.value = true;
      DATA_LOADING = true;

      try {
        logInfo(`📦 Загрузка данных...`, { opId }, 'app');

        // Загружаем данные через DataManager
        let success = await DataManager[PRIVATE_APP.LOAD_ALL_DATA]();

        if (success) {
          logSuccess(
            `✅ Данные загружены: ${state[PRIVATE_APP.PROJECTS].length} проектов, ${state[PRIVATE_APP.TASKS].length} задач, ${state[PRIVATE_APP.USERS].length} пользователей`,
            { opId },
            'app'
          );

          // ★★★ ИНИЦИАЛИЗИРУЕМ SYNC MANAGER ТОЛЬКО ЕСЛИ ЕЩЕ НЕ ИНИЦИАЛИЗИРОВАН ★★★
          if (!isSyncManagerReady()) {
            try {
              const syncManager = SyncManager.init({
                autoSync: CONFIG.syncManager.autoSync,
                interval: CONFIG.syncManager.interval,
              });

              state[PRIVATE_APP.SYNC_MANAGER] = syncManager;
              state[PRIVATE_APP.SYNC_MANAGER_READY] = true;

              logSuccess(`✅ SyncManager инициализирован после загрузки данных`, { opId }, 'app');
            } catch (error) {
              logError(
                `❌ Ошибка инициализации SyncManager: ${error.message}`,
                { opId, error },
                'app'
              );
            }
          } else {
            logInfo(`ℹ️ SyncManager уже инициализирован`, { opId }, 'app');
          }
        } else {
          logError(`❌ Не удалось загрузить данные`, { opId }, 'app');
          showNotification('❌ Ошибка', 'Не удалось загрузить данные с сервера', 'error');
        }
      } catch (error) {
        const errorMsg = error.message || 'Неизвестная ошибка';
        error.value = errorMsg;
        logError(
          `❌ Критическая ошибка загрузки: ${errorMsg}`,
          { opId, error: errorMsg, stack: error.stack },
          'app'
        );
        showNotification('❌ Ошибка', errorMsg, 'error');
      } finally {
        isLoading.value = false;
        DATA_LOADING = false;
        state[PRIVATE_APP.INITIALIZED] = true;

        logSystem(
          `✅ Приложение инициализировано`,
          {
            opId,
            version: CONFIG.version,
            apiBase: CONFIG.apiBase,
            globalStoreReady: state[PRIVATE_APP.GLOBAL_STORE_READY],
            syncManagerReady: state[PRIVATE_APP.SYNC_MANAGER_READY],
          },
          'system'
        );
      }
    });

    onUnmounted(() => {
      const opId = ID.op('app_unmount');
      logInfo(`🧹 Размонтирование компонента App`, { opId }, 'app');

      if (typeof window !== 'undefined' && window.__unsubscribeGlobalStore) {
        try {
          window.__unsubscribeGlobalStore();
          logInfo('✅ Отписка от __GLOBAL_STORE__ выполнена', { opId }, 'app');
        } catch (error) {
          logError(`❌ Ошибка отписки: ${error.message}`, { error }, 'app');
        }
      }

      if (isSyncManagerReady()) {
        try {
          const syncManager = getSyncManager();
          if (syncManager && typeof syncManager.destroy === 'function') {
            syncManager.destroy();
            logInfo('✅ SyncManager уничтожен', { opId }, 'app');
          }
        } catch (error) {
          logError(`❌ Ошибка уничтожения SyncManager: ${error.message}`, { error }, 'app');
        }
      }

      if (state[PRIVATE_APP.RENDER_TIMER]) {
        clearTimeout(state[PRIVATE_APP.RENDER_TIMER]);
        state[PRIVATE_APP.RENDER_TIMER] = null;
      }

      subscriptions.length = 0;
      state[PRIVATE_APP.DESTROYED] = true;
    });

    return {
      isLoading,
      error,
      refreshAll,
      state,
      CONFIG,
      privateSymbols,
      isSyncManagerReady: isSyncManagerReady,
    };
  },
  template: `
    <n-config-provider>
      <n-message-provider>
        <AiAppProviders>
          <div style="display: flex; flex-direction: column; gap: 20px; max-width: 1600px; margin: 0 auto; padding: 20px;">

            <div id="notification-container" style="position: fixed; top: 20px; right: 20px; z-index: 1000000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none;"></div>

            <div style="padding: 16px 20px; background: linear-gradient(135deg, #1a2230, #0b0e14); border-radius: 12px; border: 1px solid #1e2633; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <h1 style="color: #e0e4ee; font-size: 24px; font-weight: 600; margin: 0;">🏢 Управление проектами</h1>
                <p style="color: #8b96b0; font-size: 14px; margin: 4px 0 0 0;">
                  Сервер: {{ CONFIG.apiBase }} • Версия: {{ CONFIG.version }}
                  <span v-if="state[privateSymbols.GLOBAL_STORE_READY]" style="color: #34d399; margin-left: 12px;">✅ Global Store</span>
                  <span v-else style="color: #ef4444; margin-left: 12px;">❌ Global Store не найден</span>
                  <span v-if="isSyncManagerReady()" style="color: #60a5fa; margin-left: 12px;">🔄 Sync Manager</span>
                </p>
              </div>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span v-if="state[privateSymbols.SELECTED_PROJECT]" style="background: #0b0e14; padding: 4px 12px; border-radius: 20px; border: 1px solid #1e2633; font-size: 11px; color: #34d399;">
                  🔗 Связан: {{ state[privateSymbols.SELECTED_PROJECT].name }}
                </span>
                <span v-else style="background: #0b0e14; padding: 4px 12px; border-radius: 20px; border: 1px solid #1e2633; font-size: 11px; color: #4a5a7a;">
                  🔗 Выберите проект
                </span>
                <button @click="refreshAll" style="background: #0b0e14; border: 1px solid #1e2633; color: #8b96b0; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" :disabled="isLoading">
                  {{ isLoading ? '🔄 Загрузка...' : '🔄 Обновить' }}
                </button>
              </div>
            </div>

            <div v-if="error" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 12px 16px; color: #ef4444;">
              ❌ {{ error }}
            </div>

            <StatsComponent class="stats-component" />

            <ProjectsTable />
            <TasksTable />
            <UsersTable />

            <div style="padding: 16px 20px; background: #0f141c; border-radius: 12px; border: 1px solid #1e2633;">
              <h2 style="color: #c8d0e0; font-size: 16px; font-weight: 500; margin: 0 0 12px 0;">🔗 Связи между таблицами (Master-Detail)</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                <span style="background: #1a2230; padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #8b96b0; border: 1px solid #1e2633;">
                  <strong style="color: #60a5fa;">Проекты</strong>
                  <span style="color: #4a5a7a; margin: 0 6px;">→</span>
                  <strong style="color: #a78bfa;">Задачи</strong>
                  (ключ <code style="background: #0b0e14; padding: 1px 6px; border-radius: 3px; font-size: 12px; color: #8b96b0;">projectId</code>)
                </span>
                <span style="background: #1a2230; padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #8b96b0; border: 1px solid #1e2633;">
                  <strong style="color: #60a5fa;">Задачи</strong>
                  <span style="color: #4a5a7a; margin: 0 6px;">→</span>
                  <strong style="color: #a78bfa;">Пользователи</strong>
                  (ключ <code style="background: #0b0e14; padding: 1px 6px; border-radius: 3px; font-size: 12px; color: #8b96b0;">assigneeId</code>)
                </span>
                <span style="background: #1a2230; padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #34d399; border: 1px solid rgba(52, 211, 153, 0.2);">
                  ✅ Global Store синхронизация
                </span>
                <span v-if="isSyncManagerReady()" style="background: #1a2230; padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.2);">
                  🔄 Sync Manager активен
                </span>
              </div>
              <div style="margin-top: 12px; padding: 12px 16px; background: #0b0e14; border-radius: 8px; border-left: 4px solid #34d399;">
                <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
                  <span style="font-size: 13px; color: #8b96b0;">
                    💡 <strong style="color: #34d399;">Master-Detail через __GLOBAL_STORE__!</strong>
                    При выборе проекта автоматически обновляются задачи через глобальное состояние.
                    <span v-if="isSyncManagerReady()" style="color: #60a5fa;">
                      🔄 Используется SyncManager для полной синхронизации.
                    </span>
                  </span>
                  <span v-if="state[privateSymbols.SELECTED_PROJECT]" style="background: rgba(52, 211, 153, 0.1); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.2); font-size: 11px; color: #34d399;">
                    ✅ Выбран: {{ state[privateSymbols.SELECTED_PROJECT].name }}
                  </span>
                  <span v-else style="background: rgba(52, 211, 153, 0.1); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.2); font-size: 11px; color: #4a5a7a;">
                    Выберите проект
                  </span>
                </div>
              </div>
            </div>

            <div style="padding: 12px 16px; background: #0b0e14; border-radius: 8px; border: 1px solid #1e2633; font-size: 11px; color: #4a5a7a; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <span>📦 Сервер: {{ CONFIG.apiBase }}</span>
              <span>📊 Таблиц: 3</span>
              <span>📝 Записей: {{ state[privateSymbols.PROJECTS].length + state[privateSymbols.TASKS].length + state[privateSymbols.USERS].length }}</span>
              <span>🔗 Связей: 2</span>
              <span>🔍 Фильтры: активны</span>
              <span v-if="state[privateSymbols.GLOBAL_STORE_READY]" style="color: #34d399;">✅ Global Store</span>
              <span v-if="isSyncManagerReady()" style="color: #60a5fa;">🔄 Sync Manager</span>
            </div>

          </div>
        </AiAppProviders>
      </n-message-provider>
    </n-config-provider>
  `,
});

// ============================================================
// 35. ★★★ ЗАПУСК — ОСНОВНОЙ ФУНКЦИОНАЛ (ИСПРАВЛЕН) ★★★
// ============================================================

export function mountApp(selector = '#app') {
  // ★★★ ЗАЩИТА ОТ ПОВТОРНОГО МОНТИРОВАНИЯ ★★★
  if (APP_INITIALIZED) {
    logWarn('⚠️ Приложение уже инициализировано', null, 'app');
    return;
  }
  APP_INITIALIZED = true;

  const opId = ID.op('mount_app');
  logInfo(`🚀 Монтирование приложения в ${selector}`, { opId }, 'app');

  const store = getGlobalStore();
  if (!store) {
    logError('❌ __GLOBAL_STORE__ не доступен! Приложение не может работать.', null, 'app');
    showNotification(
      '❌ Критическая ошибка',
      '__GLOBAL_STORE__ не доступен. Перезагрузите страницу.',
      'error'
    );
    return null;
  }

  logInfo(
    `✅ __GLOBAL_STORE__ доступен`,
    {
      storeType: typeof store,
      hasGetTable: typeof store.getTable === 'function',
      hasOn: typeof store.on === 'function',
      hasGetDetails: typeof store.getDetails === 'function',
    },
    'app'
  );

  // ★★★ ПОДПИСКИ НАСТРАИВАЮТСЯ ТОЛЬКО ЗДЕСЬ — ОДИН РАЗ ★★★
  const unsubscribe = setupGlobalStoreSubscriptions();
  if (typeof window !== 'undefined') {
    window.__unsubscribeGlobalStore = unsubscribe;
  }

  const state = getAppState();

  // ★★★ НЕ ЗАГРУЖАЕМ ДАННЫЕ ЗДЕСЬ — ЭТО ДЕЛАЕТ КОМПОНЕНТ App ★★★
  // const loadDataPromise = ... ← УБРАНО!

  const app = createApp(App);
  app.component('AiDataTable', AiDataTable);
  app.component('NConfigProvider', NConfigProvider);
  app.component('NMessageProvider', NMessageProvider);
  app.component('NButton', NButton);
  app.component('NTag', NTag);
  app.component('NFlex', NFlex);
  app.component('NInput', NInput);
  app.component('NSelect', NSelect);
  app.component('NPopconfirm', NPopconfirm);
  app.component('NSpace', NSpace);
  app.component('NCard', NCard);
  app.component('NGrid', NGrid);
  app.component('NGridItem', NGridItem);
  app.component('NDivider', NDivider);
  app.component('NSpin', NSpin);
  app.component('NAlert', NAlert);
  app.component('AiAppProviders', AiAppProviders);
  app.mount(selector);

  logSystem(
    `🚀 Приложение с Global Store и Sync Manager запущено!`,
    {
      opId,
      version: CONFIG.version,
      apiBase: CONFIG.apiBase,
      storeReady: !!getGlobalStore(),
      syncManagerReady: state[PRIVATE_APP.SYNC_MANAGER_READY] || false,
    },
    'system'
  );

  console.log('💡 Синхронизация через __GLOBAL_STORE__!');
  console.log('🔑 Доступ к хранилищу: window.__GLOBAL_STORE__');
  console.log('🔄 Sync Manager: window.__syncManager');
  console.log('📋 Команды:');
  console.log('  window.__app.refreshAll() — обновить все данные');
  console.log('  window.__app.selectProject(project) — выбрать проект (с Master-Detail)');
  console.log('  window.__app.selectTask(task) — выбрать задачу (с Master-Detail)');
  console.log('  window.__app.selectUser(user) — выбрать пользователя (с Master-Detail)');
  console.log('  window.__app.getProjects() — получить проекты');
  console.log('  window.__app.getTasks() — получить задачи');
  console.log('  window.__app.getUsers() — получить пользователей');
  console.log('  window.__app.setFilters(table, filters) — установить фильтры');
  console.log('  window.__app.clearFilters(table) — очистить фильтры');
  console.log('  window.__app.getFilters(table) — получить фильтры');
  console.log('  window.__app.getGlobalStore() — получить глобальное хранилище');
  console.log('  window.__app.getState() — получить состояние');
  console.log('  window.__app.isDataSynced() — проверить синхронизацию данных');
  console.log('  window.__app.isSyncManagerReady() — статус Sync Manager');
  console.log('  window.__app.getSyncManager() — получить Sync Manager');
  console.log('  window.__app.getSyncState() — состояние Sync Manager');
  console.log('  window.__app.getMasterDetailData() — данные Master-Detail');
  console.log('  window.__unsubscribeGlobalStore() — отписаться от событий');
  console.log('  window.__syncManager — менеджер синхронизации');
  console.log('  window.__syncManager.syncAll() — принудительная синхронизация');
  console.log('  window.__syncManager.getState() — состояние Sync Manager');

  return app;
}

// ============================================================
// 36. ГЛОБАЛЬНЫЙ ДОСТУП (100% символы)
// ============================================================

if (typeof window !== 'undefined') {
  const appAPI = {
    refreshAll: () => DataManager[PRIVATE_APP.LOAD_ALL_DATA](),
    loadAllData: () => DataManager[PRIVATE_APP.LOAD_ALL_DATA](),
    refreshTable: (tableName) => DataManager[PRIVATE_APP.REFRESH_TABLE](tableName),
    syncAllData: DataManager.syncAllData,
    isDataSynced: isDataSynced,

    selectProject: (project) => DataManager.selectProject(project),
    getProjects: getProjects,
    getSelectedProject: getSelectedProject,

    selectTask: (task) => DataManager.selectTask(task),
    getTasks: getTasks,
    getSelectedTask: getSelectedTask,

    selectUser: (user) => DataManager.selectUser(user),
    getUsers: getUsers,
    getSelectedUser: getSelectedUser,

    setFilters: (table, filters) => FiltersManager.set(table, filters),
    clearFilters: (table) => FiltersManager.clear(table),
    getFilters: getFilters,
    getAllFilters: () => FiltersManager.getAll(),
    subscribeFilters: (callback) => FiltersManager.subscribe(callback),
    unsubscribeFilters: (id) => FiltersManager.unsubscribe(id),

    getState: getAppState,
    isLoading: isLoading,
    getError: getError,
    isGlobalStoreReady: isGlobalStoreReady,

    isSyncManagerReady: isSyncManagerReady,
    getSyncManager: getSyncManager,
    getSyncState: () => {
      if (isSyncManagerReady()) {
        const syncManager = getSyncManager();
        if (syncManager && typeof syncManager.getState === 'function') {
          return syncManager.getState();
        }
      }
      return null;
    },
    getMasterDetailData: getMasterDetailData,

    getGlobalStore: getGlobalStore,
    getGlobalStoreStatus: () => ({
      available: !!getGlobalStore(),
      ready: APP_STATE[PRIVATE_APP.GLOBAL_STORE_READY],
      subscriptions: APP_STATE[PRIVATE_APP.STORE_SUBSCRIPTIONS]?.length || 0,
      syncManagerReady: APP_STATE[PRIVATE_APP.SYNC_MANAGER_READY],
    }),

    // ★★★ РЕНДЕРИНГ ОТКЛЮЧЕН ★★★
    renderUI: (message) => {
      logDebug(`⏳ UI обновление: ${message} (ОТКЛЮЧЕНО — используется Vue)`, null, 'app');
      return true;
    },
    renderUIImmediate: (message) => {
      logDebug(`🔄 ${message} (ОТКЛЮЧЕНО — используется Vue)`, null, 'app');
      return true;
    },

    getTableInstances: getTableInstances,
    getTableInstance: getTableInstance,
    getTableLoadingState: getTableLoadingState,

    id: ID,
    PRIVATE: PRIVATE_APP,
    PUBLIC: PUBLIC_APP,
    CONFIG: CONFIG,
    logger: logger,
  };

  window.__app = appAPI;
  window.__globalStore = getGlobalStore();
  window.__id = ID;

  if (window.__globalStore) {
    window[GLOBAL_STORE_SYMBOL] = window.__globalStore;
  }

  const privateCount = Object.keys(PRIVATE_APP).length;
  const publicCount = Object.keys(PUBLIC_APP).length;
  const totalCount = privateCount + publicCount;
  const storeStatus = getGlobalStore() ? '✅ ДОСТУПНО' : '❌ НЕДОСТУПНО';
  const syncStatus = isSyncManagerReady() ? '✅ АКТИВЕН' : '❌ НЕ АКТИВЕН';

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 INFOENERGO-APP (100% СИМВОЛЫ) v5.3.20                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║`);
  console.log(`║    🔑 Приватных символов:  ${(privateCount + 2).toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов:  ${(publicCount + 2).toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов:  ${(totalCount + 4).toString().padStart(3, ' ')}                                     ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  ★★★ v5.3.20 — ИСПРАВЛЕНА ДУБЛИРУЮЩАЯ ЗАГРУЗКА ДАННЫХ ★★★                 ║`);
  console.log(`║    ✅ Добавлена проверка наличия данных в хранилище перед загрузкой          ║`);
  console.log(`║    ✅ Убрана дублирующая загрузка в App.onMounted                            ║`);
  console.log(`║    ✅ Состояние обновляется из хранилища если данные уже есть                ║`);
  console.log(`║    ✅ Уменьшено количество лишних API-запросов                               ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТУС ГЛОБАЛЬНОГО ХРАНИЛИЩА:                                          ║`);
  console.log(`║    __GLOBAL_STORE__: ${storeStatus}                                        ║`);
  console.log(`║    Sync Manager: ${syncStatus}                                            ║`);
  console.log(`║    Подписок: ${APP_STATE[PRIVATE_APP.STORE_SUBSCRIPTIONS]?.length || 0}                                   ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.__app.refreshAll() — обновить все данные                          ║');
  console.log('║    window.__app.syncAllData() — принудительная синхронизация                ║');
  console.log('║    window.__app.isDataSynced() — статус синхронизации                       ║');
  console.log('║    window.__app.selectProject(project) — выбрать проект (Master-Detail)     ║');
  console.log('║    window.__app.selectTask(task) — выбрать задачу (Master-Detail)           ║');
  console.log('║    window.__app.selectUser(user) — выбрать пользователя (Master-Detail)     ║');
  console.log('║    window.__app.getProjects() — получить проекты                            ║');
  console.log('║    window.__app.getTasks() — получить задачи                                ║');
  console.log('║    window.__app.getUsers() — получить пользователей                         ║');
  console.log('║    window.__app.setFilters(table, filters) — установить фильтры             ║');
  console.log('║    window.__app.clearFilters(table) — очистить фильтры                      ║');
  console.log('║    window.__app.getFilters(table) — получить фильтры                        ║');
  console.log('║    window.__app.getState() — получить состояние                             ║');
  console.log('║    window.__app.getGlobalStore() — получить глобальное хранилище            ║');
  console.log('║    window.__app.getGlobalStoreStatus() — статус глобального хранилища       ║');
  console.log('║    window.__app.isSyncManagerReady() — статус Sync Manager                  ║');
  console.log('║    window.__app.getSyncManager() — получить Sync Manager                    ║');
  console.log('║    window.__app.getSyncState() — состояние Sync Manager                     ║');
  console.log('║    window.__app.getMasterDetailData() — данные Master-Detail                ║');
  console.log('║    window.__app.logger — доступ к логгеру                                   ║');
  console.log('║    window.__app.PRIVATE — приватные символы                                 ║');
  console.log('║    window.__app.PUBLIC — публичные символы                                  ║');
  console.log('║    window.__app.refreshTable(table) — обновить таблицу                      ║');
  console.log('║    window.__app.getTableInstances() — получить инстансы таблиц              ║');
  console.log('║    window.__app.getTableInstance(name) — получить инстанс таблицы           ║');
  console.log('║    window.__id — генератор ID для отладки                                   ║');
  console.log('║    window.__unsubscribeGlobalStore() — отписаться от событий                ║');
  console.log('║    window.getGlobalStore() — получить хранилище                             ║');
  console.log('║    window.__syncManager — менеджер синхронизации                            ║');
  console.log('║    window.__syncManager.syncAll() — синхронизация                           ║');
  console.log('║    window.__syncManager.getState() — состояние Sync Manager                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  logger.separator();
  logger.info(
    `📋 ГРУППЫ ЛОГОВ:`,
    {
      app: 'Приложение',
      api: 'API-запросы',
      settings: 'Настройки',
      system: 'Системные события',
      events: 'События __GLOBAL_STORE__',
      sync: 'Синхронизация данных',
      render: 'Рендеринг UI ★★★ ОТКЛЮЧЕН ★★★',
    },
    'system'
  );
}

// ============================================================
// 37. АВТОМАТИЧЕСКИЙ ЗАПУСК
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mountApp();
  });
} else {
  mountApp();
}

// ============================================================
// 38. ЭКСПОРТ (100% СИМВОЛЫ)
// ============================================================

export default App;
export {
  PRIVATE_APP,
  PUBLIC_APP,
  CONFIG,
  getAppState,
  getProjects,
  getTasks,
  getUsers,
  getSelectedProject,
  getSelectedTask,
  getSelectedUser,
  FiltersManager,
  DataManager,
  ID,
  SETTINGS_CACHE,
  DISABLE_AUTO_SAVE,
  hasSettingsChanged,
  getUserSettingsDirect,
  setUserSettingsDirect,
  getGlobalStore,
  setupGlobalStoreSubscriptions,
  isGlobalStoreReady,
  isDataSynced,
  isSyncManagerReady,
  getSyncManager,
  getMasterDetailData,
  SyncManager,
  getTableInstances,
  getTableInstance,
  getTableLoadingState,
  setTableInstance,
  setTableLoadingState,
  DISABLE_LEGACY_RENDER,
  APP_INITIALIZED,
  DATA_LOADING,
  SUBSCRIPTIONS_INITIALIZED,
};

// ============================================================
// 39. КОНЕЦ ФАЙЛА
// ============================================================
