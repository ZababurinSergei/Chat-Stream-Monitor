export interface DateFilterProps {
    caption: string;
    filterType: string;
    pickerType: string;
    modelValue?: DateFilterState;
}

export interface DateFilterItemProps {
    item: DateFilterItemConfig;
    state: DateFilterState;
    pickerType: string;
}

export type DateFilterUiOperation = DateFilterToggleOperation | 'separator';

export type DateFilterPart =
    | { type: 'text'; content: string; className: string }
    | { type: 'picker'; valueKey: DateFilterValueKey };

export interface DateFilterItemConfig {
    id: string;
    rowId: string;
    kind: 'checkbox' | 'label';
    operation: DateFilterUiOperation;
    checkboxStyle?: string;
    parts: DateFilterPart[];
}

export interface DateFilterEmits {
    apply: [value: DateFilterState];
}

export interface DateFilterItemEmits {
    checkboxValueChanged: [checked: boolean, operation: DateFilterToggleOperation];
    datePickerValueChanged: [value: number | null, key: DateFilterValueKey];
}

/**
 * Основные взаимоисключающие операции date-фильтра.
 * `null` означает, что основная операция не выбрана.
 */
export type DateFilterMainOperation =
    | 'equals'
    | 'range'
    | 'outer'
    | 'except'
    | 'currentMonth'
    | 'previousMonth'
    | 'currentYear'
    | 'previousYear';

/**
 * Ключи значений для операций date-фильтра.
 */
export type DateFilterValueKey = 'equals' | 'rangeFrom' | 'rangeTo' | 'outerFrom' | 'outerTo' | 'except';

/**
 * Управляющие действия в UI date-фильтра.
 * `empty` может комбинироваться с любой основной операцией.
 */
export type DateFilterToggleOperation = DateFilterMainOperation | 'outerGreater' | 'outerLess' | 'empty';

/**
 * Карта выбранных значений date-фильтра.
 */
export interface DateFilterValues {
    equals: number | null;
    rangeFrom: number | null;
    rangeTo: number | null;
    outerGreater: boolean;
    outerLess: boolean;
    outerFrom: number | null;
    outerTo: number | null;
    except: number | null;
}

/**
 * Состояние date-фильтра для колонки.
 *
 * - `mainOperation` — основная (взаимоисключающая) операция.
 * - `includeEmpty` — флаг "включить пустые значения".
 * - `values` — значения и флаги для всех операций.
 */
export interface DateFilterState {
    mainOperation: DateFilterMainOperation | null;
    includeEmpty: boolean;
    values: DateFilterValues;
}

/**
 * Payload для изменения состояния date-фильтра из UI.
 */
export type DateFilterChangePayload =
    | {
          kind: 'toggleOperation';
          operation: DateFilterToggleOperation;
          checked: boolean;
      }
    | {
          kind: 'setValue';
          key: DateFilterValueKey;
          value: number | null;
      };
