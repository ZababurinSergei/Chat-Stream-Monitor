// src/main.js
import { TerminalManager } from './components/terminal-manager.js';
import { initGlobalState } from '../global-state.mjs';

// Инициализация системы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Инициализация глобального состояния
        initGlobalState();

        // 2. Создание экземпляра TerminalManager
        const terminalManager = new TerminalManager();

        // 3. Восстановление состояний из localStorage перед инициализацией
        const inputVisible = localStorage.getItem('inputVisible') === 'true';
        const privateVisible = localStorage.getItem('privateVisible') === 'true';

        // 4. Применение сохраненных состояний
        if (terminalManager.inputArea) {
            terminalManager.inputArea.style.display = inputVisible ? 'flex' : 'none';
        }

        document.querySelectorAll('.private-group').forEach(el => {
            el.style.display = privateVisible ? '' : 'none';
        });

        // 5. Запуск системы
        await terminalManager.init();

        // 6. Проверка состояния DnD зоны
        if (!terminalManager.dndZone.querySelector('.dnd-script:not(.placeholder)')) {
            terminalManager.getManager('dragDrop').showDndPlaceholder();
        }

        console.log('Quantum Git System initialized successfully!');

    } catch (error) {
        console.error('Initialization failed:', error);
        document.body.innerHTML = `
            <div class="error-screen">
                <h2>System Initialization Error</h2>
                <p>${error.message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
});

// Обработчики глобальных ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Инициализация значений по умолчанию
if (localStorage.getItem('inputVisible') === null) {
    localStorage.setItem('inputVisible', 'false');
}
if (localStorage.getItem('privateVisible') === null) {
    localStorage.setItem('privateVisible', 'false');
}