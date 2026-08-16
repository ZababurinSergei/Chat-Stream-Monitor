import { logger } from '@libp2p/logger';

/**
 * Фабричная функция для создания действий компонента ChatInterface
 * @param {Object} context - Контекст компонента
 * @returns {Promise<Object>} Объект с методами действий
 */
export async function createActions(context) {
    const log = logger('chat-interface:actions');

    return {
        /**
         * Отправка сообщения в чат
         * @async
         * @param {string} message - Текст сообщения
         * @param {string} topic - Топик/группа для отправки
         */
        sendMessage: sendMessage.bind(context),

        /**
         * Обработка входящего сообщения
         * @async
         * @param {Object} messageData - Данные сообщения
         */
        handleIncomingMessage: handleIncomingMessage.bind(context),

        /**
         * Очистка истории сообщений
         * @async
         */
        clearChatHistory: clearChatHistory.bind(context),

        /**
         * Установка текущей группы/топика
         * @async
         * @param {Object} group - Данные группы
         */
        setActiveGroup: setActiveGroup.bind(context),

        /**
         * Поиск по сообщениям
         * @async
         * @param {string} query - Поисковый запрос
         */
        searchMessages: searchMessages.bind(context),

        /**
         * Установка активного пользователя для приватного чата
         * @async
         * @param {Object} member - Данные пользователя
         */
        setActiveMember: setActiveMember.bind(context),

        /**
         * Отправка приватного сообщения
         * @async
         * @param {string} message - Текст сообщения
         * @param {string} peerId - ID получателя
         */
        sendPrivateMessage: sendPrivateMessage.bind(context),

        /**
         * Обработка входящего приватного сообщения
         * @async
         * @param {Object} messageData - Данные сообщения
         */
        handleIncomingPrivateMessage: handleIncomingPrivateMessage.bind(context)
    };
}

/**
 * Логика отправки сообщения
 * @async
 * @param {string} message - Текст сообщения
 * @param {string} topic - Топик/группа для отправки
 * @this {HTMLElement} Контекст компонента
 */
async function sendMessage(message, topic) {
    const log = logger('chat-interface:actions:sendMessage');

    try {
        if (!message.trim()) {
            log.error('попытка отправки пустого сообщения');
            await this.showModal({
                title: 'Ошибка',
                content: '<p>Сообщение не может быть пустым</p>',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return;
        }

        if (!topic) {
            log.error('не выбрана группа для отправки');
            await this.showModal({
                title: 'Ошибка',
                content: '<p>Не выбрана группа для отправки</p>',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return;
        }

        // Отправляем через chat-manager
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        if (chatManager) {
            log('отправка сообщения в группу: %s', topic);
            await chatManager.postMessage({
                type: 'SEND_MESSAGE',
                data: { message, topic }
            });

            // Очищаем поле ввода после отправки
            const messageInput = this.shadowRoot.querySelector('#message-input');
            if (messageInput) {
                messageInput.value = '';
            }

            log('сообщение отправлено успешно');
        } else {
            log.error('чат менеджер не доступен');
            throw new Error('Чат менеджер не доступен');
        }
    } catch (error) {
        log.error('ошибка отправки сообщения: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'sendMessage',
            message: 'Ошибка отправки сообщения',
            details: error
        });

        await this.showModal({
            title: 'Ошибка отправки',
            content: `<p>Не удалось отправить сообщение: ${error.message}</p>`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Логика обработки входящего сообщения
 * @async
 * @param {Object} messageData - Данные сообщения
 * @param {string} messageData.text - Текст сообщения
 * @param {string} messageData.topic - Топик сообщения
 * @param {string} messageData.from - ID отправителя
 * @param {string} messageData.type - Тип сообщения ('received' | 'sent')
 * @param {number} messageData.timestamp - Временная метка
 * @this {HTMLElement} Контекст компонента
 */
async function handleIncomingMessage(messageData) {
    const log = logger('chat-interface:actions:handleIncomingMessage');

    try {
        // Проверяем, относится ли сообщение к текущей группе
        if (this.state.currentGroup && messageData.topic === this.state.currentGroup.topic) {
            log('обработка входящего сообщения для текущей группы: %s', messageData.topic);
            await this.addMessage({
                text: messageData.text,
                from: messageData.from,
                type: messageData.type || 'received',
                timestamp: messageData.timestamp || Date.now(),
                topic: messageData.topic
            });

            // Показываем уведомление, если окно не активно
            if (document.hidden) {
                const groupName = typeof this.state.currentGroup.name === 'string'
                    ? this.state.currentGroup.name
                    : 'Группа';
                this.showNotification(`Новое сообщение в ${groupName}`);
            }
        } else if (!this.state.currentGroup && messageData.type === 'received') {
            // Сообщение из группы, к которой не подключены в данный момент
            log('сообщение из неактивной группы %s: %s', messageData.topic, messageData.text);
        }
    } catch (error) {
        log.error('ошибка обработки входящего сообщения: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'handleIncomingMessage',
            message: 'Ошибка обработки входящего сообщения',
            details: { messageData, error }
        });
    }
}

/**
 * Логика очистки истории сообщений
 * @async
 * @this {HTMLElement} Контекст компонента
 */
async function clearChatHistory() {
    const log = logger('chat-interface:actions:clearChatHistory');

    try {
        log('запрос на очистку истории сообщений');
        await this.showModal({
            title: 'Подтверждение',
            content: '<p>Вы уверены, что хотите очистить историю сообщений?</p>',
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    action: () => log('очистка отменена пользователем')
                },
                {
                    text: 'Очистить',
                    type: 'primary',
                    action: async () => {
                        await this.clearMessages();
                        log('история сообщений очищена');
                    }
                }
            ]
        });
    } catch (error) {
        log.error('ошибка очистки истории: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'clearChatHistory',
            message: 'Ошибка очистки истории сообщений',
            details: error
        });
    }
}

/**
 * Устанавливает активную группу и подгружает её историю
 * @async
 * @param {Object} group - Данные группы
 * @this {HTMLElement} Контекст компонента
 */
async function setActiveGroup(group) {
    const log = logger('chat-interface:actions:setActiveGroup');

    try {
        if (!group || !group.topic) {
            log.error('неверные данные группы: %o', group);
            throw new Error('Неверные данные группы');
        }

        const safeName = typeof group.name === 'string' ? group.name : 'Безымянная группа';
        const safeGroup = { ...group, name: safeName };

        log('установка активной группы: %s (%s)', safeName, group.topic);

        // Сбрасываем приватный чат
        this.state.activeMember = null;
        this.state.isPrivateChat = false;

        // Показываем скелетон
        await this.showSkeleton({
            selector: '#messages-list',
            replace: true
        });

        // ✅ Получаем историю из chat-manager
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        let history = [];
        if (chatManager?.state?.topicHistories?.[group.topic]) {
            history = [...chatManager.state.topicHistories[group.topic]];
        }

        // Устанавливаем состояние
        this.state.currentGroup = safeGroup;
        this.state.messages = history;

        // Обновляем UI
        await this.updateChatHeader();
        await this.updateConnectionStatus(true);
        await this.hideSkeleton();

        // ✅ Рендерим историю
        await this.renderPart({
            partName: 'renderMessages',
            state: this.state,
            selector: '#messages-list'
        });

        // Автоскролл вниз
        const messagesContainer = this.shadowRoot.querySelector('#messages-list');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        log('переключение на группу завершено: %s (%s)', safeName, group.topic);

    } catch (error) {
        log.error('ошибка установки активной группы: %o', error);
        await this.hideSkeleton();

        this.addError({
            componentName: this.constructor.name,
            source: 'setActiveGroup',
            message: 'Ошибка установки активной группы',
            details: { group, error }
        });

        await this.showModal({
            title: 'Ошибка',
            content: `<p>Не удалось переключиться на группу: ${error.message}</p>`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Логика поиска по сообщениям
 * @async
 * @param {string} query - Поисковый запрос
 * @this {HTMLElement} Контекст компонента
 */
async function searchMessages(query) {
    const log = logger('chat-interface:actions:searchMessages');

    try {
        log('поиск сообщений: %s', query);

        if (!query.trim()) {
            // Если запрос пустой, показываем все сообщения
            log('пустой запрос - показ всех сообщений');
            await this.renderPart({
                partName: 'renderMessages',
                state: this.state,
                selector: '#messages-list'
            });
            return;
        }

        // Фильтруем сообщения по запросу
        const filteredMessages = this.state.messages.filter(message =>
            message.text.toLowerCase().includes(query.toLowerCase()) ||
            (message.from && message.from.toLowerCase().includes(query.toLowerCase()))
        );

        // Временно сохраняем оригинальные сообщения
        const originalMessages = [...this.state.messages];

        // Устанавливаем отфильтрованные сообщения
        this.state.messages = filteredMessages;

        // Рендерим отфильтрованный список
        await this.renderPart({
            partName: 'renderMessages',
            state: this.state,
            selector: '#messages-list'
        });

        // Восстанавливаем оригинальные сообщения
        this.state.messages = originalMessages;

        // Показываем количество найденных результатов
        const resultsCount = filteredMessages.length;
        log('найдено сообщений: %d', resultsCount);

        await this.showModal({
            title: 'Результаты поиска',
            content: `<p>Найдено сообщений: ${resultsCount}</p>`,
            buttons: [{ text: 'OK', type: 'primary' }],
            closeOnBackdropClick: true
        });

    } catch (error) {
        log.error('ошибка поиска сообщений: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'searchMessages',
            message: 'Ошибка поиска по сообщениям',
            details: { query, error }
        });
    }
}

/**
 * Установка активного пользователя для приватного чата
 * @async
 * @param {Object} member - Данные пользователя
 * @this {HTMLElement} Контекст компонента
 */
async function setActiveMember(member) {
    const log = logger('chat-interface:actions:setActiveMember');

    debugger
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
        this.state.currentGroup = null;
        this.state.isPrivateChat = true;

        // Обновляем UI списка участников
        await this.updateMembersList();

        // Обновляем заголовок чата
        await this.updateChatHeader();

        // ✅ Уведомляем chat-manager об активации приватного чата
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        if (chatManager) {
            const history = chatManager?.state.privateHistories[member.id] || [];
            this.state.messages = [...history];

            await chatManager.postMessage({
                type: 'UPDATE_CHAT_HEADER',
                data: {
                    isPrivateChat: true,
                    activeMember: memberWithName
                }
            });
        }

        // Рендерим пустой чат
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

/**
 * Отправка приватного сообщения
 * @async
 * @param {string} message - Текст сообщения
 * @param {string} peerId - ID получателя
 * @this {HTMLElement} Контекст компонента
 */
async function sendPrivateMessage(message, peerId) {
    const log = logger('chat-interface:actions:sendPrivateMessage');

    try {
        if (!message.trim()) {
            log.error('попытка отправки пустого сообщения');
            await this.showModal({
                title: 'Ошибка',
                content: '<p>Сообщение не может быть пустым</p>',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return;
        }

        if (!peerId) {
            log.error('не указан получатель');
            await this.showModal({
                title: 'Ошибка',
                content: '<p>Не указан получатель сообщения</p>',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return;
        }

        // Отправляем через chat-manager
        const chatManager = await this.getComponentAsync('chat-manager', 'chat-manager');
        if (chatManager) {
            log('отправка приватного сообщения пользователю: %s', peerId);
            await chatManager.postMessage({
                type: 'SEND_PRIVATE_MESSAGE',
                data: { peerId, message }
            });

            // Добавляем сообщение в локальную историю как отправленное
            await this.addMessage({
                text: message,
                from: this.state.peerId,
                to: peerId,
                type: 'sent',
                timestamp: Date.now(),
                isPrivate: true
            });

            // Очищаем поле ввода
            const messageInput = this.shadowRoot.querySelector('#message-input');
            if (messageInput) {
                messageInput.value = '';
            }

            log('приватное сообщение отправлено');
        } else {
            log.error('chat-manager не доступен для отправки приватных сообщений');
            throw new Error('Чат менеджер не доступен');
        }

    } catch (error) {
        log.error('ошибка отправки приватного сообщения: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'sendPrivateMessage',
            message: 'Ошибка отправки приватного сообщения',
            details: { peerId, message, error }
        });

        await this.showModal({
            title: 'Ошибка отправки',
            content: `<p>Не удалось отправить приватное сообщение: ${error.message}</p>`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Обработка входящего приватного сообщения
 * @async
 * @param {Object} messageData - Данные сообщения
 * @this {HTMLElement} Контекст компонента
 */
async function handleIncomingPrivateMessage(messageData) {
    const log = logger('chat-interface:actions:handleIncomingPrivateMessage');

    try {
        // Проверяем, относится ли сообщение к текущему активному приватному чату
        const isForActiveChat = this.state.isPrivateChat &&
            this.state.activeMember &&
            messageData.from === this.state.activeMember.id;

        // Или если это новое сообщение и у нас нет активного чата
        const shouldActivateChat = !this.state.isPrivateChat &&
            messageData.isPrivate;

        if (isForActiveChat || shouldActivateChat) {
            log('обработка входящего приватного сообщения от: %s', messageData.from);

            // Если это новое сообщение, активируем чат с отправителем
            if (shouldActivateChat) {
                const senderMember = this.state.connectedPeers.find(p => p.id === messageData.from);
                if (senderMember) {
                    await this.setActiveMember(senderMember);
                }
            }

            // Добавляем сообщение в историю
            await this.addMessage({
                text: messageData.text,
                from: messageData.from,
                to: this.state.peerId,
                type: 'received',
                timestamp: messageData.timestamp || Date.now(),
                isPrivate: true
            });

            // Показываем уведомление если окно не активно
            if (document.hidden && this.state.activeMember) {
                const senderName = this.state.activeMember.name || 'Пользователь';
                this.showNotification(`Приватное сообщение от ${senderName}`);
            }
        } else if (messageData.isPrivate) {
            // Сообщение не для активного чата - просто логируем
            log('приватное сообщение от %s не для активного чата', messageData.from);
        }

    } catch (error) {
        log.error('ошибка обработки входящего приватного сообщения: %o', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'handleIncomingPrivateMessage',
            message: 'Ошибка обработки приватного сообщения',
            details: { messageData, error }
        });
    }
}

/**
 * Показывает браузерное уведомление
 * @param {string} message - Текст уведомления
 * @this {HTMLElement} Контекст компонента
 */
function showNotification(message) {
    const log = logger('chat-interface:actions:showNotification');

    if ('Notification' in window && Notification.permission === 'granted') {
        log('показ уведомления: %s', message);
        new Notification('Чат', {
            body: message,
            icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        log('запрос разрешения на уведомления');
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