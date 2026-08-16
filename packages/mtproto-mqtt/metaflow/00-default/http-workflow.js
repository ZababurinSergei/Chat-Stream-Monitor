// http-workflow.js - Metaflow стиль для выполнения HTTP запросов
import axios from 'axios';
import { parseHttpFile, saveResults, parseBody, extractToken } from './http-parser.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HttpWorkflow {
    constructor() {
        this.name = 'HttpWorkflow';
        this.version = '1.0.0';
        this.results = [];
        this.requests = [];
        this.token = '';
        this.commands = [];
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Показать структуру workflow
     */
    show() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║            HTTP Workflow - MTProto MQTT Gateway                  ║
║                        v${this.version}                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📋 Команды из INTERFACE.md:                                     ║
║                                                                   ║
║  1. 🔐 Авторизация - получение токена                            ║
║     POST http://localhost:3100/common                            ║
║     { api: "auth./auth/user/login", ... }                        ║
║                                                                   ║
║  2. 👤 Получение активных сессий                                 ║
║     POST http://localhost:3100/api                               ║
║     { api: "auth./active-user/get", ... }                        ║
║                                                                   ║
║  3. ⏰ Получение времени последнего входа                        ║
║     POST http://localhost:3100/api                               ║
║     { api: "auth./login-attempt/last-success/get", ... }         ║
║                                                                   ║
║  4. 📊 Получение информации о последнем входе для всех          ║
║     POST http://localhost:3100/api                               ║
║     { api: "auth./active-users-with-last-login/get", ... }       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

📌 Шаги выполнения:
  1. 📖 Парсинг request.http файла
  2. 🔐 Выполнение авторизации
  3. 🔄 Выполнение остальных запросов
  4. 💾 Сохранение результатов
  5. 📊 Вывод статистики

📦 Зависимости:
  - axios: HTTP клиент
  - fs: Работа с файловой системой
  - path: Работа с путями

🔧 Конфигурация:
  - Файл запросов: request.http
  - Результаты: results.json
  - Данные: data.json
  - Токен: token.json
        `);
    }

    /**
     * Запуск workflow
     */
    async run() {
        this.startTime = new Date();
        console.log('🚀 Запуск HttpWorkflow для MTProto MQTT Gateway...');
        console.log(`📅 Время запуска: ${this.startTime.toISOString()}`);
        console.log(`📦 Версия: ${this.version}`);
        console.log('═'.repeat(60));

        try {
            // Шаг 1: Парсинг файла
            console.log('\n📖 Шаг 1: Парсинг request.http');
            const httpFilePath = path.join(__dirname, 'request.http');

            if (!fs.existsSync(httpFilePath)) {
                console.error('❌ Файл request.http не найден!');
                console.log(`📝 Ожидаемый путь: ${httpFilePath}`);
                console.log('📝 Создайте файл request.http в текущей директории');
                return;
            }

            console.log(`📁 Файл найден: ${httpFilePath}`);

            this.requests = parseHttpFile(httpFilePath);
            console.log(`✅ Найдено ${this.requests.length} запросов`);

            // Выводим информацию о командах
            console.log('\n📋 Команды:');
            console.log('─'.repeat(50));
            this.requests.forEach((req, index) => {
                const cmdNum = req.command || index + 1;
                console.log(`  ${cmdNum}. ${req.commandName || 'Без названия'}`);
                console.log(`     ${req.method} ${req.url}`);
                if (req.type) {
                    console.log(`     Тип: ${req.type}`);
                }
                if (req.description) {
                    console.log(`     Описание: ${req.description.substring(0, 50)}...`);
                }
                console.log('');
            });

            // Шаг 2: Выполнение авторизации
            console.log('═'.repeat(60));
            console.log('\n🔐 Шаг 2: Авторизация');
            const authRequest = this.requests.find(req => req.type === 'auth');

            if (authRequest) {
                console.log(`📤 Выполнение авторизации: ${authRequest.method} ${authRequest.url}`);

                const result = await this.executeRequest(authRequest);

                if (result.success && result.data) {
                    this.token = extractToken(result);
                    if (this.token) {
                        console.log(`✅ Токен получен: ${this.token.substring(0, 20)}...${this.token.substring(this.token.length - 10)}`);
                        console.log(`🔑 Длина токена: ${this.token.length} символов`);

                        // Обновляем токен во всех запросах
                        this.updateTokenInRequests(this.token);
                    } else {
                        console.log('⚠️ Токен не найден в ответе');
                        console.log(`📊 Ответ: ${JSON.stringify(result.data).substring(0, 100)}...`);
                    }
                } else {
                    console.log(`❌ Ошибка авторизации: ${result.error || 'Неизвестная ошибка'}`);
                    console.log(`📊 Статус: ${result.status || 'N/A'}`);
                }
            } else {
                console.log('⚠️ Запрос авторизации не найден');
                console.log('📝 Убедитесь, что в request.http есть запрос с type="auth"');
            }

            // Шаг 3: Выполнение остальных запросов
            console.log('\n🔄 Шаг 3: Выполнение запросов');
            console.log('═'.repeat(60));

            const nonAuthRequests = this.requests.filter(req => req.type !== 'auth');

            if (nonAuthRequests.length === 0) {
                console.log('⚠️ Нет запросов для выполнения (кроме авторизации)');
            }

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < nonAuthRequests.length; i++) {
                const req = nonAuthRequests[i];
                const commandNum = req.command || i + 1;

                console.log(`\n📤 Команда ${commandNum}: ${req.commandName || 'Запрос'}`);
                console.log(`   ${req.method} ${req.url}`);

                if (req.body) {
                    try {
                        const body = JSON.parse(req.body);
                        console.log(`   📝 API: ${body.api || 'N/A'}`);
                    } catch (e) {
                        // Не JSON тело
                    }
                }

                const result = await this.executeRequest(req);

                const entry = {
                    command: commandNum,
                    name: req.commandName || `Запрос ${i + 1}`,
                    description: req.description || '',
                    method: req.method,
                    url: req.url,
                    type: req.type || 'api',
                    success: result.success,
                    status: result.status || 'error',
                    data: result.data || null,
                    error: result.error || null,
                    timestamp: new Date().toISOString()
                };

                this.results.push(entry);

                if (result.success) {
                    successCount++;
                    console.log(`  ✅ Успешно (статус: ${result.status})`);

                    // Выводим краткую информацию о данных
                    if (result.data) {
                        const dataStr = JSON.stringify(result.data);
                        if (dataStr.length > 200) {
                            console.log(`  📊 Данные: ${dataStr.substring(0, 200)}...`);
                        } else {
                            console.log(`  📊 Данные: ${dataStr}`);
                        }

                        // Специфичная информация для разных типов запросов
                        if (req.type === 'get_active' && result.data.data) {
                            console.log(`  👤 Активных сессий: ${result.data.data.length || 0}`);
                        }
                        if (req.type === 'get_last_login' && result.data.data) {
                            console.log(`  ⏰ Последний вход: ${JSON.stringify(result.data.data).substring(0, 100)}...`);
                        }
                        if (req.type === 'get_all_active' && result.data.data) {
                            console.log(`  👥 Всего пользователей: ${result.data.data.length || 0}`);
                        }
                    }
                } else {
                    errorCount++;
                    console.log(`  ❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`);
                    if (result.status) {
                        console.log(`  📊 Код статуса: ${result.status}`);
                    }
                    if (result.data) {
                        console.log(`  📊 Данные ошибки: ${JSON.stringify(result.data).substring(0, 100)}...`);
                    }
                }
            }

            // Шаг 4: Сохранение результатов
            console.log('\n💾 Шаг 4: Сохранение результатов');
            console.log('═'.repeat(60));

            // Создаем директорию для результатов если её нет
            const resultsDir = path.join(__dirname, 'results');
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
                console.log(`📁 Создана директория: ${resultsDir}`);
            }

            // Сохраняем полные результаты
            const resultsPath = path.join(resultsDir, 'results.json');
            const fullResults = {
                workflow: {
                    name: this.name,
                    version: this.version,
                    startTime: this.startTime.toISOString(),
                    endTime: new Date().toISOString(),
                    duration: (new Date() - this.startTime) / 1000
                },
                summary: {
                    total: this.results.length,
                    success: successCount,
                    errors: errorCount,
                    successRate: this.results.length > 0 ? (successCount / this.results.length * 100).toFixed(1) : 0
                },
                results: this.results
            };

            fs.writeFileSync(resultsPath, JSON.stringify(fullResults, null, 2));
            console.log(`✅ Результаты сохранены: ${resultsPath}`);

            // Сохраняем только данные
            const dataPath = path.join(resultsDir, 'data.json');
            const dataOnly = this.results
                .filter(r => r.success && r.data)
                .map(r => ({
                    command: r.command,
                    name: r.name,
                    type: r.type,
                    data: r.data
                }));

            fs.writeFileSync(dataPath, JSON.stringify(dataOnly, null, 2));
            console.log(`✅ Данные сохранены: ${dataPath}`);

            // Сохраняем токен отдельно
            if (this.token) {
                const tokenPath = path.join(resultsDir, 'token.json');
                fs.writeFileSync(tokenPath, JSON.stringify({
                    token: this.token,
                    length: this.token.length,
                    timestamp: new Date().toISOString()
                }, null, 2));
                console.log(`✅ Токен сохранен: ${tokenPath}`);
            }

            // Шаг 5: Вывод итогов
            this.endTime = new Date();
            const duration = (this.endTime - this.startTime) / 1000;

            console.log('\n📊 Шаг 5: Итоги');
            console.log('═'.repeat(60));
            console.log(`✅ Успешных запросов: ${successCount}`);
            console.log(`❌ Ошибочных запросов: ${errorCount}`);
            console.log(`📊 Всего запросов: ${this.results.length}`);
            console.log(`📈 Успешность: ${fullResults.summary.successRate}%`);
            console.log(`⏱️  Время выполнения: ${duration.toFixed(2)} секунд`);

            if (this.token) {
                console.log(`🔑 Токен: ${this.token.substring(0, 20)}...${this.token.substring(this.token.length - 10)}`);
            }

            console.log(`\n📁 Результаты сохранены в директории: ${resultsDir}`);

            console.log('\n✨ Workflow завершен!');

            // Выводим сводку по командам
            this.printSummary();

            return fullResults;

        } catch (error) {
            console.error('❌ Ошибка выполнения workflow:', error);
            console.error('📊 Стек вызовов:', error.stack);
            throw error;
        }
    }

    /**
     * Выполнение одного HTTP запроса
     */
    async executeRequest(request) {
        try {
            // Заменяем переменные в URL
            let url = request.url;
            if (this.token) {
                url = url.replace(/\{\{token\}\}/g, this.token);
            }

            const config = {
                method: request.method.toLowerCase(),
                url: url,
                headers: {
                    ...request.headers,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            };

            // Парсим тело запроса
            if (request.body && request.body.trim()) {
                try {
                    // Заменяем переменные в теле
                    let body = request.body;
                    if (this.token) {
                        body = body.replace(/\{\{token\}\}/g, this.token);
                    }

                    const parsedBody = JSON.parse(body);
                    config.data = parsedBody;

                    // Логируем тело только если не слишком большое
                    const bodyStr = JSON.stringify(parsedBody);
                    if (bodyStr.length < 200) {
                        console.log(`  📝 Тело: ${bodyStr}`);
                    } else {
                        console.log(`  📝 Тело: ${bodyStr.substring(0, 200)}...`);
                    }
                } catch (e) {
                    // Если это не JSON, отправляем как есть
                    config.data = request.body;
                    console.log(`  📝 Тело: (не JSON) ${request.body.substring(0, 100)}...`);
                }
            }

            const response = await axios(config);

            return {
                success: response.status >= 200 && response.status < 300,
                status: response.status,
                data: response.data,
                headers: response.headers
            };

        } catch (error) {
            return {
                success: false,
                status: error.response?.status || 500,
                error: error.message,
                data: error.response?.data || null,
                code: error.code || 'UNKNOWN'
            };
        }
    }

    /**
     * Обновляет токен во всех запросах
     */
    updateTokenInRequests(token) {
        console.log(`🔄 Обновление токена в ${this.requests.length} запросах...`);
        let updatedCount = 0;

        this.requests.forEach(req => {
            let updated = false;

            // Обновляем URL
            if (req.url && req.url.includes('{{token}}')) {
                req.url = req.url.replace(/\{\{token\}\}/g, token);
                updated = true;
            }

            // Обновляем тело
            if (req.body && req.body.includes('{{token}}')) {
                req.body = req.body.replace(/\{\{token\}\}/g, token);
                updated = true;
            }

            // Обновляем заголовки
            Object.keys(req.headers).forEach(key => {
                if (req.headers[key].includes('{{token}}')) {
                    req.headers[key] = req.headers[key].replace(/\{\{token\}\}/g, token);
                    updated = true;
                }
            });

            if (updated) updatedCount++;
        });

        console.log(`✅ Обновлено ${updatedCount} запросов`);
    }

    /**
     * Выводит сводку по командам
     */
    printSummary() {
        console.log('\n📋 Сводка по командам:');
        console.log('═'.repeat(60));

        if (this.results.length === 0) {
            console.log('⚠️ Нет результатов для отображения');
            return;
        }

        this.results.forEach(r => {
            const status = r.success ? '✅' : '❌';
            const statusText = r.success ? 'УСПЕШНО' : 'ОШИБКА';
            console.log(`${status} Команда ${r.command}: ${r.name}`);
            console.log(`   Метод: ${r.method} ${r.url}`);
            console.log(`   Статус: ${r.status} - ${statusText}`);

            if (r.success && r.data) {
                // Показываем ключевые данные в зависимости от типа
                if (r.type === 'get_active' && r.data.data) {
                    const count = Array.isArray(r.data.data) ? r.data.data.length : 0;
                    console.log(`   👤 Активных сессий: ${count}`);
                    if (count > 0 && count <= 5) {
                        console.log(`   📊 Данные: ${JSON.stringify(r.data.data).substring(0, 150)}...`);
                    }
                } else if (r.type === 'get_last_login' && r.data.data) {
                    console.log(`   ⏰ Последний вход: ${JSON.stringify(r.data.data).substring(0, 100)}...`);
                } else if (r.type === 'get_all_active' && r.data.data) {
                    const count = Array.isArray(r.data.data) ? r.data.data.length : 0;
                    console.log(`   👥 Всего пользователей: ${count}`);
                    if (count > 0 && count <= 5) {
                        console.log(`   📊 Данные: ${JSON.stringify(r.data.data).substring(0, 150)}...`);
                    }
                } else {
                    const dataStr = JSON.stringify(r.data);
                    if (dataStr.length > 100) {
                        console.log(`   📊 Данные: ${dataStr.substring(0, 100)}...`);
                    } else {
                        console.log(`   📊 Данные: ${dataStr}`);
                    }
                }
            } else if (!r.success && r.error) {
                console.log(`   ❌ Ошибка: ${r.error}`);
            }

            console.log(`   🕐 Время: ${r.timestamp}`);
            console.log('');
        });
    }

    /**
     * Проверка поддержки команд
     */
    async checkCommands() {
        console.log('🔍 Проверка команд из INTERFACE.md...');
        console.log('═'.repeat(50));

        const commands = [
            { id: 1, name: 'Авторизация', endpoint: '/common' },
            { id: 2, name: 'Получение активных сессий', endpoint: '/api' },
            { id: 3, name: 'Время последнего входа', endpoint: '/api' },
            { id: 4, name: 'Информация о всех пользователях', endpoint: '/api' }
        ];

        let foundCount = 0;
        commands.forEach(cmd => {
            const found = this.requests.find(r =>
                r.command === cmd.id ||
                (r.description && r.description.includes(cmd.name)) ||
                (r.body && r.body.includes(cmd.name))
            );
            if (found) {
                console.log(`✅ Команда ${cmd.id}: ${cmd.name} - найдена`);
                foundCount++;
            } else {
                console.log(`❌ Команда ${cmd.id}: ${cmd.name} - НЕ найдена`);
            }
        });

        console.log(`\n📊 Найдено команд: ${foundCount}/${commands.length}`);
        if (foundCount === commands.length) {
            console.log('✅ Все команды из INTERFACE.md присутствуют в request.http');
        } else {
            console.log('⚠️ Некоторые команды отсутствуют. Проверьте request.http');
        }

        return foundCount === commands.length;
    }

    /**
     * Экспорт результатов в CSV
     */
    exportCSV() {
        if (this.results.length === 0) {
            console.log('⚠️ Нет результатов для экспорта');
            return;
        }

        const headers = ['Command', 'Name', 'Method', 'URL', 'Success', 'Status', 'Timestamp'];
        const rows = this.results.map(r => [
            r.command,
            r.name,
            r.method,
            r.url,
            r.success ? 'Yes' : 'No',
            r.status || 'N/A',
            r.timestamp
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const csvPath = path.join(__dirname, 'results', 'results.csv');
        fs.writeFileSync(csvPath, csv);
        console.log(`✅ CSV экспортирован: ${csvPath}`);
    }
}

// Запуск
const workflow = new HttpWorkflow();

// Если запущен напрямую
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const command = process.argv[2] || 'run';

    switch (command) {
        case 'show':
            workflow.show();
            break;
        case 'run':
            workflow.run().catch(console.error);
            break;
        case 'check':
            // Сначала парсим файл
            const httpFilePath = path.join(__dirname, 'request.http');
            if (fs.existsSync(httpFilePath)) {
                workflow.requests = parseHttpFile(httpFilePath);
                workflow.checkCommands().catch(console.error);
            } else {
                console.log('❌ Файл request.http не найден');
            }
            break;
        case 'csv':
            // Сначала парсим и выполняем
            workflow.run().then(() => {
                workflow.exportCSV();
            }).catch(console.error);
            break;
        default:
            console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║           HttpWorkflow - MTProto MQTT Gateway                   ║
║                      v${workflow.version}                                ║
╚═══════════════════════════════════════════════════════════════════╝

Использование:
  node http-workflow.js show    - показать структуру
  node http-workflow.js run     - выполнить workflow
  node http-workflow.js check   - проверить команды
  node http-workflow.js csv     - выполнить и экспортировать в CSV

Примеры:
  node http-workflow.js run
  node http-workflow.js check
  node http-workflow.js csv
            `);
    }
}

export { HttpWorkflow };
