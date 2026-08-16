import { Notifier } from '../../views/index.mjs'

export default async (self, actions) => {
    let globalOptions =  {
        position: "top-right"
    }
    let nextCallOptions = {}
    const notifier = new Notifier(globalOptions)
    notifier.success('Your custom message')
    console.log('Notifier', notifier)

    return {
        init: () => {

        },
        terminate: () => {

        }
    }
}