import { store, router, isEmpty, jwtDecode } from '../../../../../this/index.mjs'
let api = Symbol.for("api");

const groupBy = (values, keyFinder) => {
    // using reduce to aggregate values
    return values.reduce((a, b) => {
        // depending upon the type of keyFinder
        // if it is function, pass the value to it
        // if it is a property, access the property
        const key = typeof keyFinder === 'function' ? keyFinder(b) : b[keyFinder];

        // aggregate values based on the keys
        if(!a[key]){
            a[key] = [b];
        }else{
            a[key] = [...a[key], b];
        }

        return a;
    }, {});
};

const ferDialog = document.querySelector('fer-dialog');
const errorDialog = (message, text = 'Ошибка') => {
    ferDialog.open = {
        type: 'error',
        title: text,
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
/*
{
    type: 'text:title',
    mapping: ['title','class','value'],
    title: '№',
    class: "row title",
    value: ''
},
 */
const createСard = (template = false) => {
    let result = {
        type: 'card',
        status: "new",
        title: 'Карточки',
        mapping: ['card'],
        group: {
            mapping: ['value'],
            title: "Настройка",
            value: ['default']
        },
        card: {
            mapping: ['body'],
            body: {
                mapping: ['value'],
                value: [[{
                    type: 'text:title',
                    mapping: ['title', 'class', 'value', 'setAttribute'],
                    title: 'Код',
                    class: "code input",
                    setAttribute: `contenteditable`,
                    value: '',
                    error: {
                        class: "errorMessage code",
                        description: 'Заполните обязательное поле'
                    },
                    notification: {
                        class: "notification",
                        description: 'Введите код'
                    }
                }, {
                    type: 'text:title',
                    mapping: ['title','value','class', 'setAttribute', 'error'],
                    title: 'Наименование',
                    class: "name input",
                    setAttribute: `contenteditable`,
                    value : '',
                    error: {
                        class: "errorMessage name",
                        description: 'Заполните обязательное поле'
                    },
                    notification: {
                        class: "notification",
                        description: 'Введите наименование'
                    }
                }, {
                    type: 'card:button',
                    mapping: ['value', 'class'],
                    class: 'row',
                    value: [{
                        id: 'edit save',
                        value: 'Сохранить',
                        isActive: true
                    }, {
                        id: 'delete',
                        value: 'Отмена',
                        isActive: true
                    }]
                }]]
            }
        }
    }

    if(template) {
        result = template
    }

    return  result
};

const card = (self, route, force = []) => {
    return new Promise(async function (resolve, reject) {
        if(!Array.isArray(force)) {
            console.error('аргумент force должен быть массив', force)
            debugger
        }

        const {
            key,
            value
        } = route;

        if (key.toString() === '0') {
            const welcomeSection = self.closest('welcome-section')
            let record = {}
            let pagination = {}

            record = welcomeSection.getState('record')
            const filter = welcomeSection.getState('post:/api/v1/directory/record/filter')
            const ferPagination = welcomeSection.querySelector('fer-pagination')
            pagination = ferPagination.getState('pagination')

            const isForceRegistry = force.find(item => item === 'registry')
            if(isEmpty(record)) {
                if(!isEmpty(filter.code) || !isEmpty(filter.name)) {
                    record = await window[api].fetch.post('/api/v1/directory/record/filter', {
                        "active": true,
                        "directoryId": route.value,
                        "type": 0,
                        "operator": "like",
                        "field": isEmpty(filter.code)? 'name': 'code',
                        "value": isEmpty(filter.code)? filter.name: filter.code,
                        "limit": pagination.limit,
                        "offset": pagination.offset
                    });
                } else {
                    record = await window[api].fetch.get('/api/v1/directory/record', {
                        active: true,
                        directoryId: route.value,
                        limit: pagination.limit,
                        offset: pagination.offset
                    });
                }
            }

            let data = {};
            data.this = [];
            data.interactionId = []
            data.id = []


            if (record.res.ok) {
                if(record.res.body.data.length !== 0) {
                    const limit = record.res.body.limit
                    const offset = record.res.body.offset
                    const total = record.res.body.total
                    ferPagination.maxCount = total

                    for (let i = 0; i < record.res.body.data.length; ++i) {
                        let cardItem = ''
                       if(isForceRegistry) {

                           cardItem = [{
                               id: 'id',
                               type: 'text',
                               mapping: ['value'],
                               value: '1',
                               class: 'id'
                           }, {
                               id: 'interactionId:code',
                               type: 'text',
                               mapping: ['value'],
                               value: 'remd-registration-request ',
                               class: 'interactionId--code'
                           }, {
                               id: 'interactionId:name',
                               type: 'text',
                               mapping: ['value'],
                               value: 'РЭМД. Доставка заявок на регистрацию ЭМД в РЭМД',
                               class: 'interactionId--name'
                           },{
                               id: 'mss:button',
                               type: 'mss:button',
                               mapping: ['value'],
                               value: [{
                                   id: 'restore',
                                   value: 'Включить',
                               }, {
                                   id: 'update',
                                   value: 'Обновить'
                               }, {
                                   id: 'delete',
                                   value: 'Отключить'
                               }]
                           }, {
                               id: 'settings',
                               type: 'dataset:object',
                               mapping: ['value'],
                               value: {
                                   id: "asdasdasdasdas"
                               }
                           }];
                       } else {
                           cardItem = [{
                               id: 'code',
                               type: 'text:title',
                               mapping: ['title', 'value'],
                               title: 'Код',
                               class: 'code',
                               value: 'remd-registration-request'
                           }, {
                               id: 'name',
                               type: 'text:title',
                               mapping: ['title', 'value'],
                               title: 'Наименование',
                               class: 'name',
                               value: 'РЭМД. Доставка заявок на регистрацию ЭМД в РЭМД'
                           }, {
                               type: 'card:button',
                               mapping: ['value', 'class'],
                               class: 'row',
                               value: [{
                                   id: 'edit',
                                   value: 'Редактировать',
                                   isActive: true
                               }, {
                                   id: 'delete',
                                   value: 'Отключить',
                                   isActive: true
                               }]
                           }];
                       }
                        const start = (pagination.page - 1) * pagination.limit
                        cardItem = cardItem.map((item, index) => {
                            switch (item.id) {
                            case 'id':
                                item.value = start + i + 1;
                                break;
                            case 'code':
                                item.value = record.res.body.data[i].code;
                                break;
                            case 'name':
                                item.value = record.res.body.data[i].name;
                                break;
                            case 'interactionId:code':
                                item.value = record.res.body.data[i].code;
                                break;
                            case 'interactionId:name':
                                item.value = record.res.body.data[i].name;
                                break;
                            case 'mss:button':
                                if(!record.res.body.data[i].active) {
                                    item.value = item.value.filter(item => item.id.trim() === 'restore')
                                } else {
                                    item.value = item.value.filter(item => item.id.trim() === 'update' || item.id.trim() === 'delete')
                                }
                            default:
                                break;
                            }
                            return item;
                        });

                        data.id.push(record.res.body.data[i].id);
                        data.this.push(cardItem);
                    }
                } else {
                    const bodyTr = self.shadowRoot.querySelector('.body_tr.new')
                    console.log('----------- bodyTr ------------', bodyTr)
                    if(!isEmpty(bodyTr)) {
                        const mssInputs = bodyTr.querySelectorAll('mss-input');
                        let errorMessages = bodyTr.querySelectorAll('.errorMessage.code');
                        const data = []

                        errorMessages = Array.from(errorMessages)

                        mssInputs.forEach(item => {
                            data.push(item.shadowRoot.querySelector('.errorMessage.code'))
                        })

                        errorMessages = errorMessages.concat(data);

                        for(let item of errorMessages) {
                            item.textContent = 'Записей не найденно'
                            item.classList.add('visible')
                        }
                    }
                }
            } else {
                errorDialog(record.res.hasOwnProperty('obj')? record.res.obj.description: record.res.statusText)
                const result = [];
                resolve(result);
            }


            let service = {}
            if(isForceRegistry) {
                service = {
                    mapping: ['settings', 'header', 'body'],
                    header: {
                        mapping: ['value'],
                        value: [['N', 'Код', 'Наименование']]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            id: data.id,
                            interactionId: data.interactionId
                        }
                    },
                    settings: {
                        mapping: ['value'],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 264px 1fr 24px'
                        }, {
                            type: 'body',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 264px 1fr 24px'
                        }]
                    }
                }
            } else {
                service = {
                    mapping: ['body'],
                    header: {
                        mapping: [],
                        value: [[]]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            id: data.id,
                            interactionId: data.interactionId
                        }
                    },
                    settings: {
                        mapping: [],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: 'repeat(3, 1fr)'
                        }, {
                            type: 'body',
                            mapping: [],//mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: 'repeat(3, 1fr)'
                        }]
                    }
                }
            }

            const result = {
                type: 'card',
                class: force,
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Карточки',
                mapping: [force? force: 'card',],
                group: {
                    mapping: ['value'],
                    title: "Настройка",
                    value: ['default']
                },
                [force? force: 'card']: service
            };
            resolve(result);
        }

        if (key.toString() === '6'|| key.toString() === '6_0') {
            const welcomeSection = self.closest('welcome-section')
            let record = welcomeSection.getState('rules')
            const route = await router(self, {location})

            if(isEmpty(record)) {
                record = await window[api].fetch.get('/api/v1/rule', {
                    interactionId: route.link,
                    limit: 20,
                    offset: 0
                });
            }

            let data = {};
            data.this = [];
            data.id = []
            data.interactionId = [];

            if (record.res.ok) {
                for (let i = 0; i < record.res.body.data.length; ++i) {
                    let cardItem = [{
                        id: 'code',
                        type: 'text:title',
                        mapping: ['title', 'value'],
                        title: 'Код',
                        class: 'code',
                        value: 'undefined'
                    }, {
                        id: 'name',
                        type: 'text:title',
                        mapping: ['title', 'value'],
                        title: 'Наименование',
                        class: 'name',
                        value: 'undefined'
                    }, {
                        id: 'card:button',
                        type: 'card:button',
                        mapping: ['value', 'class'],
                        class: 'row',
                        value: [{
                            id: 'delete',
                            value: 'Отключить',
                            isActive: false
                        }, {
                            id: 'restore',
                            value: 'Включить',
                            isActive: false
                        }]
                    }];

                    cardItem = cardItem.map((item, index) => {
                        switch (item.id) {
                        case 'id':
                            item.value = record.res.body.data[i].id;
                            break;
                        case 'code':
                            item.value = record.res.body.data[i].headerCode;
                            break;
                        case 'name':
                            item.value = record.res.body.data[i].headerName;
                            break;
                        case 'card:button':
                            for(let data of item.value) {
                                if(data.id === 'delete') {
                                    data.isActive =  record.res.body.data[i].active
                                }
                                if(data.id === 'restore') {
                                    data.isActive =  !record.res.body.data[i].active
                                }
                            }

                            break;
                        default:
                            break;
                        }
                        return item;
                    });

                    data.interactionId.push(record.res.body.data[i].interactionId);
                    data.id.push(record.res.body.data[i].id)
                    data.this.push(cardItem)
                }
            } else {
                errorDialog(record.res.obj.description)
                const result = [];
                resolve(result);
            }

            const result = {
                type: 'card',
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Карточки',
                mapping: ['card'],
                group: {
                    mapping: ['value'],
                    title: "Настройка",
                    value: ['default']
                },
                card: {
                    mapping: ['body'],
                    header: {
                        mapping: [],
                        value: [[]]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            interactionId: data.interactionId,
                            id: data.id
                        }
                    },
                    settings: {
                        mapping: [],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: 'repeat(3, 1fr)'
                        }, {
                            type: 'body',
                            mapping: [],//mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: 'repeat(3, 1fr)'
                        }]
                    }
                }
            };
            resolve(result);
        }

        if(key.toString() !== '6' && key.toString() !== '0' && key.toString() !== '100') {
            console.error('Новый ключ надо добавить какой объект будет формироваться', route)
        }
    });
};

const registry = (self, route) => {
    return new Promise(async function (resolve, reject) {
        let result = {};

        if (route.key === '6') {
            const welcomeSection = self.closest('welcome-section')
            let rule = welcomeSection.getState('record')
            const ferPagination = self.querySelector('fer-pagination')
            let filter = {}
            let pagination = {
                limit: 6,
                offset: 0
            }

            if(ferPagination) {
                pagination = ferPagination.getState('pagination')
            }

            if(isEmpty(rule)) {
                rule = await window[api].fetch.get('/api/v1/rule/grouped', {
                    limit: pagination.limit,
                    offset: pagination.offset
                });
            }

            if (rule.res.ok) {
                filter = await window[api].fetch.get('/api/v1/rule/grouped', {
                    limit: 400,
                    offset: 0
                });

                const mssFilter = document.querySelector('mss-filter')
                let data = {};
                data.this = []
                data.interactionId = []
                data.interactionCode = new Set();
                data.interactionName = new Set();

                ferPagination.maxCount = rule.res.body.total

                for (let i = 0; i < filter.res.body.data.length; ++i) {
                    data.interactionName.add({
                        interactionName: filter.res.body.data[i].interactionName,
                        interactionId: filter.res.body.data[i].interactionId
                    })
                    data.interactionCode.add({
                        interactionCode: filter.res.body.data[i].interactionCode,
                        interactionId: filter.res.body.data[i].interactionId
                    })
                }

                data.interactionName.add({
                    interactionName: 'Наименование взаимодействия',
                    interactionId: undefined
                })

                data.interactionCode.add({
                    interactionCode: 'Код взаимодействия',
                    interactionId: undefined
                })

                for (let i = 0; i < rule.res.body.data.length; ++i) {
                    let registryItem = [{
                        id: 'id',
                        type: 'text',
                        mapping: ['value'],
                        value: '1',
                        class: 'id'
                    }, {
                        id: 'interactionId:code',
                        type: 'text',
                        mapping: ['value'],
                        value: 'remd-registration-request ',
                        class: 'interactionId--code'
                    }, {
                        id: 'interactionId:name',
                        type: 'text',
                        mapping: ['value'],
                        value: 'РЭМД. Доставка заявок на регистрацию ЭМД в РЭМД',
                        class: 'interactionId--name'
                    }, {
                        id: 'settings',
                        type: 'dataset:object',
                        mapping: ['value'],
                        value: {
                            id: "asdasdasdasdas"
                        }
                    }];

                    const ferPagination = self.querySelector('fer-pagination')
                    pagination = ferPagination.getState('pagination')
                    const start = (pagination.page - 1) * pagination.limit

                    registryItem = registryItem.map((item, index) => {
                        switch (item.id) {
                        case 'id':
                            item.value = start + i + 1;
                            break;
                        case 'interactionId:code':
                            item.value = rule.res.body.data[i].interactionCode;
                            break;
                        case 'interactionId:name':
                            item.value = rule.res.body.data[i].interactionName;
                            break;
                        default:
                            break;
                        }
                        return item;
                    });

                    data.this.push(registryItem);
                    data.interactionId.push(rule.res.body.data[i].interactionId)
                }

                mssFilter.code = [...data.interactionCode]
                mssFilter.name = [...data.interactionName]

                result = {
                    type: 'registry',
                    to: self.dataset.to,
                    id: self.dataset.id,
                    title: 'Регистр',
                    mapping: ['registry'],
                    group: {
                        mapping: ['value'],
                        title: "Настройка",
                        value: ['default']
                    },
                    registry: {
                        mapping: ['settings', 'header', 'body'],
                        header: {
                            mapping: ['value'],
                            value: [['N', 'Код взаимодействия', 'Наименование взаимодействия']]
                        },
                        body: {
                            mapping: ['value'],
                            value: data.this,
                            dataset: {
                                interactionId: data.interactionId
                            }
                        },
                        settings: {
                            mapping: ['value'],
                            value: [{
                                type: 'header',
                                mapping: ['gridTemplateColumns'],
                                gridTemplateColumns: '40px repeat(2, 1fr)'
                            }, {
                                type: 'body',
                                mapping: ['gridTemplateColumns'],
                                gridTemplateColumns: '40px repeat(2, 1fr)'
                            }]
                        }
                    }
                };
            } else {
                errorDialog(rule.res.obj.description)
                const result = [];
                resolve(result);
            }
        }

        const section = store.get('section')

        if (route.key === '5' && section === '5_0') {
            const route = await router(self, {location})
            const welcomeSection = self.closest('welcome-section')
            let subscription = welcomeSection.getState('post:/api/v1/audit')
            const mssFilter = document.querySelector('mss-filter')
            const container = mssFilter.shadowRoot.querySelector('.container');
            const mssInputs = container.querySelectorAll('mss-input');
            const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
            const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
            const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);
            const buttonAdd = mssFilter.shadowRoot.querySelector('.button_add')
            const buttonExport = mssFilter.shadowRoot.querySelector('.button_export')
            const menuAudit = mssFilter.shadowRoot.querySelector('.menu_audit')
            const menuMssInput = menuAudit.querySelector('mss-input')
            const ferPagination = self.querySelector('fer-pagination')

            let pagination = {
                limit: 6,
                offset: 0
            }

            if(ferPagination) {
                pagination = ferPagination.getState('pagination')
            }

            if(isEmpty(subscription)) {
                subscription = await window[api].fetch.post('/api/v1/audit',{
                    directoryRecordId: route.link
                }, false, {
                    limit: 32,
                    offset: 0
                });
            }

            welcomeSection.setState("post:/api/v1/audit", subscription)

            let data = {};
            data.this = []
            data.directoryName = []
            data.recipientSystemName = []
            data.interactionName = []
            data.logType = []
            data.createdAt = []
            data.directoryRecordId = []

            if (subscription.res.ok) {
                if(ferPagination) {
                    ferPagination.maxCount = subscription.res.body.total
                }

                mssInputs.forEach(item => {
                    item.clean = true
                })

                mssFilter.style.opacity = 1
                buttonAdd.classList.remove('visible')
                ferSelectActive.style.display = 'none'
                ferSelectName.style.display = 'none'
                ferSelectCode.style.display = 'none'
                menuMssInput.classList.contains('invisible') ? menuMssInput.classList.remove('invisible'):  ''
                buttonExport.classList.contains('invisible') ? '':  buttonExport.classList.add('invisible')

                document.dispatchEvent(new CustomEvent(`change-views-template`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        section: '5_0'
                    }
                }));

                const filter = await window[api].fetch.post('/api/v1/audit',{
                    directoryRecordId: route.link
                }, false, {
                    limit: 400,
                    offset: 0
                });

                const logType = new Set()
                const username = new Set()

                logType.add('Действие')
                username.add('Логин пользователя (СНИЛС)')

                for (let i = 0; i < filter.res.body.data.length; ++i) {
                    logType.add(filter.res.body.data[i].logType)
                    username.add(filter.res.body.data[i].auditUserDTO.username)
                }

                mssFilter.logType = [...logType]
                mssFilter.username = [...username]

                for (let i = 0; i < subscription.res.body.data.length; ++i) {
                    let registryItem = [{
                        id: 'id',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'name',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'oldValue',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'currentValue',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'logType',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'createdAt',
                        type: 'text:date:start',
                        mapping: ['value'],
                        value: '01.01.2023 \n 00:00:00'
                    }, {
                        id: 'username',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'fio',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }, {
                        id: 'email',
                        type: 'text',
                        mapping: ['value'],
                        value: undefined
                    }];

                    // const ferPagination = self.querySelector('fer-pagination')
                    // pagination = ferPagination.getState('pagination')
                    // console.log('==============', pagination)
                    registryItem = registryItem.map((item, index) => {
                        let isFixSeconds = ''
                        let isFixMinutes = ''
                        let isFixHours = ''

                        switch (item.id) {
                            case 'id':
                                item.value = i + 1;
                                break;
                            case 'directoryName':
                                item.value = subscription.res.body.data[i].directoryName;
                                break;
                            case 'name':
                                item.value = subscription.res.body.data[i].changedField.name;
                                break;
                            case 'oldValue':
                                item.value = subscription.res.body.data[i].changedField.oldValue;
                                item.class = 'wordBreak'
                                break;
                            case 'currentValue':
                                item.value = subscription.res.body.data[i].changedField.currentValue;
                                item.class = 'wordBreak'
                                break;
                            case 'logType':
                                if(subscription.res.body.data[i].logType === 'CREATED') {
                                    item.value = 'Создана';
                                } else if(subscription.res.body.data[i].logType === 'UPDATED') {
                                    item.value = 'Отредактирована';
                                } else if(subscription.res.body.data[i].logType === 'DELETED') {
                                    item.value = 'Удалена';
                                } else if(subscription.res.body.data[i].logType === 'RECOVERED') {
                                    item.value = 'Востановлена';
                                }
                                break;
                            case 'createdAt':
                                let dateCreatedAt= new Date(subscription.res.body.data[i].createdAt);
                                isFixSeconds = dateCreatedAt.getSeconds().toString().length === 1
                                isFixMinutes = dateCreatedAt.getMinutes().toString().length === 1
                                isFixHours = dateCreatedAt.getHours().toString().length === 1
                                item.value = `${dateCreatedAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${dateCreatedAt.getHours()}`: dateCreatedAt.getHours()}:${isFixMinutes? `0${dateCreatedAt.getMinutes()}`:dateCreatedAt.getMinutes()}:${isFixSeconds? `0${dateCreatedAt.getSeconds()}`: dateCreatedAt.getSeconds()}`;
                                break;
                            case 'username':
                                item.value = subscription.res.body.data[i].auditUserDTO.username;
                                break;
                            case 'fio':
                                item.value = `${subscription.res.body.data[i].auditUserDTO.lastName} ${subscription.res.body.data[i].auditUserDTO.firstName}`;
                                break;
                            case 'email':
                                item.value = isEmpty(subscription.res.body.data[i].auditUserDTO.email)? `-`: `${subscription.res.body.data[i].auditUserDTO.email}`;
                                break;
                            case 'recipientSystemName':
                                item.value = subscription.res.body.data[i].recipientSystemName;
                                break;
                            case 'interactionName':
                                item.value = subscription.res.body.data[i].interactionName;
                                break;
                            case 'startAt':
                                let date= new Date(subscription.res.body.data[i].startAt);
                                isFixSeconds = date.getSeconds().toString().length === 1
                                isFixMinutes = date.getMinutes().toString().length === 1
                                isFixHours = date.getHours().toString().length === 1

                                item.value = `${date.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${date.getHours()}`: date.getHours()}:${isFixMinutes? `0${date.getMinutes()}`:date.getMinutes()}:${isFixSeconds? `0${date.getSeconds()}`: date.getSeconds()}`;
                                break;
                            case 'endAt':
                                let endAt = '-'
                                if(subscription.res.body.data[i].endAt !== null) {
                                    endAt = new Date(subscription.res.body.data[i].endAt)
                                    isFixSeconds = endAt.getSeconds().toString().length === 1
                                    isFixMinutes = endAt.getMinutes().toString().length === 1
                                    isFixHours = endAt.getHours().toString().length === 1

                                    item.value = `${endAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${endAt.getHours()}`: endAt.getHours()}:${isFixMinutes? `0${endAt.getMinutes()}`:endAt.getMinutes()}:${isFixSeconds? `0${endAt.getSeconds()}`: endAt.getSeconds()}`
                                } else {
                                    item.value = endAt
                                }
                                break;
                            case 'recipientId:code':
                                item.value = subscription.res.body.data[i].recipientCode;
                                break;
                            case 'recipientId:name':
                                item.value = subscription.res.body.data[i].recipientName;
                                break;
                            case 'interactionId:code':
                                item.value = subscription.res.body.data[i].interactionCode;
                                break;
                            case 'interactionId:name':
                                item.value = subscription.res.body.data[i].interactionName;
                                break;
                            case 'active':
                                item.value = subscription.res.body.data[i].active;
                                item.itemId = subscription.res.body.data[i].id;
                                break;
                            case 'mss:button':
                                if(!subscription.res.body.data[i].active) {
                                    item.value = item.value.filter(item => item.id.trim() === 'restore')
                                } else {
                                    item.value = item.value.filter(item => item.id.trim() === 'update' || item.id.trim() === 'delete')
                                }
                                break
                            default:
                                break;
                        }
                        return item;
                    });
                    data.this.push(registryItem);


                    data.directoryRecordId.push(subscription.res.body.data[i].directoryRecordId)
                    data.directoryName.push(subscription.res.body.data[i].directoryName)
                    data.recipientSystemName.push(subscription.res.body.data[i].recipientSystemName)
                    data.interactionName.push(subscription.res.body.data[i].interactionName)
                    data.logType.push(subscription.res.body.data[i].logType)
                    data.createdAt.push(subscription.res.body.data[i].createdAt)
                }

                // mssFilter.code = [...data.recipientCode]
                // mssFilter.name = [...data.interactionCode]
            } else {
                errorDialog(subscription.res.obj.description)
            }

            const header = ['N', 'Параметр', 'Первоначальное значение', 'Новое значение', 'Действие','Дата и время изменения','Логин пользователя (СНИЛС)','ФИО пользователя','E-mail пользователя'];
            result = {
                type: 'registry',
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Регистр',
                mapping: ['registry'],
                group: {
                    mapping: ['value'],
                    title: "Настройка",
                    value: ['default']
                },
                registry: {
                    mapping: ['settings', 'header', 'body'],
                    header: {
                        mapping: ['value'],
                        value: [header]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            directoryRecordId: data.directoryRecordId,
                            directoryName: data.directoryName,
                            recipientSystemName: data.recipientSystemName,
                            interactionName: data.interactionName,
                            logType: data.logType,
                            createdAt: data.createdAt
                        }
                    },
                    settings: {
                        mapping: ['value'],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns', 'position', 'top'],
                            gridTemplateColumns: '40px 100px 120px 140px 120px 100px 110px 1fr 152px',
                            position: 'sticky',
                            top: '308px'
                        }, {
                            type: 'body',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 100px 120px 140px 120px 100px 110px 1fr 152px'
                        }]
                    }
                }
            };
        }

        if (route.key === '5' && section !== '5_0') {
            const welcomeSection = self.closest('welcome-section')
            let subscription = welcomeSection.getState('post:/api/v1/audit')
            const mssFilter= document.querySelector('mss-filter')
            const container = mssFilter.shadowRoot.querySelector('.container');
            const mssInputs = container.querySelectorAll('mss-input');
            const ferSelectActive = mssFilter.shadowRoot.querySelector(`[data-field="active"]`);
            const ferSelectCode = mssFilter.shadowRoot.querySelector(`[data-field="code"]`);
            const ferSelectName = mssFilter.shadowRoot.querySelector(`[data-field="name"]`);
            const buttonAdd = mssFilter.shadowRoot.querySelector('.button_add')
            const buttonExport = mssFilter.shadowRoot.querySelector('.button_export')
            const buttonFilter = mssFilter.shadowRoot.querySelector('.button_filter_first')
            const menuAudit = mssFilter.shadowRoot.querySelector('.menu_audit')

            const ferPagination = self.querySelector('fer-pagination')

            let pagination = {
                limit: 6,
                offset: 0
            }

            if(ferPagination) {
                pagination = ferPagination.getState('pagination')
            }

            const filter_5 = mssFilter.getState('filter_5')
            let request = {}
            for(let key in filter_5) {
                if(!isEmpty(filter_5[key])) {
                    request[key] = filter_5[key]
                }
            }

            if(isEmpty(subscription)) {
                subscription = await window[api].fetch.post('/api/v1/audit',request, false, {
                    limit: pagination.limit,
                    offset: pagination.offset
                });
            }

            let data = {};
            data.this = []
            data.directoryName = []
            data.recipientSystemName = []
            data.interactionName = []
            data.logType = []
            data.createdAt = []
            data.directoryRecordId = []

            if (subscription.res.ok) {
                welcomeSection.setState("post:/api/v1/audit", subscription)
                if(subscription.res.body.data.length !== 0) {
                    if(ferPagination) {
                        ferPagination.maxCount = subscription.res.body.total
                    }

                    mssInputs.forEach(item => {
                        item.clean = true
                    })

                    mssFilter.style.opacity = 1
                    buttonAdd.classList.remove('visible')
                    ferSelectActive.style.display = 'none'
                    ferSelectName.style.display = 'none'
                    ferSelectCode.style.display = 'none'
                    buttonExport.style.display = 'flex'
                    buttonFilter.style.display = 'flex'
                    menuAudit.classList.add('invisible')
                    buttonExport.classList.remove('invisible')
                    buttonFilter.classList.remove('invisible')

                    let filter = await window[api].fetch.get('/api/v1/audit/filters')

                    if(filter.res.ok) {
                        filter = filter.res.body
                        filter.directories.unshift('Сущность')
                        filter.interactions.unshift('Наименование взаимодействия')
                        filter.systems.unshift('Наименование системы')

                        mssFilter.directoryName = filter.directories
                        mssFilter.interactionName = filter.interactions
                        mssFilter.recipientSystemName = filter.systems

                        for (let i = 0; i < subscription.res.body.data.length; ++i) {
                            let isFixSeconds = ''
                            let isFixMinutes = ''
                            let isFixHours = ''

                            let registryItem = [{
                                id: 'id',
                                type: 'text',
                                mapping: ['value'],
                                value: undefined
                            }, {
                                id: 'directoryName',
                                type: 'text',
                                mapping: ['value'],
                                value: undefined
                            }, {
                                id: 'recipientSystemName',
                                type: 'text',
                                mapping: ['value'],
                                value: undefined
                            }, {
                                id: 'interactionName',
                                type: 'text',
                                mapping: ['value'],
                                value: undefined
                            }, {
                                id: 'logType',
                                type: 'text',
                                mapping: ['value'],
                                value: undefined
                            }, {
                                id: 'createdAt',
                                type: 'text:date:start',
                                mapping: ['value'],
                                value: '01.01.2023 \n 00:00:00'
                            }];

                            const start = (pagination.page - 1) * pagination.limit
                            registryItem = registryItem.map((item, index) => {
                                switch (item.id) {
                                    case 'id':
                                        item.value = start + i + 1;
                                        break;
                                    case 'directoryName':
                                        item.value = subscription.res.body.data[i].directoryName;
                                        break;
                                    case 'recipientSystemName':
                                        item.value = isEmpty(subscription.res.body.data[i].recipientSystemName)?'-':subscription.res.body.data[i].recipientSystemName;
                                        break;
                                    case 'interactionName':
                                        item.value = isEmpty(subscription.res.body.data[i].interactionName)?'-': subscription.res.body.data[i].interactionName;
                                        break;
                                    case 'logType':
                                        if(subscription.res.body.data[i].logType === 'CREATED') {
                                            item.value = 'Создана';
                                        } else if(subscription.res.body.data[i].logType === 'UPDATED') {
                                            item.value = 'Отредактирована';
                                        } else if(subscription.res.body.data[i].logType === 'DELETED') {
                                            item.value = 'Удалена';
                                        } else if(subscription.res.body.data[i].logType === 'RECOVERED') {
                                            item.value = 'Востановлена';
                                        }
                                        break;
                                    case 'createdAt':
                                        let dateCreatedAt= new Date(subscription.res.body.data[i].createdAt);
                                        isFixSeconds = dateCreatedAt.getSeconds().toString().length === 1
                                        isFixMinutes = dateCreatedAt.getMinutes().toString().length === 1
                                        isFixHours = dateCreatedAt.getHours().toString().length === 1

                                        item.value = `${dateCreatedAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${dateCreatedAt.getHours()}`: dateCreatedAt.getHours()}:${isFixMinutes? `0${dateCreatedAt.getMinutes()}`:dateCreatedAt.getMinutes()}:${isFixSeconds? `0${dateCreatedAt.getSeconds()}`: dateCreatedAt.getSeconds()}`
                                        break;
                                    case 'startAt':
                                        let date= new Date(subscription.res.body.data[i].startAt);
                                        isFixSeconds = date.getSeconds().toString().length === 1
                                        isFixMinutes = date.getMinutes().toString().length === 1
                                        isFixHours = date.getHours().toString().length === 1

                                        item.value = `${date.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${date.getHours()}`: date.getHours()}:${isFixMinutes? `0${date.getMinutes()}`:date.getMinutes()}:${isFixSeconds? `0${date.getSeconds()}`: date.getSeconds()}`
                                        break;
                                    case 'endAt':
                                        let endAt = '-'
                                        if(subscription.res.body.data[i].endAt !== null) {
                                            endAt = new Date(subscription.res.body.data[i].endAt)
                                            isFixSeconds = endAt.getSeconds().toString().length === 1
                                            isFixMinutes = endAt.getMinutes().toString().length === 1
                                            isFixHours = endAt.getHours().toString().length === 1
                                            item.value = `${endAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${endAt.getHours()}`: endAt.getHours()}:${isFixMinutes? `0${endAt.getMinutes()}`:endAt.getMinutes()}:${isFixSeconds? `0${endAt.getSeconds()}`: endAt.getSeconds()}`
                                        } else {
                                            item.value = endAt
                                        }
                                        break;
                                    case 'recipientId:code':
                                        item.value = subscription.res.body.data[i].recipientCode;
                                        break;
                                    case 'recipientId:name':
                                        item.value = subscription.res.body.data[i].recipientName;
                                        break;
                                    case 'interactionId:code':
                                        item.value = subscription.res.body.data[i].interactionCode;
                                        break;
                                    case 'interactionId:name':
                                        item.value = subscription.res.body.data[i].interactionName;
                                        break;
                                    case 'active':
                                        item.value = subscription.res.body.data[i].active;
                                        item.itemId = subscription.res.body.data[i].id;
                                        break;
                                    case 'mss:button':
                                        if(!subscription.res.body.data[i].active) {
                                            item.value = item.value.filter(item => item.id.trim() === 'restore')
                                        } else {
                                            item.value = item.value.filter(item => item.id.trim() === 'update' || item.id.trim() === 'delete')
                                        }
                                        break
                                    default:
                                        break;
                                }
                                return item;
                            });

                            data.this.push(registryItem);
                            data.directoryRecordId.push(subscription.res.body.data[i].directoryRecordId)
                            data.directoryName.push(subscription.res.body.data[i].directoryName)
                            data.recipientSystemName.push(subscription.res.body.data[i].recipientSystemName)
                            data.interactionName.push(subscription.res.body.data[i].interactionName)
                            data.logType.push(subscription.res.body.data[i].logType)
                            data.createdAt.push(subscription.res.body.data[i].createdAt)
                        }
                        // mssFilter.code = [...data.recipientCode]
                        // mssFilter.name = [...data.interactionCode]

                    }
                } else {
                    mssInputs.forEach(item => {
                        item.clean = true
                    })

                    mssFilter.style.opacity = 1
                    buttonAdd.classList.remove('visible')
                    ferSelectActive.style.display = 'none'
                    ferSelectName.style.display = 'none'
                    ferSelectCode.style.display = 'none'
                    buttonExport.style.display = 'flex'
                    buttonFilter.style.display = 'flex'
                    menuAudit.classList.add('invisible')
                    buttonExport.classList.remove('invisible')
                    buttonFilter.classList.remove('invisible')

                    ferPagination.reset = true

                    errorDialog('Записей не найдено', 'Предупреждение')
                }
            } else {
                errorDialog(subscription.res.obj.description)
            }

            const header = ['N', 'Сущность', 'Наименование системы', 'Наименование взаимодействия', 'Действие','Дата и время изменения'];
            result = {
                type: 'registry',
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Регистр',
                mapping: ['registry'],
                group: {
                    mapping: ['value'],
                    title: "Настройка",
                    value: ['default']
                },
                registry: {
                    mapping: ['settings', 'header', 'body'],
                    header: {
                        mapping: ['value'],
                        value: [header]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            directoryRecordId: data.directoryRecordId,
                            directoryName: data.directoryName,
                            recipientSystemName: data.recipientSystemName,
                            interactionName: data.interactionName,
                            logType: data.logType,
                            createdAt: data.createdAt
                        }
                    },
                    settings: {
                        mapping: ['value'],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 179px 106px 1fr 116px 138px'
                        }, {
                            type: 'body',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 179px 106px 1fr 116px 138px'
                        }]
                    }
                }
            };
        }


        if (route.key === '7' && section !== '7_0') {
            const welcomeSection = self.closest('welcome-section')
            let subscription = welcomeSection.getState('record')
            const mssFilter= document.querySelector('mss-filter')
            const ferSelect = mssFilter.shadowRoot.querySelector('.mss-filter[data-field="active"]')
            const ferPagination = self.querySelector('fer-pagination')

            let pagination = {
                limit: 6,
                offset: 0
            }

            if(ferPagination) {
                pagination = ferPagination.getState('pagination')
            }

            const isActive = ferSelect.dataset.value === 'true' || ferSelect.dataset.value === 'undefined' || ferSelect.dataset.value === undefined || ferSelect.dataset.value === null || ferSelect.dataset.value === 'null'
            const isSuppliers = window.location.pathname.startsWith('/sending') || window.location.pathname.startsWith('/testing/sending')

            let filterUrl = ''
            let filter = ''

            if(isSuppliers) {
                filter = welcomeSection.getState('post:/api/v1/sending/filter')
                filterUrl = '/api/v1/sending/filter'
            } else {
                filter = welcomeSection.getState('post:/api/v1/subscription/filter')
                filterUrl = '/api/v1/subscription/filter'
            }

            if(isEmpty(subscription)) {
                if(isEmpty(filter.code) && isEmpty(filter.name)) {
                    filter.active = isActive

                    if(isSuppliers) {
                        welcomeSection.setState('post:/api/v1/sending/filter', filter)
                    } else {
                        welcomeSection.setState('post:/api/v1/subscription/filter', filter)
                    }

                    let url = '/api/v1/subscription'

                    if(isSuppliers) {
                        url = '/api/v1/sending'
                    }

                    subscription = await window[api].fetch.get(url, {
                        active: isActive,
                        limit: pagination.limit,
                        offset: pagination.offset
                    });
                } else {
                    let field = undefined
                    let value = undefined

                    if(isEmpty(filter.code)) {
                        value = filter.name
                        field = 'interactionCode'
                    } else if(isEmpty(filter.name)) {
                        value = filter.code
                        field = isSuppliers? 'senderCode': 'recipientCode'
                    } else {
                        console.error('На данный момент два фильтра не могут быть включенны')
                        return
                    }

                    filter.active = isActive

                    if(isSuppliers) {
                        welcomeSection.setState('post:/api/v1/sending/filter', filter)
                    } else {
                        welcomeSection.setState('post:/api/v1/subscription/filter', filter)
                    }

                    subscription = await window[api].fetch.post(filterUrl, {
                        "active": isActive,
                        "type": 0,
                        "operator": "like",
                        "field": field,
                        "value": value,
                        "limit": pagination.limit,
                        "offset": pagination.offset
                    });
                }
            }

            if(isSuppliers) {
                welcomeSection.setState("get:/api/v1/sending", subscription)
            } else {
                welcomeSection.setState("get:/api/v1/subscription", subscription)
            }

            let data = {};
            data.this = []
            data.subscriptionId = []
            data.interactionId = []
            data.recipientCode = new Set()
            data.interactionCode = new Set()

            if (subscription.res.ok) {
                if(ferPagination) {
                    ferPagination.maxCount = subscription.res.body.total
                }

                for (let i = 0; i < subscription.res.body.data.length; ++i) {
                    let registryItem = [{
                        id: 'id',
                        type: 'text',
                        mapping: ['value'],
                        value: '1'
                    }, {
                        id: 'recipientId:code',
                        type: 'text',
                        mapping: ['value'],
                        value: 'remd'
                    }, {
                        id: 'recipientId:name',
                        type: 'text',
                        mapping: ['value'],
                        value: 'РЭМД'
                    }, {
                        id: 'interactionId:code',
                        type: 'text',
                        mapping: ['value'],
                        value: 'remd-registration-request'
                    }, {
                        id: 'interactionId:name',
                        type: 'text',
                        mapping: ['value'],
                        value: 'РЭМД. Доставка заявок на регистрацию ЭМД в РЭМД'
                    },  {
                        id: 'active',
                        type: 'checkbox',
                        mapping: ['value', 'itemId'],
                        value: '',
                        disabled: true,
                        itemId: 'asdsda-edsrre-sdvers-sdfsdgs'
                    }, {
                        id: 'startAt',
                        type: 'text:date:start',
                        mapping: ['value'],
                        value: '01.01.2023 \n 00:00:00'
                    }, {
                        id: 'endAt',
                        type: 'text:date:end',
                        mapping: ['value'],
                        value: '01.01.2023 \n 00:00:00'
                    }, {
                        id: 'mss:button',
                        type: 'mss:button',
                        mapping: ['value'],
                        value: [{
                            id: 'restore',
                            value: 'Включить',
                        }, {
                            id: 'update',
                            value: 'Обновить'
                        }, {
                            id: 'delete',
                            value: 'Отключить'
                        }]
                    }];

                    const ferPagination = self.querySelector('fer-pagination')
                    pagination = ferPagination.getState('pagination')
                    const start = (pagination.page - 1) * pagination.limit

                    registryItem = registryItem.map((item, index) => {
                        let isFixSeconds = ''
                        let isFixMinutes = ''
                        let isFixHours = ''

                        switch (item.id) {
                        case 'id':
                            item.value = start + i + 1;
                            break;
                        case 'startAt':
                            let date= new Date(subscription.res.body.data[i].startAt);
                            isFixSeconds = date.getSeconds().toString().length === 1
                            isFixMinutes = date.getMinutes().toString().length === 1
                            isFixHours = date.getHours().toString().length === 1
                            item.value = `${date.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${date.getHours()}`: date.getHours()}:${isFixMinutes? `0${date.getMinutes()}`:date.getMinutes()}:${isFixSeconds? `0${date.getSeconds()}`: date.getSeconds()}`;
                            break;
                        case 'endAt':
                            let endAt = '-'
                            if(subscription.res.body.data[i].endAt !== null) {
                                endAt = new Date(subscription.res.body.data[i].endAt)
                                isFixSeconds = endAt.getSeconds().toString().length === 1
                                isFixMinutes = endAt.getMinutes().toString().length === 1
                                isFixHours = endAt.getHours().toString().length === 1
                                item.value = `${endAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${endAt.getHours()}`: endAt.getHours()}:${isFixMinutes? `0${endAt.getMinutes()}`:endAt.getMinutes()}:${isFixSeconds? `0${endAt.getSeconds()}`: endAt.getSeconds()}`
                            } else {
                                item.value = endAt
                            }
                            break;
                        case 'recipientId:code':
                            if(isSuppliers) {
                                item.value = subscription.res.body.data[i].senderCode;
                            } else {
                                item.value = subscription.res.body.data[i].recipientCode;
                            }
                            break;
                        case 'recipientId:name':
                            if(isSuppliers) {
                                item.value = subscription.res.body.data[i].senderName;
                            } else {
                                item.value = subscription.res.body.data[i].recipientName;
                            }
                            break;
                        case 'interactionId:code':
                            item.value = subscription.res.body.data[i].interactionCode;
                            break;
                        case 'interactionId:name':
                            item.value = subscription.res.body.data[i].interactionName;
                            break;
                        case 'active':
                            item.value = subscription.res.body.data[i].active;
                            item.itemId = subscription.res.body.data[i].id;
                            break;
                        case 'mss:button':
                            if(!subscription.res.body.data[i].active) {
                                item.value = item.value.filter(item => item.id.trim() === 'restore')
                            } else {
                                item.value = item.value.filter(item => item.id.trim() === 'update' || item.id.trim() === 'delete')
                            }
                            break
                        default:
                            break;
                        }
                        return item;
                    });
                    data.this.push(registryItem);
                    data.subscriptionId.push(subscription.res.body.data[i].id)
                    data.interactionId.push(subscription.res.body.data[i].interactionId)
                }

                // mssFilter.code = [...data.recipientCode]
                // mssFilter.name = [...data.interactionCode]
            } else {
                let text = record.res.hasOwnProperty('obj') ? record.res.obj.description: record.res.body.description
                errorDialog(text)
            }

            const header = ['N', 'Код системы', 'Наименование системы', 'Код взаимодействия', 'Наименование взаимодействия','Включено', 'Дата начала', 'Дата окончания', ''];
            result = {
                type: 'registry',
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Регистр',
                mapping: ['registry'],
                group: {
                    mapping: ['value'],
                    title: "Настройка",
                    value: ['default']
                },
                registry: {
                    mapping: ['settings', 'header', 'body'],
                    header: {
                        mapping: ['value'],
                        value: [header]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            subscriptionId: data.subscriptionId,
                            interactionId: data.interactionId
                        }
                    },
                    settings: {
                        mapping: ['value'],
                        value: [{
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 70px 106px 114px 1fr 72px 80px 80px 24px'
                        }, {
                            type: 'body',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 70px 106px 114px 1fr 72px 80px 80px 24px'
                        }]
                    }
                }
            };
        }

        if (route.key === '7' && section === '7_0') {
            const welcomeSection = self.closest('welcome-section')
            let settings = welcomeSection.getState('settings')
            let interactionId = undefined
            let isActive = true

            if(isEmpty(settings)) {
                settings = await window[api].fetch.get('/api/v1/subscription/setting', {
                    subscriptionId: route.link,
                    limit: 300,
                    offset: 0
                });

                interactionId = settings.res.body.data[Object.keys(settings.res.body.data)[0]].interactionId;

                const rule = await window[api].fetch.get('/api/v1/rule', {
                    active: true,
                    interactionId: interactionId,
                    limit: 300,
                    offset: 0
                });

                if(rule.res.ok) {
                    rule.res.body.data.forEach(item => {
                        if(!settings.res.body.data.some(data => data.headerId === item.headerId)) {
                            settings.res.body.data.push({
                                "active": true,
                                "subscriptionId": route.link,
                                "headerId": item.headerId,
                                "interactionId": item.interactionId,
                                "headerCode": item.headerCode,
                                "headerName": item.headerName,
                                "isNew": true
                            })
                        }
                    })
                }
            }

            const subscription = {
                res: {
                    ok: false
                }
            }

            let data = {};
            data.this = []
            data.subscriptionId = []
            data.group = []
            data.groupName = []
            data.interactionId = []
            data.value = []

            if (settings.res.ok) {
                const subscription = await window[api].fetch.get('/api/v1/subscription', {
                    subscriptionId: route.link,
                    limit: 12,
                    offset: 0
                });

                isActive = subscription.res.body.data[0].active

                if(!Object.hasOwnProperty('groupBy')) {
                    Object.groupBy = groupBy
                }

                settings.res.body.data = Object.groupBy(settings.res.body.data, ({ headerId }) => headerId );

                for(let group in settings.res.body.data) {
                    for (let i = 0; i < settings.res.body.data[`${group}`].length; ++i) {
                        let registryItem = [{
                            id: 'id',
                            type: 'text',
                            mapping: ['value'],
                            value: undefined,
                            group: group
                        }, {
                            id: 'header:code',
                            type: 'text',
                            mapping: ['value'],
                            value: undefined,
                            group: group
                        }, {
                            id: 'header:name',
                            type: 'text',
                            mapping: ['value'],
                            value: undefined,
                            group: group
                        }, {
                            id: 'header:value',
                            type: 'text',
                            mapping: ['value'],
                            value: -1,
                            group: group
                        }, {
                            id: 'button:delete',
                            type: 'button',
                            mapping: ['value'],
                            class: 'delete',
                            value: -1,
                            group: group,
                            description: 'Отключить',
                            isActive: false
                        }, {
                            id: 'button:restore',
                            type: 'button',
                            mapping: ['value'],
                            class: 'restore',
                            value: -1,
                            group: group,
                            description: 'Включить ',
                            isActive: false
                        }, {
                            type: 'header:button:add',
                            mapping: ['value'],
                            group: group,
                            value: [{
                                id: 'cancel',
                                value: 'Отмена'
                            }, {
                                id: 'update',
                                value: 'Обновить'
                            }, {
                                id: 'delete',
                                value: 'Отключить'
                            }]
                        }];

                        registryItem = registryItem.map((item, index) => {
                            let isFixSeconds = ''
                            let isFixMinutes = ''
                            let isFixHours = ''
                            item.headerId = settings.res.body.data[`${group}`][i].headerId
                            item.itemId =  settings.res.body.data[`${group}`][i].id
                            item.isNew = settings.res.body.data[`${group}`][i].hasOwnProperty('isNew')

                            switch (item.id) {
                            case 'id':
                                item.value = i + 1;
                                break;
                            case 'startAt':
                                let date = new Date(settings.res.body.data[`${group}`][i].startAt);
                                isFixSeconds = date.getSeconds().toString().length === 1
                                isFixMinutes = date.getMinutes().toString().length === 1
                                isFixHours = date.getHours().toString().length === 1
                                item.value = `${endAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${date.getHours()}`: date.getHours()}:${isFixMinutes? `0${date.getMinutes()}`:date.getMinutes()}:${isFixSeconds? `0${date.getSeconds()}`: date.getSeconds()}`
                                break;
                            case 'endAt':
                                let endAt = '-'
                                if(settings.res.body.data[`${group}`][i].endAt !== null) {
                                    endAt = new Date(settings.res.body.data[`${group}`][i].endAt)
                                    isFixSeconds = endAt.getSeconds().toString().length === 1
                                    isFixMinutes = endAt.getMinutes().toString().length === 1
                                    isFixHours = endAt.getHours().toString().length === 1
                                    item.value = `${endAt.toLocaleDateString('ru-RU')} \n ${isFixHours? `0${endAt.getHours()}`: endAt.getHours()}:${isFixMinutes? `0${endAt.getMinutes()}`:endAt.getMinutes()}:${isFixSeconds? `0${endAt.getSeconds()}`: endAt.getSeconds()}`
                                } else {
                                    item.value = endAt
                                }
                                break;
                            case 'recipientId:code':
                                item.value = settings.res.body.data[`${group}`][i].recipientCode;
                                break;
                            case 'recipientId:name':
                                item.value = settings.res.body.data[`${group}`][i].recipientName;
                                break;
                            case 'interactionId:code':
                                item.value = settings.res.body.data[`${group}`][i].interactionCode;
                                break;
                            case 'interactionId:name':
                                item.value = settings.res.body.data[`${group}`][i].interactionName;
                                break;
                            case 'active':
                                item.value = settings.res.body.data[`${group}`][i].active;
                                item.itemId = settings.res.body.data[`${group}`][i].id;
                                break;
                            case 'header:code':
                                item.value = settings.res.body.data[`${group}`][i].headerCode;
                                break;
                            case 'header:name':
                                item.value = settings.res.body.data[`${group}`][i].headerName;
                                break;
                            case 'header:value':
                                item.value = settings.res.body.data[`${group}`][i].value;
                                break;
                            case 'button:restore':
                               // console.log('ddddddddddddddddd', settings.res.body.data[`${group}`][i])
                                item.isActive = isActive? !settings.res.body.data[`${group}`][i].active : false
                                break
                            case 'button:delete':
                                item.isActive = isActive? settings.res.body.data[`${group}`][i].active : false
                                break
                            default:
                                break;
                            }

                            return item;
                        });

                        data.this.push(registryItem);
                        data.value.push(settings.res.body.data[`${group}`][i].value)
                        data.subscriptionId.push(settings.res.body.data[`${group}`][i].id)
                        data.interactionId.push(settings.res.body.data[`${group}`][i].interactionId)

                    }

                    data.groupName.push(settings.res.body.data[`${group}`][0].headerName)
                    data.group.push(group)
                }
            }


            const header = ['N', 'Код заголовка', 'Наименование заголовка', 'Значение', ''];
            result = {
                type: 'registry',
                to: self.dataset.to,
                id: self.dataset.id,
                title: 'Регистр',
                mapping: ['registry'],
                isActive: isActive,
                group: {
                    mapping: ['value'],
                    title: data.groupName,
                    value: data.group
                },
                registry: {
                    mapping: ['settings', 'header', 'body'],
                    header: {
                        mapping: ['value'],
                        value: [header]
                    },
                    body: {
                        mapping: ['value'],
                        value: data.this,
                        dataset: {
                            value: data.value,
                            subscriptionId: data.subscriptionId,
                            interactionId: data.interactionId
                        }
                    },
                    settings: {
                        mapping: ['value'],
                        value: [{
                            type: 'object',
                            header: {
                                property: {
                                    "title": 'grid-area: a',
                                    "mss:button": 'grid-area: b',
                                },
                                relation: {
                                    "gridTemplateColumns": '40px 184px 258px 1fr  120px',
                                    "gridTemplateAreas": "a a a a b",
                                    "gridTemplateRows": "min-content"
                                }
                            },
                            body: {
                                "gridTemplateColumns": '40px 184px 258px 1fr  120px',
                            }
                        }, {
                            type: 'header',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 184px 258px 1fr  120px'
                        }, {
                            type: 'body',
                            mapping: ['gridTemplateColumns'],
                            gridTemplateColumns: '40px 184px 258px 1fr 120px'
                        }, {
                            type: 'footer',
                            mapping: ['class'],
                            class: 'footer-empty'
                        }]
                    }
                }
            };
        }

        resolve(result);
    });
};

export const table = {
    get: {
        registry: registry,
        card: card
    },
    create: {
        card: createСard
    }
};

export default {
    description: ''
};