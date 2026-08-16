export default async (self, actions) => {
    let component = self.shadowRoot === null
        ? self
        : self.shadowRoot

    return {
        init: () => {

        },
        terminate: () => {

        }
    }

}