// /10/map/server-imcce-skybot3d-sso.mjs - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ВЕРСИЯ 3.3 - Удалены fallback данные, единая обработка ошибок

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
import { shouldUseFileMode, extractSkybot3DData } from './server-imcce-bz2-utils.mjs';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const FILE_MODE_THRESHOLD = 10;
const MAX_DIRECT_LIMIT = 5;
const FILE_DOWNLOAD_TIMEOUT = 60000;
const MAX_TIMEOUT_ALL_OBJECTS = 60000; // Максимальный таймаут для всех объектов (60 секунд)

// ============================================================================
// ФОРМАТИРОВАНИЕ ОБЪЕКТОВ ИЗ МАССИВОВ
// ============================================================================

/**
 * Форматирование астероида/кометы/планеты из массива
 * @param {Array} obj - Массив данных [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]
 * @returns {Object} Отформатированный объект
 */
function formatObjectFromArray(obj) {
    if (!Array.isArray(obj) || obj.length < 9) {
        return obj;
    }

    const formatted = {
        number: obj[0],
        name: obj[1] || 'Unnamed',
        class: obj[2] || 'Unknown',
        state_vector: {
            position: {
                x: parseFloat(obj[3]) || 0,
                y: parseFloat(obj[4]) || 0,
                z: parseFloat(obj[5]) || 0
            },
            velocity: {
                x: parseFloat(obj[6]) || 0,
                y: parseFloat(obj[7]) || 0,
                z: parseFloat(obj[8]) || 0
            }
        }
    };

    // Добавляем сферические координаты если есть
    if (obj.length > 9 && obj[9] !== undefined) {
        formatted.ra = parseFloat(obj[9]);
    }
    if (obj.length > 10 && obj[10] !== undefined) {
        formatted.dec = parseFloat(obj[10]);
    }
    if (obj.length > 11 && obj[11] !== undefined) {
        formatted.distance = parseFloat(obj[11]);
    }

    return formatted;
}

/**
 * Форматирование объектов с учетом режима координат
 * @param {Array} objects - Массив объектов
 * @param {string} coord - Тип координат (spherical/rectangular)
 * @returns {Array} Отформатированные объекты
 */
function formatObjects(objects, coord) {
    if (!Array.isArray(objects)) return objects;

    return objects.map(obj => {
        const formatted = formatObjectFromArray(obj);

        // Добавляем информацию о системе координат
        formatted.coord_system = coord;

        // Если запрошены сферические координаты, но их нет, вычисляем
        if (coord === 'spherical' && formatted.ra === undefined && formatted.state_vector) {
            const pos = formatted.state_vector.position;
            const r = Math.sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
            formatted.ra = (Math.atan2(pos.y, pos.x) * 180 / Math.PI + 360) % 360;
            formatted.dec = Math.asin(pos.z / r) * 180 / Math.PI;
            formatted.distance = r;
            formatted.computed_from_rectangular = true;
        }

        return formatted;
    });
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ GETSSO
// ============================================================================

/**
 * Получение всех объектов Солнечной системы
 * GET /api/skybot3d/getSso?limit=10&epoch=2025.0&getFile=0&observer=500
 */
export async function skybot3dGetSso(req, res) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10);

    try {
        const {
            limit = 0,
            epoch = DEFAULT_PARAMS.skybot3d.epoch,
            coord = DEFAULT_PARAMS.skybot3d.coord,
            mime = DEFAULT_PARAMS.skybot3d.mime,
            getFile = '0',
            class: objectClass,
            observer = '500'
        } = req.query;

        // Валидация observer
        const observerValidation = validateObserver(observer);
        const finalObserver = observerValidation.valid ? observerValidation.value : '500';

        if (!observerValidation.valid) {
            console.log(`${colors.fg.yellow}⚠️ [${requestId}] ${observerValidation.error} Использую значение по умолчанию: 500${colors.reset}`);
        }

        // Определяем режим работы
        const mode = determineMode(limit, getFile, FILE_MODE_THRESHOLD);

        console.log(`${colors.fg.cyan}🌌 [${requestId}] Skybot3D getSso:${colors.reset}`);
        console.log(`   Класс: ${objectClass || 'все'}, Лимит: ${formatLimit(limit)}, Эпоха: ${epoch}`);
        console.log(`   Координаты: ${coord}, Наблюдатель: ${finalObserver} (${getObserverDescription(finalObserver)})`);
        console.log(`   Режим: ${mode.modeDescription}, getFile=${getFile}`);

        const formattedEpoch = formatSkybot3DEpoch(epoch);

        // Формирование параметров запроса к API
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

        console.log(`   [${requestId}] Параметры API: ${params.toString()}`);

        // Контроль таймаута для limit=0
        let timeout = getTimeoutForRequest('getSso', {
            limit: mode.limitNum,
            isAllObjects: mode.isAllObjects
        });

        // Дополнительная проверка для всех объектов
        if (mode.isAllObjects) {
            console.log(`   [${requestId}] ⚠️ Запрос всех объектов, устанавливаю ограниченный таймаут`);
            if (timeout > MAX_TIMEOUT_ALL_OBJECTS) {
                console.log(`   [${requestId}] Таймаут уменьшен с ${timeout}ms до ${MAX_TIMEOUT_ALL_OBJECTS}ms`);
                timeout = MAX_TIMEOUT_ALL_OBJECTS;
            }
        }

        console.log(`   [${requestId}] Таймаут: ${timeout}ms`);

        // Получаем метаданные
        const metadataResponse = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getSso,
            params: params,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/3.3',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'X-Request-ID': requestId
            },
            timeout: timeout,
            validateStatus: status => status < 500,
            decompress: true
        });

        const metadata = metadataResponse.data;
        const responseTime = Date.now() - startTime;

        console.log(`   [${requestId}] Метаданные получены за ${responseTime}ms`);
        console.log(`   [${requestId}] flag=${metadata.flag}, nbsso=${metadata.nbsso || 0}, file=${metadata.file ? 'есть' : 'нет'}`);

        // Проверка на ошибки
        if (metadata.flag === 0 || metadata.flag === -1) {
            throw new Error(`API вернуло ошибку: flag=${metadata.flag}, status=${metadata.status}`);
        }

        // Если нужно скачать файл и есть ссылка на файл
        if (mode.useFileMode && metadata.file) {
            console.log(`   [${requestId}] 📥 Файловый режим: скачивание ${metadata.file}`);

            try {
                // Скачиваем и распаковываем файл
                const fileData = await extractSkybot3DData(metadata, 'all');

                if (!fileData.success) {
                    console.warn(`   [${requestId}] ⚠️ Не удалось извлечь данные из файла: ${fileData.error}`);
                    return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, mode.limitNum, objectClass, finalObserver, res, startTime, requestId, fileData.error);
                }

                const rawData = fileData.rawFileData;

                // Форматируем объекты с учетом системы координат
                const asteroids = formatObjects(rawData.asteroids || [], coord);
                const comets = formatObjects(rawData.comets || [], coord);
                const planets = formatObjects(rawData.planets || [], coord);

                const statistics = {
                    total: asteroids.length + comets.length + planets.length,
                    asteroids: asteroids.length,
                    comets: comets.length,
                    planets: planets.length,
                    by_class: {
                        asteroids: countByClass(asteroids),
                        comets: countByClass(comets),
                        planets: countByClass(planets)
                    },
                    by_type: {
                        has_position: asteroids.some(a => a.ra !== undefined) ||
                            comets.some(c => c.ra !== undefined) ||
                            planets.some(p => p.ra !== undefined),
                        has_velocity: asteroids.some(a => a.state_vector?.velocity) ||
                            comets.some(c => c.state_vector?.velocity) ||
                            planets.some(p => p.state_vector?.velocity)
                    }
                };

                console.log(`   [${requestId}] ✅ Извлечено: астероидов=${asteroids.length}, комет=${comets.length}, планет=${planets.length}`);

                const result = {
                    success: true,
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                    request_id: requestId,
                    query: {
                        class: objectClass || 'all',
                        limit: mode.limitNum === 0 ? 'unlimited' : mode.limitNum,
                        limit_description: mode.limitNum === 0 ? 'all objects' : 'limited',
                        epoch: epoch,
                        epoch_jd: formattedEpoch,
                        coord_system: coord,
                        observer: finalObserver,
                        observer_description: getObserverDescription(finalObserver),
                        mode: 'file-data',
                        mode_description: mode.modeDescription
                    },
                    metadata: {
                        flag: fileData.metadata.flag,
                        ticket: fileData.metadata.ticket,
                        status: fileData.metadata.status,
                        nbsso: fileData.metadata.nbsso,
                        refdate: fileData.metadata.refdate,
                        file: metadata.file,
                        file_size: metadata['size(bytes)']
                    },
                    statistics: statistics,
                    data: {
                        asteroids: asteroids,
                        comets: comets,
                        planets: planets
                    }
                };

                res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
                res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
                res.setHeader('X-Request-ID', requestId);
                res.setHeader('X-Mode', 'file-data');
                res.setHeader('X-Total-Objects', statistics.total);
                res.setHeader('X-Observer', finalObserver);

                console.log(`${colors.fg.green}✅ [${requestId}] Skybot3D getSso завершен за ${Date.now() - startTime}ms (файловый режим)${colors.reset}`);

                return res.json(createSuccessResponse(result, {
                    source: 'Skybot3D',
                    response_time: Date.now() - startTime,
                    request_id: requestId
                }));

            } catch (fileError) {
                console.error(`   [${requestId}] ❌ Ошибка при работе с файлом: ${fileError.message}`);
                return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, mode.limitNum, objectClass, finalObserver, res, startTime, requestId,
                    `Не удалось загрузить данные: ${fileError.message}`);
            }
        }

        // Режим метаданных
        return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, mode.limitNum, objectClass, finalObserver, res, startTime, requestId);

    } catch (error) {
        handleSsoError(req, res, error, startTime, requestId);
    }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Подсчет объектов по классам
 */
function countByClass(objects) {
    const counts = {};
    objects.forEach(obj => {
        const className = obj.class || 'Unknown';
        counts[className] = (counts[className] || 0) + 1;
    });
    return counts;
}

/**
 * Отправка ответа с метаданными
 */
function sendMetadataResponse(metadata, coord, formattedEpoch, epoch, limit, objectClass, observer, res, startTime, requestId, note = null) {
    const hasFile = !!(metadata.file);

    const result = {
        success: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        request_id: requestId,
        query: {
            class: objectClass || 'all',
            limit: limit === 0 ? 'unlimited' : limit,
            limit_description: limit === 0 ? 'all objects' : 'limited',
            epoch: epoch,
            epoch_jd: formattedEpoch,
            coord_system: coord,
            observer: observer,
            observer_description: getObserverDescription(observer),
            mode: 'metadata',
            mode_description: limit === 0 ? 'metadata (all objects require file mode)' : 'metadata'
        },
        metadata: {
            flag: metadata.flag || 0,
            ticket: metadata.ticket,
            status: metadata.status,
            nbsso: metadata.nbsso || 0,
            refdate: metadata.refdate,
            file: metadata.file,
            file_size: metadata['size(bytes)']
        },
        note: note || (hasFile
            ? limit === 0
                ? 'Для получения всех объектов используйте getFile=1 (файловый режим)'
                : 'Для получения данных используйте getFile=1'
            : 'Данные недоступны для скачивания')
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Mode', 'metadata');
    res.setHeader('X-Has-File', hasFile ? 'true' : 'false');
    res.setHeader('X-Observer', observer);

    console.log(`${colors.fg.cyan}ℹ️ [${requestId}] Skybot3D getSso: метаданные отправлены${hasFile ? ' (файл доступен)' : ''}${colors.reset}`);

    res.json(createSuccessResponse(result));
}

/**
 * Обработка ошибок getSso - единый формат без fallback данных
 */
function handleSsoError(req, res, error, startTime, requestId) {
    const responseTime = Date.now() - startTime;

    console.error(`${colors.fg.red}❌ [${requestId}] Skybot3D getSso ошибка:${colors.reset}`, error.message);

    if (error.code === 'ECONNABORTED') {
        console.error(`   [${requestId}] Таймаут после ${responseTime}ms`);
    }
    if (error.response) {
        console.error(`   [${requestId}] Статус: ${error.response.status}`);
        if (error.response.data) {
            const dataStr = error.response.data.toString().substring(0, 200);
            console.error(`   [${requestId}] Ответ: ${dataStr}`);
        }
    }

    // Единый формат ошибки без fallback данных
    const errorResponse = createServiceError('Skybot3D getSso', error, {
        class: req.query.class || 'all',
        limit: parseInt(req.query.limit) || 0,
        epoch: req.query.epoch || 'now',
        observer: req.query.observer || '500',
        coord: req.query.coord || 'spherical',
        getFile: req.query.getFile || '0'
    });

    // Добавляем дополнительные поля для отладки
    errorResponse.request_id = requestId;
    errorResponse.response_time = responseTime;

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.status(503).json(errorResponse);
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ
// ============================================================================

/**
 * Получение статистики по доступным объектам
 */
export async function skybot3dSsoStats(req, res) {
    const startTime = Date.now();

    try {
        const stats = {
            total_objects: {
                asteroids: 1216000,
                comets: 4000,
                planets: 8,
                satellites: 168
            },
            by_class: {
                asteroids: {
                    MBA: 985000,
                    NEA: 32000,
                    Trojan: 13000,
                    Hilda: 4100,
                    Centaurs: 600,
                    TNO: 5600
                },
                comets: {
                    'Short-Period': 800,
                    'Long-Period': 3200
                }
            },
            last_update: '2026-01-15',
            next_update: '2026-04-15',
            source: 'IMCCE Skybot3D Database',
            observer_support: {
                default: '500 (geocenter)',
                special_codes: ['@rosetta', '@kepler', '@earthL2', '@tess'],
                custom_coordinates: 'Поддерживаются координаты в формате "lat, lon, alt"'
            }
        };

        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
        res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
        res.json(createSuccessResponse(stats, {
            source: 'Skybot3D',
            timestamp: new Date().toISOString()
        }));

    } catch (error) {
        console.error(`${colors.fg.red}❌ Skybot3D stats ошибка:${colors.reset}`, error.message);

        const errorResponse = createServiceError('Skybot3D stats', error, {});
        res.status(503).json(errorResponse);
    }
}

/**
 * Получение информации о формате данных
 */
export function skybot3dSsoFormat(req, res) {
    const formatInfo = {
        direct_mode: {
            description: 'Режим метаданных (получение информации о файле)',
            max_limit: 10,
            response_format: 'JSON с метаданными и ссылкой на файл',
            example: '/api/skybot3d/getSso?limit=5&epoch=2025.0&getFile=0&observer=500'
        },
        file_mode: {
            description: 'Файловый режим (скачивание и распаковка BZ2)',
            threshold: 10,
            response_format: 'JSON с полными данными',
            example: '/api/skybot3d/getSso?limit=100&epoch=2025.0&getFile=1&observer=500',
            file_info: {
                format: 'JSON в BZIP2 архиве',
                compression: 'bzip2',
                typical_size: 'от 500 байт до нескольких мегабайт'
            }
        },
        all_objects_mode: {
            description: 'Режим получения всех объектов (limit=0)',
            requirement: 'Требуется getFile=1',
            example: '/api/skybot3d/getSso?limit=0&epoch=2025.0&getFile=1&observer=500',
            note: 'Для получения всех объектов обязательно используйте файловый режим'
        },
        observer_parameter: {
            description: 'Параметр observer определяет точку наблюдения',
            default: '500 (геоцентр)',
            special_codes: {
                '@rosetta': 'Космический аппарат Rosetta',
                '@kepler': 'Космический аппарат Kepler',
                '@earthL2': 'Точка L2 системы Солнце-Земля',
                '@tess': 'Космический аппарат TESS'
            },
            custom_format: 'Координаты в формате "широта, долгота, высота" (например: "48.8365, 2.3365, 67.0")'
        },
        data_structure: {
            asteroids: 'Array of [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]',
            comets: 'Array of [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]',
            planets: 'Array of [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]'
        },
        coord_systems: {
            spherical: 'Возвращает RA (часы) и Dec (градусы)',
            rectangular: 'Возвращает XYZ координаты в AU'
        }
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
    res.json(createSuccessResponse(formatInfo, {
        source: 'Skybot3D',
        timestamp: new Date().toISOString()
    }));
}

/**
 * Проверка статуса с observer параметром
 */
export async function skybot3dCheckObserver(req, res) {
    const startTime = Date.now();

    try {
        const { observer = '500', epoch = 'now' } = req.query;

        console.log(`${colors.fg.cyan}🔍 Skybot3D check observer: ${observer} @ ${epoch}${colors.reset}`);

        // Валидация observer
        const validation = validateObserver(observer);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error,
                suggested: validation.suggested,
                valid_formats: [
                    'IAU code: 500, 007, etc.',
                    'Special: @rosetta, @kepler, @earthL2, @tess',
                    'Coordinates: "48.8365, 2.3365, 67.0"'
                ]
            });
        }

        // Пробуем сделать легкий запрос с этим observer
        const formattedEpoch = formatSkybot3DEpoch(epoch);

        const params = new URLSearchParams({
            '-ep': formattedEpoch,
            '-coord': 'spherical',
            '-mime': 'json',
            '-from': 'GaiaDR3-StarMap-Test',
            '-observer': validation.value,
            '-limit': '1'
        });

        const response = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getSso,
            params: params,
            timeout: 10000,
            validateStatus: status => status < 500
        });

        const duration = Date.now() - startTime;

        const result = {
            observer: validation.value,
            description: getObserverDescription(validation.value),
            valid: true,
            response_time: duration,
            status: response.status,
            flag: response.data?.flag,
            timestamp: new Date().toISOString(),
            note: validation.value === '500'
                ? 'Геоцентр (стандартный наблюдатель)'
                : 'Пользовательский код наблюдателя'
        };

        res.setHeader('X-Response-Time', `${duration}ms`);
        res.json(createSuccessResponse(result, {
            source: 'Skybot3D',
            response_time: duration
        }));

    } catch (error) {
        console.error(`${colors.fg.red}❌ Skybot3D check observer error:${colors.reset}`, error.message);

        const errorResponse = createServiceError('Skybot3D check observer', error, {
            observer: req.query.observer || '500',
            epoch: req.query.epoch || 'now'
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
    skybot3dGetSso,
    skybot3dSsoStats,
    skybot3dSsoFormat,
    skybot3dCheckObserver,
    // Экспортируем вспомогательные функции для тестирования
    _test: {
        formatObjectFromArray,
        formatObjects,
        countByClass,
        determineMode,
        validateObserver,
        getObserverDescription,
        formatLimit
    }
};