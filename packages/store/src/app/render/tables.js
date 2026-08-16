// ============================================================
// app/render/tables.js — 100% СИМВОЛЫ — рендеринг таблиц
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Символы для внутреннего использования в рендерере
  RENDER_TABLES: Symbol('render.tables'),
  RENDER_TABLE_ITEM: Symbol('render.tableItem'),
  RENDER_TABLE_EMPTY: Symbol('render.tableEmpty'),
  RENDER_TABLE_ACTIONS: Symbol('render.tableActions'),
  BIND_TABLE_EVENTS: Symbol('render.bindTableEvents'),
  BIND_DELETE_EVENTS: Symbol('render.bindDeleteEvents'),
  UPDATE_TABLES_INFO: Symbol('render.updateTablesInfo'),
  GET_TABLE_STATS: Symbol('render.getTableStats'),
  HANDLE_TABLE_SELECT: Symbol('render.handleTableSelect'),
  HANDLE_TABLE_DELETE: Symbol('render.handleTableDelete'),
  VALIDATE_TABLE_NAME: Symbol('render.validateTableName'),
  FORMAT_TABLE_DISPLAY: Symbol('render.formatTableDisplay'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  RENDER_TABLES: Symbol.for('render.tables'),
  REFRESH_TABLES: Symbol.for('render.refreshTables'),
  GET_TABLES_STATE: Symbol.for('render.getTablesState'),
};

// ============================================================
// 3. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE as APP_PRIVATE, PUBLIC as APP_PUBLIC } from '../symbols.js';
import { CONFIG } from '../config.js';
import { getAppState, setSelectedTable, getSelectedTable } from '../state.js';
import { showModal, showAlertInModal } from '../modal.js';
import { renderAll, renderData } from './index.js';
import { addLog } from '../logger.js';
import { escapeHtml, isFunction, safeCall } from '../utils.js';
import { selectTable } from '../controllers/tables.js';

// ============================================================
// 4. ВНУТРЕННИЕ УТИЛИТЫ
// ============================================================

/**
 * Получить статистику таблицы
 */
function getTableStats(tableName) {
  const table = isFunction(db.getTable) ? db.getTable(tableName) : null;
  if (!table) return { count: 0, hasSchema: false, exists: false };

  const hasSchema = isFunction(db.getSchema) ? !!db.getSchema(tableName) : false;
  return {
    count: table.data ? table.data.length : 0,
    hasSchema,
    exists: true,
    meta: table.meta || {},
  };
}

/**
 * Форматировать отображение таблицы
 */
function formatTableDisplay(name, stats) {
  let display = name;
  if (stats.hasSchema) display += ' 📐';
  return display;
}

/**
 * Валидация имени таблицы
 */
function validateTableName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Имя таблицы должно быть строкой' };
  }
  if (name.length === 0) {
    return { valid: false, error: 'Имя таблицы не может быть пустым' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Имя таблицы не может превышать 100 символов' };
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return { valid: false, error: 'Имя таблицы содержит недопустимые символы' };
  }
  if (name.startsWith('_')) {
    return { valid: false, error: 'Имя таблицы не может начинаться с "_"' };
  }
  return { valid: true };
}

// ============================================================
// 5. ОСНОВНЫЕ ФУНКЦИИ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг списка таблиц (ГЛАВНАЯ ФУНКЦИЯ)
 */
export function renderTables() {
  try {
    const state = getAppState();
    const selectedTable = state[APP_PRIVATE.SELECTED_TABLE] || getSelectedTable();
    const container = DOM.tablesList;

    if (!container) {
      console.warn('⚠️ tablesList не найден в DOM');
      return;
    }

    // Получаем список таблиц
    let tables = [];
    try {
      tables = isFunction(db.listTables) ? db.listTables() : [];
    } catch (error) {
      console.warn('⚠️ Ошибка получения списка таблиц:', error);
      tables = [];
    }

    // Отображаем пустое состояние
    if (!tables || tables.length === 0) {
      renderEmptyState(container);
      updateTablesInfo(0);
      return;
    }

    // Сортируем таблицы (системные внизу)
    const sortedTables = sortTables(tables);

    // Строим HTML
    let html = '';
    let validTables = 0;

    for (const name of sortedTables) {
      const stats = getTableStats(name);
      if (!stats.exists) continue;

      validTables++;
      const isActive = name === selectedTable;
      html += renderTableItem(name, stats, isActive);
    }

    // Если нет валидных таблиц
    if (validTables === 0) {
      renderEmptyState(container);
      updateTablesInfo(0);
      return;
    }

    // Обновляем DOM
    container.innerHTML = html;
    updateTablesInfo(validTables);

    // Привязываем события
    bindTableEvents(container, selectedTable);
    bindDeleteEvents(container);
  } catch (error) {
    console.error('❌ Ошибка рендеринга таблиц:', error);
    const container = DOM.tablesList;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:var(--es-accent-red);">
          <span class="emoji">❌</span>
          Ошибка загрузки таблиц
          <span style="display:block;font-size:11px;color:var(--es-text-dim);margin-top:4px;">
            ${escapeHtml(error.message)}
          </span>
        </div>
      `;
    }
  }
}

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РЕНДЕРИНГА
// ============================================================

/**
 * Сортировка таблиц (системные внизу)
 */
function sortTables(tables) {
  return [...tables].sort((a, b) => {
    const aIsSystem = a.startsWith('_');
    const bIsSystem = b.startsWith('_');
    if (aIsSystem && !bIsSystem) return 1;
    if (!aIsSystem && bIsSystem) return -1;
    return a.localeCompare(b);
  });
}

/**
 * Рендеринг одного элемента таблицы
 */
function renderTableItem(name, stats, isActive) {
  const displayName = formatTableDisplay(name, stats);
  const count = stats.count || 0;

  return `
    <div class="table-item ${isActive ? 'active' : ''}" data-table="${escapeHtml(name)}">
      <span class="name">📋 ${escapeHtml(displayName)}</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="count">${count}</span>
        <div class="actions">
          <button class="danger delete-table-btn" data-table="${escapeHtml(name)}" title="Удалить таблицу">🗑</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Рендеринг пустого состояния
 */
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <span class="emoji">📭</span>
      Нет таблиц
      <span style="display:block;font-size:11px;color:var(--es-text-dim);margin-top:4px;">
        Нажмите «➕» для создания
      </span>
    </div>
  `;
}

/**
 * Обновление информации о таблицах
 */
function updateTablesInfo(count) {
  if (DOM.tablesInfo) {
    DOM.tablesInfo.textContent = count === 0 ? 'Нет таблиц' : `${count} таблиц`;
  }
}

// ============================================================
// 7. ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================

/**
 * Привязка событий к элементам таблиц
 */
function bindTableEvents(container, selectedTable) {
  const items = container.querySelectorAll('.table-item');

  for (const item of items) {
    // Удаляем старые обработчики (если есть)
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);

    // Добавляем обработчик клика
    newItem.addEventListener('click', e => {
      // Игнорируем клики по кнопкам действий
      if (e.target.closest('.actions')) return;

      const name = newItem.dataset.table;
      if (name) {
        handleTableSelect(name);
      }
    });
  }
}

/**
 * Привязка событий к кнопкам удаления
 */
function bindDeleteEvents(container) {
  const deleteButtons = container.querySelectorAll('.delete-table-btn');

  for (const btn of deleteButtons) {
    // Удаляем старые обработчики
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Добавляем обработчик
    newBtn.addEventListener('click', e => {
      e.stopPropagation();
      const name = newBtn.dataset.table;
      if (name) {
        handleTableDelete(name);
      }
    });
  }
}

// ============================================================
// 8. ОБРАБОТЧИКИ ДЕЙСТВИЙ
// ============================================================

/**
 * Обработка выбора таблицы
 */
function handleTableSelect(name) {
  try {
    // Валидация
    const validation = validateTableName(name);
    if (!validation.valid) {
      showAlertInModal('⚠️ Ошибка', validation.error, 'warning');
      return;
    }

    // Проверяем существование таблицы
    const table = isFunction(db.getTable) ? db.getTable(name) : null;
    if (!table) {
      showAlertInModal('⚠️ Ошибка', `Таблица "${name}" не найдена`, 'error');
      return;
    }

    // Выбираем таблицу
    selectTable(name);
    addLog(`📋 Выбрана таблица: ${name}`, 'info');
  } catch (error) {
    console.error('❌ Ошибка выбора таблицы:', error);
    showAlertInModal('❌ Ошибка', `Не удалось выбрать таблицу: ${error.message}`, 'error');
  }
}

/**
 * Обработка удаления таблицы
 */
function handleTableDelete(name) {
  // Валидация
  const validation = validateTableName(name);
  if (!validation.valid) {
    showAlertInModal('⚠️ Ошибка', validation.error, 'warning');
    return;
  }

  // Проверка системных таблиц
  if (name.startsWith('_')) {
    showAlertInModal('⚠️ Ошибка', 'Системные таблицы нельзя удалять', 'warning');
    return;
  }

  // Проверка существования
  const table = isFunction(db.getTable) ? db.getTable(name) : null;
  if (!table) {
    showAlertInModal('⚠️ Ошибка', `Таблица "${name}" не найдена`, 'error');
    return;
  }

  // Получаем статистику для предупреждения
  const stats = getTableStats(name);
  const recordCount = stats.count || 0;
  const hasRelations = checkTableRelations(name);

  // Показываем модальное окно подтверждения
  const message = `
    <div style="color:var(--es-text-muted);line-height:1.8;">
      <p><strong>Таблица:</strong> ${escapeHtml(name)}</p>
      <p><strong>Записей:</strong> ${recordCount}</p>
      ${hasRelations ? '<p style="color:var(--es-accent-yellow);">⚠️ Есть связи с другими таблицами</p>' : ''}
      <p style="margin-top:12px;color:var(--es-accent-red);">
        <strong>Внимание!</strong> Все данные таблицы будут удалены без возможности восстановления.
      </p>
    </div>
  `;

  showModal(
    `🗑 Удалить таблицу "${name}"?`,
    message,
    () => {
      performTableDelete(name);
    },
    () => {
      addLog(`ℹ️ Удаление таблицы "${name}" отменено`, 'info');
    }
  );
}

/**
 * Проверка наличия связей у таблицы
 */
function checkTableRelations(tableName) {
  try {
    let relations = {};
    try {
      const p = db._;
      if (p) {
        relations = p[Symbol('store.relations')] || {};
      }
    } catch (e) {
      relations = {};
    }

    for (const [key, rel] of Object.entries(relations)) {
      if (rel.master === tableName || rel.detail === tableName) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('⚠️ Ошибка проверки связей:', error);
    return false;
  }
}

/**
 * Выполнение удаления таблицы
 */
function performTableDelete(name) {
  try {
    // Удаляем таблицу
    if (isFunction(db.dropTable)) {
      db.dropTable(name);
    } else {
      throw new Error('Метод dropTable не доступен');
    }

    // Обновляем состояние
    const state = getAppState();
    if (state[APP_PRIVATE.SELECTED_TABLE] === name) {
      state[APP_PRIVATE.SELECTED_TABLE] = null;
      state[APP_PRIVATE.SELECTED_ROW] = null;

      // Обновляем геттеры
      setSelectedTable(null);
    }

    // Очищаем кэш
    try {
      if (db.cache && isFunction(db.cache.invalidate)) {
        db.cache.invalidate([`table:${name}`]);
      }
    } catch (e) {
      // Игнорируем ошибки кэша
    }

    // Перерендериваем всё
    renderAll();

    addLog(`🗑 Таблица "${name}" удалена`, 'warn');
    showAlertInModal('🗑 Удалено', `Таблица "${name}" успешно удалена.`, 'success');
  } catch (error) {
    console.error('❌ Ошибка удаления таблицы:', error);
    showAlertInModal('❌ Ошибка', `Не удалось удалить таблицу: ${error.message}`, 'error');
    addLog(`❌ Ошибка удаления таблицы "${name}": ${error.message}`, 'error');
  }
}

// ============================================================
// 9. ПУБЛИЧНЫЙ API
// ============================================================

/**
 * Обновить список таблиц (принудительно)
 */
export function refreshTables() {
  renderTables();
  addLog('🔄 Список таблиц обновлен', 'info');
}

/**
 * Получить состояние таблиц
 */
export function getTablesState() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    const state = {
      count: tables.length,
      tables: [],
      selected: getSelectedTable() || null,
    };

    for (const name of tables) {
      const stats = getTableStats(name);
      state.tables.push({
        name,
        count: stats.count || 0,
        hasSchema: stats.hasSchema || false,
        isSystem: name.startsWith('_'),
        isSelected: name === state.selected,
      });
    }

    return state;
  } catch (error) {
    console.warn('⚠️ Ошибка получения состояния таблиц:', error);
    return { count: 0, tables: [], selected: null, error: error.message };
  }
}

// ============================================================
// 10. ЭКСПОРТ СИМВОЛОВ
// ============================================================

export function exportTableSymbols() {
  if (typeof window !== 'undefined') {
    window.__TABLE_RENDER_SYMBOLS = {
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
    };
  }
}

// ============================================================
// 11. ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Экспортируем символы при загрузке модуля
if (typeof window !== 'undefined') {
  exportTableSymbols();
}

// ============================================================
// 12. ЭКСПОРТЫ
// ============================================================

export {
  PRIVATE as TABLE_RENDER_PRIVATE,
  PUBLIC as TABLE_RENDER_PUBLIC,
  getTableStats,
  validateTableName,
  checkTableRelations,
};

export default {
  renderTables,
  refreshTables,
  getTablesState,
  getTableStats,
  validateTableName,
  checkTableRelations,
  PRIVATE,
  PUBLIC,
};
