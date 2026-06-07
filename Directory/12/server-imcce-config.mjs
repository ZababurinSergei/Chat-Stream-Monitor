// /10/map/server-imcce-config.mjs - Конфигурация для IMCCE API (ОБНОВЛЕННАЯ)
// ВЕРСИЯ 2.1 - Добавлены конфигурации для наблюдателей (observer)

// ============================================================================
// БАЗОВЫЕ URL ДЛЯ ВСЕХ СЕРВИСОВ IMCCE
// ============================================================================

export const IMCCE_CONFIG = {
    // SsODNet API
    ssodnet: {
        base: 'https://ssp.imcce.fr/webservices/ssodnet/api',
        quaero: 'https://api.ssodnet.imcce.fr/quaero/1',
        search: 'https://api.ssodnet.imcce.fr/quaero/1/sso/search',
        ssocard: 'https://ssp.imcce.fr/webservices/ssodnet/api/ssocard',
        data: {
            asteroids: {
                parquet: 'https://ssp.imcce.fr/webservices/ssodnet/data/ssoBFT-asteroids.parquet',
                ecsv: 'https://ssp.imcce.fr/webservices/ssodnet/data/ssoBFT-asteroids.ecsv.gz'
            },
            satellites: {
                parquet: 'https://ssp.imcce.fr/webservices/ssodnet/data/ssoBFT-satellites.parquet',
                ecsv: 'https://ssp.imcce.fr/webservices/ssodnet/data/ssoBFT-satellites.ecsv.gz'
            }
        }
    },

    // Miriade API
    miriade: {
        base: 'https://ssp.imcce.fr/webservices/miriade/api',
        ephemcc: 'https://ssp.imcce.fr/webservices/miriade/api/ephemcc.php',
        ephemph: 'https://ssp.imcce.fr/webservices/miriade/api/ephemph.php',
        models: 'https://ssp.imcce.fr/webservices/miriade/api/ephemph.php'
    },

    // SkyBoT API
    skybot: {
        base: 'https://ssp.imcce.fr/webservices/skybot/api',
        conesearch: 'https://ssp.imcce.fr/webservices/skybot/api/conesearch.php'
    },

    // Skybot3D API
    skybot3d: {
        base: 'https://ssp.imcce.fr/webservices/skybot3d/api',
        getAster: 'https://ssp.imcce.fr/webservices/skybot3d/api/getAster.php',
        getComet: 'https://ssp.imcce.fr/webservices/skybot3d/api/getComet.php',
        getPlanet: 'https://ssp.imcce.fr/webservices/skybot3d/api/getPlanet.php',
        getSso: 'https://ssp.imcce.fr/webservices/skybot3d/api/getSso.php',
        getAvailability: 'https://ssp.imcce.fr/webservices/skybot3d/api/getAvailability.php'
    }
};

// ============================================================================
// КОНФИГУРАЦИЯ ТАЙМАУТОВ
// ============================================================================

export const TIMEOUT_CONFIG = {
    // Базовые таймауты по типам запросов
    base: {
        ssodnet: 10000,      // 10 секунд
        miriade_ephemcc: 10000,
        miriade_ephemph: 20000, // Увеличен для физических эфемерид
        skybot_cone: 30000,
        skybot3d_aster: 15000,
        skybot3d_comet: 15000,
        skybot3d_planet: 30000, // Увеличен из-за возможной загрузки файла
        skybot3d_sso: 45000,    // Самый большой для всех объектов
        skybot3d_availability: 5000
    },

    // Множители для специальных случаев
    multipliers: {
        large_limit: 1.5,     // Для limit > 10
        large_radius: 2.0,    // Для radius > 5 градусов
        problematic_object: 2.0, // Для сложных объектов (Марс, Юпитер)
        all_objects: 3.0       // Для limit = 0 (все объекты)
    },

    // Абсолютные максимумы
    max: {
        default: 60000,        // 60 секунд
        file_download: 120000  // 120 секунд для скачивания файлов
    }
};

// ============================================================================
// КОНФИГУРАЦИЯ ФАЙЛОВОГО РЕЖИМА ДЛЯ SKYBOT3D
// ============================================================================

export const FILE_MODE_CONFIG = {
    // Порог для автоматического включения файлового режима
    auto_file_threshold: 10,  // При limit > 10 автоматически использовать файлы

    // Максимальные лимиты для прямых запросов
    max_direct_limit: 5,      // Безопасный лимит для прямых запросов

    // Настройки скачивания файлов
    download: {
        timeout: 60000,        // Таймаут для скачивания файла
        max_size: 100 * 1024 * 1024, // 100 MB максимальный размер файла
        retry_attempts: 3,     // Количество попыток при ошибке
        retry_delay: 1000      // Задержка между попытками (мс)
    },

    // Поддерживаемые форматы сжатия
    compression: {
        bz2: ['.bz2', '.bzip2'],
        gz: ['.gz', '.gzip'],
        br: ['.br', '.brotli']
    },

    // Поддерживаемые форматы данных
    formats: {
        json: ['.json', '.json.br', '.json.gz', '.json.bz2'],
        votable: ['.vot', '.votable', '.xml'],
        csv: ['.csv', '.csv.gz']
    }
};

// ============================================================================
// КОНФИГУРАЦИЯ НАБЛЮДАТЕЛЕЙ (OBSERVER) - НОВОЕ
// ============================================================================

export const OBSERVER_CONFIG = {
    // Код наблюдателя по умолчанию
    default: '500',

    // Специальные коды для космических аппаратов и точек либрации
    special: {
        '@sun': 'Солнце',
        '@rosetta': 'Космический аппарат Rosetta',
        '@kepler': 'Космический аппарат Kepler',
        '@earthl2': 'Точка L2 системы Солнце-Земля',
        '@tess': 'Космический аппарат TESS',
        '@-226': 'Космический аппарат Rosetta (альтернативный код)',
        '@-227': 'Космический аппарат Kepler (альтернативный код)',
        'c55': 'Космический аппарат Kepler (код TESS)',
        'c57': 'Космический аппарат TESS',
        'earth@l2': 'Точка L2 системы Солнце-Земля',
        '500@l2': 'Точка L2 системы Солнце-Земля',
        'l2': 'Точка L2 системы Солнце-Земля'
    },

    // Известные IAU коды обсерваторий
    iau_codes: {
        '500': 'Геоцентр (центр масс Земли)',
        '501': 'Герстмон',
        '502': 'Кингстон',
        '503': 'Кембридж',
        '504': 'Ле-Крёзо',
        '505': 'Трувиль',
        '506': 'Бордо',
        '507': 'Лион',
        '508': 'Страсбург',
        '509': 'Париж',
        '510': 'Безансон',
        '511': 'Марсель',
        '512': 'Тулуза',
        '513': 'Лион',
        '514': 'Мюлуз',
        '515': 'Дижон',
        '516': 'Гамбург',
        '517': 'Берлин',
        '518': 'Бонн',
        '519': 'Лейпциг',
        '520': 'Мюнхен',
        '521': 'Прага',
        '522': 'Вена',
        '523': 'Франкфурт',
        '524': 'Гейдельберг',
        '525': 'Марбург',
        '526': 'Киль',
        '527': 'Гёттинген',
        '528': 'Гота',
        '529': 'Кёнигсберг',
        '530': 'Любек',
        '531': 'Кольберг',
        '532': 'Мюнстер',
        '533': 'Падерборн',
        '534': 'Трир',
        '535': 'Вюрцбург',
        '536': 'Бамберг',
        '537': 'Ульм',
        '538': 'Зоннеберг',
        '539': 'Кремсмюнстер',
        '540': 'Линц',
        '541': 'Прага',
        '542': 'Прага',
        '543': 'Прага',
        '544': 'Лемберг',
        '545': 'Вена',
        '546': 'Вена',
        '547': 'Бреслау',
        '548': 'Берлин',
        '549': 'Уппсала',
        '550': 'Лунд',
        '551': 'Хельсинки',
        '552': 'Санкт-Петербург',
        '553': 'Москва',
        '554': 'Варшава',
        '555': 'Краков',
        '556': 'Будапешт',
        '557': 'Белград',
        '558': 'София',
        '559': 'Серро-Параналь',
        '560': 'Мауна-Кеа',
        '561': 'Паломар',
        '562': 'Китт-Пик',
        '563': 'Серро-Тололо',
        '564': 'Ла-Силья',
        '565': 'Канарские острова',
        '566': 'Гавайи',
        '567': 'Чили',
        '568': 'Австралия',
        '569': 'ЮАР',
        '570': 'Новая Зеландия',
        '571': 'Япония',
        '572': 'Китай',
        '573': 'Индия',
        '574': 'Израиль',
        '575': 'Египет',
        '576': 'Турция',
        '577': 'Иран',
        '578': 'Ирак',
        '579': 'Сирия',
        '580': 'Иордания',
        '581': 'Ливан',
        '582': 'Кипр',
        '583': 'Греция',
        '584': 'Италия',
        '585': 'Испания',
        '586': 'Португалия',
        '587': 'Франция',
        '588': 'Великобритания',
        '589': 'Ирландия',
        '590': 'Нидерланды',
        '591': 'Бельгия',
        '592': 'Люксембург',
        '593': 'Германия',
        '594': 'Швейцария',
        '595': 'Австрия',
        '596': 'Чехия',
        '597': 'Словакия',
        '598': 'Венгрия',
        '599': 'Словения'
    },

    // Паттерн для координат: latitude, longitude, altitude
    coordinate_pattern: /^[+-]?\d+(\.\d+)?,\s*[+-]?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/,

    // Описание формата координат
    coordinate_description: 'Формат: latitude, longitude, altitude (градусы, градусы, метры)'
};

// ============================================================================
// КОНФИГУРАЦИЯ ПРОБЛЕМНЫХ ОБЪЕКТОВ
// ============================================================================

export const PROBLEMATIC_OBJECTS = {
    // Объекты, требующие специальной обработки
    ephemph: {
        'p:Mars': {           // Марс требует больше времени
            timeout_multiplier: 2.0,
            fallback_so: 2,   // Альтернативная модель при таймауте
            note: 'Медленный ответ для физических эфемерид Марса'
        },
        'p:Jupiter': {
            timeout_multiplier: 1.5,
            fallback_so: 2,
            note: 'Сложные вычисления для Юпитера'
        },
        'p:Earth': {
            timeout_multiplier: 1.5,
            fallback_so: 1,
            note: 'Требуется больше времени для Земли'
        },
        'p:Venus': {
            timeout_multiplier: 1.5,
            fallback_so: 1,
            note: 'Медленный ответ для Венеры'
        }
    },

    // Объекты, которые могут отсутствовать в базе
    missing_in_ssocard: [
        'Mars',
        'Jupiter',
        'Saturn',
        'Uranus',
        'Neptune',
        'Mercury',
        'Venus',
        'Earth'
    ],

    // Объекты, требующие специальных префиксов
    requires_prefix: {
        'planet': ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Mercury', 'Venus', 'Earth'],
        'asteroid': /^\d+$/,  // Числовые идентификаторы
        'comet': /\//  // Содержат /
    }
};

// ============================================================================
// ТИПЫ ОБЪЕКТОВ И ИХ ПРЕФИКСЫ
// ============================================================================

export const OBJECT_PREFIXES = {
    planet: 'p:',
    asteroid: 'a:',
    comet: 'c:',
    satellite: 's:',
    dwarf: 'd:',
    spacecraft: 'sc:'
};

export const OBJECT_TYPES = {
    PLANET: 'Planet',
    DWARF_PLANET: 'Dwarf Planet',
    ASTEROID: 'Asteroid',
    COMET: 'Comet',
    SATELLITE: 'Satellite',
    SPACECRAFT: 'Spacecraft',
    UNKNOWN: 'Unknown'
};

export const ASTEROID_CLASSES = {
    MBA: 'Main Belt Asteroid',
    NEA: 'Near-Earth Asteroid',
    NEO: 'Near-Earth Object',
    PHA: 'Potentially Hazardous Asteroid',
    TROJAN: 'Trojan Asteroid',
    HILDA: 'Hilda Asteroid',
    JFC: 'Jupiter Family Comet',
    CENTAUR: 'Centaur',
    TNO: 'Trans-Neptunian Object',
    SDO: 'Scattered Disk Object',
    KBO: 'Kuiper Belt Object'
};

export const COMET_CLASSES = {
    SHORT_PERIOD: 'Short-Period Comet',
    LONG_PERIOD: 'Long-Period Comet',
    HALLEY_TYPE: 'Halley-Type Comet',
    ENCKE_TYPE: 'Encke-Type Comet',
    HYPERBOLIC: 'Hyperbolic Comet'
};

// ============================================================================
// ПАРАМЕТРЫ ЗАПРОСОВ ПО УМОЛЧАНИЮ (ОБНОВЛЕНО)
// ============================================================================

export const DEFAULT_PARAMS = {
    quaero: {
        limit: 10,
        offset: 0
    },
    miriade: {
        epoch: 'now',
        step: '1d',
        nsteps: 1,
        tscale: 'UTC',
        observer: '500',
        so: 1,
        output: '--iso',
        mime: 'json'
    },
    skybot: {
        epoch: 'now',
        from: 'GaiaDR3-StarMap',
        output: 'all',
        mime: 'json',
        observer: '500',
        filter: '120',
        objFilter: '111',
        refsys: 'EQJ2000'
    },
    skybot3d: {
        epoch: 'now',
        coord: 'spherical',
        mime: 'json',
        from: 'GaiaDR3-StarMap',
        downloadData: '0',
        observer: '500'  // Добавлен observer по умолчанию
    }
};

// ============================================================================
// ВРЕМЕНА КЭШИРОВАНИЯ (В МИЛЛИСЕКУНДАХ)
// ============================================================================

export const CACHE_TTL = {
    QUAERO: 3600000,        // 1 час
    DATACLOUD: 86400000,    // 24 часа
    SSOCARD: 86400000,      // 24 часа
    EPHEMCC: 300000,        // 5 минут
    EPHEMPH: 3600000,       // 1 час
    SKYBOT: 3600000,        // 1 час
    SKYBOT3D: 86400000,     // 24 часа
    SKYBOT3D_FILE: 604800000, // 7 дней для файловых данных
    BFT_INFO: 604800000     // 7 дней
};

// ============================================================================
// БАЗА ДАННЫХ ИЗВЕСТНЫХ ОБЪЕКТОВ ДЛЯ FALLBACK
// ============================================================================

export const FALLBACK_DATABASE = {
    // Планеты
    planets: [
        { id: 'Mercury', name: 'Mercury', type: OBJECT_TYPES.PLANET, class: 'Terrestrial', keywords: ['mercury', 'меркурий'], aliases: ['1', '☿'] },
        { id: 'Venus', name: 'Venus', type: OBJECT_TYPES.PLANET, class: 'Terrestrial', keywords: ['venus', 'венер'], aliases: ['2', '♀'] },
        { id: 'Earth', name: 'Earth', type: OBJECT_TYPES.PLANET, class: 'Terrestrial', keywords: ['earth', 'земл'], aliases: ['3', '🌍'] },
        { id: 'Mars', name: 'Mars', type: OBJECT_TYPES.PLANET, class: 'Terrestrial', keywords: ['mars', 'марс'], aliases: ['4', '♂'] },
        { id: 'Jupiter', name: 'Jupiter', type: OBJECT_TYPES.PLANET, class: 'Gas Giant', keywords: ['jupiter', 'юпитер'], aliases: ['5', '♃'] },
        { id: 'Saturn', name: 'Saturn', type: OBJECT_TYPES.PLANET, class: 'Gas Giant', keywords: ['saturn', 'сатурн'], aliases: ['6', '♄'] },
        { id: 'Uranus', name: 'Uranus', type: OBJECT_TYPES.PLANET, class: 'Ice Giant', keywords: ['uranus', 'уран'], aliases: ['7', '♅'] },
        { id: 'Neptune', name: 'Neptune', type: OBJECT_TYPES.PLANET, class: 'Ice Giant', keywords: ['neptune', 'нептун'], aliases: ['8', '♆'] }
    ],

    // Карликовые планеты
    dwarfPlanets: [
        { id: 'Ceres', name: 'Ceres', type: OBJECT_TYPES.DWARF_PLANET, class: ASTEROID_CLASSES.MBA, keywords: ['ceres', 'церер'], aliases: ['1', 'A899 OF'] },
        { id: 'Pluto', name: 'Pluto', type: OBJECT_TYPES.DWARF_PLANET, class: ASTEROID_CLASSES.KBO, keywords: ['pluto', 'плутон'], aliases: ['134340', '2003 VB12'] },
        { id: 'Haumea', name: 'Haumea', type: OBJECT_TYPES.DWARF_PLANET, class: ASTEROID_CLASSES.KBO, keywords: ['haumea', 'хауме'], aliases: ['136108', '2003 EL61'] },
        { id: 'Makemake', name: 'Makemake', type: OBJECT_TYPES.DWARF_PLANET, class: ASTEROID_CLASSES.KBO, keywords: ['makemake', 'маке'], aliases: ['136472', '2005 FY9'] },
        { id: 'Eris', name: 'Eris', type: OBJECT_TYPES.DWARF_PLANET, class: ASTEROID_CLASSES.SDO, keywords: ['eris', 'эрид'], aliases: ['136199', '2003 UB313'] }
    ],

    // Крупные астероиды
    asteroids: [
        { id: '2', name: 'Pallas', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['pallas', 'палла'], aliases: ['2'] },
        { id: '3', name: 'Juno', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['juno', 'юнон'], aliases: ['3'] },
        { id: '4', name: 'Vesta', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['vesta', 'вест'], aliases: ['4'] },
        { id: '10', name: 'Hygiea', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['hygiea', 'гиге'], aliases: ['10'] },
        { id: '16', name: 'Psyche', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['psyche', 'псих'], aliases: ['16'] },
        { id: '433', name: 'Eros', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.NEA, keywords: ['eros', 'эрос'], aliases: ['433', '1898 DQ'] },
        { id: '951', name: 'Gaspra', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['gaspra', 'гаспр'], aliases: ['951'] },
        { id: '243', name: 'Ida', type: OBJECT_TYPES.ASTEROID, class: ASTEROID_CLASSES.MBA, keywords: ['ida', 'ида'], aliases: ['243'] }
    ],

    // Кометы
    comets: [
        { id: '1P', name: 'Halley', type: OBJECT_TYPES.COMET, class: COMET_CLASSES.HALLEY_TYPE, keywords: ['halley', 'галле'], aliases: ['1P/1682 Q1'] },
        { id: '2P', name: 'Encke', type: OBJECT_TYPES.COMET, class: COMET_CLASSES.ENCKE_TYPE, keywords: ['encke', 'энке'], aliases: ['2P/1786 B1'] },
        { id: '67P', name: 'Churyumov-Gerasimenko', type: OBJECT_TYPES.COMET, class: COMET_CLASSES.SHORT_PERIOD, keywords: ['churyumov', 'чурюмов'], aliases: ['67P/1969 R1'] },
        { id: 'C/1995 O1', name: 'Hale-Bopp', type: OBJECT_TYPES.COMET, class: COMET_CLASSES.LONG_PERIOD, keywords: ['hale-bopp', 'хейл'], aliases: ['C/1995 O1'] }
    ]
};

// ============================================================================
// ФИЗИЧЕСКИЕ ПАРАМЕТРЫ ДЛЯ FALLBACK
// ============================================================================

export const FALLBACK_PHYSICAL = {
    mercury: {
        name: 'Mercury',
        diameter: 4879,
        density: 5.427,
        albedo: 0.12,
        temperature: 440,
        magnitude: -0.6,
        mass: 3.301e23,
        gravity: 3.7,
        period: 0.24,
        semi_major_axis: 0.39,
        eccentricity: 0.2056,
        inclination: 7.0
    },
    venus: {
        name: 'Venus',
        diameter: 12104,
        density: 5.243,
        albedo: 0.65,
        temperature: 737,
        magnitude: -4.4,
        mass: 4.867e24,
        gravity: 8.87,
        period: 0.615,
        semi_major_axis: 0.723,
        eccentricity: 0.0068,
        inclination: 3.39
    },
    earth: {
        name: 'Earth',
        diameter: 12742,
        density: 5.514,
        albedo: 0.30,
        temperature: 288,
        magnitude: -3.2,
        mass: 5.972e24,
        gravity: 9.81,
        period: 1.0,
        semi_major_axis: 1.0,
        eccentricity: 0.0167,
        inclination: 0.0
    },
    mars: {
        name: 'Mars',
        diameter: 6779,
        density: 3.933,
        albedo: 0.16,
        temperature: 210,
        magnitude: -1.5,
        mass: 6.417e23,
        gravity: 3.71,
        period: 1.88,
        semi_major_axis: 1.524,
        eccentricity: 0.0934,
        inclination: 1.85
    },
    jupiter: {
        name: 'Jupiter',
        diameter: 139820,
        density: 1.326,
        albedo: 0.52,
        temperature: 128,
        magnitude: -2.7,
        mass: 1.898e27,
        gravity: 24.79,
        period: 11.86,
        semi_major_axis: 5.203,
        eccentricity: 0.0489,
        inclination: 1.30
    },
    saturn: {
        name: 'Saturn',
        diameter: 116460,
        density: 0.687,
        albedo: 0.47,
        temperature: 97,
        magnitude: -0.5,
        mass: 5.683e26,
        gravity: 10.44,
        period: 29.46,
        semi_major_axis: 9.537,
        eccentricity: 0.0565,
        inclination: 2.49
    },
    uranus: {
        name: 'Uranus',
        diameter: 50724,
        density: 1.27,
        albedo: 0.51,
        temperature: 59,
        magnitude: 5.5,
        mass: 8.681e25,
        gravity: 8.87,
        period: 84.01,
        semi_major_axis: 19.191,
        eccentricity: 0.0457,
        inclination: 0.77
    },
    neptune: {
        name: 'Neptune',
        diameter: 49244,
        density: 1.638,
        albedo: 0.41,
        temperature: 48,
        magnitude: 7.8,
        mass: 1.024e26,
        gravity: 11.15,
        period: 164.8,
        semi_major_axis: 30.069,
        eccentricity: 0.0113,
        inclination: 1.77
    },
    ceres: {
        name: 'Ceres',
        diameter: 946,
        density: 2.16,
        albedo: 0.09,
        temperature: 167,
        magnitude: 6.7,
        mass: 9.39e20,
        gravity: 0.28,
        period: 4.6,
        semi_major_axis: 2.77,
        eccentricity: 0.076,
        inclination: 10.59
    },
    pluto: {
        name: 'Pluto',
        diameter: 2377,
        density: 1.86,
        albedo: 0.52,
        temperature: 44,
        magnitude: 15.1,
        mass: 1.309e22,
        gravity: 0.62,
        period: 248.0,
        semi_major_axis: 39.482,
        eccentricity: 0.2488,
        inclination: 17.16
    },
    pallas: {
        name: 'Pallas',
        diameter: 512,
        density: 2.7,
        albedo: 0.16,
        temperature: 170,
        magnitude: 8.0,
        mass: 2.11e20,
        gravity: 0.21,
        period: 4.6,
        semi_major_axis: 2.77,
        eccentricity: 0.231,
        inclination: 34.8
    },
    vesta: {
        name: 'Vesta',
        diameter: 525,
        density: 3.46,
        albedo: 0.42,
        temperature: 180,
        magnitude: 6.5,
        mass: 2.59e20,
        gravity: 0.22,
        period: 3.63,
        semi_major_axis: 2.36,
        eccentricity: 0.089,
        inclination: 7.14
    }
};

// ============================================================================
// ЭКСПОРТ ВСЕХ КОНФИГУРАЦИЙ
// ============================================================================

export default {
    IMCCE_CONFIG,
    TIMEOUT_CONFIG,
    FILE_MODE_CONFIG,
    OBSERVER_CONFIG,
    PROBLEMATIC_OBJECTS,
    OBJECT_PREFIXES,
    OBJECT_TYPES,
    ASTEROID_CLASSES,
    COMET_CLASSES,
    DEFAULT_PARAMS,
    CACHE_TTL,
    FALLBACK_DATABASE,
    FALLBACK_PHYSICAL
};