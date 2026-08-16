export default async (self, actions) => {
    const login = self?.shadowRoot?.querySelector('.login')

    return {
        init: () => {
            login?.addEventListener('click', actions.click)
        },
        terminate: () => {

        }
    }

}