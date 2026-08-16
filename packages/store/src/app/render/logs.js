// ============================================================
// render/logs.js — 100% СИМВОЛЫ — рендеринг логов
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { CONFIG } from '../config.js';
import { getAppState, setPrivate } from '../state.js';
import { escapeHtml, safeStringify, formatTime } from '../utils.js';
import { showAlertInModal, showModal } from '../modal.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

// Уровни логов с иконками и цветами
const LOG_LEVELS = {
  error: { icon: '❌', color: 'var(--es-accent-red)', label: 'Ошибка' },
  warn: { icon: '⚠️', color: 'var(--es-accent-yellow)', label: 'Предупреждение' },
  info: { icon: 'ℹ️', color: 'var(--es-accent-blue-light)', label: 'Информация' },
  debug: { icon: '🔍', color: 'var(--es-text-muted)', label: 'Отладка' },
  success: { icon: '✅', color: 'var(--es-accent-green)', label: 'Успех' },
  system: { icon: '⚙️', color: 'var(--es-accent-purple)', label: 'Система' },
  security: { icon: '🔒', color: 'var(--es-accent-red)', label: 'Безопасность' },
  performance: { icon: '⚡', color: 'var(--es-accent-yellow)', label: 'Производительность' },
};

// Максимальное количество логов для отображения
const MAX_VISIBLE_LOGS = 500;

// Цвета для различных типов логов (CSS классы)
const LOG_CLASSES = {
  error: 'log-error',
  warn: 'log-warn',
  info: 'log-info',
  debug: 'log-debug',
  success: 'log-success',
  system: 'log-system',
  security: 'log-security',
  performance: 'log-performance',
};

// ============================================================
// 3. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг логов — отображение системных событий
 * 100% символы — полная изоляция
 */
export function renderLogs() {
  try {
    const container = DOM.logContainer;
    const state = getAppState();

    if (!container) {
      console.warn('⚠️ logContainer не найден в DOM');
      return;
    }

    // Проверка: приостановлены ли логи
    const isPaused = state[PRIVATE.IS_LOG_PAUSED] || false;
    const entries = state[PRIVATE.LOG_ENTRIES] || [];

    // Обновляем счетчик логов
    if (DOM.logCount) {
      DOM.logCount.textContent = entries.length;
    }

    // Обновляем бейдж паузы
    updatePauseBadge(isPaused);

    // Если логов нет
    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📭</span>
          Нет событий
          <div style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">
            ${isPaused ? '⏸ Логи приостановлены' : 'Ожидание событий...'}
          </div>
        </div>
      `;
      return;
    }

    // Ограничиваем количество отображаемых логов
    const visibleEntries = entries.slice(0, MAX_VISIBLE_LOGS);

    // Строим HTML
    let html = '';

    // Статистика логов
    html += renderLogStats(entries);

    // Список логов
    html += `<div class="log-entries" style="margin-top:8px;">`;

    for (const entry of visibleEntries) {
      html += renderLogEntry(entry);
    }

    html += `</div>`;

    // Если есть скрытые логи
    if (entries.length > MAX_VISIBLE_LOGS) {
      html += `
        <div style="text-align:center;padding:8px;font-size:11px;color:var(--es-text-dim);border-top:1px solid var(--es-border-secondary);margin-top:4px;">
          Показано ${MAX_VISIBLE_LOGS} из ${entries.length} записей
          <button class="btn btn-secondary btn-xs" id="showAllLogsBtn" style="margin-left:8px;">
            📋 Показать все
          </button>
        </div>
      `;
    }

    container.innerHTML = html;

    // Добавляем обработчики для кнопок
    setupLogButtons(container);

    // Прокручиваем к последнему логу
    container.scrollTop = 0;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга логов:', error);
    const container = DOM.logContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки логов
          <div style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 4. РЕНДЕРИНГ СТАТИСТИКИ ЛОГОВ
// ============================================================

function renderLogStats(entries) {
  // Подсчет логов по уровням
  const stats = {};
  let total = entries.length;

  for (const entry of entries) {
    const level = entry.level || 'info';
    stats[level] = (stats[level] || 0) + 1;
  }

  // Сортируем уровни для отображения
  const levelOrder = [
    'error',
    'warn',
    'success',
    'info',
    'debug',
    'system',
    'security',
    'performance',
  ];

  let statsHtml = `
    <div style="display:flex;flex-wrap:wrap;gap:6px;padding:6px 8px;background:var(--es-bg-primary);border-radius:6px;border:1px solid var(--es-border-secondary);">
      <span style="font-size:11px;color:var(--es-text-muted);font-weight:500;">📊 Статистика:</span>
  `;

  for (const level of levelOrder) {
    const count = stats[level] || 0;
    if (count > 0) {
      const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.info;
      statsHtml += `
        <span style="font-size:10px;color:${levelInfo.color};background:var(--es-bg-secondary);padding:1px 8px;border-radius:10px;border:1px solid ${levelInfo.color}33;">
          ${levelInfo.icon} ${count}
        </span>
      `;
    }
  }

  statsHtml += `
      <span style="font-size:10px;color:var(--es-text-dim);margin-left:auto;">
        Всего: ${total}
      </span>
    </div>
  `;

  return statsHtml;
}

// ============================================================
// 5. РЕНДЕРИНГ ОДНОЙ ЗАПИСИ ЛОГА
// ============================================================

function renderLogEntry(entry) {
  const level = entry.level || 'info';
  const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.info;
  const logClass = LOG_CLASSES[level] || 'log-info';

  const timestamp = entry.timestamp || formatTime(entry.id) || new Date().toLocaleTimeString();
  const message = entry.message || 'Без сообщения';
  const detail = entry.detail || null;

  // Форматирование деталей
  let detailHtml = '';
  if (detail !== null && detail !== undefined) {
    if (typeof detail === 'object') {
      detailHtml = `
        <div class="log-detail" style="font-size:10px;color:var(--es-text-dim);margin-top:2px;font-family:monospace;background:var(--es-bg-primary);padding:4px 6px;border-radius:4px;border:1px solid var(--es-border-secondary);overflow-x:auto;">
          ${escapeHtml(safeStringify(detail, 200))}
        </div>
      `;
    } else {
      detailHtml = `
        <div class="log-detail" style="font-size:10px;color:var(--es-text-dim);margin-top:2px;">
          ${escapeHtml(String(detail))}
        </div>
      `;
    }
  }

  // Вычисляем время относительно текущего момента
  const timeAgo = getTimeAgo(entry.id || entry.timestamp || Date.now());

  return `
    <div class="log-entry ${logClass}" style="
      display:flex;
      flex-direction:column;
      padding:4px 8px;
      border-bottom:1px solid var(--es-border-secondary);
      font-size:12px;
      font-family:var(--es-font-mono, monospace);
      transition:background 0.15s ease;
      cursor:default;
    " data-level="${level}" data-id="${entry.id || ''}">
      <div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;">
        <span class="log-time" style="color:var(--es-text-dim);font-size:11px;white-space:nowrap;">
          [${timestamp}]
        </span>
        <span class="log-icon" style="color:${levelInfo.color};">
          ${levelInfo.icon}
        </span>
        <span class="log-level" style="
          font-size:10px;
          font-weight:600;
          color:${levelInfo.color};
          background:${levelInfo.color}22;
          padding:0 6px;
          border-radius:3px;
          text-transform:uppercase;
          letter-spacing:0.3px;
        ">
          ${levelInfo.label}
        </span>
        <span class="log-message" style="color:var(--es-text-secondary);word-break:break-word;flex:1;">
          ${escapeHtml(message)}
        </span>
        <span class="log-time-ago" style="font-size:10px;color:var(--es-text-dim);white-space:nowrap;">
          ${timeAgo}
        </span>
      </div>
      ${detailHtml}
    </div>
  `;
}

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение относительного времени
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return 'только что';

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return 'только что';
  if (diff < 60000) return `${Math.floor(diff / 1000)}с назад`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}м назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч назад`;
  return `${Math.floor(diff / 86400000)}д назад`;
}

/**
 * Обновление бейджа паузы
 */
function updatePauseBadge(isPaused) {
  const pauseBtn = DOM.pauseLogsBtn;
  if (!pauseBtn) return;

  if (isPaused) {
    pauseBtn.textContent = '▶️ Возобновить';
    pauseBtn.classList.add('btn-warning');
    pauseBtn.classList.remove('btn-secondary');
  } else {
    pauseBtn.textContent = '⏸ Пауза';
    pauseBtn.classList.remove('btn-warning');
    pauseBtn.classList.add('btn-secondary');
  }
}

/**
 * Настройка кнопок в контейнере логов
 */
function setupLogButtons(container) {
  // Кнопка "Показать все"
  const showAllBtn = container.querySelector('#showAllLogsBtn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      showAllLogs();
    });
  }

  // Клик по записи лога для копирования
  const logEntries = container.querySelectorAll('.log-entry');
  for (const entry of logEntries) {
    entry.addEventListener('click', e => {
      // Игнорируем клики по кнопкам внутри
      if (e.target.closest('button')) return;

      // Копируем содержимое лога
      const message = entry.querySelector('.log-message')?.textContent || '';
      const time = entry.querySelector('.log-time')?.textContent || '';
      const level = entry.dataset.level || 'info';
      const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.info;

      const text = `${time} ${levelInfo.icon} ${message}`;
      copyToClipboard(text);

      // Визуальный отклик
      entry.style.background = 'var(--es-bg-hover)';
      setTimeout(() => {
        entry.style.background = '';
      }, 300);
    });

    // Подсказка при наведении
    entry.title = 'Кликните для копирования';
  }
}

/**
 * Копирование текста в буфер обмена
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showAlertInModal('📋 Скопировано', 'Лог скопирован в буфер обмена', 'success');
      })
      .catch(() => {
        // Fallback
        fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
}

/**
 * Fallback копирование
 */
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showAlertInModal('📋 Скопировано', 'Лог скопирован в буфер обмена', 'success');
  } catch (err) {
    showAlertInModal('⚠️ Ошибка', 'Не удалось скопировать лог', 'warning');
  }
  document.body.removeChild(textarea);
}

// ============================================================
// 7. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Показать все логи (без ограничения)
 */
export function showAllLogs() {
  const state = getAppState();
  const entries = state[PRIVATE.LOG_ENTRIES] || [];

  if (entries.length === 0) {
    showAlertInModal('📭 Пусто', 'Нет записей в логах', 'info');
    return;
  }

  // Создаем модальное окно со всеми логами
  let html = `
    <div style="max-height:400px;overflow-y:auto;font-family:monospace;font-size:11px;">
  `;

  for (const entry of entries) {
    const level = entry.level || 'info';
    const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.info;
    const timestamp = entry.timestamp || new Date().toLocaleTimeString();
    const message = entry.message || '';

    html += `
      <div style="padding:2px 4px;border-bottom:1px solid var(--es-border-secondary);color:${levelInfo.color};">
        <span style="color:var(--es-text-dim);">[${timestamp}]</span>
        ${levelInfo.icon}
        ${escapeHtml(message)}
      </div>
    `;
  }

  html += `</div>`;

  showModal(
    `📋 Все логи (${entries.length} записей)`,
    html,
    () => {},
    () => {}
  );
}

/**
 * Очистка логов
 */
export function clearLogs() {
  const state = getAppState();

  if (state[PRIVATE.LOG_ENTRIES].length === 0) {
    showAlertInModal('📭 Пусто', 'Логи уже пусты', 'info');
    return;
  }

  showModal(
    '🧹 Очистка логов',
    `<p style="color:var(--es-text-muted);">Вы уверены, что хотите очистить <strong>все логи</strong>?</p>
     <p style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">Будет удалено ${state[PRIVATE.LOG_ENTRIES].length} записей.</p>`,
    () => {
      state[PRIVATE.LOG_ENTRIES] = [];
      renderLogs();
      showAlertInModal('🧹 Очищено', 'Логи успешно очищены', 'success');
    },
    () => {
      showAlertInModal('ℹ️ Отменено', 'Очистка логов отменена', 'info');
    }
  );
}

/**
 * Переключение паузы логов
 */
export function toggleLogPause() {
  const state = getAppState();
  const isPaused = state[PRIVATE.IS_LOG_PAUSED] || false;

  state[PRIVATE.IS_LOG_PAUSED] = !isPaused;

  if (state[PRIVATE.IS_LOG_PAUSED]) {
    showAlertInModal(
      '⏸ Пауза',
      'Логи приостановлены. Новые события не будут отображаться.',
      'warning'
    );
  } else {
    showAlertInModal('▶️ Возобновлено', 'Логи возобновлены', 'success');
  }

  renderLogs();
}

/**
 * Экспорт логов в файл
 */
export function exportLogs() {
  const state = getAppState();
  const entries = state[PRIVATE.LOG_ENTRIES] || [];

  if (entries.length === 0) {
    showAlertInModal('📭 Пусто', 'Нет записей для экспорта', 'info');
    return;
  }

  // Форматируем логи для экспорта
  const exportData = {
    exportedAt: Date.now(),
    version: CONFIG.version,
    build: CONFIG.build,
    total: entries.length,
    logs: entries.map(entry => ({
      timestamp: entry.timestamp,
      level: entry.level || 'info',
      message: entry.message,
      detail: entry.detail || null,
      id: entry.id,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showAlertInModal('📤 Экспорт', `Экспортировано ${entries.length} записей`, 'success');
}

/**
 * Фильтрация логов по уровню
 */
export function filterLogs(level) {
  const state = getAppState();
  const entries = state[PRIVATE.LOG_ENTRIES] || [];

  if (!level) {
    renderLogs();
    return;
  }

  const filtered = entries.filter(entry => (entry.level || 'info') === level);

  if (filtered.length === 0) {
    showAlertInModal('📭 Пусто', `Нет логов уровня "${level}"`, 'info');
    return;
  }

  // Временно сохраняем фильтрованные логи
  const originalEntries = state[PRIVATE.LOG_ENTRIES];
  state[PRIVATE.LOG_ENTRIES] = filtered;
  renderLogs();
  // Восстанавливаем после рендеринга
  state[PRIVATE.LOG_ENTRIES] = originalEntries;

  showAlertInModal('🔍 Фильтр', `Показано ${filtered.length} записей уровня "${level}"`, 'info');
}

// ============================================================
// 8. ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
// ============================================================

/**
 * Инициализация обработчиков для логов
 */
export function initLogHandlers() {
  // Кнопка очистки логов
  const clearBtn = DOM.clearLogsBtn;
  if (clearBtn) {
    clearBtn.addEventListener('click', clearLogs);
  }

  // Кнопка паузы логов
  const pauseBtn = DOM.pauseLogsBtn;
  if (pauseBtn) {
    pauseBtn.addEventListener('click', toggleLogPause);
  }

  // Кнопка экспорта логов (добавляем в UI)
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary btn-xs';
  exportBtn.textContent = '📤 Экспорт';
  exportBtn.addEventListener('click', exportLogs);

  const headerActions =
    document.querySelector('.panel-header .btn-group') ||
    document.querySelector('.panel-header div:last-child');
  if (headerActions) {
    headerActions.appendChild(exportBtn);
  }

  // Горячие клавиши
  document.addEventListener('keydown', e => {
    // Ctrl+Shift+L — очистить логи
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      clearLogs();
    }

    // Ctrl+Shift+P — пауза логов
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      toggleLogPause();
    }
  });
}

// ============================================================
// 9. ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.renderLogs = renderLogs;
  window.app.clearLogs = clearLogs;
  window.app.toggleLogPause = toggleLogPause;
  window.app.exportLogs = exportLogs;
  window.app.filterLogs = filterLogs;
  window.app.showAllLogs = showAllLogs;

  window.app.getLogStats = () => {
    const state = getAppState();
    const entries = state[PRIVATE.LOG_ENTRIES] || [];
    const stats = {};

    for (const entry of entries) {
      const level = entry.level || 'info';
      stats[level] = (stats[level] || 0) + 1;
    }

    return {
      total: entries.length,
      byLevel: stats,
      isPaused: state[PRIVATE.IS_LOG_PAUSED] || false,
    };
  };

  console.log('📋 Команды для логов:');
  console.log('  window.app.renderLogs() — обновить логи');
  console.log('  window.app.clearLogs() — очистить логи');
  console.log('  window.app.toggleLogPause() — пауза/возобновление');
  console.log('  window.app.exportLogs() — экспорт логов');
  console.log('  window.app.filterLogs(level) — фильтр по уровню');
  console.log('  window.app.getLogStats() — статистика логов');
}

// ============================================================
// 10. АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Инициализация обработчиков при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLogHandlers();
    // Первоначальный рендеринг
    setTimeout(renderLogs, 100);
  });
} else {
  initLogHandlers();
  setTimeout(renderLogs, 100);
}

// ============================================================
// 11. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderLogs,
  clearLogs,
  toggleLogPause,
  exportLogs,
  filterLogs,
  showAllLogs,
  initLogHandlers,
  getLogStats: () => {
    const state = getAppState();
    const entries = state[PRIVATE.LOG_ENTRIES] || [];
    const stats = {};

    for (const entry of entries) {
      const level = entry.level || 'info';
      stats[level] = (stats[level] || 0) + 1;
    }

    return {
      total: entries.length,
      byLevel: stats,
      isPaused: state[PRIVATE.IS_LOG_PAUSED] || false,
    };
  },
};
