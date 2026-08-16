import { store } from '../../../../this/index.mjs'

export default async (self, actions) => {
    const button = self.shadowRoot.querySelector('.container-login')

    return {
        init: () => {
            button.addEventListener('click', actions.click)
        },
        terminate: () => {
            button.removeEventListener('click', actions.click)
        }
    }
}