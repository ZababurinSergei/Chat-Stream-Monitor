export default async (self, actions) => {
    const link = self
    
    return {
        init: () => {
            window.addEventListener('fer-button-in', actions['fer-button-in'])
            window.addEventListener('fer-button', actions['fer-button'])
            link.addEventListener('mouseover', actions.mouseover)
            link.addEventListener('mouseout', actions.mouseout)
            window.addEventListener('hashchange', actions.hashchange );
            link.addEventListener('click', actions.click)
            window.addEventListener('popstate', actions.popstate);
        },
        terminate: () => {
            window.removeEventListener('fer-button-in', actions['fer-button-in'])
            window.removeEventListener('fer-button', actions['fer-button'])
            link.removeEventListener('mouseover', actions.mouseover)
            link.addEventListener('mouseout', actions.mouseout)
            window.removeEventListener('hashchange', actions.hashchange);
            link.removeEventListener('click', actions.click)
            window.removeEventListener('popstate', actions.popstate);
        }
    }
}