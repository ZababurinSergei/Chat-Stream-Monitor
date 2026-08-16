import type {
    BaseColumn,
    Column,
    EmptyColumn,
    GroupColumn,
    SelectionColumn,
    ServiceColumn,
    UserOnlyColumn,
} from '@/components/ui/AiDataTable/types.ts';
import type { DataType } from '@/interfaces/common.ts';
import { DATE_FORMATTER, DATETIME_FORMATTER, toTimestamp } from '@/utils/date.ts';

/**
 * Единый источник отображаемого текста ячейки: даты форматируются в `dd.MM.yyyy[, HH:mm:ss]`,
 * остальные значения приводятся к строке. Используется и для рендера, и для поиска/подсветки.
 */
export const getCellDisplayText = (value: unknown, dataType?: DataType): string => {
    if (value === null || value === undefined || value === '') return '';

    if (dataType === 'date' || dataType === 'datetime') {
        const timestamp = toTimestamp(value);
        if (timestamp === null) return String(value);
        return (dataType === 'datetime' ? DATETIME_FORMATTER : DATE_FORMATTER).format(timestamp);
    }

    return String(value);
};

export const isAlwaysVisibleColumn = (column: Column) =>
    isServiceColumn(column) || (column.showInColumnChooser === false && column.visible === true);

export const isVisibleColumn = (column: Column): boolean =>
    isAlwaysVisibleColumn(column) || (isBaseColumn(column) && column.visible !== false);

export const isBaseColumn = (column: Column): column is BaseColumn =>
    !('children' in column) && 'dataField' in column && 'caption' in column;

export const isSelectionColumn = (column: Column): column is SelectionColumn => column.type === 'selection';

export const isParentColumn = (column: UserOnlyColumn | Column): column is GroupColumn =>
    'children' in column && Array.isArray(column.children) && column.children.length > 0;

export const isEmptyColumn = (column: Column): column is EmptyColumn =>
    'dataField' in column && column.dataField === 'empty';

export const isServiceColumn = (column: Column): column is ServiceColumn =>
    isSelectionColumn(column) || isParentColumn(column) || isEmptyColumn(column);

/** Рекурсивно собирает листовые колонки с данными в порядке отображения */
export const flattenBaseColumns = (columns: Column[]): BaseColumn[] =>
    columns.flatMap(column => {
        if (isBaseColumn(column)) return [column];
        if (isParentColumn(column)) return flattenBaseColumns(column.children as Column[]);
        return [];
    });

export const findBaseColumnByDataField = (columns: Column[], dataField: string): BaseColumn | undefined =>
    flattenBaseColumns(columns).find(column => column.dataField === dataField);
