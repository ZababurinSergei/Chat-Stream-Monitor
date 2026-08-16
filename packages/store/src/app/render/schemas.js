// ============================================================
// render/schemas.js — 100% СИМВОЛЫ — рендеринг схем таблиц
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { isFunction, formatJson, escapeHtml, safeStringify } from '../utils.js';
import { showModal, showAlertInModal } from '../modal.js';
import { renderTables } from './tables.js';

// ============================================================
// 2. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг схем таблиц
 * 100% символы — полная изоляция
 */
export function renderSchemas() {
  try {
    const container = DOM.schemasContainer;
    if (!container) {
      console.warn('⚠️ schemasContainer не найден в DOM');
      return;
    }

    const tables = isFunction(db.listTables) ? db.listTables() : [];

    // Проверяем наличие схем
    let hasSchemas = false;
    const schemasData = [];

    for (const name of tables) {
      const schema = isFunction(db.getSchema) ? db.getSchema(name) : null;
      if (schema) {
        hasSchemas = true;
        schemasData.push({ name, schema });
      }
    }

    if (!hasSchemas) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px;">
          <span class="emoji" style="font-size:32px;">📐</span>
          <div style="font-size:14px;color:var(--es-text-secondary);margin-top:8px;">Нет схем</div>
          <div style="font-size:12px;color:var(--es-text-muted);margin-top:4px;">
            Создайте таблицу со схемой или добавьте схему к существующей
          </div>
          <div style="margin-top:12px;">
            <button class="btn btn-primary btn-sm" id="createSchemaBtn">➕ Создать схему</button>
            <button class="btn btn-secondary btn-sm" id="importSchemaBtn">📥 Импортировать схему</button>
          </div>
        </div>
      `;

      // Добавляем обработчики для пустого состояния
      const createBtn = container.querySelector('#createSchemaBtn');
      if (createBtn) {
        createBtn.addEventListener('click', () => showCreateSchemaModal());
      }

      const importBtn = container.querySelector('#importSchemaBtn');
      if (importBtn) {
        importBtn.addEventListener('click', () => showImportSchemaModal());
      }

      if (DOM.schemaSymbols) {
        DOM.schemaSymbols.textContent = '🔑 0';
      }
      return;
    }

    // ============================================================
    // 3. ПОСТРОЕНИЕ HTML
    // ============================================================

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:12px;color:var(--es-text-muted);">
          📐 Найдено схем: <strong style="color:var(--es-text-secondary);">${schemasData.length}</strong>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-xs" id="createSchemaBtnTop">➕ Создать</button>
          <button class="btn btn-secondary btn-xs" id="importSchemaBtnTop">📥 Импорт</button>
          <button class="btn btn-secondary btn-xs" id="exportAllSchemasBtn">📤 Экспорт всех</button>
          <button class="btn btn-secondary btn-xs" id="validateAllSchemasBtn">✅ Проверить все</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
    `;

    for (const { name, schema } of schemasData) {
      html += renderSchemaCard(name, schema);
    }

    html += `</div>`;

    container.innerHTML = html;

    // ============================================================
    // 4. ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    // Создание схемы
    const createBtn = container.querySelector('#createSchemaBtnTop');
    if (createBtn) {
      createBtn.addEventListener('click', () => showCreateSchemaModal());
    }

    // Импорт схемы
    const importBtn = container.querySelector('#importSchemaBtnTop');
    if (importBtn) {
      importBtn.addEventListener('click', () => showImportSchemaModal());
    }

    // Экспорт всех схем
    const exportBtn = container.querySelector('#exportAllSchemasBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => exportAllSchemas(schemasData));
    }

    // Валидация всех схем
    const validateBtn = container.querySelector('#validateAllSchemasBtn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => validateAllSchemas(schemasData));
    }

    // Кнопки для каждой схемы
    container.querySelectorAll('.schema-actions .btn').forEach(btn => {
      const tableName = btn.dataset.table;
      const action = btn.dataset.action;

      btn.addEventListener('click', () => {
        switch (action) {
          case 'edit':
            showEditSchemaModal(tableName);
            break;
          case 'delete':
            showDeleteSchemaModal(tableName);
            break;
          case 'export':
            exportSchema(tableName);
            break;
          case 'validate':
            validateSchema(tableName);
            break;
          case 'apply':
            applySchemaToTable(tableName);
            break;
        }
      });
    });

    // Обновляем счетчик символов
    if (DOM.schemaSymbols) {
      const totalFields = schemasData.reduce((acc, { schema }) => {
        return acc + Object.keys(schema).length;
      }, 0);
      DOM.schemaSymbols.textContent = `🔑 ${totalFields} полей`;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга схем:', error);
    const container = DOM.schemasContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки схем
          <div style="font-size:11px;color:var(--es-text-muted);margin-top:4px;">${escapeHtml(error.message)}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="renderSchemas()">🔄 Обновить</button>
        </div>
      `;
    }
  }
}

// ============================================================
// 5. РЕНДЕРИНГ КАРТОЧКИ СХЕМЫ
// ============================================================

function renderSchemaCard(tableName, schema) {
  const fieldCount = Object.keys(schema).length;
  const hasCustom = schema._custom && typeof schema._custom === 'function';
  const requiredFields = Object.entries(schema)
    .filter(([_, rules]) => rules.required)
    .map(([name]) => name);

  // Определяем типы полей
  const fieldTypes = {};
  for (const [name, rules] of Object.entries(schema)) {
    if (name !== '_custom') {
      fieldTypes[name] = rules.type || 'any';
    }
  }

  const typeStats = {};
  for (const type of Object.values(fieldTypes)) {
    typeStats[type] = (typeStats[type] || 0) + 1;
  }

  const typeSummary = Object.entries(typeStats)
    .map(([type, count]) => `${type}(${count})`)
    .join(', ');

  return `
    <div class="schema-card" style="background:var(--es-bg-tertiary);border-radius:8px;border:1px solid var(--es-border-primary);overflow:hidden;">
      <!-- Заголовок -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--es-bg-secondary);border-bottom:1px solid var(--es-border-primary);flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:16px;">📐</span>
          <span style="font-size:14px;font-weight:600;color:var(--es-text-secondary);">${escapeHtml(tableName)}</span>
          <span class="badge info" style="font-size:10px;">${fieldCount} полей</span>
          ${hasCustom ? '<span class="badge purple" style="font-size:10px;">⚡ Кастомная</span>' : ''}
          ${requiredFields.length > 0 ? `<span class="badge warning" style="font-size:10px;">⚠️ ${requiredFields.length} обязательных</span>` : ''}
        </div>
        <div class="schema-actions" style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-xs" data-table="${escapeHtml(tableName)}" data-action="edit">✏️</button>
          <button class="btn btn-secondary btn-xs" data-table="${escapeHtml(tableName)}" data-action="export">📤</button>
          <button class="btn btn-secondary btn-xs" data-table="${escapeHtml(tableName)}" data-action="validate">✅</button>
          <button class="btn btn-secondary btn-xs" data-table="${escapeHtml(tableName)}" data-action="apply">📊</button>
          <button class="btn btn-danger btn-xs" data-table="${escapeHtml(tableName)}" data-action="delete">🗑</button>
        </div>
      </div>

      <!-- Тело -->
      <div style="padding:10px 14px;">
        <!-- Информация о типах -->
        <div style="font-size:11px;color:var(--es-text-muted);margin-bottom:8px;">
          <span>📊 Типы полей: ${typeSummary}</span>
          ${requiredFields.length > 0 ? `<span style="margin-left:12px;">🔒 Обязательные: ${requiredFields.join(', ')}</span>` : ''}
        </div>

        <!-- Список полей -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px;">
          ${Object.entries(schema)
            .filter(([name]) => name !== '_custom')
            .map(
              ([name, rules]) => `
              <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);font-size:11px;">
                <span style="color:${rules.required ? 'var(--es-accent-yellow)' : 'var(--es-text-muted)'};">${rules.required ? '🔒' : '📌'}</span>
                <span style="color:var(--es-accent-blue-light);font-weight:500;">${escapeHtml(name)}</span>
                <span style="color:var(--es-text-dim);font-size:10px;">${escapeHtml(rules.type || 'any')}</span>
                ${rules.enum ? `<span style="color:var(--es-accent-purple);font-size:9px;">⚡${rules.enum.length}</span>` : ''}
                ${rules.pattern ? `<span style="color:var(--es-accent-green);font-size:9px;">🔍</span>` : ''}
              </div>
            `
            )
            .join('')}
        </div>

        <!-- Кастомная валидация -->
        ${
          hasCustom
            ? `
          <div style="margin-top:6px;padding:4px 8px;background:rgba(167,139,250,0.05);border-radius:4px;border:1px solid rgba(167,139,250,0.1);font-size:10px;color:var(--es-accent-purple);">
            ⚡ Кастомная валидация: функция _custom определена
          </div>
        `
            : ''
        }

        <!-- Индексы -->
        ${renderSchemaIndexes(tableName)}
      </div>
    </div>
  `;
}

// ============================================================
// 6. РЕНДЕРИНГ ИНДЕКСОВ
// ============================================================

function renderSchemaIndexes(tableName) {
  try {
    if (!isFunction(db.getIndexes)) {
      return '';
    }

    const indexes = db.getIndexes(tableName);
    if (!indexes || indexes.length === 0) {
      return '';
    }

    return `
      <div style="margin-top:6px;padding:4px 8px;background:rgba(96,165,250,0.05);border-radius:4px;border:1px solid rgba(96,165,250,0.1);font-size:10px;color:var(--es-accent-blue-light);">
        🔍 Индексы: ${indexes.map(i => `${i.field}(${i.type || 'btree'})`).join(', ')}
      </div>
    `;
  } catch {
    return '';
  }
}

// ============================================================
// 7. МОДАЛЬНЫЕ ОКНА ДЛЯ РАБОТЫ СО СХЕМАМИ
// ============================================================

/**
 * Показать модальное окно создания схемы
 */
export function showCreateSchemaModal() {
  const tables = isFunction(db.listTables) ? db.listTables() : [];

  if (tables.length === 0) {
    showAlertInModal(
      '⚠️ Нет таблиц',
      'Сначала создайте таблицу, затем добавьте к ней схему.',
      'warning'
    );
    return;
  }

  const tableOptions = tables.map(name => `<option value="${name}">${name}</option>`).join('');

  const formHtml = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
      📐 Создание схемы для таблицы. Схема определяет структуру и валидацию данных.
    </div>
    <div class="form-group">
      <label>Таблица *</label>
      <select id="schemaTable">${tableOptions}</select>
    </div>
    <div class="form-group">
      <label>Схема (JSON) *</label>
      <textarea id="schemaJson" rows="12" style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;font-family:monospace;padding:8px;">{
  "id": {
    "type": "string",
    "required": true
  },
  "name": {
    "type": "string",
    "required": true,
    "minLength": 2,
    "maxLength": 100
  },
  "email": {
    "type": "email",
    "required": false
  },
  "age": {
    "type": "number",
    "min": 0,
    "max": 150
  },
  "status": {
    "type": "string",
    "enum": ["active", "inactive", "pending"]
  }
}</textarea>
      <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
        💡 Поддерживаемые типы: string, number, boolean, array, object, email, url, uuid, date, datetime, json, any
      </div>
    </div>
    <div class="form-group">
      <label>Индексы (JSON-массив полей для индексации)</label>
      <input type="text" id="schemaIndexes" placeholder='["name", "email"]' value='["name", "email"]' style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;padding:8px;">
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label>Кастомная валидация (JavaScript-функция)</label>
      <textarea id="schemaCustom" rows="4" style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;font-family:monospace;padding:8px;">// Функция получает данные и имя таблицы
// Возвращает массив ошибок или строку с ошибкой
function(data, tableName) {
  const errors = [];
  if (data.age && data.age < 18) {
    errors.push('Возраст должен быть не менее 18 лет');
  }
  return errors;
}</textarea>
    </div>
  `;

  showModal(
    '📐 Создать схему',
    formHtml,
    data => {
      const tableName = data.schemaTable || '';
      if (!tableName) {
        showAlertInModal('⚠️ Ошибка', 'Выберите таблицу.', 'warning');
        return;
      }

      let schema;
      try {
        schema = JSON.parse(data.schemaJson || '{}');
      } catch (error) {
        showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
        return;
      }

      if (Object.keys(schema).length === 0) {
        showAlertInModal('⚠️ Ошибка', 'Схема не может быть пустой.', 'warning');
        return;
      }

      // Добавляем кастомную валидацию
      if (data.schemaCustom) {
        try {
          const customFn = new Function(
            'data',
            'tableName',
            `return (${data.schemaCustom})(data, tableName);`
          );
          schema._custom = customFn;
        } catch (error) {
          showAlertInModal('❌ Ошибка', `Ошибка в кастомной валидации: ${error.message}`, 'error');
          return;
        }
      }

      // Регистрируем схему
      if (isFunction(db.registerSchema)) {
        db.registerSchema(tableName, schema);
      } else if (isFunction(db.validation) && isFunction(db.validation.registerSchema)) {
        db.validation.registerSchema(tableName, schema);
      } else {
        showAlertInModal('⚠️ Ошибка', 'Плагин валидации не доступен.', 'warning');
        return;
      }

      // Создаем индексы
      if (data.schemaIndexes) {
        try {
          const indexes = JSON.parse(data.schemaIndexes);
          if (Array.isArray(indexes) && isFunction(db.createIndex)) {
            for (const field of indexes) {
              db.createIndex(tableName, field);
            }
          }
        } catch (error) {
          console.warn('⚠️ Ошибка создания индексов:', error);
        }
      }

      renderSchemas();
      renderTables();
      showAlertInModal('✅ Успешно', `Схема для таблицы "${tableName}" создана.`, 'success');
    },
    () => {}
  );
}

/**
 * Показать модальное окно редактирования схемы
 */
export function showEditSchemaModal(tableName) {
  const schema = isFunction(db.getSchema) ? db.getSchema(tableName) : null;
  if (!schema) {
    showAlertInModal('⚠️ Ошибка', `Схема для таблицы "${tableName}" не найдена.`, 'warning');
    return;
  }

  const { _custom, ...schemaData } = schema;
  const schemaJson = JSON.stringify(schemaData, null, 2);
  const customFn = _custom ? _custom.toString() : '';

  const formHtml = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
      ✏️ Редактирование схемы для таблицы <strong>${escapeHtml(tableName)}</strong>
    </div>
    <div class="form-group">
      <label>Схема (JSON) *</label>
      <textarea id="editSchemaJson" rows="10" style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;font-family:monospace;padding:8px;">${escapeHtml(schemaJson)}</textarea>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label>Кастомная валидация (JavaScript-функция)</label>
      <textarea id="editSchemaCustom" rows="4" style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;font-family:monospace;padding:8px;">${escapeHtml(customFn)}</textarea>
    </div>
  `;

  showModal(
    `✏️ Редактировать схему "${tableName}"`,
    formHtml,
    data => {
      let newSchema;
      try {
        newSchema = JSON.parse(data.editSchemaJson || '{}');
      } catch (error) {
        showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
        return;
      }

      if (Object.keys(newSchema).length === 0) {
        showAlertInModal('⚠️ Ошибка', 'Схема не может быть пустой.', 'warning');
        return;
      }

      // Добавляем кастомную валидацию
      if (data.editSchemaCustom) {
        try {
          const customFn = new Function(
            'data',
            'tableName',
            `return (${data.editSchemaCustom})(data, tableName);`
          );
          newSchema._custom = customFn;
        } catch (error) {
          showAlertInModal('❌ Ошибка', `Ошибка в кастомной валидации: ${error.message}`, 'error');
          return;
        }
      }

      // Обновляем схему
      if (isFunction(db.registerSchema)) {
        db.registerSchema(tableName, newSchema);
      } else if (isFunction(db.validation) && isFunction(db.validation.registerSchema)) {
        db.validation.registerSchema(tableName, newSchema);
      } else {
        showAlertInModal('⚠️ Ошибка', 'Плагин валидации не доступен.', 'warning');
        return;
      }

      renderSchemas();
      showAlertInModal('✅ Успешно', `Схема для таблицы "${tableName}" обновлена.`, 'success');
    },
    () => {}
  );
}

/**
 * Показать модальное окно подтверждения удаления схемы
 */
export function showDeleteSchemaModal(tableName) {
  showModal(
    `🗑 Удалить схему "${tableName}"?`,
    `
      <div style="text-align:center;padding:12px 0;">
        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
        <div style="font-size:14px;color:var(--es-text-secondary);">
          Вы уверены, что хотите удалить схему для таблицы <strong>${escapeHtml(tableName)}</strong>?
        </div>
        <div style="font-size:12px;color:var(--es-text-muted);margin-top:8px;">
          Это действие не обратимо. Данные не будут удалены, только схема валидации.
        </div>
      </div>
    `,
    () => {
      if (isFunction(db.unregisterSchema)) {
        db.unregisterSchema(tableName);
      } else if (isFunction(db.validation) && isFunction(db.validation.unregisterSchema)) {
        db.validation.unregisterSchema(tableName);
      }
      renderSchemas();
      renderTables();
      showAlertInModal('✅ Успешно', `Схема для таблицы "${tableName}" удалена.`, 'success');
    },
    () => {}
  );
}

// ============================================================
// 8. ЭКСПОРТ И ИМПОРТ СХЕМ
// ============================================================

/**
 * Экспорт схемы в JSON
 */
export function exportSchema(tableName) {
  const schema = isFunction(db.getSchema) ? db.getSchema(tableName) : null;
  if (!schema) {
    showAlertInModal('⚠️ Ошибка', `Схема для таблицы "${tableName}" не найдена.`, 'warning');
    return;
  }

  const data = {
    table: tableName,
    schema: schema,
    exportedAt: Date.now(),
    version: '4.0.8',
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schema_${tableName}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showAlertInModal('📤 Экспортировано', `Схема "${tableName}" экспортирована.`, 'success');
}

/**
 * Экспорт всех схем
 */
export function exportAllSchemas(schemasData) {
  const data = {
    exportedAt: Date.now(),
    version: '4.0.8',
    schemas: {},
  };

  for (const { name, schema } of schemasData) {
    data.schemas[name] = schema;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `all_schemas_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showAlertInModal('📤 Экспортировано', `Экспортировано ${schemasData.length} схем.`, 'success');
}

/**
 * Показать модальное окно импорта схемы
 */
export function showImportSchemaModal() {
  const formHtml = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--es-text-muted);">
      📥 Импорт схемы из JSON-файла
    </div>
    <div class="form-group">
      <label>Данные схемы (JSON) *</label>
      <textarea id="importSchemaData" rows="12" style="width:100%;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;font-family:monospace;padding:8px;">{
  "table": "users",
  "schema": {
    "id": { "type": "string", "required": true },
    "name": { "type": "string", "required": true }
  }
}</textarea>
    </div>
    <div style="font-size:11px;color:var(--es-text-dim);">
      💡 Формат: { "table": "имя_таблицы", "schema": { ... } }
    </div>
  `;

  showModal(
    '📥 Импортировать схему',
    formHtml,
    data => {
      let importData;
      try {
        importData = JSON.parse(data.importSchemaData || '{}');
      } catch (error) {
        showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
        return;
      }

      if (!importData.table || !importData.schema) {
        showAlertInModal(
          '⚠️ Ошибка',
          'Данные должны содержать поля "table" и "schema".',
          'warning'
        );
        return;
      }

      if (isFunction(db.registerSchema)) {
        db.registerSchema(importData.table, importData.schema);
      } else if (isFunction(db.validation) && isFunction(db.validation.registerSchema)) {
        db.validation.registerSchema(importData.table, importData.schema);
      } else {
        showAlertInModal('⚠️ Ошибка', 'Плагин валидации не доступен.', 'warning');
        return;
      }

      renderSchemas();
      renderTables();
      showAlertInModal(
        '✅ Успешно',
        `Схема для таблицы "${importData.table}" импортирована.`,
        'success'
      );
    },
    () => {}
  );
}

// ============================================================
// 9. ВАЛИДАЦИЯ СХЕМ
// ============================================================

/**
 * Валидация схемы
 */
export function validateSchema(tableName) {
  const schema = isFunction(db.getSchema) ? db.getSchema(tableName) : null;
  if (!schema) {
    showAlertInModal('⚠️ Ошибка', `Схема для таблицы "${tableName}" не найдена.`, 'warning');
    return;
  }

  const errors = [];
  const warnings = [];

  // Проверка структуры схемы
  for (const [field, rules] of Object.entries(schema)) {
    if (field === '_custom') continue;

    if (!rules.type) {
      warnings.push(`Поле "${field}" не имеет типа`);
    }

    if (rules.required && rules.type === 'any') {
      warnings.push(`Поле "${field}" обязательное, но имеет тип "any"`);
    }

    if (rules.enum && !Array.isArray(rules.enum)) {
      errors.push(`Поле "${field}" имеет некорректный enum`);
    }

    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      errors.push(`Поле "${field}" имеет некорректный диапазон (min > max)`);
    }

    if (
      rules.minLength !== undefined &&
      rules.maxLength !== undefined &&
      rules.minLength > rules.maxLength
    ) {
      errors.push(`Поле "${field}" имеет некорректную длину (minLength > maxLength)`);
    }
  }

  // Проверка наличия обязательных полей в таблице
  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (table && table.data.length > 0) {
    const firstRow = table.data[0];
    const requiredFields = Object.entries(schema)
      .filter(([_, rules]) => rules.required)
      .map(([name]) => name);

    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        warnings.push(`Обязательное поле "${field}" отсутствует в данных таблицы`);
      }
    }
  }

  const resultHtml = `
    <div style="padding:4px 0;">
      <div style="font-size:14px;font-weight:600;color:var(--es-text-secondary);margin-bottom:8px;">
        📐 Валидация схемы "${escapeHtml(tableName)}"
      </div>
      ${
        errors.length > 0
          ? `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:4px;padding:8px;margin-bottom:8px;">
          <div style="color:var(--es-accent-red);font-weight:500;margin-bottom:4px;">❌ Ошибки (${errors.length}):</div>
          ${errors.map(e => `<div style="font-size:12px;color:var(--es-text-muted);padding:2px 0;">• ${escapeHtml(e)}</div>`).join('')}
        </div>
      `
          : ''
      }
      ${
        warnings.length > 0
          ? `
        <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:4px;padding:8px;margin-bottom:8px;">
          <div style="color:var(--es-accent-yellow);font-weight:500;margin-bottom:4px;">⚠️ Предупреждения (${warnings.length}):</div>
          ${warnings.map(w => `<div style="font-size:12px;color:var(--es-text-muted);padding:2px 0;">• ${escapeHtml(w)}</div>`).join('')}
        </div>
      `
          : ''
      }
      ${
        errors.length === 0 && warnings.length === 0
          ? `
        <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:4px;padding:12px;text-align:center;">
          <div style="font-size:16px;">✅</div>
          <div style="color:var(--es-accent-green);font-weight:500;">Схема валидна</div>
          <div style="font-size:12px;color:var(--es-text-muted);">Проблем не обнаружено</div>
        </div>
      `
          : ''
      }
    </div>
  `;

  showModal(
    `📐 Валидация схемы "${tableName}"`,
    resultHtml,
    () => {},
    () => {}
  );
}

/**
 * Валидация всех схем
 */
export function validateAllSchemas(schemasData) {
  let totalErrors = 0;
  let totalWarnings = 0;
  const results = [];

  for (const { name, schema } of schemasData) {
    let errors = 0;
    let warnings = 0;

    for (const [field, rules] of Object.entries(schema)) {
      if (field === '_custom') continue;

      if (!rules.type) warnings++;
      if (rules.enum && !Array.isArray(rules.enum)) errors++;
      if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) errors++;
      if (
        rules.minLength !== undefined &&
        rules.maxLength !== undefined &&
        rules.minLength > rules.maxLength
      )
        errors++;
    }

    totalErrors += errors;
    totalWarnings += warnings;
    results.push({ name, errors, warnings });
  }

  const resultHtml = `
    <div style="padding:4px 0;">
      <div style="font-size:14px;font-weight:600;color:var(--es-text-secondary);margin-bottom:8px;">
        📐 Валидация всех схем
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:var(--es-bg-tertiary);border-radius:4px;padding:8px;text-align:center;">
          <div style="font-size:20px;color:var(--es-text-secondary);">${schemasData.length}</div>
          <div style="font-size:10px;color:var(--es-text-muted);">Всего схем</div>
        </div>
        <div style="background:rgba(239,68,68,0.08);border-radius:4px;padding:8px;text-align:center;">
          <div style="font-size:20px;color:var(--es-accent-red);">${totalErrors}</div>
          <div style="font-size:10px;color:var(--es-text-muted);">Ошибок</div>
        </div>
        <div style="background:rgba(251,191,36,0.08);border-radius:4px;padding:8px;text-align:center;">
          <div style="font-size:20px;color:var(--es-accent-yellow);">${totalWarnings}</div>
          <div style="font-size:10px;color:var(--es-text-muted);">Предупреждений</div>
        </div>
      </div>
      <div style="max-height:200px;overflow-y:auto;">
        ${results
          .map(
            ({ name, errors, warnings }) => `
          <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid var(--es-border-secondary);font-size:12px;">
            <span style="color:var(--es-text-secondary);">${escapeHtml(name)}</span>
            <span>
              ${errors > 0 ? `<span style="color:var(--es-accent-red);">❌ ${errors}</span>` : ''}
              ${warnings > 0 ? `<span style="color:var(--es-accent-yellow);margin-left:8px;">⚠️ ${warnings}</span>` : ''}
              ${errors === 0 && warnings === 0 ? `<span style="color:var(--es-accent-green);">✅</span>` : ''}
            </span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  showModal(
    '📐 Результаты валидации',
    resultHtml,
    () => {},
    () => {}
  );
}

/**
 * Применить схему к таблице (валидация существующих данных)
 */
export function applySchemaToTable(tableName) {
  const schema = isFunction(db.getSchema) ? db.getSchema(tableName) : null;
  if (!schema) {
    showAlertInModal('⚠️ Ошибка', `Схема для таблицы "${tableName}" не найдена.`, 'warning');
    return;
  }

  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) {
    showAlertInModal('⚠️ Ошибка', `Таблица "${tableName}" не найдена.`, 'warning');
    return;
  }

  if (table.data.length === 0) {
    showAlertInModal('ℹ️ Информация', `Таблица "${tableName}" пуста. Схема применена.`, 'info');
    return;
  }

  let invalidCount = 0;
  const invalidRows = [];

  for (const row of table.data) {
    // Проверяем обязательные поля
    const requiredFields = Object.entries(schema)
      .filter(([_, rules]) => rules.required)
      .map(([name]) => name);

    let isValid = true;
    for (const field of requiredFields) {
      if (!(field in row) || row[field] === undefined || row[field] === null) {
        isValid = false;
        invalidCount++;
        invalidRows.push({ id: row.id, field });
      }
    }
  }

  if (invalidCount > 0) {
    showAlertInModal(
      '⚠️ Проблемы в данных',
      `Найдено ${invalidCount} невалидных записей в таблице "${tableName}".\nПроверьте обязательные поля: ${requiredFields.join(', ')}`,
      'warning'
    );
  } else {
    showAlertInModal(
      '✅ Успешно',
      `Все ${table.data.length} записей в таблице "${tableName}" валидны.`,
      'success'
    );
  }

  renderSchemas();
}

// ============================================================
// 10. ГОРЯЧИЕ КЛАВИШИ
// ============================================================

if (typeof window !== 'undefined') {
  document.addEventListener('keydown', e => {
    // Ctrl+Shift+S — показать схемы
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      renderSchemas();
    }
  });
}

// ============================================================
// 11. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderSchemas,
  showCreateSchemaModal,
  showEditSchemaModal,
  showDeleteSchemaModal,
  exportSchema,
  exportAllSchemas,
  showImportSchemaModal,
  validateSchema,
  validateAllSchemas,
  applySchemaToTable,
};
