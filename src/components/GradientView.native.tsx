import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleProp, ViewStyle } from 'react-native';

interface GradientViewProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const GradientView: React.FC<GradientViewProps> = ({
  colors,
  start,
  end,
  style,
  children,
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export { GradientView };
export default GradientView;
