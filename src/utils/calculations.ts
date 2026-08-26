export function calcBMI(weight: number | null, heightCm: number | null): number | null {
  if (!weight || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function calcBMR(
  weight: number | null,
  heightCm: number | null,
  age: number | null,
  gender: 'male' | 'female' | null
): number | null {
  if (!weight || !heightCm || !age || !gender) return null;
  const base = 10 * weight + 6.25 * heightCm - 5 * age;
  const result = gender === 'male' ? base + 5 : base - 161;
  return Math.round(result);
}

export function getBMICategory(bmi: number | null): { label: string; color: string } {
  if (!bmi) return { label: '未计算', color: '#A8A8A8' };
  if (bmi < 18.5) return { label: '偏瘦', color: '#5B8AA6' };
  if (bmi < 24) return { label: '正常', color: '#40916C' };
  if (bmi < 28) return { label: '超重', color: '#D4956B' };
  return { label: '肥胖', color: '#C7555A' };
}

export function getSleepScoreLabel(score: number | null): string {
  if (!score) return '未评';
  const labels = ['', '极差', '较差', '一般', '良好', '极佳'];
  return labels[score] || '未评';
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isValidWeight(w: number): boolean {
  return w >= 10 && w <= 300;
}

export function isValidBodyFat(bf: number): boolean {
  return bf >= 0 && bf <= 80;
}

export function isValidCircumference(c: number): boolean {
  return c >= 10 && c <= 300;
}

export function formatValue(value: number | null, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '未记录';
  return value.toFixed(decimals);
}

export function calcChange(current: number | null, previous: number | null): { value: number; direction: 'up' | 'down' | 'flat' } | null {
  if (current === null || previous === null) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff > 0) return { value: diff, direction: 'up' };
  if (diff < 0) return { value: Math.abs(diff), direction: 'down' };
  return { value: 0, direction: 'flat' };
}
