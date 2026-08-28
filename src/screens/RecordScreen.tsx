import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
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

// 5 个核心字段：体重 / BMI(自动) / 体脂率 / 腰围 / 睡眠时长
export default function RecordScreen(_props: RecordScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<RecordScreenProps['navigation']>();
  const route = useRoute<RecordScreenProps['route']>();
  const insets = useSafeAreaInsets();
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;
  const safeBottom = Math.max(insets.bottom || 0, Platform.OS === 'web' ? 20 : 12);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingDate, setEditingDate] = useState(route.params?.initialDate ?? todayStr());

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [sleepDuration, setSleepDuration] = useState('');

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

  useFocusEffect(
    useCallback(() => {
      const paramDate = route.params?.initialDate;
      if (paramDate && paramDate !== editingDate) {
        setEditingDate(paramDate);
      }
    }, [route.params?.initialDate, editingDate])
  );

  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [loadRecord])
  );

  const validateAndSave = async () => {
    const hasData = [weight, bodyFat, waist, sleepDuration].some(v => v !== '' && parseFloat(v) > 0);
    if (!hasData) {
      Alert.alert('提示', '至少录入一项有效数据才可保存');
      return;
    }

    const record: Partial<BodyRecord> & { record_date: string } = {
      record_date: editingDate,
      weight: weight ? parseFloat(weight) : null,
      bmi: computedBMI,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
      waist: waist ? parseFloat(waist) : null,
      sleep_duration: sleepDuration ? parseFloat(sleepDuration) : null,
    };

    try {
      await saveRecord(record);
      setTimeout(() => navigation.navigate('Home'), 200);
      Alert.alert('成功', '记录已保存');
    } catch (e) {
      Alert.alert('错误', '保存失败: ' + (e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: insets.top + s.lg, paddingBottom: 120 + safeBottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 头部 */}
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

        {/* 核心数据卡片 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: r.xl }, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
              <Icons name="body" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: f.md }]}>今日身体数据</Text>
          </View>

          <View style={styles.formGrid}>
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

        {/* 提示 */}
        <View style={styles.tipRow}>
          <Icons name="information-circle-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.tipText, { color: colors.textTertiary, fontSize: f.xs }]}>
            BMI 根据体重和身高自动计算，身高在「我的」页面设置
          </Text>
        </View>
      </ScrollView>

      {/* 底部保存按钮 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(safeBottom, s.md) }]}>
        <GradientView
          colors={colorScheme === 'dark' ? ['#2D6A4F', '#1B4332'] : ['#52B788', '#2D6A4F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.saveButton, Shadows.md]}
        >
          <TouchableOpacity style={styles.saveButtonInner} onPress={validateAndSave} activeOpacity={0.85}>
            <Icons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.saveButtonText, { fontSize: f.lg }]}>保存记录</Text>
          </TouchableOpacity>
        </GradientView>
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
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: { flex: 1 },
  title: { fontWeight: '700' },
  dateText: { marginTop: 2 },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '600' },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  formItem: { width: '47%', flexGrow: 1 },
  formItemFull: { width: '100%' },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg + 4,
    marginTop: Spacing.xs,
  },
  tipText: { flex: 1, lineHeight: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  saveButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
