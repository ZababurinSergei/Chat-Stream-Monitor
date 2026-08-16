import { loadHTML } from './this/index.mjs'
export const system = async (config) => {
    const {pathname, CSSVariables, cssShadow, cssLight, mountPoint, pathTemplate} = Object.assign({
        pathname: '.',
        mountPoint: document.body,
        pathTemplate: undefined,
        template: undefined,
        CSSVariables: undefined,
        cssShadow: undefined,
        cssLight: undefined
    }, config);

    const components = [
        'api-relation',
        'api-property',
        'api-substrate',
        'api-footer',
        'api-time',
        'api-header',
        'api-button',
        'api-main',
        'link-auction'
    ]

    for (let i = 0; i < components.length; ++i) {
        import(`${pathname}/component/${components[i]}/index.mjs`)
    }

    let parser = new DOMParser()

    const template = parser.parseFromString(await loadHTML(`/template/${pathTemplate}/index.html`), 'text/html').querySelector('template')

    if(cssShadow) {
        template.content.querySelector('api-substrate').dataset.cssShadow = cssShadow
    }

    const images = template.content.querySelectorAll('img')
    for(let i =0 ; i < images.length; ++i) {
        let url = new URL(images[i].src)
        url.pathname = `${mountPoint.pathname}${url.pathname}`
        images[i].src = url.pathname
    }

    const shadow = mountPoint.attachShadow({mode: "open"});

    const lightStyle = document.createElement('style')
    lightStyle.textContent = `@import "${pathname}/this/css/${cssLight ? cssLight: 'index'}.light.css";`
    mountPoint.appendChild(lightStyle)

    const shadowStyle = document.createElement('style')
    shadowStyle.textContent = `@import "${pathname}/this/css/index.shadow.css";`
    mountPoint.shadowRoot.appendChild(shadowStyle)

    const systemContent = template.content;
    shadow.prepend(systemContent);
}

export default { system }