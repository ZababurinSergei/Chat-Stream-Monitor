import type { Component } from 'vue';
import type { DropdownOption, PopoverTrigger, PopselectProps } from 'naive-ui';
import type { AiButtonProps } from '@/components/ui/AiButton/types';
import type { TableToolbarSettings } from '@/components/ui/AiToolbar/settings/types';

/** Типы элементов тулбара */
export type ToolbarItemType = 'button' | 'popselect' | 'dropdown' | 'input';

/** Идентификаторы дефолтных элементов тулбара */
export type DefaultToolbarId =
    | 'refresh'
    | 'add'
    | 'delete'
    | 'copy'
    | 'save'
    | 'column-chooser'
    | 'export'
    | 'settings'
    | 'search';

/** Основа для элемента тулбара */
export interface ToolbarItemBase {
    itemType: ToolbarItemType;
    id: string;
    /** Флаг, показывающий модифицирует ли элемент данные */
    canModifyData: boolean;
}

/** Кнопка тулбара */
type ToolbarButton = ToolbarItemBase & AiButtonProps & { itemType: 'button' };

/** Дефолтная кнопка тулбара */
export type DefaultToolbarButton = ToolbarButton & { id: DefaultToolbarId };

/** Инпут тулбара */
type ToolbarInput = ToolbarItemBase & { itemType: 'input'; value: string; placeholder?: string };
export type DefaultToolbarInput = ToolbarInput & { id: DefaultToolbarId };

type ToolbarPopselect = ToolbarItemBase & PopselectProps & { itemType: 'popselect'; icon: Component; hint: string };

export type DefaultToolbarPopselect = ToolbarPopselect & { id: DefaultToolbarId };

type ToolbarDropdown = ToolbarItemBase & {
    itemType: 'dropdown';
    icon: Component;
    hint: string;
    options: DropdownOption[];
    trigger: Exclude<PopoverTrigger, 'focus'>;
};

export type DefaultToolbarDropdown = ToolbarDropdown & { id: DefaultToolbarId };

/** Дефолтный элемент тулбара */
export type DefaultToolbarItem =
    | DefaultToolbarButton
    | DefaultToolbarPopselect
    | DefaultToolbarDropdown
    | DefaultToolbarInput;

/** Элемент тулбара */
export type ToolbarItem = DefaultToolbarItem;

export type ColumnChooser = {
    options: { value: string; label: string }[];
    value: string[];
};

/** Пропсы тулбара */
export interface AiToolbarProps {
    /** Флаг для редактирования таблицы */
    isEditable: boolean;
    /** Название таблицы */
    title?: string;
    /** Количество выделенных строк */
    countSelectedRows: number;
    /** Флаг наличия сфокусированной строки */
    hasFocusedRow: boolean;
    /** Флаг дизайбла всех элементов тулбара */
    disabled: boolean;
    /** Значения для выбора колонок */
    columnChooser: ColumnChooser;
    /** Флаг наличия изменений в данных */
    isDataModified: boolean;
    /** Состояние настроек таблицы для меню settings */
    tableToolbarSettings: TableToolbarSettings;
    /** Текущее значение поиска */
    searchValue: string;
    /** Массив с элементами тулбара */
    userToolbarItems?: ToolbarItem[];
}

/** События тулбара */
export interface AiToolbarEmits {
    /** Событие клика по кнопке тулбара */
    'button-click': [id: string];
    /** Событие выбора пункта в dropdown тулбара */
    'dropdown-click': [id: string, optionKey: string];
    /** Событие изменения видимости колонок */
    'column-chooser-change': [value: string[]];
    /** Событие изменения значения инпута тулбара */
    'input-change': [id: string, value: string];
}
