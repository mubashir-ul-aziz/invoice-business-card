import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';

/** Screen 10 — Add/Edit Customer (Section 16). */
export function CreateCustomerScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateCustomer'>();
  const existing = route.params?.customerId ? mockCustomers.find((c) => c.id === route.params?.customerId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const nameError = name.trim().length === 0 ? 'Customer name is required' : undefined;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={isEdit ? 'Edit Customer' : 'Add Customer'} onBack={() => navigation.goBack()} />

      <AppTextField label="Name *" placeholder="Customer or company name" value={name} onChangeText={setName} errorText={nameError} />
      <AppTextField label="Phone" placeholder="+1 (555) 000-0000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <AppTextField label="Email" placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <AppTextField label="Address" placeholder="Street, city, state" value={address} onChangeText={setAddress} multiline />
      <AppTextField label="Notes" placeholder="Optional" value={notes} onChangeText={setNotes} multiline />

      <AppButton label="Save Customer" disabled={!!nameError} onPress={() => navigation.goBack()} style={styles.saveButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
});
