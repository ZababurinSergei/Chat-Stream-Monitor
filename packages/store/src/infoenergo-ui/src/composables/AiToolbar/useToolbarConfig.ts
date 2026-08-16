import { reactive } from 'vue';
import { DEFAULT_ITEMS, STATIC_ITEMS_NAMES } from '@/components/ui/AiToolbar/defaults';
import type { TableToolbarSettings } from '@/components/ui/AiToolbar/settings/types';
import type {
    ColumnChooser,
    DefaultToolbarDropdown,
    DefaultToolbarInput,
    DefaultToolbarPopselect,
    ToolbarItem,
} from '@/components/ui/AiToolbar/types';
import { useSettingsDropdown } from '@/composables/AiToolbar/useSettingsDropdown';

export const useToolbarConfig = (
    columnChooser: ColumnChooser,
    isEditable: boolean,
    userToolbarItems: ToolbarItem[] = [],
    tableToolbarSettings: TableToolbarSettings,
    onDropdownSelect: (dropdownId: string, optionKey: string) => void,
    getSearchValue: () => string
) => {
    const { getDropdownOptions } = useSettingsDropdown(onDropdownSelect);

    const createToolbarItems = () => {
        const staticItems = STATIC_ITEMS_NAMES.map(name => {
            if (name === 'search') {
                const defaultSearchItem = DEFAULT_ITEMS['search'] as DefaultToolbarInput;

                return {
                    ...defaultSearchItem,
                    get value() {
                        return getSearchValue();
                    },
                };
            }

            return DEFAULT_ITEMS[name];
        });

        const defaultSettingsItem = DEFAULT_ITEMS['settings'] as DefaultToolbarDropdown;

        const settingsItem = {
            ...defaultSettingsItem,
            options: getDropdownOptions(defaultSettingsItem, tableToolbarSettings),
        };

        const defaultColumnChooserItem = DEFAULT_ITEMS['column-chooser'] as DefaultToolbarPopselect;

        const columnChooserItem = {
            ...defaultColumnChooserItem,
            get value() {
                return columnChooser.value;
            },
            options: columnChooser.options,
        };

        const builtItems = [...staticItems, settingsItem, columnChooserItem].filter(
            item => isEditable || item.canModifyData === false
        );

        return [...userToolbarItems, ...builtItems];
    };

    const items = reactive(createToolbarItems());

    return {
        items,
    };
};
