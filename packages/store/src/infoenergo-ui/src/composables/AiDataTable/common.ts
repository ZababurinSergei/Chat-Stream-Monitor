import type { DataType } from '@/interfaces/common';
import { parseRussianDateTimeToTimestamp } from '@/utils/date';
import type { HighlightPart } from './types';

export const SEARCH_DEBOUNCE_MS = 500;

/**
 * Разбивает текст на сегменты, помечая регистронезависимые вхождения `term`.
 * `term` ожидается уже нормализованным (trim + lowerCase). Возвращает `null`,
 * если искать нечего или совпадений нет.
 */
export const splitByHighlight = (text: string, term: string | undefined): HighlightPart[] | null => {
    if (!term) return null;

    const lower = text.toLowerCase();
    if (!lower.includes(term)) return null;

    const parts: HighlightPart[] = [];
    let cursor = 0;
    while (cursor < text.length) {
        const matchIndex = lower.indexOf(term, cursor);
        if (matchIndex === -1) {
            parts.push({ text: text.slice(cursor), match: false });
            break;
        }
        if (matchIndex > cursor) parts.push({ text: text.slice(cursor, matchIndex), match: false });
        parts.push({ text: text.slice(matchIndex, matchIndex + term.length), match: true });
        cursor = matchIndex + term.length;
    }
    return parts;
};

export const makeSorter =
    (dataField: string, dataType: DataType) =>
    (leftRow: Record<string, unknown>, rightRow: Record<string, unknown>) => {
        const leftValue = leftRow[dataField];
        const rightValue = rightRow[dataField];

        if (leftValue === null && rightValue === null) return 0;
        if (leftValue === null) return 1;
        if (rightValue === null) return -1;

        if (dataType === 'number') {
            return Number(leftValue) - Number(rightValue);
        }

        if (dataType === 'date' || dataType === 'datetime') {
            return parseRussianDateTimeToTimestamp(leftValue) - parseRussianDateTimeToTimestamp(rightValue);
        }

        if (dataType === 'boolean') {
            return Number(Boolean(leftValue)) - Number(Boolean(rightValue));
        }

        return String(leftValue).localeCompare(String(rightValue), 'ru');
    };
