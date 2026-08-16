export const loadHTML = (htmlRelativeUrl, baseUrl = import.meta.url) => {
    const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
    return fetch(htmlUrl).then(response => response.text());
}
export const activeClass = "active"


export const removeParamFromURL = (url, param) => {
    const [path, searchParams] = url.split('?');
    const newSearchParams = searchParams
        ?.split('&')
        .filter((p) => !(p === param || p.startsWith(`${param}=`)))
        .join('&');
    return newSearchParams ? `${path}?${newSearchParams}` : path;
}
export const normalizePathName = (pathname) => {
    pathname = pathname.startsWith('/') ? pathname : `/${pathname}`
    pathname = pathname.endsWith('/') ? pathname : `${pathname}/`
    return pathname
}

export const events = (name, detail) => window.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail: detail
}));

export const events_d = (name, detail) => document.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail: detail
}));

export const randomColor = () => `#${Math.floor(Math.random()*16777215).toString(16)}`;
export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

export { animationCount } from './count/index.mjs'
export default {
    description: 'utilities for this project'
}