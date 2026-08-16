import { init, onload, store } from '../../this/index.mjs'
import { controller } from './controller/index.mjs'
import actions from './actions/index.mjs'
const serviceConfig = store.get('service')

const COMPONENT = 'api-property'
const INDEX = class extends HTMLElement {
    _doRender() {

    }
    getState(path) {
        return this._state[path];
    }
    setState(path, value) {
        if (!this._state.hasOwnProperty(path)) {
            alert(`надо определить свойство ${path} в стейте`)
            console.assert(false, `надо определить свойство ${path} в стейте`, {
                state: this._state
            })
            
        } else {
            if (this._state[path] !== value) {
                this._state[path] = value;
                this._doRender();
            }
        }
    }
    set open(val) {
        if (val) {
            this.setAttribute('open', '');
            this.classList.add('skeleton')
        } else {
            this.removeAttribute('open');
            this.classList.remove('skeleton')
        }
    }
    get open() {
        return this.hasAttribute('open');
    }
    set disabled(val) {
        if (val) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    get disabled() {
        return this.hasAttribute('disabled');
    }
    constructor() {
        super()
        this._isOnload = false;
        if(serviceConfig?.system?.property) {
            this.controller = {}
            this._state = {
                header: undefined,
                property: undefined,
                queue: [],
            };
            this._doRender = this._doRender.bind(this);
            init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
        } else {
            self._isOnload = true
        }
    }

    connectedCallback() {
        if(serviceConfig?.system?.property) {
            onload(this)
                .then(async (self) => {
                    self.controller = await controller(self, await actions(self))
                    self.controller.addEventListener.init()
                    self.controller.addTaskListener.init()
                })
                .catch(e => console.error('error', e))
        }
    }

    disconnectedCallback() {
        if(serviceConfig?.system?.property) {
            this.controller.addEventListener.terminate()
            this.controller.addTaskListener.terminate()
            console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`)
        }
    }
}

try {
    customElements.define(COMPONENT, INDEX);
} catch (e) {
    console.error('error', e)
}
export default {
    component: COMPONENT,
    description: `Компонент ${COMPONENT}`,
}