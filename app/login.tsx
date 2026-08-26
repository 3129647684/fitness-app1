import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api, ApiError } from '@/api/client';
import { saveSession } from '@/database/session';
import { setActiveUser } from '@/database/db';
import { syncPull } from '@/database/sync';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SERVER_URL } from '@/constants/config';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  const submit = async () => {
    if (loading) return;
    setError('');
    const name = username.trim();
    if (!name || password.length < 6) {
      setError(mode === 'login' ? '请输入用户名和密码（密码至少 6 位）' : '请输入用户名、至少 6 位密码');
      return;
    }
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(name, password)
          : await api.register(name, password, nickname.trim() || undefined);

      await saveSession({ token: res.token, user: res.user });
      // 激活本地数据库用户：先收养旧数据，再尝试拉取云端
      setActiveUser(res.user.id);
      syncPull()
        .then(() => console.log('[auth] cloud data pulled'))
        .catch((e) => console.warn('[auth] sync pull skipped:', e?.message));
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#1B4332', '#121212']
          : ['#D8F3DC', '#F6FBF4', '#FFFFFF']
      }
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* 品牌区 */}
            <View style={styles.brand}>
              <View style={[styles.logo, isDark ? styles.logoDark : styles.logoLight]}>
                <Ionicons name="body" size={30} color={colors.primary} />
              </View>
              <Text style={[styles.brandTitle, { color: isDark ? '#FFF' : '#1B4332' }]}>身体数据记录</Text>
              <Text style={[styles.brandSub, { color: isDark ? colors.textSecondary : '#4E7A65' }]}>
                记录 · 洞察 · 更好的自己
              </Text>
            </View>

            {/* 表单卡片 */}
            <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
              {/* 切换 */}
              <View style={[styles.segment, { backgroundColor: colors.surfaceVariant }]}>
                {(['login', 'register'] as Mode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.segmentItem,
                      mode === m && { backgroundColor: colors.surface, ...(isDark ? {} : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }) },
                    ]}
                    onPress={() => switchMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, { color: mode === m ? colors.primary : colors.textTertiary, fontWeight: mode === m ? '700' : '500' }]}>
                      {m === 'login' ? '登录' : '注册'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === 'register' && (
                <Field
                  icon="person-circle-outline"
                  placeholder="昵称（选填）"
                  value={nickname}
                  onChangeText={setNickname}
                  colors={colors}
                />
              )}
              <Field
                icon="at-outline"
                placeholder="用户名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                colors={colors}
              />
              <Field
                icon="lock-closed-outline"
                placeholder="密码（至少 6 位）"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                colors={colors}
              />

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submit, { backgroundColor: colors.primary }]}
                onPress={submit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.submitText}>{mode === 'login' ? '登录' : '创建账户'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.serverHint, { color: colors.textTertiary }]}>
                服务器：{SERVER_URL}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({
  icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, autoCorrect, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.field, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
      <Ionicons name={icon} size={18} color={colors.textTertiary} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={autoCorrect ?? true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1B4332',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logoDark: {
    backgroundColor: '#1E1E1E',
  },
  brandTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: FontSize.sm,
    marginTop: 6,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm + 2,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md - 2,
  },
  segmentText: {
    fontSize: FontSize.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  errorText: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  serverHint: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});