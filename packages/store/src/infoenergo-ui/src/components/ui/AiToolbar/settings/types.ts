/** Состояние настроек таблицы из меню тулбара */
export type TableToolbarSettings = {
    autoSaveMode: boolean;
    groupPanelVisible: boolean;
};

export type SettingsDropdownKey = 'save-settings' | 'reset-settings' | 'show-grouping' | 'auto-save';
