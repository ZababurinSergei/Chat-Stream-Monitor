import { request } from "../index.mjs";

export const Domain = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_DOMAIN_LIST = "/v1/domain/list";
        const URL_DOMAIN_COUNT = "/v1/domain/count";
        const URL_DOMAIN_SAVE = "/v1/domain/save";
        const URL_DOMAIN_DELETE = "/v1/domain/delete";

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
                    resolve({
                        status: true,
                        data
                    })
                } catch (e) {
                    let message = ''
                    if(e.message.message.includes('to validate domain: slug must match regexp: ^[-a-zA-Z0-9_')) {
                        message = "В названии субъекта необходимо ввести минимум два символа. Допустимые символы латиница , цифры, знаки . - _"
                    } else {
                        message = e.message?.message
                    }

                    resolve({
                        status: false,
                        code: e.message?.code,
                        message: message,
                    })
                }
            })
        }
        const postDomainList = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_DOMAIN_LIST, config.domain.list)
                    console.log('DOMAIN LIST ', data)
                    resolve({
                        status: true,
                        list: data.list
                    })
                } catch (e) {
                    resolve({
                        status: false,
                        message: e
                    })
                }
            })
        }


        resolve({
            post: {
                count: postDomainCount,
                save: postDomainSave,
                delete: postDomainDelete,
                list: postDomainList
            }
        })
    })
}