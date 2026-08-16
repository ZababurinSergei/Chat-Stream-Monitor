export const onload = (self) => {
    return new Promise((resolve, reject) => {
        let timerId = setTimeout(function tick() {
            if(self._isOnload) {
                clearTimeout(timerId);
                // console.log(`     🟡 COMPONENTS ${self.tagName} connected`)
                resolve(self)
            } else {
                timerId = setTimeout(tick, 15);
            }
        }, 50);
    })
}

export default {
    description: 'await onload'
}