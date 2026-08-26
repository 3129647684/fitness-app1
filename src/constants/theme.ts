export const Colors = {
  light: {
    primary: '#2D6A4F',
    primaryLight: '#52B788',
    primaryDark: '#1B4332',
    primarySoft: '#D8F3DC',

    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F3EF',
    card: '#FFFFFF',

    text: '#1A1A1A',
    textSecondary: '#6C6C6C',
    textTertiary: '#A8A8A8',

    border: '#E8E5E0',
    borderLight: '#F0EDE8',

    danger: '#C7555A',
    dangerLight: '#FDE8E8',
    success: '#40916C',
    successLight: '#D8F3DC',
    warning: '#D4956B',
    warningLight: '#FDF0E5',
    info: '#5B8AA6',
    infoLight: '#E5F0F5',
    accent: '#8B7AA6',
    accentLight: '#EDE8F5',
  },
  dark: {
    primary: '#52B788',
    primaryLight: '#74C69D',
    primaryDark: '#2D6A4F',
    primarySoft: '#1B3A2A',

    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    card: '#1E1E1E',

    text: '#F0F0F0',
    textSecondary: '#9E9E9E',
    textTertiary: '#6C6C6C',

    border: '#333333',
    borderLight: '#2A2A2A',

    danger: '#E07070',
    dangerLight: '#3A1A1A',
    success: '#52B788',
    successLight: '#1A3A2A',
    warning: '#E0A577',
    warningLight: '#3A2A1A',
    info: '#7BAACC',
    infoLight: '#1A2A35',
    accent: '#A091C0',
    accentLight: '#2A2435',
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
};

export const DefaultTags = [
  { name: '训练日', color: '#2D6A4F' },
  { name: '休息日', color: '#6C6C6C' },
  { name: '暴食日', color: '#C7555A' },
  { name: '熬夜', color: '#8B7AA6' },
  { name: '清淡饮食', color: '#40916C' },
];

export const ExerciseTypes = [
  { value: 'strength', label: '力量训练', icon: 'barbell' },
  { value: 'cardio', label: '有氧运动', icon: 'bicycle' },
  { value: 'walk', label: '日常散步', icon: 'walk' },
  { value: 'none', label: '无运动', icon: 'remove-circle-outline' },
];

export const BodyStatusOptions = [
  { value: 'muscle_sore', label: '肌肉酸痛' },
  { value: 'fatigue', label: '疲惫乏力' },
  { value: 'edema', label: '水肿' },
  { value: 'gi_discomfort', label: '肠胃不适' },
];

export const MoodOptions = [
  { value: 1, label: '低落', emoji: '😞' },
  { value: 2, label: '一般', emoji: '😐' },
  { value: 3, label: '平稳', emoji: '🙂' },
  { value: 4, label: '愉悦', emoji: '😊' },
  { value: 5, label: '极佳', emoji: '😄' },
];

export const MetricLabels: Record<string, { label: string; unit: string }> = {
  weight: { label: '体重', unit: 'kg' },
  body_fat: { label: '体脂率', unit: '%' },
  muscle_mass: { label: '肌肉量', unit: 'kg' },
  water_rate: { label: '水分率', unit: '%' },
  bmr: { label: '基础代谢', unit: 'kcal' },
  bmi: { label: 'BMI', unit: '' },
  chest: { label: '胸围', unit: 'cm' },
  waist: { label: '腰围', unit: 'cm' },
  hip: { label: '臀围', unit: 'cm' },
  upper_arm: { label: '上臂围', unit: 'cm' },
  thigh: { label: '大腿围', unit: 'cm' },
  calf: { label: '小腿围', unit: 'cm' },
  neck: { label: '颈围', unit: 'cm' },
  heart_rate: { label: '静息心率', unit: 'bpm' },
  steps: { label: '步数', unit: '步' },
  water_intake: { label: '饮水量', unit: 'ml' },
  body_temperature: { label: '体温', unit: '\u00b0C' },
  mood: { label: '心情', unit: '' },
  sleep_duration: { label: '睡眠时长', unit: 'h' },
  sleep_score: { label: '睡眠质量', unit: '星' },
  food_cal: { label: '热量摄入', unit: 'kcal' },
  sport_cal: { label: '运动消耗', unit: 'kcal' },
};
