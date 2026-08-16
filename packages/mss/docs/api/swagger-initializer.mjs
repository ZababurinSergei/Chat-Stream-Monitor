import { idKey } from '/api/idKey/index.js'
import { red, magenta, green, blue } from '/api/ansis/colors.mjs';
import {store} from '/store/index.mjs'
let apiSwagger = Symbol.for('swagger');
let api = Symbol.for("api");

export let swagger = {
    resolve: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            obj[prop][`${value.method}`] = value.callback;

            return true;
        }
    }),
    fetch: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            obj[prop][`${value.method}`] = new Promise(async (resolve, reject) => {
                let state = undefined
                if(swagger.hasOwnProperty('operationSummary') && swagger.operationSummary.hasOwnProperty(prop) && swagger.operationSummary[prop].hasOwnProperty(`${value.method}`) ) {
                    state = swagger.operationSummary[prop][`${value.method}`].state;
                }


                const isDebugger = false;

                if (isDebugger) {
                    if (!state.isShown) {
                        swagger.operationSummary[prop][`${value.method}`].toggleShown.swagger();
                    }

                    let requestId = setInterval(() => {
                        if (swagger.tryItOutButton.hasOwnProperty(prop) && swagger.tryItOutButton[prop].hasOwnProperty(`${value.method}`)) {
                            swagger.tryItOutButton[prop][`${value.method}`].toggleShown.swagger();
                            if (swagger.hasOwnProperty('jsonSchemaComponents') && swagger.jsonSchemaComponents.hasOwnProperty(prop) && swagger.jsonSchemaComponents[prop].hasOwnProperty(`${value.method}`)) {
                                for (let key in swagger.jsonSchemaComponents[prop][`${value.method}`]) {
                                    for (let action in swagger.jsonSchemaComponents[prop][`${value.method}`][key]) {
                                        const func = swagger.jsonSchemaComponents[prop][`${value.method}`][key][action];
                                        if (func) {
                                            if (action === 'onChange') {
                                                func.swagger({
                                                    target: {
                                                        value: ''
                                                    }
                                                });
                                            } else if (action === 'onEnumChange') {
                                                func.swagger('');
                                            }
                                        }
                                    }
                                }
                            }

                            if (value.hasOwnProperty('parameters')) {
                                for (let key in value.parameters) {
                                    if (swagger.hasOwnProperty('jsonSchemaComponents') && swagger.jsonSchemaComponents.hasOwnProperty(prop) && swagger.jsonSchemaComponents[prop].hasOwnProperty(`${value.method}`) && swagger.jsonSchemaComponents[prop][`${value.method}`].hasOwnProperty(`${key}`)) {
                                        for (let action in swagger.jsonSchemaComponents[prop][`${value.method}`][key]) {
                                            const func = swagger.jsonSchemaComponents[prop][`${value.method}`][key][action];
                                            if (func) {
                                                if (action === 'onChange') {
                                                    func.swagger({
                                                        target: {
                                                            value: value.parameters[key]
                                                        }
                                                    });
                                                } else if (action === 'onEnumChange') {
                                                    func.swagger(value.parameters[key]);
                                                }
                                            }
                                        }
                                    } else {
                                        swagger.parameters[`${prop}`][`${value.method}`].onChangeBody.swagger(value.parameters);
                                    }
                                }
                            }

                            swagger.resolve[prop] = {
                                method: value.method,
                                callback: (res) => {
                                    let resetAndCancelId = setInterval(() => {
                                        state = swagger.operationSummary[prop][`${value.method}`].state;
                                        if (state.isShown) {
                                            let clearId = setInterval(() => {
                                                const browser = Object.keys(swagger.fetch).length;
                                                const isClear = swagger.clear.hasOwnProperty(prop) && swagger.clear[prop].hasOwnProperty(`${value.method}`);

                                                if (browser !== 0) {
                                                    if (isClear) {
                                                        swagger.clear[prop][`${value.method}`].onClick.swagger();
                                                    }
                                                }

                                                if (res.isErrors || isClear) {
                                                    if (browser !== 0) {
                                                        if (swagger.tryItOutButton.hasOwnProperty(prop) && swagger.tryItOutButton[`${prop}`].hasOwnProperty(`${value.method}`) && swagger.tryItOutButton[`${prop}`][`${value.method}`].hasOwnProperty('onResetClick')) {
                                                            if (swagger.tryItOutButton[`${prop}`][`${value.method}`].onResetClick.swagger) {
                                                                swagger.tryItOutButton[`${prop}`][`${value.method}`].onResetClick.swagger();
                                                            }
                                                        }

                                                        if (swagger.tryItOutButton.hasOwnProperty(prop) && swagger.tryItOutButton[prop].hasOwnProperty(`${value.method}`) && swagger.tryItOutButton[prop][`${value.method}`].hasOwnProperty('toggleShown')) {
                                                            if (swagger.tryItOutButton[prop][`${value.method}`].toggleShown.swagger) {
                                                                swagger.tryItOutButton[prop][`${value.method}`].toggleShown.swagger();
                                                            }
                                                        }

                                                        swagger.operationSummary[prop][`${value.method}`].toggleShown.swagger();
                                                    }

                                                    clearInterval(clearId);
                                                    delete swagger.execute[prop];
                                                    delete swagger.fetch[prop];
                                                    resolve(res);
                                                }
                                            }, 0);
                                            clearInterval(resetAndCancelId);
                                        }
                                    }, 0);
                                }
                            };

                            if (swagger.execute.hasOwnProperty(prop) && swagger.execute[prop].hasOwnProperty(`${value.method}`)) {
                                swagger.execute[prop][`${value.method}`].onClick.swagger();
                            }

                            clearInterval(requestId);
                        }
                    }, 0);
                } else {
                    let result = {
                        method: value.method,
                        path: prop,
                        res: undefined
                    };

                    let itBlocks = window.localStorage.getItem('it');
                    if (itBlocks === null) {
                        itBlocks = '';
                    }

                    itBlocks = itBlocks + `
it('${value.method.toUpperCase()}: ${prop} ${idKey()}', function () {
  return new Promise(async (resolve, reject) => {
    const request = ${JSON.stringify(value.parameters, null, 4)}
    const result = await window[api].fetch["${value.method}"]('${prop}',request, true)
    console.log('⬛ ${value.method} ${prop}',{
                "body": request,
                'response': result
            })
    result.res.ok ? resolve() : reject()
  })
})`;

                    window.localStorage.setItem('it', itBlocks);


                    if (value.method === 'get' || value.method === 'delete') {
                        if(window[apiSwagger].apis.hasOwnProperty(`${prop}`) && window[apiSwagger].apis[`${prop}`].hasOwnProperty(`${value.method}`)) {
                            result.res = await window[apiSwagger].apis[`${prop}`][`${value.method}`]({
                                ...value.parameters
                            });
                        } else {
                            result.res = {}
                            result.res.obj = {}
                            result.res.body = []
                            result.res.obj.description = 'Запрос не существует'
                            result.res.status = {}
                            result.res.status.ok = false
                        }

                    } else {
                        result.res = await window[apiSwagger].apis[`${prop}`][`${value.method}`](value.get, {
                            requestBody: value.parameters
                        });
                    }
                    resolve(result);
                }
            });

            return true;
        }
    }),
    parameters: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            obj[prop][`${value.method}`] = {
                onChangeBody: {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🟢 onChangeBody 🟢');
                        swagger.parameters[prop][`${value.method}`].onChangeBody.swagger(event);
                    }
                }
            };
            return true;
        }
    }),
    reducers: new Proxy({}, {
        set: (obj, prop, value) => {
            if (prop === 'spec_set_response') {
                if (swagger.resolve.hasOwnProperty(`${value.path}`) && swagger.resolve[`${value.path}`].hasOwnProperty(`${value.method}`)) {
                    swagger.resolve[`${value.path}`][`${value.method}`](value);
                } else {
                    console.log('запись не найдена', swagger);
                }
            }

            if (prop === 'spec_validate_param') {
                if (value.isErrors) {
                    if (swagger.resolve.hasOwnProperty(`${value.path}`) && swagger.resolve[`${value.path}`].hasOwnProperty(`${value.method}`)) {
                        swagger.resolve[`${value.path}`][`${value.method}`](value);
                        delete swagger.resolve[`${value.path}`][`${value.method}`];
                    }
                }
            }

            // console.log(`🌿 reducer 🌿`, prop, value)

            obj[prop] = value;
            return true;
        }
    }),
    execute: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            obj[prop][`${value.method}`] = {
                onClick: {
                    callback: (react) => {
                        let {
                            path,
                            method,
                            specSelectors,
                            oas3Selectors,
                            oas3Actions
                        } = react.props;
                        let {
                            requestContentType,
                            responseContentType
                        } = specSelectors.contentTypeValues([path, method]).toJS();
                        let isXml = /xml/i.test(requestContentType);
                        let parameters = specSelectors.parameterValues([path, method], isXml).toJS();

                        // operation.toObject()
                        const requestBody = oas3Selectors.requestBodyValue(path, method);
                        let requestParameters = {};
                        for (let key in parameters) {
                            const query = key.split('.');
                            switch (query[0]) {
                                case 'query':
                                    if (parameters[key]) {
                                        requestParameters[query[1]] = parameters[key];
                                    }
                                    break;
                                default:
                                    console.log('!!!!!!!!!!!!!!!! НЕИЗВСТНЫЙ КЛЮЧ !!!!!!!!!!!!!!!!', parameters);
                                    break;
                            }

                        }

                        let itBlocks = window.localStorage.getItem('it');
                        if (itBlocks === null) {
                            itBlocks = '';
                        }

                        itBlocks = itBlocks + `
it('${method.toUpperCase()}: ${path} ${idKey()}', function () {
  return new Promise(async (resolve, reject) => {
    const request = ${requestParameters ? JSON.stringify(requestParameters, null, 4) : requestBody}
    const result = await window[api].fetch["${method}"]('${path}',request, true)
    console.log('⬛ ${value.method} ${prop}', {
                "body": request,
                'response': result
            })
    result.res.ok ? resolve() : reject()
  })
})`;

                        window.localStorage.setItem('it', itBlocks);
                    },
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🟢 toggleShown 🟢');
                        swagger.execute[prop][`${value.method}`].onClick.swagger(event);
                    }
                }
            };
            return true;
        }
    }),
    clear: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }
            obj[prop][`${value.method}`] = {
                onClick: {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🔵clear🔵');
                        swagger.clear[prop][`${value.method}`].onClick.swagger(event);
                    }
                }
            };
            return true;
        }
    }),
    tryItOutButton: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            if (!obj[prop][`${value.method}`]) {
                obj[prop][`${value.method}`] = {};
            }

            obj[prop][`${value.method}`] = {
                state: value.state,
                onResetClick: {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🟡 onResetClick 🟡');
                        swagger.tryItOutButton[prop][`${value.method}`].onResetClick.swagger(event);
                    }
                },
                toggleShown: {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🟡 toggleShown 🟡');
                        swagger.tryItOutButton[prop][`${value.method}`].toggleShown.swagger(event);
                    }
                }
            };
            return true;
        }
    }),
    operationSummary: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            obj[prop][`${value.method}`] = {
                state: value.state,
                toggleShown: {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🟣toggleShown🟣', swagger.operationSummary[prop], value);
                        swagger.operationSummary[prop][`${value.method}`].toggleShown.swagger(event);
                    }
                }
            };
            return true;
        }
    }),
    jsonSchemaComponents: new Proxy({}, {
        set: (obj, prop, value) => {
            if (!obj[prop]) {
                obj[prop] = {};
            }

            if (!obj[prop][`${value.method}`]) {
                obj[prop][`${value.method}`] = {};
            }

            let onEnumChange = undefined;
            let onChange = undefined;

            if (value.isEnumValue) {
                onEnumChange = {
                    swagger: undefined,
                    service: (event) => {
                        // console.log('🔷 ENUM 🔷');
                        swagger.jsonSchemaComponents[prop][`${value.method}`][`${value.description}`].onEnumChange.swagger(event);
                    }
                };
            } else {
                onChange = {
                    swagger: undefined,
                    service: (event) => {
                        swagger.jsonSchemaComponents[prop][`${value.method}`][`${value.description}`].onChange.swagger(event);
                    }
                };
            }

            obj[prop][`${value.method}`][`${value.description}`] = {
                onChange: onChange,
                onEnumChange: onEnumChange
            };
            return true;
        }
    })
};

window[api] = {}

export const apiInit = async () => {
    window[api].fetch = {
        get: (path = '/metamart-subscription-service/api/v1/directory', data = '', test = false) => {
            return new Promise(async (resolve, reject) => {
                try {
                    swagger.fetch[`${path}`] = {
                        method: 'get',
                        parameters: data
                    };

                    const result = await swagger.fetch[`${path}`].get;

                    console.groupCollapsed(blue(`${result.res.ok? '🟢': '🔴'} GET ${path}`), data);

                    if(!test) {
                        console.log('🟩 RESPONSE', result);
                        console.trace('stack traces:')
                    }
                    console.groupEnd();
                    if(result.res.status === 401) {
                        window.location.href = '/';
                        resolve({
                            status: {
                                ok: false
                            }
                        })
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    resolve({
                        status: {
                            ok: false
                        }
                    });
                }

            });
        },
        post: (path = '', data = {}, test = false, get={}) => {
            return new Promise(async (resolve, reject) => {
                try {
                    swagger.fetch[`${path}`] = {
                        method: 'post',
                        parameters: data,
                        get: get
                    };

                    const result = await swagger.fetch[`${path}`].post;
                    console.groupCollapsed(green(`${result.res.ok? '🟢': '🔴'} POST ${path}`), get, data);

                    if(!test) {
                        console.log('🟩 RESPONSE', result);
                        console.trace('stack traces:')
                    }
                    console.groupEnd();
                    if(result.res.status === 401) {
                        window.location.href = '/';
                        resolve({
                            status: {
                                ok: false
                            }
                        })
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    resolve({
                        status: {
                            ok: false
                        }
                    });
                }

            });
        },
        put: (path = '', data = {}, test = false) => {
            return new Promise(async (resolve, reject) => {
                swagger.fetch[`${path}`] = {
                    method: 'put',
                    parameters: data
                };

                const result = await swagger.fetch[`${path}`].put;

                console.groupCollapsed(magenta(`${result.res.ok? '🟢': '🔴'} PUT ${path}`), data);

                if(!test) {
                    console.log('🟩 RESPONSE', result);
                    console.trace('stack traces:')
                }
                console.groupEnd();
                resolve(result);
            });
        },
        delete: (path = '', data = {}, test = false) => {
            return new Promise(async (resolve, reject) => {
                swagger.fetch[`${path}`] = {
                    method: 'delete',
                    parameters: data
                };

                const result = await swagger.fetch[`${path}`].delete;

                console.groupCollapsed(red(`${result.res.ok? '🟢': '🔴'} DELETE ${path}`), data);

                if(!test) {
                    console.log('🟩 RESPONSE', result);
                    console.trace('stack traces:')
                }
                console.groupEnd();

                resolve(result);
            });
        }
    };
}
