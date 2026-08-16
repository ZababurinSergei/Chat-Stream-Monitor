import bus from '/static/html/components/component_modules/iframe/iframe.mjs'
export default ()=>{
    let iframe = document.createElement('iframe');
    // iframe.style.display = "none";
    iframe.style.transition = "opacity 0.2s ease 0s"
    iframe.style.position = 'fixed'
    iframe.style.opacity = '1'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.left = '0px'
    iframe.style.top = '0px'
    iframe.style.border = 'none'
    iframe.style.display = 'flex'
    iframe.style.zIndex = '99999999'
    iframe.src = 'http://localhost:4999/login'
    iframe.onload = function () {
        let host = 'http://localhost:4999'
        bus.set(host, iframe, document.body)
        document.dispatchEvent( new CustomEvent(`provider-login`,{
            detail:host
        }))
    }
    document.body.appendChild(iframe);


}

/*
style="transition: opacity 0.2s ease 0s; position: fixed; opacity: 1; width: 100%; height: 100%; left: 0px; top: 0px; border: none; display: block; z-index: 99999999;"
 */