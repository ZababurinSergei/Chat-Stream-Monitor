import { readonly, type ComputedRef, type Ref } from 'vue';
import type { DataTableRowData } from 'naive-ui';
import type { Column, TableProps } from '@/components/ui/AiDataTable/types.ts';
import { flattenBaseColumns } from '@/composables/AiDataTable/columnUtils.ts';
import type { RowKey } from '@/interfaces/common.ts';
import type { ExportColumn } from './types';
import { useGlobalSettings } from '@/composables/common/useGlobalSettings';

/**
 * Композабл, повторяющий часть API `dxDataGrid`, которая нужна внешним модулям экспорта.
 * Не реализует то, чего в `AiDataTable` нет (summary, tree) — вместо имитации несуществующего
 * поведения такие вызовы должны быть либо не нужны потребителю, либо реализованы отдельно.
 *
 * @param tableProps - пропсы таблицы
 * @param visibleColumns - видимые колонки таблицы (те же, что рендерятся в `n-data-table`); ComputedRef,
 * чтобы экспорт всегда брал актуальное состояние видимости на момент клика, а не снимок на момент setup
 * @param data - текущие строки таблицы
 * @param totalCount - общее количество строк (с учётом виртуального скролла)
 * @param checkedRowKeys - ключи выделенных строк
 * @param getRowKey - получение ключа строки по `keyExpr`
 * @param filterRows - фильтрация строк по текущим значениям фильтров колонок
 */
export const useExportAdapter = (
    tableProps: TableProps,
    visibleColumns: ComputedRef<Column[]>,
    data: DataTableRowData[],
    totalCount: ComputedRef<number>,
    checkedRowKeys: Ref<RowKey[]>,
    getRowKey: (row: DataTableRowData) => RowKey,
    filterRows: (rows: DataTableRowData[]) => DataTableRowData[]
) => {
    const getVisibleColumns = (): Readonly<ExportColumn[]> =>
        readonly(
            flattenBaseColumns(visibleColumns.value).map((column, index) => ({
                caption: column.caption,
                dataField: column.dataField,
                dataType: column.dataType,
                visibleIndex: index,
                width: column.width,
            }))
        ) as Readonly<ExportColumn[]>;

    const option = (path: 'columns'): Readonly<TableProps['columns']> | undefined => {
        if (path === 'columns') return readonly(tableProps.columns) as Readonly<TableProps['columns']>;
        return undefined;
    };

    const getDataSource = () => ({
        items: (): Readonly<DataTableRowData[]> => readonly(filterRows(data)) as Readonly<DataTableRowData[]>,
    });

    const getTotalCount = () => totalCount.value;

    const getSelectedRowsData = (): Readonly<DataTableRowData[]> =>
        readonly(data.filter(row => checkedRowKeys.value.includes(getRowKey(row)))) as Readonly<
            DataTableRowData[]
        >;

    const handleExportOption = (exportOption: string | undefined) => {
        const exportCallback = useGlobalSettings().tableApi.export;

        switch (exportOption) {
            case 'export-excel':
                exportCallback({
                    component: { getVisibleColumns, option, getDataSource, totalCount: getTotalCount, getSelectedRowsData },
                    fileName: tableProps.title,
                });
                break;
            case 'export-selected-excel':
                exportCallback({
                    component: {
                        getVisibleColumns,
                        option,
                        getDataSource: () => ({ items: getSelectedRowsData }),
                        totalCount: () => getSelectedRowsData().length,
                        getSelectedRowsData,
                    },
                    fileName: tableProps.title,
                });
                break;
            default:
                throw Error('Неизвестная опция');
        }
    };

    return {
        getVisibleColumns,
        option,
        getDataSource,
        totalCount: getTotalCount,
        getSelectedRowsData,
        handleExportOption,
    };
};
