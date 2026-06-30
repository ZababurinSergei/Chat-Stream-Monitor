/**
 * Module for panel params template rendering
 * @module template
 */

export const panelParamsTemplate = (state = {}) => {
    const {
        presetTypes = ['создание пресета', 'обновление пресета', 'миграция пресетов'],
        tags = ['quantum-parser@2.1.0'],
        commands = ['migrate:presets'],
        deleteCommands = [],
        updateCommands = [],
        createCommands = ['migrate:save'],
        presetNameInput = '',
        activeApp = 'dynamic-parameter-addition',
        currentTask = null,
        terminal = null,
        terminalReady = false,
        tagInput = '',
        commandInput = '',
        deleteCommandInput = '',
        updateCommandInput = '',
        createCommandInput = '',
        applications = [],
        hasPresets = false,
        loading = false
    } = state;

    return `
        <div class="params-panel">
            <h3>Управление параметрами приложения</h3>
            
            <div class="control-group in-progress">
                <label>Тип пресета:</label>
                <select class="preset-type-select">
                    ${presetTypes.map(type => `
                        <option ${type === 'создание пресета' ? 'selected' : ''}>${type}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="tags-control">
                <label style="color: var(--prompt-color);">Теги запроса: <span class="input-hint">(например: auth-module, v2-api)</span></label>
                <div class="tag-input-container">
                    ${tags.map(tag => `
                        <span class="tag" data-value="${tag}">
                            ${tag}
                            <span class="tag-remove" data-handler="handleRemoveTag">×</span>
                        </span>
                    `).join('')}
                    <input type="text" 
                          class="tag-input"
                          placeholder="Добавить тег (Enter)"
                          value="${tagInput}">
                </div>
            </div>
            
            <div class="tags-control">
                <label>Команды получения пресетов: <span class="input-hint">(например: list:presets, get:config)</span></label>
                <div class="tag-input-container">
                    ${commands.map(cmd => `
                        <span class="command-tag" data-value="${cmd}">
                            ${cmd}
                            <span class="command-remove" data-handler="handleRemoveCommand">×</span>
                        </span>
                    `).join('')}
                    <input type="text" 
                          class="command-input"
                          placeholder="Добавить команду (Enter)"
                          value="${commandInput}">
                </div>
            </div>
            
            <div class="tags-control in-progress">
                <label>Команды удаления пресетов: <span class="input-hint">(например: delete:preset, remove:config)</span></label>
                <div class="tag-input-container">
                    ${deleteCommands.map(cmd => `
                        <span class="command-tag" data-value="${cmd}">
                            ${cmd}
                            <span class="command-remove" data-handler="handleRemoveDeleteCommand">×</span>
                        </span>
                    `).join('')}
                    <input type="text" 
                          class="delete-command-input"
                          placeholder="Добавить команду (Enter)"
                          value="${deleteCommandInput}">
                </div>
            </div>
            
            <div class="tags-control in-progress">
                <label>Команды обновления пресетов: <span class="input-hint">(например: update:preset, refresh:config)</span></label>
                <div class="tag-input-container">
                    ${updateCommands.map(cmd => `
                        <span class="command-tag" data-value="${cmd}">
                            ${cmd}
                            <span class="command-remove" data-handler="handleRemoveUpdateCommand">×</span>
                        </span>
                    `).join('')}
                    <input type="text" 
                          class="update-command-input"
                          placeholder="Добавить команду (Enter)"
                          value="${updateCommandInput}">
                </div>
            </div>
            
            <div class="tags-control in-progress">
                <label>Команды создания пресета:</label>
                <div class="tag-input-container">
                    ${createCommands.map(cmd => `
                        <span class="command-tag" data-value="${cmd}">
                            ${cmd}
                            <span class="command-remove" data-handler="handleRemoveCreateCommand">×</span>
                        </span>
                    `).join('')}
                    <input type="text" 
                          class="create-command-input"
                          placeholder="Добавить команду (Enter)"
                          value="${createCommandInput}">
                </div>
            </div>
            
            <div class="tags-control actions">
                <label>Создание пресета:</label>
                <div class="preset-creation">
                    <input type="text" 
                          class="preset-name-input"
                          placeholder="Введите название пресета"
                          value="${presetNameInput}"
                          @input="_handlePresetNameChange">
                    <button class="create-preset-btn" 
                            @click="_handleCreatePreset"
                            ${!presetNameInput.trim() ? 'disabled' : ''}>
                        Создать
                    </button>
                </div>
            </div>
            
            <div class="tags-control actions">
                <label>Действия: <span class="input-hint">(выберите операцию)</span></label>
                <div class="preset-creation"> 
                    <button class="get-presets-btn" ${loading ? 'disabled' : ''}>
                        ${loading ? 'Загрузка...' : 'Получить пресеты'}
                    </button>
                    
                    ${currentTask ? `
                    <div class="task-status ${currentTask.status}">
                        <span>${currentTask.name}</span>
                        <progress value="${currentTask.progress}" max="100"></progress>
                        ${currentTask.error ? `
                            <div class="error">Ошибка: ${currentTask.error}</div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    <select class="presets-select" ${!state.hasPresets ? 'disabled' : ''}>
                        ${applications.length ? applications.map(app => `
                            <option value="${app}">${app}</option>
                        `).join('') : `
                            <option>Нет доступных приложений</option>
                        `}
                    </select>
                    
                    <button class="set-app-btn" ${!state.hasPresets || !activeApp ? 'disabled' : ''}>
                        Установить
                    </button>
                </div>
            </div>
            
            <div class="app-info">
                <label>Активное приложение:</label>
                <span>${activeApp}</span>
            </div>
        </div>
    `;
};