import { store } from '../../../this/index.mjs';
let api = Symbol.for("api");

export default (self) => {
    return new Promise(async (resolve, reject) => {
        let menu = self.shadowRoot.querySelector('.api-relation');
        menu.innerHTML = '';

        const service = store.get('current_service');
        const pathname = store.get('pathname').pathname;

        const { сonfigRouter, router } = await import(`/services/${service}/src/this/index.mjs`);

        let taskRelation, component = undefined;
        const data = await import(`${pathname}/this/index.mjs`);

        if (service === 'mss') {
            taskRelation = {};
            taskRelation.events = {};
            taskRelation.events[self.tagName] = сonfigRouter.get();
            component = data.component;
        }

    const routes = await router(self, { location });
    store.set('section', routes.key);


    for (let i = 0; i < taskRelation.events[self.tagName].length; ++i) {
        const item = taskRelation.events[self.tagName][i];

        menu.insertAdjacentHTML('beforeend', `
                <api-button
                    ${routes.value === item.value ? 'disabled' : '' }
                    data-role="aside"
                    data-services-path="system"
                    data-css-shadow= "${item?.cssShadow ? `${item.cssShadow}` : 'mss'}"
                    data-key="${item.key}"
                    data-value="${item.value}"
                    data-type="api-relation"
                    data-event="${item.id}"
                    class="api-relation__relation_button"
                >
                <div class="rules-relation_container">
                    ${component['API-RELATION'].is.icon ? `${item.icon}` : ''}
                    <p class="link-plain">
                       ${item.name}
                    </p>
                </div>
                   
                </api-button>
            `);
    }

    resolve({
        _doRender: (event) => {
            console.log('🏤 RENDER Relation 🏤', event);
        }
    });
}
)
;
}
