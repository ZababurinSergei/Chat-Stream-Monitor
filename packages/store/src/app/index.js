// ============================================================
// app/index.js — 100% СИМВОЛЫ — главный экспорт приложения
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ЭКСПОРТ СИМВОЛОВ (100% изоляция)
// ============================================================

export { PRIVATE, PUBLIC } from './symbols.js';

// ============================================================
// 2. ЭКСПОРТ КОНФИГУРАЦИИ
// ============================================================

export { CONFIG, LOGGER_SYMBOLS } from './config.js';

// ============================================================
// 3. ЭКСПОРТ УТИЛИТ
// ============================================================

export {
  escapeHtml,
  formatJson,
  formatTime,
  isFunction,
  isObject,
  getDom,
  safeCall,
  safeStringify,
} from './utils.js';

// ============================================================
// 4. ЭКСПОРТ ЛОГГЕРА
// ============================================================

export { createLogger } from './logger.js';

// ============================================================
// 5. ЭКСПОРТ DOM-РЕФЕРЕНСОВ
// ============================================================

export { DOM } from './dom.js';

// ============================================================
// 6. ЭКСПОРТ МОДАЛЬНОГО ОКНА
// ============================================================

export { showModal, closeModal, showAlertInModal, setupModal, showWelcomeModal } from './modal.js';

// ============================================================
// 7. ЭКСПОРТ СОСТОЯНИЯ ПРИЛОЖЕНИЯ
// ============================================================

export {
  getAppState,
  getPrivate,
  setPrivate,
  getSelectedTable,
  setSelectedTable,
  getSelectedRow,
  setSelectedRow,
  getActiveTab,
  setActiveTab,
} from './state.js';

// ============================================================
// 8. ЭКСПОРТ РЕНДЕРЕРОВ
// ============================================================

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
} from './render/index.js';

// ============================================================
// 9. ЭКСПОРТ КОНТРОЛЛЕРОВ (УПРАВЛЕНИЕ)
// ============================================================

// Контроллер таблиц
export {
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
} from './controllers/tables.js';

// Контроллер брокера
export { publishMessage, addSubscription, clearMessages } from './controllers/broker.js';

// Контроллер консоли
export { executeCommand, clearConsole } from './controllers/console.js';

// Контроллер экспорта
export { exportData, exportAudit } from './controllers/export.js';

// Контроллер демо-данных
export { initDemoData } from './controllers/demo.js';

// ============================================================
// 10. ЭКСПОРТ ИНИЦИАЛИЗАЦИИ И API
// ============================================================

export { init, destroy, getState, healthCheck, getGlobalStore, exportSymbols } from './init.js';

// ============================================================
// 11. ДОПОЛНИТЕЛЬНЫЕ ЭКСПОРТЫ (ДЛЯ УДОБСТВА)
// ============================================================

// Реэкспорт db для удобства
export { db } from '../index.js';

// Реэкспорт createStore для удобства
export { createStore, getStore, GLOBAL_STORE_SYMBOL, DEFAULT_PLUGINS } from '../index.js';

// ============================================================
// 12. ГЛОБАЛЬНЫЙ ОБЪЕКТ APP (ДЛЯ УДОБСТВА)
// ============================================================

import { db, createStore, getStore, GLOBAL_STORE_SYMBOL, DEFAULT_PLUGINS } from '../index.js';
import { CONFIG } from './config.js';
import { PRIVATE, PUBLIC } from './symbols.js';
import { init, destroy, getState, healthCheck, getGlobalStore, exportSymbols } from './init.js';
import { showModal, closeModal } from './modal.js';
import { selectTable, showAddRowModal, showCreateTableModal } from './controllers/tables.js';
import { executeCommand, clearConsole } from './controllers/console.js';
import { initDemoData } from './controllers/demo.js';
import { renderAll } from './render/index.js';

// Создаем глобальный объект app для удобства доступа
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

  // Управление таблицами
  selectTable,
  addRow: showAddRowModal,
  createTable: showCreateTableModal,

  // Консоль
  executeCommand,
  clearConsole,

  // Демо
  initDemo: initDemoData,

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
// 13. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
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

  // Управление таблицами
  selectTable,
  addRow: showAddRowModal,
  createTable: showCreateTableModal,

  // Консоль
  executeCommand,
  clearConsole,

  // Демо
  initDemo: initDemoData,

  // Символы и конфигурация
  PRIVATE,
  PUBLIC,
  CONFIG,

  // Доступ к хранилищу
  db,
  store: db,
  globalStore: db,

  // Утилиты (экспортируются отдельно)
  escapeHtml,
  formatJson,
  formatTime,
  isFunction,
  isObject,
  getDom,
  safeCall,
  safeStringify,

  // Рендереры (экспортируются отдельно)
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

  // Контроллеры (экспортируются отдельно)
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
  publishMessage,
  addSubscription,
  clearMessages,
  executeCommand,
  clearConsole,
  exportData,
  exportAudit,
  initDemoData,
};

// ============================================================
// 14. АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ В ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ============================================================

if (typeof window !== 'undefined') {
  // Регистрируем глобальный объект app
  window.app = app;

  // Регистрируем символы для отладки
  window.__APP_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  // Регистрируем конфигурацию
  window.__APP_CONFIG = { ...CONFIG };

  console.log('✅ app/index.js загружен');
  console.log('📋 Доступно: window.app');
  console.log('🔑 Символы: window.__APP_SYMBOLS');
  console.log('⚙️ Конфигурация: window.__APP_CONFIG');

  // Выводим статистику символов
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📦 APP MODULE (100% СИМВОЛЫ) v4.0.8                           ║');
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
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.app.init() — инициализация приложения                             ║');
  console.log('║    window.app.render() — обновить интерфейс                                 ║');
  console.log('║    window.app.getState() — получить состояние                               ║');
  console.log('║    window.app.healthCheck() — проверка целостности                          ║');
  console.log('║    window.app.selectTable(name) — выбрать таблицу                           ║');
  console.log('║    window.app.addRow() — добавить строку                                    ║');
  console.log('║    window.app.createTable() — создать таблицу                               ║');
  console.log('║    window.app.executeCommand(code) — выполнить код                          ║');
  console.log('║    window.app.showModal(title, html, callback) — показать модалку           ║');
  console.log('║    window.app.closeModal() — закрыть модалку                                ║');
  console.log('║    window.app.initDemo() — загрузить демо-данные                            ║');
  console.log('║    window.app.getGlobalStore() — получить глобальное хранилище              ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📁 МОДУЛЬНАЯ СТРУКТУРА:                                                   ║');
  console.log('║    app/symbols.js — 100% СИМВОЛЫ                                           ║');
  console.log('║    app/config.js — конфигурация                                            ║');
  console.log('║    app/utils.js — утилиты                                                  ║');
  console.log('║    app/logger.js — логгер                                                  ║');
  console.log('║    app/dom.js — DOM-референсы                                              ║');
  console.log('║    app/modal.js — модальное окно                                           ║');
  console.log('║    app/state.js — состояние приложения                                     ║');
  console.log('║    app/init.js — инициализация                                             ║');
  console.log('║    app/render/ — рендереры                                                 ║');
  console.log('║    app/controllers/ — контроллеры                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 15. КОНЕЦ ФАЙЛА
// ============================================================
