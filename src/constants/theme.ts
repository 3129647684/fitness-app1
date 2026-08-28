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
  gradient: {
    trainingBg: ['#1E293B', '#334155', '#3F3F46'],
    trainingBgLight: ['#E2E8F0', '#CBD5E1', '#D4D4D8'],
    muscleRed: ['#EF4444', '#E11D48'],
    muscleRedLight: ['#FEE2E2', '#FFE4E6'],
    heartGreen: ['#22C55E', '#059669'],
    heartGreenLight: ['#DCFCE7', '#D1FAE5'],
    coachBlue: ['#3B82F6', '#4F46E5'],
    coachBlueLight: ['#DBEAFE', '#E0E7FF'],
    flameOrange: ['#F97316', '#EF4444'],
    nutritionPurple: ['#A855F7', '#7C3AED'],
    recoveryTeal: ['#2DD4BF', '#06B6D4'],
  },
  dynamic: {
    muscleActive: '#EF4444',
    heartBeat: '#22C55E',
    coachAI: '#3B82F6',
    flame: '#F97316',
    gold: '#F59E0B',
    recovery: '#2DD4BF',
    progress: '#8B5CF6',
  },
  glow: {
    muscle: 'rgba(239, 68, 68, 0.3)',
    heart: 'rgba(34, 197, 94, 0.3)',
    coach: 'rgba(59, 130, 246, 0.3)',
    flame: 'rgba(249, 115, 22, 0.3)',
    gold: 'rgba(245, 158, 11, 0.3)',
  },
};

export type BrandColor = typeof Colors.brand;
export type ThemeColors = typeof Colors.light;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };
export const BorderRadius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, pill: 9999, full: 9999 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36 };

export const Shadows = Platform.select({
  web: {
    sm: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)' },
    md: { boxShadow: '0 3px 8px rgba(0, 0, 0, 0.10)' },
    lg: { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)' },
    glow: { boxShadow: '0 0 20px rgba(46, 139, 87, 0.2)' },
    glowRed: { boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)' },
    glowGreen: { boxShadow: '0 0 20px rgba(34, 197, 94, 0.25)' },
    glowBlue: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.25)' },
  },
  default: {
    sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    md: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    lg: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    glow: { shadowColor: '#2D6A4F', shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 },
    glowRed: { shadowColor: '#EF4444', shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
    glowGreen: { shadowColor: '#22C55E', shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
    glowBlue: { shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
  },
}) as any;

// 精简后的指标标签（仅保留5个核心指标）
export const MetricLabels: Record<ChartMetric, { label: string; unit: string; icon: string; color?: string }> = {
  weight: { label: '体重', unit: 'kg', icon: 'scale-outline', color: '#22C55E' },
  bmi: { label: 'BMI', unit: '', icon: 'body-outline', color: '#3B82F6' },
  body_fat: { label: '体脂率', unit: '%', icon: 'analytics-outline', color: '#EF4444' },
  waist: { label: '腰围', unit: 'cm', icon: 'resize-outline', color: '#F59E0B' },
  sleep_duration: { label: '睡眠时长', unit: 'h', icon: 'moon-outline', color: '#8B5CF6' },
};
