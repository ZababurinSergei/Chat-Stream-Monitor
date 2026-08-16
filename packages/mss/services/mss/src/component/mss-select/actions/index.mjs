export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        let dropdownItems = undefined
        const dropdownBtn = self.shadowRoot.querySelector('[class*="dropdown__button"]');
        const dropdownList = self.shadowRoot.querySelector('.dropdown__list');
        try {
            dropdownItems = dropdownList.querySelectorAll('.dropdown__list-item');
        } catch (e) {

            console.log('self', self)
            
        }

        // const dropdownItems = dropdownList?.querySelectorAll('[class*="dropdown__list-item"]');
        const dropdownInput = self.shadowRoot.querySelector('[class*="dropdown__input_hidden"]')
        const arrow = self.shadowRoot.querySelector('.dropdown__button_arrow');

        resolve({
            under: (event) => {
                console.log('===========================================================')
                const withinBoundaries = event.composedPath().includes(mssButton);
                if (!withinBoundaries ) {
                    menu.classList.remove('dropdown__list_visible')
                }
            },
            keydown: (event) => {
                if( event.key === 'Tab' || event.key === 'Escape' ) {
                    arrow.classList.remove('dropdown__arrow_active');
                    dropdownBtn.classList.remove('dropdown__button_active');
                    dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            click: (event) => {
                if ( event.target !== dropdownBtn ) {
                    // arrow.classList.remove('dropdown__arrow_active');
                    // dropdownBtn.classList.remove('dropdown__button_active');
                    // dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            ferSelect: (event) => {
                if(event.detail.action === 'disabled' && event.detail.id !== self.id) {
                    arrow.classList.remove('dropdown__arrow_active');
                    dropdownBtn.classList.remove('dropdown__button_active');
                    dropdownList.classList.remove('dropdown__list_visible');
                }
            },
            clickDropdownBtn: (event) => {
                const rootElement = event.currentTarget.getRootNode().host

                document.dispatchEvent(new CustomEvent(`fer-select`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action: 'disabled',
                        id: rootElement.id
                    }
                }));

                const buttonActive = self.shadowRoot.querySelector('[class*="dropdown__button"]')
                dropdownList.classList.toggle('dropdown__list_visible');
                buttonActive.classList.toggle('dropdown__button_active');
                arrow.classList.toggle('dropdown__arrow_active');
            },
            clickDropdownItems: (event) => {
                dropdownItems.forEach(function(el) {
                    arrow.classList.remove('dropdown__arrow_active');
                    el.classList.remove('dropdown__list-item_active');
                })

                event.target.classList.add('dropdown__list-item_active');
                dropdownBtn.classList.toggle('dropdown__button_active');
                dropdownBtn.textContent = ''
                dropdownBtn.textContent = event.target.textContent;
                dropdownInput.value = event.target.dataset.value;

                const rootNode = self.getRootNode().host

                if(rootNode.tagName.toLowerCase() === 'fer-pagination') {
                    rootNode.offset = 0
                    rootNode.limit = parseInt(event.target.textContent, 10)
                    const ferTable = rootNode.closest('fer-table')
                    ferTable.refresh()
                }


                if(rootNode.tagName === 'FER-TABLE') {
                    const welcomeSection = self.getRootNode().host.closest('welcome-section')
                    const subscriptionSetting = welcomeSection.getState('post:/api/v1/subscription/setting')
                    subscriptionSetting[0].value = event.target.dataset.code

                    if(!Array.isArray(subscriptionSetting)) {
                        console.log('subscriptionSetting', subscriptionSetting)
                        debugger
                    }
                    welcomeSection.setState('post:/api/v1/subscription/setting', subscriptionSetting)
                }

                if(rootNode.tagName.toLowerCase() === 'fer-dialog') {
                    if(rootNode.dataset.id === '7') {
                        const service = document.querySelector('.service')
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${rootNode.dataset.id}"]`)
                        let subscription = welcomeSection.getState('subscription')

                        if(self.dataset.hasOwnProperty('interactionId')) {
                            subscription.interactionId = self.dataset.interactionId
                        }

                        if(self.dataset.hasOwnProperty('recipientId')) {
                            subscription.recipientId = self.dataset.recipientId
                        }

                      welcomeSection.setState('subscription', subscription)
                    }

                    if(rootNode.dataset.id === '6_0') {
                        const service = document.querySelector('.service')
                        const welcomeSection = service.querySelector(`welcome-section[data-id="${rootNode.dataset.id}"]`)
                        let settings = welcomeSection.getState('rule/settings')

                        if(self.dataset.hasOwnProperty('interactionId')) {
                            settings.interactionId = self.dataset.interactionId
                        }

                        if(self.dataset.hasOwnProperty('headerId')) {
                            console.log('self.dataset', self.dataset)
                            settings.headerId = self.dataset.headerId
                        }

                   console.log('===== SELECT ==========', settings)
                        welcomeSection.setState('rule/settings', settings)
                    }
                }

                if(event.target.dataset.snapshotId) {
                    self.dataset.snapshotId = event.target.dataset.snapshotId
                }

                if(event.target.dataset.name) {
                    self.dataset.name = event.target.dataset.name
                }

                if(event.target.dataset.code) {
                    self.dataset.code = event.target.dataset.code
                }

                if(event.target.dataset.eventId) {
                    self.dataset.eventId = event.target.dataset.eventId
                }

                if(event.target.dataset.directoryId) {
                    self.dataset.directoryId = event.target.dataset.directoryId
                }

                if(event.target.dataset.value) {
                    self.dataset.value = event.target.dataset.value
                }

                if(event.target.dataset.eventSnapshotId) {
                    self.dataset.eventSnapshotId = event.target.dataset.eventSnapshotId
                }

                if(event.target.dataset.eventRegionId) {
                    self.dataset.eventRegionId = event.target.dataset.eventRegionId
                }

                if(event.target.dataset.regionId) {
                    self.dataset.regionId = event.target.dataset.regionId
                }

                if(event.target.dataset.snapshotId) {
                    self.dataset.snapshotId = event.target.dataset.snapshotId
                }

                if(event.target.dataset.snapshotId) {
                    self.dataset.schemaId = event.target.dataset.schemaId
                }

                if(event.target.dataset.id) {
                    self.dataset.id = event.target.dataset.id
                }

                if(event.target.dataset.hasOwnProperty('recipientId')) {
                    self.dataset.recipientId = event.target.dataset.recipientId
                }

                if(event.target.dataset.hasOwnProperty('interactionId')) {
                    self.dataset.interactionId = event.target.dataset.interactionId
                }

                if(event.target.dataset.hasOwnProperty('headerId')) {
                    self.dataset.headerId = event.target.dataset.headerId
                }

                dropdownList.classList.remove('dropdown__list_visible');
            }
        })
    })
}

export default {
    description: 'action'
}