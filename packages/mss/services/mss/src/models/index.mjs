import { Auth } from './fetch/auth/index.mjs'

const config = {
    domain: {
        list: {

        },
        count: {

        },
        delete: {
            "slug": "test.booking"
        },
        save: {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }
    },
    event: {
        verify: {

        },
        self: {
            "condition": {
                "schemaIds": [
                    "showcase.booking.mo.1.0.1"
                ]
            }
        },
        list: {
            "page": {
                "limit": "10",
                "offset": "0"
            }
        },
        count: {
            "condition": {
                "schemaIds": [
                    "showcase.booking.mo.1.0.0",
                    "showcase.booking.mo.1.0.1"
                ]
            }
        },
        delete: {
            "slug": "test.booking"
        },
        save: {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }
    },
    executor: {
        apply: {

        },
        info: {

        },
        set: {
            "page": {
                "limit": "1",
                "offset": "1"
            }
        },
        remove: {

        },
        validators: {
            "slug": "test.booking"
        },
        verify: {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }
    },
    manifest: {
        verify: {

        },
        self: {

        },
        // list: {
        //     "condition": {
        //         "eventSnapshotIds": [
        //             "1ca4c137-cec4-4404-8de9-4b5c02437342"
        //         ]
        //     }
        // },
        list: {
            "condition": {
                "eventSnapshotIds": [
                    "1ca4c137-cec4-4404-8de9-4b5c02437342"
                ]
            }
        },
        count: {
            "condition": {
                "eventIds": [
                    "2cd1eebb-2c8e-40bf-a929-f0dfe9c74774"
                ]
            }
        },
        delete: {
            "slug": "test.booking"
        },
        save: {
            "manifest": {
                "regionId": "3929982c-09e9-453f-ac9a-16d14d85cad1",
            }
        }
    },
    mapping: {
        verify: {

        },
        self: {

        },
        list: {
            "page": {
                "limit": "1",
                "offset": "1"
            }
        },
        count: {

        },
        delete: {
            "slug": "test.booking"
        },
        save: {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }
    },
    region: {
        list: {
            "page": {
                "limit": "10",
                "offset": "0"
            }
        },
        count: {

        },
        delete: {
            "regionId": "77960d00-b942-44e2-8de8-661d8ed8edcb"
        },
        save: {
            "region": {
                "region": "f_mzrv_cons332mr005",
                "description": "типа дагестан"
            }
        }
    },
    rule: {
        self: {

        },
        list: {
            "page": {
                "limit": "1",
                "offset": "1"
            }
        },
        count: {

        },
        delete: {
            "slug": "test.booking"
        },
        save: {
            "domain": {
                "slug": "test.booking",
                "description": "test description"
            }
        }
    }
}

export const Models = (self) => {
    return new Promise(async (resolve, reject) => {
        const auth = await Auth(self, config)

        resolve({
            post: {
                auth: {
                    token: auth.post.token,
                    userinfo: auth.post.userinfo,
                    rbac: auth.post.rbac
                }
            }
        })
    })
}

export default {
    description: 'request'
}