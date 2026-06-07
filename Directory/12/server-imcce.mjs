// /10/map/server-imcce.mjs - Главный файл для импорта всех модулей IMCCE (ИСПРАВЛЕННЫЙ)
// ВЕРСИЯ 1.2 - Исправлен экспорт модулей

// ============================================================================
// ИМПОРТ ВСЕХ МОДУЛЕЙ
// ============================================================================

// ИМПОРТИРУЕМ ВСЕ МОДУЛИ
import setupImcceRoutesFromRoutes from './server-imcce-routes.mjs';
import ssodnetModule from './server-imcce-ssodnet.mjs';
import bftModule from './server-imcce-bft.mjs';
import miriadeModule from './server-imcce-miriade.mjs';
import skybotModule from './server-imcce-skybot.mjs';
import utilsModule from './server-imcce-utils.mjs';
import * as config from './server-imcce-config.mjs';

// ============================================================================
// ЭКСПОРТ ВСЕХ МОДУЛЕЙ
// ============================================================================

// Основные функции настройки маршрутов
export const setupImcceRoutes = setupImcceRoutesFromRoutes;

// Модули API
export const ssodnet = ssodnetModule;
export const bft = bftModule;
export const miriade = miriadeModule;
export const skybot = skybotModule;
export const utils = utilsModule;

// Конфигурация
export const IMCCE_CONFIG = config.IMCCE_CONFIG;
export const OBJECT_TYPES = config.OBJECT_TYPES;
export const DEFAULT_PARAMS = config.DEFAULT_PARAMS;
export const OBJECT_PREFIXES = config.OBJECT_PREFIXES;
export const ASTEROID_CLASSES = config.ASTEROID_CLASSES;
export const COMET_CLASSES = config.COMET_CLASSES;
export const CACHE_TTL = config.CACHE_TTL;
export const FALLBACK_DATABASE = config.FALLBACK_DATABASE;
export const FALLBACK_PHYSICAL = config.FALLBACK_PHYSICAL;

// ============================================================================
// ОСНОВНОЙ ЭКСПОРТ (DEFAULT)
// ============================================================================

/**
 * Единый объект со всеми экспортами для удобства
 */
export default {
    // Основные функции
    setupImcceRoutes,

    // API модули
    ssodnet,
    bft,
    miriade,
    skybot,

    utils,

    // Конфигурация
    config: {
        IMCCE_CONFIG,
        OBJECT_TYPES,
        DEFAULT_PARAMS,
        OBJECT_PREFIXES,
        ASTEROID_CLASSES,
        COMET_CLASSES,
        CACHE_TTL,
        FALLBACK_DATABASE,
        FALLBACK_PHYSICAL
    },

    // Метаданные
    meta: {
        name: 'IMCCE API Module',
        version: '1.2.0',
        description: 'Модули для работы с IMCCE API (SsODNet, Miriade, SkyBoT, Skybot3D)',
        lastUpdated: '2026-03-10'
    }
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

// Цвета для консоли (если доступны)
const colors = {
    reset: '\x1b[0m',
    fg: {
        green: '\x1b[32m',
        cyan: '\x1b[36m'
    }
};

// Проверяем, поддерживает ли среда цвета
const hasColors = typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;

console.log(
    (hasColors ? colors.fg.cyan : '') +
    '📦 IMCCE API модули загружены:' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • SsODNet (Quaero, DataCloud, ssoCard)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • SsODNet BFT (Broad and Flat Table)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • Miriade (ephemcc, ephemph, модели)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • SkyBoT (Cone Search)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • Skybot3D (векторные данные)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '   • Fallback данные и утилиты' +
    (hasColors ? colors.reset : '')
);