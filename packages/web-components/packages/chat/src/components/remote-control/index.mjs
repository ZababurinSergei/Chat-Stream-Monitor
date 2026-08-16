// /10/public/components/remote-control/index.mjs
import { BaseComponent } from '../../base/base-component.mjs';
import * as template from './template/index.mjs';
import { controller } from './controller/index.mjs';
import { createActions } from './actions/index.mjs';
import { logger } from '@libp2p/logger';
import { lpStream } from '@libp2p/utils'
import {toString as uint8ArrayToString} from 'uint8arrays/to-string';


const log = logger('remote-control');

export class RemoteControl extends BaseComponent {
    static observedAttributes = ['target-peer', 'mode']; // 'viewer' | 'controller'

    constructor() {
        super();
        this._templateMethods = template;
        this._videoPeerConnection = null
        this._screenStream = null
        this.state = {
            mode: null, // или 'controller'
            targetPeer: null,
            isConnected: false,
            isCdpAvailable: false,
            cursorPosition: { x: 0, y: 0 },
            eventsQueue: [],
            focusOnCursor: true // ← управляется через UI (чекбокс/кнопка)
        };
    }

    async _componentReady() {
        // debugger
        this._controller = await controller(this);
        this._actions = await createActions(this);
        this.state.mode = this.getAttribute('mode')
        await this.fullRender(this.state);
        await this._controller.init();
    }

    async postMessage(event) {
        if (event.type === 'WEBRTC_OFFER_RECEIVED') {
            await this.handleWebRtcOffer(event.data);
        }
    }
    // Проверка, установлено ли расширение
    async isCdpExtensionAvailable() {
        const extensionId = 'ваш-extension-id'; // см. ниже
        try {
            const response = await chrome.runtime.sendMessage(extensionId, { ping: true });
            return !!response;
        } catch (e) {
            return false;
        }
    }

    async setSlotToChatInterface() {
        const mode = this.getAttribute('mode')
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', mode)
        if(mode === 'controller') {
            const targetPeer = this.getAttribute('target-peer')
            const chatInterface = await this.getComponentAsync('chat-interface', 'main-chat');
            const isActiveChat = chatInterface?.state?.isPrivateChat &&
                chatInterface.state.activeMember?.id === targetPeer;

            if (isActiveChat && chatInterface) {
                await chatInterface.addMessage({
                    text: `<slot name="remote-control-${targetPeer}"></slot>`,
                    to: targetPeer,
                    type: 'slot',
                    timestamp: Date.now(),
                    isPrivate: true
                });
            } else {
                const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
                if (chatManager) {
                    if (!chatManager.state.unreadCounts) chatManager.state.unreadCounts = {};
                    chatManager.state.unreadCounts[remotePeer] = (chatManager.state.unreadCounts[remotePeer] || 0) + 1;
                    if (chatInterface?.updateMembersList) {
                        await chatInterface.updateMembersList({unreadCounts: chatManager.state.unreadCounts});
                    }
                }
            }
        }
    }

    _events (pc) {
        // Обработка входящего видео от viewer
        pc.ontrack = async (event) => {
            const remoteVideo = this.shadowRoot.querySelector('#remote-video');
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
                log('Видео от viewer получено и отображается');
                await this.setSlotToChatInterface()
            }
        };

        pc.onicecandidateerror = (event) => {
            console.log('########### ОШИБКА КАНДИДАТА ###################', event)
        }

        pc.oniceconnectionstatechange = () => {
            this._handleIceConnectionState(pc.iceConnectionState);
        };

        // Обработка ICE-кандидатов (если понадобится)
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                const mode = this.getAttribute('mode')
                log('Получен локальный ICE-кандидат:', e.candidate);
                this._actions.sendInputEvent({
                    type: 'VIDEO_ICE_CANDIDATE',
                    mode: mode === 'viewer' ? 'controller': 'viewer',
                    candidate: e.candidate
                });
            }
        };
    }
    /**
     * Обрабатывает изменение состояния ICE-соединения
     * @param {string} state - Текущее состояние (например, 'connected', 'failed', 'disconnected' и т.д.)
     */
    _handleIceConnectionState(state) {
        const log = logger('remote-control:ice');
        const remoteVideo = this.shadowRoot.querySelector('#remote-video');
        const statusEl = this.shadowRoot.querySelector('#video-status');

        log('ICE Connection State: %s', state);

        switch (state) {
            case 'connected':
            case 'completed':
                console.log('✅ WebRTC соединение установлено. Видео должно отображаться.');
                if (statusEl) {
                    statusEl.textContent = 'Видеосвязь активна';
                    statusEl.className = 'video-status connected';
                }
                // Видео уже привязано в ontrack, но можно обновить состояние
                break;

            case 'failed':
                console.log('❌ WebRTC соединение не удалось');
                if (statusEl) {
                    statusEl.textContent = 'Ошибка соединения';
                    statusEl.className = 'video-status failed';
                }
                // Опционально: остановить поток или показать ошибку
                // this._cleanupWebRtc();
                break;

            case 'disconnected':
                log('⚠️ WebRTC соединение разорвано');
                if (statusEl) {
                    statusEl.textContent = 'Соединение разорвано';
                    statusEl.className = 'video-status disconnected';
                }
                break;

            case 'checking':
                if (statusEl) {
                    statusEl.textContent = 'Установка соединения...';
                    statusEl.className = 'video-status checking';
                }
                break;

            default:
                if (statusEl) {
                    statusEl.textContent = `ICE: ${state}`;
                    statusEl.className = `video-status ${state}`;
                }
                log('ICE state: %s', state);
        }
    }

    /**
     * Создаёт и настраивает RTCPeerConnection для режима controller
     * @returns {RTCPeerConnection}
     */
    async createPeerConnection() {
        const log = logger('remote-control:webrtc:controller');

        const pc = new RTCPeerConnection({ iceServers: [] });

        this._events(pc)

        this._videoPeerConnection = pc;

        return pc;
    }

    /**
     * Обрабатывает WebRTC offer от viewer и отправляет answer
     * @param {Object} offerData - { sdp: string, from: string }
     */
    async negotiateWebRtcOffer(offerData) {
        const log = logger('remote-control:webrtc:controller');
        try {
            if (this.state.mode !== 'controller') {
                console.warn('negotiateWebRtcOffer допустим только в режиме controller')
                return
            }

            const pc = this._videoPeerConnection = this._videoPeerConnection ? this._videoPeerConnection : await this.createPeerConnection()

            // 2. Устанавливаем удалённое описание (offer)
            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: offerData.sdp })
            );

            // 3. Генерируем и устанавливаем локальное описание (answer)
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // 5. Отправляем answer через chat-manager
            const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
            if (!chatManager) throw new Error('chat-manager недоступен');

            await chatManager.sendPrivateMessage(offerData.from, JSON.stringify({
                type: 'REMOTE_CONTROL_EVENT',
                payload: {
                    type: 'VIDEO_SDP',
                    sdpType: 'answer',
                    sdp: answer.sdp,
                    targetPeer: offerData.from,
                    timestamp: Date.now()
                }
            }));

            log('WebRTC answer отправлен viewer: %s', offerData.from);

        } catch (err) {
            log.error('Ошибка обработки WebRTC offer в controller:', err);
            this.addError({
                componentName: 'RemoteControl',
                source: 'negotiateWebRtcOffer',
                message: 'Не удалось обработать WebRTC offer от viewer',
                details: err
            });
        }
    }

    async handleIceCandidate(candidateData) {
        if (!this._videoPeerConnection) {
            log.error('RTCPeerConnection не инициализирован, игнорируем кандидат');
            return;
        }

        try {

            await this._videoPeerConnection.addIceCandidate(new RTCIceCandidate(candidateData));

            // Необязательно: установка обработчика ontrack для отображения стрима
            this._videoPeerConnection.ontrack = (event) => {
                console.log(';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;')
                const remoteVideo = this.shadowRoot.querySelector('#remote-video');

                if (remoteVideo) {
                    remoteVideo.srcObject = event.streams[0];
                }
            };
            log('ICE-кандидат успешно добавлен:', candidateData);
        } catch (err) {
            log.error('Ошибка добавления ICE-кандидата:', err);
        }
    }
    /**
     * Обрабатывает входящий WebRTC SDP-ответ (answer)
     * @param {Object} answerData - { sdp: string }
     */
    async handleWebRtcAnswer(answerData) {
        const log = logger('remote-control:webrtc');
        try {
            if (!this._videoPeerConnection) {
                log.error('RTCPeerConnection не инициализирован');
                return;
            }

            // Устанавливаем удалённое описание (answer)
            await this._videoPeerConnection.setRemoteDescription(
                new RTCSessionDescription({
                    type: 'answer',
                    sdp: answerData.sdp
                })
            );

            log('WebRTC answer успешно применён');
        } catch (err) {
            log.error('Ошибка обработки WebRTC-ответа:', err);
            this.addError({
                componentName: 'RemoteControl',
                source: 'handleWebRtcAnswer',
                message: 'Не удалось обработать WebRTC answer',
                details: err
            });
        }
    }

    async _startReadingStream(stream) {
        const lp = lpStream(stream);
        try {
            while (true) {
                const message = await lp.read();
                if (!message || message.length === 0) continue;

                const text = uint8ArrayToString(message.subarray());
                let eventData;
                try {
                    eventData = JSON.parse(text);
                } catch (e) {
                    log.error('Некорректное сообщение в remote-control стриме:', text);
                    continue;
                }

                if (eventData.type === 'REMOTE_CONTROL_EVENT') {
                    // Передаём событие в действия компонента
                    if (this._actions?.handleInputEvent) {
                        await this._actions.handleInputEvent(eventData.payload);
                    }
                }
            }
        } catch (err) {
            if (err.message !== 'stream closed' && err.code !== 'ERR_STREAM_RESET') {
                log.error('Ошибка чтения remote-control стрима:', err);
            }
            this.state.isConnected = false;
            await this.renderPart({
                partName: 'defaultTemplate',
                state: this.state,
                selector: '#root',
                method: 'innerHTML'
            });
        }
    }

    async _componentAttributeChanged(name, oldValue, newValue) {
        if (name === 'mode') {
            this.state.mode = newValue;
            await this.fullRender(this.state);
        }
        if (name === 'target-peer') {
            this.state.targetPeer = newValue;
            // Подписка на входящие события управления
            if (this.state.mode === 'viewer') {
                await this._actions.setupInputListener();
            }
        }
    }

    async _componentDisconnected() {
        if (this._controller?.destroy) await this._controller.destroy();
        if (this._actions?.cleanup) await this._actions.cleanup();
    }
}

if (!customElements.get('remote-control')) {
    customElements.define('remote-control', RemoteControl);
}