import { timer } from '../../../../this/index.mjs'

export default async (self, actions) => {
    return {
        init: () => {
            timer.init(self.shadowRoot.querySelector('.timer'))
        },
        terminate: () => {
            timer.terminate()
        }
    }

}