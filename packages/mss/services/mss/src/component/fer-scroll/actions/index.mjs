import {events, animationCount, activeClass} from '../../../this/index.mjs'
// import dynamicClass from './dynamicClass/index.mjs'

export default (self) => {
    return new Promise(async (resolve, reject) => {
        // await dynamicClass(self)
        const scroll = (y, duration, self, section) => {
            let initialY = document.documentElement.scrollTop || document.body.scrollTop;
            let baseY = (initialY + y) * 0.5;
            let difference = initialY - baseY;
            let startTime = performance.now();
            // section.style.transform =  `translateY(1vh)`
            function step() {
                let normalizedTime = (performance.now() - startTime) / duration;
                if (normalizedTime > 1) {
                    normalizedTime = 1;
                }

                let yOffset = baseY + difference * Math.cos(normalizedTime * Math.PI)
                let percent =  yOffset * 100 / y
                const stepItem = 1.5
                section.style.transform =  `translateY(${percent * stepItem}vh)`
                // item.style
                // image.style.backgroundPositionY = `${-0.4 * percent}vh`
                // item.style.marginTop =  `${percent * stepItem}vh`
                window.scrollTo(0, baseY + difference * Math.cos(normalizedTime * Math.PI));

                if (normalizedTime < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    console.log('################################################')
                    self.scrollIntoView({block: "start", behavior: "smooth"});
                    // image.style.backgroundPositionY = 'unset'
                }
            }
            window.requestAnimationFrame(step);
        }

        function scrollTo(element, to, duration) {
            let start = element.scrollTop,
                change = to - start,
                increment = 20;

            let animateScroll = function(elapsedTime) {
                elapsedTime += increment;
                let position = easeInOut(elapsedTime, start, change, duration);
                element.scrollTop = position;
                if (elapsedTime < duration) {
                    setTimeout(function() {
                        animateScroll(elapsedTime);
                    }, increment);
                }
            };

            animateScroll(0);
        }

        function easeInOut(currentTime, start, change, duration) {
            currentTime /= duration / 2;
            if (currentTime < 1) {
                return change / 2 * currentTime * currentTime + start;
            }
            currentTime -= 1;
            return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
        }
        const welcomeLogo = self.getRootNode().querySelector('welcome-logo')

        self.section = '0'
        self.class = 'fer-scroll_0'
        welcomeLogo.class = `welcome-logo_0_0`

        const isNextSectionById = (welcomeSection, id) => {
            let isNextSectionById = true
            welcomeSection.forEach(section => {
                const currentId = section.dataset.id
                if(section.dataset.id === id.toString() && section.hasAttribute('children')) {
                    const childrentId = section.getAttribute('children').split('_');
                    let maxId = parseInt(childrentId[0], 10);
                    let currentId = parseInt(childrentId[1], 10);
                    if(maxId > currentId) {
                        isNextSectionById = false
                    }
                }

            })

            return isNextSectionById
        }

        resolve({
            click: async (event) => {
                if (self.disabled) {
                    return;
                }


                let currentId = {}
                currentId.array = self.section.split('_')
                currentId.isFirst = currentId.array.length === 1

                if(currentId.isFirst) {
                    animationCount.setDirection(true)
                    const buttons = document.querySelectorAll('fer-button')
                    const root = self.getRootNode()
                    const welcomeSection = root.querySelectorAll('welcome-section')

                    let currentButtonIndex = undefined
                    let currentButton = undefined
                    let currentButtonId= undefined

                    for(let i = 0; i < buttons.length; ++i) {
                        const id = parseInt(buttons[i].dataset.id, 10)
                        if(buttons[i].dataset.type === 'welcome-menu' && buttons[i].classList.contains(activeClass)) {
                            currentButtonIndex = i
                            currentButtonId = id
                            currentButton = buttons[i]
                            break
                        }

                        if(id === 0) {
                            currentButtonIndex = 0
                            currentButtonId = 0
                            currentButton = buttons[i]
                        }
                    }

                    if(isNextSectionById(welcomeSection, currentButtonId)) {
                        self.section = currentButtonId + 1

                    } else {
                        self.section = currentButtonId
                    }

                    self.class = `fer-scroll_${self.section}`
                    welcomeLogo.class = `welcome-logo_${self.section}`
                    welcomeLogo.dataset.id = self.section
                    welcomeLogo.section = `${self.section}_0`
                    welcomeLogo.class = `welcome-logo_${self.section}_0`
                    // events('welcome-header', {
                    //     'isDisable': true
                    // })
                    buttons[self.section].click()
                } else {
                    animationCount.setDirection(true)
                    // events('welcome-header', {
                    //     'isDisable': true
                    // })
                    // const buttons = document.querySelectorAll('fer-button')
                    const root = self.getRootNode()
                    // const welcomeSection = root.querySelectorAll(`welcome-section[data-id*="${currentId.array[0]}_"]`)
                    const welcomeSectionActive = root.querySelector(`welcome-section[data-id="${self.section}"]`)
                    const welcomeSectionNext = root.querySelector(`welcome-section[data-id*="${currentId.array[0]}_${parseInt(currentId.array[1], 10) + 1}"]`)

                    if(welcomeSectionNext !== null && welcomeSectionNext !== undefined) {
                        const data = welcomeSectionActive.shadowRoot.querySelector('.hasAnimation')
                        const image = welcomeSectionActive.shadowRoot.querySelector(`div[class*="section_content_item_img"]`)
                        image.style.backgroundPositionY = `-5vh`
                        self.section = welcomeSectionNext.dataset.id
                        self.class = `fer-scroll_${welcomeSectionNext.dataset.id}`
                        welcomeLogo.class = `welcome-logo_${welcomeSectionNext.dataset.id}`
                        const step = welcomeSectionNext.dataset.id.split('_')[1]
                        console.log('====== welcomeSectionNext =========', welcomeSectionActive)
                        image.style.backgroundPositionY = `10vh`

                        scroll(welcomeSectionNext.getBoundingClientRect().y * step + 5, 2000, welcomeSectionNext, data)
                        // data.style.transform = `translateY(700vh)`
                        // console.log('ddddddddddddddddddddd', data)
                        // data.style.transform =  `translateY(-100vh)`
                        // images.forEach(item => {
                            // item.style.transition =  `transform 10s ease 0s`
                            // item.style.transform = `translateY(-100vh)`
                        // })
                        // welcomeSectionNext.style.transition =  `transform 0s ease 0s`
                        // welcomeSectionNext.style.transform =  `translateY(-200vh)`

                        // data.style.transform =  `translateY(100vh)`
                        // scrollTo(document.body, );
                        // for (let y = 0; y <= 4200; y += 100) {
                        //     window.scrollTo({top: y, behavior: 'smooth'})
                        //     await scrollDelay(40)
                        // }
                        // welcomeSectionNext.scrollIntoView({block: "center", behavior: "smooth"});
                    }
                }
            }
        })
    })
}
