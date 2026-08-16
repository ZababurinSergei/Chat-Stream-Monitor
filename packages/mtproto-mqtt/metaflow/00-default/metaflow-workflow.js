// metaflow-workflow.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseInterfaceFile, validateWithHttp } from './interface-parser.js';
import { parseHttpFile } from './http-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MetaflowWorkflow {
    constructor() {
        this.name = 'MTProtoMQTTMetaflow';
        this.steps = [];
        this.state = {};
        this.metadata = {
            version: '1.0.0',
            created: new Date().toISOString(),
            project: 'mtproto-mqtt',
            author: 'sergei'
        };
        this.logs = [];
    }

    /**
     * Логирование
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, message, type };
        this.logs.push(entry);
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        return entry;
    }

    /**
     * Инициализация workflow
     */
    async initialize() {
        this.log('🚀 Инициализация Metaflow Workflow...', 'info');

        // Создаем директорию .metaflow
        const metaflowDir = path.join(process.cwd(), '.metaflow');
        if (!fs.existsSync(metaflowDir)) {
            fs.mkdirSync(metaflowDir, { recursive: true });
            this.log('📁 Создана директория .metaflow', 'info');
        }

        // Создаем поддиректорию history
        const historyDir = path.join(metaflowDir, 'history');
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }

        // Загружаем состояние
        const stateFile = path.join(metaflowDir, 'state.json');
        if (fs.existsSync(stateFile)) {
            try {
                const stateData = fs.readFileSync(stateFile, 'utf-8');
                this.state = JSON.parse(stateData);
                this.log('📂 Состояние загружено из .metaflow', 'info');
            } catch (e) {
                this.log('⚠️ Не удалось загрузить состояние, создаем новое', 'warning');
                this.state = {};
            }
        } else {
            this.state = {};
            this.log('📝 Создано новое состояние', 'info');
        }

        // Сохраняем метаданные
        this.state.metadata = this.metadata;
        this.state.lastRun = new Date().toISOString();

        await this.saveState();

        return this;
    }

    /**
     * Шаг 1: Парсинг INTERFACE.md
     */
    async stepParseInterface() {
        this.log('\n📖 Шаг 1: Парсинг INTERFACE.md', 'info');

        const interfacePath = path.join(process.cwd(), 'INTERFACE.md');
        if (!fs.existsSync(interfacePath)) {
            const error = '❌ INTERFACE.md не найден!';
            this.log(error, 'error');
            throw new Error(error);
        }

        try {
            const parsed = parseInterfaceFile(interfacePath);

            this.state.interface = {
                commands: parsed.commands,
                sections: parsed.sections,
                dependencies: parsed.dependencies,
                buildInfo: parsed.buildInfo,
                timestamp: new Date().toISOString(),
                filePath: interfacePath,
                size: fs.statSync(interfacePath).size
            };

            this.log(`✅ Найдено ${parsed.commands.length} команд`, 'success');
            this.log(`📚 Найдено ${parsed.sections.length} секций`, 'info');
            this.log(`📦 Найдено ${parsed.dependencies.required.length} обязательных зависимостей`, 'info');

            // Сохраняем состояние
            await this.saveState();

            return parsed;

        } catch (error) {
            this.log(`❌ Ошибка парсинга INTERFACE.md: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Шаг 2: Парсинг request.http
     */
    async stepParseHttp() {
        this.log('\n📄 Шаг 2: Парсинг request.http', 'info');

        const httpPath = path.join(process.cwd(), 'request.http');
        if (!fs.existsSync(httpPath)) {
            const error = '❌ request.http не найден!';
            this.log(error, 'error');
            throw new Error(error);
        }

        try {
            const requests = parseHttpFile(httpPath);

            // Фильтруем и обогащаем запросы
            const enrichedRequests = requests.map(req => ({
                ...req,
                hasToken: req.body && req.body.includes('{{token}}'),
                hasApi: req.body && req.body.includes('"api"'),
                size: JSON.stringify(req).length
            }));

            this.state.http = {
                requests: enrichedRequests,
                count: enrichedRequests.length,
                withToken: enrichedRequests.filter(r => r.hasToken).length,
                withApi: enrichedRequests.filter(r => r.hasApi).length,
                timestamp: new Date().toISOString(),
                filePath: httpPath,
                size: fs.statSync(httpPath).size
            };

            this.log(`✅ Найдено ${enrichedRequests.length} HTTP запросов`, 'success');
            this.log(`🔑 С токеном: ${this.state.http.withToken}`, 'info');
            this.log(`📡 С API полем: ${this.state.http.withApi}`, 'info');

            await this.saveState();

            return enrichedRequests;

        } catch (error) {
            this.log(`❌ Ошибка парсинга request.http: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Шаг 3: Валидация
     */
    async stepValidate() {
        this.log('\n🔍 Шаг 3: Валидация', 'info');

        if (!this.state.interface || !this.state.http) {
            const error = '❌ Необходимо выполнить шаги 1 и 2';
            this.log(error, 'error');
            throw new Error(error);
        }

        try {
            const validation = validateWithHttp(
                this.state.interface.commands,
                this.state.http.requests
            );

            this.state.validation = {
                ...validation,
                timestamp: new Date().toISOString(),
                duration: Date.now() - new Date(this.state.lastRun).getTime()
            };

            // Выводим результаты валидации
            this.log('\n📊 Результаты валидации:', 'info');
            this.log(`  ✅ Совпало: ${validation.summary.matched}`, 'success');
            this.log(`  ❌ Отсутствует: ${validation.summary.missing}`, 'error');
            this.log(`  ➕ Лишние: ${validation.summary.extra}`, 'warning');

            if (validation.summary.missing > 0) {
                this.log('\n⚠️ Отсутствующие команды:', 'warning');
                validation.missing.forEach(cmd => {
                    this.log(`  - ${cmd.id}. ${cmd.name}`, 'warning');
                });
            }

            if (validation.summary.extra > 0) {
                this.log('\n📌 Лишние запросы:', 'info');
                validation.extra.forEach(req => {
                    this.log(`  - ${req.method} ${req.url}`, 'info');
                });
            }

            // Сохраняем результат валидации
            this.state.validationResult = {
                passed: validation.summary.missing === 0,
                matched: validation.summary.matched,
                missing: validation.summary.missing,
                extra: validation.summary.extra,
                total: validation.summary.total
            };

            await this.saveState();

            return validation;

        } catch (error) {
            this.log(`❌ Ошибка валидации: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Шаг 4: Генерация отчета
     */
    async stepGenerateReport() {
        this.log('\n📊 Шаг 4: Генерация отчета', 'info');

        try {
            const report = {
                metadata: this.metadata,
                status: {
                    completed: true,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - new Date(this.state.lastRun).getTime()
                },
                interface: {
                    totalCommands: this.state.interface.commands.length,
                    commands: this.state.interface.commands.map(cmd => ({
                        id: cmd.id,
                        name: cmd.name,
                        type: cmd.type,
                        hasHttp: cmd.httpRequests.length > 0,
                        httpRequests: cmd.httpRequests
                    }))
                },
                http: {
                    totalRequests: this.state.http.count,
                    withToken: this.state.http.withToken,
                    withApi: this.state.http.withApi,
                    requests: this.state.http.requests.map(req => ({
                        method: req.method,
                        url: req.url,
                        type: req.type || 'unknown',
                        hasToken: req.hasToken,
                        hasApi: req.hasApi,
                        size: req.size
                    }))
                },
                validation: {
                    ...this.state.validation.summary,
                    details: {
                        matched: this.state.validation.matched.map(m => ({
                            commandId: m.command.id,
                            commandName: m.command.name,
                            requestUrl: m.request.url,
                            requestMethod: m.request.method
                        })),
                        missing: this.state.validation.missing.map(cmd => ({
                            id: cmd.id,
                            name: cmd.name,
                            type: cmd.type
                        })),
                        extra: this.state.validation.extra.map(req => ({
                            method: req.method,
                            url: req.url,
                            type: req.type || 'unknown'
                        }))
                    }
                },
                validationResult: this.state.validationResult,
                recommendations: this.generateRecommendations(),
                logs: this.logs.slice(-20) // Последние 20 записей лога
            };

            // Сохраняем отчет
            const reportPath = path.join(process.cwd(), '.metaflow', 'report.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            this.log('✅ Отчет сохранен в .metaflow/report.json', 'success');

            // Сохраняем в удобном формате
            const summaryPath = path.join(process.cwd(), '.metaflow', 'summary.txt');
            const summary = this.generateSummary(report);
            fs.writeFileSync(summaryPath, summary);
            this.log('✅ Сводка сохранена в .metaflow/summary.txt', 'success');

            // Сохраняем историю
            const historyPath = path.join(
                process.cwd(),
                '.metaflow',
                'history',
                `${new Date().toISOString().replace(/[:.]/g, '-')}.json`
            );
            fs.writeFileSync(historyPath, JSON.stringify({
                ...report,
                workflowState: this.state
            }, null, 2));
            this.log('📚 История сохранена в .metaflow/history/', 'info');

            this.state.report = report;
            await this.saveState();

            return report;

        } catch (error) {
            this.log(`❌ Ошибка генерации отчета: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Генерация рекомендаций
     */
    generateRecommendations() {
        const recommendations = [];
        const v = this.state.validationResult;

        if (v.missing > 0) {
            recommendations.push({
                type: 'warning',
                message: `Добавьте ${v.missing} отсутствующих команд в request.http`
            });
        }

        if (v.extra > 0) {
            recommendations.push({
                type: 'info',
                message: `${v.extra} запросов не соответствуют командам из INTERFACE.md`
            });
        }

        if (v.passed) {
            recommendations.push({
                type: 'success',
                message: 'Все команды из INTERFACE.md присутствуют в request.http'
            });
        }

        // Проверка токена
        if (this.state.http && this.state.http.withToken === 0) {
            recommendations.push({
                type: 'warning',
                message: 'В запросах не используется токен. Проверьте наличие {{token}}'
            });
        }

        return recommendations;
    }

    /**
     * Генерация текстовой сводки
     */
    generateSummary(report) {
        let summary = [];
        const line = '═'.repeat(70);

        summary.push(line);
        summary.push('📋 MTProto MQTT Gateway - Metaflow Workflow Report');
        summary.push(line);
        summary.push(`📅 Дата: ${report.timestamp}`);
        summary.push(`📦 Проект: ${report.metadata.project}`);
        summary.push(`📌 Версия: ${report.metadata.version}`);
        summary.push(`👤 Автор: ${report.metadata.author}`);
        summary.push(`⏱️  Время выполнения: ${report.status.duration}ms`);
        summary.push('');

        summary.push('📖 INTERFACE.md:');
        summary.push(`  Команд: ${report.interface.totalCommands}`);
        summary.push(`  С HTTP запросами: ${report.interface.commands.filter(c => c.hasHttp).length}`);
        summary.push('');

        summary.push('📄 request.http:');
        summary.push(`  Запросов: ${report.http.totalRequests}`);
        summary.push(`  С токеном: ${report.http.withToken}`);
        summary.push(`  С API полем: ${report.http.withApi}`);
        summary.push('');

        summary.push('🔍 Валидация:');
        summary.push(`  ✅ Совпало: ${report.validation.matched}`);
        summary.push(`  ❌ Отсутствует: ${report.validation.missing}`);
        summary.push(`  ➕ Лишние: ${report.validation.extra}`);
        summary.push('');

        if (report.validation.missing > 0) {
            summary.push('⚠️ Отсутствующие команды:');
            report.validation.details.missing.forEach(cmd => {
                summary.push(`  ❌ ${cmd.id}. ${cmd.name} (${cmd.type})`);
            });
            summary.push('');
        }

        if (report.validation.extra > 0) {
            summary.push('📌 Лишние запросы:');
            report.validation.details.extra.forEach(req => {
                summary.push(`  ➕ ${req.method} ${req.url}`);
            });
            summary.push('');
        }

        summary.push('📋 Команды:');
        report.interface.commands.forEach(cmd => {
            const matched = report.validation.details.matched.some(m => m.commandId === cmd.id);
            const status = matched ? '✅' : '❌';
            summary.push(`  ${status} ${cmd.id}. ${cmd.name} (${cmd.type})`);
        });
        summary.push('');

        if (report.recommendations && report.recommendations.length > 0) {
            summary.push('💡 Рекомендации:');
            report.recommendations.forEach(rec => {
                const icon = rec.type === 'success' ? '✅' :
                    rec.type === 'warning' ? '⚠️' : 'ℹ️';
                summary.push(`  ${icon} ${rec.message}`);
            });
            summary.push('');
        }

        summary.push(line);
        summary.push('✨ Workflow завершен!');
        summary.push(`🔗 Для просмотра UI: http://localhost:${process.env.PORT || 3000}`);
        summary.push(line);

        return summary.join('\n');
    }

    /**
     * Сохранение состояния
     */
    async saveState() {
        const stateFile = path.join(process.cwd(), '.metaflow', 'state.json');
        this.state.updatedAt = new Date().toISOString();
        fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
    }

    /**
     * Запуск всего workflow
     */
    async run() {
        try {
            this.log('\n╔═══════════════════════════════════════════════════════════════╗', 'info');
            this.log('║     🚀 MTProto MQTT Gateway - Metaflow Workflow               ║', 'info');
            this.log('╚═══════════════════════════════════════════════════════════════╝', 'info');

            const startTime = Date.now();

            await this.initialize();

            await this.stepParseInterface();
            await this.stepParseHttp();
            await this.stepValidate();
            await this.stepGenerateReport();

            const duration = Date.now() - startTime;

            this.log(`\n✨ Workflow успешно завершен! (${duration}ms)`, 'success');
            this.log('📁 Результаты в .metaflow/', 'info');
            this.log('🌐 Для просмотра UI: http://localhost:3000', 'info');

            return this.state;

        } catch (error) {
            this.log(`❌ Ошибка выполнения workflow: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Показать структуру workflow
     */
    show() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          📋 Metaflow Workflow - Структура                     ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Шаг 1: 📖 Парсинг INTERFACE.md                             ║
║    - Извлечение команд (id, name, type)                     ║
║    - Извлечение секций документации                        ║
║    - Извлечение зависимостей (required, optional)           ║
║    - Извлечение информации о сборке                        ║
║                                                               ║
║  Шаг 2: 📄 Парсинг request.http                             ║
║    - Чтение и парсинг файла                                  ║
║    - Извлечение HTTP запросов (method, url, body)          ║
║    - Замена переменных ({{token}})                          ║
║    - Обогащение метаданными (hasToken, hasApi)             ║
║                                                               ║
║  Шаг 3: 🔍 Валидация                                         ║
║    - Сопоставление команд с запросами                       ║
║    - Поиск отсутствующих команд                             ║
║    - Поиск лишних запросов                                  ║
║    - Генерация статистики                                   ║
║                                                               ║
║  Шаг 4: 📊 Генерация отчета                                  ║
║    - report.json (детальный отчет)                          ║
║    - summary.txt (текстовая сводка)                         ║
║    - state.json (состояние workflow)                        ║
║    - history/ (история выполнения)                          ║
║                                                               ║
║  Сохранение: .metaflow/                                      ║
║    ├── report.json                                           ║
║    ├── summary.txt                                           ║
║    ├── state.json                                            ║
║    └── history/                                              ║
║         └── YYYY-MM-DD-HH-MM-SS.json                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        `);
    }

    /**
     * Получить текущее состояние
     */
    getState() {
        return this.state;
    }

    /**
     * Получить логи
     */
    getLogs() {
        return this.logs;
    }
}

export { MetaflowWorkflow };
