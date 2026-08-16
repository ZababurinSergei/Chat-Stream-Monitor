import { activeClass, normalizePathName, store, task } from '../../../this/index.mjs';

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        const icon = self.shadowRoot.querySelector('svg');
        const text = self?.shadowRoot?.querySelector('.rules-relation_container_name');
        const container = self.shadowRoot.querySelector('.rules-relation_container');

        const mssFilter = document.querySelector('mss-filter');

        const pathname = store.get('pathname').pathname;
        const { router } = await import(`${pathname}/this/index.mjs`);

        const rout = await router(self, { location });

        if (rout.value === self.dataset.value) {
            self.classList.add(activeClass);
            container === null ? '' : container.classList.add(activeClass);
            text === null ? '' : text.classList.add(activeClass);
            icon === null ? '' : icon.classList.add(activeClass);
        }

        let onloadCount = 0;

        resolve({
            onload: (event) => {
                onloadCount = onloadCount + 1;
                if (onloadCount === 11) {
                    self.disabled = false;
                }
            },
            apiButtonEnableOrDisable: (event) => {
                const isClick = self.classList.contains(activeClass);
                if (isClick) {
                    self.disabled = true;
                } else {
                    self.disabled = event.detail.disabled === 'true';
                }
            },
            customEvents: (event) => {
                if (`${self.dataset.type}_${self.dataset.role}_${self.dataset.key}` !== event.detail && self.shadowRoot.querySelector('p').classList.contains(activeClass)) {
                    self.disabled = false;
                    // self.shadowRoot.querySelector('p').classList.remove(activeClass)
                    container === null ? '' : container.classList.remove(activeClass);
                    text === null ? '' : text.classList.remove(activeClass);
                    icon === null ? '' : icon.classList.remove(activeClass);
                }
            },
            apiButton: (event) => {
                if (self.dataset.value !== event.detail.dataset.value) {
                    self.disabled = false;
                    container === null ? '' : container.classList.remove(activeClass);
                    text === null ? '' : text.classList.remove(activeClass);
                    icon === null ? '' : icon.classList.remove(activeClass);
                    self.classList.remove(activeClass);
                } else {
                    self.disabled = true;
                    container === null ? '' : container.classList.add(activeClass);
                    text === null ? '' : text.classList.add(activeClass);
                    icon === null ? '' : icon.classList.add(activeClass);
                    self.classList.add(activeClass);
                }
            },
            popstate: (event) => {
                if (event.detail) {
                    const url = self.getAttribute('to');
                    if (url !== event.detail.pathname) {
                        self.shadowRoot.querySelector('p').classList.remove(activeClass);
                    }
                }
            },
            click: async (event) => {
                const isClick = (container === null) ? false : container.classList.contains(activeClass);

                if (self.disabled || isClick) {
                    return;
                }

                const route = await router(self, {
                    value: event.currentTarget.dataset.hasOwnProperty('value') ? event.currentTarget.dataset.value : console.error('Должно быть значение'),
                    location: location
                });

                document.dispatchEvent(new CustomEvent(`api-button`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        dataset: {
                            event: self.dataset.event,
                            value: route.value
                        }
                    }
                }));

                mssFilter.classList.remove('active-section')
                history.pushState(route.title, '', route.pathName);

                task.set(true, '', 'red', {
                    events: [{
                        ...self.dataset,
                        route: route,
                        pathname: normalizePathName(window.location.pathname),
                        hash: window.location.hash
                    }]
                }, self.dataset.value).catch(e => {
                    console.log('error devtool', e);
                });
            }
        });
    });
};

export default {
    description: 'api-button'
};