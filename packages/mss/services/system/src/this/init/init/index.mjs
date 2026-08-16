import { store, component } from '../../index.mjs'

const getChildren = (content) => {
    let isShadowDom = false
    const container = {
        shadowDom: [],
        lightDom: []
    }
    for (let i = 0; i < content.children.length; ++i) {
        isShadowDom = !content.children[i].tagName.includes('-')

        if(content.children[i].dataset.exclusion !== undefined) {
            isShadowDom = !isShadowDom
        }

        if(isShadowDom) {
            container.shadowDom.push(content.children[i])
        } else {
            container.lightDom.push(content.children[i])
        }
    }

    return container
}

export const init = (self, pathname = undefined) => {
    return new Promise(async (resolve, reject) => {
        if(self.children[0] !== undefined && self.children[0].tagName === 'TEMPLATE' && self.children[1] === undefined ) {
            let container = {
                shadowDom: [],
                lightDom: []
            }

            for (let i = 0; i < self.children.length; ++i) {
                if( self.children[i].tagName === 'TEMPLATE') {
                    const content = self.children[i].content
                    container = getChildren(content)
                    self.children[i].remove()
                }
            }

            if(!pathname) {
                pathname = store.get('pathname').pathname

                if(pathname === null) {
                    pathname = '.'
                }
            }


            if (container.shadowDom.length > 0) {
                let link = `${pathname}/component/${self.tagName.toLowerCase()}/views/css/index.shadow.css`

                if (!self.shadowRoot) {
                    self.attachShadow({mode: 'open'})
                }

                if (self.dataset.cssShadow) {
                    link = `${pathname}/component/${self.tagName.toLowerCase()}/views/css/${self.dataset.cssShadow}.shadow.css`
                }

                if(component[self.tagName]?.data?.cssShadow) {
                    link = `${pathname}/component/${self.tagName.toLowerCase()}/views/css/${component[self.tagName]?.data?.cssShadow}.shadow.css`
                }

                const style = document.createElement('style')
                style.textContent = `@import "${link}";`
                self.shadowRoot.appendChild(style)
                style.onload = () => {
                    for (let i = 0; i < container.shadowDom.length; ++i) {
                        if(component[self.tagName]?.is) {
                            for(let key in component[self.tagName].is) {
                                const item = container.shadowDom[i].querySelector(`.${key}`)
                                if(item !== null && !component[self.tagName].is[key]) {
                                    item.remove()
                                }
                            }
                        }

                        self.shadowRoot.appendChild(container.shadowDom[i])
                    }
                    resolve(self)
                }
            }

            if(container.lightDom.length > 0) {
                for (let i = 0; i < container.lightDom.length; ++i) {
                    self.appendChild(container.lightDom[i])
                }
            }
        } else {
            if(self.children[0] !== undefined && self.children[0].tagName === 'TEMPLATE' && self.children[1] !== undefined) {
                alert(`Если используется  template вся разметка должна быть внутри`)
            } else {
                const shadowDom = []
                const isTemplate = self.dataset.template !== undefined
                const isLight = "csslight" in self.dataset
                const isAttachShadow = "attachshadow" in self.dataset

                if(isAttachShadow) {
                    self.attachShadow({mode: 'open'})
                    let link = `/services/system/src/component/${self.tagName.toLowerCase()}/views/css/index.shadow.css`
                    const style = document.createElement('style');
                    style.textContent = `@import "${link}";`;
                    self.shadowRoot.appendChild(style);
                }

                if(isLight) {
                    const name = self.dataset.csslight.length === 0 ? 'index' : self.dataset.csslight
                    const link = `/services/system/src/component/${self.tagName.toLowerCase()}/views/css/${name}.light.css`
                    const root = self.getRootNode()


                    const style = document.createElement('style');
                    style.textContent = `@import "${link}";`;
                    root.appendChild(style);
                }

                if (isTemplate) {
                    const { html } = await import(`../../../component/${self.tagName.toLowerCase()}/views/index.mjs`)

                    const template = html.has(self.slot)
                        ? await html.get(self.slot)[0].template(self.slot)
                        : await html.get('default')[0].template(self.slot)

                    self.innerHTML = ''
                    self.insertAdjacentHTML('afterbegin', template)

                    resolve(self)
                } else {
                    for (let i = 0; i < self.children.length; ++i) {
                        let isShadowDom = !self.children[i].tagName.includes('-')

                        if(self.children[i].dataset.exclusion !== undefined) {
                            isShadowDom = !isShadowDom
                        }

                        if(isShadowDom) {
                            shadowDom.push(self.children[i])
                        }
                    }

                    if (shadowDom.length > 0) {
                        let link = `/services/system/src/component/${self.tagName.toLowerCase()}/views/css/index.shadow.css`

                        if (!self.shadowRoot) {
                            self.attachShadow({mode: 'open'})
                        }

                        if (self.dataset.cssShadow) {
                            link = `/services/system/src/component/${self.tagName.toLowerCase()}/views/css/${self.dataset.cssShadow}.shadow.css`
                        }

                        const style = document.createElement('style');
                        style.textContent = `@import "${link}";`;
                        self.shadowRoot.appendChild(style);

                        for (let i = 0; i < shadowDom.length; ++i) {
                            self.shadowRoot.appendChild(shadowDom[i])
                        }
                    }

                    resolve(self)
                }
            }
        }
    })
}

export default {
    description: 'add style and template'
}