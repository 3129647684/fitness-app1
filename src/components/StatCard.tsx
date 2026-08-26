import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export function StatCard({ label, value, unit, sublabel, icon, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const accentColor = color ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.sm]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accentColor + (colorScheme === 'dark' ? '33' : '17') },
          ]}
        >
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
      )}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text> : null}
      </View>
      {sublabel ? <Text style={[styles.sublabel, { color: colors.textTertiary }]}>{sublabel}</Text> : null}
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
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
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
    marginTop: 2,
  },
});