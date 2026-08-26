import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export function StatCard({ label, value, sublabel, icon, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const accentColor = color ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
      )}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {sublabel && <Text style={[styles.sublabel, { color: colors.textTertiary }]}>{sublabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    minHeight: 96,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: 2,
  },
  sublabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
