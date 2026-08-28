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

  const metrics: { label: string; value: number | null; unit: string; color: string }[] = [
    { label: '体重', value: record.weight, unit: 'kg', color: '#22C55E' },
    { label: '体脂', value: record.body_fat, unit: '%', color: '#EF4444' },
    { label: '腰围', value: record.waist, unit: 'cm', color: '#F59E0B' },
    { label: '睡眠', value: record.sleep_duration, unit: 'h', color: '#8B5CF6' },
    { label: '心率', value: record.heart_rate, unit: 'bpm', color: '#EF4444' },
    { label: '步数', value: record.steps, unit: '步', color: '#22C55E' },
  ].filter(m => m.value !== null);

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
        {record.exercise_type !== 'none' && (
          <View style={[styles.exerciseBadge, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="fitness-outline" size={12} color={colors.primary} />
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
              <Text style={[styles.metricValue, { color: m.color }]}>
                {displayMetricValue(m.value, m.unit)}
                <Text style={[styles.metricUnit, { color: colors.textTertiary }]}> {m.unit}</Text>
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
                <View style={[styles.subIconWrap, { backgroundColor: '#F97316' + '18' }]}>
                  <Icon name="restaurant-outline" size={12} color="#F97316" />
                </View>
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>饮食 · {foods.length}项</Text>
                <Text style={[styles.subHeaderValue, { color: '#F97316' }]}>{totalCal} kcal</Text>
              </View>
              <View style={styles.subList}>
                {foods.slice(0, 4).map((f, i) => (
                  <Text key={i} style={[styles.subListItem, { color: colors.textTertiary }]}>
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
                <View style={[styles.subIconWrap, { backgroundColor: '#EF4444' + '18' }]}>
                  <Icon name="barbell-outline" size={12} color="#EF4444" />
                </View>
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>运动 · {items.length}项</Text>
                <Text style={[styles.subHeaderValue, { color: '#EF4444' }]}>{totalCal.toFixed(1)} kcal</Text>
              </View>
              <View style={styles.subList}>
                {items.slice(0, 4).map((s, i) => (
                  <Text key={i} style={[styles.subListItem, { color: colors.textTertiary }]}>
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
        <View style={[styles.remarkWrap, { borderLeftColor: colors.primary + '40' }]}>
          <Text style={[styles.remark, { color: colors.textTertiary }]} numberOfLines={2}>
            {record.remark}
          </Text>
        </View>
      ) : null}
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
  exerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    gap: Spacing.md,
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
  subIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  remarkWrap: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.sm + 2,
    marginTop: Spacing.sm,
  },
  remark: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});