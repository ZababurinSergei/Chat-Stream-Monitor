const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

let components = new Map();

components.set('remove', [{
    template: (pathname   = undefined, obj) => {
        let buttons = ''
        if (obj.button) {
            for (let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>`
            }
        }
        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
<!--            <div class="close">-->
<!--              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">-->
<!--                <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>-->
<!--              </svg>-->
<!--            </div>-->
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="body">
           ${obj.description}
        </div>
        <footer>
          ${buttons}
        </footer>
    `}
}])

components.set('error', [{
    template: async (pathname = undefined, obj) => {
        let selects = ''
        let inputs = ''
        let buttons = ''
        let descriptions = ''

        if (obj.description) {
            for (let description of obj.description) {
                descriptions = descriptions + `<p>${description?.text.trim()} </p>`
            }
        }

        if (obj.select) {
            for (let select of obj.select) {
                let options = ''

                for (let i = 0; i < select.options.length; ++i) {
                    options = options + `<li class="dropdown__list-item" data-value="${select.options[i].slug}">${select.options[i].slug}</li>`
                }

                selects = selects + `
                <fer-select
                    data-value = ${select.options[0].slug} 
                    data-services-path=${select['data-services-path']}
                >
                    <template>
                     <div class="dropdown">
                            <div class="dropdown__wrapper">
                                <div class="dropdown_input">
                                  <label class="fer-titile">${select.title}</label>
                                  <button class="dropdown__button" type="button">${select.options[0].slug}</button>
                                </div>
                                <div class="dropdown__button_arrow">
                               
                                </div>
                            </div>
                            <ul class="dropdown__list">
                              ${options}
                            </ul>
                            <input class="dropdown__input_hidden" type="text" name="select-category" value="${select.options[0].slug}"/>
                        </div>
                    </template>
                </fer-select>
            `
            }
        }

        if (obj.input) {
            for (let input of obj.input) {
                inputs = inputs + `
                <div class="input">
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input ${input.type === 'number' ? 'type="number"' : 'text'} ${input.min ? `min="${input.min}"` : ''} id="${input.id}" placeholder="${input.placeholder}">
                    ${input.validation ? `<p class="validation">${input.validation}</p>` : ''}
                </div>
            `
            }
        }

        if (obj.button) {
            for (let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `
            }
        }

        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
        </header>
        <div class="body">
          ${descriptions}
          ${selects}
          ${inputs}
        </div>
        <footer>
           ${buttons}
        </footer>
    `
    }
}])


components.set('success', [{
    template: async (pathname = undefined, obj) => {
        let selects = ''
        let inputs = ''
        let buttons = ''
        let descriptions = ''

        if (obj.description) {
            for (let description of obj.description) {
                descriptions = descriptions + `<p>${description?.text.trim()} </p>`
            }
        }

        if (obj.button) {
            for (let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `
            }
        }


        return `
         <header style="display: none">
            <p class="title">
                ${obj.title}
            </p>
        </header>
        <div class="body success">
          ${descriptions}
        </div>
        <footer>
           ${buttons}
        </footer>
    `
    }
}])

components.set('add', [{
    template: (pathname = undefined, obj) => {
        let selects = ''
        let inputs = ''
        let buttons = ''
        if (obj.select) {
            for (let select of obj.select) {
                let options = ''
                let data = ''
                let snapshotId = ''

                if(obj.id === '2_0') {
                    data = select.options[0]
                    snapshotId = select.dataset.snapshotId[0]
                } else {
                    console.warn('был obj.id add_rules переименовал на 2_0', obj)
                }

                for (let i = 0; i < select.options.length; ++i) {
                    if (obj.id === '2_0') {
                        options = options +`<li 
                                                class="dropdown__list-item" 
                                                data-value="${select.options[i]}"
                                                data-snapshot-id="${select.dataset.snapshotId[i]}"
                                            >${select.options[i]}</li>`
                    } else {
                        console.warn('был obj.id add_rules переименовал на 2_0', obj)
                    }
                }

                selects = selects + `
                <fer-select
                    data-value="${data}"     
                    data-snapshot-id="${snapshotId}"
                    data-services-path=${select['data-services-path']}
                >
                    <template>
                        <div class="dropdown">
                            <div class="dropdown__wrapper">
                                <div class="dropdown_input">
                                  <label class="fer-titile">${select.title}</label>
                                  <button class="dropdown__button" type="button">${data}</button>
                                </div>
                                <div class="dropdown__button_arrow"></div>
                            </div>
                            <ul class="dropdown__list">
                              ${options}
                            </ul>
                            <input class="dropdown__input_hidden" type="text" name="select-category" value="${data}"/>
                        </div>
                    </template>
                </fer-select>
            `
            }
        }

        if (obj.input) {
            for (let input of obj.input) {
                inputs = inputs + `
                <div class="input">
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input ${input.type === 'number' ? 'type="number"' : 'text'} ${input.min ? `min="${input.min}"` : ''} id="${input.id}" placeholder="${input.placeholder}">
                    ${input.validation ? `<p class="validation">${input.validation}</p>` : ''}
                </div>
            `
            }
        }

        if (obj.button) {
            for(let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `}
        }

        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
                <div class="close">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>
                  </svg>
                </div>
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="content body">
          ${selects}
          ${inputs}
        </div>
        <footer>
           ${buttons}
        </footer>
    `}
}])

components.set('create', [{
    template: (pathname = undefined, obj) => {
        let selects = ''
        let inputs = ''
        let buttons = ''

        const isMapping = obj.hasOwnProperty('mapping')

        let dataBody = ''

        if (obj.button) {
            for(let button of obj.button) {
                if(button.id === 'after') {
                    buttons = buttons + `
                    <div  data-field="${button.type}"  class="footer-button ${button.type}">
                        <p>${button.description}</p>
                    </div>`
                }
            }
        }

        if(isMapping) {
            for(let type of obj.mapping) {
                let isSelect = false
                let isInput = false
                let isCheckbox = false
                let isButton = false
                let isDatapicker = false

                let index = 0
                let indexInput = 0
                let indexCheckbox = 0
                let indexDatapicker = 0
                let indexButton = 0

                if (obj.input) {
                    isInput = obj.input.some((item, i) => (indexInput = i, item.id === type))
                }

                if(obj.select) {
                    isSelect = obj.select.some((item, i) => {
                        index = i
                        return item.id === type
                    })
                }

                if(obj.checkbox) {
                    isCheckbox = obj.checkbox.some((item, i) => (indexCheckbox = i, item.id === type))
                }

                if(obj.datapicker) {
                    isDatapicker = obj.datapicker.some((item, i) => (indexDatapicker = i, item.id === type))
                }

                if(obj.button) {
                    isButton = obj.button.some((item, i) => (indexButton = i, item.id === type))
                }

                if(isInput) {
                    const input = obj.input[indexInput]
                    if(input.type === 'text_info') {
                        dataBody = dataBody + `
                        <div class="input ${input.type}">
                        <label class="titile ${input.type}" for="${input.id}">${input.title}</label>
                          <input 
                            ${input.isReadonly ? 'readonly': ''}
                            type="text" 
                            ${input.min ? `min="${input.min}"` : ''} 
                            id="${input.id}" 
                            value="${input.value}"
                          >
                        </div>`
                    }

                    if(input.type === 'text') {
                        dataBody = dataBody + `
                        <div class="input">
                          <label class="fer-titile" for="${input.id}">${input.title}</label>
                          <input 
                            ${input.type === 'number' ? 'type="number"' : 'text'} 
                            ${input.min ? `min="${input.min}"` : ''} 
                            id="${input.id}" 
                            placeholder="${input.placeholder}"
                            value=${input.value ? `${input.value}`: ''}
                          >
                              ${input.validation ? `<p class="validation">${input.validation}</p>` : ''}
                        </div>`
                    }
                    // code.setAttribute('contenteditable', '');
                    // name.setAttribute('contenteditable', '');
                    if(input.type === 'text:mss') {
                        dataBody = dataBody + `
                        <div class="text body_td">
                            <h2 class="input_header">${input.title}</h2>
                             ${input.hasOwnProperty('error') ? `
                                <div class="${input.error.class}">${input.error.description}</div>
                             `: ``}
                            <div 
                                data-field="${input.field}"
                                ${input.isReadonly || !input.hasOwnProperty('isReadonly')? '': 'contenteditable="plaintext-only"'}
                                class="input_body"
                            >${input.value ? input.value.trim(): ''}</div>
                            <footer class="input_footer">${input.notification ? input.notification: ''}</footer>
                        </div>`
                    }
                }

                if(isSelect) {
                    let options = ''


                    const select = obj.select[index]
                    let data = select.options[0]

                    if (select.active.value) {
                        data = select.options[select.active.value]
                    }

                    for (let i = 0; i < select.options.length; ++i) {
                        if (select.dataset) {
                            options = options + '<li class="dropdown__list-item"'
                            let dataset = ''
                            for (let key in select.dataset) {
                                dataset = dataset + `data-${camelToSnakeCase(key)}="${select.dataset[key][i]}"`
                            }
                            options = options + dataset + '>' + select.options[i] + "</li>"
                        } else {
                            options = options + `<li class="dropdown__list-item" data-value="${select.options[i]}">${select.options[i]}</li>`
                        }
                    }
                    // ${isInteractionId ? `data-interaction-id=${select.dataset.interactionId[0]}` : ''}
                    // ${isRecipientId ? `data-recipient-id=${select.dataset.recipientId[0]}` : ''}
                    const isInteractionId = select.id === "interaction" && select.dataset.hasOwnProperty('interactionId')
                    const isRecipientId = select.id === "recipient" && select.dataset.hasOwnProperty('recipientId')
                    const isHeaderId = select.id === "header" && select.dataset.hasOwnProperty('headerId')


                    dataBody = dataBody + `
                        <div class="select ${select.id}">
                            <header class="select_header ${select.id}">${select.title}</header>
                            <div class="body ${select.id}">
                            <fer-select
                                ${isInteractionId ? `${select.active.status ? `data-interaction-id=${select.active.value}`: `data-interaction-id=null`}` : ''}
                                ${isRecipientId ? `data-recipient-id=null` : ''}
                                ${isHeaderId ? `data-header-id=${select.dataset.headerId[0]}` : ''}
                                id="${select.id}"
                                data-value = "null" 
                                data-services-path=${select['data-services-path']}
                                data-css-shadow=${select['data-css-shadow']}
                            >
                            <template>
                                <div class="dropdown">
                                    <div class="dropdown__wrapper">
                                        <div class="dropdown_input">
                                          <button placeholder="${select.active.status?`${select.active.title}`: `` }"  class="dropdown__button" type="button"></button>
                                        </div>
                                        <div class="dropdown__button_arrow">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.99994 8.93934L11.4696 5.46967L12.5303 6.53033L8.53027 10.5303C8.23738 10.8232 7.76251 10.8232 7.46961 10.5303L3.46961 6.53033L4.53027 5.46967L7.99994 8.93934Z" fill="#0D4CD3"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <ul class="dropdown__list">
                                        ${options}
                                    </ul>
                                </div>
                            </template>
                        </fer-select>
                        </div>
                        <footer class="select_footer">${select.notification}</footer>
                    </div>`
                }

                if (isCheckbox) {
                    const checkbox = obj.checkbox[indexCheckbox]

                    dataBody = dataBody + `<checklist-checkbox
                                              data-id="checkbox_6"
                                              data-services-path="mss"
                                              data-css-shadow="mss"
                                            >
                                                <template>
                                                    <ul class="container">
                                                        <li class="checkbox ${self.type}">
                                                            <input class="custom-checkbox" id="checkbox" type="checkbox" value="${checkbox.value}">
                                                            <label for="checkbox">${checkbox.title}</label>
                                                        </li>
                                                    </ul>
                                                </template>
                                            </checklist-checkbox>`
                }

                if (isDatapicker) {
                    const datapicker = obj.datapicker[indexDatapicker]

                    let datapickerString = `<div class="container datapicker"><div class="info datapicker"></div> <div class="block datapicker">`

                    if (datapicker.hasOwnProperty('end')) {
                        datapickerString = datapickerString + `
                        <div class="datapicker">
                            <h2> ${datapicker.value} </h2>
                            <mss-datapicker
                             data-type="start"
                             data-dialog="${datapicker.dialog}"
                             data-services-path="mss"
                             data-css-shadow="mss"
                             data-start-at="${datapicker.hasOwnProperty('time') ? `${datapicker.time.startAt}`: '-'}"
                             data-end-at="${datapicker.hasOwnProperty('time') ? `${datapicker.time.endAt}`: '-'}"
                            >
                                <template>
                                    <div class="datapicker">
                                        <input readonly class="input">
                                        <div class="container"></div>
                                        <div class="icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M17 1.94824C17 1.53403 16.6642 1.19824 16.25 1.19824C15.8358 1.19824 15.5 1.53403 15.5 1.94824V3.00023L8.5 3.00023V1.94824C8.5 1.53403 8.16421 1.19824 7.75 1.19824C7.33579 1.19824 7 1.53403 7 1.94824V3.00023H6C4.34315 3.00023 3 4.34337 3 6.00023V18.0002C3 19.6571 4.34315 21.0002 6 21.0002H18C19.6569 21.0002 21 19.6571 21 18.0002V6.00023C21 4.34337 19.6569 3.00023 18 3.00023H17V1.94824ZM7 5.44824V4.50023H6C5.17157 4.50023 4.5 5.1718 4.5 6.00023V8.01584L19.5 8.01584V6.00023C19.5 5.1718 18.8284 4.50023 18 4.50023H17V5.44824C17 5.86246 16.6642 6.19824 16.25 6.19824C15.8358 6.19824 15.5 5.86246 15.5 5.44824V4.50023L8.5 4.50023V5.44824C8.5 5.86246 8.16421 6.19824 7.75 6.19824C7.33579 6.19824 7 5.86246 7 5.44824ZM19.5 9.51584L4.5 9.51584L4.5 18.0002C4.5 18.8287 5.17157 19.5002 6 19.5002H18C18.8284 19.5002 19.5 18.8287 19.5 18.0002V9.51584Z" fill="#0D4CD3"/>
                                            </svg>
                                        </div>
                                    </div>
                                </template>
                            </mss-datapicker>
                        </div>
                        <div class="datapicker">
                            <h2> ${datapicker.end.value} </h2>
                            <mss-datapicker
                             data-type="end"
                             data-dialog="${datapicker.end.dialog}"
                             data-services-path="mss"
                             data-css-shadow="mss"
                             data-start-at="${datapicker.end.hasOwnProperty('time') ? `${datapicker.end.time.startAt}`: '-'}"
                             data-end-at="${datapicker.end.hasOwnProperty('time') ? `${datapicker.end.time.endAt}`: '-'}"
                            >
                                <template>
                                <div class="datapicker">
                                    <input readonly class="input">
                                    <div class="container"></div>
                                    <div class="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M17 1.94824C17 1.53403 16.6642 1.19824 16.25 1.19824C15.8358 1.19824 15.5 1.53403 15.5 1.94824V3.00023L8.5 3.00023V1.94824C8.5 1.53403 8.16421 1.19824 7.75 1.19824C7.33579 1.19824 7 1.53403 7 1.94824V3.00023H6C4.34315 3.00023 3 4.34337 3 6.00023V18.0002C3 19.6571 4.34315 21.0002 6 21.0002H18C19.6569 21.0002 21 19.6571 21 18.0002V6.00023C21 4.34337 19.6569 3.00023 18 3.00023H17V1.94824ZM7 5.44824V4.50023H6C5.17157 4.50023 4.5 5.1718 4.5 6.00023V8.01584L19.5 8.01584V6.00023C19.5 5.1718 18.8284 4.50023 18 4.50023H17V5.44824C17 5.86246 16.6642 6.19824 16.25 6.19824C15.8358 6.19824 15.5 5.86246 15.5 5.44824V4.50023L8.5 4.50023V5.44824C8.5 5.86246 8.16421 6.19824 7.75 6.19824C7.33579 6.19824 7 5.86246 7 5.44824ZM19.5 9.51584L4.5 9.51584L4.5 18.0002C4.5 18.8287 5.17157 19.5002 6 19.5002H18C18.8284 19.5002 19.5 18.8287 19.5 18.0002V9.51584Z" fill="#0D4CD3"/>
                                        </svg>
                                    </div>
                                </div>
                                </template>
                            </mss-datapicker>
                        </div>
`
                    }

                    datapickerString = datapickerString + `</div></div>`
                    dataBody = dataBody + datapickerString
                }

                if(isButton) {
                    const button = obj.button[indexButton]

                    dataBody = dataBody +  `
                        <div class="button ${button.id} ${button.type}">
                            <p>${button.description}</p>
                        </div>`
                }
            }

            return `
                <header>
                    <p class="title">
                        ${obj.title}
                    </p>
                </header>
                    <div 
                      class="container body"
                      data-field="${obj.type}"
                    >
                      ${dataBody} 
                    </div>
                    <div class="after">
                      ${buttons}
                    </div>
                <footer>
                    При нажатии на кнопку Отмена данные не будут сохранены и информация будет потеряна 
                </footer>`
        } else {
            console.error('Должно быть свойство mapping:', obj)
        }
    }
}])
components.set('update_s', components.get('create'))

components.set('save', [{
    template: (pathname   = undefined, obj) => {
        let inputs = ''
        let buttons = ''
        let text = ''
        if(obj.input) {
            for(let input of obj.input) {
                inputs = inputs + `
                <div class="input">
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input id="${input.id}" placeholder="${input.placeholder}">
                    ${input.validation ? `<p class="validation">${input.validation}</p>`: ''}
                </div>
            `}
        }

        if(obj.button) {
            for(let button of obj.button) {
                buttons = buttons + `
             <div data-field="${button.type}" class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `}
        }

        if(obj.text) {
            text = obj.text
        }

        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
            <div class="close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>
              </svg>
            </div>
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="body">
              ${text}
              ${inputs}
        </div>
        <footer>
              ${buttons}
        </footer>
    `}
}])

components.set('update', [{
    template: (pathname   = undefined, obj) => {
        let selects = ''
        let inputs = ''
        let buttons = ''
        let errorId = ''

        if(obj.select) {
            for(let select of obj.select) {
                let options = ''

                for(let i = 0; i < select.options.length;++i) {
                    options = options + `<li class="dropdown__list-item" data-value="${select.options[i].slug}">${select.options[i].slug}</li>`
                }

                selects = selects + `
                <fer-select
                    data-value = ${select.options[0].slug} 
                    data-services-path=${select['data-services-path']}
                >
                <div class="dropdown">
                        <div class="dropdown__wrapper">
                            <div class="dropdown_input">
                              <label class="fer-titile">${select.title}</label>
                              <button class="dropdown__button" type="button">${select.options[0].slug}</button>
                            </div>
                            <div class="dropdown__button_arrow"></div>
                        </div>
                        <ul class="dropdown__list">
                          ${options}
                        </ul>
                        <input class="dropdown__input_hidden" type="text" name="select-category" value="${select.options[0].slug}"/>
                    </div>
                </fer-select>
            `}
        }

        if(obj.input) {
            for(let input of obj.input) {
                inputs = inputs + `
                <div class="input" ${input.disabled ? 'disabled' : ''}>
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input 
                        ${input.disabled ? 'disabled' : ''} 
                        ${input.type === 'number' ? 'type="number"' : 'text'} 
                        ${input.min ? `min="${input.min}"` : ''}
                        ${input.value ? `value="${input.value}"` : 'value=""'} 
                        id="${input.id}" 
                        placeholder="${input.placeholder}"
                    >
                    ${input.validation ? `<p class="validation">${input.validation}</p>` : ''}
                </div>
            `}
        }

        if(obj.button) {
            for(let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `}
        }

        if(obj.hasOwnProperty('dataset')) {

            if( obj.dataset.hasOwnProperty('errorId')) {
                errorId = obj.dataset.errorId
            }
        }


        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
            <div class="close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>
              </svg>
            </div>
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="body">
              ${inputs}
        </div>
        <footer>
              ${buttons}
        </footer>
    `}
}])


components.set('verification', [{
    template: (pathname   = undefined, obj) => {
        let inputs = ''
        let buttons = ''
        let text = ''
        let isCode = false

        if(obj.text) {
            text = obj.text
        }

        if(obj.code) {
            text = obj.code
            isCode = true
        }

        if(obj.input) {
            for(let input of obj.input) {
                inputs = inputs + `
                <div class="input">
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input id="${input.id}" placeholder="${input.placeholder}">
                    ${input.validation ? `<p class="validation">${input.validation}</p>`: ''}
                </div>
            `}
        }

        if(obj.button) {
            for(let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `}
        }

        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
            <div class="close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>
              </svg>
            </div>
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="body">
          ${isCode ? `<pre>${text}</pre>`: `${text}`}
               
              ${inputs}
        </div>
        <footer>
              ${buttons}
        </footer>
    `}
}])


components.set('apply', [{
    template: (pathname   = undefined, obj) => {
        let inputs = ''
        let buttons = ''
        let text = ''

        if(obj.text) {
            text = obj.text
        }

        if(obj.input) {
            for(let input of obj.input) {
                inputs = inputs + `
                <div class="input">
                    <label class="fer-titile" for="${input.id}">${input.title}</label>
                    <input id="${input.id}" placeholder="${input.placeholder}">
                    ${input.validation ? `<p class="validation">${input.validation}</p>`: ''}
                </div>
            `}
        }

        if(obj.button) {
            for(let button of obj.button) {
                buttons = buttons + `
             <div  data-field="${button.type}"  class="footer-button ${button.type}">
                <p>${button.description}</p>
            </div>
            `}
        }

        return `
         <header>
            <p class="title">
                ${obj.title}
            </p>
            <div class="close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13.4086 11.9991L17.7044 7.71268C17.8925 7.52453 17.9982 7.26935 17.9982 7.00326C17.9982 6.73718 17.8925 6.482 17.7044 6.29385C17.5163 6.1057 17.2612 6 16.9951 6C16.7291 6 16.4739 6.1057 16.2858 6.29385L11.9999 10.5903L7.71408 6.29385C7.52596 6.1057 7.27081 6 7.00477 6C6.73872 6 6.48357 6.1057 6.29545 6.29385C6.10733 6.482 6.00164 6.73718 6.00164 7.00326C6.00164 7.26935 6.10733 7.52453 6.29545 7.71268L10.5913 11.9991L6.29545 16.2856C6.20181 16.3785 6.12749 16.489 6.07677 16.6108C6.02605 16.7325 5.99994 16.8631 5.99994 16.995C5.99994 17.1269 6.02605 17.2575 6.07677 17.3793C6.12749 17.501 6.20181 17.6116 6.29545 17.7044C6.38832 17.7981 6.49882 17.8724 6.62056 17.9232C6.7423 17.9739 6.87288 18 7.00477 18C7.13665 18 7.26723 17.9739 7.38897 17.9232C7.51071 17.8724 7.62121 17.7981 7.71408 17.7044L11.9999 13.408L16.2858 17.7044C16.3787 17.7981 16.4892 17.8724 16.6109 17.9232C16.7326 17.9739 16.8632 18 16.9951 18C17.127 18 17.2576 17.9739 17.3793 17.9232C17.5011 17.8724 17.6116 17.7981 17.7044 17.7044C17.7981 17.6116 17.8724 17.501 17.9231 17.3793C17.9738 17.2575 17.9999 17.1269 17.9999 16.995C17.9999 16.8631 17.9738 16.7325 17.9231 16.6108C17.8724 16.489 17.7981 16.3785 17.7044 16.2856L13.4086 11.9991Z" fill="#6E8FB0"/>
              </svg>
            </div>
<!--            <div class="header-close"><img src="${pathname ? pathname : '.'}/this/icons/close_2.svg"/></div>-->
        </header>
        <div class="body">
               ${text}
              ${inputs}
        </div>
        <footer>
              ${buttons}
        </footer>
    `}
}])

export default components