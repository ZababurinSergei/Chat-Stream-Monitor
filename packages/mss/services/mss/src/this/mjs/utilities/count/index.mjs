let animationendCount = 0
let isUp = false
export const animationCount = {
    increment: () => {
        animationendCount = animationendCount + 1
        return animationendCount
    },
    decrement: () => {
        animationendCount = animationendCount - 1
        return animationendCount
    },
    reset: () => {
        animationendCount = 0
        return animationendCount
    },
    get: () => animationendCount,
    setDirection: (direction) => {
        return isUp = direction
    },
    getDirection: (direction) => isUp
}
