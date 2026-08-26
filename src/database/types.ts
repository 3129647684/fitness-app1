export interface UserProfile {
  id: number;
  height: number | null;
  weight: number | null;
  gender: 'male' | 'female' | null;
  age: number | null;
  target_weight: number | null;
  target_waist: number | null;
  create_time: string;
  update_time: string;
}

export type ExerciseType = 'strength' | 'cardio' | 'walk' | 'none';

export type MealType = '' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  weight: number;
  cal: number;
  protein: number | null;
  carb: number | null;
  fat: number | null;
  mealType: MealType;
}

export interface SportItem {
  name: string;
  duration: number;
  calConsume: number;
  groupCount: number | null;
  remark: string | null;
}

// 运动明细（本轮改造：存储到 sport_json）
export type SportDetail = {
  type: 'strength' | 'cardio';
  actionId?: string;
  actionName: string;
  muscle?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  durationMin: number;
  calorie: number;
};

export interface BodyRecord {
  id?: number;
  record_date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  water_rate: number | null;
  bmr: number | null;
  bmi: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  upper_arm: number | null;
  thigh: number | null;
  calf: number | null;
  neck: number | null;
  heart_rate: number | null;
  steps: number | null;
  water_intake: number | null;
  body_temperature: number | null;
  mood: number | null;
  sleep_duration: number | null;
  sleep_score: number | null;
  is_menstrual: number;
  menstrual_day: number | null;
  exercise_type: ExerciseType;
  exercise_duration: number | null;
  exercise_note: string | null;
  body_status: string | null;
  remark: string | null;
  food_list: string | null;
  sport_list: string | null;
  sport_json: string | null;
  sport_total_cal: number | null;
  create_time: string;
  update_time: string;
}

export interface RecordTag {
  id?: number;
  record_id: number;
  tag_name: string;
}

export interface CustomTag {
  id?: number;
  tag_name: string;
  color?: string;
}

export interface RecordImage {
  id?: number;
  record_id: number;
  local_image_path: string;
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

export interface NutritionGoal {
  id?: number;
  daily_calorie: number | null;
  daily_protein: number | null;
  daily_carb: number | null;
  daily_fat: number | null;
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export type ChartMetric = 'weight' | 'body_fat' | 'waist' | 'sleep_duration' | 'bmi' | 'chest' | 'hip' | 'thigh' | 'heart_rate' | 'steps' | 'neck' | 'food_cal' | 'sport_cal';

export interface ChartDataPoint {
  date: string;
  value: number | null;
}
