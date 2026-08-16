import {store} from '../../../this/index.mjs'

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            click: (event) => {
                event.stopPropagation()
                console.log('---------------------- CLICK CHECKBOX --------------------------------', self)
            }
        })
    })
}

export default {
    description: 'action'
}