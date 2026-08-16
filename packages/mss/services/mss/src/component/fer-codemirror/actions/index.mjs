// import { codemirror } from '../views/index.mjs'
import { toBase64 } from '../../../this/index.mjs';

export const actions = (self) => {
    return new Promise(async (resolve, reject) => {
        // let url = 'https://zababurinsv.github.io/android/index.json'
        // let jasonelle = await fetch(url)
        // jasonelle = await jasonelle.text()
        // ferCodemirror.setValue(jasonelle)

        const updateUI = async (event = {}, type) => {
            // codemirror.refresh()
            // codemirror_json_html.refresh()
            // codemirror_json_code.refresh()
            // ferCodemirror.refresh()
        }

        resolve({
            viewportChange: (event) => {
                self.refresh()
                console.log('@@@@@@@@@ CODEMIRROR VIEPORT CHANGE @@@@@@@@@@@@@@@@@@@@@')
            },
            change: (event) => {
                const welcomeSection = self.closest('welcome-section')
                const welcomeSectionId = welcomeSection.dataset.id
                const value = event.getValue()

                if(welcomeSectionId === '1_0') {
                    if(self.id === 'rule') {
                        let rule = welcomeSection.getState('rule')
                        rule.functionBase64Encoded = `${toBase64(value)}`
                        welcomeSection.setState('rule', rule)
                        self.setState('rule', {
                            functionBase64Encoded: `${toBase64(value)}`
                        })
                    }

                    if(self.id === 'theFact') {
                        welcomeSection.setState('theFact', `${value}`)
                    }
                } else if(welcomeSectionId === '5_0') {
                    // console.log('@@@@@@@@@@@@@@@@@@@@@ welcomeSectionId @@@@@@@@@@@@@@@@@@@@@@@@ >>>', welcomeSectionId)
                    // 
                    // welcomeSection.setState('mapping', {
                    //
                    // })
                } else if(welcomeSectionId === '0_0') {
                    try {
                        const event = welcomeSection.getState('event')
                        const jsonSchema = JSON.parse(value)
                        event.jsonSchema = jsonSchema
                        welcomeSection.setState('event', event)
                    } catch (e) {
                        console.log('@@@@@@ ERROR @@@@@@@@@', e)
                    }
                } else if(welcomeSectionId === '2_0') {
                    if(self.id === 'theFact') {
                        welcomeSection.setState('theFact', `${value}`)
                    }
                } else {
                   console.warn('Неизвестное место:',welcomeSectionId,  'self: ',self )
                    // self.setState('schema', {
                    //     jsonSchema: `${event.getValue()}`
                    // })
                }
            }
        })
    })
}

export default {
    description: 'action'
}