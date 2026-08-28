import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { useCustomerFormStore } from '../state/customerFormStore';

/** Screen 10 — Add/Edit Customer (Section 16, Phase 8). */
export function CreateCustomerScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateCustomer'>();
  const customerId = route.params?.customerId;
  const isEdit = !!customerId;

  const {
    name,
    phone,
    email,
    address,
    notes,
    status,
    fieldErrors,
    errorMessage,
    setField,
    startCreate,
    loadForEdit,
    save,
  } = useCustomerFormStore();

  useEffect(() => {
    if (customerId) {
      loadForEdit(customerId);
    } else {
      startCreate();
    }
    // Only re-run if the screen's target customer actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const nameError = fieldErrors.name || (name.trim().length === 0 ? 'Customer name is required' : undefined);
  const canSave = !nameError && status !== 'saving';

  async function handleSave() {
    const saved = await save();
    if (saved) navigation.goBack();
  }

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <ScreenHeader title={isEdit ? 'Edit Customer' : 'Add Customer'} onBack={() => navigation.goBack()} />
        <LoadingState label="Loading customer…" />
      </ScreenContainer>
    );
  }

  if (isEdit && status === 'error' && !name) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Edit Customer" onBack={() => navigation.goBack()} />
        <ErrorState message={errorMessage || 'Could not load this customer.'} onRetry={() => loadForEdit(customerId!)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={isEdit ? 'Edit Customer' : 'Add Customer'} onBack={() => navigation.goBack()} />

      <AppTextField
        label="Name *"
        placeholder="Customer or company name"
        value={name}
        onChangeText={(text) => setField('name', text)}
        errorText={nameError}
      />
      <AppTextField
        label="Phone"
        placeholder="+1 (555) 000-0000"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => setField('phone', text)}
      />
      <AppTextField
        label="Email"
        placeholder="name@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => setField('email', text)}
      />
      <AppTextField
        label="Address"
        placeholder="Street, city, state"
        value={address}
        onChangeText={(text) => setField('address', text)}
        multiline
      />
      <AppTextField
        label="Notes"
        placeholder="Optional"
        value={notes}
        onChangeText={(text) => setField('notes', text)}
        multiline
      />

      {status === 'error' && errorMessage && Object.keys(fieldErrors).length === 0 ? (
        <Text style={styles.formError}>{errorMessage}</Text>
      ) : null}

      <AppButton
        label="Save Customer"
        disabled={!canSave}
        loading={status === 'saving'}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
});
