import { setMiddleware, getMiddleware } from '../global-state.mjs';

export class RequestHandlerMiddleware {
    constructor() {
        this.activeTasks = new Map();
        this.presetCommands = new Set();
        this.availableTags = new Set();
        this.component = null;
    }

    /**
     * Инициализация middleware из компонента
     * @param {HTMLElement} component - Ссылка на компонент PanelParams
     */
    initFromComponent(component) {
        if (!component || !component._state) {
            console.warn('Invalid component provided to middleware');
            return;
        }

        this.component = component;
        const state = component._state.get(component);

        if (state) {
            this.presetCommands = new Set(state.commands || []);
            this.availableTags = new Set(state.tags || []);
        }
    }

    /**
     * Обработка входящей строки
     * @param {string} line - Входная строка команды
     * @returns {string} Обработанная строка
     */
    processLine(line) {
        try {
            const usedTags = this.checkForTags(line);
            const usedCommand = this.checkForCommands(line);

            if (usedTags.length > 0 || usedCommand) {
                this.createTask(line, usedCommand, usedTags);
            }

            return line;
        } catch (error) {
            console.error('Middleware processing error:', error);
            return line;
        }
    }

    /**
     * Проверяет строку на наличие зарегистрированных тегов
     * @param {string} line
     * @returns {Array} Найденные теги
     */
    checkForTags(line) {
        if (!this.availableTags || this.availableTags.size === 0) return [];
        return Array.from(this.availableTags).filter(tag =>
            tag && new RegExp(`[@#]${tag}\\b`).test(line)
        );
    }

    /**
     * Проверяет строку на наличие зарегистрированных команд
     * @param {string} line
     * @returns {string|null} Найденная команда или null
     */
    checkForCommands(line) {
        const trimmed = line.trim();
        return Array.from(this.presetCommands).find(cmd =>
            cmd && (trimmed.startsWith(`${cmd} `) || trimmed === cmd)
        ) || null;
    }

    /**
     * Создает новую задачу для отслеживания
     * @param {string} line - Полная строка команды
     * @param {string|null} command - Используемая команда
     * @param {Array} tags - Используемые теги
     */
    createTask(line, command, tags) {
        const taskId = crypto.randomUUID();
        const task = {
            id: taskId,
            command: command || line.split(/\s+/)[0],
            line,
            tags,
            startTime: new Date().toISOString(),
            status: 'running',
            log: []
        };

        this.activeTasks.set(taskId, task);

        if (command) {
            this.logTaskEvent(taskId, `Command detected: ${command}`);
        }

        if (tags.length > 0) {
            this.logTaskEvent(taskId, `Tags detected: ${tags.join(', ')}`);
        }
    }

    /**
     * Логирует событие в задачу
     * @param {string} taskId
     * @param {string} message
     */
    logTaskEvent(taskId, message) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        task.log.push({
            timestamp: new Date().toISOString(),
            message
        });

        this.updateComponentState(taskId);
    }

    /**
     * Обновляет состояние связанного компонента
     * @param {string} taskId
     */
    updateComponentState(taskId) {
        if (!this.component) return;

        const state = this.component._state.get(this.component);
        if (state) {
            this.component._state.set(this.component, {
                ...state,
                lastTask: taskId,
                lastUpdate: new Date().toISOString()
            });
        }
    }
}