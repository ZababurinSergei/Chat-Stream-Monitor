// /10/public/components/remote-control/controller/index.mjs
import { logger } from '@libp2p/logger';
import { lpStream } from '@libp2p/utils';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

const log = logger('remote-control:controller');

// === Debounce utility ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Контроллер для компонента RemoteControl
 * @param {RemoteControl} context - Ссылка на экземпляр компонента
 * @returns {Object} Объект с методами init и destroy
 */
export const  controller = async (context) => {
    let eventListeners = [];

    const add = (el, ev, fn) => {
        if (!el) return;
        window.addEventListener(ev, fn);
        eventListeners.push({ element: el, event: ev, handler: fn });
    };

    // === Нормализация координат относительно всей страницы ===
    const getNormalizedCoords = (e) => {
        const pageX = e.pageX || (e.clientX + window.scrollX);
        const pageY = e.pageY || (e.clientY + window.scrollY);
        return {
            normX: document.body.scrollWidth > 0 ? pageX / document.body.scrollWidth : 0,
            normY: document.body.scrollHeight > 0 ? pageY / document.body.scrollHeight : 0
        };
    };

    // === Отправка события с debounce ===
    const debouncedSendMouseEvent = debounce((eventData) => {
        if (!context._remoteStream) return;

        const lp = lpStream(context._remoteStream);
        const msg = uint8ArrayFromString(JSON.stringify({
            type: 'REMOTE_CONTROL_EVENT',
            payload: eventData
        }));
        lp.write(msg).catch(err => {
            log.error('Ошибка отправки события мыши:', err);
        });
    }, 50); // ~20 FPS

    // === Обработчики мыши ===
    const mouseMoveHandler = (e) => {
        if (!context._remoteStream) return;

        const screen = context.shadowRoot.querySelector('#remote-screen');
        if (!screen) return;

        const rect = screen.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { normX, normY } = getNormalizedCoords(e);

        const eventData = {
            type: 'mousemove',
            x,
            y,
            normX,
            normY,
            targetPeer: context.state.targetPeer,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            zoomLevel: window.visualViewport?.scale ?? window.devicePixelRatio ?? 1,
            focusOnCursor: context.state.focusOnCursor ?? false,
            fullPageWidth: document.body.scrollWidth,
            fullPageHeight: document.body.scrollHeight
        };

        debouncedSendMouseEvent(eventData);
    };

    const mouseDownHandler = (e) => {
        if (!context._remoteStream) return;

        const screen = context.shadowRoot.querySelector('#remote-screen');
        if (!screen) return;

        const rect = screen.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { normX, normY } = getNormalizedCoords(e);

        const eventData = {
            type: 'mousedown',
            x,
            y,
            normX,
            normY,
            button: e.button,
            targetPeer: context.state.targetPeer,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            zoomLevel: window.visualViewport?.scale ?? window.devicePixelRatio ?? 1,
            focusOnCursor: context.state.focusOnCursor ?? false,
            fullPageWidth: document.body.scrollWidth,
            fullPageHeight: document.body.scrollHeight
        };

        debouncedSendMouseEvent(eventData);
    };

    const mouseUpHandler = (e) => {
        if (!context._remoteStream) return;

        const screen = context.shadowRoot.querySelector('#remote-screen');
        if (!screen) return;

        const rect = screen.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { normX, normY } = getNormalizedCoords(e);

        const eventData = {
            type: 'mouseup',
            x,
            y,
            normX,
            normY,
            button: e.button,
            targetPeer: context.state.targetPeer,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            zoomLevel: window.visualViewport?.scale ?? window.devicePixelRatio ?? 1,
            focusOnCursor: context.state.focusOnCursor ?? false,
            fullPageWidth: document.body.scrollWidth,
            fullPageHeight: document.body.scrollHeight
        };

        debouncedSendMouseEvent(eventData);
    };

    const toggleVideoHandler = async () => {
        const enabled = !context.state.videoEnabled;
        if (enabled) {
            await context._actions.startVideoStream(); // ← запускаем локальный стрим
        } else {
            context._actions.stopVideoStream();
        }
    };

    return {
        /**
         * Инициализирует контроллер: навешивает обработчики событий в зависимости от режима
         * @async
         */
        async init() {
            if (context.state.mode === 'controller') {
                const screen = context.shadowRoot.querySelector('#remote-screen');
                if (!screen) {
                    log.error('Элемент #remote-screen не найден для режима controller');
                    return;
                }

                // Делаем элемент фокусируемым и фокусируем его
                screen.setAttribute('tabindex', '0');
                screen.focus();

                // Навешиваем обработчики мыши
                add(screen, 'mousemove', mouseMoveHandler);
                add(screen, 'mousedown', mouseDownHandler);
                add(screen, 'mouseup', mouseUpHandler);

                log('Обработчики мыши и видео установлены для режима controller');
            } else {


            }
        },

        /**
         * Уничтожает контроллер и очищает ресурсы
         * @async
         */
        async destroy() {
            eventListeners.forEach(({ element, event, handler }) => {
                try {
                    element?.removeEventListener(event, handler);
                } catch (error) {
                    log.error('Ошибка при удалении обработчика события: %o', error);
                }
            });
            eventListeners = [];
            log('Контроллер remote-control уничтожен');
        }
    };
};