import { init, onload, store } from '../../this/index.mjs'
import addEventListener from './controller/addEventListener/index.mjs'
import actions from './actions/index.mjs'
const isFooter = store.get('service').system.footer

const COMPONENT = 'api-footer'

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
        if(isFooter) {
            this.controller = {}
            this._state = {};
            this._doRender = this._doRender.bind(this);
            init(this,'/services/system/src').then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
        } else {
            this._isOnload = true
        }
    }

    connectedCallback() {
        if(isFooter) {
            onload(this)
                .then(async (self) => {
                    self.controller.addEventListener = await addEventListener(self, await actions(self))
                    self.controller.addEventListener.init()
                })
                .catch(e => console.error('error', e))
        }
    }

    disconnectedCallback() {
        if(isFooter) {
            this.controller.addEventListener.terminate()
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