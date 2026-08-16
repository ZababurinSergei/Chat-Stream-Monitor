import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, delay, map } from 'rxjs';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'specialist' | 'senior-specialist';
  email: string;
  regionIds: number[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Приватные сигналы для состояния аутентификации
  private readonly _authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null
  });

  // Публичные readonly сигналы
  readonly authState = this._authState.asReadonly();
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly currentUser = computed(() => this._authState().user);
  readonly userRole = computed(() => this._authState().user?.role);
  readonly isLoading = computed(() => this._authState().isLoading);
  readonly error = computed(() => this._authState().error);

  // Моковые пользователи для демонстрации
  private readonly mockUsers: User[] = [
    {
      id: 1,
      username: 'specialist',
      password: 'specialist123', // В реальном приложении хранить хеш
      fullName: 'Иванов Иван Иванович',
      role: 'specialist',
      email: 'specialist@agro.ru',
      regionIds: [1, 2]
    },
    {
      id: 2,
      username: 'senior',
      password: 'senior123',
      fullName: 'Петров Петр Петрович',
      role: 'senior-specialist',
      email: 'senior@agro.ru',
      regionIds: [1, 2, 3, 4]
    }
  ];

  constructor(private router: Router) {
    // Восстановление сессии из localStorage при инициализации
    this.restoreSession();
  }

  /**
   * Вход в систему
   */
  login(credentials: LoginCredentials): Observable<boolean> {
    // Устанавливаем состояние загрузки
    this._authState.update(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    // Эмуляция запроса к API
    return of(this.mockUsers).pipe(
        delay(800), // Имитация сетевой задержки
        map(users => {
          const user = users.find(u =>
              u.username === credentials.username &&
              (u as any).password === credentials.password
          );

          if (user) {
            // Убираем пароль из объекта пользователя
            const { password, ...userWithoutPassword } = user;

            const token = this.generateToken();
            const authState: AuthState = {
              isAuthenticated: true,
              user: userWithoutPassword,
              token: token,
              isLoading: false,
              error: null
            };

            // Сохраняем в localStorage
            this.saveSession(authState);

            // Обновляем состояние
            this._authState.set(authState);

            return true;
          } else {
            this._authState.update(state => ({
              ...state,
              isLoading: false,
              error: 'Неверное имя пользователя или пароль'
            }));
            return false;
          }
        })
    );
  }

  /**
   * Выход из системы
   */
  logout(): void {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null
    };

    // Очищаем localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    // Обновляем состояние
    this._authState.set(authState);

    // Перенаправляем на страницу входа
    this.router.navigate(['/login']);
  }

  /**
   * Быстрый переключение ролей для демонстрации (только для разработки)
   */
  switchRole(role: 'specialist' | 'senior-specialist'): void {
    const currentState = this._authState();

    if (!currentState.user) {
      return;
    }

    const updatedUser: User = {
      ...currentState.user,
      role: role
    };

    const updatedState: AuthState = {
      ...currentState,
      user: updatedUser
    };

    // Обновляем в localStorage
    this.saveSession(updatedState);

    // Обновляем состояние
    this._authState.set(updatedState);
  }

  /**
   * Проверка прав доступа для маршрута
   */
  hasRole(requiredRole: 'specialist' | 'senior-specialist' | 'any'): boolean {
    const user = this._authState().user;

    if (!user) {
      return false;
    }

    if (requiredRole === 'any') {
      return true;
    }

    return user.role === requiredRole;
  }

  /**
   * Проверка доступа к региону
   */
  hasRegionAccess(regionId: number): boolean {
    const user = this._authState().user;

    if (!user) {
      return false;
    }

    // Старшие специалисты имеют доступ ко всем регионам
    if (user.role === 'senior-specialist') {
      return true;
    }

    // Специалисты имеют доступ только к назначенным регионам
    return user.regionIds.includes(regionId);
  }

  /**
   * Получение текущего токена
   */
  getToken(): string | null {
    return this._authState().token;
  }

  /**
   * Очистка ошибки
   */
  clearError(): void {
    this._authState.update(state => ({
      ...state,
      error: null
    }));
  }

  /**
   * Генерация мокового токена
   */
  private generateToken(): string {
    const randomPart = Math.random().toString(36).substring(2);
    const timestamp = Date.now().toString(36);
    return `mock_token_${randomPart}_${timestamp}`;
  }

  /**
   * Сохранение сессии в localStorage
   */
  private saveSession(authState: AuthState): void {
    if (authState.token) {
      localStorage.setItem('auth_token', authState.token);
    }

    if (authState.user) {
      localStorage.setItem('auth_user', JSON.stringify(authState.user));
    }
  }

  /**
   * Восстановление сессии из localStorage
   */
  private restoreSession(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;

        // Проверяем, не истек ли токен (моковая проверка)
        const tokenParts = token.split('_');
        if (tokenParts.length === 4) {
          const timestamp = parseInt(tokenParts[3], 36);
          const tokenAge = Date.now() - timestamp;

          // Токен действителен 24 часа
          if (tokenAge < 24 * 60 * 60 * 1000) {
            this._authState.set({
              isAuthenticated: true,
              user: user,
              token: token,
              isLoading: false,
              error: null
            });
          } else {
            // Токен истек, очищаем localStorage
            this.clearLocalStorage();
          }
        }
      } catch (error) {
        console.error('Ошибка при восстановлении сессии:', error);
        this.clearLocalStorage();
      }
    }
  }

  /**
   * Очистка localStorage
   */
  private clearLocalStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}