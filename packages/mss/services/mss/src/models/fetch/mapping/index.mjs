import { request } from "../index.mjs";

export const Mapping = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_MAPPING = "/v1/mapping";
        const URL_MAPPING_COUNT = "/v1/mapping/count";
        const URL_MAPPING_DELETE = "/v1/mapping/delete";
        const URL_MAPPING_LIST = "/v1/mapping/list";
        const URL_MAPPING_SAVE = "/v1/mapping/save";

        const postMapping = (data = {
            "condition":{
                "ids":[
                    "string"
                ]
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MAPPING,  data)
                    console.log('MAPPING SELF ', result)
                    if(result.code === 5 ) {
                        resolve({
                            status: false,
                            message: 'Запись не найдена'
                        })
                    } else {
                        resolve({
                            status: true,
                            mapping: result.mapping
                        })
                    }

                } catch (e) {
                    resolve({
                        status: false,
                        code: e.message?.code,
                        message: e.message?.message,
                    })
                }
            })
        }

        const postMappingCount = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MAPPING_COUNT, {})
                    console.log('MAPPING COUNT ', result)
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

        const postMappingDelete = (data = {
            "mappingId": "string"
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MAPPING_DELETE, data)
                    console.log('MAPPING DELETE', result)
                    resolve({
                        status: true,
                        delete: result
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

        const postMappingList = (data = {
            "page": {
                "limit": 200,
                "offset": 0
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MAPPING_LIST, data)
                    console.log('MAPPING LIST ', result)
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

        const postMappingSave = (data = {
            "mapping": {
                "eventSnapshotId": "a45ec933-cc2b-4fe7-a12b-1ba99f1a6a36",
                "regionId": "451f532b-8637-42b1-a341-2f2b27f7e528",
                "table": {
                    "sourceTableName": "mo",
                    "aliases": [
                        {
                            "sourceName": "parent_id",
                            "destinationName": "parent_oid",
                            "kind": 1,
                            "type": 1
                        }
                    ]
                }
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_MAPPING_SAVE, data)
                    console.log('MAPPING SAVE ', result)
                    resolve({
                        status: true,
                        list: result
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
                self: postMapping,
                count: postMappingCount,
                save: postMappingSave,
                delete: postMappingDelete,
                list: postMappingList
            }
        })
    })
}