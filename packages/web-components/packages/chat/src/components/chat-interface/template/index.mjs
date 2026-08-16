import {moveSlotToEnd, parseChatGroupStringRegex} from '../../utils/index.mjs'
/**
 * Основной шаблон компонента ChatInterface
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export default function defaultTemplate({state = {}} = {}) {
    return `
    <div class="chat-interface">
        <!-- Заголовок чата -->
        <header class="chat-header">
            <div class="header-content">
                <div class="chat-info">
                    <div class="chat-avatar">
                        ${getChatAvatar(state.currentGroup)}
                    </div>
                    <div class="chat-details">
                        <h3 class="chat-name">${getGroupName(state.currentGroup)}</h3>
                        <div class="chat-status">
                            <span class="status-indicator ${state.connected ? 'connected' : 'disconnected'}"></span>
                            <span class="status-text">${getStatusText(state)}</span>
                            ${state.currentGroup ? `<span class="member-count">👥 ${state.currentGroup.memberCount || 1}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="action-btn" id="clear-chat" title="Очистить чат">
                        <span class="btn-icon">🗑️</span>
                    </button>
                    <button class="action-btn" id="search-messages" title="Поиск сообщений">
                        <span class="btn-icon">🔍</span>
                    </button>
                    <button class="action-btn" id="toggle-members" title="Участники">
                        <span class="btn-icon">👥</span>
                    </button>
                    <button class="action-btn" id="settings" title="Настройки">
                        <span class="btn-icon">⚙️</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Статус подключения -->
        <div class="connection-status" id="connection-status">
            ${renderConnectionStatus({state})}
        </div>

        <!-- Основное содержимое -->
        <main class="chat-main">
            <!-- Боковая панель участников -->
            <aside class="members-sidebar" id="members-panel">
                <div class="sidebar-header">
                    <h4>Участники</h4>
                    <button class="close-sidebar" id="close-members">✕</button>
                </div>
                <div class="members-list">
                    ${renderMembersList({state})}
                </div>
            </aside>

            <!-- Основная область чата -->
            <section class="chat-content">
                <!-- Контейнер сообщений -->
                <div class="messages-container">
                    <div class="messages-list" id="messages-list">
                        ${renderMessages({state})}
                    </div>
                </div>

                <!-- Индикатор набора сообщения -->
                ${state.isTyping ? renderTypingIndicator({state}) : ''}
            </section>
        </main>

        <!-- Панель ввода сообщения -->
        <footer class="chat-input">
            <div class="input-container">
                <div class="input-actions">
                    <button class="input-action-btn" id="attach-file" title="Прикрепить файл">
                        <span class="btn-icon">📎</span>
                    </button>
                    <button class="input-action-btn" id="emoji-picker" title="Эмодзи">
                        <span class="btn-icon">😊</span>
                    </button>
                    <button class="input-action-btn" id="format-text" title="Форматирование">
                        <span class="btn-icon">𝐀</span>
                    </button>
                </div>
                <div class="message-input-wrapper">
                    <textarea 
                        id="message-input" 
                        class="message-input" 
                        placeholder="${getInputPlaceholder(state)}"
                        rows="1"
                    ></textarea>
                    <button 
                        id="send-button" 
                        class="send-button"
                        title="Отправить сообщение"
                    >
                        <span class="send-icon">✈️</span>
                    </button>
                </div>
            </div>
        </footer>

        <!-- Оверлей поиска -->
        ${state.showSearch ? renderSearchOverlay({state}) : ''}
    </div>
    `;
}

/**
 * Шаблон для статуса подключения
 */
export function renderConnectionStatus({state = {}} = {}) {
    if (!state.connected) {
        return `
        <div class="status-message disconnected">
            <span class="status-icon">🔴</span>
            <span class="status-text">Не подключено к P2P сети</span>
            <button class="status-action" id="reconnect">Переподключиться</button>
        </div>
        `;
    }

    if (!state.currentGroup && !state.activeMember) {
        return `
        <div class="status-message info">
            <span class="status-icon">ℹ️</span>
            <span class="status-text">Выберите или создайте группу или пользователя для начала общения</span>
        </div>
        `;
    }

    const isActiveMember = !!state.activeMember

    return isActiveMember
        ? ` 
            <div class="status-message connected">
                <span class="status-icon">🟢</span>
                <span class="status-text">
                    Подключено пиру
                    ${state.connectionMode ? `(${state.connectionMode === 'listener' ? 'слушатель' : 'инициатор'})` : ''}
                </span>
                    ${state.peerId ? `<span class="peer-id">Пользователь: ${state.activeMember.name}...</span>` : ''}
                    ${state.uptime ? `<span class="uptime">Время работы: ${state.uptime}</span>` : ''}
                </div>
        `
        :`
            <div class="status-message connected">
                <span class="status-icon">🟢</span>
                <span class="status-text">
                    Подключено ${state.totalPeers ? `к ${state.totalPeers} пирам` : 'к сети'}
                    ${state.connectionMode ? `(${state.connectionMode === 'listener' ? 'слушатель' : 'инициатор'})` : ''}
                </span>
                ${state.peerId ? `<span class="peer-id">ID: ${state.peerId.substring(0, 12)}...</span>` : ''}
                ${state.uptime ? `<span class="uptime">Время работы: ${state.uptime}</span>` : ''}
            </div>
    `;
}

/**
 * Шаблон для простого статуса (для renderPart)
 */
export function renderStatus({state = {}} = {}) {
    if (!state.connected) {
        return `
        <div class="status-message disconnected">
            <span class="status-icon">🔴</span>
            <span class="status-text">Не подключено</span>
        </div>
        `;
    }

    if (!state.currentGroup) {
        return `
        <div class="status-message info">
            <span class="status-icon">ℹ️</span>
            <span class="status-text">Выберите группу</span>
        </div>
        `;
    }

    return `
    <div class="status-message connected">
        <span class="status-icon">🟢</span>
        <span class="status-text">В сети: ${getGroupName(state.currentGroup)}</span>
    </div>
    `;
}

/**
 * Шаблон для списка участников и групп
 * @function renderMembersList
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка списка участников и групп
 */
export function renderMembersList({ state = {} } = {}) {
    const members = state.connectedPeers || [];
    const currentUser = state.peerId ? {
        id: state.peerId,
        name: 'Вы',
        online: true,
        isCurrentUser: true
    } : null;

    const allMembers = currentUser ? [currentUser, ...members] : members;

    // Группы (если есть)
    const groups = (state.activeGroups || []).map(group => ({
        id: group.topic || group.id,
        name: group.name,
        isGroup: true,
        online: true
    }));

    // Объединяем участников и группы
    const displayItems = [...allMembers, ...groups];

    if (displayItems.length === 0) {
        return `
      <div class="empty-members">
        <div class="empty-icon">👥</div>
        <p class="empty-text">Нет участников и групп</p>
      </div>
    `;
    }

    return `
    <div class="members-container">
      ${displayItems.map(item => {
        if (item.isGroup) {
            // Рендер группы — добавляем класс active, если топик активен
            const isActiveGroup = !state.isPrivateChat && state.currentGroup?.topic === item.id;
            const unreadCount = state.unreadCounts?.[item.id] || 0;
            const showUnread = unreadCount > 0;

            return `
            <div class="member-item ${isActiveGroup ? 'active' : ''}" data-group-topic="${item.id}">
              <div class="member-avatar group">${item.name.charAt(0).toUpperCase()}</div>
              <div class="member-info">
                <div class="member-name">${item.name}</div>
                <div class="member-status online">Топик</div>
              </div>
              ${showUnread ? `<div class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</div>` : ''}
            </div>
          `;
        }

        // Рендер участника — добавляем active только для пиров
        const unreadCount = state.unreadCounts?.[item.id] || 0;
        const showUnread = !item.isCurrentUser && unreadCount > 0;

        const displayName = item.isCurrentUser
            ? 'Вы'
            : (item.name || `${item.id.substring(0, 6)}...${item.id.substring(item.id.length - 4)}`);

        const isActivePeer = state.isPrivateChat && state.activeMember?.id === item.id;

        return `
          <div class="member-item ${item.isCurrentUser ? 'current-user' : ''} ${isActivePeer ? 'active' : ''} clickable" data-peer-id="${item.id}">
            <div class="member-avatar ${item.isCurrentUser ? 'current-user' : ''}">
              ${item.isCurrentUser ? '👤' : (item.id ? item.id.substring(2, 4).toUpperCase() : '??')}
            </div>
            <div class="member-info">
              <div class="member-name">${escapeHtml(displayName)}</div>
              <div class="member-status ${item.online ? 'online' : 'offline'}">
                ${item.isCurrentUser ? 'Вы' : (item.online ? 'В сети' : 'Не в сети')}
              </div>
            </div>
            ${!item.isCurrentUser && item.online ? `
              <button class="action-btn screen-share-btn" title="Показать экран" data-peer-id="${item.id}">
                <span class="btn-icon">🖥️</span>
              </button>
            ` : ''}
            ${showUnread ? `<div class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</div>` : ''}
          </div>
        `;
    }).join('')}
    </div>
  `;
}

/**
 * Шаблон для списка сообщений
 */
export function renderMessages({state = {}} = {}) {
    const messages = state.messages || [];

    if (messages.length === 0) {
        let emptyTitle, emptyDescription;

        if (state.isPrivateChat && state.activeMember) {
            emptyTitle = `Начните общение с ${getPeerName(state.activeMember)}`;
            emptyDescription = 'Отправьте первое сообщение в приватный чат';
        } else if (!state.currentGroup) {
            emptyTitle = 'Нет сообщений';
            emptyDescription = 'Выберите или создайте группу для начала общения';
        } else {
            emptyTitle = 'Нет сообщений';
            emptyDescription = 'История пуста. Отправьте первое сообщение!';
        }

        return `
        <div class="empty-chat">
            <div class="empty-content">
                <div class="empty-icon">💬</div>
                <h3 class="empty-title">${emptyTitle}</h3>
                <p class="empty-description">${emptyDescription}</p>
            </div>
        </div>
        `;
    }

    const messagesFilter = moveSlotToEnd(messages)

    return `
    <div class="messages-content">
        ${messagesFilter.map(message => renderMessage({message})).join('')}
    </div>
    `;
}

export function renderMessage({message = {}} = {}) {
    const messageClass = message.type === 'sent'
        ? 'message-sent'
        : message.type === 'slot'
            ? 'message-slot'
            : 'message-received';
    const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if(message.type === 'slot') {
        return `<div class="message-item ${messageClass}">${message.text}</div>`
    }

    // ✅ Отображаем топик, если сообщение из группы
    const topicBadge = message.topic ?
        `<span class="message-topic-badge">#${parseChatGroupStringRegex(message.topic)}</span>` : '';

    return `
    <div class="message-item ${messageClass}" data-message-id="${message.id}" data-topic="${message.topic || ''}">
        <div class="message-bubble">
            ${message.type === 'received' ? `
            <div class="message-sender">${message.from ? message.from.substring(0, 12) + '...' : 'Неизвестный'}</div>
            ` : ''}
            <div class="message-content">
                ${topicBadge}
                ${escapeHtml(message.text)}
            </div>
            <div class="message-meta">
                <span class="message-time">${time}</span>
                ${message.status === 'sent' ? '<span class="message-status">✓</span>' : ''}
                ${message.status === 'delivered' ? '<span class="message-status">✓✓</span>' : ''}
            </div>
        </div>
    </div>
    `;
}

/**
 * Шаблон для индикатора набора сообщения
 */
export function renderTypingIndicator({state = {}} = {}) {
    return `
    <div class="typing-indicator">
        <div class="typing-avatar">
            ${state.typingUser?.id ? state.typingUser.id.substring(2, 4).toUpperCase() : '??'}
        </div>
        <div class="typing-content">
            <div class="typing-name">${getPeerName(state.typingUser) || 'Кто-то'} печатает</div>
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    </div>
    `;
}

/**
 * Шаблон для оверлея поиска
 */
export function renderSearchOverlay({state = {}} = {}) {
    return `
    <div class="search-overlay" id="search-overlay">
        <div class="search-header">
            <h3>Поиск сообщений</h3>
            <button class="close-search" id="close-search">✕</button>
        </div>
        <div class="search-content">
            <div class="search-input-container">
                <input 
                    type="text" 
                    id="search-messages-input" 
                    class="search-input" 
                    placeholder="Введите текст для поиска..."
                    value="${state.searchQuery || ''}"
                >
                <button class="search-action" id="perform-search">
                    <span class="btn-icon">🔍</span>
                </button>
            </div>
            <div class="search-results" id="search-results">
                ${renderSearchResults({state})}
            </div>
        </div>
    </div>
    `;
}

/**
 * Шаблон для результатов поиска
 */
export function renderSearchResults({state = {}} = {}) {
    if (!state.searchQuery) {
        return `
        <div class="search-empty">
            <div class="empty-icon">🔍</div>
            <p>Введите запрос для поиска сообщений</p>
        </div>
        `;
    }

    const results = state.searchResults || [];

    if (results.length === 0) {
        return `
        <div class="search-empty">
            <div class="empty-icon">😔</div>
            <p>Сообщения не найдены</p>
            <p class="empty-hint">Попробуйте изменить поисковый запрос</p>
        </div>
        `;
    }

    return `
    <div class="results-list">
        ${results.map(result => `
        <div class="search-result-item" data-message-id="${result.id}">
            <div class="result-message">
                <div class="result-sender">${result.from ? result.from.substring(0, 12) + '...' : 'Неизвестный'}</div>
                <div class="result-text">${highlightSearchText(result.text, state.searchQuery)}</div>
                <div class="result-time">${new Date(result.timestamp).toLocaleString('ru-RU')}</div>
            </div>
        </div>
        `).join('')}
    </div>
    `;
}

/**
 * Шаблон для заголовка приватного чата
 */
export function renderChatHeader({state = {}} = {}) {
    if (state.isPrivateChat && state.activeMember) {
        return `
        <div class="chat-info">
            <div class="chat-avatar">
                <span class="avatar-icon">👤</span>
            </div>
            <div class="chat-details">
                <h3 class="chat-name">${getPeerName(state.activeMember)}</h3>
                <div class="chat-status">
                    <span class="status-indicator connected"></span>
                    <span class="status-text">Приватный чат</span>
                </div>
            </div>
        </div>
        <div class="chat-actions">
            <button class="action-btn" id="clear-chat" title="Очистить чат">
                <span class="btn-icon">🗑️</span>
            </button>
            <button class="action-btn" id="search-messages" title="Поиск сообщений">
                <span class="btn-icon">🔍</span>
            </button>
            <button class="action-btn" id="toggle-members" title="Участники">
                <span class="btn-icon">👥</span>
            </button>
            <button class="action-btn" id="settings" title="Настройки">
                <span class="btn-icon">⚙️</span>
            </button>
        </div>
        `;
    }

    if (!state.currentGroup) {
        return `
        <div class="chat-info">
            <div class="chat-avatar">
                <span class="avatar-icon">💬</span>
            </div>
            <div class="chat-details">
                <h3 class="chat-name">Чат</h3>
                <div class="chat-status">
                    <span class="status-text">Выберите чат</span>
                </div>
            </div>
        </div>
        <div class="chat-actions">
            <button class="action-btn" id="clear-chat" title="Очистить чат">
                <span class="btn-icon">🗑️</span>
            </button>
            <button class="action-btn" id="search-messages" title="Поиск сообщений">
                <span class="btn-icon">🔍</span>
            </button>
            <button class="action-btn" id="toggle-members" title="Участники">
                <span class="btn-icon">👥</span>
            </button>
            <button class="action-btn" id="settings" title="Настройки">
                <span class="btn-icon">⚙️</span>
            </button>
        </div>
        `;
    }

    return `
    <div class="chat-info">
        <div class="chat-avatar">
            ${getChatAvatar(state.currentGroup)}
        </div>
        <div class="chat-details">
            <h3 class="chat-name">${getGroupName(state.currentGroup)}</h3>
            <div class="chat-status">
                <span class="status-indicator ${state.connected ? 'connected' : 'disconnected'}"></span>
                <span class="status-text">${getStatusText(state)}</span>
                ${state.currentGroup ? `<span class="member-count">👥 ${state.currentGroup.memberCount || 1}</span>` : ''}\
            </div>
        </div>
    </div>
      <div class="chat-actions">
            <button class="action-btn" id="clear-chat" title="Очистить чат">
                <span class="btn-icon">🗑️</span>
            </button>
            <button class="action-btn" id="search-messages" title="Поиск сообщений">
                <span class="btn-icon">🔍</span>
            </button>
            <button class="action-btn" id="toggle-members" title="Участники">
                <span class="btn-icon">👥</span>
            </button>
            <button class="action-btn" id="settings" title="Настройки">
                <span class="btn-icon">⚙️</span>
            </button>
        </div>
    `;
}

function getGroupName(group) {
    if (!group) return 'Безымянная группа';
    if (typeof group.name === 'string') return group.name;
    if (typeof group.name === 'object' && typeof group.name.name === 'string') return group.name.name;
    if (typeof group.topic === 'string') return parseChatGroupStringRegex(group.topic);
    return 'Безымянная группа';
}


// Безопасное получение имени пира
function getPeerName(peer) {
    if (!peer) return 'Неизвестный';
    if (typeof peer.name === 'string') return peer.name;
    if (typeof peer.name === 'object' && typeof peer.name.name === 'string') return peer.name.name;
    return null;
}

// Безопасное получение аватара группы
function getChatAvatar(group) {
    const name = getGroupName(group);
    return name ? name.charAt(0).toUpperCase() : '💬';
}

function getStatusText(state) {
    if (!state.connected) return 'Не подключено';
    if (!state.currentGroup) return 'Выберите группу';
    return state.currentGroup.memberCount > 1 ? `${state.currentGroup.memberCount} участников` : 'Только вы';
}

function getInputPlaceholder(state) {
    if (!state.connected) return 'Подключитесь к сети...';
    if (state.isPrivateChat && state.activeMember) {
        return `Сообщение для ${getPeerName(state.activeMember)}...`;
    }
    if (!state.currentGroup) return 'Выберите группу для общения...';
    return 'Введите сообщение...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightSearchText(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[]\\]/g, '\\$&');
}