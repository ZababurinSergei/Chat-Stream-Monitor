export default (view, property, color, substrate, relation) => {
     return new Promise(function (resolve, reject) {
         let template = ''
         for(let item of substrate){
             if(item.assetPair.amountAsset === null){
                 item.assetPair.amountAsset = 'Waves'
             }
             template = template + `
                  <div class="item-order">
                  <p class="item id">${item.id}</p>
                  <p class="item amountAsset">${item.assetPair.amountAsset}</p>
                  <p class="item priceAsset">${item.assetPair.priceAsset}</p>
                  <p class="item type ${item.type}">${item.type}</p>
                  <p class="item price">${item.price}</p>
                  </div>
                  `
         }
         resolve(template)
     })
}