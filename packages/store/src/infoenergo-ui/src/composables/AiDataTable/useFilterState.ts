import type { ColumnFilterState, FilterStateByColumn } from '@/components/ui/AiDataTable/components/FilterCell/types';
import type { UserOnlyColumn } from '@/components/ui/AiDataTable/types';
import type { DataType } from '@/interfaces/common';
import type { InternalRowData } from 'naive-ui/es/data-table/src/interface';
import { reactive } from 'vue';
import { DEFAULT_COLUMN_FILTER_STATE } from '@/components/ui/AiDataTable/components/FilterCell/defaults';
import { applyNumberFilter } from '@/composables/AiDataTable/filterOperations/applyNumberFilter';
import { applyStringFilter } from '@/composables/AiDataTable/filterOperations/applyStringFilter';
import { applyDateFilter } from '@/composables/AiDataTable/filterOperations/applyDateFilter';
import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import {
    cloneDateFilterState,
    createEmptyDateFilterState,
} from '@/composables/AiDataTable/filterOperations/filterDate.utils';
import {
    createEmptyFilterInput,
    isEmptyFilterInput,
    normalizeFilterInput,
} from '@/composables/AiDataTable/filterOperations/common';
import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/common';
import { getCellDisplayText } from '@/composables/AiDataTable/columnUtils';

/**
 * Преобразование значения для фильтрации boolean
 * @param selection - Значение для фильтрации
 * @returns Значение для фильтрации boolean
 */
const toBooleanFilterState = (selection: string) =>
    selection === 'reset'
        ? { filterOperation: 'reset', filterInput: '' }
        : { filterOperation: selection, filterInput: selection };

/** Возвращает состояние фильтрации по умолчанию для указанного типа данных
 *
 * @param dataType - Тип данных
 * @returns Состояние фильтрации по умолчанию
 */
const createDefaultColumnFilterState = (dataType: DataType): ColumnFilterState =>
    dataType === 'boolean'
        ? { filterOperation: 'reset', filterInput: '' }
        : dataType === 'date' || dataType === 'datetime'
          ? { ...DEFAULT_COLUMN_FILTER_STATE, dateFilter: createEmptyDateFilterState() }
          : { ...DEFAULT_COLUMN_FILTER_STATE };

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

    return applyStringFilter(getCellDisplayText(rowValue, dataType), filterOperation, filterInput);
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
     * Устанавливает состояние date-фильтра для указанного поля данных
     * @param dataField - Поле данных
     * @param dateFilter - Состояние date-фильтра
     */
    const setDateFilterState = (dataField: string, dateFilter: DateFilterState) => {
        // `datetime` использует тот же date-фильтр и state-модель
        const column = ensureColumnFilter(dataField, 'date');
        column.dateFilter = cloneDateFilterState(dateFilter);
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

        if (userColumnConfig.dataType === 'date' || userColumnConfig.dataType === 'datetime') {
            const rowValue = row[userColumnConfig.displayField ?? userColumnConfig.dataField];
            return applyDateFilter(rowValue, columnState?.dateFilter ?? createEmptyDateFilterState());
        }

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
        setDateFilterState,
        updateFilterState,
        getNaiveFilterConfigFunction,
        applyFilterSelection,
    };
};
