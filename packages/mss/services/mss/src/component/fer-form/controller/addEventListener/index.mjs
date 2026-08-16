export default async (self, actions) => {
    // const $input = self.shadowRoot.querySelector('input');
    // const $textarea = self.shadowRoot.querySelector('textarea');
    // const $buttonsSave = self.shadowRoot.querySelector('.buttons__save');

    return {
        init: () => {
            // $input.addEventListener('input', actions.$input);
            // $textarea.addEventListener('input', actions.$textarea);
            // $buttonsSave.addEventListener('click', actions.$buttonsSave);
        },
        terminate: () => {
            // $input.removeEventListener('input', actions.$input);
            // $textarea.removeEventListener('input', actions.$textarea);
            // $buttonsSave.removeEventListener('click', actions.$buttonsSave);
        }
    }
}