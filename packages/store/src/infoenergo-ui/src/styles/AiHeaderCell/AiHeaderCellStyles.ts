import type { InputProps, PopselectProps } from 'naive-ui';

type InputThemeOverrides = NonNullable<InputProps['themeOverrides']>;
type FilterSelectThemeOverrides = NonNullable<PopselectProps['themeOverrides']>;

export const inputThemeOverrides: InputThemeOverrides = {
    border: 'none',
    borderHover: 'none',
    borderFocus: 'none',
    paddingMedium: '0',
    paddingSmall: '0',
    heightSmall: '25px',
    clearSize: '16px',
    iconSize: '16px',
};

export const filterSelectThemeOverrides: FilterSelectThemeOverrides = {
    peers: {
        Popover: {
            padding: '0',
            spaceArrow: '0',
        },
        InternalSelectMenu: {
            paddingSmall: '0',
            optionColorActive: 'transparent',
            optionColorPending: 'transparent',
            optionColorActivePending: 'transparent',
        },
    },
};
