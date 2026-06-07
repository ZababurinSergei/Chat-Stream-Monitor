// /10/map/server-routes.mjs - ИСПРАВЛЕННАЯ ВЕРСИЯ

import express from 'express';
import axios from 'axios';
import path from 'path.js';
import { fileURLToPath } from 'url.js';
import {
    PORT,
    sessions,
    colors,
    getSourcesStatus,
    getRequestStats
} from './server-config.mjs';
import { getEsaAuthStatus, loginToEsa, logoutFromEsa, updateEsaCredentials } from './server-auth.mjs';
import { checkAllSources, setSourceEnabled } from './server-health.mjs';
import { getBestStars, coneSearch, regionSearch, executeQueryWithFailover } from './server-gaia.mjs';
import { setupImcceRoutes } from './server-imcce.mjs';
import { createServiceError } from './server-imcce-utils.mjs';
import { parseMastVOTable } from './server-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function bpRpToRgb(bp_rp) {
    if (bp_rp === undefined || bp_rp === null) return 0xFFFFFFFF;

    let temp;
    if (bp_rp < 0) temp = 30000;
    else if (bp_rp < 0.5) temp = 8000 - bp_rp * 4000;
    else if (bp_rp < 1.0) temp = 6000 - (bp_rp - 0.5) * 2000;
    else if (bp_rp < 1.5) temp = 5000 - (bp_rp - 1.0) * 2000;
    else temp = 4000 - (bp_rp - 1.5) * 1000;
    temp = Math.max(2000, Math.min(30000, temp));

    let t = temp / 100;
    let r, g, b;

    if (t <= 66) {
        r = 1.0;
        g = Math.min(1, Math.max(0, 0.390081578769019 * Math.log(t) - 0.631841443782627));
        b = t <= 19 ? 0 : Math.min(1, Math.max(0, 0.543206789110196 * Math.log(t - 10) - 1.196254089142308));
    } else {
        r = Math.min(1, Math.max(0, 1.292936186062745 * Math.pow(t - 60, -0.1332047592)));
        g = Math.min(1, Math.max(0, 1.129890860895294 * Math.pow(t - 60, -0.0755148492)));
        b = 1.0;
    }

    return (Math.round(r * 255) << 24) |
        (Math.round(g * 255) << 16) |
        (Math.round(b * 255) << 8) | 0xFF;
}

function getSpectralTypeFromTeff(teff) {
    if (!teff) return 'G';
    if (teff > 30000) return 'O';
    if (teff > 10000) return 'B';
    if (teff > 7500) return 'A';
    if (teff > 6000) return 'F';
    if (teff > 5200) return 'G';
    if (teff > 3700) return 'K';
    return 'M';
}

// ============================================================================
// НАСТРОЙКА МАРШРУТОВ
// ============================================================================

export function setupRoutes(app) {
    console.log(`${colors.fg.cyan}🔌 Настройка маршрутов API...${colors.reset}`);

    // ============================================================================
    // GAIA API ЭНДПОИНТЫ
    // ============================================================================

    app.post('/api/gaia/best', async (req, res) => {
        try {
            const { limit = 2000 } = req.body;
            const actualLimit = Math.min(parseInt(limit), 50000);

            const query = `
                SELECT TOP ${actualLimit}
                    source_id,
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

            const result = await executeQueryWithFailover(query, { timeout: 60000, format: 'json' });

            let stars = [];
            const data = result.data;

            if (Array.isArray(data)) {
                stars = data.map(row => {
                    let source_id, raVal, decVal, magVal, colorVal, pmraVal, pmdecVal, parallaxVal, rvVal;

                    if (Array.isArray(row)) {
                        source_id = row[0] ? String(row[0]) : null;
                        raVal = parseFloat(row[1]);
                        decVal = parseFloat(row[2]);
                        magVal = parseFloat(row[3]);
                        colorVal = parseFloat(row[4]);
                        pmraVal = parseFloat(row[5]);
                        pmdecVal = parseFloat(row[6]);
                        parallaxVal = parseFloat(row[7]);
                        rvVal = parseFloat(row[8]);
                    } else {
                        source_id = row.source_id ? String(row.source_id) : null;
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
                        source_id: source_id,
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

            res.json({
                success: true,
                data: stars,
                count: stars.length,
                source: result.source,
                responseTime: result.responseTime,
                query: 'best_stars'
            });

        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/gaia/best:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Gaia DR3 API', error, {
                endpoint: '/api/gaia/best',
                limit: req.body.limit || 2000
            }));
        }
    });

    /**
     * Эндпоинт для лучших звезд с РЕАЛЬНЫМИ физическими параметрами из Gaia DR3
     * POST /api/gaia/best/physics/batch
     */
    app.post('/api/gaia/best/physics/batch', async (req, res) => {
        const startTime = Date.now();

        try {
            const { limit = 2000 } = req.body;

            console.log(`${colors.fg.cyan}🔭 Запрос лучших звезд с РЕАЛЬНОЙ физикой (limit=${limit})${colors.reset}`);

            const query = `
SELECT TOP ${limit}
    source_id,
    ra,
    dec,
    phot_g_mean_mag,
    bp_rp,
    pmra,
    pmdec,
    parallax,
    radial_velocity,
    teff_gspphot,
    logg_gspphot,
    mh_gspphot,
    ag_gspphot,
    ebpminrp_gspphot,
    phot_bp_mean_mag,
    phot_rp_mean_mag,
    nu_eff_used_in_astrometry,
    astrometric_params_solved
FROM dbo.gaia_source
WHERE phot_g_mean_mag < 16
  AND teff_gspphot IS NOT NULL
  AND ra IS NOT NULL
  AND dec IS NOT NULL
ORDER BY phot_g_mean_mag ASC
            `.trim();

            console.log(`   Выполнение ADQL запроса к MAST...`);

            const response = await executeQueryWithFailover(query, {
                timeout: 60000,
                format: 'json'
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Нет данных от MAST');
            }

            const starsData = response.data;

            console.log(`   Получено ${starsData.length} звезд с реальными физическими параметрами`);

            const formattedStars = starsData.map(star => {
                let source_id, ra, dec, mag, bp_rp, pmra, pmdec, parallax, rv;
                let teff, logg, metallicity, extinction, reddening;

                if (Array.isArray(star)) {
                    source_id = star[0] ? String(star[0]) : null;
                    ra = parseFloat(star[1]);
                    dec = parseFloat(star[2]);
                    mag = parseFloat(star[3]);
                    bp_rp = parseFloat(star[4]);
                    pmra = parseFloat(star[5]) || 0;
                    pmdec = parseFloat(star[6]) || 0;
                    parallax = parseFloat(star[7]) || 0;
                    rv = parseFloat(star[8]) || 0;
                    teff = parseFloat(star[9]);
                    logg = parseFloat(star[10]);
                    metallicity = parseFloat(star[11]);
                    extinction = parseFloat(star[12]);
                    reddening = parseFloat(star[13]);
                } else {
                    source_id = star.source_id ? String(star.source_id) : null;
                    ra = parseFloat(star.ra);
                    dec = parseFloat(star.dec);
                    mag = parseFloat(star.phot_g_mean_mag);
                    bp_rp = parseFloat(star.bp_rp);
                    pmra = parseFloat(star.pmra) || 0;
                    pmdec = parseFloat(star.pmdec) || 0;
                    parallax = parseFloat(star.parallax) || 0;
                    rv = parseFloat(star.radial_velocity) || 0;
                    teff = parseFloat(star.teff_gspphot);
                    logg = parseFloat(star.logg_gspphot);
                    metallicity = parseFloat(star.mh_gspphot);
                    extinction = parseFloat(star.ag_gspphot);
                    reddening = parseFloat(star.ebpminrp_gspphot);
                }

                const rgbColor = bpRpToRgb(bp_rp);
                const spectralType = getSpectralTypeFromTeff(teff);

                let radius = null;
                let mass = null;
                let luminosity = null;
                let distance = null;

                if (parallax > 0) {
                    distance = Math.round(1000 / parallax * 10) / 10;
                }

                if (teff && mag) {
                    const absMag = mag - 5 * Math.log10(parallax > 0 ? 1000 / parallax : 100) + 5;
                    luminosity = Math.pow(10, (4.74 - absMag) / 2.5);
                    const solarTemp = 5778;
                    radius = Math.sqrt(luminosity) * Math.pow(solarTemp / teff, 2);
                    radius = Math.round(radius * 10) / 10;
                    luminosity = Math.round(luminosity * 100) / 100;
                }

                if (spectralType === 'O') mass = 20;
                else if (spectralType === 'B') mass = 8;
                else if (spectralType === 'A') mass = 2.1;
                else if (spectralType === 'F') mass = 1.4;
                else if (spectralType === 'G') mass = 1.0;
                else if (spectralType === 'K') mass = 0.7;
                else if (spectralType === 'M') mass = 0.3;

                return {
                    source_id: source_id,
                    ra: ra,
                    dec: dec,
                    mag: mag,
                    color: rgbColor,
                    bp_rp: bp_rp,
                    pmra: pmra,
                    pmdec: pmdec,
                    parallax: parallax,
                    radial_velocity: rv || 0,
                    teff: Math.round(teff),
                    logg: Math.round(logg * 100) / 100,
                    metallicity: Math.round(metallicity * 100) / 100,
                    extinction: Math.round(extinction * 100) / 100,
                    reddening: Math.round(reddening * 100) / 100,
                    radius: radius,
                    luminosity: luminosity,
                    mass: mass,
                    distance: distance,
                    spectralType: spectralType,
                    source: 'Gaia DR3 (GSP-Phot)'
                };
            });

            const responseData = {
                success: true,
                data: formattedStars,
                count: formattedStars.length,
                source: 'Gaia DR3 (MAST)',
                hasPhysics: true,
                physicsSource: 'Gaia DR3 GSP-Phot',
                physicsFields: ['source_id', 'teff', 'logg', 'metallicity', 'extinction', 'reddening', 'radius', 'luminosity', 'mass', 'distance', 'spectralType'],
                totalTimeMs: Date.now() - startTime,
                queryType: 'single_batch_real_physics'
            };

            console.log(`${colors.fg.green}✅ Готово за ${responseData.totalTimeMs}ms, получено ${formattedStars.length} звезд${colors.reset}`);

            if (formattedStars.length > 0) {
                console.log(`   Пример: source_id=${formattedStars[0].source_id}, T=${formattedStars[0].teff}K, logg=${formattedStars[0].logg}, [Fe/H]=${formattedStars[0].metallicity}`);
            }

            // responseData.data = []


            res.json(responseData);

        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Gaia DR3 API', error, {
                endpoint: '/api/gaia/best/physics/batch',
                limit: req.body.limit || 2000
            }));
        }
    });

    app.post('/api/gaia/cone', async (req, res) => {
        try {
            const { ra, dec, radius, limit = 500 } = req.body;

            if (!ra || !dec || !radius) {
                return res.status(400).json(createServiceError('Gaia DR3 API', new Error('Параметры ra, dec, radius обязательны'), {
                    ra, dec, radius,
                    required: ['ra', 'dec', 'radius']
                }));
            }

            const result = await coneSearch(ra, dec, radius, limit);
            res.json(result);
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/gaia/cone:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Gaia DR3 Cone Search', error, {
                ra: req.body.ra,
                dec: req.body.dec,
                radius: req.body.radius,
                limit: req.body.limit || 500
            }));
        }
    });

    app.post('/api/gaia/region', async (req, res) => {
        try {
            const { minX, maxX, minY, maxY, minZ, maxZ, limit = 5000 } = req.body;

            if (minX === undefined || maxX === undefined) {
                return res.status(400).json(createServiceError('Gaia DR3 API', new Error('Параметры minX, maxX обязательны'), {
                    minX, maxX, minY, maxY
                }));
            }

            const result = await regionSearch({ minX, maxX, minY, maxY, minZ, maxZ, limit });
            res.json(result);
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/gaia/region:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Gaia DR3 Region Search', error, {
                minX: req.body.minX,
                maxX: req.body.maxX,
                minY: req.body.minY,
                maxY: req.body.maxY,
                limit: req.body.limit || 5000
            }));
        }
    });

    app.get('/api/gaia/info', (req, res) => {
        try {
            res.json({
                catalog: 'Gaia DR3',
                release: '2022',
                stars_available: 1811696991,
                columns: [
                    'source_id', 'ra', 'dec', 'phot_g_mean_mag', 'bp_rp',
                    'pmra', 'pmdec', 'parallax', 'radial_velocity',
                    'teff_gspphot', 'logg_gspphot', 'mh_gspphot',
                    'ag_gspphot', 'ebpminrp_gspphot'
                ],
                limits: {
                    max_query_rows: 5000,
                    recommended_limit: 2000,
                    async_available: true
                },
                sources: getSourcesStatus(),
                physics_endpoint: '/api/gaia/best/physics/batch'
            });
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/gaia/info:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Gaia DR3 Info', error));
        }
    });

    // ============================================================================
    // ЭНДПОИНТЫ ДЛЯ МОНИТОРИНГА
    // ============================================================================

    app.get('/api/sources/status', (req, res) => {
        try {
            res.json({
                timestamp: new Date().toISOString(),
                sources: getSourcesStatus(),
                esaAuth: getEsaAuthStatus(),
                requestStats: getRequestStats()
            });
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/sources/status:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Sources Status', error));
        }
    });

    app.post('/api/sources/check', async (req, res) => {
        try {
            const results = await checkAllSources();
            res.json(results);
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/sources/check:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Sources Check', error));
        }
    });

    app.post('/api/sources/toggle', (req, res) => {
        try {
            const { source, enabled } = req.body;

            if (!source) {
                return res.status(400).json(createServiceError('Sources Toggle', new Error('Параметр source обязателен'), {
                    source, enabled
                }));
            }

            setSourceEnabled(source, enabled);

            res.json({
                success: true,
                source,
                enabled,
                sources: getSourcesStatus()
            });
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/sources/toggle:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Sources Toggle', error, {
                source: req.body.source,
                enabled: req.body.enabled
            }));
        }
    });

    app.post('/api/auth/esa/login', async (req, res) => {
        try {
            console.log(`${colors.fg.yellow}🔑 Принудительный вход в ESA через API${colors.reset}`);

            if (req.body.username && req.body.password) {
                updateEsaCredentials(req.body.username, req.body.password);
            }

            const success = await loginToEsa();

            res.json({
                success,
                ...getEsaAuthStatus()
            });
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/auth/esa/login:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('ESA Auth Login', error));
        }
    });

    app.post('/api/auth/esa/logout', async (req, res) => {
        try {
            const result = await logoutFromEsa();
            res.json(result);
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/auth/esa/logout:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('ESA Auth Logout', error));
        }
    });

    app.get('/api/health', (req, res) => {
        try {
            const sources = getSourcesStatus();
            const workingSources = Object.values(sources).filter(s => s.status === 'ok').length;

            res.json({
                status: workingSources > 0 ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                working_sources: workingSources,
                total_sources: Object.keys(sources).length,
                ...getEsaAuthStatus(),
                endpoints: {
                    gaia: {
                        best: '/api/gaia/best (POST)',
                        best_physics: '/api/gaia/best/physics/batch (POST)',
                        cone: '/api/gaia/cone (POST)',
                        region: '/api/gaia/region (POST)',
                        info: '/api/gaia/info (GET)'
                    },
                    auth: {
                        esa_login: '/api/auth/esa/login (POST)',
                        esa_logout: '/api/auth/esa/logout (POST)'
                    },
                    status: {
                        sources: '/api/sources/status (GET)',
                        check: '/api/sources/check (POST)',
                        toggle: '/api/sources/toggle (POST)',
                        health: '/api/health (GET)'
                    }
                }
            });
        } catch (error) {
            console.error(`${colors.fg.red}❌ Ошибка /api/health:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('Health Check', error));
        }
    });

    // ============================================================================
    // NGC КАТАЛОГ
    // ============================================================================

    app.get('/api/ngc/catalog', async (req, res) => {
        try {
            console.log(`${colors.fg.cyan}🌌 Запрос NGC каталога...${colors.reset}`);

            const ngcUrl = 'https://raw.githubusercontent.com/mattiaverga/OpenNGC/refs/heads/master/database_files/NGC.csv';

            const response = await axios.get(ngcUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'GaiaDR3-StarMap/1.0',
                    'Accept': 'text/plain'
                }
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(response.data);
        } catch (error) {
            console.error(`${colors.fg.red}❌ NGC proxy error:${colors.reset}`, error.message);
            res.status(503).json(createServiceError('NGC Catalog', error, {
                source: 'GitHub OpenNGC'
            }));
        }
    });

    // ============================================================================
    // IMCCE МАРШРУТЫ
    // ============================================================================

    setupImcceRoutes(app);
    console.log(`${colors.fg.green}✅ IMCCE API маршруты подключены${colors.reset}`);

    // ============================================================================
    // СТАТИЧЕСКИЕ ФАЙЛЫ
    // ============================================================================

    app.use(express.static(path.join(__dirname, './dist')));
    app.use(express.static(path.join(__dirname, './tests')));
    app.use('/mcp',express.static(path.join(__dirname, './qwen3-mcp/dist')));
    app.use('/assets',express.static(path.join(__dirname, './qwen3-mcp/dist/assets')));

    app.get('{*splat}', (req, res) => {
        res.sendFile(path.join(__dirname, './index.html'));
    });
}

export default setupRoutes;