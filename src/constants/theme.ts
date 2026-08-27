export const Colors = {
  brand: {
    primary: '#2D6A4F',
    primarySoft: '#40916C',
    accent: '#52B788',
    warn: '#E07A5F',
    golden: '#E9C46A',
  },
  light: {
    primary: '#2D6A4F',
    primarySoft: '#40916C',
    success: '#2D6A4F',
    danger: '#E07A5F',
    warning: '#E9C46A',
    info: '#20B2AA',
    dangerLight: '#F8D7D0',
    successLight: '#D8F3DC',
    accent: '#52B788',
    background: '#F6FFF8',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#EDF7F0',
    text: '#1B4332',
    textSecondary: '#52B788',
    textTertiary: '#95D5B2',
    subtext: '#52B788',
    border: '#D8F3DC',
    borderLight: '#E8F5EB',
    muted: '#95D5B2',
  },
  dark: {
    primary: '#40916C',
    primarySoft: '#52B788',
    success: '#52B788',
    danger: '#E07A5F',
    warning: '#E9C46A',
    info: '#48D1CC',
    dangerLight: '#5C3A2E',
    successLight: '#1B4332',
    accent: '#52B788',
    background: '#081C15',
    card: '#1B4332',
    surface: '#1B4332',
    surfaceVariant: '#143326',
    text: '#D8F3DC',
    textSecondary: '#74C69D',
    textTertiary: '#40916C',
    subtext: '#74C69D',
    border: '#2D6A4F',
    borderLight: '#24523D',
    muted: '#40916C',
  },
};

export type BrandColor = typeof Colors.brand;
export type ThemeColors = typeof Colors.light;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };
export const BorderRadius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, pill: 9999, full: 9999 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36 };
export const Shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  lg: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
};

export const DefaultTags = ['熬夜', '运动日', '饮食放纵', '经期', '旅行', '压力大', '感冒', '恢复期', '增肌期', '减脂期'] as const;

export const BodyStatusOptions = [
  { value: 'lean', label: '偏瘦' },
  { value: 'normal', label: '正常' },
  { value: 'overweight', label: '超重' },
  { value: 'obese', label: '肥胖' },
] as const;

export const MoodOptions = [
  { value: 'happy', label: '开心' },
  { value: 'good', label: '良好' },
  { value: 'normal', label: '一般' },
  { value: 'tired', label: '疲惫' },
  { value: 'sad', label: '低落' },
  { value: 'anxious', label: '焦虑' },
] as const;

export const MetricLabels: Record<string, { label: string; unit: string; icon: 'scale-outline' | 'body-outline' | 'analytics-outline' | 'walk-outline' | 'water-outline' | 'bed-outline' | 'pulse-outline' | 'resize-outline' }> = {
  weight: { label: '体重', unit: 'kg', icon: 'scale-outline' },
  bmi: { label: 'BMI', unit: '', icon: 'body-outline' },
  bodyFat: { label: '体脂率', unit: '%', icon: 'analytics-outline' },
  muscleMass: { label: '肌肉量', unit: 'kg', icon: 'walk-outline' },
  waist: { label: '腰围', unit: 'cm', icon: 'resize-outline' },
  water: { label: '饮水量', unit: 'ml', icon: 'water-outline' },
  sleepHours: { label: '睡眠', unit: 'h', icon: 'bed-outline' },
  heartRate: { label: '心率', unit: 'bpm', icon: 'pulse-outline' },
};