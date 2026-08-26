import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const isDark = colorScheme === 'dark';

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

  const Section = ({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) => (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Spacing.xxxl * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      {/* 品牌头部 */}
      <LinearGradient
        colors={isDark ? ['#15351F', '#1B4332', '#121212'] : ['#1B4332', '#2D6A4F', '#40916C']}
        style={{ paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.lg, borderBottomLeftRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.xl }}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroDate}>{formatDateWithWeekday(todayStr)}</Text>
            <Text style={styles.heroTitle}>
              {hasRecord ? '今日已完成记录' : '今日待录入'}
            </Text>
            <Text style={styles.heroSub}>
              {hasRecord ? '继续保持，胜利来自每一天' : '花一分钟记录今天的身体状态'}
            </Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: hasRecord ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.25)' }]}>
            <Ionicons name={hasRecord ? 'checkmark' : 'time'} size={14} color={hasRecord ? '#86EFAC' : '#FCD34D'} />
            <Text style={[styles.heroBadgeText, { color: hasRecord ? '#86EFAC' : '#FCD34D' }]}>
              {hasRecord ? '已完成' : '待录入'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.heroButton, Shadows.md]}
          onPress={() => router.push('/(tabs)/record')}
          activeOpacity={0.9}
        >
          <Ionicons name={hasRecord ? 'create-outline' : 'add'} size={20} color="#1B4332" />
          <Text style={styles.heroButtonText}>{hasRecord ? '编辑今日记录' : '新增今日记录'}</Text>
          <Ionicons name="arrow-forward" size={16} color="#1B4332" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {(todayFoodCal !== null || todaySportCal !== null) && (
          <Section title="今日热量" icon="flame-outline">
            <View style={styles.metricsGrid}>
              <MetricCard label="摄入热量" value={todayFoodCal} unit="kcal" color={colors.info} />
              <MetricCard label="运动消耗" value={todaySportCal} unit="kcal" color={colors.warning} />
            </View>
          </Section>
        )}

        <Section title="核心数据" icon="stats-chart-outline">
          <View style={styles.metricsGrid}>
            <MetricCard label="体重" value={todayRecord?.weight ?? null} unit="kg" change={weightChange} />
            <MetricCard label="BMI" value={bmi} color={bmiCategory.color} />
            <MetricCard label="腰围" value={todayRecord?.waist ?? null} unit="cm" />
            <MetricCard label="睡眠" value={todayRecord?.sleep_duration ?? null} unit="h" />
          </View>
        </Section>

        {todayRecord?.body_fat !== null && (
          <Section title="体成分" icon="pie-chart-outline">
            <View style={styles.metricsGrid}>
              <MetricCard label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" />
              <MetricCard label="肌肉量" value={todayRecord?.muscle_mass ?? null} unit="kg" />
              <MetricCard label="水分率" value={todayRecord?.water_rate ?? null} unit="%" />
              <MetricCard label="基础代谢" value={todayRecord?.bmr ?? null} unit="kcal" />
            </View>
          </Section>
        )}

        <Section title="近7天体重趋势" icon="trending-up-outline">
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.sm]}>
            <MiniChart data={chartData} height={96} />
            <View style={styles.chartFooter}>
              {chartData.length > 0 ? (
                <>
                  <View style={styles.chartInfoRow}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                      最近: {formatValue(chartData[chartData.length - 1]?.value)} kg
                    </Text>
                  </View>
                  {weightChange && weightChange.value > 0 && (
                    <View style={[styles.chartChangePill, { backgroundColor: weightChange.direction === 'up' ? colors.dangerLight : colors.successLight }]}>
                      <Text style={[styles.chartChange, { color: weightChange.direction === 'up' ? colors.danger : colors.success }]}>
                        {weightChange.direction === 'up' ? '+' : '-'}{weightChange.value} kg
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="analytics-outline" size={20} color={colors.textTertiary} />
                  <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>开始记录查看趋势</Text>
                </View>
              )}
            </View>
          </View>
        </Section>

        {todayTags.length > 0 && (
          <Section title="今日标签" icon="pricetags-outline">
            <View style={styles.tagsContainer}>
              {todayTags.map((tag, i) => (
                <TagChip key={i} label={tag} />
              ))}
            </View>
          </Section>
        )}

        {todayRecord?.remark ? (
          <Section title="今日备注" icon="document-text-outline">
            <View style={[styles.remarkCard, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.sm]}>
              <Text style={[styles.remarkText, { color: colors.textSecondary }]}>{todayRecord.remark}</Text>
            </View>
          </Section>
        ) : !hasRecord ? (
          <TouchableOpacity style={styles.quickHint} onPress={() => router.push('/(tabs)/record')} activeOpacity={0.8}>
            <View style={[styles.quickHintIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickHintTitle, { color: colors.text }]}>从今天开始记录</Text>
              <Text style={[styles.quickHintSub, { color: colors.textSecondary }]}>体重、围度、饮食、运动，一次搞定</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md + 3,
    borderRadius: BorderRadius.lg,
  },
  heroButtonText: {
    color: '#1B4332',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  body: {
    padding: Spacing.lg,
  },
  sectionWrap: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 2,
  },
  chartCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
  },
  chartInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: FontSize.sm,
  },
  chartChangePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chartChange: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  remarkCard: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  remarkText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  quickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
  },
  quickHintIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickHintTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  quickHintSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});