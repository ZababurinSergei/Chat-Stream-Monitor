import { store } from '../../../this/index.mjs';

const { activeClass } = await import('../../../this/index.mjs')
export const initSections = (self) => {
   return new Promise((resolve, reject) => {
        let menu = document.body.querySelector('welcome-menu')
        let buttons = menu.querySelectorAll('fer-button')
        let close = self.shadowRoot.querySelector('.onclick')

        if(close !== null) {
            close.addEventListener('click', (event) => {
                store.set('section', parseInt(event.currentTarget.dataset.id, 10))
                window.dispatchEvent(new CustomEvent('change-views', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        type: 'transform',
                        id: parseInt(event.currentTarget.dataset.id, 10),
                        action: `from`
                    }
                }));
            })
        }

        resolve({
            get: {
                template: () => {

                }
            },
           current: () => {
               for (let item of buttons) {
                   if (item.classList.contains(activeClass)) {
                       return parseInt(item.dataset.id, 10)
                   }
               }
               return 0
           },
           clearClass: (section) => {
               if (section.classList.contains('animation')) {
                   section.classList.remove('animation')
               }

               if (section.classList.contains('animation2')) {
                   section.classList.remove('animation2')
               }

               if (section.classList.contains('animation3')) {
                   section.classList.remove('animation3')
               }

               if (section.classList.contains('animation4')) {
                   section.classList.remove('animation4')
               }

               if (section.classList.contains('animation5')) {
                   section.classList.remove('animation5')
               }
           }
       })
    })
};