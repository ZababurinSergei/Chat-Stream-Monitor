export default async (self, actions) => {
    // const content = self.shadowRoot.querySelector('.content')

    return {
        init: () => {

            return {
                executor: {
                    validators: actions.executorValidators
                }
            }
            // self.addEventListener('click', actions.click)
            // self.addEventListener('click', actions.click, {
            //     bubbles: true,
            //     composed: true,
            // })
        },
        terminate: () => {
            // self.removeEventListener('click', actions.click)
            // self.removeEventListener('click', actions.click, {
            //     bubbles: true,
            //     composed: true,
            // })
        }
    }
}