import { init, onload, slotRouter } from '../../this/init/index.mjs'
import addEventListener from './controller/addEventListener/index.mjs'
import actions from './actions/index.mjs'

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'fer-main'
const INDEX =  class extends HTMLElement {
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

  constructor () {
    super()
    this.controller = {}
    this._isOnload = false;
    init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
  }
  connectedCallback() {
    onload(this)
      .then(async (self) => {
        slotRouter(this)
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
  component: 'fer-main',
  description: 'Преобразование markdown в json, html в json, фильтрация json',
  modules: {
    jq: 'json',
    md: 'md to json',
    html: 'html to json'
  }
}
