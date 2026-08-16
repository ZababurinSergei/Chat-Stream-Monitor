import { activeClass } from '../../../this/index.mjs'
export default (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            click: (events) => {
                if (self.disabled) {
                    return;
                }

                if(!self.dataset.params) {
                    console.error('Требуется указать в атрибутах компонента data-params', self)
                    return;
                }

                if(!self.dataset.value) {
                    console.error('Требуется указать в атрибутах компонента data-value', self)
                    return;
                }

                if(!self.dataset.type) {
                    console.error('Требуется указать в атрибутах компонента data-type', self)
                    return;
                }

                self.disabled = true
                self.shadowRoot.querySelector('p').classList.add(activeClass)
                let url = new URL(window.location.href)
                url.searchParams.set(`${self.dataset.params}`,  self.dataset.value);
                console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%>>>> 2')
                window.history.pushState({}, self.dataset.type, `${url}`);
                window.dispatchEvent(new CustomEvent('paramschange', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        pathname: url
                    }
                }));

                self.disabled = false
            },
            hashchange: (events) => {
                console.log(' HASH CHANGE ', self.tagName)
                if(`#${self.dataset.hash}` !== window.location.hash) {
                    self.shadowRoot.querySelector('p').classList.remove(activeClass)
                }
            },
            popstate: (events) => {
                console.log(' POPSTATE ', self.tagName)
                self.shadowRoot.querySelector('p').classList.remove(activeClass)
            },
            paramschange: (events) => {
                const url = new URL(location.href)
                if(url.searchParams.has(self.dataset.params)) {
                    const value =  url.searchParams.get(self.dataset.params)
                    if(value != self.dataset.value) {
                        self.shadowRoot.querySelector('p').classList.remove(activeClass)
                    }
                }
            }
        })
    })
}
