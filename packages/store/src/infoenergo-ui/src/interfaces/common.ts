import type { Ref, Slot } from 'vue';
import type { PopoverProps, SelectProps, DataTableRowData } from 'naive-ui';
import type { AiModalProps } from '@/components/ui/AiModal/types.ts';

type DataFieldScalar = string | number | boolean | Date | null;
/** Значение поля в строке (`dataField`) */
export type DataFieldValue = DataFieldScalar | DataFieldScalar[] | null;

type DataFieldDisplayScalar = string | number | null;
/** Отображаемое значение при отдельном `displayField` в колонке */
export type DataFieldDisplayValue = DataFieldDisplayScalar | DataFieldDisplayScalar[];

/** Ключ строки */
export type RowKey = number | string;

/** Тип данных в ячейке таблицы */
export type DataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean';

/** Тип редактора в ячейке таблицы */
export type EditorType = 'selector' | 'popover' | 'modal';

/** Тип ячейки таблицы */
export type FieldType = DataType | EditorType;

/** Пропсы для редактора в ячейке таблицы */
export interface EditorDefaultConfig {
    /** Событие для выбора строки (количество значений будет увеличиваться в будущем) */
    selectEvent?: string;
    /** Ширина модалки */
    width?: string;
    /** Высота модалки */
    height?: string;
}

/** Пропсы для редактора */
type EditorConfig = EditorDefaultConfig & (Partial<SelectProps> | Partial<PopoverProps> | Partial<AiModalProps>);

/** Редактор таблицы */
export interface Editor {
    type: EditorType;
    api?: string;
    id?: string;
    text?: string;
    config?: EditorConfig;
}

/** Компонент для отображения данных в ячейке таблицы
 *
 *  @todo Доработать набор полей
 */
export interface Component {
    name: string;
    id: string;
    text: string;
}

/**
 * Контракт поля в ячейке таблицы: значение(я), тип, опциональный редактор/компонент
 * и колбэки для подъёма изменений в строку данных таблицы.
 */
export interface AiComponentProps {
    /** Является ли поле редактируемым */
    isEditable: boolean;
    /** Значение поля в строке (`dataField`) */
    value: DataFieldValue;
    /** Отображаемое значение при отдельном `displayField` в колонке */
    displayValue?: DataFieldDisplayValue;
    /** Тип данных для выбора дефолтного редактора */
    dataType?: DataType;
    /** Пользовательский компонент из метаданных колонки */
    component?: Component;
    /** Редактор-обёртка (selector/popover) поверх базового типа */
    editor?: Editor;
    /** Пользовательский компонент для отображения в ячейке таблицы */
    customTemplate?: Slot<{ value: DataFieldValue; displayValue?: DataFieldDisplayValue }>;
    /** Искомая подстрока для подсветки совпадений в режиме просмотра */
    searchTerm?: string;
    /** Сообщить родителю новое значение поля данных */
    onUpdateValue: (value: DataFieldValue) => void;
    /** Сообщить родителю новое отображаемое значение, если задан `displayField` */
    onUpdateDisplayValue: (displayValue: DataFieldDisplayValue) => void;
}

/** Ответ от API */
export interface Response {
    success: boolean;
}

/** Ответ от API для обычной таблицы */
export interface GetDefaultTableResponse extends Response {
    success: true;
    data: DataTableRowData[];
    totalCount?: never;
}

/** Ответ от API для таблицы с виртуальным скроллом */
export interface GetVirtualScrollTableResponse {
    result: true;
    data: DataTableRowData[];
    totalCount: number;
}

/** Ответ от API для сохранения данных */
export interface SetTableResponse extends Response {
    success: true;
}

/** Ответ от API с ошибкой */
export interface ErrorResponse {
    result: false;
    error?: string;
}

/** Функция для получения данных для обычной таблицы */
export type ApiGetDefaultTable = (args?: any) => Promise<GetDefaultTableResponse | ErrorResponse>;
/** Функция для получения данных для таблицы с виртуальным скроллом */
export type ApiGetVirtualScrollTable = (
    skip: number,
    take: number
) => Promise<GetVirtualScrollTableResponse | ErrorResponse>;

/** Функции для виртуального скролла */
export interface VirtualScrollTools {
    /** Флаг загрузки страницы */
    isPageLoading: Readonly<Ref<boolean>>;
    /** Получить страницу */
    getData: (skip: number, take: number, nextPage: boolean) => Promise<GetVirtualScrollTableResponse | ErrorResponse>;
    /** Получить длину данных */
    getDataLength: () => number;
    /** Удалить данные сверху */
    removeDataFromTop: (pageSize: number) => void;
    /** Удалить данные снизу */
    removeDataFromBottom: (pageSize: number) => void;
}
