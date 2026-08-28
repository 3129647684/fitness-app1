// Web 平台 mock：react-native/asset-registry 在 web 上不存在
// @react-navigation/elements 需要此模块加载图片资源
const AssetRegistry: any = {
  registerAsset: (asset: any) => asset,
  getAssetByID: (assetId: any) => assetId,
};

export default AssetRegistry;