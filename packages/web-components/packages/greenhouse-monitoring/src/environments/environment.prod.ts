// Файл для продакшн среды
export const environment = {
    production: true,

    // API конфигурация
    apiUrl: 'https://api.greenhouse-monitoring.com/api',
    wsUrl: 'wss://api.greenhouse-monitoring.com/ws',

    // Настройки приложения
    appName: 'Система мониторинга теплиц',
    appVersion: '1.0.0',

    // Настройки API эмуляции
    mockApi: {
        enabled: false,
        delay: 0,
        simulateErrors: false,
        errorRate: 0
    },

    // Настройки WebSocket
    websocket: {
        enabled: true,
        reconnectInterval: 10000,
        heartbeatInterval: 60000
    },

    // Настройки графиков
    charts: {
        defaultTimeRange: 'сутки',
        updateInterval: 300000, // 5 минут
        maxPoints: 5000,
        colors: {
            temperature: '#FF6384',
            humidity: '#36A2EB',
            acidity: '#FFCE56'
        }
    },

    // Настройки ролей
    roles: {
        default: 'specialist',
        available: ['specialist', 'senior-specialist']
    },

    // Настройки статусов
    statuses: {
        thresholds: {
            temperature: { min: 15, max: 35, normal: 18, warning: 10 },
            humidity: { min: 40, max: 80, normal: 60, warning: 20 },
            acidity: { min: 5.5, max: 7.5, normal: 6.5, warning: 1 }
        },
        colors: {
            normal: '#4CAF50',
            warning: '#FFC107',
            emergency: '#F44336'
        }
    },

    // Настройки пересчёта состояний
    recalculation: {
        defaultDuration: 15,
        minDuration: 10,
        maxDuration: 30
    },

    // Настройки обновления данных
    polling: {
        defaultInterval: 300000,
        quickUpdateInterval: 60000
    },

    // Логирование
    logging: {
        enabled: true,
        level: 'error'
    },

    // Настройки безопасности
    security: {
        sessionTimeout: 1800000, // 30 минут
        tokenRefreshInterval: 300000
    }
};