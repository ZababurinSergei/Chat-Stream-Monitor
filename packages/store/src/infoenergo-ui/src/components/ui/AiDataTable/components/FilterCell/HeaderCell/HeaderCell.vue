<template>
    <div class="header-cell" @wheel.stop.prevent>
        <div
            class="header-cell__caption-row"
            :class="{
                'header-cell__column-header': dataField,
                'header-cell__column-header--drag-over': isDragOver,
            }"
            :draggable="true"
            @dragstart="onDragStart"
            @dragend="onDragEnd"
            @dragover.prevent
            @dragenter.prevent="onDragEnter"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
        >
            <span class="header-cell__caption-text">{{ caption }}</span>
        </div>
        <div class="header-cell__filter" @pointerdown.stop @click.stop>
            <FilterSelect
                ref="filterSelectRef"
                :caption="caption"
                :filter-operation="filterOperation"
                :filter-type="dataType"
                :date-filter-state="dateFilterState"
                @update:value="onFilterSelectUpdate"
                @update:date-filter="onDateFilterUpdate"
            />
            <FilterInput
                v-if="dataType !== 'date' && dataType !== 'datetime'"
                :model-value="filterInput"
                :data-type="dataType"
                :filter-operation="filterOperation"
                size="small"
                @update:model-value="onFilterInputUpdate"
            />
            <div
                v-else
                class="header-cell__date-summary"
                :title="dateFilterSummary"
                @click="filterSelectRef?.openDateFilter()"
            >
                {{ dateFilterSummary }}
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
    HeaderCellEmits,
    HeaderCellProps,
} from '@/components/ui/AiDataTable/components/FilterCell/HeaderCell/types';
import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/common';
import { getDateFilterSummary } from '@/composables/AiDataTable/filterOperations/applyDateFilter';
import { useColumnHeaderDrag } from '@/composables/AiDataTable/useColumnHeaderDrag';
import FilterSelect from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/FilterSelect.vue';
import FilterInput from '@/components/ui/AiDataTable/components/FilterCell/FilterInput/FilterInput.vue';

const props = defineProps<HeaderCellProps>();
const emit = defineEmits<HeaderCellEmits>();

const filterSelectRef = ref<InstanceType<typeof FilterSelect>>();

const { isDragOver, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDrop } = useColumnHeaderDrag(
    props.dataField,
    (fromDataField, toDataField) => emit('reorderColumns', fromDataField, toDataField)
);

const onFilterInputUpdate = (value: FilterInputValue) => {
    emit('update:filterInput', value, props.dataField ?? '');
};

const onFilterSelectUpdate = (filterOperation: string) => {
    emit('update:filterOperation', filterOperation, props.dataField ?? '');
};

const onDateFilterUpdate = (dateFilterState: HeaderCellProps['dateFilterState']) => {
    if (!dateFilterState) return;
    emit('update:dateFilter', dateFilterState, props.dataField ?? '');
};

const dateFilterSummary = computed(() => {
    const summary = props.dateFilterState ? getDateFilterSummary(props.dateFilterState) : '';
    return summary || 'Выберите фильтр';
});
</script>

<style scoped lang="scss">
.header-cell {
    &__caption-row {
        height: 50px;
        display: flex;
        padding: 5px 22px 5px 10px;
        align-items: center;
        flex: 1;
    }

    &__caption-text {
        flex: 1;
        min-width: 0;
        display: -webkit-box;
        line-height: 120%;
        line-clamp: 3;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        overflow-wrap: break-word;
    }

    &__filter {
        flex: 1;
        height: fit-content;
        display: flex;
        flex-direction: row;
        background: var(--white);
        border-top: 1px solid var(--light-gray-100);
    }

    &__date-summary {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        color: var(--gray-900);
        padding: 0 12px 0 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        cursor: pointer;
    }

    &__column-header {
        cursor: grab;
        user-select: none;

        &--drag-over {
            outline: 2px dashed var(--light-blue-900);
            outline-offset: -4px;
        }
    }
}
</style>
