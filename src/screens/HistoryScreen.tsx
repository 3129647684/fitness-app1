import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icons } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordCard } from '@/components/RecordCard';
import { TagChip } from '@/components/TagChip';
import {
  getRecords, getRecordTags, deleteRecord, getDatesWithRecords, searchRecords,
} from '@/database/db';
import { BodyRecord } from '@/database/types';
import { getRelativeTime, getMonthDays } from '@/utils/date';
import type { HistoryScreenProps, RootStackParamList, MainTabsParamList } from '@/navigation/RootNavigator';

type HistoryNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ViewMode = 'list' | 'calendar';
type FilterRange = '7' | '30' | 'all';

export default function HistoryScreen(_props: HistoryScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HistoryNav>();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [recordTags, setRecordTags] = useState<Record<number, string[]>>({});
  const [filter, setFilter] = useState<FilterRange>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [datesWithRecords, setDatesWithRecords] = useState<Set<string>>(new Set());

  const loadData = async () => {
    let data: BodyRecord[];
    if (searchQuery.trim()) {
      data = await searchRecords(searchQuery.trim());
    } else if (filter === 'all') {
      data = await getRecords();
    } else {
      const days = parseInt(filter, 10);
      const d = new Date();
      d.setDate(d.getDate() - days);
      const startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      const { getRecordsByDateRange } = await import('@/database/db');
      data = await getRecordsByDateRange(startDate, today);
    }

    setRecords(data);

    const tagsMap: Record<number, string[]> = {};
    for (const r of data) {
      if (r.id) {
        const tags = await getRecordTags(r.id);
        tagsMap[r.id] = tags.map(t => t.tag_name);
      }
    }
    setRecordTags(tagsMap);

    const dates = await getDatesWithRecords(calYear, calMonth);
    setDatesWithRecords(new Set(dates));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter, calYear, calMonth])
  );

  // 搜索防抖：300ms 内连续击键不触发数据库查询
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadData();
    }, searchQuery ? 300 : 0);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleDelete = (id: number) => {
    Alert.alert(
      '删除记录',
      '确定删除此条记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(id);
            loadData();
          },
        },
      ]
    );
  };

  const monthDays = getMonthDays(calYear, calMonth);
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const changeMonth = (delta: number) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  const renderListItem = ({ item }: { item: BodyRecord }) => (
    <RecordCard
      record={item}
      tags={item.id ? recordTags[item.id] : []}
      onPress={() => {
        Alert.alert(
          getRelativeTime(item.record_date),
          '体重 ' + (item.weight ?? '--') + 'kg · 体脂 ' + (item.body_fat ?? '--') + '%',
          [
            {
              text: '编辑',
              onPress: () => navigation.navigate('Record', { initialDate: item.record_date }),
            },
            { text: '删除', style: 'destructive', onPress: () => item.id && handleDelete(item.id) },
            { text: '取消', style: 'cancel' },
          ]
        );
      }}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.text }]}>历史记录</Text>
        <View style={[
          styles.viewToggle,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.borderLight,
            ...Shadows.sm,
          },
        ]}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.primary, ...Shadows.sm }]}
            activeOpacity={0.7}
          >
            <Icons name="list" size={18} color={viewMode === 'list' ? '#FFF' : colors.textSecondary} />
            <Text style={{ color: viewMode === 'list' ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, marginLeft: 4, fontWeight: '600' }}>列表</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('calendar')}
            style={[styles.toggleBtn, viewMode === 'calendar' && { backgroundColor: colors.primary, ...Shadows.sm }]}
            activeOpacity={0.7}
          >
            <Icons name="calendar" size={18} color={viewMode === 'calendar' ? '#FFF' : colors.textSecondary} />
            <Text style={{ color: viewMode === 'calendar' ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, marginLeft: 4, fontWeight: '600' }}>日历</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' && (
        <>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }, Shadows.md]}>
            <Icons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="搜索备注..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {!searchQuery && (
            <View style={styles.filterRow}>
              {([['7', '近7天'], ['30', '近30天'], ['all', '全部']] as [FilterRange, string][]).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setFilter(val)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: filter === val ? colors.primary : colors.surfaceVariant,
                      borderColor: filter === val ? colors.primary : colors.borderLight,
                      ...(filter === val ? Shadows.sm : {}),
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: filter === val ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2 }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            data={records}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id?.toString() ?? item.record_date}
            contentContainerStyle={{ padding: Spacing.lg }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Icons name="document-text-outline" size={40} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  {searchQuery ? '未找到匹配记录' : '暂无记录'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textTertiary }]}>
                  {searchQuery ? '试试其他关键词' : '开始记录你的身体数据吧'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {viewMode === 'calendar' && (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }}>
          <View style={[
            styles.calendarCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              ...Shadows.md,
            },
          ]}>
            <View style={[styles.calendarHeader, { borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={[styles.calendarArrowBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <Icons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calYear}年 {monthNames[calMonth]}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={[styles.calendarArrowBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <Icons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {monthDays.map((day, i) => {
                const hasRecord = datesWithRecords.has(day.date);
                const isToday = day.date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calendarDay,
                      isToday && { backgroundColor: colors.primarySoft, borderRadius: BorderRadius.md, ...Shadows.sm },
                      hasRecord && !isToday && { backgroundColor: colors.surfaceVariant },
                    ]}
                    onPress={() => {
                      if (hasRecord) {
                        Alert.alert(day.date, '该日期已有记录', [
                          {
                            text: '查看/编辑详情',
                            onPress: () => navigation.navigate('Record', { initialDate: day.date }),
                          },
                          { text: '确定' },
                        ]);
                      }
                    }}
                    activeOpacity={hasRecord ? 0.7 : 1}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: day.isCurrentMonth ? colors.text : colors.textTertiary },
                        isToday && { fontWeight: '700', color: colors.primary },
                      ]}
                    >
                      {day.day}
                    </Text>
                    {hasRecord && <View style={[styles.recordDot, { backgroundColor: colors.primary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  calendarArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  calendarTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: FontSize.md,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});
