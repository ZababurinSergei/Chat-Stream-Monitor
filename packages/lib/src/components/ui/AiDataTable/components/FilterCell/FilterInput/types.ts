import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/filterInput.utils';
import type { DataType } from '@/interfaces/common';

//** Интерфейс свойств для компонента FilterInput */
export interface FilterInputProps {
    /** Тип данных */
    dataType: DataType;
    /** Операция фильтрации */
    filterOperation: string;
    /** Значение фильтра */
    modelValue: FilterInputValue;
}

//** Интерфейс событий для компонента FilterInput */
export interface FilterInputEmits {
    (e: 'update:modelValue', value: FilterInputValue): void;
}
