import { computed, reactive } from 'vue';
import type { DataTableRowData } from 'naive-ui';
import type { RowChanges, FieldChange } from '@/composables/AiDataTable/types.ts';
import type { DataFieldValue, RowKey } from '@/interfaces/common.ts';

export const useChangesTracker = () => {
    /** Мапа: ключ записи -> { измененное поле: оригинальное значение } */
    const rowChangesByRowKey = reactive(new Map<RowKey, RowChanges>());

    /** Мапа: ключ записи -> данные записи */
    const newRows = reactive(new Map<RowKey, DataTableRowData>());

    /** Флаг, показывающий, есть ли изменения/новые записи */
    const isDirty = computed(() => rowChangesByRowKey.size > 0 || newRows.size > 0);

    /** Проверяет, является ли запись новой */
    const isNewRow = (key: RowKey) => newRows.has(key);

    /** Ключи записей с изменениями */
    const getUpdatedRowKeys = () => Array.from(rowChangesByRowKey.keys());

    /** Ключи новых записей */
    const getInsertedRowKeys = () => Array.from(newRows.keys());

    /** Сбрасывает состояние изменений */
    const resetChanges = () => {
        rowChangesByRowKey.clear();
        newRows.clear();
    };

    /**
     * Проверяет, модифицировано ли поле в записи
     *
     * @param key - Значение ключа строки (`row[keyExpr]`)
     * @param dataField - Название поля для проверки
     *
     * @returns true, если значение было изменено, false в противном случае
     */
    const isModified = (key: RowKey, dataField: string): boolean => {
        if (isNewRow(key)) return true;
        return !!rowChangesByRowKey.get(key)?.[dataField];
    };

    /**
     * Отслеживает добавление новой строки
     *
     * @param row - Новая строка
     */
    const trackInsert = (key: RowKey, data: DataTableRowData) => {
        newRows.set(key, data);
    };

    /**
     * Отслеживает изменение существующей записи
     *
     * @param key - Значение ключа записи
     * @param dataField - Название изменяемого поля
     * @param oldValue - Предыдущее значение поля
     * @param newValue - Новое значение поля
     */
    const trackUpdate = (key: RowKey, dataField: string, oldValue: DataFieldValue, newValue: DataFieldValue) => {
        if (isNewRow(key)) return;

        const rowChanges = rowChangesByRowKey.get(key);

        // Первая правка записи
        if (rowChanges === undefined) {
            // Создаем объект с изменениями
            const newField: RowChanges = {
                [dataField]: {
                    originalValue: oldValue,
                    currentValue: newValue,
                },
            };
            // Записываем объект с изменениями в updatedRows
            rowChangesByRowKey.set(key, newField);
            return;
        }

        const hasField = dataField in rowChanges;

        // Первое изменение этого поля в записи
        if (!hasField) {
            // Сохраняем оригинальное значение для поля
            const newFieldChange: FieldChange = { originalValue: oldValue, currentValue: newValue };
            rowChanges[dataField] = newFieldChange;
            return;
        }

        const fieldChange = rowChanges[dataField];
        if (!fieldChange) return;

        const originalValue = fieldChange?.originalValue;

        // Новое значение не равно оригинальному значению
        if (!Object.is(newValue, originalValue)) {
            fieldChange.currentValue = newValue;
            return;
        }

        delete rowChanges[dataField];

        // Удаляем запись из updatedRows, если больше нет изменений
        if (Object.keys(rowChanges).length === 0) rowChangesByRowKey.delete(key);
    };

    const trackDelete = (keys: RowKey[]) => {
        for (const key of keys) {
            newRows.delete(key);
            rowChangesByRowKey.delete(key);
        }
    };

    return {
        isDirty,
        rowChangesByRowKey,
        newRows,
        resetChanges,
        getUpdatedRowKeys,
        getInsertedRowKeys,
        isNewRow,
        isModified,
        trackInsert,
        trackUpdate,
        trackDelete,
    };
};
