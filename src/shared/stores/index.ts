// Shared stores used across multiple features

export {
  useSettingsStore,
  defaultSettingsState,
  useTheme,
  useColorTheme,
  useFontColorMode,
  useFontSize,
  getSettingsState,
  settingsActions,
} from './useSettingsStore';

// Story 14e-25a.1: Navigation store
export {
  useNavigationStore,
  useNavigation,
  useCurrentView,
  usePreviousView,
  useSettingsSubview,
  usePendingHistoryFilters,
  usePendingDistributionView,
  useAnalyticsInitialState,
  useNavigationActions,
  getNavigationState,
  navigationActions,
  type NavigationState,
  type NavigationActions,
  type SettingsSubview,
  type NavigateToViewOptions,
} from './useNavigationStore';
