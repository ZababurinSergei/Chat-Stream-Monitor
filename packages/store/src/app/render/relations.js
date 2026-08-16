// ============================================================
// render/relations.js — 100% СИМВОЛЫ — рендеринг связей
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getSelectedTable, getSelectedRow } from '../state.js';
import { isFunction, formatJson, escapeHtml, safeStringify } from '../utils.js';
import { showModal, showAlertInModal } from '../modal.js';
import { renderAll } from './index.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

const RELATION_ICONS = {
  master: '📊',
  detail: '📋',
  active: '✅',
  inactive: '⏸️',
  linked: '🔗',
  unlinked: '🔓',
};

const RELATION_COLORS = {
  master: 'var(--es-accent-blue-light)',
  detail: 'var(--es-accent-purple)',
  active: 'var(--es-accent-green)',
  inactive: 'var(--es-text-dim)',
  warning: 'var(--es-accent-yellow)',
  error: 'var(--es-accent-red)',
};

// ============================================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Безопасное получение связей из хранилища
 */
function getRelations() {
  try {
    // 1. Через приватный доступ
    if (db._getRelations && isFunction(db._getRelations)) {
      return db._getRelations();
    }

    // 2. Через _private
    if (db._private) {
      const p = db._private.get(db);
      if (p) {
        const relations = p[Symbol('store.relations')];
        if (relations) return relations;
      }
    }

    // 3. Через _store
    if (db._store && db._store._getRelations) {
      return db._store._getRelations();
    }

    // 4. Через свойства
    if (db.relations) {
      return db.relations;
    }

    return new Map();
  } catch (error) {
    console.warn('⚠️ Ошибка получения связей:', error);
    return new Map();
  }
}

/**
 * Получение данных мастер-таблицы
 */
function getMasterData(tableName, masterId) {
  try {
    const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
    if (!table) return null;
    return table.data.find(r => r.id === masterId) || null;
  } catch {
    return null;
  }
}

/**
 * Получение данных детейл-таблицы
 */
function getDetailData(tableName, masterId, key) {
  try {
    const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
    if (!table) return [];
    return table.data.filter(r => r[key] === masterId);
  } catch {
    return [];
  }
}

/**
 * Форматирование ключа связи для отображения
 */
function formatRelationKey(key) {
  if (!key) return '—';
  return key.length > 20 ? key.substring(0, 18) + '…' : key;
}

/**
 * Получение статуса связи
 */
function getRelationStatus(rel) {
  if (!rel) return 'inactive';
  if (rel.masterId && rel.details && rel.details.length > 0) return 'active';
  if (rel.masterId) return 'pending';
  return 'inactive';
}

// ============================================================
// 4. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

export function renderRelations() {
  try {
    const container = DOM.relationsContainer;
    if (!container) {
      console.warn('⚠️ relationsContainer не найден в DOM');
      return;
    }

    const relations = getRelations();
    const entries =
      relations instanceof Map ? Array.from(relations.entries()) : Object.entries(relations);

    // ============================================================
    // 5. ПРОВЕРКА НАЛИЧИЯ СВЯЗЕЙ
    // ============================================================

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔗</span>
          Нет связей
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">
            Создайте связь между таблицами через кнопку «➕ Связать»
          </div>
        </div>
      `;
      return;
    }

    // ============================================================
    // 6. ПОСТРОЕНИЕ HTML
    // ============================================================

    let html = `
      <div style="display:flex;flex-direction:column;gap:4px;padding:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding:0 4px;">
          <span style="font-size:11px;color:var(--es-text-muted);">
            ${entries.length} ${entries.length === 1 ? 'связь' : entries.length < 5 ? 'связи' : 'связей'}
          </span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-xs" id="refreshRelationsBtn" title="Обновить связи">
              🔄
            </button>
            <button class="btn btn-secondary btn-xs" id="exportRelationsBtn" title="Экспортировать связи">
              📤
            </button>
          </div>
        </div>
    `;

    let activeCount = 0;
    let totalDetails = 0;

    // ============================================================
    // 7. РЕНДЕРИНГ КАЖДОЙ СВЯЗИ
    // ============================================================

    for (const [key, rel] of entries) {
      const status = getRelationStatus(rel);
      const isActive = status === 'active';
      const isPending = status === 'pending';

      // Получаем данные
      const masterData = rel.masterData || getMasterData(rel.master, rel.masterId);
      const details =
        rel.details || (rel.masterId ? getDetailData(rel.detail, rel.masterId, rel.key) : []);

      const detailCount = details.length;
      totalDetails += detailCount;
      if (isActive) activeCount++;

      // Формируем отображение
      const masterName =
        masterData?.name || masterData?.title || masterData?.id || rel.masterId || '—';
      const masterDisplay = masterData ? `${masterName}` : `${rel.masterId || '—'}`;

      // Статусные бейджи
      const statusBadge = isActive
        ? `<span style="color:${RELATION_COLORS.active};font-size:10px;">● Активна</span>`
        : isPending
          ? `<span style="color:${RELATION_COLORS.warning};font-size:10px;">● Ожидает</span>`
          : `<span style="color:${RELATION_COLORS.inactive};font-size:10px;">○ Неактивна</span>`;

      // Блок с деталями
      let detailsHtml = '';
      if (detailCount > 0) {
        const displayDetails = details.slice(0, 5);
        detailsHtml = `
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">
            ${displayDetails
              .map(
                d => `
              <span style="
                background:var(--es-bg-tertiary);
                padding:1px 6px;
                border-radius:3px;
                font-size:10px;
                color:var(--es-text-muted);
                font-family:monospace;
                border:1px solid var(--es-border-secondary);
                cursor:pointer;
              " title="ID: ${escapeHtml(d.id)}">
                ${escapeHtml(d.id)}
                ${d.name ? ` (${escapeHtml(String(d.name).substring(0, 10))})` : ''}
              </span>
            `
              )
              .join('')}
            ${
              detailCount > 5
                ? `
              <span style="
                background:var(--es-bg-tertiary);
                padding:1px 6px;
                border-radius:3px;
                font-size:10px;
                color:var(--es-text-dim);
              ">
                +${detailCount - 5} еще
              </span>
            `
                : ''
            }
          </div>
        `;
      }

      // Действия для связи
      const actionsHtml = `
        <div style="display:flex;gap:3px;">
          ${
            isActive
              ? `
            <button class="btn btn-secondary btn-xs relation-select-master" 
                    data-master="${escapeHtml(rel.master)}" 
                    data-id="${escapeHtml(rel.masterId)}"
                    title="Выбрать мастера">
              🎯
            </button>
          `
              : ''
          }
          <button class="btn btn-secondary btn-xs relation-view-details" 
                  data-master="${escapeHtml(rel.master)}" 
                  data-detail="${escapeHtml(rel.detail)}"
                  data-key="${escapeHtml(rel.key)}"
                  title="Просмотреть детали">
            👁️
          </button>
          <button class="btn btn-danger btn-xs relation-unlink" 
                  data-master="${escapeHtml(rel.master)}" 
                  data-detail="${escapeHtml(rel.detail)}"
                  title="Удалить связь">
            ✕
          </button>
        </div>
      `;

      // ============================================================
      // 8. КАРТОЧКА СВЯЗИ
      // ============================================================

      html += `
        <div class="relation-item" 
             style="
               border-left: 3px solid ${isActive ? RELATION_COLORS.active : RELATION_COLORS.inactive};
               ${isActive ? 'background:var(--es-bg-hover);' : ''}
             "
             data-relation-key="${escapeHtml(key)}">
          
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px;">
            <!-- Левая часть: имена таблиц -->
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
              <span class="master" style="color:${RELATION_COLORS.master};font-weight:500;">
                ${RELATION_ICONS.master} ${escapeHtml(rel.master)}
              </span>
              
              <span style="color:var(--es-text-dim);font-size:14px;">→</span>
              
              <span class="detail" style="color:${RELATION_COLORS.detail};font-weight:500;">
                ${RELATION_ICONS.detail} ${escapeHtml(rel.detail)}
              </span>
              
              <span class="key" style="
                font-size:10px;
                color:var(--es-text-dim);
                background:var(--es-bg-tertiary);
                padding:0 6px;
                border-radius:3px;
                font-family:monospace;
              ">
                🔑 ${formatRelationKey(rel.key)}
              </span>
              
              ${statusBadge}
            </div>
            
            <!-- Правая часть: действия -->
            ${actionsHtml}
          </div>
          
          <!-- Информация о мастере -->
          <div style="
            display:flex;
            align-items:center;
            gap:8px;
            font-size:10px;
            color:var(--es-text-dim);
            margin-top:4px;
          ">
            ${
              isActive
                ? `
              <span>🎯 Мастер: <strong style="color:var(--es-text-secondary);">${escapeHtml(masterDisplay)}</strong></span>
              <span>📋 Деталей: <strong style="color:var(--es-text-secondary);">${detailCount}</strong></span>
            `
                : `
              <span style="color:var(--es-text-dim);">${RELATION_ICONS.inactive} Мастер не выбран</span>
              <button class="btn btn-primary btn-xs relation-select-master" 
                      data-master="${escapeHtml(rel.master)}" 
                      title="Выбрать мастера">
                🎯 Выбрать мастера
              </button>
            `
            }
          </div>
          
          <!-- Детали -->
          ${detailsHtml}
          
          <!-- Время создания -->
          <div style="
            font-size:9px;
            color:var(--es-text-dim);
            margin-top:2px;
            opacity:0.5;
          ">
            ${rel.createdAt ? `Создана: ${new Date(rel.createdAt).toLocaleString()}` : ''}
          </div>
        </div>
      `;
    }

    // ============================================================
    // 9. ИТОГОВАЯ СТАТИСТИКА
    // ============================================================

    html += `
        <div style="
          display:flex;
          justify-content:space-between;
          font-size:10px;
          color:var(--es-text-dim);
          padding:6px 4px;
          border-top:1px solid var(--es-border-secondary);
          margin-top:4px;
        ">
          <span>📊 Активных: <strong style="color:var(--es-accent-green);">${activeCount}</strong></span>
          <span>📋 Деталей: <strong style="color:var(--es-accent-blue-light);">${totalDetails}</strong></span>
          <span>🔗 Всего связей: <strong style="color:var(--es-text-secondary);">${entries.length}</strong></span>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // ============================================================
    // 10. ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    // Обновление связей
    const refreshBtn = container.querySelector('#refreshRelationsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        renderRelations();
        addLog('🔄 Связи обновлены', 'info');
      });
    }

    // Экспорт связей
    const exportBtn = container.querySelector('#exportRelationsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportRelations);
    }

    // Выбор мастера
    container.querySelectorAll('.relation-select-master').forEach(btn => {
      btn.addEventListener('click', () => {
        const master = btn.dataset.master;
        const id = btn.dataset.id;
        if (id) {
          // Если ID передан, выбираем конкретного мастера
          if (isFunction(db.selectMaster)) {
            db.selectMaster(master, id);
            renderAll();
            addLog(`🎯 Выбран мастер: ${master}[${id}]`, 'success');
          }
        } else {
          // Показываем модалку для выбора мастера
          showSelectMasterModal(master);
        }
      });
    });

    // Просмотр деталей
    container.querySelectorAll('.relation-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const master = btn.dataset.master;
        const detail = btn.dataset.detail;
        const key = btn.dataset.key;
        showRelationDetails(master, detail, key);
      });
    });

    // Удаление связи
    container.querySelectorAll('.relation-unlink').forEach(btn => {
      btn.addEventListener('click', () => {
        const master = btn.dataset.master;
        const detail = btn.dataset.detail;
        showUnlinkConfirm(master, detail);
      });
    });

    // Клик по детали для просмотра
    container.querySelectorAll('.relation-item .detail-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const table = el.dataset.table;
        if (id && table && isFunction(db.selectRow)) {
          db.selectRow(table, id);
          renderAll();
        }
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга связей:', error);
    const container = DOM.relationsContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки связей
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 11. ДОПОЛНИТЕЛЬНЫЕ МОДАЛЬНЫЕ ОКНА
// ============================================================

/**
 * Модальное окно для выбора мастера
 */
function showSelectMasterModal(masterTable) {
  try {
    const table = isFunction(db.getTable) ? db.getTable(masterTable) : null;
    if (!table || table.data.length === 0) {
      showAlertInModal(
        '⚠️ Нет данных',
        `Таблица "${masterTable}" не содержит записей для выбора мастера.`,
        'warning'
      );
      return;
    }

    let optionsHtml = '';
    for (const row of table.data) {
      const label = row.name || row.title || row.id || '—';
      optionsHtml += `
        <option value="${escapeHtml(row.id)}">
          ${escapeHtml(label)} (${escapeHtml(row.id)})
        </option>
      `;
    }

    const formHtml = `
      <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
        🎯 Выберите мастер-запись для таблицы <strong>${escapeHtml(masterTable)}</strong>
      </div>
      <div class="form-group">
        <label>Мастер-запись</label>
        <select id="selectedMaster">${optionsHtml}</select>
      </div>
    `;

    showModal(
      `🎯 Выбрать мастера для ${masterTable}`,
      formHtml,
      data => {
        const id = data.selectedMaster;
        if (id && isFunction(db.selectMaster)) {
          db.selectMaster(masterTable, id);
          renderAll();
          addLog(`🎯 Выбран мастер: ${masterTable}[${id}]`, 'success');
        }
      },
      () => {
        addLog('ℹ️ Выбор мастера отменен', 'info');
      }
    );
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось выбрать мастера: ${error.message}`, 'error');
  }
}

/**
 * Модальное окно для просмотра деталей связи
 */
function showRelationDetails(master, detail, key) {
  try {
    const masterTable = isFunction(db.getTable) ? db.getTable(master) : null;
    const detailTable = isFunction(db.getTable) ? db.getTable(detail) : null;

    if (!masterTable || !detailTable) {
      showAlertInModal('⚠️ Ошибка', 'Таблицы не найдены.', 'warning');
      return;
    }

    // Получаем активную связь
    const relations = getRelations();
    let rel = null;
    const relKey = `${master}:${detail}`;
    if (relations instanceof Map) {
      rel = relations.get(relKey);
    } else {
      rel = relations[relKey];
    }

    const masterData = rel?.masterData || null;
    const details = rel?.details || [];

    let html = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <div>
            <span style="color:${RELATION_COLORS.master};font-weight:500;">📊 ${escapeHtml(master)}</span>
            <span style="color:var(--es-text-dim);">→</span>
            <span style="color:${RELATION_COLORS.detail};font-weight:500;">📋 ${escapeHtml(detail)}</span>
          </div>
          <span style="font-size:11px;color:var(--es-text-dim);">Ключ: <code style="background:var(--es-bg-tertiary);padding:1px 6px;border-radius:3px;">${escapeHtml(key)}</code></span>
        </div>
    `;

    // Информация о мастере
    if (masterData) {
      html += `
        <div style="background:var(--es-bg-tertiary);border-radius:4px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);margin-bottom:4px;">🎯 Мастер:</div>
          <pre style="margin:0;font-size:11px;color:var(--es-text-secondary);font-family:monospace;white-space:pre-wrap;word-break:break-all;">${escapeHtml(formatJson(masterData))}</pre>
        </div>
      `;
    } else {
      html += `
        <div style="background:var(--es-bg-tertiary);border-radius:4px;padding:8px;border:1px solid var(--es-border-secondary);color:var(--es-text-dim);">
          ⏸️ Мастер не выбран
        </div>
      `;
    }

    // Информация о деталях
    if (details.length > 0) {
      html += `
        <div style="background:var(--es-bg-tertiary);border-radius:4px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);margin-bottom:4px;">
            📋 Детали (${details.length} записей):
          </div>
          <div style="max-height:200px;overflow-y:auto;">
            ${details
              .slice(0, 20)
              .map(
                d => `
              <div style="padding:2px 4px;border-bottom:1px solid var(--es-border-secondary);font-size:11px;font-family:monospace;color:var(--es-text-muted);">
                ${escapeHtml(formatJson(d))}
              </div>
            `
              )
              .join('')}
            ${details.length > 20 ? `<div style="padding:4px;color:var(--es-text-dim);font-size:10px;">... и еще ${details.length - 20} записей</div>` : ''}
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="background:var(--es-bg-tertiary);border-radius:4px;padding:8px;border:1px solid var(--es-border-secondary);color:var(--es-text-dim);">
          📭 Нет связанных деталей
        </div>
      `;
    }

    html += `</div>`;

    showModal(
      `🔗 Детали связи: ${master} → ${detail}`,
      html,
      () => {},
      () => {}
    );
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось показать детали: ${error.message}`, 'error');
  }
}

/**
 * Подтверждение удаления связи
 */
function showUnlinkConfirm(master, detail) {
  showModal(
    `🗑 Удалить связь?`,
    `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="color:var(--es-text-muted);">
          Вы уверены, что хотите удалить связь между таблицами:
        </div>
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          padding:8px;
          background:var(--es-bg-tertiary);
          border-radius:4px;
          border:1px solid var(--es-border-secondary);
        ">
          <span style="color:${RELATION_COLORS.master};font-weight:500;">📊 ${escapeHtml(master)}</span>
          <span style="color:var(--es-text-dim);">→</span>
          <span style="color:${RELATION_COLORS.detail};font-weight:500;">📋 ${escapeHtml(detail)}</span>
        </div>
        <div style="color:var(--es-accent-red);font-size:12px;">
          ⚠️ Это действие необратимо. Все связанные данные будут разорваны.
        </div>
      </div>
    `,
    () => {
      if (isFunction(db.unlinkTables)) {
        db.unlinkTables(master, detail);
      } else if (isFunction(db.unlink)) {
        db.unlink(master, detail);
      }
      renderAll();
      addLog(`🗑 Связь удалена: ${master} → ${detail}`, 'warn');
    },
    () => {
      addLog(`ℹ️ Удаление связи отменено: ${master} → ${detail}`, 'info');
    }
  );
}

// ============================================================
// 12. ЭКСПОРТ СВЯЗЕЙ
// ============================================================

export function exportRelations() {
  try {
    const relations = getRelations();
    const entries =
      relations instanceof Map ? Array.from(relations.entries()) : Object.entries(relations);

    if (entries.length === 0) {
      showAlertInModal('ℹ️ Информация', 'Нет связей для экспорта.', 'info');
      return;
    }

    const data = {
      exportedAt: Date.now(),
      version: '4.0.8',
      totalRelations: entries.length,
      relations: entries.map(([key, rel]) => ({
        key,
        master: rel.master,
        detail: rel.detail,
        keyField: rel.key,
        masterId: rel.masterId || null,
        masterData: rel.masterData || null,
        detailsCount: rel.details ? rel.details.length : 0,
        details: rel.details || [],
        createdAt: rel.createdAt || null,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relations_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog(`📤 Связи экспортированы (${entries.length} связей)`, 'success');
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать связи: ${error.message}`, 'error');
  }
}

// ============================================================
// 13. ИМПОРТ СВЯЗЕЙ
// ============================================================

export function importRelations(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    if (!data.relations || !Array.isArray(data.relations)) {
      throw new Error('Некорректный формат данных');
    }

    let imported = 0;
    for (const rel of data.relations) {
      if (rel.master && rel.detail) {
        const key = rel.keyField || 'masterId';
        if (isFunction(db.link)) {
          db.link(rel.master, rel.detail, key);
          imported++;
        }
      }
    }

    renderAll();
    addLog(`📥 Импортировано ${imported} связей`, 'success');
    return imported;
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось импортировать связи: ${error.message}`, 'error');
    return 0;
  }
}

// ============================================================
// 14. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Обновление связей с дебаунсом
 */
let relationsTimeout = null;

export function renderRelationsDebounced(delay = 300) {
  if (relationsTimeout) {
    clearTimeout(relationsTimeout);
  }
  relationsTimeout = setTimeout(() => {
    renderRelations();
    relationsTimeout = null;
  }, delay);
}

/**
 * Получение статистики по связям
 */
export function getRelationsStats() {
  try {
    const relations = getRelations();
    const entries =
      relations instanceof Map ? Array.from(relations.entries()) : Object.entries(relations);

    let active = 0;
    let pending = 0;
    let totalDetails = 0;
    const tables = new Set();

    for (const [, rel] of entries) {
      tables.add(rel.master);
      tables.add(rel.detail);
      const status = getRelationStatus(rel);
      if (status === 'active') active++;
      if (status === 'pending') pending++;
      totalDetails += rel.details ? rel.details.length : 0;
    }

    return {
      total: entries.length,
      active,
      pending,
      inactive: entries.length - active - pending,
      totalDetails,
      tables: tables.size,
      tablesList: Array.from(tables),
    };
  } catch {
    return {
      total: 0,
      active: 0,
      pending: 0,
      inactive: 0,
      totalDetails: 0,
      tables: 0,
      tablesList: [],
    };
  }
}

// ============================================================
// 15. ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Добавляем функции в глобальный объект
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};
  window.app.renderRelations = renderRelations;
  window.app.exportRelations = exportRelations;
  window.app.importRelations = importRelations;
  window.app.getRelationsStats = getRelationsStats;
  window.app.renderRelationsDebounced = renderRelationsDebounced;

  // Горячие клавиши
  document.addEventListener('keydown', e => {
    // Ctrl+R — обновить связи
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      renderRelations();
      addLog('🔄 Связи обновлены (горячая клавиша)', 'info');
    }
  });
}

// ============================================================
// 16. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderRelations,
  exportRelations,
  importRelations,
  getRelationsStats,
  renderRelationsDebounced,
  showRelationDetails,
  showSelectMasterModal,
};
