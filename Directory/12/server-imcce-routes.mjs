// /10/map/server-imcce-routes.mjs - Подключение всех маршрутов IMCCE
// ВЕРСИЯ 1.0 - Централизованная настройка маршрутов

import { colors } from './server-imcce-utils.mjs';
import ssodnet from './server-imcce-ssodnet.mjs';
import bft from './server-imcce-bft.mjs';
import miriade from './server-imcce-miriade.mjs';
import skybot from './server-imcce-skybot.mjs';

// ============================================================================
// ФУНКЦИЯ НАСТРОЙКИ ВСЕХ МАРШРУТОВ IMCCE
// ============================================================================

/**
 * Настройка всех маршрутов IMCCE
 * @param {Express} app - Экземпляр Express приложения
 */
export function setupImcceRoutes(app) {
    console.log(`${colors.fg.cyan}🔌 Настройка IMCCE API маршрутов...${colors.reset}`);

    // ============================================================================
    // SsODNet QUAERO и DATACLOUD
    // ============================================================================

    /**
     * Поиск объектов в SsODNet Quaero
     * GET /api/ssodnet/quaero?q=Pluto&type=Planet&limit=10
     */
    app.get('/api/ssodnet/quaero', ssodnet.quaeroSearch);

    /**
     * Получение физических данных объекта
     * GET /api/ssodnet/datacloud?name=Ceres
     */
    app.get('/api/ssodnet/datacloud', ssodnet.dataCloud);

    /**
     * Получение ssoCard (best estimates) для объекта
     * GET /api/ssodnet/ssocard/:id
     */
    app.get('/api/ssodnet/ssocard/:id', ssodnet.ssoCard);

    /**
     * Пакетный запрос для нескольких объектов
     * POST /api/ssodnet/batch
     */
    app.post('/api/ssodnet/batch', ssodnet.batchRequest);

    // ============================================================================
    // SsODNet BFT (Broad and Flat Table)
    // ============================================================================

    /**
     * Получение информации о ssoBFT таблице
     * GET /api/ssodnet/bft/info
     */
    app.get('/api/ssodnet/bft/info', bft.bftInfo);

    /**
     * Получение полного списка полей ssoBFT с описаниями
     * GET /api/ssodnet/bft/fields
     */
    app.get('/api/ssodnet/bft/fields', bft.bftFields);

    /**
     * Скачивание полной таблицы ssoBFT
     * GET /api/ssodnet/bft/download?type=asteroids&format=parquet
     */
    app.get('/api/ssodnet/bft/download', bft.bftDownload);

    /**
     * Fallback данные для статистики (обратная совместимость)
     * GET /api/ssodnet/bft?class=MBA&limit=10
     */
    app.get('/api/ssodnet/bft', bft.bftFallback);

    // ============================================================================
    // Miriade (Эфемериды)
    // ============================================================================

    /**
     * Получение позиционных эфемерид
     * GET /api/miriade/ephemcc?name=Mars&epoch=2025.0&step=1d&nsteps=1
     */
    app.get('/api/miriade/ephemcc', miriade.ephemcc);

    /**
     * Получение физических эфемерид
     * GET /api/miriade/ephemph?name=p:Mars&epoch=2025.0&so=1
     */
    app.get('/api/miriade/ephemph', miriade.ephemph);

    /**
     * Специальный эндпоинт для астероидов
     * GET /api/miriade/asteroid?name=1&epoch=2025.0
     */
    app.get('/api/miriade/asteroid', miriade.asteroidEphem);

    /**
     * Получение списка доступных физических моделей
     * GET /api/miriade/models?name=p:&mime=json
     */
    app.get('/api/miriade/models', miriade.miriadeModels);

    // ============================================================================
    // SkyBoT (Cone Search)
    // ============================================================================

    /**
     * Cone search для Солнечной системы
     * GET /api/skybot/cone?ra=10.5&dec=41.2&radius=1.0&epoch=2025.0
     */
    app.get('/api/skybot/cone', skybot.skybotCone);

    // ============================================================================
    // Skybot3D (Векторные данные)
    // ============================================================================

    /**
     * Получение векторов астероидов
     * GET /api/skybot3d/getAster?class=NEA&limit=10&epoch=2025.0
     */
    app.get('/api/skybot3d/getAster', skybot.skybot3dGetAster);

    /**
     * Получение векторов комет
     * GET /api/skybot3d/getComet?class=Short-Period&limit=10&epoch=2025.0
     */
    app.get('/api/skybot3d/getComet', skybot.skybot3dGetComet);

    /**
     * Получение векторов планет
     * GET /api/skybot3d/getPlanet?epoch=2025.0&coord=spherical
     */
    app.get('/api/skybot3d/getPlanet', skybot.skybot3dGetPlanet);

    /**
     * Получение всех объектов в одном запросе
     * GET /api/skybot3d/getSso?limit=10&epoch=2025.0
     */
    app.get('/api/skybot3d/getSso', skybot.skybot3dGetSso);

    /**
     * Получение статуса сервиса
     * GET /api/skybot3d/availability?project=sbot2&mime=json
     */
    app.get('/api/skybot3d/availability', skybot.skybot3dAvailability);

    // ============================================================================
    // ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ВСЕХ МЕТОДОВ
    // ============================================================================

    /**
     * Получение списка всех доступных эндпоинтов IMCCE
     * GET /api/imcce/test
     */
    app.get('/api/imcce/test', (req, res) => {
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'IMCCE API is available',
            documentation: 'https://ssp.imcce.fr/webservices',
            endpoints: {
                ssodnet: {
                    quaero: '/api/ssodnet/quaero?q=Ceres',
                    datacloud: '/api/ssodnet/datacloud?name=Ceres',
                    ssocard: '/api/ssodnet/ssocard/Ceres',
                    batch: '/api/ssodnet/batch (POST)',
                    bft_info: '/api/ssodnet/bft/info',
                    bft_fields: '/api/ssodnet/bft/fields',
                    bft_download: '/api/ssodnet/bft/download?type=asteroids&format=parquet'
                },
                miriade: {
                    ephemcc: '/api/miriade/ephemcc?name=p:Mars&epoch=2025.0',
                    ephemph: '/api/miriade/ephemph?name=p:Mars&epoch=2025.0&so=1',
                    asteroid: '/api/miriade/asteroid?name=1&epoch=2025.0',
                    models: '/api/miriade/models?name=p:'
                },
                skybot: {
                    cone: '/api/skybot/cone?ra=83.82&dec=-5.39&radius=1.0'
                },
                skybot3d: {
                    getAster: '/api/skybot3d/getAster?class=NEA&limit=10',
                    getComet: '/api/skybot3d/getComet?class=Short-Period&limit=10',
                    getPlanet: '/api/skybot3d/getPlanet',
                    getSso: '/api/skybot3d/getSso?limit=10',
                    availability: '/api/skybot3d/availability'
                }
            },
            note: 'Все эндпоинты поддерживают параметр mime=json (по умолчанию) или mime=xml'
        });
    });

    // ============================================================================
    // ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ЗДОРОВЬЯ IMCCE СЕРВИСОВ
    // ============================================================================

    /**
     * Проверка доступности всех IMCCE сервисов
     * GET /api/imcce/health
     */
    app.get('/api/imcce/health', async (req, res) => {
        const results = {
            timestamp: new Date().toISOString(),
            services: {}
        };

        // Проверяем SsODNet
        try {
            const start = Date.now();
            await import('axios').then(axios => axios.default.get('https://api.ssodnet.imcce.fr/quaero/1/sso/search?q=Ceres&limit=1', { timeout: 5000 }));
            results.services.ssodnet = { status: 'ok', responseTime: Date.now() - start };
        } catch (error) {
            results.services.ssodnet = { status: 'error', error: error.message };
        }

        // Проверяем Miriade
        try {
            const start = Date.now();
            await import('axios').then(axios => axios.default.get('https://ssp.imcce.fr/webservices/miriade/api/ephemcc.php?-name=p:Mars&-ep=now&-mime=json', { timeout: 5000 }));
            results.services.miriade = { status: 'ok', responseTime: Date.now() - start };
        } catch (error) {
            results.services.miriade = { status: 'error', error: error.message };
        }

        // Проверяем SkyBoT
        try {
            const start = Date.now();
            await import('axios').then(axios => axios.default.get('https://ssp.imcce.fr/webservices/skybot/api/conesearch.php?-ra=0&-dec=0&-rd=1&-ep=now&-mime=json', { timeout: 5000 }));
            results.services.skybot = { status: 'ok', responseTime: Date.now() - start };
        } catch (error) {
            results.services.skybot = { status: 'error', error: error.message };
        }

        // Проверяем Skybot3D
        try {
            const start = Date.now();
            await import('axios').then(axios => axios.default.get('https://ssp.imcce.fr/webservices/skybot3d/api/getAvailability.php?-project=sbot2&-mime=json', { timeout: 5000 }));
            results.services.skybot3d = { status: 'ok', responseTime: Date.now() - start };
        } catch (error) {
            results.services.skybot3d = { status: 'error', error: error.message };
        }

        const allOk = Object.values(results.services).every(s => s.status === 'ok');
        results.status = allOk ? 'ok' : 'degraded';

        res.json(results);
    });

    console.log(`${colors.fg.green}✅ Все IMCCE маршруты настроены${colors.reset}`);
    console.log(`   • SsODNet: 5 маршрутов (quaero, datacloud, ssocard, batch, bft)`);
    console.log(`   • Miriade: 4 маршрута (ephemcc, ephemph, asteroid, models)`);
    console.log(`   • SkyBoT: 1 маршрут (cone search)`);
    console.log(`   • Skybot3D: 5 маршрутов (aster, comet, planet, sso, availability)`);
    console.log(`   • Тестовые: 2 маршрута (/test, /health)`);
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default setupImcceRoutes;