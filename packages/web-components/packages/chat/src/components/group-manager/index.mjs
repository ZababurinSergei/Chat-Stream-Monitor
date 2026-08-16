import { BaseComponent } from '../../base/base-component.mjs';
import { createActions } from './actions/index.mjs';
import { logger } from '@libp2p/logger';

export class GroupManager extends BaseComponent {
    constructor() {
        super();
        this.log = logger('group-manager');
        this.state = {
            groups: [],
            discoveredGroups: [],
            joinedGroups: [],
            nodeReady: false,
            _initialized: false
        };
        this._nodeCheckInterval = null;
    }

    async _componentReady() {
        this.log('component ready');

        this._actions = await createActions(this);

        this.log('actions created: %o', {
            hasActions: !!this._actions
        });

        // Запускаем инициализацию ноды
        await this.startNodeInitialization();

        this.state._initialized = true;

        // Автоматический поиск групп при старте
        setTimeout(async () => {
            if (this.state.nodeReady) {
                try {
                    this.log('автоматический поиск групп при старте');
                    await this.discoverGroups();
                } catch (error) {
                    this.log('автоматический поиск не удался: %o', error);
                }
            }
        }, 3000);

        return true;
    }

    async startNodeInitialization() {
        this.log('starting node initialization check');

        this._nodeCheckInterval = setInterval(async () => {
            try {
                await this.initializeFromPeerConnection();
            } catch (error) {
                this.log('waiting for node');
            }
        }, 2000);

        // Первоначальная попытка
        await this.initializeFromPeerConnection();
    }

    get allGroups() {
        return {
            groups: [...new Set([...(this.state.groups || []), ...(this.state.joinedGroups || [])])],
            all: [...new Set([
                    ...(this.state.groups || []),
                    ...(this.state.joinedGroups || []),
                    ...(this.state.discoveredGroups || []),
                ]
            )],
            discoveredGroups: this.state.discoveredGroups,
            joinedGroups: this.state.joinedGroups
        }
    }

    async postMessage(event) {
        if (event.type === 'NODE_RESTARTED') {
            await this.handleNodeRestart();
            return;
        }

        switch (event.type) {
            case 'REQUEST_ACTIVE_GROUPS':
                const activeGroups = [...(this.state.groups || []), ...(this.state.joinedGroups || [])];
                const requester = await this.getComponentAsync('chat-interface', 'main-chat');
                if (requester) {
                    await requester.postMessage({
                        type: 'ACTIVE_GROUPS_RESPONSE',
                        data: { activeGroups }
                    });
                }
                break;
            default:
                this.log('Получено необработанное сообщение: %s', event.type);
        }
    }

    async handleNodeRestart() {
        this.log('Обработка перезапуска ноды в GroupManager');

        // Сбрасываем состояние
        this.state.nodeReady = false;
        this.state.groups = [];
        this.state.discoveredGroups = [];
        this.state.joinedGroups = [];

        // Перезапускаем инициализацию
        await this.startNodeInitialization();

        this.log('GroupManager готов к работе с новой нодой');
    }

    async initializeFromPeerConnection() {
        try {
            // Получаем компонент peer-connection
            const peerConnection = await this.getComponentAsync('peer-connection', 'peer-connection');

            if (!peerConnection) {
                this.log('peer connection component not found');
                return false;
            }

            // Проверяем готовность ноды
            if (peerConnection.isNodeReady && peerConnection.isNodeReady()) {
                const node = peerConnection.getNode();

                // Дополнительная проверка, что PubSub запущен
                if (node && node.services && node.services.pubsub) {
                    // Инициализируем actions с нодой
                    await this._actions.initializeLibp2p(node);

                    this.state.nodeReady = true;

                    // Останавливаем интервал проверки
                    if (this._nodeCheckInterval) {
                        clearInterval(this._nodeCheckInterval);
                        this._nodeCheckInterval = null;
                    }

                    this.log('node obtained from peer connection for group manager, pubsub is ready');
                    return true;
                } else {
                    this.log('node found but pubsub not ready yet');
                    return false;
                }
            }

            return false;

        } catch (error) {
            this.log.error('failed to initialize from peer connection: %o', error);
            return false;
        }
    }

    async createGroup(input) {
        // Проверяем готовность ноды
        if (!this.state.nodeReady) {
            throw new Error('P2P нода не готова. Подождите немного и попробуйте снова.');
        }

        try {
            let group;
            if (typeof input === 'string') {
                // Создание новой группы
                const groupName = input.trim();
                if (!groupName) {
                    throw new Error('Название группы не может быть пустым');
                }

                this.log('creating group: %s', groupName);
                group = await this._actions.createGroup(groupName);
                this.log('group created: %o', group);

                // Обновляем локальный список "моих групп"
                this.state.groups = [...this.state.groups];

            } else if (input && typeof input === 'object') {
                // Подключение к существующей группе
                const groupData = input;
                if (!groupData.topic) {
                    throw new Error('Объект группы должен содержать поле "topic"');
                }

                this.log('joining existing group: %s (%s)', groupData.name || groupData.topic, groupData.topic);
                group = await this.joinGroup(groupData);
                this.log('joined group: %o', group);

            } else {
                throw new Error('Неверный тип аргумента: ожидается строка или объект группы');
            }

            // Уведомляем другие компоненты
            await this.notifyGroupCreation(group);

            this.log('Group operation completed');

            return group;

        } catch (error) {
            this.log.error('error in createGroup: %o', error);

            if (error.message.includes('Pubsub has not started')) {
                this.state.nodeReady = false;
                throw new Error('Сервис сообщений не готов. Попробуйте через несколько секунд.');
            }

            throw error;
        }
    }

    async discoverGroups() {
        if (!this.state.nodeReady) {
            throw new Error('P2P нода не готова.');
        }

        try {
            await this._actions.discoverGroups();
        } catch (error) {
            this.log.error('error discovering groups: %o', error);
            throw error;
        }
    }

    async searchGroups(query) {
        try {
            this.state.searchQuery = query;
            return await this._actions.searchGroups(query);
        } catch (error) {
            this.log.error('error searching groups: %o', error);
            throw error;
        }
    }

    async joinGroup(group) {
        if (!this.state.nodeReady) {
            throw new Error('P2P нода не готова.');
        }

        try {
            this.log('joining group: %s', group.name);
            const joinedGroup = await this._actions.joinGroup(group.topic || group.id);
            this.log('group joined: %o', joinedGroup);

            return joinedGroup;
        } catch (error) {
            this.log.error('error joining group: %o', error);
            throw error;
        }
    }

    async leaveGroup(groupId) {
        if (!this.state.nodeReady) {
            throw new Error('P2P нода не готова.');
        }

        try {
            this.log('leaving group: %s', groupId);
            await this._actions.leaveGroup(groupId);
            this.log('group left: %s', groupId);
        } catch (error) {
            this.log.error('error leaving group: %o', error);
            throw error;
        }
    }

    async checkNodeStatus() {
        try {
            const wasReady = this.state.nodeReady;
            await this.initializeFromPeerConnection();
            return this.state.nodeReady;
        } catch (error) {
            this.log.error('error checking node status: %o', error);
            return false;
        }
    }

    async notifyGroupCreation(group) {
        try {
            // Собираем актуальный список групп (мои + присоединённые)
            const activeGroups = [
                ...(this.state.groups || []),
                ...(this.state.joinedGroups || [])
            ];

            // Уведомляем chat-manager
            const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
            if (chatManager) {
                await chatManager.postMessage({
                    type: 'GROUP_CREATED',
                    data: group
                });
            }

            // Уведомляем chat-interface с группой и списком активных групп
            const chatInterface = await this.getComponentAsync('chat-interface', 'main-chat');
            if (chatInterface) {
                await chatInterface.postMessage({
                    type: 'GROUP_CREATED',
                    data: group
                });

                // Передаём список активных групп для обновления members-list
                await chatInterface.postMessage({
                    type: 'ACTIVE_GROUPS_UPDATED',
                    data: { activeGroups }
                });
            }

            this.log('Group creation notified to other components');
        } catch (error) {
            this.log.error('Error notifying group creation: %o', error);
        }
    }

    async _componentDisconnected() {
        if (this._nodeCheckInterval) {
            clearInterval(this._nodeCheckInterval);
            this._nodeCheckInterval = null;
        }

        if (this._actions && this._actions.cleanup) {
            await this._actions.cleanup();
        }
    }
}

if (!customElements.get('group-manager')) {
    customElements.define('group-manager', GroupManager);
}