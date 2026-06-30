import { io } from '/socket.io/socket.io.esm.min.js';

class TerminalMiddleware {
    constructor() {
        this.activeTasks = new Map();
        this.presetCommands = new Set();
        this.availableTags = new Set();
        this.component = null;
    }

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

    getTagContainers() {
        const selectors = ['.tag-input'];
        return selectors.flatMap(selector => {
            const inputs = Array.from(document.querySelectorAll(selector));
            return inputs.map(input => {
                return input.closest('.tag-input-container') || null;
            }).filter(Boolean);
        });
    }

    extractTagsFromSpans(containers) {
        return containers.flatMap(container => {
            return Array.from(container.querySelectorAll('span.tag'))
                .map(span => span?.dataset?.value)
                .filter(Boolean);
        });
    }

    updateAvailableTags(newTags) {
        newTags.forEach(tag => {
            if (!this.availableTags.has(tag)) {
                this.availableTags.add(tag);
            }
        });
    }

    filterMatchingTags(line) {
        return Array.from(this.availableTags).filter(tag =>
            tag && new RegExp(`${tag}\\b`).test(line)
        );
    }

    checkForTags(line) {
        try {
            const tagContainers = this.getTagContainers();
            if (!tagContainers.length) return [];

            const tags = this.extractTagsFromSpans(tagContainers);
            this.updateAvailableTags(tags);
            return this.filterMatchingTags(line);
        } catch (error) {
            console.error('Tag processing failed:', error);
            return [];
        }
    }

    getCommandContainers() {
        const selectors = [
            '.command-input',
            '.delete-command-input',
            '.update-command-input',
            '.create-command-input'
        ];
        return selectors.flatMap(selector => {
            const inputs = Array.from(document.querySelectorAll(selector));
            return inputs.map(input => {
                return input.closest('.tags-control') || null;
            }).filter(Boolean);
        });
    }

    extractCommandsFromSpans(containers) {
        return containers.flatMap(container => {
            return Array.from(container.querySelectorAll('span.command-tag'))
                .map(span => span?.dataset?.value)
                .filter(Boolean);
        });
    }

    updatePresetCommands(newCommands) {
        newCommands.forEach(cmd => {
            if (!this.presetCommands.has(cmd)) {
                this.presetCommands.add(cmd);
            }
        });
    }

    findMatchingCommand(input) {
        if (!input || !this.presetCommands.size) return null;
        const normalizedInput = input.trim();
        const commandList = Array.from(this.presetCommands);
        const exactMatch = commandList.find(cmd =>
            cmd && normalizedInput === cmd
        );
        if (exactMatch) return exactMatch;
        return commandList.find(cmd => {
            if (!cmd) return false;
            const regex = new RegExp(
                `(^|\\s|=|:|/)${this.escapeRegExp(cmd)}($|\\s|=|:|/)`
            );
            return regex.test(normalizedInput);
        }) || null;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    checkForCommands(line) {
        try {
            const commandContainers = this.getCommandContainers();
            if (!commandContainers.length) return null;
            const commands = this.extractCommandsFromSpans(commandContainers);
            this.updatePresetCommands(commands);
            const trimmed = line?.trim() || '';
            return this.findMatchingCommand(trimmed);
        } catch (error) {
            console.error('Command processing failed:', error);
            return null;
        }
    }

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
        this.logTaskEvent(taskId, `Task created with command: ${command}`);
        if (tags.length > 0) {
            this.logTaskEvent(taskId, `Tags detected: ${tags.join(', ')}`);
        }
        return taskId;
    }

    logTaskEvent(taskId, message) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;
        console.log('ffffffffff',message)
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: message.trim(),
            type: 'log'
        };
        task.log.push(logEntry);
        this.updateComponentState(taskId);
        console.log(`[Task ${taskId}] ${message}`);
    }

    extractApplicationsFromTaskLog(task) {
        const tableLogEntry = task.log.find(entry =>
            entry.message &&
            typeof entry.message === 'string' &&
            entry.message.includes('Имя') &&
            entry.message.includes('Размер')
        );

        if (!tableLogEntry) {
            console.debug('Table entry not found in task log');
            return [];
        }

        const lines = tableLogEntry.message.split('\n');
        const appNames = [];

        for (const line of lines) {
            if (!line || line.includes('Имя') || line.includes('═══') || line.includes('──')) {
                continue;
            }

            const columns = line.split(/[│║|]/).map(col => col.trim());
            if (columns.length >= 2) {
                const appName = columns[1];
                if (appName && !appName.includes('KB') && !appName.includes('MB') && appName.length > 3) {
                    appNames.push(appName);
                }
            }
        }

        return appNames;
    }

    processApplications(applications) {
        if (!applications.length) return;

        const event = new CustomEvent('applications-updated', {
            detail: { apps: applications },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    completeTask(taskId, result) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        if (task.tags.includes('quantum-parser@2.1.0') &&
            task.command === 'migrate:presets') {
            const applications = this.extractApplicationsFromTaskLog(task);
            if (applications.length) {
                this.processApplications(applications);
            }
        }

        task.status = 'completed';
        task.endTime = new Date().toISOString();
        task.result = result;
        task.complete = true;

        this.logTaskEvent(taskId, `Task completed with result: ${JSON.stringify(result)}`);
        setTimeout(() => {
            this.activeTasks.delete(taskId);
        }, 30000);
    }

    updateComponentState(taskId) {
        if (!this.component) return;
        const task = this.activeTasks.get(taskId);
        if (!task) return;
        const state = this.component._state.get(this.component);
        if (state) {
            this.component._state.set(this.component, {
                ...state,
                activeTask: task,
                lastUpdate: new Date().toISOString()
            });
        }
    }

    processLine(line) {
        try {
            const usedTags = this.checkForTags(line);
            const usedCommand = this.checkForCommands(line);
            if (usedTags.length > 0 || usedCommand) {
                return this.createTask(line, usedCommand, usedTags);
            }
            return null;
        } catch (error) {
            console.error('Middleware processing error:', error);
            return null;
        }
    }

    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
}

export class SocketManager {
    constructor(terminal) {
        this.terminal = terminal;
        this.socket = null;
        this.middleware = new TerminalMiddleware();
        this.middleware.terminal = terminal;
        this.debounceUpdate = this.debounce(this.processApplications.bind(this), 300);
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async init() {
        try {
            this.socket = io();

            this._setupConnectionHandlers();
            this._setupScriptHandlers();

            return true;
        } catch (error) {
            console.error('Socket connection error:', error);
            return false;
        }
    }

    processApplications(applications) {
        if (!applications.length) return;

        document.querySelectorAll('nk-panel-params').forEach(panel => {
            const state = panel._state.get(panel);
            panel._state.set(panel, {
                ...state,
                applications: [...new Set([...state.applications, ...applications])],
                hasPresets: true
            });
            panel._render();
        });
    }

    _setupConnectionHandlers() {
        this.socket?.on('connect', () => {
            this.terminal?.addTerminalLine('Socket connected');
        });

        this.socket?.on('disconnect', () => {
            this.terminal?.addTerminalLine('Socket disconnected', 'warning');
        });

        this.socket?.on('connect_error', (err) => {
            this.terminal?.addTerminalLine(`Socket error: ${err.message}`, 'error');
        });
    }

    _setupScriptHandlers() {
        this.socket?.on('terminal-message', ({text, type}) => {
            this.terminal?.addTerminalLine?.(text, type);
        });

        this.socket?.on('script-stdout', (data) => {
            let activeTaskId = null;
            const tasks = this.middleware.getActiveTasks();

            if (tasks.length > 0) {
                const lastTask = tasks[tasks.length - 1];
                if (lastTask.status === 'running') {
                    activeTaskId = lastTask.id;
                }
            }

            if (activeTaskId) {
                this.middleware.logTaskEvent(activeTaskId, data);
            } else {
                const usedTags = this.middleware.checkForTags(data);
                const usedCommand = this.middleware.checkForCommands(data);
                let taskId = null;
                if (usedTags.length > 0 || usedCommand) {
                    taskId = this.middleware.createTask(data, usedCommand, usedTags);
                } else {
                    taskId = this.middleware.createTask(data, 'orphan', []);
                }
                this.middleware.logTaskEvent(taskId, data);
            }

            this.terminal?.addTerminalLine(data);
        });

        this.socket?.on('script-completed', (code) => {
            this.middleware.getActiveTasks().forEach(task => {
                if (task.status === 'running') {
                    this.middleware.completeTask(task.id, { exitCode: code });
                }
            });
        });

        this.socket?.on('script-error', (error) => {
            this.middleware.getActiveTasks().forEach(task => {
                if (task.status === 'running') {
                    task.status = 'failed';
                    this.middleware.logTaskEvent(task.id, `Error: ${error.message}`);
                }
            });
            this.terminal?.addTerminalLine(`Script error: ${error.message}`, 'error');
        });
    }

    terminate() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    getActiveTasks() {
        return this.middleware.getActiveTasks();
    }
}

export const __test__ = {
    TerminalMiddleware
};