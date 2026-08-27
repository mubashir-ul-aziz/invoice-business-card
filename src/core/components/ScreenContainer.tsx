import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { theme } from '../../app/theme/theme';
import { useResponsive } from '../../app/theme/useResponsive';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  backgroundColor?: string;
}

/**
 * Shared screen shell: safe-area handling + a centered, width-capped content
 * column so every screen is responsive across mobile/tablet/desktop web
 * without repeating breakpoint logic per screen (Section: responsive layout).
 */
export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  edges,
  backgroundColor,
}: ScreenContainerProps) {
  const { contentMaxWidth } = useResponsive();
  const inner = (
    <View
      style={[
        padded && styles.padded,
        contentMaxWidth ? { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' } : styles.fullWidth,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: backgroundColor ?? theme.colors.background }, style]}
      edges={edges}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.flexFill}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexFill: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, width: '100%' },
  padded: { paddingHorizontal: theme.spacing.md },
  fullWidth: { width: '100%' },
});
