import { template, actions } from './dialog/index.mjs'

export const dialogThis = {
    template: template,
    actions: actions,
    config: {
        inputs: undefined,
        close: undefined,
        save: undefined,
        cancel: undefined,
        remove: undefined,
        reset: undefined,
        next: undefined,
        data: undefined,
        inputSchema: undefined,
        inputsBody: [],
        update: undefined,
        success: undefined,
    }
}

export { htmlOnLoad } from './htmlOnLoad/index.mjs'
export { init } from './init/index.mjs'
export {v4, version, parse, stringify} from './uuid/this/index.js'