import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';

/**
 * Общие типы состояния фильтрации колонок таблицы.
 */
export interface ColumnFilterState {
    /** Операция фильтрации */
    filterOperation: string;
    /** Значение фильтрации */
    filterInput: string | [string, string];
    /** Состояние date-фильтра */
    dateFilter?: DateFilterState;
}

/**
 * Состояние фильтрации по колонкам (ключ — dataField).
 */
export type FilterStateByColumn = Record<string, ColumnFilterState>;
