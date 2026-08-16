import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateRange',
    standalone: true
})
export class DateRangePipe implements PipeTransform {
    transform(range: string): { start: Date; end: Date } {
        const end = new Date();
        let start = new Date();

        switch (range) {
            case 'сутки':
                start.setDate(start.getDate() - 1);
                break;
            case 'неделя':
                start.setDate(start.getDate() - 7);
                break;
            case 'месяц':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'год':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 1);
        }

        return { start, end };
    }
}