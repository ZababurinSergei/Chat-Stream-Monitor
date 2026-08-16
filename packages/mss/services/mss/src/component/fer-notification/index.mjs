import { onload } from '../../this/index.mjs'
import { Notifier } from './views/index.mjs'

// const COMPONENT = path.dirname(import.meta.url).split(path.sep).pop()
const COMPONENT = 'fer-notification'

const INDEX =  class extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'open'];
  }

  closeToasts() {
    this.notifier.closeToasts()
  }

  success(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  warning(message, options = {
    durations: {
      warning: 0
    }
  }) {
    this.notifier.warning(message, Object.assign(options, {
        labels: {
          warning: "Внимание!"
        },
        durations: {
          warning: 3000,
        },
        icons: {
          enabled: true,
          warning: "",
          suffix: '',
          prefix: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="64" viewBox="0 0 60 64" fill="none">
                      <g clip-path="url(#clip0_1908_3324)">
                        <path d="M54.0153 11.7202C56.6275 13.6994 59.0954 17.955 59.4455 21.2057L59.4486 21.2344C59.481 21.5312 60 26.3656 60 31.966C60 37.6139 59.4844 42.3739 59.4489 42.6948L59.445 42.7303C59.0925 45.9914 56.6788 50.2619 53.9892 52.2316L53.9854 52.2344C53.9203 52.2818 49.9361 55.1823 45 58.0829C40.2893 60.8131 36.0606 62.7134 35.5192 62.954C35.4794 62.9717 35.4414 62.989 35.4018 63.0072C33.9551 63.6691 31.9776 64 30 64C28.0773 64 26.0865 63.6644 24.5695 62.9933L24.5118 62.9679C24.1274 62.8002 19.7528 60.8757 15 58.0829C10.2605 55.2979 6.39863 52.5129 6.04088 52.2535C6.02095 52.239 6.00427 52.2267 5.98465 52.2118C3.37253 50.2326 0.904571 45.977 0.554521 42.7263L0.551408 42.6976C0.518959 42.4008 0 37.5663 0 31.966C0 26.3181 0.515599 21.5581 0.551077 21.2372L0.554953 21.2017C0.906481 17.9502 3.30699 13.6952 5.98704 11.7179C6.00504 11.7046 6.02013 11.6937 6.03837 11.6808C6.38018 11.4384 10.2492 8.70877 15 5.91711C19.7107 3.18695 23.9394 1.2866 24.4808 1.04603C24.5206 1.02834 24.5586 1.01097 24.5982 0.992838C26.0449 0.330946 28.0224 0 30 0C31.9227 0 33.9135 0.335571 35.4305 1.00671L35.4882 1.0321C35.8726 1.19979 40.2472 3.12428 45 5.91711C49.7395 8.63734 53.6014 11.4193 53.9591 11.6785C53.979 11.693 53.9957 11.7053 54.0153 11.7202Z" fill="#E11432"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.7143 22.7147C25.8331 17.5945 34.1644 17.5957 39.285 22.7148C44.4052 27.8336 44.404 36.165 39.2849 41.2856C34.1659 46.4059 25.8332 46.4059 20.7143 41.2856L20.7142 41.2855C15.5953 36.1666 15.5952 27.8352 20.7143 22.7147ZM40.3455 21.654C34.6394 15.9495 25.3583 15.9477 19.6535 21.6542C13.9489 27.3603 13.9488 36.6414 19.6535 42.3461C25.3583 48.0524 34.6409 48.0524 40.3457 42.3461C46.0502 36.64 46.052 27.3589 40.3455 21.654ZM29.9995 24.907C30.4137 24.907 30.7495 25.2428 30.7495 25.657V33.2958C30.7495 33.71 30.4137 34.0458 29.9995 34.0458C29.5853 34.0458 29.2495 33.71 29.2495 33.2958V25.657C29.2495 25.2428 29.5853 24.907 29.9995 24.907ZM29.9994 39.5225C30.8278 39.5225 31.4993 38.851 31.4993 38.0226C31.4993 37.1943 30.8278 36.5228 29.9994 36.5228C29.1711 36.5228 28.4996 37.1943 28.4996 38.0226C28.4996 38.851 29.1711 39.5225 29.9994 39.5225Z" fill="white"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_1908_3324">
                          <rect width="60" height="64" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>`
        }
      })
    )
  }

  tip(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  info(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  alert(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  async(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  modal(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  confirm(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  asyncBlock(message, options) {
    console.log('ddddddddddddddddddddd', this.notifier)
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }


  constructor () {
    super()
    if (!this.dataset.servicesPath) {
      console.error('Надо устновить атрибут: data-services-path что бы можно было отличить компоненты, относящиеся к разным сервисам и назначить обработчики определенного сервиса', this)
      return
    }

    this._isOnload = false;

    import(`/services/${this.dataset.servicesPath}/src/this/init/init/index.mjs`)
      .then(data => {
        data.init(this).then(self => (self._isOnload = true)).catch(error => console.warn('error', error))
      })
  }

  connectedCallback() {
    onload(this)
      .then(async (self) => {
        const position = this.dataset.position

        this.notifier = new Notifier({
          position: position ? position: "top-right"
        })
      })
      .catch(e => console.error('error', e))
  }
  disconnectedCallback() {
    console.log(`     🔴 COMPONENTS ${this.tagName} disconnected`)
  }
}

if(customElements.get(COMPONENT) === undefined) { customElements.define(COMPONENT, INDEX ) };
export default {
  component: COMPONENT,
  description: `Компонент ${COMPONENT}`,
}