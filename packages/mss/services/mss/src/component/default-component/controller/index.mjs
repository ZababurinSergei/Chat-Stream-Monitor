import addEventListener from './addEventListener/index.mjs'
import addTaskListener from './addTaskListener/index.mjs'
export const controller = (self, actions) => {
    return new Promise(async (resolve, reject) => {

        self._doRender = actions._doRender

        // property.property = s.this.shadowRoot.querySelector('.property')
        // task.property(property.property)
        // if(property.queue.length > 0) {
        //     property.property.innerHTML = ''
        //     for(let html of property.queue) {
        //         property.property.insertAdjacentHTML('afterbegin', html)
        //     }
        // }

        resolve({
            addEventListener: await addEventListener(self, actions),
            addTaskListener: await addTaskListener(self, actions)
        })
    })
}