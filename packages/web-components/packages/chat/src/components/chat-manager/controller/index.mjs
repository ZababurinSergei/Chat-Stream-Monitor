/**
 * Контроллер для компонента ChatManager
 * @param {HTMLElement} context - Ссылка на экземпляр компонента
 * @returns {Object} Объект с методами init и destroy
 */
import { logger } from '@libp2p/logger';

const log = logger('chat-manager:controller');

export const controller = async (context) => {
    let eventListeners = [];

    return {
        /**
         * Инициализирует контроллер компонента ChatManager
         * @async
         */
        async init() {
            log('ChatManager controller initializing...');

            // Обработчики для переключения режимов
            const listenerBtn = context.shadowRoot.querySelector('#listener-mode');
            const dialerBtn = context.shadowRoot.querySelector('#dialer-mode');

            if (listenerBtn) {
                const listenerHandler = () => context.switchMode('listener');
                listenerBtn.addEventListener('click', listenerHandler);
                eventListeners.push({ element: listenerBtn, handler: listenerHandler });
            }

            if (dialerBtn) {
                const dialerHandler = () => context.switchMode('dialer');
                dialerBtn.addEventListener('click', dialerHandler);
                eventListeners.push({ element: dialerBtn, handler: dialerHandler });
            }

            // Обработчик создания группы
            // const createGroupBtn = context.shadowRoot.querySelector('#create-group');
            // if (createGroupBtn) {
            //     const createGroupHandler = async () => {
            //         console.log('###########')
            //         debugger
            //         const groupNameInput = context.shadowRoot.querySelector('#group-name');
            //         if (groupNameInput && groupNameInput.value.trim()) {
            //             await context.createGroup(groupNameInput.value.trim());
            //             groupNameInput.value = '';
            //         } else {
            //             // Показать модальное окно для ввода имени
            //             await context.showModal({
            //                 title: 'Создание группы',
            //                 content: '<input type="text" id="quick-group-name" placeholder="Название группы..." style="width:100%; padding:0.5rem;">',
            //                 buttons: [
            //                     { text: 'Отмена', type: 'secondary' },
            //                     {
            //                         text: 'Создать',
            //                         type: 'primary',
            //                         action: async () => {
            //                             const input = document.getElementById('quick-group-name');
            //                             if (input?.value.trim()) {
            //                                 await context.createGroup(input.value.trim());
            //                             }
            //                         }
            //                     }
            //                 ]
            //             });
            //         }
            //     };
            //     createGroupBtn.addEventListener('click', createGroupHandler);
            //     eventListeners.push({ element: createGroupBtn, handler: createGroupHandler });
            // }

            // Обработчик поиска групп
            const searchInput = context.shadowRoot.querySelector('#group-search');
            if (searchInput) {
                const searchHandler = (e) => {
                    context.searchGroups(e.target.value);
                };
                searchInput.addEventListener('input', searchHandler);
                eventListeners.push({ element: searchInput, handler: searchHandler });
            }

            // Обработчик отправки сообщения
            const setupSendMessageHandler = () => {
                const sendButton = context.shadowRoot.querySelector('#send-button');
                const messageInput = context.shadowRoot.querySelector('#message-input');

                if (sendButton && messageInput) {
                    const sendHandler = async () => {
                        const message = messageInput.value.trim();
                        if (message && context.state.currentGroup) {
                            try {
                                console.log('sendHandler -> sendGroupMessage')
                                await context.sendGroupMessage(message);
                                messageInput.value = '';
                                log('Сообщение отправлено через контроллер');
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

                    log('Обработчики отправки сообщения установлены');
                } else {
                    log('Элементы отправки сообщения не найдены');
                }
            };

            // Обработчики для присоединения к группам
            const joinGroupHandler = async (event) => {
                const groupElement = event.target.closest('[data-group-topic]');
                if (groupElement) {
                    const topic = groupElement.getAttribute('data-group-topic');
                    await context.joinGroup(topic);
                }
            };

            const groupsContainer = context.shadowRoot.querySelector('#groups-container');
            if (groupsContainer) {
                groupsContainer.addEventListener('click', joinGroupHandler);
                eventListeners.push({ element: groupsContainer, handler: joinGroupHandler });
            }

            // Обработчик очистки сообщений
            const clearMessagesBtn = context.shadowRoot.querySelector('#clear-messages');
            if (clearMessagesBtn) {
                const clearHandler = async () => {
                    context.state.messages = [];
                    await context.renderPart({
                        partName: 'renderMessages',
                        state: context.state,
                        selector: '#messages-container'
                    });
                };
                clearMessagesBtn.addEventListener('click', clearHandler);
                eventListeners.push({ element: clearMessagesBtn, handler: clearHandler });
            }

            // Обработчик обнаружения групп
            const discoverGroupsBtn = context.shadowRoot.querySelector('#discover-groups-btn');
            if (discoverGroupsBtn) {
                const discoverHandler = async () => {
                    try {
                        log('ChatManager: поиск групп...');

                        // Получаем GroupManager и запускаем поиск
                        const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                        if (groupManager && groupManager.discoverGroups) {
                            await groupManager.discoverGroups();

                            // Показываем уведомление
                            await context.showModal({
                                title: 'Поиск групп',
                                content: '<p>Поиск групп запущен. Результаты появятся в списке обнаруженных групп.</p>',
                                buttons: [{ text: 'OK', type: 'primary' }],
                                closeOnBackdropClick: true
                            });
                        } else {
                            throw new Error('GroupManager не доступен');
                        }
                    } catch (error) {
                        log.error('Ошибка поиска групп в ChatManager: %o', error);
                        await context.showModal({
                            title: 'Ошибка',
                            content: `<p>Не удалось запустить поиск групп: ${error.message}</p>`,
                            buttons: [{ text: 'OK', type: 'primary' }]
                        });
                    }
                };

                discoverGroupsBtn.addEventListener('click', discoverHandler);
                eventListeners.push({ element: discoverGroupsBtn, handler: discoverHandler });
            }

            // === Обработчики для кнопок в секции "Быстрые действия" ===

            // Создать группу
            const quickCreateGroupBtn = context.shadowRoot.querySelector('#create-group');
            if (quickCreateGroupBtn) {
                const handler = async () => {
                    const groupNameInput = context.shadowRoot.querySelector('#group-name');
                    if (groupNameInput && groupNameInput.value.trim()) {
                        await context.createGroup(groupNameInput.value.trim());
                        groupNameInput.value = '';
                    } else {
                        // Показать модальное окно для ввода имени, как в group-manager
                        await context.showModal({
                            title: 'Создание группы',
                            content: '<input type="text" id="quick-group-name" placeholder="Название группы..." style="width:100%; padding:0.5rem;">',
                            buttons: [
                                { text: 'Отмена', type: 'secondary' },
                                {
                                    text: 'Создать',
                                    type: 'primary',
                                    action: async () => {
                                        const input = document.getElementById('quick-group-name');
                                        if (input?.value.trim()) {
                                            await context.createGroup(input.value.trim());
                                        }
                                    }
                                }
                            ]
                        });
                    }
                };
                quickCreateGroupBtn.addEventListener('click', handler);
                eventListeners.push({ element: quickCreateGroupBtn, handler: handler });
            }

            // Обнаружить группы
            const quickDiscoverBtn = context.shadowRoot.querySelector('#discover-groups');
            if (quickDiscoverBtn) {
                const handler = async () => {
                    try {
                        const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                        if (groupManager && groupManager.discoverGroups) {
                            await groupManager.discoverGroups();
                            await context.showModal({
                                title: 'Поиск групп',
                                content: '<p>Поиск запущен. Результаты появятся в списке обнаруженных групп.</p>',
                                buttons: [{ text: 'OK', type: 'primary' }]
                            });
                        }
                    } catch (error) {
                        log.error('Ошибка поиска групп: %o', error);
                        await context.showModal({
                            title: 'Ошибка',
                            content: `<p>${error.message}</p>`,
                            buttons: [{ text: 'OK', type: 'primary' }]
                        });
                    }
                };
                quickDiscoverBtn.addEventListener('click', handler);
                eventListeners.push({ element: quickDiscoverBtn, handler: handler });
            }

            // Копировать Peer ID
            const copyPeerIdBtn = context.shadowRoot.querySelector('#copy-peer-id');
            if (copyPeerIdBtn) {
                const handler = async () => {
                    if (context.state.peerId) {
                        try {
                            await navigator.clipboard.writeText(context.state.peerId);
                            const original = copyPeerIdBtn.textContent;
                            copyPeerIdBtn.textContent = 'Скопировано!';
                            setTimeout(() => copyPeerIdBtn.textContent = original, 2000);
                        } catch (err) {
                            log.error('Не удалось скопировать Peer ID: %o', err);
                        }
                    }
                };
                copyPeerIdBtn.addEventListener('click', handler);
                eventListeners.push({ element: copyPeerIdBtn, handler: handler });
            }

            // Перезапуск ноды
            const restartNodeBtn = context.shadowRoot.querySelector('#restart-node');
            if (restartNodeBtn) {
                const handler = async () => {
                    const peerConnection = await context.getComponentAsync('peer-connection', 'peer-connection');
                    if (peerConnection && peerConnection.switchMode) {
                        await peerConnection.switchMode(context.state.mode);
                        await context.showModal({
                            title: 'Перезапуск',
                            content: '<p>Нода перезапущена в текущем режиме.</p>',
                            buttons: [{ text: 'OK', type: 'primary' }]
                        });
                    }
                };
                restartNodeBtn.addEventListener('click', handler);
                eventListeners.push({ element: restartNodeBtn, handler: handler });
            }

            // Обработчик обновления участников группы
            const refreshMembersBtn = context.shadowRoot.querySelector('#refresh-group-members');
            if (refreshMembersBtn) {
                const handler = async () => {
                    await context.refreshGroupMembers();
                };
                refreshMembersBtn.addEventListener('click', handler);
                eventListeners.push({ element: refreshMembersBtn, handler });
            }

            /**
             * Активирует выбранную группу с проверкой подписки и подгрузкой истории
             * @param {Object} group - Объект группы с полями id, name, topic
             * @async
             */
            const activateGroup = async function activateGroup(group) {
                if (!group || !group.topic) {
                    log.error('Неверные данные группы:', group);
                    return;
                }

                // Проверяем, подписан ли пользователь на топик
                const isSubscribed = context.node?.services?.pubsub?.getTopics()?.includes(group.topic);

                console.log('@@@@@@@@ isSubscribed @@@@@@@@@@', isSubscribed)
                if (isSubscribed) {
                    try {
                        // Обновляем список групп (опционально)
                        context.state.groups = await context._actions.discoverGroups();
                        context.state.currentGroup = group;


                        let history = [];
                        if (context?.state?.topicHistories?.[group.topic]) {
                            history = [...context.state.topicHistories[group.topic]];
                        }

                        context.state.messages = history;

                        // Рендерим заголовок и список групп
                        await context.renderPart({
                            partName: 'renderMyGroups',
                            state: context.state,
                            selector: '#my-groups-container'
                        });

                        await context.renderPart({
                            partName: 'renderActiveChatHeader',
                            state: context.state,
                            selector: '.chat-header'
                        });
                        //
                        // // Получаем актуальные активные группы из group-manager
                        const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                        await groupManager.joinGroup(group); // гарантируем, что группа в joinedGroups

                        let activeGroups = [];
                        if (groupManager?.state) {
                            activeGroups = groupManager.state.joinedGroups
                            // activeGroups = [...new Set([...(groupManager.state.groups  || []), ...(groupManager.state.joinedGroups || [])])];
                        }

                        // Уведомляем chat-interface
                        const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                        if (chatInterface) {
                            await chatInterface.postMessage({
                                type: 'ACTIVE_GROUPS_UPDATED',
                                data: { activeGroups }
                            });

                            // ✅ Передаём историю напрямую через setCurrentGroup (внутри он загрузит из chat-manager)
                            await chatInterface.setCurrentGroup(group);
                        }

                        log('Группа активирована: %s', group.name);

                    } catch (error) {
                        log.error('Ошибка активации группы: %o', error);
                        context.addError({
                            componentName: context.constructor.name,
                            source: 'group-activate',
                            message: 'Не удалось активировать группу',
                            details: error
                        });
                    }
                } else {
                    // Не подписан — спрашиваем
                    await context.showModal({
                        title: `Подписаться на группу "${group.name}"?`,
                        content: `<p>Вы не подписаны на эту группу. Хотите присоединиться и получать сообщения?</p>`,
                        buttons: [
                            {
                                text: 'Отмена',
                                type: 'secondary',
                                action: () => log('Подписка отменена')
                            },
                            {
                                text: 'Подписаться',
                                type: 'primary',
                                action: async () => {
                                    try {
                                        const success = await context._actions.subscribeToGroup(group.topic);
                                        if (success) {
                                            // После подписки — активируем (рекурсивно)
                                            await context.callback.activateGroup(group);
                                            log('Успешная подписка и активация группы: %s', group.name);
                                        } else {
                                            throw new Error('Не удалось подписаться на топик');
                                        }
                                    } catch (error) {
                                        log.error('Ошибка при подписке на группу: %o', error);
                                        context.addError({
                                            componentName: context.constructor.name,
                                            source: 'group-subscribe',
                                            message: `Не удалось присоединиться к группе "${group.name}"`,
                                            details: error
                                        });
                                        await context.showModal({
                                            title: 'Ошибка',
                                            content: `<p>Не удалось присоединиться к группе: ${error.message}</p>`,
                                            buttons: [{ text: 'OK', type: 'primary' }]
                                        });
                                    }
                                }
                            }
                        ],
                        closeOnBackdropClick: true
                    });
                }
            };

            const handlersSetupGroup =  async (e) => {
                // Предотвращаем срабатывание на кнопках действий
                if (e.currentTarget.closest('.group-actions')) {
                    return;
                }

                const groupId = e.currentTarget.getAttribute('data-group-id');
                const groupTopic = e.currentTarget.getAttribute('data-group-topic');

                if (!groupId && !groupTopic) {
                    log.error('Клик по группе без data-group-id или data-group-topic');
                    return;
                }

                const topic = groupTopic || groupId;


                const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                const allGroups = (groupManager.allGroups).all

                // Ищем группу в любом из списков
                const group = allGroups.find(g => g.id === topic || g.topic === topic)
                // allGroups.groups.find(g => g.id === topic || g.topic === topic) ||
                // allGroups.discoveredGroups.find(g => g.id === topic || g.topic === topic) ||
                // allGroups.joinedGroups.find(g => g.id === topic || g.topic === topic);

                if (!group) {
                    log.error('Группа не найдена по топику/ID:', topic);
                    return;
                }

                await activateGroup(group)
            };
            // Обработчики для переключения между группами
            const setupGroupHandlers = () => {
                const groupItems = context.shadowRoot.querySelectorAll('.group-item');
                groupItems.forEach(item => {
                    item.addEventListener('click', handlersSetupGroup);
                    eventListeners.push({ element: item, handler: handlersSetupGroup });
                });
            };

            // Обработчики для кнопок действий в группам
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

            // Наблюдатель за изменениями DOM для динамических кнопок
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        if(mutation.target.id === 'discovered-groups-container') {
                            // setupGroupHandlers();
                            // setupGroupActionHandlers();
                        }
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

                setupGroupHandlers();
                setupGroupActionHandlers();
                setupSendMessageHandler();

            // Автофокус на поле ввода сообщения
            const messageInput = context.shadowRoot.querySelector('#message-input');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 100);
            }

            log('ChatManager controller initialized');

            return {
                handlersSetupGroup: handlersSetupGroup,
                activateGroup: activateGroup
            }
        },

        /**
         * Уничтожает контроллер и очищает ресурсы
         * @async
         */
        async destroy() {
            log('ChatManager controller destroying...');

            // Очистка всех обработчиков событий
            eventListeners.forEach(({ element, handler }) => {
                element.removeEventListener('click', handler);
                element.removeEventListener('keypress', handler);
            });
            eventListeners = [];

            // Остановка наблюдателя за DOM
            if (context._groupObserver) {
                context._groupObserver.disconnect();
                context._groupObserver = null;
            }

            log('Removed %d event listeners', eventListeners.length);

            log('ChatManager controller destroyed');
        }
    };
};