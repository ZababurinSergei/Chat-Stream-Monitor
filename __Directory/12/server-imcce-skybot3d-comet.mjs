// /10/map/server-imcce-skybot3d-comet.mjs - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ FALLBACK
// ВЕРСИЯ 3.0 - Удалены fallback данные, добавлена единая обработка ошибок

import axios from 'axios';
import { IMCCE_CONFIG, DEFAULT_PARAMS, CACHE_TTL } from './server-imcce-config.mjs';
import { colors, createSuccessResponse, createServiceError } from './server-imcce-utils.mjs';
import {
    formatSkybot3DEpoch,
    getTimeoutForRequest,
    validateObserver,
    getObserverDescription,
    determineMode,
    formatLimit
} from './server-imcce-skybot-utils.mjs';

// ============================================================================
// ДИНАМИЧЕСКИЙ ИМПОРТ ДЛЯ BZ2 УТИЛИТ
// ============================================================================

let bz2Utils = null;
let decompressBZ2 = null;
let decompressGZIP = null;

/**
 * Ленивая загрузка bz2 утилит
 */
async function getBz2Utils() {
    if (!bz2Utils) {
        try {
            bz2Utils = await import('./server-imcce-bz2-utils.mjs');
            decompressBZ2 = bz2Utils.decompressBZ2;
            decompressGZIP = bz2Utils.decompressGZIP;
            console.log(`${colors.fg.green}✅ BZ2 утилиты загружены для комет${colors.reset}`);
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка загрузки BZ2 утилит:${colors.reset}`, error.message);
            throw error;
        }
    }
    return { bz2Utils, decompressBZ2, decompressGZIP };
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const COMET_CLASSES = {
    'SHORT_PERIOD': 'Short-Period',
    'LONG_PERIOD': 'Long-Period',
    'HALLEY_TYPE': 'Halley-Type',
    'ENCKE_TYPE': 'Encke-Type',
    'HYPERBOLIC': 'Hyperbolic',
    'PARABOLIC': 'Parabolic'
};

const FILE_MODE_CONFIG = {
    AUTO_DOWNLOAD_THRESHOLD: 10,
    MAX_DIRECT_LIMIT: 5,
    FILE_DOWNLOAD_TIMEOUT: 60000,
    MAX_FILE_SIZE: 100 * 1024 * 1024
};

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ ОБРАБОТКИ
// ============================================================================

/**
 * Парсинг ответа от API согласно документации Skybot3D
 * @param {Object} data - Данные от API
 * @returns {Object} Распарсенные метаданные
 */
export function parseCometMetadata(data) {
    if (!data) return { flag: 0, nbsso: 0 };

    return {
        flag: data.flag !== undefined ? data.flag : 0,
        ticket: data.ticket || null,
        status: data.status || null,
        nbsso: data.nbsso || 0,
        refdate: data.refdate || null,
        file: data.file || null,
        size: data['size(bytes)'] || null
    };
}

/**
 * Парсинг result поля (содержит реальные данные)
 * @param {Object} data - Ответ от API
 * @returns {Object} Распарсенные данные из result
 */
export function parseResultData(data) {
    if (!data || !data.result) {
        return { comets: [], nbsso: 0, refdate: null };
    }

    try {
        const resultData = typeof data.result === 'string'
            ? JSON.parse(data.result)
            : data.result;

        const result = {
            comets: [],
            nbsso: resultData.nbsso !== undefined ? resultData.nbsso : (data.nbsso || 0),
            refdate: resultData.refdate !== undefined ? resultData.refdate : (data.refdate || null)
        };

        if (resultData.comets && Array.isArray(resultData.comets)) {
            result.comets = resultData.comets;
        } else if (Array.isArray(resultData)) {
            result.comets = resultData;
        }

        return result;
    } catch (e) {
        console.warn(`   Не удалось распарсить result: ${e.message}`);
        return { comets: [], nbsso: data.nbsso || 0, refdate: data.refdate || null };
    }
}

/**
 * Форматирование кометы из массива (формат API)
 * @param {Array} comet - Массив данных кометы [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]
 * @returns {Object} Отформатированная комета
 */
export function formatCometFromArray(comet) {
    if (!Array.isArray(comet) || comet.length < 9) {
        return comet;
    }

    const formatted = {
        number: comet[0],
        name: comet[1] || 'Unnamed',
        class: comet[2] || 'Unknown',
        type: 'comet',
        state_vector: {
            position: {
                x: parseFloat(comet[3]) || 0,
                y: parseFloat(comet[4]) || 0,
                z: parseFloat(comet[5]) || 0
            },
            velocity: {
                x: parseFloat(comet[6]) || 0,
                y: parseFloat(comet[7]) || 0,
                z: parseFloat(comet[8]) || 0
            }
        }
    };

    if (comet.length > 9 && comet[9] !== undefined) {
        formatted.ra = parseFloat(comet[9]);
    }
    if (comet.length > 10 && comet[10] !== undefined) {
        formatted.dec = parseFloat(comet[10]);
    }
    if (comet.length > 11 && comet[11] !== undefined) {
        formatted.distance = parseFloat(comet[11]);
    }

    if (comet.length > 12 && comet[12] !== undefined) {
        formatted.magnitude = parseFloat(comet[12]);
    }
    if (comet.length > 13 && comet[13] !== undefined) {
        formatted.tail_length = parseFloat(comet[13]);
    }
    if (comet.length > 14 && comet[14] !== undefined) {
        formatted.perihelion = parseFloat(comet[14]);
    }

    return formatted;
}

/**
 * Форматирование массива комет
 * @param {Array} comets - Массив сырых данных
 * @returns {Array} Отформатированные кометы
 */
export function formatComets(comets) {
    if (!Array.isArray(comets)) {
        return [];
    }

    return comets.map(comet => {
        if (Array.isArray(comet)) {
            return formatCometFromArray(comet);
        }
        return comet;
    });
}

/**
 * Получение статистики по кометам
 * @param {Array} comets - Массив комет
 * @returns {Object} Статистика
 */
export function getCometStatistics(comets) {
    const stats = {
        total: comets.length,
        by_class: {},
        with_position: 0,
        with_velocity: 0,
        with_magnitude: 0,
        with_tail: 0
    };

    comets.forEach(comet => {
        const className = comet.class || 'Unknown';
        stats.by_class[className] = (stats.by_class[className] || 0) + 1;

        if (comet.ra !== undefined && comet.dec !== undefined) {
            stats.with_position++;
        }
        if (comet.state_vector?.velocity) {
            stats.with_velocity++;
        }
        if (comet.magnitude !== undefined) {
            stats.with_magnitude++;
        }
        if (comet.tail_length !== undefined) {
            stats.with_tail++;
        }
    });

    return stats;
}

/**
 * Обработка файлового режима
 * @param {Object} metadata - Метаданные ответа
 * @param {Object} mode - Режим работы
 * @param {string} objectClass - Класс комет
 * @param {string} epoch - Эпоха
 * @param {string} formattedEpoch - Отформатированная эпоха
 * @param {string} coord - Система координат
 * @param {string} finalObserver - Код наблюдателя
 * @param {number} startTime - Время начала запроса
 * @returns {Promise<Object>} Результат обработки
 */
async function handleFileMode(metadata, mode, objectClass, epoch, formattedEpoch, coord, finalObserver, startTime) {
    console.log(`   📥 Файловый режим: скачивание ${metadata.file}`);

    try {
        const { decompressBZ2, decompressGZIP } = await getBz2Utils();

        const fileResponse = await axios({
            method: 'GET',
            url: metadata.file,
            responseType: 'arraybuffer',
            timeout: FILE_MODE_CONFIG.FILE_DOWNLOAD_TIMEOUT,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/3.0',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            maxContentLength: FILE_MODE_CONFIG.MAX_FILE_SIZE
        });

        let fileData;
        if (metadata.file.endsWith('.bz2') || metadata.file.includes('.bz2')) {
            console.log(`   🔓 Распаковка BZ2...`);
            const decompressed = await decompressBZ2(fileResponse.data);
            fileData = JSON.parse(decompressed.toString('utf-8'));
        } else if (metadata.file.endsWith('.gz')) {
            console.log(`   🔓 Распаковка GZIP...`);
            const decompressed = await decompressGZIP(fileResponse.data);
            fileData = JSON.parse(decompressed.toString('utf-8'));
        } else {
            fileData = JSON.parse(fileResponse.data.toString('utf-8'));
        }

        const comets = formatComets(fileData.comets || []);
        const stats = getCometStatistics(comets);

        console.log(`   ✅ Извлечено комет: ${comets.length}`);

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            query: {
                class: objectClass || 'all',
                limit: mode.limitNum === 0 ? 'unlimited' : mode.limitNum,
                epoch: epoch,
                epoch_jd: formattedEpoch,
                coord_system: coord,
                observer: finalObserver,
                mode: mode.modeCode
            },
            metadata: {
                flag: metadata.flag,
                ticket: metadata.ticket,
                status: metadata.status,
                nbsso: fileData.nbsso || metadata.nbsso,
                refdate: fileData.refdate || metadata.refdate,
                file: metadata.file,
                file_size: metadata.size
            },
            count: comets.length,
            comets: comets,
            statistics: stats
        };

        return { success: true, result };

    } catch (fileError) {
        console.error(`   ❌ Ошибка при работе с файлом: ${fileError.message}`);
        return {
            success: false,
            error: fileError.message
        };
    }
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================================================

/**
 * Получение векторов комет с поддержкой файлового режима
 * GET /api/skybot3d/getComet?class=Short-Period&limit=10&epoch=2025.0&getFile=0&observer=500
 */
export async function skybot3dGetComet(req, res) {
    const startTime = Date.now();

    try {
        const {
            class: objectClass,
            limit = 0,
            epoch = DEFAULT_PARAMS.skybot3d.epoch,
            coord = DEFAULT_PARAMS.skybot3d.coord,
            mime = DEFAULT_PARAMS.skybot3d.mime,
            getFile = '0',
            observer = DEFAULT_PARAMS.skybot3d.observer || '500'
        } = req.query;

        const observerValidation = validateObserver(observer);
        const finalObserver = observerValidation.valid ? observerValidation.value : '500';

        if (!observerValidation.valid) {
            console.log(`${colors.fg.yellow}⚠️ ${observerValidation.error} Использую значение по умолчанию: 500${colors.reset}`);
        }

        const mode = determineMode(limit, getFile, FILE_MODE_CONFIG.AUTO_DOWNLOAD_THRESHOLD);
        const formattedEpoch = formatSkybot3DEpoch(epoch);

        console.log(`${colors.fg.cyan}☄️ Skybot3D getComet:${colors.reset}`);
        console.log(`   Класс: ${objectClass || 'все'}, Лимит: ${formatLimit(limit)}, Эпоха: ${epoch} -> JD: ${formattedEpoch}`);
        console.log(`   Наблюдатель: ${finalObserver} (${getObserverDescription(finalObserver)})`);
        console.log(`   Режим: ${mode.modeDescription}, getFile=${getFile}`);

        const params = new URLSearchParams({
            '-ep': formattedEpoch,
            '-coord': coord,
            '-mime': 'json',
            '-from': DEFAULT_PARAMS.skybot3d.from,
            '-observer': finalObserver
        });

        if (objectClass) {
            params.append('-class', objectClass);
        }
        if (mode.limitNum > 0) {
            params.append('-limit', mode.limitNum.toString());
        }

        console.log(`   Параметры API: ${params.toString()}`);

        const timeout = getTimeoutForRequest('getComet', {
            limit: mode.limitNum,
            isAllObjects: mode.isAllObjects
        });

        const response = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getComet,
            params: params,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/3.0',
                'Accept': 'application/json'
            },
            timeout: timeout,
            validateStatus: status => status < 500
        });

        const responseTime = Date.now() - startTime;
        const metadata = parseCometMetadata(response.data);

        console.log(`   Метаданные получены за ${responseTime}ms`);
        console.log(`   flag=${metadata.flag}, nbsso=${metadata.nbsso}, file=${metadata.file ? 'есть' : 'нет'}`);

        if (metadata.flag === 0 || metadata.flag === -1) {
            throw new Error(`API вернуло ошибку: flag=${metadata.flag}`);
        }

        if (mode.useFileMode && metadata.file) {
            const fileResult = await handleFileMode(
                metadata, mode, objectClass, epoch, formattedEpoch, coord, finalObserver, startTime
            );

            if (fileResult.success) {
                return res.json(createSuccessResponse(fileResult.result, {
                    source: 'Skybot3D (file mode)',
                    response_time: Date.now() - startTime
                }));
            } else {
                console.log(`   ⚠️ Ошибка файлового режима: ${fileResult.error}`);
                throw new Error(`Не удалось загрузить данные комет: ${fileResult.error}`);
            }
        }

        const resultData = parseResultData(response.data);
        const comets = formatComets(resultData.comets);
        const stats = getCometStatistics(comets);

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            query: {
                class: objectClass || 'all',
                limit: mode.limitNum === 0 ? 'unlimited' : mode.limitNum,
                epoch: epoch,
                epoch_jd: formattedEpoch,
                coord_system: coord,
                observer: finalObserver,
                mode: mode.useFileMode ? 'metadata' : 'direct-data'
            },
            metadata: {
                flag: metadata.flag,
                ticket: metadata.ticket,
                status: metadata.status,
                nbsso: resultData.nbsso,
                refdate: resultData.refdate,
                file: metadata.file,
                file_size: metadata.size
            },
            count: comets.length,
            comets: comets,
            statistics: stats
        };

        if (metadata.file && !mode.useFileMode) {
            result.note = 'Для получения полных данных используйте getFile=1';
        }

        console.log(`${colors.fg.green}✅ Skybot3D: получено ${comets.length} комет${colors.reset}`);

        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
        res.json(createSuccessResponse(result, {
            source: 'Skybot3D',
            response_time: Date.now() - startTime
        }));

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`${colors.fg.red}❌ Skybot3D getComet ошибка:${colors.reset}`, error.message);

        if (error.code === 'ECONNABORTED') {
            console.error(`   Таймаут после ${responseTime}ms`);
        }
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
        }

        const errorResponse = createServiceError('Skybot3D getComet', error, {
            class: req.query.class || 'all',
            limit: parseInt(req.query.limit) || 10,
            epoch: req.query.epoch || 'now',
            epoch_jd: formatSkybot3DEpoch(req.query.epoch || 'now'),
            observer: req.query.observer || '500',
            coord: req.query.coord || 'spherical',
            getFile: req.query.getFile || '0',
            response_time: responseTime
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
    skybot3dGetComet,
    parseCometMetadata,
    parseResultData,
    formatCometFromArray,
    formatComets,
    getCometStatistics,
    COMET_CLASSES
};