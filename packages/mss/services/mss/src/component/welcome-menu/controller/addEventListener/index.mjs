export default async (self, actions) => {

    return {
        init: () => {
            window.addEventListener('welcome-menu', actions.apiButton)

            document.dispatchEvent(new CustomEvent(`api-button-service-onload`, {
                bubbles: true,
                composed: true,
                detail: {
                    dataset: {
                        id: self.dataset.id
                    }
                }
            }));
        },
        terminate: () => {
            window.removeEventListener('welcome-menu', actions.apiButton)
        }
    }

}