export interface SportDef {
  name: string;
  calPerMin: number;
  isStrength: boolean;
}

export const SportDatabase: { category: string; sports: SportDef[] }[] = [
  {
    category: '有氧运动',
    sports: [
      { name: '慢跑', calPerMin: 10, isStrength: false },
      { name: '快走', calPerMin: 6, isStrength: false },
      { name: '骑行', calPerMin: 8, isStrength: false },
      { name: '跳绳', calPerMin: 13, isStrength: false },
      { name: '游泳', calPerMin: 11, isStrength: false },
    ],
  },
  {
    category: '力量训练',
    sports: [
      { name: '胸肌训练', calPerMin: 7, isStrength: true },
      { name: '背部训练', calPerMin: 7, isStrength: true },
      { name: '腿部训练', calPerMin: 8, isStrength: true },
      { name: '肩部训练', calPerMin: 6, isStrength: true },
      { name: '全身力量训练', calPerMin: 9, isStrength: true },
    ],
  },
  {
    category: '日常活动',
    sports: [
      { name: '散步', calPerMin: 4, isStrength: false },
      { name: '爬楼', calPerMin: 9, isStrength: false },
    ],
  },
];

export function calcSportCalories(sport: SportDef, durationMin: number): number {
  return Math.round(sport.calPerMin * durationMin);
}
