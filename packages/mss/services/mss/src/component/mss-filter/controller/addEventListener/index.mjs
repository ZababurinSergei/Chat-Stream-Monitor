import {router, store} from '../../../../this/index.mjs';

export default async (self, actions) => {
    const mssFilter = self
    let buttonAdd = self.shadowRoot.querySelector('.button_add')
    let buttonExport = self.shadowRoot.querySelector('.button_export')
    const buttonBack = self.shadowRoot.querySelector('.back')
    const container = self.shadowRoot.querySelector('.container');
    const mssInputs = container.querySelectorAll('mss-input');
    const ferSelectActive = self.shadowRoot.querySelector(`[data-field="active"]`);
    const ferSelectCode = self.shadowRoot.querySelector(`[data-field="code"]`);
    const ferSelectName = self.shadowRoot.querySelector(`[data-field="name"]`);
    const dropdownButtonCode = ferSelectCode.shadowRoot.querySelector('.dropdown__button')
    const dropdownButtonName = ferSelectName.shadowRoot.querySelector('.dropdown__button')
    const dropdownButtonActive = ferSelectActive.shadowRoot.querySelector('.dropdown__button')

    const section = store.get('section')
    mssFilter.dataset.section = section

    if(section.toString() !== "6") {
        buttonAdd.classList.add('visible')
    }

    if(section.toString() === "5") {

    }

    const route = await router(self, { location })
    mssFilter.dataset.rights = ''
    mssFilter.dataset.rights = route.rights.join(' ')

    if(section.toString() === "0") {
        buttonAdd.classList.add('visible')
        ferSelectActive.style.display = 'none'
        ferSelectCode.style.display = 'none'
        ferSelectCode.style.width = '345px'
        ferSelectName.style.display = 'none'
        ferSelectName.style.width = '345px'
        mssFilter.classList.add('active-section')
        dropdownButtonCode.setAttribute('placeholder', 'Код')
        dropdownButtonName.setAttribute('placeholder', 'Код')
    }

    if(section.toString() === "6") {
        buttonAdd.classList.add('visible')
        ferSelectActive.classList.add('invisible')
        ferSelectCode.style.display = 'flex'
        ferSelectCode.style.width = '416px'
        ferSelectName.style.display = 'flex'
        ferSelectName.style.width = '416px'
        mssFilter.classList.add('active-section')
        dropdownButtonCode.setAttribute('placeholder', 'Код взаимодействия')
        dropdownButtonName.setAttribute('placeholder', 'Наименование взаимодействия')
    }

    if(section.toString() === "7") {
        buttonAdd.classList.add('visible')
        // ferSelectActive.style.display = 'flex'
        ferSelectCode.style.display = 'none'
        // ferSelectCode.removeAttribute('style')
        ferSelectName.style.display = 'none'
        // ferSelectName.removeAttribute('style')
        mssFilter.classList.add('active-section')
        // dropdownButtonCode.setAttribute('placeholder', 'Код системы')
        // dropdownButtonName.setAttribute('placeholder', 'Код взаимодействия')
    }

    mssInputs.forEach(item => {
        if(section.toString() === "0") {
            // item.style.display = 'flex'
            item.classList.add('visible')
        } else if(section.toString() === "7") {
            if(item.dataset.field === 'code') {
                const input = item.shadowRoot.querySelector('input')
                input.setAttribute('placeholder', 'Код системы')
            }

            if(item.dataset.field === 'name') {
                const input = item.shadowRoot.querySelector('input')
                input.setAttribute('placeholder', 'Код взаимодействия')
            }

            item.classList.add('active')
        } else {
            item.style.display = 'none'
        }

        item.clean = true
    })

    return {
        init: () => {
            window.addEventListener('popstate', actions.navigation);
            document.addEventListener('mss-filter_update', actions.CustomEvent.mssFilter.update);
            document.addEventListener('mss-filter_export', actions.CustomEvent.mssFilter.export);
            buttonAdd?.addEventListener('click', actions.button.add);
            buttonExport?.addEventListener('click', actions.button.export);
            buttonBack.addEventListener('click', actions.button.back);
        },
        terminate: () => {
            window.removeEventListener('popstate', actions.navigation);
            buttonAdd?.removeEventListener('click', actions.button.add);
            buttonBack.removeEventListener('click', actions.button.back);
            buttonExport?.removeEventListener('click', actions.button.export);
            document.removeEventListener('mss-filter_update', actions.CustomEvent.mssFilter.update);
            document.removeEventListener('mss-filter_export', actions.CustomEvent.mssFilter.export);
        }
    }
}