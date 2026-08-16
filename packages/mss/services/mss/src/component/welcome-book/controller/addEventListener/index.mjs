export default async (self, actions) => {
    let shadowRoot = self.shadowRoot === null
        ? self
        : self.shadowRoot

    let images = shadowRoot.querySelectorAll('.img-parallax')
    let eventsArray = []
    return {
        init: () => {
            images.forEach(img => {
                let imgParent = img.parentNode;
                const events = actions.parallax(img, imgParent)
                eventsArray.push(events)
            })

            for(let item of eventsArray) {
                self.addEventListener("scroll", item);
            }
        },
        terminate: () => {
            for(let item of eventsArray) {
                self.removeEventListener("scroll", item)
            }
        }
    }

}