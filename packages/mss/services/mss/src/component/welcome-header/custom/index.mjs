import { delay } from '../../../this/index.mjs'
export const welcomeHeader = async (self, event) => {
    if(event.detail.isDisable) {
        await delay(100)
        self.style.opacity = 0
    } else {
        await delay(900)
        self.style.opacity = 1
    }
}