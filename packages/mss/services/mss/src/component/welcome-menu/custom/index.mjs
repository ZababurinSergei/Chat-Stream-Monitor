const {
    activeClass,
    router,
    events,
    events_d,
    animationCount,
    config,
    delay,
    size
} = await import('../../../this/index.mjs')

let isNextCurrent = false
let childrentId = {}
let children = {}

export const initSections = (self) => {
    return new Promise(async (resolve, reject) => {
        let buttons = self.querySelectorAll('fer-button')
        let sections = self.assignedSlot.closest('div').querySelectorAll('.slider')
        let welcomeSections = self.getRootNode().querySelectorAll('welcome-section')
        let ferScroll = self.getRootNode().querySelector('fer-scroll')
        let welcomeLogo = self.getRootNode().querySelector('welcome-logo')

        const serviceSections = self.closest('.service').shadowRoot.querySelector('.welcome-body').querySelectorAll('section')

        const routes = await router(self, {location})
        const key = routes.key.toString()

        for(let i = serviceSections.length -1; i > -1; --i) {
            serviceSections[i].classList.replace('parallax-container-off','parallax-container-on')
            if(serviceSections[i].dataset.id.toString() === key.toString()) {
                serviceSections[i].classList.add('active')
            }
        }

        // for(let i = key; i > -1; --i) {
        //     console.log('------------- 2 -----------------', i, key)
        //     if(!serviceSections[i]) {
        //         continue
        //     }
        //     console.log('------------------------------', serviceSections[i], i, key)
        //     serviceSections[i].classList.replace('parallax-container-off','parallax-container-on')
        //     if(i.toString() === key.toString()) {
        //         serviceSections[i].classList.add('active')
        //     }
        // }

        buttons[routes.key]?.classList.add(activeClass)

        welcomeSections.forEach(section => {
            // console.log('section.dataset.id', section.dataset.id)
            if(section.dataset.id === key || section.dataset.id === '6_0' || section.dataset.id === '7_0'|| section.dataset.id === '5_0') {
                section.style.display = 'flex'
            } else {
                section.style.display = 'none'
            }
            if (section.hasAttribute('children')) {
                childrentId = section.getAttribute('children');
                children = section.shadowRoot.querySelectorAll('section[class*="_children"]')
                section.setAttribute('children', `0__0_0`);
            }
        })

        const getShadowSection = (sectionArray, currentId) => {
            for (let i = 0; i < sectionArray.length; ++i) {
                let id = sectionArray[i].classList[0].split('_')
                if (parseInt(id.at(-1)) === currentId) {
                    return sectionArray[i]
                }
            }
            return undefined
        }
        const getWelcomeSection = (data) => {
            for (let i = 0; i < welcomeSections.length; ++i) {
                if (data.isChildren) {
                    if (welcomeSections[i].dataset.id === data.section) {
                        return welcomeSections[i]
                    }
                } else {
                    if (welcomeSections[i].dataset.id === data.raw) {
                        return welcomeSections[i]
                    }
                }
            }
            return undefined
        }

        const activeAnimationMenu = (currentId, id) => {
            let section = {}
            section.isChildren = false
            let idCurrent = currentId
            if (currentId.startsWith('0__')) {
                const tmp = currentId.split('__')
                const tmpChild = tmp[1].split('_')
                section.children = {
                    section: tmpChild[0],
                    item: tmpChild[1]
                }
                section.isChildren = true
                section.section = tmp[0]

                section.requestId = undefined
            }

            if (section.isChildren) {
                idCurrent = section.section
            }

            if (idCurrent === "0" && id === "1") {
                if (self.classList.contains('sliderOut')) {
                    self.classList.replace('sliderOut', 'sliderIn')
                } else {
                    self.classList.add('sliderIn')
                }
            }

            section = {}
            section.isChildren = false
            idCurrent = id
            if (idCurrent.startsWith('0__')) {
                const tmp = idCurrent.split('__')
                const tmpChild = tmp[1].split('_')
                section.children = {
                    section: tmpChild[0],
                    item: tmpChild[1]
                }
                section.isChildren = true
                section.section = tmp[0]

                section.requestId = undefined
                idCurrent = tmp[0]
            }

            if (currentId === '1' && idCurrent === "0") {
                if (self.classList.contains('sliderIn')) {
                    self.classList.replace('sliderIn', 'sliderOut')
                } else {
                    self.classList.add('sliderOut')
                }
            }
        }
        const activeButton = (event) => {
            let activeButton = false
            for (let item of buttons) {
                if (item.dataset.id === event.detail.id) {
                    activeButton = item.dataset.id
                    item.classList.add(activeClass)
                } else {

                    item.classList.remove(activeClass)
                }
                // const id = parseInt(event.detail.id, 10) - 1 >= 0 ? parseInt(event.detail.id, 10) : 0
                // if ( id === parseInt(item.dataset.id, 10)) {
                //     item.classList.add(activeClass)
                // } else {
                //     item.classList.remove(activeClass)
                // }
            }

            return activeButton
        }
        const current = (event) => {
            let currentButton = 0;
            for (let i = 0; i < buttons.length; ++i) {
                if (buttons[i].classList.contains(activeClass)) {
                    currentButton = buttons[i].dataset.id
                    break
                }
            }
            return currentButton
        }

        const backgroundSections = [
            'transparent',
            '#666666',
            '#666666',
            '#666666',
            'transparent',
        ]
        const preAnimation = (section) => {
            const id = parseInt(section.dataset.id, 10)

            console.log('========= section ============', section)
            const data = section.querySelector('slot').assignedElements()[0].shadowRoot.querySelector('.images') //parallax
            const image = data.querySelector('img')
            if(image !== null) {
                data.style.background = backgroundSections[id]
                if (backgroundSections[id] !== 'transparent') {
                    image.style.mixBlendMode = 'multiply'
                }
            }
        }

        resolve({
            activeAnimation: async (event) => {
                events('fer-button-in', {
                    type: 'welcome-menu',
                    action: 'disable'
                })

                let childrenIdFromAttribute = 0
                let sectionData = {}
                sectionData.raw = event.detail.id
                sectionData.isChildren = false
                if (event.detail.id.startsWith('0__')) {
                    const tmp = event.detail.id.split('__')
                    const tmpChild = tmp[1].split('_')
                    sectionData.children = {
                        section: tmpChild[0],
                        item: tmpChild[1]
                    }
                    sectionData.isChildren = true
                    sectionData.section = tmp[0]

                    sectionData.requestId = undefined
                    sectionData.isFirst = sectionData.section.split('_').length === 1
                }

                const isUp = animationCount.getDirection()
                const currentId = current(event)
                const section = getWelcomeSection(sectionData)

                if (sectionData.isChildren) {
                    // welcomeLogo.section = `${sectionData.section}_0`
                    // welcomeLogo.dataset.id = sectionData.section
                    // ferScroll.section = sectionData.raw
                    // ferScroll.class = `fer-scroll_${sectionData.raw}`
                    // welcomeLogo.class = `welcome-logo_${sectionData.section}_0`
                } else {
                    // welcomeLogo.section = `${event.detail.id}_0`
                    // welcomeLogo.dataset.id = event.detail.id
                    // ferScroll.section = event.detail.id
                    // ferScroll.class = `fer-scroll_${event.detail.id}`
                    // welcomeLogo.class = `welcome-logo_${event.detail.id}_0`
                    // console.log('ssssssssssss',event.detail.id)
                    // 
                }


                let isNextCurrent = false
                let childrentId = {}
                let children = {}

                if (section?.hasAttribute('children')) {
                    children = section.shadowRoot.querySelectorAll('section[class*="_children"]')
                    let maxId = children.length

                    childrentId = section.getAttribute('children');
                    const sectionChildren = childrentId.split('__')
                    childrentId = sectionChildren[1].split('_')

                    let currentId = parseInt(childrentId[1], 10);

                    if (children.length !== 0) {
                        if (currentId < maxId) {
                            if (isUp) {
                                if (maxId > currentId) {
                                    section.setAttribute('children', `${sectionChildren[0]}__${childrentId[0]}_${currentId + 1}`);
                                    childrentId[1] = currentId + 1
                                    isNextCurrent = true
                                } else {
                                    section.setAttribute('children', `${sectionChildren[0]}__${childrentId[0]}_${currentId - 1}`);
                                    childrentId[1] = currentId - 1
                                    isNextCurrent = true
                                }
                            } else {
                                if (maxId >= currentId) {
                                    const id = currentId - 1 > 0 ? currentId - 1 : 0
                                    section.setAttribute('children', `${sectionChildren[0]}__${childrentId[0]}_${id}`);
                                    childrentId[1] = id
                                    isNextCurrent = true
                                }
                            }
                        } else {
                            if (isUp) {
                            } else {
                                const id = currentId - 1 > 0 ? currentId - 1 : 0
                                childrentId[1] = id
                                if (currentId === 1 && sectionData.isChildren) {
                                    isNextCurrent = !sectionData.isChildren;
                                } else {
                                    isNextCurrent = sectionData.isChildren;
                                }
                            }
                        }
                    }
                }

                if (isNextCurrent) {
                    const activeButtonId = activeButton(event)
                    const list = section.shadowRoot.querySelectorAll('.content')
                    let general = section.shadowRoot.querySelector('.image-general')

                    if (childrentId[1].toString() !== '0') {
                        const isUp = animationCount.getDirection()
                        const item = getShadowSection(children, parseInt(isUp ? childrentId[1] - 1 : childrentId[1], 10))

                        if (isUp) {
                            if (general.classList.contains('ease-out')) {
                                general.classList.replace('ease-out', 'ease-in')
                            } else {
                                general.classList.add('ease-in')
                            }

                            general.style.bottom = 0

                            if (list[0].classList.contains('descriptionDown')) {
                                list[0].classList.replace('descriptionDown', 'descriptionUp')
                            } else {
                                list[0].classList.add('descriptionUp')
                            }

                            if (list[1].classList.contains('descriptionDown2')) {
                                list[1].classList.replace('descriptionDown2', 'descriptionUp2')
                            } else {
                                list[1].classList.add('descriptionUp2')
                            }
                        } else {

                            // const height = getComputedStyle(document.documentElement).getPropertyValue('--main-height');
                            // console.log('dddddddddddddddd', height)
                            // section.shadowRoot.querySelector('.image-general').style.bottom = height

                            if (list[0].classList.contains('descriptionUp')) {
                                list[0].classList.replace('descriptionUp', 'descriptionDown')
                            } else {
                                list[0].classList.add('descriptionDown')
                            }

                            if (list[1].classList.contains('descriptionUp2')) {
                                list[1].classtrueList.replace('descriptionUp2', 'descriptionDown2')
                            } else {
                                list[1].classList.add('descriptionDown2')
                            }
                        }
                    } else {

                        const height = getComputedStyle(document.documentElement).getPropertyValue('--main-height').trim();

                        if (general.classList.contains('ease-in')) {
                            general.classList.replace('ease-in', 'ease-out')
                        } else {
                            general.classList.add('ease-out')
                        }

                        section.shadowRoot.querySelector('.image-general').style.bottom = `-${height}`

                        const item = getShadowSection(children, 0)

                        if (list[0].classList.contains('descriptionUp')) {
                            list[0].classList.replace('descriptionUp', 'descriptionDown')
                        } else {
                            list[0].classList.add('descriptionDown')
                        }

                        if (list[1].classList.contains('descriptionUp2')) {
                            list[1].classList.replace('descriptionUp2', 'descriptionDown2')
                        } else {
                            list[1].classList.add('descriptionDown2')
                        }
                    }

                    // activeButton(event)
                    events('fer-button-in', {
                        type: 'welcome-menu',
                        action: 'enable'
                    })

                    events_d('api-button-enable-or-disable', {
                        disabled: "false"
                    })

                } else {
                    // events('welcome-header', {
                    //     isDisable: true
                    // })

                    const activeButtonId = activeButton(event)
                    activeAnimationMenu(currentId, sectionData.raw)

                    let id = parseInt(sectionData.raw, 10)

                    if (id.toString() === "0") {
                        // welcomeLogo.style.opacity = '0'
                        // welcomeLogo.disabled = true
                    } else {
                        // welcomeLogo.style.opacity = '1'
                        // welcomeLogo.disabled = false
                    }

                    if (id.toString() !== currentId.toString()) {
                        const isNext = (id - 1) === currentId || (id + 1) === currentId
                        const isBack = currentId >= id

                        if (!isBack) {
                            for (let i = 0; i < sections.length; ++i) {
                                const itemId = parseInt(sections[i].dataset.id, 10)
                                if (itemId === id) {

                                    // preAnimation(sections[itemId])
                                    // isNext ? '' : await delay(300)
                                    sections[itemId].classList.add('animation2')
                                    sections[itemId].classList.add('scrollIn')
                                } else if (itemId < id) {
                                    
                                    if (!sections[i].classList.contains('scrollIn') && !sections[i].classList.contains('parallax-container-on')) {
                                        sections[itemId].classList.add('animation2')
                                        sections[itemId].classList.add('scrollIn')
                                        // isNext ? '' : await delay(300)
                                    } else {
                                        if (config.page.first.isDynamic) {
                                            sections[itemId].classList.add(currentId === 0 ? 'animation' : 'animation4')
                                            sections[itemId].classList.add('scrollIn')
                                        }
                                    }
                                }
                            }
                        } else {
                            for (let i = (sections.length - 1); i >= 1; --i) {
                                const itemId = parseInt(sections[i].dataset.id, 10)

                                if (id < itemId) {
                                    // console.log('eeeeeeeeeeeeeeeeeee',{
                                    //     sections: sections,
                                    //     section: sections[id],
                                    //     id: id
                                    // })
                                    // preAnimation(sections[id])

                                    
                                    if (sections[i].classList.contains('parallax-container-on')) {
                                        if (id + 1 === itemId) {
                                            if (config.page.first.isDynamic) {
                                                sections[i - 1].classList.add('animation3')
                                                sections[i - 1].classList.add('scrollTopDown')
                                            }
                                        }

                                        sections[i].classList.add('animation5')
                                        sections[i].classList.add('scrollOut')
                                        // isNext ? '' : await delay(300)
                                    }
                                }
                            }

                            // console.log('===========================================', welcomeSections[id])
                            const currentChildren = welcomeSections[id].getAttribute('children')

                            if (currentChildren !== null && activeButtonId !== currentChildren) {

                                const list = welcomeSections[id].shadowRoot.querySelectorAll('.content')
                                let general = welcomeSections[id].shadowRoot.querySelector('.image-general')

                                let dataId = currentChildren.split('_')[1]

                                if (dataId !== '0') {
                                    const isUp = animationCount.getDirection()
                                    const item = getShadowSection(children, parseInt(isUp ? dataId - 1 : dataId, 10))

                                    if (isUp) {
                                        if (general.classList.contains('ease-out')) {
                                            general.classList.replace('ease-out', 'ease-in')
                                        } else {
                                            general.classList.add('ease-in')
                                        }

                                        general.style.bottom = 0

                                        if (list[0].classList.contains('descriptionDown')) {
                                            list[0].classList.replace('descriptionDown', 'descriptionUp')
                                        } else {
                                            list[0].classList.add('descriptionUp')
                                        }

                                        if (list[1].classList.contains('descriptionDown2')) {
                                            list[1].classList.replace('descriptionDown2', 'descriptionUp2')
                                        } else {
                                            list[1].classList.add('descriptionUp2')
                                        }
                                    } else {
                                        if (general.classList.contains('ease-in')) {
                                            general.classList.replace('ease-in', 'ease-out')
                                            general.style.bottom = "-100vh"
                                            welcomeSections[id].setAttribute('children', '0__0_0')
                                        } else {
                                            general.classList.add('ease-out')
                                        }

                                        if (list[0].classList.contains('descriptionUp')) {
                                            list[0].classList.replace('descriptionUp', 'descriptionDown')
                                        } else {
                                            list[0].classList.add('descriptionDown')
                                        }

                                        if (list[1].classList.contains('descriptionUp2')) {
                                            list[1].classList.replace('descriptionUp2', 'descriptionDown2')
                                        } else {
                                            list[1].classList.add('descriptionDown2')
                                        }
                                    }
                                } else {
                                    const height = getComputedStyle(document.documentElement).getPropertyValue('--main-height').trim();

                                    if (general.classList.contains('ease-in')) {
                                        general.classList.replace('ease-in', 'ease-out')
                                    } else {
                                        general.classList.add('ease-out')
                                    }

                                    section.shadowRoot.querySelector('.image-general').style.bottom = `-${height}`

                                    const item = getShadowSection(children, 0)

                                    if (list[0].classList.contains('descriptionUp')) {
                                        list[0].classList.replace('descriptionUp', 'descriptionDown')
                                    } else {
                                        list[0].classList.add('descriptionDown')
                                    }

                                    if (list[1].classList.contains('descriptionUp2')) {
                                        list[1].classList.replace('descriptionUp2', 'descriptionDown2')
                                    } else {
                                        list[1].classList.add('descriptionDown2')
                                    }
                                }

                                events('fer-button-in', {
                                    type: 'welcome-menu',
                                    action: 'enable'
                                })


                                events_d('api-button-enable-or-disable', {
                                    disabled: "false"
                                })
                            }
                        }
                    }
                }
            },
            animateMenu: (event) => {
                const square = self.shadowRoot.querySelector('.body-item_square')
                const fontSize = 1.6;
                const stepFontSize = 0.18
                const opaticyDefault = 1
                const stepOpacity = 0.15
                let id = event.detail.id

                let buttonActive = {}

                let index = 0
                for (let i = 0; i < buttons.length; ++i) {
                    if (buttons[i].dataset.id === id) {
                        index = i
                        buttonActive = buttons[i]
                        break
                    }
                }

                let setp = index
                let isFirstActiveButton = true
                let leftInd = 1
                let rightInd = 1
                for (let i = 0; i < buttons.length; ++i) {
                    const left = i - index
                    if (left < 0) {
                        const leftIndex = (i - index + 1) * -1
                        const activeItemLeft = buttons[leftIndex].shadowRoot.querySelector('p')
                        const opacity = opaticyDefault - stepOpacity * leftInd
                        const currentFontSize = fontSize - stepFontSize * leftInd
                        activeItemLeft.style.fontSize = `${currentFontSize}rem`
                        activeItemLeft.style.fontWeight = `400`
                        activeItemLeft.style.opacity = `${opacity}`
                        leftInd = leftInd + 1
                    }

                    const rightIndex = setp

                    if (setp - buttons.length < 0) {
                        const activeItemRight = buttons[rightIndex].shadowRoot.querySelector('p')

                        if (isFirstActiveButton) {
                            activeItemRight.style.opacity = `${opaticyDefault}`
                            activeItemRight.style.fontSize = `${fontSize}rem`
                            activeItemRight.style.fontWeight = `600`
                            if(square !== null) {
                                square.style.top = `${4 * index}rem`
                            }
                            isFirstActiveButton = false
                        } else {
                            const opacity = opaticyDefault - stepOpacity * rightInd
                            const currentFontSize = fontSize - stepFontSize * rightInd
                            activeItemRight.style.fontSize = `${currentFontSize}rem`
                            activeItemRight.style.opacity = `${opacity}`
                            activeItemRight.style.fontWeight = `400`
                            rightInd = rightInd + 1
                        }
                    }
                    setp = setp + 1
                }
            }
        })
    })
};