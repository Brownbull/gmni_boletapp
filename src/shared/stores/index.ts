// Shared stores used across multiple features

export {
  useSettingsStore,
  defaultSettingsState,
  useTheme,
  useColorTheme,
  useFontColorMode,
  useFontSize,
  // Story 14e-35: Locale selectors
  useLang,
  useCurrency,
  useDateFormat,
  useLocaleSettings,
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

// Story 14e-37: Insight store
export {
  useInsightStore,
  defaultInsightState,
  useCurrentInsight,
  useShowInsightCard,
  useShowSessionComplete,
  useSessionContext,
  useShowBatchSummary,
  useInsightCardState,
  useSessionCompleteState,
  useInsightActions,
  getInsightState,
  insightActions,
  type InsightState,
  type InsightActions,
} from './useInsightStore';

// Story 14d-v2-0: View mode store
export {
  useViewModeStore,
  useViewMode,
  useViewModeMode,
  useIsGroupMode,
  useCurrentGroupId,
  useCurrentGroup,
  useViewModeActions,
  selectIsGroupMode,
  selectCurrentGroupId,
  selectCurrentGroup,
  getViewModeState,
  viewModeActions,
  initialViewModeState,
  type ViewMode,
  type ViewModeState,
  type ViewModeActions,
  type ViewModeStore,
} from './useViewModeStore';
