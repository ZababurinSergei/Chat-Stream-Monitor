import { onload } from '../../this/index.mjs'

const defaultState = {
  schema: {},
  manifestRules: {},
  manifestVerifyList: []
}

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'fer-table'
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

  cleanState(path) {
    if(!this._state.hasOwnProperty(path)) {
      alert(`Свойтсва ${path} нет в стейте`)
      console.assert(false, `надо определить свойство ${path} в стейте`, {
        state: this._state
      })
    } else {
      this._state[path] = defaultState[path]
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

  refresh(props) {
    this.controller.addEventListener.terminate(props)
    this.controller.addEventListener.init(props)
  }

  set init(val) {
    this.controller.addEventListener.init(val)
  }


  get erase() {
    this.controller.addEventListener.terminate()
    this.shadowRoot.querySelector('.body').innerHTML = ''
    return true
  }

  get terminate() {
    return this.controller.addEventListener.terminate()
  }

  set open(val) {
    if (val) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
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

  set items(value) {
    return this.controller.api.set.items(value)
  }

  constructor () {
    super()
    if (!this.dataset.servicesPath) {
      console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this)
      return
    }
    this.controller = {};
    this._isOnload = false;
    this._state = defaultState;
    this._doRender = this._doRender.bind(this);
    import(`/services/${this.dataset.servicesPath}/src/this/init/init/index.mjs`)
        .then(data => {
          data.init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
        })
  }
  connectedCallback() {
    onload(this)
        .then(async (self) => {
          const { actions } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/actions/index.mjs`)
          let {controller} = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`)
          self.controller = await controller(self, await actions(self))
          await self.controller.addEventListener.init().catch(e => console.error(e))
        })
        .catch(e => console.error('error', e))
  }
  disconnectedCallback() {
    this.controller.addEventListener.terminate().catch(e => console.error(e))
    console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`)
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    window.addEventListener("popstate", this.router);
    // this.router()
  }
}

if(customElements.get(COMPONENT) === undefined) { customElements.define(COMPONENT, INDEX ) };
export default {
  component: COMPONENT,
  description: 'Шаблон компонента в котором сделанно подключение css темплейта'
}

