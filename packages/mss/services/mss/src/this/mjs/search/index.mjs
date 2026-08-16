
const makeAPICall = (searchValue) => {
    if (!searchValue) {
        return;
    }

    // Use the API link to see the result
    fetch(`https://api.../v2/beers?beer_name=${searchValue}`)
        .then((res) => {
            res.json().then((response) => {
                response.forEach((item) => {
                    const div = document.createElement("div");
                    div.textContent = item.name;
                    div.classList.add("item");
                    container.appendChild(div);
                });
            });
        })
        .catch((e) => { });
};

const debounce = (fn, delay = 1000) => {
    let timerId = null;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => fn(...args), delay);
    };
};

export const search = debounce(makeAPICall, 500);

export default {
    description: 'debounce'
}