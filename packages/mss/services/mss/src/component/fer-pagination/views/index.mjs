export { template } from './html/index.mjs'

export function objectsEqual(o1, o2) {
    const entries1 = Object.entries(o1);
    const entries2 = Object.entries(o2);

    if (entries1.length !== entries2.length) {
        return false;
    }

    for (let i = 0; i < entries1.length; ++i) {
        if (entries1[i][0] !== entries2[i][0]) {
            return false;
        }

        if (entries1[i][1] !== entries2[i][1]) {
            return false;
        }
    }

    return true;
}

export default {
    description: 'модули компонента'
}