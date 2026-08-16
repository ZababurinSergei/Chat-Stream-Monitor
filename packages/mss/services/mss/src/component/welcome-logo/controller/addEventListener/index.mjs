export default async (self, actions) => {

    return {
        init: () => {
            self.addEventListener('mouseenter', actions.mouseenter)
            self.addEventListener('mouseleave', actions.mouseleave)
            self.addEventListener('click', actions.click)
        },
        terminate: () => {
            self.removeEventListener('mouseenter', actions.mouseenter)
            self.removeEventListener('mouseleave', actions.mouseleave)
            self.removeEventListener('click', actions.click)
        }
    }
}