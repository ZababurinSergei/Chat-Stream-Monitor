import Test from './modules/test/index.mjs'
import { Mocha } from './modules/chai/index.mjs'
import css from './modules/mocha/mocha.min.css.mjs'

let mochaHtml =`<div id="tests" style="position: relative"><ul id="mocha"></ul></div><style>${css}</style>`;

/**
 * @param path
 * @param checkLeaks
 * @returns {Promise<unknown>}
 */
export const test = (root = document.body,  path = false, checkLeaks = true) => {
    return new Promise(async (resolve, reject) => {
        try {
            Mocha.setup("bdd");

            (path)
                ? await Test(path)
                : await Test()

            root.insertAdjacentHTML('beforeend', mochaHtml);

            (checkLeaks)
                ? Mocha.checkLeaks()
                : ''
            Mocha.run()
            resolve(true)
        } catch (e) {
            reject({
                success: false,
                status: "false",
                message: e
            })
        }
    })
}

export default `
/**
 * @param path
 * @param checkLeaks
 * @returns {Promise<unknown>}
 */

`
