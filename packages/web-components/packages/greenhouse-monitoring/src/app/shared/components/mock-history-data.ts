import { StatusHistory } from '../models/greenhouse.model';

export const MOCK_HISTORY_DATA: StatusHistory[] = [
    {
        id: 1,
        greenhouseId: 1,
        status: 'normal',
        changedAt: new Date('2024-01-15T10:30:00'),
        comment: 'Регулярное плановое обновление',
        changedBy: 'Иванов А.И.'
    },
    {
        id: 2,
        greenhouseId: 1,
        status: 'warning',
        changedAt: new Date('2024-01-14T15:45:00'),
        comment: 'Повышенная температура в секторе B',
        changedBy: 'Петров С.К.'
    },
    {
        id: 3,
        greenhouseId: 1,
        status: 'emergency',
        changedAt: new Date('2024-01-13T08:20:00'),
        comment: 'Сбой системы полива',
        changedBy: 'Сидоров М.В.'
    },
    {
        id: 4,
        greenhouseId: 1,
        status: 'normal',
        changedAt: new Date('2024-01-12T14:10:00'),
        comment: 'Ремонт завершен, система работает нормально',
        changedBy: 'Иванов А.И.'
    },
    {
        id: 5,
        greenhouseId: 2,
        status: 'warning',
        changedAt: new Date('2024-01-15T09:15:00'),
        comment: 'Пониженная влажность',
        changedBy: 'Петров С.К.'
    },
    {
        id: 6,
        greenhouseId: 2,
        status: 'normal',
        changedAt: new Date('2024-01-14T11:30:00'),
        comment: 'Показатели в норме',
        changedBy: 'Сидоров М.В.'
    }
];