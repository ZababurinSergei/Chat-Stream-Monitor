// /10/map/server-imcce-skybot.mjs - ТОЧКА ВХОДА
// ВЕРСИЯ 2.0 - Модульная структура

// ============================================================================
// ИМПОРТ ВСЕХ МОДУЛЕЙ
// ============================================================================

import { colors } from './server-imcce-utils.mjs';

// Утилиты
import * as utils from './server-imcce-skybot-utils.mjs';

// SkyBot core
import coreModule from './server-imcce-skybot-core.mjs';

// Skybot3D модули
import asterModule from './server-imcce-skybot3d-aster.mjs';
import cometModule from './server-imcce-skybot3d-comet.mjs';
import planetModule from './server-imcce-skybot3d-planet.mjs';
import ssoModule from './server-imcce-skybot3d-sso.mjs';
import availabilityModule from './server-imcce-skybot3d-availability.mjs';

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

// SkyBot core
export const {
    skybotCone,
    skybotInfo
} = coreModule;

// Skybot3D модули
export const {
    skybot3dGetAster
} = asterModule;

export const {
    skybot3dGetComet
} = cometModule;

export const {
    skybot3dGetPlanet
} = planetModule;

export const {
    skybot3dGetSso
} = ssoModule;

export const {
    skybot3dAvailability,
    skybot3dProjects
} = availabilityModule;

// Утилиты (экспортируем для использования в других модулях)
export const {
    SKYBOT_CONSTANTS,
    formatSkybot3DEpoch,
    getTimeoutForRequest,
    parseSkybotResponse,
    formatSkybotObject,
    determineObjectType,
    parseRA,
    parseDec,
    countByType,
    countByClass
} = utils;

// ============================================================================
// ОСНОВНОЙ ЭКСПОРТ (DEFAULT)
// ============================================================================

export default {
    // SkyBot
    skybotCone,
    skybotInfo,

    // Skybot3D
    skybot3dGetAster,
    skybot3dGetComet,
    skybot3dGetPlanet,
    skybot3dGetSso,
    skybot3dAvailability,
    skybot3dProjects,

    // Утилиты
    utils: {
        SKYBOT_CONSTANTS,
        formatSkybot3DEpoch,
        getTimeoutForRequest,
        parseSkybotResponse,
        formatSkybotObject,
        determineObjectType,
        parseRA,
        parseDec,
        countByType,
        countByClass
    },

    // Метаданные
    meta: {
        name: 'SkyBot & Skybot3D API Module',
        version: '2.0.0',
        description: 'Модули для работы с SkyBot и Skybot3D API',
        lastUpdated: '2026-03-10'
    }
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

// Проверяем поддержку цветов
const hasColors = typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;

console.log(
    (hasColors ? colors.fg.cyan : '') +
    '   📦 SkyBot модули загружены (2.0.0):' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • SkyBot core (cone search)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • Skybot3D астероиды' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • Skybot3D кометы' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • Skybot3D планеты (с файловым режимом)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • Skybot3D все объекты (с файловым режимом)' +
    (hasColors ? colors.reset : '')
);

console.log(
    (hasColors ? colors.fg.green : '') +
    '      • Skybot3D статус и проекты' +
    (hasColors ? colors.reset : '')
);

// Экспортируем также для совместимости с существующим кодом
export const __esModule = true;