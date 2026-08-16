// import { anime } from '../views/index.mjs'

export default (self) => {
    return new Promise(async (resolve, reject) => {

        const diagram = self.shadowRoot.querySelector('.section_content_body_diagram')

        let currentElem = null;

        resolve({
            mouseover: (event) => {
                if (currentElem) return;
                // let target = event.target.closest('div[class*="diagram_section"]');
                console.log('1111111111111111111111111111155555111', event.target)
                // if (!target) return;
                // if (!table.contains(target)) return;
                //
                // currentElem = target;
                //
                // console.log('22222222222222222222222222222222222222222')
                // target.style.background = 'pink';
            },
            mouseout: (event) => {
                console.log('111111111111111111111111144441111111', event.target)
            },
            click: (event) => {
                // window.dispatchEvent(new CustomEvent('change-views', {
                //     bubbles: true,
                //     composed: true,
                //     detail: {
                //         id: parseInt(self.parentNode.dataset.id, 10),
                //         type: 'transform',
                //         action: `to`
                //     }
                // }));
            },
            mouseenter: (event) => {

                console.log('11111111111111111111113331111111111', event.target)
                // const outsideSquare = self.shadowRoot.querySelector('.welcome-logo')
                // const insideSquare = self.shadowRoot.querySelector('.square-buttom')
                //
                // outsideSquare.style.transform = 'rotate(' + 90 + 'deg) scale(1.5)';
                // outsideSquare.style.opacity = 1;
                // insideSquare.style.transform = 'rotate(' + -90 + 'deg) scale(0.7)';
                // insideSquare.style.opacity = 1;
            },
            mouseleave: (event) => {

                console.log('111111111111111111222211111111111111', event.target)
                // const outsideSquare = self.shadowRoot.querySelector('.welcome-logo')
                // const insideSquare = self.shadowRoot.querySelector('.square-buttom')
                // outsideSquare.style.transform = 'rotate(' + 45 + 'deg) scale(1)';
                // outsideSquare.style.opacity = 0.5;
                //
                // insideSquare.style.transform = 'rotate(' + -45 + 'deg) scale(1)';
                // insideSquare.style.opacity = 0.5;
            }
        })
    })
}
