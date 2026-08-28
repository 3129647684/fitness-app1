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

  // 统计值格式化：整数指标（步数/心率/热量）不显示小数
  const fmtStat = (v: number | null | undefined): string => {
    if (v === null || v === undefined) return '--';
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + Spacing.lg,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: BorderRadius.xl,
          borderBottomRightRadius: BorderRadius.xl,
          ...Shadows.sm,
        },
      ]}>
        <Text style={[styles.title, { color: colors.text }]}>统计图表</Text>
        <Text style={[styles.headerSub, { color: colors.textTertiary }]}>追踪你的身体变化趋势</Text>
      </View>

      <View style={styles.metricSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {METRICS.map(m => {
            const ml = MetricLabels[m];
            const on = selectedMetric === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMetric(m)}
                style={[
                  styles.metricBtn,
                  {
                    backgroundColor: on ? colors.primary : colors.surfaceVariant,
                    borderColor: on ? colors.primary : colors.borderLight,
                    ...(on ? Shadows.sm : {}),
                  },
                ]}
                activeOpacity={0.7}
              >
                {ml?.icon && (
                  <Icons name={ml.icon} size={14} color={on ? '#FFF' : colors.textSecondary} />
                )}
                <Text style={{ color: on ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2, marginLeft: ml?.icon ? 4 : 0 }}>
                  {ml?.label ?? m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.rangeSelector}>
        {RANGES.map(r => {
          const on = selectedRange === r.value;
          return (
            <TouchableOpacity
              key={r.value}
              onPress={() => setSelectedRange(r.value)}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor: on ? colors.primary : colors.surfaceVariant,
                  borderColor: on ? colors.primary : colors.borderLight,
                  ...(on ? Shadows.sm : {}),
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ color: on ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2 }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.md]}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIndicator, { backgroundColor: colors.primary }]} />
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {metricInfo?.label}趋势
          </Text>
        </View>
        <TrendChart
          data={chartData}
          metricLabel={metricInfo?.label ?? ''}
          unit={metricInfo?.unit ?? ''}
          targetLine={currentGoal?.target_value ?? null}
          height={240}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: Colors.dynamic.heart || '#22C55E' }]} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{metricInfo?.label}汇总</Text>
        </View>
        <View style={styles.statGrid}>
          <StatCard label="起始值" value={fmtStat(firstValue)} unit={metricInfo?.unit} icon="play-outline" />
          <StatCard label="当前值" value={fmtStat(lastValue)} unit={metricInfo?.unit} icon="flag-outline" color={colors.primary} />
          <StatCard
            label="总变化"
            value={totalChange !== null ? (totalChange > 0 ? '+' : '') + fmtStat(totalChange) : '--'}
            unit={metricInfo?.unit}
            icon="trending-up-outline"
            color={totalChange !== null && totalChange > 0 ? colors.danger : colors.success}
          />
          <StatCard label="平均值" value={fmtStat(avgValue)} unit={metricInfo?.unit} icon="analytics-outline" />
          <StatCard label="最低值" value={fmtStat(minValue)} unit={metricInfo?.unit} icon="arrow-down-outline" color={colors.success} />
          <StatCard label="最高值" value={fmtStat(maxValue)} unit={metricInfo?.unit} icon="arrow-up-outline" color={colors.danger} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: Colors.dynamic.coach || '#3B82F6' }]} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>综合统计</Text>
        </View>
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
    paddingBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.sm, marginTop: 2, opacity: 0.8 },
  metricSelector: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  metricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: Spacing.lg,
  },
  rangeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  chartSection: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chartIndicator: {
    width: 8,
    height: 24,
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIndicator: {
    width: 6,
    height: 20,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
