// ============================================================
// controllers/console.js — 100% СИМВОЛЫ — интерактивная консоль
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { CONFIG } from '../config.js';
import { getAppState } from '../state.js';
import { renderAll } from '../render/index.js';
import { escapeHtml, formatJson, safeCall, isFunction, isObject } from '../utils.js';
import { showAlertInModal } from '../modal.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

// История команд
const COMMAND_HISTORY = [];
let HISTORY_INDEX = -1;
const MAX_HISTORY = 100;

// Доступные команды для автодополнения
const AVAILABLE_COMMANDS = [
  'db',
  'app',
  'renderAll',
  'selectTable',
  'addRow',
  'createTable',
  'clearConsole',
  'getState',
  'healthCheck',
  'initDemo',
  'getGlobalStore',
  'help',
  'clear',
  'ls',
  'tables',
  'stats',
  'plugins',
  'audit',
  'broker',
  'cache',
  'quotas',
];

// ============================================================
// 3. ОСНОВНАЯ ФУНКЦИЯ ВЫПОЛНЕНИЯ КОМАНДЫ
// ============================================================

/**
 * Выполнение команды в интерактивной консоли
 * 100% символы — полная изоляция
 */
export function executeCommand() {
  const input = DOM.consoleInput;
  const output = DOM.consoleOutput;

  if (!input || !output) {
    console.warn('⚠️ Консоль не инициализирована');
    return;
  }

  const command = input.value.trim();
  if (!command) {
    addLog('ℹ️ Пустая команда', 'info');
    return;
  }

  // Добавляем команду в историю
  addToHistory(command);
  HISTORY_INDEX = -1;

  // Отображаем введенную команду
  const cmdEntry = document.createElement('div');
  cmdEntry.style.cssText = `
    color: var(--es-accent-blue-light);
    margin: 4px 0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  `;
  cmdEntry.innerHTML = `
    <span style="color: var(--es-accent-green);">❯</span>
    <span>${escapeHtml(command)}</span>
  `;
  output.appendChild(cmdEntry);

  // Выполняем команду
  try {
    const startTime = performance.now();
    let result;

    // Проверяем специальные команды
    if (command === 'help' || command === '?') {
      result = showHelp();
    } else if (command === 'clear' || command === 'cls') {
      clearConsole();
      input.value = '';
      input.focus();
      return;
    } else if (command === 'ls' || command === 'tables') {
      result = listTables();
    } else if (command === 'stats') {
      result = showStats();
    } else if (command === 'plugins') {
      result = listPlugins();
    } else if (command === 'audit') {
      result = showAudit();
    } else if (command === 'broker') {
      result = showBroker();
    } else if (command === 'cache') {
      result = showCache();
    } else if (command === 'quotas') {
      result = showQuotas();
    } else if (command.startsWith('select ')) {
      result = handleSelect(command);
    } else {
      // Выполняем JavaScript код
      result = evalInContext(command);
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    // Отображаем результат
    displayResult(result, duration);

    // Логируем выполнение
    addLog(`💻 Выполнено: ${command}`, 'success', { result, duration });
  } catch (error) {
    // Отображаем ошибку
    displayError(error);

    // Логируем ошибку
    addLog(`❌ Ошибка: ${error.message}`, 'error', { command, stack: error.stack });
  }

  // Очищаем поле ввода
  input.value = '';
  input.focus();

  // Прокручиваем к последнему сообщению
  output.scrollTop = output.scrollHeight;

  // Обновляем UI
  renderAll();
}

// ============================================================
// 4. ВЫПОЛНЕНИЕ КОДА В БЕЗОПАСНОМ КОНТЕКСТЕ
// ============================================================

/**
 * Выполнение JavaScript кода в контексте приложения
 */
function evalInContext(code) {
  // Создаем безопасный контекст с доступом к необходимым объектам
  const context = {
    db,
    app: window.app,
    console: console,
    JSON: JSON,
    Date: Date,
    Math: Math,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    // Добавляем часто используемые функции
    renderAll,
    selectTable: window.app?.selectTable || null,
    addRow: window.app?.addRow || null,
    createTable: window.app?.createTable || null,
    clearConsole,
    getState: window.app?.getState || null,
    healthCheck: window.app?.healthCheck || null,
    initDemo: window.app?.initDemo || null,
    getGlobalStore: window.app?.getGlobalStore || null,
  };

  // Создаем функцию с доступом к контексту
  const fn = new Function(...Object.keys(context), `"use strict"; return (${code})`);

  return fn(...Object.values(context));
}

// ============================================================
// 5. ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ
// ============================================================

/**
 * Отображение результата выполнения
 */
function displayResult(result, duration) {
  const output = DOM.consoleOutput;

  const resultEntry = document.createElement('div');
  resultEntry.style.cssText = `
    margin: 2px 0 8px 20px;
    padding: 4px 8px;
    border-left: 2px solid var(--es-accent-green);
    background: var(--es-bg-primary);
    border-radius: 4px;
    font-family: var(--es-font-mono, monospace);
  `;

  if (result === undefined) {
    resultEntry.innerHTML = `
      <span style="color: var(--es-text-dim);">✅ Выполнено (undefined) — ${duration}ms</span>
    `;
  } else if (typeof result === 'string') {
    resultEntry.innerHTML = `
      <span style="color: var(--es-accent-purple);">${escapeHtml(result)}</span>
      <span style="color: var(--es-text-dim); font-size: 10px; margin-left: 8px;">— ${duration}ms</span>
    `;
  } else if (typeof result === 'number') {
    resultEntry.innerHTML = `
      <span style="color: var(--es-accent-yellow);">${result}</span>
      <span style="color: var(--es-text-dim); font-size: 10px; margin-left: 8px;">— ${duration}ms</span>
    `;
  } else if (typeof result === 'boolean') {
    resultEntry.innerHTML = `
      <span style="color: ${result ? 'var(--es-accent-green)' : 'var(--es-accent-red)'};">${result}</span>
      <span style="color: var(--es-text-dim); font-size: 10px; margin-left: 8px;">— ${duration}ms</span>
    `;
  } else if (Array.isArray(result)) {
    const preview =
      result.length > 5
        ? `[${result
            .slice(0, 5)
            .map(item => JSON.stringify(item))
            .join(', ')} ... +${result.length - 5}]`
        : JSON.stringify(result);
    resultEntry.innerHTML = `
      <div style="color: var(--es-accent-blue-light);">
        📊 Массив (${result.length} элементов)
      </div>
      <div style="color: var(--es-text-secondary); font-size: 11px; margin-top: 4px; word-break: break-all;">
        ${escapeHtml(preview)}
      </div>
      <div style="color: var(--es-text-dim); font-size: 10px; margin-top: 4px;">
        — ${duration}ms
      </div>
    `;
  } else if (isObject(result)) {
    try {
      const json = formatJson(result);
      const preview = json.length > 500 ? json.substring(0, 500) + '...' : json;
      resultEntry.innerHTML = `
        <div style="color: var(--es-accent-blue-light);">
          📦 Объект (${Object.keys(result).length} полей)
        </div>
        <pre style="
          color: var(--es-text-secondary);
          font-size: 11px;
          margin: 4px 0;
          padding: 4px 8px;
          background: var(--es-bg-secondary);
          border-radius: 4px;
          border: 1px solid var(--es-border-secondary);
          overflow-x: auto;
          max-height: 200px;
          white-space: pre-wrap;
          word-break: break-all;
        ">${escapeHtml(preview)}</pre>
        <div style="color: var(--es-text-dim); font-size: 10px; margin-top: 4px;">
          — ${duration}ms
        </div>
      `;
    } catch (e) {
      resultEntry.innerHTML = `
        <span style="color: var(--es-accent-purple);">${escapeHtml(String(result))}</span>
        <span style="color: var(--es-text-dim); font-size: 10px; margin-left: 8px;">— ${duration}ms</span>
      `;
    }
  } else {
    resultEntry.innerHTML = `
      <span style="color: var(--es-accent-purple);">${escapeHtml(String(result))}</span>
      <span style="color: var(--es-text-dim); font-size: 10px; margin-left: 8px;">— ${duration}ms</span>
    `;
  }

  output.appendChild(resultEntry);
}

/**
 * Отображение ошибки
 */
function displayError(error) {
  const output = DOM.consoleOutput;

  const errorEntry = document.createElement('div');
  errorEntry.style.cssText = `
    margin: 2px 0 8px 20px;
    padding: 6px 10px;
    border-left: 2px solid var(--es-accent-red);
    background: rgba(239, 68, 68, 0.08);
    border-radius: 4px;
    font-family: var(--es-font-mono, monospace);
  `;

  errorEntry.innerHTML = `
    <div style="color: var(--es-accent-red); font-weight: 500;">
      ❌ ${escapeHtml(error.message || 'Неизвестная ошибка')}
    </div>
    ${
      error.stack
        ? `
      <div style="color: var(--es-text-dim); font-size: 10px; margin-top: 4px; white-space: pre-wrap; word-break: break-all;">
        ${escapeHtml(error.stack)}
      </div>
    `
        : ''
    }
  `;

  output.appendChild(errorEntry);
}

// ============================================================
// 6. СПЕЦИАЛЬНЫЕ КОМАНДЫ
// ============================================================

/**
 * Показать справку
 */
function showHelp() {
  const commands = [
    ['help, ?', 'Показать эту справку'],
    ['clear, cls', 'Очистить консоль'],
    ['ls, tables', 'Список таблиц'],
    ['stats', 'Статистика системы'],
    ['plugins', 'Список плагинов'],
    ['audit', 'Последние записи аудита'],
    ['broker', 'Статистика брокера'],
    ['cache', 'Статистика кэша'],
    ['quotas', 'Квоты и лимиты'],
    ['select <table>', 'Выбрать таблицу'],
    ['<JS код>', 'Выполнить JavaScript код'],
  ];

  let helpText = '📋 Доступные команды:\n\n';
  const maxLen = Math.max(...commands.map(c => c[0].length));

  for (const [cmd, desc] of commands) {
    const padding = ' '.repeat(maxLen - cmd.length + 2);
    helpText += `  ${cmd}${padding}${desc}\n`;
  }

  helpText += '\n💡 Примеры:\n';
  helpText += '  db.users.all() — получить всех пользователей\n';
  helpText += '  db.users.add({ id: "u1", name: "Тест" }) — добавить пользователя\n';
  helpText += '  renderAll() — обновить интерфейс\n';
  helpText += '  getState() — получить состояние\n';

  return helpText;
}

/**
 * Список таблиц
 */
function listTables() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    if (tables.length === 0) {
      return '📭 Нет таблиц';
    }

    const tableInfo = tables.map(name => {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      const count = table ? table.data.length : 0;
      const hasSchema = isFunction(db.getSchema) ? !!db.getSchema(name) : false;
      return `  📊 ${name}${hasSchema ? ' 📐' : ''} — ${count} записей`;
    });

    return `📋 Таблицы (${tables.length}):\n${tableInfo.join('\n')}`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Статистика системы
 */
function showStats() {
  try {
    const state = isFunction(db.getState) ? db.getState() : {};
    const health = isFunction(db.healthCheck) ? db.healthCheck() : {};
    const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];
    const tables = isFunction(db.listTables) ? db.listTables() : [];

    return `
📊 СТАТИСТИКА СИСТЕМЫ

📋 Таблиц: ${tables.length}
📝 Записей: ${health.records || 0}
🔗 Связей: ${state.relations ? state.relations.length : 0}
📡 Подписчиков: ${health.listeners || 0}
📡 Подписчиков: ${health.listeners || 0}
🔌 Плагинов: ${plugins.length}
↩️ Undo: ${state.undoSize || 0}
↪️ Redo: ${state.redoSize || 0}
📦 Транзакций: ${state.transactions || 0}
💾 Кэш: ${health.cacheSize || 0}
📋 Аудит: ${health.auditSize || 0}
⏱ Uptime: ${Math.floor((Date.now() - health.startTime) / 1000)}с
📦 Версия: ${CONFIG.version}
🔄 Immer: ${CONFIG.immerEnabled ? '✅' : '❌'}
`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Список плагинов
 */
function listPlugins() {
  try {
    const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];
    if (plugins.length === 0) {
      return '🔌 Нет активных плагинов';
    }

    const pluginInfo = plugins.map(name => {
      const plugin = isFunction(db.getPlugin) ? db.getPlugin(name) : null;
      const version = plugin?.version || '?';
      const status = plugin?.isActive !== false ? '✅ активен' : '❌ неактивен';
      return `  ${status} ${name} (v${version})`;
    });

    return `🔌 Плагины (${plugins.length}):\n${pluginInfo.join('\n')}`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Последние записи аудита
 */
function showAudit() {
  try {
    let audit = [];
    if (db.audit && isFunction(db.audit.getAudit)) {
      audit = db.audit.getAudit({}, 10);
    } else if (isFunction(db.getAudit)) {
      audit = db.getAudit({}, 10);
    }

    if (audit.length === 0) {
      return '📋 Нет записей аудита';
    }

    const entries = audit.map(entry => {
      const time = new Date(entry.timestamp || Date.now()).toLocaleTimeString();
      const action = entry.action || 'unknown';
      const user = entry.userId || 'anonymous';
      return `  [${time}] ${action} — ${user}`;
    });

    return `📋 Аудит (последние ${audit.length}):\n${entries.join('\n')}`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Статистика брокера
 */
function showBroker() {
  try {
    let stats = {};
    if (db.broker && isFunction(db.broker.getStats)) {
      stats = db.broker.getStats();
    } else if (isFunction(db.getBrokerStats)) {
      stats = db.getBrokerStats();
    }

    return `
📨 СТАТИСТИКА БРОКЕРА

📨 Опубликовано: ${stats.published || 0}
📨 Доставлено: ${stats.delivered || 0}
❌ Ошибок: ${stats.failed || 0}
🔄 Повторов: ${stats.retried || 0}
📡 Подписчиков: ${stats.subscriberCount || 0}
📋 Топиков: ${stats.topics || 0}
💀 Dead Letter: ${stats.deadLetter || 0}
⏳ Ожидание: ${stats.retryQueue || 0}
`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Статистика кэша
 */
function showCache() {
  try {
    let stats = {};
    if (db.cache && isFunction(db.cache.getStats)) {
      stats = db.cache.getStats();
    } else if (isFunction(db.getCacheStats)) {
      stats = db.getCacheStats();
    }

    return `
💾 СТАТИСТИКА КЭША

💾 Записей: ${stats.size || 0}
💾 Память: ${stats.memoryUsage ? Math.round(stats.memoryUsage / 1024) + ' KB' : '0 KB'}
🎯 Попаданий: ${stats.hits || 0}
❌ Промахов: ${stats.misses || 0}
📊 Hit Rate: ${stats.hitRate || 0}%
⚡ Стратегия: ${stats.strategy || 'LRU'}
🗑 Вытеснено: ${stats.evictions || 0}
`;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Квоты и лимиты
 */
function showQuotas() {
  try {
    const quotas = isFunction(db.getQuotas) ? db.getQuotas() : {};
    const usage = isFunction(db.getUsage) ? db.getUsage() : {};

    if (Object.keys(quotas).length === 0) {
      return '📊 Квоты не настроены';
    }

    let output = '📊 КВОТЫ И ЛИМИТЫ\n\n';
    for (const [key, value] of Object.entries(quotas)) {
      const used = usage[key] || 0;
      const percentage = value > 0 ? Math.min((used / value) * 100, 100) : 0;
      const status = percentage >= 95 ? '🔴' : percentage >= 80 ? '🟡' : '🟢';
      output += `  ${status} ${key}: ${used} / ${value} (${percentage.toFixed(1)}%)\n`;
    }

    return output;
  } catch (error) {
    return `❌ Ошибка: ${error.message}`;
  }
}

/**
 * Обработка команды select
 */
function handleSelect(command) {
  const match = command.match(/^select\s+(\w+)$/);
  if (!match) {
    return '❌ Использование: select <table_name>';
  }

  const tableName = match[1];
  if (!isFunction(db.getTable) || !db.getTable(tableName)) {
    return `❌ Таблица "${tableName}" не найдена`;
  }

  if (window.app?.selectTable) {
    window.app.selectTable(tableName);
    return `✅ Таблица "${tableName}" выбрана`;
  }

  return `✅ Таблица "${tableName}" найдена (не выбрана)`;
}

// ============================================================
// 7. УПРАВЛЕНИЕ ИСТОРИЕЙ КОМАНД
// ============================================================

/**
 * Добавление команды в историю
 */
function addToHistory(command) {
  if (!command) return;
  // Удаляем дубликаты
  const index = COMMAND_HISTORY.indexOf(command);
  if (index !== -1) {
    COMMAND_HISTORY.splice(index, 1);
  }
  COMMAND_HISTORY.push(command);
  if (COMMAND_HISTORY.length > MAX_HISTORY) {
    COMMAND_HISTORY.shift();
  }
}

/**
 * Навигация по истории команд
 */
export function navigateHistory(direction) {
  const input = DOM.consoleInput;
  if (!input) return;

  if (COMMAND_HISTORY.length === 0) return;

  if (direction === 'up') {
    if (HISTORY_INDEX < 0) {
      // Сохраняем текущий ввод как временный
      HISTORY_INDEX = COMMAND_HISTORY.length - 1;
    } else {
      HISTORY_INDEX = Math.max(0, HISTORY_INDEX - 1);
    }
    input.value = COMMAND_HISTORY[HISTORY_INDEX] || '';
  } else if (direction === 'down') {
    if (HISTORY_INDEX >= 0 && HISTORY_INDEX < COMMAND_HISTORY.length - 1) {
      HISTORY_INDEX++;
      input.value = COMMAND_HISTORY[HISTORY_INDEX] || '';
    } else {
      HISTORY_INDEX = -1;
      input.value = '';
    }
  }

  // Позиционируем курсор в конце
  input.selectionStart = input.value.length;
  input.selectionEnd = input.value.length;
}

// ============================================================
// 8. ОЧИСТКА КОНСОЛИ
// ============================================================

/**
 * Очистка консоли
 */
export function clearConsole() {
  const output = DOM.consoleOutput;
  if (!output) return;

  output.innerHTML = `
    <div style="color: var(--es-text-dim); font-size: 12px; padding: 4px 0;">
      💡 Введите команду или JavaScript код ниже...
    </div>
    <div style="color: var(--es-text-dim); font-size: 11px; margin-top: 4px;">
      📋 Для справки введите <span style="color: var(--es-accent-blue-light);">help</span>
    </div>
  `;

  addLog('🧹 Консоль очищена', 'info');
}

// ============================================================
// 9. АВТОДОПОЛНЕНИЕ
// ============================================================

/**
 * Автодополнение команд (Tab)
 */
export function autocomplete() {
  const input = DOM.consoleInput;
  if (!input) return;

  const value = input.value.trim();
  if (!value) return;

  // Ищем совпадения
  const matches = AVAILABLE_COMMANDS.filter(cmd => cmd.startsWith(value) && cmd !== value);

  if (matches.length === 1) {
    // Только одно совпадение — дополняем
    input.value = matches[0];
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
  } else if (matches.length > 1) {
    // Несколько совпадений — показываем подсказку
    const output = DOM.consoleOutput;
    const hint = document.createElement('div');
    hint.style.cssText = `
      margin: 2px 0 4px 20px;
      color: var(--es-text-dim);
      font-size: 11px;
    `;
    hint.textContent = `💡 Возможные команды: ${matches.join(', ')}`;
    output.appendChild(hint);
    output.scrollTop = output.scrollHeight;
  }
}

// ============================================================
// 10. ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
// ============================================================

/**
 * Инициализация обработчиков консоли
 */
export function initConsoleHandlers() {
  const input = DOM.consoleInput;
  const execBtn = DOM.consoleExecBtn;
  const clearBtn = DOM.consoleClearBtn || document.getElementById('clearConsoleBtn');

  if (!input) {
    console.warn('⚠️ consoleInput не найден в DOM');
    return;
  }

  // Выполнение по Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    }
  });

  // Кнопка выполнения
  if (execBtn) {
    execBtn.addEventListener('click', executeCommand);
  }

  // Кнопка очистки
  if (clearBtn) {
    clearBtn.addEventListener('click', clearConsole);
  }

  // Ctrl+L — очистка консоли
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      clearConsole();
    }
  });

  addLog('💻 Консоль готова к работе', 'info');
}

// ============================================================
// 11. ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.executeCommand = executeCommand;
  window.app.clearConsole = clearConsole;
  window.app.autocomplete = autocomplete;
  window.app.navigateHistory = navigateHistory;

  // Добавляем удобные алиасы
  window.app.exec = executeCommand;
  window.app.cls = clearConsole;

  console.log('📋 Команды консоли:');
  console.log('  window.app.executeCommand(code) — выполнить код');
  console.log('  window.app.clearConsole() — очистить консоль');
  console.log('  window.app.exec(code) — алиас executeCommand');
  console.log('  window.app.cls() — алиас clearConsole');
  console.log('');
  console.log('💡 Горячие клавиши:');
  console.log('  Enter — выполнить');
  console.log('  ↑ / ↓ — история команд');
  console.log('  Tab — автодополнение');
  console.log('  Ctrl+L — очистить консоль');
}

// ============================================================
// 12. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  executeCommand,
  clearConsole,
  autocomplete,
  navigateHistory,
  initConsoleHandlers,
  addToHistory,
  getHistory: () => [...COMMAND_HISTORY],
  getAvailableCommands: () => [...AVAILABLE_COMMANDS],
};
