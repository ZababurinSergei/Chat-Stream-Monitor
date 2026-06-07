// server/routes/pending.js - Полная версия с обновлениями
import express from 'express';
import { pendingController } from '../controllers/pendingController.js';

const router = express.Router();

/**
 * @route   POST /api/pending
 * @desc    Сохранить неопределенное состояние
 * @access  Public
 * @body    {
 *            taskId: string,
 *            sessionId: string,
 *            type: string,
 *            description: string,
 *            severity: string,
 *            suggestedAction: string,
 *            details: object,
 *            autoResolved: boolean,
 *            resolutionMethod: string,
 *            detectedAt: number,
 *            resolvedAt: number
 *          }
 */
router.post('/', pendingController.savePending);

/**
 * @route   GET /api/pending/unresolved
 * @desc    Получить все неразрешенные проблемы
 * @access  Public
 * @query   limit - количество записей (по умолчанию 50)
 */
router.get('/unresolved', pendingController.getUnresolved);

/**
 * @route   GET /api/pending/type/:type
 * @desc    Получить проблемы по типу
 * @access  Public
 * @param   type - тип проблемы (response_not_found, html_blocks_missing, timeout, unknown, no_response_content)
 * @query   limit - количество записей (по умолчанию 20)
 */
router.get('/type/:type', pendingController.getByType);

/**
 * @route   GET /api/pending/stats
 * @desc    Получить статистику по типам проблем
 * @access  Public
 */
router.get('/stats', pendingController.getStats);

/**
 * @route   GET /api/pending/session/:sessionId
 * @desc    Получить проблемы по ID сессии
 * @access  Public
 */
router.get('/session/:sessionId', pendingController.getBySessionId);

/**
 * @route   PUT /api/pending/:id/resolve
 * @desc    Отметить проблему как разрешенную
 * @access  Public
 * @param   id - ID записи
 * @body    resolutionMethod - метод разрешения
 */
router.put('/:id/resolve', pendingController.resolvePending);

/**
 * @route   GET /api/pending/analytics/summary
 * @desc    Получить сводную аналитику по проблемам
 * @access  Public
 * @query   period - период в часах (по умолчанию 24)
 */
router.get('/analytics/summary', pendingController.getAnalyticsSummary);

/**
 * @route   DELETE /api/pending/:id
 * @desc    Удалить запись о проблеме
 * @access  Public
 */
router.delete('/:id', pendingController.deletePending);

/**
 * @route   POST /api/pending/batch
 * @desc    Массовое сохранение неопределенных состояний
 * @access  Public
 */
router.post('/batch', pendingController.saveBatchPending);

export default router;