import { loader, fromBase64, store } from './this/index.mjs'
import { Models } from './models/index.mjs'
import { tableVisual } from './component/fer-table/views/index.mjs';
const models = await Models()

const ferDialog = document.body.querySelector('fer-dialog')
const errorDialog = (message) => {
    ferDialog.open = {
        type: 'error',
        title: 'Ошибка',
        description: [{
            text: message
        }],
        button: [{
            type: 'cancel',
            description: 'Ok',
        }]
    }
}
const getTree = async (data) => {
    const treeData = []

    for(let i = 0; i < data.validators.length; ++i) {
        treeData.push({
            name: `Версия ${data.validators[i].version}`,
            children: []
        })

        for(let j = 0; j < data.validators[i].docs.length; ++j) {
            const item = data.validators[i].docs[j]
            treeData[i].children.push({
                name: `<div class="tree-item">
                                  <p class="tree_package-name">${item.package}.${item.name}</p>
                                  <p class="tree_comment">${item.comment}</p>
                                  <p class="tree_comment">Путь: ${item.javascriptObjectPath}</p>
                              </div>`,
                children: []
            })

            for(let k = 0; k < data.validators[i].docs[j].methods.length; ++k) {

                const item = data.validators[i].docs[j].methods[k]

                const params = item.comment.split('@')
                treeData[i].children[j].children.push({
                    name: item.javascriptFunctionDeclaration,
                    children: [{
                        name: `<div class="tree-item">
                                          <p class="tree_package-name">Описание: ${params[0]}</p>
                                          <p class="tree_comment">@${params[0]}</p>
                                          <p class="tree_comment">@${params[1]}</p>
                                      </div>`,
                        children: []
                    }]
                })
            }
        }
    }

    return treeData
}
const setSectionData = async (data) => {
    const welcomeSection = document.querySelector(`welcome-section[data-id="${data.id}"]`)

    switch (data.id) {
        case '6_0':

            break
        case '7_0':

            break
        case '5_0':

            break
        default:
            console.error('надо обработать запрос', data)
            break

    }
}

export const rules = (mount = {}) => {
    return new Promise(async (resolve, reject) => {
        window.scrollTo(0, 0)

        const currentService = store.get('current_service')

        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/codemirror_5_21_0.js`, 'CodeMirror')
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/search.js`, 'search')
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/searchcursor.js`, 'searchcursor')
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/match-highlighter.js`,`match-highlighter`)
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/jump-to-line.js`, 'jump-to-line')
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/dialog.js`, `dialog`)
        // await loader(`/services/${currentService}/src/component/fer-codemirror/views/mjs/codemirror/runmode.js`, `runmode`)

        const {pathname, CSSVariables, mountPoint, template} = Object.assign({
            pathname: '.',
            mountPoint: document.body,
            template: undefined,
            CSSVariables: undefined
        }, mount);

        if (CSSVariables) {
            for (let type in CSSVariables) {
                if (type === 'root') {
                    for (let key in CSSVariables[type]) {
                        mountPoint.style.setProperty(key, CSSVariables[type][key]);
                    }
                }
            }
        }

        const {
            config,
            events,
        } = await import(`${pathname}/this/index.mjs`)

        const components = ['mss-settings', 'mss-select', 'mss-input', 'mss-datapicker', 'mss-button','checklist-checkbox', 'mss-filter','fer-pagination', 'fer-select','fer-tree', 'fer-region', 'fer-form','fer-hash','fer-table', 'fer-link', 'fer-hash', 'fer-button', 'welcome-menu', 'welcome-section', 'welcome-header']

        for (let i = 0; i < components.length; ++i) {
            import(`${pathname}/component/${components[i]}/index.mjs`)
        }

        window.scrollTo(0, 0)

        let templateContent = template
            ? template.content
            : mountPoint

        let shadow = mountPoint.attachShadow({mode: "open"});

        const shadowStyle = document.createElement('style')
        shadowStyle.textContent = `@import "${pathname}/this/css/index.shadow.css";`
        shadow.appendChild(shadowStyle)

        const lightStyle = document.createElement('style')
        lightStyle.textContent = `@import "${pathname}/this/css/index.light.css";`
        mountPoint.appendChild(lightStyle)

        // shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, shadowCSS];
        // document.adoptedStyleSheets = [...document.adoptedStyleSheets, lightCSS];

        let shadowData = templateContent.querySelector('.welcome__book')
        shadow.appendChild(shadowData)

        if (template) {
            mountPoint.appendChild(templateContent)
        }

        window.addEventListener('change-views', (event) => {
            let id = {}
            id.array = event.detail.id.split('_')
            // id.section = event.detail.section
            id.isFirst = id.array.length === 1
            const animation = mountPoint.querySelector('.animation')
            let activeSection = undefined
            const sections = mountPoint.shadowRoot.querySelectorAll('div[class*="welcome-body_section"]')
            const percent = '15vh'
            const welcomeBody = mountPoint.shadowRoot.querySelector('.welcome-body')
            // const welcomeSection = mountPoint.shadowRoot.querySelector('.welcome-body_section_1_0')
            // const welcomeLogo = mountPoint.querySelector('welcome-logo')
            // const ferScroll = mountPoint.querySelector('fer-scroll')
            // const welcomeMenu = mountPoint.querySelector('welcome-menu')

            // const welcomeSections = mountPoint.querySelectorAll(`welcome-section[data-id*="${id.array[0]}_"]`)


            const anime = {
                stagger: async () => {

                    return true
                },
                timeline: (options) => {

                    return {
                        add: async (options) => {
                            options?.changeBegin ? await options.changeBegin() : false;
                            options?.changeComplete ? await options.changeComplete(): false;
                            return true
                        }

                    }
                }
            }

            const secondLayer = async () => {
                document.dispatchEvent( new CustomEvent(`api-button-enable-or-disable`,{
                    detail: {
                        disabled: "true"
                    }
                }))

                for (let i = 0; i < sections.length; ++i) {
                    if (sections[i].dataset.id === id.array[0]) {
                        activeSection = sections[i]
                        break
                    }
                }

                if (!activeSection) {
                    console.assert(false, 'Должен определиться слот')
                    activeSection = sections[0]
                }

                let children = activeSection.querySelector('slot')

                children = children.assignedNodes()
                animation.style.opacity = '1';
                animation.style.display = 'grid'

                let tl = anime.timeline({
                    easing: 'easeOutExpo',
                    duration: 850
                });

                await tl.add({
                    targets: animation.querySelectorAll('.item'),
                    height: percent,
                    backgroundColor: '#00A0A8',
                    delay: anime.stagger(100),
                    changeComplete: async () => {
                        if (event.detail.type === 'transform' && event.detail.action === 'to') {
                            // debugger
                            activeSection.style.display = 'flex'
                            activeSection.classList.add('active')

                            welcomeBody.style.display = 'none'
                            activeSection.style.transform = `translateY(0)`
                            await setSectionData(event.detail)
                            events('welcome-header', {
                                isDisable: false
                            })

                            window.scrollTo(0, 0)
                        }
                    }
                });

                await tl.add({
                    targets: animation.querySelectorAll('.item'),
                    delay: anime.stagger(70),
                    height: percent,
                    backgroundColor: 'rgba(15,223,239,0.42)',
                    changeBegin: () => {
                        animation.style.opacity = '0';
                    },
                    changeComplete: () => {
                        if(event.detail.id === '0_0') {
                            const welcomeSection = document.body.querySelector(`welcome-section[data-id="0_0"]`)
                            const ferCodemirror = welcomeSection.querySelector('fer-codemirror')
                            ferCodemirror.refresh()
                            console.log('<<< ========================== >>>', ferCodemirror)
                            // 
                        }

                        config.page.isMain.set(true)
                        animation.style.display = 'none';
                    }
                })
            }

            const firstLayer = async () => {
                for (let i = 0; i < sections.length; ++i) {
                    if (sections[i].dataset.id === id.array[0]) {
                        activeSection = sections[i]
                        break
                    }
                }

                if (!activeSection) {
                    console.assert(false, 'Должен определиться слот')
                    activeSection = sections[0]
                }

                animation.style.opacity = '1';
                animation.style.display = 'grid'
                let tl = anime.timeline({
                    easing: 'easeOutExpo',
                    duration: 850
                });

                tl.add({
                    targets: animation.querySelectorAll('.item'),
                    height: percent,
                    backgroundColor: '#00A0A8',
                    delay: anime.stagger(100),
                    changeComplete: () => {
                        if (event.detail.type === 'transform' && event.detail.action === 'from') {
                            activeSection.style.display = 'none'
                            welcomeBody.style.display = 'flex'
                            activeSection.style.transform = `translateY(-100%)`

                            events('welcome-header', {
                                isDisable: false
                            })

                            window.scrollTo(0, 0)
                        }
                    }
                });

                tl.add({
                    targets: animation.querySelectorAll('.item'),
                    delay: anime.stagger(70),
                    height: percent,
                    backgroundColor: 'rgba(15,223,239,0.42)',
                    changeBegin: () => {
                        animation.style.opacity = '0';
                    },
                    changeComplete: () => {
                        document.dispatchEvent( new CustomEvent(`api-button-enable-or-disable`,{
                            detail: {
                                disabled: "false"
                            }
                        }))
                        config.page.isMain.set(true)
                        animation.style.display = 'none';
                    }
                })
            }

            if (id.isFirst) {
                firstLayer()
            } else {
                secondLayer()
            }

        })

        resolve()
    })
}

export default rules