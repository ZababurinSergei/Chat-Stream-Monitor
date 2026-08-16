/**
 * Основной шаблон компонента PeerConnection
 * @param {Object} params
 * @param {Object} params.state - Состояние компонента
 * @returns {string} HTML строка
 */
export default function defaultTemplate({state = {}} = {}) {
    return `\
    <div class=\"peer-connection\">\
        <!-- Заголовок и основная информация -->\
        <header class=\"connection-header\">\
            <div class=\"header-main\">\
                <h1 class=\"connection-title\">\
                    <span class=\"title-icon\">🌐</span>\
                    Подключение\
                </h1>\
                <div class=\"connection-status ${state.connected ? 'connected' : 'disconnected'}\">\
                    <span class=\"status-dot\"></span>\
                    <span class=\"status-text\">${state.connected ? 'Подключено' : 'Не подключено'}</span>\
                </div>\
            </div>\
            <div class=\"header-meta\">\
                <div class=\"meta-item\">\
                    <span class=\"meta-label\">Режим:</span>\
                    <span class=\"meta-value mode-${state.mode}\">${state.mode === 'listener' ? 'Слушатель' : 'Инициатор'}</span>\
                </div>\
                <div class=\"meta-item\">\
                    <span class=\"meta-label\">Peer ID:</span>\
                    <span class=\"meta-value peer-id\">${state.peerId ? state.peerId : 'Не доступен'}</span>\
                </div>\
                ${state.webRtcAddress ? `\
                <div class=\"meta-item\">\
                    <span class=\"meta-label\">WebRTC:</span>\
                    <span 
                        class=\"meta-value webRTC-address clickable\" 
                        title=\"Кликните, чтобы скопировать\"
                        data-address=\"${state.webRtcAddress}\"
                    >${state.webRtcAddress}</span>\
                </div>\
                ` : ''}\
            </div>\
        </header>\
\
        <!-- Основная сетка компонентов -->\
        <main class=\"connection-grid\">\
            <!-- Статус подключения -->\
            <section class=\"grid-card status-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">📊</span>\
                        Статус системы\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    ${renderSystemStatus({state})}\
                </div>\
            </section>\
\
            <!-- Управление подключением -->\
            <section class=\"grid-card control-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">⚡</span>\
                        Управление\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    ${renderConnectionControls({state})}\
                </div>\
            </section>\
\
            <!-- Информация о пирах -->\
            <section class=\"grid-card peers-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">👥</span>\
                        Подключенные пиры\
                        <span class=\"card-badge\">${state.connectedPeers ? state.connectedPeers.length : 0}</span>\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    ${renderPeersList({state})}\
                </div>\
            </section>\
\
            <!-- Адреса прослушивания -->\
            <section class=\"grid-card addresses-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">📍</span>\
                        Адреса прослушивания\
                        <span class=\"card-badge\">${state.listeningAddresses ? state.listeningAddresses.length : 0}</span>\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                     <div id=\"listening-addresses\">\
                        ${renderAddressesList({state})}\
                    </div>\
                </div>\
            </section>\
\
            <!-- Быстрые действия -->\
            <section class=\"grid-card actions-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">🚀</span>\
                        Быстрые действия\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    ${renderQuickActions({state})}\
                </div>\
            </section>\
\
            <!-- Статистика -->\
            <section class=\"grid-card stats-card\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">📈</span>\
                        Статистика\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    ${renderStatistics({state})}\
                </div>\
            </section>\
\
            <!-- Секция подключенных пиров для renderPart -->\
            <section class=\"grid-card connected-peers-section\" style=\"display: none;\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">🔗</span>\
                        Активные подключения\
                        <span class=\"card-badge\">${state.connectedPeers ? state.connectedPeers.length : 0}</span>\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    <div id=\"connected-peers-list\">\
                        ${renderConnectedPeersDetailed({state})}\
                    </div>\
                </div>\
            </section>\
            
              <!-- Секция подключенных пиров для renderPart -->\
            <section class=\"grid-card connected-peers-section\" style=\"display: none;\">\
                <div class=\"card-header\">\
                    <h3 class=\"card-title\">\
                        <span class=\"card-icon\">🔗</span>\
                        DHT\
                        <span class=\"card-badge\">${state.connectedPeers ? state.connectedPeers.length : 0}</span>\
                    </h3>\
                </div>\
                <div class=\"card-content\">\
                    <div id=\"connected-peers-list\">\
                        ${renderDHTControls({state})}\
                    </div>\
                </div>\
            </section>\
        </main>\
\
        <!-- Футер с дополнительной информацией -->\
        <footer class=\"connection-footer\">\
            <div class=\"footer-content\">\
                <div class=\"footer-info\">\
                    <span class=\"info-text\">P2P сеть</span>\
                    <span class=\"info-dot\"></span>\
                    <span class=\"info-text\">${state.relayEnabled ? 'Relay включен' : 'Relay выключен'}</span>\
                </div>\
                <div class=\"footer-actions\">\
                    <button class=\"footer-btn\" id=\"refresh-all\">\
                        <span class=\"btn-icon\">🔄</span>\
                        Обновить\
                    </button>\
                </div>\
            </div>\
        </footer>\
    </div>\
    `;
}

/**
 * Шаблон для управления DHT
 */
export function renderDHTControls({state = {}} = {}) {
    return `
    <div class="control-group">
        <label class="control-label">DHT сети</label>
        <div class="settings-group">
            <label class="setting-toggle">
                <input 
                    type="checkbox" 
                    id="dht-lan-toggle" 
                    ${state.dhtEnabled?.lan ? 'checked' : ''}
                >
                <span class="toggle-slider"></span>
                <span class="toggle-label">LAN DHT</span>
            </label>
            <label class="setting-toggle">
                <input 
                    type="checkbox" 
                    id="dht-amino-toggle" 
                    ${state.dhtEnabled?.amino ? 'checked' : ''}
                >
                <span class="toggle-slider"></span>
                <span class="toggle-label">Amino DHT</span>
            </label>
            <label class="setting-toggle">
                <input 
                    type="checkbox" 
                    id="dht-universe-toggle" 
                    ${state.dhtEnabled?.universe ? 'checked' : ''}
                >
                <span class="toggle-slider"></span>
                <span class="toggle-label">Universe DHT</span>
            </label>
        </div>
    </div>
    `;
}

/**
 * Шаблон для статуса системы
 */
export function renderSystemStatus({state = {}} = {}) {
    return `\
    <div class=\"status-grid\">\
        <div class=\"status-item\">\
            <div class=\"status-icon ${state.connected ? 'connected' : 'disconnected'}\">\
                ${state.connected ? '🟢' : '🔴'}\
            </div>\
            <div class=\"status-info\">\
                <span class=\"status-label\">Состояние</span>\
                <span class=\"status-value\">${state.connected ? 'Активно' : 'Неактивно'}</span>\
            </div>\
        </div>\
        <div class=\"status-item\">\
            <div class=\"status-icon\">\
                🌐\
            </div>\
            <div class=\"status-info\">\
                <span class=\"status-label\">Режим</span>\
                <span class=\"status-value\">${state.mode === 'listener' ? 'Слушатель' : 'Инициатор'}</span>\
            </div>\
        </div>\
        <div class=\"status-item\">\
            <div class=\"status-icon ${state.relayEnabled ? 'enabled' : 'disabled'}\">\
                ${state.relayEnabled ? '🔗' : '⛓️'}\
            </div>\
            <div class=\"status-info\">\
                <span class=\"status-label\">Relay</span>\
                <span class=\"status-value\">${state.relayEnabled ? 'Включен' : 'Выключен'}</span>\
            </div>\
        </div>\
        <div class=\"status-item\">\
            <div class=\"status-icon\">\
                ⏱️\
            </div>\
            <div class=\"status-info\">\
                <span class=\"status-label\">Время работы</span>\
                <span class=\"status-value uptime-display\">${state.uptime || '0:00'}</span>\
            </div>\
        </div>\
    </div>\
    `;
}

/**
 * Шаблон для управления подключением
 */
export function renderConnectionControls({state = {}} = {}) {
    return `\
    <div class=\"controls-container\">\
        <!-- Переключение режимов -->\
        <div class=\"control-group\">\
            <label class=\"control-label\">Режим работы</label>\
            <div class=\"mode-switcher\">\
                <button class=\"mode-btn ${state.mode === 'listener' ? 'active' : ''}\" id=\"listener-mode-btn\">\
                    <span class=\"btn-icon\">📡</span>\
                    Слушатель\
                </button>\
                <button class=\"mode-btn ${state.mode === 'dialer' ? 'active' : ''}\" id=\"dialer-mode-btn\">\
                    <span class=\"btn-icon\">🔗</span>\
                    Инициатор\
                </button>\
            </div>\
        </div>\
\
        <!-- Подключение к пиру -->\
        <div class=\"control-group\">\
            <label class=\"control-label\">Подключиться к пиру</label>\
            <div class=\"connection-input-group\">\
                <input \
                    type=\"text\" \
                    id=\"peer-address-input\" \
                    class=\"connection-input\"\
                    placeholder=\"/ip4/127.0.0.1/tcp/1234/ws/p2p/12D3KooW...\"\
                    ${!state.connected ? 'disabled' : ''}\
                >\
                <button \
                    id=\"connect-peer-btn\" \
                    class=\"connect-btn\"\
                    ${!state.connected ? 'disabled' : ''}\
                >\
                    <span class=\"btn-icon\">🔌</span>\
                    Подключить\
                </button>\
            </div>\
        </div>\
\
        <!-- Настройки Relay -->\
        <div class=\"control-group\">\
            <label class=\"control-label\">Настройки сети</label>\
            <div class=\"settings-group\">\
                <label class=\"setting-toggle\">\
                    <input \
                        type=\"checkbox\" \
                        id=\"relay-toggle\" \
                        ${state.relayEnabled ? 'checked' : ''}\
                        ${state.connected ? 'disabled' : ''}\
                    >\
                    <span class=\"toggle-slider\"></span>\
                    <span class=\"toggle-label\">Использовать Relay</span>\
                </label>\
            </div>\
        </div>\
    </div>\
    `;
}

/**
 * Шаблон для списка пиров
 */
export function renderPeersList({state = {}} = {}) {
    const peers = state.connectedPeers || [];

    if (peers.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">👥</div>\
            <p class=\"empty-title\">Нет подключенных пиров</p>\
            <p class=\"empty-description\">Подключитесь к другим участникам сети</p>\
        </div>\
        `;
    }

    return `\
    <div class=\"peers-container\" id=\"connected-peers-list\">\
        ${peers.map((peer, index) => `\
        <div class=\"peer-item\" data-peer-id=\"${peer.id}\">\
            <div class=\"peer-avatar\">\
                ${peer.id ? peer.id.substring(2, 4).toUpperCase() : '??'}\
            </div>\
            <div class=\"peer-info\">\
                <div class=\"peer-name\">Пир #${index + 1}</div>\
                <div class=\"peer-id\">${peer.id.substring(0, 24)}...</div>\
                <div class=\"peer-meta\">\
                    <span class=\"peer-connections\">${peer.connections ? peer.connections.length : 1} соединений</span>\
                </div>\
            </div>\
            <div class=\"peer-actions\">\
                <button class=\"peer-action-btn disconnect\" data-peer-id=\"${peer.id}\">\
                    <span class=\"action-icon\">❌</span>\
                </button>\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Детализированный шаблон для списка подключенных пиров (для renderPart)
 */
export function renderConnectedPeersDetailed({state = {}} = {}) {
    const peers = state.connectedPeers || [];

    if (peers.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">🔌</div>\
            <p class=\"empty-title\">Нет активных подключений</p>\
            <p class=\"empty-description\">Пиры появятся здесь после установки соединений</p>\
        </div>\
        `;
    }

    return `\
    <div class=\"peers-detailed-container\">\
        ${peers.map((peer, index) => `\
        <div class=\"peer-detailed-item\" data-peer-id=\"${peer.id}\">\
            <div class=\"peer-header\">\
                <div class=\"peer-avatar-large\">\
                    ${peer.id ? peer.id.substring(2, 4).toUpperCase() : '??'}\
                </div>\
                <div class=\"peer-main-info\">\
                    <div class=\"peer-name\">Подключение #${index + 1}</div>\
                    <div class=\"peer-id-full\">${peer.id}</div>\
                </div>\
                <div class=\"peer-status-indicator connected\">\
                    <span class=\"status-dot\"></span>\
                    <span class=\"status-text\">Подключен</span>\
                </div>\
            </div>\
            \
            <div class=\"peer-connections-info\">\
                <div class=\"connections-header\">\
                    <span class=\"connections-label\">Активные соединения:</span>\
                    <span class=\"connections-count\">${peer.connections ? peer.connections.length : 1}</span>\
                </div>\
                \
                ${peer.connections ? peer.connections.map(conn => `\
                <div class=\"connection-item\">\
                    <div class=\"connection-protocol\">\
                        <span class=\"protocol-icon\">🔗</span>\
                        <span class=\"protocol-name\">${getConnectionProtocol(conn.remoteAddr)}</span>\
                    </div>\
                    <div class=\"connection-address\">${conn.remoteAddr}</div>\
                    <div class=\"connection-status ${conn.status}\">\
                        <span class=\"status-badge\">${conn.status}</span>\
                    </div>\
                </div>\
                `).join('') : `\
                <div class=\"connection-item\">\
                    <div class=\"connection-protocol\">\
                        <span class=\"protocol-icon\">🌐</span>\
                        <span class=\"protocol-name\">P2P</span>\
                    </div>\
                    <div class=\"connection-address\">Прямое подключение</div>\
                    <div class=\"connection-status open\">\
                        <span class=\"status-badge\">active</span>\
                    </div>\
                </div>\
                `}\
            </div>\
            \
            <div class=\"peer-actions-detailed\">\
                <button class=\"action-btn secondary disconnect-peer\" data-peer-id=\"${peer.id}\">\
                    <span class=\"btn-icon\">🚫</span>\
                    Отключить\
                </button>\
                <button class=\"action-btn outline copy-peer-id\" data-peer-id=\"${peer.id}\">\
                    <span class=\"btn-icon\">📋</span>\
                    ID\
                </button>\
                <button class=\"action-btn outline peer-info\" data-peer-id=\"${peer.id}\">\
                    <span class=\"btn-icon\">ℹ️</span>\
                    Инфо\
                </button>\
            </div>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для списка адресов
 */
export function renderAddressesList({state = {}} = {}) {
    const addresses = state.listeningAddresses || [];

    if (addresses.length === 0) {
        return `\
        <div class=\"empty-state\">\
            <div class=\"empty-icon\">📍</div>\
            <p class=\"empty-title\">Нет адресов прослушивания</p>\
            <p class=\"empty-description\">Запустите P2P узел для получения адресов</p>\
        </div>\
        `;
    }

    return `\
    <div class=\"addresses-container\">\
        ${addresses.map((address, index) => `\
        <div class=\"address-item\" data-address=\"${address}\">\
            <div class=\"address-index\">${index + 1}</div>\
            <div class=\"address-content\">\
                <div class=\"address-protocol\">\
                    ${getProtocolIcon(address)}\
                    ${getProtocolName(address)}\
                </div>\
                <div class=\"address-value\">${address}</div>\
            </div>\
            <button class=\"address-action copy\" data-address=\"${address}\">\
                <span class=\"action-icon\">📋</span>\
            </button>\
        </div>\
        `).join('')}\
    </div>\
    `;
}

/**
 * Шаблон для быстрых действий
 */
export function renderQuickActions({state = {}} = {}) {
    return `\
    <div class=\"actions-grid\">\
        <button class=\"action-btn primary\" id=\"copy-peer-id\" ${!state.peerId ? 'disabled' : ''}>\
            <span class=\"btn-icon\">📋</span>\
            <span class=\"btn-text\">Копировать Peer ID</span>\
        </button>\
        \
        <button class=\"action-btn secondary\" id=\"copy-addresses\" ${!state.listeningAddresses || state.listeningAddresses.length === 0 ? 'disabled' : ''}>\
            <span class=\"btn-icon\">🌐</span>\
            <span class=\"btn-text\">Копировать адреса</span>\
        </button>\
        \
        <button class=\"action-btn secondary\" id=\"disconnect-all\" ${!state.connectedPeers || state.connectedPeers.length === 0 ? 'disabled' : ''}>\
            <span class=\"btn-icon\">🚫</span>\
            <span class=\"btn-text\">Отключить всех</span>\
        </button>\
        \
        <button class=\"action-btn outline\" id=\"restart-node\">\
            <span class=\"btn-icon\">🔄</span>\
            <span class=\"btn-text\">Перезапустить узел</span>\
        </button>\
    </div>\
    `;
}

/**
 * Шаблон для статистики с DHT
 */
export function renderStatistics({state = {}} = {}) {
    const peersCount = state.connectedPeers ? state.connectedPeers.length : 0;
    const addressesCount = state.listeningAddresses ? state.listeningAddresses.length : 0;
    const connectionCount = state.connectedPeers ?
        state.connectedPeers.reduce((total, peer) => total + (peer.connections ? peer.connections.length : 1), 0) : 0;

    const dhtPeersCount = state.dhtPeers ?
        Object.values(state.dhtPeers).flat().length : 0;

    return `
    <div class="stats-grid">
        <div class="stat-item">
            <div class="stat-value">${peersCount}</div>
            <div class="stat-label">Пиров</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${connectionCount}</div>
            <div class="stat-label">Соединений</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${addressesCount}</div>
            <div class="stat-label">Адресов</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${dhtPeersCount}</div>
            <div class="stat-label">DHT пиров</div>
        </div>
    </div>
    `;
}

/**
 * Шаблон для списка адресов (альтернативный метод для renderPart)
 */
export function renderAddresses({state = {}} = {}) {
    return renderAddressesList({state});
}

/**
 * Шаблон для списка подключенных пиров (альтернативный метод для renderPart)
 */
export function renderConnectedPeers({state = {}} = {}) {
    return renderConnectedPeersDetailed({state});
}

/**
 * Шаблон для статуса подключения (для ChatInterface)
 */
export function renderStatus({state = {}} = {}) {
    if (!state.connected) {
        return `\
        <div class=\"status-message disconnected\">\
            <span class=\"status-icon\">🔴</span>\
            <span class=\"status-text\">Не подключено к P2P сети</span>\
            <button class=\"status-action\" id=\"reconnect\">Переподключиться</button>\
        </div>\
        `;
    }

    if (!state.currentGroup) {
        return `\
        <div class=\"status-message info\">\
            <span class=\"status-icon\">ℹ️</span>\
            <span class=\"status-text\">Выберите или создайте группу для начала общения</span>\
        </div>\
        `;
    }

    return `\
    <div class=\"status-message connected\">\
        <span class=\"status-icon\">🟢</span>\
        <span class=\"status-text\">Подключено к группу \\\"${state.currentGroup.name}\\\"</span>\
        <span class=\"peer-id\">ID: ${state.peerId ? state.peerId.substring(0, 12) + '...' : 'Неизвестен'}</span>\
    </div>\
    `;
}

/**
 * Вспомогательные функции
 */
function getProtocolIcon(address) {
    if (address.includes('/ws')) return '🔗';
    if (address.includes('/wss')) return '🔒';
    if (address.includes('/webrtc')) return '🌐';
    if (address.includes('/p2p-circuit')) return '🔄';
    return '⚡';
}

function getProtocolName(address) {
    if (address.includes('/ws')) return 'WebSocket';
    if (address.includes('/wss')) return 'Secure WS';
    if (address.includes('/webrtc')) return 'WebRTC';
    if (address.includes('/p2p-circuit')) return 'Relay';
    return 'Unknown';
}

function getConnectionProtocol(address) {
    if (address.includes('/ws')) return 'WebSocket';
    if (address.includes('/wss')) return 'Secure WebSocket';
    if (address.includes('/webrtc')) return 'WebRTC';
    if (address.includes('/p2p-circuit')) return 'Circuit Relay';
    if (address.includes('/tcp')) return 'TCP';
    return 'Direct';
}