import { link, normalizePathName, eventsName, task } from '../../../../this/index.mjs'

export default async (self, actions) => {
    return {
        init: () => {
            for(let pathname of  link.substrate) {
                task.get(true, 'await', '5', '', pathname, async (object) => {
                    console.log(`   🟢 PROPERTY ROUTER ${object.relation}`)

                    object.callback({
                        _scriptDir: import.meta.url,
                        status: true
                    })
                })
            }

            for(const event of eventsName[self.tagName]) {
                task.get(true, 'await', '5', '', event, async (object) => {
                    let pathName = normalizePathName(window.location.pathname)

                    console.log(`      🟩 PROPERTY BUTTON EVENT ${object.relation}`)
                    object.callback({
                        _scriptDir: import.meta.url,
                        status: true
                    })
                })
            }
        },
        terminate: () => {

        }
    }
}