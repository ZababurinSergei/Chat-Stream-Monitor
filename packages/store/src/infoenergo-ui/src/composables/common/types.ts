export interface UserSettingsApi {
    get: string;
    set: string;
}

export interface TableApi {
    data: (api: string, args?: any) => Promise<any>;
    userChanges: (userSettingsApi: string, args: any) => Promise<any>;
    userSettingsApi: UserSettingsApi;
    /** Функция экспорта данных таблицы в Excel */
    export: (args: { component: any; fileName: string | undefined }) => unknown;
}

export interface GlobalSettings {
    tableApi: TableApi;
}
