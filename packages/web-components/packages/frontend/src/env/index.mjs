const myHeaders = new Headers();

const envInit = {
    method: "GET",
    headers: myHeaders,
    mode: "cors",
    cache: "default",
};

let Index = {}

try {
    const url = new URL('./env.json', import.meta.url)
    const myRequest = new Request(url, envInit);
    const response = await fetch(myRequest);
    Index = await response.json()
} catch (e) {
    console.error('ERROR FETCH JSON', e)
}

export const env = (props) => {
    return Index
}