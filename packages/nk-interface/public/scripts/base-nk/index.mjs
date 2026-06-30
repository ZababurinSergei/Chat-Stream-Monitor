import { init, htmlOnLoad } from './this/index.mjs';
import { dialogThis } from './this/index.mjs';
import { logger } from '@libp2p/logger';
import { i18next, LanguageDetector } from 'i18next';
import { resources } from 'i18next/options';
import { LoadTracker } from './this/loadTracker.mjs';

i18next.use(LanguageDetector).init({
  detection: {
    caches: [],
    order: ['htmlTag', 'querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'path', 'subdomain'],
  },
  ns: ['https', 'http'],
  load: 'all',
  supportedLngs: ['dev','en', 'ru'],
  debug: false,
  resources,
  initImmediate: false,
  defaultNS: 'http',
});

const log = logger('base-nk:store');
const servicePath = new URL('../', import.meta.url);
import { divElement, liElement } from './extends/index.mjs';

let key = undefined;
let firstValue = undefined;
export const store = new Proxy({}, {
  get (target, prop) {
    return target[prop];
  },
  set (target, prop, value) {
    if (!key) {
      key = prop;
    } else {
      if (!firstValue) {
        window.globalThis.rootComponent = target[key][0].self;
        document.dispatchEvent(new CustomEvent('first-component', {
          detail: {
            obj: target[key][0],
          },
        }));
        firstValue = target[key][0];
      }
    }

    log('prop:', prop, 'value', value, target);
    target[prop] = value;
    return true;
  },
});

export const virtualDom = {
  root: {
    id: 'react',
    children: {},
  },
};

export const config = {};
export const task = [];

const dialogInit = async function (value, type) {
  if (type === 'terminate') {
    const dialog = document.querySelector('dialog');
    if (!dialog) {return;}

    const cleanUpListeners = (element, event, handler) => {
      element?.removeEventListener?.(event, handler);
    };

    cleanUpListeners(dialogThis.config.schema, 'input', dialogThis.actions.schema);
    cleanUpListeners(dialogThis.config.save, 'click', dialogThis.actions.save);
    cleanUpListeners(dialogThis.config.update, 'click', dialogThis.actions.update);
    cleanUpListeners(dialogThis.config.reset, 'click', dialogThis.actions.reset);
    cleanUpListeners(dialogThis.config.next, 'click', dialogThis.actions.next);
    cleanUpListeners(dialogThis.config.cancel, 'click', dialogThis.actions.close);
    cleanUpListeners(dialogThis.config.success, 'click', dialogThis.actions.success);
    cleanUpListeners(dialogThis.config.remove, 'click', dialogThis.actions.remove);
    cleanUpListeners(dialogThis.config.close, 'click', dialogThis.actions.close);

    dialog.close();
    dialog.remove();
    return;
  }

  if (!value) {return;}

  const dialog = document.createElement('dialog');
  const content = document.createElement('div');
  content.className = 'content';
  dialog.appendChild(content);

  if (value.hasOwnProperty('dataset')) {
    for (const key in value.dataset) {
      dialog.dataset[key] = value.dataset[key];
    }
  }

  const pathname = servicePath.pathname;
  const data = await dialogThis.template.get(value.type)[0].template(pathname, value);
  content.insertAdjacentHTML('afterbegin', data);

  const configElements = {
    inputs: '.input_body',
    schema: '#schema',
    update: '.update',
    reset: '.reset',
    success: '.footer-button.success',
    save: '.save',
    next: '.next',
    close: '.close',
    cancel: '.cancel',
    remove: '.remove, .delete',
  };

  Object.entries(configElements).forEach(([key, selector]) => {
    dialogThis.config[key] = dialog.querySelector(selector);
  });

  const bindListener = (element, event, handler) => {
    element?.addEventListener?.(event, handler.bind(this));
  };

  if (dialogThis.config.inputs) {
    dialogThis.config.inputs.forEach(item => {
      bindListener(item, 'input', dialogThis.actions.input);
    });
  }

  bindListener(dialogThis.config.schema, 'input', dialogThis.actions.schema);
  bindListener(dialogThis.config.save, 'click', dialogThis.actions.save);
  bindListener(dialogThis.config.update, 'click', dialogThis.actions.update);
  bindListener(dialogThis.config.reset, 'click', dialogThis.actions.reset);
  bindListener(dialogThis.config.next, 'click', dialogThis.actions.next);
  bindListener(dialogThis.config.cancel, 'click', dialogThis.actions.close);
  bindListener(dialogThis.config.success, 'click', dialogThis.actions.success);
  bindListener(dialogThis.config.remove, 'click', dialogThis.actions.remove);
  bindListener(dialogThis.config.close, 'click', dialogThis.actions.close);

  document.body.appendChild(dialog);
  dialog.showModal();
};

const baseElement = class extends HTMLElement {
  constructor() {
    super();
    this._loadTracker = new LoadTracker();
    this.component = this.component.bind(this);
    this.events = this.events.bind(this);
    this.dataset.servicesPath = servicePath.pathname;
    this.config = config;
    this._loadTracker.track(
      init(this, isCustomTag).then(() => {
        this._isOnload = true;
      }).catch(error => console.warn('error', error)),
    );
  }

  static get observedAttributes() {
    return ["open", "disabled", 'hidden'];
  }

  t = i18next.t;

  _isOnload = false;

  fetch = {
    async get (url) {
      const response = await fetch(url);
      return response.json();
    },
    async post (url, data) {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: myHeaders,
      });

      return response.json();
    },
    async put () {

    },
    async delete (url) {
      const response = await fetch(url, {
        method: "DELETE",
      });
      return response.json();
    },
  };

  dialog = {
    async error (url, value) {
      dialogInit.call(this, {
        type: 'error',
        title: 'Ошибка',
        description: [{
          text: url,
        }, {
          text: value,
        }],
        button: [{
          type: 'reset',
          description: 'Закрыть',
        }],
      });
    },
    async open (value) {
      if (typeof value === 'string') {
        dialogInit.call(this, {
          type: 'success',
          title: '',
          description: [{
            text: value,
          }],
          button: [{
            type: 'success',
            description: 'Хорошо',
          }],
        });
      } else {
        dialogInit.call(this, value);
      }
    },
    async close () {
      dialogInit.call(this, {}, 'terminate');
    },
  };

  events = function (event) {
    return 'action' in this
      ? this.action.call(this, event)
      : alert('Надо определить метод action в компоненте');
  };

  set config(value) {
    for (const key in value) {
      config[key] = value[key];
    }
    return true;
  }

  get config() {
    return config;
  }

  get store() {
    return store;
  }

  get task() {
    return task;
  }

  execute = function () {
    return new Promise((resolve, reject) => {
      const call = [];
      let count = 0;
      for (const item of task) {
        const components = this.store[`${item.component}`];
        if (components) {
          for (const component of components) {
            if (component.id === item.id) {
              const bindOnMessage = item.hasOwnProperty('execute') ? item.execute.bind(this) : undefined;
              if (bindOnMessage) {
                call.push({
                  execute: bindOnMessage,
                  self: component.self,
                  detail: item.detail,
                });

                task.splice(count, 1);
              } else {
                console.log('item', item);
                alert('Должна быть функция колбека для задачи');
              }
            }
          }
        }
        count++;
      }
      call.forEach(item => item.execute(item.self, item.detail));
      resolve(true);
    });
  };

  component = function (value) {
    return new Promise(async (resolve, reject) => {
      const self = this;
      if ('execute' in value) {
        task.push(Object.assign(value, {
          tagName: this.tagName.toLowerCase(),
          type: ('type' in value) ? value.type : 'self',
        }));
        self.execute();
        resolve(self);
      } else {
        task.push(Object.assign(value, {
          tagName: this.tagName.toLowerCase(),
          type: ('type' in value) ? value.type : 'self',
          execute (component) {
            resolve(component);
          },
        }));

        await self.execute();
      }
    });
  };

  set hidden(val) {
    if (val) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  get hidden() {
    return this.hasAttribute('hidden');
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
    if (val && val === 'toggle') {
      this.hasAttribute('open')
        ? this.removeAttribute('open')
        : this.setAttribute('open', '');
    }

    if (val && val !== 'toggle') {
      this.setAttribute('open', '');
    }

    if (!val) {
      this.removeAttribute('open');
    }
  }

  get open() {
    return this.hasAttribute('open');
  }

  connectedCallback() {
    this._loadTracker.trackDOM(this);

    if (this.dataset?.servicesPath) {
      this._loadTracker.track(
        htmlOnLoad(this)
          .then(async self => {
            if ('connected' in self) {
              await self.connected();
            }

            const tree = {
              root: [],
            };

            let temp = [];
            const nodes = [];
            let element = this;
            nodes.push(element);
            temp = [];
            temp.push({
              id: element.id,
              tagName: element.tagName.toLowerCase(),
              slot: element.slot,
              children: {},
            });

            while (element.parentNode) {
              element = element.parentNode.nodeName === '#document-fragment' ? element.parentNode.host : element.parentNode;
              const edge = {};
              const isCustom = element.nodeName.split('-').length > 1;
              if (isCustom && element.tagName) {
                temp.unshift({
                  id: element.id,
                  tagName: element.tagName.toLowerCase(),
                  slot: element.slot,
                  children: {},
                });
              }
              nodes.unshift(element);

              const isLastTag = element.parentNode === null;

              if (isLastTag && element?.nodeName === '#document') {
                const maxCount = temp.length - 1;
                const resursion = (node, count) => {
                  if (maxCount === count) {
                    if (!node[temp[count].tagName]) {
                      node[temp[count].tagName] = {
                        [temp[count].id]: temp[count],
                      };
                    }
                    return true;
                  } else {
                    if (!node[temp[count].tagName]) {
                      node[temp[count].tagName] = {
                        [temp[count].id]: temp[count],
                      };
                    } else {
                      temp[count].children = node[temp[count].tagName][temp[count].id].children;
                      node[temp[count].tagName][temp[count].id] = temp[count];
                    }

                    resursion(node[temp[count].tagName][temp[count].id].children, count + 1);
                  }
                };

                resursion(virtualDom.root.children, 0);
              }
            }

            if(!self.id) {
              console.log(self);
              alert(`${self.tagName} id Обязательный параметр !!!`);
              window.location.href = '/';
            }

            const name = self.tagName.toLowerCase();

            if (!store.hasOwnProperty(name)) {
              store[name] = [];
            }

            store[name].push({
              id: self.id,
              self,
              dataset: self.dataset,
            });

            await this.execute();

            if (this.onload) {
              this.onload.call(this, this);
            }
          })
          .catch(e => console.error('error', e)),
      );
    }
  }

  disconnectedCallback() {
    if ('disconnected' in this) {
      this.disconnected().then().catch(e => console.error(e));
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if ('attributeChanged' in this) {
      this.attributeChanged.call(this, name, oldValue, newValue);
    }
  }

  adoptedCallback() {
    if ('adopted' in this) {
      this.adopted({
        name,
      });
    }
  }

  get whenLoaded() {
    return new Promise(resolve => {
      this._loadTracker.onLoad(resolve);
    });
  }
};

export const Component = (() => async (isCustomTag = true, isLiElement = false) => {
  const body = isCustomTag
    ? `return ${baseElement}`
    : isLiElement
      ? `return ${liElement}`
      : `return ${divElement}`;

  const baseComponent = new Function('LoadTracker', 'i18next', 'virtualDom', 'isCustomTag', 'task', 'dialogInit', 'config', 'store', 'servicePath', 'init', 'htmlOnLoad', body);
  return baseComponent(LoadTracker, i18next, virtualDom, isCustomTag, task, dialogInit, config, store, servicePath, init, htmlOnLoad, body);
})();
