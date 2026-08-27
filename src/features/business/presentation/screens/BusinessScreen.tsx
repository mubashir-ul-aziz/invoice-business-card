import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { Card } from '../../../../core/components/Card';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../data/datasources/mock/mockBusiness';
import { RootStackParamList } from '../../../../app/navigation/types';

interface LinkItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: keyof RootStackParamList;
}

const LINKS: LinkItem[] = [
  { icon: 'pricetags-outline', label: 'Invoice Types', description: 'Configure General, Weight, Dimension & custom types', route: 'InvoiceTypeSelection' },
  { icon: 'cube-outline', label: 'Items Catalog', description: 'Manage products and services you sell', route: 'ItemList' },
  { icon: 'card-outline', label: 'Digital Business Card', description: 'Preview and share your shareable profile', route: 'DigitalBusinessCard' },
  { icon: 'options-outline', label: 'Settings', description: 'Currency, tax defaults, invoice template', route: 'Settings' },
  { icon: 'cloud-upload-outline', label: 'Backup & Restore', description: 'Google Drive backup and restore history', route: 'BackupRestore' },
];

/** Screen 4 — Business/Company hub: profile summary + navigation to related settings (tab root). */
export function BusinessScreen() {
  const navigation = useAppNavigation();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Business</Text>

        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.logoCircle, { backgroundColor: mockBusiness.logoColor }]}>
              <Text style={styles.logoInitial}>{mockBusiness.logoInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.businessName}>{mockBusiness.name}</Text>
              <Text style={styles.businessMeta} numberOfLines={1}>{mockBusiness.email}</Text>
              <Text style={styles.businessMeta} numberOfLines={1}>{mockBusiness.phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateBusiness', { mode: 'edit' })}
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.editLabel}>Edit profile</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.linkList}>
          {LINKS.map((link) => (
            <TouchableOpacity
              key={link.route}
              style={styles.linkRow}
              onPress={() => navigation.navigate(link.route as never)}
              accessibilityRole="button"
            >
              <View style={styles.linkIcon}>
                <Ionicons name={link.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkDescription} numberOfLines={1}>{link.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xl },
  screenTitle: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },
  profileCard: { marginBottom: theme.spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  logoCircle: { width: 56, height: 56, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { ...theme.typography.headlineMd, color: theme.colors.textOnPrimary },
  profileInfo: { flex: 1 },
  businessName: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  businessMeta: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.md, alignSelf: 'flex-start' },
  editLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  linkList: { gap: theme.spacing.sm },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1 },
  linkLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  linkDescription: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
});
