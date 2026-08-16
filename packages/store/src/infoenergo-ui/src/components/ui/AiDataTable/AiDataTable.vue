<template>
    <div class="ai-data-table-wrapper">
        <AiToolbar
            v-if="!props.isPopover"
            :user-toolbar-items="props.toolbarItems"
            :is-editable="isTableEditable"
            :title="props.title"
            :count-selected-rows="checkedRowKeys.length"
            :has-focused-row="!!focusedRowKey"
            :is-data-modified="isDirty"
            :disabled="loading"
            :column-chooser="columnsChooser"
            :table-toolbar-settings="tableSettings"
            :search-value="searchValue"
            @column-chooser-change="setColumnsVisibility"
            @button-click="handleToolbarButtonClick"
            @dropdown-click="handleToolbarDropdownClick"
            @input-change="handleToolbarInputChange"
        />
        <n-data-table
            :key="tableResetKey"
            ref="dataTable"
            :style="{ '--ai-cell-height': props.cellHeight + 'px' }"
            v-model:checked-row-keys="checkedRowKeys"
            :columns="visibleColumns"
            :data="searchedData"
            :loading="loading"
            :row-key="getRowKey"
            :row-props="rowProps"
            :row-class-name="rowClassName"
            class="ai-data-table"
            :class="{ 'virtual-scroll': props.pageSize }"
            v-bind="mergedTableConfig"
            @unstable-column-resize="handleColumnResize"
        />
        <AiFooter
            v-if="props.showFooter"
            :selected-count="checkedRowKeys.length"
            :show-selection-count="props.selectionMode !== 'none'"
            :total-count="totalCount"
            @create-filter="emit('create-filter')"
        />
        <AiContextMenu
            ref="contextMenu"
            :options="DEFAULT_ROW_CONTEXT_MENU_OPTIONS"
            @contextMenuSelect="handleContextMenuSelect"
        />
    </div>
</template>

<script lang="ts" setup>
/**
 * Таблица данных на базе Naive UI `NDataTable`
 */
import { computed, ref, watch, onMounted, onUnmounted, readonly, useSlots } from 'vue';
import { NDataTable } from 'naive-ui';
import type { DataTableRowData } from 'naive-ui';
import {
    DEFAULT_PROPS,
    DEFAULT_TABLE_PROPS,
    DEFAULT_ROW_PROPS,
    DEFAULT_ROW_CONTEXT_MENU_OPTIONS,
} from '@/components/ui/AiDataTable/defaults';
import type { TableProps, TableEmits } from '@/components/ui/AiDataTable/types';
import AiToolbar from '@/components/ui/AiToolbar/AiToolbar.vue';
import type { SettingsDropdownKey } from '@/components/ui/AiToolbar/settings/types';
import { useTableState } from '@/composables/AiDataTable/useTableState';
import { useDataState } from '@/composables/AiDataTable/useDataState';
import { useColumnsConfig } from '@/composables/AiDataTable/useColumnsConfig';
import AiFooter from '@/components/ui/AiFooter/AiFooter.vue';
import { useVirtualScroll } from '@/composables/AiDataTable/useVirtualScroll';
import { useExportAdapter } from '@/composables/AiDataTable/useExportAdapter';
import AiContextMenu from '@/components/ui/AiContextMenu/AiContextMenu.vue';
import type { ContextMenuPayload } from '@/composables/AiContextMenu/types';

const props = withDefaults(defineProps<TableProps>(), DEFAULT_PROPS);
const slots = useSlots();
const emit = defineEmits<TableEmits>();
const dataTable = ref<InstanceType<typeof NDataTable> | null>(null);

const totalCount = computed(() => (virtualScroll.totalCount.value || data.length) ?? 0);
const searchedData = computed(() => filterRows(data));
const mergedTableConfig = computed(() => ({
    ...DEFAULT_TABLE_PROPS,
    ...(props.config ?? {}),
    virtualScroll: !props.pageSize,
    remote: !!props.pageSize,
}));
const contextMenu = ref<InstanceType<typeof AiContextMenu> | null>(null);

const {
    data,
    loading,
    isDirty,
    updateRow,
    copyRow,
    isModified,
    loadData,
    createRow,
    removeRows,
    saveData,
    getVirtualScrollTools,
    getValidationErrorMessage,
} = useDataState(props, props.keyExpr);
const {
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
} = useColumnsConfig(props, updateRow, isModified, getValidationErrorMessage, props.keyExpr, '.ai-data-table', slots);
const {
    checkedRowKeys,
    focusedRowKey,
    tableSettings,
    tableResetKey,
    getRowKey,
    resetState,
    syncState,
    setFocusedRow,
    isFocusedRow,
    isCheckedRow,
    handleSettingsChange,
    handleColumnResize,
    getUserDataChanges,
    applyTableSettings,
} = useTableState(
    props.keyExpr,
    props,
    rebuildColumns,
    getColumnsSettings,
    updateColumnWidth,
    () => resetState(data),
    applyColumnsSettings
);

const virtualScroll = useVirtualScroll();

const {
    getVisibleColumns,
    option,
    getDataSource,
    totalCount: getTotalCount,
    getSelectedRowsData,
    handleExportOption,
} = useExportAdapter(props, visibleColumns, data, totalCount, checkedRowKeys, getRowKey, filterRows);

const actions: Record<string, (...args: string[]) => Promise<void> | void> = {
    refresh: async () => {
        let success = false;

        if (props.pageSize) success = await virtualScroll.refreshData();
        else success = (await loadData()) ?? false;

        if (success) resetState(data);
    },
    add: () => {
        createRow(focusedRowKey.value);
    },
    delete: async () => {
        const success = await removeRows(checkedRowKeys.value);
        if (success) syncState();
    },
    copy: async () => {
        const success = await copyRow(focusedRowKey.value);
        if (success) syncState();
    },
    save: async () => {
        const success = await saveData();
        if (success) resetState(data);
    },
    settings: async (...args: string[]) => {
        await handleSettingsChange(args[0] as SettingsDropdownKey);
    },
    export: (...args: string[]) => handleExportOption(args[0]),
    search: (...args: string[]) => setSearchValue(args[0] ?? ''),
};

const rowClassName = (row: DataTableRowData, index: number) => {
    const classes = [];
    if (isFocusedRow(row)) classes.push('focused-row');
    if (isCheckedRow(row)) classes.push('checked-row');
    if (index === data.length - 1) classes.push('last-row');
    return classes.join(' ');
};

const rowProps = (row: DataTableRowData) => ({
    ...DEFAULT_ROW_PROPS,
    onDblclick: () => {
        emit('row-doubleclick', row);
    },
    onClick: () => {
        setFocusedRow(row);
        emit('row-click', row);
    },
    onContextmenu: (e: MouseEvent) => {
        contextMenu.value?.openContextMenu(e, { row: row });
    },
});

const handleContextMenuSelect = async (label: string, key: string, payload: ContextMenuPayload) => {
    let success = null;
    switch (key) {
        case 'copy-row':
            success = copyRow(payload.row[props.keyExpr]);
            if (success) syncState();
            break;
        case 'delete-row':
            success = await removeRows([payload.row[props.keyExpr]]);
            if (success) syncState();
            break;
        default:
            return;
    }
};

const handleToolbarButtonClick = async (id: string) => {
    await actions[id]?.();
    emit('toolbar-action', id);
};

const handleToolbarDropdownClick = async (id: string, optionKey: string) => {
    await actions[id]?.(optionKey);
    emit('toolbar-action', id, optionKey);
};

const handleToolbarInputChange = (id: string, value: string) => {
    actions[id]?.(value);
};

const doLoadData = async () => {
    let success = false;
    if (props.pageSize) {
        success = await virtualScroll.init(dataTable, props.pageSize, props.cellHeight, getVirtualScrollTools);
    } else {
        success = (await loadData()) ?? false;
    }

    return success;
};

onMounted(async () => {
    const savedSettings = await getUserDataChanges();
    const savedFocusedRow = savedSettings ? applyTableSettings(savedSettings) : null;

    const success = await doLoadData();
    if (success) resetState(data, savedFocusedRow);
});

onUnmounted(() => {
    if (props.pageSize) virtualScroll.clear();
});

watch(props, rebuildColumns, { deep: true });

defineExpose({
    focusedRowKey: readonly(focusedRowKey),
    checkedRowKeys: readonly(checkedRowKeys),
    refreshData: actions.refresh,
    getVisibleColumns,
    option,
    getDataSource,
    totalCount: getTotalCount,
    getSelectedRowsData,
});
</script>

<style scoped lang="scss">
.ai-data-table-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.ai-scrollbar-track) {
        position: absolute;
        box-sizing: border-box;
        top: 0;
        right: 0;
        width: 12px;
        padding: 0 2px;
        height: 100%;
        cursor: pointer;
    }

    :deep(.ai-scrollbar-thumb) {
        width: 100%;
        border-radius: 5px;
        background-color: var(--gray-700);
        transition: background-color 0.2s ease-in-out;
        touch-action: none;
        user-select: none;

        &:hover {
            background-color: var(--gray-900);
        }
    }
}

.ai-data-table {
    flex: 1;

    :deep(.n-data-table-th .n-data-table-resize-button) {
        right: -2px;

        &::after {
            height: 100%;
            left: 50%;
        }
    }

    :deep(.last-row > .n-data-table-td) {
        border-bottom: 1px solid var(--light-gray-800);
        padding-bottom: 10px;
    }

    :deep(.n-data-table-td) {
        position: relative;
    }

    // 4. checked
    :deep(.checked-row > .n-data-table-td) {
        background: var(--light-blue-800) !important;
    }

    // 3. focused
    :deep(.focused-row > .n-data-table-td) {
        background: var(--light-blue-800) !important;
    }

    // 2. modified (на любой строке, перебивает focused/checked)
    :deep(.n-data-table-td:has(.modified-cell)) {
        background-color: var(--green-200) !important;
    }

    // 1. error (перебивает всё)
    :deep(.n-data-table-td:has(.error-cell)) {
        background-color: var(--red-100) !important;
    }

    &.virtual-scroll {
        :deep(.n-data-table-td) {
            height: var(--ai-cell-height);
        }

        :deep(.not-editable-mode) {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
    }
}
</style>
