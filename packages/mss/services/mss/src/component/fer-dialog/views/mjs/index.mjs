export { isNameSchema, isLatin } from './validator/index.mjs'

export  const  tableVisual = (self, even, odd) => {
    const items = self.shadowRoot.querySelectorAll('.auction-data__table_body_tr')
    for(let i = 0 ; i < items.length; i++ ) {
        if(i % 2) {
            let td = items[i].querySelectorAll('.auction-data__table_body_td')
            for(let j = 0; j < td.length; ++j) {
               if(j !== td.length -1 && j !== td.length -2) {
                   td[j].style.background = even
               }
            }
            // for(let item of items[i].querySelectorAll('.auction-data__table_body_td')) {

            // }
        } else {
            let td = items[i].querySelectorAll('.auction-data__table_body_td')
            for(let j = 0; j < td.length; ++j) {
                if(j !== td.length -1 && j !== td.length -2) {
                    td[j].style.background = odd
                }
            }

            // for(let item of items[i].querySelectorAll('.auction-data__table_body_td')) {
            //     item.style.background = odd
            // }
        }
    }
}
export default {
    description: ''
}