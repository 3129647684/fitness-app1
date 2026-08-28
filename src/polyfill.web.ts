// Web 平台 polyfill：在 expo-modules-core 加载前初始化 NativeModule，
// 避免 'Cannot read properties of undefined (reading "NativeModule")' 错误
// 此文件必须在 expo 模块导入之前执行
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  g.expo = g.expo || {};
  g.expo.NativeModule = g.expo.NativeModule || {};
  g.expo.modules = g.expo.modules || {};
  // 注册找不到的原生模块
  g.expo.modules.ExpoLinking = g.expo.modules.ExpoLinking || {};
  g.expo.modules.ExpoDocumentPicker = g.expo.modules.ExpoDocumentPicker || {};
  g.expo.modules.ExpoFileSystem = g.expo.modules.ExpoFileSystem || {};
  g.expo.modules.ExpoSharing = g.expo.modules.ExpoSharing || {};
  g.expo.modules.ExpoFont = g.expo.modules.ExpoFont || {};
  // 标记 web 环境，避免 expo-modules-core 尝试加载原生模块
  g.ExpoDomWebView = { isNative: false };
}

// 修复 expo-font 错误 "Class extends value undefined is not a constructor or null"
if (typeof module !== 'undefined' && module.exports) {
  // 确保 NativeModule 基类存在
  if (!('NativeModule' in module.exports)) {
    (module.exports as any).NativeModule = class NativeModule {};
  }
}
