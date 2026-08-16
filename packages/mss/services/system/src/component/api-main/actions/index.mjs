import { store, loadHTML } from '../../../this/index.mjs'

const parser = new DOMParser()
const template = document.createElement('template')
const templateNext = document.createElement('template')

const service = store.get('current_service')
const templateService = parser.parseFromString(await loadHTML(`/template/${service}/index.html`), 'text/html').querySelector('template')
const serviceRules = (await import(`/services/${service}/src/main.mjs`))['default']
const imagesRules = templateService.content.querySelectorAll('img')

const mountPointRules = {
    pathname: `/services/${service}/src`,
    template: templateService,
    mountPoint: document.querySelector('.service'),
}

store.set(`mount_${service}`, mountPointRules)

for(let i = 0 ; i < imagesRules.length; ++i) {
    let url = new URL(imagesRules[i].src)
    url.pathname = `${mountPointRules.pathname}${url.pathname.slice(url.pathname.indexOf('/this'))}`
    imagesRules[i].src = url.pathname
}
export const actions = (self) => {
    return new Promise(async (resolve, reject) => {

        const isService = store.get('isService')

        if(isService) {
            serviceRules(mountPointRules).catch(e => console.error(e))
        } else {
            const service = document.querySelector('.service')
            service.style.display = 'none'
        }

        let div_dialog = document.createElement('div')
        let slot_default = document.createElement('slot')
        let slot_dialog = document.createElement('slot')

        div_dialog.slot = 'service'
        slot_dialog.name = 'service'

        self.appendChild(div_dialog)
        self.appendChild(slot_default)
        div_dialog.appendChild(slot_dialog)

        resolve({
            popstate: async (event)=> {
                // debugger
                let soltNames = ['header_base', 'TabAccounts', 'TabSend', 'TabDapps', 'TabSharding', 'TabSharding', 'TabExplorer']

                if (event.detail && event.detail.pathname) {
                    const slots = self.querySelectorAll('slot');

                    switch (event.detail.pathname) {
                        case "/":
                            // slot_dialog.name = 'service'
                            break
                        case "/service/rules":
                            const rules = templateNext.querySelector('.service-next')
                            template.appendChild(document.querySelector('.service'))
                            if(rules !== null) {
                                document.body.appendChild(rules)
                            } else {
                                serviceRules(mountPointRules).then(api => {})
                            }
                            break
                        case "/service/welcomebook":
                            templateNext.appendChild(document.querySelector('.service-next'))
                            const welcomebook = template.querySelector('.service')
                            document.body.appendChild(welcomebook)
                            break
                        case "/jira":
                            for (let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-jira' : ''
                            }
                            break
                        case "/contributing":
                            for (let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-contributing' : ''
                            }
                            break
                        case "/json":
                            for (let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-processor' : ''
                            }
                            break
                        default:
                            console.log('@@@@@@@@@@@----@@@@@@@@@@@')
                            // for (let i = 0; i < slots.length; ++i) {
                            //     slots[i].name = soltNames[i]
                            // }
                            break
                    }
                }
            }
        })
    })
}

export default {
    description: "actions for api-main"
}