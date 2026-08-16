export const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

export const DATETIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

/**
 * Парсит `dd.MM.yyyy` или `dd.MM.yyyy, HH:mm:ss` в timestamp.
 * Возвращает `NaN`, если формат не распознан.
 */
const RUSSIAN_DATE_TIME_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/;

export const parseRussianDateTimeToTimestamp = (value: unknown): number => {
    const normalizedValue = String(value).trim();
    const match = normalizedValue.match(RUSSIAN_DATE_TIME_PATTERN);
    if (!match) return Number.NaN;

    const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = match;
    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds)
    ).getTime();
};

/**
 * Нормализует входное значение ячейки к timestamp.
 */
export const toTimestamp = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    const parsedRussian = parseRussianDateTimeToTimestamp(value);
    if (!Number.isNaN(parsedRussian)) return parsedRussian;

    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Возвращает календарные год и месяц (0–11) значения ячейки.
 * Для `dd.MM.yyyy` берёт месяц из строки, без сдвига через `Date.parse`.
 */
export const getCalendarYearMonth = (value: unknown): { year: number; month: number } | null => {
    if (value === null || value === undefined || value === '') return null;

    const match = String(value).trim().match(RUSSIAN_DATE_TIME_PATTERN);
    if (match) {
        const [, , month, year] = match;
        return { year: Number(year), month: Number(month) - 1 };
    }

    const timestamp = toTimestamp(value);
    if (timestamp === null) return null;

    const date = new Date(timestamp);
    return { year: date.getFullYear(), month: date.getMonth() };
};
