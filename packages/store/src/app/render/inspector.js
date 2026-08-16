// ============================================================
// render/inspector.js — 100% СИМВОЛЫ — рендеринг инспектора
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getSelectedTable, getSelectedRow } from '../state.js';
import { isFunction, formatJson, escapeHtml } from '../utils.js';
import { renderData } from './data.js';

// ============================================================
// 2. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг инспектора — отображение выбранной строки
 * 100% символы — полная изоляция
 */
export function renderInspector() {
  try {
    const container = DOM.inspectorContent;
    const selectedTable = getSelectedTable();
    const selectedRow = getSelectedRow();

    if (!container) {
      console.warn('⚠️ inspectorContent не найден в DOM');
      return;
    }

    // Проверка: выбрана ли строка
    if (!selectedRow || !selectedTable) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔍</span>
          Выберите строку для просмотра
        </div>
      `;
      return;
    }

    // Получение таблицы
    const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
    if (!table) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">❌</span>
          Таблица не найдена
        </div>
      `;
      return;
    }

    // Поиск строки по ID
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

    // ============================================================
    // 3. ПОСТРОЕНИЕ HTML
    // ============================================================

    // Информация о строке
    const rowInfo = `
      <div style="font-size:11px;color:#4a5a7a;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:12px;">
        <span>🆔 ${escapeHtml(row.id)}</span>
        <span>📊 ${escapeHtml(selectedTable)}</span>
        <span>📅 ${new Date(row._created || Date.now()).toLocaleString()}</span>
        ${row._updated ? `<span>🔄 ${new Date(row._updated).toLocaleString()}</span>` : ''}
      </div>
    `;

    // Основные данные строки
    const rowData = { ...row };
    // Убираем служебные поля для чистоты отображения
    delete rowData._created;
    delete rowData._updated;

    const dataHtml = `
      <div style="background:#0b0e14;border-radius:6px;border:1px solid #1e2633;padding:8px;font-family:monospace;font-size:11px;overflow-x:auto;">
        <pre style="color:#8b96b0;margin:0;white-space:pre-wrap;word-break:break-all;">${escapeHtml(formatJson(rowData))}</pre>
      </div>
    `;

    // ============================================================
    // 4. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ
    // ============================================================

    // Статистика полей
    const fieldCount = Object.keys(rowData).length;
    const fieldStats = `
      <div style="display:flex;gap:12px;font-size:10px;color:#4a5a7a;margin-top:6px;flex-wrap:wrap;">
        <span>📋 Полей: ${fieldCount}</span>
        <span>📏 Размер: ${(JSON.stringify(rowData).length / 1024).toFixed(2)} KB</span>
      </div>
    `;

    // ============================================================
    // 5. СВЯЗАННЫЕ ДАННЫЕ (Master-Detail)
    // ============================================================

    let relationsHtml = '';
    try {
      // Получаем связи для текущей таблицы
      const relations = db._getRelations ? db._getRelations() : new Map();
      const relatedData = [];

      for (const [key, rel] of relations) {
        if (rel.master === selectedTable && rel.masterId === selectedRow) {
          relatedData.push({
            type: 'master',
            table: rel.detail,
            count: rel.details ? rel.details.length : 0,
            details: rel.details || [],
          });
        }
        if (rel.detail === selectedTable && rel.masterId) {
          const masterTable = rel.master;
          const masterData = isFunction(db.getTable) ? db.getTable(masterTable) : null;
          const masterRow = masterData ? masterData.data.find(r => r.id === rel.masterId) : null;
          if (masterRow) {
            relatedData.push({
              type: 'detail',
              table: masterTable,
              master: masterRow,
            });
          }
        }
      }

      if (relatedData.length > 0) {
        let relHtml = `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #1e2633;">
            <div style="font-size:11px;color:#4a5a7a;margin-bottom:6px;">🔗 Связанные данные:</div>
        `;

        for (const item of relatedData) {
          if (item.type === 'master') {
            relHtml += `
              <div style="background:#0b0e14;border-radius:4px;padding:6px 8px;margin-bottom:4px;border:1px solid #161e2a;">
                <span style="color:#60a5fa;">📊 ${escapeHtml(item.table)}</span>
                <span style="color:#4a5a7a;font-size:10px;"> (${item.count} записей)</span>
                ${
                  item.count > 0
                    ? `
                  <div style="font-size:10px;color:#8b96b0;margin-top:2px;font-family:monospace;">
                    ${item.details
                      .slice(0, 3)
                      .map(
                        d =>
                          `<span style="background:#1a2230;padding:1px 6px;border-radius:3px;margin:1px;">${escapeHtml(d.id)}</span>`
                      )
                      .join(' ')}
                    ${item.count > 3 ? `<span style="color:#4a5a7a;">+${item.count - 3} еще</span>` : ''}
                  </div>
                `
                    : ''
                }
              </div>
            `;
          } else if (item.type === 'detail') {
            relHtml += `
              <div style="background:#0b0e14;border-radius:4px;padding:6px 8px;margin-bottom:4px;border:1px solid #161e2a;">
                <span style="color:#a78bfa;">📊 ${escapeHtml(item.table)}</span>
                <span style="color:#4a5a7a;font-size:10px;"> (мастер)</span>
                <div style="font-size:10px;color:#8b96b0;font-family:monospace;">
                  🆔 ${escapeHtml(item.master.id)}
                  ${item.master.name ? `• ${escapeHtml(item.master.name)}` : ''}
                </div>
              </div>
            `;
          }
        }

        relHtml += `</div>`;
        relationsHtml = relHtml;
      }
    } catch (error) {
      // Игнорируем ошибки при получении связей
      console.debug('ℹ️ Ошибка получения связей:', error.message);
    }

    // ============================================================
    // 6. ДЕЙСТВИЯ (кнопки управления)
    // ============================================================

    const actionsHtml = `
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-xs" onclick="window.app?.editRow?.()" title="Редактировать">
          ✏️ Редактировать
        </button>
        <button class="btn btn-danger btn-xs" onclick="window.app?.deleteRow?.('${escapeHtml(selectedRow)}')" title="Удалить">
          🗑 Удалить
        </button>
        <button class="btn btn-secondary btn-xs" onclick="window.app?.copyRow?.()" title="Копировать">
          📋 Копировать
        </button>
        <button class="btn btn-secondary btn-xs" id="inspectorRefreshBtn" title="Обновить">
          🔄 Обновить
        </button>
      </div>
    `;

    // ============================================================
    // 7. СБОРКА ИТОГОВОГО HTML
    // ============================================================

    const html = `
      <div style="padding:4px;">
        ${rowInfo}
        ${dataHtml}
        ${fieldStats}
        ${relationsHtml}
        ${actionsHtml}
      </div>
    `;

    container.innerHTML = html;

    // ============================================================
    // 8. ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    // Кнопка обновления
    const refreshBtn = container.querySelector('#inspectorRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        renderInspector();
        // Добавляем визуальный отклик
        refreshBtn.textContent = '✅';
        setTimeout(() => {
          refreshBtn.textContent = '🔄 Обновить';
        }, 1000);
      });
    }

    // Обновление статистики символов
    if (DOM.inspectorSymbols) {
      const rowKeys = Object.keys(row).length;
      DOM.inspectorSymbols.textContent = `🔑 ${rowKeys} полей`;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга инспектора:', error);
    const container = DOM.inspectorContent;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки данных
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 9. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ИНСПЕКТОРОМ
// ============================================================

/**
 * Очистка инспектора
 */
export function clearInspector() {
  const container = DOM.inspectorContent;
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🔍</span>
        Инспектор очищен
      </div>
    `;
  }
  if (DOM.inspectorSymbols) {
    DOM.inspectorSymbols.textContent = '🔑 0';
  }
}

/**
 * Обновление инспектора с задержкой (дебаунс)
 */
let inspectorTimeout = null;

export function renderInspectorDebounced(delay = 300) {
  if (inspectorTimeout) {
    clearTimeout(inspectorTimeout);
  }
  inspectorTimeout = setTimeout(() => {
    renderInspector();
    inspectorTimeout = null;
  }, delay);
}

/**
 * Получение данных для инспектора в виде объекта
 */
export function getInspectorData() {
  const selectedTable = getSelectedTable();
  const selectedRow = getSelectedRow();

  if (!selectedRow || !selectedTable) {
    return null;
  }

  const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
  if (!table) {
    return null;
  }

  const row = table.data.find(r => r.id === selectedRow);
  if (!row) {
    return null;
  }

  return {
    table: selectedTable,
    row: { ...row },
    metadata: {
      created: row._created || null,
      updated: row._updated || null,
      fields: Object.keys(row).length,
      size: JSON.stringify(row).length,
    },
  };
}

/**
 * Экспорт данных инспектора в JSON
 */
export function exportInspectorData() {
  const data = getInspectorData();
  if (!data) {
    console.warn('⚠️ Нет данных для экспорта');
    return null;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inspector_${data.table}_${data.row.id}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return data;
}

// ============================================================
// 10. ИНИЦИАЛИЗАЦИЯ ДОПОЛНИТЕЛЬНЫХ ФУНКЦИЙ
// ============================================================

// Добавляем функции в глобальный объект app для доступа из консоли
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};
  window.app.renderInspector = renderInspector;
  window.app.clearInspector = clearInspector;
  window.app.getInspectorData = getInspectorData;
  window.app.exportInspectorData = exportInspectorData;

  // Добавляем горячие клавиши для инспектора
  document.addEventListener('keydown', e => {
    // Ctrl+I — открыть/обновить инспектор
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      renderInspector();
    }
    // Escape — очистить инспектор
    if (e.key === 'Escape' && e.target === document.body) {
      clearInspector();
    }
  });
}

// ============================================================
// 11. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderInspector,
  clearInspector,
  renderInspectorDebounced,
  getInspectorData,
  exportInspectorData,
};
