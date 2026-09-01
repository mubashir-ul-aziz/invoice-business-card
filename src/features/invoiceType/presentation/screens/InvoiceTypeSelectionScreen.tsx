import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppButton } from '../../../../core/components/AppButton';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { InvoiceType } from '../../domain/entities/InvoiceType';
import { useInvoiceTypeSelectionStore } from '../state/invoiceTypeSelectionStore';

/** Icon per system-defined type (Stitch "Invoice Type" screen), keyed by InvoiceType.id — a presentation-only
 * concern, so the domain model (Section 7) stays free of UI detail. Falls back to a generic icon for any
 * future/custom type id not in this map. */
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'type-general': 'receipt-outline',
  'type-quantity': 'cube-outline',
  'type-weight': 'scale-outline',
  'type-dimension': 'resize-outline',
  'type-custom-base': 'grid-outline',
};
const DEFAULT_TYPE_ICON: keyof typeof Ionicons.glyphMap = 'options-outline';

/** Screen 5 — choose which invoice type the business uses by default (Section 16, Phase 5). */
export function InvoiceTypeSelectionScreen() {
  const navigation = useAppNavigation();
  const { fromOnboarding } = useAppRoute<'InvoiceTypeSelection'>().params ?? {};

  const { invoiceTypes, selectedId, status, errorMessage, load, select, confirmSelection } =
    useInvoiceTypeSelectionStore();

  // Reload on every focus so a custom type created via Screen 6 and
  // navigated back from is reflected immediately (same convention as
  // CustomerListScreen's focus reload).
  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Screen 5 shows the 5 system-defined formats only; a business's own custom
  // types (created via the "Create Custom Type" entry point, Screen 6) live
  // in the full catalog but aren't re-listed here.
  const systemTypes = invoiceTypes.filter((type) => type.isSystemDefined);

  async function handleContinue() {
    const saved = await confirmSelection();
    if (!saved) return;
    if (fromOnboarding) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      navigation.goBack();
    }
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Invoice Type" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <LoadingState label="Loading invoice types…" />
      </ScreenContainer>
    );
  }

  if (status === 'error' && systemTypes.length === 0) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Invoice Type" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <ErrorState message={errorMessage ?? 'Could not load invoice types.'} onRetry={load} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Invoice Type" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <FlatList
        data={systemTypes}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.intro}>Choose the format that matches what you sell. You can change this later.</Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.customRow}
            onPress={() => navigation.navigate('CustomInvoiceType')}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.customRowLabel}>Create Custom Type</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <InvoiceTypeRow type={item} isSelected={item.id === selectedId} onPress={() => select(item.id)} />
        )}
      />
      {status === 'error' ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}
      <AppButton
        label="Continue"
        onPress={handleContinue}
        disabled={!selectedId}
        loading={status === 'saving'}
        style={styles.continueButton}
      />
    </ScreenContainer>
  );
}

function InvoiceTypeRow({
  type,
  isSelected,
  onPress,
}: {
  type: InvoiceType;
  isSelected: boolean;
  onPress: () => void;
}) {
  const icon = TYPE_ICON[type.id] ?? DEFAULT_TYPE_ICON;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      style={[styles.typeRow, isSelected && styles.typeRowSelected]}
    >
      <View style={[styles.iconAvatar, isSelected && styles.iconAvatarSelected]}>
        <Ionicons name={icon} size={22} color={isSelected ? theme.colors.textOnPrimary : theme.colors.textSecondary} />
      </View>
      <View style={styles.typeBody}>
        <Text style={styles.typeName}>{type.name} Invoice</Text>
        <Text style={styles.typeDescription}>{type.description}</Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected ? <Ionicons name="checkmark" size={14} color={theme.colors.textOnPrimary} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.md, gap: theme.spacing.sm },
  intro: {
    ...theme.typography.bodyMd,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  typeRowSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primaryLight,
  },
  iconAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconAvatarSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeBody: { flex: 1, paddingTop: 2 },
  typeName: { ...theme.typography.bodyLg, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  typeDescription: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, lineHeight: 19 },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    marginLeft: theme.spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  customRowLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  inlineError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.xs },
  continueButton: { marginBottom: theme.spacing.md },
});
