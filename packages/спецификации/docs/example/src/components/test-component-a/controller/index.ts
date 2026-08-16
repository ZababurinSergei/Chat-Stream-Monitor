import { TestComponentA } from '..';

export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
}

export const controller = (context: TestComponentA) => {
    let eventListeners: EventListener[] = [];

    const addEventListener = (
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject
    ): void => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };

    return {
        async init(): Promise<void> {
            // Делегирование кликов через shadowRoot
            addEventListener(context.shadowRoot!, 'click', (e: Event) => {
                const target = e.target as HTMLElement;

                if (target.classList.contains('btn-increment')) {
                    (context as any)._actions.handleIncrement();
                }

                if (target.classList.contains('btn-add')) {
                    (context as any)._actions.handleAddItem();
                }
            });

            // Обработка формы
            const form = context.shadowRoot!.querySelector('form');
            if (form) {
                addEventListener(form, 'submit', (e: Event) => {
                    e.preventDefault();
                    const formData = new FormData(form as HTMLFormElement);
                    (context as any)._actions.handleFormSubmit(formData);
                });
            }

            // Обработка клавиатуры (пример горячих клавиш)
            addEventListener(context, 'keydown', (e: Event) => {
                const keyboardEvent = e as KeyboardEvent;
                if (keyboardEvent.ctrlKey && keyboardEvent.key === 'i') {
                    e.preventDefault();
                    (context as any)._actions.handleIncrement();
                }
            });

            // Пример обработки внешних событий
            addEventListener(window, 'component-a:increment', () => {
                (context as any)._actions.handleIncrement();
            });
        },

        async destroy(): Promise<void> {
            // Автоматическая очистка всех слушателей
            eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            eventListeners = [];
        }
    };
};