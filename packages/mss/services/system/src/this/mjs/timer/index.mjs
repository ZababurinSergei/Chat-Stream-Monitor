
export const timer = {
    timeID: undefined,
    init: (container) => {
        let countDownDate = Date.now();

        timer.timeID = setInterval(function () {
            let now = Date.now();
            let distance = now - countDownDate;

            let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);
            const timer = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

            container.innerHTML = ''
            container.insertAdjacentHTML('afterbegin',
                `<div>
              ${timer}
            </div>`)

            if (distance < 0) {
                clearInterval(x);
                container.innerHTML = "EXPIRED";
            }
        }, 1000);
    },
    terminate: () => {
        return clearInterval(timer.timeID)
    }
}

export default {
    description: 'timer'
}