/* eslint-disable no-undef */
let apiSwagger = Symbol.for("swagger");
let api = Symbol.for("api");

window.onload = function () {
    window['SwaggerUIBundle'] = window['swagger-ui-bundle'];
    window['SwaggerUIStandalonePreset'] = window['swagger-ui-standalone-preset'];


    let swagger = {
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
                    console.log('swagger.operationSummary', swagger.operationSummary)
                    console.log('prop, value.method ----', prop, value.method)
                    let state = swagger.operationSummary[prop][`${value.method}`].state;

                    const isDebugger = true

                    if(isDebugger) {
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

                                if(swagger.execute.hasOwnProperty(prop) && swagger.execute[prop].hasOwnProperty(`${value.method}`)) {
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
                        }

                        let itBlocks = window.localStorage.getItem("it");
                        if(itBlocks === null) {
                            itBlocks = ''
                        }

                        itBlocks = itBlocks + `
it('Вызвать метод ${prop} ${value.method}', function () {
  return new Promise(async (resolve, reject) => {
    const request = ${JSON.stringify(value.parameters, null, 4)}
    const data = await window[api].fetch["${value.method}"]('${prop}',request)
    data.res.ok ? (console.log(data.res), resolve()) : reject(JSON.parse(data.res.data))
  })
})`

                        window.localStorage.setItem("it", itBlocks);


                        if(value.method === 'get') {
                            result.res = await window[apiSwagger].apis[`${prop}`][`${value.method}`](value.parameters)
                        } else {
                            result.res = await window[apiSwagger].apis[`${prop}`][`${value.method}`]({}, {
                                requestBody: value.parameters
                            })
                        }
                        resolve(result)
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
                            let { path, method, specSelectors, oas3Selectors, oas3Actions } = react.props
                            let { requestContentType, responseContentType } = specSelectors.contentTypeValues([path, method]).toJS()
                            let isXml = /xml/i.test(requestContentType)
                            let parameters = specSelectors.parameterValues([path, method], isXml).toJS()

                            // operation.toObject()
                            const requestBody = oas3Selectors.requestBodyValue(path, method)
                            let requestParameters = {}
                            for(let key in parameters) {
                                console.log('--------------------------------------', key)
                                const query = key.split('.')
                                switch (query[0]) {
                                case 'query':
                                    if(parameters[key]) {
                                        requestParameters[query[1]] = parameters[key]
                                    }
                                    break
                                default:
                                    console.log('!!!!!!!!!!!!!!!! НЕИЗВСТНЫЙ КЛЮЧ !!!!!!!!!!!!!!!!', parameters)
                                    break
                                }

                            }

                            let itBlocks = window.localStorage.getItem("it");
                            if(itBlocks === null) {
                                itBlocks = ''
                            }

                            itBlocks = itBlocks + `
it('Вызвать метод ${path} ${method}', function () {
  return new Promise(async (resolve, reject) => {
    const request = ${requestParameters ? JSON.stringify(requestParameters, null, 4): requestBody}
    const data = await window[api].fetch["${method}"]('${path}',request)
    data.res.ok ? (console.log(data.res), resolve()) : reject(JSON.parse(data.res.data))
  })
})`

                            window.localStorage.setItem("it", itBlocks);
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

    const ui = SwaggerUIBundle({
        url: './examples/mss.yaml',
        dom_id: '#swagger-ui',
        api: swagger,
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
        ],
        // requestSnippetsEnabled: true,
        layout: 'StandaloneLayout'
    });

    window.ui = ui;

    ui.initOAuth({
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret-if-required',
        realm: 'your-realms',
        appName: 'your-app-name',
        scopeSeparator: ' ',
        scopes: 'openid profile email phone address',
        additionalQueryStringParams: {},
        useBasicAuthenticationWithAccessCodeGrant: false,
        usePkceWithAuthorizationCodeGrant: false
    });

    setTimeout(async () => {
        // console.log('========================== START ==========================')
        // swagger.fetch['/api/v1/directory/record'] = {
        //     method: 'post',
        //     parameters: {
        //         "active": true,
        //         "createdAt": new Date(Date.now()).toISOString(),
        //         "directoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        //         "code": "23232323",
        //         "name": "dfsdfsdfsd"
        //     }
        // }
        // const result = await swagger.fetch['/metamart-subscription-service/api/v1/directory/record'].post
        //
        // console.log('========================== END ==========================', result)


        swagger.fetch['/api/v1/directory/record'] = {
            method: 'delete',
            parameters: {
                "recordId": "aded063d-94d9-401a-b6c2-fa69acb42d65",
                "directoryId": "0b42c42b-4467-4dee-9085-54ba2aef287b"
            }
        }

        const result = await swagger.fetch['/api/v1/directory/record'].delete


        console.log('############################## REQUEST END ##############################', result)
    }, 2000);
};
