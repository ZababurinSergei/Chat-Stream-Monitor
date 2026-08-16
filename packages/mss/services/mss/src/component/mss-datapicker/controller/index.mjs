import addEventListener from './addEventListener/index.mjs'
export const controller = (self, actions) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            addEventListener: await addEventListener(self, actions)
        })
    })
}