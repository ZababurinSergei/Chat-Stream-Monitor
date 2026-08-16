// Файл для staging среды
export const environment = {
    production: false,

    // API конфигурация
    apiUrl: 'https://staging-api.greenhouse-monitoring.com/api',
    wsUrl: 'wss://staging-api.greenhouse-monitoring.com/ws',

    // Настройки приложения
    appName: 'Система мониторинга теплиц (Staging)',
    appVersion: '1.0.0-beta',

    // Настройки API эмуляции
    mockApi: {
        enabled: false,
        delay: 100,
        simulateErrors: true,
        errorRate: 0.05 // 5% вероятность ошибки для тестирования
    },

    // Настройки WebSocket
    websocket: {
        enabled: true,
        reconnectInterval: 5000,
        heartbeatInterval: 30000
    },

    // Настройки графиков
    charts: {
        defaultTimeRange: 'сутки',
        updateInterval: 120000, // 2 минуты
        maxPoints: 2000,
        colors: {
            temperature: '#FF6384',
            humidity: '#36A2EB',
            acidity: '#FFCE56'
        }
    },

    // Настройки ролей
    roles: {
        default: 'senior-specialist',
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
        level: 'warn'
    },

    // Настройки безопасности
    security: {
        sessionTimeout: 3600000,
        tokenRefreshInterval: 300000
    }
};