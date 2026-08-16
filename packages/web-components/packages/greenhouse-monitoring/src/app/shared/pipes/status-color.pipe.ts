import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'statusColor',
    standalone: true
})
export class StatusColorPipe implements PipeTransform {
    transform(status: string): string {
        const colorMap: Record<string, string> = {
            'normal': '#4CAF50',
            'warning': '#FFC107',
            'emergency': '#F44336',
            'pending': '#9E9E9E',
            'processing': '#2196F3',
            'completed': '#4CAF50',
            'failed': '#F44336'
        };
        return colorMap[status] || '#9E9E9E';
    }
}