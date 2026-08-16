import { activeClass, normalizePathName, task } from "../../../this/index.mjs";

export default (self) => {
    return new Promise(async (resolve, reject) => {

        const link = self.shadowRoot.querySelector('p')

        let pathname = normalizePathName(window.location.pathname)

        if (pathname === normalizePathName(self.getAttribute('to'))) {
            link.classList.add(activeClass)
        }

        resolve({
            popstate: (event) => {
                if (event.detail) {
                    const url = self.getAttribute('to')

                    if (url !== event.detail.pathname) {
                        self.shadowRoot.querySelector('p').classList.remove(activeClass)
                    }
                }
            },
            click: (event) => {
                const item = event.currentTarget
                const state = { }
                const title = ''
                const url = item.getRootNode().host.getAttribute('to')
                item.classList.add(activeClass)
                let req = new URL(window.location.href)
                req.pathname = url

                window.history.pushState(state, title, req.href);

                window.dispatchEvent(new CustomEvent('popstate', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        pathname: url
                    }
                }));
            }
        })
    })
}