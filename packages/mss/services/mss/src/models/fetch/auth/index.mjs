import { request } from "../index.mjs";

export const Auth = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_AUTH_TOKEN = "/v1/auth/token";
        const URL_AUTH_USERINFO = "/v1/auth/userinfo";
        const URL_AUTH_RBAC = "/v1/auth/rbac";

        /**
         * DOMAIN
         * @returns {Promise<unknown>}
         */
        const postAuthToken = (data = {
            "reqType": 0,
            "data": ""
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    console.log('AUTH REQUEST ', data)
                    const result = await request.post(URL_AUTH_TOKEN,  data)
                    console.log('AUTH TOKEN ', result)
                    resolve({
                        status: true,
                        token: result
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

        const postAuthUserinfo = (data = {
            Authorization: `Bearer token`
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_AUTH_USERINFO,{} , data)
                    console.log('AUTH USERINFO', result)
                    resolve({
                        status: true,
                        userInfo: result
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

        const postAuthRbac = (data =  {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_AUTH_RBAC, data)
                    console.log('AUTH RBAC ', result)
                    resolve({
                        status: true,
                        rbac: result
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
                token: postAuthToken,
                userinfo: postAuthUserinfo,
                rbac: postAuthRbac
            }
        })
    })
}