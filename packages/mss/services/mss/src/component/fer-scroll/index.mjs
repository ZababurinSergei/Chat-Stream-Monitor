import { init, onload } from '../../this/init/index.mjs'
import addEventListener from './controller/addEventListener/index.mjs'
import actions from './actions/index.mjs'

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'fer-scroll'
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

    set class(val) {
        this.classList.remove(...this.classList);
        console.log('fer-scroll class: ', val)
        if(val === 'fer-scroll_4') {
            this.classList.add('last')
        } else {
            if(this.classList.contains('last')) {
                this.classList.remove('last')
            }
        }
        this.classList.add(val)
    }

    get class() {
        return this.classList
    }

    set section(val) {
        if (val || val === 0) {
            this.setAttribute('section', val);
        } else {
            this.removeAttribute('section');
        }
    }

    get section() {
        return this.hasAttribute('section') ? this.getAttribute('section') : undefined;
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