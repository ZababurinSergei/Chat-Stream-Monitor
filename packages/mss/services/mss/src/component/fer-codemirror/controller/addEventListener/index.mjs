import { codemirror } from "../../views/index.mjs";

export default async (self, actions) => {
    const node = self.shadowRoot.querySelector('.fer-codemirror')
    const welcomeSection = self.closest('welcome-section')

    let ferCodemirror = {}

    if(welcomeSection.dataset.id === '2_0' && self?.id === 'jsonSchema') {
        ferCodemirror = await codemirror(node,'javascript', true)
    } else {
        ferCodemirror = await codemirror(node,'javascript', welcomeSection.dataset.id === '5_0')
    }



    return {
        init: () => {
            self.editor = ferCodemirror
            ferCodemirror.on('change', actions.change)
            ferCodemirror.on('viewportChange', actions.viewportChange)
        },
        terminate: () => {

        }
    }
}