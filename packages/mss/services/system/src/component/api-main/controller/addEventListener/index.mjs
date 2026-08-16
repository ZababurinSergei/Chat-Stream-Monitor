export default async (self, actions) => {
    return {
        init: () => {
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {

        }
    }

}