import { init, onload } from '../../this/index.mjs'
// import addEventListener from './controller/addEventListener/index.mjs'
// import actions from './actions/index.mjs'

const COMPONENT = 'fer-button'
const INDEX =  class extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'open'];
  }
  _doRender() {
    if(this._state.tree) {
      console.log('     🔵 RENDER')
    }
  }

  getState(path) {
    return this._state[path];
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
      this.removeAttribute('style')
    } else {
      this.removeAttribute('open');
      this.style.display = 'none'
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
    this._state = { };
    this._doRender = this._doRender.bind(this);
    init(this, {
      css: {
        shadow: this.dataset.cssShadow ? [this.dataset.cssShadow]: undefined
      }
    }).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
  }
  connectedCallback() {
    onload(this)
      .then(async (self) => {
        const { actions } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/actions/index.mjs`)
        let { controller } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`)
        self.controller = await controller(self, await actions(self))
        await self.controller.addEventListener.init()
        await self.controller.addTaskListener.init()
      })
      .catch(e => console.error('error', e))
  }
  disconnectedCallback() {
    this.controller.addEventListener.terminate()
    this.controller.addTaskListener.terminate()
    console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`)
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.disabled) {
      this.setAttribute('tabindex', '-1');
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.setAttribute('tabindex', '0');
      this.setAttribute('aria-disabled', 'false');
    }
  }
}

if(customElements.get(COMPONENT) === undefined) { customElements.define(COMPONENT, INDEX ) };

export default {
  component: COMPONENT,
  description: 'Шаблон компонента в котором сделанно подключение css темплейта',
  "data-": {
    id: 'Указывается уникальный id который используется для определения конкретной кнопки',
    type: "Устанавливается, что бы определить группу кнопок к которым она относится",
    switchoff: "Устанавливается если требуется чтобы active класс удалялся после нажатия на кнопку",
    "css-shadow": "Показывает откуда будет загружаться css для компонента путь получается следующим образом `./component/${self.tagName.toLowerCase()}/views/css/${self.dataset.cssShadow}.shadow.css``"
  },
  actions: {
    "fer-button-in": "событие которое прослушивает коммпанды которые приходят в кнопку. Значения disable/enable Выключает все кнопки определенной группы или включают все кнопки кроме активной"
  }
}
