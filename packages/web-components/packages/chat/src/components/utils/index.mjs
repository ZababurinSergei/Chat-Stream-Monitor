import { sha256 } from 'https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/+esm';

/**
 * Генерирует читаемое имя из Peer ID
 * @param {string} peerId - ID пира
 * @returns {string} Имя пользователя
 */
export function generatePeerName(peerId) {
    if (!peerId) return 'Неизвестный';

    // Берем первые 6 и последние 4 символа ID
    const prefix = peerId.substring(0, 4);
    const suffix = peerId.substring(peerId.length - 4);
    return `${prefix}_${suffix}`;
}

// Вспомогательная функция для генерации детерминированного ID
export function generateMessageId(text, timestamp) {
    // Убеждаемся, что timestamp — число (мс)
    const ts = typeof timestamp === 'number' ? timestamp : Date.now();
    const input = `${text}|${ts}`;
    return sha256(input).substring(0, 16); // 16-символьный хеш для компактности
}

export function parseChatGroupStringRegex(input) {
    if (typeof input !== 'string') {
        return '';
    }

    const match = input.match(/^chat-group-(.+?)(?:-\d+)?$/);
    return match ? match[1] : input.replace(/^chat-groups-/, '');
}

export async function insertRemoteControl(context, targetPeer, mode) {
    // Генерируем уникальный ID на основе targetPeer и режима
    const componentId = `remote-control-${targetPeer}-${mode}`;

    // Удаляем старый, если есть (по ID или по атрибуту)
    const existing = context.shadowRoot.getElementById(componentId) ||
        context.shadowRoot.querySelector(`remote-control[target-peer="${targetPeer}"]`);

    if (existing) existing.remove();

    // Создаём новый
    const remoteControl = document.createElement('remote-control');
    remoteControl.id = componentId; // ← обязательный уникальный id
    remoteControl.setAttribute('target-peer', targetPeer);
    remoteControl.setAttribute('mode', mode);
    remoteControl.setAttribute('slot', `remote-control-${targetPeer}`);
    // Вставляем в область чата (например, над полем ввода)
    const chatArea = context.shadowRoot.querySelector('.chat-area');
    if (chatArea) {
        chatArea.insertAdjacentElement('afterbegin', remoteControl);
    } else {
        context.appendChild(remoteControl);
    }

    return remoteControl
    // Опционально: скрываем обычные сообщения на время сессии
    // context.shadowRoot.querySelector('.messages-container')?.classList.add('hidden-during-rc');
}

export const getProtocol = function (type) {
    switch (type) {
        case 'REMOTE_CONTROL_EVENT':
            return '/remote-control/1.0.0'
        default:
            return '/chat/1.0.0'
    }
}

export function moveSlotToEnd(messages) {
    const slotIndex = messages.findIndex(item => item.type === 'slot');
    if (slotIndex !== -1) {
        messages.push(...messages.splice(slotIndex, 1));
    }
    return messages;
}