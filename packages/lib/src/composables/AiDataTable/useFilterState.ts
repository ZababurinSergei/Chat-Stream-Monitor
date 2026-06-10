import type { ColumnFilterState, FilterStateByColumn } from '@/components/ui/AiDataTable/components/FilterCell/types';
import type { UserOnlyColumn } from '@/components/ui/AiDataTable/types';
import type { DataType } from '@/interfaces/common';
import type { InternalRowData } from 'naive-ui/es/data-table/src/interface';
import { reactive } from 'vue';
import { DEFAULT_COLUMN_FILTER_STATE } from '@/components/ui/AiDataTable/components/FilterCell/defaults';
import { applyNumberFilter } from '@/composables/AiDataTable/filterOperations/applyNumberFilter';
import { applyStringFilter } from '@/composables/AiDataTable/filterOperations/applyStringFilter';
import {
    createEmptyFilterInput,
    isEmptyFilterInput,
    normalizeFilterInput,
    type FilterInputValue,
} from '@/composables/AiDataTable/filterOperations/filterInput.utils';

/**
 * Преобразование значения для фильтрации boolean
 * @param selection - Значение для фильтрации
 * @returns Значение для фильтрации boolean
 */
const toBooleanFilterState = (selection: string) =>
    selection === 'reset'
        ? { filterOperation: 'reset', filterInput: '' }
        : { filterOperation: 'equals', filterInput: selection };

/** Возвращает состояние фильтрации по умолчанию для указанного типа данных
 *
 * @param dataType - Тип данных
 * @returns Состояние фильтрации по умолчанию
 */
/** Возвращает состояние фильтрации по умолчанию для указанного типа данных
 *
 * @param dataType - Тип данных
 * @returns Состояние фильтрации по умолчанию
 */
const createDefaultColumnFilterState = (dataType: DataType): ColumnFilterState =>
    dataType === 'boolean' ? { filterOperation: 'reset', filterInput: '' } : { ...DEFAULT_COLUMN_FILTER_STATE };

/**
 * Применяет фильтр к строке
 * @param rowValue - Значение строки
 * @param filterOperation - Операция фильтрации
 * @param filterInput - Входные данные фильтрации
 * @returns Результат фильтрации
 */
const applyColumnFilter = (
    rowValue: unknown,
    dataType: DataType | undefined,
    filterOperation: string,
    filterInput: string | [string, string]
): boolean => {
    if (dataType === 'number') {
        return applyNumberFilter(rowValue, filterOperation, filterInput);
    }

    return applyStringFilter(rowValue, filterOperation, filterInput);
};

/**
 * Возвращает состояние фильтрации по умолчанию для указанного типа данных
 * @param dataType - Тип данных
 * @returns Состояние фильтрации по умолчанию
 */
export const useFilterState = () => {
    const filterState = reactive<FilterStateByColumn>({});
    /**
     * Возвращает состояние фильтрации для указанного поля данных
     * @param dataField - Поле данных
     * @param dataType - Тип данных
     * @returns Состояние фильтрации
     */
    const ensureColumnFilter = (dataField: string, dataType: DataType = 'string'): ColumnFilterState => {
        if (!filterState[dataField]) {
            filterState[dataField] = createDefaultColumnFilterState(dataType);
        }

        return filterState[dataField]!;
    };

    /**
     * Обновляет состояние фильтрации для указанного поля данных
     * @param dataField - Поле данных
     * @param dataType - Тип данных
     */
    const updateFilterState = (dataField: string, dataType: DataType) => {
        filterState[dataField] = createDefaultColumnFilterState(dataType);
    };

    /**
     * Устанавливает значение фильтрации для указанного поля данных
     * @param dataField - Поле данных
     * @param filterInput - Значение фильтрации
     * @param dataType - Тип данных
     */
    const setFilterInput = (dataField: string, filterInput: FilterInputValue, dataType: DataType = 'string') => {
        const column = ensureColumnFilter(dataField, dataType);

        column.filterInput = normalizeFilterInput(filterInput);
    };

    /**
     * Строит простое значение фильтрации для указанного состояния фильтрации
     * @param state - Состояние фильтрации
     * @returns Объект с простыми значениями фильтрации
     */
    const buildNaiveFilterValues = (state: FilterStateByColumn): Record<string, string | [string, string]> => {
        return Object.fromEntries(Object.entries(state).map(([dataField, column]) => [dataField, column.filterInput]));
    };

    /**
     * Возвращает функцию конфигурации фильтрации для указанного столбца
     * @param userColumnConfig - Конфигурация столбца
     * @param value - Значение ячейки
     * @param row - Строка данных
     * @returns Функция конфигурации фильтрации
     */
    const getNaiveFilterConfigFunction = (userColumnConfig: UserOnlyColumn, row: InternalRowData) => {
        const columnState = filterState[userColumnConfig.dataField];

        if (userColumnConfig.dataType === 'boolean') {
            if (
                !columnState ||
                columnState.filterOperation === 'reset' ||
                isEmptyFilterInput(columnState.filterInput)
            ) {
                return true;
            }
            return Boolean(row[userColumnConfig.dataField]) === (columnState.filterInput === 'true');
        }

        if (!columnState || columnState.filterOperation === 'reset' || isEmptyFilterInput(columnState.filterInput)) {
            return true;
        }

        const rowValue = row[userColumnConfig.displayField ?? userColumnConfig.dataField];

        return applyColumnFilter(
            rowValue,
            userColumnConfig.dataType,
            columnState.filterOperation,
            columnState.filterInput
        );
    };

    /**
     * Применяет выбранное значение фильтрации к указанному полю данных
     * @param dataField - Поле данных
     * @param dataType - Тип данных
     * @param selection - Выбранное значение фильтрации
     */
    const applyFilterSelection = (dataField: string, dataType: DataType, selection: string) => {
        const column = ensureColumnFilter(dataField, dataType);

        if (dataType === 'boolean') {
            Object.assign(column, toBooleanFilterState(selection));
            return;
        }

        column.filterOperation = selection;
        column.filterInput = createEmptyFilterInput(selection);
    };

    return {
        filterState,
        setFilterInput,
        buildNaiveFilterValues,
        updateFilterState,
        getNaiveFilterConfigFunction,
        applyFilterSelection,
    };
};
