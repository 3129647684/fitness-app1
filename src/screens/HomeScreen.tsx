import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { MetricCard } from '@/components/MetricCard';
import { MiniChart } from '@/components/MiniChart';
import { TagChip } from '@/components/TagChip';
import { getTodayRecord, getRecentRecords, getRecordTags, getUserProfile } from '@/database/db';
import { BodyRecord, UserProfile, FoodItem, SportItem } from '@/database/types';
import { calcBMI, getBMICategory, formatValue, calcChange } from '@/utils/calculations';
import { formatDateWithWeekday } from '@/utils/date';
import type { IndexScreenProps } from '@/navigation/RootNavigator';

export default function HomeScreen(_props: IndexScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<IndexScreenProps['navigation']>();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;

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

  const Section = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <View style={[styles.sectionWrap, { marginBottom: s.xl }]}>
      <View style={[styles.sectionHeader, { marginBottom: s.sm + 2 }]}>
        <Icons name={icon} size={tokens.isCompact ? 14 : 15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: f.md }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const heroPaddingTop = insets.top + s.lg;
  const heroButtonVPad = tokens.isCompact ? s.md : s.md + 3;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: s.xxxl * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      <GradientView
        colors={isDark ? ['#15351F', '#1B4332', '#121212'] : ['#1B4332', '#2D6A4F', '#40916C']}
        style={{
          paddingTop: heroPaddingTop,
          paddingBottom: tokens.isCompact ? s.xl : s.xxl,
          paddingHorizontal: s.lg,
          borderBottomLeftRadius: r.xl,
          borderBottomRightRadius: r.xl,
        }}
      >
        <View style={[styles.heroTop, { marginBottom: s.lg }]}>
          <View>
            <Text style={[styles.heroDate, { fontSize: f.sm, marginBottom: tokens.isCompact ? 4 : 6 }]}>
              {formatDateWithWeekday(todayStr)}
            </Text>
            <Text style={[styles.heroTitle, { fontSize: tokens.isCompact ? f.xl : f.xxl }]}>
              {hasRecord ? '今日已完成记录' : '今日待录入'}
            </Text>
            <Text style={[styles.heroSub, { fontSize: f.sm, marginTop: 4 }]}>
              {hasRecord ? '继续保持，胜利来自每一天' : '花一分钟记录今天的身体状态'}
            </Text>
          </View>
          <View style={[
            styles.heroBadge,
            {
              backgroundColor: hasRecord ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.25)',
              paddingHorizontal: s.sm + (tokens.isCompact ? 2 : 4),
              paddingVertical: s.xs + 2,
              borderRadius: r.full,
            },
          ]}>
            <Icons name={hasRecord ? 'checkmark' : 'time'} size={tokens.isCompact ? 12 : 14} color={hasRecord ? '#86EFAC' : '#FCD34D'} />
            <Text style={[styles.heroBadgeText, { color: hasRecord ? '#86EFAC' : '#FCD34D', fontSize: f.xs }]}>
              {hasRecord ? '已完成' : '待录入'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.heroButton, Shadows.md, { paddingVertical: heroButtonVPad, borderRadius: r.lg, gap: s.sm }]}
          onPress={() => navigation.navigate('Record')}
          activeOpacity={0.9}
        >
          <Icons name={hasRecord ? 'create-outline' : 'add'} size={tokens.isCompact ? 18 : 20} color="#1B4332" />
          <Text style={[styles.heroButtonText, { fontSize: tokens.isCompact ? f.md : f.lg }]}>
            {hasRecord ? '编辑今日记录' : '新增今日记录'}
          </Text>
          <Icons name="arrow-forward" size={tokens.isCompact ? 14 : 16} color="#1B4332" />
        </TouchableOpacity>
      </GradientView>

      <View style={[styles.body, { padding: s.lg }]}>
        {(todayFoodCal !== null || todaySportCal !== null) && (
          <Section title="今日热量" icon="flame-outline">
            <View style={[styles.metricsGrid, { gap: s.sm + 2 }]}>
              <MetricCard label="摄入热量" value={todayFoodCal} unit="kcal" color={colors.info} />
              <MetricCard label="运动消耗" value={todaySportCal} unit="kcal" color={colors.warning} />
            </View>
          </Section>
        )}

        <Section title="核心数据" icon="stats-chart-outline">
          <View style={[styles.metricsGrid, { gap: s.sm + 2 }]}>
            <MetricCard label="体重" value={todayRecord?.weight ?? null} unit="kg" change={weightChange} />
            <MetricCard label="BMI" value={bmi} color={bmiCategory.color} />
            <MetricCard label="腰围" value={todayRecord?.waist ?? null} unit="cm" />
            <MetricCard label="睡眠" value={todayRecord?.sleep_duration ?? null} unit="h" />
          </View>
        </Section>

        {todayRecord?.body_fat !== null && (
          <Section title="体成分" icon="pie-chart-outline">
            <View style={[styles.metricsGrid, { gap: s.sm + 2 }]}>
              <MetricCard label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" />
              <MetricCard label="肌肉量" value={todayRecord?.muscle_mass ?? null} unit="kg" />
              <MetricCard label="水分率" value={todayRecord?.water_rate ?? null} unit="%" />
              <MetricCard label="基础代谢" value={todayRecord?.bmr ?? null} unit="kcal" />
            </View>
          </Section>
        )}

        <Section title="近7天体重趋势" icon="trending-up-outline">
          <View style={[styles.chartCard, {
            backgroundColor: colors.card,
            borderColor: colors.borderLight,
            padding: s.md + 2,
            borderRadius: r.lg,
          }, Shadows.sm]}>
            <MiniChart data={chartData} height={tokens.isCompact ? 80 : 96} />
            <View style={[styles.chartFooter, { marginTop: s.sm + 2 }]}>
              {chartData.length > 0 ? (
                <>
                  <View style={styles.chartInfoRow}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.chartLabel, { color: colors.textSecondary, fontSize: f.sm }]}>
                      最近: {formatValue(chartData[chartData.length - 1]?.value)} kg
                    </Text>
                  </View>
                  {weightChange && weightChange.value > 0 && (
                    <View style={[styles.chartChangePill, {
                      backgroundColor: weightChange.direction === 'up' ? colors.dangerLight : colors.successLight,
                      paddingHorizontal: s.sm,
                      borderRadius: r.full,
                    }]}>
                      <Text style={[styles.chartChange, {
                        color: weightChange.direction === 'up' ? colors.danger : colors.success,
                        fontSize: f.xs,
                      }]}>
                        {weightChange.direction === 'up' ? '+' : '-'}{weightChange.value} kg
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Icons name="analytics-outline" size={tokens.isCompact ? 18 : 20} color={colors.textTertiary} />
                  <Text style={[styles.chartLabel, { color: colors.textTertiary, fontSize: f.sm }]}>开始记录查看趋势</Text>
                </View>
              )}
            </View>
          </View>
        </Section>

        {todayTags.length > 0 && (
          <Section title="今日标签" icon="pricetags-outline">
            <View style={[styles.tagsContainer, { gap: s.sm }]}>
              {todayTags.map((tag, i) => (
                <TagChip key={i} label={tag} />
              ))}
            </View>
          </Section>
        )}

        {todayRecord?.remark ? (
          <Section title="今日备注" icon="document-text-outline">
            <View style={[styles.remarkCard, {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              padding: s.md + 2,
              borderRadius: r.lg,
            }, Shadows.sm]}>
              <Text style={[styles.remarkText, {
                color: colors.textSecondary,
                fontSize: f.sm,
                lineHeight: tokens.isCompact ? 20 : 22,
              }]}>{todayRecord.remark}</Text>
            </View>
          </Section>
        ) : !hasRecord ? (
          <TouchableOpacity
            style={[styles.quickHint, {
              gap: s.sm + 2,
              padding: s.md + 2,
              borderRadius: r.lg,
            }]}
            onPress={() => navigation.navigate('Record')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickHintIcon, {
              backgroundColor: colors.primarySoft,
              width: tokens.isCompact ? 34 : 38,
              height: tokens.isCompact ? 34 : 38,
              borderRadius: r.md,
            }]}>
              <Icons name="sparkles-outline" size={tokens.isCompact ? 16 : 18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickHintTitle, { color: colors.text, fontSize: f.md }]}>从今天开始记录</Text>
              <Text style={[styles.quickHintSub, { color: colors.textSecondary, fontSize: f.xs, marginTop: 2 }]}>体重、围度、饮食、运动，一次搞定</Text>
            </View>
            <Icons name="chevron-forward" size={tokens.isCompact ? 16 : 18} color={colors.textTertiary} />
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
