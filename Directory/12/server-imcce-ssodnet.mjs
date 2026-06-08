// /10/map/server-imcce-ssodnet.mjs - SsODNet API (Quaero, DataCloud, ssoCard)
// ВЕРСИЯ 2.0 - БЕЗ FALLBACK ДАННЫХ, ЕДИНЫЙ ОБРАБОТЧИК ОШИБОК

import axios from 'axios';
import { IMCCE_CONFIG, DEFAULT_PARAMS, CACHE_TTL, OBJECT_TYPES } from './server-imcce-config.mjs';
import {
    colors, formatNumber, cleanObjectId,
    createSuccessResponse, createServiceError,
    toNumber
} from './server-imcce-utils.mjs';

// ============================================================================
// 1. SsODNet QUAERO - ПОИСК ОБЪЕКТОВ ПО ИМЕНИ
// ============================================================================

/**
 * Поиск объектов в SsODNet Quaero
 * GET /api/ssodnet/quaero?q=Pluto&type=Planet&limit=10
 */
export async function quaeroSearch(req, res) {
    try {
        const { q, type, limit = DEFAULT_PARAMS.quaero.limit, offset = 0 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required',
                example: '/api/ssodnet/quaero?q=Ceres&limit=5'
            });
        }

        console.log(`${colors.fg.cyan}🔍 SsODNet Quaero search: "${q}"${type ? ` [type: ${type}]` : ''}${colors.reset}`);

        // Формируем URL для поиска
        const searchParams = new URLSearchParams({
            q: q,
            limit: limit.toString(),
            offset: offset.toString()
        });

        if (type) {
            searchParams.append('type', type);
        }

        const searchUrl = `${IMCCE_CONFIG.ssodnet.search}?${searchParams.toString()}`;

        const response = await axios({
            method: 'GET',
            url: searchUrl,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/1.0',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        // Кэширование
        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.QUAERO / 1000}`);

        // Форматируем результаты
        let results = [];
        if (Array.isArray(response.data)) {
            results = response.data;
        } else if (response.data?.results) {
            results = response.data.results;
        } else if (response.data?.data) {
            results = response.data.data;
        }

        const formattedResults = results.map(item => ({
            id: item.id || item.sso_id,
            name: item.name || item.sso_name,
            type: item.type || item.sso_type,
            class: item.class || item.sso_class,
            aliases: item.aliases || [],
            system: item.system,
            parent: item.parent,
            ephemeris: item.ephemeris || false,
            confidence: item.confidence || 1.0,
            match_type: item.match_type || 'exact',
            links: {
                self: item.id ? `${IMCCE_CONFIG.ssodnet.quaero}/sso/${item.id}` : null,
                ssocard: item.id ? `${IMCCE_CONFIG.ssodnet.ssocard}/${item.id}` : null
            }
        }));

        const response_data = {
            query: q,
            count: formattedResults.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            data: formattedResults
        };

        res.json(createSuccessResponse(response_data));

    } catch (error) {
        console.error(`${colors.fg.red}❌ SsODNet Quaero error:${colors.reset}`, error.message);

        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
        }

        // Единый формат ошибки - без fallback данных
        const errorResponse = createServiceError('SsODNet Quaero', error, {
            query: req.query.q,
            type: req.query.type,
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// 2. SsODNet DATACLOUD - ФИЗИЧЕСКИЕ ПАРАМЕТРЫ
// ============================================================================

/**
 * Получение физических данных объекта
 * GET /api/ssodnet/datacloud?name=Ceres
 */
export async function dataCloud(req, res) {
    try {
        const { name, resource = 'all' } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Parameter "name" is required'
            });
        }

        console.log(`${colors.fg.cyan}📡 SsODNet DataCloud: ${name} [resource: ${resource}]${colors.reset}`);

        // Очищаем имя от префиксов
        const cleanName = cleanObjectId(name);

        console.log(`   Обращение к SsODNet API для: ${cleanName}`);

        // Запрашиваем данные объекта
        const response = await axios({
            method: 'GET',
            url: `${IMCCE_CONFIG.ssodnet.quaero}/sso/${encodeURIComponent(cleanName)}`,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/1.0',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        const objectInfo = response.data;

        console.log(`   ✅ Найден объект: ${objectInfo.name || cleanName} (${objectInfo.type || 'unknown'})`);

        // Кэширование
        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.DATACLOUD / 1000}`);

        // Формируем расширенный ответ
        const formattedData = {
            name: objectInfo.name || cleanName,
            identifier: objectInfo.id || cleanName,
            type: objectInfo.type || OBJECT_TYPES.UNKNOWN,
            class: objectInfo.class || 'Unknown',
            physical_parameters: {
                diameter: objectInfo.diameter ? {
                    value: objectInfo.diameter,
                    unit: 'km',
                    error: objectInfo.diameter_error
                } : null,
                mass: objectInfo.mass ? {
                    value: objectInfo.mass,
                    unit: 'kg',
                    error: objectInfo.mass_error
                } : null,
                density: objectInfo.density ? {
                    value: objectInfo.density,
                    unit: 'g/cm³',
                    error: objectInfo.density_error
                } : null,
                albedo: objectInfo.albedo ? {
                    value: objectInfo.albedo,
                    unit: 'geometric',
                    error: objectInfo.albedo_error
                } : null,
                temperature: objectInfo.temperature ? {
                    value: objectInfo.temperature,
                    unit: 'K',
                    error: objectInfo.temperature_error
                } : null,
                magnitude: objectInfo.magnitude ? {
                    value: objectInfo.magnitude,
                    band: 'V',
                    unit: 'mag',
                    error: objectInfo.magnitude_error
                } : null
            },
            orbital_parameters: objectInfo.orbital_elements ? {
                semimajor_axis: {
                    value: objectInfo.orbital_elements.semi_major_axis,
                    unit: 'AU',
                    error: objectInfo.orbital_elements.semi_major_axis_error
                },
                eccentricity: {
                    value: objectInfo.orbital_elements.eccentricity,
                    error: objectInfo.orbital_elements.eccentricity_error
                },
                inclination: {
                    value: objectInfo.orbital_elements.inclination,
                    unit: 'deg',
                    error: objectInfo.orbital_elements.inclination_error
                },
                orbital_period: {
                    value: objectInfo.orbital_elements.orbital_period,
                    unit: 'years',
                    error: objectInfo.orbital_elements.orbital_period_error
                }
            } : {},
            taxonomy: {
                spectral_type: objectInfo.taxonomy?.class || 'Unknown',
                class: objectInfo.type || OBJECT_TYPES.UNKNOWN,
                description: objectInfo.taxonomy?.description
            },
            links: {
                self: `${IMCCE_CONFIG.ssodnet.quaero}/sso/${cleanName}`,
                ssocard: `${IMCCE_CONFIG.ssodnet.ssocard}/${cleanName}`
            }
        };

        res.json(createSuccessResponse(formattedData, { name }));

    } catch (error) {
        console.error(`${colors.fg.red}❌ SsODNet DataCloud error:${colors.reset}`, error.message);

        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
            if (error.response.data) {
                console.error(`   Данные:`, error.response.data);
            }
        }

        // Единый формат ошибки - без fallback данных
        const errorResponse = createServiceError('SsODNet DataCloud', error, {
            name: req.query.name,
            resource: req.query.resource || 'all'
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// 3. SsODNet SSOCARD - BEST ESTIMATES
// ============================================================================

/**
 * Получение ssoCard (best estimates) для объекта
 * GET /api/ssodnet/ssocard/:id
 */
export async function ssoCard(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Parameter "id" is required'
            });
        }

        console.log(`${colors.fg.cyan}📇 SsODNet ssoCard запрос: ${id}${colors.reset}`);

        const response = await axios({
            method: 'GET',
            url: `${IMCCE_CONFIG.ssodnet.ssocard}/${encodeURIComponent(id)}`,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/1.0',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.SSOCARD / 1000}`);

        // Форматируем ответ ssoCard
        const cardData = response.data;

        const formattedData = {
            id: id,
            name: cardData.name || cardData.sso_name,
            number: cardData.number || cardData.sso_number,
            type: cardData.type || cardData.sso_type,
            class: cardData.class || cardData.sso_class,
            parameters: {
                physical: extractPhysicalParameters(cardData),
                orbital: extractOrbitalParameters(cardData),
                rotational: extractRotationalParameters(cardData)
            },
            metadata: {
                source: cardData.source || 'IMCCE SsODNet',
                reference: cardData.reference,
                last_update: cardData.last_update
            }
        };

        res.json(createSuccessResponse(formattedData, { id }));

    } catch (error) {
        console.error(`${colors.fg.red}❌ SsODNet ssoCard error:${colors.reset}`, error.message);

        // Единый формат ошибки - без fallback данных
        const errorResponse = createServiceError('SsODNet ssoCard', error, {
            id: req.params.id
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// 4. ПАКЕТНЫЙ ЗАПРОС
// ============================================================================

/**
 * Пакетный запрос для нескольких объектов
 * POST /api/ssodnet/batch
 */
export async function batchRequest(req, res) {
    try {
        const { names, resource = 'basic' } = req.body;

        if (!names || !Array.isArray(names)) {
            return res.status(400).json({
                success: false,
                error: 'Array "names" is required',
                example: { names: ['Mars', 'Venus', 'Ceres'] }
            });
        }

        if (names.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Too many names. Maximum is 50',
                received: names.length
            });
        }

        console.log(`${colors.fg.cyan}📦 Batch request for ${names.length} objects [resource: ${resource}]${colors.reset}`);

        const batchSize = 5;
        const results = {};
        const errors = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const batch = names.slice(i, i + batchSize);
            console.log(`  Processing batch ${i/batchSize + 1}/${Math.ceil(names.length/batchSize)}`);

            const promises = batch.map(async (name) => {
                try {
                    const cleanName = cleanObjectId(name);

                    const response = await axios({
                        method: 'GET',
                        url: `${IMCCE_CONFIG.ssodnet.quaero}/sso/${encodeURIComponent(cleanName)}`,
                        timeout: 5000
                    });

                    results[name] = {
                        success: true,
                        data: response.data
                    };
                } catch (e) {
                    errors.push({ name, error: e.message });
                    results[name] = {
                        success: false,
                        error: e.message
                    };
                }
            });

            await Promise.all(promises);

            // Небольшая задержка между батчами
            if (i + batchSize < names.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            total: names.length,
            successful: names.length - errors.length,
            failed: errors.length,
            errors: errors,
            results: results,
            resource: resource
        });

    } catch (error) {
        console.error(`${colors.fg.red}❌ Batch error:${colors.reset}`, error.message);

        const errorResponse = createServiceError('SsODNet Batch', error, {
            names_count: req.body?.names?.length || 0
        });

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// 5. ПОЛУЧЕНИЕ МЕТАДАННЫХ КАТАЛОГА
// ============================================================================

/**
 * Получение метаданных каталога SsODNet
 * GET /api/ssodnet/metadata
 */
export async function getMetadata(req, res) {
    try {
        console.log(`${colors.fg.cyan}📋 SsODNet metadata request${colors.reset}`);

        const metadata = {
            name: 'SsODNet - Solar System Object Database Network',
            version: '1.0',
            provider: 'IMCCE - Institut de Mécanique Céleste et de Calcul des Éphémérides',
            description: 'Comprehensive database of Solar System objects with physical and dynamical parameters',
            release_date: '2024',
            stats: {
                total_objects: '~1.2 million',
                asteroids: '~1.2 million',
                comets: '~4000',
                planets: 8,
                dwarf_planets: 5,
                satellites: '~500'
            },
            services: {
                quaero: {
                    description: 'Search service',
                    endpoint: '/api/ssodnet/quaero',
                    parameters: ['q', 'type', 'limit', 'offset']
                },
                datacloud: {
                    description: 'Physical and dynamical data',
                    endpoint: '/api/ssodnet/datacloud',
                    parameters: ['name', 'resource']
                },
                ssocard: {
                    description: 'Best estimates',
                    endpoint: '/api/ssodnet/ssocard/:id'
                },
                bft: {
                    description: 'Broad and Flat Table',
                    endpoints: {
                        info: '/api/ssodnet/bft/info',
                        fields: '/api/ssodnet/bft/fields',
                        download: '/api/ssodnet/bft/download'
                    }
                }
            },
            citation: 'Berthier et al., 2023, Astronomy & Astrophysics',
            documentation: 'https://ssp.imcce.fr/webservices/ssodnet/'
        };

        res.json(createSuccessResponse(metadata));

    } catch (error) {
        console.error(`${colors.fg.red}❌ Metadata error:${colors.reset}`, error.message);

        const errorResponse = createServiceError('SsODNet Metadata', error);

        res.status(503).json(errorResponse);
    }
}

// ============================================================================
// 6. ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ТИПАХ ОБЪЕКТОВ
// ============================================================================

/**
 * Получение списка типов объектов
 * GET /api/ssodnet/types
 */
export function getObjectTypes(req, res) {
    const types = [
        {
            id: 'Planet',
            name: 'Planet',
            description: 'Major planets of the Solar System',
            prefix: 'p:',
            examples: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
        },
        {
            id: 'Dwarf Planet',
            name: 'Dwarf Planet',
            description: 'Dwarf planets as defined by IAU',
            prefix: 'd:',
            examples: ['Ceres', 'Pluto', 'Haumea', 'Makemake', 'Eris']
        },
        {
            id: 'Asteroid',
            name: 'Asteroid',
            description: 'Small Solar System bodies in asteroid belt and beyond',
            prefix: 'a:',
            classes: ['MBA', 'NEA', 'Trojan', 'Hilda', 'Centaurs', 'TNO'],
            examples: ['Vesta', 'Pallas', 'Eros', 'Apophis']
        },
        {
            id: 'Comet',
            name: 'Comet',
            description: 'Icy small Solar System bodies',
            prefix: 'c:',
            classes: ['Short-Period', 'Long-Period', 'Halley-Type'],
            examples: ['1P/Halley', '2P/Encke', '67P/Churyumov-Gerasimenko']
        },
        {
            id: 'Satellite',
            name: 'Satellite',
            description: 'Natural satellites of planets and dwarf planets',
            prefix: 's:',
            examples: ['Moon', 'Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto']
        }
    ];

    res.json(createSuccessResponse(types));
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Поиск объекта и получение первого результата
 */
async function searchAndGetFirst(name) {
    const cleanName = cleanObjectId(name);

    const searchResponse = await axios({
        method: 'GET',
        url: IMCCE_CONFIG.ssodnet.search,
        params: {
            q: cleanName,
            limit: 1
        },
        timeout: 5000
    });

    if (searchResponse.data && searchResponse.data.length > 0) {
        const found = searchResponse.data[0];
        console.log(`   ✅ Найдено через поиск: ${found.name || found.id}`);

        return {
            name: found.name || found.id,
            identifier: found.id,
            type: found.type || OBJECT_TYPES.UNKNOWN,
            class: found.class || 'Unknown',
            physical_parameters: {},
            orbital_parameters: {},
            taxonomy: {
                spectral_type: 'Unknown',
                class: found.type || OBJECT_TYPES.UNKNOWN
            },
            links: {
                self: found.id ? `${IMCCE_CONFIG.ssodnet.quaero}/sso/${found.id}` : null
            }
        };
    }
    return null;
}

/**
 * Извлечение физических параметров из ssoCard
 */
function extractPhysicalParameters(data) {
    const physical = {};

    if (data.diameter) {
        physical.diameter = {
            value: data.diameter.value,
            unit: data.diameter.unit || 'km',
            error: data.diameter.error,
            method: data.diameter.method
        };
    }

    if (data.mass) {
        physical.mass = {
            value: data.mass.value,
            unit: data.mass.unit || 'kg',
            error: data.mass.error,
            method: data.mass.method
        };
    }

    if (data.density) {
        physical.density = {
            value: data.density.value,
            unit: data.density.unit || 'g/cm³',
            error: data.density.error,
            method: data.density.method
        };
    }

    if (data.albedo) {
        physical.albedo = {
            value: data.albedo.value,
            unit: data.albedo.unit || 'geometric',
            error: data.albedo.error,
            band: data.albedo.band
        };
    }

    if (data.magnitude) {
        physical.magnitude = {
            value: data.magnitude.value,
            band: data.magnitude.band || 'V',
            unit: 'mag',
            error: data.magnitude.error
        };
    }

    if (data.taxonomy) {
        physical.taxonomy = {
            class: data.taxonomy.class,
            complex: data.taxonomy.complex,
            reference: data.taxonomy.reference
        };
    }

    return physical;
}

/**
 * Извлечение орбитальных параметров из ssoCard
 */
function extractOrbitalParameters(data) {
    const orbital = {};

    if (data.orbital_elements) {
        const oe = data.orbital_elements;

        orbital.epoch = {
            value: oe.epoch,
            unit: 'JD',
            format: 'TDB'
        };

        orbital.semimajor_axis = {
            value: oe.semi_major_axis,
            unit: 'AU',
            error: oe.semi_major_axis_error
        };

        orbital.eccentricity = {
            value: oe.eccentricity,
            error: oe.eccentricity_error
        };

        orbital.inclination = {
            value: oe.inclination,
            unit: 'deg',
            error: oe.inclination_error
        };

        orbital.ascending_node = {
            value: oe.ascending_node,
            unit: 'deg',
            error: oe.ascending_node_error
        };

        orbital.perihelion_argument = {
            value: oe.perihelion_argument,
            unit: 'deg',
            error: oe.perihelion_argument_error
        };

        orbital.mean_anomaly = {
            value: oe.mean_anomaly,
            unit: 'deg',
            error: oe.mean_anomaly_error
        };

        orbital.period = {
            value: oe.orbital_period,
            unit: 'years',
            error: oe.orbital_period_error
        };
    }

    if (data.proper_elements) {
        orbital.proper_elements = {
            semimajor_axis: data.proper_elements.semi_major_axis,
            eccentricity: data.proper_elements.eccentricity,
            inclination: data.proper_elements.inclination
        };
    }

    return orbital;
}

/**
 * Извлечение ротационных параметров из ssoCard
 */
function extractRotationalParameters(data) {
    const rotational = {};

    if (data.rotation) {
        rotational.period = {
            value: data.rotation.period,
            unit: 'hours',
            error: data.rotation.period_error
        };

        rotational.axis = {
            ra: data.rotation.pole_ra,
            dec: data.rotation.pole_dec,
            error: data.rotation.pole_error
        };

        rotational.amplitude = data.rotation.amplitude;
        rotational.quality = data.rotation.quality;
    }

    return rotational;
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export default {
    quaeroSearch,
    dataCloud,
    ssoCard,
    batchRequest,
    getMetadata,
    getObjectTypes
};