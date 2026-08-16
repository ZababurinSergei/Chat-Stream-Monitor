export default async (self, actions) => {
    return {
        init: () => {
            document.addEventListener('change-views-template', actions.changeViewsTemplate);
        },
        terminate: () => {
            document.removeEventListener('change-views-template', actions.changeViewsTemplate);
        }
    }

}