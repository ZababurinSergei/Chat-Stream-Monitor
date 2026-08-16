export default async (self, actions) => {
    const update = self.shadowRoot.querySelector('.update')
    const cancel = self.shadowRoot.querySelector('.cancel')
    const remove = self.shadowRoot.querySelector('.delete')
    const restore = self.shadowRoot.querySelector('.restore')
    const close = self.shadowRoot.querySelector('.icon.close')
    const filter = self.shadowRoot.querySelector('.icon.filter')
    const filterItem = self.shadowRoot.querySelector('.icon.filter_item')
    const filterFooterClean = self.shadowRoot.querySelector('.filter.footer.clean')
    const filterFooterExecute = self.shadowRoot.querySelector('.filter.footer.execute')

    return {
        init: () => {
            restore?.addEventListener('click', actions.button.restore)
            close?.addEventListener('click', actions.close)
            self?.addEventListener('click', actions.click)
            remove?.addEventListener('click', actions.button.remove)
            update?.addEventListener('click', actions.button.update)
            cancel?.addEventListener('click', actions.button.cancel)
            filter?.addEventListener('click', actions.button.filter)
            filterFooterClean?.addEventListener('click', actions.filter.clean)
            filterFooterExecute?.addEventListener('click', actions.filter.execute)
            filterItem?.addEventListener('click', actions.button.filterItem)
            document.addEventListener( 'click', actions.under)
        },
        terminate: () => {
            restore?.removeEventListener('click', actions.button.restore)
            close?.removeEventListener('click', actions.close)
            self?.removeEventListener('click', actions.click)
            remove?.removeEventListener('click', actions.button.remove)
            update?.removeEventListener('click', actions.button.update)
            cancel?.removeEventListener('click', actions.button.cancel)
            filter?.removeEventListener('click', actions.button.filter)
            filterFooterClean?.removeEventListener('click', actions.filter.clean)
            filterFooterExecute?.removeEventListener('click', actions.filter.execute)
            filterItem?.removeEventListener('click', actions.button.filterItem)
            document.removeEventListener( 'click', actions.under)
        }
    }
}