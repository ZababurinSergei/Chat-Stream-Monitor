// Импортируем логгер
import { logger } from '@libp2p/logger';

/**
 * Контроллер для компонента PeerConnection
 * @param {HTMLElement} context - Ссылка на экземпляр компонента
 * @returns {Object} Объект с методами init и destroy
 */
export const controller = async (context) => {
    // Создаем именованный логгер для контроллера
    const log = logger('peer-connection:controller');

    let eventListeners = [];

    return {
        /**
         * Инициализирует контроллер компонента
         * @async
         */
        async init() {
            log('controller initializing...');
            const setupDHTHandlers = () => {
                const dhtToggles = [
                    { id: 'dht-lan-toggle', key: 'lan' },
                    { id: 'dht-amino-toggle', key: 'amino' },
                    { id: 'dht-universe-toggle', key: 'universe' }
                ];

                dhtToggles.forEach(({ id, key }) => {
                    const toggle = context.shadowRoot.querySelector(`#${id}`);
                    if (toggle) {
                        const handler = async (e) => {
                            const dhtSettings = { [key]: e.target.checked };
                            await context.updateDHTSettings(dhtSettings);
                        };
                        toggle.addEventListener('change', handler);
                        eventListeners.push({ element: toggle, handler: handler });
                    }
                });
            };

            setupDHTHandlers()

            // Открыть новую вкладку в режиме dialer
            const openDialerBtn = context.shadowRoot.querySelector('#open-dialer-mode');
            if (openDialerBtn) {
                const openDialerHandler = () => {
                    const url = new URL(window.location);
                    url.searchParams.set('mode', 'dialer');
                    window.open(url.toString(), '_blank');
                };
                openDialerBtn.addEventListener('click', openDialerHandler);
                eventListeners.push({ element: openDialerBtn, handler: openDialerHandler });
            }

            // Обработчики для копирования адресов
            const setupCopyHandlers = () => {
                const copyButtons = context.shadowRoot.querySelectorAll('.address-action.copy');
                copyButtons.forEach(button => {
                    const handler = async (e) => {
                        const addressItem = e.target.closest('.address-item');
                        if (addressItem) {
                            const address = addressItem.getAttribute('data-address');
                            if (address) {
                                await context.copyToClipboard(address, 'Адрес скопирован в буфер обмена', addressItem);
                            }
                        }
                    };
                    button.addEventListener('click', handler);
                    eventListeners.push({ element: button, handler: handler });
                });
            };

            // Обработчики для копирования Peer ID из детализированного списка
            const setupPeerCopyHandlers = () => {
                const copyPeerButtons = context.shadowRoot.querySelectorAll('.copy-peer-id');
                copyPeerButtons.forEach(button => {
                    const handler = async (e) => {
                        const peerId = e.target.getAttribute('data-peer-id');
                        if (peerId) {
                            log.trace('Copying peer ID: %s', peerId);
                            await context.copyToClipboard(peerId, 'Peer ID скопирован в буфер обмена');
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
                        if(mutation?.target?.closest && mutation.target.closest('.addresses-card')) {
                            setupCopyHandlers();
                            setupPeerCopyHandlers();
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
            context._copyObserver = observer;

            // Инициализация кнопок при первом рендере
            // setTimeout(() => {
                setupCopyHandlers();
                setupPeerCopyHandlers();
            // }, 100);

            // Обработчик подключения к пиру
            const connectBtn = context.shadowRoot.querySelector('#connect-peer-btn');
            const peerAddressInput = context.shadowRoot.querySelector('#peer-address-input');

            // Обработчики для переключения режимов
            const listenerBtn = context.shadowRoot.querySelector('#listener-mode-btn');
            const dialerBtn = context.shadowRoot.querySelector('#dialer-mode-btn');

            log.trace('Debug: button elements found: %o', {
                listenerBtn: !!listenerBtn,
                dialerBtn: !!dialerBtn,
                listenerBtnId: listenerBtn?.id,
                dialerBtnId: dialerBtn?.id
            });

            if (listenerBtn) {
                const listenerHandler = async () => {
                    try {
                        log('Listener mode button clicked');
                        await context.switchMode('listener');
                        log('Переключен в режим listener');
                    } catch (error) {
                        log.error('Ошибка переключения в режим listener: %o', error);
                        context.addError({
                            componentName: context.constructor.name,
                            source: 'controller-listener',
                            message: 'Ошибка переключения в режим слушателя',
                            details: error
                        });
                    }
                };
                listenerBtn.addEventListener('click', listenerHandler);
                eventListeners.push({ element: listenerBtn, handler: listenerHandler });
                log.trace('Listener button handler attached');
            }

            if (dialerBtn) {
                const dialerHandler = async () => {
                    try {
                        log('Dialer mode button clicked');
                        await context.switchMode('dialer');
                        log('Переключен в режим dialer');
                    } catch (error) {
                        log.error('Ошибка переключения в режим dialer: %o', error);
                        context.addError({
                            componentName: context.constructor.name,
                            source: 'controller-dialer',
                            message: 'Ошибка переключения в режим инициатора',
                            details: error
                        });
                    }
                };
                dialerBtn.addEventListener('click', dialerHandler);
                eventListeners.push({ element: dialerBtn, handler: dialerHandler });
                log.trace('Dialer button handler attached');
            }

            // Дополнительная привязка через делегирование событий на случай проблем с элементами
            const modeSwitcher = context.shadowRoot.querySelector('.mode-switcher');
            if (modeSwitcher) {
                const modeDelegationHandler = async (event) => {
                    const button = event.target.closest('.mode-btn');
                    if (button) {
                        event.preventDefault();
                        event.stopPropagation();

                        const mode = button.id === 'listener-mode-btn' ? 'listener' : 'dialer';
                        log.trace('Mode delegation handler triggered: %s', mode);

                        try {
                            await context.switchMode(mode);
                            log.trace('Mode switched via delegation: %s', mode);
                        } catch (error) {
                            log.error('Error in mode delegation: %o', error);
                        }
                    }
                };

                modeSwitcher.addEventListener('click', modeDelegationHandler);
                eventListeners.push({ element: modeSwitcher, handler: modeDelegationHandler });
                log.trace('Mode switcher delegation handler attached');
            }

            if (connectBtn && peerAddressInput) {
                const connectHandler = async () => {
                    const address = peerAddressInput.value.trim();
                    if (address) {
                        try {
                            log('Connecting to peer: %s', address);
                            await context.connectToPeer(address);
                            peerAddressInput.value = '';
                            log('Подключение к пиру инициировано: %s', address);
                        } catch (error) {
                            log.error('Ошибка подключения к пиру: %o', error);
                            context.addError({
                                componentName: context.constructor.name,
                                source: 'controller-connect',
                                message: `Ошибка подключения к ${address}`,
                                details: error
                            });
                        }
                    } else {
                        log.error('Пустой адрес для подключения');
                    }
                };

                connectBtn.addEventListener('click', connectHandler);
                eventListeners.push({ element: connectBtn, handler: connectHandler });

                // Также обрабатываем Enter в поле ввода
                const enterHandler = (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        connectHandler();
                    }
                };
                peerAddressInput.addEventListener('keypress', enterHandler);
                eventListeners.push({ element: peerAddressInput, handler: enterHandler });

                log.trace('Peer connection handlers attached');
            }

            // Обработчик обновления списка пиров
            const refreshBtn = context.shadowRoot.querySelector('#refresh-peers-btn');
            if (refreshBtn) {
                const refreshHandler = async () => {
                    try {
                        log('Refreshing peer list...');
                        await context.updatePeerList();
                        log('Список пиров обновлен');
                    } catch (error) {
                        log.error('Ошибка обновления списка пиров: %o', error);
                    }
                };
                refreshBtn.addEventListener('click', refreshHandler);
                eventListeners.push({ element: refreshBtn, handler: refreshHandler });
                log.trace('Refresh peers handler attached');
            }

            // Обработчик копирования адресов
            const copyAddressesBtn = context.shadowRoot.querySelector('#copy-addresses-btn');
            if (copyAddressesBtn) {
                const copyHandler = async () => {
                    try {
                        log('Copying addresses...');
                        const addresses = await context.getRelayAddresses();
                        const textToCopy = addresses.join('\n');
                        await context.copyToClipboard(textToCopy, 'Все адреса скопированы в буфер обмена');
                    } catch (error) {
                        log.error('Ошибка копирования адресов: %o', error);
                        context.addError({
                            componentName: context.constructor.name,
                            source: 'controller-copy-addresses',
                            message: 'Ошибка копирования адресов',
                            details: error
                        });
                    }
                };
                copyAddressesBtn.addEventListener('click', copyHandler);
                eventListeners.push({ element: copyAddressesBtn, handler: copyHandler });
                log.trace('Copy addresses handler attached');
            }

            // Обработчик переключения relay
            const relayToggle = context.shadowRoot.querySelector('#relay-toggle');
            if (relayToggle) {
                const relayHandler = (event) => {
                    context.state.relayEnabled = event.target.checked;
                    log('Relay %s', context.state.relayEnabled ? 'включен' : 'выключен');

                    // Обновляем UI для отражения изменения
                    context.renderPart({
                        partName: 'renderSystemStatus',
                        state: context.state,
                        selector: '.status-card .card-content'
                    }).catch(error => log.error('Error updating relay status: %o', error));
                };
                relayToggle.addEventListener('change', relayHandler);
                eventListeners.push({ element: relayToggle, handler: relayHandler });
                log.trace('Relay toggle handler attached');
            }

            // Обработчики быстрых действий
            this.setupQuickActions(context, eventListeners);

            log('Контроллер инициализирован');
            log('Total event listeners: %d', eventListeners.length);
        },

        /**
         * Настраивает обработчики для быстрых действий
         * @param {HTMLElement} context - Контекст компонента
         * @param {Array} eventListeners - Массив обработчиков событий
         */
        setupQuickActions(context, eventListeners) {
            // Копирование Peer ID
            const copyPeerIdBtn = context.shadowRoot.querySelector('#copy-peer-id');
            if (copyPeerIdBtn) {
                const copyPeerHandler = async () => {
                    try {
                        if (context.state.peerId) {
                            await context.copyToClipboard(context.state.peerId, 'Peer ID скопирован в буфер обмена');
                        }
                    } catch (error) {
                        log.error('Ошибка копирования Peer ID: %o', error);
                    }
                };
                copyPeerIdBtn.addEventListener('click', copyPeerHandler);
                eventListeners.push({ element: copyPeerIdBtn, handler: copyPeerHandler });
            }

            // Копирование всех адресов
            const copyAllAddressesBtn = context.shadowRoot.querySelector('#copy-addresses');
            if (copyAllAddressesBtn) {
                const copyAllAddressesHandler = async () => {
                    try {
                        const addresses = context.state.listeningAddresses || [];
                        if (addresses.length > 0) {
                            const textToCopy = addresses.join('\n');
                            await context.copyToClipboard(textToCopy, 'Все адреса скопированы в буфер обмена');
                        }
                    } catch (error) {
                        log.error('Ошибка копирования всех адресов: %o', error);
                    }
                };
                copyAllAddressesBtn.addEventListener('click', copyAllAddressesHandler);
                eventListeners.push({ element: copyAllAddressesBtn, handler: copyAllAddressesHandler });
            }

            // Отключение всех пиров
            const disconnectAllBtn = context.shadowRoot.querySelector('#disconnect-all');
            if (disconnectAllBtn) {
                const disconnectAllHandler = async () => {
                    try {
                        log('Disconnecting all peers...');
                        // Здесь должна быть логика отключения всех пиров
                        log('Все пиры отключены');
                    } catch (error) {
                        log.error('Ошибка отключения всех пиров: %o', error);
                    }
                };
                disconnectAllBtn.addEventListener('click', disconnectAllHandler);
                eventListeners.push({ element: disconnectAllBtn, handler: disconnectAllHandler });
            }

            // Перезапуск узла
            const restartNodeBtn = context.shadowRoot.querySelector('#restart-node');
            if (restartNodeBtn) {
                const restartHandler = async () => {
                    try {
                        log('Restarting node...');
                        await context.switchMode(context.state.mode); // Перезапуск в текущем режиме
                        log('Узел перезапущен');
                    } catch (error) {
                        log.error('Ошибка перезапуска узла: %o', error);
                    }
                };
                restartNodeBtn.addEventListener('click', restartHandler);
                eventListeners.push({ element: restartNodeBtn, handler: restartHandler });
            }

            // Обновление всего
            const refreshAllBtn = context.shadowRoot.querySelector('#refresh-all');
            if (refreshAllBtn) {
                const refreshAllHandler = async () => {
                    try {
                        log('Refreshing all data...');
                        await context.updatePeerList();
                        // Можно добавить обновление других данных
                        log('Все данные обновлены');
                    } catch (error) {
                        log.error('Ошибка обновления данных: %o', error);
                    }
                };
                refreshAllBtn.addEventListener('click', refreshAllHandler);
                eventListeners.push({ element: refreshAllBtn, handler: refreshAllHandler });
            }

            log.trace('Quick actions handlers attached');
        },

        /**
         * Уничтожает контроллер и очищает ресурсы
         * @async
         */
        async destroy() {
            log('controller destroying...');

            // Очистка всех обработчиков событий
            eventListeners.forEach(({ element, handler }) => {
                try {
                    element.removeEventListener('click', handler);
                    element.removeEventListener('input', handler);
                    element.removeEventListener('keypress', handler);
                    element.removeEventListener('change', handler);
                } catch (error) {
                    log.error('Error removing event listener: %o', error);
                }
            });

            // Остановка наблюдателя за DOM
            if (context._copyObserver) {
                context._copyObserver.disconnect();
                context._copyObserver = null;
            }

            log('Removed %d event listeners', eventListeners.length);
            eventListeners = [];

            log('Контроллер уничтожен');
        }
    };
};