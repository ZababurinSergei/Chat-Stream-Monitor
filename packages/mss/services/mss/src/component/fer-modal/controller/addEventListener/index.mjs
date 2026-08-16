export default async (self, actions) => {
    let component = self.shadowRoot === null
        ? self
        : self.shadowRoot

    const events = (action) => {
        return (events) => {
            action({
                parent: self,
                events: events
            })
        }
    }

    /**
     * [{
     *   type: 'click',
     *   action: events(actions.push)
     * }, {
     *   type: 'popstate',
     *   action: events(actions.events)
     * }]
     */
    const queue = []

    return {
        init: () => {

        },
        terminate: () => {

        }
    }

}