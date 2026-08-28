import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform as RNPlatform } from 'react-native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/Icons';
import { Colors, FontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsiveTokens } from '@/hooks/useResponsive';
import { loadSession } from '@/database/session';
import { setActiveUser } from '@/database/db';

import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import RecordScreen from '@/screens/RecordScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Record: { initialDate?: string } | undefined;
  Settings: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type HomeScreenProps = BottomTabScreenProps<MainTabsParamList, 'Home'>;
export type RecordScreenProps = BottomTabScreenProps<MainTabsParamList, 'Record'>;
export type SettingsScreenProps = BottomTabScreenProps<MainTabsParamList, 'Settings'>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

const MainTabsNavigator: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tokens = useResponsiveTokens();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      if (!session) { setAuthed(false); return; }
      setActiveUser(session.user.id);
      setAuthed(true);
    })();
  }, []);

  if (authed !== true) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const iconSize = tokens.isCompact ? 20 : 22;
  const safeBottom = Math.max(insets.bottom || 0, RNPlatform.OS === 'web' ? 20 : 12);
  const tabBarHeight = (tokens.isCompact ? 50 : 58) + safeBottom;
  const labelFontSize = tokens.isCompact ? 10 : FontSize.xs;

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: safeBottom,
          paddingTop: tokens.isCompact ? 4 : 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: labelFontSize, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline' as any} focused={focused} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="Record"
        component={RecordScreen}
        options={{
          title: '记录',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline' as any} focused={focused} size={iconSize + 4} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} size={iconSize} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({});

export default RootNavigator;
