import {router, store, isEmpty} from '../../../this/index.mjs'
let api = Symbol.for("api");

const mssAuth =  document.querySelector('mss-auth');
const ferDialog = document.querySelector('fer-dialog');
const mssFilter = document.querySelector('mss-filter')
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

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        let dropdownItems = undefined
        const dropdownBtn = self.shadowRoot.querySelector('[class*="dropdown__button"]');
        const dropdownList = self.shadowRoot.querySelector('.dropdown__list');
        try {
            dropdownItems = dropdownList.querySelectorAll('.dropdown__list-item');
        } catch (e) {

            console.log('self', self)
            
        }

        // const dropdownItems = dropdownList?.querySelectorAll('[class*="dropdown__list-item"]');
        // const dropdownInput = self.shadowRoot.querySelector('[class*="dropdown__input_hidden"]')
        const arrow = self.shadowRoot.querySelector('.dropdown__button_arrow');

        const ferSelect = self.shadowRoot.querySelector('.dropdown__list')
        const ferSelectArrow = self.shadowRoot.querySelector('.dropdown__button_arrow')

        resolve({
            button: {
                under: (event) => {
                    const withinBoundaries = event.composedPath().includes(self);
                    if (!withinBoundaries ) {
                        ferSelectArrow.classList.remove('dropdown__arrow_active')
                        ferSelect.classList.remove('dropdown__list_visible')
                    }
                },
            },
            keydown: (event) => {
                if( event.key === 'Tab' || event.key === 'Escape' ) {
                    arrow.classList.remove('dropdown__arrow_active');
                    dropdownBtn.classList.remove('dropdown__button_active');
                    dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            click: (event) => {
                if ( event.target !== dropdownBtn ) {
                    // arrow.classList.remove('dropdown__arrow_active');
                    // dropdownBtn.classList.remove('dropdown__button_active');
                    // dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            ferSelect: (event) => {
                if(event.detail.field !== self.dataset.field) {
                    arrow.classList.remove('dropdown__arrow_active');
                    dropdownBtn.classList.remove('dropdown__button_active');
                    dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            clickDropdownBtn: (event) => {
                const rootElement = event.currentTarget.getRootNode().host

                document.dispatchEvent(new CustomEvent(`fer-select`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action: 'disabled',
                        id: rootElement.id,
                        field: self.dataset.field
                    }
                }));

                const buttonActive = self.shadowRoot.querySelector('[class*="dropdown__button"]')
                dropdownList.classList.toggle('dropdown__list_visible');
                buttonActive.classList.toggle('dropdown__button_active');
                arrow.classList.toggle('dropdown__arrow_active');
            },
            clickDropdownItems: async (event) => {
                dropdownItems = self.shadowRoot.querySelectorAll('.dropdown__list-item')
                dropdownItems.forEach(function(el) {
                    arrow.classList.remove('dropdown__arrow_active');
                    el.classList.remove('dropdown__list-item_active');
                })

                if(event.target.dataset.snapshotId) {
                    self.dataset.snapshotId = event.target.dataset.snapshotId
                }

                if(event.target.dataset.logType) {
                    self.dataset.logType = event.target.dataset.logType
                }

                if(event.target.dataset.name) {
                    self.dataset.name = event.target.dataset.name
                }

                if(event.target.dataset.code) {
                    self.dataset.code = event.target.dataset.code
                }

                if(event.target.dataset.eventId) {
                    self.dataset.eventId = event.target.dataset.eventId
                }

                if(event.target.dataset.directoryId) {
                    self.dataset.directoryId = event.target.dataset.directoryId
                }

                if(event.target.dataset.value) {
                    self.dataset.value = event.target.dataset.value
                }

                if(event.target.dataset.eventSnapshotId) {
                    self.dataset.eventSnapshotId = event.target.dataset.eventSnapshotId
                }

                if(event.target.dataset.eventRegionId) {
                    self.dataset.eventRegionId = event.target.dataset.eventRegionId
                }

                if(event.target.dataset.regionId) {
                    self.dataset.regionId = event.target.dataset.regionId
                }

                if(event.target.dataset.snapshotId) {
                    self.dataset.snapshotId = event.target.dataset.snapshotId
                }

                if(event.target.dataset.snapshotId) {
                    self.dataset.schemaId = event.target.dataset.schemaId
                }

                if(event.target.dataset.id) {
                    self.dataset.id = event.target.dataset.id
                }

                if(event.target.dataset.hasOwnProperty('recipientId')) {
                    self.dataset.recipientId = event.target.dataset.recipientId
                }

                if(event.target.dataset.hasOwnProperty('interactionId')) {
                    self.dataset.interactionId = event.target.dataset.interactionId
                }

                if(event.target.dataset.hasOwnProperty('headerId')) {
                    self.dataset.headerId = event.target.dataset.headerId
                }

                dropdownList.classList.remove('dropdown__list_visible');
                event.target.classList.add('dropdown__list-item_active');
                arrow.classList.remove('dropdown__arrow_active');
                dropdownBtn.classList.toggle('dropdown__button_active');

                const rootNode = self.getRootNode().host

                if(rootNode.tagName === 'MSS-BUTTON') {
                    dropdownBtn.textContent = ''
                    dropdownBtn.textContent = event.target.textContent;

                    const section = store.get('section')
                    const ferSelectRecipientSystemName = rootNode.shadowRoot.querySelector('fer-select[data-field="recipientSystemName"]')
                    if(section.toString() === '5') {
                        const filter =  mssFilter.getState('filter_5')

                        let filterName = 'Правила'
                        if(self.dataset.field === 'directoryName') {
                            if(self.dataset.value.toLowerCase().trim() === 'сущность') {
                                filter.directoryName = undefined
                                ferSelectRecipientSystemName.classList.remove('invisible')
                                const button = self.shadowRoot.querySelector('button')
                                button.textContent = ''
                            } else {
                                filter.directoryName = self.dataset.value
                            }

                            if(self.dataset.value === filterName) {
                                ferSelectRecipientSystemName.reset = true
                                filter.recipientSystemName = undefined
                                ferSelectRecipientSystemName.classList.add('invisible')
                                const button = self.shadowRoot.querySelector('button')
                                // button.textContent = ''
                            } else {
                                ferSelectRecipientSystemName.classList.remove('invisible')
                            }

                           // mssFilter.setState('filter_5',filter )
                            // console.log('============ filterDirecoryName =========', filterDirecoryName, filterDirecoryName.directoryName === 'Правила')

                        }

                        if(self.dataset.field === 'interactionName') {
                            if(self.dataset.value.toLowerCase().trim() === 'наименование взаимодействия') {
                                filter.interactionName = undefined
                                const button = self.shadowRoot.querySelector('button')
                                button.textContent = ''
                            } else {
                                filter.interactionName = self.dataset.value
                            }
                        }

                        if(self.dataset.field === 'recipientSystemName') {
                            if(self.dataset.value.toLowerCase().trim() === 'наименование системы') {
                                filter.recipientSystemName = undefined
                                ferSelectRecipientSystemName.classList.remove('invisible')
                                const button = self.shadowRoot.querySelector('button')
                                button.textContent = ''
                            } else {
                                filter.recipientSystemName = self.dataset.value
                            }

                            if(filter.directoryName === filterName) {
                                const ferSelectRecipientSystemName = rootNode.shadowRoot.querySelector('fer-select[data-field="recipientSystemName"]')
                                ferSelectRecipientSystemName.reset = true
                                filter.recipientSystemName = undefined
                                ferSelectRecipientSystemName.classList.add('invisible')
                                const button = self.shadowRoot.querySelector('button')
                                button.textContent = ''
                            } else {
                                ferSelectRecipientSystemName.classList.remove('invisible')
                            }
                        }

                        mssFilter.setState('filter_5', filter)
                    }

                    if(section.toString() === '5_0') {
                       const filter =  mssFilter.getState('filter_5_0')
                       if(self.dataset.field === 'logType') {
                           if(self.dataset.value.toLowerCase().trim() === 'действие') {
                               const button = self.shadowRoot.querySelector('button')
                               button.textContent = ''
                               filter.logType = undefined
                           } else {
                               filter.logType = self.dataset.value
                           }
                       }

                       if(self.dataset.field === 'username') {
                           if(self.dataset.value.toLowerCase().trim() === 'логин пользователя (снилс)') {
                               const button = self.shadowRoot.querySelector('button')
                               button.textContent = ''
                               filter.username = undefined
                           } else {
                               filter.username = self.dataset.value
                           }
                       }

                        mssFilter.setState('filter_5_0', filter)
                    }
                }

                if(rootNode.tagName === 'MSS-FILTER') {
                    dropdownBtn.textContent = ''
                    dropdownBtn.textContent = event.target.textContent;

                    const mssFilter = self.getRootNode().host
                    const ferSelect = mssFilter.shadowRoot.querySelectorAll('fer-select')
                    let value = event.target.dataset.value
                    const interactionId = event.target.dataset.interactionId
                    const service = document.querySelector('.service')
                    const section = store.get('section')
                    const welcomeSection = service.querySelector(`welcome-section[data-id="${section}"]`)
                    const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                    const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
                    const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);
                    const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input')
                    const ferTable = welcomeSection.querySelector('fer-table')
                    const ferPagination = ferTable.querySelector('fer-pagination')
                    const route = await router(self, { location })

                    let filter = welcomeSection.getState('post:/api/v1/subscription/filter')

                    // welcomeSection.cleanState('all');

                    let pagination = {
                        limit: 400,
                        offset: 0
                    }

                    if(ferPagination) {
                        pagination = ferPagination.getState('pagination')
                        ferPagination.offset = pagination.offset
                        ferPagination.limit = pagination.limit
                    }

                    for(let i= 0; i < ferSelect.length; ++i) {
                        if(ferSelect[i].dataset.field === self.dataset.field) {

                            if(welcomeSection.dataset.id === '6') {
                                const field = self.dataset.field === 'code' ? 'interactionCode' : 'interactionName'

                                mssInputs.forEach(item => {
                                    item.clean = true
                                })

                                if(self.dataset.field === 'code') {
                                    ferSelectName.clean = {}
                                } else {
                                    ferSelectCode.clean = {}
                                }

                                if(value.toLowerCase().trim() === 'код взаимодействия' || value.toLowerCase().trim() === 'наименование взаимодействия'|| value.toLowerCase().trim() === 'код системы'|| value === 'Код' || value === 'Наименование') {
                                    const record = await window[api].fetch.get('/api/v1/rule/grouped', {
                                        limit: pagination.limit,
                                        offset: pagination.offset
                                    });

                                    if(record.res.ok) {
                                        welcomeSection.setState('record', record)
                                        ferTable.refresh()
                                        return
                                    } else {
                                        errorDialog(record.res.obj.description);
                                    }
                                } else {
                                    const record = await window[api].fetch.get('/api/v1/rule/grouped', {
                                        "interactionId": interactionId,
                                        limit: pagination.limit,
                                        offset: pagination.offset
                                    });

                                    if(record.res.ok) {
                                        welcomeSection.setState('record', record)
                                        ferTable.refresh()
                                        return
                                    } else {
                                        errorDialog(record.res.obj.description);
                                    }
                                }
                            }

                            if(welcomeSection.dataset.id === '7') {
                                const mssFilter = self.getRootNode().host
                                const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                                const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
                                const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);
                                const isActive =  ferSelectActive.dataset.value === 'null'? true: ferSelectActive.dataset.value
                                const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                let filter = ''

                                if(isSuppliers) {
                                    filter = welcomeSection.getState('post:/api/v1/sending/filter')
                                } else {
                                    filter = welcomeSection.getState('post:/api/v1/subscription/filter')
                                }

                                let field = ''
                                let request = ''

                                filter.active = isActive

                                if(self.dataset.field === 'code') {
                                    field = self.dataset.field = isSuppliers? 'senderCode': 'recipientCode'
                                    if(!isEmpty(filter.code)) {
                                        request = filter.code
                                    }
                                } else if(self.dataset.field === 'name') {
                                    field = self.dataset.field = 'interactionCode'

                                    if(!isEmpty(filter.name)) {
                                        request = filter.name
                                    }
                                } else if(self.dataset.field === 'active') {
                                    field = self.dataset.field = 'active'


                                    if(!isEmpty(filter.name)) {
                                        request = filter.name
                                        field = 'interactionCode'
                                    }

                                    if(!isEmpty(filter.code)) {
                                        request = filter.code
                                        field = isSuppliers? 'senderCode': 'recipientCode'
                                    }
                                }

                                if(self.dataset.field === 'code') {
                                    ferSelectName.clean = {}
                                } else {
                                    ferSelectCode.clean = {}
                                }



                                if(value.toLowerCase().trim() === 'код взаимодействия' || value.toLowerCase().trim() === 'наименование взаимодействия'|| value.toLowerCase().trim() === 'код системы'|| value === 'Код' || value === 'Наименование') {
                                    let url = ''

                                    if(isSuppliers) {
                                        url = '/api/v1/sending'
                                    } else {
                                        url = '/api/v1/subscription'
                                    }

                                    const record = await window[api].fetch.get(url, {
                                        "active": isActive,
                                        "limit": pagination.limit,
                                        "offset": pagination.offset
                                    });

                                    if(record.res.ok) {
                                        welcomeSection.setState('record', record)
                                        ferTable.refresh()
                                        return
                                    } else {
                                        errorDialog(record.res.obj.description);
                                    }
                                } else {
                                    let url = ''
                                    let stateUrl = ''

                                    if(isEmpty(request) && field === 'active') {
                                        if(isSuppliers) {
                                            url = '/api/v1/sending'
                                            stateUrl = 'post:/api/v1/sending/filter'
                                        } else {
                                            url = '/api/v1/subscription'
                                            stateUrl = 'post:/api/v1/subscription/filter'
                                        }

                                        const record = await window[api].fetch.get(url, {
                                            "active": isActive,
                                            "limit": pagination.limit,
                                            "offset": pagination.offset
                                        });

                                        if(record.res.ok) {
                                            welcomeSection.setState(stateUrl, filter)
                                            welcomeSection.setState('record', record)
                                            ferTable.refresh()
                                            return
                                        } else {
                                            errorDialog(record.res.obj.description);
                                        }
                                    } else {
                                        if(isSuppliers) {
                                            url = '/api/v1/sending/filter'
                                            stateUrl = 'post:/api/v1/sending/filter'
                                        } else {
                                            url = '/api/v1/subscription/filter'
                                            stateUrl = 'post:/api/v1/subscription/filter'
                                        }

                                        const record = await window[api].fetch.post(url, {
                                            "active": isActive,
                                            "type": 0,
                                            "operator": "like",
                                            "field": field,
                                            "value": request,
                                            "limit": pagination.limit,
                                            "offset": pagination.offset
                                        });

                                        if(record.res.ok) {
                                            welcomeSection.setState(stateUrl, filter)
                                            welcomeSection.setState('record', record)
                                            ferTable.refresh()
                                            return
                                        } else {
                                            errorDialog(record.res.obj.description);
                                        }
                                    }
                                }
                            }
                        } else {
                            ferSelect[i].clean = {}
                        }
                    }

                    ferTable.refresh();
                }

                if(rootNode.tagName === 'API-HEADER') {
                    if(event.target.classList.contains('logout')) {
                        mssAuth.logout()
                    }

                    return
                }

                if(rootNode.tagName === 'FER-PAGINATION') {
                    dropdownBtn.textContent = ''
                    dropdownBtn.textContent = event.target.textContent;

                    rootNode.offset = 0
                    rootNode.limit = parseInt(event.target.textContent, 10)
                    const ferTable = rootNode.closest('fer-table')
                    let welcomeSection = ferTable.closest('welcome-section');
                    welcomeSection.cleanState('all', ['post:/api/v1/subscription/filter', 'post:/api/v1/directory/record/filter'])
                    ferTable.refresh()
                }


                if(rootNode.tagName === 'FER-TABLE') {
                    dropdownBtn.textContent = ''
                    dropdownBtn.textContent = event.target.textContent;

                    const welcomeSection = self.getRootNode().host.closest('welcome-section')
                    const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                    subscriptionSetting[0].value = event.target.dataset.code

                    if(!Array.isArray(subscriptionSetting)) {
                        console.log('subscriptionSetting', subscriptionSetting)
                    }
                    welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)
                }

                if(rootNode.tagName === 'FER-DIALOG') {
                    dropdownBtn.textContent = ''
                    dropdownBtn.textContent = event.target.textContent;

                    if(rootNode.dataset.id === '7') {
                        const service = document.querySelector('.service')
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${rootNode.dataset.id}"]`)
                        let subscription = welcomeSection.getState('subscription')

                        if(self.dataset.hasOwnProperty('interactionId')) {
                            subscription.interactionId = self.dataset.interactionId
                        }

                        if(self.dataset.hasOwnProperty('recipientId')) {
                            subscription.recipientId = self.dataset.recipientId
                        }

                      welcomeSection.setState('subscription', subscription)
                    }

                    if(rootNode.dataset.id === '6_0' || rootNode.dataset.id === '6') {
                        const service = document.querySelector('.service')
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${rootNode.dataset.id}"]`)
                        let settings = welcomeSection.getState('rule/settings')

                        if(self.dataset.hasOwnProperty('interactionId')) {
                            settings.interactionId = self.dataset.interactionId
                        }

                        if(self.dataset.hasOwnProperty('headerId')) {
                            console.log('self.dataset', self.dataset)
                            settings.headerId = self.dataset.headerId
                        }

                        welcomeSection.setState('rule/settings', settings)
                    }
                }
            }
        })
    })
}

export default {
    description: 'action'
}