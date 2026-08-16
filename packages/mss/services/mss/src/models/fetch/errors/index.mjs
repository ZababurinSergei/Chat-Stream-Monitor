import { request } from '../index.mjs';

export const Errors = (self, config) => {
    return new Promise((resolve, reject) => {
        const URL_ERRORS = "/v1/event";
        const URL_ERRORS_COUNT = "/v1/event/error/count";
        const URL_ERRORS_DELETE = "/v1/event/error/delete";
        const URL_ERRORS_LIST = "/v1/event/error/list";
        const URL_ERRORS_SAVE = "/v1/event/error/save";
        const postErrors = (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_ERRORS,  data)
                    console.log('ERRORS SELF ', result)
                    resolve({
                        status: true,
                        event: result.event
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

        const postErrorsCount = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await request.post(URL_ERRORS_COUNT,  config.event.count)
                    console.log('ERRORS COUNT ', data)
                    resolve(data)
                } catch (e) {
                    console.error('ERROR REQUEST', e)
                }
            })
        }

        const postErrorsDelete = (data = {
             eventId: "1bd287c7-be8d-4f17-999c-cc6f5565ac51"
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_ERRORS_DELETE, data)
                    console.log('ERRORS DELETE', result)
                    resolve({
                        status: true,
                        errors: result
                    })
                } catch (e) {
                    resolve({
                        status: false,
                        message: e
                    })
                }
            })
        }

        const postErrorsList = (data = {
            "condition": {
                "eventIds": [
                    "dfa7bb53-985f-4c62-b823-eab226dda8de"
                ]
            }
        }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_ERRORS_LIST, data)
                    console.log('ERRORS LIST ', result)
                    resolve({
                        status: true,
                        errors: result.errors
                    })
                } catch (e) {
                    resolve({
                        status: false,
                        message: e
                    })
                }
            })
        }

        const postErrorsSave = (data = {
                "entry": {
                    "id": "69c8bffc-7230-4225-afb3-d4a3ba0f020e",
                    "eventId": "5db561c4-1b26-49f2-ba62-c1f62c236be8",
                    "code": "101",
                    "message": "ошибка 101",
                    "howToFix": "как починить ошибку 101 updated"
                }
            }
        ) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await request.post(URL_ERRORS_SAVE, data)
                    console.log('ERRORS SAVE ', result)
                    resolve({
                        status: true,
                        result
                    })
                } catch (e) {
                    const isId = e.message.message.includes('invalid value for uint64 type');
                    const isNumber = e.message.message.includes('"message" of relation "event_error" violates not-n');
                    const isHowToFix = e.message.message.includes('column "how_to_fix" of relation "event_error" violates');
                    const isErrorCode = e.message.message.includes('error with code already exist');

                    let message = '';

                    if (isId) {
                        message = 'Требуется ввести код ошибки';
                    }

                    if (isNumber) {
                        message = 'Нулевое значение в столбце «сообщение»';
                    }

                    if (isHowToFix) {
                        message = 'Нулевое значение в столбце «Как исправить»';
                    }

                    if (isErrorCode) {
                        message = 'Код уже существует';
                    }

                    resolve({
                        status: false,
                        code: e.message?.code,
                        message: message
                    });
                }
            })
        }

        resolve({
            post: {
                self: postErrors,
                count: postErrorsCount,
                save: postErrorsSave,
                delete: postErrorsDelete,
                list: postErrorsList
            }
        })
    })
}