<template>
    <AiDataTable
        isPopover
        :showFooter="false"
        selectionMode="none"
        :api="{ get: 'api/table/popover/data/get' }"
        :columns="[{ caption: 'Текст (string)', dataField: 'text' }]"
    />
</template>

<script setup lang="ts">
import AiDataTable from '@/components/ui/AiDataTable/AiDataTable.vue';
</script>
