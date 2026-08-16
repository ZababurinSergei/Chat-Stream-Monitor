import { activeClass } from '../../../this/index.mjs'
export const actions = (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            click: (events) => {
                if (self.disabled) {
                    return;
                }

                if(!self.dataset.hash) {
                    console.error('Требуется указать в атрибутах компонента data-hash', self)
                    return;
                }

                if(!self.dataset.type) {
                    console.error('Требуется указать в атрибутах компонента data-type', self)
                    return;
                }

                self.disabled = true
                self.classList.add(activeClass)
                // console.log('#########################', activeClass, 'dddddddddddd', self)
                let url = new URL(window.location.href)
                url.hash = self.dataset.hash;
                url.search = ''
                if(`#${self.dataset.hash}` !== window.location.hash) {
                    console.log('  🏀🏀🏀🏀🏀 EVENT HASH BUTTON', parent, events)
                    window.history.pushState({}, self.dataset.type, url);
                    window.dispatchEvent(new CustomEvent('hashchange', {
                        bubbles: true,
                        composed: true
                    }));
                }

                self.disabled = false
                // task.set(true, '','red', {
                //     events: [{...element.dataset, pathname: normalizePathName(window.location.pathname), hash: window.location.hash}]
                // }, element.dataset.event).catch(e => {console.log('error devtool', e)})
                // const timeId = setTimeout(() => {
                // clearTimeout(timeId)
                //     self.shadowRoot.querySelector('p').classList.remove(activeClass)
                //     self.disabled = false
                // }, 300)
            },
            hashchange: (events) => {
                if(`#${self.dataset.hash}` !== window.location.hash) {
                    self.classList.remove(activeClass)
                }

                if(`#${self.dataset.hash}` === window.location.hash) {
                    let welcomeSection = self.closest('welcome-section')
                    const ferForm = welcomeSection.querySelector('fer-form')
                    const statusInput = ferForm.shadowRoot.querySelector('.status')


                    if(window.location.hash === '#verification') {
                        const manifestFerCodemirror = welcomeSection.querySelector('#jsonSchema')
                        manifestFerCodemirror.refresh()
                        // console.log('sssssssssssssss',welcomeSection)
                        statusInput.style.visibility = 'visible'
                    } else {
                        statusInput.style.visibility = 'hidden'
                    }
                }
            },
            popstate: (events) => {
                console.log(' POPSTATE ', self.tagName)
                self.shadowRoot.querySelector('p').classList.remove(activeClass)
            },
        })
    })
}

export default {
    description: 'actions'
}