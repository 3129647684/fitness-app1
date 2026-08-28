import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BodyRecord } from '@/database/types';
import { formatDateWithWeekday } from '@/utils/date';
import { formatValue } from '@/utils/calculations';

// 精简版 RecordCard：仅展示 5 个核心指标
interface RecordCardProps {
  record: BodyRecord;
  onPress?: () => void;
}

export function RecordCard({ record, onPress }: RecordCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const metrics: { label: string; value: number | null; unit: string; color: string }[] = [
    { label: '体重', value: record.weight, unit: 'kg', color: '#22C55E' },
    { label: 'BMI', value: record.bmi, unit: '', color: '#3B82F6' },
    { label: '体脂', value: record.body_fat, unit: '%', color: '#EF4444' },
    { label: '腰围', value: record.waist, unit: 'cm', color: '#F59E0B' },
    { label: '睡眠', value: record.sleep_duration, unit: 'h', color: '#8B5CF6' },
  ].filter(m => m.value !== null && m.value !== undefined);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.md]}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dateDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.date, { color: colors.text }]}>{formatDateWithWeekday(record.record_date)}</Text>
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricsRow}>
          {metrics.map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>
                {formatValue(m.value)}
                {m.unit ? <Text style={[styles.metricUnit, { color: colors.textTertiary }]}> {m.unit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>暂无数据</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  date: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricItem: {
    minWidth: 60,
  },
  metricLabel: {
    fontSize: FontSize.xs,
  },
  metricValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: FontSize.xs,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
});
