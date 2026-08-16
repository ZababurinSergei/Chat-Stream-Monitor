export const loadHTML = (htmlRelativeUrl, baseUrl = import.meta.url) => {
    const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
    return fetch(htmlUrl).then(response => response.text());
}
export const activeClass = "active"
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

export const randomColor = () => `#${Math.floor(Math.random()*16777215).toString(16)}`;
export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { size } from './convert/convert.mjs'

export default {
    description: 'utilities for this project'
}