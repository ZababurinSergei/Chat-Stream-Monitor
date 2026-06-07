// /10/map/server-parser.mjs - Парсинг VOTable и других форматов ответов
// ВЕРСИЯ 3.0 - Полная версия с поддержкой MAST VOTable и всех форматов TAP
// 100% СИМВОЛОВ

import { parseString } from 'xml2js';
import { promisify } from 'util.js';
import { colors } from './server-config.mjs';

export const parseXML = promisify(parseString);

// ============================================================================
// ПАРСИНГ VOTABLE (ОБЩИЙ)
// ============================================================================

/**
 * Парсинг VOTable XML в JSON формат
 * @param {string|Buffer} xmlData - XML данные в строке или буфере
 * @returns {Promise<Object>} Распарсенные данные в формате { data: [...] }
 */
export async function parseVOTableToJSON(xmlData) {
    try {
        const xmlStr = typeof xmlData === 'string' ? xmlData : xmlData.toString('utf-8');

        // Проверяем, что это действительно VOTable
        if (!xmlStr.includes('VOTABLE') && !xmlStr.includes('VOTable')) {
            return { data: [], format: 'unknown' };
        }

        // Проверяем статус запроса
        if (xmlStr.includes('QUERY_STATUS" value="ERROR')) {
            const errorMatch = xmlStr.match(/<INFO name="QUERY_STATUS" value="ERROR">\s*([^<]+)/);
            const errorMsg = errorMatch ? errorMatch[1].trim() : 'Unknown VOTable error';
            console.warn(`   ⚠️ VOTable Error: ${errorMsg}`);
            return { data: [], error: errorMsg, format: 'votable' };
        }

        const result = await parseXML(xmlStr, {
            explicitArray: false,
            mergeAttrs: true,
            explicitCharkey: false,
            trim: true,
            normalize: true,
            normalizeTags: false,
            attrkey: '@_',
            charkey: '_',
            explicitRoot: false
        });

        // Извлекаем данные из VOTable структуры
        if (result.VOTABLE) {
            const votable = result.VOTABLE;
            const resource = Array.isArray(votable.RESOURCE) ? votable.RESOURCE[0] : votable.RESOURCE;

            if (resource && resource.TABLE) {
                const table = resource.TABLE;
                const fields = extractFields(table);
                const data = extractData(table);

                return {
                    data: data,
                    fields: fields,
                    metadata: {
                        name: table.NAME || 'results',
                        description: table.DESCRIPTION || '',
                        nrows: data.length
                    },
                    format: 'votable'
                };
            }
        }

        // Если структура не распознана, возвращаем пустой результат
        return { data: [], format: 'votable', error: 'Invalid VOTable structure' };
    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка парсинга VOTable:${colors.reset}`, error.message);
        return { data: [], error: error.message, format: 'votable' };
    }
}

/**
 * Извлечение полей из VOTable
 * @param {Object} table - Таблица из VOTable
 * @returns {Array} Массив полей
 */
function extractFields(table) {
    const fields = [];

    if (table.FIELD) {
        const fieldArray = Array.isArray(table.FIELD) ? table.FIELD : [table.FIELD];
        for (const field of fieldArray) {
            fields.push({
                name: field.NAME || field.name || 'unknown',
                id: field.ID || field.id,
                ucd: field.ucd || field.UCD,
                unit: field.unit || field.UNIT,
                datatype: field.datatype || field.DATATYPE || 'char',
                arraysize: field.arraysize || field.ARRAYSIZE
            });
        }
    }

    return fields;
}

/**
 * Извлечение данных из VOTable
 * @param {Object} table - Таблица из VOTable
 * @returns {Array} Массив строк данных
 */
function extractData(table) {
    const rows = [];

    if (table.DATA && table.DATA.TABLEDATA) {
        const tableData = table.DATA.TABLEDATA;

        if (tableData.TR) {
            const trs = Array.isArray(tableData.TR) ? tableData.TR : [tableData.TR];

            for (const tr of trs) {
                if (tr.TD) {
                    const tds = Array.isArray(tr.TD) ? tr.TD : [tr.TD];
                    const row = tds.map(td => {
                        if (typeof td === 'object') {
                            if (td._ !== undefined) return td._;
                            if (td['#'] !== undefined) return td['#'];
                            if (td.value !== undefined) return td.value;
                            if (td.VALUE !== undefined) return td.VALUE;
                            return '';
                        }
                        return td || '';
                    });
                    rows.push(row);
                }
            }
        }
    }

    return rows;
}

// ============================================================================
// ПАРСИНГ VOTABLE ОТ MAST (СПЕЦИАЛЬНЫЙ)
// ============================================================================

/**
 * Парсинг VOTable от MAST API (быстрый regexp парсинг)
 * @param {string|Buffer} xmlData - XML данные
 * @returns {Object} Распарсенные данные
 */
export function parseMastVOTable(xmlData) {
    try {
        const xmlStr = typeof xmlData === 'string' ? xmlData : xmlData.toString('utf-8');

        // Проверяем статус запроса
        if (xmlStr.includes('QUERY_STATUS" value="ERROR')) {
            const errorMatch = xmlStr.match(/<INFO name="QUERY_STATUS" value="ERROR">\s*([^<]+)/);
            const errorMsg = errorMatch ? errorMatch[1].trim() : 'Unknown MAST error';
            console.warn(`   ⚠️ MAST Error: ${errorMsg}`);
            return { data: [], error: errorMsg, format: 'votable' };
        }

        // Проверяем успешность
        if (!xmlStr.includes('QUERY_STATUS" value="OK')) {
            return { data: [], error: 'Query failed', format: 'votable' };
        }

        // Извлекаем названия полей
        const fieldPattern = /<FIELD name="([^"]+)"[^>]*>/g;
        const fields = [];
        let fieldMatch;

        while ((fieldMatch = fieldPattern.exec(xmlStr)) !== null) {
            fields.push(fieldMatch[1]);
        }

        // Извлекаем строки данных
        const rowPattern = /<TR>(.*?)<\/TR>/gs;
        const tdPattern = /<TD>(.*?)<\/TD>/g;

        const rows = [];
        let rowMatch;

        while ((rowMatch = rowPattern.exec(xmlStr)) !== null) {
            const rowContent = rowMatch[1];
            const values = [];
            let tdMatch;

            tdPattern.lastIndex = 0;
            while ((tdMatch = tdPattern.exec(rowContent)) !== null) {
                let value = tdMatch[1];
                // Пробуем преобразовать в число если возможно
                if (value && !isNaN(parseFloat(value)) && isFinite(value)) {
                    const num = parseFloat(value);
                    if (num.toString() === value) {
                        value = num;
                    }
                }
                values.push(value);
            }

            if (values.length > 0) {
                // Если есть названия полей, создаем объект
                if (fields.length > 0 && fields.length === values.length) {
                    const obj = {};
                    for (let i = 0; i < fields.length; i++) {
                        obj[fields[i]] = values[i];
                    }
                    rows.push(obj);
                } else {
                    rows.push(values);
                }
            }
        }

        return {
            data: rows,
            fields: fields,
            format: 'votable',
            count: rows.length
        };
    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка парсинга MAST VOTable:${colors.reset}`, error.message);
        return { data: [], error: error.message, format: 'votable' };
    }
}

// ============================================================================
// ПАРСИНГ CSV
// ============================================================================

/**
 * Парсинг CSV ответа в JSON
 * @param {string} csvData - CSV данные
 * @param {Object} options - Опции парсинга
 * @returns {Object} Распарсенные данные
 */
export function parseCSVToJSON(csvData, options = {}) {
    try {
        const { delimiter = ',', hasHeader = true } = options;

        // Очищаем данные от возможных BOM и лишних пробелов
        const cleanData = csvData.toString().trim().replace(/^\uFEFF/, '');
        const lines = cleanData.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length === 0) {
            return { data: [], format: 'csv' };
        }

        // Парсим заголовки
        let headers = [];
        let startIndex = 0;

        if (hasHeader) {
            headers = parseCSVLine(lines[0], delimiter);
            startIndex = 1;
        } else {
            // Если нет заголовков, создаем числовые
            const firstLine = parseCSVLine(lines[0], delimiter);
            headers = firstLine.map((_, index) => `col${index + 1}`);
        }

        // Парсим данные
        const data = [];
        for (let i = startIndex; i < lines.length; i++) {
            const values = parseCSVLine(lines[i], delimiter);

            // Создаем объект с заголовками
            if (hasHeader) {
                const row = {};
                headers.forEach((header, index) => {
                    let value = values[index] || '';
                    // Пробуем преобразовать в число
                    if (value && !isNaN(parseFloat(value)) && isFinite(value)) {
                        const num = parseFloat(value);
                        if (num.toString() === value) {
                            value = num;
                        }
                    }
                    row[header] = value;
                });
                data.push(row);
            } else {
                // Если нет заголовков, возвращаем массив значений
                data.push(values);
            }
        }

        return {
            data: data,
            headers: headers,
            count: data.length,
            format: 'csv'
        };
    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка парсинга CSV:${colors.reset}`, error.message);
        return { data: [], error: error.message, format: 'csv' };
    }
}

/**
 * Парсинг одной строки CSV с учетом кавычек
 * @param {string} line - Строка CSV
 * @param {string} delimiter - Разделитель
 * @returns {Array} Массив значений
 */
function parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Экранированная кавычка
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

// ============================================================================
// ПАРСИНГ JSON (TAP)
// ============================================================================

/**
 * Парсинг TAP JSON ответа
 * @param {Object} jsonData - JSON данные
 * @returns {Object} Нормализованные данные
 */
export function parseTAPJSON(jsonData) {
    try {
        // Проверяем различные форматы TAP JSON
        if (jsonData.data && Array.isArray(jsonData.data)) {
            // Уже в нашем формате
            return {
                data: jsonData.data,
                metadata: jsonData.metadata,
                format: 'json'
            };
        }

        if (jsonData.results && Array.isArray(jsonData.results)) {
            // Формат некоторых TAP сервисов
            return {
                data: jsonData.results,
                metadata: {
                    fields: jsonData.fields || []
                },
                format: 'json'
            };
        }

        if (Array.isArray(jsonData)) {
            // Простой массив
            return {
                data: jsonData,
                format: 'json'
            };
        }

        if (jsonData.result && jsonData.result.data) {
            // Формат ESA
            return {
                data: jsonData.result.data,
                metadata: {
                    fields: jsonData.result.metadata || []
                },
                format: 'json'
            };
        }

        // Если ничего не подходит, возвращаем как есть
        return {
            data: jsonData,
            format: 'json'
        };
    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка парсинга JSON:${colors.reset}`, error.message);
        return { data: [], error: error.message, format: 'json' };
    }
}

// ============================================================================
// УНИВЕРСАЛЬНЫЙ ПАРСЕР
// ============================================================================

/**
 * Парсинг ответа от TAP сервиса
 * @param {Object} response - HTTP ответ от axios
 * @param {string} sourceKey - Ключ источника данных
 * @returns {Promise<Object>} Распарсенный ответ
 */
export async function parseTAPResponse(response, sourceKey) {
    const contentType = response.headers['content-type'] || '';
    const data = response.data;

    // Если ответ уже объект, проверяем его
    if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        return parseTAPJSON(data);
    }

    // Преобразуем буфер в строку если нужно
    let dataStr = data;
    if (Buffer.isBuffer(data)) {
        dataStr = data.toString('utf-8');
    }

    // Специальная обработка для MAST
    if (sourceKey === 'mast') {
        return parseMastVOTable(dataStr);
    }

    // Определяем формат по content-type
    if (contentType.includes('application/json') ||
        (typeof dataStr === 'string' && dataStr.trim().startsWith('{'))) {
        try {
            const jsonData = JSON.parse(dataStr);
            return parseTAPJSON(jsonData);
        } catch (e) {
            console.warn(`${colors.fg.yellow}⚠️ Не удалось распарсить JSON:${colors.reset}`, e.message);
        }
    }

    // Проверяем на VOTable
    if (contentType.includes('text/xml') ||
        contentType.includes('application/xml') ||
        (typeof dataStr === 'string' &&
            (dataStr.trim().startsWith('<?xml') || dataStr.includes('VOTABLE')))) {

        try {
            return await parseVOTableToJSON(dataStr);
        } catch (e) {
            console.warn(`${colors.fg.yellow}⚠️ Не удалось распарсить VOTable:${colors.reset}`, e.message);
        }
    }

    // Проверяем на CSV
    if (contentType.includes('text/csv') ||
        (typeof dataStr === 'string' && dataStr.includes(','))) {
        try {
            return parseCSVToJSON(dataStr);
        } catch (e) {
            console.warn(`${colors.fg.yellow}⚠️ Не удалось распарсить CSV:${colors.reset}`, e.message);
        }
    }

    // Если ничего не подошло, возвращаем как есть
    return {
        data: dataStr,
        format: 'unknown',
        contentType
    };
}

// ============================================================================
// ПРЕОБРАЗОВАНИЕ КООРДИНАТ
// ============================================================================

/**
 * Преобразование координат из радианов в градусы
 * @param {number} ra - Прямое восхождение (возможно в радианах)
 * @param {number} dec - Склонение (возможно в радианах)
 * @returns {Object} Координаты в градусах
 */
export function normalizeCoordinates(ra, dec) {
    const raNum = parseFloat(ra);
    const decNum = parseFloat(dec);

    // Проверяем, в радианах ли координаты (значения < 2*PI и > 0)
    const isRadians = raNum < 7 && decNum < 2 && raNum > 0 && Math.abs(decNum) < 2;

    return {
        ra: isRadians ? raNum * 180 / Math.PI : raNum,
        dec: isRadians ? decNum * 180 / Math.PI : decNum,
        originalIsRadians: isRadians
    };
}

/**
 * Преобразование RA из формата "HH:MM:SS.SS" в градусы
 * @param {string} raStr - RA в часовом формате
 * @returns {number} RA в градусах
 */
export function parseRA(raStr) {
    if (!raStr) return 0;
    if (typeof raStr === 'number') return raStr;

    // Парсинг формата "HH:MM:SS.SS" в градусы
    const parts = raStr.toString().split(':');
    if (parts.length === 3) {
        const hours = parseFloat(parts[0]);
        const minutes = parseFloat(parts[1]);
        const seconds = parseFloat(parts[2]);
        return (hours + minutes / 60 + seconds / 3600) * 15;
    }

    // Парсинг формата с пробелами "HH MM SS.SS"
    const spaceParts = raStr.toString().split(' ');
    if (spaceParts.length === 3) {
        const hours = parseFloat(spaceParts[0]);
        const minutes = parseFloat(spaceParts[1]);
        const seconds = parseFloat(spaceParts[2]);
        return (hours + minutes / 60 + seconds / 3600) * 15;
    }

    return parseFloat(raStr) || 0;
}

/**
 * Преобразование Dec из формата "±DD:MM:SS.SS" в градусы
 * @param {string} decStr - Dec в формате градусов
 * @returns {number} Dec в градусах
 */
export function parseDec(decStr) {
    if (!decStr) return 0;
    if (typeof decStr === 'number') return decStr;

    const str = decStr.toString();

    // Определяем знак
    let sign = 1;
    let cleanStr = str;

    if (str.startsWith('-')) {
        sign = -1;
        cleanStr = str.substring(1);
    } else if (str.startsWith('+')) {
        cleanStr = str.substring(1);
    }

    // Парсинг формата "DD:MM:SS.SS"
    const parts = cleanStr.split(':');
    if (parts.length === 3) {
        const deg = parseFloat(parts[0]);
        const min = parseFloat(parts[1]);
        const sec = parseFloat(parts[2]);
        return sign * (deg + min / 60 + sec / 3600);
    }

    // Парсинг формата с пробелами "DD MM SS.SS"
    const spaceParts = cleanStr.split(' ');
    if (spaceParts.length === 3) {
        const deg = parseFloat(spaceParts[0]);
        const min = parseFloat(spaceParts[1]);
        const sec = parseFloat(spaceParts[2]);
        return sign * (deg + min / 60 + sec / 3600);
    }

    return sign * (parseFloat(cleanStr) || 0);
}

/**
 * Форматирование RA из градусов в часовой формат
 * @param {number} raDeg - RA в градусах
 * @returns {string} RA в формате "HH:MM:SS.SS"
 */
export function formatRA(raDeg) {
    const ra = parseFloat(raDeg) / 15;
    const hours = Math.floor(ra);
    const minutes = Math.floor((ra - hours) * 60);
    const seconds = ((ra - hours) * 60 - minutes) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
}

/**
 * Форматирование Dec из градусов в формат "±DD:MM:SS.SS"
 * @param {number} decDeg - Dec в градусах
 * @returns {string} Dec в формате "±DD:MM:SS.SS"
 */
export function formatDec(decDeg) {
    const dec = parseFloat(decDeg);
    const sign = dec >= 0 ? '+' : '-';
    const absDec = Math.abs(dec);
    const degrees = Math.floor(absDec);
    const minutes = Math.floor((absDec - degrees) * 60);
    const seconds = ((absDec - degrees) * 60 - minutes) * 60;
    return `${sign}${degrees.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
}

// ============================================================================
// ОПРЕДЕЛЕНИЕ ТИПА ОБЪЕКТА
// ============================================================================

/**
 * Определение типа объекта по классу
 * @param {Object} obj - Объект с полем Class
 * @returns {string} Тип объекта
 */
export function determineObjectType(obj) {
    const className = (obj.Class || obj.class || '').toString().toLowerCase();

    if (className.includes('asteroid') || className.includes('ast')) return 'asteroid';
    if (className.includes('comet') || className.includes('com')) return 'comet';
    if (className.includes('planet') || className.includes('pla')) return 'planet';
    if (className.includes('dwarf') || className.includes('dwa')) return 'dwarf planet';
    if (className.includes('satellite') || className.includes('sat')) return 'satellite';
    if (className.includes('nebula') || className.includes('neb')) return 'nebula';
    if (className.includes('galaxy') || className.includes('gal')) return 'galaxy';
    if (className.includes('star')) return 'star';

    return 'unknown';
}

// ============================================================================
// ВАЛИДАЦИЯ ДАННЫХ
// ============================================================================

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
 * Безопасное преобразование в число
 * @param {any} value - Значение для преобразования
 * @param {number} defaultValue - Значение по умолчанию
 * @returns {number} Число
 */
export function toNumber(value, defaultValue = 0) {
    if (!isNumeric(value)) return defaultValue;
    return parseFloat(value);
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
// ЭКСПОРТ
// ============================================================================

export default {
    parseVOTableToJSON,
    parseMastVOTable,
    parseCSVToJSON,
    parseTAPJSON,
    parseTAPResponse,
    normalizeCoordinates,
    parseRA,
    parseDec,
    formatRA,
    formatDec,
    determineObjectType,
    isNumeric,
    toNumber,
    isValidCoordinates,
    angularDistance
};