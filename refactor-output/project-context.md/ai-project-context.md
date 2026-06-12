# 🤖 AI Context - Полный проект

**Сгенерировано:** 12.06.2026, 13:27:46
**Исходная директория:** `/home/sergei/Desktop/system/Directory/11`
**Всего файлов:** 17
**Общий размер:** 461.17 KB
**Режим:** Сжатый (только сигнатуры, без реализации)

---

## 📋 ИНСТРУКЦИЯ ДЛЯ ИИ

Ты — AI ассистент, который анализирует код проекта. Ниже представлен **полный проект** в сжатом виде:

- ✅ **Сохранены:** импорты, экспорты, сигнатуры функций, JSDoc, TypeScript типы
- ❌ **Удалены:** реализации функций, внутренние вычисления, локальные переменные
- 🎯 **Цель:** Понимание архитектуры при минимальном расходе токенов

### Как использовать этот контекст:

1. Проанализируй структуру проекта
2. Ответь на вопросы пользователя о взаимосвязях модулей
3. Предложи рефакторинг, основываясь на предоставленных сигнатурах

---

## 📑 Оглавление

### .js файлы (17)
- [`../../Directory/11/backend/config/index.js`](#------directory-11-backend-config-index-js)
- [`../../Directory/11/backend/controllers/pendingController.js`](#------directory-11-backend-controllers-pendingcontroller-js)
- [`../../Directory/11/backend/controllers/taskController.js`](#------directory-11-backend-controllers-taskcontroller-js)
- [`../../Directory/11/backend/database/db.js`](#------directory-11-backend-database-db-js)
- [`../../Directory/11/backend/models/PendingAction.js`](#------directory-11-backend-models-pendingaction-js)
- [`../../Directory/11/backend/models/Task.js`](#------directory-11-backend-models-task-js)
- [`../../Directory/11/backend/server.js`](#------directory-11-backend-server-js)
- [`../../Directory/11/backend/services/analyzerService.js`](#------directory-11-backend-services-analyzerservice-js)
- [`../../Directory/11/backend/services/taskService.js`](#------directory-11-backend-services-taskservice-js)
- [`../../Directory/11/deepseek/background.js`](#------directory-11-deepseek-background-js)
- [`../../Directory/11/deepseek/chatMonitor.js`](#------directory-11-deepseek-chatmonitor-js)
- [`../../Directory/11/deepseek/eventBus.js`](#------directory-11-deepseek-eventbus-js)
- [`../../Directory/11/deepseek/injectDeepSeek.js`](#------directory-11-deepseek-injectdeepseek-js)
- [`../../Directory/11/deepseek/sidepanel.js`](#------directory-11-deepseek-sidepanel-js)
- [`../../Directory/11/qwen/background.js`](#------directory-11-qwen-background-js)
- [`../../Directory/11/qwen/injectDeepSeek.js`](#------directory-11-qwen-injectdeepseek-js)
- [`../../Directory/11/qwen/sidepanel.js`](#------directory-11-qwen-sidepanel-js)

---

## 📁 Структура проекта

```
11/
  └── 📁 ../
      └── 📁 ../
          └── 📁 Directory/
              └── 📁 11/
                  ├── 📁 backend/
                  │   ├── 📁 config/
                  │   │   └── 📄 index.js
                  │   ├── 📁 controllers/
                  │   │   ├── 📄 pendingController.js
                  │   │   └── 📄 taskController.js
                  │   ├── 📁 database/
                  │   │   └── 📄 db.js
                  │   ├── 📁 models/
                  │   │   ├── 📄 PendingAction.js
                  │   │   └── 📄 Task.js
                  │   ├── 📄 server.js
                  │   └── 📁 services/
                  │       ├── 📄 analyzerService.js
                  │       └── 📄 taskService.js
                  ├── 📁 deepseek/
                  │   ├── 📄 background.js
                  │   ├── 📄 chatMonitor.js
                  │   ├── 📄 eventBus.js
                  │   ├── 📄 injectDeepSeek.js
                  │   └── 📄 sidepanel.js
                  └── 📁 qwen/
                      ├── 📄 background.js
                      ├── 📄 injectDeepSeek.js
                      └── 📄 sidepanel.js
```

---

## 📄 Содержимое файлов

### `../../Directory/11/backend/config/index.js`
```javascript
// config/index.js - Полная версия с обновлениями

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Получаем путь к текущему файлу для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения из .env файла если он существует
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Конфигурация сервера
 * Все настройки можно переопределить через переменные окружения
 */
export const config = {
    // ========== СЕРВЕР ==========
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',

    // ========== БАЗА ДАННЫХ ==========
    dbPath: process.env.DB_PATH || './database/chat-monitor.db',
    dbBackupPath: process.env.DB_BACKUP_PATH || './backups',

    database: {
        wal: process.env.DB_WAL !== 'false', // Write-Ahead Logging
        cacheSize: parseInt(process.env.DB_CACHE_SIZE || '10000', 10),
        timeout: parseInt(process.env.DB_TIMEOUT || '5000', 10),
        backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL || '3600000', 10), // 1 час
        cleanupDays: parseInt(process.env.DB_CLEANUP_DAYS || '30', 10),
        journalMode: process.env.DB_JOURNAL_MODE || 'WAL',
        synchronous: process.env.DB_SYNCHRONOUS || 'NORMAL',
        tempStore: process.env.DB_TEMP_STORE || 'MEMORY'
    },

    // ========== КЭШ ==========
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 час
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
        enabled: process.env.CACHE_ENABLED !== 'false'
    },

    // ========== CORS ==========
    corsOrigin: process.env.CORS_ORIGIN || '*',
    corsMethods: process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
    corsAllowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization',
    corsCredentials: process.env.CORS_CREDENTIALS === 'true',

    // ========== ЛОГИРОВАНИЕ ==========
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'combined',
    logDir: process.env.LOG_DIR || './logs',

    // ========== ЛИМИТЫ ==========
    limits: {
        maxTasksPerSession: parseInt(process.env.MAX_TASKS_PER_SESSION || '1000', 10),
        maxPendingActions: parseInt(process.env.MAX_PENDING_ACTIONS || '500', 10),
        maxResponseSize: parseInt(process.env.MAX_RESPONSE_SIZE || '102400', 10), // 100KB
        maxUserMessageLength: parseInt(process.env.MAX_USER_MESSAGE_LENGTH || '10000', 10),
        maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '100', 10),
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30 секунд
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 минута
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 запросов в минуту
    },

    // ========== АНАЛИТИКА ==========
    analytics: {
        defaultPeriod: parseInt(process.env.ANALYTICS_DEFAULT_PERIOD || '24', 10), // часов
        retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
        aggregationInterval: parseInt(process.env.AGGREGATION_INTERVAL || '3600000', 10) // 1 час
    },

    // ========== МОНИТОРИНГ ==========
    monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10), // 1 минута
        healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false'
    },

    // ========== БЕЗОПАСНОСТЬ ==========
    security: {
        helmetEnabled: process.env.HELMET_ENABLED !== 'false',
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
        apiKey: process.env.API_KEY || null,
        trustedProxies: (process.env.TRUSTED_PROXIES || '').split(',').filter(Boolean)
    },

    // ========== ВРЕМЕННЫЕ НАСТРОЙКИ ==========
    timeouts: {
        responseWait: parseInt(process.env.RESPONSE_WAIT_TIMEOUT || '60000', 10), // 60 секунд
        streamingStuck: parseInt(process.env.STREAMING_STUCK_TIMEOUT || '30000', 10), // 30 секунд
        continueCheck: parseInt(process.env.CONTINUE_CHECK_INTERVAL || '500', 10), // 500ms
        serverShutdown: parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || '10000', 10) // 10 секунд
    },

    // ========== API НАСТРОЙКИ ==========
    api: {
        version: '1.0.0',
        basePath: '/api',
        docsPath: '/docs',
        healthPath: '/health'
    },

    // ========== РАЗРАБОТКА ==========
    dev: {
        hotReload: process.env.HOT_RELOAD === 'true',
        debugger: process.env.DEBUGGER === 'true',
        detailedErrors: process.env.DETAILED_ERRORS !== 'false'
    },

    // ========== РЕЖИМЫ РАБОТЫ ==========
    features: {
        autoContinue: process.env.AUTO_CONTINUE !== 'false',
        autoRetry: process.env.AUTO_RETRY === 'true',
        saveFullResponses: process.env.SAVE_FULL_RESPONSES !== 'false',
        enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
        enableAudit: process.env.ENABLE_AUDIT !== 'false',
        enableCache: process.env.ENABLE_CACHE !== 'false'
    },

    // ========== УВЕДОМЛЕНИЯ ==========
    notifications: {
        enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
        webhookUrl: process.env.WEBHOOK_URL || null,
        emailEnabled: process.env.EMAIL_ENABLED === 'true',
        emailHost: process.env.EMAIL_HOST || null,
        emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
        emailUser: process.env.EMAIL_USER || null,
        emailPass: process.env.EMAIL_PASS || null,
        emailTo: process.env.EMAIL_TO || null
    },

    // ========== ЭКСПОРТ ==========
    export: {
        format: process.env.EXPORT_FORMAT || 'json',
        maxRows: parseInt(process.env.EXPORT_MAX_ROWS || '10000', 10),
        compression: process.env.EXPORT_COMPRESSION === 'true'
    }
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

/**
 * Проверка валидности конфигурации
 */
export function validateConfig() { /* реализация скрыта */ }

/**
 * Получить конфигурацию для отображения (без sensitive данных)
 */
export function getPublicConfig() { /* реализация скрыта */ }

/**
 * Получить переменные окружения в виде объекта
 */
export function getEnvVariables() { /* реализация скрыта */ }

/**
 * Обновить конфигурацию (только для разработки)
 */
export function updateConfig(newConfig) { /* реализация скрыта */ }

/**
 * Сбросить конфигурацию до значений по умолчанию
 */
export function resetConfig() { /* реализация скрыта */ }

/**
 * Проверка доступности ресурсов
 */
export function checkResources() { /* реализация скрыта */ }

// ========== КОНСТАНТЫ ==========

export const CONSTANTS = {
    // Типы неопределенных состояний
    PENDING_TYPES: {
        RESPONSE_NOT_FOUND: 'response_not_found',
        HTML_BLOCKS_MISSING: 'html_blocks_missing',
        TIMEOUT: 'timeout',
        STREAMING_STUCK: 'streaming_stuck',
        UNKNOWN: 'unknown',
        NO_RESPONSE_CONTENT: 'no_response_content',
        VALIDATION_FAILED: 'validation_failed'
    },

    // Уровни серьезности
    SEVERITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },

    // Статусы задач
    TASK_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        FAILED: 'failed'
    },

    // Статусы сессий
    SESSION_STATUS: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        INTERRUPTED: 'interrupted'
    },

    // Форматы логов
    LOG_FORMATS: {
        COMBINED: 'combined',
        COMMON: 'common',
        DEV: 'dev',
        SHORT: 'short',
        TINY: 'tiny'
    },

    // HTTP статусы
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500
    }
};

// ========== ВАЛИДАЦИЯ ПРИ ЗАГРУЗКЕ ==========

const validation = validateConfig();
if (!validation.isValid) {
    console.error('[Config] Validation errors:', validation.errors);
    if (config.isProduction) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
}

if (validation.warnings.length > 0) {
    console.warn('[Config] Configuration warnings:', validation.warnings);
}

// Экспорт настроек для логирования
if (config.isDevelopment) {
    console.log('[Config] Loaded configuration:', {
        env: config.env,
        port: config.port,
        dbPath: config.dbPath,
        logLevel: config.logLevel,
        isProduction: config.isProduction
    });
}

export default config;
```

---

### `../../Directory/11/backend/controllers/pendingController.js`
```javascript
// controllers/pendingController.js - Полная версия с обновлениями

import { db } from '../database/db.js';
import { PendingActionModel } from '../models/PendingAction.js';

export const pendingController = {
    /**
     * POST /api/pending
     * Сохранить неопределенное состояние
     * @body { taskId, sessionId, type, description, severity, suggestedAction, details, autoResolved, resolutionMethod, detectedAt, resolvedAt }
     */
    async savePending(req, res) {
        try {
            const actionData = req.body;

            // Валидация обязательных полей
            if (!actionData.sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            if (!actionData.type) {
                return res.status(400).json({
                    success: false,
                    error: 'type is required'
                });
            }

            // Сохраняем через модель
            const result = PendingActionModel.save({
                taskId: actionData.taskId,
                sessionId: actionData.sessionId,
                type: actionData.type,
                description: actionData.description,
                severity: actionData.severity,
                suggestedAction: actionData.suggestedAction,
                details: actionData.details,
                autoResolved: actionData.autoResolved || false,
                resolutionMethod: actionData.resolutionMethod,
                detectedAt: actionData.detectedAt || Date.now(),
                resolvedAt: actionData.resolvedAt || null
            });

            // Обновляем счетчик сессии
            if (actionData.sessionId && !actionData.autoResolved) {
                try {
                    await PendingActionModel.updateSessionPendingCount(actionData.sessionId);
                } catch (err) {
                    console.warn('[PendingController] Could not update session count:', err.message);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Pending action saved successfully',
                data: {
                    id: result.lastInsertRowid,
                    ...actionData
                }
            });
        } catch (error) {
            console.error('[PendingController] Error saving pending action:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/unresolved
     * Получить все неразрешенные проблемы
     * @query limit - количество записей (по умолчанию 50)
     */
    async getUnresolved(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const actions = await PendingActionModel.getUnresolved(limit);

            // Добавляем форматированное время
            const actionsWithTime = actions.map(action => ({
                ...action,
                timeSinceDetected: Date.now() - (action.detected_at || 0),
                timeSinceDetectedFormatted: this._formatDuration(Date.now() - (action.detected_at || 0))
            }));

            // Получаем статистику по неразрешенным
            const stats = {
                total: actionsWithTime.length,
                bySeverity: this._groupBySeverity(actionsWithTime),
                byType: this._groupByType(actionsWithTime),
                oldest: actionsWithTime[actionsWithTime.length - 1] || null,
                newest: actionsWithTime[0] || null
            };

            res.json({
                success: true,
                data: actionsWithTime,
                stats: stats,
                total: actionsWithTime.length
            });
        } catch (error) {
            console.error('[PendingController] Error getting unresolved:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/type/:type
     * Получить проблемы по типу
     * @param type - тип проблемы
     * @query limit - количество записей (по умолчанию 20)
     */
    async getByType(req, res) {
        try {
            const { type } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const actions = await PendingActionModel.getByType(type, limit);

            // Получаем статистику по этому типу
            const typeStats = await PendingActionModel.getStatsByType();
            const thisTypeStats = typeStats.find(s => s.type === type);

            res.json({
                success: true,
                data: actions,
                stats: thisTypeStats || null,
                total: actions.length,
                type: type
            });
        } catch (error) {
            console.error('[PendingController] Error getting by type:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/stats
     * Получить статистику по типам проблем
     */
    async getStats(req, res) {
        try {
            const stats = await PendingActionModel.getStatsByType();
            const summary = await PendingActionModel.getDashboardSummary();

            // Общая статистика
            const totalStats = {
                total: stats.reduce((sum, s) => sum + s.total, 0),
                resolved: stats.reduce((sum, s) => sum + (s.resolved || 0), 0),
                unresolved: stats.reduce((sum, s) => sum + (s.unresolved || 0), 0),
                bySeverity: {
                    critical: stats.filter(s => s.severity === 'critical').reduce((sum, s) => sum + s.total, 0),
                    high: stats.filter(s => s.severity === 'high').reduce((sum, s) => sum + s.total, 0),
                    medium: stats.filter(s => s.severity === 'medium').reduce((sum, s) => sum + s.total, 0),
                    low: stats.filter(s => s.severity === 'low').reduce((sum, s) => sum + s.total, 0)
                }
            };

            // Вычисляем общий процент разрешения
            totalStats.resolutionRate = totalStats.total > 0
                ? ((totalStats.resolved / totalStats.total) * 100).toFixed(2)
                : 0;

            res.json({
                success: true,
                data: {
                    byType: stats,
                    summary: totalStats,
                    dashboard: summary,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/session/:sessionId
     * Получить проблемы по ID сессии
     */
    async getBySessionId(req, res) {
        try {
            const { sessionId } = req.params;
            const actions = await PendingActionModel.getBySessionId(sessionId);
            const sessionStats = await PendingActionModel.getSessionStats(sessionId);

            res.json({
                success: true,
                data: actions,
                stats: sessionStats,
                total: actions.length,
                sessionId: sessionId
            });
        } catch (error) {
            console.error('[PendingController] Error getting by session:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/task/:taskId
     * Получить проблемы по ID задачи
     */
    async getByTaskId(req, res) {
        try {
            const { taskId } = req.params;
            const actions = await PendingActionModel.getByTaskId(taskId);

            res.json({
                success: true,
                data: actions,
                total: actions.length,
                taskId: taskId
            });
        } catch (error) {
            console.error('[PendingController] Error getting by task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/pending/:id/resolve
     * Отметить проблему как разрешенную
     * @param id - ID записи
     * @body resolutionMethod - метод разрешения
     */
    async resolvePending(req, res) {
        try {
            const { id } = req.params;
            const { resolutionMethod } = req.body;

            if (!resolutionMethod) {
                return res.status(400).json({
                    success: false,
                    error: 'resolutionMethod is required'
                });
            }

            // Получаем действие перед разрешением
            const action = await PendingActionModel.getById(parseInt(id));
            if (!action) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const result = await PendingActionModel.resolve(parseInt(id), resolutionMethod);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            // Обновляем статистику сессии
            if (action.session_id) {
                try {
                    await PendingActionModel.updateSessionPendingCount(action.session_id);
                } catch (err) {
                    console.warn('[PendingController] Could not update session count:', err.message);
                }
            }

            res.json({
                success: true,
                message: 'Pending action resolved successfully',
                data: {
                    id: parseInt(id),
                    resolutionMethod: resolutionMethod,
                    resolvedAt: Date.now()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error resolving pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/pending/:id
     * Обновить детали проблемы
     */
    async updatePending(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const allowedFields = ['description', 'severity', 'suggestedAction', 'details'];
            const filteredUpdates = {};

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    filteredUpdates[field] = updates[field];
                }
            }

            if (Object.keys(filteredUpdates).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid fields to update'
                });
            }

            const result = await PendingActionModel.update(parseInt(id), filteredUpdates);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const updated = await PendingActionModel.getById(parseInt(id));

            res.json({
                success: true,
                message: 'Pending action updated successfully',
                data: updated
            });
        } catch (error) {
            console.error('[PendingController] Error updating pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/summary
     * Получить сводную аналитику по проблемам
     * @query period - период в часах (по умолчанию 24)
     */
    async getAnalyticsSummary(req, res) {
        try {
            const period = parseInt(req.query.period) || 24;
            const since = Date.now() - (period * 60 * 60 * 1000);
            const analytics = await PendingActionModel.getAnalyticsSummary(since);

            // Добавляем тренды
            const trends = await this._getTrends(period);
            const predictions = await this._getPredictions();

            res.json({
                success: true,
                data: {
                    ...analytics,
                    trends: trends,
                    predictions: predictions,
                    periodHours: period
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting analytics summary:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/frequency
     * Получить частоту возникновения проблем
     * @query hours - количество часов для анализа (по умолчанию 24)
     */
    async getFrequency(req, res) {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const frequency = await PendingActionModel.getFrequencyByType(hours);
            const timeline = await PendingActionModel.getTimeline(hours);

            res.json({
                success: true,
                data: {
                    frequency: frequency,
                    timeline: timeline,
                    hours: hours,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting frequency:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/critical
     * Получить критические неразрешенные проблемы
     */
    async getCritical(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const critical = await PendingActionModel.getCriticalUnresolved(limit);

            res.json({
                success: true,
                data: critical,
                total: critical.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting critical:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/dashboard
     * Получить сводку для дашборда
     */
    async getDashboard(req, res) {
        try {
            const summary = await PendingActionModel.getDashboardSummary();
            const topIssues = await PendingActionModel.getTopIssues(10);
            const uniqueTypes = await PendingActionModel.getUniqueTypes();

            // Добавляем рекомендации
            const recommendations = this._generateRecommendations(summary, topIssues);

            res.json({
                success: true,
                data: {
                    summary: summary,
                    topIssues: topIssues,
                    uniqueTypes: uniqueTypes,
                    recommendations: recommendations,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting dashboard:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/:id
     * Удалить запись о проблеме
     */
    async deletePending(req, res) {
        try {
            const { id } = req.params;

            // Проверяем существование
            const action = await PendingActionModel.getById(parseInt(id));
            if (!action) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const result = await PendingActionModel.delete(parseInt(id));

            res.json({
                success: true,
                message: 'Pending action deleted successfully',
                data: { id: parseInt(id), sessionId: action.session_id }
            });
        } catch (error) {
            console.error('[PendingController] Error deleting pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/session/:sessionId
     * Удалить все проблемы сессии
     */
    async deleteBySessionId(req, res) {
        try {
            const { sessionId } = req.params;
            const result = await PendingActionModel.deleteBySessionId(sessionId);

            res.json({
                success: true,
                message: `Deleted ${result.changes} pending actions for session`,
                data: { sessionId: sessionId, deletedCount: result.changes }
            });
        } catch (error) {
            console.error('[PendingController] Error deleting by session:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/cleanup/old
     * Удалить старые разрешенные проблемы
     * @query days - количество дней (по умолчанию 30)
     */
    async cleanupOld(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const result = await PendingActionModel.deleteOld(days);

            res.json({
                success: true,
                message: `Cleaned up ${result.changes} old resolved pending actions`,
                data: { deletedCount: result.changes, olderThanDays: days }
            });
        } catch (error) {
            console.error('[PendingController] Error cleaning up old:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/pending/batch
     * Массовое сохранение неопределенных состояний
     */
    async saveBatchPending(req, res) {
        try {
            const { actions } = req.body;

            if (!Array.isArray(actions) || actions.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'actions array is required and must not be empty'
                });
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < actions.length; i++) {
                try {
                    const action = actions[i];

                    if (!action.sessionId || !action.type) {
                        errors.push({ index: i, error: 'sessionId and type are required' });
                        continue;
                    }

                    const result = PendingActionModel.save({
                        taskId: action.taskId,
                        sessionId: action.sessionId,
                        type: action.type,
                        description: action.description,
                        severity: action.severity,
                        suggestedAction: action.suggestedAction,
                        details: action.details,
                        autoResolved: action.autoResolved || false,
                        resolutionMethod: action.resolutionMethod,
                        detectedAt: action.detectedAt || Date.now(),
                        resolvedAt: action.resolvedAt || null
                    });

                    results.push({
                        index: i,
                        id: result.lastInsertRowid,
                        ...action
                    });
                } catch (err) {
                    errors.push({ index: i, error: err.message });
                }
            }

            // Обновляем статистику сессий для затронутых сессий
            const uniqueSessions = [...new Set(actions.map(a => a.sessionId).filter(Boolean))];
            for (const sessionId of uniqueSessions) {
                try {
                    await PendingActionModel.updateSessionPendingCount(sessionId);
                } catch (err) {
                    console.warn(`[PendingController] Could not update session ${sessionId}:`, err.message);
                }
            }

            res.status(201).json({
                success: true,
                message: `${results.length} pending actions saved successfully`,
                data: {
                    succeeded: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors
                }
            });
        } catch (error) {
            console.error('[PendingController] Error saving batch pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/export
     * Экспорт данных о проблемах
     * @query format - формат (json/csv)
     * @query type - фильтр по типу
     * @query severity - фильтр по серьезности
     * @query from - дата начала
     * @query to - дата конца
     */
    async exportPending(req, res) {
        try {
            const format = req.query.format || 'json';
            const filters = {
                type: req.query.type,
                severity: req.query.severity,
                autoResolved: req.query.autoResolved === 'true' ? true : (req.query.autoResolved === 'false' ? false : undefined),
                fromDate: req.query.from,
                toDate: req.query.to
            };

            const data = await PendingActionModel.exportData(filters);

            const exportData = {
                exportDate: new Date().toISOString(),
                exporter: 'Chat Monitor Server',
                version: '1.0',
                filters: filters,
                total: data.length,
                data: data
            };

            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=pending-actions-export-${Date.now()}.json`);
                res.json(exportData);
            } else if (format === 'csv') {
                // Формируем CSV
                const headers = ['id', 'type', 'severity', 'description', 'session_id', 'task_id', 'detected_at', 'resolved_at', 'auto_resolved'];
                const csvRows = [headers.join(',')];

                for (const item of data) {
                    const row = headers.map(header => {
                        let value = item[header];
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            value = `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    });
                    csvRows.push(row.join(','));
                }

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=pending-actions-export-${Date.now()}.csv`);
                res.send(csvRows.join('\n'));
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Unsupported format. Use json or csv'
                });
            }
        } catch (error) {
            console.error('[PendingController] Error exporting pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/types
     * Получить аналитику по типам проблем
     */
    async getTypeAnalytics(req, res) {
        try {
            const period = parseInt(req.query.period) || 30; // дней
            const stats = await PendingActionModel.getStatsByType();

            // Добавляем процент изменения
            const statsWithChange = await Promise.all(stats.map(async (stat) => {
                const previousPeriod = await this._getPreviousPeriodCount(stat.type, period);
                const change = previousPeriod > 0
                    ? (((stat.total - previousPeriod) / previousPeriod) * 100).toFixed(1)
                    : (stat.total > 0 ? '+100' : '0');
                return {
                    ...stat,
                    change: parseFloat(change),
                    trend: this._getTrendDirection(parseFloat(change))
                };
            }));

            res.json({
                success: true,
                data: statsWithChange,
                period: `${period} days`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting type analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    /**
     * Получить количество за предыдущий период
     */
    async _getPreviousPeriodCount(type, days) {
        const stmt = db.prepare(`
            SELECT COUNT(*) as count
            FROM pending_actions
            WHERE type = ?
            AND detected_at > ?
            AND detected_at <= ?
        `);
        const now = Date.now();
        const currentStart = now - (days * 24 * 60 * 60 * 1000);
        const previousStart = currentStart - (days * 24 * 60 * 60 * 1000);
        const result = stmt.get(type, previousStart, currentStart);
        return result?.count || 0;
    },

    /**
     * Получить направление тренда
     */
    _getTrendDirection(change) {
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    },

    /**
     * Получить тренды за период
     */
    async _getTrends(periodHours) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00', datetime(detected_at/1000, 'unixepoch')) as hour,
                type,
                COUNT(*) as count
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY hour, type
            ORDER BY hour ASC
        `);
        const results = stmt.all(since);

        // Группируем по часам
        const trends = {};
        for (const row of results) {
            if (!trends[row.type]) {
                trends[row.type] = [];
            }
            trends[row.type].push({
                hour: row.hour,
                count: row.count
            });
        }

        return trends;
    },

    /**
     * Получить прогнозы проблем
     */
    async _getPredictions() {
        const stmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as total,
                AVG(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) * 100 as resolve_rate,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type
        `);
        const since = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const results = stmt.all(since);

        const predictions = [];
        for (const row of results) {
            if (row.resolve_rate < 30 && row.total > 5) {
                predictions.push({
                    type: row.type,
                    risk: 'high',
                    message: `Низкий процент разрешения (${row.resolve_rate.toFixed(1)}%) для типа "${row.type}"`,
                    recommendation: 'Требуется анализ причин и ручное вмешательство'
                });
            } else if (row.resolve_rate < 60 && row.total > 10) {
                predictions.push({
                    type: row.type,
                    risk: 'medium',
                    message: `Средний процент разрешения (${row.resolve_rate.toFixed(1)}%) для типа "${row.type}"`,
                    recommendation: 'Рекомендуется оптимизировать процесс обработки'
                });
            }
        }

        return predictions;
    },

    /**
     * Генерация рекомендаций на основе статистики
     */
    _generateRecommendations(summary, topIssues) {
        const recommendations = [];

        if (summary.current?.critical > 0) {
            recommendations.push({
                priority: 'critical',
                message: `Обнаружено ${summary.current.critical} критических неразрешенных проблем`,
                action: 'Требуется немедленное вмешательство'
            });
        }

        if (summary.current?.unresolved > 10) {
            recommendations.push({
                priority: 'high',
                message: `Накоплено ${summary.current.unresolved} неразрешенных проблем`,
                action: 'Рекомендуется провести анализ и массовое разрешение'
            });
        }

        if (topIssues.length > 0 && topIssues[0].occurrences > 5) {
            recommendations.push({
                priority: 'medium',
                message: `Наиболее частая проблема: ${topIssues[0].type} (${topIssues[0].occurrences} раз)`,
                action: 'Требуется анализ корневых причин'
            });
        }

        return recommendations;
    },

    /**
     * Группировка по серьезности
     */
    _groupBySeverity(actions) {
        const groups = { critical: 0, high: 0, medium: 0, low: 0 };
        for (const action of actions) {
            const severity = action.severity || 'medium';
            if (groups[severity] !== undefined) groups[severity]++;
            else groups.medium++;
        }
        return groups;
    },

    /**
     * Группировка по типу
     */
    _groupByType(actions) {
        const groups = {};
        for (const action of actions) {
            const type = action.type || 'unknown';
            groups[type] = (groups[type] || 0) + 1;
        }
        return groups;
    },

    /**
     * Форматирование длительности
     */
    _formatDuration(ms) {
        if (ms < 0) return '0с';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    }
};

export default pendingController;
```

---

### `../../Directory/11/backend/controllers/taskController.js`
```javascript
// server/controllers/taskController.js - Полная версия с обновлениями
import { TaskModel } from '../models/Task.js';
import { TaskService } from '../services/taskService.js';
import { db } from '../database/db.js';

export const taskController = {
    /**
     * POST /api/tasks
     * Сохранить задачу (сообщение пользователя + ответ чата)
     */
    async saveTask(req, res) {
        try {
            const taskData = req.body;

            // Валидация обязательных полей
            if (!taskData.id) {
                return res.status(400).json({
                    success: false,
                    error: 'task id is required'
                });
            }

            if (!taskData.sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            if (!taskData.userMessage) {
                return res.status(400).json({
                    success: false,
                    error: 'userMessage is required'
                });
            }

            // Проверяем существование сессии, если нет - создаем
            const sessionExists = await TaskModel.checkSessionExists(taskData.sessionId);
            if (!sessionExists) {
                await TaskModel.createSession({
                    id: taskData.sessionId,
                    startTime: taskData.startTime || Date.now(),
                    status: 'active'
                });
            }

            const result = await TaskService.processCompletedTask(taskData);

            res.status(201).json({
                success: true,
                message: 'Task saved successfully',
                data: result
            });
        } catch (error) {
            console.error('[TaskController] Error saving task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/:id
     * Получить задачу по ID
     */
    async getTask(req, res) {
        try {
            const { id } = req.params;
            const task = await TaskModel.getById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Получаем связанные pending actions
            const pendingActions = await TaskModel.getPendingActionsByTaskId(id);

            res.json({
                success: true,
                data: {
                    ...task,
                    pendingActions: pendingActions
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/session/:sessionId
     * Получить все задачи сессии
     */
    async getTasksBySession(req, res) {
        try {
            const { sessionId } = req.params;
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            // Проверяем существование сессии
            const sessionExists = await TaskModel.checkSessionExists(sessionId);
            if (!sessionExists) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }

            const tasks = await TaskModel.getBySessionId(sessionId, limit, offset);
            const stats = await TaskModel.getStats(sessionId);
            const sessionInfo = await TaskModel.getSessionInfo(sessionId);

            res.json({
                success: true,
                data: {
                    session: sessionInfo,
                    tasks,
                    stats,
                    pagination: {
                        limit,
                        offset,
                        total: tasks.length,
                        hasMore: tasks.length === limit
                    }
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting session tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/failed/list
     * Получить список failed задач с анализом
     */
    async getFailedTasks(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const includeAnalysis = req.query.analysis !== 'false';
            const tasks = await TaskModel.getFailedTasks(limit);

            let analyzedTasks = tasks;

            if (includeAnalysis) {
                analyzedTasks = tasks.map(task => ({
                    ...task,
                    analysis: {
                        possibleCauses: this.analyzeFailureReason(task),
                        recommendations: this.getRecommendationsForFailure(task),
                        severity: this.getFailureSeverity(task),
                        canAutoFix: this.canAutoFix(task)
                    }
                }));
            }

            // Статистика по failed задачам
            const failedStats = {
                total: tasks.length,
                byReason: this.groupFailuresByReason(tasks),
                bySeverity: this.groupFailuresBySeverity(tasks),
                averageDuration: tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / (tasks.length || 1)
            };

            res.json({
                success: true,
                data: analyzedTasks,
                stats: failedStats,
                total: tasks.length
            });
        } catch (error) {
            console.error('[TaskController] Error getting failed tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/analyze/:id
     * Детальный анализ задачи
     */
    async analyzeTask(req, res) {
        try {
            const { id } = req.params;
            const task = await TaskModel.getById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Полный анализ задачи
            const analysis = await TaskService.analyzeTask(task);

            // Метрики качества ответа
            const qualityMetrics = {
                responseQuality: this.calculateResponseQuality(task.assistant_response),
                relevanceScore: this.calculateRelevanceScore(task.user_message, task.assistant_response),
                completenessScore: this.calculateCompletenessScore(task.assistant_response),
                readabilityScore: this.calculateReadabilityScore(task.assistant_response),
                uniquenessScore: await this.calculateUniquenessScore(task.assistant_response),
                timestamp: new Date().toISOString()
            };

            // Извлечение ключевых тем
            const keyTopics = this.extractKeyTopics(task.assistant_response);

            // Статистика по словам
            const wordStats = this.getWordStats(task.assistant_response);

            res.json({
                success: true,
                data: {
                    task: {
                        id: task.id,
                        sessionId: task.session_id,
                        userMessage: task.user_message,
                        assistantResponse: task.assistant_response,
                        startTime: task.start_time,
                        endTime: task.end_time,
                        duration: task.duration,
                        status: task.status,
                        validationScore: task.validation_score,
                        isValid: task.is_valid === 1,
                        errorMessage: task.error_message,
                        htmlBlocksCount: task.html_blocks_count,
                        continueClicks: task.continue_clicks || 0
                    },
                    analysis,
                    qualityMetrics,
                    keyTopics,
                    wordStats
                }
            });
        } catch (error) {
            console.error('[TaskController] Error analyzing task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/tasks/:id/status
     * Обновить статус задачи
     */
    async updateTaskStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, validationScore, isValid, errorMessage } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'status is required'
                });
            }

            const validStatuses = ['pending', 'processing', 'completed', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const result = await TaskModel.updateStatus(id, status, validationScore, isValid, errorMessage);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Если задача завершена, обновляем статистику сессии
            if (status === 'completed' || status === 'failed') {
                const task = await TaskModel.getById(id);
                if (task) {
                    await TaskModel.updateSessionStats(task.session_id);
                }
            }

            res.json({
                success: true,
                message: 'Task status updated successfully',
                data: { id, status, validationScore, isValid, errorMessage }
            });
        } catch (error) {
            console.error('[TaskController] Error updating task status:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/stats/summary
     * Получить сводную статистику по задачам
     */
    async getTasksSummary(req, res) {
        try {
            const period = parseInt(req.query.period) || 24;
            const since = Date.now() - (period * 60 * 60 * 1000);

            const stats = await TaskModel.getSummaryStats(since);
            const trends = await TaskModel.getTrends(7);
            const topIssues = await TaskModel.getTopIssues(period);

            // Вычисляем дополнительные метрики
            const avgResponseLength = await TaskModel.getAvgResponseLength(since);
            const completionRate = stats.total_tasks > 0
                ? ((stats.completed_tasks / stats.total_tasks) * 100).toFixed(2)
                : 0;

            // Генерация рекомендаций
            const recommendations = [];

            if (stats.failedRate > 20) {
                recommendations.push({
                    priority: 'high',
                    issue: `Высокий процент failed задач: ${stats.failedRate}%`,
                    suggestion: 'Рекомендуется проверить стабильность сервера DeepSeek и соединение',
                    action: 'check_server_health'
                });
            }

            if (stats.avgValidationScore < 60) {
                recommendations.push({
                    priority: 'medium',
                    issue: `Низкая средняя оценка валидации: ${stats.avgValidationScore}`,
                    suggestion: 'Качество ответов требует улучшения. Рассмотрите возможность настройки prompt',
                    action: 'review_prompts'
                });
            }

            if (stats.avgDuration > 30000) {
                recommendations.push({
                    priority: 'medium',
                    issue: `Высокое среднее время ответа: ${(stats.avgDuration / 1000).toFixed(1)} сек`,
                    suggestion: 'Рекомендуется оптимизировать запросы или увеличить таймауты',
                    action: 'optimize_timeouts'
                });
            }

            if (avgResponseLength < 100) {
                recommendations.push({
                    priority: 'low',
                    issue: `Короткие ответы: средняя длина ${avgResponseLength} символов`,
                    suggestion: 'Пользователи получают слишком краткие ответы',
                    action: 'enhance_responses'
                });
            }

            if (topIssues && topIssues.length > 0) {
                recommendations.push({
                    priority: 'high',
                    issue: `Наиболее частая проблема: ${topIssues[0].type}`,
                    suggestion: `Встречается ${topIssues[0].count} раз. Требуется анализ причин`,
                    action: 'investigate_issues'
                });
            }

            res.json({
                success: true,
                data: {
                    period: `${period} hours`,
                    periodStart: new Date(since).toISOString(),
                    periodEnd: new Date().toISOString(),
                    ...stats,
                    completionRate: parseFloat(completionRate),
                    avgResponseLength,
                    trends,
                    topIssues,
                    recommendations
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting tasks summary:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/search
     * Поиск задач по сообщению пользователя или ответу
     */
    async searchTasks(req, res) {
        try {
            const { q, field = 'both', limit = 20, offset = 0 } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query must be at least 2 characters'
                });
            }

            const validFields = ['userMessage', 'assistantResponse', 'both'];
            if (!validFields.includes(field)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid field. Must be one of: ${validFields.join(', ')}`
                });
            }

            const tasks = await TaskModel.search(q, field, parseInt(limit), parseInt(offset));
            const total = await TaskModel.getSearchCount(q, field);

            // Добавляем релевантность для каждого результата
            const tasksWithRelevance = tasks.map(task => ({
                ...task,
                relevance: this.calculateRelevanceScore(q, task.user_message, task.assistant_response)
            }));

            // Сортируем по релевантности
            tasksWithRelevance.sort((a, b) => b.relevance - a.relevance);

            res.json({
                success: true,
                data: tasksWithRelevance,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total,
                    hasMore: (parseInt(offset) + tasks.length) < total
                },
                query: q,
                field
            });
        } catch (error) {
            console.error('[TaskController] Error searching tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/session/:sessionId/export
     * Экспорт задач сессии в JSON
     */
    async exportSessionTasks(req, res) {
        try {
            const { sessionId } = req.params;
            const format = req.query.format || 'json';

            const session = await TaskModel.getSessionInfo(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }

            const tasks = await TaskModel.getBySessionId(sessionId, 10000, 0);
            const pendingActions = await TaskModel.getPendingActionsBySessionId(sessionId);

            const exportData = {
                exportDate: new Date().toISOString(),
                exporter: 'DeepSeek Chat Monitor',
                version: '1.0',
                session: {
                    id: session.id,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    status: session.status,
                    totalTasks: session.total_tasks,
                    completedTasks: session.completed_tasks,
                    failedTasks: session.failed_tasks,
                    duration: session.end_time ? session.end_time - session.start_time : null
                },
                tasks: tasks.map(task => ({
                    id: task.id,
                    userMessage: task.user_message,
                    assistantResponse: task.assistant_response,
                    startTime: task.start_time,
                    endTime: task.end_time,
                    duration: task.duration,
                    status: task.status,
                    validationScore: task.validation_score,
                    isValid: task.is_valid === 1,
                    errorMessage: task.error_message,
                    htmlBlocksCount: task.html_blocks_count,
                    continueClicks: task.continue_clicks || 0,
                    createdAt: task.created_at
                })),
                pendingActions: pendingActions,
                summary: {
                    totalTasks: tasks.length,
                    completedTasks: tasks.filter(t => t.status === 'completed').length,
                    failedTasks: tasks.filter(t => t.status === 'failed').length,
                    avgDuration: tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / (tasks.length || 1),
                    avgValidationScore: tasks.reduce((sum, t) => sum + (t.validation_score || 0), 0) / (tasks.length || 1),
                    totalContinueClicks: tasks.reduce((sum, t) => sum + (t.continue_clicks || 0), 0),
                    totalResponseLength: tasks.reduce((sum, t) => sum + (t.assistant_response?.length || 0), 0)
                }
            };

            if (format === 'json') {
                res.json({
                    success: true,
                    data: exportData
                });
            } else if (format === 'csv') {
                // Формируем CSV
                const csvRows = [
                    ['ID', 'User Message', 'Assistant Response', 'Start Time', 'End Time', 'Duration (ms)', 'Status', 'Validation Score', 'Is Valid', 'Error Message', 'Continue Clicks']
                ];

                for (const task of exportData.tasks) {
                    csvRows.push([
                        task.id,
                        `"${task.userMessage.replace(/"/g, '""')}"`,
                        `"${(task.assistantResponse || '').replace(/"/g, '""').substring(0, 1000)}"`,
                        new Date(task.startTime).toISOString(),
                        task.endTime ? new Date(task.endTime).toISOString() : '',
                        task.duration || '',
                        task.status,
                        task.validationScore || '',
                        task.isValid ? 'Yes' : 'No',
                        `"${(task.errorMessage || '').replace(/"/g, '""')}"`,
                        task.continueClicks || 0
                    ]);
                }

                const csvContent = csvRows.map(row => row.join(',')).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=session_${sessionId}_export.csv`);
                res.send(csvContent);
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Unsupported format. Use json or csv'
                });
            }
        } catch (error) {
            console.error('[TaskController] Error exporting session tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/tasks/:id
     * Удалить задачу
     */
    async deleteTask(req, res) {
        try {
            const { id } = req.params;

            // Проверяем существование задачи
            const task = await TaskModel.getById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            const result = await TaskModel.delete(id);

            // Обновляем статистику сессии
            if (task.session_id) {
                await TaskModel.updateSessionStats(task.session_id);
            }

            res.json({
                success: true,
                message: 'Task deleted successfully',
                data: { id, sessionId: task.session_id }
            });
        } catch (error) {
            console.error('[TaskController] Error deleting task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/tasks/batch
     * Массовое сохранение задач
     */
    async saveBatchTasks(req, res) {
        try {
            const { tasks, sessionId } = req.body;

            if (!Array.isArray(tasks) || tasks.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'tasks array is required and must not be empty'
                });
            }

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            // Проверяем существование сессии
            const sessionExists = await TaskModel.checkSessionExists(sessionId);
            if (!sessionExists) {
                await TaskModel.createSession({
                    id: sessionId,
                    startTime: tasks[0]?.startTime || Date.now(),
                    status: 'active'
                });
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < tasks.length; i++) {
                try {
                    const taskData = { ...tasks[i], sessionId };
                    const result = await TaskService.processCompletedTask(taskData);
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, task: tasks[i]?.id, error: err.message });
                }
            }

            // Обновляем статистику сессии
            await TaskModel.updateSessionStats(sessionId);

            res.status(201).json({
                success: true,
                message: `${results.length} tasks saved successfully`,
                data: {
                    succeeded: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors,
                    sessionId
                }
            });
        } catch (error) {
            console.error('[TaskController] Error saving batch tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ АНАЛИЗА ==========

    analyzeFailureReason(task) {
        const reasons = [];

        if (!task.assistant_response || task.assistant_response.length === 0) {
            reasons.push({
                type: 'no_response',
                description: 'Ответ не получен от сервера',
                severity: 'high'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            reasons.push({
                type: 'low_validation',
                description: `Низкая оценка валидации ответа: ${task.validation_score}/100`,
                severity: 'medium'
            });
        }

        if (task.duration && task.duration > 60000) {
            reasons.push({
                type: 'timeout',
                description: `Превышено время ожидания ответа: ${(task.duration / 1000).toFixed(1)} сек`,
                severity: 'high'
            });
        }

        if (task.error_message) {
            reasons.push({
                type: 'error_message',
                description: task.error_message,
                severity: 'high'
            });
        }

        if (task.continue_clicks && task.continue_clicks > 2) {
            reasons.push({
                type: 'multiple_continues',
                description: `Требовалось ${task.continue_clicks} нажатий Continue для получения полного ответа`,
                severity: 'low'
            });
        }

        if (reasons.length === 0) {
            reasons.push({
                type: 'unknown',
                description: 'Неизвестная причина',
                severity: 'medium'
            });
        }

        return reasons;
    },

    getRecommendationsForFailure(task) {
        const recommendations = [];

        if (!task.assistant_response || task.assistant_response.length === 0) {
            recommendations.push({
                priority: 1,
                action: 'reload_page',
                description: 'Перезагрузите страницу чата и повторите запрос'
            });
            recommendations.push({
                priority: 2,
                action: 'check_connection',
                description: 'Проверьте соединение с интернетом'
            });
            recommendations.push({
                priority: 3,
                action: 'retry_request',
                description: 'Отправьте запрос повторно через 30 секунд'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            recommendations.push({
                priority: 1,
                action: 'refine_query',
                description: 'Уточните формулировку запроса, сделайте его более конкретным'
            });
            recommendations.push({
                priority: 2,
                action: 'break_down',
                description: 'Разбейте сложный вопрос на несколько простых'
            });
            recommendations.push({
                priority: 3,
                action: 'add_context',
                description: 'Добавьте больше контекста в запрос'
            });
        }

        if (task.duration && task.duration > 60000) {
            recommendations.push({
                priority: 1,
                action: 'reduce_scope',
                description: 'Уменьшите объем запроса или ограничьте область поиска'
            });
            recommendations.push({
                priority: 2,
                action: 'try_later',
                description: 'Попробуйте отправить запрос позже, когда сервер менее загружен'
            });
            recommendations.push({
                priority: 3,
                action: 'increase_timeout',
                description: 'Увеличьте таймаут ожидания ответа в конфигурации'
            });
        }

        if (task.continue_clicks && task.continue_clicks > 2) {
            recommendations.push({
                priority: 2,
                action: 'concise_request',
                description: 'Попросите ассистента быть более кратким'
            });
            recommendations.push({
                priority: 3,
                action: 'chunk_request',
                description: 'Разделите запрос на несколько частей'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 2,
                action: 'contact_support',
                description: 'Обратитесь в службу поддержки DeepSeek с деталями ошибки'
            });
        }

        return recommendations.sort((a, b) => a.priority - b.priority);
    },

    getFailureSeverity(task) {
        if (!task.assistant_response || task.assistant_response.length === 0) return 'critical';
        if (task.duration && task.duration > 120000) return 'critical';
        if (task.validation_score && task.validation_score < 30) return 'high';
        if (task.validation_score && task.validation_score < 60) return 'medium';
        if (task.continue_clicks && task.continue_clicks > 3) return 'medium';
        return 'low';
    },

    canAutoFix(task) {
        if (!task.assistant_response || task.assistant_response.length === 0) return true;
        if (task.duration && task.duration > 60000) return true;
        if (task.validation_score && task.validation_score < 40) return false;
        return false;
    },

    groupFailuresByReason(tasks) {
        const reasons = {};

        tasks.forEach(task => {
            if (!task.assistant_response || task.assistant_response.length === 0) {
                reasons['no_response'] = (reasons['no_response'] || 0) + 1;
            } else if (task.validation_score && task.validation_score < 50) {
                reasons['low_validation'] = (reasons['low_validation'] || 0) + 1;
            } else if (task.duration && task.duration > 60000) {
                reasons['timeout'] = (reasons['timeout'] || 0) + 1;
            } else if (task.error_message) {
                reasons['error'] = (reasons['error'] || 0) + 1;
            } else {
                reasons['unknown'] = (reasons['unknown'] || 0) + 1;
            }
        });

        return Object.entries(reasons).map(([reason, count]) => ({ reason, count }));
    },

    groupFailuresBySeverity(tasks) {
        const severities = { low: 0, medium: 0, high: 0, critical: 0 };

        tasks.forEach(task => {
            const severity = this.getFailureSeverity(task);
            severities[severity]++;
        });

        return severities;
    },

    calculateResponseQuality(response) {
        if (!response) return 0;

        let score = 0;

        // Длина ответа (0-25 баллов)
        if (response.length > 1000) score += 25;
        else if (response.length > 500) score += 20;
        else if (response.length > 200) score += 15;
        else if (response.length > 100) score += 10;
        else if (response.length > 20) score += 5;

        // Наличие структуры (0-20 баллов)
        if (/\n\s*[-*•]\s/.test(response)) score += 10;
        if (/^#{1,3}\s/m.test(response)) score += 10;

        // Наличие кода (0-20 баллов)
        if (/```[\s\S]*?```/.test(response)) score += 20;
        else if (/`[^`]+`/.test(response)) score += 10;

        // Наличие завершающей пунктуации (0-10 баллов)
        if (/[.!?]$/.test(response.trim())) score += 10;

        // Отсутствие маркеров ошибок (0-15 баллов)
        if (!/error|ошибка|извините|sorry|cannot|не могу/i.test(response)) score += 15;
        else if (!/error|ошибка/i.test(response)) score += 5;

        // Наличие полезных элементов (0-10 баллов)
        if (/\d+\.\s+[A-ZА-Я]/.test(response)) score += 5; // Нумерованные списки
        if(/\*\*[^*]+\*\*/.test(response)) score += 5; // Жирный текст

        return Math.min(100, score);
    },

    calculateRelevanceScore(query, userMessage, assistantResponse) {
        if (!query || (!userMessage && !assistantResponse)) return 0;

        let score = 0;
        const queryLower = query.toLowerCase();

        // Проверка в сообщении пользователя
        if (userMessage) {
            const userLower = userMessage.toLowerCase();
            if (userLower.includes(queryLower)) {
                score += 50;
                // Чем точнее совпадение, тем выше балл
                if (userLower === queryLower) score += 20;
                else if (userLower.includes(` ${queryLower} `)) score += 10;
            }
        }

        // Проверка в ответе ассистента
        if (assistantResponse) {
            const responseLower = assistantResponse.toLowerCase();
            const words = queryLower.split(/\s+/);
            const matchedWords = words.filter(word => responseLower.includes(word)).length;
            if (words.length > 0) {
                score += (matchedWords / words.length) * 30;
            }
        }

        return Math.min(100, score);
    },

    calculateCompletenessScore(response) {
        if (!response) return 0;

        let score = 0;

        // Проверка на обрывание предложения (0-30 баллов)
        if (/[.!?]$/.test(response.trim())) {
            score += 30;
        } else if (/[a-zа-я]$/i.test(response.trim())) {
            score -= 20;
        }

        // Проверка на наличие полных предложений (0-30 баллов)
        const sentences = response.match(/[^.!?]+[.!?]+/g);
        if (sentences && sentences.length >= 3) {
            score += 30;
        } else if (sentences && sentences.length >= 2) {
            score += 20;
        } else if (sentences && sentences.length === 1) {
            score += 10;
        }

        // Проверка на наличие вступления и заключения (0-40 баллов)
        const firstLine = response.trim().split(/\n/)[0] || '';
        const lastLine = response.trim().split(/\n/).pop() || '';

        if (/^(Вот|Here is|Согласно|Based on|Давайте|Let's)/i.test(firstLine)) {
            score += 20;
        }
        if(/^(Таким образом|В итоге|Итак|Therefore|So|Thus|В заключение)/i.test(lastLine)) {
            score += 20;
        }

        return Math.min(100, score);
    },

    calculateReadabilityScore(response) {
        if (!response) return 0;

        let score = 50; // Базовая оценка

        // Средняя длина предложения (идеально 15-20 слов)
        const sentences = response.split(/[.!?]+/);
        const avgWordsPerSentence = sentences.reduce((sum, s) =>
            sum + s.trim().split(/\s+/).length, 0) / (sentences.length || 1);

        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
            score += 20;
        } else if (avgWordsPerSentence > 30) {
            score -= 10;
        }

        // Наличие абзацев
        if (response.includes('\n\n')) {
            score += 15;
        } else if (response.includes('\n')) {
            score += 5;
        }

        // Разнообразие слов
        const words = response.toLowerCase().match(/[а-яa-z]+/g) || [];
        const uniqueWords = new Set(words);
        const diversity = uniqueWords.size / (words.length || 1);
        if (diversity > 0.6) score += 15;
        else if (diversity > 0.4) score += 5;

        return Math.min(100, Math.max(0, score));
    },

    async calculateUniquenessScore(response) {
        if (!response) return 0;

        // Простая эвристика для уникальности
        let score = 70; // Базовая оценка

        // Проверка на повторяющиеся фразы
        const phrases = response.match(/(.{20,}?)\1+/g);
        if (phrases) {
            score -= Math.min(30, phrases.length * 10);
        }

        // Проверка на шаблонные фразы
        const templatePhrases = [
            'извините', 'sorry', 'не могу ответить', 'cannot answer',
            'пожалуйста, уточните', 'please clarify', 'к сожалению'
        ];

        const templateCount = templatePhrases.filter(phrase =>
            response.toLowerCase().includes(phrase)
        ).length;

        score -= templateCount * 10;

        return Math.max(0, Math.min(100, score));
    },

    extractKeyTopics(response) {
        if (!response) return [];

        const topics = [];
        const commonWords = new Set(['это', 'что', 'как', 'для', 'на', 'в', 'по', 'с', 'и', 'а', 'но', 'или', 'так', 'же', 'будет', 'может', 'нужно', 'можно']);

        // Извлечение ключевых слов
        const words = response.toLowerCase().match(/[а-яa-z]{4,}/g) || [];
        const wordFrequency = {};

        words.forEach(word => {
            if (!commonWords.has(word)) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });

        // Берем топ-5 ключевых слов
        const sortedWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        sortedWords.forEach(([word, count]) => {
            topics.push({ word, count, relevance: Math.min(100, (count / (words.length || 1)) * 100) });
        });

        // Поиск именованных сущностей (простая эвристика)
        const capitalWords = response.match(/[A-Z][a-z]+/g) || [];
        const uniqueCapitals = [...new Set(capitalWords)];
        uniqueCapitals.slice(0, 3).forEach(entity => {
            topics.push({ word: entity, type: 'entity', relevance: 80 });
        });

        return topics.slice(0, 10);
    },

    getWordStats(response) {
        if (!response) {
            return { totalWords: 0, uniqueWords: 0, avgWordLength: 0, sentences: 0 };
        }

        const words = response.match(/[а-яa-z]+/gi) || [];
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);

        return {
            totalWords: words.length,
            uniqueWords: uniqueWords.size,
            avgWordLength: parseFloat(avgWordLength.toFixed(1)),
            sentences: sentences.length,
            avgWordsPerSentence: parseFloat((words.length / (sentences.length || 1)).toFixed(1))
        };
    }
};
```

---

### `../../Directory/11/backend/database/db.js`
```javascript
// database/db.js - Полная версия с обновлениями
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Создаем директорию для БД если её нет
        const dbDir = path.dirname(config.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(config.dbPath);

        // Включаем foreign keys
        this.db.pragma('foreign_keys = ON');

        // Оптимизация производительности
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('temp_store = MEMORY');

        this.createTables();
        this.createIndexes();
        this.createTriggers();
        this.isInitialized = true;

        console.log('[DB] Database initialized successfully at:', config.dbPath);
    }

    createTables() {
        // Таблица сессий
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                total_tasks INTEGER DEFAULT 0,
                completed_tasks INTEGER DEFAULT 0,
                failed_tasks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица задач (сообщение пользователя + ответ чата)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                assistant_response TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                duration INTEGER,
                status TEXT DEFAULT 'pending',
                validation_score INTEGER,
                is_valid INTEGER DEFAULT 0,
                error_message TEXT,
                html_blocks_count INTEGER DEFAULT 0,
                continue_clicks INTEGER DEFAULT 0,
                has_code INTEGER DEFAULT 0,
                word_count INTEGER DEFAULT 0,
                response_length INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для хранения полных ответов ассистента (для анализа)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS assistant_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                response_text TEXT,
                response_length INTEGER,
                word_count INTEGER,
                chunk_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // Таблица неопределенных состояний (pending actions)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS pending_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                session_id TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                severity TEXT DEFAULT 'medium',
                suggested_action TEXT,
                details TEXT,
                auto_resolved INTEGER DEFAULT 0,
                resolution_method TEXT,
                detected_at INTEGER NOT NULL,
                resolved_at INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для аналитики
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                total_tasks INTEGER,
                success_rate REAL,
                avg_response_time REAL,
                total_pending_actions INTEGER,
                avg_validation_score REAL,
                total_continue_clicks INTEGER,
                tasks_with_code INTEGER,
                date DATE DEFAULT CURRENT_DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для метрик производительности
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                metric_value REAL,
                task_id TEXT,
                session_id TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
            )
        `);

        // Таблица для логов ошибок
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_type TEXT NOT NULL,
                error_message TEXT,
                stack_trace TEXT,
                task_id TEXT,
                session_id TEXT,
                context TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
            )
        `);

        // Таблица для отслеживания изменений (аудит)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_by TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица для кэширования результатов анализа
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS analysis_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                cache_value TEXT NOT NULL,
                expires_at INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    createIndexes() {
        // Индексы для таблицы tasks
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
            CREATE INDEX IF NOT EXISTS idx_tasks_duration ON tasks(duration);
            CREATE INDEX IF NOT EXISTS idx_tasks_validation_score ON tasks(validation_score);
            CREATE INDEX IF NOT EXISTS idx_tasks_is_valid ON tasks(is_valid);
            CREATE INDEX IF NOT EXISTS idx_tasks_has_code ON tasks(has_code);
            CREATE INDEX IF NOT EXISTS idx_tasks_continue_clicks ON tasks(continue_clicks);
        `);

        // Индексы для таблицы pending_actions
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_pending_session ON pending_actions(session_id);
            CREATE INDEX IF NOT EXISTS idx_pending_task ON pending_actions(task_id);
            CREATE INDEX IF NOT EXISTS idx_pending_type ON pending_actions(type);
            CREATE INDEX IF NOT EXISTS idx_pending_severity ON pending_actions(severity);
            CREATE INDEX IF NOT EXISTS idx_pending_auto_resolved ON pending_actions(auto_resolved);
            CREATE INDEX IF NOT EXISTS idx_pending_detected_at ON pending_actions(detected_at);
        `);

        // Индексы для таблицы assistant_responses
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_assistant_task ON assistant_responses(task_id);
            CREATE INDEX IF NOT EXISTS idx_assistant_created_at ON assistant_responses(created_at);
        `);

        // Индексы для таблицы sessions
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
            CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
        `);

        // Индексы для таблицы analytics
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
        `);

        // Индексы для таблицы performance_metrics
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_metrics_name ON performance_metrics(metric_name);
            CREATE INDEX IF NOT EXISTS idx_metrics_session ON performance_metrics(session_id);
            CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON performance_metrics(timestamp);
        `);

        // Индексы для таблицы error_logs
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_errors_type ON error_logs(error_type);
            CREATE INDEX IF NOT EXISTS idx_errors_session ON error_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON error_logs(timestamp);
        `);

        // Индексы для таблицы audit_log
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
        `);

        // Составные индексы для сложных запросов
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_tasks_session_status ON tasks(session_id, status);
            CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at);
            CREATE INDEX IF NOT EXISTS idx_pending_session_resolved ON pending_actions(session_id, auto_resolved);
        `);
    }

    createTriggers() {
        // Триггер для обновления updated_at в tasks
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
            AFTER UPDATE ON tasks
            BEGIN
                UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);

        // Триггер для обновления updated_at в sessions
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp 
            AFTER UPDATE ON sessions
            BEGIN
                UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);

        // Триггер для обновления статистики сессии при добавлении задачи
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_session_stats_on_insert
            AFTER INSERT ON tasks
            BEGIN
                UPDATE sessions 
                SET total_tasks = total_tasks + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.session_id;
            END
        `);

        // Триггер для обновления статистики сессии при изменении статуса задачи
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_session_stats_on_status_change
            AFTER UPDATE OF status ON tasks
            WHEN OLD.status != NEW.status
            BEGIN
                UPDATE sessions 
                SET 
                    completed_tasks = (
                        SELECT COUNT(*) FROM tasks 
                        WHERE session_id = NEW.session_id AND status = 'completed'
                    ),
                    failed_tasks = (
                        SELECT COUNT(*) FROM tasks 
                        WHERE session_id = NEW.session_id AND status = 'failed'
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.session_id;
            END
        `);

        // Триггер для аудита изменений в tasks
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS audit_tasks_update
            AFTER UPDATE ON tasks
            BEGIN
                INSERT INTO audit_log (entity_type, entity_id, action, old_value, new_value, timestamp)
                VALUES ('task', NEW.id, 'UPDATE', 
                    json_object('status', OLD.status, 'validation_score', OLD.validation_score, 'is_valid', OLD.is_valid),
                    json_object('status', NEW.status, 'validation_score', NEW.validation_score, 'is_valid', NEW.is_valid),
                    unixepoch());
            END
        `);

        // Триггер для автоматического создания аналитики при завершении сессии
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS auto_create_analytics
            AFTER UPDATE OF status ON sessions
            WHEN NEW.status = 'completed' AND OLD.status != 'completed'
            BEGIN
                INSERT INTO analytics (session_id, total_tasks, success_rate, avg_response_time, total_pending_actions, avg_validation_score, total_continue_clicks, tasks_with_code)
                SELECT 
                    NEW.id,
                    COUNT(t.id),
                    AVG(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) * 100,
                    AVG(t.duration),
                    COUNT(p.id),
                    AVG(t.validation_score),
                    SUM(t.continue_clicks),
                    SUM(t.has_code)
                FROM tasks t
                LEFT JOIN pending_actions p ON t.id = p.task_id
                WHERE t.session_id = NEW.id;
            END
        `);
    }

    // Методы для работы с кэшем
    getCache(key) {
        const stmt = this.db.prepare(`
            SELECT cache_value FROM analysis_cache 
            WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > unixepoch())
        `);
        const result = stmt.get(key);
        if (result) {
            return JSON.parse(result.cache_value);
        }
        return null;
    }

    setCache(key, value, ttlSeconds = 3600) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO analysis_cache (cache_key, cache_value, expires_at)
            VALUES (?, ?, CASE WHEN ? > 0 THEN unixepoch() + ? ELSE NULL END)
        `);
        const expiresIn = ttlSeconds > 0 ? ttlSeconds : null;
        return stmt.run(key, JSON.stringify(value), expiresIn, expiresIn);
    }

    clearCache(keyPattern = null) {
        if (keyPattern) {
            const stmt = this.db.prepare(`DELETE FROM analysis_cache WHERE cache_key LIKE ?`);
            return stmt.run(`%${keyPattern}%`);
        } else {
            const stmt = this.db.prepare(`DELETE FROM analysis_cache`);
            return stmt.run();
        }
    }

    // Методы для логирования ошибок
    logError(errorData) {
        const stmt = this.db.prepare(`
            INSERT INTO error_logs (error_type, error_message, stack_trace, task_id, session_id, context, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            errorData.type,
            errorData.message,
            errorData.stack,
            errorData.taskId,
            errorData.sessionId,
            errorData.context ? JSON.stringify(errorData.context) : null,
            Date.now()
        );
    }

    getErrors(filters = {}, limit = 100) {
        let query = `SELECT * FROM error_logs WHERE 1=1`;
        const params = [];

        if (filters.type) {
            query += ` AND error_type = ?`;
            params.push(filters.type);
        }
        if (filters.sessionId) {
            query += ` AND session_id = ?`;
            params.push(filters.sessionId);
        }
        if (filters.fromDate) {
            query += ` AND timestamp >= ?`;
            params.push(filters.fromDate);
        }
        if (filters.toDate) {
            query += ` AND timestamp <= ?`;
            params.push(filters.toDate);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    // Методы для метрик производительности
    saveMetric(metricName, metricValue, taskId = null, sessionId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO performance_metrics (metric_name, metric_value, task_id, session_id, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(metricName, metricValue, taskId, sessionId, Date.now());
    }

    getMetrics(metricName, sessionId = null, limit = 100) {
        let query = `SELECT * FROM performance_metrics WHERE metric_name = ?`;
        const params = [metricName];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    getAverageMetric(metricName, sessionId = null, periodHours = 24) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);

        let query = `SELECT AVG(metric_value) as avg_value FROM performance_metrics WHERE metric_name = ? AND timestamp > ?`;
        const params = [metricName, since];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        const stmt = this.db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_value || 0;
    }

    // Вспомогательные методы
    getDb() {
        return this.db;
    }

    isReady() {
        return this.isInitialized && this.db !== null;
    }

    getStats() {
        const stats = {
            database: {
                path: config.dbPath,
                size: 0,
                tables: {}
            },
            counts: {}
        };

        // Размер базы данных
        try {
            const stat = fs.statSync(config.dbPath);
            stats.database.size = stat.size;
        } catch (e) {
            stats.database.size = 0;
        }

        // Количество записей в таблицах
        const tables = ['sessions', 'tasks', 'assistant_responses', 'pending_actions', 'analytics'];
        for (const table of tables) {
            try {
                const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
                stats.counts[table] = stmt.get().count;
            } catch (e) {
                stats.counts[table] = 0;
            }
        }

        return stats;
    }

    vacuum() {
        this.db.exec('VACUUM');
        console.log('[DB] VACUUM completed');
    }

    backup(backupPath) {
        this.db.backup(backupPath, {
            progress: (pages) => {
                console.log(`[DB] Backup progress: ${pages} pages copied`);
            }
        });
        console.log(`[DB] Backup saved to: ${backupPath}`);
    }

    close() {
        if (this.db) {
            // Сохраняем финальную статистику
            this.vacuum();
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('[DB] Database connection closed');
        }
    }

    // Очистка старых данных
    cleanup(olderThanDays = 30) {
        const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        // Удаляем старые сессии (каскадно удалятся связанные записи)
        const stmt = this.db.prepare(`DELETE FROM sessions WHERE start_time < ? AND status = 'completed'`);
        const result = stmt.run(cutoffDate);

        // Очищаем кэш
        this.clearCache();

        // Очищаем старые метрики
        const metricsStmt = this.db.prepare(`DELETE FROM performance_metrics WHERE timestamp < ?`);
        metricsStmt.run(cutoffDate);

        // Очищаем старые логи ошибок
        const logsStmt = this.db.prepare(`DELETE FROM error_logs WHERE timestamp < ?`);
        logsStmt.run(cutoffDate);

        console.log(`[DB] Cleanup completed: removed ${result.changes} old sessions`);
        return result.changes;
    }
}

// Создаем и экспортируем экземпляр
export const dbManager = new DatabaseManager();
export const db = dbManager.getDb();

// Экспортируем вспомогательные методы
export const dbHelpers = {
    getCache: (key) => dbManager.getCache(key),
    setCache: (key, value, ttl) => dbManager.setCache(key, value, ttl),
    clearCache: (pattern) => dbManager.clearCache(pattern),
    logError: (error) => dbManager.logError(error),
    saveMetric: (name, value, taskId, sessionId) => dbManager.saveMetric(name, value, taskId, sessionId),
    getMetrics: (name, sessionId, limit) => dbManager.getMetrics(name, sessionId, limit),
    cleanup: (days) => dbManager.cleanup(days),
    vacuum: () => dbManager.vacuum(),
    backup: (path) => dbManager.backup(path),
    getStats: () => dbManager.getStats()
};

// Graceful shutdown
process.on('SIGINT', () => {
    if (dbManager) {
        dbManager.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    if (dbManager) {
        dbManager.close();
    }
    process.exit(0);
});
```

---

### `../../Directory/11/backend/models/PendingAction.js`
```javascript
// models/PendingAction.js - Полная версия с обновлениями
import { db } from '../database/db.js';

export class PendingActionModel {
    /**
     * Сохранить неопределенное состояние
     * @param {Object} actionData - Данные о неопределенном состоянии
     * @returns {Object} Результат выполнения
     */
    static save(actionData) {
        const stmt = db.prepare(`
            INSERT INTO pending_actions (
                task_id, session_id, type, description, severity,
                suggested_action, details, auto_resolved, resolution_method,
                detected_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(
            actionData.taskId || null,
            actionData.sessionId,
            actionData.type,
            actionData.description || null,
            actionData.severity || 'medium',
            actionData.suggestedAction || null,
            actionData.details ? JSON.stringify(actionData.details) : null,
            actionData.autoResolved ? 1 : 0,
            actionData.resolutionMethod || null,
            actionData.detectedAt || Date.now(),
            actionData.resolvedAt || null
        );
    }

    /**
     * Получить все неразрешенные действия
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Список неразрешенных действий
     */
    static getUnresolved(limit = 50) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.status as task_status,
                t.start_time as task_start_time,
                s.start_time as session_start_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.auto_resolved = 0
            ORDER BY
                CASE pa.severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                    END,
                pa.detected_at DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    }

    /**
     * Получить действия по типу
     * @param {string} type - Тип действия
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Список действий
     */
    static getByType(type, limit = 20) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                s.start_time as session_start_time,
                s.end_time as session_end_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.type = ?
            ORDER BY pa.detected_at DESC
                LIMIT ?
        `);
        return stmt.all(type, limit);
    }

    /**
     * Получить статистику по типам
     * @returns {Array} Статистика по типам
     */
    static getStatsByType() {
        const stmt = db.prepare(`
            SELECT
                type,
                severity,
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved,
                MIN(detected_at) as first_occurrence,
                MAX(detected_at) as last_occurrence,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL
                             THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            GROUP BY type, severity
            ORDER BY total DESC
        `);
        const results = stmt.all();

        // Добавляем процентное соотношение
        const totalAll = results.reduce((sum, r) => sum + r.total, 0);
        return results.map(r => ({
            ...r,
            percentage: totalAll > 0 ? ((r.total / totalAll) * 100).toFixed(2) : 0,
            avg_resolution_time_sec: r.avg_resolution_time_ms
                ? (r.avg_resolution_time_ms / 1000).toFixed(2)
                : null
        }));
    }

    /**
     * Получить действия по ID сессии
     * @param {string} sessionId - ID сессии
     * @returns {Array} Список действий
     */
    static getBySessionId(sessionId) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.assistant_response_preview
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
            WHERE pa.session_id = ?
            ORDER BY pa.detected_at DESC
        `);
        return stmt.all(sessionId);
    }

    /**
     * Получить действия по ID задачи
     * @param {string} taskId - ID задачи
     * @returns {Array} Список действий
     */
    static getByTaskId(taskId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions
            WHERE task_id = ?
            ORDER BY detected_at DESC
        `);
        return stmt.all(taskId);
    }

    /**
     * Отметить действие как разрешенное
     * @param {number} id - ID записи
     * @param {string} resolutionMethod - Метод разрешения
     * @returns {Object} Результат выполнения
     */
    static resolve(id, resolutionMethod) {
        const stmt = db.prepare(`
            UPDATE pending_actions
            SET auto_resolved = 1,
                resolution_method = ?,
                resolved_at = ?
            WHERE id = ?
        `);
        return stmt.run(resolutionMethod, Date.now(), id);
    }

    /**
     * Массовое разрешение действий по сессии
     * @param {string} sessionId - ID сессии
     * @param {string} resolutionMethod - Метод разрешения
     * @returns {Object} Результат выполнения
     */
    static resolveBySessionId(sessionId, resolutionMethod) {
        const stmt = db.prepare(`
            UPDATE pending_actions
            SET auto_resolved = 1,
                resolution_method = ?,
                resolved_at = ?
            WHERE session_id = ? AND auto_resolved = 0
        `);
        return stmt.run(resolutionMethod, Date.now(), sessionId);
    }

    /**
     * Получить аналитику по проблемам за период
     * @param {number} since - Временная метка начала периода
     * @returns {Object} Аналитика
     */
    static getAnalyticsSummary(since) {
        // Основная статистика
        const statsStmt = db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved_count,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_severity_count,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity_count,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity_count,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL
                             THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            WHERE detected_at > ?
        `);
        const totals = statsStmt.get(since);

        // Наиболее частый тип проблемы
        const typeStmt = db.prepare(`
            SELECT
                type,
                COUNT(*) as count,
                severity,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type
            ORDER BY count DESC
                LIMIT 1
        `);
        const mostFrequentType = typeStmt.get(since);

        // Динамика по дням
        const dailyStmt = db.prepare(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved
            FROM pending_actions
            WHERE created_at > datetime('now', '-' || ? || ' days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        const daily = dailyStmt.all(7);

        const resolutionRate = totals.total > 0
            ? (totals.resolved_count / totals.total) * 100
            : 0;

        return {
            period: {
                from: new Date(since).toISOString(),
                to: new Date().toISOString()
            },
            total: totals.total,
            resolvedCount: totals.resolved_count,
            unresolvedCount: totals.unresolved_count,
            resolutionRate: resolutionRate.toFixed(2),
            severityBreakdown: {
                critical: totals.critical_severity_count || 0,
                high: totals.high_severity_count || 0,
                medium: totals.medium_severity_count || 0,
                low: totals.low_severity_count || 0
            },
            avgResolutionTimeMs: totals.avg_resolution_time_ms || 0,
            avgResolutionTimeSec: totals.avg_resolution_time_ms
                ? (totals.avg_resolution_time_ms / 1000).toFixed(2)
                : 0,
            mostFrequentType: mostFrequentType || null,
            dailyTrend: daily
        };
    }

    /**
     * Получить детальную информацию о конкретном действии
     * @param {number} id - ID записи
     * @returns {Object|null} Детали действия
     */
    static getById(id) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.assistant_response_preview,
                t.status as task_status,
                t.duration as task_duration,
                s.start_time as session_start_time,
                s.end_time as session_end_time,
                s.status as session_status
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.id = ?
        `);
        return stmt.get(id);
    }

    /**
     * Обновить детали действия
     * @param {number} id - ID записи
     * @param {Object} updates - Обновляемые поля
     * @returns {Object} Результат выполнения
     */
    static update(id, updates) {
        const allowedFields = ['description', 'severity', 'suggested_action', 'details'];
        const setClauses = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                if (field === 'details' && typeof updates[field] === 'object') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
            }
        }

        if (setClauses.length === 0) {
            return { changes: 0 };
        }

        values.push(id);
        const stmt = db.prepare(`UPDATE pending_actions SET ${setClauses.join(', ')} WHERE id = ?`);
        return stmt.run(...values);
    }

    /**
     * Удалить запись
     * @param {number} id - ID записи
     * @returns {Object} Результат выполнения
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM pending_actions WHERE id = ?');
        return stmt.run(id);
    }

    /**
     * Удалить все записи по сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Результат выполнения
     */
    static deleteBySessionId(sessionId) {
        const stmt = db.prepare('DELETE FROM pending_actions WHERE session_id = ?');
        return stmt.run(sessionId);
    }

    /**
     * Удалить старые записи (старше указанного количества дней)
     * @param {number} days - Количество дней
     * @returns {Object} Результат выполнения
     */
    static deleteOld(days = 30) {
        const stmt = db.prepare(`
            DELETE FROM pending_actions
            WHERE created_at < datetime('now', '-' || ? || ' days')
              AND auto_resolved = 1
        `);
        return stmt.run(days);
    }

    /**
     * Получить статистику по сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Статистика
     */
    static getSessionStats(sessionId) {
        const stmt = db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved,
                GROUP_CONCAT(DISTINCT type) as types
            FROM pending_actions
            WHERE session_id = ?
        `);
        return stmt.get(sessionId);
    }

    /**
     * Получить все уникальные типы проблем
     * @returns {Array} Список типов
     */
    static getUniqueTypes() {
        const stmt = db.prepare(`
            SELECT DISTINCT type, COUNT(*) as count
            FROM pending_actions
            GROUP BY type
            ORDER BY count DESC
        `);
        return stmt.all();
    }

    /**
     * Экспорт данных в JSON
     * @param {Object} filters - Фильтры для экспорта
     * @returns {Array} Данные для экспорта
     */
    static exportData(filters = {}) {
        let query = `
            SELECT
                pa.*,
                t.user_message,
                t.status as task_status,
                s.start_time as session_start_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.type) {
            query += ' AND pa.type = ?';
            params.push(filters.type);
        }

        if (filters.severity) {
            query += ' AND pa.severity = ?';
            params.push(filters.severity);
        }

        if (filters.autoResolved !== undefined) {
            query += ' AND pa.auto_resolved = ?';
            params.push(filters.autoResolved ? 1 : 0);
        }

        if (filters.fromDate) {
            query += ' AND pa.detected_at >= ?';
            params.push(new Date(filters.fromDate).getTime());
        }

        if (filters.toDate) {
            query += ' AND pa.detected_at <= ?';
            params.push(new Date(filters.toDate).getTime());
        }

        query += ' ORDER BY pa.detected_at DESC';

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        // Парсим JSON поля
        return results.map(r => ({
            ...r,
            details: r.details ? JSON.parse(r.details) : null
        }));
    }

    /**
     * Получить топ проблем по частоте
     * @param {number} limit - Количество записей
     * @returns {Array} Топ проблем
     */
    static getTopIssues(limit = 10) {
        const stmt = db.prepare(`
            SELECT
                type,
                severity,
                COUNT(*) as occurrences,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen,
                COUNT(DISTINCT session_id) as affected_sessions
            FROM pending_actions
            WHERE auto_resolved = 0
            GROUP BY type, severity
            ORDER BY occurrences DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    }

    /**
     * Получить временную шкалу проблем
     * @param {number} hours - Количество часов
     * @returns {Array} Временная шкала
     */
    static getTimeline(hours = 24) {
        const stmt = db.prepare(`
            SELECT
                strftime('%H:00', datetime(detected_at/1000, 'unixepoch')) as hour,
                type,
                COUNT(*) as count
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY hour, type
            ORDER BY hour DESC
        `);
        const since = Date.now() - (hours * 60 * 60 * 1000);
        const results = stmt.all(since);

        // Группируем по часам
        const timeline = {};
        for (const row of results) {
            if (!timeline[row.hour]) {
                timeline[row.hour] = {};
            }
            timeline[row.hour][row.type] = row.count;
            timeline[row.hour].total = (timeline[row.hour].total || 0) + row.count;
        }

        return timeline;
    }

    /**
     * Получить сводку для дашборда
     * @returns {Object} Сводка для дашборда
     */
    static getDashboardSummary() {
        const currentStmt = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
            FROM pending_actions
            WHERE auto_resolved = 0
        `);
        const current = currentStmt.get();

        const resolvedStmt = db.prepare(`
            SELECT 
                COUNT(*) as total,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL 
                    THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            WHERE auto_resolved = 1
        `);
        const resolved = resolvedStmt.get();

        const byTypeStmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity
            FROM pending_actions
            WHERE auto_resolved = 0
            GROUP BY type, severity
            ORDER BY count DESC
            LIMIT 5
        `);
        const topTypes = byTypeStmt.all();

        return {
            current: {
                total: current?.total || 0,
                critical: current?.critical || 0,
                high: current?.high || 0,
                medium: current?.medium || 0,
                low: current?.low || 0
            },
            resolved: {
                total: resolved?.total || 0,
                avgResolutionTimeMs: resolved?.avg_resolution_time_ms || 0,
                avgResolutionTimeSec: resolved?.avg_resolution_time_ms
                    ? (resolved.avg_resolution_time_ms / 1000).toFixed(2)
                    : 0
            },
            topTypes: topTypes,
            timestamp: Date.now()
        };
    }

    /**
     * Получить частоту возникновения по типам
     * @param {number} hours - Количество часов для анализа
     * @returns {Array} Частота по типам
     */
    static getFrequencyByType(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pending_actions WHERE detected_at > ?)) as percentage
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
        `);
        return stmt.all(since, since);
    }

    /**
     * Получить критические неразрешенные проблемы
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Критические проблемы
     */
    static getCriticalUnresolved(limit = 20) {
        const stmt = db.prepare(`
            SELECT 
                pa.*,
                t.user_message,
                s.start_time as session_start_time
            FROM pending_actions pa
            LEFT JOIN tasks t ON pa.task_id = t.id
            LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.auto_resolved = 0 AND pa.severity = 'critical'
            ORDER BY pa.detected_at DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // ========== НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ СТАТИСТИКИ СЕССИИ ==========

    /**
     * Обновить счетчик pending действий в сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Результат выполнения
     */
    static updateSessionPendingCount(sessionId) {
        const stmt = db.prepare(`
            UPDATE sessions 
            SET metadata = json_set(
                COALESCE(metadata, '{}'), 
                '$.pending_count',
                (SELECT COUNT(*) FROM pending_actions WHERE session_id = ? AND auto_resolved = 0)
            )
            WHERE id = ?
        `);
        return stmt.run(sessionId, sessionId);
    }
}

export default PendingActionModel;
```

---

### `../../Directory/11/backend/models/Task.js`
```javascript
// models/Task.js - Полная версия с обновлениями
import { db } from '../database/db.js';

export class TaskModel {
    // Сохранить задачу (создать или обновить)
    static save(taskData) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO tasks (
                id, session_id, user_message, assistant_response, 
                start_time, end_time, duration, status, 
                validation_score, is_valid, error_message, html_blocks_count,
                continue_clicks, has_code, word_count, response_length
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const wordCount = taskData.assistantResponse
            ? taskData.assistantResponse.split(/\s+/).length
            : 0;

        const hasCode = taskData.assistantResponse
            ? /```[\s\S]*?```|function|class|const|let|var|import|export/.test(taskData.assistantResponse)
            : false;

        return stmt.run(
            taskData.id,
            taskData.sessionId,
            taskData.userMessage,
            taskData.assistantResponse || null,
            taskData.startTime,
            taskData.endTime || null,
            taskData.duration || null,
            taskData.status || 'pending',
            taskData.validationScore || null,
            taskData.isValid ? 1 : 0,
            taskData.errorMessage || null,
            taskData.htmlBlocksCount || 0,
            taskData.continueClicks || 0,
            hasCode ? 1 : 0,
            wordCount,
            taskData.assistantResponse?.length || 0
        );
    }

    // Сохранить полный ответ ассистента
    static saveAssistantResponse(taskId, responseText, chunkCount = 1) {
        const stmt = db.prepare(`
            INSERT INTO assistant_responses (task_id, response_text, response_length, word_count, chunk_count)
            VALUES (?, ?, ?, ?, ?)
        `);

        const wordCount = responseText ? responseText.split(/\s+/).length : 0;

        return stmt.run(
            taskId,
            responseText || null,
            responseText ? responseText.length : 0,
            wordCount,
            chunkCount
        );
    }

    // Обновить ответ ассистента (для потоковой передачи)
    static updateAssistantResponse(taskId, responseText, chunkCount) {
        const stmt = db.prepare(`
            UPDATE assistant_responses 
            SET response_text = ?, response_length = ?, word_count = ?, chunk_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE task_id = ?
        `);

        const wordCount = responseText ? responseText.split(/\s+/).length : 0;

        return stmt.run(
            responseText,
            responseText ? responseText.length : 0,
            wordCount,
            chunkCount,
            taskId
        );
    }

    // Получить задачу по ID
    static getById(taskId) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   ar.chunk_count,
                   ar.created_at as response_created_at,
                   ar.updated_at as response_updated_at,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE t.id = ?
        `);
        return stmt.get(taskId);
    }

    // Получить все задачи сессии
    static getBySessionId(sessionId, limit = 100, offset = 0) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   ar.chunk_count
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.session_id = ?
            ORDER BY t.start_time DESC
            LIMIT ? OFFSET ?
        `);
        return stmt.all(sessionId, limit, offset);
    }

    // Получить задачи с ошибками
    static getFailedTasks(limit = 50, offset = 0) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start,
                   s.id as session_id
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.status = 'failed' OR t.is_valid = 0
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `);
        return stmt.all(limit, offset);
    }

    // Получить задачи с длительным временем ответа
    static getSlowTasks(thresholdMs = 30000, limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.duration > ? AND t.status = 'completed'
            ORDER BY t.duration DESC
            LIMIT ?
        `);
        return stmt.all(thresholdMs, limit);
    }

    // Получить задачи с кодом в ответе
    static getTasksWithCode(limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.has_code = 1
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // Получить задачи по диапазону дат
    static getByDateRange(startDate, endDate, limit = 100) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE datetime(t.created_at) BETWEEN datetime(?) AND datetime(?)
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        return stmt.all(startDate, endDate, limit);
    }

    // Обновить статус задачи
    static updateStatus(taskId, status, validationScore = null, isValid = null, errorMessage = null) {
        const updates = { status };
        if (validationScore !== null) updates.validation_score = validationScore;
        if (isValid !== null) updates.is_valid = isValid ? 1 : 0;
        if (errorMessage !== null) updates.error_message = errorMessage;

        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
        return stmt.run(...values, taskId);
    }

    // Обновить счетчик нажатий Continue
    static updateContinueClicks(taskId, continueClicks) {
        const stmt = db.prepare(`UPDATE tasks SET continue_clicks = ? WHERE id = ?`);
        return stmt.run(continueClicks, taskId);
    }

    // Получить статистику по задачам
    static getStats(sessionId = null) {
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_validation_score,
                SUM(CASE WHEN has_code = 1 THEN 1 ELSE 0 END) as tasks_with_code,
                SUM(continue_clicks) as total_continue_clicks,
                AVG(continue_clicks) as avg_continue_clicks,
                MIN(duration) as min_duration,
                MAX(duration) as max_duration,
                SUM(response_length) as total_response_chars,
                AVG(response_length) as avg_response_chars
            FROM tasks
        `;

        const params = [];
        if (sessionId) {
            query += ' WHERE session_id = ?';
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);

        // Добавляем процент успешных задач
        if (result.total > 0) {
            result.success_rate = ((result.completed / result.total) * 100).toFixed(2);
        } else {
            result.success_rate = 0;
        }

        return result;
    }

    // Получить детальную аналитику по задачам
    static getDetailedAnalytics(sessionId = null, periodHours = 24) {
        const since = new Date(Date.now() - (periodHours * 60 * 60 * 1000)).toISOString();

        let query = `
            SELECT 
                strftime('%H', datetime(t.created_at / 1000, 'unixepoch')) as hour,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score,
                SUM(continue_clicks) as continue_clicks_total
            FROM tasks t
            WHERE datetime(t.created_at / 1000, 'unixepoch') > datetime(?)
        `;

        const params = [since];
        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        query += ' GROUP BY strftime("%H", datetime(t.created_at / 1000, "unixepoch")) ORDER BY hour';

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    // Удалить задачу
    static delete(taskId) {
        // Сначала удаляем связанные ответы
        const deleteResponseStmt = db.prepare('DELETE FROM assistant_responses WHERE task_id = ?');
        deleteResponseStmt.run(taskId);

        // Затем удаляем задачу
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        return stmt.run(taskId);
    }

    // Удалить все задачи сессии
    static deleteBySessionId(sessionId) {
        // Получаем все задачи сессии
        const tasksStmt = db.prepare('SELECT id FROM tasks WHERE session_id = ?');
        const tasks = tasksStmt.all(sessionId);

        // Удаляем ответы для каждой задачи
        const deleteResponseStmt = db.prepare('DELETE FROM assistant_responses WHERE task_id = ?');
        for (const task of tasks) {
            deleteResponseStmt.run(task.id);
        }

        // Удаляем задачи
        const stmt = db.prepare('DELETE FROM tasks WHERE session_id = ?');
        return stmt.run(sessionId);
    }

    // Поиск задач по тексту
    static searchByText(searchTerm, limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.user_message LIKE ? OR ar.response_text LIKE ?
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        const searchPattern = `%${searchTerm}%`;
        return stmt.all(searchPattern, searchPattern, limit);
    }

    // Экспорт задач в JSON
    static exportTasks(sessionId = null, limit = 1000) {
        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
        `;

        const params = [];
        if (sessionId) {
            query += ' WHERE t.session_id = ?';
            params.push(sessionId);
        }

        query += ' ORDER BY t.start_time ASC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        return {
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length,
            sessionId: sessionId,
            tasks: tasks
        };
    }

    // Получить задачи с пагинацией и фильтрацией
    static getTasksWithFilters(options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = null,
            sessionId = null,
            minScore = null,
            hasCode = null,
            fromDate = null,
            toDate = null,
            orderBy = 'created_at',
            orderDir = 'DESC'
        } = options;

        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        if (minScore !== null) {
            query += ' AND t.validation_score >= ?';
            params.push(minScore);
        }

        if (hasCode !== null) {
            query += ' AND t.has_code = ?';
            params.push(hasCode ? 1 : 0);
        }

        if (fromDate) {
            query += ' AND datetime(t.created_at / 1000, "unixepoch") >= datetime(?)';
            params.push(fromDate);
        }

        if (toDate) {
            query += ' AND datetime(t.created_at / 1000, "unixepoch") <= datetime(?)';
            params.push(toDate);
        }

        const validOrderColumns = ['created_at', 'start_time', 'duration', 'validation_score', 'response_length'];
        const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
        const orderDirection = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY t.${orderColumn} ${orderDirection} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        // Получаем общее количество для пагинации
        let countQuery = 'SELECT COUNT(*) as total FROM tasks t WHERE 1=1';
        const countParams = [];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (sessionId) {
            countQuery += ' AND session_id = ?';
            countParams.push(sessionId);
        }

        const countStmt = db.prepare(countQuery);
        const total = countStmt.get(...countParams);

        return {
            tasks: tasks,
            pagination: {
                limit: limit,
                offset: offset,
                total: total?.total || 0,
                hasMore: (offset + limit) < (total?.total || 0)
            }
        };
    }

    // ========== НОВЫЕ МЕТОДЫ ДЛЯ ИСПРАВЛЕНИЯ ОШИБОК ==========

    // Проверить существование сессии
    static checkSessionExists(sessionId) {
        const stmt = db.prepare('SELECT id FROM sessions WHERE id = ?');
        const result = stmt.get(sessionId);
        return !!result;
    }

    // Создать новую сессию
    static createSession(sessionData) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO sessions (id, start_time, end_time, status, total_tasks, completed_tasks, failed_tasks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(
            sessionData.id,
            sessionData.startTime || Date.now(),
            sessionData.endTime || null,
            sessionData.status || 'active',
            sessionData.totalTasks || 0,
            sessionData.completedTasks || 0,
            sessionData.failedTasks || 0
        );
    }

    // Обновить статистику сессии
    static updateSessionStats(sessionId) {
        const stmt = db.prepare(`
            UPDATE sessions 
            SET 
                total_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ?),
                completed_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ? AND status = 'completed'),
                failed_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ? AND status = 'failed'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(sessionId, sessionId, sessionId, sessionId);
    }

    // Получить информацию о сессии
    static getSessionInfo(sessionId) {
        const stmt = db.prepare(`
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `);
        return stmt.get(sessionId);
    }

    // Получить pending действия по ID задачи
    static getPendingActionsByTaskId(taskId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE task_id = ?
            ORDER BY detected_at DESC
        `);
        return stmt.all(taskId);
    }

    // Получить pending действия по ID сессии
    static getPendingActionsBySessionId(sessionId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE session_id = ? 
            ORDER BY detected_at DESC
        `);
        return stmt.all(sessionId);
    }

    // Поиск задач (общий метод)
    static search(searchTerm, field = 'both', limit = 20, offset = 0) {
        let query = `
            SELECT t.*, s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (field === 'userMessage' || field === 'both') {
            query += ` AND t.user_message LIKE ?`;
            params.push(`%${searchTerm}%`);
        }

        if (field === 'assistantResponse' || field === 'both') {
            if (field === 'both') {
                query += ` OR t.assistant_response LIKE ?`;
            } else {
                query += ` AND t.assistant_response LIKE ?`;
            }
            params.push(`%${searchTerm}%`);
        }

        query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    // Получить количество результатов поиска
    static getSearchCount(searchTerm, field = 'both') {
        let query = `
            SELECT COUNT(*) as total
            FROM tasks t
            WHERE 1=1
        `;
        const params = [];

        if (field === 'userMessage' || field === 'both') {
            query += ` AND t.user_message LIKE ?`;
            params.push(`%${searchTerm}%`);
        }

        if (field === 'assistantResponse' || field === 'both') {
            if (field === 'both') {
                query += ` OR t.assistant_response LIKE ?`;
            } else {
                query += ` AND t.assistant_response LIKE ?`;
            }
            params.push(`%${searchTerm}%`);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.total || 0;
    }

    // Получить сводную статистику
    static getSummaryStats(since) {
        const stmt = db.prepare(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_validation_score,
                (SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as failed_rate
            FROM tasks
            WHERE created_at > datetime(?)
        `);
        const result = stmt.get(new Date(since).toISOString());
        return result || {
            total_tasks: 0,
            completed_tasks: 0,
            failed_tasks: 0,
            avg_duration: 0,
            avg_validation_score: 0,
            failed_rate: 0
        };
    }

    // Получить тренды по дням
    static getTrends(days = 7) {
        const stmt = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE created_at > datetime('now', '-' || ? || ' days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        return stmt.all(days);
    }

    // Получить топ проблем
    static getTopIssues(periodHours = 24) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                type,
                severity,
                COUNT(*) as count,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
            LIMIT 10
        `);
        return stmt.all(since);
    }

    // Получить среднюю длину ответа
    static getAvgResponseLength(since) {
        const stmt = db.prepare(`
            SELECT AVG(response_length) as avg_length
            FROM tasks
            WHERE created_at > datetime(?) AND status = 'completed'
        `);
        const result = stmt.get(new Date(since).toISOString());
        return result?.avg_length || 0;
    }
}

// Дополнительный экспорт для статистики
export const TaskStats = {
    // Получить распределение задач по часам
    getHourlyDistribution(sessionId = null, days = 7) {
        const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();

        let query = `
            SELECT
                strftime('%Y-%m-%d %H:00', datetime(t.created_at / 1000, 'unixepoch')) as hour,
                COUNT(*) as count,
                AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as success_rate
            FROM tasks t
            WHERE datetime(t.created_at / 1000, 'unixepoch') > datetime(?)
        `;

        const params = [since];
        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        query += ' GROUP BY hour ORDER BY hour';

        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    // Получить топ самых длинных задач
    getTopLongestTasks(limit = 10) {
        const stmt = db.prepare(`
            SELECT t.id, t.user_message, t.duration, t.status, t.validation_score,
                   substr(t.user_message, 1, 100) as message_preview
            FROM tasks t
            WHERE t.duration IS NOT NULL
            ORDER BY t.duration DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    },

    // Получить топ задач с низкой оценкой валидации
    getTopLowScoreTasks(limit = 10) {
        const stmt = db.prepare(`
            SELECT t.id, t.user_message, t.validation_score, t.status,
                   substr(t.user_message, 1, 100) as message_preview
            FROM tasks t
            WHERE t.validation_score IS NOT NULL AND t.status = 'completed'
            ORDER BY t.validation_score ASC
                LIMIT ?
        `);
        return stmt.all(limit);
    }
};

export default TaskModel;
```

---

### `../../Directory/11/backend/server.js`
```javascript
// server.js - Главный файл сервера для приема и анализа задач от chatMonitor.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import taskRoutes from './routes/tasks.js';
import pendingRoutes from './routes/pending.js';
import { AnalyzerService } from './services/analyzerService.js';
import { db } from './database/db.js';

const app = express();

// ========== MIDDLEWARE ==========

app.use(helmet({
    contentSecurityPolicy: false, // Для упрощения разработки
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(config.logLevel === 'debug' ? 'dev' : 'combined'));

// Статическая документация
app.use('/docs', express.static('docs'));

// ========== МАРШРУТЫ API ==========

// Маршруты для задач
app.use('/api/tasks', taskRoutes);

// Маршруты для неопределенных состояний
app.use('/api/pending', pendingRoutes);

// ========== ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ ==========

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        endpoints: {
            tasks: '/api/tasks',
            pending: '/api/pending',
            analytics: '/api/analytics',
            sessions: '/api/sessions'
        }
    });
});

// GET /api/analytics - общая аналитика
app.get('/api/analytics', (req, res) => {
    try {
        const period = parseInt(req.query.period) || 24;
        const analytics = AnalyzerService.getOverallAnalytics(period);
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/analytics/detailed - детальная аналитика
app.get('/api/analytics/detailed', (req, res) => {
    try {
        const period = parseInt(req.query.period) || 24;
        const since = Date.now() - (period * 60 * 60 * 1000);

        // Статистика по типам ошибок
        const pendingStats = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity,
                AVG(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) * 100 as resolve_rate
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
        `).all(since);

        // Статистика по времени ответа
        const responseStats = db.prepare(`
            SELECT 
                AVG(duration) as avg_duration,
                MIN(duration) as min_duration,
                MAX(duration) as max_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE start_time > ? AND status = 'completed'
        `).get(since);

        // Статистика по сессиям
        const sessionStats = db.prepare(`
            SELECT 
                COUNT(*) as total_sessions,
                AVG(total_tasks) as avg_tasks_per_session,
                AVG(completed_tasks) as avg_completed_per_session,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
            FROM sessions
            WHERE start_time > ?
        `).get(since);

        res.json({
            success: true,
            data: {
                period: `${period} hours`,
                pending_actions: pendingStats,
                response_times: responseStats,
                sessions: sessionStats,
                generated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Analytics Detailed] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/sessions - список сессий
app.get('/api/sessions', (req, res) => {
    try {
        const { limit = 50, offset = 0, status = null } = req.query;

        let query = `
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                   COUNT(DISTINCT pa.id) as pending_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            LEFT JOIN pending_actions pa ON s.id = pa.session_id AND pa.auto_resolved = 0
        `;

        const params = [];
        if (status) {
            query += ' WHERE s.status = ?';
            params.push(status);
        }

        query += ` GROUP BY s.id ORDER BY s.start_time DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const sessions = db.prepare(query).all(...params);

        // Общая статистика
        const totalStmt = db.prepare('SELECT COUNT(*) as total FROM sessions');
        const total = totalStmt.get().total;

        res.json({
            success: true,
            data: sessions,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: total
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Sessions] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/sessions/:id - детали сессии
app.get('/api/sessions/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Получаем сессию
        const sessionStmt = db.prepare(`
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `);
        const session = sessionStmt.get(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        // Получаем задачи сессии
        const tasksStmt = db.prepare(`
            SELECT t.*, ar.response_text as full_response, ar.response_length, ar.word_count
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.session_id = ?
            ORDER BY t.start_time ASC
        `);
        const tasks = tasksStmt.all(id);

        // Получаем неопределенные состояния сессии
        const pendingStmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE session_id = ? 
            ORDER BY detected_at DESC
        `);
        const pending = pendingStmt.all(id);

        // Аналитика сессии
        const analytics = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            failedTasks: tasks.filter(t => t.status === 'failed').length,
            averageResponseTime: tasks.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.length / 1000,
            averageValidationScore: tasks.filter(t => t.validation_score).reduce((sum, t) => sum + (t.validation_score || 0), 0) / tasks.length,
            totalPendingActions: pending.length,
            unresolvedPending: pending.filter(p => !p.auto_resolved).length
        };

        res.json({
            success: true,
            data: {
                session,
                tasks,
                pending,
                analytics,
                taskCount: tasks.length,
                pendingCount: pending.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Session Details] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/sessions/:id - удалить сессию
app.delete('/api/sessions/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем существование
        const checkStmt = db.prepare('SELECT id FROM sessions WHERE id = ?');
        const exists = checkStmt.get(id);

        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        // Удаляем (каскадно удалятся связанные задачи и pending действия)
        const deleteStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
        const result = deleteStmt.run(id);

        res.json({
            success: true,
            message: 'Session deleted successfully',
            affected: result.changes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Delete Session] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats - общая статистика
app.get('/api/stats', (req, res) => {
    try {
        // Общее количество задач
        const tasksCount = db.prepare('SELECT COUNT(*) as total FROM tasks').get();

        // Количество завершенных задач
        const completedTasks = db.prepare(`
            SELECT COUNT(*) as total FROM tasks WHERE status = 'completed'
        `).get();

        // Количество failed задач
        const failedTasks = db.prepare(`
            SELECT COUNT(*) as total FROM tasks WHERE status = 'failed'
        `).get();

        // Количество неопределенных состояний
        const pendingCount = db.prepare(`
            SELECT COUNT(*) as total FROM pending_actions WHERE auto_resolved = 0
        `).get();

        // Количество разрешенных
        const resolvedPending = db.prepare(`
            SELECT COUNT(*) as total FROM pending_actions WHERE auto_resolved = 1
        `).get();

        // Среднее время ответа
        const avgResponseTime = db.prepare(`
            SELECT AVG(duration) as avg FROM tasks WHERE duration IS NOT NULL
        `).get();

        // Средний score валидации
        const avgValidationScore = db.prepare(`
            SELECT AVG(validation_score) as avg FROM tasks WHERE validation_score IS NOT NULL
        `).get();

        res.json({
            success: true,
            data: {
                tasks: {
                    total: tasksCount.total,
                    completed: completedTasks.total,
                    failed: failedTasks.total,
                    success_rate: tasksCount.total > 0 ? ((completedTasks.total / tasksCount.total) * 100).toFixed(2) : 0
                },
                pending_actions: {
                    total: pendingCount.total + resolvedPending.total,
                    unresolved: pendingCount.total,
                    resolved: resolvedPending.total,
                    resolve_rate: (pendingCount.total + resolvedPending.total) > 0
                        ? ((resolvedPending.total / (pendingCount.total + resolvedPending.total)) * 100).toFixed(2)
                        : 0
                },
                performance: {
                    avg_response_time_ms: Math.round(avgResponseTime.avg || 0),
                    avg_response_time_sec: ((avgResponseTime.avg || 0) / 1000).toFixed(2),
                    avg_validation_score: Math.round(avgValidationScore.avg || 0)
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Stats] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/search - поиск по задачам
app.get('/api/search', (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }

        const searchTerm = `%${q}%`;

        const results = db.prepare(`
            SELECT t.id, t.user_message, t.assistant_response, t.status, 
                   t.validation_score, t.duration, t.created_at,
                   s.id as session_id
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            WHERE t.user_message LIKE ? OR t.assistant_response LIKE ?
            ORDER BY t.created_at DESC
            LIMIT ?
        `).all(searchTerm, searchTerm, parseInt(limit));

        res.json({
            success: true,
            data: results,
            query: q,
            total: results.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Search] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/export - экспорт всех данных
app.get('/api/export', (req, res) => {
    try {
        const format = req.query.format || 'json';

        const sessions = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC').all();
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        const pending = db.prepare('SELECT * FROM pending_actions ORDER BY detected_at DESC').all();
        const responses = db.prepare('SELECT * FROM assistant_responses ORDER BY created_at DESC').all();

        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            stats: {
                sessions: sessions.length,
                tasks: tasks.length,
                pending: pending.length,
                responses: responses.length
            },
            data: {
                sessions,
                tasks,
                pending,
                responses
            }
        };

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=chat-monitor-export-${Date.now()}.json`);
            res.json(exportData);
        } else {
            res.status(400).json({
                success: false,
                error: 'Unsupported format. Use format=json'
            });
        }
    } catch (error) {
        console.error('[Export] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========== ОБРАБОТКА ОШИБОК ==========

// 404 - Not Found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.url}`,
        timestamp: new Date().toISOString()
    });
});

// Общий обработчик ошибок
app.use((err, req, res, next) => {
    console.error('[Server Error]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ========== ЗАПУСК СЕРВЕРА ==========

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                    🚀 CHAT MONITOR SERVER STARTED SUCCESSFULLY               ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                                                                              ║
    ║  📡 Port: ${PORT.toString().padEnd(56)}║
    ║  🕐 Time: ${new Date().toLocaleString().padEnd(56)}║
    ║                                                                              ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                           📋 API ENDPOINTS                                    ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                                                                              ║
    ║  📦 TASKS:                                                                   ║
    ║    POST   /api/tasks                    - Сохранить задачу                   ║
    ║    GET    /api/tasks/:id                - Получить задачу по ID              ║
    ║    GET    /api/tasks/session/:sessionId - Задачи сессии                      ║
    ║    GET    /api/tasks/failed/list        - Список failed задач                ║
    ║    GET    /api/tasks/analyze/:id        - Анализ задачи                      ║
    ║                                                                              ║
    ║  ⚠️ PENDING ACTIONS:                                                          ║
    ║    POST   /api/pending                  - Сохранить проблему                 ║
    ║    GET    /api/pending/unresolved       - Неразрешенные проблемы             ║
    ║    GET    /api/pending/type/:type       - Проблемы по типу                   ║
    ║    GET    /api/pending/stats            - Статистика проблем                 ║
    ║    PUT    /api/pending/:id/resolve      - Разрешить проблему                 ║
    ║                                                                              ║
    ║  📊 ANALYTICS:                                                               ║
    ║    GET    /api/analytics                - Общая аналитика                    ║
    ║    GET    /api/analytics/detailed       - Детальная аналитика                ║
    ║    GET    /api/stats                    - Общая статистика                   ║
    ║                                                                              ║
    ║  📂 SESSIONS:                                                                ║
    ║    GET    /api/sessions                 - Список сессий                      ║
    ║    GET    /api/sessions/:id             - Детали сессии                      ║
    ║    DELETE /api/sessions/:id             - Удалить сессию                     ║
    ║                                                                              ║
    ║  🔍 UTILS:                                                                   ║
    ║    GET    /api/search?q=text            - Поиск по задачам                   ║
    ║    GET    /api/export                   - Экспорт всех данных                ║
    ║    GET    /health                       - Health check                       ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n[Server] Received shutdown signal, closing gracefully...');

    server.close(() => {
        console.log('[Server] HTTP server closed');

        // Закрываем соединение с БД
        if (db && typeof db.close === 'function') {
            db.close();
            console.log('[Server] Database connection closed');
        }

        console.log('[Server] Graceful shutdown completed');
        process.exit(0);
    });

    // Таймаут принудительного завершения
    setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Обработка неперехваченных ошибок
process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
```

---

### `../../Directory/11/backend/services/analyzerService.js`
```javascript
// services/analyzerService.js - Полная версия с обновлениями для анализа неопределенных состояний и задач

import { TaskModel } from '../models/Task.js';
import { PendingActionModel } from '../models/PendingAction.js';
import { db } from '../database/db.js';

export class AnalyzerService {

    /**
     * Анализ неопределенного состояния (pending action)
     * @param {Object} action - объект неопределенного состояния
     * @returns {Object} - детальный анализ проблемы
     */
    static analyzePendingAction(action) {
        const analysis = {
            actionId: action.id,
            type: action.type,
            severity: action.severity,
            analysis: {},
            recommendations: [],
            possibleCauses: [],
            impact: 'unknown',
            suggestedFix: null
        };

        switch (action.type) {
            case 'response_not_found':
                analysis.analysis = {
                    possibleCauses: [
                        'Сервер DeepSeek не отвечает',
                        'Проблемы с сетевым соединением',
                        'Таймаут запроса',
                        'Блокировка CORS',
                        'Сервер временно недоступен',
                        'Превышен лимит запросов'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'high',
                    errorRate: this.getErrorRate(action.type)
                };
                analysis.recommendations = [
                    'Проверить статус сервера DeepSeek (https://status.deepseek.com)',
                    'Перезагрузить страницу чата',
                    'Проверить интернет-соединение',
                    'Увеличить таймаут запроса',
                    'Повторить запрос через несколько секунд'
                ];
                analysis.suggestedFix = 'retry_request';
                break;

            case 'html_blocks_missing':
                analysis.analysis = {
                    possibleCauses: [
                        'Изменение структуры DOM на сайте DeepSeek',
                        'Загрузка страницы не завершена',
                        'Блокировка контента расширением',
                        'Новая версия интерфейса DeepSeek',
                        'Динамическая подгрузка контента'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'medium',
                    lastSeen: this.getLastSeenTime(action.type)
                };
                analysis.recommendations = [
                    'Обновить селекторы в модуле мониторинга',
                    'Проверить актуальность версии расширения',
                    'Временно отключить другие расширения',
                    'Обратиться к разработчику для обновления',
                    'Использовать резервные селекторы'
                ];
                analysis.suggestedFix = 'update_selectors';
                break;

            case 'timeout':
                analysis.analysis = {
                    possibleCauses: [
                        'Долгая генерация ответа (сложный запрос)',
                        'Проблемы с производительностью сервера',
                        'Сложный запрос требует много времени',
                        'Медленное интернет-соединение',
                        'Большой объем генерируемого контента'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'medium',
                    avgDuration: this.getAvgDurationByType(action.type)
                };
                analysis.recommendations = [
                    'Увеличить таймаут ожидания в конфигурации',
                    'Оптимизировать запрос пользователя',
                    'Проверить загрузку сервера DeepSeek',
                    'Разбить сложный запрос на несколько простых',
                    'Использовать потоковый режим получения ответа'
                ];
                analysis.suggestedFix = 'increase_timeout';
                break;

            case 'unknown':
                analysis.analysis = {
                    possibleCauses: [
                        'Неизвестная ошибка в модуле',
                        'Непредвиденное состояние страницы',
                        'Конфликт с другими расширениями',
                        'Ошибка в обработке данных',
                        'Проблема с рендерингом страницы'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'unknown',
                    relatedIssues: this.getRelatedIssues(action.type)
                };
                analysis.recommendations = [
                    'Проверить консоль разработчика (F12)',
                    'Собрать логи и отправить разработчику',
                    'Временно отключить другие расширения',
                    'Перезагрузить страницу чата',
                    'Проверить наличие обновлений расширения'
                ];
                analysis.suggestedFix = 'manual_investigation';
                break;

            case 'no_response_content':
                analysis.analysis = {
                    possibleCauses: [
                        'Пустой ответ от модели',
                        'Ошибка генерации контента',
                        'Фильтрация ответа модерацией',
                        'Модель не смогла сгенерировать ответ',
                        'Запрос заблокирован политиками безопасности'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'low',
                    emptyResponseRate: this.getEmptyResponseRate()
                };
                analysis.recommendations = [
                    'Переформулировать запрос более конкретно',
                    'Проверить настройки модели DeepSeek',
                    'Повторить запрос позже',
                    'Попробовать задать вопрос иначе',
                    'Убедиться что запрос не нарушает правила'
                ];
                analysis.suggestedFix = 'rephrase_query';
                break;

            case 'validation_failed':
                analysis.analysis = {
                    possibleCauses: [
                        'Ответ не прошел проверку качества',
                        'Недостаточная длина ответа',
                        'Отсутствие необходимых HTML блоков',
                        'Некорректная структура ответа',
                        'Ответ содержит ошибки или предупреждения'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'low',
                    avgScore: this.getAvgValidationScore()
                };
                analysis.recommendations = [
                    'Проверить качество ответа ассистента',
                    'При необходимости запросить повторную генерацию',
                    'Проверить наличие ошибок в ответе',
                    'Уточнить запрос для получения более качественного ответа'
                ];
                analysis.suggestedFix = 'check_response_quality';
                break;

            default:
                analysis.analysis = {
                    possibleCauses: ['Неизвестная причина'],
                    frequency: 0,
                    impact: 'unknown',
                    note: 'Требуется ручной анализ'
                };
                analysis.recommendations = [
                    'Проверить консоль разработчика для получения дополнительной информации',
                    'Собрать полный лог ошибок',
                    'Сообщить об ошибке разработчику',
                    'Проверить совместимость с последней версией DeepSeek'
                ];
                analysis.suggestedFix = 'manual_investigation';
        }

        return analysis;
    }

    /**
     * Получить частоту возникновения типа ошибки
     * @param {string} type - тип ошибки
     * @param {number} days - количество дней для анализа
     * @returns {Object} - статистика частоты
     */
    static getActionFrequency(type, days = 7) {
        const stmt = db.prepare(`
            SELECT 
                COUNT(*) as count, 
                COUNT(DISTINCT session_id) as sessions,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions 
            WHERE type = ? 
            AND detected_at > ?
        `);
        const result = stmt.get(type, Date.now() - (days * 24 * 60 * 60 * 1000));
        return {
            count: result?.count || 0,
            sessions: result?.sessions || 0,
            perDay: ((result?.count || 0) / days).toFixed(2),
            firstSeen: result?.first_seen ? new Date(result.first_seen).toISOString() : null,
            lastSeen: result?.last_seen ? new Date(result.last_seen).toISOString() : null,
            trend: this.calculateTrend(type, days)
        };
    }

    /**
     * Рассчитать тренд изменения частоты ошибок
     * @param {string} type - тип ошибки
     * @param {number} days - количество дней
     * @returns {string} - направление тренда ('increasing', 'decreasing', 'stable')
     */
    static calculateTrend(type, days) {
        const halfDays = Math.floor(days / 2);
        const stmt = db.prepare(`
            SELECT 
                SUM(CASE WHEN detected_at > ? THEN 1 ELSE 0 END) as recent,
                SUM(CASE WHEN detected_at <= ? AND detected_at > ? THEN 1 ELSE 0 END) as previous
            FROM pending_actions
            WHERE type = ?
        `);

        const now = Date.now();
        const recentPeriod = now - (halfDays * 24 * 60 * 60 * 1000);
        const previousPeriod = now - (days * 24 * 60 * 60 * 1000);

        const result = stmt.get(recentPeriod, recentPeriod, previousPeriod, type);

        const recent = result?.recent || 0;
        const previous = result?.previous || 0;

        if (recent > previous * 1.2) return 'increasing';
        if (recent < previous * 0.8) return 'decreasing';
        return 'stable';
    }

    /**
     * Получить время последнего появления ошибки
     * @param {string} type - тип ошибки
     * @returns {string|null} - время последнего появления
     */
    static getLastSeenTime(type) {
        const stmt = db.prepare(`
            SELECT MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE type = ?
        `);
        const result = stmt.get(type);
        return result?.last_seen ? new Date(result.last_seen).toISOString() : null;
    }

    /**
     * Получить процент ошибок для типа
     * @param {string} type - тип ошибки
     * @returns {number} - процент ошибок
     */
    static getErrorRate(type) {
        const stmt = db.prepare(`
            SELECT 
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE status = 'failed')) as rate
            FROM pending_actions
            WHERE type = ?
        `);
        const result = stmt.get(type);
        return result?.rate ? result.rate.toFixed(2) : 0;
    }

    /**
     * Получить среднюю длительность для типа проблемы
     * @param {string} type - тип проблемы
     * @returns {number} - средняя длительность в секундах
     */
    static getAvgDurationByType(type) {
        const stmt = db.prepare(`
            SELECT AVG(t.duration) as avg_duration
            FROM pending_actions pa
            JOIN tasks t ON pa.task_id = t.id
            WHERE pa.type = ?
        `);
        const result = stmt.get(type);
        return result?.avg_duration ? (result.avg_duration / 1000).toFixed(2) : 0;
    }

    /**
     * Получить процент пустых ответов
     * @returns {number} - процент пустых ответов
     */
    static getEmptyResponseRate() {
        const stmt = db.prepare(`
            SELECT 
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE status = 'completed')) as rate
            FROM tasks
            WHERE (assistant_response IS NULL OR LENGTH(assistant_response) = 0)
        `);
        const result = stmt.get();
        return result?.rate ? result.rate.toFixed(2) : 0;
    }

    /**
     * Получить среднюю оценку валидации
     * @returns {number} - средняя оценка
     */
    static getAvgValidationScore() {
        const stmt = db.prepare(`
            SELECT AVG(validation_score) as avg_score
            FROM tasks
            WHERE validation_score IS NOT NULL
        `);
        const result = stmt.get();
        return result?.avg_score ? result.avg_score.toFixed(2) : 0;
    }

    /**
     * Получить связанные проблемы
     * @param {string} type - тип проблемы
     * @returns {Array} - список связанных проблем
     */
    static getRelatedIssues(type) {
        const stmt = db.prepare(`
            SELECT type, COUNT(*) as count
            FROM pending_actions
            WHERE session_id IN (
                SELECT session_id FROM pending_actions WHERE type = ?
            )
            AND type != ?
            GROUP BY type
            ORDER BY count DESC
            LIMIT 5
        `);
        return stmt.all(type, type);
    }

    /**
     * Анализ задачи (сообщение пользователя + ответ чата)
     * @param {Object} task - объект задачи
     * @returns {Object} - детальный анализ задачи
     */
    static analyzeTask(task) {
        const analysis = {
            taskId: task.id,
            sessionId: task.session_id,
            timestamp: new Date(task.created_at || Date.now()).toISOString(),
            analysis: {
                userMessageLength: task.user_message?.length || 0,
                responseLength: task.assistant_response?.length || 0,
                responseWords: task.word_count || 0,
                duration: task.duration,
                durationSec: task.duration ? (task.duration / 1000).toFixed(2) : 0,
                validationScore: task.validation_score,
                isValid: task.is_valid === 1,
                htmlBlocksCount: task.html_blocks_count || 0
            },
            metrics: {},
            suggestions: [],
            quality: {
                score: 0,
                level: 'unknown'
            }
        };

        // Анализ качества ответа
        if (task.assistant_response && task.assistant_response.length > 0) {
            const response = task.assistant_response;

            // Проверка на шаблонные ответы
            const templatePatterns = [
                /извините|sorry/i,
                /не могу ответить|cannot answer/i,
                /пожалуйста, уточните|please clarify/i,
                /не понимаю|do not understand/i,
                /ошибка|error/i
            ];

            const isTemplate = templatePatterns.some(p => p.test(response));
            analysis.metrics.isTemplate = isTemplate;

            if (isTemplate) {
                analysis.suggestions.push('Ответ похож на шаблонный, возможно нужно переформулировать вопрос');
                analysis.quality.score -= 20;
            }

            // Проверка на полноту ответа
            if (response.length < 50) {
                analysis.suggestions.push('Ответ слишком короткий, возможно неполный');
                analysis.quality.score -= 15;
            } else if (response.length > 1000) {
                analysis.metrics.isLongResponse = true;
                analysis.quality.score += 10;
            }

            // Проверка на наличие кода
            const hasCode = /```[\s\S]*?```|function|class|const|let|var|import|export/.test(response);
            analysis.metrics.hasCode = hasCode;
            if (hasCode) {
                analysis.quality.score += 15;
            }

            // Проверка на наличие маркдауна
            const hasMarkdown = /#+\s|[*_]{1,2}.+[*_]{1,2}|\d+\.\s|-\s/.test(response);
            analysis.metrics.hasMarkdown = hasMarkdown;
            if (hasMarkdown) {
                analysis.quality.score += 10;
            }

            // Проверка на наличие списков
            const hasLists = /^\d+\.\s|^-\s/m.test(response);
            analysis.metrics.hasLists = hasLists;
            if (hasLists) {
                analysis.quality.score += 10;
            }
        }

        // Анализ времени ответа
        if (task.duration) {
            const durationSec = task.duration / 1000;
            analysis.metrics.durationSeconds = durationSec;

            if (durationSec > 30) {
                analysis.suggestions.push(`⚠️ Долгое время ответа: ${durationSec.toFixed(1)} сек`);
                analysis.quality.score -= 10;
            } else if (durationSec < 5) {
                analysis.metrics.isFastResponse = true;
                analysis.quality.score += 5;
            }
        }

        // Анализ валидации
        if (task.validation_score) {
            analysis.metrics.validationScore = task.validation_score;

            if (task.validation_score < 50) {
                analysis.suggestions.push(`⚠️ Низкая оценка валидации: ${task.validation_score}/100`);
                analysis.quality.score -= 25;
            } else if (task.validation_score > 80) {
                analysis.quality.score += 20;
            }
        }

        // Анализ HTML блоков
        if (task.html_blocks_count === 0 && task.is_valid === 1) {
            analysis.suggestions.push('⚠️ Не найдены HTML блоки с ответом, хотя задача успешна');
            analysis.quality.score -= 10;
        } else if (task.html_blocks_count > 0) {
            analysis.quality.score += 5;
        }

        // Определение уровня качества
        let qualityLevel = 'unknown';
        let qualityColor = 'gray';

        if (analysis.quality.score >= 70) {
            qualityLevel = 'excellent';
            qualityColor = 'green';
        } else if (analysis.quality.score >= 50) {
            qualityLevel = 'good';
            qualityColor = 'blue';
        } else if (analysis.quality.score >= 30) {
            qualityLevel = 'average';
            qualityColor = 'orange';
        } else if (analysis.quality.score > 0) {
            qualityLevel = 'poor';
            qualityColor = 'red';
        } else {
            qualityLevel = 'needs_review';
            qualityColor = 'purple';
        }

        analysis.quality = {
            score: Math.max(0, Math.min(100, analysis.quality.score)),
            level: qualityLevel,
            color: qualityColor
        };

        return analysis;
    }

    /**
     * Получить общую аналитику за период
     * @param {number} period - период в часах
     * @returns {Object} - общая аналитика
     */
    static getOverallAnalytics(period = 24) {
        const since = Date.now() - (period * 60 * 60 * 1000);

        const stmt = db.prepare(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_validation_score,
                COUNT(DISTINCT pa.id) as total_pending,
                COUNT(DISTINCT pa.type) as pending_types,
                SUM(CASE WHEN pa.severity = 'high' THEN 1 ELSE 0 END) as high_severity_pending,
                SUM(CASE WHEN pa.severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_pending,
                SUM(CASE WHEN pa.severity = 'low' THEN 1 ELSE 0 END) as low_severity_pending
            FROM tasks t
            LEFT JOIN pending_actions pa ON t.id = pa.task_id AND pa.auto_resolved = 0
            WHERE t.created_at > datetime('now', '-' || ? || ' hours')
        `);

        const result = stmt.get(period);

        // Категории задач по сложности
        const complexityStmt = db.prepare(`
            SELECT 
                CASE 
                    WHEN LENGTH(user_message) < 50 THEN 'short'
                    WHEN LENGTH(user_message) < 200 THEN 'medium'
                    ELSE 'long'
                END as complexity,
                COUNT(*) as count,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE created_at > datetime('now', '-' || ? || ' hours')
            GROUP BY complexity
        `);
        const complexity = complexityStmt.all(period);

        return {
            period: `${period} hours`,
            periodStart: new Date(Date.now() - period * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            tasks: {
                total: result?.total_tasks || 0,
                completed: result?.completed_tasks || 0,
                failed: result?.failed_tasks || 0,
                successRate: result?.total_tasks > 0
                    ? ((result.completed_tasks / result.total_tasks) * 100).toFixed(2)
                    : 0
            },
            performance: {
                avgDurationMs: result?.avg_duration || 0,
                avgDurationSec: result?.avg_duration ? (result.avg_duration / 1000).toFixed(2) : 0,
                avgValidationScore: result?.avg_validation_score ? result.avg_validation_score.toFixed(2) : 0
            },
            pending: {
                total: result?.total_pending || 0,
                types: result?.pending_types || 0,
                bySeverity: {
                    high: result?.high_severity_pending || 0,
                    medium: result?.medium_severity_pending || 0,
                    low: result?.low_severity_pending || 0
                }
            },
            complexity: complexity,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Получить аналитику по конкретной сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} - аналитика сессии
     */
    static getSessionAnalytics(sessionId) {
        const stmt = db.prepare(`
            SELECT 
                s.*,
                COUNT(t.id) as task_count,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_score,
                COUNT(pa.id) as pending_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            LEFT JOIN pending_actions pa ON s.id = pa.session_id AND pa.auto_resolved = 0
            WHERE s.id = ?
            GROUP BY s.id
        `);

        const session = stmt.get(sessionId);

        if (!session) return null;

        // Получение временной линии задач
        const timelineStmt = db.prepare(`
            SELECT 
                id,
                user_message,
                status,
                duration,
                validation_score,
                created_at
            FROM tasks
            WHERE session_id = ?
            ORDER BY created_at ASC
        `);
        const timeline = timelineStmt.all(sessionId);

        return {
            session: {
                id: session.id,
                startTime: session.start_time,
                endTime: session.end_time,
                status: session.status,
                duration: session.end_time ? (session.end_time - session.start_time) / 1000 : null
            },
            statistics: {
                totalTasks: session.task_count,
                completedTasks: session.completed_count,
                failedTasks: session.failed_count,
                successRate: session.task_count > 0
                    ? ((session.completed_count / session.task_count) * 100).toFixed(2)
                    : 0,
                avgDurationSec: session.avg_duration ? (session.avg_duration / 1000).toFixed(2) : 0,
                avgValidationScore: session.avg_score ? session.avg_score.toFixed(2) : 0,
                pendingIssues: session.pending_count
            },
            timeline: timeline.map(task => ({
                id: task.id,
                message: task.user_message?.substring(0, 100),
                status: task.status,
                durationSec: task.duration ? (task.duration / 1000).toFixed(2) : 0,
                validationScore: task.validation_score,
                createdAt: task.created_at
            })),
            recommendations: this.generateSessionRecommendations(session)
        };
    }

    /**
     * Генерация рекомендаций для сессии
     * @param {Object} session - данные сессии
     * @returns {Array} - список рекомендаций
     */
    static generateSessionRecommendations(session) {
        const recommendations = [];

        if (session.failed_count > session.completed_count) {
            recommendations.push({
                type: 'high_failure_rate',
                message: `Высокий процент ошибок в сессии: ${session.failed_count} из ${session.task_count} задач`,
                action: 'Проверьте качество запросов и стабильность соединения'
            });
        }

        if (session.avg_score && session.avg_score < 50) {
            recommendations.push({
                type: 'low_quality',
                message: `Низкое качество ответов: средняя оценка ${session.avg_score.toFixed(1)}/100`,
                action: 'Рекомендуется переформулировать запросы или проверить настройки модели'
            });
        }

        if (session.avg_duration && session.avg_duration > 30000) {
            recommendations.push({
                type: 'slow_responses',
                message: `Медленные ответы: среднее время ${(session.avg_duration / 1000).toFixed(1)} сек`,
                action: 'Оптимизируйте запросы или проверьте скорость интернет-соединения'
            });
        }

        return recommendations;
    }

    /**
     * Сравнительный анализ между сессиями
     * @param {Array<string>} sessionIds - массив ID сессий
     * @returns {Object} - сравнительный анализ
     */
    static compareSessions(sessionIds) {
        const comparisons = [];

        for (const sessionId of sessionIds) {
            const analytics = this.getSessionAnalytics(sessionId);
            if (analytics) {
                comparisons.push({
                    sessionId: sessionId,
                    statistics: analytics.statistics
                });
            }
        }

        // Расчет общих метрик
        const avgSuccessRate = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.successRate), 0) / comparisons.length;
        const avgDuration = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.avgDurationSec), 0) / comparisons.length;
        const avgScore = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.avgValidationScore), 0) / comparisons.length;

        return {
            sessions: comparisons,
            averages: {
                successRate: avgSuccessRate.toFixed(2),
                avgDurationSec: avgDuration.toFixed(2),
                avgValidationScore: avgScore.toFixed(2)
            },
            bestSession: comparisons.reduce((best, current) =>
                parseFloat(current.statistics.successRate) > parseFloat(best.statistics.successRate) ? current : best, comparisons[0]),
            worstSession: comparisons.reduce((worst, current) =>
                parseFloat(current.statistics.successRate) < parseFloat(worst.statistics.successRate) ? current : worst, comparisons[0])
        };
    }

    /**
     * Прогнозирование потенциальных проблем
     * @returns {Object} - прогноз проблем
     */
    static predictIssues() {
        const predictions = [];

        // Анализ трендов по типам ошибок
        const types = ['response_not_found', 'html_blocks_missing', 'timeout', 'unknown', 'no_response_content'];

        for (const type of types) {
            const trend = this.calculateTrend(type, 7);
            const frequency = this.getActionFrequency(type, 1); // последние 24 часа

            if (trend === 'increasing' && frequency.count > 5) {
                predictions.push({
                    type: type,
                    trend: trend,
                    currentRate: frequency.perDay,
                    message: `Обнаружен растущий тренд ошибок типа "${type}"`,
                    recommendation: `Требуется внимание: ${frequency.count} ошибок за последние 24 часа`
                });
            }
        }

        return {
            predictions: predictions,
            timestamp: new Date().toISOString(),
            severity: predictions.length > 0 ? (predictions.some(p => p.type === 'response_not_found') ? 'high' : 'medium') : 'low'
        };
    }
}

export default AnalyzerService;
```

---

### `../../Directory/11/backend/services/taskService.js`
```javascript
// server/services/taskService.js - Полная версия с обновлениями
import { TaskModel } from '../models/Task.js';
import { PendingActionModel } from '../models/PendingAction.js';
import { AnalyzerService } from './analyzerService.js';
import { db } from '../database/db.js';

export class TaskService {

    /**
     * Обработка завершенной задачи
     * @param {Object} taskData - Данные задачи
     * @returns {Promise<Object>} Результат обработки
     */
    static async processCompletedTask(taskData) {
        // Сохраняем задачу
        const task = await TaskModel.save({
            id: taskData.id,
            sessionId: taskData.sessionId,
            userMessage: taskData.userMessage,
            assistantResponse: taskData.assistantResponse,
            startTime: taskData.startTime,
            endTime: taskData.endTime,
            duration: taskData.duration,
            status: taskData.status,
            validationScore: taskData.validationScore,
            isValid: taskData.isValid,
            errorMessage: taskData.errorMessage,
            htmlBlocksCount: taskData.htmlBlocksCount,
            continueClicks: taskData.continueClicks || 0
        });

        // Сохраняем полный ответ
        if (taskData.assistantResponse) {
            await TaskModel.saveAssistantResponse(taskData.id, taskData.assistantResponse);
        }

        // Обновляем статистику сессии
        await TaskModel.updateSessionStats(taskData.sessionId);

        // Анализируем задачу
        const analysis = AnalyzerService.analyzeTask({
            id: taskData.id,
            session_id: taskData.sessionId,
            user_message: taskData.userMessage,
            assistant_response: taskData.assistantResponse,
            duration: taskData.duration,
            validation_score: taskData.validationScore,
            is_valid: taskData.isValid,
            word_count: taskData.assistantResponse?.split(/\s+/).length || 0,
            continue_clicks: taskData.continueClicks || 0
        });

        return {
            task: taskData,
            analysis: analysis,
            saved: true
        };
    }

    /**
     * Обработка неопределенного состояния
     * @param {Object} actionData - Данные неопределенного состояния
     * @returns {Promise<Object>} Результат обработки
     */
    static async processPendingAction(actionData) {
        const action = await PendingActionModel.save(actionData);

        // Анализируем проблему
        const analysis = AnalyzerService.analyzePendingAction({
            id: action.lastInsertRowid,
            type: actionData.type,
            severity: actionData.severity,
            description: actionData.description
        });

        // Обновляем сессию
        await PendingActionModel.updateSessionPendingCount(actionData.sessionId);

        return {
            action: actionData,
            analysis: analysis,
            saved: true,
            id: action.lastInsertRowid
        };
    }

    /**
     * Получить задачи для анализа
     * @param {Object} options - Опции фильтрации
     * @returns {Promise<Array>} Массив задач с анализом
     */
    static async getTasksForAnalysis(options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = null,
            sessionId = null,
            fromDate = null,
            toDate = null
        } = options;

        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE 1=1
        `;

        const params = [];

        if (sessionId) {
            query += ` AND t.session_id = ?`;
            params.push(sessionId);
        }

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }

        if (fromDate) {
            query += ` AND t.created_at >= datetime(?)`;
            params.push(fromDate);
        }

        if (toDate) {
            query += ` AND t.created_at <= datetime(?)`;
            params.push(toDate);
        }

        query += ` ORDER BY t.start_time DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        // Анализируем каждую задачу
        const analyzedTasks = tasks.map(task => ({
            ...task,
            analysis: AnalyzerService.analyzeTask(task)
        }));

        return analyzedTasks;
    }

    /**
     * Получить неразрешенные проблемы
     * @param {number} limit - Максимальное количество записей
     * @returns {Promise<Array>} Массив проблем с анализом
     */
    static async getUnresolvedIssues(limit = 50) {
        const pending = await PendingActionModel.getUnresolved(limit);

        const analyzedIssues = pending.map(issue => ({
            ...issue,
            analysis: AnalyzerService.analyzePendingAction(issue),
            timeSinceDetected: Date.now() - issue.detected_at,
            timeSinceDetectedFormatted: this.formatDuration(Date.now() - issue.detected_at)
        }));

        return analyzedIssues;
    }

    /**
     * Получить детальную информацию о задаче
     * @param {string} taskId - ID задачи
     * @returns {Promise<Object>} Детальная информация
     */
    static async getTaskDetails(taskId) {
        const task = await TaskModel.getById(taskId);

        if (!task) {
            return null;
        }

        // Получаем связанные проблемы
        const pendingActions = await PendingActionModel.getByTaskId(taskId);

        // Получаем историю сессии
        const sessionTasks = await TaskModel.getBySessionId(task.session_id, 100, 0);

        // Анализируем контекст
        const contextAnalysis = this.analyzeTaskContext(task, sessionTasks);

        return {
            task: task,
            pendingActions: pendingActions,
            sessionTasks: sessionTasks,
            contextAnalysis: contextAnalysis,
            recommendations: this.generateRecommendations(task, pendingActions)
        };
    }

    /**
     * Анализ контекста задачи
     * @param {Object} task - Текущая задача
     * @param {Array} sessionTasks - Все задачи сессии
     * @returns {Object} Анализ контекста
     */
    static analyzeTaskContext(task, sessionTasks) {
        const taskIndex = sessionTasks.findIndex(t => t.id === task.id);
        const previousTasks = sessionTasks.slice(0, taskIndex);
        const nextTasks = sessionTasks.slice(taskIndex + 1);

        // Проверка на повторяющиеся проблемы
        const similarIssues = previousTasks.filter(t =>
            t.status === 'failed' &&
            t.user_message && task.user_message &&
            this.similarityScore(t.user_message, task.user_message) > 0.7
        );

        // Проверка на последовательные ошибки
        const consecutiveFailures = this.getConsecutiveFailures(sessionTasks, taskIndex);

        return {
            positionInSession: taskIndex + 1,
            totalInSession: sessionTasks.length,
            previousTasksCount: previousTasks.length,
            nextTasksCount: nextTasks.length,
            similarIssuesCount: similarIssues.length,
            similarIssues: similarIssues.slice(0, 5),
            consecutiveFailures: consecutiveFailures,
            isRecurringIssue: similarIssues.length > 0,
            failureRate: this.calculateFailureRate(sessionTasks)
        };
    }

    /**
     * Генерация рекомендаций на основе задачи и проблем
     * @param {Object} task - Задача
     * @param {Array} pendingActions - Связанные проблемы
     * @returns {Array} Список рекомендаций
     */
    static generateRecommendations(task, pendingActions) {
        const recommendations = [];

        // Рекомендации на основе статуса задачи
        if (task.status === 'failed') {
            recommendations.push({
                type: 'task_failed',
                priority: 'high',
                message: 'Задача завершилась с ошибкой. Рекомендуется проанализировать причину.',
                action: 'review_task'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            recommendations.push({
                type: 'low_validation',
                priority: 'medium',
                message: `Низкая оценка валидации: ${task.validation_score}/100. Требуется проверка качества ответа.`,
                action: 'review_quality'
            });
        }

        // Рекомендации на основе проблем
        for (const action of pendingActions) {
            if (!action.auto_resolved) {
                recommendations.push({
                    type: action.type,
                    priority: action.severity === 'high' ? 'high' : 'medium',
                    message: action.suggested_action || `Необходимо разрешить проблему типа: ${action.type}`,
                    action: 'resolve_pending',
                    pendingId: action.id
                });
            }
        }

        // Рекомендации на основе длительности
        if (task.duration && task.duration > 60000) {
            recommendations.push({
                type: 'slow_response',
                priority: 'low',
                message: `Длительный ответ: ${(task.duration / 1000).toFixed(1)} секунд.`,
                action: 'optimize_performance'
            });
        }

        // Рекомендации на основе Continue кликов
        if (task.continue_clicks && task.continue_clicks > 3) {
            recommendations.push({
                type: 'many_continue_clicks',
                priority: 'low',
                message: `Много нажатий Continue (${task.continue_clicks}). Возможно, ответ слишком длинный.`,
                action: 'consider_response_chunking'
            });
        }

        return recommendations;
    }

    /**
     * Расчет коэффициента схожести строк
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} Коэффициент схожести (0-1)
     */
    static similarityScore(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Расстояние Левенштейна
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} Расстояние Левенштейна
     */
    static levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Получение последовательных ошибок
     * @param {Array} tasks - Массив задач
     * @param {number} currentIndex - Индекс текущей задачи
     * @returns {number} Количество последовательных ошибок
     */
    static getConsecutiveFailures(tasks, currentIndex) {
        let count = 0;
        for (let i = currentIndex; i >= 0; i--) {
            if (tasks[i]?.status === 'failed') {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * Расчет процента ошибок
     * @param {Array} tasks - Массив задач
     * @returns {number} Процент ошибок
     */
    static calculateFailureRate(tasks) {
        if (tasks.length === 0) return 0;
        const failedCount = tasks.filter(t => t.status === 'failed').length;
        return (failedCount / tasks.length) * 100;
    }

    /**
     * Форматирование длительности
     * @param {number} ms - Длительность в миллисекундах
     * @returns {string} Отформатированная длительность
     */
    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    }

    /**
     * Получение статистики по задачам
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Object>} Статистика
     */
    static async getTaskStatistics(sessionId = null) {
        const stats = await TaskModel.getStats(sessionId);

        // Добавляем дополнительные метрики
        const additionalStats = {
            averageResponseLength: await this.getAverageResponseLength(sessionId),
            averageContinueClicks: await this.getAverageContinueClicks(sessionId),
            successRateTrend: await this.getSuccessRateTrend(sessionId),
            commonIssues: await this.getCommonIssues(sessionId)
        };

        return {
            ...stats,
            ...additionalStats
        };
    }

    /**
     * Получение средней длины ответа
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<number>} Средняя длина ответа
     */
    static async getAverageResponseLength(sessionId = null) {
        let query = `
            SELECT AVG(ar.response_length) as avg_length
            FROM tasks t
            JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.status = 'completed'
        `;
        const params = [];

        if (sessionId) {
            query += ` AND t.session_id = ?`;
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_length || 0;
    }

    /**
     * Получение среднего количества Continue кликов
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<number>} Среднее количество Continue кликов
     */
    static async getAverageContinueClicks(sessionId = null) {
        let query = `
            SELECT AVG(continue_clicks) as avg_clicks
            FROM tasks
            WHERE status = 'completed'
        `;
        const params = [];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_clicks || 0;
    }

    /**
     * Получение тренда успешности
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Array>} Тренд успешности по времени
     */
    static async getSuccessRateTrend(sessionId = null) {
        let query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM tasks
        `;
        const params = [];

        if (sessionId) {
            query += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        query += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`;

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        return results.map(r => ({
            date: r.date,
            total: r.total,
            completed: r.completed,
            successRate: r.total > 0 ? (r.completed / r.total) * 100 : 0
        }));
    }

    /**
     * Получение распространенных проблем
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Array>} Список распространенных проблем
     */
    static async getCommonIssues(sessionId = null) {
        let query = `
            SELECT 
                pa.type,
                COUNT(*) as count,
                pa.severity
            FROM pending_actions pa
        `;
        const params = [];

        if (sessionId) {
            query += ` WHERE pa.session_id = ?`;
            params.push(sessionId);
        }

        query += ` GROUP BY pa.type, pa.severity ORDER BY count DESC LIMIT 10`;

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    /**
     * Экспорт данных для аналитики
     * @param {Object} options - Опции экспорта
     * @returns {Promise<Object>} Экспортированные данные
     */
    static async exportAnalyticsData(options = {}) {
        const {
            fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            toDate = new Date().toISOString(),
            includeTasks = true,
            includePending = true,
            includeSessions = true
        } = options;

        const exportData = {
            exportedAt: new Date().toISOString(),
            period: { from: fromDate, to: toDate },
            summary: {}
        };

        // Общая статистика
        const overallStats = db.prepare(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_validation_score,
                COUNT(DISTINCT pa.id) as total_pending,
                COUNT(DISTINCT s.id) as total_sessions
            FROM tasks t
            LEFT JOIN pending_actions pa ON t.id = pa.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE t.created_at BETWEEN datetime(?) AND datetime(?)
        `).get(fromDate, toDate);

        exportData.summary = overallStats;

        if (includeTasks) {
            const tasks = db.prepare(`
                SELECT t.*, ar.response_text as full_response
                FROM tasks t
                LEFT JOIN assistant_responses ar ON t.id = ar.task_id
                WHERE t.created_at BETWEEN datetime(?) AND datetime(?)
                ORDER BY t.created_at DESC
            `).all(fromDate, toDate);
            exportData.tasks = tasks;
        }

        if (includePending) {
            const pending = db.prepare(`
                SELECT pa.*, t.user_message
                FROM pending_actions pa
                LEFT JOIN tasks t ON pa.task_id = t.id
                WHERE pa.created_at BETWEEN datetime(?) AND datetime(?)
                ORDER BY pa.created_at DESC
            `).all(fromDate, toDate);
            exportData.pendingActions = pending;
        }

        if (includeSessions) {
            const sessions = db.prepare(`
                SELECT s.*, COUNT(t.id) as task_count
                FROM sessions s
                LEFT JOIN tasks t ON s.id = t.session_id
                WHERE s.created_at BETWEEN datetime(?) AND datetime(?)
                GROUP BY s.id
                ORDER BY s.created_at DESC
            `).all(fromDate, toDate);
            exportData.sessions = sessions;
        }

        return exportData;
    }
}

export default TaskService;
```

---

### `../../Directory/11/deepseek/background.js`
```javascript
// background.js - Полная версия с обновлениями для клика по селектору

// Хранилище активных отладчиков
const activeDebuggers = new Map();

// Функция для прикрепления отладчика (с исправлением ошибки "already attached")
async function attachDebugger(tabId) { /* реализация скрыта */ }

// Функция для открепления отладчика
async function detachDebugger(tabId) { /* реализация скрыта */ }

// Функция для выполнения клика по координатам
async function performClickAtCoordinates(tabId, x, y) { /* реализация скрыта */ }

// Функция для получения координат элемента через content script
async function getElementCoordinates(tabId, selector) { /* реализация скрыта */ }

// Функция для выполнения клика по элементу через селектор
async function performTrustedClickOnElement(tabId, selector, options = {}) { /* реализация скрыта */ }

// Функция для выполнения клика по координатам (старый метод)
async function performTrustedClickAtCoordinates(tabId, x, y) { /* реализация скрыта */ }

function applyIframeRules() { /* реализация скрыта */ }

function initiate() { /* реализация скрыта */ }

// Safe initialization with retry
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function safeInitiate() { /* реализация скрыта */ }

// Start initialization
safeInitiate();

// Export for debugging (not actually used, but helpful)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { applyIframeRules, initiate, performTrustedClickAtCoordinates, performTrustedClickOnElement, attachDebugger, detachDebugger };
}
```

---

### `../../Directory/11/deepseek/chatMonitor.js`
```javascript
// chatMonitor.js - Полная версия с универсальным обработчиком кликов (только MutationObserver)
// 100% кода с обновлениями

const LOG_PREFIX = '🤖 [CHAT-MONITOR]';
const STYLES = {
    userInput: 'color: #4CAF50; font-weight: bold; font-size: 12px; background: #1a3a1a; padding: 2px 8px; border-radius: 4px;',
    start: 'color: #4CAF50; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    end: 'color: #2196F3; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    error: 'color: #f44336; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    info: 'color: #FF9800; font-weight: bold;',
    success: 'color: #8BC34A;',
    validation: 'color: #9C27B0;',
    typing: 'color: #00BCD4; font-weight: bold;',
    message: 'color: #E0E0E0; background: #2d2d2d; padding: 4px 8px; border-radius: 4px; font-style: italic;',
    messagePreview: 'color: #00CED1; background: #0a2a2a; padding: 4px 8px; border-radius: 4px; font-family: monospace;',
    separator: 'color: #555; font-weight: normal;',
    task: 'color: #FF6B6B; font-weight: bold;',
    session: 'color: #4ECDC4; font-weight: bold;',
    pending: 'color: #FF9800; font-weight: bold; font-size: 13px; background: #3a2a00; padding: 2px 8px; border-radius: 4px;',
    operator: 'color: #00BCD4; font-weight: bold; font-size: 13px; background: #003a4a; padding: 2px 8px; border-radius: 4px;',
    send: 'color: #4CAF50; font-weight: bold; font-size: 12px; background: #1a3a1a; padding: 2px 8px; border-radius: 4px;',
    waiting: 'color: #FF9800; font-weight: bold; font-size: 12px; background: #3a2a00; padding: 2px 8px; border-radius: 4px;',
    response: 'color: #2196F3; font-weight: bold; font-size: 12px; background: #001a3a; padding: 2px 8px; border-radius: 4px;',
    continue: 'color: #FF5722; font-weight: bold; font-size: 12px; background: #2a1a00; padding: 2px 8px; border-radius: 4px;',
    page: 'color: #9C27B0; font-weight: bold; font-size: 12px; background: #2a003a; padding: 2px 8px; border-radius: 4px;',
    mutation: 'color: #00BCD4; font-weight: bold; font-size: 12px; background: #003a4a; padding: 2px 8px; border-radius: 4px;'
};

// ========== УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК КЛИКОВ ==========

class UniversalClickHandler {
    constructor() {
        this.STABLE_SELECTORS = [
            '[data-testid="continue-button"]',
            '[data-testid="continue-btn"]',
            '[data-testid="continue"]',
            '[aria-label*="continue" i]',
            '[aria-label*="Continue" i]',
            'button[role="button"]:has-text("Continue")',
            'div[role="button"]:has-text("Continue")',
            'button.ds-button:has-text("Continue")',
            'button._52c986b:has-text("Continue")',
            '//button[contains(normalize-space(text()), "Continue")]',
            '//div[contains(@role, "button") and contains(normalize-space(text()), "Continue")]'
        ];

        this._observer = null;
        this._isProcessingClick = false;
        this._lastClickTime = 0;
        this.CLICK_DEBOUNCE_MS = 500;
        this._onClickCallback = null;
    }

    findContinueButton() {
        const result = {
            element: null,
            selector: null,
            isVisible: false,
            isDisabled: false,
            method: null
        };

        const xpathResult = this._findByXPath();
        if (xpathResult.element) {
            return xpathResult;
        }

        for (const selector of this.STABLE_SELECTORS) {
            if (selector.startsWith('//')) {
                continue;
            }

            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this._isButtonVisible(element)) {
                        result.element = element;
                        result.selector = selector;
                        result.method = 'stable_selector';

                        const isDisabled = element.disabled ||
                            element.getAttribute('disabled') !== null ||
                            element.getAttribute('aria-disabled') === 'true';

                        result.isVisible = true;
                        result.isDisabled = isDisabled;

                        return result;
                    }
                }
            } catch (e) {}
        }

        const allButtons = document.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]');
        for (const btn of allButtons) {
            const text = this._getButtonText(btn);
            if (text.toLowerCase().includes('continue')) {
                if (this._isButtonVisible(btn)) {
                    result.element = btn;
                    result.selector = this._generateDynamicSelector(btn);
                    result.method = 'text_search';

                    const isDisabled = btn.disabled ||
                        btn.getAttribute('disabled') !== null ||
                        btn.getAttribute('aria-disabled') === 'true';

                    result.isVisible = true;
                    result.isDisabled = isDisabled;

                    return result;
                }
            }
        }

        return result;
    }

    _findByXPath() {
        const result = { element: null, selector: null, isVisible: false, isDisabled: false, method: null };

        const xpaths = [
            "//button[contains(translate(text(), 'CONTINUE', 'continue'), 'continue')]",
            "//div[contains(@role, 'button') and contains(translate(text(), 'CONTINUE', 'continue'), 'continue')]",
            "//*[contains(@aria-label, 'Continue') or contains(@aria-label, 'continue')]",
            "//*[@data-testid and contains(translate(@data-testid, 'CONTINUE', 'continue'), 'continue')]"
        ];

        for (const xpath of xpaths) {
            try {
                const element = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                if (element && this._isButtonVisible(element)) {
                    result.element = element;
                    result.selector = xpath;
                    result.method = 'xpath';
                    result.isVisible = true;

                    const isDisabled = element.disabled ||
                        element.getAttribute('disabled') !== null ||
                        element.getAttribute('aria-disabled') === 'true';
                    result.isDisabled = isDisabled;

                    return result;
                }
            } catch (e) {}
        }

        return result;
    }

    _generateDynamicSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        const dataAttrs = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `[${attr.name}="${attr.value}"]`);

        if (dataAttrs.length > 0) {
            return dataAttrs[0];
        }

        let selector = element.tagName.toLowerCase();
        const validClasses = Array.from(element.classList)
            .filter(c => !c.match(/^_[a-f0-9]+$|^[a-f0-9]{6,}$/));

        if (validClasses.length > 0) {
            selector += '.' + validClasses.join('.');
        }

        const parent = element.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        return selector;
    }

    _isButtonVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        if (rect.width === 0 || rect.height === 0) return false;
        if (style.display === 'none') return false;
        if (style.visibility === 'hidden') return false;
        if (style.opacity === '0') return false;

        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0 &&
            rect.left < window.innerWidth && rect.right > 0;

        return isInViewport;
    }

    _getButtonText(button) {
        const clone = button.cloneNode(true);
        const svgs = clone.querySelectorAll('svg');
        svgs.forEach(svg => svg.remove());
        return clone.textContent?.trim() || button.textContent?.trim() || '';
    }

    async clickButton(buttonInfo) {
        if (!buttonInfo || !buttonInfo.element || !buttonInfo.isVisible) {
            console.warn('[ClickHandler] Нет элемента для клика');
            return false;
        }

        if (buttonInfo.isDisabled) {
            console.warn('[ClickHandler] Кнопка отключена');
            return false;
        }

        const now = Date.now();
        if (now - this._lastClickTime < this.CLICK_DEBOUNCE_MS) {
            console.log('[ClickHandler] Дебаунс: пропускаем частый клик');
            return false;
        }

        if (this._isProcessingClick) {
            console.log('[ClickHandler] Уже выполняется клик');
            return false;
        }

        this._isProcessingClick = true;
        this._lastClickTime = now;

        try {
            buttonInfo.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this._delay(300);

            const clicked = await this._performTrustedClick(buttonInfo);

            if (clicked) {
                console.log('[ClickHandler] ✅ Успешный клик через метод:', buttonInfo.method);
                if (this._onClickCallback) {
                    this._onClickCallback(buttonInfo);
                }
            } else {
                console.warn('[ClickHandler] ⚠️ Не удалось выполнить клик, пробуем обычный');
                buttonInfo.element.click();
                if (this._onClickCallback) {
                    this._onClickCallback(buttonInfo);
                }
            }

            return true;
        } catch (error) {
            console.error('[ClickHandler] Ошибка при клике:', error);
            return false;
        } finally {
            this._isProcessingClick = false;
        }
    }

    async _performTrustedClick(buttonInfo) {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            return false;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000);

            try {
                const selector = buttonInfo.selector || this._generateDynamicSelector(buttonInfo.element);

                chrome.runtime.sendMessage({
                    action: "performTrustedClickOnElement",
                    selector: selector,
                    scrollToElement: false
                }, (response) => {
                    clearTimeout(timeout);

                    if (chrome.runtime.lastError) {
                        console.warn('[ClickHandler] Ошибка при клике по селектору:', chrome.runtime.lastError);
                        resolve(false);
                        return;
                    }

                    resolve(response?.success === true);
                });
            } catch (e) {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupAutoClickObserver(onClickCallback) {
        this._onClickCallback = onClickCallback;

        if (this._observer) {
            this._observer.disconnect();
        }

        let debounceTimer = null;

        this._observer = new MutationObserver((mutations) => {
            let hasRelevantMutation = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent?.toLowerCase() || '';
                            if (text.includes('continue')) {
                                hasRelevantMutation = true;
                                break;
                            }
                        }
                    }
                }

                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    const text = target.textContent?.toLowerCase() || '';
                    if (text.includes('continue')) {
                        hasRelevantMutation = true;
                    }

                    if (target.matches && target.matches('button, div[role="button"]')) {
                        hasRelevantMutation = true;
                    }
                }
            }

            if (hasRelevantMutation) {
                if (debounceTimer) clearTimeout(debounceTimer);

                debounceTimer = setTimeout(async () => {
                    const button = this.findContinueButton();
                    if (button && button.isVisible && !button.isDisabled) {
                        console.log('[ClickHandler] 🔍 Обнаружена кнопка Continue через MutationObserver');
                        await this.clickButton(button);
                    }
                }, 100);
            }
        });

        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'disabled', 'aria-disabled', 'data-state']
        });

        console.log('[ClickHandler] ✅ MutationObserver настроен для автоматического клика');

        setTimeout(async () => {
            const button = this.findContinueButton();
            if (button && button.isVisible && !button.isDisabled) {
                console.log('[ClickHandler] 🔍 Обнаружена кнопка Continue при инициализации');
                await this.clickButton(button);
            }
        }, 500);
    }

    stop() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        this._onClickCallback = null;
    }

    isActive() {
        return this._observer !== null;
    }
}

// ========== ОСНОВНОЙ КЛАСС МОНИТОРА ==========

class DeepSeekChatMonitor {
    constructor(options = {}) {
        this.state = {
            isUserTyping: false,
            isChatProcessing: false,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: '',
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: null,
            endTime: null,
            userMessageSent: false,
            waitingForResponse: false,
            responseReceived: false,

            pendingUserAction: {
                isPending: false,
                type: null,
                description: null,
                detectedAt: null,
                severity: 'medium',
                suggestedAction: null,
                autoResolved: false,
                resolvedAt: null,
                resolutionMethod: null
            }
        };

        this.currentSession = {
            id: null,
            startTime: null,
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };

        this.currentTask = {
            id: null,
            userMessage: null,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: null,
            endTime: null,
            duration: null,
            status: 'pending',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };

        this.chatHistory = {
            sessions: [],
            currentSession: null
        };

        this.htmlBlocks = {
            chatInput: null,
            sendButton: null,
            assistantMessageContainer: null,
            loadingIndicator: null,
            errorBlock: null,
            messageBlocks: []
        };

        this.validationRules = {
            expectedBlocks: [
                '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
                '.message.assistant', '[class*="message"]', '[class*="assistant"]'
            ],
            expectedStates: ['streaming', 'complete', 'error'],
            minResponseLength: 10,
            maxResponseTime: 120000,
            requiredKeywords: []
        };

        this.detectionConfig = {
            responseWaitTimeout: 120000,
            streamingStuckTimeout: 30000,
            noChangeTimeout: 3000,
            minResponseWords: 30,
            requireCompleteSentence: true,
            mutationIdleTimeout: 10000,
            mutationMaxIdleBeforeComplete: 5000
        };

        this.chatInput = null;
        this.sendButton = null;

        this.processingStarted = false;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._clickHandlerAttached = false;
        this._enterHandlerAttached = false;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._continueClickCount = 0;
        this._startWaitingLogged = false;
        this._streamingActive = false;
        this._currentResponseElement = null;

        this._lastMutationTime = null;
        this._mutationIdleTimer = null;
        this._consecutiveIdleChecks = 0;
        this._maxIdleChecks = 3;

        // ========== НОВЫЕ ПОЛЯ ДЛЯ КНОПКИ ИЗ МУТАЦИИ ==========
        this._continueButtonFromMutation = null;
        this._continueButtonMutationProcessed = false;
        this._continueButtonClearTimer = null;
        this._lastProcessedContinueButton = null;

        this.autoClickEnabled = options.autoClickEnabled !== undefined ? options.autoClickEnabled : false;

        this._actionButtonPollingInterval = null;

        this.typingDebounceTimer = null;
        this.responseTimeoutTimer = null;

        this.domObserver = null;
        this.attributeObserver = null;
        this.responseObserver = null;
        this.continueButtonObserver = null;

        this.onStateChange = options.onStateChange || null;
        this.onNewConversation = options.onNewConversation || null;
        this.onValidationResult = options.onValidationResult || null;
        this.onSessionUpdate = options.onSessionUpdate || null;
        this.onTaskComplete = options.onTaskComplete || null;
        this.onPendingAction = options.onPendingAction || null;
        this.onContinueButtonDetected = options.onContinueButtonDetected || null;

        this.logging = {
            enabled: options.logging !== false,
            showDebug: options.showDebug || false,
            showInfo: options.showInfo !== false,
            showValidation: options.showValidation !== false,
            showPending: options.showPending !== false,
            useStyles: options.useStyles !== false
        };

        this.eventBus = typeof window !== 'undefined' ? window.__deepseekEventBus : null;
        this.eventListeners = [];
        this.useEventBus = options.useEventBus !== false && this.eventBus !== null;

        this._fetch = window.fetch.bind(window);

        this.API_PORT = 3853;
        this.API_BASE_URL = `http://localhost:${this.API_PORT}/api`;

        // Инициализируем универсальный обработчик кликов
        this.clickHandler = new UniversalClickHandler();

        // Настраиваем автоматический клик через MutationObserver
        this._setupAutoClick();

        this.init();
    }

    // ========== ЛОГИРОВАНИЕ ==========

    _log(type, message, data = null) {
        if (!this.logging.enabled) return;

        const types = {
            userInput: { method: 'log', prefix: '✏️ USER INPUT', style: STYLES.userInput },
            typing: { method: 'log', prefix: '⌨️ TYPING', style: STYLES.typing },
            start: { method: 'log', prefix: '🎬 START', style: STYLES.start },
            end: { method: 'log', prefix: '🏁 END', style: STYLES.end },
            error: { method: 'error', prefix: '❌ ERROR', style: STYLES.error },
            info: { method: 'log', prefix: 'ℹ️ INFO', style: STYLES.info },
            debug: { method: 'debug', prefix: '🔍 DEBUG', style: STYLES.info },
            validation: { method: 'log', prefix: '✅ VALIDATION', style: STYLES.validation },
            message: { method: 'log', prefix: '💬 MESSAGE', style: STYLES.message },
            messagePreview: { method: 'log', prefix: '📝 PREVIEW', style: STYLES.messagePreview },
            separator: { method: 'log', prefix: '', style: STYLES.separator },
            task: { method: 'log', prefix: '📋 TASK', style: STYLES.task },
            session: { method: 'log', prefix: '🎯 SESSION', style: STYLES.session },
            pending: { method: 'warn', prefix: '⚠️ PENDING', style: STYLES.pending },
            operator: { method: 'log', prefix: '👨‍💼 OPERATOR', style: STYLES.operator },
            send: { method: 'log', prefix: '📤 SEND', style: STYLES.send },
            waiting: { method: 'log', prefix: '⏳ WAITING', style: STYLES.waiting },
            response: { method: 'log', prefix: '💬 RESPONSE', style: STYLES.response },
            continue: { method: 'log', prefix: '🔄 CONTINUE', style: STYLES.continue },
            page: { method: 'log', prefix: '🌐 PAGE', style: STYLES.page },
            mutation: { method: 'log', prefix: '🔀 MUTATION', style: STYLES.mutation }
        };

        const t = types[type] || types.info;

        if (type === 'debug' && !this.logging.showDebug) return;
        if (type === 'info' && !this.logging.showInfo) return;
        if (type === 'validation' && !this.logging.showValidation) return;
        if (type === 'pending' && !this.logging.showPending) return;

        if (this.logging.useStyles) {
            console[t.method](`%c${LOG_PREFIX} ${t.prefix}${t.prefix ? ' ' : ''}${message}`, t.style);
        } else {
            console[t.method](`${LOG_PREFIX} ${t.prefix} ${message}`);
        }

        if (data && this.logging.useStyles) {
            console[t.method](`%c${JSON.stringify(data, null, 2)}`, 'color: #aaa; font-family: monospace;');
        } else if (data) {
            console[t.method](data);
        }
    }

    // ========== НАСТРОЙКА АВТОМАТИЧЕСКОГО КЛИКА ==========

    _setupAutoClick() {
        const onContinueClick = (buttonInfo) => {
            this._log('continue', `🖱️ Автоматический клик по Continue (метод: ${buttonInfo.method})`);
            this._continueClickCount++;

            this._lastResponseText = '';
            this._lastResponseHtml = '';
            this._lastMutationTime = Date.now();
            this.resetMutationIdleTimer();
        };

        this.clickHandler.setupAutoClickObserver(onContinueClick);

        this._log('continue', '✅ Автоматический клик по Continue настроен (MutationObserver)');
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    init() {
        if (this.logging.showInfo) {
            console.log(`${LOG_PREFIX} 🚀 Инициализация модуля отслеживания чата`);
            console.log(`${LOG_PREFIX} 📡 Сервер API: ${this.API_BASE_URL}`);
            console.log(`${LOG_PREFIX} 🤖 Авто-клики: ${this.autoClickEnabled ? 'ВКЛЮЧЕНЫ' : 'ВЫКЛЮЧЕНЫ'}`);
        }

        this.startNewSession();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupObservers();
            });
        } else {
            this.setupObservers();
        }
    }

    // ========== НАСТРОЙКА НАБЛЮДАТЕЛЕЙ ==========

    setupObservers() {
        this.findChatElements();
        this.scanHtmlBlocks();

        let lastActionButtonState = { exists: false };
        let continueButton = null; // Переменная для кнопки из мутации

        this.domObserver = new MutationObserver((mutations) => {
            let hasResponseChange = false;
            let hasRelevantMutation = false;
            let hasActionButtonChange = false;
            let hasContinueButtonChange = false;

            // Сбрасываем continueButton перед обработкой мутаций
            continueButton = null;

            for (const mutation of mutations) {
                if (this.isRelevantMutation(mutation)) {
                    hasRelevantMutation = true;
                }

                if (this.isActionButtonStateMutation(mutation)) {
                    hasActionButtonChange = true;
                    this._log('mutation', `🔘 Изменение состояния action кнопки`);
                }

                if (this.isResponseMutation(mutation)) {
                    hasResponseChange = true;
                    const content = this.extractContentFromMutation(mutation);
                    if (content && this.state.waitingForResponse) {
                        this.onResponseContentChanged(content);
                    }
                }

                if (this.isLoadingIndicatorInMutation(mutation)) {
                    this._log('waiting', '⏳ Обнаружен индикатор загрузки');
                    this._streamingActive = true;
                }

                // ========== ПРОВЕРКА ПОЯВЛЕНИЯ КНОПКИ CONTINUE ==========
                if (this.isContinueButtonMutation(mutation)) {
                    this._log('continue', '🔍 Обнаружена мутация, связанная с кнопкой Continue', mutation);
                    hasContinueButtonChange = true;
                    // Получаем кнопку из мутации
                    continueButton = this._getContinueButtonFromMutation();
                    if (continueButton) {
                        this._log('continue', `✅ Кнопка получена из мутации, метод: ${continueButton.method}`);
                    }
                }
            }

            if (hasActionButtonChange) {
                const newState = this.getCurrentActionButtonState();
                // Передаём найденную кнопку в обработчик
                this.handleActionButtonStateChange(lastActionButtonState, newState, continueButton);
                lastActionButtonState = newState;
            }

            if (hasRelevantMutation || hasResponseChange || hasContinueButtonChange) {
                this.resetMutationIdleTimer();
            }
        });

        if (document.body) {
            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class', 'style', 'aria-hidden', 'hidden',
                    'disabled', 'readonly', 'data-state', 'aria-busy'
                ],
                characterData: true,
                characterDataOldValue: false
            });
            this._log('info', '✅ Наблюдатель DOM настроен');
        }

        // Отдельный observer для кнопки Continue (более агрессивный)
        this.continueButtonObserver = new MutationObserver((mutations) => {
            let continueButtonFound = false;

            for (const mutation of mutations) {
                if (this.isContinueButtonMutation(mutation)) {
                    continueButtonFound = true;
                    break;
                }
            }

            if (continueButtonFound) {
                setTimeout(async () => {
                    const button = this.findContinueButtonGlobal();
                    if (button && button.isVisible && !button.isDisabled && this.isAutoClickEnabled()) {
                        this._log('continue', '🔍 Кнопка "Continue" обнаружена через отдельный observer');
                        await this.clickHandler.clickButton(button);
                    }
                }, 50);
            }
        });

        if (document.body) {
            this.continueButtonObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'data-testid', 'aria-label', 'disabled']
            });
        }

        this.startMutationIdleTimer();
        this.startResponseTimeoutTimer();

        if (this.logging.showInfo) {
            console.log(`${LOG_PREFIX} ✅ Наблюдатели настроены`);
        }
    }

    // ========== ПРОВЕРКИ ДЛЯ CONTINUE КНОПКИ (ОБНОВЛЕННЫЕ) ==========

    isContinueButtonMutation(mutation) {
        // Если предыдущая кнопка ещё не обработана, не перезаписываем
        if (this._continueButtonFromMutation && !this._continueButtonMutationProcessed) {
            return true;
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (this.isContinueButtonElement(node)) {
                        this._continueButtonFromMutation = node;
                        this._continueButtonMutationProcessed = false;
                        return true;
                    }

                    if (node.querySelector) {
                        const continueElements = node.querySelectorAll('button, div[role="button"], [class*="continue"], [class*="Continue"]');
                        for (const el of continueElements) {
                            if (this.isContinueButtonElement(el)) {
                                this._continueButtonFromMutation = el;
                                this._continueButtonMutationProcessed = false;
                                return true;
                            }
                        }
                    }
                }
            }
        }

        if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (this.isContinueButtonElement(target)) {
                this._continueButtonFromMutation = target;
                this._continueButtonMutationProcessed = false;
                return true;
            }
        }

        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent && this.isContinueButtonElement(parent)) {
                this._continueButtonFromMutation = parent;
                this._continueButtonMutationProcessed = false;
                return true;
            }
            const grandParent = parent?.parentElement;
            if (grandParent && this.isContinueButtonElement(grandParent)) {
                this._continueButtonFromMutation = grandParent;
                this._continueButtonMutationProcessed = false;
                return true;
            }
        }

        return false;
    }

    isContinueButtonElement(element) {
        if (!element) return false;

        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('continue')) {
            const isButton = element.tagName === 'BUTTON' ||
                element.getAttribute('role') === 'button' ||
                element.classList?.contains('ds-button') ||
                element.matches?.('[data-testid*="continue" i]');
            if (isButton) return true;
        }

        const testId = element.getAttribute('data-testid')?.toLowerCase() || '';
        if (testId.includes('continue')) return true;

        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        if (ariaLabel.includes('continue')) return true;

        const className = element.className?.toString?.()?.toLowerCase() || '';
        if (className.includes('continue')) return true;

        return false;
    }

    // ========== НОВЫЙ МЕТОД: ПОЛУЧЕНИЕ КНОПКИ ИЗ МУТАЦИИ ==========

    _getContinueButtonFromMutation() {
        if (!this._continueButtonFromMutation) return null;

        const button = this._continueButtonFromMutation;
        const buttonElement = button;

        // Очищаем ПОСЛЕ получения, но ДО проверки
        this._continueButtonFromMutation = null;
        this._continueButtonMutationProcessed = true;

        // Очищаем таймер если был
        if (this._continueButtonClearTimer) {
            clearTimeout(this._continueButtonClearTimer);
            this._continueButtonClearTimer = null;
        }

        // Проверяем, что элемент всё ещё в DOM и валиден
        if (!document.body.contains(buttonElement)) return null;

        // Проверяем, что элемент не удалён и не заменён
        if (buttonElement.isConnected === false) return null;

        // Формируем объект кнопки
        return {
            element: buttonElement,
            selector: this._generateDynamicSelector(buttonElement),
            isVisible: this._isButtonVisible(buttonElement),
            isDisabled: buttonElement.disabled ||
                buttonElement.getAttribute('disabled') !== null ||
                buttonElement.getAttribute('aria-disabled') === 'true',
            method: 'mutation'
        };
    }

    // Принудительная очистка кэша кнопки
    _clearContinueButtonCache() {
        if (this._continueButtonClearTimer) {
            clearTimeout(this._continueButtonClearTimer);
            this._continueButtonClearTimer = null;
        }
        this._continueButtonFromMutation = null;
        this._continueButtonMutationProcessed = false;
        this._lastProcessedContinueButton = null;
    }

    // Генерация динамического селектора для элемента
    _generateDynamicSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        const dataAttrs = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `[${attr.name}="${attr.value}"]`);

        if (dataAttrs.length > 0) {
            return dataAttrs[0];
        }

        let selector = element.tagName.toLowerCase();
        const validClasses = Array.from(element.classList)
            .filter(c => !c.match(/^_[a-f0-9]+$|^[a-f0-9]{6,}$/));

        if (validClasses.length > 0) {
            selector += '.' + validClasses.join('.');
        }

        const parent = element.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        return selector;
    }

    // Проверка видимости кнопки
    _isButtonVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0';
    }

    // ========== ПРОВЕРКА РЕЛЕВАНТНОСТИ МУТАЦИЙ ==========

    isRelevantMutation(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (this.isChatElement(node)) return true;
                }
            }
        }

        if (mutation.type === 'attributes') {
            const relevantAttrs = ['class', 'style', 'disabled', 'aria-busy', 'data-state'];
            if (relevantAttrs.includes(mutation.attributeName)) {
                const target = mutation.target;
                if (this.isChatElement(target)) return true;
            }
        }

        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent && this.isMessageElement(parent)) return true;
        }

        return false;
    }

    isChatElement(element) {
        if (!element) return false;

        const chatSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '#chat-input', 'textarea', '[contenteditable="true"]',
            '.loading', '.streaming', '.typing-indicator',
            '.chat-container', '.message-list', '.ds-markdown'
        ];

        for (const selector of chatSelectors) {
            if (element.matches && element.matches(selector)) return true;
            if (element.querySelector && element.querySelector(selector)) return true;
        }

        return false;
    }

    isResponseMutation(mutation) {
        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent && this.isMessageElement(parent)) return true;
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isMessageElement(node)) {
                    return true;
                }
            }
        }

        return false;
    }

    extractContentFromMutation(mutation) {
        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent) {
                const html = this.extractHtmlContent(parent);
                const text = this.extractTextContent(parent);
                return { text, html };
            }
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isMessageElement(node)) {
                    const html = this.extractHtmlContent(node);
                    const text = this.extractTextContent(node);
                    return { text, html };
                }
            }
        }

        return null;
    }

    extractHtmlContent(element) {
        if (!element) return '';

        const contentSelectors = [
            '.ds-markdown',
            '.markdown-body',
            '.prose',
            '[class*="message-content"]',
            '[class*="response-text"]',
            '.assistant-message',
            '.ai-message',
            '[data-message-role="assistant"]'
        ];

        for (const selector of contentSelectors) {
            const contentElement = element.querySelector ? element.querySelector(selector) :
                (element.matches && element.matches(selector) ? element : null);

            if (contentElement) {
                return contentElement.innerHTML;
            }
        }

        return element.outerHTML || '';
    }

    extractTextContent(element) {
        if (!element) return '';

        const contentSelectors = [
            '.ds-markdown',
            '.markdown-body',
            '.prose',
            '[class*="message-content"]',
            '[class*="response-text"]'
        ];

        for (const selector of contentSelectors) {
            const contentElement = element.querySelector ? element.querySelector(selector) :
                (element.matches && element.matches(selector) ? element : null);

            if (contentElement && contentElement.textContent) {
                return contentElement.textContent.trim();
            }
        }

        return element.textContent?.trim() || '';
    }

    // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ACTION КНОПКОЙ ==========

    isActionButtonElement(element) {
        if (!element) return false;

        const hasButtonClass = element.classList?.contains('ds-button') ||
            element.classList?.contains('_52c986b');

        if (!hasButtonClass) return false;

        const svg = element.querySelector('svg');
        if (!svg) return false;

        const path = svg.querySelector('path');
        if (!path) return false;

        const d = path.getAttribute('d') || '';

        return d.includes('M8.3125 0.981587') ||
            d.includes('M2 4.88C2 3.68009');
    }

    isActionButtonStateMutation(mutation) {
        if (mutation.type === 'attributes') {
            const target = mutation.target;
            const isActionButton = this.isActionButtonElement(target);

            if (isActionButton) {
                const changedAttributes = ['class', 'aria-disabled', 'disabled', 'tabindex', 'style'];
                if (changedAttributes.includes(mutation.attributeName)) {
                    return true;
                }
            }
        }

        if (mutation.type === 'childList') {
            const checkNodes = (nodes) => {
                for (const node of nodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (this.isActionButtonElement(node)) return true;
                        if (node.querySelector && node.querySelector('svg[viewBox="0 0 16 16"]')) {
                            if (node.querySelector('button, [role="button"]')) return true;
                        }
                    }
                }
                return false;
            };

            if (mutation.addedNodes.length && checkNodes(mutation.addedNodes)) {
                return true;
            }

            if (mutation.removedNodes.length && checkNodes(mutation.removedNodes)) {
                return true;
            }
        }

        return false;
    }

    findActionButton() {
        const result = {
            element: null,
            type: null,
            state: null,
            isVisible: false,
            isDisabled: false,
            additionalInfo: null
        };

        const isElementVisible = (element) => {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0';
        };

        const buttons = document.querySelectorAll('button, div[role="button"]');
        let foundButton = null;
        let foundType = null;

        for (const btn of buttons) {
            if (!isElementVisible(btn)) continue;

            const svg = btn.querySelector('svg');
            if (!svg) continue;

            const path = svg.querySelector('path');
            if (!path) continue;

            const d = path.getAttribute('d') || '';

            const isSquareIcon = d.includes('M2 4.88C2 3.68009');
            const isArrowIcon = d.includes('M8.3125 0.981587');

            if (isSquareIcon) {
                foundButton = btn;
                foundType = 'square';
                break;
            }
            if (isArrowIcon) {
                foundButton = btn;
                foundType = 'arrow';
                break;
            }
        }

        if (!foundButton) {
            result.state = 'loading';
            result.isDisabled = true;
            result.additionalInfo = { message: 'Кнопка не найдена - состояние загрузки' };
            this._log('loading', `⏳ Состояние: ЗАГРУЗКА (кнопка не найдена)`);
            return result;
        }

        result.element = foundButton;
        result.isVisible = true;
        result.type = foundType;

        const isDisabled = foundButton.disabled ||
            foundButton.getAttribute('disabled') !== null ||
            foundButton.getAttribute('aria-disabled') === 'true' ||
            foundButton.classList?.contains('ds-button--disabled');

        if (foundType === 'square') {
            result.state = 'streaming';
            result.isDisabled = false;
            result.additionalInfo = { iconType: 'square', message: 'Стриминг активен' };
            this._log('square', `🎬 Состояние: СТРИМИНГ (квадрат)`);
        } else if (foundType === 'arrow') {
            if (isDisabled) {
                result.state = 'disabled';
                result.isDisabled = true;
                result.additionalInfo = { iconType: 'arrow', message: 'Кнопка неактивна' };
                this._log('arrow', `⏸️ Состояние: НЕАКТИВНА (стрелка disabled)`);
            } else {
                result.state = 'active';
                result.isDisabled = false;
                result.additionalInfo = { iconType: 'arrow', message: 'Кнопка активна' };
                this._log('arrow', `✅ Состояние: АКТИВНА (стрелка active)`);
            }
        }

        return result;
    }

    getCurrentActionButtonState() {
        const button = this.findActionButton();

        return {
            exists: button.element !== null,
            type: button.type,
            state: button.state,
            isActive: button.type === 'arrow' && button.state === 'active',
            isStreaming: button.type === 'square' && button.state === 'streaming',
            isDisabled: button.state === 'disabled' || button.state === 'loading',
            isLoading: button.state === 'loading',
            timestamp: Date.now()
        };
    }

    isStreamingCompleted() {
        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        const isNotStreaming = !actionState.isStreaming;
        const isActionReady = actionState.isActive || actionState.isDisabled;

        let noActiveContinueButton = true;

        if (continueButton && continueButton.isVisible) {
            if (!continueButton.isDisabled) {
                noActiveContinueButton = false;
                this._log('continue', `⏳ Обнаружена активная кнопка "Continue" - стриминг еще не завершен`);
            } else {
                this._log('continue', `ℹ️ Кнопка "Continue" найдена, но отключена (disabled)`);
            }
        }

        const isCompleted = isNotStreaming && isActionReady && noActiveContinueButton;

        if (isCompleted) {
            this._log('response', `✅ Стриминг завершен (состояние: ${actionState.state}, Continue активна: ${!noActiveContinueButton})`);
        } else if (continueButton && continueButton.isVisible && !continueButton.isDisabled) {
            this._log('continue', `⏳ Стриминг завершен, но обнаружена активная кнопка "Continue" - ожидаем ее обработку`);
        }

        return isCompleted;
    }

    handleActionButtonStateChange(oldState, newState, continueButton) {
        // Сохраняем обработанную кнопку
        if (continueButton) {
            this._lastProcessedContinueButton = continueButton;
        }

        if (!oldState.exists && newState.exists) {
            this._log('arrow', `🆕 Появилась action кнопка: ${newState.type} (${newState.state})`);
            return;
        }

        if (oldState.exists && !newState.exists) {
            this._log('arrow', `🗑️ Action кнопка исчезла`);

            if (this.state.waitingForResponse && !this.processingCompleted) {
                const globalContinueButton = this.findContinueButtonGlobal();
                if (globalContinueButton && globalContinueButton.isVisible) {
                    this._log('continue', `🔄 Кнопка "Continue" активна, обрабатываем вместо завершения`);
                    this.handleContinueButton(globalContinueButton);
                    return;
                }

                if (this.isStreamingCompleted()) {
                    const response = this.getLatestAssistantResponse();
                    if (response && response.text && response.text.length > 0) {
                        this.completeTaskAndSave(response);
                    }
                }
            }
            return;
        }

        if (oldState.exists && newState.exists) {
            if (oldState.type !== newState.type) {
                this._log('arrow', `🔄 Изменение типа кнопки: ${oldState.type} -> ${newState.type}`);

                if (oldState.type === 'square' && newState.type === 'arrow') {
                    this._log('response', `✅ смена квадрата на стрелку`);

                    // Используем кнопку из мутации если она есть, иначе ищем глобально
                    const hasContinueButton = continueButton && continueButton.isVisible &&
                        continueButton.element && continueButton.element.isConnected !== false;

                    this._log('continue', `🔍 Проверка кнопки Continue: из мутации=${!!continueButton}, isVisible=${continueButton?.isVisible}, hasContinueButton=${hasContinueButton}`);

                    if (hasContinueButton) {
                        this._log('continue', `🔄 Обнаружена кнопка "Continue" после смены иконки, обрабатываем...`);
                        this.handleContinueButton(continueButton);
                        // Очищаем кэш после обработки
                        this._clearContinueButtonCache();
                        return;
                    }

                    if (this.state.waitingForResponse && !this.processingCompleted) {
                        const response = this.getLatestAssistantResponse();
                        if (response && response.text && response.text.length > 0) {
                            this.completeTaskAndSave(response);
                        }
                    }
                }
                return;
            }

            if (oldState.state !== newState.state) {
                this._log('arrow', `🔄 Изменение состояния ${newState.type}: ${oldState.state} -> ${newState.state}`);

                if (oldState.state === 'streaming' && newState.state !== 'streaming') {
                    this._log('response', `✅ Стриминг завершен (выход из streaming состояния)`);

                    const globalContinueButton = this.findContinueButtonGlobal();
                    if (globalContinueButton && globalContinueButton.isVisible) {
                        this._log('continue', `🔄 Кнопка "Continue" обнаружена, обрабатываем`);
                        this.handleContinueButton(globalContinueButton);
                        return;
                    }

                    if (this.state.waitingForResponse && !this.processingCompleted) {
                        const response = this.getLatestAssistantResponse();
                        if (response && response.text && response.text.length > 0) {
                            this.completeTaskAndSave(response);
                        }
                    }
                }
            }
        }

        if (this.state.waitingForResponse && !this.processingCompleted) {
            if (this.isStreamingCompleted()) {
                const response = this.getLatestAssistantResponse();
                if (response && response.text && response.text.length > 0) {
                    this.completeTaskAndSave(response);
                }
            }
        }
    }

    isAutoClickEnabled() {
        return this.autoClickEnabled !== false;
    }

    setAutoClickEnabled(enabled) {
        this.autoClickEnabled = enabled;
        this._log('operator', `🤖 Автоматические нажатия ${enabled ? 'ВКЛЮЧЕНЫ' : 'ОТКЛЮЧЕНЫ'}`);
    }

    emitContinueButtonDetected(continueButton) {
        if (this.onContinueButtonDetected) {
            this.onContinueButtonDetected({
                timestamp: Date.now(),
                buttonInfo: continueButton,
                continueClicksCount: this._continueClickCount
            });
        }

        if (this.eventBus) {
            this.eventBus.emit('ui:continue-button-detected', {
                timestamp: Date.now(),
                buttonInfo: continueButton,
                continueClicksCount: this._continueClickCount
            }, { source: 'DeepSeekChatMonitor' });
        }
    }

    findContinueButtonGlobal() {
        return this.clickHandler.findContinueButton();
    }

    handleContinueButton(continueButton) {
        if (!continueButton || !continueButton.isVisible) return;

        if (this.isAutoClickEnabled()) {
            this._log('continue', '🔄 Обнаружена кнопка "Continue"');
            this.clickHandler.clickButton(continueButton);
        } else {
            this._log('continue', '👀 Отслеживание кнопки "Continue" (авто-клик отключен)');
            this.emitContinueButtonDetected(continueButton);
        }
    }

    // ========== ТАЙМЕР БЕЗДЕЙСТВИЯ МУТАЦИЙ ==========

    startMutationIdleTimer() {
        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);

        this._mutationIdleTimer = setInterval(() => {
            if (!this.state.waitingForResponse || this.processingCompleted) return;

            const now = Date.now();
            const idleTime = this._lastMutationTime ? now - this._lastMutationTime : 0;

            if (idleTime >= this.detectionConfig.mutationIdleTimeout) {
                this._log('mutation', `⚠️ Нет мутаций в течение ${idleTime/1000} секунд`);

                const isStreamingFromButton = this.checkResponseViaButtonState();
                if (!isStreamingFromButton && !this._streamingActive) {
                    const response = this.getLatestAssistantResponse();
                    if (response && response.text && response.text.length > 0) {
                        this._log('response', '✅ Завершаем задачу: кнопка показывает стрелку (ответ готов)');
                        this.completeTaskAndSave(response);
                        return;
                    }
                }

                const continueButton = this.findContinueButtonGlobal();
                if (continueButton && continueButton.isVisible) {
                    this.handleContinueButton(continueButton);
                    this._lastMutationTime = Date.now();
                    this._consecutiveIdleChecks = 0;
                    return;
                }

                const loadingIndicator = this.findLoadingIndicatorGlobal();
                if (loadingIndicator && this.isElementVisible(loadingIndicator)) {
                    this._log('waiting', '⏳ Индикатор загрузки активен, продлеваем ожидание');
                    this._lastMutationTime = Date.now();
                    this._consecutiveIdleChecks = 0;
                    return;
                }

                const response = this.getLatestAssistantResponse();
                if (response && response.text && response.text.length > 0) {
                    const isComplete = this.isSentenceComplete(response.text);

                    if (isComplete || this._consecutiveIdleChecks >= this._maxIdleChecks) {
                        this._log('response', `✅ Завершаем задачу: ответ получен`);
                        this.completeTaskAndSave(response);
                        return;
                    } else {
                        this._log('waiting', `⏳ Ответ не завершен, ждем... (${this._consecutiveIdleChecks + 1}/${this._maxIdleChecks})`);
                        this._consecutiveIdleChecks++;
                        this._lastMutationTime = now;
                        return;
                    }
                }

                this._consecutiveIdleChecks++;

                if (this._consecutiveIdleChecks >= this._maxIdleChecks) {
                    this._log('pending', '⚠️ Нет прогресса, завершаем задачу');
                    this.detectPendingAction('mutation_idle', {
                        description: `Нет DOM мутаций и нет прогресса`,
                        idleTime: idleTime
                    });
                    this.onChatError('No progress - task stalled');
                } else {
                    this._log('waiting', `⏳ Ожидаем... (${this._consecutiveIdleChecks}/${this._maxIdleChecks})`);
                    this._lastMutationTime = now;
                }
            }
        }, 1000);
    }

    resetMutationIdleTimer() {
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
    }

    startResponseTimeoutTimer() {
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);

        this.responseTimeoutTimer = setTimeout(() => {
            if (!this.state.waitingForResponse || this.processingCompleted) return;

            const elapsed = Date.now() - (this.state.startTime || Date.now());
            if (elapsed >= this.detectionConfig.responseWaitTimeout) {
                this._log('error', `❌ ТАЙМАУТ: Ответ не получен за ${elapsed/1000} секунд`);

                const continueButton = this.findContinueButtonGlobal();
                if (continueButton && continueButton.isVisible) {
                    this._log('continue', '🔄 Нажатие кнопки "Continue" при таймауте');
                    this.handleContinueButton(continueButton);
                    this.startResponseTimeoutTimer();
                    return;
                }

                this.detectPendingAction('timeout', {
                    description: `Ответ не получен в течение ${this.detectionConfig.responseWaitTimeout/1000} секунд`,
                    elapsedTime: elapsed
                });
                this.onChatError('Timeout waiting for response');
            }
        }, this.detectionConfig.responseWaitTimeout);
    }

    resetResponseTimeoutTimer() {
        if (this.responseTimeoutTimer) {
            clearTimeout(this.responseTimeoutTimer);
            this.startResponseTimeoutTimer();
        }
    }

    // ========== ПРОВЕРКА СОСТОЯНИЯ КНОПКИ ==========

    isStreamingActiveFromButton() {
        const buttons = document.querySelectorAll('.ds-button svg[viewBox="0 0 16 16"]');

        for (const svg of buttons) {
            const path = svg.querySelector('path');
            if (path && path.getAttribute('d')) {
                const d = path.getAttribute('d');

                if (d.includes('M2 4.88C2 3.68009')) {
                    const btn = svg.closest('.ds-button, div[role="button"]');
                    if (btn && this.isElementVisible(btn)) {
                        this._log('debug', '🎬 Обнаружена иконка-квадрат - стриминг активен');
                        return true;
                    }
                }

                if (d.includes('M8.3125 0.981587')) {
                    this._log('debug', '✅ Обнаружена иконка-стрелка - стриминг завершен');
                    return false;
                }
            }
        }

        return this._streamingActive;
    }

    checkResponseViaButtonState() {
        const isStreaming = this.isStreamingActiveFromButton();

        if (!isStreaming && this._streamingActive) {
            this._log('response', '📢 Кнопка сменила иконку (квадрат -> стрелка), стриминг завершен');

            const continueButton = this.findContinueButtonGlobal();
            if (continueButton && continueButton.isVisible) {
                this._log('continue', '🔄 Обнаружена кнопка "Continue" при смене иконки, обрабатываем');
                this.handleContinueButton(continueButton);
                return true;
            }

            const response = this.getLatestAssistantResponse();
            if (response && response.text && response.text.length > 0) {
                this.completeTaskAndSave(response);
                return true;
            }
        }

        this._streamingActive = isStreaming;
        return isStreaming;
    }

    // ========== ПОИСК ИНДИКАТОРА ЗАГРУЗКИ ==========

    findLoadingIndicatorGlobal() {
        const selectors = [
            '.loading', '.streaming', '.typing-indicator',
            '[aria-busy="true"]', '[class*="loading"]', '[class*="streaming"]',
            '.ds-loading', '.spinner', '.loader',
            '.ds-typing-indicator', '.ds-loading-spinner',
            '.dots-loading', '.three-dots', '.typing-dots',
            '.message-typing', '.thinking-indicator',
            '[data-streaming="true"]', '[data-generating="true"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (this.isElementVisible(element)) {
                    return element;
                }
            }
        }

        if (this.chatInput && (this.chatInput.disabled ||
            this.chatInput.getAttribute('readonly') !== null)) {
            return this.chatInput;
        }

        return null;
    }

    isLoadingIndicator(element) {
        if (!element) return false;

        const loadingSelectors = [
            '.loading', '.streaming', '.typing-indicator',
            '[aria-busy="true"]', '[class*="loading"]', '[class*="streaming"]'
        ];

        for (const selector of loadingSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
        }

        return false;
    }

    isLoadingIndicatorInMutation(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isLoadingIndicator(node)) {
                    return true;
                }
            }
        }

        if (mutation.type === 'attributes') {
            if (this.isLoadingIndicator(mutation.target)) return true;
        }

        return false;
    }

    isSentenceComplete(text) {
        if (!text) return false;

        const sentenceEndings = /[.!?;:。！？；：]$/;
        if (sentenceEndings.test(text.trim())) {
            return true;
        }

        const quotes = /["'”»)]$/;
        if (quotes.test(text.trim())) {
            return true;
        }

        if (text.length > 200) {
            const continueIndicators = /(,|и|но|однако|потому что|так как|and|but|however|because)$/i;
            if (!continueIndicators.test(text.trim())) {
                return true;
            }
        }

        if (/```[\\s\\S]*```$/.test(text.trim())) {
            return true;
        }

        return false;
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ ==========

    isMessageElement(element) {
        if (!element) return false;

        const messageSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message.assistant', '.chat-message.assistant', '[class*="assistant"]',
            '.ds-markdown', '.markdown-body', '[class*="message-content"]'
        ];

        for (const selector of messageSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.querySelector && element.querySelector(selector)) {
                return true;
            }
        }

        return false;
    }

    getLatestAssistantResponse() {
        const assistantSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message[data-role="assistant"]', '.chat-message.assistant',
            '[class*="assistant"]', '[class*="bot"]', '[class*="response"]',
            '.ds-markdown', '.markdown-body', '[class*="message-content"]'
        ];

        for (const selector of assistantSelectors) {
            const messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];

                const isUserMessage = lastMessage.matches('[data-message-role="user"]') ||
                    lastMessage.classList.contains('user-message') ||
                    lastMessage.closest('[data-message-role="user"]');

                if (!isUserMessage) {
                    const htmlContent = this.extractHtmlContent(lastMessage);
                    const textContent = this.extractTextContent(lastMessage);

                    this._currentResponseElement = lastMessage;

                    return {
                        text: textContent,
                        html: htmlContent,
                        raw: lastMessage.outerHTML,
                        element: lastMessage
                    };
                }
            }
        }
        return null;
    }

    onResponseContentChanged(content) {
        if (!this.state.waitingForResponse) return;
        if (!content) return;

        const currentTime = Date.now();

        let textContent = content;
        let htmlContent = content;

        if (typeof content === 'object') {
            textContent = content.text || '';
            htmlContent = content.html || content;
        }

        if (textContent !== this._lastResponseText) {
            this._lastResponseText = textContent;
            this._lastResponseHtml = htmlContent;
            this._lastMutationTime = currentTime;
            this._streamingActive = true;
            this.resetResponseTimeoutTimer();
            this.resetMutationIdleTimer();

            if (this.currentTask && this.currentTask.htmlChunks) {
                this.currentTask.htmlChunks.push({
                    timestamp: currentTime,
                    html: htmlContent,
                    text: textContent,
                    length: textContent.length
                });
            }

            this._log('response', `📝 Получен фрагмент ответа (${textContent.length} символов, HTML: ${htmlContent?.length || 0} символов)`);

            this.updateState({
                currentAssistantResponse: textContent,
                currentAssistantResponseHtml: htmlContent
            });
        }
    }

    completeTaskAndSave(responseContent) {
        if (this.processingCompleted) return;

        this.processingCompleted = true;

        let textResponse = responseContent;
        let htmlResponse = responseContent;
        let rawResponse = responseContent;

        if (typeof responseContent === 'object') {
            textResponse = responseContent.text || '';
            htmlResponse = responseContent.html || responseContent;
            rawResponse = responseContent.raw || responseContent;
        }

        const finalResponse = this.getLatestAssistantResponse();
        if (finalResponse) {
            textResponse = finalResponse.text;
            htmlResponse = finalResponse.html;
            rawResponse = finalResponse.raw;
        }

        this.updateState({
            currentAssistantResponse: textResponse,
            currentAssistantResponseHtml: htmlResponse,
            waitingForResponse: false,
            responseReceived: true,
            isChatProcessing: false,
            isComplete: true,
            endTime: Date.now()
        });

        this.onChatComplete();
    }

    scanHtmlBlocks() {
        const inputSelectors = ['#chat-input', 'textarea', '[contenteditable="true"]', '[data-testid="chat-input"]', '[class*="chat-input"]'];
        for (const selector of inputSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.chatInput !== element) {
                    this.chatInput = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const buttonSelectors = ['button[type="submit"]', 'button[aria-label*="send" i]', '.send-button', '[class*="send"]'];
        for (const selector of buttonSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.sendButton !== element) {
                    this.sendButton = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const loadingSelectors = ['.loading', '.streaming', '.typing-indicator', '[aria-busy="true"]', '[class*="loading"]'];
        for (const selector of loadingSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                this.htmlBlocks.loadingIndicator = element;
                break;
            }
        }

        const messageSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message.assistant', '[class*="assistant"]', '[class*="bot"]',
            '[class*="response"]', '.message:last-child', '.ds-markdown', '.markdown-body'
        ];

        this.htmlBlocks.messageBlocks = [];

        for (const selector of messageSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!this.htmlBlocks.messageBlocks.includes(el) && el.textContent && el.textContent.length > 10) {
                    this.htmlBlocks.messageBlocks.push(el);
                }
            });
        }
    }

    setupSendHandlers() {
        if (!this.chatInput) return;

        if (this._enterHandlerAttached && this._enterKeyHandler) {
            this.chatInput.removeEventListener('keydown', this._enterKeyHandler);
        }

        this._enterKeyHandler = (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                const currentText = this.getInputText();
                if (currentText && currentText.length > 0 && !this.processingStarted) {
                    event.preventDefault();
                    this._log('send', '🔴 ПОЛЬЗОВАТЕЛЬ НАЖАЛ ENTER');
                    this._log('send', `Сообщение: "${currentText.substring(0, 200)}"`);

                    this.resetForNewTask();

                    this.updateState({
                        userMessageSent: true,
                        currentUserMessage: currentText,
                        waitingForResponse: true,
                        responseReceived: false
                    });
                    this.onChatStart(currentText);
                }
            }
        };

        this.chatInput.addEventListener('keydown', this._enterKeyHandler);
        this._enterHandlerAttached = true;

        if (this.sendButton && !this._clickHandlerAttached) {
            this._clickHandler = () => {
                const currentText = this.getInputText();
                if (currentText && currentText.length > 0 && !this.processingStarted) {
                    this._log('send', '🔴 ПОЛЬЗОВАТЕЛЬ НАЖАЛ КНОПКУ ОТПРАВКИ');
                    this._log('send', `Сообщение: "${currentText.substring(0, 200)}"`);

                    this.resetForNewTask();

                    this.updateState({
                        userMessageSent: true,
                        currentUserMessage: currentText,
                        waitingForResponse: true,
                        responseReceived: false
                    });
                    this.onChatStart(currentText);
                }
            };
            this.sendButton.addEventListener('click', this._clickHandler);
            this._clickHandlerAttached = true;
        }
    }

    resetForNewTask() {
        this.processingStarted = false;
        this.processingCompleted = false;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;
        this._continueClickCount = 0;
        this._startWaitingLogged = false;

        // Очищаем кэш кнопки из мутации при старте новой задачи
        this._clearContinueButtonCache();

        if (this.currentTask) {
            this.currentTask.htmlChunks = [];
            this.currentTask.assistantResponseHtml = null;
            this.currentTask.assistantResponseRaw = null;
        }

        this.resetMutationIdleTimer();
        this.resetResponseTimeoutTimer();
    }

    getInputText() {
        if (!this.chatInput) return '';

        if (this.chatInput.tagName === 'TEXTAREA' || this.chatInput.tagName === 'INPUT') {
            return this.chatInput.value || '';
        }

        if (this.chatInput.isContentEditable) {
            return this.chatInput.textContent || '';
        }

        return '';
    }

    isElementVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    findChatElements() {
        const inputSelectors = [
            '#chat-input', 'textarea', '[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]', '[data-testid="chat-input"]', 'input[type="text"]', '.chat-input',
            '[class*="input"]', '[class*="chat"]'
        ];

        for (const selector of inputSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.chatInput !== element) {
                    this.chatInput = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const buttonSelectors = [
            'button[type="submit"]', 'button[aria-label*="send" i]',
            'button[aria-label*="отправить" i]', '.send-button', '#send-button',
            '[class*="send"]'
        ];

        for (const selector of buttonSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.sendButton !== element) {
                    this.sendButton = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }
    }

    validateResponse(userMessage, assistantResponse, duration) {
        const validation = {
            isValid: true,
            checks: {
                hasContent: false,
                contentLength: false,
                hasHtmlBlocks: false,
                hasProperState: false,
                timeValid: false,
                noErrors: false
            },
            issues: [],
            score: 0
        };

        if (assistantResponse && assistantResponse.length > 0) {
            validation.checks.hasContent = true;
            validation.score += 20;
        } else {
            validation.isValid = false;
            validation.issues.push('Ответ не содержит контента');
        }

        if (assistantResponse && assistantResponse.length >= this.validationRules.minResponseLength) {
            validation.checks.contentLength = true;
            validation.score += 20;
        } else {
            validation.issues.push(`Ответ слишком короткий (${assistantResponse?.length || 0} < ${this.validationRules.minResponseLength})`);
        }

        const hasAssistantBlock = this.htmlBlocks.messageBlocks.length > 0;
        if (hasAssistantBlock) {
            validation.checks.hasHtmlBlocks = true;
            validation.score += 20;
        } else {
            validation.issues.push('Не найдены HTML блоки с ответом ассистента');
        }

        const hasValidState = this.state.isComplete && !this.state.hasError;
        if (hasValidState) {
            validation.checks.hasProperState = true;
            validation.score += 20;
        }

        const isTimeValid = duration <= this.validationRules.maxResponseTime;
        if (isTimeValid) {
            validation.checks.timeValid = true;
            validation.score += 10;
        }

        if (!this.state.hasError) {
            validation.checks.noErrors = true;
            validation.score += 10;
        }

        validation.isValid = validation.score >= 60;

        if (this.logging.showValidation) {
            this._log('validation', `${validation.isValid ? 'ПРОЙДЕНА' : 'НЕ ПРОЙДЕНА'} (score: ${validation.score})`);
        }

        return validation;
    }

    detectPendingAction(type, details = {}) {
        const actionTypes = {
            response_not_found: {
                description: 'Ответ от сервера не получен',
                severity: 'high',
                suggestedAction: 'Проверьте соединение с интернетом и перезагрузите страницу чата'
            },
            html_blocks_missing: {
                description: 'HTML блоки с ответом ассистента не найдены',
                severity: 'medium',
                suggestedAction: 'Обновите страницу или проверьте структуру DOM'
            },
            timeout: {
                description: 'Превышено время ожидания ответа',
                severity: 'high',
                suggestedAction: 'Отправьте запрос повторно или проверьте работу сервера'
            },
            unknown: {
                description: 'Неизвестная проблема',
                severity: 'medium',
                suggestedAction: 'Проверьте консоль разработчика'
            },
            no_response_content: {
                description: 'Ответ получен, но не содержит контента',
                severity: 'low',
                suggestedAction: 'Уточните запрос или попробуйте переформулировать вопрос'
            },
            mutation_idle: {
                description: 'Нет DOM мутаций при ожидании ответа',
                severity: 'medium',
                suggestedAction: 'Проверьте загрузку страницы и работу чата'
            },
            task_stalled: {
                description: 'Задача зависла без прогресса',
                severity: 'high',
                suggestedAction: 'Перезагрузите страницу или проверьте соединение'
            }
        };

        const action = actionTypes[type] || actionTypes.unknown;

        const pendingAction = {
            isPending: true,
            type: type,
            description: details.description || action.description,
            detectedAt: Date.now(),
            severity: details.severity || action.severity,
            suggestedAction: details.suggestedAction || action.suggestedAction,
            details: details,
            autoResolved: false,
            resolvedAt: null,
            resolutionMethod: null
        };

        this.state.pendingUserAction = pendingAction;

        if (this.currentTask) {
            this.currentTask.pendingActions.push({ ...pendingAction });
        }
        if (this.currentSession) {
            this.currentSession.pendingActions.push({ ...pendingAction });
        }

        this._log('pending', `⚠️ ОБНАРУЖЕНО НЕОПРЕДЕЛЕННОЕ ПОВЕДЕНИЕ`);
        this._log('pending', `Тип: ${type}`);
        this._log('pending', `Описание: ${pendingAction.description}`);
        this._log('pending', `Серьезность: ${pendingAction.severity.toUpperCase()}`);
        this._log('pending', `Рекомендация: ${pendingAction.suggestedAction}`);

        if (this.onPendingAction) {
            this.onPendingAction(pendingAction);
        }

        this.sendPendingToServer();

        return pendingAction;
    }

    resolvePendingAction(resolutionMethod) {
        if (!this.state.pendingUserAction.isPending) {
            return null;
        }

        this.state.pendingUserAction.autoResolved = true;
        this.state.pendingUserAction.resolvedAt = Date.now();
        this.state.pendingUserAction.resolutionMethod = resolutionMethod;

        this._log('pending', `✅ НЕОПРЕДЕЛЕННОЕ ПОВЕДЕНИЕ РАЗРЕШЕНО`);
        this._log('pending', `Метод: ${resolutionMethod}`);

        this.state.pendingUserAction = {
            isPending: false,
            type: null,
            description: null,
            detectedAt: null,
            severity: 'medium',
            suggestedAction: null,
            autoResolved: false,
            resolvedAt: null,
            resolutionMethod: null
        };

        return true;
    }

    startNewSession() {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.currentSession = {
            id: sessionId,
            startTime: Date.now(),
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };

        this.chatHistory.currentSession = this.currentSession;

        this._log('session', `НОВАЯ СЕССИЯ: ${sessionId}`);
        this._log('session', `Время начала: ${new Date().toLocaleString()}`);

        if (this.onSessionUpdate) {
            this.onSessionUpdate(this.currentSession);
        }

        return this.currentSession;
    }

    endCurrentSession() {
        if (!this.currentSession || this.currentSession.id === null) {
            return null;
        }

        this.currentSession.endTime = Date.now();
        this.currentSession.status = 'completed';

        const duration = ((this.currentSession.endTime - this.currentSession.startTime) / 1000).toFixed(2);

        this._log('session', `ЗАВЕРШЕНИЕ СЕССИИ: ${this.currentSession.id}`);
        this._log('session', `Длительность: ${duration} секунд`);
        this._log('session', `Задач выполнено: ${this.currentSession.completedTasks}/${this.currentSession.totalTasks}`);
        this._log('session', `Ошибок: ${this.currentSession.failedTasks}`);

        this.chatHistory.sessions.push({ ...this.currentSession });

        if (this.chatHistory.sessions.length > 50) {
            this.chatHistory.sessions.shift();
        }

        if (this.onSessionUpdate) {
            this.onSessionUpdate(this.currentSession);
        }

        return this.currentSession;
    }

    createTask(userMessage) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.currentTask = {
            id: taskId,
            userMessage: userMessage,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            status: 'processing',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };

        if (this.currentSession.tasks) {
            this.currentSession.tasks.push(this.currentTask);
            this.currentSession.totalTasks++;
        }

        this._log('task', `📌 НОВАЯ ЗАДАЧА: ${taskId}`);
        this._log('task', `Сообщение: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`);

        return this.currentTask;
    }

    completeTask(assistantResponse, validation) {
        if (!this.currentTask || this.currentTask.id === null) {
            return null;
        }

        this.currentTask.endTime = Date.now();
        this.currentTask.duration = this.currentTask.endTime - this.currentTask.startTime;

        if (typeof assistantResponse === 'object') {
            this.currentTask.assistantResponse = assistantResponse.text || '';
            this.currentTask.assistantResponseHtml = assistantResponse.html || '';
            this.currentTask.assistantResponseRaw = assistantResponse.raw || '';
        } else {
            this.currentTask.assistantResponse = assistantResponse;
            this.currentTask.assistantResponseHtml = assistantResponse;
            this.currentTask.assistantResponseRaw = assistantResponse;
        }

        this.currentTask.status = validation.isValid ? 'completed' : 'failed';
        this.currentTask.validation = validation;

        if (this.currentSession) {
            if (validation.isValid) {
                this.currentSession.completedTasks++;
            } else {
                this.currentSession.failedTasks++;
            }

            const taskIndex = this.currentSession.tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                this.currentSession.tasks[taskIndex] = { ...this.currentTask };
            }
        }

        this._log('task', `✅ ЗАВЕРШЕНИЕ ЗАДАЧИ: ${this.currentTask.id}`);
        this._log('task', `Статус: ${validation.isValid ? 'УСПЕШНО' : 'ПРОВАЛ'}`);
        this._log('task', `Длительность: ${(this.currentTask.duration / 1000).toFixed(2)} секунд`);
        this._log('task', `HTML ответа: ${this.currentTask.assistantResponseHtml?.length || 0} символов`);

        if (this.onTaskComplete) {
            this.onTaskComplete(this.currentTask);
        }

        return this.currentTask;
    }

    failTask(errorMessage) {
        if (!this.currentTask || this.currentTask.id === null) {
            return null;
        }

        this.currentTask.endTime = Date.now();
        this.currentTask.duration = this.currentTask.endTime - this.currentTask.startTime;
        this.currentTask.status = 'failed';
        this.currentTask.error = errorMessage;

        if (this.currentSession) {
            this.currentSession.failedTasks++;

            const taskIndex = this.currentSession.tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                this.currentSession.tasks[taskIndex] = { ...this.currentTask };
            }
        }

        this._log('task', `❌ ОШИБКА ЗАДАЧИ: ${this.currentTask.id}`);
        this._log('task', `Ошибка: ${errorMessage}`);

        return this.currentTask;
    }

    async sendTaskToServer() {
        if (!this.currentTask || this.currentTask.status !== 'completed') return;

        const taskData = {
            id: this.currentTask.id,
            sessionId: this.currentSession.id,
            userMessage: this.currentTask.userMessage,
            assistantResponse: this.currentTask.assistantResponse,
            assistantResponseHtml: this.currentTask.assistantResponseHtml,
            assistantResponseRaw: this.currentTask.assistantResponseRaw,
            htmlChunks: this.currentTask.htmlChunks,
            startTime: this.currentTask.startTime,
            endTime: this.currentTask.endTime,
            duration: this.currentTask.duration,
            status: this.currentTask.status,
            validationScore: this.currentTask.validation?.score || 0,
            isValid: this.currentTask.validation?.isValid || false,
            errorMessage: this.currentTask.error,
            htmlBlocksCount: this.htmlBlocks.messageBlocks.length,
            continueClicks: this._continueClickCount
        };

        try {
            const url = `${this.API_BASE_URL}/tasks`;
            this._log('debug', `Отправка задачи на ${url}`);
            this._log('info', `📡 HTML ответа: ${taskData.assistantResponseHtml?.length || 0} символов`);

            const response = await this._fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                this._log('info', '📡 Задача отправлена на сервер (включая HTML)');
            } else {
                this._log('error', `❌ Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            this._log('error', `❌ Ошибка отправки на сервер: ${error.message}`);
            this._log('error', `⚠️ Проверьте что сервер запущен на порту ${this.API_PORT}`);
        }
    }

    async sendPendingToServer() {
        if (!this.state.pendingUserAction.isPending) return;

        const pendingData = {
            taskId: this.currentTask?.id || null,
            sessionId: this.currentSession.id,
            type: this.state.pendingUserAction.type,
            description: this.state.pendingUserAction.description,
            severity: this.state.pendingUserAction.severity,
            suggestedAction: this.state.pendingUserAction.suggestedAction,
            details: this.state.pendingUserAction.details,
            autoResolved: this.state.pendingUserAction.autoResolved,
            resolutionMethod: this.state.pendingUserAction.resolutionMethod,
            detectedAt: this.state.pendingUserAction.detectedAt,
            resolvedAt: this.state.pendingUserAction.resolvedAt
        };

        try {
            const url = `${this.API_BASE_URL}/pending`;
            const response = await this._fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingData)
            });

            if (response.ok) {
                this._log('info', '📡 Неопределенное состояние отправлено на сервер');
            } else {
                this._log('error', `❌ Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            this._log('error', `❌ Ошибка отправки на сервер: ${error.message}`);
            this._log('error', `⚠️ Проверьте что сервер запущен на порту ${this.API_PORT}`);
        }
    }

    // ========== ФИНАЛЬНАЯ СТАТИСТИКА ==========

    _printFinalTaskStats(task, validation) {
        if (!task) return;

        const separator = '═'.repeat(70);

        console.log(`\n${separator}`);
        console.log(`%c📊 ФИНАЛЬНАЯ СТАТИСТИКА ЗАДАЧИ`, 'color: #FF6B6B; font-weight: bold; font-size: 14px;');
        console.log(`${separator}`);

        console.log(`\n%c📌 ОСНОВНАЯ ИНФОРМАЦИЯ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ ID задачи:     ${task.id}`);
        console.log(`  ├─ ID сессии:     ${task.sessionId || this.currentSession?.id}`);
        console.log(`  ├─ Статус:        ${task.status === 'completed' ? '✅ УСПЕШНО' : '❌ ПРОВАЛ'}`);
        console.log(`  └─ Время:         ${new Date().toLocaleString()}`);

        console.log(`\n%c💬 СООБЩЕНИЯ:`, 'color: #4ECDC4; font-weight: bold;');

        const userMsg = task.userMessage || this.state.currentUserMessage;
        const assistantMsg = task.assistantResponse || this.state.currentAssistantResponse;

        console.log(`  ├─ Сообщение пользователя:`);
        console.log(`  │   ${userMsg ? userMsg.substring(0, 200) : '(пусто)'}${userMsg?.length > 200 ? '...' : ''}`);
        console.log(`  │   Длина: ${userMsg?.length || 0} символов, ${userMsg?.split(/\s+/).length || 0} слов`);

        console.log(`  └─ Ответ ассистента:`);
        console.log(`      ${assistantMsg ? assistantMsg.substring(0, 200) : '(пусто)'}${assistantMsg?.length > 200 ? '...' : ''}`);

        console.log(`\n%c⏱️ ВРЕМЕННЫЕ МЕТРИКИ:`, 'color: #4ECDC4; font-weight: bold;');

        const startTime = task.startTime || this.state.startTime;
        const endTime = task.endTime || this.state.endTime;
        const duration = task.duration || (endTime - startTime);

        console.log(`  ├─ Время начала:   ${startTime ? new Date(startTime).toLocaleTimeString() : 'N/A'}`);
        console.log(`  ├─ Время окончания: ${endTime ? new Date(endTime).toLocaleTimeString() : 'N/A'}`);
        console.log(`  ├─ Длительность:   ${duration ? `${(duration / 1000).toFixed(2)} секунд (${duration} мс)` : 'N/A'}`);
        console.log(`  └─ Нажатий Continue: ${this._continueClickCount || 0}`);

        console.log(`\n%c✅ ВАЛИДАЦИЯ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Общий счет:     ${validation.score || task.validation?.score || 0}/100`);
        console.log(`  ├─ Результат:      ${validation.isValid || task.validation?.isValid ? '✅ ПРОЙДЕНА' : '❌ НЕ ПРОЙДЕНА'}`);
        console.log(`  └─ Детали:`);
        console.log(`      ├─ Содержит контент:  ${validation.checks?.hasContent ? '✅' : '❌'}`);
        console.log(`      ├─ Длина ответа:      ${validation.checks?.contentLength ? '✅' : '❌'} (мин: ${this.validationRules.minResponseLength})`);
        console.log(`      ├─ HTML блоки:        ${validation.checks?.hasHtmlBlocks ? '✅' : '❌'} (найдено: ${this.htmlBlocks.messageBlocks.length})`);
        console.log(`      ├─ Состояние чата:    ${validation.checks?.hasProperState ? '✅' : '❌'}`);
        console.log(`      ├─ Время ответа:      ${validation.checks?.timeValid ? '✅' : '❌'}`);
        console.log(`      └─ Ошибки:            ${validation.checks?.noErrors ? '✅' : '❌'}`);

        if (validation.issues && validation.issues.length > 0) {
            console.log(`\n  ⚠️ Проблемы (${validation.issues.length}):`);
            validation.issues.forEach((issue, idx) => {
                console.log(`      ${idx + 1}. ${issue}`);
            });
        }

        if (assistantMsg) {
            const words = assistantMsg.match(/[\p{L}\p{N}]+/gu) || [];
            const uniqueWords = new Set(words.map(w => w.toLowerCase()));
            const sentences = assistantMsg.split(/[.!?;:]+/).filter(s => s.trim().length > 0);
            const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);

            console.log(`\n%c📈 СТАТИСТИКА ОТВЕТА:`, 'color: #4ECDC4; font-weight: bold;');
            console.log(`  ├─ Всего символов:    ${assistantMsg.length}`);
            console.log(`  ├─ Всего слов:        ${words.length}`);
            console.log(`  ├─ Уникальных слов:   ${uniqueWords.size}`);
            console.log(`  ├─ Средняя длина слова: ${avgWordLength.toFixed(1)} символов`);
            console.log(`  ├─ Количество предложений: ${sentences.length}`);
            console.log(`  ├─ Средняя длина предложения: ${(words.length / (sentences.length || 1)).toFixed(1)} слов`);
            console.log(`  ├─ Содержит код:      ${/```[\\s\\S]*?```|function|class|const|let|var|import|export/.test(assistantMsg) ? '✅' : '❌'}`);
            console.log(`  ├─ Содержит маркдаун: ${/[*_#`~>]/.test(assistantMsg) ? '✅' : '❌'}`);
            console.log(`  └─ Завершенность:     ${this.isSentenceComplete(assistantMsg) ? '✅' : '❌'}`);
        }

        console.log(`\n%c📄 HTML ОТВЕТА:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Размер HTML:     ${task.assistantResponseHtml?.length || 0} символов`);
        console.log(`  ├─ Количество фрагментов: ${task.htmlChunks?.length || 0}`);
        const hasTags = /<[^>]*>/.test(task.assistantResponseHtml || '');
        console.log(`  ├─ Содержит теги:   ${hasTags ? '✅' : '❌'}`);
        const hasCodeBlocks = /<pre|<code|```/.test(task.assistantResponseHtml || '');
        console.log(`  ├─ Содержит код:    ${hasCodeBlocks ? '✅' : '❌'}`);
        const hasTables = /<table|<tr|<td/.test(task.assistantResponseHtml || '');
        console.log(`  └─ Содержит таблицы: ${hasTables ? '✅' : '❌'}`);

        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        console.log(`\n%c🔘 СОСТОЯНИЕ КНОПОК:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Action кнопка:    ${actionState.type || 'none'} (${actionState.state || 'unknown'})`);
        console.log(`  ├─ Стриминг активен:  ${actionState.isStreaming ? '✅' : '❌'}`);
        console.log(`  └─ Continue кнопка:   ${continueButton ? '✅ видима' : '❌ не найдена'}`);

        console.log(`\n%c⚡ МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Скорость генерации: ${duration ? (assistantMsg?.length / (duration / 1000)).toFixed(1) : 'N/A'} символов/сек`);
        const wordsForSpeed = assistantMsg?.match(/[\p{L}\p{N}]+/gu) || [];
        console.log(`  ├─ Скорость (слов/сек): ${duration ? (wordsForSpeed.length / (duration / 1000)).toFixed(1) : 'N/A'}`);
        console.log(`  └─ Эффективность:     ${duration && assistantMsg?.length ? (assistantMsg.length / (duration / 1000)).toFixed(1) : 'N/A'} символов/сек`);

        console.log(`\n%c🎯 ИТОГОВАЯ ОЦЕНКА:`, 'color: #FF6B6B; font-weight: bold;');

        let grade = 'F';
        let gradeColor = '#f44336';
        let emoji = '🔴';

        const score = validation.score || task.validation?.score || 0;

        if (score >= 90) {
            grade = 'A+';
            gradeColor = '#4CAF50';
            emoji = '🏆';
        } else if (score >= 80) {
            grade = 'A';
            gradeColor = '#8BC34A';
            emoji = '🎉';
        } else if (score >= 70) {
            grade = 'B';
            gradeColor = '#CDDC39';
            emoji = '👍';
        } else if (score >= 60) {
            grade = 'C';
            gradeColor = '#FFC107';
            emoji = '📝';
        } else if (score >= 50) {
            grade = 'D';
            gradeColor = '#FF9800';
            emoji = '⚠️';
        } else {
            grade = 'F';
            gradeColor = '#f44336';
            emoji = '❌';
        }

        console.log(`  ${emoji} Оценка:     %c${grade} (${score}/100)`, `color: ${gradeColor}; font-weight: bold;`);
        console.log(`  ├─ Качество:    ${this._getQualityDescription(score)}`);
        console.log(`  └─ Рекомендация: ${this._getRecommendation(validation, task)}`);

        console.log(`\n${separator}\n`);
    }

    _getQualityDescription(score) {
        if (score >= 90) return 'Отлично! Ответ высокого качества';
        if (score >= 80) return 'Хорошо, но есть небольшие недочеты';
        if (score >= 70) return 'Удовлетворительно, требует небольшой доработки';
        if (score >= 60) return 'Минимально приемлемо';
        if (score >= 50) return 'Низкое качество, требует улучшения';
        return 'Неудовлетворительно, требуется переформулировка запроса';
    }

    _getRecommendation(validation, task) {
        if (validation.isValid) {
            if (validation.score >= 90) {
                return 'Задача выполнена отлично, дополнительных действий не требуется';
            }
            if (validation.score >= 70) {
                return 'Задача выполнена успешно, но можно улучшить качество ответа';
            }
            return 'Задача выполнена, но рекомендуется проанализировать ответ';
        }

        if (!validation.checks?.hasContent) {
            return 'Ответ не получен. Проверьте соединение и повторите запрос';
        }
        if (!validation.checks?.contentLength) {
            return 'Ответ слишком короткий. Попробуйте расширить или уточнить запрос';
        }
        if (!validation.checks?.hasHtmlBlocks) {
            return 'Структура страницы изменилась. Обновите расширение';
        }
        if (task.duration > 60000) {
            return 'Долгое время ответа. Попробуйте упростить запрос';
        }

        return 'Проанализируйте ответ и при необходимости повторите запрос';
    }

    _printCompactTaskStats() {
        const task = this.currentTask;
        const validation = task?.validation;
        const duration = task?.duration || 0;
        const responseLength = task?.assistantResponse?.length || 0;
        const score = validation?.score || 0;

        const statusIcon = validation?.isValid ? '✅' : '❌';
        const grade = score >= 80 ? 'A' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

        console.log(`${statusIcon} Задача ${task?.id?.substring(0, 8)}... | Длит: ${(duration / 1000).toFixed(1)}с | Ответ: ${responseLength} симв | HTML: ${task?.assistantResponseHtml?.length || 0} | Оценка: ${grade} (${score}) | Continue: ${this._continueClickCount}`);
    }

    // ========== ОПЕРАТОРСКИЕ МЕТОДЫ ==========

    operatorForceComplete(response = null) {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Принудительное завершение задачи');

        if (this.state.pendingUserAction.isPending) {
            this.resolvePendingAction('operator_force_complete');
        }

        if (response) {
            this.updateState({ currentAssistantResponse: response });
        }

        this.onChatComplete();

        return { success: true, action: 'force_complete' };
    }

    operatorSkipTask() {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Пропуск задачи');

        if (this.state.pendingUserAction.isPending) {
            this.resolvePendingAction('operator_skipped');
        }

        this.processingStarted = false;
        this.processingCompleted = false;
        this.updateState({
            isChatProcessing: false,
            isComplete: true,
            hasError: false
        });

        return { success: true, action: 'skip_task' };
    }

    operatorRestartMonitoring() {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Перезапуск мониторинга');
        this.destroy();
        this.init();
        return { success: true, action: 'restart_monitoring' };
    }

    operatorGetDiagnostics() {
        return {
            timestamp: Date.now(),
            apiPort: this.API_PORT,
            useEventBus: this.useEventBus,
            autoClickEnabled: this.autoClickEnabled,
            state: {
                waitingForResponse: this.state.waitingForResponse,
                processingCompleted: this.processingCompleted,
                processingStarted: this.processingStarted,
                currentUserMessage: this.state.currentUserMessage?.substring(0, 100)
            },
            mutationStats: this.getMutationStats(),
            processingStatus: {
                continueClicks: this._continueClickCount,
                streamingActive: this._streamingActive,
                lastResponseChangeTime: this._lastMutationTime
            },
            config: {
                mutationIdleTimeout: this.detectionConfig.mutationIdleTimeout,
                maxIdleChecks: this._maxIdleChecks
            }
        };
    }

    getMutationStats() {
        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        return {
            lastMutationTime: this._lastMutationTime,
            idleTime: this._lastMutationTime ? Date.now() - this._lastMutationTime : null,
            consecutiveIdleChecks: this._consecutiveIdleChecks,
            maxIdleChecks: this._maxIdleChecks,
            waitingForResponse: this.state.waitingForResponse,
            processingCompleted: this.processingCompleted,
            hasContinueButton: !!continueButton,
            hasLoadingIndicator: !!this.findLoadingIndicatorGlobal(),
            currentResponseLength: this._lastResponseText?.length || 0,
            actionButtonState: actionState.state,
            actionButtonType: actionState.type,
            isStreamingCompleted: this.isStreamingCompleted()
        };
    }

    // ========== ЖИЗНЕННЫЙ ЦИКЛ ЗАДАЧИ ==========

    onChatStart(userMessage) {
        if (this.processingStarted) return;

        this.processingStarted = true;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._continueClickCount = 0;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;
        this._startWaitingLogged = false;

        // Очищаем кэш кнопки при старте чата
        this._clearContinueButtonCache();

        const startTime = Date.now();

        this.createTask(userMessage);

        this.updateState({
            isChatProcessing: true,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: userMessage,
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: startTime,
            endTime: null,
            waitingForResponse: true,
            responseReceived: false
        });

        this.resetMutationIdleTimer();
        this.resetResponseTimeoutTimer();

        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('start', '🚀 НАЧАЛО ОБРАБОТКИ ЗАПРОСА');
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('info', `📝 Сообщение: "${userMessage.substring(0, 200)}"`);
        this._log('info', `⏱️ Время: ${new Date(startTime).toLocaleTimeString()}`);
        this._log('info', `⏰ Таймаут без мутаций: ${this.detectionConfig.mutationIdleTimeout/1000} сек`);
        this._log('separator', '═══════════════════════════════════════════════════════════════');
    }

    onChatComplete() {
        if (this.processingCompleted || !this.processingStarted) return;

        this.processingCompleted = true;
        const endTime = Date.now();
        const duration = ((endTime - this.state.startTime) / 1000).toFixed(2);

        let finalResponse = this.state.currentAssistantResponse;
        let finalResponseHtml = this.state.currentAssistantResponseHtml;

        if (!finalResponse || finalResponse.length === 0) {
            const response = this.getLatestAssistantResponse();
            if (response) {
                finalResponse = response.text;
                finalResponseHtml = response.html;
                this.updateState({
                    currentAssistantResponse: finalResponse,
                    currentAssistantResponseHtml: finalResponseHtml
                });
            }
        }

        this.updateState({
            isChatProcessing: false,
            isComplete: true,
            hasError: false,
            endTime: endTime,
            waitingForResponse: false,
            responseReceived: true
        });

        const validation = this.validateResponse(
            this.state.currentUserMessage,
            finalResponse,
            parseInt(duration) * 1000
        );

        this.completeTask({ text: finalResponse, html: finalResponseHtml }, validation);

        this._printFinalTaskStats(this.currentTask, validation);

        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('end', '✅ ОКОНЧАНИЕ ОБРАБОТКИ');
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('info', `⏱️ Длительность: ${duration} секунд`);
        this._log('info', `📊 Статус: ${validation.isValid ? 'УСПЕШНО' : 'ОШИБКА ВАЛИДАЦИИ'}`);
        this._log('validation', `🎯 Оценка валидации: ${validation.score}/100`);
        this._log('info', `🖱️ Нажатий Continue: ${this._continueClickCount}`);
        this._log('info', `📄 HTML ответа: ${finalResponseHtml?.length || 0} символов`);

        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('message', '💬 ОТВЕТ АССИСТЕНТА:');
        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('messagePreview', finalResponse ? finalResponse.substring(0, 500) : '(пустой ответ)');
        this._log('separator', '───────────────────────────────────────────────────────────────');

        if (finalResponse && finalResponse.length > 0) {
            const preview = finalResponse.length > 60
                ? finalResponse.substring(0, 60) + '...'
                : finalResponse;
            this._log('messagePreview', `📝 ${preview}`);
            this._log('info', `📊 Всего символов: ${finalResponse.length}`);
        } else {
            this._log('error', '❌ Ответ не получен');
            this.detectPendingAction('response_not_found', {
                description: 'Ответ от сервера не получен'
            });
        }

        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('validation', '🔍 Детали валидации:');
        this._log('validation', `  ├─ Содержит контент: ${validation.checks.hasContent ? '✅' : '❌'}`);
        this._log('validation', `  ├─ Длина ответа: ${validation.checks.contentLength ? '✅' : '❌'} (мин: ${this.validationRules.minResponseLength})`);
        this._log('validation', `  ├─ HTML блоки: ${validation.checks.hasHtmlBlocks ? '✅' : '❌'} (найдено: ${this.htmlBlocks.messageBlocks.length})`);
        this._log('validation', `  ├─ Состояние чата: ${validation.checks.hasProperState ? '✅' : '❌'}`);
        this._log('validation', `  ├─ Время ответа: ${validation.checks.timeValid ? '✅' : '❌'}`);
        this._log('validation', `  └─ Ошибки: ${validation.checks.noErrors ? '✅' : '❌'}`);

        if (validation.issues.length > 0) {
            this._log('validation', `\n⚠️ Проблемы (${validation.issues.length}):`);
            validation.issues.forEach((issue, idx) => {
                this._log('validation', `  ${idx + 1}. ${issue}`);
            });
        }

        this._log('separator', '═══════════════════════════════════════════════════════════════');

        this.sendTaskToServer();

        setTimeout(() => {
            this.processingStarted = false;
            this.processingCompleted = false;
            this.updateState({
                isUserTyping: false,
                currentUserMessage: '',
                currentAssistantResponse: '',
                currentAssistantResponseHtml: '',
                userMessageSent: false,
                waitingForResponse: false,
                responseReceived: false
            });
            this._lastResponseText = '';
            this._lastResponseHtml = '';
            this._lastMutationTime = null;
            this._streamingActive = false;
            this._consecutiveIdleChecks = 0;
        }, 500);
    }

    onChatError(errorMessage) {
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('error', `❌ ОШИБКА: ${errorMessage}`);
        this._log('separator', '═══════════════════════════════════════════════════════════════');

        this.failTask(errorMessage);

        if (errorMessage.includes('No DOM mutations') || errorMessage.includes('stalled')) {
            this.detectPendingAction('task_stalled', {
                description: errorMessage,
                lastMutationTime: this._lastMutationTime,
                consecutiveIdleChecks: this._consecutiveIdleChecks
            });
        }

        this.updateState({
            hasError: true,
            errorMessage: errorMessage,
            isChatProcessing: false,
            isComplete: false,
            waitingForResponse: false
        });

        setTimeout(() => {
            this.processingStarted = false;
            this.processingCompleted = false;
            this._consecutiveIdleChecks = 0;
            this.updateState({
                hasError: false,
                errorMessage: null,
                isUserTyping: false,
                userMessageSent: false,
                waitingForResponse: false,
                responseReceived: false
            });
        }, 2000);
    }

    updateState(newState) {
        const changed = {};
        for (const [key, value] of Object.entries(newState)) {
            if (this.state[key] !== value) {
                changed[key] = { old: this.state[key], new: value };
                this.state[key] = value;
            }
        }

        if (Object.keys(changed).length > 0 && this.onStateChange) {
            this.onStateChange(this.state, changed);
        }
    }

    // ========== ГЕТТЕРЫ ==========

    getState() {
        return { ...this.state };
    }

    getPendingAction() {
        return { ...this.state.pendingUserAction };
    }

    getCurrentSession() {
        return this.currentSession;
    }

    getCurrentTask() {
        return this.currentTask;
    }

    getSessionTasks() {
        return this.currentSession?.tasks || [];
    }

    getAllSessions() {
        return this.chatHistory.sessions;
    }

    getSessionAnalytics() {
        if (!this.currentSession) return null;

        const totalDuration = this.currentSession.endTime
            ? (this.currentSession.endTime - this.currentSession.startTime) / 1000
            : (Date.now() - this.currentSession.startTime) / 1000;

        const successRate = this.currentSession.totalTasks > 0
            ? (this.currentSession.completedTasks / this.currentSession.totalTasks) * 100
            : 0;

        return {
            sessionId: this.currentSession.id,
            totalTasks: this.currentSession.totalTasks,
            completedTasks: this.currentSession.completedTasks,
            failedTasks: this.currentSession.failedTasks,
            successRate: successRate.toFixed(2),
            totalDuration: totalDuration.toFixed(2),
            averageTaskDuration: this.currentSession.tasks.length > 0
                ? (this.currentSession.tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / this.currentSession.tasks.length / 1000).toFixed(2)
                : 0
        };
    }

    exportSession() {
        if (!this.currentSession) return null;
        return {
            session: { ...this.currentSession },
            analytics: this.getSessionAnalytics(),
            exportDate: new Date().toISOString()
        };
    }

    exportAllData() {
        return {
            currentSession: this.currentSession ? { ...this.currentSession } : null,
            history: this.chatHistory.sessions.map(s => ({ ...s })),
            totalSessions: this.chatHistory.sessions.length,
            totalTasks: this.chatHistory.sessions.reduce((sum, s) => sum + s.totalTasks, 0),
            exportDate: new Date().toISOString()
        };
    }

    clearCurrentSession() {
        if (this.currentSession && this.currentSession.tasks.length > 0) {
            this._log('session', 'СЕССИЯ ОЧИЩЕНА');
        }
        this.currentSession = {
            id: null,
            startTime: null,
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };
        this.currentTask = {
            id: null,
            userMessage: null,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: null,
            endTime: null,
            duration: null,
            status: 'pending',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };
        this.chatHistory.currentSession = null;
    }

    getHtmlBlocks() {
        return { ...this.htmlBlocks };
    }

    getValidationRules() {
        return { ...this.validationRules };
    }

    setValidationRules(rules) {
        this.validationRules = { ...this.validationRules, ...rules };
        this._log('info', 'Правила валидации обновлены');
    }

    getPageState() {
        return {
            current: this.state.isChatProcessing ? 'processing' :
                this.state.isComplete ? 'complete' :
                    this.state.hasError ? 'error' : 'idle',
            metrics: {
                hasResponse: !!this.state.currentAssistantResponse,
                responseLength: this.state.currentAssistantResponse?.length || 0,
                hasHtml: !!this.state.currentAssistantResponseHtml,
                htmlLength: this.state.currentAssistantResponseHtml?.length || 0
            }
        };
    }

    getPerformanceMetrics() {
        const actionState = this.getCurrentActionButtonState();
        return {
            lastMutationTime: this._lastMutationTime,
            mutationIdleTime: this._lastMutationTime ? Date.now() - this._lastMutationTime : null,
            consecutiveIdleChecks: this._consecutiveIdleChecks,
            processingStarted: this.processingStarted,
            processingCompleted: this.processingCompleted,
            continueClickCount: this._continueClickCount,
            actionButtonState: actionState.state,
            actionButtonType: actionState.type,
            isStreamingCompleted: this.isStreamingCompleted()
        };
    }

    reset() {
        this.processingStarted = false;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._continueClickCount = 0;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = null;
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;

        // Очищаем кэш кнопки при сбросе
        this._clearContinueButtonCache();

        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);

        this.updateState({
            isUserTyping: false,
            isChatProcessing: false,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: '',
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: null,
            endTime: null,
            userMessageSent: false,
            waitingForResponse: false,
            responseReceived: false,
            pendingUserAction: {
                isPending: false,
                type: null,
                description: null,
                detectedAt: null,
                severity: 'medium',
                suggestedAction: null,
                autoResolved: false,
                resolvedAt: null,
                resolutionMethod: null
            }
        });

        this.endCurrentSession();
        this.startNewSession();

        this._log('info', 'Состояние сброшено, начата новая сессия');
    }

    destroy() {
        this.endCurrentSession();

        // Очищаем кэш кнопки при уничтожении
        this._clearContinueButtonCache();

        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);
        if (this._actionButtonPollingInterval) clearInterval(this._actionButtonPollingInterval);

        if (this.chatInput && this._enterKeyHandler) {
            this.chatInput.removeEventListener('keydown', this._enterKeyHandler);
        }
        if (this.sendButton && this._clickHandler) {
            this.sendButton.removeEventListener('click', this._clickHandler);
        }

        if (this.domObserver) this.domObserver.disconnect();
        if (this.attributeObserver) this.attributeObserver.disconnect();
        if (this.responseObserver) this.responseObserver.disconnect();
        if (this.continueButtonObserver) this.continueButtonObserver.disconnect();
        if (this.typingDebounceTimer) clearTimeout(this.typingDebounceTimer);

        if (this.clickHandler) {
            this.clickHandler.stop();
        }

        console.log(`${LOG_PREFIX} 🛑 Мониторинг чата остановлен`);
    }
}

// Экспорт для модульной системы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeepSeekChatMonitor };
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.DeepSeekChatMonitor = DeepSeekChatMonitor;
}
```

---

### `../../Directory/11/deepseek/eventBus.js`
```javascript
// eventBus.js - Центральная событийная шина для DeepSeek монитора
// 100% полный код с обновлениями

class DeepSeekEventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.eventHistory = new Map(); // Храним историю событий для отладки
        this.maxHistorySize = 100;
        this.debugMode = false;
        this.eventCounter = 0;
        this.listenerCounter = 0;
    }

    /**
     * Подписка на событие
     * @param {string} event - Имя события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} options - Опции подписки
     * @returns {string} ID слушателя для отписки
     */
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listenerId = this.generateListenerId();
        const listener = {
            id: listenerId,
            callback,
            priority: options.priority || 0,
            context: options.context || null,
            once: false,
            createdAt: Date.now()
        };

        this.listeners.get(event).push(listener);

        // Сортируем по приоритету (выше приоритет - раньше вызов)
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] ✅ Подписка на \"${event}\", ID: ${listenerId}, приоритет: ${listener.priority}`);
        }

        return listenerId;
    }

    /**
     * Однократная подписка
     * @param {string} event - Имя события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} options - Опции подписки
     * @returns {string} ID слушателя для отписки
     */
    once(event, callback, options = {}) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }

        const listenerId = this.generateListenerId();
        const listener = {
            id: listenerId,
            callback,
            priority: options.priority || 0,
            context: options.context || null,
            once: true,
            createdAt: Date.now()
        };

        this.onceListeners.get(event).push(listener);

        // Сортируем по приоритету
        this.onceListeners.get(event).sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] 🔂 Однократная подписка на \"${event}\", ID: ${listenerId}`);
        }

        return listenerId;
    }

    /**
     * Отписка от события по ID
     * @param {string} event - Имя события
     * @param {string} listenerId - ID слушателя
     * @returns {boolean} Успешность отписки
     */
    off(event, listenerId) {
        let removed = false;

        // Проверяем в обычных подписках
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
                if (this.debugMode) {
                    console.log(`[EventBus] ❌ Отписка от \"${event}\", ID: ${listenerId}`);
                }
            }
        }

        // Проверяем в однократных подписках
        if (this.onceListeners.has(event)) {
            const listeners = this.onceListeners.get(event);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        }

        return removed;
    }

    /**
     * Отписка всех слушателей от события
     * @param {string} event - Имя события
     */
    offAll(event) {
        if (this.listeners.has(event)) {
            const count = this.listeners.get(event).length;
            this.listeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] 🗑️ Удалены все подписки (${count}) на \"${event}\"`);
            }
        }

        if (this.onceListeners.has(event)) {
            const count = this.onceListeners.get(event).length;
            this.onceListeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] 🗑️ Удалены все однократные подписки (${count}) на \"${event}\"`);
            }
        }
    }

    /**
     * Отписка от всех событий
     */
    offAllEvents() {
        const totalRegular = this.getTotalListenerCount();
        const totalOnce = this.getTotalOnceListenerCount();

        this.listeners.clear();
        this.onceListeners.clear();

        if (this.debugMode) {
            console.log(`[EventBus] 🗑️ Удалены все подписки (regular: ${totalRegular}, once: ${totalOnce})`);
        }
    }

    /**
     * Генерация ID для слушателя
     * @returns {string} Уникальный ID
     */
    generateListenerId() {
        this.listenerCounter++;
        return `listener_${Date.now()}_${this.listenerCounter}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Генерация ID для события
     * @returns {string} Уникальный ID
     */
    generateEventId() {
        this.eventCounter++;
        return `event_${Date.now()}_${this.eventCounter}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Отправка события
     * @param {string} event - Имя события
     * @param {Object} data - Данные события
     * @param {Object} options - Опции отправки
     * @returns {string} ID события
     */
    emit(event, data = {}, options = {}) {
        const eventId = this.generateEventId();
        const eventData = {
            id: eventId,
            type: event,
            data: data,
            timestamp: Date.now(),
            source: options.source || 'unknown',
            version: options.version || '1.0'
        };

        if (this.debugMode) {
            console.log(`[EventBus] 📡 Эмит события \"${event}\"`, {
                id: eventId,
                data: data,
                source: eventData.source
            });
        }

        // Сохраняем в историю
        this.addToHistory(eventData);

        // Вызываем обычные подписки
        if (this.listeners.has(event)) {
            const listeners = [...this.listeners.get(event)]; // Копируем для безопасности
            for (const listener of listeners) {
                try {
                    const context = listener.context || window;
                    listener.callback.call(context, eventData);
                } catch (error) {
                    console.error(`[EventBus] Ошибка в обработчике ${event}:`, error);
                    this.emit('eventbus:error', {
                        event: event,
                        listenerId: listener.id,
                        error: error.message,
                        stack: error.stack
                    }, { source: 'EventBus' });
                }
            }
        }

        // Вызываем однократные подписки
        if (this.onceListeners.has(event)) {
            const listeners = [...this.onceListeners.get(event)];
            this.onceListeners.delete(event);

            for (const listener of listeners) {
                try {
                    const context = listener.context || window;
                    listener.callback.call(context, eventData);
                } catch (error) {
                    console.error(`[EventBus] Ошибка в однократном обработчике ${event}:`, error);
                    this.emit('eventbus:error', {
                        event: event,
                        listenerId: listener.id,
                        error: error.message
                    }, { source: 'EventBus' });
                }
            }
        }

        return eventId;
    }

    /**
     * Асинхронная отправка события (не блокирует)
     * @param {string} event - Имя события
     * @param {Object} data - Данные события
     * @param {Object} options - Опции отправки
     * @returns {Promise<string>} ID события
     */
    async emitAsync(event, data = {}, options = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const eventId = this.emit(event, data, options);
                resolve(eventId);
            }, 0);
        });
    }

    /**
     * Сохранение в историю
     * @param {Object} eventData - Данные события
     */
    addToHistory(eventData) {
        if (!this.eventHistory.has(eventData.type)) {
            this.eventHistory.set(eventData.type, []);
        }

        const history = this.eventHistory.get(eventData.type);
        history.push(eventData);

        // Ограничиваем размер истории
        while (history.length > this.maxHistorySize) {
            history.shift();
        }
    }

    /**
     * Получить историю событий
     * @param {string|null} eventType - Тип события (опционально)
     * @returns {Object|Array} История событий
     */
    getHistory(eventType = null) {
        if (eventType) {
            return this.eventHistory.get(eventType) || [];
        }

        const allHistory = {};
        for (const [type, events] of this.eventHistory) {
            allHistory[type] = events;
        }
        return allHistory;
    }

    /**
     * Очистить историю
     * @param {string|null} eventType - Тип события (опционально)
     */
    clearHistory(eventType = null) {
        if (eventType) {
            this.eventHistory.delete(eventType);
            if (this.debugMode) {
                console.log(`[EventBus] 🧹 История события \"${eventType}\" очищена`);
            }
        } else {
            this.eventHistory.clear();
            if (this.debugMode) {
                console.log('[EventBus] 🧹 Вся история событий очищена');
            }
        }
    }

    /**
     * Получить количество слушателей
     * @param {string|null} event - Имя события (опционально)
     * @returns {number} Количество слушателей
     */
    getListenerCount(event = null) {
        if (event) {
            const regular = this.listeners.get(event)?.length || 0;
            const once = this.onceListeners.get(event)?.length || 0;
            return regular + once;
        }

        return this.getTotalListenerCount() + this.getTotalOnceListenerCount();
    }

    /**
     * Получить общее количество обычных слушателей
     * @returns {number}
     */
    getTotalListenerCount() {
        let total = 0;
        for (const listeners of this.listeners.values()) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * Получить общее количество однократных слушателей
     * @returns {number}
     */
    getTotalOnceListenerCount() {
        let total = 0;
        for (const listeners of this.onceListeners.values()) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * Получить список всех событий
     * @returns {Array} Список событий
     */
    getEvents() {
        const events = new Set();
        for (const event of this.listeners.keys()) {
            events.add(event);
        }
        for (const event of this.onceListeners.keys()) {
            events.add(event);
        }
        return Array.from(events);
    }

    /**
     * Проверить наличие слушателей на событие
     * @param {string} event - Имя события
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.getListenerCount(event) > 0;
    }

    /**
     * Включить/выключить режим отладки
     * @param {boolean} enabled - Включить отладку
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] 🐛 Режим отладки: ${enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);

        if (enabled) {
            this.emit('eventbus:debug-enabled', {
                timestamp: Date.now(),
                listenerCount: this.getListenerCount(),
                events: this.getEvents()
            }, { source: 'EventBus' });
        }
    }

    /**
     * Получить статус EventBus
     * @returns {Object} Статус
     */
    getStatus() {
        return {
            debugMode: this.debugMode,
            totalListeners: this.getListenerCount(),
            regularListeners: this.getTotalListenerCount(),
            onceListeners: this.getTotalOnceListenerCount(),
            events: this.getEvents(),
            historySize: this.eventHistory.size,
            eventCounter: this.eventCounter,
            listenerCounter: this.listenerCounter,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }

    /**
     * Сброс EventBus (очистка всех подписок и истории)
     */
    reset() {
        this.offAllEvents();
        this.clearHistory();
        this.eventCounter = 0;
        this.listenerCounter = 0;
        this.startTime = Date.now();

        if (this.debugMode) {
            console.log('[EventBus] 🔄 EventBus полностью сброшен');
        }
    }

    /**
     * Получить статистику по событиям
     * @returns {Object} Статистика
     */
    getStats() {
        const stats = {
            totalEvents: this.eventCounter,
            totalListeners: this.listenerCounter,
            activeListeners: this.getListenerCount(),
            eventsByType: {}
        };

        for (const [event, listeners] of this.listeners) {
            stats.eventsByType[event] = {
                regular: listeners.length,
                once: this.onceListeners.get(event)?.length || 0,
                total: listeners.length + (this.onceListeners.get(event)?.length || 0)
            };
        }

        for (const [event, listeners] of this.onceListeners) {
            if (!stats.eventsByType[event]) {
                stats.eventsByType[event] = {
                    regular: 0,
                    once: listeners.length,
                    total: listeners.length
                };
            }
        }

        return stats;
    }
}

// ========== ОБНОВЛЕНИЕ: ГАРАНТИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ ==========

(function ensureEventBusGlobal() {
    // Функция создания экземпляра EventBus
    const createEventBusInstance = () => {
        if (window.__deepseekEventBus) return window.__deepseekEventBus;

        const instance = new DeepSeekEventBus();
        instance.startTime = Date.now();

        // Определяем окружение
        const isDev = (typeof window !== 'undefined' && (
            window.location?.hostname === 'localhost' ||
            window.location?.hostname === '127.0.0.1' ||
            window.location?.protocol === 'chrome-extension:'
        ));

        if (isDev) {
            instance.setDebugMode(true);
            console.log('[EventBus] 🐛 Режим отладки автоматически включен (development)');
        }

        window.__deepseekEventBus = instance;

        // Сигнал о готовности EventBus через кастомное событие
        if (typeof window !== 'undefined') {
            const readyEvent = new CustomEvent('deepseek-eventbus-ready', {
                detail: { timestamp: Date.now(), instance: instance }
            });
            window.dispatchEvent(readyEvent);
        }

        console.log('[EventBus] ✅ Глобальный экземпляр создан и сигнал отправлен');
        return instance;
    };

    // Если DOM еще не загружен, ждем
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createEventBusInstance();
        });
    } else {
        createEventBusInstance();
    }
})();

// Экспорт для модульной системы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeepSeekEventBus };
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.DeepSeekEventBus = DeepSeekEventBus;
}

// Автоматический экспорт в chrome.runtime для cross-context коммуникации
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Для отправки сообщений между контекстами
    if (typeof window !== 'undefined') {
        window.__deepseekEventBusToBackground = (event, data) => {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'EVENT_BUS_MESSAGE',
                    event: event,
                    data: data,
                    timestamp: Date.now()
                }).catch(() => {});
            }
        };
    }
}

console.log('[EventBus] 🚀 EventBus загружен и готов к работе');
```

---

### `../../Directory/11/deepseek/injectDeepSeek.js`
```javascript
// injectDeepSeek.js - Полная версия с интегрированным чат-монитором и событийной шиной (100% кода)

if (!window.__deepseekExtensionInjected) {
    window.__deepseekExtensionInjected = true;

    const pageContext = window.top === window ? "top-level" : "embedded";
    const AUTH_TEXT_PATTERNS = [
        /log in to deepseek/i,
        /sign in to deepseek/i,
        /enter your email/i,
        /enter your password/i,
        /continue with google/i,
        /continue with github/i,
        /forgot password/i,
        /forget password/i,
        /\\bdon't have an account\\?\\s*sign up\\b/i
    ];
    const READY_SELECTORS = [
        "#chat-input",
        "textarea",
        '[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        '[data-testid="chat-input"]',
        '[contenteditable="true"]'
    ];

    let lastPageState = null;
    let lastParentFrameState = null;
    let syncScheduled = false;

    // ========== ENHANCED PAGE OBSERVER CLASS ==========
    class EnhancedPageObserver {
        constructor() {
            this.observer = null;
            this.debounceTimer = null;
            this.DEBOUNCE_DELAY = 300;
            this.isObserving = false;
            this.performanceObserver = null;
            this.urlChangeDetected = false;
            this.eventBus = window.__deepseekEventBus;
        }

        start() {
            if (this.isObserving) return;

            if (!document.body) {
                document.addEventListener('DOMContentLoaded', () => this.startObserving());
            } else {
                this.startObserving();
            }

            this.trackNavigation();
            this.trackPerformance();
        }

        startObserving() {
            if (!document.body) {
                setTimeout(() => this.startObserving(), 100);
                return;
            }

            this.observer = new MutationObserver((mutations) => {
                let needsSync = false;
                let hasResponseChange = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        needsSync = true;

                        // Проверяем, не появились ли новые сообщения
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const isMessage = this.isMessageElement(node);
                                if (isMessage) {
                                    hasResponseChange = true;
                                }
                            }
                        }
                    }

                    if (mutation.type === 'attributes') {
                        const target = mutation.target;
                        const relevantSelectors = [
                            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
                            '#chat-input', 'textarea', '[contenteditable="true"]',
                            '.loading', '.streaming', '.typing-indicator',
                            '.auth-modal', '.login-dialog', '[role="dialog"]',
                            '.chat-container', '.message-list', '.auth-form',
                            'input[type="email"]', 'input[type="password"]',
                            'button[type="submit"]', '.login-button'
                        ];
                        const isRelevant = relevantSelectors.some(selector =>
                            target.matches && target.matches(selector)
                        );
                        if (isRelevant) {
                            needsSync = true;
                            hasResponseChange = true;
                        }
                    }

                    if (mutation.type === 'characterData') {
                        const parent = mutation.target.parentElement;
                        if (parent && (
                            parent.matches('.assistant-message, .ai-message, [data-message-role="assistant"]') ||
                            parent.classList?.contains('message-bubble') ||
                            parent.classList?.contains('message-content')
                        )) {
                            needsSync = true;
                            hasResponseChange = true;
                        }
                    }
                }

                if (needsSync) this.debounceSync();

                // Публикуем событие о DOM изменениях через EventBus
                if (hasResponseChange && this.eventBus) {
                    this.eventBus.emit('page:dom-mutated', {
                        mutations: this.sanitizeMutations(mutations),
                        count: mutations.length,
                        hasResponseChange: hasResponseChange,
                        timestamp: Date.now()
                    }, { source: 'EnhancedPageObserver' });
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class', 'style', 'aria-hidden', 'hidden',
                    'disabled', 'readonly', 'data-state', 'aria-busy'
                ],
                characterData: true,
                characterDataOldValue: false
            });

            this.isObserving = true;
            setTimeout(() => this.debounceSync(), 100);

            if (this.eventBus) {
                this.eventBus.emit('page:observer-started', {
                    timestamp: Date.now()
                }, { source: 'EnhancedPageObserver' });
            }
        }

        isMessageElement(element) {
            if (!element) return false;

            const messageSelectors = [
                '.message', '.chat-message', '.assistant-message',
                '[data-message-role="assistant"]', '.response-message',
                '.ai-message', '.bot-message', '.deepseek-message',
                '.ds-markdown', '.markdown-body', '[class*="message-content"]'
            ];

            for (const selector of messageSelectors) {
                if (element.matches && element.matches(selector)) {
                    return true;
                }
                if (element.querySelector && element.querySelector(selector)) {
                    return true;
                }
            }

            return false;
        }

        sanitizeMutations(mutations) {
            // Очищаем mutations для безопасной передачи через EventBus
            if (!mutations) return [];
            return Array.from(mutations).map(m => ({
                type: m.type,
                target: m.target?.nodeName || 'unknown',
                targetClass: m.target?.className || null,
                addedNodesCount: m.addedNodes?.length || 0,
                removedNodesCount: m.removedNodes?.length || 0,
                attributeName: m.attributeName || null
            }));
        }

        debounceSync() {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);

            const oldState = this.getCurrentState();

            this.debounceTimer = setTimeout(() => {
                if (typeof syncPageState === 'function') syncPageState();

                // Публикуем событие об изменении состояния страницы
                if (this.eventBus) {
                    const newState = this.getCurrentState();
                    if (oldState !== newState) {
                        this.eventBus.emit('page:state-changed', {
                            oldState: oldState,
                            newState: newState,
                            url: window.location.href,
                            timestamp: Date.now()
                        }, { source: 'EnhancedPageObserver' });
                    }
                }
            }, this.DEBOUNCE_DELAY);
        }

        getCurrentState() {
            if (this.isAuthPage()) return 'auth-required';
            if (this.findChatInputElement()) return 'ready';
            return 'loading';
        }

        isAuthPage() {
            const pathname = window.location.pathname || "";
            const bodyText = document.body?.innerText || "";

            const hasPasswordField = Boolean(document.querySelector('input[type="password"]'));
            const hasEmailField = Boolean(
                document.querySelector('input[type="email"]') ||
                document.querySelector('input[placeholder*="Email" i]') ||
                document.querySelector('input[placeholder*="Mail" i]')
            );

            if (pathname === "/auth" || pathname.startsWith("/auth/") || pathname === "/login") return true;
            if (hasPasswordField && hasEmailField) return true;

            return false;
        }

        findChatInputElement() {
            for (const selector of READY_SELECTORS) {
                const elements = Array.from(document.querySelectorAll(selector));
                const visibleElement = elements.find((element) => this.isVisible(element));
                if (visibleElement) return visibleElement;
            }
            return null;
        }

        isVisible(element) {
            if (!element || !(element instanceof HTMLElement)) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }

        trackNavigation() {
            let lastUrl = location.href;

            const checkUrlChange = () => {
                const currentUrl = location.href;
                if (currentUrl !== lastUrl) {
                    const oldUrl = lastUrl;
                    lastUrl = currentUrl;
                    this.urlChangeDetected = true;
                    this.debounceSync();

                    // Публикуем событие об изменении URL
                    if (this.eventBus) {
                        this.eventBus.emit('page:url-changed', {
                            oldUrl: oldUrl,
                            newUrl: currentUrl,
                            timestamp: Date.now()
                        }, { source: 'EnhancedPageObserver' });
                    }

                    setTimeout(() => { this.urlChangeDetected = false; }, 1000);
                }
            };

            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            history.pushState = function(...args) {
                const result = originalPushState.apply(this, args);
                checkUrlChange();
                return result;
            };

            history.replaceState = function(...args) {
                const result = originalReplaceState.apply(this, args);
                checkUrlChange();
                return result;
            };

            window.addEventListener('popstate', checkUrlChange);
            window.addEventListener('hashchange', checkUrlChange);
        }

        trackPerformance() {
            if (typeof PerformanceObserver !== 'undefined') {
                try {
                    this.performanceObserver = new PerformanceObserver(() => {
                        this.debounceSync();
                    });
                    this.performanceObserver.observe({
                        entryTypes: ['paint', 'largest-contentful-paint']
                    });
                } catch (e) {
                    console.debug("[EnhancedPageObserver] PerformanceObserver not supported:", e);
                }
            }
        }

        triggerSync() {
            this.debounceSync();
        }

        stop() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            if (this.performanceObserver) {
                this.performanceObserver.disconnect();
                this.performanceObserver = null;
            }
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.isObserving = false;

            if (this.eventBus) {
                this.eventBus.emit('page:observer-stopped', {
                    timestamp: Date.now()
                }, { source: 'EnhancedPageObserver' });
            }
        }

        isActive() {
            return this.isObserving && this.observer !== null;
        }
    }

    // ========== CHAT STREAMING MONITOR ==========
    class ChatStreamMonitor {
        constructor() {
            this.isStreaming = false;
            this.streamStartTime = null;
            this.streamEndTime = null;
            this.retryCount = 0;
            this.maxRetries = 3;
            this.errorCount = 0;
            this.lastError = null;
            this.eventListeners = new Map();
            this.observers = [];
            this.pendingMessages = new Set();
            this.eventBus = window.__deepseekEventBus;

            this.config = {
                idleTimeout: 3000,
                streamDuration: 60000,
                retryDelay: 1000,
                errorThreshold: 5,
                checkInterval: 500
            };

            this.init();
        }

        init() {
            this.setupDOMObservers();
            this.setupNetworkObservers();
            this.setupEventListeners();
            this.startIdleCheck();
        }

        setupDOMObservers() {
            const messageObserver = new MutationObserver((mutations) => {
                let hasStreamingContent = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.checkForNewMessage(node);
                                this.checkForMessageContent(node);
                                if (this.isStreamingContent(node)) {
                                    hasStreamingContent = true;
                                }
                            }
                        }
                    }

                    if (mutation.type === 'characterData') {
                        this.checkForStreamingContent(mutation.target);
                        hasStreamingContent = true;
                    }

                    if (mutation.type === 'attributes') {
                        this.checkForLoadingState(mutation.target);
                        if (this.isLoadingIndicator(mutation.target)) {
                            hasStreamingContent = true;
                        }
                    }
                }

                // Публикуем событие о стриминговом контенте
                if (hasStreamingContent && this.eventBus && this.isStreaming) {
                    const currentContent = this.getCurrentStreamingContent();
                    if (currentContent) {
                        this.eventBus.emit('stream:progress', {
                            content: currentContent,
                            length: currentContent.length,
                            duration: Date.now() - (this.streamStartTime || Date.now()),
                            timestamp: Date.now()
                        }, { source: 'ChatStreamMonitor' });
                    }
                }
            });

            const chatContainer = this.findChatContainer();
            if (chatContainer) {
                messageObserver.observe(chatContainer, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true,
                    attributeFilter: ['class', 'style', 'data-state', 'aria-busy']
                });
                this.observers.push(messageObserver);
            }

            const inputObserver = new MutationObserver(() => {
                this.checkInputState();
            });

            const chatInput = this.findChatInput();
            if (chatInput) {
                inputObserver.observe(chatInput, {
                    attributes: true,
                    attributeFilter: ['disabled', 'readonly', 'class']
                });
                this.observers.push(inputObserver);
            }
        }

        isStreamingContent(node) {
            if (!node) return false;
            const streamingSelectors = [
                '.streaming', '.typing', '.loading', '.generating',
                '[class*="stream"]', '[class*="typing"]'
            ];
            for (const selector of streamingSelectors) {
                if (node.matches && node.matches(selector)) return true;
                if (node.querySelector && node.querySelector(selector)) return true;
            }
            return false;
        }

        isLoadingIndicator(element) {
            if (!element) return false;
            return element.classList?.contains('loading') ||
                element.classList?.contains('streaming') ||
                element.getAttribute('aria-busy') === 'true';
        }

        getCurrentStreamingContent() {
            const messageSelectors = [
                '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
                '.message-content', '.response-text', '.ds-markdown'
            ];
            for (const selector of messageSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    const lastElement = elements[elements.length - 1];
                    const text = lastElement?.textContent || '';
                    if (text.length > 0) return text;
                }
            }
            return null;
        }

        checkForNewMessage(node) {
            const messageSelectors = [
                '.message', '.chat-message', '.assistant-message',
                '[data-message-role="assistant"]', '.response-message',
                '.ai-message', '.bot-message', '.deepseek-message'
            ];

            for (const selector of messageSelectors) {
                const messages = node.matches?.(selector) ? [node] : node.querySelectorAll?.(selector);
                if (messages) {
                    Array.from(messages).forEach(msg => {
                        if (!msg._monitored) {
                            msg._monitored = true;
                            this.onNewMessageDetected(msg);
                        }
                    });
                }
            }
        }

        checkForMessageContent(node) {
            if (node.textContent && node.textContent.length > 0) {
                const messageElement = this.findParentMessage(node);
                if (messageElement && !messageElement._streamingStarted) {
                    messageElement._streamingStarted = true;
                    this.onStreamingStart(messageElement);
                }
            }
        }

        checkForStreamingContent(node) {
            const parent = node.parentElement;
            const messageElement = this.findParentMessage(parent);
            if (messageElement && this.isStreaming) {
                this.onStreamingProgress({
                    element: messageElement,
                    content: messageElement.textContent,
                    timestamp: Date.now()
                });
            }
        }

        checkForLoadingState(element) {
            if (this.isLoadingIndicator(element)) {
                this.onStreamingStart(element);
            }
            if (element.classList?.contains('error') ||
                element.getAttribute('data-error') === 'true') {
                this.onError(new Error('Loading state indicates error'), element);
            }
        }

        findParentMessage(element) {
            const messageSelectors = [
                '.message', '.chat-message', '.assistant-message',
                '[data-message-role]', '.response', '.ai-response'
            ];

            for (const selector of messageSelectors) {
                const parent = element.closest?.(selector);
                if (parent) return parent;
            }

            let current = element;
            for (let i = 0; i < 5 && current; i++) {
                if (current.classList?.contains('message') ||
                    current.classList?.contains('chat-message')) {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        }

        setupNetworkObservers() {
            const originalFetch = window.fetch;
            const self = this;

            window.fetch = async function(...args) {
                const url = args[0];
                const isChatRequest = self.isChatRequest(url);

                if (isChatRequest && self.eventBus) {
                    self.eventBus.emit('network:request-start', {
                        url: url,
                        timestamp: Date.now()
                    }, { source: 'ChatStreamMonitor' });
                }

                try {
                    const response = await originalFetch.apply(this, args);
                    if (isChatRequest && self.eventBus) {
                        self.eventBus.emit('network:request-end', {
                            url: url,
                            status: response.status,
                            timestamp: Date.now()
                        }, { source: 'ChatStreamMonitor' });
                        self.monitorStreamResponse(response);
                    }
                    return response;
                } catch (error) {
                    if (isChatRequest && self.eventBus) {
                        self.eventBus.emit('network:error', {
                            url: url,
                            error: error.message,
                            timestamp: Date.now()
                        }, { source: 'ChatStreamMonitor' });
                    }
                    throw error;
                }
            };

            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;
            const selfMonitor = this;

            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._url = url;
                this._isChatRequest = typeof url === 'string' && selfMonitor.isChatRequest(url);
                return originalXHROpen.apply(this, [method, url, ...rest]);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                if (this._isChatRequest && selfMonitor.eventBus) {
                    this.addEventListener('loadstart', () => {
                        selfMonitor.eventBus.emit('network:request-start', {
                            url: this._url,
                            timestamp: Date.now()
                        }, { source: 'ChatStreamMonitor' });
                    });
                    this.addEventListener('loadend', () => {
                        if (this.status >= 200 && this.status < 300) {
                            selfMonitor.eventBus.emit('network:request-end', {
                                url: this._url,
                                status: this.status,
                                timestamp: Date.now()
                            }, { source: 'ChatStreamMonitor' });
                        } else {
                            selfMonitor.eventBus.emit('network:error', {
                                url: this._url,
                                error: `HTTP ${this.status}`,
                                timestamp: Date.now()
                            }, { source: 'ChatStreamMonitor' });
                        }
                    });
                    this.addEventListener('error', (error) => {
                        selfMonitor.eventBus.emit('network:error', {
                            url: this._url,
                            error: error.message,
                            timestamp: Date.now()
                        }, { source: 'ChatStreamMonitor' });
                    });
                }
                return originalXHRSend.apply(this, args);
            };
        }

        isChatRequest(url) {
            if (typeof url !== 'string') return false;
            const chatPatterns = [
                '/chat', '/completion', '/generate', '/stream',
                '/api/chat', '/v1/chat', '/conversation',
                'deepseek.com/api', 'qwen.ai/api'
            ];
            return chatPatterns.some(pattern => url.includes(pattern));
        }

        async monitorStreamResponse(response) {
            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let streamActive = true;

            this.onStreamingStart(null);

            try {
                while (streamActive) {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.onStreamingComplete('normal');
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                this.onStreamingComplete('done');
                                streamActive = false;
                                break;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                this.onStreamChunk(parsed);
                            } catch (e) {
                                this.onStreamChunk({ raw: data });
                            }
                        }
                    }
                }
            } catch (error) {
                this.onStreamingError(error);
            }
        }

        findChatInput() {
            const selectors = [
                '#chat-input', 'textarea', '[contenteditable="true"]',
                '[role="textbox"]', '[data-testid="chat-input"]',
                'input[type="text"]', '.chat-input'
            ];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && this.isVisible(element)) return element;
            }
            return null;
        }

        findChatContainer() {
            const selectors = [
                '.chat-container', '.messages-container', '.conversation',
                '[role="log"]', '.chat-messages', '.message-list'
            ];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }
            return document.body;
        }

        checkInputState() {
            const input = this.findChatInput();
            if (!input) return;

            const isDisabled = input.disabled ||
                input.getAttribute('readonly') !== null ||
                input.classList?.contains('disabled');

            if (isDisabled && !this.isStreaming) {
                this.onStreamingStart(null);
            } else if (!isDisabled && this.isStreaming) {
                setTimeout(() => {
                    if (!this.hasActiveStreaming()) {
                        this.onStreamingComplete('input_enabled');
                    }
                }, 500);
            }
        }

        onNewMessageDetected(messageElement) {
            this.emit('message-detected', {
                element: messageElement,
                timestamp: Date.now()
            });
            if (messageElement.textContent && messageElement.textContent.length > 0) {
                this.onStreamingStart(messageElement);
            }
        }

        onStreamingStart(element) {
            if (this.isStreaming) return;
            this.isStreaming = true;
            this.streamStartTime = Date.now();
            this.retryCount = 0;

            if (window.deepSeekChatMonitor && window.deepSeekChatMonitor.onChatStart) {
                window.deepSeekChatMonitor.onChatStart(
                    window.deepSeekChatMonitor.state?.currentUserMessage || 'Streaming started'
                );
            }

            // Публикуем событие через EventBus
            if (this.eventBus) {
                this.eventBus.emit('stream:started', {
                    element: element?.nodeName || 'unknown',
                    timestamp: this.streamStartTime,
                    retryCount: this.retryCount
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('streaming-start', {
                element,
                timestamp: this.streamStartTime,
                retryCount: this.retryCount
            });

            this.streamTimeout = setTimeout(() => {
                if (this.isStreaming) {
                    this.onStreamingError(new Error('Stream timeout exceeded'));
                }
            }, this.config.streamDuration);
        }

        onStreamingProgress(data) {
            // Публикуем событие через EventBus
            if (this.eventBus && data.content) {
                this.eventBus.emit('stream:progress', {
                    content: data.content,
                    length: data.content.length,
                    duration: Date.now() - (this.streamStartTime || Date.now()),
                    timestamp: Date.now()
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('streaming-progress', {
                ...data,
                duration: Date.now() - this.streamStartTime,
                isStreaming: this.isStreaming
            });
            this.resetIdleTimer();
        }

        onStreamChunk(chunk) {
            if (this.eventBus) {
                this.eventBus.emit('stream:chunk', {
                    chunk: chunk,
                    timestamp: Date.now(),
                    receivedAt: Date.now() - (this.streamStartTime || Date.now())
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('stream-chunk', {
                chunk,
                timestamp: Date.now(),
                receivedAt: Date.now() - this.streamStartTime
            });
        }

        onStreamingComplete(reason) {
            if (!this.isStreaming) return;
            this.isStreaming = false;
            this.streamEndTime = Date.now();

            if (window.deepSeekChatMonitor && window.deepSeekChatMonitor.onChatComplete) {
                window.deepSeekChatMonitor.onChatComplete();
            }

            if (this.streamTimeout) clearTimeout(this.streamTimeout);

            // Публикуем событие через EventBus
            if (this.eventBus) {
                this.eventBus.emit('stream:completed', {
                    reason: reason,
                    duration: this.streamEndTime - this.streamStartTime,
                    timestamp: this.streamEndTime,
                    errorCount: this.errorCount
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('streaming-complete', {
                reason,
                duration: this.streamEndTime - this.streamStartTime,
                timestamp: this.streamEndTime,
                errorCount: this.errorCount
            });

            this.errorCount = 0;
            this.lastError = null;
        }

        onStreamingError(error) {
            this.errorCount++;
            this.lastError = error;

            if (window.deepSeekChatMonitor && window.deepSeekChatMonitor.onChatError) {
                window.deepSeekChatMonitor.onChatError(error.message);
            }

            // Публикуем событие через EventBus
            if (this.eventBus) {
                this.eventBus.emit('stream:error', {
                    error: error.message,
                    count: this.errorCount,
                    timestamp: Date.now(),
                    duration: this.streamStartTime ? Date.now() - this.streamStartTime : 0
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('streaming-error', {
                error: error.message,
                count: this.errorCount,
                timestamp: Date.now(),
                duration: this.streamStartTime ? Date.now() - this.streamStartTime : 0
            });

            if (this.errorCount >= this.config.errorThreshold) {
                this.onStreamingComplete('error_threshold');
            } else if (this.errorCount < this.config.maxRetries && this.isStreaming) {
                this.attemptRetry();
            } else {
                this.onStreamingComplete('error');
            }
        }

        async attemptRetry() {
            if (this.retryCount >= this.config.maxRetries) {
                this.onStreamingComplete('max_retries');
                return;
            }
            this.retryCount++;

            if (this.eventBus) {
                this.eventBus.emit('stream:retry', {
                    attempt: this.retryCount,
                    maxRetries: this.config.maxRetries,
                    delay: this.config.retryDelay,
                    timestamp: Date.now()
                }, { source: 'ChatStreamMonitor' });
            }

            this.emit('streaming-retry', {
                attempt: this.retryCount,
                maxRetries: this.config.maxRetries,
                delay: this.config.retryDelay
            });

            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            if (!this.isStreaming && this.hasActiveStreaming()) {
                this.isStreaming = true;
                this.onStreamingStart(null);
            }
        }

        hasActiveStreaming() {
            const loadingIndicators = document.querySelectorAll(
                '.loading, .streaming, .typing-indicator, [aria-busy="true"]'
            );
            for (const indicator of loadingIndicators) {
                if (this.isVisible(indicator)) return true;
            }
            const lastMessage = document.querySelector(
                '.assistant-message:last-child, .ai-message:last-child, [data-message-role="assistant"]:last-child'
            );
            if (lastMessage && !lastMessage.textContent) return true;
            return false;
        }

        startIdleCheck() {
            this.idleTimer = null;
            this.lastActivity = Date.now();
            setInterval(() => {
                const now = Date.now();
                const idleTime = now - this.lastActivity;
                if (this.isStreaming && idleTime > this.config.idleTimeout) {
                    this.onStreamingError(new Error('Stream idle timeout'));
                }
            }, this.config.checkInterval);
        }

        resetIdleTimer() {
            this.lastActivity = Date.now();
        }

        isVisible(element) {
            if (!element || !(element instanceof HTMLElement)) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' && style.visibility !== 'hidden';
        }

        setupEventListeners() {
            window.addEventListener('beforeunload', () => {
                if (this.isStreaming) this.onStreamingComplete('page_unload');
            });
            window.addEventListener('online', () => {
                if (this.hasActiveStreaming() && !this.isStreaming) this.onStreamingStart(null);
            });
            window.addEventListener('offline', () => {
                this.onStreamingError(new Error('Connection lost'));
            });
        }

        on(event, callback) {
            if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
            this.eventListeners.get(event).push(callback);
        }

        off(event, callback) {
            if (!this.eventListeners.has(event)) return;
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) listeners.splice(index, 1);
        }

        emit(event, data) {
            if (!this.eventListeners.has(event)) return;
            for (const callback of this.eventListeners.get(event)) {
                try { callback(data); } catch (e) {}
            }
        }

        getState() {
            return {
                isStreaming: this.isStreaming,
                duration: this.streamStartTime ? Date.now() - this.streamStartTime : 0,
                errorCount: this.errorCount,
                retryCount: this.retryCount,
                lastError: this.lastError?.message,
                hasActiveStreaming: this.hasActiveStreaming()
            };
        }

        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
            if (this.streamTimeout) clearTimeout(this.streamTimeout);
            this.eventListeners.clear();
        }

        onError(error, element) {
            this.onStreamingError(error);
        }
    }

    // ========== HELPER FUNCTIONS ==========

    function canUseRuntimeMessaging() { /* реализация скрыта */ }

    function isVisible(element) { /* реализация скрыта */ }

    function hasVisibleActionLabel(label) { /* реализация скрыта */ }

    function isAuthPage() { /* реализация скрыта */ }

    function findChatInputElement() { /* реализация скрыта */ }

    function detectPageState() { /* реализация скрыта */ }

    function notifyPageState(state) { /* реализация скрыта */ }

    function notifyParentFrameState(state) { /* реализация скрыта */ }

    function syncPageState() { /* реализация скрыта */ }

    function schedulePageStateSync() { /* реализация скрыта */ }

    // ========== ОБРАБОТЧИК ДЛЯ ПОЛУЧЕНИЯ КООРДИНАТ ЭЛЕМЕНТА ==========

    function setupMessageHandlers() { /* реализация скрыта */ }

    // ========== ФУНКЦИЯ ОЖИДАНИЯ EVENTBUS И ИНИЦИАЛИЗАЦИИ ==========

    function ensureEventBusAndInit() { /* реализация скрыта */ }

    // ========== INITIALIZATION ==========

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureEventBusAndInit);
    } else {
        ensureEventBusAndInit();
    }

    window.addEventListener("message", (event) => {
        if (!event.data || typeof event.data !== "object") return;
        if (event.data.type === "DEEPSEEK_REQUEST_PAGE_STATE") syncPageState();
        if (event.data.type === "DEEPSEEK_FORCE_REFRESH" && window.__deepseek?.enhancedObserver) {
            window.__deepseek.enhancedObserver.triggerSync();
        }
    });

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const promise = originalFetch.apply(this, args);
        if (typeof url === 'string' && url.includes('deepseek.com/api')) {
            promise.then(() => { setTimeout(() => schedulePageStateSync(), 100); });
        }
        return promise;
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        this.addEventListener('load', function() {
            if (this._url && typeof this._url === 'string' && this._url.includes('deepseek.com/api')) {
                setTimeout(() => schedulePageStateSync(), 100);
            }
        });
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    console.log('[DeepSeek] Extension script loaded, waiting for EventBus...');
}
```

---

### `../../Directory/11/deepseek/sidepanel.js`
```javascript
document.addEventListener("DOMContentLoaded", () => {
  const DEEPSEEK_ORIGIN = "https://chat.deepseek.com";
  const DEEPSEEK_URL = `${DEEPSEEK_ORIGIN}/`;
  const DEEPSEEK_AUTH_URL = `${DEEPSEEK_ORIGIN}/login`;
  const DEEPSEEK_HOST_SUFFIX = ".deepseek.com";
  const EMBEDDED_PAGE_STATE_KEY = "deepseekPageState:embedded";

  const body = document.body;
  const chatFrame = document.getElementById("chat-frame");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");
  const authHint = document.getElementById("auth-hint");
  const openLoginButton = document.getElementById("open-login-button");
  const reloadButton = document.getElementById("reload-button");

  let isFrameReady = false;
  let deepseekPageState = "loading";

  chatFrame.addEventListener("load", () => {
    isFrameReady = true;

    if (deepseekPageState !== "auth-required" && deepseekPageState !== "checking-session") {
      setPanelState("loading");
    }

    requestEmbeddedDeepSeekState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "DEEPSEEK_PAGE_STATE") {
      if (request.pageContext === "embedded") {
        handleEmbeddedDeepSeekPageState(request.state);
        return;
      }

      handleExternalDeepSeekPageState(request.state, request.pageContext);
    }
  });

  window.addEventListener("message", (event) => {
    if (!isAllowedDeepSeekOrigin(event.origin)) {
      return;
    }

    if (event.source !== chatFrame.contentWindow) {
      return;
    }

    if (!event.data || typeof event.data !== "object") {
      return;
    }

    if (event.data.type === "DEEPSEEK_EMBEDDED_PAGE_STATE") {
      handleEmbeddedDeepSeekPageState(event.data.state);
    }
  });

  openLoginButton.addEventListener("click", () => {
    chrome.tabs.create({ url: DEEPSEEK_AUTH_URL });
  });

  reloadButton.addEventListener("click", () => {
    reloadDeepSeekFrame(deepseekPageState === "auth-required" || deepseekPageState === "checking-session");
  });

  setPanelState("loading");
  restoreEmbeddedPageState();

  function handleExternalDeepSeekPageState(state, pageContext) {
    if (!state || pageContext !== "top-level") {
      return;
    }
  }

  function isAllowedDeepSeekOrigin(origin) {
    try {
      const { protocol, hostname } = new URL(origin);
      return protocol === "https:" && (hostname === "chat.deepseek.com" || hostname.endsWith(DEEPSEEK_HOST_SUFFIX));
    } catch (error) {
      return false;
    }
  }

  function handleEmbeddedDeepSeekPageState(state) {
    if (!state) {
      return;
    }

    if (state === "auth-required") {
      setPanelState("auth-required");
      return;
    }

    if (state === "ready") {
      setPanelState("ready");
      return;
    }

    if (state === "loading" && deepseekPageState !== "checking-session") {
      setPanelState("loading");
    }
  }

  function requestEmbeddedDeepSeekState() {
    if (!chatFrame.contentWindow) {
      return;
    }

    const sendRequest = () => {
      try {
        chatFrame.contentWindow.postMessage(
            {
              type: "DEEPSEEK_REQUEST_PAGE_STATE"
            },
            "*"
        );
      } catch (error) {
        console.error("Unable to request DeepSeek page state:", error);
      }
    };

    sendRequest();

    [250, 750, 1500].forEach((delay) => {
      window.setTimeout(sendRequest, delay);
    });
  }

  function setPanelState(state) {
    deepseekPageState = state;
    body.dataset.panelState = state;
    renderState(state);
  }

  function renderState(state) {
    if (state === "checking-session") {
      authTitle.textContent = "Checking your DeepSeek session";
      authDescription.textContent = "Sign-in was completed in another tab. Waiting for the panel to refresh and open the chat.";
      authHint.textContent = "The login screen will disappear as soon as the embedded page confirms your session.";
      openLoginButton.hidden = true;
      reloadButton.textContent = "Reload panel";
      return;
    }

    authTitle.textContent = "Sign in manually to continue";
    authDescription.textContent = "Open the DeepSeek login page in a regular tab and complete sign-in there. When the session is ready, reload the panel and continue chatting.";
    authHint.textContent = "The extension does not log in automatically.";
    openLoginButton.hidden = false;
    openLoginButton.textContent = "Open login page";
    reloadButton.textContent = "Reload panel";
  }

  function reloadDeepSeekFrame(keepOverlayVisible = false) {
    isFrameReady = false;
    setPanelState(keepOverlayVisible ? "checking-session" : "loading");
    chatFrame.src = DEEPSEEK_URL;
  }

  function restoreEmbeddedPageState() {
    chrome.storage.local.get(EMBEDDED_PAGE_STATE_KEY, (data) => {
      const restoredState = data?.[EMBEDDED_PAGE_STATE_KEY];

      if (!restoredState || deepseekPageState !== "loading") {
        return;
      }

      handleEmbeddedDeepSeekPageState(restoredState);
    });
  }
});
```

---

### `../../Directory/11/qwen/background.js`
```javascript
function applyIframeRules() { /* реализация скрыта */ }

function initiate() { /* реализация скрыта */ }

initiate();

```

---

### `../../Directory/11/qwen/injectDeepSeek.js`
```javascript
if (!window.__qwenExtensionInjected) {
    window.__qwenExtensionInjected = true;

    const pageContext = window.top === window ? "top-level" : "embedded";
    const AUTH_TEXT_PATTERNS = [
        /log in to qwen/i,
        /enter your email/i,
        /enter your password/i,
        /continue with google/i,
        /continue with github/i,
        /forgot password/i,
        /forget password/i,
        /\bdon't have an account\?\s*sign up\b/i
    ];
    const READY_SELECTORS = [
        "#chat-input",
        "textarea",
        '[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
    ];

    let lastPageState = null;
    let lastParentFrameState = null;
    let syncScheduled = false;

    function canUseRuntimeMessaging() { /* реализация скрыта */ }

    function isVisible(element) { /* реализация скрыта */ }

    function hasVisibleActionLabel(label) { /* реализация скрыта */ }

    function isAuthPage() { /* реализация скрыта */ }

    function findChatInputElement() { /* реализация скрыта */ }

    function detectPageState() { /* реализация скрыта */ }

    function notifyPageState(state) { /* реализация скрыта */ }

    function notifyParentFrameState(state) { /* реализация скрыта */ }

    function syncPageState() { /* реализация скрыта */ }

    function schedulePageStateSync() { /* реализация скрыта */ }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", schedulePageStateSync, { once: true });
    } else {
        schedulePageStateSync();
    }

    window.addEventListener("message", (event) => {
        if (!event.data || typeof event.data !== "object") {
            return;
        }

        if (event.data.type !== "QWEN_REQUEST_PAGE_STATE") {
            return;
        }

        syncPageState();
    });

    const observer = new MutationObserver(() => {
        schedulePageStateSync();
    });

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}

```

---

### `../../Directory/11/qwen/sidepanel.js`
```javascript
document.addEventListener("DOMContentLoaded", () => {
  const QWEN_ORIGIN = "https://chat.qwen.ai";
  const QWEN_URL = `${QWEN_ORIGIN}/`;
  const QWEN_AUTH_URL = `${QWEN_ORIGIN}/auth`;
  const QWEN_HOST_SUFFIX = ".qwen.ai";
  const EMBEDDED_PAGE_STATE_KEY = "qwenPageState:embedded";

  const body = document.body;
  const chatFrame = document.getElementById("chat-frame");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");
  const authHint = document.getElementById("auth-hint");
  const openLoginButton = document.getElementById("open-login-button");
  const reloadButton = document.getElementById("reload-button");

  let isFrameReady = false;
  let qwenPageState = "loading";

  chatFrame.addEventListener("load", () => {
    isFrameReady = true;

    if (qwenPageState !== "auth-required" && qwenPageState !== "checking-session") {
      setPanelState("loading");
    }

    requestEmbeddedQwenState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "QWEN_PAGE_STATE") {
      if (request.pageContext === "embedded") {
        handleEmbeddedQwenPageState(request.state);
        return;
      }

      handleExternalQwenPageState(request.state, request.pageContext);
    }
  });

  window.addEventListener("message", (event) => {
    if (!isAllowedQwenOrigin(event.origin)) {
      return;
    }

    if (event.source !== chatFrame.contentWindow) {
      return;
    }

    if (!event.data || typeof event.data !== "object") {
      return;
    }

    if (event.data.type === "QWEN_EMBEDDED_PAGE_STATE") {
      handleEmbeddedQwenPageState(event.data.state);
    }
  });

  openLoginButton.addEventListener("click", () => {
    chrome.tabs.create({ url: QWEN_AUTH_URL });
  });

  reloadButton.addEventListener("click", () => {
    reloadQwenFrame(qwenPageState === "auth-required" || qwenPageState === "checking-session");
  });

  setPanelState("loading");
  restoreEmbeddedPageState();

  function handleExternalQwenPageState(state, pageContext) {
    if (!state || pageContext !== "top-level") {
      return;
    }
  }

  function isAllowedQwenOrigin(origin) {
    try {
      const { protocol, hostname } = new URL(origin);
      return protocol === "https:" && (hostname === "chat.qwen.ai" || hostname.endsWith(QWEN_HOST_SUFFIX));
    } catch (error) {
      return false;
    }
  }

  function handleEmbeddedQwenPageState(state) {
    if (!state) {
      return;
    }

    if (state === "auth-required") {
      setPanelState("auth-required");
      return;
    }

    if (state === "ready") {
      setPanelState("ready");
      return;
    }

    if (state === "loading" && qwenPageState !== "checking-session") {
      setPanelState("loading");
    }
  }

  function requestEmbeddedQwenState() {
    if (!chatFrame.contentWindow) {
      return;
    }

    const sendRequest = () => {
      try {
        chatFrame.contentWindow.postMessage(
          {
            type: "QWEN_REQUEST_PAGE_STATE"
          },
          "*"
        );
      } catch (error) {
        console.error("Unable to request Qwen page state:", error);
      }
    };

    sendRequest();

    [250, 750, 1500].forEach((delay) => {
      window.setTimeout(sendRequest, delay);
    });
  }

  function setPanelState(state) {
    qwenPageState = state;
    body.dataset.panelState = state;
    renderState(state);
  }

  function renderState(state) {
    if (state === "checking-session") {
      authTitle.textContent = "Checking your Qwen session";
      authDescription.textContent = "Sign-in was completed in another tab. Waiting for the panel to refresh and open the chat.";
      authHint.textContent = "The login screen will disappear as soon as the embedded page confirms your session.";
      openLoginButton.hidden = true;
      reloadButton.textContent = "Reload panel";
      return;
    }

    authTitle.textContent = "Sign in manually to continue";
    authDescription.textContent = "Open the Qwen login page in a regular tab and complete sign-in there. When the session is ready, reload the panel and continue chatting.";
    authHint.textContent = "The extension does not log in automatically.";
    openLoginButton.hidden = false;
    openLoginButton.textContent = "Open login page";
    reloadButton.textContent = "Reload panel";
  }

  function reloadQwenFrame(keepOverlayVisible = false) {
    isFrameReady = false;
    setPanelState(keepOverlayVisible ? "checking-session" : "loading");
    chatFrame.src = QWEN_URL;
  }

  function restoreEmbeddedPageState() {
    chrome.storage.local.get(EMBEDDED_PAGE_STATE_KEY, (data) => {
      const restoredState = data?.[EMBEDDED_PAGE_STATE_KEY];

      if (!restoredState || qwenPageState !== "loading") {
        return;
      }

      handleEmbeddedQwenPageState(restoredState);
    });
  }
});

```

---

## 📊 Статистика сжатия

| Показатель | Значение |
|------------|----------|
| Исходный размер | 461.17 KB |
| Сжатый размер | 395.02 KB |
| Экономия | 66.15 KB (14.3%) |
| Количество файлов | 17 |

