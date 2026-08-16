import { store, router, isEmpty } from '../../../this/index.mjs';
const ferDialog = document.querySelector('fer-dialog')
let api = Symbol.for("api");

const universalBOM = "\uFEFF";

function save(filename, data, type) {
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(data, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(data);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const buttonAdd = self.shadowRoot.querySelector('.button_add')
        const section = store.get('section')
        const container = self.shadowRoot.querySelector('.container');
        const mssInputs = container.querySelectorAll('mss-input');
        const ferSelect = self.shadowRoot.querySelector(`[data-field="active"]`);
        const ferSelectCode = self.shadowRoot.querySelector(`[data-field="code"]`);
        const ferSelectName = self.shadowRoot.querySelector(`[data-field="name"]`);

        resolve({
            navigation: () => {
                // if(section.toString() !== "6") {
                    buttonAdd.classList.add('visible')
                // } else {
                //     buttonAdd.classList.remove('visible')
                // }
            },
            CustomEvent: {
                mssFilter: {
                    export: async (event) => {
                        const ferDialog = document.body.querySelector('fer-dialog')
                        const buttonSave = ferDialog.shadowRoot.querySelector('.footer-button.save')
                        const buttonCancel = ferDialog.shadowRoot.querySelector('.footer-button.cancel')

                        buttonSave.setAttribute('disabled', '')
                        buttonCancel.setAttribute('disabled', '')

                        const mssFilter = document.body.querySelector('mss-filter')
                        const filter = mssFilter.getState('filter')
                        let request = '/metamart-subscription-service/api/v1/audit/export?'

                        if(filter.startDate) {
                            request = request + `startDate=${encodeURIComponent(filter.startDate)}`
                        }

                        if(filter.endDate && !filter.startDate) {
                            request = request + `endDate=${encodeURIComponent(filter.endDate)}`
                        }

                        if(filter.endDate && filter.startDate) {
                            request = request + `&endDate=${encodeURIComponent(filter.endDate)}`
                        }

                        const authorization =store.get('authorization')

                        let record = await fetch(request, {
                            headers: {
                                Authorization: `Bearer ${authorization.token.access}`
                            }
                        })

                        if(record.ok) {
                            record = await record.blob()

                            const type = 'text/csv'

                            Number.prototype.padLeft = function(base,chr){
                                var  len = (String(base || 10).length - String(this).length)+1;
                                return len > 0? new Array(len).join(chr || '0')+this : this;
                            }

                            let d = new Date(Date.now()),
                                dformat =
                                    [d.getDate().padLeft(),
                                     (d.getMonth() + 1).padLeft(),
                                     d.getFullYear()].join('.') +' ' +
                                    [d.getHours().padLeft(),
                                    d.getMinutes().padLeft(),
                                    d.getSeconds().padLeft()].join('.')

                            save(`Выгрузка журнала изменений от ${dformat}.csv`, record, type)

                        } else {
                            console.log('ERROR', record)
                            errorDialog('При выгрузке статистики произошла ошибка');
                        }

                        buttonSave.removeAttribute('disabled')
                        buttonCancel.removeAttribute('disabled')
                        ferDialog.open = false;
                    },
                    update: () => {
                        const section = store.get('section');
                        const container = self.shadowRoot.querySelector('.container');
                        const titleHeader = container.querySelector('.titleHeader')
                        const mssInput = container.querySelectorAll('mss-input');
                        const back = self.shadowRoot.querySelector('.back');
                        const page_title = self.shadowRoot.querySelector('.page_title');
                        let buttonAdd = self.shadowRoot.querySelector('.button_add')

                        if(section.toString() !== "6") {
                            buttonAdd.classList.add('visible')
                        } else {
                            buttonAdd.classList.remove('visible')
                        }
                    }
                }
            },
            button: {
                back: async (event) => {
                    if (self.disabled) {
                        return;
                    } else {
                        self.disabled = true
                    }

                    const route = await router(self, { location })
                    const currentSection = store.get('section')
                    const service = document.querySelector('.service')

                    const container = self.shadowRoot.querySelector('.container');
                    const titleHeader = container.querySelector('.titleHeader')
                    const mssInput = container.querySelectorAll('mss-input');
                    const mssFilter = document.body.querySelector('mss-filter')
                    const back = self.shadowRoot.querySelector('.back');
                    const page_title = self.shadowRoot.querySelector('.page_title');

                    if(currentSection.toString() === "5_0") {
                        const menuAudit = self.shadowRoot.querySelector('.menu_audit')
                        menuAudit.classList.add('invisible')
                    }

                    if(currentSection === '6_0') {
                        buttonAdd.classList.add('visible')
                        ferSelectCode.style.display = 'flex'
                        ferSelectName.style.display = 'flex'
                        mssInputs[0].style.display = 'none'
                        mssInputs[0].clean = true
                        mssInputs[1].style.display = 'none'
                        mssInputs[1].clean = true
                        mssFilter.dataset.section = route.key

                        if(mssFilter.dataset.hasOwnProperty('recipientId')) {
                            delete mssFilter.dataset.recipientId
                        }

                        if(mssFilter.dataset.hasOwnProperty('interactionId')) {
                            delete mssFilter.dataset.interactionId
                        }

                        const currentWelcomeSection = service.querySelector(`welcome-section[data-id="${currentSection}"]`);
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${route.key}"]`);
                        ferSelectCode.clean = true
                        ferSelectName.clean = true
                        welcomeSection.cleanState('all')
                        currentWelcomeSection.cleanState('all')

                        const ferTable = currentWelcomeSection.querySelectorAll('fer-table')
                        const toFerTable = welcomeSection.querySelectorAll('fer-table')

                        toFerTable.forEach(item => {
                            item.erase
                        })

                        ferTable.forEach(item => {
                            item.terminate
                        })

                        history.pushState('Правила', {}, route.pathName);
                        store.set('section', route.key.toString())

                        toFerTable.forEach(item => {
                            item.refresh()
                        })

                        back.style.display = 'none';
                        page_title.style.display = 'none';

                        if(titleHeader) {
                            titleHeader.style.display = 'none';
                        }

                        window.dispatchEvent(new CustomEvent('change-views', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: route.key,
                                from: currentSection,
                                type: 'transform',
                                action: `from`
                            }
                        }));
                    }

                    if(currentSection === '7_0') {
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${currentSection}"]`);
                        const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);

                        const ferTable = welcomeSection.querySelectorAll('fer-table')
                        const toFerTable = toWelcomeSection.querySelectorAll('fer-table')
                        const toFerPagination = toWelcomeSection.querySelector('fer-pagination')
                        const ferPagination = welcomeSection.querySelector('fer-pagination')

                        if(!isEmpty(toFerPagination)) {
                            toFerPagination.reset = true
                        }

                        if(!isEmpty(ferPagination)) {
                            toFerPagination.reset = true
                        }

                        mssInputs[0].clean = true
                        mssInputs[1].clean = true
                        mssInputs[1].style.display = 'flex'
                        mssInputs[0].style.display = 'flex'
                        mssInputs[0].classList.remove('invisible')
                        mssInputs[1].classList.remove('invisible')

                        welcomeSection.cleanState('all')
                        toWelcomeSection.cleanState('all')

                        container.style.display = 'flex'
                        history.pushState('Правила', {}, route.pathName);

                        store.set('section', route.key.toString())

                        ferTable.forEach(item => {
                            item.terminate
                        })

                        toFerTable.forEach(item => {
                            item.refresh()
                        })

                        back.style.display = 'none';
                        page_title.style.display = 'none';

                        if(titleHeader) {
                            titleHeader.style.display = 'none';
                        }

                        window.dispatchEvent(new CustomEvent('change-views', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: route.key,
                                from: currentSection,
                                type: 'transform',
                                action: `from`
                            }
                        }));
                    }

                    if(currentSection === '5_0') {

                        const currentWelcomeSection = service.querySelector(`welcome-section[data-id="${currentSection}"]`);
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${route.key}"]`);

                        currentWelcomeSection.cleanState('all')
                        const ferTable = currentWelcomeSection.querySelectorAll('fer-table')
                        const toFerTable = welcomeSection.querySelectorAll('fer-table')

                        ferTable.forEach(item => {
                            item.terminate
                        })

                        welcomeSection.cleanState('all')
                        container.style.display = 'flex'
                        history.pushState('Правила', {}, route.pathName);
                        store.set('section', route.key.toString())

                        toFerTable.forEach(item => {
                            item.refresh()
                        })

                        back.style.display = 'none';
                        page_title.style.display = 'none';

                        if(titleHeader) {
                            titleHeader.style.display = 'none';
                        }

                        document.dispatchEvent(new CustomEvent(`change-views-template`, {
                            bubbles: true,
                            composed: true,
                            detail: {
                                section: '5'
                            }
                        }));

                        window.dispatchEvent(new CustomEvent('change-views', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: route.key,
                                from: currentSection,
                                type: 'transform',
                                action: `from`
                            }
                        }));
                    }

                    self.disabled = false
                },
                export: (event) => {
                    if (self.disabled) {
                        return;
                    } else {
                        self.disabled = true
                    }
                    const section = store.get('section')
                    const container = self.shadowRoot.querySelector('.container');
                    const mssInputs = container.querySelectorAll('mss-input');
                    const ferSelects = self.shadowRoot.querySelectorAll('fer-select')

                    mssInputs.forEach(item => {
                        item.clean = true
                    })

                    ferSelects.forEach(item => {
                        const dropdownList  = item.shadowRoot.querySelector('.dropdown__list')
                        if(dropdownList.classList.contains('dropdown__list_visible')) {
                            dropdownList.classList.remove('dropdown__list_visible')
                        }
                    })

                    const currentSection = store.get('section')

                    if(currentSection.toString() === '5') {
                        ferDialog.open = {
                            type: 'create',
                            to: undefined,
                            id: section,
                            title: 'Укажите дату или период для выгрузки данных',
                            mapping: ['datapicker', 'cancel', 'save'],
                            datapicker: [{
                                id: 'datapicker',
                                type: 'datapicker',
                                value: 'Дата начала',
                                dialog: 'restore',
                                time: {
                                    startAt: undefined,
                                    endAt: undefined
                                },
                                end: {
                                    id: 'datapicker_end',
                                    type: 'datapicker',
                                    value: 'Дата окончания',
                                    dialog: 'audit',
                                    time: {
                                        startAt: undefined,
                                        endAt: undefined
                                    }
                                }
                            }],
                            button: [{
                                id: 'after',
                                type: 'cancel',
                                description: 'Отмена'
                            }, {
                                id: 'after',
                                type: 'save',
                                description: 'Хорошо'
                            }]
                        };
                    }

                    self.disabled = false
                },
                add: async (event) => {
                    if (self.disabled) {
                        return;
                    } else {
                        self.disabled = true
                    }

                    const section = store.get('section')
                    const container = self.shadowRoot.querySelector('.container');
                    const mssInputs = container.querySelectorAll('mss-input');
                    const ferSelects = self.shadowRoot.querySelectorAll('fer-select')

                    console.log('-------- section ----------', section)
                    if(section.toString() !== '0') {
                        mssInputs.forEach(item => {
                            item.clean = true
                        })
                    }

                    ferSelects.forEach(item => {
                        const dropdownList  = item.shadowRoot.querySelector('.dropdown__list')
                        if(dropdownList.classList.contains('dropdown__list_visible')) {
                            dropdownList.classList.remove('dropdown__list_visible')
                        }
                    })

                    const currentSection = store.get('section')

                    if(currentSection.toString() === '0') {
                        event.currentTarget.setAttribute('disabled', '')

                        document.dispatchEvent(new CustomEvent('mss-filter_add_note', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: '0',
                                to: currentSection.toString()
                            }
                        }));

                        self.disabled = false
                        return
                    }

                    if(currentSection.toString() === '6_0' || currentSection.toString() === '6') {
                        document.dispatchEvent(new CustomEvent('mss-filter-add-settingsRule', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: currentSection.toString(),
                                to: currentSection.toString() === '6_0'? '6': '6_0'
                            }
                        }));

                        self.disabled = false
                        return
                    }

                    if(currentSection.toString() === '7') {
                        document.dispatchEvent(new CustomEvent('mss-filter_add_settings', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                id: '7',
                                to: '7_0'
                            }
                        }));

                        self.disabled = false
                        return
                    }

                    self.disabled = false
                }
            }
        })
    })
}

export default {
    description: 'action'
}