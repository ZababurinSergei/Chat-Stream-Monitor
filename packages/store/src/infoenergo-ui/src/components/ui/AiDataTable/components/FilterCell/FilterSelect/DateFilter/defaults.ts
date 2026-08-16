import type { DateFilterItemConfig, DateFilterPart } from './types';
import type {
    DateFilterToggleOperation,
    DateFilterValueKey,
} from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';

const TEXT_CLASS = 'date-filter__value-filter__text';

const text = (content: string): DateFilterPart => ({
    type: 'text',
    content,
    className: TEXT_CLASS,
});

const picker = (valueKey: DateFilterValueKey): DateFilterPart => ({
    type: 'picker',
    valueKey,
});

const checkboxRow = (
    id: string,
    operation: DateFilterToggleOperation,
    parts: DateFilterPart[],
    options?: { rowId?: string; checkboxStyle?: string }
): DateFilterItemConfig => ({
    id,
    rowId: options?.rowId ?? id,
    kind: 'checkbox',
    operation,
    checkboxStyle: options?.checkboxStyle ?? 'width: 100%',
    parts,
});

export const DATE_FILTER_ITEMS: DateFilterItemConfig[] = [
    checkboxRow('equals', 'equals', [text('по значению'), picker('equals')]),
    checkboxRow('range', 'range', [text('с'), picker('rangeFrom'), text('по'), picker('rangeTo')]),
    checkboxRow('gt', 'outerGreater', [text('>'), picker('outerFrom')], { rowId: 'outer-row' }),
    {
        id: 'separator-lt',
        rowId: 'outer-row',
        kind: 'label',
        operation: 'separator',
        parts: [{ type: 'text', content: '<', className: 'date-filter__row__text' }],
    },
    checkboxRow('lt', 'outerLess', [picker('outerTo')], { rowId: 'outer-row' }),
    checkboxRow('except', 'except', [text('кроме'), picker('except')]),
    checkboxRow('currentMonth', 'currentMonth', [text('текущий месяц')], { checkboxStyle: undefined }),
    checkboxRow('previousMonth', 'previousMonth', [text('прошлый месяц')], { checkboxStyle: undefined }),
    checkboxRow('currentYear', 'currentYear', [text('текущий год')], { checkboxStyle: undefined }),
    checkboxRow('previousYear', 'previousYear', [text('прошлый год')], { checkboxStyle: undefined }),
    checkboxRow('empty', 'empty', [text('пустые значения')], { checkboxStyle: undefined }),
];
