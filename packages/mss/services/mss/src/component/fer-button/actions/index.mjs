import { activeClass, store, isEmpty, multiaddr, router } from '../../../this/index.mjs';
import { initSections } from '../custom/index.mjs';

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const method = await initSections()
        method.styleOpacity(self)
        const ferDialog = document.querySelector('fer-dialog')
        const ferNotificetion = document.querySelector('fer-notificetion')

        const errorDialog = (message, title = 'Ошибка') => {
            ferDialog.open = {
                type: 'error',
                title: title,
                description: [{
                    text: message
                }],
                button: [{
                    type: 'cancel',
                    description: 'Ok',
                }]
            }
        }

        resolve({
            'fer-button-in': (event) => {
                if (event.detail.type === self.dataset.type && event.detail.action === 'disable') {
                    self.disabled = true
                } else if (event.detail.type === self.dataset.type && event.detail.action === 'enable') {
                    if (!self.classList.contains(activeClass)) {
                        self.disabled = false
                    }
                }
            },
            mouseover: (events) => {
                if (self.dataset.cssShadow === 'welcomebook') {
                    self.shadowRoot.querySelectorAll('.word__item').forEach(item => {
                        if (item.classList.contains('word__item--left')) {
                            item.classList.remove('word__item_active-right')
                            item.classList.add('word__item_active-left')
                        } else {
                            item.classList.remove('word__item_active-left')
                            item.classList.add('word__item_active-right')
                        }
                    })
                }
            },
            mouseout: (events) => {
                if (self.dataset.cssShadow === 'welcomebook') {
                    self.shadowRoot.querySelectorAll('.word__item').forEach(item => {
                        if (item.classList.contains('word__item--left')) {
                            item.classList.remove('word__item_active-left')
                            item.classList.add('word__item_active-right')
                        } else {
                            item.classList.remove('word__item_active-right')
                            item.classList.add('word__item_active-left')
                        }
                    })
                }
            },
            click: async (event) => {
                if (self.disabled) {
                    return;
                } else {
                    self.disabled = true
                }

                if (!self.dataset.type) {
                    console.error('Требуется указать в атрибутах компонента data-type', self)
                    return;
                }

                if (!self.dataset.id) {
                    console.error('Требуется указать в атрибутах компонента data-id', self)
                    return;
                }

                const section = store.get('section')
                const route = await router(self, { location })

                const welcomeSections = document.querySelectorAll('welcome-section')

                welcomeSections.forEach(item => {
                    item.cleanState('all')
                    const ferPagination = item.querySelector('fer-pagination')
                    if(!isEmpty(ferPagination)) {
                        ferPagination.cleanState('all')
                    }
                })

                const mssFilter = document.querySelector('mss-filter');
                const container = mssFilter.shadowRoot.querySelector('.container');
                const mssInputs = container.querySelectorAll('mss-input');
                const buttonAdd = container.querySelector('.button_add')
                const buttonExport = container.querySelector('.button_export')
                const buttonFilterFirst = mssFilter.shadowRoot.querySelector('.button_filter_first')

                const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
                const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);
                const dropdownButtonCode = ferSelectCode.shadowRoot.querySelector('.dropdown__button')
                const dropdownButtonName = ferSelectName.shadowRoot.querySelector('.dropdown__button')

                ferSelectActive.clean = {}
                ferSelectCode.clean = {}
                ferSelectName.clean = {}

                mssFilter.dataset.section = section
                mssFilter.dataset.rights = ''
                mssFilter.dataset.rights = route.rights.join(' ')

                buttonAdd.removeAttribute('disabled')
                ferSelectActive.style.display = 'none'

                mssInputs.forEach(item => {
                   if(section.toString() === "0") {
                       item.style.display = 'flex'
                       item.classList.add('visible')
                   } else if(section.toString() === "7") {
                       item.classList.add('active')
                   } else {
                       item.style.display = 'none'
                   }

                   item.clean = true
                })

                document.dispatchEvent(new CustomEvent(`fer-select`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action: 'disabled'
                    }
                }));

                if(section.toString() === "0") {
                    buttonExport.classList.add('invisible')
                    buttonFilterFirst.classList.add('invisible')
                    buttonAdd.classList.add('visible')
                    ferSelectActive.style.display = 'none'
                    ferSelectCode.style.display = 'none'
                    ferSelectCode.style.width = '345px'
                    ferSelectName.style.display = 'none'
                    ferSelectName.style.width = '345px'
                    mssFilter.classList.add('active-section')
                    dropdownButtonCode.setAttribute('placeholder', 'Код')
                    dropdownButtonName.setAttribute('placeholder', 'Код')
                }

                if(section.toString() === "6") {
                    buttonExport.classList.add('invisible')
                    buttonFilterFirst.classList.add('invisible')
                    buttonAdd.classList.add('visible')
                    ferSelectCode.style.display = 'flex'
                    ferSelectCode.style.width = '416px'
                    ferSelectName.style.display = 'flex'
                    ferSelectName.style.width = '416px'
                    mssFilter.classList.add('active-section')
                    dropdownButtonCode.setAttribute('placeholder', 'Код взаимодействия')
                    dropdownButtonName.setAttribute('placeholder', 'Наименование взаимодействия')
                }

                if(section.toString() === "7") {
                    buttonExport.classList.add('invisible')
                    buttonFilterFirst.classList.add('invisible')
                    buttonAdd.classList.add('visible')
                    ferSelectActive.style.display = 'flex'
                    ferSelectCode.style.display = 'none'
                    // ferSelectCode.removeAttribute('style')
                    ferSelectName.style.display = 'none'
                    // ferSelectName.removeAttribute('style')
                    mssFilter.classList.add('active-section')

                    mssInputs.forEach(item => {
                        if(item.dataset.field === 'code') {
                            const input = item.shadowRoot.querySelector('input')
                            input.setAttribute('placeholder', 'Код системы')
                            item.style.display = 'flex'
                        }

                        if(item.dataset.field === 'name') {
                            const input = item.shadowRoot.querySelector('input')
                            input.setAttribute('placeholder', 'Код взаимодействия')
                            item.style.display = 'flex'
                        }

                        item.clean = true
                    })

                    // dropdownButtonCode.setAttribute('placeholder', 'Код системы')
                    // dropdownButtonName.setAttribute('placeholder', 'Код взаимодействия')
                }

                if(section.toString() === "5") {
                    buttonFilterFirst.classList.add('invisible')
                    buttonExport.classList.add('invisible')
                    buttonAdd.classList.remove('invisible')
                    buttonAdd.classList.add('visible')
                    ferSelectActive.style.display = 'none'
                    ferSelectCode.style.display = 'none'
                    // ferSelectCode.removeAttribute('style')
                    ferSelectName.style.display = 'none'
                    // ferSelectName.removeAttribute('style')
                    mssFilter.classList.add('active-section')
                    dropdownButtonCode.setAttribute('placeholder', 'Код системы')
                    dropdownButtonName.setAttribute('placeholder', 'Код взаимодействия')
                }

                window.scroll({
                    top: 0,
                    left: 0
                });

                console.log('    🥎 FER-BUTTON', {
                    type: self.dataset.type,
                    id: self.dataset.id,
                    action: `${self.dataset.type}__${self.dataset.id}`
                })

                document.dispatchEvent(new CustomEvent('mss-pagination_reset-offset', {
                    bubbles: true,
                    composed: true,
                }));

                const timeId = setTimeout(() => {
                    clearTimeout(timeId)
                    if (self.dataset.switchoff !== undefined) {
                        self.classList.remove(activeClass)

                    }
                }, 300)

                self.disabled = false
            },
            popstate: (events) => {
                // console.log(' POPSTATE ', self.tagName)
            },
            hashchange: (events) => {
                // console.log('HASH CHANGE', self.tagName)
            }
        })
    })
}
export default {
    description: 'fer-button'
}