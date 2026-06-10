export const applyStringFilter = (
    rowValue: unknown,
    operation: string,
    filterInput: string | [string, string]
): boolean => {
    const filterString = Array.isArray(filterInput) ? (filterInput[0] ?? '') : filterInput;
    const unifiedRowValue = String(rowValue).toLowerCase();
    const unifiedFilterValue = filterString.toLowerCase();

    switch (operation) {
        case 'search':
            return unifiedRowValue.includes(unifiedFilterValue);
        case 'equals':
            return unifiedRowValue === unifiedFilterValue;
        case 'notEquals':
            return unifiedRowValue !== unifiedFilterValue;
        case 'contains':
            return unifiedRowValue.includes(unifiedFilterValue);
        case 'notContains':
            return !unifiedRowValue.includes(unifiedFilterValue);
        case 'startsWith':
            return unifiedRowValue.startsWith(unifiedFilterValue);
        case 'endsWith':
            return unifiedRowValue.endsWith(unifiedFilterValue);
        default:
            return false;
    }
};
