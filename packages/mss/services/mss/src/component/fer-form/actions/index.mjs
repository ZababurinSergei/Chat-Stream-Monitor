export default (self) => {
    return new Promise(async (resolve, reject) => {
        const $input = self.shadowRoot.querySelector('input');
        const $textarea = self.shadowRoot.querySelector('textarea');
        // const $buttonsSave = self.shadowRoot.querySelector('.buttons__save');

        const dis = (elementOfObservation, elementOfDisabled) => {
            if (elementOfObservation.value) {
                elementOfDisabled.removeAttribute('disabled');
            } else {
                elementOfDisabled.setAttribute('disabled', '');
            }
        }

        const print = () => {
            console.log($input.value);
            console.log($textarea.value);
        }

        resolve({
            $input: (e) => {
                dis($input, $textarea);
            },
            $textarea: (e) => {
                // dis($textarea, $buttonsSave);
            },
            $buttonsSave: (e) => {
                e.stopPropagation();
                print()
            }
        })
    })
}
