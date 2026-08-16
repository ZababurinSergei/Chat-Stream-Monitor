import { Directive, Input, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Directive({
  selector: '[appTimeAgo]',
  standalone: true
})
export class TimeAgoDirective implements OnInit, OnDestroy {
  @Input() appTimeAgo!: Date;

  private intervalSubscription: Subscription | null = null;
  private readonly timeUnits = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    if (!this.appTimeAgo) {
      this.el.nativeElement.textContent = 'время не указано';
      return;
    }

    this.updateTime();
    // Обновляем каждую минуту
    this.intervalSubscription = interval(60000).subscribe(() => {
      this.updateTime();
    });
  }

  ngOnDestroy() {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
  }

  private updateTime() {
    const now = new Date();
    const time = new Date(this.appTimeAgo);

    // Проверка на будущее время
    if (time > now) {
      this.el.nativeElement.textContent = 'в будущем';
      return;
    }

    const seconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (seconds < 0) {
      this.el.nativeElement.textContent = 'ошибка времени';
      return;
    }

    if (seconds < 10) {
      this.el.nativeElement.textContent = 'только что';
      return;
    }

    if (seconds < 60) {
      this.el.nativeElement.textContent = `${seconds} секунд назад`;
      return;
    }

    for (const { unit, seconds: unitSeconds } of this.timeUnits) {
      const interval = Math.floor(seconds / unitSeconds);
      if (interval >= 1) {
        const unitName = this.getUnitName(unit, interval);
        this.el.nativeElement.textContent = `${interval} ${unitName} назад`;
        return;
      }
    }

    this.el.nativeElement.textContent = 'только что';
  }

  private getUnitName(unit: string, count: number): string {
    const units: Record<string, [string, string, string]> = {
      year: ['год', 'года', 'лет'],
      month: ['месяц', 'месяца', 'месяцев'],
      week: ['неделя', 'недели', 'недель'],
      day: ['день', 'дня', 'дней'],
      hour: ['час', 'часа', 'часов'],
      minute: ['минута', 'минуты', 'минут'],
      second: ['секунда', 'секунды', 'секунд']
    };

    const forms = units[unit] || [unit, unit, unit];
    return this.getPluralForm(count, forms);
  }

  private getPluralForm(count: number, forms: [string, string, string]): string {
    const remainder10 = count % 10;
    const remainder100 = count % 100;

    if (remainder100 > 10 && remainder100 < 20) {
      return forms[2];
    }

    if (remainder10 === 1) {
      return forms[0];
    }

    if (remainder10 >= 2 && remainder10 <= 4) {
      return forms[1];
    }

    return forms[2];
  }
}