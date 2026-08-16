import { logger } from '@libp2p/logger';

/**
 * Контроллер для компонента GroupManager
 * @param {HTMLElement} context - Ссылка на экземпляр компонента
 * @returns {Object} Объект с методами init и destroy
 */
export const controller = async (context) => {
    let eventListeners = [];
    const log = logger('group-manager:controller');

    return {
        /**
         * Инициализирует контроллер компонента GroupManager
         * @async
         */
        async init() {
            log('controller initializing');

            // Обработчик создания новой группы
            const createGroupBtn = context.shadowRoot.querySelector('#create-group-btn');
            const createFirstGroupBtn = context.shadowRoot.querySelector('#create-first-group');
            const createGroupActionBtn = context.shadowRoot.querySelector('#create-group');

            const createGroupHandler = async () => {
                try {
                    // Проверяем готовность ноды
                    if (!context.state.nodeReady) {
                        await context.showModal({
                            title: 'Сеть не готова',
                            content: `\
                                <div style=\"padding: 1rem 0;\">\
                                    <p>P2P сеть еще не готова к работе.</p>\
                                    <p>Пожалуйста, подождите немного и попробуйте снова.</p>\
                                    <div style=\"margin-top: 1rem; padding: 0.75rem; background: rgba(255,193,7,0.1); \
                                                border-radius: 8px; border: 1px solid rgba(255,193,7,0.3);\">\
                                        <strong>Статус:</strong> Ожидание инициализации сети...\
                                    </div>\
                                </div>\
                            `,
                            buttons: [
                                {
                                    text: 'Проверить статус',
                                    type: 'primary',
                                    action: async () => {
                                        await context.checkNodeStatus();
                                    }
                                },
                                {
                                    text: 'Закрыть',
                                    type: 'secondary'
                                }
                            ]
                        });
                        return;
                    }

                    // Показываем модальное окно для ввода названия группы
                    await context.showModal({
                        title: 'Создание новой группы',
                        content: `\
                            <div style=\"padding: 1rem 0;\">\
                                <label for=\"group-name-input\" style=\"display: block; margin-bottom: 0.5rem; font-weight: 600;\">\
                                    Название группы:\
                                </label>\
                                <input \
                                    type=\"text\" \
                                    id=\"group-name-input\" \
                                    placeholder=\"Введите название группы...\"\
                                    style=\"width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); \
                                           border-radius: 8px; background: rgba(255,255,255,0.05); \
                                           color: var(--cosmic-primary); font-size: 1rem;\"\
                                >\
                                <div style=\"margin-top: 1rem; font-size: 0.875rem; color: var(--cosmic-primary);\">\
                                    Группа будет создана и станет видимой для других участников сети.\
                                </div>\
                            </div>\
                        `,
                        buttons: [
                            {
                                text: 'Отмена',
                                type: 'secondary',
                                action: () => log('создание группы отменено')
                            },
                            {
                                text: 'Создать',
                                type: 'primary',
                                action: async () => {
                                    const groupNameInput = document.querySelector('#group-name-input');
                                    if (groupNameInput && groupNameInput.value.trim()) {
                                        const groupName = groupNameInput.value.trim();
                                        log('creating group: %s', groupName);

                                        try {
                                            const group = await context.createGroup(groupName);
                                            log('group created successfully: %o', group);

                                            // Принудительное обновление UI списка групп
                                            if (context.forceUpdateMyGroups) {
                                                await context.forceUpdateMyGroups();
                                            } else {
                                                // Fallback: полный рендер
                                                await context.fullRender(context.state);
                                            }

                                            // Уведомляем chat-manager и chat-interface о создании группы
                                            const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                                            if (chatManager) {
                                                await chatManager.postMessage({
                                                    type: 'GROUP_CREATED',
                                                    data: group
                                                });
                                            }

                                            const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                                            if (chatInterface) {
                                                await chatInterface.postMessage({
                                                    type: 'GROUP_CREATED',
                                                    data: group
                                                });
                                            }
                                        } catch (error) {
                                            log.error('error creating group: %o', error);
                                            await context.showModal({
                                                title: 'Ошибка',
                                                content: `<p>Не удалось создать группу: ${error.message}</p>`,
                                                buttons: [{ text: 'OK', type: 'primary' }]
                                            });
                                        }
                                    }
                                }
                            }
                        ],
                        closeOnBackdropClick: true
                    });
                } catch (error) {
                    log.error('error in create group handler: %o', error);
                }
            };

            // Привязываем обработчик ко всем кнопкам создания группы
            [createGroupBtn, createFirstGroupBtn, createGroupActionBtn].forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', createGroupHandler);
                    eventListeners.push({ element: btn, handler: createGroupHandler });
                }
            });

            // Обработчик проверки статуса ноды
            const checkStatusBtn = context.shadowRoot.querySelector('#check-status');
            if (checkStatusBtn) {
                const checkStatusHandler = async () => {
                    try {
                        await context.checkNodeStatus();
                    } catch (error) {
                        log.error('error checking node status: %o', error);
                    }
                };
                checkStatusBtn.addEventListener('click', checkStatusHandler);
                eventListeners.push({ element: checkStatusBtn, handler: checkStatusHandler });
            }

            // Обработчик поиска групп
            const searchInput = context.shadowRoot.querySelector('#group-search-input');
            if (searchInput) {
                const searchHandler = (e) => {
                    context.searchGroups(e.target.value);
                };
                searchInput.addEventListener('input', searchHandler);
                eventListeners.push({ element: searchInput, handler: searchHandler });
            }

            // Обработчик обнаружения групп
            const discoverGroupsHandler = async () => {
                try {
                    log('запуск поиска групп');

                    // Показываем индикатор загрузки
                    await context.showSkeleton({
                        selector: '#discovered-groups-list',
                        replace: true
                    });

                    // Запускаем активный поиск
                    await context._actions.discoverGroupsActive();

                    // Скрываем индикатор через 2 секунды
                    setTimeout(async () => {
                        await context.hideSkeleton();
                    }, 2000);

                } catch (error) {
                    log.error('ошибка поиска групп: %o', error);
                    await context.hideSkeleton();

                    await context.showModal({
                        title: 'Ошибка поиска',
                        content: `<p>Не удалось выполнить поиск групп: ${error.message}</p>`,
                        buttons: [{ text: 'OK', type: 'primary' }]
                    });
                }
            };

            // Привязываем обработчик ко всем кнопкам поиска групп
            const discoverButtons = [
                context.shadowRoot.querySelector('#discover-groups-btn'),
                context.shadowRoot.querySelector('#discover-groups'),
                context.shadowRoot.querySelector('#discover-groups-action')
            ];

            discoverButtons.forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', discoverGroupsHandler);
                    eventListeners.push({ element: btn, handler: discoverGroupsHandler });
                }
            });

            // Обработчики для кнопок присоединения к группам
            const setupJoinButtons = () => {
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
                                    log('successfully joined group: %s', group.name);

                                    // Уведомляем chat-manager и chat-interface о присоединении к группе
                                    const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                                    if (chatManager) {
                                        await chatManager.postMessage({
                                            type: 'JOIN_GROUP',
                                            data: group
                                        });
                                    }

                                    const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                                    if (chatInterface) {
                                        await chatInterface.postMessage({
                                            type: 'JOIN_GROUP',
                                            data: group
                                        });
                                    }
                                } catch (error) {
                                    log.error('error joining group: %o', error);
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
            };

            // Обработчики для кнопок выхода из групп
            const setupLeaveButtons = () => {
                const leaveButtons = context.shadowRoot.querySelectorAll('.leave-group-btn');
                leaveButtons.forEach(button => {
                    const handler = async (e) => {
                        const groupId = e.target.dataset.groupId || e.target.closest('.leave-group-btn')?.dataset.groupId;
                        if (groupId) {
                            try {
                                await context.leaveGroup(groupId);
                                log('successfully left group: %s', groupId);
                            } catch (error) {
                                log.error('error leaving group: %o', error);
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
                        setupJoinButtons();
                        setupLeaveButtons();
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

            // Инициализация кнопок при первом рендере
            setTimeout(() => {
                setupJoinButtons();
                setupLeaveButtons();
            }, 100);

            log('контроллер инициализирован');
        },

        /**
         * Уничтожает контроллер и очищает ресурсы
         * @async
         */
        async destroy() {
            log('controller destroying');

            // Очистка всех обработчиков событий
            eventListeners.forEach(({ element, handler }) => {
                try {
                    element.removeEventListener('click', handler);
                    element.removeEventListener('input', handler);
                } catch (error) {
                    log.error('error removing event listener: %o', error);
                }
            });

            // Остановка наблюдателя за DOM
            if (context._groupObserver) {
                context._groupObserver.disconnect();
                context._groupObserver = null;
            }

            log('removed %d event listeners', eventListeners.length);
            eventListeners = [];

            log('контроллер уничтожен');
        }
    };
};