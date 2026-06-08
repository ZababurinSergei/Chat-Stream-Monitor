// server/controllers/taskController.js - Полная версия с обновлениями
import { TaskModel } from '../models/Task.js';
import { TaskService } from '../services/taskService.js';
import { db } from '../database/db.js';

export const taskController = {
    /**
     * POST /api/tasks
     * Сохранить задачу (сообщение пользователя + ответ чата)
     */
    async saveTask(req, res) {
        try {
            const taskData = req.body;

            // Валидация обязательных полей
            if (!taskData.id) {
                return res.status(400).json({
                    success: false,
                    error: 'task id is required'
                });
            }

            if (!taskData.sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            if (!taskData.userMessage) {
                return res.status(400).json({
                    success: false,
                    error: 'userMessage is required'
                });
            }

            // Проверяем существование сессии, если нет - создаем
            const sessionExists = await TaskModel.checkSessionExists(taskData.sessionId);
            if (!sessionExists) {
                await TaskModel.createSession({
                    id: taskData.sessionId,
                    startTime: taskData.startTime || Date.now(),
                    status: 'active'
                });
            }

            const result = await TaskService.processCompletedTask(taskData);

            res.status(201).json({
                success: true,
                message: 'Task saved successfully',
                data: result
            });
        } catch (error) {
            console.error('[TaskController] Error saving task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/:id
     * Получить задачу по ID
     */
    async getTask(req, res) {
        try {
            const { id } = req.params;
            const task = await TaskModel.getById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Получаем связанные pending actions
            const pendingActions = await TaskModel.getPendingActionsByTaskId(id);

            res.json({
                success: true,
                data: {
                    ...task,
                    pendingActions: pendingActions
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/session/:sessionId
     * Получить все задачи сессии
     */
    async getTasksBySession(req, res) {
        try {
            const { sessionId } = req.params;
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            // Проверяем существование сессии
            const sessionExists = await TaskModel.checkSessionExists(sessionId);
            if (!sessionExists) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }

            const tasks = await TaskModel.getBySessionId(sessionId, limit, offset);
            const stats = await TaskModel.getStats(sessionId);
            const sessionInfo = await TaskModel.getSessionInfo(sessionId);

            res.json({
                success: true,
                data: {
                    session: sessionInfo,
                    tasks,
                    stats,
                    pagination: {
                        limit,
                        offset,
                        total: tasks.length,
                        hasMore: tasks.length === limit
                    }
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting session tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/failed/list
     * Получить список failed задач с анализом
     */
    async getFailedTasks(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const includeAnalysis = req.query.analysis !== 'false';
            const tasks = await TaskModel.getFailedTasks(limit);

            let analyzedTasks = tasks;

            if (includeAnalysis) {
                analyzedTasks = tasks.map(task => ({
                    ...task,
                    analysis: {
                        possibleCauses: this.analyzeFailureReason(task),
                        recommendations: this.getRecommendationsForFailure(task),
                        severity: this.getFailureSeverity(task),
                        canAutoFix: this.canAutoFix(task)
                    }
                }));
            }

            // Статистика по failed задачам
            const failedStats = {
                total: tasks.length,
                byReason: this.groupFailuresByReason(tasks),
                bySeverity: this.groupFailuresBySeverity(tasks),
                averageDuration: tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / (tasks.length || 1)
            };

            res.json({
                success: true,
                data: analyzedTasks,
                stats: failedStats,
                total: tasks.length
            });
        } catch (error) {
            console.error('[TaskController] Error getting failed tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/analyze/:id
     * Детальный анализ задачи
     */
    async analyzeTask(req, res) {
        try {
            const { id } = req.params;
            const task = await TaskModel.getById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Полный анализ задачи
            const analysis = await TaskService.analyzeTask(task);

            // Метрики качества ответа
            const qualityMetrics = {
                responseQuality: this.calculateResponseQuality(task.assistant_response),
                relevanceScore: this.calculateRelevanceScore(task.user_message, task.assistant_response),
                completenessScore: this.calculateCompletenessScore(task.assistant_response),
                readabilityScore: this.calculateReadabilityScore(task.assistant_response),
                uniquenessScore: await this.calculateUniquenessScore(task.assistant_response),
                timestamp: new Date().toISOString()
            };

            // Извлечение ключевых тем
            const keyTopics = this.extractKeyTopics(task.assistant_response);

            // Статистика по словам
            const wordStats = this.getWordStats(task.assistant_response);

            res.json({
                success: true,
                data: {
                    task: {
                        id: task.id,
                        sessionId: task.session_id,
                        userMessage: task.user_message,
                        assistantResponse: task.assistant_response,
                        startTime: task.start_time,
                        endTime: task.end_time,
                        duration: task.duration,
                        status: task.status,
                        validationScore: task.validation_score,
                        isValid: task.is_valid === 1,
                        errorMessage: task.error_message,
                        htmlBlocksCount: task.html_blocks_count,
                        continueClicks: task.continue_clicks || 0
                    },
                    analysis,
                    qualityMetrics,
                    keyTopics,
                    wordStats
                }
            });
        } catch (error) {
            console.error('[TaskController] Error analyzing task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/tasks/:id/status
     * Обновить статус задачи
     */
    async updateTaskStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, validationScore, isValid, errorMessage } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'status is required'
                });
            }

            const validStatuses = ['pending', 'processing', 'completed', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const result = await TaskModel.updateStatus(id, status, validationScore, isValid, errorMessage);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Если задача завершена, обновляем статистику сессии
            if (status === 'completed' || status === 'failed') {
                const task = await TaskModel.getById(id);
                if (task) {
                    await TaskModel.updateSessionStats(task.session_id);
                }
            }

            res.json({
                success: true,
                message: 'Task status updated successfully',
                data: { id, status, validationScore, isValid, errorMessage }
            });
        } catch (error) {
            console.error('[TaskController] Error updating task status:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/stats/summary
     * Получить сводную статистику по задачам
     */
    async getTasksSummary(req, res) {
        try {
            const period = parseInt(req.query.period) || 24;
            const since = Date.now() - (period * 60 * 60 * 1000);

            const stats = await TaskModel.getSummaryStats(since);
            const trends = await TaskModel.getTrends(7);
            const topIssues = await TaskModel.getTopIssues(period);

            // Вычисляем дополнительные метрики
            const avgResponseLength = await TaskModel.getAvgResponseLength(since);
            const completionRate = stats.total_tasks > 0
                ? ((stats.completed_tasks / stats.total_tasks) * 100).toFixed(2)
                : 0;

            // Генерация рекомендаций
            const recommendations = [];

            if (stats.failedRate > 20) {
                recommendations.push({
                    priority: 'high',
                    issue: `Высокий процент failed задач: ${stats.failedRate}%`,
                    suggestion: 'Рекомендуется проверить стабильность сервера DeepSeek и соединение',
                    action: 'check_server_health'
                });
            }

            if (stats.avgValidationScore < 60) {
                recommendations.push({
                    priority: 'medium',
                    issue: `Низкая средняя оценка валидации: ${stats.avgValidationScore}`,
                    suggestion: 'Качество ответов требует улучшения. Рассмотрите возможность настройки prompt',
                    action: 'review_prompts'
                });
            }

            if (stats.avgDuration > 30000) {
                recommendations.push({
                    priority: 'medium',
                    issue: `Высокое среднее время ответа: ${(stats.avgDuration / 1000).toFixed(1)} сек`,
                    suggestion: 'Рекомендуется оптимизировать запросы или увеличить таймауты',
                    action: 'optimize_timeouts'
                });
            }

            if (avgResponseLength < 100) {
                recommendations.push({
                    priority: 'low',
                    issue: `Короткие ответы: средняя длина ${avgResponseLength} символов`,
                    suggestion: 'Пользователи получают слишком краткие ответы',
                    action: 'enhance_responses'
                });
            }

            if (topIssues && topIssues.length > 0) {
                recommendations.push({
                    priority: 'high',
                    issue: `Наиболее частая проблема: ${topIssues[0].type}`,
                    suggestion: `Встречается ${topIssues[0].count} раз. Требуется анализ причин`,
                    action: 'investigate_issues'
                });
            }

            res.json({
                success: true,
                data: {
                    period: `${period} hours`,
                    periodStart: new Date(since).toISOString(),
                    periodEnd: new Date().toISOString(),
                    ...stats,
                    completionRate: parseFloat(completionRate),
                    avgResponseLength,
                    trends,
                    topIssues,
                    recommendations
                }
            });
        } catch (error) {
            console.error('[TaskController] Error getting tasks summary:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/search
     * Поиск задач по сообщению пользователя или ответу
     */
    async searchTasks(req, res) {
        try {
            const { q, field = 'both', limit = 20, offset = 0 } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query must be at least 2 characters'
                });
            }

            const validFields = ['userMessage', 'assistantResponse', 'both'];
            if (!validFields.includes(field)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid field. Must be one of: ${validFields.join(', ')}`
                });
            }

            const tasks = await TaskModel.search(q, field, parseInt(limit), parseInt(offset));
            const total = await TaskModel.getSearchCount(q, field);

            // Добавляем релевантность для каждого результата
            const tasksWithRelevance = tasks.map(task => ({
                ...task,
                relevance: this.calculateRelevanceScore(q, task.user_message, task.assistant_response)
            }));

            // Сортируем по релевантности
            tasksWithRelevance.sort((a, b) => b.relevance - a.relevance);

            res.json({
                success: true,
                data: tasksWithRelevance,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total,
                    hasMore: (parseInt(offset) + tasks.length) < total
                },
                query: q,
                field
            });
        } catch (error) {
            console.error('[TaskController] Error searching tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/tasks/session/:sessionId/export
     * Экспорт задач сессии в JSON
     */
    async exportSessionTasks(req, res) {
        try {
            const { sessionId } = req.params;
            const format = req.query.format || 'json';

            const session = await TaskModel.getSessionInfo(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }

            const tasks = await TaskModel.getBySessionId(sessionId, 10000, 0);
            const pendingActions = await TaskModel.getPendingActionsBySessionId(sessionId);

            const exportData = {
                exportDate: new Date().toISOString(),
                exporter: 'DeepSeek Chat Monitor',
                version: '1.0',
                session: {
                    id: session.id,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    status: session.status,
                    totalTasks: session.total_tasks,
                    completedTasks: session.completed_tasks,
                    failedTasks: session.failed_tasks,
                    duration: session.end_time ? session.end_time - session.start_time : null
                },
                tasks: tasks.map(task => ({
                    id: task.id,
                    userMessage: task.user_message,
                    assistantResponse: task.assistant_response,
                    startTime: task.start_time,
                    endTime: task.end_time,
                    duration: task.duration,
                    status: task.status,
                    validationScore: task.validation_score,
                    isValid: task.is_valid === 1,
                    errorMessage: task.error_message,
                    htmlBlocksCount: task.html_blocks_count,
                    continueClicks: task.continue_clicks || 0,
                    createdAt: task.created_at
                })),
                pendingActions: pendingActions,
                summary: {
                    totalTasks: tasks.length,
                    completedTasks: tasks.filter(t => t.status === 'completed').length,
                    failedTasks: tasks.filter(t => t.status === 'failed').length,
                    avgDuration: tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / (tasks.length || 1),
                    avgValidationScore: tasks.reduce((sum, t) => sum + (t.validation_score || 0), 0) / (tasks.length || 1),
                    totalContinueClicks: tasks.reduce((sum, t) => sum + (t.continue_clicks || 0), 0),
                    totalResponseLength: tasks.reduce((sum, t) => sum + (t.assistant_response?.length || 0), 0)
                }
            };

            if (format === 'json') {
                res.json({
                    success: true,
                    data: exportData
                });
            } else if (format === 'csv') {
                // Формируем CSV
                const csvRows = [
                    ['ID', 'User Message', 'Assistant Response', 'Start Time', 'End Time', 'Duration (ms)', 'Status', 'Validation Score', 'Is Valid', 'Error Message', 'Continue Clicks']
                ];

                for (const task of exportData.tasks) {
                    csvRows.push([
                        task.id,
                        `"${task.userMessage.replace(/"/g, '""')}"`,
                        `"${(task.assistantResponse || '').replace(/"/g, '""').substring(0, 1000)}"`,
                        new Date(task.startTime).toISOString(),
                        task.endTime ? new Date(task.endTime).toISOString() : '',
                        task.duration || '',
                        task.status,
                        task.validationScore || '',
                        task.isValid ? 'Yes' : 'No',
                        `"${(task.errorMessage || '').replace(/"/g, '""')}"`,
                        task.continueClicks || 0
                    ]);
                }

                const csvContent = csvRows.map(row => row.join(',')).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=session_${sessionId}_export.csv`);
                res.send(csvContent);
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Unsupported format. Use json or csv'
                });
            }
        } catch (error) {
            console.error('[TaskController] Error exporting session tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/tasks/:id
     * Удалить задачу
     */
    async deleteTask(req, res) {
        try {
            const { id } = req.params;

            // Проверяем существование задачи
            const task = await TaskModel.getById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            const result = await TaskModel.delete(id);

            // Обновляем статистику сессии
            if (task.session_id) {
                await TaskModel.updateSessionStats(task.session_id);
            }

            res.json({
                success: true,
                message: 'Task deleted successfully',
                data: { id, sessionId: task.session_id }
            });
        } catch (error) {
            console.error('[TaskController] Error deleting task:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/tasks/batch
     * Массовое сохранение задач
     */
    async saveBatchTasks(req, res) {
        try {
            const { tasks, sessionId } = req.body;

            if (!Array.isArray(tasks) || tasks.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'tasks array is required and must not be empty'
                });
            }

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId is required'
                });
            }

            // Проверяем существование сессии
            const sessionExists = await TaskModel.checkSessionExists(sessionId);
            if (!sessionExists) {
                await TaskModel.createSession({
                    id: sessionId,
                    startTime: tasks[0]?.startTime || Date.now(),
                    status: 'active'
                });
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < tasks.length; i++) {
                try {
                    const taskData = { ...tasks[i], sessionId };
                    const result = await TaskService.processCompletedTask(taskData);
                    results.push(result);
                } catch (err) {
                    errors.push({ index: i, task: tasks[i]?.id, error: err.message });
                }
            }

            // Обновляем статистику сессии
            await TaskModel.updateSessionStats(sessionId);

            res.status(201).json({
                success: true,
                message: `${results.length} tasks saved successfully`,
                data: {
                    succeeded: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors,
                    sessionId
                }
            });
        } catch (error) {
            console.error('[TaskController] Error saving batch tasks:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ АНАЛИЗА ==========

    analyzeFailureReason(task) {
        const reasons = [];

        if (!task.assistant_response || task.assistant_response.length === 0) {
            reasons.push({
                type: 'no_response',
                description: 'Ответ не получен от сервера',
                severity: 'high'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            reasons.push({
                type: 'low_validation',
                description: `Низкая оценка валидации ответа: ${task.validation_score}/100`,
                severity: 'medium'
            });
        }

        if (task.duration && task.duration > 60000) {
            reasons.push({
                type: 'timeout',
                description: `Превышено время ожидания ответа: ${(task.duration / 1000).toFixed(1)} сек`,
                severity: 'high'
            });
        }

        if (task.error_message) {
            reasons.push({
                type: 'error_message',
                description: task.error_message,
                severity: 'high'
            });
        }

        if (task.continue_clicks && task.continue_clicks > 2) {
            reasons.push({
                type: 'multiple_continues',
                description: `Требовалось ${task.continue_clicks} нажатий Continue для получения полного ответа`,
                severity: 'low'
            });
        }

        if (reasons.length === 0) {
            reasons.push({
                type: 'unknown',
                description: 'Неизвестная причина',
                severity: 'medium'
            });
        }

        return reasons;
    },

    getRecommendationsForFailure(task) {
        const recommendations = [];

        if (!task.assistant_response || task.assistant_response.length === 0) {
            recommendations.push({
                priority: 1,
                action: 'reload_page',
                description: 'Перезагрузите страницу чата и повторите запрос'
            });
            recommendations.push({
                priority: 2,
                action: 'check_connection',
                description: 'Проверьте соединение с интернетом'
            });
            recommendations.push({
                priority: 3,
                action: 'retry_request',
                description: 'Отправьте запрос повторно через 30 секунд'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            recommendations.push({
                priority: 1,
                action: 'refine_query',
                description: 'Уточните формулировку запроса, сделайте его более конкретным'
            });
            recommendations.push({
                priority: 2,
                action: 'break_down',
                description: 'Разбейте сложный вопрос на несколько простых'
            });
            recommendations.push({
                priority: 3,
                action: 'add_context',
                description: 'Добавьте больше контекста в запрос'
            });
        }

        if (task.duration && task.duration > 60000) {
            recommendations.push({
                priority: 1,
                action: 'reduce_scope',
                description: 'Уменьшите объем запроса или ограничьте область поиска'
            });
            recommendations.push({
                priority: 2,
                action: 'try_later',
                description: 'Попробуйте отправить запрос позже, когда сервер менее загружен'
            });
            recommendations.push({
                priority: 3,
                action: 'increase_timeout',
                description: 'Увеличьте таймаут ожидания ответа в конфигурации'
            });
        }

        if (task.continue_clicks && task.continue_clicks > 2) {
            recommendations.push({
                priority: 2,
                action: 'concise_request',
                description: 'Попросите ассистента быть более кратким'
            });
            recommendations.push({
                priority: 3,
                action: 'chunk_request',
                description: 'Разделите запрос на несколько частей'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 2,
                action: 'contact_support',
                description: 'Обратитесь в службу поддержки DeepSeek с деталями ошибки'
            });
        }

        return recommendations.sort((a, b) => a.priority - b.priority);
    },

    getFailureSeverity(task) {
        if (!task.assistant_response || task.assistant_response.length === 0) return 'critical';
        if (task.duration && task.duration > 120000) return 'critical';
        if (task.validation_score && task.validation_score < 30) return 'high';
        if (task.validation_score && task.validation_score < 60) return 'medium';
        if (task.continue_clicks && task.continue_clicks > 3) return 'medium';
        return 'low';
    },

    canAutoFix(task) {
        if (!task.assistant_response || task.assistant_response.length === 0) return true;
        if (task.duration && task.duration > 60000) return true;
        if (task.validation_score && task.validation_score < 40) return false;
        return false;
    },

    groupFailuresByReason(tasks) {
        const reasons = {};

        tasks.forEach(task => {
            if (!task.assistant_response || task.assistant_response.length === 0) {
                reasons['no_response'] = (reasons['no_response'] || 0) + 1;
            } else if (task.validation_score && task.validation_score < 50) {
                reasons['low_validation'] = (reasons['low_validation'] || 0) + 1;
            } else if (task.duration && task.duration > 60000) {
                reasons['timeout'] = (reasons['timeout'] || 0) + 1;
            } else if (task.error_message) {
                reasons['error'] = (reasons['error'] || 0) + 1;
            } else {
                reasons['unknown'] = (reasons['unknown'] || 0) + 1;
            }
        });

        return Object.entries(reasons).map(([reason, count]) => ({ reason, count }));
    },

    groupFailuresBySeverity(tasks) {
        const severities = { low: 0, medium: 0, high: 0, critical: 0 };

        tasks.forEach(task => {
            const severity = this.getFailureSeverity(task);
            severities[severity]++;
        });

        return severities;
    },

    calculateResponseQuality(response) {
        if (!response) return 0;

        let score = 0;

        // Длина ответа (0-25 баллов)
        if (response.length > 1000) score += 25;
        else if (response.length > 500) score += 20;
        else if (response.length > 200) score += 15;
        else if (response.length > 100) score += 10;
        else if (response.length > 20) score += 5;

        // Наличие структуры (0-20 баллов)
        if (/\n\s*[-*•]\s/.test(response)) score += 10;
        if (/^#{1,3}\s/m.test(response)) score += 10;

        // Наличие кода (0-20 баллов)
        if (/```[\s\S]*?```/.test(response)) score += 20;
        else if (/`[^`]+`/.test(response)) score += 10;

        // Наличие завершающей пунктуации (0-10 баллов)
        if (/[.!?]$/.test(response.trim())) score += 10;

        // Отсутствие маркеров ошибок (0-15 баллов)
        if (!/error|ошибка|извините|sorry|cannot|не могу/i.test(response)) score += 15;
        else if (!/error|ошибка/i.test(response)) score += 5;

        // Наличие полезных элементов (0-10 баллов)
        if (/\d+\.\s+[A-ZА-Я]/.test(response)) score += 5; // Нумерованные списки
        if(/\*\*[^*]+\*\*/.test(response)) score += 5; // Жирный текст

        return Math.min(100, score);
    },

    calculateRelevanceScore(query, userMessage, assistantResponse) {
        if (!query || (!userMessage && !assistantResponse)) return 0;

        let score = 0;
        const queryLower = query.toLowerCase();

        // Проверка в сообщении пользователя
        if (userMessage) {
            const userLower = userMessage.toLowerCase();
            if (userLower.includes(queryLower)) {
                score += 50;
                // Чем точнее совпадение, тем выше балл
                if (userLower === queryLower) score += 20;
                else if (userLower.includes(` ${queryLower} `)) score += 10;
            }
        }

        // Проверка в ответе ассистента
        if (assistantResponse) {
            const responseLower = assistantResponse.toLowerCase();
            const words = queryLower.split(/\s+/);
            const matchedWords = words.filter(word => responseLower.includes(word)).length;
            if (words.length > 0) {
                score += (matchedWords / words.length) * 30;
            }
        }

        return Math.min(100, score);
    },

    calculateCompletenessScore(response) {
        if (!response) return 0;

        let score = 0;

        // Проверка на обрывание предложения (0-30 баллов)
        if (/[.!?]$/.test(response.trim())) {
            score += 30;
        } else if (/[a-zа-я]$/i.test(response.trim())) {
            score -= 20;
        }

        // Проверка на наличие полных предложений (0-30 баллов)
        const sentences = response.match(/[^.!?]+[.!?]+/g);
        if (sentences && sentences.length >= 3) {
            score += 30;
        } else if (sentences && sentences.length >= 2) {
            score += 20;
        } else if (sentences && sentences.length === 1) {
            score += 10;
        }

        // Проверка на наличие вступления и заключения (0-40 баллов)
        const firstLine = response.trim().split(/\n/)[0] || '';
        const lastLine = response.trim().split(/\n/).pop() || '';

        if (/^(Вот|Here is|Согласно|Based on|Давайте|Let's)/i.test(firstLine)) {
            score += 20;
        }
        if(/^(Таким образом|В итоге|Итак|Therefore|So|Thus|В заключение)/i.test(lastLine)) {
            score += 20;
        }

        return Math.min(100, score);
    },

    calculateReadabilityScore(response) {
        if (!response) return 0;

        let score = 50; // Базовая оценка

        // Средняя длина предложения (идеально 15-20 слов)
        const sentences = response.split(/[.!?]+/);
        const avgWordsPerSentence = sentences.reduce((sum, s) =>
            sum + s.trim().split(/\s+/).length, 0) / (sentences.length || 1);

        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
            score += 20;
        } else if (avgWordsPerSentence > 30) {
            score -= 10;
        }

        // Наличие абзацев
        if (response.includes('\n\n')) {
            score += 15;
        } else if (response.includes('\n')) {
            score += 5;
        }

        // Разнообразие слов
        const words = response.toLowerCase().match(/[а-яa-z]+/g) || [];
        const uniqueWords = new Set(words);
        const diversity = uniqueWords.size / (words.length || 1);
        if (diversity > 0.6) score += 15;
        else if (diversity > 0.4) score += 5;

        return Math.min(100, Math.max(0, score));
    },

    async calculateUniquenessScore(response) {
        if (!response) return 0;

        // Простая эвристика для уникальности
        let score = 70; // Базовая оценка

        // Проверка на повторяющиеся фразы
        const phrases = response.match(/(.{20,}?)\1+/g);
        if (phrases) {
            score -= Math.min(30, phrases.length * 10);
        }

        // Проверка на шаблонные фразы
        const templatePhrases = [
            'извините', 'sorry', 'не могу ответить', 'cannot answer',
            'пожалуйста, уточните', 'please clarify', 'к сожалению'
        ];

        const templateCount = templatePhrases.filter(phrase =>
            response.toLowerCase().includes(phrase)
        ).length;

        score -= templateCount * 10;

        return Math.max(0, Math.min(100, score));
    },

    extractKeyTopics(response) {
        if (!response) return [];

        const topics = [];
        const commonWords = new Set(['это', 'что', 'как', 'для', 'на', 'в', 'по', 'с', 'и', 'а', 'но', 'или', 'так', 'же', 'будет', 'может', 'нужно', 'можно']);

        // Извлечение ключевых слов
        const words = response.toLowerCase().match(/[а-яa-z]{4,}/g) || [];
        const wordFrequency = {};

        words.forEach(word => {
            if (!commonWords.has(word)) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });

        // Берем топ-5 ключевых слов
        const sortedWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        sortedWords.forEach(([word, count]) => {
            topics.push({ word, count, relevance: Math.min(100, (count / (words.length || 1)) * 100) });
        });

        // Поиск именованных сущностей (простая эвристика)
        const capitalWords = response.match(/[A-Z][a-z]+/g) || [];
        const uniqueCapitals = [...new Set(capitalWords)];
        uniqueCapitals.slice(0, 3).forEach(entity => {
            topics.push({ word: entity, type: 'entity', relevance: 80 });
        });

        return topics.slice(0, 10);
    },

    getWordStats(response) {
        if (!response) {
            return { totalWords: 0, uniqueWords: 0, avgWordLength: 0, sentences: 0 };
        }

        const words = response.match(/[а-яa-z]+/gi) || [];
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);

        return {
            totalWords: words.length,
            uniqueWords: uniqueWords.size,
            avgWordLength: parseFloat(avgWordLength.toFixed(1)),
            sentences: sentences.length,
            avgWordsPerSentence: parseFloat((words.length / (sentences.length || 1)).toFixed(1))
        };
    }
};