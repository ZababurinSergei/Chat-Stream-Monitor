import {store} from "../../../mss-auth/views/index.mjs";

export default async (self, actions) => {
    let dropdownBtn = undefined
    let dropdownList = undefined
    let dropdownItems = undefined
    let arrow = undefined

    let name = undefined
    let icon = undefined

    const user = store.get('authorization')

    if(self.id === 'logout') {
        name = self.shadowRoot.querySelector('.name')
        icon = self.shadowRoot.querySelector('.icon')

        name.innerHTML = ''
        icon.innerHTML = ''

        name.innerHTML = `${user.userinfo.lastName} ${user.userinfo.firstName.charAt(0).toUpperCase()}.`
        icon.innerHTML = `${user.userinfo.lastName.charAt(0).toUpperCase()}${user.userinfo.firstName.charAt(0).toUpperCase()}`
    }

    return {
        init: () => {
             dropdownBtn = self.shadowRoot.querySelector('[class*="dropdown__button"]');
             dropdownList = self.shadowRoot.querySelector('[class*="dropdown__list"]');
             dropdownItems = dropdownList?.querySelectorAll('[class*="dropdown__list-item"]');
             arrow = self.shadowRoot.querySelector('.dropdown__button_arrow');

            dropdownBtn.addEventListener('click', actions.clickDropdownBtn);
            dropdownItems.forEach(function(listItem) {
                listItem.addEventListener('click', actions.clickDropdownItems )
            })
            document.addEventListener('click', actions.click )
            document.addEventListener('keydown', actions.keydown)
            arrow?.addEventListener('click', actions.clickDropdownBtn)
            document.addEventListener('fer-select', actions.ferSelect)
            document.addEventListener( 'click', actions.button.under)
        },
        terminate: () => {
            dropdownBtn.removeEventListener('click', actions.clickDropdownBtn);

            dropdownItems.forEach(function(listItem) {
                listItem.removeEventListener('click', actions.clickDropdownItems )
            })
            document.removeEventListener('click', actions.click )
            document.removeEventListener('keydown', actions.keydown)
            document.removeEventListener('fer-select', actions.ferSelect)
            arrow?.removeEventListener('click', actions.clickDropdownBtn)
            document.removeEventListener( 'click', actions.button.under)
        }
    }
}