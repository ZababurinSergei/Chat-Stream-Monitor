// /10/map/server-imcce-skybot3d-aster.mjs - Skybot3D астероиды
// ВЕРСИЯ 3.0 - Без fallback данных, единая обработка ошибок

import axios from 'axios';
import { decompressBZ2, decompressGZIP } from './server-imcce-bz2-utils.mjs';
import { IMCCE_CONFIG, DEFAULT_PARAMS, CACHE_TTL } from './server-imcce-config.mjs';
import { colors, createServiceError } from './server-imcce-utils.mjs';
import {
    formatSkybot3DEpoch,
    getTimeoutForRequest,
    validateObserver,
    getObserverDescription,
    determineMode,
    formatLimit
} from './server-imcce-skybot-utils.mjs';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const FILE_MODE_CONFIG = {
    AUTO_DOWNLOAD_THRESHOLD: 10,
    MAX_DIRECT_LIMIT: 5,
    FILE_DOWNLOAD_TIMEOUT: 60000,
    MAX_FILE_SIZE: 100 * 1024 * 1024
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Безопасная установка заголовков (только ASCII символы)
 */
function setSafeHeaders(res, headers) {
    const safeHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        const safeValue = String(value).replace(/[^\x00-\x7F]/g, '');
        safeHeaders[key] = safeValue;
    }
    res.set(safeHeaders);
}

/**
 * Форматирование астероидов из массива в объекты
 */
function formatAsteroids(asteroids, refdate) {
    if (!Array.isArray(asteroids)) return [];

    return asteroids.map(aster => {
        if (Array.isArray(aster)) {
            return {
                number: aster[0],
                name: aster[1] || 'Unnamed',
                class: aster[2] || 'Unknown',
                type: 'asteroid',
                state_vector: {
                    position: {
                        x: parseFloat(aster[3]) || 0,
                        y: parseFloat(aster[4]) || 0,
                        z: parseFloat(aster[5]) || 0
                    },
                    velocity: {
                        x: parseFloat(aster[6]) || 0,
                        y: parseFloat(aster[7]) || 0,
                        z: parseFloat(aster[8]) || 0
                    }
                },
                epoch: aster[9] || refdate,
                spherical: aster.length > 12 ? {
                    ra: parseFloat(aster[9]) || 0,
                    dec: parseFloat(aster[10]) || 0,
                    distance: parseFloat(aster[11]) || 0
                } : null
            };
        }
        return aster;
    });
}

/**
 * Извлечение метаданных из ответа API
 */
function extractMetadata(data) {
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
 * Парсинг result поля ответа
 */
function parseResultField(data) {
    if (!data || !data.result) {
        return { asteroids: [], nbsso: 0, refdate: null };
    }

    try {
        const resultData = typeof data.result === 'string'
            ? JSON.parse(data.result)
            : data.result;

        const result = {
            asteroids: [],
            nbsso: resultData.nbsso !== undefined ? resultData.nbsso : (data.nbsso || 0),
            refdate: resultData.refdate !== undefined ? resultData.refdate : (data.refdate || null)
        };

        if (resultData.asteroids && Array.isArray(resultData.asteroids)) {
            result.asteroids = resultData.asteroids;
        } else if (Array.isArray(resultData)) {
            result.asteroids = resultData;
        }

        return result;
    } catch (e) {
        console.warn(`   Не удалось распарсить result: ${e.message}`);
        if (Array.isArray(data.result)) {
            return { asteroids: data.result, nbsso: data.nbsso || 0, refdate: data.refdate || null };
        }
        return { asteroids: [], nbsso: data.nbsso || 0, refdate: data.refdate || null };
    }
}

/**
 * Формирование параметров запроса
 */
function buildRequestParams(params) {
    const {
        objectClass,
        limit = 0,
        epoch,
        coord = 'spherical',
        observer = '500'
    } = params;

    const observerValidation = validateObserver(observer);
    const finalObserver = observerValidation.valid ? observerValidation.value : '500';

    if (!observerValidation.valid) {
        console.log(`${colors.fg.yellow}⚠️ ${observerValidation.error} Использую значение по умолчанию: 500${colors.reset}`);
    }

    const formattedEpoch = formatSkybot3DEpoch(epoch);

    const searchParams = new URLSearchParams({
        '-ep': formattedEpoch,
        '-coord': coord,
        '-mime': 'json',
        '-from': DEFAULT_PARAMS.skybot3d.from,
        '-observer': finalObserver
    });

    if (objectClass) {
        searchParams.append('-class', objectClass);
    }

    if (limit > 0) {
        searchParams.append('-limit', limit.toString());
    }

    console.log(`   Наблюдатель: ${finalObserver} (${getObserverDescription(finalObserver)})`);

    return { searchParams, formattedEpoch, finalObserver };
}

/**
 * Обработка файлового режима с поддержкой bz2
 */
async function handleFileMode(metadata, mode, objectClass, epoch, formattedEpoch, coord, finalObserver, startTime) {
    console.log(`   📥 Файловый режим: скачивание ${metadata.file}`);

    try {
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
        const contentType = fileResponse.headers['content-type'] || '';

        if (metadata.file.endsWith('.bz2') || metadata.file.includes('.bz2') || contentType.includes('bzip2')) {
            console.log(`   🔓 Распаковка BZ2...`);
            const decompressed = await decompressBZ2(fileResponse.data);
            const jsonStr = decompressed.toString('utf-8');
            fileData = JSON.parse(jsonStr);
            console.log(`   ✅ BZ2 распакован успешно`);
        } else if (metadata.file.endsWith('.gz') || metadata.file.includes('.gz') || contentType.includes('gzip')) {
            console.log(`   🔓 Распаковка GZIP...`);
            const decompressed = await decompressGZIP(fileResponse.data);
            fileData = JSON.parse(decompressed.toString('utf-8'));
            console.log(`   ✅ GZIP распакован успешно`);
        } else {
            fileData = JSON.parse(fileResponse.data.toString('utf-8'));
            console.log(`   ✅ JSON загружен без сжатия`);
        }

        const asteroids = formatAsteroids(
            fileData.asteroids || [],
            fileData.refdate || metadata.refdate
        );

        console.log(`   ✅ Извлечено астероидов: ${asteroids.length}`);

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
            count: asteroids.length,
            asteroids: asteroids
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
// ОСНОВНАЯ ФУНКЦИЯ SKYBOT3D GETASTER
// ============================================================================

export async function skybot3dGetAster(req, res) {
    const startTime = Date.now();

    try {
        const {
            class: objectClass,
            limit = 0,
            epoch = DEFAULT_PARAMS.skybot3d.epoch,
            coord = DEFAULT_PARAMS.skybot3d.coord,
            getFile = '0',
            observer = '500'
        } = req.query;

        const mode = determineMode(limit, getFile, FILE_MODE_CONFIG.AUTO_DOWNLOAD_THRESHOLD);

        console.log(`${colors.fg.cyan}🪨 Skybot3D getAster:${colors.reset}`);
        console.log(`   Класс: ${objectClass || 'все'}, Лимит: ${formatLimit(limit)}, Эпоха: ${epoch}`);
        console.log(`   Режим: ${mode.modeDescription}, getFile=${getFile}`);

        const { searchParams, formattedEpoch, finalObserver } = buildRequestParams({
            objectClass,
            limit: mode.limitNum,
            epoch,
            coord,
            observer
        });

        console.log(`   Параметры API: ${searchParams.toString()}`);

        const timeout = getTimeoutForRequest('getAster', {
            limit: mode.limitNum,
            isAllObjects: mode.isAllObjects
        });

        const response = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getAster,
            params: searchParams,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/3.0',
                'Accept': 'application/json'
            },
            timeout: timeout,
            validateStatus: status => status < 500
        });

        const metadata = extractMetadata(response.data);
        const responseTime = Date.now() - startTime;

        console.log(`   Метаданные получены за ${responseTime}ms`);
        console.log(`   flag=${metadata.flag}, nbsso=${metadata.nbsso}, file=${metadata.file ? 'есть' : 'нет'}`);

        if (metadata.flag === 0 || metadata.flag === -1) {
            throw new Error(`API вернуло ошибку: flag=${metadata.flag}, status=${metadata.status}`);
        }

        setSafeHeaders(res, {
            'Cache-Control': `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`,
            'X-Response-Time': `${responseTime}ms`,
            'X-Mode-Code': mode.modeCode,
            'X-Observer': finalObserver
        });

        if (mode.useFileMode && metadata.file) {
            const fileResult = await handleFileMode(
                metadata, mode, objectClass, epoch, formattedEpoch, coord, finalObserver, startTime
            );

            if (fileResult.success) {
                return res.json(fileResult.result);
            } else {
                console.log(`   ⚠️ Ошибка файлового режима: ${fileResult.error}`);
                throw new Error(`Не удалось загрузить данные: ${fileResult.error}`);
            }
        }

        const parsed = parseResultField(response.data);
        const asteroids = formatAsteroids(parsed.asteroids, parsed.refdate);

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
                nbsso: parsed.nbsso,
                refdate: parsed.refdate,
                file: metadata.file,
                file_size: metadata.size
            },
            count: asteroids.length,
            asteroids: asteroids
        };

        if (metadata.file && !mode.useFileMode && asteroids.length === 0) {
            result.note = 'Для получения полных данных используйте getFile=1 или увеличьте лимит';
        }

        console.log(`${colors.fg.green}✅ Skybot3D: получено ${asteroids.length} астероидов (${mode.modeDescription})${colors.reset}`);

        res.json(result);

    } catch (error) {
        const responseTime = Date.now() - startTime;

        console.error(`${colors.fg.red}❌ Skybot3D getAster ошибка:${colors.reset}`, error.message);

        if (error.code === 'ECONNABORTED') {
            console.error(`   Таймаут после ${responseTime}ms`);
        }
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
        }

        const errorResponse = createServiceError('Skybot3D getAster', error, {
            class: req.query.class || 'all',
            limit: parseInt(req.query.limit) || 10,
            epoch: req.query.epoch || 'now',
            observer: req.query.observer || '500',
            response_time: responseTime
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ АСТЕРОИДОВ
// ============================================================================

/**
 * Получение астероида по номеру или имени
 * GET /api/skybot3d/aster/:id?epoch=2025.0&observer=500
 */
export async function skybot3dGetAsterById(req, res) {
    const startTime = Date.now();

    try {
        const { id } = req.params;
        const {
            epoch = DEFAULT_PARAMS.skybot3d.epoch,
            coord = 'spherical',
            observer = '500'
        } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Parameter "id" is required'
            });
        }

        console.log(`${colors.fg.cyan}🪨 Skybot3D getAsterById: ${id} @ ${epoch}${colors.reset}`);

        const formattedEpoch = formatSkybot3DEpoch(epoch);

        const observerValidation = validateObserver(observer);
        const finalObserver = observerValidation.valid ? observerValidation.value : '500';

        const searchParams = new URLSearchParams({
            '-ep': formattedEpoch,
            '-coord': coord,
            '-mime': 'json',
            '-from': DEFAULT_PARAMS.skybot3d.from,
            '-observer': finalObserver,
            '-name': id
        });

        const response = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getAster,
            params: searchParams,
            timeout: 15000,
            validateStatus: status => status < 500
        });

        const metadata = extractMetadata(response.data);
        const parsed = parseResultField(response.data);

        if (parsed.asteroids.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Asteroid ${id} not found`,
                query: { id, epoch, observer: finalObserver }
            });
        }

        const formattedAsteroids = formatAsteroids(parsed.asteroids, parsed.refdate);

        res.json({
            success: true,
            id: id,
            epoch: epoch,
            epoch_jd: formattedEpoch,
            observer: finalObserver,
            asteroid: formattedAsteroids[0],
            nbsso: parsed.nbsso,
            flag: metadata.flag,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;

        console.error(`${colors.fg.red}❌ Skybot3D getAsterById ошибка:${colors.reset}`, error.message);

        const errorResponse = createServiceError('Skybot3D getAsterById', error, {
            id: req.params.id,
            epoch: req.query.epoch || 'now',
            observer: req.query.observer || '500',
            response_time: responseTime
        });

        res.status(503).json(errorResponse);
    }
}

/**
 * Получение статистики по астероидам
 * GET /api/skybot3d/aster/stats
 */
export async function skybot3dAsterStats(req, res) {
    try {
        const stats = {
            total_known: 1216000,
            by_class: {
                MBA: { count: 985000, description: 'Main Belt Asteroids' },
                NEA: { count: 32000, description: 'Near-Earth Asteroids' },
                Trojan: { count: 13000, description: 'Trojan Asteroids' },
                Hilda: { count: 4100, description: 'Hilda Asteroids' },
                JFC: { count: 800, description: 'Jupiter Family Comets' },
                Centaurs: { count: 600, description: 'Centaurs' },
                TNO: { count: 3500, description: 'Trans-Neptunian Objects' }
            },
            by_size: {
                large: { diameter: '>100 km', count: 200 },
                medium: { diameter: '10-100 km', count: 10000 },
                small: { diameter: '<10 km', count: 1200000 }
            },
            with_physical_data: {
                diameter: 420000,
                albedo: 380000,
                taxonomy: 290000,
                rotation: 85000
            },
            last_update: '2024-01-15',
            source: 'IMCCE Skybot3D Database'
        };

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: stats
        });

    } catch (error) {
        console.error(`${colors.fg.red}❌ Skybot3D asterStats ошибка:${colors.reset}`, error.message);

        res.status(503).json(createServiceError('Skybot3D asterStats', error));
    }
}

/**
 * Получение классов астероидов
 * GET /api/skybot3d/aster/classes
 */
export function skybot3dAsterClasses(req, res) {
    const classes = [
        { id: 'NEA', name: 'Near-Earth Asteroids', subclasses: ['Apollo', 'Aten', 'Amor', 'Atira'] },
        { id: 'MBA', name: 'Main Belt Asteroids', subclasses: ['Inner', 'Middle', 'Outer'] },
        { id: 'Trojan', name: 'Trojan Asteroids', subclasses: ['Jupiter Trojans', 'Mars Trojans', 'Earth Trojans'] },
        { id: 'Hilda', name: 'Hilda Asteroids', subclasses: [] },
        { id: 'JFC', name: 'Jupiter Family Comets', subclasses: [] },
        { id: 'Centaurs', name: 'Centaurs', subclasses: [] },
        { id: 'TNO', name: 'Trans-Neptunian Objects', subclasses: ['KBO', 'SDO', 'Detached'] }
    ];

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: classes
    });
}

/**
 * Получение информации о поддерживаемых кодах наблюдателей
 * GET /api/skybot3d/aster/observers
 */
export function skybot3dAsterObservers(req, res) {
    const observers = {
        default: '500 (геоцентр)',
        iau_codes: {
            '500': 'Геоцентр',
            '007': 'Парижская обсерватория',
            '008': 'Ницца',
            '009': 'Uccle',
            '010': 'Caussols'
        },
        special_codes: {
            '@sun': 'Солнце',
            '@rosetta': 'Космический аппарат Rosetta',
            '@kepler': 'Космический аппарат Kepler',
            '@earthl2': 'Точка L2 системы Солнце-Земля',
            '@tess': 'Космический аппарат TESS'
        },
        format_examples: {
            iau: '500',
            special: '@rosetta',
            coordinates: '+48.836477778, 2.336524278, 67.0'
        }
    };

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: observers
    });
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export default {
    skybot3dGetAster,
    skybot3dGetAsterById,
    skybot3dAsterStats,
    skybot3dAsterClasses,
    skybot3dAsterObservers,
    formatAsteroids,
    extractMetadata,
    parseResultField,
    buildRequestParams,
    handleFileMode
};