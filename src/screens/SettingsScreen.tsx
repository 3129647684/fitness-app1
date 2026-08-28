import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Modal, ActivityIndicator, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { TrendChart } from '@/components/TrendChart';
import {
  getUserProfile, updateUserProfile, getActiveGoals, saveGoal,
  getRecords, getRecordsByDateRange, deleteRecord,
} from '@/database/db';
import { UserProfile, Goal, BodyRecord, ChartMetric, TimeRange } from '@/database/types';
import { getCachedUser, clearSession, getToken } from '@/database/session';
import { syncPush, syncPull } from '@/database/sync';
import { getDateNDaysAgo } from '@/utils/date';
import type { SettingsScreenProps } from '@/navigation/RootNavigator';

type TabType = 'records' | 'trends' | 'settings';

const METRICS: { key: ChartMetric; label: string; unit: string }[] = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'body_fat', label: '体脂率', unit: '%' },
  { key: 'waist', label: '腰围', unit: 'cm' },
  { key: 'sleep_duration', label: '睡眠', unit: 'h' },
];

const RANGES: { value: TimeRange; label: string; days: number }[] = [
  { value: '7d', label: '7天', days: 7 },
  { value: '30d', label: '30天', days: 30 },
  { value: '90d', label: '90天', days: 90 },
];

export default function SettingsScreen(_props: SettingsScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsScreenProps['navigation']>();
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;

  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [currentUser, setCurrentUser] = useState(getCachedUser());

  // 记录 Tab
  const [records, setRecords] = useState<BodyRecord[]>([]);

  // 趋势 Tab
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('weight');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');
  const [chartData, setChartData] = useState<{ date: string; value: number | null }[]>([]);
  const [trendRecords, setTrendRecords] = useState<BodyRecord[]>([]);

  // 设置 Tab
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [targetWeight, setTargetWeight] = useState('');
  const [goalType, setGoalType] = useState<'weight' | 'waist' | 'body_fat'>('weight');
  const [goalValue, setGoalValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const loadAll = useCallback(async () => {
    const [p, g, recs] = await Promise.all([
      getUserProfile(),
      getActiveGoals(),
      getRecords(50),
    ]);
    setProfile(p);
    setGoals(g);
    setRecords(recs);
    setHeight(p?.height?.toString() ?? '');
    setWeight(p?.weight?.toString() ?? '');
    setAge(p?.age?.toString() ?? '');
    setGender(p?.gender ?? 'male');
    setTargetWeight(p?.target_weight?.toString() ?? '');
  }, []);

  const loadTrend = useCallback(async () => {
    const range = RANGES.find(r => r.value === selectedRange)!;
    const startDate = getDateNDaysAgo(range.days);
    const today = new Date().toISOString().slice(0, 10);
    const data = await getRecordsByDateRange(startDate, today);
    setTrendRecords(data);
    const chart = data.map(r => ({ date: r.record_date, value: (r as any)[selectedMetric] as number | null }));
    setChartData(chart);
  }, [selectedMetric, selectedRange]);

  useFocusEffect(useCallback(() => {
    setCurrentUser(getCachedUser());
    loadAll();
  }, [loadAll]));

  useEffect(() => { if (activeTab === 'trends') loadTrend(); }, [activeTab, loadTrend]);

  // ── 记录操作 ──
  const handleDeleteRecord = (id: number) => {
    Alert.alert('删除记录', '确定删除此条记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteRecord(id); loadAll(); } },
    ]);
  };

  // ── 设置操作 ──
  const handleSaveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await updateUserProfile({
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        age: age ? parseInt(age, 10) : null,
        gender,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      });
      setEditProfile(false);
      loadAll();
      Alert.alert('成功', '个人信息已保存');
    } catch (e) { Alert.alert('保存失败', (e as Error).message); }
    finally { setSavingProfile(false); }
  };

  const handleSaveGoal = async () => {
    if (savingGoal || !goalValue) { Alert.alert('提示', '请输入目标值'); return; }
    setSavingGoal(true);
    try {
      await saveGoal({ goal_type: goalType, target_value: parseFloat(goalValue), start_date: new Date().toISOString().slice(0, 10) });
      setEditGoal(false); setGoalValue('');
      loadAll();
      Alert.alert('成功', '目标已设定');
    } catch (e) { Alert.alert('保存失败', (e as Error).message); }
    finally { setSavingGoal(false); }
  };

  const handleSyncUpload = async () => {
    if (syncing) return;
    setSyncing(true);
    try { const token = await getToken(); if (token) await syncPush(token); Alert.alert('同步成功', '本地数据已上传到云端'); }
    catch (e) { Alert.alert('同步失败', (e as Error).message); }
    finally { setSyncing(false); }
  };

  const handleSyncRestore = async () => {
    if (syncing) return;
    Alert.alert('云端恢复', '将用云端数据覆盖本机当前数据，确定继续？', [
      { text: '取消', style: 'cancel' },
      { text: '恢复', style: 'destructive', onPress: async () => {
        setSyncing(true);
        try {
          const token = await getToken();
          const res = token ? await syncPull(token) : { ok: false, msg: '未登录' };
          const count = (res as any)?.recordsImported ?? 0;
          loadAll();
          Alert.alert('恢复完成', count > 0 ? `已恢复 ${count} 条记录` : '云端暂无备份数据');
        } catch (e) { Alert.alert('恢复失败', (e as Error).message); }
        finally { setSyncing(false); }
      }},
    ]);
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '退出后本机数据将保留，下次登录可再次云端恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: async () => {
        await clearSession();
        navigation.reset({ index: 0, routes: [{ name: 'Login' as any }] });
      }},
    ]);
  };

  const metricInfo = METRICS.find(m => m.key === selectedMetric)!;
  const currentGoal = goals.find(g => g.goal_type === selectedMetric);

  const SettingRow = ({ icon, title, subtitle, onPress, right }: { icon: string; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode }) => (
    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.settingRowLeft, { backgroundColor: colors.primarySoft }]}>
        <Icons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowTitle, { color: colors.text, fontSize: f.md }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingRowSubtitle, { color: colors.textSecondary, fontSize: f.xs }]}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Icons name="chevron-forward" size={18} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  const renderRecordItem = ({ item }: { item: BodyRecord }) => (
    <TouchableOpacity
      style={[styles.recordItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
      onPress={() => navigation.navigate('Record', { initialDate: item.record_date })}
      onLongPress={() => item.id && handleDeleteRecord(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.recordDateCol}>
        <Text style={[styles.recordDate, { color: colors.text, fontSize: f.md }]}>{item.record_date.slice(5)}</Text>
        <Text style={[styles.recordDay, { color: colors.textTertiary, fontSize: f.xs }]}>{item.record_date.slice(0, 4)}</Text>
      </View>
      <View style={styles.recordMetrics}>
        {item.weight != null && <RecordMetric label="体重" value={`${item.weight}`} unit="kg" color={colors.text} />}
        {item.bmi != null && <RecordMetric label="BMI" value={item.bmi.toFixed(1)} color={colors.text} />}
        {item.body_fat != null && <RecordMetric label="体脂" value={`${item.body_fat}`} unit="%" color={colors.text} />}
        {item.waist != null && <RecordMetric label="腰围" value={`${item.waist}`} unit="cm" color={colors.text} />}
        {item.sleep_duration != null && <RecordMetric label="睡眠" value={`${item.sleep_duration}`} unit="h" color={colors.text} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部用户卡片 */}
      <View style={[styles.header, { paddingTop: insets.top + s.md, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Icons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text, fontSize: f.lg }]}>
              {currentUser?.nickname || currentUser?.username || '未登录'}
            </Text>
            <Text style={[styles.userHandle, { color: colors.textTertiary, fontSize: f.xs }]}>@{currentUser?.username}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
            <Text style={[styles.logoutText, { color: colors.danger, fontSize: f.sm }]}>退出</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 切换 */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceVariant }]}>
          {([['records', '记录'], ['trends', '趋势'], ['settings', '设置']] as [TabType, string][]).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, activeTab === key && { backgroundColor: colors.surface, ...Shadows.sm }]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === key ? colors.primary : colors.textSecondary, fontSize: f.sm, fontWeight: activeTab === key ? '700' : '500' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 记录 Tab */}
      {activeTab === 'records' && (
        <FlatList
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.id?.toString() ?? item.record_date}
          contentContainerStyle={{ padding: s.lg, paddingBottom: s.xxxl }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icons name="document-text-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: f.md, marginTop: s.md }]}>暂无记录</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Record')} style={[styles.emptyBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Text style={{ color: '#FFF', fontSize: f.md, fontWeight: '600' }}>开始记录</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* 趋势 Tab */}
      {activeTab === 'trends' && (
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: s.xxxl }}>
          {/* 指标选择 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
            {METRICS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricBtn, { backgroundColor: selectedMetric === m.key ? colors.primary : colors.surfaceVariant, borderColor: selectedMetric === m.key ? colors.primary : colors.border }]}
                onPress={() => setSelectedMetric(m.key)}
                activeOpacity={0.7}
              >
                <Text style={{ color: selectedMetric === m.key ? '#FFF' : colors.textSecondary, fontSize: f.sm, fontWeight: '500' }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 时间范围 */}
          <View style={styles.rangeRow}>
            {RANGES.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.rangeBtn, { backgroundColor: selectedRange === r.value ? colors.primary : colors.surfaceVariant, borderColor: selectedRange === r.value ? colors.primary : colors.border }]}
                onPress={() => setSelectedRange(r.value)}
                activeOpacity={0.7}
              >
                <Text style={{ color: selectedRange === r.value ? '#FFF' : colors.textSecondary, fontSize: f.sm, fontWeight: '500' }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 图表 */}
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg }, Shadows.sm]}>
            <Text style={[styles.chartTitle, { color: colors.text, fontSize: f.md }]}>{metricInfo.label}趋势</Text>
            <TrendChart data={chartData} metricLabel={metricInfo.label} unit={metricInfo.unit} targetLine={currentGoal?.target_value ?? null} height={220} />
          </View>

          {/* 统计摘要 */}
          {trendRecords.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg }, Shadows.sm]}>
              <Text style={[styles.summaryTitle, { color: colors.text, fontSize: f.md }]}>{metricInfo.label}统计</Text>
              <SummaryRow label="记录天数" value={`${trendRecords.length} 天`} colors={colors} f={f} />
              <SummaryRow label="平均值" value={avgOf(trendRecords, selectedMetric)} colors={colors} f={f} />
              <SummaryRow label="最低值" value={minOf(trendRecords, selectedMetric)} colors={colors} f={f} />
              <SummaryRow label="最高值" value={maxOf(trendRecords, selectedMetric)} colors={colors} f={f} />
            </View>
          )}
        </ScrollView>
      )}

      {/* 设置 Tab */}
      {activeTab === 'settings' && (
        <ScrollView contentContainerStyle={{ paddingBottom: s.xxxl }}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: f.sm }]}>个人档案</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
              <SettingRow icon="person-outline" title="个人信息" subtitle={`身高 ${profile?.height ?? '--'}cm | ${profile?.gender === 'male' ? '男' : '女'} | ${profile?.age ?? '--'}岁`} onPress={() => setEditProfile(true)} />
              <SettingRow icon="flag-outline" title="目标管理" subtitle={goals.length > 0 ? `已设 ${goals.length} 个目标` : '未设置目标'} onPress={() => setEditGoal(true)} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: f.sm }]}>云同步</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
              <SettingRow icon="cloud-upload-outline" title="上传到云端" subtitle={syncing ? '处理中…' : '将本机数据备份到服务器'} onPress={handleSyncUpload} />
              <SettingRow icon="cloud-download-outline" title="从云端恢复" subtitle="用云端备份覆盖本机数据" onPress={handleSyncRestore} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: f.sm }]}>关于</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
              <SettingRow icon="information-circle-outline" title="版本" subtitle="v2.0.0" />
              <SettingRow icon="shield-checkmark-outline" title="隐私说明" subtitle="数据本地存储，可选择云端备份" />
              <SettingRow icon="fitness-outline" title="身体数据记录" subtitle="极简 · 本地优先 · 多端同步" />
            </View>
          </View>
        </ScrollView>
      )}

      {/* 编辑个人信息 Modal */}
      <Modal visible={editProfile} animationType="slide" transparent onRequestClose={() => setEditProfile(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: f.xl }]}>编辑个人信息</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <ModalField label="身高 (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" colors={colors} f={f} />
              <ModalField label="体重 (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" colors={colors} f={f} />
              <ModalField label="年龄" value={age} onChangeText={setAge} keyboardType="numeric" colors={colors} f={f} />
              <Text style={[styles.modalLabel, { color: colors.textSecondary, fontSize: f.sm }]}>性别</Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as const).map(g => (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.genderBtn, { backgroundColor: gender === g ? colors.primary : colors.background, borderColor: gender === g ? colors.primary : colors.border }]} activeOpacity={0.7}>
                    <Text style={{ color: gender === g ? '#FFF' : colors.text, fontSize: f.md }}>{g === 'male' ? '男' : '女'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ModalField label="目标体重 (kg)" value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" colors={colors} f={f} />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditProfile(false)} activeOpacity={0.7} disabled={savingProfile}>
                <Text style={{ color: savingProfile ? colors.textTertiary : colors.textSecondary, fontSize: f.md }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: savingProfile ? 0.7 : 1 }]} onPress={handleSaveProfile} activeOpacity={0.85} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: '600', fontSize: f.md }}>保存</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑目标 Modal */}
      <Modal visible={editGoal} animationType="slide" transparent onRequestClose={() => setEditGoal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: f.xl }]}>设定目标</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary, fontSize: f.sm }]}>目标类型</Text>
            <View style={styles.goalTypeRow}>
              {([['weight', '体重'], ['waist', '腰围'], ['body_fat', '体脂率']] as const).map(([val, label]) => (
                <TouchableOpacity key={val} onPress={() => setGoalType(val)} style={[styles.goalTypeBtn, { backgroundColor: goalType === val ? colors.primary : colors.background, borderColor: goalType === val ? colors.primary : colors.border }]} activeOpacity={0.7}>
                  <Text style={{ color: goalType === val ? '#FFF' : colors.text, fontSize: f.md }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ModalField label={`目标值${goalType === 'weight' ? ' (kg)' : goalType === 'waist' ? ' (cm)' : ' (%)'}`} value={goalValue} onChangeText={setGoalValue} keyboardType="decimal-pad" placeholder="输入目标值" colors={colors} f={f} />
            {goals.length > 0 && (
              <View style={{ marginTop: s.md }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary, fontSize: f.sm }]}>当前目标</Text>
                {goals.map((g, i) => (
                  <Text key={i} style={{ color: colors.text, fontSize: f.sm, marginTop: 2 }}>
                    {g.goal_type === 'weight' ? '体重' : g.goal_type === 'waist' ? '腰围' : '体脂率'}: {g.target_value}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditGoal(false)} activeOpacity={0.7} disabled={savingGoal}>
                <Text style={{ color: savingGoal ? colors.textTertiary : colors.textSecondary, fontSize: f.md }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: savingGoal ? 0.7 : 1 }]} onPress={handleSaveGoal} activeOpacity={0.85} disabled={savingGoal}>
                {savingGoal ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: '600', fontSize: f.md }}>保存</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── 辅助组件 ──
function RecordMetric({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 48 }}>
      <Text style={{ fontSize: 11, color: '#999' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color }}>{value}{unit ? <Text style={{ fontSize: 10, color: '#999' }}> {unit}</Text> : null}</Text>
    </View>
  );
}

function SummaryRow({ label, value, colors, f }: { label: string; value: string; colors: any; f: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: f.sm }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: f.sm, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function ModalField({ label, value, onChangeText, keyboardType, placeholder, colors, f }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: any; placeholder?: string; colors: any; f: any }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.textSecondary, fontSize: f.sm, fontWeight: '500', marginBottom: 4 }}>{label}</Text>
      <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: f.md, color: colors.text, backgroundColor: colors.background }} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={colors.textTertiary} />
    </View>
  );
}

// ── 统计辅助函数 ──
function avgOf(records: BodyRecord[], metric: ChartMetric): string {
  const vals = records.map(r => (r as any)[metric]).filter((v: any) => v != null && !isNaN(v));
  if (vals.length === 0) return '--';
  return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1);
}
function minOf(records: BodyRecord[], metric: ChartMetric): string {
  const vals = records.map(r => (r as any)[metric]).filter((v: any) => v != null && !isNaN(v));
  return vals.length > 0 ? String(Math.min(...vals)) : '--';
}
function maxOf(records: BodyRecord[], metric: ChartMetric): string {
  const vals = records.map(r => (r as any)[metric]).filter((v: any) => v != null && !isNaN(v));
  return vals.length > 0 ? String(Math.max(...vals)) : '--';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName: { fontWeight: '700' },
  userHandle: { marginTop: 2 },
  logoutBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  logoutText: { fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: 3, marginBottom: Spacing.xs },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.sm },
  tabText: {},
  recordItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm },
  recordDateCol: { alignItems: 'center', marginRight: Spacing.md, minWidth: 50 },
  recordDate: { fontWeight: '700' },
  recordDay: {},
  recordMetrics: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontWeight: '600', marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  metricBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chartCard: { padding: 14, borderWidth: 1, marginBottom: 16 },
  chartTitle: { fontWeight: '600', marginBottom: 8 },
  summaryCard: { padding: 14, borderWidth: 1 },
  summaryTitle: { fontWeight: '600', marginBottom: 8 },
  section: { marginBottom: 20, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  sectionTitle: { fontWeight: '600', marginBottom: 8, paddingHorizontal: 4 },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  settingRowLeft: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingRowContent: { flex: 1 },
  settingRowTitle: { fontWeight: '500' },
  settingRowSubtitle: { marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { fontWeight: '700', marginBottom: 16 },
  modalLabel: { fontWeight: '500', marginBottom: 6, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  goalTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  goalTypeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
});
