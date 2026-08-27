import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';

type IconName =
  | 'home'
  | 'home-outline'
  | 'add-circle'
  | 'add-circle-outline'
  | 'today'
  | 'today-outline'
  | 'bar-chart'
  | 'bar-chart-outline'
  | 'stats-chart'
  | 'stats-chart-outline'
  | 'settings'
  | 'settings-outline'
  | 'person'
  | 'person-outline'
  | 'person-circle-outline'
  | 'at-outline'
  | 'lock-closed-outline'
  | 'log-out'
  | 'log-out-outline'
  | 'arrow-back'
  | 'arrow-back-outline'
  | 'arrow-forward'
  | 'search'
  | 'search-outline'
  | 'trash'
  | 'trash-outline'
  | 'edit'
  | 'edit-outline'
  | 'create'
  | 'create-outline'
  | 'cloud-upload'
  | 'cloud-upload-outline'
  | 'cloud-download'
  | 'cloud-download-outline'
  | 'analytics'
  | 'analytics-outline'
  | 'pulse'
  | 'pulse-outline'
  | 'water'
  | 'water-outline'
  | 'bed'
  | 'bed-outline'
  | 'dumbbell'
  | 'dumbbell-outline'
  | 'restaurant'
  | 'restaurant-outline'
  | 'body'
  | 'body-outline'
  | 'alert-circle-outline'
  | 'chevron-forward'
  | 'chevron-up'
  | 'chevron-down'
  | 'download-outline'
  | 'information-circle-outline'
  | 'shield-checkmark-outline'
  | 'fitness-outline'
  | 'flag-outline'
  | 'close-circle'
  | 'add'
  | 'close'
  | 'checkmark'
  | 'checkmark-circle-outline'
  | 'time'
  | 'flame-outline'
  | 'stats-chart-outline'
  | 'pie-chart-outline'
  | 'trending-up'
  | 'trending-down'
  | 'trending-up-outline'
  | 'pricetags-outline'
  | 'document-text-outline'
  | 'sparkles-outline'
  | 'moon-outline'
  | 'resize-outline'
  | 'heart-outline'
  | 'barbell-outline'
  | 'star'
  | 'star-outline'
  | 'toggle'
  | 'toggle-outline'
  | 'flash-outline'
  | 'scale-outline'
  | 'walk-outline'
  | 'ellipse-outline'
  | 'checkmark-circle'
  | 'list'
  | 'calendar'
  | 'chevron-back'
  | 'play-outline'
  | 'arrow-down-outline'
  | 'arrow-up-outline'
  | 'calendar-outline';

export type { IconName };

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

let IconModule: React.FC<IconProps> | null = null;

if (Platform.OS === 'web') {
  IconModule = require('./Icons.web').default;
} else {
  try {
    IconModule = require('./Icons.native').default;
  } catch (e) {
    IconModule = require('./Icons.web').default;
  }
}

const Icon: React.FC<IconProps> = (props) => {
  if (!IconModule) return null;
  return <IconModule {...props} />;
};

export { Icon };
export const Icons = Icon;

interface TabBarIconProps {
  name: IconName;
  focused?: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused = false,
  size = 24,
}) => {
  const color = focused ? Colors.brand.primary : Colors.light.muted;
  return <Icon name={name} size={size} color={color} />;
};

export default Icon;
