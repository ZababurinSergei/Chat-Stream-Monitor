import { activeClass, animationCount, config, events, events_d, store } from '../../../this/index.mjs';
import { initSections } from '../custom/index.mjs';
import { Models } from '../../../models/index.mjs';

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const models = await Models(self);

        const method = await initSections(self);
        let start = null;
        let position = 0;
        const template = method.get.template();

        let description = self.shadowRoot.querySelector('.description');
        let content = self.shadowRoot.querySelectorAll('.text-offset');
        let imageScale = self.shadowRoot.querySelectorAll('.image-scale');

        let menuFormEmail = self.shadowRoot.querySelector('.description-without-background-item-4');

        let isAnimation = false;
        let section = {};

        section = self.assignedSlot.closest('section');
        let menuButtons = section.closest('.welcome__book').querySelector('slot[name="welcome-menu"]').assignedElements()[0].querySelectorAll('fer-button');

        const activeSection = () => {
            for (let i = 0; i < menuButtons.length; ++i) {
                if (menuButtons[i].classList.contains(activeClass)) {
                    return parseInt(menuButtons[i].dataset.id, 10);
                }
            }
            return 0;
        };

        let hashContent = {};
        let menu = {};

        if (self.dataset.id === '2_0') {
            hashContent = self.shadowRoot.querySelectorAll('[data-hash-content]');
            menu = self.shadowRoot.querySelector('.conteiner__fer-manifest');
        }

        resolve({
            manifestDescriptionChange: (event) => {
                const manifestData = self.getState('manifest');
                manifestData.manifest.description = event.currentTarget.value;
                self.setState('manifest', manifestData);
                const button = self.querySelector('fer-button[slot="manifest-button__save"]');
                const buttonCancel = self.querySelector('fer-button[slot="manifest-button__cancel"]');
                const textBotton = buttonCancel.shadowRoot.querySelector('p');
                button.open = true;
                textBotton.textContent = 'Отмена';

                delete manifestData.manifest.snapshotId;
                console.log('###################################', manifestData.manifest.snapshotId);
                self.setState('isVerification', false);
            },
            eventTitle: (event) => {
                const data = self.getState('event');
                data.title = event.currentTarget.value;
                self.setState('event', data);
            },
            eventDescription: (event) => {
                const data = self.getState('event');
                data.description = event.currentTarget.value;
                self.setState('event', data);
            },
            click: (event) => {
                if (event.target.tagName === 'LI') {
                    let welcomeMenu = self.getRootNode().querySelector('welcome-menu');
                    const activeMenu = welcomeMenu.querySelector(`.${activeClass}`);
                    console.log('🟣 welcome-section CustomEvent change-views: ', event.target);

                    store.set('section', activeMenu.dataset.id);
                    window.dispatchEvent(new CustomEvent('change-views', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            id: activeMenu.dataset.id,
                            type: 'transform',
                            action: `to`,
                            section: event.target.dataset.id
                        }
                    }));
                }
            },
            animationstart: (event) => {
                animationCount.increment();
                const count = animationCount.get();
                const activeId = activeSection();

                const id = parseInt(section.dataset.id, 10);

                if (count === 1) {
                    animationCount.setDirection(activeId > id);
                }

                if (description !== null) {
                    description.style.setProperty('--offset', `0`);
                    isAnimation = true;
                }

                if (imageScale.length !== 0) {
                    isAnimation = true;
                }
            },
            animationend: (event) => {
                isAnimation = false;
                const animationEndCount = animationCount.decrement();
                const currentId = method.current();
                const id = parseInt(event.currentTarget.dataset.id, 10);
                const section = self.assignedSlot.closest('section');

                if (event.animationName === 'inPage') {

                    method.clearClass(section);
                    console.log('ddddddddddddddddddddddddddddddddddddddddddddd')
                    section.classList.remove('parallax-container-off');
                    section.classList.replace('scrollIn', 'parallax-container-on');
                } else if (event.animationName === 'outPage') {

                    method.clearClass(section);
                    section.classList.replace('parallax-container-on', 'parallax-container-off');
                    section.classList.remove('scrollOut');
                } else if (event.animationName === 'scrollTop') {
                    method.clearClass(section);
                    if (config.page.first.isDynamic) {
                        section.classList.remove('animation');
                        section.classList.remove('scrollTopDown');
                    }
                }
                if (animationEndCount === 0) {

                    events('fer-button-in', {
                        type: 'welcome-menu',
                        action: 'enable'
                    });

                    events_d('api-button-enable-or-disable', {
                        disabled: 'false'
                    });
                }
            },
            onWheel: (event) => {
                event = event || window.event;
                let delta = event.deltaY || event.detail || event.wheelDelta;
                position = position + delta;
            },
            hashchange: (event) => {
                if (self.dataset.id === '2_0') {
                    hashContent.forEach(item => {
                        if (window.location.hash === item.dataset.hashContent) {
                            // console.log(item.dataset.hashContent)
                            let gap = 0;
                            if (item.dataset.hashContent === '#general') {
                                // gap = 3 + 0.20833
                                // menu.style.width = `calc(100% - ${gap}vw)`
                            } else if (item.dataset.hashContent === '#verification') {

                                const manifestList = models.post.manifest.list();
                                console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ >>>', manifestList);
                                // gap = 6 + 0.20833 * 2   calc(100% - 6.20833vw)
                                // menu.style.width = `calc(100% - ${gap}vw)`
                            } else {
                                // menu.style.width = `calc(100% - 18.47vw)`
                            }

                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }

                    });

                    // console.log('======= SECTION ===== HASH ====', window.location.hash, self.dataset.id)
                }
            }
        });
    });
};

export default {
    description: 'action'
};