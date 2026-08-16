const headers = {
    "Content-Type": "application/json"
};

function FetchException(message) {
    this.message = message;
    this.name = "FetchException";
}

async function postData(url, data, customHeaders = {}) {

    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: Object.assign(headers, customHeaders),
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(data) // body data type must match "Content-Type" header
        }).then(async function(response) {
            if(response.status === 400) {
                throw new FetchException(await response.json());
            } else {
                resolve(response.json())
            }
        }).catch(function(e) {
            reject(e)
        });

    })
}

function getData(url) {
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: headers,
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        return data;
    }).catch(function(e) {
        console.log('ERROR', e)
    });
}

async function putData(url, data) {
    // Default options are marked with *
    return fetch(url, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: headers,
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data)
    }).then(function(response) {
        return response.json();
    }).then(function(data){
        return data
    }).catch(function(e) {
        console.log('ERROR', e)
    });
}

async function deleteData(url) {
    // Default options are marked with *
    return fetch(url, {
        method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: headers,
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).then(function(response) {
        return response.json();
    }).catch(function(e) {
        console.log('ERROR', e)
    });
}

export const request = {
    post: postData,
    get: getData,
    put: putData,
    delete: deleteData
}

export default {
    post: postData,
    get: getData,
    put: putData,
    delete: deleteData
}
