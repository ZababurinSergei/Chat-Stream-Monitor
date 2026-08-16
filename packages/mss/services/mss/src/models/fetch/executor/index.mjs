import { request } from "../index.mjs";
export const Executor = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_EXECUTOR_APPLY = "/v1/executor/apply";
        const URL_EXECUTOR_INFO = "/v1/executor/info";
        const URL_EXECUTOR_SET = "/v1/executor/mapping/set";
        const URL_EXECUTOR_REMOVE = "/v1/executor/remove";
        const URL_EXECUTOR_VALIDATORS = "/v1/executor/validators";
        const URL_EXECUTOR_VERIFY = "/v1/executor/verify";
        const URL_EXECUTOR_VERIFY_RULE = "/v1/executor/verify/rule";

        /**
         * EXECUTOR
         * @returns {Promise<unknown>}
         */
        const postExecutorApply = (data = {
            "eventSnapshotId": "",
            "manifestSnapshotId": "",
            "validatorVersion": "",
            "force": false
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_EXECUTOR_APPLY,  data)
                    console.log('EXECUTOR APPLY', result)
                    resolve({
                        status: true,
                        apply:  result
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

        const postExecutorRemove = (data = {
            "type": "",
            "schemaId": "",
            "region": "",
            "validatorVersion": ""
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_EXECUTOR_REMOVE, data)
                    console.log('EXECUTOR REMOVE', result)
                    resolve({
                        status: true,
                        remove:  result
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

        const postExecutorInfo = (data = {
            "current": true
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_EXECUTOR_INFO, data)
                    console.log('EXECUTOR INFO', result)
                    resolve({
                        status: true,
                        info: result
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

        const postExecutorSet = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_EXECUTOR_SET, config.executor.set)
                    console.log('EXECUTOR SET', data)
                    resolve({})
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postExecutorVerifyRule = (data = {
            "eventSnapshotId": "string",
            "functionBase64Encoded": "string",
            "theFact": {}
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_EXECUTOR_VERIFY_RULE, data)
                    console.log('EXECUTOR VERIFY RULE', result)
                    resolve({
                        status: true,
                        verify: result
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

        const postExecutorValidators = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_EXECUTOR_VALIDATORS, config.executor.validators)
                    console.log('EXECUTOR VALIDATORS', data)
                    resolve({
                        status: true,
                        validators: data
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

        const postExecutorVerify = (data= {
            "manifestSnapshotId": "string",
            "theFact": {}
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_EXECUTOR_VERIFY, data)
                    console.log('EXECUTOR VERIFY', result)
                    resolve({
                        status: true,
                        verify: result
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
                apply: postExecutorApply,
                info: postExecutorInfo,
                set: postExecutorSet,
                remove: postExecutorRemove,
                validators: postExecutorValidators,
                verify: postExecutorVerify,
                verifyRule: postExecutorVerifyRule
            }
        })
    })
}