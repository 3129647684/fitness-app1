import { Platform } from 'react-native';
import type { ChartMetric } from '@/database/types';

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

// RN Web 0.21 开始废弃 shadowColor/shadowOpacity/shadowRadius/shadowOffset，
// 仅接受标准 CSS boxShadow 字符串，否则会产生控制台告警。
// 使用 Platform.select 让两端都拿到自己想要的格式。
export const Shadows = Platform.select({
  web: {
    sm: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)' },
    md: { boxShadow: '0 3px 8px rgba(0, 0, 0, 0.10)' },
    lg: { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)' },
  },
  default: {
    sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    md: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    lg: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  },
}) as typeof import('react-native').Platform extends { OS: infer _T }
  ? { sm: Record<string, any>; md: Record<string, any>; lg: Record<string, any> }
  : never;

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

export const MetricLabels: Record<ChartMetric, { label: string; unit: string; icon: string }> = {
  weight: { label: '体重', unit: 'kg', icon: 'scale-outline' },
  bmi: { label: 'BMI', unit: '', icon: 'body-outline' },
  body_fat: { label: '体脂率', unit: '%', icon: 'analytics-outline' },
  waist: { label: '腰围', unit: 'cm', icon: 'resize-outline' },
  sleep_duration: { label: '睡眠时长', unit: 'h', icon: 'moon-outline' },
  chest: { label: '胸围', unit: 'cm', icon: 'resize-outline' },
  hip: { label: '臀围', unit: 'cm', icon: 'body-outline' },
  thigh: { label: '大腿围', unit: 'cm', icon: 'walk-outline' },
  neck: { label: '颈围', unit: 'cm', icon: 'resize-outline' },
  heart_rate: { label: '心率', unit: 'bpm', icon: 'pulse-outline' },
  steps: { label: '步数', unit: '步', icon: 'walk-outline' },
  food_cal: { label: '热量摄入', unit: 'kcal', icon: 'restaurant-outline' },
  sport_cal: { label: '运动消耗', unit: 'kcal', icon: 'flame-outline' },
};