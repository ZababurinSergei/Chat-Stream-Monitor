let pathname = undefined;
const getChildren = (content) => {
    let isShadowDom = false;
    const container = {
        shadowDom: [],
        lightDom: []
    };
    for (let i = 0; i < content.children.length; ++i) {
        isShadowDom = !content.children[i].tagName.includes('-');

        if (content.children[i].dataset.exclusion !== undefined) {
            isShadowDom = !isShadowDom;
        }

        if (isShadowDom) {
            container.shadowDom.push(content.children[i]);
        } else {
            container.lightDom.push(content.children[i]);
        }
    }

    return container;
};

export const init = (self, isCustomTag) => {
    return new Promise(async (resolve, reject) => {
        if(isCustomTag) {
            let container = {
                shadowDom: [],
                lightDom: []
            };

            if (self.children[0] !== undefined && self.children[0].tagName === 'TEMPLATE' && self.children[1] === undefined) {
                for (let i = 0; i < self.children.length; ++i) {
                    const content = self.children[i].content;
                    container = getChildren(content);
                    self.children[i].remove();
                }
            } else {
                for(let i = 0; i < self.children.length; ++i) {
                    if(self.children[i].tagName === 'TEMPLATE') {
                        for (let i = 0; i < self.children.length; ++i) {
                            const content = self.children[i].content;
                            container = getChildren(content);
                            self.children[i].remove();
                        }
                    } else {
                        self.children[i].classList.add('invisible')
                    }
                }
            }

            pathname = new URL('../../../../', import.meta.url)

            if(self.dataset.cssLight) {
                let linkLight = `${pathname}component/${self.tagName.toLowerCase()}/this/css/index.light.css`;
                const styleLight = document.createElement('style');
                styleLight.textContent = `@import "${linkLight}";`;
                self.appendChild(styleLight);
            }

            if (container.shadowDom.length > 0) {
                let link = `${pathname}component/${self.tagName.toLowerCase()}/this/css/index.shadow.css`;

                if (!self.shadowRoot) {
                    self.attachShadow({mode: 'open'});
                }

                const style = document.createElement('style');
                style.textContent = `@import "${link}";`;
                self.shadowRoot.appendChild(style);
                style.onload = () => {
                    for (let i = 0; i < container.shadowDom.length; ++i) {
                        self.shadowRoot.append(container.shadowDom[i]);
                    }

                    if (container.lightDom.length > 0) {
                        for (let i = 0; i < container.lightDom.length; ++i) {
                            self.appendChild(container.lightDom[i])
                        }
                    }

                    resolve(self);
                };
            } else {
                resolve(self);
            }

            if (container.lightDom.length > 0 && container.shadowDom.length === 0) {
                for (let i = 0; i < container.lightDom.length; ++i) {
                    self.appendChild(container.lightDom[i])
                }
                resolve(self);
            }
        } else {
            resolve(self);
        }

    });
};

export const template = init

export default {
    description: 'add style and template'
};