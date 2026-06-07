// server/routes/tasks.js - Полная версия с обновлениями
import express from 'express';
import { taskController } from '../controllers/taskController.js';

const router = express.Router();

/**
 * @route   POST /api/tasks
 * @desc    Сохранить задачу (сообщение пользователя + ответ чата)
 * @access  Public
 * @body    {
 *            id: string,
 *            sessionId: string,
 *            userMessage: string,
 *            assistantResponse: string,
 *            startTime: number,
 *            endTime: number,
 *            duration: number,
 *            status: string,
 *            validationScore: number,
 *            isValid: boolean,
 *            errorMessage: string,
 *            htmlBlocksCount: number,
 *            continueClicks: number
 *          }
 */
router.post('/', taskController.saveTask);

/**
 * @route   GET /api/tasks/:id
 * @desc    Получить задачу по ID
 * @access  Public
 */
router.get('/:id', taskController.getTask);

/**
 * @route   GET /api/tasks/session/:sessionId
 * @desc    Получить все задачи сессии
 * @access  Public
 * @query   limit - количество записей (по умолчанию 100)
 * @query   offset - смещение (по умолчанию 0)
 */
router.get('/session/:sessionId', taskController.getTasksBySession);

/**
 * @route   GET /api/tasks/failed/list
 * @desc    Получить список failed задач
 * @access  Public
 * @query   limit - количество записей (по умолчанию 50)
 */
router.get('/failed/list', taskController.getFailedTasks);

/**
 * @route   GET /api/tasks/analyze/:id
 * @desc    Анализировать задачу
 * @access  Public
 */
router.get('/analyze/:id', taskController.analyzeTask);

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Обновить статус задачи
 * @access  Public
 * @body    {
 *            status: string,
 *            validationScore: number,
 *            isValid: boolean
 *          }
 */
router.put('/:id/status', taskController.updateTaskStatus);

/**
 * @route   GET /api/tasks/stats/summary
 * @desc    Получить сводную статистику по задачам
 * @access  Public
 * @query   period - период в часах (по умолчанию 24)
 */
router.get('/stats/summary', taskController.getTasksSummary);

/**
 * @route   GET /api/tasks/search
 * @desc    Поиск задач по сообщению пользователя
 * @access  Public
 * @query   q - поисковый запрос
 * @query   limit - количество записей (по умолчанию 20)
 */
router.get('/search', taskController.searchTasks);

/**
 * @route   GET /api/tasks/session/:sessionId/export
 * @desc    Экспорт задач сессии в JSON
 * @access  Public
 */
router.get('/session/:sessionId/export', taskController.exportSessionTasks);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Удалить задачу
 * @access  Public
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route   POST /api/tasks/batch
 * @desc    Массовое сохранение задач
 * @access  Public
 * @body    {
 *            tasks: array
 *          }
 */
router.post('/batch', taskController.saveBatchTasks);

export default router;