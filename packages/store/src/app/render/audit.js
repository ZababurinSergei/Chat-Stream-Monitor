// ============================================================
// render/audit.js — 100% СИМВОЛЫ — рендеринг аудита
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getAppState } from '../state.js';
import { isFunction, formatJson, formatTime, escapeHtml, safeCall } from '../utils.js';
import { showModal, showAlertInModal } from '../modal.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

// Цвета для разных типов действий
const ACTION_COLORS = {
  'data:insert': '#34d399', // зеленый
  'data:update': '#60a5fa', // синий
  'data:delete': '#ef4444', // красный
  'table:create': '#a78bfa', // фиолетовый
  'table:drop': '#f472b6', // розовый
  'table:clear': '#fbbf24', // желтый
  'relation:link': '#34d399', // зеленый
  'relation:unlink': '#f472b6', // розовый
  'master:select': '#60a5fa', // синий
  'transaction:begin': '#fbbf24', // желтый
  'transaction:commit': '#34d399', // зеленый
  'transaction:rollback': '#ef4444', // красный
  'system:startup': '#a78bfa', // фиолетовый
  'system:shutdown': '#f472b6', // розовый
  'system:error': '#ef4444', // красный
  'system:warning': '#fbbf24', // желтый
  'system:info': '#60a5fa', // синий
  default: '#8b96b0', // серый
};

// Иконки для разных типов действий
const ACTION_ICONS = {
  'data:insert': '➕',
  'data:update': '✏️',
  'data:delete': '🗑',
  'table:create': '📊',
  'table:drop': '🗑',
  'table:clear': '🧹',
  'relation:link': '🔗',
  'relation:unlink': '🔓',
  'master:select': '🎯',
  'transaction:begin': '🔒',
  'transaction:commit': '✅',
  'transaction:rollback': '⏪',
  'system:startup': '🚀',
  'system:shutdown': '🛑',
  'system:error': '❌',
  'system:warning': '⚠️',
  'system:info': 'ℹ️',
  default: '📌',
};

// Человекочитаемые названия действий
const ACTION_NAMES = {
  'data:insert': 'Вставка данных',
  'data:update': 'Обновление данных',
  'data:delete': 'Удаление данных',
  'table:create': 'Создание таблицы',
  'table:drop': 'Удаление таблицы',
  'table:clear': 'Очистка таблицы',
  'relation:link': 'Создание связи',
  'relation:unlink': 'Удаление связи',
  'master:select': 'Выбор мастера',
  'transaction:begin': 'Начало транзакции',
  'transaction:commit': 'Фиксация транзакции',
  'transaction:rollback': 'Откат транзакции',
  'system:startup': 'Запуск системы',
  'system:shutdown': 'Остановка системы',
  'system:error': 'Ошибка системы',
  'system:warning': 'Предупреждение системы',
  'system:info': 'Информация системы',
  default: 'Действие',
};

// ============================================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение цвета для действия
 */
function getActionColor(action) {
  return ACTION_COLORS[action] || ACTION_COLORS.default;
}

/**
 * Получение иконки для действия
 */
function getActionIcon(action) {
  return ACTION_ICONS[action] || ACTION_ICONS.default;
}

/**
 * Получение названия действия
 */
function getActionName(action) {
  return ACTION_NAMES[action] || action || 'Неизвестное действие';
}

/**
 * Форматирование данных для отображения
 */
function formatAuditData(data, maxLength = 100) {
  if (!data) return '—';

  try {
    const str = JSON.stringify(data, null, 2);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  } catch {
    return String(data);
  }
}

/**
 * Получение типа пользователя
 */
function getUserType(userId) {
  if (!userId || userId === 'anonymous') {
    return '👤 Аноним';
  }
  if (userId === 'system') {
    return '🤖 Система';
  }
  return `👤 ${escapeHtml(userId)}`;
}

// ============================================================
// 4. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг аудита — отображение лога действий
 * 100% символы — полная изоляция
 */
export function renderAudit() {
  try {
    const container = DOM.auditContainer;
    const state = getAppState();

    if (!container) {
      console.warn('⚠️ auditContainer не найден в DOM');
      return;
    }

    // ============================================================
    // 5. ПОЛУЧЕНИЕ ДАННЫХ АУДИТА
    // ============================================================

    let audit = [];
    let error = null;

    try {
      // Пытаемся получить аудит из разных источников
      if (db.audit && isFunction(db.audit.getAudit)) {
        audit = db.audit.getAudit({}, 100);
      } else if (isFunction(db.getAudit)) {
        audit = db.getAudit({}, 100);
      } else if (db._auditLog && Array.isArray(db._auditLog)) {
        audit = db._auditLog.slice(-100);
      } else if (db._private && db._private.get) {
        // Пытаемся получить из приватных данных
        const p = db._private.get(db);
        if (p) {
          const log = p[Symbol('audit.log')] || p[Symbol('store.audit')];
          if (Array.isArray(log)) {
            audit = log.slice(-100);
          }
        }
      }
    } catch (e) {
      error = e.message;
      console.warn('⚠️ Ошибка получения аудита:', e);
    }

    // ============================================================
    // 6. ОБНОВЛЕНИЕ СЧЕТЧИКА
    // ============================================================

    if (DOM.auditCount) {
      DOM.auditCount.textContent = audit.length;
    }

    if (DOM.auditSymbols) {
      DOM.auditSymbols.textContent = `🔑 ${audit.length} записей`;
    }

    // ============================================================
    // 7. ПРОВЕРКА НАЛИЧИЯ ДАННЫХ
    // ============================================================

    if (!audit || audit.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📋</span>
          Нет записей аудита
          ${error ? `<div style="font-size:11px;color:#ef4444;margin-top:4px;">Ошибка: ${escapeHtml(error)}</div>` : ''}
          <div style="font-size:11px;color:#4a5a7a;margin-top:8px;">
            💡 Для активации аудита используйте плагин AuditPlugin
          </div>
        </div>
      `;
      return;
    }

    // ============================================================
    // 8. ПОСТРОЕНИЕ HTML
    // ============================================================

    let html = `
      <div style="display:flex;flex-direction:column;gap:2px;">
    `;

    // Статистика аудита
    const stats = calculateAuditStats(audit);
    html += `
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:6px 10px;background:#0b0e14;border-radius:4px;border:1px solid #1e2633;margin-bottom:8px;">
        <span style="font-size:11px;color:#4a5a7a;">
          📊 Всего: <strong style="color:#c8d0e0;">${audit.length}</strong>
        </span>
        <span style="font-size:11px;color:#4a5a7a;">
          👤 Пользователей: <strong style="color:#c8d0e0;">${stats.uniqueUsers}</strong>
        </span>
        <span style="font-size:11px;color:#4a5a7a;">
          📋 Типов действий: <strong style="color:#c8d0e0;">${stats.actionTypes}</strong>
        </span>
        <span style="font-size:11px;color:#4a5a7a;">
          ⏱ Период: <strong style="color:#c8d0e0;">${stats.period}</strong>
        </span>
      </div>
    `;

    // Список записей аудита
    for (const entry of audit) {
      html += renderAuditEntry(entry);
    }

    html += `</div>`;

    container.innerHTML = html;

    // ============================================================
    // 9. НАСТРОЙКА СКРОЛЛА
    // ============================================================

    // Авто-скролл вниз (показываем последние записи)
    container.scrollTop = container.scrollHeight;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга аудита:', error);
    const container = DOM.auditContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки аудита
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 10. РЕНДЕРИНГ ОДНОЙ ЗАПИСИ АУДИТА
// ============================================================

function renderAuditEntry(entry) {
  try {
    const action = entry.action || entry.type || 'default';
    const color = getActionColor(action);
    const icon = getActionIcon(action);
    const name = getActionName(action);

    const timestamp = entry.timestamp || entry.createdAt || Date.now();
    const userId = entry.userId || entry.user || 'anonymous';
    const data = entry.data || entry.payload || {};

    // Форматирование данных
    const dataStr = formatAuditData(data);
    const dataObj = typeof data === 'object' && data !== null ? data : {};

    // Получение дополнительной информации
    const table = dataObj.table || dataObj.tablename || entry.table || '';
    const details = dataObj.details || dataObj.count || '';

    // Форматирование времени
    const timeStr = formatTime(timestamp);

    return `
      <div style="
        display:flex;
        flex-direction:column;
        padding:6px 10px;
        background:#0b0e14;
        border-radius:4px;
        border-left:3px solid ${color};
        border:1px solid #1e2633;
        margin-bottom:2px;
        transition:all 0.15s ease;
        cursor:default;
      " class="audit-entry">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:16px;">${icon}</span>
            <span style="font-size:12px;font-weight:500;color:${color};">${escapeHtml(name)}</span>
            ${table ? `<span style="font-size:11px;color:#4a5a7a;">📊 ${escapeHtml(table)}</span>` : ''}
            ${details ? `<span style="font-size:10px;color:#4a5a7a;background:#1a2230;padding:0 6px;border-radius:3px;">${escapeHtml(String(details))}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:#4a5a7a;">
            <span>${getUserType(userId)}</span>
            <span>[${timeStr}]</span>
          </div>
        </div>
        
        ${
          dataStr && dataStr !== '—'
            ? `
          <div style="
            margin-top:4px;
            font-family:monospace;
            font-size:10px;
            color:#8b96b0;
            background:#0f141c;
            padding:4px 8px;
            border-radius:3px;
            border:1px solid #161e2a;
            overflow-x:auto;
            white-space:pre-wrap;
            word-break:break-all;
            max-height:60px;
            overflow-y:auto;
          ">
            ${escapeHtml(dataStr)}
          </div>
        `
            : ''
        }
      </div>
    `;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга записи аудита:', error);
    return `
      <div style="padding:4px 8px;background:#0b0e14;border-radius:4px;border:1px solid #ef4444;color:#ef4444;font-size:11px;margin-bottom:2px;">
        ❌ Ошибка отображения записи аудита
      </div>
    `;
  }
}

// ============================================================
// 11. СТАТИСТИКА АУДИТА
// ============================================================

function calculateAuditStats(audit) {
  if (!audit || audit.length === 0) {
    return {
      uniqueUsers: 0,
      actionTypes: 0,
      period: '—',
    };
  }

  const users = new Set();
  const actions = new Set();
  let minTime = Infinity;
  let maxTime = 0;

  for (const entry of audit) {
    const userId = entry.userId || entry.user || 'anonymous';
    users.add(userId);

    const action = entry.action || entry.type || 'default';
    actions.add(action);

    const timestamp = entry.timestamp || entry.createdAt || 0;
    if (timestamp) {
      if (timestamp < minTime) minTime = timestamp;
      if (timestamp > maxTime) maxTime = timestamp;
    }
  }

  let period = '—';
  if (minTime !== Infinity && maxTime > 0) {
    const diff = maxTime - minTime;
    if (diff < 60000) {
      period = `${Math.round(diff / 1000)}с`;
    } else if (diff < 3600000) {
      period = `${Math.round(diff / 60000)}м`;
    } else if (diff < 86400000) {
      period = `${Math.round(diff / 3600000)}ч`;
    } else {
      period = `${Math.round(diff / 86400000)}д`;
    }
  }

  return {
    uniqueUsers: users.size,
    actionTypes: actions.size,
    period,
  };
}

// ============================================================
// 12. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С АУДИТОМ
// ============================================================

/**
 * Очистка аудита с подтверждением
 */
export function clearAudit() {
  showModal(
    '🧹 Очистка аудита',
    `<p style="color:var(--es-text-muted);">
      Вы уверены, что хотите очистить все записи аудита?
      <br><br>
      <strong>⚠️ Это действие необратимо!</strong>
    </p>`,
    () => {
      try {
        if (db.audit && isFunction(db.audit.clearAudit)) {
          db.audit.clearAudit();
        } else if (isFunction(db.clearAudit)) {
          db.clearAudit();
        } else if (db._auditLog) {
          db._auditLog = [];
        }
        renderAudit();
        showAlertInModal('🧹 Очищено', 'Аудит успешно очищен.', 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось очистить аудит: ${error.message}`, 'error');
      }
    },
    () => {
      // Отмена
    }
  );
}

/**
 * Экспорт аудита в разных форматах
 */
export function exportAudit(format = 'json') {
  try {
    let audit = [];

    // Получение аудита
    if (db.audit && isFunction(db.audit.getAudit)) {
      audit = db.audit.getAudit({}, Infinity);
    } else if (isFunction(db.getAudit)) {
      audit = db.getAudit({}, Infinity);
    } else if (db._auditLog) {
      audit = db._auditLog;
    }

    if (!audit || audit.length === 0) {
      showAlertInModal('⚠️ Нет данных', 'Аудит пуст. Нечего экспортировать.', 'warning');
      return;
    }

    let content = '';
    let filename = `audit_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'application/json';

    switch (format) {
      case 'json':
        content = JSON.stringify(audit, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;

      case 'csv':
        content = auditToCSV(audit);
        filename += '.csv';
        mimeType = 'text/csv';
        break;

      case 'html':
        content = auditToHTML(audit);
        filename += '.html';
        mimeType = 'text/html';
        break;

      case 'txt':
        content = auditToTXT(audit);
        filename += '.txt';
        mimeType = 'text/plain';
        break;

      default:
        showAlertInModal('❌ Ошибка', `Неизвестный формат: ${format}`, 'error');
        return;
    }

    // Скачивание файла
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showAlertInModal(
      '📤 Экспорт выполнен',
      `Аудит экспортирован в формате ${format.toUpperCase()} (${audit.length} записей)`,
      'success'
    );
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать аудит: ${error.message}`, 'error');
    console.error('❌ Ошибка экспорта аудита:', error);
  }
}

/**
 * Конвертация аудита в CSV
 */
function auditToCSV(audit) {
  if (!audit || audit.length === 0) return '';

  const headers = ['timestamp', 'action', 'userId', 'table', 'data'];
  let csv = headers.join(',') + '\n';

  for (const entry of audit) {
    const row = [
      entry.timestamp || entry.createdAt || '',
      entry.action || entry.type || '',
      entry.userId || entry.user || '',
      entry.table || '',
      JSON.stringify(entry.data || entry.payload || {}).replace(/,/g, ';'),
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Конвертация аудита в HTML
 */
function auditToHTML(audit) {
  if (!audit || audit.length === 0) return '';

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Аудит - ${new Date().toISOString().slice(0, 10)}</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0b0e14; color: #c8d0e0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1a2230; padding: 8px 12px; text-align: left; border-bottom: 2px solid #1e2633; }
        td { padding: 6px 12px; border-bottom: 1px solid #1e2633; }
        tr:hover { background: #1a2230; }
        .action { font-weight: 500; }
        .timestamp { color: #4a5a7a; }
        .user { color: #60a5fa; }
        .data { font-family: monospace; font-size: 10px; color: #8b96b0; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .header { margin-bottom: 20px; }
        .header h1 { color: #e0e4ee; }
        .stats { color: #4a5a7a; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Аудит</h1>
        <div class="stats">Всего записей: ${audit.length} • ${new Date().toISOString()}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Время</th>
            <th>Действие</th>
            <th>Пользователь</th>
            <th>Таблица</th>
            <th>Данные</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const entry of audit) {
    const action = entry.action || entry.type || 'default';
    const actionName = getActionName(action);
    const actionColor = getActionColor(action);

    html += `
      <tr>
        <td class="timestamp">${formatTime(entry.timestamp || entry.createdAt || Date.now())}</td>
        <td class="action" style="color:${actionColor};">${escapeHtml(actionName)}</td>
        <td class="user">${escapeHtml(entry.userId || entry.user || 'anonymous')}</td>
        <td>${escapeHtml(entry.table || '')}</td>
        <td class="data">${escapeHtml(formatAuditData(entry.data || entry.payload || {}, 80))}</td>
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

/**
 * Конвертация аудита в TXT
 */
function auditToTXT(audit) {
  if (!audit || audit.length === 0) return '';

  let txt = `=== АУДИТ ===\n`;
  txt += `Дата экспорта: ${new Date().toISOString()}\n`;
  txt += `Всего записей: ${audit.length}\n`;
  txt += `${'═'.repeat(70)}\n\n`;

  for (const entry of audit) {
    const action = entry.action || entry.type || 'default';
    const actionName = getActionName(action);
    const timestamp = formatTime(entry.timestamp || entry.createdAt || Date.now());
    const userId = entry.userId || entry.user || 'anonymous';
    const table = entry.table || '';
    const data = formatAuditData(entry.data || entry.payload || {}, 100);

    txt += `[${timestamp}] ${actionName}\n`;
    txt += `  👤 ${userId}\n`;
    if (table) txt += `  📊 ${table}\n`;
    if (data && data !== '—') txt += `  📦 ${data}\n`;
    txt += `  ${'─'.repeat(50)}\n\n`;
  }

  return txt;
}

/**
 * Фильтрация аудита
 */
export function filterAudit(filter = {}) {
  try {
    let audit = [];

    // Получение аудита
    if (db.audit && isFunction(db.audit.getAudit)) {
      audit = db.audit.getAudit(filter, Infinity);
    } else if (isFunction(db.getAudit)) {
      audit = db.getAudit(filter, Infinity);
    } else if (db._auditLog) {
      audit = db._auditLog;
    }

    if (!audit || audit.length === 0) {
      return [];
    }

    // Применение фильтров
    let filtered = [...audit];

    if (filter.action) {
      filtered = filtered.filter(e => (e.action || e.type) === filter.action);
    }

    if (filter.userId) {
      filtered = filtered.filter(e => (e.userId || e.user) === filter.userId);
    }

    if (filter.table) {
      filtered = filtered.filter(e => (e.table || e.data?.table) === filter.table);
    }

    if (filter.from) {
      const from = new Date(filter.from).getTime();
      filtered = filtered.filter(e => (e.timestamp || e.createdAt || 0) >= from);
    }

    if (filter.to) {
      const to = new Date(filter.to).getTime();
      filtered = filtered.filter(e => (e.timestamp || e.createdAt || 0) <= to);
    }

    return filtered;
  } catch (error) {
    console.warn('⚠️ Ошибка фильтрации аудита:', error);
    return [];
  }
}

/**
 * Получение статистики аудита
 */
export function getAuditStats() {
  try {
    let audit = [];

    if (db.audit && isFunction(db.audit.getAudit)) {
      audit = db.audit.getAudit({}, Infinity);
    } else if (isFunction(db.getAudit)) {
      audit = db.getAudit({}, Infinity);
    } else if (db._auditLog) {
      audit = db._auditLog;
    }

    if (!audit || audit.length === 0) {
      return {
        total: 0,
        uniqueUsers: 0,
        actionTypes: 0,
        actions: {},
        users: {},
        tables: {},
        period: '—',
      };
    }

    const actions = {};
    const users = {};
    const tables = {};
    let minTime = Infinity;
    let maxTime = 0;

    for (const entry of audit) {
      const action = entry.action || entry.type || 'default';
      actions[action] = (actions[action] || 0) + 1;

      const userId = entry.userId || entry.user || 'anonymous';
      users[userId] = (users[userId] || 0) + 1;

      const table = entry.table || entry.data?.table || '';
      if (table) {
        tables[table] = (tables[table] || 0) + 1;
      }

      const timestamp = entry.timestamp || entry.createdAt || 0;
      if (timestamp) {
        if (timestamp < minTime) minTime = timestamp;
        if (timestamp > maxTime) maxTime = timestamp;
      }
    }

    let period = '—';
    if (minTime !== Infinity && maxTime > 0) {
      const diff = maxTime - minTime;
      if (diff < 60000) {
        period = `${Math.round(diff / 1000)}с`;
      } else if (diff < 3600000) {
        period = `${Math.round(diff / 60000)}м`;
      } else if (diff < 86400000) {
        period = `${Math.round(diff / 3600000)}ч`;
      } else {
        period = `${Math.round(diff / 86400000)}д`;
      }
    }

    return {
      total: audit.length,
      uniqueUsers: Object.keys(users).length,
      actionTypes: Object.keys(actions).length,
      actions,
      users,
      tables,
      period,
    };
  } catch (error) {
    console.warn('⚠️ Ошибка получения статистики аудита:', error);
    return null;
  }
}

// ============================================================
// 13. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ АУДИТА
// ============================================================

let auditInterval = null;

/**
 * Запуск автоматического обновления аудита
 */
export function startAuditAutoRefresh(interval = 5000) {
  if (auditInterval) {
    clearInterval(auditInterval);
  }
  auditInterval = setInterval(() => {
    renderAudit();
  }, interval);
}

/**
 * Остановка автоматического обновления аудита
 */
export function stopAuditAutoRefresh() {
  if (auditInterval) {
    clearInterval(auditInterval);
    auditInterval = null;
  }
}

// ============================================================
// 14. ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.renderAudit = renderAudit;
  window.app.clearAudit = clearAudit;
  window.app.exportAudit = exportAudit;
  window.app.filterAudit = filterAudit;
  window.app.getAuditStats = getAuditStats;
  window.app.startAuditAutoRefresh = startAuditAutoRefresh;
  window.app.stopAuditAutoRefresh = stopAuditAutoRefresh;

  // Горячие клавиши
  document.addEventListener('keydown', e => {
    // Ctrl+Shift+A — экспорт аудита
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      exportAudit('json');
    }
    // Ctrl+Shift+C — очистка аудита
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      clearAudit();
    }
  });

  console.log('📋 АУДИТ КОМАНДЫ:');
  console.log('  app.renderAudit() — обновить аудит');
  console.log('  app.clearAudit() — очистить аудит');
  console.log('  app.exportAudit(format) — экспорт аудита (json|csv|html|txt)');
  console.log('  app.filterAudit(filter) — фильтрация аудита');
  console.log('  app.getAuditStats() — статистика аудита');
  console.log('  app.startAuditAutoRefresh(ms) — автообновление');
  console.log('  app.stopAuditAutoRefresh() — остановка автообновления');
  console.log('  ⌨️ Ctrl+Shift+A — экспорт аудита');
  console.log('  ⌨️ Ctrl+Shift+C — очистка аудита');
}

// ============================================================
// 15. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderAudit,
  clearAudit,
  exportAudit,
  filterAudit,
  getAuditStats,
  startAuditAutoRefresh,
  stopAuditAutoRefresh,
};
