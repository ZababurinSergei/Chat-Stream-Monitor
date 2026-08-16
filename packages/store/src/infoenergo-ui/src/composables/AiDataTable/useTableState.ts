import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import type { DataTableBaseColumn, DataTableRowData } from 'naive-ui';
import type { TableProps, TableColumnSettings, TableSettings } from '@/components/ui/AiDataTable/types.ts';
import type { RowKey } from '@/interfaces/common.ts';
import type { SettingsDropdownKey, TableToolbarSettings } from '@/components/ui/AiToolbar/settings/types.ts';
import { DEFAULT_TABLE_TOOLBAR_SETTINGS } from '@/components/ui/AiToolbar/settings/defaults.ts';
import { useGlobalSettings } from '@/composables/common/useGlobalSettings.ts';

const AUTO_SAVE_DEBOUNCE_MS = 1000;

/**
 * Композабл для управления состоянием таблицы
 *
 * @param keyExpr - Имя поля ключа строки
 * @param meta - Метаданные таблицы, включая `viewId` для сохранения настроек
 * @param rebuildColumns - Пересборка колонок после сброса настроек тулбара
 * @param getColumnsSettings - Получение текущих настроек колонок для сохранения
 * @param updateColumnWidth - Обновление ширины колонки при ресайзе
 * @param onResetState - Сброс состояния строк после сброса настроек тулбара
 * @param applyColumnsSettings - Применение сохранённых настроек колонок
 *
 * @returns Объект с состоянием и методами для управления состоянием таблицы
 */
export const useTableState = (
    keyExpr: string,
    tableProps: TableProps,
    rebuildColumns: () => void,
    getColumnsSettings: () => TableColumnSettings[],
    updateColumnWidth: (dataField: string, width: number) => void,
    onResetState: () => void,
    applyColumnsSettings: (columns: TableColumnSettings[]) => void
) => {
    /** Ключ строки, на которой фокусируется таблица */
    const focusedRowKey = ref<RowKey | null>(null);
    /** Ключи строк, выделенных в таблице */
    const checkedRowKeys = ref<RowKey[]>([]);
    /** Ссылка на данные таблицы */
    const data = ref<DataTableRowData[]>([]);
    /** Настройки тулбара таблицы */
    const tableSettings = reactive<TableToolbarSettings>({ ...DEFAULT_TABLE_TOOLBAR_SETTINGS });
    /** Ключ для принудительного пересоздания `NDataTable` при сбросе настроек */
    const tableResetKey = ref(Math.random());
    const { tableApi } = useGlobalSettings();

    /** Возвращает ключ строки по `keyExpr` */
    const getRowKey = (row: DataTableRowData) => row[keyExpr];
    /** Проверяет, является ли строка фокусированной */
    const isFocusedRow = (row: DataTableRowData) => row[keyExpr] === focusedRowKey.value;
    /** Проверяет, является ли строка выделенной */
    const isCheckedRow = (row: DataTableRowData) => checkedRowKeys.value.includes(row[keyExpr]);

    /** Идентификатор таймера отложенного автосохранения */
    let autoSaveTimeoutId: ReturnType<typeof setTimeout> | null = null;

    /** Обновляет данные, сбрасывает выделение и восстанавливает фокус строки */
    const resetState = (incomingData: DataTableRowData[], savedFocusedRowKey?: RowKey | null) => {
        data.value = incomingData;
        const hasSavedFocus =
            savedFocusedRowKey !== null && incomingData.some(row => row[keyExpr] === savedFocusedRowKey);
        focusedRowKey.value = hasSavedFocus ? savedFocusedRowKey : (incomingData.at(0)?.[keyExpr] ?? null);
        checkedRowKeys.value.length = 0;
    };

    /** Актуализирует фокус и выделение после изменения данных */
    const syncState = () => {
        focusedRowKey.value = data.value.find(row => row[keyExpr] === focusedRowKey.value)?.[keyExpr] ?? null;
        checkedRowKeys.value = data.value
            .filter(row => checkedRowKeys.value.includes(row[keyExpr]))
            .map(row => row[keyExpr]);
    };

    /** Текущий снимок настроек таблицы для сохранения */
    const tableSettingsSnapshot = computed<TableSettings>(() => ({
        autoSaveMode: tableSettings.autoSaveMode,
        groupPanelVisible: tableSettings.groupPanelVisible,
        focusedRow: focusedRowKey.value,
        columns: getColumnsSettings(),
    }));

    /** Проверка существаования `viewId` таблицы */
    const resolveViewId = (): string | null => {
        const viewId = tableProps.viewId;
        if (!viewId) {
            console.error('viewId не указан, настройки таблицы не могут быть сохранены или загружены');
            return null;
        }
        return viewId;
    };
    /** Сохраняет пользовательские настройки таблицы на сервере */
    const setUserDataChanges = async (changes: TableSettings) => {
        const viewId = resolveViewId();
        if (!viewId) return false;

        try {
            const response = await tableApi.userChanges(tableApi.userSettingsApi.set, {
                settings: changes,
                viewId,
            });
            return !!response?.result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Ошибка при сохранении настроек: ${errorMessage}`);
            return false;
        }
    };

    /** Загружает сохранённые пользовательские настройки таблицы */
    const getUserDataChanges = async (): Promise<TableSettings | null> => {
        const viewId = resolveViewId();
        if (!viewId) return null;

        try {
            const response = await tableApi.userChanges(tableApi.userSettingsApi.get, {
                viewId,
            });
            if (response?.result) {
                return response.settings;
            }
            return null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Ошибка при загрузке настроек: ${errorMessage}`);
            return null;
        }
    };

    /** Отменяет отложенное автосохранение */
    const cancelScheduledAutoSave = () => {
        if (autoSaveTimeoutId !== null) {
            clearTimeout(autoSaveTimeoutId);
            autoSaveTimeoutId = null;
        }
    };

    /** Планирует автосохранение настроек таблицы */
    const triggerAutoSave = () => {
        if (!tableSettings.autoSaveMode) return;

        cancelScheduledAutoSave();
        autoSaveTimeoutId = setTimeout(async () => {
            autoSaveTimeoutId = null;
            await setUserDataChanges(tableSettingsSnapshot.value);
        }, AUTO_SAVE_DEBOUNCE_MS);
    };

    /** Устанавливает фокус на строку */
    const setFocusedRow = (row: DataTableRowData) => {
        if (focusedRowKey.value === row[keyExpr]) return;

        focusedRowKey.value = row[keyExpr];
        triggerAutoSave();
    };

    /** Обрабатывает изменение ширины колонки при ресайзе */
    const handleColumnResize = (_: number, newWidth: number, column: DataTableBaseColumn) => {
        updateColumnWidth?.(String(column.key), newWidth);
    };

    /** Сбрасывает настройки тулбара к значениям по умолчанию */
    const resetTableToolbarSettings = () => {
        tableSettings.autoSaveMode = DEFAULT_TABLE_TOOLBAR_SETTINGS.autoSaveMode;
        tableSettings.groupPanelVisible = DEFAULT_TABLE_TOOLBAR_SETTINGS.groupPanelVisible;
    };

    /** Применяет загруженные настройки (если их нет, берем дефолтные) и возвращает сохранённый ключ фокусной строки */
    const applyTableSettings = (settings: TableSettings): RowKey | null => {
        tableSettings.autoSaveMode = settings.autoSaveMode ?? DEFAULT_TABLE_TOOLBAR_SETTINGS.autoSaveMode;
        tableSettings.groupPanelVisible =
            settings.groupPanelVisible ?? DEFAULT_TABLE_TOOLBAR_SETTINGS.groupPanelVisible;
        applyColumnsSettings(settings.columns);

        return settings.focusedRow;
    };

    /** Обработчики действий выпадающего меню настроек тулбара по ключу */
    const settingsChangeHandlers: Record<SettingsDropdownKey, () => void | Promise<void>> = {
        'save-settings': async () => {
            await setUserDataChanges(tableSettingsSnapshot.value);
        },
        'reset-settings': () => {
            resetTableToolbarSettings();
            rebuildColumns();
            tableResetKey.value = Math.random();
            onResetState();
            triggerAutoSave();
        },
        'auto-save': async () => {
            cancelScheduledAutoSave();
            tableSettings.autoSaveMode = !tableSettings.autoSaveMode;
            await setUserDataChanges(tableSettingsSnapshot.value);
        },
        'show-grouping': () => {
            tableSettings.groupPanelVisible = !tableSettings.groupPanelVisible;
            triggerAutoSave();
        },
    };

    /** Обрабатывает действие из выпадающего меню настроек тулбара */
    const handleSettingsChange = async (action: SettingsDropdownKey) => {
        await settingsChangeHandlers[action]();
    };

    /** Отслеживаем изменения для автоматического сохранения пользовательских настроек */
    watch(tableSettingsSnapshot, () => triggerAutoSave(), { deep: true });

    /** Отменяет отложенное автосохранение при размонтировании таблицы, чтобы не отправлять устаревший снимок настроек */
    onScopeDispose(() => {
        cancelScheduledAutoSave();
    });

    return {
        focusedRowKey,
        checkedRowKeys,
        tableSettings,
        tableResetKey,
        getRowKey,
        resetState,
        syncState,
        isFocusedRow,
        isCheckedRow,
        setFocusedRow,
        handleSettingsChange,
        handleColumnResize,
        tableSettingsSnapshot,
        getUserDataChanges,
        applyTableSettings,
    };
};
