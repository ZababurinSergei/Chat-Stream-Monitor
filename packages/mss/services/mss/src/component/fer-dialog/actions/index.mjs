import {Models} from "../../../models/index.mjs";
import {store} from "../../../this/index.mjs";

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const models = await Models(self)
        const ferNotificetion = document.querySelector('fer-notification');

        resolve({
            closeButtonClick: (event) => {
                ferNotificetion.closeToasts();
                self.open = false
            },
            clickFerSelect: (event) => {
                const ferSelect = self.shadowRoot.querySelectorAll('fer-select')
                if(ferSelect.length !== 0) {
                    for(let item of ferSelect) {
                        const withinBoundaries = event.composedPath().includes(item);
                        if(!withinBoundaries) {
                            item.open = false
                        }
                    }
                }
            },
            executorValidators: async (payload) => models.post.executor.validators(),
            click: (event) => {
                event.stopPropagation();
                const content = self.shadowRoot.querySelector('.content')
                let isClose = !event.composedPath().includes(content);
                const title = event.currentTarget.shadowRoot.querySelector('.title')
                if(isClose && !title.textContent.includes('описание ошибки')) {
                    const section = store.get('section')
                    const welcomeSection = document.body.querySelector(`welcome-section[data-id="${section}"]`)
                    const mssFilter = document.querySelector('mss-filter');
                    const container = mssFilter.shadowRoot.querySelector('.container');
                    const buttonAdd = container.querySelector('.button_add')
                    buttonAdd.removeAttribute('disabled')
                    welcomeSection.cleanState('directory')
                    welcomeSection.cleanState('subscription')
                    self.open = false
                    ferNotificetion.closeToasts();
                }
            }
        })
    })
}

export default {
    description: 'actions fer-dialog'
}