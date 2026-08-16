import { welcomeHeader } from '../custom/index.mjs'
export default (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            'welcomeHeader': (event) => {
                welcomeHeader(self, event)
            }

        })
    })
}
