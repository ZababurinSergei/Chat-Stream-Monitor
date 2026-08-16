export default async (self, actions) => {
    return {
        init: () => {
            self.addEventListener('click', actions.click)
        },
        termminate: () => {
            self.removeEventListener('click', actions.click)
        }
    }

}