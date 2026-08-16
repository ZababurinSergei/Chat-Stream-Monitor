// ============================================================
// controllers/broker.js — 100% СИМВОЛЫ — управление брокером сообщений
// Версия: 4.0.8 (МОДУЛЬНАЯ — ИСПРАВЛЕНА)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { getAppState, setPrivate } from '../state.js';
import { isFunction, escapeHtml, formatJson, safeCall } from '../utils.js';
import { showAlertInModal, showModal } from '../modal.js';
import { renderMessages, renderSubscriptions } from '../render/index.js';
import { addLog } from '../logger.js';
import { CONFIG } from '../config.js';

// ============================================================
// 2. ПОЛУЧЕНИЕ ХРАНИЛИЩА (100% БЕЗОПАСНО)
// ============================================================

/**
 * Безопасное получение хранилища с полным API
 * 1. Через window.__globalStore
 * 2. Через window.__db
 * 3. Через импортированный db
 */
function getStore() {
  // Приоритет 1: глобальное хранилище
  if (typeof window !== 'undefined' && window.__globalStore) {
    return window.__globalStore;
  }

  // Приоритет 2: __db
  if (typeof window !== 'undefined' && window.__db) {
    return window.__db;
  }

  // Приоритет 3: импортированный db
  return db;
}

/**
 * Безопасная проверка наличия метода
 */
function hasMethod(store, methodName) {
  // Проверяем через прямой доступ
  if (isFunction(store[methodName])) {
    return true;
  }

  // Проверяем через публичный символ
  try {
    const symbol = Symbol.for(`broker.${methodName}`);
    if (store[symbol] && isFunction(store[symbol])) {
      return true;
    }
  } catch (e) {
    // Игнорируем
  }

  // Проверяем через _store (если это прокси)
  if (store._store && isFunction(store._store[methodName])) {
    return true;
  }

  return false;
}

/**
 * Безопасное выполнение метода
 */
function safeCallMethod(store, methodName, ...args) {
  // Прямой вызов
  if (isFunction(store[methodName])) {
    return store[methodName](...args);
  }

  // Через символ
  try {
    const symbol = Symbol.for(`broker.${methodName}`);
    if (store[symbol] && isFunction(store[symbol])) {
      return store[symbol](...args);
    }
  } catch (e) {
    // Игнорируем
  }

  // Через _store
  if (store._store && isFunction(store._store[methodName])) {
    return store._store[methodName](...args);
  }

  throw new Error(`Метод ${methodName} не найден`);
}

// ============================================================
// 3. КОНСТАНТЫ
// ============================================================

// Системные топики
const SYSTEM_TOPICS = [
  'system:startup',
  'system:shutdown',
  'system:error',
  'system:warning',
  'system:info',
  'system:health',
  'system:config',
  'system:plugins',
  'system:tables',
  'system:records',
  'broker:published',
  'broker:delivered',
  'broker:failed',
  'broker:retried',
  'broker:rateLimited',
  'broker:deadLetter',
  'broker:subscribed',
  'broker:unsubscribed',
];

// Предопределенные топики для быстрого выбора
const PRESET_TOPICS = [
  'user:created',
  'user:updated',
  'user:deleted',
  'user:login',
  'user:logout',
  'data:insert',
  'data:update',
  'data:delete',
  'data:clear',
  'table:create',
  'table:drop',
  'table:rename',
  'transaction:begin',
  'transaction:commit',
  'transaction:rollback',
  'relation:link',
  'relation:unlink',
  'master:select',
  'plugin:registered',
  'plugin:unregistered',
  'cache:hit',
  'cache:miss',
  'cache:evict',
  'cache:clear',
  'audit:entry',
  'audit:clear',
  'quota:warning',
  'quota:critical',
  'quota:violation',
];

// ============================================================
// 4. ОСНОВНЫЕ ФУНКЦИИ УПРАВЛЕНИЯ БРОКЕРОМ
// ============================================================

/**
 * Публикация сообщения в брокер
 * 100% символы — полная изоляция
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function publishMessage() {
  try {
    // ★★★ ПОЛУЧАЕМ ХРАНИЛИЩЕ ★★★
    const store = getStore();

    const topic = DOM.brokerTopic?.value?.trim() || '';
    const dataInput = DOM.brokerData?.value || '{}';

    if (!topic) {
      showAlertInModal('⚠️ Ошибка', 'Введите топик для публикации.', 'warning');
      return;
    }

    // Парсинг данных
    let data;
    try {
      data = JSON.parse(dataInput);
    } catch {
      data = { message: dataInput, timestamp: Date.now() };
    }

    // ★★★ ПРОВЕРКА НАЛИЧИЯ МЕТОДА ★★★
    if (!hasMethod(store, 'publish')) {
      showAlertInModal(
          '⚠️ Ошибка',
          'Метод publish не доступен. Убедитесь, что плагин BrokerPlugin зарегистрирован.\n\n' +
          '💡 Проверьте:\n' +
          '1. Брокер-плагин загружен\n' +
          '2. Метод publish доступен в store\n' +
          '3. Используйте window.__globalStore для доступа',
          'error'
      );
      return;
    }

    // Добавляем метаданные к сообщению
    const enrichedData = {
      ...data,
      _meta: {
        publishedAt: Date.now(),
        source: 'admin-panel',
        topic: topic,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      },
    };

    // ★★★ ПУБЛИКАЦИЯ ЧЕРЕЗ БЕЗОПАСНЫЙ ВЫЗОВ ★★★
    const result = safeCallMethod(store, 'publish', topic, enrichedData);

    // Обновляем состояние
    const state = getAppState();
    const messages = state[PRIVATE.MESSAGES] || [];
    messages.unshift({
      topic,
      data: enrichedData,
      timestamp: Date.now(),
      id: enrichedData._meta.id,
      delivered: result !== null,
    });

    // Ограничиваем количество сообщений
    if (messages.length > CONFIG.maxMessages || 100) {
      messages.length = Math.min(messages.length, 100);
    }

    state[PRIVATE.MESSAGES] = messages;
    state[PRIVATE.MESSAGE_COUNT] = messages.length;

    // Обновляем UI
    renderMessages();

    // Логируем
    addLog(`📨 Сообщение опубликовано: ${topic}`, 'success', {
      id: enrichedData._meta.id,
      dataSize: JSON.stringify(enrichedData).length,
    });

    // Визуальный отклик
    if (DOM.publishBtn) {
      DOM.publishBtn.textContent = '✅ Опубликовано!';
      setTimeout(() => {
        DOM.publishBtn.textContent = '📨 Опубликовать';
      }, 1500);
    }

    showAlertInModal('✅ Опубликовано', `Сообщение отправлено в топик "${topic}"`, 'success');
  } catch (error) {
    console.error('❌ Ошибка публикации:', error);
    showAlertInModal('❌ Ошибка', `Не удалось опубликовать сообщение: ${error.message}`, 'error');
    addLog(`❌ Ошибка публикации: ${error.message}`, 'error');
  }
}

/**
 * Создание подписки на топик
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function addSubscription() {
  try {
    const store = getStore();

    // Показываем модальное окно для создания подписки
    const formHtml = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-group">
          <label>Топик для подписки *</label>
          <input type="text" id="subscriptionTopic" placeholder="user:created" value="test:*">
          <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            Используйте * для wildcard (например, user:*, system:*)
          </div>
        </div>

        <div class="form-group">
          <label>Опции подписки</label>
          <div style="display:flex;flex-wrap:wrap;gap:12px;padding:4px 0;">
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--es-text-muted);">
              <input type="checkbox" id="subscriptionOnce"> Только один раз
            </label>
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--es-text-muted);">
              <input type="checkbox" id="subscriptionLog"> Логировать сообщения
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Фильтр (опционально)</label>
          <input type="text" id="subscriptionFilter" placeholder='{"type": "event"}'>
          <div style="font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            JSON-объект для фильтрации сообщений
          </div>
        </div>

        <div style="margin-top:4px;padding:8px;background:var(--es-bg-primary);border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">
            💡 Предопределенные топики:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
            ${PRESET_TOPICS.slice(0, 12)
        .map(
            t => `
              <span style="font-size:10px;color:var(--es-accent-blue-light);background:var(--es-bg-secondary);padding:1px 8px;border-radius:10px;cursor:pointer;border:1px solid var(--es-border-primary);" onclick="document.getElementById('subscriptionTopic').value='${t}'">
                ${t}
              </span>
            `
        )
        .join('')}
          </div>
        </div>
      </div>
    `;

    showModal(
        '📡 Создать подписку',
        formHtml,
        data => {
          const topic = data.subscriptionTopic?.trim();
          if (!topic) {
            showAlertInModal('⚠️ Ошибка', 'Введите топик для подписки.', 'warning');
            return;
          }

          const once = data.subscriptionOnce === 'on' || data.subscriptionOnce === true;
          const logMessages = data.subscriptionLog === 'on' || data.subscriptionLog === true;
          let filter = null;

          if (data.subscriptionFilter) {
            try {
              filter = JSON.parse(data.subscriptionFilter);
            } catch (error) {
              showAlertInModal('⚠️ Ошибка', `Неверный формат фильтра: ${error.message}`, 'warning');
              return;
            }
          }

          // ★★★ ПРОВЕРКА НАЛИЧИЯ МЕТОДА ★★★
          if (!hasMethod(store, 'subscribe')) {
            showAlertInModal(
                '⚠️ Ошибка',
                'Метод subscribe не доступен. Убедитесь, что плагин BrokerPlugin зарегистрирован.',
                'error'
            );
            return;
          }

          // Создаем подписку
          const callback = (messageData, message) => {
            // Логируем полученное сообщение
            if (logMessages) {
              addLog(`📨 Получено сообщение из ${topic}`, 'info', {
                data: messageData,
                id: message?.id,
              });
            }

            // Сохраняем в историю сообщений
            const state = getAppState();
            const messages = state[PRIVATE.MESSAGES] || [];
            messages.unshift({
              topic,
              data: messageData,
              timestamp: Date.now(),
              id: message?.id || `msg_${Date.now()}`,
              delivered: true,
            });

            if (messages.length > 100) {
              messages.length = 100;
            }

            state[PRIVATE.MESSAGES] = messages;
            state[PRIVATE.MESSAGE_COUNT] = messages.length;

            // Обновляем UI
            renderMessages();

            // Показываем уведомление (если не отключено)
            if (logMessages) {
              showAlertInModal('📨 Сообщение', `Получено сообщение из топика "${topic}"`, 'info');
            }
          };

          // ★★★ РЕГИСТРИРУЕМ ПОДПИСКУ ★★★
          let subscriptionId;
          try {
            subscriptionId = safeCallMethod(store, 'subscribe', topic, callback, { once, filter });
          } catch (error) {
            showAlertInModal('❌ Ошибка', `Не удалось создать подписку: ${error.message}`, 'error');
            return;
          }

          if (subscriptionId) {
            // Сохраняем подписку в состоянии
            const state = getAppState();
            const subscriptions = state[PRIVATE.SUBSCRIPTIONS] || [];
            subscriptions.push({
              id: subscriptionId,
              topic,
              once,
              filter,
              created: Date.now(),
            });
            state[PRIVATE.SUBSCRIPTIONS] = subscriptions;

            // Обновляем UI
            renderSubscriptions();

            addLog(`📡 Подписка создана: ${topic} (ID: ${subscriptionId})`, 'success');
            showAlertInModal(
                '✅ Подписка создана',
                `Подписка на топик "${topic}" успешно создана.\nID: ${subscriptionId}`,
                'success'
            );
          } else {
            showAlertInModal(
                '❌ Ошибка',
                'Не удалось создать подписку. Проверьте консоль для деталей.',
                'error'
            );
          }
        },
        () => {
          addLog('❌ Создание подписки отменено', 'info');
        }
    );
  } catch (error) {
    console.error('❌ Ошибка создания подписки:', error);
    showAlertInModal('❌ Ошибка', `Не удалось создать подписку: ${error.message}`, 'error');
  }
}

/**
 * Удаление подписки
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function unsubscribe(subscriptionId) {
  try {
    const store = getStore();

    if (!subscriptionId) {
      showAlertInModal('⚠️ Ошибка', 'Не указан ID подписки.', 'warning');
      return;
    }

    // ★★★ ПРОВЕРКА НАЛИЧИЯ МЕТОДА ★★★
    if (!hasMethod(store, 'unsubscribe')) {
      showAlertInModal('⚠️ Ошибка', 'Метод unsubscribe не доступен.', 'error');
      return;
    }

    // ★★★ УДАЛЯЕМ ПОДПИСКУ ★★★
    const result = safeCallMethod(store, 'unsubscribe', subscriptionId);

    if (result !== false) {
      // Удаляем из состояния
      const state = getAppState();
      const subscriptions = state[PRIVATE.SUBSCRIPTIONS] || [];
      state[PRIVATE.SUBSCRIPTIONS] = subscriptions.filter(sub => sub.id !== subscriptionId);

      // Обновляем UI
      renderSubscriptions();

      addLog(`🗑 Подписка удалена: ${subscriptionId}`, 'info');
      showAlertInModal('🗑 Удалено', `Подписка ${subscriptionId} успешно удалена.`, 'success');
    } else {
      showAlertInModal('⚠️ Ошибка', `Не удалось удалить подписку ${subscriptionId}.`, 'error');
    }
  } catch (error) {
    console.error('❌ Ошибка удаления подписки:', error);
    showAlertInModal('❌ Ошибка', `Не удалось удалить подписку: ${error.message}`, 'error');
  }
}

/**
 * Очистка всех сообщений
 */
export function clearMessages() {
  try {
    const state = getAppState();
    const messages = state[PRIVATE.MESSAGES] || [];

    if (messages.length === 0) {
      showAlertInModal('📭 Пусто', 'Нет сообщений для очистки.', 'info');
      return;
    }

    showModal(
        '🧹 Очистка сообщений',
        `<p style="color:var(--es-text-muted);">Вы уверены, что хотите очистить <strong>все сообщения</strong>?</p>
       <p style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">Будет удалено ${messages.length} сообщений.</p>`,
        () => {
          state[PRIVATE.MESSAGES] = [];
          state[PRIVATE.MESSAGE_COUNT] = 0;
          renderMessages();
          addLog('🧹 Сообщения очищены', 'info');
          showAlertInModal('🧹 Очищено', 'Все сообщения успешно очищены.', 'success');
        },
        () => {
          addLog('ℹ️ Очистка сообщений отменена', 'info');
        }
    );
  } catch (error) {
    console.error('❌ Ошибка очистки сообщений:', error);
    showAlertInModal('❌ Ошибка', `Не удалось очистить сообщения: ${error.message}`, 'error');
  }
}

// ============================================================
// 5. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ УПРАВЛЕНИЯ БРОКЕРОМ
// ============================================================

/**
 * Получение статистики брокера
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function getBrokerStats() {
  try {
    const store = getStore();

    let stats = {};
    if (hasMethod(store, 'getBrokerStats')) {
      stats = safeCallMethod(store, 'getBrokerStats');
    } else if (store.broker && isFunction(store.broker.getStats)) {
      stats = store.broker.getStats();
    } else {
      const state = getAppState();
      stats = {
        messages: state[PRIVATE.MESSAGES]?.length || 0,
        subscriptions: state[PRIVATE.SUBSCRIPTIONS]?.length || 0,
        topics: [],
        published: 0,
        delivered: 0,
        failed: 0,
      };
    }

    return stats;
  } catch (error) {
    console.warn('⚠️ Ошибка получения статистики брокера:', error);
    return {
      messages: 0,
      subscriptions: 0,
      topics: [],
      published: 0,
      delivered: 0,
      failed: 0,
      error: error.message,
    };
  }
}

/**
 * Получение списка топиков
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function getTopics() {
  try {
    const store = getStore();

    if (hasMethod(store, 'getTopics')) {
      return safeCallMethod(store, 'getTopics');
    }
    if (store.broker && isFunction(store.broker.getTopics)) {
      return store.broker.getTopics();
    }

    // Извлекаем топики из сообщений
    const state = getAppState();
    const messages = state[PRIVATE.MESSAGES] || [];
    const topics = new Set();
    for (const msg of messages) {
      if (msg.topic) {
        topics.add(msg.topic);
      }
    }
    return Array.from(topics);
  } catch (error) {
    console.warn('⚠️ Ошибка получения топиков:', error);
    return [];
  }
}

/**
 * Получение подписчиков для топика
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function getSubscribers(topic) {
  try {
    const store = getStore();

    if (hasMethod(store, 'getSubscribers')) {
      return safeCallMethod(store, 'getSubscribers', topic);
    }
    if (store.broker && isFunction(store.broker.getSubscribers)) {
      return store.broker.getSubscribers(topic);
    }
    return [];
  } catch (error) {
    console.warn('⚠️ Ошибка получения подписчиков:', error);
    return [];
  }
}

/**
 * Получение Dead Letter Queue
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function getDeadLetter() {
  try {
    const store = getStore();

    if (hasMethod(store, 'getDeadLetter')) {
      return safeCallMethod(store, 'getDeadLetter');
    }
    if (store.broker && isFunction(store.broker.getDeadLetter)) {
      return store.broker.getDeadLetter();
    }
    return [];
  } catch (error) {
    console.warn('⚠️ Ошибка получения Dead Letter:', error);
    return [];
  }
}

/**
 * Очистка Dead Letter Queue
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function clearDeadLetter() {
  try {
    const store = getStore();

    if (hasMethod(store, 'clearDeadLetter')) {
      const result = safeCallMethod(store, 'clearDeadLetter');
      if (result !== false) {
        addLog('🧹 Dead Letter Queue очищена', 'info');
        showAlertInModal('🧹 Очищено', 'Dead Letter Queue успешно очищена.', 'success');
        return true;
      }
    }
    if (store.broker && isFunction(store.broker.clearDeadLetter)) {
      const result = store.broker.clearDeadLetter();
      if (result !== false) {
        addLog('🧹 Dead Letter Queue очищена', 'info');
        showAlertInModal('🧹 Очищено', 'Dead Letter Queue успешно очищена.', 'success');
        return true;
      }
    }

    showAlertInModal('⚠️ Ошибка', 'Метод clearDeadLetter не доступен.', 'error');
    return false;
  } catch (error) {
    console.error('❌ Ошибка очистки Dead Letter:', error);
    showAlertInModal('❌ Ошибка', `Не удалось очистить Dead Letter: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Обработка Retry Queue
 * ★★★ ИСПРАВЛЕНО: безопасный доступ через getStore() ★★★
 */
export function processRetryQueue() {
  try {
    const store = getStore();

    if (hasMethod(store, 'processRetry')) {
      const count = safeCallMethod(store, 'processRetry');
      if (count > 0) {
        addLog(`🔄 Обработано ${count} сообщений из Retry Queue`, 'success');
        showAlertInModal(
            '🔄 Обработано',
            `Успешно обработано ${count} сообщений из Retry Queue.`,
            'success'
        );
      } else {
        showAlertInModal('📭 Пусто', 'Retry Queue пуста.', 'info');
      }
      return count;
    }
    if (store.broker && isFunction(store.broker.processRetry)) {
      const count = store.broker.processRetry();
      if (count > 0) {
        addLog(`🔄 Обработано ${count} сообщений из Retry Queue`, 'success');
        showAlertInModal(
            '🔄 Обработано',
            `Успешно обработано ${count} сообщений из Retry Queue.`,
            'success'
        );
      } else {
        showAlertInModal('📭 Пусто', 'Retry Queue пуста.', 'info');
      }
      return count;
    }

    showAlertInModal('⚠️ Ошибка', 'Метод processRetry не доступен.', 'error');
    return 0;
  } catch (error) {
    console.error('❌ Ошибка обработки Retry Queue:', error);
    showAlertInModal('❌ Ошибка', `Не удалось обработать Retry Queue: ${error.message}`, 'error');
    return 0;
  }
}

// ============================================================
// 6. ПОКАЗ СТАТИСТИКИ БРОКЕРА
// ============================================================

/**
 * Показ статистики брокера в модальном окне
 */
export function showBrokerStats() {
  try {
    const stats = getBrokerStats();
    const topics = getTopics();
    const subscribers = getSubscribers('*');

    const html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">📨 Всего сообщений</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-blue-light);">${stats.messages || 0}</div>
        </div>
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">📡 Подписчиков</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-purple);">${stats.subscriptions || subscribers.length || 0}</div>
        </div>
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">📤 Опубликовано</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-green);">${stats.published || 0}</div>
        </div>
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">📥 Доставлено</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-blue-light);">${stats.delivered || 0}</div>
        </div>
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">❌ Ошибок</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-red);">${stats.failed || 0}</div>
        </div>
        <div style="background:var(--es-bg-primary);border-radius:6px;padding:8px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:11px;color:var(--es-text-muted);">📂 Топиков</div>
          <div style="font-size:20px;font-weight:700;color:var(--es-accent-yellow);">${topics.length}</div>
        </div>
      </div>

      <div style="margin-top:12px;padding:8px;background:var(--es-bg-primary);border-radius:6px;border:1px solid var(--es-border-secondary);">
        <div style="font-size:11px;color:var(--es-text-muted);margin-bottom:4px;">📋 Активные топики:</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${
        topics.length > 0
            ? topics
                .map(
                    t => `
            <span style="font-size:10px;color:var(--es-accent-blue-light);background:var(--es-bg-secondary);padding:1px 8px;border-radius:10px;border:1px solid var(--es-border-primary);">
              ${escapeHtml(t)}
            </span>
          `
                )
                .join('')
            : '<span style="font-size:11px;color:var(--es-text-dim);">Нет активных топиков</span>'
    }
        </div>
      </div>

      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="window.app?.refreshBrokerStats?.()">🔄 Обновить</button>
        <button class="btn btn-success btn-sm" onclick="window.app?.exportBrokerStats?.()">📤 Экспорт</button>
      </div>
    `;

    showModal(
        '📊 Статистика брокера',
        html,
        () => {},
        () => {}
    );
  } catch (error) {
    console.error('❌ Ошибка показа статистики:', error);
    showAlertInModal('❌ Ошибка', `Не удалось показать статистику: ${error.message}`, 'error');
  }
}

/**
 * Экспорт статистики брокера
 */
export function exportBrokerStats() {
  try {
    const stats = getBrokerStats();
    const topics = getTopics();
    const subscribers = getSubscribers('*');
    const deadLetter = getDeadLetter();

    const data = {
      exportedAt: Date.now(),
      version: CONFIG.version,
      build: CONFIG.build,
      stats: stats,
      topics: topics,
      subscribers: subscribers,
      deadLetterCount: deadLetter.length,
      deadLetter: deadLetter.slice(0, 10), // Только первые 10
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broker_stats_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showAlertInModal('📤 Экспорт', 'Статистика брокера успешно экспортирована.', 'success');
  } catch (error) {
    console.error('❌ Ошибка экспорта:', error);
    showAlertInModal(
        '❌ Ошибка',
        `Не удалось экспортировать статистику: ${error.message}`,
        'error'
    );
  }
}

// ============================================================
// 7. ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
// ============================================================

/**
 * Инициализация обработчиков для брокера
 */
export function initBrokerHandlers() {
  // Кнопка публикации
  if (DOM.publishBtn) {
    DOM.publishBtn.addEventListener('click', publishMessage);
  }

  // Кнопка добавления подписки
  if (DOM.addSubscriptionBtn) {
    DOM.addSubscriptionBtn.addEventListener('click', addSubscription);
  }

  // Кнопка очистки сообщений
  if (DOM.clearMessagesBtn) {
    DOM.clearMessagesBtn.addEventListener('click', clearMessages);
  }

  // Enter в поле топика для быстрой публикации
  if (DOM.brokerTopic) {
    DOM.brokerTopic.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        DOM.brokerData?.focus();
      }
    });
  }

  // Ctrl+Enter в поле данных для публикации
  if (DOM.brokerData) {
    DOM.brokerData.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        publishMessage();
      }
    });
  }

  // Добавляем кнопку статистики в UI
  const statsBtn = document.createElement('button');
  statsBtn.className = 'btn btn-secondary btn-xs';
  statsBtn.textContent = '📊 Статистика';
  statsBtn.title = 'Показать статистику брокера';
  statsBtn.addEventListener('click', showBrokerStats);

  const headerActions =
      document.querySelector('.broker-grid .panel:first-child .panel-header div:last-child') ||
      document.querySelector('.broker-grid .panel:first-child .panel-header > div:last-child');

  if (headerActions) {
    headerActions.appendChild(statsBtn);
  }

  // Добавляем кнопку очистки Dead Letter
  const dlqBtn = document.createElement('button');
  dlqBtn.className = 'btn btn-danger btn-xs';
  dlqBtn.textContent = '🧹 DLQ';
  dlqBtn.title = 'Очистить Dead Letter Queue';
  dlqBtn.addEventListener('click', () => {
    clearDeadLetter();
  });

  if (headerActions) {
    headerActions.appendChild(dlqBtn);
  }

  // Горячие клавиши
  document.addEventListener('keydown', e => {
    // Ctrl+Shift+P — публикация сообщения
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      publishMessage();
    }

    // Ctrl+Shift+S — показать статистику
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      showBrokerStats();
    }
  });
}

// ============================================================
// 8. ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.publishMessage = publishMessage;
  window.app.addSubscription = addSubscription;
  window.app.unsubscribe = unsubscribe;
  window.app.clearMessages = clearMessages;
  window.app.getBrokerStats = getBrokerStats;
  window.app.getTopics = getTopics;
  window.app.getSubscribers = getSubscribers;
  window.app.getDeadLetter = getDeadLetter;
  window.app.clearDeadLetter = clearDeadLetter;
  window.app.processRetryQueue = processRetryQueue;
  window.app.showBrokerStats = showBrokerStats;
  window.app.exportBrokerStats = exportBrokerStats;

  console.log('📋 Команды для брокера:');
  console.log('  window.app.publishMessage() — опубликовать сообщение');
  console.log('  window.app.addSubscription() — создать подписку');
  console.log('  window.app.unsubscribe(id) — удалить подписку');
  console.log('  window.app.clearMessages() — очистить сообщения');
  console.log('  window.app.getBrokerStats() — статистика брокера');
  console.log('  window.app.getTopics() — список топиков');
  console.log('  window.app.getSubscribers(topic) — подписчики топика');
  console.log('  window.app.getDeadLetter() — Dead Letter Queue');
  console.log('  window.app.clearDeadLetter() — очистить DLQ');
  console.log('  window.app.processRetryQueue() — обработать Retry');
  console.log('  window.app.showBrokerStats() — показать статистику');
  console.log('  window.app.exportBrokerStats() — экспорт статистики');
}

// ============================================================
// 9. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  publishMessage,
  addSubscription,
  unsubscribe,
  clearMessages,
  getBrokerStats,
  getTopics,
  getSubscribers,
  getDeadLetter,
  clearDeadLetter,
  processRetryQueue,
  showBrokerStats,
  exportBrokerStats,
  initBrokerHandlers,
};
