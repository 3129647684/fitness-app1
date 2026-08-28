import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, TextInput, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Icons } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, DefaultTags, BodyStatusOptions, MoodOptions } from '@/constants/theme';
import { FoodDatabase, MealTypeOptions, calcFoodNutrition } from '@/constants/foodData';
import { CardioDatabase, calcStrengthCalorie, calcCardioCalorie } from '@/constants/fitness';
import { takePendingAction } from '@/store/exerciseStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { InputField } from '@/components/InputField';
import { TagChip } from '@/components/TagChip';
import {
  getTodayRecord, saveRecord, getUserProfile, getAllTags, addTag,
  getRecordTags, setRecordTags, getRecordByDate, todayStr,
} from '@/database/db';
import { BodyRecord, UserProfile, ExerciseType, FoodItem, MealType, SportDetail } from '@/database/types';
import { calcBMI, calcBMR } from '@/utils/calculations';
import { formatDateWithWeekday } from '@/utils/date';
import type { RecordScreenProps, RootStackParamList, MainTabsParamList } from '@/navigation/RootNavigator';

type RecordScreenNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Record'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function RecordScreen(_props: RecordScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<RecordScreenNavigation>();
  const route = useRoute<RecordScreenProps['route']>();
  const insets = useSafeAreaInsets();
  // 底部安全区兜底：与 RootNavigator 保持一致，防止 Web 端 iOS Safari Home Indicator 等遮挡
  const safeBottom = Math.max(insets.bottom || 0, Platform.OS === 'web' ? 20 : 12);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingDate, setEditingDate] = useState(route.params?.initialDate ?? todayStr());
  const [appliedParamDate, setAppliedParamDate] = useState<string | null>(route.params?.initialDate ?? null);

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waterRate, setWaterRate] = useState('');
  const [bmr, setBmr] = useState('');
  const [bmrManual, setBmrManual] = useState(false);

  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [upperArm, setUpperArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [calf, setCalf] = useState('');
  const [neck, setNeck] = useState('');

  const [heartRate, setHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [bodyTemp, setBodyTemp] = useState('');
  const [mood, setMood] = useState(0);

  const [exerciseType, setExerciseType] = useState<ExerciseType>('none');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseNote, setExerciseNote] = useState('');

  const [sleepDuration, setSleepDuration] = useState('');
  const [sleepScore, setSleepScore] = useState(0);
  const [bodyStatuses, setBodyStatuses] = useState<string[]>([]);
  const [isMenstrual, setIsMenstrual] = useState(false);
  const [menstrualDay, setMenstrualDay] = useState('');

  const [remark, setRemark] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(DefaultTags.map((t: any) => t));
  const [showCircumference, setShowCircumference] = useState(true);
  const [showExercise, setShowExercise] = useState(true);
  const [showSleep, setShowSleep] = useState(true);
  const [showVitals, setShowVitals] = useState(true);
  const [showFood, setShowFood] = useState(false);
  const [showSport, setShowSport] = useState(false);

  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [sportList, setSportList] = useState<SportDetail[]>([]);

  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [foodGramsVisible, setFoodGramsVisible] = useState(false);
  const [customFoodVisible, setCustomFoodVisible] = useState(false);
  const [selectedFoodDef, setSelectedFoodDef] = useState<{ name: string; cal: number; protein: number; carb: number; fat: number } | null>(null);
  const [foodGrams, setFoodGrams] = useState('');
  const [foodMealType, setFoodMealType] = useState<MealType>('');
  const [customFood, setCustomFood] = useState({ name: '', weight: '', cal: '', protein: '', carb: '', fat: '' });

  const [strengthModalVisible, setStrengthModalVisible] = useState(false);
  const [strengthAction, setStrengthAction] = useState<{ actionId: string; actionName: string; muscle: string } | null>(null);
  const [strengthSets, setStrengthSets] = useState('');
  const [strengthReps, setStrengthReps] = useState('');
  const [strengthWeight, setStrengthWeight] = useState('');

  const [cardioModalVisible, setCardioModalVisible] = useState(false);
  const [cardioType, setCardioType] = useState('jogging');
  const [cardioDuration, setCardioDuration] = useState('');

  const loadRecord = async () => {
    const p = await getUserProfile();
    setProfile(p);

    const allTags = await getAllTags();
    if (allTags.length > 0) {
      setAvailableTags(allTags.map(t => t.tag_name));
    }

    const record = await getRecordByDate(editingDate);
    if (record) {
      setWeight(record.weight?.toString() ?? '');
      setBodyFat(record.body_fat?.toString() ?? '');
      setMuscleMass(record.muscle_mass?.toString() ?? '');
      setWaterRate(record.water_rate?.toString() ?? '');
      setBmr(record.bmr?.toString() ?? '');
      setBmrManual(record.bmr !== null);
      setChest(record.chest?.toString() ?? '');
      setWaist(record.waist?.toString() ?? '');
      setHip(record.hip?.toString() ?? '');
      setUpperArm(record.upper_arm?.toString() ?? '');
      setThigh(record.thigh?.toString() ?? '');
      setCalf(record.calf?.toString() ?? '');
      setNeck(record.neck?.toString() ?? '');
      setHeartRate(record.heart_rate?.toString() ?? '');
      setSteps(record.steps?.toString() ?? '');
      setWaterIntake(record.water_intake?.toString() ?? '');
      setBodyTemp(record.body_temperature?.toString() ?? '');
      setMood(record.mood ?? 0);
      setExerciseType(record.exercise_type ?? 'none');
      setExerciseDuration(record.exercise_duration?.toString() ?? '');
      setExerciseNote(record.exercise_note ?? '');
      setSleepDuration(record.sleep_duration?.toString() ?? '');
      setSleepScore(record.sleep_score ?? 0);
      setBodyStatuses(record.body_status ? record.body_status.split(',') : []);
      setIsMenstrual(record.is_menstrual === 1);
      setMenstrualDay(record.menstrual_day?.toString() ?? '');
      setRemark(record.remark ?? '');

      try {
        setFoodList(record.food_list ? JSON.parse(record.food_list) : []);
      } catch { setFoodList([]); }
      try {
        const src = record.sport_json ?? record.sport_list;
        setSportList(src ? JSON.parse(src) : []);
      } catch { setSportList([]); }

      if (record.id) {
        const tags = await getRecordTags(record.id);
        setSelectedTags(tags.map(t => t.tag_name));
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const pending = takePendingAction();
      if (pending) {
        setStrengthAction({ actionId: pending.actionId, actionName: pending.actionName, muscle: pending.muscle });
        setStrengthSets('');
        setStrengthReps('');
        setStrengthWeight('');
        setStrengthModalVisible(true);
      }

      // 响应从 History / Calendar 跳转传入的 initialDate 参数
      const paramDate = route.params?.initialDate ?? null;
      if (paramDate && paramDate !== appliedParamDate) {
        setEditingDate(paramDate);
        setAppliedParamDate(paramDate);
      }
    }, [route.params?.initialDate, appliedParamDate])
  );

  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [editingDate])
  );

  const computedBMI = calcBMI(
    weight ? parseFloat(weight) : null,
    profile?.height ?? null
  );

  const computedBMR = bmrManual
    ? (bmr ? parseFloat(bmr) : null)
    : calcBMR(
        weight ? parseFloat(weight) : null,
        profile?.height ?? null,
        profile?.age ?? null,
        profile?.gender ?? null
      );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleBodyStatus = (status: string) => {
    setBodyStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const foodSummary = foodList.reduce((acc, f) => ({
    cal: acc.cal + f.cal,
    protein: acc.protein + (f.protein ?? 0),
    carb: acc.carb + (f.carb ?? 0),
    fat: acc.fat + (f.fat ?? 0),
  }), { cal: 0, protein: 0, carb: 0, fat: 0 });

  const sportSummary = sportList.reduce((acc, s) => acc + s.calorie, 0);

  const addFoodFromDB = () => {
    if (!selectedFoodDef || !foodGrams) return;
    const grams = parseFloat(foodGrams);
    if (isNaN(grams) || grams <= 0) return;
    const n = calcFoodNutrition(selectedFoodDef, grams);
    setFoodList(prev => [...prev, {
      name: selectedFoodDef.name, weight: grams, cal: n.cal,
      protein: n.protein, carb: n.carb, fat: n.fat, mealType: foodMealType,
    }]);
    setFoodGrams('');
    setFoodMealType('');
    setSelectedFoodDef(null);
    setFoodGramsVisible(false);
  };

  const addCustomFood = () => {
    if (!customFood.name || !customFood.weight || !customFood.cal) return;
    setFoodList(prev => [...prev, {
      name: customFood.name,
      weight: parseFloat(customFood.weight),
      cal: parseInt(customFood.cal, 10),
      protein: customFood.protein ? parseFloat(customFood.protein) : null,
      carb: customFood.carb ? parseFloat(customFood.carb) : null,
      fat: customFood.fat ? parseFloat(customFood.fat) : null,
      mealType: foodMealType,
    }]);
    setCustomFood({ name: '', weight: '', cal: '', protein: '', carb: '', fat: '' });
    setFoodMealType('');
    setCustomFoodVisible(false);
  };

  const removeFood = (index: number) => {
    setFoodList(prev => prev.filter((_, i) => i !== index));
  };

  const calcUserWeight = (): number | null => {
    if (weight && parseFloat(weight) > 0) return parseFloat(weight);
    if (profile?.weight && profile.weight > 0) return profile.weight;
    return null;
  };

  const addStrengthSport = () => {
    if (!strengthAction || !strengthSets) return;
    const sets = parseInt(strengthSets, 10);
    if (isNaN(sets) || sets <= 0) return;
    const weightBase = calcUserWeight();
    if (weightBase === null) {
      Alert.alert('提示', '请先记录体重或在设置中填写体重，才能计算训练消耗热量');
      return;
    }
    const reps = strengthReps ? parseInt(strengthReps, 10) : 0;
    const wKg = strengthWeight ? parseFloat(strengthWeight) : 0;
    const { durationMin, calorie } = calcStrengthCalorie(sets, weightBase);
    setSportList(prev => [...prev, {
      type: 'strength',
      actionId: strengthAction.actionId,
      actionName: strengthAction.actionName,
      muscle: strengthAction.muscle,
      sets,
      reps,
      weight: wKg,
      durationMin,
      calorie,
    }]);
    setStrengthModalVisible(false);
    setStrengthAction(null);
    setStrengthSets('');
    setStrengthReps('');
    setStrengthWeight('');
  };

  const addCardioSport = () => {
    if (!cardioDuration) return;
    const dur = parseInt(cardioDuration, 10);
    if (isNaN(dur) || dur <= 0) return;
    const weightBase = calcUserWeight();
    if (weightBase === null) {
      Alert.alert('提示', '请先记录体重或在设置中填写体重，才能计算运动消耗热量');
      return;
    }
    const def = CardioDatabase.find(c => c.key === cardioType) ?? CardioDatabase[0];
    const calorie = calcCardioCalorie(def.met, dur, weightBase);
    setSportList(prev => [...prev, {
      type: 'cardio',
      actionName: def.label,
      durationMin: dur,
      calorie,
    }]);
    setCardioModalVisible(false);
    setCardioDuration('');
  };

  const removeSport = (index: number) => {
    setSportList(prev => prev.filter((_, i) => i !== index));
  };

  const quickStrength = () => {
    const weightBase = calcUserWeight();
    if (weightBase === null) {
      Alert.alert('提示', '请先记录体重或在设置中填写体重，才能计算训练消耗热量');
      return;
    }
    const sets = 4;
    const reps = 10;
    const { durationMin, calorie } = calcStrengthCalorie(sets, weightBase);
    setSportList(prev => [...prev, {
      type: 'strength',
      actionId: 'general_strength',
      actionName: '综合力量训练',
      muscle: '综合',
      sets,
      reps,
      weight: 0,
      durationMin,
      calorie,
    }]);
  };

  const quickCardio = () => {
    const weightBase = calcUserWeight();
    if (weightBase === null) {
      Alert.alert('提示', '请先记录体重或在设置中填写体重，才能计算运动消耗热量');
      return;
    }
    const def = CardioDatabase.find(c => c.key === 'jogging') ?? CardioDatabase[0];
    const dur = 30;
    const calorie = calcCardioCalorie(def.met, dur, weightBase);
    setSportList(prev => [...prev, {
      type: 'cardio',
      actionName: def.label,
      durationMin: dur,
      calorie,
    }]);
  };

  const validateAndSave = async () => {
    const hasData = [
      weight, bodyFat, muscleMass, waterRate,
      chest, waist, hip, upperArm, thigh, calf, neck,
      heartRate, steps, waterIntake, bodyTemp,
      exerciseDuration, sleepDuration, remark,
      sleepScore > 0, selectedTags.length > 0, exerciseType !== 'none', mood > 0, isMenstrual,
      foodList.length > 0, sportList.length > 0,
    ].some((v: unknown) => v !== '' && v !== 0 && v !== false);

    if (!hasData) {
      Alert.alert('提示', '至少录入一项有效数据才可保存');
      return;
    }

    const record: Partial<BodyRecord> & { record_date: string } = {
      record_date: editingDate,
      weight: weight ? parseFloat(weight) : null,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
      muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
      water_rate: waterRate ? parseFloat(waterRate) : null,
      bmr: computedBMR,
      bmi: computedBMI,
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      hip: hip ? parseFloat(hip) : null,
      upper_arm: upperArm ? parseFloat(upperArm) : null,
      thigh: thigh ? parseFloat(thigh) : null,
      calf: calf ? parseFloat(calf) : null,
      neck: neck ? parseFloat(neck) : null,
      heart_rate: heartRate ? parseInt(heartRate, 10) : null,
      steps: steps ? parseInt(steps, 10) : null,
      water_intake: waterIntake ? parseFloat(waterIntake) : null,
      body_temperature: bodyTemp ? parseFloat(bodyTemp) : null,
      mood: mood || null,
      sleep_duration: sleepDuration ? parseFloat(sleepDuration) : null,
      sleep_score: sleepScore || null,
      is_menstrual: isMenstrual ? 1 : 0,
      menstrual_day: menstrualDay ? parseInt(menstrualDay, 10) : null,
      exercise_type: exerciseType,
      exercise_duration: exerciseDuration ? parseInt(exerciseDuration, 10) : null,
      exercise_note: exerciseNote || null,
      body_status: bodyStatuses.length > 0 ? bodyStatuses.join(',') : null,
      remark: remark || null,
      food_list: foodList.length > 0 ? JSON.stringify(foodList) : null,
      sport_list: sportList.length > 0 ? JSON.stringify(sportList) : null,
      sport_json: sportList.length > 0 ? JSON.stringify(sportList) : null,
      sport_total_cal: sportList.length > 0 ? sportSummary : null,
    };

    try {
      const recordId = await saveRecord(record);
      if (selectedTags.length > 0) {
        await setRecordTags(recordId, selectedTags);
      }
      // 不依赖 Alert 回调（Web 端可点外部关闭 Alert），保存成功直接跳转首页
      setTimeout(() => navigation.navigate('Index'), 200);
      Alert.alert('成功', '记录已保存');
    } catch (e) {
      Alert.alert('错误', '保存失败: ' + (e as Error).message);
    }
  };

  const SectionHeader = ({ title, icon, expandable, expanded, onToggle, rightElement }: {
    title: string; icon: string; expandable?: boolean; expanded?: boolean; onToggle?: () => void; rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      disabled={!expandable}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}>
          <Icons name={icon as any} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {rightElement}
      {expandable && (
        <Icons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const FoodPickerModal = () => (
    <Modal visible={foodPickerVisible} animationType="slide" transparent onRequestClose={() => setFoodPickerVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>选择食物</Text>
            <TouchableOpacity onPress={() => setFoodPickerVisible(false)}>
              <Icons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {FoodDatabase.map(cat => (
              <View key={cat.category} style={styles.foodCategory}>
                <Text style={[styles.foodCategoryTitle, { color: colors.textSecondary }]}>{cat.category}</Text>
                <View style={styles.foodGrid}>
                  {cat.foods.map(food => (
                    <TouchableOpacity
                      key={food.name}
                      style={[styles.foodChip, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                      onPress={() => {
                        setSelectedFoodDef(food);
                        setFoodGrams('');
                        setFoodMealType('');
                        setFoodPickerVisible(false);
                        setTimeout(() => setFoodGramsVisible(true), 50);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.foodChipName, { color: colors.text }]}>{food.name}</Text>
                      <Text style={[styles.foodChipCal, { color: colors.textTertiary }]}>{food.cal}kcal/100g</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.customAddBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setFoodPickerVisible(false); setTimeout(() => setCustomFoodVisible(true), 50); }}
            activeOpacity={0.85}
          >
            <Icons name="add" size={20} color="#FFF" />
            <Text style={styles.customAddBtnText}>自定义食物</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const FoodGramsModal = () => (
    <Modal visible={foodGramsVisible} animationType="slide" transparent onRequestClose={() => setFoodGramsVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.inputModal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputModalTitle, { color: colors.text }]}>{selectedFoodDef?.name}</Text>
          <Text style={[styles.inputModalSub, { color: colors.textTertiary }]}>每100g: {selectedFoodDef?.cal}kcal</Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>食用克数 (g)</Text>
          <TextInput
            style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={foodGrams}
            onChangeText={setFoodGrams}
            keyboardType="decimal-pad"
            placeholder="如 150"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>餐次 (选填)</Text>
          <View style={styles.mealTypeRow}>
            {MealTypeOptions.map((opt: any) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setFoodMealType(opt.value as MealType)}
                style={[
                  styles.mealTypeBtn,
                  {
                    backgroundColor: foodMealType === opt.value ? colors.primary : colors.surfaceVariant,
                    borderColor: foodMealType === opt.value ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={{ color: foodMealType === opt.value ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {foodGrams ? (
            <View style={[styles.nutritionPreview, { backgroundColor: colors.primarySoft }]}>
              {(() => {
                const n = calcFoodNutrition(selectedFoodDef!, parseFloat(foodGrams));
                return (
                  <View style={styles.nutritionPreviewRow}>
                    <Text style={[styles.nutritionPreviewItem, { color: colors.primary }]}>{n.cal} kcal</Text>
                    <Text style={[styles.nutritionPreviewItem, { color: colors.textSecondary }]}>蛋白{n.protein}</Text>
                    <Text style={[styles.nutritionPreviewItem, { color: colors.textSecondary }]}>碳水{n.carb}</Text>
                    <Text style={[styles.nutritionPreviewItem, { color: colors.textSecondary }]}>脂肪{n.fat}</Text>
                  </View>
                );
              })()}
            </View>
          ) : null}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setFoodGramsVisible(false)} activeOpacity={0.7}>
              <Text style={{ color: colors.textSecondary }}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={addFoodFromDB} activeOpacity={0.85}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>加入</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const CustomFoodModal = () => (
    <Modal visible={customFoodVisible} animationType="slide" transparent onRequestClose={() => setCustomFoodVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.inputModal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputModalTitle, { color: colors.text }]}>自定义食物</Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>食物名称</Text>
          <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.name} onChangeText={(v) => setCustomFood({ ...customFood, name: v })} placeholder="如 全麦面包" placeholderTextColor={colors.textTertiary} />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>食用重量 (g)</Text>
          <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.weight} onChangeText={(v) => setCustomFood({ ...customFood, weight: v })} keyboardType="decimal-pad" placeholder="如 100" placeholderTextColor={colors.textTertiary} />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>热量 (kcal)</Text>
          <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.cal} onChangeText={(v) => setCustomFood({ ...customFood, cal: v })} keyboardType="decimal-pad" placeholder="如 250" placeholderTextColor={colors.textTertiary} />
          <View style={styles.formGrid}>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>蛋白质 (选填)</Text>
              <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.protein} onChangeText={(v) => setCustomFood({ ...customFood, protein: v })} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>碳水 (选填)</Text>
              <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.carb} onChangeText={(v) => setCustomFood({ ...customFood, carb: v })} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>脂肪 (选填)</Text>
              <TextInput style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} value={customFood.fat} onChangeText={(v) => setCustomFood({ ...customFood, fat: v })} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={colors.textTertiary} />
            </View>
          </View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>餐次 (选填)</Text>
          <View style={styles.mealTypeRow}>
            {MealTypeOptions.map((opt: any) => (
              <TouchableOpacity key={opt.value} onPress={() => setFoodMealType(opt.value as MealType)} style={[styles.mealTypeBtn, { backgroundColor: foodMealType === opt.value ? colors.primary : colors.surfaceVariant, borderColor: foodMealType === opt.value ? colors.primary : colors.border }]} activeOpacity={0.7}>
                <Text style={{ color: foodMealType === opt.value ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setCustomFoodVisible(false)} activeOpacity={0.7}>
              <Text style={{ color: colors.textSecondary }}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={addCustomFood} activeOpacity={0.85}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>加入</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const strengthPreview = !strengthSets ? null : (() => {
    const s = parseInt(strengthSets, 10);
    if (isNaN(s) || s <= 0) return null;
    const wb = calcUserWeight();
    if (wb === null) return 'needWeight';
    return calcStrengthCalorie(s, wb);
  })();

  const cardioDef = CardioDatabase.find(c => c.key === cardioType) ?? CardioDatabase[0];
  const cardioPreview = !cardioDuration ? null : (() => {
    const d = parseInt(cardioDuration, 10);
    if (isNaN(d) || d <= 0) return null;
    const wb = calcUserWeight();
    if (wb === null) return 'needWeight';
    return calcCardioCalorie(cardioDef.met, d, wb);
  })();

  const StrengthModal = () => (
    <Modal visible={strengthModalVisible} animationType="slide" transparent onRequestClose={() => setStrengthModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.inputModal, { backgroundColor: colors.surface }]}>
          <View style={styles.pickerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputModalTitle, { color: colors.text }]}>添加力量动作</Text>
              <Text style={[styles.inputModalSub, { color: colors.textTertiary }]}>
                {strengthAction ? `${strengthAction.actionName} · ${strengthAction.muscle}` : '请先选择训练动作'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setStrengthModalVisible(false)}>
              <Icons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!strengthAction ? (
            <TouchableOpacity
              style={[styles.addListBtn, { borderColor: colors.primary }]}
              onPress={() => {
                setStrengthModalVisible(false);
                setTimeout(() => navigation.navigate('ExercisePicker'), 50);
              }}
              activeOpacity={0.7}
            >
              <Icons name="barbell-outline" size={18} color={colors.primary} />
              <Text style={[styles.addListBtnText, { color: colors.primary }]}>选择训练动作</Text>
              <Icons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>组数</Text>
              <TextInput
                style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                value={strengthSets}
                onChangeText={setStrengthSets}
                keyboardType="numeric"
                placeholder="如 4"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.formGrid}>
                <View style={styles.formItem}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>每组次数</Text>
                  <TextInput
                    style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={strengthReps}
                    onChangeText={setStrengthReps}
                    keyboardType="numeric"
                    placeholder="如 8"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>重量 (kg)</Text>
                  <TextInput
                    style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={strengthWeight}
                    onChangeText={setStrengthWeight}
                    keyboardType="decimal-pad"
                    placeholder="如 60"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
              {strengthPreview === 'needWeight' ? (
                <View style={[styles.nutritionPreview, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.nutritionPreviewItem, { color: colors.textTertiary }]}>请先记录体重或在设置中填写体重</Text>
                </View>
              ) : strengthPreview ? (
                <View style={[styles.nutritionPreview, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.nutritionPreviewItem, { color: colors.primary }]}>
                    约耗时 {strengthPreview.durationMin} 分钟 · 消耗 {strengthPreview.calorie} kcal
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {strengthAction && (
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setStrengthModalVisible(false)} activeOpacity={0.7}>
                <Text style={{ color: colors.textSecondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={addStrengthSport} activeOpacity={0.85}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>确认</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const CardioModal = () => (
    <Modal visible={cardioModalVisible} animationType="slide" transparent onRequestClose={() => setCardioModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.inputModal, { backgroundColor: colors.surface }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.inputModalTitle, { color: colors.text }]}>添加有氧运动</Text>
            <TouchableOpacity onPress={() => setCardioModalVisible(false)}>
              <Icons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>选择项目</Text>
          <View style={styles.mealTypeRow}>
            {CardioDatabase.map(c => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCardioType(c.key)}
                style={[
                  styles.mealTypeBtn,
                  {
                    backgroundColor: cardioType === c.key ? colors.primary : colors.surfaceVariant,
                    borderColor: cardioType === c.key ? colors.primary : colors.border,
                    paddingHorizontal: Spacing.lg,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={{ color: cardioType === c.key ? '#FFF' : colors.textSecondary, fontSize: FontSize.sm }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>运动时长 (分钟)</Text>
          <TextInput
            style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={cardioDuration}
            onChangeText={setCardioDuration}
            keyboardType="numeric"
            placeholder="如 30"
            placeholderTextColor={colors.textTertiary}
          />

          {cardioPreview === 'needWeight' ? (
            <View style={[styles.nutritionPreview, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.nutritionPreviewItem, { color: colors.textTertiary }]}>请先记录体重或在设置中填写体重</Text>
            </View>
          ) : cardioPreview ? (
            <View style={[styles.nutritionPreview, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.nutritionPreviewItem, { color: colors.primary }]}>
                {cardioDef.label} · 消耗 {cardioPreview} kcal
              </Text>
            </View>
          ) : null}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setCardioModalVisible(false)} activeOpacity={0.7}>
              <Text style={{ color: colors.textSecondary }}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={addCardioSport} activeOpacity={0.85}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 230 + safeBottom }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>数据录入</Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDateWithWeekday(editingDate)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="基础体态指标" icon="body-outline" />
          <View style={styles.formGrid}>
            <View style={styles.formItem}>
              <InputField label="身高" value={profile?.height?.toString() ?? ''} onChangeText={() => {}} unit="cm" placeholder="请在设置中修改" disabled />
            </View>
            <View style={styles.formItem}>
              <InputField label="体重" value={weight} onChangeText={setWeight} unit="kg" placeholder="输入体重" />
            </View>
            <View style={styles.formItem}>
              <InputField label="体脂率" value={bodyFat} onChangeText={setBodyFat} unit="%" optional />
            </View>
            <View style={styles.formItem}>
              <InputField label="肌肉量" value={muscleMass} onChangeText={setMuscleMass} unit="kg" optional />
            </View>
            <View style={styles.formItem}>
              <InputField label="水分率" value={waterRate} onChangeText={setWaterRate} unit="%" optional />
            </View>
            <View style={styles.formItem}>
              <InputField label="BMI (自动)" value={computedBMI?.toFixed(1) ?? ''} onChangeText={() => {}} disabled />
            </View>
            <View style={styles.formItem}>
              <InputField label="基础代谢" value={computedBMR?.toString() ?? ''} onChangeText={(v) => { setBmr(v); setBmrManual(true); }} unit="kcal" placeholder={computedBMR ? '' : '自动计算'} />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="身体围度" icon="resize-outline" expandable expanded={showCircumference} onToggle={() => setShowCircumference(!showCircumference)} />
          {showCircumference && (
            <View style={styles.formGrid}>
              <View style={styles.formItem}><InputField label="胸围" value={chest} onChangeText={setChest} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="腰围" value={waist} onChangeText={setWaist} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="臀围" value={hip} onChangeText={setHip} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="上臂围" value={upperArm} onChangeText={setUpperArm} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="大腿围" value={thigh} onChangeText={setThigh} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="小腿围" value={calf} onChangeText={setCalf} unit="cm" /></View>
              <View style={styles.formItem}><InputField label="颈围" value={neck} onChangeText={setNeck} unit="cm" /></View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="日常生命体征" icon="heart-outline" expandable expanded={showVitals} onToggle={() => setShowVitals(!showVitals)} />
          {showVitals && (
            <View>
              <View style={styles.formGrid}>
                <View style={styles.formItem}><InputField label="静息心率" value={heartRate} onChangeText={setHeartRate} unit="bpm" placeholder="测量后输入" /></View>
                <View style={styles.formItem}><InputField label="步数" value={steps} onChangeText={setSteps} unit="步" keyboardType="numeric" /></View>
                <View style={styles.formItem}><InputField label="饮水量" value={waterIntake} onChangeText={setWaterIntake} unit="ml" placeholder="如 1500" /></View>
                <View style={styles.formItem}><InputField label="体温" value={bodyTemp} onChangeText={setBodyTemp} unit="°C" placeholder="如 36.5" /></View>
              </View>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>心情</Text>
              <View style={styles.moodRow}>
                {MoodOptions.map((opt: any) => (
                  <TouchableOpacity key={opt.value} onPress={() => setMood(mood === opt.value ? 0 : opt.value)} style={[styles.moodBtn, { backgroundColor: mood === opt.value ? colors.primarySoft : colors.surfaceVariant, borderColor: mood === opt.value ? colors.primary : colors.border }]} activeOpacity={0.7}>
                    <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.moodLabel, { color: mood === opt.value ? colors.primary : colors.textTertiary }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader
            title="今日饮食记录"
            icon="restaurant-outline"
            expandable
            expanded={showFood}
            onToggle={() => setShowFood(!showFood)}
            rightElement={foodList.length > 0 ? (
              <View style={[styles.summaryBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.summaryText, { color: colors.primary }]}>{foodSummary.cal} kcal</Text>
              </View>
            ) : undefined}
          />
          {showFood && (
            <View>
              {foodList.length === 0 ? (
                <Text style={[styles.emptyListText, { color: colors.textTertiary }]}>尚未添加饮食记录，点击下方按钮开始记录</Text>
              ) : (
                <>
                  {foodList.map((f, i) => (
                    <View key={i} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.listItemMain}>
                        <Text style={[styles.listItemName, { color: colors.text }]}>
                          {f.name}
                          {f.mealType && <Text style={[styles.listItemTag, { color: colors.textTertiary }]}> · {MealTypeOptions.find(m => m.value === f.mealType)?.label}</Text>}
                        </Text>
                        <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>{f.weight}g · {f.cal} kcal</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFood(i)}>
                        <Icons name="close-circle" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={[styles.summaryBox, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.summaryItem, { color: colors.text }]}>热量 <Text style={styles.summaryBold}>{foodSummary.cal}</Text></Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>蛋白 {foodSummary.protein.toFixed(1)}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>碳水 {foodSummary.carb.toFixed(1)}</Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>脂肪 {foodSummary.fat.toFixed(1)}</Text>
                  </View>
                </>
              )}
              <TouchableOpacity style={[styles.addListBtn, { borderColor: colors.primary }]} onPress={() => setFoodPickerVisible(true)} activeOpacity={0.7}>
                <Icons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.addListBtnText, { color: colors.primary }]}>添加食物</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader
            title="今日运动记录（明细）"
            icon="barbell-outline"
            expandable
            expanded={showSport}
            onToggle={() => setShowSport(!showSport)}
            rightElement={
              <View style={[styles.summaryBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.summaryText, { color: colors.primary }]}>{sportSummary.toFixed(1)} kcal</Text>
              </View>
            }
          />
          {showSport && (
            <View>
              <Text style={[styles.sportTotalText, { color: colors.textSecondary }]}>
                今日运动总消耗：<Text style={[styles.sportTotalValue, { color: colors.primary }]}>{sportSummary.toFixed(1)} kcal</Text>
              </Text>

              {sportList.length === 0 ? (
                <View style={styles.sportEmpty}>
                  <Icons name="fitness-outline" size={26} color={colors.textTertiary} />
                  <Text style={[styles.emptyListText, { color: colors.textTertiary }]}>暂无运动记录</Text>
                </View>
              ) : (
                sportList.map((s, i) => (
                  <View key={i} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.listItemMain}>
                      <Text style={[styles.listItemName, { color: colors.text }]}>
                        {s.actionName}
                        {s.type === 'strength' && s.muscle ? <Text style={[styles.listItemTag, { color: colors.textTertiary }]}> · {s.muscle}</Text> : null}
                      </Text>
                      {s.type === 'strength' ? (
                        <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>
                          {s.sets}组 × {s.reps}次 {s.weight ? `${s.weight}kg` : ''} ｜ 消耗：{s.calorie} kcal
                        </Text>
                      ) : (
                        <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>
                          {s.durationMin} min ｜ 消耗：{s.calorie} kcal
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeSport(i)}>
                      <Icons name="close-circle" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.sportBtns}>
                <TouchableOpacity
                  style={[styles.addSportBtn, { borderColor: colors.primary }]}
                  onPress={() => { setStrengthAction(null); setStrengthModalVisible(true); }}
                  activeOpacity={0.7}
                >
                  <Icons name="add" size={18} color={colors.primary} />
                  <Text style={[styles.addListBtnText, { color: colors.primary }]}>添加力量动作</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addSportBtn, { borderColor: colors.primary }]}
                  onPress={() => setCardioModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Icons name="add" size={18} color={colors.primary} />
                  <Text style={[styles.addListBtnText, { color: colors.primary }]}>添加有氧运动</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickRow}>
                <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]} onPress={quickStrength} activeOpacity={0.7}>
                  <Icons name="flash-outline" size={14} color={colors.primary} />
                  <Text style={[styles.quickText, { color: colors.textSecondary }]}>力量训练 (快速)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]} onPress={quickCardio} activeOpacity={0.7}>
                  <Icons name="flash-outline" size={14} color={colors.primary} />
                  <Text style={[styles.quickText, { color: colors.textSecondary }]}>有氧运动 (快速)</Text>
                </TouchableOpacity>
              </View>

              {sportList.length > 0 && (
                <TouchableOpacity style={[styles.clearSportBtn, { borderColor: colors.danger }]} onPress={() => setSportList([])} activeOpacity={0.7}>
                  <Icons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: FontSize.xs }}>清空全部运动记录</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="睡眠与身体状态" icon="moon-outline" expandable expanded={showSleep} onToggle={() => setShowSleep(!showSleep)} />
          {showSleep && (
            <View>
              <View style={styles.formGrid}>
                <View style={styles.formItem}><InputField label="睡眠时长" value={sleepDuration} onChangeText={setSleepDuration} unit="h" /></View>
              </View>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>睡眠质量</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(score => (
                  <TouchableOpacity key={score} onPress={() => setSleepScore(sleepScore === score ? 0 : score)}>
                    <Icons name={score <= sleepScore ? 'star' : 'star-outline'} size={28} color={score <= sleepScore ? colors.warning : colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>身体状态 (多选)</Text>
              <View style={styles.tagsContainer}>
                {BodyStatusOptions.map((bs: any) => (
                  <TagChip key={bs.value} label={bs.label} selected={bodyStatuses.includes(bs.value)} onPress={() => toggleBodyStatus(bs.value)} />
                ))}
              </View>
              <View style={styles.menstrualRow}>
                <TouchableOpacity style={[styles.toggleRow, { borderColor: colors.border }]} onPress={() => setIsMenstrual(!isMenstrual)} activeOpacity={0.7}>
                  <Icons name={isMenstrual ? 'toggle' : 'toggle-outline'} size={28} color={isMenstrual ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>生理期标记</Text>
                </TouchableOpacity>
                {isMenstrual && (
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <InputField label="第几天" value={menstrualDay} onChangeText={setMenstrualDay} keyboardType="numeric" />
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="自定义标签" icon="pricetags-outline" />
          <View style={styles.tagsContainer}>
            {availableTags.map((tag: any) => (
              <TagChip key={tag} label={tag} selected={selectedTags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          <SectionHeader title="备注" icon="chatbubble-outline" />
          <InputField label="" value={remark} onChangeText={setRemark} placeholder="记录身体感受、饮食心得、训练总结..." multiline keyboardType="default" />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(safeBottom, Spacing.md) }]}>
        <GradientView
          colors={colorScheme === 'dark' ? ['#2D6A4F', '#1B4332'] : ['#52B788', '#2D6A4F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.saveButton, Shadows.md]}
        >
          <TouchableOpacity style={styles.saveButtonInner} onPress={validateAndSave} activeOpacity={0.85}>
            <Icons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>保存记录</Text>
          </TouchableOpacity>
        </GradientView>
      </View>

      {FoodPickerModal()}
      {FoodGramsModal()}
      {CustomFoodModal()}
      {StrengthModal()}
      {CardioModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  dateText: { fontSize: FontSize.sm, marginTop: 4 },
  card: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm + 2, padding: Spacing.md + 2, borderRadius: BorderRadius.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm + 2 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, flex: 1 },
  sectionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', flexShrink: 1 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  formItem: { width: '47%', flexGrow: 1 },
  formItemFull: { width: '100%' },
  subLabel: { fontSize: FontSize.sm, fontWeight: '500', marginTop: Spacing.md, marginBottom: Spacing.xs },
  exerciseTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm + 2 },
  exerciseTypeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, borderWidth: 1 },
  starRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  menstrualRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  toggleLabel: { fontSize: FontSize.sm, fontWeight: '500' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xs },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, gap: 2 },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 10, fontWeight: '500' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm + 2, borderTopWidth: 1 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 4, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  saveButtonInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 4 },
  saveButtonText: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '600' },
  summaryBadge: { paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginRight: Spacing.xs },
  summaryText: { fontSize: FontSize.xs, fontWeight: '700' },
  sportTotalText: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  sportTotalValue: { fontSize: FontSize.lg, fontWeight: '700' },
  sportEmpty: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
  sportBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  addSportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  clearSportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  quickText: { fontSize: FontSize.xs, fontWeight: '500' },
  emptyListText: { fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md, lineHeight: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2, borderBottomWidth: 1 },
  listItemMain: { flex: 1 },
  listItemName: { fontSize: FontSize.md, fontWeight: '500' },
  listItemTag: { fontSize: FontSize.xs, fontWeight: '400' },
  listItemSub: { fontSize: FontSize.sm, marginTop: 2 },
  listItemRemark: { fontSize: FontSize.xs, marginTop: 2 },
  summaryBox: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, padding: Spacing.sm + 2, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  summaryItem: { fontSize: FontSize.sm },
  summaryBold: { fontSize: FontSize.md, fontWeight: '700' },
  addListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.sm + 2 },
  addListBtnText: { fontSize: FontSize.sm, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerModal: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, paddingBottom: 40, maxHeight: '80%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pickerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  foodCategory: { marginBottom: Spacing.md },
  foodCategoryTitle: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  foodChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, borderWidth: 1, minWidth: 80 },
  foodChipName: { fontSize: FontSize.sm, fontWeight: '500' },
  foodChipCal: { fontSize: FontSize.xs, marginTop: 2 },
  customAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  customAddBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '600' },
  inputModal: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, paddingBottom: 40 },
  inputModalTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: 2 },
  inputModalSub: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs + 2, marginTop: Spacing.sm },
  modalTextInput: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md + 2, fontSize: FontSize.md },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  mealTypeBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  nutritionPreview: { borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  nutritionPreviewRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  nutritionPreviewItem: { fontSize: FontSize.sm, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md + 4, borderRadius: BorderRadius.md, borderWidth: 1 },
});
