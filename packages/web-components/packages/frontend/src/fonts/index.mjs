export const Fonts = async (name, file) => {
    try {
        const url = new URL(`./${file}`, import.meta.url)
        let fontFace = new FontFace(name, `url(${url.pathname})`)

        fontFace = await fontFace.load()

        if(fontFace.status === 'loaded') {
            document.fonts.add(fontFace)
            console.log('font: ', name)
        }

        return true
    } catch (e) {
        console.error('ERROR', e)
        return false
    }

}

export default {
    description: 'fonts'
}