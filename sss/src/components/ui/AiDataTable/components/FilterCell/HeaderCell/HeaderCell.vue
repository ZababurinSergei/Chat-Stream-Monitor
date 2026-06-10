<template>
    <n-config-provider abstract :theme-overrides="themeOverrides">
        <div class="header-cell" @wheel.stop.prevent>
            <div class="header-cell__caption-row">
                <span class="header-cell__caption-text">{{ caption }}</span>
            </div>
            <div class="header-cell__filter" @pointerdown.stop @click.stop>
                <FilterSelect
                    :filter-operation="filterOperation"
                    :filter-type="dataType"
                    @update:value="onFilterSelectUpdate"
                />
                <FilterInput
                    :model-value="filterInput"
                    :data-type="dataType"
                    :filter-operation="filterOperation"
                    @update:model-value="onFilterInputUpdate"
                />
            </div>
        </div>
    </n-config-provider>
</template>
<script setup lang="ts">
import type {
    HeaderCellEmits,
    HeaderCellProps,
} from '@/components/ui/AiDataTable/components/FilterCell/HeaderCell/types';
import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/filterInput.utils';
import { themeOverrides } from '@/styles/AiHeaderCell/AiHeaderCellStyles';
import FilterSelect from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/FilterSelect.vue';
import FilterInput from '@/components/ui/AiDataTable/components/FilterCell/FilterInput/FilterInput.vue';

const props = defineProps<HeaderCellProps>();
const emit = defineEmits<HeaderCellEmits>();

const onFilterInputUpdate = (value: FilterInputValue) => {
    emit('update:filterInput', value, props.dataField ?? '');
};

const onFilterSelectUpdate = (filterOperation: string) => {
    emit('update:filterOperation', filterOperation, props.dataField ?? '');
};
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
}
</style>
