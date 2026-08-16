// ============================================================
// controllers/index.js — 100% СИМВОЛЫ — точка входа контроллеров
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ЭКСПОРТ ВСЕХ КОНТРОЛЛЕРОВ
// ============================================================

// Экспорт контроллеров таблиц
export {
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  showLinkTablesModal,
  showUnlinkTablesModal,
  deleteTable,
  deleteRow,
  editRow,
  duplicateRow,
  getTableStats,
  exportTableData,
  importTableData,
  clearTableData,
} from './tables.js';

// Экспорт контроллеров брокера
export {
  publishMessage,
  addSubscription,
  clearMessages,
  unsubscribeAll,
  getBrokerStats,
  getMessageHistory,
  processRetryQueue,
  clearDeadLetter,
  getDeadLetter,
  getSubscribers,
  getTopics,
} from './broker.js';

// Экспорт контроллеров консоли
export {
  executeCommand,
  clearConsole,
  getConsoleHistory,
  saveConsoleHistory,
  loadConsoleHistory,
  getAvailableCommands,
  executePredefinedCommand,
} from './console.js';

// Экспорт контроллеров экспорта
export {
  exportData,
  exportAudit,
  exportAllData,
  importData,
  exportSettings,
  exportLogs,
  exportTableSchema,
  exportDatabase,
  importDatabase,
} from './export.js';

// Экспорт контроллеров демо-данных
export {
  initDemoData,
  loadDemoData,
  resetDemoData,
  getDemoStatus,
  getDemoTables,
  generateDemoData,
} from './demo.js';

// Экспорт контроллеров аудита
export {
  clearAudit,
  getAuditStats,
  exportAuditFiltered,
  searchAudit,
  getAuditByAction,
  getAuditByUser,
  getAuditByDateRange,
} from './audit.js';

// Экспорт контроллеров плагинов
export {
  getPlugins,
  getPluginStats,
  enablePlugin,
  disablePlugin,
  reloadPlugin,
  getPluginDependencies,
  getPluginHooks,
} from './plugins.js';

// Экспорт контроллеров настроек
export {
  updateSettings,
  getSettings,
  resetSettings,
  saveSettings,
  loadSettings,
  getSettingsSchema,
  validateSettings,
} from './settings.js';

// ============================================================
// 2. ГЛАВНЫЙ КОНТРОЛЛЕР (Singleton)
// ============================================================

import * as tables from './tables.js';
import * as broker from './broker.js';
import * as consoleCtrl from './console.js';
import * as exportCtrl from './export.js';
import * as demo from './demo.js';
import * as audit from './audit.js';
import * as plugins from './plugins.js';
import * as settings from './settings.js';

/**
 * Главный контроллер приложения
 * Объединяет все контроллеры в единый интерфейс
 * 100% символы — полная изоляция
 */
class AppController {
  constructor() {
    // Приватные символы
    this._symbols = {
      INITIALIZED: Symbol('controller.initialized'),
      DESTROYED: Symbol('controller.destroyed'),
      START_TIME: Symbol('controller.startTime'),
      COMMANDS: Symbol('controller.commands'),
      HISTORY: Symbol('controller.history'),
    };

    this[this._symbols.INITIALIZED] = false;
    this[this._symbols.DESTROYED] = false;
    this[this._symbols.START_TIME] = null;
    this[this._symbols.COMMANDS] = new Map();
    this[this._symbols.HISTORY] = [];

    // Регистрируем контроллеры
    this._controllers = {
      tables,
      broker,
      console: consoleCtrl,
      export: exportCtrl,
      demo,
      audit,
      plugins,
      settings,
    };

    // Регистрируем команды
    this._registerCommands();
  }

  // ============================================================
  // 3. РЕГИСТРАЦИЯ КОМАНД
  // ============================================================

  _registerCommands() {
    const commands = this[this._symbols.COMMANDS];

    // Команды таблиц
    commands.set('selectTable', { fn: tables.selectTable, description: 'Выбрать таблицу' });
    commands.set('addRow', { fn: tables.showAddRowModal, description: 'Добавить строку' });
    commands.set('createTable', {
      fn: tables.showCreateTableModal,
      description: 'Создать таблицу',
    });
    commands.set('linkTables', { fn: tables.showLinkTablesModal, description: 'Связать таблицы' });
    commands.set('deleteTable', { fn: tables.deleteTable, description: 'Удалить таблицу' });
    commands.set('deleteRow', { fn: tables.deleteRow, description: 'Удалить строку' });

    // Команды брокера
    commands.set('publish', { fn: broker.publishMessage, description: 'Опубликовать сообщение' });
    commands.set('subscribe', { fn: broker.addSubscription, description: 'Подписаться на топик' });
    commands.set('clearMessages', { fn: broker.clearMessages, description: 'Очистить сообщения' });
    commands.set('brokerStats', { fn: broker.getBrokerStats, description: 'Статистика брокера' });

    // Команды консоли
    commands.set('execute', { fn: consoleCtrl.executeCommand, description: 'Выполнить команду' });
    commands.set('clearConsole', { fn: consoleCtrl.clearConsole, description: 'Очистить консоль' });
    commands.set('consoleHistory', {
      fn: consoleCtrl.getConsoleHistory,
      description: 'История консоли',
    });

    // Команды экспорта
    commands.set('exportData', { fn: exportCtrl.exportData, description: 'Экспорт данных' });
    commands.set('exportAudit', { fn: exportCtrl.exportAudit, description: 'Экспорт аудита' });
    commands.set('exportAll', { fn: exportCtrl.exportAllData, description: 'Экспорт всех данных' });
    commands.set('importData', { fn: exportCtrl.importData, description: 'Импорт данных' });

    // Команды демо
    commands.set('initDemo', { fn: demo.initDemoData, description: 'Загрузить демо-данные' });
    commands.set('resetDemo', { fn: demo.resetDemoData, description: 'Сбросить демо-данные' });

    // Команды аудита
    commands.set('clearAudit', { fn: audit.clearAudit, description: 'Очистить аудит' });
    commands.set('auditStats', { fn: audit.getAuditStats, description: 'Статистика аудита' });
    commands.set('searchAudit', { fn: audit.searchAudit, description: 'Поиск в аудите' });

    // Команды плагинов
    commands.set('listPlugins', { fn: plugins.getPlugins, description: 'Список плагинов' });
    commands.set('pluginStats', { fn: plugins.getPluginStats, description: 'Статистика плагинов' });
    commands.set('enablePlugin', { fn: plugins.enablePlugin, description: 'Включить плагин' });
    commands.set('disablePlugin', { fn: plugins.disablePlugin, description: 'Выключить плагин' });

    // Команды настроек
    commands.set('getSettings', { fn: settings.getSettings, description: 'Получить настройки' });
    commands.set('updateSettings', {
      fn: settings.updateSettings,
      description: 'Обновить настройки',
    });
    commands.set('resetSettings', {
      fn: settings.resetSettings,
      description: 'Сбросить настройки',
    });
  }

  // ============================================================
  // 4. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  init() {
    if (this[this._symbols.INITIALIZED]) {
      console.warn('⚠️ Контроллер уже инициализирован');
      return;
    }

    this[this._symbols.INITIALIZED] = true;
    this[this._symbols.START_TIME] = Date.now();

    console.log('✅ AppController инициализирован');
    console.log(`📋 Зарегистрировано ${this[this._symbols.COMMANDS].size} команд`);

    // Выводим список команд
    this._printCommands();
  }

  // ============================================================
  // 5. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy() {
    if (this[this._symbols.DESTROYED]) {
      console.warn('⚠️ Контроллер уже уничтожен');
      return;
    }

    this[this._symbols.DESTROYED] = true;
    this[this._symbols.INITIALIZED] = false;
    this[this._symbols.COMMANDS].clear();
    this[this._symbols.HISTORY] = [];

    console.log('🧹 AppController уничтожен');
  }

  // ============================================================
  // 6. ВЫПОЛНЕНИЕ КОМАНД
  // ============================================================

  /**
   * Выполнение команды по имени
   */
  execute(command, ...args) {
    const commands = this[this._symbols.COMMANDS];

    if (!commands.has(command)) {
      console.error(`❌ Команда "${command}" не найдена`);
      return null;
    }

    const { fn, description } = commands.get(command);

    // Добавляем в историю
    this[this._symbols.HISTORY].push({
      command,
      args,
      timestamp: Date.now(),
    });

    // Ограничиваем историю
    if (this[this._symbols.HISTORY].length > 100) {
      this[this._symbols.HISTORY].shift();
    }

    try {
      console.log(
        `▶️ Выполнение: ${command} ${args.length > 0 ? args.map(a => JSON.stringify(a)).join(' ') : ''}`
      );
      const result = fn(...args);
      console.log(`✅ Результат:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка выполнения ${command}:`, error);
      return null;
    }
  }

  /**
   * Получить список доступных команд
   */
  getCommands() {
    const commands = this[this._symbols.COMMANDS];
    const result = {};

    for (const [name, info] of commands) {
      result[name] = {
        description: info.description,
        args: info.args || [],
      };
    }

    return result;
  }

  /**
   * Получить историю команд
   */
  getHistory(limit = 20) {
    const history = this[this._symbols.HISTORY];
    return history.slice(-Math.min(limit, history.length));
  }

  /**
   * Очистить историю команд
   */
  clearHistory() {
    this[this._symbols.HISTORY] = [];
    return true;
  }

  /**
   * Получить состояние контроллера
   */
  getState() {
    return {
      initialized: this[this._symbols.INITIALIZED],
      destroyed: this[this._symbols.DESTROYED],
      startTime: this[this._symbols.START_TIME],
      commandsCount: this[this._symbols.COMMANDS].size,
      historyCount: this[this._symbols.HISTORY].length,
      uptime: this[this._symbols.START_TIME ? Date.now() - this[this._symbols.START_TIME] : 0],
    };
  }

  // ============================================================
  // 7. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  /**
   * Получение контроллера по имени
   */
  getController(name) {
    return this._controllers[name] || null;
  }

  /**
   * Получение всех контроллеров
   */
  getControllers() {
    return { ...this._controllers };
  }

  /**
   * Вывод списка команд в консоль
   */
  _printCommands() {
    const commands = this[this._symbols.COMMANDS];

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ КОНТРОЛЛЕРА                            ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');

    const categories = {
      tables: ['selectTable', 'addRow', 'createTable', 'linkTables', 'deleteTable', 'deleteRow'],
      broker: ['publish', 'subscribe', 'clearMessages', 'brokerStats'],
      console: ['execute', 'clearConsole', 'consoleHistory'],
      export: ['exportData', 'exportAudit', 'exportAll', 'importData'],
      demo: ['initDemo', 'resetDemo'],
      audit: ['clearAudit', 'auditStats', 'searchAudit'],
      plugins: ['listPlugins', 'pluginStats', 'enablePlugin', 'disablePlugin'],
      settings: ['getSettings', 'updateSettings', 'resetSettings'],
    };

    for (const [category, names] of Object.entries(categories)) {
      console.log(`║  📂 ${category.toUpperCase()}:`);
      for (const name of names) {
        if (commands.has(name)) {
          const info = commands.get(name);
          console.log(`║    ✅ ${name.padEnd(20)} — ${info.description}`);
        }
      }
      console.log('║');
    }

    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  💡 Использование: controller.execute("command", ...args)    ║');
    console.log('║  📋 Справка: controller.getCommands()                        ║');
    console.log('║  📜 История: controller.getHistory(limit)                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
  }

  // ============================================================
  // 8. ПРОКСИ ДЛЯ ДОСТУПА К КОНТРОЛЛЕРАМ
  // ============================================================

  /**
   * Прокси для удобного доступа к контроллерам
   */
  get [Symbol.for('controller.proxy')]() {
    return new Proxy(this, {
      get: (target, prop) => {
        // Проверяем, есть ли такой контроллер
        if (prop in target._controllers) {
          return target._controllers[prop];
        }

        // Проверяем, есть ли такая команда
        if (target[target._symbols.COMMANDS].has(prop)) {
          return (...args) => target.execute(prop, ...args);
        }

        // Возвращаем свойство
        return target[prop];
      },
    });
  }
}

// ============================================================
// 9. СОЗДАНИЕ ЭКЗЕМПЛЯРА (SINGLETON)
// ============================================================

let controllerInstance = null;
const CONTROLLER_SYMBOL = Symbol.for('__APP_CONTROLLER__');

/**
 * Получение экземпляра контроллера
 */
export function getController() {
  if (!controllerInstance) {
    if (typeof window !== 'undefined' && window[CONTROLLER_SYMBOL]) {
      controllerInstance = window[CONTROLLER_SYMBOL];
    } else {
      controllerInstance = new AppController();
      controllerInstance.init();
      if (typeof window !== 'undefined') {
        window[CONTROLLER_SYMBOL] = controllerInstance;
      }
    }
  }
  return controllerInstance;
}

/**
 * Получение прокси контроллера для удобного доступа
 */
export function getControllerProxy() {
  const controller = getController();
  return controller[Symbol.for('controller.proxy')];
}

// ============================================================
// 10. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

// Создаем и регистрируем контроллер
const controller = getController();
const proxy = getControllerProxy();

// Регистрируем в глобальном объекте
if (typeof window !== 'undefined') {
  window.__controller = controller;
  window.__ctrl = proxy;

  // Добавляем в app
  if (!window.app) window.app = {};
  window.app.controller = controller;
  window.app.ctrl = proxy;

  // Выводим информацию
  console.log('📋 КОНТРОЛЛЕР ДОСТУПЕН:');
  console.log('  window.__controller — полный доступ');
  console.log('  window.__ctrl — прокси для команд');
  console.log('  window.app.controller — через app');
  console.log('  window.app.ctrl — через app (прокси)');
  console.log('');
  console.log('📋 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:');
  console.log('  __ctrl.selectTable("users") — выбрать таблицу');
  console.log('  __ctrl.addRow() — добавить строку');
  console.log('  __ctrl.createTable() — создать таблицу');
  console.log('  __ctrl.publish("topic", data) — опубликовать');
  console.log('  __ctrl.execute("console.log(1+1)") — выполнить код');
  console.log('  __ctrl.exportData() — экспорт данных');
  console.log('  __ctrl.initDemo() — демо-данные');
  console.log('  __ctrl.listPlugins() — список плагинов');
  console.log('  __ctrl.getCommands() — все команды');
  console.log('  __ctrl.getHistory() — история команд');
}

// ============================================================
// 11. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  AppController,
  getController,
  getControllerProxy,
  controller,
  proxy,
};

// ============================================================
// 12. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const symbolCount = Object.keys(new AppController()._symbols).length;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🎮 APP CONTROLLER (100% СИМВОЛЫ) v4.0.8                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(
    `║  🔑 Приватных символов: ${symbolCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║  📦 Всего символов: ${symbolCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КОНТРОЛЛЕРЫ:                                              ║');
  console.log('║    ✅ Tables — управление таблицами                           ║');
  console.log('║    ✅ Broker — брокер сообщений                              ║');
  console.log('║    ✅ Console — интерактивная консоль                        ║');
  console.log('║    ✅ Export — экспорт/импорт данных                         ║');
  console.log('║    ✅ Demo — демо-данные                                     ║');
  console.log('║    ✅ Audit — аудит                                          ║');
  console.log('║    ✅ Plugins — управление плагинами                        ║');
  console.log('║    ✅ Settings — настройки                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
}
