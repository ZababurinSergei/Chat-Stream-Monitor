// chatMonitor.js - Полная версия с отслеживанием мутаций, HTML ответами и финальной статистикой
// 100% кода с обновлениями

const LOG_PREFIX = '🤖 [CHAT-MONITOR]';
const STYLES = {
    userInput: 'color: #4CAF50; font-weight: bold; font-size: 12px; background: #1a3a1a; padding: 2px 8px; border-radius: 4px;',
    start: 'color: #4CAF50; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    end: 'color: #2196F3; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    error: 'color: #f44336; font-weight: bold; font-size: 13px; background: #1a1a1a; padding: 2px 8px; border-radius: 4px;',
    info: 'color: #FF9800; font-weight: bold;',
    success: 'color: #8BC34A;',
    validation: 'color: #9C27B0;',
    typing: 'color: #00BCD4; font-weight: bold;',
    message: 'color: #E0E0E0; background: #2d2d2d; padding: 4px 8px; border-radius: 4px; font-style: italic;',
    messagePreview: 'color: #00CED1; background: #0a2a2a; padding: 4px 8px; border-radius: 4px; font-family: monospace;',
    separator: 'color: #555; font-weight: normal;',
    task: 'color: #FF6B6B; font-weight: bold;',
    session: 'color: #4ECDC4; font-weight: bold;',
    pending: 'color: #FF9800; font-weight: bold; font-size: 13px; background: #3a2a00; padding: 2px 8px; border-radius: 4px;',
    operator: 'color: #00BCD4; font-weight: bold; font-size: 13px; background: #003a4a; padding: 2px 8px; border-radius: 4px;',
    send: 'color: #4CAF50; font-weight: bold; font-size: 12px; background: #1a3a1a; padding: 2px 8px; border-radius: 4px;',
    waiting: 'color: #FF9800; font-weight: bold; font-size: 12px; background: #3a2a00; padding: 2px 8px; border-radius: 4px;',
    response: 'color: #2196F3; font-weight: bold; font-size: 12px; background: #001a3a; padding: 2px 8px; border-radius: 4px;',
    continue: 'color: #FF5722; font-weight: bold; font-size: 12px; background: #2a1a00; padding: 2px 8px; border-radius: 4px;',
    page: 'color: #9C27B0; font-weight: bold; font-size: 12px; background: #2a003a; padding: 2px 8px; border-radius: 4px;',
    mutation: 'color: #00BCD4; font-weight: bold; font-size: 12px; background: #003a4a; padding: 2px 8px; border-radius: 4px;'
};

class DeepSeekChatMonitor {
    constructor(options = {}) {
        // Состояния модуля
        this.state = {
            isUserTyping: false,
            isChatProcessing: false,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: '',
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: null,
            endTime: null,
            userMessageSent: false,
            waitingForResponse: false,
            responseReceived: false,

            pendingUserAction: {
                isPending: false,
                type: null,
                description: null,
                detectedAt: null,
                severity: 'medium',
                suggestedAction: null,
                autoResolved: false,
                resolvedAt: null,
                resolutionMethod: null
            }
        };

        // Текущая сессия чата
        this.currentSession = {
            id: null,
            startTime: null,
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };

        // Текущая задача
        this.currentTask = {
            id: null,
            userMessage: null,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: null,
            endTime: null,
            duration: null,
            status: 'pending',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };

        // История чата
        this.chatHistory = {
            sessions: [],
            currentSession: null
        };

        // Состояния блоков HTML
        this.htmlBlocks = {
            chatInput: null,
            sendButton: null,
            assistantMessageContainer: null,
            loadingIndicator: null,
            errorBlock: null,
            messageBlocks: []
        };

        // Валидация ответа
        this.validationRules = {
            expectedBlocks: [
                '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
                '.message.assistant', '[class*="message"]', '[class*="assistant"]'
            ],
            expectedStates: ['streaming', 'complete', 'error'],
            minResponseLength: 10,
            maxResponseTime: 120000,
            requiredKeywords: []
        };

        this.detectionConfig = {
            responseWaitTimeout: 120000,
            streamingStuckTimeout: 30000,
            noChangeTimeout: 3000,
            minResponseWords: 30,
            requireCompleteSentence: true,
            mutationIdleTimeout: 10000,
            mutationMaxIdleBeforeComplete: 5000
        };

        // DOM элементы
        this.chatInput = null;
        this.sendButton = null;

        // Флаги
        this.processingStarted = false;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._clickHandlerAttached = false;
        this._enterHandlerAttached = false;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._continueClickCount = 0;
        this._startWaitingLogged = false;
        this._streamingActive = false;
        this._currentResponseElement = null;

        // Флаги для отслеживания мутаций
        this._lastMutationTime = null;
        this._mutationIdleTimer = null;
        this._consecutiveIdleChecks = 0;
        this._maxIdleChecks = 3;

        // Флаг автоматических нажатий (по умолчанию ВЫКЛЮЧЕН)
        this.autoClickEnabled = options.autoClickEnabled !== undefined ? options.autoClickEnabled : false;

        // Флаг для отслеживания состояния action кнопки
        this._actionButtonPollingInterval = null;

        // Таймеры
        this.typingDebounceTimer = null;
        this.responseTimeoutTimer = null;

        // Наблюдатели
        this.domObserver = null;
        this.attributeObserver = null;
        this.responseObserver = null;

        // Callback
        this.onStateChange = options.onStateChange || null;
        this.onNewConversation = options.onNewConversation || null;
        this.onValidationResult = options.onValidationResult || null;
        this.onSessionUpdate = options.onSessionUpdate || null;
        this.onTaskComplete = options.onTaskComplete || null;
        this.onPendingAction = options.onPendingAction || null;
        this.onContinueButtonDetected = options.onContinueButtonDetected || null;

        // Управление логированием
        this.logging = {
            enabled: options.logging !== false,
            showDebug: options.showDebug || false,
            showInfo: options.showInfo !== false,
            showValidation: options.showValidation !== false,
            showPending: options.showPending !== false,
            useStyles: options.useStyles !== false
        };

        // Интеграция с событийной шиной
        this.eventBus = typeof window !== 'undefined' ? window.__deepseekEventBus : null;
        this.eventListeners = [];
        this.useEventBus = options.useEventBus !== false && this.eventBus !== null;

        // Привязываем fetch
        this._fetch = window.fetch.bind(window);

        // Порт сервера
        this.API_PORT = 3853;
        this.API_BASE_URL = `http://localhost:${this.API_PORT}/api`;

        this.init();
    }

    // ========== ЛОГИРОВАНИЕ ==========

    _log(type, message, data = null) {
        if (!this.logging.enabled) return;

        const types = {
            userInput: { method: 'log', prefix: '✏️ USER INPUT', style: STYLES.userInput },
            typing: { method: 'log', prefix: '⌨️ TYPING', style: STYLES.typing },
            start: { method: 'log', prefix: '🎬 START', style: STYLES.start },
            end: { method: 'log', prefix: '🏁 END', style: STYLES.end },
            error: { method: 'error', prefix: '❌ ERROR', style: STYLES.error },
            info: { method: 'log', prefix: 'ℹ️ INFO', style: STYLES.info },
            debug: { method: 'debug', prefix: '🔍 DEBUG', style: STYLES.info },
            validation: { method: 'log', prefix: '✅ VALIDATION', style: STYLES.validation },
            message: { method: 'log', prefix: '💬 MESSAGE', style: STYLES.message },
            messagePreview: { method: 'log', prefix: '📝 PREVIEW', style: STYLES.messagePreview },
            separator: { method: 'log', prefix: '', style: STYLES.separator },
            task: { method: 'log', prefix: '📋 TASK', style: STYLES.task },
            session: { method: 'log', prefix: '🎯 SESSION', style: STYLES.session },
            pending: { method: 'warn', prefix: '⚠️ PENDING', style: STYLES.pending },
            operator: { method: 'log', prefix: '👨‍💼 OPERATOR', style: STYLES.operator },
            send: { method: 'log', prefix: '📤 SEND', style: STYLES.send },
            waiting: { method: 'log', prefix: '⏳ WAITING', style: STYLES.waiting },
            response: { method: 'log', prefix: '💬 RESPONSE', style: STYLES.response },
            continue: { method: 'log', prefix: '🔄 CONTINUE', style: STYLES.continue },
            page: { method: 'log', prefix: '🌐 PAGE', style: STYLES.page },
            mutation: { method: 'log', prefix: '🔀 MUTATION', style: STYLES.mutation }
        };

        const t = types[type] || types.info;

        if (type === 'debug' && !this.logging.showDebug) return;
        if (type === 'info' && !this.logging.showInfo) return;
        if (type === 'validation' && !this.logging.showValidation) return;
        if (type === 'pending' && !this.logging.showPending) return;

        if (this.logging.useStyles) {
            console[t.method](`%c${LOG_PREFIX} ${t.prefix}${t.prefix ? ' ' : ''}${message}`, t.style);
        } else {
            console[t.method](`${LOG_PREFIX} ${t.prefix} ${message}`);
        }

        if (data && this.logging.useStyles) {
            console[t.method](`%c${JSON.stringify(data, null, 2)}`, 'color: #aaa; font-family: monospace;');
        } else if (data) {
            console[t.method](data);
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    init() {
        if (this.logging.showInfo) {
            console.log(`${LOG_PREFIX} 🚀 Инициализация модуля отслеживания чата`);
            console.log(`${LOG_PREFIX} 📡 Сервер API: ${this.API_BASE_URL}`);
            console.log(`${LOG_PREFIX} 🤖 Авто-клики: ${this.autoClickEnabled ? 'ВКЛЮЧЕНЫ' : 'ВЫКЛЮЧЕНЫ'}`);
        }

        this.startNewSession();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupObservers();
            });
        } else {
            this.setupObservers();
        }
    }

    // ========== НАСТРОЙКА НАБЛЮДАТЕЛЕЙ ==========

    setupObservers() {
        this.findChatElements();
        this.scanHtmlBlocks();

        // Сохраняем предыдущее состояние action кнопки
        let lastActionButtonState = { exists: false };

        // Основной наблюдатель - отслеживает мутации DOM
        this.domObserver = new MutationObserver((mutations) => {
            let hasResponseChange = false;
            let hasRelevantMutation = false;
            let hasActionButtonChange = false;

            // Обновляем время последней мутации
            this._lastMutationTime = Date.now();
            this._consecutiveIdleChecks = 0;

            for (const mutation of mutations) {
                // Проверка релевантности мутации
                if (this.isRelevantMutation(mutation)) {
                    hasRelevantMutation = true;
                }

                // Проверка изменения action кнопки
                if (this.isActionButtonStateMutation(mutation)) {
                    hasActionButtonChange = true;
                    this._log('mutation', `🔘 Изменение состояния action кнопки`);
                }

                // Проверка изменения ответа
                if (this.isResponseMutation(mutation)) {
                    hasResponseChange = true;
                    const content = this.extractContentFromMutation(mutation);
                    if (content && this.state.waitingForResponse) {
                        this.onResponseContentChanged(content);
                    }
                }

                // Проверка появления кнопки Continue (текстовой)
                const continueButton = this.findContinueButtonInMutation(mutation);
                if (continueButton && continueButton.isVisible) {
                    this._log('continue', '🔄 Обнаружена кнопка "Continue"');
                    this.handleContinueButton(continueButton);
                }

                // Проверка индикатора загрузки
                if (this.isLoadingIndicatorInMutation(mutation)) {
                    this._log('waiting', '⏳ Обнаружен индикатор загрузки');
                    this._streamingActive = true;
                }
            }

            // Обработка изменения состояния action кнопки
            if (hasActionButtonChange) {
                const newState = this.getCurrentActionButtonState();
                this.handleActionButtonStateChange(lastActionButtonState, newState);
                lastActionButtonState = newState;
            }

            if (hasRelevantMutation || hasResponseChange) {
                this.resetMutationIdleTimer();
            }
        });

        // Запускаем наблюдение
        if (document.body) {
            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'class', 'style', 'aria-hidden', 'hidden',
                    'disabled', 'readonly', 'data-state', 'aria-busy'
                ],
                characterData: true,
                characterDataOldValue: false
            });
            this._log('info', '✅ Наблюдатель DOM настроен');
        }

        // Запускаем таймеры
        this.startMutationIdleTimer();
        this.startResponseTimeoutTimer();

        if (this.logging.showInfo) {
            console.log(`${LOG_PREFIX} ✅ Наблюдатели настроены`);
        }
    }

    // ========== ПРОВЕРКА РЕЛЕВАНТНОСТИ МУТАЦИЙ ==========

    isRelevantMutation(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (this.isChatElement(node)) return true;
                }
            }
        }

        if (mutation.type === 'attributes') {
            const relevantAttrs = ['class', 'style', 'disabled', 'aria-busy', 'data-state'];
            if (relevantAttrs.includes(mutation.attributeName)) {
                const target = mutation.target;
                if (this.isChatElement(target)) return true;
            }
        }

        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent && this.isMessageElement(parent)) return true;
        }

        return false;
    }

    isChatElement(element) {
        if (!element) return false;

        const chatSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '#chat-input', 'textarea', '[contenteditable="true"]',
            '.loading', '.streaming', '.typing-indicator',
            '.chat-container', '.message-list', '.ds-markdown'
        ];

        for (const selector of chatSelectors) {
            if (element.matches && element.matches(selector)) return true;
            if (element.querySelector && element.querySelector(selector)) return true;
        }

        return false;
    }

    isResponseMutation(mutation) {
        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent && this.isMessageElement(parent)) return true;
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isMessageElement(node)) {
                    return true;
                }
            }
        }

        return false;
    }

    extractContentFromMutation(mutation) {
        if (mutation.type === 'characterData') {
            const parent = mutation.target.parentElement;
            if (parent) {
                const html = this.extractHtmlContent(parent);
                const text = this.extractTextContent(parent);
                return { text, html };
            }
        }

        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isMessageElement(node)) {
                    const html = this.extractHtmlContent(node);
                    const text = this.extractTextContent(node);
                    return { text, html };
                }
            }
        }

        return null;
    }

    // ========== МЕТОДЫ ДЛЯ ИЗВЛЕЧЕНИЯ HTML И ТЕКСТА ==========

    /**
     * Извлекает HTML содержимое ответа (сохраняя все теги и форматирование)
     * @param {Element} element - DOM элемент с ответом
     * @returns {string} - HTML содержимое
     */
    extractHtmlContent(element) {
        if (!element) return '';

        const contentSelectors = [
            '.ds-markdown',
            '.markdown-body',
            '.prose',
            '[class*="message-content"]',
            '[class*="response-text"]',
            '.assistant-message',
            '.ai-message',
            '[data-message-role="assistant"]'
        ];

        for (const selector of contentSelectors) {
            const contentElement = element.querySelector ? element.querySelector(selector) :
                (element.matches && element.matches(selector) ? element : null);

            if (contentElement) {
                return contentElement.innerHTML;
            }
        }

        return element.outerHTML || '';
    }

    /**
     * Извлекает чистый текст (для обратной совместимости)
     * @param {Element} element - DOM элемент с ответом
     * @returns {string} - Текстовое содержимое
     */
    extractTextContent(element) {
        if (!element) return '';

        const contentSelectors = [
            '.ds-markdown',
            '.markdown-body',
            '.prose',
            '[class*="message-content"]',
            '[class*="response-text"]'
        ];

        for (const selector of contentSelectors) {
            const contentElement = element.querySelector ? element.querySelector(selector) :
                (element.matches && element.matches(selector) ? element : null);

            if (contentElement && contentElement.textContent) {
                return contentElement.textContent.trim();
            }
        }

        return element.textContent?.trim() || '';
    }

    // ========== МЕТОДЫ ДЛЯ РАБОТЫ С ACTION КНОПКОЙ (СТРЕЛКА/КВАДРАТ) ==========

    /**
     * Проверяет, является ли элемент action кнопкой (стрелка/квадрат)
     * @param {Element} element - Проверяемый элемент
     * @returns {boolean}
     */
    isActionButtonElement(element) {
        if (!element) return false;

        const hasButtonClass = element.classList?.contains('ds-button') ||
            element.classList?.contains('_52c986b');

        if (!hasButtonClass) return false;

        const svg = element.querySelector('svg');
        if (!svg) return false;

        const path = svg.querySelector('path');
        if (!path) return false;

        const d = path.getAttribute('d') || '';

        return d.includes('M8.3125 0.981587') || // стрелка
            d.includes('M2 4.88C2 3.68009');   // квадрат
    }

    /**
     * Проверяет, изменилось ли состояние action кнопки (стрелка/квадрат)
     * @param {MutationRecord} mutation - Объект мутации
     * @returns {boolean}
     */
    isActionButtonStateMutation(mutation) {
        if (mutation.type === 'attributes') {
            const target = mutation.target;
            const isActionButton = this.isActionButtonElement(target);

            if (isActionButton) {
                const changedAttributes = ['class', 'aria-disabled', 'disabled', 'tabindex', 'style'];
                if (changedAttributes.includes(mutation.attributeName)) {
                    return true;
                }
            }
        }

        if (mutation.type === 'childList') {
            const checkNodes = (nodes) => {
                for (const node of nodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (this.isActionButtonElement(node)) return true;
                        if (node.querySelector && node.querySelector('svg[viewBox="0 0 16 16"]')) {
                            if (node.querySelector('button, [role="button"]')) return true;
                        }
                    }
                }
                return false;
            };

            if (mutation.addedNodes.length && checkNodes(mutation.addedNodes)) {
                return true;
            }

            if (mutation.removedNodes.length && checkNodes(mutation.removedNodes)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Находит и определяет состояние action кнопки (стрелка/квадрат)
     * @returns {Object}
     */
    findActionButton() {
        const result = {
            element: null,
            type: null,
            state: null,
            isVisible: false,
            isDisabled: false,
            additionalInfo: null
        };

        const isElementVisible = (element) => {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0';
        };

        const buttons = document.querySelectorAll('button, div[role="button"]');
        let foundButton = null;
        let foundType = null;

        for (const btn of buttons) {
            if (!isElementVisible(btn)) continue;

            const svg = btn.querySelector('svg');
            if (!svg) continue;

            const path = svg.querySelector('path');
            if (!path) continue;

            const d = path.getAttribute('d') || '';

            const isSquareIcon = d.includes('M2 4.88C2 3.68009');
            const isArrowIcon = d.includes('M8.3125 0.981587');

            if (isSquareIcon) {
                foundButton = btn;
                foundType = 'square';
                break;
            }
            if (isArrowIcon) {
                foundButton = btn;
                foundType = 'arrow';
                break;
            }
        }

        if (!foundButton) {
            result.state = 'loading';
            result.isDisabled = true;
            result.additionalInfo = { message: 'Кнопка не найдена - состояние загрузки' };
            this._log('continue', `⏳ Состояние: ЗАГРУЗКА (кнопка не найдена)`);
            return result;
        }

        result.element = foundButton;
        result.isVisible = true;
        result.type = foundType;

        const isDisabled = foundButton.disabled ||
            foundButton.getAttribute('disabled') !== null ||
            foundButton.getAttribute('aria-disabled') === 'true' ||
            foundButton.classList?.contains('ds-button--disabled');

        if (foundType === 'square') {
            result.state = 'streaming';
            result.isDisabled = false;
            result.additionalInfo = { iconType: 'square', message: 'Стриминг активен' };
            this._log('continue', `🎬 Состояние: СТРИМИНГ (квадрат)`);
        } else if (foundType === 'arrow') {
            if (isDisabled) {
                result.state = 'disabled';
                result.isDisabled = true;
                result.additionalInfo = { iconType: 'arrow', message: 'Кнопка неактивна' };
                this._log('continue', `⏸️ Состояние: НЕАКТИВНА (стрелка disabled)`);
            } else {
                result.state = 'active';
                result.isDisabled = false;
                result.additionalInfo = { iconType: 'arrow', message: 'Кнопка активна' };
                this._log('continue', `✅ Состояние: АКТИВНА (стрелка active)`);
            }
        }

        return result;
    }

    /**
     * Получает текущее состояние action кнопки
     * @returns {Object}
     */
    getCurrentActionButtonState() {
        const button = this.findActionButton();

        return {
            exists: button.element !== null,
            type: button.type,
            state: button.state,
            isActive: button.type === 'arrow' && button.state === 'active',
            isStreaming: button.type === 'square' && button.state === 'streaming',
            isDisabled: button.state === 'disabled' || button.state === 'loading',
            isLoading: button.state === 'loading',
            timestamp: Date.now()
        };
    }

    /**
     * Проверяет, завершен ли стриминг
     * Условие: состояние кнопки НЕ streaming И (активна ИЛИ неактивна) И нет кнопки Continue
     * @returns {boolean}
     */
    isStreamingCompleted() {
        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        const isNotStreaming = !actionState.isStreaming;
        const isActionReady = actionState.isActive || actionState.isDisabled;
        const noContinueButton = !continueButton || !continueButton.isVisible;

        const isCompleted = isNotStreaming && isActionReady && noContinueButton;

        if (isCompleted) {
            this._log('response', `✅ Стриминг завершен (состояние: ${actionState.state}, Continue: ${!!continueButton})`);
        }

        return isCompleted;
    }

    /**
     * Обрабатывает изменение состояния action кнопки (только отслеживание)
     * @param {Object} oldState - Предыдущее состояние
     * @param {Object} newState - Новое состояние
     */
    handleActionButtonStateChange(oldState, newState) {
        if (!oldState.exists && newState.exists) {
            this._log('continue', `🆕 Появилась action кнопка: ${newState.type} (${newState.state})`);
            return;
        }

        if (oldState.exists && !newState.exists) {
            this._log('continue', `🗑️ Action кнопка исчезла`);

            if (this.state.waitingForResponse && !this.processingCompleted) {
                if (this.isStreamingCompleted()) {
                    const response = this.getLatestAssistantResponse();
                    if (response && response.text && response.text.length > 0) {
                        this.completeTaskAndSave(response);
                    }
                }
            }
            return;
        }

        if (oldState.exists && newState.exists) {
            if (oldState.type !== newState.type) {
                this._log('continue', `🔄 Изменение типа кнопки: ${oldState.type} -> ${newState.type}`);

                if (oldState.type === 'square' && newState.type === 'arrow') {
                    this._log('response', `✅ Стриминг завершен (смена квадрата на стрелку)`);
                    if (this.state.waitingForResponse && !this.processingCompleted) {
                        const response = this.getLatestAssistantResponse();
                        if (response && response.text && response.text.length > 0) {
                            this.completeTaskAndSave(response);
                        }
                    }
                }
                return;
            }

            if (oldState.state !== newState.state) {
                this._log('continue', `🔄 Изменение состояния ${newState.type}: ${oldState.state} -> ${newState.state}`);

                if (oldState.state === 'streaming' && newState.state !== 'streaming') {
                    this._log('response', `✅ Стриминг завершен (выход из streaming состояния)`);
                    if (this.state.waitingForResponse && !this.processingCompleted) {
                        const response = this.getLatestAssistantResponse();
                        if (response && response.text && response.text.length > 0) {
                            this.completeTaskAndSave(response);
                        }
                    }
                }
            }
        }

        if (this.state.waitingForResponse && !this.processingCompleted) {
            if (this.isStreamingCompleted()) {
                const response = this.getLatestAssistantResponse();
                if (response && response.text && response.text.length > 0) {
                    this.completeTaskAndSave(response);
                }
            }
        }
    }

    /**
     * Проверяет, можно ли нажимать кнопки автоматически
     * @returns {boolean}
     */
    isAutoClickEnabled() {
        return this.autoClickEnabled !== false;
    }

    /**
     * Установить флаг автоматических нажатий
     * @param {boolean} enabled
     */
    setAutoClickEnabled(enabled) {
        this.autoClickEnabled = enabled;
        this._log('operator', `🤖 Автоматические нажатия ${enabled ? 'ВКЛЮЧЕНЫ' : 'ОТКЛЮЧЕНЫ'}`);
    }

    /**
     * Выполняет фактический клик по кнопке
     * @param {Element} element - Элемент кнопки
     */
    _performContinueClick(element) {
        if (!element) return;

        console.log('########## element ############', element)
        this._continueClickCount++;

        try {
            element.click();

            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                button: 0
            });
            element.dispatchEvent(clickEvent);

            const pointerEvent = new PointerEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                button: 0,
                pointerType: 'mouse'
            });
            element.dispatchEvent(pointerEvent);

            this._log('continue', '✅ Кнопка "Continue" успешно нажата');

            this._lastResponseText = '';
            this._lastResponseHtml = '';
            this._lastMutationTime = Date.now();
            this.resetMutationIdleTimer();

        } catch (e) {
            this._log('continue', `❌ Ошибка при нажатии: ${e.message}`);
        }
    }

    /**
     * Отправляет событие о появлении кнопки Continue
     * @param {Object} continueButton - Данные кнопки
     */
    emitContinueButtonDetected(continueButton) {
        if (this.onContinueButtonDetected) {
            this.onContinueButtonDetected({
                timestamp: Date.now(),
                buttonInfo: continueButton,
                continueClicksCount: this._continueClickCount
            });
        }

        if (this.eventBus) {
            this.eventBus.emit('ui:continue-button-detected', {
                timestamp: Date.now(),
                buttonInfo: continueButton,
                continueClicksCount: this._continueClickCount
            }, { source: 'DeepSeekChatMonitor' });
        }
    }

    /**
     * Находит кнопку Continue в мутации
     * @param {MutationRecord} mutation - Объект мутации
     * @returns {Object|null}
     */
    findContinueButtonInMutation(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const btn = this.findContinueButton(node);
                    if (btn && btn.isVisible) return btn;
                }
            }
        }

        if (mutation.type === 'attributes') {
            const btnResult = this.findContinueButton(mutation.target);
            if (btnResult && btnResult.isVisible) {
                return btnResult;
            }
        }

        return null;
    }

    /**
     * Находит кнопку Continue глобально
     * @returns {Object|null}
     */
    findContinueButtonGlobal() {
        return this.findContinueButton(document);
    }

    /**
     * Находит кнопку Continue
     * @param {Node} node - Узел для поиска
     * @returns {Object|null}
     */
    findContinueButton(node = null) {
        const targetNode = node || document;

        const result = {
            element: null,
            isVisible: false,
            isDisabled: false,
            type: null,
            state: null,
            additionalInfo: null
        };

        const isElementActuallyVisible = (element) => {
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);

            if (rect.width === 0 || rect.height === 0) return false;
            if (style.display === 'none') return false;
            if (style.visibility === 'hidden') return false;
            if (style.opacity === '0') return false;

            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            const isInViewport = rect.top < viewportHeight && rect.bottom > 0 &&
                rect.left < viewportWidth && rect.right > 0;

            if (!isInViewport) return false;

            return true;
        };

        // Поиск по тексту "Continue" через XPath
        const xpath = ".//*[normalize-space(text()) = 'Continue' or contains(text(), 'Continue')]";
        const xpathResult = document.evaluate(xpath, targetNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < xpathResult.snapshotLength; i++) {
            const textElement = xpathResult.snapshotItem(i);
            if (!textElement) continue;

            const elementText = textElement.textContent?.trim() || '';
            if (!elementText.toLowerCase().includes('continue')) continue;

            let clickableElement = textElement.closest('button, [role="button"]');

            if (!clickableElement) {
                if (textElement.matches?.('button, [role="button"]')) {
                    clickableElement = textElement;
                }
            }

            if (!clickableElement) continue;
            if (!isElementActuallyVisible(clickableElement)) continue;

            const buttonText = clickableElement.textContent?.trim() || '';
            if (!buttonText.toLowerCase().includes('continue')) continue;

            const isDisabled = clickableElement.disabled ||
                clickableElement.getAttribute('disabled') !== null ||
                clickableElement.getAttribute('aria-disabled') === 'true' ||
                clickableElement.getAttribute('data-disabled') === 'true';

            result.element = clickableElement;
            result.isVisible = true;
            result.isDisabled = isDisabled;
            result.type = 'continue_text';
            result.state = isDisabled ? 'disabled' : 'active';
            result.additionalInfo = { text: buttonText };

            this._log('continue', `🔍 Найдена кнопка "Continue" (текст: "${buttonText}") | Состояние: ${result.state}`);
            return result;
        }

        // Альтернативный поиск среди всех кнопок
        const allButtons = targetNode.querySelectorAll ?
            targetNode.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]') : [];

        for (const btn of allButtons) {
            let buttonText = '';

            const clone = btn.cloneNode(true);
            const svgs = clone.querySelectorAll('svg');
            svgs.forEach(svg => svg.remove());
            buttonText = clone.textContent?.trim() || '';

            if (!buttonText) {
                buttonText = btn.textContent?.trim() || '';
            }

            if (!buttonText.toLowerCase().includes('continue')) continue;
            if (!isElementActuallyVisible(btn)) continue;

            const isDisabled = btn.disabled ||
                btn.getAttribute('disabled') !== null ||
                btn.getAttribute('aria-disabled') === 'true';

            result.element = btn;
            result.isVisible = true;
            result.isDisabled = isDisabled;
            result.type = 'continue_text';
            result.state = isDisabled ? 'disabled' : 'active';
            result.additionalInfo = { text: buttonText };

            this._log('continue', `🔍 Найдена кнопка "Continue" (через querySelector, текст: "${buttonText}") | Состояние: ${result.state}`);
            return result;
        }

        return null;
    }

    /**
     * Обрабатывает появление кнопки Continue (только если авто-клик включен)
     * @param {Object} continueButton - Данные кнопки Continue
     */
    handleContinueButton(continueButton) {
        if (!continueButton || !continueButton.isVisible) return;

        const element = continueButton.element;

        if (element.disabled ||
            element.getAttribute('disabled') !== null ||
            element.getAttribute('aria-disabled') === 'true' ||
            element.classList?.contains('disabled')) {
            this._log('continue', '⚠️ Кнопка "Continue" найдена, но отключена (disabled)');
            return;
        }

        this._log('continue', `🔄 Кнопка "Continue" активна и видима`);

        if (this.isAutoClickEnabled()) {
            this._log('continue', '🖱️ Автоматическое нажатие кнопки "Continue" (разрешено флагом)', element);
            this._performContinueClick(element);
        } else {
            this._log('continue', '👀 Отслеживание кнопки "Continue" (авто-клик отключен)');
            this.emitContinueButtonDetected(continueButton);
        }
    }

    // ========== ТАЙМЕР БЕЗДЕЙСТВИЯ МУТАЦИЙ ==========

    startMutationIdleTimer() {
        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);

        this._mutationIdleTimer = setInterval(() => {
            if (!this.state.waitingForResponse || this.processingCompleted) return;

            const now = Date.now();
            const idleTime = this._lastMutationTime ? now - this._lastMutationTime : 0;

            if (idleTime >= this.detectionConfig.mutationIdleTimeout) {
                this._log('mutation', `⚠️ Нет мутаций в течение ${idleTime/1000} секунд`);

                const isStreamingFromButton = this.checkResponseViaButtonState();
                if (!isStreamingFromButton && !this._streamingActive) {
                    const response = this.getLatestAssistantResponse();
                    if (response && response.text && response.text.length > 0) {
                        this._log('response', '✅ Завершаем задачу: кнопка показывает стрелку (ответ готов)');
                        this.completeTaskAndSave(response);
                        return;
                    }
                }

                const continueButton = this.findContinueButtonGlobal();
                if (continueButton && continueButton.isVisible) {
                    this._log('continue', '🔄 Обнаружена кнопка "Continue", продлеваем ожидание');
                    console.log('@@@@@@@@@@@@@@@@@@@', continueButton)
                    this.handleContinueButton(continueButton);
                    this._lastMutationTime = Date.now();
                    this._consecutiveIdleChecks = 0;
                    return;
                }

                const loadingIndicator = this.findLoadingIndicatorGlobal();
                if (loadingIndicator && this.isElementVisible(loadingIndicator)) {
                    this._log('waiting', '⏳ Индикатор загрузки активен, продлеваем ожидание');
                    this._lastMutationTime = Date.now();
                    this._consecutiveIdleChecks = 0;
                    return;
                }

                const response = this.getLatestAssistantResponse();
                if (response && response.text && response.text.length > 0) {
                    const isComplete = this.isSentenceComplete(response.text);

                    if (isComplete || this._consecutiveIdleChecks >= this._maxIdleChecks) {
                        this._log('response', `✅ Завершаем задачу: ответ получен`);
                        this.completeTaskAndSave(response);
                        return;
                    } else {
                        this._log('waiting', `⏳ Ответ не завершен, ждем... (${this._consecutiveIdleChecks + 1}/${this._maxIdleChecks})`);
                        this._consecutiveIdleChecks++;
                        this._lastMutationTime = now;
                        return;
                    }
                }

                this._consecutiveIdleChecks++;

                if (this._consecutiveIdleChecks >= this._maxIdleChecks) {
                    this._log('pending', '⚠️ Нет прогресса, завершаем задачу');
                    this.detectPendingAction('mutation_idle', {
                        description: `Нет DOM мутаций и нет прогресса`,
                        idleTime: idleTime
                    });
                    this.onChatError('No progress - task stalled');
                } else {
                    this._log('waiting', `⏳ Ожидаем... (${this._consecutiveIdleChecks}/${this._maxIdleChecks})`);
                    this._lastMutationTime = now;
                }
            }
        }, 1000);
    }

    resetMutationIdleTimer() {
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
    }

    startResponseTimeoutTimer() {
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);

        this.responseTimeoutTimer = setTimeout(() => {
            if (!this.state.waitingForResponse || this.processingCompleted) return;

            const elapsed = Date.now() - (this.state.startTime || Date.now());
            if (elapsed >= this.detectionConfig.responseWaitTimeout) {
                this._log('error', `❌ ТАЙМАУТ: Ответ не получен за ${elapsed/1000} секунд`);

                const continueButton = this.findContinueButtonGlobal();
                if (continueButton && continueButton.isVisible) {
                    this._log('continue', '🔄 Нажатие кнопки "Continue" при таймауте');
                    this.handleContinueButton(continueButton);
                    this.startResponseTimeoutTimer();
                    return;
                }

                this.detectPendingAction('timeout', {
                    description: `Ответ не получен в течение ${this.detectionConfig.responseWaitTimeout/1000} секунд`,
                    elapsedTime: elapsed
                });
                this.onChatError('Timeout waiting for response');
            }
        }, this.detectionConfig.responseWaitTimeout);
    }

    resetResponseTimeoutTimer() {
        if (this.responseTimeoutTimer) {
            clearTimeout(this.responseTimeoutTimer);
            this.startResponseTimeoutTimer();
        }
    }

    // ========== ПРОВЕРКА СОСТОЯНИЯ КНОПКИ ==========

    isStreamingActiveFromButton() {
        const buttons = document.querySelectorAll('.ds-button svg[viewBox="0 0 16 16"]');

        for (const svg of buttons) {
            const path = svg.querySelector('path');
            if (path && path.getAttribute('d')) {
                const d = path.getAttribute('d');

                if (d.includes('M2 4.88C2 3.68009')) {
                    const btn = svg.closest('.ds-button, div[role="button"]');
                    if (btn && this.isElementVisible(btn)) {
                        this._log('debug', '🎬 Обнаружена иконка-квадрат - стриминг активен');
                        return true;
                    }
                }

                if (d.includes('M8.3125 0.981587')) {
                    this._log('debug', '✅ Обнаружена иконка-стрелка - стриминг завершен');
                    return false;
                }
            }
        }

        return this._streamingActive;
    }

    checkResponseViaButtonState() {
        const isStreaming = this.isStreamingActiveFromButton();

        if (!isStreaming && this._streamingActive) {
            this._log('response', '📢 Кнопка сменила иконку (квадрат -> стрелка), стриминг завершен');
            const response = this.getLatestAssistantResponse();
            if (response && response.text && response.text.length > 0) {
                this.completeTaskAndSave(response);
                return true;
            }
        }

        this._streamingActive = isStreaming;
        return isStreaming;
    }

    // ========== ПОИСК ИНДИКАТОРА ЗАГРУЗКИ ==========

    findLoadingIndicatorGlobal() {
        const selectors = [
            '.loading', '.streaming', '.typing-indicator',
            '[aria-busy="true"]', '[class*="loading"]', '[class*="streaming"]',
            '.ds-loading', '.spinner', '.loader',
            '.ds-typing-indicator', '.ds-loading-spinner',
            '.dots-loading', '.three-dots', '.typing-dots',
            '.message-typing', '.thinking-indicator',
            '[data-streaming="true"]', '[data-generating="true"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (this.isElementVisible(element)) {
                    return element;
                }
            }
        }

        if (this.chatInput && (this.chatInput.disabled ||
            this.chatInput.getAttribute('readonly') !== null)) {
            return this.chatInput;
        }

        return null;
    }

    isLoadingIndicator(element) {
        if (!element) return false;

        const loadingSelectors = [
            '.loading', '.streaming', '.typing-indicator',
            '[aria-busy="true"]', '[class*="loading"]', '[class*="streaming"]'
        ];

        for (const selector of loadingSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
        }

        return false;
    }

    isLoadingIndicatorInMutation(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && this.isLoadingIndicator(node)) {
                    return true;
                }
            }
        }

        if (mutation.type === 'attributes') {
            if (this.isLoadingIndicator(mutation.target)) return true;
        }

        return false;
    }

    isSentenceComplete(text) {
        if (!text) return false;

        const sentenceEndings = /[.!?;:。！？；：]$/;
        if (sentenceEndings.test(text.trim())) {
            return true;
        }

        const quotes = /["'”»)]$/;
        if (quotes.test(text.trim())) {
            return true;
        }

        if (text.length > 200) {
            const continueIndicators = /(,|и|но|однако|потому что|так как|and|but|however|because)$/i;
            if (!continueIndicators.test(text.trim())) {
                return true;
            }
        }

        if (/```[\s\S]*```$/.test(text.trim())) {
            return true;
        }

        return false;
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ ==========

    isMessageElement(element) {
        if (!element) return false;

        const messageSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message.assistant', '.chat-message.assistant', '[class*="assistant"]',
            '.ds-markdown', '.markdown-body', '[class*="message-content"]'
        ];

        for (const selector of messageSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.querySelector && element.querySelector(selector)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Получает последний ответ ассистента (текст и HTML)
     * @returns {Object|null} - { text, html, raw, element }
     */
    getLatestAssistantResponse() {
        const assistantSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message[data-role="assistant"]', '.chat-message.assistant',
            '[class*="assistant"]', '[class*="bot"]', '[class*="response"]',
            '.ds-markdown', '.markdown-body', '[class*="message-content"]'
        ];

        for (const selector of assistantSelectors) {
            const messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];

                const isUserMessage = lastMessage.matches('[data-message-role="user"]') ||
                    lastMessage.classList.contains('user-message') ||
                    lastMessage.closest('[data-message-role="user"]');

                if (!isUserMessage) {
                    const htmlContent = this.extractHtmlContent(lastMessage);
                    const textContent = this.extractTextContent(lastMessage);

                    this._currentResponseElement = lastMessage;

                    return {
                        text: textContent,
                        html: htmlContent,
                        raw: lastMessage.outerHTML,
                        element: lastMessage
                    };
                }
            }
        }
        return null;
    }

    onResponseContentChanged(content) {
        if (!this.state.waitingForResponse) return;
        if (!content) return;

        const currentTime = Date.now();

        let textContent = content;
        let htmlContent = content;

        if (typeof content === 'object') {
            textContent = content.text || '';
            htmlContent = content.html || content;
        }

        if (textContent !== this._lastResponseText) {
            this._lastResponseText = textContent;
            this._lastResponseHtml = htmlContent;
            this._lastMutationTime = currentTime;
            this._streamingActive = true;
            this.resetResponseTimeoutTimer();
            this.resetMutationIdleTimer();

            // Сохраняем HTML фрагмент
            if (this.currentTask && this.currentTask.htmlChunks) {
                this.currentTask.htmlChunks.push({
                    timestamp: currentTime,
                    html: htmlContent,
                    text: textContent,
                    length: textContent.length
                });
            }

            this._log('response', `📝 Получен фрагмент ответа (${textContent.length} символов, HTML: ${htmlContent?.length || 0} символов)`);

            this.updateState({
                currentAssistantResponse: textContent,
                currentAssistantResponseHtml: htmlContent
            });
        }
    }

    completeTaskAndSave(responseContent) {
        if (this.processingCompleted) return;

        this.processingCompleted = true;

        let textResponse = responseContent;
        let htmlResponse = responseContent;
        let rawResponse = responseContent;

        if (typeof responseContent === 'object') {
            textResponse = responseContent.text || '';
            htmlResponse = responseContent.html || responseContent;
            rawResponse = responseContent.raw || responseContent;
        }

        // Получаем финальный HTML ответ из DOM
        const finalResponse = this.getLatestAssistantResponse();
        if (finalResponse) {
            textResponse = finalResponse.text;
            htmlResponse = finalResponse.html;
            rawResponse = finalResponse.raw;
        }

        this.updateState({
            currentAssistantResponse: textResponse,
            currentAssistantResponseHtml: htmlResponse,
            waitingForResponse: false,
            responseReceived: true,
            isChatProcessing: false,
            isComplete: true,
            endTime: Date.now()
        });

        this.onChatComplete();
    }

    scanHtmlBlocks() {
        const inputSelectors = ['#chat-input', 'textarea', '[contenteditable="true"]', '[data-testid="chat-input"]', '[class*="chat-input"]'];
        for (const selector of inputSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.chatInput !== element) {
                    this.chatInput = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const buttonSelectors = ['button[type="submit"]', 'button[aria-label*="send" i]', '.send-button', '[class*="send"]'];
        for (const selector of buttonSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.sendButton !== element) {
                    this.sendButton = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const loadingSelectors = ['.loading', '.streaming', '.typing-indicator', '[aria-busy="true"]', '[class*="loading"]'];
        for (const selector of loadingSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                this.htmlBlocks.loadingIndicator = element;
                break;
            }
        }

        const messageSelectors = [
            '.assistant-message', '.ai-message', '[data-message-role="assistant"]',
            '.message.assistant', '[class*="assistant"]', '[class*="bot"]',
            '[class*="response"]', '.message:last-child', '.ds-markdown', '.markdown-body'
        ];

        this.htmlBlocks.messageBlocks = [];

        for (const selector of messageSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!this.htmlBlocks.messageBlocks.includes(el) && el.textContent && el.textContent.length > 10) {
                    this.htmlBlocks.messageBlocks.push(el);
                }
            });
        }
    }

    setupSendHandlers() {
        if (!this.chatInput) return;

        if (this._enterHandlerAttached && this._enterKeyHandler) {
            this.chatInput.removeEventListener('keydown', this._enterKeyHandler);
        }

        this._enterKeyHandler = (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                const currentText = this.getInputText();
                if (currentText && currentText.length > 0 && !this.processingStarted) {
                    event.preventDefault();
                    this._log('send', '🔴 ПОЛЬЗОВАТЕЛЬ НАЖАЛ ENTER');
                    this._log('send', `Сообщение: "${currentText.substring(0, 200)}"`);

                    this.resetForNewTask();

                    this.updateState({
                        userMessageSent: true,
                        currentUserMessage: currentText,
                        waitingForResponse: true,
                        responseReceived: false
                    });
                    this.onChatStart(currentText);
                }
            }
        };

        this.chatInput.addEventListener('keydown', this._enterKeyHandler);
        this._enterHandlerAttached = true;

        if (this.sendButton && !this._clickHandlerAttached) {
            this._clickHandler = () => {
                const currentText = this.getInputText();
                if (currentText && currentText.length > 0 && !this.processingStarted) {
                    this._log('send', '🔴 ПОЛЬЗОВАТЕЛЬ НАЖАЛ КНОПКУ ОТПРАВКИ');
                    this._log('send', `Сообщение: "${currentText.substring(0, 200)}"`);

                    this.resetForNewTask();

                    this.updateState({
                        userMessageSent: true,
                        currentUserMessage: currentText,
                        waitingForResponse: true,
                        responseReceived: false
                    });
                    this.onChatStart(currentText);
                }
            };
            this.sendButton.addEventListener('click', this._clickHandler);
            this._clickHandlerAttached = true;
        }
    }

    resetForNewTask() {
        this.processingStarted = false;
        this.processingCompleted = false;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;
        this._continueClickCount = 0;
        this._startWaitingLogged = false;

        if (this.currentTask) {
            this.currentTask.htmlChunks = [];
            this.currentTask.assistantResponseHtml = null;
            this.currentTask.assistantResponseRaw = null;
        }

        this.resetMutationIdleTimer();
        this.resetResponseTimeoutTimer();
    }

    getInputText() {
        if (!this.chatInput) return '';

        if (this.chatInput.tagName === 'TEXTAREA' || this.chatInput.tagName === 'INPUT') {
            return this.chatInput.value || '';
        }

        if (this.chatInput.isContentEditable) {
            return this.chatInput.textContent || '';
        }

        return '';
    }

    isElementVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    findChatElements() {
        const inputSelectors = [
            '#chat-input', 'textarea', '[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]', '[data-testid="chat-input"]', 'input[type="text"]', '.chat-input',
            '[class*="input"]', '[class*="chat"]'
        ];

        for (const selector of inputSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.chatInput !== element) {
                    this.chatInput = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }

        const buttonSelectors = [
            'button[type="submit"]', 'button[aria-label*="send" i]',
            'button[aria-label*="отправить" i]', '.send-button', '#send-button',
            '[class*="send"]'
        ];

        for (const selector of buttonSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isElementVisible(element)) {
                if (this.sendButton !== element) {
                    this.sendButton = element;
                    this.setupSendHandlers();
                }
                break;
            }
        }
    }

    validateResponse(userMessage, assistantResponse, duration) {
        const validation = {
            isValid: true,
            checks: {
                hasContent: false,
                contentLength: false,
                hasHtmlBlocks: false,
                hasProperState: false,
                timeValid: false,
                noErrors: false
            },
            issues: [],
            score: 0
        };

        if (assistantResponse && assistantResponse.length > 0) {
            validation.checks.hasContent = true;
            validation.score += 20;
        } else {
            validation.isValid = false;
            validation.issues.push('Ответ не содержит контента');
        }

        if (assistantResponse && assistantResponse.length >= this.validationRules.minResponseLength) {
            validation.checks.contentLength = true;
            validation.score += 20;
        } else {
            validation.issues.push(`Ответ слишком короткий (${assistantResponse?.length || 0} < ${this.validationRules.minResponseLength})`);
        }

        const hasAssistantBlock = this.htmlBlocks.messageBlocks.length > 0;
        if (hasAssistantBlock) {
            validation.checks.hasHtmlBlocks = true;
            validation.score += 20;
        } else {
            validation.issues.push('Не найдены HTML блоки с ответом ассистента');
        }

        const hasValidState = this.state.isComplete && !this.state.hasError;
        if (hasValidState) {
            validation.checks.hasProperState = true;
            validation.score += 20;
        }

        const isTimeValid = duration <= this.validationRules.maxResponseTime;
        if (isTimeValid) {
            validation.checks.timeValid = true;
            validation.score += 10;
        }

        if (!this.state.hasError) {
            validation.checks.noErrors = true;
            validation.score += 10;
        }

        validation.isValid = validation.score >= 60;

        if (this.logging.showValidation) {
            this._log('validation', `${validation.isValid ? 'ПРОЙДЕНА' : 'НЕ ПРОЙДЕНА'} (score: ${validation.score})`);
        }

        return validation;
    }

    detectPendingAction(type, details = {}) {
        const actionTypes = {
            response_not_found: {
                description: 'Ответ от сервера не получен',
                severity: 'high',
                suggestedAction: 'Проверьте соединение с интернетом и перезагрузите страницу чата'
            },
            html_blocks_missing: {
                description: 'HTML блоки с ответом ассистента не найдены',
                severity: 'medium',
                suggestedAction: 'Обновите страницу или проверьте структуру DOM'
            },
            timeout: {
                description: 'Превышено время ожидания ответа',
                severity: 'high',
                suggestedAction: 'Отправьте запрос повторно или проверьте работу сервера'
            },
            unknown: {
                description: 'Неизвестная проблема',
                severity: 'medium',
                suggestedAction: 'Проверьте консоль разработчика'
            },
            no_response_content: {
                description: 'Ответ получен, но не содержит контента',
                severity: 'low',
                suggestedAction: 'Уточните запрос или попробуйте переформулировать вопрос'
            },
            mutation_idle: {
                description: 'Нет DOM мутаций при ожидании ответа',
                severity: 'medium',
                suggestedAction: 'Проверьте загрузку страницы и работу чата'
            },
            task_stalled: {
                description: 'Задача зависла без прогресса',
                severity: 'high',
                suggestedAction: 'Перезагрузите страницу или проверьте соединение'
            }
        };

        const action = actionTypes[type] || actionTypes.unknown;

        const pendingAction = {
            isPending: true,
            type: type,
            description: details.description || action.description,
            detectedAt: Date.now(),
            severity: details.severity || action.severity,
            suggestedAction: details.suggestedAction || action.suggestedAction,
            details: details,
            autoResolved: false,
            resolvedAt: null,
            resolutionMethod: null
        };

        this.state.pendingUserAction = pendingAction;

        if (this.currentTask) {
            this.currentTask.pendingActions.push({ ...pendingAction });
        }
        if (this.currentSession) {
            this.currentSession.pendingActions.push({ ...pendingAction });
        }

        this._log('pending', `⚠️ ОБНАРУЖЕНО НЕОПРЕДЕЛЕННОЕ ПОВЕДЕНИЕ`);
        this._log('pending', `Тип: ${type}`);
        this._log('pending', `Описание: ${pendingAction.description}`);
        this._log('pending', `Серьезность: ${pendingAction.severity.toUpperCase()}`);
        this._log('pending', `Рекомендация: ${pendingAction.suggestedAction}`);

        if (this.onPendingAction) {
            this.onPendingAction(pendingAction);
        }

        this.sendPendingToServer();

        return pendingAction;
    }

    resolvePendingAction(resolutionMethod) {
        if (!this.state.pendingUserAction.isPending) {
            return null;
        }

        this.state.pendingUserAction.autoResolved = true;
        this.state.pendingUserAction.resolvedAt = Date.now();
        this.state.pendingUserAction.resolutionMethod = resolutionMethod;

        this._log('pending', `✅ НЕОПРЕДЕЛЕННОЕ ПОВЕДЕНИЕ РАЗРЕШЕНО`);
        this._log('pending', `Метод: ${resolutionMethod}`);

        this.state.pendingUserAction = {
            isPending: false,
            type: null,
            description: null,
            detectedAt: null,
            severity: 'medium',
            suggestedAction: null,
            autoResolved: false,
            resolvedAt: null,
            resolutionMethod: null
        };

        return true;
    }

    startNewSession() {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.currentSession = {
            id: sessionId,
            startTime: Date.now(),
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };

        this.chatHistory.currentSession = this.currentSession;

        this._log('session', `НОВАЯ СЕССИЯ: ${sessionId}`);
        this._log('session', `Время начала: ${new Date().toLocaleString()}`);

        if (this.onSessionUpdate) {
            this.onSessionUpdate(this.currentSession);
        }

        return this.currentSession;
    }

    endCurrentSession() {
        if (!this.currentSession || this.currentSession.id === null) {
            return null;
        }

        this.currentSession.endTime = Date.now();
        this.currentSession.status = 'completed';

        const duration = ((this.currentSession.endTime - this.currentSession.startTime) / 1000).toFixed(2);

        this._log('session', `ЗАВЕРШЕНИЕ СЕССИИ: ${this.currentSession.id}`);
        this._log('session', `Длительность: ${duration} секунд`);
        this._log('session', `Задач выполнено: ${this.currentSession.completedTasks}/${this.currentSession.totalTasks}`);
        this._log('session', `Ошибок: ${this.currentSession.failedTasks}`);

        this.chatHistory.sessions.push({ ...this.currentSession });

        if (this.chatHistory.sessions.length > 50) {
            this.chatHistory.sessions.shift();
        }

        if (this.onSessionUpdate) {
            this.onSessionUpdate(this.currentSession);
        }

        return this.currentSession;
    }

    createTask(userMessage) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.currentTask = {
            id: taskId,
            userMessage: userMessage,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            status: 'processing',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };

        if (this.currentSession.tasks) {
            this.currentSession.tasks.push(this.currentTask);
            this.currentSession.totalTasks++;
        }

        this._log('task', `📌 НОВАЯ ЗАДАЧА: ${taskId}`);
        this._log('task', `Сообщение: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`);

        return this.currentTask;
    }

    completeTask(assistantResponse, validation) {
        if (!this.currentTask || this.currentTask.id === null) {
            return null;
        }

        this.currentTask.endTime = Date.now();
        this.currentTask.duration = this.currentTask.endTime - this.currentTask.startTime;

        if (typeof assistantResponse === 'object') {
            this.currentTask.assistantResponse = assistantResponse.text || '';
            this.currentTask.assistantResponseHtml = assistantResponse.html || '';
            this.currentTask.assistantResponseRaw = assistantResponse.raw || '';
        } else {
            this.currentTask.assistantResponse = assistantResponse;
            this.currentTask.assistantResponseHtml = assistantResponse;
            this.currentTask.assistantResponseRaw = assistantResponse;
        }

        this.currentTask.status = validation.isValid ? 'completed' : 'failed';
        this.currentTask.validation = validation;

        if (this.currentSession) {
            if (validation.isValid) {
                this.currentSession.completedTasks++;
            } else {
                this.currentSession.failedTasks++;
            }

            const taskIndex = this.currentSession.tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                this.currentSession.tasks[taskIndex] = { ...this.currentTask };
            }
        }

        this._log('task', `✅ ЗАВЕРШЕНИЕ ЗАДАЧИ: ${this.currentTask.id}`);
        this._log('task', `Статус: ${validation.isValid ? 'УСПЕШНО' : 'ПРОВАЛ'}`);
        this._log('task', `Длительность: ${(this.currentTask.duration / 1000).toFixed(2)} секунд`);
        this._log('task', `HTML ответа: ${this.currentTask.assistantResponseHtml?.length || 0} символов`);

        if (this.onTaskComplete) {
            this.onTaskComplete(this.currentTask);
        }

        return this.currentTask;
    }

    failTask(errorMessage) {
        if (!this.currentTask || this.currentTask.id === null) {
            return null;
        }

        this.currentTask.endTime = Date.now();
        this.currentTask.duration = this.currentTask.endTime - this.currentTask.startTime;
        this.currentTask.status = 'failed';
        this.currentTask.error = errorMessage;

        if (this.currentSession) {
            this.currentSession.failedTasks++;

            const taskIndex = this.currentSession.tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                this.currentSession.tasks[taskIndex] = { ...this.currentTask };
            }
        }

        this._log('task', `❌ ОШИБКА ЗАДАЧИ: ${this.currentTask.id}`);
        this._log('task', `Ошибка: ${errorMessage}`);

        return this.currentTask;
    }

    async sendTaskToServer() {
        if (!this.currentTask || this.currentTask.status !== 'completed') return;

        const taskData = {
            id: this.currentTask.id,
            sessionId: this.currentSession.id,
            userMessage: this.currentTask.userMessage,
            assistantResponse: this.currentTask.assistantResponse,
            assistantResponseHtml: this.currentTask.assistantResponseHtml,
            assistantResponseRaw: this.currentTask.assistantResponseRaw,
            htmlChunks: this.currentTask.htmlChunks,
            startTime: this.currentTask.startTime,
            endTime: this.currentTask.endTime,
            duration: this.currentTask.duration,
            status: this.currentTask.status,
            validationScore: this.currentTask.validation?.score || 0,
            isValid: this.currentTask.validation?.isValid || false,
            errorMessage: this.currentTask.error,
            htmlBlocksCount: this.htmlBlocks.messageBlocks.length,
            continueClicks: this._continueClickCount
        };

        try {
            const url = `${this.API_BASE_URL}/tasks`;
            this._log('debug', `Отправка задачи на ${url}`);
            this._log('info', `📡 HTML ответа: ${taskData.assistantResponseHtml?.length || 0} символов`);

            const response = await this._fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                this._log('info', '📡 Задача отправлена на сервер (включая HTML)');
            } else {
                this._log('error', `❌ Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            this._log('error', `❌ Ошибка отправки на сервер: ${error.message}`);
            this._log('error', `⚠️ Проверьте что сервер запущен на порту ${this.API_PORT}`);
        }
    }

    async sendPendingToServer() {
        if (!this.state.pendingUserAction.isPending) return;

        const pendingData = {
            taskId: this.currentTask?.id || null,
            sessionId: this.currentSession.id,
            type: this.state.pendingUserAction.type,
            description: this.state.pendingUserAction.description,
            severity: this.state.pendingUserAction.severity,
            suggestedAction: this.state.pendingUserAction.suggestedAction,
            details: this.state.pendingUserAction.details,
            autoResolved: this.state.pendingUserAction.autoResolved,
            resolutionMethod: this.state.pendingUserAction.resolutionMethod,
            detectedAt: this.state.pendingUserAction.detectedAt,
            resolvedAt: this.state.pendingUserAction.resolvedAt
        };

        try {
            const url = `${this.API_BASE_URL}/pending`;
            const response = await this._fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingData)
            });

            if (response.ok) {
                this._log('info', '📡 Неопределенное состояние отправлено на сервер');
            } else {
                this._log('error', `❌ Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            this._log('error', `❌ Ошибка отправки на сервер: ${error.message}`);
            this._log('error', `⚠️ Проверьте что сервер запущен на порту ${this.API_PORT}`);
        }
    }

    // ========== ФИНАЛЬНАЯ СТАТИСТИКА ==========

    /**
     * Выводит финальную статистику задачи после завершения стриминга
     * @param {Object} task - Завершенная задача
     * @param {Object} validation - Результаты валидации
     */
    _printFinalTaskStats(task, validation) {
        if (!task) return;

        const separator = '═'.repeat(70);

        console.log(`\n${separator}`);
        console.log(`%c📊 ФИНАЛЬНАЯ СТАТИСТИКА ЗАДАЧИ`, 'color: #FF6B6B; font-weight: bold; font-size: 14px;');
        console.log(`${separator}`);

        // Основная информация
        console.log(`\n%c📌 ОСНОВНАЯ ИНФОРМАЦИЯ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ ID задачи:     ${task.id}`);
        console.log(`  ├─ ID сессии:     ${task.sessionId || this.currentSession?.id}`);
        console.log(`  ├─ Статус:        ${task.status === 'completed' ? '✅ УСПЕШНО' : '❌ ПРОВАЛ'}`);
        console.log(`  └─ Время:         ${new Date().toLocaleString()}`);

        // Сообщения
        console.log(`\n%c💬 СООБЩЕНИЯ:`, 'color: #4ECDC4; font-weight: bold;');

        const userMsg = task.userMessage || this.state.currentUserMessage;
        const assistantMsg = task.assistantResponse || this.state.currentAssistantResponse;

        console.log(`  ├─ Сообщение пользователя:`);
        console.log(`  │   ${userMsg ? userMsg.substring(0, 200) : '(пусто)'}${userMsg?.length > 200 ? '...' : ''}`);
        console.log(`  │   Длина: ${userMsg?.length || 0} символов, ${userMsg?.split(/\s+/).length || 0} слов`);

        console.log(`  └─ Ответ ассистента:`);
        console.log(`      ${assistantMsg ? assistantMsg.substring(0, 200) : '(пусто)'}${assistantMsg?.length > 200 ? '...' : ''}`);

        // Временные метрики
        console.log(`\n%c⏱️ ВРЕМЕННЫЕ МЕТРИКИ:`, 'color: #4ECDC4; font-weight: bold;');

        const startTime = task.startTime || this.state.startTime;
        const endTime = task.endTime || this.state.endTime;
        const duration = task.duration || (endTime - startTime);

        console.log(`  ├─ Время начала:   ${startTime ? new Date(startTime).toLocaleTimeString() : 'N/A'}`);
        console.log(`  ├─ Время окончания: ${endTime ? new Date(endTime).toLocaleTimeString() : 'N/A'}`);
        console.log(`  ├─ Длительность:   ${duration ? `${(duration / 1000).toFixed(2)} секунд (${duration} мс)` : 'N/A'}`);
        console.log(`  └─ Нажатий Continue: ${this._continueClickCount || 0}`);

        // Валидация
        console.log(`\n%c✅ ВАЛИДАЦИЯ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Общий счет:     ${validation.score || task.validation?.score || 0}/100`);
        console.log(`  ├─ Результат:      ${validation.isValid || task.validation?.isValid ? '✅ ПРОЙДЕНА' : '❌ НЕ ПРОЙДЕНА'}`);
        console.log(`  └─ Детали:`);
        console.log(`      ├─ Содержит контент:  ${validation.checks?.hasContent ? '✅' : '❌'}`);
        console.log(`      ├─ Длина ответа:      ${validation.checks?.contentLength ? '✅' : '❌'} (мин: ${this.validationRules.minResponseLength})`);
        console.log(`      ├─ HTML блоки:        ${validation.checks?.hasHtmlBlocks ? '✅' : '❌'} (найдено: ${this.htmlBlocks.messageBlocks.length})`);
        console.log(`      ├─ Состояние чата:    ${validation.checks?.hasProperState ? '✅' : '❌'}`);
        console.log(`      ├─ Время ответа:      ${validation.checks?.timeValid ? '✅' : '❌'}`);
        console.log(`      └─ Ошибки:            ${validation.checks?.noErrors ? '✅' : '❌'}`);

        if (validation.issues && validation.issues.length > 0) {
            console.log(`\n  ⚠️ Проблемы (${validation.issues.length}):`);
            validation.issues.forEach((issue, idx) => {
                console.log(`      ${idx + 1}. ${issue}`);
            });
        }

        // Статистика ответа
        if (assistantMsg) {
            const words = assistantMsg.match(/[\p{L}\p{N}]+/gu) || [];
            const uniqueWords = new Set(words.map(w => w.toLowerCase()));
            const sentences = assistantMsg.split(/[.!?;:]+/).filter(s => s.trim().length > 0);
            const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);

            console.log(`\n%c📈 СТАТИСТИКА ОТВЕТА:`, 'color: #4ECDC4; font-weight: bold;');
            console.log(`  ├─ Всего символов:    ${assistantMsg.length}`);
            console.log(`  ├─ Всего слов:        ${words.length}`);
            console.log(`  ├─ Уникальных слов:   ${uniqueWords.size}`);
            console.log(`  ├─ Средняя длина слова: ${avgWordLength.toFixed(1)} символов`);
            console.log(`  ├─ Количество предложений: ${sentences.length}`);
            console.log(`  ├─ Средняя длина предложения: ${(words.length / (sentences.length || 1)).toFixed(1)} слов`);
            console.log(`  ├─ Содержит код:      ${/```[\s\S]*?```|function|class|const|let|var|import|export/.test(assistantMsg) ? '✅' : '❌'}`);
            console.log(`  ├─ Содержит маркдаун: ${/[*_#`~>]/.test(assistantMsg) ? '✅' : '❌'}`);
            console.log(`  └─ Завершенность:     ${this.isSentenceComplete(assistantMsg) ? '✅' : '❌'}`);
        }

        // HTML статистика
        console.log(`\n%c📄 HTML ОТВЕТА:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Размер HTML:     ${task.assistantResponseHtml?.length || 0} символов`);
        console.log(`  ├─ Количество фрагментов: ${task.htmlChunks?.length || 0}`);
        console.log(`  ├─ Содержит теги:   ${/<\/?[a-z][\s\S]*>/i.test(task.assistantResponseHtml || '') ? '✅' : '❌'}`);
        console.log(`  ├─ Содержит код:    ${/<pre|<code|```/.test(task.assistantResponseHtml || '') ? '✅' : '❌'}`);
        console.log(`  └─ Содержит таблицы: ${/<table|<tr|<td/.test(task.assistantResponseHtml || '') ? '✅' : '❌'}`);

        // Состояние кнопок
        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        console.log(`\n%c🔘 СОСТОЯНИЕ КНОПОК:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Action кнопка:    ${actionState.type || 'none'} (${actionState.state || 'unknown'})`);
        console.log(`  ├─ Стриминг активен:  ${actionState.isStreaming ? '✅' : '❌'}`);
        console.log(`  └─ Continue кнопка:   ${continueButton ? '✅ видима' : '❌ не найдена'}`);

        // Метрики производительности
        console.log(`\n%c⚡ МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ:`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  ├─ Скорость генерации: ${duration ? (assistantMsg?.length / (duration / 1000)).toFixed(1) : 'N/A'} символов/сек`);
        const words = assistantMsg?.match(/[\p{L}\p{N}]+/gu) || [];
        console.log(`  ├─ Скорость (слов/сек): ${duration ? (words.length / (duration / 1000)).toFixed(1) : 'N/A'}`);
        console.log(`  └─ Эффективность:     ${duration && assistantMsg?.length ? (assistantMsg.length / (duration / 1000)).toFixed(1) : 'N/A'} символов/сек`);

        // Итоговая оценка
        console.log(`\n%c🎯 ИТОГОВАЯ ОЦЕНКА:`, 'color: #FF6B6B; font-weight: bold;');

        let grade = 'F';
        let gradeColor = '#f44336';
        let emoji = '🔴';

        const score = validation.score || task.validation?.score || 0;

        if (score >= 90) {
            grade = 'A+';
            gradeColor = '#4CAF50';
            emoji = '🏆';
        } else if (score >= 80) {
            grade = 'A';
            gradeColor = '#8BC34A';
            emoji = '🎉';
        } else if (score >= 70) {
            grade = 'B';
            gradeColor = '#CDDC39';
            emoji = '👍';
        } else if (score >= 60) {
            grade = 'C';
            gradeColor = '#FFC107';
            emoji = '📝';
        } else if (score >= 50) {
            grade = 'D';
            gradeColor = '#FF9800';
            emoji = '⚠️';
        } else {
            grade = 'F';
            gradeColor = '#f44336';
            emoji = '❌';
        }

        console.log(`  ${emoji} Оценка:     %c${grade} (${score}/100)`, `color: ${gradeColor}; font-weight: bold;`);
        console.log(`  ├─ Качество:    ${this._getQualityDescription(score)}`);
        console.log(`  └─ Рекомендация: ${this._getRecommendation(validation, task)}`);

        console.log(`\n${separator}\n`);
    }

    /**
     * Получает описание качества на основе оценки
     * @param {number} score - Оценка
     * @returns {string}
     */
    _getQualityDescription(score) {
        if (score >= 90) return 'Отлично! Ответ высокого качества';
        if (score >= 80) return 'Хорошо, но есть небольшие недочеты';
        if (score >= 70) return 'Удовлетворительно, требует небольшой доработки';
        if (score >= 60) return 'Минимально приемлемо';
        if (score >= 50) return 'Низкое качество, требует улучшения';
        return 'Неудовлетворительно, требуется переформулировка запроса';
    }

    /**
     * Получает рекомендацию на основе валидации
     * @param {Object} validation - Результаты валидации
     * @param {Object} task - Задача
     * @returns {string}
     */
    _getRecommendation(validation, task) {
        if (validation.isValid) {
            if (validation.score >= 90) {
                return 'Задача выполнена отлично, дополнительных действий не требуется';
            }
            if (validation.score >= 70) {
                return 'Задача выполнена успешно, но можно улучшить качество ответа';
            }
            return 'Задача выполнена, но рекомендуется проанализировать ответ';
        }

        if (!validation.checks?.hasContent) {
            return 'Ответ не получен. Проверьте соединение и повторите запрос';
        }
        if (!validation.checks?.contentLength) {
            return 'Ответ слишком короткий. Попробуйте расширить или уточнить запрос';
        }
        if (!validation.checks?.hasHtmlBlocks) {
            return 'Структура страницы изменилась. Обновите расширение';
        }
        if (task.duration > 60000) {
            return 'Долгое время ответа. Попробуйте упростить запрос';
        }

        return 'Проанализируйте ответ и при необходимости повторите запрос';
    }

    /**
     * Выводит краткую статистику в одну строку
     */
    _printCompactTaskStats() {
        const task = this.currentTask;
        const validation = task?.validation;
        const duration = task?.duration || 0;
        const responseLength = task?.assistantResponse?.length || 0;
        const score = validation?.score || 0;

        const statusIcon = validation?.isValid ? '✅' : '❌';
        const grade = score >= 80 ? 'A' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

        console.log(`${statusIcon} Задача ${task?.id?.substring(0, 8)}... | Длит: ${(duration / 1000).toFixed(1)}с | Ответ: ${responseLength} симв | HTML: ${task?.assistantResponseHtml?.length || 0} | Оценка: ${grade} (${score}) | Continue: ${this._continueClickCount}`);
    }

    // ========== ОПЕРАТОРСКИЕ МЕТОДЫ ==========

    operatorForceComplete(response = null) {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Принудительное завершение задачи');

        if (this.state.pendingUserAction.isPending) {
            this.resolvePendingAction('operator_force_complete');
        }

        if (response) {
            this.updateState({ currentAssistantResponse: response });
        }

        this.onChatComplete();

        return { success: true, action: 'force_complete' };
    }

    operatorSkipTask() {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Пропуск задачи');

        if (this.state.pendingUserAction.isPending) {
            this.resolvePendingAction('operator_skipped');
        }

        this.processingStarted = false;
        this.processingCompleted = false;
        this.updateState({
            isChatProcessing: false,
            isComplete: true,
            hasError: false
        });

        return { success: true, action: 'skip_task' };
    }

    operatorRestartMonitoring() {
        this._log('operator', '👨‍💼 ОПЕРАТОР: Перезапуск мониторинга');
        this.destroy();
        this.init();
        return { success: true, action: 'restart_monitoring' };
    }

    operatorGetDiagnostics() {
        return {
            timestamp: Date.now(),
            apiPort: this.API_PORT,
            useEventBus: this.useEventBus,
            autoClickEnabled: this.autoClickEnabled,
            state: {
                waitingForResponse: this.state.waitingForResponse,
                processingCompleted: this.processingCompleted,
                processingStarted: this.processingStarted,
                currentUserMessage: this.state.currentUserMessage?.substring(0, 100)
            },
            mutationStats: this.getMutationStats(),
            processingStatus: {
                continueClicks: this._continueClickCount,
                streamingActive: this._streamingActive,
                lastResponseChangeTime: this._lastMutationTime
            },
            config: {
                mutationIdleTimeout: this.detectionConfig.mutationIdleTimeout,
                maxIdleChecks: this._maxIdleChecks
            }
        };
    }

    getMutationStats() {
        const actionState = this.getCurrentActionButtonState();
        const continueButton = this.findContinueButtonGlobal();

        return {
            lastMutationTime: this._lastMutationTime,
            idleTime: this._lastMutationTime ? Date.now() - this._lastMutationTime : null,
            consecutiveIdleChecks: this._consecutiveIdleChecks,
            maxIdleChecks: this._maxIdleChecks,
            waitingForResponse: this.state.waitingForResponse,
            processingCompleted: this.processingCompleted,
            hasContinueButton: !!continueButton,
            hasLoadingIndicator: !!this.findLoadingIndicatorGlobal(),
            currentResponseLength: this._lastResponseText?.length || 0,
            actionButtonState: actionState.state,
            actionButtonType: actionState.type,
            isStreamingCompleted: this.isStreamingCompleted()
        };
    }

    // ========== ЖИЗНЕННЫЙ ЦИКЛ ЗАДАЧИ ==========

    onChatStart(userMessage) {
        if (this.processingStarted) return;

        this.processingStarted = true;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._continueClickCount = 0;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = Date.now();
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;
        this._startWaitingLogged = false;
        const startTime = Date.now();

        this.createTask(userMessage);

        this.updateState({
            isChatProcessing: true,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: userMessage,
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: startTime,
            endTime: null,
            waitingForResponse: true,
            responseReceived: false
        });

        this.resetMutationIdleTimer();
        this.resetResponseTimeoutTimer();

        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('start', '🚀 НАЧАЛО ОБРАБОТКИ ЗАПРОСА');
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('info', `📝 Сообщение: "${userMessage.substring(0, 200)}"`);
        this._log('info', `⏱️ Время: ${new Date(startTime).toLocaleTimeString()}`);
        this._log('info', `⏰ Таймаут без мутаций: ${this.detectionConfig.mutationIdleTimeout/1000} сек`);
        this._log('separator', '═══════════════════════════════════════════════════════════════');
    }

    onChatComplete() {
        if (this.processingCompleted || !this.processingStarted) return;

        this.processingCompleted = true;
        const endTime = Date.now();
        const duration = ((endTime - this.state.startTime) / 1000).toFixed(2);

        let finalResponse = this.state.currentAssistantResponse;
        let finalResponseHtml = this.state.currentAssistantResponseHtml;

        if (!finalResponse || finalResponse.length === 0) {
            const response = this.getLatestAssistantResponse();
            if (response) {
                finalResponse = response.text;
                finalResponseHtml = response.html;
                this.updateState({
                    currentAssistantResponse: finalResponse,
                    currentAssistantResponseHtml: finalResponseHtml
                });
            }
        }

        this.updateState({
            isChatProcessing: false,
            isComplete: true,
            hasError: false,
            endTime: endTime,
            waitingForResponse: false,
            responseReceived: true
        });

        const validation = this.validateResponse(
            this.state.currentUserMessage,
            finalResponse,
            parseInt(duration) * 1000
        );

        this.completeTask({ text: finalResponse, html: finalResponseHtml }, validation);

        // Вывод финальной статистики
        this._printFinalTaskStats(this.currentTask, validation);
        // Или краткая версия:
        // this._printCompactTaskStats();

        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('end', '✅ ОКОНЧАНИЕ ОБРАБОТКИ');
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('info', `⏱️ Длительность: ${duration} секунд`);
        this._log('info', `📊 Статус: ${validation.isValid ? 'УСПЕШНО' : 'ОШИБКА ВАЛИДАЦИИ'}`);
        this._log('validation', `🎯 Оценка валидации: ${validation.score}/100`);
        this._log('info', `🖱️ Нажатий Continue: ${this._continueClickCount}`);
        this._log('info', `📄 HTML ответа: ${finalResponseHtml?.length || 0} символов`);

        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('message', '💬 ОТВЕТ АССИСТЕНТА:');
        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('messagePreview', finalResponse ? finalResponse.substring(0, 500) : '(пустой ответ)');
        this._log('separator', '───────────────────────────────────────────────────────────────');

        if (finalResponse && finalResponse.length > 0) {
            const preview = finalResponse.length > 60
                ? finalResponse.substring(0, 60) + '...'
                : finalResponse;
            this._log('messagePreview', `📝 ${preview}`);
            this._log('info', `📊 Всего символов: ${finalResponse.length}`);
        } else {
            this._log('error', '❌ Ответ не получен');
            this.detectPendingAction('response_not_found', {
                description: 'Ответ от сервера не получен'
            });
        }

        this._log('separator', '───────────────────────────────────────────────────────────────');
        this._log('validation', '🔍 Детали валидации:');
        this._log('validation', `  ├─ Содержит контент: ${validation.checks.hasContent ? '✅' : '❌'}`);
        this._log('validation', `  ├─ Длина ответа: ${validation.checks.contentLength ? '✅' : '❌'} (мин: ${this.validationRules.minResponseLength})`);
        this._log('validation', `  ├─ HTML блоки: ${validation.checks.hasHtmlBlocks ? '✅' : '❌'} (найдено: ${this.htmlBlocks.messageBlocks.length})`);
        this._log('validation', `  ├─ Состояние чата: ${validation.checks.hasProperState ? '✅' : '❌'}`);
        this._log('validation', `  ├─ Время ответа: ${validation.checks.timeValid ? '✅' : '❌'}`);
        this._log('validation', `  └─ Ошибки: ${validation.checks.noErrors ? '✅' : '❌'}`);

        if (validation.issues.length > 0) {
            this._log('validation', `\n⚠️ Проблемы (${validation.issues.length}):`);
            validation.issues.forEach((issue, idx) => {
                this._log('validation', `  ${idx + 1}. ${issue}`);
            });
        }

        this._log('separator', '═══════════════════════════════════════════════════════════════');

        this.sendTaskToServer();

        setTimeout(() => {
            this.processingStarted = false;
            this.processingCompleted = false;
            this.updateState({
                isUserTyping: false,
                currentUserMessage: '',
                currentAssistantResponse: '',
                currentAssistantResponseHtml: '',
                userMessageSent: false,
                waitingForResponse: false,
                responseReceived: false
            });
            this._lastResponseText = '';
            this._lastResponseHtml = '';
            this._lastMutationTime = null;
            this._streamingActive = false;
            this._consecutiveIdleChecks = 0;
        }, 500);
    }

    onChatError(errorMessage) {
        this._log('separator', '═══════════════════════════════════════════════════════════════');
        this._log('error', `❌ ОШИБКА: ${errorMessage}`);
        this._log('separator', '═══════════════════════════════════════════════════════════════');

        this.failTask(errorMessage);

        if (errorMessage.includes('No DOM mutations') || errorMessage.includes('stalled')) {
            this.detectPendingAction('task_stalled', {
                description: errorMessage,
                lastMutationTime: this._lastMutationTime,
                consecutiveIdleChecks: this._consecutiveIdleChecks
            });
        }

        this.updateState({
            hasError: true,
            errorMessage: errorMessage,
            isChatProcessing: false,
            isComplete: false,
            waitingForResponse: false
        });

        setTimeout(() => {
            this.processingStarted = false;
            this.processingCompleted = false;
            this._consecutiveIdleChecks = 0;
            this.updateState({
                hasError: false,
                errorMessage: null,
                isUserTyping: false,
                userMessageSent: false,
                waitingForResponse: false,
                responseReceived: false
            });
        }, 2000);
    }

    updateState(newState) {
        const changed = {};
        for (const [key, value] of Object.entries(newState)) {
            if (this.state[key] !== value) {
                changed[key] = { old: this.state[key], new: value };
                this.state[key] = value;
            }
        }

        if (Object.keys(changed).length > 0 && this.onStateChange) {
            this.onStateChange(this.state, changed);
        }
    }

    // ========== ГЕТТЕРЫ ==========

    getState() {
        return { ...this.state };
    }

    getPendingAction() {
        return { ...this.state.pendingUserAction };
    }

    getCurrentSession() {
        return this.currentSession;
    }

    getCurrentTask() {
        return this.currentTask;
    }

    getSessionTasks() {
        return this.currentSession?.tasks || [];
    }

    getAllSessions() {
        return this.chatHistory.sessions;
    }

    getSessionAnalytics() {
        if (!this.currentSession) return null;

        const totalDuration = this.currentSession.endTime
            ? (this.currentSession.endTime - this.currentSession.startTime) / 1000
            : (Date.now() - this.currentSession.startTime) / 1000;

        const successRate = this.currentSession.totalTasks > 0
            ? (this.currentSession.completedTasks / this.currentSession.totalTasks) * 100
            : 0;

        return {
            sessionId: this.currentSession.id,
            totalTasks: this.currentSession.totalTasks,
            completedTasks: this.currentSession.completedTasks,
            failedTasks: this.currentSession.failedTasks,
            successRate: successRate.toFixed(2),
            totalDuration: totalDuration.toFixed(2),
            averageTaskDuration: this.currentSession.tasks.length > 0
                ? (this.currentSession.tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / this.currentSession.tasks.length / 1000).toFixed(2)
                : 0
        };
    }

    exportSession() {
        if (!this.currentSession) return null;
        return {
            session: { ...this.currentSession },
            analytics: this.getSessionAnalytics(),
            exportDate: new Date().toISOString()
        };
    }

    exportAllData() {
        return {
            currentSession: this.currentSession ? { ...this.currentSession } : null,
            history: this.chatHistory.sessions.map(s => ({ ...s })),
            totalSessions: this.chatHistory.sessions.length,
            totalTasks: this.chatHistory.sessions.reduce((sum, s) => sum + s.totalTasks, 0),
            exportDate: new Date().toISOString()
        };
    }

    clearCurrentSession() {
        if (this.currentSession && this.currentSession.tasks.length > 0) {
            this._log('session', 'СЕССИЯ ОЧИЩЕНА');
        }
        this.currentSession = {
            id: null,
            startTime: null,
            endTime: null,
            tasks: [],
            pendingActions: [],
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            status: 'active'
        };
        this.currentTask = {
            id: null,
            userMessage: null,
            assistantResponse: null,
            assistantResponseHtml: null,
            assistantResponseRaw: null,
            startTime: null,
            endTime: null,
            duration: null,
            status: 'pending',
            validation: null,
            error: null,
            pendingActions: [],
            htmlChunks: []
        };
        this.chatHistory.currentSession = null;
    }

    getHtmlBlocks() {
        return { ...this.htmlBlocks };
    }

    getValidationRules() {
        return { ...this.validationRules };
    }

    setValidationRules(rules) {
        this.validationRules = { ...this.validationRules, ...rules };
        this._log('info', 'Правила валидации обновлены');
    }

    getPageState() {
        return {
            current: this.state.isChatProcessing ? 'processing' :
                this.state.isComplete ? 'complete' :
                    this.state.hasError ? 'error' : 'idle',
            metrics: {
                hasResponse: !!this.state.currentAssistantResponse,
                responseLength: this.state.currentAssistantResponse?.length || 0,
                hasHtml: !!this.state.currentAssistantResponseHtml,
                htmlLength: this.state.currentAssistantResponseHtml?.length || 0
            }
        };
    }

    getPerformanceMetrics() {
        const actionState = this.getCurrentActionButtonState();
        return {
            lastMutationTime: this._lastMutationTime,
            mutationIdleTime: this._lastMutationTime ? Date.now() - this._lastMutationTime : null,
            consecutiveIdleChecks: this._consecutiveIdleChecks,
            processingStarted: this.processingStarted,
            processingCompleted: this.processingCompleted,
            continueClickCount: this._continueClickCount,
            actionButtonState: actionState.state,
            actionButtonType: actionState.type,
            isStreamingCompleted: this.isStreamingCompleted()
        };
    }

    reset() {
        this.processingStarted = false;
        this.processingCompleted = false;
        this.retryCount = 0;
        this._continueClickCount = 0;
        this._lastResponseText = '';
        this._lastResponseHtml = '';
        this._lastMutationTime = null;
        this._consecutiveIdleChecks = 0;
        this._streamingActive = false;

        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);

        this.updateState({
            isUserTyping: false,
            isChatProcessing: false,
            isComplete: false,
            hasError: false,
            errorMessage: null,
            currentUserMessage: '',
            currentAssistantResponse: '',
            currentAssistantResponseHtml: '',
            startTime: null,
            endTime: null,
            userMessageSent: false,
            waitingForResponse: false,
            responseReceived: false,
            pendingUserAction: {
                isPending: false,
                type: null,
                description: null,
                detectedAt: null,
                severity: 'medium',
                suggestedAction: null,
                autoResolved: false,
                resolvedAt: null,
                resolutionMethod: null
            }
        });

        this.endCurrentSession();
        this.startNewSession();

        this._log('info', 'Состояние сброшено, начата новая сессия');
    }

    destroy() {
        this.endCurrentSession();

        if (this._mutationIdleTimer) clearInterval(this._mutationIdleTimer);
        if (this.responseTimeoutTimer) clearTimeout(this.responseTimeoutTimer);
        if (this._actionButtonPollingInterval) clearInterval(this._actionButtonPollingInterval);

        if (this.chatInput && this._enterKeyHandler) {
            this.chatInput.removeEventListener('keydown', this._enterKeyHandler);
        }
        if (this.sendButton && this._clickHandler) {
            this.sendButton.removeEventListener('click', this._clickHandler);
        }

        if (this.domObserver) this.domObserver.disconnect();
        if (this.attributeObserver) this.attributeObserver.disconnect();
        if (this.responseObserver) this.responseObserver.disconnect();
        if (this.typingDebounceTimer) clearTimeout(this.typingDebounceTimer);

        console.log(`${LOG_PREFIX} 🛑 Мониторинг чата остановлен`);
    }
}

// Экспорт для модульной системы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeepSeekChatMonitor };
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.DeepSeekChatMonitor = DeepSeekChatMonitor;
}