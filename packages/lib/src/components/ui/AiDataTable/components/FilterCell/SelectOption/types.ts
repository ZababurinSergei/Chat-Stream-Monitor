import type { Component } from 'vue';

/**
 * Пропсы компонента SelectOption (пункт меню фильтра).
 */
export interface SelectOptionProps {
    /** Лейбл */
    label: string;
    /** Значение */
    value: string;
    /** Иконка */
    icon: Component;
    /** Обработчик выбора опции */
    onUpdate: (value: string) => void;
}
