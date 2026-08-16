export { isValidHostname } from './isValidateHost/index.mjs'

export  const  tableVisual = (self, even, odd, id) => {
    const items = self.shadowRoot.querySelectorAll('.auction-data__table_body_tr')
    // let k = id === '2_0' ? 1 : 2
    let k = 2
    const isDisabled =  id === '2_1'

    for(let i = 0 ; i < items.length; i++ ) {
        if(i % 2) {
            let td = items[i].querySelectorAll('.auction-data__table_body_td')
            for(let j = 0; j < td.length; ++j) {
                if(isDisabled) {
                    td[j].style.background = even
                } else {
                    if(j !== td.length -1 && j !== td.length - k) {
                        td[j].style.background = even
                    }
                }
            }
            // for(let item of items[i].querySelectorAll('.auction-data__table_body_td')) {

            // }
        } else {
            let td = items[i].querySelectorAll('.auction-data__table_body_td')
            for(let j = 0; j < td.length; ++j) {
                if(isDisabled) {
                    td[j].style.background = odd
                } else {
                    if(j !== td.length -1 && j !== td.length - k) {
                        td[j].style.background = odd
                    }
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