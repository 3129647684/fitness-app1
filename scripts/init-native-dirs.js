const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const iosDir = path.join(projectRoot, 'ios');

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (e) {
    return false;
  }
}

function printSeparator() {
  console.log('='.repeat(60));
}

console.log('\n');
printSeparator();
console.log('  React Native 原生目录初始化脚本 (Windows 友好)');
printSeparator();

const hasAndroid = dirExists(androidDir);
const hasIos = dirExists(iosDir);

console.log('\n[检查] 当前目录状态:');
console.log(`  android/ : ${hasAndroid ? '已存在 ✓' : '不存在 ✗'}`);
console.log(`  ios/     : ${hasIos ? '已存在 ✓' : '不存在 ✗'}`);

if (hasAndroid && hasIos) {
  console.log('\n✓ android/ 和 ios/ 目录均已存在，无需初始化。');
  console.log('  如需重新生成，请先手动删除这两个目录后再运行本脚本。\n');
  process.exit(0);
}

console.log('\n[环境要求] 请确保已安装以下工具:');
console.log('  1. Android Studio (包含 Android SDK)');
console.log('  2. JDK 17 (建议使用 zulu-17 或 temurin-17)');
console.log('  3. Node.js 18+ 与 npm');
if (process.platform === 'darwin') {
  console.log('  4. CocoaPods (Mac/iOS 必填): sudo gem install cocoapods');
  console.log('  5. Xcode 15+ (iOS 必填)');
}

console.log('\n[建议的环境变量 (Windows)]:');
console.log('  ANDROID_HOME      = C:\\Users\\<用户名>\\AppData\\Local\\Android\\Sdk');
console.log('  JAVA_HOME         = C:\\Program Files\\Java\\jdk-17');
console.log('  Path 中加入:       %ANDROID_HOME%\\platform-tools');
console.log('                     %ANDROID_HOME%\\emulator');
console.log('                     %ANDROID_HOME%\\tools\\bin');

const rnInitCommand = [
  'npx @react-native-community/cli init',
  '--version 0.79.2',
  '--skip-install',
  '--skip-git-init',
  'tmp-rn-init',
].join(' ');

const copyCommands = [
  'xcopy tmp-rn-init\\android android /E /I /H /Y',
  'xcopy tmp-rn-init\\ios ios /E /I /H /Y',
  'rmdir /S /Q tmp-rn-init',
];

console.log('\n[执行命令] 请在 PowerShell 或 CMD 中手动执行以下命令:');
console.log('\n  第 1 步 - 生成临时 RN 项目骨架:');
console.log(`    cd "${projectRoot}"`);
console.log(`    ${rnInitCommand}`);
console.log('\n  第 2 步 - 拷贝 android/ 和 ios/ 目录并清理临时文件:');
copyCommands.forEach((cmd) => {
  console.log(`    ${cmd}`);
});

console.log('\n[后续配置] 目录拷贝完成后，还需要:');
console.log('  1. 修改 package name:');
console.log('     Android: android/app/build.gradle 中 applicationId');
console.log('     Android: android/app/src/main/AndroidManifest.xml 中 package');
console.log('     Android: 目录结构 android/app/src/main/java/com/<pkg>/... 也要对应重命名');
console.log('     iOS    : ios/BodyDataApp.xcodeproj/project.pbxproj 中 PRODUCT_BUNDLE_IDENTIFIER');
console.log('  2. 安装依赖并构建:');
console.log('     Windows/Android: npm install ; npm run android');
console.log('     Mac/iOS        : npm install ; cd ios ; pod install ; cd .. ; npm run ios');
console.log('  3. 若使用 react-native-vector-icons，还需在 android/app/build.gradle 末尾添加:');
console.log('     apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")');

console.log('\n[提示] 也可以直接在项目根目录下直接运行完整的组合命令:');
console.log(`  ${rnInitCommand} ; ${copyCommands.join(' ; ')}`);
console.log('');
