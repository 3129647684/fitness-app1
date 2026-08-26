// 力量训练 MET 代谢当量
export const STRENGTH_MET = 3.5;
// 力量训练单组估算耗时（动作40s + 组间休息90s），单位分钟
export const SET_MINUTES = 2.17;

// 有氧运动 MET 基础参数
export interface CardioDef {
  key: string;
  label: string;
  met: number;
}

export const CardioDatabase: CardioDef[] = [
  { key: 'jogging', label: '慢跑', met: 7.0 },
  { key: 'fast_walk', label: '快走', met: 4.3 },
  { key: 'cycling', label: '骑行', met: 6.8 },
  { key: 'walking', label: '散步', met: 3.0 },
];

// 保留 1 位小数
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * 消耗热量(kcal) = MET × 体重(kg) × 运动小时数
 */
export function calcCalorie(met: number, weightKg: number, hours: number): number {
  return round1(met * weightKg * hours);
}

/**
 * 力量训练热量：MET(3.5) × 体重 × 组数×2.17分钟(折小时)
 * 返回 { durationMin, calorie }，durationMin 保留1位
 */
export function calcStrengthCalorie(sets: number, weightKg: number): { durationMin: number; calorie: number } {
  const durationMin = round1(sets * SET_MINUTES);
  const calorie = calcCalorie(STRENGTH_MET, weightKg, durationMin / 60);
  return { durationMin, calorie };
}

/**
 * 有氧运动热量：met × 体重 × 时长/60
 */
export function calcCardioCalorie(met: number, durationMin: number, weightKg: number): number {
  return calcCalorie(met, weightKg, durationMin / 60);
}