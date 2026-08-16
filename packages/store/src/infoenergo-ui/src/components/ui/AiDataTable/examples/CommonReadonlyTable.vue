<template>
    <AiDataTable
        :isEditable="false"
        keyExpr="rowId"
        selectionMode="none"
        :api="{ get: 'api/table/data/get' }"
        :columns="columns"
    />
</template>

<script setup lang="ts">
import AiDataTable from '@/components/ui/AiDataTable/AiDataTable.vue';
import type { UserOnlyColumn } from '@/components/ui/AiDataTable/types';

const columns: UserOnlyColumn[] = [
    {
        caption: 'string',
        dataField: 'name',
    },
    {
        caption: 'number',
        dataField: 'age',
        dataType: 'number',
    },
    {
        caption: 'boolean',
        dataField: 'isActive',
        dataType: 'boolean',
    },
    {
        caption: 'date',
        dataField: 'date',
        dataType: 'date',
    },
    {
        caption: 'datetime',
        dataField: 'dateAndTime',
        dataType: 'datetime',
    },
];
</script>
