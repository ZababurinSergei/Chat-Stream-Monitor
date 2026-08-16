/**
 * Основной шаблон компонента GroupManager
 */
export default function defaultTemplate({ state = {} } = {}) {
    const { groups = [], discoveredGroups = [], joinedGroups = [], searchQuery = '', nodeReady = false } = state;

    return `
        <div class="group-manager">
            ${renderHeader({ groups, discoveredGroups, joinedGroups, nodeReady })}
            ${renderSearch({ searchQuery })}
            ${renderNodeStatus({ state })}
            ${renderMainContent({ groups, discoveredGroups, joinedGroups, searchQuery, nodeReady })}
        </div>
    `;
}

/**
 * Обновленный заголовок с информацией о статусе
 */
export function renderHeader({ groups = [], discoveredGroups = [], joinedGroups = [], nodeReady = false } = {}) {
    return `
        <header class="manager-header">
            <div class="header-content">
                <h1 class="manager-title">Управление группами</h1>
                <div class="header-stats">
                    <div class="stat-item">
                        <span class="stat-label">Мои</span>
                        <span class="stat-value">${groups.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Присоедин.</span>
                        <span class="stat-value">${joinedGroups.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Найдено</span>
                        <span class="stat-value">${discoveredGroups.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Сеть</span>
                        <span class="stat-value ${nodeReady ? 'connected' : 'disconnected'}">
                            ${nodeReady ? '🟢' : '🟠'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    `;
}

/**
 * Шаблон поиска
 */
export function renderSearch({ searchQuery = '' } = {}) {
    return `
        <section class="search-section">
            <div class="search-container">
                <input 
                    type="text" 
                    id="group-search-input" 
                    class="search-input" 
                    placeholder="Поиск групп..."
                    value="${escapeHtml(searchQuery)}"
                >
                <button class="search-btn" id="search-groups">
                    <span>🔍</span>
                    Поиск
                </button>
            </div>
        </section>
    `;
}

/**
 * Шаблон для статуса ноды
 */
export function renderNodeStatus({state = {}} = {}) {
    return `
    <section class="node-status-section">
        <div class="status-item ${state.nodeReady ? 'connected' : 'disconnected'}">
            <div class="status-icon ${state.nodeReady ? 'connected' : 'disconnected'}">
                ${state.nodeReady ? '🟢' : '🟠'}
            </div>
            <div class="status-info">
                <span class="status-label">P2P Сеть</span>
                <span class="status-value">${state.nodeReady ? 'Готова' : 'Подключается...'}</span>
            </div>
        </div>
    </section>
    `;
}

/**
 * Основное содержимое
 */
export function renderMainContent({ groups = [], discoveredGroups = [], joinedGroups = [], searchQuery = '', nodeReady = false } = {}) {
    return `
        <main class="manager-main">
            <div class="content-grid">
                ${renderMyGroups({ groups, nodeReady })}
                ${renderDiscoveredGroups({ discoveredGroups, nodeReady, state: { discoveredGroups, nodeReady } })}
                ${renderJoinedGroups({ joinedGroups, nodeReady })}
                ${renderQuickActions({ state: { nodeReady } })}
                ${searchQuery ? renderSearchResults({ groups, discoveredGroups, joinedGroups, searchQuery, nodeReady }) : ''}
            </div>
        </main>
    `;
}

/**
 * Мои группы
 */
export function renderMyGroups({ groups = [], nodeReady = false } = {}) {
    return `
        <section class="section-card" id="my-groups-list">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🏠</span>
                    Мои группы
                </h3>
                <span class="card-badge">${groups.length}</span>
            </div>
            <div class="card-content">
                <div>
                    ${groups.length > 0 ? renderGroupsList(groups, 'my', nodeReady) : renderEmptyState('my', nodeReady)}
                </div>
            </div>
        </section>
    `;
}

/**
 * Обнаруженные группы
 */
export function renderDiscoveredGroups({ discoveredGroups = [], nodeReady = false, state = {}} = {}) {
    discoveredGroups = state.discoveredGroups || [];
    nodeReady = state.nodeReady;

    return `
        <section class="section-card" id="discovered-groups-list">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🌐</span>
                    Обнаруженные
                </h3>
                <span class="card-badge">${discoveredGroups.length}</span>
            </div>
            <div class="card-content">
                ${discoveredGroups.length > 0 ? renderGroupsList(discoveredGroups, 'discovered', nodeReady) : renderEmptyState('discovered', nodeReady)}
            </div>
        </section>
    `;
}

/**
 * Присоединенные группы
 */
export function renderJoinedGroups({ joinedGroups = [], nodeReady = false } = {}) {
    return `
        <section class="section-card">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">👥</span>
                    Присоединенные
                </h3>
                <span class="card-badge">${joinedGroups.length}</span>
            </div>
            <div class="card-content">
                <div id="joined-groups-list">
                    ${joinedGroups.length > 0 ? renderGroupsList(joinedGroups, 'joined', nodeReady) : renderEmptyState('joined', nodeReady)}
                </div>
            </div>
        </section>
    `;
}

/**
 * Результаты поиска
 */
export function renderSearchResults({ groups = [], discoveredGroups = [], joinedGroups = [], searchQuery = '', nodeReady = false } = {}) {
    const allGroups = [...groups, ...discoveredGroups, ...joinedGroups];
    const filteredGroups = allGroups.filter(group =>
        (typeof group.name === 'string' && group.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof group.topic === 'string' && group.topic.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return `
        <section class="section-card">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🔍</span>
                    Результаты поиска
                </h3>
                <span class="card-badge">${filteredGroups.length}</span>
            </div>
            <div class="card-content">
                <div id="search-results">
                    ${filteredGroups.length > 0 ? renderGroupsList(filteredGroups, 'search', nodeReady) : renderEmptyState('search', nodeReady, searchQuery)}
                </div>
            </div>
        </section>
    `;
}

/**
 * Шаблон для быстрых действий
 */
export function renderQuickActions({state = {}} = {}) {
    return `
    <section class="section-card quick-actions">
        <div class="card-header">
            <h3 class="card-title">
                <span class="card-icon">🚀</span>
                Быстрые действия
            </h3>
        </div>
        <div class="card-content">
                <button class="action-btn primary" id="create-group" ${!state.nodeReady ? 'disabled' : ''}>
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">${state.nodeReady ? 'Создать группу' : 'Ожидание сети...'}</span>
                </button>
                
                <button class="action-btn secondary" id="discover-groups" ${!state.nodeReady ? 'disabled' : ''}>
                    <span class="btn-icon">🔍</span>
                    <span class="btn-text">Обнаружить</span>
                </button>
                
                <button class="action-btn secondary" id="check-status">
                    <span class="btn-icon">🔄</span>
                    <span class="btn-text">Проверить статус</span>
                </button>
        </div>
    </section>
    `;
}

/**
 * Список групп
 */
function renderGroupsList(groups, type, nodeReady = false) {
    return `
        <div class="groups-list">
            ${groups.map(group => renderGroupItem(group, type, nodeReady)).join('')}
        </div>
    `;
}

/**
 * Элемент группы — с защитой от group.name как объекта
 */
function renderGroupItem(group, type, nodeReady = false) {
    const name = typeof group.name === 'string' ? group.name : 'Безымянная';
    const { id, topic, memberCount = 1 } = group;

    return `
        <div class="group-item" data-group-id="${id}" data-group-topic="${topic}">
            <div class="group-avatar">
                ${getFirstChar(name)}
            </div>
            <div class="group-info">
                <div class="group-name">${escapeHtml(name)}</div>
                <div class="group-meta">
                    <span class="meta-item">👥 ${memberCount}</span>
                    <span class="meta-item">${getGroupTypeLabel(type)}</span>
                </div>
            </div>
            <div class="group-actions">
                ${renderGroupActions(type, id, topic, nodeReady)}
            </div>
        </div>
    `;
}

/**
 * Действия для группы
 */
function renderGroupActions(type, groupId, topic, nodeReady = false) {
    switch (type) {
        case 'my':
            return `
                <button class="action-btn join" data-group-id="${groupId}" ${!nodeReady ? 'disabled' : ''} title="Перейти в чат">
                    💬
                </button>
                <button class="action-btn leave" data-group-id="${groupId}" ${!nodeReady ? 'disabled' : ''} title="Удалить">
                    🗑️
                </button>
            `;
        case 'discovered':
            return `
                <button class="action-btn join" data-group-id="${groupId}" data-topic="${topic}" ${!nodeReady ? 'disabled' : ''} title="Присоединиться">
                    ➕
                </button>
            `;
        case 'joined':
            return `
                <button class="action-btn join" data-group-id="${groupId}" ${!nodeReady ? 'disabled' : ''} title="Войти в чат">
                    💬
                </button>
                <button class="action-btn leave" data-group-id="${groupId}" ${!nodeReady ? 'disabled' : ''} title="Покинуть">
                    🚪
                </button>
            `;
        case 'search':
            return `
                <button class="action-btn join" data-group-id="${groupId}" data-topic="${topic}" ${!nodeReady ? 'disabled' : ''} title="Присоединиться">
                    ➕
                </button>
            `;
        default:
            return '';
    }
}

/**
 * Пустое состояние
 */
function renderEmptyState(type, nodeReady = false, searchQuery = '') {
    const states = {
        my: {
            icon: '🏠',
            title: 'Нет созданных групп',
            description: nodeReady ? 'Создайте первую группу для общения' : 'Ожидание готовности сети...',
            action: nodeReady ? 'Создать группу' : 'Сеть не готова',
            disabled: !nodeReady
        },
        discovered: {
            icon: '🌐',
            title: 'Группы не найдены',
            description: nodeReady ? 'Обнаружьте доступные группы в сети' : 'Ожидание готовности сети...',
            action: nodeReady ? 'Обнаружить' : 'Сеть не готова',
            disabled: !nodeReady
        },
        joined: {
            icon: '🤝',
            title: 'Нет присоединенных групп',
            description: nodeReady ? 'Присоединяйтесь к группам для общения' : 'Ожидание готовности сети...',
            action: nodeReady ? 'Найти группы' : 'Сеть не готова',
            disabled: !nodeReady
        },
        search: {
            icon: '🔍',
            title: `По запросу "${searchQuery}" ничего не найдено`,
            description: 'Попробуйте изменить поисковый запрос',
            action: 'Очистить поиск',
            disabled: false
        }
    };

    const state = states[type] || states.my;

    return `
        <div class="empty-state">
            <div class="empty-icon">${state.icon}</div>
            <p class="empty-text">${state.title}</p>
            <p class="empty-description">${state.description}</p>
            <button class="empty-action" id="${type}-action" ${state.disabled ? 'disabled' : ''}>
                ${state.action}
            </button>
        </div>
    `;
}

/**
 * Вспомогательные функции
 */
function getGroupTypeLabel(type) {
    const labels = {
        my: 'Моя',
        discovered: 'Публичная',
        joined: 'Присоедин.',
        search: 'Найдена'
    };
    return labels[type] || 'Группа';
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Безопасное получение первого символа для аватара
 */
function getFirstChar(str) {
    if (typeof str !== 'string' || !str) return 'G';
    return str.charAt(0).toUpperCase();
}