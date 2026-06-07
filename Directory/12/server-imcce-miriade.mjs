// /10/map/server-imcce-miriade.mjs
// Точка входа - реэкспортирует все из модульной структуры

import miriadeModule from './server-imcce-miriade/index.js';

// Реэкспортируем все функции для обратной совместимости
export const {
    ephemcc,
    ephemph,
    asteroidEphem,
    miriadeModels,
    miriadeBatch,
    miriadeInfo,
    miriadeTest
} = miriadeModule;

export default miriadeModule;