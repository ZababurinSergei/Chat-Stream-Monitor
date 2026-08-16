import type * as NaiveUi from 'naive-ui';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDataStore } from '@/composables/AiDataTable/useDataStore.ts';
import type { TableProps } from '@/components/ui/AiDataTable/types.ts';

const messageApi = {
    success: vi.fn(),
    error: vi.fn(),
};

const tableDataMock = vi.fn();

vi.mock('naive-ui', async importOriginal => {
    const actual = await importOriginal<typeof NaiveUi>();
    return {
        ...actual,
        useMessage: () => messageApi,
    };
});

vi.mock('@/composables/common/useGlobalSettings', () => ({
    useGlobalSettings: () => ({
        tableApi: {
            data: tableDataMock,
            userChanges: vi.fn(),
        },
    }),
}));

describe('useDataStore', () => {
    const GET_API = 'get-endpoint';
    const SET_API = 'set-endpoint';

    const createTableProps = (overrides: Partial<TableProps> = {}): TableProps =>
        ({
            isEditable: true,
            keyExpr: 'id',
            selectionMode: 'multiple',
            api: { get: GET_API, set: SET_API },
            columns: [
                { dataField: 'name', dataType: 'string' },
                { dataField: 'cityId', dataType: 'number', displayField: 'cityName' },
            ],
            ...overrides,
        }) as TableProps;

    const createStore = (overrides: Partial<TableProps> = {}) =>
        useDataStore(createTableProps(overrides), 'id', new Map(), new Map());

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getData загружает и заменяет локальные данные при success=true', async () => {
        const { data, getData } = createStore();
        tableDataMock.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] });

        const result = await getData();

        expect(result).toBe(true);
        expect(tableDataMock).toHaveBeenCalledWith(GET_API);
        expect(data).toEqual([{ id: 1 }, { id: 2 }]);
        expect(messageApi.success).toHaveBeenCalledWith('Данные успешно загружены');
    });

    it('getData возвращает false и показывает ошибку при success=false', async () => {
        const { getData } = createStore();
        tableDataMock.mockResolvedValue({ success: false, error: 'boom' });

        const result = await getData();

        expect(result).toBe(false);
        expect(messageApi.error).toHaveBeenCalledWith('Ошибка при загрузке данных: boom');
    });

    it('updateRowField меняет поле и возвращает старое значение', () => {
        const { data, updateRowField } = createStore();
        data.push({ id: 1, name: 'old' });

        const oldValue = updateRowField(1, 'name', 'new');

        expect(oldValue).toBe('old');
        expect(data[0]?.name).toBe('new');
    });

    it('insertNewRow добавляет строку с null-полями и признаком isNewRow', () => {
        const newRowId = 0.123456789;
        vi.spyOn(Math, 'random').mockReturnValue(newRowId);

        const { data, insertNewRow } = createStore();

        const [rowKey, rowData] = insertNewRow(null);

        expect(rowKey).toBe(newRowId);
        expect(rowData).toMatchObject({
            id: newRowId,
            name: null,
            cityId: null,
            cityName: null,
            isNewRow: true,
        });
        expect(data[0]).toEqual(rowData);
    });

    it('setData сохраняет ошибки валидации и возвращает false', async () => {
        const { data, setData, getValidationErrorMessage } = createStore();
        data.push({ id: 1, name: 'bad' });
        tableDataMock.mockResolvedValue({
            success: false,
            validationErrors: [{ item: { id: 1 }, field: 'name', message: ['Имя обязательно'] }],
        });

        const result = await setData([1], []);

        expect(result).toBe(false);
        expect(getValidationErrorMessage(1, 'name')).toBe('Имя обязательно');
        expect(messageApi.error).toHaveBeenCalledWith('Ошибка при сохранении данных: ошибки валидации');
    });

    it('updateRowField снимает ошибку валидации для поля', async () => {
        const { data, setData, updateRowField, getValidationErrorMessage } = createStore();
        data.push({ id: 1, name: 'bad' });
        tableDataMock.mockResolvedValue({
            success: false,
            validationErrors: [{ item: { id: 1 }, field: 'name', message: ['Имя обязательно'] }],
        });
        await setData([1], []);

        updateRowField(1, 'name', 'fixed');

        expect(getValidationErrorMessage(1, 'name')).toBeUndefined();
    });

    it('applyChangesToData применяет изменённые и новые строки к локальным данным', () => {
        const rowChangesByRowKey = new Map([[1, { name: { originalValue: 'server', currentValue: 'changed' } }]]);
        const newRows = new Map([['new-1', { id: 'new-1', name: 'new row', isNewRow: true }]]);
        const { data, applyChangesToData } = useDataStore(createTableProps(), 'id', rowChangesByRowKey, newRows);
        data.push({ id: 1, name: 'server' });

        applyChangesToData(false);

        expect(data).toEqual([
            { id: 'new-1', name: 'new row', isNewRow: true },
            { id: 1, name: 'changed' },
        ]);
    });

    it('deleteRows отправляет данные существующих строк на сервер', async () => {
        const { data, deleteRows } = createStore();
        data.push({ id: 1 }, { id: 2 }, { id: 3 });
        tableDataMock.mockResolvedValue({ success: true });

        const result = await deleteRows([2, 3]);

        expect(result).toBe(true);
        expect(tableDataMock).toHaveBeenCalledWith(SET_API, {
            insertDataArgs: [],
            updateDataArgs: [],
            deleteDataArgs: [{ id: 2 }, { id: 3 }],
        });
        expect(data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        expect(messageApi.success).toHaveBeenCalledWith('Данные успешно удалены');
    });

    it('deleteRows удаляет новую строку локально без запроса на сервер', async () => {
        const { data, deleteRows } = createStore();
        data.push({ id: 1 }, { id: 'new-1', isNewRow: true });

        const result = await deleteRows(['new-1']);

        expect(result).toBe(true);
        expect(tableDataMock).not.toHaveBeenCalled();
        expect(data.filter(Boolean)).toEqual([{ id: 1 }]);
        expect(messageApi.success).toHaveBeenCalledWith('Данные успешно удалены');
    });
});
