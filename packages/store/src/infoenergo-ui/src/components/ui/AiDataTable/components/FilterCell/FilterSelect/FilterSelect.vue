<template>
    <n-popselect
        :theme-overrides="filterSelectThemeOverrides"
        v-if="filterType !== 'date' && filterType !== 'datetime'"
        v-model:show="show"
        :value="filterOperation"
        :options="options"
        placement="bottom-start"
        size="small"
        class="filter-select"
    >
        <SelectedOption
            class="selected-option-icon"
            :icon="currentOption?.icon ?? DEFAULT_FILTER_ICON"
            :filter-type="props.filterType"
        />
    </n-popselect>

    <DateFilter
        ref="dateFilterRef"
        :filter-type="filterType"
        :caption="caption"
        :picker-type="filterType"
        :model-value="dateFilterState"
        @apply="onDateFilterApply"
    />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NPopselect } from 'naive-ui';
import DateFilter from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/DateFilter.vue';
import type {
    ExtendedFilterOption,
    FilterSelectEmits,
    FilterSelectProps,
} from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/types';
import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import { DEFAULT_FILTER_ICON, getFilterOptions } from '@/components/ui/AiDataTable/components/FilterCell/defaults';
import SelectedOption from '@/components/ui/AiDataTable/components/FilterCell/SelectedOption/SelectedOption.vue';
import { filterSelectThemeOverrides } from '@/styles/AiHeaderCell/AiHeaderCellStyles';

const props = defineProps<FilterSelectProps>();
const emit = defineEmits<FilterSelectEmits>();

const show = ref(false);
const dateFilterRef = ref<InstanceType<typeof DateFilter>>();

const options = computed<ExtendedFilterOption[]>(() => getFilterOptions(props.filterType, onSelectionChange));
const currentOption = computed<ExtendedFilterOption | undefined>(() =>
    getFilterOptions(props.filterType, onSelectionChange).find(option => option.value === props.filterOperation)
);

const onSelectionChange = (value: string) => {
    emit('update:value', value);
    show.value = false;
};

const onDateFilterApply = (value: DateFilterState) => {
    emit('update:dateFilter', value);
};

defineExpose({
    openDateFilter: () => dateFilterRef.value?.open(),
});
</script>

<style scoped lang="scss">
.filter-select {
    height: 100%;
}

.selected-option-icon {
    color: var(--blue-700);
    align-self: flex-start;
}
</style>
