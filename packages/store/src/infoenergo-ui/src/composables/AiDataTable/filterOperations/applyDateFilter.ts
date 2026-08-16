import type {
    DateFilterMainOperation,
    DateFilterState,
} from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import { DATE_FORMATTER, getCalendarYearMonth, toTimestamp } from '@/utils/date';

export const isDateFilterActive = (state: DateFilterState): boolean =>
    state.mainOperation !== null || state.includeEmpty;

const formatDate = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return DATE_FORMATTER.format(new Date(value));
};

const isSameDay = (a: number, b: number): boolean => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
};

const isCurrentMonth = (value: unknown): boolean => {
    const parts = getCalendarYearMonth(value);
    if (!parts) return false;

    const now = new Date();
    return parts.year === now.getFullYear() && parts.month === now.getMonth();
};

const isPreviousMonth = (value: unknown): boolean => {
    const parts = getCalendarYearMonth(value);
    if (!parts) return false;

    const previous = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    return parts.year === previous.getFullYear() && parts.month === previous.getMonth();
};

const isCurrentYear = (value: unknown): boolean => {
    const parts = getCalendarYearMonth(value);
    return parts !== null && parts.year === new Date().getFullYear();
};

const isPreviousYear = (value: unknown): boolean => {
    const parts = getCalendarYearMonth(value);
    return parts !== null && parts.year === new Date().getFullYear() - 1;
};

const RELATIVE_PERIOD_MATCHERS: Partial<Record<DateFilterMainOperation, (value: unknown) => boolean>> = {
    currentMonth: isCurrentMonth,
    previousMonth: isPreviousMonth,
    currentYear: isCurrentYear,
    previousYear: isPreviousYear,
};

const MATCHERS: Record<
    Exclude<DateFilterMainOperation, 'currentMonth' | 'previousMonth' | 'currentYear' | 'previousYear'>,
    (timestamp: number, state: DateFilterState) => boolean
> = {
    equals: (timestamp, state) => (state.values.equals === null ? true : isSameDay(timestamp, state.values.equals)),
    range: (timestamp, state) => {
        const { rangeFrom, rangeTo } = state.values;
        if (rangeFrom !== null && timestamp < rangeFrom) return false;
        if (rangeTo !== null && timestamp > rangeTo) return false;
        return true;
    },
    outer: (timestamp, state) => {
        const { outerGreater, outerLess, outerFrom, outerTo } = state.values;
        if (outerGreater && outerFrom !== null && timestamp < outerFrom) return false;
        if (outerLess && outerTo !== null && timestamp > outerTo) return false;
        return true;
    },
    except: (timestamp, state) => (state.values.except === null ? true : !isSameDay(timestamp, state.values.except)),
};

const SUMMARY_LABELS: Record<DateFilterMainOperation, (state: DateFilterState) => string> = {
    equals: state => formatDate(state.values.equals) || 'По значению',
    range: state => {
        const from = formatDate(state.values.rangeFrom);
        const to = formatDate(state.values.rangeTo);
        if (from && to) return `С ${from} по ${to}`;
        if (from) return `С ${from}`;
        if (to) return `По ${to}`;
        return 'Диапазон';
    },
    outer: state => {
        const { outerGreater, outerLess, outerFrom, outerTo } = state.values;
        const parts: string[] = [];
        if (outerGreater) {
            const from = formatDate(outerFrom);
            parts.push(from ? `>= ${from}` : '>= ...');
        }
        if (outerLess) {
            const to = formatDate(outerTo);
            parts.push(to ? `<= ${to}` : '<= ...');
        }
        return parts.length ? parts.join(' и ') : 'Внешний диапазон';
    },
    except: state => `Все, кроме ${formatDate(state.values.except)}`,
    currentMonth: () => 'Текущий месяц',
    previousMonth: () => 'Прошлый месяц',
    currentYear: () => 'Текущий год',
    previousYear: () => 'Прошлый год',
};

export const applyDateFilter = (rowValue: unknown, state: DateFilterState): boolean => {
    if (!isDateFilterActive(state)) return true;

    const operation = state.mainOperation;
    if (!operation) {
        if (!state.includeEmpty) return true;
        return toTimestamp(rowValue) === null;
    }

    const relativeMatcher = RELATIVE_PERIOD_MATCHERS[operation];
    if (relativeMatcher) {
        if (toTimestamp(rowValue) === null) return state.includeEmpty;
        return relativeMatcher(rowValue);
    }

    const timestamp = toTimestamp(rowValue);
    if (timestamp === null) return state.includeEmpty;

    return MATCHERS[operation as keyof typeof MATCHERS](timestamp, state);
};

export const getDateFilterSummary = (state: DateFilterState): string => {
    const operation = state.mainOperation;
    if (!operation) return state.includeEmpty ? 'Пустые значения' : '';
    const summary = SUMMARY_LABELS[operation](state);
    return state.includeEmpty ? `${summary} + пустые` : summary;
};
