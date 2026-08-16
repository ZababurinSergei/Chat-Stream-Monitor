import { useFetch } from '@/composables/common/useFetch';
import { initGlobalSettings } from '@/composables/common/useGlobalSettings';
import type { GlobalSettings } from '@/composables/common/types';

export const init = () => {
    const { send } = useFetch();
    const globalSettings: GlobalSettings = {
        tableApi: {
            data: send,
            userChanges: send,
            userSettingsApi: {
                get: 'userdata./user-settings/list/get',
                set: 'userdata./user-settings/list/set',
            },
            export: () => {},
        },
    };

    initGlobalSettings(globalSettings);
};
