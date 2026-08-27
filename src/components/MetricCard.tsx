import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon?: IconName;
  color?: string;
  change?: { value: number; direction: 'up' | 'down' | 'flat' } | null;
}

// 常用指标默认图标
const DEFAULT_ICONS: Record<string, IconName> = {
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
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;

  const displayValue = value === null || value === undefined || value === '' ? '未记录' : String(value);
  const isEmpty = value === null || value === undefined || value === '';
  const accent = color ?? colors.primary;
  const cardIcon = icon ?? DEFAULT_ICONS[label] ?? 'ellipse-outline';

  // 窄屏时每列占 48%（保留 gap 间距），保证两列对齐、单卡片不挤压
  const cardWidth = tokens.isCompact
    ? { flexBasis: '48%' as const, maxWidth: '48%' as const }
    : undefined;

  return (
    <View style={[
      styles.card,
      cardWidth,
      {
        backgroundColor: colors.card,
        borderColor: colors.borderLight,
        padding: s.md + (tokens.isCompact ? 0 : 2),
        borderRadius: r.lg,
        minHeight: tokens.isCompact ? 88 : 96,
        minWidth: tokens.isCompact ? 0 : 140,
      },
      Shadows.sm,
    ]}>
      <View style={[styles.iconWrap, {
        backgroundColor: isEmpty ? colors.surfaceVariant : accent + (colorScheme === 'dark' ? '33' : '1A'),
        width: tokens.isCompact ? 24 : 28,
        height: tokens.isCompact ? 24 : 28,
        borderRadius: r.sm,
        marginBottom: s.sm,
      }]}>
        <Icon name={cardIcon} size={tokens.isCompact ? 13 : 15} color={isEmpty ? colors.textTertiary : accent} />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: f.sm }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.value, {
            color: isEmpty ? colors.textTertiary : accent,
            fontSize: tokens.isCompact ? f.xxl : f.xxxl,
          }]}
        >
          {displayValue}
        </Text>
        {unit && !isEmpty && (
          <Text style={[styles.unit, { color: colors.textTertiary, fontSize: f.xs }]}>{unit}</Text>
        )}
      </View>
      {change && change.value > 0 && (
        <View style={styles.changeRow}>
          <Icon
            name={change.direction === 'up' ? 'trending-up' : 'trending-down'}
            size={tokens.isCompact ? 11 : 12}
            color={change.direction === 'up' ? colors.danger : colors.success}
          />
          <Text style={[styles.change, {
            color: change.direction === 'up' ? colors.danger : colors.success,
            fontSize: f.xs,
          }]}>
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
    borderWidth: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    fontWeight: '500',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  change: {
    fontWeight: '700',
  },
});