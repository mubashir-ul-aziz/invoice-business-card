import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { SearchBar } from '../../../../core/components/SearchBar';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { Avatar } from '../../../../core/components/Avatar';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockInvoiceTypes } from '../../../invoiceType/data/datasources/mock/mockInvoiceTypes';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { WizardSteps } from '../components/WizardSteps';

/** Screen 14 — Create Invoice, step 1: pick customer + invoice metadata (Section 16). */
export function CreateInvoiceCustomerScreen() {
  const navigation = useAppNavigation();
  const [query, setQuery] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [invoiceTypeId, setInvoiceTypeId] = useState(mockBusiness.defaultInvoiceTypeId ?? mockInvoiceTypes[0].id);

  const today = useMemo(() => new Date('2026-08-27'), []);
  const dueDate = useMemo(() => new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), [today]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockCustomers;
    return mockCustomers.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const nextInvoiceNumber = `${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`;

  return (
    <ScreenContainer>
      <ScreenHeader title="New Invoice" subtitle={nextInvoiceNumber} onBack={() => navigation.goBack()} />
      <WizardSteps currentStep={0} />

      <SearchBar value={query} onChangeText={setQuery} placeholder="Search or select a customer" />

      <FlatList
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        style={styles.customerList}
        contentContainerStyle={styles.customerListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text
            style={styles.newCustomerLink}
            onPress={() => navigation.navigate('CreateCustomer', undefined)}
          >
            + New Customer
          </Text>
        }
        renderItem={({ item }) => {
          const selected = item.id === customerId;
          return (
            <TouchableOpacity
              style={[styles.customerRow, selected && styles.customerRowSelected]}
              onPress={() => setCustomerId(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Avatar name={item.name} size={36} />
              <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.fieldLabel}>Invoice type</Text>
      <View style={styles.chipRow}>
        {mockInvoiceTypes.map((type) => (
          <Chip key={type.id} label={type.name} selected={invoiceTypeId === type.id} onPress={() => setInvoiceTypeId(type.id)} />
        ))}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Issue date</Text>
          <Text style={styles.dateValue}>{formatDate(today)}</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Due date</Text>
          <Text style={styles.dateValue}>{formatDate(dueDate)}</Text>
        </View>
      </View>

      <AppButton
        label="Next: Add Items"
        disabled={!customerId}
        onPress={() =>
          customerId &&
          navigation.navigate('CreateInvoiceItems', {
            customerId,
            invoiceTypeId,
            issueDate: today.toISOString(),
            dueDate: dueDate.toISOString(),
          })
        }
        style={styles.nextButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  customerList: { maxHeight: 220, marginTop: theme.spacing.sm },
  customerListContent: { gap: theme.spacing.xs },
  newCustomerLink: { ...theme.typography.bodyStrong, color: theme.colors.primary, paddingVertical: theme.spacing.sm },
  customerRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  customerRowSelected: { backgroundColor: theme.colors.primaryLight },
  customerName: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  dateRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  dateBox: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm },
  dateLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  dateValue: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },
  nextButton: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
});
