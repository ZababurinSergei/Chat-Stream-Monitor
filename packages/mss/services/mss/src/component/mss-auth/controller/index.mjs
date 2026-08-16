import addEventListener from './addEventListener/index.mjs'
import api from './api/index.mjs'
export const controller = (self, actions) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            addEventListener: await addEventListener(self, actions),
            api: await api(self, actions)
        })
    })
}