import { store, isEmpty, router } from '../../../this/index.mjs';
let api = Symbol.for("api");
const ferNotificetion = document.querySelector('fer-notification');
const ferDialog = document.querySelector('fer-dialog');

const errorDialog = (message) => {
    ferDialog.open = {
        type: 'error',
        title: 'Ошибка',
        description: [{
            text: message
        }],
        button: [{
            type: 'cancel',
            description: 'Ok'
        }]
    };
};
const successDialog = (message) => {
    ferDialog.open = {
        type: 'success',
        title: '',
        description: [{
            text: message
        }],
        button: [{
            type: 'success',
            description: 'Хорошо'
        }]
    };
};

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
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
                    description: 'Ok'
                }]
            };
        };

        resolve({
            under: (event) =>  {
                const section = store.get('section')

                if(!isEmpty(section)) {
                    if(section.toString() === '5_0' || section.toString() === '5') {
                        const menu = self.shadowRoot.querySelector('.filter.menu.open')

                        if(menu) {
                            const filterIcon = self.shadowRoot.querySelector('.filter.icon')
                            const withinBoundaries = event.composedPath().includes(menu);
                            const isIcon = event.composedPath().includes(filterIcon);
                            if (!withinBoundaries && !isIcon) {
                                self.close = true
                            }
                        }
                    } else {
                        const menu = self.shadowRoot.querySelector('.menu.open')
                        const filterIcon = self.shadowRoot.querySelector('.icon')
                        const withinBoundaries = event.composedPath().includes(menu);
                        const isIcon = event.composedPath().includes(filterIcon);
                        console.log('--------------------------------- 3 --------------------------------------',filterIcon,  !isIcon)
                        if (!withinBoundaries && !isIcon) {
                            console.log('--------------------------------- 4 --------------------------------------')
                            self.close = true
                        } else {
                            console.log('---------------------------------{{{ 5 }}} --------------------------------------')
                        }
                    }
                }
            },
            filter: {
                clean: (event) => {
                    const section = store.get('section')
                    const mssFilter = document.querySelector('mss-filter')

                    if(section.toString() === "5") {
                       const filter = mssFilter.getState('filter_5')
                        mssFilter.cleanState('filter_5')
                        const ferSelect = self.shadowRoot.querySelectorAll('fer-select')
                        for(let i= 0; i< ferSelect.length; ++i) {
                            ferSelect[i].dataset.value = ''
                            if(ferSelect[i].classList.contains('invisible')) {
                                ferSelect[i].classList.remove('invisible')
                            }
                            ferSelect[i].shadowRoot.querySelector('button').innerHTML = ''
                            const active = ferSelect[i].shadowRoot.querySelector('.dropdown__arrow_active')
                            if(!isEmpty(active)) {
                                active.classList.remove('dropdown__arrow_active')
                            }
                        }

                        self.controller.api.execute(event)
                    }

                    if(section.toString() === "5_0") {
                        mssFilter.cleanState('filter_5_0')
                        const ferSelect = self.shadowRoot.querySelectorAll('fer-select')
                        for(let i= 0; i< ferSelect.length; ++i) {
                            ferSelect[i].dataset.value = ''
                            ferSelect[i].shadowRoot.querySelector('button').innerHTML = ''
                            const active = ferSelect[i].shadowRoot.querySelector('.dropdown__arrow_active')
                            if(!isEmpty(active)) {
                                active.classList.remove('dropdown__arrow_active')
                            }
                        }
                        console.log('====== CLEAN 5_0 =============')
                    }

                },
                execute: async (event) => {
                    const section = store.get('section')
                    const mssFilter = document.querySelector('mss-filter')

                    if(section.toString() === "5") {
                        const filter = mssFilter.getState('filter_5')
                        let request = {}
                        for(let key in filter) {
                            if(!isEmpty(filter[key])) {
                                request[key] = filter[key]
                            }
                        }

                        const service = document.querySelector('.service')
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${section}"]`)
                        const ferTable = welcomeSection.querySelector('fer-table');
                        const ferPagination = ferTable.querySelector('fer-pagination')

                        let pagination = ferPagination.getState('pagination')
                        ferPagination.offset = pagination.offset
                        ferPagination.limit = pagination.limit

                        const audit = await window[api].fetch.post('/api/v1/audit',request, false, {
                            limit: pagination.limit,
                            offset: pagination.offset
                        });

                        if (audit.res.ok) {
                            // console.log('sssssssssssssss', audit)
                            // debugger
                            pagination.offset = audit.res.body.offset
                            pagination.limit = audit.res.body.limit
                            pagination.total = audit.res.body.total

                            ferPagination.maxCount = pagination.total


                            const service = document.querySelector('.service')
                            const welcomeSection = service.querySelector(`welcome-section[data-id="${section}"]`)
                            const ferTable = welcomeSection.querySelector('fer-table');
                            welcomeSection.cleanState('all')
                            welcomeSection.setState("post:/api/v1/audit", audit)
                            ferTable.refresh()
                        } else {
                            errorDialog(audit.res.obj.description);
                        }
                    }

                    if(section.toString() === "5_0") {
                        const filter = mssFilter.getState('filter_5_0')
                        let request = {}
                        for(let key in filter) {
                            if(!isEmpty(filter[key])) {
                                request[key] = filter[key]
                            }
                        }

                        const route = await router(self, { location });

                        request.directoryRecordId = route.link

                        const audit = await window[api].fetch.post('/api/v1/audit',request, false, {
                            limit: 32,
                            offset: 0
                        });

                        if (audit.res.ok) {
                            const service = document.querySelector('.service')
                            const welcomeSection = service.querySelector(`welcome-section[data-id="${section}"]`)
                            const ferTable = welcomeSection.querySelector('fer-table');
                            welcomeSection.cleanState('all')
                            welcomeSection.setState("post:/api/v1/audit", audit)
                            ferTable.refresh()
                        } else {
                            errorDialog(audit.res.obj.description);
                        }
                    }

                    self.close = true
                }
            },
            close: (event) => {
                event.stopImmediatePropagation()
                const menu = self.shadowRoot.querySelector('.menu')

                menu.classList.remove('active')
                menu.classList.remove('open')
                self.classList.remove('open')
            },
            click: (event) => {
                let section = store.get('section')
                const menu = self.shadowRoot.querySelector('.menu')
                if(section.toString() === '5' || section.toString() === '5_0') {
                    menu.classList.add('open')
                } else {
                    menu.classList.toggle('open')
                }
            },
            button: {
                filter: (event) => {
                    if(self.classList.contains('open')) {
                        self.close = {}
                        return;
                    } else {
                        self.open = {}
                        return
                    }
                },
                filterItem: (event) => {
                    if(self.classList.contains('open')) {
                        self.close = {}
                    } else {
                        self.open = {}
                    }
                    debugger
                    self.classList.toggle('open')
                    console.log('event FILTER ==== 2', event)
                },
                restore: (event) => {
                    event.stopPropagation()
                    const ferTable = self.getRootNode().host
                    const welcomeSection = ferTable.closest('welcome-section')
                    const ferDialog = document.querySelector('fer-dialog')
                    const pathname = store.get('pathname').pathname;
                    const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                    self.click()
                    const body_tr = self.closest('.body_tr.registry.array')

                    let subscription = ''
                    let title = ''
                    if(isSuppliers) {
                        title = 'Включить рассылку системы'
                        subscription = welcomeSection.getState("get:/api/v1/sending")
                    } else {
                        title = 'Включить подписку системы'
                        subscription = welcomeSection.getState("get:/api/v1/subscription")
                    }

                    const currentItem = subscription.res.body.data.find(item => item.id === body_tr.dataset.subscriptionId)
                    welcomeSection.setState('subscription', currentItem)

                    ferDialog.open = {
                        type: 'create',
                        id: `${welcomeSection.dataset.id}-restore`,
                        title: title,
                        mapping: ['recipient', 'interaction', 'datapicker', 'footer-button', 'footer-button save'],
                        checkbox: [{
                            id: 'checkbox',
                            type: 'checkbox',
                            value: '1',
                            title: 'Включенно'
                        }],
                        datapicker: [{
                            id: 'datapicker',
                            type: 'datapicker',
                            value: 'Дата начала',
                            dialog: 'restore',
                            time: {
                                startAt: currentItem.startAt,
                                endAt: currentItem.endAt
                            },
                            end: {
                                id: 'datapicker',
                                type: 'datapicker',
                                value: 'Дата окончания',
                                dialog: 'restore',
                                time: {
                                    startAt: currentItem.startAt,
                                    endAt: currentItem.endAt
                                }
                            }
                        }],
                        input: [{
                            type: 'text:mss',
                            id: 'recipient',
                            title: 'Система',
                            notification: undefined,
                            placeholder: undefined,
                            disabled: true,
                            dataset: {
                                itemId: currentItem.id
                            },
                            value: `${isSuppliers? currentItem.senderCode : currentItem.recipientCode}-${isSuppliers? currentItem.senderName :currentItem.recipientName}`
                        }, {
                            type: 'text:mss',
                            id: 'interaction',
                            title: 'Взаимодействие',
                            notification: undefined,
                            placeholder: undefined,
                            disabled: true,
                            dataset: {
                                itemId: currentItem.id
                            },
                            value: `${currentItem.interactionCode}-${currentItem.interactionName}`
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
                    }
                },
                remove: (event) => {
                    event.stopPropagation()
                    const body_tr = self.closest('.body_tr');
                    const welcomeSection = self.getRootNode().host.closest('welcome-section')
                    self.click()
                    ferDialog.open = {
                        type: 'remove',
                        title: 'Отключить',
                        detail: {
                            id: welcomeSection.dataset.id,
                            subscriptionId: body_tr.dataset.subscriptionId,
                            itemId: body_tr.dataset.id
                        },
                        button: [{
                            type: 'cancel',
                            description: 'Отмена'
                        }, {
                            type: 'remove',
                            description: 'Хорошо'
                        }],
                        select: undefined,
                        description: 'Данная запись будет удалена'
                    };
                },
                cancel: (event) => {
                    console.log('-------- CANCEL ------------')
                },
                update: async (event) => {
                    event.stopPropagation()
                    const ferTable = self.getRootNode().host
                    const welcomeSection = ferTable.closest('welcome-section')
                    const ferDialog = document.querySelector('fer-dialog')
                    const pathname = store.get('pathname').pathname;
                    const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                    self.click()
                    if(welcomeSection.dataset.id === '7_0') {

                    } else if(welcomeSection.dataset.id === '0') {
                        const ferTable = welcomeSection.querySelector('fer-table')
                        const bodyTr = self.closest('.body_tr')
                        const code = bodyTr.querySelector('.value.interactionId--code')
                        const name = bodyTr.querySelector('.value.interactionId--name')

                        const directory = welcomeSection.getState('directory');
                        directory.code = code.textContent.trim();
                        directory.name = name.textContent.trim();
                        directory.id = bodyTr.dataset.id;

                        welcomeSection.setState('directory', directory);
                        welcomeSection.setState('old_directory', structuredClone(directory));


                        let title = 'Обновить запись справочника'
                        ferDialog.open = {
                            type: 'update_s',
                            to: welcomeSection.dataset.to,
                            id: welcomeSection.dataset.id,
                            title: title,
                            mapping: ['code', 'name', 'cancel', 'save'],
                            detail: {
                                itemId: bodyTr.dataset.id
                            },
                            input: [{
                                type: 'text:mss',
                                id: 'code',
                                title: 'Код',
                                placeholder: 'Введите код',
                                isReadonly: false,
                                notification: "Введите код",
                                field: "code",
                                value: code.textContent.trim(),
                                error: {
                                    class: "errorMessage code",
                                    description: 'Заполните обязательное поле'
                                },
                            }, {
                                type: 'text:mss',
                                id: 'name',
                                title: 'Наименование',
                                placeholder: 'Введите наименование',
                                isReadonly: false,
                                notification: "Введите наименование",
                                field: "name",
                                value: name.textContent.trim(),
                                error: {
                                    class: "errorMessage name",
                                    description: 'Заполните обязательное поле'
                                },
                            }],
                            button: [{
                                id: 'after',
                                type: 'cancel',
                                description: 'Отмена'
                            }, {
                                id: 'after',
                                type: 'update',
                                description: 'Хорошо'
                            }]
                        };

                        // ferTable.controller.api.button.edit(event, {
                        //     type: "mss-button"
                        // })
                        return
                    } else {
                        const body_tr = self.closest('.body_tr.registry.array')

                        let subscription = ''
                        let title = ''

                        if(isSuppliers) {
                            subscription = welcomeSection.getState("get:/api/v1/sending")
                            title = 'Обновить рассылку системы'
                        } else {
                            subscription = welcomeSection.getState("get:/api/v1/subscription")
                            title = 'Обновить подписку системы'
                        }

                        const currentItem = subscription.res.body.data.find(item => item.id === body_tr.dataset.subscriptionId)

                        welcomeSection.setState('subscription', currentItem)

                        const dialog = {
                            type: 'create',
                            id: `${welcomeSection.dataset.id}-update`,
                            title: title,
                            mapping: ['interaction', 'recipient', 'datapicker', 'footer-button', 'footer-button save'],
                            checkbox: [{
                                id: 'checkbox',
                                type: 'checkbox',
                                value: '1',
                                title: 'Включенно'
                            }],
                            datapicker: [{
                                id: 'datapicker',
                                type: 'datapicker',
                                value: 'Дата начала',
                                dialog: 'update',
                                time: {
                                    startAt: currentItem.startAt,
                                    endAt: currentItem.endAt
                                },
                                end: {
                                    id: 'datapicker_end',
                                    type: 'datapicker',
                                    value: 'Дата окончания',
                                    dialog: 'update',
                                    time: {
                                        startAt: currentItem.startAt,
                                        endAt: currentItem.endAt
                                    }
                                }
                            }],
                            input: [{
                                type: 'text:mss',
                                id: 'interaction',
                                title: 'Система',
                                notification: undefined,
                                placeholder: undefined,
                                disabled: true,
                                dataset: {
                                    itemId: currentItem.id
                                },
                                value: `${isSuppliers? currentItem.senderCode: currentItem.recipientCode}-${isSuppliers? currentItem.senderName: currentItem.recipientName}`
                            }, {
                                type: 'text:mss',
                                id: 'recipient',
                                title: 'Взаимодействие',
                                notification: undefined,
                                placeholder: undefined,
                                disabled: true,
                                dataset: {
                                    itemId: currentItem.id
                                },
                                value:  `${currentItem.interactionCode}-${currentItem.interactionName}`
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
                        }

                        ferDialog.open = dialog;

                    }
                }
            }
        })
    })
}

export default {
    description: 'action'
}