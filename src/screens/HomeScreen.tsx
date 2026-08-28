import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { MetricTile } from '@/components/MetricTile';
import { MiniChart } from '@/components/MiniChart';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { getTodayRecord, getRecentRecords, getUserProfile } from '@/database/db';
import { BodyRecord, UserProfile } from '@/database/types';
import { calcBMI, formatValue } from '@/utils/calculations';
import { formatDateWithWeekday, getTodayString } from '@/utils/date';
import type { HomeScreenProps } from '@/navigation/RootNavigator';

// 极简首页：问候 + 今日核心数据 + 记录按钮 + 7天趋势
export default function HomeScreen(_props: HomeScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;

  const [todayRecord, setTodayRecord] = useState<BodyRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<BodyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    setTodayRecord(await getTodayRecord());
    setRecentRecords(await getRecentRecords(7));
    setProfile(await getUserProfile());
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const todayStr = getTodayString();
  const hasRecord = todayRecord !== null;
  const weight = todayRecord?.weight ?? profile?.weight ?? null;
  const bmi = todayRecord?.bmi ?? calcBMI(weight, profile?.height ?? null);

  const chartData = recentRecords
    .filter((r) => r.weight !== null)
    .map((r) => ({ date: r.record_date, value: r.weight }));
  const trendValue = chartData.length > 0
    ? formatValue(chartData[chartData.length - 1]?.value ?? null)
    : null;

  const toRecord = () => navigation.navigate('Record');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: s.xxxl * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      {/* Hero 区域 */}
      <GradientView
        colors={isDark ? ['#15351F', '#1B4332', '#24523D'] : ['#CDE5DA', '#DEF0E7', '#EFF7F2']}
        style={{
          paddingTop: insets.top + s.lg,
          paddingBottom: tokens.isCompact ? s.xl : s.xxl,
          paddingHorizontal: s.lg,
          borderBottomLeftRadius: r.xl,
          borderBottomRightRadius: r.xl,
        }}
      >
        <Text style={[styles.heroDate, { color: isDark ? 'rgba(255,255,255,0.72)' : '#3E7A5C', fontSize: f.sm }]}>
          {formatDateWithWeekday(todayStr)}
        </Text>
        <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#1F5C40', fontSize: tokens.isCompact ? f.xl : f.xxl }]}>
          {hasRecord ? '今日已记录' : '今日待记录'}
        </Text>
        <Text style={[styles.heroSub, { color: isDark ? 'rgba(255,255,255,0.82)' : '#4E9B78', fontSize: f.sm }]}>
          {hasRecord ? '继续保持，每一天都算数' : '花 30 秒记录今天的身体状态'}
        </Text>

        <TouchableOpacity onPress={toRecord} activeOpacity={0.9}>
          <GradientView
            colors={isDark ? ['#2D6A4F', '#40916C'] : ['#3FA372', '#5EB588']}
            style={[styles.addBtn, Shadows.md]}
          >
            <View style={styles.addIconWrap}>
              <Icon name="add" size={tokens.isCompact ? 18 : 20} color="#3FA372" />
            </View>
            <Text style={[styles.addBtnText, { fontSize: tokens.isCompact ? f.md : f.lg }]}>
              {hasRecord ? '编辑今日记录' : '记录今日数据'}
            </Text>
          </GradientView>
        </TouchableOpacity>
      </GradientView>

      {/* 今日核心数据 */}
      <View style={[styles.body, { padding: s.lg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: f.md, marginBottom: s.md }]}>今日数据</Text>
        <View style={styles.grid}>
          <MetricTile label="体重" value={weight} unit="kg" icon="scale-outline" onPress={toRecord} />
          <MetricTile label="BMI" value={bmi} icon="analytics-outline" onPress={toRecord} />
          <MetricTile label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" icon="pie-chart-outline" onPress={toRecord} />
          <MetricTile label="腰围" value={todayRecord?.waist ?? null} unit="cm" icon="resize-outline" onPress={toRecord} />
        </View>

        {/* 睡眠 */}
        {todayRecord?.sleep_duration != null && (
          <View style={[styles.sleepCard, { backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: r.lg }, Shadows.sm]}>
            <View style={styles.sleepLeft}>
              <View style={[styles.sleepIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Icon name="moon" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sleepLabel, { color: colors.textSecondary, fontSize: f.xs }]}>昨夜睡眠</Text>
                <Text style={[styles.sleepValue, { color: colors.text, fontSize: f.lg }]}>
                  {todayRecord.sleep_duration} <Text style={{ fontSize: f.sm, color: colors.textSecondary }}>小时</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 7天体重趋势 */}
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: f.md, marginTop: s.xl, marginBottom: s.md }]}>近7天体重</Text>
        <View style={[styles.trendCard, { backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: r.lg }, Shadows.sm]}>
          {chartData.length > 0 ? (
            <>
              <MiniChart data={chartData} height={tokens.isCompact ? 90 : 108} />
              <Text style={[styles.trendHint, { color: colors.textSecondary, fontSize: f.sm, marginTop: s.sm }]}>
                最近体重：{trendValue} kg
              </Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trending-up-outline" size={tokens.isCompact ? 28 : 32} color={colors.primarySoft} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: f.sm, marginTop: s.sm }]}>暂无趋势数据</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroDate: { fontWeight: '600' },
  heroTitle: { fontWeight: '800', marginTop: Spacing.xs },
  heroSub: { marginTop: 4 },
  addBtn: { borderRadius: BorderRadius.full, marginTop: Spacing.lg },
  addIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 3 },
  body: { padding: Spacing.lg },
  sectionTitle: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm + 2 },
  sleepCard: { padding: Spacing.md + 2, borderWidth: 1, marginTop: Spacing.md },
  sleepLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sleepIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sleepLabel: { fontWeight: '500' },
  sleepValue: { fontWeight: '700' },
  trendCard: { padding: Spacing.md + 2, borderWidth: 1 },
  trendHint: { textAlign: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontWeight: '600' },
});
