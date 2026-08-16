import type { Component } from 'vue';

/** Пропсы триггера dropdown */
export interface AiDropDownTriggerProps {
    /** Иконка триггера */
    icon: Component;
    /** Текст подсказки */
    hint?: string;
    /** Флаг неактивного состояния */
    disabled?: boolean;
}
