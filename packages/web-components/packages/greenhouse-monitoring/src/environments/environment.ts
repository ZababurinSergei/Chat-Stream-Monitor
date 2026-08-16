// Файл для среды разработки
export const environment = {
    production: false,

    // API конфигурация
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'ws://localhost:3000/ws',

    // Настройки приложения
    appName: 'Система мониторинга теплиц',
    appVersion: '1.0.0',

    // Настройки API эмуляции
    mockApi: {
        enabled: true,
        delay: 300, // Задержка ответа API в мс
        simulateErrors: false,
        errorRate: 0.1 // 10% вероятность ошибки
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
        updateInterval: 60000, // 1 минута
        maxPoints: 1000,
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
        defaultDuration: 15, // минут
        minDuration: 10,
        maxDuration: 30
    },

    // Настройки обновления данных
    polling: {
        defaultInterval: 300000, // 5 минут
        quickUpdateInterval: 60000 // 1 минута для ручного обновления
    },

    // Логирование
    logging: {
        enabled: true,
        level: 'debug'
    },

    // Настройки безопасности
    security: {
        sessionTimeout: 3600000, // 1 час
        tokenRefreshInterval: 300000 // 5 минут
    }
};