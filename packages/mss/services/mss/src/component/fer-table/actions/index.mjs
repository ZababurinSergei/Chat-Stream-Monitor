import { table, tableVisual, template } from '../views/index.mjs';
import { router, store, compareAsc, isEmpty } from '../../../this/index.mjs';
let api = Symbol.for("api");

const update = async (self) => {
    await self.controller.addEventListener.terminate();
    tableVisual(self, '#EEF5FC', '#DBEDFF', self.dataset.id);
    await self.controller.addEventListener.init();
};

const edit = async (self, props) => {
    console.log('==== EDIT ====');
    return true;
};

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
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

        const welcomeSection = self.closest('welcome-section');

        resolve({
            button: {
                card: {
                    restore: (event) => {
                        const body_tr = event.currentTarget.closest('.body_tr')
                        let welcomeSection = self.closest('welcome-section');
                        const id = event.currentTarget.dataset.id;

                        ferDialog.open = {
                            type: 'remove',
                            title: 'Включить ',
                            detail: {
                                interactionId: body_tr.dataset.interactionId,
                                itemId: body_tr.dataset.id,
                                id: welcomeSection.dataset.id
                            },
                            button: [{
                                type: 'cancel',
                                description: 'Отмена'
                            }, {
                                type: 'update',
                                description: 'Хорошо'
                            }],
                            select: undefined,
                            description: 'Данная запись будет включена'
                        };
                    }
                }
            },
            CustomEvent: {
                ferDialog: {
                    ruleSettings: {
                        update: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const ruleSettings = await window[api].fetch.put('/api/v1/rule', {
                                    "id": event.detail.itemId,
                                    "active": true
                                });

                                if (ruleSettings.res.ok) {
                                    ferDialog.open = false;
                                    const welcomeSection = self.closest('welcome-section');
                                    const ferTable = welcomeSection.querySelectorAll('fer-table');

                                    welcomeSection.cleanState('record');
                                    welcomeSection.cleanState('rules');
                                    welcomeSection.cleanState('settings');

                                    ferTable.forEach(item => {
                                        item.refresh();
                                    });

                                    successDialog('Данные успешно включены');
                                } else {
                                    ferDialog.open = false;
                                    errorDialog(subscriptionSettings.res.obj.description);
                                }
                            }
                        }
                    },
                    subscription: {
                        update: (event) => {
                            if (event.detail.id === self.dataset.id) {
                                console.log('###################################################')
                                // const ruleSettings = await window[api].fetch.put('/api/v1/rule', {
                                //     "id": event.detail.itemId,
                                //     "active": true
                                // });
                                // if (ruleSettings.res.ok) {
                                //     ferDialog.open = false;
                                //     const welcomeSection = self.closest('welcome-section');
                                //     const ferTable = welcomeSection.querySelectorAll('fer-table');
                                //
                                //     welcomeSection.cleanState('record');
                                //     welcomeSection.cleanState('rules');
                                //     welcomeSection.cleanState('settings');
                                //
                                //     ferTable.forEach(item => {
                                //         item.refresh();
                                //     });
                                // } else {
                                //     ferDialog.open = false;
                                //     errorDialog(subscriptionSettings.res.obj.description);
                                // }
                                // ferDialog.open = false;
                            }
                        }
                    },
                    subscriptionSettings: {
                        restore: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const subscriptionSettings = await window[api].fetch.put('/api/v1/subscription/setting', {
                                    active: true,
                                    id: event.detail.itemId,
                                    value: event.detail.value
                                });

                                if (subscriptionSettings.res.ok) {
                                    const welcomeSection = self.closest('welcome-section');
                                    const ferTable = welcomeSection.querySelectorAll('fer-table');
                                    const mssFilter = document.querySelector('mss-filter');
                                    const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                    welcomeSection.cleanState('record');
                                    welcomeSection.cleanState('rules');
                                    welcomeSection.cleanState('settings');

                                    const section = store.get('section')

                                    if(section.toString() !== "7") {
                                        mssInputs.forEach(item => {
                                            item.clean = true;
                                        });
                                    }


                                    ferTable.forEach(item => {
                                        item.refresh();
                                    });

                                    successDialog('Данные успешно включены');
                                } else {
                                    console.log('=====================================', subscriptionSettings.res)
                                    errorDialog(subscriptionSettings.res.obj.description);
                                }
                            }
                        },
                        delete: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const subscriptionSettings = await window[api].fetch.delete('/api/v1/subscription/setting', {
                                    id: event.detail.itemId
                                });

                                if (subscriptionSettings.res.ok) {
                                    const welcomeSection = self.closest('welcome-section');
                                    const ferTable = welcomeSection.querySelectorAll('fer-table');
                                    const mssFilter = document.querySelector('mss-filter');
                                    const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                    welcomeSection.cleanState('record');
                                    welcomeSection.cleanState('rules');
                                    welcomeSection.cleanState('settings');

                                    mssInputs.forEach(item => {
                                        item.clean = true;
                                    });

                                    ferTable.forEach(item => {
                                        item.refresh();
                                    });

                                    successDialog('Данные успешно выключены');
                                } else {
                                    errorDialog(subscriptionSettings.res.obj.description);
                                }
                            }
                        }
                    },
                    remove: {
                        subscription: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                let url = ''
                                let param = ''
                                if(isSuppliers) {
                                    url = '/api/v1/sending'
                                    param = 'sendingId'
                                } else {
                                    param = 'subscriptionId'
                                    url = '/api/v1/subscription'
                                }


                                console.log('sssssssssssssssssss', url)
                                const subscription = await window[api].fetch.delete(url, {
                                    [param]: event.detail.subscriptionId
                                });

                                if (subscription.res.ok) {
                                    const welcomeSection = self.closest('welcome-section');
                                    const ferTable = welcomeSection.querySelectorAll('fer-table');
                                    const mssFilter = document.querySelector('mss-filter');
                                    const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');
                                    const ferSelect = mssFilter.shadowRoot.querySelectorAll('fer-select');

                                    welcomeSection.cleanState('record');
                                    welcomeSection.cleanState('rules');

                                    ferTable.forEach(item => {
                                        item.refresh();
                                    });

                                    ferSelect.forEach(item => {
                                        if(item.dataset.field !== 'active') {
                                            item.clean = true
                                        }
                                    });

                                    const section = store.get('section')

                                    if(section.toString() !== "7") {
                                        mssInputs.forEach(item => {
                                            item.clean = true;
                                        });
                                    }


                                    successDialog('Данные успешно выключены');
                                } else {
                                    errorDialog(subscription.res.obj.description);
                                }
                            }
                        }
                    }
                },
                mssFilter: {
                    add: {
                        settingsRule: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const mssFilter = document.querySelector('mss-filter')
                                const pathname = store.get('pathname').pathname;
                                const route = await router(self, { location });

                                console.log('event.detail', event.detail)

                                const recordInteractionId =await  window[api].fetch.get('/api/v1/directory/record', {
                                    active: true,
                                    directoryId: route.directory.interactionId,
                                    limit: 1000,
                                    offset: 0
                                });

                                const recordHeaderId = await window[api].fetch.get('/api/v1/directory/record', {
                                    active: true,
                                    directoryId: route.directory.headerId,
                                    limit: 1000,
                                    offset: 0
                                });

                                const datasetDirectoryId = [];
                                const datasetId = [];
                                const selectInteractionId = [];
                                for (let i = 0; i < recordInteractionId.res.body.data.length; ++i) {
                                    selectInteractionId.push(`${recordInteractionId.res.body.data[i].code} - ${recordInteractionId.res.body.data[i].name}`);
                                    datasetDirectoryId.push(recordInteractionId.res.body.data[i].directoryId);
                                    datasetId.push(recordInteractionId.res.body.data[i].id);
                                }

                                const datasetDirectoryIdHeader = [];
                                const selectHeaderId = [];
                                const datasetIdHeader = [];

                                for (let i = 0; i < recordHeaderId.res.body.data.length; ++i) {
                                    datasetDirectoryIdHeader.push(recordHeaderId.res.body.data[i].directoryId);
                                    selectHeaderId.push(`${recordHeaderId.res.body.data[i].code} - ${recordHeaderId.res.body.data[i].name}`);
                                    datasetIdHeader.push(recordHeaderId.res.body.data[i].id);
                                }

                                let currentId = recordInteractionId.res.body.data.find(item => item.id === mssFilter.dataset.interactionId)


                                if(isEmpty(currentId)) {
                                    currentId = {}
                                    currentId.code = ''
                                    currentId.name = ''
                                    currentId.id = null
                                }
                                console.log('currentId', currentId)
                                ferDialog.open = {
                                    type: 'create',
                                    to: self.dataset.to,
                                    id: self.dataset.id,
                                    title: 'Добавить заголовок',
                                    mapping: ['interaction', 'header', 'cancel', 'save'],
                                    select: [{
                                        id: 'header',
                                        type: 'kind',
                                        title: 'Заголовок сообщения',
                                        notification: 'Список заголовков для сообщения',
                                        'data-services-path': 'mss',
                                        'data-css-shadow': 'mss',
                                        active: {
                                            title: 'Поле источника',
                                            value: null
                                        },
                                        dataset: {
                                            directoryId: datasetDirectoryIdHeader,
                                            headerId: datasetIdHeader
                                        },
                                        options: selectHeaderId
                                    }, {
                                        id: 'interaction',
                                        type: 'type',
                                        title: 'Взаимодействие',
                                        notification: 'Список заголовков для взаимодействия',
                                        'data-services-path': 'mss',
                                        'data-css-shadow': 'mss',
                                        active: {
                                            status: true,
                                            title: `${currentId.code} ${currentId.name}`,
                                            value:  currentId.id
                                        },
                                        dataset: {
                                            directoryId: datasetDirectoryId,
                                            interactionId: datasetId
                                        },
                                        options: selectInteractionId
                                    }],
                                    checkbox: [{
                                        id: 'checkbox',
                                        type: 'checkbox',
                                        value: '1',
                                        title: 'Включенно'
                                    }],
                                    datapicker: [{
                                        id: 'datapicker',
                                        type: 'datapicker',
                                        value: 'Дата или период'
                                    }],
                                    input: [{
                                        type: 'text',
                                        id: 'destination',
                                        title: 'Поле назначения',
                                        placeholder: 'Введите название поля назначения'
                                    }, {
                                        type: 'text',
                                        id: 'source',
                                        title: 'Поле источника',
                                        placeholder: 'Введите название поля источника'
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
                        },
                        note: async (event) => {
                            if (event.detail.to === self.dataset.id) {
                                const pathname = store.get('pathname').pathname;
                                // const card = table.create.card();
                                // template.get(self.dataset.template)[0].template(self, card, pathname, false);
                                let title = 'Добавить запись справочника'
                                ferDialog.open = {
                                    type: 'create',
                                    to: self.dataset.to,
                                    id: self.dataset.id,
                                    title: title,
                                    mapping: ['code', 'name', 'cancel', 'save'],
                                    input: [{
                                        type: 'text:mss',
                                        id: 'code',
                                        title: 'Код',
                                        placeholder: 'Введите код',
                                        isReadonly: false,
                                        notification: "Введите код",
                                        field: "code",
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
                                        type: 'save',
                                        description: 'Хорошо'
                                    }]
                                };

                                // const timerId = setTimeout(() => {
                                    // self.controller.addEventListener.item.init();
                                    // clearTimeout(timerId);
                                // }, 0);

                            }
                        },
                        settings: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const pathname = store.get('pathname').pathname;

                                const route = await router(self, { location });

                                const recordInteractionId = await window[api].fetch.get('/api/v1/directory/record', {
                                    active: true,
                                    directoryId: route.directory.interactionId,
                                    limit: 1000,
                                    offset: 0
                                });

                                const recordRecipientId = await window[api].fetch.get('/api/v1/directory/record', {
                                    active: true,
                                    directoryId: route.directory.recipientId,
                                    limit: 1000,
                                    offset: 0
                                });

                                if (recordInteractionId.res.ok && recordRecipientId.res.ok) {
                                    const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                    const datasetDirectoryId = [];
                                    const datasetId = [];
                                    const selectInteractionId = [];
                                    for (let i = 0; i < recordInteractionId.res.body.data.length; ++i) {
                                        selectInteractionId.push(`${recordInteractionId.res.body.data[i].code} - ${recordInteractionId.res.body.data[i].name}`);
                                        datasetDirectoryId.push(recordInteractionId.res.body.data[i].directoryId);
                                        datasetId.push(recordInteractionId.res.body.data[i].id);
                                    }

                                    const datasetDirectoryIdRecipient = [];
                                    const datasetIdRecipient = [];
                                    const selectIdRecipient = [];
                                    for (let i = 0; i < recordRecipientId.res.body.data.length; ++i) {
                                        selectIdRecipient.push(`${recordRecipientId.res.body.data[i].code} - ${recordRecipientId.res.body.data[i].name}`);
                                        datasetDirectoryIdRecipient.push(recordRecipientId.res.body.data[i].directoryId);
                                        datasetIdRecipient.push(recordRecipientId.res.body.data[i].id);
                                    }

                                    let title = ''

                                    if(isSuppliers) {
                                        title = 'Добавить рассылку системы'
                                    } else {
                                        title = 'Добавить подписку системы'
                                    }
                                    ferDialog.open = {
                                        type: 'create',
                                        to: self.dataset.to,
                                        id: self.dataset.id,
                                        title: title,
                                        mapping: ['recipient', 'interaction', 'datapicker', 'cancel', 'save'],
                                        select: [{
                                            id: 'recipient',
                                            type: 'kind',
                                            title: 'Система',
                                            notification: 'Выберите систему',
                                            'data-services-path': 'mss',
                                            'data-css-shadow': 'mss',
                                            active: {
                                                title: 'Поле источника',
                                                value: '0'
                                            },
                                            dataset: {
                                                directoryId: datasetDirectoryIdRecipient,
                                                recipientId: datasetIdRecipient
                                            },
                                            options: selectIdRecipient
                                        }, {
                                            id: 'interaction',
                                            type: 'type',
                                            title: 'Взаимодействие',
                                            notification: 'Выберите информационное взаимодействие',
                                            'data-services-path': 'mss',
                                            'data-css-shadow': 'mss',
                                            active: {
                                                title: 'Выберите',
                                                value: '0'
                                            },
                                            dataset: {
                                                directoryId: datasetDirectoryId,
                                                interactionId: datasetId
                                            },
                                            options: selectInteractionId
                                        }],
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
                                                startAt: undefined,
                                                endAt: undefined
                                            },
                                            end: {
                                                id: 'datapicker_end',
                                                type: 'datapicker',
                                                value: 'Дата окончания',
                                                dialog: 'update',
                                                time: {
                                                    startAt: undefined,
                                                    endAt: undefined
                                                }
                                            }
                                        }],
                                        input: [{
                                            type: 'text',
                                            id: 'destination',
                                            title: 'Поле назначения',
                                            placeholder: 'Введите название поля назначения'
                                        }, {
                                            type: 'text',
                                            id: 'source',
                                            title: 'Поле источника',
                                            placeholder: 'Введите название поля источника'
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

                                } else {

                                    errorDialog('Должны быть данные для селектов');
                                }
                            }
                        },
                        subscribe: async (event) => {
                            const item = event.currentTarget.closest('.body_tr');
                            const body_tr = item.closest('.body').querySelectorAll('.body_tr');
                            const headerId = item.dataset.headerId
                            const button = event.currentTarget
                            const pathname = store.get('pathname').pathname;
                            const route = await router(self, { location });
                            const welcomeSection = self.closest('welcome-section');

                            body_tr.forEach(item => {
                                const disabled = item?.querySelectorAll('.header_button_add')
                                const buttomDelete = item?.querySelectorAll('.body_td.button.registry.delete')
                                const buttomRestore = item?.querySelectorAll('.body_td.button.registry.restore')

                                if(buttomRestore.length !== 0) {
                                    buttomRestore.forEach(data => {
                                        data.setAttribute('disabled', '')
                                    })
                                }

                                if(buttomDelete.length !== 0) {
                                    buttomDelete.forEach(data => {
                                        data.setAttribute('disabled', '')
                                    })
                                }

                                if(disabled.length !== 0) {
                                    disabled.forEach(data => {
                                        data.setAttribute('disabled', '')
                                    })
                                }
                            })

                            const rules = await window[api].fetch.get('/api/v1/rule', {
                                interactionId: item.dataset.interactionId,
                                limit: 30,
                                offset: 0
                            });

                            if(rules.res.ok) {
                                const itemFromHeader = rules.res.body.data.find(item => item.headerId === headerId)
                                if(itemFromHeader) {
                                    if(itemFromHeader.linkDirectoryId !== null) {
                                        const record = await window[api].fetch.get('/api/v1/directory/record', {
                                            active: true,
                                            directoryId: itemFromHeader.linkDirectoryId,
                                            limit: 21,
                                            offset: 0
                                        });

                                        if(record.res.ok) {
                                            if(record.res.body.data.length === 0) {
                                                errorDialog('Ошибка в базе данных. Запись должна сущестовать');
                                                body_tr.forEach(item => {
                                                    const disabled = item?.querySelectorAll('.header_button_add')
                                                    if(disabled.length !== 0) {
                                                        disabled.forEach(data => {
                                                            data.removeAttribute('disabled', '')
                                                        })
                                                    }
                                                })
                                            } else {
                                                let isSelect = record.res.body.data.length <= 20
                                                store.set('registry_field', 'code')

                                                let options = ``

                                                for(let i = 0; i < record.res.body.data.length; ++i) {
                                                    options = options +`<li 
                                                        class="dropdown__list-item" 
                                                        data-code="${record.res.body.data[i].code}"
                                                        data-name="${record.res.body.data[i].name}"
                                                        data-directory-id="${record.res.body.data[i].directoryId}"
                                                        data-item-id="${record.res.body.data[i].id}"
                                                    >
                                                        ${record.res.body.data[i].code}-${record.res.body.data[i].name}
                                                    </li>`
                                                }
                                                const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')

                                                subscriptionSetting[0].subscriptionId = route.link
                                                subscriptionSetting[0].headerId = itemFromHeader.headerId.trim()

                                                if(isSelect) {
                                                    // subscriptionSetting[0].value = record.res.body.data[0].code
                                                }


                                                welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)

                                                // console.log('--------------- options -------------',  `${record.res.body.data[0].code}-${record.res.body.data[0].name}`)
                                                // debugger
                                                item.insertAdjacentHTML('afterend', `
                                                <div 
                                                    class="body_tr registry object new"
                                                    data-header-id="${itemFromHeader.headerId.trim()}" 
                                                    data-item-id="${itemFromHeader.id.trim()}" 
                                                    data-link-directory-id="${itemFromHeader.linkDirectoryId.trim()}"
                                                >
                                                    <div class="registry container" ${!isSelect ? `style="display: none";`: ''}>
                                                        <div class="registry title">${itemFromHeader.headerName}</div>
                                                        <div class="registry body">
                                                            <div class="errorMessage code">Заполните обязательное поле</div>
                                                            <mss-select
                                                                data-css-shadow="mss"
                                                                data-services-path="mss"
                                                                data-code="${record.res.body.data[0].code}"
                                                                data-name="${record.res.body.data[0].name}"
                                                                data-directory-id="${record.res.body.data[0].directoryId}"
                                                            >
                                                                <template>
                                                                    <div class="container">
                                                                       <div class="dropdown">
                                                                            <div class="dropdown__wrapper">
                                                                                <div class="dropdown_input">
                                                                                  <button class="dropdown__button" type="button">${record.res.body.data[0].code}-${record.res.body.data[0].name}</button>
                                                                                </div>
                                                                                <div class="registry dropdown__button_arrow">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99994 8.93934L11.4696 5.46967L12.5303 6.53033L8.53027 10.5303C8.23738 10.8232 7.76251 10.8232 7.46961 10.5303L3.46961 6.53033L4.53027 5.46967L7.99994 8.93934Z" fill="#0D4CD3"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                            <input class="dropdown__input_hidden" type="text" name="select-category" value="0"/>
                                                                        </div>
                                                                         <ul class="dropdown__list"> ${options} </ul>
                                                                    </div>
                                                                </template>
                                                            </mss-select>
                                                    
                                                        </div>
                                                        <div class="registry footer select">
                                                              Выберите значение для ${itemFromHeader.headerName}
                                                        </div>
                                                    </div>
                                                    <div class="registry container" ${isSelect ? `style="display: none";`: ''}>
                                                        <div class="registry title button">
                                                            <button class="registry button tab active" data-field="code">Поиск по коду</button>
                                                            <button class="registry button tab" data-field="name">Поиск по наименованию</button> 
                                                        </div>
                                                        <div class="registry title">${itemFromHeader.headerName}</div>
                                                        <mss-input
                                                            class="registry input"
                                                            type="text"
                                                            data-css-shadow="mss"
                                                            data-services-path="mss"
                                                            data-link-directory-id="${itemFromHeader.linkDirectoryId}" 
                                                            placeholder="Введите название параметра"
                                                            data-value=""
                                                        >
                                                            <template>
                                                                <div class="errorMessage code">Заполните обязательное поле</div>
                                                                <div class="registry input container">
                                                                    <div class="container description">
                                                                        <input class="registry input" type="text" placeholder="${record.res.body.data[0].code}-${record.res.body.data[0].name}"/>
                                                                    </div>
                                                                    <div class="icon">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 11C17.5 14.5899 14.5899 17.5 11 17.5C7.41015 17.5 4.5 14.5899 4.5 11C4.5 7.41015 7.41015 4.5 11 4.5C14.5899 4.5 17.5 7.41015 17.5 11ZM16.1018 17.1624C14.717 18.3101 12.9391 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 12.9391 18.3101 14.717 17.1624 16.1018L21.5303 20.4697C21.8232 20.7626 21.8232 21.2374 21.5303 21.5303C21.2374 21.8232 20.7626 21.8232 20.4697 21.5303L16.1018 17.1624Z" fill="#0D4CD3"/>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                                <ul class="response dropdown__list">
    <!--                                                                ${options}-->
                                                                </ul>
                                                            </template>
                                                        </mss-input>
                                                        <div class="registry footer select">
                                                            Выберите значение для ${itemFromHeader.headerName}
                                                        </div>
                                                    </div>
                                                    <div class="registry footer">
                                                        <div class="footer registry button cancel">
                                                            <p>Отмена</p>
                                                        </div>
                                                        <div class="footer registry button save">
                                                            <p>Хорошо</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            `);

                                                self.controller.addEventListener.item.init({
                                                    type: 'registry:add',
                                                    item: self
                                                })
                                            }
                                        } else {
                                            console.log('---------------', record.res)
                                            if(record.res.obj.hasOwnProperty('description')) {
                                                errorDialog(record.res.obj.description);
                                            } else {
                                                errorDialog(`${record.res.obj.error} for ${record.res.obj.path}`);
                                            }

                                            body_tr.forEach(item => {
                                                const disabled = item?.querySelectorAll('.header_button_add')
                                                if(disabled.length !== 0) {
                                                    disabled.forEach(data => {
                                                        data.removeAttribute('disabled', '')
                                                    })
                                                }
                                            })
                                        }
                                    } else {
                                        errorDialog('Ошибка в базе данных. Запись должна сущестовать');
                                        body_tr.forEach(item => {
                                            const disabled = item?.querySelectorAll('.header_button_add')
                                            if(disabled.length !== 0) {
                                                disabled.forEach(data => {
                                                    data.removeAttribute('disabled', '')
                                                })
                                            }
                                        })
                                    }
                                }
                            } else {
                                errorDialog(record.res.obj.description);
                                body_tr.forEach(item => {
                                    const disabled = item?.querySelectorAll('.header_button_add')
                                    if(disabled.length !== 0) {
                                        disabled.forEach(data => {
                                            data.removeAttribute('disabled', '')
                                        })
                                    }
                                })
                            }


                            // const record = await window[api].fetch.get('/api/v1/directory/record', {
                            //     active: true,
                            //     directoryId: rules.res.body.data[0].linkDirectoryId,
                            //     limit: 21,
                            //     offset: 0
                            // });

                        }
                    }
                },
                ferTable: {
                    add: {
                        settingsRule: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                const welcomeSection = self.closest('welcome-section');
                                let ruleSettings = welcomeSection.getState('rule/settings');
                                ruleSettings.createdAt = new Date(Date.now()).toISOString()

                                const errors = ferDialog.shadowRoot.querySelectorAll('.error')

                                for(let i = 0; i < errors.length; ++i) {
                                    errors[i].remove()
                                }
                                ruleSettings.interactionId = event.detail.settings.interactionId

                                const isHeader = !isEmpty(ruleSettings.headerId)
                                const isInteraction = !isEmpty(ruleSettings.interactionId)

                                if(!isHeader) {
                                    const select_header = ferDialog.shadowRoot.querySelector('.select_header.header')

                                    select_header.insertAdjacentHTML('afterend', `
                                            <span class="error">Выберите заголовок сообщения</span>
                                        `)
                                }

                                if(!isInteraction) {
                                    const select_header = ferDialog.shadowRoot.querySelector('.select_header.interaction')

                                    select_header.insertAdjacentHTML('afterend', `
                                            <span class="error">Выберите код взаимодействия</span>
                                        `)
                                }

                                if(isHeader && isInteraction) {
                                    const record = await window[api].fetch.post('/api/v1/rule', ruleSettings);

                                    if (record.res.ok) {
                                        const ferTable = welcomeSection.querySelectorAll('fer-table');
                                        const mssFilter = document.querySelector('mss-filter');
                                        const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                        welcomeSection.cleanState('record');
                                        welcomeSection.cleanState('rule/settings');
                                        welcomeSection.cleanState('rules');

                                        ferTable.forEach(item => {
                                            item.refresh();
                                        });

                                        mssInputs.forEach(item => {
                                            item.clean = true;
                                        });

                                        successDialog('Данные успешно сохранены');
                                    } else {
                                        welcomeSection.cleanState('record');
                                        welcomeSection.cleanState('rule/settings');
                                        welcomeSection.cleanState('rules');
                                        errorDialog(record.res.obj.description);
                                    }
                                }
                            }
                        },
                        subscription: async (event) => {
                            if (event.detail.id === self.dataset.id) {
                                if(event.detail.type === 'update' || event.detail.type === 'restore') {
                                    const welcomeSection = self.closest('welcome-section');
                                    const subscription = welcomeSection.getState('subscription');

                                    let compateEndAt = false
                                    let compateStartAt = 0

                                    if(subscription.endAt !== null) {
                                        compateEndAt = compareAsc(new Date(subscription.endAt), new Date( new Date(Date.now())))
                                    }

                                    if(event.detail.type === 'restore') {
                                        if(subscription.startAt !== null) {
                                            compateStartAt = compareAsc(new Date(subscription.startAt), new Date( new Date(Date.now())))
                                        }
                                    } else {
                                        compateStartAt = 0
                                    }

                                    if(event.detail.type === 'restore' && !isEmpty(subscription.startAt) && !isEmpty(subscription.endAt)) {
                                        const compateStartEnd = compareAsc(new Date(subscription.endAt), new Date(subscription.startAt))

                                        if(compateStartEnd <= 0) {
                                            const title = ferDialog.shadowRoot.querySelector('.block.datapicker')
                                            const errors = ferDialog.shadowRoot.querySelectorAll('.error')

                                            if(!isEmpty(errors)) {
                                                errors.forEach(item => {
                                                    item.remove()
                                                })
                                            }

                                            title.insertAdjacentHTML('beforebegin', `
                                                <span class="error">Даты не валидны. Проверьте корректность введенных данных</span>
                                            `)
                                            return
                                        }
                                    }


                                    if(compateStartAt === -1 ) {
                                        const title = ferDialog.shadowRoot.querySelector('.block.datapicker')
                                        const errors = ferDialog.shadowRoot.querySelectorAll('.error')
                                        if(!isEmpty(errors)) {
                                            errors.forEach(item => {
                                                item.remove()
                                            })
                                        }

                                        title.insertAdjacentHTML('beforebegin', `
                                            <span class="error">Даты не валидны. Проверьте корректность введенных данных</span>
                                        `)
                                    }

                                    if(compateStartAt !== -1) {
                                        let startAt = undefined
                                        let endAt = undefined
                                        let isRestore = false
                                        if(subscription.active) {
                                            startAt = subscription.startAt

                                            if(!isEmpty(subscription.endAt) && compateEndAt === -1) {
                                                const title = ferDialog.shadowRoot.querySelector('.block.datapicker')
                                                const errors = ferDialog.shadowRoot.querySelectorAll('.error')
                                                if(!isEmpty(errors)) {
                                                    errors.forEach(item => {
                                                        item.remove()
                                                    })
                                                }
                                                title.insertAdjacentHTML('beforebegin', `
                                                    <span class="error">Даты не валидны. Проверьте корректность введенных данных</span>
                                                `)

                                                return
                                            }

                                        //     if(compateStartAt === -1 ) {
                                        //         const title = ferDialog.shadowRoot.querySelector('.block.datapicker')
                                        //         const errors = ferDialog.shadowRoot.querySelectorAll('.error')
                                        //         if(!isEmpty(errors)) {
                                        //             errors.forEach(item => {
                                        //                 item.remove()
                                        //             })
                                        //         }
                                        //
                                        //         title.insertAdjacentHTML('beforebegin', `
                                        //     <span class="error">Даты не валидны. Проверьте корректность введенных данных</span>
                                        // `)
                                        //     }
                                        } else {
                                            compateStartAt = compareAsc(new Date(subscription.startAt), new Date( new Date(Date.now())))

                                            if(compateStartAt === -1) {
                                                startAt = new Date(Date.now()).toISOString()
                                            } else {
                                                startAt = (new Date(subscription.startAt)).toISOString()
                                            }
                                        }

                                        if(!subscription.active) {
                                            isRestore = true
                                        }

                                        endAt = subscription.endAt

                                        if(!isEmpty(endAt) && compateEndAt > 0) {
                                            endAt = (new Date(endAt)).toISOString()
                                        } else {
                                            endAt = null
                                        }

                                        const request = {
                                            "id": subscription.id,
                                            "active": true,
                                            "startAt": startAt,
                                            "endAt": endAt
                                        }

                                        const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                        let url = ''

                                        if(isSuppliers) {
                                            url = '/api/v1/sending'
                                        } else {
                                            url = '/api/v1/subscription'
                                        }

                                        const record = await window[api].fetch.put(url, request);

                                        if (record.res.ok) {
                                            const ferTable = welcomeSection.querySelectorAll('fer-table');
                                            const mssFilter = document.querySelector('mss-filter');
                                            const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');
                                            const ferSelect = mssFilter.shadowRoot.querySelectorAll('fer-select');

                                            welcomeSection.cleanState('record');
                                            welcomeSection.cleanState('subscription');

                                            ferTable.forEach(item => {
                                                item.refresh();
                                            });

                                            ferSelect.forEach(item => {
                                                if(item.dataset.field !== 'active') {
                                                    item.clean = true
                                                }
                                            });

                                            const section = store.get('section')

                                            if(section.toString() !== "7") {
                                                mssInputs.forEach(item => {
                                                    item.clean = true;
                                                });
                                            }

                                            let dialog = ''

                                            if(isRestore) {
                                                dialog = 'Данные успешно включены'
                                            } else {
                                                dialog = 'Данные успешно обновлены'
                                            }

                                            successDialog(dialog);
                                        } else {
                                            errorDialog(record.res.obj.description);
                                        }
                                    }
                                } else {
                                    const welcomeSection = self.closest('welcome-section');
                                    const subscription = welcomeSection.getState('subscription');
                                    subscription.createdAt = new Date(Date.now()).toISOString();

                                    const isEndAt = !!subscription.endAt
                                    const isInteractionId = !!subscription.interactionId
                                    const isRecipientId = !!subscription.recipientId
                                    const isStartAt = !!subscription.startAt
                                    const errors = ferDialog.shadowRoot.querySelectorAll('.error')

                                    for(let i = 0; i < errors.length; ++i) {
                                        errors[i].remove()
                                    }

                                    if(!isRecipientId) {
                                        const select_header = ferDialog.shadowRoot.querySelector('.select_header.recipient')
                                        select_header.insertAdjacentHTML('afterend', `
                                            <span class="error">Выберите код системы</span>
                                        `)
                                    }

                                    if(!isInteractionId) {
                                        const select_header = ferDialog.shadowRoot.querySelector('.select_header.interaction')

                                        select_header.insertAdjacentHTML('afterend', `
                                            <span class="error">Выберите код взаимодействия</span>
                                        `)
                                    }

                                    if(!isStartAt) {
                                        const datapicker = ferDialog.shadowRoot.querySelector('.info.datapicker')

                                        datapicker.insertAdjacentHTML('beforebegin', `
                                            <span class="error">Выберите дату начала</span>
                                        `)
                                    }

                                    let record = undefined

                                    if(isInteractionId && isRecipientId && isStartAt) {
                                        const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                        let url = ''
                                        if(isSuppliers) {
                                            url = '/api/v1/sending'
                                            subscription.senderId = subscription.recipientId
                                            delete subscription.recipientId
                                        } else {
                                            url = '/api/v1/subscription'
                                        }

                                        record = await window[api].fetch.post(url, subscription);

                                        if (record.res.ok) {
                                            const ferTable = welcomeSection.querySelectorAll('fer-table');
                                            const mssFilter = document.querySelector('mss-filter');
                                            const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                            welcomeSection.cleanState('record');
                                            welcomeSection.cleanState('subscription');

                                            ferTable.forEach(item => {
                                                item.refresh();
                                            });

                                            mssInputs.forEach(item => {
                                                item.clean = true;
                                            });

                                            successDialog('Данные успешно сохранены');
                                        } else {
                                            welcomeSection.cleanState('record');
                                            welcomeSection.cleanState('subscription');
                                            errorDialog(record.res.obj.description);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    card: {
                        remove: async (event, props) => {
                            if (event.detail.id === self.dataset.id) {
                                let path = '';
                                let request = {};
                                if (self.dataset.id === '6_0') {
                                    path = '/api/v1/rule';
                                    request = {
                                        'ruleId': event.detail.itemId.trim()
                                    };
                                }

                                if (self.dataset.id === '0') {
                                    path = '/api/v1/directory/record';
                                    const route = await router(self, { location });
                                    request = {
                                        'recordId': event.detail.itemId,
                                        'directoryId': route.value
                                    };
                                }

                                const record = await window[api].fetch.delete(path, request);

                                if (record.res.ok) {
                                    const welcomeSection = self.closest('welcome-section');
                                    const ferTable = welcomeSection.querySelectorAll('fer-table');
                                    const mssFilter = document.querySelector('mss-filter');
                                    const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                    welcomeSection.cleanState('record');
                                    welcomeSection.cleanState('rules');

                                    ferTable.forEach(item => {
                                        item.refresh();
                                    });

                                    mssInputs.forEach(item => {
                                        item.clean = true;
                                    });

                                    successDialog('Данные успешно выключены');
                                } else {
                                    console.log('record.res.body', record);
                                    let text = record.res.hasOwnProperty('obj') ? record.res.obj.description: record.res.body.description
                                    errorDialog(text.toLowerCase().includes('forbidden') ? 'Доступ не разрешен': text);
                                }
                            }
                        }
                    }
                }
            },
            registry: {
                new: {
                    field: (event) => {
                        const field = event.currentTarget.dataset.field
                        const buttons = event.currentTarget.closest('.registry.title.button').querySelectorAll('.registry.button.tab')
                        const bodyTr = event.currentTarget.closest('.registry.container')
                        const mssInputs = bodyTr.querySelectorAll('mss-input');
                        let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                        const welcomeSection = self.closest('welcome-section')
                        const data = []

                        const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                        subscriptionSetting[0].value = undefined
                        welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)

                        errorMessages = Array.from(errorMessages)

                        mssInputs.forEach(item => {
                            const input = item.shadowRoot.querySelector('input')
                            input.value = ''
                            data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                        })

                        errorMessages = errorMessages.concat(data);

                        for(let item of errorMessages) {
                            item.classList.remove('visible')
                        }

                        buttons.forEach(item => {
                            item.classList.toggle('active')
                        })

                        store.set('registry_field', field)
                    },
                    cancel: (event) => {
                        const body = event.currentTarget.closest('.body_tr');
                        const body_tr = body.closest('.body').querySelectorAll('.body_tr')
                        const welcomeSection = (event.currentTarget.getRootNode().host).closest('welcome-section')
                        welcomeSection.cleanState('post:/api/v1/subscription/setting')

                        body_tr.forEach(item => {
                            const disabled = item?.querySelectorAll('[disabled]')
                            if(disabled.length !== 0) {
                                disabled.forEach(data => {
                                    data.removeAttribute('disabled')
                                })
                            }
                        })

                        self.controller.addEventListener.item.terminate()
                    },
                    save: async (event) => {
                        const bodyTr = event.currentTarget.closest('.body_tr')
                        const welcomeSection = self.closest('welcome-section')
                        const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                        let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                        errorMessages = Array.from(errorMessages)

                        console.log('subscriptionSetting', subscriptionSetting)
                        // debugger
                        // .classList.add('error')

                        if(subscriptionSetting[0].value) {
                            // subscriptionSetting[0].createdAt = new Date(Date.now()).toISOString()
                            const subscription = await window[api].fetch.post('/api/v1/subscription/setting', subscriptionSetting)
                            if(subscription.res.ok) {

                                welcomeSection.cleanState('record');
                                welcomeSection.cleanState('rules');
                                welcomeSection.cleanState('settings');

                                self.refresh()
                                successDialog('Данные успешно сохранены');
                            } else {
                                welcomeSection.cleanState('record');
                                welcomeSection.cleanState('rules');
                                welcomeSection.cleanState('settings');
                                self.refresh()
                                errorDialog(subscription.res.obj.description);
                            }
                        } else {
                            console.log(' MSSINPUTS ')
                            const mssInputs = bodyTr.querySelectorAll('mss-input');
                            const data = []

                            mssInputs.forEach(item => {
                                data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                            })



                            errorMessages = errorMessages.concat(data);

                            // cardCodeInput.classList.add('error');
                            for(let item of errorMessages) {
                                item.textContent = 'Заполните обязательное поле'
                                item.classList.add('visible')
                            }
                            // errorMessage.classList.add('error');
                            // ferNotificetion.warning('Укажите верное значение');
                        }
                    }
                },
                item: {
                    restore: async (event) => {
                        let welcomeSection = self.closest('welcome-section');
                        const id = event.currentTarget.dataset.itemId;
                        const body = event.currentTarget.closest('.body')

                        ferDialog.open = {
                            type: 'remove',
                            title: 'Включить ',
                            detail: {
                                value: body.dataset.value,
                                itemId: event.currentTarget.dataset.itemId,
                                id: welcomeSection.dataset.id
                            },
                            button: [{
                                type: 'cancel',
                                description: 'Отмена'
                            }, {
                                type: 'update',
                                description: 'Хорошо'
                            }],
                            select: undefined,
                            description: 'Данная запись будет включена'
                        };
                    },
                    delete: async (event) => {
                        let welcomeSection = self.closest('welcome-section');
                        const id = event.currentTarget.dataset.itemId;

                        ferDialog.open = {
                            type: 'remove',
                            title: 'Отключить',
                            detail: {
                                itemId: event.currentTarget.dataset.itemId,
                                id: welcomeSection.dataset.id
                            },
                            button: [{
                                type: 'cancel',
                                description: 'Отмена'
                            }, {
                                type: 'remove',
                                description: 'Хорошо'
                            }],
                            select: undefined,
                            description: 'Данная запись будет отключена'
                        };
                    },
                    click: async (event) => {
                        if (event.target.tagName.toLowerCase() === 'checklist-checkbox' || event.target.tagName.toLowerCase() === 'mss-button') {

                        } else {
                            const welcomeSection = self.closest('welcome-section');
                            const mssFilter = document.querySelector('mss-filter');
                            const container = mssFilter.shadowRoot.querySelector('.container');
                            const titleHeader = container.querySelector('.titleHeader');
                            const mssInput = container.querySelectorAll('mss-input');
                            const back = mssFilter.shadowRoot.querySelector('.back');
                            const page_title = mssFilter.shadowRoot.querySelector('.page_title');
                            const buttonAdd = container.querySelector('.button_add');
                            const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                            const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
                            const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);

                            if (welcomeSection.dataset.id === '6') {
                                const interactionId = event.currentTarget.dataset.interactionId;

                                const headers = await window[api].fetch.get('/api/v1/rule', {
                                    interactionId: interactionId,
                                    limit: 12,
                                    offset: 0
                                });

                                if (headers.res.ok) {
                                    if (headers.res.body.data.length === 0) {
                                        ferNotificetion.warning('По запросу данных нет');
                                    } else {
                                        ferSelectActive.style.display = 'none'
                                        ferSelectCode.style.display = 'none'
                                        ferSelectName.style.display = 'none'
                                        back.style.display = 'flex';
                                        page_title.style.display = 'flex';
                                        page_title.textContent = 'Список заголовков';
                                        buttonAdd.classList.add('visible')

                                        const code = headers.res.body.data[0].interactionCode;

                                        if (!titleHeader) {
                                            container.insertAdjacentHTML('afterbegin', `
                                              <p class="titleHeader">${headers.res.body.data[0].interactionName}</p>
                                            `);
                                        } else {
                                            titleHeader.textContent = headers.res.body.data[0].interactionName;
                                            titleHeader.style.display = 'flex';
                                        }

                                        for (let item of mssInput) {
                                            item.style.display = 'none';
                                        }

                                        const route = await router(self, { location });

                                        mssFilter.dataset.interactionId = interactionId.trim();
                                        history.pushState('Правила', {}, `${route.pathName}${interactionId.trim()}`);

                                        const service = self.closest('.service');
                                        const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);
                                        const tables = toWelcomeSection.querySelectorAll('fer-table');
                                        toWelcomeSection.setState('rules', headers);
                                        store.set('section', self.dataset.to);

                                        tables.forEach(item => {
                                            item.refresh();
                                        });

                                        window.dispatchEvent(new CustomEvent('change-views', {
                                            bubbles: true,
                                            composed: true,
                                            detail: {
                                                id: self.dataset.to,
                                                from: self.dataset.id,
                                                type: 'transform',
                                                action: `to`,
                                                code: code
                                            }
                                        }));
                                    }
                                } else {
                                    errorDialog(headers.res.statusText);
                                }
                            }


                            if (welcomeSection.dataset.id === '5') {
                                const welcomeSection = self.closest('welcome-section');
                                const mssFilter = document.querySelector('mss-filter');
                                const container = mssFilter.shadowRoot.querySelector('.container');
                                const titleHeader = container.querySelector('.titleHeader');
                                const mssInput = container.querySelectorAll('mss-input');
                                const mssInputExport = mssFilter.shadowRoot.querySelector('mss-input[data-field="export"]');
                                const back = mssFilter.shadowRoot.querySelector('.back');
                                const pageTitle = mssFilter.shadowRoot.querySelector('.page_title');
                                const buttonAdd = container.querySelector('.button_add');
                                const buttonExport = container.querySelector('.button_export');
                                const menuAudit = mssFilter.shadowRoot.querySelector('.menu_audit')
                                const buttonFilterFirst = mssFilter.shadowRoot.querySelector('.button_filter_first')

                                const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
                                const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
                                const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);

                                const directoryName = event.currentTarget.dataset.directoryName;
                                const recipientSystemName = event.currentTarget.dataset.recipientSystemName;
                                const interactionName = event.currentTarget.dataset.interactionName;
                                const logType = event.currentTarget.dataset.logType;
                                const createdAt = event.currentTarget.dataset.createdAt;
                                let directoryRecordId = event.currentTarget.dataset.directoryRecordId;
                                const route = await router(self, { location });

                                if(isEmpty(directoryRecordId)) {
                                    directoryRecordId = route.link
                                }

                                const audit = await window[api].fetch.post('/api/v1/audit',{
                                    directoryRecordId: directoryRecordId
                                }, false, {
                                    limit: 320,
                                    offset: 0
                                });

                                if (audit.res.ok) {
                                    if(Object.keys(audit.res.body.data).length === 0) {
                                        errorDialog('Список пустой');
                                    } else {
                                        window.dispatchEvent(new CustomEvent('change-views-template', {
                                            bubbles: true,
                                            composed: true,
                                            detail: {
                                                id: self.dataset.to,
                                            }
                                        }));

                                        buttonFilterFirst.classList.add('invisible')
                                        container.classList.remove('invisible')
                                        back.classList.remove('invisible')
                                        page_title.classList.remove('invisible')
                                        buttonExport.classList.add('invisible')
                                        mssInputExport.style.display = 'flex'
                                        container.style.display = 'flex'
                                        back.style.display = 'flex';
                                        page_title.style.display = 'flex';
                                        page_title.textContent = directoryName ? directoryName: audit.res.body.data[0].directoryName;
                                        buttonExport.removeAttribute('style')
                                        menuAudit.classList.remove('invisible')
                                        const menuAuditUid = menuAudit.querySelector('.menu_audit_info.uid')
                                        const menuAuditCodeFirst = menuAudit.querySelector('.menu_audit_info.codeFirst')
                                        const menuAuditCodeSecond = menuAudit.querySelector('.menu_audit_info.codeSecond')

                                        let filed = {
                                            "0": {
                                                title:'',
                                                value: ''
                                            },
                                            "1": {
                                                title:'',
                                                value: ''
                                            },
                                            "2": {
                                                title:'',
                                                value: ''
                                            }
                                        }

                                        filed[0].title = `UID ${audit.res.body.data[0].directoryName.toLowerCase().trim()}`
                                        filed[0].value = `${audit.res.body.data[0].directoryRecordId.toLowerCase().trim()}`

                                        if(audit.res.body.data[0].directoryName.toLowerCase().trim() === 'правила') {
                                            filed[1].title = `Код взаимодействия`
                                            filed[1].value = `${isEmpty(audit.res.body.data[0].interactionCode)? '—': audit.res.body.data[0].interactionCode}`
                                            filed[2].title = `Код системы`
                                            filed[2].value = `${isEmpty(audit.res.body.data[0].recipientSystemCode)? '—': audit.res.body.data[0].recipientSystemCode}`
                                        }

                                        if(audit.res.body.data[0].directoryName.toLowerCase().trim() === 'подписки' || audit.res.body.data[0].directoryName.toLowerCase().trim() === 'подписка') {
                                            filed[1].title = `Код системы`
                                            filed[1].value = `${isEmpty(audit.res.body.data[0].recipientSystemCode)? '—': audit.res.body.data[0].recipientSystemCode}`
                                            filed[2].title = `Код взаимодействия`
                                            filed[2].value = `${isEmpty(audit.res.body.data[0].interactionCode)? '—': audit.res.body.data[0].interactionCode}`
                                        }

                                        if(audit.res.body.data[0].directoryName.toLowerCase().trim() === 'настройки подписок') {
                                            filed[1].title = `Код системы`
                                            filed[1].value = `${isEmpty(audit.res.body.data[0].recipientSystemCode)? '—': audit.res.body.data[0].recipientSystemCode}`
                                            filed[2].title = `Код взаимодействия`
                                            filed[2].value = `${isEmpty(audit.res.body.data[0].interactionCode)? '—': audit.res.body.data[0].interactionCode}`
                                        }

                                        menuAuditUid.querySelector('.menu_audit_title').textContent = filed[0].title
                                        menuAuditUid.querySelector('.menu_audit_value').textContent = filed[0].value

                                        menuAuditCodeFirst.querySelector('.menu_audit_title').textContent = filed[1].title
                                        menuAuditCodeFirst.querySelector('.menu_audit_value').textContent = filed[1].value

                                        menuAuditCodeSecond.querySelector('.menu_audit_title').textContent = filed[2].title
                                        menuAuditCodeSecond.querySelector('.menu_audit_value').textContent = filed[2].value

                                        history.pushState('Журнал изменений', {}, `${route.pathName}${directoryRecordId.trim()}${location.search}`);

                                        mssFilter.dataset.directoryRecordId = directoryRecordId.trim();

                                        const service = self.closest('.service');
                                        const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);

                                        store.set('section', self.dataset.to);

                                        toWelcomeSection.cleanState('post:/api/v1/audit');
                                        toWelcomeSection.setState('post:/api/v1/audit', audit);

                                        const tables = toWelcomeSection.querySelectorAll('fer-table');

                                        tables.forEach(item => {
                                            item.refresh();
                                        });

                                        window.dispatchEvent(new CustomEvent('change-views', {
                                            bubbles: true,
                                            composed: true,
                                            detail: {
                                                id: self.dataset.to,
                                                from: self.dataset.id,
                                                type: 'transform',
                                                action: `to`
                                            }
                                        }));
                                    }
                                } else {
                                    let text = audit.res.hasOwnProperty('obj') ? audit.res.obj.description: audit.res.body.description
                                    errorDialog(text.toLowerCase().includes('forbidden') ? 'Доступ не разрешен': text);
                                }
                            }

                            if (welcomeSection.dataset.id === '7') {
                                const subscriptionId = event.currentTarget.dataset.subscriptionId;
                                let interactionId = event.currentTarget.dataset.interactionId;
                                const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

                                if(!isSuppliers) {
                                    const result = await window[api].fetch.get('/api/v1/subscription/setting', {
                                        subscriptionId: subscriptionId,
                                        limit: 12,
                                        offset: 0
                                    });

                                    if (result.res.ok) {

                                        ferSelectActive.reset = true
                                        ferSelectCode.reset = true
                                        ferSelectName.reset = true


                                        if(Object.keys(result.res.body.data).length === 0) {
                                            container.style.display = 'none'
                                            back.style.display = 'flex';
                                            page_title.style.display = 'flex';
                                            page_title.textContent = 'Список настроек подписки';

                                            for (let item of mssInput) {
                                                item.style.display = 'none';
                                                item.classList.add('invisible')
                                            }

                                            const subscription = await window[api].fetch.get('/api/v1/subscription', {
                                                subscriptionId: subscriptionId,
                                                limit: 12,
                                                offset: 0
                                            });

                                            if(subscription.res.body.data.length === 0) {

                                                const route = await router(self, { location });

                                                history.pushState('Настройки подписок', {}, `${route.pathName}${subscriptionId.trim()}${location.search}`);

                                                mssFilter.dataset.subscriptionId = subscriptionId.trim();

                                                const service = self.closest('.service');
                                                const welcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.id}"]`);
                                                const fertable = welcomeSection.querySelector('fer-table')
                                                const ferPagination = fertable.querySelector('fer-pagination')
                                                ferPagination.reset = true
                                                const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);

                                                store.set('section', self.dataset.to);

                                                toWelcomeSection.setState('settings', result);

                                                const tables = toWelcomeSection.querySelectorAll('fer-table');

                                                tables.forEach(item => {
                                                    item.refresh();
                                                });


                                                if (!titleHeader) {
                                                    container.insertAdjacentHTML('afterbegin', `
                                                    <p class="titleHeader">Список настроек подписки</p>
                                                `);
                                                } else {
                                                    titleHeader.textContent = 'Настройки';
                                                    titleHeader.style.display = 'flex';
                                                }

                                                window.dispatchEvent(new CustomEvent('change-views', {
                                                    bubbles: true,
                                                    composed: true,
                                                    detail: {
                                                        id: self.dataset.to,
                                                        from: self.dataset.id,
                                                        type: 'transform',
                                                        action: `to`
                                                    }
                                                }));

                                                errorDialog('Должна быть запись Список пустой');
                                            } else {
                                                if (subscription.res.ok) {
                                                    const rule = await window[api].fetch.get('/api/v1/rule', {
                                                        active: true,
                                                        interactionId: subscription.res.body.data[0].interactionId,
                                                        limit: 300,
                                                        offset: 0
                                                    });

                                                    if(rule.res.ok) {
                                                        rule.res.body.data.forEach(item => {
                                                            if (!result.res.body.data.some(data => data.headerId === item.headerId)) {
                                                                result.res.body.data.push({
                                                                    "active": true,
                                                                    "id": subscriptionId,
                                                                    "headerId": item.headerId,
                                                                    "interactionId": item.interactionId,
                                                                    "headerCode": item.headerCode,
                                                                    "headerName": item.headerName,
                                                                    "isNew": true
                                                                })
                                                            }
                                                        })
                                                    }

                                                    const route = await router(self, { location });

                                                    history.pushState('Настройки подписок', {}, `${route.pathName}${subscriptionId.trim()}${location.search}`);

                                                    mssFilter.dataset.subscriptionId = subscriptionId.trim();

                                                    const service = self.closest('.service');
                                                    const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);

                                                    store.set('section', self.dataset.to);

                                                    toWelcomeSection.setState('settings', result);

                                                    const tables = toWelcomeSection.querySelectorAll('fer-table');

                                                    tables.forEach(item => {
                                                        item.erase();
                                                        item.refresh();
                                                    });


                                                    window.dispatchEvent(new CustomEvent('change-views', {
                                                        bubbles: true,
                                                        composed: true,
                                                        detail: {
                                                            id: self.dataset.to,
                                                            from: self.dataset.id,
                                                            type: 'transform',
                                                            action: `to`
                                                        }
                                                    }));
                                                }
                                            }
                                        } else {
                                            container.style.display = 'none'
                                            back.style.display = 'flex';
                                            page_title.style.display = 'flex';
                                            page_title.textContent = 'Список настроек подписки';
                                            interactionId = result.res.body.data[Object.keys(result.res.body.data)[0]].interactionId;
                                            const body = self.shadowRoot.querySelector('.body')
                                            body.innerHTML = ''

                                            const rule = await window[api].fetch.get('/api/v1/rule', {
                                                active: true,
                                                interactionId: interactionId,
                                                limit: 300,
                                                offset: 0
                                            });

                                            if(rule.res.ok) {
                                                rule.res.body.data.forEach(item => {
                                                    if (!result.res.body.data.some(data => data.headerId === item.headerId)) {
                                                        result.res.body.data.push({
                                                            "active": true,
                                                            "id": subscriptionId,
                                                            "headerId": item.headerId,
                                                            "interactionId": item.interactionId,
                                                            "headerCode": item.headerCode,
                                                            "headerName": item.headerName,
                                                            "isNew": true
                                                        })
                                                    }
                                                })
                                            }

                                            if (!titleHeader) {
                                                container.insertAdjacentHTML('afterbegin', `
                                                <p class="titleHeader">Список настроек подписки</p>
                                            `);
                                            } else {
                                                titleHeader.textContent = 'Настройки';
                                                titleHeader.style.display = 'flex';
                                            }

                                            for (let item of mssInput) {
                                                item.style.display = 'none';
                                            }

                                            const route = await router(self, { location });

                                            history.pushState('Настройки подписок', {}, `${route.pathName}${subscriptionId.trim()}${location.search}`);

                                            mssFilter.dataset.subscriptionId = subscriptionId.trim();

                                            const service = self.closest('.service');
                                            const toWelcomeSection = service.querySelector(`welcome-section[data-id="${welcomeSection.dataset.to}"]`);

                                            store.set('section', self.dataset.to);

                                            toWelcomeSection.setState('settings', result);

                                            const tables = toWelcomeSection.querySelectorAll('fer-table');

                                            tables.forEach(item => {
                                                item.refresh();
                                            });

                                            window.dispatchEvent(new CustomEvent('change-views', {
                                                bubbles: true,
                                                composed: true,
                                                detail: {
                                                    id: self.dataset.to,
                                                    from: self.dataset.id,
                                                    type: 'transform',
                                                    action: `to`
                                                }
                                            }));
                                        }
                                    } else {
                                        errorDialog(result.res.obj.description);
                                    }
                                }
                            }
                        }
                    }
                }
            },
            card: {
                delete: (event) => {
                    if (event) {
                        const body = event.currentTarget.closest('.body_tr.card');
                        const isNew = body.classList.contains('new');

                        if (isNew) {
                            const mssFilter = document.body.querySelector('mss-filter')
                            mssFilter.shadowRoot.querySelector('.button_add').removeAttribute('disabled')
                            self.controller.addEventListener.item.terminate();
                            welcomeSection.cleanState('directory');
                        } else {
                            if (self.dataset.id === '0') {
                                const id = body.dataset.id;
                                const interactionId = body.dataset.interactionId;
                                const button = body.querySelector('.button.card.edit');
                                const buttonDelete = body.querySelector('.button.card.delete');

                                if(buttonDelete.classList.contains('cancel')) {
                                    const directory = welcomeSection.getState('directory');

                                    const code = body.querySelector('.code.value');
                                    const name = body.querySelector('.name.value');

                                    code.removeAttribute('contenteditable', '');
                                    name.removeAttribute('contenteditable', '');

                                    code.classList.remove('input');
                                    name.classList.remove('input');

                                    buttonDelete.classList.remove('cancel');
                                    buttonDelete.textContent = 'Отключить';

                                    button.classList.remove('save');
                                    button.textContent = 'Редактировать';
                                    const oldDirectory = welcomeSection.getState('old_directory');

                                    code.textContent = oldDirectory.code
                                    name.textContent = oldDirectory.name
                                } else {
                                    debugger
                                    ferDialog.open = {
                                        type: 'remove',
                                        title: 'Отключить',
                                        detail: {
                                            itemId: id.trim(),
                                            id: self.dataset.id,
                                            interactionId: interactionId
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
                                }
                            }

                            if (self.dataset.id === '6_0') {
                                debugger
                                const id = body.dataset.id;
                                const interactionId = body.dataset.interactionId;
                                ferDialog.open = {
                                    type: 'remove',
                                    title: 'Отключить',
                                    detail: {
                                        itemId: id.trim(),
                                        id: self.dataset.id,
                                        interactionId: interactionId
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
                            }
                        }
                    }
                },
                edit: async (event, props) => {
                    let currentTarget = undefined
                    if(props && props.hasOwnProperty('currentTarget')) {
                        currentTarget = props.currentTarget
                    } else {
                        currentTarget = event.currentTarget
                    }

                    const body = event.currentTarget.closest('.body_tr.card');
                    const isNew = body.classList.contains('new');
                    let isSave = currentTarget.classList.contains('save');
                    isSave = isSave ? isSave: currentTarget.classList.contains('item-update');
                    let isEdit = currentTarget.classList.contains('edit');
                    isEdit = isEdit ? isEdit: currentTarget.classList.contains('item-update');
                    const isRemove = currentTarget.classList.contains('remove') || event.currentTarget.classList.contains('delete');
                    const mssFilter = document.querySelector('mss-filter');
                    const container = mssFilter.shadowRoot.querySelector('.container');
                    const buttonAdd = container.querySelector('.button_add');

                    if (isEdit && !isSave) {
                        if (self.dataset.id === '0') {
                            const body_tr = currentTarget.closest('.body_tr');

                            const button = body_tr.querySelector('.button.card.edit');
                            const buttonDelete = body_tr.querySelector('.button.card.delete');
                            const code = body_tr.querySelector('.code.value');
                            const name = body_tr.querySelector('.name.value');

                            const directory = welcomeSection.getState('directory');

                            if (!button.classList.contains('save')) {
                                code.setAttribute('contenteditable', '');
                                name.setAttribute('contenteditable', '');

                                directory.code = code.textContent.trim();
                                directory.name = name.textContent.trim();

                                welcomeSection.setState('old_directory', structuredClone(directory));
                                welcomeSection.setState('directory', directory);

                                code.classList.add('input');
                                name.classList.add('input');

                                buttonDelete.classList.add('cancel');
                                buttonDelete.textContent = 'Отмена';

                                button.classList.add('save');
                                button.textContent = 'Сохранить';
                            }
                        }
                    }

                    if (isEdit && isSave && !isNew) {
                        if (self.dataset.id.toString() === '0') {
                            const welcomeSection = self.closest('welcome-section');
                            let newRecord = welcomeSection.getState('directory');
                            let oldRecord = welcomeSection.getState('old_directory');

                            if(!isEmpty(newRecord.code) && !isEmpty(newRecord.name)) {
                                if(oldRecord.name === newRecord.name && oldRecord.code === newRecord.code) {
                                    const bodyTr = event.currentTarget.closest('.body_tr');
                                    let cardCodeInput = bodyTr.querySelector('.value.card.code.input');
                                    cardCodeInput = !isEmpty(cardCodeInput)? cardCodeInput: bodyTr.querySelector('[data-field="code"]')
                                    const cardNameInput = bodyTr.querySelector('[data-field="name"]')
                                    const errorMessageCode = bodyTr.querySelector('.errorMessage.code');
                                    const errorMessageName = bodyTr.querySelector('.errorMessage.name');


                                    errorMessageCode.textContent = 'Одно из полей должно измениться'
                                    errorMessageCode.classList.add('error');

                                    errorMessageName.textContent = 'Одно из полей должно измениться'
                                    errorMessageName.classList.add('error');

                                    cardCodeInput.classList.add('error');
                                    cardNameInput.classList.add('error');
                                } else {
                                    const bodyTr = event.currentTarget.closest('.body_tr');
                                    delete newRecord.createdAt;
                                    const route = await router(self, { location });
                                    newRecord.updatedAt = new Date(Date.now()).toISOString();
                                    newRecord.directoryId = route.value;
                                    const record = await window[api].fetch.put('/api/v1/directory/record', newRecord);

                                    if (record.res.ok) {
                                        const mssFilter = document.querySelector('mss-filter');
                                        const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                                        mssInputs.forEach(item => {
                                            item.clean = true;
                                        });

                                        welcomeSection.cleanState('record');

                                        successDialog('Данные успешно обновлены');

                                        buttonAdd.removeAttribute('disabled')

                                        self.refresh();
                                    } else {
                                        self.refresh();
                                        errorDialog(record.res.hasOwnProperty('obj')?record.res.obj.description : record.res.body.description === 'Forbidden' ? 'Доступ запрещен': record.res.body.description);
                                    }
                                }
                            } else {
                                if(isEmpty(newRecord.code)) {
                                    const bodyTr = event.currentTarget.closest('.body_tr');
                                    let cardCodeInput = bodyTr.querySelector('.value.card.code.input');
                                    cardCodeInput = !isEmpty(cardCodeInput)? cardCodeInput: bodyTr.querySelector('[data-field="code"]')
                                    const errorMessage = bodyTr.querySelector('.errorMessage.code');
                                    cardCodeInput.classList.add('error');
                                    errorMessage.classList.add('error');
                                    return
                                }

                                if(isEmpty(newRecord.name)) {
                                    const bodyTr = event.currentTarget.closest('.body_tr');
                                    let cardNameInput = bodyTr.querySelector('.value.card.name.input');
                                    cardNameInput = !isEmpty(cardNameInput)? cardNameInput: bodyTr.querySelector('[data-field="name"]')
                                    const errorMessage = bodyTr.querySelector('.errorMessage.name');
                                    errorMessage.classList.add('error');
                                    cardNameInput.classList.add('error');
                                    return
                                }
                            }
                        }
                    }

                    if (isNew) {
                        if (self.dataset.id === '0') {
                            const directory = welcomeSection.getState('directory');
                            const mssFilter = document.querySelector('mss-filter');
                            const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input');

                            if (isEmpty(directory.code)) {
                                const bodyTr = event.currentTarget.closest('.body_tr');
                                let cardCodeInput = bodyTr.querySelector('.value.card.code.input');
                                cardCodeInput = !isEmpty(cardCodeInput)? cardCodeInput: bodyTr.querySelector('[data-field="code"]')
                                const errorMessage = bodyTr.querySelector('.errorMessage.code');
                                cardCodeInput.classList.add('error');
                                errorMessage.style.display = 'flex';
                                return
                            }

                            if (isEmpty(directory.name)) {
                                const bodyTr = event.currentTarget.closest('.body_tr');
                                let cardNameInput = bodyTr.querySelector('.value.card.name.input');
                                cardNameInput = !isEmpty(cardNameInput)? cardNameInput: bodyTr.querySelector('[data-field="name"]')
                                const errorMessage = bodyTr.querySelector('.errorMessage.name');
                                cardNameInput.classList.add('error');
                                errorMessage.style.display = 'flex';
                                return
                            }
                            
                            if (!isEmpty(directory.code) && !isEmpty(directory.name)) {
                                directory.createdAt = new Date(Date.now()).toISOString();
                                const route = await router(self, { location });
                                directory.directoryId = route.value;

                                const record = await window[api].fetch.post('/api/v1/directory/record', directory);
                                if (record.res.ok) {
                                    const buttonAdd = mssFilter.shadowRoot.querySelector('.button_add')
                                    buttonAdd.removeAttribute('disabled')
                                    mssInputs.forEach(item => {
                                        item.clean = true;
                                    });
                                    successDialog('Данные успешно сохранены');
                                    self.refresh();
                                } else {
                                    console.log('-------- ERROR -----------', record.res.statusText)
                                    errorDialog(record.res.hasOwnProperty('obj')? record.res.obj.description:  record.res.statusText);
                                }
                            }
                        }
                    }
                },
                code: (event, props) => {
                    const body_td = event.currentTarget.closest('.body_td')
                    const errorMessage = body_td.querySelector('.errorMessage')

                    if(errorMessage !== null) {
                        errorMessage.removeAttribute('style')
                    }

                    event.currentTarget.classList.remove('error');
                    const directory = welcomeSection.getState('directory');
                    directory.code = event.currentTarget.textContent.trim();
                    welcomeSection.setState('directory', directory);
                },
                name: (event) => {
                    const body_td = event.currentTarget.closest('.body_td')
                    const errorMessage = body_td.querySelector('.errorMessage')

                    if(errorMessage !== null) {
                        errorMessage.removeAttribute('style')
                    }

                    event.currentTarget.classList.remove('error');
                    const directory = welcomeSection.getState('directory');
                    directory.name = event.currentTarget.textContent.trim();
                    welcomeSection.setState('directory', directory);
                },
                title: async (event) => {
                    try {
                        await navigator.clipboard.writeText(event.currentTarget.textContent.trim());
                    } catch (err) {

                    }
                }
            }
        });
    });
};

export default {
    description: 'actions'
};