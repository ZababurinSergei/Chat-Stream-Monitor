import { TestComponentA } from '..';

/**
 * Actions для Test Component A
 * @module components/test-component-a/actions
 * @version 1.0.0
 * @description Демонстрация обработчиков действий с примерами использования методов BaseComponent
 * @example
 * const actions = await createActions(this);
 * await actions.handleIncrement();
 */
export async function createActions(context: TestComponentA) {
    return {
        handleIncrement: handleIncrement.bind(context),
        handleAddItem: handleAddItem.bind(context),
        handleRemoveItem: handleRemoveItem.bind(context),
        handleFormSubmit: handleFormSubmit.bind(context)
    };
}

/**
 * Увеличивает счетчик с использованием updateElement
 * @async
 * @function handleIncrement
 * @this {TestComponentA} Контекст компонента
 * @returns {Promise<void>}
 * @example
 * await handleIncrement();
 */
async function handleIncrement(this: TestComponentA): Promise<void> {
    (this.state as any).counter++;

    // Использование updateElement для обновления текста
    await this.updateElement({
        selector: '.counter',
        value: `Счетчик: ${(this.state as any).counter}`,
        property: 'textContent'
    });
}

/**
 * Добавляет новый элемент с использованием fullRender
 * @async
 * @function handleAddItem
 * @this {TestComponentA} Контекст компонента
 * @returns {Promise<void>}
 * @example
 * await handleAddItem();
 */
async function handleAddItem(this: TestComponentA): Promise<void> {
    const newItem = `Элемент ${(this.state as any).items.length + 1}`;
    (this.state as any).items.push(newItem);

    // Использование fullRender для полного перерендера
    await this.fullRender(this.state);
}

/**
 * Удаляет элемент по индексу с использованием renderPart
 * @async
 * @function handleRemoveItem
 * @this {TestComponentA} Контекст компонента
 * @param {number} index - Индекс элемента для удаления
 * @returns {Promise<void>}
 * @example
 * await handleRemoveItem(0);
 */
async function handleRemoveItem(this: TestComponentA, index: number): Promise<void> {
    if (index >= 0 && index < (this.state as any).items.length) {
        (this.state as any).items.splice(index, 1);

        // Использование renderPart для частичного рендеринга
        await this.renderPart({
            partName: 'renderList',
            state: { items: (this.state as any).items },
            selector: '.items-list'
        });
    }
}

/**
 * Обрабатывает отправку формы с валидацией
 * @async
 * @function handleFormSubmit
 * @this {TestComponentA} Контекст компонента
 * @param {FormData} formData - Данные формы
 * @returns {Promise<void>}
 * @example
 * const formData = new FormData(form);
 * await handleFormSubmit(formData);
 */
async function handleFormSubmit(this: TestComponentA, formData: FormData): Promise<void> {
    const newItem = formData.get('newItem') as string;

    if (newItem && newItem.trim()) {
        (this.state as any).items.push(newItem.trim());
        await this.fullRender(this.state);

        // Очистка формы через updateElement
        const form = this.shadowRoot!.querySelector('form') as HTMLFormElement;
        if (form) {
            await this.updateElement({
                selector: 'form input[name="newItem"]',
                value: '',
                property: 'value'
            });
        }
    } else {
        // Показ ошибки через модальное окно
        await this.showModal({
            title: 'Ошибка',
            content: 'Пожалуйста, введите значение',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}