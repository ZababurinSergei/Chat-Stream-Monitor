// ============================================================
// controllers/tables.js — 100% СИМВОЛЫ — управление таблицами
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { CONFIG } from '../config.js';
import {
  getAppState,
  setPrivate,
  getSelectedTable,
  setSelectedTable,
  getSelectedRow,
  setSelectedRow,
} from '../state.js';
import { showModal, closeModal, showAlertInModal, showWelcomeModal } from '../modal.js';
import {
  renderAll,
  renderData,
  renderTables,
  renderStats,
  renderInspector,
} from '../render/index.js';
import { escapeHtml, isFunction, safeCall, formatJson } from '../utils.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. УПРАВЛЕНИЕ ТАБЛИЦАМИ
// ============================================================

/**
 * Выбор таблицы
 */
export function selectTable(name) {
  const state = getAppState();
  setSelectedTable(name);
  setSelectedRow(null);

  // Обновляем UI
  renderAll();

  addLog(`📊 Выбрана таблица: ${name}`, 'info');
}

/**
 * Показать модальное окно для добавления строки
 */
export function showAddRowModal() {
  const selectedTable = getSelectedTable();

  if (!selectedTable) {
    showAlertInModal(
      '⚠️ Таблица не выбрана',
      'Сначала выберите таблицу из списка слева.',
      'warning'
    );
    return;
  }

  const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
  if (!table) {
    showAlertInModal('⚠️ Таблица не найдена', `Таблица "${selectedTable}" не найдена.`, 'error');
    return;
  }

  // Определяем поля для формы
  const fields = table.data.length > 0 ? Object.keys(table.data[0]) : ['id', 'name', 'value'];

  // Строим форму
  let formHtml = `
    <div style="max-height:400px;overflow-y:auto;padding:4px;">
  `;

  for (const field of fields) {
    const placeholder = field === 'id' ? `auto_${Date.now().toString(36)}` : '';
    const isId = field === 'id';
    const isSystem = field.startsWith('_');

    // Пропускаем системные поля (кроме id)
    if (isSystem && !isId) continue;

    formHtml += `
      <div class="form-group" style="margin-bottom:8px;">
        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${escapeHtml(field)}</span>
          ${isId ? '<span style="font-size:9px;color:var(--es-text-dim);">(авто-генерация)</span>' : ''}
        </label>
        <input 
          type="text" 
          id="field_${escapeHtml(field)}" 
          placeholder="${escapeHtml(placeholder)}" 
          value="${isId ? `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` : ''}"
          ${isId ? 'style="font-family:monospace;font-size:11px;color:var(--es-accent-purple);"' : ''}
        >
      </div>
    `;
  }

  // Кнопка для добавления произвольного поля
  formHtml += `
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--es-border-secondary);">
      <button class="btn btn-secondary btn-xs" id="addCustomFieldBtn" type="button">
        ➕ Добавить поле
      </button>
      <button class="btn btn-secondary btn-xs" id="addMultipleRowsBtn" type="button" style="margin-left:4px;">
        📋 Множественная вставка
      </button>
    </div>
    <div id="customFieldsContainer" style="margin-top:8px;"></div>
    <div id="multipleRowsContainer" style="margin-top:8px;display:none;">
      <div class="form-group">
        <label>Вставьте несколько строк (JSON массив)</label>
        <textarea id="multipleRowsData" rows="6" style="width:100%;background:#0b0e14;border:1px solid #1e2633;border-radius:4px;color:#c8d0e0;font-size:12px;font-family:monospace;padding:8px;">[
  {"name": "Пример 1", "value": "данные"},
  {"name": "Пример 2", "value": "данные 2"}
]</textarea>
      </div>
    </div>
    <div style="font-size:10px;color:var(--es-text-dim);margin-top:8px;">
      💡 Поля с префиксом _ являются системными и будут скрыты
    </div>
  `;

  showModal(
    `➕ Добавить в "${selectedTable}"`,
    formHtml,
    data => {
      // Проверяем, есть ли данные для множественной вставки
      const multipleRowsData = data.multipleRowsData;
      if (multipleRowsData && multipleRowsData.trim()) {
        try {
          const rows = JSON.parse(multipleRowsData);
          if (Array.isArray(rows) && rows.length > 0) {
            addMultipleRows(selectedTable, rows);
            return;
          }
        } catch (error) {
          showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
          return;
        }
      }

      // Обычная вставка одной строки
      const row = {};
      let hasData = false;

      for (const field of fields) {
        // Пропускаем системные поля
        if (field.startsWith('_') && field !== 'id') continue;

        const inputId = `field_${escapeHtml(field)}`;
        const value = data[inputId] || '';

        if (value || field === 'id') {
          if (field === 'id' && !value) {
            row[field] = `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          } else {
            row[field] = value;
          }
          if (value) hasData = true;
        }
      }

      // Добавляем кастомные поля
      const customFields = data.customFields || {};
      for (const [key, value] of Object.entries(customFields)) {
        if (value) {
          row[key] = value;
          hasData = true;
        }
      }

      if (!hasData && Object.keys(row).length === 0) {
        showAlertInModal(
          '⚠️ Нет данных',
          'Заполните хотя бы одно поле для добавления записи.',
          'warning'
        );
        return;
      }

      try {
        if (isFunction(db.insert)) {
          db.insert(selectedTable, row);
        }
        renderAll();
        addLog(`✅ Добавлена запись в "${selectedTable}"`, 'success');
        showAlertInModal(
          '✅ Добавлено',
          `Запись успешно добавлена в "${selectedTable}"`,
          'success'
        );
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось добавить запись: ${error.message}`, 'error');
      }
    },
    () => {
      addLog('❌ Добавление отменено', 'info');
    }
  );

  // Обработчики для дополнительных кнопок
  setTimeout(() => {
    const addCustomBtn = document.getElementById('addCustomFieldBtn');
    const addMultipleBtn = document.getElementById('addMultipleRowsBtn');
    const customContainer = document.getElementById('customFieldsContainer');
    const multipleContainer = document.getElementById('multipleRowsContainer');

    if (addCustomBtn) {
      addCustomBtn.addEventListener('click', () => {
        const fieldName = prompt('Введите название поля:');
        if (fieldName && fieldName.trim()) {
          const cleanName = fieldName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
          if (customContainer) {
            const inputHtml = `
              <div class="form-group" style="margin-bottom:6px;display:flex;gap:6px;align-items:center;">
                <label style="flex:1;font-size:11px;">${escapeHtml(cleanName)}</label>
                <input type="text" id="custom_${escapeHtml(cleanName)}" placeholder="значение" style="flex:2;">
                <button class="btn btn-danger btn-xs remove-custom-field" type="button">✕</button>
              </div>
            `;
            customContainer.insertAdjacentHTML('beforeend', inputHtml);

            // Обработчик удаления
            const removeBtn = customContainer.querySelector('.remove-custom-field:last-child');
            if (removeBtn) {
              removeBtn.addEventListener('click', () => {
                removeBtn.closest('.form-group').remove();
              });
            }
          }
        }
      });
    }

    if (addMultipleBtn) {
      let multipleVisible = false;
      addMultipleBtn.addEventListener('click', () => {
        if (multipleContainer) {
          multipleVisible = !multipleVisible;
          multipleContainer.style.display = multipleVisible ? 'block' : 'none';
          addMultipleBtn.textContent = multipleVisible
            ? '📋 Скрыть множественную вставку'
            : '📋 Множественная вставка';
        }
      });
    }
  }, 100);
}

/**
 * Добавление нескольких строк одновременно
 */
function addMultipleRows(tableName, rows) {
  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      showAlertInModal('⚠️ Ошибка', 'Массив строк пуст или не является массивом', 'warning');
      return;
    }

    // Автоматически добавляем ID если его нет
    const processedRows = rows.map(row => {
      if (!row.id) {
        row.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }
      return row;
    });

    if (isFunction(db.insert)) {
      db.insert(tableName, processedRows);
    }

    renderAll();
    addLog(`✅ Добавлено ${processedRows.length} записей в "${tableName}"`, 'success');
    showAlertInModal(
      '✅ Добавлено',
      `${processedRows.length} записей успешно добавлены в "${tableName}"`,
      'success'
    );
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось добавить записи: ${error.message}`, 'error');
  }
}

// ============================================================
// 3. СОЗДАНИЕ ТАБЛИЦЫ
// ============================================================

/**
 * Показать модальное окно для создания таблицы
 */
export function showCreateTableModal(withSchema = false) {
  const formHtml = `
    <div style="max-height:400px;overflow-y:auto;padding:4px;">
      <div class="form-group">
        <label>Название таблицы *</label>
        <input type="text" id="tableName" placeholder="my_table" value="table_${Date.now().toString(36)}" style="font-family:monospace;">
        <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
          Только латиница, цифры и подчеркивание
        </div>
      </div>

      ${
        withSchema
          ? `
        <div class="form-group">
          <label>Схема (JSON) — описание структуры таблицы</label>
          <textarea id="tableSchema" rows="8" style="width:100%;background:#0b0e14;border:1px solid #1e2633;border-radius:4px;color:#c8d0e0;font-size:12px;font-family:monospace;padding:8px;">{
  "id": { "type": "string", "required": true },
  "name": { "type": "string", "required": true },
  "email": { "type": "email" },
  "age": { "type": "number", "min": 0, "max": 150 },
  "status": { "type": "string", "enum": ["active", "inactive", "pending"] },
  "createdAt": { "type": "datetime" },
  "active": { "type": "boolean" }
}</textarea>
          <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            Схема определяет типы полей и правила валидации
          </div>
        </div>

        <div class="form-group">
          <label>Индексы (массив полей для ускорения поиска)</label>
          <input type="text" id="tableIndexes" placeholder='["name", "email"]' value='["name", "email"]' style="font-family:monospace;">
          <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            Индексы ускоряют поиск по указанным полям
          </div>
        </div>

        <div class="form-group">
          <label>Метаданные (описание таблицы)</label>
          <input type="text" id="tableMetadata" placeholder='{"description": "Таблица пользователей"}' value='{"description": "Таблица с данными"}' style="font-family:monospace;">
          <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            Дополнительная информация о таблице
          </div>
        </div>
        `
          : `
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);margin-bottom:8px;">
          <div style="font-size:11px;color:var(--es-text-muted);">
            💡 Для создания таблицы со схемой используйте кнопку 
            <span style="color:var(--es-accent-blue-light);">📐 Создать со схемой</span>
          </div>
        </div>
        `
      }

      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="autoCreateIndexes" ${withSchema ? 'checked' : ''}>
          <span style="font-size:12px;">Автоматически создать индексы для всех полей</span>
        </label>
      </div>

      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="addSampleData" ${withSchema ? 'checked' : ''}>
          <span style="font-size:12px;">Добавить пример данных</span>
        </label>
      </div>
    </div>
  `;

  const modalTitle = withSchema ? '📐 Создать таблицу со схемой' : '📊 Создать таблицу';

  showModal(
    modalTitle,
    formHtml,
    data => {
      const name = data.tableName || '';
      if (!name) {
        showAlertInModal('⚠️ Ошибка', 'Введите название таблицы.', 'warning');
        return;
      }

      // Валидация имени таблицы
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        showAlertInModal(
          '⚠️ Ошибка',
          'Имя таблицы должно содержать только латиницу, цифры и подчеркивание. Начинаться с буквы или подчеркивания.',
          'warning'
        );
        return;
      }

      if (isFunction(db.getTable) && db.getTable(name)) {
        showAlertInModal('⚠️ Ошибка', `Таблица "${name}" уже существует.`, 'warning');
        return;
      }

      const options = {};

      if (withSchema) {
        try {
          const schemaText = data.tableSchema || '';
          if (schemaText) {
            options.schema = JSON.parse(schemaText);
          }

          const indexesText = data.tableIndexes || '';
          if (indexesText) {
            options.indexes = JSON.parse(indexesText);
          }

          const metadataText = data.tableMetadata || '';
          if (metadataText) {
            options.metadata = JSON.parse(metadataText);
          }
        } catch (error) {
          showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
          return;
        }
      }

      // Создаем таблицу
      try {
        if (isFunction(db.createTable)) {
          db.createTable(name, options);
        }

        // Автоматическое создание индексов
        if (data.autoCreateIndexes && options.schema) {
          const fields = Object.keys(options.schema);
          for (const field of fields) {
            if (field !== 'id' && field !== '_created' && field !== '_updated') {
              try {
                if (isFunction(db.createIndex)) {
                  db.createIndex(name, field);
                }
              } catch (e) {
                // Игнорируем ошибки при создании индексов
                console.debug(`ℹ️ Не удалось создать индекс для поля ${field}:`, e.message);
              }
            }
          }
        }

        // Добавление примера данных
        if (data.addSampleData && options.schema) {
          const sampleRow = {};
          for (const [field, rules] of Object.entries(options.schema)) {
            if (field === 'id') {
              sampleRow[field] = `sample_${Date.now().toString(36)}`;
            } else if (rules.type === 'string') {
              sampleRow[field] = `Пример ${field}`;
            } else if (rules.type === 'number') {
              sampleRow[field] = 42;
            } else if (rules.type === 'boolean') {
              sampleRow[field] = true;
            } else if (rules.type === 'email') {
              sampleRow[field] = `example@${field}.com`;
            } else if (rules.type === 'datetime') {
              sampleRow[field] = new Date().toISOString();
            } else if (rules.type === 'date') {
              sampleRow[field] = new Date().toISOString().slice(0, 10);
            }
          }
          if (Object.keys(sampleRow).length > 1) {
            try {
              if (isFunction(db.insert)) {
                db.insert(name, sampleRow);
              }
            } catch (e) {
              // Игнорируем ошибки при добавлении примера
              console.debug('ℹ️ Не удалось добавить пример данных:', e.message);
            }
          }
        }

        setSelectedTable(name);
        renderAll();

        const schemaMsg = withSchema ? ' со схемой' : '';
        addLog(`✅ Таблица "${name}" создана${schemaMsg}`, 'success');

        showAlertInModal('✅ Создано', `Таблица "${name}" успешно создана${schemaMsg}`, 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось создать таблицу: ${error.message}`, 'error');
      }
    },
    () => {
      addLog('❌ Создание таблицы отменено', 'info');
    }
  );
}

// ============================================================
// 4. УДАЛЕНИЕ ТАБЛИЦЫ
// ============================================================

/**
 * Удаление таблицы с подтверждением
 */
export function deleteTable(name) {
  if (!name) {
    showAlertInModal('⚠️ Ошибка', 'Не указано имя таблицы', 'warning');
    return;
  }

  const table = isFunction(db.getTable) ? db.getTable(name) : null;
  const recordCount = table ? table.data.length : 0;

  showModal(
    `🗑 Удалить таблицу "${name}"?`,
    `
      <div style="padding:4px;">
        <p style="color:var(--es-text-muted);">
          Все данные таблицы будут удалены без возможности восстановления.
        </p>
        ${
          recordCount > 0
            ? `
          <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;margin-top:8px;border:1px solid var(--es-border-secondary);">
            <span style="color:var(--es-accent-red);">⚠️</span>
            <span style="font-size:12px;color:var(--es-text-muted);">
              В таблице содержится <strong style="color:var(--es-accent-red);">${recordCount}</strong> записей
            </span>
          </div>
        `
            : ''
        }
        <div style="font-size:11px;color:var(--es-text-dim);margin-top:8px;">
          💡 Это действие необратимо
        </div>
      </div>
    `,
    () => {
      try {
        if (isFunction(db.dropTable)) {
          db.dropTable(name);
        }
        const state = getAppState();
        if (getSelectedTable() === name) {
          setSelectedTable(null);
          setSelectedRow(null);
        }
        renderAll();
        addLog(`🗑 Таблица "${name}" удалена`, 'warn');
        showAlertInModal('🗑 Удалено', `Таблица "${name}" успешно удалена`, 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось удалить таблицу: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Удаление таблицы "${name}" отменено`, 'info');
    }
  );
}

// ============================================================
// 5. УПРАВЛЕНИЕ ЗАПИСЯМИ
// ============================================================

/**
 * Удаление записи
 */
export function deleteRow(tableName, rowId) {
  if (!tableName || !rowId) {
    showAlertInModal('⚠️ Ошибка', 'Не указаны таблица или ID записи', 'warning');
    return;
  }

  showModal(
    `🗑 Удалить запись?`,
    `
      <div style="padding:4px;">
        <p style="color:var(--es-text-muted);">
          Запись с ID: <strong style="font-family:monospace;">${escapeHtml(rowId)}</strong> 
          будет удалена без возможности восстановления.
        </p>
        <div style="font-size:11px;color:var(--es-text-dim);margin-top:8px;">
          📊 Таблица: ${escapeHtml(tableName)}
        </div>
      </div>
    `,
    () => {
      try {
        if (isFunction(db.delete)) {
          db.delete(tableName, { id: rowId });
        }
        const state = getAppState();
        if (getSelectedRow() === rowId) {
          setSelectedRow(null);
        }
        renderAll();
        addLog(`🗑 Запись "${rowId}" удалена из "${tableName}"`, 'warn');
        showAlertInModal('🗑 Удалено', `Запись "${rowId}" успешно удалена`, 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось удалить запись: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Удаление записи "${rowId}" отменено`, 'info');
    }
  );
}

/**
 * Редактирование записи
 */
export function editRow(tableName, rowId) {
  if (!tableName || !rowId) {
    showAlertInModal('⚠️ Ошибка', 'Не указаны таблица или ID записи', 'warning');
    return;
  }

  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) {
    showAlertInModal('⚠️ Ошибка', `Таблица "${tableName}" не найдена`, 'error');
    return;
  }

  const row = table.data.find(r => r.id === rowId);
  if (!row) {
    showAlertInModal('⚠️ Ошибка', `Запись с ID "${rowId}" не найдена`, 'error');
    return;
  }

  // Строим форму редактирования
  const fields = Object.keys(row).filter(f => !f.startsWith('_') || f === 'id');

  let formHtml = `
    <div style="max-height:400px;overflow-y:auto;padding:4px;">
      <div style="font-size:11px;color:var(--es-text-dim);margin-bottom:8px;">
        Редактирование записи <strong style="font-family:monospace;">${escapeHtml(rowId)}</strong>
      </div>
  `;

  for (const field of fields) {
    const value = row[field] !== undefined && row[field] !== null ? row[field] : '';
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const isId = field === 'id';
    const isSystem = field.startsWith('_');

    formHtml += `
      <div class="form-group" style="margin-bottom:8px;">
        <label>${escapeHtml(field)}</label>
        <input 
          type="text" 
          id="edit_${escapeHtml(field)}" 
          value="${escapeHtml(displayValue)}"
          ${isId ? 'style="font-family:monospace;font-size:11px;color:var(--es-accent-purple);"' : ''}
          ${isId ? 'readonly' : ''}
        >
      </div>
    `;
  }

  formHtml += `
    <div style="font-size:10px;color:var(--es-text-dim);margin-top:8px;">
      💡 Поля с префиксом _ являются системными и не редактируются
    </div>
  `;

  showModal(
    `✏️ Редактировать запись в "${tableName}"`,
    formHtml,
    data => {
      try {
        const updatedRow = {};
        for (const field of fields) {
          if (field.startsWith('_') && field !== 'id') continue;
          const inputId = `edit_${escapeHtml(field)}`;
          const value = data[inputId];

          // Парсим JSON если это объект
          if (field !== 'id' && value && (value.startsWith('{') || value.startsWith('['))) {
            try {
              updatedRow[field] = JSON.parse(value);
            } catch {
              updatedRow[field] = value;
            }
          } else {
            updatedRow[field] = value;
          }
        }

        if (isFunction(db.update)) {
          db.update(tableName, { id: rowId }, updatedRow);
        }
        renderAll();
        addLog(`✏️ Запись "${rowId}" обновлена в "${tableName}"`, 'success');
        showAlertInModal('✅ Обновлено', `Запись "${rowId}" успешно обновлена`, 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось обновить запись: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Редактирование записи "${rowId}" отменено`, 'info');
    }
  );
}

// ============================================================
// 6. УПРАВЛЕНИЕ СВЯЗЯМИ
// ============================================================

/**
 * Создание связи между таблицами
 */
export function showLinkTablesModal() {
  const tables = isFunction(db.listTables) ? db.listTables() : [];

  if (tables.length < 2) {
    showAlertInModal(
      '⚠️ Недостаточно таблиц',
      'Для создания связи нужно минимум 2 таблицы.',
      'warning'
    );
    return;
  }

  // Получаем существующие связи
  const existingRelations = getExistingRelations();

  const optionsHtml = tables.map(name => `<option value="${name}">${name}</option>`).join('');

  const formHtml = `
    <div style="max-height:400px;overflow-y:auto;padding:4px;">
      <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
        🔗 Создание связи "Мастер-Детейл". Мастер — главная таблица, Детейл — подчиненная.
      </div>
      
      <div class="form-group">
        <label>Мастер-таблица *</label>
        <select id="masterTable">${optionsHtml}</select>
        <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
          Главная таблица, на которую будут ссылаться
        </div>
      </div>
      
      <div class="form-group">
        <label>Детейл-таблица *</label>
        <select id="detailTable">${optionsHtml}</select>
        <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
          Подчиненная таблица, которая будет ссылаться на мастера
        </div>
      </div>
      
      <div class="form-group">
        <label>Ключ связи</label>
        <input type="text" id="relationKey" value="masterId" style="font-family:monospace;">
        <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
          Поле в детейл-таблице, ссылающееся на ID мастера
        </div>
      </div>

      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="autoSelectMaster">
          <span style="font-size:12px;">Автоматически выбрать первого мастера</span>
        </label>
      </div>

      ${
        existingRelations.length > 0
          ? `
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);margin-top:8px;">
          <div style="font-size:10px;color:var(--es-text-dim);">Существующие связи:</div>
          <div style="font-size:11px;color:var(--es-text-muted);">
            ${existingRelations.map(r => `${r.master} → ${r.detail}`).join(', ')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  showModal(
    '🔗 Связать таблицы',
    formHtml,
    data => {
      const master = data.masterTable || '';
      const detail = data.detailTable || '';
      const key = data.relationKey || 'masterId';

      if (master === detail) {
        showAlertInModal('⚠️ Ошибка', 'Мастер и детейл должны быть разными таблицами.', 'warning');
        return;
      }

      // Проверяем, есть ли уже такая связь
      const exists = existingRelations.some(r => r.master === master && r.detail === detail);
      if (exists) {
        showAlertInModal(
          '⚠️ Ошибка',
          `Связь между "${master}" и "${detail}" уже существует.`,
          'warning'
        );
        return;
      }

      try {
        if (isFunction(db.link)) {
          db.link(master, detail, key);
        }

        // Автоматический выбор мастера
        if (data.autoSelectMaster) {
          const masterTable = isFunction(db.getTable) ? db.getTable(master) : null;
          if (masterTable && masterTable.data.length > 0) {
            const firstMaster = masterTable.data[0];
            if (isFunction(db.selectMaster)) {
              db.selectMaster(master, firstMaster.id);
            }
          }
        }

        renderAll();
        addLog(`🔗 Создана связь: ${master} → ${detail} (ключ: ${key})`, 'success');
        showAlertInModal('✅ Создано', `Связь "${master} → ${detail}" успешно создана`, 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось создать связь: ${error.message}`, 'error');
      }
    },
    () => {
      addLog('❌ Связывание отменено', 'info');
    }
  );
}

/**
 * Получение существующих связей
 */
function getExistingRelations() {
  try {
    const relations = db._getRelations ? db._getRelations() : new Map();
    const result = [];
    for (const [key, rel] of relations) {
      if (rel.master && rel.detail) {
        result.push({
          master: rel.master,
          detail: rel.detail,
          key: rel.key || 'masterId',
        });
      }
    }
    return result;
  } catch (error) {
    return [];
  }
}

/**
 * Удаление связи
 */
export function unlinkTables(master, detail) {
  if (!master || !detail) {
    showAlertInModal('⚠️ Ошибка', 'Не указаны таблицы для разрыва связи', 'warning');
    return;
  }

  showModal(
    `🔗 Разорвать связь?`,
    `
      <div style="padding:4px;">
        <p style="color:var(--es-text-muted);">
          Вы уверены, что хотите разорвать связь между 
          <strong>${escapeHtml(master)}</strong> и <strong>${escapeHtml(detail)}</strong>?
        </p>
        <div style="font-size:11px;color:var(--es-text-dim);margin-top:8px;">
          💡 Данные останутся нетронутыми, только связь будет удалена
        </div>
      </div>
    `,
    () => {
      try {
        if (isFunction(db.unlink)) {
          db.unlink(master, detail);
        }
        renderAll();
        addLog(`🔗 Связь разорвана: ${master} → ${detail}`, 'warn');
        showAlertInModal(
          '✅ Разорвано',
          `Связь "${master} → ${detail}" успешно разорвана`,
          'success'
        );
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось разорвать связь: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Разрыв связи "${master} → ${detail}" отменен`, 'info');
    }
  );
}

// ============================================================
// 7. ЭКСПОРТ ДАННЫХ ТАБЛИЦЫ
// ============================================================

/**
 * Экспорт данных таблицы
 */
export function exportTableData(tableName, format = 'json') {
  if (!tableName) {
    showAlertInModal('⚠️ Ошибка', 'Не указана таблица для экспорта', 'warning');
    return;
  }

  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) {
    showAlertInModal('⚠️ Ошибка', `Таблица "${tableName}" не найдена`, 'error');
    return;
  }

  const data = {
    table: tableName,
    data: table.data,
    meta: table.meta || { created: Date.now(), version: 1 },
    exportedAt: Date.now(),
    version: CONFIG.version,
    build: CONFIG.build,
    totalRecords: table.data.length,
  };

  let content = '';
  let mimeType = '';
  let extension = '';

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  } else if (format === 'csv') {
    content = convertToCSV(table.data);
    mimeType = 'text/csv';
    extension = 'csv';
  } else if (format === 'html') {
    content = convertToHTML(table.data, tableName);
    mimeType = 'text/html';
    extension = 'html';
  } else {
    showAlertInModal('⚠️ Ошибка', `Формат "${format}" не поддерживается`, 'warning');
    return;
  }

  // Скачиваем файл
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tableName}_${new Date().toISOString().slice(0, 10)}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);

  addLog(`📤 Данные таблицы "${tableName}" экспортированы в ${format.toUpperCase()}`, 'success');
  showAlertInModal(
    '✅ Экспортировано',
    `${table.data.length} записей экспортировано из "${tableName}" в ${format.toUpperCase()}`,
    'success'
  );
}

/**
 * Конвертация в CSV
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(h => {
        const value = row[h] !== undefined && row[h] !== null ? row[h] : '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : String(value);
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Конвертация в HTML
 */
function convertToHTML(data, tableName) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(tableName)} - Экспорт</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th { background: #1a2230; color: white; padding: 10px; text-align: left; font-weight: 600; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background: #f8f9fc; }
        .header { margin-bottom: 20px; }
        .header h1 { color: #1a2230; margin: 0; }
        .header .info { color: #6b7b96; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${escapeHtml(tableName)}</h1>
        <div class="info">${data.length} записей • Экспортировано: ${new Date().toLocaleString()}</div>
      </div>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data
            .map(
              row => `
            <tr>${headers.map(h => `<td>${escapeHtml(String(row[h] ?? ''))}</td>`).join('')}</tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

// ============================================================
// 8. ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
// ============================================================

/**
 * Инициализация обработчиков для управления таблицами
 */
export function initTableHandlers() {
  // Кнопка создания таблицы
  if (DOM.createTableBtn) {
    DOM.createTableBtn.addEventListener('click', () => showCreateTableModal(false));
  }

  // Кнопка создания таблицы со схемой
  if (DOM.createTableWithSchemaBtn) {
    DOM.createTableWithSchemaBtn.addEventListener('click', () => showCreateTableModal(true));
  }

  // Кнопка добавления строки
  if (DOM.addRowBtn) {
    DOM.addRowBtn.addEventListener('click', showAddRowModal);
  }

  // Кнопка обновления данных
  if (DOM.refreshDataBtn) {
    DOM.refreshDataBtn.addEventListener('click', () => {
      renderData();
      addLog('🔄 Данные таблицы обновлены', 'info');
    });
  }

  // Кнопка экспорта данных
  if (DOM.exportDataBtn) {
    DOM.exportDataBtn.addEventListener('click', () => {
      const selectedTable = getSelectedTable();
      if (selectedTable) {
        // Показываем выбор формата
        showModal(
          '📤 Экспорт данных',
          `
            <div style="padding:4px;">
              <div style="font-size:12px;color:var(--es-text-muted);margin-bottom:8px;">
                Выберите формат для экспорта таблицы <strong>${escapeHtml(selectedTable)}</strong>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <button class="btn btn-secondary" id="exportJsonBtn" style="width:100%;text-align:left;">
                  📄 JSON — структурированный формат
                </button>
                <button class="btn btn-secondary" id="exportCsvBtn" style="width:100%;text-align:left;">
                  📊 CSV — для Excel и таблиц
                </button>
                <button class="btn btn-secondary" id="exportHtmlBtn" style="width:100%;text-align:left;">
                  🌐 HTML — веб-страница с таблицей
                </button>
              </div>
            </div>
          `,
          () => {},
          () => {}
        );

        setTimeout(() => {
          const jsonBtn = document.getElementById('exportJsonBtn');
          const csvBtn = document.getElementById('exportCsvBtn');
          const htmlBtn = document.getElementById('exportHtmlBtn');

          if (jsonBtn) {
            jsonBtn.addEventListener('click', () => {
              closeModal();
              exportTableData(selectedTable, 'json');
            });
          }
          if (csvBtn) {
            csvBtn.addEventListener('click', () => {
              closeModal();
              exportTableData(selectedTable, 'csv');
            });
          }
          if (htmlBtn) {
            htmlBtn.addEventListener('click', () => {
              closeModal();
              exportTableData(selectedTable, 'html');
            });
          }
        }, 100);
      } else {
        showAlertInModal('⚠️ Ошибка', 'Сначала выберите таблицу для экспорта', 'warning');
      }
    });
  }

  // Горячие клавиши
  document.addEventListener('keydown', e => {
    // Ctrl+N — новая таблица
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      showCreateTableModal(false);
    }

    // Ctrl+Shift+N — новая таблица со схемой
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      showCreateTableModal(true);
    }

    // Ctrl+Shift+A — добавить строку
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      showAddRowModal();
    }

    // Delete — удалить выбранную строку
    if (e.key === 'Delete' && !e.target.closest('input, textarea')) {
      const selectedTable = getSelectedTable();
      const selectedRow = getSelectedRow();
      if (selectedTable && selectedRow) {
        e.preventDefault();
        deleteRow(selectedTable, selectedRow);
      }
    }
  });
}

// ============================================================
// 9. ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.selectTable = selectTable;
  window.app.addRow = showAddRowModal;
  window.app.createTable = showCreateTableModal;
  window.app.deleteTable = deleteTable;
  window.app.deleteRow = deleteRow;
  window.app.editRow = editRow;
  window.app.linkTables = showLinkTablesModal;
  window.app.unlinkTables = unlinkTables;
  window.app.exportTableData = exportTableData;

  // Добавляем методы для работы с таблицами через прокси
  window.app.tables = new Proxy(
    {},
    {
      get(target, prop) {
        if (typeof prop === 'string' && isFunction(db.getTable) && db.getTable(prop)) {
          return {
            select: () => selectTable(prop),
            delete: () => deleteTable(prop),
            export: format => exportTableData(prop, format),
            add: showAddRowModal,
            data: () => {
              const table = db.getTable(prop);
              return table ? table.data : [];
            },
          };
        }
        return undefined;
      },
    }
  );

  console.log('📋 Команды для управления таблицами:');
  console.log('  window.app.selectTable(name) — выбрать таблицу');
  console.log('  window.app.addRow() — добавить строку');
  console.log('  window.app.createTable() — создать таблицу');
  console.log('  window.app.deleteTable(name) — удалить таблицу');
  console.log('  window.app.deleteRow(table, id) — удалить строку');
  console.log('  window.app.editRow(table, id) — редактировать строку');
  console.log('  window.app.linkTables() — создать связь');
  console.log('  window.app.exportTableData(table, format) — экспорт данных');
  console.log('  window.app.tables[tableName].select() — выбрать таблицу');
  console.log('  window.app.tables[tableName].delete() — удалить таблицу');
  console.log('  window.app.tables[tableName].data() — получить данные таблицы');
}

// ============================================================
// 10. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  // Основные функции
  selectTable,
  showAddRowModal,
  showCreateTableModal,
  deleteTable,
  deleteRow,
  editRow,
  showLinkTablesModal,
  unlinkTables,
  exportTableData,

  // Вспомогательные функции
  getExistingRelations,
  addMultipleRows,
  convertToCSV,
  convertToHTML,

  // Инициализация
  initTableHandlers,
};
