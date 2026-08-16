export const divElement = class extends HTMLDivElement {
    static get observedAttributes() {
        return ["open", "disabled"];
    }

    _isOnload = false;

    dialog = {
        error: async function (url, value) {
            dialogInit.call(this, {
                type: 'error',
                title: 'Ошибка',
                description: [{
                    text: url
                }, {
                    text: value
                }],
                button: [{
                    type: 'reset',
                    description: 'Закрыть'
                }]
            })
        },
        open: async function (value) {
            if (typeof value === 'string') {
                dialogInit.call(this, {
                    type: 'success',
                    title: '',
                    description: [{
                        text: value
                    }],
                    button: [{
                        type: 'success',
                        description: 'Хорошо'
                    }]
                })
            } else {
                dialogInit.call(this, value)
            }
        },
        close: async function () {
            dialogInit.call(this, {}, 'terminate')
        }
    }

    get config() {
        return config;
    }

    set config(value) {
        for (let key in value) {
            config[key] = value[key];
        }
        return true;
    }

    get store() {
        return store;
    }

    execute = function () {
        return new Promise((resolve, reject) => {
            const call = []
            let count = 0
            for (let item of task) {
                const components = this.store[`${item.component}`]
                if (components) {
                    for (let component of components) {
                        if (component.id === item.id) {
                            const bindOnMessage = item.hasOwnProperty('execute') ? item.execute.bind(this) : this.onMessage.bind(this);
                            call.push({
                                execute: bindOnMessage,
                                self: component.self,
                                detail: item.detail
                            })

                            task.splice(count, 1);
                        }
                    }

                }
                count++
            }
            call.forEach(item => item.execute(item.self, item.detail))
            resolve(true)
        })
    };

    task = async function (value) {
        task.push(Object.assign(value, {
            tagName: this.tagName.toLowerCase(),
            // uuid: this.dataset.uuid,
            type: ('type' in value) ? value.type : 'self'
        }));

        await this.execute();
    }

    get task() {
        return task
    }

    component = function(value) {
        return new Promise(async (resolve,reject) => {
            task.push(Object.assign(value, {
                tagName: this.tagName.toLowerCase(),
                // uuid: this.dataset.uuid,
                type: ('type' in value) ? value.type : 'self',
                execute: function (self) {
                    resolve(self)
                }
            }));

            await this.execute();
        })
    }

    set disabled(val) {
        if (val) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    get disabled() {
        return this.hasAttribute('disabled');
    }

    set open(val) {
        if (val) {
            this.setAttribute('open', '');
        } else {
            this.removeAttribute('open');
        }
    }

    get open() {
        return this.hasAttribute('open');
    }

    constructor() {
        super();
        this.dataset.servicesPath = servicePath.pathname;
        this.config = config;
        this.task = this.task.bind(this)
        this.component = this.component.bind(this)

        init(this).then(() => {
            this._isOnload = true;
        }).catch(error => console.warn('error', error));
    }

    connectedCallback() {
        if (this.dataset?.servicesPath) {
            htmlOnLoad(this)
                .then(async (self) => {

                    if ('connected' in self) {
                        await self.connected()
                    }

                    if(self?.DOM) {
                        for(let key in self.DOM) {
                            if(typeof self.DOM[key] === 'function') {
                                self.DOM[key] = this.DOM[key].bind(this)
                            }
                        }
                    }

                    const name = self.tagName.toLowerCase();

                    if (!store.hasOwnProperty(name)) {
                        store[name] = []
                    }

                    store[name].push({
                        id: self.id,
                        // uuid: self.dataset.uuid,
                        self: self,
                        dataset: self.dataset
                    });

                    this.execute()

                    if (this.onload) {
                        this.onload.call(this, this)
                    }
                })
                .catch(e => console.error('error', e));
        }
    }

    disconnectedCallback() {
        if ('disconnected' in this) {
            this.disconnected().then().catch(e => console.error(e))
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ('attributeChanged' in this && newValue) {
            this.attribute({
                name: name,
                oldValue: oldValue,
                newValue: newValue
            });
        }
    }

    adoptedCallback() {
        if ('adopted' in this) {
            this.adopted({
                name: name
            });
        }
    }
};
