import type { SelectOption } from 'naive-ui';
import type { Component } from 'vue';
import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import type { DataType } from '@/interfaces/common';

/**
 * Пропсы компонента FilterSelect.
 */
export interface FilterSelectProps {
    /** Заголовок */
    caption: string;
    /** Тип фильтра */
    filterType: DataType;
    /** Операция фильтрации */
    filterOperation: string;
    /** Состояние date-фильтра */
    dateFilterState?: DateFilterState;
}

/**
 * Эмиты компонента FilterSelect.
 */
export interface FilterSelectEmits {
    (e: 'update:value', value: string): void;
    (e: 'update:dateFilter', value: DateFilterState): void;
}

/**
 * Опция фильтра с иконкой.
 */
export interface FilterOption {
    icon: Component;
}

/**
 * Расширенная опция фильтра для Naive UI Popselect.
 */
export type ExtendedFilterOption = SelectOption & FilterOption;

/**
 * Фабрика опций фильтра по типу данных колонки.
 */
export type FilterOptionsFactory = (onUpdate: (value: string) => void) => ExtendedFilterOption[];
