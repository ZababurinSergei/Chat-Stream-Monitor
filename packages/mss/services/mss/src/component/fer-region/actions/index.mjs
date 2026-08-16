export default (self) => {
    return new Promise(async (resolve, reject) => {

        resolve({
            click: (event) => {
                console.log('==================', event)
            }
        })
    })
}
