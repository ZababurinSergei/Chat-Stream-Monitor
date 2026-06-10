<template>
    <n-input
        v-if="dataType !== 'boolean' && dataType !== 'date'"
        class="filter-input"
        separator="—"
        :pair="isRangeFilter"
        :placeholder="isRangeFilter ? ['от', 'до'] : ''"
        :value="modelValue"
        :allow-input="allowInput"
        :input-props="inputProps"
        :bordered="false"
        @input="onFilterInputUpdate"
    >
        <template #suffix>
            <div class="filter-input__input-suffix">
                <AiCrossIcon v-if="modelValue" class="filter-input__cross-icon" @click="onFilterInputClear" />
            </div>
        </template>
    </n-input>

    <n-date-picker
        v-if="dataType === 'date'"
        class="filter-input"
        :formatted-value="dateValue"
        type="date"
        format="dd.MM.yyyy"
        value-format="dd.MM.yyyy"
        clearable
        :bordered="false"
        @update:formatted-value="onFilterInputUpdate"
    />
</template>
<script setup lang="ts">
import { NInput, NDatePicker } from 'naive-ui';
import AiCrossIcon from '@/components/icons/AiCrossIcon.vue';
import { computed } from 'vue';
import type { FilterInputProps, FilterInputEmits } from './types';
import type { FilterInputValue } from '@/composables/AiDataTable/filterOperations/filterInput.utils';
const allowNumberInput = (value: string) => /^-?\d*([.,]\d*)?$/.test(value);
const props = defineProps<FilterInputProps>();
const emit = defineEmits<FilterInputEmits>();
const isRangeFilter = computed(() => {
    return props.filterOperation === 'inRange';
});
const dateValue = computed(() =>
    typeof props.modelValue === 'string' && props.modelValue !== '' ? props.modelValue : null
);

const allowInput = computed(() => (props.dataType === 'number' ? allowNumberInput : undefined));
const inputProps = computed(() => (props.dataType === 'number' ? { inputmode: 'decimal' as const } : undefined));

const onFilterInputUpdate = (value: FilterInputValue) => {
    emit('update:modelValue', value);
};

const onFilterInputClear = () => {
    emit('update:modelValue', '');
};
</script>
<style scoped lang="scss">
.filter-input {
    flex: 1;
    min-width: 0;

    &__input-suffix {
        display: flex;
        justify-content: center;
        align-items: center;
        padding-right: 5px;
        height: 100%;
        width: 10px;
        cursor: pointer;
    }

    &__cross-icon {
        color: var(--gray-800);
        &:hover {
            color: var(--dark-700);
        }
    }
}
</style>
