import { describe, it, expect } from 'vitest';
import { useChangesTracker } from '@/composables/AiDataTable/useChangesTracker.ts';

describe('useChangesTracker', () => {
    it('trackInsert помечает строку как новую и как модифицированную', () => {
        const { trackInsert, isNewRow, isModified, getInsertedRowKeys, isDirty, newRows } = useChangesTracker();
        const rowData = { id: 'new-1', name: null, isNewRow: true };

        trackInsert('new-1', rowData);

        expect(isNewRow('new-1')).toBe(true);
        expect(newRows.get('new-1')).toEqual(rowData);
        expect(isModified('new-1', 'anyField')).toBe(true);
        expect(getInsertedRowKeys()).toEqual(['new-1']);
        expect(isDirty.value).toBe(true);
    });

    it('trackUpdate сохраняет оригинальное значение и сбрасывает изменение при откате', () => {
        const { trackUpdate, isModified, getUpdatedRowKeys, isDirty } = useChangesTracker();

        trackUpdate(1, 'name', 'old', 'new');
        expect(isModified(1, 'name')).toBe(true);
        expect(getUpdatedRowKeys()).toEqual([1]);
        expect(isDirty.value).toBe(true);

        trackUpdate(1, 'name', 'old', 'old');
        expect(isModified(1, 'name')).toBe(false);
        expect(getUpdatedRowKeys()).toEqual([]);
        expect(isDirty.value).toBe(false);
    });

    it('trackDelete удаляет ключи из новых и измененных', () => {
        const { trackInsert, trackUpdate, trackDelete, getInsertedRowKeys, getUpdatedRowKeys } = useChangesTracker();
        trackInsert('n1', { id: 'n1' });
        trackUpdate(2, 'value', 1, 2);

        trackDelete(['n1', 2]);

        expect(getInsertedRowKeys()).toEqual([]);
        expect(getUpdatedRowKeys()).toEqual([]);
    });

    it('resetChanges полностью очищает состояние', () => {
        const { trackInsert, trackUpdate, resetChanges, isDirty, getInsertedRowKeys, getUpdatedRowKeys } = useChangesTracker();
        trackInsert(123, { id: 123 });
        trackUpdate(1, 'name', 'a', 'b');

        resetChanges();

        expect(isDirty.value).toBe(false);
        expect(getInsertedRowKeys()).toEqual([]);
        expect(getUpdatedRowKeys()).toEqual([]);
    });
});
