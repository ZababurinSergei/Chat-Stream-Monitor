import { onload, store } from '../../this/index.mjs';
import { isLatin, template } from './views/index.mjs';

const COMPONENT = 'fer-dialog';

export function semverRegex () {
    return /(?<=^v?|\sv?)(?:(?:0|[1-9]\d{0,9}?)\.){2}(?:0|[1-9]\d{0,9})(?:-(?:--+)?(?:0|[1-9]\d*|\d*[a-z]+\d*)){0,100}(?=$| |\+|\.)(?:(?<=-\S+)(?:\.(?:--?|[\da-z-]*[a-z-]\d*|0|[1-9]\d*)){1,100}?)?(?!\.)(?:\+(?:[\da-z]\.?-?){1,100}?(?!\w))?(?!\+)/gi;
};

const ferNotificetion = document.querySelector('fer-notification');

const INDEX = class extends HTMLElement {
    static get observedAttributes () {
        return ['disabled', 'open', 'message'];
    }

    _doRender () {
        console.log('     🔵 RENDER');
        if (this._state.tree) {

        }
    }

    getState (path) {
        return this._state[path];
    }

    setState (path, value) {
        if (!this._state.hasOwnProperty(path)) {
            alert(`надо определить свойство ${path} в стейте`);
            console.assert(false, `надо определить свойство ${path} в стейте`, {
                state: this._state
            });

        } else {
            if (this._state[path] !== value) {
                this._state[path] = value;
                this._doRender();
            }
        }
    }

    inputDictionary  = (event) => {
        const target = event.target
        const section = store.get('section')
        const welcomeSection = document.body.querySelector(`welcome-section[data-id="${section}"]`);
        const ferTable = welcomeSection.querySelector('fer-table')

        if(target.dataset.field === 'code') {
            ferTable.controller.api.input.code(event, {
                type:'fer-dialog'
            })
        } else if(target.dataset.field === 'name') {
            ferTable.controller.api.input.name(event, {
                type:'fer-dialog'
            })
        } else {
            console.log('надо посмотреть')
            debugger
        }
    };

    inputActions = (event) => {
        const input = event.target.closest('.input');

        if (event.target.value.length === 0) {
            delete input.dataset.value;
        } else {
            input.dataset.value = event.target.value;
        }

        input.dataset.id = event.target.id;
    };
    actionNext = async (event, object) => {
        switch (this.dataset.id) {
        default:
            console.warn('необрабатываемое событие dialog next', self);
            break;
        }
    };
    actionClose = (event) => {
        ferNotificetion.closeToasts();
        let id = this.dataset.id
        if(this.dataset.id === '7-update' || this.dataset.id === '7-restore') {
            id = '7'
        }

        let welcomeSection = document.querySelector(`welcome-section[data-id="${id}"]`)

        switch (this.dataset.id) {
            case '0':
                welcomeSection.cleanState('directory')
                store.remove('create_schema');
                const mssFilter = document.querySelector('mss-filter');
                const container = mssFilter.shadowRoot.querySelector('.container');
                const buttonAdd = container.querySelector('.button_add')
                buttonAdd.removeAttribute('disabled')
                break;
            case '5':
                welcomeSection.cleanState('all');
                delete this.dataset.mappingId;
                break;
            case '7-restore':
            case '7-update':
            case '7':
                welcomeSection.cleanState('subscription')
                break;
            case '5_0':
                delete this.dataset.mappingItemId;
            default:
                console.warn('необрабатываемое событие dialog next', this.dataset.id)
                break;
            }
            this.open = false;
    };

    actionRemove = (event, detail) => {
        switch (detail.id) {
        case '0':
            document.dispatchEvent(
                new CustomEvent('fer-table_card_remove', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        id: this.dataset.id,
                        itemId: this.dataset.itemId
                    }
                }));
            break;
        case '6_0':
            document.dispatchEvent(
                new CustomEvent('fer-table_card_remove', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        id: this.dataset.id,
                        itemId: this.dataset.itemId,
                        interactionId: this.dataset.interactionId
                    }
                }));
            break;
        case '7':
            document.dispatchEvent(
                new CustomEvent('fer-dialog_remove_subscription', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        id: this.dataset.id,
                        subscriptionId: this.dataset.subscriptionId
                    }
                }));
            break;
        case '7_0':
            document.dispatchEvent(
                new CustomEvent('fer-dialog_subscriptionSettings_delete', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        id: this.dataset.id,
                        itemId: this.dataset.itemId
                    }
                }));
            break;
        default:
            console.warn('неизвестный id', detail);
            break;
        }
        this.open = false;
    };
    actionUpdate = (event) => {
        ferNotificetion.closeToasts();
        switch (this.dataset.id) {
        case '0':
            const target = event.currentTarget
            const section = store.get('section')
            const welcomeSection = document.body.querySelector(`welcome-section[data-id="${section}"]`);
            const ferTable = welcomeSection.querySelector('fer-table')

            if(target.dataset.field === 'update') {
                ferTable.controller.api.button.edit(event, {
                    type:'fer-dialog',
                    field: target.dataset.field,
                    currentTarget: target.closest('.content')
                })
            } else {
                console.log('надо посмотреть')
                debugger
            }
            break
        case '6_0':
            document.dispatchEvent(
                new CustomEvent('fer-dialog_ruleSettings_update', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        id: this.dataset.id,
                        itemId: this.dataset.itemId,
                        interactionId: this.dataset.interactionId
                    }
                }));
            break
            case '7':
                document.dispatchEvent(
                    new CustomEvent('fer-dialog_subscription_update', {
                        bubbles: true,
                        cancelable: false,
                        composed: true,
                        detail: {
                            id: this.dataset.id,
                            subscriptionId: this.dataset.subscriptionId,
                            interactionId: this.dataset.interactionId
                        }
                    }));
                break
            case '7_0':
                document.dispatchEvent(
                    new CustomEvent('fer-dialog_subscriptionSettings_restore', {
                        bubbles: true,
                        cancelable: false,
                        composed: true,
                        detail: {
                            id: this.dataset.id,
                            itemId: this.dataset.itemId,
                            value: this.dataset.value
                        }
                    }));
                break;
        default:
            console.warn('неизвестный тип нажатия кнопки в  dialog', this.dataset.id, this);
            break;
        }
    };
    actionSave = (event) => {
        let inputs = null;
        ferNotificetion.closeToasts();

        switch (this.dataset.id) {
        case '0':
            const target = event.currentTarget
            const section = store.get('section')
            const welcomeSection = document.body.querySelector(`welcome-section[data-id="${section}"]`);
            const ferTable = welcomeSection.querySelector('fer-table')

            if(target.dataset.field === 'cancel') {
                ferTable.controller.api.button.delete(event, {
                    type:'fer-dialog',
                    field: target.dataset.field
                })
            } else if(target.dataset.field === 'save') {
                ferTable.controller.api.button.edit(event, {
                    type:'fer-dialog',
                    field: target.dataset.field,
                    currentTarget: target.closest('.content')
                })
            } else {
                console.log('надо посмотреть')
                debugger
            }
            break
        case '7':
            let result = {
                'active': true,
                'createdAt': undefined,
                'recipientId': undefined,
                'interactionId': undefined,
                'startAt': undefined,
                'endAt': undefined
            };

            const ferSelect = this.shadowRoot.querySelectorAll('fer-select')
            const mssDatapicker = this.shadowRoot.querySelector('mss-datapicker')

            const date = mssDatapicker.getState('date')

            result.createdAt = new Date(Date.now()).toISOString()
            result.startAt = date.startAt
            result.endAt = date.endAt

            ferSelect.forEach(item => {
                if(item.dataset.recipientId) {
                    result.recipientId = item.dataset.recipientId
                }
                if(item.dataset.interactionId) {
                    result.interactionId = item.dataset.interactionId
                }
            })

            document.dispatchEvent(
                new CustomEvent('fer-table_add_subscription', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        type: 'createSubscription',
                        id: this.dataset.id,
                        to: this.dataset.to,
                        subscription: result
                    }
                })
            );
            break;
        case '7-update':
            document.dispatchEvent(
                new CustomEvent('fer-table_add_subscription', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        type: 'update',
                        id: "7",
                        to: this.dataset.to
                    }
                })
            );
            break;
        case '7-restore':
            document.dispatchEvent(
                new CustomEvent('fer-table_add_subscription', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        type: 'restore',
                        id: "7",
                        to: this.dataset.to
                    }
                })
            );
            break;
        case '6':
        case '6_0':
            let settings = {
                "active": true,
                "createdAt": undefined,
                "interactionId": undefined,
                "headerId": undefined
            };

            const ferSelectRule = this.shadowRoot.querySelectorAll('fer-select')

            ferSelectRule.forEach(item => {
                if(item.dataset.headerId) {
                    settings.headerId = item.dataset.headerId
                }

                if(item.dataset.interactionId) {
                    settings.interactionId = item.dataset.interactionId
                }
            })

            document.dispatchEvent(
                new CustomEvent('fer-table_add_settingsRule', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                        type: 'createRuleSettings',
                        id: this.dataset.id,
                        to: this.dataset.to,
                        settings: settings
                    }
                })
            );
            break;
        case '5':
            const buttonSave = this.shadowRoot.querySelector('.footer-button.save')

            if(!buttonSave.hasAttribute("disabled")) {
                document.dispatchEvent(
                    new CustomEvent('mss-filter_export', {
                        bubbles: true,
                        cancelable: false,
                        composed: true,
                        detail: {
                            type: 'export',
                            id: this.dataset.id,
                            to: this.dataset.to
                        }
                    })
                );
            }
            break;
        default:
            console.warn('неизвестный тип нажатия кнопки в  dialog', this.dataset.id, this);
            break;
        }
    };

    set open (val) {
        return new Promise(async (resolve, reject) => {
            // const isRules = store.get('mount_rules')?.pathname
            const isRules = true;

            if (isRules) {
                const dialog = this.shadowRoot.querySelector('dialog');
                const content = this.shadowRoot.querySelector('.content');
                const pathname = `/services/${this.dataset.servicesPath}/src`;

                let close = undefined;
                let save = undefined;
                let cancel = undefined;
                let remove = undefined;
                let next = undefined;
                let data = undefined;
                let inputSchema = undefined;
                let inputsBody = []
                let update = undefined;
                let success = undefined;

                content.innerHTML = '';
                delete this.dataset.to;

                const requestNext = (event) => {
                    this.actionNext(event, val.schema);
                    return {
                        event: event,
                        schema: val.schema
                    };
                };
                const requestRemove = (event) => {
                    this.actionRemove(event, val.detail);
                    return {
                        event: event,
                        schema: val.detail
                    };
                };
                if (val) {
                    switch (val.type) {
                    case 'remove':
                        data = await template.get(val.type)[0].template(pathname, val);
                        this.dataset.snapshotId = val.detail.snapshotId;
                        this.dataset.id = val.detail.id;
                        this.dataset.itemId = val.detail.itemId;
                        this.dataset.interactionId = val.detail.interactionId;
                        this.dataset.subscriptionId = val.detail.subscriptionId;
                        this.dataset.value = val.detail.value;
                        break;
                    case 'error':
                        data = await template.get(val.type)[0].template(pathname, val);
                    case 'success':
                        data = await template.get(val.type)[0].template(pathname, val);
                        break;
                    case 'add':
                        data = await template.get(val.type)[0].template(pathname, val);
                        this.dataset.id = val.id;
                        this.dataset.to = val.to;
                        break;
                    case 'update_s':
                    case 'create':
                        data = await template.get(val.type)[0].template(pathname, val);
                        this.dataset.id = val.id;
                        this.dataset.to = val.to;
                        if (val.action) {
                            this.dataset.action = val.action;
                        }
                        if(val.id === '0') {
                            if(val?.detail?.itemId) {
                                this.dataset.itemId = val.detail.itemId;
                            }

                            content.classList.add('body_tr')
                            content.classList.add('card')

                            if(val.type === 'update_s') {
                                content.classList.add('item-update')
                            } else {
                                content.classList.add('new')
                            }
                        }

                        // content.classList.add('new')
                        content.dataset.field = val.type
                        break;
                    case 'update':
                        data = await template.get(val.type)[0].template(pathname, val);
                        this.dataset.id = val.id;
                        this.dataset.to = val.to;
                        this.dataset.itemId = val.itemId? val.itemId: val.detail.itemId;
                        this.dataset.interactionId = val.detail.interactionId;
                        content.dataset.field = val.type
                        break;
                    case 'verification':
                        data = await template.get(val.type)[0].template(pathname, val);
                        break;
                    case 'apply':
                        data = await template.get(val.type)[0].template(pathname, val);
                        break;
                    case 'save':
                        if (val.id === 'save_rules') {
                            this.setState('rule', val.detail);
                            this.setState('ruleStatus', val.status);
                        }
                        data = await template.get(val.type)[0].template(pathname, val);
                        this.dataset.id = val.id;
                        this.dataset.to = val.to;
                        break;
                    default:
                        break;
                    }

                    content.innerHTML = '';
                    content.insertAdjacentHTML('afterbegin', data);

                    inputsBody = this.shadowRoot.querySelectorAll('.input_body');
                    inputSchema = this.shadowRoot.querySelector('#schema');
                    update = this.shadowRoot.querySelector('.update');
                    success = this.shadowRoot.querySelector('.footer-button.success');
                    save = this.shadowRoot.querySelector('.save');
                    next = this.shadowRoot.querySelector('.next');
                    close = this.shadowRoot.querySelector('.close');
                    cancel = this.shadowRoot.querySelector('.cancel');
                    remove = this.shadowRoot.querySelector('.remove') || this.shadowRoot.querySelector('.delete');


                    inputsBody.forEach(item => {
                        item.addEventListener('input', this.inputDictionary);
                    })

                    inputSchema?.addEventListener('input', this.inputActions);
                    save?.addEventListener('click', this.actionSave);
                    update?.addEventListener('click', this.actionUpdate);
                    next?.addEventListener('click', requestNext);
                    cancel?.addEventListener('click', this.actionClose);
                    success?.addEventListener('click', this.actionClose);
                    remove?.addEventListener('click', requestRemove);
                    close?.addEventListener('click', this.actionClose);

                    this.setAttribute('open', '');
                    this.style.display = 'flex';
                    dialog.showModal();

                } else {
                    inputsBody.forEach(item => {
                        item.removeEventListener('input', this.inputDictionary);
                    })
                    inputSchema?.removeEventListener('input', this.inputActions);
                    save?.removeEventListener('click', this.actionSave);
                    update?.removeEventListener('click', this.actionUpdate);
                    cancel?.removeEventListener('click', this.actionClose);
                    success?.removeEventListener('click', this.actionClose);
                    remove?.removeEventListener('click', requestRemove);
                    close?.removeEventListener('click', this.actionClose);
                    next?.removeEventListener('click', requestNext);
                    this.removeAttribute('open');

                    if (content.dataset.field) {
                        delete content.dataset.field;
                    }

                    content.classList.remove('body_tr')
                    content.classList.remove('card')
                    content.classList.remove('new')
                    content.classList.remove('item-update')

                    if (this.dataset.field) {
                        delete this.dataset.field;
                    }

                    if (this.dataset.action) {
                        delete this.dataset.action;
                    }

                    if (this.dataset.snapshotId) {
                        delete this.dataset.snapshotId;
                    }

                    if (this.dataset.to) {
                        delete this.dataset.to;
                    }

                    if (this.dataset.itemId) {
                        delete this.dataset.itemId;
                    }

                    if (this.dataset.id) {
                        delete this.dataset.id;
                    }

                    if (this.dataset.interactionId) {
                        delete this.dataset.interactionId;
                    }

                    if (this.dataset.recipientId) {
                        delete this.dataset.recipientId;
                    }

                    if (this.dataset.value) {
                        delete this.dataset.value;
                    }

                    if (this.dataset.subscriptionId) {
                        delete this.dataset.subscriptionId;
                    }

                    if (inputSchema) {
                        const input = inputSchema.closest('.input');
                        delete input.dataset.id;
                        delete input.dataset.value;
                    }

                    if (this.dataset.interactionId) {
                        delete this.dataset.interactionId;
                    }

                    dialog.close();
                    this.style.display = 'none';
                    content.innerHTML = '';
                }
            }

            resolve(true);
        });
    }

    get open () {
        return this.hasAttribute('open');
    }

    set message (val) {
        console.log('MESSAGE', val);
        if (val) {
            // this.setAttribute('disabled', '');
        } else {
            // this.removeAttribute('disabled');
        }
    }

    get message () {
        // return this.hasAttribute('disabled');
    }

    set disabled (val) {
        if (val) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    get disabled () {
        return this.hasAttribute('disabled');
    }

    constructor () {
        super();
        if (!this.dataset.servicesPath) {
            console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this);
            return;
        }
        this.controller = {};
        this._isOnload = false;
        this._state = {
            ruleStatus: 'create',
            rule: undefined,
            remove: undefined,
            schema: {}
        };
        this._doRender = this._doRender.bind(this);
        import(`/services/${this.dataset.servicesPath}/src/this/init/init/index.mjs`)
            .then(data => {
                data.init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error));
            });
    }

    connectedCallback () {
        onload(this)
            .then(async (self) => {
                const { actions } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/actions/index.mjs`);
                let { controller } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`);
                self.controller = await controller(self, await actions(self));
                await self.controller.addEventListener.init();
                self.request = await self.controller.request.init();
            })
            .catch(e => console.error('error', e));
    }

    disconnectedCallback () {
        this.controller.addEventListener.terminate();
        this.controller.request.terminate();
        this.request = null;
        console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`);
    }

    attributeChangedCallback (attrName, oldVal, newVal) {
        // window.addEventListener("popstate", this.router);
        // this.router()
    }
};

if (customElements.get(COMPONENT) === undefined) {
    customElements.define(COMPONENT, INDEX);
}
;
export default {
    component: COMPONENT,
    description: 'Шаблон компонента в котором сделанно подключение css темплейта',
    source: 'https://codepen.io/raubaca/pen/VejpQP'
};

