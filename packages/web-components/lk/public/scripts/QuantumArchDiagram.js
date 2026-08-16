// DiagramGenerator.js
import { Component } from './base-nk/index.mjs';

const name = 'nk-diagram-generator';

class DiagramGenerator extends (await Component()) {
    static get observedAttributes() {
        return [...super.observedAttributes, 'data-diagram', 'data-type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._state = new WeakMap();
    }

    async connected() {
        if (!this.id) {
            console.error('DiagramGenerator требует ID');
            return;
        }

        this._state.set(this, {
            diagram: this.dataset.diagram || '',
            type: this.dataset.type || 'flowchart',
            config: {
                theme: 'dark',
                securityLevel: 'loose',
                flowchart: { curve: 'basis' },
                sequence: { actorMargin: 50 },
                gantt: { axisFormat: '%Y-%m-%d' }
            }
        });

        this._render();
        this.initMermaid();
    }

    initMermaid() {
        const loadMermaid = () => {
            if (window.mermaid) {
                this.renderDiagram();
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
                script.onload = () => {
                    this.renderDiagram();
                    this.setupObserver();
                };
                document.head.appendChild(script);
            }
        };

        if (document.readyState === 'complete') {
            loadMermaid();
        } else {
            window.addEventListener('load', loadMermaid);
        }
    }

    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-diagram') {
                    this._state.set(this, {
                        ...this._state.get(this),
                        diagram: this.dataset.diagram
                    });
                    this.renderDiagram();
                }
            });
        });

        observer.observe(this, { attributes: true });
    }

    async renderDiagram() {
        const { diagram, type, config } = this._state.get(this);
        const container = this.shadowRoot.querySelector('.diagram-container');

        if (!container || !diagram.trim()) return;

        try {
            mermaid.initialize({
                ...config,
                startOnLoad: false
            });

            // Очистка предыдущей диаграммы
            container.innerHTML = '';

            const { svg } = await mermaid.render(`${this.id}-diagram`, diagram);
            container.innerHTML = svg;

            // Добавляем интерактивность
            this.addDiagramInteractivity(container);

        } catch (error) {
            container.innerHTML = `
        <div class="error">
          Ошибка рендеринга ${type}-диаграммы: ${error.message}
          <pre>${diagram}</pre>
        </div>
      `;
            console.error('Mermaid error:', error);
        }
    }

    addDiagramInteractivity(container) {
        // Добавляем обработчики для узлов диаграммы
        container.querySelectorAll('.node').forEach(node => {
            node.style.cursor = 'pointer';
            node.addEventListener('click', (e) => {
                this.dispatchEvent(new CustomEvent('node-click', {
                    detail: {
                        id: node.id,
                        text: node.querySelector('text')?.textContent || '',
                        element: node
                    },
                    bubbles: true
                }));
            });
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-diagram' && oldValue !== newValue) {
            this._state.set(this, {
                ...this._state.get(this),
                diagram: newValue
            });
            this.renderDiagram();
        }
    }

    _render() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          contain: content;
          --diagram-bg: #252526;
          --error-color: #f44336;
        }

        .diagram-container {
          background: var(--diagram-bg);
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          min-height: 200px;
          overflow: auto;
        }

        .error {
          color: var(--error-color);
          padding: 10px;
          border: 1px dashed var(--error-color);
          font-family: monospace;
        }

        .error pre {
          white-space: pre-wrap;
          background: rgba(244, 67, 54, 0.1);
          padding: 10px;
          border-radius: 4px;
        }

        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        button {
          background: #569cd6;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>

      <div class="diagram-container"></div>
    `;
    }
}

if (!customElements.get(name)) {
    customElements.define(name, DiagramGenerator);
}

export default DiagramGenerator;