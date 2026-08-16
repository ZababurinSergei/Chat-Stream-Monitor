<template>
    <n-input
        class="ai-toolbar-search"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        clearable
        :bordered="false"
        @update:value="handleInputUpdate"
    >
        <template #prefix>
            <SearchIcon class="search-icon" />
        </template>
    </n-input>
</template>

<script setup lang="ts">
import { NInput } from 'naive-ui';
import SearchIcon from '@/components/icons/filter/SearchIcon.vue';
import type { AiToolbarSearchInputEmits, AiToolbarSearchInputProps } from './types';

defineProps<AiToolbarSearchInputProps>();
const emit = defineEmits<AiToolbarSearchInputEmits>();

const handleInputUpdate = (value: string) => {
    emit('update:value', value);
};
</script>

<style scoped lang="scss">
.ai-toolbar-search {
    width: 200px;

    :deep(.n-input__border),
    :deep(.n-input__state-border) {
        border-radius: 4px;
    }
    :deep(.n-input__placeholder) {
        color: var(--gray-900) !important;
    }
    background-color: var(--light-blue-800) !important;
    .search-icon {
        color: var(--gray-900) !important;
    }
}
</style>
