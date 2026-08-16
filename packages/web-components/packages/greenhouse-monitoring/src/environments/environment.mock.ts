// Файл для локальной разработки с моками
export const environment = {
    production: false,

    // API конфигурация
    apiUrl: 'http://localhost:4200/mock-api',
    wsUrl: 'ws://localhost:4200/mock-ws',

    // Настройки приложения
    appName: 'Система мониторинга теплиц (Mock)',
    appVersion: '1.0.0-dev',

    // Настройки API эмуляции
    mockApi: {
        enabled: true,
        delay: 200, // Имитация сетевой задержки
        simulateErrors: true,
        errorRate: 0.2 // 20% вероятность ошибки для тестирования UI
    },

    // Настройки WebSocket
    websocket: {
        enabled: false, // Отключен для моков
        reconnectInterval: 5000,
        heartbeatInterval: 30000
    },

    // Настройки графиков
    charts: {
        defaultTimeRange: 'сутки',
        updateInterval: 30000, // 30 секунд для частого обновления
        maxPoints: 500,
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
        defaultDuration: 1, // 1 минута для тестирования
        minDuration: 1,
        maxDuration: 2
    },

    // Настройки обновления данных
    polling: {
        defaultInterval: 60000, // 1 минута
        quickUpdateInterval: 10000 // 10 секунд
    },

    // Логирование
    logging: {
        enabled: true,
        level: 'debug'
    },

    // Настройки безопасности
    security: {
        sessionTimeout: 3600000,
        tokenRefreshInterval: 300000
    },

    // Mock данные
    mockData: {
        regionsCount: 5,
        greenhousesPerRegion: 3,
        generateRandomData: true,
        dataSeed: 12345 // Для воспроизводимых данных
    }
};