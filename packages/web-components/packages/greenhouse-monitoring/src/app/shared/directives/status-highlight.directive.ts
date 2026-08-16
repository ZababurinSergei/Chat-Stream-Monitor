import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appStatusHighlight]',
  standalone: true
})
export class StatusHighlightDirective implements OnChanges, OnInit {

  // Входной параметр для статуса
  @Input() appStatusHighlight!: 'normal' | 'warning' | 'emergency' | 'unknown';

  // Тип подсветки: background, border, text, или badge
  @Input() highlightType: 'background' | 'border' | 'text' | 'badge' | 'full' = 'background';

  // Дополнительные классы CSS
  @Input() additionalClasses: string = '';

  // Флаг для анимации изменения статуса
  @Input() animateChanges: boolean = true;

  // Цветовая схема для статусов
  private readonly statusColorSchemes = {
    normal: {
      background: '#e8f5e9',
      border: '#4caf50',
      text: '#1b5e20',
      badge: '#4caf50',
      light: '#c8e6c9'
    },
    warning: {
      background: '#fffde7',
      border: '#ff9800',
      text: '#ff6f00',
      badge: '#ff9800',
      light: '#fff9c4'
    },
    emergency: {
      background: '#ffebee',
      border: '#f44336',
      text: '#c62828',
      badge: '#f44336',
      light: '#ffcdd2'
    },
    unknown: {
      background: '#f5f5f5',
      border: '#9e9e9e',
      text: '#616161',
      badge: '#9e9e9e',
      light: '#e0e0e0'
    }
  };

  // Предыдущий статус для анимации
  private previousStatus: string | null = null;

  // Таймаут для анимации
  private animationTimeout: any;

  constructor(
      private el: ElementRef,
      private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Инициализация директивы
    this.renderer.addClass(this.el.nativeElement, 'status-highlight');

    if (this.additionalClasses) {
      const classes = this.additionalClasses.split(' ');
      classes.forEach(className => {
        if (className.trim()) {
          this.renderer.addClass(this.el.nativeElement, className.trim());
        }
      });
    }

    // Применяем начальный статус
    this.applyHighlight();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appStatusHighlight']) {
      // Сохраняем предыдущий статус для анимации
      if (changes['appStatusHighlight'].previousValue) {
        this.previousStatus = changes['appStatusHighlight'].previousValue;
      }

      // Очищаем предыдущие стили
      this.clearPreviousStyles();

      // Применяем новый статус
      this.applyHighlight();

      // Запускаем анимацию изменения, если нужно
      if (this.animateChanges && this.previousStatus && this.previousStatus !== this.appStatusHighlight) {
        this.animateStatusChange();
      }
    }

    if (changes['highlightType']) {
      // Если изменился тип подсветки, перерисовываем
      this.clearPreviousStyles();
      this.applyHighlight();
    }
  }

  /**
   * Очищает предыдущие стили, примененные директивой
   */
  private clearPreviousStyles(): void {
    // Удаляем CSS классы статусов
    Object.keys(this.statusColorSchemes).forEach(status => {
      this.renderer.removeClass(this.el.nativeElement, `status-${status}`);
    });

    // Удаляем CSS классы типов подсветки
    ['background-type', 'border-type', 'text-type', 'badge-type', 'full-type'].forEach(typeClass => {
      this.renderer.removeClass(this.el.nativeElement, typeClass);
    });

    // Удаляем inline стили
    this.renderer.removeStyle(this.el.nativeElement, 'background-color');
    this.renderer.removeStyle(this.el.nativeElement, 'border-color');
    this.renderer.removeStyle(this.el.nativeElement, 'border-width');
    this.renderer.removeStyle(this.el.nativeElement, 'border-style');
    this.renderer.removeStyle(this.el.nativeElement, 'color');
    this.renderer.removeStyle(this.el.nativeElement, 'font-weight');
    this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');

    // Удаляем дочерний элемент badge, если он был создан
    const existingBadge = this.el.nativeElement.querySelector('.status-badge');
    if (existingBadge) {
      this.renderer.removeChild(this.el.nativeElement, existingBadge);
    }
  }

  /**
   * Применяет подсветку в зависимости от статуса и типа
   */
  private applyHighlight(): void {
    const status = this.appStatusHighlight || 'unknown';
    const colors = this.statusColorSchemes[status];

    // Добавляем CSS класс для статуса
    this.renderer.addClass(this.el.nativeElement, `status-${status}`);

    // Добавляем CSS класс для типа подсветки
    this.renderer.addClass(this.el.nativeElement, `${this.highlightType}-type`);

    // Применяем стили в зависимости от типа подсветки
    switch (this.highlightType) {
      case 'background':
        this.applyBackgroundHighlight(colors);
        break;

      case 'border':
        this.applyBorderHighlight(colors);
        break;

      case 'text':
        this.applyTextHighlight(colors);
        break;

      case 'badge':
        this.applyBadgeHighlight(colors);
        break;

      case 'full':
        this.applyFullHighlight(colors);
        break;
    }

    // Добавляем атрибут data-status для тестирования и CSS селекторов
    this.renderer.setAttribute(this.el.nativeElement, 'data-status', status);
  }

  /**
   * Подсветка фона
   */
  private applyBackgroundHighlight(colors: any): void {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', colors.background);
    this.renderer.setStyle(this.el.nativeElement, 'color', colors.text);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '4px');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'background-color 0.3s ease');
  }

  /**
   * Подсветка границы
   */
  private applyBorderHighlight(colors: any): void {
    this.renderer.setStyle(this.el.nativeElement, 'border', `2px solid ${colors.border}`);
    this.renderer.setStyle(this.el.nativeElement, 'color', colors.text);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '6px 10px');
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '4px');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'border-color 0.3s ease');
  }

  /**
   * Подсветка текста
   */
  private applyTextHighlight(colors: any): void {
    this.renderer.setStyle(this.el.nativeElement, 'color', colors.text);
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '600');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'color 0.3s ease');
  }

  /**
   * Отображение в виде бейджа
   */
  private applyBadgeHighlight(colors: any): void {
    // Создаем элемент бейджа
    const badge = this.renderer.createElement('span');
    const badgeText = this.renderer.createText(this.getStatusText());

    // Настраиваем бейдж
    this.renderer.appendChild(badge, badgeText);
    this.renderer.addClass(badge, 'status-badge');
    this.renderer.addClass(badge, `badge-${this.appStatusHighlight}`);

    // Стили для бейджа
    this.renderer.setStyle(badge, 'display', 'inline-block');
    this.renderer.setStyle(badge, 'background-color', colors.badge);
    this.renderer.setStyle(badge, 'color', 'white');
    this.renderer.setStyle(badge, 'padding', '2px 8px');
    this.renderer.setStyle(badge, 'border-radius', '12px');
    this.renderer.setStyle(badge, 'font-size', '0.75rem');
    this.renderer.setStyle(badge, 'font-weight', '500');
    this.renderer.setStyle(badge, 'margin-left', '8px');
    this.renderer.setStyle(badge, 'transition', 'all 0.3s ease');

    // Добавляем бейдж в элемент
    this.renderer.appendChild(this.el.nativeElement, badge);
  }

  /**
   * Полная подсветка (фон + граница + текст)
   */
  private applyFullHighlight(colors: any): void {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', colors.background);
    this.renderer.setStyle(this.el.nativeElement, 'border', `2px solid ${colors.border}`);
    this.renderer.setStyle(this.el.nativeElement, 'color', colors.text);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '6px');
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '600');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', `0 2px 4px ${colors.light}40`);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
  }

  /**
   * Анимация изменения статуса
   */
  private animateStatusChange(): void {
    // Добавляем класс для анимации
    this.renderer.addClass(this.el.nativeElement, 'status-changing');

    // Устанавливаем пульсацию
    this.renderer.addClass(this.el.nativeElement, 'status-pulse');

    // Убираем анимацию через 1 секунду
    clearTimeout(this.animationTimeout);
    this.animationTimeout = setTimeout(() => {
      this.renderer.removeClass(this.el.nativeElement, 'status-changing');
      this.renderer.removeClass(this.el.nativeElement, 'status-pulse');
    }, 1000);
  }

  /**
   * Возвращает текст статуса на русском
   */
  private getStatusText(): string {
    const statusTexts = {
      normal: 'Норма',
      warning: 'Предупреждение',
      emergency: 'Авария',
      unknown: 'Неизвестно'
    };

    return statusTexts[this.appStatusHighlight] || 'Неизвестно';
  }

  /**
   * Публичный метод для принудительного обновления
   */
  public updateStatus(newStatus: 'normal' | 'warning' | 'emergency' | 'unknown'): void {
    this.appStatusHighlight = newStatus;
    this.clearPreviousStyles();
    this.applyHighlight();
  }

  /**
   * Очистка ресурсов при уничтожении директивы
   */
  ngOnDestroy(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }
}

// CSS стили для директивы (можно добавить в глобальные стили)
/*
.status-highlight {
  transition: all 0.3s ease;
}

.status-changing {
  animation: statusChange 0.5s ease;
}

.status-pulse {
  animation: pulse 1s ease-in-out;
}

@keyframes statusChange {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.status-normal { background-color: #e8f5e9 !important; }
.status-warning { background-color: #fffde7 !important; }
.status-emergency { background-color: #ffebee !important; }
.status-unknown { background-color: #f5f5f5 !important; }
*/