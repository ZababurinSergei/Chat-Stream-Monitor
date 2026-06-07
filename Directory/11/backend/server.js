// server.js - Главный файл сервера для приема и анализа задач от chatMonitor.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import taskRoutes from './routes/tasks.js';
import pendingRoutes from './routes/pending.js';
import { AnalyzerService } from './services/analyzerService.js';
import { db } from './database/db.js';

const app = express();

// ========== MIDDLEWARE ==========

app.use(helmet({
    contentSecurityPolicy: false, // Для упрощения разработки
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(config.logLevel === 'debug' ? 'dev' : 'combined'));

// Статическая документация
app.use('/docs', express.static('docs'));

// ========== МАРШРУТЫ API ==========

// Маршруты для задач
app.use('/api/tasks', taskRoutes);

// Маршруты для неопределенных состояний
app.use('/api/pending', pendingRoutes);

// ========== ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ ==========

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        endpoints: {
            tasks: '/api/tasks',
            pending: '/api/pending',
            analytics: '/api/analytics',
            sessions: '/api/sessions'
        }
    });
});

// GET /api/analytics - общая аналитика
app.get('/api/analytics', (req, res) => {
    try {
        const period = parseInt(req.query.period) || 24;
        const analytics = AnalyzerService.getOverallAnalytics(period);
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/analytics/detailed - детальная аналитика
app.get('/api/analytics/detailed', (req, res) => {
    try {
        const period = parseInt(req.query.period) || 24;
        const since = Date.now() - (period * 60 * 60 * 1000);

        // Статистика по типам ошибок
        const pendingStats = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity,
                AVG(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) * 100 as resolve_rate
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
        `).all(since);

        // Статистика по времени ответа
        const responseStats = db.prepare(`
            SELECT 
                AVG(duration) as avg_duration,
                MIN(duration) as min_duration,
                MAX(duration) as max_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE start_time > ? AND status = 'completed'
        `).get(since);

        // Статистика по сессиям
        const sessionStats = db.prepare(`
            SELECT 
                COUNT(*) as total_sessions,
                AVG(total_tasks) as avg_tasks_per_session,
                AVG(completed_tasks) as avg_completed_per_session,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
            FROM sessions
            WHERE start_time > ?
        `).get(since);

        res.json({
            success: true,
            data: {
                period: `${period} hours`,
                pending_actions: pendingStats,
                response_times: responseStats,
                sessions: sessionStats,
                generated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Analytics Detailed] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/sessions - список сессий
app.get('/api/sessions', (req, res) => {
    try {
        const { limit = 50, offset = 0, status = null } = req.query;

        let query = `
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                   COUNT(DISTINCT pa.id) as pending_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            LEFT JOIN pending_actions pa ON s.id = pa.session_id AND pa.auto_resolved = 0
        `;

        const params = [];
        if (status) {
            query += ' WHERE s.status = ?';
            params.push(status);
        }

        query += ` GROUP BY s.id ORDER BY s.start_time DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const sessions = db.prepare(query).all(...params);

        // Общая статистика
        const totalStmt = db.prepare('SELECT COUNT(*) as total FROM sessions');
        const total = totalStmt.get().total;

        res.json({
            success: true,
            data: sessions,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: total
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Sessions] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/sessions/:id - детали сессии
app.get('/api/sessions/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Получаем сессию
        const sessionStmt = db.prepare(`
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `);
        const session = sessionStmt.get(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        // Получаем задачи сессии
        const tasksStmt = db.prepare(`
            SELECT t.*, ar.response_text as full_response, ar.response_length, ar.word_count
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.session_id = ?
            ORDER BY t.start_time ASC
        `);
        const tasks = tasksStmt.all(id);

        // Получаем неопределенные состояния сессии
        const pendingStmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE session_id = ? 
            ORDER BY detected_at DESC
        `);
        const pending = pendingStmt.all(id);

        // Аналитика сессии
        const analytics = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            failedTasks: tasks.filter(t => t.status === 'failed').length,
            averageResponseTime: tasks.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.length / 1000,
            averageValidationScore: tasks.filter(t => t.validation_score).reduce((sum, t) => sum + (t.validation_score || 0), 0) / tasks.length,
            totalPendingActions: pending.length,
            unresolvedPending: pending.filter(p => !p.auto_resolved).length
        };

        res.json({
            success: true,
            data: {
                session,
                tasks,
                pending,
                analytics,
                taskCount: tasks.length,
                pendingCount: pending.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Session Details] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/sessions/:id - удалить сессию
app.delete('/api/sessions/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем существование
        const checkStmt = db.prepare('SELECT id FROM sessions WHERE id = ?');
        const exists = checkStmt.get(id);

        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        // Удаляем (каскадно удалятся связанные задачи и pending действия)
        const deleteStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
        const result = deleteStmt.run(id);

        res.json({
            success: true,
            message: 'Session deleted successfully',
            affected: result.changes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Delete Session] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats - общая статистика
app.get('/api/stats', (req, res) => {
    try {
        // Общее количество задач
        const tasksCount = db.prepare('SELECT COUNT(*) as total FROM tasks').get();

        // Количество завершенных задач
        const completedTasks = db.prepare(`
            SELECT COUNT(*) as total FROM tasks WHERE status = 'completed'
        `).get();

        // Количество failed задач
        const failedTasks = db.prepare(`
            SELECT COUNT(*) as total FROM tasks WHERE status = 'failed'
        `).get();

        // Количество неопределенных состояний
        const pendingCount = db.prepare(`
            SELECT COUNT(*) as total FROM pending_actions WHERE auto_resolved = 0
        `).get();

        // Количество разрешенных
        const resolvedPending = db.prepare(`
            SELECT COUNT(*) as total FROM pending_actions WHERE auto_resolved = 1
        `).get();

        // Среднее время ответа
        const avgResponseTime = db.prepare(`
            SELECT AVG(duration) as avg FROM tasks WHERE duration IS NOT NULL
        `).get();

        // Средний score валидации
        const avgValidationScore = db.prepare(`
            SELECT AVG(validation_score) as avg FROM tasks WHERE validation_score IS NOT NULL
        `).get();

        res.json({
            success: true,
            data: {
                tasks: {
                    total: tasksCount.total,
                    completed: completedTasks.total,
                    failed: failedTasks.total,
                    success_rate: tasksCount.total > 0 ? ((completedTasks.total / tasksCount.total) * 100).toFixed(2) : 0
                },
                pending_actions: {
                    total: pendingCount.total + resolvedPending.total,
                    unresolved: pendingCount.total,
                    resolved: resolvedPending.total,
                    resolve_rate: (pendingCount.total + resolvedPending.total) > 0
                        ? ((resolvedPending.total / (pendingCount.total + resolvedPending.total)) * 100).toFixed(2)
                        : 0
                },
                performance: {
                    avg_response_time_ms: Math.round(avgResponseTime.avg || 0),
                    avg_response_time_sec: ((avgResponseTime.avg || 0) / 1000).toFixed(2),
                    avg_validation_score: Math.round(avgValidationScore.avg || 0)
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Stats] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/search - поиск по задачам
app.get('/api/search', (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }

        const searchTerm = `%${q}%`;

        const results = db.prepare(`
            SELECT t.id, t.user_message, t.assistant_response, t.status, 
                   t.validation_score, t.duration, t.created_at,
                   s.id as session_id
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            WHERE t.user_message LIKE ? OR t.assistant_response LIKE ?
            ORDER BY t.created_at DESC
            LIMIT ?
        `).all(searchTerm, searchTerm, parseInt(limit));

        res.json({
            success: true,
            data: results,
            query: q,
            total: results.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Search] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/export - экспорт всех данных
app.get('/api/export', (req, res) => {
    try {
        const format = req.query.format || 'json';

        const sessions = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC').all();
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        const pending = db.prepare('SELECT * FROM pending_actions ORDER BY detected_at DESC').all();
        const responses = db.prepare('SELECT * FROM assistant_responses ORDER BY created_at DESC').all();

        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            stats: {
                sessions: sessions.length,
                tasks: tasks.length,
                pending: pending.length,
                responses: responses.length
            },
            data: {
                sessions,
                tasks,
                pending,
                responses
            }
        };

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=chat-monitor-export-${Date.now()}.json`);
            res.json(exportData);
        } else {
            res.status(400).json({
                success: false,
                error: 'Unsupported format. Use format=json'
            });
        }
    } catch (error) {
        console.error('[Export] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========== ОБРАБОТКА ОШИБОК ==========

// 404 - Not Found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.url}`,
        timestamp: new Date().toISOString()
    });
});

// Общий обработчик ошибок
app.use((err, req, res, next) => {
    console.error('[Server Error]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ========== ЗАПУСК СЕРВЕРА ==========

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                    🚀 CHAT MONITOR SERVER STARTED SUCCESSFULLY               ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                                                                              ║
    ║  📡 Port: ${PORT.toString().padEnd(56)}║
    ║  🕐 Time: ${new Date().toLocaleString().padEnd(56)}║
    ║                                                                              ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                           📋 API ENDPOINTS                                    ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║                                                                              ║
    ║  📦 TASKS:                                                                   ║
    ║    POST   /api/tasks                    - Сохранить задачу                   ║
    ║    GET    /api/tasks/:id                - Получить задачу по ID              ║
    ║    GET    /api/tasks/session/:sessionId - Задачи сессии                      ║
    ║    GET    /api/tasks/failed/list        - Список failed задач                ║
    ║    GET    /api/tasks/analyze/:id        - Анализ задачи                      ║
    ║                                                                              ║
    ║  ⚠️ PENDING ACTIONS:                                                          ║
    ║    POST   /api/pending                  - Сохранить проблему                 ║
    ║    GET    /api/pending/unresolved       - Неразрешенные проблемы             ║
    ║    GET    /api/pending/type/:type       - Проблемы по типу                   ║
    ║    GET    /api/pending/stats            - Статистика проблем                 ║
    ║    PUT    /api/pending/:id/resolve      - Разрешить проблему                 ║
    ║                                                                              ║
    ║  📊 ANALYTICS:                                                               ║
    ║    GET    /api/analytics                - Общая аналитика                    ║
    ║    GET    /api/analytics/detailed       - Детальная аналитика                ║
    ║    GET    /api/stats                    - Общая статистика                   ║
    ║                                                                              ║
    ║  📂 SESSIONS:                                                                ║
    ║    GET    /api/sessions                 - Список сессий                      ║
    ║    GET    /api/sessions/:id             - Детали сессии                      ║
    ║    DELETE /api/sessions/:id             - Удалить сессию                     ║
    ║                                                                              ║
    ║  🔍 UTILS:                                                                   ║
    ║    GET    /api/search?q=text            - Поиск по задачам                   ║
    ║    GET    /api/export                   - Экспорт всех данных                ║
    ║    GET    /health                       - Health check                       ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n[Server] Received shutdown signal, closing gracefully...');

    server.close(() => {
        console.log('[Server] HTTP server closed');

        // Закрываем соединение с БД
        if (db && typeof db.close === 'function') {
            db.close();
            console.log('[Server] Database connection closed');
        }

        console.log('[Server] Graceful shutdown completed');
        process.exit(0);
    });

    // Таймаут принудительного завершения
    setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Обработка неперехваченных ошибок
process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;