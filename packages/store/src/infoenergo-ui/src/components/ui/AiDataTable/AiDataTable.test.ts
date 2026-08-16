import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, reactive, h, defineComponent } from 'vue';
import { NConfigProvider, NDataTable } from 'naive-ui';

import AiDataTable from '@/components/ui/AiDataTable/AiDataTable.vue';
import type { TableProps } from '@/components/ui/AiDataTable/types.ts';
import type { RowKey } from '@/interfaces/common.ts';

let loadDataMock: ReturnType<typeof vi.fn>;
let rebuildColumnsMock: ReturnType<typeof vi.fn>;
let resetStateMock: ReturnType<typeof vi.fn>;

let dataRef: any[];
let loadingRef: ReturnType<typeof ref>;
let checkedRowKeysRef: ReturnType<typeof ref>;
let tableSettingsRef: ReturnType<typeof ref>;

vi.mock('@/composables/AiDataTable/useDataState.ts', () => ({
    useDataState: vi.fn(() => ({
        data: dataRef,
        loading: loadingRef,
        isDirty: ref(false),
        updateRow: vi.fn(),
        isModified: vi.fn(() => false),
        loadData: loadDataMock,
        saveData: vi.fn(),
        createRow: vi.fn(),
        copyRow: vi.fn().mockResolvedValue(true),
        removeRows: vi.fn().mockResolvedValue(true),
        getVirtualScrollTools: vi.fn(),
        getValidationErrorMessage: vi.fn(),
    })),
}));

vi.mock('@/composables/AiDataTable/useColumnsConfig.ts', () => ({
    useColumnsConfig: vi.fn(() => ({
        isTableEditable: ref(false),
        visibleColumns: [{ key: 'name', title: 'Name' }] as any,
        columnsChooser: { options: [], value: [] },
        setColumnsVisibility: vi.fn(),
        getColumnsSettings: vi.fn(() => []),
        applyColumnsSettings: vi.fn(),
        updateColumnWidth: vi.fn(),
        rebuildColumns: rebuildColumnsMock,
        filterRows: vi.fn((rows: unknown[]) => rows),
        searchValue: ref(''),
        setSearchValue: vi.fn(),
    })),
}));

vi.mock('@/composables/AiDataTable/useTableState.ts', () => ({
    useTableState: vi.fn((keyExpr: string = 'id') => ({
        checkedRowKeys: checkedRowKeysRef,
        focusedRowKey: ref(null),
        tableSettings: tableSettingsRef,
        tableResetKey: ref(0),
        getRowKey: (row: Record<string, string>) => row[keyExpr] ?? row.id,
        resetState: resetStateMock,
        syncState: vi.fn(),
        setFocusedRow: vi.fn(),
        isFocusedRow: vi.fn(() => false),
        isCheckedRow: vi.fn(() => false),
        handleSettingsChange: vi.fn(),
        handleColumnResize: vi.fn(),
        getUserDataChanges: vi.fn().mockResolvedValue(null),
        applyTableSettings: vi.fn().mockReturnValue(null),
    })),
}));

describe('AiDataTable', () => {
    const createTableProps = (overrides: Partial<TableProps> = {}): TableProps =>
        ({
            isEditable: false,
            selectionMode: 'multiple',
            keyExpr: 'id',
            api: {
                get: '/api/get',
                set: '/api/set',
            },
            columns: [],
            ...overrides,
        }) as TableProps;

    const mountComponent = (tablePropsOverrides: Partial<TableProps> = {}) =>
        mount(NConfigProvider, {
            slots: {
                default: () => h(AiDataTable, createTableProps(tablePropsOverrides)),
            },
        });

    beforeEach(() => {
        dataRef = reactive<any[]>([]);
        loadingRef = ref<boolean>(false);
        checkedRowKeysRef = ref<RowKey[]>([]);
        tableSettingsRef = ref({ autoSaveMode: false, groupPanelVisible: false });
        loadDataMock = vi.fn().mockResolvedValue(true);
        rebuildColumnsMock = vi.fn();
        resetStateMock = vi.fn();
    });

    it('инициализирует состояние и передаёт данные и колонки в NDataTable', async () => {
        dataRef.push({ id: 1, name: 'John' });
        loadingRef.value = true;

        const wrapper = mountComponent();
        await flushPromises();

        const table = wrapper.findComponent(NDataTable);
        expect(table.exists()).toBe(true);
        expect(table.props('data')).toEqual(dataRef);
        expect(table.props('columns')).toEqual([{ key: 'name', title: 'Name' }]);
        expect(table.props('loading')).toBe(true);
    });

    it('вызывает loadData на монтировании', async () => {
        const wrapper = mountComponent();
        await flushPromises();

        expect(loadDataMock).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });

    it('использует keyExpr для вычисления rowKey', async () => {
        const tableProps = createTableProps({
            keyExpr: 'customId',
        });

        const wrapper = mount(NConfigProvider, {
            slots: {
                default: () => h(AiDataTable, tableProps),
            },
        });

        const table = wrapper.findComponent(NDataTable);
        const rowKey = table.props('rowKey') as (row: any) => string;

        const row = { id: '1', customId: 'abc' };
        expect(rowKey(row)).toBe('abc');
    });

    it('по умолчанию использует поле id для rowKey, если keyExpr не задан', async () => {
        const tableProps = createTableProps({
            keyExpr: undefined,
        });

        const wrapper = mount(NConfigProvider, {
            slots: {
                default: () => h(AiDataTable, tableProps),
            },
        });

        const table = wrapper.findComponent(NDataTable);
        const rowKey = table.props('rowKey') as (row: any) => string;

        const row = { id: '123' };
        expect(rowKey(row)).toBe('123');
    });

    it('вызывает rebuildColumns при изменении пропсов', async () => {
        const TestWrapper = defineComponent({
            components: { NConfigProvider, AiDataTable },
            setup() {
                const tablePropsRef = ref<TableProps>(createTableProps({ selectionMode: 'multiple' }));
                const setTableProps = (value: TableProps) => {
                    tablePropsRef.value = value;
                };
                return { tablePropsRef, setTableProps };
            },
            template:
                '<n-config-provider><ai-data-table v-bind="tablePropsRef" /></n-config-provider>',
        });

        const wrapper = mount(TestWrapper);
        await flushPromises();
        rebuildColumnsMock.mockClear();

        const vm = wrapper.vm as { tablePropsRef: TableProps; setTableProps: (value: TableProps) => void };
        vm.setTableProps({ ...vm.tablePropsRef, selectionMode: 'single' });
        await flushPromises();

        expect(rebuildColumnsMock).toHaveBeenCalledTimes(1);
    });
});
