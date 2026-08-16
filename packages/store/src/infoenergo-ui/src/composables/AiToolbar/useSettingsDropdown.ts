import { h } from 'vue';
import { type DropdownOption, NCheckbox } from 'naive-ui';
import type { SettingsDropdownKey, TableToolbarSettings } from '@/components/ui/AiToolbar/settings/types';
import type { DefaultToolbarDropdown } from '@/components/ui/AiToolbar/types';

type SettingsHandlerKey = Exclude<SettingsDropdownKey, 'reset-settings'>;

const createCheckboxLabel =
    (
        option: DropdownOption,
        getChecked: () => boolean,
        onSelect: (dropdownId: string, optionKey: string) => void,
        dropdownId: string,
        optionKey: string
    ) =>
    () =>
        h(
            NCheckbox,
            {
                checked: getChecked(),
                onClick: (e: MouseEvent) => e.stopPropagation(),
                'onUpdate:checked': () => onSelect(dropdownId, optionKey),
            },
            { default: () => option.label }
        );

export const useSettingsDropdown = (onSelect: (dropdownId: string, optionKey: string) => void) => {
    const getDropdownOptions = (item: DefaultToolbarDropdown, settings: TableToolbarSettings): DropdownOption[] => {
        const handlers: Record<SettingsHandlerKey, (option: DropdownOption) => DropdownOption> = {
            'show-grouping': option => ({
                ...option,
                label: createCheckboxLabel(
                    option,
                    () => settings.groupPanelVisible,
                    onSelect,
                    item.id,
                    String(option.key)
                ),
            }),
            'auto-save': option => ({
                ...option,
                label: createCheckboxLabel(option, () => settings.autoSaveMode, onSelect, item.id, String(option.key)),
            }),
            'save-settings': option => ({
                ...option,
                get disabled() {
                    return settings.autoSaveMode;
                },
            }),
        };

        return item.options.map(option => {
            const handler = handlers[option.key as SettingsHandlerKey];
            return handler ? handler(option) : option;
        });
    };

    return { getDropdownOptions };
};
