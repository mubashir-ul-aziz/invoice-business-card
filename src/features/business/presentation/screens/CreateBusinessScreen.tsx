import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../data/datasources/mock/mockBusiness';
import { CURRENCY_OPTIONS } from '../../../settings/data/datasources/mock/mockSettings';

/** Screen 2 — Create/Edit Business profile (Section 16). Draft-only, saves nowhere yet (Stage 1). */
export function CreateBusinessScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateBusiness'>();
  const isEdit = route.params?.mode === 'edit';
  const seed = isEdit ? mockBusiness : undefined;

  const [name, setName] = useState(seed?.name ?? '');
  const [address, setAddress] = useState(seed?.address ?? '');
  const [phone, setPhone] = useState(seed?.phone ?? '');
  const [email, setEmail] = useState(seed?.email ?? '');
  const [website, setWebsite] = useState(seed?.website ?? '');
  const [taxNumber, setTaxNumber] = useState(seed?.taxNumber ?? '');
  const [invoicePrefix, setInvoicePrefix] = useState(seed?.invoicePrefix ?? 'INV-');
  const [currencyCode, setCurrencyCode] = useState(seed?.currencyCode ?? 'USD');
  const nameError = name.trim().length === 0 ? 'Business name is required' : undefined;

  function handleSave() {
    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.navigate('InvoiceTypeSelection', { fromOnboarding: true });
    }
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={isEdit ? 'Edit Business' : 'Create Business'} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

      <TouchableOpacity style={styles.logoPicker} accessibilityRole="button" accessibilityLabel="Change logo">
        <View style={[styles.logoCircle, { backgroundColor: seed?.logoColor ?? theme.colors.primary }]}>
          <Text style={styles.logoInitial}>{seed?.logoInitial ?? (name.slice(0, 2).toUpperCase() || '?')}</Text>
        </View>
        <View style={styles.logoBadge}>
          <Ionicons name="camera" size={14} color={theme.colors.textOnPrimary} />
        </View>
      </TouchableOpacity>

      <AppTextField label="Business name *" placeholder="e.g. Apex Consulting" value={name} onChangeText={setName} errorText={nameError} />
      <AppTextField label="Address" placeholder="Street, city, state" value={address} onChangeText={setAddress} />
      <AppTextField label="Phone" placeholder="+1 (555) 000-0000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <AppTextField label="Email" placeholder="hello@business.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <AppTextField label="Website" placeholder="www.business.com" autoCapitalize="none" value={website} onChangeText={setWebsite} />

      <Text style={styles.fieldLabel}>Currency</Text>
      <View style={styles.chipRow}>
        {CURRENCY_OPTIONS.map((option) => (
          <Chip key={option.code} label={option.code} selected={currencyCode === option.code} onPress={() => setCurrencyCode(option.code)} />
        ))}
      </View>

      <AppTextField label="Tax / VAT number" placeholder="Optional" value={taxNumber} onChangeText={setTaxNumber} />
      <AppTextField label="Invoice prefix" placeholder="INV-" value={invoicePrefix} onChangeText={setInvoicePrefix} />

      <AppButton label="Save" onPress={handleSave} disabled={!!nameError} style={styles.saveButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoPicker: { alignSelf: 'center', marginVertical: theme.spacing.md },
  logoCircle: { width: 88, height: 88, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { ...theme.typography.headlineLg, color: theme.colors.textOnPrimary },
  logoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
});
