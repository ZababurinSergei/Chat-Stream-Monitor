import type { SelectOption } from 'naive-ui';
import type { Component } from 'vue';
import type { DataType } from '@/interfaces/common';

/**
 * Пропсы компонента FilterSelect.
 */
export interface FilterSelectProps {
    /** Тип фильтра */
    filterType: DataType;
    /** Операция фильтрации */
    filterOperation: string;
}

/**
 * Эмиты компонента FilterSelect.
 */
export interface FilterSelectEmits {
    (e: 'update:value', value: string): void;
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
