export default async (self, actions) => {
    let component = self.shadowRoot === null
        ? self
        : self.shadowRoot

    return {
        init: () => {
            window.addEventListener('popstate', actions.popstate);
            self.querySelector('.markdown__jasonelle_android_run').addEventListener("click", actions.jqRun);
            component.querySelector('.markdown__button_views').addEventListener("change", actions.checkbox);
        },
        terminate: () => {
            window.removeEventListener('popstate', actions.popstate);
            self.querySelector('.markdown__jasonelle_android_run').removeEventListener("click", actions.jqRun);
            component.querySelector('.markdown__button_views').removeEventListener("change", actions.checkbox);
        }
    }
}