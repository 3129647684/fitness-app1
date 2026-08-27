import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './constants/theme';
import RootNavigator from './navigation/RootNavigator';
import { useWebGlobalStyles } from './hooks/useResponsive';

type AppTheme = typeof DefaultTheme;

const App: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  useWebGlobalStyles();

  const navTheme: AppTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: isDark ? Colors.dark.primary : Colors.light.primary,
      background: isDark ? Colors.dark.background : Colors.light.background,
      card: isDark ? Colors.dark.card : Colors.light.card,
      text: isDark ? Colors.dark.text : Colors.light.text,
      border: isDark ? Colors.dark.border : Colors.light.border,
    },
  };

  const barStyle = isDark ? 'light-content' : 'dark-content';
  const barBgColor = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar
            barStyle={barStyle}
            backgroundColor={barBgColor}
            translucent={false}
          />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
