export default (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            _doRender: (event) => {
                console.log('🏤 RENDER 🏤', event)
            }
        })
    })
}
