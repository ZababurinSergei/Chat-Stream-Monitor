import { store, loader } from '../../../../this/index.mjs';
import { swagger } from '/api/swagger-initializer.mjs'
import { test } from '/services/tests/src/index.mjs'
let tests = Symbol.for("tests");
let api = Symbol.for("api");

export default async (self, actions) => {
    await loader(`/api/swagger-ui-bundle.js`, '')
    await loader(`/api/swagger-ui-standalone-preset.js`, '')

    window[api].ui = SwaggerUIBundle({
    url: '/mss.yaml',
    dom_id: '#swagger-ui',
    deepLinking: false,
    docExpansion: 'none',
    validatorUrl: 'http://localhost:8080',
    requestInterceptor: (req) => {
        const authorization = store.get('authorization')
        req.headers.Authorization = `Bearer ${authorization.token.access}`
        return req
    },
    api: swagger,
    presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
    ],
    plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: 'StandaloneLayout'
});

window[api].ui.initOAuth({
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

    test(self, '/services/tests/src/tests/mss.document_kind.tests.mjs', false).catch(e => {console.log('error devtool', e)})


    const swaggerApi = self.querySelector('#describe')
    const swaggerSave = self.querySelector('.swagger-save')

    swaggerApi.addEventListener('input', (event) => {
        store.set('describe', `describe('${event.currentTarget.value}', async function () {
          this.timeout(10000);`)
    })

    function save(filename, data) {
        const blob = new Blob([data], {type: 'text/txt'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }

    swaggerSave.addEventListener('click', (event) => {
        let result = store.get('describe')

        result = result.trim() + store.get('it').trim()

        result = result + "\n})"

        if(!swaggerApi.value) {
           alert('Введите название блока describe')
        } else {
            save(swaggerApi.value, result)
        }
    })

    const swaggerReset = document.querySelector('.swagger-reset')

    swaggerReset.addEventListener('click', (event) => {
            console.clear()
            store.set('it', '')
    })

    return {
        init: () => {

        },
        terminate: () => {

        }
    }
}