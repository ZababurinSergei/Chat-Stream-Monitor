import { computed, ref } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDataState } from '@/composables/AiDataTable/useDataState.ts';
import { useDataStore } from '@/composables/AiDataTable/useDataStore.ts';
import { useChangesTracker } from '@/composables/AiDataTable/useChangesTracker.ts';
import { useDialog } from '@/composables/AiDialog/useDialog.ts';
import type { TableProps } from '@/components/ui/AiDataTable/types.ts';

vi.mock('@/composables/AiDataTable/useDataStore.ts', () => ({
    useDataStore: vi.fn(),
}));
vi.mock('@/composables/AiDataTable/useChangesTracker.ts', () => ({
    useChangesTracker: vi.fn(),
}));
vi.mock('@/composables/AiDialog/useDialog.ts', () => ({
    useDialog: vi.fn(),
}));

describe('useDataState', () => {
    const data = ref<any[]>([]);
    const loading = ref(false);
    const getDataMock = vi.fn();
    const setDataMock = vi.fn();
    const updateRowFieldMock = vi.fn();
    const insertNewRowMock = vi.fn();
    const deleteRowsMock = vi.fn();

    const isDirty = ref(false);
    const resetChangesMock = vi.fn();
    const isModifiedMock = vi.fn();
    const trackInsertMock = vi.fn();
    const trackUpdateMock = vi.fn();
    const trackDeleteMock = vi.fn();
    const getUpdatedRowKeysMock = vi.fn(() => [] as (string | number)[]);
    const getInsertedRowKeysMock = vi.fn(() => [] as (string | number)[]);
    const applyChangesToDataMock = vi.fn();
    const rowChangesByRowKey = new Map();
    const newRows = new Map();

    const showDialogMock = vi.fn();

    const createTableProps = (overrides: Partial<TableProps> = {}) =>
        computed(
            () =>
                ({
                    isEditable: true,
                    selectionMode: 'multiple',
                    keyExpr: 'id',
                    api: { get: 'api/table/data/get', set: 'api/table/data/set' },
                    columns: [],
                    ...overrides,
                }) as TableProps
        );

    beforeEach(() => {
        vi.clearAllMocks();
        isDirty.value = false;
        resetChangesMock.mockImplementation(() => {
            isDirty.value = false;
        });

        (useDataStore as any).mockReturnValue({
            data,
            loading,
            getData: getDataMock,
            setData: setDataMock,
            updateRowField: updateRowFieldMock,
            insertNewRow: insertNewRowMock,
            deleteRows: deleteRowsMock,
            applyChangesToData: applyChangesToDataMock,
            getValidationErrorMessage: vi.fn(),
            createCopiedRow: vi.fn(),
            getDataRowIndexByKey: vi.fn(),
            getVirtualScrollTools: vi.fn(),
        });
        (useChangesTracker as any).mockReturnValue({
            isDirty,
            rowChangesByRowKey,
            newRows,
            resetChanges: resetChangesMock,
            isModified: isModifiedMock,
            trackInsert: trackInsertMock,
            trackUpdate: trackUpdateMock,
            trackDelete: trackDeleteMock,
            getUpdatedRowKeys: getUpdatedRowKeysMock,
            getInsertedRowKeys: getInsertedRowKeysMock,
        });
        (useDialog as any).mockReturnValue({
            show: showDialogMock,
        });
    });

    it('loadData загружает данные при clean-состоянии без сброса изменений', async () => {
        getDataMock.mockResolvedValue(true);
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.loadData();

        expect(result).toBe(true);
        expect(getDataMock).toHaveBeenCalledTimes(1);
        expect(resetChangesMock).not.toHaveBeenCalled();
        expect(showDialogMock).not.toHaveBeenCalled();
    });

    it('loadData при dirty и neutral возвращает false и не запрашивает getData', async () => {
        isDirty.value = true;
        showDialogMock.mockResolvedValue('neutral');
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.loadData();

        expect(result).toBe(false);
        expect(getDataMock).not.toHaveBeenCalled();
        expect(resetChangesMock).not.toHaveBeenCalled();
    });

    it('loadData при dirty и negative загружает данные и сбрасывает изменения', async () => {
        isDirty.value = true;
        showDialogMock.mockResolvedValue('negative');
        getDataMock.mockResolvedValue(true);
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.loadData();

        expect(result).toBe(true);
        expect(getDataMock).toHaveBeenCalledTimes(1);
        expect(resetChangesMock).toHaveBeenCalledTimes(1);
    });

    it('loadData при dirty и positive вызывает saveData', async () => {
        isDirty.value = true;
        showDialogMock.mockResolvedValue('positive');
        setDataMock.mockResolvedValue(true);
        getDataMock.mockResolvedValue(true);
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.loadData();

        expect(result).toBe(true);
        expect(setDataMock).toHaveBeenCalledTimes(1);
        expect(resetChangesMock).toHaveBeenCalledTimes(1);
        expect(getDataMock).toHaveBeenCalledTimes(1);
    });

    it('saveData сбрасывает изменения и перезагружает данные только при успешном setData', async () => {
        setDataMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        getDataMock.mockResolvedValue(true);
        const state = useDataState(createTableProps().value, 'id');

        await state.saveData();
        await state.saveData();

        expect(setDataMock).toHaveBeenCalledTimes(2);
        expect(resetChangesMock).toHaveBeenCalledTimes(1);
        expect(getDataMock).toHaveBeenCalledTimes(1);
    });

    it('createRow добавляет строку и трекает insert с данными строки', () => {
        const newRowData = { id: 'new-key', name: null, isNewRow: true };
        insertNewRowMock.mockReturnValue(['new-key', newRowData]);
        const state = useDataState(createTableProps().value, 'id');

        state.createRow(null);

        expect(insertNewRowMock).toHaveBeenCalledWith(null);
        expect(trackInsertMock).toHaveBeenCalledWith('new-key', newRowData);
    });

    it('removeRows подтверждает удаление, трекает delete, перезагружает данные и применяет изменения при успехе', async () => {
        showDialogMock.mockResolvedValue('positive');
        deleteRowsMock.mockResolvedValue(true);
        getDataMock.mockResolvedValue(true);
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.removeRows([1, 2]);

        expect(result).toBe(true);
        expect(deleteRowsMock).toHaveBeenCalledWith([1, 2]);
        expect(trackDeleteMock).toHaveBeenCalledWith([1, 2]);
        expect(getDataMock).toHaveBeenCalledTimes(1);
        expect(applyChangesToDataMock).toHaveBeenCalledWith(false);
    });

    it('removeRows не применяет изменения, если перезагрузка данных не удалась', async () => {
        showDialogMock.mockResolvedValue('positive');
        deleteRowsMock.mockResolvedValue(true);
        getDataMock.mockResolvedValue(false);
        const state = useDataState(createTableProps().value, 'id');

        const result = await state.removeRows([1]);

        expect(result).toBe(false);
        expect(applyChangesToDataMock).not.toHaveBeenCalled();
    });

    it('updateRow обновляет поле и трекает изменение', () => {
        updateRowFieldMock.mockReturnValue('old');
        const state = useDataState(createTableProps().value, 'id');

        state.updateRow(1, 'name', 'new');

        expect(updateRowFieldMock).toHaveBeenCalledWith(1, 'name', 'new');
        expect(trackUpdateMock).toHaveBeenCalledWith(1, 'name', 'old', 'new');
    });
});
