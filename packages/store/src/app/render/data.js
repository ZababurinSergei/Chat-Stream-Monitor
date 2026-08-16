// ============================================================
// app/render/data.js — 100% СИМВОЛЫ — рендеринг данных таблицы
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getAppState, getSelectedTable, getSelectedRow, setSelectedRow } from '../state.js';
import { showModal } from '../modal.js';
import { renderInspector } from './inspector.js';
import { renderAll } from './index.js';
import { escapeHtml, formatJson, isFunction } from '../utils.js';
import { addLog } from '../logger.js';
import { renderStats, renderTables } from './index.js';

// ============================================================
// 1. ОСНОВНОЙ РЕНДЕРИНГ ДАННЫХ
// ============================================================

export function renderData() {
  try {
    const container = DOM.dataContainer;
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
          <span style="display:block;font-size:11px;color:#4a5a7a;margin-top:4px;">
            Нажмите «➕ Добавить» для создания записи
          </span>
        </div>
      `;
      return;
    }

    const firstRow = table.data[0];
    const columns = Object.keys(firstRow);
    const selectedId = isFunction(db.getSelection) ? db.getSelection(selectedTable) : null;

    // Обновляем состояние выделенной строки
    if (selectedId) {
      state[PRIVATE.SELECTED_ROW] = selectedId;
    }

    let html = `<table class="data-table"><thead><tr>`;
    html += `<th style="width:30px;">#</th>`;
    for (const col of columns) {
      const isId = col === 'id';
      html += `<th${isId ? ' style="width:120px;"' : ''}>${escapeHtml(col)}</th>`;
    }
    html += `<th style="width:90px;">Действия</th></tr></thead><tbody>`;

    for (let i = 0; i < table.data.length; i++) {
      const row = table.data[i];
      const isSelected = row.id === selectedId || row.id === state[PRIVATE.SELECTED_ROW];

      html += `<tr class="${isSelected ? 'selected' : ''}" data-id="${escapeHtml(row.id)}">`;
      html += `<td class="id-col">${i + 1}</td>`;

      for (const col of columns) {
        const value = row[col];
        let display = value;
        let displayClass = '';

        // Обработка разных типов данных
        if (value === null || value === undefined) {
          display = '—';
          displayClass = 'null-value';
        } else if (typeof value === 'object') {
          try {
            const str = JSON.stringify(value);
            display = str.length > 50 ? str.substring(0, 50) + '…' : str;
            displayClass = 'json-value';
          } catch {
            display = '[Object]';
            displayClass = 'json-value';
          }
        } else if (typeof value === 'boolean') {
          display = value ? '✅' : '❌';
          displayClass = 'boolean-value';
        } else if (typeof value === 'number') {
          display = String(value);
          displayClass = 'number-value';
        } else if (typeof value === 'string' && value.length > 50) {
          display = value.substring(0, 50) + '…';
          displayClass = 'long-text';
        }

        const title = typeof value === 'object' ? JSON.stringify(value) : String(value);

        if (col === 'id') {
          html += `<td class="id-col" title="${escapeHtml(title)}">${escapeHtml(String(display))}</td>`;
        } else {
          html += `<td class="${displayClass}" title="${escapeHtml(title)}">${escapeHtml(String(display))}</td>`;
        }
      }

      html += `
        <td>
          <div class="actions-col">
            <button class="select-btn" data-id="${escapeHtml(row.id)}" title="Выделить">🎯</button>
            <button class="edit-btn" data-id="${escapeHtml(row.id)}" title="Редактировать">✏️</button>
            <button class="danger delete-btn" data-id="${escapeHtml(row.id)}" title="Удалить">🗑</button>
          </div>
        </td>
      </tr>`;
    }

    html += `</tbody></table>`;
    container.innerHTML = html;

    // ============================================================
    // 2. ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    // Выделение строки
    container.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (isFunction(db.selectRow)) db.selectRow(selectedTable, id);
        const state = getAppState();
        state[PRIVATE.SELECTED_ROW] = id;
        renderData();
        renderInspector();
        addLog(`🎯 Выделена запись: ${id}`, 'info');
      });
    });

    // Редактирование строки
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        showEditRowModal(selectedTable, id);
      });
    });

    // Удаление строки
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        showDeleteRowModal(selectedTable, id);
      });
    });

    // Клик по строке
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

    // Двойной клик для редактирования
    container.querySelectorAll('tbody tr').forEach(el => {
      el.addEventListener('dblclick', () => {
        const id = el.dataset.id;
        if (id) {
          showEditRowModal(selectedTable, id);
        }
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга данных:', error);
    if (DOM.dataContainer) {
      DOM.dataContainer.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки данных: ${escapeHtml(error.message)}
        </div>
      `;
    }
  }
}

// ============================================================
// 3. РЕДАКТИРОВАНИЕ СТРОКИ
// ============================================================

export function showEditRowModal(tableName, rowId) {
  try {
    const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
    if (!table) {
      addLog(`❌ Таблица не найдена: ${tableName}`, 'error');
      return;
    }

    const row = table.data.find(r => r.id === rowId);
    if (!row) {
      addLog(`❌ Запись не найдена: ${rowId}`, 'error');
      return;
    }

    const fields = Object.keys(row);
    let formHtml = `
      <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
        ✏️ Редактирование записи <strong>${escapeHtml(rowId)}</strong> в таблице <strong>${escapeHtml(tableName)}</strong>
      </div>
    `;

    for (const field of fields) {
      const value = row[field];
      let displayValue = '';
      let inputType = 'text';

      if (value === null || value === undefined) {
        displayValue = '';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
        inputType = 'textarea';
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'true' : 'false';
        inputType = 'text';
      } else {
        displayValue = String(value);
      }

      const isId = field === 'id';
      const isReadonly = isId;

      if (inputType === 'textarea') {
        formHtml += `
          <div class="form-group">
            <label>${escapeHtml(field)} ${isId ? '🔒' : ''}</label>
            <textarea id="field_${escapeHtml(field)}" rows="3" ${isReadonly ? 'readonly' : ''} 
              style="width:100%;background:#0b0e14;border:1px solid #1e2633;border-radius:4px;color:#c8d0e0;font-size:12px;font-family:monospace;padding:8px;">${escapeHtml(displayValue)}</textarea>
          </div>
        `;
      } else {
        formHtml += `
          <div class="form-group">
            <label>${escapeHtml(field)} ${isId ? '🔒' : ''}</label>
            <input type="${inputType}" id="field_${escapeHtml(field)}" 
              value="${escapeHtml(displayValue)}" ${isReadonly ? 'readonly' : ''}
              style="${isReadonly ? 'color:#4a5a7a;' : ''}">
          </div>
        `;
      }
    }

    showModal(
      `✏️ Редактирование: ${escapeHtml(rowId)}`,
      formHtml,
      data => {
        const updatedRow = {};
        let hasChanges = false;

        for (const field of fields) {
          const inputId = `field_${escapeHtml(field)}`;
          let value = data[inputId] || '';

          // Преобразуем значение в зависимости от типа
          if (field === 'id') {
            updatedRow[field] = rowId; // ID не меняем
            continue;
          }

          const originalValue = row[field];

          // Парсим JSON если это объект
          if (typeof originalValue === 'object' && originalValue !== null) {
            try {
              value = JSON.parse(value);
            } catch {
              // оставляем как строку
            }
          } else if (typeof originalValue === 'boolean') {
            value = value === 'true' || value === '1' || value === 'on';
          } else if (typeof originalValue === 'number') {
            value = parseFloat(value);
            if (isNaN(value)) value = originalValue;
          }

          updatedRow[field] = value;

          // Проверяем изменения
          if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
            hasChanges = true;
          }
        }

        if (!hasChanges) {
          addLog(`ℹ️ Нет изменений для записи ${rowId}`, 'info');
          return;
        }

        try {
          if (isFunction(db.update)) {
            db.update(tableName, { id: rowId }, updatedRow);
            renderAll();
            addLog(`✅ Запись ${rowId} обновлена`, 'success');
          }
        } catch (error) {
          addLog(`❌ Ошибка обновления: ${error.message}`, 'error');
        }
      },
      () => {
        addLog(`ℹ️ Редактирование ${rowId} отменено`, 'info');
      }
    );
  } catch (error) {
    addLog(`❌ Ошибка открытия редактора: ${error.message}`, 'error');
  }
}

// ============================================================
// 4. УДАЛЕНИЕ СТРОКИ
// ============================================================

export function showDeleteRowModal(tableName, rowId) {
  showModal(
    `🗑 Удалить запись?`,
    `
      <div style="display:flex;flex-direction:column;gap:12px;padding:4px;">
        <div style="font-size:14px;color:var(--es-text-secondary);">
          Запись с ID: <strong style="color:var(--es-accent-blue-light);">${escapeHtml(rowId)}</strong>
        </div>
        <div style="font-size:13px;color:var(--es-text-muted);">
          будет удалена из таблицы <strong>${escapeHtml(tableName)}</strong> без возможности восстановления.
        </div>
        <div style="font-size:12px;color:var(--es-text-dim);margin-top:4px;padding:8px;background:var(--es-bg-tertiary);border-radius:4px;border:1px solid var(--es-border-secondary);">
          ⚠️ Это действие необратимо!
        </div>
      </div>
    `,
    () => {
      try {
        if (isFunction(db.delete)) {
          db.delete(tableName, { id: rowId });
          const state = getAppState();
          if (state[PRIVATE.SELECTED_ROW] === rowId) {
            state[PRIVATE.SELECTED_ROW] = null;
          }
          renderAll();
          addLog(`🗑 Запись "${rowId}" удалена`, 'warn');
        }
      } catch (error) {
        addLog(`❌ Ошибка удаления: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Удаление записи "${rowId}" отменено`, 'info');
    }
  );
}

// ============================================================
// 5. МАССОВЫЕ ОПЕРАЦИИ
// ============================================================

export function showBulkDeleteModal(tableName) {
  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) {
    addLog(`❌ Таблица не найдена: ${tableName}`, 'error');
    return;
  }

  if (table.data.length === 0) {
    addLog(`ℹ️ В таблице ${tableName} нет записей для удаления`, 'info');
    return;
  }

  // Создаем чекбоксы для каждой записи
  let formHtml = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
      🗑 Выберите записи для массового удаления из таблицы <strong>${escapeHtml(tableName)}</strong>
    </div>
    <div style="margin-bottom:8px;">
      <button class="btn btn-secondary btn-xs" id="selectAllBtn">✅ Выбрать все</button>
      <button class="btn btn-secondary btn-xs" id="deselectAllBtn">⬜ Снять все</button>
    </div>
    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--es-border-secondary);border-radius:4px;padding:4px;">
  `;

  for (const row of table.data) {
    const displayName = row.name || row.title || row.id;
    formHtml += `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--es-border-secondary);">
        <input type="checkbox" id="row_${escapeHtml(row.id)}" value="${escapeHtml(row.id)}" class="bulk-checkbox">
        <label for="row_${escapeHtml(row.id)}" style="font-size:12px;color:var(--es-text-secondary);cursor:pointer;">
          ${escapeHtml(row.id)} — ${escapeHtml(String(displayName))}
        </label>
      </div>
    `;
  }

  formHtml += `</div>`;

  showModal(
    `🗑 Массовое удаление из ${escapeHtml(tableName)}`,
    formHtml,
    data => {
      // Собираем выбранные ID
      const selectedIds = [];
      for (const row of table.data) {
        const checkboxId = `row_${escapeHtml(row.id)}`;
        if (data[checkboxId]) {
          selectedIds.push(row.id);
        }
      }

      if (selectedIds.length === 0) {
        addLog('ℹ️ Не выбрано ни одной записи для удаления', 'info');
        return;
      }

      // Подтверждение массового удаления
      showModal(
        `⚠️ Подтверждение массового удаления`,
        `
          <div style="display:flex;flex-direction:column;gap:12px;padding:4px;">
            <div style="font-size:14px;color:var(--es-text-secondary);">
              Вы уверены, что хотите удалить <strong style="color:var(--es-accent-red);">${selectedIds.length}</strong> записей?
            </div>
            <div style="font-size:12px;color:var(--es-text-muted);">
              Записи будут удалены без возможности восстановления.
            </div>
            <div style="font-size:11px;color:var(--es-text-dim);padding:8px;background:var(--es-bg-tertiary);border-radius:4px;border:1px solid var(--es-border-secondary);max-height:100px;overflow-y:auto;">
              ${selectedIds.map(id => `• ${escapeHtml(id)}`).join('<br>')}
            </div>
          </div>
        `,
        () => {
          try {
            let deleted = 0;
            for (const id of selectedIds) {
              if (isFunction(db.delete)) {
                db.delete(tableName, { id });
                deleted++;
              }
            }
            const state = getAppState();
            if (state[PRIVATE.SELECTED_ROW] && selectedIds.includes(state[PRIVATE.SELECTED_ROW])) {
              state[PRIVATE.SELECTED_ROW] = null;
            }
            renderAll();
            addLog(`🗑 Удалено ${deleted} записей из ${tableName}`, 'warn');
          } catch (error) {
            addLog(`❌ Ошибка массового удаления: ${error.message}`, 'error');
          }
        },
        () => {
          addLog('ℹ️ Массовое удаление отменено', 'info');
        }
      );
    },
    () => {
      addLog('ℹ️ Выбор записей отменен', 'info');
    }
  );

  // Добавляем обработчики для кнопок выбора после рендеринга
  setTimeout(() => {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const checkboxes = document.querySelectorAll('.bulk-checkbox');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => (cb.checked = true));
      });
    }

    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => (cb.checked = false));
      });
    }
  }, 100);
}

// ============================================================
// 6. ЭКСПОРТ ДАННЫХ ТАБЛИЦЫ В CSV
// ============================================================

export function exportTableToCSV(tableName) {
  try {
    const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
    if (!table) {
      addLog(`❌ Таблица не найдена: ${tableName}`, 'error');
      return;
    }

    if (table.data.length === 0) {
      addLog(`ℹ️ В таблице ${tableName} нет данных для экспорта`, 'info');
      return;
    }

    const firstRow = table.data[0];
    const columns = Object.keys(firstRow);

    // Создаем CSV
    let csv = columns.join(',') + '\n';
    for (const row of table.data) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
        return String(value).replace(/"/g, '""');
      });
      csv += values.join(',') + '\n';
    }

    // Скачиваем файл
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog(
      `📤 Таблица ${tableName} экспортирована в CSV (${table.data.length} записей)`,
      'success'
    );
  } catch (error) {
    addLog(`❌ Ошибка экспорта CSV: ${error.message}`, 'error');
  }
}

// ============================================================
// 7. ПОИСК В ТАБЛИЦЕ
// ============================================================

export function showSearchInTable(tableName) {
  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) {
    addLog(`❌ Таблица не найдена: ${tableName}`, 'error');
    return;
  }

  const firstRow = table.data.length > 0 ? table.data[0] : {};
  const columns = Object.keys(firstRow);

  let formHtml = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
      🔍 Поиск в таблице <strong>${escapeHtml(tableName)}</strong>
    </div>
    <div class="form-group">
      <label>Поле для поиска</label>
      <select id="searchField">
        ${columns.map(col => `<option value="${escapeHtml(col)}">${escapeHtml(col)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Значение</label>
      <input type="text" id="searchValue" placeholder="Введите значение для поиска...">
    </div>
    <div class="form-group">
      <label>Точное совпадение</label>
      <input type="checkbox" id="exactMatch">
    </div>
  `;

  showModal(
    `🔍 Поиск в ${escapeHtml(tableName)}`,
    formHtml,
    data => {
      const field = data.searchField || columns[0];
      const value = data.searchValue || '';
      const exactMatch = data.exactMatch || false;

      if (!value) {
        addLog('ℹ️ Введите значение для поиска', 'info');
        return;
      }

      let results;
      if (exactMatch) {
        results = table.data.filter(row => row[field] === value);
      } else {
        const searchValue = String(value).toLowerCase();
        results = table.data.filter(row => {
          const rowValue = String(row[field] || '').toLowerCase();
          return rowValue.includes(searchValue);
        });
      }

      addLog(`🔍 Найдено ${results.length} записей в ${tableName} по полю ${field}`, 'info');

      // Показываем результаты
      if (results.length === 0) {
        showModal(
          '📋 Результаты поиска',
          `<div style="text-align:center;padding:20px;color:var(--es-text-muted);">
            <div style="font-size:32px;">🔍</div>
            <div style="margin-top:8px;">Ничего не найдено</div>
            <div style="font-size:12px;margin-top:4px;">Поиск по полю "${escapeHtml(field)}" со значением "${escapeHtml(value)}"</div>
          </div>`,
          () => {}
        );
        return;
      }

      // Показываем результаты в виде таблицы
      let resultsHtml = `
        <div style="font-size:12px;color:var(--es-text-muted);margin-bottom:12px;">
          Найдено <strong style="color:var(--es-accent-green);">${results.length}</strong> записей
        </div>
        <div style="max-height:400px;overflow-y:auto;border:1px solid var(--es-border-secondary);border-radius:4px;">
          <table class="data-table" style="font-size:11px;">
            <thead><tr>
              <th style="width:30px;">#</th>
              ${Object.keys(results[0])
                .map(col => `<th>${escapeHtml(col)}</th>`)
                .join('')}
            </tr></thead>
            <tbody>
      `;

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        resultsHtml += `<tr>`;
        resultsHtml += `<td class="id-col">${i + 1}</td>`;
        for (const col of Object.keys(row)) {
          const value = row[col];
          const display =
            typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value);
          resultsHtml += `<td title="${escapeHtml(String(value))}">${escapeHtml(display)}</td>`;
        }
        resultsHtml += `</tr>`;
      }

      resultsHtml += `</tbody></table></div>`;

      showModal(`📋 Результаты поиска (${results.length})`, resultsHtml, () => {});
    },
    () => {
      addLog('ℹ️ Поиск отменен', 'info');
    }
  );
}

// ============================================================
// 8. ОБНОВЛЕНИЕ ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ
// ============================================================

let autoRefreshInterval = null;

export function startAutoRefresh(intervalMs = 5000) {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  autoRefreshInterval = setInterval(() => {
    const state = getAppState();
    if (state[PRIVATE.SELECTED_TABLE]) {
      renderData();
    }
  }, intervalMs);
  addLog(`🔄 Авто-обновление включено (${intervalMs}ms)`, 'info');
}

export function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    addLog('⏹ Авто-обновление отключено', 'info');
  }
}

// ============================================================
// 9. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderData,
  showEditRowModal,
  showDeleteRowModal,
  showBulkDeleteModal,
  exportTableToCSV,
  showSearchInTable,
  startAutoRefresh,
  stopAutoRefresh,
};
