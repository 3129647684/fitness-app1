import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, MetricLabels } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TrendChart } from '@/components/TrendChart';
import { StatCard } from '@/components/StatCard';
import { getRecords, getActiveGoals, getRecordsByDateRange } from '@/database/db';
import { BodyRecord, Goal, TimeRange, ChartMetric, FoodItem } from '@/database/types';
import { getDateNDaysAgo } from '@/utils/date';
import type { StatsScreenProps } from '@/navigation/RootNavigator';

const METRICS: ChartMetric[] = ['weight', 'body_fat', 'waist', 'sleep_duration', 'bmi', 'chest', 'hip', 'thigh', 'heart_rate', 'steps', 'neck', 'food_cal', 'sport_cal'];
const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
  { value: 'all', label: '全部' },
];

function sportTotalCal(r: BodyRecord): number | null {
  const src = r.sport_json ?? r.sport_list;
  if (!src) return null;
  try {
    const raw: any[] = JSON.parse(src);
    if (!raw.length) return null;
    return raw.reduce((s, sp) => s + (Number(sp.calorie ?? sp.calConsume ?? 0)), 0);
  } catch {
    return r.sport_total_cal ?? null;
  }
}

export default function StatsScreen(_props: StatsScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('weight');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');
  const [chartData, setChartData] = useState<{ date: string; value: number | null }[]>([]);
  const [allRecords, setAllRecords] = useState<BodyRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const loadData = async () => {
    let records: BodyRecord[];
    if (selectedRange === 'all') {
      records = await getRecords();
      records.reverse();
    } else {
      const days = parseInt(selectedRange);
      const startDate = getDateNDaysAgo(days);
      const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      records = await getRecordsByDateRange(startDate, today);
    }
    setAllRecords(records);

    const data = records.map(r => {
      let value: number | null = null;
      if (selectedMetric === 'food_cal') {
        if (r.food_list) {
          try {
            const foods: FoodItem[] = JSON.parse(r.food_list);
            value = foods.reduce((s, f) => s + f.cal, 0);
          } catch {}
        }
      } else if (selectedMetric === 'sport_cal') {
        value = sportTotalCal(r);
      } else {
        value = (r as any)[selectedMetric] as number | null;
      }
      return { date: r.record_date, value };
    });
    setChartData(data);

    const g = await getActiveGoals();
    setGoals(g);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedMetric, selectedRange])
  );

  const currentGoal = goals.find(g => g.goal_type === selectedMetric || (selectedMetric === 'weight' && g.goal_type === 'weight'));
  const metricInfo = MetricLabels[selectedMetric];

  function extractMetricValue(r: BodyRecord, metric: ChartMetric): number | null {
    if (metric === 'food_cal') {
      if (!r.food_list) return null;
      try { return JSON.parse(r.food_list).reduce((s: number, f: FoodItem) => s + f.cal, 0); } catch { return null; }
    }
    if (metric === 'sport_cal') {
      return sportTotalCal(r);
    }
    return (r as any)[metric] as number | null;
  }

  const firstRecord = allRecords[0];
  const lastRecord = allRecords[allRecords.length - 1];
  const firstValue = firstRecord ? extractMetricValue(firstRecord, selectedMetric) : null;
  const lastValue = lastRecord ? extractMetricValue(lastRecord, selectedMetric) : null;
  const totalChange = firstValue !== null && lastValue !== null
    ? Math.round((lastValue - firstValue) * 10) / 10
    : null;

  const values = allRecords
    .map(r => extractMetricValue(r, selectedMetric))
    .filter(v => v !== null && v !== undefined) as number[];

  const avgValue = values.length > 0
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : null;
  const minValue = values.length > 0 ? Math.min(...values) : null;
  const maxValue = values.length > 0 ? Math.max(...values) : null;

  const exerciseCount = allRecords.filter(r => r.exercise_type !== 'none').length;
  const avgSleep = allRecords.filter(r => r.sleep_duration !== null).reduce((sum, r) => sum + (r.sleep_duration || 0), 0);
  const sleepCount = allRecords.filter(r => r.sleep_duration !== null).length;
  const avgSleepValue = sleepCount > 0 ? Math.round((avgSleep / sleepCount) * 10) / 10 : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 100 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>统计图表</Text>
      </View>

      <View style={styles.metricSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {METRICS.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMetric(m)}
              style={[
                styles.metricBtn,
                {
                  backgroundColor: selectedMetric === m ? colors.primary : colors.surfaceVariant,
                  borderColor: selectedMetric === m ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ color: selectedMetric === m ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' }}>
                {MetricLabels[m]?.label ?? m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.rangeSelector}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r.value}
            onPress={() => setSelectedRange(r.value)}
            style={[
              styles.rangeBtn,
              {
                backgroundColor: selectedRange === r.value ? colors.primary : colors.surfaceVariant,
                borderColor: selectedRange === r.value ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={{ color: selectedRange === r.value ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' }}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {metricInfo?.label}趋势
        </Text>
        <TrendChart
          data={chartData}
          metricLabel={metricInfo?.label ?? ''}
          unit={metricInfo?.unit ?? ''}
          targetLine={currentGoal?.target_value ?? null}
          height={240}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{metricInfo?.label}汇总</Text>
        <View style={styles.statGrid}>
          <StatCard label="起始值" value={firstValue !== null ? firstValue.toFixed(1) : '--'} unit={metricInfo?.unit} icon="play-outline" />
          <StatCard label="当前值" value={lastValue !== null ? lastValue.toFixed(1) : '--'} unit={metricInfo?.unit} icon="flag-outline" color={colors.primary} />
          <StatCard
            label="总变化"
            value={totalChange !== null ? (totalChange > 0 ? '+' : '') + totalChange.toFixed(1) : '--'}
            unit={metricInfo?.unit}
            icon="trending-up-outline"
            color={totalChange !== null && totalChange > 0 ? colors.danger : colors.success}
          />
          <StatCard label="平均值" value={avgValue !== null ? avgValue.toFixed(1) : '--'} unit={metricInfo?.unit} icon="analytics-outline" />
          <StatCard label="最低值" value={minValue !== null ? minValue.toFixed(1) : '--'} unit={metricInfo?.unit} icon="arrow-down-outline" color={colors.success} />
          <StatCard label="最高值" value={maxValue !== null ? maxValue.toFixed(1) : '--'} unit={metricInfo?.unit} icon="arrow-up-outline" color={colors.danger} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>综合统计</Text>
        <View style={styles.statGrid}>
          <StatCard label="记录天数" value={allRecords.length} unit="天" icon="calendar-outline" />
          <StatCard label="运动次数" value={exerciseCount} unit="次" icon="barbell-outline" color={colors.accent} />
          <StatCard label="平均睡眠" value={avgSleepValue ?? '--'} unit="h" icon="moon-outline" color={colors.warning} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  metricSelector: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
  },
  metricBtn: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rangeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  chartSection: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm + 2,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm + 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 2,
  },
});
