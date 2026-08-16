import { reactive, ref, readonly } from 'vue';
import { useMessage } from 'naive-ui';
import type { DataTableRowData } from 'naive-ui';
import type { TableProps } from '@/components/ui/AiDataTable/types.ts';
import type { RowChanges } from '@/composables/AiDataTable/types.ts';
import { useGlobalSettings } from '@/composables/common/useGlobalSettings';
import type {
    DataFieldValue,
    RowKey,
    VirtualScrollTools,
    GetVirtualScrollTableResponse,
    ErrorResponse,
} from '@/interfaces/common.ts';

export const useDataStore = (
    tableProps: TableProps,
    keyExpr: string,
    rowChangesByRowKey: Map<RowKey, RowChanges>,
    newRows: Map<RowKey, DataTableRowData>
) => {
    const message = useMessage();
    const { tableApi } = useGlobalSettings();

    const fieldKeys = tableProps.columns.flatMap(column =>
        column.displayField ? [column.dataField, column.displayField] : column.dataField
    );

    /** Массив с модифицируемыми данными */
    const data = reactive<DataTableRowData[]>([]);
    const loading = ref<boolean>(false);
    const validationErrors = reactive(new Map<string, string>());

    const getDataRowByKey = (key: RowKey) => data.find(row => row[keyExpr] === key);
    const getDataRowIndexByKey = (key: RowKey) => data.findIndex(row => row[keyExpr] === key);
    const createValidationErrorKey = (key: RowKey, dataField: string) => key + '___' + dataField;

    const getApi = tableProps.api.get;
    const setApi = tableProps.api.set;
    const getNewRowData = () => ({
        ...Object.fromEntries(fieldKeys.map(field => [field, null])),
        [keyExpr]: Math.random(),
        isNewRow: true,
    });
    const getNewCopiedRowData = (key: RowKey) => {
        const row = getDataRowByKey(key);
        return {
            ...row,
            [keyExpr]: Math.random(),
            isNewRow: true,
        };
    };

    /**
     * Получает данные с сервера и обновляет локальное состояние
     */
    const getData = async () => {
        try {
            loading.value = true;

            const response = await tableApi.data(getApi);
            validationErrors.clear();

            if (response.success) {
                message.success('Данные успешно загружены');
                const newData = response?.data ?? [];
                data.length = 0;
                data.push(...newData);
                return true;
            } else {
                message.error(`Ошибка при загрузке данных: ${response.error}`);
                return false;
            }
        } catch (error) {
            console.error('Failed to fetch table data:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            message.error(`Ошибка при загрузке данных: ${errorMessage}`);
            return false;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Отправляет данные на сервер (в разработке)
     *
     * @todo Добавить body
     * @todo Реализовать обновление локальных данных после успешной отправки
     */
    const setData = async (updatedDataKeys: RowKey[], insertedDataKeys: RowKey[]) => {
        if (!setApi) {
            console.error('apiSet is not defined');
            return;
        }

        const modifiedData = {
            insertDataArgs: insertedDataKeys.map(getDataRowByKey).filter(row => row !== undefined),
            updateDataArgs: updatedDataKeys.map(getDataRowByKey).filter(row => row !== undefined),
            deleteDataArgs: [],
        };

        try {
            loading.value = true;

            const response = await tableApi.data(setApi, modifiedData);
            validationErrors.clear();

            if (response.success) {
                message.success('Данные успешно сохранены');
                return true;
            } else if (response.validationErrors) {
                for (const error of response.validationErrors) {
                    const key = createValidationErrorKey(error.item[keyExpr], error.field);
                    validationErrors.set(key, error.message?.[0] ?? '');
                }
                message.error('Ошибка при сохранении данных: ошибки валидации');
                return false;
            } else {
                message.error(`Ошибка при сохранении данных: ${response.error}`);
                return false;
            }
        } catch (error) {
            console.error('Failed to send data:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            message.error(`Ошибка при сохранении данных: ${errorMessage}`);
            return false;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Изменяет значение поля в строке по ключу строки
     *
     * @param key - Значение ключа строки (`row[keyExpr]`)
     * @param dataField - Название поля для изменения
     * @param value - Новое значение
     */
    const updateRowField = (key: RowKey, dataField: string, newValue: DataFieldValue) => {
        const rowData = getDataRowByKey(key);

        if (!rowData || !(dataField in rowData)) return;

        validationErrors.delete(createValidationErrorKey(key, dataField));
        const oldValue = rowData[dataField];
        rowData[dataField] = newValue;

        return oldValue;
    };

    /**
     * Добавляет новую строку в начало массива
     */
    const insertNewRow = (focusedRowKey: RowKey | null) => {
        const newRow: DataTableRowData = getNewRowData();
        const focusedRowIndex = focusedRowKey !== null ? getDataRowIndexByKey(focusedRowKey) : -1;
        const newRowIndex = focusedRowIndex + 1;
        data.splice(newRowIndex, 0, newRow);
        return [newRow[keyExpr], newRow];
    };

    const getValidationErrorMessage = (key: RowKey, dataField: string): string | undefined => {
        const errorKey = createValidationErrorKey(key, dataField);
        const errorMessage = validationErrors.get(errorKey);
        return errorMessage;
    };

    /**
     * Удаляет строки из массива по ключам
     *
     * @param keys - Массив ключей строк
     *
     * @returns true, если строки были удалены, false в противном случае
     */
    const deleteRows = async (keys: RowKey[]) => {
        if (!setApi) {
            console.error('apiSet is not defined');
            return;
        }

        const onlyExistedRows = keys.filter(key => getDataRowByKey(key)?.isNewRow === undefined);
        const onlyNewRows = keys.filter(key => getDataRowByKey(key)?.isNewRow === true);

        const deleteNewRows = () => {
            const indices = onlyNewRows
                .map(key => getDataRowIndexByKey(key))
                .filter(index => index !== -1)
                .sort((a, b) => b - a);
            for (const index of indices) {
                data.splice(index, 1);
            }
        };

        if (onlyExistedRows.length === 0) {
            deleteNewRows();
            message.success('Данные успешно удалены');
            return true;
        }

        const modifiedData = {
            insertDataArgs: [],
            updateDataArgs: [],
            deleteDataArgs: onlyExistedRows.map(getDataRowByKey).filter(row => row !== undefined),
        };

        try {
            loading.value = true;

            const response = await tableApi.data(setApi, modifiedData);

            if (response.success) {
                message.success('Данные успешно удалены');
                deleteNewRows();
                return true;
            } else {
                message.error(`Ошибка при удалении данных: ${response.error}`);
                return false;
            }
        } catch (error) {
            console.error('Failed to send data:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            message.error(`Ошибка при удалении данных: ${errorMessage}`);
            return false;
        } finally {
            loading.value = false;
        }
    };

    const createCopiedRow = (focusedRowKey: RowKey) => {
        const copiedRow = getNewCopiedRowData(focusedRowKey);
        const focusedRowIndex = focusedRowKey !== null ? getDataRowIndexByKey(focusedRowKey) : -1;
        const newRowIndex = focusedRowIndex + 1;
        data.splice(newRowIndex, 0, copiedRow);
        return [copiedRow[keyExpr], copiedRow];
    };

    const applyChangesToData = (isVirtualScroll: boolean) => {
        for (const [key, changes] of rowChangesByRowKey) {
            const row = getDataRowByKey(key);
            // Строки нет в data — убираем устаревшие изменения
            if (!row) {
                if (isVirtualScroll) continue;

                rowChangesByRowKey.delete(key);
                continue;
            }
            // Обновляем значения полей в строке
            for (const [field, fieldChange] of Object.entries(changes)) {
                // Если поле существует в строке, обновляем его значение из мапы изменений
                if (field in row) {
                    row[field] = fieldChange.currentValue;
                }
                // Если поле не существует в строке, удаляем поле из объекта изменений строки
                else {
                    delete changes[field];
                    // Если не осталось изменений строки, удаляем запись из мапы изменений
                    if (Object.keys(changes).length === 0) {
                        rowChangesByRowKey.delete(key);
                    }
                }
            }
        }
        // Добавляем новые строки в начало data
        if (!isVirtualScroll) data.unshift(...Array.from(newRows.values()));
    };

    const getVirtualScrollTools = (pageSize: number): VirtualScrollTools => {
        const createPlaceholderRow = () => ({
            [keyExpr]: `__placeholder_${Math.random()}`,
            __isPlaceholder: true,
        });

        const getData = async (
            skip: number,
            take: number,
            nextPage: boolean
        ): Promise<GetVirtualScrollTableResponse | ErrorResponse> => {
            try {
                loading.value = true;

                const response = await tableApi.data(getApi, { skip, take });

                if (response.result) {
                    const newData = response.data ?? [];

                    if (nextPage) data.push(...newData);
                    else data.unshift(...newData);

                    const padCount = (pageSize - (newData.length % pageSize)) % pageSize;
                    if (padCount > 0) {
                        data.push(...Array.from({ length: padCount }, createPlaceholderRow));
                    }

                    const totalCount = response.totalCount ?? 0;
                    applyChangesToData(true);

                    return { result: true, data: newData, totalCount };
                } else {
                    message.error(`Ошибка при загрузке данных: ${response.error}`);
                    return { result: false, error: response.error };
                }
            } catch (error) {
                console.error('Failed to fetch page data:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                message.error(`Ошибка при загрузке данных: ${errorMessage}`);
                return { result: false, error: errorMessage };
            } finally {
                loading.value = false;
            }
        };

        const removeDataFromTop = (pageSize: number) => {
            data.splice(0, pageSize);
        };

        const removeDataFromBottom = (pageSize: number) => {
            if (data.length <= pageSize) return;
            data.splice(-pageSize);
        };

        const getDataLength = () => data.length;

        return {
            isPageLoading: readonly(loading),
            getData,
            getDataLength,
            removeDataFromTop,
            removeDataFromBottom,
        };
    };

    return {
        data,
        loading,
        getData,
        getVirtualScrollTools,
        getDataRowIndexByKey,
        setData,
        updateRowField,
        getValidationErrorMessage,
        insertNewRow,
        createCopiedRow,
        deleteRows,
        applyChangesToData,
    };
};
