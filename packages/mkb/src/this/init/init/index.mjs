import { store } from '../../index.mjs';

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

export const init = (self) => {
    return new Promise(async (resolve, reject) => {
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
            if (self.children[0] !== undefined && self.children[0].tagName === 'TEMPLATE' && self.children[1] !== undefined) {
                alert(`Если используется  template вся разметка должна быть внутри`);
            } else {
                for (let i = 0; i < self.children.length; ++i) {
                    let isShadowDom = !self.children[i].tagName.includes('-');

                    if (self.children[i].dataset.exclusion !== undefined) {
                        isShadowDom = !isShadowDom;
                    }

                    if (isShadowDom) {
                        container.shadowDom.push(self.children[i]);
                    }
                }
            }
        }

        if (!pathname) {
            pathname = store.get('pathname').pathname;
        }

        if (pathname === null || !pathname) {
            pathname = '.';
        }

        // if(self.tagName === 'WELCOME-SECTION') {
        //     console.log('container', container, self.tagName)
        //     
        // }

        if (container.shadowDom.length > 0) {
            let link = `${pathname}/component/${self.tagName.toLowerCase()}/views/css/index.shadow.css`;

            if (!self.shadowRoot) {
                self.attachShadow({ mode: 'open' });
            }

            if (self.dataset.cssShadow) {
                link = `${pathname}/component/${self.tagName.toLowerCase()}/views/css/${self.dataset.cssShadow}.shadow.css`;
            }

            const style = document.createElement('style');
            style.textContent = `@import "${link}";`;
            self.shadowRoot.appendChild(style);
            style.onload = () => {
                for (let i = 0; i < container.shadowDom.length; ++i) {
                    self.shadowRoot.append(container.shadowDom[i]);
                }

                if(container.lightDom.length > 0) {
                    for (let i = 0; i < container.lightDom.length; ++i) {
                        self.appendChild(container.lightDom[i])
                    }
                }

                resolve(self);
            };
        } else {
            resolve(self);
        }

        if(container.lightDom.length > 0 && container.shadowDom.length === 0) {
            for (let i = 0; i < container.lightDom.length; ++i) {
                self.appendChild(container.lightDom[i])
            }
            resolve(self);
        }
    });
};

export default {
    description: 'add style and template'
};