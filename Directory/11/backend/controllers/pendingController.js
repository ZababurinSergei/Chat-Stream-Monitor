// controllers/pendingController.js - Полная версия с обновлениями

import { db } from '../database/db.js';
import { PendingActionModel } from '../models/PendingAction.js';

export const pendingController = {
    /**
     * POST /api/pending
     * Сохранить неопределенное состояние
     * @body { taskId, sessionId, type, description, severity, suggestedAction, details, autoResolved, resolutionMethod, detectedAt, resolvedAt }
     */
    async savePending(req, res) {
        try {
            const actionData = req.body;

            // Валидация обязательных полей
            if (!actionData.sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            if (!actionData.type) {
                return res.status(400).json({
                    success: false,
                    error: 'type is required'
                });
            }

            // Сохраняем через модель
            const result = PendingActionModel.save({
                taskId: actionData.taskId,
                sessionId: actionData.sessionId,
                type: actionData.type,
                description: actionData.description,
                severity: actionData.severity,
                suggestedAction: actionData.suggestedAction,
                details: actionData.details,
                autoResolved: actionData.autoResolved || false,
                resolutionMethod: actionData.resolutionMethod,
                detectedAt: actionData.detectedAt || Date.now(),
                resolvedAt: actionData.resolvedAt || null
            });

            // Обновляем счетчик сессии
            if (actionData.sessionId && !actionData.autoResolved) {
                try {
                    await PendingActionModel.updateSessionPendingCount(actionData.sessionId);
                } catch (err) {
                    console.warn('[PendingController] Could not update session count:', err.message);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Pending action saved successfully',
                data: {
                    id: result.lastInsertRowid,
                    ...actionData
                }
            });
        } catch (error) {
            console.error('[PendingController] Error saving pending action:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/unresolved
     * Получить все неразрешенные проблемы
     * @query limit - количество записей (по умолчанию 50)
     */
    async getUnresolved(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const actions = await PendingActionModel.getUnresolved(limit);

            // Добавляем форматированное время
            const actionsWithTime = actions.map(action => ({
                ...action,
                timeSinceDetected: Date.now() - (action.detected_at || 0),
                timeSinceDetectedFormatted: this._formatDuration(Date.now() - (action.detected_at || 0))
            }));

            // Получаем статистику по неразрешенным
            const stats = {
                total: actionsWithTime.length,
                bySeverity: this._groupBySeverity(actionsWithTime),
                byType: this._groupByType(actionsWithTime),
                oldest: actionsWithTime[actionsWithTime.length - 1] || null,
                newest: actionsWithTime[0] || null
            };

            res.json({
                success: true,
                data: actionsWithTime,
                stats: stats,
                total: actionsWithTime.length
            });
        } catch (error) {
            console.error('[PendingController] Error getting unresolved:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/type/:type
     * Получить проблемы по типу
     * @param type - тип проблемы
     * @query limit - количество записей (по умолчанию 20)
     */
    async getByType(req, res) {
        try {
            const { type } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const actions = await PendingActionModel.getByType(type, limit);

            // Получаем статистику по этому типу
            const typeStats = await PendingActionModel.getStatsByType();
            const thisTypeStats = typeStats.find(s => s.type === type);

            res.json({
                success: true,
                data: actions,
                stats: thisTypeStats || null,
                total: actions.length,
                type: type
            });
        } catch (error) {
            console.error('[PendingController] Error getting by type:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/stats
     * Получить статистику по типам проблем
     */
    async getStats(req, res) {
        try {
            const stats = await PendingActionModel.getStatsByType();
            const summary = await PendingActionModel.getDashboardSummary();

            // Общая статистика
            const totalStats = {
                total: stats.reduce((sum, s) => sum + s.total, 0),
                resolved: stats.reduce((sum, s) => sum + (s.resolved || 0), 0),
                unresolved: stats.reduce((sum, s) => sum + (s.unresolved || 0), 0),
                bySeverity: {
                    critical: stats.filter(s => s.severity === 'critical').reduce((sum, s) => sum + s.total, 0),
                    high: stats.filter(s => s.severity === 'high').reduce((sum, s) => sum + s.total, 0),
                    medium: stats.filter(s => s.severity === 'medium').reduce((sum, s) => sum + s.total, 0),
                    low: stats.filter(s => s.severity === 'low').reduce((sum, s) => sum + s.total, 0)
                }
            };

            // Вычисляем общий процент разрешения
            totalStats.resolutionRate = totalStats.total > 0
                ? ((totalStats.resolved / totalStats.total) * 100).toFixed(2)
                : 0;

            res.json({
                success: true,
                data: {
                    byType: stats,
                    summary: totalStats,
                    dashboard: summary,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/session/:sessionId
     * Получить проблемы по ID сессии
     */
    async getBySessionId(req, res) {
        try {
            const { sessionId } = req.params;
            const actions = await PendingActionModel.getBySessionId(sessionId);
            const sessionStats = await PendingActionModel.getSessionStats(sessionId);

            res.json({
                success: true,
                data: actions,
                stats: sessionStats,
                total: actions.length,
                sessionId: sessionId
            });
        } catch (error) {
            console.error('[PendingController] Error getting by session:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/task/:taskId
     * Получить проблемы по ID задачи
     */
    async getByTaskId(req, res) {
        try {
            const { taskId } = req.params;
            const actions = await PendingActionModel.getByTaskId(taskId);

            res.json({
                success: true,
                data: actions,
                total: actions.length,
                taskId: taskId
            });
        } catch (error) {
            console.error('[PendingController] Error getting by task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/pending/:id/resolve
     * Отметить проблему как разрешенную
     * @param id - ID записи
     * @body resolutionMethod - метод разрешения
     */
    async resolvePending(req, res) {
        try {
            const { id } = req.params;
            const { resolutionMethod } = req.body;

            if (!resolutionMethod) {
                return res.status(400).json({
                    success: false,
                    error: 'resolutionMethod is required'
                });
            }

            // Получаем действие перед разрешением
            const action = await PendingActionModel.getById(parseInt(id));
            if (!action) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const result = await PendingActionModel.resolve(parseInt(id), resolutionMethod);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            // Обновляем статистику сессии
            if (action.session_id) {
                try {
                    await PendingActionModel.updateSessionPendingCount(action.session_id);
                } catch (err) {
                    console.warn('[PendingController] Could not update session count:', err.message);
                }
            }

            res.json({
                success: true,
                message: 'Pending action resolved successfully',
                data: {
                    id: parseInt(id),
                    resolutionMethod: resolutionMethod,
                    resolvedAt: Date.now()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error resolving pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/pending/:id
     * Обновить детали проблемы
     */
    async updatePending(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const allowedFields = ['description', 'severity', 'suggestedAction', 'details'];
            const filteredUpdates = {};

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    filteredUpdates[field] = updates[field];
                }
            }

            if (Object.keys(filteredUpdates).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid fields to update'
                });
            }

            const result = await PendingActionModel.update(parseInt(id), filteredUpdates);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const updated = await PendingActionModel.getById(parseInt(id));

            res.json({
                success: true,
                message: 'Pending action updated successfully',
                data: updated
            });
        } catch (error) {
            console.error('[PendingController] Error updating pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/summary
     * Получить сводную аналитику по проблемам
     * @query period - период в часах (по умолчанию 24)
     */
    async getAnalyticsSummary(req, res) {
        try {
            const period = parseInt(req.query.period) || 24;
            const since = Date.now() - (period * 60 * 60 * 1000);
            const analytics = await PendingActionModel.getAnalyticsSummary(since);

            // Добавляем тренды
            const trends = await this._getTrends(period);
            const predictions = await this._getPredictions();

            res.json({
                success: true,
                data: {
                    ...analytics,
                    trends: trends,
                    predictions: predictions,
                    periodHours: period
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting analytics summary:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/frequency
     * Получить частоту возникновения проблем
     * @query hours - количество часов для анализа (по умолчанию 24)
     */
    async getFrequency(req, res) {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const frequency = await PendingActionModel.getFrequencyByType(hours);
            const timeline = await PendingActionModel.getTimeline(hours);

            res.json({
                success: true,
                data: {
                    frequency: frequency,
                    timeline: timeline,
                    hours: hours,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting frequency:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/critical
     * Получить критические неразрешенные проблемы
     */
    async getCritical(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const critical = await PendingActionModel.getCriticalUnresolved(limit);

            res.json({
                success: true,
                data: critical,
                total: critical.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting critical:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/dashboard
     * Получить сводку для дашборда
     */
    async getDashboard(req, res) {
        try {
            const summary = await PendingActionModel.getDashboardSummary();
            const topIssues = await PendingActionModel.getTopIssues(10);
            const uniqueTypes = await PendingActionModel.getUniqueTypes();

            // Добавляем рекомендации
            const recommendations = this._generateRecommendations(summary, topIssues);

            res.json({
                success: true,
                data: {
                    summary: summary,
                    topIssues: topIssues,
                    uniqueTypes: uniqueTypes,
                    recommendations: recommendations,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[PendingController] Error getting dashboard:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/:id
     * Удалить запись о проблеме
     */
    async deletePending(req, res) {
        try {
            const { id } = req.params;

            // Проверяем существование
            const action = await PendingActionModel.getById(parseInt(id));
            if (!action) {
                return res.status(404).json({
                    success: false,
                    error: 'Pending action not found'
                });
            }

            const result = await PendingActionModel.delete(parseInt(id));

            res.json({
                success: true,
                message: 'Pending action deleted successfully',
                data: { id: parseInt(id), sessionId: action.session_id }
            });
        } catch (error) {
            console.error('[PendingController] Error deleting pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/session/:sessionId
     * Удалить все проблемы сессии
     */
    async deleteBySessionId(req, res) {
        try {
            const { sessionId } = req.params;
            const result = await PendingActionModel.deleteBySessionId(sessionId);

            res.json({
                success: true,
                message: `Deleted ${result.changes} pending actions for session`,
                data: { sessionId: sessionId, deletedCount: result.changes }
            });
        } catch (error) {
            console.error('[PendingController] Error deleting by session:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/pending/cleanup/old
     * Удалить старые разрешенные проблемы
     * @query days - количество дней (по умолчанию 30)
     */
    async cleanupOld(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const result = await PendingActionModel.deleteOld(days);

            res.json({
                success: true,
                message: `Cleaned up ${result.changes} old resolved pending actions`,
                data: { deletedCount: result.changes, olderThanDays: days }
            });
        } catch (error) {
            console.error('[PendingController] Error cleaning up old:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/pending/batch
     * Массовое сохранение неопределенных состояний
     */
    async saveBatchPending(req, res) {
        try {
            const { actions } = req.body;

            if (!Array.isArray(actions) || actions.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'actions array is required and must not be empty'
                });
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < actions.length; i++) {
                try {
                    const action = actions[i];

                    if (!action.sessionId || !action.type) {
                        errors.push({ index: i, error: 'sessionId and type are required' });
                        continue;
                    }

                    const result = PendingActionModel.save({
                        taskId: action.taskId,
                        sessionId: action.sessionId,
                        type: action.type,
                        description: action.description,
                        severity: action.severity,
                        suggestedAction: action.suggestedAction,
                        details: action.details,
                        autoResolved: action.autoResolved || false,
                        resolutionMethod: action.resolutionMethod,
                        detectedAt: action.detectedAt || Date.now(),
                        resolvedAt: action.resolvedAt || null
                    });

                    results.push({
                        index: i,
                        id: result.lastInsertRowid,
                        ...action
                    });
                } catch (err) {
                    errors.push({ index: i, error: err.message });
                }
            }

            // Обновляем статистику сессий для затронутых сессий
            const uniqueSessions = [...new Set(actions.map(a => a.sessionId).filter(Boolean))];
            for (const sessionId of uniqueSessions) {
                try {
                    await PendingActionModel.updateSessionPendingCount(sessionId);
                } catch (err) {
                    console.warn(`[PendingController] Could not update session ${sessionId}:`, err.message);
                }
            }

            res.status(201).json({
                success: true,
                message: `${results.length} pending actions saved successfully`,
                data: {
                    succeeded: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors
                }
            });
        } catch (error) {
            console.error('[PendingController] Error saving batch pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/export
     * Экспорт данных о проблемах
     * @query format - формат (json/csv)
     * @query type - фильтр по типу
     * @query severity - фильтр по серьезности
     * @query from - дата начала
     * @query to - дата конца
     */
    async exportPending(req, res) {
        try {
            const format = req.query.format || 'json';
            const filters = {
                type: req.query.type,
                severity: req.query.severity,
                autoResolved: req.query.autoResolved === 'true' ? true : (req.query.autoResolved === 'false' ? false : undefined),
                fromDate: req.query.from,
                toDate: req.query.to
            };

            const data = await PendingActionModel.exportData(filters);

            const exportData = {
                exportDate: new Date().toISOString(),
                exporter: 'Chat Monitor Server',
                version: '1.0',
                filters: filters,
                total: data.length,
                data: data
            };

            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=pending-actions-export-${Date.now()}.json`);
                res.json(exportData);
            } else if (format === 'csv') {
                // Формируем CSV
                const headers = ['id', 'type', 'severity', 'description', 'session_id', 'task_id', 'detected_at', 'resolved_at', 'auto_resolved'];
                const csvRows = [headers.join(',')];

                for (const item of data) {
                    const row = headers.map(header => {
                        let value = item[header];
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            value = `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    });
                    csvRows.push(row.join(','));
                }

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=pending-actions-export-${Date.now()}.csv`);
                res.send(csvRows.join('\n'));
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Unsupported format. Use json or csv'
                });
            }
        } catch (error) {
            console.error('[PendingController] Error exporting pending:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/pending/analytics/types
     * Получить аналитику по типам проблем
     */
    async getTypeAnalytics(req, res) {
        try {
            const period = parseInt(req.query.period) || 30; // дней
            const stats = await PendingActionModel.getStatsByType();

            // Добавляем процент изменения
            const statsWithChange = await Promise.all(stats.map(async (stat) => {
                const previousPeriod = await this._getPreviousPeriodCount(stat.type, period);
                const change = previousPeriod > 0
                    ? (((stat.total - previousPeriod) / previousPeriod) * 100).toFixed(1)
                    : (stat.total > 0 ? '+100' : '0');
                return {
                    ...stat,
                    change: parseFloat(change),
                    trend: this._getTrendDirection(parseFloat(change))
                };
            }));

            res.json({
                success: true,
                data: statsWithChange,
                period: `${period} days`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[PendingController] Error getting type analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    /**
     * Получить количество за предыдущий период
     */
    async _getPreviousPeriodCount(type, days) {
        const stmt = db.prepare(`
            SELECT COUNT(*) as count
            FROM pending_actions
            WHERE type = ?
            AND detected_at > ?
            AND detected_at <= ?
        `);
        const now = Date.now();
        const currentStart = now - (days * 24 * 60 * 60 * 1000);
        const previousStart = currentStart - (days * 24 * 60 * 60 * 1000);
        const result = stmt.get(type, previousStart, currentStart);
        return result?.count || 0;
    },

    /**
     * Получить направление тренда
     */
    _getTrendDirection(change) {
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    },

    /**
     * Получить тренды за период
     */
    async _getTrends(periodHours) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00', datetime(detected_at/1000, 'unixepoch')) as hour,
                type,
                COUNT(*) as count
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY hour, type
            ORDER BY hour ASC
        `);
        const results = stmt.all(since);

        // Группируем по часам
        const trends = {};
        for (const row of results) {
            if (!trends[row.type]) {
                trends[row.type] = [];
            }
            trends[row.type].push({
                hour: row.hour,
                count: row.count
            });
        }

        return trends;
    },

    /**
     * Получить прогнозы проблем
     */
    async _getPredictions() {
        const stmt = db.prepare(`
            SELECT 
                type,
                COUNT(*) as total,
                AVG(CASE WHEN auto_resolved = 1 THEN 1 ELSE 0 END) * 100 as resolve_rate,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type
        `);
        const since = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const results = stmt.all(since);

        const predictions = [];
        for (const row of results) {
            if (row.resolve_rate < 30 && row.total > 5) {
                predictions.push({
                    type: row.type,
                    risk: 'high',
                    message: `Низкий процент разрешения (${row.resolve_rate.toFixed(1)}%) для типа "${row.type}"`,
                    recommendation: 'Требуется анализ причин и ручное вмешательство'
                });
            } else if (row.resolve_rate < 60 && row.total > 10) {
                predictions.push({
                    type: row.type,
                    risk: 'medium',
                    message: `Средний процент разрешения (${row.resolve_rate.toFixed(1)}%) для типа "${row.type}"`,
                    recommendation: 'Рекомендуется оптимизировать процесс обработки'
                });
            }
        }

        return predictions;
    },

    /**
     * Генерация рекомендаций на основе статистики
     */
    _generateRecommendations(summary, topIssues) {
        const recommendations = [];

        if (summary.current?.critical > 0) {
            recommendations.push({
                priority: 'critical',
                message: `Обнаружено ${summary.current.critical} критических неразрешенных проблем`,
                action: 'Требуется немедленное вмешательство'
            });
        }

        if (summary.current?.unresolved > 10) {
            recommendations.push({
                priority: 'high',
                message: `Накоплено ${summary.current.unresolved} неразрешенных проблем`,
                action: 'Рекомендуется провести анализ и массовое разрешение'
            });
        }

        if (topIssues.length > 0 && topIssues[0].occurrences > 5) {
            recommendations.push({
                priority: 'medium',
                message: `Наиболее частая проблема: ${topIssues[0].type} (${topIssues[0].occurrences} раз)`,
                action: 'Требуется анализ корневых причин'
            });
        }

        return recommendations;
    },

    /**
     * Группировка по серьезности
     */
    _groupBySeverity(actions) {
        const groups = { critical: 0, high: 0, medium: 0, low: 0 };
        for (const action of actions) {
            const severity = action.severity || 'medium';
            if (groups[severity] !== undefined) groups[severity]++;
            else groups.medium++;
        }
        return groups;
    },

    /**
     * Группировка по типу
     */
    _groupByType(actions) {
        const groups = {};
        for (const action of actions) {
            const type = action.type || 'unknown';
            groups[type] = (groups[type] || 0) + 1;
        }
        return groups;
    },

    /**
     * Форматирование длительности
     */
    _formatDuration(ms) {
        if (ms < 0) return '0с';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    }
};

export default pendingController;