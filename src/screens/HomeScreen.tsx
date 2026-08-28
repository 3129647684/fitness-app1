import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { MetricTile } from '@/components/MetricTile';
import { MiniChart } from '@/components/MiniChart';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { getTodayRecord, getRecentRecords, getUserProfile } from '@/database/db';
import { BodyRecord, UserProfile } from '@/database/types';
import { calcBMI, formatValue } from '@/utils/calculations';
import { formatDateWithWeekday, getTodayString } from '@/utils/date';
import type { HomeScreenProps } from '@/navigation/RootNavigator';

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
    .filter((rec) => rec.weight !== null)
    .map((rec) => ({ date: rec.record_date, value: rec.weight }));

  const trendValue = chartData.length > 0
    ? formatValue(chartData[chartData.length - 1]?.value ?? null)
    : null;

  const toRecord = () => navigation.navigate('Record');

  const Section = ({ icon, title, color, children }: { icon: any; title: string; color?: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: s.xl }}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: (color || colors.primary) + '18' }]}>
          <Icon name={icon} size={tokens.isCompact ? 14 : 15} color={color || colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: f.md }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const Grid = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm + 2 }}>{children}</View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: s.xxxl * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      <GradientView
        colors={isDark ? ['#0D2818', '#1B4332', '#2D6A4F'] : ['#B8DCC5', '#D8F3DC', '#E8F5EB']}
        style={{
          paddingTop: insets.top + s.lg,
          paddingBottom: tokens.isCompact ? s.xl : s.xxl,
          paddingHorizontal: s.lg,
          borderBottomLeftRadius: r.xl,
          borderBottomRightRadius: r.xl,
        }}
      >
        <View pointerEvents="none" style={styles.heroGlow1} />
        <View pointerEvents="none" style={styles.heroGlow2} />

        <View style={styles.heroTop}>
          <Text style={[styles.heroDate, { color: isDark ? 'rgba(255,255,255,0.72)' : '#3E7A5C', fontSize: f.sm }]}>
            {formatDateWithWeekday(todayStr)}
          </Text>
          <View style={[styles.heroBadge, { backgroundColor: hasRecord ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
            <Icon name={hasRecord ? 'checkmark-circle' : 'calendar-outline'} size={tokens.isCompact ? 12 : 14} color={hasRecord ? '#22C55E' : '#F59E0B'} />
            <Text style={[styles.heroBadgeText, { color: hasRecord ? '#22C55E' : '#F59E0B', fontSize: f.xs }]}>{hasRecord ? '已完成' : '待录入'}</Text>
          </View>
        </View>

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

      <View style={[styles.body, { padding: s.lg }]}>
        <Section icon="scale-outline" title="核心数据" color="#22C55E">
          <Grid>
            <MetricTile label="体重" value={todayRecord?.weight ?? null} unit="kg" icon="scale-outline" onPress={toRecord} />
            <MetricTile label="BMI" value={bmi ?? null} icon="analytics-outline" onPress={toRecord} />
            <MetricTile label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" icon="pie-chart-outline" onPress={toRecord} />
            <MetricTile label="腰围" value={todayRecord?.waist ?? null} unit="cm" icon="resize-outline" onPress={toRecord} />
          </Grid>
        </Section>

        <Section icon="moon-outline" title="睡眠" color="#8B5CF6">
          <Grid>
            <MetricTile label="睡眠时长" value={todayRecord?.sleep_duration ?? null} unit="h" icon="moon-outline" onPress={toRecord} />
          </Grid>
        </Section>

        <Section icon="trending-up-outline" title="近7天体重趋势" color="#3B82F6">
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
        </Section>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGlow1: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroDate: { fontWeight: '600' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: { fontWeight: '700' },
  heroTitle: { fontWeight: '800', marginTop: Spacing.xs },
  heroSub: { marginTop: 4 },
  addBtn: {
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: Spacing.md + 3,
  },
  addIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '800' },
  body: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm + 2,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontWeight: '700' },
  trendCard: {
    padding: Spacing.md + 2,
    borderWidth: 1,
  },
  trendHint: { textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: { fontWeight: '600' },
});
