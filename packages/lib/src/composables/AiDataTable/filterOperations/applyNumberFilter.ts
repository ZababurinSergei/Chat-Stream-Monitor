const parseFilterNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
};

const applyNumberInRange = (rowNumber: number, filterInput: [string, string]): boolean => {
    const [fromRaw, toRaw] = filterInput;
    const from = parseFilterNumber(fromRaw);
    const to = parseFilterNumber(toRaw);

    const hasInvalidFrom = fromRaw.trim() !== '' && from === null;
    const hasInvalidTo = toRaw.trim() !== '' && to === null;

    if (hasInvalidFrom || hasInvalidTo) {
        return false;
    }
    if (from === null && to === null) {
        return true;
    }
    if (from !== null && to === null) {
        return rowNumber >= from;
    }
    if (from === null && to !== null) {
        return rowNumber <= to;
    }
    if (from! > to!) {
        return false;
    }

    return rowNumber >= from! && rowNumber <= to!;
};

export const applyNumberFilter = (
    rowValue: unknown,
    operation: string,
    filterInput: string | [string, string]
): boolean => {
    const rowNumber = Number(rowValue);

    if (!Number.isFinite(rowNumber)) {
        return false;
    }

    if (operation === 'inRange') {
        if (!Array.isArray(filterInput)) {
            return false;
        }

        return applyNumberInRange(rowNumber, filterInput);
    }

    const filterString = Array.isArray(filterInput) ? (filterInput[0] ?? '') : filterInput;
    const filterValue = parseFilterNumber(filterString);

    if (filterValue === null) {
        return true;
    }

    switch (operation) {
        case 'search':
            return String(rowValue).includes(filterString.trim());
        case 'equals':
            return rowNumber === filterValue;
        case 'notEquals':
            return rowNumber !== filterValue;
        case 'greaterThan':
            return rowNumber > filterValue;
        case 'greaterThanOrEqual':
            return rowNumber >= filterValue;
        case 'lessThan':
            return rowNumber < filterValue;
        case 'lessThanOrEqual':
            return rowNumber <= filterValue;
        default:
            return false;
    }
};
