<template>
    <n-config-provider abstract :theme-overrides="themeOverrides">
        <n-popselect
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
    </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NPopselect, NConfigProvider } from 'naive-ui';
import type { ExtendedFilterOption, FilterSelectEmits, FilterSelectProps } from './types';
import { DEFAULT_FILTER_ICON, getFilterOptions } from '@/components/ui/AiDataTable/components/FilterCell/defaults';
import SelectedOption from '@/components/ui/AiDataTable/components/FilterCell/SelectedOption/SelectedOption.vue';
import { themeOverrides } from '@/styles/AiFilterSelect/AiFilterSelectStyles';

const props = defineProps<FilterSelectProps>();
const emit = defineEmits<FilterSelectEmits>();

const show = ref(false);

const options = computed<ExtendedFilterOption[]>(() => getFilterOptions(props.filterType, onSelectionChange));
const currentOption = computed<ExtendedFilterOption | undefined>(() =>
    getFilterOptions(props.filterType, onSelectionChange).find(option => option.value === props.filterOperation)
);

const onSelectionChange = (value: string) => {
    emit('update:value', value);
    show.value = false;
};
</script>

<style scoped lang="scss">
.filter-select {
    height: 100%;
}

.selected-option-icon {
    align-self: flex-start;
}
</style>
