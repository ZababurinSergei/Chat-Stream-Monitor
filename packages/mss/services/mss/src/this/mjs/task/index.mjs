import heap from './heap.mjs'
import { emoji } from '../emoji/index.mjs'
import { Color } from '../ansis/index.js'

let self = undefined
let self_header = undefined

export const state = {
    insert: 'beforeend',
    count: 0,
    limit: {
        count: 10
    }
}

export default {
    set: (view, property, color, substrate, relation) => {
        return new Promise(function (resolve, reject) {
            if (self) {
                console.log(`${Color(`🏵 [(A*)n -1]`, 'red')}`, state.count)
                self.insertAdjacentHTML(state.insert, `<p>    🌕 ${relation}</p>`)
                state.count = state.count + 1
                if (state.count > state.limit.count) {
                    for (let i = state.limit.count; i < self.children.length; ++i) {
                        self.removeChild(self.firstElementChild);
                    }
                }
            }
            console.log(`🌕`, relation + ' init')
            if (view) {
                heap(view, property, color, substrate, relation, (event) => {
                    if (self) {
                        console.log(`${Color(`   🏵 [(A*)n]`, 'red')}`, state.count)
                        if (state.count > state.limit.count) {
                            for (let i = state.limit.count; i < self.children.length; ++i) {
                                self.removeChild(self.firstElementChild);
                            }
                            state.count = state.limit.count
                        }

                        self.insertAdjacentHTML(state.insert, `<p>    ${emoji('moon')[2][0]} ${relation}</p>`)
                        state.count = state.count + 1
                    }
                    console.log(`   🌑`, relation + ' end')
                    resolve(event)
                }, self)
            } else {
                if (self) {
                    if (state.count > state.limit.count) {
                        console.log('', self.children)
                        for (let i = state.limit.count; i < self.children.length; ++i) {
                            self.removeChild(self.firstElementChild);
                        }

                        state.count = state.limit.count
                    }
                    state.count = state.count + 1
                    self.insertAdjacentHTML(state.insert, `<p>    ${emoji('moon')[0][2]} ${relation} stop</p>`)
                }
                console.log(` ddd   ${emoji('moon')[0][2]}`, `${relation} stop`)
                resolve({
                    status: true,
                    message: 'stop',
                    _scriptDir: import.meta.url
                })
            }

        })
    },
    get: (view, property, color, substrate, relation, callback) => {
        if (self) {
            self.insertAdjacentHTML(state.insert, `<p>${emoji('moon')[0][0]} ${relation}</p>`)
            state.count = state.count + 1
        }
        // console.log(`💥`, relation)
        return heap(view, 'await', color, {property, substrate}, relation, callback, self)
    },
    list: (view, property, color, substrate, relation, callback) => {
        let list = heap(true, 'list')
        list.then((item) => {
            if (self_header) {

                self_header.textContent = `Property: ${Array.isArray(item.source.staticProperty) ? item.source.staticProperty.length : 0}`
                // self_header.textContent = `Property`
                // self.insertAdjacentHTML(state.insert, `<p>${emoji('moon')[0][1]}: ${Array.isArray(item.source.staticProperty) ? item.source.staticProperty.length : 0}</p`)
                if (self.children.length > 21) {
                    self.firstElementChild.remove()
                }
            }

            console.log(`🌟 LIST`, item)
        })
        return list
    },
    close: (view, property, color, substrate, relation, callback) => {
        let close = heap(view, 'close', color, substrate, relation, self)
        close.then((item) => {
            if (self) {
                self.insertAdjacentHTML(state.insert, `<p>${emoji('moon')[0][3]} ${item}</p>`)
                // state.count = state.count + 1
            }
            console.log(`${emoji('moon')[0][3]}`, item)
        })
        return close
    },
    header: (container) => {
        self_header = container
    },
    property: (container) => {
        self = container
    }
}