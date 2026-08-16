// ============================================================
// controllers/export.js — 100% СИМВОЛЫ — экспорт данных
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { CONFIG } from '../config.js';
import { getSelectedTable, getAppState } from '../state.js';
import { isFunction, escapeHtml, formatJson, safeCall } from '../utils.js';
import { showAlertInModal, showModal } from '../modal.js';
import { renderAll } from '../render/index.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

// Поддерживаемые форматы экспорта
const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  XML: 'xml',
  YAML: 'yaml',
  HTML: 'html',
  MARKDOWN: 'markdown',
  SQL: 'sql',
};

// MIME-типы для форматов
const MIME_TYPES = {
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml',
  yaml: 'text/yaml',
  html: 'text/html',
  markdown: 'text/markdown',
  sql: 'text/plain',
};

// Расширения файлов
const FILE_EXTENSIONS = {
  json: 'json',
  csv: 'csv',
  xml: 'xml',
  yaml: 'yml',
  html: 'html',
  markdown: 'md',
  sql: 'sql',
};

// ============================================================
// 3. ЭКСПОРТ ДАННЫХ ТАБЛИЦЫ
// ============================================================

/**
 * Экспорт данных выбранной таблицы
 * 100% символы — полная изоляция
 */
export function exportData() {
  try {
    const selectedTable = getSelectedTable();

    if (!selectedTable) {
      showAlertInModal(
        '⚠️ Таблица не выбрана',
        'Сначала выберите таблицу для экспорта.',
        'warning'
      );
      return;
    }

    const table = isFunction(db.getTable) ? db.getTable(selectedTable) : null;
    if (!table) {
      showAlertInModal('⚠️ Таблица не найдена', `Таблица "${selectedTable}" не найдена.`, 'error');
      return;
    }

    if (!table.data || table.data.length === 0) {
      showAlertInModal('📭 Пусто', `В таблице "${selectedTable}" нет данных для экспорта.`, 'info');
      return;
    }

    // Показываем диалог выбора формата
    showExportDialog(selectedTable, table.data);
  } catch (error) {
    console.error('❌ Ошибка экспорта данных:', error);
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать данные: ${error.message}`, 'error');
    addLog(`❌ Ошибка экспорта данных: ${error.message}`, 'error');
  }
}

// ============================================================
// 4. ДИАЛОГ ЭКСПОРТА
// ============================================================

function showExportDialog(tableName, data) {
  const formatOptions = Object.values(EXPORT_FORMATS)
    .map(
      format => `
    <option value="${format}">${format.toUpperCase()}</option>
  `
    )
    .join('');

  const formHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;color:var(--es-text-muted);margin-bottom:8px;">
        📊 Экспорт таблицы <strong>${escapeHtml(tableName)}</strong>
        (${data.length} записей)
      </div>

      <div class="form-group">
        <label>Формат экспорта</label>
        <select id="exportFormat" style="width:100%;padding:6px 10px;background:var(--es-bg-input);border:1px solid var(--es-border-primary);border-radius:4px;color:var(--es-text-secondary);font-size:12px;">
          ${formatOptions}
        </select>
      </div>

      <div class="form-group">
        <label>Опции</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          <label style="font-size:11px;color:var(--es-text-muted);display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="exportIncludeMeta" checked> Включить метаданные
          </label>
          <label style="font-size:11px;color:var(--es-text-muted);display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="exportPrettyPrint" checked> Форматировать
          </label>
          <label style="font-size:11px;color:var(--es-text-muted);display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="exportOnlySelected"> Только выбранные поля
          </label>
        </div>
      </div>

      <div class="form-group" id="exportFieldsContainer" style="display:none;">
        <label>Выберите поля для экспорта</label>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;max-height:100px;overflow-y:auto;padding:4px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);">
          ${getFieldCheckboxes(data[0])}
        </div>
      </div>
    </div>
  `;

  showModal(
    `📤 Экспорт "${tableName}"`,
    formHtml,
    formData => {
      const format = formData.exportFormat || EXPORT_FORMATS.JSON;
      const includeMeta =
        formData.exportIncludeMeta === true || formData.exportIncludeMeta === 'on';
      const prettyPrint =
        formData.exportPrettyPrint === true || formData.exportPrettyPrint === 'on';
      const onlySelected =
        formData.exportOnlySelected === true || formData.exportOnlySelected === 'on';

      let selectedFields = null;
      if (onlySelected) {
        selectedFields = getSelectedFields(formData);
      }

      performExport(tableName, data, format, { includeMeta, prettyPrint, selectedFields });
    },
    () => {
      addLog('ℹ️ Экспорт отменен', 'info');
    }
  );

  // Обработчики для динамического отображения полей
  setTimeout(() => {
    const onlySelectedCheckbox = document.getElementById('exportOnlySelected');
    const fieldsContainer = document.getElementById('exportFieldsContainer');

    if (onlySelectedCheckbox && fieldsContainer) {
      onlySelectedCheckbox.addEventListener('change', () => {
        fieldsContainer.style.display = onlySelectedCheckbox.checked ? 'block' : 'none';
      });
    }
  }, 100);
}

// ============================================================
// 5. ВЫПОЛНЕНИЕ ЭКСПОРТА
// ============================================================

function performExport(tableName, data, format, options) {
  try {
    let exportData;
    let mimeType;
    let extension;
    let filename;

    switch (format) {
      case EXPORT_FORMATS.JSON:
        exportData = exportToJSON(tableName, data, options);
        mimeType = MIME_TYPES.json;
        extension = FILE_EXTENSIONS.json;
        break;

      case EXPORT_FORMATS.CSV:
        exportData = exportToCSV(tableName, data, options);
        mimeType = MIME_TYPES.csv;
        extension = FILE_EXTENSIONS.csv;
        break;

      case EXPORT_FORMATS.XML:
        exportData = exportToXML(tableName, data, options);
        mimeType = MIME_TYPES.xml;
        extension = FILE_EXTENSIONS.xml;
        break;

      case EXPORT_FORMATS.YAML:
        exportData = exportToYAML(tableName, data, options);
        mimeType = MIME_TYPES.yaml;
        extension = FILE_EXTENSIONS.yaml;
        break;

      case EXPORT_FORMATS.HTML:
        exportData = exportToHTML(tableName, data, options);
        mimeType = MIME_TYPES.html;
        extension = FILE_EXTENSIONS.html;
        break;

      case EXPORT_FORMATS.MARKDOWN:
        exportData = exportToMarkdown(tableName, data, options);
        mimeType = MIME_TYPES.markdown;
        extension = FILE_EXTENSIONS.markdown;
        break;

      case EXPORT_FORMATS.SQL:
        exportData = exportToSQL(tableName, data, options);
        mimeType = MIME_TYPES.sql;
        extension = FILE_EXTENSIONS.sql;
        break;

      default:
        throw new Error(`Неизвестный формат: ${format}`);
    }

    // Создаем и скачиваем файл
    filename = `${tableName}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    downloadFile(exportData, filename, mimeType);

    addLog(
      `📤 Экспортировано ${data.length} записей из "${tableName}" в ${format.toUpperCase()}`,
      'success'
    );
  } catch (error) {
    console.error('❌ Ошибка выполнения экспорта:', error);
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать данные: ${error.message}`, 'error');
    addLog(`❌ Ошибка экспорта: ${error.message}`, 'error');
  }
}

// ============================================================
// 6. ФОРМАТЫ ЭКСПОРТА
// ============================================================

/**
 * Экспорт в JSON
 */
function exportToJSON(tableName, data, options) {
  const exportData = {
    table: tableName,
    exportedAt: Date.now(),
    version: CONFIG.version,
    build: CONFIG.build,
    total: data.length,
    data: options.selectedFields ? filterFields(data, options.selectedFields) : data,
  };

  if (options.includeMeta) {
    exportData.metadata = {
      table: tableName,
      created: new Date().toISOString(),
      fields: Object.keys(data[0] || {}),
      count: data.length,
    };
  }

  return options.prettyPrint ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
}

/**
 * Экспорт в CSV
 */
function exportToCSV(tableName, data, options) {
  if (!data || data.length === 0) return '';

  const fields = options.selectedFields || Object.keys(data[0]);
  const rows = data.map(row => fields.map(field => formatCSVValue(row[field])).join(','));

  // Заголовки
  const header = fields.join(',');

  // Данные
  let csv = header + '\n' + rows.join('\n');

  // Метаданные в комментариях
  if (options.includeMeta) {
    const meta = [
      `# Экспорт: ${tableName}`,
      `# Дата: ${new Date().toISOString()}`,
      `# Записей: ${data.length}`,
      `# Версия: ${CONFIG.version}`,
    ];
    csv = meta.join('\n') + '\n' + csv;
  }

  return csv;
}

/**
 * Экспорт в XML
 */
function exportToXML(tableName, data, options) {
  const fields = options.selectedFields || (data[0] ? Object.keys(data[0]) : []);
  const rows = options.selectedFields ? filterFields(data, options.selectedFields) : data;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

  if (options.includeMeta) {
    xml += `<!-- Экспорт: ${tableName} -->\n`;
    xml += `<!-- Дата: ${new Date().toISOString()} -->\n`;
    xml += `<!-- Записей: ${data.length} -->\n`;
    xml += `<!-- Версия: ${CONFIG.version} -->\n`;
  }

  xml += `<${tableName} total="${data.length}" exportedAt="${new Date().toISOString()}">\n`;

  for (const row of rows) {
    xml += `  <row>\n`;
    for (const field of fields) {
      const value = row[field] !== undefined && row[field] !== null ? String(row[field]) : '';
      xml += `    <${field}><![CDATA[${escapeXml(value)}]]></${field}>\n`;
    }
    xml += `  </row>\n`;
  }

  xml += `</${tableName}>`;
  return xml;
}

/**
 * Экспорт в YAML
 */
function exportToYAML(tableName, data, options) {
  const rows = options.selectedFields ? filterFields(data, options.selectedFields) : data;

  let yaml = `# Экспорт: ${tableName}\n`;
  yaml += `# Дата: ${new Date().toISOString()}\n`;
  yaml += `# Записей: ${data.length}\n`;
  yaml += `# Версия: ${CONFIG.version}\n\n`;

  if (options.includeMeta) {
    yaml += `metadata:\n`;
    yaml += `  table: ${tableName}\n`;
    yaml += `  exportedAt: ${new Date().toISOString()}\n`;
    yaml += `  version: ${CONFIG.version}\n`;
    yaml += `  total: ${data.length}\n`;
    yaml += `  fields: ${Object.keys(data[0] || {}).join(', ')}\n\n`;
  }

  yaml += `data:\n`;

  for (const row of rows) {
    yaml += `  - \n`;
    for (const [key, value] of Object.entries(row)) {
      const formattedValue = typeof value === 'string' ? `"${escapeYaml(value)}"` : String(value);
      yaml += `    ${key}: ${formattedValue}\n`;
    }
  }

  return yaml;
}

/**
 * Экспорт в HTML
 */
function exportToHTML(tableName, data, options) {
  const rows = options.selectedFields ? filterFields(data, options.selectedFields) : data;
  const fields = rows[0] ? Object.keys(rows[0]) : [];

  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Экспорт: ${escapeHtml(tableName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
    table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #2d3748; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: #f7fafc; }
    .header { margin-bottom: 20px; }
    .header h1 { color: #2d3748; margin: 0; }
    .header .meta { color: #718096; font-size: 14px; }
    .footer { margin-top: 20px; color: #718096; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Экспорт: ${escapeHtml(tableName)}</h1>
    <div class="meta">
      Записей: ${data.length} | Дата: ${new Date().toISOString()} | Версия: ${CONFIG.version}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        ${fields.map(f => `<th>${escapeHtml(f)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row, index) => `
        <tr>
          <td>${index + 1}</td>
          ${fields.map(f => `<td>${escapeHtml(String(row[f] ?? ''))}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    Экспортировано из Global Store Admin v${CONFIG.version}
  </div>
</body>
</html>`;

  return html;
}

/**
 * Экспорт в Markdown
 */
function exportToMarkdown(tableName, data, options) {
  const rows = options.selectedFields ? filterFields(data, options.selectedFields) : data;
  const fields = rows[0] ? Object.keys(rows[0]) : [];

  let md = `# 📊 Экспорт: ${tableName}\n\n`;
  md += `**Записей:** ${data.length}  \n`;
  md += `**Дата:** ${new Date().toISOString()}  \n`;
  md += `**Версия:** ${CONFIG.version}  \n\n`;

  // Таблица
  md += `| # | ${fields.join(' | ')} |\n`;
  md += `|${'---|'.repeat(fields.length + 1)}\n`;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    md += `| ${i + 1} | ${fields.map(f => String(row[f] ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
  }

  md += `\n---\n\n`;
  md += `*Экспортировано из Global Store Admin v${CONFIG.version}*`;

  return md;
}

/**
 * Экспорт в SQL (INSERT statements)
 */
function exportToSQL(tableName, data, options) {
  const rows = options.selectedFields ? filterFields(data, options.selectedFields) : data;
  const fields = rows[0] ? Object.keys(rows[0]) : [];

  let sql = `-- Экспорт: ${tableName}\n`;
  sql += `-- Дата: ${new Date().toISOString()}\n`;
  sql += `-- Записей: ${data.length}\n`;
  sql += `-- Версия: ${CONFIG.version}\n\n`;

  // Создание таблицы
  sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  for (const field of fields) {
    if (field !== 'id') {
      sql += `  ${field} TEXT,\n`;
    }
  }
  sql += `  _created INTEGER,\n`;
  sql += `  _updated INTEGER\n`;
  sql += `);\n\n`;

  // INSERT statements
  for (const row of rows) {
    const values = fields.map(f => {
      const value = row[f];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${escapeSql(value)}'`;
      if (typeof value === 'object') return `'${escapeSql(JSON.stringify(value))}'`;
      return String(value);
    });

    sql += `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${values.join(', ')});\n`;
  }

  return sql;
}

// ============================================================
// 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Фильтрация полей
 */
function filterFields(data, selectedFields) {
  return data.map(row => {
    const filtered = {};
    for (const field of selectedFields) {
      if (field in row) {
        filtered[field] = row[field];
      }
    }
    return filtered;
  });
}

/**
 * Получение чекбоксов для выбора полей
 */
function getFieldCheckboxes(sampleRow) {
  if (!sampleRow) return '<span style="color:var(--es-text-dim);font-size:11px;">Нет полей</span>';

  return Object.keys(sampleRow)
    .map(
      field => `
    <label style="font-size:11px;color:var(--es-text-muted);display:flex;align-items:center;gap:4px;background:var(--es-bg-secondary);padding:2px 8px;border-radius:3px;">
      <input type="checkbox" class="export-field-checkbox" value="${escapeHtml(field)}" checked>
      ${escapeHtml(field)}
    </label>
  `
    )
    .join('');
}

/**
 * Получение выбранных полей
 */
function getSelectedFields(formData) {
  const fields = [];
  const checkboxes = document.querySelectorAll('.export-field-checkbox:checked');
  for (const checkbox of checkboxes) {
    fields.push(checkbox.value);
  }
  return fields.length > 0 ? fields : null;
}

/**
 * Форматирование значения для CSV
 */
function formatCSVValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Если содержит запятую или кавычки, оборачиваем в кавычки
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  if (typeof value === 'object') {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  return String(value);
}

/**
 * Экранирование для XML
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Экранирование для YAML
 */
function escapeYaml(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Экранирование для SQL
 */
function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Скачивание файла
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// 8. ЭКСПОРТ АУДИТА
// ============================================================

/**
 * Экспорт аудита
 */
export function exportAudit() {
  try {
    let audit = [];
    try {
      if (db.audit && isFunction(db.audit.getAudit)) {
        audit = db.audit.getAudit({}, Infinity);
      } else if (isFunction(db.getAudit)) {
        audit = db.getAudit({}, Infinity);
      }
    } catch (e) {
      audit = [];
    }

    if (!audit || audit.length === 0) {
      showAlertInModal('📭 Пусто', 'Нет записей аудита для экспорта.', 'info');
      return;
    }

    // Формируем данные для экспорта
    const exportData = {
      exportedAt: Date.now(),
      version: CONFIG.version,
      build: CONFIG.build,
      total: audit.length,
      audit: audit,
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `audit_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(json, filename, MIME_TYPES.json);

    addLog(`📤 Экспортировано ${audit.length} записей аудита`, 'success');
    showAlertInModal('📤 Экспорт', `Экспортировано ${audit.length} записей аудита`, 'success');
  } catch (error) {
    console.error('❌ Ошибка экспорта аудита:', error);
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать аудит: ${error.message}`, 'error');
    addLog(`❌ Ошибка экспорта аудита: ${error.message}`, 'error');
  }
}

// ============================================================
// 9. ЭКСПОРТ ВСЕХ ДАННЫХ
// ============================================================

/**
 * Экспорт всех данных хранилища
 */
export function exportAllData() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];

    if (!tables || tables.length === 0) {
      showAlertInModal('📭 Пусто', 'Нет данных для экспорта.', 'info');
      return;
    }

    const allData = {};

    for (const name of tables) {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      if (table && table.data) {
        allData[name] = {
          data: table.data,
          meta: table.meta || {},
        };
      }
    }

    const exportData = {
      exportedAt: Date.now(),
      version: CONFIG.version,
      build: CONFIG.build,
      tables: allData,
      totalTables: tables.length,
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `all_data_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(json, filename, MIME_TYPES.json);

    addLog(`📤 Экспортированы все данные (${tables.length} таблиц)`, 'success');
    showAlertInModal(
      '📤 Экспорт',
      `Экспортированы все данные (${tables.length} таблиц)`,
      'success'
    );
  } catch (error) {
    console.error('❌ Ошибка экспорта всех данных:', error);
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать данные: ${error.message}`, 'error');
    addLog(`❌ Ошибка экспорта всех данных: ${error.message}`, 'error');
  }
}

// ============================================================
// 10. ИМПОРТ ДАННЫХ
// ============================================================

/**
 * Импорт данных из JSON файла
 */
export function importData() {
  // Создаем input для выбора файла
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv,.xml';
  input.style.display = 'none';

  input.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Валидация данных
      if (!data.table && !data.tables) {
        throw new Error('Некорректный формат данных: отсутствует поле "table" или "tables"');
      }

      // Показываем диалог подтверждения
      showImportConfirmDialog(data, file.name);
    } catch (error) {
      console.error('❌ Ошибка чтения файла:', error);
      showAlertInModal('❌ Ошибка', `Не удалось прочитать файл: ${error.message}`, 'error');
      addLog(`❌ Ошибка импорта: ${error.message}`, 'error');
    }

    document.body.removeChild(input);
  });

  document.body.appendChild(input);
  input.click();
}

/**
 * Диалог подтверждения импорта
 */
function showImportConfirmDialog(data, filename) {
  const tableName = data.table || Object.keys(data.tables || {})[0] || 'unknown';
  const recordCount = data.data
    ? data.data.length
    : data.tables
      ? Object.values(data.tables).reduce((sum, t) => sum + (t.data ? t.data.length : 0), 0)
      : 0;

  const formHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;color:var(--es-text-muted);margin-bottom:8px;">
        📥 Импорт данных из файла <strong>${escapeHtml(filename)}</strong>
      </div>

      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);margin-bottom:12px;">
        <div style="font-size:11px;color:var(--es-text-muted);line-height:1.8;">
          <div>📊 Таблица: <span style="color:var(--es-text-secondary);">${escapeHtml(tableName)}</span></div>
          <div>📝 Записей: <span style="color:var(--es-text-secondary);">${recordCount}</span></div>
          <div>📅 Дата: <span style="color:var(--es-text-secondary);">${new Date(data.exportedAt || Date.now()).toLocaleString()}</span></div>
          <div>📦 Версия: <span style="color:var(--es-text-secondary);">${data.version || 'неизвестно'}</span></div>
        </div>
      </div>

      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="importOverwrite" style="width:16px;height:16px;">
          <span style="font-size:12px;color:var(--es-text-muted);">
            Перезаписать существующие данные
            <span style="font-size:10px;color:var(--es-text-dim);display:block;">
              (если не отмечено, данные будут добавлены)
            </span>
          </span>
        </label>
      </div>

      <div style="background:rgba(239,68,68,0.08);border-radius:6px;padding:8px;border:1px solid rgba(239,68,68,0.2);">
        <span style="font-size:11px;color:var(--es-accent-red);">
          ⚠️ Внимание! Импорт данных — необратимая операция. Рекомендуется создать резервную копию перед импортом.
        </span>
      </div>
    </div>
  `;

  showModal(
    `📥 Импорт данных`,
    formHtml,
    async formData => {
      const overwrite = formData.importOverwrite === true || formData.importOverwrite === 'on';
      await performImport(data, tableName, overwrite);
    },
    () => {
      addLog('ℹ️ Импорт отменен', 'info');
    }
  );
}

/**
 * Выполнение импорта
 */
async function performImport(data, tableName, overwrite) {
  try {
    // Если данные в формате { tables: { ... } }
    if (data.tables) {
      for (const [name, tableData] of Object.entries(data.tables)) {
        await importTableData(name, tableData.data || [], overwrite);
      }
    } else if (data.data) {
      // Одиночная таблица
      await importTableData(tableName, data.data, overwrite);
    } else {
      throw new Error('Некорректный формат данных');
    }

    renderAll();
    showAlertInModal('✅ Импорт завершен', 'Данные успешно импортированы', 'success');
    addLog(`✅ Импорт данных в "${tableName}" завершен`, 'success');
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
    showAlertInModal('❌ Ошибка', `Не удалось импортировать данные: ${error.message}`, 'error');
    addLog(`❌ Ошибка импорта: ${error.message}`, 'error');
  }
}

/**
 * Импорт данных в таблицу
 */
async function importTableData(tableName, data, overwrite) {
  if (!data || data.length === 0) {
    addLog(`ℹ️ Нет данных для импорта в "${tableName}"`, 'info');
    return;
  }

  // Проверяем существование таблицы
  const tableExists = isFunction(db.getTable) ? !!db.getTable(tableName) : false;

  if (!tableExists) {
    // Создаем таблицу, если не существует
    if (isFunction(db.createTable)) {
      db.createTable(tableName);
      addLog(`📊 Таблица "${tableName}" создана`, 'info');
    } else {
      throw new Error(`Таблица "${tableName}" не существует и не может быть создана`);
    }
  }

  if (overwrite) {
    // Перезапись: очищаем таблицу и вставляем новые данные
    if (isFunction(db.clearTable)) {
      db.clearTable(tableName);
    }
    if (isFunction(db.insert)) {
      db.insert(tableName, data);
    }
  } else {
    // Добавление: вставляем данные
    if (isFunction(db.insert)) {
      db.insert(tableName, data);
    }
  }

  addLog(`📥 Импортировано ${data.length} записей в "${tableName}"`, 'success');
}

// ============================================================
// 11. ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.exportData = exportData;
  window.app.exportAudit = exportAudit;
  window.app.exportAllData = exportAllData;
  window.app.importData = importData;

  window.app.getExportFormats = () => Object.values(EXPORT_FORMATS);

  console.log('📋 Команды для экспорта:');
  console.log('  window.app.exportData() — экспорт выбранной таблицы');
  console.log('  window.app.exportAudit() — экспорт аудита');
  console.log('  window.app.exportAllData() — экспорт всех данных');
  console.log('  window.app.importData() — импорт данных из файла');
  console.log('  window.app.getExportFormats() — список форматов экспорта');
}

// ============================================================
// 12. ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Экспортируем форматы
export const FORMATS = EXPORT_FORMATS;

// ============================================================
// 13. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  exportData,
  exportAudit,
  exportAllData,
  importData,
  FORMATS,
};
