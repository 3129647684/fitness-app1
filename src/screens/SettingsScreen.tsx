import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  getUserProfile, updateUserProfile, getActiveGoals, saveGoal,
  getAllTags, addTag, deleteTag, setActiveUser, getRecords, insertBodyRecord,
} from '@/database/db';
import { UserProfile, Goal, BodyRecord } from '@/database/types';
import { exportRecordsCsv, importRecordsCsv } from '@/utils/csv';
import { getTodayString } from '@/utils/date';
import { getCachedUser, clearSession, getToken } from '@/database/session';
import { syncPush, syncPull } from '@/database/sync';
import type { SettingsScreenProps } from '@/navigation/RootNavigator';

export default function SettingsScreen(_props: SettingsScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsScreenProps['navigation']>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState(getCachedUser());
  const [syncing, setSyncing] = useState(false);

  const [editProfile, setEditProfile] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [newTag, setNewTag] = useState('');

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetWaist, setTargetWaist] = useState('');

  const [goalType, setGoalType] = useState<'weight' | 'waist' | 'body_fat'>('weight');
  const [goalValue, setGoalValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const loadData = async () => {
    const p = await getUserProfile();
    setProfile(p);
    setHeight(p?.height?.toString() ?? '');
    setWeight(p?.weight?.toString() ?? '');
    setAge(p?.age?.toString() ?? '');
    setGender(p?.gender ?? 'male');
    setTargetWeight(p?.target_weight?.toString() ?? '');
    setTargetWaist(p?.target_waist?.toString() ?? '');
  const g = await getActiveGoals();
    setGoals(g);

    const t = await getAllTags();
    setTags(t.map(tag => tag.tag_name));
  };

  useEffect(() => {
    loadData();
  }, []);

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
        target_waist: targetWaist ? parseFloat(targetWaist) : null,
      });
      setEditProfile(false);
      loadData();
      Alert.alert('成功', '个人信息已保存');
    } catch (e) {
      Alert.alert('保存失败', (e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveGoal = async () => {
    if (savingGoal) return;
    if (!goalValue) {
      Alert.alert('提示', '请输入目标值');
      return;
    }
    setSavingGoal(true);
    try {
      await saveGoal({
        goal_type: goalType,
        target_value: parseFloat(goalValue),
        start_date: getTodayString(),
      });
      setEditGoal(false);
      setGoalValue('');
      loadData();
      Alert.alert('成功', '目标已设定');
    } catch (e) {
      Alert.alert('保存失败', (e as Error).message);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleExport = async () => {
    try {
      const records = await getRecords();
      await exportRecordsCsv(records);
      Alert.alert('成功', '数据已导出');
    } catch (e) {
      Alert.alert('错误', '导出失败: ' + (e as Error).message);
    }
  };

  const handleImport = async () => {
    try {
      const result = await importRecordsCsv();
      if (!result || !result.rows) {
        return;
      }
      let imported = 0;
      let skipped = 0;
      for (const row of result.rows) {
        try {
          const record: Partial<BodyRecord> & { record_date: string } = {
            record_date: row.record_date,
            weight: row.weight ? parseFloat(String(row.weight)) : null,
            body_fat: row.body_fat ? parseFloat(String(row.body_fat)) : null,
            muscle_mass: row.muscle_mass ? parseFloat(String(row.muscle_mass)) : null,
            water_rate: row.water_rate ? parseFloat(String(row.water_rate)) : null,
            bmr: row.bmr ? parseFloat(String(row.bmr)) : null,
            bmi: row.bmi ? parseFloat(String(row.bmi)) : null,
            chest: row.chest ? parseFloat(String(row.chest)) : null,
            waist: row.waist ? parseFloat(String(row.waist)) : null,
            hip: row.hip ? parseFloat(String(row.hip)) : null,
            upper_arm: row.upper_arm ? parseFloat(String(row.upper_arm)) : null,
            thigh: row.thigh ? parseFloat(String(row.thigh)) : null,
            calf: row.calf ? parseFloat(String(row.calf)) : null,
            neck: row.neck ? parseFloat(String(row.neck)) : null,
            heart_rate: row.heart_rate ? parseInt(String(row.heart_rate), 10) : null,
            steps: row.steps ? parseInt(String(row.steps), 10) : null,
            water_intake: row.water_intake ? parseFloat(String(row.water_intake)) : null,
            body_temperature: row.body_temperature ? parseFloat(String(row.body_temperature)) : null,
            mood: row.mood ? parseInt(String(row.mood), 10) : null,
            sleep_duration: row.sleep_duration ? parseFloat(String(row.sleep_duration)) : null,
            sleep_score: row.sleep_score ? parseInt(String(row.sleep_score), 10) : null,
            is_menstrual: row.is_menstrual ? (typeof row.is_menstrual === 'number' ? row.is_menstrual : (row.is_menstrual ? 1 : 0)) : 0,
            menstrual_day: row.menstrual_day ? parseInt(String(row.menstrual_day), 10) : null,
            exercise_type: row.exercise_type as any,
            exercise_duration: row.exercise_duration ? parseInt(String(row.exercise_duration), 10) : null,
            exercise_note: row.exercise_note || null,
            body_status: row.body_status || null,
            remark: row.remark || null,
            food_list: row.food_list || null,
            sport_list: row.sport_list || null,
          };
          if (record.record_date) {
            await insertBodyRecord(record);
            imported++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }
      Alert.alert('导入完成', `成功导入 ${imported} 条记录，跳过 ${skipped} 条重复记录`);
      loadData();
    } catch (e) {
      Alert.alert('错误', '导入失败: ' + (e as Error).message);
    }
  };

  const handleSyncUpload = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const token = await getToken(); if (token) await syncPush(token);
      Alert.alert('同步成功', '本地数据已上传到云端');
    } catch (e) {
      Alert.alert('同步失败', (e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncRestore = async () => {
    if (syncing) return;
    Alert.alert('云端恢复', '将用云端数据覆盖本机当前数据，确定继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '恢复',
        style: 'destructive',
        onPress: async () => {
          setSyncing(true);
          try {
            const token2 = await getToken(); const pullRes = token2 ? await syncPull(token2) : { ok: false, msg: '未登录' }; const count = (pullRes as any)?.recordsImported ?? 0;
            loadData();
            Alert.alert('恢复完成', count > 0 ? `已恢复 ${count} 条记录` : '云端暂无备份数据');
          } catch (e) {
            Alert.alert('恢复失败', (e as Error).message);
          } finally {
            setSyncing(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '退出后本机数据将保留，下次登录可再次云端恢复。确定退出？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          setActiveUser(null);
          setCurrentUser(null);
          navigation.reset({ index: 0, routes: [{ name: 'Login' as any }] });
        },
      },
    ]);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    await addTag(newTag.trim());
    setNewTag('');
    loadData();
  };

  const handleDeleteTag = (tag: string) => {
    Alert.alert('删除标签', `确定删除「${tag}」标签？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteTag(tag); loadData(); } },
    ]);
  };

  const SettingRow = ({ icon, title, subtitle, onPress, right }: {
    icon: string; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingRowLeft, { backgroundColor: colors.primarySoft }]}>
        <Icons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingRowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Icons name="chevron-forward" size={18} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 60 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>设置</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>我的账户</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <View style={styles.accountRow}>
            <View style={[styles.accountAvatar, { backgroundColor: colors.primarySoft }]}>
              <Icons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text }]}>
                {currentUser?.nickname || currentUser?.username || '未登录'}
              </Text>
              <Text style={[styles.accountUser, { color: colors.textTertiary }]}>@{currentUser?.username}</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.logoutBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.logoutText, { color: colors.danger }]}>退出</Text>
            </TouchableOpacity>
          </View>
          <SettingRow
            icon="cloud-upload-outline"
            title="上传到云端"
            subtitle={syncing ? '处理中…' : '将本机数据备份到服务器'}
            onPress={handleSyncUpload}
          />
          <SettingRow
            icon="cloud-download-outline"
            title="从云端恢复"
            subtitle="用云端备份覆盖本机数据（换机恢复）"
            onPress={handleSyncRestore}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>个人档案</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <SettingRow
            icon="person-outline"
            title="个人信息"
            subtitle={`身高 ${profile?.height ?? '--'}cm | ${profile?.gender === 'male' ? '男' : '女'} | ${profile?.age ?? '--'}岁`}
            onPress={() => setEditProfile(true)}
          />
          <SettingRow
            icon="flag-outline"
            title="目标管理"
            subtitle={goals.length > 0 ? `已设 ${goals.length} 个目标` : '未设置目标'}
            onPress={() => setEditGoal(true)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>标签管理</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <View key={tag} style={[styles.tagItem, { borderColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                <TouchableOpacity onPress={() => handleDeleteTag(tag)}>
                  <Icons name="close-circle" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addTagRow}>
            <TextInput
              style={[styles.tagInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="新标签名称"
              placeholderTextColor={colors.textTertiary}
              value={newTag}
              onChangeText={setNewTag}
            />
            <TouchableOpacity style={[styles.addTagBtn, { backgroundColor: colors.primary }, Shadows.sm]} onPress={handleAddTag} activeOpacity={0.85}>
              <Icons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>数据备份</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <SettingRow
            icon="download-outline"
            title="导出数据"
            subtitle="导出为CSV文件，保存到本地"
            onPress={handleExport}
          />
          <SettingRow
            icon="cloud-upload-outline"
            title="导入数据"
            subtitle="从CSV文件恢复数据"
            onPress={handleImport}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>关于</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
          <SettingRow
            icon="information-circle-outline"
            title="版本"
            subtitle="v1.0.0 (MVP)"
          />
          <SettingRow
            icon="shield-checkmark-outline"
            title="隐私说明"
            subtitle="账户数据云端加密备份，可随时上传/恢复"
          />
          <SettingRow
            icon="fitness-outline"
            title="身体数据记录"
            subtitle="多用户 · 本地优先 · 云端备份"
          />
        </View>
      </View>

      <Modal visible={editProfile} animationType="slide" transparent onRequestClose={() => setEditProfile(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>编辑个人信息</Text>
            <View style={styles.modalForm}>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>身高 (cm)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>体重 (kg)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>年龄</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>性别</Text>
                <View style={styles.genderRow}>
                  {(['male', 'female'] as const).map(g => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[
                        styles.genderBtn,
                        { backgroundColor: gender === g ? colors.primary : colors.background, borderColor: gender === g ? colors.primary : colors.border },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: gender === g ? '#FFF' : colors.text }}>{g === 'male' ? '男' : '女'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>目标体重 (kg)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>目标腰围 (cm)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={targetWaist}
                  onChangeText={setTargetWaist}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditProfile(false)} activeOpacity={0.7} disabled={savingProfile}>
                <Text style={{ color: savingProfile ? colors.textTertiary : colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: savingProfile ? 0.7 : 1 }]} onPress={handleSaveProfile} activeOpacity={0.85} disabled={savingProfile}>
                {savingProfile ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editGoal} animationType="slide" transparent onRequestClose={() => setEditGoal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>设定目标</Text>
            <View style={styles.modalForm}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>目标类型</Text>
              <View style={styles.goalTypeRow}>
                {([
                  { value: 'weight', label: '体重' },
                  { value: 'waist', label: '腰围' },
                  { value: 'body_fat', label: '体脂率' },
                ] as const).map(gt => (
                  <TouchableOpacity
                    key={gt.value}
                    onPress={() => setGoalType(gt.value)}
                    style={[
                      styles.goalTypeBtn,
                      { backgroundColor: goalType === gt.value ? colors.primary : colors.background, borderColor: goalType === gt.value ? colors.primary : colors.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: goalType === gt.value ? '#FFF' : colors.text }}>{gt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  目标值{goalType === 'weight' ? ' (kg)' : goalType === 'waist' ? ' (cm)' : ' (%)'}
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={goalValue}
                  onChangeText={setGoalValue}
                  keyboardType="decimal-pad"
                  placeholder="输入目标值"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              {goals.length > 0 && (
                <View style={styles.existingGoals}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>当前目标</Text>
                  {goals.map((g, i) => (
                    <Text key={i} style={[styles.existingGoalText, { color: colors.text }]}>
                      {g.goal_type === 'weight' ? '体重' : g.goal_type === 'waist' ? '腰围' : '体脂率'}: {g.target_value}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditGoal(false)} activeOpacity={0.7} disabled={savingGoal}>
                <Text style={{ color: savingGoal ? colors.textTertiary : colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: savingGoal ? 0.7 : 1 }]} onPress={handleSaveGoal} activeOpacity={0.85} disabled={savingGoal}>
                {savingGoal ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: { marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm + 2, paddingHorizontal: Spacing.xs },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  accountAvatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  accountUser: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + 2,
    borderBottomWidth: 1,
  },
  settingRowLeft: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingRowContent: { flex: 1 },
  settingRowTitle: { fontSize: FontSize.md, fontWeight: '500' },
  settingRowSubtitle: { fontSize: FontSize.xs, marginTop: 3 },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.md + 2,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: FontSize.sm },
  addTagRow: {
    flexDirection: 'row',
    padding: Spacing.md + 2,
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
  },
  addTagBtn: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  modalForm: { gap: Spacing.md },
  modalFormItem: {},
  modalLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs + 2,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.md,
  },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  goalTypeRow: { flexDirection: 'row', gap: Spacing.sm },
  goalTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  existingGoals: { marginTop: Spacing.md },
  existingGoalText: { fontSize: FontSize.sm, marginTop: 4 },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
