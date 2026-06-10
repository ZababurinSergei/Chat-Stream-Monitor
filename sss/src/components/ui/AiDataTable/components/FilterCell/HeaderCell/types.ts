import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/filterInput.utils';
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
}

/**
 * Эмиты компонента HeaderCell.
 */
export interface HeaderCellEmits {
    /** Обновление операции фильтра */
    'update:filterOperation': [filterOperation: string, dataField: string];
    /** Обновление значения фильтра */
    'update:filterInput': [filterInput: string | [string, string] | null, dataField: string];
}
