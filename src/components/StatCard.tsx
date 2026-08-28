import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  icon?: IconName;
  color?: string;
}

export function StatCard({ label, value, unit, sublabel, icon, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const accentColor = color ?? colors.primary;

  // 选择发光阴影
  const getShadow = () => {
    if (!accentColor) return Shadows.sm;
    if (accentColor === '#EF4444') return Shadows.glowRed;
    if (accentColor === '#22C55E') return Shadows.glowGreen;
    if (accentColor === '#3B82F6') return Shadows.glowBlue;
    return Shadows.sm;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }, getShadow()]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accentColor + (colorScheme === 'dark' ? '33' : '17') },
          ]}
        >
          <Icon name={icon} size={20} color={accentColor} />
        </View>
      )}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text> : null}
      </View>
      {sublabel ? <Text style={[styles.sublabel, { color: colors.textTertiary }]}>{sublabel}</Text> : null}
    </View>
  );
}

const styles =StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    minHeight: 104,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm + 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 4,
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
  sublabel: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});