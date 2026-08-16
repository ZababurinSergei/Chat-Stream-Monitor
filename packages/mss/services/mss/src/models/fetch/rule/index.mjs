import {request} from "../index.mjs";

export const Rule = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_RULE = "/v1/rule";
        const URL_RULE_COUNT = "/v1/rule/count";
        const URL_RULE_DELETE = "/v1/rule/delete";
        const URL_RULE_LIST = "/v1/rule/list";
        const URL_RULE_SAVE = "/v1/rule/save";

        const postRule = (data = {
            "condition": {
                "snapshotIds": [
                    "ca50d027-f9c8-42e5-a904-dc7bc4485b46"
                ]
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_RULE, data)
                    console.log('RULE SELF ', result)
                     if(result.code === 13) {
                         resolve({
                             status: false,
                             code: result.code,
                             message: 'Неверный идентификатор записи'
                         })
                     }else if(result.code === 5) {
                        resolve({
                            status: false,
                            code: result.code,
                            message: 'Правило не найденно'
                        })
                     } else {
                         
                         resolve({
                             status: true,
                             rule: result.rule
                         })
                     }

                } catch (e) {
                    console.log(e)
                    
                    resolve({
                        status: false,
                        code: e.message?.code,
                        message: e.message?.message,
                    })
                }
            })
        }

        const postRuleCount = (data = {
            "page": {
                "limit": 12,
                "offset": 0
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_RULE_COUNT,  data)
                    console.log('RULE COUNT ', data)
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

        const postRuleDelete = (data = {
            "snapshotId": ""
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_RULE_DELETE, data)
                    console.log('RULE DELETE', result)
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

        const postRuleList = (data = {}) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_RULE_LIST, data)
                    console.log('RULE LIST ', result)
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

        const postRuleSave = (data = {
            "rule": {
                "eventSnapshotId": "7e424b9c-d6df-4ca1-8b09-a7bbd4fd625e",
                "version": "1.0.1",
                "functionBase64Encoded": "ZnVuY3Rpb24gcnVsZShjdHgsIGV2ZW50KXsKCWNvbnNvbGUubG9nKCJzb21ldGhpbmciKQp9",
                "description": "some rule 12"
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_RULE_SAVE, data)
                    console.log('RULE SAVE ', result)
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

        resolve({
            post: {
                self: postRule,
                count: postRuleCount,
                save: postRuleSave,
                delete: postRuleDelete,
                list: postRuleList
            }
        })
    })
}