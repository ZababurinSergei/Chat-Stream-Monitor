// ============================================
// app.js - Полное обновление с гарантией
// ============================================

// ============================================
// Получение ID элементов из ENV
// ============================================
function getElementId(key) {
    if (window.ENV && window.ENV.ELEMENTS) {
        if (window.ENV.ELEMENTS[key]) {
            return window.ENV.ELEMENTS[key];
        }
        for (const [k, v] of Object.entries(window.ENV.ELEMENTS)) {
            if (v === key) {
                return key;
            }
        }
    }
    return key;
}

// ============================================
// Получение API endpoints из ENV
// ============================================
function getApiEndpoint(key) {
    if (window.ENV && window.ENV.API && window.ENV.API[key]) {
        return window.ENV.API[key];
    }
    const fallbacks = {
        workflowRun: '/api/workflow/run',
        workflowStatus: '/api/workflow/status',
        interfaceParse: '/api/interface/parse',
        httpParse: '/api/http/parse',
        report: '/api/report'
    };
    return fallbacks[key] || `/api/${key}`;
}

// ============================================
// Получение настроек из ENV
// ============================================
function getSetting(key, defaultValue) {
    if (window.ENV && window.ENV.SETTINGS && window.ENV.SETTINGS[key] !== undefined) {
        return window.ENV.SETTINGS[key];
    }
    return defaultValue;
}

// ============================================
// Безопасное получение элемента
// ============================================
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Элемент с id "${id}" не найден`);
    }
    return element;
}

// ============================================
// Функция обновления времени с гарантией
// ============================================
function updateTimestamp(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        element.textContent = timeString;
        return true;
    }
    return false;
}

// ============================================
// Функция обновления всех таймстампов
// ============================================
function updateAllTimestamps() {
    const timestampIds = [
        'interfaceTimestampValue',
        'httpTimestampValue',
        'reportTimestamp'
    ];

    let updated = 0;
    timestampIds.forEach(id => {
        if (updateTimestamp(id)) {
            updated++;
        }
    });

    if (updated > 0) {
        console.log(`🕐 Обновлено ${updated} таймстампов`);
    }
    return updated;
}

// ============================================
// Функция безопасного обновления с очисткой
// ============================================
function safeUpdateElement(elementId, value, type = 'text') {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
        if (type === 'text') {
            element.textContent = value;
        } else if (type === 'html') {
            element.innerHTML = value;
        } else if (type === 'badge') {
            element.textContent = value;
            if (!element.classList.contains('badge')) {
                element.classList.add('badge');
            }
        }
        return true;
    } catch (error) {
        console.error(`❌ Ошибка обновления ${elementId}:`, error);
        return false;
    }
}

// ============================================
// Полная очистка и перерисовка команд с деталями
// ============================================
function renderCommands(commands, validation) {
    const commandsList = document.getElementById('commandsList');
    if (!commandsList) return;

    // Полная очистка
    commandsList.innerHTML = '';

    if (!commands || commands.length === 0) {
        commandsList.innerHTML = `
            <div class="command-item" style="justify-content:center;color:#999;padding:20px;">
                ⚠️ Команды не найдены. Проверьте INTERFACE.md
            </div>
        `;
        return;
    }

    // Статистика команд
    const stats = {
        total: commands.length,
        withHttp: commands.filter(c => c.httpRequests && c.httpRequests.length > 0).length,
        matched: validation?.matched?.length || 0,
        missing: validation?.missing?.length || 0
    };

    // Добавляем заголовок со статистикой
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        gap: 20px;
        padding: 10px 0;
        margin-bottom: 10px;
        border-bottom: 2px solid #667eea;
        font-size: 13px;
        color: #666;
        flex-wrap: wrap;
    `;
    header.innerHTML = `
        <span>📊 Всего: <strong>${stats.total}</strong></span>
        <span>🌐 С HTTP: <strong>${stats.withHttp}</strong></span>
        <span>✅ Совпало: <strong style="color:#28a745;">${stats.matched}</strong></span>
        <span>❌ Отсутствует: <strong style="color:#dc3545;">${stats.missing}</strong></span>
    `;
    commandsList.appendChild(header);

    // Перерисовка всех команд
    commands.forEach((cmd, index) => {
        const isMatched = validation?.matched?.some(
            m => m.command && m.command.id === cmd.id
        );
        const status = isMatched ? '✅' : '❌';
        const hasHttp = cmd.httpRequests && cmd.httpRequests.length > 0;
        const hasExamples = cmd.examples && cmd.examples.length > 0;
        const hasOptions = cmd.options && cmd.options.length > 0;

        const commandDiv = document.createElement('div');
        commandDiv.className = 'command-item';
        commandDiv.id = `commandItem_${index}`;
        commandDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 8px;
            border-bottom: 1px solid #f0f0f0;
            flex-wrap: wrap;
            ${isMatched ? 'background: #f8fff8;' : 'background: #fff8f8;'}
            border-radius: 4px;
            margin: 2px 0;
        `;

        // Статус
        const statusSpan = document.createElement('span');
        statusSpan.id = `commandStatus_${index}`;
        statusSpan.textContent = status;
        statusSpan.style.fontSize = '16px';
        commandDiv.appendChild(statusSpan);

        // ID
        const idSpan = document.createElement('span');
        idSpan.id = `commandId_${index}`;
        idSpan.textContent = `${cmd.id}.`;
        idSpan.style.fontWeight = 'bold';
        idSpan.style.color = '#667eea';
        commandDiv.appendChild(idSpan);

        // Имя
        const nameStrong = document.createElement('strong');
        nameStrong.id = `commandName_${index}`;
        nameStrong.textContent = cmd.name || 'Без названия';
        nameStrong.style.flex = '1';
        nameStrong.style.minWidth = '150px';
        commandDiv.appendChild(nameStrong);

        // Тип (с цветом)
        const typeColors = {
            'http': '#17a2b8',
            'build': '#28a745',
            'test': '#fd7e14',
            'run': '#6f42c1',
            'install': '#20c997',
            'clean': '#dc3545',
            'debug': '#ffc107',
            'config': '#6c757d',
            'git': '#f39c12',
            'check': '#3498db',
            'help': '#95a5a6',
            'option': '#2ecc71',
            'dependency': '#9b59b6',
            'command': '#7f8c8d'
        };
        const typeColor = typeColors[cmd.type] || '#7f8c8d';

        const typeSpan = document.createElement('span');
        typeSpan.className = 'badge';
        typeSpan.id = `commandType_${index}`;
        typeSpan.textContent = cmd.type || 'command';
        typeSpan.style.cssText = `
            background: ${typeColor}22;
            color: ${typeColor};
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid ${typeColor}44;
        `;
        commandDiv.appendChild(typeSpan);

        // HTTP запросы
        if (hasHttp) {
            const httpSpan = document.createElement('span');
            httpSpan.style.cssText = 'font-size:12px;color:#999;';
            httpSpan.id = `commandHttpCount_${index}`;
            httpSpan.textContent = `🌐 ${cmd.httpRequests.length} HTTP`;
            commandDiv.appendChild(httpSpan);
        }

        // Примеры
        if (hasExamples) {
            const exampleSpan = document.createElement('span');
            exampleSpan.style.cssText = 'font-size:12px;color:#17a2b8;cursor:pointer;';
            exampleSpan.textContent = '📝 пример';
            exampleSpan.title = cmd.examples.map(e => e.code).join('\n');
            exampleSpan.onclick = () => {
                alert(`Пример для ${cmd.name}:\n\n${cmd.examples.map(e => e.code).join('\n\n')}`);
            };
            commandDiv.appendChild(exampleSpan);
        }

        // Описание (краткое)
        if (cmd.description && cmd.description.length > 0) {
            const descSpan = document.createElement('span');
            descSpan.style.cssText = 'font-size:11px;color:#999;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            const shortDesc = cmd.description.length > 50 ? cmd.description.substring(0, 50) + '...' : cmd.description;
            descSpan.textContent = shortDesc;
            descSpan.title = cmd.description;
            commandDiv.appendChild(descSpan);
        }

        commandsList.appendChild(commandDiv);
    });

    console.log(`✅ Перерисовано ${commands.length} команд`);
}

// ============================================
// Полное обновление INTERFACE.md
// ============================================
function renderInterface(interfaceData) {
    if (!interfaceData) return;

    const container = document.getElementById('interfaceInfo');
    if (!container) return;

    // Полная очистка
    container.innerHTML = '';

    // Создаем структуру с данными
    const stats = [
        { label: 'Команды', value: interfaceData.commands?.length || 0, badge: true },
        { label: 'Секции', value: interfaceData.sections?.length || 0 },
        { label: 'Зависимости', value: (interfaceData.dependencies?.required?.length || 0) + (interfaceData.dependencies?.optional?.length || 0) },
        { label: 'Build команды', value: interfaceData.buildInfo?.commands?.length || 0 },
        { label: 'HTTP запросов в командах', value: calculateHttpRequests(interfaceData.commands) },
        { label: 'Последнее обновление', value: getCurrentTime(), id: 'interfaceTimestampValue' }
    ];

    stats.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = stat.label;
        div.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        if (stat.id) {
            valueSpan.id = stat.id;
        }
        if (stat.badge) {
            valueSpan.className = 'badge badge-info';
        }
        valueSpan.textContent = stat.value;
        div.appendChild(valueSpan);

        container.appendChild(div);
    });

    console.log('✅ INTERFACE.md перерисован');
}

// ============================================
// Полное обновление request.http
// ============================================
function renderHttp(httpData) {
    if (!httpData) return;

    const container = document.getElementById('httpInfo');
    if (!container) return;

    // Полная очистка
    container.innerHTML = '';

    const withToken = httpData.filter(req => req.body && req.body.includes('{{token}}')).length;

    // Подсчет методов
    const methods = {};
    httpData.forEach(req => {
        methods[req.method] = (methods[req.method] || 0) + 1;
    });
    const methodsStr = Object.entries(methods)
        .map(([method, count]) => `${method}(${count})`)
        .join(', ') || '-';

    // Подсчет типов
    const types = {};
    httpData.forEach(req => {
        const type = req.type || 'unknown';
        types[type] = (types[type] || 0) + 1;
    });
    const typesStr = Object.entries(types)
        .map(([type, count]) => `${type}(${count})`)
        .join(', ') || '-';

    const stats = [
        { label: 'Всего запросов', value: httpData.length || 0, badge: true, id: 'httpTotalBadge' },
        { label: 'С токеном', value: withToken, id: 'httpWithTokenValue' },
        { label: 'Без токена', value: (httpData.length || 0) - withToken, id: 'httpWithoutTokenValue' },
        { label: 'Методы', value: methodsStr, id: 'httpMethodsValue', style: 'font-size:12px;' },
        { label: 'Типы запросов', value: typesStr, id: 'httpTypesValue', style: 'font-size:12px;' },
        { label: 'Последнее обновление', value: getCurrentTime(), id: 'httpTimestampValue' }
    ];

    stats.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = stat.label;
        div.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        if (stat.id) valueSpan.id = stat.id;
        if (stat.style) valueSpan.style.cssText = stat.style;
        if (stat.badge) valueSpan.className = 'badge badge-info';
        valueSpan.textContent = stat.value;
        div.appendChild(valueSpan);

        container.appendChild(div);
    });

    console.log('✅ request.http перерисован');
}

// ============================================
// Полное обновление валидации
// ============================================
function renderValidation(validation) {
    if (!validation) return;

    const container = document.getElementById('validationInfo');
    if (!container) return;

    // Полная очистка
    container.innerHTML = '';

    const v = validation.summary || {};
    const stats = [
        { label: '✅ Совпало', value: v.matched || 0, badge: 'success' },
        { label: '❌ Отсутствует', value: v.missing || 0, badge: 'danger' },
        { label: '➕ Лишние', value: v.extra || 0, badge: 'warning' },
        { label: 'Всего команд', value: v.total || 0 }
    ];

    stats.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = stat.label;
        div.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        if (stat.badge) {
            valueSpan.className = `badge badge-${stat.badge}`;
        }
        valueSpan.textContent = stat.value;
        div.appendChild(valueSpan);

        container.appendChild(div);
    });

    console.log('✅ Валидация перерисована');
}

// ============================================
// Полное обновление отчета
// ============================================
function renderReport(report) {
    const container = document.getElementById('reportInfo');
    if (!container) return;

    // Полная очистка
    container.innerHTML = '';

    if (!report) {
        container.innerHTML = '<div class="stat">⚠️ Отчет не найден. Запустите workflow.</div>';
        return;
    }

    const stats = [
        { label: '📖 Всего команд', value: report?.interface?.totalCommands || 0, id: 'reportTotalCommands' },
        { label: '📄 Всего запросов', value: report?.http?.totalRequests || 0, id: 'reportTotalRequests' },
        { label: '✅ Совпало', value: report?.validation?.summary?.matched || 0, badge: 'success', id: 'reportMatched' },
        { label: '❌ Отсутствует', value: report?.validation?.summary?.missing || 0, badge: 'danger', id: 'reportMissing' },
        { label: '➕ Лишние', value: report?.validation?.summary?.extra || 0, badge: 'warning', id: 'reportExtra' },
        { label: '📅 Дата', value: report?.timestamp ? new Date(report.timestamp).toLocaleString() : getCurrentTime(), id: 'reportTimestamp' },
        { label: '📦 Проект', value: report?.metadata?.project || '-', id: 'reportProject' }
    ];

    stats.forEach(stat => {
        const div = document.createElement('div');
        div.className = 'stat';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = stat.label;
        div.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        if (stat.id) valueSpan.id = stat.id;
        if (stat.badge) valueSpan.className = `badge badge-${stat.badge}`;
        valueSpan.textContent = stat.value;
        div.appendChild(valueSpan);

        container.appendChild(div);
    });

    console.log('✅ Отчет перерисован');
}

// ============================================
// Вспомогательные функции
// ============================================
function calculateHttpRequests(commands) {
    let count = 0;
    if (commands) {
        commands.forEach(cmd => {
            if (cmd.httpRequests) {
                count += cmd.httpRequests.length;
            }
        });
    }
    return count;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ============================================
// Модуль работы с INTERFACE.md
// ============================================
class InterfaceModule {
    static async loadData() {
        try {
            const url = getApiEndpoint('interfaceParse');
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data) {
                renderInterface(data.data);
                // Обновляем команды после загрузки INTERFACE.md
                if (data.data.commands) {
                    // Ждем валидацию из состояния
                    const stateResponse = await fetch(getApiEndpoint('workflowStatus'));
                    const stateData = await stateResponse.json();
                    const validation = stateData.success ? stateData.state?.validation : null;
                    renderCommands(data.data.commands, validation);
                }
                return data.data;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки INTERFACE.md:', error);
        }
        return null;
    }
}

// ============================================
// Модуль работы с request.http
// ============================================
class HttpModule {
    static async loadData() {
        try {
            const url = getApiEndpoint('httpParse');
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data) {
                renderHttp(data.data);
                return data.data;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки request.http:', error);
        }
        return null;
    }
}

// ============================================
// Модуль работы с отчетом
// ============================================
class ReportModule {
    static async load() {
        try {
            const url = getApiEndpoint('report');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && data.data) {
                renderReport(data.data);
                LoggerModule.add('info', '📊 Отчет загружен');
            } else {
                renderReport(null);
                LoggerModule.add('warning', '⚠️ Отчет не найден. Запустите workflow.');
            }
        } catch (error) {
            renderReport(null);
            LoggerModule.add('error', '❌ Ошибка загрузки отчета: ' + error.message);
        }
    }
}

// ============================================
// Модуль логов
// ============================================
class LoggerModule {
    static add(type, message) {
        const logs = document.getElementById('logs');
        if (!logs) return;

        const colors = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        const time = getCurrentTime();
        const color = colors[type] || 'info';
        logs.insertAdjacentHTML('beforeend', `<div class="${color}">[${time}] ${message}</div>`);
        logs.scrollTop = logs.scrollHeight;
    }

    static clear() {
        const logs = document.getElementById('logs');
        if (logs) {
            logs.innerHTML = 'Логи очищены';
        }
        LoggerModule.add('info', '🗑️ Логи очищены');
    }
}

// ============================================
// Модуль UI обновления
// ============================================
class UIModule {
    static update(state) {
        if (!state) {
            return;
        }

        // Обновляем INTERFACE.md
        if (state.interface && state.interface.commands) {
            renderInterface(state.interface);
            renderCommands(state.interface.commands, state.validation);
        }

        // Обновляем request.http
        if (state.http && state.http.requests) {
            renderHttp(state.http.requests);
        }

        // Обновляем валидацию
        if (state.validation && state.validation.summary) {
            renderValidation(state.validation);
        }

        // Обновляем таймстампы
        updateAllTimestamps();

        console.log('🔄 UI полностью обновлен');
    }
}

// ============================================
// Основные функции (глобальные для кнопок)
// ============================================
window.runWorkflow = async function() {
    LoggerModule.add('info', '🚀 Запуск workflow...');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');

    if (progressBar) progressBar.style.width = '50%';
    if (statusText) statusText.textContent = '⏳ Выполнение...';

    try {
        const url = getApiEndpoint('workflowRun');
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            UIModule.update(data.result);
            if (progressBar) progressBar.style.width = '100%';
            if (statusText) statusText.textContent = '✅ Workflow завершен успешно!';
            LoggerModule.add('success', '✨ Workflow успешно завершен!');
            LoggerModule.add('info', '📁 Результаты сохранены в .metaflow/');

            await ReportModule.load();
            LoggerModule.add('info', '🔄 Все данные обновлены');

            setTimeout(() => updateAllTimestamps(), 100);
        } else {
            if (statusText) statusText.textContent = '❌ Ошибка: ' + (data.error || 'Неизвестная ошибка');
            LoggerModule.add('error', '❌ Ошибка выполнения: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        if (statusText) statusText.textContent = '❌ Ошибка: ' + error.message;
        LoggerModule.add('error', '❌ Ошибка: ' + error.message);
    }
};

window.loadStatus = async function() {
    try {
        const url = getApiEndpoint('workflowStatus');
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
            UIModule.update(data.state);
            LoggerModule.add('info', '🔄 Все данные обновлены');
            setTimeout(() => updateAllTimestamps(), 100);
        } else {
            LoggerModule.add('warning', '⚠️ Не удалось загрузить статус');
        }
    } catch (error) {
        LoggerModule.add('error', '❌ Ошибка загрузки статуса: ' + error.message);
    }
};

window.loadReport = ReportModule.load;
window.clearLogs = LoggerModule.clear;

// ============================================
// Таймер для автоматического обновления времени
// ============================================
let timeUpdateInterval = null;

function startTimeUpdater() {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }
    timeUpdateInterval = setInterval(() => {
        updateAllTimestamps();
    }, 1000);
    console.log('⏰ Таймер обновления времени запущен');
}

// ============================================
// Проверка загрузки ENV
// ============================================
function waitForEnv(maxAttempts = 20, delay = 200) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            if (window.ENV && window.ENV.ELEMENTS) {
                console.log('✅ ENV загружен:', Object.keys(window.ENV.ELEMENTS).length, 'элементов');
                resolve(true);
                return;
            }
            if (attempts >= maxAttempts) {
                console.warn('⚠️ ENV не загружен после', maxAttempts, 'попыток');
                resolve(false);
                return;
            }
            setTimeout(check, delay);
        };
        check();
    });
}

// ============================================
// Инициализация
// ============================================
(async function init() {
    console.log('🚀 Инициализация UI...');

    await waitForEnv();

    // Загружаем INTERFACE.md и request.http параллельно
    await Promise.all([
        InterfaceModule.loadData(),
        HttpModule.loadData(),
        window.loadStatus(),
        window.loadReport()
    ]);

    startTimeUpdater();

    const refreshInterval = getSetting('autoRefreshInterval', 10000);
    LoggerModule.add('success', '✅ UI инициализирован');
    LoggerModule.add('info', `🔄 Автообновление данных каждые ${refreshInterval / 1000} секунд`);
    LoggerModule.add('info', '🕐 Время обновляется каждую секунду');

    setInterval(() => {
        InterfaceModule.loadData();
        HttpModule.loadData();
        window.loadStatus();
    }, refreshInterval);
})();
