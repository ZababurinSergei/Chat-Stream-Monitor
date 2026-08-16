import type { GlobalThemeOverrides } from 'naive-ui';
import { ColorTokens } from '@/styles/colors/colorTokens.ts';

export const themeOverrides: GlobalThemeOverrides = {
    Scrollbar: {
        width: '8px',
        height: '8px',
        borderRadius: '5px',
        color: ColorTokens.GRAY_700,
        colorHover: ColorTokens.GRAY_900,
        railInsetVerticalRight: '0 2px 0 auto',
        railInsetHorizontalBottom: 'auto 0 2px 0',
    },
};
