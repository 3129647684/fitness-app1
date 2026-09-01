const { withAndroidManifest } = require('@expo/config-plugins');

function withAndroidCleartext(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
}

module.exports = withAndroidCleartext;