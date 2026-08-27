# 身体数据 APP - 原生打包指南

## 目录

- [Windows Android APK 打包](#windows-android-apk-打包)
- [Mac iOS 打包](#mac-ios-打包)

---

## Windows Android APK 打包

### 1. 前置条件

确保已安装以下工具，并正确配置环境变量：

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| JDK | 17.x | 推荐 Zulu JDK 17 或 Eclipse Temurin 17 |
| Android Studio | 最新稳定版 | 包含 Android SDK、Gradle 等 |
| Android SDK | API 34+ | 通过 SDK Manager 安装 |
| Node.js | 18+ | 推荐 LTS 版本 |
| npm | 9+ | 随 Node.js 安装 |

### 2. 环境变量配置 (Windows)

打开「系统属性 → 高级 → 环境变量」，添加或确认以下系统变量：

```
ANDROID_HOME = C:\Users\<你的用户名>\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Java\jdk-17
```

在 `Path` 系统变量中追加：

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

验证配置：

```powershell
java -version          # 应显示 17.x
adb version            # 应正常输出
```

### 3. 生成原生目录 (首次)

如尚未有 `android/` 目录，先运行：

```powershell
node scripts/init-native-dirs.js
```

按提示在 PowerShell 中执行生成命令，生成后记得**修改包名**：

- `android/app/build.gradle`: 修改 `applicationId "com.tmp_rn_init"` → 你的包名（如 `com.bodydata.app`）
- `android/app/src/main/AndroidManifest.xml`: 修改 `package="..."`
- 重命名 `android/app/src/main/java/com/tmp_rn_init/` 目录结构与包名一致
- `android/settings.gradle`: 修改 `rootProject.name = 'tmp-rn-init'` → `'BodyDataApp'`

### 4. 生成 Keystore 签名密钥

在 PowerShell 中执行（在项目根目录或 `android/app/` 下）：

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias bodydata-key -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入密码、姓名等信息。完成后将 `release.keystore` 移到 `android/app/` 目录下。

### 5. 配置 Gradle Release 签名

编辑 `android/gradle.properties`，在末尾添加（注意修改为你自己的密码）：

```properties
BODYDATA_RELEASE_STORE_FILE=release.keystore
BODYDATA_RELEASE_KEY_ALIAS=bodydata-key
BODYDATA_RELEASE_STORE_PASSWORD=你的store密码
BODYDATA_RELEASE_KEY_PASSWORD=你的key密码
```

编辑 `android/app/build.gradle`，找到 `android { ... }` 块内的 `signingConfigs`：

```gradle
signingConfigs {
    release {
        storeFile file(BODYDATA_RELEASE_STORE_FILE)
        storePassword BODYDATA_RELEASE_STORE_PASSWORD
        keyAlias BODYDATA_RELEASE_KEY_ALIAS
        keyPassword BODYDATA_RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false        // 如需混淆可设为 true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

### 6. 安装依赖 & 构建 Release APK

```powershell
cd "项目根目录"
npm install
cd android

# 清理旧构建（可选）
.\gradlew clean

# 构建 Release APK
.\gradlew assembleRelease
```

构建完成后，APK 路径：

```
android/app/build/outputs/apk/release/app-release.apk
```

### 7. 安装测试

连接真机或启动模拟器后：

```powershell
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 8. 生成 AAB (Google Play 上架)

如需上架 Google Play，建议使用 AAB 格式：

```powershell
cd android
.\gradlew bundleRelease
```

产物：`android/app/build/outputs/bundle/release/app-release.aab`

---

## Mac iOS 打包

### 1. 前置条件

| 工具 | 版本要求 |
|------|----------|
| macOS | 13+ (Ventura 或更新) |
| Xcode | 15+ |
| CocoaPods | 1.14+ |
| JDK | 17 (如需同时打 Android) |
| Node.js | 18+ |

安装 CocoaPods：

```bash
sudo gem install cocoapods
```

或用 Homebrew：

```bash
brew install cocoapods
```

### 2. 生成原生目录 (首次)

```bash
node scripts/init-native-dirs.js
```

按提示执行生成命令，然后修改：

- `ios/Podfile`：参考 `deploy/ios/Podfile.template`（通常已包含正确配置）
- `ios/BodyDataApp.xcodeproj/project.pbxproj`：修改 `PRODUCT_BUNDLE_IDENTIFIER` 为你的 bundle id
- `ios/BodyDataApp/Info.plist`：检查显示名等配置

### 3. 安装 CocoaPods 依赖

```bash
cd ios
pod install
cd ..
```

### 4. 配置签名 (Signing & Capabilities)

1. 用 Xcode 打开 `ios/BodyDataApp.xcworkspace`（**不是** xcodeproj）
2. 左侧选中项目根 `BodyDataApp`，选择 target `BodyDataApp`
3. 进入「Signing & Capabilities」标签页
4. 勾选「Automatically manage signing」或手动配置 Provisioning Profile
5. 选择你的 Apple Developer Team
6. 设置 Bundle Identifier（需唯一，不能与已有 App 冲突）
7. 最低 iOS 版本建议设为 iOS 15.0 或以上

### 5. Archive 打包 IPA

1. 在 Xcode 顶部选择设备为「Any iOS Device (arm64)」
2. 菜单「Product → Archive」
3. 等待编译完成后自动弹出 Organizer 窗口
4. 选中刚生成的 Archive，点击「Distribute App」
5. 根据用途选择：
   - **TestFlight / App Store Connect**：上传到苹果后台做内部/外部测试或上架
   - **Ad Hoc / Enterprise**：导出 IPA 用于内测分发
6. 按向导完成导出，选择导出目录得到 `.ipa` 文件

### 6. 命令行打包 (可选)

```bash
# Archive
xcodebuild \
  -workspace ios/BodyDataApp.xcworkspace \
  -scheme BodyDataApp \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ios/build/BodyDataApp.xcarchive \
  archive

# Export IPA (需要 ExportOptions.plist)
xcodebuild \
  -exportArchive \
  -archivePath ios/build/BodyDataApp.xcarchive \
  -exportPath ios/build/export \
  -exportOptionsPlist ios/ExportOptions.plist
```

> `ExportOptions.plist` 需要手动创建，指定 method (`app-store` / `ad-hoc` / `development`)、teamID、provisioningProfiles 等。

---

## 常见问题

**Q: gradlew assembleRelease 报错 "Could not find tools.jar"**
> 检查 JAVA_HOME 是否指向 JDK 17（不是 JRE），并确保 `java -version` 输出正确。

**Q: 构建时提示 SDK 平台或 build-tools 缺失**
> 打开 Android Studio → SDK Manager → SDK Platforms，安装 Android 14 (API 34)；SDK Tools 安装 Android SDK Build-Tools 34.x。

**Q: pod install 报错找不到某依赖**
> 先在项目根执行 `npm install`，再 `cd ios && pod install --repo-update`。

**Q: iOS Archive 时签名错误**
> 检查 Bundle ID 是否已在 Apple Developer 后台注册，并确保 Provisioning Profile 类型匹配（Development / Distribution）。
