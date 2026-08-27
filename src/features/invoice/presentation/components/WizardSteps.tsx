import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';

const STEPS = ['Customer', 'Items', 'Review'];

interface WizardStepsProps {
  currentStep: 0 | 1 | 2;
}

/** Lightweight 3-step progress indicator shown across the invoice creation wizard. */
export function WizardSteps({ currentStep }: WizardStepsProps) {
  return (
    <View style={styles.row}>
      {STEPS.map((label, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        return (
          <React.Fragment key={label}>
            <View style={styles.step}>
              <View style={[styles.dot, (isActive || isDone) && styles.dotActive]}>
                <Text style={[styles.dotLabel, (isActive || isDone) && styles.dotLabelActive]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
            </View>
            {index < STEPS.length - 1 ? <View style={[styles.connector, isDone && styles.connectorActive]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  step: { alignItems: 'center', gap: 4 },
  dot: {
    width: 26, height: 26, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: theme.colors.primary },
  dotLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary },
  dotLabelActive: { color: theme.colors.textOnPrimary },
  stepLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  stepLabelActive: { color: theme.colors.textPrimary, fontWeight: '600' },
  connector: { flex: 1, height: 2, backgroundColor: theme.colors.surfaceAlt, marginHorizontal: 6, marginBottom: 16 },
  connectorActive: { backgroundColor: theme.colors.primary },
});
