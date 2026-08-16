export const loader = (url) => {
    return new Promise(function (resolve, reject) {
        let verifyScript = true
        let Script = {}

        for(let item of document.head.querySelectorAll('script')){
            if(item.src.indexOf(`${url}`) > 0){
                verifyScript = false
                Script = item
            }
        }

        if(verifyScript){
            let load = document.createElement('script');
            load.src = url
            document.head.appendChild(load)
            load.onload = (out) =>{
                // document.dispatchEvent( new CustomEvent(`${name}-loading`))
                resolve(true)
            }
        } else {
            resolve(true)
        }
    })
}

export default  {
    description: 'loader'
}