import { onload } from '../../this/index.mjs';
import { objectsEqual } from './views/index.mjs';

const defaultState = {
    pagination: {
      isNextPage: false,
      offset: 0,
      limit: 6,
      maxCount: 0,
      maxPages: 0,
      page: 1
  }
}

const COMPONENT = 'fer-pagination';

const INDEX = class extends HTMLElement {
  static get observedAttributes () {
    return ['disabled', 'open'];
  }

  _doRender (attrName, newVal, oldVal) {
    const welcomeSection = this.closest('welcome-section');
    const ferTable = this.closest('fer-table');

    const container = this.shadowRoot.querySelector('.container-data');

    const first = this.shadowRoot.querySelector('.first')
    const previous = this.shadowRoot.querySelector('.previous')

    const next = this.shadowRoot.querySelector('.next')
    const last = this.shadowRoot.querySelector('.last')

    if (attrName === 'pagination') {
      ferTable.refresh();

      if (this._state.pagination.maxPages === this._state.pagination.page) {
        for(let i =0; i < container.children.length; ++i) {
          if(i === this._state.pagination.page - 1) {
            container.children[i].classList.add('active')
          } else {
            container.children[i].classList.remove('active')
          }
        }

        previous?.classList.remove('close')
        first?.classList.remove('close')
        next?.classList.add('close')
        last?.classList.add('close')
      }

      if (this._state.pagination.page === 1) {
        for(let i =0; i < container.children.length; ++i) {
          if(i === this._state.pagination.page - 1) {
            container.children[i].classList.add('active')
          } else {
            container.children[i].classList.remove('active')
          }
        }

        next?.classList.remove('close')
        last?.classList.remove('close')
        previous?.classList.add('close')
        first?.classList.add('close')
      }

      if(this._state.pagination.page > 1 && this._state.pagination.page < this._state.pagination.maxPages) {
        next?.classList.remove('close')
        last?.classList.remove('close')
        previous?.classList.remove('close')
        first?.classList.remove('close')
      }
    } else {
      console.error('неизвестный необрабатываемый атрибут', attrName, oldVal, newVal);
    }
  }

  cleanState (path, exclude = []) {
    if(path === 'all') {
      for(let key in this._state) {
        if(!exclude.some(item => item === key)) {
          this._state[key] = structuredClone(defaultState[key])
        }
      }
    } else {
      if (!this._state.hasOwnProperty(path)) {
        alert(`Свойтсва ${path} нет в стейте`);
        console.assert(false, `надо определить свойство ${path} в стейте`, {
          state: this._state
        });
      } else {
        this._state[path] = structuredClone(defaultState[path]);
      }
    }
  }

  getState (path) {
    return  structuredClone(this._state[`${path}`]);
  }

  setState (path, value) {
    if (!this._state.hasOwnProperty(path)) {
      alert(`надо определить свойство ${path} в стейте`);
      console.assert(false, `надо определить свойство ${path} в стейте`, {
        state: this._state
      });

    } else {
      const oldVlue = this._state[path];
      if (value === 'undefined') {
        this._state[path] = undefined;
        this._doRender(path, value, oldVlue);
        return undefined;
      } else {
        if (this._state[path] !== value || this._state[path] === false) {
          this._state[`${path}`] = value;
          this._doRender(path, value, oldVlue);
          return value;
        }
      }
    }
  }

  set offset (val) {
    this._state.pagination.offset = val;
  }

  set limit (val) {
    this._state.pagination.limit = val;
  }

  set reset (val) {
    const ferSelect = this.shadowRoot.querySelector('fer-select')
    ferSelect.reset = 6
    this._state.pagination.maxCount = 1;
    const container = this.shadowRoot.querySelector('.container-data');
    const limit = this.shadowRoot.querySelector('.limit');
    const total = this.shadowRoot.querySelector('.total');
    this._state.pagination.maxPages = (this._state.pagination.maxCount % this._state.pagination.limit) === 0 ? (this._state.pagination.maxCount / this._state.pagination.limit) : parseInt((this._state.pagination.maxCount / this._state.pagination.limit) + 1, 10)
    this._state.pagination.offset = 0
    this._state.pagination.limit = 6
    this._state.pagination.page = 1

    container.innerHTML = ''
    limit.innerHTML = ''
    total.innerHTML = ''

    limit.textContent = parseInt(this._state.pagination.limit, 10) > parseInt(val, 10) ? val : this._state.pagination.limit
    total.textContent = 0

    const next = this.shadowRoot.querySelector('.next')
    const last = this.shadowRoot.querySelector('.last')

    next?.classList.remove('close')
    last?.classList.remove('close')
  }

  set page (val) {
    if(val <= this._state.pagination.maxPages) {
      this._state.pagination.offset = this._state.pagination.limit * (val -1)
      this._state.pagination.page = val;
    }
  }

  get page () {
    return this._state.pagination.page;
  }

  set maxCount (val) {
    this._state.pagination.maxCount = val;
    const container = this.shadowRoot.querySelector('.container-data');
    const limit = this.shadowRoot.querySelector('.limit');
    const total = this.shadowRoot.querySelector('.total');
    this._state.pagination.maxPages = (this._state.pagination.maxCount % this._state.pagination.limit) === 0 ? (this._state.pagination.maxCount / this._state.pagination.limit) : parseInt((this._state.pagination.maxCount / this._state.pagination.limit) + 1, 10)

    container.innerHTML = ''
    limit.innerHTML = ''
    total.innerHTML = ''

    limit.textContent = parseInt(this._state.pagination.limit, 10) > parseInt(val, 10) ? val : this._state.pagination.limit
    total.textContent = val


    if(this._state.pagination.page === 1) {
      const first = this.shadowRoot.querySelector('.first')
      const previous = this.shadowRoot.querySelector('.previous')
      previous?.classList.add('close')
      first?.classList.add('close')
    } else {

    }

    let isOnce = true
    const halfPage = this._state.pagination.maxPages / 2
    for(let i =0; i < this._state.pagination.maxPages; ++i) {
      if(halfPage - this._state.pagination.page > 0) {
        if((i + 1 < this._state.pagination.page + 2 && i + 1 > this._state.pagination.page - 2) || i + 1 > this._state.pagination.maxPages - 3) {
          container.insertAdjacentHTML('beforeend', `<div class="item ${this._state.pagination.page -1 === i ? `active`: ``}">${i + 1}</div>`)
        } else {
          if(isOnce && (i > this._state.pagination.maxPages - halfPage + 3)) {
            container.insertAdjacentHTML('beforeend', `<div class="item empty">...</div>`)
            isOnce = false
          }
        }
      } else {
        if(i < 3 || (i > this._state.pagination.page - 3 && i <= this._state.pagination.page)) {
          container.insertAdjacentHTML('beforeend', `<div class="item ${this._state.pagination.page -1 === i ? `active`: ``}">${i + 1}</div>`)
        } else {
          if(isOnce) {
            container.insertAdjacentHTML('beforeend', `<div class="item empty">...</div>`)
            isOnce = false
          }
        }
      }
    }
  }

  set disabled (val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get disabled () {
    return this.hasAttribute('disabled');
  }

  refresh (props) {
    this.controller.addEventListener.terminate();
    this.controller.addEventListener.init(props);
  }

  constructor () {
    super();
    if (!this.dataset.servicesPath) {
      console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this);
      return;
    }
    this.controller = {};
    this._isOnload = false;
    this._state = {
      pagination: {
        isNextPage: false,
        offset: 0,
        limit: 6,
        maxCount: 0,
        maxPages: 0,
        page: 1
      }
    };
    this._doRender = this._doRender.bind(this);
    import(`/services/${this.dataset.servicesPath}/src/this/init/init/index.mjs`)
        .then(data => {
          data.init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error));
        });
  }

  connectedCallback () {
    onload(this)
        .then(async (self) => {
          const { actions } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/actions/index.mjs`);
          let { controller } = await import(`/services/${self.dataset.servicesPath}/src/component/${COMPONENT}/controller/index.mjs`);
          self.controller = await controller(self, await actions(self));
          await self.controller.addEventListener.init().catch(e => console.error(e));
        })
        .catch(e => console.error('error', e));
  }

  disconnectedCallback () {
    this.controller.addEventListener.terminate().catch(e => console.error(e));
    console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`);
  }

  attributeChangedCallback (attrName, oldVal, newVal) {
    window.addEventListener('popstate', this.router);
    // this.router()
  }
};

if (customElements.get(COMPONENT) === undefined) {
  customElements.define(COMPONENT, INDEX);
};

export default {
  component: COMPONENT,
  description: 'Шаблон компонента в котором сделанно подключение css темплейта'
};

