<template>
    <div class="ai-toolbar">
        <p class="ai-toolbar__title">{{ title }}</p>
        <div class="ai-toolbar__item">
            <span v-for="item in items" :key="item.id" class="item__item">
                <AiButton
                    v-if="item.itemType === 'button'"
                    :disabled="isButtonDisabled(item.id)"
                    :icon="item.icon"
                    :button-type="item.buttonType"
                    :hint="item.hint"
                    @click="handleButtonClick(item.id)"
                />
                <n-popselect
                    v-else-if="item.itemType === 'popselect'"
                    :value="item.value"
                    :trigger="item.trigger"
                    :options="item.options"
                    :multiple="item.multiple"
                    @update:value="handleUpdateColumnChooserValue"
                >
                    <AiButton :disabled="isItemDisabled()" button-type="icon" :icon="item.icon" :hint="item.hint" />
                </n-popselect>
                <n-dropdown
                    v-else-if="item.itemType === 'dropdown'"
                    :disabled="isItemDisabled()"
                    :options="item.options"
                    :trigger="item.trigger"
                    @select="optionKey => handleDropdownClick(item.id, optionKey)"
                >
                    <AiDropDownTrigger :disabled="isItemDisabled()" :hint="item.hint" :icon="item.icon" />
                </n-dropdown>
                <AiToolbarSearchInput
                    v-else-if="item.itemType === 'input'"
                    :value="item.value"
                    :placeholder="item.placeholder"
                    :disabled="isItemDisabled()"
                    @update:value="value => handleInputChange(item.id, value)"
                />
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { NDropdown, NPopselect } from 'naive-ui';
import AiButton from '@/components/ui/AiButton/AiButton.vue';
import AiDropDownTrigger from '@/components/ui/AiDropDownTrigger/AiDropDownTrigger.vue';
import AiToolbarSearchInput from '@/components/ui/AiToolbar/search/AiToolbarSearchInput.vue';
import type { AiToolbarEmits, AiToolbarProps } from '@/components/ui/AiToolbar/types';
import { useToolbarConfig } from '@/composables/AiToolbar/useToolbarConfig';

const props = defineProps<AiToolbarProps>();
const emit = defineEmits<AiToolbarEmits>();

const handleDropdownClick = (id: string, optionKey: string | number) => {
    emit('dropdown-click', id, String(optionKey));
};

const { items } = useToolbarConfig(
    props.columnChooser,
    props.isEditable,
    props.userToolbarItems,
    props.tableToolbarSettings,
    handleDropdownClick,
    () => props.searchValue
);

const handleButtonClick = (id: string) => {
    emit('button-click', id);
};

const handleUpdateColumnChooserValue = (visibleColumns: string[]) => {
    emit('column-chooser-change', visibleColumns);
};

const handleInputChange = (id: string, value: string) => {
    emit('input-change', id, value);
};


const isItemDisabled = () => !!props.disabled;

const isButtonDisabled = (id: string) => {
    if (isItemDisabled()) return true;
    if (id === 'delete') return props.countSelectedRows === 0;
    if (id === 'copy') return !props.hasFocusedRow;
    if (id === 'save') return !props.isDataModified;
    return false;
};
</script>

<style scoped lang="scss">
.ai-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--light-gray-800);
    border-bottom: none;
    padding: 2px 10px;

    &__title {
        margin: 0;
        font-size: 20px;
        font-weight: 400;
    }

    &__item {
        display: flex;
        gap: 10px;
    }
}

.item {
    &__item {
        display: flex;
        gap: 10px;
        justify-content: center;
    }
}
</style>
