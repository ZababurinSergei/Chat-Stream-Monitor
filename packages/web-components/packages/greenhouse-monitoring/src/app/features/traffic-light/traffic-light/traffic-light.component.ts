import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrafficLightStats {
  normal: number;
  warning: number;
  emergency: number;
}

@Component({
  selector: 'app-traffic-light-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './traffic-light.component.html',
  styleUrl: './traffic-light.component.css'
})
export class TrafficLightWidgetComponent {
  // Входные параметры
  stats = input<TrafficLightStats>({ normal: 0, warning: 0, emergency: 0 });
  lastUpdate = input<Date | null>(null);
  showLastUpdate = input(true);
  clickable = input(false);

  // Вычисляемые свойства
  totalGreenhouses = computed(() => {
    const s = this.stats();
    return s.normal + s.warning + s.emergency;
  });

  hasIssues = computed(() => {
    const s = this.stats();
    return s.warning > 0 || s.emergency > 0;
  });

  // Обработчик клика
  onLightClick(status: 'normal' | 'warning' | 'emergency') {
    if (this.clickable()) {
      const s = this.stats();
      const count = s[status];
      if (count > 0) {
        console.log(`Clicked on ${status} status with ${count} greenhouses`);
        // Здесь можно эмитить событие или вызывать callback
      }
    }
  }

  // Вспомогательный метод для склонения существительных
  getNoun(number: number, one: string, two: string, five: string): string {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
      return five;
    }
    n %= 10;
    if (n === 1) {
      return one;
    }
    if (n >= 2 && n <= 4) {
      return two;
    }
    return five;
  }
}