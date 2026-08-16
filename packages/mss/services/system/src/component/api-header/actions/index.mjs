export default (self) => {
    return new Promise(async (resolve, reject) => {
        const mssAuth = document.querySelector('mss-auth')

        resolve({
            click: async (event) => {
                mssAuth.login()
            }
        })
    })
}
