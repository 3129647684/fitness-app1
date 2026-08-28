import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type IconName =
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
  | 'calendar-outline'
  | 'chatbubble-outline';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  return <Ionicons name={name} size={size} color={color} />;
};

export { Icon };
export const Icons = Icon;
export default Icon;

interface TabBarIconProps {
  name: IconName;
  focused?: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused = false, size = 24 }) => {
  const color = focused ? '#2D6A4F' : '#95D5B2';
  return <Icon name={name} size={size} color={color} />;
};