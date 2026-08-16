import { config } from '../../../../../this/index.mjs'

let components = new Map();

components.set('header_property', [{
    type: 'component',
    template: (porps) => {
        return config.button.reduce((accumulator, item, index) => {
            console.log('🎯', index, item)
            let temp = `
            <api-button
                data-role="property"
                data-key="${index}"
                data-services-path="system"
                data-type="${item.type}"
                data-event="${item.event(item.type)}"
                class="${item.class('property')}"
            >
              <p class="${item.class('property')}">${item.text}</p>
            </api-button>`
            return accumulator + temp
        }, '')

    }
}])

components.set('header_relation', [{
    type: 'component',
    template: (porps) => {
        return config.button.reduce((accumulator, item, index) => {
            console.log('🎯', index, item)
            let temp = `
            <api-button
                data-role="relation"
                data-key="${index}"
                 data-services-path="system"
                data-type="${item.type}"
                data-event="${item.event(item.type)}"
                class="${item.class('relation')}"
            >
              <p class="${item.class('relation')}">${item.text}</p>
            </api-button>`
            return accumulator + temp
        }, '')

    }
}])

components.set('default', [{
    type: 'component',
    template: async (props) => {
        return config.link.reduce((accumulator, item, index) => {
            return accumulator +   
            `<link-auction
                to=${item.to}
                class=${item.className}
            >
                <p class=${item.className}>${item.title}</p> 
            </link-auction>`
        }, '')
    },
}])


export default components