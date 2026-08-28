import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { setPendingAction } from '@/store/exerciseStore';
import { gifAssets } from '@/constants/gifAssets';
import type { ExercisePickerScreenProps } from '@/navigation/RootNavigator';


interface ExerciseItem {
  id: string;
  name: string;
  nameZh?: string;
  muscle?: string;
  bodyPart?: string;
  equipment?: string;
  mediaId?: string;
  desc?: string;
}


const titleOf = (e: ExerciseItem) => e.nameZh || e.name;


const bodyPartMap: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  triceps: '三头',
  biceps: '二头',
  neck: '斜方肌',
  forearms: '前臂',
  calves: '小腿',
  glutes: '臀部',
  abs: '腹部',
  stretching: '拉伸',
  cardio: '有氧',
  full_body: '全身',
};


const SIDEBAR = ['胸', '背', '腿', '肩', '三头', '二头', '斜方肌', '前臂', '小腿', '臀部', '腹部', '拉伸', '有氧', '全身'];


const muscleAlias: Record<string, string> = {
  '胸': '胸', '胸部': '胸',
  '背': '背', '背部': '背',
  '腿': '腿', '腿部': '腿',
  '肩': '肩', '肩部': '肩',
  '三头': '三头', '肱三头': '三头',
  '二头': '二头', '肱二头': '二头',
  '斜方肌': '斜方肌', '颈部': '斜方肌',
  '前臂': '前臂', '小臂': '前臂',
  '小腿': '小腿',
  '臀': '臀部', '臀部': '臀部',
  '腹部': '腹部', '核心': '腹部', '腹': '腹部',
  '拉伸': '拉伸', '柔韧': '拉伸',
  '有氧': '有氧', '心肺': '有氧',
  '全身': '全身', '综合': '全身',
};


function categorize(item: ExerciseItem): string {
  if (item.bodyPart && bodyPartMap[item.bodyPart]) return bodyPartMap[item.bodyPart];
  const m = (item.muscle || '').trim();
  if (!m) return '全身';
  if (muscleAlias[m]) return muscleAlias[m];
  for (const cat of SIDEBAR) {
    if (cat !== '全身' && m.includes(cat)) return cat;
  }
  return '全身';
}


const gifSource = (mediaId?: string) => (mediaId ? gifAssets[mediaId] : undefined) ?? null;


const EXERCISES: ExerciseItem[] = require('../../assets/data/exercises.json');


const EQUIP_TABS = ['全部', '杠铃', '哑铃', '绳索', '器械', '弹力带', '史密斯', '自重', '壶铃', '球'];
function equipKey(eq?: string): string {
  const e = (eq || '').toLowerCase();
  if (/smith/.test(e)) return '史密斯';
  if (/kettlebell|kettlebell/.test(e)) return '壶铃';
  if (/ball/.test(e)) return '球';
  if (/barbell|bar\b/.test(e)) return '杠铃';
  if (/dumbbell|dumbbell/.test(e)) return '哑铃';
  if (/cable|rope/.test(e)) return '绳索';
  if (/machine|lever|bench|assisted|strength|rack|weighted/.test(e)) return '器械';
  if (/band|suspension/.test(e)) return '弹力带';
  if (/body weight|bodyweight/.test(e)) return '自重';
  return '其他';
}


interface MusclePathSet {
  outline: string[];   // 人体轮廓（底色）
  highlight: string[]; // 目标肌肉区域（高亮色）
}

// 设计图风格：正面/背面解剖轮廓 + 目标肌肉高亮
// 每个 SVG 统一 viewBox="0 0 100 110"，高度略大于宽度便于呈现人体
const muscleArt: Record<string, MusclePathSet> = {
  '胸': {
    // 正面躯干：胸大肌高亮
    outline: [
      // 头+颈
      'M50 6c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9z',
      // 躯干
      'M30 24c-4 2-6 7-6 13v22c0 10 6 18 16 22',
      'M70 24c4 2 6 7 6 13v22c0 10-6 18-16 22',
      'M30 59c0 12 8 22 20 22s20-10 20-22',
      // 手臂外侧
      'M24 30c-6 4-8 10-8 20s4 16 8 22l6-4',
      'M76 30c6 4 8 10 8 20s-4 16-8 22l-6-4',
      'M30 32l-14 10c-2 2-4 6-2 10l4 8 10-6',
      'M70 32l14 10c2 2 4 6 2 10l-4 8-10-6',
    ],
    highlight: [
      // 左胸
      'M34 30c-2 6-2 12 4 18 4 4 10 6 12 2 2-4-2-14-8-18-4-3-6-3-8-2z',
      // 右胸
      'M66 30c2 6 2 12-4 18-4 4-10 6-12 2-2-4 2-14 8-18 4-3 6-3 8-2z',
      // 胸中线
      'M50 34v18',
    ],
  },
  '背': {
    // 背面躯干：背阔肌+斜方肌中下部
    outline: [
      'M50 6c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9z',
      'M30 24c-4 2-6 7-6 13v22c0 10 6 18 16 22',
      'M70 24c4 2 6 7 6 13v22c0 10-6 18-16 22',
      'M30 59c0 12 8 22 20 22s20-10 20-22',
      'M24 30c-6 4-8 10-8 20s4 16 8 22l6-4',
      'M76 30c6 4 8 10 8 20s-4 16-8 22l-6-4',
    ],
    highlight: [
      // 斜方肌下部（三角区）
      'M38 24l12 10 12-10-6 10c-3 5-12 5-18 0l-6-10z',
      // 左背阔
      'M30 36c-2 10 4 20 12 26 4 2 6-2 6-6 0-6-6-12-12-16s-6-5-6-4z',
      // 右背阔
      'M70 36c2 10-4 20-12 26-4 2-6-2-6-6 0-6 6-12 12-16s6-5 6-4z',
      // 脊柱
      'M50 28v36',
    ],
  },
  '腿': {
    // 正面腿：股四头肌高亮
    outline: [
      'M30 22h40l-4 12c-4 8-6 22-6 34 0 10 4 18 8 22l-16 4-16-4c4-4 8-12 8-22 0-12-2-26-6-34l-4-12z',
      'M42 10c-4 0-8 4-8 10v4h32v-4c0-6-4-10-8-10h-16z',
    ],
    highlight: [
      // 左股四头
      'M32 40c0 12 6 28 14 34 2-4 2-14 2-26 0-10-8-10-16-8z',
      // 右股四头
      'M68 40c0 12-6 28-14 34-2-4-2-14-2-26 0-10 8-10 16-8z',
      // 髌骨
      'M42 74h16v8H42z',
    ],
  },
  '肩': {
    // 正面：三角肌高亮
    outline: [
      'M50 4c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9z',
      'M32 24c-4 2-6 8-6 14v18c0 8 4 14 10 18',
      'M68 24c4 2 6 8 6 14v18c0 8-4 14-10 18',
      'M36 64l-6 32',
      'M64 64l6 32',
      'M22 32c-6 6-8 14-6 24l6 8 6-14',
      'M78 32c6 6 8 14 6 24l-6 8-6-14',
    ],
    highlight: [
      // 左三角肌
      'M30 22c-4 6 0 18 10 20 6-2 6-12 2-18-2-2-8-3-12-2z',
      // 右三角肌
      'M70 22c4 6 0 18-10 20-6-2-6-12-2-18 2-2 8-3 12-2z',
      // 肩线
      'M34 22c4-6 26-6 32 0',
    ],
  },
  '三头': {
    // 手臂外侧视图：肱三头肌长头+外侧头
    outline: [
      // 躯干小图
      'M44 6c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z',
      'M34 16h20l-2 10 8 4',
      // 左臂主图（大）
      'M50 32c-12 2-22 10-24 24-2 12 2 24 10 32s20 12 32 10c10-2 18-10 22-20 4-10 2-24-6-34-6-8-18-12-30-10l-4-2z',
      // 前臂连接
      'M62 86c8 2 16 8 22 18l-10 4',
    ],
    highlight: [
      // 长头
      'M42 48c-4 12-2 26 8 32 4-2 4-12 0-20-2-4-4-8-8-12z',
      // 外侧头
      'M56 42c8 4 14 14 16 28-2 4-8 4-12-2-6-8-6-18-4-26z',
      // 内侧头（肘上）
      'M54 68l10 14c-4 2-10 0-12-6l2-8z',
    ],
  },
  '二头': {
    // 手臂前视图：肱二头肌长短头
    outline: [
      'M44 6c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z',
      'M34 16h20l-2 10-8 4',
      // 左臂主图
      'M50 30c-12 2-22 10-24 24-2 14 4 28 14 36s24 10 36 4c10-6 16-18 16-32 0-14-8-26-22-30-10-2-16-2-20-2z',
      'M80 70c8 8 12 20 10 34l-12-2',
    ],
    highlight: [
      // 二头肌长头（隆起）
      'M40 48c-2 10 2 22 12 24 6-2 6-12 2-20-2-6-8-8-14-4z',
      // 二头肌短头
      'M58 44c8 6 12 18 10 30-4 2-10-2-10-12 0-8-2-14 0-18z',
      // 肌腱（下）
      'M52 72h12l-4 12h-4l-4-12z',
    ],
  },
  '斜方肌': {
    // 背面颈肩区：斜方肌（上中下束）高亮
    outline: [
      'M50 4c-6 0-10 5-10 11s4 11 10 11 10-5 10-11-4-11-10-11z',
      'M28 24c-4 2-6 8-6 14v20c0 8 4 14 10 18l-8 26',
      'M72 24c4 2 6 8 6 14v20c0 8-4 14-10 18l8 26',
      'M22 32c-6 6-8 14-6 24l6 8 6-14',
      'M78 32c6 6 8 14 6 24l-6 8-6-14',
    ],
    highlight: [
      // 上束（耸肩区）
      'M30 20c4 4 14 4 20 0 6 4 16 4 20 0-2 6-8 12-20 14-12-2-18-8-20-14z',
      // 中束
      'M36 32l14 10 14-10-4 12c-3 3-16 3-20 0l-4-12z',
      // 下束（倒三角尖）
      'M42 50l8 24 8-24-4-4-4 8-4-8-4 4z',
    ],
  },
  '前臂': {
    // 前臂+手腕肌群
    outline: [
      'M44 4c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z',
      'M34 14h20v10l-8 4',
      // 上臂
      'M38 28l18 8-2 18',
      // 前臂主图
      'M44 50c-14 4-22 18-20 34 2 12 12 22 26 22s26-8 28-22c2-14-6-28-20-32l-14-2z',
      'M78 78c8 10 10 26 4 38l-14-8',
    ],
    highlight: [
      // 桡侧肌群（拇指侧）
      'M32 60c-2 10 2 22 12 26 4-2 4-12 2-18-2-6-8-10-14-8z',
      // 尺侧肌群（小指侧）
      'M68 56c10 4 14 18 12 32-4 2-10-2-10-12 0-8-4-16-2-20z',
      // 腕伸肌（横纹）
      'M40 80h26',
      'M42 86h22',
    ],
  },
  '小腿': {
    // 小腿后侧：腓肠肌+比目鱼肌
    outline: [
      // 大腿下半
      'M32 6h36l-4 20v10',
      // 膝
      'M38 36h24',
      // 小腿主体（后侧）
      'M36 38c-4 12 0 36 10 52 2-4 2-14 2-22 0-10 6-10 16-6 8 4 10 18 8 28 8-12 10-32 8-44-2-12-12-22-28-22s-26 8-26 14z',
      // 脚踝+足跟
      'M44 90h12l-2 12h-8l-2-12z',
    ],
    highlight: [
      // 腓肠肌内侧头
      'M38 46c-2 14 4 30 14 34 4-4 0-18-2-24-2-8-6-12-12-10z',
      // 腓肠肌外侧头
      'M62 46c10-2 18 2 20 18 2 12-4 22-14 22-2-8-6-20-6-28 0-6 2-10 0-12z',
      // 中线（跟腱延伸）
      'M50 48v40',
      // 比目鱼肌下沿
      'M42 80h16',
    ],
  },
  '臀部': {
    // 后视图：臀大肌+臀中肌（设计图绿色填充臀部区域）
    outline: [
      // 上半身小
      'M50 4c-6 0-10 5-10 11s4 11 10 11 10-5 10-11-4-11-10-11z',
      'M30 26c-4 2-6 8-6 14v14c0 6 4 10 10 14',
      'M70 26c4 2 6 8 6 14v14c0 6-4 10-10 14',
      // 腰部
      'M38 64h24',
      // 臀部区域
      'M30 66c0-8 8-14 20-14s20 6 20 14v8c0 14-8 26-20 26s-20-12-20-26v-8z',
      // 大腿上
      'M32 94l-2 12h14l-2-12',
      'M68 94l2 12H56l2-12',
    ],
    highlight: [
      // 左臀大肌（椭圆）
      'M32 72c0-10 8-16 18-14 2 6-2 16-10 20-6 2-8-2-8-6z',
      // 右臀大肌
      'M68 72c0-10-8-16-18-14-2 6 2 16 10 20 6 2 8-2 8-6z',
      // 臀中肌上沿（髂嵴）
      'M34 66c6-6 26-6 32 0',
      // 臀沟
      'M50 74v24',
    ],
  },
  '腹部': {
    // 正面：腹直肌+腹外斜肌
    outline: [
      'M50 6c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9z',
      'M32 24c-4 2-6 8-6 14v16c0 8 4 14 10 18v20c0 14 6 26 20 26s20-12 20-26V72c6-4 10-10 10-18V38c0-6-2-12-6-14',
      'M22 32c-6 6-8 14-6 24l6 8 6-14',
      'M78 32c6 6 8 14 6 24l-6 8-6-14',
    ],
    highlight: [
      // 腹直肌鞘轮廓
      'M38 36c-2 16 2 36 12 36s14-20 12-36c-4-4-20-4-24 0z',
      // 腹白线
      'M50 38v32',
      // 腱划（4行腹肌）
      'M40 46h20',
      'M40 56h20',
      'M40 66h20',
      // 腹外斜肌（两侧 V 线）
      'M38 42c-6 10-8 24-2 36l8-10c-2-8 0-18 2-22l-8-4z',
      'M62 42c6 10 8 24 2 36l-8-10c2-8 0-18-2-22l8-4z',
    ],
  },
  '拉伸': {
    // 坐姿体前屈（拉伸姿势）
    outline: [
      // 头
      'M30 14c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z',
      // 躯干前倾
      'M30 28c-6 4-10 10-10 18l26 6 6-6',
      // 伸直的双腿
      'M14 54h60l-8 14c-4 6-12 6-18 0l-26-12c-4-2-8-4-8-8z',
      // 手臂伸向脚
      'M22 46l-4 18c-2 2 2 6 6 4l8-14',
      'M42 48l14 14c2 2 6-2 4-6l-12-12',
    ],
    highlight: [
      // 被拉伸的腿后侧（筋络线）
      'M20 58c10 0 34 2 48-2',
      'M22 62c14 4 36 4 50 0',
      // 腰部拉伸区
      'M18 38c6-4 20-6 30-4',
    ],
  },
  '有氧': {
    // 跑步人形+心跳线
    outline: [
      // 头
      'M58 10c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z',
      // 跑步身体前倾
      'M50 24l10 8 6 14',
      // 右臂前摆
      'M56 28l16-6 4 6',
      // 左臂后摆
      'M54 32l-14 8-4-2',
      // 右腿前迈
      'M60 46l14 10-4 10',
      // 左腿后蹬
      'M58 46l-18 16-2 8',
    ],
    highlight: [
      // 心形（左上）
      'M18 18c-4-4-10-2-10 4 0 6 10 12 10 12s10-6 10-12c0-6-6-8-10-4z',
      // 心率折线
      'M6 40l6 0 4-10 4 20 4-14 4 8 8-4',
      // 速度线
      'M12 78h20',
      'M18 88h14',
    ],
  },
  '全身': {
    // 标准整身正面解剖轮廓
    outline: [
      // 头
      'M50 6c-6 0-10 5-10 11s4 11 10 11 10-5 10-11-4-11-10-11z',
      // 躯干
      'M32 28c-4 2-6 8-6 14v18c0 8 4 14 10 18v20c0 14 6 26 20 26s20-12 20-26V78c6-4 10-10 10-18V42c0-6-2-12-6-14',
      // 双臂
      'M26 36c-6 4-8 14-6 26l6 8 6-14-2-20',
      'M74 36c6 4 8 14 6 26l-6 8-6-14 2-20',
    ],
    highlight: [
      // 主要肌群：胸
      'M36 36c-2 8 4 14 10 14s12-6 10-14c-2-2-18-2-20 0z',
      // 腹肌
      'M42 52h16M42 60h16M42 68h16',
      'M50 50v24',
      // 肩
      'M34 32c4-4 28-4 32 0',
      // 腿
      'M40 82c-2 14 4 26 10 28',
      'M60 82c2 14-4 26-10 28',
    ],
  },
};


// 根据选中/未选中，绘制不同的 轮廓+高亮 组合
// 未选中（白底卡片）：outline=深灰细线，highlight=primary填充
// 选中（深绿卡片）：outline=白细线，highlight=白填充 + 额外淡色描边阴影层
function MuscleArt({ cat, selected = false, size = 72 }: { cat: string; selected?: boolean; size?: number }) {
  const art = muscleArt[cat] || muscleArt['全身'];
  const outlineColor = selected ? 'rgba(255,255,255,0.95)' : '#2f3a34';
  const highlightColor = selected ? '#FFFFFF' : '#2E8B57';
  const highlightFillOpacity = selected ? 1 : 0.78;
  const outlineW = selected ? 1.6 : 1.4;
  const highlightW = selected ? 1.6 : 1.5;
  const softShadeColor = selected ? 'rgba(255,255,255,0.08)' : 'rgba(46,139,87,0.06)';

  return (
    <Svg width={size} height={(size * 110) / 100} viewBox="0 0 100 110" fill="none">
      {/* 背景淡色区（让卡片更有呼吸感） */}
      {art.outline.length > 0 && (
        <Path d="M20 10c0-6 60-6 60 0v86c0 10-60 10-60 0V10z" fill={softShadeColor} opacity={selected ? 0 : 1} />
      )}
      {/* 人体轮廓 */}
      {art.outline.map((d, i) => (
        <Path
          key={`o-${i}`}
          d={d}
          stroke={outlineColor}
          strokeWidth={outlineW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* 肌肉高亮区域：填充为主，描边为辅 */}
      {art.highlight.map((d, i) => (
        <Path
          key={`h-${i}`}
          d={d}
          fill={highlightColor}
          fillOpacity={highlightFillOpacity}
          stroke={highlightColor}
          strokeOpacity={selected ? 0.85 : 0.9}
          strokeWidth={highlightW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}


function ActionCard({ item, onPress }: { item: ExerciseItem; onPress: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const gif = gifSource(item.mediaId);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...Shadows.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.starCorner}>
        <Icons name="star-outline" size={16} color={colors.textTertiary} />
      </View>
      <View style={[styles.gifWrap, { backgroundColor: colors.surfaceVariant }]}>
        {gif && !imgError ? (
          <Image
            source={gif}
            style={styles.gif}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.gifPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Icons name="barbell-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.gifPlaceholderText, { color: colors.textTertiary }]}>暂无动图</Text>
          </View>
        )}
      </View>
      <Text style={[styles.actionName, { color: colors.text }]} numberOfLines={2}>
        {titleOf(item)}
      </Text>
    </TouchableOpacity>
  );
}


export default function ExercisePickerScreen(_props: ExercisePickerScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisePickerScreenProps['navigation']>();

  const [selectedCat, setSelectedCat] = useState<string>(SIDEBAR[0]);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<ExerciseItem | null>(null);
  const [selectedEquip, setSelectedEquip] = useState('全部');


  const grouped = useMemo(() => {
    const map = new Map<string, ExerciseItem[]>();
    SIDEBAR.forEach(c => map.set(c, []));
    EXERCISES.forEach(e => {
      const cat = categorize(e);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(e);
    });
    return map;
  }, []);


  const isSearching = search.trim().length > 0;


  const list = useMemo(() => {
    let base: ExerciseItem[];
    if (isSearching) {
      const q = search.trim().toLowerCase();
      base = EXERCISES.filter(e =>
        e.name.toLowerCase().includes(q) || (e.nameZh || '').toLowerCase().includes(q),
      );
    } else {
      base = grouped.get(selectedCat) ?? [];
    }
    if (selectedEquip !== '全部') {
      base = base.filter(e => equipKey(e.equipment) === selectedEquip);
    }
    return base;
  }, [isSearching, search, selectedCat, grouped, selectedEquip]);


  const choose = (e: ExerciseItem) => {
    setPendingAction({ actionId: e.id, actionName: titleOf(e), muscle: e.muscle || e.bodyPart || '' });
    setPreview(null);
    setTimeout(() => navigation.goBack(), 30);
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + Spacing.md,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: BorderRadius.xl,
          borderBottomRightRadius: BorderRadius.xl,
          ...Shadows.sm,
        },
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }]} activeOpacity={0.6}>
          <Icons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>选择训练动作</Text>
          <Text style={[styles.headerSub, { color: colors.textTertiary }]}>共 {EXERCISES.length} 个动作 · 点击卡片返回</Text>
        </View>
      </View>


      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant }]}>
        <Icons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索动作名称"
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
        />
        {isSearching && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.6}>
            <Icons name="close-circle" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>


      <View style={styles.bodyRow}>
        <FlatList
          style={styles.sidebar}
          data={SIDEBAR}
          keyExtractor={i => i}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.sideListContent, { backgroundColor: colors.background }]}
          renderItem={({ item }) => {
            const active = !isSearching && item === selectedCat;
            const count = (grouped.get(item) || []).length;
            // 选中态：主色实心（强对比）
            // 未选中态：surfaceVariant + 细边框，让 10 个分类之间的层级更清晰（不再是纯白 + 几乎不可见的阴影）
            const cardBg = active ? colors.primary : colors.surfaceVariant;
            const nameColor = active ? '#FFFFFF' : colors.text;
            const iconSize = active ? 50 : 44;

            return (
              <TouchableOpacity
                style={[
                  styles.sideItem,
                  {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.borderLight,
                    // 选中态使用 Shadows.md；未选中态用极轻的微阴影（Web 用 boxShadow 避免 shadow* 警告）
                    ...(active
                      ? Shadows.md
                      : RNPlatform.select({
                          web: { boxShadow: '0 1px 2px rgba(27, 67, 50, 0.04)' },
                          default: {
                            shadowColor: '#1B4332', shadowOpacity: 0.04,
                            shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
                            elevation: 1,
                          },
                        })),
                  },
                ]}
                onPress={() => { setSelectedCat(item); setSearch(''); }}
                activeOpacity={active ? 0.92 : 0.8}
              >
                {/* 左侧：肌肉解剖示意图 */}
                <View style={styles.sideArtWrap}>
                  <MuscleArt cat={item} selected={active} size={iconSize} />
                </View>

                {/* 右侧：文字区（名称上 / 徽章下） */}
                <View style={styles.sideTextCol}>
                  <Text
                    style={[
                      styles.sideCatName,
                      {
                        color: nameColor,
                        fontSize: active ? FontSize.lg + 1 : FontSize.md + 1,
                        fontWeight: active ? '800' : '700',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                  <View style={[
                    styles.sideBadge,
                    {
                      backgroundColor: active ? 'rgba(255,255,255,0.95)' : colors.primarySoft,
                    },
                  ]}>
                    <Text style={[
                      styles.sideBadgeText,
                      { color: active ? colors.primary : colors.primary },
                    ]}>
                      {count}
                    </Text>
                  </View>
                </View>

                {/* 最右侧：箭头 */}
                <View style={styles.sideChevron}>
                  <Icons
                    name="chevron-forward"
                    size={active ? 20 : 16}
                    color={active ? 'rgba(255,255,255,0.92)' : colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />


        <View style={styles.rightCol}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.equipScroll}
            contentContainerStyle={styles.equipRow}
          >
            {EQUIP_TABS.map(tab => {
              const on = tab === selectedEquip;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.equipPill, {
                    backgroundColor: on ? colors.primarySoft : colors.card,
                    borderColor: on ? colors.primary : colors.borderLight,
                  }]}
                  onPress={() => setSelectedEquip(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.equipPillText, { color: on ? colors.primary : colors.textSecondary }]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>


          <FlatList
            style={styles.grid}
            data={list}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Icons name="search-outline" size={28} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  {isSearching ? '未找到匹配的动作' : '暂无该分类动作'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ActionCard item={item} onPress={() => setPreview(item)} />
            )}
          />
        </View>
      </View>


      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={() => setPreview(null)} />
          {preview && (
            <PreviewCard item={preview} onCancel={() => setPreview(null)} onConfirm={() => choose(preview)} colors={colors} />
          )}
        </View>
      </Modal>
    </View>
  );
}


function PreviewCard({ item, onCancel, onConfirm, colors }: {
  item: ExerciseItem;
  onCancel: () => void;
  onConfirm: () => void;
  colors: any;
}) {
  const gif = gifSource(item.mediaId);
  const [imgError, setImgError] = useState(false);

  return (
    <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
      <View style={styles.previewGifWrap}>
        {gif && !imgError ? (
          <Image source={gif} style={styles.previewGif} resizeMode="contain" onError={() => setImgError(true)} />
        ) : (
          <View style={[styles.previewGifPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Icons name="barbell-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.previewGifPlaceholderText, { color: colors.textTertiary }]}>暂无动图</Text>
          </View>
        )}
      </View>
      <View style={styles.previewBody}>
        <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>{titleOf(item)}</Text>
        {item.desc ? (
          <ScrollView style={styles.previewDescScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.previewDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
          </ScrollView>
        ) : (
          <Text style={[styles.previewDesc, { color: colors.textTertiary }]}>暂无动作说明</Text>
        )}
      </View>
      <View style={[styles.previewBtns, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity style={[styles.previewBtn, { backgroundColor: colors.surfaceVariant }]} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[styles.previewBtnText, { color: colors.textSecondary }]}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.previewBtn, styles.previewBtnPrimary, { backgroundColor: colors.primary }]} onPress={onConfirm} activeOpacity={0.8}>
          <Icons name="checkmark" size={16} color="#FFF" />
          <Text style={[styles.previewBtnText, { color: '#FFF' }]}>选择此动作</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { marginRight: Spacing.md },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.xs, marginTop: 2 },


  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full,
    height: 40, gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },


  bodyRow: { flex: 1, flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs },

  // ======= 侧边栏：遵循设计约束 28% 宽度，限制最小最大防止挤压 =======
  sidebar: {
    width: '28%',
    minWidth: 100,
    maxWidth: 140,
  },
  sideListContent: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    gap: 8,
  },
  sideItem: {
    // 三层结构水平排列：[示意图 | 文字列 | 箭头]
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
    // 最小高度随示意图尺寸自适应（现在示意图更小）
    minHeight: 60,
  },
  // 左侧肌肉示意图容器：瘦身到 54px
  sideArtWrap: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // 中部文字列：名称在上 / 徽章在下
  sideTextCol: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 3,
    gap: 3,
    minWidth: 0, // Web 防止长文本撑破 flex 布局
  },
  sideCatName: {
    // 不再 numberOfLines=1 截断，完整显示"斜方肌/臀部/腹部"等
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  // 数量徽章：更紧凑的胶囊
  sideBadge: {
    alignSelf: 'flex-start',
    minWidth: 24,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    lineHeight: 12,
    includeFontPadding: false,
  },
  // 最右侧箭头：更小
  sideChevron: {
    width: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },


  rightCol: { flex: 1 },

  equipScroll: { flexGrow: 0 },
  equipRow: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: Spacing.sm },
  equipPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    ...Shadows.sm,
  },
  equipPillText: { fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.2 },


  grid: { flex: 1 },
  gridContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  gridRow: { justifyContent: 'space-between', marginBottom: Spacing.lg },

  actionCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  starCorner:{
    position:'absolute',
    zIndex:2,
    top:8,
    right:8
  },
  gifWrap: {
    width: '100%', aspectRatio: 1, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  gif: { width: '100%', height: '100%' },
  gifPlaceholder: {
    // 空态占位：使用更紧凑的布局，避免哑铃图标显得过大，与有图卡片视觉密度一致
    flex: 1, width: '100%',
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  gifPlaceholderText: { fontSize: FontSize.xs, opacity: 0.85 },
  actionName: { fontSize: FontSize.md, fontWeight: '600', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, lineHeight: 18, letterSpacing: 0.2 },


  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xl * 2, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm },


  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalBackdropTouch: { ...StyleSheet.absoluteFillObject },
  previewCard: {
    width: '100%', maxWidth: 360, maxHeight: '90%', borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  previewGifWrap: {
    width: '100%', backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  previewGif: { width: '85%', aspectRatio: 4 / 3, marginVertical: Spacing.sm },
  previewGifPlaceholder: { width: '85%', aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: Spacing.sm },
  previewGifPlaceholderText: { fontSize: FontSize.sm },
  previewBody: { padding: Spacing.lg },
  previewTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  previewDescScroll: { maxHeight: 100, flexGrow: 0 },
  previewDesc: { fontSize: FontSize.sm, lineHeight: 20 },
  previewBtns: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderTopWidth: 1, marginTop: -6 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full, gap: 4 },
  previewBtnPrimary: { ...Shadows.sm },
  previewBtnText: { fontSize: FontSize.md, fontWeight: '600' },
});
