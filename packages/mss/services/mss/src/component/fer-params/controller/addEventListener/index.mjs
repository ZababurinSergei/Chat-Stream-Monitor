import { activeClass, normalizePathName } from '../../../../this/index.mjs'
export default async (self, actions) => {
    let component = self.shadowRoot === null
        ? self
        : self.shadowRoot

    const link = component.querySelector('p')
    const events = (action) => {
        return (events) => {
            action({
                parent: self,
                events: events
            })
        }
    }

    // const queue = [{
    //     type: 'click',
    //     action: events()
    // }, {
    //     type: 'popstate',
    //     action: events(actions.popstate)
    // }, {
    //     type: ,
    //     action: events(actions.hashchange)
    // }]

    return {
        init: () => {
            window.addEventListener('paramschange', actions.paramschange );
            window.addEventListener('hashchange', actions.hashchange );
            link.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {
            window.removeEventListener('paramschange', actions.paramschange );
            window.removeEventListener('hashchange', actions.hashchange);
            link.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
        }
    }

}