// database/db.js - Полная версия с обновлениями
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Создаем директорию для БД если её нет
        const dbDir = path.dirname(config.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(config.dbPath);

        // Включаем foreign keys
        this.db.pragma('foreign_keys = ON');

        // Оптимизация производительности
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('temp_store = MEMORY');

        this.createTables();
        this.createIndexes();
        this.createTriggers();
        this.isInitialized = true;

        console.log('[DB] Database initialized successfully at:', config.dbPath);
    }

    createTables() {
        // Таблица сессий
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                total_tasks INTEGER DEFAULT 0,
                completed_tasks INTEGER DEFAULT 0,
                failed_tasks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица задач (сообщение пользователя + ответ чата)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                assistant_response TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                duration INTEGER,
                status TEXT DEFAULT 'pending',
                validation_score INTEGER,
                is_valid INTEGER DEFAULT 0,
                error_message TEXT,
                html_blocks_count INTEGER DEFAULT 0,
                continue_clicks INTEGER DEFAULT 0,
                has_code INTEGER DEFAULT 0,
                word_count INTEGER DEFAULT 0,
                response_length INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для хранения полных ответов ассистента (для анализа)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS assistant_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                response_text TEXT,
                response_length INTEGER,
                word_count INTEGER,
                chunk_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // Таблица неопределенных состояний (pending actions)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS pending_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                session_id TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                severity TEXT DEFAULT 'medium',
                suggested_action TEXT,
                details TEXT,
                auto_resolved INTEGER DEFAULT 0,
                resolution_method TEXT,
                detected_at INTEGER NOT NULL,
                resolved_at INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для аналитики
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                total_tasks INTEGER,
                success_rate REAL,
                avg_response_time REAL,
                total_pending_actions INTEGER,
                avg_validation_score REAL,
                total_continue_clicks INTEGER,
                tasks_with_code INTEGER,
                date DATE DEFAULT CURRENT_DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        `);

        // Таблица для метрик производительности
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                metric_value REAL,
                task_id TEXT,
                session_id TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
            )
        `);

        // Таблица для логов ошибок
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_type TEXT NOT NULL,
                error_message TEXT,
                stack_trace TEXT,
                task_id TEXT,
                session_id TEXT,
                context TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
            )
        `);

        // Таблица для отслеживания изменений (аудит)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_by TEXT,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица для кэширования результатов анализа
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS analysis_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                cache_value TEXT NOT NULL,
                expires_at INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    createIndexes() {
        // Индексы для таблицы tasks
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
            CREATE INDEX IF NOT EXISTS idx_tasks_duration ON tasks(duration);
            CREATE INDEX IF NOT EXISTS idx_tasks_validation_score ON tasks(validation_score);
            CREATE INDEX IF NOT EXISTS idx_tasks_is_valid ON tasks(is_valid);
            CREATE INDEX IF NOT EXISTS idx_tasks_has_code ON tasks(has_code);
            CREATE INDEX IF NOT EXISTS idx_tasks_continue_clicks ON tasks(continue_clicks);
        `);

        // Индексы для таблицы pending_actions
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_pending_session ON pending_actions(session_id);
            CREATE INDEX IF NOT EXISTS idx_pending_task ON pending_actions(task_id);
            CREATE INDEX IF NOT EXISTS idx_pending_type ON pending_actions(type);
            CREATE INDEX IF NOT EXISTS idx_pending_severity ON pending_actions(severity);
            CREATE INDEX IF NOT EXISTS idx_pending_auto_resolved ON pending_actions(auto_resolved);
            CREATE INDEX IF NOT EXISTS idx_pending_detected_at ON pending_actions(detected_at);
        `);

        // Индексы для таблицы assistant_responses
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_assistant_task ON assistant_responses(task_id);
            CREATE INDEX IF NOT EXISTS idx_assistant_created_at ON assistant_responses(created_at);
        `);

        // Индексы для таблицы sessions
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
            CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
        `);

        // Индексы для таблицы analytics
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id);
            CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
        `);

        // Индексы для таблицы performance_metrics
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_metrics_name ON performance_metrics(metric_name);
            CREATE INDEX IF NOT EXISTS idx_metrics_session ON performance_metrics(session_id);
            CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON performance_metrics(timestamp);
        `);

        // Индексы для таблицы error_logs
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_errors_type ON error_logs(error_type);
            CREATE INDEX IF NOT EXISTS idx_errors_session ON error_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON error_logs(timestamp);
        `);

        // Индексы для таблицы audit_log
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
        `);

        // Составные индексы для сложных запросов
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_tasks_session_status ON tasks(session_id, status);
            CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at);
            CREATE INDEX IF NOT EXISTS idx_pending_session_resolved ON pending_actions(session_id, auto_resolved);
        `);
    }

    createTriggers() {
        // Триггер для обновления updated_at в tasks
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
            AFTER UPDATE ON tasks
            BEGIN
                UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);

        // Триггер для обновления updated_at в sessions
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp 
            AFTER UPDATE ON sessions
            BEGIN
                UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);

        // Триггер для обновления статистики сессии при добавлении задачи
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_session_stats_on_insert
            AFTER INSERT ON tasks
            BEGIN
                UPDATE sessions 
                SET total_tasks = total_tasks + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.session_id;
            END
        `);

        // Триггер для обновления статистики сессии при изменении статуса задачи
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_session_stats_on_status_change
            AFTER UPDATE OF status ON tasks
            WHEN OLD.status != NEW.status
            BEGIN
                UPDATE sessions 
                SET 
                    completed_tasks = (
                        SELECT COUNT(*) FROM tasks 
                        WHERE session_id = NEW.session_id AND status = 'completed'
                    ),
                    failed_tasks = (
                        SELECT COUNT(*) FROM tasks 
                        WHERE session_id = NEW.session_id AND status = 'failed'
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.session_id;
            END
        `);

        // Триггер для аудита изменений в tasks
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS audit_tasks_update
            AFTER UPDATE ON tasks
            BEGIN
                INSERT INTO audit_log (entity_type, entity_id, action, old_value, new_value, timestamp)
                VALUES ('task', NEW.id, 'UPDATE', 
                    json_object('status', OLD.status, 'validation_score', OLD.validation_score, 'is_valid', OLD.is_valid),
                    json_object('status', NEW.status, 'validation_score', NEW.validation_score, 'is_valid', NEW.is_valid),
                    unixepoch());
            END
        `);

        // Триггер для автоматического создания аналитики при завершении сессии
        this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS auto_create_analytics
            AFTER UPDATE OF status ON sessions
            WHEN NEW.status = 'completed' AND OLD.status != 'completed'
            BEGIN
                INSERT INTO analytics (session_id, total_tasks, success_rate, avg_response_time, total_pending_actions, avg_validation_score, total_continue_clicks, tasks_with_code)
                SELECT 
                    NEW.id,
                    COUNT(t.id),
                    AVG(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) * 100,
                    AVG(t.duration),
                    COUNT(p.id),
                    AVG(t.validation_score),
                    SUM(t.continue_clicks),
                    SUM(t.has_code)
                FROM tasks t
                LEFT JOIN pending_actions p ON t.id = p.task_id
                WHERE t.session_id = NEW.id;
            END
        `);
    }

    // Методы для работы с кэшем
    getCache(key) {
        const stmt = this.db.prepare(`
            SELECT cache_value FROM analysis_cache 
            WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > unixepoch())
        `);
        const result = stmt.get(key);
        if (result) {
            return JSON.parse(result.cache_value);
        }
        return null;
    }

    setCache(key, value, ttlSeconds = 3600) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO analysis_cache (cache_key, cache_value, expires_at)
            VALUES (?, ?, CASE WHEN ? > 0 THEN unixepoch() + ? ELSE NULL END)
        `);
        const expiresIn = ttlSeconds > 0 ? ttlSeconds : null;
        return stmt.run(key, JSON.stringify(value), expiresIn, expiresIn);
    }

    clearCache(keyPattern = null) {
        if (keyPattern) {
            const stmt = this.db.prepare(`DELETE FROM analysis_cache WHERE cache_key LIKE ?`);
            return stmt.run(`%${keyPattern}%`);
        } else {
            const stmt = this.db.prepare(`DELETE FROM analysis_cache`);
            return stmt.run();
        }
    }

    // Методы для логирования ошибок
    logError(errorData) {
        const stmt = this.db.prepare(`
            INSERT INTO error_logs (error_type, error_message, stack_trace, task_id, session_id, context, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            errorData.type,
            errorData.message,
            errorData.stack,
            errorData.taskId,
            errorData.sessionId,
            errorData.context ? JSON.stringify(errorData.context) : null,
            Date.now()
        );
    }

    getErrors(filters = {}, limit = 100) {
        let query = `SELECT * FROM error_logs WHERE 1=1`;
        const params = [];

        if (filters.type) {
            query += ` AND error_type = ?`;
            params.push(filters.type);
        }
        if (filters.sessionId) {
            query += ` AND session_id = ?`;
            params.push(filters.sessionId);
        }
        if (filters.fromDate) {
            query += ` AND timestamp >= ?`;
            params.push(filters.fromDate);
        }
        if (filters.toDate) {
            query += ` AND timestamp <= ?`;
            params.push(filters.toDate);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    // Методы для метрик производительности
    saveMetric(metricName, metricValue, taskId = null, sessionId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO performance_metrics (metric_name, metric_value, task_id, session_id, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(metricName, metricValue, taskId, sessionId, Date.now());
    }

    getMetrics(metricName, sessionId = null, limit = 100) {
        let query = `SELECT * FROM performance_metrics WHERE metric_name = ?`;
        const params = [metricName];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    getAverageMetric(metricName, sessionId = null, periodHours = 24) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);

        let query = `SELECT AVG(metric_value) as avg_value FROM performance_metrics WHERE metric_name = ? AND timestamp > ?`;
        const params = [metricName, since];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        const stmt = this.db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_value || 0;
    }

    // Вспомогательные методы
    getDb() {
        return this.db;
    }

    isReady() {
        return this.isInitialized && this.db !== null;
    }

    getStats() {
        const stats = {
            database: {
                path: config.dbPath,
                size: 0,
                tables: {}
            },
            counts: {}
        };

        // Размер базы данных
        try {
            const stat = fs.statSync(config.dbPath);
            stats.database.size = stat.size;
        } catch (e) {
            stats.database.size = 0;
        }

        // Количество записей в таблицах
        const tables = ['sessions', 'tasks', 'assistant_responses', 'pending_actions', 'analytics'];
        for (const table of tables) {
            try {
                const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
                stats.counts[table] = stmt.get().count;
            } catch (e) {
                stats.counts[table] = 0;
            }
        }

        return stats;
    }

    vacuum() {
        this.db.exec('VACUUM');
        console.log('[DB] VACUUM completed');
    }

    backup(backupPath) {
        this.db.backup(backupPath, {
            progress: (pages) => {
                console.log(`[DB] Backup progress: ${pages} pages copied`);
            }
        });
        console.log(`[DB] Backup saved to: ${backupPath}`);
    }

    close() {
        if (this.db) {
            // Сохраняем финальную статистику
            this.vacuum();
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('[DB] Database connection closed');
        }
    }

    // Очистка старых данных
    cleanup(olderThanDays = 30) {
        const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        // Удаляем старые сессии (каскадно удалятся связанные записи)
        const stmt = this.db.prepare(`DELETE FROM sessions WHERE start_time < ? AND status = 'completed'`);
        const result = stmt.run(cutoffDate);

        // Очищаем кэш
        this.clearCache();

        // Очищаем старые метрики
        const metricsStmt = this.db.prepare(`DELETE FROM performance_metrics WHERE timestamp < ?`);
        metricsStmt.run(cutoffDate);

        // Очищаем старые логи ошибок
        const logsStmt = this.db.prepare(`DELETE FROM error_logs WHERE timestamp < ?`);
        logsStmt.run(cutoffDate);

        console.log(`[DB] Cleanup completed: removed ${result.changes} old sessions`);
        return result.changes;
    }
}

// Создаем и экспортируем экземпляр
export const dbManager = new DatabaseManager();
export const db = dbManager.getDb();

// Экспортируем вспомогательные методы
export const dbHelpers = {
    getCache: (key) => dbManager.getCache(key),
    setCache: (key, value, ttl) => dbManager.setCache(key, value, ttl),
    clearCache: (pattern) => dbManager.clearCache(pattern),
    logError: (error) => dbManager.logError(error),
    saveMetric: (name, value, taskId, sessionId) => dbManager.saveMetric(name, value, taskId, sessionId),
    getMetrics: (name, sessionId, limit) => dbManager.getMetrics(name, sessionId, limit),
    cleanup: (days) => dbManager.cleanup(days),
    vacuum: () => dbManager.vacuum(),
    backup: (path) => dbManager.backup(path),
    getStats: () => dbManager.getStats()
};

// Graceful shutdown
process.on('SIGINT', () => {
    if (dbManager) {
        dbManager.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    if (dbManager) {
        dbManager.close();
    }
    process.exit(0);
});