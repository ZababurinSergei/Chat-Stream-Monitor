export default async (self, actions) => {
    const diagram = self.shadowRoot.querySelector('.section_content_body_diagram')

    return {
        init: () => {
            diagram.addEventListener('mouseover', actions.mouseover)
            diagram.addEventListener('mouseout', actions.mouseout)
            diagram.addEventListener('mouseenter', actions.mouseenter)
            diagram.addEventListener('mouseleave', actions.mouseleave)
            diagram.addEventListener('click', actions.click)
        },
        terminate: () => {
            diagram.removeEventListener('mouseover', actions.mouseover)
            diagram.removeEventListener('mouseout', actions.mouseout)
            diagram.removeEventListener('mouseenter', actions.mouseenter)
            diagram.removeEventListener('mouseleave', actions.mouseleave)
            diagram.removeEventListener('click', actions.click)
        }
    }
}