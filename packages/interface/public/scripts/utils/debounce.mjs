/**
 * Утилита для debounce (отложенного выполнения)
 * @param {Function} func - Функция для выполнения
 * @param {number} wait - Время задержки в мс
 * @param {boolean} immediate - Выполнить немедленно при первом вызове
 * @returns {Function} Новая функция с debounce-логикой
 */
export default function debounce(func, wait = 300, immediate = false) {
    let timeout;

    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}

/**
 * Версия с возможностью отмены
 * @param {Function} func
 * @param {number} wait
 * @returns {Function} Функция с cancel()
 */
export function debounceWithCancel(func, wait = 300) {
    let timeout;
    const debounced = function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };

    debounced.cancel = () => {
        clearTimeout(timeout);
        timeout = null;
    };

    return debounced;
}

// Для тестирования (не включать в production)
export const __test__ = {
    debounce,
    debounceWithCancel
};