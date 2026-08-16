import { router, store } from '../../../../this/index.mjs';
import { table, template } from '../../views/index.mjs';
import { task } from '/services/system/src/this/index.mjs';

const getState = async (self, route, actions, isCleanHTML = true) => {
    const tableMenu = self.shadowRoot.querySelector('.auction-data__table_header_img');
    let header = self.shadowRoot.querySelector('.auction-data__table_header');
    let body = self.shadowRoot.querySelector('.auction-data__table_body');
    let footer = self.shadowRoot.querySelector('.auction-data__table_footer');
    let container = self.shadowRoot.querySelector('.auction-data__table');
    const ferDialog = document.querySelector('fer-dialog');
    let pagination = self.querySelector('fer-pagination');
    let currentSection = self.closest('welcome-section');

    if (currentSection !== null) {
        // currentSection = currentSection.getRootNode().host
    } else {
        console.info('слот не задействован', {
            currentSection: currentSection,
            self: self
        });
    }

    const errorDialog = (message) => {
        ferDialog.open = {
            type: 'error',
            title: 'Ошибка',
            description: [{
                text: message
            }],
            button: [{
                type: 'cancel',
                description: 'Ok'
            }]
        };
    };

    const currentIdSection = currentSection !== null ? currentSection.dataset.id : -1;

    if (route.link && route.isGenesis === true) {
        switch (currentIdSection) {
        case '0':
            let query = {
                'condition': {
                    'snapshotIds': [
                        route.hash
                    ]
                }
            };
            task.get(true, 'await', '5', '', 'action-table', async (object) => {
                // console.log(`   💛🟢💛 PROPERTY ROUTER ${object.relation}`);
                history.pushState('Правила', {}, route.pathName);

                object.callback({
                    _scriptDir: import.meta.url,
                    status: true
                });
            });
            break;
        case '6':
            try {
                task.get(true, 'await', '5', '', 'action-table', async (object) => {
                    // console.log(`   💛🟢🟢🟢🔵🟢🟢🟢💛 RULES ROUTER`);

                    object.callback({
                        _scriptDir: import.meta.url,
                        status: false
                    });
                });
            } catch (e) {
                errorDialog(e);
            }
            break;
        case '7':
            try {
                task.get(true, 'await', '5', '', 'action-table', async (object) => {
                    // console.log(`   💛🔵🟢🟢🟢🟢🟢🟢🔵💛 SUBSCRIBE ROUTER`);

                    object.callback({
                        _scriptDir: import.meta.url,
                        status: false
                    });
                });
            } catch (e) {
                errorDialog(e);
            }
            break;
        case '5':
            try {
                task.get(true, 'await', '5', '', 'action-table', async (object) => {
                    // console.log(`   💛🔵🟢🟢🟢🟢🟢🟢🔵💛 SUBSCRIBE ROUTER`);

                    object.callback({
                        _scriptDir: import.meta.url,
                        status: false
                    });
                });
            } catch (e) {
                errorDialog(e);
            }
            break;
        case '5_0':
            try {
                task.get(true, 'await', '5', '', 'action-table', async (object) => {
                    // console.log(`   💛🔵🟢🟢🟢🟢🟢🟢🔵💛 SUBSCRIBE ROUTER`);

                    object.callback({
                        _scriptDir: import.meta.url,
                        status: false
                    });
                });
            } catch (e) {
                errorDialog(e);
            }
            break;
        default:
            console.warn('неизвестная секция fer-table', self.dataset.id);
            break;
        }

        actions.registry.item.click({
            target: {
                tagName: 'code'
            },
            currentTarget: {
                dataset: {
                    interactionId: route.link,
                    subscriptionId: route.link
                }
            }
        });

        return false;
    } else {
        const currentService = store.get('current_service');
        const pathname = store.get(`mount_${currentService}`).pathname;

        if (template.has(self.dataset.template)) {
            switch (self.dataset.template) {
            case 'card':
                const card = await table.get.card(self, route, ['registry']); //
                await template.get(self.dataset.template)[0].template(self, card, pathname, isCleanHTML);
                break;
            case 'registry':
                const registry = await table.get.registry(self, route);
                await template.get(self.dataset.template)[0].template(self, registry, pathname);
                break;
            default:
                console.error('неизвестная таблица 2', self.dataset.template);
                break;
            }
        } else {
            console.warn('нет темплейта', self);
        }

        let editButton = self.shadowRoot.querySelectorAll('.edit');
        let removeButton = self.shadowRoot.querySelectorAll('.delete');

        return {
            tableMenu: tableMenu,
            editButton: editButton,
            removeButton: removeButton
        };
    }
};

export default async (self, actions) => {
    let table = undefined;
    let state = undefined;
    const mssFilter = document.body.querySelector('mss-filter')
    const root = document.querySelector('mss-filter').shadowRoot.querySelector('.body')

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('invisible')
            } else {
                entry.target.classList.add('invisible')
            }
        })
    }, {
        threshold: 1,
        rootMargin: '-200px 0px -90px 0px',
    })

    return {
        item: {
            init: async (props = {}) => {
                if(props.hasOwnProperty('item')) {
                    const newItem = props.item.shadowRoot.querySelector('.body_tr.registry.object.new')
                    const buttonClose = newItem.querySelector('.footer.registry.button.cancel')
                    const buttonSave = newItem.querySelector('.footer.registry.button.save')
                    const buttonTags = newItem.querySelectorAll('.registry.button.tab')

                    buttonTags.forEach(item => {
                        item.addEventListener('click', actions.registry.new.field);
                    })

                    buttonClose.addEventListener('click', actions.registry.new.cancel);
                    buttonSave.addEventListener('click', actions.registry.new.save);

                } else {
                    const items = self.shadowRoot.querySelector('.new');
                    const inputs = items.querySelectorAll('.value');
                    const buttons = items.querySelectorAll('.button');


                    observer.observe(items)


                    inputs.forEach(item => {
                        if (item.classList.contains('name')) {
                            item.addEventListener('input', actions.card.name);
                        }

                        if (item.classList.contains('code')) {
                            item.addEventListener('input', actions.card.code);
                        }
                    });

                    buttons.forEach(item => {
                        if (item.classList.contains('delete')) {
                            item.addEventListener('click', actions.card.delete);
                        }

                        if (item.classList.contains('edit')) {
                            item.addEventListener('click', actions.card.edit);
                        }
                    });
                }
            },
            terminate: () => {
                const items = self.shadowRoot.querySelector('.new');

                if (items) {
                    const inputs = items.querySelectorAll('.value');
                    const buttons = items.querySelectorAll('.button');

                    const buttonClose = items.querySelector('.footer.registry.button.cancel')
                    const buttonSave = items.querySelector('.footer.registry.button.save')

                    const buttonTags = items.querySelectorAll('.registry.button.tab')

                    buttonTags.forEach(item => {
                        item.removeEventListener('click', actions.registry.new.field);
                    })

                    buttonClose?.removeEventListener('click', actions.registry.new.cancel);
                    buttonSave?.removeEventListener('click', actions.registry.new.save);


                    inputs?.forEach(item => {
                        if (item.classList.contains('name')) {
                            item.removeEventListener('input', actions.card.name);
                        }

                        if (item.classList.contains('code')) {
                            item.removeEventListener('input', actions.card.code);
                        }
                    });

                    buttons?.forEach(item => {
                        if (item.classList.contains('delete')) {
                            item.removeEventListener('click', actions.card.delete);
                        }

                        if (item.classList.contains('edit')) {
                            item.removeEventListener('click', actions.card.edit);
                        }
                    });

                    items.remove();
                }
            }
        },
        init: async (props = {}) => {
            const mssFilter = document.querySelector('mss-filter');
            const ferSelect = mssFilter.shadowRoot.querySelector('.mss-filter');
            const mssInput = mssFilter.shadowRoot.querySelectorAll('mss-input')

            let currentSection = self.closest('welcome-section');
            const section = store.get('section');

            // if(section.toString() === "7") {
                // debugger
                // ferSelect.style.display = 'flex'
            // }

            mssInput.forEach(item => {
                if(item.dataset.field === 'code') {
                    const input = item.shadowRoot.querySelector('input')

                    if(section.toString() === "7") {
                        input.placeholder = 'Код системы'
                        return;
                    }

                    if(section.toString() === "6") {
                        input.placeholder = 'Код взаимодействия'
                        return;
                    }

                    if(section.toString() === "0") {
                        input.placeholder = 'Код...'
                        return;
                    }

                    if(section.toString() === "100") {
                        input.placeholder = ''
                        return;
                    }

                    if(section.toString() === "5") {
                        // input.placeholder = 'Код...'
                        return;
                    }

                    if(section.toString() === "5_0") {
                        // input.placeholder = 'Код...'
                        return;
                    }

                    if(section.toString() === "6_0" || section.toString() === "7_0") {
                        return;
                    }

                    console.warn('неопределенный placeholder', section)
                } else if(item.dataset.field === 'export') {
                    // console.log('!!!!!!!!!!! надо заполнить')
                } else if(item.dataset.field === 'name') {
                    const input = item.shadowRoot.querySelector('input')
                    if(section.toString() === "7") {
                        input.placeholder = 'Код взаимодействия'
                        return;
                    }

                    if(section.toString() === "6") {
                        input.placeholder = 'Наименование взаимодействия'
                        return;
                    }

                    if(section.toString() === "5") {
                        input.placeholder = 'Наименование взаимодействия'
                        return;
                    }

                    if(section.toString() === "5_0") {
                        input.placeholder = 'Наименование взаимодействия'
                        return;
                    }


                    if(section.toString() === "0") {
                        input.placeholder = 'Наименование...'
                        return;
                    }

                    if(section.toString() === "100") {
                        input.placeholder = ''
                        return;
                    }

                    if(section.toString() === "6_0" || section.toString() === "7_0") {
                        return;
                    }

                    console.warn('неопределенный placeholder', section)
                } else {
                    console.warn('неизвестный field',item )
                }
            })

            window.dispatchEvent(new CustomEvent('mss-filter_update', {
                bubbles: true,
                composed: true
            }));

            if (currentSection === null) {
                console.info('слот не задействован', {
                    currentSection: currentSection,
                    self: self
                });
            }

            const currentIdSection = currentSection !== null ? currentSection.dataset.id : -1;

            let route = await router(self, { location });
            route.key = route.key.toString();

            if (currentIdSection.toString() === section.toString()) {
                route.isActive = true;
                route.isGenesis = false;

                if (section.toString().split('_').length === 1) {
                    route.isGenesis = true;
                }
            }

            route.to = route.isGenesis ? `${route.key}_0` : `${route.key}`;

            if (currentIdSection.toString() === section.toString()) {
                const { isCleanHTML } = props;

                state = await getState(self, route, actions, isCleanHTML === 'undefined' ? true : isCleanHTML);

                if (state) {
                    mssFilter.dataset.section = currentSection.dataset.id
                    mssFilter.dataset.rights = ''
                    mssFilter.dataset.rights = route.rights.join(' ')
                    document.addEventListener('fer-dialog_subscription_update', actions.CustomEvent.ferDialog.subscription.update)
                    document.addEventListener('fer-dialog_ruleSettings_update', actions.CustomEvent.ferDialog.ruleSettings.update)
                    document.addEventListener('fer-table_add_settingsRule', actions.CustomEvent.ferTable.add.settingsRule)
                    document.addEventListener('mss-filter-add-settingsRule', actions.CustomEvent.mssFilter.add.settingsRule)
                    document.addEventListener('fer-dialog_subscriptionSettings_delete', actions.CustomEvent.ferDialog.subscriptionSettings.delete);
                    document.addEventListener('fer-dialog_subscriptionSettings_restore', actions.CustomEvent.ferDialog.subscriptionSettings.restore);
                    document.addEventListener('fer-dialog_remove_subscription', actions.CustomEvent.ferDialog.remove.subscription);
                    document.addEventListener('fer-table_add_subscription', actions.CustomEvent.ferTable.add.subscription);
                    document.addEventListener('fer-table_card_remove', actions.CustomEvent.ferTable.card.remove);
                    document.addEventListener('mss-filter-add-subscribe', actions.CustomEvent.mssFilter.add.subscribe);
                    document.addEventListener('mss-filter_add_settings', actions.CustomEvent.mssFilter.add.settings);
                    document.addEventListener('mss-filter_add_note', actions.CustomEvent.mssFilter.add.note);

                    const body_tr_array = self.shadowRoot.querySelectorAll('.body_tr.registry.array')
                    const body_tr_card_array = self.shadowRoot.querySelectorAll('.body_tr.card.array')
                    const body_tr_registry_object =  self.shadowRoot.querySelectorAll('.body_tr.registry.object')

                    body_tr_registry_object.forEach(i => {
                        observer.observe(i)
                    })

                    body_tr_array.forEach(i => {
                        observer.observe(i)
                    })

                    body_tr_card_array.forEach(i => {
                        observer.observe(i)
                    })

                    const buttonCardRestore = self.shadowRoot.querySelectorAll('.button.card.restore')
                    buttonCardRestore?.forEach(item => {
                        item.addEventListener('click', actions.button.card.restore);
                    });

                    const header_button_add = self.shadowRoot.querySelectorAll('.header_button_add')
                    if(header_button_add.length !== 0) {
                        header_button_add.forEach(item => {
                            item.addEventListener('click', actions.CustomEvent.mssFilter.add.subscribe);
                        });
                    }

                    const buttonRegistryRestore = self.shadowRoot.querySelectorAll('.button.registry.restore');
                    buttonRegistryRestore?.forEach(item => {
                        item.addEventListener('click', actions.registry.item.restore);
                    });

                    const buttonRegistryDelete = self.shadowRoot.querySelectorAll('.button.registry.delete');

                    buttonRegistryDelete?.forEach(item => {
                        item.addEventListener('click', actions.registry.item.delete);
                    });

                    const registries = self.shadowRoot.querySelectorAll('.body_tr.registry');

                    registries.forEach(item => {
                        item.addEventListener('click', actions.registry.item.click);
                    });

                    const items = self.shadowRoot.querySelectorAll('.body_tr.card');

                    items.forEach(item => {
                        const inputs = item.querySelectorAll('.value');
                        const buttons = item.querySelectorAll('.button');

                        inputs.forEach(item => {
                            if (item.classList.contains('name')) {
                                item.addEventListener('input', actions.card.name);
                            }

                            if (item.classList.contains('code')) {
                                item.addEventListener('input', actions.card.code);
                            }

                            if (item.classList.contains('title')) {
                                item.addEventListener('click', actions.card.title);
                            }
                        });

                        buttons.forEach(item => {
                            if (item.classList.contains('delete')) {
                                item.addEventListener('click', actions.card.delete);
                            }

                            if (item.classList.contains('edit')) {
                                item.addEventListener('click', actions.card.edit);
                            }
                        });
                    });
                }
            }
        },
        terminate: async (props = {
            isCleanHTML: true
        }) => {
            const { isCleanHTML } = props;
            document.removeEventListener('fer-dialog_subscription_update', actions.CustomEvent.ferDialog.subscription.update)
            document.removeEventListener('fer-dialog_ruleSettings_update', actions.CustomEvent.ferDialog.ruleSettings.update)
            document.removeEventListener('fer-table_add_settingsRule', actions.CustomEvent.ferTable.add.settingsRule)
            document.removeEventListener('mss-filter-add-settingsRule', actions.CustomEvent.mssFilter.add.settingsRule);
            document.removeEventListener('fer-dialog_subscriptionSettings_delete', actions.CustomEvent.ferDialog.subscriptionSettings.delete);
            document.removeEventListener('fer-dialog_subscriptionSettings_restore', actions.CustomEvent.ferDialog.subscriptionSettings.restore);
            document.removeEventListener('fer-dialog_remove_subscription', actions.CustomEvent.ferDialog.remove.subscription);
            document.removeEventListener('fer-table_add_subscription', actions.CustomEvent.ferTable.add.subscription);
            document.removeEventListener('fer-table_card_remove', actions.CustomEvent.ferTable.card.remove);
            document.removeEventListener('mss-filter-add-subscribe', actions.CustomEvent.mssFilter.add.subscribe);
            document.removeEventListener('mss-filter_add_settings', actions.CustomEvent.mssFilter.add.settings);
            document.removeEventListener('mss-filter_add_note', actions.CustomEvent.mssFilter.add.note);

            const body_tr_array = self.shadowRoot.querySelectorAll('.body_tr.registry.array')
            const body_tr_card_array = self.shadowRoot.querySelectorAll('.body_tr.card.array')
            const body_tr_registry_object =  self.shadowRoot.querySelectorAll('.body_tr.registry.object')

            body_tr_registry_object.forEach(i => {
                observer.unobserve(i)
            })

            body_tr_array.forEach(i => {
                observer.unobserve(i)
            })

            body_tr_card_array.forEach(i => {
                observer.unobserve(i)
            })

            const buttonCardRestore = self.shadowRoot.querySelectorAll('.button.card.restore')
            buttonCardRestore?.forEach(item => {
                item.removeEventListener('click', actions.button.card.restore);
            });


            const buttonRegistryRestore = self.shadowRoot.querySelectorAll('.button.registry.restore');
            buttonRegistryRestore?.forEach(item => {
                item.removeEventListener('click', actions.registry.item.restore);
            });

            const buttonRegistryDelete = self.shadowRoot.querySelectorAll('.button.registry.delete');

            buttonRegistryDelete?.forEach(item => {
                item.removeEventListener('click', actions.registry.item.delete);
            });

            const header_button_add = self.shadowRoot.querySelectorAll('.header_button_add')
            if(header_button_add.length !== 0) {
                header_button_add.forEach(item => {
                    item.removeEventListener('click', actions.CustomEvent.mssFilter.add.subscribe);
                });
            }

            const registries = self.shadowRoot.querySelectorAll('.body_tr.registry');

            registries.forEach(item => {
                item.removeEventListener('click', actions.registry.item.click);
            });

            const items = self.shadowRoot.querySelectorAll('.body_tr.card');

            items.forEach(item => {
                const inputs = item.querySelectorAll('.value');
                const buttons = item.querySelectorAll('.button');

                inputs.forEach(item => {
                    if (item.classList.contains('name')) {
                        item.removeEventListener('input', actions.card.name);
                    }

                    if (item.classList.contains('code')) {
                        item.removeEventListener('input', actions.card.code);
                    }

                    if (item.classList.contains('title')) {
                        item.removeEventListener('click', actions.card.title);
                    }
                });

                buttons.forEach(item => {
                    if (item.classList.contains('delete')) {
                        item.removeEventListener('click', actions.card.delete);
                    }

                    if (item.classList.contains('edit')) {
                        item.removeEventListener('click', actions.card.edit);
                    }
                });

                if (isCleanHTML === 'undefined' || isCleanHTML === undefined || isCleanHTML) {
                    item.remove();
                }
            });

            actions.card.delete();
        }
    };
}