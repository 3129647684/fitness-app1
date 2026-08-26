import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MetricCard } from '@/components/MetricCard';
import { MiniChart } from '@/components/MiniChart';
import { TagChip } from '@/components/TagChip';
import { getTodayRecord, getRecentRecords, getRecordTags, getUserProfile } from '@/database/db';
import { BodyRecord, UserProfile, FoodItem, SportItem } from '@/database/types';
import { calcBMI, getBMICategory, formatValue, calcChange } from '@/utils/calculations';
import { formatDateWithWeekday } from '@/utils/date';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [todayRecord, setTodayRecord] = useState<BodyRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<BodyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayTags, setTodayTags] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    const today = await getTodayRecord();
    setTodayRecord(today);

    const recent = await getRecentRecords(7);
    setRecentRecords(recent);

    const p = await getUserProfile();
    setProfile(p);

    if (today?.id) {
      const tags = await getRecordTags(today.id);
      setTodayTags(tags.map(t => t.tag_name));
    } else {
      setTodayTags([]);
    }
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const hasRecord = todayRecord !== null;
  const bmi = todayRecord?.bmi ?? calcBMI(todayRecord?.weight ?? null, profile?.height ?? null);

  let todayFoodCal: number | null = null;
  let todaySportCal: number | null = null;
  if (todayRecord?.food_list) {
    try {
      const foods: FoodItem[] = JSON.parse(todayRecord.food_list);
      todayFoodCal = foods.reduce((sum, f) => sum + f.cal, 0);
    } catch {}
  }
  if (todayRecord?.sport_list) {
    try {
      const sports: SportItem[] = JSON.parse(todayRecord.sport_list);
      todaySportCal = sports.reduce((sum, s) => sum + s.calConsume, 0);
    } catch {}
  }
  const bmiCategory = getBMICategory(bmi);

  const chartData = recentRecords
    .filter(r => r.weight !== null)
    .map(r => ({ date: r.record_date, value: r.weight }));

  const weightChange = recentRecords.length >= 2
    ? calcChange(
        recentRecords[recentRecords.length - 1]?.weight ?? null,
        recentRecords[0]?.weight ?? null
      )
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDateWithWeekday(todayStr)}</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {hasRecord ? '今日已完成记录' : '今日待录入'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: hasRecord ? colors.successLight : colors.warningLight }]}>
          <Ionicons name={hasRecord ? 'checkmark-circle' : 'alert-circle'} size={16} color={hasRecord ? colors.success : colors.warning} />
          <Text style={[styles.statusText, { color: hasRecord ? colors.success : colors.warning }]}>
            {hasRecord ? '已完成' : '待录入'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.quickButton, { backgroundColor: colors.primary }, Shadows.md]}
        onPress={() => router.push('/(tabs)/record')}
        activeOpacity={0.85}
      >
        <Ionicons name={hasRecord ? 'create' : 'add-circle'} size={22} color="#FFFFFF" />
        <Text style={styles.quickButtonText}>
          {hasRecord ? '编辑今日记录' : '新增今日记录'}
        </Text>
      </TouchableOpacity>

      {(todayFoodCal !== null || todaySportCal !== null) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>今日热量</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="摄入热量"
              value={todayFoodCal}
              unit="kcal"
              color={colors.info}
            />
            <MetricCard
              label="运动消耗"
              value={todaySportCal}
              unit="kcal"
              color={colors.warning}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>核心数据</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="体重"
            value={todayRecord?.weight ?? null}
            unit="kg"
            change={weightChange}
          />
          <MetricCard
            label="BMI"
            value={bmi}
            color={bmiCategory.color}
          />
          <MetricCard
            label="腰围"
            value={todayRecord?.waist ?? null}
            unit="cm"
          />
          <MetricCard
            label="睡眠"
            value={todayRecord?.sleep_duration ?? null}
            unit="h"
          />
        </View>
      </View>

      {todayRecord?.body_fat !== null && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>体成分</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" />
            <MetricCard label="肌肉量" value={todayRecord?.muscle_mass ?? null} unit="kg" />
            <MetricCard label="水分率" value={todayRecord?.water_rate ?? null} unit="%" />
            <MetricCard label="基础代谢" value={todayRecord?.bmr ?? null} unit="kcal" />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>近7天体重趋势</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <MiniChart data={chartData} height={80} />
          <View style={styles.chartFooter}>
            {chartData.length > 0 ? (
              <>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                  最近: {formatValue(chartData[chartData.length - 1]?.value)} kg
                </Text>
                {weightChange && weightChange.value > 0 && (
                  <Text style={[styles.chartChange, { color: weightChange.direction === 'up' ? colors.danger : colors.success }]}>
                    {weightChange.direction === 'up' ? '+' : '-'}{weightChange.value} kg
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>开始记录查看趋势</Text>
            )}
          </View>
        </View>
      </View>

      {todayTags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>今日标签</Text>
          <View style={styles.tagsContainer}>
            {todayTags.map((tag, i) => (
              <TagChip key={i} label={tag} />
            ))}
          </View>
        </View>
      )}

      {todayRecord?.remark && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>今日备注</Text>
          <View style={[styles.remarkCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.remarkText, { color: colors.textSecondary }]}>{todayRecord.remark}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  dateText: {
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm + 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 2,
  },
  chartCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
  },
  chartLabel: {
    fontSize: FontSize.sm,
  },
  chartChange: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  remarkCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
  },
  remarkText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
});
