// /10/map/server-main.mjs - Главный файл прокси-сервера (100% символов)

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path.js';
import { fileURLToPath } from 'url.js';
import { PORT, colors } from './server-config.mjs';
import { loginToEsa } from './server-auth.mjs';
import { checkAllSources } from './server-health.mjs';
import setupRoutes from './server-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Безопасность
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Сжатие ответов
app.use(compression());

// CORS настройки
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:8080', 'http://127.0.0.1:8080',
        'http://localhost:5500', 'http://127.0.0.1:5500',
        'http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Response-Time']
}));

// Парсинг тела запроса
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Логирование запросов
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ============================================================================
// НАСТРОЙКА МАРШРУТОВ
// ============================================================================

setupRoutes(app);

// ============================================================================
// ПРЕДВАРИТЕЛЬНАЯ АУТЕНТИФИКАЦИЯ И ПРОВЕРКА
// ============================================================================

async function preAuth() {
    console.log(`\n${colors.fg.cyan}🔍 Предварительная проверка источников данных...${colors.reset}`);

    // Пробуем войти в ESA
    await loginToEsa();

    // Проверяем все источники
    await checkAllSources();

    console.log(`\n${colors.fg.green}✅ Предварительная проверка завершена${colors.reset}\n`);
}

// ============================================================================
// ЗАПУСК СЕРВЕРА
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n${colors.bg.blue}${colors.fg.white}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║           Gaia DR3 Proxy Server (MODULAR)                    ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   🚀 Server running at: http://localhost:${PORT}              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   📡 Приоритеты источников:                                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   1. 🌐 MAST TAP (публичный, самый быстрый)                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   2. 🌐 CDS VizieR (публичный)                               ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   3. 🌐 ESA Sky (публичный)                                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   4. 🌐 NASA HEASARC (публичный)                             ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   5. 🌐 CADC TAP (публичный)                                 ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   6. 🔐 ESA TAP (аутентифицированный)                        ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   7. 🌐 China-VO (публичный)                                 ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   8. 🌐 GAVO DC (публичный)                                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   🔧 Модульная структура:                                    ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-config.mjs   - конфигурация                      ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-parser.mjs    - парсинг VOTable/XML              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-auth.mjs      - аутентификация ESA               ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-health.mjs    - проверка источников              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-gaia.mjs      - запросы к Gaia                   ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-fallback.mjs  - тестовые данные                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-routes.mjs    - маршруты API                     ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-main.mjs      - главный файл                     ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • server-imcce.mjs     - IMCCE API                        ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   📊 Эндпоинты для мониторинга:                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET  /api/health          - health check                ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET  /api/sources/status  - статус источников           ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/sources/check   - проверка источников         ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/auth/esa/login  - вход в ESA                  ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/auth/esa/logout - выход из ESA                ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/sources/toggle  - вкл/выкл источник           ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   🌌 Gaia API:                                                ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/gaia/best       - лучшие звезды               ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/gaia/cone       - cone search                 ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • POST /api/gaia/region     - региональный запрос         ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET  /api/gaia/info       - информация о каталоге       ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   🪐 IMCCE API:                                               ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET /api/ssodnet/quaero   - поиск объектов              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET /api/ssodnet/datacloud- физические данные           ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET /api/miriade/ephemcc  - позиционные эфемериды       ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║   • GET /api/skybot/cone      - поиск в поле зрения         ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}║                                                              ║${colors.reset}`);
    console.log(`${colors.bg.blue}${colors.fg.white}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
});

// ============================================================================
// ПРЕДВАРИТЕЛЬНАЯ АУТЕНТИФИКАЦИЯ
// ============================================================================

preAuth();

// ============================================================================
// ОБРАБОТКА ЗАВЕРШЕНИЯ ПРОЦЕССА
// ============================================================================

process.on('SIGINT', () => {
    console.log(`\n${colors.fg.yellow}⚠️ Получен сигнал SIGINT, завершение работы...${colors.reset}`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n${colors.fg.yellow}⚠️ Получен сигнал SIGTERM, завершение работы...${colors.reset}`);
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error(`${colors.bg.red}${colors.fg.white}💥 Необработанная ошибка:${colors.reset}`, error);
});

export default app;