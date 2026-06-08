// server/services/taskService.js - Полная версия с обновлениями
import { TaskModel } from '../models/Task.js';
import { PendingActionModel } from '../models/PendingAction.js';
import { AnalyzerService } from './analyzerService.js';
import { db } from '../database/db.js';

export class TaskService {

    /**
     * Обработка завершенной задачи
     * @param {Object} taskData - Данные задачи
     * @returns {Promise<Object>} Результат обработки
     */
    static async processCompletedTask(taskData) {
        // Сохраняем задачу
        const task = await TaskModel.save({
            id: taskData.id,
            sessionId: taskData.sessionId,
            userMessage: taskData.userMessage,
            assistantResponse: taskData.assistantResponse,
            startTime: taskData.startTime,
            endTime: taskData.endTime,
            duration: taskData.duration,
            status: taskData.status,
            validationScore: taskData.validationScore,
            isValid: taskData.isValid,
            errorMessage: taskData.errorMessage,
            htmlBlocksCount: taskData.htmlBlocksCount,
            continueClicks: taskData.continueClicks || 0
        });

        // Сохраняем полный ответ
        if (taskData.assistantResponse) {
            await TaskModel.saveAssistantResponse(taskData.id, taskData.assistantResponse);
        }

        // Обновляем статистику сессии
        await TaskModel.updateSessionStats(taskData.sessionId);

        // Анализируем задачу
        const analysis = AnalyzerService.analyzeTask({
            id: taskData.id,
            session_id: taskData.sessionId,
            user_message: taskData.userMessage,
            assistant_response: taskData.assistantResponse,
            duration: taskData.duration,
            validation_score: taskData.validationScore,
            is_valid: taskData.isValid,
            word_count: taskData.assistantResponse?.split(/\s+/).length || 0,
            continue_clicks: taskData.continueClicks || 0
        });

        return {
            task: taskData,
            analysis: analysis,
            saved: true
        };
    }

    /**
     * Обработка неопределенного состояния
     * @param {Object} actionData - Данные неопределенного состояния
     * @returns {Promise<Object>} Результат обработки
     */
    static async processPendingAction(actionData) {
        const action = await PendingActionModel.save(actionData);

        // Анализируем проблему
        const analysis = AnalyzerService.analyzePendingAction({
            id: action.lastInsertRowid,
            type: actionData.type,
            severity: actionData.severity,
            description: actionData.description
        });

        // Обновляем сессию
        await PendingActionModel.updateSessionPendingCount(actionData.sessionId);

        return {
            action: actionData,
            analysis: analysis,
            saved: true,
            id: action.lastInsertRowid
        };
    }

    /**
     * Получить задачи для анализа
     * @param {Object} options - Опции фильтрации
     * @returns {Promise<Array>} Массив задач с анализом
     */
    static async getTasksForAnalysis(options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = null,
            sessionId = null,
            fromDate = null,
            toDate = null
        } = options;

        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE 1=1
        `;

        const params = [];

        if (sessionId) {
            query += ` AND t.session_id = ?`;
            params.push(sessionId);
        }

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }

        if (fromDate) {
            query += ` AND t.created_at >= datetime(?)`;
            params.push(fromDate);
        }

        if (toDate) {
            query += ` AND t.created_at <= datetime(?)`;
            params.push(toDate);
        }

        query += ` ORDER BY t.start_time DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        // Анализируем каждую задачу
        const analyzedTasks = tasks.map(task => ({
            ...task,
            analysis: AnalyzerService.analyzeTask(task)
        }));

        return analyzedTasks;
    }

    /**
     * Получить неразрешенные проблемы
     * @param {number} limit - Максимальное количество записей
     * @returns {Promise<Array>} Массив проблем с анализом
     */
    static async getUnresolvedIssues(limit = 50) {
        const pending = await PendingActionModel.getUnresolved(limit);

        const analyzedIssues = pending.map(issue => ({
            ...issue,
            analysis: AnalyzerService.analyzePendingAction(issue),
            timeSinceDetected: Date.now() - issue.detected_at,
            timeSinceDetectedFormatted: this.formatDuration(Date.now() - issue.detected_at)
        }));

        return analyzedIssues;
    }

    /**
     * Получить детальную информацию о задаче
     * @param {string} taskId - ID задачи
     * @returns {Promise<Object>} Детальная информация
     */
    static async getTaskDetails(taskId) {
        const task = await TaskModel.getById(taskId);

        if (!task) {
            return null;
        }

        // Получаем связанные проблемы
        const pendingActions = await PendingActionModel.getByTaskId(taskId);

        // Получаем историю сессии
        const sessionTasks = await TaskModel.getBySessionId(task.session_id, 100, 0);

        // Анализируем контекст
        const contextAnalysis = this.analyzeTaskContext(task, sessionTasks);

        return {
            task: task,
            pendingActions: pendingActions,
            sessionTasks: sessionTasks,
            contextAnalysis: contextAnalysis,
            recommendations: this.generateRecommendations(task, pendingActions)
        };
    }

    /**
     * Анализ контекста задачи
     * @param {Object} task - Текущая задача
     * @param {Array} sessionTasks - Все задачи сессии
     * @returns {Object} Анализ контекста
     */
    static analyzeTaskContext(task, sessionTasks) {
        const taskIndex = sessionTasks.findIndex(t => t.id === task.id);
        const previousTasks = sessionTasks.slice(0, taskIndex);
        const nextTasks = sessionTasks.slice(taskIndex + 1);

        // Проверка на повторяющиеся проблемы
        const similarIssues = previousTasks.filter(t =>
            t.status === 'failed' &&
            t.user_message && task.user_message &&
            this.similarityScore(t.user_message, task.user_message) > 0.7
        );

        // Проверка на последовательные ошибки
        const consecutiveFailures = this.getConsecutiveFailures(sessionTasks, taskIndex);

        return {
            positionInSession: taskIndex + 1,
            totalInSession: sessionTasks.length,
            previousTasksCount: previousTasks.length,
            nextTasksCount: nextTasks.length,
            similarIssuesCount: similarIssues.length,
            similarIssues: similarIssues.slice(0, 5),
            consecutiveFailures: consecutiveFailures,
            isRecurringIssue: similarIssues.length > 0,
            failureRate: this.calculateFailureRate(sessionTasks)
        };
    }

    /**
     * Генерация рекомендаций на основе задачи и проблем
     * @param {Object} task - Задача
     * @param {Array} pendingActions - Связанные проблемы
     * @returns {Array} Список рекомендаций
     */
    static generateRecommendations(task, pendingActions) {
        const recommendations = [];

        // Рекомендации на основе статуса задачи
        if (task.status === 'failed') {
            recommendations.push({
                type: 'task_failed',
                priority: 'high',
                message: 'Задача завершилась с ошибкой. Рекомендуется проанализировать причину.',
                action: 'review_task'
            });
        }

        if (task.validation_score && task.validation_score < 50) {
            recommendations.push({
                type: 'low_validation',
                priority: 'medium',
                message: `Низкая оценка валидации: ${task.validation_score}/100. Требуется проверка качества ответа.`,
                action: 'review_quality'
            });
        }

        // Рекомендации на основе проблем
        for (const action of pendingActions) {
            if (!action.auto_resolved) {
                recommendations.push({
                    type: action.type,
                    priority: action.severity === 'high' ? 'high' : 'medium',
                    message: action.suggested_action || `Необходимо разрешить проблему типа: ${action.type}`,
                    action: 'resolve_pending',
                    pendingId: action.id
                });
            }
        }

        // Рекомендации на основе длительности
        if (task.duration && task.duration > 60000) {
            recommendations.push({
                type: 'slow_response',
                priority: 'low',
                message: `Длительный ответ: ${(task.duration / 1000).toFixed(1)} секунд.`,
                action: 'optimize_performance'
            });
        }

        // Рекомендации на основе Continue кликов
        if (task.continue_clicks && task.continue_clicks > 3) {
            recommendations.push({
                type: 'many_continue_clicks',
                priority: 'low',
                message: `Много нажатий Continue (${task.continue_clicks}). Возможно, ответ слишком длинный.`,
                action: 'consider_response_chunking'
            });
        }

        return recommendations;
    }

    /**
     * Расчет коэффициента схожести строк
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} Коэффициент схожести (0-1)
     */
    static similarityScore(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Расстояние Левенштейна
     * @param {string} str1 - Первая строка
     * @param {string} str2 - Вторая строка
     * @returns {number} Расстояние Левенштейна
     */
    static levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Получение последовательных ошибок
     * @param {Array} tasks - Массив задач
     * @param {number} currentIndex - Индекс текущей задачи
     * @returns {number} Количество последовательных ошибок
     */
    static getConsecutiveFailures(tasks, currentIndex) {
        let count = 0;
        for (let i = currentIndex; i >= 0; i--) {
            if (tasks[i]?.status === 'failed') {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * Расчет процента ошибок
     * @param {Array} tasks - Массив задач
     * @returns {number} Процент ошибок
     */
    static calculateFailureRate(tasks) {
        if (tasks.length === 0) return 0;
        const failedCount = tasks.filter(t => t.status === 'failed').length;
        return (failedCount / tasks.length) * 100;
    }

    /**
     * Форматирование длительности
     * @param {number} ms - Длительность в миллисекундах
     * @returns {string} Отформатированная длительность
     */
    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        if (hours > 0) return `${hours}ч ${minutes % 60}м`;
        if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
        return `${seconds}с`;
    }

    /**
     * Получение статистики по задачам
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Object>} Статистика
     */
    static async getTaskStatistics(sessionId = null) {
        const stats = await TaskModel.getStats(sessionId);

        // Добавляем дополнительные метрики
        const additionalStats = {
            averageResponseLength: await this.getAverageResponseLength(sessionId),
            averageContinueClicks: await this.getAverageContinueClicks(sessionId),
            successRateTrend: await this.getSuccessRateTrend(sessionId),
            commonIssues: await this.getCommonIssues(sessionId)
        };

        return {
            ...stats,
            ...additionalStats
        };
    }

    /**
     * Получение средней длины ответа
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<number>} Средняя длина ответа
     */
    static async getAverageResponseLength(sessionId = null) {
        let query = `
            SELECT AVG(ar.response_length) as avg_length
            FROM tasks t
            JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.status = 'completed'
        `;
        const params = [];

        if (sessionId) {
            query += ` AND t.session_id = ?`;
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_length || 0;
    }

    /**
     * Получение среднего количества Continue кликов
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<number>} Среднее количество Continue кликов
     */
    static async getAverageContinueClicks(sessionId = null) {
        let query = `
            SELECT AVG(continue_clicks) as avg_clicks
            FROM tasks
            WHERE status = 'completed'
        `;
        const params = [];

        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.avg_clicks || 0;
    }

    /**
     * Получение тренда успешности
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Array>} Тренд успешности по времени
     */
    static async getSuccessRateTrend(sessionId = null) {
        let query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM tasks
        `;
        const params = [];

        if (sessionId) {
            query += ` WHERE session_id = ?`;
            params.push(sessionId);
        }

        query += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`;

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        return results.map(r => ({
            date: r.date,
            total: r.total,
            completed: r.completed,
            successRate: r.total > 0 ? (r.completed / r.total) * 100 : 0
        }));
    }

    /**
     * Получение распространенных проблем
     * @param {string} sessionId - ID сессии (опционально)
     * @returns {Promise<Array>} Список распространенных проблем
     */
    static async getCommonIssues(sessionId = null) {
        let query = `
            SELECT 
                pa.type,
                COUNT(*) as count,
                pa.severity
            FROM pending_actions pa
        `;
        const params = [];

        if (sessionId) {
            query += ` WHERE pa.session_id = ?`;
            params.push(sessionId);
        }

        query += ` GROUP BY pa.type, pa.severity ORDER BY count DESC LIMIT 10`;

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    /**
     * Экспорт данных для аналитики
     * @param {Object} options - Опции экспорта
     * @returns {Promise<Object>} Экспортированные данные
     */
    static async exportAnalyticsData(options = {}) {
        const {
            fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            toDate = new Date().toISOString(),
            includeTasks = true,
            includePending = true,
            includeSessions = true
        } = options;

        const exportData = {
            exportedAt: new Date().toISOString(),
            period: { from: fromDate, to: toDate },
            summary: {}
        };

        // Общая статистика
        const overallStats = db.prepare(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_validation_score,
                COUNT(DISTINCT pa.id) as total_pending,
                COUNT(DISTINCT s.id) as total_sessions
            FROM tasks t
            LEFT JOIN pending_actions pa ON t.id = pa.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE t.created_at BETWEEN datetime(?) AND datetime(?)
        `).get(fromDate, toDate);

        exportData.summary = overallStats;

        if (includeTasks) {
            const tasks = db.prepare(`
                SELECT t.*, ar.response_text as full_response
                FROM tasks t
                LEFT JOIN assistant_responses ar ON t.id = ar.task_id
                WHERE t.created_at BETWEEN datetime(?) AND datetime(?)
                ORDER BY t.created_at DESC
            `).all(fromDate, toDate);
            exportData.tasks = tasks;
        }

        if (includePending) {
            const pending = db.prepare(`
                SELECT pa.*, t.user_message
                FROM pending_actions pa
                LEFT JOIN tasks t ON pa.task_id = t.id
                WHERE pa.created_at BETWEEN datetime(?) AND datetime(?)
                ORDER BY pa.created_at DESC
            `).all(fromDate, toDate);
            exportData.pendingActions = pending;
        }

        if (includeSessions) {
            const sessions = db.prepare(`
                SELECT s.*, COUNT(t.id) as task_count
                FROM sessions s
                LEFT JOIN tasks t ON s.id = t.session_id
                WHERE s.created_at BETWEEN datetime(?) AND datetime(?)
                GROUP BY s.id
                ORDER BY s.created_at DESC
            `).all(fromDate, toDate);
            exportData.sessions = sessions;
        }

        return exportData;
    }
}

export default TaskService;