import type {
    DataTableProps,
    DataTableBaseColumn,
    DataTableSelectionColumn,
    DataTableColumnGroup,
    DataTableRowData,
} from 'naive-ui';
import type { ToolbarItem } from '@/components/ui/AiToolbar/types';
import type { Component, DataType, Editor, RowKey } from '@/interfaces/common.ts';

/** Поля для нашей бизнес-логики */
export interface UserOnlyColumn {
    /** Флаг для редактирования ячеек в колонке */
    allowEditing?: boolean;
    /** Название колонки */
    caption?: string;
    /** Компонент для отображения данных */
    component?: Component;
    /** Редактор для ячейки */
    editor?: Editor;
    /** Название поля в БД */
    dataField: string;
    /** Название поля для отображения */
    displayField?: string;
    /** Тип данных в колонке */
    dataType?: DataType;
    /** Дочерние колонки для таблиц с иерархическими колонками */
    children?: UserOnlyColumn[];
    /** Флаг видимости колонки */
    visible?: boolean;
    /** Флаг показа колонки в "выборе колонок" */
    showInColumnChooser?: boolean;
    /** Название слота для отображения в ячейке таблицы */
    cellTemplate?: string;
}

/** Базовая колонка */
export type BaseColumn = UserOnlyColumn & DataTableBaseColumn;

/** Колонка таблицы, которая совмещает в себе интерфейс нашей бизнес-логики и интерфейс DataTableSelectionColumn */
export interface SelectionColumn extends DataTableSelectionColumn {
    type: 'selection';
    visible: true;
}

/** Групповая колонка */
export interface GroupColumn extends DataTableColumnGroup {
    caption: string;
    dataField: string;
    visible: true;
}

/** Пустая колонка */
export interface EmptyColumn extends BaseColumn {
    key: 'empty';
    dataField: 'empty';
    visible: true;
}

/** Служебная колонка */
export type ServiceColumn = SelectionColumn | GroupColumn | EmptyColumn;

/** Колонка таблицы */
export type Column = BaseColumn | SelectionColumn | GroupColumn | EmptyColumn;

/** Сохранённая настройка колонки */
export interface TableColumnSettings {
    visibleIndex: number;
    dataField: string;
    width: number;
    visible: boolean;
}

/** Сохранённые настройки таблицы */
export interface TableSettings {
    autoSaveMode: boolean;
    groupPanelVisible: boolean;
    focusedRow: RowKey | null;
    columns: TableColumnSettings[];
}

/** Пропсы для компонента AiDataTable */
export interface TableProps {
    /** Высота ячейки */
    cellHeight?: number;
    /** Размер страницы */
    pageSize?: number;
    /** Название таблицы */
    title?: string;
    /** Флаг, показывающий, что в таблице находится в popover */
    isPopover?: boolean;
    /** Флаг для редактирования таблицы */
    isEditable?: boolean;
    /** Режим выбора (selection column) */
    selectionMode?: 'multiple' | 'single' | 'none';
    /** Название поля с ключом */
    keyExpr?: string;
    /** Название компонента */
    viewId?: string;
    /** Пропсы конкретно для NDataTable */
    config?: Partial<DataTableProps>;
    /** Эндпоинты для получения и сохранения данных */
    /** Массив с настройками колонок */
    columns: UserOnlyColumn[];
    /** Флаг для отображения футера */
    showFooter?: boolean;
    /** Массив с элементами тулбара */
    toolbarItems?: ToolbarItem[];
    /** Эндпоинты для получения и сохранения данных */
    api: {
        /** Получение данных */
        get: string;
        /** Сохранение данных */
        set?: string;
    };
}

export type DefaultTableProps = Required<
    Pick<TableProps, 'keyExpr' | 'isPopover' | 'isEditable' | 'selectionMode' | 'showFooter' | 'cellHeight'>
>;

/** Эмиты для компонента AiDataTable */
export interface TableEmits {
    'toolbar-action': [id: string, ...args: string[]];
    'row-click': [row: DataTableRowData];
    'row-doubleclick': [row: DataTableRowData];
    'create-filter': [];
}
