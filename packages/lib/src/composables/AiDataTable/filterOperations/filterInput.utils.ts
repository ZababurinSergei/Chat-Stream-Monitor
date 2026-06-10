export type FilterInputValue = string | [string, string] | null;

export const isEmptyFilterInput = (value: FilterInputValue): boolean => {
    if (value === null) return true;
    if (Array.isArray(value)) return value.every(part => part === '');
    return value === '';
};

export const createEmptyFilterInput = (filterOperation: string): string | [string, string] =>
    filterOperation === 'inRange' ? ['', ''] : '';

export const normalizeFilterInput = (filterInput: FilterInputValue): string | [string, string] =>
    isEmptyFilterInput(filterInput) ? '' : (filterInput ?? '');
