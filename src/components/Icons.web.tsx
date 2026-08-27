import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, Polyline } from 'react-native-svg';

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
  | 'calendar-outline';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const commonProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
});

const iconPaths: Record<string, React.ReactNode> = {
  'home': (
    <Path
      d="M12 3l9 8h-3v10h-4v-6H10v6H6V11H3l9-8z"
      fill="currentColor"
    />
  ),
  'home-outline': (
    <Path
      d="M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'add-circle': (
    <>
      <Circle cx="12" cy="12" r="10" fill="currentColor" />
      <Path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'add-circle-outline': (
    <>
      <Circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'today': (
    <Rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" />
  ),
  'today-outline': (
    <>
      <Rect x="3" y="5" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'bar-chart': (
    <>
      <Rect x="3" y="14" width="4" height="7" fill="currentColor" />
      <Rect x="10" y="8" width="4" height="13" fill="currentColor" />
      <Rect x="17" y="3" width="4" height="18" fill="currentColor" />
    </>
  ),
  'bar-chart-outline': (
    <>
      <Rect x="3" y="14" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="10" y="8" width="4" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="17" y="3" width="4" height="18" rx="0.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  'settings': (
    <Path
      d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1zM12 15a3 3 0 100-6 3 3 0 000 6z"
      fill="currentColor"
    />
  ),
  'settings-outline': (
    <>
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'person': (
    <>
      <Circle cx="12" cy="7" r="4" fill="currentColor" />
      <Path d="M4 21v-2a6 6 0 0112 0v2" fill="currentColor" />
    </>
  ),
  'person-outline': (
    <>
      <Circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path
        d="M4 21v-2a6 6 0 0112 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'log-out': (
    <>
      <Path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" fill="currentColor" />
      <Path d="M10 17l5-5-5-5M15 12H3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'log-out-outline': (
    <>
      <Path
        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'arrow-back': (
    <Path
      d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"
      fill="currentColor"
    />
  ),
  'arrow-back-outline': (
    <Path
      d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="currentColor"
      fillOpacity="0"
      strokeLinejoin="round"
    />
  ),
  'search': (
    <>
      <Circle cx="11" cy="11" r="7" fill="currentColor" />
      <Path d="M21 21l-4.3-4.3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  'search-outline': (
    <>
      <Circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'trash': (
    <>
      <Path d="M3 6h18v2H3zM8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 8l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" fill="currentColor" />
    </>
  ),
  'trash-outline': (
    <>
      <Path d="M3 6h18v2H3z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <Path
        d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 8l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'edit': (
    <Path
      d="M3 21h4l11-11-4-4L3 17v4zM20 7l-3-3 2-2 3 3-2 2z"
      fill="currentColor"
    />
  ),
  'edit-outline': (
    <>
      <Path
        d="M3 21h4l11-11-4-4L3 17v4zM20 7l-3-3 2-2 3 3-2 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  'cloud-upload': (
    <>
      <Path
        d="M18 10a6 6 0 00-11.6-1.8A5 5 0 107 18h11a4 4 0 000-8z"
        fill="currentColor"
      />
      <Path d="M12 16v-6M9 13l3-3 3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'cloud-upload-outline': (
    <>
      <Path
        d="M18 10a6 6 0 00-11.6-1.8A5 5 0 107 18h11a4 4 0 000-8z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16v-6M9 13l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'cloud-download': (
    <>
      <Path
        d="M18 10a6 6 0 00-11.6-1.8A5 5 0 107 18h11a4 4 0 000-8z"
        fill="currentColor"
      />
      <Path d="M12 10v6M9 13l3 3 3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'cloud-download-outline': (
    <>
      <Path
        d="M18 10a6 6 0 00-11.6-1.8A5 5 0 107 18h11a4 4 0 000-8z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M12 10v6M9 13l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'analytics': (
    <Path
      d="M3 3v18h18M7 14l4-4 4 4 5-6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'analytics-outline': (
    <>
      <Path
        d="M3 3v18h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M7 14l4-4 4 4 5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  'pulse': (
    <Path
      d="M3 12h4l2-6 4 12 2-6h6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'pulse-outline': (
    <Path
      d="M3 12h4l2-6 4 12 2-6h6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'water': (
    <Path
      d="M12 2s6 7.5 6 12a6 6 0 01-12 0c0-4.5 6-12 6-12z"
      fill="currentColor"
    />
  ),
  'water-outline': (
    <Path
      d="M12 2s6 7.5 6 12a6 6 0 01-12 0c0-4.5 6-12 6-12z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  'bed': (
    <>
      <Path d="M3 7v14M3 17h18M21 10a3 3 0 01-3 3H8V7h10a3 3 0 013 3z" fill="currentColor" />
    </>
  ),
  'bed-outline': (
    <>
      <Path d="M3 7v14M3 17h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path
        d="M21 10a3 3 0 01-3 3H8V7h10a3 3 0 013 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  'dumbbell': (
    <>
      <Rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" />
      <Rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" />
      <Rect x="8" y="11" width="8" height="2" rx="1" fill="currentColor" />
      <Rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" />
      <Rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" />
    </>
  ),
  'dumbbell-outline': (
    <>
      <Rect x="2" y="9" width="2" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="5" y="7" width="2" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="8" y="11" width="8" height="2" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="17" y="7" width="2" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="20" y="9" width="2" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  'restaurant': (
    <>
      <Path d="M6 2v12a3 3 0 006 0V2M9 2v20M18 2c-2 0-4 3-4 7 0 3 2 6 4 8" fill="currentColor" />
    </>
  ),
  'restaurant-outline': (
    <>
      <Path
        d="M6 2v12a3 3 0 006 0V2M9 2v20"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M18 2c-2 0-4 3-4 7 0 3 2 6 4 8"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  ),
  'scale-outline': (
    <>
      <Rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M12 12l1.2 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'resize-outline': (
    <>
      <Rect x="2" y="8" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M7 8v8M12 8v8M17 8v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  'body-outline': (
    <>
      <Circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Path d="M5 21c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  'pie-chart-outline': (
    <>
      <Path d="M12 3a9 9 0 109 9h-9V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <Path d="M15 3.5A9 9 0 0120.5 9H15V3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </>
  ),
  'barbell-outline': (
    <>
      <Rect x="2" y="9" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="5" y="7" width="2" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="17" y="7" width="2" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Rect x="19" y="9" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <Line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  'flame-outline': (
    <Path
      d="M12 3c2 2.5 4.5 5 4.5 8.5a4.5 4.5 0 01-9 0C7.5 8.5 10 5.5 12 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  'fitness-outline': (
    <Path
      d="M3 12h4l2-5 3 10 2-5h7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'trending-up-outline': (
    <>
      <Path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M15 8h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  'chevron-forward': (
    <Path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
};

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  const path = iconPaths[name as keyof typeof iconPaths];
  return (
    <Svg {...commonProps(size)} color={color}>
      {path ?? <Circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />}
    </Svg>
  );
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
