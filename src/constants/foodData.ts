export interface FoodDef {
  name: string;
  cal: number;
  protein: number;
  carb: number;
  fat: number;
}

export const FoodDatabase: { category: string; foods: FoodDef[] }[] = [
  {
    category: '主食类',
    foods: [
      { name: '米饭', cal: 116, protein: 2.6, carb: 25.9, fat: 0.3 },
      { name: '馒头', cal: 223, protein: 7.0, carb: 47.0, fat: 1.1 },
      { name: '红薯', cal: 99, protein: 1.1, carb: 24.7, fat: 0.2 },
      { name: '玉米', cal: 86, protein: 3.3, carb: 19.0, fat: 1.2 },
      { name: '燕麦', cal: 377, protein: 13.0, carb: 67.0, fat: 7.0 },
    ],
  },
  {
    category: '肉蛋类',
    foods: [
      { name: '鸡蛋', cal: 144, protein: 13.3, carb: 1.5, fat: 8.8 },
      { name: '鸡胸肉', cal: 133, protein: 31.0, carb: 0, fat: 1.2 },
      { name: '牛肉', cal: 125, protein: 20.0, carb: 0, fat: 4.2 },
      { name: '虾', cal: 87, protein: 18.6, carb: 0, fat: 1.0 },
      { name: '豆腐', cal: 81, protein: 8.1, carb: 1.9, fat: 4.2 },
    ],
  },
  {
    category: '蔬菜类',
    foods: [
      { name: '生菜', cal: 13, protein: 1.4, carb: 2.0, fat: 0.2 },
      { name: '西兰花', cal: 36, protein: 4.1, carb: 4.3, fat: 0.6 },
      { name: '黄瓜', cal: 15, protein: 0.7, carb: 2.9, fat: 0.1 },
      { name: '番茄', cal: 18, protein: 0.9, carb: 4.0, fat: 0.2 },
    ],
  },
  {
    category: '水果类',
    foods: [
      { name: '苹果', cal: 52, protein: 0.3, carb: 13.8, fat: 0.2 },
      { name: '香蕉', cal: 89, protein: 1.1, carb: 22.8, fat: 0.3 },
      { name: '橙子', cal: 47, protein: 0.9, carb: 11.8, fat: 0.1 },
    ],
  },
  {
    category: '饮品类',
    foods: [
      { name: '纯牛奶', cal: 54, protein: 3.0, carb: 3.4, fat: 3.2 },
      { name: '无糖豆浆', cal: 30, protein: 3.0, carb: 0.6, fat: 1.2 },
    ],
  },
];

export const MealTypeOptions = [
  { value: '', label: '不限' },
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' },
] as const;

export function calcFoodNutrition(food: FoodDef, grams: number) {
  const ratio = grams / 100;
  return {
    cal: Math.round(food.cal * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carb: Math.round(food.carb * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
  };
}
