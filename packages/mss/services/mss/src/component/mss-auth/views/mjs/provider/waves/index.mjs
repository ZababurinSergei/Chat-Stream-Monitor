import isEmpty from '/static/html/components/component_modules/isEmpty/isEmpty.mjs'
// import iframeWindow from '/static/html/components/component_modules/waves-provider/module/iframe/iframe-window.mjs'
export let Account = class Provider {
    constructor(self) {
        this._seed = '' // string;
        this._options = {
            NETWORK_BYTE: "W".charCodeAt(0),
            NODE_URL: 'https://nodes.wavesplatform.com',
        };
    }
    connect(options){
        this._options = options;
        return Promise.resolve();
    }
    sign({list:[]}){
        return Promise.resolve(
            list.map((params) =>
              waves.signer['signTx'](
                    {
                        chainId: this._options.NETWORK_BYTE,
                        ...params,
                    },
                    this._seed
                )
            )
        )
    }
    login(){
        return new Promise(async (resolve, reject) => {
           // await iframeWindow()
            document.addEventListener('provider-login',async (event)=>{
                resolve({
                    address: waves.signer['libs'].crypto.address(
                        this._seed,
                        this._options.NETWORK_BYTE
                    ),
                    publicKey: waves.signer['libs'].crypto.publicKey(this._seed),
                })
            })
            resolve({
                address: waves.signer['libs'].crypto.address(
                    this._seed,
                    this._options.NETWORK_BYTE
                ),
                publicKey: waves.signer['libs'].crypto.publicKey(this._seed),
            })
        })
    }
    logout(){
        console.log('~~~~~~~~~ logout ~~~~~~~~~')
        return Promise.resolve();
    }
    signTypedData({data: []}){
        return Promise.resolve('// TODO'); // TODO
    }
    signMessage(){
        return Promise.resolve('// TODO'); // TODO
    }
    ProviderSeed(seed, NODE_URL){
        if(!isEmpty(NODE_URL)){
            this._options.NODE_URL = NODE_URL
        }
        if(isEmpty(seed)){
           console.assert(false, 'укажите seed фразу')
        }else{
         this._seed = seed
        }
        return this
    }
    saveAs(blob, fileName){
        let url = window.URL.createObjectURL(blob);
    
        let anchorElem = document.createElement("a");
        anchorElem.style = "display: none";
        anchorElem.href = url;
        anchorElem.download = fileName;
    
        document.body.appendChild(anchorElem);
        anchorElem.click();
    
        document.body.removeChild(anchorElem);
    
        // On Edge, revokeObjectURL should be called only after
        // a.click() has completed, atleast on EdgeHTML 15.15048
        setTimeout(function() {
            window.URL.revokeObjectURL(url);
        }, 1000);
        
    }
    get self() {
        return object
    }
}


export default Account