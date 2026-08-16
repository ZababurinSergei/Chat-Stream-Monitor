import { logger } from '@libp2p/logger';
import { insertRemoteControl } from '../../utils/index.mjs'
import {app} from "../../../index.mjs";
/**
 * Контроллер для компонента ChatInterface
 * @param {HTMLElement} context - Ссылка на экземпляр компонента
 * @returns {Object} Объект с методами init и destroy
 */
export const controller = async (context) => {
    const log = logger('chat-interface:controller');
    let eventListeners = [];
    let mentionMenu = null;

    return {
        /**
         * Инициализирует контроллер компонента ChatInterface
         * @async
         */
        async init() {
            log('controller initializing');

            // Обработчик отправки сообщения
            const sendMessageBtn = context.shadowRoot.querySelector('#send-message');
            let messageInput = context.shadowRoot.querySelector('#message-input');
            let messageSettings = context.shadowRoot.querySelector('#settings');

            if (messageSettings) {
                const sendMessageHandler = async (event) => {
                    const container = document.body.querySelector('.container');
                    const component = container.querySelector('#peer-connection')

                    if (component?.getAttribute?.('disabled') === 'false') {
                        if(component) {
                            component.removeAttribute('disabled')
                        } else {
                            console.error('Не может быть')
                        }
                    } else {
                        if(component) {
                            component.setAttribute('disabled', 'false')
                        } else {
                            const template = await app
                            console.log('ddddddddddddddddddddddddddd', template)
                            template.components["peer-connection"].id["peer-connection"].setAttribute('disabled', 'false')
                            container.appendChild(template.components["peer-connection"].id["peer-connection"]);
                        }
                    }
                };

                messageSettings.addEventListener('click', sendMessageHandler);
                eventListeners.push({ element: messageSettings, handler: sendMessageHandler });
            }

            if (sendMessageBtn && messageInput) {
                const sendMessageHandler = async () => {
                    if (messageInput.value.trim() && context.state.currentGroup) {
                        const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                        if (chatManager) {
                            log('отправка сообщения через контроллер');
                            await chatManager.postMessage({
                                type: 'SEND_MESSAGE',
                                data: {
                                    message: messageInput.value.trim(),
                                    topic: context.state.currentGroup.topic
                                }
                            });
                            messageInput.value = '';
                        }
                    }
                };

                sendMessageBtn.addEventListener('click', sendMessageHandler);
                eventListeners.push({ element: sendMessageBtn, handler: sendMessageHandler });

                // Обработчик отправки по Enter
                const enterHandler = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessageHandler();
                    }
                };

                messageInput.addEventListener('keypress', enterHandler);
                eventListeners.push({ element: messageInput, handler: enterHandler });
            }

            // Внутри controller → init()
            const setupScreenShareHandlers = () => {
                const screenShareButtons = context.shadowRoot.querySelectorAll('.screen-share-btn');
                screenShareButtons.forEach(button => {
                    const handler = async (e) => {
                        e.stopPropagation();
                        const peerId = button.closest('.member-item')?.dataset.peerId;
                        if (!peerId) return;

                        try {
                            // 1. Отправляем команду через chat-manager
                            const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                            if (!chatManager) {
                                throw new Error('chat-manager не найден');
                            }

                            // 2. Отправляем событие REMOTE_CONTROL_REQUEST
                            // await chatManager.postMessage({
                            //     type: 'REMOTE_CONTROL_REQUEST',
                            //     data: {
                            //         targetPeer: peerId,
                            //         initiator: context.state.peerId,
                            //         timestamp: Date.now()
                            //     }
                            // });

                            console.log('-------------- click button ------------------', {
                                type: 'SEND_PRIVATE_MESSAGE',
                                data: {
                                    peerId: peerId,
                                    message: JSON.stringify({
                                        type: 'REMOTE_CONTROL_REQUEST',
                                        payload: {
                                            targetPeer: peerId, // ← тот, кого хотим контролировать
                                            initiator: context.state.peerId,
                                            timestamp: Date.now()
                                        }
                                    })
                                }
                            })

                            // Отправляем приватное сообщение напрямую через chat-manager
                            await chatManager.postMessage({
                                type: 'SEND_PRIVATE_MESSAGE',
                                data: {
                                    peerId: peerId,
                                    message: JSON.stringify({
                                        type: 'REMOTE_CONTROL_REQUEST',
                                        payload: {
                                            targetPeer: peerId, // ← тот, кого хотим контролировать
                                            initiator: context.state.peerId,
                                            timestamp: Date.now()
                                        }
                                    })
                                }
                            });

                            // 3. Локально вставляем remote-control в режиме controller
                            // await insertRemoteControl(context, peerId, 'controller');

                        } catch (error) {
                            console.error('Ошибка запуска удалённого управления:', error);
                            await context.showModal({
                                title: 'Ошибка',
                                content: `<p>Не удалось начать сессию удалённого управления: ${error.message}</p>`,
                                buttons: [{ text: 'OK', type: 'primary' }]
                            });
                        }
                    };
                    button.addEventListener('click', handler);
                    eventListeners.push({ element: button, handler });
                });
            };

            setupScreenShareHandlers();

            // Обработчик очистки чата
            const clearChatBtn = context.shadowRoot.querySelector('#clear-chat');
            if (clearChatBtn) {
                const clearChatHandler = async () => {
                    log('очистка чата через контроллер');
                    await context.clearMessages();
                };

                clearChatBtn.addEventListener('click', clearChatHandler);
                eventListeners.push({ element: clearChatBtn, handler: clearChatHandler });
            }

            // Обработчик копирования ID чата
            const copyChatIdBtn = context.shadowRoot.querySelector('#copy-chat-id');
            if (copyChatIdBtn) {
                const copyChatIdHandler = async () => {
                    if (context.state.currentGroup) {
                        try {
                            await navigator.clipboard.writeText(context.state.currentGroup.topic);
                            const originalText = copyChatIdBtn.textContent;
                            copyChatIdBtn.textContent = 'Скопировано!';
                            setTimeout(() => {
                                copyChatIdBtn.textContent = originalText;
                            }, 2000);
                            log('ID чата скопирован: %s', context.state.currentGroup.topic);
                        } catch (err) {
                            log.error('ошибка копирования ID чата: %o', err);
                        }
                    }
                };

                copyChatIdBtn.addEventListener('click', copyChatIdHandler);
                eventListeners.push({ element: copyChatIdBtn, handler: copyChatIdHandler });
            }

            // Обработчик переключения видимости участников
            const toggleMembersBtn = context.shadowRoot.querySelector('#toggle-members');
            if (toggleMembersBtn) {
                const toggleMembersHandler = () => {
                    const membersPanel = context.shadowRoot.querySelector('#members-panel');
                    if (membersPanel) {
                        const isVisible = membersPanel.style.display !== 'none';
                        membersPanel.style.display = isVisible ? 'none' : 'block';
                        toggleMembersBtn.textContent = isVisible ? 'Скрыть участников' : 'Показать участников';
                        log('видимость панели участников изменена: %s', isVisible ? 'скрыта' : 'показана');
                    }
                };

                toggleMembersBtn.addEventListener('click', toggleMembersHandler);
                eventListeners.push({ element: toggleMembersBtn, handler: toggleMembersHandler });
            }

            // Обработчики для кнопок присоединения к группам
            const setupGroupActionHandlers = () => {
                // Обработчики для кнопок присоединения к группам
                const joinButtons = context.shadowRoot.querySelectorAll('.join-group-btn');
                joinButtons.forEach(button => {
                    const handler = async (e) => {
                        const groupId = e.target.dataset.groupId || e.target.closest('.join-group-btn')?.dataset.groupId;
                        const groupTopic = e.target.dataset.topic || e.target.closest('.join-group-btn')?.dataset.topic;

                        if (groupId || groupTopic) {
                            const topic = groupTopic || groupId;
                            const group = context.state.discoveredGroups?.find(g => g.id === topic) ||
                                context.state.groups?.find(g => g.id === topic);

                            if (group) {
                                try {
                                    await context.joinGroup(group);
                                    log('Successfully joined group: %s', group.name);
                                } catch (error) {
                                    log.error('Error joining group: %o', error);
                                    await context.showModal({
                                        title: 'Ошибка',
                                        content: `<p>Не удалось присоединиться к группе: ${error.message}</p>`,
                                        buttons: [{ text: 'OK', type: 'primary' }]
                                    });
                                }
                            }
                        }
                    };

                    button.addEventListener('click', handler);
                    eventListeners.push({ element: button, handler: handler });
                });

                // Обработчики для кнопок выхода из групп
                const leaveButtons = context.shadowRoot.querySelectorAll('.leave-group-btn');
                leaveButtons.forEach(button => {
                    const handler = async (e) => {
                        const groupId = e.target.dataset.groupId || e.target.closest('.leave-group-btn')?.dataset.groupId;
                        if (groupId) {
                            try {
                                await context.leaveGroup(groupId);
                                log('Successfully left group: %s', groupId);
                            } catch (error) {
                                log.error('Error leaving group: %o', error);
                                await context.showModal({
                                    title: 'Ошибка',
                                    content: `<p>Не удалось покинуть группу: ${error.message}</p>`,
                                    buttons: [{ text: 'OK', type: 'primary' }]
                                });
                            }
                        }
                    };
                    button.addEventListener('click', handler);
                    eventListeners.push({ element: button, handler: handler });
                });
            };


            const handlerSetupMemberClick =  async (e) => {
                // Предотвращаем срабатывание на кнопках действий
                if (e.target.closest('.member-actions')) {
                    return;
                }

                const peerId = e.currentTarget.dataset.peerId;
                const groupTopic = e.currentTarget.dataset.groupTopic;

                // const peerId = e.currentTarget.getAttribute('data-peer-id');
                // const groupTopic = e.currentTarget.getAttribute('data-group-topic');
                try {
                    // Обработка приватного чата с пиром
                    if (peerId) {
                        const member = context.state.connectedPeers.find(p => p.id === peerId);
                        if (member && !member.isCurrentUser) {
                            log('выбор пользователя для приватного чата: %s', member.name || member.id);
                            await context.setActiveMember(member);
                        }
                        return;
                    }

                    // Обработка выбора группы
                    if (groupTopic) {
                        const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                        const allGroups = (groupManager.allGroups).all
                        // Ищем группу по топику в активных группах
                        const group = allGroups.find(g => g.topic === groupTopic)

                            // context.state.activeGroups?.find(g => g.topic === groupTopic) ||
                            // context.state.groups?.find(g => g.topic === groupTopic) ||
                            // context.state.discoveredGroups?.find(g => g.topic === groupTopic);

                        if(group) {
                            const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                            log('выбор группы для чата: %s', group.name || groupTopic);
                            chatManager.callback.handlersSetupGroup({
                                currentTarget: {
                                    closest: () => {
                                        return false
                                    },
                                    getAttribute: (type) => {
                                        switch (type) {
                                            case 'data-group-id':
                                                return group.id
                                            case 'data-group-topic':
                                                return group.topic

                                        }
                                    }
                                },
                                target: {
                                    closest: () => {
                                        return false
                                    }
                                }
                            })
                            // await context.setActiveGroup(group);
                        } else {
                            log.error('группа не найдена по топику: %s', groupTopic);
                        }
                        return;
                    }

                    log.error('элемент не содержит ни data-peer-id, ни data-group-topic');
                } catch (error) {
                    log.error('ошибка при выборе элемента: %o', error);
                }
            };
            // Обработчики кликов на участников для приватного чата
            const setupMemberClickHandlers = () => {
                const memberItems = context.shadowRoot.querySelectorAll('.member-item');

                memberItems.forEach(item => {
                    item.addEventListener('click', handlerSetupMemberClick);
                    eventListeners.push({ element: item, handler: handlerSetupMemberClick });
                });
            };

            // === НОВОЕ: обработчик клика по сообщению для активации топика ===
            const messagesList = context.shadowRoot.querySelector('#messages-list');
            if (messagesList) {
                const messageClickHandler = async (e) => {
                    const messageEl = e.target.closest('.message-item');
                    if (messageEl) {
                        const topic = messageEl.dataset.topic;
                        if (topic && !context.state.isPrivateChat) {
                            const group = context.state.discoveredGroups?.find(g => g.topic === topic) ||
                                context.state.groups?.find(g => g.topic === topic);

                            if (group) {
                                await context.setActiveGroup(group);
                            }
                        }
                    }
                };
                messagesList.addEventListener('click', messageClickHandler);
                eventListeners.push({ element: messagesList, handler: messageClickHandler });
            }

            // === НОВОЕ: обработчик ввода @ для показа участников ===
            const messageInputField = context.shadowRoot.querySelector('#message-input');
            if (messageInputField) {
                const inputHandler = (e) => {
                    const cursorPos = e.target.selectionStart;
                    const text = e.target.value.substring(0, cursorPos);
                    const lastAt = text.lastIndexOf('@');

                    if (lastAt === -1 || lastAt < text.lastIndexOf(' ')) {
                        hideMentionMenu();
                        return;
                    }

                    const query = text.substring(lastAt + 1).trim();
                    showMentionMenu(query, cursorPos, messageInputField);
                };

                messageInputField.addEventListener('input', inputHandler);
                eventListeners.push({ element: messageInputField, handler: inputHandler });
            }

            // Скрытие меню упоминаний при клике вне его
            const globalClickHandler = (e) => {
                if (!e.target.closest('#mention-menu') && !e.target.closest('#message-input')) {
                    hideMentionMenu();
                }
            };
            document.addEventListener('click', globalClickHandler);
            eventListeners.push({ element: document, handler: globalClickHandler });

            // Функция показа меню упоминаний
            function showMentionMenu(query, cursorPos, inputEl) {
                const rect = inputEl.getBoundingClientRect();
                const members = context.getGroupMembers().filter(m =>
                    m.name.toLowerCase().includes(query.toLowerCase())
                );

                if (members.length === 0) {
                    hideMentionMenu();
                    return;
                }

                mentionMenu = document.createElement('div');
                mentionMenu.id = 'mention-menu';
                mentionMenu.style.cssText = `
                    position: absolute;
                    top: ${rect.bottom + window.scrollY}px;
                    left: ${rect.left + window.scrollX}px;
                    background: #1e293b;
                    border: 1px solid #4b5563;
                    border-radius: 8px;
                    z-index: 1000;
                    max-height: 200px;
                    overflow-y: auto;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;

                mentionMenu.innerHTML = members.map(m => `
                    <div data-peer-id="${m.id}" style="
                        padding: 8px 12px;
                        cursor: pointer;
                    " onmouseenter="this.style.backgroundColor='#334155'" 
                    onmouseleave="this.style.backgroundColor='transparent'">
                        ${m.name}
                    </div>
                `).join('');

                document.body.appendChild(mentionMenu);

                mentionMenu.querySelectorAll('div').forEach(item => {
                    item.addEventListener('click', () => {
                        const name = item.textContent;
                        const currentValue = inputEl.value;
                        const newValue = currentValue.substring(0, cursorPos - query.length - 1) + name + ' ';
                        inputEl.value = newValue;
                        hideMentionMenu();
                        inputEl.focus();
                    });
                });
            }

            function hideMentionMenu() {
                if (mentionMenu) {
                    mentionMenu.remove();
                    mentionMenu = null;
                }
            }

            // Наблюдатель за изменениями DOM для динамических кнопок
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        setupGroupActionHandlers();
                        setupMemberClickHandlers();
                    }
                });
            });

            // Начинаем наблюдение за изменениями в shadowRoot
            observer.observe(context.shadowRoot, {
                childList: true,
                subtree: true
            });

            // Сохраняем observer для очистки
            context._groupObserver = observer;

            // Инициализация обработчиков при первом рендере
            setupGroupActionHandlers();
            setupMemberClickHandlers();

            // Обработчик для кнопки отправки сообщения #send-button
            const setupSendButtonHandler = () => {
                const sendButton = context.shadowRoot.querySelector('#send-button');
                const messageInput = context.shadowRoot.querySelector('#message-input');
                if (sendButton && messageInput) {
                    const sendHandler = async () => {
                        const message = messageInput.value.trim();
                        if (message && context.state.connected) {
                            try {
                                if (context.state.isPrivateChat && context.state.activeMember) {
                                    // Отправка приватного сообщения
                                    await context._actions.sendPrivateMessage(
                                        message,
                                        context.state.activeMember.id
                                    );
                                } else if (context.state.currentGroup) {
                                    // Отправка в группу
                                    await context._actions.sendMessage(
                                        message,
                                        context.state.currentGroup.topic
                                    );
                                }

                                // Очистка поля ввода после отправки
                                messageInput.value = '';

                            } catch (error) {
                                log.error('Ошибка отправки сообщения: %o', error);
                                await context.showModal({
                                    title: 'Ошибка отправки',
                                    content: `<p>Не удалось отправить сообщение: ${error.message}</p>`,
                                    buttons: [{ text: 'OK', type: 'primary' }]
                                });
                            }
                        }
                    };

                    // Обработчик клика по кнопке
                    sendButton.addEventListener('click', sendHandler);
                    eventListeners.push({ element: sendButton, handler: sendHandler });

                    // Обработчик Enter в поле ввода
                    const enterHandler = (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendHandler();
                        }
                    };

                    messageInput.addEventListener('keypress', enterHandler);
                    eventListeners.push({ element: messageInput, handler: enterHandler });

                    log('Обработчики для кнопки отправки установлены');
                } else {
                    log('Элементы #send-button или #message-input не найдены');
                }
            };

            // Инициализация обработчика кнопки отправки
            setupSendButtonHandler();

            log('контроллер инициализирован');
            log('Total event listeners: %d', eventListeners.length);

            // Отладочная информация о найденных элементах
            const memberItems = context.shadowRoot.querySelectorAll('.member-item');
            log('найдено элементов .member-item: %d', memberItems.length);

            messageInput = context.shadowRoot.querySelector('#message-input');
            log('поле ввода сообщения найдено: %s', !!messageInput);

            const sendButton = context.shadowRoot.querySelector('#send-button');
            log('кнопка отправки #send-button найдена: %s', !!sendButton);
        },

        /**
         * Уничтожает контроллер и очищает ресурсы
         * @async
         */
        async destroy() {
            // Очистка всех обработчиков событий
            eventListeners.forEach(({ element, handler }) => {
                if (element === document) {
                    element.removeEventListener('click', handler);
                } else {
                    element.removeEventListener('click', handler);
                    element.removeEventListener('keypress', handler);
                    element.removeEventListener('input', handler);
                }
            });

            log('контроллер уничтожен, удалено обработчиков: %d', eventListeners.length);
            eventListeners = [];
        }
    };
};