import {createLogger} from './logger';

// Объявляем интерфейс для виртуального CSS модуля
interface VirtualCSSModule {
    getCSSForComponent: (componentName: string) => string | null;
    getCSSByPath?: (filePath: string) => string | null;
    getAllCSS?: () => string;
    injectCSS?: () => void;
}

let cssModule: VirtualCSSModule | false = false;

// Функция для асинхронной загрузки CSS модуля
async function loadCSSModule(): Promise<void> {
    try {
        // Используем dynamic import с явным типом
        cssModule = await import('virtual:css') as VirtualCSSModule;
    } catch (e) {
        // console.warn('virtual:css не загружен:', e);
    }
}

// Инициализация CSS модуля при первом использовании
let cssModuleInitialized = false;
async function ensureCSSModule(): Promise<void> {
    if (!cssModuleInitialized) {
        await loadCSSModule();
        cssModuleInitialized = true;
    }
}

const prefix = 'wc';
const log = createLogger(`${prefix}:base-component`);
const exclusion: string[] = [];

export interface ModalOptions {
    title?: string;
    content?: string;
    buttons?: Array<{
        text: string;
        type?: string;
        action?: () => void;
    }>;
    closeOnBackdropClick?: boolean;
}

export interface ErrorData {
    componentName: string;
    source: string;
    message: string;
    details?: any;
    timestamp?: number;
}

export interface RenderPartOptions {
    partName?: string;
    state?: Record<string, any>;
    selector: string;
    method?: 'innerHTML' | 'append' | 'prepend' | 'before' | 'after';
}

export interface UpdateElementOptions {
    selector: string;
    value: any;
    property?: string;
    action?: 'set' | 'append' | 'prepend' | 'toggle' | 'add' | 'remove';
}

export interface TemplateMethods {
    [key: string]: (params: { state: Record<string, any>; context: BaseComponent }) => string | Promise<string>;
}

export interface Controller {
    init: () => Promise<void>;
    destroy: () => Promise<void>;
}

export interface Actions {
    [key: string]: (...args: any[]) => Promise<any>;
}

export interface PostMessageEvent {
    type: string;
    data?: any;
    source?: string;
}

/*** Абстрактный базовый класс компонента
 * @abstract
 * @version 5.0.1
 */
export abstract class BaseComponent extends HTMLElement {
    static pendingRequests = new Map<string, BaseComponent>();
    static observedAttributes = ['*'];
    static MAX_POLLING_INTERVAL = 100; // ms
    static errorStore: ErrorData[] = [];
    static ERROR_STORE_LIMIT = 10; // Лимит записей

    protected _templateMethods?: TemplateMethods;
    protected _controller?: Controller;
    protected _actions?: Actions;
    protected state: Record<string, any> = {};

    readonly createLogger: typeof createLogger;
    readonly getComponentAsync: typeof BaseComponent.getComponentAsync;
    readonly addError: typeof BaseComponent.addError;
    readonly getErrors: typeof BaseComponent.getErrors;
    readonly clearErrors: typeof BaseComponent.clearErrors;
    readonly pendingRequests: typeof BaseComponent.pendingRequests;

    #templateImported = false;
    #isLoading = false;
    #id: string;

    constructor() {
        super();
        if (new.target === BaseComponent) {
            throw new Error('ЯТО-ABS1: Нельзя инстанциировать BaseComponent напрямую');
        }

        if (!this.shadowRoot) {
            this.attachShadow({mode: 'open'});
        }

        this.#templateImported = false;
        this.createLogger = createLogger;
        this.getComponentAsync = BaseComponent.getComponentAsync;
        this.addError = BaseComponent.addError;
        this.getErrors = BaseComponent.getErrors;
        this.clearErrors = BaseComponent.clearErrors;
        this.pendingRequests = BaseComponent.pendingRequests;

        this.#id = BaseComponent.generateId();
        this.#isLoading = false;
        log(`Создан экземпляр ${this.constructor.name} с ID: ${this.#id}`);
    }

    /**
     * Добавляет ошибку в статическое хранилище ошибок.
     */
    static addError(errorData: ErrorData): void {
        const errorEntry: ErrorData = {
            timestamp: Date.now(),
            ...errorData
        };

        BaseComponent.errorStore.unshift(errorEntry);

        if (BaseComponent.errorStore.length > BaseComponent.ERROR_STORE_LIMIT) {
            BaseComponent.errorStore = BaseComponent.errorStore.slice(0, BaseComponent.ERROR_STORE_LIMIT);
        }

        console.error(`Ошибка добавлена в хранилище. Всего записей: ${BaseComponent.errorStore.length}`, errorEntry);
    }

    /**
     * Получает копию текущего хранилища ошибок.
     */
    static getErrors(): ErrorData[] {
        return [...BaseComponent.errorStore];
    }

    /**
     * Очищает хранилище ошибок.
     */
    static clearErrors(): void {
        BaseComponent.errorStore = [];
        log('Хранилище ошибок очищено.');
    }

    /**
     * Отображает универсальное модальное окно.
     */
    async showModal(options: ModalOptions = {}): Promise<void> {
        const {
            title = 'Информация',
            content = '',
            buttons = [],
            closeOnBackdropClick = true
        } = options;

        return new Promise((resolve) => {
            const modalBackdrop = document.createElement('div');
            modalBackdrop.className = 'yato-modal-backdrop';

            const currentModal = document.body.querySelector('.yato-modal-backdrop');
            if (currentModal) {
                currentModal.remove();
            }

            const closeModal = (): void => {
                if (modalBackdrop.parentNode) {
                    modalBackdrop.parentNode.removeChild(modalBackdrop);
                }
                resolve();
            };

            const modalWrapper = document.createElement('div');
            modalWrapper.className = 'yato-modal-wrapper';
            modalWrapper.setAttribute('role', 'dialog');
            modalWrapper.setAttribute('aria-modal', 'true');
            modalWrapper.setAttribute('aria-labelledby', 'yato-modal-title');

            const modalContent = document.createElement('div');
            modalContent.className = 'yato-modal-content';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'yato-modal-header';

            const modalTitle = document.createElement('h3');
            modalTitle.id = 'yato-modal-title';
            modalTitle.className = 'yato-modal-title';
            modalTitle.textContent = title;

            const modalCloseButton = document.createElement('button');
            modalCloseButton.type = 'button';
            modalCloseButton.className = 'yato-modal-close-button';
            modalCloseButton.setAttribute('aria-label', 'Закрыть');
            modalCloseButton.innerHTML = '&times;';

            const modalBody = document.createElement('div');
            modalBody.className = 'yato-modal-body';
            modalBody.innerHTML = content;

            const modalFooter = document.createElement('div');
            modalFooter.className = 'yato-modal-footer';

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(modalCloseButton);
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);

            if (buttons && buttons.length > 0) {
                buttons.forEach(btnConfig => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = `yato-button ${btnConfig.type ? btnConfig.type : 'secondary'}`;
                    button.textContent = btnConfig.text || 'OK';
                    button.onclick = () => {
                        if (typeof btnConfig.action === 'function') {
                            try {
                                btnConfig.action();
                            } catch (e) {
                                console.error('Ошибка в обработчике кнопки модального окна:', e);
                            }
                        }
                        closeModal();
                    };
                    modalFooter.appendChild(button);
                });
                modalContent.appendChild(modalFooter);
            } else {
                const defaultCloseButton = document.createElement('button');
                defaultCloseButton.type = 'button';
                defaultCloseButton.className = 'yato-button primary';
                defaultCloseButton.textContent = 'Закрыть';
                defaultCloseButton.onclick = closeModal;
                modalFooter.appendChild(defaultCloseButton);
                modalContent.appendChild(modalFooter);
            }

            modalWrapper.appendChild(modalContent);
            modalBackdrop.appendChild(modalWrapper);

            modalCloseButton.onclick = closeModal;
            if (closeOnBackdropClick !== false) {
                modalBackdrop.onclick = (event) => {
                    if (event.target === modalBackdrop) {
                        closeModal();
                    }
                };
            }

            const handleKeyDown = (event: KeyboardEvent): void => {
                if (event.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleKeyDown);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.body.appendChild(modalBackdrop);
        });
    }

    static generateId(): string {
        return 'yato-' + Math.random().toString(36).substr(2, 9);
    }

    async connectedCallback(): Promise<void> {
        try {
            log(`${this.constructor.name} подключается к DOM.`);
            await this.#initComponent();
            log(`${this.constructor.name} готов.`);
        } catch (error) {
            console.error(`Ошибка в connectedCallback для ${this.constructor.name}:`, error);
            await this.#render({state: {error: (error as Error).message}});
        }
    }

    async disconnectedCallback(): Promise<void> {
        log(`${this.constructor.name} отключен от DOM.`);
        await this._componentDisconnected();
    }

    async adoptedCallback(): Promise<void> {
        log(`${this.constructor.name} перемещен в новый документ.`);
        await this._componentAdopted();
    }

    async attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): Promise<void> {
        if (oldValue === newValue) return;
        if (this.#templateImported) {
            await this._componentAttributeChanged(name, oldValue, newValue);
            log(`Атрибут ${name} изменился с '${oldValue}' на '${newValue}'.`);
        }
    }

    async #initComponent(): Promise<void> {
        const type = this.dataset.type;

        if (!exclusion.includes(this.tagName)) {
            this.#templateImported = true;
            if (type !== "server" && !this.hasAttribute('data-no-render')) {
                await this.#loadComponentStyles();
                await this.showSkeleton();
            }
        }

        await this._componentReady();
        await this.#registerComponent();
    }

    async #loadComponentStyles(): Promise<void> {
        const componentTagName = (this.constructor as any).tagName || this.tagName.toLowerCase();

        // Убеждаемся, что CSS модуль загружен
        await ensureCSSModule();

        if (cssModule) {
            // Импортируем CSS из виртуального модуля
            const componentCSS = cssModule.getCSSForComponent(componentTagName);

            if (componentCSS) {
                const style = document.createElement('style');
                style.textContent = componentCSS;
                if (this.shadowRoot) {
                    this.shadowRoot.appendChild(style);
                }
                log(`Стили для ${this.constructor.name} загружены из бандла`);
            } else {
                console.warn(`CSS для компонента ${componentTagName} не найден в бандле`);
            }
        } else {
            // console.error(`Ошибка загрузки стилей для ${this.constructor.name}: CSS module not available`);
            // Fallback: пытаемся загрузить через динамический импорт
            try {
                let cssPath = new URL(`../components/${componentTagName}/css/index.css`, import.meta.url);
                const style = document.createElement('style');
                style.textContent = `@import url('${cssPath.pathname}');`;
                if (this.shadowRoot) {
                    this.shadowRoot.appendChild(style);
                }
                log(`Стили для ${this.constructor.name} загружены через fallback`);
            } catch (fallbackError) {
                console.error(`Fallback загрузки стилей также не удалась:`, fallbackError);
            }
        }

    }

    async showSkeleton(): Promise<void> {
        this.#isLoading = true;
        const container = this.shadowRoot!.querySelector('#root') || document.createElement('div');
        container.id = 'root';
        container.classList.add('skeleton-container');

        if (!this.shadowRoot!.querySelector('#skeleton-styles')) {
            const style = document.createElement('style');
            style.id = 'skeleton-styles';
            style.textContent = `/* Универсальные стили скелетона для всех компонентов */
        :host { position: relative; }
        .skeleton-container * { pointer-events: none !important; user-select: none !important; }
        .skeleton-container :not(style, script, link, meta) {
          color: transparent !important; background-size: 200% 100% !important;
          animation: skeleton-loading 1.5s infinite !important; border-color: transparent !important;
          box-shadow: none !important;
        }
        .skeleton-container :not(style, script, link, meta)::before {
          content: "" !important; position: absolute !important; top: 0 !important;
          left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: inherit !important; border-radius: inherit !important; z-index: 1 !important;
        }
        @keyframes skeleton-loading {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        [data-theme="dark"] .skeleton-container :not(style, script, link, meta) {
          background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%) !important;
        }
        .skeleton-container form, .skeleton-container input, .skeleton-container textarea,
        .skeleton-container select, .skeleton-container button {
          opacity: 1 !important; visibility: visible !important; display: block !important;
        }
        .skeleton-container img, .skeleton-container [class*="avatar"],
        .skeleton-container [class*="circle"] { border-radius: 50% !important; }`;
            if (this.shadowRoot) {
                this.shadowRoot.appendChild(style);
            }
        }

        if (!this.shadowRoot!.querySelector('#root')) {
            if (this.shadowRoot) {
                this.shadowRoot.appendChild(container);
            }
        }
    }

    async hideSkeleton(): Promise<void> {
        this.#isLoading = false;
        const container = this.shadowRoot!.querySelector('#root');
        if (container) {
            container.classList.remove('skeleton-container');
        }
    }

    isLoading(): boolean {
        return this.#isLoading;
    }

    async fullRender(state: Record<string, any> = {}): Promise<boolean> {
        try {
            await this.#render({state});
            log(`Полный рендеринг выполнен для ${this.constructor.name}`);
            return true;
        } catch (error) {
            console.error(`Ошибка полного рендеринга:`, error);
            return false;
        }
    }

    async renderPart(options: RenderPartOptions): Promise<boolean> {
        try {
            const {partName = 'defaultTemplate', state = {}, selector, method = 'innerHTML'} = options;

            if (!this._templateMethods || !this._templateMethods[partName]) {
                console.error(`Метод шаблона '${partName}' не найден в ${this.constructor.name}`);
                return false;
            }

            if (!selector) {
                console.error(`Не указан селектор для рендеринга части '${partName}'`);
                return false;
            }

            const targetElement = this.shadowRoot!.querySelector(selector);
            if (!targetElement) {
                console.error(`Элемент с селектором '${selector}' не найден`);
                return false;
            }

            const htmlContent = await this._templateMethods[partName]({state, context: this});

            switch (method) {
                case 'innerHTML':
                    targetElement.innerHTML = htmlContent;
                    break;
                case 'append':
                    targetElement.insertAdjacentHTML('beforeend', htmlContent);
                    break;
                case 'prepend':
                    targetElement.insertAdjacentHTML('afterbegin', htmlContent);
                    break;
                case 'before':
                    targetElement.insertAdjacentHTML('beforebegin', htmlContent);
                    break;
                case 'after':
                    targetElement.insertAdjacentHTML('afterend', htmlContent);
                    break;
                default:
                    console.error(`Неизвестный метод вставки: ${method}`);
                    return false;
            }

            log(`Часть '${partName}' успешно отрендерена в '${selector}' методом '${method}'`);
            await this.#waitForDOMUpdate();
            await this.#setupEventListeners();
            return true;

        } catch (error) {
            console.error(`Ошибка рендеринга части '${options.partName}':`, error);
            this.addError({
                componentName: this.constructor.name,
                source: 'renderPart',
                message: `Ошибка рендеринга части ${options.partName}`,
                details: error
            });
            return false;
        }
    }

    async updateElement(options: UpdateElementOptions): Promise<boolean> {
        try {
            const {selector, value, property = 'textContent', action = 'set'} = options;

            if (!selector) {
                console.warn(`[Компонент] Не указан селектор для обновления элемента`);
                return false;
            }

            const targetElement = this.shadowRoot!.querySelector(selector);
            if (!targetElement) {
                console.warn(`[Компонент] Элемент с селектором '${selector}' не найден`);
                return false;
            }

            switch (action) {
                case 'set':
                    if (property === 'style' && typeof value === 'object') {
                        Object.assign((targetElement as HTMLElement).style, value);
                    } else if (property === 'className' && typeof value === 'string') {
                        targetElement.className = value;
                    } else if (property === 'dataset.theme' && typeof value === 'string') {
                        (targetElement as HTMLElement).dataset.theme = value;
                    } else {
                        (targetElement as any)[property] = value;
                    }
                    break;

                case 'append':
                    if (property === 'innerHTML' || property === 'textContent') {
                        (targetElement as any)[property] += value;
                    } else if (property === 'value') {
                        (targetElement as HTMLInputElement).value += String(value);
                    }
                    break;

                case 'prepend':
                    if (property === 'innerHTML' || property === 'textContent') {
                        (targetElement as any)[property] = value + (targetElement as any)[property];
                    } else if (property === 'value') {
                        (targetElement as HTMLInputElement).value = String(value) + (targetElement as HTMLInputElement).value;
                    }
                    break;

                case 'toggle':
                    if (property === 'checked' || property === 'disabled' || property === 'hidden') {
                        (targetElement as any)[property] = !(targetElement as any)[property];
                    } else if (property === 'className') {
                        targetElement.classList.toggle(String(value));
                    }
                    break;

                case 'add':
                    if (property === 'className') {
                        targetElement.classList.add(String(value));
                    }
                    break;

                case 'remove':
                    if (property === 'className') {
                        targetElement.classList.remove(String(value));
                    }
                    break;

                default:
                    console.warn(`[Компонент] Неизвестное действие: ${action}`);
                    return false;
            }

            return true;

        } catch (error) {
            console.error(`[Компонент] Ошибка обновления элемента '${options.selector}':`, error);
            this.addError({
                componentName: this.constructor.name,
                source: 'updateElement',
                message: `Ошибка обновления элемента ${options.selector}`,
                details: error
            });
            return false;
        }
    }

    async #render(params: { partName?: string; state?: Record<string, any>; selector?: string } = {}): Promise<void> {
        try {
            const {partName = 'defaultTemplate', state = {}, selector = '*'} = params;

            if (this._templateMethods) {
                const storedState = this.state || {};
                const mergedState = {...storedState, ...state};

                const rootContainer = document.createElement('div');
                const templatePartName = this._templateMethods[partName] ? partName : 'default';

                // Добавляем проверку на существование метода
                if (this._templateMethods[templatePartName]) {
                    const templateResult = await this._templateMethods[templatePartName]({
                        state: mergedState,
                        context: this
                    });
                    rootContainer.insertAdjacentHTML('beforeend', templateResult);
                    rootContainer.id = 'root';

                    if (selector === '*') {
                        const existingRoot = this.shadowRoot!.querySelector('#root');
                        if (existingRoot) {
                            existingRoot.remove();
                        }
                        if (this.shadowRoot) {
                            this.shadowRoot.appendChild(rootContainer);
                        }
                    } else {
                        const targetElement = this.shadowRoot!.querySelector(selector);
                        if (targetElement) {
                            targetElement.innerHTML = '';
                            targetElement.appendChild(rootContainer);
                        }
                    }

                    await this.#waitForDOMUpdate();
                    await this.#setupEventListeners();
                    await this.hideSkeleton();
                    log(`${this.constructor.name} отрендерен с состоянием:`, mergedState);
                } else {
                    console.error(`Метод шаблона '${templatePartName}' не найден`);
                }
            } else {
                console.error(`${this.constructor.name} темплейт не определен`);
            }
        } catch (error) {
            console.error(`Ошибка рендеринга для ${this.constructor.name}:`, error);
            if (this.shadowRoot) {
                this.shadowRoot.innerHTML = `<p style="color:red;">Ошибка рендеринга: ${(error as Error).message}</p>`;
            }
        }
    }

    async #waitForDOMUpdate(timeout = 100): Promise<void> {
        return new Promise(resolve => {
            const rafId = requestAnimationFrame(() => {
                clearTimeout(timeoutId);
                resolve();
            });
            const timeoutId = setTimeout(() => {
                cancelAnimationFrame(rafId);
                resolve();
            }, timeout);
        });
    }

    async #setupEventListeners(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }

        if (this._controller?.init) {
            await this._controller.init();
        }
        log(`${this.constructor.name} настройка обработчиков событий (базовая реализация).`);
    }

    async #registerComponent(): Promise<void> {
        try {
            if (!this.id) {
                console.error('ЯТО-ID1: Компонент желательно имеет ID для регистрации');
                throw new Error('ЯТО-ID1: Компонент требует ID');
            }
            const key = `${this.tagName.toLowerCase()}:${this.id}`;
            BaseComponent.pendingRequests.set(key, this);
            if (this.tagName.toLowerCase() === 'navigation-manager' || this.tagName.toLowerCase() === 'navigation-sections') {
                log(`${this.constructor.name} с ID ${this.id} зарегистрирован.`);
            }
        } catch (e) {
            console.error((e as Error).toString(), this.tagName.toLowerCase());
        }
    }

    /**
     * Асинхронно получает экземпляр компонента, ожидая его регистрации, если необходимо.
     */
    static async getComponentAsync(tagName: string, id: string, timeout = 5000): Promise<BaseComponent | null> {
        const key = `${tagName}:${id}`;
        let component = BaseComponent.pendingRequests.get(key);

        if (component) {
            return Promise.resolve(component);
        }

        return new Promise((resolve) => {
            let resolved = false;
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.error(`Таймаут ожидания компонента '${key}'.`);
                    resolve(null);
                }
            }, timeout);

            const checkComponent = (): void => {
                if (resolved) return;
                component = BaseComponent.pendingRequests.get(key);
                if (component) {
                    clearTimeout(timeoutId);
                    resolved = true;
                    log(`Асинхронно найден зарегистрированный компонент '${key}'.`);
                    resolve(component);
                } else {
                    setTimeout(checkComponent, BaseComponent.MAX_POLLING_INTERVAL);
                }
            };

            checkComponent();
        });
    }

    async postMessage(_event: PostMessageEvent): Promise<any> {
        log(`сообщение для компонента ${this.constructor.name} отправлено.`);
        return {success: true, message: 'Base handler - override in child components'};
    }

    async _componentReady(): Promise<void> {
        log(`${this.constructor.name} компонент готов (базовая реализация).`);
    }

    async _componentAttributeChanged(_name: string, _oldValue: string | null, _newValue: string | null): Promise<void> {
        log(`${this.constructor.name} Атрибуты изменены (базовая реализация).`);
    }

    async _componentAdopted(): Promise<void> {
        log(`${this.constructor.name} компонент перемещен (базовая реализация).`);
    }

    async _componentDisconnected(): Promise<void> {
        log(`${this.constructor.name} компонент отключен (базовая реализация).`);
    }
}