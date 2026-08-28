// 精简后的核心类型定义
// 仅保留 5 个核心记录字段：体重 / BMI / 体脂率 / 腰围 / 睡眠时长

export interface UserProfile {
  id: number;
  height: number | null;
  weight: number | null;
  gender: 'male' | 'female' | null;
  age: number | null;
  target_weight: number | null;
  create_time: string;
  update_time: string;
}

export interface BodyRecord {
  id?: number;
  record_date: string;
  weight: number | null;
  bmi: number | null;
  body_fat: number | null;
  waist: number | null;
  sleep_duration: number | null;
  create_time: string;
  update_time: string;
}

export interface Goal {
  id?: number;
  goal_type: 'weight' | 'waist' | 'body_fat';
  target_value: number;
  start_value: number | null;
  start_date: string;
  target_date: string | null;
  is_active: number;
  create_time: string;
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export type ChartMetric = 'weight' | 'body_fat' | 'waist' | 'sleep_duration' | 'bmi';

export interface ChartDataPoint {
  date: string;
  value: number | null;
}
