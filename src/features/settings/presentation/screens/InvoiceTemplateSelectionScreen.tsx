import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockAppSettings, mockInvoiceTemplates } from '../../data/datasources/mock/mockSettings';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { useResponsive } from '../../../../app/theme/useResponsive';

/** Screen 24 — choose the visual PDF template, with a live-ish preview (Section 16). */
export function InvoiceTemplateSelectionScreen() {
  const navigation = useAppNavigation();
  const { columns } = useResponsive();
  const [selectedId, setSelectedId] = useState(mockAppSettings.invoiceTemplateId);

  return (
    <ScreenContainer>
      <ScreenHeader title="Invoice Template" onBack={() => navigation.goBack()} />
      <FlatList
        key={columns}
        data={mockInvoiceTemplates}
        keyExtractor={(t) => t.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity
              style={columns > 1 ? styles.gridItem : undefined}
              onPress={() => setSelectedId(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Card style={[styles.templateCard, isSelected && styles.templateCardSelected]}>
                <View style={[styles.preview, { borderColor: item.accentColor }]}>
                  <View style={[styles.previewHeader, { backgroundColor: item.accentColor }]} />
                  <View style={styles.previewLine} />
                  <View style={[styles.previewLine, styles.previewLineShort]} />
                  <View style={styles.previewLine} />
                </View>
                <View style={styles.templateInfoRow}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <Text style={styles.templateDescription} numberOfLines={2}>{item.description}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textTertiary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
      <AppButton label={`Use for ${mockBusiness.name}`} onPress={() => navigation.goBack()} style={styles.saveButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.md, gap: theme.spacing.sm },
  columnWrap: { gap: theme.spacing.sm },
  gridItem: { flex: 1 },
  templateCard: { marginBottom: theme.spacing.sm },
  templateCardSelected: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  preview: {
    height: 140, borderRadius: theme.radius.sm, borderWidth: 1, backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm, gap: 6, overflow: 'hidden',
  },
  previewHeader: { height: 24, borderRadius: 3, marginBottom: 4 },
  previewLine: { height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceAlt },
  previewLineShort: { width: '60%' },
  templateInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm, gap: theme.spacing.sm },
  templateInfo: { flex: 1 },
  templateName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  templateDescription: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  saveButton: { marginBottom: theme.spacing.md },
});
