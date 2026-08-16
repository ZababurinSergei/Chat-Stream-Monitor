// ============================================================
// app/render/index.js — 100% СИМВОЛЫ — главный рендерер
// Версия: 4.0.8 (МОДУЛЬНАЯ — ИСПРАВЛЕНА)
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE, PUBLIC, INTERNAL } from '../symbols.js';
import { getAppState, getSelectedTable, getSelectedRow, setActiveTab } from '../state.js';
import { isFunction, escapeHtml, formatJson, formatTime, safeCall } from '../utils.js';
import { addLog } from '../logger.js';
import { showModal, showAlertInModal } from '../modal.js';

// ============================================================
// 1. РЕНДЕРИНГ СТАТИСТИКИ
// ============================================================

export function renderStats() {
  try {
    const state = isFunction(db.getState)
        ? db.getState()
        : { tables: [], relations: [], undoSize: 0, redoSize: 0 };
    const health = isFunction(db.healthCheck) ? db.healthCheck() : { records: 0, listeners: 0 };

    if (DOM.tablesCount) DOM.tablesCount.textContent = state.tables ? state.tables.length : 0;
    if (DOM.recordsCount) DOM.recordsCount.textContent = health.records || 0;
    if (DOM.relationsCount)
      DOM.relationsCount.textContent = state.relations ? state.relations.length : 0;
    if (DOM.subscribersCount) DOM.subscribersCount.textContent = health.listeners || 0;
    if (DOM.undoCount) DOM.undoCount.textContent = state.undoSize || 0;
    if (DOM.redoCount) DOM.redoCount.textContent = state.redoSize || 0;

    // Безопасное получение статистики кэша
    let cacheStats = { size: 0, hits: 0, misses: 0 };
    try {
      if (db.cache && isFunction(db.cache.getCacheStats)) {
        cacheStats = db.cache.getCacheStats();
      } else if (isFunction(db.getCacheStats)) {
        cacheStats = db.getCacheStats();
      }
    } catch (e) {
      // игнорируем ошибки
    }
    if (DOM.cacheCount) DOM.cacheCount.textContent = cacheStats.size || 0;

    // Безопасное получение аудита
    let auditCount = 0;
    try {
      if (db.audit && isFunction(db.audit.getAudit)) {
        const audit = db.audit.getAudit({}, 100);
        auditCount = audit.length;
      } else if (isFunction(db.getAudit)) {
        const audit = db.getAudit({}, 100);
        auditCount = audit.length;
      }
    } catch (e) {
      // игнорируем ошибки
    }
    if (DOM.auditCount) DOM.auditCount.textContent = auditCount;

    if (DOM.versionBadge) DOM.versionBadge.textContent = `v${state.version || '4.0.8'}`;
    if (DOM.statusBadge) {
      DOM.statusBadge.textContent = health.ready ? '● Готов' : '● Ошибка';
      DOM.statusBadge.className = `badge ${health.ready ? 'success' : 'error'}`;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга статистики:', error);
  }
}

// ============================================================
// 2. РЕНДЕРИНГ ТАБЛИЦ
// ============================================================

export function renderTables() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    const container = DOM.tablesList;
    const state = getAppState();
    const selectedTable = state[PRIVATE.SELECTED_TABLE];
    // console.log('------ tables -------', tables);
// console.log('------ container -------', container);
//     console.log('------ state -------', JSON.stringify(state, null, 4));
//     console.log('------ selectedTable -------', selectedTable);
    if (!container) return;

    if (tables.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📭</span>
          Нет таблиц
          <span style="display:block;font-size:11px;color:#3a4a6a;margin-top:4px;">
            Нажмите «➕» для создания
          </span>
        </div>
      `;
      if (DOM.tablesInfo) DOM.tablesInfo.textContent = 'Нет таблиц';
      return;
    }

    let html = '';
    for (const name of tables) {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      const count = table ? table.data.length : 0;
      const isActive = name === selectedTable;
      const hasSchema = isFunction(db.getSchema) ? !!db.getSchema(name) : false;

      html += `
        <div class="table-item ${isActive ? 'active' : ''}" data-table="${name}">
          <span class="name">📋 ${escapeHtml(name)} ${hasSchema ? '📐' : ''}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="count">${count}</span>
            <div class="actions">
              <button class="danger" data-table="${name}" title="Удалить таблицу">🗑</button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    if (DOM.tablesInfo) DOM.tablesInfo.textContent = `${tables.length} таблиц`;

    container.querySelectorAll('.table-item').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.actions')) return;
        const name = el.dataset.table;
        selectTable(name);
      });
    });

    container.querySelectorAll('.actions .danger').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const name = el.dataset.table;
        showModal(
            `🗑 Удалить таблицу "${name}"?`,
            `<p style="color:var(--es-text-muted);">Все данные таблицы будут удалены без возможности восстановления.</p>`,
            () => {
              if (isFunction(db.dropTable)) db.dropTable(name);
              const state = getAppState();
              if (state[PRIVATE.SELECTED_TABLE] === name) {
                state[PRIVATE.SELECTED_TABLE] = null;
                renderData();
              }
              renderAll();
              addLog(`🗑 Таблица "${name}" удалена`, 'warn');
            },
            () => {
              addLog(`ℹ️ Удаление таблицы "${name}" отменено`, 'info');
            }
        );
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга таблиц:', error);
  }
}

// ============================================================
// 3. РЕНДЕРИНГ ДАННЫХ
// ============================================================

export function renderData() {
  try {
    const container = DOM.dataContainer;
    console.log('========== container ===========', DOM);
    const state = getAppState();
    const selectedTable = state[PRIVATE.SELECTED_TABLE];

    if (!container) return;

    if (!selectedTable) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📋</span>
          Выберите таблицу из списка слева
        </div>
      `;
      if (DOM.currentTableTitle) DOM.currentTableTitle.textContent = '📊 Данные';
      if (DOM.addRowBtn) DOM.addRowBtn.disabled = true;
      return;
    }

    const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
    if (!table) {
      container.innerHTML = `<div class="empty-state" style="color:#ef4444;">❌ Таблица не найдена</div>`;
      if (DOM.addRowBtn) DOM.addRowBtn.disabled = true;
      return;
    }

    if (DOM.currentTableTitle) {
      DOM.currentTableTitle.textContent = `📊 ${escapeHtml(selectedTable)} (${table.data.length} записей)`;
    }
    if (DOM.addRowBtn) DOM.addRowBtn.disabled = false;

    if (table.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📭</span>
          Нет данных в таблице
        </div>
      `;
      return;
    }

    const firstRow = table.data[0];
    const columns = Object.keys(firstRow);
    const selectedId = isFunction(db.getSelection) ? db.getSelection(selectedTable) : null;

    let html = `<table class="data-table"><thead><tr>`;
    html += `<th style="width:30px;">#</th>`;
    for (const col of columns) {
      html += `<th>${escapeHtml(col)}</th>`;
    }
    html += `<th style="width:80px;">Действия</th></tr></thead><tbody>`;

    for (let i = 0; i < table.data.length; i++) {
      const row = table.data[i];
      const isSelected = row.id === selectedId;

      html += `<tr class="${isSelected ? 'selected' : ''}" data-id="${escapeHtml(row.id)}">`;
      html += `<td class="id-col">${i + 1}</td>`;

      for (const col of columns) {
        const value = row[col];
        let display = value;
        if (typeof value === 'object' && value !== null) {
          display = JSON.stringify(value).substring(0, 50);
        }
        if (col === 'id') {
          html += `<td class="id-col" title="${escapeHtml(String(display))}">${escapeHtml(String(display).substring(0, 12))}</td>`;
        } else {
          html += `<td title="${escapeHtml(String(display))}">${escapeHtml(String(display))}</td>`;
        }
      }

      html += `
        <td>
          <div class="actions-col">
            <button class="select-btn" data-id="${escapeHtml(row.id)}" title="Выделить">🎯</button>
            <button class="danger delete-btn" data-id="${escapeHtml(row.id)}" title="Удалить">🗑</button>
          </div>
        </td>
      </tr>`;
    }

    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (isFunction(db.selectRow)) db.selectRow(selectedTable, id);
        const state = getAppState();
        state[PRIVATE.SELECTED_ROW] = id;
        renderData();
        renderInspector();
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        showModal(
            `🗑 Удалить запись?`,
            `<p style="color:var(--es-text-muted);">Запись с ID: <strong>${escapeHtml(id)}</strong> будет удалена без возможности восстановления.</p>`,
            () => {
              if (isFunction(db.delete)) db.delete(selectedTable, { id });
              renderAll();
              addLog(`🗑 Запись "${id}" удалена`, 'warn');
            },
            () => {
              addLog(`ℹ️ Удаление записи "${id}" отменено`, 'info');
            }
        );
      });
    });

    container.querySelectorAll('tbody tr').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (id) {
          if (isFunction(db.selectRow)) db.selectRow(selectedTable, id);
          const state = getAppState();
          state[PRIVATE.SELECTED_ROW] = id;
          renderData();
          renderInspector();
        }
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга данных:', error);
  }
}

// ============================================================
// 4. РЕНДЕРИНГ ИНСПЕКТОРА
// ============================================================

export function renderInspector() {
  try {
    const container = DOM.inspectorContent;
    const state = getAppState();
    const selectedTable = state[PRIVATE.SELECTED_TABLE];
    const selectedRow = state[PRIVATE.SELECTED_ROW];

    if (!container) return;

    if (!selectedRow || !selectedTable) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔍</span>
          Выберите строку для просмотра
        </div>
      `;
      return;
    }

    const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
    if (!table) return;

    const row = table.data.find(r => r.id === selectedRow);
    if (!row) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔍</span>
          Строка не найдена
        </div>
      `;
      return;
    }

    const html = `
      <div style="font-size:11px;color:#4a5a7a;margin-bottom:8px;">
        🆔 ${escapeHtml(row.id)}
        <span style="margin-left:12px;">📊 ${escapeHtml(selectedTable)}</span>
      </div>
      <div style="background:#0b0e14;border-radius:6px;border:1px solid #1e2633;padding:8px;font-family:monospace;font-size:11px;overflow-x:auto;">
        <pre style="color:#8b96b0;margin:0;white-space:pre-wrap;word-break:break-all;">${escapeHtml(formatJson(row))}</pre>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга инспектора:', error);
  }
}

// ============================================================
// 5. РЕНДЕРИНГ СВЯЗЕЙ
// ============================================================

export function renderRelations() {
  try {
    const container = DOM.relationsContainer;
    if (!container) return;

    let relations = {};
    try {
      const p = db._;
      if (p) {
        relations = p[Symbol('store.relations')] || {};
      }
    } catch (e) {
      relations = {};
    }

    const entries = Object.entries(relations);
    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет связей</div>`;
      return;
    }

    let html = '';
    for (const [key, rel] of entries) {
      const detailsCount = rel.details ? rel.details.length : 0;
      const isActive = rel.masterId !== null && rel.masterId !== undefined;
      const masterName = rel.masterData?.name || rel.masterData?.title || rel.masterId || '—';

      html += `
        <div class="relation-item">
          <div>
            <span class="master">${escapeHtml(rel.master)}</span>
            <span class="arrow">→</span>
            <span class="detail">${escapeHtml(rel.detail)}</span>
            <span class="key">(ключ: ${escapeHtml(rel.key)})</span>
            ${isActive ? `<span class="active">● активен</span>` : ''}
          </div>
          <div style="font-size:10px;color:#4a5a7a;margin-top:2px;">
            ${isActive ? `Мастер: ${escapeHtml(masterName)} • Деталей: ${detailsCount}` : 'Не выбран мастер'}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга связей:', error);
  }
}

// ============================================================
// 6. РЕНДЕРИНГ ПОДПИСОК
// ============================================================

export function renderSubscriptions() {
  try {
    const container = DOM.subscriptionsList;
    if (!container) return;

    let subs = [];
    try {
      if (db.broker && isFunction(db.broker.getSubscribers)) {
        subs = db.broker.getSubscribers('*');
      } else if (isFunction(db.getSubscribers)) {
        subs = db.getSubscribers('*');
      }
    } catch (e) {
      subs = [];
    }

    if (!subs || subs.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет подписок</div>`;
      return;
    }

    let html = '';
    for (const sub of subs) {
      const topic = sub.topic || sub.pattern || '*';
      const id = sub.id || sub.subscriptionId || sub.subId || 'unknown';
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #161e2a;font-size:11px;">
          <span>
            <span style="color:#60a5fa;">${escapeHtml(topic)}</span>
            <span style="color:#4a5a7a;font-size:10px;">ID: ${escapeHtml(String(id))}</span>
          </span>
          <button class="btn btn-danger btn-xs unsubscribe-btn" data-id="${escapeHtml(String(id))}">✕</button>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.unsubscribe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (db.broker && isFunction(db.broker.unsubscribe)) {
          try {
            db.broker.unsubscribe(id);
          } catch (e) {}
        } else if (isFunction(db.unsubscribe)) {
          try {
            db.unsubscribe(id);
          } catch (e) {}
        }
        renderSubscriptions();
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга подписок:', error);
  }
}

// ============================================================
// 7. РЕНДЕРИНГ СООБЩЕНИЙ
// ============================================================

export function renderMessages() {
  try {
    const container = DOM.messagesContainer;
    if (!container) return;

    let messages = [];
    try {
      if (db.broker && isFunction(db.broker.getMessages)) {
        messages = db.broker.getMessages(null, 50);
      } else if (isFunction(db.getMessages)) {
        messages = db.getMessages(null, 50);
      }
    } catch (e) {
      messages = [];
    }

    if (!messages || messages.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет сообщений</div>`;
      if (DOM.messagesCount) DOM.messagesCount.textContent = '0';
      return;
    }

    let html = '';
    const recentMessages = messages.slice(-50);
    for (const msg of recentMessages) {
      const topic = msg.topic || msg.pattern || 'unknown';
      const data = msg.data || msg.payload || {};
      const timestamp = msg.timestamp || msg.createdAt || Date.now();

      html += `
        <div style="padding:4px 8px;border-bottom:1px solid #161e2a;font-size:11px;font-family:monospace;">
          <span style="color:#4a5a7a;">[${formatTime(timestamp)}]</span>
          <span style="color:#60a5fa;">${escapeHtml(topic)}</span>
          <span style="color:#8b96b0;">→</span>
          <span style="color:#34d399;">${escapeHtml(formatJson(data).substring(0, 100))}</span>
        </div>
      `;
    }

    container.innerHTML = html;
    if (DOM.messagesCount) DOM.messagesCount.textContent = recentMessages.length;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга сообщений:', error);
  }
}

// ============================================================
// 8. РЕНДЕРИНГ АУДИТА
// ============================================================

export function renderAudit() {
  try {
    const container = DOM.auditContainer;
    if (!container) return;

    let audit = [];
    try {
      if (db.audit && isFunction(db.audit.getAudit)) {
        audit = db.audit.getAudit({}, 100);
      } else if (isFunction(db.getAudit)) {
        audit = db.getAudit({}, 100);
      }
    } catch (e) {
      audit = [];
    }

    if (!audit || audit.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет записей аудита</div>`;
      return;
    }

    let html = '';
    for (const entry of audit) {
      const action = entry.action || entry.type || 'unknown';
      const data = entry.data || entry.payload || {};
      const userId = entry.userId || entry.user || 'anonymous';
      const timestamp = entry.timestamp || entry.createdAt || Date.now();

      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #161e2a;font-size:11px;font-family:monospace;">
          <span>
            <span style="color:#4a5a7a;">[${formatTime(timestamp)}]</span>
            <span style="color:#a78bfa;">${escapeHtml(action)}</span>
            <span style="color:#8b96b0;">${escapeHtml(formatJson(data).substring(0, 50))}</span>
          </span>
          <span style="color:#4a5a7a;font-size:10px;">${escapeHtml(userId)}</span>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга аудита:', error);
  }
}

// ============================================================
// 9. РЕНДЕРИНГ СХЕМ
// ============================================================

export function renderSchemas() {
  try {
    const container = DOM.schemasContainer;
    if (!container) return;

    const tables = isFunction(db.listTables) ? db.listTables() : [];
    const hasSchemas = tables.some(t => (isFunction(db.getSchema) ? db.getSchema(t) : false));

    if (!hasSchemas) {
      container.innerHTML = `<div class="empty-state">Нет схем</div>`;
      return;
    }

    let html = '';
    for (const name of tables) {
      const schema = isFunction(db.getSchema) ? db.getSchema(name) : null;
      if (!schema) continue;

      html += `
        <div style="background:#0b0e14;border-radius:6px;border:1px solid #1e2633;padding:10px 12px;margin-bottom:6px;">
          <div style="font-size:13px;font-weight:500;color:#c8d0e0;margin-bottom:6px;">
            📐 ${escapeHtml(name)}
          </div>
          <div style="font-family:monospace;font-size:11px;color:#8b96b0;white-space:pre-wrap;word-break:break-all;">
            ${escapeHtml(formatJson(schema))}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга схем:', error);
  }
}

// ============================================================
// 10. РЕНДЕРИНГ ПЛАГИНОВ
// ============================================================

export function renderPlugins() {
  try {
    const container = DOM.pluginsContainer;
    if (!container) return;

    const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];

    if (plugins.length === 0) {
      container.innerHTML = `<div class="empty-state">Нет плагинов</div>`;
      return;
    }

    let html = '';
    for (const name of plugins) {
      const plugin = isFunction(db.getPlugin) ? db.getPlugin(name) : null;
      const isActive = plugin && plugin._isActive !== false;
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0b0e14;border-radius:6px;border:1px solid #1e2633;margin-bottom:4px;">
          <span>
            <span style="color:#60a5fa;">🔌 ${escapeHtml(name)}</span>
            <span style="color:#4a5a7a;font-size:10px;margin-left:8px;">
              ${isActive ? '✅ активен' : '❌ неактивен'}
            </span>
          </span>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга плагинов:', error);
  }
}

// ============================================================
// 11. РЕНДЕРИНГ НАСТРОЕК
// ============================================================

export function renderSettings() {
  try {
    const quotas = isFunction(db.getQuotas) ? db.getQuotas() : {};
    const state = isFunction(db.getState) ? db.getState() : {};

    if (DOM.quotasDisplay) {
      DOM.quotasDisplay.innerHTML = `
        <div style="font-size:12px;color:#8b96b0;line-height:2;">
          <div>📊 Максимум записей: <span style="color:#c8d0e0;">${quotas.maxRecords || 10000}</span></div>
          <div>📋 Максимум таблиц: <span style="color:#c8d0e0;">${quotas.maxTables || 50}</span></div>
          <div>💾 Версия: <span style="color:#c8d0e0;">${state.version || '4.0.8'}</span></div>
          <div>📦 Плагинов: <span style="color:#c8d0e0;">${state.plugins ? state.plugins.length : 0}</span></div>
        </div>
      `;
    }

    if (DOM.infoDisplay) {
      DOM.infoDisplay.innerHTML = `
        <div style="font-size:12px;color:#8b96b0;line-height:2;">
          <div>🏢 Store: <span style="color:#c8d0e0;">Global Store</span></div>
          <div>📊 Таблиц: <span style="color:#c8d0e0;">${state.tables ? state.tables.length : 0}</span></div>
          <div>📝 Записей: <span style="color:#c8d0e0;">${isFunction(db.healthCheck) ? db.healthCheck().records || 0 : 0}</span></div>
          <div>🔗 Связей: <span style="color:#c8d0e0;">${state.relations ? state.relations.length : 0}</span></div>
          <div>📡 Подписчиков: <span style="color:#c8d0e0;">${isFunction(db.healthCheck) ? db.healthCheck().listeners || 0 : 0}</span></div>
          <div>🔑 Символ: <span style="color:#34d399;">__GLOBAL_STORE__</span></div>
          <div>🔄 Immer: <span style="color:#34d399;">${window._appConfig?.immerEnabled ? '✅ Включен' : '❌ Выключен'}</span></div>
        </div>
      `;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга настроек:', error);
  }
}

// ============================================================
// 12. РЕНДЕРИНГ ЛОГОВ
// ============================================================

export function renderLog() {
  const container = DOM.logContainer;
  const state = getAppState();

  if (!container) {
    console.warn('⚠️ logContainer не найден в DOM');
    return;
  }

  const entries = state[PRIVATE.LOG_ENTRIES];

  if (entries.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет событий</div>`;
    return;
  }

  let html = '';
  for (const entry of entries) {
    const detailHtml = entry.detail
        ? `<span class="detail">${escapeHtml(JSON.stringify(entry.detail).substring(0, 80))}</span>`
        : '';
    html += `
      <div class="log-entry">
        <span class="time">[${entry.timestamp}]</span>
        <span class="type ${entry.type}">${entry.type.toUpperCase()}</span>
        <span class="message">${escapeHtml(entry.message)}</span>
        ${detailHtml}
      </div>
    `;
  }

  container.innerHTML = html;
  container.scrollTop = 0;
}

// ============================================================
// 13. РЕНДЕРИНГ СИМВОЛОВ (НОВЫЙ)
// ============================================================

export function renderSymbols() {
  const container = DOM.symbolsContainer;
  if (!container) return;

  // Получаем все символы из глобального объекта
  const symbols = {
    private: Object.keys(PRIVATE),
    public: Object.keys(PUBLIC),
    internal: INTERNAL ? Object.keys(INTERNAL) : [],
  };

  const total = symbols.private.length + symbols.public.length + symbols.internal.length;

  let html = `
    <div style="display:flex;flex-direction:column;gap:12px;padding:8px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-primary);">
          <div style="font-size:11px;color:var(--es-text-dim);">🔒 Приватные</div>
          <div style="font-size:24px;font-weight:700;color:var(--es-accent-red);">${symbols.private.length}</div>
        </div>
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-primary);">
          <div style="font-size:11px;color:var(--es-text-dim);">🔓 Публичные</div>
          <div style="font-size:24px;font-weight:700;color:var(--es-accent-green);">${symbols.public.length}</div>
        </div>
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-primary);">
          <div style="font-size:11px;color:var(--es-text-dim);">📦 Всего</div>
          <div style="font-size:24px;font-weight:700;color:var(--es-accent-blue-light);">${total}</div>
        </div>
      </div>
      
      <div style="font-size:11px;color:var(--es-text-muted);">Приватные символы (${symbols.private.length}):</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;padding:4px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);">
        ${symbols.private.map(s => `<span style="font-size:10px;color:var(--es-accent-red);background:rgba(239,68,68,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(239,68,68,0.2);">${s}</span>`).join('')}
      </div>
      
      <div style="font-size:11px;color:var(--es-text-muted);">Публичные символы (${symbols.public.length}):</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;padding:4px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);">
        ${symbols.public.map(s => `<span style="font-size:10px;color:var(--es-accent-green);background:rgba(52,211,153,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(52,211,153,0.2);">${s}</span>`).join('')}
      </div>
      
      ${
      symbols.internal.length > 0
          ? `
        <div style="font-size:11px;color:var(--es-text-muted);">Внутренние символы (${symbols.internal.length}):</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;padding:4px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);">
          ${symbols.internal.map(s => `<span style="font-size:10px;color:var(--es-accent-yellow);background:rgba(251,191,36,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(251,191,36,0.2);">${s}</span>`).join('')}
        </div>
      `
          : ''
  }
    </div>
  `;

  container.innerHTML = html;

  if (DOM.symbolsTotalBadge) {
    DOM.symbolsTotalBadge.textContent = `${total} символов`;
  }
}

// ============================================================
// 14. ГЛАВНЫЙ РЕНДЕРЕР
// ============================================================

export function renderAll() {
  renderStats();
  renderTables();
  renderData();
  renderInspector();
  renderRelations();
  renderSubscriptions();
  renderMessages();
  renderAudit();
  renderSchemas();
  renderPlugins();
  renderSettings();
  renderLog();

  // ★★★ ОБНОВЛЯЕМ ВСЕ ТАБЫ ★★★
  // Принудительно обновляем активный таб
  const state = getAppState();
  const activeTab = state[PRIVATE.ACTIVE_TAB] || 'data';
  switchTab(activeTab);
}

// ============================================================
// 15. УПРАВЛЕНИЕ ТАБАМИ (ИСПРАВЛЕНО) ★★★
// ============================================================

export function switchTab(tabName) {
  const state = getAppState();
  state[PRIVATE.ACTIVE_TAB] = tabName;

  // Находим все табы и контент
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  // Скрываем все табы и контент
  tabs.forEach(t => {
    t.classList.remove('active', 'tab-active');
  });

  contents.forEach(c => {
    c.classList.remove('active', 'tab-content-active');
    // ★★★ СКРЫВАЕМ ВСЕ ТАБЫ ★★★
    c.style.display = 'none';
    c.style.visibility = 'hidden';
    c.style.opacity = '0';
  });

  // Показываем выбранный таб
  const tabBtn = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (tabBtn) {
    tabBtn.classList.add('active', 'tab-active');
  }

  const tabContent = document.getElementById(`tab-${tabName}`);
  if (tabContent) {
    tabContent.classList.add('active', 'tab-content-active');
    // ★★★ ПОКАЗЫВАЕМ ТОЛЬКО ВЫБРАННЫЙ ТАБ ★★★
    tabContent.style.display = 'block';
    tabContent.style.visibility = 'visible';
    tabContent.style.opacity = '1';
  }

  // ★★★ ОБНОВЛЯЕМ КОНТЕНТ ПРИ ПЕРЕКЛЮЧЕНИИ ★★★
  switch (tabName) {
    case 'data':
      renderData();
      renderInspector();
      break;
    case 'relations':
      renderRelations();
      break;
    case 'broker':
      renderSubscriptions();
      renderMessages();
      break;
    case 'audit':
      renderAudit();
      break;
    case 'schema':
      renderSchemas();
      break;
    case 'console':
      // Консоль уже готова
      break;
    case 'plugins':
      renderPlugins();
      break;
    case 'settings':
      renderSettings();
      break;
    case 'symbols':
      renderSymbols();
      break;
    case 'logs':
      renderLog();
      break;
    default:
      break;
  }

  addLog(`🔄 Переключен таб: ${tabName}`, 'info');
}

// ============================================================
// 16. ЭКСПОРТЫ
// ============================================================

export default {
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
  renderSymbols,
  renderAll,
  switchTab,
};

// ============================================================
// 17. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;
  const internalCount = INTERNAL ? Object.keys(INTERNAL).length : 0;

  console.log('📊 RENDER MODULE SYMBOLS STATS:');
  console.log(`  🔑 Приватных символов: ${privateCount}`);
  console.log(`  🔓 Публичных символов: ${publicCount}`);
  console.log(`  🔐 Внутренних символов: ${internalCount}`);
  console.log(`  📦 Всего символов: ${privateCount + publicCount + internalCount}`);
  console.log(`  📋 Рендереров: 13`);
  console.log(`  🏷️  Табов: 9`);
}

// ============================================================
// 18. КОНЕЦ ФАЙЛА
// ============================================================
