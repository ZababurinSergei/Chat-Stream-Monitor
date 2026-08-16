<template>
    <n-config-provider abstract :locale="ruRU" :date-locale="dateRuRU">
        <n-popover
            v-if="filterType === 'date' || filterType === 'datetime'"
            v-model:show="show"
            trigger="click"
            placement="bottom-start"
        >
            <template #trigger>
                <div class="date-filter__icon">
                    <SearchIcon />
                </div>
            </template>

            <div class="date-filter__content">
                <div class="date-filter__operations">
                    <div
                        v-for="row in groupedRows"
                        :key="row.id"
                        class="date-filter__row"
                        :class="{ 'date-filter__row--outer': row.id === 'outer-row' }"
                    >
                        <DateFilterItem
                            v-for="item in row.items"
                            :key="item.id"
                            :item="item"
                            :state="draftState"
                            :picker-type="props.pickerType"
                            @checkbox-value-changed="onCheckboxValueChanged"
                            @date-picker-value-changed="onDatePickerValueChanged"
                        />
                    </div>
                </div>

                <div class="date-filter__clear-button">
                    <AiButton
                        button-type="tertiary"
                        width="150px"
                        height="24px"
                        text="Очистить фильтр"
                        @click="onClearClick"
                    />
                </div>

                <div class="date-filter__buttons">
                    <AiButton
                        button-type="primary"
                        width="110px"
                        height="24px"
                        text="Применить"
                        @click="onApplyClick"
                    />
                    <AiButton
                        button-type="secondary"
                        width="110px"
                        height="24px"
                        text="Отмена"
                        @click="onCancelClick"
                    />
                </div>
            </div>
        </n-popover>
    </n-config-provider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NPopover } from 'naive-ui';
import { dateRuRU, ruRU } from 'naive-ui/lib/locales';
import SearchIcon from '@/components/icons/filter/SearchIcon.vue';
import AiButton from '@/components/ui/AiButton/AiButton.vue';
import type {
    DateFilterItemConfig,
    DateFilterEmits,
    DateFilterProps,
    DateFilterState,
    DateFilterToggleOperation,
    DateFilterValueKey,
} from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import {
    cloneDateFilterState,
    createEmptyDateFilterState,
    handleDateFilterChange,
} from '@/composables/AiDataTable/filterOperations/filterDate.utils';
import { DATE_FILTER_ITEMS } from './defaults';
import DateFilterItem from './DateFilterItem.vue';

const props = defineProps<DateFilterProps>();
const emit = defineEmits<DateFilterEmits>();

const show = ref(false);
const draftState = ref<DateFilterState>(cloneDateFilterState(props.modelValue ?? createEmptyDateFilterState()));

const groupedRows = computed(() => {
    const map = new Map<string, DateFilterItemConfig[]>();

    for (const item of DATE_FILTER_ITEMS) {
        const row = map.get(item.rowId) ?? [];
        row.push(item);
        map.set(item.rowId, row);
    }

    return Array.from(map.entries()).map(([id, items]) => ({ id, items }));
});

const onCheckboxValueChanged = (checked: boolean, operation: DateFilterToggleOperation) => {
    draftState.value = handleDateFilterChange(draftState.value, {
        kind: 'toggleOperation',
        operation,
        checked,
    });
};

const onDatePickerValueChanged = (value: number | null, key: DateFilterValueKey) => {
    draftState.value = handleDateFilterChange(draftState.value, {
        kind: 'setValue',
        key,
        value,
    });
};

const onApplyClick = () => {
    emit('apply', cloneDateFilterState(draftState.value));
    show.value = false;
};

const onClearClick = () => {
    const emptyState = createEmptyDateFilterState();
    draftState.value = emptyState;
    emit('apply', emptyState);
    show.value = false;
};

const onCancelClick = () => {
    draftState.value = cloneDateFilterState(props.modelValue ?? createEmptyDateFilterState());
    show.value = false;
};

defineExpose({
    open: () => {
        show.value = true;
    },
});
</script>
<style scoped lang="scss">
.date-filter {
    &__icon {
        color: var(--blue-700);
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: var(--light-gray-100);
        }
    }

    &__content {
        width: 310px;
        display: flex;
        flex-direction: column;
        padding: 8px;
        border-radius: 8px;
    }

    &__operations {
        width: 100%;
    }

    &__row {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        padding-top: 6px;
        gap: 4px;
    }

    &__row--outer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        column-gap: 4px;
    }

    &__clear-button {
        padding-top: 10px;
        padding-bottom: 8px;
    }

    &__buttons {
        display: flex;
        margin-top: auto;
        justify-content: flex-end;
        width: 100%;
        gap: 5px;
    }
}
</style>
