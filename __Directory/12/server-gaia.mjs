// /10/map/server-gaia.mjs - Основные запросы к Gaia DR3
// ВЕРСИЯ 4.3 - ИСПРАВЛЕНИЕ: удалены несуществующие колонки teff_val, radius_val, luminosity_val
// 100% СИМВОЛОВ

import axios from 'axios';
import {
    DATA_SOURCES,
    sessions,
    requestStats,
    colors,
    sourceHealthCache
} from './server-config.mjs';
import { parseTAPResponse, normalizeCoordinates } from './server-parser.mjs';
import { ensureEsaSession } from './server-auth.mjs';
import { getWorkingSource } from './server-health.mjs';
import { createServiceError } from './server-imcce-utils.mjs';

// ============================================================================
// АДАПТАЦИЯ ЗАПРОСОВ ПОД РАЗНЫЕ ИСТОЧНИКИ
// ============================================================================

function adaptQueryForSource(query, sourceKey) {
    let adapted = query;
    const source = DATA_SOURCES[sourceKey];

    if (sourceKey === 'mast') {
        adapted = adapted.replace(/FROM\\s+(gaiadr3|gaia_dr3)\\.gaia_source/gi, 'FROM dbo.gaia_source');
        adapted = adapted.replace(/FROM\\s+gaia_source/gi, 'FROM dbo.gaia_source');
        adapted = adapted.replace(/LIMIT\\s+(\\d+)/gi, 'TOP $1');
    }
    else if (sourceKey === 'cadc') {
        adapted = adapted.replace(/FROM\\s+gaiadr3\\.gaia_source/gi, 'FROM gaia_dr3.gaia_source');
        adapted = adapted.replace(/FROM\\s+dbo\\.gaia_source/gi, 'FROM gaia_dr3.gaia_source');
    }
    else {
        adapted = adapted.replace(/FROM\\s+gaia_dr3\\.gaia_source/gi, 'FROM gaiadr3.gaia_source');
        adapted = adapted.replace(/FROM\\s+dbo\\.gaia_source/gi, 'FROM gaiadr3.gaia_source');
    }

    if (sourceKey === 'mast' || sourceKey === 'cds' || sourceKey === 'heasarc' || sourceKey === 'cadc') {
        adapted = adapted.replace(/LIMIT\\s+(\\d+)/gi, 'TOP $1');
    }

    return adapted;
}

// ============================================================================
// ПРАВИЛЬНЫЙ ЗАПРОС К MAST API
// ============================================================================

async function executeMastQuery(query, options = {}) {
    const { timeout = 30000, format = 'json' } = options;
    const source = DATA_SOURCES.mast;

    let adaptedQuery = query;
    adaptedQuery = adaptedQuery.replace(/LIMIT\\s+(\\d+)/gi, 'TOP $1');

    if (!adaptedQuery.includes('dbo.gaia_source')) {
        adaptedQuery = adaptedQuery.replace(/FROM\\s+(\\w+\\.)?gaia_source/gi, 'FROM dbo.gaia_source');
    }

    console.log(`${colors.fg.cyan}📡 MAST Query:${colors.reset}`);
    console.log(`   ${adaptedQuery.substring(0, 200)}...`);

    const params = new URLSearchParams();
    params.append('REQUEST', 'doQuery');
    params.append('LANG', 'ADQL');
    params.append('QUERY', adaptedQuery);

    if (format === 'json') {
        params.append('FORMAT', 'json');
    }

    try {
        const response = await axios({
            method: 'POST',
            url: `${source.url}/sync`,
            data: params.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'GaiaDR3-StarMap/4.3'
            },
            timeout: timeout,
            validateStatus: status => status < 500
        });

        return response;
    } catch (error) {
        console.error(`${colors.fg.red}❌ MAST query error:${colors.reset}`, error.message);
        throw error;
    }
}

// ============================================================================
// ПАРСИНГ ОТВЕТА MAST (VOTable)
// ============================================================================
function parseMastVOTable(xmlData) {
    try {
        const xmlStr = typeof xmlData === 'string' ? xmlData : xmlData.toString('utf-8');

        if (xmlStr.includes('QUERY_STATUS" value="ERROR')) {
            const errorMatch = xmlStr.match(/<INFO name="QUERY_STATUS" value="ERROR">\s*([^<]+)/);
            const errorMsg = errorMatch ? errorMatch[1].trim() : 'Unknown MAST error';
            console.error(`   ⚠️ MAST Error: ${errorMsg}`);
            return { data: [], error: errorMsg, format: 'votable' };
        }

        if (!xmlStr.includes('QUERY_STATUS" value="OK')) {
            return { data: [], error: 'Query failed', format: 'votable' };
        }

        const fieldPattern = /<FIELD name="([^"]+)"[^>]*>/g;
        const fields = [];
        let fieldMatch;

        while ((fieldMatch = fieldPattern.exec(xmlStr)) !== null) {
            fields.push(fieldMatch[1]);
        }

        // ИСПРАВЛЕННЫЕ РЕГУЛЯРНЫЕ ВЫРАЖЕНИЯ (без флага s)
        const rowPattern = /<TR>([\s\S]*?)<\/TR>/g;
        const tdPattern = /<TD>([\s\S]*?)<\/TD>/g;

        const rows = [];
        let rowMatch;

        while ((rowMatch = rowPattern.exec(xmlStr)) !== null) {
            const rowContent = rowMatch[1];
            const values = [];
            let tdMatch;

            tdPattern.lastIndex = 0;
            while ((tdMatch = tdPattern.exec(rowContent)) !== null) {
                let value = tdMatch[1];
                if (value && !isNaN(parseFloat(value)) && isFinite(value)) {
                    const num = parseFloat(value);
                    if (num.toString() === value) {
                        value = num;
                    }
                }
                values.push(value);
            }

            if (values.length > 0) {
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
        console.error(`   ⚠️ Error parsing MAST VOTable:`, error.message);
        return { data: [], error: error.message, format: 'votable' };
    }
}

// ============================================================================
// КЭШИРОВАНИЕ ЗАПРОСОВ
// ============================================================================

const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(query, options = {}) {
    return `${query}_${options.format || 'json'}_${options.timeout || 30000}`;
}

function cleanCache() {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            queryCache.delete(key);
        }
    }
}

setInterval(cleanCache, 60 * 1000);

// ============================================================================
// ВАЛИДАЦИЯ ЗАПРОСОВ
// ============================================================================

export function validateAdqlQuery(query) {
    if (!query || typeof query !== 'string') {
        return { valid: false, error: 'Запрос должен быть строкой' };
    }

    const queryUpper = query.toUpperCase();

    if (queryUpper.includes('DROP ') ||
        queryUpper.includes('DELETE ') ||
        queryUpper.includes('UPDATE ') ||
        queryUpper.includes('INSERT ') ||
        queryUpper.includes('ALTER ')) {
        return { valid: false, error: 'Запрос содержит недопустимые операции' };
    }

    if (!queryUpper.includes('SELECT')) {
        return { valid: false, error: 'Запрос должен содержать SELECT' };
    }

    if (!queryUpper.includes('FROM')) {
        return { valid: false, error: 'Запрос должен содержать FROM' };
    }

    const limitMatch = queryUpper.match(/LIMIT\\s+(\\d+)/i);
    if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        if (limit > 100000) {
            return {
                valid: false,
                error: 'Превышен максимальный лимит записей (100000)',
                suggested: 'Используйте LIMIT 10000 или меньше'
            };
        }
    }

    return { valid: true };
}

export function optimizeAdqlQuery(query) {
    let optimized = query;

    if (optimized.toUpperCase().includes('ORDER BY') &&
        !optimized.toUpperCase().includes('TOP ') &&
        !optimized.toUpperCase().includes('LIMIT')) {
        optimized = optimized.replace(/SELECT/i, 'SELECT TOP 5000');
    }

    if (!optimized.toUpperCase().includes('PHOT_G_MEAN_MAG') &&
        optimized.toUpperCase().includes('GAIA_SOURCE')) {

        if (optimized.toUpperCase().includes('WHERE')) {
            optimized = optimized.replace(/WHERE/i, 'WHERE phot_g_mean_mag < 18 AND');
        } else {
            optimized = optimized.replace(/FROM\\s+gaia_source/i,
                'FROM gaia_source WHERE phot_g_mean_mag < 18');
        }
    }

    return optimized;
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ ВЫПОЛНЕНИЯ ЗАПРОСОВ
// ============================================================================

export async function executeQueryWithFailover(query, options = {}) {
    const {
        timeout = 30000,
        format = 'json',
        maxRetries = 3,
        useCache = true,
        validate = true
    } = options;

    if (validate) {
        const validation = validateAdqlQuery(query);
        if (!validation.valid) {
            throw new Error(`Невалидный запрос: ${validation.error}`);
        }
    }

    const cacheKey = getCacheKey(query, options);
    if (useCache && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`${colors.fg.cyan}📦 Использован кэшированный результат${colors.reset}`);
            requestStats.cacheHits = (requestStats.cacheHits || 0) + 1;
            return cached.data;
        }
        queryCache.delete(cacheKey);
    }

    requestStats.total++;

    for (let retry = 0; retry < maxRetries; retry++) {
        try {
            const { key, source } = await getWorkingSource();
            const adaptedQuery = adaptQueryForSource(query, key);

            console.log(`${colors.fg.cyan}📡 Выполнение запроса через ${source.name}...${colors.reset}`);

            let response;
            let parsedData;
            let startTime = Date.now();

            if (key === 'mast') {
                response = await executeMastQuery(adaptedQuery, { timeout, format });
                parsedData = parseMastVOTable(response.data);
            } else {
                const headers = {
                    'User-Agent': 'GaiaDR3-StarMap/4.3',
                    'Accept': 'application/json, text/xml, */*'
                };

                if (key === 'esa' && sessions.esa.cookies) {
                    headers['Cookie'] = sessions.esa.cookies;
                    await ensureEsaSession();
                }

                response = await axios({
                    method: 'POST',
                    url: `${source.url}/sync`,
                    params: {
                        REQUEST: 'doQuery',
                        LANG: 'ADQL',
                        FORMAT: format === 'json' ? 'votable' : format,
                        QUERY: adaptedQuery
                    },
                    headers: headers,
                    timeout: timeout,
                    validateStatus: status => status < 500,
                    withCredentials: key === 'esa'
                });

                parsedData = await parseTAPResponse(response, key);
            }

            const responseTime = Date.now() - startTime;

            const result = {
                success: true,
                data: parsedData.data || parsedData,
                source: source.name,
                sourceKey: key,
                responseTime: responseTime,
                status: response.status
            };

            if (useCache && result.data && (!Array.isArray(result.data) || result.data.length > 0)) {
                queryCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            requestStats.successful++;
            if (!requestStats.bySource[key]) {
                requestStats.bySource[key] = { success: 0, used: 0 };
            }
            requestStats.bySource[key].success++;

            console.log(`${colors.fg.green}✅ Ответ получен от ${source.name} за ${responseTime}ms${colors.reset}`);

            return result;

        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка (попытка ${retry + 1}/${maxRetries}):${colors.reset}`, error.message);

            if (error.response) {
                console.error(`   Статус: ${error.response.status}`);
                if (error.response.data) {
                    const dataStr = error.response.data.toString().substring(0, 200);
                    console.error(`   Ответ: ${dataStr}`);
                }
            }

            requestStats.failed++;

            if (retry === maxRetries - 1) {
                throw new Error(`Не удалось выполнить запрос: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retry)));
        }
    }
}

// ============================================================================
// 1. ЛУЧШИЕ ЗВЕЗДЫ
// ============================================================================

export async function getBestStars(limit = 2000) {
    const actualLimit = Math.min(parseInt(limit), 50000);

    const query = `
        SELECT TOP ${actualLimit}
            ra, dec, phot_g_mean_mag, bp_rp,
            pmra, pmdec, parallax, radial_velocity
        FROM dbo.gaia_source
        WHERE phot_g_mean_mag < 16
          AND ra IS NOT NULL
          AND dec IS NOT NULL
          AND parallax IS NOT NULL
        ORDER BY phot_g_mean_mag ASC
    `;

    console.log(`${colors.fg.cyan}🔭 Загрузка ${actualLimit} лучших звезд...${colors.reset}`);

    try {
        const result = await executeQueryWithFailover(query, { timeout: 60000, format: 'json' });

        let stars = [];
        const data = result.data;

        if (Array.isArray(data)) {
            stars = data.map(row => {
                let raVal, decVal, magVal, colorVal, pmraVal, pmdecVal, parallaxVal, rvVal;

                if (Array.isArray(row)) {
                    raVal = parseFloat(row[0]);
                    decVal = parseFloat(row[1]);
                    magVal = parseFloat(row[2]);
                    colorVal = parseFloat(row[3]);
                    pmraVal = parseFloat(row[4]);
                    pmdecVal = parseFloat(row[5]);
                    parallaxVal = parseFloat(row[6]);
                    rvVal = parseFloat(row[7]);
                } else {
                    raVal = parseFloat(row.ra);
                    decVal = parseFloat(row.dec);
                    magVal = parseFloat(row.phot_g_mean_mag);
                    colorVal = parseFloat(row.bp_rp);
                    pmraVal = parseFloat(row.pmra);
                    pmdecVal = parseFloat(row.pmdec);
                    parallaxVal = parseFloat(row.parallax);
                    rvVal = parseFloat(row.radial_velocity);
                }

                const coords = normalizeCoordinates(raVal || 0, decVal || 0);

                return {
                    ra: coords.ra,
                    dec: coords.dec,
                    mag: magVal || 0,
                    color: colorVal || 0,
                    pmra: pmraVal || 0,
                    pmdec: pmdecVal || 0,
                    parallax: parallaxVal || 0,
                    radial_velocity: rvVal || 0,
                    source: result.source
                };
            });
        }

        return {
            success: true,
            data: stars,
            count: stars.length,
            source: result.source,
            responseTime: result.responseTime,
            query: 'best_stars'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка getBestStars:${colors.reset}`, error.message);
        throw createServiceError('Gaia getBestStars', error, {
            limit: actualLimit,
            query: 'best_stars'
        });
    }
}

// ============================================================================
// 1.1 ЛУЧШИЕ ЗВЕЗДЫ С ФИЗИЧЕСКИМИ ПАРАМЕТРАМИ (teff, radius)
// ============================================================================
// ============================================================================
// 1.1 ЛУЧШИЕ ЗВЕЗДЫ С ФИЗИЧЕСКИМИ ПАРАМЕТРАМИ (teff, radius)
// ============================================================================

// ============================================================================
// 1.1 ЛУЧШИЕ ЗВЕЗДЫ С ФИЗИЧЕСКИМИ ПАРАМЕТРАМИ (teff, radius)
// ============================================================================

export async function getBestStarsWithPhysics(limit = 2000) {
    const actualLimit = Math.min(parseInt(limit), 50000);

    const query = `SELECT TOP ${actualLimit}
        g.ra, 
        g.dec, 
        a.teff_gspphot,
        a.radius_gspphot,
        a.lum_flame,
        a.logg_gspphot,
        a.mh_gspphot,
        a.distance_gspphot,
        a.mass_flame,
        a.age_flame
    FROM dbo.gaia_source g
    INNER JOIN dbo.astrophysical_parameters a ON g.source_id = a.source_id
    WHERE g.phot_g_mean_mag < 16
      AND a.teff_gspphot IS NOT NULL
      AND a.radius_gspphot IS NOT NULL
      AND g.ra IS NOT NULL
      AND g.dec IS NOT NULL
    ORDER BY g.phot_g_mean_mag ASC`;

    console.log(`${colors.fg.cyan}🔭 Загрузка ${actualLimit} лучших звезд с физическими параметрами...${colors.reset}`);

    try {
        const axiosModule = await import('axios');
        const axiosInstance = axiosModule.default;

        const params = new URLSearchParams();
        params.append('REQUEST', 'doQuery');
        params.append('LANG', 'ADQL');
        params.append('FORMAT', 'json');
        params.append('QUERY', query);

        const response = await axiosInstance({
            method: 'POST',
            url: 'https://mast.stsci.edu/vo-tap/api/v0.1/gaiadr3/sync',
            data: params.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'GaiaDR3-StarMap/1.0'
            },
            timeout: 60000,
            validateStatus: status => status < 500
        });

        const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        // Парсим VOTable ответ
        const rowPattern = /<TR>([\s\S]*?)<\/TR>/g;
        const tdPattern = /<TD>([\s\S]*?)<\/TD>/g;

        const stars = [];
        let rowMatch;

        while ((rowMatch = rowPattern.exec(dataStr)) !== null) {
            const rowContent = rowMatch[1];
            const values = [];
            let tdMatch;

            tdPattern.lastIndex = 0;
            while ((tdMatch = tdPattern.exec(rowContent)) !== null) {
                let value = tdMatch[1];
                // Пустые значения становятся null
                if (value === undefined || value === null || value === '') {
                    value = null;
                } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
                    const num = parseFloat(value);
                    if (num.toString() === value) {
                        value = num;
                    }
                }
                values.push(value);
            }

            if (values.length >= 10) {
                stars.push({
                    ra: parseFloat(values[0]) || 0,
                    dec: parseFloat(values[1]) || 0,
                    teff: values[2] !== null ? parseFloat(values[2]) : null,
                    radius: values[3] !== null ? parseFloat(values[3]) : null,
                    luminosity: values[4] !== null ? parseFloat(values[4]) : null,
                    logg: values[5] !== null ? parseFloat(values[5]) : null,
                    metallicity: values[6] !== null ? parseFloat(values[6]) : null,
                    distance: values[7] !== null ? parseFloat(values[7]) : null,
                    mass: values[8] !== null ? parseFloat(values[8]) : null,
                    age: values[9] !== null ? parseFloat(values[9]) : null,
                    source: 'MAST Gaia DR3'
                });
            }
        }

        console.log(`${colors.fg.green}✅ Получено ${stars.length} звезд с физическими параметрами${colors.reset}`);

        if (stars.length > 0) {
            const withTeff = stars.filter(s => s.teff !== null).length;
            const withRadius = stars.filter(s => s.radius !== null).length;
            const withDistance = stars.filter(s => s.distance !== null).length;
            const withMass = stars.filter(s => s.mass !== null).length;
            const withAge = stars.filter(s => s.age !== null).length;

            console.log(`   📊 Статистика:`);
            console.log(`      • Teff: ${withTeff}/${stars.length}`);
            console.log(`      • Radius: ${withRadius}/${stars.length}`);
            console.log(`      • Distance: ${withDistance}/${stars.length}`);
            console.log(`      • Mass: ${withMass}/${stars.length}`);
            console.log(`      • Age: ${withAge}/${stars.length}`);
        }

        return {
            success: true,
            data: stars,
            count: stars.length,
            source: 'MAST Gaia DR3',
            responseTime: 0,
            query: 'best_stars_with_physics'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка getBestStarsWithPhysics:${colors.reset}`, error.message);
        throw createServiceError('Gaia getBestStarsWithPhysics', error, {
            limit: actualLimit,
            query: 'best_stars_with_physics'
        });
    }
}
// ============================================================================
// 2. КОНИЧЕСКИЙ ПОИСК (CONE SEARCH)
// ============================================================================

export async function coneSearch(ra, dec, radius, limit = 500) {
    const actualLimit = Math.min(parseInt(limit), 10000);

    const query = `
        SELECT TOP ${actualLimit}
            ra, dec, phot_g_mean_mag, bp_rp,
            pmra, pmdec, parallax, radial_velocity
        FROM dbo.gaia_source
        WHERE 1=CONTAINS(
            POINT('ICRS', ra, dec),
            CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
            )
          AND phot_g_mean_mag < 18
        ORDER BY phot_g_mean_mag ASC
    `;

    console.log(`${colors.fg.cyan}🔭 Cone search: RA=${ra}°, Dec=${dec}°, Radius=${radius}°${colors.reset}`);

    try {
        const result = await executeQueryWithFailover(query, { timeout: 60000 });

        let stars = [];
        const data = result.data;

        if (Array.isArray(data)) {
            stars = data.map(row => {
                let raVal, decVal, magVal;

                if (Array.isArray(row)) {
                    raVal = parseFloat(row[0]);
                    decVal = parseFloat(row[1]);
                    magVal = parseFloat(row[2]);
                } else {
                    raVal = parseFloat(row.ra);
                    decVal = parseFloat(row.dec);
                    magVal = parseFloat(row.phot_g_mean_mag);
                }

                const coords = normalizeCoordinates(raVal || 0, decVal || 0);

                const raRad = coords.ra * Math.PI / 180;
                const decRad = coords.dec * Math.PI / 180;
                const centerRaRad = ra * Math.PI / 180;
                const centerDecRad = dec * Math.PI / 180;

                const angularDistance = Math.acos(
                    Math.sin(decRad) * Math.sin(centerDecRad) +
                    Math.cos(decRad) * Math.cos(centerDecRad) *
                    Math.cos(raRad - centerRaRad)
                ) * 180 / Math.PI;

                return {
                    ra: coords.ra,
                    dec: coords.dec,
                    mag: magVal || 0,
                    angular_distance: angularDistance,
                    source: result.source
                };
            });
        }

        return {
            success: true,
            data: stars,
            count: stars.length,
            center: { ra, dec },
            radius,
            source: result.source,
            responseTime: result.responseTime,
            query: 'cone_search'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка coneSearch:${colors.reset}`, error.message);
        throw createServiceError('Gaia coneSearch', error, {
            ra, dec, radius, limit: actualLimit,
            query: 'cone_search'
        });
    }
}

// ============================================================================
// 3. РЕГИОНАЛЬНЫЙ ПОИСК
// ============================================================================

export async function regionSearch({ minX, maxX, minY, maxY, minZ = 0, maxZ = 1000, limit = 5000 }) {
    const actualLimit = Math.min(parseInt(limit), 50000);

    const query = `
        SELECT TOP ${actualLimit}
            ra, dec, phot_g_mean_mag, bp_rp,
            pmra, pmdec, parallax, radial_velocity
        FROM dbo.gaia_source
        WHERE ra BETWEEN ${minX} AND ${maxX}
          AND dec BETWEEN ${minY} AND ${maxY}
          AND parallax BETWEEN ${minZ} AND ${maxZ}
          AND phot_g_mean_mag BETWEEN 0 AND 18
        ORDER BY phot_g_mean_mag ASC
    `;

    console.log(`${colors.fg.cyan}🔭 Region search: RA=[${minX},${maxX}], Dec=[${minY},${maxY}]${colors.reset}`);

    try {
        const result = await executeQueryWithFailover(query, { timeout: 120000 });

        let stars = [];
        const data = result.data;

        if (Array.isArray(data)) {
            stars = data.map(row => {
                let raVal, decVal, magVal, colorVal, pmraVal, pmdecVal, parallaxVal, rvVal;

                if (Array.isArray(row)) {
                    raVal = parseFloat(row[0]);
                    decVal = parseFloat(row[1]);
                    magVal = parseFloat(row[2]);
                    colorVal = parseFloat(row[3]);
                    pmraVal = parseFloat(row[4]);
                    pmdecVal = parseFloat(row[5]);
                    parallaxVal = parseFloat(row[6]);
                    rvVal = parseFloat(row[7]);
                } else {
                    raVal = parseFloat(row.ra);
                    decVal = parseFloat(row.dec);
                    magVal = parseFloat(row.phot_g_mean_mag);
                    colorVal = parseFloat(row.bp_rp);
                    pmraVal = parseFloat(row.pmra);
                    pmdecVal = parseFloat(row.pmdec);
                    parallaxVal = parseFloat(row.parallax);
                    rvVal = parseFloat(row.radial_velocity);
                }

                const coords = normalizeCoordinates(raVal || 0, decVal || 0);

                return {
                    ra: coords.ra,
                    dec: coords.dec,
                    mag: magVal || 0,
                    color: colorVal || 0,
                    pmra: pmraVal || 0,
                    pmdec: pmdecVal || 0,
                    parallax: parallaxVal || 0,
                    radial_velocity: rvVal || 0,
                    source: result.source
                };
            });
        }

        return {
            success: true,
            region: { minX, maxX, minY, maxY, minZ, maxZ },
            data: stars,
            count: stars.length,
            source: result.source,
            responseTime: result.responseTime,
            query: 'region_search'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка regionSearch:${colors.reset}`, error.message);
        throw createServiceError('Gaia regionSearch', error, {
            region: { minX, maxX, minY, maxY, minZ, maxZ, limit: actualLimit },
            query: 'region_search'
        });
    }
}

// ============================================================================
// 4. ПОИСК ПО СОБСТВЕННОМУ ДВИЖЕНИЮ
// ============================================================================

export async function searchByProperMotion(minPm = 100, limit = 1000) {
    const actualLimit = Math.min(parseInt(limit), 10000);

    const query = `
        SELECT TOP ${actualLimit}
            ra, dec, phot_g_mean_mag, bp_rp,
            pmra, pmdec, parallax
        FROM dbo.gaia_source
        WHERE (ABS(pmra) > ${minPm} OR ABS(pmdec) > ${minPm})
          AND phot_g_mean_mag < 18
        ORDER BY (ABS(pmra) + ABS(pmdec)) DESC
    `;

    console.log(`${colors.fg.cyan}🔭 Поиск по собственному движению (min=${minPm} mas/yr)...${colors.reset}`);

    try {
        const result = await executeQueryWithFailover(query, { timeout: 60000 });

        let stars = [];
        const data = result.data;

        if (Array.isArray(data)) {
            stars = data.map(row => {
                let raVal, decVal, magVal, colorVal, pmraVal, pmdecVal, parallaxVal;

                if (Array.isArray(row)) {
                    raVal = parseFloat(row[0]);
                    decVal = parseFloat(row[1]);
                    magVal = parseFloat(row[2]);
                    colorVal = parseFloat(row[3]);
                    pmraVal = parseFloat(row[4]);
                    pmdecVal = parseFloat(row[5]);
                    parallaxVal = parseFloat(row[6]);
                } else {
                    raVal = parseFloat(row.ra);
                    decVal = parseFloat(row.dec);
                    magVal = parseFloat(row.phot_g_mean_mag);
                    colorVal = parseFloat(row.bp_rp);
                    pmraVal = parseFloat(row.pmra);
                    pmdecVal = parseFloat(row.pmdec);
                    parallaxVal = parseFloat(row.parallax);
                }

                const coords = normalizeCoordinates(raVal || 0, decVal || 0);

                return {
                    ra: coords.ra,
                    dec: coords.dec,
                    mag: magVal || 0,
                    color: colorVal || 0,
                    pmra: pmraVal || 0,
                    pmdec: pmdecVal || 0,
                    parallax: parallaxVal || 0,
                    total_pm: Math.sqrt(
                        Math.pow(pmraVal || 0, 2) +
                        Math.pow(pmdecVal || 0, 2)
                    ),
                    source: result.source
                };
            });
        }

        return {
            success: true,
            data: stars,
            count: stars.length,
            min_proper_motion: minPm,
            source: result.source,
            responseTime: result.responseTime,
            query: 'proper_motion_search'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка searchByProperMotion:${colors.reset}`, error.message);
        throw createServiceError('Gaia searchByProperMotion', error, {
            minPm, limit: actualLimit,
            query: 'proper_motion_search'
        });
    }
}

// ============================================================================
// 5. ИНФОРМАЦИЯ О ЗВЕЗДЕ ПО КООРДИНАТАМ
// ============================================================================

export async function getStarInfo(ra, dec, radius = 1) {
    const radiusDeg = radius / 3600;

    const query = `
        SELECT TOP 1
            ra, dec, phot_g_mean_mag, bp_rp,
            pmra, pmdec, parallax, radial_velocity
        FROM dbo.gaia_source
        WHERE 1=CONTAINS(
            POINT('ICRS', ra, dec),
            CIRCLE('ICRS', ${ra}, ${dec}, ${radiusDeg})
            )
    `;

    try {
        const result = await executeQueryWithFailover(query, { timeout: 30000 });

        if (result.data && result.data.length > 0) {
            const row = result.data[0];

            let raVal, decVal, magVal, colorVal, pmraVal, pmdecVal, parallaxVal, rvVal;

            if (Array.isArray(row)) {
                raVal = parseFloat(row[0]);
                decVal = parseFloat(row[1]);
                magVal = parseFloat(row[2]);
                colorVal = parseFloat(row[3]);
                pmraVal = parseFloat(row[4]);
                pmdecVal = parseFloat(row[5]);
                parallaxVal = parseFloat(row[6]);
                rvVal = parseFloat(row[7]);
            } else {
                raVal = parseFloat(row.ra);
                decVal = parseFloat(row.dec);
                magVal = parseFloat(row.phot_g_mean_mag);
                colorVal = parseFloat(row.bp_rp);
                pmraVal = parseFloat(row.pmra);
                pmdecVal = parseFloat(row.pmdec);
                parallaxVal = parseFloat(row.parallax);
                rvVal = parseFloat(row.radial_velocity);
            }

            const coords = normalizeCoordinates(raVal || 0, decVal || 0);

            return {
                success: true,
                star: {
                    ra: coords.ra,
                    dec: coords.dec,
                    mag: magVal || 0,
                    color: colorVal || 0,
                    pmra: pmraVal || 0,
                    pmdec: pmdecVal || 0,
                    parallax: parallaxVal || 0,
                    radial_velocity: rvVal || 0
                },
                source: result.source
            };
        }

        return {
            success: false,
            error: 'Звезда не найдена в указанной области'
        };

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка getStarInfo:${colors.reset}`, error.message);
        throw createServiceError('Gaia getStarInfo', error, {
            ra, dec, radius,
            query: 'star_info'
        });
    }
}

// ============================================================================
// СТАТИСТИКА И УПРАВЛЕНИЕ
// ============================================================================

export function getQueryStats() {
    const cacheStats = {
        size: queryCache.size,
        hits: requestStats.cacheHits || 0,
        ttl: CACHE_TTL / 1000 + 's'
    };

    const sourceStats = {};
    for (const [key, source] of Object.entries(DATA_SOURCES)) {
        sourceStats[key] = {
            name: source.name,
            status: source.status,
            responseTime: source.responseTime,
            lastSuccess: source.lastSuccess,
            lastError: source.lastError
        };
    }

    return {
        requests: {
            total: requestStats.total,
            successful: requestStats.successful,
            failed: requestStats.failed,
            successRate: requestStats.total ?
                Math.round((requestStats.successful / requestStats.total) * 100) : 0
        },
        cache: cacheStats,
        sources: sourceStats,
        bySource: requestStats.bySource
    };
}

export function clearQueryCache() {
    queryCache.clear();
    console.log(`${colors.fg.yellow}🗑️ Кэш запросов очищен${colors.reset}`);
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
    executeQueryWithFailover,
    getBestStars,
    getBestStarsWithPhysics,
    coneSearch,
    regionSearch,
    searchByProperMotion,
    getStarInfo,
    validateAdqlQuery,
    optimizeAdqlQuery,
    getQueryStats,
    clearQueryCache,
    adaptQueryForSource
};