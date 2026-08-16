// public/scripts/PanelParams/index.mjs
import { Component } from '../base-nk/index.mjs';
import { panelParamsTemplate } from './template.mjs';
import { renderTemplate } from './render.mjs';
import { getActiveApp, getTerminal, waitForTerminal } from '../global-state.mjs';
import { SocketManager } from '../TerminalManager/components/socket-manager.js';

const name = 'nk-panel-params';

class PanelParams extends (await Component()) {
    static get observedAttributes() {
        return [...super.observedAttributes, 'data-active-app'];
    }

    constructor() {
        super();
        this._state = new WeakMap();
        this._initialized = false;

        this._handleInputKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                const type = input.dataset.inputType;

                if (type && input.value.trim()) {
                    const state = this._state.get(this);
                    const newItems = [...state[`${type}s`], input.value.trim()];

                    this._state.set(this, {
                        ...state,
                        [`${type}s`]: newItems,
                        [`${type}Input`]: ''
                    });

                    input.value = '';
                    this._render();
                }
            }
        };

        this._handleRemoveClick = (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            const value = btn.closest('[data-value]')?.dataset.value;
            const stateKey = btn.dataset.stateKey;

            if (value && stateKey) {
                const state = this._state.get(this);
                this._state.set(this, {
                    ...state,
                    [stateKey]: state[stateKey].filter(item => item !== value)
                });
                this._render();
            }
        };

        this._handlePresetNameChange = (e) => {
            const value = e.target.value.trim();
            const state = this._state.get(this);
            this._state.set(this, {
                ...state,
                presetNameInput: value,
                isNewPreset: !!value
            });
            this._updateCreateButtonState();
        };

        this._updateCreateButtonState = () => {
            const state = this._state.get(this);
            const button = this.querySelector('.create-preset-btn');
            if (button) {
                button.disabled = !state.isNewPreset;
            }
        };

        this._handleCreatePreset = async () => {
            const state = this._state.get(this);
            if (!state.presetNameInput) return;

            try {
                const response = await fetch('/api/set-active-app', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        app: state.presetNameInput,
                        isNew: true
                    })
                });

                if (!response.ok) throw new Error(await response.text());

                const result = await response.json();
                if (result.requiresSave) {
                    this.terminal?.addTerminalLine(`Создан новый пресет: ${state.presetNameInput}`, 'command');
                    await this._runPresetScripts(state.presetNameInput);
                    this._updateActiveAppUI(state.presetNameInput);
                }
            } catch (error) {
                this.terminal?.addTerminalLine(`Ошибка создания пресета: ${error.message}`, 'error');
            }
        };

        this._handleGetPresets = async () => {
            const state = this._state.get(this);
            try {
                this._state.set(this, { ...state, loading: true });
                await this.terminal?.executeCommand('npm run migrate:presets');
                if (this.terminal._managers?.preset) {
                    await this.terminal._managers.preset.loadPresets();
                }
                this.terminal?.addTerminalLine('Пресеты успешно загружены', 'success');
            } catch (error) {
                this.terminal?.addTerminalLine(`Ошибка получения пресетов: ${error.message}`, 'error');
            } finally {
                this._state.set(this, { ...state, loading: false });

                // Обновляем кнопку после завершения операции
                const getPresetsBtn = this.querySelector('.get-presets-btn');
                if (getPresetsBtn) {
                    getPresetsBtn.textContent = 'Получить пресеты';
                    getPresetsBtn.disabled = false;
                }
            }
        };

        this._runPresetScripts = async (presetName) => {
            const scripts = [
                {name: '1-analyze', args: ''},
                {name: 'migrate:save', args: ``},
                {name: 'migrate:load', args: ``},
                {name: 'migrate:run', args: ``}
            ];

            for (const script of scripts) {
                try {
                    await this.terminal?.executeCommand(`npm run ${script.name} ${script.args}`);
                } catch (error) {
                    this.terminal?.addTerminalLine(`Ошибка выполнения ${script.name}: ${error.message}`, 'error');
                    throw error;
                }
            }
        };

        this._updateActiveAppUI = (appName) => {
            const appInfo = this.querySelector('.app-info span');
            if (appInfo) {
                appInfo.textContent = appName;
                appInfo.classList.remove('new-preset');
            }
        };

        this._appUpdateHandler = (e) => {
            const state = this._state.get(this);
            if (state) {
                this._state.set(this, {
                    ...state,
                    applications: [...new Set([...state.applications, ...e.detail.apps])],
                    hasPresets: true
                });

                this._render();
                this._removeAllHandlers();
                this._setupEventListeners();

                const labelsVisible = localStorage.getItem('labelsVisible') !== 'false';
                const componentsVisible = localStorage.getItem('componentsVisible') !== 'false';

                this.querySelectorAll('.in-progress').forEach(el => {
                    if (!el.classList.contains('in-progress-without')) {
                        el.style.display = componentsVisible ? '' : 'none';
                    }
                });

                this.querySelectorAll('.in-progress::after').forEach(el => {
                    el.style.display = labelsVisible ? 'block' : 'none';
                });
            }
        };
    }

    getInitialState() {
        return {
            isLoading: false,
            presetTypes: ['создание пресета', 'обновление пресета', 'миграция пресетов'],
            tags: ['quantum-parser@2.1.0'],
            commands: ['migrate:presets'],
            deleteCommands: [],
            updateCommands: [],
            createCommands: ['migrate:save'],
            presetNameInput: '',
            isNewPreset: false,
            activeApp: 'dynamic-parameter-addition',
            currentTask: null,
            terminal: null,
            terminalReady: false,
            tagInput: '',
            commandInput: '',
            deleteCommandInput: '',
            updateCommandInput: '',
            createCommandInput: '',
            applications: [],
            hasPresets: false,
            loading: false
        };
    }

    async connected() {
        try {
            if (this._initialized) return;
            if (!this.id) throw new Error('Компонент требует ID');

            // Восстановление состояний из localStorage
            const labelsVisible = localStorage.getItem('labelsVisible') !== 'false';
            const componentsVisible = localStorage.getItem('componentsVisible') !== 'false';

            this.terminal = await waitForTerminal(5000);

            const activeApp = await getActiveApp();
            const initialState = {
                ...this.getInitialState(),
                terminal: this.terminal,
                activeApp,
                terminalReady: !!this.terminal,
                labelsVisible,
                componentsVisible
            };

            if (!this._managers?.socket) {
                this._managers = this._managers || {};
                this._managers.socket = new SocketManager();
                await this._managers.socket.init();
            }

            document.addEventListener('applications-updated', this._appUpdateHandler);

            this._state.set(this, initialState);
            this._initialized = true;
            this._render();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorState(error);
        }
    }

    onload() {
        const labelsVisible = localStorage.getItem('labelsVisible') !== 'false';
        const componentsVisible = localStorage.getItem('componentsVisible') !== 'false';

        this.querySelectorAll('.in-progress').forEach(el => {
            if (!el.classList.contains('in-progress-without')) {
                el.style.display = componentsVisible ? '' : 'none';
            }
        });

        this.querySelectorAll('.in-progress::after').forEach(el => {
            el.style.display = labelsVisible ? 'block' : 'none';
        });
    }

    _render() {
        if (!this._initialized || !this._state.get(this)) {
            console.warn('Skipping render: component not initialized');
            return;
        }

        try {
            const state = this._state.get(this);
            renderTemplate(this, panelParamsTemplate, state);
            this._setupEventListeners();
        } catch (error) {
            console.error('Render error:', error);
            this.showErrorState(error);
        }
    }

    _removeAllHandlers() {
        this.querySelectorAll('input').forEach(input => {
            input.removeEventListener('keydown', this._handleInputKeydown);
            if (input.classList.contains('preset-name-input')) {
                input.removeEventListener('input', this._handlePresetNameChange);
            }
        });

        this.querySelectorAll('[data-handler^="handleRemove"]').forEach(btn => {
            btn.removeEventListener('click', this._handleRemoveClick);
        });

        const createBtn = this.querySelector('.create-preset-btn');
        if (createBtn) {
            createBtn.removeEventListener('click', this._handleCreatePreset);
        }

        const getPresetsBtn = this.querySelector('.get-presets-btn');
        if (getPresetsBtn) {
            getPresetsBtn.removeEventListener('click', this._handleGetPresets);
        }

        document.removeEventListener('applications-updated', this._appUpdateHandler);
    }

    _setupEventListeners() {
        const inputSelectors = {
            '.tag-input': 'tag',
            '.command-input': 'command',
            '.delete-command-input': 'deleteCommand',
            '.update-command-input': 'updateCommand',
            '.create-command-input': 'createCommand'
        };

        Object.entries(inputSelectors).forEach(([selector, type]) => {
            const input = this.querySelector(selector);
            if (input) {
                input.removeEventListener('keydown', this._handleInputKeydown);
                input.addEventListener('keydown', this._handleInputKeydown);
                input.dataset.inputType = type;
            }
        });

        const presetNameInput = this.querySelector('.preset-name-input');
        if (presetNameInput) {
            presetNameInput.addEventListener('input', this._handlePresetNameChange);
        }

        const createBtn = this.querySelector('.create-preset-btn');
        if (createBtn) {
            createBtn.addEventListener('click', this._handleCreatePreset);
        }

        const getPresetsBtn = this.querySelector('.get-presets-btn');
        if (getPresetsBtn) {
            getPresetsBtn.addEventListener('click', this._handleGetPresets);
        }

        const setAppBtn = this.querySelector('.set-app-btn');
        if (setAppBtn) {
            setAppBtn.removeEventListener('click', this._handleSetAppClick);
            setAppBtn.addEventListener('click', this._handleSetAppClick);
        }
    }

    _handleSetAppClick = async () => {
        const select = this.querySelector('.presets-select');
        let appInfo = this.querySelector('.app-info');
        appInfo = appInfo.querySelector('span')

        const selectedApp = select?.value;
        if (!selectedApp) return;

        try {
            const response = await fetch('/api/set-active-app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app: selectedApp })
            });

            if (!response.ok) throw new Error(await response.text());

            const labelsVisible = localStorage.getItem('labelsVisible') !== 'false';
            const componentsVisible = localStorage.getItem('componentsVisible') !== 'false';

            this.querySelectorAll('.in-progress').forEach(el => {
                if (!el.classList.contains('in-progress-without')) {
                    el.style.display = componentsVisible ? '' : 'none';
                }
            });

            this.querySelectorAll('.in-progress::after').forEach(el => {
                el.style.display = labelsVisible ? 'block' : 'none';
            });

            this._state.set(this, {
                ...this._state.get(this),
                activeApp: selectedApp
            });

            appInfo.textContent = selectedApp
            appInfo.classList.remove('new-preset');
            const successMessage = `Активное приложение изменено на: ${selectedApp}`;
            this.terminal?.addTerminalLine?.(successMessage, 'success') ||
            window.terminal?.addTerminalLine?.(successMessage, 'success') ||
            console.log(`[PanelParams] ${successMessage}`);

        } catch (error) {
            const errorMessage = `Ошибка изменения приложения: ${error.message}`;
            this.terminal?.addTerminalLine?.(errorMessage, 'error') ||
            window.terminal?.addTerminalLine?.(errorMessage, 'error') ||
            console.error(`[PanelParams] ${errorMessage}`);
        }
    };

    disconnectedCallback() {
        this._removeAllHandlers();
        if (this._managers?.socket) {
            this._managers.socket.terminate();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this._initialized) return;
        super.attributeChangedCallback(name, oldValue, newValue);
        this._render();
    }

    showErrorState(error) {
        this.innerHTML = `
            <div class="error-state">
                <h4>Ошибка компонента</h4>
                <p>${error.message}</p>
                <button class="retry-btn">Повторить попытку</button>
            </div>
        `;
        this.querySelector('.retry-btn')?.addEventListener('click', () => {
            this.connectedCallback();
        });
    }
}

if (!customElements.get(name)) {
    customElements.define(name, PanelParams);
}

export default PanelParams;