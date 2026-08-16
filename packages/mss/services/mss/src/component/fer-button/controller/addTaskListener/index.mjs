import { store, сonfigRouter } from '../../../../this/index.mjs';

export default async (self, actions) => {
    const { task } = await import('/services/system/src/this/index.mjs');

    return {
        init: async () => {
            if (self.dataset.type === 'welcome-menu') {
                let taskRelation = undefined;
                const service = store.get('current_service');
                const pathname = store.get('pathname').pathname;

                if (service === 'mss') {
                    taskRelation = {};
                    taskRelation.events = {};
                    taskRelation.events['API-RELATION'] = сonfigRouter.get();
                } else {
                    const data = await import(`${pathname}/this/index.mjs`);
                    taskRelation = data.taskRelation;
                }

                for (let i = 0; i < taskRelation.events['API-RELATION'].length; ++i) {
                    const item = taskRelation.events['API-RELATION'][i];
                    if (self.dataset.value === item.value) {
                        task.get(true, 'await', '5', '', item.value, async (object) => {
                            if (object.relation === self.dataset.value) {
                                console.log(`   🟢 CLICK TO FER-BUTTON  ${object.relation}`);

                                const menuButton = self.shadowRoot.querySelector('p');
                                const id = parseInt(object.substrate.events[0].key, 10);
                                const welcomeSection = self.closest('.service').querySelector(`welcome-section[data-id="${id}"]`);
                                const ferTable = welcomeSection.querySelectorAll('fer-table');

                                const mssFilter = document.querySelector('mss-filter')
                                const mssInputs = mssFilter.shadowRoot.querySelectorAll('mss-input')

                                mssInputs.forEach(item => {
                                    item.clean = true
                                })

                                const ferPagination = welcomeSection.querySelector('fer-pagination')
                                welcomeSection.cleanState('all')
                                ferPagination?.cleanState('all')

                                store.set('section', id);

                                ferTable.forEach(item => {
                                    item.refresh();
                                });

                                const sections = welcomeSection.assignedSlot.closest('div').querySelectorAll('section');

                                sections.forEach(item => {
                                    if (item.classList.contains('active')) {
                                        const welcomeSection = item.querySelector('slot').assignedNodes({ flatten: false })[0];
                                        const body = welcomeSection.querySelector('fer-table').shadowRoot.querySelector('.body');
                                        body.innerHTML = '';
                                        item.classList.remove('active');
                                        welcomeSection.style.display = 'none'
                                    }

                                    if (id.toString() === item.dataset.id) {
                                        welcomeSection.style.display = 'flex'
                                        item.classList.add('active');
                                    }
                                });

                                menuButton.click();
                            }

                            object.callback({
                                _scriptDir: import.meta.url,
                                status: true
                            });
                        });
                    }
                }
            }
        },
        terminate: () => {

        }
    };
}