<template>
    <div v-if="item.kind === 'label'" class="date-filter__value-filter date-filter__value-filter--label">
        <template v-for="(part, index) in item.parts" :key="`label-text-${index}`">
            <div v-if="part.type === 'text'" :class="part.className">
                {{ part.content }}
            </div>
        </template>
    </div>

    <NCheckbox
        v-else
        :checked="isChecked"
        :style="item.checkboxStyle"
        :class="['date-filter__checkbox', `date-filter__checkbox--${item.operation}`]"
        @update:checked="checked => onChecked(checked)"
    >
        <div class="date-filter__value-filter">
            <template v-for="(part, index) in item.parts" :key="`checkbox-part-${index}`">
                <div v-if="part.type === 'text'" :class="part.className">
                    {{ part.content }}
                </div>

                <div
                    v-else
                    class="date-filter__picker"
                    :class="{ 'date-filter__picker--full': isFullWidthPicker(part.valueKey) }"
                    @click.stop
                    @mousedown.stop
                >
                    <NDatePicker
                        :value="state.values[part.valueKey] ?? null"
                        :type="pickerType"
                        size="small"
                        clearable
                        placeholder=""
                        @update:value="(value: number | null) => onDateValueChanged(value, part.valueKey)"
                    >
                        <template #date-icon>
                            <DatePickerArrow />
                        </template>
                    </NDatePicker>
                </div>
            </template>
        </div>
    </NCheckbox>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCheckbox, NDatePicker } from 'naive-ui';
import DatePickerArrow from '@/components/icons/DatePickerArrow.vue';
import type { DateFilterItemProps, DateFilterItemEmits } from './types';
import type { DateFilterValueKey } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import { resolveDateFilterChecked } from '@/composables/AiDataTable/filterOperations/filterDate.utils';

const props = defineProps<DateFilterItemProps>();
const emit = defineEmits<DateFilterItemEmits>();

const pickerType = computed(() => props.pickerType as 'date' | 'datetime');
const isChecked = computed(() => resolveDateFilterChecked(props.item.operation, props.state));

const FULL_WIDTH_PICKER_KEYS: DateFilterValueKey[] = ['equals', 'rangeTo', 'except'];
const isFullWidthPicker = (key: DateFilterValueKey) => FULL_WIDTH_PICKER_KEYS.includes(key);

const onChecked = (checked: boolean) => {
    if (props.item.operation === 'separator') return;
    emit('checkboxValueChanged', checked, props.item.operation);
};

const onDateValueChanged = (value: number | null, key: DateFilterValueKey) => {
    emit('datePickerValueChanged', value, key);
};
</script>

<style scoped lang="scss">
.date-filter {
    &__row__text {
        white-space: nowrap;
        flex-shrink: 0;
        padding: 0 4px 0 13px;
    }

    &__value-filter {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 3px;

        :deep(.n-input) {
            background: var(--light-blue-800) !important;
            border-radius: 5px;
        }

        :deep(.n-input-wrapper) {
            --n-padding-right: 6px;
            --n-padding-left: 6px;
        }

        :deep(.n-input__input-el) {
            font-size: 12px;
        }
    }

    &__picker {
        display: flex;
        flex: 1;

        &--full {
            flex: 1;
            width: auto;
            min-width: 0;
        }
    }

    &__checkbox {
        width: 100%;

        :deep(.n-checkbox__label) {
            display: flex;
            width: 100%;
        }

        :deep(.n-checkbox-box-wrapper) {
            align-self: center;
        }

        :deep(.n-date-picker) {
            width: 100%;
        }

        &--equals .date-filter__value-filter,
        &--except .date-filter__value-filter {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            column-gap: 3px;
        }

        &--range .date-filter__value-filter {
            display: grid;
            grid-template-columns: auto 104px auto minmax(0, 1fr);
            column-gap: 3px;
            justify-content: end;
        }
    }
}
</style>
