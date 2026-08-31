import { Platform } from 'react-native';
import 'react-native-gesture-handler';

// Web 平台 polyfill（仅在 Web 端加载，原生端不需要）
if (Platform.OS === 'web') {
  require('./src/polyfill.web');
}

import { registerRootComponent } from 'expo';
import App from './src/App';

// Expo 标准方式注册根组件，自动处理组件名匹配，避免 "main has not been registered" 错误
registerRootComponent(App);
