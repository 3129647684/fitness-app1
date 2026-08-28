// Web 平台 polyfill：在 expo-modules-core 加载前初始化 NativeModule，
// 避免 'Cannot read properties of undefined (reading "NativeModule")' 错误
// 此文件必须在 expo 模块导入之前执行
if (typeof globalThis !== 'undefined') {
  globalThis.expo = globalThis.expo || {};
  globalThis.expo.NativeModule = globalThis.expo.NativeModule || {};
  globalThis.expo.modules = globalThis.expo.modules || {};
  // 注册找不到的原生模块
  globalThis.expo.modules.ExpoLinking = globalThis.expo.modules.ExpoLinking || {};
  globalThis.expo.modules.ExpoDocumentPicker = globalThis.expo.modules.ExpoDocumentPicker || {};
  globalThis.expo.modules.ExpoFileSystem = globalThis.expo.modules.ExpoFileSystem || {};
  globalThis.expo.modules.ExpoSharing = globalThis.expo.modules.ExpoSharing || {};
  globalThis.expo.modules.ExpoFont = globalThis.expo.modules.ExpoFont || {};
  // 标记 web 环境，避免 expo-modules-core 尝试加载原生模块
  (globalThis as any).ExpoDomWebView = { isNative: false };
}

// 修复 expo-font 错误 "Class extends value undefined is not a constructor or null"
if (typeof module !== 'undefined' && module.exports) {
  // 确保 NativeModule 基类存在
  if (!('NativeModule' in module.exports)) {
    (module.exports as any).NativeModule = class NativeModule {};
  }
}