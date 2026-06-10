/**
 * Общие типы состояния фильтрации колонок таблицы.
 */
export interface ColumnFilterState {
    /** Операция фильтрации */
    filterOperation: string;
    /** Значение фильтрации */
    filterInput: string | [string, string];
}

/**
 * Состояние фильтрации по колонкам (ключ — dataField).
 */
export type FilterStateByColumn = Record<string, ColumnFilterState>;
