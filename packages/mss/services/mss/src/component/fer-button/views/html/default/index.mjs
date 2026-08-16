import {loadHTML} from '../index.mjs'

let components = new Map();

components.set('default', [{
    type: 'component',
    template: async (slot, props = {}) => {
        let template = ''
        let keys = []
        switch(slot) { 
            default:
                return `<div>test</div>`
            break
        }
    }
}])


components.set('welcomebook', [{
    type: 'component',
    template: async (slot, props = {}) => {
        let template = ''
        let keys = []
        switch(slot) {
            default:
                return `
                    <div class="word">
                        <div class="word__item word__item--left">Сайт Компании</div>
                        <div class="word__item word__item--right">Сайт Компании</div>
                    </div>
                `
                break
        }
    }
}])

export default components