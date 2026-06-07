// /10/map/server-health.mjs - Проверка доступности источников данных
// ВЕРСИЯ 2.0 - Исправлен синтаксис экспорта асинхронных функций

import axios from 'axios';
import {
    DATA_SOURCES,
    sourceHealthCache,
    requestStats,
    setSourceHealthCache,
    colors
} from './server-config.mjs';
import { ensureEsaSession } from './server-auth.mjs';

// ============================================================================
// ПРОВЕРКА ИНДИВИДУАЛЬНОГО ИСТОЧНИКА
// ============================================================================

/**
 * Проверка доступности источника
 * @param {string} sourceKey - Ключ источника данных
 * @returns {Promise<boolean>} Доступен ли источник
 */
export async function checkSourceHealth(sourceKey) {
    const source = DATA_SOURCES[sourceKey];

    if (!source) {
        console.error(`${colors.fg.red}❌ Неизвестный источник: ${sourceKey}${colors.reset}`);
        return false;
    }

    // Проверяем кэш (не чаще раза в 5 минут)
    const lastCheck = sourceHealthCache.get(sourceKey);
    if (lastCheck && Date.now() - lastCheck.time < 300000) {
        return lastCheck.healthy;
    }

    try {
        const startTime = Date.now();

        // Простой запрос к capabilities сервиса
        const response = await axios({
            method: 'GET',
            url: `${source.url}/capabilities`,
            timeout: 10000,
            validateStatus: status => status < 500,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/1.0',
                'Accept': 'application/xml, text/xml, */*'
            }
        });

        const healthy = response.status >= 200 && response.status < 500;
        const responseTime = Date.now() - startTime;

        const newCache = new Map(sourceHealthCache);
        newCache.set(sourceKey, {
            healthy,
            time: Date.now(),
            responseTime
        });
        setSourceHealthCache(newCache);

        source.status = healthy ? 'ok' : 'degraded';
        source.responseTime = responseTime;

        if (healthy) {
            source.lastSuccess = Date.now();
            source.lastError = null;
        }

        return healthy;

    } catch (error) {
        const newCache = new Map(sourceHealthCache);
        newCache.set(sourceKey, {
            healthy: false,
            time: Date.now()
        });
        setSourceHealthCache(newCache);

        source.status = 'error';
        source.lastError = error.code || error.message;
        source.responseTime = null;

        return false;
    }
}

// ============================================================================
// ПРОВЕРКА ВСЕХ ИСТОЧНИКОВ
// ============================================================================

/**
 * Проверка всех источников данных
 * @returns {Promise<Object>} Результаты проверки
 */
export async function checkAllSources() {
    console.log(`${colors.fg.cyan}🔍 Проверка всех источников данных...${colors.reset}`);

    const results = {};
    const startTime = Date.now();
    const promises = [];

    // Запускаем проверку всех источников параллельно
    for (const key of Object.keys(DATA_SOURCES)) {
        promises.push(
            checkSourceHealth(key).then(result => {
                results[key] = result;
            }).catch(error => {
                results[key] = false;
                console.error(`${colors.fg.red}❌ Ошибка проверки ${key}:${colors.reset}`, error.message);
            })
        );
    }

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    const okCount = Object.values(results).filter(r => r).length;
    const failedCount = Object.values(results).filter(r => !r).length;

    console.log(`${colors.fg.green}✅ Проверка завершена за ${duration}ms: ${okCount} OK, ${failedCount} ошибок${colors.reset}`);

    return {
        timestamp: new Date().toISOString(),
        duration,
        results,
        summary: {
            total: Object.keys(DATA_SOURCES).length,
            ok: okCount,
            failed: failedCount
        }
    };
}

// ============================================================================
// ПОЛУЧЕНИЕ СТАТУСА
// ============================================================================

/**
 * Получение статуса всех источников
 * @returns {Object} Статус источников
 */
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
            enabled: source.enabled
        };
    }

    return sources;
}

/**
 * Получение статистики запросов
 * @returns {Object} Статистика запросов
 */
export function getRequestStats() {
    const stats = { ...requestStats };

    stats.successRate = stats.total ?
        Math.round((stats.successful / stats.total) * 100) : 0;

    stats.bySource = { ...stats.bySource };

    return stats;
}

// ============================================================================
// ПОЛУЧЕНИЕ РАБОЧЕГО ИСТОЧНИКА
// ============================================================================

/**
 * Получение рабочего источника с наивысшим приоритетом
 * @param {string} queryType - Тип запроса ('small', 'large', 'async')
 * @returns {Promise<{key: string, source: Object}>} Рабочий источник
 */
export async function getWorkingSource(queryType = 'small') {
    // Сортируем источники по приоритету
    const sources = Object.entries(DATA_SOURCES)
        .filter(([_, s]) => s.enabled)
        .sort((a, b) => a[1].priority - b[1].priority);

    let lastError = null;
    const errors = [];

    for (const [key, source] of sources) {
        // Проверяем, работает ли источник
        const healthy = await checkSourceHealth(key);

        if (healthy) {
            // Для ESA проверяем сессию
            if (key === 'esa') {
                const sessionOk = await ensureEsaSession();
                if (!sessionOk) {
                    errors.push(`${source.name}: сессия не валидна`);
                    continue;
                }
            }

            // Для больших запросов предпочитаем источники с поддержкой async
            if (queryType === 'large' || queryType === 'async') {
                if (source.supportsAsync) {
                    console.log(`${colors.fg.green}✅ Используется источник (async): ${source.name} (${source.responseTime}ms)${colors.reset}`);

                    // Обновляем статистику
                    requestStats.bySource[key] = requestStats.bySource[key] || { used: 0, success: 0 };
                    requestStats.bySource[key].used++;

                    return { key, source };
                }
                // Пропускаем, если не поддерживает async
                continue;
            }

            console.log(`${colors.fg.green}✅ Используется источник: ${source.name} (${source.responseTime}ms)${colors.reset}`);

            // Обновляем статистику
            requestStats.bySource[key] = requestStats.bySource[key] || { used: 0, success: 0 };
            requestStats.bySource[key].used++;

            return { key, source };
        } else {
            const error = `${source.name}: ${source.lastError || 'недоступен'}`;
            errors.push(error);
            lastError = error;
        }
    }

    throw new Error(`Все источники данных недоступны.\n${errors.join('\n')}`);
}

/**
 * Получение источника с поддержкой асинхронных запросов
 * @returns {Promise<{key: string, source: Object}>} Рабочий источник с async поддержкой
 */
export async function getAsyncCapableSource() {
    return getWorkingSource('async');
}

// ============================================================================
// УПРАВЛЕНИЕ ИСТОЧНИКАМИ
// ============================================================================

/**
 * Принудительное обновление статуса источника
 * @param {string} sourceKey - Ключ источника
 * @param {Object} status - Новый статус
 */
export function updateSourceStatus(sourceKey, status) {
    if (DATA_SOURCES[sourceKey]) {
        DATA_SOURCES[sourceKey] = {
            ...DATA_SOURCES[sourceKey],
            ...status
        };

        console.log(`${colors.fg.cyan}📝 Обновлен статус источника ${sourceKey}${colors.reset}`);
    }
}

/**
 * Включение/отключение источника
 * @param {string} sourceKey - Ключ источника
 * @param {boolean} enabled - Включен ли источник
 */
export function setSourceEnabled(sourceKey, enabled) {
    if (DATA_SOURCES[sourceKey]) {
        DATA_SOURCES[sourceKey].enabled = enabled;
        console.log(`${colors.fg.cyan}📝 Источник ${sourceKey} ${enabled ? 'включен' : 'отключен'}${colors.reset}`);
    }
}

/**
 * Сброс кэша здоровья источников
 */
export function resetHealthCache() {
    setSourceHealthCache(new Map());
    console.log(`${colors.fg.cyan}🔄 Кэш здоровья источников сброшен${colors.reset}`);
}

// ============================================================================
// ПРИОРИТЕТНЫЙ ИСТОЧНИК ДЛЯ КОНКРЕТНОГО ТИПА ЗАПРОСА
// ============================================================================

/**
 * Получение приоритетного источника для конкретного типа запроса
 * @param {string} queryType - Тип запроса ('small', 'large', 'async')
 * @returns {Promise<{key: string, source: Object}>} Приоритетный источник
 */
export async function getPrioritizedSource(queryType = 'small') {
    // Для маленьких запросов - MAST (приоритет 1)
    if (queryType === 'small') {
        const mastHealthy = await checkSourceHealth('mast');
        if (mastHealthy) {
            requestStats.bySource.mast = requestStats.bySource.mast || { used: 0, success: 0 };
            requestStats.bySource.mast.used++;
            return { key: 'mast', source: DATA_SOURCES.mast };
        }
    }

    // Для больших запросов - ESA (поддерживает async)
    if (queryType === 'large' || queryType === 'async') {
        const esaHealthy = await checkSourceHealth('esa');
        if (esaHealthy) {
            const sessionOk = await ensureEsaSession();
            if (sessionOk) {
                requestStats.bySource.esa = requestStats.bySource.esa || { used: 0, success: 0 };
                requestStats.bySource.esa.used++;
                return { key: 'esa', source: DATA_SOURCES.esa };
            }
        }
    }

    // Если приоритетный не доступен, пробуем любой рабочий
    return getWorkingSource(queryType);
}

/**
 * Получение списка всех рабочих источников
 * @returns {Promise<Array<{key: string, source: Object}>>} Массив рабочих источников
 */
export async function getAllWorkingSources() {
    const working = [];
    const sources = Object.entries(DATA_SOURCES)
        .filter(([_, s]) => s.enabled);

    for (const [key, source] of sources) {
        const healthy = await checkSourceHealth(key);
        if (healthy) {
            working.push({ key, source });
        }
    }

    return working;
}

/**
 * Получение самого быстрого источника
 * @returns {Promise<{key: string, source: Object}>} Самый быстрый источник
 */
export async function getFastestSource() {
    const working = await getAllWorkingSources();

    if (working.length === 0) {
        throw new Error('Нет доступных источников');
    }

    // Сортируем по времени ответа (чем меньше, тем быстрее)
    working.sort((a, b) => {
        const timeA = a.source.responseTime || Infinity;
        const timeB = b.source.responseTime || Infinity;
        return timeA - timeB;
    });

    const fastest = working[0];

    console.log(`${colors.fg.green}✅ Самый быстрый источник: ${fastest.source.name} (${fastest.source.responseTime}ms)${colors.reset}`);

    // Обновляем статистику
    requestStats.bySource[fastest.key] = requestStats.bySource[fastest.key] || { used: 0, success: 0 };
    requestStats.bySource[fastest.key].used++;

    return fastest;
}

// ============================================================================
// СТАТИСТИКА И МОНИТОРИНГ
// ============================================================================

/**
 * Получение подробной статистики по источникам
 * @returns {Object} Подробная статистика
 */
export function getDetailedStats() {
    const stats = {
        timestamp: new Date().toISOString(),
        sources: {},
        summary: {
            total: 0,
            ok: 0,
            degraded: 0,
            error: 0,
            disabled: 0
        },
        performance: {
            fastest: null,
            slowest: null,
            averageResponseTime: 0
        }
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let fastestTime = Infinity;
    let fastestSource = null;
    let slowestTime = 0;
    let slowestSource = null;

    for (const [key, source] of Object.entries(DATA_SOURCES)) {
        stats.sources[key] = {
            name: source.name,
            priority: source.priority,
            status: source.status,
            type: source.type,
            enabled: source.enabled,
            lastSuccess: source.lastSuccess,
            lastError: source.lastError,
            responseTime: source.responseTime
        };

        // Обновляем summary
        stats.summary.total++;
        if (!source.enabled) {
            stats.summary.disabled++;
        } else if (source.status === 'ok') {
            stats.summary.ok++;
        } else if (source.status === 'degraded') {
            stats.summary.degraded++;
        } else if (source.status === 'error') {
            stats.summary.error++;
        }

        // Обновляем производительность
        if (source.enabled && source.responseTime) {
            totalResponseTime += source.responseTime;
            responseTimeCount++;

            if (source.responseTime < fastestTime) {
                fastestTime = source.responseTime;
                fastestSource = source.name;
            }

            if (source.responseTime > slowestTime) {
                slowestTime = source.responseTime;
                slowestSource = source.name;
            }
        }
    }

    stats.performance.fastest = fastestSource ? {
        name: fastestSource,
        time: fastestTime
    } : null;

    stats.performance.slowest = slowestSource ? {
        name: slowestSource,
        time: slowestTime
    } : null;

    stats.performance.averageResponseTime = responseTimeCount > 0 ?
        Math.round(totalResponseTime / responseTimeCount) : 0;

    return stats;
}

/**
 * Проверка доступности хотя бы одного источника
 * @returns {Promise<boolean>} Доступен ли хотя бы один источник
 */
export async function isAnySourceAvailable() {
    const working = await getAllWorkingSources();
    return working.length > 0;
}

/**
 * Ожидание доступности источника
 * @param {number} timeout - Максимальное время ожидания в мс
 * @param {number} interval - Интервал проверки в мс
 * @returns {Promise<boolean>} Доступен ли источник
 */
export async function waitForSource(timeout = 30000, interval = 1000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const available = await isAnySourceAvailable();
        if (available) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    return false;
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export default {
    checkSourceHealth,
    checkAllSources,
    getSourcesStatus,
    getRequestStats,
    getDetailedStats,
    getWorkingSource,
    getAsyncCapableSource,
    getPrioritizedSource,
    getFastestSource,
    getAllWorkingSources,
    updateSourceStatus,
    setSourceEnabled,
    resetHealthCache,
    isAnySourceAvailable,
    waitForSource
};