// models/PendingAction.js - Полная версия с обновлениями
import { db } from '../database/db.js';

export class PendingActionModel {
    /**
     * Сохранить неопределенное состояние
     * @param {Object} actionData - Данные о неопределенном состоянии
     * @returns {Object} Результат выполнения
     */
    static save(actionData) {
        const stmt = db.prepare(`
            INSERT INTO pending_actions (
                task_id, session_id, type, description, severity,
                suggested_action, details, auto_resolved, resolution_method,
                detected_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(
            actionData.taskId || null,
            actionData.sessionId,
            actionData.type,
            actionData.description || null,
            actionData.severity || 'medium',
            actionData.suggestedAction || null,
            actionData.details ? JSON.stringify(actionData.details) : null,
            actionData.autoResolved ? 1 : 0,
            actionData.resolutionMethod || null,
            actionData.detectedAt || Date.now(),
            actionData.resolvedAt || null
        );
    }

    /**
     * Получить все неразрешенные действия
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Список неразрешенных действий
     */
    static getUnresolved(limit = 50) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.status as task_status,
                t.start_time as task_start_time,
                s.start_time as session_start_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.auto_resolved = 0
            ORDER BY
                CASE pa.severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                    END,
                pa.detected_at DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    }

    /**
     * Получить действия по типу
     * @param {string} type - Тип действия
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Список действий
     */
    static getByType(type, limit = 20) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                s.start_time as session_start_time,
                s.end_time as session_end_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.type = ?
            ORDER BY pa.detected_at DESC
                LIMIT ?
        `);
        return stmt.all(type, limit);
    }

    /**
     * Получить статистику по типам
     * @returns {Array} Статистика по типам
     */
    static getStatsByType() {
        const stmt = db.prepare(`
            SELECT
                type,
                severity,
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved,
                MIN(detected_at) as first_occurrence,
                MAX(detected_at) as last_occurrence,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL
                             THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            GROUP BY type, severity
            ORDER BY total DESC
        `);
        const results = stmt.all();

        // Добавляем процентное соотношение
        const totalAll = results.reduce((sum, r) => sum + r.total, 0);
        return results.map(r => ({
            ...r,
            percentage: totalAll > 0 ? ((r.total / totalAll) * 100).toFixed(2) : 0,
            avg_resolution_time_sec: r.avg_resolution_time_ms
                ? (r.avg_resolution_time_ms / 1000).toFixed(2)
                : null
        }));
    }

    /**
     * Получить действия по ID сессии
     * @param {string} sessionId - ID сессии
     * @returns {Array} Список действий
     */
    static getBySessionId(sessionId) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.assistant_response_preview
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
            WHERE pa.session_id = ?
            ORDER BY pa.detected_at DESC
        `);
        return stmt.all(sessionId);
    }

    /**
     * Получить действия по ID задачи
     * @param {string} taskId - ID задачи
     * @returns {Array} Список действий
     */
    static getByTaskId(taskId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions
            WHERE task_id = ?
            ORDER BY detected_at DESC
        `);
        return stmt.all(taskId);
    }

    /**
     * Отметить действие как разрешенное
     * @param {number} id - ID записи
     * @param {string} resolutionMethod - Метод разрешения
     * @returns {Object} Результат выполнения
     */
    static resolve(id, resolutionMethod) {
        const stmt = db.prepare(`
            UPDATE pending_actions
            SET auto_resolved = 1,
                resolution_method = ?,
                resolved_at = ?
            WHERE id = ?
        `);
        return stmt.run(resolutionMethod, Date.now(), id);
    }

    /**
     * Массовое разрешение действий по сессии
     * @param {string} sessionId - ID сессии
     * @param {string} resolutionMethod - Метод разрешения
     * @returns {Object} Результат выполнения
     */
    static resolveBySessionId(sessionId, resolutionMethod) {
        const stmt = db.prepare(`
            UPDATE pending_actions
            SET auto_resolved = 1,
                resolution_method = ?,
                resolved_at = ?
            WHERE session_id = ? AND auto_resolved = 0
        `);
        return stmt.run(resolutionMethod, Date.now(), sessionId);
    }

    /**
     * Получить аналитику по проблемам за период
     * @param {number} since - Временная метка начала периода
     * @returns {Object} Аналитика
     */
    static getAnalyticsSummary(since) {
        // Основная статистика
        const statsStmt = db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved_count,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_severity_count,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity_count,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity_count,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL
                             THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            WHERE detected_at > ?
        `);
        const totals = statsStmt.get(since);

        // Наиболее частый тип проблемы
        const typeStmt = db.prepare(`
            SELECT
                type,
                COUNT(*) as count,
                severity,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type
            ORDER BY count DESC
                LIMIT 1
        `);
        const mostFrequentType = typeStmt.get(since);

        // Динамика по дням
        const dailyStmt = db.prepare(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved
            FROM pending_actions
            WHERE created_at > datetime('now', '-' || ? || ' days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        const daily = dailyStmt.all(7);

        const resolutionRate = totals.total > 0
            ? (totals.resolved_count / totals.total) * 100
            : 0;

        return {
            period: {
                from: new Date(since).toISOString(),
                to: new Date().toISOString()
            },
            total: totals.total,
            resolvedCount: totals.resolved_count,
            unresolvedCount: totals.unresolved_count,
            resolutionRate: resolutionRate.toFixed(2),
            severityBreakdown: {
                critical: totals.critical_severity_count || 0,
                high: totals.high_severity_count || 0,
                medium: totals.medium_severity_count || 0,
                low: totals.low_severity_count || 0
            },
            avgResolutionTimeMs: totals.avg_resolution_time_ms || 0,
            avgResolutionTimeSec: totals.avg_resolution_time_ms
                ? (totals.avg_resolution_time_ms / 1000).toFixed(2)
                : 0,
            mostFrequentType: mostFrequentType || null,
            dailyTrend: daily
        };
    }

    /**
     * Получить детальную информацию о конкретном действии
     * @param {number} id - ID записи
     * @returns {Object|null} Детали действия
     */
    static getById(id) {
        const stmt = db.prepare(`
            SELECT
                pa.*,
                t.user_message,
                t.assistant_response_preview,
                t.status as task_status,
                t.duration as task_duration,
                s.start_time as session_start_time,
                s.end_time as session_end_time,
                s.status as session_status
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.id = ?
        `);
        return stmt.get(id);
    }

    /**
     * Обновить детали действия
     * @param {number} id - ID записи
     * @param {Object} updates - Обновляемые поля
     * @returns {Object} Результат выполнения
     */
    static update(id, updates) {
        const allowedFields = ['description', 'severity', 'suggested_action', 'details'];
        const setClauses = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                if (field === 'details' && typeof updates[field] === 'object') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
            }
        }

        if (setClauses.length === 0) {
            return { changes: 0 };
        }

        values.push(id);
        const stmt = db.prepare(`UPDATE pending_actions SET ${setClauses.join(', ')} WHERE id = ?`);
        return stmt.run(...values);
    }

    /**
     * Удалить запись
     * @param {number} id - ID записи
     * @returns {Object} Результат выполнения
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM pending_actions WHERE id = ?');
        return stmt.run(id);
    }

    /**
     * Удалить все записи по сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Результат выполнения
     */
    static deleteBySessionId(sessionId) {
        const stmt = db.prepare('DELETE FROM pending_actions WHERE session_id = ?');
        return stmt.run(sessionId);
    }

    /**
     * Удалить старые записи (старше указанного количества дней)
     * @param {number} days - Количество дней
     * @returns {Object} Результат выполнения
     */
    static deleteOld(days = 30) {
        const stmt = db.prepare(`
            DELETE FROM pending_actions
            WHERE created_at < datetime('now', '-' || ? || ' days')
              AND auto_resolved = 1
        `);
        return stmt.run(days);
    }

    /**
     * Получить статистику по сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Статистика
     */
    static getSessionStats(sessionId) {
        const stmt = db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN auto_resolved = 0 THEN 1 ELSE 0 END) as unresolved,
                GROUP_CONCAT(DISTINCT type) as types
            FROM pending_actions
            WHERE session_id = ?
        `);
        return stmt.get(sessionId);
    }

    /**
     * Получить все уникальные типы проблем
     * @returns {Array} Список типов
     */
    static getUniqueTypes() {
        const stmt = db.prepare(`
            SELECT DISTINCT type, COUNT(*) as count
            FROM pending_actions
            GROUP BY type
            ORDER BY count DESC
        `);
        return stmt.all();
    }

    /**
     * Экспорт данных в JSON
     * @param {Object} filters - Фильтры для экспорта
     * @returns {Array} Данные для экспорта
     */
    static exportData(filters = {}) {
        let query = `
            SELECT
                pa.*,
                t.user_message,
                t.status as task_status,
                s.start_time as session_start_time
            FROM pending_actions pa
                     LEFT JOIN tasks t ON pa.task_id = t.id
                     LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.type) {
            query += ' AND pa.type = ?';
            params.push(filters.type);
        }

        if (filters.severity) {
            query += ' AND pa.severity = ?';
            params.push(filters.severity);
        }

        if (filters.autoResolved !== undefined) {
            query += ' AND pa.auto_resolved = ?';
            params.push(filters.autoResolved ? 1 : 0);
        }

        if (filters.fromDate) {
            query += ' AND pa.detected_at >= ?';
            params.push(new Date(filters.fromDate).getTime());
        }

        if (filters.toDate) {
            query += ' AND pa.detected_at <= ?';
            params.push(new Date(filters.toDate).getTime());
        }

        query += ' ORDER BY pa.detected_at DESC';

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        // Парсим JSON поля
        return results.map(r => ({
            ...r,
            details: r.details ? JSON.parse(r.details) : null
        }));
    }

    /**
     * Получить топ проблем по частоте
     * @param {number} limit - Количество записей
     * @returns {Array} Топ проблем
     */
    static getTopIssues(limit = 10) {
        const stmt = db.prepare(`
            SELECT
                type,
                severity,
                COUNT(*) as occurrences,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen,
                COUNT(DISTINCT session_id) as affected_sessions
            FROM pending_actions
            WHERE auto_resolved = 0
            GROUP BY type, severity
            ORDER BY occurrences DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    }

    /**
     * Получить временную шкалу проблем
     * @param {number} hours - Количество часов
     * @returns {Array} Временная шкала
     */
    static getTimeline(hours = 24) {
        const stmt = db.prepare(`
            SELECT
                strftime('%H:00', datetime(detected_at/1000, 'unixepoch')) as hour,
                type,
                COUNT(*) as count
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY hour, type
            ORDER BY hour DESC
        `);
        const since = Date.now() - (hours * 60 * 60 * 1000);
        const results = stmt.all(since);

        // Группируем по часам
        const timeline = {};
        for (const row of results) {
            if (!timeline[row.hour]) {
                timeline[row.hour] = {};
            }
            timeline[row.hour][row.type] = row.count;
            timeline[row.hour].total = (timeline[row.hour].total || 0) + row.count;
        }

        return timeline;
    }

    /**
     * Получить сводку для дашборда
     * @returns {Object} Сводка для дашборда
     */
    static getDashboardSummary() {
        const currentStmt = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
            FROM pending_actions
            WHERE auto_resolved = 0
        `);
        const current = currentStmt.get();

        const resolvedStmt = db.prepare(`
            SELECT 
                COUNT(*) as total,
                AVG(CASE WHEN resolved_at IS NOT NULL AND detected_at IS NOT NULL 
                    THEN (resolved_at - detected_at) ELSE NULL END) as avg_resolution_time_ms
            FROM pending_actions
            WHERE auto_resolved = 1
        `);
        const resolved = resolvedStmt.get();

        const byTypeStmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity
            FROM pending_actions
            WHERE auto_resolved = 0
            GROUP BY type, severity
            ORDER BY count DESC
            LIMIT 5
        `);
        const topTypes = byTypeStmt.all();

        return {
            current: {
                total: current?.total || 0,
                critical: current?.critical || 0,
                high: current?.high || 0,
                medium: current?.medium || 0,
                low: current?.low || 0
            },
            resolved: {
                total: resolved?.total || 0,
                avgResolutionTimeMs: resolved?.avg_resolution_time_ms || 0,
                avgResolutionTimeSec: resolved?.avg_resolution_time_ms
                    ? (resolved.avg_resolution_time_ms / 1000).toFixed(2)
                    : 0
            },
            topTypes: topTypes,
            timestamp: Date.now()
        };
    }

    /**
     * Получить частоту возникновения по типам
     * @param {number} hours - Количество часов для анализа
     * @returns {Array} Частота по типам
     */
    static getFrequencyByType(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as count,
                severity,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pending_actions WHERE detected_at > ?)) as percentage
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
        `);
        return stmt.all(since, since);
    }

    /**
     * Получить критические неразрешенные проблемы
     * @param {number} limit - Максимальное количество записей
     * @returns {Array} Критические проблемы
     */
    static getCriticalUnresolved(limit = 20) {
        const stmt = db.prepare(`
            SELECT 
                pa.*,
                t.user_message,
                s.start_time as session_start_time
            FROM pending_actions pa
            LEFT JOIN tasks t ON pa.task_id = t.id
            LEFT JOIN sessions s ON pa.session_id = s.id
            WHERE pa.auto_resolved = 0 AND pa.severity = 'critical'
            ORDER BY pa.detected_at DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // ========== НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ СТАТИСТИКИ СЕССИИ ==========

    /**
     * Обновить счетчик pending действий в сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} Результат выполнения
     */
    static updateSessionPendingCount(sessionId) {
        const stmt = db.prepare(`
            UPDATE sessions 
            SET metadata = json_set(
                COALESCE(metadata, '{}'), 
                '$.pending_count',
                (SELECT COUNT(*) FROM pending_actions WHERE session_id = ? AND auto_resolved = 0)
            )
            WHERE id = ?
        `);
        return stmt.run(sessionId, sessionId);
    }
}

export default PendingActionModel;