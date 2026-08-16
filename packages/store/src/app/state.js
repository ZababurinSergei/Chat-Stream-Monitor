// ============================================================
// app/state.js — 100% СИМВОЛЫ — состояние приложения
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

import { PRIVATE } from './symbols.js';
import { CONFIG } from './config.js';

// ============================================================
// 1. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (100% символы)
// ============================================================

export const APP_STATE = {
  // Основные символы состояния
  [PRIVATE.SELECTED_TABLE]: null,
  [PRIVATE.SELECTED_ROW]: null,
  [PRIVATE.ACTIVE_TAB]: 'data',
  [PRIVATE.IS_LOG_PAUSED]: false,
  [PRIVATE.LOG_ENTRIES]: [],
  [PRIVATE.MAX_LOG]: CONFIG.maxLogEntries,
  [PRIVATE.MESSAGES]: [],
  [PRIVATE.SUBSCRIPTIONS]: [],
  [PRIVATE.MESSAGE_COUNT]: 0,
  [PRIVATE.MODAL_CALLBACK]: null,
  [PRIVATE.MODAL_DATA]: null,
  [PRIVATE.MODAL_ACTIVE]: false,
  [PRIVATE.INITIALIZED]: false,
  [PRIVATE.DESTROYED]: false,
  [PRIVATE.START_TIME]: Date.now(),
  [PRIVATE.LAST_UPDATE]: null,
  [PRIVATE.DEMO_LOADED]: false,
  [PRIVATE.GLOBAL_STORE_READY]: false,
  [PRIVATE.WELCOME_SHOWN]: false, // ★★★ НОВОЕ СОСТОЯНИЕ ★★★

  // Дополнительные состояния
  [PRIVATE.REFS]: {},
  [PRIVATE.CONFIG]: { ...CONFIG },
};

// ============================================================
// 2. БАЗОВЫЕ ГЕТТЕРЫ И СЕТТЕРЫ
// ============================================================

/**
 * Получить все состояние приложения
 */
export function getAppState() {
  return APP_STATE;
}

/**
 * Получить приватное значение по ключу
 */
export function getPrivate(key) {
  return APP_STATE[key];
}

/**
 * Установить приватное значение
 */
export function setPrivate(key, value) {
  APP_STATE[key] = value;
  return value;
}

/**
 * Проверить существование ключа в состоянии
 */
export function hasPrivate(key) {
  return key in APP_STATE;
}

// ============================================================
// 3. ГЕТТЕРЫ ДЛЯ КОНКРЕТНЫХ ПОЛЕЙ
// ============================================================

/**
 * Получить выбранную таблицу
 */
export function getSelectedTable() {
  return APP_STATE[PRIVATE.SELECTED_TABLE];
}

/**
 * Получить выбранную строку
 */
export function getSelectedRow() {
  return APP_STATE[PRIVATE.SELECTED_ROW];
}

/**
 * Получить активный таб
 */
export function getActiveTab() {
  return APP_STATE[PRIVATE.ACTIVE_TAB];
}

/**
 * Проверить, приостановлены ли логи
 */
export function isLogPaused() {
  return APP_STATE[PRIVATE.IS_LOG_PAUSED];
}

/**
 * Получить все записи логов
 */
export function getLogEntries() {
  return APP_STATE[PRIVATE.LOG_ENTRIES];
}

/**
 * Получить сообщения брокера
 */
export function getMessages() {
  return APP_STATE[PRIVATE.MESSAGES];
}

/**
 * Получить подписки
 */
export function getSubscriptions() {
  return APP_STATE[PRIVATE.SUBSCRIPTIONS];
}

/**
 * Получить количество сообщений
 */
export function getMessageCount() {
  return APP_STATE[PRIVATE.MESSAGE_COUNT];
}

/**
 * Проверить, активна ли модалка
 */
export function isModalActive() {
  return APP_STATE[PRIVATE.MODAL_ACTIVE];
}

/**
 * Получить данные модалки
 */
export function getModalData() {
  return APP_STATE[PRIVATE.MODAL_DATA];
}

/**
 * Получить callback модалки
 */
export function getModalCallback() {
  return APP_STATE[PRIVATE.MODAL_CALLBACK];
}

/**
 * Инициализировано ли приложение
 */
export function isInitialized() {
  return APP_STATE[PRIVATE.INITIALIZED];
}

/**
 * Уничтожено ли приложение
 */
export function isDestroyed() {
  return APP_STATE[PRIVATE.DESTROYED];
}

/**
 * Получить время запуска
 */
export function getStartTime() {
  return APP_STATE[PRIVATE.START_TIME];
}

/**
 * Получить время последнего обновления
 */
export function getLastUpdate() {
  return APP_STATE[PRIVATE.LAST_UPDATE];
}

/**
 * Загружены ли демо-данные
 */
export function isDemoLoaded() {
  return APP_STATE[PRIVATE.DEMO_LOADED];
}

/**
 * Готово ли глобальное хранилище
 */
export function isGlobalStoreReady() {
  return APP_STATE[PRIVATE.GLOBAL_STORE_READY];
}

// ★★★ НОВЫЙ ГЕТТЕР ★★★
/**
 * Было ли показано приветственное окно
 */
export function isWelcomeShown() {
  return APP_STATE[PRIVATE.WELCOME_SHOWN];
}

// ============================================================
// 4. СЕТТЕРЫ ДЛЯ КОНКРЕТНЫХ ПОЛЕЙ
// ============================================================

/**
 * Установить выбранную таблицу
 */
export function setSelectedTable(value) {
  APP_STATE[PRIVATE.SELECTED_TABLE] = value;
  return value;
}

/**
 * Установить выбранную строку
 */
export function setSelectedRow(value) {
  APP_STATE[PRIVATE.SELECTED_ROW] = value;
  return value;
}

/**
 * Установить активный таб
 */
export function setActiveTab(value) {
  APP_STATE[PRIVATE.ACTIVE_TAB] = value;
  return value;
}

/**
 * Установить состояние паузы логов
 */
export function setLogPaused(value) {
  APP_STATE[PRIVATE.IS_LOG_PAUSED] = Boolean(value);
  return APP_STATE[PRIVATE.IS_LOG_PAUSED];
}

/**
 * Установить записи логов
 */
export function setLogEntries(value) {
  APP_STATE[PRIVATE.LOG_ENTRIES] = Array.isArray(value) ? value : [];
  return APP_STATE[PRIVATE.LOG_ENTRIES];
}

/**
 * Добавить запись в логи
 */
export function addLogEntry(entry) {
  APP_STATE[PRIVATE.LOG_ENTRIES].unshift(entry);
  if (APP_STATE[PRIVATE.LOG_ENTRIES].length > APP_STATE[PRIVATE.MAX_LOG]) {
    APP_STATE[PRIVATE.LOG_ENTRIES].pop();
  }
  return APP_STATE[PRIVATE.LOG_ENTRIES];
}

/**
 * Очистить логи
 */
export function clearLogEntries() {
  APP_STATE[PRIVATE.LOG_ENTRIES] = [];
  return APP_STATE[PRIVATE.LOG_ENTRIES];
}

/**
 * Установить сообщения брокера
 */
export function setMessages(value) {
  APP_STATE[PRIVATE.MESSAGES] = Array.isArray(value) ? value : [];
  return APP_STATE[PRIVATE.MESSAGES];
}

/**
 * Добавить сообщение брокера
 */
export function addMessage(message) {
  APP_STATE[PRIVATE.MESSAGES].push(message);
  APP_STATE[PRIVATE.MESSAGE_COUNT] = APP_STATE[PRIVATE.MESSAGES].length;
  return APP_STATE[PRIVATE.MESSAGES];
}

/**
 * Очистить сообщения брокера
 */
export function clearMessages() {
  APP_STATE[PRIVATE.MESSAGES] = [];
  APP_STATE[PRIVATE.MESSAGE_COUNT] = 0;
  return APP_STATE[PRIVATE.MESSAGES];
}

/**
 * Установить подписки
 */
export function setSubscriptions(value) {
  APP_STATE[PRIVATE.SUBSCRIPTIONS] = Array.isArray(value) ? value : [];
  return APP_STATE[PRIVATE.SUBSCRIPTIONS];
}

/**
 * Добавить подписку
 */
export function addSubscription(subscription) {
  APP_STATE[PRIVATE.SUBSCRIPTIONS].push(subscription);
  return APP_STATE[PRIVATE.SUBSCRIPTIONS];
}

/**
 * Удалить подписку по ID
 */
export function removeSubscription(id) {
  APP_STATE[PRIVATE.SUBSCRIPTIONS] = APP_STATE[PRIVATE.SUBSCRIPTIONS].filter(sub => sub !== id);
  return APP_STATE[PRIVATE.SUBSCRIPTIONS];
}

/**
 * Установить состояние модалки
 */
export function setModalActive(value) {
  APP_STATE[PRIVATE.MODAL_ACTIVE] = Boolean(value);
  return APP_STATE[PRIVATE.MODAL_ACTIVE];
}

/**
 * Установить callback модалки
 */
export function setModalCallback(value) {
  APP_STATE[PRIVATE.MODAL_CALLBACK] = typeof value === 'function' ? value : null;
  return APP_STATE[PRIVATE.MODAL_CALLBACK];
}

/**
 * Установить данные модалки
 */
export function setModalData(value) {
  APP_STATE[PRIVATE.MODAL_DATA] = value;
  return APP_STATE[PRIVATE.MODAL_DATA];
}

/**
 * Установить состояние инициализации
 */
export function setInitialized(value) {
  APP_STATE[PRIVATE.INITIALIZED] = Boolean(value);
  return APP_STATE[PRIVATE.INITIALIZED];
}

/**
 * Установить состояние уничтожения
 */
export function setDestroyed(value) {
  APP_STATE[PRIVATE.DESTROYED] = Boolean(value);
  return APP_STATE[PRIVATE.DESTROYED];
}

/**
 * Обновить время последнего обновления
 */
export function updateLastUpdate() {
  APP_STATE[PRIVATE.LAST_UPDATE] = Date.now();
  return APP_STATE[PRIVATE.LAST_UPDATE];
}

/**
 * Установить статус загрузки демо-данных
 */
export function setDemoLoaded(value) {
  APP_STATE[PRIVATE.DEMO_LOADED] = Boolean(value);
  return APP_STATE[PRIVATE.DEMO_LOADED];
}

/**
 * Установить статус готовности глобального хранилища
 */
export function setGlobalStoreReady(value) {
  APP_STATE[PRIVATE.GLOBAL_STORE_READY] = Boolean(value);
  return APP_STATE[PRIVATE.GLOBAL_STORE_READY];
}

// ★★★ НОВЫЙ СЕТТЕР ★★★
/**
 * Установить статус показа приветственного окна
 */
export function setWelcomeShown(value) {
  APP_STATE[PRIVATE.WELCOME_SHOWN] = Boolean(value);
  return APP_STATE[PRIVATE.WELCOME_SHOWN];
}

// ============================================================
// 5. КОМПОЗИТНЫЕ ОПЕРАЦИИ
// ============================================================

/**
 * Сбросить состояние приложения (без перезагрузки)
 */
export function resetState() {
  APP_STATE[PRIVATE.SELECTED_TABLE] = null;
  APP_STATE[PRIVATE.SELECTED_ROW] = null;
  APP_STATE[PRIVATE.ACTIVE_TAB] = 'data';
  APP_STATE[PRIVATE.IS_LOG_PAUSED] = false;
  APP_STATE[PRIVATE.LOG_ENTRIES] = [];
  APP_STATE[PRIVATE.MESSAGES] = [];
  APP_STATE[PRIVATE.SUBSCRIPTIONS] = [];
  APP_STATE[PRIVATE.MESSAGE_COUNT] = 0;
  APP_STATE[PRIVATE.MODAL_CALLBACK] = null;
  APP_STATE[PRIVATE.MODAL_DATA] = null;
  APP_STATE[PRIVATE.MODAL_ACTIVE] = false;
  APP_STATE[PRIVATE.DEMO_LOADED] = false;
  APP_STATE[PRIVATE.GLOBAL_STORE_READY] = false;
  APP_STATE[PRIVATE.WELCOME_SHOWN] = false;
  APP_STATE[PRIVATE.LAST_UPDATE] = Date.now();
  APP_STATE[PRIVATE.START_TIME] = Date.now();

  return APP_STATE;
}

/**
 * Получить состояние в виде plain объекта (без символов)
 */
export function getPlainState() {
  return {
    selectedTable: APP_STATE[PRIVATE.SELECTED_TABLE],
    selectedRow: APP_STATE[PRIVATE.SELECTED_ROW],
    activeTab: APP_STATE[PRIVATE.ACTIVE_TAB],
    isLogPaused: APP_STATE[PRIVATE.IS_LOG_PAUSED],
    logCount: APP_STATE[PRIVATE.LOG_ENTRIES].length,
    messagesCount: APP_STATE[PRIVATE.MESSAGES].length,
    subscriptionsCount: APP_STATE[PRIVATE.SUBSCRIPTIONS].length,
    modalActive: APP_STATE[PRIVATE.MODAL_ACTIVE],
    initialized: APP_STATE[PRIVATE.INITIALIZED],
    destroyed: APP_STATE[PRIVATE.DESTROYED],
    startTime: APP_STATE[PRIVATE.START_TIME],
    lastUpdate: APP_STATE[PRIVATE.LAST_UPDATE],
    demoLoaded: APP_STATE[PRIVATE.DEMO_LOADED],
    globalStoreReady: APP_STATE[PRIVATE.GLOBAL_STORE_READY],
    welcomeShown: APP_STATE[PRIVATE.WELCOME_SHOWN],
  };
}

/**
 * Получить состояние в виде JSON
 */
export function getStateJSON() {
  return JSON.stringify(getPlainState(), null, 2);
}

/**
 * Создать снапшот состояния
 */
export function createStateSnapshot() {
  return {
    timestamp: Date.now(),
    state: { ...APP_STATE },
    plain: getPlainState(),
  };
}

// ============================================================
// 6. СОБЫТИЯ ИЗМЕНЕНИЯ СОСТОЯНИЯ
// ============================================================

const stateListeners = new Map();

/**
 * Подписаться на изменения состояния
 */
export function subscribeState(callback) {
  const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  stateListeners.set(id, callback);
  return id;
}

/**
 * Отписаться от изменений состояния
 */
export function unsubscribeState(id) {
  return stateListeners.delete(id);
}

/**
 * Уведомить подписчиков об изменении состояния
 */
export function notifyStateListeners(changes = {}) {
  const state = getPlainState();
  for (const [id, callback] of stateListeners) {
    try {
      callback({ ...state, ...changes, timestamp: Date.now() });
    } catch (error) {
      console.error(`❌ Ошибка в подписчике состояния (${id}):`, error);
    }
  }
}

// ============================================================
// 7. ОТЛАДОЧНЫЕ МЕТОДЫ
// ============================================================

/**
 * Получить все символы состояния
 */
export function getStateSymbols() {
  return {
    SELECTED_TABLE: PRIVATE.SELECTED_TABLE,
    SELECTED_ROW: PRIVATE.SELECTED_ROW,
    ACTIVE_TAB: PRIVATE.ACTIVE_TAB,
    IS_LOG_PAUSED: PRIVATE.IS_LOG_PAUSED,
    LOG_ENTRIES: PRIVATE.LOG_ENTRIES,
    MAX_LOG: PRIVATE.MAX_LOG,
    MESSAGES: PRIVATE.MESSAGES,
    SUBSCRIPTIONS: PRIVATE.SUBSCRIPTIONS,
    MESSAGE_COUNT: PRIVATE.MESSAGE_COUNT,
    MODAL_CALLBACK: PRIVATE.MODAL_CALLBACK,
    MODAL_DATA: PRIVATE.MODAL_DATA,
    MODAL_ACTIVE: PRIVATE.MODAL_ACTIVE,
    INITIALIZED: PRIVATE.INITIALIZED,
    DESTROYED: PRIVATE.DESTROYED,
    START_TIME: PRIVATE.START_TIME,
    LAST_UPDATE: PRIVATE.LAST_UPDATE,
    DEMO_LOADED: PRIVATE.DEMO_LOADED,
    GLOBAL_STORE_READY: PRIVATE.GLOBAL_STORE_READY,
    WELCOME_SHOWN: PRIVATE.WELCOME_SHOWN,
    REFS: PRIVATE.REFS,
    CONFIG: PRIVATE.CONFIG,
  };
}

/**
 * Проверить целостность состояния
 */
export function healthCheckState() {
  const issues = [];
  let healthy = true;

  // Проверка обязательных полей
  const requiredKeys = [
    PRIVATE.SELECTED_TABLE,
    PRIVATE.SELECTED_ROW,
    PRIVATE.ACTIVE_TAB,
    PRIVATE.IS_LOG_PAUSED,
    PRIVATE.LOG_ENTRIES,
    PRIVATE.MAX_LOG,
    PRIVATE.MESSAGES,
    PRIVATE.SUBSCRIPTIONS,
    PRIVATE.MESSAGE_COUNT,
    PRIVATE.MODAL_ACTIVE,
    PRIVATE.INITIALIZED,
    PRIVATE.DESTROYED,
    PRIVATE.WELCOME_SHOWN,
  ];

  for (const key of requiredKeys) {
    if (!(key in APP_STATE)) {
      healthy = false;
      issues.push(`Отсутствует ключ: ${String(key)}`);
    }
  }

  // Проверка типов
  if (!Array.isArray(APP_STATE[PRIVATE.LOG_ENTRIES])) {
    healthy = false;
    issues.push('LOG_ENTRIES должен быть массивом');
  }

  if (!Array.isArray(APP_STATE[PRIVATE.MESSAGES])) {
    healthy = false;
    issues.push('MESSAGES должен быть массивом');
  }

  if (!Array.isArray(APP_STATE[PRIVATE.SUBSCRIPTIONS])) {
    healthy = false;
    issues.push('SUBSCRIPTIONS должен быть массивом');
  }

  if (typeof APP_STATE[PRIVATE.MAX_LOG] !== 'number' || APP_STATE[PRIVATE.MAX_LOG] < 1) {
    healthy = false;
    issues.push('MAX_LOG должен быть положительным числом');
  }

  return {
    healthy,
    issues,
    stateSize: Object.keys(APP_STATE).length,
    listenersCount: stateListeners.size,
    timestamp: Date.now(),
  };
}

// ============================================================
// 8. СТАТИСТИКА СИМВОЛОВ (при загрузке)
// ============================================================

if (typeof console !== 'undefined') {
  const privateKeys = Object.keys(PRIVATE);
  const stateKeys = Object.keys(APP_STATE);

  // ★★★ ИСПРАВЛЕНО: явный список экспортируемых функций ★★★
  const exportedFunctions = [
    'APP_STATE',
    'getAppState',
    'getPrivate',
    'setPrivate',
    'hasPrivate',
    'getSelectedTable',
    'getSelectedRow',
    'getActiveTab',
    'isLogPaused',
    'getLogEntries',
    'getMessages',
    'getSubscriptions',
    'getMessageCount',
    'isModalActive',
    'getModalData',
    'getModalCallback',
    'isInitialized',
    'isDestroyed',
    'getStartTime',
    'getLastUpdate',
    'isDemoLoaded',
    'isGlobalStoreReady',
    'isWelcomeShown',
    'setSelectedTable',
    'setSelectedRow',
    'setActiveTab',
    'setLogPaused',
    'setLogEntries',
    'addLogEntry',
    'clearLogEntries',
    'setMessages',
    'addMessage',
    'clearMessages',
    'setSubscriptions',
    'addSubscription',
    'removeSubscription',
    'setModalActive',
    'setModalCallback',
    'setModalData',
    'setInitialized',
    'setDestroyed',
    'updateLastUpdate',
    'setDemoLoaded',
    'setGlobalStoreReady',
    'setWelcomeShown',
    'resetState',
    'getPlainState',
    'getStateJSON',
    'createStateSnapshot',
    'subscribeState',
    'unsubscribeState',
    'notifyStateListeners',
    'getStateSymbols',
    'healthCheckState',
  ];

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 STATE (100% СИМВОЛЫ) v4.0.8                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateKeys.length.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    📦 Полей состояния: ${stateKeys.length.toString().padStart(3, ' ')}                                        ║`);
  console.log(`║    📤 Экспортировано функций: ${exportedFunctions.length.toString().padStart(3, ' ')}                                     ║`);
  console.log(`║    🏷️  Всего символов: ${(privateKeys.length + stateKeys.length).toString().padStart(3, ' ')}                                     ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ СОСТОЯНИЯ:                                                   ║');
  console.log('║    ✅ APP_STATE — полное состояние приложения                                ║');
  console.log('║    ✅ getAppState() — получить состояние                                     ║');
  console.log('║    ✅ getSelectedTable() — выбранная таблица                                 ║');
  console.log('║    ✅ getSelectedRow() — выбранная строка                                    ║');
  console.log('║    ✅ getActiveTab() — активный таб                                          ║');
  console.log('║    ✅ isModalActive() — активна ли модалка                                   ║');
  console.log('║    ✅ isInitialized() — инициализировано                                     ║');
  console.log('║    ✅ isDestroyed() — уничтожено                                             ║');
  console.log('║    ✅ isWelcomeShown() — показано приветственное окно ★★★                    ║');
  console.log('║    ✅ getPlainState() — состояние без символов                               ║');
  console.log('║    ✅ subscribeState() — подписка на изменения                               ║');
  console.log('║    ✅ healthCheckState() — проверка целостности                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 9. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  APP_STATE,
  getAppState,
  getPrivate,
  setPrivate,
  hasPrivate,
  getSelectedTable,
  getSelectedRow,
  getActiveTab,
  isLogPaused,
  getLogEntries,
  getMessages,
  getSubscriptions,
  getMessageCount,
  isModalActive,
  getModalData,
  getModalCallback,
  isInitialized,
  isDestroyed,
  getStartTime,
  getLastUpdate,
  isDemoLoaded,
  isGlobalStoreReady,
  isWelcomeShown,
  setSelectedTable,
  setSelectedRow,
  setActiveTab,
  setLogPaused,
  setLogEntries,
  addLogEntry,
  clearLogEntries,
  setMessages,
  addMessage,
  clearMessages,
  setSubscriptions,
  addSubscription,
  removeSubscription,
  setModalActive,
  setModalCallback,
  setModalData,
  setInitialized,
  setDestroyed,
  updateLastUpdate,
  setDemoLoaded,
  setGlobalStoreReady,
  setWelcomeShown,
  resetState,
  getPlainState,
  getStateJSON,
  createStateSnapshot,
  subscribeState,
  unsubscribeState,
  notifyStateListeners,
  getStateSymbols,
  healthCheckState,
};

// ============================================================
// 10. КОНЕЦ ФАЙЛА
// ============================================================
