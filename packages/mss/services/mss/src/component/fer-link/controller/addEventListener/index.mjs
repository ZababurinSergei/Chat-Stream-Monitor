import { activeClass, normalizePathName } from '../../../../this/index.mjs'
export default async (self, actions) => {
    let component = self.shadowRoot === null
        ? self
        : self.shadowRoot

    const link = component.querySelector('p')
    // const events = (action) => {
    //     return (events) => {
    //         self.disabled = true
    //
    //         action({
    //             parent: self,
    //             events: events
    //         })
    //     }
    // }

    // const queue = [{
    //     type: 'click',
    //     action: events(actions.push)
    // }, {
    //     type: 'popstate',
    //     action: events(actions.events)
    // }]

    return {
        init: () => {
            let pathname = normalizePathName(window.location.pathname)

            if (pathname === normalizePathName(self.getAttribute('to'))) {
                link.classList.add(activeClass)
            }

            window.addEventListener('hashchange', actions.hashchange);
            link.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {
            window.removeEventListener('hashchange', actions.hashchange);
            link.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
        }
    }

}