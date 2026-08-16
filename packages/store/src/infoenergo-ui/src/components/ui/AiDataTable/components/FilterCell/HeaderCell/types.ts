import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/common';
import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import type { DataType } from '@/interfaces/common';

/**
 * Пропсы компонента HeaderCell.
 */
export interface HeaderCellProps {
    /** Заголовок */
    caption: string;
    /** Тип данных */
    dataType: DataType;
    /** Имя поля */
    dataField?: string;
    /** Операция фильтра */
    filterOperation: string;
    /** Значение фильтра */
    filterInput: FilterInputValue;
    /** Состояние date-фильтра */
    dateFilterState?: DateFilterState;
}

/**
 * Эмиты компонента HeaderCell.
 */
export interface HeaderCellEmits {
    /** Обновление операции фильтра */
    'update:filterOperation': [filterOperation: string, dataField: string];
    /** Обновление значения фильтра */
    'update:filterInput': [filterInput: string | [string, string] | null, dataField: string];
    /** Обновление состояния date-фильтра */
    'update:dateFilter': [dateFilter: DateFilterState, dataField: string];
    /** Перестановка колонок drag-and-drop */
    reorderColumns: [fromDataField: string, toDataField: string];
}
