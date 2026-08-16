import { init, onload } from '../../this/index.mjs'
import addEventListener from './controller/addEventListener/index.mjs'
import actions from './actions/index.mjs'
import { delay } from '../../this/index.mjs'

const COMPONENT = 'welcome-logo'

const INDEX = class extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'open', 'section', 'class'];
    }
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
    set section(val) {
        if (val) {
            this.setAttribute('section', val);
        } else {
            this.removeAttribute('section');
        }
    }

    get section() {
        return this.hasAttribute('section') ? this.getAttribute('section') : undefined;
    }

    set class(val) {
        this.classList.remove(...this.classList);
        this.classList.add(val)
    }

    get class() {
        return this.classList
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
            this.shadowRoot.querySelector('.welcome-logo').style.cursor = 'text'
            delay(2000).then(() => {
                this.style.visibility = 'hidden'
            })

        } else {
            this.removeAttribute('disabled');
            this.shadowRoot.querySelector('.welcome-logo').style.cursor = 'pointer'
            this.style.visibility = 'visible'
            // this.style.opacity = 1
            // delay(2000).then(() => {
            //
            // })

        }
    }
    get disabled() {
        return this.hasAttribute('disabled');
    }
    constructor() {
        super()
        this.controller = {}
        this._isOnload = false;
        this._state = {};
        this._doRender = this._doRender.bind(this);
        init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
    }

    connectedCallback() {
        onload(this)
            .then(async (self) => {
                self.controller.addEventListener = await addEventListener(self, await actions(self))
                self.controller.addEventListener.init()
            })
            .catch(e => console.error('error', e))
    }

    disconnectedCallback() {
        this.controller.addEventListener.terminate()
        console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`)
    }
}

if(customElements.get(COMPONENT) === undefined) { customElements.define(COMPONENT, INDEX ) };
export default {
    component: COMPONENT,
    description: `Компонент ${COMPONENT}`,
}