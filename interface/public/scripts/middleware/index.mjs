/**
 * Middleware фабрика для обработки команд терминала
 * @version 1.1.1
 */

import { RequestHandlerMiddleware } from './request-handler.mjs';
import { setMiddleware } from '../global-state.mjs';

/**
 * Создает middleware обработчик с опциональной привязкой к компоненту
 * @param {HTMLElement|null} component - Опциональный компонент для доступа к состоянию
 * @returns {Function} middleware функция (line => processedLine)
 */
export const createDefaultMiddleware = (component = null) => {
    const middleware = new RequestHandlerMiddleware();

    // Инициализируем из компонента если передан
    if (component?.tagName?.startsWith('NK-')) {
        try {
            middleware.initFromComponent(component);

            // Автоматическое обновление при изменении состояния
            const updateFromState = (state) => {
                if (state.commands || state.tags) {
                    middleware.initFromComponent(component);
                }
            };

            component._state.subscribe?.(updateFromState);
        } catch (error) {
            console.error('Middleware init error:', error);
        }
    }

    // Возвращаем функцию-обработчик
    return function quantumMiddleware(line) {
        try {
            // 1. Сохраняем оригинальную строку
            const originalLine = line;

            // 2. Обрабатываем через middleware
            const processed = middleware.processLine(line);

            // 3. Всегда возвращаем оригинальную строку (требование спецификации)
            return originalLine;
        } catch (error) {
            console.error('Middleware processing error:', error);
            return line; // Гарантированный возврат строки
        }
    };
};

/**
 * Вспомогательные функции для тестирования
 */
export const __test__ = {
    getMiddlewareInstance: (component) => {
        const mw = new RequestHandlerMiddleware();
        if (component) mw.initFromComponent(component);
        return mw;
    }
};