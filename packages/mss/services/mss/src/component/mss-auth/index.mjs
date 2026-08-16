import { onload } from '../../this/index.mjs'

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'mss-auth'
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
      this.style.display = 'flex'
      this.shadowRoot.querySelector('.container').style.opacity = 1
    } else {
      this.shadowRoot.querySelector('.container').style.opacity = 0
      this.style.display = 'none'
    }
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
  logout = () => this.controller.api.logout();
  login = () => this.controller.api.login();
  constructor () {
    super()
    if (!this.dataset.servicesPath) {
      console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this)
      return
    }

    this.controller = {}
    this._isOnload = false;
    this._state = { };
    this._doRender = this._doRender.bind(this);

    let link = ''
    if(this.dataset.servicesPath === 'main') {
      link = '/this/init/init/index.mjs'
    } else {
      link = `/services/${this.dataset.servicesPath}/src/this/init/init/index.mjs`
    }

    import(link)
      .then(data => {
        data.init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
      })
  }
  connectedCallback() {
    onload(this)
      .then(async (self) => {
        let linkActions = ''
        let linkController = ''
        if(this.dataset.servicesPath === 'main') {
          linkActions = `/component/${COMPONENT}/actions/index.mjs`
          linkController =  `/component/${COMPONENT}/controller/index.mjs`
        } else {
          linkActions = `/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/actions/index.mjs`
          linkController = `/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`
        }

        const { actions } = await import(linkActions)
        let {controller} = await import(linkController)
        self.controller = await controller(self, await actions(self))
        await self.controller.addEventListener.init()
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