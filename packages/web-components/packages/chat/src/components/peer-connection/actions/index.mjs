// Импортируем необходимые модули
import {createLibp2p} from 'libp2p';
import {noise} from '@chainsafe/libp2p-noise';
import {yamux} from '@chainsafe/libp2p-yamux';
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2';
import {webSockets} from '@libp2p/websockets';
import {webRTC} from '@libp2p/webrtc';
import {identify} from '@libp2p/identify';
import {gossipsub} from 'https://cdn.jsdelivr.net/npm/@libp2p/gossipsub@15.0.7/+esm'
import {multiaddr} from '@multiformats/multiaddr';
import {fromString} from 'uint8arrays';
import {WebRTC, WebSockets} from "@multiformats/multiaddr-matcher";
import {ping} from '@libp2p/ping'
import {kadDHT} from '@libp2p/kad-dht';
import {sha256} from 'multiformats/hashes/sha2';
import {logger} from '@libp2p/logger';
import { BOOTSTRAP_NODES } from './config/index.js'
import {bootstrap} from "@libp2p/bootstrap";

// DHT Configuration
const DHT_CONFIG = {
    // LAN DHT settings
    LAN: {
        PROTOCOL: '/ipfs/lan/kad/1.0.0',
        CLIENT_MODE: false,
        DATASOURCE_PREFIX: '/dht-lan',
        LOG_PREFIX: 'libp2p:dht-lan',
        METRICS_PREFIX: 'libp2p_dht_lan',
        BUCKET_SIZE: 20,
        MAX_RECORD_AGE: 36 * 60 * 60 * 1000,
        QUERY_TIMEOUT: 30000,
        QUERY_CONCURRENCY: 3
    },
    // Amino DHT settings
    AMINO: {
        PROTOCOL: '/ipfs/kad/1.0.0',
        CLIENT_MODE: true,
        DATASOURCE_PREFIX: '/dht-amino',
        LOG_PREFIX: 'libp2p:dht-amino',
        METRICS_PREFIX: 'libp2p_dht_amino',
        BUCKET_SIZE: 20,
        MAX_RECORD_AGE: 36 * 60 * 60 * 1000,
        QUERY_TIMEOUT: 30000,
        QUERY_CONCURRENCY: 3
    },
    // Universe DHT settings (custom WAN)
    UNIVERSE: {
        PROTOCOL: '/universe/kad/1.0.0',
        CLIENT_MODE: false,
        DATASOURCE_PREFIX: '/dht-universe',
        LOG_PREFIX: 'libp2p:dht-universe',
        METRICS_PREFIX: 'libp2p_dht_universe',
        BUCKET_SIZE: 20,
        MAX_RECORD_AGE: 36 * 60 * 60 * 1000,
        QUERY_TIMEOUT: 30000,
        QUERY_CONCURRENCY: 3
    }
};

/**
 * Фабричная функция для создания действий компонента PeerConnection
 * @param {Object} context - Контекст компонента
 * @returns {Promise<Object>} Объект с методами действий
 */
export async function createActions(context) {
    // Создаем именованный логгер для компонента
    const log = logger('peer-connection:actions');

    let libp2p = null;
    let connectionInterval = null;
    let dhtInterval = null;

    const self = {
        /**
         * Инициализирует DHT сервисы
         * @async
         */
        async initializeDHT() {
            if (!libp2p || !context.state.dhtEnabled) return;

            try {
                const dhtServices = [];

                // LAN DHT
                if (context.state.dhtEnabled.lan) {
                    const lanDHT = kadDHT({
                        protocol: DHT_CONFIG.LAN.PROTOCOL,
                        clientMode: DHT_CONFIG.LAN.CLIENT_MODE,
                        logPrefix: DHT_CONFIG.LAN.LOG_PREFIX,
                        kBucketSize: DHT_CONFIG.LAN.BUCKET_SIZE,
                        maxRecordAge: DHT_CONFIG.LAN.MAX_RECORD_AGE,
                        queryTimeout: DHT_CONFIG.LAN.QUERY_TIMEOUT,
                        queryConcurrency: DHT_CONFIG.LAN.QUERY_CONCURRENCY
                    });
                    dhtServices.push(lanDHT);
                    context._dhtServices.set('lan', lanDHT);
                    log('LAN DHT initialized');
                }

                // Amino DHT
                if (context.state.dhtEnabled.amino) {
                    const aminoDHT = kadDHT({
                        protocol: DHT_CONFIG.AMINO.PROTOCOL,
                        clientMode: DHT_CONFIG.AMINO.CLIENT_MODE,
                        logPrefix: DHT_CONFIG.AMINO.LOG_PREFIX,
                        kBucketSize: DHT_CONFIG.AMINO.BUCKET_SIZE,
                        maxRecordAge: DHT_CONFIG.AMINO.MAX_RECORD_AGE,
                        queryTimeout: DHT_CONFIG.AMINO.QUERY_TIMEOUT,
                        queryConcurrency: DHT_CONFIG.AMINO.QUERY_CONCURRENCY
                    });
                    dhtServices.push(aminoDHT);
                    context._dhtServices.set('amino', aminoDHT);
                    log('Amino DHT initialized');
                }

                // Universe DHT
                if (context.state.dhtEnabled.universe) {
                    const universeDHT = kadDHT({
                        protocol: DHT_CONFIG.UNIVERSE.PROTOCOL,
                        clientMode: DHT_CONFIG.UNIVERSE.CLIENT_MODE,
                        logPrefix: DHT_CONFIG.UNIVERSE.LOG_PREFIX,
                        kBucketSize: DHT_CONFIG.UNIVERSE.BUCKET_SIZE,
                        maxRecordAge: DHT_CONFIG.UNIVERSE.MAX_RECORD_AGE,
                        queryTimeout: DHT_CONFIG.UNIVERSE.QUERY_TIMEOUT,
                        queryConcurrency: DHT_CONFIG.UNIVERSE.QUERY_CONCURRENCY
                    });
                    dhtServices.push(universeDHT);
                    context._dhtServices.set('universe', universeDHT);
                    log('Universe DHT initialized');
                }

                return dhtServices;

            } catch (error) {
                log.error('Error initializing DHT services: %o', error);
                context.addError({
                    componentName: context.constructor.name,
                    source: 'initializeDHT',
                    message: 'Ошибка инициализации DHT',
                    details: error
                });
                return [];
            }
        },

        /**
         * Обновляет список пиров DHT
         * @async
         */
        async updateDHTPeers() {
            if (!libp2p || !context._dhtServices.size) return;

            try {
                const dhtPeers = {
                    lan: [],
                    amino: [],
                    universe: []
                };

                for (const [type, dht] of context._dhtServices.entries()) {
                    try {
                        // Получаем пиров из таблицы маршрутизации DHT
                        const routingTablePeers = dht.routingTable?.toArray() || [];
                        dhtPeers[type] = routingTablePeers.map(peerId => ({
                            id: peerId.toString(),
                            type: type.toUpperCase(),
                            discoveredAt: Date.now()
                        }));

                        log('DHT %s peers: %d', type, dhtPeers[type].length);
                    } catch (error) {
                        log.error('Error getting DHT %s peers: %o', type, error);
                    }
                }

                context.state.dhtPeers = dhtPeers;
                await self.sendDHTPeersToChatInterface();

            } catch (error) {
                log.error('Error updating DHT peers: %o', error);
            }
        },

        /**
         * Передает данные о DHT пирах в chat-interface
         * @async
         */
        async sendDHTPeersToChatInterface() {
            try {
                const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                if (chatInterface) {
                    const dhtData = {
                        totalPeers: Object.values(context.state.dhtPeers).flat().length,
                        peers: Object.values(context.state.dhtPeers).flat(),
                        dhtEnabled: context.state.dhtEnabled,
                        timestamp: Date.now()
                    };

                    await chatInterface.postMessage({
                        type: 'DHT_PEERS_UPDATE',
                        data: dhtData
                    });

                    log.trace('DHT peers data sent to chat-interface: %o', dhtData);
                }
            } catch (error) {
                log.error('Error sending DHT peers to chat interface: %o', error);
            }
        },

        /**
         * Запускает периодическое обновление DHT пиров
         * @async
         */
        async startDHTPeerUpdates() {
            if (dhtInterval) {
                clearInterval(dhtInterval);
            }

            dhtInterval = setInterval(() => {
                self.updateDHTPeers();
            }, 10000); // Обновление каждые 10 секунд

            // Первое обновление
            setTimeout(() => {
                self.updateDHTPeers();
            }, 2000);
        },

        /**
         * Публикует информацию о себе в DHT
         * @async
         * @param {Object} data - Данные для публикации
         */
        async publishToDHT(data) {
            if (!libp2p || !context._dhtServices.size) return;

            try {
                const key = new TextEncoder().encode(`peer:${context.state.peerId}`);
                const value = new TextEncoder().encode(JSON.stringify({
                    ...data,
                    peerId: context.state.peerId,
                    timestamp: Date.now(),
                    addresses: context.state.listeningAddresses
                }));

                for (const [type, dht] of context._dhtServices.entries()) {
                    try {
                        // Новый API для DHT - используем provide вместо put
                        if (dht.provide) {
                            // Для объявления доступности контента
                            await dht.provide(key);
                            log('Provided key in %s DHT', type);
                        }

                        // Если нужно сохранять данные, используем content routing
                        if (libp2p.contentRouting && libp2p.contentRouting.put) {
                            await libp2p.contentRouting.put(key, value);
                            log('Data published to content routing via %s DHT', type);
                        }

                    } catch (error) {
                        log.error('Error publishing to %s DHT: %o', type, error);
                    }
                }

            } catch (error) {
                log.error('Error publishing to DHT: %o', error);
            }
        },

        /**
         * Ищет пиров в DHT
         * @async
         * @param {string} query - Поисковый запрос
         */
        async findPeersInDHT(query) {
            if (!libp2p || !context._dhtServices.size) return [];

            try {
                const key = new TextEncoder().encode(query);
                const foundPeers = [];

                for (const [type, dht] of context._dhtServices.entries()) {
                    try {
                        // Используем findProviders для поиска пиров
                        if (dht.findProviders) {
                            for await (const provider of dht.findProviders(key)) {
                                foundPeers.push({
                                    id: provider.id.toString(),
                                    dhtType: type,
                                    foundVia: 'DHT',
                                    addresses: provider.multiadds
                                });
                            }
                        }

                        // Альтернативно используем content routing
                        if (libp2p.contentRouting && libp2p.contentRouting.get) {
                            try {
                                const value = await libp2p.contentRouting.get(key);
                                if (value) {
                                    const data = JSON.parse(new TextDecoder().decode(value));
                                    foundPeers.push({
                                        ...data,
                                        dhtType: type,
                                        foundVia: 'ContentRouting'
                                    });
                                }
                            } catch (e) {
                                // Игнорируем ошибки получения данных
                            }
                        }

                    } catch (error) {
                        log.error('Error searching in %s DHT: %o', type, error);
                    }
                }

                return foundPeers;

            } catch (error) {
                log.error('Error finding peers in DHT: %o', error);
                return [];
            }
        },

        /**
         * Обновляет настройки DHT
         * @async
         * @param {Object} dhtSettings - Новые настройки DHT
         */
        async updateDHTSettings(dhtSettings) {
            try {
                context.state.dhtEnabled = {...context.state.dhtEnabled, ...dhtSettings};

                // Перезапускаем DHT сервисы
                if (libp2p) {
                    await self.initializeDHT();
                    await self.startDHTPeerUpdates();
                }

                log('DHT settings updated: %o', context.state.dhtEnabled);
                return true;

            } catch (error) {
                log.error('Error updating DHT settings: %o', error);
                return false;
            }
        },
        /**
         * Инициализирует Libp2p узел
         * @async
         * @param {string} mode - Режим работы ('listener' | 'dialer')
         * @returns {Promise<Object>} Экземпляр Libp2p
         */
        async initializeLibp2p(mode = 'listener') {
            try {
                // Конфигурация Libp2p
                const config = {
                    addresses: {
                        listen: [
                            '/p2p-circuit',
                            '/webrtc'
                        ]
                    },
                    transports: [
                        webSockets(),
                        webRTC(),
                        circuitRelayTransport()
                    ],
                    connectionEncrypters: [noise()],
                    streamMuxers: [yamux()],
                    services: {
                        ping: ping(),
                        identify: identify(),
                        pubsub: gossipsub({
                            doPX: true,
                            emitSelf: true
                        })
                    },
                    peerDiscovery: [
                        bootstrap({
                            list: BOOTSTRAP_NODES,
                            timeout: 10000 // 10 секунд таймаут
                        })
                    ],
                    connectionGater: {
                        denyDialMultiaddr: () => false,
                        denyDialPeer: () => false,
                        denyOutboundConnection: () => false,
                        denyOutboundEncryptedConnection: () => false,
                        denyOutboundUpgradedConnection: () => false,
                        denyInboundConnection: () => false,
                        denyInboundEncryptedConnection: () => false,
                        denyInboundUpgradedConnection: () => false,
                        filterMultiaddrForPeer: async () => true
                    }
                };

                libp2p = await createLibp2p(config);
                await libp2p.start();

                log('Libp2p узел инициализирован: %o', {
                    peerId: libp2p.peerId.toString(),
                    mode: mode,
                    addresses: libp2p.getMultiaddrs().map(ma => ma.toString())
                });

                // Настройка обработчиков событий
                await self.setupEventHandlers();

                // Запускаем обновление списка подключенных пиров
                // await self.startPeerListUpdates();

                return libp2p;

            } catch (error) {
                log.error('Ошибка инициализации Libp2p: %o', error);
                context.addError({
                    componentName: context.constructor.name,
                    source: 'initializeLibp2p',
                    message: 'Не удалось инициализировать P2P узел',
                    details: error
                });
                throw error;
            }
        },

        /**
         * Настраивает обработчики событий Libp2p
         * @async
         */
        async setupEventHandlers() {
            if (!libp2p) return;

            // Обработчик подключения пира
            libp2p.addEventListener('peer:connect', async (event) => {
                log('Подключен пир: %s', event.detail.toString());

                // Обновляем список пиров
                // setTimeout(async () => {
                await self.updatePeerList();
                await self.sendPeersToChatInterface();
                // }, 500);
            });

            // Обработчик отключения пира
            libp2p.addEventListener('peer:disconnect', async (event) => {
                log('Отключен пир: %s', event.detail.toString());

                // Обновляем список пиров
                // setTimeout(async () => {
                await self.updatePeerList();
                await self.sendPeersToChatInterface();
                // }, 500);
            });

            // Обновление собственных адреса
            libp2p.addEventListener('self:peer:update', (event) => {
                log('Обновлены адреса узла');
                self.updatePeerList();
                self.updateAddressList();
                self.updateStatsCard();
                self.sendPeersToChatInterface();
                self.sendConnectionStatusToChatInterface();
            });

            // Обнаружение пиров
            libp2p.addEventListener('peer:discovery', async (event) => {
                log('Обнаружен пир: %s', event.detail.id.toString());
                // Также обновляем список при обнаружении новых пиров
                // setTimeout(async () => {
                await self.updatePeerList();
                await self.sendPeersToChatInterface();
                // }, 1000);
            });
        },

        /**
         * Передает данные о пирах в chat-interface
         */
        async sendPeersToChatInterface() {
            try {
                const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                if (chatInterface) {
                    // Формируем данные для передачи
                    const peersData = {
                        totalPeers: context.state.connectedPeers ? context.state.connectedPeers.length : 0,
                        peers: context.state.connectedPeers ? context.state.connectedPeers.map(peer => ({
                            id: peer.id,
                            connections: peer.connections ? peer.connections.length : 1,
                            status: 'connected'
                        })) : [],
                        connectionStatus: context.state.connected,
                        timestamp: Date.now()
                    };

                    // Отправляем сообщение в chat-interface
                    await chatInterface.postMessage({
                        type: 'PEERS_UPDATE',
                        data: peersData
                    });

                    log.trace('Peers data sent to chat-interface: %o', peersData);
                } else {
                    log('Chat interface not found, will retry...');
                    // Повторяем попытку через 1 секунду
                    setTimeout(() => self.sendPeersToChatInterface(), 1000);
                }
            } catch (error) {
                log.error('Error sending peers to chat interface: %o', error);
            }
        },

        /**
         * Передает информацию о соединении в chat-interface
         */
        async sendConnectionStatusToChatInterface() {
            try {
                const chatInterface = await context.getComponentAsync('chat-interface', 'main-chat');
                if (chatInterface) {
                    const connectionData = {
                        connected: context.state.connected,
                        peerId: context.state.peerId,
                        mode: context.state.mode,
                        uptime: context.state.uptime,
                        timestamp: Date.now()
                    };

                    await chatInterface.postMessage({
                        type: 'CONNECTION_STATUS_UPDATE',
                        data: connectionData
                    });

                    log.trace('Connection status sent to chat-interface: %o', connectionData);
                }
            } catch (error) {
                log.error('Error sending connection status: %o', error);
            }
        },

        /**
         * Обновляет секцию со статистикой
         */
        async updateStatsCard() {
            const statsCard = context.shadowRoot.querySelector('.stats-card');
            if (statsCard && context.renderPart) {
                log.trace('Updating stats card section');
                await context.renderPart({
                    partName: 'renderStatistics',
                    state: context.state,
                    selector: '.stats-card .card-content'
                });
            } else {
                log('Stats card not found, using full render');
                await context.fullRender(context.state);
            }
        },

        /**
         * Запускает периодическое обновление списка пиров
         * @async
         */
        async startPeerListUpdates() {
            if (connectionInterval) {
                clearInterval(connectionInterval);
            }

            // connectionInterval = setInterval(() => {
            //     log.trace('Автоматическое обновление...');
            self.updatePeerList();
            self.updateAddressList();
            self.updateStatsCard();
            self.sendPeersToChatInterface();
            self.sendConnectionStatusToChatInterface();
            // }, 5000);

            // Однократное обновление после полной загрузки
            setTimeout(() => {
                log.trace('Однократное обновление после загрузки');
                self.manualUpdate();
            }, 4000);
        },

        /**
         * Ручное обновление списков
         * @async
         */
        async manualUpdate() {
            log.trace('Ручное обновление списков...');

            const addressesElement = context.shadowRoot.querySelector('#listening-addresses');
            const peersElement = context.shadowRoot.querySelector('#connected-peers-list');

            log.trace('Состояние DOM: %o', {
                addressesElement: !!addressesElement,
                peersElement: !!peersElement,
                shadowRoot: !!context.shadowRoot
            });

            if (context.shadowRoot) {
                log.trace('Все элементы в shadowRoot:');
                context.shadowRoot.querySelectorAll('*').forEach(el => {
                    if (el.id) {
                        log.trace('  - %s #%s', el.tagName, el.id);
                    }
                });
            }

            await self.updatePeerList();
            await self.updateAddressList();
            await self.sendPeersToChatInterface();
            await self.sendConnectionStatusToChatInterface();
        },

        /**
         * Принудительное обновление всех списков (для отладки)
         * @async
         */
        async forceUpdate() {
            log('Принудительное обновление всех списков');

            if (libp2p) {
                log('Текущее состояние libp2p: %o', {
                    peerId: libp2p.peerId?.toString(),
                    addresses: libp2p.getMultiaddrs().map(ma => ma.toString()),
                    peers: libp2p.getPeers().map(p => p.toString())
                });
            }

            await self.manualUpdate();
        },

        /**
         * Обновляет список подключенных пиров
         * @async
         */
        async updatePeerList() {
            if (!libp2p || !context.state) {
                log('libp2p или context.state не доступны');
                return;
            }

            const peers = await self.getConnectedPeers();
            context.state.connectedPeers = peers;

            log('updatePeerList: пиров найдено: %d', peers.length);

            const peersElement = context.shadowRoot.querySelector('#connected-peers-list');
            log.trace('updatePeerList: элемент #connected-peers-list найден: %s', !!peersElement);

            if (peersElement && context.renderPart) {
                log.trace('updatePeerList: выполняем renderPart');
                await context.renderPart({
                    partName: 'renderPeersList',
                    state: context.state,
                    selector: '#connected-peers-list'
                });
                log.trace('updatePeerList: renderPart завершен');
            } else {
                log('updatePeerList: renderPart не выполнен - элемент не найден');
            }
        },

        /**
         * Обновляет список адресов прослушивания
         * @async
         */
        async updateAddressList() {
            if (!libp2p || !context.state) {
                log.error('updateAddressList: libp2p или context.state не доступны');
                return;
            }

            const addresses = libp2p.getMultiaddrs().filter(ma => WebRTC.matches(ma)).map(ma => ma.toString());
            context.state.listeningAddresses = addresses;

            log.trace('updateAddressList: адресов найдено: %d', addresses.length);

            const addressesElement = context.shadowRoot.querySelector('#listening-addresses');
            log.trace('updateAddressList: элемент #listening-addresses найден: %s', !!addressesElement);

            if (addressesElement && context.renderPart) {
                log.trace('updateAddressList: выполняем renderPart');
                await context.renderPart({
                    partName: 'renderAddressesList',
                    state: context.state,
                    selector: '#listening-addresses'
                });
                log.trace('updateAddressList: renderPart завершен');
            } else {
                log('updateAddressList: renderPart не выполнен - элемент не найден');
            }
        },

        /**
         * Подключается к указанному пиру
         * @async
         * @param {string} multiaddrStr - Multiaddr для подключения
         */
        async connectToPeer(multiaddrStr) {
            try {
                if (!libp2p) {
                    throw new Error('Libp2p не инициализирован');
                }

                const ma = multiaddr(multiaddrStr.trim());

                log('Подключаемся к: %s', ma.toString());
                await libp2p.dial(ma);

                log('Успешно подключены к: %s', ma.toString());

            } catch (error) {
                log.error('Ошибка подключения к пиру: %o', error);
                context.addError({
                    componentName: context.constructor.name,
                    source: 'connectToPeer',
                    message: `Не удалось подключиться к ${multiaddrStr}`,
                    details: error
                });
                throw error;
            }
        },

        /**
         * Получает список подключенных пиров
         * @async
         * @returns {Array<string>} Массив идентификаторов пиров
         */
        async getConnectedPeers() {
            if (!libp2p) return [];

            return libp2p.getPeers().map(peerId => {
                const connections = libp2p.getConnections(peerId);
                return {
                    id: peerId.toString(),
                    connections: connections.map(conn => ({
                        id: conn.id,
                        remoteAddr: conn.remoteAddr.toString(),
                        status: conn.status
                    }))
                };
            });
        },

        /**
         * Получает relay адреса текущего узла
         * @async
         * @returns {Array<string>} Массив relay адресов
         */
        async getRelayAddresses() {
            if (!libp2p) return [];

            return libp2p.getMultiaddrs()
                .map(ma => ma.toString())
                .filter(addr => addr.includes('/p2p-circuit') || addr.includes('/webrtc'));
        },

        /**
         * Подписывается на PubSub топик
         * @async
         * @param {string} topic - Название топика
         */
        async subscribeToTopic(topic) {
            try {
                if (!libp2p) {
                    throw new Error('Libp2p не инициализирован');
                }

                await libp2p.services.pubsub.subscribe(topic);
                log('Подписались на топик: %s', topic);

            } catch (error) {
                log.error('Ошибка подписки на топик: %o', error);
                throw error;
            }
        },

        /**
         * Отправляет сообщение в PubSub топик
         * @async
         * @param {string} topic - Название топика
         * @param {string} message - Сообщение для отправки
         */
        async sendTopicMessage(topic, message) {
            try {
                if (!libp2p) {
                    throw new Error('Libp2p не инициализирован');
                }


                await libp2p.services.pubsub.publish(topic, fromString(message));
                log('Отправлено сообщение в топик %s: %s', topic, message);

            } catch (error) {
                log.error('Ошибка отправки сообщения: %o', error);
                throw error;
            }
        },

        /**
         * Получает список пиров в топике
         * @async
         * @param {string} topic - Название топика
         * @returns {Array<string>} Массив идентификаторов пиров
         */
        async getTopicPeers(topic) {
            if (!libp2p) return [];

            try {
                return libp2p.services.pubsub.getSubscribers(topic)
                    .map(peerId => peerId.toString());
            } catch (error) {
                log.error('Ошибка получения списка пиров топика: %o', error);
                return [];
            }
        },


        /**
         * Уведомляет все компоненты о готовности новой ноды
         * @async
         */
        async notifyComponentsNodeReady() {
            const log = logger('peer-connection:actions:notifyNodeReady');

            try {
                // Уведомляем ChatManager
                const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                if (chatManager) {
                    await chatManager.postMessage({
                        type: 'NODE_RESTARTED',
                        data: {
                            peerId: context.state.peerId,
                            mode: context.state.mode,
                            timestamp: Date.now()
                        }
                    });
                }

                // Уведомляем GroupManager
                const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                if (groupManager) {
                    // GroupManager сам обнаружит новую ноду через свой механизм проверки
                    log('GroupManager уведомлен о перезапуске ноды');
                }

                log('Все компоненты уведомлены о готовности новой ноды');
            } catch (error) {
                log.error('Ошибка уведомления компонентов: %o', error);
            }
        },

        /**
         * Останавливает Libp2p узел и очищает ресурсы
         * @async
         */
        async cleanup() {
            const log = logger('peer-connection:actions:cleanup');

            try {
                log('Начало очистки P2P системы...');

                // 1. Останавливаем интервалы обновления
                if (connectionInterval) {
                    clearInterval(connectionInterval);
                    connectionInterval = null;
                    log('Остановлен интервал обновления пиров');
                }

                // 2. Уведомляем ChatManager о остановке
                try {
                    const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                    if (chatManager && chatManager._actions) {
                        log('Уведомляем ChatManager об остановке...');
                        await chatManager.postMessage({
                            type: 'NODE_SHUTDOWN',
                            data: {
                                peerId: libp2p?.peerId?.toString(),
                                timestamp: Date.now()
                            }
                        });
                    }
                } catch (error) {
                    log.error('Ошибка уведомления ChatManager: %o', error);
                }

                // 3. Уведомляем GroupManager о остановке
                try {
                    const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                    if (groupManager) {
                        log('Уведомляем GroupManager об остановке...');
                        // Сбрасываем состояние групп
                        groupManager.state.nodeReady = false;
                        groupManager.state.groups = [];
                        groupManager.state.discoveredGroups = [];
                        groupManager.state.joinedGroups = [];

                        // Обновляем UI
                        if (groupManager.fullRender) {
                            await groupManager.fullRender(groupManager.state);
                        }
                    }
                } catch (error) {
                    log.error('Ошибка уведомления GroupManager: %o', error);
                }

                // 4. Останавливаем Libp2p узел
                if (libp2p) {
                    log('Останавливаем Libp2p узел...');
                    await libp2p.stop();
                    libp2p = null;
                    log('Libp2p узел остановлен');
                }

                // 5. Очищаем состояние компонента
                context.state.connected = false;
                context.state.peerId = null;
                context.state.listeningAddresses = [];
                context.state.connectedPeers = [];
                context.state.uptime = '0:00';
                context.state.startTime = null;

                log('Очистка P2P системы завершена');

            } catch (error) {
                log.error('Критическая ошибка при очистке: %o', error);
                context.addError({
                    componentName: context.constructor.name,
                    source: 'cleanup',
                    message: 'Ошибка очистки P2P системы',
                    details: error
                });
                // Продолжаем выполнение даже при ошибках
            }
        },

        /**
         * Перезапускает узел с новыми настройками
         * @async
         * @param {string} mode - Новый режим работы
         */
        async restart(mode) {
            const log = logger('peer-connection:actions:restart');

            try {
                log('Начало перезапуска P2P системы в режиме: %s', mode);

                // 1. Полная очистка текущего состояния
                await this.cleanup();

                // 2. Краткая пауза для завершения операций
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 3. Перезапуск ChatManager
                try {
                    const chatManager = await context.getComponentAsync('chat-manager', 'chat-manager');
                    if (chatManager) {
                        log('Перезапускаем ChatManager...');

                        // Сбрасываем состояние чата
                        chatManager.state.messages = [];
                        chatManager.state.currentGroup = null;
                        chatManager.state.connected = false;

                        // Переинициализируем из новой ноды
                        await chatManager.initializeFromPeerConnection();

                        log('ChatManager перезапущен');
                    }
                } catch (error) {
                    log.error('Ошибка перезапуска ChatManager: %o', error);
                }

                // 4. Перезапуск GroupManager
                try {
                    const groupManager = await context.getComponentAsync('group-manager', 'group-manager');
                    if (groupManager) {
                        log('Перезапускаем GroupManager...');

                        // Сбрасываем состояние групп
                        groupManager.state.groups = [];
                        groupManager.state.discoveredGroups = [];
                        groupManager.state.joinedGroups = [];
                        groupManager.state.nodeReady = false;

                        // Запускаем инициализацию заново
                        await groupManager.startNodeInitialization();

                        log('GroupManager перезапущен');
                    }
                } catch (error) {
                    log.error('Ошибка перезапуска GroupManager: %o', error);
                }

                // 5. Инициализация новой ноды
                log('Инициализируем новую Libp2p ноду...');
                const newLibp2p = await this.initializeLibp2p(mode);

                // 6. Уведомляем компоненты о готовности новой ноды
                await this.notifyComponentsNodeReady();

                log('Перезапуск P2P системы завершен успешно');
                return newLibp2p;

            } catch (error) {
                log.error('Ошибка перезапуска P2P системы: %o', error);
                throw error;
            }
        },

        /**
         * Проверяет статус подключения
         * @returns {boolean} true если узел активен
         */
        isConnected() {
            return libp2p !== null;
        },

        /**
         * Получает статистику подключений
         * @returns {Object} Объект со статистикой
         */
        getConnectionStats() {
            if (!libp2p) {
                return {
                    connected: false,
                    peerCount: 0,
                    connectionCount: 0
                };
            }

            const peers = libp2p.getPeers();
            let connectionCount = 0;

            peers.forEach(peerId => {
                connectionCount += libp2p.getConnections(peerId).length;
            });

            return {
                connected: true,
                peerCount: peers.length,
                connectionCount: connectionCount,
                peerId: libp2p.peerId.toString(),
                addresses: libp2p.getMultiaddrs().map(ma => ma.toString())
            };
        }
    };


    // Обновляем метод initializeLibp2p для включения DHT
    const originalInitializeLibp2p = self.initializeLibp2p;

    self.initializeLibp2p = async function (mode = 'listener') {
        try {
            const libp2pInstance = await originalInitializeLibp2p.call(this, mode);

            // Инициализируем DHT после создания ноды
            const dhtServices = await self.initializeDHT();

            // Добавляем DHT сервисы в конфигурацию
            if (dhtServices.length > 0) {
                libp2pInstance.services.dht = dhtServices;
            }

            // Запускаем обновление DHT пиров
            await self.startDHTPeerUpdates();

            // Публикуем информацию о себе в DHT
            await self.publishToDHT({
                mode: mode,
                capabilities: ['chat', 'groups'],
                version: '1.0.0'
            });

            return libp2pInstance;

        } catch (error) {
            log.error('Error in enhanced initializeLibp2p: %o', error);
            throw error;
        }
    };

    return {
        initializeDHT: self.initializeDHT.bind(self),
        updateDHTPeers: self.updateDHTPeers.bind(self),
        sendDHTPeersToChatInterface: self.sendDHTPeersToChatInterface.bind(self),
        startDHTPeerUpdates: self.startDHTPeerUpdates.bind(self),
        publishToDHT: self.publishToDHT.bind(self),
        findPeersInDHT: self.findPeersInDHT.bind(self),
        updateDHTSettings: self.updateDHTSettings.bind(self),
        initializeLibp2p: self.initializeLibp2p.bind(self),
        setupEventHandlers: self.setupEventHandlers.bind(self),
        startPeerListUpdates: self.startPeerListUpdates.bind(self),
        manualUpdate: self.manualUpdate.bind(self),
        forceUpdate: self.forceUpdate.bind(self),
        updatePeerList: self.updatePeerList.bind(self),
        updateAddressList: self.updateAddressList.bind(self),
        connectToPeer: self.connectToPeer.bind(self),
        getConnectedPeers: self.getConnectedPeers.bind(self),
        getRelayAddresses: self.getRelayAddresses.bind(self),
        subscribeToTopic: self.subscribeToTopic.bind(self),
        sendTopicMessage: self.sendTopicMessage.bind(self),
        getTopicPeers: self.getTopicPeers.bind(self),
        cleanup: self.cleanup.bind(self),
        restart: self.restart.bind(self),
        isConnected: self.isConnected.bind(self),
        getConnectionStats: self.getConnectionStats.bind(self),
        sendPeersToChatInterface: self.sendPeersToChatInterface.bind(self),
        sendConnectionStatusToChatInterface: self.sendConnectionStatusToChatInterface.bind(self)
    };
}