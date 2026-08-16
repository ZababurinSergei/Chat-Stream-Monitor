import modules from './modules/index.mjs'

export const controller = (self, actions) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            modules: await modules(self, actions)
        })
    })
}