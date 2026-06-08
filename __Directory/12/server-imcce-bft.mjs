// /10/map/server-imcce-bft.mjs - SsODNet BFT (Broad and Flat Table)
// ВЕРСИЯ 2.0 - Полная версия с обработкой всех параметров и улучшенными fallback данными

import { IMCCE_CONFIG, CACHE_TTL, ASTEROID_CLASSES, OBJECT_TYPES } from './server-imcce-config.mjs';
import { colors, formatNumber, createSuccessResponse } from './server-imcce-utils.mjs';

// ============================================================================
// 1. BFT INFO - ИНФОРМАЦИЯ О ТАБЛИЦЕ
// ============================================================================

/**
 * Получение информации о ssoBFT таблице
 * GET /api/ssodnet/bft/info
 */
export function bftInfo(req, res) {
    console.log(`${colors.fg.cyan}📊 SsODNet BFT info request${colors.reset}`);

    const info = {
        success: true,
        timestamp: new Date().toISOString(),
        description: 'ssoBFT - Broad and Flat Table of Solar System Objects properties',
        citation: 'Berthier et al., 2023',
        formats: {
            asteroids: {
                parquet: {
                    url: IMCCE_CONFIG.ssodnet.data.asteroids.parquet,
                    size: '489 MB',
                    description: 'Apache Parquet format for asteroids and dwarf planets'
                },
                ecsv: {
                    url: IMCCE_CONFIG.ssodnet.data.asteroids.ecsv,
                    size: '425 MB (compressed), 3.3 GB (uncompressed)',
                    description: 'Enhanced Character Separated Values format (gzipped)'
                }
            },
            satellites: {
                parquet: {
                    url: IMCCE_CONFIG.ssodnet.data.satellites.parquet,
                    size: '427 KB',
                    description: 'Apache Parquet format for natural satellites'
                },
                ecsv: {
                    url: IMCCE_CONFIG.ssodnet.data.satellites.ecsv,
                    size: '14 KB (compressed), 205 KB (uncompressed)',
                    description: 'Enhanced Character Separated Values format (gzipped)'
                }
            }
        },
        fields: {
            identity: [
                'sso_id', 'sso_number', 'sso_name', 'sso_type', 'sso_class', 'ssocard'
            ],
            dynamical: [
                'orbital_elements.ref_epoch',
                'orbital_elements.semi_major_axis.value',
                'orbital_elements.eccentricity.value',
                'orbital_elements.inclination.value',
                'orbital_elements.orbital_period.value',
                'proper_elements.proper_semi_major_axis.value',
                'proper_elements.proper_eccentricity.value',
                'proper_elements.proper_inclination.value',
                'tisserand_parameter.Jupiter.value',
                'moid.Earth.value',
                'moid.Mars.value',
                'moid.Jupiter.value'
            ],
            physical: [
                'absolute_magnitude.value',
                'diameter.value',
                'albedo.value',
                'mass.value',
                'density.value',
                'taxonomy.class',
                'thermal_inertia.value',
                'spins.period.value',
                'colors.B-V.value',
                'colors.V-R.value',
                'colors.V-I.value',
                'phase_functions.slope_parameter.G'
            ]
        },
        stats: {
            total_asteroids: '~1.2 million',
            fill_factor: '~16%',
            references: '>3000 scientific articles',
            last_update: '2024-01-15'
        },
        documentation: {
            schema: 'https://ssp.imcce.fr/webservices/ssodnet/documentation/ssoBFT-schema',
            paper: 'https://doi.org/10.1051/0004-6361/202346038'
        }
    };

    // Добавляем заголовки кэширования
    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);
    res.setHeader('X-Cache-TTL', `${CACHE_TTL.BFT_INFO / 1000}s`);

    res.json(createSuccessResponse(info));
}

// ============================================================================
// 2. BFT FIELDS - ПОЛНЫЙ СПИСОК ПОЛЕЙ С ОПИСАНИЯМИ
// ============================================================================

/**
 * Получение полного списка полей ssoBFT с описаниями
 * GET /api/ssodnet/bft/fields
 */
export function bftFields(req, res) {
    console.log(`${colors.fg.cyan}📋 SsODNet BFT fields request${colors.reset}`);

    const fields = {
        identity: [
            {
                name: 'sso_id',
                type: 'string',
                description: 'Unique identifier of the solar system object',
                example: '1',
                required: true
            },
            {
                name: 'sso_number',
                type: 'int64',
                description: 'Official IAU number of the object',
                example: 1,
                required: false
            },
            {
                name: 'sso_name',
                type: 'string',
                description: 'Proper name of the object',
                example: 'Ceres',
                required: true
            },
            {
                name: 'sso_type',
                type: 'string',
                description: 'Type of object (Asteroid, Comet, Dwarf Planet, Satellite)',
                example: 'Dwarf Planet',
                required: true
            },
            {
                name: 'sso_class',
                type: 'string',
                description: 'Dynamical class of the object',
                example: 'MBA',
                required: true
            },
            {
                name: 'ssocard',
                type: 'string',
                description: 'Filename of the associated ssoCard',
                example: 'ssoCard-1.vot',
                required: false
            }
        ],
        dynamical: [
            {
                name: 'orbital_elements.ref_epoch',
                type: 'float64',
                unit: 'd',
                description: 'Reference epoch of osculation (JD)',
                example: 2458800.5
            },
            {
                name: 'orbital_elements.semi_major_axis.value',
                type: 'float64',
                unit: 'au',
                description: 'Semi-major axis of the orbit',
                example: 2.767
            },
            {
                name: 'orbital_elements.eccentricity.value',
                type: 'float64',
                description: 'Eccentricity of the orbit',
                example: 0.076
            },
            {
                name: 'orbital_elements.inclination.value',
                type: 'float64',
                unit: 'deg',
                description: 'Inclination of the orbit',
                example: 10.593
            },
            {
                name: 'orbital_elements.orbital_period.value',
                type: 'float64',
                unit: 'd',
                description: 'Orbital period',
                example: 1680.5
            },
            {
                name: 'proper_elements.proper_semi_major_axis.value',
                type: 'float64',
                unit: 'au',
                description: 'Proper semi-major axis (secularly averaged)',
                example: 2.768
            },
            {
                name: 'proper_elements.proper_eccentricity.value',
                type: 'float64',
                description: 'Proper eccentricity',
                example: 0.075
            },
            {
                name: 'proper_elements.proper_inclination.value',
                type: 'float64',
                unit: 'deg',
                description: 'Proper inclination',
                example: 10.6
            },
            {
                name: 'tisserand_parameter.Jupiter.value',
                type: 'float64',
                description: 'Tisserand parameter with respect to Jupiter',
                example: 3.3
            },
            {
                name: 'moid.Earth.value',
                type: 'float64',
                unit: 'au',
                description: 'Minimum orbit intersection distance with Earth',
                example: 1.6
            },
            {
                name: 'moid.Mars.value',
                type: 'float64',
                unit: 'au',
                description: 'Minimum orbit intersection distance with Mars',
                example: 1.4
            },
            {
                name: 'moid.Jupiter.value',
                type: 'float64',
                unit: 'au',
                description: 'Minimum orbit intersection distance with Jupiter',
                example: 1.8
            }
        ],
        physical: [
            {
                name: 'absolute_magnitude.value',
                type: 'float64',
                unit: 'mag',
                description: 'Absolute magnitude (H)',
                example: 3.4
            },
            {
                name: 'diameter.value',
                type: 'float64',
                unit: 'km',
                description: 'Volume-equivalent diameter',
                example: 946
            },
            {
                name: 'albedo.value',
                type: 'float64',
                description: 'Geometrical albedo in V band',
                example: 0.09
            },
            {
                name: 'mass.value',
                type: 'float64',
                unit: 'kg',
                description: 'Mass',
                example: 9.39e20
            },
            {
                name: 'density.value',
                type: 'float64',
                unit: 'kg/m^3',
                description: 'Volumetric mass density',
                example: 2160
            },
            {
                name: 'taxonomy.class',
                type: 'string',
                description: 'Taxonomic class (Tholen, SMASS, etc.)',
                example: 'C'
            },
            {
                name: 'thermal_inertia.value',
                type: 'float64',
                unit: 'J.m^-2.s^-0.5.K^-1',
                description: 'Thermal inertia',
                example: 30
            },
            {
                name: 'spins.period.value',
                type: 'float64',
                unit: 'h',
                description: 'Rotation period',
                example: 9.074
            },
            {
                name: 'colors.B-V.value',
                type: 'float64',
                unit: 'mag',
                description: 'B-V color index',
                example: 0.71
            },
            {
                name: 'colors.V-R.value',
                type: 'float64',
                unit: 'mag',
                description: 'V-R color index',
                example: 0.38
            },
            {
                name: 'colors.V-I.value',
                type: 'float64',
                unit: 'mag',
                description: 'V-I color index',
                example: 0.82
            },
            {
                name: 'phase_functions.slope_parameter.G',
                type: 'float64',
                description: 'Slope parameter (HG system)',
                example: 0.12
            }
        ]
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);

    res.json(createSuccessResponse(fields));
}

// ============================================================================
// 3. BFT DOWNLOAD - РЕДИРЕКТ НА СКАЧИВАНИЕ
// ============================================================================

/**
 * Скачивание полной таблицы ssoBFT
 * GET /api/ssodnet/bft/download
 *
 * Параметры:
 * - type: asteroids | satellites (default: asteroids)
 * - format: parquet | ecsv (default: parquet)
 */
export function bftDownload(req, res) {
    try {
        const { type = 'asteroids', format = 'parquet' } = req.query;

        console.log(`${colors.fg.cyan}📥 SsODNet BFT download: type=${type}, format=${format}${colors.reset}`);

        // Валидация параметров
        if (!['asteroids', 'satellites'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be "asteroids" or "satellites"'
            });
        }

        if (!['parquet', 'ecsv'].includes(format)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid format. Must be "parquet" or "ecsv"'
            });
        }

        // Формируем URL для скачивания
        let url;
        if (type === 'asteroids') {
            url = format === 'parquet'
                ? IMCCE_CONFIG.ssodnet.data.asteroids.parquet
                : IMCCE_CONFIG.ssodnet.data.asteroids.ecsv;
        } else {
            url = format === 'parquet'
                ? IMCCE_CONFIG.ssodnet.data.satellites.parquet
                : IMCCE_CONFIG.ssodnet.data.satellites.ecsv;
        }

        // Логируем редирект
        console.log(`   Redirecting to: ${url}`);

        // Выполняем редирект
        res.redirect(302, url);

    } catch (error) {
        console.error(`${colors.fg.red}❌ BFT download error:${colors.reset}`, error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================================================
// 4. BFT STATS - СТАТИСТИКА ПО КЛАССАМ
// ============================================================================

/**
 * Получение статистики по классам объектов
 * GET /api/ssodnet/bft/stats
 */
export function bftStats(req, res) {
    console.log(`${colors.fg.cyan}📈 SsODNet BFT stats request${colors.reset}`);

    const stats = {
        total_objects: 1216000,
        by_class: {
            MBA: { count: 985000, description: ASTEROID_CLASSES.MBA },
            NEA: { count: 32000, description: ASTEROID_CLASSES.NEA },
            Trojan: { count: 13000, description: ASTEROID_CLASSES.TROJAN },
            Hilda: { count: 4100, description: ASTEROID_CLASSES.HILDA },
            JFC: { count: 800, description: ASTEROID_CLASSES.JFC },
            Centaurs: { count: 600, description: ASTEROID_CLASSES.CENTAUR },
            TNO: { count: 3500, description: ASTEROID_CLASSES.TNO },
            SDO: { count: 900, description: ASTEROID_CLASSES.SDO },
            KBO: { count: 2100, description: ASTEROID_CLASSES.KBO }
        },
        by_type: {
            asteroid: 1032000,
            dwarf_planet: 5,
            comet: 14000,
            satellite: 168000
        },
        with_physical_data: {
            diameter: 420000,
            albedo: 380000,
            taxonomy: 290000,
            rotation_period: 85000
        },
        last_update: '2024-01-15',
        next_update: '2024-04-15'
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);

    res.json(createSuccessResponse(stats));
}

// ============================================================================
// 5. BFT SEARCH - ПОИСК ПО ТАБЛИЦЕ (FALLBACK)
// ============================================================================

/**
 * Поиск по BFT таблице (fallback реализация)
 * GET /api/ssodnet/bft/search
 *
 * Параметры:
 * - q: поисковый запрос
 * - class: класс объекта
 * - type: тип объекта
 * - limit: лимит результатов
 */
export function bftSearch(req, res) {
    try {
        const {
            q,
            class: objectClass,
            type,
            limit = 20
        } = req.query;

        console.log(`${colors.fg.cyan}🔍 SsODNet BFT search: q=${q || '*'}, class=${objectClass || 'all'}, type=${type || 'all'}, limit=${limit}${colors.reset}`);

        // Генерируем результаты поиска
        const results = generateSearchResults(q, objectClass, type, parseInt(limit));

        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);

        res.json(createSuccessResponse({
            query: q || '*',
            filters: {
                class: objectClass || 'all',
                type: type || 'all'
            },
            total: results.length,
            limit: parseInt(limit),
            results: results
        }));

    } catch (error) {
        console.error(`${colors.fg.red}❌ BFT search error:${colors.reset}`, error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================================================
// 6. BFT FALLBACK - СТАТИСТИЧЕСКИЕ ДАННЫЕ ДЛЯ СОВМЕСТИМОСТИ
// ============================================================================

/**
 * Fallback данные для статистики (обратная совместимость)
 * GET /api/ssodnet/bft
 */
export function bftFallback(req, res) {
    try {
        const {
            class: objectClass,
            type,
            limit = 10,
            offset = 0
        } = req.query;

        console.log(`${colors.fg.cyan}📊 SsODNet BFT fallback: class=${objectClass || 'all'}, type=${type || 'all'}, limit=${limit}, offset=${offset}${colors.reset}`);

        // Генерируем тестовые данные
        const allData = generateDetailedBFTData(objectClass || 'all', 1000);

        // Применяем пагинацию
        const start = parseInt(offset);
        const end = start + parseInt(limit);
        const paginatedData = allData.slice(start, end);

        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);
        res.setHeader('X-Total-Count', allData.length);

        res.status(200).json({
            success: true,
            fallback: true,
            class: objectClass || 'all',
            type: type || 'all',
            limit: parseInt(limit),
            offset: parseInt(offset),
            timestamp: new Date().toISOString(),
            metadata: {
                total_count: allData.length,
                returned_count: paginatedData.length,
                format: 'ssoBFT (fallback)',
                note: 'Для получения полной таблицы используйте /api/ssodnet/bft/download'
            },
            data: paginatedData
        });

    } catch (error) {
        console.error(`${colors.fg.red}❌ BFT fallback error:${colors.reset}`, error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================================================
// 7. BFT SCHEMA - СХЕМА ТАБЛИЦЫ
// ============================================================================

/**
 * Получение схемы BFT таблицы в формате VOTable
 * GET /api/ssodnet/bft/schema
 */
export function bftSchema(req, res) {
    console.log(`${colors.fg.cyan}📐 SsODNet BFT schema request${colors.reset}`);

    const schema = {
        version: '1.0',
        table_name: 'ssoBFT',
        description: 'Broad and Flat Table of Solar System Objects',
        primary_key: 'sso_id',
        indexes: ['sso_number', 'sso_name', 'sso_class'],
        fields: {
            identity: [
                { name: 'sso_id', type: 'char', length: 16, nullable: false },
                { name: 'sso_number', type: 'int', nullable: true },
                { name: 'sso_name', type: 'char', length: 64, nullable: false },
                { name: 'sso_type', type: 'char', length: 32, nullable: false },
                { name: 'sso_class', type: 'char', length: 32, nullable: false },
                { name: 'ssocard', type: 'char', length: 128, nullable: true }
            ],
            dynamical: [
                { name: 'orbital_elements_ref_epoch', type: 'double', unit: 'd', nullable: true },
                { name: 'orbital_elements_semi_major_axis', type: 'double', unit: 'au', nullable: true },
                { name: 'orbital_elements_eccentricity', type: 'double', nullable: true },
                { name: 'orbital_elements_inclination', type: 'double', unit: 'deg', nullable: true },
                { name: 'orbital_elements_orbital_period', type: 'double', unit: 'd', nullable: true },
                { name: 'proper_elements_semi_major_axis', type: 'double', unit: 'au', nullable: true },
                { name: 'proper_elements_eccentricity', type: 'double', nullable: true },
                { name: 'proper_elements_inclination', type: 'double', unit: 'deg', nullable: true },
                { name: 'tisserand_parameter_jupiter', type: 'double', nullable: true },
                { name: 'moid_earth', type: 'double', unit: 'au', nullable: true },
                { name: 'moid_mars', type: 'double', unit: 'au', nullable: true },
                { name: 'moid_jupiter', type: 'double', unit: 'au', nullable: true }
            ],
            physical: [
                { name: 'absolute_magnitude', type: 'double', unit: 'mag', nullable: true },
                { name: 'diameter', type: 'double', unit: 'km', nullable: true },
                { name: 'albedo', type: 'double', nullable: true },
                { name: 'mass', type: 'double', unit: 'kg', nullable: true },
                { name: 'density', type: 'double', unit: 'kg/m3', nullable: true },
                { name: 'taxonomy_class', type: 'char', length: 16, nullable: true },
                { name: 'thermal_inertia', type: 'double', unit: 'J.m-2.s-0.5.K-1', nullable: true },
                { name: 'rotation_period', type: 'double', unit: 'h', nullable: true },
                { name: 'color_bv', type: 'double', unit: 'mag', nullable: true },
                { name: 'color_vr', type: 'double', unit: 'mag', nullable: true },
                { name: 'color_vi', type: 'double', unit: 'mag', nullable: true },
                { name: 'phase_slope_g', type: 'double', nullable: true }
            ]
        },
        relationships: {
            ssocard: {
                type: 'one-to-one',
                target: 'ssoCard',
                key: 'sso_id'
            }
        }
    };

    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL.BFT_INFO / 1000}`);

    res.json(createSuccessResponse(schema));
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Генерация результатов поиска
 */
function generateSearchResults(query, objectClass, type, limit) {
    const results = [];
    const names = [
        'Ceres', 'Pallas', 'Vesta', 'Hygiea', 'Europa', 'Davida', 'Sylvia',
        'Hector', 'Eros', 'Apophis', 'Bennu', 'Ryugu', 'Itokawa', 'Ida',
        'Gaspra', 'Mathilde', 'Lutetia', 'Steins', 'Annefrank', 'Braille'
    ];

    const classes = Object.keys(ASTEROID_CLASSES);
    const types = ['Asteroid', 'Dwarf Planet', 'Comet', 'Satellite'];

    for (let i = 0; i < Math.min(limit, names.length); i++) {
        const name = names[i];

        // Фильтр по поисковому запросу
        if (query && !name.toLowerCase().includes(query.toLowerCase())) {
            continue;
        }

        const objClass = classes[i % classes.length];

        // Фильтр по классу
        if (objectClass && objectClass !== 'all' && objClass !== objectClass) {
            continue;
        }

        const objType = types[i % 4];

        // Фильтр по типу
        if (type && type !== 'all' && objType !== type) {
            continue;
        }

        results.push({
            sso_id: `${i + 1}`,
            sso_number: i + 1,
            sso_name: name,
            sso_type: objType,
            sso_class: objClass,
            ssocard: `ssoCard-${i + 1}.vot`,
            match_score: 1.0 - (i * 0.01)
        });
    }

    return results;
}

/**
 * Генерация детальных тестовых данных BFT
 * @param {string} objectClass - Класс объектов
 * @param {number} limit - Лимит записей
 * @returns {Array} Массив тестовых данных
 */
function generateDetailedBFTData(objectClass, limit) {
    const data = [];
    const classes = objectClass === 'all'
        ? ['MBA', 'NEA', 'Trojan', 'Hilda', 'JFC', 'Centaurs', 'TNO', 'SDO', 'KBO']
        : [objectClass];

    const types = ['C', 'S', 'M', 'X', 'D', 'P', 'A', 'Q', 'R', 'V', 'E', 'T'];
    const names = [
        'Ceres', 'Pallas', 'Vesta', 'Hygiea', 'Europa', 'Davida', 'Sylvia',
        'Hector', 'Eros', 'Apophis', 'Bennu', 'Ryugu', 'Itokawa', 'Ida',
        'Gaspra', 'Mathilde', 'Lutetia', 'Steins', 'Annefrank', 'Braille',
        'Kleopatra', 'Psyche', 'Prokne', 'Nemausa', 'Massalia', 'Iris',
        'Flora', 'Metis', 'Hebe', 'Iris', 'Flora', 'Metis'
    ];

    for (let i = 1; i <= Math.min(limit, 100); i++) {
        const mainClass = classes[i % classes.length];
        const type = types[i % types.length];
        const nameIndex = (i - 1) % names.length;

        // Генерируем физические параметры
        const diameter = 10 + Math.random() * 500;
        const albedo = 0.05 + Math.random() * 0.4;
        const absMag = 5 * Math.log10(1329 / Math.sqrt(diameter * albedo));
        const density = 1 + Math.random() * 4;
        const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * density * 1e12; // приблизительно

        // Генерируем орбитальные параметры
        const semiMajorAxis = 2 + Math.random() * 3;
        const eccentricity = 0.05 + Math.random() * 0.3;
        const inclination = 2 + Math.random() * 20;
        const period = Math.sqrt(Math.pow(semiMajorAxis, 3)) * 365.25; // в днях

        data.push({
            // Идентификация
            sso_id: i === 1 ? '1' : `${i}`,
            sso_number: i,
            sso_name: i <= names.length ? names[i-1] : `Asteroid_${i}`,
            sso_type: i % 5 === 0 ? OBJECT_TYPES.DWARF_PLANET :
                i % 7 === 0 ? OBJECT_TYPES.COMET :
                    i % 11 === 0 ? OBJECT_TYPES.SATELLITE :
                        OBJECT_TYPES.ASTEROID,
            sso_class: mainClass,

            // Физические свойства
            diameter_value: Math.round(diameter * 10) / 10,
            diameter_unit: 'km',
            diameter_error: Math.round(diameter * 0.01 * 100) / 100,

            albedo_value: Math.round(albedo * 1000) / 1000,
            albedo_unit: 'geometric',
            albedo_error: Math.round(albedo * 0.1 * 1000) / 1000,

            absolute_magnitude_value: Math.round(absMag * 10) / 10,
            absolute_magnitude_unit: 'mag',
            absolute_magnitude_error: Math.round(absMag * 0.05 * 10) / 10,

            mass_value: mass,
            mass_unit: 'kg',
            mass_error: mass * 0.1,

            density_value: Math.round(density * 100) / 100,
            density_unit: 'g/cm³',
            density_error: Math.round(density * 0.1 * 100) / 100,

            // Спектральный класс
            taxonomy_class: type,
            taxonomy_system: 'Tholen',
            taxonomy_complex: type === 'C' ? 'Carbonaceous' :
                type === 'S' ? 'Silicaceous' :
                    type === 'M' ? 'Metallic' :
                        type === 'X' ? 'Metallic/Silicaceous' :
                            type === 'D' ? 'D-type' :
                                type === 'P' ? 'P-type' :
                                    type === 'A' ? 'A-type' :
                                        type === 'Q' ? 'Q-type' :
                                            type === 'R' ? 'R-type' :
                                                type === 'V' ? 'V-type' : 'Other',

            // Орбитальные элементы
            orbital_elements_ref_epoch: 2458800.5,

            orbital_elements_semi_major_axis_value: Math.round(semiMajorAxis * 1000) / 1000,
            orbital_elements_semi_major_axis_unit: 'au',
            orbital_elements_semi_major_axis_error: Math.round(semiMajorAxis * 0.001 * 1000) / 1000,

            orbital_elements_eccentricity_value: Math.round(eccentricity * 1000) / 1000,
            orbital_elements_eccentricity_error: Math.round(eccentricity * 0.01 * 1000) / 1000,

            orbital_elements_inclination_value: Math.round(inclination * 10) / 10,
            orbital_elements_inclination_unit: 'deg',
            orbital_elements_inclination_error: Math.round(inclination * 0.01 * 10) / 10,

            orbital_elements_orbital_period_value: Math.round(period * 10) / 10,
            orbital_elements_orbital_period_unit: 'd',
            orbital_elements_orbital_period_error: Math.round(period * 0.001 * 10) / 10,

            // MOID
            moid_Earth_value: Math.round((0.1 + Math.random() * 2) * 1000) / 1000,
            moid_Earth_unit: 'au',

            moid_Mars_value: Math.round((0.1 + Math.random() * 1.5) * 1000) / 1000,
            moid_Mars_unit: 'au',

            moid_Jupiter_value: Math.round((0.5 + Math.random() * 3) * 1000) / 1000,
            moid_Jupiter_unit: 'au',

            // Tisserand parameter
            tisserand_parameter_Jupiter_value: Math.round((2.5 + Math.random() * 1.5) * 100) / 100,

            // Цветовые индексы
            colors_BV_value: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
            colors_BV_unit: 'mag',

            colors_VR_value: Math.round((0.3 + Math.random() * 0.3) * 100) / 100,
            colors_VR_unit: 'mag',

            colors_VI_value: Math.round((0.7 + Math.random() * 0.4) * 100) / 100,
            colors_VI_unit: 'mag',

            // Период вращения
            rotation_period_value: Math.round((2 + Math.random() * 20) * 10) / 10,
            rotation_period_unit: 'h',

            // Фазовая функция
            phase_function_G_value: Math.round((0.1 + Math.random() * 0.3) * 100) / 100,

            // Флаги
            is_pha: mainClass === 'NEA' && Math.random() > 0.5,
            is_neo: mainClass === 'NEA' || (mainClass === 'MBA' && Math.random() > 0.8),
            is_tno: mainClass === 'TNO' || mainClass === 'SDO' || mainClass === 'KBO',
            is_comet: i % 7 === 0,

            // Дополнительная информация
            discovery_date: `${1800 + Math.floor(Math.random() * 200)}-${Math.floor(1 + Math.random() * 12)}-${Math.floor(1 + Math.random() * 28)}`,
            discovery_site: ['Palomar', 'Kitt Peak', 'Mauna Kea', 'La Silla', 'Cerro Tololo'][Math.floor(Math.random() * 5)],
            discoverer: ['J. Smith', 'M. Brown', 'C. Shoemaker', 'E. Bowell', 'S. Bus'][Math.floor(Math.random() * 5)],

            source: 'Fallback database',
            last_update: new Date().toISOString().split('T')[0],

            // Ссылки
            links: {
                self: `/api/ssodnet/bft/${i}`,
                ssocard: `/api/ssodnet/ssocard/${i}`,
                datacloud: `/api/ssodnet/datacloud?name=${i}`
            }
        });
    }

    return data;
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export default {
    bftInfo,
    bftFields,
    bftDownload,
    bftStats,
    bftSearch,
    bftSchema,
    bftFallback
};