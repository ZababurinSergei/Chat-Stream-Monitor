// /10/config/index.js
import { kadDHTConfig } from './dht-config.js';
import { removePublicAddressesMapper, removePrivateAddressesMapper, passthroughMapper } from '@libp2p/kad-dht'

const RENDER_EXTERNAL_HOSTNAME = 'youtube'
const PORT = 8311

const getAddressesConfig = () => {
    console.log('нужна реализация')
}

const BOOTSTRAP_NODES = [
    '/dns4/relay-1-wk36.onrender.com/wss/p2p/12D3KooWQotGHFhPdMt1zWhcX5rdYNrCccA16qc2AvEYyxGsTFfg',
    '/dns4/relay-0.onrender.com/wss/p2p/12D3KooWBHSGgQQNinaUn9mtx7iqfQSM3sb1Fr1aCnkqLnyeT88i',
    '/dns4/92.101.120.30/tcp/6835/ws/p2p/12D3KooWSSixS7BBVNLqxK77JyUhYd7khX1PV7nBGKXEqbi6hwEB',
    '/dns4/92.101.120.30/tcp/6853/ws/p2p/12D3KooWCHTTsH1DeDFxvJcV8HgxDyhrPEiCdTHPTxDBz7Pp5JyQ'
];

export { BOOTSTRAP_NODES, RENDER_EXTERNAL_HOSTNAME, PORT, getAddressesConfig }

export const CONFIG = {
    MAX_CONNECTIONS: 100,
    MAX_SSE_CLIENTS: 50,
    CONNECTION_CLEANUP_INTERVAL: 30000,
    BLOCK_DURATION: 30000,
    PING_INTERVAL: 60000,

    // Circuit Relay
    RELAY_MAX_RESERVATIONS: 2500,
    // RELAY_RESERVATION_TTL: 2 * 60 * 60 * 1000,
    RELAY_RESERVATION_TTL:  20 * 60 * 1000,
    RELAY_DEFAULT_DATA_LIMIT: BigInt(128 * 1024 * 1024),
    RELAY_DEFAULT_DURATION_LIMIT: 120 * 60 * 1000,
    RELAY_MAX_INBOUND_STREAMS: 10,
    RELAY_MAX_OUTBOUND_STREAMS: 10,


    // KAD-DHT Configuration
    DHT: {
        LAN: {
            BUCKET_SIZE: 2,
            PROTOCOL: '/ipfs/lan/kad/1.0.0',
            CLIENT_MODE: false,
            LOG_PREFIX: 'libp2p:lan-dht',
            DATASOURCE_PREFIX: '/lan/dht',
            METRICS_PREFIX: 'libp2p_dht_lan',
            // MAX_RECORD_AGE: 36 * 60 * 60 * 1000, // 36 hours
            MAX_RECORD_AGE: 14000, // 36 hours
            QUERY_TIMEOUT: 10000,
            QUERY_CONCURRENCY: 10,
            // Новые настройки для метрик
            ENABLE_METRICS: true,
            METRICS: {
                enabled: true,
                collectQueryMetrics: true,
                collectPeerMetrics: true,
                collectRoutingTableMetrics: true
            }
        },
        AMINO: {
            BUCKET_SIZE: 2,
            PROTOCOL: '/ipfs/kad/1.0.0',
            CLIENT_MODE: false,
            LOG_PREFIX: 'libp2p:amino-dht',
            DATASOURCE_PREFIX: '/amino/dht',
            METRICS_PREFIX: 'libp2p_dht_amino',
            MAX_RECORD_AGE: 36 * 60 * 60 * 1000,
            QUERY_TIMEOUT: 10000,
            QUERY_CONCURRENCY: 10,
            ENABLE_METRICS: true,
            METRICS: {
                enabled: true,
                collectQueryMetrics: true,
                collectPeerMetrics: true,
                collectRoutingTableMetrics: true
            }
        },
        UNIVERSE: {
            BUCKET_SIZE: 2,
            PROTOCOL: '/universe/kad/1.0.0',
            CLIENT_MODE: false,
            LOG_PREFIX: 'libp2p:universe-dht',
            DATASOURCE_PREFIX: '/universe/dht',
            METRICS_PREFIX: 'libp2p_dht_universe',
            // MAX_RECORD_AGE: 36 * 60 * 60 * 1000,
            MAX_RECORD_AGE: 10000,
            QUERY_TIMEOUT: 10000,
            QUERY_CONCURRENCY: 10,
            ENABLE_METRICS: true,
            METRICS: {
                enabled: true,
                collectQueryMetrics: true,
                collectPeerMetrics: true,
                collectRoutingTableMetrics: true
            }
        }
    }
};

export const KAD_DHT_CONFIG = {
    DHT: {
        LAN: {
            ...kadDHTConfig,
            kBucketSize: CONFIG.DHT.LAN.BUCKET_SIZE,
            prefixLength: 1,
            protocol: CONFIG.DHT.LAN.PROTOCOL,
            clientMode: CONFIG.DHT.LAN.CLIENT_MODE,
            logPrefix: CONFIG.DHT.LAN.LOG_PREFIX,
            datastorePrefix: CONFIG.DHT.LAN.DATASOURCE_PREFIX,
            metricsPrefix: CONFIG.DHT.LAN.METRICS_PREFIX,
            maxRecordAge: CONFIG.DHT.LAN.MAX_RECORD_AGE,
            queryTimeout: CONFIG.DHT.LAN.QUERY_TIMEOUT,
            queryConcurrency: CONFIG.DHT.LAN.QUERY_CONCURRENCY,
            querySelfInterval: 10000,
            peerInfoMapper: removePublicAddressesMapper
        },
        AMINO: {
            ...kadDHTConfig,
            protocol: CONFIG.DHT.AMINO.PROTOCOL,
            clientMode: CONFIG.DHT.AMINO.CLIENT_MODE,
            logPrefix: CONFIG.DHT.AMINO.LOG_PREFIX,
            datastorePrefix: CONFIG.DHT.AMINO.DATASOURCE_PREFIX,
            metricsPrefix: CONFIG.DHT.AMINO.METRICS_PREFIX,
            kBucketSize: CONFIG.DHT.AMINO.BUCKET_SIZE,
            prefixLength: 2,
            maxRecordAge: CONFIG.DHT.AMINO.MAX_RECORD_AGE,
            queryTimeout: CONFIG.DHT.AMINO.QUERY_TIMEOUT,
            queryConcurrency: CONFIG.DHT.AMINO.QUERY_CONCURRENCY,
            querySelfInterval: 10000,
            peerInfoMapper: removePrivateAddressesMapper
        },
        UNIVERSE: {
            ...kadDHTConfig,
            protocol: CONFIG.DHT.UNIVERSE.PROTOCOL,
            clientMode: CONFIG.DHT.UNIVERSE.CLIENT_MODE,
            logPrefix: CONFIG.DHT.UNIVERSE.LOG_PREFIX,
            datastorePrefix: CONFIG.DHT.UNIVERSE.DATASOURCE_PREFIX,
            metricsPrefix: CONFIG.DHT.UNIVERSE.METRICS_PREFIX,
            kBucketSize: CONFIG.DHT.UNIVERSE.BUCKET_SIZE,
            prefixLength: 5,
            maxRecordAge: CONFIG.DHT.UNIVERSE.MAX_RECORD_AGE,
            queryTimeout: CONFIG.DHT.UNIVERSE.QUERY_TIMEOUT,
            queryConcurrency: CONFIG.DHT.UNIVERSE.QUERY_CONCURRENCY,
            querySelfInterval: 10000,
            peerInfoMapper: passthroughMapper
        }
    }
};