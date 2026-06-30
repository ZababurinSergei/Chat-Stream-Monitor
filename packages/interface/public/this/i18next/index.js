// using json imports would work, but interpolation checks would not work
// import ns1 from './en/ns1.json';
// import ns2 from './en/ns2.json';
import english from './en/index.js';
import russian from './ru/index.js';

export const defaultNS = 'ru';

export const resources = {
    en: {
        http: english,
        https: english
    },
    ru: {
        http: russian,
        https: russian
    },
};