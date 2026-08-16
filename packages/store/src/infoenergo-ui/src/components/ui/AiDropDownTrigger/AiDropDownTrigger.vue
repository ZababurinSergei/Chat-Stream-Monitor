<template>
    <div
        :class="{ 'ai-dropdown-trigger--disabled': disabled }"
        :title="hint"
        class="ai-dropdown-trigger"
    >
        <component :is="icon" class="ai-dropdown-trigger__icon" />
        <AiDropDownArrow class="ai-dropdown-trigger__arrow" />
    </div>
</template>

<script lang="ts" setup>
import AiDropDownArrow from '@/components/icons/AiDropDownArrow.vue';
import type { AiDropDownTriggerProps } from '@/components/ui/AiDropDownTrigger/types';

defineProps<AiDropDownTriggerProps>();
</script>

<style scoped lang="scss">
.ai-dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 6px;
    cursor: pointer;

    &:hover {
        background-color: var(--light-gray-800);
        border-radius: 4px;
    }

    &__icon {
        width: 24px;
        height: 24px;
    }

    :deep(.ai-dropdown-trigger__icon .ai-icon__fg) {
        fill: var(--blue-700);
    }

    :deep(.ai-dropdown-trigger__icon .ai-icon__bg) {
        fill: var(--light-blue-100);
    }

    &--disabled {
        cursor: not-allowed;

        &:hover {
            background-color: transparent;
        }

        :deep(.ai-dropdown-trigger__icon .ai-icon__fg) {
            fill: var(--gray-700);
        }

        :deep(.ai-dropdown-trigger__arrow path) {
            fill: var(--gray-700);
        }
    }
}
</style>
