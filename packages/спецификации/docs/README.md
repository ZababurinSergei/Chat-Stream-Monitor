Конечно! Вот универсальная структура шаблона с общими названиями, которая легко адаптируется под любой компонент:

## `components/component-a/template/index.mjs`

```javascript
/**
 * Основной шаблон компонента
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export default function defaultTemplate({state = {}} = {}) {
    return `
    <div class="component-wrapper">
        <!-- Заголовочная часть -->
        <header class="component-header" id="header-section">
            ${renderHeader({state})}
        </header>
        
        <!-- Основное содержимое -->
        <main class="component-main" id="main-section">
            ${renderMain({state})}
        </main>
        
        <!-- Боковая панель (опционально) -->
        ${state.showSidebar ? `
        <aside class="component-sidebar" id="sidebar-section">
            ${renderSidebar({state})}
        </aside>
        ` : ''}
        
        <!-- Списки или таблицы -->
        <section class="component-list" id="list-section">
            ${renderList({state})}
        </section>
        
        <!-- Формы -->
        <section class="component-form" id="form-section">
            ${renderForm({state})}
        </section>
        
        <!-- Статус или уведомления -->
        <div class="component-status" id="status-section">
            ${renderStatus({state})}
        </div>
        
        <!-- Управляющие элементы -->
        <footer class="component-controls" id="controls-section">
            ${renderControls({state})}
        </footer>
        
        <!-- Модальные окна (скрыты по умолчанию) -->
        <div class="component-modals" id="modals-section" style="display: none;">
            ${renderModals({state})}
        </div>
    </div>
    `;
}

/**
 * Шаблон для заголовочной части
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderHeader({state = {}} = {}) {
    return `
    <div class="header-content">
        <h1 class="component-title">${state.title || 'Название компонента'}</h1>
        ${state.subtitle ? `<p class="component-subtitle">${state.subtitle}</p>` : ''}
        ${state.breadcrumbs ? `
        <nav class="breadcrumbs">
            ${state.breadcrumbs.map(item => `
                <span class="breadcrumb-item">${item}</span>
            `).join(' › ')}
        </nav>
        ` : ''}
    </div>
    `;
}

/**
 * Шаблон для основного содержимого
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderMain({state = {}} = {}) {
    return `
    <div class="main-content">
        ${state.mainText ? `<div class="content-text">${state.mainText}</div>` : ''}
        ${state.features && state.features.length ? `
        <div class="features-list">
            <h3>Особенности:</h3>
            <ul>
                ${state.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${state.image ? `<img src="${state.image}" alt="Изображение" class="content-image">` : ''}
    </div>
    `;
}

/**
 * Шаблон для боковой панели
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderSidebar({state = {}} = {}) {
    return `
    <div class="sidebar-content">
        ${state.sidebarTitle ? `<h3>${state.sidebarTitle}</h3>` : ''}
        ${state.sidebarItems && state.sidebarItems.length ? `
        <nav class="sidebar-nav">
            ${state.sidebarItems.map(item => `
                <a href="${item.url || '#'}" class="sidebar-link ${item.active ? 'active' : ''}">
                    ${item.icon || ''} ${item.text}
                </a>
            `).join('')}
        </nav>
        ` : ''}
        ${state.sidebarStats ? `
        <div class="sidebar-stats">
            ${Object.entries(state.sidebarStats).map(([key, value]) => `
                <div class="stat-item">
                    <span class="stat-label">${key}:</span>
                    <span class="stat-value">${value}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
    `;
}

/**
 * Шаблон для списков и таблиц
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderList({state = {}} = {}) {
    if (!state.items || !state.items.length) {
        return `
        <div class="empty-state">
            <p>${state.emptyMessage || 'Данные отсутствуют'}</p>
            ${state.showAddButton ? `<button class="add-button" id="add-first-item">Добавить первый элемент</button>` : ''}
        </div>
        `;
    }

    return `
    <div class="list-container">
        ${state.listTitle ? `<h3 class="list-title">${state.listTitle}</h3>` : ''}
        <div class="items-grid">
            ${state.items.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="item-header">
                    <span class="item-title">${item.name || 'Без названия'}</span>
                    ${item.badge ? `<span class="item-badge ${item.badge.type || 'default'}">${item.badge.text}</span>` : ''}
                </div>
                <div class="item-content">
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    ${item.value !== undefined ? `<span class="item-value">${item.value}</span>` : ''}
                </div>
                <div class="item-actions">
                    ${item.actions ? item.actions.map(action => `
                        <button class="action-btn ${action.type || 'secondary'}" data-action="${action.name}">
                            ${action.icon || ''} ${action.text}
                        </button>
                    `).join('') : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    `;
}

/**
 * Шаблон для отдельных элементов списка
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderListItem({state = {}} = {}) {
    if (!state.item) return '';
    
    return `
    <div class="list-item" data-id="${state.item.id}">
        <div class="item-header">
            <span class="item-title">${state.item.name || 'Новый элемент'}</span>
            ${state.item.badge ? `<span class="item-badge ${state.item.badge.type || 'default'}">${state.item.badge.text}</span>` : ''}
        </div>
        <div class="item-content">
            ${state.item.description ? `<p class="item-description">${state.item.description}</p>` : ''}
            ${state.item.value !== undefined ? `<span class="item-value">${state.item.value}</span>` : ''}
        </div>
    </div>
    `;
}

/**
 * Шаблон для форм
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderForm({state = {}} = {}) {
    return `
    <form class="component-form" id="main-form">
        ${state.formTitle ? `<h3 class="form-title">${state.formTitle}</h3>` : ''}
        
        <div class="form-fields">
            ${state.fields ? state.fields.map(field => `
            <div class="form-group">
                <label for="${field.name}" class="form-label">${field.label}</label>
                <input 
                    type="${field.type || 'text'}" 
                    id="${field.name}" 
                    name="${field.name}"
                    class="form-input"
                    value="${field.value || ''}"
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                >
                ${field.helpText ? `<small class="form-help">${field.helpText}</small>` : ''}
            </div>
            `).join('') : ''}
        </div>
        
        <div class="form-actions">
            <button type="submit" class="btn-primary">${state.submitText || 'Сохранить'}</button>
            <button type="button" class="btn-secondary" id="cancel-form">${state.cancelText || 'Отмена'}</button>
        </div>
    </form>
    `;
}

/**
 * Шаблон для статуса и уведомлений
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderStatus({state = {}} = {}) {
    if (!state.status) return '';
    
    return `
    <div class="status-message ${state.status.type || 'info'}">
        <span class="status-icon">${getStatusIcon(state.status.type)}</span>
        <span class="status-text">${state.status.message}</span>
        ${state.status.dismissible ? '<button class="status-close" id="close-status">&times;</button>' : ''}
    </div>
    `;
}

/**
 * Шаблон для управляющих элементов
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderControls({state = {}} = {}) {
    return `
    <div class="controls-container">
        ${state.primaryAction ? `
        <button class="btn-primary" id="primary-action">
            ${state.primaryAction.icon || ''} ${state.primaryAction.text}
        </button>
        ` : ''}
        
        ${state.secondaryActions && state.secondaryActions.length ? `
        <div class="secondary-actions">
            ${state.secondaryActions.map(action => `
            <button class="btn-secondary" id="${action.id}">
                ${action.icon || ''} ${action.text}
            </button>
            `).join('')}
        </div>
        ` : ''}
        
        ${state.tertiaryActions && state.tertiaryActions.length ? `
        <div class="tertiary-actions">
            ${state.tertiaryActions.map(action => `
            <button class="btn-tertiary" id="${action.id}">
                ${action.icon || ''} ${action.text}
            </button>
            `).join('')}
        </div>
        ` : ''}
    </div>
    `;
}

/**
 * Шаблон для модальных окон
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export function renderModals({state = {}} = {}) {
    return `
    ${state.modals ? state.modals.map(modal => `
    <div class="modal" id="${modal.id}">
        <div class="modal-content">
            <div class="modal-header">
                <h3>${modal.title}</h3>
                <button class="modal-close" data-modal="${modal.id}">&times;</button>
            </div>
            <div class="modal-body">
                ${modal.content || ''}
            </div>
            <div class="modal-footer">
                ${modal.buttons ? modal.buttons.map(btn => `
                <button class="btn-${btn.type || 'secondary'}" data-action="${btn.action}">
                    ${btn.text}
                </button>
                `).join('') : ''}
            </div>
        </div>
    </div>
    `).join('') : ''}
    `;
}

/**
 * Вспомогательная функция для иконок статусов
 * @param {string} type - Тип статуса
 * @returns {string} Символ иконки
 */
function getStatusIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️',
        'loading': '⏳'
    };
    return icons[type] || 'ℹ️';
}
```

## Соответствующие методы в компоненте:

```javascript
// В components/component-a/index.mjs добавляем:

/**
 * Обновляет заголовок компонента
 */
async updateHeader(state = {}) {
    return await this.renderPart({
        partName: 'renderHeader',
        state: state,
        selector: '#header-section'
    });
}

/**
 * Обновляет основное содержимое
 */
async updateMain(state = {}) {
    return await this.renderPart({
        partName: 'renderMain',
        state: state,
        selector: '#main-section'
    });
}

/**
 * Обновляет боковую панель
 */
async updateSidebar(state = {}) {
    return await this.renderPart({
        partName: 'renderSidebar',
        state: state,
        selector: '#sidebar-section'
    });
}

/**
 * Обновляет список элементов
 */
async updateList(state = {}) {
    return await this.renderPart({
        partName: 'renderList',
        state: state,
        selector: '#list-section'
    });
}

/**
 * Добавляет новый элемент в список
 */
async appendListItem(state = {}) {
    return await this.renderPart({
        partName: 'renderListItem',
        state: state,
        selector: '#list-section .items-grid',
        method: 'append'
    });
}

/**
 * Обновляет форму
 */
async updateForm(state = {}) {
    return await this.renderPart({
        partName: 'renderForm',
        state: state,
        selector: '#form-section'
    });
}

/**
 * Обновляет статус
 */
async updateStatus(state = {}) {
    return await this.renderPart({
        partName: 'renderStatus',
        state: state,
        selector: '#status-section'
    });
}

/**
 * Обновляет управляющие элементы
 */
async updateControls(state = {}) {
    return await this.renderPart({
        partName: 'renderControls',
        state: state,
        selector: '#controls-section'
    });
}

/**
 * Показывает модальное окно
 */
async showModal(modalId, state = {}) {
    // Сначала обновляем модалки
    await this.renderPart({
        partName: 'renderModals',
        state: state,
        selector: '#modals-section'
    });
    
    // Показываем конкретное модальное окно
    const modal = this.shadowRoot.querySelector(`#${modalId}`);
    if (modal) {
        modal.style.display = 'block';
    }
}
```

## Пример использования:

```javascript
// Обновление только заголовка
await componentA.updateHeader({
    title: 'Новое название',
    subtitle: 'Обновленный подзаголовок',
    breadcrumbs: ['Главная', 'Раздел', 'Страница']
});

// Добавление элемента в список
await componentA.appendListItem({
    item: {
        id: 1,
        name: 'Новый элемент',
        description: 'Описание нового элемента',
        value: '100',
        badge: { type: 'success', text: 'Новый' }
    }
});

// Обновление статуса
await componentA.updateStatus({
    status: {
        type: 'success',
        message: 'Данные успешно сохранены',
        dismissible: true
    }
});
```

Эта структура универсальна и легко адаптируется под любой компонент - просто замените содержимое функций рендеринга на специфичное для вашего компонента, сохраняя те же названия методов и структуру состояний.