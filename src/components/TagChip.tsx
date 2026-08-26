import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TagChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
}

export function TagChip({ label, color, selected, onPress, small }: TagChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tagColor = color ?? colors.primary;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          small && styles.chipSmall,
          {
            backgroundColor: selected ? tagColor : colors.surfaceVariant,
            borderColor: selected ? tagColor : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            small ? styles.labelSmall : styles.label,
            { color: selected ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.chip, small && styles.chipSmall, { backgroundColor: tagColor + '15', borderColor: tagColor + '30' }]}>
      <Text style={[small ? styles.labelSmall : styles.label, { color: tagColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipSmall: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
