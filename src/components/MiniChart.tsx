import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MiniChartProps {
  data: { date: string; value: number | null }[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniChart({ data, width = 300, height = 80, color }: MiniChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const strokeColor = color ?? colors.primary;

  const validData = data.filter(d => d.value !== null && d.value !== undefined);
  if (validData.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Svg width={width} height={height}>
          <SvgText
            x={width / 2}
            y={height / 2}
            fill={colors.textTertiary}
            fontSize={13}
            textAnchor="middle"
          >
            暂无趋势数据
          </SvgText>
        </Svg>
      </View>
    );
  }

  const values = validData.map(d => d.value!);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = 10;

  const points = validData.map((d, i) => {
    const x = padding + (i / Math.max(validData.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d.value! - minVal) / range) * (height - padding * 2);
    return { x, y, value: d.value!, date: d.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="3" fill={strokeColor} />
        ))}
        {validData.length > 0 && (
          <SvgText x={padding} y={12} fill={colors.textTertiary} fontSize={10}>
            {minVal.toFixed(1)}
          </SvgText>
        )}
        {validData.length > 0 && (
          <SvgText x={width - padding - 20} y={12} fill={colors.textTertiary} fontSize={10}>
            {maxVal.toFixed(1)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
