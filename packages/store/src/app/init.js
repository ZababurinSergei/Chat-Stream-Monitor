// ============================================================
// init.js — 100% СИМВОЛЫ — инициализация приложения
// Версия: 4.0.8 (МОДУЛЬНАЯ — ПОЛНОСТЬЮ ОБНОВЛЕНА)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db, createStore, GLOBAL_STORE_SYMBOL, DEFAULT_PLUGINS } from '../index.js';
import { CONFIG } from './config.js';
import { PRIVATE, PUBLIC } from './symbols.js';
import { createLogger, addLog } from './logger.js';
import { DOM } from './dom.js';
import {
  getAppState,
  setSelectedTable,
  setSelectedRow,
  getSelectedTable,
  getModalCallback,
  getModalData,
  isModalActive,
  setModalActive,
  setModalCallback,
  setModalData,
  isWelcomeShown,
  setWelcomeShown,
} from './state.js';
import {
  showWelcomeModal,
  showAlertInModal,
  showModal,
  closeModal,
  setupModal as setupModalUI,
} from './modal.js';
import {
  renderAll,
  renderStats,
  renderTables,
  renderData,
  renderInspector,
  renderRelations,
  renderSubscriptions,
  renderMessages,
  renderAudit,
  renderSchemas,
  renderPlugins,
  renderSettings,
  renderLog,
  switchTab,
} from './render/index.js';
import {
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
} from './controllers/tables.js';
import {
  publishMessage,
  addSubscription,
  clearMessages,
  getBrokerStats,
  getTopics,
  getSubscribers,
  getDeadLetter,
  clearDeadLetter,
  processRetryQueue,
  showBrokerStats,
  exportBrokerStats,
} from './controllers/broker.js';
import { executeCommand, clearConsole } from './controllers/console.js';
import { exportData, exportAudit, exportAllData, importData } from './controllers/export.js';
import { initDemoData } from './controllers/demo.js';
import { isFunction, safeCall, escapeHtml, formatJson } from './utils.js';

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE_INIT = {
  // Состояние инициализации
  INIT_RETRY_COUNT: Symbol('init.retryCount'),
  MAX_INIT_RETRIES: Symbol('init.maxRetries'),
  REFRESH_INTERVAL_ID: Symbol('init.refreshIntervalId'),
  IS_INITIALIZING: Symbol('init.isInitializing'),
  INIT_START_TIME: Symbol('init.startTime'),
  INIT_END_TIME: Symbol('init.endTime'),
  INIT_ERRORS: Symbol('init.errors'),
  INIT_WARNINGS: Symbol('init.warnings'),
  INIT_SUCCESS: Symbol('init.success'),

  // Этапы инициализации
  STAGE_STORE: Symbol('init.stage.store'),
  STAGE_GLOBAL: Symbol('init.stage.global'),
  STAGE_MODAL: Symbol('init.stage.modal'),
  STAGE_TABS: Symbol('init.stage.tabs'),
  STAGE_CONTROLS: Symbol('init.stage.controls'),
  STAGE_BROKER: Symbol('init.stage.broker'),
  STAGE_AUDIT: Symbol('init.stage.audit'),
  STAGE_CONSOLE: Symbol('init.stage.console'),
  STAGE_PLUGINS: Symbol('init.stage.plugins'),
  STAGE_REFRESH: Symbol('init.stage.refresh'),
  STAGE_HOTKEYS: Symbol('init.stage.hotkeys'),
  STAGE_DEMO: Symbol('init.stage.demo'),
  STAGE_RENDER: Symbol('init.stage.render'),
  STAGE_SYMBOLS: Symbol('init.stage.symbols'),
  STAGE_GLOBALS: Symbol('init.stage.globals'),
  STAGE_FINAL: Symbol('init.stage.final'),

  // Тайминги
  STAGE_TIMINGS: Symbol('init.stage.timings'),
  TOTAL_TIME: Symbol('init.totalTime'),
};

// ============================================================
// 3. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC_INIT = {
  INSTANCE: Symbol.for('init.instance'),
  STATE: Symbol.for('init.state'),
  CONFIG: Symbol.for('init.config'),
  INIT: Symbol.for('init.init'),
  DESTROY: Symbol.for('init.destroy'),
  GET_STATE: Symbol.for('init.getState'),
  HEALTH_CHECK: Symbol.for('init.healthCheck'),
  GET_GLOBAL_STORE: Symbol.for('init.getGlobalStore'),
  EXPORT_SYMBOLS: Symbol.for('init.exportSymbols'),
  GET_TIMINGS: Symbol.for('init.getTimings'),
  GET_ERRORS: Symbol.for('init.getErrors'),
  GET_WARNINGS: Symbol.for('init.getWarnings'),
};

// ============================================================
// 4. СОСТОЯНИЕ ИНИЦИАЛИЗАЦИИ
// ============================================================

const INIT_STATE = {
  [PRIVATE_INIT.INIT_RETRY_COUNT]: 0,
  [PRIVATE_INIT.MAX_INIT_RETRIES]: 3,
  [PRIVATE_INIT.REFRESH_INTERVAL_ID]: null,
  [PRIVATE_INIT.IS_INITIALIZING]: false,
  [PRIVATE_INIT.INIT_START_TIME]: null,
  [PRIVATE_INIT.INIT_END_TIME]: null,
  [PRIVATE_INIT.INIT_ERRORS]: [],
  [PRIVATE_INIT.INIT_WARNINGS]: [],
  [PRIVATE_INIT.INIT_SUCCESS]: false,
  [PRIVATE_INIT.STAGE_TIMINGS]: new Map(),
  [PRIVATE_INIT.TOTAL_TIME]: 0,
};

// ============================================================
// 5. ЛОГГЕР
// ============================================================

const logger = createLogger(CONFIG.debug, CONFIG.name);
const log = addLog;

// ============================================================
// 6. ГЕТТЕРЫ СОСТОЯНИЯ
// ============================================================

function getInitState() {
  return INIT_STATE;
}

function getPrivateInit(key) {
  return INIT_STATE[key];
}

function setPrivateInit(key, value) {
  INIT_STATE[key] = value;
  return value;
}

// ============================================================
// 7. ЭКСПОРТ СИМВОЛОВ
// ============================================================

export function exportSymbols() {
  if (typeof window !== 'undefined') {
    window.__APP_SYMBOLS = {
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
      PRIVATE_INIT: { ...PRIVATE_INIT },
      PUBLIC_INIT: { ...PUBLIC_INIT },
    };

    window[PUBLIC.INSTANCE] = {
      [PUBLIC.INIT]: init,
      [PUBLIC.DESTROY]: destroy,
      [PUBLIC.RENDER]: renderAll,
      [PUBLIC.GET_STATE]: getState,
      [PUBLIC.HEALTH_CHECK]: healthCheck,
      [PUBLIC.SHOW_MODAL]: showModal,
      [PUBLIC.CLOSE_MODAL]: closeModal,
      [PUBLIC.SELECT_TABLE]: selectTable,
      [PUBLIC.ADD_ROW]: showAddRowModal,
      [PUBLIC.CREATE_TABLE]: showCreateTableModal,
      [PUBLIC.EXECUTE_COMMAND]: executeCommand,
      [PUBLIC.CLEAR_CONSOLE]: clearConsole,
      [PUBLIC.INIT_DEMO]: initDemoData,
      [PUBLIC.GET_GLOBAL_STORE]: getGlobalStore,
      [PUBLIC_INIT.GET_TIMINGS]: getTimings,
      [PUBLIC_INIT.GET_ERRORS]: getErrors,
      [PUBLIC_INIT.GET_WARNINGS]: getWarnings,
    };

    // Статистика символов
    const privateCount = Object.keys(PRIVATE).length + Object.keys(PRIVATE_INIT).length;
    const publicCount = Object.keys(PUBLIC).length + Object.keys(PUBLIC_INIT).length;
    const total = privateCount + publicCount;

    logger.info(
      `🔑 APP SYMBOLS EXPORTED: ${total} (${privateCount} private, ${publicCount} public)`
    );

    // Сохраняем в глобальный объект для отладки
    window.__INIT_SYMBOLS = {
      PRIVATE_INIT: { ...PRIVATE_INIT },
      PUBLIC_INIT: { ...PUBLIC_INIT },
    };
  }
}

// ============================================================
// 8. СОСТОЯНИЕ И HEALTH CHECK
// ============================================================

export function getState() {
  const state = getAppState();
  const initState = getInitState();

  return {
    // Состояние приложения
    selectedTable: state[PRIVATE.SELECTED_TABLE],
    selectedRow: state[PRIVATE.SELECTED_ROW],
    activeTab: state[PRIVATE.ACTIVE_TAB],
    isLogPaused: state[PRIVATE.IS_LOG_PAUSED],
    logCount: state[PRIVATE.LOG_ENTRIES].length,
    messagesCount: state[PRIVATE.MESSAGES].length,
    subscriptionsCount: state[PRIVATE.SUBSCRIPTIONS].length,
    modalActive: state[PRIVATE.MODAL_ACTIVE],
    initialized: state[PRIVATE.INITIALIZED],
    destroyed: state[PRIVATE.DESTROYED],
    startTime: state[PRIVATE.START_TIME],
    lastUpdate: state[PRIVATE.LAST_UPDATE],
    demoLoaded: state[PRIVATE.DEMO_LOADED],
    globalStoreReady: state[PRIVATE.GLOBAL_STORE_READY],
    welcomeShown: state[PRIVATE.WELCOME_SHOWN],
    version: CONFIG.version,
    build: CONFIG.build,
    immerEnabled: CONFIG.immerEnabled,

    // Состояние инициализации
    initSuccess: initState[PRIVATE_INIT.INIT_SUCCESS],
    initRetryCount: initState[PRIVATE_INIT.INIT_RETRY_COUNT],
    initStartTime: initState[PRIVATE_INIT.INIT_START_TIME],
    initEndTime: initState[PRIVATE_INIT.INIT_END_TIME],
    initTotalTime: initState[PRIVATE_INIT.TOTAL_TIME],
    initErrors: initState[PRIVATE_INIT.INIT_ERRORS].length,
    initWarnings: initState[PRIVATE_INIT.INIT_WARNINGS].length,
    isInitializing: initState[PRIVATE_INIT.IS_INITIALIZING],

    timestamp: Date.now(),
  };
}

export function healthCheck() {
  const state = getAppState();
  const initState = getInitState();
  const dbHealth = isFunction(db.healthCheck) ? db.healthCheck() : null;

  return {
    // Основное состояние
    initialized: state[PRIVATE.INITIALIZED],
    destroyed: state[PRIVATE.DESTROYED],
    ready: state[PRIVATE.INITIALIZED] && !state[PRIVATE.DESTROYED],
    dbReady: !!db,
    dbHealth: dbHealth,
    logCount: state[PRIVATE.LOG_ENTRIES].length,
    messagesCount: state[PRIVATE.MESSAGES].length,
    modalActive: state[PRIVATE.MODAL_ACTIVE],
    demoLoaded: state[PRIVATE.DEMO_LOADED],
    globalStoreReady: state[PRIVATE.GLOBAL_STORE_READY],
    welcomeShown: state[PRIVATE.WELCOME_SHOWN],

    // Состояние инициализации
    initSuccess: initState[PRIVATE_INIT.INIT_SUCCESS],
    initErrors: initState[PRIVATE_INIT.INIT_ERRORS].length,
    initWarnings: initState[PRIVATE_INIT.INIT_WARNINGS].length,

    // Метрики
    uptime: Date.now() - state[PRIVATE.START_TIME],
    version: CONFIG.version,
    build: CONFIG.build,
    immerEnabled: CONFIG.immerEnabled,
    timestamp: Date.now(),
  };
}

export function getGlobalStore() {
  const state = getAppState();
  if (typeof window !== 'undefined') {
    const globalStore = window[GLOBAL_STORE_SYMBOL];
    if (globalStore) {
      state[PRIVATE.GLOBAL_STORE_READY] = true;
      return globalStore;
    }
  }
  state[PRIVATE.GLOBAL_STORE_READY] = false;
  return null;
}

// ============================================================
// 9. ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
// ============================================================

export function getTimings() {
  const initState = getInitState();
  const timings = {};
  for (const [key, value] of initState[PRIVATE_INIT.STAGE_TIMINGS]) {
    timings[key] = value;
  }
  return {
    ...timings,
    total: initState[PRIVATE_INIT.TOTAL_TIME],
  };
}

export function getErrors() {
  const initState = getInitState();
  return [...initState[PRIVATE_INIT.INIT_ERRORS]];
}

export function getWarnings() {
  const initState = getInitState();
  return [...initState[PRIVATE_INIT.INIT_WARNINGS]];
}

// ============================================================
// 10. УНИЧТОЖЕНИЕ
// ============================================================

export function destroy() {
  const state = getAppState();
  const initState = getInitState();

  if (state[PRIVATE.DESTROYED]) {
    logger.warn('⚠️ Приложение уже уничтожено');
    return;
  }

  // Остановка авто-обновления
  const intervalId = initState[PRIVATE_INIT.REFRESH_INTERVAL_ID];
  if (intervalId) {
    clearInterval(intervalId);
    setPrivateInit(PRIVATE_INIT.REFRESH_INTERVAL_ID, null);
  }

  state[PRIVATE.DESTROYED] = true;
  state[PRIVATE.INITIALIZED] = false;
  state[PRIVATE.MODAL_ACTIVE] = false;
  state[PRIVATE.LOG_ENTRIES] = [];
  state[PRIVATE.MESSAGES] = [];
  state[PRIVATE.SUBSCRIPTIONS] = [];
  state[PRIVATE.DEMO_LOADED] = false;
  state[PRIVATE.GLOBAL_STORE_READY] = false;
  state[PRIVATE.WELCOME_SHOWN] = false;

  if (typeof window !== 'undefined') {
    delete window.__APP_SYMBOLS;
    delete window.__INIT_SYMBOLS;
    delete window[PUBLIC.INSTANCE];
    delete window.app;
    delete window.__globalStore;
    delete window.__db;
    delete window[GLOBAL_STORE_SYMBOL];
  }

  logger.info('🧹 Приложение уничтожено');
  console.log('✅ Приложение уничтожено');
}

// ============================================================
// 11. ИНИЦИАЛИЗАЦИЯ (ОСНОВНАЯ)
// ============================================================

export function init() {
  // Защита от повторной инициализации
  if (getPrivateInit(PRIVATE_INIT.IS_INITIALIZING)) {
    logger.warn('⚠️ Инициализация уже выполняется');
    return;
  }

  const state = getAppState();

  if (state[PRIVATE.INITIALIZED]) {
    logger.warn('⚠️ Приложение уже инициализировано');
    return;
  }

  // Устанавливаем флаг инициализации
  setPrivateInit(PRIVATE_INIT.IS_INITIALIZING, true);
  setPrivateInit(PRIVATE_INIT.INIT_START_TIME, Date.now());
  setPrivateInit(PRIVATE_INIT.INIT_SUCCESS, false);
  setPrivateInit(PRIVATE_INIT.INIT_ERRORS, []);
  setPrivateInit(PRIVATE_INIT.INIT_WARNINGS, []);

  try {
    logger.header('ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ (100% СИМВОЛЫ + IMMER)');
    logger.info(`📦 Версия: ${CONFIG.version}`);
    logger.info(`📅 Сборка: ${CONFIG.build}`);
    logger.info(`🔄 Immer: ${CONFIG.immerEnabled ? '✅' : '❌'}`);
    logger.info(`🔍 Отладка: ${CONFIG.debug ? '✅' : '❌'}`);
    logger.separator();

    // ============================================================
    // 12. ЭТАПЫ ИНИЦИАЛИЗАЦИИ
    // ============================================================

    // Этап 1: Хранилище
    const stageStore = measureStage(PRIVATE_INIT.STAGE_STORE, () => {
      if (!db) {
        throw new Error('Хранилище не доступно!');
      }
      if (!initializeStore()) {
        throw new Error('Не удалось инициализировать хранилище');
      }
      logger.success('✅ Хранилище готово');
    });

    // Этап 2: Глобальное хранилище
    const stageGlobal = measureStage(PRIVATE_INIT.STAGE_GLOBAL, () => {
      setupGlobalStore();
    });

    // Этап 3: Модальное окно
    const stageModal = measureStage(PRIVATE_INIT.STAGE_MODAL, () => {
      setupModalUI();
    });

    // Этап 4: Табы
    const stageTabs = measureStage(PRIVATE_INIT.STAGE_TABS, () => {
      setupTabs();
    });

    // Этап 5: Кнопки управления
    const stageControls = measureStage(PRIVATE_INIT.STAGE_CONTROLS, () => {
      setupControlButtons();
    });

    // Этап 6: Брокер
    const stageBroker = measureStage(PRIVATE_INIT.STAGE_BROKER, () => {
      setupBroker();
    });

    // Этап 7: Аудит
    const stageAudit = measureStage(PRIVATE_INIT.STAGE_AUDIT, () => {
      setupAudit();
    });

    // Этап 8: Консоль
    const stageConsole = measureStage(PRIVATE_INIT.STAGE_CONSOLE, () => {
      setupConsole();
    });

    // Этап 9: Плагины
    const stagePlugins = measureStage(PRIVATE_INIT.STAGE_PLUGINS, () => {
      setupPlugins();
    });

    // Этап 10: Авто-обновление
    const stageRefresh = measureStage(PRIVATE_INIT.STAGE_REFRESH, () => {
      setupAutoRefresh();
    });

    // Этап 11: Горячие клавиши
    const stageHotkeys = measureStage(PRIVATE_INIT.STAGE_HOTKEYS, () => {
      setupHotkeys();
    });

    // Этап 12: Демо-данные
    const stageDemo = measureStage(PRIVATE_INIT.STAGE_DEMO, () => {
      initDemoData();
    });

    // Этап 13: Рендеринг
    const stageRender = measureStage(PRIVATE_INIT.STAGE_RENDER, () => {
      renderAll();
    });

    // Этап 14: Экспорт символов
    const stageSymbols = measureStage(PRIVATE_INIT.STAGE_SYMBOLS, () => {
      exportSymbols();
    });

    // Этап 15: Глобальные переменные
    const stageGlobals = measureStage(PRIVATE_INIT.STAGE_GLOBALS, () => {
      setupGlobals();
    });

    // ============================================================
    // 13. ФИНАЛИЗАЦИЯ
    // ============================================================

    // ★★★ ПОКАЗЫВАЕМ ПРИВЕТСТВЕННОЕ МОДАЛЬНОЕ ОКНО (ТОЛЬКО ОДИН РАЗ) ★★★
    if (CONFIG.showWelcomeModal && !isWelcomeShown()) {
      setTimeout(() => {
        showWelcomeModal();
        setWelcomeShown(true);
      }, CONFIG.timeouts?.welcomeModalDelay || 500);
    }

    // Обновление состояния
    state[PRIVATE.INITIALIZED] = true;
    state[PRIVATE.DESTROYED] = false;
    state[PRIVATE.START_TIME] = Date.now();
    state[PRIVATE.LAST_UPDATE] = Date.now();

    // Вычисляем общее время
    const endTime = Date.now();
    const totalTime = endTime - getPrivateInit(PRIVATE_INIT.INIT_START_TIME);
    setPrivateInit(PRIVATE_INIT.INIT_END_TIME, endTime);
    setPrivateInit(PRIVATE_INIT.TOTAL_TIME, totalTime);
    setPrivateInit(PRIVATE_INIT.INIT_SUCCESS, true);

    // Вывод финальной информации
    printFinalInfo();

    // Сброс флага инициализации
    setPrivateInit(PRIVATE_INIT.IS_INITIALIZING, false);
    setPrivateInit(PRIVATE_INIT.INIT_RETRY_COUNT, 0);

    logger.success('✅ Приложение инициализировано');

    if (isFunction(db.listTables)) {
      const tables = db.listTables();
      logger.info(`📊 Таблиц: ${tables ? tables.length : 0}`);
    }

    // Вывод статистики инициализации
    printInitStats();
  } catch (error) {
    setPrivateInit(PRIVATE_INIT.IS_INITIALIZING, false);
    const errors = getPrivateInit(PRIVATE_INIT.INIT_ERRORS);
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
    setPrivateInit(PRIVATE_INIT.INIT_ERRORS, errors);

    logger.error('❌ Критическая ошибка инициализации:', error);
    showAlertInModal(
      '❌ Критическая ошибка',
      `Не удалось инициализировать приложение: ${error.message}`,
      'error'
    );
    console.error('❌ Критическая ошибка инициализации:', error);
    throw error;
  }
}

// ============================================================
// 14. ИЗМЕРЕНИЕ ЭТАПОВ
// ============================================================

function measureStage(stageSymbol, fn) {
  const start = performance.now();
  const timings = getPrivateInit(PRIVATE_INIT.STAGE_TIMINGS);

  try {
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    timings.set(stageSymbol, {
      duration,
      success: true,
      start,
      end,
    });
    return { success: true, duration, result };
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    timings.set(stageSymbol, {
      duration,
      success: false,
      start,
      end,
      error: error.message,
    });
    throw error;
  }
}

// ============================================================
// 15. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ИНИЦИАЛИЗАЦИИ
// ============================================================

function initializeStore() {
  const requiredMethods = ['listTables', 'getTable', 'createTable', 'insert', 'select'];
  const missingMethods = requiredMethods.filter(method => !isFunction(db[method]));

  if (missingMethods.length === 0) {
    return true;
  }

  logger.warn(`⚠️ Отсутствуют методы: ${missingMethods.join(', ')}`);
  logger.info('🔄 Пытаемся инициализировать хранилище...');

  if (!isFunction(createStore)) {
    logger.error('❌ createStore не доступен');
    showAlertInModal('❌ Ошибка', 'createStore не доступен. Перезагрузите страницу.', 'error');
    return false;
  }

  try {
    const newStore = createStore({
      plugins: DEFAULT_PLUGINS,
      devtools: false,
      immerEnabled: CONFIG.immerEnabled,
    });

    if (newStore) {
      Object.assign(db, newStore);
      return true;
    }
  } catch (error) {
    if (error.message && error.message.includes('Redux devtools')) {
      logger.warn('⚠️ Redux Devtools не установлен, создаем хранилище без него');
      try {
        const newStore = createStore({
          plugins: DEFAULT_PLUGINS,
          devtools: false,
          immerEnabled: CONFIG.immerEnabled,
        });
        if (newStore) {
          Object.assign(db, newStore);
          return true;
        }
      } catch (innerError) {
        logger.error(`❌ Ошибка создания хранилища: ${innerError.message}`);
        showAlertInModal(
          '❌ Ошибка',
          `Не удалось создать хранилище: ${innerError.message}`,
          'error'
        );
        return false;
      }
    } else {
      logger.error(`❌ Ошибка создания хранилища: ${error.message}`);
      showAlertInModal('❌ Ошибка', `Не удалось создать хранилище: ${error.message}`, 'error');
      return false;
    }
  }

  return false;
}

function setupGlobalStore() {
  if (typeof window !== 'undefined') {
    const globalStore = window[GLOBAL_STORE_SYMBOL];
    const state = getAppState();

    if (globalStore) {
      state[PRIVATE.GLOBAL_STORE_READY] = true;
      logger.success('✅ Глобальное хранилище найдено');
    } else {
      state[PRIVATE.GLOBAL_STORE_READY] = false;
      logger.info('ℹ️ Глобальное хранилище не найдено, будет создано');
      window[GLOBAL_STORE_SYMBOL] = db;
      state[PRIVATE.GLOBAL_STORE_READY] = true;
      logger.success('✅ Глобальное хранилище создано');
    }
  }
}

function setupTabs() {
  if (DOM.tabs) {
    DOM.tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) {
        switchTab(tab.dataset.tab);
      }
    });
    logger.info('✅ Табы настроены');
  } else {
    const warning = '⚠️ DOM.tabs не найден';
    const warnings = getPrivateInit(PRIVATE_INIT.INIT_WARNINGS);
    warnings.push({ message: warning, timestamp: Date.now() });
    setPrivateInit(PRIVATE_INIT.INIT_WARNINGS, warnings);
    logger.warn(warning);
  }
}

function setupControlButtons() {
  // Кнопка обновления
  if (DOM.refreshBtn) {
    DOM.refreshBtn.addEventListener('click', () => {
      renderAll();
      logger.info('🔄 Данные обновлены');
    });
  }

  // Кнопка сохранения
  if (DOM.saveBtn) {
    DOM.saveBtn.addEventListener('click', () => {
      if (isFunction(db.save)) {
        db.save();
        logger.success('💾 Данные сохранены');
        showAlertInModal('💾 Сохранено', 'Данные успешно сохранены в localStorage.', 'success');
      } else {
        showAlertInModal(
          '⚠️ Плагин не установлен',
          'Плагин Persistence не доступен или не установлен.',
          'warning'
        );
      }
    });
  }

  // Кнопка загрузки
  if (DOM.loadBtn) {
    DOM.loadBtn.addEventListener('click', () => {
      if (isFunction(db.load)) {
        db.load();
        renderAll();
        logger.success('📂 Данные загружены');
        showAlertInModal('📂 Загружено', 'Данные успешно загружены из localStorage.', 'success');
      } else {
        showAlertInModal(
          '⚠️ Плагин не установлен',
          'Плагин Persistence не доступен или не установлен.',
          'warning'
        );
      }
    });
  }

  // Кнопка очистки
  if (DOM.clearBtn) {
    DOM.clearBtn.addEventListener('click', () => {
      showModal(
        '🧹 Очистка всех данных',
        `<p style="color:var(--es-text-muted);">Вы уверены, что хотите очистить <strong>все данные</strong>? Это действие необратимо!</p>`,
        () => {
          if (isFunction(db.clear)) {
            db.clear();
          } else if (isFunction(db.listTables)) {
            const tables = db.listTables();
            for (const name of tables) {
              if (isFunction(db.clearTable)) {
                db.clearTable(name);
              }
            }
          }
          setSelectedTable(null);
          setSelectedRow(null);
          renderAll();
          logger.warn('🧹 Все данные очищены');
          showAlertInModal('🧹 Очищено', 'Все данные успешно очищены.', 'success');
        },
        () => {
          logger.info('ℹ️ Очистка данных отменена');
        }
      );
    });
  }

  // Кнопки таблиц
  if (DOM.createTableBtn) {
    DOM.createTableBtn.addEventListener('click', () => showCreateTableModal(false));
  }
  if (DOM.createTableWithSchemaBtn) {
    DOM.createTableWithSchemaBtn.addEventListener('click', () => showCreateTableModal(true));
  }
  if (DOM.addRowBtn) {
    DOM.addRowBtn.addEventListener('click', showAddRowModal);
  }

  // Кнопки данных
  if (DOM.refreshDataBtn) {
    DOM.refreshDataBtn.addEventListener('click', () => {
      renderData();
      logger.info('🔄 Данные таблицы обновлены');
    });
  }
  if (DOM.exportDataBtn) {
    DOM.exportDataBtn.addEventListener('click', exportData);
  }

  // Кнопки инспектора
  if (DOM.inspectorRefresh) {
    DOM.inspectorRefresh.addEventListener('click', renderInspector);
  }

  // Кнопки связей
  if (DOM.linkTablesBtn) {
    DOM.linkTablesBtn.addEventListener('click', showLinkTablesModal);
  }
  if (DOM.unlinkTablesBtn) {
    DOM.unlinkTablesBtn.addEventListener('click', () => {
      showAlertInModal('ℹ️ Информация', 'Выберите связь в списке для удаления.', 'info');
    });
  }

  logger.info('✅ Кнопки управления настроены');
}

function setupBroker() {
  if (DOM.publishBtn) {
    DOM.publishBtn.addEventListener('click', publishMessage);
  }
  if (DOM.addSubscriptionBtn) {
    DOM.addSubscriptionBtn.addEventListener('click', addSubscription);
  }
  if (DOM.clearMessagesBtn) {
    DOM.clearMessagesBtn.addEventListener('click', clearMessages);
  }
  logger.info('✅ Брокер настроен');
}

function setupAudit() {
  if (DOM.clearAuditBtn) {
    DOM.clearAuditBtn.addEventListener('click', () => {
      showModal(
        '🧹 Очистка аудита',
        `<p style="color:var(--es-text-muted);">Вы уверены, что хотите очистить все записи аудита?</p>`,
        () => {
          if (isFunction(db.clearAudit)) {
            db.clearAudit();
            renderAudit();
            logger.info('🧹 Аудит очищен');
            showAlertInModal('🧹 Очищено', 'Аудит успешно очищен.', 'success');
          }
        },
        () => {
          logger.info('ℹ️ Очистка аудита отменена');
        }
      );
    });
  }
  if (DOM.exportAuditBtn) {
    DOM.exportAuditBtn.addEventListener('click', exportAudit);
  }
  logger.info('✅ Аудит настроен');
}

function setupConsole() {
  if (DOM.consoleInput) {
    DOM.consoleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        executeCommand();
      }
    });
  }
  if (DOM.consoleExecBtn) {
    DOM.consoleExecBtn.addEventListener('click', executeCommand);
  }
  if (DOM.clearConsoleBtn) {
    DOM.clearConsoleBtn.addEventListener('click', clearConsole);
  }
  logger.info('✅ Консоль настроена');
}

function setupPlugins() {
  if (DOM.pluginManagerBtn) {
    DOM.pluginManagerBtn.addEventListener('click', () => {
      if (isFunction(db.listPlugins)) {
        const plugins = db.listPlugins();
        const pluginList = plugins.length > 0 ? plugins.join('\n') : 'Нет плагинов';
        showAlertInModal('🔌 Плагины', `Активные плагины:\n${pluginList}`, 'info');
      } else {
        showAlertInModal('ℹ️ Информация', 'Плагины не доступны.', 'info');
      }
    });
  }
  logger.info('✅ Плагины настроены');
}

function setupAutoRefresh() {
  if (CONFIG.autoRefresh) {
    const intervalId = setInterval(() => {
      const state = getAppState();
      if (!state[PRIVATE.DESTROYED] && state[PRIVATE.INITIALIZED]) {
        renderStats();
        const activeTab = state[PRIVATE.ACTIVE_TAB];
        if (activeTab === 'data') {
          renderData();
          renderInspector();
        }
      }
    }, CONFIG.refreshInterval || 5000);

    setPrivateInit(PRIVATE_INIT.REFRESH_INTERVAL_ID, intervalId);
    logger.info(`🔄 Авто-обновление: ${CONFIG.refreshInterval}ms`);
  }
}

function setupHotkeys() {
  document.addEventListener('keydown', e => {
    // Ctrl+Z — Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (isFunction(db.undo)) {
        db.undo();
        renderAll();
        logger.info('↩️ Undo');
      }
    }

    // Ctrl+Y — Redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      if (isFunction(db.redo)) {
        db.redo();
        renderAll();
        logger.info('↪️ Redo');
      }
    }

    // Ctrl+N — Новая таблица
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      showCreateTableModal(false);
    }

    // Ctrl+S — Сохранить
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (DOM.saveBtn) DOM.saveBtn.click();
    }

    // Ctrl+L — Загрузить
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      if (DOM.loadBtn) DOM.loadBtn.click();
    }

    // Ctrl+Shift+R — Очистить консоль
    if (e.ctrlKey && e.shiftKey && e.key === 'r') {
      e.preventDefault();
      clearConsole();
    }

    // Ctrl+Shift+S — Экспорт
    if (e.ctrlKey && e.shiftKey && e.key === 's') {
      e.preventDefault();
      exportData();
    }

    // Ctrl+Shift+A — Экспорт аудита
    if (e.ctrlKey && e.shiftKey && e.key === 'a') {
      e.preventDefault();
      exportAudit();
    }

    // F5 — Обновить
    if (e.key === 'F5') {
      e.preventDefault();
      renderAll();
      logger.info('🔄 Принудительное обновление');
    }
  });

  logger.info('✅ Горячие клавиши настроены');
}

function setupGlobals() {
  if (typeof window !== 'undefined') {
    window.__globalStore = db;
    window.__db = db;
    window[GLOBAL_STORE_SYMBOL] = db;

    // Полный API приложения
    window.app = {
      // Рендеринг
      render: renderAll,
      renderStats,
      renderTables,
      renderData,
      renderInspector,
      renderRelations,
      renderSubscriptions,
      renderMessages,
      renderAudit,
      renderSchemas,
      renderPlugins,
      renderSettings,
      renderLog,

      // Управление
      selectTable,
      addRow: showAddRowModal,
      createTable: showCreateTableModal,
      linkTables: showLinkTablesModal,

      // Брокер
      publish: publishMessage,
      subscribe: addSubscription,
      clearMessages,
      getBrokerStats,
      getTopics,
      getSubscribers,
      getDeadLetter,
      clearDeadLetter,
      processRetryQueue,
      showBrokerStats,
      exportBrokerStats,

      // Консоль
      executeCommand,
      clearConsole,

      // Экспорт
      exportData,
      exportAudit,
      exportAllData,
      importData,

      // Состояние
      getState,
      healthCheck,
      getGlobalStore,

      // Демо
      initDemo: initDemoData,

      // Модалки
      showModal,
      closeModal,
      showAlert: showAlertInModal,

      // Системные
      destroy,
      init,

      // Доступ к хранилищу
      db,

      // Сброс флага приветственного окна (для отладки)
      resetWelcomeModalFlag: () => {
        setWelcomeShown(false);
        console.log('🔄 Флаг приветственного окна сброшен');
      },

      // Символы
      symbols: {
        PRIVATE,
        PUBLIC,
        PRIVATE_INIT,
        PUBLIC_INIT,
      },

      // Конфигурация
      config: CONFIG,

      // Инициализация
      getTimings,
      getErrors,
      getWarnings,
    };

    // Добавляем команды в консоль
    console.log('✅ app доступен в консоли как window.app');
    console.log('📋 Основные команды:');
    console.log('  app.render() — обновить интерфейс');
    console.log('  app.selectTable(name) — выбрать таблицу');
    console.log('  app.addRow() — добавить строку');
    console.log('  app.createTable() — создать таблицу');
    console.log('  app.executeCommand(code) — выполнить код');
    console.log('  app.showModal(title, html, callback) — показать модалку');
    console.log('  app.getState() — получить состояние');
    console.log('  app.healthCheck() — проверка целостности');
    console.log('  app.initDemo() — загрузить демо-данные');
    console.log('  app.db — доступ к хранилищу');
    console.log('  app.symbols — все символы приложения');
    console.log('  app.config — конфигурация');
    console.log('  app.destroy() — уничтожить приложение');
    console.log('  app.getTimings() — время инициализации');
    console.log('  app.getErrors() — ошибки инициализации');
    console.log('  app.getWarnings() — предупреждения инициализации');
    console.log('  app.resetWelcomeModalFlag() — сбросить флаг приветственного окна');

    // Статистика символов
    const privateCount = Object.keys(PRIVATE).length + Object.keys(PRIVATE_INIT).length;
    const publicCount = Object.keys(PUBLIC).length + Object.keys(PUBLIC_INIT).length;
    console.log(
      `\n🔑 СИМВОЛЫ: ${privateCount + publicCount} (${privateCount} приватных, ${publicCount} публичных)`
    );

    // Пример использования
    console.log('\n📋 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:');
    console.log('  // Создать таблицу');
    console.log('  app.createTable();');
    console.log('  // Добавить запись');
    console.log('  app.addRow();');
    console.log('  // Выполнить код');
    console.log('  app.executeCommand("db.listTables()");');
    console.log('  // Показать модалку');
    console.log('  app.showModal("Привет", "<p>Тест</p>", () => console.log("OK"));');
    console.log('  // Получить время инициализации');
    console.log('  app.getTimings();');
    console.log('  // Сбросить флаг приветственного окна');
    console.log('  app.resetWelcomeModalFlag();');
  }
}

// ============================================================
// 16. ВЫВОД ФИНАЛЬНОЙ ИНФОРМАЦИИ
// ============================================================

function printFinalInfo() {
  const privateCount = Object.keys(PRIVATE).length + Object.keys(PRIVATE_INIT).length;
  const publicCount = Object.keys(PUBLIC).length + Object.keys(PUBLIC_INIT).length;
  const state = getAppState();
  const initState = getInitState();
  const totalTime = initState[PRIVATE_INIT.TOTAL_TIME];

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🏢 GLOBAL STORE ADMIN v4.0.8 (С IMMER)                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  🔑 Символ: __GLOBAL_STORE__                                               ║');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.__globalStore — доступ к хранилищу                                ║');
  console.log('║    window.__db — прокси для доступа к таблицам                              ║');
  console.log('║    window[Symbol.for("__GLOBAL_STORE__")] — доступ через символ             ║');
  console.log('║    window.app — полный API приложения                                      ║');
  console.log('║    window.app.render() — обновить интерфейс                                 ║');
  console.log('║    window.app.selectTable(name) — выбрать таблицу                           ║');
  console.log('║    window.app.addRow() — добавить строку                                    ║');
  console.log('║    window.app.createTable() — создать таблицу                               ║');
  console.log('║    window.app.executeCommand(code) — выполнить код                          ║');
  console.log('║    window.app.showModal(title, html, callback) — показать модалку           ║');
  console.log('║    window.app.closeModal() — закрыть модалку                                ║');
  console.log('║    window.app.initDemo() — загрузить демо-данные                            ║');
  console.log('║    window.app.getGlobalStore() — получить глобальное хранилище              ║');
  console.log('║    window.app.getTimings() — время инициализации                            ║');
  console.log('║    window.app.getErrors() — ошибки инициализации                            ║');
  console.log('║    window.app.getWarnings() — предупреждения инициализации                  ║');
  console.log('║    window.app.resetWelcomeModalFlag() — сбросить флаг приветственного окна  ║');
  console.log('║  ⌨️ Горячие клавиши:                                                         ║');
  console.log('║    Ctrl+Z — Undo                                                            ║');
  console.log('║    Ctrl+Y — Redo                                                            ║');
  console.log('║    Ctrl+N — Новая таблица                                                   ║');
  console.log('║    Ctrl+S — Сохранить                                                       ║');
  console.log('║    Ctrl+L — Загрузить                                                       ║');
  console.log('║    Ctrl+Shift+R — Очистить консоль                                          ║');
  console.log('║    Ctrl+Shift+S — Экспорт данных                                            ║');
  console.log('║    Ctrl+Shift+A — Экспорт аудита                                            ║');
  console.log('║    F5 — Обновить интерфейс                                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА:                                                             ║');
  const tables = isFunction(db.listTables) ? db.listTables() : [];
  console.log(
    `║    📋 Таблиц: ${tables.length.toString().padStart(3, ' ')}                                                ║`
  );
  const health = isFunction(db.healthCheck) ? db.healthCheck() : {};
  console.log(
    `║    📝 Записей: ${(health.records || 0).toString().padStart(3, ' ')}                                                ║`
  );
  console.log(
    `║    🔗 Связей: ${(health.relations || 0).toString().padStart(3, ' ')}                                                ║`
  );
  console.log(
    `║    📡 Подписчиков: ${(health.listeners || 0).toString().padStart(3, ' ')}                                              ║`
  );
  console.log(
    `║    🔌 Плагинов: ${(health.plugins || 0).toString().padStart(3, ' ')}                                               ║`
  );
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
  console.log(
    `║    🔄 Immer: ${CONFIG.immerEnabled ? '✅' : '❌'}                                                       ║`
  );
  console.log(
    `║    ⏱ Uptime: ${formatUptime(Date.now() - state[PRIVATE.START_TIME])}                                                 ║`
  );
  console.log(
    `║    ⏱ Инициализация: ${totalTime}ms                                                 ║`
  );
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 17. СТАТИСТИКА ИНИЦИАЛИЗАЦИИ
// ============================================================

function printInitStats() {
  const timings = getPrivateInit(PRIVATE_INIT.STAGE_TIMINGS);
  const errors = getPrivateInit(PRIVATE_INIT.INIT_ERRORS);
  const warnings = getPrivateInit(PRIVATE_INIT.INIT_WARNINGS);

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  ⏱ СТАТИСТИКА ИНИЦИАЛИЗАЦИИ                                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');

  const stageNames = {
    [PRIVATE_INIT.STAGE_STORE]: 'Хранилище',
    [PRIVATE_INIT.STAGE_GLOBAL]: 'Глобальное хранилище',
    [PRIVATE_INIT.STAGE_MODAL]: 'Модальное окно',
    [PRIVATE_INIT.STAGE_TABS]: 'Табы',
    [PRIVATE_INIT.STAGE_CONTROLS]: 'Кнопки управления',
    [PRIVATE_INIT.STAGE_BROKER]: 'Брокер',
    [PRIVATE_INIT.STAGE_AUDIT]: 'Аудит',
    [PRIVATE_INIT.STAGE_CONSOLE]: 'Консоль',
    [PRIVATE_INIT.STAGE_PLUGINS]: 'Плагины',
    [PRIVATE_INIT.STAGE_REFRESH]: 'Авто-обновление',
    [PRIVATE_INIT.STAGE_HOTKEYS]: 'Горячие клавиши',
    [PRIVATE_INIT.STAGE_DEMO]: 'Демо-данные',
    [PRIVATE_INIT.STAGE_RENDER]: 'Рендеринг',
    [PRIVATE_INIT.STAGE_SYMBOLS]: 'Экспорт символов',
    [PRIVATE_INIT.STAGE_GLOBALS]: 'Глобальные переменные',
  };

  for (const [symbol, timing] of timings) {
    const name = stageNames[symbol] || String(symbol);
    const status = timing.success ? '✅' : '❌';
    console.log(
      `║    ${status} ${name.padEnd(20)} ${timing.duration.toFixed(2)}ms${timing.error ? ` (${timing.error})` : ''}`
    );
  }

  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');

  if (errors.length > 0) {
    console.log(
      `║  ❌ ОШИБКИ (${errors.length}):                                                 ║`
    );
    for (const error of errors) {
      console.log(
        `║    ${error.message.substring(0, 60)}${error.message.length > 60 ? '...' : ''}`
      );
    }
    console.log(
      '║                                                                               ║'
    );
  }

  if (warnings.length > 0) {
    console.log(
      `║  ⚠️ ПРЕДУПРЕЖДЕНИЯ (${warnings.length}):                                           ║`
    );
    for (const warning of warnings) {
      console.log(
        `║    ${warning.message.substring(0, 60)}${warning.message.length > 60 ? '...' : ''}`
      );
    }
    console.log(
      '║                                                                               ║'
    );
  }

  const totalTime = getPrivateInit(PRIVATE_INIT.TOTAL_TIME);
  console.log(`║  ⏱ ОБЩЕЕ ВРЕМЯ: ${totalTime}ms                                                ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 18. ФОРМАТИРОВАНИЕ ВРЕМЕНИ
// ============================================================

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}д ${hours % 24}ч ${minutes % 60}м`;
  if (hours > 0) return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
  if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
  return `${seconds}с`;
}

// ============================================================
// 19. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  init,
  destroy,
  getState,
  healthCheck,
  getGlobalStore,
  exportSymbols,
  getTimings,
  getErrors,
  getWarnings,
  PRIVATE_INIT,
  PUBLIC_INIT,
};

// ============================================================
// 20. СТАТИСТИКА СИМВОЛОВ (ПРИ ЗАГРУЗКЕ)
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length + Object.keys(PRIVATE_INIT).length;
  const publicCount = Object.keys(PUBLIC).length + Object.keys(PUBLIC_INIT).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 INIT MODULE (100% СИМВОЛЫ) v4.0.8                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║`);
  console.log(
    `║    🔑 Приватных символов INIT: ${Object.keys(PRIVATE_INIT).length.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    🔓 Публичных символов INIT: ${Object.keys(PUBLIC_INIT).length.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║    📦 Всего символов INIT: ${(Object.keys(PRIVATE_INIT).length + Object.keys(PUBLIC_INIT).length).toString().padStart(3, ' ')}                                     ║`
  );
  console.log(
    `║    🔑 Всего приватных: ${privateCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    🔓 Всего публичных: ${publicCount.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║    📦 ИТОГО СИМВОЛОВ: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ЭТАПЫ ИНИЦИАЛИЗАЦИИ:                                                   ║');
  console.log('║    ✅ Store — хранилище                                                    ║');
  console.log('║    ✅ Global — глобальное хранилище                                        ║');
  console.log('║    ✅ Modal — модальное окно                                               ║');
  console.log('║    ✅ Tabs — табы                                                          ║');
  console.log('║    ✅ Controls — кнопки управления                                         ║');
  console.log('║    ✅ Broker — брокер сообщений                                           ║');
  console.log('║    ✅ Audit — аудит                                                         ║');
  console.log('║    ✅ Console — консоль                                                    ║');
  console.log('║    ✅ Plugins — плагины                                                    ║');
  console.log('║    ✅ Refresh — авто-обновление                                            ║');
  console.log('║    ✅ Hotkeys — горячие клавиши                                            ║');
  console.log('║    ✅ Demo — демо-данные                                                   ║');
  console.log('║    ✅ Render — рендеринг                                                    ║');
  console.log('║    ✅ Symbols — экспорт символов                                           ║');
  console.log('║    ✅ Globals — глобальные переменные                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 21. КОНЕЦ ФАЙЛА
// ============================================================
