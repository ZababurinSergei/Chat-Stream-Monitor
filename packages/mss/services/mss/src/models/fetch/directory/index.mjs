import { request } from "../index.mjs";

const state = {

}

export const Directory = () => {
    return new Promise((resolve, reject) => {
        const URL_DOMAIN_LIST = "/api/v1/directories";
        const URL_DOMAIN_COUNT = "/v1/domain/count";
        const URL_DOMAIN_SAVE = "/v1/domain/save";
        const URL_DOMAIN_DELETE = "/v1/domain/delete";

        state[`${URL_DOMAIN_LIST}`] = undefined
        /**
         * DOMAIN
         * @returns {Promise<unknown>}
         */
        const postDomainCount = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_DOMAIN_COUNT)
                    console.log('DOMAIN COUNT ', data)
                    resolve(data)
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postDomainDelete = (slug = {
            "slug": "test.booking"
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_DOMAIN_DELETE, slug)
                    console.log('DOMAIN DELETE', data)
                    resolve({
                        status: true,
                        data
                    })
                } catch (e) {
                    resolve({
                        status: false,
                        code: e.message?.code,
                        message: e.message?.message,
                    })
                }
            })
        }

        const postDomainSave = (data =  {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_DOMAIN_SAVE, data)
                    console.log('DOMAIN SAVE ', result)
                    resolve(result)
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }
        const postDomainList = () => {
            return new Promise(async (resolve, reject) => {
                if(state[`${URL_DOMAIN_LIST}`]) {
                    console.log('%%%%%%%%%%%%%%%%%% MEMO REQUEST %%%%%%%%%%%%%%%%%%%%%%%')
                    resolve({
                        status: true,
                        list: result.obj
                    })
                } else {
                    const result = await window.ui.fetch.dictionary()
                    state[`${URL_DOMAIN_LIST}`] = result.obj

                    console.log('dddddddddddd REQUEST dddddddddddd', result.obj)

                    if(result.ok) {
                        resolve({
                            status: true,
                            list: result.obj
                        })
                    } else {
                        console.log('надо дописать здесь')
                        resolve({
                            status: false,
                            message: result
                        })
                    }
                }
                // try {
                //     const data = await request.get(URL_DOMAIN_LIST)
                //     resolve({
                //         status: true,
                //         list: data.directory
                //     })
                // } catch (e) {
                //     resolve({
                //         status: false,
                //         message: e
                //     })
                // }
            })
        }


        resolve({
            get: {
                list: postDomainList
            },
            post: {
                count: postDomainCount,
                save: postDomainSave,
                delete: postDomainDelete,
            }
        })
    })
}