import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, Modal, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatDate } from '@/utils/date';

interface TrendChartProps {
  data: { date: string; value: number | null }[];
  metricLabel: string;
  unit: string;
  targetLine?: number | null;
  height?: number;
  onPointPress?: (date: string) => void;
}

const screenWidth = Dimensions.get('window').width;

export function TrendChart({ data, metricLabel, unit, targetLine, height = 220, onPointPress }: TrendChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedPoint, setSelectedPoint] = useState<{ date: string; value: number; x: number; y: number } | null>(null);

  const chartWidth = Math.max(screenWidth - Spacing.lg * 2, data.length * 40);
  const padding = { top: 30, right: 20, bottom: 30, left: 45 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidthInner = chartWidth - padding.left - padding.right;

  const validData = data.filter(d => d.value !== null && d.value !== undefined);
  if (validData.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height, backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg }]}>
        <Text style={{ color: colors.textTertiary, fontSize: FontSize.md }}>暂无{metricLabel}数据</Text>
      </View>
    );
  }

  const values = validData.map(d => d.value!);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);
  if (targetLine) {
    minVal = Math.min(minVal, targetLine);
    maxVal = Math.max(maxVal, targetLine);
  }
  const range = maxVal - minVal || 1;
  const paddedRange = range * 1.2;
  const paddedMin = minVal - range * 0.1;

  const allPoints = data.map((d, i) => {
    const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidthInner : chartWidthInner / 2);
    const y = d.value !== null && d.value !== undefined
      ? padding.top + chartHeight - ((d.value - paddedMin) / paddedRange) * chartHeight
      : null;
    return { x, y, value: d.value, date: d.date };
  });

  const validPoints = allPoints.filter(p => p.y !== null) as { x: number; y: number; value: number; date: string }[];
  const polylinePoints = validPoints.map(p => `${p.x},${p.y}`).join(' ');

  const yLabels = 4;
  const yStep = paddedRange / yLabels;

  const xLabelInterval = Math.max(1, Math.ceil(data.length / 6));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={chartWidth} height={height}>
            {[...Array(yLabels + 1)].map((_, i) => {
              const y = padding.top + chartHeight - (i / yLabels) * chartHeight;
              const val = paddedMin + (i / yLabels) * paddedRange;
              return (
                <View key={`y-${i}`}>
                  <Line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={colors.border} strokeWidth="1" strokeDasharray={i === 0 ? '' : '3,3'} />
                  <SvgText x={padding.left - 8} y={y + 4} fill={colors.textTertiary} fontSize={10} textAnchor="end">
                    {val.toFixed(1)}
                  </SvgText>
                </View>
              );
            })}

            {targetLine !== null && targetLine !== undefined && (
              (() => {
                const y = padding.top + chartHeight - ((targetLine - paddedMin) / paddedRange) * chartHeight;
                if (y < padding.top || y > padding.top + chartHeight) return null;
                return (
                  <View>
                    <Line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={colors.warning} strokeWidth="1.5" strokeDasharray="5,3" />
                    <SvgText x={chartWidth - padding.right} y={y - 4} fill={colors.warning} fontSize={9} textAnchor="end">
                      目标 {targetLine}
                    </SvgText>
                  </View>
                );
              })()
            )}

            <Polyline points={polylinePoints} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {validPoints.map((p, i) => (
              <Circle
                key={`pt-${i}`}
                cx={p.x}
                cy={p.y}
                r="5"
                fill={colors.primary}
                stroke={colors.surface}
                strokeWidth="2"
                onPress={() => {
                  if (onPointPress) {
                    onPointPress(p.date);
                  } else {
                    setSelectedPoint(p);
                  }
                }}
              />
            ))}

            {data.map((d, i) => {
              if (i % xLabelInterval !== 0) return null;
              const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidthInner : chartWidthInner / 2);
              const parts = d.date.split('-');
              const label = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
              return (
                <SvgText key={`x-${i}`} x={x} y={height - 8} fill={colors.textTertiary} fontSize={10} textAnchor="middle">
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        </View>
      </ScrollView>

      <Modal visible={selectedPoint !== null} transparent animationType="fade" onRequestClose={() => setSelectedPoint(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedPoint(null)}>
          {selectedPoint && (
            <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>{formatDate(selectedPoint.date)}</Text>
              <Text style={[styles.tooltipValue, { color: colors.primary }]}>
                {selectedPoint.value.toFixed(1)} {unit}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tooltip: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
});
