import { isEmpty, router, activeClass, events, events_d, config, animationCount, randomColor, store } from '../../../this/index.mjs';
let api = Symbol.for("api");

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

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        function debounce(func, timeout = 600){
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => { func.apply(this, args); }, timeout);
            };
        }

        async function saveInput() {
            const value = self.shadowRoot.querySelector('input').value
            const route = await router(self, { location })
            const mssFilter = self.getRootNode().host
            const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input')
            const responseDropdownList = self.shadowRoot.querySelector('.response.dropdown__list')
            const service = document.body.querySelector('.service')
            const currentSection = store.get('section')
            const welcomeSection = service.querySelector(`welcome-section[data-id="${currentSection}"]`)
            const ferTable = welcomeSection.querySelector('fer-table')
            const ferPagination = ferTable.querySelector('fer-pagination')
            const buttonAdd = mssFilter.shadowRoot.querySelector('.button_add')

            let pagination = {
                limit: 300,
                offset: 0
            }

            if(ferPagination) {
                pagination = ferPagination.getState('pagination')
            }

            mssInputs.forEach(item => {
                if(item.dataset.field !== self.dataset.field) {
                    item.clean = true
                }
            })

            if(welcomeSection.dataset.id === '0') {
                const record = await window[api].fetch.post('/api/v1/directory/record/filter', {
                    "active": true,
                    "directoryId": route.value,
                    "type": 0,
                    "operator": "like",
                    "field": self.dataset.field,
                    "value": value,
                    "limit": pagination.limit,
                    "offset": pagination.offset
                });

                buttonAdd.removeAttribute('disabled')
                welcomeSection.setState('record', record)
                welcomeSection.setState('post:/api/v1/directory/record/filter', {
                    "active": true,
                    "operator": 'like',
                    "code": self.dataset.field === 'code' ? isEmpty(value)? undefined: value: undefined,
                    "name": self.dataset.field === 'name' ? isEmpty(value)? undefined: value: undefined,
                })
                ferTable.refresh()
                return
            }

            if(welcomeSection.dataset.id === '6') {
                const field = self.dataset.field === 'code' ? 'interactionCode' : 'interactionName'
                const record = await window[api].fetch.post('/api/v1/rule/filter', {
                    "active": true,
                    "type": 0,
                    "operator": "like",
                    "field": field,
                    "value": value,
                    "limit": pagination.limit,
                    "offset": pagination.offset
                });

                if(record.res.ok) {
                    welcomeSection.setState('record', record)
                    ferTable.refresh()
                } else {
                    errorDialog(record.res.obj.description);
                }
            }

            if(welcomeSection.dataset.id === '7') {
                const mssFilter = self.getRootNode().host
                const ferSelect = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                const isActive =  ferSelect.dataset.value === 'true' || ferSelect.dataset.value === 'null'|| ferSelect.dataset.value == undefined  ? true : ferSelect.dataset.value
                const isSuppliers = window.location.pathname.startsWith('/sending')

                ferPagination.reset = true
                pagination = ferPagination.getState('pagination')
                let field = self.dataset.field === 'code' ? 'recipientCode' : 'interactionCode'

                let filter = ''
                let url = ''

                if(self.dataset.field === 'code') {
                    field = 'recipientCode'
                    if(isSuppliers) {
                        field = 'senderCode'
                    }
                } else {
                    field = 'interactionCode'
                }

                if(isSuppliers) {
                    filter = 'post:/api/v1/sending/filter'
                    url = '/api/v1/sending/filter'
                } else {
                    filter = 'post:/api/v1/subscription/filter'
                    url = '/api/v1/subscription/filter'
                }

                welcomeSection.setState(filter, {
                    "active": isActive,
                    "code": self.dataset.field === 'code' ? isEmpty(value)? undefined: value: undefined,
                    "name": self.dataset.field === 'name' ? isEmpty(value)? undefined: value: undefined,
                })

                const record = await window[api].fetch.post(url, {
                    "active": isActive,
                    "type": 0,
                    "operator": "like",
                    "field": field,
                    "value": value,
                    "limit": pagination.limit,
                    "offset": pagination.offset
                });

                if(record.res.ok) {
                    welcomeSection.setState('record', record)
                    ferTable.refresh()
                } else {
                    errorDialog(record.res.obj.description);
                }
            }


            if(welcomeSection.dataset.id === '7_0') {
                const registry_field = store.get('registry_field')
                const field = registry_field
                // const field = registry_field === 'code' ? 'recipientCode' : 'recipientName'
                if(!isEmpty(value)) {
                    const record = await window[api].fetch.post('/api/v1/directory/record/filter', {
                        "active": true,
                        "directoryId": self.dataset.linkDirectoryId,
                        "type": 0,
                        "operator": "like",
                        "field": field,
                        "value": value,
                        "limit": pagination.limit,
                        "offset": pagination.offset
                    });

                    if(record.res.ok) {
                        if(record.res.body.data.length === 0) {
                            const bodyTr = self.closest('.body_tr.new')
                            const mssInputs = bodyTr.querySelectorAll('mss-input');
                            let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                            const data = []

                            errorMessages = Array.from(errorMessages)

                            mssInputs.forEach(item => {
                                data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                            })

                            errorMessages = errorMessages.concat(data);

                            console.log('errorMessages', errorMessages)
                            for(let item of errorMessages) {
                                item.textContent = 'Записей не найденно'
                                item.classList.add('visible')
                            }
                            // const ferNotification = document.querySelector('fer-notification')
                            // ferNotification.warning("Ответ не содержит записей")
                            responseDropdownList.innerHTML = ''
                        } else {
                            const bodyTr = self.closest('.body_tr.new')
                            const mssInputs = bodyTr.querySelectorAll('mss-input');
                            let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                            const data = []

                            errorMessages = Array.from(errorMessages)

                            mssInputs.forEach(item => {
                                data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                            })

                            errorMessages = errorMessages.concat(data);

                            for(let item of errorMessages) {
                                item.classList.remove('visible')
                            }

                            responseDropdownList.innerHTML = ''

                            const welcomeSection = self.getRootNode().host.closest('welcome-section')
                            const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                            subscriptionSetting[0].value = undefined

                            welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)

                            let options = ``

                            for(let i = 0; i < record.res.body.data.length; ++i) {
                                console.log('responseDropdownList ----------------------------------', record.res.body.data[i])
                                options = options +`<li 
                                                    class="dropdown__list-item" 
                                                    data-code="${record.res.body.data[i].code}"
                                                    data-name="${record.res.body.data[i].name}"
                                                    data-item-id="${record.res.body.data[i].id}"
                                                    data-directory-id="${record.res.body.data[i].directoryId}"

                                                >${record.res.body.data[i].code}-${record.res.body.data[i].name}</li>`
                            }


                            responseDropdownList.insertAdjacentHTML('afterbegin', options)
                            responseDropdownList.removeAttribute('disabled')
                        }
                        // welcomeSection.setState('record', record)
                    } else {
                        errorDialog(record.res.obj.description);
                    }
                } else {
                    const bodyTr = self.closest('.body_tr.new')
                    const mssInputs = bodyTr.querySelectorAll('mss-input');
                    let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                    const data = []

                    errorMessages = Array.from(errorMessages)

                    mssInputs.forEach(item => {
                        data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                    })

                    errorMessages = errorMessages.concat(data);

                    for(let item of errorMessages) {
                        item.classList.remove('visible')
                    }

                    responseDropdownList.innerHTML = ''
                    // let options = ''
                    // responseDropdownList.insertAdjacentHTML('afterbegin', options)
                    // responseDropdownList.removeAttribute('disabled')
                }

                return
            }
        }

        const processChange = debounce(() => saveInput());

        resolve({
            input: processChange,
            click: (event) => {
                const welcomeSection = self.getRootNode().host.closest('welcome-section')
                const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                const registryInput = self.shadowRoot.querySelector('input.registry.input')
                subscriptionSetting[0].value = event.target.dataset.code

                if(!Array.isArray(subscriptionSetting)) {
                    console.log('subscriptionSetting', subscriptionSetting)
                    debugger
                }
                welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)

                registryInput.value = `${event.target.dataset.code}-${event.target.dataset.name}`
                event.currentTarget.setAttribute('disabled', '')
            }
        })
    })
}

export default {
    description: 'action'
}