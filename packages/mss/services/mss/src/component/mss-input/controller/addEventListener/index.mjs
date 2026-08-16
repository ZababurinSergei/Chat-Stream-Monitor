import { store, task } from '../../../../../../system/src/this/index.mjs';

export default async (self, actions) => {
    const pathname = store.get('pathname').pathname

    const { router } = await import(`${pathname}/this/index.mjs`)

    const routes = await router(self, { location })

    const input = self.shadowRoot.querySelector('input')

    const list = self.shadowRoot.querySelector('.response.dropdown__list')

    return {
        init: () => {
            list?.addEventListener('click', actions.click)
            input.addEventListener('input', actions.input)
        },
        terminate: () => {
            list?.removeEventListener('click', actions.click)
            input.removeEventListener('input', actions.input)
        }
    }
}