import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AppStore } from '../store/app.store';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private store: AppStore, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'] as 'specialist' | 'senior-specialist' | undefined;
    const currentRole = this.store.userRole();

    // Если роль не указана или пользователь имеет нужную роль
    if (!requiredRole || currentRole === requiredRole) {
      return true;
    }

    // Для старшего специалиста разрешаем доступ к страницам специалиста
    if (requiredRole === 'specialist' && currentRole === 'senior-specialist') {
      return true;
    }

    // Редирект для пользователей без прав
    this.router.navigate(['/dashboard']);
    return false;
  }
}