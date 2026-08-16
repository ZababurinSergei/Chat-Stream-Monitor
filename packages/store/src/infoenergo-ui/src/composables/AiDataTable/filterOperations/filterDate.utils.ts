import type {
    DateFilterChangePayload,
    DateFilterMainOperation,
    DateFilterState,
    DateFilterToggleOperation,
    DateFilterValueKey,
} from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';

export const DATE_FILTER_OPERATION_VALUE_KEYS: Record<DateFilterMainOperation, readonly DateFilterValueKey[]> = {
    equals: ['equals'],
    range: ['rangeFrom', 'rangeTo'],
    outer: ['outerFrom', 'outerTo'],
    except: ['except'],
    currentMonth: [],
    previousMonth: [],
    currentYear: [],
    previousYear: [],
};

const DATE_FILTER_DATE_KEYS = [
    ...new Set(Object.values(DATE_FILTER_OPERATION_VALUE_KEYS).flat()),
] as DateFilterValueKey[];

export const createEmptyDateFilterState = (): DateFilterState => ({
    mainOperation: null,
    includeEmpty: false,
    values: {
        equals: null,
        rangeFrom: null,
        rangeTo: null,
        outerGreater: false,
        outerLess: false,
        outerFrom: null,
        outerTo: null,
        except: null,
    },
});

export const cloneDateFilterState = (state: DateFilterState): DateFilterState => ({
    mainOperation: state.mainOperation,
    includeEmpty: state.includeEmpty,
    values: { ...state.values },
});

const resetOuterSides = (values: DateFilterState['values']) => {
    values.outerGreater = false;
    values.outerLess = false;
};

const clearValuesExcept = (values: DateFilterState['values'], keepKeys: Set<DateFilterValueKey>) => {
    for (const key of DATE_FILTER_DATE_KEYS) {
        if (!keepKeys.has(key)) values[key] = null;
    }
};

export const resolveDateFilterChecked = (
    operation: DateFilterToggleOperation | 'separator',
    state: DateFilterState
): boolean => {
    switch (operation) {
        case 'separator':
            return false;
        case 'empty':
            return state.includeEmpty;
        case 'outerGreater':
            return state.values.outerGreater;
        case 'outerLess':
            return state.values.outerLess;
        default:
            return state.mainOperation === operation;
    }
};

export const handleDateFilterChange = (state: DateFilterState, payload: DateFilterChangePayload): DateFilterState => {
    if (payload.kind === 'setValue') {
        return {
            ...state,
            values: {
                ...state.values,
                [payload.key]: payload.value ?? null,
            },
        };
    }

    if (payload.operation === 'empty') {
        return { ...state, includeEmpty: payload.checked };
    }

    if (payload.operation === 'outerGreater' || payload.operation === 'outerLess') {
        const isGreater = payload.operation === 'outerGreater';
        const next = cloneDateFilterState(state);

        if (payload.checked) {
            if (next.mainOperation !== 'outer') {
                clearValuesExcept(next.values, new Set(DATE_FILTER_OPERATION_VALUE_KEYS.outer));
                next.mainOperation = 'outer';
                resetOuterSides(next.values);
            }
            if (isGreater) next.values.outerGreater = true;
            else next.values.outerLess = true;
            return next;
        }

        if (next.mainOperation !== 'outer') return next;

        if (isGreater) {
            next.values.outerGreater = false;
            next.values.outerFrom = null;
        } else {
            next.values.outerLess = false;
            next.values.outerTo = null;
        }

        if (!next.values.outerGreater && !next.values.outerLess) {
            next.mainOperation = null;
        }

        return next;
    }

    const nextMain: DateFilterMainOperation | null = payload.checked
        ? payload.operation
        : state.mainOperation === payload.operation
          ? null
          : state.mainOperation;

    const next = cloneDateFilterState(state);

    if (payload.checked && next.mainOperation !== nextMain) {
        clearValuesExcept(next.values, new Set(DATE_FILTER_OPERATION_VALUE_KEYS[nextMain!]));
    }
    if (!payload.checked && next.mainOperation === payload.operation) {
        for (const key of DATE_FILTER_OPERATION_VALUE_KEYS[payload.operation as DateFilterMainOperation]) {
            next.values[key] = null;
        }
    }

    if (nextMain !== 'outer') {
        resetOuterSides(next.values);
    }

    return { ...next, mainOperation: nextMain };
};
