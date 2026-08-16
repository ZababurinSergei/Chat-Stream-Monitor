export default async (self, actions) => {

    const link = self.shadowRoot.querySelector('p')

    return {
        init: () => {
            link.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {
            link.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
        }
    }

}