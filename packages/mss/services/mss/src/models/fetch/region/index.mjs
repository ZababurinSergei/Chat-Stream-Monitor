import { request } from "../index.mjs";

export const Region = (self, config) => {
    return new Promise((resolve, reject) => {

        const URL_REGION_LIST = "/v1/region/list";
        const URL_REGION_COUNT = "/v1/region/count";
        const URL_REGION_SAVE = "/v1/region/save";
        const URL_REGION_DELETE = "/v1/region/delete";

        /**
         * REGION
         * @returns {Promise<unknown>}
         */
        const postRegionCount = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_REGION_COUNT, config.region.count)
                    console.log('REGION COUNT ', data)
                    resolve(data)
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postRegionDelete = (regionId = {
            "regionId": "regionId"
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_REGION_DELETE, regionId)
                    console.log('REGION DELETE', data)
                    resolve(data)
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postRegionSave = (data = {
            "region": {
                "region": "f_mzrv_cons332mr005",
                "description": "типа дагестан"
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_REGION_SAVE, data)
                    console.log('REGION SAVE ', result)
                    resolve({
                        status: true,
                        result
                    })
                } catch (e) {
                    let message = ''
                    if(e.message.message.includes('ed to validate region: region must match regexp: ^[-a-zA-Z0-9_.]{2')) {
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
        const postRegionList = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_REGION_LIST, config.region.list)
                    console.log('REGION LIST ', data)
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
                count: postRegionCount,
                save: postRegionSave,
                delete: postRegionDelete,
                list: postRegionList
            }
        })
    })
}