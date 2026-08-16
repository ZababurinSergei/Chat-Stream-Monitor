// ============================================================
// app/render/stats.js — 100% СИМВОЛЫ — рендеринг статистики
// Версия: 4.0.8
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { CONFIG } from '../config.js';
import { PRIVATE } from '../symbols.js';
import { getAppState } from '../state.js';
import { isFunction } from '../utils.js';

// ============================================================
// ПРИВАТНЫЕ СИМВОЛЫ ДЛЯ СТАТИСТИКИ
// ============================================================

const STATS_PRIVATE = {
  CACHE_STATS: Symbol('stats.cacheStats'),
  AUDIT_STATS: Symbol('stats.auditStats'),
  HEALTH_STATE: Symbol('stats.healthState'),
  LAST_UPDATE: Symbol('stats.lastUpdate'),
  UPDATE_INTERVAL: Symbol('stats.updateInterval'),
  UPDATE_TIMER: Symbol('stats.updateTimer'),
};

// ============================================================
// СОСТОЯНИЕ СТАТИСТИКИ
// ============================================================

const STATS_STATE = {
  [STATS_PRIVATE.CACHE_STATS]: null,
  [STATS_PRIVATE.AUDIT_STATS]: null,
  [STATS_PRIVATE.HEALTH_STATE]: null,
  [STATS_PRIVATE.LAST_UPDATE]: null,
  [STATS_PRIVATE.UPDATE_INTERVAL]: CONFIG.refreshInterval || 5000,
  [STATS_PRIVATE.UPDATE_TIMER]: null,
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Безопасное получение статистики кэша
 */
function getCacheStats() {
  try {
    if (db.cache && isFunction(db.cache.getCacheStats)) {
      return db.cache.getCacheStats();
    }
    if (isFunction(db.getCacheStats)) {
      return db.getCacheStats();
    }
    if (db.cache && isFunction(db.cache.stats)) {
      return db.cache.stats();
    }
    return { size: 0, hits: 0, misses: 0 };
  } catch (error) {
    console.warn('⚠️ Ошибка получения статистики кэша:', error);
    return { size: 0, hits: 0, misses: 0 };
  }
}

/**
 * Безопасное получение статистики аудита
 */
function getAuditStats() {
  try {
    if (db.audit && isFunction(db.audit.getAudit)) {
      const audit = db.audit.getAudit({}, 1);
      return { count: audit.length };
    }
    if (isFunction(db.getAudit)) {
      const audit = db.getAudit({}, 1);
      return { count: audit.length };
    }
    if (db.audit && isFunction(db.audit.getStats)) {
      return db.audit.getStats();
    }
    return { count: 0 };
  } catch (error) {
    console.warn('⚠️ Ошибка получения статистики аудита:', error);
    return { count: 0 };
  }
}

/**
 * Получение состояния здоровья
 */
function getHealthState() {
  try {
    if (isFunction(db.healthCheck)) {
      return db.healthCheck();
    }
    if (db && isFunction(db.getState)) {
      const state = db.getState();
      return {
        ready: true,
        records: 0,
        listeners: 0,
        tables: state.tables ? state.tables.length : 0,
      };
    }
    return { ready: false, records: 0, listeners: 0 };
  } catch (error) {
    console.warn('⚠️ Ошибка получения состояния здоровья:', error);
    return { ready: false, records: 0, listeners: 0 };
  }
}

/**
 * Получение состояния хранилища
 */
function getStoreState() {
  try {
    if (isFunction(db.getState)) {
      return db.getState();
    }
    if (db && db._getState) {
      return db._getState();
    }
    return { tables: [], relations: [], undoSize: 0, redoSize: 0 };
  } catch (error) {
    console.warn('⚠️ Ошибка получения состояния хранилища:', error);
    return { tables: [], relations: [], undoSize: 0, redoSize: 0 };
  }
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

export function renderStats() {
  try {
    // Получаем данные
    const state = getStoreState();
    const health = getHealthState();
    const cacheStats = getCacheStats();
    const auditStats = getAuditStats();
    const appState = getAppState();

    // Обновляем DOM элементы
    updateStatsElements(state, health, cacheStats, auditStats, appState);

    // Сохраняем состояние
    STATS_STATE[STATS_PRIVATE.CACHE_STATS] = cacheStats;
    STATS_STATE[STATS_PRIVATE.AUDIT_STATS] = auditStats;
    STATS_STATE[STATS_PRIVATE.HEALTH_STATE] = health;
    STATS_STATE[STATS_PRIVATE.LAST_UPDATE] = Date.now();

    // Обновляем время последнего обновления
    if (appState) {
      appState[PRIVATE.LAST_UPDATE] = Date.now();
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга статистики:', error);
  }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ОБНОВЛЕНИЯ DOM
// ============================================================

function updateStatsElements(state, health, cacheStats, auditStats, appState) {
  // Основные счетчики
  updateElement(DOM.tablesCount, state.tables ? state.tables.length : 0);
  updateElement(DOM.recordsCount, health.records || 0);
  updateElement(DOM.relationsCount, state.relations ? state.relations.length : 0);
  updateElement(DOM.subscribersCount, health.listeners || 0);
  updateElement(DOM.undoCount, state.undoSize || 0);
  updateElement(DOM.redoCount, state.redoSize || 0);

  // Кэш
  updateElement(DOM.cacheCount, cacheStats.size || 0);

  // Аудит
  updateElement(DOM.auditCount, auditStats.count || 0);

  // Версия и статус
  updateVersionAndStatus(state, health);

  // Символы
  updateSymbolsCount(appState);
}

function updateElement(element, value) {
  if (element) {
    element.textContent = typeof value === 'number' ? value : 0;
  }
}

function updateVersionAndStatus(state, health) {
  if (DOM.versionBadge) {
    DOM.versionBadge.textContent = `v${state.version || CONFIG.version}`;
  }

  if (DOM.statusBadge) {
    const isReady = health.ready !== false;
    DOM.statusBadge.textContent = isReady ? '● Готов' : '● Ошибка';
    DOM.statusBadge.className = `badge ${isReady ? 'success' : 'error'}`;
  }
}

function updateSymbolsCount(appState) {
  if (DOM.symbolsInfo) {
    const symbolsCount = Object.keys(PRIVATE).length + Object.keys(CONFIG).length;
    DOM.symbolsInfo.textContent = `🔑 ${symbolsCount} символов`;
  }

  // Обновляем остальные badge с символами
  const symbolsBadges = [
    DOM.inspectorSymbols,
    DOM.brokerSymbols,
    DOM.auditSymbols,
    DOM.schemaSymbols,
    DOM.consoleSymbols,
    DOM.pluginSymbols,
    DOM.quotaSymbols,
    DOM.infoSymbols,
  ];

  const totalSymbols = Object.keys(PRIVATE).length;
  for (const badge of symbolsBadges) {
    if (badge) {
      badge.textContent = `🔑 ${totalSymbols}`;
    }
  }

  if (DOM.symbolsTotalBadge) {
    const total = Object.keys(PRIVATE).length + Object.keys(CONFIG).length;
    DOM.symbolsTotalBadge.textContent = `${total} символов`;
  }
}

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ СТАТИСТИКИ
// ============================================================

/**
 * Получить полную статистику
 */
export function getFullStats() {
  const state = getStoreState();
  const health = getHealthState();
  const cacheStats = getCacheStats();
  const auditStats = getAuditStats();
  const appState = getAppState();

  return {
    store: {
      tables: state.tables ? state.tables.length : 0,
      records: health.records || 0,
      relations: state.relations ? state.relations.length : 0,
      subscribers: health.listeners || 0,
      undo: state.undoSize || 0,
      redo: state.redoSize || 0,
      version: state.version || CONFIG.version,
    },
    cache: {
      size: cacheStats.size || 0,
      hits: cacheStats.hits || 0,
      misses: cacheStats.misses || 0,
    },
    audit: {
      count: auditStats.count || 0,
    },
    app: {
      initialized: appState ? appState[PRIVATE.INITIALIZED] : false,
      destroyed: appState ? appState[PRIVATE.DESTROYED] : false,
      demoLoaded: appState ? appState[PRIVATE.DEMO_LOADED] : false,
      startTime: appState ? appState[PRIVATE.START_TIME] : null,
      lastUpdate: appState ? appState[PRIVATE.LAST_UPDATE] : null,
    },
    symbols: {
      private: Object.keys(PRIVATE).length,
      public: 0,
      total: Object.keys(PRIVATE).length + Object.keys(CONFIG).length,
    },
    health: health,
    timestamp: Date.now(),
  };
}

/**
 * Получить статистику кэша
 */
export function getCacheStatsOnly() {
  return getCacheStats();
}

/**
 * Получить статистику аудита
 */
export function getAuditStatsOnly() {
  return getAuditStats();
}

/**
 * Получить состояние здоровья
 */
export function getHealthCheck() {
  return getHealthState();
}

// ============================================================
// АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ СТАТИСТИКИ
// ============================================================

/**
 * Запустить автоматическое обновление статистики
 */
export function startStatsAutoUpdate(interval = null) {
  const updateInterval = interval || STATS_STATE[STATS_PRIVATE.UPDATE_INTERVAL];

  // Останавливаем предыдущий таймер
  stopStatsAutoUpdate();

  // Запускаем новый таймер
  STATS_STATE[STATS_PRIVATE.UPDATE_TIMER] = setInterval(() => {
    renderStats();
  }, updateInterval);

  // Сохраняем интервал
  STATS_STATE[STATS_PRIVATE.UPDATE_INTERVAL] = updateInterval;

  // Первое обновление сразу
  renderStats();

  console.log(`📊 Авто-обновление статистики запущено (${updateInterval}ms)`);
  return true;
}

/**
 * Остановить автоматическое обновление статистики
 */
export function stopStatsAutoUpdate() {
  if (STATS_STATE[STATS_PRIVATE.UPDATE_TIMER]) {
    clearInterval(STATS_STATE[STATS_PRIVATE.UPDATE_TIMER]);
    STATS_STATE[STATS_PRIVATE.UPDATE_TIMER] = null;
    console.log('📊 Авто-обновление статистики остановлено');
    return true;
  }
  return false;
}

/**
 * Получить статус автоматического обновления
 */
export function getStatsAutoUpdateStatus() {
  return {
    enabled: !!STATS_STATE[STATS_PRIVATE.UPDATE_TIMER],
    interval: STATS_STATE[STATS_PRIVATE.UPDATE_INTERVAL],
    lastUpdate: STATS_STATE[STATS_PRIVATE.LAST_UPDATE],
  };
}

// ============================================================
// ЭКСПОРТ СИМВОЛОВ СТАТИСТИКИ
// ============================================================

export const STATS_SYMBOLS = {
  PRIVATE: STATS_PRIVATE,
  STATE: STATS_STATE,
};

// ============================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderStats,
  getFullStats,
  getCacheStatsOnly,
  getAuditStatsOnly,
  getHealthCheck,
  startStatsAutoUpdate,
  stopStatsAutoUpdate,
  getStatsAutoUpdateStatus,
  STATS_SYMBOLS,
};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ (при загрузке модуля)
// ============================================================

if (CONFIG.autoRefresh) {
  // Запускаем авто-обновление через небольшую задержку
  setTimeout(() => {
    startStatsAutoUpdate(CONFIG.refreshInterval);
  }, 1000);
}
