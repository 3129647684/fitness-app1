import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  change?: { value: number; direction: 'up' | 'down' | 'flat' } | null;
}

// 常用指标默认图标
const DEFAULT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  体重: 'scale-outline',
  'BMI': 'analytics-outline',
  腰围: 'resize-outline',
  睡眠: 'moon-outline',
  体脂率: 'pie-chart-outline',
  肌肉量: 'barbell-outline',
  水分率: 'water-outline',
  基础代谢: 'flame-outline',
  摄入热量: 'restaurant-outline',
  运动消耗: 'walk-outline',
};

export function MetricCard({ label, value, unit, icon, color, change }: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const displayValue = value === null || value === undefined || value === '' ? '未记录' : String(value);
  const isEmpty = value === null || value === undefined || value === '';
  const accent = color ?? colors.primary;
  const cardIcon = icon ?? DEFAULT_ICONS[label] ?? 'ellipse-outline';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.sm]}>
      <View style={[styles.iconWrap, { backgroundColor: isEmpty ? colors.surfaceVariant : accent + (colorScheme === 'dark' ? '33' : '1A') }]}>
        <Ionicons name={cardIcon} size={15} color={isEmpty ? colors.textTertiary : accent} />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.value, { color: isEmpty ? colors.textTertiary : accent }]}
        >
          {displayValue}
        </Text>
        {unit && !isEmpty && (
          <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>
        )}
      </View>
      {change && change.value > 0 && (
        <View style={styles.changeRow}>
          <Ionicons name={change.direction === 'up' ? 'trending-up' : 'trending-down'} size={12} color={change.direction === 'up' ? colors.danger : colors.success} />
          <Text style={[styles.change, { color: change.direction === 'up' ? colors.danger : colors.success }]}>
            {change.value}
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
    borderWidth: 1,
    minHeight: 96,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  change: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});