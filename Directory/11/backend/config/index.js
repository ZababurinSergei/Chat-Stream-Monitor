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
export function validateConfig() {
    const errors = [];
    const warnings = [];

    // Проверка порта
    if (config.port < 0 || config.port > 65535) {
        errors.push('PORT must be between 0 and 65535');
    }

    // Проверка путей
    if (!config.dbPath || config.dbPath.trim() === '') {
        errors.push('DB_PATH is required');
    }

    // Проверка лимитов
    if (config.limits.maxTasksPerSession < 1) {
        errors.push('MAX_TASKS_PER_SESSION must be at least 1');
    }

    if (config.limits.maxPendingActions < 1) {
        errors.push('MAX_PENDING_ACTIONS must be at least 1');
    }

    // Предупреждения для production
    if (config.isProduction) {
        if (config.corsOrigin === '*') {
            warnings.push('CORS_ORIGIN is set to "*" in production');
        }
        if (config.security.apiKeyRequired && !config.security.apiKey) {
            warnings.push('API_KEY_REQUIRED is true but API_KEY is not set');
        }
        if (config.logLevel === 'debug') {
            warnings.push('LOG_LEVEL is set to "debug" in production');
        }
    }

    return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Получить конфигурацию для отображения (без sensitive данных)
 */
export function getPublicConfig() {
    const publicConfig = { ...config };

    // Скрываем чувствительные данные
    if (publicConfig.security) {
        publicConfig.security = { ...publicConfig.security };
        if (publicConfig.security.apiKey) {
            publicConfig.security.apiKey = '***HIDDEN***';
        }
    }

    if (publicConfig.notifications) {
        publicConfig.notifications = { ...publicConfig.notifications };
        if (publicConfig.notifications.emailPass) {
            publicConfig.notifications.emailPass = '***HIDDEN***';
        }
    }

    return publicConfig;
}

/**
 * Получить переменные окружения в виде объекта
 */
export function getEnvVariables() {
    const envVars = {};
    for (const key in process.env) {
        if (key.startsWith('CHAT_MONITOR_') ||
            key === 'PORT' ||
            key === 'NODE_ENV' ||
            key === 'DB_PATH' ||
            key === 'LOG_LEVEL' ||
            key === 'CORS_ORIGIN') {
            envVars[key] = process.env[key];
        }
    }
    return envVars;
}

/**
 * Обновить конфигурацию (только для разработки)
 */
export function updateConfig(newConfig) {
    if (config.isDevelopment) {
        Object.assign(config, newConfig);
        console.log('[Config] Updated dynamically:', Object.keys(newConfig));
        return true;
    }
    console.warn('[Config] Dynamic config update only allowed in development');
    return false;
}

/**
 * Сбросить конфигурацию до значений по умолчанию
 */
export function resetConfig() {
    if (config.isDevelopment) {
        // Перезагружаем модуль
        const newConfig = import('./index.js');
        console.log('[Config] Reset to defaults');
        return true;
    }
    return false;
}

/**
 * Проверка доступности ресурсов
 */
export function checkResources() {
    const resources = {
        dbPath: config.dbPath,
        dbDir: path.dirname(config.dbPath),
        logDir: config.logDir,
        backupDir: config.dbBackupPath
    };

    const status = {};

    for (const [name, resourcePath] of Object.entries(resources)) {
        try {
            const dir = path.dirname(resourcePath);
            if (!fs.existsSync(dir)) {
                status[name] = { exists: false, error: `Directory ${dir} does not exist` };
            } else {
                status[name] = { exists: true, path: resourcePath };
            }
        } catch (error) {
            status[name] = { exists: false, error: error.message };
        }
    }

    return status;
}

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