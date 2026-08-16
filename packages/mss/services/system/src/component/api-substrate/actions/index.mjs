import { store, size } from "../../../this/index.mjs";
// import MKB from '/services/mkb/build/index.mjs'
// import lightCSS from '/services/mkb/build/index.css' assert {type: "css"}
export default (self) => {
    return new Promise(async (resolve, reject) => {
        const isHeader = store.get('service').system.header
        const isFooter = store.get('service').system.footer
        const isProperty = store.get('service').system.property

        const grid__body = self.shadowRoot.querySelector('[class*="grid__body"]')
        const grid__footer = self.shadowRoot.querySelector('[class*="grid__footer"]')

        if(!isHeader && !isFooter) {
            const relation= self.shadowRoot.querySelector('#relation')
            const grid__header= self.shadowRoot.querySelector('.grid__header')
            grid__header.style.margin = '0'
            grid__header.style.gridTemplateRows = '0';


            // grid__body.style.gridTemplateColumns = `var(--substrate-pr-width) 1fr 0` ;
            // grid__body.style.gap = '0'
            const header = self.shadowRoot.querySelector('.grid__main')
            const grid__header_relation = self.shadowRoot.querySelector('.grid__header_relation')
            grid__header_relation.style.margin = '0'
            grid__header_relation.style.padding = '0'
            grid__header_relation.querySelector('slot').name = ''
            const grid__header_substrate = self.shadowRoot.querySelector('.grid__header_substrate')
            grid__header_substrate.querySelector('slot').name = ''
            grid__header_substrate.style.margin = '0'
            grid__header_substrate.style.padding = '0'
            const grid__header_property = self.shadowRoot.querySelector('.grid__header_property')
            grid__header_property.style.margin = '0'
            grid__header_property.style.padding = '0'
            grid__header_property.querySelector('slot').name = ''
            grid__header_relation.style.height = '0';
            grid__header_substrate.style.height = '0';
            grid__header_property.style.height = '0';
        }

        if(!isProperty) {
            // grid__body.style.gridTemplateColumns = "var(--substrate-body-width) 1fr"
        }

        if(isFooter) {
            // grid__footer.style.gridTemplateColumns = "1fr"
            // grid__footer.style.gridTemplateRows = `${size(108, 1920)}vw`
            // grid__footer.style.height = `${size(108, 1920)}vw`;
        }
        // if(substrate?.main) {
        //     console.log('=============== substrate ===============', substrate.main)
        // }
        // const divRoot = document.createElement('div')
        // divRoot.id = 'root'
        //
        // const pathname = normalizePathName(window.location.pathname)
        // let linkHeader = self.shadowRoot.querySelector('.grid__header_substrate')
        //
        // const shadowRoot = self.shadowRoot.querySelector('#shadow')
        // const shadow = shadowRoot.attachShadow({mode: "open"});
        // shadow.appendChild(divRoot)
        //
        // document.adoptedStyleSheets = [...document.adoptedStyleSheets, lightCSS];
        // shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, lightCSS];
        //
        // shadow.appendChild(divRoot)
        //
        // const virtualDom = Symbol("virtualDOM");
        //
        // let mkb = await MKB(virtualDom, shadow)
        //
        // mkb[virtualDom].app.props.root = {}
        //
        // mkb.render(mkb[virtualDom].app);

        // switch (pathname.toLowerCase()) {
        //     case '/dex/processor/':
        //         linkHeader.textContent = 'Link'
        //         break
        //     default:
        //         break
        // }

        resolve({
            changeViewsTemplate: (event) => {
                const relation = self.shadowRoot.querySelector('#relation')
                const gridBody = self.shadowRoot.querySelector('.grid__body')

                if(event.detail.section === '5_0') {
                    relation.classList.add('invisible')
                    gridBody.classList.add('template2')
                } else {
                    gridBody.classList.remove('template2')
                    relation.classList.remove('invisible')
                }
            }
        })
    })
}
