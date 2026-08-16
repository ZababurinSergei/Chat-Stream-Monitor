export const Fonts = async (pathname) => {
    try {
        const LatoRegular = new FontFace('Lato', `url(${pathname}/this/fonts/lato/Lato-Regular.ttf)`)
        const LatoBold = new FontFace('Lato-Bold', `url(${pathname}/this/fonts/lato/Lato-Bold.ttf)`)
        const LatoLight = new FontFace('Lato-Light', `url(${pathname}/this/fonts/lato/Lato-Light.ttf)`)

        const loadedLatoRegular = await LatoRegular.load()
        const loadedLatoBold = await LatoBold.load()
        const loadedLatoLight = await LatoLight.load()

        console.log('Fonts: Lato, Lato-Bold, Lato-Light')
        document.fonts.add(loadedLatoRegular)
        document.fonts.add(loadedLatoBold)
        document.fonts.add(LatoLight)
        return true
    } catch (e) {
        console.error('ERROR', e)
        return false
    }

}

export default {
    description: 'fonts'
}