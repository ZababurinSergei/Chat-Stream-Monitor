import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, effect, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppStore } from '../../core/store/app.store';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole!: 'specialist' | 'senior-specialist' | string[];

  private userRoleSubscription?: Subscription;
  private effectCleanup?: () => void;

  constructor(
      private templateRef: TemplateRef<any>,
      private viewContainer: ViewContainerRef,
      private store: AppStore
  ) {}

  ngOnInit() {
    // Способ 1: Использование эффектов Angular Signals
    const userRoleSignal = this.store.userRole;

    this.effectCleanup = effect(() => {
      const userRole = userRoleSignal();
      this.updateView(userRole);
    });

    // Способ 2: Альтернатива через подписку (если нужно)
    // this.userRoleSubscription = this.store.userRole$.subscribe(userRole => {
    //   this.updateView(userRole);
    // });
  }

  private updateView(userRole: 'specialist' | 'senior-specialist') {
    let hasAccess = false;

    // Проверяем доступ
    if (Array.isArray(this.appHasRole)) {
      hasAccess = this.appHasRole.includes(userRole);
    } else {
      hasAccess = userRole === this.appHasRole;
    }

    // Обновляем представление
    if (hasAccess) {
      if (!this.viewContainer.length) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }

  ngOnDestroy() {
    // Очищаем подписки и эффекты
    if (this.userRoleSubscription) {
      this.userRoleSubscription.unsubscribe();
    }

    if (this.effectCleanup) {
      this.effectCleanup();
    }

    // Очищаем контейнер
    this.viewContainer.clear();
  }
}

// Альтернативная реализация с поддержкой динамического изменения роли
@Directive({
  selector: '[appHasAnyRole]',
  standalone: true
})
export class HasAnyRoleDirective implements OnInit, OnDestroy {
  @Input() appHasAnyRole: ('specialist' | 'senior-specialist')[] = [];
  @Input() appHasAnyRoleCondition: 'AND' | 'OR' = 'OR';

  private effectCleanup?: () => void;

  constructor(
      private templateRef: TemplateRef<any>,
      private viewContainer: ViewContainerRef,
      private store: AppStore
  ) {}

  ngOnInit() {
    // Используем эффект для реактивности
    const userRoleSignal = this.store.userRole;

    this.effectCleanup = effect(() => {
      const userRole = userRoleSignal();
      this.updateView(userRole);
    });
  }

  private updateView(userRole: 'specialist' | 'senior-specialist') {
    let hasAccess = false;

    if (this.appHasAnyRole.length === 0) {
      // Если роли не указаны, доступ есть всегда
      hasAccess = true;
    } else if (this.appHasAnyRoleCondition === 'OR') {
      // Проверяем OR условие
      hasAccess = this.appHasAnyRole.some(role => role === userRole);
    } else {
      // Проверяем AND условие (для нескольких ролей одновременно)
      hasAccess = this.appHasAnyRole.every(role => role === userRole);
    }

    // Обновляем представление
    if (hasAccess) {
      if (!this.viewContainer.length) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }

  ngOnDestroy() {
    if (this.effectCleanup) {
      this.effectCleanup();
    }
    this.viewContainer.clear();
  }
}

// Директива для отображения элементов, если НЕТ указанной роли
@Directive({
  selector: '[appHasNotRole]',
  standalone: true
})
export class HasNotRoleDirective implements OnInit, OnDestroy {
  @Input() appHasNotRole!: 'specialist' | 'senior-specialist' | string[];

  private effectCleanup?: () => void;

  constructor(
      private templateRef: TemplateRef<any>,
      private viewContainer: ViewContainerRef,
      private store: AppStore
  ) {}

  ngOnInit() {
    const userRoleSignal = this.store.userRole;

    this.effectCleanup = effect(() => {
      const userRole = userRoleSignal();
      this.updateView(userRole);
    });
  }

  private updateView(userRole: 'specialist' | 'senior-specialist') {
    let shouldHide = false;

    if (Array.isArray(this.appHasNotRole)) {
      shouldHide = this.appHasNotRole.includes(userRole);
    } else {
      shouldHide = userRole === this.appHasNotRole;
    }

    // Показываем, если НЕТ указанной роли
    if (!shouldHide) {
      if (!this.viewContainer.length) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }

  ngOnDestroy() {
    if (this.effectCleanup) {
      this.effectCleanup();
    }
    this.viewContainer.clear();
  }
}

// Фабричная функция для экспорта всех директив ролей
export function provideRoleDirectives() {
  return [
    HasRoleDirective,
    HasAnyRoleDirective,
    HasNotRoleDirective
  ];
}