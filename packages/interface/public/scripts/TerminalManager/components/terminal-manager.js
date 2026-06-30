import { DragDropManager } from './drag-drop-manager.js';
import { PresetManager } from './preset-manager.js';
import { EventManager } from './event-manager.js';
import { SocketManager } from './socket-manager.js';
import { LayoutManager } from './layout-manager.js';
import { createDefaultMiddleware } from '../../middleware/index.mjs';
import { setMiddleware, getTerminal, setTerminal } from '../../global-state.mjs';

export class TerminalManager {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('command-input');
        this.dndZone = document.getElementById('dnd-zone');
        this.dndZoneLeft = document.getElementById('dnd-zone-left');
        this.clearBtn = document.getElementById('clear-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.runBtn = document.getElementById('run-btn');
        this.runBtnLeft = document.getElementById('run-btn-left');
        this.saveBtn = document.getElementById('save-btn');
        this.saveBtnLeft = document.getElementById('save-btn-left');
        this.clearDndBtn = document.getElementById('clear-dnd-btn');
        this.clearDndBtnLeft = document.getElementById('clear-dnd-btn-left');
        this.togglePrivate = document.getElementById('toggle-private');
        this.togglePrivateLeft = document.getElementById('toggle-private-left');
        this.toggleInput = document.getElementById('toggle-input');
        this.toggleInputLeft = document.getElementById('toggle-input-left');
        this.inputArea = document.getElementById('input-area');
        this.presetsContainer = document.getElementById('presets-container');
        this.presetsContent = document.getElementById('presets-content');
        this.addPresetBtn = document.getElementById('add-preset-btn');
        this.addPresetBtnLeft = document.getElementById('add-preset-btn-left');
        this.toggleConfigurator = document.getElementById('toggle-configurator');
        this.configurator = document.querySelector('panel-configurator');
        this.scriptsPanel = document.getElementById('scripts-panel');

        this._state = new WeakMap();
        this._isSaving = false;
        this.activePresetIndex = 0;

        this._managers = {
            dragDrop: new DragDropManager(this),
            preset: new PresetManager(this),
            event: new EventManager(this),
            socket: new SocketManager(this),
            layout: new LayoutManager(this)
        };

        this.middleware = createDefaultMiddleware(this);
        setMiddleware(this.middleware);
        setTerminal(this);
    }

    async init() {
        try {
            await this._managers.socket.init();
            this._managers.event.init();
            this._managers.dragDrop.init();
            this._managers.layout.init();
            await this._managers.preset.init();

            // Добавлена инициализация placeholder
            this._managers.dragDrop.showDndPlaceholder();

            this.addTerminalLine('Система готова к работе');
            this.commandInput.focus();
        } catch (error) {
            console.error('Initialization error:', error);
            this.addTerminalLine(`Ошибка инициализации: ${error.message}`, 'error');
            throw error;
        }
    }

    addTerminalLine(content, type = 'normal') {
        if (!content || typeof content !== 'string') return;

        const line = document.createElement('div');
        line.className = 'terminal-line';

        const safeContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        switch(type) {
            case 'error':
                line.innerHTML = `<span class="error">${safeContent}</span>`;
                break;
            case 'command':
                line.innerHTML = `<span class="prompt">$</span> <span class="directory">~/quantum-git</span> <span class="command">${safeContent}</span>`;
                break;
            default:
                line.innerHTML = `<span class="prompt"></span> ${safeContent}`;
        }

        this.terminal.appendChild(line);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    async executeCommand(command) {
        if (!this._managers.socket.socket?.connected) {
            await new Promise((resolve) => {
                this._managers.socket.socket?.once('connect', resolve);
                setTimeout(resolve, 5000);
            });
        }

        const processedCommand = this.middleware(command);

        return new Promise((resolve) => {
            const scriptName = command.startsWith('npm run ') ? command.substring(8) : null;

            this.addTerminalLine(processedCommand, 'command');

            this._managers.socket.socket?.emit('run-script', {
                command: processedCommand,
                scriptName
            }, (response) => {
                if (response?.error) {
                    this.addTerminalLine(`Ошибка выполнения: ${response.error}`, 'error');
                }
                resolve(response);
            });
        });
    }

    clearTerminal() {
        this.terminal.innerHTML = `
            <div class="terminal-line">
                <span class="prompt">$</span> <span class="directory">~/quantum-git</span> <span class="command">clear</span>
            </div>
            <div class="terminal-line">
                <span class="prompt">></span> Терминал очищен
            </div>
        `;
    }

    copyTerminalContent() {
        const range = document.createRange();
        range.selectNode(this.terminal);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        this.addTerminalLine('Содержимое терминала скопировано в буфер');
    }

    runScriptSequence() {
        const scripts = Array.from(this.dndZone.querySelectorAll('.dnd-script'))
            .filter(el => !el.classList.contains('placeholder'))
            .map(el => el.dataset.script);

        if (scripts.length === 0) {
            this.addTerminalLine('Нет скриптов в последовательности для выполнения', 'warning');
            return;
        }

        this.addTerminalLine(`Выполнение последовательности: ${scripts.join(' → ')}`, 'command');

        const scriptElements = this.dndZone.querySelectorAll('.dnd-script');
        scripts.forEach((script, index) => {
            setTimeout(() => {
                const indicators = scriptElements[index].querySelectorAll('.status-indicator');
                indicators.forEach(ind => ind.className = 'status-indicator status-2');

                this._managers.socket.socket?.emit('run-script', { scriptName: script }, (response) => {
                    const status = response?.success ? 'status-0' : 'status-1';
                    indicators[index % 5].className = `status-indicator ${status}`;
                });
            }, index * 1000);
        });
    }

    getCurrentPanelConfig() {
        const left = document.querySelector('.left-column');
        const right = document.querySelector('.right-column');

        return {
            leftPanel: {
                width: parseInt(getComputedStyle(left).width) || 350,
                visible: left.style.display !== 'none'
            },
            rightPanel: {
                width: parseInt(getComputedStyle(right).width) || 350,
                visible: right.style.display !== 'none'
            }
        };
    }

    getManager(name) {
        return this._managers[name];
    }
}