import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  disabled?: boolean;
  optional?: boolean;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  keyboardType = 'decimal-pad',
  multiline = false,
  disabled = false,
  optional = false,
}: InputFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        {optional && <Text style={[styles.optionalTag, { color: colors.textTertiary }]}>选填</Text>}
      </View>
      <View style={[
        styles.inputRow,
        {
          borderColor: disabled ? colors.border : colors.border,
          backgroundColor: disabled ? colors.surfaceVariant : colors.surface,
        },
      ]}>
        <TextInput
          style={[
            styles.input,
            { color: disabled ? colors.textTertiary : colors.text },
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? `输入${label}`}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={!disabled}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {unit && <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '400',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unit: {
    fontSize: FontSize.sm,
    marginLeft: 4,
  },
});
