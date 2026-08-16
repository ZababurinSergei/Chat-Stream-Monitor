import AiDataTable from '@/components/ui/AiDataTable/AiDataTable.vue';
import AiEditIcon from '@/components/icons/toolbar/AiEditIcon.vue';

export default {
    title: 'Компоненты/AiDataTable (в разработке)',
    component: AiDataTable,
    args: {},
};

export const Default = {
    name: 'Основной пример',
    args: {
        isEditable: true,
        title: 'Основной пример таблицы',
        keyExpr: 'rowId',
        toolbarItems: [
            {
                itemType: 'button',
                id: 'refresh1',
                buttonType: 'icon',
                hint: 'Обновить',
                icon: AiEditIcon,
                canModifyData: false,
            },
        ],
        api: {
            get: 'api/table/data/get',
        },
        columns: [
            {
                caption: 'Проверка переноса текста',
                dataField: 'name',
                config: { type: 'textarea' },
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
            {
                caption: 'Селектор',
                dataField: 'selectorId',
                displayField: 'selectorText',
                editor: {
                    type: 'selector',
                    api: 'api/table/selector/data/get',
                    id: 'id',
                    text: 'text',
                },
            },
            {
                caption: 'Поповер',
                dataField: 'popoverId',
                displayField: 'popoverText',
                editor: {
                    type: 'popover',
                },
                component: {
                    name: 'OneColumnTable',
                    id: 'id',
                    text: 'text',
                },
            },
            {
                caption: 'Модалка',
                dataField: 'modalId',
                displayField: 'modalText',
                editor: {
                    type: 'modal',
                    config: {
                        title: 'Модальное окно',
                    },
                },
                component: {
                    name: 'OneColumnTable',
                    id: 'id',
                    text: 'text',
                },
            },
        ],
    },
};

export const VirtualScroll = {
    name: 'Таблица с подкачкой данных по скроллу',
    args: {
        isEditable: true,
        pageSize: 100,
        cellHeight: 50,
        title: 'Таблица с подкачкой данных по скроллу',
        api: {
            get: 'api/table/virtual/data/get',
        },
        columns: [
            {
                caption: '№ страницы - № записи',
                dataField: 'id',
                allowEditing: false,
            },
            {
                caption: 'Строка',
                dataField: 'name',
            },
            {
                caption: 'Число',
                dataField: 'value',
                dataType: 'number',
            },
        ],
    },
};

export const ParentAndChildColumns = {
    name: 'Родительские и дочерние колонки',
    args: {
        isEditable: true,
        keyExpr: 'rowId',
        title: 'Родительские и дочерние колонки',
        api: {
            get: 'api/table/data/get',
        },
        columns: [
            {
                caption: 'Parent 1',
                dataField: 'Parent 1',
                children: [
                    {
                        caption: 'Child 1.1',
                        dataField: 'name',
                    },
                    {
                        caption: 'Child 1.2',
                        dataField: 'age',
                        dataType: 'number',
                    },
                    {
                        dataField: 'Child 1.3 и Parent 2',
                        caption: 'Child 1.3 и Parent 2',
                        children: [
                            {
                                caption: 'Child 2.1',
                                dataField: 'isActive',
                                dataType: 'boolean',
                            },
                            {
                                caption: 'Child 2.2',
                                dataField: 'date',
                                dataType: 'date',
                            },
                            {
                                caption: 'Child 2.3',
                                dataField: 'dateAndTime',
                                dataType: 'datetime',
                            },
                        ],
                    },
                ],
            },
        ],
    },
};
