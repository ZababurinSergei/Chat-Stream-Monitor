// /10/map/server-imcce-skybot3d-planet.mjs - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ВЕРСИЯ 3.3 - Удалены fallback данные, добавлена единая ошибка

import axios from 'axios';
import { IMCCE_CONFIG, DEFAULT_PARAMS, CACHE_TTL, OBSERVER_CONFIG } from './server-imcce-config.mjs';
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

const FILE_MODE_CONFIG = {
    AUTO_DOWNLOAD_THRESHOLD: 10,
    MAX_DIRECT_LIMIT: 5,
    FILE_DOWNLOAD_TIMEOUT: 60000,
    MAX_FILE_SIZE: 100 * 1024 * 1024
};

// ============================================================================
// ФОРМАТИРОВАНИЕ ПЛАНЕТ ИЗ МАССИВА
// ============================================================================

/**
 * Форматирование планеты из массива данных
 * @param {Array} planet - Массив данных планеты [number, name, class, x, y, z, vx, vy, vz, ra?, dec?, dist?]
 * @returns {Object} Отформатированная планета
 */
function formatPlanetFromArray(planet) {
    if (!Array.isArray(planet) || planet.length < 9) {
        return planet;
    }

    const formatted = {
        number: planet[0],
        name: planet[1] || 'Unnamed',
        class: planet[2] || 'Unknown',
        type: 'planet',
        state_vector: {
            position: {
                x: parseFloat(planet[3]) || 0,
                y: parseFloat(planet[4]) || 0,
                z: parseFloat(planet[5]) || 0
            },
            velocity: {
                x: parseFloat(planet[6]) || 0,
                y: parseFloat(planet[7]) || 0,
                z: parseFloat(planet[8]) || 0
            }
        }
    };

    if (planet.length > 9 && planet[9] !== undefined) {
        formatted.ra = parseFloat(planet[9]);
    }
    if (planet.length > 10 && planet[10] !== undefined) {
        formatted.dec = parseFloat(planet[10]);
    }
    if (planet.length > 11 && planet[11] !== undefined) {
        formatted.distance = parseFloat(planet[11]);
    }

    return formatted;
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ GETPLANET
// ============================================================================

/**
 * Получение векторов планет с поддержкой файлового режима
 * GET /api/skybot3d/getPlanet?epoch=2025.0&coord=spherical&getFile=0&observer=500
 */
export async function skybot3dGetPlanet(req, res) {
    const startTime = Date.now();

    try {
        let {
            epoch = DEFAULT_PARAMS.skybot3d.epoch,
            coord = DEFAULT_PARAMS.skybot3d.coord,
            mime = DEFAULT_PARAMS.skybot3d.mime,
            getFile = '0',
            class: objectClass,
            limit = 0,
            observer = '500'
        } = req.query;

        // Устанавливаем класс по умолчанию
        if (!objectClass || objectClass === '') {
            objectClass = 'planets';
            console.log(`   Установлен класс по умолчанию: planets`);
        }

        // Валидация observer
        const observerValidation = validateObserver(observer);
        const finalObserver = observerValidation.valid ? observerValidation.value : OBSERVER_CONFIG.default;

        if (!observerValidation.valid) {
            console.log(`${colors.fg.yellow}⚠️ ${observerValidation.error} Использую значение по умолчанию: ${OBSERVER_CONFIG.default}${colors.reset}`);
        }

        // Определяем режим работы на основе лимита
        const mode = determineMode(limit, getFile, FILE_MODE_CONFIG.AUTO_DOWNLOAD_THRESHOLD);

        // Для режима метаданных устанавливаем лимит по умолчанию
        let effectiveLimit = mode.limitNum;
        if (!mode.useFileMode && effectiveLimit === 0) {
            effectiveLimit = 8;
            console.log(`   Установлен лимит по умолчанию: ${effectiveLimit} (все планеты)`);
        }

        const formattedEpoch = formatSkybot3DEpoch(epoch);

        console.log(`${colors.fg.cyan}🪐 Skybot3D getPlanet:${colors.reset}`);
        console.log(`   Эпоха: ${epoch} -> JD: ${formattedEpoch}`);
        console.log(`   Координаты: ${coord}, Лимит: ${effectiveLimit === 0 ? 'все объекты' : effectiveLimit}`);
        console.log(`   Класс: ${objectClass}`);
        console.log(`   Режим: ${mode.modeDescription}, getFile=${getFile}`);
        console.log(`   Наблюдатель: ${finalObserver} (${getObserverDescription(finalObserver)})`);

        // Формирование параметров запроса
        const params = new URLSearchParams({
            '-ep': formattedEpoch,
            '-coord': coord,
            '-mime': 'json',
            '-from': DEFAULT_PARAMS.skybot3d.from,
            '-observer': finalObserver,
            '-class': objectClass
        });

        if (effectiveLimit > 0) {
            params.append('-limit', effectiveLimit.toString());
        }

        console.log(`   Параметры API: ${params.toString()}`);

        const timeout = getTimeoutForRequest('getPlanet', {
            limit: effectiveLimit,
            isAllObjects: effectiveLimit === 0
        });

        // Получаем метаданные
        const metadataResponse = await axios({
            method: 'GET',
            url: IMCCE_CONFIG.skybot3d.getPlanet,
            params: params,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/3.3',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            timeout: timeout,
            validateStatus: status => status < 500,
            maxRedirects: 5,
            decompress: true
        });

        const metadata = metadataResponse.data;
        const responseTime = Date.now() - startTime;

        console.log(`   Метаданные получены за ${responseTime}ms`);
        console.log(`   flag=${metadata.flag}, nbsso=${metadata.nbsso || 0}, file=${metadata.file ? 'есть' : 'нет'}`);

        // Проверка на ошибки
        if (metadata.flag === 0 || metadata.flag === -1) {
            throw new Error(`API вернуло ошибку: flag=${metadata.flag}, status=${metadata.status}`);
        }

        // Если нужно скачать файл и есть ссылка на файл
        if (mode.useFileMode && metadata.file) {
            console.log(`   📥 Файловый режим: скачивание ${metadata.file}`);

            try {
                const extracted = await extractSkybot3DData(metadata, 'planets');

                if (!extracted.success) {
                    console.warn(`   ⚠️ Не удалось извлечь данные из файла: ${extracted.error}`);
                    return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, effectiveLimit, objectClass, finalObserver, res, startTime, extracted.error);
                }

                const planets = (extracted.data || []).map(planet => formatPlanetFromArray(planet));

                console.log(`   ✅ Извлечено планет: ${planets.length}`);

                const result = {
                    success: true,
                    timestamp: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                    data: {
                        flag: extracted.metadata.flag,
                        ticket: extracted.metadata.ticket,
                        status: extracted.metadata.status,
                        nbsso: extracted.metadata.nbsso,
                        refdate: extracted.metadata.refdate,
                        epoch: epoch,
                        epoch_jd: formattedEpoch,
                        observer: finalObserver,
                        observer_description: getObserverDescription(finalObserver),
                        coord_system: coord,
                        limit: effectiveLimit === 0 ? 'unlimited' : effectiveLimit,
                        limit_description: effectiveLimit === 0 ? 'all objects' : 'limited',
                        class: objectClass,
                        count: planets.length,
                        planets: planets,
                        file: metadata.file,
                        size: metadata['size(bytes)'],
                        mode: 'file-data',
                        mode_description: mode.modeDescription,
                        source: 'Skybot3D API (file)'
                    }
                };

                res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
                res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
                res.setHeader('X-Mode', 'file-data');
                res.setHeader('X-Observer', finalObserver);
                return res.json(result);

            } catch (fileError) {
                console.error(`   ❌ Ошибка при работе с файлом: ${fileError.message}`);
                return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, effectiveLimit, objectClass, finalObserver, res, startTime,
                    `Не удалось загрузить данные: ${fileError.message}. Используйте прямую ссылку на файл.`);
            }
        }

        return sendMetadataResponse(metadata, coord, formattedEpoch, epoch, effectiveLimit, objectClass, finalObserver, res, startTime);

    } catch (error) {
        handlePlanetError(req, res, error, startTime);
    }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Отправка ответа с метаданными
 */
function sendMetadataResponse(metadata, coord, formattedEpoch, epoch, limit, objectClass, observer, res, startTime, note = null) {
    const hasFile = !!(metadata.file);
    const limitNum = parseInt(limit) || 0;

    const result = {
        success: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        data: {
            flag: metadata.flag || 0,
            ticket: metadata.ticket,
            status: metadata.status,
            nbsso: metadata.nbsso,
            refdate: metadata.refdate,
            file: metadata.file,
            size: metadata['size(bytes)'],
            epoch: epoch,
            epoch_jd: formattedEpoch,
            observer: observer,
            observer_description: getObserverDescription(observer),
            coord_system: coord,
            limit: limitNum === 0 ? 'unlimited' : limitNum,
            limit_description: limitNum === 0 ? 'all objects' : 'limited',
            class: objectClass || 'all',
            mode: 'metadata',
            mode_description: 'metadata only',
            note: note || (hasFile
                ? 'Для получения данных используйте getFile=1'
                : 'Данные недоступны для скачивания')
        }
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SKYBOT3D / 1000}`);
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Mode', 'metadata');
    res.setHeader('X-Has-File', hasFile ? 'true' : 'false');
    res.setHeader('X-Observer', observer);

    res.json(result);
}

/**
 * Обработка ошибок getPlanet - единый формат ошибки
 */
function handlePlanetError(req, res, error, startTime) {
    const responseTime = Date.now() - startTime;

    console.error(`${colors.fg.red}❌ Skybot3D getPlanet ошибка:${colors.reset}`, error.message);

    if (error.code === 'ECONNABORTED') {
        console.error(`   Таймаут - сервер отвечает медленно`);
    }
    if (error.response) {
        console.error(`   Статус: ${error.response.status}`);
        if (error.response.data) {
            const dataStr = error.response.data.toString().substring(0, 200);
            console.error(`   Ответ: ${dataStr}`);
        }
    }

    const serviceError = createServiceError('Skybot3D getPlanet', error, {
        class: req.query.class || 'planets',
        limit: parseInt(req.query.limit) || 0,
        epoch: req.query.epoch || 'now',
        epoch_jd: formatSkybot3DEpoch(req.query.epoch || 'now'),
        observer: req.query.observer || '500',
        coord: req.query.coord || 'spherical',
        getFile: req.query.getFile || '0'
    });

    res.status(503).json(serviceError);
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ
// ============================================================================

/**
 * Получение информации о файловом режиме
 * GET /api/skybot3d/fileinfo
 */
export function skybot3dFileInfo(req, res) {
    const info = {
        file_mode: {
            enabled: true,
            auto_threshold: FILE_MODE_CONFIG.AUTO_DOWNLOAD_THRESHOLD,
            max_direct_limit: FILE_MODE_CONFIG.MAX_DIRECT_LIMIT,
            supported_compression: ['bz2', 'gz', 'br'],
            max_file_size: FILE_MODE_CONFIG.MAX_FILE_SIZE,
            timeout: FILE_MODE_CONFIG.FILE_DOWNLOAD_TIMEOUT
        },
        observer_codes: {
            default: OBSERVER_CONFIG.default,
            special: Object.keys(OBSERVER_CONFIG.special).map(code => ({
                code,
                description: OBSERVER_CONFIG.special[code]
            })),
            iau: Object.keys(OBSERVER_CONFIG.iau_codes).slice(0, 5).map(code => ({
                code,
                description: OBSERVER_CONFIG.iau_codes[code]
            }))
        },
        recommendations: {
            small_requests: `Используйте limit ≤ ${FILE_MODE_CONFIG.MAX_DIRECT_LIMIT} для прямых запросов`,
            large_requests: `Для limit > ${FILE_MODE_CONFIG.MAX_DIRECT_LIMIT} используйте getFile=1`,
            all_objects: 'Для получения всех объектов используйте limit=0 (автоматически включает файловый режим)',
            best_practice: 'Для production рекомендуется использовать файловый режим с кэшированием'
        },
        examples: {
            metadata: '/api/skybot3d/getPlanet?epoch=2025.0&getFile=0',
            file_download: '/api/skybot3d/getPlanet?epoch=2025.0&getFile=1&limit=20',
            auto: '/api/skybot3d/getPlanet?epoch=2025.0&limit=15',
            all_objects: '/api/skybot3d/getPlanet?epoch=2025.0&limit=0&getFile=1',
            with_observer: '/api/skybot3d/getPlanet?epoch=2025.0&observer=007&limit=10'
        }
    };

    res.json(createSuccessResponse(info));
}

/**
 * Получение информации о доступных кодах наблюдателей
 * GET /api/skybot3d/observers
 */
export function skybot3dObservers(req, res) {
    const observers = {
        default: OBSERVER_CONFIG.default,
        special: Object.entries(OBSERVER_CONFIG.special).map(([code, description]) => ({
            code,
            description,
            example: code.startsWith('@') ? code : `@${code}`
        })),
        iau: Object.entries(OBSERVER_CONFIG.iau_codes).map(([code, description]) => ({
            code,
            description,
            example: code
        })),
        format_explanation: {
            iau_code: 'Трехзначный код обсерватории (например, 500 для геоцентра)',
            special_code: 'Специальные коды: @rosetta, @kepler, @tess, @sun, @earthl2',
            coordinates: 'Координаты в формате "lat, lon, alt" (например, "48.8365, 2.3365, 67.0")'
        }
    };

    res.json(createSuccessResponse(observers));
}

/**
 * Принудительная очистка кэша файлов
 * POST /api/skybot3d/clearcache
 */
export function skybot3dClearCache(req, res) {
    console.log(`${colors.fg.yellow}🧹 Очистка кэша Skybot3D${colors.reset}`);
    res.json(createSuccessResponse({
        message: 'Кэш очищен',
        timestamp: new Date().toISOString()
    }));
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
    skybot3dGetPlanet,
    skybot3dFileInfo,
    skybot3dObservers,
    skybot3dClearCache,

    _test: {
        formatPlanetFromArray,
        sendMetadataResponse,
        determineMode,
        validateObserver
    }
};