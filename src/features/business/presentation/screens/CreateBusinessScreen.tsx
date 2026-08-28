import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { CURRENCY_OPTIONS } from '../../../settings/data/datasources/mock/mockSettings';
import { initialsFrom, useBusinessFormStore } from '../state/businessFormStore';

/** Screen 2 — Create/Edit Business profile (Section 16). Backed by the mock `BusinessRepository` (Phase 2). */
export function CreateBusinessScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateBusiness'>();
  const isEdit = route.params?.mode === 'edit';

  const {
    name,
    address,
    phone,
    email,
    website,
    taxNumber,
    invoicePrefix,
    currencyCode,
    logoColor,
    mode,
    status,
    businessId,
    fieldErrors,
    errorMessage,
    setField,
    cycleLogoColor,
    startCreate,
    loadForEdit,
    save,
  } = useBusinessFormStore();

  useEffect(() => {
    if (isEdit) {
      loadForEdit();
    } else {
      startCreate();
    }
    // Only re-run if the screen's create/edit mode actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  const nameError = fieldErrors.name || (name.trim().length === 0 ? 'Business name is required' : undefined);
  const emailError =
    fieldErrors.email ||
    (email.trim().length === 0
      ? 'Business email is required'
      : /^\S+@\S+\.\S+$/.test(email.trim())
        ? undefined
        : 'Enter a valid email address');
  const canSave = !nameError && !emailError && status !== 'saving';

  async function handleSave() {
    const saved = await save();
    if (!saved) return;
    if (mode === 'edit') {
      navigation.goBack();
    } else {
      navigation.navigate('InvoiceTypeSelection', { fromOnboarding: true });
    }
  }

  if (isEdit && status === 'loading') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Edit Business" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <LoadingState label="Loading business profile…" />
      </ScreenContainer>
    );
  }

  if (isEdit && status === 'error' && !businessId) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Edit Business" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <ErrorState message={errorMessage || 'Could not load the business profile.'} onRetry={loadForEdit} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title={isEdit ? 'Edit Business' : 'Create Business'}
        subtitle={isEdit ? undefined : "Let's set up your business"}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      {!isEdit ? (
        <Text style={styles.introText}>Add your business details. You can always change this later in settings.</Text>
      ) : null}

      <View style={styles.logoRow}>
        <TouchableOpacity
          style={styles.logoPicker}
          accessibilityRole="button"
          accessibilityLabel="Change logo color"
          onPress={cycleLogoColor}
        >
          <View style={[styles.logoCircle, { backgroundColor: logoColor }]}>
            <Text style={styles.logoInitial}>{initialsFrom(name) || '?'}</Text>
          </View>
          <View style={styles.logoBadge}>
            <Ionicons name="color-palette-outline" size={14} color={theme.colors.textOnPrimary} />
          </View>
        </TouchableOpacity>
        <AppTextField
          label="Business name *"
          placeholder="e.g. Apex Consulting"
          value={name}
          onChangeText={(text) => setField('name', text)}
          errorText={nameError}
          containerStyle={styles.nameField}
        />
      </View>

      <AppTextField
        label="Business email *"
        placeholder="hello@business.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => setField('email', text)}
        errorText={emailError}
      />
      <AppTextField
        label="Phone"
        placeholder="+1 (555) 000-0000"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => setField('phone', text)}
      />
      <AppTextField
        label="Address"
        placeholder="Street, city, state"
        value={address}
        onChangeText={(text) => setField('address', text)}
        multiline
      />
      <AppTextField
        label="Website"
        placeholder="www.business.com"
        autoCapitalize="none"
        value={website}
        onChangeText={(text) => setField('website', text)}
      />

      <Text style={styles.fieldLabel}>Currency</Text>
      <View style={styles.chipRow}>
        {CURRENCY_OPTIONS.map((option) => (
          <Chip
            key={option.code}
            label={option.code}
            selected={currencyCode === option.code}
            onPress={() => setField('currencyCode', option.code)}
          />
        ))}
      </View>

      <AppTextField
        label="Tax / VAT number"
        placeholder="Optional"
        value={taxNumber}
        onChangeText={(text) => setField('taxNumber', text)}
      />
      <AppTextField
        label="Invoice prefix"
        placeholder="INV-"
        value={invoicePrefix}
        onChangeText={(text) => setField('invoicePrefix', text)}
      />

      {status === 'error' && errorMessage && Object.keys(fieldErrors).length === 0 ? (
        <Text style={styles.formError}>{errorMessage}</Text>
      ) : null}

      <AppButton
        label={isEdit ? 'Save Changes' : 'Create Business'}
        onPress={handleSave}
        disabled={!canSave}
        loading={status === 'saving'}
        style={styles.saveButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  introText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: theme.spacing.xs },
  logoPicker: { marginTop: theme.spacing.xs },
  logoCircle: { width: 72, height: 72, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { ...theme.typography.headlineMd, color: theme.colors.textOnPrimary },
  logoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  nameField: { flex: 1 },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md, flexWrap: 'wrap' },
  formError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
});
