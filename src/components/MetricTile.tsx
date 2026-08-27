import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, IconName } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';

interface MetricTileProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon: IconName;
  onPress?: () => void;
}

// 首页指标卡片：左侧圆形图标 + 标题/数值 + 右箭头（对齐设计稿）
export function MetricTile({ label, value, unit, icon, onPress }: MetricTileProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;

  const isEmpty = value === null || value === undefined || value === '';

  const body = (
    <>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surfaceVariant,
            width: tokens.isCompact ? 36 : 42,
            height: tokens.isCompact ? 36 : 42,
            borderRadius: r.full,
          },
        ]}
      >
        <Icon name={icon} size={tokens.isCompact ? 17 : 19} color={colors.primary} />
      </View>
      <View style={styles.tileBody}>
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: f.sm }]}>{label}</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.value,
            {
              color: isEmpty ? colors.primary : colors.text,
              fontSize: isEmpty ? f.lg : f.xxl,
              fontWeight: isEmpty ? '600' : '800',
            },
          ]}
        >
          {isEmpty ? '未记录' : `${value}${unit ? ` ${unit}` : ''}`}
        </Text>
      </View>
      <Icon name="chevron-forward" size={tokens.isCompact ? 15 : 17} color={colors.textTertiary} />
    </>
  );

  const cardStyle = [
    styles.tile,
    {
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
      borderRadius: r.lg,
      padding: s.md + (tokens.isCompact ? 0 : 2),
      minHeight: tokens.isCompact ? 80 : 92,
      flexBasis: '48%' as const,
      maxWidth: '48%' as const,
    },
    Shadows.sm,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {
    flex: 1,
    marginLeft: Spacing.sm + 2,
    minWidth: 0,
  },
  label: {
    fontWeight: '500',
    marginBottom: 3,
  },
  value: {
    letterSpacing: -0.4,
  },
});
