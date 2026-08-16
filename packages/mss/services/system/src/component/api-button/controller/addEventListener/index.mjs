export default async (self, actions) => {
    return {
        init: () => {
            self.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
            document.addEventListener('api-button-enable-or-disable', actions.apiButtonEnableOrDisable)
            document.addEventListener('api-button', actions.apiButton)
            document.addEventListener('api-button-service-onload', actions.onload)

            if (self.dataset.role === 'aside') {
                window.document.addEventListener(`${self.dataset.type}_${self.dataset.role}`, actions.customEvents);
            }
        },
        terminate: () => {
            self.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
            document.removeEventListener('api-button', actions.apiButton)
            document.removeEventListener('api-button-enable-or-disable', actions.apiButtonEnableOrDisable)
            document.removeEventListener('api-button', actions.onload)
            if (self.dataset.role === 'aside') {
                window.document.removeEventListener(`${self.dataset.type}_${self.dataset.role}`, self.customEvents);
            }
        }
    }
}