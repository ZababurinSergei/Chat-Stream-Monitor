export const initSections = (self) => {
    return new Promise((resolve, reject) => {
        let menu = document.body.querySelector('welcome-menu')
        let buttons = menu.querySelectorAll('fer-button')

        const current = () => {
            for (let item of buttons) {
                if (item.classList.contains(activeClass)) {
                    return parseInt(item.dataset.id, 10)
                }
            }
            return 0
        }

        resolve({
            styleOpacity: (self) => {
                if(self.dataset.type === 'welcome-menu') {
                    const fontSize = 30
                    const stepFontSize = 4
                    const currentItem = self.shadowRoot.querySelector('p')
                    const id = parseInt(self.dataset.id, 10)
                    const opacity = 100 - 5 * id
                    const currentFontSize = fontSize - stepFontSize * id
                    currentItem.style.opacity = `${opacity}%`
                    currentItem.style.fontSize = `${currentFontSize}px`
                }
            }
        })
    })
}
