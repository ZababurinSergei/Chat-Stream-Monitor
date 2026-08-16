export const verification = (self, path, value) => {

    if(!self._state.hasOwnProperty(path)) {
        alert(`надо определить свойство ${path} в стейте`)
        console.assert(false, `надо определить свойство ${path} в стейте`, {
            state: self._state
        })

    } else {
        if (self._state[path] !== value) {
            self._state[path] = value;
            self._doRender();
        }
    }
}

export default {
    description: 'проверка устанавлваемого стейта в компонентах'
}