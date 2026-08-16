<template>
    <template v-if="customTemplate">
        <component :is="{ render: () => customTemplate?.(props) }" @[updateEvent]="handleInput" />
    </template>
    <template v-else>
        <div v-if="isFieldComponentVisible" class="editable-mode">
            <component
                :is="fieldComponent"
                ref="fieldRef"
                :[valueKey]="value"
                v-bind="mergedComponentProps"
                :disabled="isComponentDisabled"
                @blur="disableEditMode"
                @[updateEvent]="handleInput"
            />
        </div>

        <n-text v-else class="not-editable-mode" @click="enableEditMode">
            <template v-if="highlightedParts">
                <template v-for="(part, index) in highlightedParts" :key="index">
                    <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                    <template v-else>{{ part.text }}</template>
                </template>
            </template>
            <template v-else>{{ displayText }}</template>
        </n-text>
    </template>
</template>

<script setup lang="ts">
/**
 * Поле ячейки: в режиме просмотра — текст с переходом в редактирование по клику;
 * для `boolean` редактор показывается сразу. Компонент редактора подставляется
 * по `dataType` / `editor` через `useFieldComponent`. Наружу отдаёт `activeTriggerRef`
 * для позиционирования popover в родителе.
 */
import { ref, nextTick, computed } from 'vue';
import { NText } from 'naive-ui';
import type { InputInst } from 'naive-ui';
import type { AiComponentEmits } from '@/components/ui/AiField/types.ts';
import { useFieldComponent } from '@/composables/AiField/useFieldComponent';
import { getCellDisplayText } from '@/composables/AiDataTable/columnUtils.ts';
import { splitByHighlight } from '@/composables/AiDataTable/common.ts';
import { DEFAULT_DATA_TYPE } from '@/defaults/common.ts';
import type { DataFieldValue, AiComponentProps } from '@/interfaces/common.ts';

const fieldRef = ref<InputInst | null>(null);
const isEditableMode = ref(false);

const emit = defineEmits<AiComponentEmits>();
const props = withDefaults(defineProps<AiComponentProps>(), {
    dataType: DEFAULT_DATA_TYPE,
});

const value = computed(() => props.displayValue ?? props.value);
const displayText = computed(() => getCellDisplayText(value.value, props.dataType));
const highlightedParts = computed(() => splitByHighlight(displayText.value, props.searchTerm));
const isEditableField = computed(() => props.isEditable);
const isComponentDisabled = computed(() => props.dataType === 'boolean' && !isEditableField.value);
const isFieldComponentVisible = computed(
    () => (isEditableField.value && isEditableMode.value) || props.dataType === 'boolean'
);
const valueKey = computed<string>(() => propAliases.value?.valueKey ?? 'value');
const updateEvent = computed<string>(() => propAliases.value?.updateEvent ?? 'update:value');

const { fieldComponent, propAliases, mergedComponentProps } = useFieldComponent(
    props.dataType,
    props.editor,
    props.component
);

const disableEditMode = async () => {
    isEditableMode.value = false;
};

const enableEditMode = async () => {
    isEditableMode.value = true;
    await nextTick();
    fieldRef.value?.focus?.();
};

const normalizeValue = (value: DataFieldValue): DataFieldValue => {
    if (value === '') return null;
    return value;
};

const handleInput = (value: DataFieldValue, option?: any) => {
    const normalizedValue = normalizeValue(value);
    emit('update-value', normalizedValue);
    if (props.displayValue === undefined) return;

    const displayKey = props?.editor?.text ?? '';
    const displayValue = option?.[displayKey] ?? option;
    emit('update-display-value', displayValue);
};
</script>

<style scoped>
.not-editable-mode {
    display: -webkit-box;
    min-height: 23px;
    padding: 3px 7px 2px;

    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
}

.editable-mode {
    width: 100%;
    height: 100%;
}

.search-highlight {
    background-color: var(--blue-600);
    color: white;
    text-decoration: underline;
}
</style>
