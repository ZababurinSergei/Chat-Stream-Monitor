import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeAgo',
    standalone: true
})
export class TimeAgoPipe implements PipeTransform {
    transform(value: Date | string): string {
        if (!value) return 'Не известно';

        const date = typeof value === 'string' ? new Date(value) : value;
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const intervals = [
            { label: 'год', seconds: 31536000 },
            { label: 'мес', seconds: 2592000 },
            { label: 'дн', seconds: 86400 },
            { label: 'ч', seconds: 3600 },
            { label: 'мин', seconds: 60 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                const label = this.getLabel(count, interval.label);
                return `${count} ${label} назад`;
            }
        }

        return seconds < 10 ? 'только что' : `${seconds} сек назад`;
    }

    private getLabel(count: number, baseLabel: string): string {
        const labels: Record<string, [string, string, string]> = {
            'год': ['год', 'года', 'лет'],
            'мес': ['мес', 'мес', 'мес'],
            'дн': ['день', 'дня', 'дней'],
            'ч': ['час', 'часа', 'часов'],
            'мин': ['минуту', 'минуты', 'минут']
        };

        const rules = labels[baseLabel];
        if (!rules) return baseLabel;

        if (count % 10 === 1 && count % 100 !== 11) return rules[0];
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return rules[1];
        return rules[2];
    }
}