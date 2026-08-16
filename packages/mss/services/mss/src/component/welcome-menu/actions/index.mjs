import { initSections } from '../custom/index.mjs';
import { Models } from '../../../models/index.mjs';
import { store, сonfigRouter } from '../../../this/index.mjs';

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        let taskRelation = undefined;
        const service = store.get('current_service');

        if (service === 'mss') {
            taskRelation = {};
            taskRelation.events = {};
            taskRelation.events['API-RELATION'] = сonfigRouter.get();

            for (let i = 0; i < taskRelation.events['API-RELATION'].length; ++i) {
                const item = taskRelation.events['API-RELATION'][i];
                self.insertAdjacentHTML('beforeend', `
                <fer-button
                  data-services-path="mss"
                  data-value="${item.value}"
                  slot="button-${i}"
                  data-id="${i}"
                  data-type="welcome-menu"
                  data-css-shadow="menu"
                >
                    <p>${item.name}</p>
                </fer-button>
            `);
            }
        }

        const method = await initSections(self);

        resolve({
            apiButton: async (event) => {
                document.dispatchEvent(new CustomEvent(`api-button-enable-or-disable`, {
                    detail: {
                        disabled: 'true',
                        ...event.detail
                    }
                }));

                method.activeAnimation(event);
                method.animateMenu(event);
            }
        });
    });
};

export default {
    description: 'action'
};