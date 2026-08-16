export default (self) => {
    return new Promise(async (resolve, reject) => {

        const parallaxImg = (img, imgParent) => {
            let speed = img.dataset.speed;
            let imgY = imgParent.offsetTop
            let winY = self.scrollTop
            let winH = window.innerHeight
            let parentH = imgParent.offsetHeight;
            let winBottom = winY + winH;

            let imgPercent = 0
            if (winBottom > imgY && winY < imgY + parentH) {
                let imgBottom = ((winBottom - imgY) * speed);
                let imgTop = winH + parentH;
                imgPercent = ((imgBottom / imgTop) * 100) + (0 - (speed * 50));
            }

            console.log('=============== parallaxImg =====================')
            img.style.top = `${imgPercent}%`
            img.style.transform = `translate(0, -${imgPercent}%)`
        }

        resolve({
            parallax: (img, imgParent) => {
                let self_img = img
                let self_imgParent = imgParent
                parallaxImg(self_img, self_imgParent)

                return (events) => {
                    parallaxImg(self_img, self_imgParent)
                }
            }
        })
    })
}