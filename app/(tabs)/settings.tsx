import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  getUserProfile, updateUserProfile, getActiveGoals, saveGoal,
  getAllTags, addTag, deleteTag,
} from '@/database/db';
import { UserProfile, Goal } from '@/database/types';
import { exportToCSV, importFromCSV } from '@/utils/csv';
import { getTodayString } from '@/utils/date';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tags, setTags] = useState<string[]>([]);

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
  };

  const handleSaveGoal = async () => {
    if (!goalValue) {
      Alert.alert('提示', '请输入目标值');
      return;
    }
    await saveGoal({
      goal_type: goalType,
      target_value: parseFloat(goalValue),
      start_date: getTodayString(),
    });
    setEditGoal(false);
    setGoalValue('');
    loadData();
    Alert.alert('成功', '目标已设定');
  };

  const handleExport = async () => {
    try {
      await exportToCSV();
      Alert.alert('成功', '数据已导出');
    } catch (e) {
      Alert.alert('错误', '导出失败: ' + (e as Error).message);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (!result.canceled && result.assets[0]) {
        const { imported, skipped } = await importFromCSV(result.assets[0].uri);
        Alert.alert('导入完成', `成功导入 ${imported} 条记录，跳过 ${skipped} 条重复记录`);
      }
    } catch (e) {
      Alert.alert('错误', '导入失败: ' + (e as Error).message);
    }
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
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingRowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingRowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />)}
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
                  <Ionicons name="close-circle" size={16} color={colors.danger} />
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
              <Ionicons name="add" size={20} color="#FFF" />
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
            subtitle="所有数据本地存储，无云端同步"
          />
          <SettingRow
            icon="fitness-outline"
            title="身体数据记录"
            subtitle="个人自用 · 本地优先 · 隐私安全"
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
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditProfile(false)} activeOpacity={0.7}>
                <Text style={{ color: colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} activeOpacity={0.85}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>保存</Text>
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
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditGoal(false)} activeOpacity={0.7}>
                <Text style={{ color: colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveGoal} activeOpacity={0.85}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>保存</Text>
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
