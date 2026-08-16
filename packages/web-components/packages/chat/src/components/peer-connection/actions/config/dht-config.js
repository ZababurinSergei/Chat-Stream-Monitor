// /10/config/dht-config.js
export const DHT = {
    ENABLE_LAN_DHT: true,
    ENABLE_AMINO_DHT: true,
    ENABLE_UNIVERSE_DHT: true
}

export const kadDHTConfig = {
    // Basic DHT configuration
    kBucketSize: 1,
    prefixLength: 2,
    alpha: 4,
    disjointPaths: 4,
    clientMode: false,
    protocol: "/ipfs/kad/1.0.0",
    logPrefix: "libp2p:kad-dht",
    datastorePrefix: "/dht",
    metricsPrefix: "libp2p_kad_dht",

    // Query intervals
    querySelfInterval: 30000,
    initialQuerySelfInterval: 1000,
    allowQueryWithZeroPeers: true,

    // Ping settings for old contacts
    pingOldContactTimeout: undefined,
    pingOldContactConcurrency: 10,
    pingOldContactMaxQueueSize: 100,

    // Ping settings for new contacts
    pingNewContactTimeout: undefined,
    pingNewContactConcurrency: 10,
    pingNewContactMaxQueueSize: 100,

    // Stream settings
    maxInboundStreams: 32,
    maxOutboundStreams: 64,

    validators: {},
    selectors: {},
    // Providers configuration
    providers: {
        cacheSize: 256,
        cleanupInterval: 5400,
        provideValidity: 86400
    },

    // Reproviding configuration
    reprovide: {
        concurrency: 10,
        maxQueueSize: 16384,
        threshold: 86400000, // 24 hours
        interval: 3600000, // 1 hour
        validity: 172800000 // 48 hours
    },

    // Peer info mapper (will be set by the consumer)
    peerInfoMapper: undefined,

    // Network timeouts
    networkDialTimeout: undefined,
    onPeerConnectTimeout: 10000,
    incomingMessageTimeout: 10000
};