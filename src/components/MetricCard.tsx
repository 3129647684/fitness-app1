import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon?: string;
  color?: string;
  change?: { value: number; direction: 'up' | 'down' | 'flat' } | null;
}

export function MetricCard({ label, value, unit, icon, color, change }: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const displayValue = value === null || value === undefined || value === '' ? '未记录' : String(value);
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { color: isEmpty ? colors.textTertiary : color ?? colors.text },
          ]}
        >
          {displayValue}
        </Text>
        {unit && !isEmpty && (
          <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
        )}
      </View>
      {change && change.value > 0 && (
        <View style={styles.changeRow}>
          <Text style={[styles.change, { color: change.direction === 'up' ? colors.danger : colors.success }]}>
            {change.direction === 'up' ? '↑' : '↓'} {change.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    minHeight: 88,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  unit: {
    fontSize: FontSize.sm,
  },
  changeRow: {
    marginTop: 2,
  },
  change: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
