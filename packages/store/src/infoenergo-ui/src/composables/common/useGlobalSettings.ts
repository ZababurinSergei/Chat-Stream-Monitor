import { readonly } from 'vue';
import type { TableApi, GlobalSettings } from '@/composables/common/types';

const tableApi: TableApi = {
    data: async () => {
        throw new Error('GlobalSettings: tableApi не инициализирован');
    },
    userChanges: async () => {
        throw new Error('GlobalSettings: tableApi не инициализирован');
    },
    userSettingsApi: {
        get get(): string {
            throw new Error('GlobalSettings: tableApi не инициализирован');
        },
        get set(): string {
            throw new Error('GlobalSettings: tableApi не инициализирован');
        },
    },
    export: () => {
        throw new Error('GlobalSettings: tableApi.export не передан');
    },
};

let isInitialized = false;

const validateTableApi = (tableApi: GlobalSettings['tableApi']): void => {
    if (!tableApi) {
        throw new Error('initGlobalSettings: отсутствует tableApi');
    }
    if (typeof tableApi.data !== 'function') {
        throw new Error('initGlobalSettings: отсутствует tableApi.data');
    }
    if (typeof tableApi.userChanges !== 'function') {
        throw new Error('initGlobalSettings: отсутствует tableApi.userChanges');
    }
    if (!tableApi.userSettingsApi?.get) {
        throw new Error('initGlobalSettings: отсутствует tableApi.userSettingsApi.get');
    }
    if (!tableApi.userSettingsApi?.set) {
        throw new Error('initGlobalSettings: отсутствует tableApi.userSettingsApi.set');
    }
    if (typeof tableApi.export !== 'function') {
        throw new Error('initGlobalSettings: отсутствует tableApi.export');
    }
};

export const initGlobalSettings = (globalSettings: GlobalSettings) => {
    if (isInitialized) return;

    validateTableApi(globalSettings.tableApi);

    tableApi.data = globalSettings.tableApi.data;
    tableApi.userChanges = globalSettings.tableApi.userChanges;
    tableApi.userSettingsApi = globalSettings.tableApi.userSettingsApi;
    tableApi.export = globalSettings.tableApi.export;
    isInitialized = true;
};

export const useGlobalSettings = () => {
    if (!isInitialized) {
        throw new Error('useGlobalSettings: сначала вызовите initGlobalSettings в AiAppProviders');
    }
    return { tableApi: readonly(tableApi) };
};
