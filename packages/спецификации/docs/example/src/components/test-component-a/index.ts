import { BaseComponent } from '../../base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';

export interface TestComponentAState {
    title: string;
    items: string[];
    counter: number;
}

export class TestComponentA extends BaseComponent {
    static override observedAttributes = ['title', 'data-source'];

    constructor() {
        super();
        this._templateMethods = template;
        this.state = {
            title: 'Test Component A',
            items: ['Элемент 1', 'Элемент 2'],
            counter: 0
        };
    }

    override async _componentReady(): Promise<void> {
        this._controller = controller(this);
        this._actions = await createActions(this);
        await this.fullRender(this.state);
    }

    override async _componentAttributeChanged(name: string, oldValue: string | null, newValue: string | null): Promise<void> {
        if (name === 'title' && newValue !== oldValue) {
            this.state.title = newValue || 'Test Component A';
            await this.updateElement({
                selector: '.title',
                value: this.state.title,
                property: 'textContent'
            });
        }
    }

    override async postMessage(event: any): Promise<any> {
        try {
            switch (event.type) {
                case 'ADD_ITEM':
                    const newItem = event.data?.item || `Новый элемент ${Date.now()}`;
                    (this.state as TestComponentAState).items.push(newItem);
                    await this.fullRender(this.state);
                    return { success: true, items: (this.state as TestComponentAState).items };

                case 'REMOVE_ITEM':
                    const index = event.data?.index;
                    if (index >= 0 && index < (this.state as TestComponentAState).items.length) {
                        (this.state as TestComponentAState).items.splice(index, 1);
                        await this.fullRender(this.state);
                        return { success: true, items: (this.state as TestComponentAState).items };
                    }
                    return { success: false, error: 'Invalid index' };

                case 'INCREMENT_COUNTER':
                    (this.state as TestComponentAState).counter++;
                    await this.updateElement({
                        selector: '.counter',
                        value: `Счетчик: ${(this.state as TestComponentAState).counter}`,
                        property: 'textContent'
                    });
                    return { success: true, counter: (this.state as TestComponentAState).counter };

                case 'GET_STATE':
                    return { success: true, state: this.state };

                case 'RESET_COMPONENT':
                    this.state = {
                        title: 'Test Component A',
                        items: ['Элемент 1', 'Элемент 2'],
                        counter: 0
                    };
                    await this.fullRender(this.state);
                    return { success: true, state: this.state };

                case 'UPDATE_TITLE':
                    this.state.title = event.data?.title || 'Test Component A';
                    await this.updateElement({
                        selector: '.title',
                        value: this.state.title,
                        property: 'textContent'
                    });
                    return { success: true, title: this.state.title };

                default:
                    console.warn(`[TestComponentA] Неизвестный тип сообщения: ${event.type}`);
                    return { success: false, error: 'Unknown message type' };
            }
        } catch (error) {
            this.addError({
                componentName: this.constructor.name,
                source: 'postMessage',
                message: `Ошибка обработки сообщения ${event.type}`,
                details: error
            });
            return { success: false, error: (error as Error).message };
        }
    }

    override async _componentDisconnected(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }
}

if (!customElements.get('test-component-a')) {
    customElements.define('test-component-a', TestComponentA);
}