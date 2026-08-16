// ============================================================
// app/dom.js — 100% СИМВОЛЫ — DOM-референсы и управление DOM
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

import { getDom, isFunction, safeCall } from './utils.js';
import { PRIVATE } from './symbols.js';
import { getAppState } from './state.js';

// ============================================================
// 1. ОСНОВНЫЕ DOM-РЕФЕРЕНСЫ (100% символы)
// ============================================================

export const DOM = {
  // ============================================================
  // СТАТИСТИКА
  // ============================================================
  tablesCount: getDom('tablesCount'),
  recordsCount: getDom('recordsCount'),
  relationsCount: getDom('relationsCount'),
  subscribersCount: getDom('subscribersCount'),
  undoCount: getDom('undoCount'),
  redoCount: getDom('redoCount'),
  cacheCount: getDom('cacheCount'),
  auditCount: getDom('auditCount'),

  // ============================================================
  // ТАБЫ
  // ============================================================
  tabs: getDom('tabs'),
  tabContents: document.querySelectorAll('.tab-content'),

  // ============================================================
  // ТАБЛИЦЫ
  // ============================================================
  tablesList: getDom('tablesList'),
  dataContainer: getDom('dataContainer'),
  currentTableTitle: getDom('currentTableTitle'),
  tablesInfo: getDom('tablesInfo'),

  // ============================================================
  // КНОПКИ УПРАВЛЕНИЯ
  // ============================================================
  refreshBtn: getDom('refreshBtn'),
  saveBtn: getDom('saveBtn'),
  loadBtn: getDom('loadBtn'),
  clearBtn: getDom('clearBtn'),
  createTableBtn: getDom('createTableBtn'),
  createTableWithSchemaBtn: getDom('createTableWithSchemaBtn'),
  addRowBtn: getDom('addRowBtn'),
  refreshDataBtn: getDom('refreshDataBtn'),
  exportDataBtn: getDom('exportDataBtn'),

  // ============================================================
  // ИНСПЕКТОР
  // ============================================================
  inspectorContent: getDom('inspectorContent'),
  inspectorRefresh: getDom('inspectorRefresh'),

  // ============================================================
  // СВЯЗИ
  // ============================================================
  relationsContainer: getDom('relationsContainer'),
  linkTablesBtn: getDom('linkTablesBtn'),
  unlinkTablesBtn: getDom('unlinkTablesBtn'),

  // ============================================================
  // БРОКЕР СООБЩЕНИЙ
  // ============================================================
  brokerTopic: getDom('brokerTopic'),
  brokerData: getDom('brokerData'),
  publishBtn: getDom('publishBtn'),
  subscriptionsList: getDom('subscriptionsList'),
  addSubscriptionBtn: getDom('addSubscriptionBtn'),
  messagesContainer: getDom('messagesContainer'),
  messagesCount: getDom('messagesCount'),
  clearMessagesBtn: getDom('clearMessagesBtn'),

  // ============================================================
  // АУДИТ
  // ============================================================
  auditContainer: getDom('auditContainer'),
  clearAuditBtn: getDom('clearAuditBtn'),
  exportAuditBtn: getDom('exportAuditBtn'),

  // ============================================================
  // СХЕМЫ
  // ============================================================
  schemasContainer: getDom('schemasContainer'),

  // ============================================================
  // КОНСОЛЬ
  // ============================================================
  consoleOutput: getDom('consoleOutput'),
  consoleInput: getDom('consoleInput'),
  consoleExecBtn: getDom('consoleExecBtn'),
  clearConsoleBtn: getDom('clearConsoleBtn'),

  // ============================================================
  // ПЛАГИНЫ
  // ============================================================
  pluginsContainer: getDom('pluginsContainer'),
  pluginManagerBtn: getDom('pluginManagerBtn'),

  // ============================================================
  // НАСТРОЙКИ
  // ============================================================
  autoCreate: getDom('autoCreate'),
  autoSave: getDom('autoSave'),
  saveInterval: getDom('saveInterval'),
  maxRecords: getDom('maxRecords'),
  maxTables: getDom('maxTables'),
  quotasDisplay: getDom('quotasDisplay'),
  infoDisplay: getDom('infoDisplay'),

  // ============================================================
  // МОДАЛЬНОЕ ОКНО
  // ============================================================
  modalOverlay: getDom('modalOverlay'),
  modalTitle: getDom('modalTitle'),
  modalBody: getDom('modalBody'),
  modalCloseBtn: getDom('modalCloseBtn'),
  modalCancelBtn: getDom('modalCancelBtn'),
  modalConfirmBtn: getDom('modalConfirmBtn'),

  // ============================================================
  // BADGE
  // ============================================================
  versionBadge: getDom('versionBadge'),
  statusBadge: getDom('statusBadge'),

  // ============================================================
  // ЛОГИ
  // ============================================================
  logContainer: getDom('logContainer'),

  // ============================================================
  // ДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ (для отображения символов)
  // ============================================================
  symbolsInfo: getDom('symbolsInfo'),
  inspectorSymbols: getDom('inspectorSymbols'),
  brokerSymbols: getDom('brokerSymbols'),
  auditSymbols: getDom('auditSymbols'),
  schemaSymbols: getDom('schemaSymbols'),
  consoleSymbols: getDom('consoleSymbols'),
  pluginSymbols: getDom('pluginSymbols'),
  quotaSymbols: getDom('quotaSymbols'),
  infoSymbols: getDom('infoSymbols'),
  symbolsTotalBadge: getDom('symbolsTotalBadge'),
  refreshSymbolsBtn: getDom('refreshSymbolsBtn'),
  symbolsContainer: getDom('symbolsContainer'),

  // ============================================================
  // УПРАВЛЕНИЕ ЛОГАМИ
  // ============================================================
  clearLogsBtn: getDom('clearLogsBtn'),
  pauseLogsBtn: getDom('pauseLogsBtn'),
  logCount: getDom('logCount'),
};

// ============================================================
// 2. ДОПОЛНИТЕЛЬНЫЕ DOM-ОПЕРАЦИИ (100% символы)
// ============================================================

/**
 * Кэш для DOM-элементов (для быстрого доступа)
 */
const DOM_CACHE = new Map();

/**
 * Получить элемент с кэшированием
 */
export function getCachedDom(id) {
  if (DOM_CACHE.has(id)) {
    return DOM_CACHE.get(id);
  }
  const element = getDom(id);
  if (element) {
    DOM_CACHE.set(id, element);
  }
  return element;
}

/**
 * Очистить кэш DOM-элементов
 */
export function clearDomCache() {
  DOM_CACHE.clear();
}

/**
 * Проверить существование элемента
 */
export function elementExists(id) {
  return !!document.getElementById(id);
}

/**
 * Получить все элементы по селектору
 */
export function getElements(selector) {
  return document.querySelectorAll(selector);
}

/**
 * Получить первый элемент по селектору
 */
export function getElement(selector) {
  return document.querySelector(selector);
}

// ============================================================
// 3. УПРАВЛЕНИЕ КЛАССАМИ (100% символы)
// ============================================================

/**
 * Добавить класс элементу
 */
export function addClass(element, className) {
  if (element) {
    element.classList.add(className);
    return true;
  }
  return false;
}

/**
 * Удалить класс элемента
 */
export function removeClass(element, className) {
  if (element) {
    element.classList.remove(className);
    return true;
  }
  return false;
}

/**
 * Переключить класс элемента
 */
export function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
    return true;
  }
  return false;
}

/**
 * Проверить наличие класса
 */
export function hasClass(element, className) {
  if (element) {
    return element.classList.contains(className);
  }
  return false;
}

// ============================================================
// 4. УПРАВЛЕНИЕ СТИЛЯМИ (100% символы)
// ============================================================

/**
 * Установить стиль элемента
 */
export function setStyle(element, property, value) {
  if (element) {
    element.style[property] = value;
    return true;
  }
  return false;
}

/**
 * Получить стиль элемента
 */
export function getStyle(element, property) {
  if (element) {
    return element.style[property] || getComputedStyle(element)[property];
  }
  return null;
}

/**
 * Установить несколько стилей
 */
export function setStyles(element, styles) {
  if (element && typeof styles === 'object') {
    for (const [property, value] of Object.entries(styles)) {
      element.style[property] = value;
    }
    return true;
  }
  return false;
}

// ============================================================
// 5. УПРАВЛЕНИЕ СОДЕРЖИМЫМ (100% символы)
// ============================================================

/**
 * Установить текстовое содержимое
 */
export function setText(element, text) {
  if (element) {
    element.textContent = text;
    return true;
  }
  return false;
}

/**
 * Установить HTML-содержимое
 */
export function setHtml(element, html) {
  if (element) {
    element.innerHTML = html;
    return true;
  }
  return false;
}

/**
 * Получить текстовое содержимое
 */
export function getText(element) {
  if (element) {
    return element.textContent;
  }
  return null;
}

/**
 * Получить HTML-содержимое
 */
export function getHtml(element) {
  if (element) {
    return element.innerHTML;
  }
  return null;
}

/**
 * Очистить содержимое элемента
 */
export function clearContent(element) {
  if (element) {
    element.innerHTML = '';
    return true;
  }
  return false;
}

// ============================================================
// 6. УПРАВЛЕНИЕ ВИДИМОСТЬЮ (100% символы)
// ============================================================

/**
 * Показать элемент
 */
export function showElement(element) {
  if (element) {
    element.style.display = '';
    element.hidden = false;
    return true;
  }
  return false;
}

/**
 * Скрыть элемент
 */
export function hideElement(element) {
  if (element) {
    element.style.display = 'none';
    element.hidden = true;
    return true;
  }
  return false;
}

/**
 * Переключить видимость элемента
 */
export function toggleVisibility(element) {
  if (element) {
    if (element.style.display === 'none' || element.hidden) {
      showElement(element);
    } else {
      hideElement(element);
    }
    return true;
  }
  return false;
}

/**
 * Проверить видимость элемента
 */
export function isVisible(element) {
  if (element) {
    return element.style.display !== 'none' && !element.hidden;
  }
  return false;
}

// ============================================================
// 7. УПРАВЛЕНИЕ АТРИБУТАМИ (100% символы)
// ============================================================

/**
 * Установить атрибут
 */
export function setAttribute(element, name, value) {
  if (element) {
    element.setAttribute(name, value);
    return true;
  }
  return false;
}

/**
 * Получить атрибут
 */
export function getAttribute(element, name) {
  if (element) {
    return element.getAttribute(name);
  }
  return null;
}

/**
 * Удалить атрибут
 */
export function removeAttribute(element, name) {
  if (element) {
    element.removeAttribute(name);
    return true;
  }
  return false;
}

/**
 * Проверить наличие атрибута
 */
export function hasAttribute(element, name) {
  if (element) {
    return element.hasAttribute(name);
  }
  return false;
}

// ============================================================
// 8. УПРАВЛЕНИЕ СОБЫТИЯМИ (100% символы)
// ============================================================

/**
 * Добавить обработчик события
 */
export function addEvent(element, event, handler, options = {}) {
  if (element && typeof handler === 'function') {
    element.addEventListener(event, handler, options);
    return true;
  }
  return false;
}

/**
 * Удалить обработчик события
 */
export function removeEvent(element, event, handler, options = {}) {
  if (element && typeof handler === 'function') {
    element.removeEventListener(event, handler, options);
    return true;
  }
  return false;
}

/**
 * Создать и вызвать событие
 */
export function dispatchEvent(element, event, detail = null) {
  if (element) {
    const customEvent = new CustomEvent(event, { detail });
    element.dispatchEvent(customEvent);
    return true;
  }
  return false;
}

// ============================================================
// 9. УПРАВЛЕНИЕ ФОРМАМИ (100% символы)
// ============================================================

/**
 * Получить значение поля формы
 */
export function getFormValue(element) {
  if (!element) return null;

  if (element.type === 'checkbox') {
    return element.checked;
  }
  if (element.type === 'radio') {
    return element.checked ? element.value : null;
  }
  if (element.tagName === 'SELECT') {
    return element.value;
  }
  return element.value;
}

/**
 * Установить значение поля формы
 */
export function setFormValue(element, value) {
  if (!element) return false;

  if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    if (element.value === value) {
      element.checked = true;
    }
  } else {
    element.value = value;
  }
  return true;
}

/**
 * Получить все данные формы
 */
export function getFormData(form) {
  if (!form) return {};

  const data = {};
  const elements = form.querySelectorAll('input, select, textarea');

  for (const element of elements) {
    if (element.name) {
      data[element.name] = getFormValue(element);
    }
  }

  return data;
}

/**
 * Очистить форму
 */
export function clearForm(form) {
  if (!form) return false;

  const elements = form.querySelectorAll('input, select, textarea');
  for (const element of elements) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      element.checked = false;
    } else {
      element.value = '';
    }
  }
  return true;
}

// ============================================================
// 10. УПРАВЛЕНИЕ СКРОЛЛИНГОМ (100% символы)
// ============================================================

/**
 * Прокрутить элемент в начало
 */
export function scrollToTop(element) {
  if (element) {
    element.scrollTop = 0;
    return true;
  }
  return false;
}

/**
 * Прокрутить элемент в конец
 */
export function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
    return true;
  }
  return false;
}

/**
 * Прокрутить элемент в поле зрения
 */
export function scrollIntoView(element, options = {}) {
  if (element) {
    element.scrollIntoView(options);
    return true;
  }
  return false;
}

// ============================================================
// 11. УПРАВЛЕНИЕ РАЗМЕРАМИ (100% символы)
// ============================================================

/**
 * Получить размеры элемента
 */
export function getElementRect(element) {
  if (element) {
    return element.getBoundingClientRect();
  }
  return null;
}

/**
 * Получить ширину элемента
 */
export function getElementWidth(element) {
  if (element) {
    return element.offsetWidth;
  }
  return 0;
}

/**
 * Получить высоту элемента
 */
export function getElementHeight(element) {
  if (element) {
    return element.offsetHeight;
  }
  return 0;
}

// ============================================================
// 12. DOM-УТИЛИТЫ (100% символы)
// ============================================================

/**
 * Создать элемент с атрибутами и содержимым
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'style' && typeof value === 'object') {
      setStyles(element, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Клонировать элемент
 */
export function cloneElement(element, deep = true) {
  if (element) {
    return element.cloneNode(deep);
  }
  return null;
}

/**
 * Удалить элемент
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    return true;
  }
  return false;
}

/**
 * Вставить элемент перед другим
 */
export function insertBefore(newElement, referenceElement) {
  if (newElement && referenceElement && referenceElement.parentNode) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement);
    return true;
  }
  return false;
}

/**
 * Вставить элемент после другого
 */
export function insertAfter(newElement, referenceElement) {
  if (newElement && referenceElement && referenceElement.parentNode) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    return true;
  }
  return false;
}

/**
 * Добавить элемент в конец
 */
export function appendChild(parent, child) {
  if (parent && child) {
    parent.appendChild(child);
    return true;
  }
  return false;
}

/**
 * Добавить элементы в конец
 */
export function appendChildren(parent, children) {
  if (parent && Array.isArray(children)) {
    for (const child of children) {
      parent.appendChild(child);
    }
    return true;
  }
  return false;
}

// ============================================================
// 13. DOM-ХУКИ ДЛЯ ИНИЦИАЛИЗАЦИИ (100% символы)
// ============================================================

const domHooks = new Map();

/**
 * Зарегистрировать хук для DOM-элемента
 */
export function registerDomHook(id, callback) {
  domHooks.set(id, callback);

  // Если элемент уже существует, вызываем хук сразу
  const element = document.getElementById(id);
  if (element) {
    safeCall(callback, element);
  }

  return id;
}

/**
 * Выполнить все DOM-хуки
 */
export function executeDomHooks() {
  for (const [id, callback] of domHooks) {
    const element = document.getElementById(id);
    if (element) {
      safeCall(callback, element);
    }
  }
}

/**
 * Очистить DOM-хуки
 */
export function clearDomHooks() {
  domHooks.clear();
}

// ============================================================
// 14. МОНИТОРИНГ DOM-ИЗМЕНЕНИЙ (100% символы)
// ============================================================

/**
 * Наблюдать за изменениями в DOM
 */
export function observeDom(element, callback, options = {}) {
  if (!element) return null;

  const observer = new MutationObserver(mutations => {
    safeCall(callback, mutations);
  });

  observer.observe(element, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
    ...options,
  });

  return observer;
}

/**
 * Остановить наблюдение за DOM
 */
export function disconnectDomObserver(observer) {
  if (observer && typeof observer.disconnect === 'function') {
    observer.disconnect();
    return true;
  }
  return false;
}

// ============================================================
// 15. ГЛОБАЛЬНЫЙ ДОСТУП К DOM (для отладки)
// ============================================================

if (typeof window !== 'undefined') {
  window.__dom = {
    DOM,
    getCachedDom,
    clearDomCache,
    elementExists,
    getElements,
    getElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    setStyle,
    getStyle,
    setStyles,
    setText,
    setHtml,
    getText,
    getHtml,
    clearContent,
    showElement,
    hideElement,
    toggleVisibility,
    isVisible,
    setAttribute,
    getAttribute,
    removeAttribute,
    hasAttribute,
    addEvent,
    removeEvent,
    dispatchEvent,
    getFormValue,
    setFormValue,
    getFormData,
    clearForm,
    scrollToTop,
    scrollToBottom,
    scrollIntoView,
    getElementRect,
    getElementWidth,
    getElementHeight,
    createElement,
    cloneElement,
    removeElement,
    insertBefore,
    insertAfter,
    appendChild,
    appendChildren,
    registerDomHook,
    executeDomHooks,
    clearDomHooks,
    observeDom,
    disconnectDomObserver,
  };

  console.log('📋 DOM-утилиты доступны как window.__dom');
}

// ============================================================
// 16. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  DOM,
  getCachedDom,
  clearDomCache,
  elementExists,
  getElements,
  getElement,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setStyle,
  getStyle,
  setStyles,
  setText,
  setHtml,
  getText,
  getHtml,
  clearContent,
  showElement,
  hideElement,
  toggleVisibility,
  isVisible,
  setAttribute,
  getAttribute,
  removeAttribute,
  hasAttribute,
  addEvent,
  removeEvent,
  dispatchEvent,
  getFormValue,
  setFormValue,
  getFormData,
  clearForm,
  scrollToTop,
  scrollToBottom,
  scrollIntoView,
  getElementRect,
  getElementWidth,
  getElementHeight,
  createElement,
  cloneElement,
  removeElement,
  insertBefore,
  insertAfter,
  appendChild,
  appendChildren,
  registerDomHook,
  executeDomHooks,
  clearDomHooks,
  observeDom,
  disconnectDomObserver,
};

// ============================================================
// 17. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование DOM-утилит
// ============================================================

import {
  DOM,
  addClass,
  removeClass,
  setText,
  setHtml,
  showElement,
  hideElement,
  createElement,
  appendChild,
  addEvent,
} from './app/dom.js';

// 1. Получить элемент через DOM
const container = DOM.dataContainer;

// 2. Работа с классами
addClass(container, 'active');
removeClass(container, 'inactive');

// 3. Установка содержимого
setText(DOM.currentTableTitle, '📊 Моя таблица');

// 4. Создание элемента
const button = createElement('button', {
  className: 'btn btn-primary',
  textContent: 'Нажми меня',
}, []);

// 5. Добавление элемента
appendChild(container, button);

// 6. Обработка событий
addEvent(button, 'click', () => {
  console.log('Кнопка нажата!');
});

// 7. Управление видимостью
hideElement(DOM.modalOverlay);
showElement(DOM.modalOverlay);

// 8. Получение данных формы
const formData = getFormData(document.querySelector('form'));
console.log('Данные формы:', formData);
*/
