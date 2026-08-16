export default (self) => {
    const slot = self.shadowRoot.querySelector('slot');
    const pathname = window.location.pathname

    if(pathname.startsWith('/json')) {
        self.shadowRoot.querySelector('.markdown__string_menu').style.display = 'none'
        slot.name = 'api-json'
    } else if(pathname.startsWith('/')) {
        slot.name = 'api-main'
    } else {
        console.warn('не обрабатывается путь', window.location.pathname)
    }

    return (name) => {
        slot.name = name
    }
}
