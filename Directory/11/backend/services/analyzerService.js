// services/analyzerService.js - Полная версия с обновлениями для анализа неопределенных состояний и задач

import { TaskModel } from '../models/Task.js';
import { PendingActionModel } from '../models/PendingAction.js';
import { db } from '../database/db.js';

export class AnalyzerService {

    /**
     * Анализ неопределенного состояния (pending action)
     * @param {Object} action - объект неопределенного состояния
     * @returns {Object} - детальный анализ проблемы
     */
    static analyzePendingAction(action) {
        const analysis = {
            actionId: action.id,
            type: action.type,
            severity: action.severity,
            analysis: {},
            recommendations: [],
            possibleCauses: [],
            impact: 'unknown',
            suggestedFix: null
        };

        switch (action.type) {
            case 'response_not_found':
                analysis.analysis = {
                    possibleCauses: [
                        'Сервер DeepSeek не отвечает',
                        'Проблемы с сетевым соединением',
                        'Таймаут запроса',
                        'Блокировка CORS',
                        'Сервер временно недоступен',
                        'Превышен лимит запросов'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'high',
                    errorRate: this.getErrorRate(action.type)
                };
                analysis.recommendations = [
                    'Проверить статус сервера DeepSeek (https://status.deepseek.com)',
                    'Перезагрузить страницу чата',
                    'Проверить интернет-соединение',
                    'Увеличить таймаут запроса',
                    'Повторить запрос через несколько секунд'
                ];
                analysis.suggestedFix = 'retry_request';
                break;

            case 'html_blocks_missing':
                analysis.analysis = {
                    possibleCauses: [
                        'Изменение структуры DOM на сайте DeepSeek',
                        'Загрузка страницы не завершена',
                        'Блокировка контента расширением',
                        'Новая версия интерфейса DeepSeek',
                        'Динамическая подгрузка контента'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'medium',
                    lastSeen: this.getLastSeenTime(action.type)
                };
                analysis.recommendations = [
                    'Обновить селекторы в модуле мониторинга',
                    'Проверить актуальность версии расширения',
                    'Временно отключить другие расширения',
                    'Обратиться к разработчику для обновления',
                    'Использовать резервные селекторы'
                ];
                analysis.suggestedFix = 'update_selectors';
                break;

            case 'timeout':
                analysis.analysis = {
                    possibleCauses: [
                        'Долгая генерация ответа (сложный запрос)',
                        'Проблемы с производительностью сервера',
                        'Сложный запрос требует много времени',
                        'Медленное интернет-соединение',
                        'Большой объем генерируемого контента'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'medium',
                    avgDuration: this.getAvgDurationByType(action.type)
                };
                analysis.recommendations = [
                    'Увеличить таймаут ожидания в конфигурации',
                    'Оптимизировать запрос пользователя',
                    'Проверить загрузку сервера DeepSeek',
                    'Разбить сложный запрос на несколько простых',
                    'Использовать потоковый режим получения ответа'
                ];
                analysis.suggestedFix = 'increase_timeout';
                break;

            case 'unknown':
                analysis.analysis = {
                    possibleCauses: [
                        'Неизвестная ошибка в модуле',
                        'Непредвиденное состояние страницы',
                        'Конфликт с другими расширениями',
                        'Ошибка в обработке данных',
                        'Проблема с рендерингом страницы'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'unknown',
                    relatedIssues: this.getRelatedIssues(action.type)
                };
                analysis.recommendations = [
                    'Проверить консоль разработчика (F12)',
                    'Собрать логи и отправить разработчику',
                    'Временно отключить другие расширения',
                    'Перезагрузить страницу чата',
                    'Проверить наличие обновлений расширения'
                ];
                analysis.suggestedFix = 'manual_investigation';
                break;

            case 'no_response_content':
                analysis.analysis = {
                    possibleCauses: [
                        'Пустой ответ от модели',
                        'Ошибка генерации контента',
                        'Фильтрация ответа модерацией',
                        'Модель не смогла сгенерировать ответ',
                        'Запрос заблокирован политиками безопасности'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'low',
                    emptyResponseRate: this.getEmptyResponseRate()
                };
                analysis.recommendations = [
                    'Переформулировать запрос более конкретно',
                    'Проверить настройки модели DeepSeek',
                    'Повторить запрос позже',
                    'Попробовать задать вопрос иначе',
                    'Убедиться что запрос не нарушает правила'
                ];
                analysis.suggestedFix = 'rephrase_query';
                break;

            case 'validation_failed':
                analysis.analysis = {
                    possibleCauses: [
                        'Ответ не прошел проверку качества',
                        'Недостаточная длина ответа',
                        'Отсутствие необходимых HTML блоков',
                        'Некорректная структура ответа',
                        'Ответ содержит ошибки или предупреждения'
                    ],
                    frequency: this.getActionFrequency(action.type),
                    impact: 'low',
                    avgScore: this.getAvgValidationScore()
                };
                analysis.recommendations = [
                    'Проверить качество ответа ассистента',
                    'При необходимости запросить повторную генерацию',
                    'Проверить наличие ошибок в ответе',
                    'Уточнить запрос для получения более качественного ответа'
                ];
                analysis.suggestedFix = 'check_response_quality';
                break;

            default:
                analysis.analysis = {
                    possibleCauses: ['Неизвестная причина'],
                    frequency: 0,
                    impact: 'unknown',
                    note: 'Требуется ручной анализ'
                };
                analysis.recommendations = [
                    'Проверить консоль разработчика для получения дополнительной информации',
                    'Собрать полный лог ошибок',
                    'Сообщить об ошибке разработчику',
                    'Проверить совместимость с последней версией DeepSeek'
                ];
                analysis.suggestedFix = 'manual_investigation';
        }

        return analysis;
    }

    /**
     * Получить частоту возникновения типа ошибки
     * @param {string} type - тип ошибки
     * @param {number} days - количество дней для анализа
     * @returns {Object} - статистика частоты
     */
    static getActionFrequency(type, days = 7) {
        const stmt = db.prepare(`
            SELECT 
                COUNT(*) as count, 
                COUNT(DISTINCT session_id) as sessions,
                MIN(detected_at) as first_seen,
                MAX(detected_at) as last_seen
            FROM pending_actions 
            WHERE type = ? 
            AND detected_at > ?
        `);
        const result = stmt.get(type, Date.now() - (days * 24 * 60 * 60 * 1000));
        return {
            count: result?.count || 0,
            sessions: result?.sessions || 0,
            perDay: ((result?.count || 0) / days).toFixed(2),
            firstSeen: result?.first_seen ? new Date(result.first_seen).toISOString() : null,
            lastSeen: result?.last_seen ? new Date(result.last_seen).toISOString() : null,
            trend: this.calculateTrend(type, days)
        };
    }

    /**
     * Рассчитать тренд изменения частоты ошибок
     * @param {string} type - тип ошибки
     * @param {number} days - количество дней
     * @returns {string} - направление тренда ('increasing', 'decreasing', 'stable')
     */
    static calculateTrend(type, days) {
        const halfDays = Math.floor(days / 2);
        const stmt = db.prepare(`
            SELECT 
                SUM(CASE WHEN detected_at > ? THEN 1 ELSE 0 END) as recent,
                SUM(CASE WHEN detected_at <= ? AND detected_at > ? THEN 1 ELSE 0 END) as previous
            FROM pending_actions
            WHERE type = ?
        `);

        const now = Date.now();
        const recentPeriod = now - (halfDays * 24 * 60 * 60 * 1000);
        const previousPeriod = now - (days * 24 * 60 * 60 * 1000);

        const result = stmt.get(recentPeriod, recentPeriod, previousPeriod, type);

        const recent = result?.recent || 0;
        const previous = result?.previous || 0;

        if (recent > previous * 1.2) return 'increasing';
        if (recent < previous * 0.8) return 'decreasing';
        return 'stable';
    }

    /**
     * Получить время последнего появления ошибки
     * @param {string} type - тип ошибки
     * @returns {string|null} - время последнего появления
     */
    static getLastSeenTime(type) {
        const stmt = db.prepare(`
            SELECT MAX(detected_at) as last_seen
            FROM pending_actions
            WHERE type = ?
        `);
        const result = stmt.get(type);
        return result?.last_seen ? new Date(result.last_seen).toISOString() : null;
    }

    /**
     * Получить процент ошибок для типа
     * @param {string} type - тип ошибки
     * @returns {number} - процент ошибок
     */
    static getErrorRate(type) {
        const stmt = db.prepare(`
            SELECT 
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE status = 'failed')) as rate
            FROM pending_actions
            WHERE type = ?
        `);
        const result = stmt.get(type);
        return result?.rate ? result.rate.toFixed(2) : 0;
    }

    /**
     * Получить среднюю длительность для типа проблемы
     * @param {string} type - тип проблемы
     * @returns {number} - средняя длительность в секундах
     */
    static getAvgDurationByType(type) {
        const stmt = db.prepare(`
            SELECT AVG(t.duration) as avg_duration
            FROM pending_actions pa
            JOIN tasks t ON pa.task_id = t.id
            WHERE pa.type = ?
        `);
        const result = stmt.get(type);
        return result?.avg_duration ? (result.avg_duration / 1000).toFixed(2) : 0;
    }

    /**
     * Получить процент пустых ответов
     * @returns {number} - процент пустых ответов
     */
    static getEmptyResponseRate() {
        const stmt = db.prepare(`
            SELECT 
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE status = 'completed')) as rate
            FROM tasks
            WHERE (assistant_response IS NULL OR LENGTH(assistant_response) = 0)
        `);
        const result = stmt.get();
        return result?.rate ? result.rate.toFixed(2) : 0;
    }

    /**
     * Получить среднюю оценку валидации
     * @returns {number} - средняя оценка
     */
    static getAvgValidationScore() {
        const stmt = db.prepare(`
            SELECT AVG(validation_score) as avg_score
            FROM tasks
            WHERE validation_score IS NOT NULL
        `);
        const result = stmt.get();
        return result?.avg_score ? result.avg_score.toFixed(2) : 0;
    }

    /**
     * Получить связанные проблемы
     * @param {string} type - тип проблемы
     * @returns {Array} - список связанных проблем
     */
    static getRelatedIssues(type) {
        const stmt = db.prepare(`
            SELECT type, COUNT(*) as count
            FROM pending_actions
            WHERE session_id IN (
                SELECT session_id FROM pending_actions WHERE type = ?
            )
            AND type != ?
            GROUP BY type
            ORDER BY count DESC
            LIMIT 5
        `);
        return stmt.all(type, type);
    }

    /**
     * Анализ задачи (сообщение пользователя + ответ чата)
     * @param {Object} task - объект задачи
     * @returns {Object} - детальный анализ задачи
     */
    static analyzeTask(task) {
        const analysis = {
            taskId: task.id,
            sessionId: task.session_id,
            timestamp: new Date(task.created_at || Date.now()).toISOString(),
            analysis: {
                userMessageLength: task.user_message?.length || 0,
                responseLength: task.assistant_response?.length || 0,
                responseWords: task.word_count || 0,
                duration: task.duration,
                durationSec: task.duration ? (task.duration / 1000).toFixed(2) : 0,
                validationScore: task.validation_score,
                isValid: task.is_valid === 1,
                htmlBlocksCount: task.html_blocks_count || 0
            },
            metrics: {},
            suggestions: [],
            quality: {
                score: 0,
                level: 'unknown'
            }
        };

        // Анализ качества ответа
        if (task.assistant_response && task.assistant_response.length > 0) {
            const response = task.assistant_response;

            // Проверка на шаблонные ответы
            const templatePatterns = [
                /извините|sorry/i,
                /не могу ответить|cannot answer/i,
                /пожалуйста, уточните|please clarify/i,
                /не понимаю|do not understand/i,
                /ошибка|error/i
            ];

            const isTemplate = templatePatterns.some(p => p.test(response));
            analysis.metrics.isTemplate = isTemplate;

            if (isTemplate) {
                analysis.suggestions.push('Ответ похож на шаблонный, возможно нужно переформулировать вопрос');
                analysis.quality.score -= 20;
            }

            // Проверка на полноту ответа
            if (response.length < 50) {
                analysis.suggestions.push('Ответ слишком короткий, возможно неполный');
                analysis.quality.score -= 15;
            } else if (response.length > 1000) {
                analysis.metrics.isLongResponse = true;
                analysis.quality.score += 10;
            }

            // Проверка на наличие кода
            const hasCode = /```[\s\S]*?```|function|class|const|let|var|import|export/.test(response);
            analysis.metrics.hasCode = hasCode;
            if (hasCode) {
                analysis.quality.score += 15;
            }

            // Проверка на наличие маркдауна
            const hasMarkdown = /#+\s|[*_]{1,2}.+[*_]{1,2}|\d+\.\s|-\s/.test(response);
            analysis.metrics.hasMarkdown = hasMarkdown;
            if (hasMarkdown) {
                analysis.quality.score += 10;
            }

            // Проверка на наличие списков
            const hasLists = /^\d+\.\s|^-\s/m.test(response);
            analysis.metrics.hasLists = hasLists;
            if (hasLists) {
                analysis.quality.score += 10;
            }
        }

        // Анализ времени ответа
        if (task.duration) {
            const durationSec = task.duration / 1000;
            analysis.metrics.durationSeconds = durationSec;

            if (durationSec > 30) {
                analysis.suggestions.push(`⚠️ Долгое время ответа: ${durationSec.toFixed(1)} сек`);
                analysis.quality.score -= 10;
            } else if (durationSec < 5) {
                analysis.metrics.isFastResponse = true;
                analysis.quality.score += 5;
            }
        }

        // Анализ валидации
        if (task.validation_score) {
            analysis.metrics.validationScore = task.validation_score;

            if (task.validation_score < 50) {
                analysis.suggestions.push(`⚠️ Низкая оценка валидации: ${task.validation_score}/100`);
                analysis.quality.score -= 25;
            } else if (task.validation_score > 80) {
                analysis.quality.score += 20;
            }
        }

        // Анализ HTML блоков
        if (task.html_blocks_count === 0 && task.is_valid === 1) {
            analysis.suggestions.push('⚠️ Не найдены HTML блоки с ответом, хотя задача успешна');
            analysis.quality.score -= 10;
        } else if (task.html_blocks_count > 0) {
            analysis.quality.score += 5;
        }

        // Определение уровня качества
        let qualityLevel = 'unknown';
        let qualityColor = 'gray';

        if (analysis.quality.score >= 70) {
            qualityLevel = 'excellent';
            qualityColor = 'green';
        } else if (analysis.quality.score >= 50) {
            qualityLevel = 'good';
            qualityColor = 'blue';
        } else if (analysis.quality.score >= 30) {
            qualityLevel = 'average';
            qualityColor = 'orange';
        } else if (analysis.quality.score > 0) {
            qualityLevel = 'poor';
            qualityColor = 'red';
        } else {
            qualityLevel = 'needs_review';
            qualityColor = 'purple';
        }

        analysis.quality = {
            score: Math.max(0, Math.min(100, analysis.quality.score)),
            level: qualityLevel,
            color: qualityColor
        };

        return analysis;
    }

    /**
     * Получить общую аналитику за период
     * @param {number} period - период в часах
     * @returns {Object} - общая аналитика
     */
    static getOverallAnalytics(period = 24) {
        const since = Date.now() - (period * 60 * 60 * 1000);

        const stmt = db.prepare(`
            SELECT 
                COUNT(DISTINCT t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_validation_score,
                COUNT(DISTINCT pa.id) as total_pending,
                COUNT(DISTINCT pa.type) as pending_types,
                SUM(CASE WHEN pa.severity = 'high' THEN 1 ELSE 0 END) as high_severity_pending,
                SUM(CASE WHEN pa.severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_pending,
                SUM(CASE WHEN pa.severity = 'low' THEN 1 ELSE 0 END) as low_severity_pending
            FROM tasks t
            LEFT JOIN pending_actions pa ON t.id = pa.task_id AND pa.auto_resolved = 0
            WHERE t.created_at > datetime('now', '-' || ? || ' hours')
        `);

        const result = stmt.get(period);

        // Категории задач по сложности
        const complexityStmt = db.prepare(`
            SELECT 
                CASE 
                    WHEN LENGTH(user_message) < 50 THEN 'short'
                    WHEN LENGTH(user_message) < 200 THEN 'medium'
                    ELSE 'long'
                END as complexity,
                COUNT(*) as count,
                AVG(duration) as avg_duration,
                AVG(validation_score) as avg_score
            FROM tasks
            WHERE created_at > datetime('now', '-' || ? || ' hours')
            GROUP BY complexity
        `);
        const complexity = complexityStmt.all(period);

        return {
            period: `${period} hours`,
            periodStart: new Date(Date.now() - period * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            tasks: {
                total: result?.total_tasks || 0,
                completed: result?.completed_tasks || 0,
                failed: result?.failed_tasks || 0,
                successRate: result?.total_tasks > 0
                    ? ((result.completed_tasks / result.total_tasks) * 100).toFixed(2)
                    : 0
            },
            performance: {
                avgDurationMs: result?.avg_duration || 0,
                avgDurationSec: result?.avg_duration ? (result.avg_duration / 1000).toFixed(2) : 0,
                avgValidationScore: result?.avg_validation_score ? result.avg_validation_score.toFixed(2) : 0
            },
            pending: {
                total: result?.total_pending || 0,
                types: result?.pending_types || 0,
                bySeverity: {
                    high: result?.high_severity_pending || 0,
                    medium: result?.medium_severity_pending || 0,
                    low: result?.low_severity_pending || 0
                }
            },
            complexity: complexity,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Получить аналитику по конкретной сессии
     * @param {string} sessionId - ID сессии
     * @returns {Object} - аналитика сессии
     */
    static getSessionAnalytics(sessionId) {
        const stmt = db.prepare(`
            SELECT 
                s.*,
                COUNT(t.id) as task_count,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                AVG(t.duration) as avg_duration,
                AVG(t.validation_score) as avg_score,
                COUNT(pa.id) as pending_count
            FROM sessions s
            LEFT JOIN tasks t ON s.id = t.session_id
            LEFT JOIN pending_actions pa ON s.id = pa.session_id AND pa.auto_resolved = 0
            WHERE s.id = ?
            GROUP BY s.id
        `);

        const session = stmt.get(sessionId);

        if (!session) return null;

        // Получение временной линии задач
        const timelineStmt = db.prepare(`
            SELECT 
                id,
                user_message,
                status,
                duration,
                validation_score,
                created_at
            FROM tasks
            WHERE session_id = ?
            ORDER BY created_at ASC
        `);
        const timeline = timelineStmt.all(sessionId);

        return {
            session: {
                id: session.id,
                startTime: session.start_time,
                endTime: session.end_time,
                status: session.status,
                duration: session.end_time ? (session.end_time - session.start_time) / 1000 : null
            },
            statistics: {
                totalTasks: session.task_count,
                completedTasks: session.completed_count,
                failedTasks: session.failed_count,
                successRate: session.task_count > 0
                    ? ((session.completed_count / session.task_count) * 100).toFixed(2)
                    : 0,
                avgDurationSec: session.avg_duration ? (session.avg_duration / 1000).toFixed(2) : 0,
                avgValidationScore: session.avg_score ? session.avg_score.toFixed(2) : 0,
                pendingIssues: session.pending_count
            },
            timeline: timeline.map(task => ({
                id: task.id,
                message: task.user_message?.substring(0, 100),
                status: task.status,
                durationSec: task.duration ? (task.duration / 1000).toFixed(2) : 0,
                validationScore: task.validation_score,
                createdAt: task.created_at
            })),
            recommendations: this.generateSessionRecommendations(session)
        };
    }

    /**
     * Генерация рекомендаций для сессии
     * @param {Object} session - данные сессии
     * @returns {Array} - список рекомендаций
     */
    static generateSessionRecommendations(session) {
        const recommendations = [];

        if (session.failed_count > session.completed_count) {
            recommendations.push({
                type: 'high_failure_rate',
                message: `Высокий процент ошибок в сессии: ${session.failed_count} из ${session.task_count} задач`,
                action: 'Проверьте качество запросов и стабильность соединения'
            });
        }

        if (session.avg_score && session.avg_score < 50) {
            recommendations.push({
                type: 'low_quality',
                message: `Низкое качество ответов: средняя оценка ${session.avg_score.toFixed(1)}/100`,
                action: 'Рекомендуется переформулировать запросы или проверить настройки модели'
            });
        }

        if (session.avg_duration && session.avg_duration > 30000) {
            recommendations.push({
                type: 'slow_responses',
                message: `Медленные ответы: среднее время ${(session.avg_duration / 1000).toFixed(1)} сек`,
                action: 'Оптимизируйте запросы или проверьте скорость интернет-соединения'
            });
        }

        return recommendations;
    }

    /**
     * Сравнительный анализ между сессиями
     * @param {Array<string>} sessionIds - массив ID сессий
     * @returns {Object} - сравнительный анализ
     */
    static compareSessions(sessionIds) {
        const comparisons = [];

        for (const sessionId of sessionIds) {
            const analytics = this.getSessionAnalytics(sessionId);
            if (analytics) {
                comparisons.push({
                    sessionId: sessionId,
                    statistics: analytics.statistics
                });
            }
        }

        // Расчет общих метрик
        const avgSuccessRate = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.successRate), 0) / comparisons.length;
        const avgDuration = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.avgDurationSec), 0) / comparisons.length;
        const avgScore = comparisons.reduce((sum, c) => sum + parseFloat(c.statistics.avgValidationScore), 0) / comparisons.length;

        return {
            sessions: comparisons,
            averages: {
                successRate: avgSuccessRate.toFixed(2),
                avgDurationSec: avgDuration.toFixed(2),
                avgValidationScore: avgScore.toFixed(2)
            },
            bestSession: comparisons.reduce((best, current) =>
                parseFloat(current.statistics.successRate) > parseFloat(best.statistics.successRate) ? current : best, comparisons[0]),
            worstSession: comparisons.reduce((worst, current) =>
                parseFloat(current.statistics.successRate) < parseFloat(worst.statistics.successRate) ? current : worst, comparisons[0])
        };
    }

    /**
     * Прогнозирование потенциальных проблем
     * @returns {Object} - прогноз проблем
     */
    static predictIssues() {
        const predictions = [];

        // Анализ трендов по типам ошибок
        const types = ['response_not_found', 'html_blocks_missing', 'timeout', 'unknown', 'no_response_content'];

        for (const type of types) {
            const trend = this.calculateTrend(type, 7);
            const frequency = this.getActionFrequency(type, 1); // последние 24 часа

            if (trend === 'increasing' && frequency.count > 5) {
                predictions.push({
                    type: type,
                    trend: trend,
                    currentRate: frequency.perDay,
                    message: `Обнаружен растущий тренд ошибок типа "${type}"`,
                    recommendation: `Требуется внимание: ${frequency.count} ошибок за последние 24 часа`
                });
            }
        }

        return {
            predictions: predictions,
            timestamp: new Date().toISOString(),
            severity: predictions.length > 0 ? (predictions.some(p => p.type === 'response_not_found') ? 'high' : 'medium') : 'low'
        };
    }
}

export default AnalyzerService;