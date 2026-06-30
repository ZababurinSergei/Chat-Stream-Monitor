import { getTerminal } from '../../global-state.mjs';

export class EventManager {
    constructor(terminal) {
        this.terminal = terminal || getTerminal();
        this._handlers = new Map();
        this._elementHandlers = new WeakMap();
        this._pendingHandlers = new Map();
        this._presetsContainerHandlers = new Set();
        this._observer = new MutationObserver(this._handleMutations.bind(this));
        this._panelParamsObserver = new MutationObserver(this._handlePanelParamsMutations.bind(this));
    }

    init() {
        this.setupCoreHandlers();
        this.setupPanelParamsHandlers();
        this.setupPresetsContainerHandlers();
        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id', 'class', 'data-state']
        });

        // Initialize states from localStorage
        this._initializeStates();
        return this;
    }

    _initializeStates() {
        const inputVisible = localStorage.getItem('inputVisible') === 'true';
        const privateVisible = localStorage.getItem('privateVisible') === 'true';

        if (this.terminal.inputArea) {
            this.terminal.inputArea.style.display = inputVisible ? 'flex' : 'none';
        }

        if (this.terminal.toggleInput) {
            this.terminal.toggleInput.checked = inputVisible;
        }

        if (this.terminal.togglePrivate) {
            this.terminal.togglePrivate.checked = privateVisible;
        }

        document.querySelectorAll('.private-group').forEach(el => {
            el.style.display = privateVisible ? '' : 'none';
        });
    }

    _handleMutations(mutations) {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
                this._reconnectHandlers(mutation.target);
            } else if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this._reconnectHandlers(node);
                        this._checkForPanelParams(node);
                    }
                });
            }
        });
    }

    _handlePanelParamsMutations(mutations) {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' || mutation.type === 'childList') {
                this.setupPanelParamsHandlers(mutation.target);
            }
        });
    }

    _checkForPanelParams(root) {
        const panels = root.querySelectorAll('nk-panel-params');
        panels.forEach(panel => {
            this._panelParamsObserver.observe(panel, {
                attributes: true,
                childList: true,
                subtree: true
            });
            this.setupPanelParamsHandlers(panel);
        });
    }

    _reconnectHandlers(element) {
        if (this._elementHandlers.has(element)) {
            const handlers = this._elementHandlers.get(element);
            handlers.forEach((handlerId, type) => {
                const { target: storedTarget, type: storedType, handler } = this._handlers.get(handlerId);
                storedTarget.removeEventListener(storedType, handler);
                this._handlers.delete(handlerId);
                handlers.delete(type);
            });
        }
    }

    terminate() {
        this.clearAllHandlers();
        this._observer.disconnect();
        this._panelParamsObserver.disconnect();
        this._presetsContainerHandlers.clear();
    }

    setupCoreHandlers() {
        this.addHandler('#clear-btn', 'click', () => this.terminal.clearTerminal());
        this.addHandler('#copy-btn', 'click', () => this.terminal.copyTerminalContent());
        this.addHandler('#run-btn', 'click', () => this.terminal.runScriptSequence());
        this.addHandler('#run-btn-left', 'click', () => this.terminal.runScriptSequence());
        this.addHandler('#save-btn', 'click', () => this._handleSavePreset());
        this.addHandler('#save-btn-left', 'click', () => this._handleSavePreset());
        this.addHandler('#clear-dnd-btn', 'click', () => this.terminal.clearDndZone());
        this.addHandler('#clear-dnd-btn-left', 'click', () => this.terminal.clearDndZoneLeft());
        this.addHandler('#add-preset-btn', 'click', () => this._handleAddPreset());
        this.addHandler('#add-preset-btn-left', 'click', () => this._handleAddPreset());
        this.addHandler('#toggle-private', 'change', (e) => this._handleTogglePrivate(e));
        this.addHandler('#toggle-private-left', 'change', (e) => this._handleTogglePrivate(e));
        this.addHandler('#toggle-input', 'change', (e) => this._handleToggleInput(e));
        this.addHandler('#toggle-input-left', 'change', (e) => this._handleToggleInput(e));
        this.addHandler('#toggle-configurator', 'change', (e) => this._handleToggleConfigurator(e));
        this.addHandler('#command-input', 'keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.terminal.commandInput.value.trim();
                if (command) {
                    this.terminal.executeCommand(command);
                    this.terminal.commandInput.value = '';
                }
            }
        });
    }

    setupPanelParamsHandlers(panel = null) {
        const targetPanel = panel || document.querySelector('nk-panel-params');
        if (!targetPanel) return;

        const select = targetPanel.querySelector('.presets-select');
        const setAppBtn = targetPanel.querySelector('.set-app-btn');

        if (select) {
            this.removeHandler(select, 'change');
            this.addHandler(select, 'change', (e) => {
                if (setAppBtn) {
                    setAppBtn.disabled = !e.target.value;
                }
            });
        }
    }

    setupPresetsContainerHandlers() {
        this.onElementReady('#presets-container', (container) => {
            const header = container.querySelector('.presets-header');
            const content = container.querySelector('.presets-content');

            if (header) {
                const headerHandler = () => {
                    const isVisible = content.style.display === 'block';
                    content.style.display = isVisible ? 'none' : 'block';
                    const icon = header.querySelector('i');
                    if (icon) {
                        icon.className = isVisible ? 'fas fa-caret-down' : 'fas fa-caret-up';
                    }
                };
                this._presetsContainerHandlers.add(
                    this.addHandler(header, 'click', headerHandler)
                );
            }

            if (content) {
                const contentHandler = (e) => {
                    const presetItem = e.target.closest('.preset-item');
                    if (!presetItem) return;

                    if (e.target.classList.contains('delete-preset')) {
                        e.stopPropagation();
                        const presetIndex = presetItem.dataset.index;
                        this.terminal._managers.preset.deletePreset(presetIndex);
                    } else {
                        const presetIndex = presetItem.dataset.index;
                        this.terminal._managers.preset.setActivePreset(presetIndex);
                        this.togglePresetsDropdown();
                    }
                };
                this._presetsContainerHandlers.add(
                    this.addHandler(content, 'click', contentHandler)
                );
            }
        });
    }

    addHandler(element, type, handler, options = {}) {
        const target = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!target) {
            if (options.maxRetries !== 0) {
                this._addPendingHandler(element, type, handler, options);
            }
            return () => {};
        }

        const wrappedHandler = handler.bind(this.terminal);
        target.addEventListener(type, wrappedHandler);

        const handlerId = Symbol();
        this._handlers.set(handlerId, { target, type, handler: wrappedHandler });

        if (!this._elementHandlers.has(target)) {
            this._elementHandlers.set(target, new Map());
        }
        this._elementHandlers.get(target).set(type, handlerId);

        return () => this.removeHandler(target, type);
    }

    removeHandler(element, type) {
        const target = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!target || !this._elementHandlers.has(target)) return;

        const handlers = this._elementHandlers.get(target);
        if (handlers.has(type)) {
            const handlerId = handlers.get(type);
            const { target: storedTarget, type: storedType, handler } = this._handlers.get(handlerId);
            storedTarget.removeEventListener(storedType, handler);
            this._handlers.delete(handlerId);
            handlers.delete(type);
        }
    }

    onElementReady(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            return;
        }

        const callbackId = Symbol();
        this._pendingHandlers.set(callbackId, { selector, callback });

        const checkInterval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(checkInterval);
                this._pendingHandlers.delete(callbackId);
                callback(el);
            }
        }, 100);
    }

    _addPendingHandler(selector, type, handler, options) {
        const pendingId = Symbol();
        const retries = options.maxRetries || 3;
        let attempt = 0;

        const checkInterval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(checkInterval);
                this._pendingHandlers.delete(pendingId);
                this.addHandler(element, type, handler, { ...options, maxRetries: 0 });
                return;
            }

            attempt++;
            if (attempt >= retries) {
                clearInterval(checkInterval);
                this._pendingHandlers.delete(pendingId);
                console.warn(`Element ${selector} not found after ${retries} attempts`);
            }
        }, options.retryDelay || 100);
    }

    _checkPending() {
        this._pendingHandlers.forEach(({ selector, callback }, id) => {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                this._pendingHandlers.delete(id);
            }
        });
    }

    clearAllHandlers() {
        this._handlers.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this._handlers.clear();
        this._elementHandlers = new WeakMap();
        this._pendingHandlers.clear();

        this._presetsContainerHandlers.forEach(remove => remove());
        this._presetsContainerHandlers.clear();
    }

    togglePresetsDropdown() {
        const container = document.getElementById('presets-container');
        if (!container) return;

        const content = container.querySelector('.presets-content');
        const isVisible = content.style.display === 'block';
        content.style.display = isVisible ? 'none' : 'block';

        const icon = container.querySelector('.presets-header i');
        if (icon) {
            icon.className = isVisible ? 'fas fa-caret-down' : 'fas fa-caret-up';
        }
    }

    _handleTogglePrivate(e) {
        const isChecked = e.target.checked;
        const privateGroups = document.querySelectorAll('.private-group');
        privateGroups.forEach(group => {
            group.style.display = isChecked ? '' : 'none';
        });
        localStorage.setItem('privateVisible', isChecked);
    }

    _handleToggleInput(e) {
        const isChecked = e.target.checked;
        this.terminal.inputArea.style.display = isChecked ? 'flex' : 'none';
        localStorage.setItem('inputVisible', isChecked);
    }

    _handleToggleConfigurator(e) {
        const isChecked = e.target.checked;
        this.terminal.configurator.toggle(isChecked);
    }

    _handleSavePreset() {
        if (this.terminal._managers?.preset?._isSaving) return;
        this.terminal._managers?.preset?.saveCurrentPreset()
            ?.then(success => {
                if (success) {
                    this.terminal.addTerminalLine('Пресет успешно сохранен', 'success');
                }
            });
    }

    _handleAddPreset() {
        const presetName = prompt('Введите название пресета:');
        if (presetName && this.terminal._managers?.preset) {
            this.terminal._managers.preset.presets.push({
                name: presetName,
                scripts: []
            });
            this.terminal._managers.preset.setActivePreset(
                this.terminal._managers.preset.presets.length - 1
            );
            this.terminal._managers.preset.savePresets();
            this.terminal.addTerminalLine(`Пресет "${presetName}" создан`);
        }
    }

    refreshHandlers() {
        this.clearAllHandlers();
        this.init();
    }
}