import { BaseComponent } from '../../base/base-component.mjs';
import * as template from './template/index.mjs';
import { controller } from './controller/index.mjs';
import { createActions } from './actions/index.mjs';
import { logger } from '@libp2p/logger';
import { multiaddr } from "@multiformats/multiaddr";
import {WebRTC, WebSockets} from "@multiformats/multiaddr-matcher"

// Создаем логгер для компонента
const log = logger('peer-connection');

export class PeerConnection extends BaseComponent {
    constructor() {
        super();
        this._templateMethods = template;
        this.node = null;
        this.state = {
            mode: globalThis.APP_INITIAL_MODE,
            connected: false,
            peerId: null,
            listeningAddresses: [],
            webRtcAddress: null, // ← Добавлено
            connectedPeers: [],
            relayEnabled: true,
            startTime: null, // Время старта ноды
            uptime: '0:00',   // Текущее время работы
            // DHT Configuration
            dhtEnabled: {
                lan: false,
                amino: false,
                universe: true
            },
            dhtPeers: {
                lan: [],
                amino: [],
                universe: []
            }
        };
        this._lastPeersCount = 0; // Для отслеживания изменений
        this._uptimeInterval = null; // Интервал для обновления времени
        this._dhtServices = new Map(); // Для хранения DHT сервисов
    }

    async _componentReady() {
        // debugger
        log('PeerConnection component ready');

        this._controller = await controller(this);
        this._actions = await createActions(this);

        // Автоматически инициализируем начальный режим
        this.node = await this.initializeLibp2p(this.state.mode);

        log('Controller and actions created: %o', {
            hasController: !!this._controller,
            hasActions: !!this._actions
        });

        await this._controller.init();

        // Добавляем делегированный обработчик для копирования WebRTC-адреса
        this.shadowRoot.addEventListener('click', async (e) => {
            if (e.target.classList.contains('webRTC-address')) {
                const address = e.target.getAttribute('data-address');
                if (address) {
                    try {
                        await navigator.clipboard.writeText(address);
                        const original = e.target.textContent;
                        e.target.textContent = 'Скопировано!';
                        setTimeout(() => {
                            e.target.textContent = original;
                        }, 2000);
                    } catch (err) {
                        log.error('Не удалось скопировать WebRTC-адрес:', err);
                    }
                }
            }
        });

        return true;
    }

    async initializeLibp2p(mode = 'listener') {
        log('initializeLibp2p called with mode: %s', mode);

        this.state.mode = mode;
        this.state.connected = false;

        try {
            const libp2p = await this._actions.initializeLibp2p(mode);

            this.node = libp2p; // Сохраняем ноду
            // Запускаем обновление DHT пиров
            await this._actions.startDHTPeerUpdates();

            // Публикуем информацию о себе в DHT
            await this._actions.publishToDHT({
                mode: mode,
                capabilities: ['chat', 'groups'],
                version: '1.0.0'
            });

            this.state.peerId = libp2p.peerId.toString();

            // Получаем все адреса
            const allAddresses = libp2p.getMultiaddrs().map(ma => ma.toString());
            this.state.listeningAddresses = allAddresses;

            // Фильтруем WebRTC-адреса
            const webRtcAddresses = allAddresses.filter(addr => WebRTC.matches(multiaddr(addr)));
            this.state.webRtcAddress = webRtcAddresses.length > 0 ? webRtcAddresses[0] : null;

            this.state.connected = true;
            this.state.startTime = Date.now(); // Записываем время старта

            log('Libp2p initialized successfully');
            log('New state: %o', {
                mode: this.state.mode,
                connected: this.state.connected,
                peerId: this.state.peerId,
                addresses: this.state.listeningAddresses,
                webRtcAddress: this.state.webRtcAddress,
                startTime: this.state.startTime
            });

            // Запускаем обновление времени работы
            this.startUptimeCounter();

            await this.fullRender(this.state);

            if(this.state.mode === 'listener') {
                const relayAddress = await this.getRelayAddresses();
                const peerAddressInput = this.shadowRoot.querySelector('#peer-address-input');
                peerAddressInput.value = relayAddress;
            } else {
                const peerAddressInput = this.shadowRoot.querySelector('#peer-address-input');
                peerAddressInput.value = '';
            }

            // Отправляем начальный статус соединения
            await this.sendConnectionStatusToChatInterface();

            return libp2p;
        } catch (error) {
            log.error('Libp2p initialization failed: %o', error);
            await this.hideSkeleton();

            this.addError({
                componentName: this.constructor.name,
                source: 'initializeLibp2p',
                message: `Не удалось инициализировать режим ${mode}`,
                details: error
            });
            throw error;
        }
    }

    /**
     * Запускает счетчик времени работы
     */
    startUptimeCounter() {
        // Останавливаем предыдущий интервал если есть
        if (this._uptimeInterval) {
            clearInterval(this._uptimeInterval);
        }

        // Обновляем время каждую секунду
        this._uptimeInterval = setInterval(() => {
            if (this.state.startTime && this.state.connected) {
                this.updateUptime();
            }
        }, 1000);
    }

    /**
     * Обновляет время работы
     */
    updateUptime() {
        if (!this.state.startTime) return;

        const now = Date.now();
        const uptimeMs = now - this.state.startTime;

        // Форматируем время в формат MM:SS или HH:MM:SS
        const uptimeFormatted = this.formatUptime(uptimeMs);

        // Обновляем только если время изменилось
        if (this.state.uptime !== uptimeFormatted) {
            this.state.uptime = uptimeFormatted;

            // Обновляем отображение времени работы
            this.updateUptimeDisplay();

            // Отправляем обновление статуса в chat-interface
            // this.sendConnectionStatusToChatInterface();
        }
    }

    /**
     * Форматирует время работы в читаемый формат
     * @param {number} ms - Время в миллисекундах
     * @returns {string} Отформатированное время
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
        }
    }

    /**
     * Обновляет отображение времени работы в UI
     */
    async updateUptimeDisplay() {
        const uptimeElement = this.shadowRoot.querySelector('.status-item .status-value');
        if (uptimeElement) {
            // Просто обновляем текст элемента
            uptimeElement.textContent = this.state.uptime;
        } else {
            // Если элемент не найден, обновляем всю секцию статуса
            await this.renderPart({
                partName: 'renderSystemStatus',
                state: this.state,
                selector: '.status-card .card-content'
            });
        }
    }

    // Новый метод для получения ноды
    getNode() {
        return this.node;
    }

    // Новый метод для проверки доступности ноды
    isNodeReady() {
        return this.node !== null && this.state.connected;
    }

    /**
     * Копирует текст в буфер обмена с визуальной обратной связью
     * @param {string} text - Текст для копирования
     * @param {string} successMessage - Сообщение об успехе
     */
    async copyToClipboard(text, successMessage = 'Текст скопирован в буфер обмена', addressItem) {
        try {
            await navigator.clipboard.writeText(text);
            log('Text copied to clipboard: %s', text);

            addressItem.classList.add('copied')

            setTimeout(() => {
                addressItem.classList.remove('copied');
            }, 2000);

            return true;
        } catch (error) {
            log.error('Error copying to clipboard: %o', error);

            // Fallback для старых браузеров
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    await this.showModal({
                        title: 'Успех',
                        content: `<p>${successMessage}</p>`,
                        buttons: [{ text: 'OK', type: 'primary' }],
                        closeOnBackdropClick: true
                    });
                    return true;
                }
            } catch (fallbackError) {
                log.error('Fallback copy also failed: %o', fallbackError);
            }

            await this.showModal({
                title: 'Ошибка',
                content: '<p>Не удалось скопировать текст в буфер обмена</p>',
                buttons: [{ text: 'OK', type: 'primary' }],
                closeOnBackdropClick: true
            });

            return false;
        }
    }

    async connectToPeer(multiaddr) {
        try {
            log('Connecting to peer: %s', multiaddr);
            await this._actions.connectToPeer(multiaddr);

            // Добавляем задержку перед обновлением списка
            await new Promise(resolve => setTimeout(resolve, 1000));

            await this.updatePeerList();
            log('Successfully connected to peer: %s', multiaddr);
        } catch (error) {
            log.error('Ошибка подключения к пиру: %o', error);

            // Более информативное сообщение об ошибке
            const errorMessage = error.message || 'Неизвестная ошибка подключения';
            this.addError({
                componentName: this.constructor.name,
                source: 'connectToPeer',
                message: `Не удалось подключиться к ${multiaddr}: ${errorMessage}`,
                details: error
            });
            throw error;
        }
    }

    async updatePeerList() {
        try {
            if (this._actions && this._actions.getConnectedPeers) {
                const previousCount = this._lastPeersCount;
                const peers = await this._actions.getConnectedPeers();

                // Добавляем проверку на валидность данных
                this.state.connectedPeers = Array.isArray(peers) ? peers : [];
                this._lastPeersCount = this.state.connectedPeers.length;

                log('Peer list updated: %o', {
                    previous: previousCount,
                    current: this._lastPeersCount,
                    peers: this.state.connectedPeers.map(p => p.id).filter(Boolean)
                });

                // Обновляем секцию peers-card
                await this.updatePeersCard();

                // Передаем данные в chat-interface с обработкой ошибок
                try {
                    await this.sendPeersToChatInterface();
                } catch (sendError) {
                    log.error('Error sending peers to chat interface: %o', sendError);
                }

            } else {
                log.error('getConnectedPeers action not available');
            }
        } catch (error) {
            log.error('Error updating peer list: %o', error);
        }
    }

    /**
     * Передает данные о пирах в chat-interface
     */
    /**
     * Передает данные о пирах в chat-interface
     */
    async sendPeersToChatInterface() {
        try {
            const chatInterface = await this.getComponentAsync('chat-interface', 'main-chat');
            if (chatInterface) {
                // Формируем данные для передачи с именами
                const peersData = {
                    totalPeers: this.state.connectedPeers.length,
                    peers: this.state.connectedPeers.map(peer => {
                        const prefix = peer.id ? peer.id.substring(0, 6) : 'unknown';
                        const suffix = peer.id ? peer.id.substring(peer.id.length - 4) : '????';
                        return {
                            id: peer.id || 'unknown',
                            name: `${prefix}...${suffix}`,
                            connections: peer.connections ? peer.connections.length : 1,
                            status: 'connected'
                        };
                    }),
                    connectionStatus: this.state.connected,
                    timestamp: Date.now()
                };

                await chatInterface.postMessage({
                    type: 'PEERS_UPDATE',
                    data: peersData
                });

                // Используем log вместо this.log
                log('Peers data sent to chat-interface: %o', peersData);
            }
        } catch (error) {
            // Используем log вместо this.log
            log.error('Error sending peers to chat interface: %o', error);
        }
    }

    /**
     * Передает информацию о соединении в chat-interface
     */
    async sendConnectionStatusToChatInterface() {
        try {
            const chatInterface = await this.getComponentAsync('chat-interface', 'main-chat');
            if (chatInterface) {
                const connectionData = {
                    connected: this.state.connected,
                    peerId: this.state.peerId,
                    mode: this.state.mode,
                    uptime: this.state.uptime,
                    timestamp: Date.now()
                };

                await chatInterface.postMessage({
                    type: 'CONNECTION_STATUS_UPDATE',
                    data: connectionData
                });

                log('Connection status sent to chat-interface: %o', connectionData);
            }
        } catch (error) {
            log.error('Error sending connection status: %o', error);
        }
    }

    /**
     * Обновляет секцию с пирами
     */
    async updatePeersCard() {
        const peersCard = this.shadowRoot.querySelector('.peers-card');
        if (peersCard && this.renderPart) {
            log('Updating peers card section');
            await this.renderPart({
                partName: 'renderPeersList',
                state: this.state,
                selector: '.peers-card .card-content'
            });

            // После обновления переустанавливаем обработчики
            setTimeout(() => {
                this._setupCopyHandlers();
            }, 100);
        } else {
            log('Peers card not found, using full render');
            await this.fullRender(this.state);
        }
    }

    /**
     * Устанавливает обработчики для кнопок копирования
     */
    _setupCopyHandlers() {
        const copyButtons = this.shadowRoot.querySelectorAll('.address-action.copy');
        copyButtons.forEach(button => {
            const handler = async (e) => {
                const addressItem = e.target.closest('.address-item');
                if (addressItem) {
                    const address = addressItem.getAttribute('data-address');
                    if (address) {
                        await this.copyToClipboard(address, 'Адрес скопирован в буфер обмена', addressItem);
                    }
                }
            };
            // Удаляем старые обработчики и добавляем новые
            button.replaceWith(button.cloneNode(true));
            button.addEventListener('click', handler);
        });

        // Также обновляем обработчики для кнопок пиров
        const peerCopyButtons = this.shadowRoot.querySelectorAll('.copy-peer-id');
        peerCopyButtons.forEach(button => {
            const handler = async (e) => {
                const peerId = e.target.getAttribute('data-peer-id');
                if (peerId) {
                    await this.copyToClipboard(peerId, 'Peer ID скопирован в буфер обмена', e.target);
                }
            };
            button.replaceWith(button.cloneNode(true));
            button.addEventListener('click', handler);
        });
    }

    async switchMode(mode) {
        log('switchMode called with: %s', mode);
        log('Current mode: %s', this.state.mode);

        if (this.state.mode !== mode) {
            log('Mode change detected, proceeding...');

            if (this._actions && this._actions.cleanup) {
                log('Cleaning up previous connections...');
                await this._actions.cleanup();
            }

            log('Initializing Libp2p with new mode...');
            await this.initializeLibp2p(mode);

            log('Mode switch completed');
        } else {
            log('Mode is already %s', mode);
        }
    }

    async getRelayAddresses() {
        return '/dns4/localhost/tcp/6835/ws/p2p/12D3KooWSSixS7BBVNLqxK77JyUhYd7khX1PV7nBGKXEqbi6hwEB';
    }

    async manualUpdate() {
        log('Ручное обновление PeerConnection');
        if (this._actions && this._actions.manualUpdate) {
            await this._actions.manualUpdate();
        }
    }

    async forceUpdate() {
        log('Принудительное обновление PeerConnection');
        if (this._actions && this._actions.forceUpdate) {
            await this._actions.forceUpdate();
        }
    }

    async _componentAdopted() {
        console.log('################## ADOPTED ##################')
    }


    async _componentDisconnected() {
        // Останавливаем счетчик времени
        if (this._uptimeInterval) {
            clearInterval(this._uptimeInterval);
            this._uptimeInterval = null;
        }

        if (this._controller && this._controller.destroy) {
            await this._controller.destroy();
        }
        if (this._actions && this._actions.cleanup) {
            await this._actions.cleanup();
        }
        this._templateMethods = null;
        this.remove()
    }
}

if (!customElements.get('peer-connection')) {
    customElements.define('peer-connection', PeerConnection);
}