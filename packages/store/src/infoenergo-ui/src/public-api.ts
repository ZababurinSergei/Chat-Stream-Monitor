export { libraryThemeOverrides } from './styles/libraryTheme';
export { default as AiAppProviders } from './components/ui/common/AiAppProviders.vue';
export { default as AiDialog } from './components/ui/AiDialog/AiDialog.vue';
export { default as AiTabs } from './components/ui/AiTabs/AiTabs.vue';
export type { Tab, TabState } from './components/ui/AiTabs/types';

export { useTabsBaseOperations, TABS_API_KEY } from './composables/AiTabs/useTabsBaseOperations';
export type { UseTabsBaseOperationsReturn } from './composables/AiTabs/useTabsBaseOperations';
export { useTabsState } from './composables/AiTabs/useTabsState';
export type { UseTabsStateReturn } from './composables/AiTabs/useTabsState';
