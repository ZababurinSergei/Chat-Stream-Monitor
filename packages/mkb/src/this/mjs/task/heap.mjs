import { isEmpty } from '../../index.mjs'
import { emoji } from '../../index.mjs'
import { state } from './index.mjs'

let source = {}
let target = {}
let remove = {}
source.staticProperty = {}
target.staticProperty = {}
remove.staticProperty = {}
target.staticProperty = new Proxy({}, {
    get: (obj, prop) => {
        // console.log({
        //     _:'get target',
        //     prop:prop,
        //     obj:obj,
        //     value:obj[prop]
        // })
        return obj[prop];
    },
    set: (obj, prop, value) => {
        // console.log({
        //     _:'set target',
        //     prop:prop,
        //     obj:obj,
        //     value:value
        // })
        if(isEmpty(obj[prop])){
            obj[prop] = []
        }
        obj[prop].push(value);
        return true
    }
});

source.staticProperty = new Proxy({}, {
    get: (obj, prop) => {
        // console.log({
        //     _:'get source',
        //     prop:prop,
        //     obj:obj,
        //     value:obj[prop]
        // })
        return obj[prop];
    },
    set: (obj, prop, value) => {
        // console.log({
        //     _:'set source',
        //     prop:prop,
        //     obj:obj,
        //     value:value
        // })
        if(isEmpty(obj[prop])){
            obj[prop] = []
        }
        obj[prop].push(value);
        return true
    }
});

export default (view,property,color,substrate,relation,callback,self) =>{
    return  new Promise(async (resolve, reject) => {
        function out(obj) {
            resolve(obj)
        }
        function err(obj) {
            reject(obj)
        }
        try {
            switch (property) {
                case 'list':
                    resolve({
                        target:target,
                        source:source,
                        remove:remove
                    })
                    break
                case 'close':
                    isEmpty(source.staticProperty[`${relation}`])
                      ? delete target.staticProperty[`${relation}`]
                      : remove.staticProperty[`${relation}`] = true
                      resolve(true)
                    break
                case 'await':
                    if(!isEmpty(target.staticProperty[`${relation}`])) {
                        target.staticProperty[`${relation}`] = {
                            callback: callback
                        }
                        resolve(true)
                    } else {
                        if(isEmpty(source.staticProperty[`${relation}`])) {
                            target.staticProperty[`${relation}`] = {
                                callback: callback
                            }
                            resolve(true)
                        } else {
                            if(self) {
                                self.insertAdjacentHTML(state.insert, `<p>  ${emoji('moon')[2][1]} ${source.staticProperty[`${relation}`][0]['relation']}</p>`)
                            }
                            console.log(`  ${emoji('moon')[2][1]}`, source.staticProperty[`${relation}`][0]['relation'])
                            target.staticProperty[`${relation}`] = {
                                callback: callback
                            }
                            let item = target.staticProperty[`${relation}`]
                            while(!isEmpty(source.staticProperty[`${relation}`][0])) {
                                for(let i = 0; i < item.length;i++) {
                                    await item[i].callback({
                                        view:source.staticProperty[`${relation}`][0]['view'],
                                        property:source.staticProperty[`${relation}`][0]['property'],
                                        color: source.staticProperty[`${relation}`][0]['color'],
                                        substrate:source.staticProperty[`${relation}`][0]['substrate'],
                                        relation: source.staticProperty[`${relation}`][0]['relation'],
                                        callback: source.staticProperty[`${relation}`][0]['callback']
                                    })

                                }
                                // console.log('source.staticProperty[`${relation}`]', source.staticProperty[`${relation}`])
                                // if(source.staticProperty[`${relation}`]) {
                                    // console.log('source.staticProperty[`${relation}`]', source.staticProperty[`${relation}`].length)
                                    source.staticProperty[`${relation}`].shift()
                                // }
                            }
                            if(remove.staticProperty[`${relation}`]) {
                                delete target.staticProperty[`${relation}`]
                                delete remove.staticProperty[`${relation}`]
                            }
                            delete source.staticProperty[`${relation}`]
                            resolve(true)
                        }
                    }
                    break
                default:
                    if(isEmpty(target.staticProperty[`${relation}`])) {
                        if(self) {
                            self.insertAdjacentHTML(state.insert, `<p>  ${emoji('moon')[2][3]} ${relation}</p>`)
                        }
                        console.log(`  ${emoji('moon')[2][3]}`, relation + ' process')
                        source.staticProperty[`${relation}`] = {
                            view:view,
                            property:property,
                            color:color,
                            substrate:substrate,
                            relation:relation,
                            callback: callback
                        }
                        resolve(true)
                    } else {
                        if(self) {
                            self.insertAdjacentHTML(state.insert, `<p>  ${emoji('moon')[1][3]} ${relation}</p>`)
                        }
                        console.log(`  🌒`, relation + ' process')
                        source.staticProperty[`${relation}`] = {
                            view:view,
                            property:property,
                            color:color,
                            substrate:substrate,
                            relation:relation,
                            callback: callback
                        }
                        while(!isEmpty(source.staticProperty[`${relation}`][0])) {
                            target.staticProperty[`${relation}`].forEach(item => {
                                item.callback({
                                    view:source.staticProperty[`${relation}`][0]['view'],
                                    property:source.staticProperty[`${relation}`][0]['property'],
                                    color: source.staticProperty[`${relation}`][0]['color'],
                                    substrate:source.staticProperty[`${relation}`][0]['substrate'],
                                    relation: source.staticProperty[`${relation}`][0]['relation'],
                                    callback: source.staticProperty[`${relation}`][0]['callback']
                                })
                            });
                            // console.log('source.staticProperty[`${relation}`]222', source.staticProperty[`${relation}`])
                            source.staticProperty[`${relation}`].shift()
                        }
                        if(remove.staticProperty[`${relation}`]) {
                            delete target.staticProperty[`${relation}`]
                            delete remove.staticProperty[`${relation}`]
                        }
                       delete source.staticProperty[`${relation}`]
                       resolve(true)
                    }
                    break
            }
        } catch (e) {
            console.error({
                _:'error',
                message: e,
                _scriptDir: import.meta.url,
                status: false,
            })
            resolve({
                _:'error',
                message: e,
                _scriptDir: import.meta.url,
                status: false,
            })
        }
        
    })
}