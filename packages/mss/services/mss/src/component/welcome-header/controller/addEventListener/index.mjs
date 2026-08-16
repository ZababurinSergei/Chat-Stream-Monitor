
export default async (self, actions) => {

    return {
        init: () => {
            window.addEventListener('welcome-header', actions.welcomeHeader)
        },
        terminate: () => {
            window.removeEventListener('welcome-header', actions.welcomeHeader)
        }
    }

}