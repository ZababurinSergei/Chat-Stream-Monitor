// eventBus.js - Центральная событийная шина для DeepSeek монитора
// 100% полный код с обновлениями

class DeepSeekEventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.eventHistory = new Map(); // Храним историю событий для отладки
        this.maxHistorySize = 100;
        this.debugMode = false;
        this.eventCounter = 0;
        this.listenerCounter = 0;
    }

    /**
     * Подписка на событие
     * @param {string} event - Имя события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} options - Опции подписки
     * @returns {string} ID слушателя для отписки
     */
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listenerId = this.generateListenerId();
        const listener = {
            id: listenerId,
            callback,
            priority: options.priority || 0,
            context: options.context || null,
            once: false,
            createdAt: Date.now()
        };

        this.listeners.get(event).push(listener);

        // Сортируем по приоритету (выше приоритет - раньше вызов)
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] ✅ Подписка на \"${event}\", ID: ${listenerId}, приоритет: ${listener.priority}`);
        }

        return listenerId;
    }

    /**
     * Однократная подписка
     * @param {string} event - Имя события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} options - Опции подписки
     * @returns {string} ID слушателя для отписки
     */
    once(event, callback, options = {}) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }

        const listenerId = this.generateListenerId();
        const listener = {
            id: listenerId,
            callback,
            priority: options.priority || 0,
            context: options.context || null,
            once: true,
            createdAt: Date.now()
        };

        this.onceListeners.get(event).push(listener);

        // Сортируем по приоритету
        this.onceListeners.get(event).sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] 🔂 Однократная подписка на \"${event}\", ID: ${listenerId}`);
        }

        return listenerId;
    }

    /**
     * Отписка от события по ID
     * @param {string} event - Имя события
     * @param {string} listenerId - ID слушателя
     * @returns {boolean} Успешность отписки
     */
    off(event, listenerId) {
        let removed = false;

        // Проверяем в обычных подписках
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
                if (this.debugMode) {
                    console.log(`[EventBus] ❌ Отписка от \"${event}\", ID: ${listenerId}`);
                }
            }
        }

        // Проверяем в однократных подписках
        if (this.onceListeners.has(event)) {
            const listeners = this.onceListeners.get(event);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        }

        return removed;
    }

    /**
     * Отписка всех слушателей от события
     * @param {string} event - Имя события
     */
    offAll(event) {
        if (this.listeners.has(event)) {
            const count = this.listeners.get(event).length;
            this.listeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] 🗑️ Удалены все подписки (${count}) на \"${event}\"`);
            }
        }

        if (this.onceListeners.has(event)) {
            const count = this.onceListeners.get(event).length;
            this.onceListeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] 🗑️ Удалены все однократные подписки (${count}) на \"${event}\"`);
            }
        }
    }

    /**
     * Отписка от всех событий
     */
    offAllEvents() {
        const totalRegular = this.getTotalListenerCount();
        const totalOnce = this.getTotalOnceListenerCount();

        this.listeners.clear();
        this.onceListeners.clear();

        if (this.debugMode) {
            console.log(`[EventBus] 🗑️ Удалены все подписки (regular: ${totalRegular}, once: ${totalOnce})`);
        }
    }

    /**
     * Генерация ID для слушателя
     * @returns {string} Уникальный ID
     */
    generateListenerId() {
        this.listenerCounter++;
        return `listener_${Date.now()}_${this.listenerCounter}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Генерация ID для события
     * @returns {string} Уникальный ID
     */
    generateEventId() {
        this.eventCounter++;
        return `event_${Date.now()}_${this.eventCounter}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Отправка события
     * @param {string} event - Имя события
     * @param {Object} data - Данные события
     * @param {Object} options - Опции отправки
     * @returns {string} ID события
     */
    emit(event, data = {}, options = {}) {
        const eventId = this.generateEventId();
        const eventData = {
            id: eventId,
            type: event,
            data: data,
            timestamp: Date.now(),
            source: options.source || 'unknown',
            version: options.version || '1.0'
        };

        if (this.debugMode) {
            console.log(`[EventBus] 📡 Эмит события \"${event}\"`, {
                id: eventId,
                data: data,
                source: eventData.source
            });
        }

        // Сохраняем в историю
        this.addToHistory(eventData);

        // Вызываем обычные подписки
        if (this.listeners.has(event)) {
            const listeners = [...this.listeners.get(event)]; // Копируем для безопасности
            for (const listener of listeners) {
                try {
                    const context = listener.context || window;
                    listener.callback.call(context, eventData);
                } catch (error) {
                    console.error(`[EventBus] Ошибка в обработчике ${event}:`, error);
                    this.emit('eventbus:error', {
                        event: event,
                        listenerId: listener.id,
                        error: error.message,
                        stack: error.stack
                    }, { source: 'EventBus' });
                }
            }
        }

        // Вызываем однократные подписки
        if (this.onceListeners.has(event)) {
            const listeners = [...this.onceListeners.get(event)];
            this.onceListeners.delete(event);

            for (const listener of listeners) {
                try {
                    const context = listener.context || window;
                    listener.callback.call(context, eventData);
                } catch (error) {
                    console.error(`[EventBus] Ошибка в однократном обработчике ${event}:`, error);
                    this.emit('eventbus:error', {
                        event: event,
                        listenerId: listener.id,
                        error: error.message
                    }, { source: 'EventBus' });
                }
            }
        }

        return eventId;
    }

    /**
     * Асинхронная отправка события (не блокирует)
     * @param {string} event - Имя события
     * @param {Object} data - Данные события
     * @param {Object} options - Опции отправки
     * @returns {Promise<string>} ID события
     */
    async emitAsync(event, data = {}, options = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const eventId = this.emit(event, data, options);
                resolve(eventId);
            }, 0);
        });
    }

    /**
     * Сохранение в историю
     * @param {Object} eventData - Данные события
     */
    addToHistory(eventData) {
        if (!this.eventHistory.has(eventData.type)) {
            this.eventHistory.set(eventData.type, []);
        }

        const history = this.eventHistory.get(eventData.type);
        history.push(eventData);

        // Ограничиваем размер истории
        while (history.length > this.maxHistorySize) {
            history.shift();
        }
    }

    /**
     * Получить историю событий
     * @param {string|null} eventType - Тип события (опционально)
     * @returns {Object|Array} История событий
     */
    getHistory(eventType = null) {
        if (eventType) {
            return this.eventHistory.get(eventType) || [];
        }

        const allHistory = {};
        for (const [type, events] of this.eventHistory) {
            allHistory[type] = events;
        }
        return allHistory;
    }

    /**
     * Очистить историю
     * @param {string|null} eventType - Тип события (опционально)
     */
    clearHistory(eventType = null) {
        if (eventType) {
            this.eventHistory.delete(eventType);
            if (this.debugMode) {
                console.log(`[EventBus] 🧹 История события \"${eventType}\" очищена`);
            }
        } else {
            this.eventHistory.clear();
            if (this.debugMode) {
                console.log('[EventBus] 🧹 Вся история событий очищена');
            }
        }
    }

    /**
     * Получить количество слушателей
     * @param {string|null} event - Имя события (опционально)
     * @returns {number} Количество слушателей
     */
    getListenerCount(event = null) {
        if (event) {
            const regular = this.listeners.get(event)?.length || 0;
            const once = this.onceListeners.get(event)?.length || 0;
            return regular + once;
        }

        return this.getTotalListenerCount() + this.getTotalOnceListenerCount();
    }

    /**
     * Получить общее количество обычных слушателей
     * @returns {number}
     */
    getTotalListenerCount() {
        let total = 0;
        for (const listeners of this.listeners.values()) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * Получить общее количество однократных слушателей
     * @returns {number}
     */
    getTotalOnceListenerCount() {
        let total = 0;
        for (const listeners of this.onceListeners.values()) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * Получить список всех событий
     * @returns {Array} Список событий
     */
    getEvents() {
        const events = new Set();
        for (const event of this.listeners.keys()) {
            events.add(event);
        }
        for (const event of this.onceListeners.keys()) {
            events.add(event);
        }
        return Array.from(events);
    }

    /**
     * Проверить наличие слушателей на событие
     * @param {string} event - Имя события
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.getListenerCount(event) > 0;
    }

    /**
     * Включить/выключить режим отладки
     * @param {boolean} enabled - Включить отладку
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] 🐛 Режим отладки: ${enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);

        if (enabled) {
            this.emit('eventbus:debug-enabled', {
                timestamp: Date.now(),
                listenerCount: this.getListenerCount(),
                events: this.getEvents()
            }, { source: 'EventBus' });
        }
    }

    /**
     * Получить статус EventBus
     * @returns {Object} Статус
     */
    getStatus() {
        return {
            debugMode: this.debugMode,
            totalListeners: this.getListenerCount(),
            regularListeners: this.getTotalListenerCount(),
            onceListeners: this.getTotalOnceListenerCount(),
            events: this.getEvents(),
            historySize: this.eventHistory.size,
            eventCounter: this.eventCounter,
            listenerCounter: this.listenerCounter,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }

    /**
     * Сброс EventBus (очистка всех подписок и истории)
     */
    reset() {
        this.offAllEvents();
        this.clearHistory();
        this.eventCounter = 0;
        this.listenerCounter = 0;
        this.startTime = Date.now();

        if (this.debugMode) {
            console.log('[EventBus] 🔄 EventBus полностью сброшен');
        }
    }

    /**
     * Получить статистику по событиям
     * @returns {Object} Статистика
     */
    getStats() {
        const stats = {
            totalEvents: this.eventCounter,
            totalListeners: this.listenerCounter,
            activeListeners: this.getListenerCount(),
            eventsByType: {}
        };

        for (const [event, listeners] of this.listeners) {
            stats.eventsByType[event] = {
                regular: listeners.length,
                once: this.onceListeners.get(event)?.length || 0,
                total: listeners.length + (this.onceListeners.get(event)?.length || 0)
            };
        }

        for (const [event, listeners] of this.onceListeners) {
            if (!stats.eventsByType[event]) {
                stats.eventsByType[event] = {
                    regular: 0,
                    once: listeners.length,
                    total: listeners.length
                };
            }
        }

        return stats;
    }
}

// ========== ОБНОВЛЕНИЕ: ГАРАНТИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ ==========

(function ensureEventBusGlobal() {
    // Функция создания экземпляра EventBus
    const createEventBusInstance = () => {
        if (window.__deepseekEventBus) return window.__deepseekEventBus;

        const instance = new DeepSeekEventBus();
        instance.startTime = Date.now();

        // Определяем окружение
        const isDev = (typeof window !== 'undefined' && (
            window.location?.hostname === 'localhost' ||
            window.location?.hostname === '127.0.0.1' ||
            window.location?.protocol === 'chrome-extension:'
        ));

        if (isDev) {
            instance.setDebugMode(true);
            console.log('[EventBus] 🐛 Режим отладки автоматически включен (development)');
        }

        window.__deepseekEventBus = instance;

        // Сигнал о готовности EventBus через кастомное событие
        if (typeof window !== 'undefined') {
            const readyEvent = new CustomEvent('deepseek-eventbus-ready', {
                detail: { timestamp: Date.now(), instance: instance }
            });
            window.dispatchEvent(readyEvent);
        }

        console.log('[EventBus] ✅ Глобальный экземпляр создан и сигнал отправлен');
        return instance;
    };

    // Если DOM еще не загружен, ждем
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createEventBusInstance();
        });
    } else {
        createEventBusInstance();
    }
})();

// Экспорт для модульной системы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeepSeekEventBus };
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.DeepSeekEventBus = DeepSeekEventBus;
}

// Автоматический экспорт в chrome.runtime для cross-context коммуникации
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Для отправки сообщений между контекстами
    if (typeof window !== 'undefined') {
        window.__deepseekEventBusToBackground = (event, data) => {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'EVENT_BUS_MESSAGE',
                    event: event,
                    data: data,
                    timestamp: Date.now()
                }).catch(() => {});
            }
        };
    }
}

console.log('[EventBus] 🚀 EventBus загружен и готов к работе');