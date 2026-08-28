// 客户端计算函数单元测试
// 运行: npx tsx src/utils/calculations.test.ts 或配置 vitest

import { describe, it, expect } from 'vitest';
import { calcBMI, getBMICategory, formatValue, calcChange, isValidWeight, isValidBodyFat } from './calculations';

describe('calcBMI', () => {
  it('正常体重和身高计算正确', () => {
    expect(calcBMI(70, 175)).toBe(22.9);
  });

  it('体重为 null 返回 null', () => {
    expect(calcBMI(null, 175)).toBeNull();
  });

  it('身高为 null 返回 null', () => {
    expect(calcBMI(70, null)).toBeNull();
  });

  it('身高为 0 返回 null', () => {
    expect(calcBMI(70, 0)).toBeNull();
  });

  it('身高为负数返回 null', () => {
    expect(calcBMI(70, -175)).toBeNull();
  });
});

describe('getBMICategory', () => {
  it('null 返回未计算', () => {
    expect(getBMICategory(null).label).toBe('未计算');
  });

  it('BMI < 18.5 返回偏瘦', () => {
    expect(getBMICategory(17.5).label).toBe('偏瘦');
  });

  it('18.5 <= BMI < 24 返回正常', () => {
    expect(getBMICategory(22).label).toBe('正常');
  });

  it('24 <= BMI < 28 返回超重', () => {
    expect(getBMICategory(25).label).toBe('超重');
  });

  it('BMI >= 28 返回肥胖', () => {
    expect(getBMICategory(30).label).toBe('肥胖');
  });
});

describe('formatValue', () => {
  it('null 返回未记录', () => {
    expect(formatValue(null)).toBe('未记录');
  });

  it('undefined 返回未记录', () => {
    expect(formatValue(undefined)).toBe('未记录');
  });

  it('NaN 返回未记录', () => {
    expect(formatValue(NaN)).toBe('未记录');
  });

  it('数字保留1位小数', () => {
    expect(formatValue(22.857)).toBe('22.9');
  });

  it('支持自定义小数位数', () => {
    expect(formatValue(22.857, 2)).toBe('22.86');
  });
});

describe('calcChange', () => {
  it('任一为 null 返回 null', () => {
    expect(calcChange(null, 70)).toBeNull();
    expect(calcChange(70, null)).toBeNull();
  });

  it('上升返回 up 方向', () => {
    const result = calcChange(72, 70);
    expect(result?.direction).toBe('up');
    expect(result?.value).toBe(2);
  });

  it('下降返回 down 方向', () => {
    const result = calcChange(68, 70);
    expect(result?.direction).toBe('down');
    expect(result?.value).toBe(2);
  });

  it('不变返回 flat 方向', () => {
    const result = calcChange(70, 70);
    expect(result?.direction).toBe('flat');
    expect(result?.value).toBe(0);
  });
});

describe('isValidWeight', () => {
  it('正常范围返回 true', () => {
    expect(isValidWeight(70)).toBe(true);
    expect(isValidWeight(10)).toBe(true);
    expect(isValidWeight(300)).toBe(true);
  });

  it('超出范围返回 false', () => {
    expect(isValidWeight(9)).toBe(false);
    expect(isValidWeight(301)).toBe(false);
    expect(isValidWeight(0)).toBe(false);
  });
});

describe('isValidBodyFat', () => {
  it('正常范围返回 true', () => {
    expect(isValidBodyFat(20)).toBe(true);
    expect(isValidBodyFat(0)).toBe(true);
    expect(isValidBodyFat(80)).toBe(true);
  });

  it('超出范围返回 false', () => {
    expect(isValidBodyFat(-1)).toBe(false);
    expect(isValidBodyFat(81)).toBe(false);
  });
});
