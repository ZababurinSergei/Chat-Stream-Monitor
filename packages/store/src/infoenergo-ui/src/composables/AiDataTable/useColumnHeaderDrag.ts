import { computed, ref } from 'vue';

/**
 * Drag-and-drop перестановка колонок в заголовке таблицы.
 *
 * @param dataField - Имя поля колонки
 * @param onReorderColumns - Колбэк перестановки колонок
 */
export const useColumnHeaderDrag = (
    dataField: string | undefined,
    onReorderColumns: (fromDataField: string, toDataField: string) => void
) => {
    const dragOverDataField = ref<string | null>(null);

    /** Нужна ли подсветка «drop-зоны» на текущей колонке */
    const isDragOver = computed(() => dragOverDataField.value === dataField);

    /** Сбрасывает подсветку целевой колонки */
    const resetDragOver = () => {
        dragOverDataField.value = null;
    };

    /**
     * Начало перетаскивания: сохраняет dataField источника в dataTransfer,
     * чтобы целевая колонка знала, что именно переносится.
     */
    const onDragStart = (event: DragEvent) => {
        if (!dataField) return;
        event.stopPropagation();
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.setData('text/plain', dataField);
    };

    /**
     * Конец перетаскивания (в т.ч. отмена): убирает подсветку,
     * если курсор ушёл без drop или drop произошёл вне колонки.
     */
    const onDragEnd = () => {
        resetDragOver();
    };

    /** Курсор вошёл в колонку — помечаем её как цель для drop */
    const onDragEnter = () => {
        if (dataField) dragOverDataField.value = dataField;
    };

    /**
     * Курсор покинул колонку: снимаем подсветку только при реальном выходе.
     * dragleave срабатывает и при переходе на дочерний элемент, поэтому
     * проверяем, что relatedTarget не внутри текущего заголовка.
     */
    const onDragLeave = (event: DragEvent) => {
        const element = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as Node | null;
        if ((!relatedTarget || !element.contains(relatedTarget)) && dragOverDataField.value === dataField) {
            resetDragOver();
        }
    };

    /**
     * Drop на колонку: снимает подсветку и вызывает перестановку,
     * если источник и цель — разные колонки.
     */
    const onDrop = (event: DragEvent) => {
        resetDragOver();
        if (!dataField) return;

        const fromDataField = event.dataTransfer?.getData('text/plain');
        if (fromDataField && fromDataField !== dataField) {
            onReorderColumns(fromDataField, dataField);
        }
    };

    return {
        isDragOver,
        onDragStart,
        onDragEnd,
        onDragEnter,
        onDragLeave,
        onDrop,
    };
};
