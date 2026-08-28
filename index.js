// Web 平台 polyfill 必须在所有 expo 模块之前导入
import './src/polyfill.web';
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './src/App';
import appConfig from './app.json';
const appName = appConfig.name;

AppRegistry.registerComponent(appName, () => App);

// 仅在 Web 端主动挂载；原生端由系统自动启动 registerComponent
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication(appName, { rootTag });
  }
}
