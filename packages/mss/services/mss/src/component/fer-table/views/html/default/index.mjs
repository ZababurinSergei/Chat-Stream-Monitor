import {store, router} from '../../../../../this/index.mjs'

let components = new Map();

let config = {
    isFirst: false,
    value: ''
};

const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

function insertAtIndex (str, substring, index) {
    const arr = str.split('');

    arr.splice(index, 0, substring);

    return arr.join('');
}

const value = (self, data, type) => {
    if (self.index === 0) {
        if (type === 'settings') {
            for (let item of data) {
                if (item.type === '*') {
                    for (let value of item.mapping) {
                        self.header.style.gridTemplateColumns = item[value];
                        self.body.style.gridTemplateColumns = item[value];
                        self.footer.style.gridTemplateColumns = item[value];
                    }
                }

                if (item.type === 'header') {
                    for (let value of item.mapping) {
                        self.header.style[value] = item[value];
                    }
                }

                if (item.type === 'body') {
                    for (let value of item.mapping) {
                        self.this.style.setProperty('--table_colums', item[value]);
                    }
                }

                if (item.type === 'footer') {
                    for (let value of item.mapping) {
                        if(value === 'class') {
                            self.footer.classList.add(item[value])
                        } else {
                            self.footer.style.gridTemplateColumns = item[value];
                        }
                    }
                }

                if (item.type === 'container') {
                    for (let value of item.mapping) {
                        self.container.style.gridTemplateAreas = item[value];
                    }
                }
            }
        }

        if (type === 'header') {
            for (let item of data) {
                for (let value of item) {
                    self.header.insertAdjacentHTML('beforeend', `
                    <div class="table_header_td ${self.type}">${value}</div>
                `);
                }
            }
        }
    }

    if (type === 'body') {
        // self.body.classList.add(self.type)
        if(!self.object.hasOwnProperty('class')) {
            self.object.class = []
        }

        self.body.className = `body ${self.type} cargo ${self.object.class.join(' ')}`;
        let result = ``;
        let count = -1;
        let checkboxCount = -1

        for (let key of data) {
            result = ''
            const isNew = key[0].isNew

            count = ++count;
            const isDefault = self.group[self.index].trim() === 'default'

            if (self.group[self.index] === key[0].group || isDefault) {
                config.value = (config.value === key[0].group) ? (config.isFirst = false, config.value) : (self.group[self.index] === 'default' ? config.isFirst = false : config.isFirst = true, config.value = key[0].group);

                let containerSettings = ''

                let configObject = {
                    header: {
                        container: '',
                        item: {}
                    },
                    body: ''
                }

                if(!isDefault) {
                    for(let key of self.object[`${self.type}`].settings.mapping) {
                        for(let obj of self.object[`${self.type}`].settings[key]) {
                            switch (obj.type) {
                            case 'header':
                                for (let key of obj.mapping) {
                                    containerSettings = containerSettings + `${camelToSnakeCase(key)}: ${obj[key]};`
                                }
                                containerSettings = `style="display:grid; ${containerSettings}"`
                                break
                            case 'body':
                                break
                            case 'object':
                                for(let key in obj.header) {
                                    switch (key) {
                                    case 'relation':
                                        for(let property in obj.header[key]) {
                                            configObject.header.container = configObject.header.container + `${camelToSnakeCase(property)}: ${property === 'gridTemplateAreas' ?`"a a a a b"` :`${obj.header[key][property]}`};`
                                        }

                                        configObject.header.container = `style="${configObject.header.container}`
                                        break
                                    case 'property':
                                        for(let property in obj.header[key]) {
                                            configObject.header.item[property] = configObject.header.item.hasOwnProperty(property) ? configObject.header.item[property]  + `${obj.header[key][property]};`: `${obj.header[key][property]};`
                                        }

                                        for(let key in configObject.header.item) {
                                            configObject.header.item[key] =`style="${configObject.header.item[key]}"`
                                        }

                                        break
                                    default:
                                        console.log('Что то ещё можно добавить')
                                        break
                                    }
                                }
                                break
                            default:
                                // console.log('Свойство которое можно добавить в объект', obj.type, obj)
                                break
                            }
                        }
                    }
                }

                /*

                 */
                result = result + `<div 
                                    class="${config.isFirst || isDefault? `${self.object.status === 'new'? `body_tr`: `${!self.isObject? 'invisible': ''} body_tr`}`: `body`} ${self.type} ${self.object.class.join(' ')} ${self.status? `${self.status}`: ``} ${self.isObject? 'object': 'array'} _${self.rights.join(' _')}"
                                    ${ (self.isObject && !config.isFirst) ? `${containerSettings}`: ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('interactionId') && self.dataset.interactionId !== undefined) ? `data-interaction-id="${self.dataset.interactionId[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('subscriptionId')) ? `data-subscription-id="${self.dataset.subscriptionId[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('directoryRecordId')) ? `data-directory-record-id="${self.dataset.directoryRecordId[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('directoryName')) ? `data-directory-name="${self.dataset.directoryName[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('recipientSystemName')) ? `data-recipient-system-name="${self.dataset.recipientSystemName[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('interactionName')) ? `data-interaction-name="${self.dataset.recipientSystemName[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('logType')) ? `data-log-type="${self.dataset.logType[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('createdAt')) ? `data-created-at="${self.dataset.createdAt[count]}"` : ''}
                                    data-header-id="${self.group[self.index]}"
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('value')) ? `data-value="${self.dataset.value[count]}"` : ''}
                                    ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('id')) ? `data-id="${self.dataset.id[count]}"` : ''}
                              >`;

                if (config.isFirst) {
                    const settingsValue = self.object.registry.settings.value.find(item => item.type === 'header')
                    result = result + `
                        <div class="header ${self.type} ${self.isObject? 'object': 'array'}" style="display:grid; grid-template-columns:${settingsValue.gridTemplateColumns} ;grid-template-areas:'a a a a b'; grid-template-rows: min-content;"> 
                            <div class="title" ${configObject.header.item.title}>${self.object.group.title[self.index]}</div>
                        </div>
                        ${!isNew ? `<div  
                                          class="body ${self.type} ${self.isObject? 'object': 'array'}"
                                          ${containerSettings}
                                          ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('interactionId') && self.dataset.interactionId !== undefined) ? `data-interaction-id="${self.dataset.interactionId[count]}"` : ''}
                                          ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('subscriptionId')) ? `data-subscription-id="${self.dataset.subscriptionId[count]}"` : ''}
                                          data-header-id="${self.group[self.index]}"
                                          ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('value')) ? `data-value="${self.dataset.value[count]}"` : ''}
                                          ${(self.hasOwnProperty('dataset') && self.dataset.hasOwnProperty('id')) ? `data-id="${self.dataset.id[count]}"` : ''}
                                    >`: '' }`;
                }

                for (let value of key) {
                    for (let data of value.mapping) {
                        if(!isNew) {
                            if (value.type === 'text:title') {
                                if (data === 'title') {
                                    result = result + `<div class="body_td ${self.type} ${value.hasOwnProperty('class') ? `${value.class}` : ''}">
                                                         <span class="${self.type} title">${value[data]}</span>
                                                         ${value.hasOwnProperty('error') ? `
                                                                <span class="${value.error.class}">${value.error.description}</span>
                                                         `: ``}
                                                         <div 
                                                            ${value.hasOwnProperty('setAttribute') ? `${value.setAttribute}` : ''}
                                                            class="value ${self.type} ${value.hasOwnProperty('class') ? `${value.class}` : ''}"
                                                         > 
                                                            ${value['value']} 
                                                         </div>
                                                         ${value.hasOwnProperty('notification') ? `
                                                                <span class="${value.notification.class}">${value.notification.description}</span>
                                                         `: ``}  
                                                       </div>`;
                                }
                            }

                            if (value.type === 'text') {
                                if(value.id === 'email') {
                                    result = result + `<div class="body_td ${self.type}"><a href="mailto:${value[data]}" class="mail ${value.hasOwnProperty('class') ? `value ${value.class}` : `value`}">${value[data]}</a></div>`;
                                } else {
                                    result = result + `<div class="body_td ${self.type}"><span class="${value.hasOwnProperty('class') ? `value ${value.class}` : `value`}">${value[data]}</span></div>`;
                                }
                            }

                            if (value.type === 'button') {
                                if(value.isActive) {
                                    result = result + `<button class="body_td button ${self.type} ${value.class} _${self.rights.join(' _')}" data-item-id="${value?.itemId?.trim()}">${value.description}</button>`;
                                }
                            }

                            if (value.type === 'checkbox' && data === 'value') {
                                checkboxCount = ++checkboxCount
                                result = result + `<checklist-checkbox
                                              data-id="checkbox_${checkboxCount}"
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                            >
                                                <template>
                                                      <ul class="container ${self.type}">
                                                        <li class="checkbox ${self.type}">
                                                            <input class="custom-checkbox" id="checkbox-${checkboxCount}" ${value.disabled ? `disabled`: ''} type="checkbox" ${value[data] ? 'checked': '' }>
                                                            <label for="checkbox-${checkboxCount}"></label>
                                                        </li>
                                                    </ul>
                                                </template>
                                            </checklist-checkbox>`;
                            }

                            if (value.type === 'text:date:start' || value.type === 'text:date:end') {
                                result = result + `<div class="body_td"><span>${value[data]}</span></div>`;
                            }

                            if (value.type === 'card:button') {
                                if (data !== 'class') {
                                    result = result + `<div class="body_td button _${self.rights.join(' _')} ${self.type} ${value.hasOwnProperty('class') ? `${value['class']}` : ''}">`;

                                    for (let item of value[data]) {
                                        result = result + `<button class="button ${self.type} ${item.id} _${self.rights.join(' _')} ${item.isActive? 'visible': 'invisible'}">${item.value}</button>`;
                                    }

                                    result = result + `</div>`;
                                }
                            }

                            if(value.type ===  'header:button:add') {
                                if (self.group[self.index] === 'default') {

                                } else {
                                    if (config.isFirst) {
                                        let buttons = '';
                                        if(self.isActive) {
                                            buttons = buttons + `<button 
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                              class="button _${self.rights.join(' _')} ${self.type} ${value.type.replaceAll(':','_')}"
                                           > 
                                               Добавить запись
                                           </button>`;
                                        }

                                        const index = result.indexOf('</div>') + '</div>'.length;
                                        const str = result;
                                        const substring = buttons;

                                        result = insertAtIndex(str, substring, index);
                                    }
                                }
                            }
                            if (value.type === 'mss:button') {
                                if (self.group[self.index] === 'default') {
                                    result = result + `<mss-button
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                              class="button -${value[data][0].id} _${self.rights.join(' _')} ${self.type} ${self.isObject? 'object': 'array'}"
                                           > 
                                                <template>
                                                <div class="container ${self.type}">
                                       
                                                <div class="icon"> 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                      <circle cx="12" cy="6" r="2" fill="#0D4CD3"/>
                                                      <circle cx="12" cy="12" r="2" fill="#0D4CD3"/>
                                                      <circle cx="12" cy="18" r="2" fill="#0D4CD3"/>
                                                    </svg>
                                                </div>  
                                                <div class="menu">
                                                    <div class="icon close">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.9396 11.9998L4.99854 17.9409L6.05919 19.0016L12.0003 13.0605L17.9413 19.0016L19.002 17.9409L13.0609 11.9998L19.002 6.05871L17.9413 4.99805L12.0003 10.9391L6.05921 4.99805L4.99855 6.05871L10.9396 11.9998Z" fill="#0D4CD3"/>
                                                        </svg>
                                                    </div>
`;

                                    for (let item of value[data]) {
                                        result = result + `<button class="button _${self.rights.join(' _')} ${item.id}">${item.value}</button>`;
                                    }

                                    result = result + `</div></div></template> </mss-button>`;
                                } else {
                                    if (config.isFirst) {
                                        let buttons = '';
                                        buttons = buttons + `<mss-button 
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                              class="button _${self.rights.join(' _')} ${self.type}"
                                           > 
                                                <template>
                                                <div class="container ${self.type}">
                                                <div class="icon"> 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                      <circle cx="12" cy="6" r="2" fill="#0D4CD3"/>
                                                      <circle cx="12" cy="12" r="2" fill="#0D4CD3"/>
                                                      <circle cx="12" cy="18" r="2" fill="#0D4CD3"/>
                                                    </svg>
                                                </div>  
                                                <div class="menu">`;

                                        for (let item of value[data]) {
                                            buttons = buttons + `<button class="button _${self.rights.join(' _')} ${item.id}">${item.value}</button>`;
                                        }

                                        buttons = buttons + `</div></div></template> </mss-button>`;

                                        const index = result.indexOf('</div>') + '</div>'.length;
                                        const str = result;
                                        const substring = buttons;

                                        result = insertAtIndex(str, substring, index);
                                    }
                                }
                            }
                        } else {
                            if(value.type ===  'header:button:add') {
                                if (self.group[self.index] === 'default') {

                                } else {
                                    if (config.isFirst) {
                                        let buttons = '';
                                        if(self.isActive) {
                                            buttons = buttons + `<button 
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                              class="button _${self.rights.join(' _')} ${self.type} ${value.type.replaceAll(':','_')}"
                                           > 
                                               Добавить запись
                                           </button>`;
                                        }


                                        const index = result.indexOf('</div>') + '</div>'.length;
                                        const str = result;
                                        const substring = buttons;

                                        result = insertAtIndex(str, substring, index);
                                    }
                                }
                            }
                        }
                    }
                }

                if (config.isFirst || isDefault) {
                    result = result + `</div></div>`;
                    if(self.type === 'card') {
                        if(self.status) {
                            self.body.insertAdjacentHTML('afterbegin', result);
                        } else {
                            self.body.insertAdjacentHTML('beforeend', result);
                        }
                    } else {
                        self.body.insertAdjacentHTML('beforeend', result);
                    }
                } else {
                    result = result + `</div>`;
                    const bodyTr = self.body.querySelectorAll('.body_tr.registry.object')
                    bodyTr[self.index].insertAdjacentHTML('beforeend', result);
                }
            }
        }
    }

    if (type === 'footer') {

    }
};

components.set('registry', [{
    type: 'registry',
    template: async (self, object, pathname) => {
        const section = store.get('section')
        let header = self.shadowRoot.querySelector('.header');
        let body = self.shadowRoot.querySelector('.body');
        let footer = self.shadowRoot.querySelector('.footer');
        let container = self.shadowRoot.querySelector('.table');
        const route = await router(self, { location })

        header.innerHTML = '';
        body.innerHTML = '';
        // footer.innerHTML = '';
        config = {
            isFirst: false,
            value: ''
        };

        let group = 'default';
        if (object.hasOwnProperty('mapping')) {
            if (!object.hasOwnProperty('group')) {
                object.group = [{
                    mapping: ['value'],
                    title: 'Настройка',
                    value: ['default']
                }];
            }

            for (let g = 0; g < object.group.value.length; ++g) {
                for (let i of object.mapping) {
                    for (let j of object[i].mapping) {
                        for (let k of object[i][j].mapping) {
                            // console.log(`g ${g} :`, object.group.value[g], ': ', 'i: ', i, 'j:', j, 'k', k, object[i][j]);
                            value({
                                rights: route.rights,
                                this: self,
                                index: g,
                                object: object,
                                type: object.type,
                                status: object.status ? object.status : false,
                                header: header,
                                body: body,
                                footer: footer,
                                container: container,
                                section: section,
                                dataset: object[i][j].hasOwnProperty('dataset') ? object[i][j].dataset : false,
                                group: object.group.value,
                                groupTitle: object.group.title[g],
                                isActive: object.hasOwnProperty('isActive') ? object.isActive : true,
                                isObject: object.group.value[0] !== 'default'
                            }, object[i][j][k], j);
                        }
                    }
                }
            }
        }

        return true;
    }
}]);

components.set('card', [{
    type: 'card',
    template: async (self, object, pathname, isReset = true) => {
        const section = store.get('section')
        let header = self.shadowRoot.querySelector('.header');
        let body = self.shadowRoot.querySelector('.body');
        let footer = self.shadowRoot.querySelector('.footer');
        let container = self.shadowRoot.querySelector('.table');
        const route = await router(self, { location })

        if (isReset) {
            header.innerHTML = '';
            body.innerHTML = '';
            // footer.innerHTML = '';
            config = {
                isFirst: false,
                value: ''
            };
        }

        if (object.hasOwnProperty('mapping')) {
            if (!object.hasOwnProperty('group')) {
                object.group = [{
                    mapping: ['value'],
                    title: 'Настройка',
                    value: ['default']
                }];
            }

            for (let g = 0; g < object.group.value.length; ++g) {
                for (let i of object.mapping) {
                    for (let j of object[i].mapping) {
                        for (let k of object[i][j].mapping) {
                            // console.log(`g ${g} :`, object.group.value[g], ': ', 'i: ', i, 'j:', j, 'k', k, object[i][j]);
                            value({
                                rights: route.rights,
                                this: self,
                                index: g,
                                object: object,
                                type: object.type,
                                status: object.status ? object.status : false,
                                header: header,
                                body: body,
                                footer: footer,
                                container: container,
                                section: section,
                                dataset: object[i][j].hasOwnProperty('dataset') ? object[i][j].dataset : false,
                                group: object.group.value,
                                groupTitle: object.group.title[g],
                                isObject: object.group.value[0] !== 'default',
                                isActive: object.hasOwnProperty('isActive') ? object.isActive : true
                            }, object[i][j][k], j);
                        }
                    }
                }
            }
        }
        return true;
    }
}]);
export default components;