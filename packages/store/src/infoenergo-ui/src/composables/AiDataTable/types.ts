import type { DataFieldValue, DataType } from '@/interfaces/common.ts';

/** Изменение значения поля */
export type FieldChange = { originalValue: DataFieldValue; currentValue: DataFieldValue };
/** Изменения в строке */
export type RowChanges = Record<string, FieldChange>;

/**
 * Колонка в формате, ожидаемом внешними модулями экспорта (аналог `dxDataGrid.getVisibleColumns()`)
 */
export interface ExportColumn {
    caption?: string;
    dataField: string;
    dataType?: DataType;
    visibleIndex: number;
    width?: string | number;
}

/** Сегмент текста для подсветки поиска */
export interface HighlightPart {
    text: string;
    match: boolean;
}
