// /10/map/server-config.mjs - ПОЛНАЯ ВЕРСИЯ С ОБНОВЛЕНИЯМИ
// Конфигурация и константы для прокси-сервера Gaia DR3
// ВЕРСИЯ 3.1 - ИСПРАВЛЕНИЕ: правильные имена таблиц для MAST
// 100% СИМВОЛОВ

import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3001;

// ============================================================================
// КОНФИГУРАЦИЯ МНОЖЕСТВЕННЫХ ИСТОЧНИКОВ ДАННЫХ
// ============================================================================

export const DATA_SOURCES = {
    // 1. MAST TAP (публичный, самый быстрый)
    mast: {
        name: 'MAST Gaia DR3',
        url: 'https://mast.stsci.edu/vo-tap/api/v0.1/gaiadr3',
        auth: null,
        priority: 1,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'dbo.gaia_source',
        limitSyntax: 'TOP'
    },

    // 2. CDS VizieR (публичный)
    cds: {
        name: 'CDS VizieR',
        url: 'http://tapvizier.u-strasbg.fr/TAPVizieR/tap',
        auth: null,
        priority: 2,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'TOP'
    },

    // 3. ESA Sky (публичный)
    esaSky: {
        name: 'ESA Sky',
        url: 'https://sky.esa.int/esasky-tap/tap',
        auth: null,
        priority: 3,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'LIMIT'
    },

    // 4. NASA HEASARC (публичный)
    heasarc: {
        name: 'NASA HEASARC',
        url: 'https://heasarc.gsfc.nasa.gov/xamin/vo/tap',
        auth: null,
        priority: 4,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'TOP'
    },

    // 5. CADC TAP (публичный)
    cadc: {
        name: 'CADC TAP',
        url: 'https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus/tap',
        auth: null,
        priority: 5,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaia_dr3.gaia_source',
        limitSyntax: 'TOP'
    },

    // 6. ESA TAP (требует аутентификации через cookie сессию)
    esa: {
        name: 'ESA Gaia TAP',
        url: 'https://gea.esac.esa.int/tap-server/tap',
        auth: {
            type: 'cookie',
            username: process.env.ESA_USERNAME || 'szababur',
            password: process.env.ESA_PASSWORD || 'A+ab763Mdkr',
            loginUrl: 'https://gea.esac.esa.int/tap-server/login',
            logoutUrl: 'https://gea.esac.esa.int/tap-server/logout'
        },
        priority: 6,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'authenticated',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'LIMIT'
    },

    // 7. China-VO (публичный, но медленный)
    chinese: {
        name: 'China-VO',
        url: 'http://tap.china-vo.org/tap',
        auth: null,
        priority: 7,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'LIMIT'
    },

    // 8. GAVO DC (публичный, но часто недоступен)
    gavo: {
        name: 'GAVO DC',
        url: 'https://dc.g-vo.org/tap',
        auth: null,
        priority: 8,
        enabled: true,
        status: 'unknown',
        lastError: null,
        lastSuccess: null,
        responseTime: null,
        type: 'public',
        supportsJson: true,
        tableName: 'gaiadr3.gaia_source',
        limitSyntax: 'LIMIT'
    }
};

// Хранилище сессионных данных
export let sessions = {
    esa: {
        cookies: null,
        expiry: null,
        lastLogin: null
    }
};

// Кэш работоспособности источников
export let sourceHealthCache = new Map();

// Статистика запросов
export let requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    bySource: {},
    lastReset: Date.now(),
    cacheHits: 0,
    cacheMisses: 0
};

// Константы для цветного вывода в консоль
export const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        crimson: '\x1b[38m'
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        crimson: '\x1b[48m'
    }
};

// Функции для обновления глобальных состояний
export function setSessions(newSessions) {
    sessions = newSessions;
}

export function setSourceHealthCache(newCache) {
    sourceHealthCache = newCache;
}

export function setRequestStats(newStats) {
    requestStats = newStats;
}

// Функция для сброса статистики
export function resetStats() {
    requestStats = {
        total: 0,
        successful: 0,
        failed: 0,
        bySource: {},
        lastReset: Date.now(),
        cacheHits: 0,
        cacheMisses: 0
    };
}

// Функция для получения статуса источников
export function getSourcesStatus() {
    const sources = {};

    for (const [key, source] of Object.entries(DATA_SOURCES)) {
        sources[key] = {
            name: source.name,
            priority: source.priority,
            status: source.status,
            type: source.type,
            lastSuccess: source.lastSuccess ? new Date(source.lastSuccess).toISOString() : null,
            lastError: source.lastError,
            responseTime: source.responseTime ? `${source.responseTime}ms` : null,
            enabled: source.enabled,
            tableName: source.tableName,
            limitSyntax: source.limitSyntax
        };
    }

    return sources;
}

// Функция для получения статистики запросов
export function getRequestStats() {
    const stats = { ...requestStats };

    stats.successRate = stats.total ?
        Math.round((stats.successful / stats.total) * 100) : 0;

    stats.bySource = { ...stats.bySource };

    return stats;
}

// Функция для обновления статуса источника
export function updateSourceStatus(sourceKey, status) {
    if (DATA_SOURCES[sourceKey]) {
        DATA_SOURCES[sourceKey] = {
            ...DATA_SOURCES[sourceKey],
            ...status
        };
    }
}

// Функция для включения/отключения источника
export function setSourceEnabled(sourceKey, enabled) {
    if (DATA_SOURCES[sourceKey]) {
        DATA_SOURCES[sourceKey].enabled = enabled;
    }
}

// Функция для получения информации о сессии ESA
export function getEsaAuthStatus() {
    return {
        authenticated: !!sessions.esa.cookies,
        expiry: sessions.esa.expiry ? new Date(sessions.esa.expiry).toISOString() : null,
        lastLogin: sessions.esa.lastLogin ? new Date(sessions.esa.lastLogin).toISOString() : null,
        username: DATA_SOURCES.esa.auth.username
    };
}

// ============================================================================
// НОВЫЕ ФУНКЦИИ ДЛЯ АДАПТАЦИИ ЗАПРОСОВ
// ============================================================================

/**
 * Получение правильного имени таблицы для источника
 * @param {string} sourceKey - Ключ источника
 * @returns {string} Имя таблицы
 */
export function getTableNameForSource(sourceKey) {
    const source = DATA_SOURCES[sourceKey];
    return source?.tableName || 'gaiadr3.gaia_source';
}

/**
 * Получение синтаксиса LIMIT для источника
 * @param {string} sourceKey - Ключ источника
 * @returns {string} 'TOP' или 'LIMIT'
 */
export function getLimitSyntaxForSource(sourceKey) {
    const source = DATA_SOURCES[sourceKey];
    return source?.limitSyntax || 'LIMIT';
}

/**
 * Адаптация ADQL запроса под конкретный источник
 * @param {string} query - Исходный запрос
 * @param {string} sourceKey - Ключ источника
 * @returns {string} Адаптированный запрос
 */
export function adaptQueryForSource(query, sourceKey) {
    let adapted = query;
    const source = DATA_SOURCES[sourceKey];

    if (!source) return adapted;

    // 1. Адаптация имени таблицы
    const targetTable = source.tableName;

    adapted = adapted.replace(/FROM\s+(gaiadr3|gaia_dr3|dbo)\.gaia_source/gi, `FROM ${targetTable}`);
    adapted = adapted.replace(/FROM\s+gaia_source/gi, `FROM ${targetTable}`);

    // 2. Адаптация синтаксиса LIMIT/TOP
    if (source.limitSyntax === 'TOP') {
        adapted = adapted.replace(/LIMIT\s+(\d+)/gi, 'TOP $1');
    } else {
        adapted = adapted.replace(/TOP\s+(\d+)/gi, 'LIMIT $1');
    }

    // 3. Удаляем проблемные колонки для MAST (если нужно)
    if (sourceKey === 'mast') {
        adapted = adapted.replace(/,\s*teff_val\s*,?\s*/gi, '');
        adapted = adapted.replace(/,\s*radius_val\s*,?\s*/gi, '');
        adapted = adapted.replace(/,\s*luminosity_val\s*,?\s*/gi, '');
        adapted = adapted.replace(/,\s*distance_gspphot\s*,?\s*/gi, '');
        adapted = adapted.replace(/,\s*azero_gspphot\s*,?\s*/gi, '');
    }

    return adapted;
}

/**
 * Получение информации о колонках для источника
 * @param {string} sourceKey - Ключ источника
 * @returns {Object} Информация о колонках
 */
export function getColumnsForSource(sourceKey) {
    const baseColumns = {
        ra: 'ra',
        dec: 'dec',
        mag: 'phot_g_mean_mag',
        color: 'bp_rp',
        pmra: 'pmra',
        pmdec: 'pmdec',
        parallax: 'parallax',
        radial_velocity: 'radial_velocity',
        teff: 'teff_val',
        radius: 'radius_val',
        luminosity: 'luminosity_val'
    };

    if (sourceKey === 'mast') {
        return {
            ...baseColumns,
            teff: null,
            radius: null,
            luminosity: null
        };
    }

    return baseColumns;
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    PORT,
    DATA_SOURCES,
    sessions,
    sourceHealthCache,
    requestStats,
    colors,
    setSessions,
    setSourceHealthCache,
    setRequestStats,
    resetStats,
    getSourcesStatus,
    getRequestStats,
    updateSourceStatus,
    setSourceEnabled,
    getEsaAuthStatus,
    getTableNameForSource,
    getLimitSyntaxForSource,
    adaptQueryForSource,
    getColumnsForSource
};