import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface GradientViewProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const GradientView: React.FC<GradientViewProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  style,
  children,
}) => {
  const toAngle = (s: { x: number; y: number }, e: { x: number; y: number }) => {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    return `${deg}deg`;
  };

  const gradient = `linear-gradient(${toAngle(start, end)}, ${colors.join(', ')})`;
  const mergedStyle: any = [
    { flex: 1 },
    style,
    {
      backgroundImage: gradient,
      backgroundColor: colors[0],
    },
  ];

  return React.createElement(View, { style: mergedStyle }, children);
};

export { GradientView };
export default GradientView;
