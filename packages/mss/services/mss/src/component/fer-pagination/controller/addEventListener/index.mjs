export default async (self, actions) => {

    let first = null
    let previous = null
    let next = null
    let last = null
    let container = null
    let button = null

    return {
        init: async (props) => {
            document.addEventListener('mss-pagination_reset-offset', actions.CustomEvents.reset.offset)

            button = self.shadowRoot.querySelector('button')
            first = self.shadowRoot.querySelector('.first')
            previous = self.shadowRoot.querySelector('.previous')
            next = self.shadowRoot.querySelector('.next')
            last = self.shadowRoot.querySelector('.last')

            container = self.shadowRoot.querySelectorAll('.container')

            for(let item of container) {
                item.addEventListener('click', actions.click)
            }

            button?.addEventListener('click', actions.clickNext)

            first?.addEventListener('click', actions.click)
            previous?.addEventListener('click', actions.click)
            next?.addEventListener('click', actions.click)
            last?.addEventListener('click', actions.click)
        },
        terminate: async () => {
            for(let item of container) {
                item.removeEventListener('click', actions.click)
            }
            document.removeEventListener('mss-pagination_reset-offset', actions.CustomEvents.reset.offset)
            first?.removeEventListener('click', actions.click)
            previous?.removeEventListener('click', actions.click)
            next?.removeEventListener('click', actions.click)
            last?.removeEventListener('click', actions.click)
            button?.removeEventListener('click', actions.clickNext)
        }
    }
}