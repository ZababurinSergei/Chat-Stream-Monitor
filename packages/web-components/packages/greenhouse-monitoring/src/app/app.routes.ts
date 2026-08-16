import { Routes } from '@angular/router';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'regions',
        loadComponent: () => import('./features/regions/regions.component').then(m => m.RegionsComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'greenhouse/:id',
        loadComponent: () => import('./features/greenhouse/greenhouse-detail.component').then(m => m.GreenhouseDetailComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'history/:greenhouseId',
        loadComponent: () => import('./shared/components/history-table/history-table.component').then(m => m.HistoryTableComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'recalculation',
        loadComponent: () => import('./features/recalculation/recalculation.component').then(m => m.RecaluationComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'alerts',
        loadComponent: () => import('./features/alerts/alerts.component').then(m => m.AlertsComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        canActivate: [RoleGuard]
    },
    {
        path: 'help',
        loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent)
    },
    {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
    },
    {
        path: 'maintenance',
        loadComponent: () => import('./features/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'backup',
        loadComponent: () => import('./features/backup/backup.component').then(m => m.BackupComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'export',
        loadComponent: () => import('./features/export/export.component').then(m => m.ExportComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'import',
        loadComponent: () => import('./features/import/import.component').then(m => m.ImportComponent),
        canActivate: [RoleGuard],
        data: { role: 'senior-specialist' }
    },
    {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring.component').then(m => m.MonitoringComponent),
        canActivate: [RoleGuard]
    },
    {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
    }
];