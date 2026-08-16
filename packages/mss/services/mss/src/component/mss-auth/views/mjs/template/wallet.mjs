import config from '/static/html/components/component_modules/account/com.waves-ide_config.mjs'
export default (view, property, color, substrate, relation) => {
     return new Promise(function (resolve, reject) {
          let link = {}
          if(substrate['type'] === 'T'){
               link = `${config.explorer}/testnet/address/${substrate['address']}`
          }else {
               link = `${config.explorer}/address/${substrate['address']}`
          }
          resolve(`
<div class="wallet wallet-explorer">
<a class="value" href=${link} target="_blank">Check the Explorer</a>
</div>
<div class="wallet wallet-address">
<h2 class="preview">Authorized as</h2>
<p class="value">${substrate['address']}</p>
</div>
<div class="wallet wallet-publicKey">
<h2 class="preview">Public Key</h2>
<p class="value">${substrate['publicKey']}</p>
</div>
<div class="wallet wallet-privateKey">
<h2 class="preview">Private Key</h2>
<p class="value">${substrate['privateKey']}</p>
</div>
<div class="wallet wallet-seed">
<h2 class="preview">Seed</h2>
<p class="value">${substrate['seed']}</p>
</div>
<div class="wallet wallet-balance">
<h2 class="preview">Balance</h2>
<p class="value">${substrate['balance']}</p>
</div>`)
     
     })
}