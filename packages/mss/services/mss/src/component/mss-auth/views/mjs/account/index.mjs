import { isEmpty } from '../index.mjs'

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
export const Account =  class Account {
    constructor() {
        this.create = this.create.bind(this)
        this.open = this.open.bind(this)
        this.saveAs = this.saveAs.bind(this)
        this.address = this.address.bind(this)
    }
    create(name, password, chainId) {
        return new Promise( async (resolve, reject) => {

            let verify = false
            let signer = false
            if(chainId === 'W'){
                signer = new waves['signer']();
                verify = true
            }else if(chainId === 'T') {
                signer = new waves['signer']();
                // signer = new waves['signer']({
                //     NODE_URL: config[`${system.net}`][0]
                // });
                verify = true
            }else {
                console.assert(false, 'укажите сеть t -тестнет или w - майннет')
            }
            if(verify) {
                let stageWallet = {}
                let publicWallet = {}
                let privateWallet = {}
                stageWallet['type'] = chainId.toUpperCase()
                stageWallet['date'] = {}
                stageWallet['date']['timestap'] = Date.now().toString()
                stageWallet['date']['GMT'] = (new Date(parseInt(stageWallet['date']['timestap'],10))).toString()
                stageWallet['_scriptDir'] = import.meta.url
                stageWallet['status']  = true
                privateWallet['seed'] =  waves.libs.crypto.randomSeed(25)
                privateWallet['seedBinary'] = waves.libs.crypto.seedWithNonce(privateWallet['seed'] , parseInt(stageWallet['date']['timestap'] - 20,10))
                if(chainId === 'W'){
                    privateWallet['key'] = waves.libs.crypto.privateKey(privateWallet['seed'])
                    publicWallet['key'] = waves.libs.crypto.publicKey(privateWallet['seed'])
                    publicWallet['address'] = waves.libs.crypto.address(privateWallet['seed'])
                    privateWallet['address'] = waves.libs.crypto.address(privateWallet['seed'])
                } else{
                    privateWallet['key'] = waves.libs.crypto.privateKey(privateWallet['seed'] , waves.libs.crypto.TEST_NET_CHAIN_ID)
                    publicWallet['key'] = waves.libs.crypto.publicKey(privateWallet['seed'] , waves.libs.crypto.TEST_NET_CHAIN_ID)
                    publicWallet['address'] = waves.libs.crypto.address(privateWallet['seed'] , waves.libs.crypto.TEST_NET_CHAIN_ID)
                    privateWallet['address'] = waves.libs.crypto.address(privateWallet['seed'] , waves.libs.crypto.TEST_NET_CHAIN_ID)
                }

                // await signer.setProvider(provider.ProviderSeed(privateWallet['seed']));
                // let outWallet =  JSON.stringify(wallet)
                // console.assert(false, password)
                // let outWallet_pivate =  waves.libs.crypto.encryptSeed(JSON.stringify(publicWallet), password)
                let outWallet_private =  waves.libs.crypto.encryptSeed(JSON.stringify(privateWallet), password)
                let blob_public = new Blob([`${JSON.stringify(Object.assign(publicWallet, stageWallet),undefined,4)}`],{ type: "text/plain;charset=utf-8" });
                let blob_private = new Blob([`${outWallet_private}`],{ type: "text/plain;charset=utf-8" });
                let blob_stage = new Blob([`${JSON.stringify(stageWallet,undefined,4)}`],{ type: "text/plain;charset=utf-8" });
                console.log('sssssssssssssssssssssss')
                await this.saveAs(blob_public, `public.${name.trim().replaceAll(' ','-')}.boc`)
                await this.saveAs(blob_private, `private.${name.trim().replaceAll(' ','-')}.boc`)
                await this.saveAs(blob_stage, `stage.${stageWallet['date']['timestap']}.${name.trim().replaceAll(' ','-')}.boc`)
                resolve(Object.assign({
                    _scriptDir: import.meta.url,
                    status: true,
                    public: publicWallet,
                    private: privateWallet
                }, stageWallet))
            } else{
                resolve({
                    _scriptDir: import.meta.url,
                    status: false,
                    public: undefined,
                    private: undefined
                })
            }
        })
    }
    address(seed) {
        return waves.libs.crypto.address(seed , 'W')
    }
    open(wallet, password) {
        return new Promise( async (resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onload = function(event) {
                isEmpty(password)
                  ? resolve(JSON.parse(event.target.result))
                  : resolve(JSON.parse(waves.libs.crypto.decryptSeed(event.target.result, password)))
            }
            fileReader.readAsText(wallet);
        })
    }
    saveAs(blob, fileName) {
        return new Promise( async (resolve, reject) => {

            let url = window.URL.createObjectURL(blob);
            let anchorElem = document.createElement("a");
            anchorElem.style = "display: none";
            anchorElem.href = url;
            anchorElem.download = fileName;

            document.body.appendChild(anchorElem);
            anchorElem.click();

            document.body.removeChild(anchorElem);

            setTimeout(function() {
                window.URL.revokeObjectURL(url);
                resolve(true)
            }, 1000);
        })
    }
    get self() {
        return waves.signer
    }
}

export default {
    account: 'account creater'
}