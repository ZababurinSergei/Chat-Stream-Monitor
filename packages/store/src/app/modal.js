// ============================================================
// app/modal.js — 100% СИМВОЛЫ — модальное окно
// Версия: 4.0.8 (ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ)
// ============================================================

import { DOM } from './dom.js';
import { PRIVATE } from './symbols.js';
import {
  getAppState,
  setPrivate,
  getPrivate,
  setModalActive,
  setModalCallback,
  setModalData,
  isModalActive,
  getModalCallback,
  getModalData,
} from './state.js';
import { escapeHtml, isFunction, safeCall } from './utils.js';
import { addLog } from './logger.js';

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const MODAL_PRIVATE = {
  // Основные символы состояния
  IS_OPEN: Symbol('modal.isOpen'),
  TITLE: Symbol('modal.title'),
  BODY: Symbol('modal.body'),
  CONFIRM_CALLBACK: Symbol('modal.confirmCallback'),
  CANCEL_CALLBACK: Symbol('modal.cancelCallback'),
  DATA: Symbol('modal.data'),
  TIMEOUT_ID: Symbol('modal.timeoutId'),
  Z_INDEX: Symbol('modal.zIndex'),
  STACK: Symbol('modal.stack'),
  HISTORY: Symbol('modal.history'),
  LOCKED: Symbol('modal.locked'),
  PREVIOUS_FOCUS: Symbol('modal.previousFocus'),
  SCROLL_LOCK: Symbol('modal.scrollLock'),
  CONFIRM_TEXT: Symbol('modal.confirmText'),
  CANCEL_TEXT: Symbol('modal.cancelText'),
  BUTTONS_VISIBLE: Symbol('modal.buttonsVisible'),
  IS_TRANSITIONING: Symbol('modal.isTransitioning'),
  CONFIRM_ACTION: Symbol('modal.confirmAction'),
  CANCEL_ACTION: Symbol('modal.cancelAction'),
  IS_ALERT: Symbol('modal.isAlert'),
  CUSTOM_BUTTONS: Symbol('modal.customButtons'),
  OVERLAY_CLICK_HANDLER: Symbol('modal.overlayClickHandler'),
  KEYDOWN_HANDLER: Symbol('modal.keydownHandler'),
  ANIMATION_FRAME: Symbol('modal.animationFrame'),
  RESIZE_OBSERVER: Symbol('modal.resizeObserver'),
  MODAL_TYPE: Symbol('modal.type'),
  MODAL_RESULT: Symbol('modal.result'),
  FOCUSABLE_ELEMENTS: Symbol('modal.focusableElements'),
  KEYBOARD_TRAP: Symbol('modal.keyboardTrap'),
  THEME: Symbol('modal.theme'),
  TRANSITION: Symbol('modal.transition'),
  CUSTOM_CLASSES: Symbol('modal.customClasses'),
  BUTTONS_CREATED: Symbol('modal.buttonsCreated'),
  IS_UPDATING: Symbol('modal.isUpdating'),
  CONFIRM_BTN_HANDLER: Symbol('modal.confirmBtnHandler'),
  CANCEL_BTN_HANDLER: Symbol('modal.cancelBtnHandler'),
  CLOSE_BTN_HANDLER: Symbol('modal.closeBtnHandler'),
  OVERLAY_HANDLER: Symbol('modal.overlayHandler'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

export const MODAL_PUBLIC = {
  INSTANCE: Symbol.for('modal.instance'),
  STATE: Symbol.for('modal.state'),
  CONFIG: Symbol.for('modal.config'),
  SHOW: Symbol.for('modal.show'),
  CLOSE: Symbol.for('modal.close'),
  TOGGLE: Symbol.for('modal.toggle'),
  UPDATE: Symbol.for('modal.update'),
  IS_OPEN: Symbol.for('modal.isOpen'),
  GET_STATE: Symbol.for('modal.getState'),
  SET_CONFIG: Symbol.for('modal.setConfig'),
  ON_OPEN: Symbol.for('modal.onOpen'),
  ON_CLOSE: Symbol.for('modal.onClose'),
  ON_CONFIRM: Symbol.for('modal.onConfirm'),
  ON_CANCEL: Symbol.for('modal.onCancel'),
  SET_TITLE: Symbol.for('modal.setTitle'),
  SET_BODY: Symbol.for('modal.setBody'),
  SET_BUTTONS: Symbol.for('modal.setButtons'),
  SHOW_ALERT: Symbol.for('modal.showAlert'),
  SHOW_CONFIRM: Symbol.for('modal.showConfirm'),
  SHOW_FORM: Symbol.for('modal.showForm'),
  SHOW_SELECT: Symbol.for('modal.showSelect'),
  SHOW_EDIT: Symbol.for('modal.showEdit'),
  SHOW_WELCOME: Symbol.for('modal.showWelcome'),
  SHOW_TIMED: Symbol.for('modal.showTimed'),
  GET_HISTORY: Symbol.for('modal.getHistory'),
  CLEAR_HISTORY: Symbol.for('modal.clearHistory'),
  LOCK: Symbol.for('modal.lock'),
  UNLOCK: Symbol.for('modal.unlock'),
  IS_LOCKED: Symbol.for('modal.isLocked'),
  WITH_ACTIONS: Symbol.for('modal.withActions'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ МОДАЛЬНОГО ОКНА
// ============================================================

export const MODAL_CONFIG = {
  version: '4.0.8',
  build: '2026-07-28',
  name: 'Modal System',
  debug: true,
  defaultTitle: 'Модальное окно',
  defaultConfirmText: 'Подтвердить',
  defaultCancelText: 'Отмена',
  closeOnEsc: true,
  closeOnOverlay: true,
  closeOnConfirm: true,
  animationDuration: 200,
  maxWidth: '600px',
  zIndex: 999999,
  scrollLock: true,
  focusTrap: true,
  restoreFocus: true,
  stackEnabled: true,
  historyEnabled: true,
  preventBodyScroll: true,
  ariaEnabled: true,
  closeOnButtonClick: true,
  pauseOnHover: false,
  disableAnimation: false,
  maxHistorySize: 100,
  maxStackSize: 50,
};

// ============================================================
// 4. СОСТОЯНИЕ МОДАЛЬНОГО ОКНА
// ============================================================

const MODAL_STATE = {
  [MODAL_PRIVATE.IS_OPEN]: false,
  [MODAL_PRIVATE.TITLE]: '',
  [MODAL_PRIVATE.BODY]: '',
  [MODAL_PRIVATE.CONFIRM_CALLBACK]: null,
  [MODAL_PRIVATE.CANCEL_CALLBACK]: null,
  [MODAL_PRIVATE.DATA]: null,
  [MODAL_PRIVATE.TIMEOUT_ID]: null,
  [MODAL_PRIVATE.Z_INDEX]: MODAL_CONFIG.zIndex,
  [MODAL_PRIVATE.STACK]: [],
  [MODAL_PRIVATE.HISTORY]: [],
  [MODAL_PRIVATE.LOCKED]: false,
  [MODAL_PRIVATE.PREVIOUS_FOCUS]: null,
  [MODAL_PRIVATE.SCROLL_LOCK]: false,
  [MODAL_PRIVATE.CONFIRM_TEXT]: MODAL_CONFIG.defaultConfirmText,
  [MODAL_PRIVATE.CANCEL_TEXT]: MODAL_CONFIG.defaultCancelText,
  [MODAL_PRIVATE.BUTTONS_VISIBLE]: true,
  [MODAL_PRIVATE.IS_TRANSITIONING]: false,
  [MODAL_PRIVATE.CONFIRM_ACTION]: null,
  [MODAL_PRIVATE.CANCEL_ACTION]: null,
  [MODAL_PRIVATE.IS_ALERT]: false,
  [MODAL_PRIVATE.CUSTOM_BUTTONS]: false,
  [MODAL_PRIVATE.OVERLAY_CLICK_HANDLER]: null,
  [MODAL_PRIVATE.KEYDOWN_HANDLER]: null,
  [MODAL_PRIVATE.ANIMATION_FRAME]: null,
  [MODAL_PRIVATE.RESIZE_OBSERVER]: null,
  [MODAL_PRIVATE.MODAL_TYPE]: null,
  [MODAL_PRIVATE.MODAL_RESULT]: null,
  [MODAL_PRIVATE.FOCUSABLE_ELEMENTS]: [],
  [MODAL_PRIVATE.KEYBOARD_TRAP]: true,
  [MODAL_PRIVATE.THEME]: 'dark',
  [MODAL_PRIVATE.TRANSITION]: 'fade',
  [MODAL_PRIVATE.CUSTOM_CLASSES]: [],
  [MODAL_PRIVATE.BUTTONS_CREATED]: false,
  [MODAL_PRIVATE.IS_UPDATING]: false,
  [MODAL_PRIVATE.CONFIRM_BTN_HANDLER]: null,
  [MODAL_PRIVATE.CANCEL_BTN_HANDLER]: null,
  [MODAL_PRIVATE.CLOSE_BTN_HANDLER]: null,
  [MODAL_PRIVATE.OVERLAY_HANDLER]: null,
};

// ============================================================
// 5. ★★★ ГЛОБАЛЬНЫЕ ФЛАГИ ДЛЯ ALERT ★★★
// ============================================================

let alertHandlersAttached = false;
let alertHandlerTimer = null;
let welcomeModalShown = false;

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function getModalState() {
  return MODAL_STATE;
}

function getModalPrivate(key) {
  return MODAL_STATE[key];
}

function setModalPrivate(key, value) {
  MODAL_STATE[key] = value;
  return value;
}

export function isModalOpen() {
  return getModalPrivate(MODAL_PRIVATE.IS_OPEN);
}

export function getModalHistory(limit = 10) {
  const history = getModalPrivate(MODAL_PRIVATE.HISTORY);
  return history.slice(-Math.min(limit, history.length));
}

export function clearModalHistory() {
  setModalPrivate(MODAL_PRIVATE.HISTORY, []);
  return true;
}

export function lockModal() {
  setModalPrivate(MODAL_PRIVATE.LOCKED, true);
  addLog('🔒 Модальное окно заблокировано', 'info');
  return true;
}

export function unlockModal() {
  setModalPrivate(MODAL_PRIVATE.LOCKED, false);
  addLog('🔓 Модальное окно разблокировано', 'info');
  return true;
}

export function isModalLocked() {
  return getModalPrivate(MODAL_PRIVATE.LOCKED);
}

// ============================================================
// 7. ★★★ ПОСТРОЕНИЕ HTML ДЛЯ ALERT ★★★
// ============================================================

function buildAlertHTML(title, message, onConfirm, onCancel) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 4px;">
      <div style="font-size:48px;">ℹ️</div>
      <div style="font-size:16px;font-weight:500;color:var(--es-accent-blue-light);text-align:center;">
        ${escapeHtml(title)}
      </div>
      <div style="font-size:13px;color:var(--es-text-muted);text-align:center;max-width:500px;line-height:1.6;white-space:pre-wrap;">
        ${escapeHtml(message)}
      </div>
      ${(onConfirm || onCancel) ? `
        <div style="display:flex;gap:8px;margin-top:8px;">
          ${onCancel ? `<button class="btn btn-secondary" id="modalAlertCancelBtn">${escapeHtml(MODAL_CONFIG.defaultCancelText)}</button>` : ''}
          ${onConfirm ? `<button class="btn btn-primary" id="modalAlertConfirmBtn">${escapeHtml(MODAL_CONFIG.defaultConfirmText)}</button>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// 8. ★★★ ПРИВЯЗКА ОБРАБОТЧИКОВ ДЛЯ ALERT ★★★
// ============================================================

function attachAlertHandlers(onConfirm, onCancel) {
  // Защита от повторной привязки
  if (alertHandlersAttached) {
    console.log('⚠️ [Modal] Обработчики уже привязаны, пропускаем');
    return;
  }

  console.log('🔘 [Modal] Привязка обработчиков для alert');

  const confirmBtn = document.getElementById('modalAlertConfirmBtn');
  const cancelBtn = document.getElementById('modalAlertCancelBtn');

  let attached = 0;

  // Привязка кнопки подтверждения
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🔘 [Modal] Нажата кнопка Подтвердить (alert)');

      // Отключаем обработчики, чтобы не было повторов
      detachAlertHandlers();

      // Выполняем действие
      if (isFunction(onConfirm)) {
        try {
          onConfirm();
          addLog(`✅ Выполнено действие`, 'success');
        } catch (error) {
          console.error('❌ [Modal] Ошибка в onConfirm:', error);
          addLog(`❌ Ошибка в действии: ${error.message}`, 'error');
        }
      }
      closeModal(true);
    });

    console.log('✅ [Modal] confirmBtn обработан');
    attached++;
  } else {
    console.warn('⚠️ [Modal] confirmBtn не найден в DOM');
  }

  // Привязка кнопки отмены
  if (cancelBtn) {
    const newBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🔘 [Modal] Нажата кнопка Отмена (alert)');

      // Отключаем обработчики, чтобы не было повторов
      detachAlertHandlers();

      // Выполняем действие
      if (isFunction(onCancel)) {
        try {
          onCancel();
          addLog(`ℹ️ Действие отменено`, 'info');
        } catch (error) {
          console.error('❌ [Modal] Ошибка в onCancel:', error);
          addLog(`❌ Ошибка при отмене: ${error.message}`, 'error');
        }
      }
      closeModal(false);
    });

    console.log('✅ [Modal] cancelBtn обработан');
    attached++;
  } else {
    console.warn('⚠️ [Modal] cancelBtn не найден в DOM');
  }

  if (attached > 0) {
    alertHandlersAttached = true;
    console.log(`✅ [Modal] Привязано ${attached} обработчиков`);
  }
}

// ============================================================
// 9. ★★★ ОТКЛЮЧЕНИЕ ОБРАБОТЧИКОВ ДЛЯ ALERT ★★★
// ============================================================

function detachAlertHandlers() {
  console.log('🔘 [Modal] Отключение обработчиков для alert');

  // Сбрасываем флаг
  alertHandlersAttached = false;

  const confirmBtn = document.getElementById('modalAlertConfirmBtn');
  const cancelBtn = document.getElementById('modalAlertCancelBtn');

  // Удаляем обработчики через clone
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    console.log('✅ [Modal] confirmBtn обработчики удалены');
  }

  if (cancelBtn) {
    const newBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
    console.log('✅ [Modal] cancelBtn обработчики удалены');
  }

  // Очищаем таймер
  if (alertHandlerTimer) {
    clearTimeout(alertHandlerTimer);
    alertHandlerTimer = null;
  }
}

// ============================================================
// 10. ★★★ ПОКАЗ ALERT В МОДАЛКЕ ★★★
// ============================================================

export function showAlertInModal(title, message, onConfirm = null, onCancel = null) {
  console.log('📋 [Modal] showAlertInModal:', {
    title,
    message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    hasConfirm: !!onConfirm,
    hasCancel: !!onCancel
  });

  // Защита: если модалка уже открыта, обновляем содержимое
  if (isModalActive()) {
    console.warn('⚠️ [Modal] Модалка уже активна, обновляем содержимое');
    if (DOM.modalBody) {
      DOM.modalBody.innerHTML = buildAlertHTML(title, message, onConfirm, onCancel);
    }
    // Перепривязываем обработчики
    if (alertHandlerTimer) {
      clearTimeout(alertHandlerTimer);
    }
    alertHandlerTimer = setTimeout(() => {
      attachAlertHandlers(onConfirm, onCancel);
      alertHandlerTimer = null;
    }, 50);
    return;
  }

  const bodyHtml = buildAlertHTML(title, message, onConfirm, onCancel);

  // Сохраняем действия
  setModalPrivate(MODAL_PRIVATE.CONFIRM_ACTION, onConfirm);
  setModalPrivate(MODAL_PRIVATE.CANCEL_ACTION, onCancel);
  setModalPrivate(MODAL_PRIVATE.IS_ALERT, true);
  setModalPrivate(MODAL_PRIVATE.CUSTOM_BUTTONS, !!(onConfirm || onCancel));

  // Обертка для callback с отключением обработчиков
  const wrappedCallback = (result) => {
    console.log('📋 [Modal] wrappedCallback с результатом:', result);
    detachAlertHandlers();

    if (result === true && isFunction(onConfirm)) {
      try {
        onConfirm();
        addLog(`✅ Выполнено действие: ${title}`, 'success');
      } catch (error) {
        console.error('❌ [Modal] Ошибка в onConfirm:', error);
        addLog(`❌ Ошибка в действии: ${error.message}`, 'error');
      }
    } else if (result === false && isFunction(onCancel)) {
      try {
        onCancel();
        addLog(`ℹ️ Действие отменено: ${title}`, 'info');
      } catch (error) {
        console.error('❌ [Modal] Ошибка в onCancel:', error);
        addLog(`❌ Ошибка при отмене: ${error.message}`, 'error');
      }
    }
    closeModal(result);
  };

  const wrappedCancel = () => {
    console.log('ℹ️ [Modal] wrappedCancel вызван');
    detachAlertHandlers();

    if (isFunction(onCancel)) {
      try {
        onCancel();
        addLog(`ℹ️ Действие отменено: ${title}`, 'info');
      } catch (error) {
        console.error('❌ [Modal] Ошибка в onCancel:', error);
        addLog(`❌ Ошибка при отмене: ${error.message}`, 'error');
      }
    }
    closeModal(false);
  };

  // Показываем модалку
  showModal(title, bodyHtml, wrappedCallback, wrappedCancel);

  // Привязываем обработчики с небольшой задержкой для гарантии DOM
  if (alertHandlerTimer) {
    clearTimeout(alertHandlerTimer);
  }
  alertHandlerTimer = setTimeout(() => {
    attachAlertHandlers(onConfirm, onCancel);
    alertHandlerTimer = null;
  }, 100);
}

// ============================================================
// 11. ★★★ ПРИВЕТСТВЕННОЕ МОДАЛЬНОЕ ОКНО ★★★
// ============================================================

export function showWelcomeModal() {
  // Защита от повторного показа
  if (welcomeModalShown) {
    console.log('⚠️ [Modal] Приветственное окно уже было показано');
    return;
  }

  // Защита, если уже открыто
  if (isModalActive()) {
    console.log('⚠️ [Modal] Модальное окно уже активно, пропускаем показ приветственного');
    return;
  }

  const welcomeHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:4px;">
      <div style="text-align:center;font-size:42px;">🏢</div>
      <div style="font-size:18px;font-weight:600;color:var(--es-text-secondary);text-align:center;">
        Добро пожаловать в Global Store Admin
      </div>
      <div style="font-size:13px;color:var(--es-text-muted);line-height:1.8;text-align:center;max-width:500px;margin:0 auto;">
        Это административная панель для управления <strong>Enterprise Store</strong> — 
        реактивным хранилищем данных с полной изоляцией через <strong>100% символы</strong>.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-secondary);">
          <div style="font-size:20px;">📊</div>
          <div style="font-size:11px;color:var(--es-text-muted);">Управление таблицами</div>
          <div style="font-size:10px;color:var(--es-text-dim);">Создавайте, редактируйте, удаляйте</div>
        </div>
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-secondary);">
          <div style="font-size:20px;">🔗</div>
          <div style="font-size:11px;color:var(--es-text-muted);">Связи Master-Detail</div>
          <div style="font-size:10px;color:var(--es-text-dim);">Автоматические связи между таблицами</div>
        </div>
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-secondary);">
          <div style="font-size:20px;">📨</div>
          <div style="font-size:11px;color:var(--es-text-muted);">Брокер сообщений</div>
          <div style="font-size:10px;color:var(--es-text-dim);">Публикация и подписка на события</div>
        </div>
        <div style="background:var(--es-bg-tertiary);border-radius:6px;padding:10px;text-align:center;border:1px solid var(--es-border-secondary);">
          <div style="font-size:20px;">🔑</div>
          <div style="font-size:11px;color:var(--es-text-muted);">100% Символы</div>
          <div style="font-size:10px;color:var(--es-text-dim);">Полная изоляция и безопасность</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--es-text-dim);text-align:center;margin-top:4px;">
        Версия ${window._appConfig?.version || '4.0.8'} • Immer ${window._appConfig?.immerEnabled ? '✅' : '❌'}
      </div>
    </div>
  `;

  // Устанавливаем флаг, что окно было показано
  welcomeModalShown = true;

  showModal(
    '🏢 Global Store Admin',
    welcomeHtml,
    () => {
      addLog('✅ Приветственное окно закрыто', 'success');
      closeModal(true);
    },
    () => {
      addLog('ℹ️ Приветственное окно закрыто', 'info');
      closeModal(null);
    }
  );
}

// ★★★ СБРОС ФЛАГА ПРИВЕТСТВЕННОГО ОКНА ★★★
export function resetWelcomeModalFlag() {
  welcomeModalShown = false;
  alertHandlersAttached = false;
  if (alertHandlerTimer) {
    clearTimeout(alertHandlerTimer);
    alertHandlerTimer = null;
  }
  console.log('🔄 [Modal] Флаги приветственного окна сброшены');
}

// ============================================================
// 12. ОСНОВНЫЕ ФУНКЦИИ МОДАЛЬНОГО ОКНА
// ============================================================

export function showModal(title, bodyHtml, onConfirm, onCancel = null) {
  // Проверка на блокировку
  if (getModalPrivate(MODAL_PRIVATE.LOCKED)) {
    addLog('⚠️ Модальное окно заблокировано', 'warn');
    return;
  }

  // Если уже открыто - обновляем содержимое
  if (getModalPrivate(MODAL_PRIVATE.IS_OPEN)) {
    addLog('⚠️ Модальное окно уже открыто, обновляем содержимое', 'warn');
    DOM.modalTitle.textContent = title;
    DOM.modalBody.innerHTML = bodyHtml;
    setModalCallback(onConfirm);
    setModalData({ onCancel });
    setModalPrivate(MODAL_PRIVATE.CONFIRM_CALLBACK, onConfirm);
    setModalPrivate(MODAL_PRIVATE.CANCEL_CALLBACK, onCancel);
    setModalPrivate(MODAL_PRIVATE.IS_UPDATING, true);
    return;
  }

  // Сохраняем предыдущий фокус
  if (MODAL_CONFIG.restoreFocus && document.activeElement) {
    setModalPrivate(MODAL_PRIVATE.PREVIOUS_FOCUS, document.activeElement);
  }

  // Сохраняем состояние
  setModalCallback(onConfirm);
  setModalData({ onCancel });
  setModalActive(true);
  setModalPrivate(MODAL_PRIVATE.IS_OPEN, true);
  setModalPrivate(MODAL_PRIVATE.TITLE, title);
  setModalPrivate(MODAL_PRIVATE.BODY, bodyHtml);
  setModalPrivate(MODAL_PRIVATE.CONFIRM_CALLBACK, onConfirm);
  setModalPrivate(MODAL_PRIVATE.CANCEL_CALLBACK, onCancel);
  setModalPrivate(MODAL_PRIVATE.BUTTONS_CREATED, false);
  setModalPrivate(MODAL_PRIVATE.IS_UPDATING, false);

  // Добавляем в историю
  if (MODAL_CONFIG.historyEnabled) {
    const history = getModalPrivate(MODAL_PRIVATE.HISTORY);
    history.push({
      title,
      body: bodyHtml.substring(0, 100),
      timestamp: Date.now(),
      type: 'modal',
    });
    if (history.length > MODAL_CONFIG.maxHistorySize) {
      history.shift();
    }
  }

  // Добавляем в стек
  if (MODAL_CONFIG.stackEnabled) {
    const stack = getModalPrivate(MODAL_PRIVATE.STACK);
    stack.push({ title, body: bodyHtml.substring(0, 100) });
    if (stack.length > MODAL_CONFIG.maxStackSize) {
      stack.shift();
    }
  }

  // Обновляем DOM
  DOM.modalTitle.textContent = title;
  DOM.modalBody.innerHTML = bodyHtml;
  DOM.modalOverlay.classList.remove('hidden');

  // Устанавливаем Z-index
  const zIndex = getModalPrivate(MODAL_PRIVATE.Z_INDEX);
  DOM.modalOverlay.style.zIndex = zIndex;
  const modalEl = DOM.modalOverlay.querySelector('.modal');
  if (modalEl) {
    modalEl.style.zIndex = zIndex + 1;
  }

  // Настройка кнопок
  const confirmText = getModalPrivate(MODAL_PRIVATE.CONFIRM_TEXT);
  const cancelText = getModalPrivate(MODAL_PRIVATE.CANCEL_TEXT);
  DOM.modalConfirmBtn.textContent = confirmText;
  DOM.modalCancelBtn.textContent = cancelText;

  // Видимость кнопок
  const buttonsVisible = getModalPrivate(MODAL_PRIVATE.BUTTONS_VISIBLE);
  DOM.modalConfirmBtn.style.display = buttonsVisible ? '' : 'none';
  DOM.modalCancelBtn.style.display = buttonsVisible ? '' : 'none';

  // Блокировка скролла
  if (MODAL_CONFIG.preventBodyScroll) {
    document.body.style.overflow = 'hidden';
    setModalPrivate(MODAL_PRIVATE.SCROLL_LOCK, true);
  }

  // ARIA атрибуты
  if (MODAL_CONFIG.ariaEnabled) {
    DOM.modalOverlay.setAttribute('role', 'dialog');
    DOM.modalOverlay.setAttribute('aria-modal', 'true');
    DOM.modalOverlay.setAttribute('aria-labelledby', 'modalTitle');
    DOM.modalTitle.id = 'modalTitle';
  }

  // Фокусируем первый инпут или кнопку подтверждения
  setTimeout(() => {
    const firstInput = DOM.modalBody.querySelector('input, textarea, select');
    if (firstInput) {
      firstInput.focus();
    } else {
      DOM.modalConfirmBtn.focus();
    }

    const focusable = DOM.modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    setModalPrivate(MODAL_PRIVATE.FOCUSABLE_ELEMENTS, Array.from(focusable));
  }, 100);

  // Анимация
  if (!MODAL_CONFIG.disableAnimation) {
    const animationDuration = MODAL_CONFIG.animationDuration || 200;
    if (modalEl) {
      modalEl.style.animation = `modal-slide-up ${animationDuration}ms ease`;
    }
    setModalPrivate(MODAL_PRIVATE.IS_TRANSITIONING, true);
    setTimeout(() => {
      setModalPrivate(MODAL_PRIVATE.IS_TRANSITIONING, false);
    }, animationDuration);
  }

  addLog(`📋 Модальное окно: ${title}`, 'info');

  // Вызываем хук onOpen
  const onOpen = MODAL_CONFIG.onOpen;
  if (isFunction(onOpen)) {
    try {
      onOpen({ title, body: bodyHtml, onConfirm, onCancel });
    } catch (error) {
      addLog(`❌ Ошибка в onOpen: ${error.message}`, 'error');
    }
  }
}

export function closeModal(result = null) {
  // Проверка на блокировку
  if (getModalPrivate(MODAL_PRIVATE.LOCKED)) {
    addLog('⚠️ Модальное окно заблокировано', 'warn');
    return;
  }

  // Проверка на переход
  if (getModalPrivate(MODAL_PRIVATE.IS_TRANSITIONING)) {
    addLog('⚠️ Модальное окно в процессе анимации', 'warn');
    return;
  }

  // Проверка DOM элементов
  if (!DOM.modalOverlay) {
    addLog('⚠️ Модальное окно: overlay не найден', 'warn');
    return;
  }

  console.log('📋 [Modal] closeModal вызван с результатом:', result);

  // ★★★ ЗАЩИТА ОТ ПОВТОРНОГО ЗАКРЫТИЯ ★★★
  if (DOM.modalOverlay.classList.contains('hidden')) {
    console.log('⚠️ [Modal] Модалка уже закрыта, игнорируем');
    return;
  }

  // Сохраняем результат
  setModalPrivate(MODAL_PRIVATE.MODAL_RESULT, result);

  // Анимация закрытия
  const modalEl = DOM.modalOverlay.querySelector('.modal');
  if (!MODAL_CONFIG.disableAnimation && modalEl) {
    const animationDuration = MODAL_CONFIG.animationDuration || 200;
    modalEl.style.animation = `modal-fade-out ${animationDuration}ms ease`;
    setModalPrivate(MODAL_PRIVATE.IS_TRANSITIONING, true);

    setTimeout(() => {
      performClose(result);
    }, animationDuration);
  } else {
    performClose(result);
  }
}

function performClose(result = null) {
  // Закрываем модальное окно
  DOM.modalOverlay.classList.add('hidden');

  // Сбрасываем анимацию
  const modalEl = DOM.modalOverlay.querySelector('.modal');
  if (modalEl) {
    modalEl.style.animation = '';
  }
  setModalPrivate(MODAL_PRIVATE.IS_TRANSITIONING, false);

  // Восстанавливаем скролл
  if (getModalPrivate(MODAL_PRIVATE.SCROLL_LOCK)) {
    document.body.style.overflow = '';
    setModalPrivate(MODAL_PRIVATE.SCROLL_LOCK, false);
  }

  // Восстанавливаем фокус
  if (MODAL_CONFIG.restoreFocus) {
    const previousFocus = getModalPrivate(MODAL_PRIVATE.PREVIOUS_FOCUS);
    if (previousFocus && previousFocus.focus) {
      setTimeout(() => {
        try {
          previousFocus.focus();
        } catch (error) {
          // Игнорируем ошибки фокуса
        }
      }, 100);
    }
  }

  // ARIA атрибуты
  if (MODAL_CONFIG.ariaEnabled) {
    DOM.modalOverlay.removeAttribute('role');
    DOM.modalOverlay.removeAttribute('aria-modal');
    DOM.modalOverlay.removeAttribute('aria-labelledby');
  }

  // ★★★ ВЫЗЫВАЕМ CALLBACK С РЕЗУЛЬТАТОМ ★★★
  const callback = getModalCallback();
  if (callback) {
    try {
      console.log('📋 [Modal] Вызов callback с результатом:', result);
      callback(result);
      addLog(`✅ Callback выполнен успешно`, 'success');
    } catch (error) {
      console.error('❌ [Modal] Ошибка в callback:', error);
      addLog(`❌ Ошибка в callback: ${error.message}`, 'error');
    }
  }

  // Очищаем состояние
  setModalCallback(null);
  setModalData(null);
  setModalActive(false);
  setModalPrivate(MODAL_PRIVATE.IS_OPEN, false);
  setModalPrivate(MODAL_PRIVATE.TITLE, '');
  setModalPrivate(MODAL_PRIVATE.BODY, '');
  setModalPrivate(MODAL_PRIVATE.CONFIRM_CALLBACK, null);
  setModalPrivate(MODAL_PRIVATE.CANCEL_CALLBACK, null);
  setModalPrivate(MODAL_PRIVATE.FOCUSABLE_ELEMENTS, []);
  setModalPrivate(MODAL_PRIVATE.PREVIOUS_FOCUS, null);
  setModalPrivate(MODAL_PRIVATE.MODAL_TYPE, null);
  setModalPrivate(MODAL_PRIVATE.MODAL_RESULT, null);
  setModalPrivate(MODAL_PRIVATE.CONFIRM_ACTION, null);
  setModalPrivate(MODAL_PRIVATE.CANCEL_ACTION, null);
  setModalPrivate(MODAL_PRIVATE.IS_ALERT, false);
  setModalPrivate(MODAL_PRIVATE.BUTTONS_CREATED, false);
  setModalPrivate(MODAL_PRIVATE.IS_UPDATING, false);

  // Сбрасываем флаги alert
  alertHandlersAttached = false;
  if (alertHandlerTimer) {
    clearTimeout(alertHandlerTimer);
    alertHandlerTimer = null;
  }

  // Вызываем хук onClose
  const onClose = MODAL_CONFIG.onClose;
  if (isFunction(onClose)) {
    try {
      onClose({ result });
    } catch (error) {
      addLog(`❌ Ошибка в onClose: ${error.message}`, 'error');
    }
  }

  addLog(`ℹ️ Модальное окно закрыто`, 'info');
}

export function toggleModal(title, bodyHtml, onConfirm, onCancel = null) {
  if (isModalOpen()) {
    closeModal();
  } else {
    showModal(title, bodyHtml, onConfirm, onCancel);
  }
}

// ============================================================
// 13. НАСТРОЙКА МОДАЛЬНОГО ОКНА (СОБЫТИЯ)
// ============================================================

export function setupModal() {
  // ★★★ КНОПКА ПОДТВЕРЖДЕНИЯ ★★★
  if (DOM.modalConfirmBtn) {
    const newBtn = DOM.modalConfirmBtn.cloneNode(true);
    DOM.modalConfirmBtn.parentNode.replaceChild(newBtn, DOM.modalConfirmBtn);
    DOM.modalConfirmBtn = newBtn;

    DOM.modalConfirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (DOM.modalOverlay.classList.contains('hidden')) {
        console.log('⚠️ [Modal] Модалка уже закрыта, игнорируем клик');
        return;
      }

      console.log('🔘 [Modal] Нажата стандартная кнопка подтверждения');

      const isAlert = getModalPrivate(MODAL_PRIVATE.IS_ALERT);
      if (isAlert) {
        const confirmAction = getModalPrivate(MODAL_PRIVATE.CONFIRM_ACTION);
        if (isFunction(confirmAction)) {
          try {
            confirmAction();
          } catch (error) {
            console.error('❌ [Modal] Ошибка в confirmAction:', error);
          }
        }
        closeModal(true);
      } else {
        closeModal(true);
      }
    });
    addLog('✅ Модальное окно: кнопка подтверждения настроена', 'info');
  } else {
    addLog('⚠️ Модальное окно: кнопка подтверждения не найдена', 'warn');
  }

  // ★★★ КНОПКА ОТМЕНЫ ★★★
  if (DOM.modalCancelBtn) {
    const newBtn = DOM.modalCancelBtn.cloneNode(true);
    DOM.modalCancelBtn.parentNode.replaceChild(newBtn, DOM.modalCancelBtn);
    DOM.modalCancelBtn = newBtn;

    DOM.modalCancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (DOM.modalOverlay.classList.contains('hidden')) {
        console.log('⚠️ [Modal] Модалка уже закрыта, игнорируем клик');
        return;
      }

      console.log('🔘 [Modal] Нажата стандартная кнопка отмены');

      const isAlert = getModalPrivate(MODAL_PRIVATE.IS_ALERT);
      if (isAlert) {
        const cancelAction = getModalPrivate(MODAL_PRIVATE.CANCEL_ACTION);
        if (isFunction(cancelAction)) {
          try {
            cancelAction();
          } catch (error) {
            console.error('❌ [Modal] Ошибка в cancelAction:', error);
          }
        }
        closeModal(false);
      } else {
        closeModal(false);
      }
    });
    addLog('✅ Модальное окно: кнопка отмены настроена', 'info');
  } else {
    addLog('⚠️ Модальное окно: кнопка отмены не найдена', 'warn');
  }

  // ★★★ КНОПКА ЗАКРЫТИЯ (X) ★★★
  if (DOM.modalCloseBtn) {
    const newBtn = DOM.modalCloseBtn.cloneNode(true);
    DOM.modalCloseBtn.parentNode.replaceChild(newBtn, DOM.modalCloseBtn);
    DOM.modalCloseBtn = newBtn;

    DOM.modalCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (DOM.modalOverlay.classList.contains('hidden')) {
        console.log('⚠️ [Modal] Модалка уже закрыта, игнорируем клик');
        return;
      }

      console.log('🔘 [Modal] Нажата кнопка закрытия (X)');
      closeModal(null);
    });
    addLog('✅ Модальное окно: кнопка закрытия настроена', 'info');
  } else {
    addLog('⚠️ Модальное окно: кнопка закрытия не найдена', 'warn');
  }

  // ★★★ КЛИК ПО OVERLAY ★★★
  if (DOM.modalOverlay) {
    DOM.modalOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.modalOverlay && MODAL_CONFIG.closeOnOverlay) {
        if (DOM.modalOverlay.classList.contains('hidden')) {
          console.log('⚠️ [Modal] Модалка уже закрыта, игнорируем клик');
          return;
        }
        console.log('🔘 [Modal] Клик по overlay');
        closeModal(null);
      }
    });
    addLog('✅ Модальное окно: overlay настроен', 'info');
  } else {
    addLog('⚠️ Модальное окно: overlay не найден', 'warn');
  }

  // ★★★ ГЛОБАЛЬНЫЕ КЛАВИШИ ★★★
  document.addEventListener('keydown', (e) => {
    if (!isModalActive()) return;
    if (DOM.modalOverlay.classList.contains('hidden')) return;

    // Escape — закрыть
    if (e.key === 'Escape' && MODAL_CONFIG.closeOnEsc) {
      e.preventDefault();
      console.log('⌨️ [Modal] Нажата Escape');
      closeModal(null);
      addLog('ℹ️ Модальное окно закрыто по Escape', 'info');
    }

    // Enter — подтвердить
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName !== 'TEXTAREA' && DOM.modalConfirmBtn) {
        e.preventDefault();
        console.log('⌨️ [Modal] Нажата Enter');
        DOM.modalConfirmBtn.click();
        addLog('ℹ️ Модальное окно подтверждено по Enter', 'info');
      }
    }
  });

  addLog('✅ Модальное окно полностью настроено (100% символы)', 'success');
}

// ============================================================
// 14. ДОПОЛНИТЕЛЬНЫЕ ТИПЫ МОДАЛЬНЫХ ОКОН
// ============================================================

export function showFormModal(title, fields, onSubmit) {
  let formHtml = '';
  for (const field of fields) {
    const { id, label, type = 'text', placeholder = '', value = '', required = false } = field;
    const requiredAttr = required ? 'required' : '';
    const checkedAttr = type === 'checkbox' && value ? 'checked' : '';

    if (type === 'checkbox') {
      formHtml += `
        <div class="form-group">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="${id}" ${checkedAttr}>
            <label for="${id}">${escapeHtml(label)}</label>
          </div>
        </div>
      `;
    } else if (type === 'textarea') {
      formHtml += `
        <div class="form-group">
          <label for="${id}">${escapeHtml(label)}</label>
          <textarea id="${id}" placeholder="${escapeHtml(placeholder)}" ${requiredAttr}>${escapeHtml(value)}</textarea>
        </div>
      `;
    } else {
      formHtml += `
        <div class="form-group">
          <label for="${id}">${escapeHtml(label)}</label>
          <input type="${type}" id="${id}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" ${requiredAttr}>
        </div>
      `;
    }
  }

  showModal(
    title,
    formHtml,
    data => {
      const result = {};
      for (const field of fields) {
        const inputId = field.id;
        if (field.type === 'checkbox') {
          result[field.id] = data[inputId] || false;
        } else {
          result[field.id] = data[inputId] || '';
        }
      }
      try {
        onSubmit(result);
        addLog(`✅ Форма отправлена: ${title}`, 'success');
      } catch (error) {
        addLog(`❌ Ошибка в onSubmit: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`❌ Форма "${title}" отменена`, 'info');
    }
  );
}

export function showConfirmModal(title, message, onConfirm) {
  const bodyHtml = `
    <div style="padding:8px 4px;">
      <div style="font-size:14px;color:var(--es-text-secondary);text-align:center;line-height:1.8;">
        ${escapeHtml(message)}
      </div>
    </div>
  `;

  showModal(
    title,
    bodyHtml,
    () => {
      try {
        onConfirm();
        addLog(`✅ Подтверждено: ${title}`, 'success');
      } catch (error) {
        addLog(`❌ Ошибка в onConfirm: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`❌ Отменено: ${title}`, 'info');
    }
  );
}

export function showSelectModal(title, items, onSelect) {
  let listHtml = '';
  for (const item of items) {
    const value = typeof item === 'object' ? item.value : item;
    const label = typeof item === 'object' ? item.label : item;
    listHtml += `
      <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--es-border-secondary);hover:background:var(--es-bg-hover);"
           data-value="${escapeHtml(value)}">
        ${escapeHtml(label)}
      </div>
    `;
  }

  const bodyHtml = `
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${listHtml}
    </div>
  `;

  showModal(
    title,
    bodyHtml,
    () => {
      addLog(`❌ Выбор отменен: ${title}`, 'info');
    },
    () => {
      addLog(`❌ Выбор отменен: ${title}`, 'info');
    }
  );

  setTimeout(() => {
    const items = DOM.modalBody.querySelectorAll('[data-value]');
    for (const el of items) {
      el.addEventListener('click', () => {
        const value = el.dataset.value;
        try {
          onSelect(value);
          addLog(`✅ Выбрано: ${value}`, 'success');
        } catch (error) {
          addLog(`❌ Ошибка в onSelect: ${error.message}`, 'error');
        }
        closeModal(value);
      });
    }
  }, 50);
}

export function showEditModal(title, data, fields, onSave) {
  let formHtml = '';
  for (const field of fields) {
    const value = data[field] || '';
    formHtml += `
      <div class="form-group">
        <label>${escapeHtml(field)}</label>
        <input type="text" id="edit_${escapeHtml(field)}" value="${escapeHtml(value)}">
      </div>
    `;
  }

  showModal(
    `✏️ ${title}`,
    formHtml,
    formData => {
      const result = { ...data };
      for (const field of fields) {
        const inputId = `edit_${escapeHtml(field)}`;
        result[field] = formData[inputId] || '';
      }
      try {
        onSave(result);
        addLog(`✅ Сохранено: ${title}`, 'success');
      } catch (error) {
        addLog(`❌ Ошибка в onSave: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`❌ Редактирование отменено: ${title}`, 'info');
    }
  );
}

// ============================================================
// 15. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export function getModalFormData() {
  const formData = {};
  const inputs = DOM.modalBody?.querySelectorAll('input, textarea, select') || [];
  for (const input of inputs) {
    if (input.id) {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      formData[input.id] = value;
    }
  }
  return formData;
}

export function updateModalContent(bodyHtml) {
  if (DOM.modalBody) {
    DOM.modalBody.innerHTML = bodyHtml;
    setModalPrivate(MODAL_PRIVATE.BODY, bodyHtml);
  }
}

export function updateModalTitle(title) {
  if (DOM.modalTitle) {
    DOM.modalTitle.textContent = title;
    setModalPrivate(MODAL_PRIVATE.TITLE, title);
  }
}

export function setModalButtonsVisible(confirmVisible = true, cancelVisible = true) {
  if (DOM.modalConfirmBtn) {
    DOM.modalConfirmBtn.style.display = confirmVisible ? '' : 'none';
  }
  if (DOM.modalCancelBtn) {
    DOM.modalCancelBtn.style.display = cancelVisible ? '' : 'none';
  }
  setModalPrivate(MODAL_PRIVATE.BUTTONS_VISIBLE, confirmVisible || cancelVisible);
}

export function setModalButtonText(confirmText = 'Подтвердить', cancelText = 'Отмена') {
  if (DOM.modalConfirmBtn) {
    DOM.modalConfirmBtn.textContent = confirmText;
    setModalPrivate(MODAL_PRIVATE.CONFIRM_TEXT, confirmText);
  }
  if (DOM.modalCancelBtn) {
    DOM.modalCancelBtn.textContent = cancelText;
    setModalPrivate(MODAL_PRIVATE.CANCEL_TEXT, cancelText);
  }
}

export function showTimedModal(title, message, timeout = 3000, type = 'info') {
  showAlertInModal(title, message, type);

  const timeoutId = setTimeout(() => {
    if (isModalActive()) {
      closeModal(null);
      addLog(`⏰ Модальное окно закрыто по таймауту: ${title}`, 'info');
    }
  }, timeout);

  setModalPrivate(MODAL_PRIVATE.TIMEOUT_ID, timeoutId);
}

// ============================================================
// 16. ЭКСПОРТ СИМВОЛОВ
// ============================================================

export function exportModalSymbols() {
  if (typeof window !== 'undefined') {
    window.__MODAL_SYMBOLS = {
      PRIVATE: { ...MODAL_PRIVATE },
      PUBLIC: { ...MODAL_PUBLIC },
      CONFIG: { ...MODAL_CONFIG },
    };

    const privateCount = Object.keys(MODAL_PRIVATE).length;
    const publicCount = Object.keys(MODAL_PUBLIC).length;

    console.log('📊 MODAL SYMBOLS STATS:');
    console.log(`  🔑 Приватных символов: ${privateCount}`);
    console.log(`  🔓 Публичных символов: ${publicCount}`);
    console.log(`  📦 Всего символов: ${privateCount + publicCount}`);
  }
}

if (typeof window !== 'undefined') {
  exportModalSymbols();
}

// ============================================================
// 17. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  const privateCount = Object.keys(MODAL_PRIVATE).length;
  const publicCount = Object.keys(MODAL_PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 MODAL SYSTEM (100% СИМВОЛЫ) v4.0.8                          ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║`);
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ДОСТУПНЫЕ ФУНКЦИИ:                                                     ║');
  console.log('║    ✅ showModal()         — показать модальное окно                         ║');
  console.log('║    ✅ closeModal()        — закрыть модальное окно                          ║');
  console.log('║    ✅ toggleModal()       — переключить модальное окно                      ║');
  console.log('║    ✅ showAlertInModal()  — показать сообщение с действиями ★★★             ║');
  console.log('║    ✅ showWelcomeModal()  — показать приветственное окно                    ║');
  console.log('║    ✅ showConfirmModal()  — показать подтверждение                          ║');
  console.log('║    ✅ showFormModal()     — показать форму                                  ║');
  console.log('║    ✅ showSelectModal()   — показать выбор из списка                        ║');
  console.log('║    ✅ showEditModal()     — показать редактирование                         ║');
  console.log('║    ✅ showTimedModal()    — показать с таймаутом                            ║');
  console.log('║    ✅ lockModal()         — заблокировать                                   ║');
  console.log('║    ✅ unlockModal()       — разблокировать                                  ║');
  console.log('║    ✅ isModalOpen()       — проверить, открыто ли                           ║');
  console.log('║    ✅ isModalLocked()     — проверить, заблокировано ли                     ║');
  console.log('║    ✅ getModalHistory()   — получить историю                                ║');
  console.log('║    ✅ clearModalHistory() — очистить историю                                ║');
  console.log('║    ✅ setModalButtonText()— установить текст кнопок                         ║');
  console.log('║    ✅ setModalButtonsVisible() — показать/скрыть кнопки                     ║');
  console.log('║    ✅ resetWelcomeModalFlag() — сбросить флаг приветственного окна ★★★     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}

// ============================================================
// 18. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  // Основные функции
  showModal,
  closeModal,
  toggleModal,
  showAlertInModal,
  showWelcomeModal,
  setupModal,

  // Дополнительные типы
  showFormModal,
  showConfirmModal,
  showSelectModal,
  showEditModal,

  // Вспомогательные функции
  getModalFormData,
  updateModalContent,
  updateModalTitle,
  setModalButtonsVisible,
  setModalButtonText,
  showTimedModal,

  // Управление блокировкой
  lockModal,
  unlockModal,
  isModalLocked,
  isModalOpen,

  // История
  getModalHistory,
  clearModalHistory,

  // Сброс состояния
  resetWelcomeModalFlag,

  // Символы и конфигурация
  MODAL_PRIVATE,
  MODAL_PUBLIC,
  MODAL_CONFIG,
  exportModalSymbols,
};

// ============================================================
// 19. КОНЕЦ ФАЙЛА
// ============================================================
