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
import { calcBMI, calcBMR, formatValue } from '@/utils/calculations';
import { formatDateWithWeekday, getTodayString } from '@/utils/date';
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    const today = await getTodayRecord();
    setTodayRecord(today);
    setRecentRecords(await getRecentRecords(7));
    setProfile(await getUserProfile());
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const todayStr = getTodayString();
  const hasRecord = todayRecord !== null;
  const weight = todayRecord?.weight ?? profile?.weight ?? null;
  const height = profile?.height ?? null;
  const bmi = todayRecord?.bmi ?? calcBMI(weight, height);
  const bmr = todayRecord?.bmr ?? calcBMR(weight, height, profile?.age ?? null, profile?.gender ?? null);

  const chartData = recentRecords.filter((r) => r.weight !== null).map((r) => ({ date: r.record_date, value: r.weight }));
  const trendValue = chartData.length > 0 ? formatValue(chartData[chartData.length - 1]?.value ?? null) : null;

  const toRecord = () => navigation.navigate('Record');

  const Section = ({ icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: s.xl }}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={tokens.isCompact ? 14 : 15} color={colors.primary} />
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
        colors={isDark ? ['#15351F', '#1B4332', '#24523D'] : ['#CDE5DA', '#DEF0E7', '#EFF7F2']}
        style={{
          paddingTop: insets.top + s.lg,
          paddingBottom: tokens.isCompact ? s.xl : s.xxl,
          paddingHorizontal: s.lg,
          borderBottomLeftRadius: r.xl,
          borderBottomRightRadius: r.xl,
          position: 'relative',
        }}
      >
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <Text style={[styles.heroDate, { color: isDark ? 'rgba(255,255,255,0.72)' : '#3E7A5C', fontSize: f.sm }]}>
            {formatDateWithWeekday(todayStr)}
          </Text>
          <View style={styles.heroBadge}>
            <Icon name={hasRecord ? 'checkmark-circle' : 'calendar-outline'} size={tokens.isCompact ? 12 : 14} color={hasRecord ? '#4C8A64' : '#7C5C3A'} />
            <Text style={[styles.heroBadgeText, { fontSize: f.xs }]}>{hasRecord ? '已完成' : '待录入'}</Text>
          </View>
        </View>

        <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#1F5C40', fontSize: tokens.isCompact ? f.xl : f.xxl }]}>
          {hasRecord ? '今日已完成记录' : '今日待录入'}
        </Text>
        <Text style={[styles.heroSub, { color: isDark ? 'rgba(255,255,255,0.82)' : '#4E9B78', fontSize: f.sm }]}>
          {hasRecord ? '继续保持，胜利来自每一天' : '花一分钟记录今天的身体状态'}
        </Text>

        <GradientView
          colors={isDark ? ['#2D6A4F', '#40916C'] : ['#3FA372', '#5EB588']}
          style={[styles.addBtn, Shadows.md]}
        >
          <TouchableOpacity style={styles.addBtnInner} onPress={toRecord} activeOpacity={0.9}>
            <View style={styles.addIconWrap}>
              <Icon name="add" size={tokens.isCompact ? 18 : 20} color="#3FA372" />
            </View>
            <Text style={[styles.addBtnText, { fontSize: tokens.isCompact ? f.md : f.lg }]}>
              {hasRecord ? '编辑今日记录' : '新增今日记录'}
            </Text>
          </TouchableOpacity>
        </GradientView>
      </GradientView>

      <View style={[styles.body, { padding: s.lg }]}>
        <Section icon="body-outline" title="核心数据">
          <Grid>
            <MetricTile label="体重" value={todayRecord?.weight ?? null} unit="kg" icon="scale-outline" onPress={toRecord} />
            <MetricTile label="BMI" value={bmi ?? null} icon="analytics-outline" onPress={toRecord} />
            <MetricTile label="腰围" value={todayRecord?.waist ?? null} unit="cm" icon="resize-outline" onPress={toRecord} />
            <MetricTile label="臀围" value={todayRecord?.hip ?? null} unit="cm" icon="body-outline" onPress={toRecord} />
          </Grid>
        </Section>

        <Section icon="fitness-outline" title="体成分">
          <Grid>
            <MetricTile label="体脂率" value={todayRecord?.body_fat ?? null} unit="%" icon="pie-chart-outline" onPress={toRecord} />
            <MetricTile label="肌肉量" value={todayRecord?.muscle_mass ?? null} unit="kg" icon="barbell-outline" onPress={toRecord} />
            <MetricTile label="水分率" value={todayRecord?.water_rate ?? null} unit="%" icon="water-outline" onPress={toRecord} />
            <MetricTile label="基础代谢" value={bmr ?? null} unit="kcal" icon="flame-outline" onPress={toRecord} />
          </Grid>
        </Section>

        <Section icon="trending-up-outline" title="近7天体重趋势">
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
                <View style={[styles.emptyIconWrap, { borderColor: colors.border, borderRadius: r.md }]}>
                  <Icon name="trending-up-outline" size={tokens.isCompact ? 30 : 34} color={colors.primarySoft} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: f.md, marginTop: s.md }]}>暂无趋势数据</Text>
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
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroDate: {
    fontWeight: '600',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(246,238,220,0.95)',
  },
  heroBadgeText: {
    color: '#7C5C3A',
    fontWeight: '700',
  },
  heroTitle: {
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  heroSub: {
    marginTop: 4,
  },
  addBtn: {
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  addBtnInner: {
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
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  body: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm + 2,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  trendCard: {
    padding: Spacing.md + 2,
    borderWidth: 1,
  },
  trendHint: {
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconWrap: {
    borderWidth: 2,
    padding: Spacing.lg,
  },
  emptyText: {
    fontWeight: '600',
  },
});
