import {generatePeerName, parseChatGroupStringRegex} from '../../utils/index.mjs'

/**
 * Основной шаблон компонента ChatManager
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export default function defaultTemplate({state = {}} = {}) {
    return `\
    <div class=\"chat-manager\">\
        <!-- Заголовок и управление -->\
        <header class=\"manager-header\">\
            <div class=\"header-content\">\
                <div class=\"header-main\">\
                    <h1 class=\"manager-title\">\
                        <span class=\"title-icon\">🌐</span>\
                        Чат Менеджер\
                    </h1>\
                    <div class=\"connection-status ${state.connected ? 'connected' : 'disconnected'}\">\
                        <span class=\"status-dot\"></span>\
                        <span class=\"status-text\">${state.connected ? 'Подключено' : 'Не подключено'}</span>\
                    </div>\
                </div>\
                <div class=\"header-stats\">\
                    <div class=\"stat-item\">\
                        <span class=\"stat-label\">Группы</span>\
                        <span class=\"stat-value\">${state.groups ? state.groups.length : 0}</span>\
                    </div>\
                    <div class=\"stat-item\">\
                        <span class=\"stat-label\">Сообщения</span>\
                        <span class=\"stat-value\">${state.messages ? state.messages.length : 0}</span>\
                    </div>\
                    <div class=\"stat-item\">\
                        <span class=\"stat-label\">Пиры</span>\
                        <span class=\"stat-value\">${state.connectedPeers ? state.connectedPeers.length : 0}</span>\
                    </div>\
                </div>\
            </div>\
            <div class=\"header-controls\">\
                <div class=\"mode-controls\">\
                    <span class=\"control-label\">Режим:</span>\
                    <div class=\"mode-buttons\">\
                        <button class=\"mode-btn ${state.mode === 'listener' ? 'active' : ''}\" id=\"listener-mode\">\
                            <span class=\"btn-icon\">📡</span>\
                            Слушатель\
                        </button>\
                        <button class=\"mode-btn ${state.mode === 'dialer' ? 'active' : ''}\" id=\"dialer-mode\">\
                            <span class=\"btn-icon\">🔗</span>\
                            Инициатор\
                        </button>\
                    </div>\
                </div>\
            </div>\
        </header>\

        <!-- Основное содержимое -->\
        <main class=\"manager-main\">\
            <!-- Боковая панель групп -->\
            <aside class=\"groups-sidebar\">\
                <div class=\"sidebar-section\">\
                    <div class=\"section-header\">\
                        <h3 class=\"section-title\">\
                            <span class=\"section-icon\">🏠</span>\
                            Мои группы\
                        </h3>\
                        <button class=\"section-action\" id=\"create-group-btn\" title=\"Создать группу\">\
                            <span class=\"btn-icon\">➕</span>\
                        </button>\
                    </div>\
                    <div class=\"section-content\" id=\"my-groups-container\">\
                        ${renderMyGroups({state})}\
                    </div>\
                </div>\

                <div class=\"sidebar-section\">\
                    <div class=\"section-header\">\
                        <h3 class=\"section-title\">\
                            <span class=\"section-icon\">🌐</span>\
                            Обнаруженные группы\
                        </h3>\
                        <button class=\"section-action\" id=\"discover-groups-btn\" title=\"Обнаружить группы\">\
                            <span class=\"btn-icon\">🔍</span>\
                        </button>\
                    </div>\
                    <div class=\"section-content\" id=\"discovered-groups-container\">\
                        ${renderDiscoveredGroups({state})}\
                    </div>\
                </div>\

                <div class=\"sidebar-section\">\
                   <div class="section-header">
                        <h3 class="section-title">
                            <span class="section-icon">👥</span>
                            Участники группы
                        </h3>
                        <button class="section-action" id="refresh-group-members" title="Обновить участников">
                           <span class="btn-icon">🔄</span>
                        </button>
                    </div>
                    <div class=\"section-content\" id=\"group-members-list\">\
                        ${renderGroupMembers({state})}\
                    </div>\
                </div>\
            </aside>\

            <!-- Основная область чата -->\
            <section class=\"chat-area\">\
                <!-- Заголовок активного чата -->\
                <div class=\"chat-header\">\
                    ${renderActiveChatHeader({state})}\
                </div>\

                <!-- Контейнер сообщений -->\
                <div class=\"messages-area\">\
                    <div class=\"messages-container\" id=\"messages-container\">\
                        ${renderMessages({state})}\
                    </div>\
                </div>\

                <!-- Панель ввода сообщения -->\
                <footer class=\"message-input-area\">\
                    <div class=\"input-container\">\
                        <div class=\"input-wrapper\">\
                            <textarea \
                                id=\"message-input\" \
                                class=\"message-input\" \
                                placeholder=\"${getInputPlaceholder(state)}\"\
                                rows=\"1\"\
                                ${!state.connected || !state.currentGroup ? 'disabled' : ''}\
                            ></textarea>\
                            <button \
                                id=\"send-button\" \
                                class=\"send-button\"\
                                ${!state.connected || !state.currentGroup ? 'disabled' : ''}\
                                title=\"Отправить сообщение\"\
                            >\
                                <span class=\"send-icon\">✈️</span>\
                            </button>\
                        </div>\
                    </div>\
                </footer>\
            </section>\

            <!-- Панель информации о подключении -->\
            <aside class=\"info-sidebar\">\
                <div class=\"sidebar-section\">\
                    <div class=\"section-header\">\
                        <h3 class=\"section-title\">\
                            <span class=\"section-icon\">🔗</span>\
                            Подключения\
                        </h3>\
                    </div>\
                    <div class=\"section-content\">\
                        ${renderConnectionInfo({state})}\
                    </div>\
                </div>\

                <div class=\"sidebar-section\">\
                    <div class=\"section-header\">\
                        <h3 class=\"section-title\">\
                            <span class=\"section-icon\">📊</span>\
                            Статистика\
                        </h3>\
                    </div>\
                    <div class=\"section-content\">\
                        ${renderStatistics({state})}\
                    </div>\
                </div>\

                <div class=\"sidebar-section\">\
                    <div class=\"section-header\">\
                        <h3 class=\"section-title\">\
                            <span class=\"section-icon\">⚡</span>\
                            Быстрые действия\
                        </h3>\
                    </div>\
                    <div class=\"section-content\">\
                        ${renderQuickActions({state})}\
                    </div>\
                </div>\
            </aside>\
        </main>\

        <!-- Футер с дополнительной информацией -->\
        <footer class=\"manager-footer\">\
            <div class=\"footer-content\">\
                <div class=\"footer-info\">\
                    <span class=\"info-text\">Peer ID: ${state.peerId ? state.peerId : 'Не доступен'}</span>\
                    <span class=\"info-divider\">•</span>\
                    <span class=\"info-text\">Режим: ${state.mode === 'listener' ? 'Слушатель' : 'Инициатор'}</span>\
                    <span class=\"info-divider\">•</span>\
                    <span class=\"info-text\">Relay: ${state.relayEnabled ? 'Включен' : 'Выключен'}</span>\
                </div>\
                <div class=\"container-button\">\
                    <div class=\"footer-actions\">\
                        <button class=\"footer-btn\" id=\"refresh-all\">\
                            <span class=\"btn-icon\">🔄</span>\
                            Обновить\
                        </button>\
                    </div>\
                    <div class=\"input-actions\">\
                        <button class=\"action-btn\" id=\"clear-messages\" title=\"Очистить сообщения\">\
                            <span class=\"btn-icon\">🗑️</span>\
                        </button>\
                        <button class=\"action-btn\" id=\"export-chat\" title=\"Экспорт чата\">\
                            <span class=\"btn-icon\">📤</span>\
                        </button>\
                    </div>\
                </div>\
            </div>\
        </footer>\
    </div>\
    `;
}


/**
 * Вспомогательная функция: извлекает строковое имя группы
 */
function getGroupName(group) {
    if (!group) return 'Безымянная';
    if (typeof group.name === 'string') return group.name;
    if (typeof group.name === 'object' && group.name?.name) return group.name.name;
    if (typeof group.name === 'object' && group.name?.topic) return parseChatGroupStringRegex(group.name.topic);
    if (group.topic) return parseChatGroupStringRegex(group.topic);
    return 'Безымянная';
}

/**
 * Вспомогательная функция: извлекает первую букву для аватара
 */
function getGroupInitial(group) {
    const name = getGroupName(group);
    return name.charAt(0).toUpperCase();
}

/**
 * Шаблон для моих групп
 */
export function renderMyGroups({state = {}} = {}) {
    const groups = state.groups || [];

    if (groups.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">🏠</div>\
            <p class=\"empty-text\">Нет созданных групп</p>\
            <button class=\"empty-action\" id=\"create-first-group\">\
                Создать группу\
            </button>\
        </div>\
        `;
    }

    return `\
    <div class=\"groups-list\" id=\"my-groups-list\">\
        ${groups.map((group, index) => {
            return `\
                <div class=\"group-item ${state.currentGroup?.id === group.id ? 'active' : ''}\" data-group-id=\"${group.id}\" data-group-topic=\"${group.topic}\">\
                    <div class=\"group-avatar\">\
                        ${getGroupInitial(group)}\
                    </div>\
                    <div class=\"group-info\">\
                        <div class=\"group-name\">${group.name}</div>\
                        <div class=\"group-meta\">\
                            <span class=\"meta-item\">👥 ${group.memberCount || 1}</span>\
                            <span class=\"meta-item\">${formatDate(group.createdAt)}</span>\
                        </div>\
                    </div>\
                    <div class=\"group-actions\">\
                        <button class=\"group-action-btn join\" data-group-id=\"${group.id}\" title=\"Присоединиться\">\
                            <span class=\"btn-icon\">➡️</span>\
                        </button>\
                    </div>\
                </div>\
                `
        
        
        }).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для обнаруженных групп
 */
export function renderDiscoveredGroups({state = {}} = {}) {
    const groups = state.discoveredGroups || [];

    if (groups.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">🌐</div>\
            <p class=\"empty-text\">Группы не найдены</p>\
            <button class=\"empty-action\" id=\"discover-groups\">\
                Обнаружить\
            </button>\
        </div>\
        `;
    }

    return `\
    <div class=\"groups-list\" id=\"discovered-groups-list\">\
        ${groups.map(group => `\
        <div class=\"group-item discovered\" data-group-id=\"${group.id}\" data-topic=\"${group.topic}\">\
            <div class=\"group-avatar\">\
                ${getGroupInitial(group)}\
            </div>\
            <div class=\"group-info\">\
                <div class=\"group-name\">${group.name}</div>\
                <div class=\"group-description\">${group.description || 'Описание отсутствует'}</div>\
                <div class=\"group-meta\">\
                    <span class=\"meta-item\">👥 ${group.memberCount || 0}</span>\
                    <span class=\"meta-item\">${group.isPublic ? 'Публичная' : 'Приватная'}</span>\
                </div>\
            </div>\
            <div class=\"group-actions\">\
                <button class=\"group-action-btn join\" data-group-id=\"${group.id}\" data-topic=\"${group.topic}\" title=\"Присоединиться\">\
                    <span class=\"btn-icon\">➕</span>\
                </button>\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для присоединенных групп
 */
export function renderJoinedGroups({state = {}} = {}) {
    const groups = state.joinedGroups || [];

    if (groups.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">👥</div>\
            <p class=\"empty-text\">Не присоединены к группам</p>\
        </div>\
        `;
    }

    return `\
    <div class=\"groups-list\" id=\"joined-groups-list\">\
        ${groups.map(group => `\
        <div class=\"group-item joined ${state.currentGroup?.id === group.id ? 'active' : ''}\" data-group-id=\"${group.id}\">\
            <div class=\"group-avatar\">\
                ${getGroupInitial(group)}\
            </div>\
            <div class=\"group-info\">\
                <div class=\"group-name\">${group.name}</div>\
                <div class=\"group-meta\">\
                    <span class=\"meta-item\">👥 ${group.memberCount || 1}</span>\
                    <span class=\"meta-item\">${formatDate(group.joinedAt)}</span>\
                </div>\
            </div>\
            <div class=\"group-actions\">\
                <button class=\"group-action-btn leave\" data-group-id=\"${group.id}\" title=\"Покинуть\">\
                    <span class=\"btn-icon\">🚪</span>\
                </button>\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для заголовка активного чата (группа или приватный пир)
 */
export function renderActiveChatHeader({state = {}} = {}) {
    // Приватный чат
    if (state.isPrivateChat && state.activeMember) {
        const displayName = typeof state.activeMember.name === 'string'
            ? state.activeMember.name
            : (state.activeMember.id ? state.activeMember.id.substring(0, 12) + '...' : 'Неизвестный');

        return `
        <div class=\"chat-info\">
            <div class=\"chat-avatar\">
                👤
            </div>
            <div class=\"chat-details\">
                <h2 class=\"chat-name\">${escapeHtml(displayName)}</h2>
                <div class=\"chat-meta\">
                    <span class=\"meta-item\">🔒 Приватный чат</span>
                    <span class=\"meta-item topic\">ID: ${state.activeMember.id.substring(0, 12)}...</span>
                </div>
            </div>
            <div class=\"chat-actions\">
                <button class=\"chat-action-btn\" id=\"copy-peer-id\" title=\"Копировать ID пира\">
                    <span class=\"btn-icon\">📋</span>
                </button>
            </div>
        </div>
        `;
    }

    // Групповой чат
    if (!state.currentGroup) {
        return `
        <div class=\"chat-info\">
            <div class=\"chat-avatar\">
                <span class=\"avatar-icon\">💬</span>
            </div>
            <div class=\"chat-details\">
                <h2 class=\"chat-name\">Чат</h2>
                <p class=\"chat-description\">Выберите группу для начала общения</p>
            </div>
        </div>
        `;
    }

    // Группа
    return `
    <div class=\"chat-info\">
        <div class=\"chat-avatar\">
            ${getGroupInitial(state.currentGroup)}
        </div>
        <div class=\"chat-details\">
            <h2 class=\"chat-name\">${escapeHtml(getGroupName(state.currentGroup))}</h2>
            <div class=\"chat-meta\">
                <span class=\"meta-item\">👥 ${state.currentGroup.memberCount || 1} участников</span>
                <span class=\"meta-item\">🔗 ${state.connected ? 'Подключено' : 'Не подключено'}</span>
                <span class=\"meta-item topic\">Топик: ${state.currentGroup.topic}</span>
            </div>
        </div>
        <div class=\"chat-actions\">
            <button class=\"chat-action-btn\" id=\"copy-topic\" title=\"Копировать топик\">
                <span class=\"btn-icon\">📋</span>
            </button>
            <button class=\"chat-action-btn\" id=\"leave-chat\" title=\"Покинуть чат\">
                <span class=\"btn-icon\">🚪</span>
            </button>
        </div>
    </div>
    `;
}

export function renderGroupMembers({ state = {} } = {}) {
    const members = state.currentGroupMembers || [];

    if (members.length === 0) {
        return `\
        <div class="empty-state">\
            <div class="empty-icon">👥</div>\
            <p class="empty-text">Нет участников</p>\
        </div>\
        `;
    }



    return `\
    <div class="members-list">\
        ${members.map(member => {
            console.log('@@@@@@@@@@@@@', member)
            return `\
                <div class="member-item" data-peer-id="${member.id}">\
                    <div class="member-avatar">${member.name.charAt(0)}</div>\
                    <div class="member-info">\
                        <div class="member-name">${member.name}</div>\
                        <div class="member-status online">В сети</div>\
                    </div>\
                </div>\
                `
        }).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для сообщений
 */
export function renderMessages({state = {}} = {}) {
    const messages = state.messages || [];

    if (messages.length === 0) {
        return `\
        <div class=\"empty-chat\">\
            <div class=\"empty-content\">\
                <div class=\"empty-icon\">💬</div>\
                <h3 class=\"empty-title\">Нет сообщений</h3>\
                <p class=\"empty-description\">Начните общение, отправив первое сообщение</p>\
            </div>\
        </div>\
        `;
    }

    return `\
    <div class=\"messages-list\">\
        ${messages.map(message => `\
        <div class=\"message-item ${message.type === 'sent' ? 'sent' : 'received'}\" data-message-id=\"${message.id}\">\
            <div class=\"message-content\">\
                <div class=\"message-header\">\
                    <div class=\"message-avatar\">\
                        ${message.type === 'sent' ? '👤' : '👥'}\
                    </div>\
                    <span class=\"message-sender\">${message.type === 'sent' ? 'Вы' : (message.from ? generatePeerName(message.from) : 'Неизвестный')}</span>\
                    <span class=\"message-time\">${new Date(message.timestamp).toLocaleTimeString('ru-RU')}</span>\
                </div>\
                <div class=\"message-text\">${escapeHtml(message.text)}</div>\
                ${message.topic ? `<div class=\"message-topic\">Группа: ${message.topic}</div>` : ''}\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для информации о подключении
 */
export function renderConnectionInfo({state = {}} = {}) {
    const peers = state.connectedPeers || [];
    const addresses = state.listeningAddresses || [];

    return `\
    <div class=\"connection-info\">\
        <div class=\"info-item\">\
            <span class=\"info-label\">Статус:</span>\
            <span class=\"info-value ${state.connected ? 'connected' : 'disconnected'}\">\
                ${state.connected ? '🟢 Подключено' : '🔴 Не подключено'}\
            </span>\
        </div>\
        \
        <div class=\"info-item\">\
            <span class=\"info-label\">Пиров:</span>\
            <span class=\"info-value\">${peers.length}</span>\
        </div>\
        \
        <div class=\"info-item\">\
            <span class=\"info-label\">Адресов:</span>\
            <span class=\"info-value\">${addresses.length}</span>\
        </div>\

        ${peers.length > 0 ? `\
        <div class=\"peers-list\">\
            <div class=\"list-header\">Подключенные пиры:</div>\
            ${peers.map(peer => `\
            <div class=\"peer-item\">\
                <span class=\"peer-id\">${peer.id.substring(0, 16)}...</span>\
                <span class=\"peer-connections\">${peer.connections ? peer.connections.length : 1} соедин.</span>\
            </div>\
            `).join('')}\
        </div>\
        ` : ''}\
    </div>\
    `;
}

/**
 * Шаблон для статистики
 */
export function renderStatistics({state = {}} = {}) {
    const messagesCount = state.messages ? state.messages.length : 0;
    const groupsCount = state.groups ? state.groups.length : 0;
    const joinedCount = state.joinedGroups ? state.joinedGroups.length : 0;
    const discoveredCount = state.discoveredGroups ? state.discoveredGroups.length : 0;

    return `\
    <div class=\"stats-grid\">\
        <div class=\"stat-card\">\
            <div class=\"stat-value\">${messagesCount}</div>\
            <div class=\"stat-label\">Сообщений</div>\
        </div>\
        <div class=\"stat-card\">\
            <div class=\"stat-value\">${groupsCount}</div>\
            <div class=\"stat-label\">Мои группы</div>\
        </div>\
        <div class=\"stat-card\">\
            <div class=\"stat-value\">${joinedCount}</div>\
            <div class=\"stat-label\">Присоединено</div>\
        </div>\
        <div class=\"stat-card\">\
            <div class=\"stat-value\">${discoveredCount}</div>\
            <div class=\"stat-label\">Обнаружено</div>\
        </div>\
    </div>\
    `;
}

/**
 * Шаблон для быстрых действий
 */
export function renderQuickActions({state = {}} = {}) {
    return `\
    <div class=\"quick-actions\">\
        <button class=\"action-btn primary\" id=\"create-group\">\
            <span class=\"btn-icon\">➕</span>\
            <span class=\"btn-text\">Создать группу</span>\
        </button>\
        \
        <button class=\"action-btn secondary\" id=\"discover-groups\">\
            <span class=\"btn-icon\">🔍</span>\
            <span class=\"btn-text\">Обнаружить</span>\
        </button>\
        \
        <button class=\"action-btn secondary\" id=\"copy-peer-id\" ${!state.peerId ? 'disabled' : ''}>\
            <span class=\"btn-icon\">📋</span>\
            <span class=\"btn-text\">Peer ID</span>\
        </button>\
        \
        <button class=\"action-btn outline\" id=\"restart-node\">\
            <span class=\"btn-icon\">🔄</span>\
            <span class=\"btn-text\">Перезапуск</span>\
        </button>\
    </div>\
    `;
}

/**
 * Вспомогательные функции
 */
function getInputPlaceholder(state) {
    if (!state.connected) return 'Подключитесь к сети...';
    if (!state.currentGroup) return 'Выберите группу для общения...';
    return 'Введите сообщение...';
}

/**
 * Шаблон для списка групп (для renderPart)
 */
export function renderGroups({state = {}} = {}) {
    const groups = state.groups || [];

    if (groups.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">🏠</div>\
            <p class=\"empty-text\">Нет созданных групп</p>\
            <button class=\"empty-action\" id=\"create-first-group\">\
                Создать группу\
            </button>\
        </div>\
        `;
    }

    return `\
    <div class=\"groups-list\" id=\"my-groups-list\">\
        ${groups.map((group, index) => `\
        <div class=\"group-item ${state.currentGroup?.id === group.id ? 'active' : ''}\" data-group-id=\"${group.id}\" data-group-topic=\"${group.topic}\">\
            <div class=\"group-avatar\">\
                ${getGroupInitial(group)}\
            </div>\
            <div class=\"group-info\">\
                <div class=\"group-name\">${group.name}</div>\
                <div class=\"group-meta\">\
                    <span class=\"meta-item\">👥 ${group.memberCount || 1}</span>\
                    <span class=\"meta-item\">${formatDate(group.createdAt)}</span>\
                </div>\
            </div>\
            <div class=\"group-actions\">\
                <button class=\"group-action-btn join\" data-group-id=\"${group.id}\" title=\"Присоединиться\">\
                    <span class=\"btn-icon\">➡️</span>\
                </button>\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Неизвестно';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин.`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч.`;
    return date.toLocaleDateString('ru-RU');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}