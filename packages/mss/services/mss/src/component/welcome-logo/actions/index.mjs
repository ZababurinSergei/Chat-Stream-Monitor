// import { anime } from '../views/index.mjs'
import { activeClass, store } from '../../../this/index.mjs';
import dynamicClass from './dynamicClass/index.mjs'
export default (self) => {
    return new Promise(async (resolve, reject) => {
        await dynamicClass(self)
        self.section = '0_0'
        self.class = `welcome-logo_0_0`
        self.dataset.id = '0'
        self.style.visibility = 'hidden'

        resolve({
            click: (event) => {
                if(self.disable) return
                // let welcomeMenu = self.getRootNode().querySelector('welcome-menu')
                // const activeMenu = welcomeMenu.querySelector(`.${activeClass}`)
                console.log('🟣 CustomEvent change-views welcome-logo')
                store.set('section', self.dataset.id)
                window.dispatchEvent(new CustomEvent('change-views', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        id: self.dataset.id,
                        type: 'transform',
                        action: `to`,
                        section: self.section
                    }
                }));
            },
            mouseenter: (event) => {
                const outsideSquare = self.shadowRoot.querySelector('.welcome-logo')
                const insideSquare = self.shadowRoot.querySelector('.square-buttom')

                outsideSquare.style.transform = 'rotate(' + 90 + 'deg) scale(1.5)';
                outsideSquare.style.opacity = 1;
                insideSquare.style.transform = 'rotate(' + -90 + 'deg) scale(0.7)';
                insideSquare.style.opacity = 1;
            },
            mouseleave: (event) => {
                const outsideSquare = self.shadowRoot.querySelector('.welcome-logo')
                const insideSquare = self.shadowRoot.querySelector('.square-buttom')
                outsideSquare.style.transform = 'rotate(' + 45 + 'deg) scale(1)';
                outsideSquare.style.opacity = 0.5;

                insideSquare.style.transform = 'rotate(' + -45 + 'deg) scale(1)';
                insideSquare.style.opacity = 0.5;
            }
        })
    })
}
