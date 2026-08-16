import { computed, h, reactive, ref, onUnmounted } from 'vue';
import type { Slots } from 'vue';
import type { DataTableBaseColumn, DataTableRowData } from 'naive-ui';
import AiCell from '@/components/ui/AiCell/AiCell.vue';
import { getDefaultColumnConfig } from '@/components/ui/AiDataTable/defaults.ts';
import HeaderCell from '@/components/ui/AiDataTable/components/FilterCell/HeaderCell/HeaderCell.vue';
import { DEFAULT_DATA_TYPE } from '@/defaults/common';
import { makeSorter } from '@/composables/AiDataTable/common';
import { useFilterState } from '@/composables/AiDataTable/useFilterState';
import SortButton from '@/components/ui/AiDataTable/components/FilterCell/SortButton/SortButton.vue';
import type {
    TableProps,
    UserOnlyColumn,
    Column,
    BaseColumn,
    SelectionColumn,
    GroupColumn,
    EmptyColumn,
    TableColumnSettings,
} from '@/components/ui/AiDataTable/types.ts';
import type { ColumnChooser } from '@/components/ui/AiToolbar/types';
import {
    findBaseColumnByDataField,
    flattenBaseColumns,
    getCellDisplayText,
    isBaseColumn,
    isParentColumn,
    isVisibleColumn,
    isAlwaysVisibleColumn,
} from '@/composables/AiDataTable/columnUtils.ts';
import type { DataFieldValue, DataFieldDisplayValue, RowKey } from '@/interfaces/common.ts';
import { SEARCH_DEBOUNCE_MS  } from '@/composables/AiDataTable/common';

/**
 * Композабл для конфигурации колонок таблицы на основе метаданных
 *
 * @param meta - Вычисляемая ссылка на метаданные таблицы, содержащие конфигурацию колонок
 * @param modifyData - Обновление значения в строке по ключу и имени поля
 * @param isModified - Проверка, изменилось ли поле относительно данных с сервера
 * @param keyExpr - Имя поля ключа строки для чтения `row[keyExpr]` в рендере ячеек
 * @param parentContainerSelectorForError - Родительский селектор контейнера для позиционирования ошибки
 *
 * @returns Объект с массивом колонок и методом для настройки колонок
 */
export const useColumnsConfig = (
    tableProps: TableProps,
    modifyData: (key: RowKey, dataField: string, value: DataFieldValue) => void,
    isModified: (key: RowKey, dataField: string) => boolean,
    getValidationErrorMessage: (key: RowKey, dataField: string) => string | undefined,
    keyExpr: string,
    parentContainerSelectorForError?: string,
    slots?: Slots
) => {
    /** Массив сконфигурированных колонок */
    const allColumns = reactive<Column[]>([]);
    const visibleColumns = computed<Column[]>((): Column[] => (allColumns as Column[]).filter(isVisibleColumn));
    const columnsChooser = reactive<ColumnChooser>({
        options: [],
        value: [],
    });
    const isTableEditable = ref(false);
    /** Немедленное значение поля ввода (для отображения в тулбаре) */
    const searchValue = ref('');
    /** Отложенный (debounce 500мс) и уже нормализованный термин: питает фильтрацию и подсветку */
    const searchTerm = ref('');
    let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

    const {
        filterState,
        setFilterInput,
        setDateFilterState,
        updateFilterState,
        getNaiveFilterConfigFunction,
        applyFilterSelection,
    } = useFilterState();

    const setupColumnChooser = () => {
        const baseColumns: BaseColumn[] = (allColumns as Column[]).filter(isBaseColumn);
        const choosableColumns = baseColumns.filter(column => column.showInColumnChooser !== false);

        columnsChooser.options = choosableColumns.map(column => ({
            value: column.dataField,
            label: column.caption ?? '',
        }));

        columnsChooser.value = choosableColumns
            .filter(column => column.visible === true)
            .map(column => column.dataField);
    };

    const setColumnsVisibility = (incomingVisibleColumns: string[]) => {
        if (incomingVisibleColumns.length === 0) return;
        const visibleColumns = [];
        for (const column of allColumns as Column[]) {
            if (!isBaseColumn(column)) continue;
            column.visible = isAlwaysVisibleColumn(column) || incomingVisibleColumns.includes(column.dataField);
            if (column.showInColumnChooser !== false && column.visible) visibleColumns.push(column.dataField);
        }
        columnsChooser.value.length = 0;
        columnsChooser.value.push(...visibleColumns);
    };

    const reorderColumns = (fromDataField: string, toDataField: string) => {
        const columns = allColumns as Column[];
        const fromIndex = columns.findIndex(column => isBaseColumn(column) && column.dataField === fromDataField);
        const toIndex = columns.findIndex(column => isBaseColumn(column) && column.dataField === toDataField);
        if (fromIndex === -1 || toIndex === -1) return;

        const [movedColumn] = columns.splice(fromIndex, 1);
        if (!movedColumn) return;
        columns.splice(toIndex, 0, movedColumn);
    };

    const getColumnsSettings = (): TableColumnSettings[] => {
        let visibleIndex = 0;
        const flattenedColumns = flattenBaseColumns(allColumns as Column[]);

        return flattenedColumns.map(column => {
            visibleIndex += 1;

            return {
                visibleIndex,
                dataField: column.dataField,
                width: Number(column.width),
                visible: !!column.visible,
            };
        });
    };

    const updateColumnWidth = (dataField: string, width: number) => {
        const column = findBaseColumnByDataField(allColumns as Column[], dataField);
        if (column) column.width = width;
    };

    const setSearchValue = (value: string) => {
        searchValue.value = value;
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            searchTerm.value = value.trim().toLowerCase();
        }, SEARCH_DEBOUNCE_MS);
    };

    /** Проверяет, содержит ли строка искомую подстроку хотя бы в одном из видимых полей. `term` уже нормализован */
    const matchesSearch = (row: DataTableRowData, searchableColumns: BaseColumn[], term: string): boolean => {
        if (!term) return true;

        return searchableColumns.some(column => {
            const text = getCellDisplayText(row[column.displayField ?? column.dataField], column.dataType);
            return text.toLowerCase().includes(term);
        });
    };

    /** Возвращает строки, проходящие текущие фильтры и строку поиска по видимым колонкам */
    const filterRows = (rows: DataTableRowData[]): DataTableRowData[] => {
        const columns = flattenBaseColumns(visibleColumns.value);
        const term = searchTerm.value;

        return rows.filter(
            row =>
                matchesSearch(row, columns, term) && columns.every(column => getNaiveFilterConfigFunction(column, row))
        );
    };

    const applyColumnsSettings = (columnSettings: TableColumnSettings[]) => {
        const orderedBaseColumns: BaseColumn[] = [];

        for (const setting of columnSettings) {
            const column = findBaseColumnByDataField(allColumns as Column[], setting.dataField);
            if (!column) continue;
            column.width = setting.width;
            column.visible = setting.visible;
            orderedBaseColumns.push(column);
        }

        const columns = allColumns as Column[];
        let baseIdx = 0;
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            if (!column || !isBaseColumn(column)) continue;

            const orderedColumn = orderedBaseColumns[baseIdx++];
            if (orderedColumn) columns[i] = orderedColumn;
        }

        setupColumnChooser();
    };

    const createFieldRenderer =
        (userColumnConfig: UserOnlyColumn, isEditable: boolean): DataTableBaseColumn['render'] =>
        (row: DataTableRowData) => {
            const rowKey = row[keyExpr];
            const { dataField, displayField, dataType, editor, component, cellTemplate } = userColumnConfig;

            return h(AiCell, {
                isModified: isModified(rowKey, dataField),
                validationErrorMessage: getValidationErrorMessage(rowKey, dataField),
                parentContainerSelectorForError,
                componentMeta: {
                    isEditable,
                    dataType,
                    editor,
                    component,
                    value: row[dataField],
                    displayValue: displayField !== undefined ? row[displayField] : undefined,
                    searchTerm: searchTerm.value,
                    customTemplate: cellTemplate ? slots?.[cellTemplate] : undefined,
                    onUpdateValue: (value: DataFieldValue) => {
                        modifyData(rowKey, dataField, value);
                    },
                    onUpdateDisplayValue: (displayValue: DataFieldDisplayValue) => {
                        if (!displayField) return;
                        modifyData(rowKey, displayField, displayValue);
                    },
                },
            });
        };

    const transformToTableColumn = (userColumnConfig: UserOnlyColumn): BaseColumn => {
        const defaultColumnConfig: Partial<DataTableBaseColumn> = getDefaultColumnConfig(userColumnConfig.dataType);

        const extendedColumn: BaseColumn = {
            ...defaultColumnConfig,
            ...userColumnConfig,
            visible: userColumnConfig.visible ?? true,
            key: userColumnConfig.dataField,
            title: userColumnConfig.caption,
            sorter: makeSorter(userColumnConfig.dataField, userColumnConfig.dataType ?? DEFAULT_DATA_TYPE),
            renderSorter: ({ order }: { order: 'ascend' | 'descend' | false }) => h(SortButton, { order }),
        };

        const resolveEditable = () => {
            // Явное разрешение редактирования
            if (userColumnConfig.allowEditing === true) return true;

            // Явный запрет редактирования
            if (userColumnConfig.allowEditing === false) return false;

            // Иначе только если редактирование глобально разрешено
            return !!tableProps.isEditable;
        };

        const isEditable = resolveEditable();
        if (isEditable) isTableEditable.value = true;

        extendedColumn.render = createFieldRenderer(userColumnConfig, isEditable);
        updateFilterState(userColumnConfig.dataField, userColumnConfig.dataType ?? DEFAULT_DATA_TYPE);
        extendedColumn.title = () =>
            h(HeaderCell, {
                caption: userColumnConfig.caption ?? '',
                dataType: userColumnConfig.dataType ?? DEFAULT_DATA_TYPE,
                dataField: userColumnConfig.dataField,
                filterOperation: filterState[userColumnConfig.dataField]!.filterOperation,
                filterInput: filterState[userColumnConfig.dataField]!.filterInput,
                dateFilterState: filterState[userColumnConfig.dataField]!.dateFilter,
                'onUpdate:filterOperation': (value: string, field: string) => {
                    applyFilterSelection(field, userColumnConfig.dataType ?? DEFAULT_DATA_TYPE, value);
                },
                'onUpdate:filterInput': (value, field: string) => {
                    setFilterInput(field, value, userColumnConfig.dataType ?? DEFAULT_DATA_TYPE);
                },
                'onUpdate:dateFilter': (value, field: string) => {
                    setDateFilterState(field, value);
                },
                onReorderColumns: reorderColumns,
            });

        return extendedColumn;
    };

    const buildColumnHierarchy = (userColumnConfig: UserOnlyColumn): Column => {
        if (isParentColumn(userColumnConfig)) {
            const children = userColumnConfig.children.map(childColumn => buildColumnHierarchy(childColumn));

            const groupColumn = {
                caption: userColumnConfig.caption,
                dataField: userColumnConfig.dataField,
                visible: true,
                title: userColumnConfig.caption,
                key: userColumnConfig.dataField,
                children,
            } as GroupColumn;

            return groupColumn;
        }

        return transformToTableColumn(userColumnConfig);
    };

    const setupSelectionColumn = () => {
        if (tableProps.selectionMode !== 'none') {
            const selectionColumn: SelectionColumn = {
                fixed: 'left',
                type: 'selection',
                width: 40,
                multiple: tableProps.selectionMode === 'multiple',
                visible: true,
            };
            allColumns.push(selectionColumn);
        }
    };

    const setupMainColumns = () => {
        const userColumnsConfig = tableProps.columns;
        (allColumns as Column[]).push(...userColumnsConfig.map(buildColumnHierarchy));
    };

    const setupEmptyColumn = () => {
        const emptyColumn: EmptyColumn = {
            key: 'empty',
            dataField: 'empty',
            minWidth: 12,
            visible: true,
        };
        (allColumns as Column[]).push(emptyColumn);
    };

    /** Заново пересобирает колонки таблицы */
    const rebuildColumns = () => {
        allColumns.length = 0;
        setupSelectionColumn();
        setupMainColumns();
        setupEmptyColumn();
        setupColumnChooser();
    };

    // Инициализация колонок
    const initializeColumns = () => {
        rebuildColumns();
    };

    // Инициализирует колонки таблицы на моменте создания композабла
    initializeColumns();

    onUnmounted(() => clearTimeout(searchDebounceTimer));

    return {
        isTableEditable,
        visibleColumns,
        columnsChooser,
        setColumnsVisibility,
        getColumnsSettings,
        applyColumnsSettings,
        updateColumnWidth,
        rebuildColumns,
        filterRows,
        searchValue,
        setSearchValue,
    };
};
