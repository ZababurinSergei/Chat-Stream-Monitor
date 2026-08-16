import {parseChatGroupStringRegex} from '../../utils/index.mjs'
import { logger } from '@libp2p/logger';

/**
 * Фабричная функция для создания действий компонента GroupManager
 * @param {Object} context - Контекст компонента
 * @returns {Promise<Object>} Объект с методами действий
 */
export async function createActions(context) {
    let libp2p = null;
    let discoveredGroupsInterval = null;
    const GROUPS_ANNOUNCEMENT_TOPIC = 'chat-groups-announcements';
    const log = logger('group-manager:actions');

    /**
     * Нормализует имя группы: гарантирует, что это строка.
     * @param {*} name - Любое значение
     * @returns {string}
     */
    function normalizeGroupName(name) {
        if (typeof name === 'string' && name.trim()) {
            return name.trim();
        }
        if (typeof name === 'object' && name !== null && typeof name.name === 'string') {
            return name.name.trim();
        }
        if (typeof name === 'object' && name !== null && typeof name.topic === 'string') {
            return parseChatGroupStringRegex(name.topic);
        }
        return 'Безымянная группа';
    }

    return {
        /**
         * Инициализация Libp2p для работы с группами
         * @async
         * @param {Object} libp2pInstance - Экземпляр Libp2p
         */
        initializeLibp2p: async function(libp2pInstance) {
            libp2p = libp2pInstance;

            // Подписываемся на топик анонсов групп
            await this.subscribeToGroupsAnnouncements();

            // Запускаем периодический поиск групп
            await this.startGroupDiscovery();

            log('libp2p инициализирован для управления группами');
        },

        /**
         * Подписывается на топик анонсов групп
         * @async
         */
        async subscribeToGroupsAnnouncements() {
            if (!libp2p) return;

            try {
                await libp2p.services.pubsub.subscribe(GROUPS_ANNOUNCEMENT_TOPIC);

                // Обработчик входящих сообщений
                libp2p.services.pubsub.addEventListener('message', (event) => {
                    if (event.detail.topic === GROUPS_ANNOUNCEMENT_TOPIC) {
                        try {
                            const message = JSON.parse(new TextDecoder().decode(event.detail.data));

                            if (message.type === 'GROUP_CREATED' || message.type === 'GROUP_UPDATED') {
                                this.handleGroupAnnouncement(event.detail);
                            } else if (message.type === 'GROUPS_DISCOVERY_REQUEST' ||
                                message.type === 'GROUPS_DISCOVERY_RESPONSE') {
                                this.handleDiscoveryRequest(event.detail);
                            }
                        } catch (error) {
                            log.error('ошибка обработки сообщения: %o', error);
                        }
                    }
                });

                log('подписан на топик анонсов групп: %s', GROUPS_ANNOUNCEMENT_TOPIC);
            } catch (error) {
                log.error('ошибка подписки на топик анонсов: %o', error);
            }
        },

        /**
         * Обрабатывает входящие анонсы групп
         * @param {Object} message - Сообщение с анонсом
         */
        async handleGroupAnnouncement(message) {
            try {
                const announcement = JSON.parse(new TextDecoder().decode(message.data));

                if (announcement.type === 'GROUP_CREATED' || announcement.type === 'GROUP_UPDATED') {
                    const groupInfo = announcement.data;

                    // Нормализуем имя группы
                    groupInfo.name = normalizeGroupName(groupInfo.name);

                    // Обновляем список обнаруженных групп
                    await this.updateDiscoveredGroups(groupInfo);

                    log('получен анонс группы: %s', groupInfo.name);
                }
            } catch (error) {
                log.error('ошибка обработки анонса группы: %o', error);
            }
        },

        /**
         * Обновляет список обнаруженных групп
         * @async
         * @param {Object} groupInfo - Информация о группе
         */
        async updateDiscoveredGroups(groupInfo) {
            if (!context.state.discoveredGroups) {
                context.state.discoveredGroups = [];
            }

            // Нормализуем имя
            groupInfo.name = normalizeGroupName(groupInfo.name);

            // Проверяем, нет ли уже такой группы
            const existingIndex = context.state.discoveredGroups.findIndex(g => g.id === groupInfo.id);

            if (existingIndex >= 0) {
                // Обновляем существующую группу
                context.state.discoveredGroups[existingIndex] = {
                    ...context.state.discoveredGroups[existingIndex],
                    ...groupInfo,
                    lastUpdated: Date.now()
                };
            } else {
                // Добавляем новую группу
                context.state.discoveredGroups.push({
                    ...groupInfo,
                    discoveredAt: Date.now(),
                    lastUpdated: Date.now()
                });
            }

            // Сортируем по времени обновления (новые сверху)
            context.state.discoveredGroups.sort((a, b) => b.lastUpdated - a.lastUpdated);

            // 🔥 Уведомляем chat-manager о новых обнаруженных группах
            const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
            if (chatManager) {
                await chatManager.postMessage({
                    type: 'GROUPS_DISCOVERED',
                    data: { groups: context.state.discoveredGroups }
                });
            }
        },

        /**
         * Запуск процесса обнаружения групп
         * @async
         */
        startGroupDiscovery: async function() {
            if (discoveredGroupsInterval) {
                clearInterval(discoveredGroupsInterval);
            }

            // Первоначальное обнаружение
            await this.discoverGroups();
        },

        /**
         * Активный поиск групп через анонсы
         * @async
         */
        async discoverGroupsActive() {
            if (!libp2p) {
                throw new Error('Libp2p не инициализирован');
            }

            try {
                log('запуск активного поиска групп');

                // Отправляем запрос на поиск групп
                const discoveryRequest = {
                    type: 'GROUPS_DISCOVERY_REQUEST',
                    data: {
                        requester: libp2p.peerId.toString(),
                        timestamp: Date.now(),
                        protocols: ['chat-groups-', 'chat-group-', 'universe-chat-']
                    }
                };

                // Публикуем запрос на обнаружение
                await libp2p.services.pubsub.publish(
                    GROUPS_ANNOUNCEMENT_TOPIC,
                    new TextEncoder().encode(JSON.stringify(discoveryRequest))
                );

                log('запрос на обнаружение групп отправлен');

                // Также выполняем локальный поиск
                await this.discoverGroups();

                return true;

            } catch (error) {
                log.error('ошибка активного поиска групп: %o', error);
                throw error;
            }
        },

        /**
         * Обработчик запросов на обнаружение групп
         */
        async handleDiscoveryRequest(message) {
            try {
                const request = JSON.parse(new TextDecoder().decode(message.data));

                if (request.type === 'GROUPS_DISCOVERY_REQUEST') {
                    // Отвечаем своими группами
                    const myGroups = context.state.groups || [];

                    if (myGroups.length > 0) {
                        const response = {
                            type: 'GROUPS_DISCOVERY_RESPONSE',
                            data: {
                                groups: myGroups,
                                responder: libp2p.peerId.toString(),
                                timestamp: Date.now()
                            }
                        };

                        await libp2p.services.pubsub.publish(
                            GROUPS_ANNOUNCEMENT_TOPIC,
                            new TextEncoder().encode(JSON.stringify(response))
                        );

                        log('отправлен ответ с %d группами', myGroups.length);
                    }
                }

                if (request.type === 'GROUPS_DISCOVERY_RESPONSE') {
                    // Обрабатываем полученные группы
                    const discoveredGroups = request.data.groups || [];

                    for (const group of discoveredGroups) {
                        // Нормализуем имя перед обработкой
                        group.name = normalizeGroupName(group.name);
                        await this.updateDiscoveredGroups(group);
                    }

                    log('получено %d групп от %s', discoveredGroups.length, request.data.responder);
                }

            } catch (error) {
                log.error('ошибка обработки запроса обнаружения: %o', error);
            }
        },

        /**
         * Обнаружение доступных групп через PubSub
         * @async
         */
        discoverGroups: async function() {
            if (!libp2p) {
                log.error('libp2p не инициализирован');
                return;
            }

            try {
                // Получаем список активных топиков из PubSub
                const topics = libp2p.services.pubsub?.getTopics() || [];

                const allGroups = [...context.state.groups, ...context.state.joinedGroups ,...context.state.discoveredGroups]

                const groupTopics = topics.filter(topic =>
                    topic.startsWith('chat-group-') ||
                    topic.startsWith('universe-chat-') ||
                    topic.startsWith('chat-groups-')
                );

                log('найдено топиков групп: %d', groupTopics.length);

                const discoveredGroups = [];

                for (const topic of groupTopics) {
                    try {
                        const subscribers = libp2p.services.pubsub.getSubscribers(topic);
                        const memberCount = subscribers.length;

                        const groupObject = allGroups.filter(item => item.id === topic)

                        // Извлекаем название группы из топика
                        let groupName = topic;
                        if (topic.startsWith('chat-group-')) {
                            if(groupObject.length > 0) {
                                groupName = groupObject[0].name;
                            } else {
                                groupName = 'не должно быть проверь'
                            }
                        } else if (topic.startsWith('universe-chat-')) {
                            groupName = topic.replace('universe-chat-', '');
                        } else if (topic.startsWith('chat-groups-')) {
                            groupName = topic.replace('chat-groups-', '').split('-')[0];
                        }

                        // Гарантируем строку
                        groupName = normalizeGroupName(groupName);

                        // Получаем дополнительную информацию о группе
                        let groupInfo = {
                            id: topic,
                            name: groupName,
                            topic: topic,
                            memberCount: memberCount,
                            description: this.generateGroupDescription(groupName),
                            isPublic: true,
                            discoveryTime: Date.now()
                        };

                        discoveredGroups.push(groupInfo);
                    } catch (error) {
                        log.error('ошибка получения информации о группе %s: %o', topic, error);
                    }
                }

                // Обновляем состояние компонента
                context.state.discoveredGroups = discoveredGroups;

                // 🔥 Уведомляем chat-manager после обновления
                const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                if (chatManager) {
                    await chatManager.postMessage({
                        type: 'GROUPS_DISCOVERED',
                        data: { groups: discoveredGroups }
                    });
                }

                log('обнаружено групп: %d', discoveredGroups.length);

            } catch (error) {
                log.error('ошибка обнаружения групп: %o', error);
                context.addError({
                    componentName: 'GroupManager',
                    source: 'discoverGroups',
                    message: 'Ошибка обнаружения групп',
                    details: error
                });
            }
        },

        /**
         * Создание новой группы чата
         * @async
         * @param {string} groupName - Название группы
         * @param {Object} options - Дополнительные опции
         * @returns {Promise<Object>} Созданная группа
         */
        createGroup: async function(groupName, options = {}) {
            if (!libp2p) {
                throw new Error('Libp2p не инициализирован');
            }

            try {
                // Нормализуем имя
                const safeGroupName = normalizeGroupName(groupName);

                // Создаем уникальный топик для группы
                const topic = `chat-group-${this.sanitizeTopicName(safeGroupName)}-${Date.now()}`;

                const group = {
                    id: topic,
                    name: safeGroupName,
                    topic: topic,
                    memberCount: 1,
                    description: options.description || `Группа для общения: ${safeGroupName}`,
                    isPublic: options.isPublic !== false,
                    createdAt: Date.now(),
                    createdBy: libp2p.peerId.toString(),
                    tags: options.tags || ['general'],
                    language: options.language || 'ru'
                };

                log('создание группы с топиком: %s', topic);

                // Подписываемся на топик группы
                await libp2p.services.pubsub.subscribe(topic);

                // Публикуем информацию о создании группы
                await this.announceGroupCreation(group);

                // Добавляем группу в локальный список
                if (!context.state.groups) {
                    context.state.groups = [];
                }
                context.state.groups.push(group);

                log('создана группа: %s (%s)', safeGroupName, topic);

                return group;

            } catch (error) {
                log.error('ошибка создания группы: %o', error);
                context.addError({
                    componentName: 'GroupManager',
                    source: 'createGroup',
                    message: 'Ошибка создания группы',
                    details: error
                });
                throw error;
            }
        },

        /**
         * Анонсирование создания новой группы
         * @async
         * @param {Object} group - Информация о группе
         */
        announceGroupCreation: async function(group) {
            if (!libp2p) return;

            try {
                const announcement = {
                    type: 'GROUP_CREATED',
                    data: {
                        id: group.id,
                        name: group.name, // уже строка
                        topic: group.topic,
                        description: group.description,
                        memberCount: group.memberCount,
                        createdAt: group.createdAt,
                        createdBy: group.createdBy,
                        isPublic: group.isPublic,
                        tags: group.tags,
                        language: group.language
                    },
                    timestamp: Date.now(),
                    peerId: libp2p.peerId.toString()
                };

                // Публикуем анонс в служебный топик
                await libp2p.services.pubsub.publish(
                    GROUPS_ANNOUNCEMENT_TOPIC,
                    new TextEncoder().encode(JSON.stringify(announcement))
                );

                log('анонсирована созданная группа: %s', group.name);

            } catch (error) {
                log.error('ошибка анонсирования группы: %o', error);
                context.addError({
                    componentName: 'GroupManager',
                    source: 'announceGroupCreation',
                    message: 'Ошибка анонсирования группы',
                    details: error
                });
            }
        },

        /**
         * Присоединение к существующей группе
         * @async
         * @param {string} topic - Топик группы
         * @returns {Promise<Object>} Информация о группе
         */
        joinGroup: async function(topic) {
            if (!libp2p) {
                throw new Error('Libp2p не инициализирован');
            }

            try {
                // Подписываемся на топик группы
                await libp2p.services.pubsub.subscribe(topic);

                // Получаем информацию о группе
                const subscribers = libp2p.services.pubsub.getSubscribers(topic);
                const memberCount = subscribers.length;

                const allGroupts = (context.allGroups).all
                const topicObject = allGroupts.filter(item => item.id === topic)

                const group = {
                    id: topic,
                    name: topicObject[0].name,
                    topic: topic,
                    memberCount: memberCount,
                    description: `Присоединенная группа: ${parseChatGroupStringRegex(topic)}`,
                    joinedAt: Date.now(),
                    isPublic: true
                };

                // Гарантируем, что имя — строка
                group.name = normalizeGroupName(group.name);

                // Добавляем в список присоединенных групп
                if (!context.state.joinedGroups) {
                    context.state.joinedGroups = [];
                }

                if (!context.state.joinedGroups.find(g => {
                    if(g.id === topic) {
                        return true
                    }
                })) {
                    context.state.joinedGroups.push(group);
                }

                log('присоединились к группе: %s (%s)', group.name, topic);

                return group;

            } catch (error) {
                log.error('ошибка присоединения к группе: %o', error);
                context.addError({
                    componentName: 'GroupManager',
                    source: 'joinGroup',
                    message: 'Ошибка присоединения к группе',
                    details: error
                });
                throw error;
            }
        },

        /**
         * Выход из группы
         * @async
         * @param {string} topic - Топик группы
         */
        leaveGroup: async function(topic) {
            if (!libp2p) {
                throw new Error('Libp2p не инициализирован');
            }

            try {
                // Отписываемся от топика группы
                await libp2p.services.pubsub.unsubscribe(topic);

                // Удаляем из списка присоединенных групп
                if (context.state.joinedGroups) {
                    context.state.joinedGroups = context.state.joinedGroups.filter(g => g.id !== topic);
                }

                log('покинули группу: %s', topic);

            } catch (error) {
                log.error('ошибка выхода из группы: %o', error);
                context.addError({
                    componentName: 'GroupManager',
                    source: 'leaveGroup',
                    message: 'Ошибка выхода из группы',
                    details: error
                });
                throw error;
            }
        },

        /**
         * Поиск групп по названию или описанию
         * @async
         * @param {string} query - Поисковый запрос
         * @returns {Promise<Array>} Найденные группы
         */
        searchGroups: async function(query) {
            if (!query || !query.trim()) {
                return context.state.discoveredGroups || [];
            }

            const searchTerm = query.toLowerCase().trim();

            const filteredGroups = (context.state.discoveredGroups || []).filter(group =>
                group.name.toLowerCase().includes(searchTerm) ||
                (group.description && group.description.toLowerCase().includes(searchTerm)) ||
                group.topic.toLowerCase().includes(searchTerm) ||
                (group.tags && group.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );

            log('поиск \"%s\": найдено %d групп', query, filteredGroups.length);

            return filteredGroups;
        },

        /**
         * Получение списка участников группы
         * @async
         * @param {string} topic - Топик группы
         * @returns {Promise<Array>} Список участников
         */
        getGroupMembers: async function(topic) {
            if (!libp2p) {
                return [];
            }

            try {
                const subscribers = libp2p.services.pubsub.getSubscribers(topic);
                return subscribers.map(peerId => peerId.toString());
            } catch (error) {
                log.error('ошибка получения участников группы %s: %o', topic, error);
                return [];
            }
        },

        /**
         * Форматирование названия группы
         * @param {string} rawName - Сырое название
         * @returns {string} Отформатированное название
         */
        formatGroupName: function(rawName) {
            return rawName
                .replace(/[_-]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
                .trim();
        },

        /**
         * Генерация описания группы
         * @param {string} groupName - Название группы
         * @returns {string} Описание группы
         */
        generateGroupDescription: function(groupName) {
            const descriptions = [
                `Группа для обсуждения: ${groupName}`,
                `Сообщество по интересам: ${groupName}`,
                `Чат группы: ${groupName}`,
                `Обсуждение темы: ${groupName}`
            ];

            return descriptions[Math.floor(Math.random() * descriptions.length)];
        },

        /**
         * Санитизация названия для топика
         * @param {string} name - Исходное название
         * @returns {string} Санитизированное название
         */
        sanitizeTopicName: function(name) {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9а-яё]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        },

        /**
         * Очистка ресурсов
         * @async
         */
        cleanup: async function() {
            if (discoveredGroupsInterval) {
                clearInterval(discoveredGroupsInterval);
                discoveredGroupsInterval = null;
            }

            libp2p = null;
            log('ресурсы очищены');
        }
    };
}