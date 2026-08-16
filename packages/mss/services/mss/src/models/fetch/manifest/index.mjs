import {request} from "../index.mjs";

export const Manifest = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_MANIFEST = "/v1/manifest";
        const URL_MANIFEST_COUNT = "/v1/manifest/count";
        const URL_MANIFEST_DELETE = "/v1/manifest/delete";
        const URL_MANIFEST_LIST = "/v1/manifest/list";
        const URL_MANIFEST_SAVE = "/v1/manifest/save";
        const URL_MANIFEST_VERIFY_LIST = "/v1/manifest/verify/results";

        const postManifest = (data = {
            "condition": {
                "snapshotIds": [
                    "87f5dd3d-cdb1-4573-86a8-90b18cad5bbf"
                ]
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST, data)
                    console.log('MANIFEST SELF ', result)
                    if(result.code === 5) {
                        resolve({
                            status: false,
                            code: result.code,
                            message: 'Манифест не найден'
                        })
                    } else {
                        resolve({
                            status: true,
                            manifest: result.manifest
                        })
                    }
                } catch (e) {
                    if(e.message?.code === 3) {
                        resolve({
                            status: false,
                            code: e.message?.code,
                            message: "Неверный формат идентификатора",
                        })
                    } else {
                        resolve({
                            status: false,
                            code: e.message?.code,
                            message: e.message?.message,
                        })
                    }
                }
            })
        }

        const postManifestCount = (data = {
            "page": {
                "limit": 13,
                "offset": 0
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST_COUNT,  data)
                    console.log('MANIFEST COUNT ', data)
                    resolve({
                        status: true,
                        count: result.count
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

        const postManifestDelete = (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST_DELETE, data)
                    console.log('MANIFEST DELETE', result)
                    resolve({
                        status: true,
                        result
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
        const postManifestList = ( data ) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST_LIST, data)
                    console.log('MANIFEST LIST ', result)
                    resolve({
                        status: true,
                        list: result.list
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

        const postManifestSave = (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST_SAVE, data)
                    console.log('MANIFEST SAVE ', result)
                    resolve({
                        status: true,
                        manifest: result.manifest
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

        const postManifestVerify = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_MANIFEST_SAVE, config.manifest.verify)
                    console.log('MANIFEST SAVE ', data)
                    resolve({})
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postManifestVerifyList = (data = {
            "snapshotId": "6d671ed9-08d6-4c43-9af9-02fad70d2eb0"
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MANIFEST_VERIFY_LIST, data)
                    console.log('MANIFEST VERIFY LIST ', result)
                    resolve({
                        status: true,
                        list: result.list
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

        resolve({
            post: {
                self: postManifest,
                count: postManifestCount,
                save: postManifestSave,
                delete: postManifestDelete,
                list: postManifestList,
                verifyList: postManifestVerifyList
            }
        })
    })
}