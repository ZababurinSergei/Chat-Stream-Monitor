export default async (self, actions) => {

    const content = self.shadowRoot.querySelector('.content')
    // closeButtonClick
    // const content = self.shadowRoot.querySelector('.content')
    return {
        init: () => {
            self.addEventListener('mousedown', actions.click, {
                bubbles: true,
                composed: true,
            })

            self.addEventListener('click', actions.clickFerSelect)
        },
        terminate: () => {
            // self.removeEventListener('click', actions.click)
            self.removeEventListener('click', actions.click, {
                bubbles: true,
                composed: true,
            })

            self.removeEventListener('click', actions.clickFerSelect)
        }
    }
}