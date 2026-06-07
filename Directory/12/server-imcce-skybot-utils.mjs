// /10/map/server-imcce-skybot-utils.mjs - ОБЩИЕ УТИЛИТЫ ДЛЯ SKYBOT (100% символов)
// ВЕРСИЯ 2.1 - Добавлены функции для работы с observer и улучшенная обработка limit

import { colors, epochToJD, toNumber, isNumeric, roundTo } from './server-imcce-utils.mjs';
import { createHash } from 'crypto.js';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const SKYBOT_CONSTANTS = {
    // Коды обсерваторий
    OBSERVER_CODES: {
        GEOCENTER: '500',
        PARIS: '007',
        SUN: '@sun',
        ROSETTA: '@rosetta',
        KEPLER: '@kepler',
        EARTH_L2: '@earthl2',
        TESS: '@tess'
    },

    // Фильтры объектов
    FILTERS: {
        DEFAULT: '120',      // Все объекты кроме движущихся
        ALL: '111',          // Все объекты
        ASTEROIDS_ONLY: '121',
        COMETS_ONLY: '122',
        PLANETS_ONLY: '123',
        SATELLITES_ONLY: '124'
    },

    // Типы объектов для objFilter
    OBJECT_FILTERS: {
        ALL: '0',
        MAJOR_PLANETS: '1',
        MINOR_PLANETS: '2',
        COMETS: '3',
        SATELLITES: '4'
    },

    // Системы координат
    REFERENCE_SYSTEMS: {
        J2000: 'EQJ2000',
        DATE: 'EQDATE',
        ECLIPTIC: 'ECLIPTIC'
    },

    // Типы вывода
    OUTPUT_TYPES: {
        ALL: 'all',
        BASIC: 'basic',
        POSITIONS_ONLY: 'positions'
    },

    // Диапазоны эпох для Skybot3D (JD)
    EPOCH_RANGE: {
        MIN_JD: 2411320.0,  // 1889-11-13
        MAX_JD: 2473540.0,  // 2060-03-21
        MIN_YEAR: 1889,
        MAX_YEAR: 2060
    },

    // Лимиты запросов
    LIMITS: {
        MAX_DIRECT_LIMIT: 10,      // Максимальный лимит для прямых запросов
        MAX_FILE_LIMIT: 10000,     // Максимальный лимит для файлового режима
        MAX_RADIUS: 180,            // Максимальный радиус в градусах
        MAX_CONCURRENT: 3           // Максимум одновременных запросов
    },

    // Таймауты по умолчанию (мс)
    TIMEOUTS: {
        CONE_SEARCH: 30000,
        GET_ASTER: 15000,
        GET_COMET: 15000,
        GET_PLANET: 30000,
        GET_SSO: 45000,
        AVAILABILITY: 5000,
        FILE_DOWNLOAD: 60000
    },

    // Специальные коды наблюдателей
    SPECIAL_OBSERVERS: {
        '@sun': 'Солнце',
        '@rosetta': 'Космический аппарат Rosetta',
        '@kepler': 'Космический аппарат Kepler',
        '@earthl2': 'Точка L2 системы Солнце-Земля',
        '@tess': 'Космический аппарат TESS',
        'earth@l2': 'Точка L2 системы Солнце-Земля',
        '500@l2': 'Точка L2 системы Солнце-Земля',
        'l2': 'Точка L2 системы Солнце-Земля',
        '@-226': 'Космический аппарат Rosetta',
        '@-227': 'Космический аппарат Kepler',
        'c55': 'Космический аппарат Kepler',
        'c57': 'Космический аппарат TESS'
    },

    // Известные IAU коды обсерваторий
    IAU_OBSERVERS: {
        '500': 'Геоцентр (центр масс Земли)',
        '007': 'Парижская обсерватория',
        '008': 'Обсерватория Ниццы',
        '009': 'Королевская обсерватория Бельгии (Uccle)',
        '010': 'Обсерватория Коссоль',
        '011': 'Обсерватория Ветцикон',
        '012': 'Королевская обсерватория Бельгии (Uccle)',
        '017': 'Обсерватория Хохе Листе',
        '020': 'Обсерватория Сидней',
        '021': 'Обсерватория Йоханнесбурга',
        '022': 'Обсерватория Пино Торинезе',
        '023': 'Обсерватория Вены',
        '024': 'Обсерватория Гейдельберг-Кенигштуль',
        '025': 'Обсерватория Стелла',
        '026': 'Обсерватория Безансона',
        '027': 'Обсерватория Болоньи',
        '028': 'Обсерватория Вюрцбурга',
        '029': 'Обсерватория Гамбурга',
        '030': 'Обсерватория Арчетри',
        '031': 'Обсерватория Зоннеберга'
    }
};

// ============================================================================
// КЭШ ДЛЯ ТЯЖЕЛЫХ ЗАПРОСОВ
// ============================================================================

const responseCache = new Map();
const CACHE_TTL = {
    AVAILABILITY: 5 * 60 * 1000,      // 5 минут
    MODELS: 60 * 60 * 1000,            // 1 час
    HEAVY: 6 * 60 * 60 * 1000          // 6 часов
};

/**
 * Генерация ключа кэша
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @returns {string} Ключ кэша
 */
export function generateCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                acc[key] = params[key].toString();
            }
            return acc;
        }, {});

    const hash = createHash('md5')
        .update(`${endpoint}:${JSON.stringify(sortedParams)}`)
        .digest('hex');

    return hash;
}

/**
 * Получение данных из кэша
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @returns {Object|null} Данные из кэша или null
 */
export function getCachedResponse(endpoint, params = {}) {
    const key = generateCacheKey(endpoint, params);
    const cached = responseCache.get(key);

    if (!cached) return null;

    const ttl = getCacheTTL(endpoint, params);
    if (Date.now() - cached.timestamp > ttl) {
        responseCache.delete(key);
        return null;
    }

    return cached.data;
}

/**
 * Сохранение данных в кэш
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @param {Object} data - Данные для сохранения
 */
export function setCachedResponse(endpoint, params = {}, data) {
    const key = generateCacheKey(endpoint, params);
    responseCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Получение TTL для кэша в зависимости от эндпоинта
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @returns {number} TTL в мс
 */
function getCacheTTL(endpoint, params = {}) {
    if (endpoint.includes('availability')) {
        return CACHE_TTL.AVAILABILITY;
    }
    if (endpoint.includes('models')) {
        return CACHE_TTL.MODELS;
    }
    if (params.limit && parseInt(params.limit) > 10) {
        return CACHE_TTL.HEAVY;
    }
    return CACHE_TTL.HEAVY;
}

/**
 * Очистка устаревших записей кэша
 */
export function cleanCache() {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
        const ttl = getCacheTTL(key);
        if (now - value.timestamp > ttl) {
            responseCache.delete(key);
        }
    }
}

// Запускаем очистку каждые 10 минут
setInterval(cleanCache, 10 * 60 * 1000);

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С НАБЛЮДАТЕЛЯМИ (OBSERVER)
// ============================================================================

/**
 * Валидация кода наблюдателя
 * @param {string} observer - Код наблюдателя
 * @returns {Object} Результат валидации
 */
export function validateObserver(observer) {
    if (!observer || observer === '') {
        return { valid: true, value: '500' }; // По умолчанию геоцентр
    }

    const observerStr = observer.toString().trim().toLowerCase();

    // Проверка на специальные коды
    if (SKYBOT_CONSTANTS.SPECIAL_OBSERVERS[observerStr] !== undefined) {
        return {
            valid: true,
            value: observer,
            description: SKYBOT_CONSTANTS.SPECIAL_OBSERVERS[observerStr]
        };
    }

    // Проверка на известные IAU коды (3 цифры)
    if (/^\d{3}$/.test(observerStr)) {
        const description = SKYBOT_CONSTANTS.IAU_OBSERVERS[observerStr] || `IAU код обсерватории ${observerStr}`;
        return {
            valid: true,
            value: observer,
            description
        };
    }

    // Проверка на формат координат: +-latitude, +-longitude, altitude
    // Примеры: +48.836477778, 2.336524278, 67.0 или -33.0, 151.0, 0
    const coordPattern = /^[+-]?\d+(\.\d+)?,\s*[+-]?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (coordPattern.test(observerStr)) {
        return {
            valid: true,
            value: observer,
            description: 'Географические координаты'
        };
    }

    return {
        valid: false,
        error: 'Неверный формат кода наблюдателя. Используйте IAU код (3 цифры), специальный код (@rosetta, @kepler, etc.) или координаты "lat, lon, alt"',
        suggested: '500'
    };
}

/**
 * Получение читаемого описания кода наблюдателя
 * @param {string} observer - Код наблюдателя
 * @returns {string} Описание
 */
export function getObserverDescription(observer) {
    if (!observer) return 'Геоцентр (по умолчанию)';

    const observerStr = observer.toString().trim().toLowerCase();

    // Проверяем специальные коды
    if (SKYBOT_CONSTANTS.SPECIAL_OBSERVERS[observerStr]) {
        return SKYBOT_CONSTANTS.SPECIAL_OBSERVERS[observerStr];
    }

    // Проверяем IAU коды
    if (SKYBOT_CONSTANTS.IAU_OBSERVERS[observerStr]) {
        return SKYBOT_CONSTANTS.IAU_OBSERVERS[observerStr];
    }

    // Проверяем формат координат
    const coordPattern = /^[+-]?\d+(\.\d+)?,\s*[+-]?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (coordPattern.test(observerStr)) {
        const [lat, lon, alt] = observerStr.split(',').map(s => s.trim());
        return `Географические координаты: широта ${lat}°, долгота ${lon}°, высота ${alt} м`;
    }

    return `Пользовательский код: ${observer}`;
}

/**
 * Получение списка доступных кодов наблюдателей
 * @returns {Object} Список кодов с описаниями
 */
export function getAvailableObservers() {
    return {
        default: '500 (Геоцентр)',
        iau_codes: SKYBOT_CONSTANTS.IAU_OBSERVERS,
        special: SKYBOT_CONSTANTS.SPECIAL_OBSERVERS,
        examples: [
            '500 - Геоцентр',
            '007 - Парижская обсерватория',
            '@rosetta - КА Rosetta',
            '@kepler - КА Kepler',
            '@earthl2 - Точка L2',
            '+48.836477778, 2.336524278, 67.0 - Париж (координаты)'
        ]
    };
}

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ЛИМИТАМИ И РЕЖИМАМИ
// ============================================================================

/**
 * Определение режима работы на основе лимита и getFile параметра
 * @param {number|string} limit - Лимит записей
 * @param {string} getFile - Параметр getFile ('0' или '1')
 * @param {number} threshold - Порог для автоматического файлового режима (по умолчанию 10)
 * @returns {Object} Информация о режиме
 */
export function determineMode(limit, getFile, threshold = 10) {
    const limitNum = parseInt(limit) || 0;
    const getFileBool = getFile === '1' || getFile === 'true' || getFile === true;

    // Режимы:
    // 1. Все объекты (limit=0) -> всегда файловый режим
    // 2. Явно запрошен getFile=1 -> файловый режим
    // 3. Лимит больше порога -> файловый режим
    // 4. Иначе -> метаданные

    const isAllObjects = limitNum === 0;
    const isLargeRequest = limitNum > threshold;

    const useFileMode = isAllObjects || getFileBool || isLargeRequest;

    let modeDescription = 'метаданные';
    let modeCode = 'metadata';

    if (isAllObjects) {
        modeDescription = 'файловый (все объекты)';
        modeCode = 'file-data-all';
    } else if (getFileBool) {
        modeDescription = 'файловый (принудительно)';
        modeCode = 'file-data-forced';
    } else if (isLargeRequest) {
        modeDescription = `файловый (лимит > ${threshold})`;
        modeCode = 'file-data-threshold';
    }

    return {
        useFileMode,
        modeDescription,
        modeCode,
        limitNum,
        isAllObjects,
        isLargeRequest,
        getFileBool,
        threshold
    };
}

/**
 * Форматирование лимита для вывода
 * @param {number|string} limit - Лимит
 * @returns {string} Отформатированный лимит
 */
export function formatLimit(limit) {
    const limitNum = parseInt(limit) || 0;
    return limitNum === 0 ? 'все объекты' : limitNum.toString();
}

/**
 * Проверка необходимости файлового режима
 * @param {number} limit - Лимит записей
 * @param {string} getFile - Параметр getFile
 * @param {number} threshold - Порог для автоматического включения (по умолчанию 10)
 * @returns {boolean} Нужно ли использовать файловый режим
 */
export function shouldUseFileMode(limit, getFile, threshold = 10) {
    const mode = determineMode(limit, getFile, threshold);
    return mode.useFileMode;
}

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ЭПОХАМИ
// ============================================================================

/**
 * Конвертация эпохи в формат Skybot3D
 * @param {string|number} epoch - Эпоха (год, 'now', или JD)
 * @returns {string} Эпоха в правильном формате
 */
export function formatSkybot3DEpoch(epoch) {
    if (!epoch || epoch === 'now' || epoch === 'NOW' || epoch === 'Now') {
        return 'now';
    }

    // Если это уже похоже на JD (большое число > 2400000)
    const numEpoch = parseFloat(epoch);
    if (!isNaN(numEpoch) && numEpoch > 2400000) {
        // Проверяем допустимый диапазон (1889-2060)
        if (numEpoch < SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_JD ||
            numEpoch > SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_JD) {
            console.log(`${colors.fg.yellow}⚠️ Эпоха ${epoch} вне допустимого диапазона, используется ближайшая допустимая${colors.reset}`);
            return Math.max(
                SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_JD,
                Math.min(SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_JD, numEpoch)
            ).toString();
        }
        return epoch.toString();
    }

    // Конвертируем год в JD
    const jd = parseFloat(epochToJD(epoch));

    // Проверяем допустимый диапазон
    if (jd < SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_JD ||
        jd > SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_JD) {
        console.log(`${colors.fg.yellow}⚠️ Эпоха ${epoch} вне допустимого диапазона, используется ближайшая допустимая${colors.reset}`);
        return Math.max(
            SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_JD,
            Math.min(SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_JD, jd)
        ).toString();
    }

    return jd.toString();
}

/**
 * Конвертация JD в год
 * @param {number} jd - Юлианская дата
 * @returns {number} Год
 */
export function jdToYear(jd) {
    const jdNum = parseFloat(jd);
    if (isNaN(jdNum)) return 2000;

    // Приблизительная конвертация (для J2000.0)
    return 2000.0 + (jdNum - 2451545.0) / 365.25;
}

/**
 * Получение текущей эпохи в формате Skybot3D
 * @returns {string} 'now'
 */
export function getCurrentEpoch() {
    return 'now';
}

/**
 * Валидация эпохи
 * @param {string|number} epoch - Эпоха для проверки
 * @returns {boolean} Валидна ли эпоха
 */
export function isValidEpoch(epoch) {
    if (!epoch || epoch === 'now') return true;

    const numEpoch = parseFloat(epoch);
    if (isNaN(numEpoch)) return false;

    // Если это JD
    if (numEpoch > 2400000) {
        return numEpoch >= SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_JD &&
            numEpoch <= SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_JD;
    }

    // Если это год
    return numEpoch >= SKYBOT_CONSTANTS.EPOCH_RANGE.MIN_YEAR &&
        numEpoch <= SKYBOT_CONSTANTS.EPOCH_RANGE.MAX_YEAR;
}

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ТАЙМАУТАМИ
// ============================================================================

/**
 * Получение таймаута для запроса в зависимости от параметров
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @returns {number} Таймаут в мс
 */
export function getTimeoutForRequest(endpoint, params = {}) {
    const baseTimeouts = SKYBOT_CONSTANTS.TIMEOUTS;

    let timeout;
    if (endpoint.includes('conesearch')) timeout = baseTimeouts.CONE_SEARCH;
    else if (endpoint.includes('getAster')) timeout = baseTimeouts.GET_ASTER;
    else if (endpoint.includes('getComet')) timeout = baseTimeouts.GET_COMET;
    else if (endpoint.includes('getPlanet')) timeout = baseTimeouts.GET_PLANET;
    else if (endpoint.includes('getSso')) timeout = baseTimeouts.GET_SSO;
    else if (endpoint.includes('availability')) timeout = baseTimeouts.AVAILABILITY;
    else timeout = 30000;

    // Корректировки в зависимости от параметров
    if (params.limit && parseInt(params.limit) > 10) {
        timeout = Math.min(timeout * 2, 120000);
    }

    if (params.radius && parseFloat(params.radius) > 5) {
        timeout = Math.min(timeout * 1.5, 90000);
    }

    if (params.name && params.name.includes('p:Mars') && endpoint.includes('ephemph')) {
        timeout = 30000; // Специальный таймаут для Марса
    }

    // Для всех объектов (limit=0) увеличиваем таймаут
    if (params.isAllObjects) {
        timeout = Math.min(timeout * 3, 180000);
    }

    return timeout;
}

/**
 * Создание AbortController с таймаутом
 * @param {number} timeout - Таймаут в мс
 * @returns {AbortController} AbortController
 */
export function createTimeoutController(timeout) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
}

// ============================================================================
// ПАРСИНГ ОТВЕТОВ SKYBOT
// ============================================================================

/**
 * Парсинг ответа SkyBoT cone search
 * @param {Object} data - Данные от API
 * @returns {Array} Массив объектов
 */
export function parseSkybotResponse(data) {
    const objects = [];

    try {
        if (!data) return objects;

        // Проверяем структуру SkyBoT API
        if (data && data.flag !== undefined && data.result) {
            try {
                const resultData = typeof data.result === 'string'
                    ? JSON.parse(data.result)
                    : data.result;

                if (resultData && resultData.data && Array.isArray(resultData.data)) {
                    resultData.data.forEach(obj => {
                        objects.push(formatSkybotObject(obj));
                    });
                } else if (resultData && Array.isArray(resultData)) {
                    resultData.forEach(obj => {
                        objects.push(formatSkybotObject(obj));
                    });
                }
                return objects;
            } catch (e) {
                console.warn('   Не удалось распарсить result SkyBoT:', e.message);
            }
        }

        // Прямой массив объектов
        if (Array.isArray(data)) {
            data.forEach(obj => objects.push(formatSkybotObject(obj)));
        }
        // Объект с полем data
        else if (data.data && Array.isArray(data.data)) {
            data.data.forEach(obj => objects.push(formatSkybotObject(obj)));
        }
        // Объект с полем objects
        else if (data.objects && Array.isArray(data.objects)) {
            data.objects.forEach(obj => objects.push(formatSkybotObject(obj)));
        }
        // Объект с полем result
        else if (data.result && Array.isArray(data.result)) {
            data.result.forEach(obj => objects.push(formatSkybotObject(obj)));
        }
        // Одиночный объект
        else if (typeof data === 'object') {
            objects.push(formatSkybotObject(data));
        }
    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка парсинга SkyBoT:${colors.reset}`, error.message);
    }

    return objects;
}

/**
 * Форматирование отдельного объекта SkyBoT
 * @param {Object} obj - Сырой объект
 * @returns {Object} Отформатированный объект
 */
export function formatSkybotObject(obj) {
    const ra = parseRA(obj['RA (hour)'] || obj.ra || obj.RA);
    const dec = parseDec(obj['DEC (deg)'] || obj.dec || obj.DEC);

    return {
        id: obj.Num || obj.id || obj.name || `obj_${Math.random().toString(36).substr(2, 9)}`,
        name: obj.Name || obj.name || 'Unknown',
        number: obj.Num || obj.number,
        type: obj.Class ? determineObjectType(obj) : (obj.type || 'unknown'),
        class: obj.Class || obj.class,
        ra: ra,
        dec: dec,
        ra_hours: ra / 15, // RA в часах
        mag: toNumber(obj['VMag (mag)'] || obj.magnitude || obj.Mag || 20, 20),
        motion: {
            ra: toNumber(obj['dRA (arcsec/h)'] || obj.dRA || 0),
            dec: toNumber(obj['dDEC (arcsec/h)'] || obj.dDEC || 0),
            total: calculateTotalMotion(
                toNumber(obj['dRA (arcsec/h)'] || obj.dRA || 0),
                toNumber(obj['dDEC (arcsec/h)'] || obj.dDEC || 0)
            )
        },
        distance: toNumber(obj['dg (ua)'] || obj.distance || obj.dg || 0),
        sunDistance: toNumber(obj['dh (ua)'] || obj.sunDistance || obj.dh || 0),
        phase: toNumber(obj['Phase (deg)'] || obj.phase || obj.Phase || 0),
        elongation: toNumber(obj['SunElong (deg)'] || obj.elongation || obj.SunElong || 0),
        position: obj.position ? {
            x: toNumber(obj.position.x),
            y: toNumber(obj.position.y),
            z: toNumber(obj.position.z)
        } : null,
        velocity: obj.velocity ? {
            x: toNumber(obj.velocity.x),
            y: toNumber(obj.velocity.y),
            z: toNumber(obj.velocity.z)
        } : null,
        error: toNumber(obj['Err (arcsec)'] || obj.error || 0),
        epoch: obj.epoch || obj.ref_epoch || null,
        epoch_jd: obj.epoch_jd || null
    };
}

/**
 * Вычисление полного собственного движения
 * @param {number} pmRA - Собственное движение по RA (mas/yr)
 * @param {number} pmDec - Собственное движение по Dec (mas/yr)
 * @returns {number} Полное собственное движение
 */
function calculateTotalMotion(pmRA, pmDec) {
    return Math.sqrt(pmRA * pmRA + pmDec * pmDec);
}

/**
 * Определение типа объекта по классу
 * @param {Object} obj - Объект с полем Class
 * @returns {string} Тип объекта
 */
export function determineObjectType(obj) {
    if (!obj) return 'unknown';

    const className = (obj.Class || obj.class || obj.type || '').toString().toLowerCase();

    if (className.includes('asteroid') || className.includes('ast') ||
        className.includes('nea') || className.includes('mba') ||
        className.includes('trojan') || className.includes('hilda')) {
        return 'asteroid';
    }
    if (className.includes('comet') || className.includes('com')) {
        return 'comet';
    }
    if (className.includes('planet') || className.includes('pla')) {
        return 'planet';
    }
    if (className.includes('dwarf') || className.includes('dwa') || className.includes('plutino')) {
        return 'dwarf planet';
    }
    if (className.includes('satellite') || className.includes('sat') || className.includes('moon')) {
        return 'satellite';
    }
    if (className.includes('spacecraft') || className.includes('sc:')) {
        return 'spacecraft';
    }

    return 'unknown';
}

/**
 * Получение класса объекта для визуализации
 * @param {string} type - Тип объекта
 * @param {string} subclass - Подкласс
 * @returns {string} Класс для визуализации
 */
export function getVisualClass(type, subclass = '') {
    const typeLower = type.toLowerCase();
    const subclassLower = subclass.toLowerCase();

    if (typeLower.includes('planet')) {
        if (subclassLower.includes('terrestrial')) return 'terrestrial planet';
        if (subclassLower.includes('gas')) return 'gas giant';
        if (subclassLower.includes('ice')) return 'ice giant';
        return 'planet';
    }

    if (typeLower.includes('dwarf')) return 'dwarf planet';

    if (typeLower.includes('asteroid')) {
        if (subclassLower.includes('nea') || subclassLower.includes('neo')) return 'near-earth asteroid';
        if (subclassLower.includes('trojan')) return 'trojan asteroid';
        if (subclassLower.includes('hilda')) return 'hilda asteroid';
        if (subclassLower.includes('c')) return 'carbonaceous asteroid';
        if (subclassLower.includes('s')) return 'silicaceous asteroid';
        if (subclassLower.includes('m')) return 'metallic asteroid';
        return 'main-belt asteroid';
    }

    if (typeLower.includes('comet')) {
        if (subclassLower.includes('short')) return 'short-period comet';
        if (subclassLower.includes('long')) return 'long-period comet';
        if (subclassLower.includes('halley')) return 'halley-type comet';
        if (subclassLower.includes('hyperbolic')) return 'hyperbolic comet';
        return 'comet';
    }

    return typeLower;
}

// ============================================================================
// ПАРСИНГ КООРДИНАТ
// ============================================================================

/**
 * Парсинг RA из различных форматов
 * @param {string|number} raStr - RA в различных форматах
 * @returns {number} RA в градусах
 */
export function parseRA(raStr) {
    if (!raStr) return 0;
    if (typeof raStr === 'number') return raStr;

    const str = raStr.toString().trim();

    // Парсинг формата \"HH:MM:SS.SS\"
    if (str.includes(':')) {
        const parts = str.split(':');
        if (parts.length === 3) {
            const hours = toNumber(parts[0]);
            const minutes = toNumber(parts[1]);
            const seconds = toNumber(parts[2]);
            return roundTo((hours + minutes / 60 + seconds / 3600) * 15, 6);
        }
    }

    // Парсинг формата \"HH MM SS.SS\"
    if (str.includes(' ')) {
        const parts = str.split(' ');
        if (parts.length === 3) {
            const hours = toNumber(parts[0]);
            const minutes = toNumber(parts[1]);
            const seconds = toNumber(parts[2]);
            return roundTo((hours + minutes / 60 + seconds / 3600) * 15, 6);
        }
    }

    // Парсинг формата с символами h/m/s
    const hmsMatch = str.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
    if (hmsMatch) {
        const hours = toNumber(hmsMatch[1]);
        const minutes = toNumber(hmsMatch[2]);
        const seconds = toNumber(hmsMatch[3]);
        return roundTo((hours + minutes / 60 + seconds / 3600) * 15, 6);
    }

    return roundTo(toNumber(raStr), 6);
}

/**
 * Парсинг Dec из различных форматов
 * @param {string|number} decStr - Dec в различных форматах
 * @returns {number} Dec в градусах
 */
export function parseDec(decStr) {
    if (!decStr) return 0;
    if (typeof decStr === 'number') return decStr;

    const str = decStr.toString().trim();

    // Определяем знак
    let sign = 1;
    let cleanStr = str;

    if (str.startsWith('-')) {
        sign = -1;
        cleanStr = str.substring(1);
    } else if (str.startsWith('+')) {
        cleanStr = str.substring(1);
    }

    // Парсинг формата \"DD:MM:SS.SS\"
    if (cleanStr.includes(':')) {
        const parts = cleanStr.split(':');
        if (parts.length === 3) {
            const deg = toNumber(parts[0]);
            const min = toNumber(parts[1]);
            const sec = toNumber(parts[2]);
            return roundTo(sign * (deg + min / 60 + sec / 3600), 6);
        }
    }

    // Парсинг формата \"DD MM SS.SS\"
    if (cleanStr.includes(' ')) {
        const parts = cleanStr.split(' ');
        if (parts.length === 3) {
            const deg = toNumber(parts[0]);
            const min = toNumber(parts[1]);
            const sec = toNumber(parts[2]);
            return roundTo(sign * (deg + min / 60 + sec / 3600), 6);
        }
    }

    // Парсинг формата с символами d/m/s
    const dmsMatch = cleanStr.match(/(\d+)d\s*(\d+)m\s*([\d.]+)s/);
    if (dmsMatch) {
        const deg = toNumber(dmsMatch[1]);
        const min = toNumber(dmsMatch[2]);
        const sec = toNumber(dmsMatch[3]);
        return roundTo(sign * (deg + min / 60 + sec / 3600), 6);
    }

    return roundTo(sign * toNumber(cleanStr), 6);
}

/**
 * Форматирование RA в часовой формат
 * @param {number} raDeg - RA в градусах
 * @returns {string} RA в формате \"HH:MM:SS.SS\"
 */
export function formatRA(raDeg) {
    const ra = toNumber(raDeg, 0) / 15;
    const hours = Math.floor(ra);
    const minutes = Math.floor((ra - hours) * 60);
    const seconds = ((ra - hours) * 60 - minutes) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
}

/**
 * Форматирование Dec в градусный формат
 * @param {number} decDeg - Dec в градусах
 * @returns {string} Dec в формате \"±DD:MM:SS.SS\"
 */
export function formatDec(decDeg) {
    const dec = toNumber(decDeg, 0);
    const sign = dec >= 0 ? '+' : '-';
    const absDec = Math.abs(dec);
    const degrees = Math.floor(absDec);
    const minutes = Math.floor((absDec - degrees) * 60);
    const seconds = ((absDec - degrees) * 60 - minutes) * 60;
    return `${sign}${degrees.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
}

/**
 * Проверка корректности координат
 * @param {number} ra - Прямое восхождение
 * @param {number} dec - Склонение
 * @returns {boolean} Корректны ли координаты
 */
export function isValidCoordinates(ra, dec) {
    const raNum = toNumber(ra, -1);
    const decNum = toNumber(dec, -100);

    return raNum >= 0 && raNum <= 360 &&
        decNum >= -90 && decNum <= 90;
}

/**
 * Вычисление углового расстояния между двумя точками
 * @param {number} ra1 - RA первой точки (градусы)
 * @param {number} dec1 - Dec первой точки (градусы)
 * @param {number} ra2 - RA второй точки (градусы)
 * @param {number} dec2 - Dec второй точки (градусы)
 * @returns {number} Угловое расстояние в градусах
 */
export function angularDistance(ra1, dec1, ra2, dec2) {
    const ra1Rad = ra1 * Math.PI / 180;
    const dec1Rad = dec1 * Math.PI / 180;
    const ra2Rad = ra2 * Math.PI / 180;
    const dec2Rad = dec2 * Math.PI / 180;

    const cosAngle = Math.sin(dec1Rad) * Math.sin(dec2Rad) +
        Math.cos(dec1Rad) * Math.cos(dec2Rad) *
        Math.cos(ra1Rad - ra2Rad);

    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
}

// ============================================================================
// СТАТИСТИКА И АНАЛИЗ
// ============================================================================

/**
 * Подсчет объектов по типам
 * @param {Array} objects - Массив объектов
 * @returns {Object} Счетчик по типам
 */
export function countByType(objects) {
    const counts = {
        asteroid: 0,
        comet: 0,
        planet: 0,
        'dwarf planet': 0,
        satellite: 0,
        spacecraft: 0,
        unknown: 0
    };

    objects.forEach(obj => {
        const type = obj.type || 'unknown';
        if (counts.hasOwnProperty(type)) {
            counts[type]++;
        } else {
            counts.unknown++;
        }
    });

    return counts;
}

/**
 * Подсчет объектов по классам
 * @param {Array} objects - Массив объектов
 * @returns {Object} Счетчик по классам
 */
export function countByClass(objects) {
    const counts = {};

    objects.forEach(obj => {
        const className = obj.class || 'Unknown';
        counts[className] = (counts[className] || 0) + 1;
    });

    return counts;
}

/**
 * Получение статистики по яркости
 * @param {Array} objects - Массив объектов
 * @returns {Object} Статистика по яркости
 */
export function getMagnitudeStats(objects) {
    const magnitudes = objects
        .map(obj => obj.mag)
        .filter(mag => mag > 0 && isFinite(mag));

    if (magnitudes.length === 0) {
        return {
            min: null,
            max: null,
            avg: null,
            count: 0
        };
    }

    return {
        min: Math.min(...magnitudes),
        max: Math.max(...magnitudes),
        avg: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
        count: magnitudes.length
    };
}

/**
 * Получение распределения по расстоянию
 * @param {Array} objects - Массив объектов
 * @returns {Object} Распределение по расстоянию
 */
export function getDistanceDistribution(objects) {
    const distances = objects
        .map(obj => obj.distance)
        .filter(dist => dist > 0 && isFinite(dist));

    if (distances.length === 0) {
        return {
            near: 0,      // < 1 AU
            medium: 0,    // 1-5 AU
            far: 0,       // 5-30 AU
            veryFar: 0,   // > 30 AU
            count: 0
        };
    }

    return {
        near: distances.filter(d => d < 1).length,
        medium: distances.filter(d => d >= 1 && d < 5).length,
        far: distances.filter(d => d >= 5 && d < 30).length,
        veryFar: distances.filter(d => d >= 30).length,
        count: distances.length
    };
}

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ
// ============================================================================

/**
 * Формирование имени файла для скачивания
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры запроса
 * @returns {string} Имя файла
 */
export function generateFilename(endpoint, params = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = endpoint.replace(/[^a-z0-9]/gi, '_');
    const limit = params.limit ? `_limit${params.limit}` : '';
    const epoch = params.epoch ? `_${params.epoch}` : '';

    return `${base}${limit}${epoch}_${timestamp}.json`;
}

/**
 * Парсинг Content-Disposition заголовка
 * @param {string} header - Content-Disposition заголовок
 * @returns {string|null} Имя файла или null
 */
export function parseContentDisposition(header) {
    if (!header) return null;

    const match = header.match(/filename[^;=\n]*=((['\"]).*?\2|[^;\n]*)/);
    return match ? match[1].replace(/['\"]/g, '') : null;
}

// ============================================================================
// ВАЛИДАЦИЯ ПАРАМЕТРОВ
// ============================================================================

/**
 * Валидация радиуса поиска
 * @param {number} radius - Радиус в градусах
 * @returns {Object} Результат валидации
 */
export function validateRadius(radius) {
    const r = parseFloat(radius);

    if (isNaN(r) || r <= 0) {
        return {
            valid: false,
            error: 'Радиус должен быть положительным числом',
            suggested: 1.0
        };
    }

    if (r > SKYBOT_CONSTANTS.LIMITS.MAX_RADIUS) {
        return {
            valid: false,
            error: `Радиус не может превышать ${SKYBOT_CONSTANTS.LIMITS.MAX_RADIUS}°`,
            max: SKYBOT_CONSTANTS.LIMITS.MAX_RADIUS,
            suggested: SKYBOT_CONSTANTS.LIMITS.MAX_RADIUS
        };
    }

    return { valid: true, value: r };
}

/**
 * Валидация лимита записей
 * @param {number} limit - Лимит записей
 * @returns {Object} Результат валидации
 */
export function validateLimit(limit) {
    const l = parseInt(limit);

    if (isNaN(l) || l < 0) {
        return {
            valid: false,
            error: 'Лимит должен быть неотрицательным целым числом',
            suggested: 10
        };
    }

    if (l > SKYBOT_CONSTANTS.LIMITS.MAX_FILE_LIMIT) {
        return {
            valid: false,
            error: `Лимит не может превышать ${SKYBOT_CONSTANTS.LIMITS.MAX_FILE_LIMIT}`,
            max: SKYBOT_CONSTANTS.LIMITS.MAX_FILE_LIMIT,
            suggested: SKYBOT_CONSTANTS.LIMITS.MAX_FILE_LIMIT
        };
    }

    return { valid: true, value: l };
}

// ============================================================================
// ЛОГГИРОВАНИЕ
// ============================================================================

/**
 * Форматирование времени выполнения
 * @param {number} ms - Время в миллисекундах
 * @returns {string} Отформатированное время
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}с`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}м ${seconds}с`;
}

/**
 * Логирование запроса
 * @param {string} endpoint - Эндпоинт
 * @param {Object} params - Параметры
 * @param {number} duration - Длительность
 * @param {string} status - Статус
 */
export function logRequest(endpoint, params, duration, status) {
    const timeStr = formatDuration(duration);
    const paramStr = Object.entries(params)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

    console.log(`[${new Date().toISOString()}] ${endpoint} ${paramStr ? `(${paramStr})` : ''} ${status} ${timeStr}`);
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
    SKYBOT_CONSTANTS,
    generateCacheKey,
    getCachedResponse,
    setCachedResponse,
    cleanCache,
    validateObserver,
    getObserverDescription,
    getAvailableObservers,
    determineMode,
    formatLimit,
    shouldUseFileMode,
    formatSkybot3DEpoch,
    jdToYear,
    getCurrentEpoch,
    isValidEpoch,
    getTimeoutForRequest,
    createTimeoutController,
    parseSkybotResponse,
    formatSkybotObject,
    determineObjectType,
    getVisualClass,
    parseRA,
    parseDec,
    formatRA,
    formatDec,
    isValidCoordinates,
    angularDistance,
    countByType,
    countByClass,
    getMagnitudeStats,
    getDistanceDistribution,
    generateFilename,
    parseContentDisposition,
    validateRadius,
    validateLimit,
    formatDuration,
    logRequest
};