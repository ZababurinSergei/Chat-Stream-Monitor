import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatValue',
    standalone: true
})
export class FormatValuePipe implements PipeTransform {
    transform(value: number, type: string): string {
        switch (type) {
            case 'temperature':
                return `${value.toFixed(1)}°C`;
            case 'humidity':
                return `${value.toFixed(0)}%`;
            case 'acidity':
                return value.toFixed(2);
            default:
                return value.toString();
        }
    }
}