import { init, onload } from '../../this/index.mjs'
import addEventListener from './controller/addEventListener/index.mjs'
import actions from './actions/index.mjs'

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'fer-region'
const INDEX =  class extends HTMLElement {
  _doRender(key) {
    const version = this.shadowRoot.querySelector('#version')
    switch (key) {
      case 'schema':
          version.value = this._state[key].version
        break
      case 'config':
        if(this._state[key].disabledInputVersion === 'true') {
          version.setAttribute('readonly', '')
        } else {
          version.removeAttribute('readonly')
        }
        break
      default:
        console.warn('Необрабоатываемый рендер fer-region', key, this)
        break
    }

    if(this._state.tree) {

    }
  }
  getState(path = undefined) {
    if(path) {
      return this._state[path];
    } else {
      return this._state
    }
  }
  setState(path, value) {
    if(!this._state.hasOwnProperty(path)) {
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
  constructor () {
    super()
    this.controller = {};
    this._isOnload = false;
    this._state = {
      config: '',
      rule: undefined,
      schema: undefined
    };
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
