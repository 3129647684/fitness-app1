import React from 'react';
import { Platform } from 'react-native';
import { StyleProp, ViewStyle } from 'react-native';

interface GradientViewProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

let GradientViewModule: React.FC<GradientViewProps> | null = null;

if (Platform.OS === 'web') {
  GradientViewModule = require('./GradientView.web').default;
} else {
  try {
    GradientViewModule = require('./GradientView.native').default;
  } catch (e) {
    GradientViewModule = require('./GradientView.web').default;
  }
}

const GradientView: React.FC<GradientViewProps> = (props) => {
  if (!GradientViewModule) return null;
  return <GradientViewModule {...props} />;
};

export { GradientView };
export default GradientView;
