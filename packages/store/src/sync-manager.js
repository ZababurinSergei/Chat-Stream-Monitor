// ============================================================
// sync-manager.js — 100% СИМВОЛЫ — управление синхронизацией данных
// Версия: 1.0.1 (с подключением глобального логгера)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

// ★★★ ПОДКЛЮЧАЕМ ГЛОБАЛЬНЫЙ ЛОГГЕР ★★★
import {
  getGlobalLogger,
  logInfo,
  logError,
  logSuccess,
  logDebug,
  logWarn,
  addLog,
} from './logger.mjs';

// ============================================================
// 2. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  VERSION: Symbol('sync.version'),
  BUILD: Symbol('sync.build'),
  STORE: Symbol('sync.store'),
  STATE: Symbol('sync.state'),
  SUBSCRIPTIONS: Symbol('sync.subscriptions'),
  INITIALIZED: Symbol('sync.initialized'),
  DESTROYED: Symbol('sync.destroyed'),
  SYNC_INTERVAL: Symbol('sync.interval'),
  SYNC_TIMER: Symbol('sync.timer'),
  LAST_SYNC: Symbol('sync.lastSync'),
  SYNC_COUNT: Symbol('sync.count'),
  LOGGER: Symbol('sync.logger'),
  APP_STATE: Symbol('sync.appState'),
  APP_PRIVATE: Symbol('sync.appPrivate'),
  IS_SYNCING: Symbol('sync.isSyncing'),
  SYNC_QUEUE: Symbol('sync.queue'),
  TABLE_MAP: Symbol('sync.tableMap'),
};

// ============================================================
// 3. СОСТОЯНИЕ
// ============================================================

const STATE = {
  [PRIVATE.INITIALIZED]: false,
  [PRIVATE.DESTROYED]: false,
  [PRIVATE.SUBSCRIPTIONS]: [],
  [PRIVATE.SYNC_INTERVAL]: 5000,
  [PRIVATE.SYNC_TIMER]: null,
  [PRIVATE.LAST_SYNC]: null,
  [PRIVATE.SYNC_COUNT]: 0,
  [PRIVATE.LOGGER]: null,
  [PRIVATE.APP_STATE]: null,
  [PRIVATE.APP_PRIVATE]: null,
  [PRIVATE.IS_SYNCING]: false,
  [PRIVATE.SYNC_QUEUE]: [],
  [PRIVATE.TABLE_MAP]: {
    projects: 'PROJECTS',
    tasks: 'TASKS',
    users: 'USERS',
  },
};

// ============================================================
// 4. ПОЛУЧЕНИЕ ГЛОБАЛЬНОГО ХРАНИЛИЩА
// ============================================================

function getGlobalStore() {
  // Приоритет 1: через window.__GLOBAL_STORE__
  if (typeof window !== 'undefined' && window.__GLOBAL_STORE__) {
    return window.__GLOBAL_STORE__;
  }

  // Приоритет 2: через Symbol
  if (typeof window !== 'undefined') {
    const symbol = Symbol.for('__GLOBAL_STORE__');
    if (window[symbol]) {
      return window[symbol];
    }
  }

  // Приоритет 3: через window.__db
  if (typeof window !== 'undefined' && window.__db) {
    return window.__db;
  }

  // Приоритет 4: через window.getGlobalStore
  if (typeof window !== 'undefined' && typeof window.getGlobalStore === 'function') {
    return window.getGlobalStore();
  }

  logError('❌ Глобальное хранилище не найдено', null, 'system');
  return null;
}

// ============================================================
// 5. ПОЛУЧЕНИЕ СОСТОЯНИЯ ПРИЛОЖЕНИЯ
// ============================================================

function getAppState() {
  if (typeof window !== 'undefined' && window.__app && window.__app.state) {
    return window.__app.state;
  }
  return null;
}

function getAppPrivate() {
  if (typeof window !== 'undefined' && window.__app && window.__app.PRIVATE_APP) {
    return window.__app.PRIVATE_APP;
  }
  return null;
}

// ============================================================
// 6. ОСНОВНОЙ МЕНЕДЖЕР СИНХРОНИЗАЦИИ
// ============================================================

export const SyncManager = {
  name: 'sync-manager',
  version: '1.0.1',

  // ============================================================
  // 6.1. ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  init(options = {}) {
    if (STATE[PRIVATE.INITIALIZED]) {
      logWarn('⚠️ SyncManager уже инициализирован', null, 'system');
      return this;
    }

    // ★★★ ПОЛУЧАЕМ ГЛОБАЛЬНЫЙ ЛОГГЕР ★★★
    STATE[PRIVATE.LOGGER] = getGlobalLogger();

    logInfo('🚀 Инициализация SyncManager...', null, 'system');

    const store = getGlobalStore();
    if (!store) {
      logError('❌ Не удалось получить глобальное хранилище', null, 'system');
      return this;
    }

    STATE[PRIVATE.STORE] = store;
    STATE[PRIVATE.APP_STATE] = getAppState();
    STATE[PRIVATE.APP_PRIVATE] = getAppPrivate();
    STATE[PRIVATE.INITIALIZED] = true;
    STATE[PRIVATE.SYNC_INTERVAL] = options.interval || 5000;

    logSuccess('✅ SyncManager инициализирован', null, 'system');

    // ★★★ НАСТРАИВАЕМ ПОДПИСКИ НА ИЗМЕНЕНИЯ ★★★
    this.setupSubscriptions();

    // ★★★ ЗАПУСКАЕМ АВТО-СИНХРОНИЗАЦИЮ ★★★
    if (options.autoSync !== false) {
      this.startAutoSync();
    }

    // ★★★ ПЕРВАЯ СИНХРОНИЗАЦИЯ ★★★
    this.syncAll();

    return this;
  },

  // ============================================================
  // 6.2. НАСТРОЙКА ПОДПИСОК
  // ============================================================

  setupSubscriptions() {
    const store = STATE[PRIVATE.STORE];
    if (!store) {
      logError('❌ Хранилище не доступно для подписок', null, 'system');
      return;
    }

    if (typeof store.on !== 'function') {
      logError('❌ store.on не доступен', null, 'system');
      return;
    }

    logInfo('📡 Настройка подписок на изменения...', null, 'system');

    // ★★★ ПОДПИСКА НА ИЗМЕНЕНИЯ В ТАБЛИЦАХ ★★★
    const tables = ['projects', 'tasks', 'users'];

    for (const table of tables) {
      try {
        // Подписываемся на вставку
        const unsubInsert = store.on(`data:inserted:${table}`, (data) => {
          logDebug(`📨 data:inserted:${table}`, { count: data?.rows?.length || 0 }, 'events');
          this.syncTable(table);
        });
        STATE[PRIVATE.SUBSCRIPTIONS].push(unsubInsert);

        // Подписываемся на обновление
        const unsubUpdate = store.on(`data:updated:${table}`, (data) => {
          logDebug(`📨 data:updated:${table}`, { count: data?.updated?.length || 0 }, 'events');
          this.syncTable(table);
        });
        STATE[PRIVATE.SUBSCRIPTIONS].push(unsubUpdate);

        // Подписываемся на удаление
        const unsubDelete = store.on(`data:deleted:${table}`, (data) => {
          logDebug(`📨 data:deleted:${table}`, { count: data?.deleted?.length || 0 }, 'events');
          this.syncTable(table);
        });
        STATE[PRIVATE.SUBSCRIPTIONS].push(unsubDelete);

        logDebug(`✅ Подписка на ${table} создана`, null, 'system');
      } catch (error) {
        logError(`❌ Ошибка подписки на ${table}:`, error, 'system');
      }
    }

    // ★★★ ПОДПИСКА НА ВЫБОР МАСТЕРА ★★★
    try {
      const unsubMaster = store.on('master:selected', (data) => {
        logDebug('📨 master:selected', { master: data?.master, id: data?.id }, 'events');
        this.onMasterSelected(data);
      });
      STATE[PRIVATE.SUBSCRIPTIONS].push(unsubMaster);
      logDebug('✅ Подписка на master:selected создана', null, 'system');
    } catch (error) {
      logError('❌ Ошибка подписки на master:selected:', error, 'system');
    }

    // ★★★ ПОДПИСКА НА ДАННЫЕ: ОБНОВЛЕНЫ ★★★
    try {
      const unsubDataUpdated = store.on('data:updated', (data) => {
        logDebug('📨 data:updated', { table: data?.table, count: data?.count }, 'events');
        if (data?.table) {
          this.syncTable(data.table);
        }
      });
      STATE[PRIVATE.SUBSCRIPTIONS].push(unsubDataUpdated);
      logDebug('✅ Подписка на data:updated создана', null, 'system');
    } catch (error) {
      logError('❌ Ошибка подписки на data:updated:', error, 'system');
    }

    logSuccess(`✅ Настроено ${STATE[PRIVATE.SUBSCRIPTIONS].length} подписок`, null, 'system');
  },

  // ============================================================
  // 6.3. ОБРАБОТКА ВЫБОРА МАСТЕРА
  // ============================================================

  onMasterSelected(data) {
    const store = STATE[PRIVATE.STORE];
    if (!store) return;

    const { master, id } = data || {};
    if (!master || !id) return;

    logInfo(`🎯 Мастер выбран: ${master}[${id}]`, null, 'app');

    // ★★★ ПОЛУЧАЕМ ДЕТАЛИ ЧЕРЕЗ ВСТРОЕННЫЙ МЕХАНИЗМ ★★★
    try {
      // Если есть метод getDetails — используем его
      if (typeof store.getDetails === 'function') {
        const details = store.getDetails(master);
        logDebug(
          '📊 Детали получены через getDetails',
          {
            master,
            details: Object.keys(details || {}),
          },
          'app'
        );

        // ★★★ ОБНОВЛЯЕМ ЛОКАЛЬНЫЕ ДАННЫЕ ★★★
        this.updateAppState(master, details);

        // ★★★ ОТПРАВЛЯЕМ СОБЫТИЕ ★★★
        this.emit('master-detail-updated', {
          master,
          id,
          details,
        });

        logSuccess(
          `✅ Master-Detail обновлен: ${master}[${id}]`,
          {
            detailsCount: Object.keys(details || {}).length,
          },
          'app'
        );
      } else {
        // ★★★ FALLBACK: РУЧНОЕ ПОЛУЧЕНИЕ ДЕТАЛЕЙ ★★★
        logDebug('⚠️ getDetails не доступен, используем ручной поиск', null, 'app');
        this.syncAll();
      }
    } catch (error) {
      logError('❌ Ошибка обработки выбора мастера:', error, 'app');
    }
  },

  // ============================================================
  // 6.4. ОБНОВЛЕНИЕ СОСТОЯНИЯ ПРИЛОЖЕНИЯ
  // ============================================================

  updateAppState(master, details) {
    const appState = STATE[PRIVATE.APP_STATE];
    const appPrivate = STATE[PRIVATE.APP_PRIVATE];

    if (!appState || !appPrivate) {
      logWarn('⚠️ Состояние приложения не доступно', null, 'app');
      return;
    }

    // ★★★ ОБНОВЛЯЕМ ПРОЕКТЫ ★★★
    if (master === 'projects' && details.tasks) {
      appState[appPrivate.TASKS] = details.tasks;
      appState[appPrivate.LAST_UPDATE] = Date.now();
      logInfo(
        `📊 Обновлено ${details.tasks.length} задач через Master-Detail`,
        {
          master,
          count: details.tasks.length,
        },
        'app'
      );
    }

    // ★★★ ОБНОВЛЯЕМ ЗАДАЧИ ★★★
    if (master === 'tasks' && details.users) {
      appState[appPrivate.USERS] = details.users;
      appState[appPrivate.LAST_UPDATE] = Date.now();
      logInfo(
        `📊 Обновлено ${details.users.length} пользователей через Master-Detail`,
        {
          master,
          count: details.users.length,
        },
        'app'
      );
    }

    // ★★★ ОБНОВЛЯЕМ ПОЛЬЗОВАТЕЛЕЙ ★★★
    if (master === 'users' && details.tasks) {
      appState[appPrivate.TASKS] = details.tasks;
      appState[appPrivate.LAST_UPDATE] = Date.now();
      logInfo(
        `📊 Обновлено ${details.tasks.length} задач через Master-Detail`,
        {
          master,
          count: details.tasks.length,
        },
        'app'
      );
    }

    // ★★★ ПЕРЕРЕНДЕРИНГ ★★★
    if (
      typeof window !== 'undefined' &&
      window.__app &&
      typeof window.__app.render === 'function'
    ) {
      window.__app.render();
      logDebug('🔄 UI обновлен после Master-Detail', null, 'app');
    }
  },

  // ============================================================
  // 6.5. СИНХРОНИЗАЦИЯ ВСЕХ ДАННЫХ
  // ============================================================

  syncAll() {
    if (STATE[PRIVATE.IS_SYNCING]) {
      logDebug('⏳ Синхронизация уже выполняется, пропускаем', null, 'system');
      return false;
    }

    const store = STATE[PRIVATE.STORE];
    if (!store) {
      logError('❌ Хранилище не доступно', null, 'system');
      return false;
    }

    STATE[PRIVATE.IS_SYNCING] = true;

    try {
      logInfo('🔄 Полная синхронизация данных...', null, 'system');

      const tables = ['projects', 'tasks', 'users'];
      let totalRecords = 0;
      const tableStats = {};

      for (const tableName of tables) {
        const table = store.getTable?.(tableName);
        if (table && table.data) {
          const count = table.data.length;
          totalRecords += count;
          tableStats[tableName] = count;
          logDebug(`📊 ${tableName}: ${count} записей`, null, 'system');
        } else {
          tableStats[tableName] = 0;
        }
      }

      STATE[PRIVATE.LAST_SYNC] = Date.now();
      STATE[PRIVATE.SYNC_COUNT]++;

      logSuccess(
        `✅ Синхронизация завершена: ${totalRecords} записей`,
        {
          tableStats,
          totalRecords,
          syncCount: STATE[PRIVATE.SYNC_COUNT],
        },
        'system'
      );

      // ★★★ ОБНОВЛЯЕМ UI ★★★
      this.emit('sync-complete', {
        timestamp: STATE[PRIVATE.LAST_SYNC],
        count: STATE[PRIVATE.SYNC_COUNT],
        totalRecords,
        tableStats,
      });

      return true;
    } catch (error) {
      logError('❌ Ошибка синхронизации:', error, 'system');
      return false;
    } finally {
      STATE[PRIVATE.IS_SYNCING] = false;
    }
  },

  // ============================================================
  // 6.6. СИНХРОНИЗАЦИЯ КОНКРЕТНОЙ ТАБЛИЦЫ
  // ============================================================

  syncTable(tableName) {
    const store = STATE[PRIVATE.STORE];
    if (!store) return false;

    try {
      const table = store.getTable?.(tableName);
      if (!table) return false;

      const count = table.data?.length || 0;
      logDebug(`🔄 Синхронизация ${tableName}: ${count} записей`, null, 'system');

      // ★★★ ОБНОВЛЯЕМ ЛОКАЛЬНОЕ СОСТОЯНИЕ ★★★
      const appState = STATE[PRIVATE.APP_STATE];
      const appPrivate = STATE[PRIVATE.APP_PRIVATE];

      if (appState && appPrivate) {
        const stateKey = {
          projects: appPrivate.PROJECTS,
          tasks: appPrivate.TASKS,
          users: appPrivate.USERS,
        }[tableName];

        if (stateKey) {
          appState[stateKey] = table.data;
          appState[appPrivate.LAST_UPDATE] = Date.now();
          logDebug(`✅ ${tableName} обновлена в UI (${count} записей)`, null, 'app');
        }
      }

      this.emit(`sync:${tableName}`, {
        table: tableName,
        count,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      logError(`❌ Ошибка синхронизации ${tableName}:`, error, 'system');
      return false;
    }
  },

  // ============================================================
  // 6.7. АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ
  // ============================================================

  startAutoSync() {
    if (STATE[PRIVATE.SYNC_TIMER]) {
      logWarn('⚠️ Авто-синхронизация уже запущена', null, 'system');
      return;
    }

    const interval = STATE[PRIVATE.SYNC_INTERVAL];
    logInfo(`🔄 Запуск авто-синхронизации (${interval}ms)`, null, 'system');

    STATE[PRIVATE.SYNC_TIMER] = setInterval(() => {
      if (!STATE[PRIVATE.DESTROYED]) {
        this.syncAll();
      }
    }, interval);
  },

  stopAutoSync() {
    if (STATE[PRIVATE.SYNC_TIMER]) {
      clearInterval(STATE[PRIVATE.SYNC_TIMER]);
      STATE[PRIVATE.SYNC_TIMER] = null;
      logInfo('⏹ Авто-синхронизация остановлена', null, 'system');
    }
  },

  // ============================================================
  // 6.8. СОБЫТИЯ
  // ============================================================

  emit(event, data) {
    // Используем CustomEvent для браузера
    if (typeof window !== 'undefined') {
      try {
        const customEvent = new CustomEvent(`sync:${event}`, {
          detail: data,
        });
        window.dispatchEvent(customEvent);
      } catch (error) {
        // Игнорируем ошибки
      }
    }

    // ★★★ ДЛЯ ОТЛАДКИ ★★★
    logDebug(`📨 Событие: sync:${event}`, data, 'events');
  },

  // ============================================================
  // 6.9. ПОДПИСКА НА СОБЫТИЯ
  // ============================================================

  on(event, callback) {
    if (typeof window === 'undefined') return;

    const handler = (e) => {
      try {
        callback(e.detail);
      } catch (error) {
        logError(`❌ Ошибка в обработчике sync:${event}:`, error, 'events');
      }
    };

    window.addEventListener(`sync:${event}`, handler);

    // Возвращаем функцию отписки
    return () => {
      window.removeEventListener(`sync:${event}`, handler);
    };
  },

  // ============================================================
  // 6.10. ПОЛУЧЕНИЕ СОСТОЯНИЯ
  // ============================================================

  getState() {
    const store = STATE[PRIVATE.STORE];
    const tables = store?.getTable ? {} : {};

    if (store && typeof store.getTable === 'function') {
      for (const name of ['projects', 'tasks', 'users']) {
        const table = store.getTable(name);
        tables[name] = {
          count: table?.data?.length || 0,
          exists: !!table,
        };
      }
    }

    const appState = STATE[PRIVATE.APP_STATE];
    const appPrivate = STATE[PRIVATE.APP_PRIVATE];

    return {
      initialized: STATE[PRIVATE.INITIALIZED],
      destroyed: STATE[PRIVATE.DESTROYED],
      lastSync: STATE[PRIVATE.LAST_SYNC],
      syncCount: STATE[PRIVATE.SYNC_COUNT],
      interval: STATE[PRIVATE.SYNC_INTERVAL],
      subscriptions: STATE[PRIVATE.SUBSCRIPTIONS].length,
      isSyncing: STATE[PRIVATE.IS_SYNCING],
      tables,
      appState: appState
        ? {
            projects: appState[appPrivate?.PROJECTS]?.length || 0,
            tasks: appState[appPrivate?.TASKS]?.length || 0,
            users: appState[appPrivate?.USERS]?.length || 0,
            lastUpdate: appState[appPrivate?.LAST_UPDATE] || null,
          }
        : null,
      version: this.version,
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 6.11. ПРОВЕРКА ЦЕЛОСТНОСТИ
  // ============================================================

  healthCheck() {
    const issues = [];
    let healthy = true;

    // Проверка состояния
    if (!STATE[PRIVATE.INITIALIZED]) {
      healthy = false;
      issues.push('SyncManager не инициализирован');
    }

    if (STATE[PRIVATE.DESTROYED]) {
      healthy = false;
      issues.push('SyncManager уничтожен');
    }

    // Проверка хранилища
    const store = STATE[PRIVATE.STORE];
    if (!store) {
      healthy = false;
      issues.push('Хранилище не доступно');
    }

    // Проверка подписок
    const subscriptions = STATE[PRIVATE.SUBSCRIPTIONS] || [];
    if (subscriptions.length === 0 && STATE[PRIVATE.INITIALIZED]) {
      issues.push('Нет активных подписок');
    }

    // Проверка состояния приложения
    const appState = STATE[PRIVATE.APP_STATE];
    const appPrivate = STATE[PRIVATE.APP_PRIVATE];
    if (!appState || !appPrivate) {
      issues.push('Состояние приложения не доступно');
    }

    return {
      healthy,
      issues,
      initialized: STATE[PRIVATE.INITIALIZED],
      destroyed: STATE[PRIVATE.DESTROYED],
      subscriptions: subscriptions.length,
      lastSync: STATE[PRIVATE.LAST_SYNC],
      syncCount: STATE[PRIVATE.SYNC_COUNT],
      version: this.version,
      timestamp: Date.now(),
    };
  },

  // ============================================================
  // 6.12. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy() {
    if (STATE[PRIVATE.DESTROYED]) {
      logWarn('⚠️ SyncManager уже уничтожен', null, 'system');
      return;
    }

    logInfo('🧹 Уничтожение SyncManager...', null, 'system');

    // Останавливаем авто-синхронизацию
    this.stopAutoSync();

    // Отписываемся от событий
    for (const unsub of STATE[PRIVATE.SUBSCRIPTIONS]) {
      try {
        if (typeof unsub === 'function') {
          unsub();
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    }
    STATE[PRIVATE.SUBSCRIPTIONS] = [];

    STATE[PRIVATE.DESTROYED] = true;
    STATE[PRIVATE.INITIALIZED] = false;
    STATE[PRIVATE.STORE] = null;
    STATE[PRIVATE.APP_STATE] = null;
    STATE[PRIVATE.APP_PRIVATE] = null;
    STATE[PRIVATE.LOGGER] = null;

    logSuccess('✅ SyncManager уничтожен', null, 'system');
  },
};

// ============================================================
// 7. АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================

// Инициализируем при загрузке
if (typeof window !== 'undefined') {
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        SyncManager.init({ autoSync: true });
      }, 500);
    });
  } else {
    setTimeout(() => {
      SyncManager.init({ autoSync: true });
    }, 500);
  }

  // ★★★ ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ★★★
  window.__syncManager = SyncManager;

  // ★★★ ПОДПИСКА НА master:selected (через DOM) ★★★
  document.addEventListener('master:selected', (e) => {
    const data = e.detail;
    if (data && data.master === 'projects') {
      logDebug('📨 master:selected (через DOM)', data, 'events');
      // Принудительно обновляем задачи
      setTimeout(() => {
        const store = getGlobalStore();
        if (store && typeof store.getDetails === 'function') {
          const details = store.getDetails('projects');
          if (details && details.tasks) {
            SyncManager.updateAppState('projects', details);
          }
        }
      }, 50);
    }
  });

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔄 SYNC MANAGER (100% СИМВОЛЫ) v1.0.1                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ КОМАНДЫ:                                                      ║');
  console.log('║    window.__syncManager.init() — инициализация                              ║');
  console.log('║    window.__syncManager.syncAll() — полная синхронизация                    ║');
  console.log('║    window.__syncManager.syncTable(name) — синхронизация таблицы              ║');
  console.log('║    window.__syncManager.getState() — состояние                              ║');
  console.log('║    window.__syncManager.healthCheck() — проверка целостности                ║');
  console.log('║    window.__syncManager.on(event, callback) — подписка на события           ║');
  console.log('║    window.__syncManager.destroy() — уничтожение                             ║');
  console.log('║                                                                               ║');
  console.log('║  📋 ПРИМЕРЫ:                                                               ║');
  console.log('║    __syncManager.on("master-detail-updated", (data) => {                    ║');
  console.log('║      console.log("Детали:", data.details);                                 ║');
  console.log('║    });                                                                      ║');
  console.log('║    __syncManager.healthCheck() — проверка состояния                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // ★★★ ПРОВЕРЯЕМ, ЧТО __GLOBAL_STORE__ ЕСТЬ ★★★
  const store = getGlobalStore();
  if (store) {
    console.log('✅ __GLOBAL_STORE__ доступен');
    if (typeof store.getDetails === 'function') {
      console.log('✅ store.getDetails доступен');
    } else {
      console.log('⚠️ store.getDetails НЕ ДОСТУПЕН, используется fallback');
    }
  } else {
    console.log('❌ __GLOBAL_STORE__ НЕ ДОСТУПЕН');
  }

  // ★★★ ПРОВЕРЯЕМ СОСТОЯНИЕ ПРИЛОЖЕНИЯ ★★★
  const appState = getAppState();
  const appPrivate = getAppPrivate();
  if (appState && appPrivate) {
    console.log('✅ Состояние приложения доступно');
  } else {
    console.log('⚠️ Состояние приложения не доступно');
  }

  console.log('');
  console.log('📋 ИСПОЛЬЗУЕТСЯ ГЛОБАЛЬНЫЙ ЛОГГЕР (logger.mjs)');
  console.log('   ✅ logInfo, logError, logSuccess, logDebug, logWarn');
}

// ============================================================
// 8. ЭКСПОРТЫ
// ============================================================

export default SyncManager;

// ============================================================
// 9. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;

  console.log('📊 SYNC MANAGER SYMBOLS STATS:');
  console.log(`  🔑 Приватных символов: ${privateCount}`);
  console.log(`  📦 Всего символов: ${privateCount}`);
  console.log(`  📋 Версия: 1.0.1`);
  console.log(`  📚 Использует глобальный логгер: ✅`);
}

// ============================================================
// 10. КОНЕЦ ФАЙЛА
// ============================================================
