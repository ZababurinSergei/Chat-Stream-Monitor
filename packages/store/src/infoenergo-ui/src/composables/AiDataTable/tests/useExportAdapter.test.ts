import { computed, ref } from 'vue';
import { describe, it, expect } from 'vitest';
import type { DataTableRowData } from 'naive-ui';

import { useExportAdapter } from '@/composables/AiDataTable/useExportAdapter.ts';
import type { Column, TableProps } from '@/components/ui/AiDataTable/types.ts';
import type { RowKey } from '@/interfaces/common.ts';

describe('useExportAdapter', () => {
    const createTableProps = (columns: TableProps['columns']): TableProps => ({
        viewId: 'test',
        selectionMode: 'none',
        api: { get: '/api' },
        columns,
    });

    const createAdapter = (params: {
        columns: TableProps['columns'];
        visibleColumns: Column[];
        data?: DataTableRowData[];
        totalCount?: number;
        checkedRowKeys?: RowKey[];
        filterRows?: (rows: DataTableRowData[]) => DataTableRowData[];
    }) =>
        useExportAdapter(
            createTableProps(params.columns),
            computed(() => params.visibleColumns),
            params.data ?? [],
            computed(() => params.totalCount ?? 0),
            ref(params.checkedRowKeys ?? []),
            (row: DataTableRowData) => row.id,
            params.filterRows ?? (rows => rows)
        );

    it('getVisibleColumns маппит переданные видимые колонки с dataField в порядке отображения', () => {
        const visibleColumns: Column[] = [
            { caption: 'Имя', dataField: 'name', dataType: 'string', width: 200 } as Column,
            { caption: 'Код', dataField: 'code', dataType: 'string', width: 150 } as Column,
        ];
        const { getVisibleColumns } = createAdapter({ columns: [], visibleColumns });

        expect(getVisibleColumns()).toEqual([
            { caption: 'Имя', dataField: 'name', dataType: 'string', visibleIndex: 0, width: 200 },
            { caption: 'Код', dataField: 'code', dataType: 'string', visibleIndex: 1, width: 150 },
        ]);
    });

    it('getVisibleColumns не фильтрует видимость сама — это ответственность вызывающего кода', () => {
        const visibleColumns: Column[] = [
            { caption: 'Имя', dataField: 'name' } as Column,
            { caption: 'Скрытая', dataField: 'hidden', visible: false } as Column,
        ];
        const { getVisibleColumns } = createAdapter({ columns: [], visibleColumns });

        expect(getVisibleColumns().map(column => column.dataField)).toEqual(['name', 'hidden']);
    });

    it('getVisibleColumns разворачивает группы в листовые колонки', () => {
        const visibleColumns: Column[] = [
            {
                caption: 'Группа',
                dataField: 'group',
                visible: true,
                children: [
                    { caption: 'Явно да', dataField: 'a' },
                    { caption: 'Явно нет', dataField: 'b' },
                ],
            } as unknown as Column,
        ];
        const { getVisibleColumns } = createAdapter({ columns: [], visibleColumns });

        expect(getVisibleColumns().map(column => column.dataField)).toEqual(['a', 'b']);
    });

    it('getVisibleColumns не учитывает служебные колонки без dataField (selection)', () => {
        const visibleColumns: Column[] = [
            { type: 'selection', visible: true } as Column,
            { caption: 'Имя', dataField: 'name' } as Column,
        ];
        const { getVisibleColumns } = createAdapter({ columns: [], visibleColumns });

        expect(getVisibleColumns().map(column => column.dataField)).toEqual(['name']);
    });

    it('option("columns") возвращает columns из пропсов таблицы', () => {
        const columns: TableProps['columns'] = [{ caption: 'Имя', dataField: 'name' }];
        const { option } = createAdapter({ columns, visibleColumns: [] });

        expect(option('columns')).toEqual(columns);
    });

    it('option с неизвестным path возвращает undefined', () => {
        const { option } = createAdapter({ columns: [], visibleColumns: [] });

        expect(option('unknown' as 'columns')).toBeUndefined();
    });

    it('getDataSource().items() возвращает текущие строки таблицы', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const { getDataSource } = createAdapter({ columns: [], visibleColumns: [], data });

        expect(getDataSource().items()).toEqual(data);
    });

    it('getDataSource().items() применяет фильтрацию по колонкам', () => {
        const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const { getDataSource } = createAdapter({
            columns: [],
            visibleColumns: [],
            data,
            filterRows: rows => rows.filter(row => row.id !== 2),
        });

        expect(getDataSource().items()).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('totalCount возвращает актуальное значение из ComputedRef', () => {
        const totalCountRef = ref(5);
        const { totalCount } = useExportAdapter(
            createTableProps([]),
            computed(() => []),
            [],
            computed(() => totalCountRef.value),
            ref([]),
            (row: DataTableRowData) => row.id,
            rows => rows
        );

        expect(totalCount()).toBe(5);

        totalCountRef.value = 12;

        expect(totalCount()).toBe(12);
    });

    it('getSelectedRowsData возвращает только строки с выделенными ключами', () => {
        const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const { getSelectedRowsData } = createAdapter({
            columns: [],
            visibleColumns: [],
            data,
            checkedRowKeys: [2, 3],
        });

        expect(getSelectedRowsData()).toEqual([{ id: 2 }, { id: 3 }]);
    });

    it('getSelectedRowsData возвращает пустой массив, если ничего не выделено', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const { getSelectedRowsData } = createAdapter({ columns: [], visibleColumns: [], data });

        expect(getSelectedRowsData()).toEqual([]);
    });
});
