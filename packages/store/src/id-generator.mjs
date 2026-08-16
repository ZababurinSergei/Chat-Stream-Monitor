// ============================================================
// id-generator.mjs — 100% СИМВОЛЫ — генератор ID
// Версия: 1.0.2 (БЕЗ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ — СТАБИЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  COUNTER: Symbol('id-generator.counter'),
  START_TIME: Symbol('id-generator.startTime'),
  HISTORY: Symbol('id-generator.history'),
  MAX_HISTORY: Symbol('id-generator.maxHistory'),
  INSTANCE_ID: Symbol('id-generator.instanceId'),
  PREFIXES: Symbol('id-generator.prefixes'),
  DEBUG: Symbol('id-generator.debug'),
  LAST_ID: Symbol('id-generator.lastId'),
  ID_MAP: Symbol('id-generator.idMap'),
  STATS: Symbol('id-generator.stats'),
  SILENT: Symbol('id-generator.silent'),
  GENERATION_COUNT: Symbol('id-generator.generationCount'),
  PREFIX_COUNTERS: Symbol('id-generator.prefixCounters'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('id-generator.instance'),
  STATE: Symbol.for('id-generator.state'),
  GENERATE: Symbol.for('id-generator.generate'),
  GET_STATE: Symbol.for('id-generator.getState'),
  CLEAR_HISTORY: Symbol.for('id-generator.clearHistory'),
  GET_HISTORY: Symbol.for('id-generator.getHistory'),
  GET_STATS: Symbol.for('id-generator.getStats'),
  RESET: Symbol.for('id-generator.reset'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '1.0.2',
  build: '2026-07-30',
  name: 'ID Generator',
  debug: false,
  maxHistory: 1000,
  defaultPrefix: 'op',
  maxPrefixLength: 50,
  allowedChars: /^[a-zA-Z0-9_-]+$/,
  silentByDefault: true,
};

// ============================================================
// 4. СОСТОЯНИЕ ГЕНЕРАТОРА
// ============================================================

const STATE = {
  [PRIVATE.COUNTER]: 0,
  [PRIVATE.START_TIME]: Date.now(),
  [PRIVATE.HISTORY]: [],
  [PRIVATE.MAX_HISTORY]: CONFIG.maxHistory,
  [PRIVATE.INSTANCE_ID]: `id-gen-${Date.now().toString(36)}`,
  [PRIVATE.PREFIXES]: new Map(),
  [PRIVATE.DEBUG]: CONFIG.debug,
  [PRIVATE.LAST_ID]: null,
  [PRIVATE.ID_MAP]: new Map(),
  [PRIVATE.STATS]: {
    totalGenerated: 0,
    byPrefix: {},
    byContext: {},
    errors: 0,
    lastGenerated: null,
    generationTime: 0,
  },
  [PRIVATE.SILENT]: CONFIG.silentByDefault,
  [PRIVATE.GENERATION_COUNT]: 0,
  [PRIVATE.PREFIX_COUNTERS]: new Map(),
};

// ============================================================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Валидация префикса
 */
function validatePrefix(prefix) {
  if (!prefix || typeof prefix !== 'string') {
    return { valid: false, error: 'Префикс должен быть строкой' };
  }
  if (prefix.length === 0) {
    return { valid: false, error: 'Префикс не может быть пустым' };
  }
  if (prefix.length > CONFIG.maxPrefixLength) {
    return {
      valid: false,
      error: `Префикс не может быть длиннее ${CONFIG.maxPrefixLength} символов`,
    };
  }
  if (!CONFIG.allowedChars.test(prefix)) {
    return { valid: false, error: 'Префикс содержит недопустимые символы' };
  }
  return { valid: true };
}

/**
 * Обновление статистики
 */
function updateStats(prefix, context, generationTime) {
  const stats = STATE[PRIVATE.STATS];
  stats.totalGenerated++;
  stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;
  if (context) {
    stats.byContext[context] = (stats.byContext[context] || 0) + 1;
  }
  stats.lastGenerated = Date.now();
  stats.generationTime += generationTime;

  // Обновляем счетчик префикса
  const prefixCounters = STATE[PRIVATE.PREFIX_COUNTERS];
  prefixCounters.set(prefix, (prefixCounters.get(prefix) || 0) + 1);
}

/**
 * ★★★ БЕЗОПАСНОЕ ЛОГИРОВАНИЕ — НЕ ВЫЗЫВАЕТ ДРУГИЕ МОДУЛИ ★★★
 */
function safeLog(message, data = null) {
  if (STATE[PRIVATE.SILENT]) return;
  if (STATE[PRIVATE.DEBUG]) {
    if (data) {
      console.log(`🔑 [ID] ${message}`, data);
    } else {
      console.log(`🔑 [ID] ${message}`);
    }
  }
}

/**
 * ★★★ БЕЗОПАСНОЕ ЛОГИРОВАНИЕ ОШИБОК — ВСЕГДА В КОНСОЛЬ ★★★
 */
function safeError(message, data = null) {
  if (data) {
    console.error(`❌ [ID] ${message}`, data);
  } else {
    console.error(`❌ [ID] ${message}`);
  }
}

// ============================================================
// 6. ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ID
// ============================================================

/**
 * Генерирует уникальный ID с префиксом
 * @param {string} prefix - Префикс для ID (по умолчанию 'op')
 * @param {Object} options - Дополнительные опции
 * @param {boolean} options.track - Сохранять ли в историю (по умолчанию true)
 * @param {string} options.context - Контекст для отладки
 * @param {boolean} options.silent - Отключить логи (по умолчанию true)
 * @param {boolean} options.debug - Дополнительный вывод в консоль
 * @returns {string} Уникальный ID
 */
export function generateId(prefix = CONFIG.defaultPrefix, options = {}) {
  const { track = true, context = null, silent = true, debug = false } = options;

  const startTime = performance.now();

  // Валидация префикса
  const validation = validatePrefix(prefix);
  if (!validation.valid) {
    safeError(`Ошибка валидации префикса: ${validation.error}`, {
      prefix,
      error: validation.error,
    });
    STATE[PRIVATE.STATS].errors++;
    prefix = CONFIG.defaultPrefix;
  }

  // Увеличиваем счетчик
  STATE[PRIVATE.COUNTER]++;
  STATE[PRIVATE.GENERATION_COUNT]++;

  // Формируем ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  const counter = STATE[PRIVATE.COUNTER];
  const id = `${prefix}_${timestamp}_${counter}_${random}`;

  // Сохраняем последний ID
  STATE[PRIVATE.LAST_ID] = id;

  // Сохраняем в ID map
  STATE[PRIVATE.ID_MAP].set(id, {
    prefix,
    timestamp,
    counter,
    context,
    created: new Date().toISOString(),
    generationTime: 0,
  });

  // Обновляем статистику
  const endTime = performance.now();
  const generationTime = endTime - startTime;
  updateStats(prefix, context, generationTime);

  // Сохраняем в историю
  if (track) {
    const entry = {
      id,
      prefix,
      timestamp,
      counter,
      context: context || null,
      created: new Date().toISOString(),
      generationTime,
    };

    STATE[PRIVATE.HISTORY].push(entry);

    // Ограничиваем историю
    if (STATE[PRIVATE.HISTORY].length > STATE[PRIVATE.MAX_HISTORY]) {
      STATE[PRIVATE.HISTORY].shift();
    }
  }

  // ★★★ ЛОГИРУЕМ ТОЛЬКО ЕСЛИ НЕ silent И ВКЛЮЧЕН DEBUG ★★★
  const shouldLog =
    (!silent && (STATE[PRIVATE.DEBUG] || debug)) ||
    (!STATE[PRIVATE.SILENT] && STATE[PRIVATE.DEBUG]);
  if (shouldLog) {
    safeLog(`✅ Сгенерирован: ${id}`, {
      id,
      prefix,
      context,
      counter,
      timestamp,
      generationTime: generationTime.toFixed(2) + 'ms',
    });
  }

  return id;
}

// ============================================================
// 7. СПЕЦИАЛИЗИРОВАННЫЕ ФУНКЦИИ ГЕНЕРАЦИИ (С silent=true ПО УМОЛЧАНИЮ)
// ============================================================

/**
 * Генерирует ID для события
 */
export function generateEventId(eventName, options = {}) {
  const cleanName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return generateId(`event_${cleanName}`, {
    ...options,
    context: `event:${cleanName}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * Генерирует ID для операции
 */
export function generateOperationId(operationName, options = {}) {
  const cleanName = operationName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return generateId(`op_${cleanName}`, {
    ...options,
    context: `operation:${cleanName}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * Генерирует ID для таблицы
 */
export function generateTableId(tableName, action = 'update', options = {}) {
  const cleanName = tableName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const cleanAction = action.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
  return generateId(`table_${cleanName}_${cleanAction}`, {
    ...options,
    context: `table:${cleanName}:${cleanAction}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * Генерирует ID для запроса
 */
export function generateRequestId(endpoint, options = {}) {
  const cleanEndpoint = endpoint.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return generateId(`req_${cleanEndpoint}`, {
    ...options,
    context: `request:${cleanEndpoint}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * Генерирует ID для компонента
 */
export function generateComponentId(componentName, options = {}) {
  const cleanName = componentName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return generateId(`cmp_${cleanName}`, {
    ...options,
    context: `component:${cleanName}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * Генерирует ID для действия
 */
export function generateActionId(actionName, options = {}) {
  const cleanName = actionName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return generateId(`action_${cleanName}`, {
    ...options,
    context: `action:${cleanName}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

/**
 * ★★★ Генерирует ID для view (специально для таблиц) ★★★
 */
export function generateViewId(viewName, options = {}) {
  const cleanName = viewName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  return generateId(`view_${cleanName}`, {
    ...options,
    context: `view:${cleanName}`,
    silent: options.silent !== undefined ? options.silent : true,
  });
}

// ============================================================
// 8. ФУНКЦИИ ДЛЯ РАБОТЫ С ИСТОРИЕЙ
// ============================================================

/**
 * Получить историю ID
 */
export function getIdHistory(limit = 20, prefix = null) {
  let history = STATE[PRIVATE.HISTORY];
  if (prefix) {
    history = history.filter((entry) => entry.prefix === prefix);
  }
  return history.slice(-Math.min(limit, history.length));
}

/**
 * Получить информацию об ID
 */
export function getIdInfo(id) {
  return STATE[PRIVATE.ID_MAP].get(id) || null;
}

/**
 * Получить последний ID по префиксу
 */
export function getLastIdByPrefix(prefix) {
  const history = STATE[PRIVATE.HISTORY];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].prefix === prefix) {
      return history[i].id;
    }
  }
  return null;
}

/**
 * Получить все ID по префиксу
 */
export function getIdsByPrefix(prefix, limit = 50) {
  const history = STATE[PRIVATE.HISTORY];
  const result = [];
  for (let i = history.length - 1; i >= 0 && result.length < limit; i--) {
    if (history[i].prefix === prefix) {
      result.push(history[i]);
    }
  }
  return result;
}

/**
 * Очистить историю
 */
export function clearIdHistory(prefix = null) {
  if (prefix) {
    STATE[PRIVATE.HISTORY] = STATE[PRIVATE.HISTORY].filter((entry) => entry.prefix !== prefix);
    for (const [id, info] of STATE[PRIVATE.ID_MAP]) {
      if (info.prefix === prefix) {
        STATE[PRIVATE.ID_MAP].delete(id);
      }
    }
  } else {
    STATE[PRIVATE.HISTORY] = [];
    STATE[PRIVATE.ID_MAP].clear();
  }
  return true;
}

// ============================================================
// 9. ФУНКЦИИ ДЛЯ СТАТИСТИКИ
// ============================================================

/**
 * Получить состояние генератора
 */
export function getGeneratorState() {
  const stats = STATE[PRIVATE.STATS];
  return {
    counter: STATE[PRIVATE.COUNTER],
    startTime: STATE[PRIVATE.START_TIME],
    historySize: STATE[PRIVATE.HISTORY].length,
    maxHistory: STATE[PRIVATE.MAX_HISTORY],
    instanceId: STATE[PRIVATE.INSTANCE_ID],
    debug: STATE[PRIVATE.DEBUG],
    silent: STATE[PRIVATE.SILENT],
    uptime: Date.now() - STATE[PRIVATE.START_TIME],
    prefixes: Array.from(STATE[PRIVATE.PREFIXES].keys()),
    lastId: STATE[PRIVATE.LAST_ID],
    idMapSize: STATE[PRIVATE.ID_MAP].size,
    generationCount: STATE[PRIVATE.GENERATION_COUNT],
    stats: { ...stats },
    prefixCounters: Object.fromEntries(STATE[PRIVATE.PREFIX_COUNTERS]),
  };
}

/**
 * Получить статистику по префиксам
 */
export function getPrefixStats() {
  const stats = {};
  for (const entry of STATE[PRIVATE.HISTORY]) {
    const prefix = entry.prefix;
    stats[prefix] = (stats[prefix] || 0) + 1;
  }
  return stats;
}

/**
 * Получить статистику по контекстам
 */
export function getContextStats() {
  const stats = {};
  for (const entry of STATE[PRIVATE.HISTORY]) {
    if (entry.context) {
      stats[entry.context] = (stats[entry.context] || 0) + 1;
    }
  }
  return stats;
}

/**
 * Получить полную статистику
 */
export function getFullStats() {
  const stats = STATE[PRIVATE.STATS];
  return {
    ...stats,
    historySize: STATE[PRIVATE.HISTORY].length,
    idMapSize: STATE[PRIVATE.ID_MAP].size,
    prefixes: Object.keys(getPrefixStats()),
    contexts: Object.keys(getContextStats()),
    uptime: Date.now() - STATE[PRIVATE.START_TIME],
    instanceId: STATE[PRIVATE.INSTANCE_ID],
    lastId: STATE[PRIVATE.LAST_ID],
    generationCount: STATE[PRIVATE.GENERATION_COUNT],
    averageGenerationTime:
      stats.totalGenerated > 0
        ? (stats.generationTime / stats.totalGenerated).toFixed(2) + 'ms'
        : '0ms',
    prefixCounters: Object.fromEntries(STATE[PRIVATE.PREFIX_COUNTERS]),
  };
}

/**
 * Сбросить статистику
 */
export function resetStats() {
  STATE[PRIVATE.STATS] = {
    totalGenerated: 0,
    byPrefix: {},
    byContext: {},
    errors: 0,
    lastGenerated: null,
    generationTime: 0,
  };
  STATE[PRIVATE.COUNTER] = 0;
  STATE[PRIVATE.LAST_ID] = null;
  STATE[PRIVATE.PREFIX_COUNTERS].clear();
  return true;
}

/**
 * Полный сброс генератора
 */
export function resetGenerator() {
  STATE[PRIVATE.COUNTER] = 0;
  STATE[PRIVATE.HISTORY] = [];
  STATE[PRIVATE.ID_MAP].clear();
  STATE[PRIVATE.LAST_ID] = null;
  STATE[PRIVATE.PREFIX_COUNTERS].clear();
  STATE[PRIVATE.STATS] = {
    totalGenerated: 0,
    byPrefix: {},
    byContext: {},
    errors: 0,
    lastGenerated: null,
    generationTime: 0,
  };
  STATE[PRIVATE.GENERATION_COUNT] = 0;
  return true;
}

// ============================================================
// 10. УПРАВЛЕНИЕ ЛОГИРОВАНИЕМ
// ============================================================

/**
 * Включить/выключить отладку
 */
export function setIdDebug(enabled) {
  STATE[PRIVATE.DEBUG] = enabled;
  return enabled;
}

/**
 * Включить/выключить тихий режим (без логов)
 */
export function setIdSilent(silent) {
  STATE[PRIVATE.SILENT] = silent;
  return silent;
}

/**
 * Проверить, включена ли отладка
 */
export function isIdDebug() {
  return STATE[PRIVATE.DEBUG];
}

/**
 * Проверить, включен ли тихий режим
 */
export function isIdSilent() {
  return STATE[PRIVATE.SILENT];
}

// ============================================================
// 11. ЭКСПОРТ СИМВОЛОВ
// ============================================================

export function exportSymbols() {
  if (typeof window !== 'undefined') {
    window.__ID_GENERATOR_SYMBOLS = {
      PRIVATE: { ...PRIVATE },
      PUBLIC: { ...PUBLIC },
      CONFIG: { ...CONFIG },
    };

    window.__idGenerator = {
      generate: generateId,
      generateEventId,
      generateOperationId,
      generateTableId,
      generateRequestId,
      generateComponentId,
      generateActionId,
      generateViewId,
      getHistory: getIdHistory,
      getState: getGeneratorState,
      getFullStats,
      clearHistory: clearIdHistory,
      getLastIdByPrefix,
      getIdsByPrefix,
      getIdInfo,
      getPrefixStats,
      getContextStats,
      resetStats,
      reset: resetGenerator,
      setDebug: setIdDebug,
      setSilent: setIdSilent,
      isDebug: isIdDebug,
      isSilent: isIdSilent,
      exportSymbols,
      PRIVATE,
      PUBLIC,
      CONFIG,
    };

    const privateCount = Object.keys(PRIVATE).length;
    const publicCount = Object.keys(PUBLIC).length;
    const totalCount = privateCount + publicCount;

    console.log('📊 ID GENERATOR SYMBOLS STATS:');
    console.log(`  🔑 Приватных символов: ${privateCount}`);
    console.log(`  🔓 Публичных символов: ${publicCount}`);
    console.log(`  📦 Всего символов: ${totalCount}`);
    console.log(`  🔇 Логи: ${STATE[PRIVATE.SILENT] ? 'ВЫКЛ' : 'ВКЛ'}`);
    console.log(`  🔍 Отладка: ${STATE[PRIVATE.DEBUG] ? 'ВКЛ' : 'ВЫКЛ'}`);
  }
}

// Автоматический экспорт символов при загрузке
if (typeof window !== 'undefined') {
  exportSymbols();
}

// ============================================================
// 12. ЭКСПОРТЫ
// ============================================================

export default {
  // Основные функции
  generateId,
  generateEventId,
  generateOperationId,
  generateTableId,
  generateRequestId,
  generateComponentId,
  generateActionId,
  generateViewId,

  // История
  getIdHistory,
  getIdInfo,
  getLastIdByPrefix,
  getIdsByPrefix,
  clearIdHistory,

  // Статистика
  getGeneratorState,
  getPrefixStats,
  getContextStats,
  getFullStats,
  resetStats,
  resetGenerator,

  // Управление логами
  setIdDebug,
  setIdSilent,
  isIdDebug,
  isIdSilent,

  // Символы
  exportSymbols,
  PRIVATE,
  PUBLIC,
  CONFIG,
};

// ============================================================
// 13. СТАТИСТИКА ПРИ ЗАГРУЗКЕ (БЕЗ ЦИКЛИЧЕСКИХ ВЫЗОВОВ)
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;
  const totalCount = privateCount + publicCount;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔑 ID GENERATOR (100% СИМВОЛЫ) v1.0.2                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║`);
  console.log(
    `║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║    📦 Всего символов: ${totalCount.toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  ★★★ НОВОЕ В v1.0.2 ★★★                                                    ║');
  console.log('║    ✅ generateViewId() — специально для viewId таблиц                        ║');
  console.log('║    ✅ Улучшенная статистика — время генерации                                ║');
  console.log('║    ✅ prefixCounters — счетчики по префиксам                                 ║');
  console.log('║    ✅ generationCount — общее количество сгенерированных ID                  ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  ★★★ ИСПРАВЛЕНИЯ ★★★                                                       ║');
  console.log('║    ✅ Убраны циклические зависимости с логгером                             ║');
  console.log('║    ✅ silent=true по умолчанию — нет спама в консоль                        ║');
  console.log('║    ✅ БЕЗОПАСНО — не вызывает другие модули                                 ║');
  console.log('║    ✅ Все логи только через console.log (без внешних зависимостей)          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ ФУНКЦИИ:                                                     ║');
  console.log('║    ✅ generateId(prefix, options) — генерация ID                             ║');
  console.log('║    ✅ generateEventId(name) — ID для события                                 ║');
  console.log('║    ✅ generateOperationId(name) — ID для операции                            ║');
  console.log('║    ✅ generateTableId(table, action) — ID для таблицы                        ║');
  console.log('║    ✅ generateRequestId(endpoint) — ID для запроса                           ║');
  console.log('║    ✅ generateComponentId(name) — ID для компонента                          ║');
  console.log('║    ✅ generateActionId(name) — ID для действия                               ║');
  console.log('║    ✅ generateViewId(name) — ID для view (таблицы) ★★★                      ║');
  console.log('║    ✅ getIdHistory(limit, prefix) — история ID                               ║');
  console.log('║    ✅ getGeneratorState() — состояние генератора                             ║');
  console.log('║    ✅ getFullStats() — полная статистика                                    ║');
  console.log('║    ✅ setIdDebug(enabled) — включить/выключить отладку                      ║');
  console.log('║    ✅ setIdSilent(silent) — включить/выключить логи                         ║');
  console.log('║    ✅ resetGenerator() — полный сброс                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 14. КОНЕЦ ФАЙЛА
// ============================================================
