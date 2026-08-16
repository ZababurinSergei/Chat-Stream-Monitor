// /10/public/components/remote-control/actions/index.mjs
import { logger } from '@libp2p/logger';

const log = logger('remote-control:actions');

/**
 * Фабричная функция для создания действий компонента RemoteControl
 * @param {Object} context - Контекст компонента (экземпляр RemoteControl)
 * @returns {Object} Объект с методами действий
 */
export async function createActions(context) {

    let videoPeerConnection = null;
    let localStream = null;
    let lastCursorPosition = { x: 0, y: 0 };

    /**
     * Проверяет, доступен ли Chrome DevTools Protocol (CDP) на текущей машине.
     * В обычном браузере — недоступен. Требуется расширение или внешний CDP-сервер.
     * @returns {boolean}
     */
    function isCdpAvailable() {
        // В веб-приложении CDP недоступен без расширения
        return false;
    }

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

    // === Отправка события ввода через chat-manager ===
    async function sendInputEvent(eventData) {
        const targetPeer = context.getAttribute('target-peer')
        if (!targetPeer) {
            log.error('Нет целевого пира для отправки события ввода');
            return;
        }

        const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
        if (!chatManager) {
            log.error('chat-manager не найден для отправки REMOTE_CONTROL_EVENT');
            return;
        }

        const message = {
            type: 'REMOTE_CONTROL_EVENT',
            payload: {
                ...eventData,
                timestamp: Date.now()
            }
        };

        try {
            await chatManager.sendPrivateMessage(targetPeer, JSON.stringify(message));
            log('Событие ввода отправлено: %s', eventData.type);
        } catch (error) {
            log.error('Ошибка отправки события ввода: %o', error);
        }
    }

    // === Нормализация координат относительно всей страницы ===
    const getNormalizedCoords = (e) => {
        const pageX = e.pageX || (e.clientX + window.scrollX);
        const pageY = e.pageY || (e.clientY + window.scrollY);

        const normX = pageX / document.body.scrollWidth;
        const normY = pageY / document.body.scrollHeight;

        return { normX, normY };
    };

    // === Debounced отправка мышиных событий ===
    const debouncedSendMouseEvent = debounce((eventData) => {
        sendInputEvent(eventData);
    }, 50); // ~20 FPS

    // === Обработчики событий мыши (вызываются из controller) ===
    context.mouseMoveHandler = (e) => {
        if (!context._remoteStream) return;

        const rect = e.currentTarget.getBoundingClientRect();
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

    context.mouseDownHandler = (e) => {
        if (!context._remoteStream) return;

        const rect = e.currentTarget.getBoundingClientRect();
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

    context.mouseUpHandler = (e) => {
        if (!context._remoteStream) return;

        const rect = e.currentTarget.getBoundingClientRect();
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

    // === Обработка входящего события ввода ===


    let screenStream = null;

    // Удалите старую startVideoStream()
    async function startScreenShare() {
        if (context.state.mode !== 'viewer') return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const pc = await context.createPeerConnection()
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await context._events(pc)
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Сохраняем соединение в контексте
            context._videoPeerConnection = pc;
            context._screenStream = stream;

            // Отправляем offer через Libp2p-стрим
            await sendInputEvent({
                type: 'VIDEO_SDP',
                sdpType: 'offer',
                sdp: offer.sdp
            });
        } catch (err) {
            console.error('ERROR',err)
            log.error('Ошибка захвата экрана:', err);
            stopScreenShare();
            context.state.videoEnabled = false;
            await context.renderPart({ partName: 'defaultTemplate', state: context.state, selector: '#root', method: 'innerHTML' });
        }
    }

    function stopScreenShare() {
        if (context._screenStream) {
            context._screenStream.getTracks().forEach(t => t.stop());
            context._screenStream = null;
        }
        if (context._videoPeerConnection) {
            context._videoPeerConnection.close();
            context._videoPeerConnection = null;
        }
        context.state.videoEnabled = false;
    }

    async function toggleVideo(enabled) {
        if (enabled === context.state.videoEnabled) return;

        context.state.videoEnabled = enabled;
        await context.renderPart({
            partName: 'defaultTemplate',
            state: context.state,
            selector: '#root',
            method: 'innerHTML'
        });

        if (context.state.mode === 'viewer') {
            if (enabled) {
                await startScreenShare();
            } else {
                stopScreenShare();
            }
        }
        // На стороне controller — ничего не делаем здесь
    }

    // === Подписка на события (реализуется через postMessage) ===
    async function setupInputListener() {
        // Обработка в postMessage компонента
    }

    // === Очистка при отключении ===
    async function cleanup() {
        stopScreenShare();
        // Очистка обработчиков — делается в controller
    }

    return {
        startScreenShare,
        stopScreenShare,
        sendInputEvent,
        setupInputListener,
        cleanup,
        toggleVideo,
        mouseMoveHandler: context.mouseMoveHandler,
        mouseDownHandler: context.mouseDownHandler,
        mouseUpHandler: context.mouseUpHandler
    };
}