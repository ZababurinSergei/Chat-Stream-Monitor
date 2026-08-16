import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'statusText',
    standalone: true
})
export class StatusTextPipe implements PipeTransform {
    transform(status: string): string {
        const statusMap: Record<string, string> = {
            'normal': 'Норма',
            'warning': 'Предупреждение',
            'emergency': 'Авария',
            'pending': 'Ожидание',
            'processing': 'В обработке',
            'completed': 'Завершено',
            'failed': 'Ошибка',
            'initializing': 'Инициализация',
            'calibrating': 'Калибровка',
            'maintenance': 'Обслуживание',
            'offline': 'Не в сети',
            'unknown': 'Неизвестно'
        };

        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }
}