import * as markdown from  './wasm/markdown.es.mjs'

export default () => {
    return new Promise(async (resolve, reject) => {
        await markdown.ready
        resolve(markdown)
    })
}