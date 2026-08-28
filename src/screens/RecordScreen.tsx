import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { InputField } from '@/components/InputField';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { getRecordByDate, saveRecord, getUserProfile, todayStr } from '@/database/db';
import { BodyRecord, UserProfile } from '@/database/types';
import { calcBMI } from '@/utils/calculations';
import { formatDateWithWeekday } from '@/utils/date';
import type { RecordScreenProps } from '@/navigation/RootNavigator';

export default function RecordScreen(_props: RecordScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<RecordScreenProps['navigation']>();
  const route = useRoute<RecordScreenProps['route']>();
  const insets = useSafeAreaInsets();
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const safeBottom = Math.max(insets.bottom || 0, Platform.OS === 'web' ? 20 : 12);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingDate, setEditingDate] = useState(route.params?.initialDate ?? todayStr());
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [sleepDuration, setSleepDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const computedBMI = calcBMI(
    weight ? parseFloat(weight) : null,
    profile?.height ?? null
  );

  const loadRecord = useCallback(async () => {
    const p = await getUserProfile();
    setProfile(p);
    const record = await getRecordByDate(editingDate);
    if (record) {
      setWeight(record.weight?.toString() ?? '');
      setBodyFat(record.body_fat?.toString() ?? '');
      setWaist(record.waist?.toString() ?? '');
      setSleepDuration(record.sleep_duration?.toString() ?? '');
    } else {
      setWeight('');
      setBodyFat('');
      setWaist('');
      setSleepDuration('');
    }
  }, [editingDate]);

  useFocusEffect(useCallback(() => { loadRecord(); }, [loadRecord]));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const record: Partial<BodyRecord> & { record_date: string } = {
        record_date: editingDate,
        weight: weight ? parseFloat(weight) : null,
        bmi: computedBMI,
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        waist: waist ? parseFloat(waist) : null,
        sleep_duration: sleepDuration ? parseFloat(sleepDuration) : null,
      };
      await saveRecord(record);
      navigation.goBack();
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '18' }]}>
        <Icons name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: f.md }]}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: insets.top + s.lg, paddingBottom: 120 + safeBottom }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text, fontSize: f.xl }]}>记录数据</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary, fontSize: f.sm }]}>
              {formatDateWithWeekday(editingDate)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.md]}>
          <SectionHeader title="身体核心数据" icon="body-outline" />
          <View style={styles.formGrid}>
            <View style={styles.formItem}>
              <InputField label="身高" value={profile?.height?.toString() ?? ''} onChangeText={() => {}} unit="cm" placeholder="请在设置中修改" disabled />
            </View>
            <View style={styles.formItem}>
              <InputField label="体重" value={weight} onChangeText={setWeight} unit="kg" placeholder="输入体重" />
            </View>
            <View style={styles.formItem}>
              <InputField label="BMI" value={computedBMI?.toFixed(1) ?? ''} onChangeText={() => {}} unit="" disabled placeholder="自动计算" />
            </View>
            <View style={styles.formItem}>
              <InputField label="体脂率" value={bodyFat} onChangeText={setBodyFat} unit="%" placeholder="选填" />
            </View>
            <View style={styles.formItem}>
              <InputField label="腰围" value={waist} onChangeText={setWaist} unit="cm" placeholder="选填" />
            </View>
            <View style={[styles.formItem, styles.formItemFull]}>
              <InputField label="睡眠时长" value={sleepDuration} onChangeText={setSleepDuration} unit="小时" placeholder="选填，如 7.5" />
            </View>
          </View>
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '20' }]}>
          <Icons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary, fontSize: f.sm }]}>
            只需记录核心指标，系统会自动计算 BMI。
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: safeBottom, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }, Shadows.md]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <GradientView colors={['#3FA372', '#2D6A4F']} style={styles.saveBtnInner}>
            <Icons name="checkmark" size={20} color="#FFF" />
            <Text style={[styles.saveBtnText, { fontSize: f.md }]}>{saving ? '保存中...' : '保存记录'}</Text>
          </GradientView>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: { flex: 1 },
  title: { fontWeight: '800' },
  dateText: { marginTop: 2, fontWeight: '500' },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontWeight: '700' },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  formItem: { width: '48%' },
  formItemFull: { width: '100%' },
  tipCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipText: { flex: 1, lineHeight: 20 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
