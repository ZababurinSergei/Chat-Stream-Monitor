/** Пропсы глобального поиска */
export interface AiToolbarSearchInputProps {
    value: string;
    placeholder?: string;
    disabled?: boolean;
}

/** Эмиты глобального поиска */
export interface AiToolbarSearchInputEmits {
    'update:value': [value: string];
}

