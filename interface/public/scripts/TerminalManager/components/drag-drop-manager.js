// public/scripts/TerminalManager/components/drag-drop-manager.js
export class DragDropManager {
    constructor(terminal) {
        this.terminal = terminal;
        this._state = new WeakMap();
    }

    init() {
        try {
            this.setupDragAndDrop();
            this.setupDragAndDropLeft();
            this.setupLayoutResizing();
            this.showDndPlaceholder(); // Добавлена инициализация placeholder
            return this;
        } catch (error) {
            console.error('DragDropManager init error:', error);
            this.terminal.addTerminalLine('Ошибка инициализации Drag&Drop', 'error');
            return this;
        }
    }

    setupDragAndDrop() {
        if (!this.terminal.dndZone) {
            console.warn('DnD zone not found');
            return;
        }

        this.terminal.dndZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            try {
                const afterElement = this.getDragAfterElement(this.terminal.dndZone, e.clientY);
                const draggable = document.querySelector('.dragging');

                if (!draggable || !this.terminal.dndZone) return;

                if (afterElement && afterElement.parentNode === this.terminal.dndZone) {
                    this.terminal.dndZone.insertBefore(draggable, afterElement);
                } else if (this.terminal.dndZone) {
                    this.terminal.dndZone.appendChild(draggable);
                }
            } catch (error) {
                console.error('Drag over error:', error);
            }
        });

        this.terminal.dndZone.addEventListener('drop', (e) => {
            e.preventDefault();
            try {
                if (!e.dataTransfer) return;

                const scriptName = e.dataTransfer.getData('text/plain');
                if (!scriptName) return;

                const isExistingScript = document.querySelector('.dragging');
                if (!isExistingScript && this.terminal.dndZone) {
                    this.addScriptToDndZone(scriptName);
                }

                if (this.terminal._managers.preset) {
                    this.terminal._managers.preset.saveActivePreset();
                }
            } catch (error) {
                console.error('Drop error:', error);
                this.terminal.addTerminalLine('Ошибка при перетаскивании элемента', 'error');
            }
        });
    }

    setupDragAndDropLeft() {
        if (!this.terminal.dndZoneLeft) {
            console.warn('Left DnD zone not found');
            return;
        }

        this.terminal.dndZoneLeft.addEventListener('dragover', (e) => {
            e.preventDefault();
            try {
                const afterElement = this.getDragAfterElement(this.terminal.dndZoneLeft, e.clientY);
                const draggable = document.querySelector('.dragging');

                if (!draggable || !this.terminal.dndZoneLeft) return;

                if (afterElement && afterElement.parentNode === this.terminal.dndZoneLeft) {
                    this.terminal.dndZoneLeft.insertBefore(draggable, afterElement);
                } else if (this.terminal.dndZoneLeft) {
                    this.terminal.dndZoneLeft.appendChild(draggable);
                }
            } catch (error) {
                console.error('Left panel drag over error:', error);
            }
        });
    }

    getDragAfterElement(container, y) {
        try {
            if (!container) return null;

            const draggableElements = [...container.querySelectorAll('.dnd-script:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                return (offset < 0 && offset > closest.offset) ?
                    { offset: offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        } catch (error) {
            console.error('Get drag after element error:', error);
            return null;
        }
    }

    addScriptToDndZone(scriptName) {
        try {
            if (!scriptName || !this.terminal.dndZone) return;

            if (this.terminal.dndZone.querySelector('.dnd-script.placeholder')) {
                this.terminal.dndZone.innerHTML = '';
            }

            const scriptEl = document.createElement('div');
            scriptEl.className = 'dnd-script';
            scriptEl.draggable = true;
            scriptEl.dataset.script = scriptName;
            scriptEl.innerHTML = `
                <div class="status-indicators">
                    <div class="status-indicator"></div>
                    <div class="status-indicator"></div>
                    <div class="status-indicator"></div>
                    <div class="status-indicator"></div>
                    <div class="status-indicator"></div>
                </div>
                <i class="fas fa-grip-vertical"></i>
                <span>${scriptName}</span>
                <i class="fas fa-times remove-btn"></i>
            `;

            scriptEl.addEventListener('dragstart', (e) => {
                try {
                    e.dataTransfer.setData('text/plain', scriptName);
                    scriptEl.classList.add('dragging');
                } catch (error) {
                    console.error('Drag start error:', error);
                }
            });

            scriptEl.addEventListener('dragend', () => {
                scriptEl.classList.remove('dragging');
            });

            const removeBtn = scriptEl.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    scriptEl.remove();
                    if (this.terminal.dndZone && this.terminal.dndZone.children.length === 0) {
                        this.showDndPlaceholder();
                    }
                    if (this.terminal._managers.preset) {
                        this.terminal._managers.preset.saveActivePreset();
                    }
                });
            }

            this.terminal.dndZone.appendChild(scriptEl);
        } catch (error) {
            console.error('Add script to DnD zone error:', error);
            this.terminal.addTerminalLine('Ошибка создания элемента скрипта', 'error');
        }
    }

    showDndPlaceholder() {
        try {
            if (!this.terminal.dndZone) return;

            const hasScripts = this.terminal.dndZone.querySelector('.dnd-script:not(.placeholder)');
            if (!hasScripts) {
                this.terminal.dndZone.innerHTML = `
                    <div class="dnd-script placeholder">
                        <div class="status-indicators">
                            <div class="status-indicator"></div>
                            <div class="status-indicator"></div>
                            <div class="status-indicator"></div>
                            <div class="status-indicator"></div>
                            <div class="status-indicator"></div>
                        </div>
                        <i class="fas fa-arrows-alt"></i>
                        <span>Перетащите скрипты сюда для создания последовательности</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Show placeholder error:', error);
        }
    }

    setupLayoutResizing() {
        try {
            const layout = document.querySelector('.three-column-layout');
            const terminal = document.querySelector('.terminal-container');

            if (!layout || !terminal) return;

            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'layout-resize-handle';
            layout.parentNode.insertBefore(resizeHandle, layout);

            let startY, startLayoutHeight, startTerminalHeight;

            resizeHandle.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.isResizing = true;
                startY = e.clientY;
                startLayoutHeight = parseInt(getComputedStyle(layout).height);
                startTerminalHeight = parseInt(getComputedStyle(terminal).height);
                document.body.style.cursor = 'row-resize';
                document.addEventListener('mousemove', this.handleResize);
                document.addEventListener('mouseup', this.stopResize);
                e.preventDefault();
            });

            this.handleResize = (e) => {
                if (!this.isResizing) return;
                const dy = startY - e.clientY;

                const newLayoutHeight = Math.max(200, Math.min(
                    startLayoutHeight + dy,
                    window.innerHeight - 200
                ));

                const newTerminalHeight = Math.max(100, Math.min(
                    startTerminalHeight - dy,
                    window.innerHeight - 150
                ));

                layout.style.height = `${newLayoutHeight}px`;
                terminal.style.height = `${newTerminalHeight}px`;
            };

            this.stopResize = () => {
                this.isResizing = false;
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', this.handleResize);
                document.removeEventListener('mouseup', this.stopResize);
                localStorage.setItem('layoutHeight', layout.style.height);
                localStorage.setItem('terminalHeight', terminal.style.height);
            };

            const savedLayoutHeight = localStorage.getItem('layoutHeight');
            const savedTerminalHeight = localStorage.getItem('terminalHeight');
            if (savedLayoutHeight) layout.style.height = savedLayoutHeight;
            if (savedTerminalHeight) terminal.style.height = savedTerminalHeight;
        } catch (error) {
            console.error('Layout resizing setup error:', error);
        }
    }
}