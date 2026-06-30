// public/scripts/panel-configurator.js
class PanelConfigurator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    background-color: #252526;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    margin-bottom: 15px;
                    transition: height 0.3s ease, margin 0.3s ease;
                }

                .config-container {
                    height: 200px;
                    overflow-y: auto;
                    transition: height 0.3s ease, opacity 0.2s ease;
                    background-color: #2a2d2e;
                    padding: 15px;
                }

                .config-container.collapsed {
                    height: 0;
                    opacity: 0;
                    padding: 0;
                    overflow: hidden;
                }

                .panel-config {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .config-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #9cdcfe;
                    font-size: 16px;
                    margin-bottom: 10px;
                }

                .config-section {
                    background-color: #252526;
                    border-radius: 4px;
                    padding: 12px;
                    border-left: 3px solid #569cd6;
                }

                .section-title {
                    color: #ce9178;
                    font-size: 14px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .config-container::-webkit-scrollbar {
                    width: 6px;
                }

                .config-container::-webkit-scrollbar-thumb {
                    background-color: rgba(86, 156, 214, 0.5);
                    border-radius: 3px;
                }

                .config-container::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(86, 156, 214, 0.8);
                }
            </style>

            <div class="config-container collapsed">
                <div class="panel-config">
                    <div class="config-header">
                        <i class="fas fa-sliders-h"></i>
                        <span>Конфигуратор панелей v7.4.0</span>
                    </div>

                    <div class="config-section">
                        <div class="section-title">
                            <i class="fas fa-columns"></i>
                            <span>Настройки размера</span>
                        </div>
                        <div class="size-controls">
                            <label>
                                <span>Ширина левой панели:</span>
                                <input type="range" min="200" max="500" value="350" class="left-width">
                            </label>
                            <label>
                                <span>Ширина правой панели:</span>
                                <input type="range" min="200" max="500" value="350" class="right-width">
                            </label>
                        </div>
                    </div>

                    <div class="config-section">
                        <div class="section-title">
                            <i class="fas fa-prescription-bottle"></i>
                            <span>Управление пресетами</span>
                        </div>
                        <div class="preset-controls">
                            <button class="save-preset">Сохранить текущий</button>
                            <button class="reset-preset">Сбросить к стандартному</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.controls = {
            leftWidth: this.shadowRoot.querySelector('.left-width'),
            rightWidth: this.shadowRoot.querySelector('.right-width'),
            savePreset: this.shadowRoot.querySelector('.save-preset'),
            resetPreset: this.shadowRoot.querySelector('.reset-preset')
        };
    }

    connectedCallback() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.controls.leftWidth?.addEventListener('input', (e) => {
            this.dispatchEvent(new CustomEvent('panel-resize', {
                detail: { panel: 'left', width: e.target.value }
            }));
        });

        this.controls.rightWidth?.addEventListener('input', (e) => {
            this.dispatchEvent(new CustomEvent('panel-resize', {
                detail: { panel: 'right', width: e.target.value }
            }));
        });

        this.controls.savePreset?.addEventListener('click', () => {
            this.dispatchEvent(new Event('save-preset'));
        });

        this.controls.resetPreset?.addEventListener('click', () => {
            this.dispatchEvent(new Event('reset-preset'));
        });
    }

    toggle(show) {
        const container = this.shadowRoot.querySelector('.config-container');
        container.classList.toggle('collapsed', !show);

        this.dispatchEvent(new CustomEvent('configurator-toggle', {
            detail: { visible: show }
        }));
    }

    setPanelWidths(left, right) {
        if (this.controls.leftWidth) this.controls.leftWidth.value = left;
        if (this.controls.rightWidth) this.controls.rightWidth.value = right;
    }
}

customElements.define('panel-configurator', PanelConfigurator);