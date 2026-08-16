import { describe, expect, it, vi } from 'vitest';
import { applyDateFilter } from './applyDateFilter';
import type { DateFilterState } from '@/components/ui/AiDataTable/components/FilterCell/FilterSelect/DateFilter/types';
import { createEmptyDateFilterState } from './filterDate.utils';

const withOperation = (mainOperation: DateFilterState['mainOperation']): DateFilterState => ({
    ...createEmptyDateFilterState(),
    mainOperation,
});

describe('applyDateFilter relative periods', () => {
    it('filters current month by calendar month from dd.MM.yyyy', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 17));

        const state = withOperation('currentMonth');

        expect(applyDateFilter('01.06.2026', state)).toBe(true);
        expect(applyDateFilter('17.06.2026, 12:30:00', state)).toBe(true);
        expect(applyDateFilter('01.05.2026', state)).toBe(false);
        expect(applyDateFilter('1.06.2026', state)).toBe(true);

        vi.useRealTimers();
    });

    it('filters previous month by calendar month from dd.MM.yyyy', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 17));

        const state = withOperation('previousMonth');

        expect(applyDateFilter('15.05.2026', state)).toBe(true);
        expect(applyDateFilter('01.06.2026', state)).toBe(false);

        vi.useRealTimers();
    });
});
