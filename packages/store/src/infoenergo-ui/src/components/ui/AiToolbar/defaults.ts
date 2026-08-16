import { h } from 'vue';
import type { DropdownOption } from 'naive-ui';
import type { DefaultToolbarId, DefaultToolbarItem } from '@/components/ui/AiToolbar/types';
import AiRefreshIcon from '@/components/icons/toolbar/AiRefreshIcon.vue';
import AiCopyIcon from '@/components/icons/toolbar/AiCopyIcon.vue';
import AiAddIcon from '@/components/icons/toolbar/AiAddIcon.vue';
import AiDeleteIcon from '@/components/icons/toolbar/AiDeleteIcon.vue';
import AiSaveIcon from '@/components/icons/toolbar/AiSaveIcon.vue';
import AiColumnChooserIcon from '@/components/icons/toolbar/AiColumnChooserIcon.vue';
import AiSettingIcon from '@/components/icons/toolbar/AiSettingIcon.vue';
import AiExportIcon from '@/components/icons/toolbar/AiExportIcon.vue';
import AiExportExcelIcon from '@/components/icons/toolbar/AiExportExcelIcon.vue';

/** Идентификаторы стандартных элементов тулбара в порядке отображения */
export const STATIC_ITEMS_NAMES: DefaultToolbarId[] = ['refresh', 'copy', 'add', 'delete', 'save', 'search', 'export'];

/** Опции экспорта для dropdown `export` */
export const EXPORT_OPTIONS: DropdownOption[] = [
    {
        key: 'export-excel',
        label: 'Экспортировать все в Excel',
        icon: () => h(AiExportExcelIcon),
    },
    {
        key: 'export-selected-excel',
        label: 'Экспортировать выбранные строки в Excel',
        icon: () => h(AiExportExcelIcon),
    },
];

/** Опции меню настроек таблицы для dropdown `settings` */
export const SETTINGS_DROPDOWN_OPTIONS: DropdownOption[] = [
    { key: 'show-grouping', label: 'Показать область группировки' },
    { key: 'auto-save', label: 'Автоматически сохранять настройки' },
    { key: 'save-settings', label: 'Сохранить настройки' },
    { key: 'reset-settings', label: 'Сбросить настройки' },
];

/** Конфигурация стандартных элементов тулбара*/
export const DEFAULT_ITEMS: Record<DefaultToolbarId, DefaultToolbarItem> = {
    refresh: {
        itemType: 'button',
        id: 'refresh',
        buttonType: 'icon',
        hint: 'Обновить',
        icon: AiRefreshIcon,
        canModifyData: false,
    },
    copy: {
        itemType: 'button',
        id: 'copy',
        buttonType: 'icon',
        hint: 'Создать копию сфокусированной строки',
        icon: AiCopyIcon,
        canModifyData: true,
    },
    add: {
        itemType: 'button',
        id: 'add',
        buttonType: 'icon',
        hint: 'Добавить строку',
        icon: AiAddIcon,
        canModifyData: true,
    },
    delete: {
        itemType: 'button',
        id: 'delete',
        buttonType: 'icon',
        hint: 'Удалить',
        icon: AiDeleteIcon,
        canModifyData: true,
    },
    save: {
        itemType: 'button',
        id: 'save',
        buttonType: 'icon',
        hint: 'Сохранить',
        icon: AiSaveIcon,
        canModifyData: true,
    },
    'column-chooser': {
        itemType: 'popselect',
        id: 'column-chooser',
        hint: 'Выбрать колонки',
        icon: AiColumnChooserIcon,
        multiple: true,
        canModifyData: false,
        trigger: 'click',
    },
    settings: {
        itemType: 'dropdown',
        id: 'settings',
        hint: 'Настройки таблицы',
        icon: AiSettingIcon,
        canModifyData: false,
        options: SETTINGS_DROPDOWN_OPTIONS,
        trigger: 'click',
    },
    export: {
        itemType: 'dropdown',
        id: 'export',
        hint: 'Экспорт',
        icon: AiExportIcon,
        canModifyData: false,
        options: EXPORT_OPTIONS,
        trigger: 'click',
    },
    search: {
        itemType: 'input',
        id: 'search',
        value: '',
        placeholder: 'Поиск...',
        canModifyData: false,
    },
};
