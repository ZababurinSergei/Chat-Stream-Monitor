import { BaseComponent } from '../../base/base-component.mjs';
import * as template from './template/index.mjs';
import { controller } from './controller/index.mjs';
import { createActions } from './actions/index.mjs';
import { logger } from '@libp2p/logger';
import { generatePeerName } from '../utils/index.mjs'

export class ChatInterface extends BaseComponent {
    constructor() {
        super();
        this._templateMethods = template;
        this._log = logger('chat-interface');
        this.state = {
            messages: [],
            currentMessage: '',
            connected: false,
            currentGroup: null,
            connectedPeers: [],
            totalPeers: 0,
            peerId: null,
            connectionMode: null,
            uptime: null,
            activeMember: null,        // Активный пользователь для приватного чата
            isPrivateChat: false       // Флаг приватного чата
        };
    }

    async _componentReady() {
        this._log('компонент готов');

        this._controller = await controller(this);
        this._actions = await createActions(this);
        await this.fullRender(this.state)
        await this._controller.init();
        this._log('компонент готов');
        return true;
    }

    async addMessage(message) {
        // Добавляем сообщение в локальный UI-стек
        this.state.messages.push({
            ...message,
            timestamp: message.timestamp || Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });

        // Ограничиваем историю последними 100 сообщениями
        if (this.state.messages.length > 100) {
            this.state.messages = this.state.messages.slice(-100);
        }

        // === Сохраняем в долговременную историю ===
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        if (chatManager) {
            if (message.isPrivate && message.from === this.state.peerId) {
                // Приватное сообщение
                await chatManager.addMessageToPrivateHistory({
                    text: message.text,
                    from: message.from,
                    to: message.to,
                    type: message.type,
                    timestamp: message.timestamp || Date.now(),
                    isPrivate: true
                });
            } else if (message.topic) {
                // Групповое сообщение
                await chatManager.addMessageToTopicHistory({
                    text: message.text,
                    topic: message.topic,
                    from: message.from,
                    type: message.type || (message.from === this.state.peerId ? 'sent' : 'received'),
                    timestamp: message.timestamp || Date.now()
                });
            }
        }

        // Обновляем UI
        await this.renderPart({
            partName: 'renderMessages',
            state: this.state,
            selector: '#messages-list'
        });

        // Автоскролл к последнему сообщению
        const messagesContainer = this.shadowRoot.querySelector('#messages-list');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        this._log('сообщение добавлено: %s', message.text?.substring(0, 50));
    }

    async setCurrentGroup(group) {
        if (!group || !group.topic) {
            this._log.error('Неверные данные группы:', group);
            return;
        }

        // Нормализуем имя группы как строку
        const safeName = typeof group.name === 'string'
            ? group.name
            : (typeof group.name === 'object' && group.name?.name
                ? group.name
                : 'Безымянная группа');

        const safeGroup = {
            ...group,
            name: safeName,
            topic: typeof group.topic === 'string' ? group.topic : ''
        };

        this.state.currentGroup = safeGroup;
        this.state.activeMember = null; // Сбрасываем активного пользователя
        this.state.isPrivateChat = false; // Возвращаем в групповой режим

        // ✅ Подгружаем историю из chat-manager
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        let history = [];
        if (chatManager?.state?.topicHistories?.[safeGroup.topic]) {
            history = [...chatManager.state.topicHistories[safeGroup.topic]];
        }

        this.state.messages = history;
        this._log('установлена текущая группа: %s, загружено сообщений: %d', safeGroup.name, history.length);

        // Уведомляем chat-manager об обновлении заголовка
        if (chatManager) {
            await chatManager.postMessage({
                type: 'UPDATE_CHAT_HEADER',
                data: { currentGroup: safeGroup }
            });
        }

        // ✅ Сбрасываем unread-счётчик для этой группы, если он был
        if (this.state.unreadCounts?.[safeGroup.topic]) {
            delete this.state.unreadCounts[safeGroup.topic];
        }

        // Обновляем UI
        await this.updateMembersList();
        await this.updateChatInput();
        await this.fullRender(this.state);
    }

    async updateConnectionStatus(connected) {
        this.state.connected = connected;
        await this.updateChatInput();
        await this.renderPart({
            partName: 'renderStatus',
            state: this.state,
            selector: '#connection-status'
        });
        this._log('статус подключения обновлен: %s', connected ? 'подключено' : 'не подключено');
    }

    async clearMessages() {
        this.state.messages = [];
        await this.renderPart({
            partName: 'renderMessages',
            state: this.state,
            selector: '#messages-list'
        });
        this._log('история сообщений очищена');
    }

    /**
     * Обрабатывает создание новой группы
     * @param {Object} groupData - Данные созданной группы
     */
    async handleGroupCreated(groupData) {
        try {
            this._log('Получена новая группа: %o', groupData);

            // Нормализуем имя группы как строку
            const safeName = typeof groupData.name === 'string'
                ? groupData.name
                : 'Безымянная группа';

            const safeGroup = {
                ...groupData,
                name: safeName,
                topic: typeof groupData.topic === 'string' ? groupData.topic : ''
            };

            // Если текущая группа ещё не выбрана — можно автоматически активировать
            // (опционально, по вашему UX-решению)
            // Например, если это ваша собственная группа:
            if (safeGroup.createdBy === this.state.peerId && !this.state.currentGroup) {
                await this.setCurrentGroup(safeGroup);
            }

            // Можно также обновить список групп в UI, если он отображается
            // (в chat-interface он не отображается, но если вы добавите — будет работать)

        } catch (error) {
            this._log.error('Ошибка обработки GROUP_CREATED: %o', error);
            this.addError({
                componentName: this.constructor.name,
                source: 'handleGroupCreated',
                message: 'Ошибка при обработке созданной группы',
                details: error
            });
        }
    }

    /**
     * Обрабатывает обновление DHT пиров
     * @async
     * @param {Object} data - Данные DHT пиров
     */
    async handleDHTPeersUpdate(data) {
        try {
            this._log('👥 обработка обновления DHT пиров: %o', data);

            // Объединяем DHT пиров с обычными подключенными пирами
            const dhtPeers = data.peers || [];
            const existingPeerIds = new Set(this.state.connectedPeers.map(p => p.id));

            // Добавляем только новых пиров из DHT
            const newDHTPeers = dhtPeers.filter(peer =>
                !existingPeerIds.has(peer.id) && peer.id !== this.state.peerId
            );

            if (newDHTPeers.length > 0) {
                this.state.connectedPeers = [
                    ...this.state.connectedPeers,
                    ...newDHTPeers.map(peer => ({
                        id: peer.id,
                        name: this.generatePeerName(peer.id),
                        online: true,
                        discoveredVia: peer.dhtType || 'DHT',
                        isDHT: true
                    }))
                ];

                this._log('Добавлено %d новых пиров из DHT', newDHTPeers.length);

                // Обновляем список участников
                await this.updateMembersList();
            }

        } catch (error) {
            this._log.error('❌ ошибка обработки DHT пиров: %o', error);
        }
    }

    async postMessage(event) {
        try {
            this._log('📨 получено сообщение: %s %o', event.type, event.data);

            switch (event.type) {
                case 'DHT_PEERS_UPDATE':
                    await this.handleDHTPeersUpdate(event.data);
                    break;
                case 'ACTIVE_GROUPS_UPDATED':
                    // Сохраняем список активных групп в состоянии
                    this.state.activeGroups = event.data.activeGroups || [];
                    // Обновляем список участников (включая группы)
                    await this.updateMembersList();
                    break;
                case 'PEERS_UPDATE':
                    await this.handlePeersUpdate(event.data);
                    break;

                case 'CONNECTION_STATUS_UPDATE':
                    await this.handleConnectionStatusUpdate(event.data);
                    break;

                case 'INCOMING_MESSAGE':
                    const { topic } = event.data;
                    // Отображаем только если это текущая группа
                    if (this.state.currentGroup?.topic === topic) {
                        await this._actions.handleIncomingMessage(event.data);
                    }
                    // await this._actions.handleIncomingMessage(event.data);
                    break;

                case 'INCOMING_PRIVATE_MESSAGE':
                    if (this.state.isPrivateChat && this.state.activeMember?.id === event.data.from) {
                        await this._actions.handleIncomingPrivateMessage(event.data);
                    }
                    // await this._actions.handleIncomingPrivateMessage(event.data);
                    break;
                case 'GROUP_CREATED':
                    await this.handleGroupCreated(event.data);
                    break;
                default:
                    this._log.error('неизвестный тип сообщения: %s', event.type);
            }
        } catch (error) {
            this._log.error('❌ ошибка обработки сообщения: %o', error);
            this.addError({
                componentName: this.constructor.name,
                source: 'postMessage',
                message: 'Ошибка обработки сообщения',
                details: error
            });
        }
    }

    /**
     * Обрабатывает обновление списка пиров
     * @param {Object} data - Данные о пирах
     */
    async handlePeersUpdate(data) {
        try {
            this._log('👥 обработка обновления пиров: %o', data);

            // Формируем правильные данные участников
            this.state.connectedPeers = (data.peers || []).map(peer => ({
                id: peer.id,
                name: peer.name || generatePeerName(peer.id), // Используем переданное имя или генерируем
                online: true,
                connections: peer.connections || 1
            }));

            this.state.totalPeers = data.totalPeers || 0;

            // Обновляем отображение статуса подключения
            await this.updateConnectionStatusDisplay();

            // Обновляем список участников если открыта панель
            await this.updateMembersList();

            this._log('✅ данные пиров обработаны, участников: %d', this.state.connectedPeers.length);

        } catch (error) {
            this._log.error('❌ ошибка обработки обновления пиров: %o', error);
        }
    }

    /**
     * Обрабатывает обновление статуса соединения
     * @param {Object} data - Данные о соединении
     */
    async handleConnectionStatusUpdate(data) {
        try {
            this._log('🔗 обработка обновления статуса соединения: %o', data);

            // Обновляем состояние соединения
            this.state.connected = data.connected;
            this.state.peerId = data.peerId;
            this.state.connectionMode = data.mode;
            this.state.uptime = data.uptime;

            // Обновляем отображение статуса
            await this.updateConnectionStatusDisplay();

            this._log('✅ статус соединения обновлен');

        } catch (error) {
            this._log.error('❌ ошибка обработки статуса соединения: %o', error);
        }
    }

    /**
     * Обновляет отображение статуса подключения
     */
    async updateConnectionStatusDisplay() {
        try {
            const statusElement = this.shadowRoot.querySelector('#connection-status');
            if (statusElement && this.renderPart) {
                await this.renderPart({
                    partName: 'renderConnectionStatus',
                    state: this.state,
                    selector: '#connection-status'
                });
                this._log.trace('отображение статуса подключения обновлено');
            }
        } catch (error) {
            this._log.error('❌ ошибка обновления отображения статуса: %o', error);
        }
    }

    /**
     * Обновляет список участников в боковой панели
     */
    async updateMembersList(props = {}) {
        try {
            const membersPanel = this.shadowRoot.querySelector('#members-panel');
            if (membersPanel && this.renderPart) {
                await this.renderPart({
                    partName: 'renderMembersList',
                    state: Object.assign(this.state, props),
                    selector: '.members-list'
                });
                this._log.trace('список участников обновлен');
            }
        } catch (error) {
            this._log.error('❌ ошибка обновления списка участников: %o', error);
        }
    }

    // async setActiveMember(member) {
    //     if (!member || !member.id) {
    //         this._log.error('неверные данные пользователя: %o', member);
    //         return;
    //     }
    //
    //     debugger
    //     // Убедимся, что у участника есть имя
    //     const memberWithName = {
    //         ...member,
    //         name: member.name || generatePeerName(member.id)
    //     };
    //
    //     this.state.activeMember = memberWithName;
    //     this.state.isPrivateChat = true;
    //     this.state.messages = []; // Очищаем историю при смене чата
    //
    //     await this.updateMembersList();
    //     await this.updateChatHeader();
    //     await this.updateChatInput();
    //     await this.renderPart({
    //         partName: 'renderMessages',
    //         state: this.state,
    //         selector: '#messages-list'
    //     });
    //
    //     this._log('активный пользователь установлен: %s', memberWithName.name);
    // }

    /**
     * Установка активного пользователя для приватного чата
     * @async
     * @param {Object} member - Данные пользователя
     * @this {HTMLElement} Контекст компонента
     */
    async setActiveMember(member) {
        const log = logger('chat-interface:actions:setActiveMember');

        try {
            if (!member || !member.id) {
                log.error('неверные данные пользователя: %o', member);
                return;
            }

            // Не выбираем себя
            if (member.isCurrentUser) {
                log('попытка выбрать себя - игнорируем');
                return;
            }

            // Гарантируем наличие имени
            const displayName = member.name || this.generatePeerName(member.id);
            const memberWithName = { ...member, name: displayName };

            log('установка активного пользователя: %s (%s)', displayName, member.id);

            // Обновляем состояние
            this.state.activeMember = memberWithName;
            this.state.isPrivateChat = true;

            // Обновляем заголовок чата
            await this.updateChatHeader();

            // ✅ Уведомляем chat-manager об активации приватного чата
            const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
            if (chatManager) {
                await chatManager.postMessage({
                    type: 'UPDATE_CHAT_HEADER',
                    data: {
                        isPrivateChat: true,
                        activeMember: memberWithName
                    }
                });

                // ✅ Загружаем историю приватного чата из chat-manager
                const peerId = member.id;
                const history = chatManager.state.privateHistories?.[peerId] || [];
                this.state.messages = [...history]; // Копируем, чтобы избежать мутаций
            } else {
                // Если chat-manager недоступен — оставляем пустую историю
                this.state.messages = [];
            }

            if (this.state.unreadCounts?.[member.id]) {
                delete this.state.unreadCounts[member.id];
            }

            // Обновляем UI списка участников
            await this.updateMembersList();

            // Рендерим чат с загруженной историей
            await this.renderPart({
                partName: 'renderMessages',
                state: this.state,
                selector: '#messages-list'
            });

            log('приватный чат установлен с пользователем: %s', displayName);

        } catch (error) {
            log.error('ошибка установки активного пользователя: %o', error);
            this.addError({
                componentName: this.constructor.name,
                source: 'setActiveMember',
                message: 'Ошибка установки приватного чата',
                details: { member, error }
            });
        }
    }

    async updateChatHeader() {
        try {
            const chatHeader = this.shadowRoot.querySelector('.chat-header');
            if (chatHeader && this.renderPart) {
                await this.renderPart({
                    partName: 'renderChatHeader',
                    state: this.state,
                    selector: '.chat-header'
                });

                await this.renderPart({
                    partName: 'renderConnectionStatus',
                    state: this.state,
                    selector: '#connection-status'
                });
            }
        } catch (error) {
            this._log.error('ошибка обновления заголовка чата: %o', error);
        }
    }

    async updateChatInput() {
        try {
            const messageInput = this.shadowRoot.querySelector('#message-input');
            const sendButton = this.shadowRoot.querySelector('#send-button');

            if (messageInput && sendButton) {
                // Обновляем placeholder
                messageInput.placeholder = this.getInputPlaceholder(this.state);

                // Обновляем состояние disabled
                const shouldBeDisabled = !this.state.connected ||
                    (!this.state.currentGroup && !this.state.activeMember);

                messageInput.disabled = shouldBeDisabled;
                sendButton.disabled = shouldBeDisabled;

                this._log('поле ввода обновлено, disabled: %s', shouldBeDisabled);
            }
        } catch (error) {
            this._log.error('ошибка обновления поля ввода: %o', error);
        }
    }

    // В класс ChatInterface добавьте метод:
    showNotification(message) {
        const log = this._log;

        if (!('Notification' in window)) {
            log('Browser notifications not supported');
            return;
        }

        if (Notification.permission === 'granted') {
            try {
                new Notification('Чат', {
                    body: message,
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                });
            } catch (error) {
                log.error('Ошибка создания уведомления: %o', error);
            }
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Чат', {
                        body: message,
                        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    });
                }
            });
        }
    }

    /**
     * Получает placeholder для поля ввода
     */
    getInputPlaceholder(state) {
        if (!state.connected) return 'Подключитесь к сети...';
        if (state.isPrivateChat && state.activeMember) {
            return `Сообщение для ${state.activeMember.name}...`;
        }
        if (!state.currentGroup) return 'Выберите группу для общения...';
        return 'Введите сообщение...';
    }
    async _componentDisconnected() {
        if (this._controller && this._controller.destroy) {
            await this._controller.destroy();
        }
        this._templateMethods = null;
        this._log('компонент отключен');
    }
}

if (!customElements.get('chat-interface')) {
    customElements.define('chat-interface', ChatInterface);
}