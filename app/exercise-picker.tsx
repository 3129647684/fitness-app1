import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { setPendingAction } from '@/store/exerciseStore';


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


// bodyPart(英文) → 中文侧边栏分类
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


// 侧边栏固定分类顺序
const SIDEBAR = ['胸', '背', '腿', '肩', '三头', '二头', '斜方肌', '前臂', '小腿', '臀部', '腹部', '拉伸', '有氧', '全身'];


// 兼容旧数据：muscle(中文) → 侧边栏分类
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


// 动作演示 GIF：随 App 打包（assets/videos），通过资源映射表引用，完全离线可用
import { gifAssets } from '@/constants/gifAssets';
const gifSource = (mediaId?: string) => (mediaId ? gifAssets[mediaId] : undefined) ?? null;


const EXERCISES: ExerciseItem[] = require('../assets/data/exercises.json');


// 器材筛选胶囊条（顺序固定）
const EQUIP_TABS = ['全部', '杠铃', '哑铃', '绳索', '器械', '弹力带', '史密斯', '自重', '壶铃', '球'];
// exercises.json 的 equipment(英文) → 胶囊分类
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


// 肌肉线稿图标（SVG stroke 线稿，viewBox 0 0 48 48）
const musclePaths: Record<string, string[]> = {
  '胸': ['M9 21c2-8 28-8 30 0v4c0 4-3 7-7 7H16c-4 0-7-3-7-7v-4z', 'M24 20v12'],
  '背': ['M9 15c5-2 10-3 15-3s10 1 15 3', 'M9 15v9c0 6 5 9 15 9s15-3 15-9v-9', 'M16 13l3 16 5-14 5 14 3-16'],
  '腿': ['M24 8c-4 6-5 16-5 25 0 3 2 5 5 5s5-2 5-5c0-9-1-19-5-25z', 'M20 22h9'],
  '肩': ['M13 15c1-5 5-8 11-8 7 0 12 4 13 9l-3 7', 'M13 15c-2 4-3 9-3 14', 'M23 7c4 3 5 7 3 11', 'M24 23c3 0 6 2 6 5'],
  '三头': ['M12 13c9-4 19-2 23 4 1 2 1 5-1 6l-2 1-7-6', 'M12 13c-1 3-2 7-2 11', 'M25 16l3 6-7 5-3-3', 'M20 22v10', 'M20 32h6'],
  '二头': ['M14 12c2-3 6-4 9-2 5 3 7 9 6 15l-2 3', 'M14 12c-2 3-3 7-3 12', 'M31 13c-3-2-7-1-9 1-2 2-3 5-2 7l1 4 5 4 3 6 3-1', 'M19 16c2 1 4 3 4 6'],
  '斜方肌': ['M17 8c-2 2-2 5-1 6', 'M31 8c2 2 2 5 1 6', 'M16 12h16', 'M16 12c-3 6-6 12-9 16', 'M32 12c3 6 6 12 9 16', 'M24 12v4', 'M7 24h8', 'M33 24h8'],
  '前臂': ['M16 12c-5 4-7 10-7 16 0 4 2 6 4 6', 'M24 12l-5 20c1 3 3 4 5 4', 'M24 12c5 4 7 10 7 16 0 4-2 6-4 6', 'M33 10v8'],
  '小腿': ['M24 6c2 5 3 10 3 16 0 9-2 15-4 20c-2-4-3-10-3-17 0-5 1-9 3-15z', 'M24 6c2 5 3 10 3 16', 'M20 22h8'],
  '臀部': ['M13 24c0-6 4-11 11-11s11 5 11 11', 'M13 24v3c0 5 3 9 11 9s11-4 11-9v-3', 'M13 27h8', 'M35 27h8'],
  '腹部': ['M14 10c3-3 6-6 10-6s7 3 10 6', 'M14 10c-2 5-3 10-3 16 0 7 4 12 13 12s13-5 13-12c0-6-1-11-3-16', 'M16 18h16', 'M16 26h16', 'M10 16l1 3', 'M10 22l1 3', 'M38 16l-1 3', 'M38 22l-1 3'],
  '拉伸': ['M8 40c6-8 12-20 16-30', 'M24 12l6 4 6-6', 'M30 16l-2 10c-1 6-6 12-6 18', 'M22 24l6 2', 'M34 12l3 3'],
  '有氧': ['M24 36C12 26 8 18 16 13c3-2 6 1 8 4 3-6 18-4 16 10l-4 5'],
  '全身': ['M24 6c2 3 3 6 3 10 0 3-1 5-3 6', 'M24 6c-2 3-3 6-3 10 0 3 1 5 3 6', 'M24 22v4', 'M14 20c-1 6-1 12 0 18', 'M34 20c1 6 1 12 0 18', 'M18 13l1 8', 'M30 13l-1 8', 'M16 40c2-2 5-3 8-3s6 1 8 3'],
};


function MuscleIcon({ cat, color, size = 26 }: { cat: string; color: string; size?: number }) {
  const paths = musclePaths[cat] || musclePaths['全身'];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {paths.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
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
      style={[styles.actionCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 收藏星星占位右上角 */}
      <View style={styles.starCorner}>
        <Ionicons name="star-outline" size={16} color={colors.textTertiary} />
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
          <View style={styles.gifPlaceholder}>
            <Ionicons name="barbell-outline" size={22} color={colors.textTertiary} />
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


export default function ExercisePickerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedCat, setSelectedCat] = useState<string>(SIDEBAR[0]);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<ExerciseItem | null>(null);
  const [selectedEquip, setSelectedEquip] = useState('全部');


  // 一次分组缓存，避免每次渲染重复计算
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
    // 回传 actionId / actionName 给记录页（记录页通过 exerciseStore 接收）
    setPendingAction({ actionId: e.id, actionName: titleOf(e), muscle: e.muscle || e.bodyPart || '' });
    router.back();
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ position: 'absolute', top: 0, left: 0, zIndex: 9999, color: 'red', fontSize: 10 }}>DEBUG-LOAD-OK</Text>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>选择训练动作</Text>
          <Text style={[styles.headerSub, { color: colors.textTertiary }]}>共 {EXERCISES.length} 个动作 · 点击卡片返回</Text>
        </View>
      </View>


      {/* 顶部搜索框 */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
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
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>


      {/* 主体：左侧竖栏 + 右侧（器材筛选 + 网格） */}
      <View style={styles.bodyRow}>
        <FlatList
          style={[styles.sidebar, { backgroundColor: colors.surfaceVariant }]}
          data={SIDEBAR}
          keyExtractor={i => i}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sideListContent}
          renderItem={({ item }) => {
            const active = !isSearching && item === selectedCat;
            const count = (grouped.get(item) || []).length;

            return (
              <TouchableOpacity
                style={[styles.sideItem, {
                  backgroundColor: active ? colors.primary : 'transparent',
                  ...(active ? Shadows.sm : {}),
                }]}
                onPress={() => { setSelectedCat(item); setSearch(''); }}
                activeOpacity={0.85}
              >
                {active ? (
                  // 选中状态大图块布局（对标图二）
                  <View style={styles.sideActiveInner}>
                    <MuscleIcon cat={item} color="#FFFFFF" size={36} />
                    <View style={styles.sideActiveTextWrap}>
                      <Text style={[styles.sideActiveText]}>{item}</Text>
                      <View style={styles.sideActiveCountBadge}>
                        <Text style={styles.sideActiveCountText}>{count}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                ) : (
                  // 未选中行布局
                  <View style={styles.sideNormalInner}>
                    <MuscleIcon cat={item} color={colors.primary} size={24} />
                    <Text style={[styles.sideText, { color: colors.text }]} numberOfLines={1}>
                      {item}
                    </Text>
                    <View style={[styles.sideCount, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.sideCountText, { color: colors.primary }]}>{count}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />


        <View style={styles.rightCol}>
          {/* 器材筛选条挪到网格内部上方，对标图二 */}
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
                <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
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


      {/* GIF 预览弹窗：点卡片 → 预览，确认后再选择返回 */}
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
            <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
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
          <Ionicons name="checkmark" size={16} color="#FFF" />
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
  },
  searchInput: { flex: 1, fontSize: FontSize.md },


  bodyRow: { flex: 1, flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.sm },

  // =========侧边栏改动：宽度28%=========
  sidebar: { width: '28%', minWidth: 100, maxWidth: 140 },
  sideListContent: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.xs },
  sideItem: {
    borderRadius: BorderRadius.md,
    marginBottom: 4,
    overflow: 'hidden',
  },
  sideNormalInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    gap: 8,
  },
  sideText: { flexShrink: 1, fontSize: FontSize.sm, fontWeight: '600' },
  sideCount: {
    minWidth: 22, height: 18, paddingHorizontal: 6,
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
  },
  sideCountText: { fontSize: 10, fontWeight: '700' },

  // 选中状态布局
  sideActiveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap:10,
  },
  sideActiveTextWrap:{
    flex:1,
    position:'relative'
  },
  sideActiveText:{
    color:'#ffffff',
    fontSize:FontSize.lg,
    fontWeight:'700'
  },
  sideActiveCountBadge:{
    position:'absolute',
    right:0,top:-4,
    backgroundColor:'rgba(255,255,255,0.92)',
    borderRadius:12,
    paddingHorizontal:7,
    paddingVertical:2
  },
  sideActiveCountText:{
    color:'#2e7d52',
    fontSize:11,
    fontWeight:'700'
  },


  rightCol: { flex: 1 },

  equipScroll: { flexGrow: 0 },
  equipRow: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: Spacing.sm },
  equipPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  equipPillText: { fontSize: FontSize.sm, fontWeight: '600' },


  grid: { flex: 1 },
  gridContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  gridRow: { justifyContent: 'space-between', marginBottom: Spacing.md },

  actionCard: {
    width: '48%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position:'relative'
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
  gifPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
  gifPlaceholderText: { fontSize: FontSize.xs },
  actionName: { fontSize: FontSize.md, fontWeight: '600', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, lineHeight: 18 },


  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xl * 2, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm },


  // 预览弹窗
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalBackdropTouch: { ...StyleSheet.absoluteFillObject },
  previewCard: {
    width: '100%', maxWidth: 360, maxHeight: '90%', borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.lg,
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
