import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

/**
 * Every screen — whether it lives in a tab's nested stack or directly on the
 * root stack — navigates through this single typed hook. React Navigation
 * bubbles `navigate()` calls up to the nearest ancestor navigator that owns
 * the target route name, so a tab-root screen can still push a root-stack
 * screen (e.g. Dashboard -> InvoiceDetail) without each tab stack redeclaring
 * every route (Section 15).
 */
export function useAppNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>();
}
