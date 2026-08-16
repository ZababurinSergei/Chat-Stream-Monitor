// ============================================
// env.js - Автоматически генерируется бэкендом
// Содержит ID элементов из index.html
// ============================================

const ENV = {
    // ID элементов из index.html
    ELEMENTS: {
        "interfaceCommands": "interfaceCommands",
        "interfaceSections": "interfaceSections",
        "interfaceDependencies": "interfaceDependencies",
        "interfaceBuildCommands": "interfaceBuildCommands",
        "interfaceHttpRequests": "interfaceHttpRequests",
        "interfaceTimestamp": "interfaceTimestamp",
        "httpTotal": "httpTotal",
        "httpWithToken": "httpWithToken",
        "httpWithoutToken": "httpWithoutToken",
        "httpMethods": "httpMethods",
        "httpTypes": "httpTypes",
        "httpTimestamp": "httpTimestamp",
        "statusText": "statusText",
        "progressBar": "progressBar",
        "runWorkflowBtn": "runWorkflowBtn",
        "loadStatusBtn": "loadStatusBtn",
        "loadReportBtn": "loadReportBtn",
        "clearLogsBtn": "clearLogsBtn",
        "interfaceInfo": "interfaceInfo",
        "httpInfo": "httpInfo",
        "validationInfo": "validationInfo",
        "commandsList": "commandsList",
        "reportInfo": "reportInfo",
        "logs": "logs",
        "status": "status",
        "interfaceCard": "interfaceCard",
        "httpCard": "httpCard",
        "validationCard": "validationCard"
    },

    // API endpoints
    API: {
        workflowRun: '/api/workflow/run',
        workflowStatus: '/api/workflow/status',
        interfaceParse: '/api/interface/parse',
        httpParse: '/api/http/parse',
        report: '/api/report'
    },

    // Настройки
    SETTINGS: {
        autoRefreshInterval: 10000,
        maxRetryAttempts: 5,
        retryDelay: 300
    }
};

// Экспортируем в глобальный scope
window.ENV = ENV;

console.log('✅ env.js загружен, найдено элементов:', Object.keys(ENV.ELEMENTS).length);
console.log('📦 ENV:', ENV);
