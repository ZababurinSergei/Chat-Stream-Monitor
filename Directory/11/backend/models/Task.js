// models/Task.js - Полная версия с обновлениями
import { db } from '../database/db.js';

export class TaskModel {
    // Сохранить задачу (создать или обновить)
    static save(taskData) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO tasks (
                id, session_id, user_message, assistant_response, 
                start_time, end_time, duration, status, 
                validation_score, is_valid, error_message, html_blocks_count,
                continue_clicks, has_code, word_count, response_length
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const wordCount = taskData.assistantResponse
            ? taskData.assistantResponse.split(/\s+/).length
            : 0;

        const hasCode = taskData.assistantResponse
            ? /```[\s\S]*?```|function|class|const|let|var|import|export/.test(taskData.assistantResponse)
            : false;

        return stmt.run(
            taskData.id,
            taskData.sessionId,
            taskData.userMessage,
            taskData.assistantResponse || null,
            taskData.startTime,
            taskData.endTime || null,
            taskData.duration || null,
            taskData.status || 'pending',
            taskData.validationScore || null,
            taskData.isValid ? 1 : 0,
            taskData.errorMessage || null,
            taskData.htmlBlocksCount || 0,
            taskData.continueClicks || 0,
            hasCode ? 1 : 0,
            wordCount,
            taskData.assistantResponse?.length || 0
        );
    }

    // Сохранить полный ответ ассистента
    static saveAssistantResponse(taskId, responseText, chunkCount = 1) {
        const stmt = db.prepare(`
            INSERT INTO assistant_responses (task_id, response_text, response_length, word_count, chunk_count)
            VALUES (?, ?, ?, ?, ?)
        `);

        const wordCount = responseText ? responseText.split(/\s+/).length : 0;

        return stmt.run(
            taskId,
            responseText || null,
            responseText ? responseText.length : 0,
            wordCount,
            chunkCount
        );
    }

    // Обновить ответ ассистента (для потоковой передачи)
    static updateAssistantResponse(taskId, responseText, chunkCount) {
        const stmt = db.prepare(`
            UPDATE assistant_responses 
            SET response_text = ?, response_length = ?, word_count = ?, chunk_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE task_id = ?
        `);

        const wordCount = responseText ? responseText.split(/\s+/).length : 0;

        return stmt.run(
            responseText,
            responseText ? responseText.length : 0,
            wordCount,
            chunkCount,
            taskId
        );
    }

    // Получить задачу по ID
    static getById(taskId) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   ar.chunk_count,
                   ar.created_at as response_created_at,
                   ar.updated_at as response_updated_at,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            LEFT JOIN sessions s ON t.session_id = s.id
            WHERE t.id = ?
        `);
        return stmt.get(taskId);
    }

    // Получить все задачи сессии
    static getBySessionId(sessionId, limit = 100, offset = 0) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   ar.chunk_count
            FROM tasks t
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.session_id = ?
            ORDER BY t.start_time DESC
            LIMIT ? OFFSET ?
        `);
        return stmt.all(sessionId, limit, offset);
    }

    // Получить задачи с ошибками
    static getFailedTasks(limit = 50, offset = 0) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start,
                   s.id as session_id
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.status = 'failed' OR t.is_valid = 0
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `);
        return stmt.all(limit, offset);
    }

    // Получить задачи с длительным временем ответа
    static getSlowTasks(thresholdMs = 30000, limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.duration > ? AND t.status = 'completed'
            ORDER BY t.duration DESC
            LIMIT ?
        `);
        return stmt.all(thresholdMs, limit);
    }

    // Получить задачи с кодом в ответе
    static getTasksWithCode(limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.has_code = 1
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // Получить задачи по диапазону дат
    static getByDateRange(startDate, endDate, limit = 100) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE datetime(t.created_at) BETWEEN datetime(?) AND datetime(?)
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        return stmt.all(startDate, endDate, limit);
    }

    // Обновить статус задачи
    static updateStatus(taskId, status, validationScore = null, isValid = null, errorMessage = null) {
        const updates = { status };
        if (validationScore !== null) updates.validation_score = validationScore;
        if (isValid !== null) updates.is_valid = isValid ? 1 : 0;
        if (errorMessage !== null) updates.error_message = errorMessage;

        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
        return stmt.run(...values, taskId);
    }

    // Обновить счетчик нажатий Continue
    static updateContinueClicks(taskId, continueClicks) {
        const stmt = db.prepare(`UPDATE tasks SET continue_clicks = ? WHERE id = ?`);
        return stmt.run(continueClicks, taskId);
    }

    // Получить статистику по задачам
    static getStats(sessionId = null) {
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_validation_score,
                SUM(CASE WHEN has_code = 1 THEN 1 ELSE 0 END) as tasks_with_code,
                SUM(continue_clicks) as total_continue_clicks,
                AVG(continue_clicks) as avg_continue_clicks,
                MIN(duration) as min_duration,
                MAX(duration) as max_duration,
                SUM(response_length) as total_response_chars,
                AVG(response_length) as avg_response_chars
            FROM tasks
        `;

        const params = [];
        if (sessionId) {
            query += ' WHERE session_id = ?';
            params.push(sessionId);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);

        // Добавляем процент успешных задач
        if (result.total > 0) {
            result.success_rate = ((result.completed / result.total) * 100).toFixed(2);
        } else {
            result.success_rate = 0;
        }

        return result;
    }

    // Получить детальную аналитику по задачам
    static getDetailedAnalytics(sessionId = null, periodHours = 24) {
        const since = new Date(Date.now() - (periodHours * 60 * 60 * 1000)).toISOString();

        let query = `
            SELECT 
                strftime('%H', datetime(t.created_at / 1000, 'unixepoch')) as hour,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score,
                SUM(continue_clicks) as continue_clicks_total
            FROM tasks t
            WHERE datetime(t.created_at / 1000, 'unixepoch') > datetime(?)
        `;

        const params = [since];
        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        query += ' GROUP BY strftime("%H", datetime(t.created_at / 1000, "unixepoch")) ORDER BY hour';

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    // Удалить задачу
    static delete(taskId) {
        // Сначала удаляем связанные ответы
        const deleteResponseStmt = db.prepare('DELETE FROM assistant_responses WHERE task_id = ?');
        deleteResponseStmt.run(taskId);

        // Затем удаляем задачу
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        return stmt.run(taskId);
    }

    // Удалить все задачи сессии
    static deleteBySessionId(sessionId) {
        // Получаем все задачи сессии
        const tasksStmt = db.prepare('SELECT id FROM tasks WHERE session_id = ?');
        const tasks = tasksStmt.all(sessionId);

        // Удаляем ответы для каждой задачи
        const deleteResponseStmt = db.prepare('DELETE FROM assistant_responses WHERE task_id = ?');
        for (const task of tasks) {
            deleteResponseStmt.run(task.id);
        }

        // Удаляем задачи
        const stmt = db.prepare('DELETE FROM tasks WHERE session_id = ?');
        return stmt.run(sessionId);
    }

    // Поиск задач по тексту
    static searchByText(searchTerm, limit = 50) {
        const stmt = db.prepare(`
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE t.user_message LIKE ? OR ar.response_text LIKE ?
            ORDER BY t.created_at DESC
            LIMIT ?
        `);
        const searchPattern = `%${searchTerm}%`;
        return stmt.all(searchPattern, searchPattern, limit);
    }

    // Экспорт задач в JSON
    static exportTasks(sessionId = null, limit = 1000) {
        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   s.start_time as session_start,
                   s.end_time as session_end
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
        `;

        const params = [];
        if (sessionId) {
            query += ' WHERE t.session_id = ?';
            params.push(sessionId);
        }

        query += ' ORDER BY t.start_time ASC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        return {
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length,
            sessionId: sessionId,
            tasks: tasks
        };
    }

    // Получить задачи с пагинацией и фильтрацией
    static getTasksWithFilters(options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = null,
            sessionId = null,
            minScore = null,
            hasCode = null,
            fromDate = null,
            toDate = null,
            orderBy = 'created_at',
            orderDir = 'DESC'
        } = options;

        let query = `
            SELECT t.*, 
                   ar.response_text as full_response,
                   ar.response_length,
                   ar.word_count,
                   s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            LEFT JOIN assistant_responses ar ON t.id = ar.task_id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        if (minScore !== null) {
            query += ' AND t.validation_score >= ?';
            params.push(minScore);
        }

        if (hasCode !== null) {
            query += ' AND t.has_code = ?';
            params.push(hasCode ? 1 : 0);
        }

        if (fromDate) {
            query += ' AND datetime(t.created_at / 1000, "unixepoch") >= datetime(?)';
            params.push(fromDate);
        }

        if (toDate) {
            query += ' AND datetime(t.created_at / 1000, "unixepoch") <= datetime(?)';
            params.push(toDate);
        }

        const validOrderColumns = ['created_at', 'start_time', 'duration', 'validation_score', 'response_length'];
        const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
        const orderDirection = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY t.${orderColumn} ${orderDirection} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        // Получаем общее количество для пагинации
        let countQuery = 'SELECT COUNT(*) as total FROM tasks t WHERE 1=1';
        const countParams = [];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (sessionId) {
            countQuery += ' AND session_id = ?';
            countParams.push(sessionId);
        }

        const countStmt = db.prepare(countQuery);
        const total = countStmt.get(...countParams);

        return {
            tasks: tasks,
            pagination: {
                limit: limit,
                offset: offset,
                total: total?.total || 0,
                hasMore: (offset + limit) < (total?.total || 0)
            }
        };
    }

    // ========== НОВЫЕ МЕТОДЫ ДЛЯ ИСПРАВЛЕНИЯ ОШИБОК ==========

    // Проверить существование сессии
    static checkSessionExists(sessionId) {
        const stmt = db.prepare('SELECT id FROM sessions WHERE id = ?');
        const result = stmt.get(sessionId);
        return !!result;
    }

    // Создать новую сессию
    static createSession(sessionData) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO sessions (id, start_time, end_time, status, total_tasks, completed_tasks, failed_tasks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(
            sessionData.id,
            sessionData.startTime || Date.now(),
            sessionData.endTime || null,
            sessionData.status || 'active',
            sessionData.totalTasks || 0,
            sessionData.completedTasks || 0,
            sessionData.failedTasks || 0
        );
    }

    // Обновить статистику сессии
    static updateSessionStats(sessionId) {
        const stmt = db.prepare(`
            UPDATE sessions 
            SET 
                total_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ?),
                completed_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ? AND status = 'completed'),
                failed_tasks = (SELECT COUNT(*) FROM tasks WHERE session_id = ? AND status = 'failed'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(sessionId, sessionId, sessionId, sessionId);
    }

    // Получить информацию о сессии
    static getSessionInfo(sessionId) {
        const stmt = db.prepare(`
            SELECT s.*, 
                   COUNT(t.id) as task_count,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `);
        return stmt.get(sessionId);
    }

    // Получить pending действия по ID задачи
    static getPendingActionsByTaskId(taskId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE task_id = ?
            ORDER BY detected_at DESC
        `);
        return stmt.all(taskId);
    }

    // Получить pending действия по ID сессии
    static getPendingActionsBySessionId(sessionId) {
        const stmt = db.prepare(`
            SELECT * FROM pending_actions 
            WHERE session_id = ? 
            ORDER BY detected_at DESC
        `);
        return stmt.all(sessionId);
    }

    // Поиск задач (общий метод)
    static search(searchTerm, field = 'both', limit = 20, offset = 0) {
        let query = `
            SELECT t.*, s.start_time as session_start
            FROM tasks t
            JOIN sessions s ON t.session_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (field === 'userMessage' || field === 'both') {
            query += ` AND t.user_message LIKE ?`;
            params.push(`%${searchTerm}%`);
        }

        if (field === 'assistantResponse' || field === 'both') {
            if (field === 'both') {
                query += ` OR t.assistant_response LIKE ?`;
            } else {
                query += ` AND t.assistant_response LIKE ?`;
            }
            params.push(`%${searchTerm}%`);
        }

        query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        return stmt.all(...params);
    }

    // Получить количество результатов поиска
    static getSearchCount(searchTerm, field = 'both') {
        let query = `
            SELECT COUNT(*) as total
            FROM tasks t
            WHERE 1=1
        `;
        const params = [];

        if (field === 'userMessage' || field === 'both') {
            query += ` AND t.user_message LIKE ?`;
            params.push(`%${searchTerm}%`);
        }

        if (field === 'assistantResponse' || field === 'both') {
            if (field === 'both') {
                query += ` OR t.assistant_response LIKE ?`;
            } else {
                query += ` AND t.assistant_response LIKE ?`;
            }
            params.push(`%${searchTerm}%`);
        }

        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result?.total || 0;
    }

    // Получить сводную статистику
    static getSummaryStats(since) {
        const stmt = db.prepare(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_validation_score,
                (SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as failed_rate
            FROM tasks
            WHERE created_at > datetime(?)
        `);
        const result = stmt.get(new Date(since).toISOString());
        return result || {
            total_tasks: 0,
            completed_tasks: 0,
            failed_tasks: 0,
            avg_duration: 0,
            avg_validation_score: 0,
            failed_rate: 0
        };
    }

    // Получить тренды по дням
    static getTrends(days = 7) {
        const stmt = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE created_at > datetime('now', '-' || ? || ' days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        return stmt.all(days);
    }

    // Получить топ проблем
    static getTopIssues(periodHours = 24) {
        const since = Date.now() - (periodHours * 60 * 60 * 1000);
        const stmt = db.prepare(`
            SELECT 
                type,
                severity,
                COUNT(*) as count,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE detected_at > ?
            GROUP BY type, severity
            ORDER BY count DESC
            LIMIT 10
        `);
        return stmt.all(since);
    }

    // Получить среднюю длину ответа
    static getAvgResponseLength(since) {
        const stmt = db.prepare(`
            SELECT AVG(response_length) as avg_length
            FROM tasks
            WHERE created_at > datetime(?) AND status = 'completed'
        `);
        const result = stmt.get(new Date(since).toISOString());
        return result?.avg_length || 0;
    }
}

// Дополнительный экспорт для статистики
export const TaskStats = {
    // Получить распределение задач по часам
    getHourlyDistribution(sessionId = null, days = 7) {
        const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();

        let query = `
            SELECT
                strftime('%Y-%m-%d %H:00', datetime(t.created_at / 1000, 'unixepoch')) as hour,
                COUNT(*) as count,
                AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as success_rate
            FROM tasks t
            WHERE datetime(t.created_at / 1000, 'unixepoch') > datetime(?)
        `;

        const params = [since];
        if (sessionId) {
            query += ' AND t.session_id = ?';
            params.push(sessionId);
        }

        query += ' GROUP BY hour ORDER BY hour';

        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    // Получить топ самых длинных задач
    getTopLongestTasks(limit = 10) {
        const stmt = db.prepare(`
            SELECT t.id, t.user_message, t.duration, t.status, t.validation_score,
                   substr(t.user_message, 1, 100) as message_preview
            FROM tasks t
            WHERE t.duration IS NOT NULL
            ORDER BY t.duration DESC
                LIMIT ?
        `);
        return stmt.all(limit);
    },

    // Получить топ задач с низкой оценкой валидации
    getTopLowScoreTasks(limit = 10) {
        const stmt = db.prepare(`
            SELECT t.id, t.user_message, t.validation_score, t.status,
                   substr(t.user_message, 1, 100) as message_preview
            FROM tasks t
            WHERE t.validation_score IS NOT NULL AND t.status = 'completed'
            ORDER BY t.validation_score ASC
                LIMIT ?
        `);
        return stmt.all(limit);
    }
};

export default TaskModel;