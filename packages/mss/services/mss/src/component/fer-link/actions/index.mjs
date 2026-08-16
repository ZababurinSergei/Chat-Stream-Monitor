import { activeClass } from '../../../this/index.mjs'
export default (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            click: (events) => {
                const item = events.currentTarget
                const state = {}
                const title = ''
                const req = new URL(window.location.href)
                const url = item.getRootNode().host.getAttribute('to')
                req.hash = ''
                req.search = ''

                if(window.location.pathname !== url) {
                    console.log(' 🏈 CHANGE LINK')
                    req.pathname = url
                    item.classList.add(activeClass)
                    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%>>>>')
                    window.history.pushState(state, title, req.href);
                    window.dispatchEvent(new CustomEvent('popstate', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            pathname: url
                        }
                    }));
                }


                self.disabled = false
            },
            popstate: (events) => {
                if (events.detail) {
                    const url = self.getAttribute('to')

                    if (url !== events.detail.pathname) {
                        self.shadowRoot.querySelector('p').classList.remove(activeClass)
                    }
                }
            },
            hashchange: (events) => {
                // console.log('HASH CHANGE', self.tagName)
            }
        })
    })
}
