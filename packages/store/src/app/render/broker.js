// ============================================================
// render/broker.js — 100% СИМВОЛЫ — рендеринг брокера сообщений
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getAppState } from '../state.js';
import { isFunction, formatJson, formatTime, escapeHtml, safeStringify } from '../utils.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг брокера сообщений
 * 100% символы — полная изоляция
 */
export function renderBroker() {
  try {
    // Рендерим все компоненты брокера
    renderSubscriptions();
    renderMessages();
    renderBrokerStats();
    renderBrokerTopics();
    renderDeadLetter();
    renderRetryQueue();
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга брокера:', error);
    const container = DOM.messagesContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки брокера
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 3. РЕНДЕРИНГ ПОДПИСОК
// ============================================================

export function renderSubscriptions() {
  try {
    const container = DOM.subscriptionsList;
    if (!container) {
      console.warn('⚠️ subscriptionsList не найден в DOM');
      return;
    }

    // Получение подписок
    let subs = [];
    try {
      if (db.broker && isFunction(db.broker.getSubscribers)) {
        subs = db.broker.getSubscribers('*');
      } else if (isFunction(db.getSubscribers)) {
        subs = db.getSubscribers('*');
      } else if (db._brokerData) {
        // Прямой доступ к приватным данным брокера
        const p = db._brokerData;
        if (p && p[PRIVATE.SUBSCRIPTIONS]) {
          subs = Array.from(p[PRIVATE.SUBSCRIPTIONS].values());
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (!subs || subs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📡</span>
          Нет активных подписок
          <div style="font-size:10px;color:#4a5a7a;margin-top:4px;">
            Используйте кнопку «➕» для создания подписки
          </div>
        </div>
      `;
      return;
    }

    // Сортировка подписок по приоритету и времени создания
    const sortedSubs = [...subs].sort((a, b) => {
      const priorityA = a.options?.priority || 0;
      const priorityB = b.options?.priority || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return (a.created || 0) - (b.created || 0);
    });

    let html = '';
    let subscriptionCount = 0;

    for (const sub of sortedSubs) {
      const topic = sub.topic || sub.pattern || '*';
      const id = sub.id || sub.subscriptionId || sub.subId || `sub_${subscriptionCount}`;
      const options = sub.options || {};
      const state = sub.state || 'active';
      const isActive = state === 'active';
      const runs = sub.runs || 0;
      const errors = sub.errors || 0;
      const lastRun = sub.lastRun || sub.lastRunTime || null;

      subscriptionCount++;

      // Определение цвета статуса
      const statusColor = isActive ? '#34d399' : '#ef4444';
      const statusText = isActive ? 'Активен' : 'Неактивен';

      // Формирование иконок опций
      let optionIcons = '';
      if (options.once)
        optionIcons += ' <span title="Однократная" style="color:#fbbf24;">🔄</span>';
      if (options.filter)
        optionIcons += ' <span title="С фильтром" style="color:#60a5fa;">🔍</span>';
      if (options.transform)
        optionIcons += ' <span title="С трансформацией" style="color:#a78bfa;">⚡</span>';
      if (options.priority > 0)
        optionIcons += ` <span title="Приоритет ${options.priority}" style="color:#f472b6;">🔺</span>`;

      html += `
        <div class="subscription-item ${isActive ? 'active' : 'inactive'}" 
             style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;
                    border-bottom:1px solid #161e2a;font-size:11px;
                    background:${isActive ? 'transparent' : 'rgba(239,68,68,0.05)'};
                    border-left:3px solid ${statusColor};
                    transition:all 0.15s ease;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="color:#60a5fa;font-weight:500;">📨 ${escapeHtml(topic)}</span>
              ${optionIcons}
              <span style="font-size:9px;color:#4a5a7a;">ID: ${escapeHtml(String(id).substring(0, 12))}</span>
              <span style="font-size:9px;color:${statusColor};">● ${statusText}</span>
            </div>
            <div style="font-size:10px;color:#4a5a7a;margin-top:2px;display:flex;gap:12px;flex-wrap:wrap;">
              <span>📊 Вызовов: ${runs}</span>
              <span>❌ Ошибок: ${errors}</span>
              ${lastRun ? `<span>⏱ ${formatTime(lastRun)}</span>` : ''}
              ${options.maxRetries ? `<span>🔄 Retry: ${options.maxRetries}</span>` : ''}
              ${options.timeout ? `<span>⏰ Таймаут: ${options.timeout}ms</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px;">
            <button class="btn btn-secondary btn-xs subscription-stats-btn" 
                    data-id="${escapeHtml(String(id))}" 
                    title="Статистика подписки">📊</button>
            <button class="btn btn-danger btn-xs unsubscribe-btn" 
                    data-id="${escapeHtml(String(id))}" 
                    title="Отписаться">✕</button>
          </div>
        </div>
      `;
    }

    // Информация о количестве подписок
    const countHtml = `
      <div style="display:flex;justify-content:space-between;padding:4px 10px;font-size:10px;color:#4a5a7a;border-bottom:1px solid #161e2a;">
        <span>📡 Всего подписок: ${subscriptionCount}</span>
        <span>✅ Активных: ${sortedSubs.filter(s => s.state === 'active').length}</span>
        <span>🔒 Защищенных: ${sortedSubs.filter(s => s.options?.once).length}</span>
      </div>
    `;

    container.innerHTML = countHtml + html;

    // ============================================================
    // 4. ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ ПОДПИСОК
    // ============================================================

    // Кнопки отписки
    container.querySelectorAll('.unsubscribe-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm(`❌ Отписаться от подписки "${id}"?`)) {
          try {
            if (db.broker && isFunction(db.broker.unsubscribe)) {
              db.broker.unsubscribe(id);
            } else if (isFunction(db.unsubscribe)) {
              db.unsubscribe(id);
            } else if (db._brokerData) {
              const p = db._brokerData;
              if (p && p[PRIVATE.SUBSCRIPTIONS]) {
                p[PRIVATE.SUBSCRIPTIONS].delete(id);
                if (p[PRIVATE.TOPICS]) {
                  for (const [topic, ids] of p[PRIVATE.TOPICS]) {
                    ids.delete(id);
                  }
                }
              }
            }
            renderSubscriptions();
            addLog(`🗑 Подписка удалена: ${id}`, 'success');
          } catch (error) {
            console.error('❌ Ошибка отписки:', error);
            addLog(`❌ Ошибка отписки: ${error.message}`, 'error');
          }
        }
      });
    });

    // Кнопки статистики подписки
    container.querySelectorAll('.subscription-stats-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const sub = sortedSubs.find(s => (s.id || s.subscriptionId || s.subId) === id);
        if (sub) {
          const stats = {
            id: id,
            topic: sub.topic || sub.pattern,
            state: sub.state,
            runs: sub.runs || 0,
            errors: sub.errors || 0,
            options: sub.options || {},
            created: sub.created || sub.createdAt,
            lastRun: sub.lastRun || sub.lastRunTime,
          };
          alert(JSON.stringify(stats, null, 2));
        }
      });
    });

    // Обновление счетчика
    if (DOM.subscribersCount) {
      DOM.subscribersCount.textContent = subscriptionCount;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга подписок:', error);
    const container = DOM.subscriptionsList;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки подписок
        </div>
      `;
    }
  }
}

// ============================================================
// 5. РЕНДЕРИНГ СООБЩЕНИЙ
// ============================================================

export function renderMessages() {
  try {
    const container = DOM.messagesContainer;
    if (!container) {
      console.warn('⚠️ messagesContainer не найден в DOM');
      return;
    }

    // Получение сообщений
    let messages = [];
    try {
      if (db.broker && isFunction(db.broker.getMessages)) {
        messages = db.broker.getMessages(null, 100);
      } else if (isFunction(db.getMessages)) {
        messages = db.getMessages(null, 100);
      } else if (db._brokerData) {
        const p = db._brokerData;
        if (p && p[PRIVATE.MESSAGE_HISTORY]) {
          messages = p[PRIVATE.MESSAGE_HISTORY];
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📭</span>
          Нет сообщений
          <div style="font-size:10px;color:#4a5a7a;margin-top:4px;">
            Опубликуйте сообщение через форму выше
          </div>
        </div>
      `;
      if (DOM.messagesCount) DOM.messagesCount.textContent = '0';
      return;
    }

    // Сортировка по времени (новые сверху)
    const sortedMessages = [...messages].sort(
      (a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)
    );

    // Лимит отображения
    const displayMessages = sortedMessages.slice(0, 100);

    let html = '';
    let messageCount = 0;

    for (const msg of displayMessages) {
      const topic = msg.topic || msg.pattern || 'unknown';
      const data = msg.data || msg.payload || {};
      const timestamp = msg.timestamp || msg.createdAt || Date.now();
      const id = msg.id || msg.messageId || `msg_${messageCount}`;
      const isDelivered = msg._delivered !== false;
      const isExpired = msg._expired || false;
      const source = msg.source || 'unknown';

      messageCount++;

      // Определение цвета статуса
      let statusIcon = '✅';
      let statusColor = '#34d399';
      if (isExpired) {
        statusIcon = '⏰';
        statusColor = '#fbbf24';
      } else if (!isDelivered) {
        statusIcon = '⏳';
        statusColor = '#60a5fa';
      }

      // Форматирование данных
      const dataStr = safeStringify(data, 80);
      const dataPreview = dataStr.length > 80 ? dataStr.substring(0, 80) + '...' : dataStr;

      html += `
        <div class="message-item" 
             style="display:flex;flex-direction:column;padding:4px 10px;
                    border-bottom:1px solid #161e2a;font-size:11px;font-family:monospace;
                    transition:background 0.15s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;">
              <span style="color:#4a5a7a;font-size:9px;">[${formatTime(timestamp)}]</span>
              <span style="color:#60a5fa;font-weight:500;">${escapeHtml(topic)}</span>
              <span style="color:#8b96b0;">→</span>
              <span style="color:#34d399;word-break:break-all;">${escapeHtml(dataPreview)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <span style="font-size:9px;color:${statusColor};">${statusIcon}</span>
              <span style="font-size:9px;color:#4a5a7a;">${escapeHtml(source)}</span>
              <span style="font-size:9px;color:#4a5a7a;">ID: ${escapeHtml(String(id).substring(0, 8))}</span>
            </div>
          </div>
          ${
            msg.correlationId
              ? `<div style="font-size:9px;color:#4a5a7a;margin-top:2px;">🔗 Корреляция: ${escapeHtml(msg.correlationId)}</div>`
              : ''
          }
          ${
            msg.replyTo
              ? `<div style="font-size:9px;color:#4a5a7a;">📨 Ответить в: ${escapeHtml(msg.replyTo)}</div>`
              : ''
          }
        </div>
      `;
    }

    // Информация о количестве сообщений
    const totalMessages = messages.length;
    const countHtml = `
      <div style="display:flex;justify-content:space-between;padding:4px 10px;font-size:10px;color:#4a5a7a;border-bottom:1px solid #161e2a;">
        <span>📨 Всего сообщений: ${totalMessages}</span>
        <span>📊 Показано: ${displayMessages.length}</span>
        ${totalMessages > 100 ? `<span>⚠️ +${totalMessages - 100} еще</span>` : ''}
      </div>
    `;

    container.innerHTML = countHtml + html;

    // Прокрутка вниз (к новым сообщениям)
    container.scrollTop = container.scrollHeight;

    // Обновление счетчика
    if (DOM.messagesCount) {
      DOM.messagesCount.textContent = totalMessages;
    }
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга сообщений:', error);
    const container = DOM.messagesContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки сообщений
        </div>
      `;
    }
  }
}

// ============================================================
// 6. РЕНДЕРИНГ СТАТИСТИКИ БРОКЕРА
// ============================================================

export function renderBrokerStats() {
  try {
    const container = document.getElementById('brokerStats');
    if (!container) return;

    let stats = {};
    try {
      if (db.broker && isFunction(db.broker.getStats)) {
        stats = db.broker.getStats();
      } else if (isFunction(db.getBrokerStats)) {
        stats = db.getBrokerStats();
      } else if (db._brokerData) {
        const p = db._brokerData;
        if (p && p[PRIVATE.STATS]) {
          stats = p[PRIVATE.STATS];
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (Object.keys(stats).length === 0) {
      container.innerHTML = `
        <div style="font-size:11px;color:#4a5a7a;text-align:center;padding:8px;">
          Нет данных статистики
        </div>
      `;
      return;
    }

    const html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:6px;font-size:10px;">
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">📨 Опубликовано</div>
          <div style="color:#60a5fa;font-size:16px;font-weight:bold;">${stats.published || 0}</div>
        </div>
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">✅ Доставлено</div>
          <div style="color:#34d399;font-size:16px;font-weight:bold;">${stats.delivered || 0}</div>
        </div>
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">❌ Ошибок</div>
          <div style="color:#ef4444;font-size:16px;font-weight:bold;">${stats.failed || 0}</div>
        </div>
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">🔄 Retry</div>
          <div style="color:#fbbf24;font-size:16px;font-weight:bold;">${stats.retried || 0}</div>
        </div>
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">📡 Подписчиков</div>
          <div style="color:#a78bfa;font-size:16px;font-weight:bold;">${stats.subscriberCount || stats.subscriptions || 0}</div>
        </div>
        <div style="background:#0b0e14;border-radius:4px;padding:4px 8px;text-align:center;border:1px solid #1e2633;">
          <div style="color:#4a5a7a;">⏱ Время</div>
          <div style="color:#8b96b0;font-size:12px;font-weight:bold;">
            ${stats.uptime ? Math.floor(stats.uptime / 1000) + 'с' : '0с'}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга статистики брокера:', error);
  }
}

// ============================================================
// 7. РЕНДЕРИНГ ТОПИКОВ
// ============================================================

export function renderBrokerTopics() {
  try {
    const container = document.getElementById('brokerTopics');
    if (!container) return;

    let topics = [];
    try {
      if (db.broker && isFunction(db.broker.getTopics)) {
        topics = db.broker.getTopics();
      } else if (isFunction(db.getTopics)) {
        topics = db.getTopics();
      } else if (db._brokerData) {
        const p = db._brokerData;
        if (p && p[PRIVATE.TOPICS]) {
          topics = Array.from(p[PRIVATE.TOPICS].keys());
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (!topics || topics.length === 0) {
      container.innerHTML = `
        <div style="font-size:11px;color:#4a5a7a;text-align:center;padding:4px;">
          Нет активных топиков
        </div>
      `;
      return;
    }

    // Сортировка топиков
    const sortedTopics = [...topics].sort();

    let html = `
      <div style="display:flex;flex-wrap:wrap;gap:4px;padding:4px;">
    `;

    for (const topic of sortedTopics) {
      // Подсчет подписчиков для топика
      let subscriberCount = 0;
      try {
        if (db.broker && isFunction(db.broker.getSubscribers)) {
          const subs = db.broker.getSubscribers(topic);
          subscriberCount = subs ? subs.length : 0;
        }
      } catch (e) {
        // Игнорируем
      }

      const isWildcard = topic.includes('*');
      const color = isWildcard ? '#a78bfa' : '#60a5fa';
      const icon = isWildcard ? '🔀' : '📨';

      html += `
        <span style="background:#0b0e14;border:1px solid #1e2633;border-radius:12px;
                     padding:2px 10px;font-size:10px;color:${color};
                     display:inline-flex;align-items:center;gap:4px;">
          ${icon} ${escapeHtml(topic)}
          ${subscriberCount > 0 ? `<span style="color:#4a5a7a;font-size:8px;">(${subscriberCount})</span>` : ''}
        </span>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга топиков:', error);
  }
}

// ============================================================
// 8. РЕНДЕРИНГ DEAD LETTER QUEUE
// ============================================================

export function renderDeadLetter() {
  try {
    const container = document.getElementById('deadLetterQueue');
    if (!container) return;

    let deadLetters = [];
    try {
      if (db.broker && isFunction(db.broker.getDeadLetter)) {
        deadLetters = db.broker.getDeadLetter();
      } else if (isFunction(db.getDeadLetter)) {
        deadLetters = db.getDeadLetter();
      } else if (db._brokerData) {
        const p = db._brokerData;
        if (p && p[PRIVATE.DEAD_LETTER]) {
          deadLetters = p[PRIVATE.DEAD_LETTER];
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (!deadLetters || deadLetters.length === 0) {
      container.innerHTML = `
        <div style="font-size:11px;color:#4a5a7a;text-align:center;padding:4px;">
          📭 Dead Letter Queue пуста
        </div>
      `;
      return;
    }

    // Показываем последние 5 записей
    const recent = deadLetters.slice(-5).reverse();

    let html = `
      <div style="font-size:10px;color:#4a5a7a;padding:4px;border-bottom:1px solid #161e2a;">
        💀 Всего в DLQ: ${deadLetters.length}
      </div>
    `;

    for (const item of recent) {
      const error = item.error || 'Unknown error';
      const topic = item.message?.topic || 'unknown';
      const timestamp = item.timestamp || Date.now();

      html += `
        <div style="padding:4px 8px;border-bottom:1px solid #161e2a;font-size:10px;font-family:monospace;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#ef4444;">💀 ${escapeHtml(topic)}</span>
            <span style="color:#4a5a7a;">${formatTime(timestamp)}</span>
          </div>
          <div style="color:#8b96b0;font-size:9px;">${escapeHtml(error.substring(0, 60))}</div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга Dead Letter:', error);
  }
}

// ============================================================
// 9. РЕНДЕРИНГ RETRY QUEUE
// ============================================================

export function renderRetryQueue() {
  try {
    const container = document.getElementById('retryQueue');
    if (!container) return;

    let retryItems = [];
    try {
      if (db._brokerData) {
        const p = db._brokerData;
        if (p && p[PRIVATE.RETRY_QUEUE]) {
          retryItems = p[PRIVATE.RETRY_QUEUE];
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    if (!retryItems || retryItems.length === 0) {
      container.innerHTML = `
        <div style="font-size:11px;color:#4a5a7a;text-align:center;padding:4px;">
          ⏳ Retry Queue пуста
        </div>
      `;
      return;
    }

    // Показываем последние 5 записей
    const recent = retryItems.slice(-5).reverse();

    let html = `
      <div style="font-size:10px;color:#4a5a7a;padding:4px;border-bottom:1px solid #161e2a;">
        ⏳ В очереди: ${retryItems.length}
      </div>
    `;

    for (const item of recent) {
      const topic = item.message?.topic || 'unknown';
      const attempt = item.attempt || 1;
      const retryAt = item.retryAt || Date.now();
      const timeLeft = Math.max(0, Math.floor((retryAt - Date.now()) / 1000));

      html += `
        <div style="padding:4px 8px;border-bottom:1px solid #161e2a;font-size:10px;font-family:monospace;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#fbbf24;">⏳ ${escapeHtml(topic)}</span>
            <span style="color:#4a5a7a;">Попытка ${attempt}</span>
          </div>
          <div style="color:#8b96b0;font-size:9px;">
            ${timeLeft > 0 ? `⏱ через ${timeLeft}с` : '🔄 готов к повтору'}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга Retry Queue:', error);
  }
}

// ============================================================
// 10. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Очистка всех данных брокера
 */
export function clearBrokerData() {
  try {
    if (db.broker && isFunction(db.broker.clearHistory)) {
      db.broker.clearHistory();
    }
    if (db.broker && isFunction(db.broker.clearDeadLetter)) {
      db.broker.clearDeadLetter();
    }
    if (db._brokerData) {
      const p = db._brokerData;
      if (p) {
        if (p[PRIVATE.MESSAGE_HISTORY]) p[PRIVATE.MESSAGE_HISTORY] = [];
        if (p[PRIVATE.DEAD_LETTER]) p[PRIVATE.DEAD_LETTER] = [];
        if (p[PRIVATE.RETRY_QUEUE]) p[PRIVATE.RETRY_QUEUE] = [];
        if (p[PRIVATE.MESSAGE_CACHE]) p[PRIVATE.MESSAGE_CACHE].clear();
      }
    }
    renderBroker();
    addLog('🧹 Данные брокера очищены', 'success');
  } catch (error) {
    console.error('❌ Ошибка очистки брокера:', error);
    addLog(`❌ Ошибка очистки брокера: ${error.message}`, 'error');
  }
}

/**
 * Обновление брокера с задержкой (дебаунс)
 */
let brokerTimeout = null;

export function renderBrokerDebounced(delay = 500) {
  if (brokerTimeout) {
    clearTimeout(brokerTimeout);
  }
  brokerTimeout = setTimeout(() => {
    renderBroker();
    brokerTimeout = null;
  }, delay);
}

/**
 * Получение статистики брокера в виде объекта
 */
export function getBrokerStats() {
  try {
    let stats = {};
    if (db.broker && isFunction(db.broker.getStats)) {
      stats = db.broker.getStats();
    } else if (isFunction(db.getBrokerStats)) {
      stats = db.getBrokerStats();
    } else if (db._brokerData) {
      const p = db._brokerData;
      if (p && p[PRIVATE.STATS]) {
        stats = p[PRIVATE.STATS];
      }
    }
    return stats;
  } catch (error) {
    console.warn('⚠️ Ошибка получения статистики брокера:', error);
    return {};
  }
}

// ============================================================
// 11. ИНИЦИАЛИЗАЦИЯ И ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ============================================================

// Добавляем функции в глобальный объект app для доступа из консоли
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};
  window.app.renderBroker = renderBroker;
  window.app.renderSubscriptions = renderSubscriptions;
  window.app.renderMessages = renderMessages;
  window.app.clearBrokerData = clearBrokerData;
  window.app.getBrokerStats = getBrokerStats;

  // Добавляем горячие клавиши для брокера
  document.addEventListener('keydown', e => {
    // Ctrl+B — открыть/обновить брокер
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      renderBroker();
    }
  });
}

// ============================================================
// 12. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ (опционально)
// ============================================================

let brokerAutoRefreshInterval = null;

/**
 * Запуск автоматического обновления брокера
 */
export function startBrokerAutoRefresh(interval = 5000) {
  if (brokerAutoRefreshInterval) {
    clearInterval(brokerAutoRefreshInterval);
  }
  brokerAutoRefreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      renderBrokerDebounced(300);
    }
  }, interval);
  addLog(`🔄 Авто-обновление брокера запущено (${interval}ms)`, 'info');
}

/**
 * Остановка автоматического обновления брокера
 */
export function stopBrokerAutoRefresh() {
  if (brokerAutoRefreshInterval) {
    clearInterval(brokerAutoRefreshInterval);
    brokerAutoRefreshInterval = null;
    addLog('⏹ Авто-обновление брокера остановлено', 'info');
  }
}

// ============================================================
// 13. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderBroker,
  renderSubscriptions,
  renderMessages,
  renderBrokerStats,
  renderBrokerTopics,
  renderDeadLetter,
  renderRetryQueue,
  clearBrokerData,
  renderBrokerDebounced,
  getBrokerStats,
  startBrokerAutoRefresh,
  stopBrokerAutoRefresh,
};
