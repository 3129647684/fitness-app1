import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icons } from '@/components/Icons';
import { GradientView } from '@/components/GradientView';
import { authApi, ApiError } from '@/api/client';
import { saveSession } from '@/database/session';
import { setActiveUser } from '@/database/db';
import { syncPull } from '@/database/sync';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { getServerUrl, setServerUrl, getServerUrlSync, DEFAULT_SERVER_URL } from '@/utils/serverConfig';
import type { LoginScreenProps } from '@/navigation/RootNavigator';

type Mode = 'login' | 'register';

export default function LoginScreen(_props: LoginScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation<LoginScreenProps['navigation']>();
  const tokens = useResponsiveTokens();
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverUrl, setServerUrlState] = useState(getServerUrlSync());
  const [editingServer, setEditingServer] = useState(false);
  const [serverInput, setServerInput] = useState(getServerUrlSync());

  useEffect(() => {
    getServerUrl().then((url) => {
      setServerUrlState(url);
      setServerInput(url);
    });
  }, []);

  const saveServerUrl = async () => {
    const trimmed = serverInput.trim();
    if (!trimmed) {
      setError('服务器地址不能为空');
      return;
    }
    await setServerUrl(trimmed);
    setServerUrlState(trimmed);
    setEditingServer(false);
    setError('');
  };

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
          ? await authApi.login(name, password)
          : await authApi.register(name, password, nickname.trim() || undefined);
      await saveSession({ token: res.token, user: { ...res.user, nickname: res.user.nickname ?? null } });
      setActiveUser(res.user.id);
      syncPull(res.token)
        .then(() => console.log('[auth] cloud data pulled'))
        .catch((e) => console.warn('[auth] sync pull skipped:', e?.message));
      navigation.replace('MainTabs');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const logoSize = tokens.isCompact ? 56 : 68;

  return (
    <GradientView
      colors={
        isDark
          ? ['#0D2818', '#1B4332', '#121212']
          : ['#B8DCC5', '#D8F3DC', '#F6FBF4']
      }
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                padding: tokens.isCompact ? s.lg : s.xl,
                paddingTop: tokens.isCompact ? s.xxl : s.xxxl,
                paddingBottom: s.xxxl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.brand, { marginBottom: tokens.isCompact ? s.xl : s.xxl }]}>
              <View style={[
                styles.logo,
                isDark ? styles.logoDark : styles.logoLight,
                {
                  width: logoSize,
                  height: logoSize,
                  borderRadius: tokens.isCompact ? 18 : 22,
                  marginBottom: s.md,
                },
              ]}>
                <Icons name="body" size={tokens.isCompact ? 26 : 30} color={colors.primary} />
              </View>
              <Text style={[styles.brandTitle, {
                color: isDark ? '#FFF' : '#1B4332',
                fontSize: tokens.isCompact ? f.xl : f.xxl,
              }]}>身体数据记录</Text>
              <Text style={[styles.brandSub, {
                color: isDark ? colors.textSecondary : '#4E7A65',
                fontSize: f.sm,
                marginTop: 6,
              }]}>
                记录 · 洞察 · 更好的自己
              </Text>
            </View>

            <View style={[styles.card, {
              backgroundColor: colors.surface,
              borderRadius: r.xl,
              padding: s.lg,
              gap: s.sm + 2,
            }, isDark && styles.cardDark]}>
              <View style={[styles.segment, {
                backgroundColor: colors.surfaceVariant,
                borderRadius: r.md,
                padding: 4,
                marginBottom: s.sm,
              }]}>
                {(['login', 'register'] as Mode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.segmentItem,
                      { paddingVertical: s.sm, borderRadius: r.md - 2 },
                      mode === m && {
                        backgroundColor: colors.surface,
                        ...(isDark ? {} : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }),
                      },
                    ]}
                    onPress={() => switchMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, {
                      color: mode === m ? colors.primary : colors.textTertiary,
                      fontWeight: mode === m ? '700' : '500',
                      fontSize: f.md,
                    }]}>
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
                  tokens={tokens}
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
                tokens={tokens}
              />

              <Field
                icon="lock-closed-outline"
                placeholder="密码（至少 6 位）"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                colors={colors}
                tokens={tokens}
              />

              {error ? (
                <View style={[styles.errorRow, { marginTop: 2 }]}>
                  <Icons name="alert-circle-outline" size={tokens.isCompact ? 14 : 15} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger, fontSize: f.sm }]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submit, {
                  backgroundColor: colors.primary,
                  paddingVertical: s.md + (tokens.isCompact ? 2 : 4),
                  borderRadius: r.md,
                  marginTop: s.sm,
                }]}
                onPress={submit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={[styles.submitText, { fontSize: f.lg }]}>
                      {mode === 'login' ? '登录' : '创建账户'}
                    </Text>
                    <Icons name="arrow-forward" size={tokens.isCompact ? 16 : 18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              {editingServer ? (
                <View style={[styles.serverEditRow, { marginTop: s.xs }]}>
                  <TextInput
                    style={[styles.serverInput, {
                      color: colors.text,
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.borderLight,
                      borderRadius: r.sm,
                      paddingHorizontal: s.sm,
                      paddingVertical: s.sm,
                      fontSize: f.xs,
                      flex: 1,
                    }]}
                    value={serverInput}
                    onChangeText={setServerInput}
                    placeholder="http://192.168.1.100:4000"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={saveServerUrl} style={[styles.serverSaveBtn, {
                    backgroundColor: colors.primary,
                    paddingHorizontal: s.md,
                    paddingVertical: s.sm,
                    borderRadius: r.sm,
                    marginLeft: s.sm,
                  }]}>
                    <Text style={{ color: '#FFF', fontSize: f.xs, fontWeight: '600' }}>保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingServer(false); setServerInput(serverUrl); }} style={{
                    paddingHorizontal: s.sm, paddingVertical: s.sm, marginLeft: 4,
                  }}>
                    <Text style={{ color: colors.textTertiary, fontSize: f.xs }}>取消</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.serverHintRow, { marginTop: s.xs }]}
                  onPress={() => { setServerInput(serverUrl); setEditingServer(true); }}
                  activeOpacity={0.6}
                >
                  <Icons name="settings" size={tokens.isCompact ? 12 : 13} color={colors.textTertiary} />
                  <Text style={[styles.serverHint, { color: colors.textTertiary, fontSize: f.xs, marginLeft: 4 }]}>
                    服务器：{serverUrl}（点击修改）
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientView>
  );
}

function Field({
  icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, autoCorrect, colors, tokens,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  colors: (typeof Colors)['light'];
  tokens: ReturnType<typeof useResponsiveTokens>;
}) {
  const s = tokens.spacing;
  const f = tokens.fontSize;
  const r = tokens.borderRadius;
  return (
    <View style={[styles.field, {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.borderLight,
      gap: s.sm,
      paddingHorizontal: s.md,
      borderRadius: r.md,
    }]}>
      <Icons name={icon} size={tokens.isCompact ? 16 : 18} color={colors.textTertiary} />
      <TextInput
        style={[styles.input, {
          color: colors.text,
          paddingVertical: s.md + (tokens.isCompact ? 0 : 2),
          fontSize: f.md,
        }]}
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
  serverHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverInput: {
    borderWidth: 1,
  },
  serverSaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
