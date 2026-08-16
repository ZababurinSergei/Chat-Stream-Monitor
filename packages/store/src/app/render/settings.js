// ============================================================
// render/settings.js — 100% СИМВОЛЫ — рендеринг настроек
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
import { isFunction, escapeHtml, formatJson, safeCall } from '../utils.js';
import { showAlertInModal, showModal } from '../modal.js';
import { renderAll } from './index.js';

// ============================================================
// 2. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг настроек — отображение квот и информации о системе
 * 100% символы — полная изоляция
 */
export function renderSettings() {
  try {
    // Получение квот
    const quotas = isFunction(db.getQuotas) ? db.getQuotas() : {};
    const state = isFunction(db.getState) ? db.getState() : {};

    // Рендеринг квот
    if (DOM.quotasDisplay) {
      DOM.quotasDisplay.innerHTML = renderQuotasHTML(quotas, state);
    }

    // Рендеринг информации
    if (DOM.infoDisplay) {
      DOM.infoDisplay.innerHTML = renderInfoHTML(quotas, state);
    }

    // Обновление символов
    if (DOM.quotaSymbols) {
      const quotaCount = Object.keys(quotas).length;
      DOM.quotaSymbols.textContent = `🔑 ${quotaCount} квот`;
    }

    if (DOM.infoSymbols) {
      const infoCount = Object.keys(state).length;
      DOM.infoSymbols.textContent = `🔑 ${infoCount} полей`;
    }

    // Дополнительная статистика
    updateAdditionalStats();
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга настроек:', error);
    if (DOM.quotasDisplay) {
      DOM.quotasDisplay.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки квот
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
    if (DOM.infoDisplay) {
      DOM.infoDisplay.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки информации
        </div>
      `;
    }
  }
}

// ============================================================
// 3. РЕНДЕРИНГ КВОТ
// ============================================================

function renderQuotasHTML(quotas, state) {
  const defaultQuotas = CONFIG.defaultQuotas || {};

  // Сборка статистики использования
  const usage = {
    tables: state.tables ? state.tables.length : 0,
    records: isFunction(db.healthCheck) ? db.healthCheck().records || 0 : 0,
    relations: state.relations ? state.relations.length : 0,
    plugins: state.plugins ? state.plugins.length : 0,
    listeners: isFunction(db.healthCheck) ? db.healthCheck().listeners || 0 : 0,
    undoSize: state.undoSize || 0,
    redoSize: state.redoSize || 0,
    transactions: state.transactions || 0,
    bufferSize: state.bufferSize || 0,
    cacheSize: getCacheSize(),
  };

  // Формируем список квот
  const quotaItems = [
    {
      key: 'maxTables',
      label: '📊 Максимум таблиц',
      value: quotas.maxTables || defaultQuotas.maxTables || 50,
      usage: usage.tables,
      icon: '📋',
    },
    {
      key: 'maxRecords',
      label: '📝 Максимум записей',
      value: quotas.maxRecords || defaultQuotas.maxRecords || 10000,
      usage: usage.records,
      icon: '📊',
    },
    {
      key: 'maxRecordsPerTable',
      label: '📋 Записей на таблицу',
      value: quotas.maxRecordsPerTable || defaultQuotas.maxRecordsPerTable || 10000,
      usage: Math.max(0, getMaxRecordsPerTable()),
      icon: '📄',
    },
    {
      key: 'maxFields',
      label: '🔤 Максимум полей',
      value: quotas.maxFields || defaultQuotas.maxFields || 100,
      usage: getMaxFields(),
      icon: '📐',
    },
    {
      key: 'maxTotalSize',
      label: '💾 Общий размер',
      value: quotas.maxTotalSize || defaultQuotas.maxTotalSize || 1024 * 1024 * 1024,
      usage: getTotalSize(),
      icon: '📦',
    },
    {
      key: 'maxConnections',
      label: '🔗 Максимум соединений',
      value: quotas.maxConnections || defaultQuotas.maxConnections || 100,
      usage: usage.listeners,
      icon: '🌐',
    },
    {
      key: 'maxUndoSteps',
      label: '↩️ Максимум Undo',
      value: quotas.maxUndoSteps || defaultQuotas.maxUndoSteps || 50,
      usage: usage.undoSize,
      icon: '⏪',
    },
    {
      key: 'maxTransactionsPerSecond',
      label: '🔄 Транзакций/сек',
      value: quotas.maxTransactionsPerSecond || defaultQuotas.maxTransactionsPerSecond || 100,
      usage: usage.transactions || 0,
      icon: '⚡',
    },
    {
      key: 'maxMemoryUsage',
      label: '🧠 Память (MB)',
      value: quotas.maxMemoryUsage || defaultQuotas.maxMemoryUsage || 512,
      usage: getMemoryUsage(),
      icon: '💾',
    },
    {
      key: 'maxOperationsPerSecond',
      label: '⚡ Операций/сек',
      value: quotas.maxOperationsPerSecond || defaultQuotas.maxOperationsPerSecond || 1000,
      usage: 0,
      icon: '🚀',
    },
  ];

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
  `;

  for (const item of quotaItems) {
    const percentage = item.value > 0 ? Math.min((item.usage / item.value) * 100, 100) : 0;
    const isNearLimit = percentage >= 80;
    const isCritical = percentage >= 95;
    const color = isCritical
      ? 'var(--es-accent-red)'
      : isNearLimit
        ? 'var(--es-accent-yellow)'
        : 'var(--es-accent-green)';

    html += `
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px 10px;border:1px solid ${isCritical ? 'rgba(239,68,68,0.2)' : isNearLimit ? 'rgba(251,191,36,0.2)' : 'var(--es-border-secondary)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
          <span style="font-size:11px;color:var(--es-text-muted);">${item.label}</span>
          <span style="font-size:11px;font-weight:500;color:${color};">
            ${formatUsage(item.usage, item.key)} / ${formatQuota(item.value, item.key)}
          </span>
        </div>
        <div style="width:100%;height:4px;background:var(--es-bg-secondary);border-radius:2px;overflow:hidden;">
          <div style="width:${percentage}%;height:100%;background:${color};border-radius:2px;transition:width 0.3s ease;"></div>
        </div>
        <div style="font-size:9px;color:var(--es-text-dim);margin-top:2px;display:flex;justify-content:space-between;">
          <span>${percentage.toFixed(1)}%</span>
          ${isCritical ? '<span style="color:var(--es-accent-red);">⚠️ Критично!</span>' : isNearLimit ? '<span style="color:var(--es-accent-yellow);">⚠️ Почти лимит</span>' : '<span style="color:var(--es-accent-green);">✅ OK</span>'}
        </div>
      </div>
    `;
  }

  html += `</div>`;

  // Дополнительная информация о квотах
  html += `
    <div style="margin-top:10px;padding:8px 10px;background:var(--es-bg-primary);border-radius:6px;border:1px solid var(--es-border-secondary);">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;font-size:10px;color:var(--es-text-dim);">
        <span>📊 Всего квот: ${quotaItems.length}</span>
        <span>📈 Используется: ${quotaItems.filter(i => i.usage > 0).length}</span>
        <span>⚠️ На пределе: ${quotaItems.filter(i => i.usage / i.value >= 0.8).length}</span>
        <span>🟢 Свободно: ${quotaItems.filter(i => i.usage / i.value < 0.8).length}</span>
      </div>
    </div>
  `;

  return html;
}

// ============================================================
// 4. РЕНДЕРИНГ ИНФОРМАЦИИ О СИСТЕМЕ
// ============================================================

function renderInfoHTML(quotas, state) {
  const health = isFunction(db.healthCheck) ? db.healthCheck() : {};
  const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];
  const tables = isFunction(db.listTables) ? db.listTables() : [];

  // Безопасное получение версии
  const version = state.version || CONFIG.version || '4.0.8';

  // Статистика символов
  const symbolStats = getSymbolStats();

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <!-- Основная информация -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">🏢 Система</div>
        <div style="font-size:12px;color:var(--es-text-muted);line-height:2;">
          <div>🏷️ Название: <span style="color:var(--es-text-secondary);">${CONFIG.name || 'Global Store'}</span></div>
          <div>📦 Версия: <span style="color:var(--es-accent-blue-light);">${version}</span></div>
          <div>📅 Сборка: <span style="color:var(--es-text-secondary);">${CONFIG.build || '2026-07-28'}</span></div>
          <div>🔄 Immer: <span style="color:${CONFIG.immerEnabled ? 'var(--es-accent-green)' : 'var(--es-accent-red)'};">${CONFIG.immerEnabled ? '✅ Включен' : '❌ Выключен'}</span></div>
          <div>🔑 Символ: <span style="color:var(--es-accent-purple);font-family:monospace;font-size:11px;">__GLOBAL_STORE__</span></div>
        </div>
      </div>

      <!-- Статистика хранилища -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">📊 Хранилище</div>
        <div style="font-size:12px;color:var(--es-text-muted);line-height:2;">
          <div>📋 Таблиц: <span style="color:var(--es-text-secondary);">${tables.length}</span></div>
          <div>📝 Записей: <span style="color:var(--es-text-secondary);">${health.records || 0}</span></div>
          <div>🔗 Связей: <span style="color:var(--es-text-secondary);">${state.relations ? state.relations.length : 0}</span></div>
          <div>📡 Подписчиков: <span style="color:var(--es-text-secondary);">${health.listeners || 0}</span></div>
          <div>🔌 Плагинов: <span style="color:var(--es-text-secondary);">${plugins.length}</span></div>
        </div>
      </div>

      <!-- Состояние -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">⏱ Состояние</div>
        <div style="font-size:12px;color:var(--es-text-muted);line-height:2;">
          <div>🟢 Статус: <span style="color:var(--es-accent-green);">${health.ready ? 'Готов' : 'Ошибка'}</span></div>
          <div>⏱ Uptime: <span style="color:var(--es-text-secondary);">${formatUptime(health.uptime || 0)}</span></div>
          <div>↩️ Undo: <span style="color:var(--es-text-secondary);">${state.undoSize || 0}</span></div>
          <div>↪️ Redo: <span style="color:var(--es-text-secondary);">${state.redoSize || 0}</span></div>
          <div>📦 Транзакций: <span style="color:var(--es-text-secondary);">${state.transactions || 0}</span></div>
        </div>
      </div>

      <!-- Символы -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">🔑 Символы</div>
        <div style="font-size:12px;color:var(--es-text-muted);line-height:2;">
          <div>🔒 Приватных: <span style="color:var(--es-accent-blue-light);">${symbolStats.private}</span></div>
          <div>🔓 Публичных: <span style="color:var(--es-accent-green);">${symbolStats.public}</span></div>
          <div>📦 Всего: <span style="color:var(--es-accent-purple);font-weight:600;">${symbolStats.total}</span></div>
          <div>📋 Плагинов: <span style="color:var(--es-text-secondary);">${symbolStats.plugins}</span></div>
          <div>🔑 Доступ: <span style="color:var(--es-accent-green);">${symbolStats.accessible ? '✅' : '❌'}</span></div>
        </div>
      </div>

      <!-- Плагины -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);grid-column:1/-1;">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">🔌 Активные плагины</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${
            plugins.length > 0
              ? plugins
                  .map(
                    name => `
            <span style="background:var(--es-bg-secondary);padding:2px 10px;border-radius:12px;font-size:10px;color:var(--es-text-muted);border:1px solid var(--es-border-primary);">
              🔌 ${escapeHtml(name)}
            </span>
          `
                  )
                  .join('')
              : '<span style="font-size:11px;color:var(--es-text-dim);">Нет активных плагинов</span>'
          }
        </div>
      </div>

      <!-- Таблицы -->
      <div style="background:var(--es-bg-primary);border-radius:6px;padding:10px;border:1px solid var(--es-border-secondary);grid-column:1/-1;">
        <div style="font-size:11px;font-weight:600;color:var(--es-text-secondary);margin-bottom:6px;">📋 Таблицы</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${
            tables.length > 0
              ? tables
                  .map(
                    name => `
            <span style="background:var(--es-bg-secondary);padding:2px 10px;border-radius:12px;font-size:10px;color:var(--es-text-muted);border:1px solid var(--es-border-primary);">
              📊 ${escapeHtml(name)}
            </span>
          `
                  )
                  .join('')
              : '<span style="font-size:11px;color:var(--es-text-dim);">Нет таблиц</span>'
          }
        </div>
      </div>
    </div>

    <!-- Кнопки управления -->
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" id="refreshSettingsBtn">🔄 Обновить</button>
      <button class="btn btn-success btn-sm" id="exportSettingsBtn">📤 Экспорт</button>
      <button class="btn btn-warning btn-sm" id="resetQuotasBtn">🔄 Сбросить квоты</button>
      <button class="btn btn-danger btn-sm" id="clearAllDataBtn">🧹 Очистить все</button>
    </div>
  `;
}

// ============================================================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Форматирование использования квоты
 */
function formatUsage(value, key) {
  if (key === 'maxTotalSize' || key === 'maxMemoryUsage') {
    return formatBytes(value);
  }
  return String(value);
}

/**
 * Форматирование значения квоты
 */
function formatQuota(value, key) {
  if (key === 'maxTotalSize' || key === 'maxMemoryUsage') {
    return formatBytes(value);
  }
  return String(value);
}

/**
 * Форматирование байтов в читаемый вид
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Форматирование времени работы
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}д ${hours % 24}ч ${minutes % 60}м`;
  if (hours > 0) return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
  if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
  return `${seconds}с`;
}

/**
 * Получение размера кэша
 */
function getCacheSize() {
  try {
    if (db.cache && isFunction(db.cache.getCacheStats)) {
      const stats = db.cache.getCacheStats();
      return stats.size || 0;
    }
    if (isFunction(db.getCacheStats)) {
      const stats = db.getCacheStats();
      return stats.size || 0;
    }
  } catch (e) {
    // Игнорируем
  }
  return 0;
}

/**
 * Получение максимального количества записей на таблицу
 */
function getMaxRecordsPerTable() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    let max = 0;
    for (const name of tables) {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      if (table && table.data) {
        max = Math.max(max, table.data.length);
      }
    }
    return max;
  } catch (e) {
    return 0;
  }
}

/**
 * Получение максимального количества полей
 */
function getMaxFields() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    let max = 0;
    for (const name of tables) {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      if (table && table.data && table.data.length > 0) {
        const firstRow = table.data[0];
        if (firstRow && typeof firstRow === 'object') {
          max = Math.max(max, Object.keys(firstRow).length);
        }
      }
    }
    return max;
  } catch (e) {
    return 0;
  }
}

/**
 * Получение общего размера данных
 */
function getTotalSize() {
  try {
    const tables = isFunction(db.listTables) ? db.listTables() : [];
    let total = 0;
    for (const name of tables) {
      const table = isFunction(db.getTable) ? db.getTable(name) : null;
      if (table && table.data) {
        total += JSON.stringify(table.data).length;
      }
    }
    return total;
  } catch (e) {
    return 0;
  }
}

/**
 * Получение использования памяти
 */
function getMemoryUsage() {
  try {
    if (typeof performance !== 'undefined' && performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
    }
  } catch (e) {
    // Игнорируем
  }
  return 0;
}

/**
 * Получение статистики символов
 */
function getSymbolStats() {
  let privateCount = 0;
  let publicCount = 0;
  let pluginCount = 0;
  let accessible = false;

  try {
    if (typeof window !== 'undefined') {
      // Символы приложения
      if (window.__APP_SYMBOLS) {
        const symbols = window.__APP_SYMBOLS;
        privateCount = symbols.PRIVATE ? Object.keys(symbols.PRIVATE).length : 0;
        publicCount = symbols.PUBLIC ? Object.keys(symbols.PUBLIC).length : 0;
      }

      // Плагины
      if (db && isFunction(db.listPlugins)) {
        pluginCount = db.listPlugins().length;
      }

      // Доступность глобального хранилища
      accessible = !!window.__globalStore || !!window[Symbol.for('__GLOBAL_STORE__')];
    }
  } catch (e) {
    // Игнорируем
  }

  return {
    private: privateCount || 0,
    public: publicCount || 0,
    total: privateCount + publicCount || 0,
    plugins: pluginCount || 0,
    accessible: accessible,
  };
}

/**
 * Обновление дополнительной статистики
 */
function updateAdditionalStats() {
  // Обновляем бейджи с количеством символов
  const symbolStats = getSymbolStats();

  // Обновляем все бейджи с символам
  const symbolBadges = document.querySelectorAll('[data-symbols-badge]');
  for (const badge of symbolBadges) {
    badge.textContent = `🔑 ${symbolStats.total}`;
  }

  // Обновляем общее количество символов
  if (DOM.symbolsTotalBadge) {
    DOM.symbolsTotalBadge.textContent = `${symbolStats.total} символов`;
  }
}

// ============================================================
// 6. ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ НАСТРОЕК
// ============================================================

/**
 * Инициализация обработчиков для настроек
 */
export function initSettingsHandlers() {
  // Кнопка обновления
  const refreshBtn = document.getElementById('refreshSettingsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderSettings();
      showAlertInModal('🔄 Обновлено', 'Настройки обновлены', 'success');
    });
  }

  // Кнопка экспорта
  const exportBtn = document.getElementById('exportSettingsBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }

  // Кнопка сброса квот
  const resetBtn = document.getElementById('resetQuotasBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetQuotas);
  }

  // Кнопка очистки всех данных
  const clearBtn = document.getElementById('clearAllDataBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllData);
  }
}

/**
 * Экспорт настроек
 */
function exportSettings() {
  try {
    const quotas = isFunction(db.getQuotas) ? db.getQuotas() : {};
    const state = isFunction(db.getState) ? db.getState() : {};
    const health = isFunction(db.healthCheck) ? db.healthCheck() : {};
    const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];
    const tables = isFunction(db.listTables) ? db.listTables() : [];

    const data = {
      exportedAt: Date.now(),
      version: CONFIG.version,
      build: CONFIG.build,
      system: {
        name: CONFIG.name,
        version: CONFIG.version,
        build: CONFIG.build,
        immerEnabled: CONFIG.immerEnabled,
      },
      quotas: quotas,
      state: {
        tables: tables,
        records: health.records || 0,
        plugins: plugins,
        relations: state.relations ? state.relations.length : 0,
        listeners: health.listeners || 0,
        undoSize: state.undoSize || 0,
        redoSize: state.redoSize || 0,
        transactions: state.transactions || 0,
      },
      health: health,
      symbolStats: getSymbolStats(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showAlertInModal('📤 Экспорт', 'Настройки успешно экспортированы', 'success');
  } catch (error) {
    showAlertInModal('❌ Ошибка', `Не удалось экспортировать настройки: ${error.message}`, 'error');
  }
}

/**
 * Сброс квот к значениям по умолчанию
 */
function resetQuotas() {
  showModal(
    '🔄 Сброс квот',
    `<p style="color:var(--es-text-muted);">Вы уверены, что хотите сбросить все квоты к значениям по умолчанию?</p>
     <p style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">Это действие не влияет на данные, только на лимиты.</p>`,
    () => {
      try {
        if (isFunction(db.resetQuotas)) {
          db.resetQuotas();
        } else if (isFunction(db.setQuotas)) {
          db.setQuotas(CONFIG.defaultQuotas || {});
        } else {
          // Прямое обновление квот через приватный доступ
          if (db._private) {
            const p = db._private.get(db);
            if (p) {
              const quotasSymbol = Symbol('store.quotas');
              p[quotasSymbol] = { ...CONFIG.defaultQuotas };
            }
          }
        }
        renderSettings();
        showAlertInModal('🔄 Сброшено', 'Квоты сброшены к значениям по умолчанию', 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось сбросить квоты: ${error.message}`, 'error');
      }
    },
    () => {
      showAlertInModal('ℹ️ Отменено', 'Сброс квот отменен', 'info');
    }
  );
}

/**
 * Очистка всех данных
 */
function clearAllData() {
  showModal(
    '🧹 Очистка всех данных',
    `<p style="color:var(--es-text-muted);">Вы уверены, что хотите очистить <strong>все данные</strong>?</p>
     <p style="font-size:11px;color:var(--es-accent-red);margin-top:4px;">⚠️ Это действие необратимо!</p>`,
    () => {
      try {
        if (isFunction(db.clear)) {
          db.clear();
        } else if (isFunction(db.listTables)) {
          const tables = db.listTables();
          for (const name of tables) {
            if (isFunction(db.clearTable)) {
              db.clearTable(name);
            }
          }
        }
        renderAll();
        showAlertInModal('🧹 Очищено', 'Все данные успешно очищены', 'success');
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось очистить данные: ${error.message}`, 'error');
      }
    },
    () => {
      showAlertInModal('ℹ️ Отменено', 'Очистка данных отменена', 'info');
    }
  );
}

// ============================================================
// 7. ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Автоматическая инициализация обработчиков при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettingsHandlers);
} else {
  initSettingsHandlers();
}

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};
  window.app.renderSettings = renderSettings;
  window.app.exportSettings = exportSettings;
  window.app.resetQuotas = resetQuotas;
  window.app.getSettingsData = () => ({
    quotas: isFunction(db.getQuotas) ? db.getQuotas() : {},
    state: isFunction(db.getState) ? db.getState() : {},
    health: isFunction(db.healthCheck) ? db.healthCheck() : {},
    symbolStats: getSymbolStats(),
  });
}

// ============================================================
// 8. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderSettings,
  initSettingsHandlers,
  exportSettings,
  resetQuotas,
  clearAllData,
  getSettingsData: () => ({
    quotas: isFunction(db.getQuotas) ? db.getQuotas() : {},
    state: isFunction(db.getState) ? db.getState() : {},
    health: isFunction(db.healthCheck) ? db.healthCheck() : {},
    symbolStats: getSymbolStats(),
  }),
};
