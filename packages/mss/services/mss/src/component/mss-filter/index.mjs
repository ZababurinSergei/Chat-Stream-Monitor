import { onload, store } from '../../this/index.mjs'

const COMPONENT = 'mss-filter'

const defaultState = {
  audit_main: undefined,
  "filter_5": {
    directoryName: undefined,
    interactionName: undefined,
    recipientSystemName: undefined
  },
  "filter_5_0": {
    logType: undefined,
    username: undefined
  },
  "filter": {
    startDate: null,
    endDate: null
  }
}
const INDEX =  class extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'open', 'class', 'backpropagation'];
  }

  _doRender(path, newValue, oldValue) {
    switch (path) {
    case 'isVerification':
      if(newValue !== oldValue) {
        this.querySelector('fer-hash[data-hash="verification"]').open = newValue
      }
      break
    default:
      break
    }
    if(this._state.tree) {
      console.log('     🔵 RENDER')
    }
  }

  cleanState (path) {
    if(path === 'all') {
      for(let key in this._state) {
        let clone = { ...defaultState[key] };
        this._state[key] = clone
      }
    } else {
      if (!this._state.hasOwnProperty(path)) {
        alert(`Свойтсва ${path} нет в стейте`);
        console.assert(false, `надо определить свойство ${path} в стейте`, {
          state: this._state
        });
      } else {
        let clone = { ...defaultState[path] };
        this._state[path] = clone;
      }
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
      const oldVlue = this._state[path]
      if(value === 'undefined') {
        this._state[path] = undefined;
        this._doRender(path, value, oldVlue)
        return undefined
      } else {
        if (this._state[path] !== value || this._state[path] === false) {
          this._state[path] = value;
          this._doRender(path, value, oldVlue)
          return value
        } else {

        }
      }
    }
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  set username(val) {
    const menuAudit = this.shadowRoot.querySelector('.menu_audit')
    const mssButton = menuAudit.querySelector('mss-button')
    const ferSelect = mssButton.shadowRoot.querySelector('fer-select[data-field="username"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    const placeholder = ferSelect.shadowRoot.querySelector('button[placeholder]')
    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    placeholder.setAttribute('placeholder', val[0])

    for(let i =0; i < val.length; ++i) {
      list.insertAdjacentHTML('beforeend', `
          <li 
             class="dropdown__list-item"
             data-directory-name="${val[i]}"
             data-value="${val[i]}"
          >
            ${val[i]}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }

  set logType(val) {
    const menuAudit = this.shadowRoot.querySelector('.menu_audit')
    const mssButton = menuAudit.querySelector('mss-button')
    const ferSelect = mssButton.shadowRoot.querySelector('fer-select[data-field="logType"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    const placeholder = ferSelect.shadowRoot.querySelector('button[placeholder]')
    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    placeholder.setAttribute('placeholder', val[0])
    // if(subscription.res.body.data[i].logType === 'CREATED') {
    //   item.value = 'Создана';
    // } else if(subscription.res.body.data[i].logType === 'UPDATED') {
    //   item.value = 'Отредактирована';
    // } else if(subscription.res.body.data[i].logType === 'DELETED') {
    //   item.value = 'Удалена';
    // } else if(subscription.res.body.data[i].logType === 'RECOVERED') {
    //   item.value = 'Востановлена';
    // }
    for(let i =0; i < val.length; ++i) {
      let result = val[i]

      if(val[i] === 'CREATED') {
        result = 'Создана'
      }

      if(val[i] === 'UPDATED') {
        result = 'Отредактирована'
      }

      if(val[i] === 'DELETED') {
        result = 'Удалена'
      }

      if(val[i] === 'RECOVERED') {
        result = 'Востановлена'
      }

      list.insertAdjacentHTML('beforeend', `
          <li 
             class="dropdown__list-item"
             data-directory-name="${val[i]}"
             data-value="${val[i]}"
          >
            ${result}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }
  set interactionName(val) {
    const mssButton = this.shadowRoot.querySelector('mss-button')
    const ferSelect = mssButton.shadowRoot.querySelector('fer-select[data-field="interactionName"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    const placeholder = ferSelect.shadowRoot.querySelector('button[placeholder]')
    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    placeholder.setAttribute('placeholder', val[0])

    for(let i =0; i < val.length; ++i) {
      list.insertAdjacentHTML('beforeend', `
          <li 
             class="dropdown__list-item"
             data-directory-name="${val[i]}"
             data-value="${val[i]}"
          >
            ${val[i]}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }

  set recipientSystemName(val) {
    const mssButton = this.shadowRoot.querySelector('mss-button')
    const ferSelect = mssButton.shadowRoot.querySelector('fer-select[data-field="recipientSystemName"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    const placeholder = ferSelect.shadowRoot.querySelector('button[placeholder]')

    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    placeholder.setAttribute('placeholder', val[0])

    for(let i =0; i < val.length; ++i) {
      list.insertAdjacentHTML('beforeend', `
          <li 
             class="dropdown__list-item"
             data-directory-name="${val[i]}"
             data-value="${val[i]}"
          >
            ${val[i]}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }
  set directoryName(val) {
    const mssButton = this.shadowRoot.querySelector('mss-button')
    const ferSelect = mssButton.shadowRoot.querySelector('fer-select[data-field="directoryName"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    const placeholder = ferSelect.shadowRoot.querySelector('button[placeholder]')

    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    placeholder.setAttribute('placeholder', val[0])

    for(let i =0; i < val.length; ++i) {
      list.insertAdjacentHTML('beforeend', `
          <li 
             class="dropdown__list-item"
             data-directory-name="${val[i]}"
             data-value="${val[i]}"
          >
            ${val[i]}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }

  set code(val) {
    const ferSelect = this.shadowRoot.querySelector('fer-select[data-field="code"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')

    for(let item of val) {
      let value = ''

      if(section.toString() === '6') {
        value = item.interactionCode
      }

      if(section.toString() === '7') {
        value = item.recipientCode
      }

      list.insertAdjacentHTML('afterbegin', `
          <li 
             class="dropdown__list-item"
             ${item.hasOwnProperty('interactionId')? `data-interaction-id=${item.interactionId}`: ``}
             data-value="${value}"
          >
            ${value}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }

  set name(val) {
    const ferSelect = this.shadowRoot.querySelector('fer-select[data-field="name"]')
    const list = ferSelect.shadowRoot.querySelector('.dropdown__list')
    ferSelect.controller.addEventListener.terminate()
    list.innerHTML = ''
    const section = store.get('section')
    for(let item of val) {
      let value = ''

      if(section.toString() === '7') {
        value = item.interactionCode
      }

      if(section.toString() === '6') {
        value = item.interactionName
      }

      list.insertAdjacentHTML('afterbegin', `
          <li 
             class="dropdown__list-item"
             ${item.hasOwnProperty('interactionId')? `data-interaction-id=${item.interactionId}`: ``}
             data-value="${value}"
          >
            ${value}
          </li>
      `)
    }
    ferSelect.controller.addEventListener.init()
  }

  set terminate(val) {
    this.controller.addEventListener.terminate()
  }

  set init(val) {
    this.controller.addEventListener.init()
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  constructor () {
    super()
    if (!this.dataset.servicesPath) {
      console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this)
      return
    }

    this.controller = {}
    this._isOnload = false;
    this._state = {
      audit_main: undefined,
      "filter_5": {
        directoryName: undefined,
        interactionName: undefined,
        recipientSystemName: undefined
      },
      "filter_5_0": {
        logType: undefined,
        username: undefined
      },
      "filter": {
        startDate: null,
        endDate: null
      }
    }
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
        let { controller } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`)
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