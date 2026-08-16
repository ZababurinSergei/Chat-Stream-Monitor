// ============================================================
// app/symbols.js — 100% СИМВОЛЫ — полная изоляция
// Версия: 4.0.8 (МОДУЛЬНАЯ — ИСПРАВЛЕНА)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (только внутри приложения)
// ============================================================

export const PRIVATE = {
  // ==========================================================
  // 1.1. ОСНОВНЫЕ СИМВОЛЫ ПРИЛОЖЕНИЯ
  // ==========================================================

  VERSION: Symbol('app.version'),
  BUILD: Symbol('app.build'),
  NAME: Symbol('app.name'),
  CONFIG: Symbol('app.config'),
  STATE: Symbol('app.state'),
  INITIALIZED: Symbol('app.initialized'),
  DESTROYED: Symbol('app.destroyed'),
  START_TIME: Symbol('app.startTime'),
  LAST_UPDATE: Symbol('app.lastUpdate'),
  WELCOME_SHOWN: Symbol('app.welcomeShown'),

  // ==========================================================
  // 1.2. СОСТОЯНИЕ UI (★ ИСПРАВЛЕНО ★)
  // ==========================================================

  SELECTED_TABLE: Symbol('app.selectedTable'),
  SELECTED_ROW: Symbol('app.selectedRow'),
  ACTIVE_TAB: Symbol('app.activeTab'),
  IS_LOG_PAUSED: Symbol('app.isLogPaused'),
  LOG_ENTRIES: Symbol('app.logEntries'),
  MAX_LOG: Symbol('app.maxLog'),

  // ★★★ НОВЫЕ СИМВОЛЫ ДЛЯ INFOENERGO-APP ★★★
  SELECTED_PROJECT: Symbol('app.selectedProject'),
  SELECTED_TASK: Symbol('app.selectedTask'),
  SELECTED_USER: Symbol('app.selectedUser'),
  PROJECTS: Symbol('app.projects'),
  TASKS: Symbol('app.tasks'),
  USERS: Symbol('app.users'),
  FILTERS: Symbol('app.filters'),
  API_BASE: Symbol('app.apiBase'),
  API_ENDPOINTS: Symbol('app.apiEndpoints'),
  LOADING: Symbol('app.loading'),
  FILTER_SUBSCRIBERS: Symbol('app.filterSubscribers'),

  // ==========================================================
  // 1.3. МОДАЛЬНОЕ ОКНО
  // ==========================================================

  MODAL_CALLBACK: Symbol('app.modalCallback'),
  MODAL_DATA: Symbol('app.modalData'),
  MODAL_ACTIVE: Symbol('app.modalActive'),

  // ==========================================================
  // 1.4. СООБЩЕНИЯ БРОКЕРА
  // ==========================================================

  MESSAGES: Symbol('app.messages'),
  SUBSCRIPTIONS: Symbol('app.subscriptions'),
  MESSAGE_COUNT: Symbol('app.messageCount'),

  // ==========================================================
  // 1.5. DOM РЕФЕРЕНСЫ
  // ==========================================================

  DOM: Symbol('app.dom'),
  REFS: Symbol('app.refs'),

  // ==========================================================
  // 1.6. ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ
  // ==========================================================

  GLOBAL_STORE: Symbol('app.globalStore'),
  GLOBAL_STORE_READY: Symbol('app.globalStoreReady'),

  // ==========================================================
  // 1.7. МЕТОДЫ РЕНДЕРИНГА
  // ==========================================================

  RENDER: Symbol('app.render'),
  RENDER_STATS: Symbol('app.renderStats'),
  RENDER_TABLES: Symbol('app.renderTables'),
  RENDER_DATA: Symbol('app.renderData'),
  RENDER_INSPECTOR: Symbol('app.renderInspector'),
  RENDER_RELATIONS: Symbol('app.renderRelations'),
  RENDER_SUBSCRIPTIONS: Symbol('app.renderSubscriptions'),
  RENDER_MESSAGES: Symbol('app.renderMessages'),
  RENDER_AUDIT: Symbol('app.renderAudit'),
  RENDER_SCHEMAS: Symbol('app.renderSchemas'),
  RENDER_PLUGINS: Symbol('app.renderPlugins'),
  RENDER_SETTINGS: Symbol('app.renderSettings'),
  RENDER_ALL: Symbol('app.renderAll'),
  RENDER_LOG: Symbol('app.renderLog'),

  // ==========================================================
  // 1.8. МЕТОДЫ МОДАЛЬНОГО ОКНА
  // ==========================================================

  SHOW_MODAL: Symbol('app.showModal'),
  CLOSE_MODAL: Symbol('app.closeModal'),
  SETUP_MODAL: Symbol('app.setupModal'),
  SHOW_ALERT: Symbol('app.showAlert'),

  // ==========================================================
  // 1.9. МЕТОДЫ УПРАВЛЕНИЯ ТАБЛИЦАМИ
  // ==========================================================

  SELECT_TABLE: Symbol('app.selectTable'),
  ADD_ROW: Symbol('app.addRow'),
  CREATE_TABLE: Symbol('app.createTable'),
  CREATE_TABLE_WITH_SCHEMA: Symbol('app.createTableWithSchema'),
  LINK_TABLES: Symbol('app.linkTables'),
  UNLINK_TABLES: Symbol('app.unlinkTables'),
  DROP_TABLE: Symbol('app.dropTable'),
  CLEAR_TABLE: Symbol('app.clearTable'),

  // ==========================================================
  // 1.10. МЕТОДЫ БРОКЕРА
  // ==========================================================

  PUBLISH_MESSAGE: Symbol('app.publishMessage'),
  ADD_SUBSCRIPTION: Symbol('app.addSubscription'),
  CLEAR_MESSAGES: Symbol('app.clearMessages'),
  GET_MESSAGES: Symbol('app.getMessages'),
  GET_SUBSCRIPTIONS: Symbol('app.getSubscriptions'),

  // ==========================================================
  // 1.11. МЕТОДЫ КОНСОЛИ
  // ==========================================================

  EXECUTE_COMMAND: Symbol('app.executeCommand'),
  CLEAR_CONSOLE: Symbol('app.clearConsole'),
  GET_CONSOLE_HISTORY: Symbol('app.getConsoleHistory'),

  // ==========================================================
  // 1.12. МЕТОДЫ ЭКСПОРТА
  // ==========================================================

  EXPORT_DATA: Symbol('app.exportData'),
  EXPORT_AUDIT: Symbol('app.exportAudit'),
  EXPORT_SYMBOLS: Symbol('app.exportSymbols'),
  EXPORT_STATE: Symbol('app.exportState'),

  // ==========================================================
  // 1.13. МЕТОДЫ ДЕМО-ДАННЫХ
  // ==========================================================

  INIT_DEMO: Symbol('app.initDemo'),
  DEMO_LOADED: Symbol('app.demoLoaded'),
  DEMO_DATA: Symbol('app.demoData'),

  // ==========================================================
  // 1.14. УТИЛИТЫ
  // ==========================================================

  ESCAPE_HTML: Symbol('app.escapeHtml'),
  FORMAT_JSON: Symbol('app.formatJson'),
  FORMAT_TIME: Symbol('app.formatTime'),
  GET_DOM: Symbol('app.getDom'),
  IS_FUNCTION: Symbol('app.isFunction'),
  IS_OBJECT: Symbol('app.isObject'),
  SAFE_CALL: Symbol('app.safeCall'),
  SAFE_STRINGIFY: Symbol('app.safeStringify'),
  DEEP_CLONE: Symbol('app.deepClone'),
  GENERATE_ID: Symbol('app.generateId'),

  // ==========================================================
  // 1.15. БЕЗОПАСНОСТЬ
  // ==========================================================

  VALIDATE: Symbol('app.validate'),
  SANITIZE: Symbol('app.sanitize'),
  SECURE: Symbol('app.secure'),
  CHECK_CONTEXT: Symbol('app.checkContext'),
  ENCRYPT: Symbol('app.encrypt'),
  DECRYPT: Symbol('app.decrypt'),

  // ==========================================================
  // 1.16. ЛОГГЕР
  // ==========================================================

  LOGGER: Symbol('app.logger'),
  LOG: Symbol('app.log'),
  DEBUG: Symbol('app.debug'),
  ERROR: Symbol('app.error'),
  WARN: Symbol('app.warn'),
  SUCCESS: Symbol('app.success'),
  INFO: Symbol('app.info'),

  // ==========================================================
  // 1.17. НАСТРОЙКИ
  // ==========================================================

  SETTINGS: Symbol('app.settings'),
  AUTO_SAVE: Symbol('app.autoSave'),
  AUTO_REFRESH: Symbol('app.autoRefresh'),
  REFRESH_INTERVAL: Symbol('app.refreshInterval'),
  REFRESH_TIMER: Symbol('app.refreshTimer'),

  // ==========================================================
  // 1.18. КЭШ
  // ==========================================================

  CACHE: Symbol('app.cache'),
  CACHE_SIZE: Symbol('app.cacheSize'),
  CACHE_HITS: Symbol('app.cacheHits'),
  CACHE_MISSES: Symbol('app.cacheMisses'),

  // ==========================================================
  // 1.19. АУДИТ
  // ==========================================================

  AUDIT: Symbol('app.audit'),
  AUDIT_ENTRIES: Symbol('app.auditEntries'),
  AUDIT_FILTER: Symbol('app.auditFilter'),

  // ==========================================================
  // 1.20. ПЛАГИНЫ
  // ==========================================================

  PLUGINS: Symbol('app.plugins'),
  PLUGIN_STATE: Symbol('app.pluginState'),
  PLUGIN_ERRORS: Symbol('app.pluginErrors'),

  // ==========================================================
  // 1.21. ТАБЫ
  // ==========================================================

  TABS: Symbol('app.tabs'),
  TAB_CONTENTS: Symbol('app.tabContents'),
  TAB_HISTORY: Symbol('app.tabHistory'),

  // ==========================================================
  // 1.22. АНАЛИТИКА
  // ==========================================================

  ANALYTICS: Symbol('app.analytics'),
  ANALYTICS_EVENTS: Symbol('app.analyticsEvents'),
  ANALYTICS_SESSION: Symbol('app.analyticsSession'),

  // ==========================================================
  // 1.23. ПРОИЗВОДИТЕЛЬНОСТЬ
  // ==========================================================

  PERFORMANCE: Symbol('app.performance'),
  PERFORMANCE_MARKS: Symbol('app.performanceMarks'),
  PERFORMANCE_MEASURES: Symbol('app.performanceMeasures'),

  // ==========================================================
  // 1.24. ОШИБКИ
  // ==========================================================

  ERRORS: Symbol('app.errors'),
  ERROR_HANDLERS: Symbol('app.errorHandlers'),
  ERROR_LOGS: Symbol('app.errorLogs'),

  // ==========================================================
  // 1.25. СОБЫТИЯ
  // ==========================================================

  EVENTS: Symbol('app.events'),
  EVENT_LISTENERS: Symbol('app.eventListeners'),
  EVENT_HISTORY: Symbol('app.eventHistory'),

  // ==========================================================
  // 1.26. ИМПОРТЫ/ЭКСПОРТЫ
  // ==========================================================

  IMPORTS: Symbol('app.imports'),
  EXPORTS: Symbol('app.exports'),
  MODULES: Symbol('app.modules'),

  // ==========================================================
  // 1.27. ТЕСТИРОВАНИЕ
  // ==========================================================

  TESTS: Symbol('app.tests'),
  TEST_RESULTS: Symbol('app.testResults'),
  TEST_RUNNING: Symbol('app.testRunning'),

  // ==========================================================
  // 1.28. ДОПОЛНИТЕЛЬНЫЕ СИМВОЛЫ
  // ==========================================================

  EXTRA: Symbol('app.extra'),
  METADATA: Symbol('app.metadata'),
  CONTEXT: Symbol('app.context'),
  ENVIRONMENT: Symbol('app.environment'),
  PLATFORM: Symbol('app.platform'),
  USER: Symbol('app.user'),
  SESSION: Symbol('app.session'),
  TOKEN: Symbol('app.token'),
  AUTH: Symbol('app.auth'),
  PERMISSIONS: Symbol('app.permissions'),
  ROLES: Symbol('app.roles'),
  GROUPS: Symbol('app.groups'),
  TEAMS: Symbol('app.teams'),
  ORGANIZATION: Symbol('app.organization'),
  PROJECT: Symbol('app.project'),
  WORKSPACE: Symbol('app.workspace'),
  NAMESPACE: Symbol('app.namespace'),
  SCOPE: Symbol('app.scope'),
  DOMAIN: Symbol('app.domain'),
  REGION: Symbol('app.region'),
  ZONE: Symbol('app.zone'),
  CLUSTER: Symbol('app.cluster'),
  NODE: Symbol('app.node'),
  INSTANCE: Symbol('app.instance'),
  PROCESS: Symbol('app.process'),
  THREAD: Symbol('app.thread'),
  WORKER: Symbol('app.worker'),
  SERVICE: Symbol('app.service'),
  CONTAINER: Symbol('app.container'),
  POD: Symbol('app.pod'),
  DEPLOYMENT: Symbol('app.deployment'),
  RELEASE: Symbol('app.release'),
  VERSION_CONTROL: Symbol('app.versionControl'),
  BRANCH: Symbol('app.branch'),
  COMMIT: Symbol('app.commit'),
  TAG: Symbol('app.tag'),
  RELEASE_NOTES: Symbol('app.releaseNotes'),
  CHANGELOG: Symbol('app.changelog'),
  ROADMAP: Symbol('app.roadmap'),
  BACKLOG: Symbol('app.backlog'),
  SPRINT: Symbol('app.sprint'),
  EPIC: Symbol('app.epic'),
  STORY: Symbol('app.story'),
  TASK: Symbol('app.task'),
  BUG: Symbol('app.bug'),
  FEATURE: Symbol('app.feature'),
  ENHANCEMENT: Symbol('app.enhancement'),
  REFACTOR: Symbol('app.refactor'),
  OPTIMIZATION: Symbol('app.optimization'),
  DOCUMENTATION: Symbol('app.documentation'),
  TESTING: Symbol('app.testing'),
  DEPLOY: Symbol('app.deploy'),
  MONITOR: Symbol('app.monitor'),
  ALERT: Symbol('app.alert'),
  NOTIFICATION: Symbol('app.notification'),
  MESSAGE: Symbol('app.message'),
  QUEUE: Symbol('app.queue'),
  STREAM: Symbol('app.stream'),
  BUFFER: Symbol('app.buffer'),
  PIPE: Symbol('app.pipe'),
  FILTER: Symbol('app.filter'),
  MAP: Symbol('app.map'),
  REDUCE: Symbol('app.reduce'),
  FOREACH: Symbol('app.forEach'),
  SOME: Symbol('app.some'),
  EVERY: Symbol('app.every'),
  FIND: Symbol('app.find'),
  FIND_INDEX: Symbol('app.findIndex'),
  INCLUDES: Symbol('app.includes'),
  INDEX_OF: Symbol('app.indexOf'),
  LAST_INDEX_OF: Symbol('app.lastIndexOf'),
  SLICE: Symbol('app.slice'),
  SPLICE: Symbol('app.splice'),
  CONCAT: Symbol('app.concat'),
  JOIN: Symbol('app.join'),
  SPLIT: Symbol('app.split'),
  REPLACE: Symbol('app.replace'),
  REPLACE_ALL: Symbol('app.replaceAll'),
  TO_UPPER: Symbol('app.toUpper'),
  TO_LOWER: Symbol('app.toLower'),
  TRIM: Symbol('app.trim'),
  PAD_START: Symbol('app.padStart'),
  PAD_END: Symbol('app.padEnd'),
  STARTS_WITH: Symbol('app.startsWith'),
  ENDS_WITH: Symbol('app.endsWith'),
  MATCH: Symbol('app.match'),
  MATCH_ALL: Symbol('app.matchAll'),
  SEARCH: Symbol('app.search'),
  EXEC: Symbol('app.exec'),
  TEST: Symbol('app.test'),
  SOURCE: Symbol('app.source'),
  TARGET: Symbol('app.target'),
  DESTINATION: Symbol('app.destination'),
  ORIGIN: Symbol('app.origin'),
  DEST: Symbol('app.dest'),
  SRC: Symbol('app.src'),
  PATH: Symbol('app.path'),
  ROUTE: Symbol('app.route'),
  URL: Symbol('app.url'),
  URI: Symbol('app.uri'),
  URN: Symbol('app.urn'),
  IRI: Symbol('app.iri'),
  LOCATION: Symbol('app.location'),
  ADDRESS: Symbol('app.address'),
  COORDINATES: Symbol('app.coordinates'),
  LATITUDE: Symbol('app.latitude'),
  LONGITUDE: Symbol('app.longitude'),
  ALTITUDE: Symbol('app.altitude'),
  ACCURACY: Symbol('app.accuracy'),
  SPEED: Symbol('app.speed'),
  HEADING: Symbol('app.heading'),
  TIMESTAMP: Symbol('app.timestamp'),
  TIMEZONE: Symbol('app.timezone'),
  OFFSET: Symbol('app.offset'),
  UTC: Symbol('app.utc'),
  LOCAL: Symbol('app.local'),
  ISO: Symbol('app.iso'),
  RFC: Symbol('app.rfc'),
  UNIX: Symbol('app.unix'),
  EPOCH: Symbol('app.epoch'),
  DURATION: Symbol('app.duration'),
  INTERVAL: Symbol('app.interval'),
  PERIOD: Symbol('app.period'),
  FREQUENCY: Symbol('app.frequency'),
  RATE: Symbol('app.rate'),
  SPEED_LIMIT: Symbol('app.speedLimit'),
  RATE_LIMIT: Symbol('app.rateLimit'),
  THROTTLE: Symbol('app.throttle'),
  DEBOUNCE: Symbol('app.debounce'),
  DELAY: Symbol('app.delay'),
  TIMEOUT: Symbol('app.timeout'),
  RETRY: Symbol('app.retry'),
  BACKOFF: Symbol('app.backoff'),
  CIRCUIT_BREAKER: Symbol('app.circuitBreaker'),
  BULKHEAD: Symbol('app.bulkhead'),
  RETRY_STRATEGY: Symbol('app.retryStrategy'),
  FALLBACK: Symbol('app.fallback'),
  CACHE_STRATEGY: Symbol('app.cacheStrategy'),
  EVICTION_STRATEGY: Symbol('app.evictionStrategy'),
  REPLACEMENT_STRATEGY: Symbol('app.replacementStrategy'),
  ALLOCATION_STRATEGY: Symbol('app.allocationStrategy'),
  SCHEDULING_STRATEGY: Symbol('app.schedulingStrategy'),
  LOAD_BALANCING_STRATEGY: Symbol('app.loadBalancingStrategy'),
  DISTRIBUTION_STRATEGY: Symbol('app.distributionStrategy'),
  REPLICATION_STRATEGY: Symbol('app.replicationStrategy'),
  PARTITIONING_STRATEGY: Symbol('app.partitioningStrategy'),
  SHARDING_STRATEGY: Symbol('app.shardingStrategy'),
  INDEXING_STRATEGY: Symbol('app.indexingStrategy'),
  QUERY_STRATEGY: Symbol('app.queryStrategy'),
  EXECUTION_STRATEGY: Symbol('app.executionStrategy'),
  COMPILATION_STRATEGY: Symbol('app.compilationStrategy'),
  OPTIMIZATION_STRATEGY: Symbol('app.optimizationStrategy'),
  TRANSFORMATION_STRATEGY: Symbol('app.transformationStrategy'),
  NORMALIZATION_STRATEGY: Symbol('app.normalizationStrategy'),
  VALIDATION_STRATEGY: Symbol('app.validationStrategy'),
  AUTHENTICATION_STRATEGY: Symbol('app.authenticationStrategy'),
  AUTHORIZATION_STRATEGY: Symbol('app.authorizationStrategy'),
  ENCRYPTION_STRATEGY: Symbol('app.encryptionStrategy'),
  COMPRESSION_STRATEGY: Symbol('app.compressionStrategy'),
  SERIALIZATION_STRATEGY: Symbol('app.serializationStrategy'),
  DESERIALIZATION_STRATEGY: Symbol('app.deserializationStrategy'),
  PARSING_STRATEGY: Symbol('app.parsingStrategy'),
  FORMATTING_STRATEGY: Symbol('app.formattingStrategy'),
  RENDERING_STRATEGY: Symbol('app.renderingStrategy'),
  LAYOUT_STRATEGY: Symbol('app.layoutStrategy'),
  STYLING_STRATEGY: Symbol('app.stylingStrategy'),
  THEMING_STRATEGY: Symbol('app.themingStrategy'),
  LOCALIZATION_STRATEGY: Symbol('app.localizationStrategy'),
  INTERNATIONALIZATION_STRATEGY: Symbol('app.internationalizationStrategy'),
  GLOBALIZATION_STRATEGY: Symbol('app.globalizationStrategy'),
  REGIONALIZATION_STRATEGY: Symbol('app.regionalizationStrategy'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

export const PUBLIC = {
  // ==========================================================
  // 2.1. ОСНОВНЫЕ СИМВОЛЫ API
  // ==========================================================

  INSTANCE: Symbol.for('app.instance'),
  STATE: Symbol.for('app.state'),
  CONFIG: Symbol.for('app.config'),

  // ==========================================================
  // 2.2. МЕТОДЫ УПРАВЛЕНИЯ
  // ==========================================================

  INIT: Symbol.for('app.init'),
  DESTROY: Symbol.for('app.destroy'),
  RENDER: Symbol.for('app.render'),
  GET_STATE: Symbol.for('app.getState'),
  HEALTH_CHECK: Symbol.for('app.healthCheck'),

  // ==========================================================
  // 2.3. МЕТОДЫ МОДАЛЬНОГО ОКНА
  // ==========================================================

  SHOW_MODAL: Symbol.for('app.showModal'),
  CLOSE_MODAL: Symbol.for('app.closeModal'),

  // ==========================================================
  // 2.4. МЕТОДЫ УПРАВЛЕНИЯ ТАБЛИЦАМИ
  // ==========================================================

  SELECT_TABLE: Symbol.for('app.selectTable'),
  ADD_ROW: Symbol.for('app.addRow'),
  CREATE_TABLE: Symbol.for('app.createTable'),
  CREATE_TABLE_WITH_SCHEMA: Symbol.for('app.createTableWithSchema'),
  DROP_TABLE: Symbol.for('app.dropTable'),
  CLEAR_TABLE: Symbol.for('app.clearTable'),

  // ==========================================================
  // 2.5. МЕТОДЫ БРОКЕРА
  // ==========================================================

  PUBLISH_MESSAGE: Symbol.for('app.publishMessage'),
  ADD_SUBSCRIPTION: Symbol.for('app.addSubscription'),
  CLEAR_MESSAGES: Symbol.for('app.clearMessages'),
  GET_MESSAGES: Symbol.for('app.getMessages'),
  GET_SUBSCRIPTIONS: Symbol.for('app.getSubscriptions'),

  // ==========================================================
  // 2.6. МЕТОДЫ КОНСОЛИ
  // ==========================================================

  EXECUTE_COMMAND: Symbol.for('app.executeCommand'),
  CLEAR_CONSOLE: Symbol.for('app.clearConsole'),
  GET_CONSOLE_HISTORY: Symbol.for('app.getConsoleHistory'),

  // ==========================================================
  // 2.7. МЕТОДЫ ЭКСПОРТА
  // ==========================================================

  EXPORT_DATA: Symbol.for('app.exportData'),
  EXPORT_AUDIT: Symbol.for('app.exportAudit'),
  EXPORT_STATE: Symbol.for('app.exportState'),
  EXPORT_SYMBOLS: Symbol.for('app.exportSymbols'),

  // ==========================================================
  // 2.8. МЕТОДЫ ДЕМО-ДАННЫХ
  // ==========================================================

  INIT_DEMO: Symbol.for('app.initDemo'),
  GET_DEMO_DATA: Symbol.for('app.getDemoData'),

  // ==========================================================
  // 2.9. МЕТОДЫ УТИЛИТ
  // ==========================================================

  ESCAPE_HTML: Symbol.for('app.escapeHtml'),
  FORMAT_JSON: Symbol.for('app.formatJson'),
  FORMAT_TIME: Symbol.for('app.formatTime'),
  SAFE_CALL: Symbol.for('app.safeCall'),
  DEEP_CLONE: Symbol.for('app.deepClone'),
  GENERATE_ID: Symbol.for('app.generateId'),

  // ==========================================================
  // 2.10. МЕТОДЫ ЛОГГЕРА
  // ==========================================================

  LOG: Symbol.for('app.log'),
  DEBUG: Symbol.for('app.debug'),
  ERROR: Symbol.for('app.error'),
  WARN: Symbol.for('app.warn'),
  SUCCESS: Symbol.for('app.success'),
  INFO: Symbol.for('app.info'),
  GET_LOGS: Symbol.for('app.getLogs'),
  CLEAR_LOGS: Symbol.for('app.clearLogs'),

  // ==========================================================
  // 2.11. МЕТОДЫ КЭША
  // ==========================================================

  GET_CACHE: Symbol.for('app.getCache'),
  CLEAR_CACHE: Symbol.for('app.clearCache'),
  GET_CACHE_STATS: Symbol.for('app.getCacheStats'),

  // ==========================================================
  // 2.12. МЕТОДЫ АУДИТА
  // ==========================================================

  GET_AUDIT: Symbol.for('app.getAudit'),
  CLEAR_AUDIT: Symbol.for('app.clearAudit'),
  GET_AUDIT_STATS: Symbol.for('app.getAuditStats'),

  // ==========================================================
  // 2.13. МЕТОДЫ ПЛАГИНОВ
  // ==========================================================

  GET_PLUGINS: Symbol.for('app.getPlugins'),
  GET_PLUGIN: Symbol.for('app.getPlugin'),
  REGISTER_PLUGIN: Symbol.for('app.registerPlugin'),
  UNREGISTER_PLUGIN: Symbol.for('app.unregisterPlugin'),
  GET_PLUGIN_STATE: Symbol.for('app.getPluginState'),

  // ==========================================================
  // 2.14. МЕТОДЫ НАСТРОЕК
  // ==========================================================

  GET_SETTINGS: Symbol.for('app.getSettings'),
  UPDATE_SETTINGS: Symbol.for('app.updateSettings'),
  RESET_SETTINGS: Symbol.for('app.resetSettings'),

  // ==========================================================
  // 2.15. МЕТОДЫ АНАЛИТИКИ
  // ==========================================================

  TRACK_EVENT: Symbol.for('app.trackEvent'),
  GET_ANALYTICS: Symbol.for('app.getAnalytics'),
  CLEAR_ANALYTICS: Symbol.for('app.clearAnalytics'),

  // ==========================================================
  // 2.16. МЕТОДЫ ПРОИЗВОДИТЕЛЬНОСТИ
  // ==========================================================

  START_MARK: Symbol.for('app.startMark'),
  END_MARK: Symbol.for('app.endMark'),
  GET_PERFORMANCE: Symbol.for('app.getPerformance'),
  CLEAR_PERFORMANCE: Symbol.for('app.clearPerformance'),

  // ==========================================================
  // 2.17. МЕТОДЫ ОШИБОК
  // ==========================================================

  GET_ERRORS: Symbol.for('app.getErrors'),
  CLEAR_ERRORS: Symbol.for('app.clearErrors'),
  ADD_ERROR_HANDLER: Symbol.for('app.addErrorHandler'),
  REMOVE_ERROR_HANDLER: Symbol.for('app.removeErrorHandler'),

  // ==========================================================
  // 2.18. МЕТОДЫ СОБЫТИЙ
  // ==========================================================

  ON: Symbol.for('app.on'),
  OFF: Symbol.for('app.off'),
  EMIT: Symbol.for('app.emit'),
  ONCE: Symbol.for('app.once'),
  GET_EVENTS: Symbol.for('app.getEvents'),
  CLEAR_EVENTS: Symbol.for('app.clearEvents'),

  // ==========================================================
  // 2.19. МЕТОДЫ ТЕСТИРОВАНИЯ
  // ==========================================================

  RUN_TESTS: Symbol.for('app.runTests'),
  GET_TESTS: Symbol.for('app.getTests'),
  GET_TEST_RESULTS: Symbol.for('app.getTestResults'),
  CLEAR_TEST_RESULTS: Symbol.for('app.clearTestResults'),

  // ==========================================================
  // 2.20. ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // ==========================================================

  GET_GLOBAL_STORE: Symbol.for('app.getGlobalStore'),
  GET_ENVIRONMENT: Symbol.for('app.getEnvironment'),
  GET_VERSION: Symbol.for('app.getVersion'),
  GET_BUILD: Symbol.for('app.getBuild'),
  GET_NAMESPACE: Symbol.for('app.getNamespace'),
  GET_SCOPE: Symbol.for('app.getScope'),
  GET_CONTEXT: Symbol.for('app.getContext'),
  GET_METADATA: Symbol.for('app.getMetadata'),
  GET_TIMESTAMP: Symbol.for('app.getTimestamp'),
  GET_UPTIME: Symbol.for('app.getUptime'),
};

// ============================================================
// 3. СИМВОЛЫ ДЛЯ ВНУТРЕННЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export const INTERNAL = {
  // Для инициализации
  INIT_STATE: Symbol('app.initState'),
  INIT_DOM: Symbol('app.initDom'),
  INIT_EVENTS: Symbol('app.initEvents'),
  INIT_PLUGINS: Symbol('app.initPlugins'),
  INIT_ROUTER: Symbol('app.initRouter'),
  INIT_STORE: Symbol('app.initStore'),

  // Для рендеринга
  RENDER_QUEUE: Symbol('app.renderQueue'),
  RENDER_BATCH: Symbol('app.renderBatch'),
  RENDER_SCHEDULE: Symbol('app.renderSchedule'),
  RENDER_CANCEL: Symbol('app.renderCancel'),

  // Для анимаций
  ANIMATION_FRAME: Symbol('app.animationFrame'),
  ANIMATION_QUEUE: Symbol('app.animationQueue'),
  ANIMATION_CANCEL: Symbol('app.animationCancel'),

  // Для транзакций
  TRANSACTION_ID: Symbol('app.transactionId'),
  TRANSACTION_STACK: Symbol('app.transactionStack'),
  TRANSACTION_COMMIT: Symbol('app.transactionCommit'),
  TRANSACTION_ROLLBACK: Symbol('app.transactionRollback'),

  // Для синхронизации
  SYNC_LOCK: Symbol('app.syncLock'),
  SYNC_QUEUE: Symbol('app.syncQueue'),
  SYNC_TIMEOUT: Symbol('app.syncTimeout'),
  SYNC_RETRY: Symbol('app.syncRetry'),

  // Для обработки ошибок
  ERROR_BOUNDARY: Symbol('app.errorBoundary'),
  ERROR_RECOVERY: Symbol('app.errorRecovery'),
  ERROR_REPORT: Symbol('app.errorReport'),
  ERROR_SILENT: Symbol('app.errorSilent'),
};

// ============================================================
// 4. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;
  const internalCount = Object.keys(INTERNAL).length;
  const totalCount = privateCount + publicCount + internalCount;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔑 APP SYMBOLS (100% ИЗОЛЯЦИЯ) v4.0.8                         ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(
    `║  🔒 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║  🔓 Публичных символов:  ${publicCount.toString().padStart(3, ' ')}                                       ║`
  );
  console.log(
    `║  🔐 Внутренних символов: ${internalCount.toString().padStart(3, ' ')}                                      ║`
  );
  console.log(
    `║  📦 Всего символов:      ${totalCount.toString().padStart(3, ' ')}                                     ║`
  );
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 НОВЫЕ СИМВОЛЫ ★★★:                                                     ║');
  console.log('║    SELECTED_PROJECT — выбранный проект                                      ║');
  console.log('║    SELECTED_TASK — выбранная задача                                         ║');
  console.log('║    SELECTED_USER — выбранный пользователь                                   ║');
  console.log('║    PROJECTS — массив проектов                                               ║');
  console.log('║    TASKS — массив задач                                                     ║');
  console.log('║    USERS — массив пользователей                                             ║');
  console.log('║    FILTERS — фильтры таблиц                                                 ║');
  console.log('║    API_BASE — базовый URL API                                               ║');
  console.log('║    API_ENDPOINTS — эндпоинты API                                            ║');
  console.log('║    LOADING — состояние загрузки                                             ║');
  console.log('║    ERROR — состояние ошибки                                                 ║');
  console.log('║    FILTER_SUBSCRIBERS — подписчики фильтров                                  ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 КАТЕГОРИИ СИМВОЛОВ:                                                     ║');
  console.log('║    ✅ Основные — версия, сборка, имя, состояние                             ║');
  console.log('║    ✅ UI — выбор таблицы, строки, активный таб                              ║');
  console.log('║    ✅ Модальное окно — show/close, данные, callback                         ║');
  console.log('║    ✅ Брокер — публикация, подписка, сообщения                              ║');
  console.log('║    ✅ Консоль — выполнение команд, история                                  ║');
  console.log('║    ✅ Экспорт — данные, аудит, состояние, символы                           ║');
  console.log('║    ✅ Демо-данные — инициализация, загрузка                                 ║');
  console.log('║    ✅ Утилиты — escapeHtml, formatJson, formatTime                          ║');
  console.log('║    ✅ Безопасность — валидация, санитизация, шифрование                     ║');
  console.log('║    ✅ Логгер — error, warn, info, debug, success                            ║');
  console.log('║    ✅ Кэш — get, clear, stats                                               ║');
  console.log('║    ✅ Аудит — get, clear, stats                                             ║');
  console.log('║    ✅ Плагины — регистрация, удаление, состояние                            ║');
  console.log('║    ✅ Настройки — get, update, reset                                        ║');
  console.log('║    ✅ Аналитика — track, get, clear                                         ║');
  console.log('║    ✅ Производительность — marks, measures                                  ║');
  console.log('║    ✅ Ошибки — get, clear, handlers                                         ║');
  console.log('║    ✅ События — on, off, emit, once                                         ║');
  console.log('║    ✅ Тестирование — run, get, clear                                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУП ЧЕРЕЗ СИМВОЛЫ:                                                  ║');
  console.log('║    const app = Symbol.for("app.instance");                                  ║');
  console.log('║    const state = Symbol.for("app.state");                                   ║');
  console.log('║    const config = Symbol.for("app.config");                                 ║');
  console.log('║    const render = Symbol.for("app.render");                                 ║');
  console.log('║    const getState = Symbol.for("app.getState");                             ║');
  console.log('║    const healthCheck = Symbol.for("app.healthCheck");                       ║');
  console.log('║    const showModal = Symbol.for("app.showModal");                           ║');
  console.log('║    const closeModal = Symbol.for("app.closeModal");                         ║');
  console.log('║    const selectTable = Symbol.for("app.selectTable");                       ║');
  console.log('║    const addRow = Symbol.for("app.addRow");                                 ║');
  console.log('║    const createTable = Symbol.for("app.createTable");                       ║');
  console.log('║    const executeCommand = Symbol.for("app.executeCommand");                 ║');
  console.log('║    const clearConsole = Symbol.for("app.clearConsole");                     ║');
  console.log('║    const initDemo = Symbol.for("app.initDemo");                             ║');
  console.log('║    const getGlobalStore = Symbol.for("app.getGlobalStore");                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 5. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  PRIVATE,
  PUBLIC,
  INTERNAL,
};
