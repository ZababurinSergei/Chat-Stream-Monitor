// ============================================================
// app.mjs — 100% СИМВОЛЫ — полная изоляция и безопасность
// Версия: 4.0.8 (МОДУЛЬНАЯ — РАЗДЕЛЕННАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ (СНАЧАЛА)
// ============================================================

// Символы (100% изоляция)
import { PRIVATE, PUBLIC } from './app/symbols.js';

// Конфигурация
import { CONFIG, LOGGER_SYMBOLS } from './app/config.js';

// Утилиты
import {
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
  isPromise,
  isDate,
  isRegExp,
  isError,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isArrayBuffer,
  getDom,
  safeCall,
  safeStringify,
  getType,
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
} from './app/utils.js';

// Логгер
import {
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
  safeStringify as safeStringifyLog,
} from './app/logger.js';

// DOM-референсы
import { DOM } from './app/dom.js';

// Модальное окно
import {
  showModal,
  closeModal,
  showAlertInModal,
  setupModal,
  showWelcomeModal,
  showFormModal,
  showConfirmModal,
  showSelectModal,
  showEditModal,
  getModalFormData,
  updateModalContent,
  updateModalTitle,
  setModalButtonsVisible,
  setModalButtonText,
  showTimedModal,
} from './app/modal.js';

// Состояние приложения
import {
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
  setSelectedTable,
  setSelectedRow,
  setActiveTab,
  setLogPaused,
  setLogEntries,
  addLogEntry,
  clearLogEntries,
  setMessages,
  addMessage,
  clearMessages as clearStateMessages,
  setSubscriptions,
  addSubscription as addStateSubscription,
  removeSubscription,
  setModalActive,
  setModalCallback,
  setModalData,
  setInitialized,
  setDestroyed,
  updateLastUpdate,
  setDemoLoaded,
  setGlobalStoreReady,
  resetState,
  getPlainState,
  getStateJSON,
  createStateSnapshot,
  subscribeState,
  unsubscribeState,
  notifyStateListeners,
  getStateSymbols,
  healthCheckState,
} from './app/state.js';

// Рендереры
import {
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
  renderAll,
  switchTab,
} from './app/render/index.js';

// Контроллеры таблиц
import {
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
  deleteTable,
  deleteRow,
  editRow,
  exportTableData,
} from './app/controllers/tables.js';

// Контроллеры брокера
import {
  publishMessage,
  addSubscription,
  clearMessages,
  getBrokerStats,
  processRetryQueue,
  clearDeadLetter,
  getDeadLetter,
  getSubscribers,
  getTopics,
  showBrokerStats,
  exportBrokerStats,
  initBrokerHandlers,
} from './app/controllers/broker.js';

// Контроллеры консоли
import {
  executeCommand,
  clearConsole,
  initConsoleHandlers,
  navigateHistory,
  autocomplete,
} from './app/controllers/console.js';

// Контроллеры экспорта
import { exportData, exportAudit, exportAllData, importData } from './app/controllers/export.js';

// Контроллеры демо-данных
import {
  initDemoData,
  loadDemoTemplate,
  getDemoTemplates,
  showTemplateSelector,
  resetDemoData,
} from './app/controllers/demo.js';

// Инициализация и API
import { init, destroy, getState, healthCheck, getGlobalStore, exportSymbols } from './app/init.js';

// Хранилище
import { db, createStore, getStore, GLOBAL_STORE_SYMBOL, DEFAULT_PLUGINS } from './index.js';

// ============================================================
// 2. ЭКСПОРТ (ПОТОМ)
// ============================================================

// Символы
export { PRIVATE, PUBLIC };

// Конфигурация
export { CONFIG, LOGGER_SYMBOLS };

// Утилиты
export {
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
  isPromise,
  isDate,
  isRegExp,
  isError,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isArrayBuffer,
  getDom,
  safeCall,
  safeStringify,
  getType,
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
};

// Логгер
export {
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
  safeStringifyLog,
};

// DOM-референсы
export { DOM };

// Модальное окно
export {
  showModal,
  closeModal,
  showAlertInModal,
  setupModal,
  showWelcomeModal,
  showFormModal,
  showConfirmModal,
  showSelectModal,
  showEditModal,
  getModalFormData,
  updateModalContent,
  updateModalTitle,
  setModalButtonsVisible,
  setModalButtonText,
  showTimedModal,
};

// Состояние приложения
export {
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
  setSelectedTable,
  setSelectedRow,
  setActiveTab,
  setLogPaused,
  setLogEntries,
  addLogEntry,
  clearLogEntries,
  setMessages,
  addMessage,
  clearStateMessages,
  setSubscriptions,
  addStateSubscription,
  removeSubscription,
  setModalActive,
  setModalCallback,
  setModalData,
  setInitialized,
  setDestroyed,
  updateLastUpdate,
  setDemoLoaded,
  setGlobalStoreReady,
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

// Рендереры
export {
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
  renderAll,
  switchTab,
};

// Контроллеры таблиц
export {
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
  deleteTable,
  deleteRow,
  editRow,
  exportTableData,
};

// Контроллеры брокера
export {
  publishMessage,
  addSubscription,
  clearMessages,
  getBrokerStats,
  processRetryQueue,
  clearDeadLetter,
  getDeadLetter,
  getSubscribers,
  getTopics,
  showBrokerStats,
  exportBrokerStats,
  initBrokerHandlers,
};

// Контроллеры консоли
export { executeCommand, clearConsole, initConsoleHandlers, navigateHistory, autocomplete };

// Контроллеры экспорта
export { exportData, exportAudit, exportAllData, importData };

// Контроллеры демо-данных
export { initDemoData, loadDemoTemplate, getDemoTemplates, showTemplateSelector, resetDemoData };

// Инициализация и API
export { init, destroy, getState, healthCheck, getGlobalStore, exportSymbols };

// Хранилище
export { db, createStore, getStore, GLOBAL_STORE_SYMBOL, DEFAULT_PLUGINS };

// ============================================================
// 3. ГЛОБАЛЬНЫЙ ОБЪЕКТ APP
// ============================================================

export const app = {
  // Основные методы
  init,
  destroy,
  render: renderAll,
  getState,
  healthCheck,
  getGlobalStore,

  // Модальное окно
  showModal,
  closeModal,
  showAlert: showAlertInModal,

  // Управление таблицами
  selectTable,
  addRow: showAddRowModal,
  createTable: showCreateTableModal,
  deleteTable,
  deleteRow,
  editRow,
  linkTables: showLinkTablesModal,
  exportTableData,

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

  // Демо
  initDemo: initDemoData,
  loadDemoTemplate,
  getDemoTemplates,
  showTemplateSelector,
  resetDemoData,
  getDemoStatus: () => {
    const state = getAppState();
    return {
      loaded: state[PRIVATE.DEMO_LOADED] || false,
      template: state[PRIVATE.DEMO_TEMPLATE] || null,
      tables: isFunction(db.listTables) ? db.listTables() : [],
    };
  },

  // Символы и конфигурация
  PRIVATE,
  PUBLIC,
  CONFIG,

  // Доступ к хранилищу
  db,
  store: db,
  globalStore: db,
};

// ============================================================
// 4. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default app;

// ============================================================
// 5. АВТОМАТИЧЕСКИЙ ЗАПУСК
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      init();
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
    }
  });
} else {
  try {
    init();
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }
}

// ============================================================
// 6. ГЛОБАЛЬНЫЙ ДОСТУП
// ============================================================

if (typeof window !== 'undefined') {
  window.__app = app;
  window.app = app;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 APP.MJS (100% СИМВОЛЫ) v4.0.8                              ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА ЭКСПОРТОВ:                                                  ║');
  console.log(
    `║    📤 Экспортировано функций: ${Object.keys(app).length.toString().padStart(3, ' ')}                                          ║`
  );
  console.log(
    `║    🔑 Приватных символов: ${Object.keys(PRIVATE).length.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    🔓 Публичных символов: ${Object.keys(PUBLIC).length.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║    📦 Всего символов: ${(Object.keys(PRIVATE).length + Object.keys(PUBLIC).length).toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.app.init()              — инициализация приложения                 ║');
  console.log('║    window.app.destroy()           — уничтожение приложения                   ║');
  console.log('║    window.app.render()            — обновить интерфейс                       ║');
  console.log('║    window.app.getState()          — получить состояние                       ║');
  console.log('║    window.app.healthCheck()       — проверка целостности                     ║');
  console.log('║    window.app.selectTable(name)   — выбрать таблицу                          ║');
  console.log('║    window.app.addRow()            — добавить строку                          ║');
  console.log('║    window.app.createTable()       — создать таблицу                          ║');
  console.log('║    window.app.publish()           — опубликовать сообщение                   ║');
  console.log('║    window.app.subscribe()         — подписаться на топик                     ║');
  console.log('║    window.app.clearMessages()     — очистить сообщения                       ║');
  console.log('║    window.app.getBrokerStats()    — статистика брокера                       ║');
  console.log('║    window.app.getTopics()         — список топиков                           ║');
  console.log('║    window.app.getSubscribers()    — подписчики топика                        ║');
  console.log('║    window.app.getDeadLetter()     — Dead Letter Queue                        ║');
  console.log('║    window.app.clearDeadLetter()   — очистить DLQ                             ║');
  console.log('║    window.app.processRetryQueue() — обработать Retry Queue                   ║');
  console.log('║    window.app.showBrokerStats()   — показать статистику брокера              ║');
  console.log('║    window.app.exportBrokerStats() — экспорт статистики брокера               ║');
  console.log('║    window.app.executeCommand()    — выполнить код                            ║');
  console.log('║    window.app.clearConsole()      — очистить консоль                         ║');
  console.log('║    window.app.exportData()        — экспорт данных                           ║');
  console.log('║    window.app.exportAudit()       — экспорт аудита                           ║');
  console.log('║    window.app.exportAllData()     — экспорт всех данных                      ║');
  console.log('║    window.app.importData()        — импорт данных                            ║');
  console.log('║    window.app.showModal()         — показать модалку                         ║');
  console.log('║    window.app.closeModal()        — закрыть модалку                          ║');
  console.log('║    window.app.initDemo()          — загрузить демо-данные                    ║');
  console.log('║    window.app.loadDemoTemplate()  — загрузить шаблон демо-данных             ║');
  console.log('║    window.app.getDemoTemplates()  — список шаблонов демо-данных              ║');
  console.log('║    window.app.showTemplateSelector() — выбрать шаблон через UI               ║');
  console.log('║    window.app.resetDemoData()     — сбросить демо-данные                     ║');
  console.log('║    window.app.getDemoStatus()     — статус демо-данных                       ║');
  console.log('║    window.app.getGlobalStore()    — получить глобальное хранилище            ║');
  console.log('║    window.app.db                  — доступ к хранилищу                       ║');
  console.log('║    window.app.CONFIG              — конфигурация                             ║');
  console.log('║    window.app.PRIVATE             — приватные символы                        ║');
  console.log('║    window.app.PUBLIC              — публичные символы                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 7. КОНЕЦ ФАЙЛА
// ============================================================
