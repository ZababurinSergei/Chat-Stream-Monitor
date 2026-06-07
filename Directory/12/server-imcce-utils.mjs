// /10/map/server-imcce-utils.mjs - Утилиты для IMCCE API (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ВЕРСИЯ 3.0 - Удалены все fallback данные, добавлена единая обработка ошибок

import { OBJECT_PREFIXES, FALLBACK_PHYSICAL, DEFAULT_PARAMS } from './server-imcce-config.mjs';

// ============================================================================
// ЦВЕТА ДЛЯ ВЫВОДА (для консистентности с основным сервером)
// ============================================================================

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

// ============================================================================
// ЕДИНЫЙ ОБРАБОТЧИК ОШИБОК (НОВАЯ ФУНКЦИЯ)
// ============================================================================

/**
 * Создание ответа с ошибкой сервера (единый формат)
 * @param {string} serviceName - Название сервиса
 * @param {Error|string} error - Ошибка
 * @param {Object} query - Параметры запроса
 * @param {number} statusCode - HTTP статус код (по умолчанию 503)
 * @returns {Object} Единый формат ошибки
 */
export function createServiceError(serviceName, error, query = {}, statusCode = 503) {
    const errorMessage = error?.message || error || 'Unknown error';
    const errorCode = error?.code || 'SERVICE_UNAVAILABLE';

    console.error(`${colors.fg.red}❌ ${serviceName} error:${colors.reset}`, errorMessage);

    return {
        success: false,
        error: true,
        service: serviceName,
        status: statusCode,
        message: `Сервис ${serviceName} временно недоступен`,
        details: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        query: query,
        suggestion: 'Пожалуйста, попробуйте позже или обратитесь к администратору'
    };
}

/**
 * Создание ответа с ошибкой валидации
 * @param {string} message - Сообщение об ошибке
 * @param {Object} details - Детали ошибки
 * @returns {Object} Ответ с ошибкой валидации
 */
export function createValidationError(message, details = {}) {
    return {
        success: false,
        error: true,
        type: 'validation_error',
        message: message,
        details: details,
        timestamp: new Date().toISOString()
    };
}

/**
 * Создание ответа с ошибкой аутентификации
 * @param {string} serviceName - Название сервиса
 * @param {string} message - Сообщение об ошибке
 * @returns {Object} Ответ с ошибкой аутентификации
 */
export function createAuthError(serviceName, message = 'Authentication required') {
    return {
        success: false,
        error: true,
        type: 'auth_error',
        service: serviceName,
        message: message,
        timestamp: new Date().toISOString(),
        suggestion: 'Проверьте учетные данные или выполните вход заново'
    };
}

/**
 * Создание ответа с ошибкой таймаута
 * @param {string} serviceName - Название сервиса
 * @param {number} timeout - Таймаут в мс
 * @returns {Object} Ответ с ошибкой таймаута
 */
export function createTimeoutError(serviceName, timeout) {
    return {
        success: false,
        error: true,
        type: 'timeout_error',
        service: serviceName,
        message: `Превышено время ожидания ответа от сервиса ${serviceName}`,
        timeout_ms: timeout,
        timestamp: new Date().toISOString(),
        suggestion: 'Попробуйте уменьшить объем запрашиваемых данных или повторите запрос позже'
    };
}

// ============================================================================
// ФОРМАТИРОВАНИЕ ЧИСЕЛ
// ============================================================================

/**
 * Форматирование числа с заданным количеством знаков
 * @param {number} num - Число для форматирования
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированное число
 */
export function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null) return '?';
    if (typeof num === 'number') {
        return num.toFixed(decimals);
    }
    return num.toString();
}

/**
 * Безопасное преобразование в число
 * @param {any} value - Значение для преобразования
 * @param {number} defaultValue - Значение по умолчанию
 * @returns {number} Число
 */
export function toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number' && !isNaN(value)) return value;

    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Проверка, является ли значение числом
 * @param {any} value - Значение для проверки
 * @returns {boolean} Является ли числом
 */
export function isNumeric(value) {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Округление до заданного количества знаков
 * @param {number} num - Число
 * @param {number} decimals - Количество знаков
 * @returns {number} Округленное число
 */
export function roundTo(num, decimals = 2) {
    if (!isNumeric(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

// ============================================================================
// РАБОТА С ИДЕНТИФИКАТОРАМИ ОБЪЕКТОВ
// ============================================================================

/**
 * Очистка идентификатора объекта от префиксов
 * @param {string} name - Имя с префиксом или без
 * @returns {string} Очищенное имя
 */
export function cleanObjectId(name) {
    if (!name) return '';
    return name.replace(/^(a:|id:|p:|c:|s:|d:|sc:)/, '');
}

/**
 * Добавление правильного префикса для объекта
 * @param {string} name - Имя объекта
 * @param {string} type - Тип объекта ('planet', 'asteroid', 'comet', 'satellite', 'dwarf', 'spacecraft')
 * @returns {string} Имя с префиксом
 */
export function addObjectPrefix(name, type = 'planet') {
    if (!name) return name;

    const prefix = OBJECT_PREFIXES[type] || '';
    if (!prefix) return name;
    if (name.startsWith(prefix)) return name;
    if (/^\d+$/.test(name) && type === 'asteroid') return name;

    return `${prefix}${name}`;
}

/**
 * Определение типа объекта по ID
 * @param {string} id - Идентификатор объекта
 * @returns {string} Тип объекта
 */
export function detectObjectType(id) {
    if (!id) return 'unknown';

    if (id.startsWith('p:')) return 'planet';
    if (id.startsWith('a:')) return 'asteroid';
    if (id.startsWith('c:')) return 'comet';
    if (id.startsWith('s:')) return 'satellite';
    if (id.startsWith('d:')) return 'dwarf';
    if (id.startsWith('sc:')) return 'spacecraft';

    if (/^\d+$/.test(id)) return 'asteroid';
    if (id.includes('/')) return 'comet';
    if (['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(id.toLowerCase())) {
        return 'planet';
    }
    if (['ceres', 'pluto', 'haumea', 'makemake', 'eris'].includes(id.toLowerCase())) {
        return 'dwarf';
    }

    return 'unknown';
}

/**
 * Получение читаемого имени объекта
 * @param {string} id - Идентификатор объекта
 * @returns {string} Читаемое имя
 */
export function getReadableObjectName(id) {
    if (!id) return 'Unknown';

    const clean = cleanObjectId(id);
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// ============================================================================
// РАБОТА С ЭПОХАМИ И ДАТАМИ
// ============================================================================

/**
 * Преобразование года в юлианскую дату (JD)
 * @param {number|string} epoch - Год (например, 2025.0) или 'now'
 * @returns {string} Юлианская дата
 */
export function epochToJD(epoch) {
    if (epoch === 'now' || epoch === 'NOW' || epoch === 'Now') return 'now';

    const epochNum = toNumber(epoch, 2016.0);
    return (2457388.5 + (epochNum - 2016.0) * 365.25).toFixed(2);
}

/**
 * Преобразование года в юлианскую дату для Skybot3D с проверкой диапазона
 * @param {string|number} epoch - Эпоха (год, 'now', или JD)
 * @returns {string} Эпоха в правильном формате для Skybot3D
 */
export function epochToJDForSkybot3D(epoch) {
    if (!epoch || epoch === 'now' || epoch === 'NOW') {
        return 'now';
    }

    const numEpoch = parseFloat(epoch);
    if (!isNaN(numEpoch) && numEpoch > 2400000) {
        if (numEpoch < 2411320 || numEpoch > 2473540) {
            console.warn(`⚠️ JD ${numEpoch} вне допустимого диапазона (2411320.0 .. 2473540.0)`);
            return Math.max(2411320, Math.min(2473540, numEpoch)).toString();
        }
        return epoch.toString();
    }

    const jd = parseFloat(epochToJD(epoch));
    if (jd < 2411320 || jd > 2473540) {
        console.warn(`⚠️ Эпоха ${epoch} -> JD ${jd} вне допустимого диапазона (1889-2060)`);
        return Math.max(2411320, Math.min(2473540, jd)).toString();
    }

    return jd.toString();
}

/**
 * Преобразование JD в год
 * @param {number} jd - Юлианская дата
 * @returns {number} Год
 */
export function jdToEpoch(jd) {
    const jdNum = toNumber(jd, 2457388.5);
    return 2016.0 + (jdNum - 2457388.5) / 365.25;
}

/**
 * Получение текущей эпохи в годах
 * @returns {number} Текущая эпоха
 */
export function getCurrentEpoch() {
    const now = Date.now();
    const jdNow = 2440587.5 + now / 86400000;
    return jdToEpoch(jdNow);
}

/**
 * Форматирование даты из JD
 * @param {number} jd - Юлианская дата
 * @returns {string} Отформатированная дата ISO
 */
export function jdToISO(jd) {
    const jdNum = toNumber(jd, 2457388.5);
    const unixTime = (jdNum - 2440587.5) * 86400000;
    return new Date(unixTime).toISOString();
}

// ============================================================================
// ПАРСИНГ КООРДИНАТ SKYBOT
// ============================================================================

/**
 * Парсинг RA из формата "HH:MM:SS.SS" в градусы
 * @param {string|number} raStr - RA в часовом формате
 * @returns {number} RA в градусах
 */
export function parseRA(raStr) {
    if (!raStr) return 0;
    if (typeof raStr === 'number') return raStr;

    const str = raStr.toString().trim();

    if (str.includes(':')) {
        const parts = str.split(':');
        if (parts.length === 3) {
            const hours = toNumber(parts[0]);
            const minutes = toNumber(parts[1]);
            const seconds = toNumber(parts[2]);
            return (hours + minutes/60 + seconds/3600) * 15;
        }
    }

    if (str.includes(' ')) {
        const parts = str.split(' ');
        if (parts.length === 3) {
            const hours = toNumber(parts[0]);
            const minutes = toNumber(parts[1]);
            const seconds = toNumber(parts[2]);
            return (hours + minutes/60 + seconds/3600) * 15;
        }
    }

    return toNumber(raStr);
}

/**
 * Парсинг Dec из формата "±DD:MM:SS.SS" в градусы
 * @param {string|number} decStr - Dec в формате градусов
 * @returns {number} Dec в градусах
 */
export function parseDec(decStr) {
    if (!decStr) return 0;
    if (typeof decStr === 'number') return decStr;

    const str = decStr.toString().trim();

    let sign = 1;
    let cleanStr = str;

    if (str.startsWith('-')) {
        sign = -1;
        cleanStr = str.substring(1);
    } else if (str.startsWith('+')) {
        cleanStr = str.substring(1);
    }

    if (cleanStr.includes(':')) {
        const parts = cleanStr.split(':');
        if (parts.length === 3) {
            const deg = toNumber(parts[0]);
            const min = toNumber(parts[1]);
            const sec = toNumber(parts[2]);
            return sign * (deg + min/60 + sec/3600);
        }
    }

    if (cleanStr.includes(' ')) {
        const parts = cleanStr.split(' ');
        if (parts.length === 3) {
            const deg = toNumber(parts[0]);
            const min = toNumber(parts[1]);
            const sec = toNumber(parts[2]);
            return sign * (deg + min/60 + sec/3600);
        }
    }

    return sign * toNumber(cleanStr);
}

/**
 * Преобразование RA из градусов в часовой формат
 * @param {number} raDeg - RA в градусах
 * @returns {string} RA в формате "HH:MM:SS.SS"
 */
export function formatRA(raDeg) {
    const ra = toNumber(raDeg, 0) / 15;
    const hours = Math.floor(ra);
    const minutes = Math.floor((ra - hours) * 60);
    const seconds = ((ra - hours) * 60 - minutes) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
}

/**
 * Преобразование Dec из градусов в формат "±DD:MM:SS.SS"
 * @param {number} decDeg - Dec в градусах
 * @returns {string} Dec в формате "±DD:MM:SS.SS"
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

// ============================================================================
// ОПРЕДЕЛЕНИЕ ТИПА ОБЪЕКТА ПО КЛАССУ
// ============================================================================

/**
 * Определение типа объекта по классу
 * @param {Object} obj - Объект с полем Class
 * @returns {string} Тип объекта
 */
export function determineObjectType(obj) {
    if (!obj) return 'unknown';

    const className = (obj.Class || obj.class || obj.type || '').toString().toLowerCase();

    if (className.includes('asteroid') || className.includes('ast') || className.includes('nea') || className.includes('mba')) {
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
    if (className.includes('nebula') || className.includes('neb')) {
        return 'nebula';
    }
    if (className.includes('galaxy') || className.includes('gal')) {
        return 'galaxy';
    }
    if (className.includes('star')) {
        return 'star';
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
        return 'main-belt asteroid';
    }
    if (typeLower.includes('comet')) {
        if (subclassLower.includes('short')) return 'short-period comet';
        if (subclassLower.includes('long')) return 'long-period comet';
        return 'comet';
    }

    return typeLower;
}

// ============================================================================
// ФОРМАТИРОВАНИЕ ОТВЕТОВ
// ============================================================================

/**
 * Создание стандартного ответа об успехе
 * @param {Object} data - Данные для ответа
 * @param {Object} meta - Метаданные
 * @returns {Object} Форматированный ответ
 */
export function createSuccessResponse(data, meta = {}) {
    return {
        success: true,
        timestamp: new Date().toISOString(),
        ...meta,
        data
    };
}

/**
 * Создание ответа с ошибкой
 * @param {string} message - Сообщение об ошибке
 * @param {number} status - HTTP статус
 * @param {Object} details - Детали ошибки
 * @returns {Object} Форматированный ответ с ошибкой
 */
export function createErrorResponse(message, status = 400, details = {}) {
    return {
        success: false,
        error: message,
        status: status,
        timestamp: new Date().toISOString(),
        ...details
    };
}

// ============================================================================
// ВАЛИДАЦИЯ ПАРАМЕТРОВ
// ============================================================================

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
 * Проверка корректности радиуса поиска
 * @param {number} radius - Радиус в градусах
 * @returns {boolean} Корректен ли радиус
 */
export function isValidRadius(radius) {
    const r = toNumber(radius, -1);
    return r > 0 && r <= 180;
}

/**
 * Проверка корректности эпохи
 * @param {string|number} epoch - Эпоха
 * @returns {boolean} Корректна ли эпоха
 */
export function isValidEpoch(epoch) {
    if (epoch === 'now' || epoch === 'NOW') return true;

    const epochNum = toNumber(epoch, null);
    if (epochNum === null) return false;

    return epochNum >= 1900 && epochNum <= 2100;
}

/**
 * Извлечение целочисленного параметра с проверкой
 * @param {any} value - Значение
 * @param {number} defaultValue - Значение по умолчанию
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Валидное целое число
 */
export function getIntParam(value, defaultValue, min = -Infinity, max = Infinity) {
    let num = parseInt(value);
    if (isNaN(num)) num = defaultValue;
    return Math.max(min, Math.min(max, num));
}

/**
 * Извлечение параметра с плавающей точкой с проверкой
 * @param {any} value - Значение
 * @param {number} defaultValue - Значение по умолчанию
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Валидное число
 */
export function getFloatParam(value, defaultValue, min = -Infinity, max = Infinity) {
    let num = parseFloat(value);
    if (isNaN(num)) num = defaultValue;
    return Math.max(min, Math.min(max, num));
}

// ============================================================================
// РАБОТА С URL И ПАРАМЕТРАМИ
// ============================================================================

/**
 * Построение URL с параметрами для IMCCE API
 * @param {string} baseUrl - Базовый URL
 * @param {Object} params - Параметры
 * @returns {string} Полный URL
 */
export function buildImcceUrl(baseUrl, params = {}) {
    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            const paramKey = key.startsWith('-') ? key : `-${key}`;
            urlParams.append(paramKey, value.toString());
        }
    }

    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Объединение параметров по умолчанию с пользовательскими
 * @param {Object} userParams - Пользовательские параметры
 * @param {Object} defaultParams - Параметры по умолчанию
 * @returns {Object} Объединенные параметры
 */
export function mergeParams(userParams = {}, defaultParams = {}) {
    const result = { ...defaultParams };

    for (const [key, value] of Object.entries(userParams)) {
        if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
        }
    }

    return result;
}

// ============================================================================
// ПАРСИНГ ОТВЕТОВ SKYBOT3D
// ============================================================================

/**
 * Парсинг ответа Skybot3D согласно документации
 * @param {Object} response - Ответ от Skybot3D API
 * @returns {Object} Распарсенные данные
 */
export function parseSkybot3DResponse(response) {
    if (!response) return { flag: 0, data: null };

    if (response.flag !== undefined) {
        const result = {
            flag: response.flag,
            ticket: response.ticket,
            status: response.status,
            nbsso: response.nbsso,
            refdate: response.refdate,
            file: response.file,
            size: response['size(bytes)']
        };

        if (response.result) {
            try {
                const resultData = typeof response.result === 'string'
                    ? JSON.parse(response.result)
                    : response.result;

                result.data = resultData;

                if (resultData) {
                    if (resultData.asteroids) result.asteroids = resultData.asteroids;
                    if (resultData.comets) result.comets = resultData.comets;
                    if (resultData.planets) result.planets = resultData.planets;

                    if (resultData.nbsso !== undefined) result.nbsso = resultData.nbsso;
                    if (resultData.refdate !== undefined) result.refdate = resultData.refdate;
                }
            } catch (e) {
                console.warn('Не удалось распарсить result:', e.message);
                result.rawResult = response.result;
            }
        }

        return result;
    }

    return {
        flag: 1,
        data: response
    };
}

// ============================================================================
// ПАРСИНГ ОТВЕТОВ MIRIADE
// ============================================================================

/**
 * Парсинг ответа Miriade ephemcc
 * @param {Object} data - Данные от Miriade API
 * @returns {Object} Распарсенные данные
 */
export function parseMiriadeEphemccResponse(data) {
    if (!data) return { data: [], flag: 0 };

    if (data && data.flag !== undefined) {
        const result = {
            flag: data.flag,
            ticket: data.ticket,
            status: data.status
        };

        if (data.result) {
            try {
                const resultData = typeof data.result === 'string'
                    ? JSON.parse(data.result)
                    : data.result;

                if (resultData && resultData.data) {
                    result.data = resultData.data;
                } else if (resultData && resultData.ephemeris && resultData.ephemeris.data) {
                    result.data = resultData.ephemeris.data;
                } else if (Array.isArray(resultData)) {
                    result.data = resultData;
                } else if (resultData && resultData.sso && resultData.data) {
                    result.data = resultData.data;
                } else {
                    result.data = resultData;
                }
            } catch (e) {
                console.warn('   Не удалось распарсить result как JSON:', e.message);
                result.rawResult = data.result;
            }
        }

        if (data.ephemeris && data.ephemeris.data) {
            result.data = data.ephemeris.data;
        }

        return result;
    }

    if (data && data.data) return data;
    if (Array.isArray(data)) return { data };
    if (data && (data.ra !== undefined || data.dec !== undefined)) {
        return { data: [data] };
    }

    return { data: [data] };
}

/**
 * Парсинг ответа Miriade ephemph
 * @param {Object} data - Данные от Miriade API
 * @returns {Object} Распарсенные данные с parsedData
 */
export function parseMiriadeEphemphResponse(data) {
    if (!data) return { data: [], parsedData: [], flag: 0 };

    if (data && data.flag !== undefined) {
        const result = {
            flag: data.flag,
            ticket: data.ticket,
            status: data.status
        };

        if (data.result) {
            try {
                const resultData = typeof data.result === 'string'
                    ? JSON.parse(data.result)
                    : data.result;

                if (resultData && resultData.data) {
                    result.data = resultData.data;
                    result.parsedData = resultData.data.map(item => {
                        if (Array.isArray(item)) {
                            return {
                                date: item[0],
                                subEarthLong: item[1] ? parseFloat(item[1]) : undefined,
                                subEarthLat: item[2] ? parseFloat(item[2]) : undefined,
                                subSolarLong: item[3] ? parseFloat(item[3]) : undefined,
                                subSolarLat: item[4] ? parseFloat(item[4]) : undefined,
                                northPolePA: item[5] ? parseFloat(item[5]) : undefined,
                                poleDistance: item[6] ? parseFloat(item[6]) : undefined,
                                magnitude: item[7] ? parseFloat(item[7]) : undefined,
                                phaseAngle: item[8] ? parseFloat(item[8]) : undefined,
                                angularRadius: item[9] ? parseFloat(item[9]) : undefined,
                                range: item[10] ? parseFloat(item[10]) : undefined,
                                helioDistance: item[11] ? parseFloat(item[11]) : undefined
                            };
                        }
                        return item;
                    });
                }
            } catch (e) {
                console.warn('   Не удалось распарсить result как JSON:', e.message);
                result.rawResult = data.result;
            }
        }

        if (data.ephemeris && data.ephemeris.data) {
            result.data = data.ephemeris.data;
            result.parsedData = data.ephemeris.data.map(item => {
                if (Array.isArray(item)) {
                    return {
                        date: item[0],
                        subEarthLong: item[1],
                        subEarthLat: item[2],
                        subSolarLong: item[3],
                        subSolarLat: item[4],
                        northPolePA: item[5],
                        poleDistance: item[6],
                        magnitude: item[7],
                        phaseAngle: item[8],
                        angularRadius: item[9],
                        range: item[10],
                        helioDistance: item[11]
                    };
                }
                return item;
            });
        }

        return result;
    }

    if (data && data.parsedData) return { parsedData: data.parsedData, data: data.data };
    if (data && data.data && Array.isArray(data.data)) {
        const parsedData = data.data.map(item => {
            if (!Array.isArray(item)) return item;

            return {
                date: item[0],
                subEarthLong: item[1] ? parseFloat(item[1]) : undefined,
                subEarthLat: item[2] ? parseFloat(item[2]) : undefined,
                subSolarLong: item[3] ? parseFloat(item[3]) : undefined,
                subSolarLat: item[4] ? parseFloat(item[4]) : undefined,
                northPolePA: item[5] ? parseFloat(item[5]) : undefined,
                poleDistance: item[6] ? parseFloat(item[6]) : undefined,
                magnitude: item[7] ? parseFloat(item[7]) : undefined,
                phaseAngle: item[8] ? parseFloat(item[8]) : undefined,
                angularRadius: item[9] ? parseFloat(item[9]) : undefined,
                range: item[10] ? parseFloat(item[10]) : undefined,
                helioDistance: item[11] ? parseFloat(item[11]) : undefined,
                radialVelocity: item[12] ? parseFloat(item[12]) : undefined,
                berv: item[13] ? parseFloat(item[13]) : undefined,
                rvs: item[14] ? parseFloat(item[14]) : undefined,
                ra: item[15] ? parseFloat(item[15]) : undefined,
                dec: item[16] ? parseFloat(item[16]) : undefined
            };
        });
        return { parsedData, data: data.data };
    }

    return { data };
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export default {
    colors,
    createServiceError,
    createValidationError,
    createAuthError,
    createTimeoutError,
    formatNumber,
    toNumber,
    isNumeric,
    roundTo,
    cleanObjectId,
    addObjectPrefix,
    detectObjectType,
    getReadableObjectName,
    epochToJD,
    epochToJDForSkybot3D,
    jdToEpoch,
    getCurrentEpoch,
    jdToISO,
    parseRA,
    parseDec,
    formatRA,
    formatDec,
    determineObjectType,
    getVisualClass,
    createSuccessResponse,
    createErrorResponse,
    isValidCoordinates,
    isValidRadius,
    isValidEpoch,
    getIntParam,
    getFloatParam,
    buildImcceUrl,
    mergeParams,
    parseSkybot3DResponse,
    parseMiriadeEphemccResponse,
    parseMiriadeEphemphResponse
};