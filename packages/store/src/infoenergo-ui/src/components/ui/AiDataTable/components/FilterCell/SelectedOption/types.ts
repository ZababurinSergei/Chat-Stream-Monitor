import type { Component } from 'vue';
import type { DataType } from '@/interfaces/common';

/**
 * Пропсы компонента SelectedOption (триггер Popselect).
 */
export interface SelectedOptionProps {
    /** Иконка текущей операции фильтра */
    icon: Component;
    /** Тип данных колонки */
    filterType: DataType;
}
