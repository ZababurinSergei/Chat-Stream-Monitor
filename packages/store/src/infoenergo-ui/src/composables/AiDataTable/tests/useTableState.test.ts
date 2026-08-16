import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, ref, type EffectScope } from 'vue';

import { useTableState } from '@/composables/AiDataTable/useTableState.ts';
import { DEFAULT_KEY_EXPR } from '@/components/ui/AiDataTable/defaults.ts';
import { DEFAULT_TABLE_TOOLBAR_SETTINGS } from '@/components/ui/AiToolbar/settings/defaults.ts';
import type { TableProps } from '@/components/ui/AiDataTable/types.ts';
import { useGlobalSettings } from '@/composables/common/useGlobalSettings.ts';

vi.mock('@/composables/common/useGlobalSettings', () => {
    const tableApi = {
        data: vi.fn(),
        userChanges: vi.fn(),
        userSettingsApi: {
            get: 'api/table/user-settings/get',
            set: 'api/table/user-settings/set',
        },
    };

    return {
        useGlobalSettings: () => ({ tableApi }),
    };
});

const createTableProps = (): TableProps =>
    ({
        viewId: 'test-view',
        columns: [],
        api: { get: '/api/data' },
    }) as TableProps;

const createTableState = (
    keyExpr?: string,
    tableProps: TableProps = createTableProps(),
    updateColumnWidth = vi.fn(),
    getColumnsSettings: () => { dataField: string; visibleIndex: number; width: number; visible: boolean }[] = () => [],
    rebuildColumns = vi.fn(),
    applyColumnsSettings = vi.fn()
) =>
    scope.run(() =>
        useTableState(
            keyExpr ?? DEFAULT_KEY_EXPR,
            tableProps,
            rebuildColumns,
            getColumnsSettings,
            updateColumnWidth,
            vi.fn(),
            applyColumnsSettings
        )
    );

const getLastSavePayload = () => {
    const { tableApi } = useGlobalSettings();
    const lastCall = vi.mocked(tableApi.userChanges).mock.calls.at(-1);
    return lastCall?.[1] as { settings: Record<string, unknown>; viewId: string } | undefined;
};

const flushAutoSave = () => vi.advanceTimersByTimeAsync(1000);

let scope: EffectScope;

describe('useTableState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        scope = effectScope(true);
        const { tableApi } = useGlobalSettings();
        vi.mocked(tableApi.userChanges).mockReset();
        vi.mocked(tableApi.userChanges).mockResolvedValue({ result: true });
    });

    afterEach(() => {
        scope.stop();
        vi.useRealTimers();
    });

    it('инициализирует настройки тулбара значениями по умолчанию', () => {
        const state = createTableState();

        expect(state.tableSettings.autoSaveMode).toBe(DEFAULT_TABLE_TOOLBAR_SETTINGS.autoSaveMode);
        expect(state.tableSettings.groupPanelVisible).toBe(DEFAULT_TABLE_TOOLBAR_SETTINGS.groupPanelVisible);
    });

    it('инициализирует состояние таблицы значениями по умолчанию', () => {
        const state = createTableState();

        expect(state.focusedRowKey.value).toBeNull();
        expect(state.checkedRowKeys.value).toEqual([]);
    });

    it('getRowKey возвращает ключ строки по переданному keyExpr', () => {
        const { getRowKey } = createTableState('code');
        const row = { id: 1, code: 'row-1' };

        expect(getRowKey(row)).toBe('row-1');
    });

    it('setFocusedRow обновляет ключ фокусной строки', () => {
        const { focusedRowKey, setFocusedRow } = createTableState('id');
        const row = { id: 101, name: 'test' };

        setFocusedRow(row);

        expect(focusedRowKey.value).toBe(101);
    });

    it('isFocusedRow корректно определяет фокусную строку', () => {
        const { setFocusedRow, isFocusedRow } = createTableState('id');
        const row1 = { id: 2, value: 'focused' };
        const row2 = { id: 3, value: 'other' };

        setFocusedRow(row1);

        expect(isFocusedRow(row1)).toBe(true);
        expect(isFocusedRow(row2)).toBe(false);
    });

    it('isCheckedRow корректно определяет выделенную строку', () => {
        const { checkedRowKeys, isCheckedRow } = createTableState();

        const row1 = { id: 1, value: 'checked' };
        const row2 = { id: 2, value: 'checked' };
        const row3 = { id: 3, value: 'unchecked' };

        checkedRowKeys.value = [1, 2];

        expect(isCheckedRow(row1)).toBe(true);
        expect(isCheckedRow(row2)).toBe(true);
        expect(isCheckedRow(row3)).toBe(false);
    });

    it('resetState перезаписывает data, сбрасывает checkedRowKeys и ставит фокус на первую строку', () => {
        const { checkedRowKeys, focusedRowKey, resetState } = createTableState('id');
        checkedRowKeys.value = [1, 2];

        resetState([
            { id: 10, value: 'first' },
            { id: 20, value: 'second' },
        ]);

        expect(focusedRowKey.value).toBe(10);
        expect(checkedRowKeys.value).toEqual([]);
    });

    it('resetState восстанавливает сохранённый focusedRow, если строка есть в данных', () => {
        const { focusedRowKey, resetState } = createTableState('id');

        resetState(
            [
                { id: 10, value: 'first' },
                { id: 20, value: 'second' },
            ],
            20
        );

        expect(focusedRowKey.value).toBe(20);
    });

    it('syncState очищает фокус и checkedRowKeys для удаленных строк', () => {
        const { checkedRowKeys, focusedRowKey, resetState, syncState } = createTableState('id');

        resetState([
            { id: 1, value: 'a' },
            { id: 2, value: 'b' },
        ]);
        checkedRowKeys.value = [1, 999];
        focusedRowKey.value = 999;

        syncState();

        expect(focusedRowKey.value).toBeNull();
        expect(checkedRowKeys.value).toEqual([1]);
    });

    it('getUserDataChanges не вызывает API без viewId', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const tableProps = {
            viewId: '',
            columns: [],
            api: { get: '/api/data' },
        } as TableProps;
        const { getUserDataChanges } = createTableState(undefined, tableProps);
        const { tableApi } = useGlobalSettings();

        const result = await getUserDataChanges();

        expect(result).toBeNull();
        expect(tableApi.userChanges).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(
            'viewId не указан, настройки таблицы не могут быть сохранены или загружены'
        );
        consoleError.mockRestore();
    });

    it('при включённом автосохранении сохраняет focusedRow при смене фокуса', async () => {
        const { tableApi } = useGlobalSettings();
        const { setFocusedRow } = createTableState('id');

        setFocusedRow({ id: 42, name: 'test' });

        await vi.advanceTimersByTimeAsync(1000);

        expect(tableApi.userChanges).toHaveBeenCalledWith(
            'api/table/user-settings/set',
            expect.objectContaining({
                settings: expect.objectContaining({ focusedRow: 42 }),
            })
        );
    });

    it('при включённом автосохранении отправляет настройки на бэкенд с дебаунсом 1000 мс', async () => {
        const { tableApi } = useGlobalSettings();
        const width = ref(100);
        const getColumnsSettings = () => [
            { dataField: 'name', visibleIndex: 1, width: width.value, visible: true },
        ];
        const updateColumnWidth = vi.fn((_: string, newWidth: number) => {
            width.value = newWidth;
        });
        const { handleColumnResize } = scope.run(() =>
            useTableState(
                DEFAULT_KEY_EXPR,
                createTableProps(),
                vi.fn(),
                getColumnsSettings,
                updateColumnWidth,
                vi.fn(),
                vi.fn()
            )
        );

        handleColumnResize(0, 120, { key: 'name' } as never);
        expect(tableApi.userChanges).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1000);

        expect(updateColumnWidth).toHaveBeenCalledWith('name', 120);
        expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
    });

    it('при выключенном автосохранении не отправляет настройки при изменении колонок', async () => {
        const { tableApi } = useGlobalSettings();
        const width = ref(100);
        const { handleColumnResize, tableSettings } = scope.run(() =>
            useTableState(
                DEFAULT_KEY_EXPR,
                createTableProps(),
                vi.fn(),
                () => [{ dataField: 'name', visibleIndex: 1, width: width.value, visible: true }],
                vi.fn((_: string, newWidth: number) => {
                    width.value = newWidth;
                }),
                vi.fn(),
                vi.fn()
            )
        );

        tableSettings.autoSaveMode = false;
        handleColumnResize(0, 120, { key: 'name' } as never);

        await vi.advanceTimersByTimeAsync(1000);

        expect(tableApi.userChanges).not.toHaveBeenCalled();
    });

    it('сохраняет состояние чекбокса автосохранения на бэкенд при переключении', async () => {
        const { tableApi } = useGlobalSettings();
        const { handleSettingsChange, tableSettings } = createTableState();

        expect(tableSettings.autoSaveMode).toBe(true);

        await handleSettingsChange('auto-save');

        expect(tableSettings.autoSaveMode).toBe(false);
        expect(tableApi.userChanges).toHaveBeenCalledWith(
            'api/table/user-settings/set',
            expect.objectContaining({
                settings: expect.objectContaining({ autoSaveMode: false }),
            })
        );
    });

    describe('автосохранение', () => {
        it('не отправляет запрос до истечения дебаунса 1000 мс', async () => {
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow } = createTableState('id');

            setFocusedRow({ id: 1, name: 'first' });

            await vi.advanceTimersByTimeAsync(999);
            expect(tableApi.userChanges).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(1);
            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
        });

        it('объединяет быстрые изменения в один запрос с финальным состоянием', async () => {
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow } = createTableState('id');

            setFocusedRow({ id: 1, name: 'first' });
            await vi.advanceTimersByTimeAsync(200);
            setFocusedRow({ id: 2, name: 'second' });
            await vi.advanceTimersByTimeAsync(200);
            setFocusedRow({ id: 3, name: 'third' });

            expect(tableApi.userChanges).not.toHaveBeenCalled();

            await flushAutoSave();

            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
            expect(getLastSavePayload()?.settings.focusedRow).toBe(3);
        });

        it('отправляет полный снимок настроек таблицы', async () => {
            const { tableApi } = useGlobalSettings();
            const columns = [
                { dataField: 'name', visibleIndex: 0, width: 150, visible: true },
            ];
            const { setFocusedRow, handleSettingsChange } = createTableState(
                'id',
                createTableProps(),
                vi.fn(),
                () => columns
            );

            await handleSettingsChange('show-grouping');
            setFocusedRow({ id: 7, name: 'row' });

            await flushAutoSave();

            expect(tableApi.userChanges).toHaveBeenCalledWith('api/table/user-settings/set', {
                viewId: 'test-view',
                settings: {
                    autoSaveMode: true,
                    groupPanelVisible: true,
                    focusedRow: 7,
                    columns,
                },
            });
        });

        it('сохраняет groupPanelVisible при переключении группировки', async () => {
            const { tableApi } = useGlobalSettings();
            const { handleSettingsChange, tableSettings } = createTableState();

            expect(tableSettings.groupPanelVisible).toBe(false);

            handleSettingsChange('show-grouping');
            await flushAutoSave();

            expect(tableSettings.groupPanelVisible).toBe(true);
            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
            expect(getLastSavePayload()?.settings.groupPanelVisible).toBe(true);
        });

        it('сохраняет настройки после сброса', async () => {
            const { tableApi } = useGlobalSettings();
            const rebuildColumns = vi.fn();
            const onResetState = vi.fn();
            const { handleSettingsChange, tableSettings } = scope.run(() =>
                useTableState(
                    DEFAULT_KEY_EXPR,
                    createTableProps(),
                    rebuildColumns,
                    () => [],
                    vi.fn(),
                    onResetState,
                    vi.fn()
                )
            );

            tableSettings.groupPanelVisible = true;
            tableSettings.autoSaveMode = false;

            handleSettingsChange('reset-settings');
            await flushAutoSave();

            expect(rebuildColumns).toHaveBeenCalledTimes(1);
            expect(onResetState).toHaveBeenCalledTimes(1);
            expect(tableSettings.groupPanelVisible).toBe(DEFAULT_TABLE_TOOLBAR_SETTINGS.groupPanelVisible);
            expect(tableSettings.autoSaveMode).toBe(DEFAULT_TABLE_TOOLBAR_SETTINGS.autoSaveMode);
            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
            expect(getLastSavePayload()?.settings).toMatchObject({
                autoSaveMode: DEFAULT_TABLE_TOOLBAR_SETTINGS.autoSaveMode,
                groupPanelVisible: DEFAULT_TABLE_TOOLBAR_SETTINGS.groupPanelVisible,
            });
        });

        it('не планирует автосохранение при повторном фокусе на той же строке', async () => {
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow } = createTableState('id');
            const row = { id: 5, name: 'same' };

            setFocusedRow(row);
            setFocusedRow(row);

            await flushAutoSave();

            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
        });

        it('при выключенном автосохранении не сохраняет при смене фокуса', async () => {
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow, tableSettings } = createTableState('id');

            tableSettings.autoSaveMode = false;
            setFocusedRow({ id: 11, name: 'row' });

            await flushAutoSave();

            expect(tableApi.userChanges).not.toHaveBeenCalled();
        });

        it('отменяет отложенное автосохранение при dispose composable', async () => {
            const { tableApi } = useGlobalSettings();
            const innerScope = effectScope(true);

            innerScope.run(() => {
                const { setFocusedRow } = useTableState(
                    DEFAULT_KEY_EXPR,
                    createTableProps(),
                    vi.fn(),
                    () => [],
                    vi.fn(),
                    vi.fn(),
                    vi.fn()
                );
                setFocusedRow({ id: 1, name: 'row' });
            });

            innerScope.stop();
            await vi.advanceTimersByTimeAsync(1000);

            expect(tableApi.userChanges).not.toHaveBeenCalled();
        });

        it('переключение чекбокса автосохранения отменяет отложенное сохранение', async () => {
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow, handleSettingsChange } = createTableState('id');

            setFocusedRow({ id: 1, name: 'row' });
            await handleSettingsChange('auto-save');

            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);

            await flushAutoSave();

            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
        });

        it('сохраняет изменения колонок при обновлении getColumnsSettings', async () => {
            const { tableApi } = useGlobalSettings();
            const columns = ref([
                { dataField: 'name', visibleIndex: 0, width: 100, visible: true },
            ]);
            createTableState('id', createTableProps(), vi.fn(), () => columns.value);

            columns.value = [{ dataField: 'name', visibleIndex: 0, width: 200, visible: false }];

            await flushAutoSave();

            expect(tableApi.userChanges).toHaveBeenCalledTimes(1);
            expect(getLastSavePayload()?.settings.columns).toEqual([
                { dataField: 'name', visibleIndex: 0, width: 200, visible: false },
            ]);
        });

        it('не вызывает API при автосохранении без viewId', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            const tableProps = {
                viewId: '',
                columns: [],
                api: { get: '/api/data' },
            } as TableProps;
            const { tableApi } = useGlobalSettings();
            const { setFocusedRow } = createTableState('id', tableProps);

            setFocusedRow({ id: 1, name: 'row' });
            await flushAutoSave();

            expect(tableApi.userChanges).not.toHaveBeenCalled();
            consoleError.mockRestore();
        });
    });
});
