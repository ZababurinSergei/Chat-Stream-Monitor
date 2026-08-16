import { activeClass, normalizePathName } from '../../../../this/index.mjs'
export default async (self, actions) => {

    return {
        init: () => {
            window.addEventListener('hashchange', actions.hashchange );
            self.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {
            window.removeEventListener('hashchange', actions.hashchange);
            self.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
        }
    }

}