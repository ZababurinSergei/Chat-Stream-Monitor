// import store from '/static/html/components/component_modules/staticProperty/staticProperty.mjs'
import isEmpty from '/static/html/components/component_modules/isEmpty/isEmpty.mjs'
import Account from '/static/html/components/component_modules/account/index.mjs'
import walletTemplate from '/static/html/components/waves-provider/template/wallet.mjs'
import Waves from '/static/html/components/component_modules/waves/index.mjs'
import task from '/static/html/components/component_modules/heap/index.mjs'
import utils from '/static/html/components/component_modules/bundle/waves/waves.index.mjs'
export default async (v,p,c,obj,r) => {

    let sys = {
        wallet:{
            data:{
                private: undefined,
                public:  undefined,
                stage: undefined,
            },
            html: {
                public: obj['this'].shadowRoot.querySelector('#account-create-public'),
                private: obj['this'].shadowRoot.querySelector('#account-create'),
                stage: obj['this'].shadowRoot.querySelector('#account-create-stage'),
            }
        }
    }
    // console.assert(false, sys)
    let account = new Account()
    let waves = new Waves()
    let objectWallet = {}
    task.get(true, 'await', '5', '','/onload/wallet', async (object)=> {
        if (isEmpty(objectWallet)) {
            objectWallet = new Proxy({}, {
                get: function (target, prop) {
                    return target[prop];
                },
                set: function (target, prop, value) {
                    obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.background = '#f21818de'
                    obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.color = '#93fff5'
                    obj['this'].shadowRoot.querySelector('div.connecting-cycle').innerHTML = 'ON AIR'
                    object.callback(value)
                    return true;
                }
            });
        } else {
            // console.assert(false, objectWallet)
        }
        object.callback({status: true, data: objectWallet})
    })


    obj['this'].shadowRoot.querySelector('svg.form-password').addEventListener('click', async (event) => {
        let type = obj['this'].shadowRoot.querySelector('#form-password')
        if (type.type === 'text') {
            obj['this'].shadowRoot.querySelector('#form-password').type = 'password'
        } else {
            obj['this'].shadowRoot.querySelector('#form-password').type = 'text'
        }
    })
    obj['this'].shadowRoot.querySelector('svg.form-confirm').addEventListener('click', async (event) => {
        let type = obj['this'].shadowRoot.querySelector('#form-confirm')
        if (type.type === 'text') {
            obj['this'].shadowRoot.querySelector('#form-confirm').type = 'password'
        } else {
            obj['this'].shadowRoot.querySelector('#form-confirm').type = 'text'
        }
    })
    obj['this'].shadowRoot.querySelector('button.login-button').addEventListener('click', async (event) => {
        let file = obj['this'].shadowRoot.querySelector('#account-create').files[0]
        obj['this'].shadowRoot.querySelector('#account-create').value = '';
        let pass = obj['this'].shadowRoot.querySelector('#form-password')
        let passConfirm = obj['this'].shadowRoot.querySelector('#form-confirm')
        if (file === undefined) {
            if (isEmpty(pass.value)) {

            } else {
                if (pass.value === passConfirm.value) {
                    sys.pass = pass.value
                    obj['this'].shadowRoot.querySelector('#form-password').value = ''
                    obj['this'].shadowRoot.querySelector('#form-confirm').value = ''
                    let name = obj['this'].shadowRoot.querySelector('#account-name').value
                    let type = obj['this'].shadowRoot.querySelector('#account-type').value
                    if (isEmpty(name)) { name = 'wallet' }
                    let wallet = await account.create(name, sys.pass, type)
                    let balance = await waves['balance'](wallet['public']['address'])
                    // console.assert(false, wallet)
                    let template = await walletTemplate(true, '', '3', {
                        type: wallet['type'],
                        date: wallet['date']['GMT'],
                        address: wallet['public']['address'],
                        publicKey: wallet['public']['key'],
                        privateKey: wallet['private']['key'],
                        seed: wallet['private']['seed'],
                        balance: balance['message']['balance'],
                    }, 'template-wallet')
                    obj['this'].shadowRoot.querySelector('#wallet').innerHTML = ''
                    obj['this'].shadowRoot.querySelector('#wallet').classList.add("active")
                    obj['this'].shadowRoot.querySelector('#wallet').insertAdjacentHTML('beforeend', template)
                    let button = ['wallet-address',
                        'wallet-publicKey',
                        'wallet-privateKey',
                        'wallet-seed',
                        'wallet-balance']
                    objectWallet['wallet'] = wallet
                    for (let item of button) {
                        obj['this'].shadowRoot.querySelector(`div.${item}`).addEventListener('click', async (event) => {
                            event.currentTarget.style.background = '#faf671'
                            let object = event.currentTarget
                            let value = object.querySelector('p.value').innerHTML
                            await navigator.clipboard.writeText(value)
                            let timer = setTimeout((event) => {
                                object.style.background = '#4c6499de'
                                clearTimeout(timer);
                            }, 250);
                        })
                    }
                }
            }
        } else {
            try {
                sys.wallet.data.public = await account.open(sys.wallet.html.public.files[0])
                sys.wallet.data.stage = await account.open(sys.wallet.html.stage.files[0])
                sys.wallet.data.private = await account.open(file, pass.value)
                obj['this'].shadowRoot.querySelector('#form-password').value = ''
                let wallet = Object.assign(sys.wallet.data.public, sys.wallet.data.private, sys.wallet.data.stage);
                let balance = await waves['balance'](wallet['address'], wallet['type'])
                console.log(utils)
                window.utils = utils
                // console.log(utils.base58Decode(wallet.seed))
                // console.log(utils.base58Encode(wallet.seed))
                console.assert(false, wallet)
                let template = await walletTemplate(true, '', '3', {
                    type: wallet['type'],
                    date: wallet['date']['GMT'],
                    address: wallet['address'],
                    publicKey: wallet['key'],
                    privateKey: 'не подключен',
                    seed: wallet.seed,
                    balance: balance['message']['balance'],
                }, 'template-wallet')
                obj['this'].shadowRoot.querySelector('#wallet').innerHTML = ''
                obj['this'].shadowRoot.querySelector('#wallet').classList.add("active")
                obj['this'].shadowRoot.querySelector('#wallet').insertAdjacentHTML('beforeend', template)
                let button = ['wallet-address',
                    'wallet-publicKey',
                    'wallet-privateKey',
                    'wallet-seed',
                    'wallet-balance']
                // task.set(true, `change status`, '5', wallet ,'/onload/wallet');
                obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.background = '#f21818de'
                obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.color = '#93fff5'
                obj['this'].shadowRoot.querySelector('div.connecting-cycle').innerHTML = 'ON AIR'
                for (let item of button) {
                    obj['this'].shadowRoot.querySelector(`div.${item}`).addEventListener('click', async (event) => {
                        event.currentTarget.style.background = '#faf671'
                        let object = event.currentTarget
                        let value = object.querySelector('p.value').innerHTML
                        await navigator.clipboard.writeText(value)
                        let timer = setTimeout((event) => {
                            object.style.background = '#4c6499de'
                            clearTimeout(timer);
                        }, 250);
                    })
                }
            } catch (e) {
                console.warn({
                    status: false,
                    message: e,
                    _scriptDir: import.meta.url
                })
            }
        }
    })

// console.log('@@@@@@@@@@@@@55555@@@@@@@@@@@@@', objectWallet)
// document.addEventListener('await-wallet',async (event)=>{
//     console.log('@@@@@@@@@@@@@111@@@@@@@@@@@@@', objectWallet)
//     if(isEmpty(objectWallet)){
//          objectWallet = new Proxy({}, {
//             get: function(target, prop) {
//                 return Reflect.get(target, prop);
//             },
//             set: function(target, prop, value) {
//                 obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.background = '#f21818de'
//                 obj['this'].shadowRoot.querySelector('div.connecting-cycle').style.color = '#93fff5'
//                 obj['this'].shadowRoot.querySelector('div.connecting-cycle').innerHTML = 'ON AIR'
//                 event.detail.callback(value)
//                 return Reflect.set(target, prop, value);
//             }
//         });
//     }else{
//         console.assert(false, objectWallet)
//     }
// })
    /*
    let account = await (Account())

    */
}

// console.assert(false,JSON.stringify(wallet), local )
// console.assert(false,signer.libs.crypto.privateKey(seed))
// waves.setProvider(new signer.Provider());
// console.assert(false, test.login(), test2.login())
// const provider = new signer['Provider']('https://testnet.waves.exchange/signer/');

// obj['this']['shadowRoot'].querySelector("#form-password").addEventListener("click", async function (event) {
//     try {
//         const userData = await waves.login();
//         event.target.classList.add("clicked");
//         obj['this']['shadowRoot'].querySelector('#log').insertAdjacentHTML('beforeend',`authorized as <br> ${userData.address}` )
//         obj['this']['shadowRoot'].querySelector(".explorer-link").innerHTML = `<a href="https://wavesexplorer.com/testnet/address/${userData.address}" target="_blank">Check the Explorer</a>`;
//     } catch (e) {
//         console.error('login rejected', e)
//     }
// });
// obj['this']['shadowRoot'].querySelector(".js-invoke").addEventListener("click", function () {
//     waves.invoke({
//         dApp: "3MuN7D8r19zdvSpAd1L91Gs88bcgwUFy2mn",
//         call: {
//             function: "faucet"
//         }
//     }).broadcast().then(console.log)
// });

// obj['this']['shadowRoot'].querySelector(".js-data").addEventListener("click", function () {
//     const date = new Date();
//     waves.data({
//         data: [
//             {
//                 key: "lastCall",
//                 value: `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
//                 type: 'string'
//             }
//         ]
//     }).broadcast().then(console.log)
// });


// just transferring some WAVES token to Alice
//                 obj['this']['shadowRoot'].querySelector(".js-transfer").addEventListener("click", function () {
//                     waves.transfer({
//                         recipient: "3MuN7D8r19zdvSpAd1L91Gs88bcgwUFy2mn",
//                         amount: 1
//                     }).broadcast().then(console.log)
//                 })
// }
