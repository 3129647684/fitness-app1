import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

/**
 * 移动端视口判断与响应式缩放
 * - 视口宽度 <= 480px 视为"窄屏"，使用紧凑尺度
 * - 视口宽度 481~768px 视为"中屏"，使用中等尺度
 * - 视口宽度 > 768px 视为"宽屏/桌面"，可以给内容加最大宽度居中
 */
export type SizeClass = 'compact' | 'medium' | 'regular';

export function useSizeClass(): SizeClass {
  const { width } = useWindowDimensions();
  if (width <= 480) return 'compact';
  if (width <= 768) return 'medium';
  return 'regular';
}

/**
 * 响应式 spacing / font / radius 尺度
 * 基于 sizeClass 返回一套 theme 值，避免在各组件里重复判断
 */
export function useResponsiveTokens() {
  const sizeClass = useSizeClass();

  if (sizeClass === 'compact') {
    return {
      isCompact: true,
      isMedium: false,
      isRegular: false,
      sizeClass,
      // 更紧凑的内边距
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 14,
        xl: 18,
        xxl: 22,
        xxxl: 28,
      },
      // 稍小的字号
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 22,
        xxxl: 26,
        display: 30,
      },
      // 稍小的圆角
      borderRadius: {
        sm: 10,
        md: 14,
        lg: 16,
        xl: 20,
        xxl: 24,
        full: 9999,
      },
      // Web 端容器最大宽度：窄屏直接 100%
      containerMaxWidth: '100%' as const,
    };
  }

  if (sizeClass === 'medium') {
    return {
      isCompact: false,
      isMedium: true,
      isRegular: false,
      sizeClass,
      spacing: {
        xs: 5,
        sm: 9,
        md: 13,
        lg: 16,
        xl: 20,
        xxl: 26,
        xxxl: 32,
      },
      fontSize: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 19,
        xxl: 23,
        xxxl: 28,
        display: 34,
      },
      borderRadius: {
        sm: 11,
        md: 15,
        lg: 18,
        xl: 22,
        xxl: 26,
        full: 9999,
      },
      containerMaxWidth: 560 as const,
    };
  }

  // regular (桌面宽屏)
  return {
    isCompact: false,
    isMedium: false,
    isRegular: true,
    sizeClass,
    spacing: Spacing,
    fontSize: FontSize,
    borderRadius: BorderRadius,
    containerMaxWidth: 520 as const, // 桌面端保持居中卡片感
  };
}

/**
 * Web 端全局样式注入：
 * - 取消 Expo 默认对 body/#root 的最大宽度限制
 * - 保证 html/body/root 100% 高度
 * - 让 App 容器在窄屏填满视口，宽屏再居中
 */
export function useWebGlobalStyles() {
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setApplied(true);
      return;
    }
    try {
      const styleId = 'fitness-app-web-reset';
      if (document.getElementById(styleId)) {
        setApplied(true);
        return;
      }
      const css = `
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100% !important;
          height: 100%;
          min-height: 100vh;
          background: transparent;
        }
        /* RN Web 根组件为 flex:1，需要 #root 成为 flex 容器以撑满视口高度 */
        #root {
          display: flex;
          flex-direction: column;
        }
        }
        /* Expo RNW 默认会给 .rnw-* 或 body 包一层居中 max-width，这里强制覆盖 */
        body > div,
        #root > div,
        #root > div > div {
          max-width: 100% !important;
          width: 100% !important;
          min-height: 100vh;
        }
        /* 选中文字色更柔和 */
        ::selection { background: rgba(45,106,79,0.2); }
      `;
      const el = document.createElement('style');
      el.id = styleId;
      el.appendChild(document.createTextNode(css));
      document.head.appendChild(el);
      setApplied(true);
    } catch {
      setApplied(true);
    }
  }, []);

  return applied;
}
