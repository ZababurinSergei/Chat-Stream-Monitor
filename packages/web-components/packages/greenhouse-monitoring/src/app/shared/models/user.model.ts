export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    department?: string;
    regionId?: number;
    lastLogin?: Date;
    createdAt: Date;
    isActive: boolean;
    permissions: Permission[];
}

export type UserRole = 'admin' | 'senior-specialist' | 'specialist' | 'viewer';

export interface Permission {
    id: string;
    name: string;
    description: string;
    module: PermissionModule;
    action: PermissionAction;
}

export type PermissionModule =
    | 'regions'
    | 'greenhouses'
    | 'measurements'
    | 'reports'
    | 'history'
    | 'users'
    | 'system';

export type PermissionAction =
    | 'view'
    | 'create'
    | 'edit'
    | 'delete'
    | 'approve'
    | 'export'
    | 'recalculate';

export interface UserCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}

export interface UserSession {
    id: string;
    userId: number;
    startTime: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
}

export interface RoleDefinition {
    id: UserRole;
    name: string;
    description: string;
    defaultPermissions: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
    'admin': {
        id: 'admin',
        name: 'Администратор',
        description: 'Полный доступ ко всем функциям системы',
        defaultPermissions: ['*']
    },
    'senior-specialist': {
        id: 'senior-specialist',
        name: 'Старший специалист',
        description: 'Расширенные права: редактирование измерений, добавление комментариев, инициация пересчетов',
        defaultPermissions: [
            'regions:view',
            'regions:edit',
            'greenhouses:view',
            'greenhouses:edit',
            'measurements:view',
            'measurements:edit',
            'measurements:create',
            'history:view',
            'history:edit',
            'reports:view',
            'reports:export',
            'system:recalculate'
        ]
    },
    'specialist': {
        id: 'specialist',
        name: 'Специалист',
        description: 'Базовые права: просмотр данных, навигация, просмотр графиков',
        defaultPermissions: [
            'regions:view',
            'greenhouses:view',
            'measurements:view',
            'history:view',
            'reports:view'
        ]
    },
    'viewer': {
        id: 'viewer',
        name: 'Наблюдатель',
        description: 'Только просмотр данных без возможности редактирования',
        defaultPermissions: [
            'regions:view',
            'greenhouses:view',
            'measurements:view'
        ]
    }
};

export interface UserPreferences {
    userId: number;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timeZone: string;
    dateFormat: string;
    defaultTimeRange: 'day' | 'week' | 'month' | 'year';
    notificationSettings: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        warningAlerts: boolean;
        emergencyAlerts: boolean;
        dailyReports: boolean;
        weeklySummaries: boolean;
    };
    dashboardLayout: {
        showTrafficLight: boolean;
        showRecentAlerts: boolean;
        showPerformanceMetrics: boolean;
        showRegionMap: boolean;
        widgetOrder: string[];
    };
}

export interface UserActivityLog {
    id: number;
    userId: number;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UserRegistration {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    department?: string;
    role: UserRole;
    regionId?: number;
}

export const DEMO_USERS: User[] = [
    {
        id: 1,
        username: 'senior.ivanov',
        email: 'ivanov@greenhouse-monitoring.ru',
        role: 'senior-specialist',
        firstName: 'Иван',
        lastName: 'Иванов',
        phoneNumber: '+7 (999) 123-45-67',
        department: 'Агрономический отдел',
        regionId: 1,
        lastLogin: new Date(),
        createdAt: new Date('2023-01-15'),
        isActive: true,
        permissions: ROLE_DEFINITIONS['senior-specialist'].defaultPermissions.map(perm => ({
            id: perm,
            name: perm.split(':')[1] === 'view' ? 'Просмотр' : 'Редактирование',
            description: `Разрешение на ${perm.split(':')[1] === 'view' ? 'просмотр' : 'редактирование'} ${perm.split(':')[0]}`,
            module: perm.split(':')[0] as PermissionModule,
            action: perm.split(':')[1] as PermissionAction
        }))
    },
    {
        id: 2,
        username: 'specialist.petrova',
        email: 'petrova@greenhouse-monitoring.ru',
        role: 'specialist',
        firstName: 'Мария',
        lastName: 'Петрова',
        phoneNumber: '+7 (999) 234-56-78',
        department: 'Технический отдел',
        regionId: 2,
        lastLogin: new Date('2023-11-20'),
        createdAt: new Date('2023-02-10'),
        isActive: true,
        permissions: ROLE_DEFINITIONS['specialist'].defaultPermissions.map(perm => ({
            id: perm,
            name: 'Просмотр',
            description: `Разрешение на просмотр ${perm.split(':')[0]}`,
            module: perm.split(':')[0] as PermissionModule,
            action: 'view'
        }))
    }
];