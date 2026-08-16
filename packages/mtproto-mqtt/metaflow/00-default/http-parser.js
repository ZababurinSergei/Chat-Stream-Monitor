/**
 * HTTP Parser for .http files
 * Парсит файлы формата .http и извлекает HTTP запросы
 * Поддерживает переменные {{token}}, комментарии ### и многострочные тела
 *
 * @module http-parser
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Конфигурация парсера
 */
const CONFIG = {
    // Максимальный размер файла (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    // Поддерживаемые HTTP методы
    METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    // Заголовки по умолчанию
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json'
    },
    // Паттерны для поиска переменных
    VARIABLE_PATTERN: /\{\{([^}]+)\}\}/g
};

/**
 * Парсит .http файл и возвращает массив запросов с метаданными
 *
 * @param {string} filePath - Путь к .http файлу
 * @param {Object} options - Опции парсинга
 * @param {Object} options.variables - Переменные для подстановки
 * @param {boolean} options.autoDetect - Автоматически определять типы запросов
 * @returns {Array<Object>} Массив запросов
 */
export function parseHttpFile(filePath, options = {}) {
    // Проверка существования файла
    if (!fs.existsSync(filePath)) {
        throw new Error(`Файл ${filePath} не найден`);
    }

    // Проверка размера файла
    const stats = fs.statSync(filePath);
    if (stats.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Файл ${filePath} слишком большой (${stats.size} байт)`);
    }

    // Чтение файла
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Парсинг
    const requests = [];
    let currentRequest = null;
    let inBody = false;
    let bodyLines = [];
    let description = '';
    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
        lineNumber = i + 1;
        let rawLine = lines[i];
        let line = rawLine.trim();

        // Пропускаем пустые строки если не в теле запроса
        if (!line && !inBody) {
            continue;
        }

        // Обработка комментариев с описанием
        if (line.startsWith('###')) {
            // Сохраняем текущий запрос если есть
            if (currentRequest && bodyLines.length > 0) {
                currentRequest.body = bodyLines.join('\n').trim();
                bodyLines = [];
                inBody = false;
            }

            // Сохраняем описание
            description = line.replace('###', '').trim();

            // Если предыдущий запрос был без описания, обновляем его
            if (currentRequest && !currentRequest.description) {
                currentRequest.description = description;
                currentRequest.name = description;
            }

            continue;
        }

        // Обработка однострочных комментариев
        if (line.startsWith('#')) {
            continue;
        }

        // Обработка директив > {%
        if (line.startsWith('> {')) {
            // Это директива клиента - пропускаем
            continue;
        }

        // Проверяем начало запроса (GET, POST, PUT, DELETE, PATCH)
        const methodMatch = line.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)/);
        if (methodMatch) {
            // Сохраняем предыдущий запрос
            if (currentRequest) {
                if (bodyLines.length > 0) {
                    currentRequest.body = bodyLines.join('\n').trim();
                    bodyLines = [];
                }
                // Добавляем запрос в список
                requests.push(currentRequest);
            }

            // Создаем новый запрос
            const method = methodMatch[1];
            const url = methodMatch[2].trim();

            currentRequest = {
                method: method,
                url: url,
                headers: { ...CONFIG.DEFAULT_HEADERS },
                body: '',
                description: description || `Запрос ${requests.length + 1}`,
                name: description || `Запрос ${requests.length + 1}`,
                raw: rawLine,
                lineNumber: lineNumber,
                variables: {},
                type: 'api' // Будет определен позже
            };

            inBody = false;
            description = '';
            continue;
        }

        // Парсим заголовки
        if (currentRequest && !inBody) {
            const headerMatch = line.match(/^([^:]+):\s*(.+)/);
            if (headerMatch) {
                const key = headerMatch[1].trim();
                const value = headerMatch[2].trim();
                currentRequest.headers[key] = value;
                continue;
            }

            // Пустая строка - начало тела запроса
            if (line === '' && currentRequest) {
                inBody = true;
                bodyLines = [];
                continue;
            }
        }

        // Собираем тело запроса
        if (currentRequest && (inBody || line !== '')) {
            if (line !== '' || (inBody && bodyLines.length > 0)) {
                bodyLines.push(rawLine);
            }
        }
    }

    // Добавляем последний запрос
    if (currentRequest) {
        if (bodyLines.length > 0) {
            currentRequest.body = bodyLines.join('\n').trim();
        }
        requests.push(currentRequest);
    }

    // Пост-обработка: извлечение метаданных и типов
    requests.forEach((req, index) => {
        // Извлекаем номер команды из описания
        const cmdMatch = req.description.match(/(\d+)\.\s*/);
        if (cmdMatch) {
            req.command = parseInt(cmdMatch[1]);
        } else {
            req.command = index + 1;
        }

        // Извлекаем название команды
        const nameMatch = req.description.match(/\d+\.\s*([^-]+)/);
        if (nameMatch) {
            req.commandName = nameMatch[1].trim();
        } else {
            req.commandName = req.description;
        }

        // Определяем тип запроса по URL и телу
        if (req.url.includes('/common')) {
            req.type = 'auth';
        } else if (req.body && req.body.includes('active-user/get')) {
            req.type = 'get_active';
        } else if (req.body && req.body.includes('login-attempt/last-success/get')) {
            req.type = 'get_last_login';
        } else if (req.body && req.body.includes('active-users-with-last-login/get')) {
            req.type = 'get_all_active';
        } else if (req.url.includes('/api')) {
            req.type = 'api';
        }

        // Извлекаем API метод из тела
        if (req.body) {
            try {
                const bodyObj = JSON.parse(req.body);
                if (bodyObj.api) {
                    req.apiMethod = bodyObj.api;
                }
            } catch (e) {
                // Не JSON
            }
        }

        // Извлекаем переменные из URL и тела
        extractVariables(req);
    });

    // Применяем подстановку переменных если они переданы
    if (options.variables) {
        applyVariables(requests, options.variables);
    }

    return requests;
}

/**
 * Извлекает переменные из запроса
 *
 * @param {Object} request - Объект запроса
 */
function extractVariables(request) {
    const variables = {};

    // Поиск переменных в URL
    const urlMatches = request.url.match(CONFIG.VARIABLE_PATTERN);
    if (urlMatches) {
        urlMatches.forEach(match => {
            const varName = match.replace(/\{\{|\}\}/g, '');
            variables[varName] = true;
        });
    }

    // Поиск переменных в теле
    if (request.body) {
        const bodyMatches = request.body.match(CONFIG.VARIABLE_PATTERN);
        if (bodyMatches) {
            bodyMatches.forEach(match => {
                const varName = match.replace(/\{\{|\}\}/g, '');
                variables[varName] = true;
            });
        }

        // Поиск переменных в заголовках
        Object.keys(request.headers).forEach(key => {
            const headerMatches = request.headers[key].match(CONFIG.VARIABLE_PATTERN);
            if (headerMatches) {
                headerMatches.forEach(match => {
                    const varName = match.replace(/\{\{|\}\}/g, '');
                    variables[varName] = true;
                });
            }
        });
    }

    request.variables = variables;
}

/**
 * Применяет подстановку переменных
 *
 * @param {Array} requests - Массив запросов
 * @param {Object} variables - Объект с переменными
 */
function applyVariables(requests, variables) {
    requests.forEach(req => {
        // Подстановка в URL
        Object.keys(variables).forEach(key => {
            const value = variables[key];
            req.url = req.url.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });

        // Подстановка в теле
        if (req.body) {
            Object.keys(variables).forEach(key => {
                const value = variables[key];
                req.body = req.body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
            });
        }

        // Подстановка в заголовках
        Object.keys(req.headers).forEach(headerKey => {
            Object.keys(variables).forEach(varKey => {
                const value = variables[varKey];
                req.headers[headerKey] = req.headers[headerKey].replace(
                    new RegExp(`\\{\\{${varKey}\\}\\}`, 'g'),
                    value
                );
            });
        });
    });
}

/**
 * Сохраняет результаты в файл
 *
 * @param {Array} results - Результаты выполнения
 * @param {string} outputPath - Путь для сохранения
 * @param {Object} options - Опции сохранения
 */
export function saveResults(results, outputPath = 'results.json', options = {}) {
    const {
        pretty = true,
        includeHeaders = false,
        includeFullData = true
    } = options;

    const data = results.map(result => {
        const item = {
            command: result.command,
            name: result.name,
            description: result.description,
            method: result.method,
            url: result.url,
            type: result.type,
            success: result.success,
            status: result.status,
            timestamp: result.timestamp
        };

        if (includeFullData) {
            item.data = result.data;
        }

        if (includeHeaders) {
            item.headers = result.headers;
        }

        if (result.error) {
            item.error = result.error;
        }

        return item;
    });

    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Результаты сохранены в ${outputPath}`);
}

/**
 * Сохраняет только данные из результатов
 *
 * @param {Array} results - Результаты выполнения
 * @param {string} outputPath - Путь для сохранения
 */
export function saveDataOnly(results, outputPath = 'data.json') {
    const data = results
        .filter(r => r.success && r.data)
        .map(r => ({
            command: r.command,
            name: r.name,
            type: r.type,
            data: r.data
        }));

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Данные сохранены в ${outputPath}`);
}

/**
 * Сохраняет токен отдельно
 *
 * @param {string} token - Токен
 * @param {string} outputPath - Путь для сохранения
 */
export function saveToken(token, outputPath = 'token.json') {
    const data = {
        token: token,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Токен сохранен в ${outputPath}`);
}

/**
 * Парсит тело запроса как JSON
 *
 * @param {string} body - Тело запроса
 * @returns {Object|null} Распарсенный JSON или null
 */
export function parseBody(body) {
    if (!body || !body.trim()) {
        return null;
    }

    try {
        return JSON.parse(body);
    } catch (e) {
        return null;
    }
}

/**
 * Извлекает токен из ответа
 *
 * @param {Object} response - Ответ от сервера
 * @param {string} tokenPath - Путь к токену в ответе (например, 'data.token')
 * @returns {string|null} Токен или null
 */
export function extractToken(response, tokenPath = 'data.token') {
    if (!response || !response.data) {
        return null;
    }

    // Поддержка вложенных путей
    const pathParts = tokenPath.split('.');
    let current = response.data;

    for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return null;
        }
    }

    return typeof current === 'string' ? current : null;
}

/**
 * Валидирует запрос
 *
 * @param {Object} request - Объект запроса
 * @returns {Object} Результат валидации
 */
export function validateRequest(request) {
    const errors = [];
    const warnings = [];

    // Проверка метода
    if (!CONFIG.METHODS.includes(request.method)) {
        errors.push(`Неизвестный метод: ${request.method}`);
    }

    // Проверка URL
    if (!request.url || !request.url.startsWith('http')) {
        warnings.push(`URL не начинается с http: ${request.url}`);
    }

    // Проверка заголовков
    if (!request.headers || Object.keys(request.headers).length === 0) {
        warnings.push('Отсутствуют заголовки');
    }

    // Проверка тела
    if (request.body && request.method === 'GET') {
        warnings.push('GET запрос содержит тело');
    }

    // Проверка Content-Type
    if (request.headers && request.headers['Content-Type'] &&
        request.headers['Content-Type'] === 'application/json' &&
        request.body) {
        try {
            JSON.parse(request.body);
        } catch (e) {
            errors.push(`Некорректный JSON в теле запроса: ${e.message}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Генерирует отчет по запросам
 *
 * @param {Array} requests - Массив запросов
 * @returns {Object} Отчет
 */
export function generateReport(requests) {
    const report = {
        total: requests.length,
        types: {},
        methods: {},
        variables: {},
        commands: [],
        endpoints: []
    };

    requests.forEach(req => {
        // Типы
        if (req.type) {
            report.types[req.type] = (report.types[req.type] || 0) + 1;
        }

        // Методы
        if (req.method) {
            report.methods[req.method] = (report.methods[req.method] || 0) + 1;
        }

        // Переменные
        if (req.variables) {
            Object.keys(req.variables).forEach(varName => {
                report.variables[varName] = (report.variables[varName] || 0) + 1;
            });
        }

        // Команды
        if (req.command) {
            report.commands.push({
                command: req.command,
                name: req.commandName || req.description,
                type: req.type
            });
        }

        // Эндпоинты
        if (req.url) {
            const url = req.url.replace(/\?.*$/, ''); // Убираем query params
            report.endpoints.push(url);
        }
    });

    // Уникальные эндпоинты
    report.endpoints = [...new Set(report.endpoints)];

    return report;
}

/**
 * Экспорт всех функций
 */
export default {
    parseHttpFile,
    saveResults,
    saveDataOnly,
    saveToken,
    parseBody,
    extractToken,
    validateRequest,
    generateReport,
    CONFIG
};

// Для обратной совместимости с CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseHttpFile,
        saveResults,
        saveDataOnly,
        saveToken,
        parseBody,
        extractToken,
        validateRequest,
        generateReport,
        CONFIG
    };
}
