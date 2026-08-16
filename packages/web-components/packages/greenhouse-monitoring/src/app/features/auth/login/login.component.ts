import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  selectedRole = signal<'specialist' | 'senior-specialist'>('specialist');
  errorMessage = signal('');

  permissions = computed(() => {
    const role = this.selectedRole();
    if (role === 'senior-specialist') {
      return [
        'Просмотр всех теплиц и регионов',
        'Фильтрация объектов',
        'Просмотр графиков измерений',
        'Редактирование результатов измерений',
        'Запуск дополнительных опросов',
        'Инициация пересчёта состояний',
        'Комментирование истории изменений'
      ];
    } else {
      return [
        'Просмотр всех теплиц и регионов',
        'Фильтрация объектов',
        'Просмотр графиков измерений',
        'Запуск дополнительных опросов',
        'Просмотр истории изменений'
      ];
    }
  });

  canLogin = computed(() => {
    return this.username().trim().length > 0 &&
        this.password().trim().length > 0 &&
        this.selectedRole() !== null;
  });

  constructor(
      private store: AppStore,
      private router: Router
  ) {}

  login() {
    if (!this.canLogin()) {
      this.errorMessage.set('Заполните все обязательные поля');
      return;
    }

    try {
      // Устанавливаем роль пользователя в хранилище
      this.store.setUserRole(this.selectedRole());

      // Инициализируем мок-данные
      this.store.initializeMockData();

      // Перенаправляем на главную страницу
      this.router.navigate(['/dashboard']);

      this.errorMessage.set('');
    } catch (error) {
      this.errorMessage.set('Ошибка при входе в систему');
      console.error('Login error:', error);
    }
  }

  getRoleName(): string {
    return this.selectedRole() === 'senior-specialist'
        ? 'Старшего специалиста'
        : 'Специалиста';
  }
}
