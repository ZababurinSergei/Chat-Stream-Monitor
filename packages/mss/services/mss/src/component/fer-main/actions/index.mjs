import TextEditor from '../views/mjs/codemirror/codemirror.mjs'
import isEmpty from '../views/mjs/isEmpty/isEmpty.mjs'
import Parser, { json } from '../views/mjs/html2json/index.mjs'
import MD from '../views/mjs/md/index.mjs'
import JQ from '../views/mjs/jq/index.mjs'

export default (self) => {
    return new Promise(async (resolve, reject) => {
        const jq = await JQ()
        let component = self.shadowRoot === null
            ? self
            : self.shadowRoot

        const md2html =  await MD()
        let codemirror =  await TextEditor(self.querySelector('.markdown__self'), 'javascript')
        let codemirror_android_json = await TextEditor(self.querySelector('.markdown__jasonelle_android_input'),'javascript')

        // let codemirror_json_html = await TextEditor(component.querySelector('.markdown__string_html_json_input'),'javascript')
        // let codemirror_json_code = await TextEditor(component.querySelector('.markdown__string_views_json_input'),'javascript')

        try {
            let url = 'https://zababurinsv.github.io/android/index.json'
            let jasonelle = await fetch(url)
            jasonelle = await jasonelle.text()
            codemirror_android_json.setValue(jasonelle)
            self.querySelector('.markdown__jasonelle_android_run').removeAttribute('disabled')
        } catch (e) {
            console.warn({
                _:'error',
                data:e
            })
        }

        const updateUI = async (event = {}, type) => {
            codemirror.refresh()
            // codemirror_json_html.refresh()
            // codemirror_json_code.refresh()
            codemirror_android_json.refresh()
        }

        const markdown__string_menu_change_false = (html) => {
            const result = Parser.parse(html)
            // const htmlJson = self.querySelector('.markdown__string_html')
            // codemirror_json_html.setValue(json(result))
            // codemirror_json_code.setValue(json(result))

            console.log('############### json ###############', result, json(result))
            updateUI()
        }


        resolve({
            jqRun: async (event) => {
                let out  = jq(
                    JSON.parse(codemirror_android_json.getValue()),
                    self.querySelector('.markdown__jasonelle_android_query').value
                );

                if(!isEmpty(out)) {
                    self.querySelector(".markdown__jasonelle_android_output").value =  JSON.stringify(JSON.parse(out), undefined, 4);
                }
            },
            checkbox: (event) => {
                if(event.target.id === 'markdown__button_views') {
                    const checkbox = component.querySelector('#markdown__button_views')
                    const markdown__self_html = self.querySelector('.markdown__self_html')
                    if (checkbox.checked) {
                        markdown__self_html.innerHTML = ''
                        let data = codemirror.getValue()
                        if (!data.length) {
                            data = '#Empty'
                        }
                        let result = md2html.parse(data)
                        markdown__self_html.insertAdjacentHTML('beforeend', result)
                        // markdown__string_menu_change_false(result)
                    }

                    markdown__self_html.style.display = !checkbox.checked ? 'none' : 'flex'
                    self.querySelector('.CodeMirror').style.display = !checkbox.checked ? 'block' : 'none'
                } else {
                    console.error('неизвестный тип событиия')
                }
            },
            popstate: (event) => {
                let soltNames = ['header_base', 'TabAccounts', 'TabSend', 'TabDapps', 'TabSharding', 'TabSharding', 'TabExplorer']
                if(event.detail && event.detail.pathname) {
                    const slots = component.querySelectorAll('slot');
                    switch(event.detail.pathname) {
                        case "/":
                            for(let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-main': ''
                            }
                            self.shadowRoot.querySelector('.markdown__string_menu').style.display = 'flex'
                            break
                        case "/jira":
                            for(let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-jira': ''
                            }
                            break
                        case "/contributing":
                            for(let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-contributing': ''
                            }
                            break
                        case "/json":
                            for(let i = 0; i < slots.length; ++i) {
                                slots[i].name = i === 0 ? 'api-json': ''
                                self.shadowRoot.querySelector('.markdown__string_menu').style.display = 'none'
                                updateUI()
                            }
                            break
                        default:
                            for(let i = 0; i < slots.length; ++i) {
                                slots[i].name = soltNames[i]
                            }
                            break
                    }
                }
            }
        })
    })
}
