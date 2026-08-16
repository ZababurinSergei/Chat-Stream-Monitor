import { store, task } from '../../../../../../system/src/this/index.mjs';

export default async (self, actions) => {
    let section = self.assignedSlot.closest('section')
    const description = self.shadowRoot.querySelector(`ul[class*="description-ul"]`)

    const eventFerRegion_1 = self.querySelector('[slot="fer-region_0"]')
    const eventFerRegion_2 = self.querySelector('[slot="fer-region_1"]')

    const manifestDescription = self.shadowRoot.querySelector('.fer-codemirror-description')

    const eventTitle = eventFerRegion_1?.shadowRoot.querySelector('#title')
    const eventDescription = eventFerRegion_2?.shadowRoot.querySelector('[class*="fer-codemirror-description"]')

    const pathname = store.get('pathname').pathname
    const { router } = await import(`${pathname}/this/index.mjs`)

    const route = await router(self, { location })

    return {
        init: () => {
            if(description !== null) {
                description.addEventListener("click", actions.click);
            }

            if(manifestDescription) {
                manifestDescription.addEventListener("input", actions.manifestDescriptionChange);
            }

            eventDescription?.addEventListener('input', actions.eventDescription);
            eventTitle?.addEventListener('input', actions.eventTitle);
            window.addEventListener('hashchange', actions.hashchange );
            section.addEventListener("animationiteration", actions.animationiteration);
            section.addEventListener("animationstart", actions.animationstart);
            section.addEventListener('animationend', actions.animationend);

            document.dispatchEvent(new CustomEvent(`api-button-service-onload`, {
                bubbles: true,
                composed: true,
                detail: {
                    dataset: {
                        id: self.dataset.id
                    }
                }
            }));

            //TODO вынести этот паттерн с библиотеку
            if(route.key === self.dataset.id) {
                route.isActive = true;
                if (route.hasOwnProperty('hash')) {
                    route.isGenesis = true;
                }
            }

            if(self.dataset.id?.split('_').length === 1 && self.dataset.to?.split('_')[0].length !== 0) {
                route.to = self.dataset.to
            } else {
                route.to = `${route.key}_0`
            }

            if(route.to === self.dataset.id && route.link) {
                task.set(true, '', 'red', {
                    event: "TEST"
                }, 'action-table').catch(e => {
                    console.log('error devtool', e)
                })
            }
        },
        terminate: () => {
            if(description !== null) {
                description.removeEventListener("click", actions.click);
            }

            window.removeEventListener('hashchange', actions.hashchange );
            section.removeEventListener("animationiteration", actions.animationiteration);
            section.removeEventListener("animationstart", actions.animationstart);
            section.removeEventListener('animationend', actions.animationend);
        }
    }
}