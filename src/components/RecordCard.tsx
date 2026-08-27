import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BodyRecord, FoodItem, SportDetail } from '@/database/types';
import { formatDateWithWeekday } from '@/utils/date';
import { formatValue } from '@/utils/calculations';
import { TagChip } from './TagChip';
import { MealTypeOptions } from '@/constants/foodData';

function displayMetricValue(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '未记录';
  if (unit === '步' || unit === 'bpm') return String(Math.round(value));
  return formatValue(value);
}

interface RecordCardProps {
  record: BodyRecord;
  tags?: string[];
  onPress?: () => void;
}

export function RecordCard({ record, tags, onPress }: RecordCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const hasData = record.weight !== null || record.body_fat !== null || record.waist !== null;

  const metrics: { label: string; value: number | null; unit: string }[] = [
    { label: '体重', value: record.weight, unit: 'kg' },
    { label: '体脂', value: record.body_fat, unit: '%' },
    { label: '腰围', value: record.waist, unit: 'cm' },
    { label: '睡眠', value: record.sleep_duration, unit: 'h' },
    { label: '心率', value: record.heart_rate, unit: 'bpm' },
    { label: '步数', value: record.steps, unit: '步' },
  ].filter(m => m.value !== null);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
      disabled={!onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.date, { color: colors.text }]}>{formatDateWithWeekday(record.record_date)}</Text>
        {record.exercise_type !== 'none' && (
          <View style={[styles.exerciseBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.exerciseText, { color: colors.primary }]}>
              {record.exercise_type === 'strength' ? '力量' : record.exercise_type === 'cardio' ? '有氧' : '散步'}
            </Text>
          </View>
        )}
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricsRow}>
          {metrics.map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {displayMetricValue(m.value, m.unit)} <Text style={styles.metricUnit}>{m.unit}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>仅有备注/标签</Text>
      )}

      {(() => {
        if (!record.food_list) return null;
        try {
          const foods: FoodItem[] = JSON.parse(record.food_list);
          if (foods.length === 0) return null;
          const totalCal = foods.reduce((s, f) => s + f.cal, 0);
          return (
            <View style={[styles.subSection, { borderTopColor: colors.borderLight }]}>
              <View style={styles.subHeader}>
                <Icon name="restaurant-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>饮食 · {foods.length}项</Text>
                <Text style={[styles.subHeaderValue, { color: colors.text }]}>{totalCal} kcal</Text>
              </View>
              <View style={styles.subList}>
                {foods.slice(0, 4).map((f, i) => (
                  <Text key={i} style={[styles.subListItem, { color: colors.textSecondary }]}>
                    {f.name}{f.weight}g · {f.cal}kcal{f.mealType ? ` · ${MealTypeOptions.find(m => m.value === f.mealType)?.label ?? ''}` : ''}
                  </Text>
                ))}
                {foods.length > 4 && <Text style={[styles.subListItem, { color: colors.textTertiary }]}>...共{foods.length}项</Text>}
              </View>
            </View>
          );
        } catch { return null; }
      })()}

      {(() => {
        const src = record.sport_json ?? record.sport_list;
        if (!src) return null;
        try {
          const raw: any[] = JSON.parse(src);
          if (raw.length === 0) return null;
          const items: SportDetail[] = raw.map(it => ({
            type: it.type === 'strength' || it.type === 'cardio' ? it.type : 'cardio',
            actionName: it.actionName ?? it.name ?? '',
            durationMin: Number(it.durationMin ?? it.duration ?? 0),
            calorie: Number(it.calorie ?? it.calConsume ?? 0),
            sets: it.sets,
            reps: it.reps,
            weight: it.weight,
            muscle: it.muscle,
          }));
          const totalCal = items.reduce((s, sp) => s + (sp.calorie || 0), 0);
          return (
            <View style={[styles.subSection, { borderTopColor: colors.borderLight }]}>
              <View style={styles.subHeader}>
                <Icon name="barbell-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>运动 · {items.length}项</Text>
                <Text style={[styles.subHeaderValue, { color: colors.text }]}>{totalCal.toFixed(1)} kcal</Text>
              </View>
              <View style={styles.subList}>
                {items.slice(0, 4).map((s, i) => (
                  <Text key={i} style={[styles.subListItem, { color: colors.textSecondary }]}>
                    {s.type === 'strength'
                      ? `${s.actionName}${s.sets}组×${s.reps}次${s.weight ? ` ${s.weight}kg` : ''} · ${s.calorie?.toFixed(1)}kcal`
                      : `${s.actionName}${s.durationMin}分钟 · ${s.calorie?.toFixed(1)}kcal`}
                  </Text>
                ))}
                {items.length > 4 && <Text style={[styles.subListItem, { color: colors.textTertiary }]}>...共{items.length}项</Text>}
              </View>
            </View>
          );
        } catch { return null; }
      })()}

      {tags && tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, i) => (
            <TagChip key={i} label={tag} small />
          ))}
        </View>
      )}

      {record.remark ? (
        <Text style={[styles.remark, { color: colors.textSecondary }]} numberOfLines={2}>
          {record.remark}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  exerciseBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  exerciseText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  metricItem: {
    minWidth: 70,
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
  subSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    flex: 1,
  },
  subHeaderValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  subList: {
    paddingLeft: 2,
  },
  subListItem: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  remark: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});
